import React, { useState, useEffect } from 'react';
import { store } from '../../services/store';
import { AuctionSession } from '../../types';
import {
  Gavel,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  Flame,
  ArrowRightCircle,
  Eye,
  Users,
  Clock,
  Radio,
  Sparkles,
  Edit3
} from 'lucide-react';
import { NextLotModal } from '../room/NextLotModal';

interface AuctioneerPrivateConsoleProps {
  session: AuctionSession;
  onOpenLiveRoom?: (session: AuctionSession) => void;
  onExit?: () => void;
}

interface PaddleInfo {
  number: string;
  name: string;
  location: string;
  isBroker?: boolean;
}

const OFFICIAL_PADDLES: PaddleInfo[] = [
  { number: 'Paleta #101', name: 'Broker Autorizado (Representante)', location: 'Miami, FL', isBroker: true },
  { number: 'Paleta #108', name: 'AutoExport Dallas LLC', location: 'Dallas, TX' },
  { number: 'Paleta #214', name: 'Pacific Salvage Auctions', location: 'Los Angeles, CA' },
  { number: 'Paleta #305', name: 'Global Fleet Buyers', location: 'Atlanta, GA' },
  { number: 'Paleta #412', name: 'Buckeye Motor Exchange', location: 'Columbus, OH' },
  { number: 'Paleta #519', name: 'Lone Star Salvage Group', location: 'Houston, TX' },
  { number: 'Paleta #623', name: 'Midwest Premier Liquidation', location: 'Chicago, IL' },
];

export const AuctioneerPrivateConsole: React.FC<AuctioneerPrivateConsoleProps> = ({
  session: initialSession,
}) => {
  const [session, setSession] = useState<AuctionSession>(initialSession);
  const [bids, setBids] = useState<any[]>([]);
  const [selectedPaddle, setSelectedPaddle] = useState<string>('Paleta #108');
  const [bidAmountInput, setBidAmountInput] = useState<string>('5250');
  const [isSubmittingBid, setIsSubmittingBid] = useState<boolean>(false);
  const [activeCall, setActiveCall] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isNextLotModalOpen, setIsNextLotModalOpen] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [lang, setLang] = useState<'en' | 'es'>('en');
  const [isEditingBasePrice, setIsEditingBasePrice] = useState<boolean>(false);
  const [directPriceInput, setDirectPriceInput] = useState<string>('5000');

  // Sincronización continua de datos en tiempo real
  const syncSessionData = async () => {
    try {
      const data = await store.fetchServerSession(session.id || 'ses-live-001', { isAuctioneer: true });
      if (data && data.session) {
        setSession((prev) => ({
          ...prev,
          ...data.session,
          current_price: Number(data.session.current_price ?? data.session.currentPrice ?? 5000),
          starting_price: Number(data.session.starting_price ?? data.session.startingPrice ?? 5000),
          client_max_budget: Number(data.session.client_max_budget ?? data.session.clientMaxBudget ?? 7500),
        }));
      }
      if (data && data.bids) {
        setBids(data.bids);
      }
    } catch {
      // Ignorar caídas momentáneas
    }
  };

  useEffect(() => {
    syncSessionData();
    const interval = setInterval(syncSessionData, 1000);
    const unsub = store.subscribe(syncSessionData);
    return () => {
      clearInterval(interval);
      unsub();
    };
  }, [session.id]);

  // Mantener el importe sugerido un paso adelante
  useEffect(() => {
    const curr = Number(session.current_price || (session as any).currentPrice || 5000);
    const inc = Number(session.bid_increment || (session as any).minIncrement || 250);
    setBidAmountInput(String(curr + inc));
  }, [session.current_price]);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  // Guardar precio editado directamente
  const handleSaveDirectPrice = async () => {
    const num = parseInt(directPriceInput.replace(/[^0-9]/g, ''));
    if (!num || num <= 0) {
      showFeedback('Introduce un precio válido', 'error');
      return;
    }
    const res = await store.updateStartingPrice(session.id, num);
    if (res.success) {
      showFeedback(`✓ Precio base fijado a $${num.toLocaleString()} USD`);
      setIsEditingBasePrice(false);
      await syncSessionData();
    } else {
      showFeedback(res.error || 'Error al actualizar precio', 'error');
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // 1. EJECUTAR OFERTA MANUAL CON LA PALETA SELECCIONADA
  const handleSendManualBid = async () => {
    const amount = Number(bidAmountInput);
    if (!amount || isNaN(amount) || amount <= 0) {
      showFeedback('Por favor introduce un importe de oferta válido', 'error');
      return;
    }

    setIsSubmittingBid(true);
    const res = await store.submitManualBid(session.id, selectedPaddle, amount);
    setIsSubmittingBid(false);

    if (res.success) {
      showFeedback(`✓ Oferta de $${amount.toLocaleString()} enviada exitosamente con ${selectedPaddle}`);
      await syncSessionData();
      // Alternar paleta seleccionada para facilitar el siguiente movimiento
      if (selectedPaddle === 'Paleta #101') {
        setSelectedPaddle('Paleta #108');
      } else {
        setSelectedPaddle('Paleta #101');
      }
    } else {
      showFeedback(res.error || 'Error al procesar la oferta', 'error');
    }
  };

  // 2. INCREMENTOS RÁPIDOS
  const applyIncrement = (incrementValue: number) => {
    const curr = Number(bidAmountInput) || Number(session.current_price || 5000);
    setBidAmountInput(String(curr + incrementValue));
  };

  // 3. LLAMADAS DEL SUBASTADOR (GOING ONCE, GOING TWICE, FAIR WARNING)
  const handleAuctioneerCall = async (callType: 'going_once' | 'going_twice' | 'fair_warning' | 'clear') => {
    setActiveCall(callType === 'clear' ? null : callType);
    await store.sendAuctioneerCall(session.id, callType);
    if (callType !== 'clear') {
      showFeedback(`📢 Aviso emitido a la sala: ${callType.toUpperCase().replace('_', ' ')}`);
    }
  };

  // 4. ADJUDICACIÓN MANUAL (SOLD / UNSOLD)
  const handleAdjudicate = async (decision: 'sold' | 'unsold') => {
    const winner = (session as any).currentWinnerPaddle || session.current_bidder_name || 'Sin postor';
    const price = Number(session.current_price || 5000);
    
    if (decision === 'sold') {
      const confirmSold = window.confirm(`¿Confirmas adjudicar el lote (SOLD) a ${winner} por $${price.toLocaleString()} USD?`);
      if (!confirmSold) return;
    }

    await store.adjudicateAuction(session.id, decision);
    showFeedback(decision === 'sold' ? `🔨 Lote ADJUDICADO a ${winner}!` : '⛔ Lote marcado como NO VENDIDO (UNSOLD)');
    await syncSessionData();
  };

  // Enlaces de acceso
  const origin = window.location.origin;
  const basePath = window.location.pathname.replace(/\/$/, '');
  const publicRoomUrl = `${origin}${basePath}/#/sala/${session.room_token || 'copart-live-m729k1'}`;
  const brokerUrl = `${origin}${basePath}/#/sala/${session.room_token || 'copart-live-m729k1'}?broker=${session.broker_access_token || 'bdr_broker_m729k1'}`;
  const buyerUrl = `${origin}${basePath}/#/sala/${session.room_token || 'copart-live-m729k1'}?cliente=${session.buyer_access_token || 'bdr_buyer_m729k1'}`;

  const currentPrice = Number(session.current_price ?? (session as any).currentPrice ?? 5000);
  const currentLeader = (session as any).currentWinnerPaddle || 'Esperando apertura';

  return (
    <div className="min-h-screen bg-[#050914] text-slate-100 flex flex-col font-sans select-none">
      {/* ========================================================================= */}
      {/* 1. BARRA SUPERIOR EJECUTIVA (HEADER ERGONÓMICO) */}
      {/* ========================================================================= */}
      <header className="bg-[#081224] border-b border-amber-500/40 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-amber-500 text-slate-950 px-2.5 py-1 rounded font-black text-xs uppercase tracking-wider shadow">
            <Gavel className="w-4 h-4" />
            <span>PANTALLA 2 • CONSOLA PRIVADA DEL SUBASTADOR</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">LOTE #{(session as any).lot_number || (session as any).lotNumber || session.vehicle_snapshot?.lot_number || '48291032'}</span>
            <span className="text-slate-600">•</span>
            <span className="text-white font-bold truncate max-w-xs">
              {(session as any).year || session.vehicle_snapshot?.year || 2023} {(session as any).brand || session.vehicle_snapshot?.brand || 'Ford'} {(session as any).model || session.vehicle_snapshot?.model || 'Mustang GT'}
            </span>
          </div>
        </div>

        {/* Estado en vivo + Indicadores de Red */}
        <div className="flex items-center gap-3">
          {/* Indicador de conexión con Backend */}
          <button
            type="button"
            onClick={() => {
              const current = store.getServerUrl();
              const newUrl = window.prompt('URL de conexión del Backend (Servidor/Túnel):', current);
              if (newUrl && newUrl.trim() && newUrl.trim() !== current) {
                store.setCustomBackendUrl(newUrl.trim());
              }
            }}
            title="Clic para ver o cambiar la URL del servidor backend"
            className="flex items-center gap-1.5 text-[10px] font-mono font-bold bg-[#060b17] hover:bg-slate-800 px-2.5 py-1 rounded border border-emerald-500/40 text-emerald-300 transition"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>BACKEND EN LÍNEA</span>
          </button>

          <span className={`px-2.5 py-0.5 rounded text-[11px] font-black uppercase tracking-wider ${
            session.status === 'open' || session.status === 'bidding'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500 animate-pulse'
              : session.status === 'paused'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500'
              : session.status === 'sold'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}>
            ESTADO: {session.status}
          </span>

          <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-[#060b17] px-2.5 py-1 rounded border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono font-bold text-amber-300 text-sm">
              {session.time_remaining_seconds ?? 10}s
            </span>
          </div>

          {/* Enlace rápido para ver la Sala Pública en Vivo */}
          <a
            href={publicRoomUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded text-xs flex items-center gap-1.5 transition shadow"
          >
            <span>Ver Sala en Vivo (Pública)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* FEEDBACK TEMPORAL NOTIFICACIÓN */}
      {feedbackMessage && (
        <div className={`px-4 py-2 text-center text-xs font-bold transition-all ${
          feedbackMessage.type === 'error' ? 'bg-rose-950 border-b border-rose-600 text-rose-200' : 'bg-emerald-950 border-b border-emerald-600 text-emerald-200'
        }`}>
          {feedbackMessage.text}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CUADRÍCULA PRINCIPAL DE TRABAJO (1 SOLA VISTA - SIN SCROLL) */}
      {/* ========================================================================= */}
      <main className="flex-1 p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-3 max-w-[1700px] w-full mx-auto">
        
        {/* ----------------------------------------------------------------------- */}
        {/* COLUMNA 1: SELECTOR DE LAS 7 PALETAS DISPONIBLES (4 COLSPAN) */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-4 bg-[#081224] rounded-xl border border-slate-800 p-3 flex flex-col justify-between shadow-2xl">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-400" />
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-200">
                  1. SELECCIONAR PALETA ({OFFICIAL_PADDLES.length})
                </h2>
              </div>
              <span className="text-[10px] text-slate-400">Clic para activar postor</span>
            </div>

            <div className="space-y-1.5">
              {OFFICIAL_PADDLES.map((p) => {
                const isSelected = selectedPaddle === p.number;
                const isLeading = (session as any).currentWinnerPaddle === p.number;

                return (
                  <button
                    key={p.number}
                    type="button"
                    onClick={() => setSelectedPaddle(p.number)}
                    className={`w-full text-left p-2.5 rounded-lg border transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/50 shadow-lg'
                        : isLeading
                        ? 'bg-emerald-950/40 border-emerald-500/60 hover:border-emerald-400'
                        : 'bg-[#050a16] border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border ${
                        isSelected ? 'bg-amber-400 border-amber-300' : 'border-slate-600 bg-transparent'
                      }`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-black text-sm ${isSelected ? 'text-amber-300' : 'text-white'}`}>
                            {p.number}
                          </span>
                          {p.isBroker && (
                            <span className="bg-blue-600/30 text-blue-300 border border-blue-500/40 text-[9px] px-1.5 py-0.2 rounded font-black uppercase">
                              BROKER REAL
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">{p.name}</p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-[10px] text-slate-500 font-mono block">{p.location}</span>
                      {isLeading && (
                        <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">
                          ★ LÍDER
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Resumen del postor seleccionado */}
          <div className="mt-3 bg-[#050a16] p-2.5 rounded-lg border border-amber-500/30 text-xs flex items-center justify-between">
            <span className="text-slate-400">Postor activo para la próxima oferta:</span>
            <span className="font-mono font-black text-amber-400">{selectedPaddle}</span>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* COLUMNA 2: IMPORTE LIBRE, INCREMENTOS Y BOTÓN DE DISPARO (4 COLSPAN) */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-4 bg-[#081224] rounded-xl border border-slate-800 p-3 flex flex-col justify-between shadow-2xl">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-emerald-400" />
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-200">
                  2. IMPORTE LIBRE Y ENVÍO DE OFERTA
                </h2>
              </div>
              <span className="text-[10px] text-slate-400">Tú defines el número exacto</span>
            </div>

            {/* PRECIO ACTUAL Y LÍDER ACTUAL */}
            <div className="bg-[#050a16] p-3 rounded-lg border border-slate-800 text-center mb-3">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  PRECIO VIGENTE EN SALA PÚBLICA
                </span>
                <span className="text-[10px] text-amber-400 font-mono">
                  {isEditingBasePrice ? 'Modo edición' : 'En vivo'}
                </span>
              </div>

              {isEditingBasePrice ? (
                <div className="flex items-center justify-center gap-2 my-1">
                  <span className="text-2xl font-black font-mono text-amber-400">$</span>
                  <input
                    type="number"
                    value={directPriceInput}
                    onChange={(e) => setDirectPriceInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveDirectPrice()}
                    autoFocus
                    className="w-36 bg-[#030712] border-2 border-amber-400 text-white font-mono font-black text-2xl py-1 px-2 rounded-lg text-center focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSaveDirectPrice}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3 py-1.5 rounded text-xs transition"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingBasePrice(false)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-2 py-1.5 rounded text-xs transition"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 my-0.5">
                  <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-400">
                    ${currentPrice.toLocaleString()} <span className="text-sm font-bold text-slate-500">USD</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDirectPriceInput(String(currentPrice));
                      setIsEditingBasePrice(true);
                    }}
                    title="Hacer clic para editar directamente el precio base"
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-amber-500 hover:text-slate-950 text-slate-400 transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="text-xs text-slate-300 flex items-center justify-center gap-1.5">
                <span className="text-slate-500">Líder actual:</span>
                <strong className="text-amber-300 font-mono">{currentLeader}</strong>
              </div>
            </div>

            {/* CAMPO DE IMPORTE LIBRE */}
            <div className="mb-3">
              <label className="text-[11px] text-slate-300 font-bold uppercase block mb-1">
                Escribe cualquier cantidad a ofertar:
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-emerald-400 font-bold text-lg">$</span>
                <input
                  type="number"
                  value={bidAmountInput}
                  onChange={(e) => setBidAmountInput(e.target.value)}
                  placeholder="Ej. 5250"
                  className="w-full bg-[#050a16] border-2 border-emerald-500 focus:border-emerald-400 text-white font-mono font-black text-2xl pl-8 pr-3 py-2 rounded-lg focus:outline-none shadow-inner"
                />
              </div>
            </div>

            {/* BOTONES DE INCREMENTOS RÁPIDOS COMPLEMENTARIOS */}
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1.5">
                Sumar incrementos rápidos:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => applyIncrement(50)}
                  className="bg-[#050a16] hover:bg-slate-800 text-slate-200 font-bold py-2 rounded border border-slate-700 text-xs transition active:scale-95"
                >
                  +$50
                </button>
                <button
                  type="button"
                  onClick={() => applyIncrement(100)}
                  className="bg-[#050a16] hover:bg-slate-800 text-slate-200 font-bold py-2 rounded border border-slate-700 text-xs transition active:scale-95"
                >
                  +$100
                </button>
                <button
                  type="button"
                  onClick={() => applyIncrement(250)}
                  className="bg-[#050a16] hover:bg-slate-800 text-emerald-300 font-bold py-2 rounded border border-slate-700 text-xs transition active:scale-95"
                >
                  +$250
                </button>
                <button
                  type="button"
                  onClick={() => applyIncrement(500)}
                  className="bg-[#050a16] hover:bg-slate-800 text-amber-300 font-bold py-2 rounded border border-slate-700 text-xs transition active:scale-95"
                >
                  +$500
                </button>
                <button
                  type="button"
                  onClick={() => applyIncrement(1000)}
                  className="bg-[#050a16] hover:bg-slate-800 text-amber-400 font-bold py-2 rounded border border-slate-700 text-xs transition active:scale-95"
                >
                  +$1,000
                </button>
                <button
                  type="button"
                  onClick={() => applyIncrement(5000)}
                  className="bg-[#050a16] hover:bg-slate-800 text-rose-300 font-bold py-2 rounded border border-slate-700 text-xs transition active:scale-95"
                >
                  +$5,000
                </button>
              </div>
            </div>
          </div>

          {/* BOTÓN GIGANTE [ENVIAR OFERTA] */}
          <div className="mt-4 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleSendManualBid}
              disabled={isSubmittingBid}
              className="w-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-black py-4 px-4 rounded-xl shadow-2xl text-base sm:text-lg flex flex-col items-center justify-center transition active:scale-95 border-b-4 border-emerald-800"
            >
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-slate-950" />
                <span>ENVIAR OFERTA A SALA EN VIVO</span>
              </div>
              <span className="text-xs font-mono font-black text-slate-950/80 mt-0.5">
                ${Number(bidAmountInput || 0).toLocaleString()} USD • con {selectedPaddle}
              </span>
            </button>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* COLUMNA 3: RITMO, LLAMADAS DEL MARTILLO Y CIERRE SOBERANO (4 COLSPAN) */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-4 bg-[#081224] rounded-xl border border-slate-800 p-3 flex flex-col justify-between shadow-2xl">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
              <div className="flex items-center gap-1.5">
                <Gavel className="w-4 h-4 text-amber-400" />
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-200">
                  3. RITMO, AVISOS Y MARTILLO
                </h2>
              </div>
              <span className="text-[10px] text-slate-400">Control de dirección</span>
            </div>

            {/* SECCIÓN A: RITMO DE LA SALA */}
            <div className="space-y-1.5 mb-3">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                Ritmo y Conteo:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => store.serverStartAuction(session.id)}
                  className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition shadow"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Abrir / Iniciar</span>
                </button>

                {session.status === 'paused' ? (
                  <button
                    type="button"
                    onClick={() => store.serverResumeAuction(session.id)}
                    className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition shadow"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Reanudar</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => store.serverPauseAuction(session.id)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition shadow"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pausar</span>
                  </button>
                )}
              </div>
            </div>

            {/* SECCIÓN B: LLAMADAS DEL SUBASTADOR (SECUENCIA DE CIERRE) */}
            <div className="space-y-1.5 mb-3">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                Llamadas Oficiales del Martillo:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAuctioneerCall('going_once')}
                  className={`py-2 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center border ${
                    activeCall === 'going_once'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-300'
                      : 'bg-[#050a16] text-amber-300 border-amber-600/50 hover:bg-amber-950/40'
                  }`}
                >
                  GOING ONCE
                </button>
                <button
                  type="button"
                  onClick={() => handleAuctioneerCall('going_twice')}
                  className={`py-2 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center border ${
                    activeCall === 'going_twice'
                      ? 'bg-orange-500 text-slate-950 border-orange-400 ring-2 ring-orange-300'
                      : 'bg-[#050a16] text-orange-400 border-orange-600/50 hover:bg-orange-950/40'
                  }`}
                >
                  GOING TWICE
                </button>
                <button
                  type="button"
                  onClick={() => handleAuctioneerCall('fair_warning')}
                  className={`py-2 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center border ${
                    activeCall === 'fair_warning'
                      ? 'bg-rose-500 text-white border-rose-400 ring-2 ring-rose-300'
                      : 'bg-[#050a16] text-rose-400 border-rose-600/50 hover:bg-rose-950/40'
                  }`}
                >
                  FAIR WARNING
                </button>
              </div>
            </div>

            {/* SECCIÓN C: MARTILLAZO DEFINITIVO SOBERANO */}
            <div className="space-y-1.5 mb-3">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                Resolución del Lote (Tú decides el desenlace):
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleAdjudicate('sold')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 px-3 rounded-xl text-xs flex flex-col items-center justify-center gap-1 shadow-lg transition active:scale-95 border-b-4 border-emerald-800"
                >
                  <div className="flex items-center gap-1.5">
                    <Gavel className="w-4 h-4" />
                    <span>SOLD / MARTILLO</span>
                  </div>
                  <span className="text-[9.5px] font-normal opacity-90 truncate max-w-[140px]">
                    Vender a: {currentLeader}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAdjudicate('unsold')}
                  className="bg-rose-900 hover:bg-rose-800 text-rose-100 font-bold py-3 px-3 rounded-xl text-xs flex flex-col items-center justify-center gap-1 shadow-lg transition active:scale-95 border-b-4 border-rose-950"
                >
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>UNSOLD / NO VENDIDO</span>
                  </div>
                  <span className="text-[9.5px] font-normal opacity-80">
                    Retirar por reserva
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* GESTIÓN DE LOTES Y RESETEO */}
          <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsNextLotModalOpen(true)}
              className="flex-1 bg-blue-700 hover:bg-blue-600 text-white font-bold py-2.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition shadow"
            >
              <ArrowRightCircle className="w-4 h-4" />
              <span>Siguiente Lote / Cliente</span>
            </button>

            <button
              type="button"
              onClick={() => store.serverResetAuction(session.id)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1 transition"
              title="Resetear lote inicial"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          </div>
        </div>

      </main>

      {/* ========================================================================= */}
      {/* 3. HISTORIAL DE PUJAS EN VIVO Y ENLACES (FRANJA INFERIOR) */}
      {/* ========================================================================= */}
      <footer className="bg-[#070e1c] border-t border-slate-800/80 p-3 px-4">
        <div className="max-w-[1700px] w-full mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          
          {/* Historial breve en vivo */}
          <div className="flex items-center gap-2 overflow-x-auto max-w-2xl py-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase whitespace-nowrap">ÚLTIMAS PUJAS:</span>
            {bids.length === 0 ? (
              <span className="text-slate-500 text-xs italic">Aún no hay ofertas registradas en este lote</span>
            ) : (
              bids.slice(0, 4).map((b) => (
                <div key={b.id} className="bg-[#050a16] border border-slate-800 px-2.5 py-1 rounded text-xs flex items-center gap-1.5 whitespace-nowrap">
                  <span className="font-mono text-amber-300 font-bold">{b.paddle_number || b.paddleNumber}</span>
                  <span className="font-mono text-emerald-400 font-black">${Number(b.amount).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>

          {/* Enlaces de Copia Rápida */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => copyToClipboard(brokerUrl, 'broker')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded text-xs flex items-center gap-1 transition"
            >
              {copiedKey === 'broker' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Link Broker</span>
            </button>

            <button
              onClick={() => copyToClipboard(buyerUrl, 'buyer')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded text-xs flex items-center gap-1 transition"
            >
              {copiedKey === 'buyer' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Link Cliente</span>
            </button>
          </div>

        </div>
      </footer>

      {/* MODAL PARA PASAR AL SIGUIENTE LOTE */}
      {isNextLotModalOpen && (
        <NextLotModal
          isOpen={isNextLotModalOpen}
          sessionId={session.id}
          onClose={() => setIsNextLotModalOpen(false)}
          onSuccess={() => {
            setIsNextLotModalOpen(false);
            syncSessionData();
          }}
        />
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { store } from '../../services/store';
import { AuctionSession } from '../../types';
import { sounds } from '../../lib/soundEffects';
import confetti from 'canvas-confetti';
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
  Edit3,
  Car,
  Settings,
  Sliders,
  Send,
  X
} from 'lucide-react';
import { NextLotModal } from '../room/NextLotModal';
import { CopartLogo } from '../common/CopartLogo';
import { VehiclesView } from './VehiclesView';

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
  const [isVehiclesModalOpen, setIsVehiclesModalOpen] = useState<boolean>(false);
  const [isParamsModalOpen, setIsParamsModalOpen] = useState<boolean>(false);
  const [brokerOnline, setBrokerOnline] = useState<boolean>(false);
  const [buyerOnline, setBuyerOnline] = useState<boolean>(false);
  const [lotStartingPrice, setLotStartingPrice] = useState<number>(5000);
  const [lotMinIncrement, setLotMinIncrement] = useState<number>(250);
  const [lotReservePrice, setLotReservePrice] = useState<number>(12000);
  const [lotClientBudget, setLotClientBudget] = useState<number>(7500);
  const [lotBrokerName, setLotBrokerName] = useState<string>('Broker Autorizado (Representante)');
  const [lotBuyerName, setLotBuyerName] = useState<string>('Carlos Mendoza (Comprador)');
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [lang, setLang] = useState<'en' | 'es'>('en');
  const [isEditingBasePrice, setIsEditingBasePrice] = useState<boolean>(false);
  const [directPriceInput, setDirectPriceInput] = useState<string>('5000');
  const [viewersCount, setViewersCount] = useState<number>(14);
  const [announcementText, setAnnouncementText] = useState<string>('');
  const [isSendingAnnouncement, setIsSendingAnnouncement] = useState<boolean>(false);

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
        setLotStartingPrice(Number(data.session.starting_price ?? data.session.startingPrice ?? 5000));
        setLotMinIncrement(Number(data.session.min_increment ?? data.session.minIncrement ?? 250));
        setLotReservePrice(Number(data.session.reserve_price ?? data.session.reservePrice ?? 12000));
        setLotClientBudget(Number(data.session.client_max_budget ?? data.session.clientMaxBudget ?? 7500));
        if (data.session.broker_name || data.session.brokerName) {
          setLotBrokerName(data.session.broker_name || data.session.brokerName);
        }
        if (data.session.buyer_name || data.session.buyerName) {
          setLotBuyerName(data.session.buyer_name || data.session.buyerName);
        }
        if (data.session.viewersCount !== undefined) {
          setViewersCount(Number(data.session.viewersCount));
        }
      }
      if (data && data.presence) {
        setBrokerOnline(Boolean(data.presence.brokerConnected));
        setBuyerOnline(Boolean(data.presence.buyerConnected));
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

  // Guardar todos los parámetros del lote (Base, Incremento, Reserva, Presupuesto)
  const handleSaveLotParameters = async () => {
    const res = await store.updateLotParameters(session.id, {
      startingPrice: Number(lotStartingPrice),
      minIncrement: Number(lotMinIncrement),
      reservePrice: Number(lotReservePrice),
      clientMaxBudget: Number(lotClientBudget),
      brokerName: lotBrokerName,
      buyerName: lotBuyerName,
    });
    if (res.success) {
      showFeedback('✓ Parámetros del lote actualizados inmediatamente en sala');
      setIsParamsModalOpen(false);
      await syncSessionData();
    } else {
      showFeedback(res.error || 'Error al actualizar parámetros', 'error');
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

    const targetId = session.id || 'ses-live-001';

    // Optimistic UI feedback instantáneo: actualiza el panel inmediatamente sin esperar la red
    setSession((prev) => ({
      ...prev,
      status: 'open',
      current_price: amount,
      currentPrice: amount,
      current_winner_paddle: selectedPaddle,
      currentWinnerPaddle: selectedPaddle,
      time_remaining_seconds: 10,
    }));
    try { sounds.playBidPing(); } catch {}

    setIsSubmittingBid(true);
    // Si la sala no estaba abierta, aseguramos su apertura inmediata
    if (session.status !== 'open') {
      await store.serverStartAuction(targetId);
    }
    const res = await store.submitManualBid(targetId, selectedPaddle, amount);
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

  // CONTROL DE ESPECTADORES EN SALA (SIMULACIÓN Y PRESENCIA REAL)
  const handleUpdateViewers = async (newCount: number) => {
    const finalCount = Math.max(1, newCount);
    setViewersCount(finalCount);
    await store.setViewersCount(session.id, finalCount);
    showFeedback(`👥 Espectadores en sala ajustados a ${finalCount}`);
  };

  // EMISIÓN DE AVISOS EN EL CINTILLO DE LA SALA PÚBLICA
  const handleSendAnnouncement = async (textToSend?: string) => {
    const text = (textToSend || announcementText).trim();
    if (!text) return;
    setIsSendingAnnouncement(true);
    await store.sendAnnouncement(session.id, text);
    setIsSendingAnnouncement(false);
    showFeedback(`📢 Aviso proyectado en sala: "${text}"`);
    setAnnouncementText('');
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
      try {
        sounds.playSoldFanfare();
        confetti({
          particleCount: 160,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#22c55e', '#eab308', '#3b82f6', '#ec4899', '#ffffff']
        });
      } catch {}
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
  const currentLeader = (bids && bids.length > 0 && bids[0].paddleNumber && bids[0].paddleNumber !== 'N/A')
    ? bids[0].paddleNumber
    : ((session as any).current_winner_paddle && (session as any).current_winner_paddle !== 'N/A'
        ? (session as any).current_winner_paddle
        : ((session as any).currentWinnerPaddle && (session as any).currentWinnerPaddle !== 'N/A'
            ? (session as any).currentWinnerPaddle
            : 'Esperando apertura'));

  return (
    <div className="min-h-screen bg-[#050914] text-slate-100 flex flex-col font-sans select-none">
      {/* ========================================================================= */}
      {/* 1. BARRA SUPERIOR EJECUTIVA (HEADER ERGONÓMICO) */}
      {/* ========================================================================= */}
      <header className="bg-[#081224] border-b border-amber-500/40 px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <CopartLogo size="sm" showSubtitle={false} className="hidden md:inline-flex" />

          <div className="flex items-center gap-2 bg-amber-500 text-slate-950 px-2.5 py-1 rounded font-black text-xs uppercase tracking-wider shadow">
            <Gavel className="w-4 h-4" />
            <span>PANTALLA 2 • CONSOLA PRIVADA</span>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs">
            <span className="text-slate-400">LOTE #{(session as any).lot_number || (session as any).lotNumber || session.vehicle_snapshot?.lot_number || '48291032'}</span>
            <span className="text-slate-600">•</span>
            <span className="text-white font-bold truncate max-w-xs">
              {(session as any).year || session.vehicle_snapshot?.year || 2023} {(session as any).brand || session.vehicle_snapshot?.brand || 'Ford'} {(session as any).model || session.vehicle_snapshot?.model || 'Mustang GT'}
            </span>
          </div>
        </div>

        {/* Presencia de Participantes Reales */}
        <div className="flex items-center gap-2 text-[11px] font-mono">
          <div className={`px-2 py-0.5 rounded border flex items-center gap-1.5 ${
            brokerOnline ? 'bg-emerald-950/60 text-emerald-300 border-emerald-600/50' : 'bg-slate-900/60 text-slate-400 border-slate-800'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${brokerOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
            <span>Broker #101: {brokerOnline ? 'En sala' : 'Offline'}</span>
          </div>
          <div className={`px-2 py-0.5 rounded border flex items-center gap-1.5 ${
            buyerOnline ? 'bg-emerald-950/60 text-emerald-300 border-emerald-600/50' : 'bg-slate-900/60 text-slate-400 border-slate-800'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${buyerOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
            <span>Cliente: {buyerOnline ? 'En sala' : 'Offline'}</span>
          </div>
        </div>

        {/* Acciones de Cabecera: Vehículos, Parámetros y Ver Sala */}
        <div className="flex items-center gap-2">
          {/* Botón Administración Completa de Vehículos y Fotos */}
          <button
            type="button"
            onClick={() => setIsVehiclesModalOpen(true)}
            className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-black px-2.5 py-1.5 rounded text-xs flex items-center gap-1.5 transition shadow"
            title="Subir vehículos nuevos, fotos y editar catálogo"
          >
            <Car className="w-3.5 h-3.5" />
            <span>Vehículos y Fotos</span>
          </button>

          {/* Botón Parámetros del Lote */}
          <button
            type="button"
            onClick={() => setIsParamsModalOpen(true)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-2.5 py-1.5 rounded text-xs flex items-center gap-1.5 border border-slate-700 transition"
            title="Editar valores de referencia, precio base, incrementos y presupuesto"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Parámetros</span>
          </button>

          {/* Estado de conexión con Backend */}
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
            className="flex items-center gap-1.5 text-[10px] font-mono font-bold bg-[#060b17] hover:bg-slate-800 px-2 py-1.5 rounded border border-emerald-500/40 text-emerald-300 transition"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">CONECTADO</span>
          </button>

          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
            session.status === 'open' || session.status === 'bidding'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500 animate-pulse'
              : session.status === 'paused'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500'
              : session.status === 'sold'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}>
            {session.status}
          </span>

          <div className="flex items-center gap-1 text-xs text-slate-300 bg-[#060b17] px-2 py-1 rounded border border-slate-800">
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
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-2.5 py-1.5 rounded text-xs flex items-center gap-1 transition shadow"
          >
            <span>Ver Sala</span>
            <ExternalLink className="w-3 h-3" />
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
        <div className="lg:col-span-4 bg-[#081224] rounded-xl border border-slate-800 p-3 sm:p-4 flex flex-col justify-between shadow-2xl">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-100">
                  1. SELECCIONAR PALETA ({OFFICIAL_PADDLES.length})
                </h2>
              </div>
              <span className="text-xs text-slate-400 font-medium">Clic para activar postor</span>
            </div>

            <div className="space-y-2">
              {OFFICIAL_PADDLES.map((p) => {
                const isSelected = selectedPaddle === p.number;
                const isLeading = (session as any).currentWinnerPaddle === p.number;

                return (
                  <button
                    key={p.number}
                    type="button"
                    onClick={() => setSelectedPaddle(p.number)}
                    className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/50 shadow-xl'
                        : isLeading
                        ? 'bg-emerald-950/50 border-emerald-500/70 hover:border-emerald-400'
                        : 'bg-[#050a16] border-slate-800 hover:bg-slate-800/70 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                        isSelected ? 'bg-amber-400 border-amber-300' : 'border-slate-600 bg-transparent'
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-slate-950" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-black text-base sm:text-lg ${isSelected ? 'text-amber-300' : 'text-white'}`}>
                            {p.number}
                          </span>
                          {p.isBroker && (
                            <span className="bg-blue-600/40 text-blue-300 border border-blue-400/50 text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-wide">
                              BROKER REAL
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-300 font-medium truncate mt-0.5">
                          {p.isBroker ? (lotBrokerName || session.broker_name || p.name) : p.name}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-xs text-slate-400 font-mono block">{p.location}</span>
                      {isLeading && (
                        <span className="text-[10px] bg-emerald-500/20 border border-emerald-500 text-emerald-300 font-black px-1.5 py-0.5 rounded uppercase tracking-wider inline-block mt-0.5">
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
          <div className="mt-3.5 bg-[#050a16] p-3 rounded-xl border border-amber-500/40 text-sm flex items-center justify-between shadow">
            <span className="text-slate-300 font-medium">Postor activo para la próxima oferta:</span>
            <span className="font-mono font-black text-amber-300 text-base">{selectedPaddle}</span>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* COLUMNA 2: IMPORTE LIBRE, INCREMENTOS Y BOTÓN DE DISPARO (4 COLSPAN) */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-4 bg-[#081224] rounded-xl border border-slate-800 p-3 sm:p-4 flex flex-col justify-between shadow-2xl">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-emerald-400" />
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-100">
                  2. IMPORTE LIBRE Y ENVÍO DE OFERTA
                </h2>
              </div>
              <span className="text-xs text-slate-400 font-medium">Tú defines el número exacto</span>
            </div>

            {/* PRECIO ACTUAL Y LÍDER ACTUAL */}
            <div className="bg-[#050a16] p-3.5 rounded-xl border border-slate-800 text-center mb-3.5 shadow-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">
                  PRECIO VIGENTE EN SALA PÚBLICA
                </span>
                <span className="text-xs text-amber-400 font-mono font-bold">
                  {isEditingBasePrice ? 'Modo edición' : 'En vivo'}
                </span>
              </div>

              {isEditingBasePrice ? (
                <div className="flex items-center justify-center gap-2 my-1.5">
                  <span className="text-3xl font-black font-mono text-amber-400">$</span>
                  <input
                    type="number"
                    value={directPriceInput}
                    onChange={(e) => setDirectPriceInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveDirectPrice()}
                    autoFocus
                    className="w-44 bg-[#030712] border-2 border-amber-400 text-white font-mono font-black text-3xl py-1 px-3 rounded-lg text-center focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSaveDirectPrice}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3.5 py-2 rounded text-xs uppercase tracking-wide transition shadow"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingBasePrice(false)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-2 rounded text-xs transition"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 my-1">
                  <div className="text-4xl sm:text-5xl font-black font-mono text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                    ${currentPrice.toLocaleString()} <span className="text-base font-bold text-slate-400">USD</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDirectPriceInput(String(currentPrice));
                      setIsEditingBasePrice(true);
                    }}
                    title="Hacer clic para editar directamente el precio base"
                    className="p-2 rounded-lg bg-slate-800/90 hover:bg-amber-500 hover:text-slate-950 text-slate-300 transition shadow"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="text-sm text-slate-300 flex items-center justify-center gap-2 mt-1">
                <span className="text-slate-400">Líder actual:</span>
                <strong className="text-amber-300 font-mono text-base font-black">{currentLeader}</strong>
              </div>
            </div>

            {/* CAMPO DE IMPORTE LIBRE */}
            <div className="mb-3.5">
              <label className="text-xs sm:text-sm text-slate-200 font-black uppercase tracking-wide block mb-1.5">
                Escribe cualquier cantidad a ofertar:
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-emerald-400 font-black text-2xl">$</span>
                <input
                  type="number"
                  value={bidAmountInput}
                  onChange={(e) => setBidAmountInput(e.target.value)}
                  placeholder="Ej. 5250"
                  className="w-full bg-[#050a16] border-2 border-emerald-500 focus:border-emerald-400 text-white font-mono font-black text-3xl sm:text-4xl pl-10 pr-4 py-2.5 rounded-xl focus:outline-none shadow-inner"
                />
              </div>
            </div>

            {/* BOTONES DE INCREMENTOS RÁPIDOS COMPLEMENTARIOS */}
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-bold block mb-2">
                Sumar incrementos rápidos:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => applyIncrement(50)}
                  className="bg-[#050a16] hover:bg-slate-800 text-slate-100 font-black py-2.5 sm:py-3 rounded-xl border border-slate-700 text-sm sm:text-base transition active:scale-95 shadow"
                >
                  +$50
                </button>
                <button
                  type="button"
                  onClick={() => applyIncrement(100)}
                  className="bg-[#050a16] hover:bg-slate-800 text-slate-100 font-black py-2.5 sm:py-3 rounded-xl border border-slate-700 text-sm sm:text-base transition active:scale-95 shadow"
                >
                  +$100
                </button>
                <button
                  type="button"
                  onClick={() => applyIncrement(250)}
                  className="bg-[#050a16] hover:bg-slate-800 text-emerald-300 font-black py-2.5 sm:py-3 rounded-xl border border-slate-700 text-sm sm:text-base transition active:scale-95 shadow"
                >
                  +$250
                </button>
                <button
                  type="button"
                  onClick={() => applyIncrement(500)}
                  className="bg-[#050a16] hover:bg-slate-800 text-amber-300 font-black py-2.5 sm:py-3 rounded-xl border border-slate-700 text-sm sm:text-base transition active:scale-95 shadow"
                >
                  +$500
                </button>
                <button
                  type="button"
                  onClick={() => applyIncrement(1000)}
                  className="bg-[#050a16] hover:bg-slate-800 text-amber-400 font-black py-2.5 sm:py-3 rounded-xl border border-slate-700 text-sm sm:text-base transition active:scale-95 shadow"
                >
                  +$1,000
                </button>
                <button
                  type="button"
                  onClick={() => applyIncrement(5000)}
                  className="bg-[#050a16] hover:bg-slate-800 text-rose-300 font-black py-2.5 sm:py-3 rounded-xl border border-slate-700 text-sm sm:text-base transition active:scale-95 shadow"
                >
                  +$5,000
                </button>
              </div>
            </div>
          </div>

          {/* BOTÓN GIGANTE [ENVIAR OFERTA] */}
          <div className="mt-4 pt-3.5 border-t border-slate-800">
            <button
              type="button"
              onClick={handleSendManualBid}
              disabled={isSubmittingBid}
              className="w-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-black py-5 px-4 rounded-2xl shadow-2xl text-lg sm:text-xl flex flex-col items-center justify-center transition active:scale-95 border-b-4 border-emerald-800"
            >
              <div className="flex items-center gap-2.5">
                <Flame className="w-6 h-6 text-slate-950" />
                <span>ENVIAR OFERTA A SALA EN VIVO</span>
              </div>
              <span className="text-sm font-mono font-black text-slate-950/85 mt-1">
                ${Number(bidAmountInput || 0).toLocaleString()} USD • con {selectedPaddle}
              </span>
            </button>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* COLUMNA 3: RITMO, LLAMADAS DEL MARTILLO Y CIERRE SOBERANO (4 COLSPAN) */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-4 bg-[#081224] rounded-xl border border-slate-800 p-3 sm:p-4 flex flex-col justify-between shadow-2xl">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <Gavel className="w-5 h-5 text-amber-400" />
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-100">
                  3. RITMO, AVISOS Y MARTILLO
                </h2>
              </div>
              <span className="text-xs text-slate-400 font-medium">Control de dirección</span>
            </div>

            {/* AVISO DE SALA EN ESPERA Y BOTÓN DE APERTURA RÁPIDA */}
            {session.status !== 'open' && (
              <div className="bg-emerald-950/70 border border-emerald-500/60 p-3 rounded-xl mb-3.5 shadow-lg flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-black text-emerald-300 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>SALA EN ESPERA DE APERTURA</span>
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5">Los clientes ven el lote en preparación</div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const targetId = session.id || 'ses-live-001';
                    setSession((prev) => ({ ...prev, status: 'open', time_remaining_seconds: 10 }));
                    try { sounds.playCountdownTick(1.2); } catch {}
                    showFeedback('🟢 SALA ABIERTA EN VIVO — Subasta iniciada');
                    await store.serverStartAuction(targetId);
                    await syncSessionData();
                  }}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2 rounded-lg text-xs sm:text-sm uppercase tracking-wider shadow transition active:scale-95"
                >
                  Abrir Sala
                </button>
              </div>
            )}

            {/* SECCIÓN A: RITMO DE LA SALA */}
            <div className="space-y-2 mb-3.5">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-bold block">
                Ritmo y Conteo:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const targetId = session.id || 'ses-live-001';
                    setSession((prev) => ({ ...prev, status: 'open', time_remaining_seconds: 10 }));
                    try { sounds.playCountdownTick(1.2); } catch {}
                    showFeedback('🟢 Subasta iniciada en vivo');
                    await store.serverStartAuction(targetId);
                    await syncSessionData();
                  }}
                  className="bg-emerald-700 hover:bg-emerald-600 text-white font-black py-3 px-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow active:scale-95"
                >
                  <Play className="w-4 h-4" />
                  <span>Abrir / Iniciar</span>
                </button>

                {session.status === 'paused' ? (
                  <button
                    type="button"
                    onClick={async () => {
                      const targetId = session.id || 'ses-live-001';
                      setSession((prev) => ({ ...prev, status: 'bidding' }));
                      showFeedback('▶ Subasta reanudada');
                      await store.serverResumeAuction(targetId);
                      await syncSessionData();
                    }}
                    className="bg-amber-600 hover:bg-amber-500 text-white font-black py-3 px-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow active:scale-95"
                  >
                    <Play className="w-4 h-4" />
                    <span>Reanudar</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      const targetId = session.id || 'ses-live-001';
                      setSession((prev) => ({ ...prev, status: 'paused' }));
                      showFeedback('⏸ Subasta en pausa');
                      await store.serverPauseAuction(targetId);
                      await syncSessionData();
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold py-3 px-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow active:scale-95"
                  >
                    <Pause className="w-4 h-4" />
                    <span>Pausar</span>
                  </button>
                )}
              </div>
            </div>

            {/* SECCIÓN B: LLAMADAS DEL SUBASTADOR (SECUENCIA DE CIERRE) */}
            <div className="space-y-2 mb-3.5">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-bold block">
                Llamadas Oficiales del Martillo:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleAuctioneerCall('going_once')}
                  className={`py-3 px-2 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center border shadow ${
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
                  className={`py-3 px-2 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center border shadow ${
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
                  className={`py-3 px-2 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center border shadow ${
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
            <div className="space-y-2 mb-3.5">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-bold block">
                Resolución del Lote (Tú decides el desenlace):
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleAdjudicate('sold')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 px-3 rounded-xl text-sm flex flex-col items-center justify-center gap-1 shadow-lg transition active:scale-95 border-b-4 border-emerald-800"
                >
                  <div className="flex items-center gap-2">
                    <Gavel className="w-5 h-5" />
                    <span>SOLD / MARTILLO</span>
                  </div>
                  <span className="text-xs font-normal opacity-90 truncate max-w-[160px]">
                    Vender a: {currentLeader}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAdjudicate('unsold')}
                  className="bg-rose-900 hover:bg-rose-800 text-rose-100 font-bold py-4 px-3 rounded-xl text-sm flex flex-col items-center justify-center gap-1 shadow-lg transition active:scale-95 border-b-4 border-rose-950"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span>UNSOLD / NO VENDIDO</span>
                  </div>
                  <span className="text-xs font-normal opacity-80">
                    Retirar por reserva
                  </span>
                </button>
              </div>
            </div>

            {/* SECCIÓN D: ESPECTADORES Y CINTILLO DE AVISOS EN VIVO */}
            <div className="space-y-2.5 mb-3.5 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 uppercase tracking-wider font-bold flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span>Espectadores en Sala ({viewersCount}):</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleUpdateViewers(viewersCount - 1)}
                    className="w-6 h-6 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-md text-sm font-black flex items-center justify-center transition shadow"
                    title="-1 espectador"
                  >
                    -
                  </button>
                  <span className="font-mono text-sm font-black text-blue-400 px-1">{viewersCount}</span>
                  <button
                    type="button"
                    onClick={() => handleUpdateViewers(viewersCount + 1)}
                    className="w-6 h-6 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-md text-sm font-black flex items-center justify-center transition shadow"
                    title="+1 espectador"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Botones de Presets de Espectadores */}
              <div className="grid grid-cols-4 gap-1.5 text-xs font-mono">
                {[8, 15, 28, 45].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => handleUpdateViewers(cnt)}
                    className={`py-1.5 rounded-lg border transition ${
                      viewersCount === cnt
                        ? 'bg-blue-600 text-white border-blue-400 font-black shadow'
                        : 'bg-[#050a16] text-slate-300 border-slate-800 hover:bg-slate-800 font-bold'
                    }`}
                  >
                    {cnt} en sala
                  </button>
                ))}
              </div>

              {/* Cintillo de Avisos en Vivo */}
              <div className="pt-2">
                <span className="text-xs text-slate-300 uppercase tracking-wider font-bold block mb-1.5 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>Cintillo de Avisos en Sala:</span>
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSendAnnouncement(); }}
                    placeholder="Ej. La subasta comenzará en breve..."
                    className="flex-1 bg-[#050a16] border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-amber-500 font-mono shadow-inner"
                  />
                  <button
                    type="button"
                    disabled={isSendingAnnouncement}
                    onClick={() => handleSendAnnouncement()}
                    className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-black px-3 py-2 rounded-lg text-xs sm:text-sm flex items-center gap-1.5 transition shadow"
                    title="Emitir aviso al cintillo de la sala pública"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar</span>
                  </button>
                </div>
                {/* Presets de avisos rápidos */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => handleSendAnnouncement('🔴 La subasta comenzará en breve • Lane A Live')}
                    className="text-xs bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 px-2 py-1 rounded-md transition font-medium"
                  >
                    Comenzará en breve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendAnnouncement('🚗 Inspección de lote abierta • Unidad verificada')}
                    className="text-xs bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 px-2 py-1 rounded-md transition font-medium"
                  >
                    Inspección abierta
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendAnnouncement('⏳ Últimos llamados • Oferte ahora o el lote será adjudicado')}
                    className="text-xs bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-900/40 px-2 py-1 rounded-md transition font-bold"
                  >
                    Últimos llamados
                  </button>
                </div>
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

      {/* MODAL PARA PARÁMETROS DEL LOTE EN VIVO */}
      {isParamsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-[#0b1323] border border-amber-500/50 rounded-2xl max-w-lg w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">PARÁMETROS DEL LOTE EN VIVO</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsParamsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Precio Inicial / Base ($ USD):</label>
                <input
                  type="number"
                  step="100"
                  value={lotStartingPrice}
                  onChange={(e) => setLotStartingPrice(Number(e.target.value) || 0)}
                  className="w-full bg-[#050a16] border border-slate-700 focus:border-amber-400 rounded-lg p-2 font-mono text-emerald-400 font-bold"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Incremento Mínimo ($ USD):</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[100, 250, 500, 1000].map((inc) => (
                    <button
                      key={inc}
                      type="button"
                      onClick={() => setLotMinIncrement(inc)}
                      className={`py-1.5 rounded font-mono font-bold border transition ${
                        lotMinIncrement === inc ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-800/80 text-slate-300 border-slate-700'
                      }`}
                    >
                      +${inc}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  step="50"
                  value={lotMinIncrement}
                  onChange={(e) => setLotMinIncrement(Number(e.target.value) || 0)}
                  className="w-full bg-[#050a16] border border-slate-700 focus:border-amber-400 rounded-lg p-2 font-mono text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Precio de Reserva ($ USD):</label>
                <input
                  type="number"
                  step="500"
                  value={lotReservePrice}
                  onChange={(e) => setLotReservePrice(Number(e.target.value) || 0)}
                  className="w-full bg-[#050a16] border border-slate-700 focus:border-amber-400 rounded-lg p-2 font-mono text-amber-300"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Presupuesto Máximo Autorizado del Cliente ($ USD):</label>
                <input
                  type="number"
                  step="250"
                  value={lotClientBudget}
                  onChange={(e) => setLotClientBudget(Number(e.target.value) || 0)}
                  className="w-full bg-[#050a16] border border-slate-700 focus:border-amber-400 rounded-lg p-2 font-mono text-blue-300 font-bold"
                />
              </div>

              <div className="pt-2 border-t border-slate-800">
                <label className="text-amber-300 font-bold block mb-1">Nombre Real del Broker / Representante (Paleta #101):</label>
                <input
                  type="text"
                  value={lotBrokerName}
                  onChange={(e) => setLotBrokerName(e.target.value)}
                  placeholder="Ej. Broker Juan Pérez o AutoBroker Miami"
                  className="w-full bg-[#050a16] border border-slate-700 focus:border-amber-400 rounded-lg p-2 font-sans text-white font-bold"
                />
              </div>

              <div>
                <label className="text-emerald-300 font-bold block mb-1">Nombre Real del Cliente / Comprador Asignado:</label>
                <input
                  type="text"
                  value={lotBuyerName}
                  onChange={(e) => setLotBuyerName(e.target.value)}
                  placeholder="Ej. Carlos Mendoza"
                  className="w-full bg-[#050a16] border border-slate-700 focus:border-amber-400 rounded-lg p-2 font-sans text-white font-bold"
                />
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsParamsModalOpen(false)}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveLotParameters}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-black transition shadow"
              >
                Aplicar Cambios a Sala en Vivo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA ADMINISTRACIÓN DE VEHÍCULOS Y SUBIDA DE FOTOS */}
      {isVehiclesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
          <div className="bg-[#0b1323] border border-amber-500/50 rounded-2xl max-w-6xl w-full h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-[#0e1828]">
              <div className="flex items-center gap-2.5">
                <Car className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white uppercase tracking-wide">
                  ADMINISTRACIÓN COMPLETA DE VEHÍCULOS, FOTOGRAFÍAS Y CATÁLOGO
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsVehiclesModalOpen(false);
                  syncSessionData();
                }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 sm:p-5">
              <VehiclesView />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

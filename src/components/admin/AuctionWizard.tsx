import React, { useState, useEffect } from 'react';
import { store } from '../../services/store';
import { AuctionSession } from '../../types';
import { NextLotModal } from '../room/NextLotModal';
import { 
  PlayCircle, Plus, CheckCircle, Car, User, Briefcase,
  Settings2, Copy, Check, ExternalLink, Flame, Sparkles, 
  ArrowRightCircle, DollarSign, Award, Layers
} from 'lucide-react';

interface AuctionWizardProps {
  onOpenRoom: (session: AuctionSession) => void;
}

export const AuctionWizard: React.FC<AuctionWizardProps> = ({ onOpenRoom }) => {
  const [mainSession, setMainSession] = useState<AuctionSession | null>(null);
  const [resultsHistory, setResultsHistory] = useState<any[]>([]);
  const [isNextLotModalOpen, setIsNextLotModalOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [nextLotLinks, setNextLotLinks] = useState<{
    brokerUrl: string;
    buyerUrl: string;
    buyerName: string;
    brokerName: string;
    clientMaxBudget: number;
    lotNumber: string;
    title: string;
  } | null>(null);

  const loadData = async () => {
    try {
      const serverSessions = await store.fetchServerSessions();
      if (serverSessions && serverSessions.length > 0) {
        setMainSession(serverSessions[0]);
      } else {
        const local = store.getSessions();
        if (local.length > 0) setMainSession(local[0]);
      }
      setResultsHistory(store.getResults());
    } catch {
      const local = store.getSessions();
      if (local.length > 0) setMainSession(local[0]);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = store.subscribe(loadData);
    return unsub;
  }, []);

  const getFullUrl = (relativeHash: string) => {
    const origin = window.location.origin;
    const pathname = window.location.pathname.endsWith('/') 
      ? window.location.pathname 
      : `${window.location.pathname}`;
    return `${origin}${pathname}${relativeHash}`;
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const vehicle = mainSession?.vehicle_snapshot || {} as any;
  const buyerName = mainSession?.buyer_name || mainSession?.client_snapshot?.full_name || 'Carlos Mendoza';
  const brokerName = mainSession?.broker_name || 'Broker Autorizado';
  const budget = mainSession?.client_max_budget || 7500;

  const auctioneerLink = mainSession 
    ? getFullUrl(mainSession.links?.auctioneerLink || `#/sala/${mainSession.room_token}?auctioneer=true`)
    : '';
  const brokerLink = mainSession 
    ? getFullUrl(mainSession.links?.brokerLink || `#/sala/${mainSession.room_token}?broker=${mainSession.broker_access_token}`)
    : '';
  const buyerLink = mainSession 
    ? getFullUrl(mainSession.links?.buyerLink || `#/sala/${mainSession.room_token}?cliente=${mainSession.buyer_access_token}`)
    : '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <PlayCircle className="w-6 h-6 text-emerald-400" />
            Gestión de la Sala Única: Siguiente Lote y Clientes
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Una sola sala en vivo (Lane A) donde pasas lote por lote con distintos brokers y compradores reales con sus presupuestos individuales.
          </p>
        </div>

        <button
          onClick={() => setIsNextLotModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 transition active:scale-95 shadow-lg border border-emerald-400/30"
        >
          <ArrowRightCircle className="w-4 h-4 text-amber-300" />
          <span>Atender Siguiente Cliente (Cargar Lote)</span>
        </button>
      </div>

      {/* Tarjeta Informativa de Flujo */}
      <div className="bg-[#0b1728] border border-blue-900/60 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5 border border-blue-500/30">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-white text-sm">Garantía Inmutable y Sala Continua</div>
            <p className="text-slate-300 mt-0.5 leading-relaxed">
              En cada lote de la sala, los únicos actores reales son el <strong>Broker Real</strong> y su <strong>Cliente Comprador</strong>. 
              Tú controlas la sala y bajas el martillo (<strong className="text-amber-400 font-mono">SOLD</strong>) adjudicando siempre al Broker Real (Paleta #101). 
              Al terminar, cargas el siguiente cliente en esta misma sala con un solo clic.
            </p>
          </div>
        </div>
      </div>

      {/* ESTADO ACTUAL DEL LOTE EN LA SALA */}
      {mainSession && (
        <div className="bg-[#0e1828] border-2 border-amber-500/40 rounded-xl p-5 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-base font-bold text-white">Lote Activo en la Sala Central</h2>
            </div>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded uppercase tracking-wider ${
              mainSession.status === 'sold'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : mainSession.status === 'bidding' || mainSession.status === 'open'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                : 'bg-slate-800 text-slate-300 border border-slate-700'
            }`}>
              {mainSession.status}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            {/* Foto y datos vehículo */}
            <div className="lg:col-span-5 flex items-center gap-4">
              <div className="w-24 h-20 bg-slate-900 rounded-lg overflow-hidden border border-slate-800 flex-shrink-0">
                {vehicle.images?.[0] ? (
                  <img src={vehicle.images[0].url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Car className="w-8 h-8 text-slate-700 m-auto mt-6" />
                )}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-mono bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800 inline-block mb-1">
                  LOTE #{vehicle.lot_number || '48291032'}
                </span>
                <h3 className="text-base font-black text-white truncate">
                  {vehicle.year} {vehicle.brand} {vehicle.model}
                </h3>
                <p className="text-slate-400 text-xs">
                  VIN: {vehicle.vin || '1FA6P8CF9P5198241'}
                </p>
              </div>
            </div>

            {/* Cliente y Broker */}
            <div className="lg:col-span-4 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#070e1a] p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">👤 Comprador:</span>
                <span className="text-white font-bold block truncate">{buyerName}</span>
                <span className="text-[11px] text-emerald-400 font-mono font-bold mt-1 block">
                  Tope: ${budget.toLocaleString()} USD
                </span>
              </div>

              <div className="bg-[#070e1a] p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">💼 Broker:</span>
                <span className="text-amber-300 font-bold block truncate">{brokerName}</span>
                <span className="text-[10px] text-amber-400/80 block mt-1">Paleta #101 Ganador</span>
              </div>
            </div>

            {/* Acciones Rápidas */}
            <div className="lg:col-span-3 flex flex-col gap-2">
              <button
                onClick={() => {
                  window.location.hash = mainSession.links?.auctioneerLink || `#/sala/${mainSession.room_token}?auctioneer=true`;
                }}
                className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow"
              >
                <span>Entrar a Dirigir Subasta</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => copyToClipboard(brokerLink, 'act-broker')}
                  className={`py-1.5 px-2 rounded border text-xs font-semibold flex items-center justify-center gap-1 transition ${
                    copiedKey === 'act-broker'
                      ? 'bg-amber-950 border-amber-600 text-amber-300'
                      : 'bg-[#070e1a] border-slate-700 text-slate-300 hover:text-white'
                  }`}
                  title="Copiar enlace del Broker"
                >
                  {copiedKey === 'act-broker' ? <Check className="w-3.5 h-3.5 text-amber-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Link Broker</span>
                </button>

                <button
                  onClick={() => copyToClipboard(buyerLink, 'act-buyer')}
                  className={`py-1.5 px-2 rounded border text-xs font-semibold flex items-center justify-center gap-1 transition ${
                    copiedKey === 'act-buyer'
                      ? 'bg-emerald-950 border-emerald-600 text-emerald-300'
                      : 'bg-[#070e1a] border-slate-700 text-slate-300 hover:text-white'
                  }`}
                  title="Copiar enlace del Cliente Comprador"
                >
                  {copiedKey === 'act-buyer' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Link Cliente</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Historial de Lotes Adjudicados en esta Sala */}
      <div className="bg-[#0e1828] border border-[#1b3152] rounded-xl p-5 shadow-lg space-y-3">
        <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <Layers className="w-4 h-4 text-amber-400" />
          <span>Lotes Pasados Adjudicados en Esta Sala</span>
          <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
            {resultsHistory.length}
          </span>
        </h2>

        {resultsHistory.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs">
            No hay remates previos en el historial de esta sala.
          </div>
        ) : (
          <div className="space-y-2">
            {resultsHistory.map((r, idx) => (
              <div
                key={r.id || idx}
                className="bg-[#080f1a] p-3 rounded-lg border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-white">{r.vehicle_summary}</span>
                  <span className="text-slate-400 text-[11px] block mt-0.5">
                    Adjudicado a: <strong className="text-amber-300">{r.winner_name}</strong> ({r.winner_paddle})
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-black text-emerald-400 text-sm">
                    ${Number(r.final_price).toLocaleString()} USD
                  </span>
                  <span className="text-[10px] text-slate-500 block">Completado (SOLD)</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL PARA CARGAR SIGUIENTE LOTE */}
      {mainSession && (
        <NextLotModal
          isOpen={isNextLotModalOpen}
          onClose={() => setIsNextLotModalOpen(false)}
          sessionId={mainSession.id}
          onSuccess={(links) => {
            setNextLotLinks(links);
            loadData();
          }}
        />
      )}

      {/* MODAL DE ENLACES PARA EL NUEVO BROKER Y CLIENTE */}
      {nextLotLinks && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1828] border-2 border-emerald-500 rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4 animate-fadeIn text-xs">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
              <div>
                <h4 className="text-base font-black text-white">¡Siguiente Lote Cargado a la Sala!</h4>
                <p className="text-slate-400 text-xs">Lote #{nextLotLinks.lotNumber} • {nextLotLinks.title}</p>
              </div>
            </div>

            <p className="text-slate-300 text-xs">
              El lote anterior ha concluido y el cliente anterior fue desconectado. Entrega estos enlaces a tu nuevo broker y cliente:
            </p>

            <div className="space-y-3">
              {/* Enlace Broker */}
              <div className="p-3 bg-[#08111e] rounded-lg border border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-amber-300 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    Enlace Nuevo Broker ({nextLotLinks.brokerName}):
                  </span>
                  <div className="text-[11px] text-slate-400 font-mono truncate max-w-xs mt-0.5">
                    {nextLotLinks.brokerUrl}
                  </div>
                  <span className="text-[10px] text-amber-400 block mt-0.5">
                    * Paleta #101 con victoria asegurada al bajar martillo.
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(nextLotLinks.brokerUrl, 'next-broker')}
                  className="p-1.5 px-3 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-1 shadow flex-shrink-0"
                >
                  {copiedKey === 'next-broker' ? <Check className="w-3.5 h-3.5 text-slate-950" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'next-broker' ? '¡Copiado!' : 'Copiar Link'}</span>
                </button>
              </div>

              {/* Enlace Cliente */}
              <div className="p-3 bg-[#08111e] rounded-lg border border-emerald-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    Enlace Nuevo Cliente ({nextLotLinks.buyerName}):
                  </span>
                  <div className="text-[11px] text-slate-400 font-mono truncate max-w-xs mt-0.5">
                    {nextLotLinks.buyerUrl}
                  </div>
                  <span className="text-[10px] text-emerald-300 block mt-0.5">
                    * Presupuesto autorizado: ${nextLotLinks.clientMaxBudget.toLocaleString()} USD
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(nextLotLinks.buyerUrl, 'next-buyer')}
                  className="p-1.5 px-3 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow flex-shrink-0"
                >
                  {copiedKey === 'next-buyer' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'next-buyer' ? '¡Copiado!' : 'Copiar Link'}</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setNextLotLinks(null)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2 rounded-lg text-xs transition"
              >
                Cerrar y Ver Sala
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

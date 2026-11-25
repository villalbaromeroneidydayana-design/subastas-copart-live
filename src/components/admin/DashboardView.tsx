import React, { useState, useEffect } from 'react';
import { store } from '../../services/store';
import { AuctionSession } from '../../types';
import { NextLotModal } from '../room/NextLotModal';
import { 
  Users, Car, PlayCircle, CheckCircle, Clock, 
  ArrowRight, ExternalLink, Sparkles, User, Briefcase, Copy, Check,
  Award, ArrowRightCircle, DollarSign, RefreshCw, FileText
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (section: string) => void;
  onOpenRoom: (session: AuctionSession) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenRoom,
}) => {
  const [mainSession, setMainSession] = useState<AuctionSession | null>(null);
  const [resultsHistory, setResultsHistory] = useState<any[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isNextLotModalOpen, setIsNextLotModalOpen] = useState(false);
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

  const clients = store.getClients();
  const vehicles = store.getVehicles();

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
  const buyerName = mainSession?.buyer_name || (mainSession as any)?.buyerName || mainSession?.client_snapshot?.full_name || 'Gustavo Adolfo Medal López';
  const brokerName = mainSession?.broker_name || (mainSession as any)?.brokerName || 'David Rodríguez';
  const budget = Number(mainSession?.client_max_budget ?? (mainSession as any)?.clientMaxBudget ?? 2500);

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
      {/* Banner Principal de la Sala Copart */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#002855] via-[#091b34] to-[#0c1524] p-6 border-2 border-amber-500/40 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs px-3 py-1 rounded-full font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              SALA OFICIAL COPART VB3 • LANE A (EN VIVO)
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
              Terminal de Subastas en Vivo
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
              Una sala central realista donde tú manejas el remate. Atiende a tus clientes y brokers de forma consecutiva lote tras lote, con garantía de adjudicación para el Broker Real.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                if (mainSession) {
                  window.location.hash = mainSession.links?.auctioneerLink || `#/sala/${mainSession.room_token}?auctioneer=true`;
                }
              }}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-5 py-3 rounded-lg shadow-xl flex items-center gap-2 transition active:scale-95 text-xs sm:text-sm"
            >
              <span>Entrar a Dirigir la Sala</span>
              <ExternalLink className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsNextLotModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-3 rounded-lg border border-emerald-400/40 shadow-lg flex items-center gap-2 transition active:scale-95 text-xs sm:text-sm"
            >
              <ArrowRightCircle className="w-4 h-4" />
              <span>Atender Siguiente Cliente</span>
            </button>
          </div>
        </div>
      </div>

      {/* TARJETA PRINCIPAL: ESTADO ACTUAL DEL LOTE EN LA SALA ÚNICA */}
      {mainSession && (
        <div className="bg-[#0e1828] border-2 border-blue-900/80 rounded-xl p-5 sm:p-6 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-base sm:text-lg font-black text-white">Lote Actual en Pantalla de la Sala</h2>
            </div>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded uppercase tracking-wider ${
              mainSession.status === 'sold'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : mainSession.status === 'bidding' || mainSession.status === 'open'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                : 'bg-slate-800 text-slate-300 border border-slate-700'
            }`}>
              Estado de la Sala: {mainSession.status}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            {/* Imagen y ficha */}
            <div className="lg:col-span-4 flex items-center gap-4">
              <div className="w-28 h-24 bg-slate-900 rounded-lg overflow-hidden border border-slate-800 flex-shrink-0">
                {vehicle.images?.[0] ? (
                  <img src={vehicle.images[0].url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Car className="w-10 h-10 text-slate-700 m-auto mt-6" />
                )}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-mono bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800 inline-block mb-1">
                  LOTE #{vehicle.lot_number || mainSession.vehicle_snapshot?.lot_number || '48291032'}
                </span>
                <h3 className="text-base font-black text-white truncate">
                  {vehicle.year} {vehicle.brand} {vehicle.model}
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  VIN: {vehicle.vin || '1FA6P8CF9P5198241'}
                </p>
                <p className="text-slate-400 text-xs">
                  Condición: <strong className="text-emerald-400 uppercase">{vehicle.vehicle_condition || 'run_and_drive'}</strong>
                </p>
              </div>
            </div>

            {/* Datos de Cliente, Broker y Precio */}
            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="bg-[#070e1a] p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">👤 Cliente Actual:</span>
                <span className="text-white font-bold block truncate mt-0.5">{buyerName}</span>
                <span className="text-[11px] text-emerald-400 font-mono font-bold mt-1 block">
                  Tope: ${(Number(budget) || 7500).toLocaleString()} USD
                </span>
              </div>

              <div className="bg-[#070e1a] p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">💼 Broker (Paleta #101):</span>
                <span className="text-amber-300 font-bold block truncate mt-0.5">{brokerName}</span>
                <span className="text-[10px] text-slate-500 mt-1 block">Victoria Garantizada</span>
              </div>

              <div className="bg-[#070e1a] p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">💵 Precio Actual:</span>
                <span className="text-lg font-black font-mono text-emerald-400 block mt-0.5">
                  ${(Number(mainSession?.current_price ?? (mainSession as any)?.currentPrice ?? mainSession?.starting_price ?? (mainSession as any)?.startingPrice ?? 5000)).toLocaleString()} USD
                </span>
              </div>
            </div>

            {/* Enlaces Rápidos de este Lote */}
            <div className="lg:col-span-3 flex flex-col gap-2">
              <button
                onClick={() => copyToClipboard(brokerLink, 'main-broker')}
                className={`w-full py-2 px-3 rounded-lg border font-semibold text-xs flex items-center justify-between transition ${
                  copiedKey === 'main-broker'
                    ? 'bg-amber-950 border-amber-600 text-amber-300'
                    : 'bg-[#070e1a] border-slate-700 text-slate-200 hover:text-white hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Briefcase className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span className="truncate">Enlace Broker Real</span>
                </div>
                {copiedKey === 'main-broker' ? <Check className="w-3.5 h-3.5 text-amber-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              </button>

              <button
                onClick={() => copyToClipboard(buyerLink, 'main-buyer')}
                className={`w-full py-2 px-3 rounded-lg border font-semibold text-xs flex items-center justify-between transition ${
                  copiedKey === 'main-buyer'
                    ? 'bg-emerald-950 border-emerald-600 text-emerald-300'
                    : 'bg-[#070e1a] border-slate-700 text-slate-200 hover:text-white hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <User className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  <span className="truncate">Enlace Cliente Comprador</span>
                </div>
                {copiedKey === 'main-buyer' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reglas y Mecánica Realista */}
      <div className="bg-[#0b1728] border border-blue-900/60 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5 border border-blue-500/30">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-white text-sm">Flujo Realista Copart en Sala Única</div>
            <p className="text-slate-300 mt-0.5 leading-relaxed">
              1. Tú diriges el remate y disparas ofertas competidoras ficticias a voluntad.<br />
              2. El Broker Real (Paleta #101) oferta dentro del presupuesto acordado y siempre gana al bajar el martillo (<strong className="text-amber-400 font-mono">SOLD</strong>).<br />
              3. Al finalizar, el acceso del cliente anterior caduca y pulsas <strong>«Atender Siguiente Cliente»</strong> para cargar el próximo vehículo con su nuevo comprador y presupuesto en esta misma sala.
            </p>
          </div>
        </div>
      </div>

      {/* Historial de Lotes Adjudicados */}
      <div className="bg-[#0e1828] border border-[#1b3152] rounded-xl p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white">Historial de Lotes Adjudicados en esta Sala</h2>
            <p className="text-xs text-slate-400">Resultados oficiales de remates completados</p>
          </div>
          <button
            onClick={() => onNavigate('historial')}
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition"
          >
            <span>Ver historial completo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {resultsHistory.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs">
            Aún no hay subastas completadas en el historial. Al bajar el martillo con SOLD, el resultado quedará registrado aquí.
          </div>
        ) : (
          <div className="space-y-2">
            {resultsHistory.slice(0, 4).map((r, idx) => (
              <div
                key={r.id || idx}
                className="bg-[#080f1a] p-3 rounded-lg border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-white">{r.vehicle_summary}</span>
                  <span className="text-slate-400 text-[11px] block">
                    Ganador: <strong className="text-amber-300">{r.winner_name}</strong> ({r.winner_paddle})
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-black text-emerald-400 text-sm">
                    ${Number(r.final_price).toLocaleString()} USD
                  </span>
                  <span className="text-[10px] text-slate-500 block">Adjudicado</span>
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
                <h4 className="text-base font-black text-white">¡Siguiente Lote Cargado en Esta Sala!</h4>
                <p className="text-slate-400 text-xs">Lote #{nextLotLinks.lotNumber} • {nextLotLinks.title}</p>
              </div>
            </div>

            <p className="text-slate-300 text-xs">
              La sala está lista para el nuevo remate. El cliente anterior ha sido desconectado. Entrega estos enlaces oficiales a tu nuevo broker y nuevo cliente:
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
                    * Paleta #101 fija con garantía de victoria al bajar martillo.
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
                    * Presupuesto autorizado: ${(Number(nextLotLinks.clientMaxBudget) || 15000).toLocaleString()} USD
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
                Cerrar y Ver Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { store } from '../../services/store';
import { AuctionSession, CustomVehicleBadges } from '../../types';
import { sounds } from '../../lib/soundEffects';
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
  X,
  FileText,
  CheckCircle2,
  Share2,
  Tag,
  Bot,
  Zap,
  ArrowLeft,
  ArrowRight,
  Minus,
  Megaphone,
  Lock,
  Home
} from 'lucide-react';
import { NextLotModal } from '../room/NextLotModal';
import { CopartLogo } from '../common/CopartLogo';
import { VehiclesView } from './VehiclesView';
import { ClientsView } from './ClientsView';
import { HistoryView } from './HistoryView';
import { SettingsView } from './SettingsView';
import { VehicleBadgesModal } from './VehicleBadgesModal';
import { CopartVerificationModal } from '../room/CopartVerificationModal';
import { WhatsAppInviteModal } from './WhatsAppInviteModal';

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
  { number: 'Paleta #101', name: 'David Rodríguez / Johan', location: 'Wylie, TX', isBroker: true },
  { number: 'Paleta #108', name: 'AutoExport Dallas LLC', location: 'Dallas, TX' },
  { number: 'Paleta #214', name: 'Pacific Salvage Auctions', location: 'Los Angeles, CA' },
  { number: 'Paleta #305', name: 'Global Fleet Buyers', location: 'Atlanta, GA' },
  { number: 'Paleta #412', name: 'Buckeye Motor Exchange', location: 'Columbus, OH' },
  { number: 'Paleta #519', name: 'Lone Star Salvage Group', location: 'Houston, TX' },
  { number: 'Paleta #623', name: 'Midwest Premier Liquidation', location: 'Chicago, IL' },
  { number: 'Paleta #734', name: 'Sunstate Auto Wholesale', location: 'Orlando, FL' },
  { number: 'Paleta #845', name: 'Tri-State Metro Salvage', location: 'Newark, NJ' },
  { number: 'Paleta #912', name: 'Cascade Auto Remarketing', location: 'Seattle, WA' },
  { number: 'Paleta #965', name: 'Carolina Fleet Dispersal', location: 'Charlotte, NC' },
  { number: 'Paleta #988', name: 'Keystone Auto Liquidation', location: 'Philadelphia, PA' },
];

export const AuctioneerPrivateConsole: React.FC<AuctioneerPrivateConsoleProps> = ({
  session: initialSession,
}) => {
  const [session, setSession] = useState<AuctionSession>(initialSession);
  const [bids, setBids] = useState<any[]>([]);
  const [selectedPaddle, setSelectedPaddle] = useState<string>('Paleta #101');
  const [bidAmountInput, setBidAmountInput] = useState<string>('750');
  const [isSubmittingBid, setIsSubmittingBid] = useState<boolean>(false);
  const [activeCall, setActiveCall] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isNextLotModalOpen, setIsNextLotModalOpen] = useState<boolean>(false);
  const [isVehiclesModalOpen, setIsVehiclesModalOpen] = useState<boolean>(false);
  const [isParamsModalOpen, setIsParamsModalOpen] = useState<boolean>(false);
  const [isBadgesModalOpen, setIsBadgesModalOpen] = useState<boolean>(false);
  const [brokerOnline, setBrokerOnline] = useState<boolean>(false);
  const [buyerOnline, setBuyerOnline] = useState<boolean>(false);
  const [lotStartingPrice, setLotStartingPrice] = useState<number>(5000);
  const [lotMinIncrement, setLotMinIncrement] = useState<number>(250);
  const [lotReservePrice, setLotReservePrice] = useState<number>(12000);
  const [lotClientBudget, setLotClientBudget] = useState<number>(2500);
  const [lotBrokerName, setLotBrokerName] = useState<string>('David Rodríguez');
  const [lotBrokerLocation, setLotBrokerLocation] = useState<string>('Wylie, TX');
  const [lotBuyerName, setLotBuyerName] = useState<string>('Gustavo Adolfo Medal López');
  const [lotReferenceUrl, setLotReferenceUrl] = useState<string>('');
  const [lotNumberInput, setLotNumberInput] = useState<string>('');
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [lang, setLang] = useState<'en' | 'es'>('en');
  const [isEditingBasePrice, setIsEditingBasePrice] = useState<boolean>(false);
  const [directPriceInput, setDirectPriceInput] = useState<string>('5000');
  const [viewersCount, setViewersCount] = useState<number>(14);
  const [announcementText, setAnnouncementText] = useState<string>('');
  const [activeAnnouncement, setActiveAnnouncement] = useState<string>('COPART LIVE LANE A • Transmisión oficial en vivo desde Estados Unidos');
  const [isSendingAnnouncement, setIsSendingAnnouncement] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(true); // Consola silenciosa por defecto para evitar doble audio con la sala
  const [activeDocToken, setActiveDocToken] = useState<string | null>(null);
  const [copiedDocLink, setCopiedDocLink] = useState<boolean>(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState<boolean>(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState<boolean>(false);
  const [activeMasterView, setActiveMasterView] = useState<'consola' | 'clientes' | 'vehiculos' | 'historial' | 'configuracion'>('consola');

  // Dock inferior de gestión y selección de vehículos Copart
  const [dockTab, setDockTab] = useState<'lista' | 'cola' | 'carril' | 'comparar' | 'patio'>('lista');
  const [consoleVehicles, setConsoleVehicles] = useState<any[]>(store.getVehicles());

  useEffect(() => {
    store.fetchServerVehicles().then((vehs) => {
      if (vehs && vehs.length > 0) setConsoleVehicles(vehs);
    });
  }, []);

  const handleSubirAPantalla = async (targetVeh: any) => {
    if (!targetVeh) return;
    try {
      await store.loadVehicleToSession(session.id || 'ses-live-001', targetVeh);
      const startPrice = targetVeh.est_retail_value 
        ? Math.max(1000, Math.round((targetVeh.est_retail_value * 0.20) / 500) * 500)
        : 5000;
      setSession((prev) => ({
        ...prev,
        vehicle_snapshot: targetVeh,
        vehicle: targetVeh,
        lot_number: targetVeh.lot_number,
        title: `${targetVeh.year} ${targetVeh.brand} ${targetVeh.model}`,
        status: 'prepared',
        starting_price: startPrice,
        current_price: startPrice,
        time_remaining_seconds: 15,
        total_duration_seconds: 15,
        current_winner_paddle: null,
        current_winner_name: null,
        bid_count: 0,
      }));
      setLotStartingPrice(startPrice);
      showFeedback(`✓ SUBIDO A PANTALLA: ${targetVeh.year} ${targetVeh.brand} ${targetVeh.model} (Lote #${targetVeh.lot_number}) — Estado: PREPARADO / STANDBY (15s)`);
      await syncSessionData();
    } catch (err: any) {
      console.error('Error al subir vehículo a pantalla desde consola:', err);
    }
  };

  const handleToggleAudio = () => {
    const next = !isAudioMuted;
    sounds.setMuted(next);
    setIsAudioMuted(next);
    if (!next) {
      try {
        sounds.playBidPing();
      } catch {}
    }
  };

  const handleCopyDocumentLink = () => {
    if (!activeDocToken) return;
    const url = `${window.location.origin}${window.location.pathname}#/documento/${activeDocToken}`;
    navigator.clipboard.writeText(url);
    setCopiedDocLink(true);
    showFeedback('✓ Enlace del Certificado Oficial copiado al portapapeles');
    setTimeout(() => setCopiedDocLink(false), 2500);
  };

  // Sincronización continua de datos en tiempo real
  const syncSessionData = async () => {
    try {
      const data = await store.fetchServerSession(session.id || 'ses-live-001', { isAuctioneer: true });
      if (data && data.session) {
        if (data.session.status === 'sold') {
          store.fetchSessionDocuments(data.session.id).then((docs) => {
            if (docs && docs.length > 0) {
              const active = docs.find((d: any) => !d.isRevoked);
              if (active) setActiveDocToken(active.docToken);
            }
          });
        }
        setSession((prev) => ({
          ...prev,
          ...data.session,
          current_price: Number(data.session.current_price ?? data.session.currentPrice ?? prev.current_price ?? 5000),
          starting_price: Number(data.session.starting_price ?? data.session.startingPrice ?? prev.starting_price ?? 5000),
          client_max_budget: Number(data.session.client_max_budget ?? data.session.clientMaxBudget ?? prev.client_max_budget ?? 7500),
          time_remaining_seconds: (prev.status === 'open' || prev.status === 'bidding' || prev.status === 'last_call')
            ? prev.time_remaining_seconds
            : (data.session.time_remaining_seconds ?? data.session.timeRemainingSeconds ?? prev.time_remaining_seconds ?? 15),
          status: data.session.status ?? prev.status,
        }));
        setLotStartingPrice(Number(data.session.starting_price ?? data.session.startingPrice ?? 700));
        setLotMinIncrement(Number(data.session.min_increment ?? data.session.minIncrement ?? 250));
        setLotReservePrice(Number(data.session.reserve_price ?? data.session.reservePrice ?? 1800));
        setLotClientBudget(Number(data.session.client_max_budget ?? data.session.clientMaxBudget ?? 2500));
        if (data.session.broker_name || data.session.brokerName) {
          const rawBroker = data.session.broker_name || data.session.brokerName;
          if (rawBroker && !rawBroker.includes('Representante') && !rawBroker.includes('Broker Autorizado')) {
            setLotBrokerName(rawBroker);
          }
        }
        if (data.session.broker_location || data.session.brokerLocation) {
          setLotBrokerLocation(data.session.broker_location || data.session.brokerLocation);
        }
        if (data.participants && Array.isArray(data.participants)) {
          const p101 = data.participants.find((p: any) => p.paddleNumber === 'Paleta #101' || p.paddle_number === 'Paleta #101');
          if (p101) {
            if (p101.name && !p101.name.includes('Representante') && !p101.name.includes('Broker Autorizado')) {
              setLotBrokerName(p101.name.replace(/\(.*?\)/g, '').trim());
            }
            if (p101.location) setLotBrokerLocation(p101.location);
          }
        }
        if (data.session.buyer_name || data.session.buyerName) {
          setLotBuyerName(data.session.buyer_name || data.session.buyerName);
        }
        if (data.session.reference_url || data.session.referenceUrl || data.session.vehicle?.reference_url) {
          setLotReferenceUrl(data.session.reference_url || data.session.referenceUrl || data.session.vehicle?.reference_url || '');
        }
        if (data.session.lot_number || data.session.lotNumber || data.session.vehicle?.lot_number) {
          setLotNumberInput(data.session.lot_number || data.session.lotNumber || data.session.vehicle?.lot_number || '');
        }
        if (data.session.viewersCount !== undefined) {
          setViewersCount(Number(data.session.viewersCount));
        }
        if (data.session.announcement || data.session.latest_announcement) {
          setActiveAnnouncement(data.session.announcement || data.session.latest_announcement);
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

  // Cronómetro local 1 Hz continuo en consola para que el reloj baje visiblemente segundo a segundo
  useEffect(() => {
    if (session.status !== 'open' && session.status !== 'bidding' && session.status !== 'last_call') {
      return;
    }

    const timer = setInterval(() => {
      setSession((prev) => {
        if (prev.status !== 'open' && prev.status !== 'bidding' && prev.status !== 'last_call') {
          return prev;
        }
        if ((prev.time_remaining_seconds ?? 15) <= 0) {
          return prev;
        }
        const nextTime = Math.max(0, (prev.time_remaining_seconds ?? 15) - 1);
        const nextStatus = nextTime <= 4 ? 'last_call' : prev.status;
        return {
          ...prev,
          time_remaining_seconds: nextTime,
          status: nextStatus,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [session.status]);

  // Centralizar inicio y apertura de subasta con reloj autoritativo
  const handleStartAuction = async () => {
    const targetId = session.id || 'ses-live-001';
    const veh = session.vehicle_snapshot || (session as any).vehicle;
    setSession((prev) => ({
      ...prev,
      status: 'open',
      time_remaining_seconds: 15,
      total_duration_seconds: 15,
    }));
    try {
      if (veh?.custom_badges?.auctioneerVoiceGender) {
        sounds.setVoiceGender(veh.custom_badges.auctioneerVoiceGender);
      }
      sounds.playStartVoice(Number(session.current_price || session.starting_price || 5000), {
        year: veh?.year,
        brand: veh?.brand,
        model: veh?.model,
        version: veh?.version,
        odometer: veh?.odometer,
        condition: veh?.vehicle_condition,
        hasKeys: veh?.has_keys,
        customChant: veh?.custom_badges?.auctioneerWelcomeChant,
      });
    } catch {}
    showFeedback('🟢 SUBASTA INICIADA — Reloj de 15s corriendo en ambas pantallas');
    await store.serverStartAuction(targetId);
    await syncSessionData();
  };

  // Control de Pausa
  const handlePauseAuction = async () => {
    const targetId = session.id || 'ses-live-001';
    setSession((prev) => ({ ...prev, status: 'paused' }));
    try { sounds.playPauseVoice(); } catch {}
    showFeedback('⏸ Subasta en pausa — Reloj detenido');
    await store.serverPauseAuction(targetId);
    await syncSessionData();
  };

  // Control de Reanudación
  const handleResumeAuction = async () => {
    const targetId = session.id || 'ses-live-001';
    setSession((prev) => ({ ...prev, status: 'bidding' }));
    try { sounds.playResumeVoice(); } catch {}
    showFeedback('▶ Subasta reanudada — Cuenta regresiva activa');
    await store.serverResumeAuction(targetId);
    await syncSessionData();
  };

  // Control de Reseteo Completo
  const handleResetAuction = async () => {
    const targetId = session.id || 'ses-live-001';
    setSession((prev) => ({
      ...prev,
      status: 'prepared',
      current_price: 5000,
      currentPrice: 5000,
      starting_price: 5000,
      time_remaining_seconds: 15,
      current_winner_paddle: null,
      currentWinnerPaddle: null,
      current_winner_name: null,
      current_bid_count: 0,
      bid_count: 0,
    }));
    setBids([]);
    setActiveCall(null);
    setBidAmountInput('5250');
    showFeedback('🔄 Subasta reseteada a estado inicial ($5,000 USD / 15s)');
    await store.serverResetAuction(targetId);
    await syncSessionData();
  };

  // Control de Disminución de Puja
  const applyDecrement = (decrementValue: number) => {
    const curr = Number(bidAmountInput) || Number(session.current_price || 5000);
    const minVal = Number(session.current_price || 5000);
    const nextVal = Math.max(minVal, curr - decrementValue);
    setBidAmountInput(String(nextVal));
  };

  // Navegación de Lotes (Anterior / Siguiente)
  const handlePrevLot = async () => {
    const vehicles = store.getVehicles();
    const currLot = (session as any).lot_number || session.vehicle_snapshot?.lot_number;
    const currIdx = vehicles.findIndex((v) => v.lot_number === currLot);
    const prevIdx = currIdx > 0 ? currIdx - 1 : vehicles.length - 1;
    const targetVeh = vehicles[prevIdx];
    if (targetVeh) {
      await store.updateSessionVehicle(session.id, targetVeh);
      showFeedback(`◀ Lote anterior cargado: ${targetVeh.year} ${targetVeh.brand} #${targetVeh.lot_number}`);
      await syncSessionData();
    }
  };

  const handleNextLot = async () => {
    const vehicles = store.getVehicles();
    const currLot = (session as any).lot_number || session.vehicle_snapshot?.lot_number;
    const currIdx = vehicles.findIndex((v) => v.lot_number === currLot);
    const nextIdx = (currIdx + 1) % vehicles.length;
    const targetVeh = vehicles[nextIdx];
    if (targetVeh) {
      await store.updateSessionVehicle(session.id, targetVeh);
      showFeedback(`▶ Siguiente lote cargado: ${targetVeh.year} ${targetVeh.brand} #${targetVeh.lot_number}`);
      await syncSessionData();
    }
  };

  useEffect(() => {
    syncSessionData();
    const interval = setInterval(syncSessionData, 1000);
    const unsub = store.subscribe(syncSessionData);
    const unsubWs = store.onWsMessage((msg: any) => {
      try {
        if (!msg) return;
        if (msg.type === 'CLOCK_TICK') {
          setSession((prev) => ({
            ...prev,
            time_remaining_seconds: msg.timeRemaining,
            current_price: msg.currentPrice !== undefined ? Number(msg.currentPrice) : prev.current_price,
            status: msg.status || prev.status,
          }));
          if (msg.viewersCount !== undefined) {
            setViewersCount(Number(msg.viewersCount));
          }
        } else if (msg.type === 'NEW_REAL_BID') {
          const newPrice = msg.currentPrice !== undefined ? Number(msg.currentPrice) : (msg.bid?.amount ? Number(msg.bid.amount) : session.current_price);
          const newWinner = msg.currentWinnerPaddle || msg.bid?.paddleNumber;
          const newWinnerName = msg.currentWinnerName || msg.bid?.bidderName;
          setSession((prev) => ({
            ...prev,
            status: 'open',
            current_price: newPrice,
            currentPrice: newPrice,
            current_winner_paddle: newWinner,
            currentWinnerPaddle: newWinner,
            current_winner_name: newWinnerName,
            time_remaining_seconds: msg.timeRemaining !== undefined ? Number(msg.timeRemaining) : 15,
          }));
          if (msg.bid) {
            const formatted = {
              id: msg.bid.id || 'bid-' + Date.now(),
              sessionId: msg.sessionId || session.id,
              amount: msg.bid.amount || newPrice,
              participantId: msg.bid.participantId,
              bidderName: msg.bid.bidderName || newWinnerName,
              location: msg.bid.location || 'Miami, FL',
              isClient: (msg.bid.paddleNumber || newWinner)?.includes('101'),
              serverTimestamp: msg.serverTimestamp || new Date().toISOString(),
              sequenceNumber: msg.bid.sequenceNumber || 1,
              paddleNumber: msg.bid.paddleNumber || newWinner,
              paddle_number: msg.bid.paddleNumber || newWinner,
            };
            setBids((prev) => [formatted, ...prev.filter((b) => b.id !== formatted.id)]);
          }
        } else if (msg.type === 'AUCTION_RESET') {
          const resetPrice = msg.startingPrice !== undefined ? Number(msg.startingPrice) : 5000;
          setSession((prev) => ({
            ...prev,
            status: 'prepared',
            current_price: resetPrice,
            currentPrice: resetPrice,
            starting_price: resetPrice,
            time_remaining_seconds: msg.timeRemaining !== undefined ? Number(msg.timeRemaining) : 15,
            current_winner_paddle: null,
            currentWinnerPaddle: null,
            current_winner_name: null,
            current_bid_count: 0,
            bid_count: 0,
          }));
          setBids([]);
          setActiveCall(null);
        } else if (msg.type === 'AUCTION_FINALIZED') {
          const finalDecision = msg.decision || msg.status || 'sold';
          setSession((prev) => ({
            ...prev,
            status: finalDecision,
            current_price: msg.currentPrice !== undefined ? Number(msg.currentPrice) : prev.current_price,
            current_winner_paddle: msg.winnerPaddle || (prev as any).current_winner_paddle,
            time_remaining_seconds: 0,
          }));
        } else if (msg.type === 'AUCTION_STARTED' || msg.type === 'STATUS_CHANGE') {
          setSession((prev) => ({
            ...prev,
            status: msg.status || prev.status,
            time_remaining_seconds: msg.timeRemaining !== undefined ? msg.timeRemaining : prev.time_remaining_seconds,
            current_price: msg.currentPrice !== undefined ? Number(msg.currentPrice) : prev.current_price,
            current_winner_paddle: msg.currentWinnerPaddle !== undefined ? msg.currentWinnerPaddle : (prev as any).current_winner_paddle,
          }));
          syncSessionData();
        } else if (msg.type === 'NEXT_LOT_LOADED' || msg.type === 'VEHICLE_UPDATED') {
          syncSessionData();
        }
      } catch {}
    });

    return () => {
      clearInterval(interval);
      unsub();
      unsubWs();
    };
  }, [session.id]);

  // Mantener el importe sugerido un paso adelante sobre el precio actual (+50 USD por defecto)
  useEffect(() => {
    const curr = Number(session.current_price || (session as any).currentPrice || 5000);
    setBidAmountInput(String(curr + 50));
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

  // Guardar todos los parámetros del lote (Base, Incremento, Reserva, Presupuesto, Enlace Copart y Lote)
  const handleSaveLotParameters = async () => {
    const res = await store.updateLotParameters(session.id, {
      startingPrice: Number(lotStartingPrice),
      currentPrice: Number(lotStartingPrice),
      minIncrement: Number(lotMinIncrement),
      reservePrice: Number(lotReservePrice),
      clientMaxBudget: Number(lotClientBudget),
      brokerName: lotBrokerName,
      brokerLocation: lotBrokerLocation,
      buyerName: lotBuyerName,
      referenceUrl: lotReferenceUrl.trim(),
      lotNumber: lotNumberInput.trim(),
    });
    if (res.success) {
      showFeedback('✓ Parámetros del lote actualizados inmediatamente en sala');
      setIsParamsModalOpen(false);
      await syncSessionData();
    } else {
      showFeedback(res.error || 'Error al actualizar parámetros', 'error');
    }
  };

  // Ajuste rápido en 1-clic del presupuesto del cliente
  const handleQuickUpdateBudget = async (newBudget: number) => {
    setLotClientBudget(newBudget);
    const res = await store.updateLotParameters(session.id, {
      startingPrice: Number(lotStartingPrice),
      minIncrement: Number(lotMinIncrement),
      reservePrice: Number(lotReservePrice),
      clientMaxBudget: Number(newBudget),
      brokerName: lotBrokerName,
      buyerName: lotBuyerName,
    });
    if (res.success) {
      showFeedback(`✓ Presupuesto del cliente ajustado a $${newBudget.toLocaleString()} USD`);
      await syncSessionData();
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // ACTUALIZAR DATOS DE PALETA #101 (NOMBRE Y UBICACIÓN DEL CLIENTE)
  const handleSavePaddle101 = async () => {
    const targetId = session.id || 'ses-live-001';
    const nameToSave = lotBrokerName.trim() || 'David Rodríguez';
    const locToSave = lotBrokerLocation.trim() || 'Wylie, TX';
    try {
      const res = await store.updatePaddle101(targetId, nameToSave, locToSave);
      if (res.success) {
        showFeedback(`✓ Paleta #101 configurada: ${nameToSave} (${locToSave})`);
        await syncSessionData();
      } else {
        showFeedback(res.error || 'Error al actualizar Paleta #101', 'error');
      }
    } catch {
      showFeedback('Error al actualizar Paleta #101', 'error');
    }
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
      time_remaining_seconds: 15,
    }));
    try {
      sounds.playBidVoice(amount, selectedPaddle, selectedPaddle.includes('101'));
    } catch {}

    setIsSubmittingBid(true);
    // Si la sala no estaba abierta, aseguramos su apertura inmediata
    if (session.status !== 'open') {
      await store.serverStartAuction(targetId);
    }
    const paddleObj = OFFICIAL_PADDLES.find((p) => p.number === selectedPaddle);
    const res = await store.submitManualBid(
      targetId,
      selectedPaddle,
      amount,
      selectedPaddle === 'Paleta #101' ? (lotBrokerName || 'David Rodríguez') : (paddleObj?.name || undefined),
      selectedPaddle === 'Paleta #101' ? (lotBrokerLocation || 'Wylie, TX') : (paddleObj?.location || undefined)
    );
    setIsSubmittingBid(false);

    if (res.success) {
      showFeedback(`✓ Oferta de $${amount.toLocaleString()} enviada exitosamente con ${selectedPaddle}`);
      setBidAmountInput(String(amount + 50));
      await syncSessionData();
    } else {
      showFeedback(res.error || 'Error al procesar la oferta', 'error');
    }
  };

  // 1.1 OFERTA RÁPIDA DE 1 CLIC DESDE LA FILA DE LA PALETA
  const handleQuickPaddleBid = async (paddleNumber: string, increment: number) => {
    const paddleObj = OFFICIAL_PADDLES.find((p) => p.number === paddleNumber);
    const currentP = Number(session.current_price || (session as any).currentPrice || 5000);
    const nextAmount = currentP + increment;
    const targetId = session.id || 'ses-live-001';

    setSelectedPaddle(paddleNumber);
    setBidAmountInput(String(nextAmount + 50));

    setSession((prev) => ({
      ...prev,
      status: 'open',
      current_price: nextAmount,
      currentPrice: nextAmount,
      current_winner_paddle: paddleNumber,
      currentWinnerPaddle: paddleNumber,
      time_remaining_seconds: 15,
    }));

    try {
      sounds.playBidVoice(nextAmount, paddleNumber, paddleNumber.includes('101'));
    } catch {}

    const res = await store.submitManualBid(
      targetId,
      paddleNumber,
      nextAmount,
      paddleNumber === 'Paleta #101' ? (lotBrokerName || 'David Rodríguez') : (paddleObj?.name || undefined),
      paddleNumber === 'Paleta #101' ? (lotBrokerLocation || 'Wylie, TX') : (paddleObj?.location || undefined)
    );

    if (res && res.success) {
      showFeedback(`✓ Oferta de $${nextAmount.toLocaleString()} enviada con ${paddleNumber}`);
      await syncSessionData();
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
    setActiveAnnouncement(text);
    await store.sendAnnouncement(session.id, text);
    setIsSendingAnnouncement(false);
    showFeedback(`📢 Aviso proyectado en sala: "${text}"`);
    setAnnouncementText('');
  };

  // ACTUALIZACIÓN DE INSIGNIAS Y BOTONES DEL VEHÍCULO
  const handleSaveBadges = async (updatedBadges: CustomVehicleBadges) => {
    const currVeh = session.vehicle_snapshot || (session as any).vehicle || {};
    const updatedVeh = {
      ...currVeh,
      custom_badges: updatedBadges,
    };
    await store.updateSessionVehicle(session.id, updatedVeh);
    showFeedback('✓ Insignias y botones del vehículo actualizados en la sala en vivo');
    await syncSessionData();
  };

  // 2. INCREMENTOS RÁPIDOS CALCULADOS EXACTAMENTE SOBRE EL PRECIO ACTUAL EN SALA
  const applyIncrement = (incrementValue: number) => {
    const livePrice = Number(session.current_price ?? (session as any).currentPrice ?? 5000);
    setBidAmountInput(String(livePrice + incrementValue));
  };

  // 3. LLAMADAS DEL SUBASTADOR (GOING ONCE, GOING TWICE, FAIR WARNING)
  const handleAuctioneerCall = async (callType: 'going_once' | 'going_twice' | 'fair_warning' | 'clear') => {
    setActiveCall(callType === 'clear' ? null : callType);
    if (callType !== 'clear') {
      try {
        sounds.playAuctioneerCall(callType, Number(session.current_price || 5000));
      } catch {}
      showFeedback(`📢 Aviso emitido a la sala: ${callType.toUpperCase().replace('_', ' ')}`);
      setTimeout(() => {
        setActiveCall((prev) => (prev === callType ? null : prev));
      }, 7500);
    }
    await store.sendAuctioneerCall(session.id, callType);
  };

  // 4. ADJUDICACIÓN MANUAL (SOLD / UNSOLD)
  const handleAdjudicate = async (decision: 'sold' | 'unsold') => {
    const winner = (session as any).currentWinnerPaddle || (session as any).current_winner_paddle || session.current_bidder_name || (bids.length > 0 ? bids[0].paddleNumber : 'Paleta #101');
    const winnerName = (winner === 'Paleta #101' || winner.includes('101'))
      ? (lotBrokerName || 'David Rodríguez')
      : ((session as any).currentWinnerName || (session as any).current_winner_name || 'Postor en Sala');
    const price = Number(session.current_price || 5000);

    setSession((prev) => ({
      ...prev,
      status: decision,
      time_remaining_seconds: 0,
      current_winner_paddle: decision === 'sold' ? winner : 'N/A',
      currentWinnerPaddle: decision === 'sold' ? winner : 'N/A',
      current_winner_name: decision === 'sold' ? winnerName : null,
      currentWinnerName: decision === 'sold' ? winnerName : null,
    }));
    
    if (decision === 'sold') {
      try {
        sounds.playSoldFanfare(price, winner, winnerName);
      } catch {}

      try {
        const docRes = await store.createDocumentLink(session.id, {
          clientName: winnerName,
          clientEmail: 'cliente@subastas.com',
          expiresInDays: 7,
        });
        if (docRes && docRes.docToken) {
          setActiveDocToken(docRes.docToken);
        }
      } catch {}
    } else {
      try {
        sounds.playUnsoldVoice();
      } catch {}
    }

    await store.adjudicateAuction(session.id, decision, winner, winnerName, price);
    showFeedback(decision === 'sold' ? `🔨 Lote ADJUDICADO (SOLD) a ${winner} (${winnerName})!` : '⛔ Lote marcado como NO VENDIDO (UNSOLD)');
    await syncSessionData();
  };

  // Enlaces de acceso
  const origin = window.location.origin;
  const basePath = window.location.pathname.replace(/\/$/, '');
  const vercelBase = 'https://subastas-copart-live.vercel.app';
  const currentBuyerToken = (session as any).buyer_access_token || (session as any).buyerAccessToken || 'bdr_buyer_m729k1';
  const publicRoomUrl = `${origin}${basePath}/#/sala/${session.room_token || 'copart-live-m729k1'}`;
  const brokerUrl = `${origin}${basePath}/#/sala/${session.room_token || 'copart-live-m729k1'}?broker=${session.broker_access_token || 'bdr_broker_m729k1'}`;
  const buyerUrl = publicRoomUrl;

  const handleRevokeClientAccess = async () => {
    await store.revokeParticipantAccess(session.id, 'buyer');
    showFeedback('🔒 Acceso de este cliente BLOQUEADO permanentemente. El cliente ya no puede ingresar a la sala.');
    await syncSessionData();
  };

  const handleRotateBuyerToken = async () => {
    const res = await store.rotateBuyerToken(session.id);
    if (res.success && res.buyerAccessToken) {
      setSession((prev) => ({
        ...prev,
        buyer_access_token: res.buyerAccessToken,
        buyerAccessToken: res.buyerAccessToken,
        buyer_token_revoked: false,
      }));
      const newUrl = `${vercelBase}/#/sala/${session.room_token || 'copart-live-m729k1'}?cliente=${res.buyerAccessToken}`;
      copyToClipboard(newUrl, 'buyer');
      showFeedback('✓ ¡NUEVO ENLACE DE 1 SOLO USO GENERADO Y COPIADO! El cliente anterior ha quedado bloqueado para siempre.');
      await syncSessionData();
    }
  };

  const currentPrice = Number(session.current_price ?? (session as any).currentPrice ?? 5000);
  const currentLeader = (bids && bids.length > 0 && bids[0].paddleNumber && bids[0].paddleNumber !== 'N/A')
    ? bids[0].paddleNumber
    : ((session as any).current_winner_paddle && (session as any).current_winner_paddle !== 'N/A'
        ? (session as any).current_winner_paddle
        : ((session as any).currentWinnerPaddle && (session as any).currentWinnerPaddle !== 'N/A'
            ? (session as any).currentWinnerPaddle
            : 'Esperando apertura'));

  // PUJA RÁPIDA DEDICADA DEL BROKER #101 (LIBERTAD TOTAL - CERO BLOQUEOS)
  const handleQuickBrokerBid = async (customIncrement = 250) => {
    const targetId = session.id || 'ses-live-001';
    const currPrice = Number(session.current_price ?? (session as any).currentPrice ?? 5000);
    const amount = currPrice + customIncrement;

    setSession((prev) => ({
      ...prev,
      status: 'open',
      current_price: amount,
      currentPrice: amount,
      current_winner_paddle: 'Paleta #101',
      currentWinnerPaddle: 'Paleta #101',
      time_remaining_seconds: 15,
    }));
    try {
      sounds.playBidVoice(amount, 'Paleta #101', true);
    } catch {}

    setIsSubmittingBid(true);
    if (session.status !== 'open') {
      await store.serverStartAuction(targetId);
    }
    const res = await store.submitManualBid(targetId, 'Paleta #101', amount);
    setIsSubmittingBid(false);

    if (res.success) {
      showFeedback(`⚡ Broker #101 ofertó $${amount.toLocaleString()} USD`);
      setBidAmountInput(String(amount + 50));
      await syncSessionData();
      return true;
    } else {
      showFeedback(res.error || 'Error al procesar la oferta del Broker', 'error');
      return false;
    }
  };

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
            <span>CENTRO DE MANDO</span>
          </div>

          {/* Selector de Vistas Maestras Unificadas */}
          <div className="flex items-center gap-1 bg-[#050e1e] p-0.5 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveMasterView('consola')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-black transition cursor-pointer ${
                activeMasterView === 'consola'
                  ? 'bg-amber-500 text-slate-950 shadow ring-1 ring-amber-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Gavel className="w-3 h-3" />
              <span>Subasta en Vivo</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMasterView('clientes')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                activeMasterView === 'clientes'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>Clientes</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMasterView('vehiculos')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                activeMasterView === 'vehiculos'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Car className="w-3 h-3" />
              <span>Vehículos</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMasterView('historial')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                activeMasterView === 'historial'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>Historial</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMasterView('configuracion')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                activeMasterView === 'configuracion'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Settings className="w-3 h-3" />
              <span>Configuración</span>
            </button>
          </div>

          <div className="hidden 2xl:flex items-center gap-2 text-xs">
            <a
              href={(session as any).reference_url || session.vehicle_snapshot?.reference_url || `https://www.copart.com/lot/${(session as any).lot_number || (session as any).lotNumber || session.vehicle_snapshot?.lot_number || '48291032'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 font-mono font-bold flex items-center gap-1 bg-[#051124] border border-amber-500/40 px-2 py-0.5 rounded transition hover:border-amber-400"
              title="Abrir lote en la página oficial de Copart.com (Pestaña nueva)"
            >
              <span>LOTE #{(session as any).lot_number || (session as any).lotNumber || session.vehicle_snapshot?.lot_number || '48291032'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-slate-600">•</span>
            <span className="text-white font-bold truncate max-w-xs">
              {(session as any).year || session.vehicle_snapshot?.year || 2023} {(session as any).brand || session.vehicle_snapshot?.brand || 'Ford'} {(session as any).model || session.vehicle_snapshot?.model || 'Mustang GT'}
            </span>
          </div>
        </div>

        {/* Presencia del Broker Autorizado en Sala */}
        <div className="flex items-center gap-2 text-[11px] font-mono">
          <div className={`px-2.5 py-1 rounded border flex items-center gap-1.5 transition ${
            brokerOnline ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.3)]' : 'bg-slate-900/60 text-slate-400 border-slate-800'
          }`}>
            <span className={`w-2 h-2 rounded-full ${brokerOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
            <span>Broker Oficial (Paleta #101): {brokerOnline ? 'Conectado en Sala' : 'Esperando Conexión'}</span>
          </div>
        </div>

        {/* BOTÓN MAESTRO DE INICIO Y ESTADO EN CABECERA */}
        <div className="flex items-center gap-2">
          {session.status === 'prepared' ? (
            <button
              type="button"
              id="header-btn-dar-inicio"
              onClick={handleStartAuction}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2 rounded-lg text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(52,211,153,0.7)] flex items-center gap-2 animate-bounce ring-2 ring-emerald-300 transition active:scale-95 cursor-pointer"
              title="Dar inicio a la subasta oficial (reloj de 15 segundos)"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>DAR INICIO A LA SUBASTA (15s)</span>
            </button>
          ) : session.status === 'paused' ? (
            <button
              type="button"
              id="header-btn-reanudar"
              onClick={handleResumeAuction}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-lg text-xs sm:text-sm uppercase tracking-wider shadow flex items-center gap-2 transition active:scale-95 cursor-pointer ring-2 ring-amber-300"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>REANUDAR SUBASTA</span>
            </button>
          ) : ['open', 'bidding', 'last_call'].includes(session.status) ? (
            <div className="flex items-center gap-1.5">
              <div className="bg-emerald-950/90 border border-emerald-500 text-emerald-300 font-mono font-black px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 shadow animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span>EN VIVO ({session.time_remaining_seconds ?? 15}s)</span>
              </div>
              <button
                type="button"
                onClick={handlePauseAuction}
                className="bg-amber-600 hover:bg-amber-500 text-white font-black px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider shadow flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                title="Pausar subasta"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>PAUSAR</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              id="header-btn-reiniciar"
              onClick={handleResetAuction}
              className="bg-blue-600 hover:bg-blue-500 text-white font-black px-3.5 py-1.5 rounded-lg text-xs uppercase tracking-wider shadow flex items-center gap-1.5 transition active:scale-95 cursor-pointer ring-2 ring-blue-400"
              title="Preparar y reiniciar lote para nueva subasta de 15 segundos"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>NUEVA SUBASTA / REINICIAR (15s)</span>
            </button>
          )}
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

          {/* Botón Insignias y Botones de la Foto del Vehículo */}
          <button
            type="button"
            onClick={() => setIsBadgesModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-2.5 py-1.5 rounded text-xs flex items-center gap-1.5 border border-indigo-400/50 transition shadow"
            title="Editar los botones e insignias sobre y debajo de la foto del vehículo"
          >
            <Tag className="w-3.5 h-3.5 text-amber-300" />
            <span>Insignias / Botones</span>
          </button>

          {/* Botón 6 Comprobaciones Oficiales Copart */}
          <button
            type="button"
            onClick={() => setIsVerificationModalOpen(true)}
            className="bg-[#002855] hover:bg-[#003875] text-amber-300 font-bold px-2.5 py-1.5 rounded text-xs flex items-center gap-1.5 border border-amber-500/50 transition shadow"
            title="Verificar las 6 comprobaciones de seguridad Copart: Vehículo, Subasta, Broker, Oferta, Resultado y Pago"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Auditoría 6/6 ✓</span>
          </button>

          {/* Control de Audio del Subastador */}
          <button
            type="button"
            onClick={handleToggleAudio}
            className={`px-2.5 py-1.5 rounded text-xs font-bold border flex items-center gap-1.5 transition shadow ${
              isAudioMuted
                ? 'bg-rose-950/80 border-rose-600 text-rose-300 hover:bg-rose-900'
                : 'bg-emerald-950/80 border-emerald-500 text-emerald-300 hover:bg-emerald-900'
            }`}
            title={isAudioMuted ? 'Activar sonido en consola' : 'Silenciar sonido en consola'}
          >
            {isAudioMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            <span className="font-bold">{isAudioMuted ? '🔇 Audio OFF' : '🔊 Audio ON'}</span>
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
              {session.time_remaining_seconds ?? 15}s
            </span>
          </div>

          {/* ENLACE ÚNICO DE SALA (CLIENTE & BROKER) */}
          <div className="flex items-center gap-1.5 bg-[#051124] border border-blue-500/50 p-1 rounded-xl shadow-lg">
            <span className="text-[11px] font-bold text-blue-300 hidden xl:inline px-1">
              🔗 Sala (Cliente + Broker):
            </span>

            <button
              type="button"
              onClick={() => {
                const url = `${window.location.origin}${window.location.pathname}#/sala/${session.room_token || 'copart-live-johan101'}`;
                navigator.clipboard.writeText(url);
                showFeedback('✓ Enlace de la Sala copiado al portapapeles (mismo enlace para Cliente y Broker)');
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white font-black px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 transition shadow active:scale-95 cursor-pointer"
              title="Copiar el enlace de la sala en vivo (compartido para Cliente y Broker)"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar Enlace</span>
            </button>

            <button
              type="button"
              onClick={() => setIsWhatsAppModalOpen(true)}
              className="bg-[#25D366] hover:bg-[#1EBE5D] text-slate-950 font-black px-2 py-1.5 rounded-lg text-xs flex items-center gap-1 transition shadow active:scale-95 cursor-pointer"
              title="Enviar enlace de la sala por WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <a
              href={`#/sala/${session.room_token || 'copart-live-johan101'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 transition shadow active:scale-95"
              title="Abrir la sala oficial Copart en pestaña nueva"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver Sala</span>
            </a>
          </div>

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
        {activeMasterView === 'clientes' && (
          <div className="lg:col-span-12">
            <ClientsView onOpenRoom={() => setActiveMasterView('consola')} />
          </div>
        )}
        {activeMasterView === 'vehiculos' && (
          <div className="lg:col-span-12">
            <VehiclesView />
          </div>
        )}
        {activeMasterView === 'historial' && (
          <div className="lg:col-span-12">
            <HistoryView />
          </div>
        )}
        {activeMasterView === 'configuracion' && (
          <div className="lg:col-span-12">
            <SettingsView />
          </div>
        )}
        {activeMasterView === 'consola' && (
          <>
            {/* ========================================================================= */}
            {/* BANNER MAESTRO PRINCIPAL: ESTADO DE SALA Y BOTÓN DAR INICIO A LA SUBASTA */}
            {/* ========================================================================= */}
            <div className="lg:col-span-12 bg-gradient-to-r from-[#07192e] via-[#0b274c] to-[#07192e] border-2 border-emerald-500/80 rounded-xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-4 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-lg ${
              session.status === 'open' || session.status === 'bidding' || session.status === 'last_call'
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400 animate-pulse'
                : session.status === 'paused'
                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                : session.status === 'sold'
                ? 'bg-blue-500/20 border-blue-400 text-blue-300'
                : 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
            }`}>
              <Gavel className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black uppercase tracking-wide text-white">
                  {session.status === 'prepared' ? 'SALA LISTA PARA DAR INICIO' :
                   session.status === 'open' || session.status === 'bidding' ? 'SUBASTA EN VIVO TRANSMITIENDO' :
                   session.status === 'last_call' ? 'ÚLTIMO LLAMADO (FAIR WARNING)' :
                   session.status === 'paused' ? 'SUBASTA EN PAUSA' :
                   session.status === 'sold' ? 'LOTE ADJUDICADO (VENDIDO)' : 'ESTADO: ' + session.status.toUpperCase()}
                </span>
                <span className={`text-[11px] font-mono font-black px-2.5 py-0.5 rounded border uppercase ${
                  session.status === 'open' || session.status === 'bidding' || session.status === 'last_call'
                    ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400 animate-pulse'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}>
                  RELOJ: {session.time_remaining_seconds ?? 15}s
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {session.status === 'prepared'
                  ? 'El lote y las 7 paletas están listas. Presiona el botón verde para arrancar el reloj de 15 segundos y habilitar ofertas.'
                  : session.status === 'paused'
                  ? 'La subasta está detenida temporalmente. Presiona Reanudar para continuar con la cuenta regresiva.'
                  : session.status === 'sold'
                  ? 'El lote fue adjudicado. Haz clic en "Preparar Siguiente Lote / Reiniciar" para dejar la sala lista a 15 segundos.'
                  : 'Reloj de 15 segundos corriendo en vivo. Usa las paletas de la Columna 1 o las llamadas del subastador.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {session.status === 'prepared' ? (
              <button
                type="button"
                id="btn-master-dar-inicio"
                onClick={handleStartAuction}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-3 rounded-xl text-base sm:text-lg uppercase tracking-wider shadow-[0_0_25px_rgba(52,211,153,0.8)] flex items-center gap-3 transition active:scale-95 cursor-pointer ring-4 ring-emerald-300/60 animate-bounce"
                title="Comenzar subasta oficial con cuenta regresiva de 15 segundos"
              >
                <Play className="w-6 h-6 fill-slate-950" />
                <span>DAR INICIO A LA SUBASTA (15s)</span>
              </button>
            ) : session.status === 'paused' ? (
              <button
                type="button"
                onClick={handleResumeAuction}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-5 py-2.5 rounded-xl text-sm sm:text-base uppercase tracking-wider shadow flex items-center gap-2 transition active:scale-95 cursor-pointer ring-2 ring-amber-300"
              >
                <Play className="w-5 h-5 fill-slate-950" />
                <span>REANUDAR SUBASTA</span>
              </button>
            ) : ['open', 'bidding', 'last_call'].includes(session.status) ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePauseAuction}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-black px-4 py-2.5 rounded-xl text-xs sm:text-sm uppercase tracking-wider shadow flex items-center gap-2 transition active:scale-95 cursor-pointer"
                >
                  <Pause className="w-4 h-4" />
                  <span>PAUSAR</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetAuction}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-2.5 rounded-xl text-xs uppercase tracking-wider border border-slate-700 transition"
                  title="Reiniciar a 15 segundos"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>REINICIAR (15s)</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleResetAuction}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-5 py-2.5 rounded-xl text-sm sm:text-base uppercase tracking-wider shadow flex items-center gap-2 transition active:scale-95 cursor-pointer ring-2 ring-emerald-400"
              >
                <RotateCcw className="w-5 h-5" />
                <span>PREPARAR SIGUIENTE LOTE / REINICIAR (15s)</span>
              </button>
            )}
          </div>
        </div>

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

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {OFFICIAL_PADDLES.map((p) => {
                const isSelected = selectedPaddle === p.number;
                const isLeading = (session as any).currentWinnerPaddle === p.number || (session as any).current_winner_paddle === p.number;
                const displayName = p.isBroker ? (lotBrokerName || session.broker_name || p.name) : p.name;
                const displayLoc = p.isBroker ? (lotBrokerLocation || (session as any).broker_location || p.location) : p.location;

                return (
                  <div
                    key={p.number}
                    className={`w-full p-2.5 rounded-xl border transition flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/50 shadow-xl'
                        : isLeading
                        ? 'bg-emerald-950/50 border-emerald-500/70 hover:border-emerald-400'
                        : 'bg-[#050a16] border-slate-800 hover:bg-slate-800/70 hover:border-slate-700'
                    }`}
                  >
                    <div 
                      onClick={() => setSelectedPaddle(p.number)}
                      className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                    >
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border shrink-0 ${
                        isSelected ? 'bg-amber-400 border-amber-300' : 'border-slate-600 bg-transparent'
                      }`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-mono font-black text-sm ${isSelected ? 'text-amber-300' : 'text-white'}`}>
                            {p.number}
                          </span>
                          {p.isBroker && (
                            <span className="bg-blue-600/40 text-blue-300 border border-blue-400/50 text-[9px] px-1.5 py-0.2 rounded font-black uppercase tracking-wide">
                              CLIENTE
                            </span>
                          )}
                          {isLeading && (
                            <span className="text-[9px] bg-emerald-500/30 border border-emerald-500 text-emerald-300 font-black px-1.5 py-0.2 rounded uppercase">
                              ★ LÍDER
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-300 font-medium truncate">
                          {displayName} • <span className="text-slate-400 font-mono">{displayLoc}</span>
                        </p>
                      </div>
                    </div>

                    {/* Botones de Disparo Rápido Directo en la Fila */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickPaddleBid(p.number, 100);
                        }}
                        className="bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-300 font-black text-[10px] px-2 py-1 rounded border border-slate-700 hover:border-amber-400 transition cursor-pointer"
                        title={`Pujar +$100 inmediatamente con ${p.number}`}
                      >
                        +$100
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickPaddleBid(p.number, 250);
                        }}
                        className="bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-emerald-300 font-black text-[10px] px-2 py-1 rounded border border-slate-700 hover:border-emerald-400 transition cursor-pointer"
                        title={`Pujar +$250 inmediatamente con ${p.number}`}
                      >
                        +$250
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* EDITAR PALETA #101 DIRECTAMENTE EN SALA DE OPERADOR */}
          <div className="mt-3 bg-[#050e20] p-3 rounded-xl border border-blue-500/40 shadow-lg space-y-2">
            <div className="flex items-center justify-between border-b border-blue-500/20 pb-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                CONFIGURAR PALETA #101 (DATOS DEL CLIENTE)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Única editable</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-0.5">NOMBRE DEL CLIENTE:</label>
                <input
                  type="text"
                  value={lotBrokerName}
                  onChange={(e) => setLotBrokerName(e.target.value)}
                  onBlur={handleSavePaddle101}
                  placeholder="Ej. Carlos Mendoza"
                  className="w-full bg-[#030712] border border-slate-700 focus:border-blue-400 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-0.5">DE DÓNDE ES (UBICACIÓN):</label>
                <input
                  type="text"
                  value={lotBrokerLocation}
                  onChange={(e) => setLotBrokerLocation(e.target.value)}
                  onBlur={handleSavePaddle101}
                  placeholder="Ej. Miami, FL / Houston, TX"
                  className="w-full bg-[#030712] border border-slate-700 focus:border-blue-400 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg focus:outline-none"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleSavePaddle101}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-xs py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition active:scale-95 shadow"
            >
              <Check className="w-3.5 h-3.5" />
              <span>GUARDAR DATOS PALETA #101</span>
            </button>
          </div>

          {/* Resumen del postor seleccionado */}
          <div className="mt-3 bg-[#050a16] p-2.5 rounded-xl border border-amber-500/40 text-sm flex items-center justify-between shadow">
            <span className="text-slate-300 font-medium text-xs">Postor activo para la próxima oferta:</span>
            <span className="font-mono font-black text-amber-300 text-sm">{selectedPaddle}</span>
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

              {/* CONTROL RÁPIDO DE PRESUPUESTO DEL CLIENTE */}
              <div className="mt-2.5 pt-2.5 border-t border-slate-800 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 uppercase font-semibold text-[11px]">Presupuesto Cliente:</span>
                    <strong className="text-blue-300 font-mono font-bold text-sm">
                      ${lotClientBudget.toLocaleString()} USD
                    </strong>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 uppercase font-semibold text-[11px]">Margen:</span>
                    <strong className={`font-mono font-bold text-sm ${(lotClientBudget - currentPrice) <= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      ${Math.max(0, lotClientBudget - currentPrice).toLocaleString()} USD
                    </strong>
                  </div>
                </div>

                {/* Botones de Presupuesto Rápido (1 Clic) */}
                <div className="flex items-center gap-1 mt-2 flex-wrap justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">Ajustar:</span>
                  {[5000, 7500, 10000, 15000, 20000, 30000, 50000].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => handleQuickUpdateBudget(b)}
                      className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold border transition ${
                        lotClientBudget === b
                          ? 'bg-blue-600 border-blue-400 text-white shadow'
                          : 'bg-[#081224] border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                      title={`Fijar presupuesto del cliente en $${b.toLocaleString()} USD`}
                    >
                      ${(b / 1000)}k
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setIsParamsModalOpen(true)}
                    className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-800 border border-slate-700 text-amber-300 hover:text-white"
                    title="Escribir cantidad exacta personalizada en parámetros"
                  >
                    + Personalizar
                  </button>
                </div>
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

            {/* BOTONES DE DISMINUCIÓN RÁPIDA DE PUJA */}
            <div className="mt-3">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-bold block mb-2">
                Disminuir puja:
              </span>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  id="btn-dec-50"
                  onClick={() => applyDecrement(50)}
                  className="bg-[#050a16] hover:bg-slate-800 text-slate-300 font-bold py-2 rounded-xl border border-slate-700 text-xs sm:text-sm transition active:scale-95 shadow flex items-center justify-center gap-1 cursor-pointer"
                  title="Disminuir importe en $50 USD"
                >
                  <Minus className="w-3.5 h-3.5 text-slate-400" /> $50
                </button>
                <button
                  type="button"
                  id="btn-dec-100"
                  onClick={() => applyDecrement(100)}
                  className="bg-[#050a16] hover:bg-slate-800 text-slate-300 font-bold py-2 rounded-xl border border-slate-700 text-xs sm:text-sm transition active:scale-95 shadow flex items-center justify-center gap-1 cursor-pointer"
                  title="Disminuir importe en $100 USD"
                >
                  <Minus className="w-3.5 h-3.5 text-slate-400" /> $100
                </button>
                <button
                  type="button"
                  id="btn-dec-250"
                  onClick={() => applyDecrement(250)}
                  className="bg-[#050a16] hover:bg-slate-800 text-amber-300 font-bold py-2 rounded-xl border border-slate-700 text-xs sm:text-sm transition active:scale-95 shadow flex items-center justify-center gap-1 cursor-pointer"
                  title="Disminuir importe en $250 USD"
                >
                  <Minus className="w-3.5 h-3.5 text-amber-400" /> $250
                </button>
                <button
                  type="button"
                  id="btn-dec-500"
                  onClick={() => applyDecrement(500)}
                  className="bg-[#050a16] hover:bg-slate-800 text-rose-300 font-bold py-2 rounded-xl border border-slate-700 text-xs sm:text-sm transition active:scale-95 shadow flex items-center justify-center gap-1 cursor-pointer"
                  title="Disminuir importe en $500 USD"
                >
                  <Minus className="w-3.5 h-3.5 text-rose-400" /> $500
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
              className="w-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-black py-4 px-4 rounded-2xl shadow-2xl text-base sm:text-lg flex flex-col items-center justify-center transition active:scale-95 border-b-4 border-emerald-800"
            >
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-slate-950" />
                <span>ENVIAR OFERTA CON {selectedPaddle}</span>
              </div>
              <span className="text-xs font-mono font-black text-slate-950/85 mt-0.5">
                ${Number(bidAmountInput || 0).toLocaleString()} USD
              </span>
            </button>
          </div>

          {/* SECCIÓN ESPECIAL: ACCIONES DIRECTAS DEL BROKER #101 (TU CLIENTE) */}
          <div className="mt-3 bg-[#040e1d] border-2 border-blue-500/70 p-3 rounded-xl space-y-2 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span className="font-black text-xs text-white uppercase tracking-wider">
                  OPERACIÓN BROKER #101
                </span>
              </div>

              {/* Indicador de Control Manual */}
              <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-950/70 border border-emerald-700/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                PUJAS 100% MANUALES
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickBrokerBid(Number(session.bid_increment || 250))}
                disabled={isSubmittingBid}
                className="bg-blue-600 hover:bg-blue-500 text-white font-black py-2.5 px-3 rounded-lg text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition shadow active:scale-95 cursor-pointer"
                title="Pujar de inmediato con la Paleta #101 sumando el incremento oficial"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300 fill-current" />
                <span>Pujar #101 (+${session.bid_increment || 250})</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickBrokerBid(500)}
                disabled={isSubmittingBid}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-2.5 px-3 rounded-lg text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition shadow active:scale-95 cursor-pointer"
                title="Pujar de inmediato con la Paleta #101 sumando +$500 USD"
              >
                <Flame className="w-3.5 h-3.5 text-amber-300" />
                <span>Pujar #101 (+$500)</span>
              </button>
            </div>
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
                    <span>LOTE LISTO PARA SUBASTAR</span>
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5">El lote está en preparación. Pulsa el botón para arrancar el reloj oficial de 15 segundos.</div>
                </div>
                <button
                  type="button"
                  id="btn-subastar-banner"
                  onClick={handleStartAuction}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-2.5 rounded-lg text-xs sm:text-sm uppercase tracking-wider shadow-xl transition active:scale-95 flex items-center gap-2 cursor-pointer ring-2 ring-emerald-400/50"
                  title="Comenzar subasta oficial con temporizador de 15 segundos"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>DAR INICIO A LA SUBASTA (15s)</span>
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
                  id="btn-subastar-main"
                  onClick={handleStartAuction}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 px-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-lg active:scale-95 cursor-pointer ring-2 ring-emerald-400/40"
                  title="Iniciar / Subastar este lote en vivo (Reloj oficial de 15 segundos)"
                >
                  <Play className="w-4 h-4 fill-white text-emerald-200" />
                  <span>▶ DAR INICIO (15s)</span>
                </button>

                {session.status === 'paused' ? (
                  <button
                    type="button"
                    id="btn-reanudar"
                    onClick={handleResumeAuction}
                    className="bg-amber-600 hover:bg-amber-500 text-white font-black py-3 px-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow active:scale-95 cursor-pointer"
                  >
                    <Play className="w-4 h-4" />
                    <span>Reanudar</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    id="btn-pausar"
                    onClick={handlePauseAuction}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold py-3 px-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow active:scale-95 cursor-pointer"
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
                  id="btn-sold"
                  onClick={() => handleAdjudicate('sold')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 px-3 rounded-xl text-sm flex flex-col items-center justify-center gap-1 shadow-lg transition active:scale-95 border-b-4 border-emerald-800 cursor-pointer"
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
                  id="btn-unsold"
                  onClick={() => handleAdjudicate('unsold')}
                  className="bg-rose-900 hover:bg-rose-800 text-rose-100 font-bold py-4 px-3 rounded-xl text-sm flex flex-col items-center justify-center gap-1 shadow-lg transition active:scale-95 border-b-4 border-rose-950 cursor-pointer"
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

            {/* PANEL DE CERTIFICADO Y COMPROBANTE OFICIAL PDF (SOLD) */}
            {session.status === 'sold' && (
              <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border-2 border-emerald-500/70 rounded-2xl p-4 space-y-3 mb-4 shadow-2xl animate-fadeIn">
                <div className="flex items-center justify-between border-b border-emerald-800/60 pb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <div>
                      <span className="text-xs font-black text-white uppercase tracking-wider block">
                        LOTE ADJUDICADO OFICIALMENTE
                      </span>
                      <span className="text-[10px] text-emerald-300">
                        Ganador: {currentLeader} • ${(Number(session.current_price || 5000)).toLocaleString()} USD
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500 text-slate-950 font-black uppercase">
                    SOLD
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <a
                    href={activeDocToken ? `#/documento/${activeDocToken}` : `#/sala/${session.room_token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow transition"
                    title="Abrir e imprimir el Comprobante Oficial de Adjudicación en PDF"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Ver / Imprimir PDF</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleCopyDocumentLink}
                    disabled={!activeDocToken}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs py-2.5 px-3 rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                    title="Copiar enlace seguro para enviarlo por WhatsApp o correo al cliente"
                  >
                    <Share2 className="w-4 h-4 text-amber-400" />
                    <span>{copiedDocLink ? '¡Enlace Copiado!' : 'Copiar Enlace PDF'}</span>
                  </button>
                </div>
              </div>
            )}

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
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-300 uppercase tracking-wider font-bold flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span>Cintillo de Avisos en Sala:</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    En vivo
                  </span>
                </div>

                {/* Caja de previsualización de lo que está proyectado en sala */}
                <div className="bg-[#050a16] p-2 rounded-lg border border-amber-500/40 flex items-center gap-2 mb-2 text-xs">
                  <Megaphone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-slate-400 shrink-0 font-bold text-[11px]">Proyectando:</span>
                  <span className="text-amber-300 font-bold truncate text-[11px] font-mono">{activeAnnouncement}</span>
                </div>

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
          <div className="pt-3 border-t border-slate-800 flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              id="btn-prev-lot"
              onClick={handlePrevLot}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1 transition cursor-pointer shadow"
              title="Cargar lote anterior del catálogo"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>

            <button
              type="button"
              id="btn-next-lot-quick"
              onClick={handleNextLot}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1 transition cursor-pointer shadow"
              title="Cargar siguiente lote del catálogo"
            >
              <span>Siguiente</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              id="btn-next-lot-modal"
              onClick={() => setIsNextLotModalOpen(true)}
              className="flex-1 bg-blue-700 hover:bg-blue-600 text-white font-bold py-2.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition shadow cursor-pointer whitespace-nowrap"
              title="Configurar y abrir nuevo cliente / lote completo"
            >
              <ArrowRightCircle className="w-4 h-4" />
              <span>Nuevo Lote / Cliente</span>
            </button>

            <button
              type="button"
              id="btn-reset-auction"
              onClick={handleResetAuction}
              className="bg-rose-950/70 hover:bg-rose-900 border border-rose-800/60 text-rose-200 font-bold py-2.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1 transition cursor-pointer shadow"
              title="Resetear lote inicial a estado de espera ($5,000 / 15s)"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* DOCK INFERIOR OFICIAL COPART VB3 EN CONSOLA: LISTA DE VEHÍCULOS, COLA, CARRIL, COMPARAR Y PATIO */}
        <div className="bg-[#09101c] border border-[#1b2b44] rounded-xl p-3 sm:p-4 shadow-2xl mt-4">
          
          {/* BARRA DE PESTAÑAS (TABS DEL DOCK) */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5 mb-3.5">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {/* Tab 1: Lista de vehículos */}
              <button
                type="button"
                onClick={() => setDockTab('lista')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
                  dockTab === 'lista'
                    ? 'bg-amber-500 text-slate-950 shadow-md ring-1 ring-amber-300'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>Lista de vehículos ({consoleVehicles.length})</span>
              </button>

              {/* Tab 2: Cola */}
              <button
                type="button"
                onClick={() => setDockTab('cola')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
                  dockTab === 'cola'
                    ? 'bg-blue-600 text-white shadow-md ring-1 ring-blue-300'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Cola (On-Deck)</span>
              </button>

              {/* Tab 3: Carril */}
              <button
                type="button"
                onClick={() => setDockTab('carril')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
                  dockTab === 'carril'
                    ? 'bg-blue-600 text-white shadow-md ring-1 ring-blue-300'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Carril A • Live</span>
              </button>

              {/* Tab 4: Comparar */}
              <button
                type="button"
                onClick={() => setDockTab('comparar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
                  dockTab === 'comparar'
                    ? 'bg-purple-600 text-white shadow-md ring-1 ring-purple-300'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Tag className="w-3.5 h-3.5 text-purple-200" />
                <span>Comparar</span>
              </button>

              {/* Tab 5: Patio Oficial */}
              <button
                type="button"
                onClick={() => setDockTab('patio')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
                  dockTab === 'patio'
                    ? 'bg-slate-700 text-amber-300 shadow-md ring-1 ring-amber-400'
                    : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{session.vehicle_snapshot?.location || 'FL - MIAMI NORTH'}</span>
              </button>
            </div>

            <span className="text-[11px] font-mono text-slate-400 hidden lg:inline">
              Control Autoritativo de Subastador • Sala y Pantallas sincronizadas
            </span>
          </div>

          {/* CONTENIDO TAB 1: LISTA DE VEHÍCULOS (SELECCIÓN Y SUBIDA A PANTALLA) */}
          {dockTab === 'lista' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                <span>Selecciona cualquier vehículo registrado en el inventario y pulsa <strong className="text-emerald-400 font-bold">«SUBIR A PANTALLA»</strong> para cargarlo en tiempo real:</span>
                <div className="flex items-center gap-2">
                  <span className="text-amber-300 font-mono font-bold">Modo: STANDBY (15 seg)</span>
                  <button
                    type="button"
                    onClick={() => setIsVehiclesModalOpen(true)}
                    className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition shadow"
                    title="Modificar ficha comercial, descripción, equipamiento y fotos del catálogo"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Editar Ficha Comercial / Catálogo</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {consoleVehicles.map((veh) => {
                  const currentLot = (session as any).lot_number || session.vehicle_snapshot?.lot_number;
                  const isCurrentActive = String(veh.lot_number).trim() === String(currentLot).trim() || veh.id === session.vehicle_snapshot?.id;
                  const thumb = veh.images?.[0]?.url || 'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=600&q=80';
                  const copartUrl = veh.reference_url || `https://www.copart.com/es/lot/${veh.lot_number}`;

                  return (
                    <div
                      key={veh.id}
                      className={`rounded-xl border p-3 flex flex-col justify-between transition-all ${
                        isCurrentActive
                          ? 'bg-[#002855]/40 border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg'
                          : 'bg-[#050a16] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex gap-3 mb-2.5">
                        <div className="relative w-24 h-20 rounded-lg overflow-hidden bg-black shrink-0 border border-slate-700">
                          <img
                            src={thumb}
                            alt={veh.model}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=600&q=80';
                            }}
                            className="w-full h-full object-cover"
                          />
                          {isCurrentActive && (
                            <span className="absolute top-1 left-1 bg-emerald-500 text-slate-950 font-black text-[8px] px-1.5 py-0.5 rounded shadow">
                              LIVE
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-white text-xs block truncate leading-snug">
                            {veh.year} {veh.brand} {veh.model}
                          </span>
                          <div className="flex items-center justify-between gap-1 mt-0.5">
                            <span className="text-[11px] text-amber-300 font-mono block">
                              Lote #{veh.lot_number}
                            </span>
                            <a
                              href={copartUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[10px] text-amber-400 hover:text-amber-300 underline font-mono flex items-center gap-0.5"
                              title="Abrir expediente completo del lote (Pestaña nueva)"
                            >
                              <span>Expediente</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                          <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                            {veh.primary_damage || 'Front End'} • {veh.odometer?.toLocaleString()} {veh.odometer_unit || 'mi'}
                          </span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-bold">
                              {veh.vehicle_condition === 'run_and_drive' ? 'Run & Drive' : 'Starts'}
                            </span>
                            <span className="text-[10px] font-mono text-slate-300 font-bold">
                              ${Number(veh.est_retail_value || 35000).toLocaleString()} USD
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* BOTÓN DE ACCIÓN: SUBIR A PANTALLA Y FICHA */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
                        {isCurrentActive ? (
                          <div className="flex-1 py-2 rounded-lg bg-emerald-950/80 border border-emerald-500 text-emerald-300 font-black text-xs flex items-center justify-center gap-1.5 shadow">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>✓ EN PANTALLA</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSubirAPantalla(veh)}
                            className="flex-1 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition shadow-lg active:scale-95 cursor-pointer"
                            title="Subir inmediatamente a la pantalla principal en modo PREPARADO (15s)"
                          >
                            <Zap className="w-4 h-4 fill-slate-950" />
                            <span>SUBIR A PANTALLA</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsVehiclesModalOpen(true)}
                          className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1 border border-slate-700 transition"
                          title="Ver y editar ficha comercial y observaciones de este vehículo"
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-400" />
                          <span className="hidden sm:inline">Ficha</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CONTENIDO TAB 2: COLA (ON-DECK) */}
          {dockTab === 'cola' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400">
                Orden de vehículos programados para subasta en este carril. Puedes subir cualquier lote a pantalla inmediatamente:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {consoleVehicles.map((veh, idx) => {
                  const currentLot = (session as any).lot_number || session.vehicle_snapshot?.lot_number;
                  const isCurrentActive = String(veh.lot_number).trim() === String(currentLot).trim();
                  return (
                    <div key={veh.id} className="bg-[#050a16] border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          isCurrentActive ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {isCurrentActive ? 'En Remate Actual' : `Turno #${idx + 1}`}
                        </span>
                        <span className="font-mono text-amber-300 text-xs font-bold">#{veh.lot_number}</span>
                      </div>
                      <span className="text-white font-bold text-xs truncate block mb-1">{veh.year} {veh.brand} {veh.model}</span>
                      <span className="text-slate-400 text-[11px] block mb-2.5">Valor Est.: ${Number(veh.est_retail_value || 35000).toLocaleString()} USD</span>
                      
                      {!isCurrentActive && (
                        <button
                          type="button"
                          onClick={() => handleSubirAPantalla(veh)}
                          className="py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1 transition shadow cursor-pointer"
                        >
                          <Zap className="w-3.5 h-3.5 fill-slate-950" />
                          <span>Subir a Pantalla</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CONTENIDO TAB 3: CARRIL */}
          {dockTab === 'carril' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-[#050a16] border border-slate-800 rounded-xl p-3">
                <span className="text-slate-400 block text-[11px] uppercase font-bold mb-1">Carril de Subasta:</span>
                <span className="text-white font-black text-sm block">LANE A • Transmisión Principal VB3</span>
                <span className="text-emerald-400 font-mono text-xs block mt-1">● Control Maestro Activo</span>
              </div>
              <div className="bg-[#050a16] border border-slate-800 rounded-xl p-3">
                <span className="text-slate-400 block text-[11px] uppercase font-bold mb-1">Patio de Ubicación:</span>
                <span className="text-amber-300 font-bold text-sm block">{session.vehicle_snapshot?.location || 'FL - Miami North (Yard 12)'}</span>
                <span className="text-slate-400 text-[11px] block mt-1">Opa-Locka, Florida, EE. UU.</span>
              </div>
              <div className="bg-[#050a16] border border-slate-800 rounded-xl p-3">
                <span className="text-slate-400 block text-[11px] uppercase font-bold mb-1">Representación Autorizada:</span>
                <span className="text-blue-300 font-bold text-sm block">{lotBrokerName || 'Broker Autorizado'} (Paleta #101)</span>
                <span className="text-slate-400 text-[11px] block mt-1">Comprador: {lotBuyerName || 'Cliente VIP'}</span>
              </div>
            </div>
          )}

          {/* CONTENIDO TAB 4: COMPARAR */}
          {dockTab === 'comparar' && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-2">Vehículo</th>
                    <th className="p-2">Lote</th>
                    <th className="p-2">Condición</th>
                    <th className="p-2">Odómetro</th>
                    <th className="p-2">Daño Primario</th>
                    <th className="p-2">Motor / Tracción</th>
                    <th className="p-2">Valor Estimado</th>
                    <th className="p-2 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {consoleVehicles.map((v) => {
                    const currentLot = (session as any).lot_number || session.vehicle_snapshot?.lot_number;
                    const isCurrent = String(v.lot_number).trim() === String(currentLot).trim();
                    return (
                      <tr key={v.id} className={isCurrent ? 'bg-emerald-950/20' : 'hover:bg-slate-900/40'}>
                        <td className="p-2 font-bold text-white">{v.year} {v.brand} {v.model}</td>
                        <td className="p-2 font-mono text-amber-300">#{v.lot_number}</td>
                        <td className="p-2">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-bold">
                            {v.vehicle_condition === 'run_and_drive' ? 'Run & Drive' : 'Starts'}
                          </span>
                        </td>
                        <td className="p-2 font-mono text-slate-300">{v.odometer?.toLocaleString()} {v.odometer_unit || 'mi'}</td>
                        <td className="p-2 text-slate-300">{v.primary_damage || 'N/A'}</td>
                        <td className="p-2 text-slate-400">{v.engine || '2.4L'} • {v.drivetrain || '4WD'}</td>
                        <td className="p-2 font-mono text-emerald-400 font-bold">${Number(v.est_retail_value || 35000).toLocaleString()} USD</td>
                        <td className="p-2 text-right">
                          {isCurrent ? (
                            <span className="text-emerald-400 font-bold text-[11px]">En Pantalla</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSubirAPantalla(v)}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-[11px] transition shadow cursor-pointer"
                            >
                              Subir
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* CONTENIDO TAB 5: PATIO (FL - MIAMI NORTH / ATLANTA EAST) */}
          {dockTab === 'patio' && (
            <div className="bg-[#050a16] border border-slate-800 rounded-xl p-4 text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-base font-black text-white">{session.vehicle_snapshot?.location || 'FL - Miami North (Yard 12)'}</span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold text-[11px] border border-emerald-700/60">
                  Patio Oficial Copart Activo
                </span>
              </div>
              <p className="text-slate-300">
                Instalación oficial autorizada Copart para subastas en vivo VB3. Los vehículos listados en este carril se encuentran inspeccionados físicamente en las instalaciones de patio antes de la emisión del martillo.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] font-mono text-slate-400">
                <div>Terminal: <strong className="text-amber-300">VB3-MIA-012</strong></div>
                <div>Horario: <strong className="text-slate-200">Lunes a Viernes</strong></div>
                <div>Inspección: <strong className="text-emerald-400">Certificada 6/6</strong></div>
                <div>Carril Activo: <strong className="text-white">LANE A</strong></div>
              </div>
            </div>
          )}

        </div>
          </>
        )}
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
              type="button"
              onClick={() => copyToClipboard(publicRoomUrl, 'buyer')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-3.5 py-1.5 rounded text-xs flex items-center gap-1.5 transition shadow active:scale-95 cursor-pointer ring-1 ring-emerald-300/40"
              title="Copiar enlace oficial de la sala en vivo para el cliente (100% probado y garantizado)"
            >
              {copiedKey === 'buyer' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>📱 Copiar Enlace Oficial Cliente</span>
            </button>
            <button
              type="button"
              onClick={() => copyToClipboard(brokerUrl, 'broker')}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3.5 py-1.5 rounded text-xs flex items-center gap-1.5 transition shadow active:scale-95 cursor-pointer"
              title="Copiar enlace de la terminal para el Broker Autorizado (Paleta #101 con botones de puja)"
            >
              {copiedKey === 'broker' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>👨‍💼 Copiar Enlace Broker (#101)</span>
            </button>
            <button
              type="button"
              onClick={() => setIsWhatsAppModalOpen(true)}
              className="bg-[#25D366] hover:bg-[#1EBE5D] text-slate-950 font-black px-3.5 py-1.5 rounded text-xs flex items-center gap-1.5 transition shadow active:scale-95 cursor-pointer"
              title="Abrir ventana para enviar la invitación con el enlace verificado por WhatsApp al cliente con 1 clic"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Enviar por WhatsApp 📲</span>
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
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-bold block">Presupuesto Máximo Autorizado del Cliente ($ USD):</label>
                  <span className="text-xs text-blue-400 font-mono font-bold">${lotClientBudget.toLocaleString()} USD</span>
                </div>
                <input
                  type="number"
                  step="250"
                  value={lotClientBudget}
                  onChange={(e) => setLotClientBudget(Number(e.target.value) || 0)}
                  className="w-full bg-[#050a16] border border-slate-700 focus:border-amber-400 rounded-lg p-2 font-mono text-blue-300 font-bold"
                />
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[11px] text-slate-400 font-mono">Atajos rápidos:</span>
                  {[5000, 7500, 9000, 10000, 12000, 15000, 20000, 25000].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setLotClientBudget(b)}
                      className={`px-2 py-0.5 text-xs rounded border font-mono font-bold transition ${
                        lotClientBudget === b
                          ? 'bg-blue-600 border-blue-400 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-blue-300 border-slate-700'
                      }`}
                    >
                      ${b.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <label className="text-amber-300 font-bold block mb-1">Nombre del Cliente / Postor (Paleta #101):</label>
                <input
                  type="text"
                  value={lotBrokerName}
                  onChange={(e) => setLotBrokerName(e.target.value)}
                  placeholder="Ej. Carlos Mendoza, Edwin Rivas"
                  className="w-full bg-[#050a16] border border-slate-700 focus:border-amber-400 rounded-lg p-2 font-sans text-white font-bold"
                />
              </div>

              <div>
                <label className="text-blue-300 font-bold block mb-1">De dónde es / Ubicación (Paleta #101):</label>
                <input
                  type="text"
                  value={lotBrokerLocation}
                  onChange={(e) => setLotBrokerLocation(e.target.value)}
                  placeholder="Ej. Miami, FL / Houston, TX"
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

              {/* SECCIÓN CRÍTICA: ENLACE REAL DEL LOTE EN COPART Y NÚMERO DE LOTE */}
              <div className="pt-2 border-t border-slate-800 space-y-2.5">
                <div className="bg-[#002855]/60 border border-blue-500/50 p-3 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-amber-400 shrink-0" />
                    <label className="text-amber-300 font-black text-xs block">
                      Enlace Oficial del Lote (Publicación Completa del Vehículo):
                    </label>
                  </div>
                  <input
                    type="url"
                    value={lotReferenceUrl}
                    onChange={(e) => setLotReferenceUrl(e.target.value)}
                    placeholder="https://www.copart.com/es/lot/61682336"
                    className="w-full bg-[#050a16] border border-blue-500/80 focus:border-amber-400 rounded-lg p-2 font-mono text-xs text-white"
                  />
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Pega aquí el enlace del auto a subastar. Tanto el Broker como el Cliente tendrán el botón directo <strong>«VER VEHÍCULO COMPLETO ↗»</strong> para abrirlo en nueva pestaña, revisar todas las fotos, videos, condición y ficha técnica, y luego regresar a esta sala listos para la subasta.
                  </p>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Número de Lote Copart (#):</label>
                  <input
                    type="text"
                    value={lotNumberInput}
                    onChange={(e) => setLotNumberInput(e.target.value)}
                    placeholder="Ej. 61682336"
                    className="w-full bg-[#050a16] border border-slate-700 focus:border-amber-400 rounded-lg p-2 font-mono text-amber-400 font-bold text-xs"
                  />
                </div>
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

      {/* MODAL PARA EDITAR BOTONES E INSIGNIAS DEL VEHÍCULO */}
      {isBadgesModalOpen && (
        <VehicleBadgesModal
          vehicle={(session.vehicle_snapshot || (session as any).vehicle || {}) as any}
          isOpen={isBadgesModalOpen}
          onClose={() => setIsBadgesModalOpen(false)}
          onSave={handleSaveBadges}
        />
      )}

      {/* MODAL OFICIAL: 6 COMPROBACIONES DE SEGURIDAD COPART */}
      <CopartVerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        vehicle={session.vehicle_snapshot || (session as any).vehicle}
        brokerName={lotBrokerName || 'Broker Oficial Copart'}
        paddleNumber="101"
        currentPrice={currentPrice}
      />

      {/* MODAL PARA ENVIAR INVITACIÓN POR WHATSAPP AL CLIENTE */}
      <WhatsAppInviteModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        buyerUrl={buyerUrl}
        vehicle={session.vehicle_snapshot || (session as any).vehicle}
        buyerName={lotBuyerName || 'Cliente VIP'}
        lotNumber={(session as any).lot_number || (session as any).lotNumber || session.vehicle_snapshot?.lot_number || '48291032'}
        yardLocation={session.vehicle_snapshot?.location || 'Atlanta East Yard 12 (Georgia, USA)'}
        paddleNumber="101"
      />
    </div>
  );
};

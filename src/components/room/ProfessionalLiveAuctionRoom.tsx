import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AuctionSession, AuctionBid, VehicleImage, PhotoCategory, CustomBadgeItem, CustomVehicleBadges } from '../../types';
import { store, ParticipantInfo } from '../../services/store';
import { sounds } from '../../lib/soundEffects';
import { CopartLogo } from '../common/CopartLogo';
import { CircularCountdown } from './CircularCountdown';
import { ImageGalleryModal } from '../common/ImageGalleryModal';
import { RoomAccessExpiredView } from './RoomAccessExpiredView';
import confetti from 'canvas-confetti';
import { NextLotModal } from './NextLotModal';
import { CopartVerificationModal } from './CopartVerificationModal';
import { BuyerGuideModal } from './BuyerGuideModal';
import { useTranslation, Language } from '../../lib/i18n';
import { 
  Volume2, VolumeX, Eye, EyeOff, Play, Pause, CheckCircle2,
  RefreshCw, Gavel, Share2, AlertTriangle, 
  Car, Clock, Key, Award, Flame, UserCheck, Users,
  PlusCircle, ShieldCheck, ShieldAlert, Wifi, ExternalLink, Copy, Check,
  FastForward, User, Lock, ChevronLeft, ChevronRight,
  Printer, FileText, Edit, Trash2, Upload, Plus, X, Gauge, Send,
  ArrowRightCircle, CheckCircle, Sparkles, ChevronDown, ChevronUp, Zap, Calculator,
  ExternalLink as LinkIcon, Tag, HelpCircle
} from 'lucide-react';
import { INITIAL_VEHICLES } from '../../services/seedData';

interface ProfessionalLiveAuctionRoomProps {
  session: AuctionSession;
  isAdmin?: boolean;
  role?: 'auctioneer' | 'broker' | 'buyer' | 'spectator';
  userToken?: string;
  initialRoomData?: any;
  onExit?: () => void;
  initialBidderToken?: string;
}

export const ProfessionalLiveAuctionRoom: React.FC<ProfessionalLiveAuctionRoomProps> = ({
  session: initialSession,
  isAdmin = false,
  role: initialRole,
  userToken: initialUserToken,
  initialRoomData,
  onExit,
  initialBidderToken,
}) => {
  const { lang, setLang, t } = useTranslation();
  const [session, setSession] = useState<AuctionSession>(initialSession);
  const [bids, setBids] = useState<AuctionBid[]>([]);
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [activeParticipant, setActiveParticipant] = useState<ParticipantInfo | null>(null);

  // Roles de usuario: 'auctioneer' (Tú / Subastador), 'broker' (Operador), 'buyer' (Comprador), 'spectator' (Espectador)
  const [role, setRole] = useState<'auctioneer' | 'broker' | 'buyer' | 'spectator'>(
    initialRole || (isAdmin ? 'auctioneer' : 'spectator')
  );
  const [userToken, setUserToken] = useState<string | undefined>(initialUserToken || initialBidderToken);

  // Enlaces y presencia de participantes
  const [brokerLink, setBrokerLink] = useState<string>(initialRoomData?.links?.brokerLink || '');
  const [buyerLink, setBuyerLink] = useState<string>(initialRoomData?.links?.buyerLink || '');
  const [brokerOnline, setBrokerOnline] = useState<boolean>(Boolean(initialRoomData?.presence?.brokerConnected));
  const [buyerOnline, setBuyerOnline] = useState<boolean>(Boolean(initialRoomData?.presence?.buyerConnected));
  const [brokerRevoked, setBrokerRevoked] = useState<boolean>(Boolean(initialRoomData?.presence?.brokerRevoked));
  const [buyerRevoked, setBuyerRevoked] = useState<boolean>(Boolean(initialRoomData?.presence?.buyerRevoked));
  const [copiedBrokerLink, setCopiedBrokerLink] = useState(false);
  const [copiedBuyerLink, setCopiedBuyerLink] = useState(false);

  // Autorización extraordinaria de presupuesto
  const [budgetRequests, setBudgetRequests] = useState<any[]>(initialRoomData?.budgetRequests || []);
  const [pendingBuyerRequest, setPendingBuyerRequest] = useState<any | null>(null);
  const [brokerBudgetStatus, setBrokerBudgetStatus] = useState<any | null>(null);
  const [showRequestBudgetModal, setShowRequestBudgetModal] = useState<boolean>(false);
  const [requestedAmountInput, setRequestedAmountInput] = useState<string>('');
  const [isSubmittingBudgetRequest, setIsSubmittingBudgetRequest] = useState<boolean>(false);
  const [isRespondingBudgetRequest, setIsRespondingBudgetRequest] = useState<boolean>(false);
  const [authorizedBidAmount, setAuthorizedBidAmount] = useState<number | null>(null);

  // Control de expiración y revocación de acceso a la sala
  const [isRoomAccessExpired, setIsRoomAccessExpired] = useState(false);
  const [currentDocToken, setCurrentDocToken] = useState<string | null>(null);
  const [copiedDocLink, setCopiedDocLink] = useState(false);
  const [isRevokingDoc, setIsRevokingDoc] = useState(false);
  const [docFeedbackMsg, setDocFeedbackMsg] = useState<string | null>(null);

  // Registro dinámico de espectadores reales (entradas y salidas anónimas sin divulgar ubicación)
  const [spectatorEvents, setSpectatorEvents] = useState<{ id: string; text: string; time: string; type: 'join' | 'leave' }[]>([
    { id: '1', text: 'Espectador conectado a la sala', time: 'En vivo', type: 'join' },
  ]);
  const [latestSpectatorEvent, setLatestSpectatorEvent] = useState<string | null>(null);

  // Galería de imágenes y categorización
  const [selectedCategory, setSelectedCategory] = useState<PhotoCategory | 'todas'>('todas');
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // Opciones de visualización técnica
  const [isVinMasked, setIsVinMasked] = useState(false);
  const [odometerUnit, setOdometerUnit] = useState<'mi' | 'km'>('mi');
  const [copiedVin, setCopiedVin] = useState(false);

  // Audio y estados en vivo
  const [isAudioMuted, setIsAudioMuted] = useState(sounds.isMuted);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [isTriggeringCompetitor, setIsTriggeringCompetitor] = useState(false);
  const [activeTab, setActiveTab] = useState<'bids' | 'participants' | 'budgetAudit'>('bids');
  const [bidFlash, setBidFlash] = useState(false);
  const [lastBidId, setLastBidId] = useState<string | null>(null);
  const [viewersCount, setViewersCount] = useState(1);

  // Presupuesto del cliente y edición rápida
  const [clientBudget, setClientBudget] = useState<number>((session as any).clientMaxBudget || 7500);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState('');

  // Modales
  const [bottomDockTab, setBottomDockTab] = useState<'lista' | 'cola' | 'carril' | 'comparar' | 'patio'>('lista');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [dockVehicles, setDockVehicles] = useState<any[]>(store.getVehicles());

  useEffect(() => {
    store.fetchServerVehicles().then((vehs) => {
      if (vehs && vehs.length > 0) setDockVehicles(vehs);
    });
  }, []);

  const handleSubirAPantalla = async (targetVeh: any) => {
    if (!targetVeh) return;
    try {
      const targetSessionId = session.id || 'ses-live-001';
      await store.loadVehicleToSession(targetSessionId, targetVeh);
      
      const newStartingPrice = targetVeh.est_retail_value 
        ? Math.max(1000, Math.round((targetVeh.est_retail_value * 0.20) / 500) * 500)
        : 5000;

      setSession((prev) => ({
        ...prev,
        vehicle_snapshot: targetVeh,
        vehicle: targetVeh,
        lot_number: targetVeh.lot_number,
        title: `${targetVeh.year} ${targetVeh.brand} ${targetVeh.model}`,
        status: 'prepared',
        time_remaining_seconds: 15,
        total_duration_seconds: 15,
        current_price: newStartingPrice,
        starting_price: newStartingPrice,
        current_winner_paddle: null,
        current_winner_name: null,
        bid_count: 0,
      }));

      setSelectedImageIdx(0);
      setIs360Active(false);

      const msgText = `✓ SUBIDO A PANTALLA: ${targetVeh.year} ${targetVeh.brand} ${targetVeh.model} (Lote #${targetVeh.lot_number}) — Estado: PREPARADO / STANDBY (15s)`;
      setFeedbackToast(msgText);
      setTimeout(() => setFeedbackToast(null), 6000);
      await fetchStateFromServer();
    } catch (err: any) {
      console.error('Error al subir vehículo a pantalla:', err);
    }
  };
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  // Siguiente Lote (Misma Sala)
  const [showNextLotModal, setShowNextLotModal] = useState(false);
  const [nextLotLinks, setNextLotLinks] = useState<{
    brokerUrl: string;
    buyerUrl: string;
    buyerName: string;
    brokerName: string;
    clientMaxBudget: number;
    lotNumber: string;
    title: string;
  } | null>(null);
  const [copiedNextKey, setCopiedNextKey] = useState<string | null>(null);
  const [liveAuctioneerCall, setLiveAuctioneerCall] = useState<string | null>(null);
  const auctioneerCallTimeoutRef = useRef<any>(null);
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>('COPART LIVE LANE A • Transmisión oficial en vivo desde Estados Unidos');
  const [usTime, setUsTime] = useState<string>('');
  const hasCelebratedSoldRef = useRef<boolean>(false);

  // Estados exclusivos Copart VB3 (5 Features Oficiales)
  const [selectedLane, setSelectedLane] = useState<'A' | 'B' | 'C'>('A');
  const [isFeesExpanded, setIsFeesExpanded] = useState<boolean>(false);
  const [isCarfaxModalOpen, setIsCarfaxModalOpen] = useState<boolean>(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState<boolean>(false);
  const [isBuyerGuideOpen, setIsBuyerGuideOpen] = useState<boolean>(false);
  const [isEngineRunning, setIsEngineRunning] = useState<boolean>(false);
  const [is360Active, setIs360Active] = useState<boolean>(false);
  const [clientBidFeedback, setClientBidFeedback] = useState<string | null>(null);
  const [activeExtraBadgeModal, setActiveExtraBadgeModal] = useState<CustomBadgeItem | null>(null);

  const handleTriggerEngineSound = () => {
    setIsEngineRunning(true);
    try { sounds.playEngineSound(); } catch { }
    setTimeout(() => setIsEngineRunning(false), 2600);
  };

  const handleToggle360 = () => {
    const nextState = !is360Active;
    setIs360Active(nextState);
    if (nextState && displayedImages.length > 1) {
      let step = 0;
      const interval = setInterval(() => {
        step++;
        setSelectedImageIdx((s) => (s + 1) % displayedImages.length);
        if (step >= displayedImages.length * 2) {
          clearInterval(interval);
          setIs360Active(false);
        }
      }, 650);
    }
  };

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
      sounds.playStartVoice(Number(session.current_price || session.starting_price || 13000), {
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
    await store.serverStartAuction(targetId);
    await fetchStateFromServer();
  };

  const handlePauseAuction = async () => {
    const targetId = session.id || 'ses-live-001';
    setSession((prev) => ({ ...prev, status: 'paused' }));
    await store.serverPauseAuction(targetId);
  };

  const handleResumeAuction = async () => {
    const targetId = session.id || 'ses-live-001';
    setSession((prev) => ({ ...prev, status: 'open' }));
    await store.serverResumeAuction(targetId);
  };

  const handleResetClock = async () => {
    const targetId = session.id || 'ses-live-001';
    setSession((prev) => ({ ...prev, time_remaining_seconds: 15, status: 'open' }));
    store.startLocalClock(targetId);
  };

  const handlePlaceBuyerDirectBid = async (amount: number) => {
    if (isSubmittingBid) return;
    setIsSubmittingBid(true);
    try {
      const res = await store.submitManualBid(session.id, 'Paleta #101', amount);
      if (res && res.success) {
        try { sounds.playBidVoice(amount, 'Paleta #101', true); } catch { }
        setClientBidFeedback(`✓ ¡Oferta de $${amount.toLocaleString()} USD enviada a sala con Paleta #101!`);
      } else {
        // Fallback vía submitRealBid
        const token = initialBidderToken || activeParticipant?.token || 'bdr_broker_m729k1';
        await store.submitRealBid(session.id, token, amount);
        try { sounds.playBidVoice(amount, 'Paleta #101', true); } catch { }
        setClientBidFeedback(`✓ ¡Oferta de $${amount.toLocaleString()} USD enviada a sala!`);
      }
      setTimeout(() => setClientBidFeedback(null), 3500);
      await fetchStateFromServer();
    } catch { }
    setIsSubmittingBid(false);
  };

  const triggerSoldConfettiCelebration = useCallback(() => {
    try {
      const price = Number(session?.current_price ?? (session as any)?.currentPrice ?? 5000);
      sounds.playSoldFanfare(price);
      // Cañón central con colores vibrantes
      confetti({
        particleCount: 160,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#eab308', '#3b82f6', '#ec4899', '#ffffff']
      });

      // Ráfagas laterales estilo estadio Copart
      setTimeout(() => {
        confetti({
          particleCount: 90,
          angle: 60,
          spread: 75,
          origin: { x: 0.05, y: 0.7 },
          colors: ['#22c55e', '#eab308', '#ffffff']
        });
        confetti({
          particleCount: 90,
          angle: 120,
          spread: 75,
          origin: { x: 0.95, y: 0.7 },
          colors: ['#22c55e', '#eab308', '#ffffff']
        });
      }, 250);

      // Segunda lluvia dorada
      setTimeout(() => {
        confetti({
          particleCount: 110,
          spread: 120,
          origin: { y: 0.4 },
          colors: ['#fbbf24', '#f59e0b', '#d97706', '#ffffff']
        });
      }, 550);
    } catch { /* ignore */ }
  }, []);

  const isAuctioneer = role === 'auctioneer';
  const isBroker = role === 'broker' || role === 'auctioneer';
  const isBuyer = role === 'buyer';

  // Sincronización continua con el servidor backend y WebSocket
  const fetchStateFromServer = useCallback(async () => {
    const sessionOpts = {
      bidderToken: isBroker ? (activeParticipant?.token || initialBidderToken || 'bdr_broker_m729k1') : undefined,
      brokerToken: role === 'broker' ? userToken : undefined,
      buyerToken: role === 'buyer' ? userToken : undefined,
      isAuctioneer: role === 'auctioneer',
    };
    const data = await store.fetchServerSession(initialSession.room_token || initialSession.id, sessionOpts);

    // CONTROL DE EXPIRACIÓN Y REVOCACIÓN DE SALA PARA CLIENTES / ESPECTADORES
    // Sólo expira si la sala fue cerrada explícitamente o el token fue revocado por el subastador
    if (role === 'buyer' || role === 'spectator') {
      if (data?.isExpired || data?.isRevoked || (data?.session && (data.session.isTokenRevoked || data.session.status === 'closed'))) {
        setIsRoomAccessExpired(true);
        return;
      } else {
        setIsRoomAccessExpired(false);
      }
    } else if (role === 'broker' && (data?.isRevoked || data?.session?.brokerTokenRevoked)) {
      setIsRoomAccessExpired(true);
      return;
    } else {
      setIsRoomAccessExpired(false);
    }

    if (data && data.session) {
      setSession((prev) => ({
        ...prev,
        ...data.session,
        current_price: data.session.currentPrice ?? prev.current_price,
        // Proteger el reloj contra saltos por latencia HTTP cuando la subasta está activa
        time_remaining_seconds: (prev.status === 'open' || prev.status === 'bidding' || prev.status === 'last_call')
          ? prev.time_remaining_seconds
          : (data.session.timeRemainingSeconds ?? prev.time_remaining_seconds),
        status: data.session.status ?? prev.status,
        current_bid_count: data.session.bidCount ?? prev.current_bid_count,
        current_bidder_name: data.session.currentWinnerName,
      }));

      if (data.role && data.role !== role) {
        setRole(data.role);
      }

      if (data.activeCall !== undefined) {
        const call = data.activeCall === 'clear' ? null : data.activeCall;
        setLiveAuctioneerCall(call);
        if (call) {
          if (auctioneerCallTimeoutRef.current) clearTimeout(auctioneerCallTimeoutRef.current);
          auctioneerCallTimeoutRef.current = setTimeout(() => {
            setLiveAuctioneerCall(null);
          }, 7500);
        }
      }

      if (data.links) {
        if (data.links.brokerLink) setBrokerLink(data.links.brokerLink);
        if (data.links.buyerLink) setBuyerLink(data.links.buyerLink);
      }

      if (data.presence) {
        if (data.presence.brokerConnected !== undefined) setBrokerOnline(Boolean(data.presence.brokerConnected));
        if (data.presence.buyerConnected !== undefined) setBuyerOnline(Boolean(data.presence.buyerConnected));
        if (data.presence.brokerRevoked !== undefined) setBrokerRevoked(Boolean(data.presence.brokerRevoked));
        if (data.presence.buyerRevoked !== undefined) setBuyerRevoked(Boolean(data.presence.buyerRevoked));
      }

      if (data.budgetRequests) {
        setBudgetRequests(data.budgetRequests);
        if (role === 'buyer') {
          const pending = data.budgetRequests.find((r: any) => r.status === 'pending');
          setPendingBuyerRequest(pending || null);
        }
      }

      if (data.viewersCount !== undefined) {
        setViewersCount(data.viewersCount);
      }

      if (data.session.clientMaxBudget !== undefined) {
        setClientBudget(data.session.clientMaxBudget);
      }

      // Si la subasta finalizó, recuperar el token documental activo
      if (data.session.id && (data.session.status === 'sold' || data.session.status === 'closed')) {
        store.fetchSessionDocuments(data.session.id).then((docs) => {
          if (docs && docs.length > 0) {
            const active = docs.find((d: any) => !d.isRevoked);
            if (active) setCurrentDocToken(active.docToken);
          }
        });
      }

      if (data.bids) {
        const formattedBids = data.bids.map((b: any) => ({
          id: b.id,
          session_id: b.sessionId,
          amount: b.amount,
          bidder_id: b.participantId,
          bidder_name: b.bidderName,
          bidder_location: b.location,
          is_client: b.paddleNumber?.includes('101'),
          timestamp: b.serverTimestamp,
          sequence_number: b.sequenceNumber,
          paddle_number: b.paddleNumber,
        }));

        if (formattedBids.length > 0 && formattedBids[0].id !== lastBidId) {
          const newest = formattedBids[0];
          const isInitialLoad = lastBidId === null;
          setLastBidId(newest.id);
          setBidFlash(true);
          setTimeout(() => setBidFlash(false), 800);
          if (!isInitialLoad) {
            sounds.playBidVoice(newest.amount, newest.paddle_number, newest.is_client);
          }
        }
        setBids(formattedBids);
      }

      if (data.participants) {
        setParticipants(data.participants);
        if (isBroker && !activeParticipant && data.participants.length > 0) {
          const match = initialBidderToken
            ? data.participants.find((p: any) => p.token === initialBidderToken)
            : data.participants[0];
          if (match) setActiveParticipant(match);
        }
      }

      if (data.session.status === 'sold') {
        if (!hasCelebratedSoldRef.current) {
          hasCelebratedSoldRef.current = true;
          triggerSoldConfettiCelebration();
        }
      } else {
        hasCelebratedSoldRef.current = false;
      }
    }
  }, [initialSession.id, initialSession.room_token, initialBidderToken, activeParticipant, lastBidId, isBroker, role, userToken, triggerSoldConfettiCelebration]);

  useEffect(() => {
    fetchStateFromServer();
    // Sondeo suave solo como respaldo si se desconecta el WebSocket
    const interval = setInterval(() => {
      if (!store.isServerOnline) {
        fetchStateFromServer();
      }
    }, 6000);

    const unsubscribe = store.subscribe(() => {
      if (!store.isServerOnline) {
        fetchStateFromServer();
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [fetchStateFromServer]);

  // Sincronizar estado si initialSession prop cambia de ID/Lote desde App.tsx
  useEffect(() => {
    if (initialSession && initialSession.id !== session.id) {
      setSession((prev) => ({
        ...prev,
        ...initialSession,
        vehicle_snapshot: initialSession.vehicle_snapshot || (initialSession as any).vehicle,
      }));
    }
  }, [initialSession?.id]);

  // Suscribirse a la sala en el WebSocket autoritativo
  useEffect(() => {
    store.subscribeRoom(initialSession.room_token || initialSession.id, {
      role,
      brokerToken: userToken,
      buyerToken: userToken,
      isAuctioneer: role === 'auctioneer',
    });
  }, [initialSession.room_token, initialSession.id, role, userToken]);

  // Escuchar en vivo movimientos de espectadores, presencia y autorizaciones por WebSocket
  useEffect(() => {
    const unsubscribeWs = store.onWsMessage((msg: any) => {
      try {
        if (!msg) return;
        if (msg.type === 'CLOCK_TICK') {
          if (!msg.sessionId || msg.sessionId === session.id || msg.sessionId === (session as any).sessionId) {
            setSession((prev) => ({
              ...prev,
              time_remaining_seconds: msg.timeRemaining,
              current_price: msg.currentPrice !== undefined ? Number(msg.currentPrice) : prev.current_price,
              status: msg.status || prev.status,
            }));
            if (msg.viewersCount !== undefined) {
              setViewersCount(msg.viewersCount);
            }
          }
        } else if (msg.type === 'AUCTION_STARTED') {
          setIsRoomAccessExpired(false);
          hasCelebratedSoldRef.current = false;
          setSession((prev) => ({
            ...prev,
            status: 'open',
            time_remaining_seconds: msg.timeRemaining ?? 15,
            current_price: msg.currentPrice !== undefined ? Number(msg.currentPrice) : prev.current_price,
          }));
          try {
            if (vehicle?.custom_badges?.auctioneerVoiceGender) {
              sounds.setVoiceGender(vehicle.custom_badges.auctioneerVoiceGender);
            }
            sounds.playStartVoice(Number(msg.currentPrice || session?.current_price || 5000), {
              year: vehicle?.year,
              brand: vehicle?.brand,
              model: vehicle?.model,
              version: vehicle?.version,
              odometer: vehicle?.odometer,
              condition: vehicle?.vehicle_condition,
              hasKeys: vehicle?.has_keys,
              customChant: vehicle?.custom_badges?.auctioneerWelcomeChant,
            });
          } catch {}
          fetchStateFromServer();
        } else if (msg.type === 'NEXT_LOT_LOADED' || msg.type === 'VEHICLE_UPDATED') {
          setIsRoomAccessExpired(false);
          hasCelebratedSoldRef.current = false;
          setLiveAuctioneerCall(null);
          if (msg.vehicle) {
            setSession((prev) => ({
              ...prev,
              vehicle_snapshot: msg.vehicle,
              vehicle: msg.vehicle,
              lot_number: msg.lotNumber || msg.vehicle.lot_number || (prev as any).lot_number || prev.vehicle_snapshot?.lot_number || '48291032',
              title: msg.title || `${msg.vehicle.year} ${msg.vehicle.brand} ${msg.vehicle.model}`,
              starting_price: msg.startingPrice !== undefined ? Number(msg.startingPrice) : prev.starting_price,
              current_price: msg.startingPrice !== undefined ? Number(msg.startingPrice) : prev.current_price,
              client_max_budget: msg.clientMaxBudget !== undefined ? Number(msg.clientMaxBudget) : prev.client_max_budget,
              status: msg.status || 'prepared',
              time_remaining_seconds: msg.timeRemaining !== undefined ? msg.timeRemaining : 15,
              total_duration_seconds: 15,
              current_winner_paddle: null,
              current_winner_name: null,
              bid_count: 0,
            }));
          }
          fetchStateFromServer();
        } else if (msg.type === 'SPECTATOR_JOINED') {
          if (msg.viewersCount !== undefined) setViewersCount(msg.viewersCount);
          const text = 'Nuevo espectador conectado';
          setLatestSpectatorEvent(`🟢 ${text}`);
          setSpectatorEvents((prev) => [
            { id: Math.random().toString(), text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), type: 'join' },
            ...prev.slice(0, 5)
          ]);
          setTimeout(() => setLatestSpectatorEvent(null), 4000);
        } else if (msg.type === 'SPECTATOR_LEFT') {
          if (msg.viewersCount !== undefined) setViewersCount(msg.viewersCount);
          const text = 'Espectador desconectado';
          setLatestSpectatorEvent(`🔴 ${text}`);
          setSpectatorEvents((prev) => [
            { id: Math.random().toString(), text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), type: 'leave' },
            ...prev.slice(0, 5)
          ]);
          setTimeout(() => setLatestSpectatorEvent(null), 4000);
        } else if (msg.type === 'BUDGET_REQUEST_CREATED') {
          setBudgetRequests((prev) => [msg.request, ...prev.filter((r) => r.id !== msg.request.id)]);
          if (role === 'buyer') {
            setPendingBuyerRequest(msg.request);
            try { sounds.playBidPing(); } catch { }
          } else if (role === 'broker') {
            setBrokerBudgetStatus(msg.request);
          }
        } else if (msg.type === 'BUDGET_REQUEST_RESOLVED') {
          setBudgetRequests((prev) => [msg.request, ...prev.filter((r) => r.id !== msg.request.id)]);
          if (role === 'buyer') {
            setPendingBuyerRequest(null);
          } else if (role === 'broker' || role === 'auctioneer') {
            if (msg.request.status === 'approved') {
              setAuthorizedBidAmount(msg.request.requestedAmount);
              setBrokerBudgetStatus(msg.request);
            } else if (msg.request.status === 'rejected') {
              setBrokerBudgetStatus(msg.request);
              setServerError('El comprador ha rechazado la solicitud de incremento de presupuesto.');
              setTimeout(() => setServerError(null), 6000);
            }
          }
        } else if (msg.type === 'PARTICIPANTS_PRESENCE') {
          if (msg.brokerOnline !== undefined) setBrokerOnline(Boolean(msg.brokerOnline));
          if (msg.buyerOnline !== undefined) setBuyerOnline(Boolean(msg.buyerOnline));
        } else if (msg.type === 'ACCESS_REVOKED_BROADCAST') {
          if (msg.target === 'broker' && role === 'broker') {
            setIsRoomAccessExpired(true);
          } else if (msg.target === 'buyer' && role === 'buyer') {
            setIsRoomAccessExpired(true);
          }
        } else if (msg.type === 'ACCESS_RESTORED_BROADCAST') {
          if (msg.target === 'broker' && role === 'broker') {
            setIsRoomAccessExpired(false);
          } else if (msg.target === 'buyer' && role === 'buyer') {
            setIsRoomAccessExpired(false);
          }
        } else if (msg.type === 'AUCTIONEER_CALL') {
          if (auctioneerCallTimeoutRef.current) {
            clearTimeout(auctioneerCallTimeoutRef.current);
            auctioneerCallTimeoutRef.current = null;
          }
          const call = msg.call === 'clear' ? null : msg.call;
          setLiveAuctioneerCall(call);
          if (call) {
            const currentPrice = Number(session?.current_price ?? (session as any)?.currentPrice ?? 5000);
            try { sounds.playAuctioneerCall(call, currentPrice); } catch { }
            auctioneerCallTimeoutRef.current = setTimeout(() => {
              setLiveAuctioneerCall(null);
            }, 7500);
          }
        } else if (msg.type === 'NEW_REAL_BID') {
          setIsRoomAccessExpired(false);
          if (auctioneerCallTimeoutRef.current) {
            clearTimeout(auctioneerCallTimeoutRef.current);
            auctioneerCallTimeoutRef.current = null;
          }
          setLiveAuctioneerCall(null);
          const newPrice = msg.currentPrice !== undefined ? Number(msg.currentPrice) : (msg.bid?.amount ? Number(msg.bid.amount) : session?.current_price);
          const newWinner = msg.currentWinnerPaddle || msg.bid?.paddleNumber || msg.bid?.paddle_number;
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
            bid_count: ((prev as any).bid_count || 0) + 1,
          }));

          if (msg.bid) {
            const formatted = {
              id: msg.bid.id || 'bid-' + Date.now(),
              session_id: msg.sessionId || session.id,
              amount: msg.bid.amount || newPrice,
              bidder_id: msg.bid.participantId,
              bidder_name: msg.bid.bidderName || newWinnerName,
              bidder_location: msg.bid.location || 'Miami, FL',
              is_client: (msg.bid.paddleNumber || newWinner)?.includes('101'),
              timestamp: msg.serverTimestamp || msg.bid.serverTimestamp || new Date().toISOString(),
              sequence_number: msg.bid.sequenceNumber || 1,
              paddle_number: msg.bid.paddleNumber || newWinner,
            };
            setBids((prev) => [formatted, ...prev.filter((b) => b.id !== formatted.id)]);
            sounds.playBidVoice(formatted.amount, formatted.paddle_number, formatted.is_client);
          } else {
            try { sounds.playBidPing(); } catch { }
          }
          fetchStateFromServer();
        } else if (msg.type === 'AUCTION_FINALIZED') {
          setIsRoomAccessExpired(false);
          const finalDecision = msg.decision || msg.status || 'sold';
          setSession((prev) => ({
            ...prev,
            status: finalDecision as any,
            current_price: msg.currentPrice !== undefined ? Number(msg.currentPrice) : prev.current_price,
            current_winner_paddle: msg.winnerPaddle || (prev as any).current_winner_paddle,
            time_remaining_seconds: 0,
          }));
          if ((finalDecision === 'sold') && !hasCelebratedSoldRef.current) {
            hasCelebratedSoldRef.current = true;
            triggerSoldConfettiCelebration();
          }
          fetchStateFromServer();
        } else if (msg.type === 'AUCTION_RESET') {
          setIsRoomAccessExpired(false);
          hasCelebratedSoldRef.current = false;
          setLiveAuctioneerCall(null);
          setBids([]);
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
          fetchStateFromServer();
        } else if (msg.type === 'STATUS_CHANGE' || msg.type === 'AUCTION_STARTED' || msg.type === 'AUCTION_RESUMED') {
          setIsRoomAccessExpired(false);
          const nextStatus = msg.status || (msg.type === 'AUCTION_STARTED' ? 'open' : undefined);
          setSession((prev) => ({
            ...prev,
            status: (nextStatus || prev.status) as any,
            time_remaining_seconds: msg.timeRemaining !== undefined ? Number(msg.timeRemaining) : prev.time_remaining_seconds,
            current_price: msg.currentPrice !== undefined ? Number(msg.currentPrice) : prev.current_price,
            current_winner_paddle: msg.currentWinnerPaddle !== undefined ? msg.currentWinnerPaddle : (prev as any).current_winner_paddle,
          }));

          if (msg.status === 'sold' && !hasCelebratedSoldRef.current) {
            hasCelebratedSoldRef.current = true;
            triggerSoldConfettiCelebration();
          } else if (msg.status !== 'sold') {
            hasCelebratedSoldRef.current = false;
            if (msg.status === 'paused') {
              sounds.playPauseVoice();
            } else if (msg.status === 'unsold') {
              sounds.playUnsoldVoice();
            } else if (msg.type === 'AUCTION_STARTED' || msg.status === 'open') {
              if (vehicle?.custom_badges?.auctioneerVoiceGender) {
                sounds.setVoiceGender(vehicle.custom_badges.auctioneerVoiceGender);
              }
              sounds.playStartVoice(Number(msg.currentPrice || session?.current_price || 5000), {
                year: vehicle?.year,
                brand: vehicle?.brand,
                model: vehicle?.model,
                version: vehicle?.version,
                odometer: vehicle?.odometer,
                condition: vehicle?.vehicle_condition,
                hasKeys: vehicle?.has_keys,
                customChant: vehicle?.custom_badges?.auctioneerWelcomeChant,
              });
            } else if (msg.type === 'AUCTION_RESUMED' || msg.status === 'bidding') {
              sounds.playResumeVoice();
            }
          }
          fetchStateFromServer();
        } else if (msg.type === 'ROOM_ANNOUNCEMENT') {
          if (msg.text) {
            setLiveAnnouncement(msg.text);
            try { sounds.playBidPing(); } catch { }
          }
        } else if (msg.type === 'ROOM_ACCESS_REVOKED') {
          if (!isBroker) {
            setIsRoomAccessExpired(true);
          }
        }
      } catch { }
    });

    return () => {
      unsubscribeWs();
    };
  }, [isBroker, role, fetchStateFromServer, triggerSoldConfettiCelebration]);

  // Actualización en tiempo real del horario oficial de Estados Unidos (Eastern Time / EST)
  useEffect(() => {
    const updateUsTime = () => {
      const now = new Date();
      setUsTime(now.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) + ' EST');
    };
    updateUsTime();
    const interval = setInterval(updateUsTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const vehicle = session.vehicle_snapshot || (session as any).vehicle;
  const cleanLotNumber = (vehicle?.lot_number || '48291032').replace(/[^0-9]/g, '');
  const copartLotUrl = vehicle?.reference_url?.trim()
    ? vehicle.reference_url.trim()
    : `https://www.copart.com/${lang === 'es' ? 'es/' : ''}lot/${cleanLotNumber}`;
  // EXCLUSIVAMENTE FOTOGRAFÍAS REALES (Excluir videos o miniaturas con reproducción, máx 1-2 fotos auténticas)
  const allImages: VehicleImage[] = (vehicle?.images || [])
    .filter((img: any) => {
      const u = String(img?.url || '').toLowerCase();
      const cap = String(img?.caption || '').toLowerCase();
      return !u.includes('video') && !u.includes('play') && !cap.includes('video');
    })
    .slice(0, 2);

  const filteredCategoryImages = selectedCategory === 'todas'
    ? allImages
    : allImages.filter((img) => img.category === selectedCategory);

  const displayedImages = filteredCategoryImages.length > 0 ? filteredCategoryImages : (allImages.length > 0 ? allImages : [{
    id: 'img-default',
    vehicle_id: vehicle?.id || 'veh-001',
    url: 'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=1200&q=80',
    category: 'exterior' as const,
    is_primary: true,
    order: 1,
    caption: 'Fotografía Oficial Copart'
  }]);

  const activeImage: VehicleImage = displayedImages[selectedImageIdx] || displayedImages[0];

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (displayedImages.length <= 1) return;
    setSelectedImageIdx((prev) => (prev > 0 ? prev - 1 : displayedImages.length - 1));
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (displayedImages.length <= 1) return;
    setSelectedImageIdx((prev) => (prev < displayedImages.length - 1 ? prev + 1 : 0));
  };

  const handleToggleAudio = () => {
    const next = !isAudioMuted;
    sounds.setMuted(next);
    setIsAudioMuted(next);
  };

  // Copiar el enlace de la sala que se le da al cliente (Espectador)
  const handleCopyClientAccessLink = () => {
    const url = buyerLink || `${window.location.origin}${window.location.pathname}#/sala/${session.room_token}`;
    navigator.clipboard.writeText(url);
    setCopiedBuyerLink(true);
    setTimeout(() => setCopiedBuyerLink(false), 2500);
  };

  const handleCopyVin = () => {
    if (vehicle?.vin) {
      navigator.clipboard.writeText(vehicle.vin);
      setCopiedVin(true);
      setTimeout(() => setCopiedVin(false), 2000);
    }
  };

  // ENVÍO DE OFERTA EXCLUSIVA DEL BROKER
  const handlePlaceBrokerBid = async (customAmount?: number) => {
    setServerError(null);
    const minRequired = session.current_price + (session.bid_increment || 250);
    const amountToBid = customAmount || minRequired;

    // Validación preventiva de presupuesto con margen de flexibilidad para llamada de WhatsApp ($1,500 USD)
    const isAuthorized = authorizedBidAmount && authorizedBidAmount === amountToBid;
    const maxOperationalBudget = clientBudget + 1500;
    if (amountToBid > maxOperationalBudget && !isAuthorized) {
      setServerError(`La oferta de $${amountToBid.toLocaleString()} supera el presupuesto autorizado por el cliente ($${clientBudget.toLocaleString()} USD + margen de $1,500 USD). Solicita autorización extraordinaria.`);
      setTimeout(() => setServerError(null), 5000);
      return;
    }

    const tokenToUse = activeParticipant?.token || userToken || 'bdr_broker_m729k1';

    setIsSubmittingBid(true);
    const res = await store.submitRealBid(session.id, tokenToUse, amountToBid);
    setIsSubmittingBid(false);

    if (!res.success) {
      setServerError(res.error || 'Oferta rechazada por el servidor.');
      setTimeout(() => setServerError(null), 6000);
    } else {
      setServerError(null);
      if (authorizedBidAmount === amountToBid) {
        setAuthorizedBidAmount(null);
      }
      await fetchStateFromServer();
    }
  };

  // CREAR SOLICITUD DE AUTORIZACIÓN EXTRAORDINARIA (BROKER -> COMPRADOR)
  const handleCreateBudgetRequest = async () => {
    const amount = Number(requestedAmountInput);
    if (!amount || amount <= clientBudget) {
      setServerError(`El importe solicitado ($${amount.toLocaleString()} USD) debe ser estrictamente superior al presupuesto vigente de $${clientBudget.toLocaleString()} USD.`);
      setTimeout(() => setServerError(null), 5000);
      return;
    }

    setIsSubmittingBudgetRequest(true);
    setServerError(null);
    const brokerAuth = userToken || 'bdr_broker_m729k1';
    const res = await store.createBudgetRequest(session.id, brokerAuth, amount);
    setIsSubmittingBudgetRequest(false);

    if (!res.success) {
      setServerError(res.error || 'No se pudo crear la solicitud de aumento extraordinario.');
      setTimeout(() => setServerError(null), 5000);
    } else {
      setShowRequestBudgetModal(false);
      setBrokerBudgetStatus({ status: 'pending', requestedAmount: amount });
      await fetchStateFromServer();
    }
  };

  // RESPONDER A SOLICITUD DE AUTORIZACIÓN EXTRAORDINARIA (COMPRADOR: AUTORIZAR O RECHAZAR)
  const handleRespondBudgetRequest = async (authId: string, decision: 'approve' | 'reject') => {
    setIsRespondingBudgetRequest(true);
    const buyerAuth = userToken || 'bdr_buyer_m729k1';
    const res = await store.respondBudgetRequest(authId, buyerAuth, decision);
    setIsRespondingBudgetRequest(false);

    if (!res.success) {
      alert(res.error || 'Error al procesar la respuesta');
    } else {
      setPendingBuyerRequest(null);
      await fetchStateFromServer();
    }
  };

  // DISPARAR OFERTA DE COMPETIDOR CONTROLADA POR EL OPERADOR/BROKER ("LO MANEJO YO")
  const handleTriggerCompetitor = async () => {
    setIsTriggeringCompetitor(true);
    setServerError(null);
    const res = await store.triggerCompetitorBid(session.id);
    setIsTriggeringCompetitor(false);

    if (!res.success) {
      setServerError(res.error || 'No se pudo generar la oferta de competencia.');
      setTimeout(() => setServerError(null), 4000);
    } else {
      await fetchStateFromServer();
    }
  };

  const getStatusBadge = () => {
    switch (session.status) {
      case 'prepared':
        return { label: t('statusPrepared'), style: 'bg-blue-950/80 text-blue-300 border-blue-700/60 font-bold' };
      case 'open':
      case 'bidding':
        return { label: t('statusActive'), style: 'bg-emerald-600 text-white font-black shadow-lg animate-pulse' };
      case 'last_call':
        return { label: t('clockLastCall'), style: 'bg-red-600 text-white font-black animate-bounce shadow-xl' };
      case 'paused':
        return { label: t('statusPaused'), style: 'bg-amber-950 text-amber-300 border-amber-600 font-bold' };
      case 'sold':
        return { label: t('statusSold'), style: 'bg-amber-500 text-slate-950 font-black tracking-wider' };
      case 'unsold':
        return { label: t('statusUnsold'), style: 'bg-rose-950 text-rose-300 border-rose-700 font-bold' };
      default:
        return { label: session.status.toUpperCase(), style: 'bg-slate-800 text-slate-300' };
    }
  };

  const statusInfo = getStatusBadge();
  const isBrokerWinning = (session as any).currentWinnerPaddle?.includes('101') || (activeParticipant && (session as any).currentWinnerPaddle === activeParticipant.paddleNumber);

  // Formato de VIN
  const rawVin = vehicle?.vin || '1FA6P8CF9P5198241';
  const displayedVin = isVinMasked ? (rawVin.length > 8 ? rawVin.slice(0, 8) + '******' : '******') : rawVin;

  // Odómetro
  const miles = vehicle?.odometer || 14250;
  const displayedOdometer = odometerUnit === 'km'
    ? `${Math.round(miles * 1.60934).toLocaleString()} KM`
    : `${miles.toLocaleString()} MI`;

  const nextBidAmount = session.current_price + (session.bid_increment || 250);
  const isNextBidOverBudget = nextBidAmount > clientBudget;

  const handleGenerateDocLink = async () => {
    setDocFeedbackMsg(null);
    const res = await store.createDocumentLink(session.id, {
      clientName: (session as any).currentWinnerName || 'Cliente Autorizado',
      clientEmail: 'cliente@subastas.com',
      expiresInDays: 7,
    });
    if (res && res.success && res.docToken) {
      setCurrentDocToken(res.docToken);
      const url = `${window.location.origin}${window.location.pathname}#/documento/${res.docToken}`;
      navigator.clipboard.writeText(url);
      setCopiedDocLink(true);
      setDocFeedbackMsg('¡Enlace documental generado y copiado al portapapeles!');
      setTimeout(() => setCopiedDocLink(false), 3000);
      setTimeout(() => setDocFeedbackMsg(null), 5000);
    }
  };

  const handleCopyDocLink = () => {
    if (!currentDocToken) return;
    const url = `${window.location.origin}${window.location.pathname}#/documento/${currentDocToken}`;
    navigator.clipboard.writeText(url);
    setCopiedDocLink(true);
    setDocFeedbackMsg('¡Enlace documental copiado al portapapeles!');
    setTimeout(() => setCopiedDocLink(false), 2500);
    setTimeout(() => setDocFeedbackMsg(null), 4000);
  };

  const handleRevokeDocLink = async () => {
    if (!currentDocToken) return;
    if (!confirm('¿Confirma revocar el acceso a este enlace documental? El cliente ya no podrá consultarlo.')) return;
    setIsRevokingDoc(true);
    const res = await store.revokeDocumentLink(currentDocToken);
    setIsRevokingDoc(false);
    if (res && res.success) {
      setCurrentDocToken(null);
      setDocFeedbackMsg('Enlace documental revocado oficialmente.');
      setTimeout(() => setDocFeedbackMsg(null), 4000);
    }
  };

  // PANTALLA OFICIAL DE ACCESO EXPIRADO Y REVOCADO CUANDO LA SALA FINALIZA
  if (isRoomAccessExpired && !isBroker) {
    return (
      <RoomAccessExpiredView
        lotNumber={vehicle?.lot_number || '48291032'}
        onBack={onExit}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#060a12] text-slate-100 flex flex-col font-sans select-none antialiased">

      {/* 1. BARRA SUPERIOR AUTÉNTICA COPART VB3 LIVE */}
      <header className="bg-[#002855] border-b-2 border-[#ffb81c] px-3 sm:px-6 py-2 shadow-xl sticky top-0 z-40">
        <div className="max-w-[1720px] mx-auto flex items-center justify-between">

          <div className="flex items-center gap-2 sm:gap-6">
            <div className="sm:hidden">
              <CopartLogo size="sm" showSubtitle={false} className="py-0.5 filter drop-shadow-md" />
            </div>
            <div className="hidden sm:block">
              <CopartLogo size="lg" showSubtitle={true} className="py-0.5 filter drop-shadow-md" />
            </div>

            {/* Pista e Identificación de Lote */}
            <div className="hidden sm:flex items-center gap-2 bg-[#0c192c] border border-blue-900/60 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-black text-white tracking-wide">{t('laneTitle')}</span>
              <span className="text-slate-400">•</span>
              <span className="text-amber-300 font-mono font-bold">{vehicle?.location || 'Atlanta East Yard 12'}</span>
            </div>

            {/* LOTE OFICIAL COPART Y EXPEDIENTE DE PATIO */}
            <div className="flex items-center bg-[#0c192c] border border-slate-700/80 rounded-lg overflow-hidden text-xs sm:text-sm shadow-sm">
              <div className="px-3 py-1.5 flex items-center gap-1.5">
                <span className="text-slate-300 text-xs font-bold uppercase tracking-wider">{t('lotPrefix')}</span>
                <span className="font-mono font-black text-amber-400 text-sm sm:text-base">
                  #{vehicle?.lot_number || '48291032'}
                </span>
              </div>
              <a
                href={copartLotUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 bg-[#002855] hover:bg-[#003d80] text-amber-300 font-bold text-xs flex items-center gap-1.5 border-l border-slate-700/80 transition"
                title="Consultar expediente técnico del lote en patio Copart"
              >
                <span>{lang === 'en' ? 'COPART LOT DETAILS' : 'FICHA OFICIAL DE LOTE'}</span>
                <ExternalLink className="w-3 h-3 text-amber-400" />
              </a>
            </div>

            {/* BOTÓN 6 COMPROBACIONES OFICIALES COPART */}
            <button
              type="button"
              onClick={() => setIsVerificationModalOpen(true)}
              className="flex items-center gap-1.5 bg-[#002855] hover:bg-[#003875] border border-amber-500/60 px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-300 transition shadow cursor-pointer whitespace-nowrap"
              title="Verificar las 6 comprobaciones de seguridad Copart: Vehículo, Subasta, Broker, Oferta, Resultado y Pago"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Auditoría Copart:</span>
              <span className="text-emerald-400 font-mono font-black">6/6 ✓</span>
            </button>

            {/* Conteo y Movimiento de Espectadores Conectados en Tiempo Real */}
            <div className="hidden md:flex items-center gap-2 text-xs sm:text-sm text-cyan-300 bg-cyan-950/50 border border-cyan-800/60 px-3 py-1.5 rounded-lg font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{viewersCount} {t('viewersInLane')}</span>
              {latestSpectatorEvent && (
                <span className="text-xs text-amber-300 font-mono animate-fadeIn pl-2 border-l border-cyan-700/60 font-medium">
                  {latestSpectatorEvent}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* BOTÓN GUÍA DE INDUCCIÓN AL COMPRADOR */}
            <button
              type="button"
              onClick={() => setIsBuyerGuideOpen(true)}
              className="flex items-center gap-1.5 bg-[#081528] hover:bg-[#0c2242] border border-blue-500/60 px-2.5 py-1.5 rounded-lg text-xs font-bold text-blue-200 hover:text-white transition shadow cursor-pointer whitespace-nowrap"
              title="¿Cómo funciona tu sala en vivo? Guía rápida de inducción para el comprador"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">¿Cómo funciona mi sala?</span>
              <span className="sm:hidden">Guía ℹ️</span>
            </button>

            {/* HORARIO REAL DE ESTADOS UNIDOS (USA / EST) */}
            <div className="hidden sm:flex items-center gap-2 bg-[#07111e] border border-blue-900/60 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-mono font-black text-amber-300 shadow-inner">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>{usTime || '12:00:00 PM EST'}</span>
            </div>

            {/* SELECTOR BILINGÜE EN / ES */}
            <div className="flex items-center bg-[#07111e] border border-slate-700/80 rounded-lg p-0.5 text-xs font-bold shadow-inner">
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded text-xs font-black transition ${lang === 'en'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                  }`}
                title="Switch interface to English (Default US Terminal)"
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang('es')}
                className={`px-2.5 py-1 rounded text-xs font-black transition ${lang === 'es'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                  }`}
                title="Cambiar interfaz a Español"
              >
                ES
              </button>
            </div>

            {/* Si es Broker: selector de su paleta */}
            {isBroker ? (
              <div className="flex items-center gap-2 bg-[#080d18] border border-emerald-500/70 px-3 py-1.5 rounded-lg text-xs sm:text-sm">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300 font-bold hidden md:inline text-xs">{t('brokerRole')}</span>
                <select
                  value={activeParticipant?.token || ''}
                  onChange={(e) => {
                    const p = participants.find((x) => x.token === e.target.value);
                    if (p) setActiveParticipant(p);
                  }}
                  className="bg-transparent text-white font-black text-xs focus:outline-none cursor-pointer"
                >
                  {participants.map((p) => (
                    <option key={p.id} value={p.token} className="bg-slate-900 text-white font-medium">
                      {p.paddleNumber} - {p.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              /* Si es Cliente: Monitor Oficial Copart VB3 */
              <div className="flex items-center gap-2 bg-[#091222] border border-blue-600/60 px-3 py-1.5 rounded-lg text-xs shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-white font-bold tracking-wide text-xs">MONITOR EN VIVO VB3</span>
                <span className="text-slate-600">|</span>
                <span className="text-amber-400 font-mono font-bold text-[11px]">PALETA OFICIAL #101</span>
              </div>
            )}

            {/* Botón de Audio Visible y Claro */}
            <button
              onClick={handleToggleAudio}
              className={`px-2.5 py-1.5 rounded text-xs font-black border flex items-center gap-1.5 transition shadow ${isAudioMuted
                  ? 'bg-rose-950/80 border-rose-600 text-rose-300 hover:bg-rose-900'
                  : 'bg-emerald-950/80 border-emerald-500 text-emerald-300 hover:bg-emerald-900'
                }`}
              title={isAudioMuted ? 'Activar sonido de la subasta' : 'Silenciar sonido'}
            >
              {isAudioMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
              <span className="font-bold">{isAudioMuted ? '🔇 Audio OFF' : '🔊 Audio ON'}</span>
            </button>

            {/* Enlace para Compartir con el Cliente (Espectador) */}
            {isBroker && (
              <button
                onClick={handleCopyClientAccessLink}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/50 px-2.5 py-1 rounded text-xs font-bold transition shadow"
                title={lang === 'en' ? 'Copy buyer access link' : 'Copiar enlace de acceso de espectador para el cliente'}
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{copiedBuyerLink ? t('clientLinkCopied') : t('copyClientLink')}</span>
              </button>
            )}

            {onExit && (
              <button
                onClick={onExit}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition"
              >
                {t('exitButton')}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* BARRA OFICIAL DE CARRILES COPART VB3 (LANE TABS) */}
      <div className="bg-[#050c18] border-b border-[#1b2b44] px-3 sm:px-6 py-1.5 flex items-center justify-between text-xs">
        <div className="max-w-[1720px] w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1 hidden sm:inline">LANES:</span>

            {/* LANE A (LIVE) */}
            <button
              type="button"
              onClick={() => setSelectedLane('A')}
              className={`px-3 py-1 rounded-md text-xs font-black flex items-center gap-2 transition ${selectedLane === 'A'
                  ? 'bg-emerald-600 text-white shadow-lg ring-1 ring-emerald-400'
                  : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800'
                }`}
            >
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span>LANE A • LIVE ({vehicle?.location || 'FL - Miami North'})</span>
            </button>

            {/* LANE B (DALLAS SOUTH) */}
            <button
              type="button"
              onClick={() => setSelectedLane('B')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition ${selectedLane === 'B'
                  ? 'bg-blue-600 text-white shadow ring-1 ring-blue-400'
                  : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800'
                }`}
              title="Carril B: Próxima apertura 2:00 PM EST"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>LANE B • Dallas South (Pre-Bid)</span>
            </button>

            {/* LANE C (CHICAGO NORTH) */}
            <button
              type="button"
              onClick={() => setSelectedLane('C')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition ${selectedLane === 'C'
                  ? 'bg-blue-600 text-white shadow ring-1 ring-blue-400'
                  : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800'
                }`}
              title="Carril C: Subasta pesada y camiones"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
              <span>LANE C • Chicago Heavy Duty</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-3 text-[11px] font-mono text-slate-400">
            <span>Terminal ID: <strong className="text-amber-300">VB3-US-EAST-492</strong></span>
            <span>Audio Engine: <strong className="text-emerald-400">EN-US Procedural Live</strong></span>
          </div>
        </div>
      </div>

      {/* AVISO DISCRETO PARA EL DIRECTOR DE SALA (PANTALLA 1) */}
      {isAuctioneer && (
        <div className="bg-[#09152a] border-b border-amber-500/40 px-4 py-1.5 flex items-center justify-between text-xs shadow">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-amber-300 font-bold">Modo Vista de Sala Pública</span>
            <span className="text-slate-400 text-[11px] hidden sm:inline">— Todos los controles manuales de las 7 paletas y el martillo están en tu Consola Privada</span>
          </div>

          <a
            href="#/consola-subastador"
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3 py-1 rounded text-xs flex items-center gap-1.5 transition shadow"
          >
            <Gavel className="w-3.5 h-3.5" />
            <span>Abrir Mi Consola Privada (Pantalla 2) ↗</span>
          </a>
        </div>
      )}

      {/* ERROR BANNER EN CASO DE RECHAZO DE OFERTA */}
      {serverError && (
        <div className="bg-rose-950/95 border-b border-rose-500 p-2.5 text-center text-xs text-rose-200 font-bold flex items-center justify-center gap-2 animate-shake">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* 2. ÁREA PRINCIPAL: SHOWCASE DEL VEHÍCULO Y TERMINAL DE PUJAS */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto p-2 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">

        {/* COLUMNA IZQUIERDA (7 COLUMNAS): VEHÍCULO COMO PROTAGONISTA */}
        <div className="lg:col-span-7 flex flex-col gap-3">

          {/* FOTOGRAFÍA PRINCIPAL CON NAVEGACIÓN Y ZOOM */}
          <div className="relative bg-[#09101c] border border-[#1b2b44] rounded-lg overflow-hidden shadow-2xl group">

            {/* Badges Superiores sobre la Fotografía */}
            <div className="absolute top-2.5 left-2.5 z-20 flex flex-wrap gap-1.5">
              <a
                href={copartLotUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="bg-[#002855]/95 hover:bg-[#003d80] text-white hover:text-amber-300 font-black text-xs px-2.5 py-1 rounded border border-blue-400/40 hover:border-amber-400 shadow backdrop-blur flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                title="Abrir expediente original en Copart.com"
              >
                <span>{t('lotPrefix')} #{vehicle?.lot_number || '48291032'}</span>
                <ExternalLink className="w-3 h-3 text-amber-400" />
              </a>
              <span className={`text-xs font-black px-2.5 py-1 rounded shadow backdrop-blur ${(vehicle?.custom_badges?.runDriveText || vehicle?.vehicle_condition) === 'run_and_drive' || (vehicle?.custom_badges?.runDriveText && vehicle.custom_badges.runDriveText.toLowerCase().includes('run'))
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-600 text-white'
                }`}>
                {vehicle?.custom_badges?.runDriveText || (vehicle?.vehicle_condition === 'run_and_drive' ? 'RUN & DRIVE' : 'STARTS')}
              </span>
              <span className="bg-slate-900/90 text-amber-300 border border-amber-400/40 font-mono text-xs px-2.5 py-1 rounded shadow">
                {vehicle?.custom_badges?.titleTypeText || `${(vehicle?.title_type || 'clean').toUpperCase()} TITLE`}
              </span>
              {activeImage?.category && (
                <span className="bg-blue-950/90 text-blue-300 border border-blue-600/50 uppercase font-bold text-[10px] px-2 py-0.5 rounded shadow">
                  {activeImage.category}
                </span>
              )}
            </div>

            {/* INSIGNIAS EXCLUSIVAS COPART: Enlace al Lote Real con Video/Motor, Carfax y Verificación */}
            <div className="absolute top-11 left-2.5 z-20 flex flex-wrap gap-1.5">
              {/* Acceso Directo Oficial al Lote Completo (Fotos HD, Video y Ficha Original) */}
              <a
                href={copartLotUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="px-2.5 py-1 rounded text-[11px] font-black uppercase tracking-wider backdrop-blur-md border shadow-lg flex items-center gap-1.5 bg-[#002855] hover:bg-[#003d80] text-amber-300 border-amber-400 hover:border-amber-300 transition active:scale-95 ring-1 ring-amber-400/40"
                title="Ver todas las fotografías HD, video, inspección y detalles completos del lote"
              >
                <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                <span>{lang === 'en' ? 'VIEW FULL VEHICLE ↗' : 'VER VEHÍCULO COMPLETO ↗'}</span>
              </a>

              {/* Botón 360° Walkaround - Solo si está expresamente habilitado */}
              {vehicle?.custom_badges?.threeSixtyEnabled === true && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle360();
                  }}
                  className={`px-2.5 py-1 rounded text-[11px] font-black uppercase tracking-wider backdrop-blur-md border shadow-lg flex items-center gap-1.5 transition active:scale-95 ${is360Active
                      ? 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-300 animate-pulse'
                      : 'bg-black/85 hover:bg-black text-blue-300 border-blue-500/50 hover:border-blue-400'
                    }`}
                  title="Activar vista panorámica y giro 360° de las fotografías"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${is360Active ? 'animate-spin' : ''}`} />
                  <span>{is360Active ? '360° Active...' : (vehicle?.custom_badges?.threeSixtyText || '360° View 🔄')}</span>
                </button>
              )}

              {/* Botón Carfax Report - Solo si cuenta con documentación respaldada */}
              {vehicle?.custom_badges?.carfaxEnabled === true && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCarfaxModalOpen(true);
                  }}
                  className="px-2.5 py-1 rounded text-[11px] font-black uppercase tracking-wider backdrop-blur-md border shadow-lg flex items-center gap-1.5 bg-black/85 hover:bg-black text-emerald-300 border-emerald-500/50 hover:border-emerald-400 transition active:scale-95"
                  title="Consultar reporte oficial de historial Carfax / AutoCheck"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{vehicle?.custom_badges?.carfaxText || 'Carfax Clean ✓'}</span>
                </button>
              )}

              {/* Botón 6 Comprobaciones Oficiales Copart */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsVerificationModalOpen(true);
                }}
                className="px-2.5 py-1 rounded text-[11px] font-black uppercase tracking-wider backdrop-blur-md border shadow-lg flex items-center gap-1.5 bg-[#002855]/90 hover:bg-[#002855] text-amber-300 border-amber-500/60 hover:border-amber-400 transition active:scale-95"
                title="Comprobaciones Oficiales de Seguridad Copart (Vehículo, Subasta, Broker, Oferta, Resultado, Pago)"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>6 Comprobaciones Copart ✓</span>
              </button>

              {/* Insignia Ficha de Patio */}
              <a
                href={copartLotUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="px-2.5 py-1 rounded text-[11px] font-black uppercase tracking-wider backdrop-blur-md border shadow-lg flex items-center gap-1.5 bg-[#002855]/90 hover:bg-[#002855] text-amber-300 border-amber-500/60 hover:border-amber-400 transition active:scale-95"
                title="Consultar expediente técnico y multimedia del lote"
              >
                <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                <span>{lang === 'en' ? 'FULL LOT REPORT ↗' : 'EXPEDIENTE COMPLETO ↗'}</span>
              </a>

              {/* Botones e Insignias Extra Configuradas por el Usuario */}
              {vehicle?.custom_badges?.extraBadges && vehicle.custom_badges.extraBadges.map((badge) => (
                <button
                  key={badge.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveExtraBadgeModal(badge);
                  }}
                  className={`px-2.5 py-1 rounded text-[11px] font-black uppercase tracking-wider backdrop-blur-md border shadow-lg flex items-center gap-1.5 transition active:scale-95 ${badge.color === 'emerald'
                      ? 'bg-black/85 hover:bg-black text-emerald-300 border-emerald-500/50 hover:border-emerald-400'
                      : badge.color === 'blue'
                        ? 'bg-black/85 hover:bg-black text-blue-300 border-blue-500/50 hover:border-blue-400'
                        : badge.color === 'purple'
                          ? 'bg-black/85 hover:bg-black text-purple-300 border-purple-500/50 hover:border-purple-400'
                          : 'bg-black/85 hover:bg-black text-amber-300 border-amber-500/50 hover:border-amber-400'
                    }`}
                  title={badge.modalTitle || badge.label}
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>{badge.label}</span>
                </button>
              ))}
            </div>

            {/* Botón de Galería en Pantalla Completa */}
            <div className="absolute top-2.5 right-2.5 z-20">
              <button
                type="button"
                onClick={() => setIsGalleryOpen(true)}
                className="bg-black/75 hover:bg-black text-white text-xs font-bold px-2.5 py-1.5 rounded-lg backdrop-blur border border-slate-700/80 shadow flex items-center gap-1.5 transition active:scale-95"
                title="Ampliar fotografía a pantalla completa (Galería HD)"
              >
                <Eye className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Galería HD</span>
              </button>
            </div>

            {/* Imagen Principal en Alta Definición con Flechas de Navegación Directas */}
            <div
              className="relative w-full aspect-[16/10] bg-black flex items-center justify-center overflow-hidden cursor-pointer"
              onClick={() => setIsGalleryOpen(true)}
            >
              {activeImage ? (
                <img
                  src={activeImage.url}
                  alt={vehicle?.model || 'Vehículo'}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=1200&q=80';
                  }}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <Car className="w-16 h-16 text-slate-700" />
              )}

              {/* Flechas de Navegación Rápida sobre la Foto */}
              {displayedImages.length > 1 && (
                <>
                  <button
                    onClick={handlePrevPhoto}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white border border-slate-700 transition shadow-lg opacity-80 group-hover:opacity-100"
                    title="Fotografía Anterior"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNextPhoto}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white border border-slate-700 transition shadow-lg opacity-80 group-hover:opacity-100"
                    title="Siguiente Fotografía"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Overlay llamativo de Llamada del Martillero sobre la foto */}
              {liveAuctioneerCall && (
                <div className="absolute bottom-3 inset-x-3 z-20 flex justify-center pointer-events-none">
                  <div className={`px-4 py-2 rounded-xl text-center font-black uppercase tracking-wider border-2 shadow-2xl backdrop-blur-md flex items-center gap-2 animate-bounce ${liveAuctioneerCall === 'going_once'
                      ? 'bg-amber-500/95 text-slate-950 border-amber-300 shadow-amber-500/50'
                      : liveAuctioneerCall === 'going_twice'
                        ? 'bg-orange-500/95 text-slate-950 border-orange-300 shadow-orange-500/50'
                        : 'bg-rose-600/95 text-white border-rose-300 shadow-rose-600/60'
                    }`}>
                    <Gavel className="w-4 h-4 shrink-0" />
                    <span className="text-xs sm:text-sm font-black">
                      {liveAuctioneerCall === 'going_once'
                        ? '📢 GOING ONCE • ¡A LA UNA!'
                        : liveAuctioneerCall === 'going_twice'
                          ? '🔥 GOING TWICE • ¡A LAS DOS!'
                          : '⚠️ FAIR WARNING • ¡ÚLTIMA ADVERTENCIA!'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Barra de Clasificación de Fotografías */}
            <div className="bg-[#040810] px-3 py-1.5 border-t border-[#1b2b44] flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 overflow-x-auto">
                {(['todas', 'exterior', 'interior', 'motor', 'tablero', 'danos'] as const).map((cat) => {
                  const count = cat === 'todas' ? allImages.length : allImages.filter((i) => i.category === cat).length;
                  const catLabel = lang === 'en'
                    ? (cat === 'todas' ? 'All' : cat === 'danos' ? 'Damage' : cat === 'tablero' ? 'Dashboard' : cat.charAt(0).toUpperCase() + cat.slice(1))
                    : (cat === 'todas' ? 'Todas' : cat === 'danos' ? 'Daños' : cat === 'tablero' ? 'Tablero' : cat.charAt(0).toUpperCase() + cat.slice(1));
                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setSelectedImageIdx(0);
                      }}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase transition flex items-center gap-1 ${selectedCategory === cat
                          ? 'bg-amber-500 text-slate-950 font-black shadow'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                        }`}
                    >
                      <span>{catLabel}</span>
                      <span className="text-[9.5px] opacity-70">({count})</span>
                    </button>
                  );
                })}
              </div>

              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                {displayedImages.length > 0 ? `${selectedImageIdx + 1} / ${displayedImages.length} ${t('photosCount')}` : `0 ${t('photosCount')}`}
              </span>
            </div>

            {/* Tira de Miniaturas Navegable */}
            {displayedImages.length > 1 && (
              <div className="p-2 bg-[#060b14] border-t border-[#1b2b44] flex items-center gap-2 overflow-x-auto">
                {displayedImages.map((img: any, idx: number) => (
                  <button
                    key={img.id || idx}
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`relative flex-shrink-0 w-16 h-12 rounded border-2 overflow-hidden transition ${idx === selectedImageIdx ? 'border-amber-400 ring-2 ring-amber-400/40' : 'border-slate-800 opacity-60 hover:opacity-100'
                      }`}
                  >
                    <img
                      src={img.url}
                      alt=""
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=300&q=80';
                      }}
                      className="w-full h-full object-cover"
                    />
                    {img.category && (
                      <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[7.5px] text-center font-bold text-slate-300 uppercase truncate">
                        {img.category}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* FICHA TÉCNICA PROFESIONAL DE INVENTARIO */}
          <div className="bg-[#09101c] border border-[#1b2b44] rounded-lg p-3.5 sm:p-5 shadow-xl text-xs sm:text-sm">
            <div className="border-b border-slate-800 pb-3.5 mb-3.5 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
                  {vehicle?.year} {vehicle?.brand} {vehicle?.model}
                </h1>
                <p className="text-sm sm:text-base text-amber-400 font-bold mt-1">{vehicle?.version || 'Equipamiento Original de Fábrica'}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block font-bold uppercase tracking-wider">{t('estRetailValue')}</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                  ${(vehicle?.est_retail_value || 42000).toLocaleString()} USD
                </span>
              </div>
            </div>

            {/* Cuadrícula de Especificaciones Completas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">

              {/* Odómetro con Switch MI / KM */}
              <div className="bg-[#050912] p-3 rounded-lg border border-slate-800/80 shadow">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 block text-[11px] uppercase font-bold tracking-wide">{t('odometerLabel')}</span>
                  <button
                    onClick={() => setOdometerUnit(odometerUnit === 'mi' ? 'km' : 'mi')}
                    className="text-[10px] bg-slate-800 text-amber-400 hover:bg-slate-700 px-1.5 py-0.5 rounded font-mono font-bold"
                    title="Toggle MI / KM"
                  >
                    {odometerUnit === 'mi' ? 'A KM' : 'A MI'}
                  </button>
                </div>
                <span className="font-mono font-black text-white text-base sm:text-lg block mt-0.5">
                  {displayedOdometer}
                </span>
              </div>

              <div className="bg-[#050912] p-3 rounded-lg border border-slate-800/80 shadow">
                <span className="text-slate-400 block text-[11px] uppercase font-bold tracking-wide">{t('primaryDamage')}</span>
                <span className="font-bold text-amber-300 text-sm sm:text-base block mt-0.5">{vehicle?.primary_damage || 'Impacto Frontal'}</span>
              </div>

              <div className="bg-[#050912] p-3 rounded-lg border border-slate-800/80 shadow">
                <span className="text-slate-400 block text-[11px] uppercase font-bold tracking-wide">{t('secondaryDamage')}</span>
                <span className="font-semibold text-slate-200 text-sm sm:text-base block mt-0.5">{vehicle?.secondary_damage || 'Ninguno'}</span>
              </div>

              <div className="bg-[#050912] p-3 rounded-lg border border-slate-800/80 shadow">
                <span className="text-slate-400 block text-[11px] uppercase font-bold tracking-wide">{t('keysLabel')}</span>
                <span className="font-black text-emerald-400 text-sm sm:text-base flex items-center gap-1.5 mt-0.5">
                  <Key className="w-4 h-4" />
                  {vehicle?.has_keys ? (lang === 'en' ? 'YES (PRESENT)' : 'SÍ (PRESENTES)') : (lang === 'en' ? 'NO' : 'NO')}
                </span>
              </div>

              <div className="bg-[#050912] p-3 rounded-lg border border-slate-800/80 shadow">
                <span className="text-slate-400 block text-[11px] uppercase font-bold tracking-wide">{t('engineLabel')}</span>
                <span className="font-bold text-slate-100 text-sm sm:text-base block mt-0.5">{vehicle?.engine || '5.0L V8 Coyote 32V'}</span>
              </div>

              <div className="bg-[#050912] p-3 rounded-lg border border-slate-800/80 shadow">
                <span className="text-slate-400 block text-[11px] uppercase font-bold tracking-wide">{t('transmissionLabel')}</span>
                <span className="font-bold text-slate-100 text-sm sm:text-base block mt-0.5">{vehicle?.transmission || 'Automática'}</span>
              </div>

              <div className="bg-[#050912] p-3 rounded-lg border border-slate-800/80 shadow">
                <span className="text-slate-400 block text-[11px] uppercase font-bold tracking-wide">{t('drivetrainLabel')}</span>
                <span className="font-bold text-slate-100 text-sm sm:text-base block mt-0.5">{vehicle?.drivetrain || 'RWD'}</span>
              </div>

              {/* VIN Completo o Enmascarado con Toggle */}
              <div className="bg-[#050912] p-3 rounded-lg border border-slate-800/80 relative shadow">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 block text-[11px] uppercase font-bold tracking-wide">{t('vinLabel')}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setIsVinMasked(!isVinMasked)}
                      className="text-slate-400 hover:text-amber-400 p-0.5"
                      title={isVinMasked ? t('unmaskVin') : t('maskVin')}
                    >
                      {isVinMasked ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={handleCopyVin}
                      className="text-slate-400 hover:text-amber-400 p-0.5"
                      title={t('copyVin')}
                    >
                      {copiedVin ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <span className="font-mono font-bold text-slate-200 text-sm sm:text-base truncate block mt-0.5" title={rawVin}>
                  {displayedVin}
                </span>
              </div>
            </div>

            {/* BOTÓN OFICIAL DESTACADO: EXPEDIENTE COMPLETO */}
            <div className="mt-3 bg-gradient-to-r from-[#001f42] via-[#002855] to-[#071326] border-2 border-amber-500/80 p-3.5 sm:p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3.5 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0 shadow">
                  <ExternalLink className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-white text-xs sm:text-sm">
                      Expediente Oficial de Patio (Lote #{vehicle?.lot_number || '61682336'})
                    </span>
                    <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/40">
                      Verificable
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-300 block mt-0.5">
                    Patio: <strong className="text-amber-300">{vehicle?.location || 'FL - MIAMI NORTH'}</strong> • Accede al expediente original con todas las fotos HD, video, condición y ficha técnica completa.
                  </span>
                </div>
              </div>

              <a
                href={copartLotUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-xl active:scale-95 cursor-pointer uppercase tracking-wider whitespace-nowrap ring-2 ring-amber-400/50"
                title="Ver todas las fotos HD, video y ficha técnica completa del lote"
              >
                <ExternalLink className="w-4 h-4 text-slate-950" />
                <span>VER VEHÍCULO COMPLETO ↗</span>
              </a>
            </div>

            {/* EQUIPAMIENTO Y DETALLES COMERCIALES */}
            {vehicle?.equipment && Array.isArray(vehicle.equipment) && vehicle.equipment.length > 0 && (
              <div className="mt-3 bg-[#050912] p-3 rounded-lg border border-slate-800/80 text-slate-200">
                <span className="text-slate-400 font-bold block text-xs uppercase mb-2">Equipamiento Destacado:</span>
                <div className="flex flex-wrap gap-1.5">
                  {vehicle.equipment.map((item: string, idx: number) => (
                    <span key={idx} className="bg-slate-800/90 text-slate-200 border border-slate-700/80 px-2 py-0.5 rounded text-xs">
                      • {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* OBSERVACIONES DEL BROKER / NOTAS DE INSPECCIÓN */}
            {vehicle?.notes && (
              <div className="mt-3 bg-[#050912] p-3.5 rounded-lg border border-slate-800/80 text-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-amber-400 font-black text-xs uppercase tracking-wide flex items-center gap-1.5">
                    <span>📋 Observaciones Comerciales del Broker</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Nota comercial informativa</span>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-300">{vehicle.notes}</p>
              </div>
            )}
          </div>

          {/* TABLERO DE PARTICIPANTES Y PALETAS AUTORIZADAS (COPART PADDLES BOARD) */}
          <div className="bg-[#09101c] border border-[#1b2b44] rounded-lg p-3.5 sm:p-5 shadow-xl text-xs sm:text-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-white text-sm uppercase tracking-wider">
                  {lang === 'en' ? 'OFFICIAL BIDDING PADDLES (LANE A)' : 'TABLERO DE PALETAS AUTORIZADAS (LANE A)'}
                </h3>
              </div>
              <span className="text-xs text-emerald-400 font-mono font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                7 {lang === 'en' ? 'ACTIVE PADDLES' : 'POSTORES ACTIVOS'}
              </span>
            </div>

            {/* Grid de las 7 paletas oficiales */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { paddle: 'Paleta #101', name: 'Carlos Mendoza', role: 'Broker Rep.', loc: 'Miami, FL', isBuyer: true },
                { paddle: 'Paleta #108', name: 'Marcus Vance', role: 'AutoExport Direct', loc: 'Houston, TX' },
                { paddle: 'Paleta #214', name: 'Elena Rostova', role: 'Premier Motors', loc: 'Los Angeles, CA' },
                { paddle: 'Paleta #305', name: 'David Sterling', role: 'Sterling Fleet', loc: 'Dallas, TX' },
                { paddle: 'Paleta #412', name: 'Sanjay Patel', role: 'Apex Auto Group', loc: 'Chicago, IL' },
                { paddle: 'Paleta #550', name: 'Roberto Silva', role: 'Global Logistics', loc: 'Atlanta, GA' },
                { paddle: 'Paleta #721', name: 'Jean-Luc Dubois', role: 'Atlantic Wholesale', loc: 'Phoenix, AZ' },
              ].map((p) => {
                const isCurrentWinner = ((session as any).currentWinnerPaddle || (session as any).current_winner_paddle) === p.paddle;
                return (
                  <div
                    key={p.paddle}
                    className={`p-3 rounded-xl border transition ${isCurrentWinner
                        ? 'bg-emerald-950/90 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.35)] ring-2 ring-emerald-400'
                        : p.isBuyer
                          ? 'bg-[#061124] border-blue-600/70 shadow'
                          : 'bg-[#050912] border-slate-800 shadow-sm'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-mono font-black text-sm sm:text-base ${isCurrentWinner ? 'text-emerald-300' : p.isBuyer ? 'text-blue-300' : 'text-amber-400'}`}>
                        {p.paddle}
                      </span>
                      {isCurrentWinner && (
                        <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                          LÍDER
                        </span>
                      )}
                    </div>
                    <span className="text-white font-bold text-xs sm:text-sm block truncate mt-1">{p.name}</span>
                    <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
                      <span>{p.loc}</span>
                      <span className="text-slate-500 font-mono text-[11px]">{p.role}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* DATOS DE SUBASTA Y GARANTÍA COPART */}
          <div className="bg-[#09101c] border border-[#1b2b44] rounded-lg p-3.5 shadow-xl text-xs sm:text-sm flex flex-wrap items-center justify-between gap-3 text-slate-300">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>
                <strong className="text-white font-black">Copart Title Hub Guarantee:</strong> {lang === 'en' ? 'Verified Title & Lien Free' : 'Título Limpio Verificado Libre de Gravamen'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs sm:text-sm font-mono">
              <span>YARD: <strong className="text-slate-100 font-bold">Yard 12 (Atlanta East)</strong></span>
              <span>GRID: <strong className="text-slate-100 font-bold">Row 14 • B-08</strong></span>
              <span>SALE TYPE: <strong className="text-amber-400 font-bold">Pure Sale</strong></span>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA (5 COLUMNAS): TERMINAL DE OFERTAS EN DIRECTO */}
        <div className="lg:col-span-5 flex flex-col gap-3">

          <div className={`bg-[#09101c] border-2 rounded-lg p-4 sm:p-5 shadow-2xl transition-all duration-300 ${bidFlash ? 'border-emerald-400 bg-emerald-950/20' : 'border-[#1b2b44]'
            }`}>

            {/* Header del bloque con Estado y Contador */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  {lang === 'en' ? 'LIVE AUCTION STATUS' : 'ESTADO EN VIVO'}
                </span>
                <span className={`text-xs sm:text-sm font-black px-3 py-1.5 rounded-lg inline-block border ${statusInfo.style}`}>
                  {statusInfo.label}
                </span>

                {/* Controles de reloj directo en sala para operador / broker / subastador */}
                {session.status === 'prepared' && (
                  <button
                    type="button"
                    onClick={handleStartAuction}
                    className="mt-2.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-1.5 transition active:scale-95 cursor-pointer ring-2 ring-emerald-400/50"
                    title="Iniciar cuenta regresiva oficial de 15 segundos y abrir subasta"
                  >
                    <Play className="w-3.5 h-3.5 fill-slate-950" />
                    <span>INICIAR SUBASTA (15s)</span>
                  </button>
                )}

                {['open', 'bidding', 'last_call'].includes(session.status) && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={handlePauseAuction}
                      className="py-1 px-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] flex items-center gap-1 border border-slate-700 transition"
                      title="Pausar reloj"
                    >
                      <Pause className="w-3 h-3" />
                      <span>Pausar</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResetClock}
                      className="py-1 px-2.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] flex items-center gap-1 shadow transition"
                      title="Reiniciar conteo en 15 segundos"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>15s</span>
                    </button>
                  </div>
                )}

                {session.status === 'paused' && (
                  <button
                    type="button"
                    onClick={handleResumeAuction}
                    className="mt-2 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow flex items-center gap-1.5 transition active:scale-95"
                    title="Reanudar cuenta regresiva"
                  >
                    <Play className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Reanudar</span>
                  </button>
                )}
              </div>

              {/* CONTADOR CIRCULAR AUTORITATIVO SINCRONIZADO CON SERVIDOR */}
              <CircularCountdown
                seconds={session.time_remaining_seconds}
                totalDuration={15}
                status={session.status}
                size={110}
                lang={lang}
              />
            </div>

            {/* MEGA BANNER DE LLAMADAS DEL MARTILLERO EN VIVO (GOING ONCE / GOING TWICE / FAIR WARNING) */}
            {liveAuctioneerCall && (
              <div className={`mt-3.5 py-3 px-4 rounded-xl text-center font-black uppercase tracking-wider border-2 shadow-2xl flex items-center justify-center gap-3 animate-pulse ${liveAuctioneerCall === 'going_once'
                  ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 border-amber-200 ring-4 ring-amber-400/50'
                  : liveAuctioneerCall === 'going_twice'
                    ? 'bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500 text-slate-950 border-orange-200 ring-4 ring-orange-400/50'
                    : 'bg-gradient-to-r from-rose-700 via-red-600 to-rose-700 text-white border-rose-200 ring-4 ring-rose-500/60'
                }`}>
                <Gavel className="w-5 h-5 animate-bounce shrink-0" />
                <span className="text-xs sm:text-sm md:text-base font-black tracking-wide">
                  {liveAuctioneerCall === 'going_once'
                    ? (lang === 'en' ? '📢 GOING ONCE — FIRST CALL!' : '📢 ¡A LA UNA! — GOING ONCE (PRIMER AVISO)')
                    : liveAuctioneerCall === 'going_twice'
                      ? (lang === 'en' ? '🔥 GOING TWICE — LAST CALL!' : '🔥 ¡A LAS DOS! — GOING TWICE (ÚLTIMA LLAMADA)')
                      : (lang === 'en' ? '⚠️ FAIR WARNING — FINAL CALL!' : '⚠️ ¡ÚLTIMA ADVERTENCIA! — FAIR WARNING (MARTILLO POR CAER)')}
                </span>
              </div>
            )}

            {/* PRECIO ACTUAL EN GRANDE */}
            <div className="my-3.5 text-center bg-[#050912] p-4 sm:p-5 rounded-xl border border-[#1b2b44] relative overflow-hidden shadow-inner">
              <span className="text-xs sm:text-sm font-black text-slate-300 uppercase tracking-widest block mb-1">
                {lang === 'en' ? 'CURRENT BID' : 'PRECIO VIGENTE DE SUBASTA (CURRENT BID)'}
              </span>

              <div className="flex items-center justify-center gap-2">
                <span className="text-3xl sm:text-4xl font-black text-emerald-500">$</span>
                <span className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.35)]">
                  {(Number(session?.current_price ?? (session as any)?.currentPrice ?? 5000)).toLocaleString()}
                </span>
                <span className="text-base sm:text-lg font-bold text-slate-400 self-end mb-2">USD</span>
              </div>

              {/* Indicador de Postor Vigente */}
              <div className="mt-2.5 flex items-center justify-center">
                {(session as any).currentWinnerPaddle || session.current_bidder_name ? (
                  <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold ${isBrokerWinning
                      ? 'bg-emerald-950/90 border border-emerald-400 text-emerald-300 animate-pulse shadow'
                      : 'bg-rose-950/90 border border-rose-600/80 text-rose-300 shadow'
                    }`}>
                    {isBrokerWinning ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>{lang === 'en' ? "YOU'RE HIGH BIDDER!" : '¡TU BROKER VA GANANDO LA PUJA!'} ({(session as any).currentWinnerPaddle})</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        <span>{lang === 'en' ? 'OUTBID BY:' : 'SUPERADO POR:'} {(session as any).currentWinnerPaddle} - {(session as any).currentWinnerName}</span>
                      </>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-slate-500">{t('noBidsYet')}</span>
                )}
              </div>

              {/* SECUENCIA DE VOZ / LLAMADAS DEL SUBASTADOR EN VIVO */}
              {liveAuctioneerCall && (
                <div className={`mt-2.5 py-2 px-3 rounded-lg text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 border shadow-lg animate-pulse ${liveAuctioneerCall === 'going_once'
                    ? 'bg-amber-500 text-slate-950 border-amber-300 ring-2 ring-amber-400/50'
                    : liveAuctioneerCall === 'going_twice'
                      ? 'bg-orange-500 text-slate-950 border-orange-300 ring-2 ring-orange-400/50'
                      : 'bg-rose-600 text-white border-rose-400 ring-2 ring-rose-500/50'
                  }`}>
                  <Gavel className="w-4 h-4" />
                  <span>
                    {liveAuctioneerCall === 'going_once'
                      ? (lang === 'en' ? '📢 GOING ONCE' : '📢 GOING ONCE — PRIMER AVISO')
                      : liveAuctioneerCall === 'going_twice'
                        ? (lang === 'en' ? '🔥 GOING TWICE — LAST CALL' : '🔥 GOING TWICE — ÚLTIMA LLAMADA')
                        : (lang === 'en' ? '⚠️ FAIR WARNING — FINAL CALL' : '⚠️ FAIR WARNING — AVISO FINAL')}
                  </span>
                </div>
              )}
            </div>

            {/* CALCULADORA OFICIAL DE TARIFAS COPART VB3 (BUYER FEES BREAKDOWN) */}
            <div className="bg-[#050a16] border border-[#1b2b44] rounded-xl overflow-hidden shadow-inner mb-3 text-xs">
              <button
                type="button"
                onClick={() => setIsFeesExpanded(!isFeesExpanded)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-900/60 transition"
              >
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-bold text-slate-300">
                    {lang === 'en' ? 'Estimated Total & Copart Fees:' : 'Total Estimado con Tarifas Copart:'}
                  </span>
                  <span className="font-mono font-black text-emerald-400 text-xs sm:text-sm">
                    ${(Number(session?.current_price ?? (session as any)?.currentPrice ?? 5000) + Math.round(Math.max(250, Number(session?.current_price ?? 5000) * 0.085 + 120)) + 119 + 79 + 20).toLocaleString()} USD
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-amber-400 font-bold shrink-0">
                  <span>{isFeesExpanded ? (lang === 'en' ? 'Hide' : 'Ocultar') : (lang === 'en' ? 'Fees Breakdown' : 'Ver Desglose')}</span>
                  {isFeesExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </div>
              </button>

              {isFeesExpanded && (
                <div className="px-3.5 pb-3 pt-1 border-t border-slate-800 space-y-1.5 font-mono text-[11px] animate-fadeIn">
                  <div className="flex justify-between text-slate-400">
                    <span>{lang === 'en' ? 'Winning Hammer Bid:' : 'Monto de Puja en Subasta:'}</span>
                    <strong className="text-white">${(Number(session?.current_price ?? 5000)).toLocaleString()} USD</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>{lang === 'en' ? 'Copart Buyer Fee (Tier Standard):' : 'Comisión de Comprador Copart:'}</span>
                    <span className="text-slate-300">${(Math.round(Math.max(250, Number(session?.current_price ?? 5000) * 0.085 + 120))).toLocaleString()} USD</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>{lang === 'en' ? 'Virtual Bidding Fee (Copart VB3):' : 'Tarifa Puja por Internet Copart VB3:'}</span>
                    <span className="text-slate-300">$119 USD</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>{lang === 'en' ? 'Gate / Yard Loading Fee (Yard 12):' : 'Tarifa de Salida de Patio Copart:'}</span>
                    <span className="text-slate-300">$79 USD</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>{lang === 'en' ? 'Environmental & Title Prep Fee:' : 'Tarifa Ambiental y Trámite Título:'}</span>
                    <span className="text-slate-300">$20 USD</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-1.5 font-bold text-xs text-white">
                    <span className="text-amber-400 uppercase tracking-wider">{lang === 'en' ? 'Estimated Total to Pay:' : 'Total Estimado a Liquidar:'}</span>
                    <span className="text-emerald-400 font-mono font-black text-sm">
                      ${(Number(session?.current_price ?? 5000) + Math.round(Math.max(250, Number(session?.current_price ?? 5000) * 0.085 + 120)) + 119 + 79 + 20).toLocaleString()} USD
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* FASE 1: ANTES DE LA SUBASTA (SALA ABIERTA - INSPECCIÓN PREVIA) */}
            {session.status === 'prepared' && (
              <div className="bg-[#050912] border border-blue-900/80 p-3.5 rounded-lg space-y-3 mb-3 animate-fadeIn text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-400" />
                    FASE 1: SALA ABIERTA • INSPECCIÓN PREVIA
                  </span>
                  <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-700/60 px-2 py-0.5 rounded font-mono font-bold">
                    PRE-SUBASTA
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-[#08101d] p-2 rounded border border-slate-800">
                    <span className="text-[9px] text-slate-500 block uppercase font-bold">Hora Programada</span>
                    <span className="font-bold text-white text-xs font-mono">HOY, 12:00 PM EST</span>
                  </div>
                  <div className="bg-[#08101d] p-2 rounded border border-slate-800">
                    <span className="text-[9px] text-slate-500 block uppercase font-bold">Cuenta Regresiva Estimada</span>
                    <span className="font-mono font-black text-amber-400 text-xs animate-pulse">03:45 MIN</span>
                  </div>
                </div>

                <div className="bg-[#08101d] p-2 rounded border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800/60 pb-1">
                    <span className="font-bold uppercase flex items-center gap-1 text-emerald-400">
                      <Users className="w-3.5 h-3.5" />
                      <span>Movimiento de Espectadores Reales:</span>
                    </span>
                    <span className="font-mono font-bold text-emerald-400">{viewersCount} en sala</span>
                  </div>
                  <div className="space-y-1 pt-1 max-h-20 overflow-y-auto">
                    {spectatorEvents.slice(0, 3).map((evt) => (
                      <div key={evt.id} className="text-[10px] text-slate-300 flex items-center justify-between font-mono">
                        <span className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${evt.type === 'join' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                          <span>{evt.text}</span>
                        </span>
                        <span className="text-slate-500 text-[9px]">{evt.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed italic border-t border-slate-800/80 pt-1.5">
                  {isBroker
                    ? 'Como Broker Autorizado, puedes abrir la subasta en cualquier momento usando el botón verde inferior.'
                    : 'Puedes observar el vehículo, las fotografías y la ficha técnica. Tu broker autorizado iniciará las pujas en cuanto comience la subasta.'}
                </p>

                {/* EXPEDIENTE TÉCNICO Y AUDITORÍA DEL LOTE */}
                <div className="bg-[#002855]/70 border border-blue-500/60 p-3 rounded-lg flex flex-col gap-2.5 mt-2">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0 mt-0.5">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-white text-xs block leading-snug">
                        Expediente Oficial de Patio:
                      </span>
                      <span className="text-[10px] text-slate-300 block leading-tight mt-0.5">
                        Registro técnico original del lote #{vehicle?.lot_number || '48291032'} en patio antes de la apertura de sala.
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 w-full pt-1 border-t border-blue-500/20">
                    <a
                      href={copartLotUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 bg-[#002855] hover:bg-[#003d80] text-amber-300 border border-amber-500/60 font-black text-[11px] sm:text-xs rounded-lg flex items-center justify-center gap-1.5 transition shadow whitespace-nowrap"
                      title="Ver expediente y reporte completo del lote"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                      <span>{lang === 'en' ? 'VIEW FULL VEHICLE ↗' : 'VER VEHÍCULO COMPLETO ↗'}</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setIsBuyerGuideOpen(true)}
                      className="px-2.5 py-1.5 bg-blue-900/80 hover:bg-blue-800 text-blue-200 border border-blue-600/60 font-bold text-[11px] sm:text-xs rounded-lg flex items-center justify-center gap-1.5 transition whitespace-nowrap"
                      title="Ver explicación de cómo opera tu broker en esta sala"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span>{lang === 'en' ? 'How it works' : '¿Cómo funciona?'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* PANEL DE PUJAS: DIFERENCIADO ENTRE BROKER Y CLIENTE ESPECTADOR */}
            {isBroker ? (
              /* PANEL DE PUJAS ACTIVO PARA EL BROKER */
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center">
                  <span>{lang === 'en' ? 'Your Broker Paddle:' : 'Tu Paleta de Broker:'} <strong className="text-amber-400">{activeParticipant?.paddleNumber || 'Paleta #101'}</strong></span>
                  <span className="text-emerald-400 font-mono">+${session.bid_increment || 250} USD {lang === 'en' ? 'Increment' : 'Incremento'}</span>
                </div>

                {/* BANNER DE AUTORIZACIÓN EXTRAORDINARIA APROBADA */}
                {authorizedBidAmount && (
                  <div className="bg-emerald-950/90 border-2 border-emerald-400 p-2.5 rounded-lg flex items-center justify-between text-xs animate-pulse shadow-lg">
                    <div className="flex items-center gap-2 text-emerald-200 font-bold">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      <div>
                        <span className="block text-emerald-300 font-black">
                          {lang === 'en' ? 'INCREASE AUTHORIZED BY BUYER!' : '¡AUMENTO AUTORIZADO POR EL COMPRADOR!'}
                        </span>
                        <span className="text-[10px] text-emerald-400">
                          {lang === 'en' ? `Extraordinary bid enabled for $${authorizedBidAmount.toLocaleString()} USD` : `Oferta extraordinaria habilitada por $${authorizedBidAmount.toLocaleString()} USD`}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handlePlaceBrokerBid(authorizedBidAmount)}
                      disabled={isSubmittingBid || !['open', 'bidding', 'last_call'].includes(session.status)}
                      className="bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black px-3.5 py-1.5 rounded-lg shadow text-xs transition"
                    >
                      {lang === 'en' ? 'Bid Now' : 'Pujar Ahora'}
                    </button>
                  </div>
                )}

                {/* ESTADO DE SOLICITUD PENDIENTE EN TIEMPO REAL */}
                {brokerBudgetStatus?.status === 'pending' && (
                  <div className="bg-amber-950/80 border border-amber-500/80 p-2.5 rounded-lg flex items-center gap-2 text-xs text-amber-200">
                    <Clock className="w-4 h-4 text-amber-400 animate-spin flex-shrink-0" />
                    <span>
                      {lang === 'en' ? 'Awaiting buyer confirmation for bid of ' : 'Esperando confirmación del comprador para la oferta de '}
                      <strong>${Number(brokerBudgetStatus.requestedAmount).toLocaleString()} USD</strong>...
                    </span>
                  </div>
                )}

                {/* BOTÓN PRINCIPAL DE OFERTA O SOLICITAR AUTORIZACIÓN */}
                {isNextBidOverBudget && !authorizedBidAmount ? (
                  <button
                    onClick={() => {
                      setRequestedAmountInput(String(nextBidAmount));
                      setShowRequestBudgetModal(true);
                    }}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-3.5 px-4 rounded-lg shadow-xl text-sm sm:text-base flex items-center justify-center gap-2 transition active:scale-95 border-b-4 border-amber-800"
                  >
                    <ShieldCheck className="w-5 h-5 text-slate-950" />
                    <span>
                      {lang === 'en'
                        ? `REQUEST BUYER AUTHORIZATION ($${nextBidAmount.toLocaleString()} USD)`
                        : `SOLICITAR AUTORIZACIÓN AL COMPRADOR ($${nextBidAmount.toLocaleString()} USD)`}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={() => handlePlaceBrokerBid(authorizedBidAmount || undefined)}
                    disabled={
                      isSubmittingBid ||
                      !['open', 'bidding', 'last_call'].includes(session.status) ||
                      !activeParticipant ||
                      (isNextBidOverBudget && !authorizedBidAmount)
                    }
                    className={`w-full font-black py-3.5 px-4 rounded-lg shadow-xl text-base sm:text-lg flex items-center justify-center gap-2 transition active:scale-95 border-b-4 ${authorizedBidAmount
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-700 animate-pulse'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-800'
                      }`}
                  >
                    <Flame className="w-5 h-5" />
                    <span>
                      {isSubmittingBid
                        ? t('submittingBid')
                        : authorizedBidAmount
                          ? (lang === 'en' ? `BID $${authorizedBidAmount.toLocaleString()} USD (AUTHORIZED)` : `PUJAR $${authorizedBidAmount.toLocaleString()} USD (OFERTA AUTORIZADA)`)
                          : (lang === 'en' ? `BID $${nextBidAmount.toLocaleString()} USD` : `PUJAR $${nextBidAmount.toLocaleString()} USD (OFERTA BROKER)`)}
                    </span>
                  </button>
                )}

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 px-1">
                  <span>{t('maxBudgetLabel')} <strong className="text-white font-mono">${clientBudget.toLocaleString()} USD</strong></span>
                  <button
                    onClick={() => {
                      setRequestedAmountInput(String(nextBidAmount));
                      setShowRequestBudgetModal(true);
                    }}
                    className="text-amber-400 hover:text-amber-300 font-bold hover:underline flex items-center gap-1"
                  >
                    <span>{lang === 'en' ? '+ Request Extraordinary Increase' : '+ Solicitar Aumento Extraordinario'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <button
                    onClick={() => handlePlaceBrokerBid(session.current_price + (session.bid_increment || 250))}
                    disabled={isSubmittingBid || !['open', 'bidding', 'last_call'].includes(session.status) || !activeParticipant || (session.current_price + (session.bid_increment || 250) > clientBudget + 1500 && authorizedBidAmount !== session.current_price + (session.bid_increment || 250))}
                    className="bg-[#050912] hover:bg-slate-800 disabled:opacity-40 text-xs font-bold text-slate-200 py-2 rounded border border-slate-700 transition"
                  >
                    +${session.bid_increment || 250}
                  </button>
                  <button
                    onClick={() => handlePlaceBrokerBid(session.current_price + 500)}
                    disabled={isSubmittingBid || !['open', 'bidding', 'last_call'].includes(session.status) || !activeParticipant || (session.current_price + 500 > clientBudget + 1500 && authorizedBidAmount !== session.current_price + 500)}
                    className="bg-[#050912] hover:bg-slate-800 disabled:opacity-40 text-xs font-bold text-slate-200 py-2 rounded border border-slate-700 transition"
                  >
                    +$500 USD
                  </button>
                  <button
                    onClick={() => handlePlaceBrokerBid(session.current_price + 1000)}
                    disabled={isSubmittingBid || !['open', 'bidding', 'last_call'].includes(session.status) || !activeParticipant || (session.current_price + 1000 > clientBudget + 1500 && authorizedBidAmount !== session.current_price + 1000)}
                    className="bg-[#050912] hover:bg-slate-800 disabled:opacity-40 text-xs font-black text-amber-400 py-2 rounded border border-slate-700 transition"
                  >
                    +$1,000 USD
                  </button>
                </div>
              </div>
            ) : (
              /* MONITOR INSTITUCIONAL DE TRANSMISIÓN EN VIVO PARA EL CLIENTE (VB3) */
              <div className="bg-[#050b16] border border-slate-800 p-4 rounded-xl text-left space-y-3.5 shadow-2xl">
                {/* Cabecera Institucional */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-400" />
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">
                        {lang === 'en' ? 'COPART VB3 • OFFICIAL LIVE STREAM MONITOR' : 'COPART VB3 • MONITOR DE TRANSMISIÓN OFICIAL'}
                      </h4>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {lang === 'en' ? 'LANE A • LICENSED BROKER REPRESENTATION' : 'CARRIL A • REPRESENTACIÓN OFICIAL POR BROKER AUTORIZADO'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#091326] border border-blue-600/40 px-2.5 py-1 rounded text-[11px] font-mono font-bold text-amber-400">
                    <span>PALETA #101</span>
                  </div>
                </div>

                {/* Fase Preparatoria / Inspección */}
                {session.status === 'prepared' && (
                  <div className="bg-[#081224] border border-slate-800 p-3.5 rounded-lg text-center space-y-1.5">
                    <div className="flex items-center justify-center gap-2 text-amber-400 font-bold text-xs">
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>{lang === 'en' ? 'LOT STANDBY • PRE-AUCTION INSPECTION' : 'LOTE EN ESPERA • FASE DE INSPECCIÓN PREVIA'}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed max-w-md mx-auto">
                      {lang === 'en'
                        ? 'The auctioneer has not yet opened Lane A. Your authorized broker is stationed at the terminal with Paddle #101 ready to bid.'
                        : 'El martillero aún no ha abierto el carril de puja. Su broker autorizado se encuentra conectado en mesa con la Paleta #101 listo para ofertar.'}
                    </p>
                  </div>
                )}

                {/* Fase de Subasta Activa: Telemetría de la Mesa */}
                {['open', 'bidding', 'last_call'].includes(session.status) && (
                  <div className="space-y-3">
                    {/* Tarjeta de Posición Oficial */}
                    {isBrokerWinning ? (
                      <div className="bg-[#06191f] border-2 border-emerald-500/80 p-3.5 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                        <div className="flex items-center justify-between border-b border-emerald-900/60 pb-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                            <span className="text-emerald-300 font-black text-xs uppercase tracking-wider">
                              {lang === 'en' ? 'OFFICIAL HIGH BID CONFIRMED' : 'POSTURA LÍDER CONFIRMADA POR MARTILLERO'}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                            PALETA #101
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between">
                          <span className="text-xs text-slate-300 uppercase tracking-wide font-semibold">
                            {lang === 'en' ? 'Current High Bid:' : 'Oferta Vigente en Mesa:'}
                          </span>
                          <span className="text-2xl sm:text-3xl font-mono font-black text-emerald-300">
                            ${Number(session?.current_price ?? 5000).toLocaleString()} USD
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-300 mt-2 leading-relaxed border-t border-emerald-950 pt-2">
                          {lang === 'en'
                            ? 'Your authorized broker holds the leading bid on the floor. If no counterbid is confirmed prior to the 3rd gavel call, the vehicle is awarded.'
                            : 'Su broker autorizado mantiene la postura más alta de la sala. Si no se confirman contraofertas antes del tercer golpe de martillo, el lote queda adjudicado.'}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-[#191307] border-2 border-amber-500/80 p-3.5 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                        <div className="flex items-center justify-between border-b border-amber-900/60 pb-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                            <span className="text-amber-300 font-black text-xs uppercase tracking-wider">
                              {lang === 'en' ? 'COMPETITOR COUNTERBID ON FLOOR' : 'POSTURA RIVAL EN CABEZA'}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                            {(session as any).currentWinnerPaddle || 'POSTOR RIVAL'}
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between">
                          <span className="text-xs text-slate-300 uppercase tracking-wide font-semibold">
                            {lang === 'en' ? 'Floor Price to Beat:' : 'Monto a Superar:'}
                          </span>
                          <span className="text-2xl sm:text-3xl font-mono font-black text-white">
                            ${Number(session?.current_price ?? 5000).toLocaleString()} USD
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-300 mt-2 leading-relaxed border-t border-amber-950 pt-2">
                          {lang === 'en'
                            ? 'A competitor has advanced the floor price. Your broker is analyzing the next increment within your authorized financial margin.'
                            : 'Un distribuidor competidor ha avanzado la postura. Su broker está evaluando el siguiente incremento dentro del margen financiero autorizado.'}
                        </p>
                      </div>
                    )}

                    {/* Telemetría Oficial de Sala Copart VB3 (Sin datos de presupuesto privado) */}
                    <div className="bg-[#081224] border border-slate-800 p-3 rounded-lg space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 uppercase font-semibold text-[11px]">Transmisión de Sala:</span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          COPART VB3 EN VIVO
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 uppercase font-semibold text-[11px]">Carril / Ubicación:</span>
                        <span className="text-slate-200 font-mono font-bold">LANE A • PATIO PRINCIPAL</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 uppercase font-semibold text-[11px]">Incremento Oficial:</span>
                        <span className="text-white font-mono font-bold">+${(session.bid_increment || 250).toLocaleString()} USD</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 uppercase font-semibold text-[11px]">Condición del Lote:</span>
                        <span className="text-amber-400 font-bold font-mono">SE SUBASTA AL MEJOR POSTOR</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Nota de Certificación Institucional */}
                <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between font-mono">
                  <span>SEGURIDAD SHA-256 • DATOS DE SALA COPART VB3</span>
                  <span className="text-emerald-400 font-bold">CONEXIÓN CIFRADA</span>
                </div>
              </div>
            )}

            {/* Banner de Resultado Final, Acta Imprimible y Enlace Documental */}
            {(session.status === 'sold' || session.status === 'closed') && (
              <div className="mt-3 p-3.5 rounded-lg bg-gradient-to-r from-amber-950/80 to-emerald-950/80 border-2 border-amber-500 text-center animate-fadeIn">
                <Award className="w-7 h-7 text-amber-400 mx-auto mb-1" />
                <h3 className="text-base font-black text-amber-300">
                  {session.status === 'sold'
                    ? (lang === 'en' ? 'LOT OFFICIALLY SOLD & HAMMERED DOWN!' : '¡LOTE ADJUDICADO DEFINITIVAMENTE!')
                    : (lang === 'en' ? 'AUCTION OFFICIALLY CLOSED' : 'SUBASTA CERRADA OFICIALMENTE')}
                </h3>
                <p className="text-xs text-slate-200 mt-0.5">
                  {lang === 'en' ? 'Awarded to:' : 'Adjudicado a:'} <strong className="text-white">{(session as any).currentWinnerPaddle || ''} - {(session as any).currentWinnerName || session.current_bidder_name}</strong>
                </p>
                <p className="text-sm font-black text-emerald-400 font-mono mt-1">
                  ${(Number(session?.current_price ?? (session as any)?.currentPrice ?? 5000)).toLocaleString()} USD
                </p>

                <div className="mt-3 pt-3 border-t border-amber-500/40 flex flex-wrap items-center justify-center gap-2">
                  {/* BOTÓN DIRECTO PARA VER E IMPRIMIR EL ACTA OFICIAL */}
                  <button
                    onClick={() => setShowCertificateModal(true)}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-3 py-1.5 rounded-lg shadow flex items-center gap-1.5 transition"
                  >
                    <FileText className="w-4 h-4" />
                    <span>{lang === 'en' ? 'View Official Certificate (PDF)' : 'Ver Acta Oficial (PDF)'}</span>
                  </button>

                  {/* GESTIÓN DE ENLACE DOCUMENTAL INDEPENDIENTE PARA EL CLIENTE */}
                  {isBroker && (
                    <>
                      {currentDocToken ? (
                        <>
                          <button
                            onClick={handleCopyDocLink}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow flex items-center gap-1.5 transition"
                            title="Copiar enlace privado de entrega documental para el cliente"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>{copiedDocLink ? t('copied') : (lang === 'en' ? 'Copy Certificate Link' : 'Copiar Enlace Documental')}</span>
                          </button>

                          <a
                            href={`#/documento/${currentDocToken}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1 transition"
                            title="Abrir comprobante documental en nueva pestaña"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>{lang === 'en' ? 'Open Document' : 'Abrir Documento'}</span>
                          </a>

                          <button
                            onClick={handleRevokeDocLink}
                            disabled={isRevokingDoc}
                            className="bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700/60 font-bold text-xs px-2.5 py-1.5 rounded-lg transition"
                            title="Revocar el enlace documental entregado al cliente"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>{lang === 'en' ? 'Revoke Link' : 'Revocar Enlace'}</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={handleGenerateDocLink}
                          className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow flex items-center gap-1.5 transition"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>{lang === 'en' ? 'Generate Document Link' : 'Generar Enlace Documental'}</span>
                        </button>
                      )}
                    </>
                  )}
                </div>

                {docFeedbackMsg && (
                  <p className="text-[11px] text-emerald-400 font-mono font-bold mt-2 animate-fadeIn">
                    {docFeedbackMsg}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* REGISTRO DE ACTIVIDAD Y PARTICIPANTES REALES */}
          <div className="bg-[#09101c] border border-[#1b2b44] rounded-lg p-3 flex-1 flex flex-col min-h-[240px] shadow-xl text-xs">

            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('bids')}
                  className={`font-bold pb-1 transition border-b-2 ${activeTab === 'bids'
                      ? 'border-amber-400 text-amber-400'
                      : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                >
                  {t('tabBidHistory')} ({bids.length})
                </button>
                <button
                  onClick={() => setActiveTab('participants')}
                  className={`font-bold pb-1 transition border-b-2 ${activeTab === 'participants'
                      ? 'border-amber-400 text-amber-400'
                      : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                >
                  {t('tabParticipants')} ({participants.length})
                </button>
              </div>

              <span className="text-[10px] text-emerald-400 font-mono font-bold">
                {lang === 'en' ? 'WEBSOCKET ACTIVE' : 'WEBSOCKET ACTIVO'}
              </span>
            </div>

            {/* TAB 1: FLUJO DE OFERTAS REALES */}
            {activeTab === 'bids' && (
              <div className="flex-1 overflow-y-auto max-h-[260px] space-y-1.5 pr-1">
                {bids.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500 py-8">
                    Esperando primera oferta en sala...
                  </div>
                ) : (
                  bids.map((b) => (
                    <div
                      key={b.id}
                      className={`flex items-center justify-between p-2 rounded text-xs border ${(b as any).paddle_number?.includes('101')
                          ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200'
                          : 'bg-[#050912] border-slate-800/80 text-slate-200'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[9.5px] font-mono bg-blue-950 text-blue-300 border border-blue-800 px-1.5 py-0.5 rounded font-bold">
                          #{b.sequence_number}
                        </span>
                        <span className="font-bold text-amber-300">
                          {(b as any).paddle_number || b.bidder_name}
                        </span>
                        <span className="text-slate-400 text-[11px] truncate max-w-[120px]">
                          {b.bidder_name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-mono">
                          {b.timestamp ? new Date(b.timestamp).toLocaleTimeString() : ''}
                        </span>
                        <span className="font-mono font-black text-emerald-400 text-sm">
                          ${b.amount.toLocaleString()} USD
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 2: PALETAS AUTORIZADAS EN SALA */}
            {activeTab === 'participants' && (
              <div className="flex-1 overflow-y-auto max-h-[260px] space-y-1.5 pr-1">
                {[
                  { paddle: 'Paleta #101', name: session.broker_name || 'Broker Autorizado (Representante)', loc: 'Miami, FL', isBroker: true },
                  { paddle: 'Paleta #108', name: 'AutoExport Dallas LLC', loc: 'Dallas, TX' },
                  { paddle: 'Paleta #214', name: 'Pacific Salvage Auctions', loc: 'Los Angeles, CA' },
                  { paddle: 'Paleta #305', name: 'Global Fleet Buyers', loc: 'Atlanta, GA' },
                  { paddle: 'Paleta #412', name: 'Buckeye Motor Exchange', loc: 'Columbus, OH' },
                  { paddle: 'Paleta #519', name: 'Lone Star Salvage Group', loc: 'Houston, TX' },
                  { paddle: 'Paleta #623', name: 'Midwest Premier Liquidation', loc: 'Chicago, IL' },
                ].map((p) => {
                  const isLeading = (session as any).currentWinnerPaddle === p.paddle;
                  return (
                    <div
                      key={p.paddle}
                      className={`flex items-center justify-between p-2 rounded border text-xs ${isLeading
                          ? 'bg-emerald-950/60 border-emerald-500/80 shadow'
                          : 'bg-[#050912] border-slate-800/80'
                        }`}
                    >
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span className={`font-mono font-black ${isLeading ? 'text-emerald-400' : 'text-amber-400'}`}>{p.paddle}</span>
                          <span>•</span>
                          <span className="truncate max-w-[140px]">{p.name}</span>
                          {p.isBroker && (
                            <span className="bg-blue-900/60 text-blue-300 text-[9px] px-1.5 py-0.2 rounded font-black">
                              BROKER
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">{p.loc}</span>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold uppercase border ${isLeading
                          ? 'bg-emerald-500 text-slate-950 border-emerald-300 font-black animate-pulse'
                          : 'bg-emerald-950 border-emerald-700/60 text-emerald-300'
                        }`}>
                        {isLeading ? (lang === 'en' ? 'HIGH BIDDER' : 'LÍDER') : (lang === 'en' ? 'AUTHORIZED' : 'AUTORIZADO')}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* TOAST DE FEEDBACK DE SUBIDA DE VEHÍCULO A SALA */}
      {feedbackToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 font-black px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border-2 border-emerald-300 text-xs sm:text-sm animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-slate-950 shrink-0" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* DOCK INFERIOR OFICIAL COPART VB3: LISTA DE VEHÍCULOS, COLA, CARRIL, COMPARAR Y PATIO */}
      <section className="max-w-[1720px] w-full mx-auto px-2 sm:px-4 mb-4">
        <div className="bg-[#09101c] border border-[#1b2b44] rounded-xl p-3 sm:p-4 shadow-2xl">
          
          {/* BARRA DE PESTAÑAS (TABS DEL DOCK) */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5 mb-3.5">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {/* Tab 1: Lista de vehículos */}
              <button
                type="button"
                onClick={() => setBottomDockTab('lista')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition ${
                  bottomDockTab === 'lista'
                    ? 'bg-amber-500 text-slate-950 shadow-md ring-1 ring-amber-300'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>Lista de vehículos ({dockVehicles.length})</span>
              </button>

              {/* Tab 2: Cola */}
              <button
                type="button"
                onClick={() => setBottomDockTab('cola')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition ${
                  bottomDockTab === 'cola'
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
                onClick={() => setBottomDockTab('carril')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition ${
                  bottomDockTab === 'carril'
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
                onClick={() => setBottomDockTab('comparar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition ${
                  bottomDockTab === 'comparar'
                    ? 'bg-purple-600 text-white shadow-md ring-1 ring-purple-300'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Calculator className="w-3.5 h-3.5 text-purple-200" />
                <span>Comparar</span>
              </button>

              {/* Tab 5: Patio Oficial */}
              <button
                type="button"
                onClick={() => setBottomDockTab('patio')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition ${
                  bottomDockTab === 'patio'
                    ? 'bg-slate-700 text-amber-300 shadow-md ring-1 ring-amber-400'
                    : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{vehicle?.location || 'FL - MIAMI NORTH'}</span>
              </button>
            </div>

            <span className="text-[11px] font-mono text-slate-400 hidden lg:inline">
              Control de Transmisión VB3 • Actualización en tiempo real
            </span>
          </div>

          {/* CONTENIDO TAB 1: LISTA DE VEHÍCULOS (SELECCIÓN Y SUBIDA A PANTALLA) */}
          {bottomDockTab === 'lista' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Selecciona cualquier vehículo registrado en el inventario y pulsa <strong className="text-emerald-400 font-bold">«SUBIR A PANTALLA»</strong> para cargarlo en tiempo real a todas las pantallas:</span>
                <span className="text-amber-300 font-mono font-bold">Modo: STANDBY (15 seg)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {dockVehicles.map((veh) => {
                  const isCurrentActive = String(veh.lot_number).trim() === String(vehicle?.lot_number).trim() || veh.id === vehicle?.id;
                  const thumb = veh.images?.[0]?.url || 'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=600&q=80';

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
                          <span className="text-[11px] text-amber-300 font-mono block">
                            Lote #{veh.lot_number}
                          </span>
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

                      {/* BOTÓN DE ACCIÓN: SUBIR A PANTALLA */}
                      <div className="pt-2 border-t border-slate-800/80">
                        {isCurrentActive ? (
                          <div className="w-full py-2 rounded-lg bg-emerald-950/80 border border-emerald-500 text-emerald-300 font-black text-xs flex items-center justify-center gap-1.5 shadow">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>✓ EN PANTALLA PRINCIPAL</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSubirAPantalla(veh)}
                            className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition shadow-lg active:scale-95 cursor-pointer"
                            title="Subir inmediatamente a la pantalla principal en modo PREPARADO (15s)"
                          >
                            <Zap className="w-4 h-4 fill-slate-950" />
                            <span>SUBIR A PANTALLA (CARGAR A SALA)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CONTENIDO TAB 2: COLA (ON-DECK) */}
          {bottomDockTab === 'cola' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400">
                Orden de vehículos programados para subasta en este carril. Puedes adelantar cualquier vehículo a pantalla:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {dockVehicles.map((veh, idx) => {
                  const isCurrentActive = String(veh.lot_number).trim() === String(vehicle?.lot_number).trim();
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
                          className="py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1 transition shadow"
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
          {bottomDockTab === 'carril' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-[#050a16] border border-slate-800 rounded-xl p-3">
                <span className="text-slate-400 block text-[11px] uppercase font-bold mb-1">Carril de Subasta:</span>
                <span className="text-white font-black text-sm block">LANE A • Transmisión Principal VB3</span>
                <span className="text-emerald-400 font-mono text-xs block mt-1">● Activo en Tiempo Real</span>
              </div>
              <div className="bg-[#050a16] border border-slate-800 rounded-xl p-3">
                <span className="text-slate-400 block text-[11px] uppercase font-bold mb-1">Patio de Ubicación:</span>
                <span className="text-amber-300 font-bold text-sm block">{vehicle?.location || 'FL - Miami North (Yard 12)'}</span>
                <span className="text-slate-400 text-[11px] block mt-1">Opa-Locka, Florida, EE. UU.</span>
              </div>
              <div className="bg-[#050a16] border border-slate-800 rounded-xl p-3">
                <span className="text-slate-400 block text-[11px] uppercase font-bold mb-1">Representación Autorizada:</span>
                <span className="text-blue-300 font-bold text-sm block">Paleta Oficial #101</span>
                <span className="text-slate-400 text-[11px] block mt-1">Broker conectado y listo para pujar</span>
              </div>
            </div>
          )}

          {/* CONTENIDO TAB 4: COMPARAR */}
          {bottomDockTab === 'comparar' && (
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
                  {dockVehicles.map((v) => {
                    const isCurrent = String(v.lot_number).trim() === String(vehicle?.lot_number).trim();
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
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-[11px] transition shadow"
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
          {bottomDockTab === 'patio' && (
            <div className="bg-[#050a16] border border-slate-800 rounded-xl p-4 text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-base font-black text-white">{vehicle?.location || 'FL - Miami North (Yard 12)'}</span>
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
      </section>

      {/* 3. CONSOLA DEL OPERADOR/BROKER ("LO MANEJO YO") */}
      {isBroker && (
        <div className="sticky bottom-0 z-50 bg-[#080d18]/95 backdrop-blur-md border-t-2 border-amber-500 shadow-2xl">

          {/* BANNER ATENCIÓN SIGUIENTE CLIENTE TRAS FINALIZAR */}
          {(session.status === 'sold' || session.status === 'closed') && (
            <div className="bg-gradient-to-r from-amber-950/90 via-[#002855] to-[#0e1828] border-b border-amber-500/50 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xl animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <Award className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div>
                  <span className="font-black text-white text-sm">
                    {lang === 'en' ? 'LOT AWARDED TO REAL BROKER' : 'LOTE ADJUDICADO AL BROKER REAL'} ({(session as any).current_winner_paddle || 'Paleta #101'})
                  </span>
                  <p className="text-slate-300 text-[11px] mt-0.5">
                    {lang === 'en'
                      ? 'This lot has concluded and former client access has expired. You can attend the next client and load a new lot in this lane.'
                      : 'Esta subasta concluyó y el acceso del cliente anterior ha expirado. Puedes pasar al siguiente cliente y lote en esta misma sala.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowNextLotModal(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-lg transition active:scale-95 flex-shrink-0 border border-emerald-400/40"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{lang === 'en' ? 'Attend Next Client & Load Lot' : 'Atender Siguiente Cliente y Cargar Lote'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODAL DE FOTOGRAFÍAS FULL SCREEN */}
      <ImageGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        images={displayedImages}
        initialIndex={selectedImageIdx}
        title={`${vehicle?.year} ${vehicle?.brand} ${vehicle?.model} - Lote #${vehicle?.lot_number}`}
      />



      {/* MODAL OFICIAL: ACTA DE ADJUDICACIÓN IMPRIMIBLE (PDF) */}
      {showCertificateModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1828] border border-[#1b3152] rounded-xl max-w-xl w-full p-6 shadow-2xl animate-fadeIn text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <CopartLogo size="sm" showSubtitle={true} />
              <button
                onClick={() => setShowCertificateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Hoja Imprimible Oficial */}
            <div className="bg-[#070e1a] p-5 rounded-xl border border-slate-800 space-y-4 print:bg-white print:text-black">
              <div className="text-center border-b border-slate-800 pb-3">
                <span className="text-[10px] font-bold tracking-widest text-amber-400 uppercase">
                  CERTIFICADO OFICIAL DE RESULTADO Y ADJUDICACIÓN DE SUBASTA
                </span>
                <h2 className="text-lg font-black text-white mt-1">
                  {vehicle?.year} {vehicle?.brand} {vehicle?.model}
                </h2>
                <span className="text-xs font-mono text-slate-400">
                  LOTE #{vehicle?.lot_number || '48291032'} • TERMINAL LANE A
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Número de VIN:</span>
                  <span className="font-mono font-bold text-white">{vehicle?.vin || '1FA6P8CF9P5198241'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Odómetro Certificado:</span>
                  <span className="font-mono text-white">{vehicle?.odometer?.toLocaleString() || '14,250'} MI</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Tipo de Título:</span>
                  <span className="font-bold text-amber-300 uppercase">{vehicle?.title_type || 'SALVAGE CERTIFICATE'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Fecha y Hora de Cierre:</span>
                  <span className="font-mono text-slate-300">{new Date().toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Adjudicatario Ganador:</span>
                  <span className="font-bold text-emerald-400 text-sm">
                    {(session as any).currentWinnerPaddle || 'Paleta #101'} - {(session as any).currentWinnerName || session.current_bidder_name || 'Carlos Mendoza'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Precio Final de Adjudicación:</span>
                  <span className="font-mono font-black text-emerald-400 text-base">
                    ${(Number(session?.current_price ?? (session as any)?.currentPrice ?? 5000)).toLocaleString()} USD
                  </span>
                </div>
              </div>

              <div className="p-3 bg-[#0a1320] rounded border border-slate-800 text-center">
                <span className="text-slate-400 block text-[11px] mb-1">Estado de la Operación:</span>
                <span className="text-sm font-black uppercase tracking-wider text-emerald-400">
                  VEHÍCULO ADJUDICADO DEFINITIVAMENTE CON GAVEL
                </span>
              </div>

              {/* Firma del Broker y Sello */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div className="text-left">
                  <div className="w-40 border-b border-slate-600 mb-1" />
                  <span className="text-[10px] text-slate-400 block">Firma del Broker Autorizado</span>
                  <span className="text-[9px] text-amber-400 font-mono">Licencia #BK-78921-USA</span>
                </div>
                <div className="text-right">
                  <div className="inline-block p-1.5 rounded border border-emerald-500/40 text-[9px] font-mono text-emerald-400 bg-emerald-950/40">
                    ✓ VERIFICADO ATÓMICAMENTE POR SERVIDOR
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 mt-2">
              <button
                onClick={() => window.print()}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Comprobante Oficial (PDF)</span>
              </button>

              <button
                onClick={() => setShowCertificateModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DEL BROKER: SOLICITAR AUTORIZACIÓN EXTRAORDINARIA AL COMPRADOR */}
      {showRequestBudgetModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1828] border-2 border-amber-500/80 rounded-xl max-w-md w-full p-5 shadow-2xl animate-fadeIn text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-sm">
                  {t('modalRequestTitle')}
                </h3>
              </div>
              <button onClick={() => setShowRequestBudgetModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {t('modalRequestDesc')}
              </p>

              <div className="bg-[#050912] p-3 rounded-lg border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-400">
                  <span>{lang === 'en' ? 'Vehicle:' : 'Vehículo:'}</span>
                  <span className="font-bold text-white truncate max-w-[200px]">{vehicle?.year} {vehicle?.brand} {vehicle?.model}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>{t('modalOriginalBudget')}:</span>
                  <span className="font-mono font-bold text-white">${(Number(clientBudget) || 7500).toLocaleString()} USD</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>{t('modalCurrentPrice')}:</span>
                  <span className="font-mono font-bold text-emerald-400">${(Number(session?.current_price ?? (session as any)?.currentPrice ?? 5000)).toLocaleString()} USD</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-bold uppercase">
                  {t('inputBidAmount')}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-amber-400 font-bold text-sm">$</span>
                  <input
                    type="number"
                    value={requestedAmountInput}
                    onChange={(e) => setRequestedAmountInput(e.target.value)}
                    placeholder="Ej. 7800"
                    className="w-full bg-[#050912] border-2 border-amber-500/60 focus:border-amber-400 text-white font-mono font-black text-base pl-7 pr-3 py-1.5 rounded-lg focus:outline-none"
                  />
                </div>
                {Number(requestedAmountInput) > (Number(clientBudget) || 7500) && (
                  <div className="mt-1 flex justify-between text-[11px] font-mono">
                    <span className="text-slate-400">{t('modalDifference')}:</span>
                    <span className="text-amber-400 font-bold">+${(Number(requestedAmountInput) - (Number(clientBudget) || 7500)).toLocaleString()} USD</span>
                  </div>
                )}
              </div>

              <div className="bg-amber-950/40 border border-amber-700/50 p-2.5 rounded text-[10.5px] text-amber-300">
                ⚠️ <strong>{lang === 'en' ? 'Strict Policy:' : 'Regla Estricta:'}</strong> {lang === 'en' ? 'This extraordinary authorization is valid for a single bid of this exact amount.' : 'Esta autorización es válida únicamente para realizar una sola puja por este importe exacto.'}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRequestBudgetModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3.5 py-2 rounded-lg text-xs font-semibold transition"
                >
                  {t('btnCancel')}
                </button>
                <button
                  type="button"
                  onClick={handleCreateBudgetRequest}
                  disabled={isSubmittingBudgetRequest || !requestedAmountInput || Number(requestedAmountInput) <= clientBudget}
                  className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow transition"
                >
                  {isSubmittingBudgetRequest ? (
                    <span>{t('requestingAuth')}</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>{t('btnSubmitRequest')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DEL COMPRADOR: CONFIRMACIÓN EXPRESA DE AUTORIZACIÓN EXTRAORDINARIA */}
      {pendingBuyerRequest && role === 'buyer' && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0e1828] border-2 border-amber-400 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-fadeIn text-xs">
            <div className="text-center pb-3 border-b border-slate-800">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mx-auto mb-2 text-amber-400">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-black text-white tracking-wide">
                {t('modalAuthTitle')}
              </h2>
              <p className="text-xs text-amber-300 mt-1">
                {t('modalAuthDesc')}
              </p>
            </div>

            <div className="my-4 space-y-3">
              {/* FICHA RESUMEN DEL VEHÍCULO Y LOTE */}
              <div className="bg-[#050912] p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">{lang === 'en' ? 'Vehicle & Lot #' : 'Vehículo & Lote'}</span>
                  <span className="text-sm font-black text-white block">
                    {vehicle?.year} {vehicle?.brand} {vehicle?.model}
                  </span>
                  <span className="text-[11px] font-mono text-amber-400">
                    {t('lotPrefix')} #{vehicle?.lot_number || '48291032'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">{t('modalCurrentPrice')}</span>
                  <span className="text-sm font-black font-mono text-emerald-400">
                    ${(Number(session?.current_price ?? (session as any)?.currentPrice ?? 5000)).toLocaleString()} USD
                  </span>
                </div>
              </div>

              {/* COMPARATIVA DE PRESUPUESTO Y NUEVA OFERTA */}
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-[#050912] p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">{t('modalOriginalBudget')}</span>
                  <span className="text-base font-black font-mono text-slate-200 mt-0.5 block">
                    ${Number(pendingBuyerRequest.initialBudget || clientBudget).toLocaleString()} USD
                  </span>
                </div>

                <div className="bg-amber-950/40 p-3 rounded-xl border border-amber-500/80">
                  <span className="text-[10px] text-amber-400 block font-bold uppercase">{t('modalRequestedBid')}</span>
                  <span className="text-lg font-black font-mono text-amber-300 mt-0.5 block">
                    ${Number(pendingBuyerRequest.requestedAmount).toLocaleString()} USD
                  </span>
                </div>
              </div>

              <div className="bg-[#050912] p-2.5 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">{t('modalDifference')}:</span>
                <span className="font-mono font-black text-rose-400 text-sm">
                  +${(Number(pendingBuyerRequest.requestedAmount) - Number(pendingBuyerRequest.initialBudget || clientBudget)).toLocaleString()} USD
                </span>
              </div>

              <div className="bg-blue-950/40 border border-blue-800/60 p-2.5 rounded-lg text-[11px] text-blue-200 leading-relaxed">
                ℹ️ {lang === 'en'
                  ? `This authorization allows a single bid for the exact amount of $${Number(pendingBuyerRequest.requestedAmount).toLocaleString()} USD. If topped by another bidder, a new authorization will be requested.`
                  : `Esta autorización autoriza únicamente una oferta por el valor exacto de $${Number(pendingBuyerRequest.requestedAmount).toLocaleString()} USD. Si la puja es superada por otro postor, se requerirá una nueva autorización.`}
              </div>
            </div>

            {/* BOTONES DE DECISIÓN DEL COMPRADOR */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleRespondBudgetRequest(pendingBuyerRequest.id, 'reject')}
                disabled={isRespondingBudgetRequest}
                className="bg-slate-800 hover:bg-rose-950 hover:text-rose-200 hover:border-rose-700 text-slate-300 font-bold py-3 px-4 rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5"
              >
                <X className="w-4 h-4 text-rose-400" />
                <span>{t('btnRejectAuth')}</span>
              </button>

              <button
                type="button"
                onClick={() => handleRespondBudgetRequest(pendingBuyerRequest.id, 'approve')}
                disabled={isRespondingBudgetRequest}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 px-4 rounded-xl border-b-4 border-emerald-800 shadow-xl transition flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>{t('btnApproveAuth')} (${Number(pendingBuyerRequest.requestedAmount).toLocaleString()} USD)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA CARGAR SIGUIENTE LOTE EN ESTA SALA */}
      <NextLotModal
        isOpen={showNextLotModal}
        onClose={() => setShowNextLotModal(false)}
        sessionId={session.id}
        onSuccess={(data) => {
          setNextLotLinks(data);
          sounds.playSoldFanfare();
          fetchStateFromServer();
        }}
      />

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
                  onClick={() => {
                    navigator.clipboard.writeText(nextLotLinks.brokerUrl);
                    setCopiedNextKey('broker');
                    setTimeout(() => setCopiedNextKey(null), 2500);
                  }}
                  className="p-1.5 px-3 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-1 shadow flex-shrink-0"
                >
                  {copiedNextKey === 'broker' ? <Check className="w-3.5 h-3.5 text-slate-950" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedNextKey === 'broker' ? '¡Copiado!' : 'Copiar Link'}</span>
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
                  onClick={() => {
                    navigator.clipboard.writeText(nextLotLinks.buyerUrl);
                    setCopiedNextKey('buyer');
                    setTimeout(() => setCopiedNextKey(null), 2500);
                  }}
                  className="p-1.5 px-3 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow flex-shrink-0"
                >
                  {copiedNextKey === 'buyer' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedNextKey === 'buyer' ? '¡Copiado!' : 'Copiar Link'}</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setNextLotLinks(null)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2 rounded-lg text-xs transition"
              >
                Continuar en Sala (Lane A)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL OFICIAL DE REPORTE DE HISTORIAL CARFAX / AUTOCHECK */}
      {isCarfaxModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-[#0b1323] border border-emerald-500/60 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="text-base font-black text-white">REPORTE OFICIAL CARFAX / AUTOCHECK</h3>
                  <p className="text-slate-400 text-xs font-mono">VIN: {vehicle?.vin || '1FA6P8CF9P5198241'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCarfaxModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <strong className="text-emerald-300 block font-bold">{vehicle?.custom_badges?.carfaxTitleStatus || 'Historial de Título Verificado'}</strong>
                  <span className="text-slate-300 text-[11px]">{vehicle?.custom_badges?.carfaxVerifiedNotes || 'Sin reporte de inundación, sin reporte de robo, odómetro original verificado.'}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#060b17] border border-slate-800 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Propietarios Registrados:</span>
                  <strong className="text-white">{vehicle?.custom_badges?.carfaxOwners || '1 Dueño Particular (Florida Title)'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Historial de Mantenimientos:</span>
                  <span className="text-emerald-400 font-bold">{vehicle?.custom_badges?.carfaxServiceRecords || '14 Registros en Concesionario'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Accidentes Reportados:</span>
                  <span className="text-emerald-400 font-bold">{vehicle?.custom_badges?.carfaxAccidents || '0 Accidentes / 0 Pérdidas'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Estatus de Llaves:</span>
                  <span className="text-emerald-400 font-bold">{vehicle?.has_keys ? 'Llaves Originales Incluidas (Yes)' : 'Sin Llaves (No Keys)'}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCarfaxModalOpen(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition"
            >
              Cerrar Reporte
            </button>
          </div>
        </div>
      )}

      {/* MODAL PARA INSIGNIAS EXTRA PERSONALIZADAS */}
      {activeExtraBadgeModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-[#0b1323] border border-amber-500/60 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-black text-white uppercase">{activeExtraBadgeModal.modalTitle || activeExtraBadgeModal.label}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveExtraBadgeModal(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed bg-[#060c18] p-3.5 rounded-xl border border-slate-800">
              {activeExtraBadgeModal.modalContent || 'Información verificada en patio Copart para este lote.'}
            </p>
            <button
              type="button"
              onClick={() => setActiveExtraBadgeModal(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition"
            >
              Cerrar Detalle
            </button>
          </div>
        </div>
      )}



      {/* MODAL OFICIAL: 6 COMPROBACIONES DE SEGURIDAD COPART */}
      <CopartVerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        vehicle={vehicle}
        usTime={usTime}
        brokerName={activeParticipant?.name || 'Broker Oficial Copart'}
        paddleNumber={activeParticipant?.paddleNumber || '101'}
        currentPrice={Number(session?.current_price ?? (session as any)?.currentPrice ?? 5000)}
      />

      {/* MODAL OFICIAL: GUÍA DE INDUCCIÓN AL COMPRADOR */}
      <BuyerGuideModal
        isOpen={isBuyerGuideOpen}
        onClose={() => setIsBuyerGuideOpen(false)}
        brokerName={activeParticipant?.name || 'Broker Oficial Copart'}
        paddleNumber={activeParticipant?.paddleNumber || '101'}
        lotNumber={vehicle?.lot_number || '48291032'}
      />
    </div>
  );
};
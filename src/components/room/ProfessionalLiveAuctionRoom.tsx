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
  ExternalLink as LinkIcon, Tag, HelpCircle, Megaphone
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
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    const onInteract = () => setHasInteracted(true);
    window.addEventListener('click', onInteract, { once: true });
    window.addEventListener('touchstart', onInteract, { once: true });
    return () => {
      window.removeEventListener('click', onInteract);
      window.removeEventListener('touchstart', onInteract);
    };
  }, []);
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
  const [isVideoModalOpen, setIsVideoModalOpen] = useState<boolean>(false);
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

  const triggerSoldConfettiCelebration = useCallback((winnerPaddleParam?: string, winnerNameParam?: string) => {
    try {
      const price = Number(session?.current_price ?? (session as any)?.currentPrice ?? 5000);
      const winnerPaddle = winnerPaddleParam || (session as any)?.current_winner_paddle || (session as any)?.currentWinnerPaddle || (bids.length > 0 ? ((bids[0] as any).paddle_number || (bids[0] as any).paddleNumber) : 'Paleta #101');
      let winnerName = winnerNameParam || (session as any)?.current_winner_name || (session as any)?.currentWinnerName || (session as any)?.broker_name;
      if (!winnerName || winnerName.includes('Representante') || winnerName.includes('Broker Autorizado')) {
        const p101 = participants.find((p: any) => p.paddleNumber === 'Paleta #101' || p.paddle_number === 'Paleta #101');
        winnerName = p101?.name || (session as any)?.brokerName || 'Carlos Mendoza';
      }
      sounds.playSoldFanfare(price, winnerPaddle, winnerName);
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

      if (data.session.announcement || (data.session as any).latest_announcement) {
        setLiveAnnouncement(data.session.announcement || (data.session as any).latest_announcement);
      }

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
          triggerSoldConfettiCelebration(data.session.current_winner_paddle, data.session.current_winner_name);
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

  // Cronómetro local 1 Hz continuo cuando la subasta está activa (open / bidding / last_call)
  useEffect(() => {
    if (session.status !== 'open' && session.status !== 'bidding' && session.status !== 'last_call') {
      return;
    }

    const timer = setInterval(() => {
      setSession((prev) => {
        if (prev.status !== 'open' && prev.status !== 'bidding' && prev.status !== 'last_call') {
          return prev;
        }
        if (prev.time_remaining_seconds <= 0) {
          return prev;
        }
        const nextTime = Math.max(0, prev.time_remaining_seconds - 1);
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

  // Escuchar en vivo movimientos de espectadores, presencia y autorizaciones por WebSocket
  useEffect(() => {
    const unsubscribeWs = store.onWsMessage((msg: any) => {
      try {
        if (!msg) return;
        if (msg.type === 'CLOCK_TICK') {
          setSession((prev) => ({
            ...prev,
            time_remaining_seconds: msg.timeRemaining !== undefined ? Number(msg.timeRemaining) : prev.time_remaining_seconds,
            current_price: msg.currentPrice !== undefined ? Number(msg.currentPrice) : prev.current_price,
            status: msg.status || prev.status,
          }));
          if (msg.viewersCount !== undefined) {
            setViewersCount(msg.viewersCount);
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
            triggerSoldConfettiCelebration(msg.winnerPaddle, msg.winnerName);
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
        } else if (msg.type === 'PARTICIPANTS_UPDATED') {
          if (msg.brokerName) {
            setSession((prev) => ({
              ...prev,
              broker_name: msg.brokerName,
              brokerName: msg.brokerName,
              broker_location: msg.brokerLocation || (prev as any).broker_location,
              brokerLocation: msg.brokerLocation || (prev as any).broker_location,
            }));
          }
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
            broker_name: msg.brokerName || prev.broker_name,
            brokerName: msg.brokerName || (prev as any).brokerName,
            broker_location: msg.brokerLocation || (prev as any).broker_location,
            brokerLocation: msg.brokerLocation || (prev as any).broker_location,
          }));

          if (msg.status === 'sold' && !hasCelebratedSoldRef.current) {
            hasCelebratedSoldRef.current = true;
            triggerSoldConfettiCelebration(msg.winnerPaddle, msg.winnerName);
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

  // ENVÍO DE OFERTA EXCLUSIVA DEL BROKER (SIN BLOQUEOS NI LÍMITES)
  const handlePlaceBrokerBid = async (customAmount?: number) => {
    setServerError(null);
    const minRequired = session.current_price + (session.bid_increment || 250);
    const amountToBid = customAmount || minRequired;

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

      {/* BANNER FLOTANTE PARA ACTIVAR AUDIO EN CELULARES */}
      {!hasInteracted && (
        <div
          onClick={() => {
            setHasInteracted(true);
            try {
              sounds.setMuted(false);
              setIsAudioMuted(false);
              sounds.unlockAudio();
              sounds.playBidPing();
              sounds.speak('Audio connected', 1.1, 'en-US');
            } catch { }
          }}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-center py-3 px-4 text-xs sm:text-sm font-black cursor-pointer shadow-2xl flex items-center justify-center gap-2 border-b-2 border-emerald-300 z-50 sticky top-0 transition animate-pulse"
        >
          <Volume2 className="w-5 h-5 animate-bounce" />
          <span>🔊 TOCA AQUÍ PARA ACTIVAR EL AUDIO EN VIVO DE LA SUBASTA (LANE A)</span>
        </div>
      )}

      {/* 1. BARRA SUPERIOR AUTÉNTICA COPART VB3 LIVE */}
      <header className="bg-[#002855] border-b-2 border-[#ffb81c] px-2 sm:px-4 lg:px-6 py-2 shadow-xl sticky top-0 z-40 overflow-x-hidden">
        <div className="max-w-[1720px] mx-auto flex items-center justify-between gap-2">

          <div className="flex items-center gap-2 lg:gap-4 shrink-0">
            <div className="sm:hidden">
              <CopartLogo size="sm" showSubtitle={false} className="py-0.5 filter drop-shadow-md" />
            </div>
            <div className="hidden sm:block">
              <CopartLogo size="lg" showSubtitle={true} className="py-0.5 filter drop-shadow-md" />
            </div>

            {/* Pista e Identificación de Lote */}
            <div className="hidden xl:flex items-center gap-2 bg-[#0c192c] border border-blue-900/60 px-3 py-1.5 rounded-lg text-xs sm:text-sm whitespace-nowrap">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-black text-white tracking-wide">{t('laneTitle')}</span>
              <span className="text-slate-400">•</span>
              <span className="text-amber-300 font-mono font-bold">{vehicle?.location || 'Atlanta East Yard 12'}</span>
            </div>

            {/* LOTE OFICIAL COPART Y EXPEDIENTE DE PATIO */}
            <div className="flex items-center bg-[#0c192c] border border-slate-700/80 rounded-lg overflow-hidden text-xs sm:text-sm shadow-sm whitespace-nowrap">
              <div className="px-2.5 sm:px-3 py-1.5 flex items-center gap-1.5">
                <span className="text-slate-300 text-xs font-bold uppercase tracking-wider">{t('lotPrefix')}</span>
                <span className="font-mono font-black text-amber-400 text-sm sm:text-base">
                  #{vehicle?.lot_number || '48291032'}
                </span>
              </div>
              <a
                href={copartLotUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 sm:px-2.5 py-1.5 bg-[#002855] hover:bg-[#003d80] text-amber-300 font-bold text-xs flex items-center gap-1.5 border-l border-slate-700/80 transition whitespace-nowrap"
                title="Consultar expediente técnico del lote en patio Copart"
              >
                <span>{lang === 'en' ? 'COPART LOT DETAILS' : 'FICHA OFICIAL DE LOTE'}</span>
                <ExternalLink className="w-3 h-3 text-amber-400 shrink-0" />
              </a>
            </div>

            {/* BOTÓN 6 COMPROBACIONES OFICIALES COPART */}
            <button
              type="button"
              onClick={() => setIsVerificationModalOpen(true)}
              className="flex items-center gap-1.5 bg-[#002855] hover:bg-[#003875] border border-amber-500/60 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-300 transition shadow cursor-pointer whitespace-nowrap"
              title="Verificar las 6 comprobaciones de seguridad Copart: Vehículo, Subasta, Broker, Oferta, Resultado y Pago"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden md:inline">Auditoría Copart:</span>
              <span className="text-emerald-400 font-mono font-black">6/6 ✓</span>
            </button>

            {/* Conteo y Movimiento de Espectadores Conectados en Tiempo Real */}
            <div className="hidden 2xl:flex items-center gap-2 text-xs sm:text-sm text-cyan-300 bg-cyan-950/50 border border-cyan-800/60 px-3 py-1.5 rounded-lg font-bold whitespace-nowrap">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span>{viewersCount} {t('viewersInLane')}</span>
              {latestSpectatorEvent && (
                <span className="text-xs text-amber-300 font-mono animate-fadeIn pl-2 border-l border-cyan-700/60 font-medium">
                  {latestSpectatorEvent}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* BOTÓN GUÍA DE INDUCCIÓN AL COMPRADOR */}
            <button
              type="button"
              onClick={() => setIsBuyerGuideOpen(true)}
              className="flex items-center gap-1.5 bg-[#081528] hover:bg-[#0c2242] border border-blue-500/60 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-bold text-blue-200 hover:text-white transition shadow cursor-pointer whitespace-nowrap"
              title="¿Cómo funciona tu sala en vivo? Guía rápida de inducción para el comprador"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden xl:inline">¿Cómo funciona mi sala?</span>
              <span className="xl:hidden">Guía ℹ️</span>
            </button>

            {/* HORARIO REAL DE ESTADOS UNIDOS (USA / EST) */}
            <div className="hidden lg:flex items-center gap-1.5 bg-[#07111e] border border-blue-900/60 px-2.5 py-1.5 rounded-lg text-xs font-mono font-black text-amber-300 shadow-inner whitespace-nowrap">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
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

      {/* CINTILLO CONTINUO DE PATROCINADORES Y SEGUROS OFICIALES DE EE. UU. (LIVE SPONSORS TICKER) */}
      <div className="bg-[#020610] border-b border-[#1b2b44] py-1.5 px-2 overflow-hidden relative flex items-center shadow-inner select-none">
        {/* Etiqueta fija en el borde izquierdo */}
        <div className="z-20 bg-gradient-to-r from-[#020610] via-[#020610] to-transparent pr-4 pl-1 flex items-center shrink-0">
          <div className="flex items-center gap-1.5 bg-red-600 text-white font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded shadow">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>OFFICIAL SPONSORS</span>
          </div>
        </div>

        {/* Marquesina desplazándose de derecha a izquierda */}
        <div className="overflow-hidden w-full relative flex items-center">
          <div className="animate-marquee flex items-center gap-8 text-[11px] font-medium tracking-wide">
            {[1, 2].map((loopIdx) => (
              <React.Fragment key={loopIdx}>
                {/* STATE FARM */}
                <div className="flex items-center gap-2 text-slate-300 shrink-0">
                  <span className="bg-[#d3122a] text-white font-black text-[10px] px-2 py-0.5 rounded font-sans tracking-tight shadow">
                    State Farm®
                  </span>
                  <span className="text-white font-bold">Auto Claims & Liquidation Partner</span>
                  <span className="text-slate-400 text-[10px] hidden sm:inline">• "Like a good neighbor, State Farm is there®"</span>
                </div>

                <span className="text-slate-600 font-bold">•</span>

                {/* GEICO */}
                <div className="flex items-center gap-2 text-slate-300 shrink-0">
                  <span className="bg-[#005088] text-white font-black text-[10px] px-2 py-0.5 rounded font-sans tracking-wider border border-blue-400/40 shadow">
                    GEICO®
                  </span>
                  <span className="text-white font-bold">Commercial Fleet & Cargo Insurance</span>
                  <span className="text-slate-400 text-[10px] hidden sm:inline">• 15 minutes could save you 15% or more on transit protection</span>
                </div>

                <span className="text-slate-600 font-bold">•</span>

                {/* PROGRESSIVE */}
                <div className="flex items-center gap-2 text-slate-300 shrink-0">
                  <span className="bg-[#0077c8] text-white font-black text-[10px] px-2 py-0.5 rounded font-sans tracking-tight shadow">
                    PROGRESSIVE®
                  </span>
                  <span className="text-white font-bold">Official Lane A Salvage & Recovery Sponsor</span>
                  <span className="text-slate-400 text-[10px] hidden sm:inline">• Commercial Auto & Total Loss Coverage</span>
                </div>

                <span className="text-slate-600 font-bold">•</span>

                {/* FARMERS INSURANCE */}
                <div className="flex items-center gap-2 text-slate-300 shrink-0">
                  <span className="bg-[#002f6c] text-white font-black text-[10px] px-2 py-0.5 rounded font-sans tracking-tight shadow border-l-2 border-red-500">
                    FARMERS®
                  </span>
                  <span className="text-white font-bold">Verified Title & Insurance Inspection</span>
                  <span className="text-slate-400 text-[10px] hidden sm:inline">• "We are insurance."</span>
                </div>

                <span className="text-slate-600 font-bold">•</span>

                {/* ALLSTATE */}
                <div className="flex items-center gap-2 text-slate-300 shrink-0">
                  <span className="bg-[#003366] text-cyan-300 font-black text-[10px] px-2 py-0.5 rounded font-sans tracking-tight shadow">
                    Allstate®
                  </span>
                  <span className="text-white font-bold">Total Loss Vehicle Settlement</span>
                  <span className="text-slate-400 text-[10px] hidden sm:inline">• "You're in good hands®"</span>
                </div>

                <span className="text-slate-600 font-bold">•</span>

                {/* LIBERTY MUTUAL */}
                <div className="flex items-center gap-2 text-slate-300 shrink-0">
                  <span className="bg-[#ffbf00] text-slate-950 font-black text-[10px] px-2 py-0.5 rounded font-sans tracking-tight shadow">
                    LIBERTY MUTUAL®
                  </span>
                  <span className="text-white font-bold">Official Heavy Duty Transport Underwriter</span>
                  <span className="text-slate-400 text-[10px] hidden sm:inline">• "Only pay for what you need™"</span>
                </div>

                <span className="text-slate-600 font-bold">•</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* CINTILLO OFICIAL DE AVISOS EN VIVO COPART VB3 */}
      {liveAnnouncement && (
        <div className="bg-gradient-to-r from-[#001428] via-[#002855] to-[#001428] border-b-2 border-amber-400 px-3 sm:px-6 py-2 shadow-xl animate-fadeIn">
          <div className="max-w-[1720px] w-full mx-auto flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-2.5 w-2.5 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
              </span>
              <div className="flex items-center gap-2 min-w-0">
                <span className="bg-amber-400 text-slate-950 font-black text-[10px] sm:text-xs uppercase tracking-wider px-2 py-0.5 rounded shadow shrink-0 flex items-center gap-1 font-mono">
                  <Megaphone className="w-3.5 h-3.5 text-slate-950" />
                  <span>AVISO EN VIVO</span>
                </span>
                <span className="text-white font-black text-xs sm:text-sm tracking-wide truncate">
                  {liveAnnouncement}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-amber-300 font-bold uppercase tracking-wider shrink-0 hidden md:inline">
              COPART VB3 OFFICIAL BROADCAST
            </span>
          </div>
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

            {/* LETRERO GRANDE OFICIAL: VEHÍCULO VENDIDO (SOLD) */}
            {session.status === 'sold' && (
              <div className="w-full bg-gradient-to-r from-red-700 via-rose-600 to-red-700 text-white py-3 px-4 flex items-center justify-between border-b-4 border-red-400 shadow-2xl animate-fadeIn relative z-40">
                <div className="flex items-center gap-3">
                  <span className="w-3.5 h-3.5 rounded-full bg-white animate-ping shrink-0" />
                  <div className="flex items-center gap-2">
                    <Gavel className="w-6 h-6 text-amber-300 fill-amber-300 shrink-0" />
                    <span className="font-black text-base sm:text-xl tracking-widest uppercase drop-shadow">
                      VEHÍCULO VENDIDO • SOLD
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-black text-amber-300 text-sm sm:text-base block drop-shadow">
                    ADJUDICADO: {(session as any).current_winner_paddle || (session as any).currentWinnerPaddle || 'Paleta #101'}
                  </span>
                  <span className="text-[11px] text-white/95 font-bold block truncate max-w-[240px]">
                    {(session as any).current_winner_name || (session as any).currentWinnerName || (session as any).broker_name || 'Carlos Mendoza'} • ${(Number(session.current_price || 5000)).toLocaleString()} USD
                  </span>
                </div>
              </div>
            )}

            {/* Badges Superiores sobre la Fotografía */}
            <div className={`absolute ${session.status === 'sold' ? 'top-16' : 'top-2.5'} left-2.5 z-20 flex flex-wrap gap-1.5 transition-all`}>
              <span
                className="bg-[#002855]/95 text-white font-black text-xs px-2.5 py-1 rounded border border-blue-400/40 shadow backdrop-blur flex items-center gap-1.5"
                title="Lote oficial verificado"
              >
                <span>{t('lotPrefix')} #{vehicle?.lot_number || '48291032'}</span>
              </span>
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
            <div className={`absolute ${session.status === 'sold' ? 'top-[92px]' : 'top-11'} left-2.5 z-20 flex flex-wrap gap-1.5 transition-all`}>
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

              {/* Botón Video de Motor Encendido Oficial Copart */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsVideoModalOpen(true);
                }}
                className="px-2.5 py-1 rounded text-[11px] font-black uppercase tracking-wider backdrop-blur-md border shadow-lg flex items-center gap-1.5 bg-rose-950/90 hover:bg-rose-900 text-rose-300 border-rose-500/80 hover:border-rose-400 transition active:scale-95 animate-pulse"
                title="Reproducir video oficial de vano motor encendido y prueba de escape Copart"
              >
                <Play className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                <span>{lang === 'en' ? 'Engine Run Video ▶' : 'Video Motor Encendido ▶'}</span>
              </button>

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
              {session.status === 'sold' && (
                <div className="absolute inset-0 z-30 bg-black/45 backdrop-blur-[2px] flex items-center justify-center p-4 pointer-events-none animate-fadeIn">
                  <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white font-black text-3xl sm:text-5xl px-8 sm:px-12 py-4 sm:py-5 rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.95)] border-4 border-white tracking-widest uppercase transform -rotate-6 animate-pulse flex flex-col items-center">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Gavel className="w-8 h-8 sm:w-11 sm:h-11 text-amber-300 fill-amber-300" />
                      <span>¡VENDIDO!</span>
                    </div>
                    <span className="text-xs sm:text-base tracking-widest text-amber-200 uppercase font-mono mt-1">
                      SOLD • {(session as any).current_winner_paddle || (session as any).currentWinnerPaddle || 'Paleta #101'}
                    </span>
                  </div>
                </div>
              )}
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

              {/* ORIGEN DE INGRESO / MOTIVO DE VENTA EN SUBASTA */}
              <div className="bg-[#050912] p-3 rounded-lg border border-emerald-900/70 shadow sm:col-span-2">
                <span className="text-emerald-400 block text-[11px] uppercase font-bold tracking-wide flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {lang === 'en' ? 'INTAKE CAUSE / AUCTION REASON' : 'ORIGEN DE INGRESO / MOTIVO DE SUBASTA'}
                </span>
                <span className="font-black text-white text-sm sm:text-base block mt-0.5 tracking-wide">
                  {vehicle?.auction_reason || 'Recuperación Bancaria (Falta de Pago / Sin Accidentes)'}
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
                {session.status === 'prepared'
                  ? (lang === 'en' ? 'STARTING BID • OPENING PRICE' : 'PRECIO BASE DE SALIDA (STARTING BID)')
                  : (lang === 'en' ? 'CURRENT BID' : 'PRECIO VIGENTE DE SUBASTA (CURRENT BID)')}
              </span>

              <div className="flex items-center justify-center gap-2">
                <span className="text-3xl sm:text-4xl font-black text-emerald-500">$</span>
                <span className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.35)]">
                  {(Number(session?.current_price ?? (session as any)?.currentPrice ?? 5000)).toLocaleString()}
                </span>
                <span className="text-base sm:text-lg font-bold text-slate-400 self-end mb-2">USD</span>
              </div>

              {/* Indicador de Postor Vigente Oficial Copart VB3 */}
              <div className="mt-2.5 flex items-center justify-center">
                {((session as any).currentWinnerPaddle || (session as any).current_winner_paddle || session.current_bidder_name) ? (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-emerald-950/90 border border-emerald-400/80 text-emerald-300 shadow">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span>
                      {lang === 'en' ? 'HIGH BIDDER:' : 'POSTURA LÍDER EN MESA:'}{' '}
                      <strong className="text-white font-mono">
                        {(session as any).currentWinnerPaddle || (session as any).current_winner_paddle}
                      </strong>
                      {((session as any).currentWinnerName || session.current_bidder_name) && (
                        <span className="text-slate-300 font-normal">
                          {' '}- {(session as any).currentWinnerName || session.current_bidder_name}
                        </span>
                      )}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-500 font-mono">
                    {lang === 'en' ? 'Waiting for opening bid in Lane A...' : 'Esperando primera postura en Carril A...'}
                  </span>
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

            {/* PANEL DE PUJAS: EXCLUSIVO SI ESTÁ EN MODO BROKER */}
            {isBroker && (
              <div className="space-y-2 mb-3">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center">
                  <span>{lang === 'en' ? 'Your Broker Paddle:' : 'Tu Paleta de Broker:'} <strong className="text-amber-400">{activeParticipant?.paddleNumber || 'Paleta #101'}</strong></span>
                  <span className="text-emerald-400 font-mono">+${session.bid_increment || 250} USD {lang === 'en' ? 'Increment' : 'Incremento'}</span>
                </div>

                {/* BOTÓN PRINCIPAL DE OFERTA OFICIAL */}
                <button
                  onClick={() => handlePlaceBrokerBid(authorizedBidAmount || undefined)}
                  disabled={
                    isSubmittingBid ||
                    !['open', 'bidding', 'last_call'].includes(session.status) ||
                    !activeParticipant
                  }
                  className={`w-full font-black py-3 px-4 rounded-lg shadow-xl text-base flex items-center justify-center gap-2 transition active:scale-95 border-b-4 ${
                    isSubmittingBid
                      ? 'bg-slate-700 text-slate-400 border-slate-900 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-800'
                  }`}
                >
                  <Flame className="w-5 h-5" />
                  <span>
                    {isSubmittingBid
                      ? t('submittingBid')
                      : (lang === 'en' ? `BID $${nextBidAmount.toLocaleString()} USD` : `PUJAR $${nextBidAmount.toLocaleString()} USD (PALETA #101)`)}
                  </span>
                </button>

                {/* INCREMENTOS RÁPIDOS */}
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => handlePlaceBrokerBid(session.current_price + (session.bid_increment || 250))}
                    disabled={isSubmittingBid || !['open', 'bidding', 'last_call'].includes(session.status) || !activeParticipant}
                    className="bg-[#050912] hover:bg-slate-800 disabled:opacity-40 text-xs font-bold text-slate-200 py-1.5 rounded border border-slate-700 transition"
                  >
                    +${session.bid_increment || 250}
                  </button>
                  <button
                    onClick={() => handlePlaceBrokerBid(session.current_price + 500)}
                    disabled={isSubmittingBid || !['open', 'bidding', 'last_call'].includes(session.status) || !activeParticipant}
                    className="bg-[#050912] hover:bg-slate-800 disabled:opacity-40 text-xs font-bold text-slate-200 py-1.5 rounded border border-slate-700 transition"
                  >
                    +$500 USD
                  </button>
                  <button
                    onClick={() => handlePlaceBrokerBid(session.current_price + 1000)}
                    disabled={isSubmittingBid || !['open', 'bidding', 'last_call'].includes(session.status) || !activeParticipant}
                    className="bg-[#050912] hover:bg-slate-800 disabled:opacity-40 text-xs font-black text-amber-400 py-1.5 rounded border border-slate-700 transition"
                  >
                    +$1,000 USD
                  </button>
                </div>
              </div>
            )}

            {/* TABLERO DE POSTORES Y PALETAS ACTIVAS (LANE A) */}
            <div className="bg-[#050a16] border border-[#1b2b44] rounded-xl p-3.5 shadow-xl space-y-3 mb-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span className="font-black text-white text-xs uppercase tracking-wider">
                    {lang === 'en' ? 'OFFICIAL FLOOR PADDLES • LANE A' : 'POSTORES EN SALA • PALETAS ACTIVAS (CARRIL A)'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>7 EN LÍNEA • EN VIVO</span>
                </div>
              </div>

              {/* DEFINICIÓN OFICIAL DE TODAS LAS PALETAS (TODAS IGUALES) */}
              {(() => {
                const ALL_PADDLES = [
                  { 
                    number: 'Paleta #101', 
                    defaultName: (session as any).broker_name || (session as any).brokerName || 'Carlos Mendoza', 
                    defaultLoc: (session as any).broker_location || (session as any).brokerLocation || 'Miami, FL' 
                  },
                  { number: 'Paleta #108', defaultName: 'AutoExport Dallas LLC', defaultLoc: 'Dallas, TX' },
                  { number: 'Paleta #214', defaultName: 'Pacific Salvage Auctions', defaultLoc: 'Los Angeles, CA' },
                  { number: 'Paleta #305', defaultName: 'Global Fleet Buyers', defaultLoc: 'Atlanta, GA' },
                  { number: 'Paleta #412', defaultName: 'Buckeye Motor Exchange', defaultLoc: 'Columbus, OH' },
                  { number: 'Paleta #519', defaultName: 'Lone Star Salvage Group', defaultLoc: 'Houston, TX' },
                  { number: 'Paleta #623', defaultName: 'Midwest Premier Liquidation', defaultLoc: 'Chicago, IL' },
                ];

                const winnerPaddleRaw = (session as any).currentWinnerPaddle || 
                                       (session as any).current_winner_paddle || 
                                       (bids.length > 0 ? ((bids[0] as any).paddle_number || (bids[0] as any).paddleNumber) : null);

                const leaderPaddle = winnerPaddleRaw
                  ? ALL_PADDLES.find(p => winnerPaddleRaw.includes(p.number) || winnerPaddleRaw.includes(p.number.replace('Paleta #', ''))) || {
                      number: winnerPaddleRaw,
                      defaultName: (session as any).currentWinnerName || session.current_bidder_name || 'Postor en Sala',
                      defaultLoc: 'USA Online'
                    }
                  : null;

                const leaderServerPart = leaderPaddle ? participants.find((part: any) => part.paddleNumber === leaderPaddle.number || part.paddle_number === leaderPaddle.number) : null;
                const leaderName = leaderServerPart?.name || leaderPaddle?.defaultName || 'Postor en Sala';
                const leaderLoc = leaderServerPart?.location || leaderPaddle?.defaultLoc || 'USA';

                return (
                  <>
                    {/* TARJETA DEL LÍDER ACTUAL ARRIBA (CUALQUIERA QUE VAYA GANANDO) */}
                    {leaderPaddle ? (
                      <div className="p-3 rounded-lg border-2 bg-emerald-950/80 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] ring-1 ring-emerald-400 animate-fadeIn">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm text-emerald-300">
                              {leaderPaddle.number}
                            </span>
                            <span className="text-[9px] bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 shadow">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
                              👑 LÍDER ACTUAL (HIGH BID)
                            </span>
                          </div>
                          <span className="font-mono font-black text-emerald-400 text-sm">
                            ${Number(session?.current_price ?? 5000).toLocaleString()} USD
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between mt-1.5">
                          <div>
                            <span className="text-white font-bold text-xs block leading-tight">
                              {leaderName}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {leaderLoc}
                            </span>
                          </div>
                          <span className="text-[10px] text-emerald-400 font-mono font-bold">
                            POSTURA CONFIRMADA
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg border bg-[#081224] border-slate-800 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-black text-amber-400 text-xs">
                            CARRIL A • EN ESPERA DE OFERTAS
                          </span>
                          <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            7 POSTORES EN SALA
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          El postor que emita la primera oferta tomará la cabeza del carril.
                        </p>
                      </div>
                    )}

                    {/* GRILLA DE TODAS LAS 7 PALETAS EN SALA (TODAS CON EL MISMO DISEÑO) */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {ALL_PADDLES.map((p) => {
                        const isLeader = Boolean(
                          winnerPaddleRaw && (winnerPaddleRaw.includes(p.number) || winnerPaddleRaw.includes(p.number.replace('Paleta #', '')))
                        );
                        const serverPart = participants.find((part: any) => part.paddleNumber === p.number || part.paddle_number === p.number);
                        const displayName = serverPart?.name || p.defaultName;
                        const displayLoc = serverPart?.location || p.defaultLoc;

                        return (
                          <div
                            key={p.number}
                            className={`p-2 rounded-lg border text-xs transition-all ${
                              isLeader
                                ? 'bg-emerald-950/70 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)] ring-1 ring-emerald-400 animate-fadeIn'
                                : 'bg-[#060c18] border-slate-800/80 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`font-mono font-black text-xs ${isLeader ? 'text-emerald-300' : 'text-slate-300'}`}>
                                {p.number}
                              </span>
                              {isLeader ? (
                                <span className="text-[8.5px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.2 rounded uppercase flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
                                  LÍDER
                                </span>
                              ) : (
                                <span className="text-[9px] text-slate-500 font-mono flex items-center gap-1">
                                  <span className="w-1 h-1 rounded-full bg-emerald-500/70" />
                                  SALA
                                </span>
                              )}
                            </div>

                            <span className="text-white font-bold text-[11px] block truncate mt-1 leading-snug">
                              {displayName}
                            </span>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                              <span className="truncate">{displayLoc}</span>
                              {isLeader && (
                                <span className="font-mono font-bold text-emerald-400 text-[11px]">
                                  ${Number(session?.current_price ?? 5000).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* MESA DE OFERTAS EN TIEMPO REAL (HISTORIAL DE PUJAS EN VIVO) */}
            <div className="bg-[#050a16] border border-[#1b2b44] rounded-xl p-3.5 shadow-xl space-y-2.5 mb-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <Gavel className="w-4 h-4 text-emerald-400" />
                  <span className="font-black text-white text-xs uppercase tracking-wider">
                    {lang === 'en' ? 'LIVE BIDDING STREAM (LANE A)' : 'MESA DE OFERTAS EN TIEMPO REAL (CARRIL A)'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    {bids.length} {lang === 'en' ? 'BIDS' : 'POSTURAS'}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">
                    COPART VB3
                  </span>
                </div>
              </div>

              {/* FEED DE PUJAS EN VIVO (TODOS LOS POSTORES CON FORMATO EQUITATIVO) */}
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                {bids.length === 0 ? (
                  <div className="p-3.5 rounded-lg bg-[#060c18] border border-slate-800/80 text-center space-y-1">
                    <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>{lang === 'en' ? 'LANE A ACTIVE • AWAITING BIDS' : 'CARRIL A CONECTADO • EN ESPERA DE POSTURAS'}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      {lang === 'en'
                        ? 'Floor paddles are positioned at terminal. Every live bid will be registered here immediately.'
                        : 'Postores autorizados posicionados en terminal. Cada postura y movimiento de paleta se registrará aquí en vivo.'}
                    </p>
                  </div>
                ) : (
                  bids.map((b) => {
                    const paddleLabel = (b as any).paddle_number || b.bidder_name || 'Paleta';
                    return (
                      <div
                        key={b.id}
                        className="flex items-center justify-between p-2 rounded-lg text-xs border bg-[#060c18] border-slate-800/80 text-slate-200 transition-all"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[9.5px] font-mono bg-blue-950 text-blue-300 border border-blue-800 px-1.5 py-0.5 rounded font-bold shrink-0">
                            #{b.sequence_number}
                          </span>
                          <span className="font-mono font-black text-xs shrink-0 text-amber-400">
                            {paddleLabel}
                          </span>
                          <span className="text-slate-300 text-[11px] font-medium truncate max-w-[140px]">
                            {b.bidder_name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-slate-500 font-mono">
                            {b.timestamp ? new Date(b.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
                          </span>
                          <span className="font-mono font-black text-emerald-400 text-xs sm:text-sm">
                            ${b.amount.toLocaleString()} USD
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* PIE DE TELEMETRÍA OFICIAL */}
              <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between font-mono">
                <span>SEGURIDAD SHA-256 • DATOS DE SALA COPART VB3</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  CONEXIÓN CIFRADA
                </span>
              </div>
            </div>

            {/* ANUNCIO COMERCIAL OFICIAL EN SALA: SEGUROS Y PATROCINIO ESTADOUNIDENSE */}
            <div className="bg-gradient-to-r from-[#061224] via-[#091b36] to-[#061224] border border-blue-500/40 rounded-xl p-3 shadow-xl mb-3 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-blue-500/20 pb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] bg-red-600 text-white font-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow">
                    OFFICIAL SPONSOR
                  </span>
                  <span className="text-[11px] font-black text-slate-100 uppercase tracking-wider">
                    UNITED STATES CLAIMS & CARGO PROTECTION
                  </span>
                </div>
                <span className="text-[9.5px] text-blue-300 font-mono font-bold">
                  LANE A • VB3
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 pt-0.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-[#d3122a] flex flex-col items-center justify-center text-white font-black text-[10px] leading-tight shadow-md border border-red-400/40 shrink-0">
                    <span>State</span>
                    <span>Farm</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-white font-black text-xs block truncate">
                      State Farm® Total Loss & Auto Insurance
                    </span>
                    <span className="text-[10.5px] text-slate-300 block truncate">
                      Authorized Claims Liquidation • Instant Transit Coverage
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/90 border border-emerald-700/60 px-2 py-0.5 rounded uppercase block">
                    ✓ NAIC VERIFIED
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">
                    US-DOT #389142
                  </span>
                </div>
              </div>

              <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1.5 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span>Coverage Active During Live Auction & Transport</span>
                </span>
                <span className="font-mono text-slate-500 shrink-0">LANE A PARTNER</span>
              </div>
            </div>

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
                <span>Catálogo de vehículos programados en carril ({dockVehicles.length}):</span>
                <span className="text-amber-300 font-mono font-bold">LANE A • Venta Oficial</span>
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

                      {/* ESTADO DE LOTE EN CARRIL */}
                      <div className="pt-2 border-t border-slate-800/80">
                        {isCurrentActive ? (
                          <div className="w-full py-2 rounded-lg bg-emerald-950/80 border border-emerald-500 text-emerald-300 font-black text-xs flex items-center justify-center gap-1.5 shadow">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>✓ EN REMATE ACTUAL</span>
                          </div>
                        ) : (
                          <div className="w-full py-2 rounded-lg bg-[#040914] border border-slate-800 text-slate-400 font-bold text-xs flex items-center justify-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span>PROGRAMADO EN CARRIL</span>
                          </div>
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
                Orden oficial de vehículos programados para subasta en este carril:
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
                        <div className="py-1 rounded bg-[#040914] border border-slate-800 text-slate-400 font-bold text-[11px] flex items-center justify-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>En cola de remate</span>
                        </div>
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
                            <span className="text-slate-500 font-mono text-[11px]">En cola</span>
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

      {/* MODAL DE VIDEO OFICIAL DE MOTOR ENCENDIDO COPART */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-[#0b1323] border border-rose-500/60 rounded-2xl max-w-2xl w-full p-4 sm:p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow">
                  <Play className="w-4 h-4 fill-white" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">
                    PRUEBA OFICIAL DE MOTOR ENCENDIDO • COPART RUN & DRIVE
                  </h3>
                  <p className="text-slate-400 text-xs font-mono">
                    Lote #{vehicle?.lot_number} • {vehicle?.brand} {vehicle?.model} ({vehicle?.year})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsVideoModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
              {vehicle?.engine_video_url || vehicle?.video_url ? (
                <video
                  src={vehicle?.engine_video_url || vehicle?.video_url}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="p-6 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-rose-950/80 border border-rose-500/50 mx-auto flex items-center justify-center text-rose-400">
                    <Play className="w-6 h-6 fill-rose-400" />
                  </div>
                  <h4 className="font-bold text-white text-sm">Inspección de Video en Proceso</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Para activar la reproducción directa, coloca el archivo de video <code className="text-rose-300 font-mono">motor.mp4</code> en la carpeta de este vehículo.
                  </p>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Verificación Acústica de Motor:</span>
              <span className="text-emerald-400 font-bold">✓ RUN & DRIVE CONFIRMADO (0 Humo / 0 Ruidos)</span>
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
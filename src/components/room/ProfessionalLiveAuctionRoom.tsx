import React, { useState, useEffect, useCallback } from 'react';
import { AuctionSession, AuctionBid, VehicleImage, PhotoCategory } from '../../types';
import { store, ParticipantInfo } from '../../services/store';
import { sounds } from '../../lib/soundEffects';
import { CopartLogo } from '../common/CopartLogo';
import { CircularCountdown } from './CircularCountdown';
import { ImageGalleryModal } from '../common/ImageGalleryModal';
import { RoomAccessExpiredView } from './RoomAccessExpiredView';
import confetti from 'canvas-confetti';
import { NextLotModal } from './NextLotModal';
import { useTranslation, Language } from '../../lib/i18n';
import { 
  Volume2, VolumeX, Eye, EyeOff, Play, Pause, CheckCircle2,
  RefreshCw, Gavel, Share2, AlertTriangle, 
  Car, Clock, Key, Award, Flame, UserCheck, Users,
  PlusCircle, ShieldCheck, ShieldAlert, Wifi, ExternalLink, Copy, Check,
  FastForward, User, Lock, ChevronLeft, ChevronRight,
  Printer, FileText, Edit, Trash2, Upload, Plus, X, Gauge, Send,
  ArrowRightCircle, CheckCircle, Sparkles,
  ExternalLink as LinkIcon
} from 'lucide-react';

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
  const [showEditVehicleModal, setShowEditVehicleModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [editVehicleState, setEditVehicleState] = useState<any>(null);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoCategory, setNewPhotoCategory] = useState<PhotoCategory>('exterior');

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
    if (role === 'buyer' || role === 'spectator') {
      if (data?.isExpired || data?.isRevoked || (data?.session && (data.session.isTokenRevoked || ['sold', 'closed', 'unsold'].includes(data.session.status)))) {
        setIsRoomAccessExpired(true);
        return;
      }
    } else if (role === 'broker' && data?.isRevoked) {
      setIsRoomAccessExpired(true);
      return;
    }

    if (data && data.session) {
      setSession((prev) => ({
        ...prev,
        ...data.session,
        current_price: data.session.currentPrice ?? prev.current_price,
        time_remaining_seconds: data.session.timeRemainingSeconds ?? prev.time_remaining_seconds,
        status: data.session.status ?? prev.status,
        current_bid_count: data.session.bidCount ?? prev.current_bid_count,
        current_bidder_name: data.session.currentWinnerName,
      }));

      if (data.role && data.role !== role) {
        setRole(data.role);
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
          setLastBidId(formattedBids[0].id);
          setBidFlash(true);
          setTimeout(() => setBidFlash(false), 800);
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

      if (data.session.status === 'sold' && (!activeParticipant || data.session.currentWinnerPaddle === activeParticipant.paddleNumber)) {
        try {
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        } catch { /* ignore */ }
      }
    }
  }, [initialSession.id, initialSession.room_token, initialBidderToken, activeParticipant, lastBidId, isBroker, role, userToken]);

  useEffect(() => {
    fetchStateFromServer();
    const interval = setInterval(fetchStateFromServer, 1000);
    const unsubscribe = store.subscribe(() => {
      fetchStateFromServer();
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [fetchStateFromServer]);

  // Escuchar en vivo movimientos de espectadores, presencia y autorizaciones por WebSocket
  useEffect(() => {
    const handleWs = (e: MessageEvent) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'SPECTATOR_JOINED') {
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
            try { sounds.playBidPing(); } catch {}
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
        } else if (msg.type === 'ROOM_ACCESS_REVOKED') {
          if (!isBroker) {
            setIsRoomAccessExpired(true);
          }
        }
      } catch {}
    };

    if (store.ws) {
      store.ws.addEventListener('message', handleWs);
    }
    return () => {
      if (store.ws) store.ws.removeEventListener('message', handleWs);
    };
  }, [isBroker, role]);

  const vehicle = session.vehicle_snapshot || (session as any).vehicle;
  const allImages: VehicleImage[] = vehicle?.images || [];
  
  const displayedImages = selectedCategory === 'todas'
    ? allImages
    : allImages.filter((img) => img.category === selectedCategory);

  const activeImage: VehicleImage | undefined = displayedImages[selectedImageIdx] || displayedImages[0] || allImages[0];

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

    // Validación preventiva de presupuesto
    const isAuthorized = authorizedBidAmount && authorizedBidAmount === amountToBid;
    if (amountToBid > clientBudget && !isAuthorized) {
      setServerError(`La oferta de $${amountToBid.toLocaleString()} supera el presupuesto máximo autorizado por el cliente ($${clientBudget.toLocaleString()} USD). Solicita autorización extraordinaria.`);
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

  // ABRIR EDITOR DE VEHÍCULO PARA EL BROKER
  const handleOpenEditVehicle = () => {
    setEditVehicleState(JSON.parse(JSON.stringify(vehicle || {})));
    setShowEditVehicleModal(true);
  };

  const handleSaveVehicleEdit = async () => {
    if (!editVehicleState) return;
    await store.updateSessionVehicle(session.id, editVehicleState);
    setShowEditVehicleModal(false);
    await fetchStateFromServer();
  };

  const handleAddPhotoToVehicle = () => {
    if (!newPhotoUrl.trim() || !editVehicleState) return;
    const currentImgs = editVehicleState.images || [];
    const newImg: VehicleImage = {
      id: 'img-' + Math.random().toString(36).substring(2, 8),
      vehicle_id: editVehicleState.id || 'veh-current',
      url: newPhotoUrl.trim(),
      category: newPhotoCategory,
      is_primary: currentImgs.length === 0,
      order: currentImgs.length + 1,
      caption: `Foto ${newPhotoCategory}`,
    };

    setEditVehicleState({
      ...editVehicleState,
      images: [...currentImgs, newImg],
    });
    setNewPhotoUrl('');
  };

  const handleFileUploadToVehicle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editVehicleState) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          const currentImgs = editVehicleState.images || [];
          const newImg: VehicleImage = {
            id: 'img-' + Math.random().toString(36).substring(2, 8),
            vehicle_id: editVehicleState.id || 'veh-current',
            url: base64,
            category: newPhotoCategory,
            is_primary: currentImgs.length === 0,
            order: currentImgs.length + 1,
            caption: file.name,
          };
          setEditVehicleState((prev: any) => prev ? {
            ...prev,
            images: [...(prev.images || []), newImg],
          } : null);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (imgId: string) => {
    if (!editVehicleState?.images) return;
    setEditVehicleState({
      ...editVehicleState,
      images: editVehicleState.images.filter((img: VehicleImage) => img.id !== imgId),
    });
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
          
          <div className="flex items-center gap-3 sm:gap-6">
            <CopartLogo size="md" showSubtitle={true} />

            {/* Pista e Identificación de Lote */}
            <div className="hidden sm:flex items-center gap-2 bg-[#0c192c] border border-blue-900/60 px-3 py-1 rounded text-xs">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-extrabold text-white tracking-wide">{t('laneTitle')}</span>
              <span className="text-slate-400">•</span>
              <span className="text-amber-400 font-mono font-semibold">{vehicle?.location || 'Atlanta East Yard 12'}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-[#0c192c] border border-slate-700/80 px-2.5 py-1 rounded text-xs">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{t('lotPrefix')}</span>
              <span className="font-mono font-black text-amber-400">
                #{vehicle?.lot_number || '48291032'}
              </span>
            </div>

            {/* Conteo y Movimiento de Espectadores Conectados en Tiempo Real */}
            <div className="hidden md:flex items-center gap-2 text-[11px] text-cyan-300 bg-cyan-950/40 border border-cyan-800/50 px-2.5 py-1 rounded font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{viewersCount} {t('viewersInLane')}</span>
              {latestSpectatorEvent && (
                <span className="text-[10px] text-amber-300 font-mono animate-fadeIn pl-1.5 border-l border-cyan-700/60 font-normal">
                  {latestSpectatorEvent}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* SELECTOR BILINGÜE EN / ES */}
            <div className="flex items-center bg-[#07111e] border border-slate-700/80 rounded-md p-0.5 text-xs font-bold shadow-inner">
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2 py-0.5 rounded text-[11px] font-extrabold transition ${
                  lang === 'en'
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
                className={`px-2 py-0.5 rounded text-[11px] font-extrabold transition ${
                  lang === 'es'
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
              <div className="flex items-center gap-1.5 bg-[#080d18] border border-emerald-500/70 px-2.5 py-1 rounded text-xs">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300 font-bold hidden md:inline text-[11px]">{t('brokerRole')}</span>
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
              /* Si es Cliente: Badge de Espectador */
              <div className="flex items-center gap-1.5 bg-blue-950/60 border border-blue-600/60 px-3 py-1 rounded text-xs">
                <Lock className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-blue-200 font-bold">{t('buyerRole')}</span>
                <span className="text-slate-400 text-[10px] hidden sm:inline">{t('buyerRoleSubtitle')}</span>
              </div>
            )}

            {/* Botón de Audio */}
            <button
              onClick={handleToggleAudio}
              className={`p-1.5 sm:px-2.5 sm:py-1 rounded text-xs font-semibold border flex items-center gap-1.5 transition ${
                isAudioMuted
                  ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                  : 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
              }`}
              title={isAudioMuted ? t('unmuteTitle') : t('muteTitle')}
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{isAudioMuted ? t('mutedButton') : t('audioButton')}</span>
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

      {/* PANEL DE CONTROL DE ENLACES Y PRESENCIA DEL SUBASTADOR PRINCIPAL */}
      {isAuctioneer && (
        <div className="bg-[#081220] border-b border-[#1b3152] px-3 sm:px-6 py-2 shadow-lg">
          <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded text-[10px] uppercase tracking-wider flex items-center gap-1">
                <Gavel className="w-3 h-3" />
                {t('auctioneerRole')}
              </span>
              <span className="text-slate-300 font-bold text-xs hidden sm:inline">
                {t('auctioneerSubtitle')}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* LINK BROKER */}
              <div className="flex items-center gap-2 bg-[#050912] border border-blue-900/80 px-2.5 py-1 rounded-lg">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${brokerOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                  <span className="font-bold text-blue-300 text-[11px]">{t('brokerLinkHeader')}</span>
                  <span className={`text-[10px] font-semibold font-mono ${brokerOnline ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {brokerOnline ? `🟢 ${t('online')}` : `⚪ ${t('offline')}`}
                  </span>
                </div>

                <button
                  onClick={() => {
                    const link = brokerLink || `${window.location.origin}${window.location.pathname}#/sala/${session.room_token}?broker=bdr_broker_m729k1`;
                    navigator.clipboard.writeText(link);
                    setCopiedBrokerLink(true);
                    setTimeout(() => setCopiedBrokerLink(false), 2000);
                  }}
                  className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white font-bold px-2 py-0.5 rounded flex items-center gap-1 transition"
                  title="Copy broker exclusive access link"
                >
                  {copiedBrokerLink ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedBrokerLink ? t('copied') : t('copyLink')}</span>
                </button>

                <button
                  onClick={async () => {
                    if (brokerRevoked) {
                      await store.restoreParticipantAccess(session.id, 'broker');
                      setBrokerRevoked(false);
                    } else {
                      if (confirm(lang === 'en' ? 'Revoke Broker access to this lane?' : '¿Revocar el acceso del Broker a esta sala?')) {
                        await store.revokeParticipantAccess(session.id, 'broker');
                        setBrokerRevoked(true);
                      }
                    }
                  }}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded transition border ${
                    brokerRevoked
                      ? 'bg-emerald-950/90 text-emerald-300 border-emerald-600'
                      : 'bg-rose-950/90 text-rose-300 border-rose-700'
                  }`}
                >
                  {brokerRevoked ? t('restoreAccess') : t('revokeAccess')}
                </button>
              </div>

              {/* LINK CLIENTE (COMPRADOR) */}
              <div className="flex items-center gap-2 bg-[#050912] border border-amber-900/60 px-2.5 py-1 rounded-lg">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${buyerOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                  <span className="font-bold text-amber-300 text-[11px]">{t('buyerLinkHeader')}</span>
                  <span className={`text-[10px] font-semibold font-mono ${buyerOnline ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {buyerOnline ? `🟢 ${t('online')}` : `⚪ ${t('offline')}`}
                  </span>
                </div>

                <button
                  onClick={() => {
                    const link = buyerLink || `${window.location.origin}${window.location.pathname}#/sala/${session.room_token}?cliente=bdr_buyer_m729k1`;
                    navigator.clipboard.writeText(link);
                    setCopiedBuyerLink(true);
                    setTimeout(() => setCopiedBuyerLink(false), 2000);
                  }}
                  className="text-[10px] bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded flex items-center gap-1 transition"
                  title="Copy buyer spectator & authorization link"
                >
                  {copiedBuyerLink ? <Check className="w-3 h-3 text-slate-950" /> : <Copy className="w-3 h-3 text-slate-950" />}
                  <span>{copiedBuyerLink ? t('copied') : t('copyLink')}</span>
                </button>

                <button
                  onClick={async () => {
                    if (buyerRevoked) {
                      await store.restoreParticipantAccess(session.id, 'buyer');
                      setBuyerRevoked(false);
                    } else {
                      if (confirm(lang === 'en' ? 'Revoke Buyer access to this lane?' : '¿Revocar el acceso del Cliente a esta sala?')) {
                        await store.revokeParticipantAccess(session.id, 'buyer');
                        setBuyerRevoked(true);
                      }
                    }
                  }}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded transition border ${
                    buyerRevoked
                      ? 'bg-emerald-950/90 text-emerald-300 border-emerald-600'
                      : 'bg-rose-950/90 text-rose-300 border-rose-700'
                  }`}
                >
                  {buyerRevoked ? 'Reactivar' : 'Revocar'}
                </button>
              </div>
            </div>
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
            
            {/* Badges Superiores sobre la Fotografía */}
            <div className="absolute top-2.5 left-2.5 z-20 flex flex-wrap gap-1.5">
              <span className="bg-[#002855]/95 text-white font-black text-xs px-2.5 py-1 rounded border border-blue-400/40 shadow backdrop-blur">
                {t('lotPrefix')} #{vehicle?.lot_number || '48291032'}
              </span>
              <span className={`text-xs font-black px-2.5 py-1 rounded shadow backdrop-blur ${
                vehicle?.vehicle_condition === 'run_and_drive'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-600 text-white'
              }`}>
                {vehicle?.vehicle_condition === 'run_and_drive' ? 'RUN & DRIVE' : 'STARTS'}
              </span>
              <span className="bg-slate-900/90 text-amber-300 border border-amber-400/40 font-mono text-xs px-2.5 py-1 rounded shadow">
                {(vehicle?.title_type || 'clean').toUpperCase()} TITLE
              </span>
              {activeImage?.category && (
                <span className="bg-blue-950/90 text-blue-300 border border-blue-600/50 uppercase font-bold text-[10px] px-2 py-0.5 rounded shadow">
                  {activeImage.category}
                </span>
              )}
            </div>

            {/* Botones de Acción sobre la Foto */}
            <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5">
              {isBroker && (
                <button
                  onClick={handleOpenEditVehicle}
                  className="bg-blue-600/90 hover:bg-blue-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg backdrop-blur border border-blue-400/60 shadow flex items-center gap-1 transition"
                  title="Editar Ficha Técnica y Administrar Fotografías"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Editar Ficha / Fotos</span>
                </button>
              )}
              <button
                onClick={() => setIsGalleryOpen(true)}
                className="bg-black/75 hover:bg-black text-white p-2 rounded-lg backdrop-blur border border-slate-700 transition"
                title="Ampliar fotografía a pantalla completa"
              >
                <Eye className="w-4 h-4" />
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
                  alt={vehicle?.model}
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
                      className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase transition flex items-center gap-1 ${
                        selectedCategory === cat
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
                    className={`relative flex-shrink-0 w-16 h-12 rounded border-2 overflow-hidden transition ${
                      idx === selectedImageIdx ? 'border-amber-400 ring-2 ring-amber-400/40' : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
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
          <div className="bg-[#09101c] border border-[#1b2b44] rounded-lg p-3.5 sm:p-4 shadow-xl text-xs">
            <div className="border-b border-slate-800 pb-3 mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                  {vehicle?.year} {vehicle?.brand} {vehicle?.model}
                </h1>
                <p className="text-xs text-amber-400 font-semibold mt-0.5">{vehicle?.version || 'Equipamiento Original de Fábrica'}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">{t('estRetailValue')}</span>
                <span className="text-base sm:text-lg font-black text-emerald-400 font-mono">
                  ${(vehicle?.est_retail_value || 42000).toLocaleString()} USD
                </span>
              </div>
            </div>

            {/* Cuadrícula de Especificaciones Completas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              
              {/* Odómetro con Switch MI / KM */}
              <div className="bg-[#050912] p-2.5 rounded border border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 block text-[9.5px] uppercase font-bold">{t('odometerLabel')}</span>
                  <button
                    onClick={() => setOdometerUnit(odometerUnit === 'mi' ? 'km' : 'mi')}
                    className="text-[9px] bg-slate-800 text-amber-400 hover:bg-slate-700 px-1 py-0.5 rounded font-mono font-bold"
                    title="Toggle MI / KM"
                  >
                    {odometerUnit === 'mi' ? 'A KM' : 'A MI'}
                  </button>
                </div>
                <span className="font-mono font-bold text-white text-sm">
                  {displayedOdometer}
                </span>
              </div>

              <div className="bg-[#050912] p-2.5 rounded border border-slate-800/80">
                <span className="text-slate-500 block text-[9.5px] uppercase font-bold">{t('primaryDamage')}</span>
                <span className="font-bold text-amber-300 text-xs sm:text-sm">{vehicle?.primary_damage || 'Impacto Frontal'}</span>
              </div>

              <div className="bg-[#050912] p-2.5 rounded border border-slate-800/80">
                <span className="text-slate-500 block text-[9.5px] uppercase font-bold">{t('secondaryDamage')}</span>
                <span className="font-medium text-slate-300 text-xs">{vehicle?.secondary_damage || 'Ninguno'}</span>
              </div>

              <div className="bg-[#050912] p-2.5 rounded border border-slate-800/80">
                <span className="text-slate-500 block text-[9.5px] uppercase font-bold">{t('keysLabel')}</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5" />
                  {vehicle?.has_keys ? (lang === 'en' ? 'YES (PRESENT)' : 'SÍ (PRESENTES)') : (lang === 'en' ? 'NO' : 'NO')}
                </span>
              </div>

              <div className="bg-[#050912] p-2.5 rounded border border-slate-800/80">
                <span className="text-slate-500 block text-[9.5px] uppercase font-bold">{t('engineLabel')}</span>
                <span className="font-semibold text-slate-200">{vehicle?.engine || '5.0L V8 Coyote 32V'}</span>
              </div>

              <div className="bg-[#050912] p-2.5 rounded border border-slate-800/80">
                <span className="text-slate-500 block text-[9.5px] uppercase font-bold">{t('transmissionLabel')}</span>
                <span className="font-semibold text-slate-200">{vehicle?.transmission || 'Automática'}</span>
              </div>

              <div className="bg-[#050912] p-2.5 rounded border border-slate-800/80">
                <span className="text-slate-500 block text-[9.5px] uppercase font-bold">{t('drivetrainLabel')}</span>
                <span className="font-semibold text-slate-200">{vehicle?.drivetrain || 'RWD'}</span>
              </div>

              {/* VIN Completo o Enmascarado con Toggle */}
              <div className="bg-[#050912] p-2.5 rounded border border-slate-800/80 relative">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 block text-[9.5px] uppercase font-bold">{t('vinLabel')}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setIsVinMasked(!isVinMasked)}
                      className="text-slate-400 hover:text-amber-400 p-0.5"
                      title={isVinMasked ? t('unmaskVin') : t('maskVin')}
                    >
                      {isVinMasked ? <EyeOff className="w-3 h-3 text-amber-400" /> : <Eye className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={handleCopyVin}
                      className="text-slate-400 hover:text-amber-400 p-0.5"
                      title={t('copyVin')}
                    >
                      {copiedVin ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
                <span className="font-mono font-semibold text-slate-300 truncate block mt-0.5" title={rawVin}>
                  {displayedVin}
                </span>
              </div>
            </div>

            {vehicle?.notes && (
              <div className="mt-2.5 bg-[#050912] p-2.5 rounded border border-slate-800/80 text-slate-300">
                <span className="text-slate-500 font-bold block text-[10px] uppercase mb-0.5">{t('vehicleNotes')}:</span>
                <p className="text-[11px] leading-relaxed">{vehicle.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA (5 COLUMNAS): TERMINAL DE OFERTAS EN DIRECTO */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          
          <div className={`bg-[#09101c] border-2 rounded-lg p-4 shadow-2xl transition-all duration-300 ${
            bidFlash ? 'border-emerald-400 bg-emerald-950/20' : 'border-[#1b2b44]'
          }`}>
            
            {/* Header del bloque con Estado y Contador */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  {lang === 'en' ? 'LIVE AUCTION STATUS' : 'ESTADO EN VIVO'}
                </span>
                <span className={`text-xs px-2.5 py-1 rounded inline-block border ${statusInfo.style}`}>
                  {statusInfo.label}
                </span>
              </div>

              {/* CONTADOR CIRCULAR AUTORITATIVO SINCRONIZADO CON SERVIDOR */}
              <CircularCountdown
                seconds={session.time_remaining_seconds}
                totalDuration={10}
                status={session.status}
                size={110}
                lang={lang}
              />
            </div>

            {/* PRECIO ACTUAL EN GRANDE */}
            <div className="my-3 text-center bg-[#050912] p-4 rounded-lg border border-[#1b2b44] relative overflow-hidden">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                {lang === 'en' ? 'CURRENT BID' : 'PRECIO VIGENTE DE SUBASTA (CURRENT BID)'}
              </span>
              
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-2xl font-black text-emerald-500">$</span>
                <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                  {(Number(session?.current_price ?? (session as any)?.currentPrice ?? 5000)).toLocaleString()}
                </span>
                <span className="text-sm font-bold text-slate-400 self-end mb-2">USD</span>
              </div>

              {/* Indicador de Postor Vigente */}
              <div className="mt-2 flex items-center justify-center">
                {(session as any).currentWinnerPaddle || session.current_bidder_name ? (
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    isBrokerWinning
                      ? 'bg-emerald-950/90 border border-emerald-400 text-emerald-300 animate-pulse'
                      : 'bg-rose-950/90 border border-rose-600/80 text-rose-300'
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
                    className={`w-full font-black py-3.5 px-4 rounded-lg shadow-xl text-base sm:text-lg flex items-center justify-center gap-2 transition active:scale-95 border-b-4 ${
                      authorizedBidAmount
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
                    disabled={isSubmittingBid || !['open', 'bidding', 'last_call'].includes(session.status) || !activeParticipant || (session.current_price + (session.bid_increment || 250) > clientBudget && authorizedBidAmount !== session.current_price + (session.bid_increment || 250))}
                    className="bg-[#050912] hover:bg-slate-800 disabled:opacity-40 text-xs font-bold text-slate-200 py-2 rounded border border-slate-700 transition"
                  >
                    +${session.bid_increment || 250}
                  </button>
                  <button
                    onClick={() => handlePlaceBrokerBid(session.current_price + 500)}
                    disabled={isSubmittingBid || !['open', 'bidding', 'last_call'].includes(session.status) || !activeParticipant || (session.current_price + 500 > clientBudget && authorizedBidAmount !== session.current_price + 500)}
                    className="bg-[#050912] hover:bg-slate-800 disabled:opacity-40 text-xs font-bold text-slate-200 py-2 rounded border border-slate-700 transition"
                  >
                    +$500 USD
                  </button>
                  <button
                    onClick={() => handlePlaceBrokerBid(session.current_price + 1000)}
                    disabled={isSubmittingBid || !['open', 'bidding', 'last_call'].includes(session.status) || !activeParticipant || (session.current_price + 1000 > clientBudget && authorizedBidAmount !== session.current_price + 1000)}
                    className="bg-[#050912] hover:bg-slate-800 disabled:opacity-40 text-xs font-black text-amber-400 py-2 rounded border border-slate-700 transition"
                  >
                    +$1,000 USD
                  </button>
                </div>
              </div>
            ) : (
              /* PANEL INFORMATIVO PARA EL CLIENTE (ESPECTADOR EN VIVO) */
              <div className="bg-[#050912] border border-blue-900/60 p-4 rounded-lg text-center space-y-3">
                <div className="w-9 h-9 rounded-full bg-blue-900/50 text-blue-300 flex items-center justify-center mx-auto border border-blue-500/40">
                  <ShieldCheck className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    {lang === 'en' ? 'LIVE AUCTION TERMINAL (BUYER SPECTATOR MODE)' : 'SALA DE PRESENTACIÓN EN DIRECTO (MODO COMPRADOR)'}
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    {lang === 'en' ? 'Bids for this lot are actively placed in real time by your ' : 'Las ofertas para este lote están siendo gestionadas en tiempo real por tu '}
                    <strong className="text-amber-400">{lang === 'en' ? 'Authorized Broker (Paddle #101)' : 'Broker Autorizado (Paleta #101)'}</strong>.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#08101d] p-2 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">
                      {lang === 'en' ? 'Your Maximum Budget' : 'Tu Presupuesto Máximo'}
                    </span>
                    <span className="font-mono font-black text-amber-400 text-sm">${clientBudget.toLocaleString()} USD</span>
                  </div>
                  <div className="bg-[#08101d] p-2 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">
                      {lang === 'en' ? 'Remaining Margin' : 'Margen Restante'}
                    </span>
                    <span className={`font-mono font-bold text-sm ${((Number(clientBudget) || 7500) - Number(session?.current_price ?? (session as any)?.currentPrice ?? 5000)) <= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      ${Math.max(0, (Number(clientBudget) || 7500) - Number(session?.current_price ?? (session as any)?.currentPrice ?? 5000)).toLocaleString()} USD
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-center gap-2 text-[10px] text-slate-400 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>
                    {lang === 'en'
                      ? 'SPECTATOR STREAM ACTIVE • YOU WILL BE PROMPTED IF BROKER REQUESTS A BUDGET INCREASE'
                      : 'SIN BOTONES DE OFERTA • RECIBIRÁS AVISO SI EL BROKER REQUIERE MÁS PRESUPUESTO'}
                  </span>
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
                  className={`font-bold pb-1 transition border-b-2 ${
                    activeTab === 'bids'
                      ? 'border-amber-400 text-amber-400'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  {t('tabBidHistory')} ({bids.length})
                </button>
                <button
                  onClick={() => setActiveTab('participants')}
                  className={`font-bold pb-1 transition border-b-2 ${
                    activeTab === 'participants'
                      ? 'border-amber-400 text-amber-400'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  {t('tabParticipants')} ({participants.length})
                </button>
                <button
                  onClick={() => setActiveTab('budgetAudit')}
                  className={`font-bold pb-1 transition border-b-2 ${
                    activeTab === 'budgetAudit'
                      ? 'border-amber-400 text-amber-400'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  {t('tabBudgetAudit')} ({budgetRequests.length})
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
                      className={`flex items-center justify-between p-2 rounded text-xs border ${
                        (b as any).paddle_number?.includes('101')
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
                {participants.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2 rounded bg-[#050912] border border-slate-800/80 text-xs"
                  >
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span className="text-amber-400 font-mono font-black">{p.paddleNumber}</span>
                        <span>•</span>
                        <span>{p.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{p.location}</span>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[9.5px] font-bold uppercase bg-emerald-950 border border-emerald-700/60 text-emerald-300">
                      AUTORIZADO
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 3: AUDITORÍA DE AUTORIZACIONES EXTRAORDINARIAS DE PRESUPUESTO */}
            {activeTab === 'budgetAudit' && (
              <div className="flex-1 overflow-y-auto max-h-[260px] space-y-2 pr-1">
                {budgetRequests.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500 py-8 text-center">
                    No se han registrado solicitudes de aumento extraordinario para este lote.
                  </div>
                ) : (
                  budgetRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-2.5 rounded bg-[#050912] border border-slate-800 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-1">
                        <span className="font-mono text-[10px] text-slate-400">ID: {req.id}</span>
                        <span className={`px-2 py-0.5 rounded text-[9.5px] font-black uppercase tracking-wider ${
                          req.status === 'approved'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                            : req.status === 'used'
                            ? 'bg-blue-950 text-blue-300 border border-blue-500'
                            : req.status === 'rejected'
                            ? 'bg-rose-950 text-rose-300 border border-rose-600'
                            : req.status === 'expired'
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-amber-950 text-amber-300 border border-amber-600 animate-pulse'
                        }`}>
                          {req.status === 'approved' ? '✓ Aprobado por Comprador'
                            : req.status === 'used' ? '✓ Oferta Ejecutada en Sala'
                            : req.status === 'rejected' ? '✗ Rechazado por Comprador'
                            : req.status === 'expired' ? 'Expirado'
                            : '⏳ Pendiente de Respuesta'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-500 block text-[9.5px]">Presupuesto Inicial:</span>
                          <span className="font-mono text-slate-300">${Number(req.initialBudget || 7500).toLocaleString()} USD</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9.5px]">Importe Solicitado:</span>
                          <span className="font-mono font-bold text-amber-400">${Number(req.requestedAmount).toLocaleString()} USD</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-0.5">
                        <span>Diferencia: +${(Number(req.requestedAmount) - Number(req.initialBudget || 7500)).toLocaleString()} USD</span>
                        <span>{req.createdAt ? new Date(req.createdAt).toLocaleTimeString() : ''}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </main>

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

          <div className="p-3">
            <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            
            <div className="flex items-center gap-2">
              <span className="bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded uppercase tracking-wider text-[11px] flex items-center gap-1">
                <Gavel className="w-3.5 h-3.5" />
                {lang === 'en' ? 'AUCTIONEER CONSOLE • OPERATOR CONTROLS' : 'CONSOLA DEL OPERADOR Y BROKER'}
              </span>
              <span className="text-slate-400 hidden sm:inline">
                {lang === 'en' ? 'Pace management, simulated bidders, and hammer adjudication' : 'Control de ritmo, ofertas de competidores y adjudicación'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              
              {/* CONTROL DEL PRESUPUESTO DEL CLIENTE */}
              <div className="flex items-center gap-1.5 bg-[#050912] border border-blue-800/80 px-2.5 py-1 rounded">
                <span className="text-[10px] text-slate-400 font-bold uppercase">{lang === 'en' ? 'Buyer Cap:' : 'Tope Cliente:'}</span>
                {isEditingBudget ? (
                  <div className="flex items-center gap-1">
                    <span className="text-emerald-400 font-bold">$</span>
                    <input
                      type="number"
                      value={tempBudget}
                      onChange={(e) => setTempBudget(e.target.value)}
                      className="w-20 bg-slate-900 border border-slate-700 text-white font-mono text-xs px-1 rounded"
                    />
                    <button
                      onClick={async () => {
                        const val = Number(tempBudget) || 14000;
                        await store.updateClientBudget(session.id, val);
                        setClientBudget(val);
                        setIsEditingBudget(false);
                      }}
                      className="text-emerald-400 hover:text-emerald-300 font-bold px-1"
                    >
                      ✓
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setTempBudget(String(clientBudget));
                      setIsEditingBudget(true);
                    }}
                    className="font-mono font-black text-amber-400 hover:underline flex items-center gap-1"
                    title={lang === 'en' ? 'Click to adjust buyer maximum budget' : 'Clic para cambiar el presupuesto máximo del cliente'}
                  >
                    <span>${(Number(clientBudget) || 7500).toLocaleString()} USD</span>
                    <span className="text-[9px] text-slate-500 font-normal">({lang === 'en' ? 'edit' : 'editar'})</span>
                  </button>
                )}

                <span className="text-slate-600">|</span>
                <span className="text-[10px] text-slate-400">
                  {lang === 'en' ? 'Margin:' : 'Margen:'} <strong className={((Number(clientBudget) || 7500) - Number(session?.current_price ?? (session as any)?.currentPrice ?? 5000)) <= (session.bid_increment || 250) ? 'text-amber-400' : 'text-emerald-400 font-mono'}>
                    ${Math.max(0, (Number(clientBudget) || 7500) - Number(session?.current_price ?? (session as any)?.currentPrice ?? 5000)).toLocaleString()}
                  </strong>
                </span>
              </div>

              {/* DISPARAR COMPETENCIA SIMULADA (RESPETA EL PRESUPUESTO DEL CLIENTE) */}
              <button
                onClick={handleTriggerCompetitor}
                disabled={
                  isTriggeringCompetitor || 
                  session.status === 'sold' ||
                  (session.current_price + (session.bid_increment || 250) >= clientBudget)
                }
                className="bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-slate-950 font-black px-3 py-1.5 rounded flex items-center gap-1.5 shadow transition active:scale-95 border-b-2 border-amber-700"
                title={
                  session.current_price + (session.bid_increment || 250) >= clientBudget
                    ? 'Budget cap reached. Competitor bids paused.'
                    : 'Generate simulated bidder offer'
                }
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>
                  {session.current_price + (session.bid_increment || 250) >= clientBudget
                    ? (lang === 'en' ? '🔒 Budget Cap Met' : '🔒 Tope Presupuesto')
                    : (lang === 'en' ? `+ Competitor Bid (+${session.bid_increment || 250})` : `+ Oferta Competidor (+${session.bid_increment || 250})`)}
                </span>
              </button>

              {session.status === 'prepared' || session.status === 'paused' ? (
                <button
                  onClick={() => store.serverStartAuction(session.id)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded flex items-center gap-1 transition shadow"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{session.status === 'paused' ? (lang === 'en' ? 'Resume Sale' : 'Reanudar Subasta') : (lang === 'en' ? 'Start Sale' : 'Abrir Subasta')}</span>
                </button>
              ) : (
                <button
                  onClick={() => store.serverPauseAuction(session.id)}
                  className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-3 py-1.5 rounded flex items-center gap-1 transition"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>{lang === 'en' ? 'Pause Sale' : 'Pausar'}</span>
                </button>
              )}

              {/* Bajar martillo para adjudicar al cliente o postor actual */}
              <button
                onClick={() => store.serverSoldAuction(session.id)}
                disabled={session.status === 'sold' || session.status === 'closed'}
                className="bg-rose-700 hover:bg-rose-600 disabled:opacity-50 text-white font-black px-3.5 py-1.5 rounded flex items-center gap-1 transition shadow"
                title="Hammer down and award to winning paddle"
              >
                <Gavel className="w-3.5 h-3.5" />
                <span>{lang === 'en' ? 'SOLD / Hammer Down' : 'Bajar Martillo (SOLD)'}</span>
              </button>

              {/* Cerrar Sala Definitivamente y Revocar Acceso de Espectadores */}
              <button
                onClick={async () => {
                  if (confirm(lang === 'en' ? 'Confirm permanently closing this lane? Viewing access will expire immediately.' : '¿Confirma cerrar la sala definitivamente? El acceso del cliente será revocado al instante y la conexión WebSocket cerrada.')) {
                    await store.serverCloseAuction(session.id);
                    await fetchStateFromServer();
                  }
                }}
                disabled={session.status === 'sold' || session.status === 'closed'}
                className="bg-rose-950/90 hover:bg-rose-900 border border-rose-700/80 text-rose-300 font-bold px-3 py-1.5 rounded flex items-center gap-1 transition shadow"
                title="Close auction lane and revoke spectator access"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{lang === 'en' ? 'Close Lane' : 'Cerrar Sala'}</span>
              </button>

              <button
                onClick={() => store.serverResetAuction(session.id)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-2.5 py-1.5 rounded border border-slate-700 flex items-center gap-1 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{lang === 'en' ? 'Reset Lot' : 'Reiniciar Lote'}</span>
              </button>

              {/* Cargar Siguiente Lote y Atender Nuevo Cliente en la Misma Sala */}
              <button
                onClick={() => setShowNextLotModal(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded flex items-center gap-1.5 transition shadow border border-emerald-400/40 active:scale-95"
                title={lang === 'en' ? 'Load next lot and attend new buyer in this same lane' : 'Cargar el siguiente vehículo y asignar nuevo cliente y broker en esta misma sala'}
              >
                <ArrowRightCircle className="w-3.5 h-3.5 text-amber-300" />
                <span className="font-extrabold">{lang === 'en' ? 'Next Lot / Client' : 'Siguiente Lote / Cliente'}</span>
              </button>
            </div>
          </div>
        </div>
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

      {/* MODAL DEL BROKER: EDITAR FICHA TÉCNICA Y ADMINISTRAR FOTOGRAFÍAS */}
      {showEditVehicleModal && editVehicleState && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1828] border border-[#1b3152] rounded-xl max-w-2xl w-full p-5 shadow-2xl animate-fadeIn max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Edit className="w-4 h-4 text-amber-400" />
                <span>Gestión de Ficha Técnica y Fotografías del Lote</span>
              </h3>
              <button onClick={() => setShowEditVehicleModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Sección 1: Datos Técnicos */}
              <div>
                <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[11px] mb-2">Especificaciones Técnicas</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Condición</label>
                    <select
                      value={editVehicleState.vehicle_condition || 'run_and_drive'}
                      onChange={(e) => setEditVehicleState({ ...editVehicleState, vehicle_condition: e.target.value })}
                      className="w-full bg-[#070e1a] border border-slate-700 rounded p-1.5 text-white"
                    >
                      <option value="run_and_drive">RUN & DRIVE</option>
                      <option value="starts">ENGINE STARTS</option>
                      <option value="stationary">STATIONARY / NON-RUN</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Tipo de Título</label>
                    <input
                      type="text"
                      value={editVehicleState.title_type || 'Salvage Certificate'}
                      onChange={(e) => setEditVehicleState({ ...editVehicleState, title_type: e.target.value })}
                      className="w-full bg-[#070e1a] border border-slate-700 rounded p-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Daño Principal</label>
                    <input
                      type="text"
                      value={editVehicleState.primary_damage || 'Impacto Frontal'}
                      onChange={(e) => setEditVehicleState({ ...editVehicleState, primary_damage: e.target.value })}
                      className="w-full bg-[#070e1a] border border-slate-700 rounded p-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Daño Secundario</label>
                    <input
                      type="text"
                      value={editVehicleState.secondary_damage || 'Ninguno'}
                      onChange={(e) => setEditVehicleState({ ...editVehicleState, secondary_damage: e.target.value })}
                      className="w-full bg-[#070e1a] border border-slate-700 rounded p-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Llaves Presentes</label>
                    <select
                      value={editVehicleState.has_keys ? 'true' : 'false'}
                      onChange={(e) => setEditVehicleState({ ...editVehicleState, has_keys: e.target.value === 'true' })}
                      className="w-full bg-[#070e1a] border border-slate-700 rounded p-1.5 text-white"
                    >
                      <option value="true">SÍ (Presentes)</option>
                      <option value="false">NO</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Odómetro ({editVehicleState.odometer_unit || 'mi'})</label>
                    <input
                      type="number"
                      value={editVehicleState.odometer || 14250}
                      onChange={(e) => setEditVehicleState({ ...editVehicleState, odometer: Number(e.target.value) })}
                      className="w-full bg-[#070e1a] border border-slate-700 rounded p-1.5 text-white"
                    />
                  </div>
                </div>

                <div className="mt-2">
                  <label className="text-[10px] text-slate-400 block mb-0.5">Descripción / Observaciones del Patio</label>
                  <textarea
                    rows={2}
                    value={editVehicleState.notes || ''}
                    onChange={(e) => setEditVehicleState({ ...editVehicleState, notes: e.target.value })}
                    className="w-full bg-[#070e1a] border border-slate-700 rounded p-1.5 text-white"
                  />
                </div>
              </div>

              {/* Sección 2: Gestión de Fotografías */}
              <div className="border-t border-slate-800 pt-3">
                <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[11px] mb-2">Administrar Fotografías ({editVehicleState.images?.length || 0})</h4>
                
                {/* Formulario para agregar foto */}
                <div className="bg-[#070e1a] p-2.5 rounded-lg border border-slate-800 space-y-2 mb-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Pegar URL de fotografía..."
                      value={newPhotoUrl}
                      onChange={(e) => setNewPhotoUrl(e.target.value)}
                      className="flex-1 bg-[#050912] border border-slate-700 rounded p-1.5 text-xs text-white"
                    />
                    <select
                      value={newPhotoCategory}
                      onChange={(e) => setNewPhotoCategory(e.target.value as PhotoCategory)}
                      className="bg-[#050912] border border-slate-700 rounded p-1.5 text-xs text-white"
                    >
                      <option value="exterior">Exterior</option>
                      <option value="interior">Interior</option>
                      <option value="motor">Motor</option>
                      <option value="tablero">Tablero</option>
                      <option value="danos">Daños</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleAddPhotoToVehicle}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span>O subir archivo local:</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUploadToVehicle}
                      className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-900 file:text-blue-200 hover:file:bg-blue-800 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Lista de fotos existentes */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1 bg-[#050912] rounded border border-slate-800">
                  {editVehicleState.images?.map((img: VehicleImage, i: number) => (
                    <div key={img.id || i} className="relative group rounded border border-slate-800 overflow-hidden bg-black aspect-[4/3]">
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] text-center font-bold text-amber-300 uppercase truncate">
                        {img.category}
                      </span>
                      <button
                        onClick={() => handleRemovePhoto(img.id)}
                        className="absolute top-1 right-1 bg-rose-600/90 hover:bg-rose-500 text-white p-1 rounded-full opacity-80 group-hover:opacity-100 transition"
                        title="Eliminar foto"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3 mt-4">
              <button
                onClick={() => setShowEditVehicleModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-1.5 rounded text-xs transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveVehicleEdit}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-1.5 rounded text-xs transition shadow"
              >
                Guardar y Actualizar Sala en Vivo
              </button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
};
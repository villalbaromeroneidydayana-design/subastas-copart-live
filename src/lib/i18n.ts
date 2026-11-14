import { useState, useEffect } from 'react';

export type Language = 'en' | 'es';

const STORAGE_KEY = 'copart_auction_lang';

let currentLanguage: Language = 'en';

if (typeof window !== 'undefined') {
  const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
  if (saved === 'en' || saved === 'es') {
    currentLanguage = saved;
  }
}

const listeners = new Set<(lang: Language) => void>();

export const getLanguage = (): Language => currentLanguage;

export const setLanguage = (lang: Language) => {
  currentLanguage = lang;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, lang);
  }
  listeners.forEach((fn) => fn(lang));
};

export const useTranslation = () => {
  const [lang, setLangState] = useState<Language>(getLanguage());

  useEffect(() => {
    const handler = (newLang: Language) => setLangState(newLang);
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  const changeLang = (l: Language) => {
    setLanguage(l);
  };

  const t = (key: keyof typeof translations['en']): string => {
    return translations[lang]?.[key] ?? translations['en'][key] ?? key;
  };

  return { lang, setLang: changeLang, t };
};

export const translations = {
  en: {
    // Top Bar & Identity
    laneTitle: 'LANE A',
    liveStream: 'LIVE BROADCAST',
    lotPrefix: 'LOT:',
    itemPrefix: 'ITEM #',
    viewersInLane: 'Viewers in Lane',
    spectatorJoined: 'Viewer entered auction lane',
    spectatorLeft: 'Viewer exited auction lane',
    liveIndicator: 'LIVE SALE',
    audioButton: 'Audio',
    mutedButton: 'Muted',
    unmuteTitle: 'Unmute Audio',
    muteTitle: 'Mute Audio',
    exitButton: 'Exit',
    copyClientLink: 'Copy Buyer Link',
    clientLinkCopied: 'Buyer Link Copied!',
    shareAccess: 'Share Buyer Access',

    // Role Badges
    auctioneerRole: 'CHIEF AUCTIONEER',
    auctioneerSubtitle: 'Independent Access & Live Presence Console',
    brokerRole: 'Authorized Broker:',
    buyerRole: 'Spectator Mode',
    buyerRoleSubtitle: '(Your representative broker is bidding live)',
    spectatorRole: 'Guest Spectator',

    // Auction Status Badges
    statusPrepared: 'PREVIEW / WAITING FOR START',
    statusActive: 'SALE IN PROGRESS',
    statusPaused: 'SALE PAUSED',
    statusSold: 'LOT SOLD!',
    statusUnsold: 'CLOSED - RESERVE NOT MET',
    statusClosed: 'LOT CLOSED',

    // Vehicle Specifications
    vehicleOverview: 'VEHICLE OVERVIEW & SPECS',
    vinLabel: 'VIN',
    copyVin: 'Copy VIN',
    vinCopied: 'VIN Copied!',
    maskVin: 'Mask VIN',
    unmaskVin: 'Show Full VIN',
    titleTypeLabel: 'TITLE TYPE',
    odometerLabel: 'ODOMETER',
    estRetailValue: 'EST. RETAIL VALUE',
    primaryDamage: 'PRIMARY DAMAGE',
    secondaryDamage: 'SECONDARY DAMAGE',
    engineLabel: 'CYLINDERS / ENGINE',
    transmissionLabel: 'TRANSMISSION',
    drivetrainLabel: 'DRIVE',
    keysLabel: 'KEYS',
    keysPresent: 'KEYS PRESENT',
    keysMissing: 'NO KEYS',
    yardLocation: 'YARD / LOCATION',
    vehicleNotes: 'INSPECTION NOTES',
    runAndDriveBadge: 'RUN & DRIVE CERTIFIED',
    cleanTitleBadge: 'CLEAN TITLE',
    salvageTitleBadge: 'SALVAGE CERTIFICATE',
    viewAllPhotos: 'View High-Res Gallery',
    photosCount: 'Photos',

    // Auction Engine & Bidding Console
    currentBid: 'CURRENT BID',
    askingBid: 'ASKING BID',
    bidCount: 'Total Bids',
    highBidder: 'HIGH BIDDER',
    outbid: 'OUTBID',
    youAreHighBidder: "YOU'RE HIGH BIDDER!",
    brokerWinningNotice: 'Your bid is currently leading the auction!',
    brokerOutbidNotice: 'Another bidder has topped your offer. Bid again!',
    sellerReserve: 'SELLER RESERVE',
    reserveMet: 'RESERVE MET',
    reserveNotMet: 'OFFER ON APPROVAL',
    minimumIncrement: 'Min. Increment',
    startingPrice: 'Starting Price',

    // Circular Countdown Clock
    clockBidding: 'BIDDING',
    clockBonusTime: 'BONUS TIME',
    clockLastCall: 'LAST CALL!',
    clockGoingOnce: 'GOING ONCE',
    clockGoingTwice: 'GOING TWICE',
    clockSold: 'SOLD!',
    clockClosed: 'CLOSED',

    // Bidding Actions
    bidButton: 'BID',
    submittingBid: 'Transmitting Bid...',
    maxBudgetLabel: 'BUYER MAX BUDGET:',
    overBudgetWarning: 'Bid exceeds authorized budget. Extraordinary authorization required.',
    requestBudgetAuth: 'REQUEST BUYER AUTHORIZATION',
    requestingAuth: 'Requesting...',
    authApprovedForBid: 'Authorized for',

    // Auctioneer Console Controls
    auctioneerConsole: 'AUCTIONEER CONSOLE',
    startAuction: 'START SALE',
    pauseAuction: 'PAUSE SALE',
    resumeAuction: 'RESUME SALE',
    soldAuction: 'SOLD / HAMMER DOWN',
    passAuction: 'PASS / NO SALE',
    triggerCompetitor: 'SIMULATE BIDDER',
    nextLotButton: 'NEXT LOT / ATTEND NEW CLIENT',
    resetAuction: 'RESET LOT',
    linksManagement: 'Live Session Links & Participant Status',
    brokerLinkHeader: 'BROKER LINK:',
    buyerLinkHeader: 'BUYER LINK:',
    copyLink: 'Copy',
    copied: 'Copied!',
    online: 'Online',
    offline: 'Offline',
    revokeAccess: 'Revoke',
    restoreAccess: 'Restore',

    // Tabs & Logs
    tabBidHistory: 'BID HISTORY',
    tabParticipants: 'REGISTERED BIDDERS',
    tabBudgetAudit: 'BUDGET AUDIT',
    colTime: 'Time',
    colBidder: 'Bidder / Paddle',
    colLocation: 'Location',
    colAmount: 'Amount',
    colStatus: 'Status',
    colOriginalBudget: 'Original Budget',
    colRequestedAmount: 'Requested Amount',
    colDifference: 'Difference',
    colDecision: 'Decision',
    noBidsYet: 'No bids recorded yet. Awaiting opening bid.',
    noAuditsYet: 'No extraordinary budget requests recorded.',

    // Extraordinary Budget Request Modal (Buyer Window)
    modalAuthTitle: 'EXTRAORDINARY BUDGET AUTHORIZATION REQUEST',
    modalAuthDesc: 'Your representative broker is requesting authorization to submit an extraordinary bid exceeding your original limit.',
    modalOriginalBudget: 'Original Budget',
    modalCurrentPrice: 'Current Price',
    modalRequestedBid: 'Requested Bid',
    modalDifference: 'Budget Increase Needed',
    btnApproveAuth: 'AUTHORIZE THIS BID',
    btnRejectAuth: 'DECLINE REQUEST',
    authPendingBadge: 'AWAITING YOUR DECISION',
    authApprovedBadge: 'AUTHORIZED',
    authRejectedBadge: 'DECLINED',

    // Broker Request Modal
    modalRequestTitle: 'REQUEST EXTRAORDINARY BID AUTHORIZATION',
    modalRequestDesc: 'Specify the exact bid amount you need your buyer to authorize for this lot.',
    inputBidAmount: 'Bid Amount (USD)',
    btnSubmitRequest: 'SEND REQUEST TO BUYER',
    btnCancel: 'Cancel',

    // Document Generation & Expired Notice
    btnGenerateDoc: 'Generate Bill of Sale & Award PDF',
    btnCopyDocLink: 'Copy Certificate Link',
    btnRevokeDoc: 'Revoke Document Access',
    docGeneratedAlert: 'Official transaction certificate generated and copied to clipboard.',
    saleFinishedNotice: 'LOT COMPLETED & HAMMERED DOWN',
    winnerBanner: 'WINNING BIDDER ADJUDICATION',
    winnerPaddle: 'Winning Paddle:',
    finalPrice: 'Hammer Price:',

    // Room Access Expired Page
    expiredTitle: 'OFFICIAL AUCTION NOTICE',
    expiredHeader: 'AUCTION LANE CLOSED • ACCESS EXPIRED',
    expiredBody1: 'This auction lane has concluded its live broadcast and public viewing access has expired.',
    expiredBody2: 'To consult official transaction documents, bill of sale, or payment invoices, please contact your authorized representative broker.',
    btnReturnHome: 'Return to Portal',
    supportActive: 'Broker Desk: Active',

    // Language Toggle
    langEn: 'EN',
    langEs: 'ES',
  },
  es: {
    // Top Bar & Identity
    laneTitle: 'SALA A',
    liveStream: 'TRANSMISIÓN EN DIRECTO',
    lotPrefix: 'LOTE:',
    itemPrefix: 'ARTÍCULO #',
    viewersInLane: 'Espectadores en Sala',
    spectatorJoined: 'Espectador conectado a la sala',
    spectatorLeft: 'Espectador salió de la sala',
    liveIndicator: 'SUBASTA EN VIVO',
    audioButton: 'Audio',
    mutedButton: 'Silenciado',
    unmuteTitle: 'Activar Sonido',
    muteTitle: 'Silenciar Sonido',
    exitButton: 'Salir',
    copyClientLink: 'Copiar Enlace Comprador',
    clientLinkCopied: '¡Enlace Copiado!',
    shareAccess: 'Compartir Acceso Comprador',

    // Role Badges
    auctioneerRole: 'SUBASTADOR PRINCIPAL',
    auctioneerSubtitle: 'Consola de Enlaces Independientes y Presencia',
    brokerRole: 'Broker Autorizado:',
    buyerRole: 'Modo Espectador',
    buyerRoleSubtitle: '(Tu Broker está ofertando en vivo)',
    spectatorRole: 'Espectador Invitado',

    // Auction Status Badges
    statusPrepared: 'PREPARACIÓN / ESPERANDO INICIO',
    statusActive: 'SUBASTA EN CURSO',
    statusPaused: 'SUBASTA EN PAUSA',
    statusSold: '¡LOTE ADJUDICADO!',
    statusUnsold: 'CERRADA - RESERVA NO ALCANZADA',
    statusClosed: 'LOTE CERRADO',

    // Vehicle Specifications
    vehicleOverview: 'FICHA TÉCNICA DEL VEHÍCULO',
    vinLabel: 'VIN',
    copyVin: 'Copiar VIN',
    vinCopied: '¡VIN Copiado!',
    maskVin: 'Ocultar VIN',
    unmaskVin: 'Ver VIN Completo',
    titleTypeLabel: 'TIPO DE TÍTULO',
    odometerLabel: 'ODÓMETRO',
    estRetailValue: 'VALOR EST. MERCADO',
    primaryDamage: 'DAÑO PRIMARIO',
    secondaryDamage: 'DAÑO SECUNDARIO',
    engineLabel: 'CILINDROS / MOTOR',
    transmissionLabel: 'TRANSMISIÓN',
    drivetrainLabel: 'TRACCIÓN',
    keysLabel: 'LLAVES',
    keysPresent: 'LLAVES PRESENTES',
    keysMissing: 'SIN LLAVES',
    yardLocation: 'PATIO / UBICACIÓN',
    vehicleNotes: 'NOTAS DE INSPECCIÓN',
    runAndDriveBadge: 'ARRANCA Y CONDUCE (RUN & DRIVE)',
    cleanTitleBadge: 'TÍTULO LIMPIO',
    salvageTitleBadge: 'CERTIFICADO DE SALVAMENTO',
    viewAllPhotos: 'Ver Galería de Alta Resolución',
    photosCount: 'Fotos',

    // Auction Engine & Bidding Console
    currentBid: 'OFERTA ACTUAL',
    askingBid: 'OFERTA SOLICITADA',
    bidCount: 'Total Ofertas',
    highBidder: 'MEJOR POSTOR',
    outbid: 'SUPERADO',
    youAreHighBidder: '¡ERES EL MEJOR POSTOR!',
    brokerWinningNotice: '¡Tu oferta está liderando la subasta en este momento!',
    brokerOutbidNotice: 'Otro postor ha superado tu oferta. ¡Oferta de nuevo!',
    sellerReserve: 'RESERVA DEL VENDEDOR',
    reserveMet: 'RESERVA CUMPLIDA',
    reserveNotMet: 'OFERTA SUJETA A APROBACIÓN',
    minimumIncrement: 'Incremento Mínimo',
    startingPrice: 'Precio Inicial',

    // Circular Countdown Clock
    clockBidding: 'OFERTAS',
    clockBonusTime: 'TIEMPO EXTRA',
    clockLastCall: '¡ÚLTIMA LLAMADA!',
    clockGoingOnce: 'A LA UNA',
    clockGoingTwice: 'A LAS DOS',
    clockSold: '¡VENDIDO!',
    clockClosed: 'CERRADO',

    // Bidding Actions
    bidButton: 'OFERTAR',
    submittingBid: 'Transmitiendo Oferta...',
    maxBudgetLabel: 'PRESUPUESTO MÁXIMO DEL COMPRADOR:',
    overBudgetWarning: 'La oferta supera el presupuesto autorizado. Requiere autorización extraordinaria.',
    requestBudgetAuth: 'SOLICITAR AUTORIZACIÓN AL COMPRADOR',
    requestingAuth: 'Solicitando...',
    authApprovedForBid: 'Autorizado para',

    // Auctioneer Console Controls
    auctioneerConsole: 'CONSOLA DEL SUBASTADOR',
    startAuction: 'INICIAR SUBASTA',
    pauseAuction: 'PAUSAR SUBASTA',
    resumeAuction: 'REANUDAR',
    soldAuction: 'SOLD / ADJUDICAR',
    passAuction: 'CERRAR / SIN VENTA',
    triggerCompetitor: 'SIMULAR POSTOR',
    nextLotButton: 'SIGUIENTE LOTE / NUEVO CLIENTE',
    resetAuction: 'REINICIAR LOTE',
    linksManagement: 'Control de Enlaces Independientes y Presencia en Vivo',
    brokerLinkHeader: 'LINK BROKER:',
    buyerLinkHeader: 'LINK CLIENTE:',
    copyLink: 'Copiar',
    copied: '¡Copiado!',
    online: 'Conectado',
    offline: 'Desconectado',
    revokeAccess: 'Revocar',
    restoreAccess: 'Restaurar',

    // Tabs & Logs
    tabBidHistory: 'HISTORIAL DE OFERTAS',
    tabParticipants: 'POSTORES REGISTRADOS',
    tabBudgetAudit: 'AUDITORÍA DE PRESUPUESTO',
    colTime: 'Hora',
    colBidder: 'Postor / Paleta',
    colLocation: 'Ubicación',
    colAmount: 'Importe',
    colStatus: 'Estado',
    colOriginalBudget: 'Presupuesto Original',
    colRequestedAmount: 'Importe Solicitado',
    colDifference: 'Diferencia',
    colDecision: 'Decisión',
    noBidsYet: 'Sin ofertas registradas. Esperando apertura de puja.',
    noAuditsYet: 'Sin solicitudes extraordinarias registradas.',

    // Extraordinary Budget Request Modal (Buyer Window)
    modalAuthTitle: 'AUTORIZACIÓN EXTRAORDINARIA DE PRESUPUESTO',
    modalAuthDesc: 'Tu broker representante está solicitando tu autorización expresa para realizar una oferta superior a tu presupuesto original.',
    modalOriginalBudget: 'Presupuesto Original',
    modalCurrentPrice: 'Precio Actual',
    modalRequestedBid: 'Oferta Solicitada',
    modalDifference: 'Aumento Solicitado',
    btnApproveAuth: 'AUTORIZAR OFERTA',
    btnRejectAuth: 'RECHAZAR SOLICITUD',
    authPendingBadge: 'ESPERANDO TU DECISIÓN',
    authApprovedBadge: 'AUTORIZADA',
    authRejectedBadge: 'RECHAZADA',

    // Broker Request Modal
    modalRequestTitle: 'SOLICITAR AUMENTO EXTRAORDINARIO',
    modalRequestDesc: 'Indica el importe exacto de la oferta que requieres que el comprador autorice.',
    inputBidAmount: 'Importe de la Oferta (USD)',
    btnSubmitRequest: 'ENVIAR SOLICITUD AL COMPRADOR',
    btnCancel: 'Cancelar',

    // Document Generation & Expired Notice
    btnGenerateDoc: 'Generar Comprobante Oficial y Acta PDF',
    btnCopyDocLink: 'Copiar Enlace del Documento',
    btnRevokeDoc: 'Revocar Documento',
    docGeneratedAlert: 'Enlace documental oficial generado y copiado al portapapeles.',
    saleFinishedNotice: 'LOTE FINALIZADO Y ADJUDICADO',
    winnerBanner: 'ADJUDICACIÓN OFICIAL',
    winnerPaddle: 'Paleta Ganadora:',
    finalPrice: 'Precio de Martillo:',

    // Room Access Expired Page
    expiredTitle: 'AVISO OFICIAL DE SUBASTA',
    expiredHeader: 'ACCESO CERRADO Y REVOCADO',
    expiredBody1: 'Esta sala ha cerrado oficialmente y el acceso de visualización ha expirado.',
    expiredBody2: 'Si necesitas consultar la documentación de tu operación o factura, comunícate con tu broker autorizado.',
    btnReturnHome: 'Volver al Inicio',
    supportActive: 'Soporte Broker: Activo',

    // Language Toggle
    langEn: 'EN',
    langEs: 'ES',
  },
} as const;


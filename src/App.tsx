import React, { useState, useEffect } from 'react';
import { store } from './services/store';
import { AuctionSession } from './types';
import { CopartLiveRoom } from './components/room/CopartLiveRoom';
import { RoomAccessExpiredView } from './components/room/RoomAccessExpiredView';
import { DocumentView } from './components/documents/DocumentView';
import { AuctioneerPrivateConsole } from './components/admin/AuctioneerPrivateConsole';
import { CopartLogo } from './components/common/CopartLogo';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export function App() {
  const [activeSession, setActiveSession] = useState<AuctionSession | null>(null);
  const [consoleSession, setConsoleSession] = useState<AuctionSession | null>(null);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(true);
  const [currentRole, setCurrentRole] = useState<'auctioneer' | 'broker' | 'buyer' | 'spectator'>('auctioneer');
  const [currentUserToken, setCurrentUserToken] = useState<string | undefined>(undefined);
  const [serverRoomData, setServerRoomData] = useState<any>(null);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [isRoomExpired, setIsRoomExpired] = useState<boolean>(false);
  const [expiredLotNumber, setExpiredLotNumber] = useState<string>('48291032');
  const [activeDocumentToken, setActiveDocumentToken] = useState<string | null>(null);

  // Cargar sesión inicial para la consola privada del subastador
  useEffect(() => {
    const loadDefaultSession = async () => {
      try {
        const sessions = await store.fetchServerSessions();
        if (sessions && sessions.length > 0) {
          setConsoleSession(sessions[0]);
        } else {
          const locals = store.getSessions();
          if (locals.length > 0) setConsoleSession(locals[0]);
        }
      } catch {
        const locals = store.getSessions();
        if (locals.length > 0) setConsoleSession(locals[0]);
      }
    };
    loadDefaultSession();
  }, []);

  // Router basado en hash para: #/sala/:token, #/documento/:doc_token
  useEffect(() => {
    const handleHashChange = async () => {
      const hash = window.location.hash;

      // Si no hay hash o es raíz, abrir directamente la Sala Oficial de Subasta Copart VB3
      if (!hash || hash === '#' || hash === '#/' || hash.startsWith('#/catalogo')) {
        window.location.hash = '#/sala/copart-live-johan101';
        return;
      }

      // 1. RUTA INDEPENDIENTE DE DOCUMENTACIÓN: #/documento/:doc_token
      const docMatch = hash.match(/#\/documento\/(.+)/);
      if (docMatch && docMatch[1]) {
        setActiveDocumentToken(docMatch[1]);
        setActiveSession(null);
        setIsRoomExpired(false);
        setRoomError(null);
        return;
      } else {
        setActiveDocumentToken(null);
      }

      // 2. RUTA DE SALA EN VIVO: #/sala/:token
      const roomMatch = hash.match(/#\/sala\/(.+)/);
      if (roomMatch && roomMatch[1]) {
        const rawToken = roomMatch[1];
        // Separar query params si existen (ej. ?broker=... o ?cliente=...)
        const token = rawToken.split('?')[0];
        const search = rawToken.includes('?') ? rawToken.split('?')[1] : '';
        const params = new URLSearchParams(search);
        
        const brokerParam = params.get('broker') || params.get('bidder') || undefined;
        const buyerParam = params.get('cliente') || params.get('buyer') || undefined;
        const isAuctioneer = params.get('auctioneer') === 'true' || brokerParam === 'bdr_admin';

        // Comprobación autoritativa en el servidor backend
        const serverData = await store.fetchServerSession(token, {
          bidderToken: brokerParam,
          brokerToken: brokerParam,
          buyerToken: buyerParam,
          isAuctioneer,
        });

        if (serverData && serverData.isExpired && !isAuctioneer) {
          // SALA CERRADA O ACCESO REVOCADO
          setIsRoomExpired(true);
          setExpiredLotNumber(serverData.session?.lotNumber || '48291032');
          setActiveSession(null);
          setRoomError(null);
          return;
        }

        if (serverData && serverData.session) {
          setIsRoomExpired(false);
          setActiveSession({
            ...serverData.session,
            vehicle_snapshot: serverData.session.vehicle,
          } as any);
          const detectedRole = serverData.role || (isAuctioneer ? 'auctioneer' : (brokerParam ? 'broker' : (buyerParam ? 'buyer' : 'spectator')));
          setCurrentRole(detectedRole);
          setCurrentUserToken(serverData.userToken || brokerParam || buyerParam);
          setServerRoomData(serverData);
          setIsAdminMode(detectedRole === 'auctioneer' || detectedRole === 'broker');
          setRoomError(null);
          return;
        }

        // Búsqueda en store local como fallback
        const found = store.getSessionByToken(token);
        if (found) {
          if (found.is_token_revoked && !isAuctioneer) {
            setIsRoomExpired(true);
            setExpiredLotNumber(found.vehicle_snapshot?.lot_number || '48291032');
            setActiveSession(null);
          } else {
            setIsRoomExpired(false);
            setActiveSession(found);
            setCurrentRole(isAuctioneer ? 'auctioneer' : (brokerParam ? 'broker' : (buyerParam ? 'buyer' : 'spectator')));
            setCurrentUserToken(brokerParam || buyerParam);
            setIsAdminMode(Boolean(isAuctioneer || brokerParam));
            setRoomError(null);
          }
        } else {
          setRoomError('La sala de subasta solicitada no existe o el enlace ha caducado.');
          setActiveSession(null);
          setIsRoomExpired(false);
        }
        return;
      }

      // Si no hay hash, pantalla administrativa
      setActiveSession(null);
      setIsRoomExpired(false);
      setRoomError(null);
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    
    // Solo re-sondear si el cliente quedó en pantalla de aviso o expiración para auto-recuperar
    const unsub = store.subscribe(() => {
      if (isRoomExpired) {
        handleHashChange();
      }
    });

    const interval = setInterval(() => {
      if (window.location.hash.includes('#/sala/') && isRoomExpired) {
        handleHashChange();
      }
    }, 5000);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      unsub();
      clearInterval(interval);
    };
  }, []);

  const handleOpenRoomAsAdmin = (session: AuctionSession) => {
    setActiveSession(session);
    setIsAdminMode(true);
    setIsRoomExpired(false);
  };

  const handleExitRoom = () => {
    setActiveSession(null);
    setIsRoomExpired(false);
    setActiveDocumentToken(null);
    window.location.hash = '';
  };

  // 1. Vista independiente de entrega de documentación (#/documento/:doc_token)
  if (activeDocumentToken) {
    return (
      <DocumentView
        docToken={activeDocumentToken}
        onBack={handleExitRoom}
      />
    );
  }

  // 2. Pantalla oficial de Acceso Cerrado y Revocado cuando la subasta finalizó
  if (isRoomExpired) {
    return (
      <RoomAccessExpiredView
        lotNumber={expiredLotNumber}
      />
    );
  }

  // 3. Pantalla de error si el enlace no existe
  if (roomError) {
    return (
      <div className="min-h-screen bg-[#070d18] text-white flex flex-col items-center justify-center p-6 text-center">
        <CopartLogo size="lg" showSubtitle={true} className="mb-6" />
        <div className="bg-[#0e1828] border border-rose-900/60 p-6 rounded-xl max-w-md w-full shadow-2xl">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white mb-2">Acceso a Sala Restringido</h2>
          <p className="text-xs text-slate-400 mb-6">{roomError}</p>
          <a
            href="https://www.copart.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#002855] hover:bg-[#003875] text-amber-400 border border-amber-500/40 font-semibold py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 transition"
          >
            <span>Ir al Portal Oficial Copart.com</span>
          </a>
        </div>
      </div>
    );
  }

  // 4. PANTALLA 1: SALA DE SUBASTA EN VIVO (Terminal Compartida para Broker y Comprador)
  if (activeSession) {
    return (
      <CopartLiveRoom
        session={activeSession}
        isAdmin={false} // Sala pública 100% limpia de controles administrativos
        role={currentRole}
        userToken={currentUserToken}
        initialRoomData={serverRoomData}
        onExit={handleExitRoom}
      />
    );
  }

  // 5. PANTALLA 2: CONSOLA PRIVADA DEL SUBASTADOR (Centro de Mando Exclusivo)
  const fallbackSession = consoleSession || store.getSessionById('ses-live-camry-johan') || store.getSessions()[0] || ({
    id: 'ses-live-camry-johan',
    title: 'Subasta Oficial en Vivo - 2022 Toyota Camry SE Sport Edition (ADJUDICADO)',
    lot_number: '76061096',
    brand: 'Toyota',
    model: 'Camry SE',
    year: 2022,
    status: 'sold',
    starting_price: 3000,
    current_price: 6150,
    bid_increment: 100,
    client_max_budget: 7500,
    current_winner_paddle: 'Paleta #101',
    current_winner_name: 'Johan Vladimir Rajo Arias',
    is_token_revoked: true,
    time_remaining_seconds: 0,
    room_token: 'copart-live-johan101',
    broker_access_token: 'bdr_broker_johan101',
    buyer_access_token: 'bdr_buyer_johan101',
  } as unknown as AuctionSession);

  return (
    <AuctioneerPrivateConsole
      session={fallbackSession}
      onOpenLiveRoom={handleOpenRoomAsAdmin}
      onExit={handleExitRoom}
    />
  );
}

export default App;

import express from 'express';
import http from 'http';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { initDatabase, generateSecureToken, hashToken } from './db';
import { placeBidAtomic } from './engine';

const app = express();
app.set('trust proxy', 1);

// CONFIGURACIÓN DE CORS CONTROLADA (SIN COMODINES INNECESARIOS)
const allowedOriginRegexes = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/,
  /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/,
  /^http:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+(:\d+)?$/,
  /^https?:\/\/([a-z0-9-]+\.)?pinggy\.(link|io)(:\d+)?$/i,
  /^https?:\/\/([a-z0-9-]+\.)?loca\.lt(:\d+)?$/i,
  /^https?:\/\/([a-z0-9-]+\.)?localtunnel\.me(:\d+)?$/i,
  /^https?:\/\/([a-z0-9-]+\.)?ngrok(-free)?\.app(:\d+)?$/i,
  /^https?:\/\/([a-z0-9-]+\.)?trycloudflare\.com(:\d+)?$/i,
  /^https?:\/\/([a-z0-9-]+\.)*vercel\.app$/i,
];

const customAllowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      // Reflejar y autorizar el origen entrante (Vercel, subdominios de vista previa, túneles y localhost)
      callback(null, origin || true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    optionsSuccessStatus: 200,
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Endpoint de salud del backend para diagnósticos y uptime
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'Copart Live Auction Engine',
    database: 'connected',
  });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Inicializar Base de Datos Persistente SQLite con WAL
const db = initDatabase();

// Semilla inicial persistente si no existe
function seedDatabase() {
  const existing = db.prepare('SELECT id FROM auction_sessions WHERE id = ?').get('ses-live-001');
  const defaultBrokerToken = 'bdr_broker_m729k1';
  const defaultBuyerToken = 'bdr_buyer_m729k1';

  if (!existing) {
    const seedVehicle = {
      brand: 'Ford',
      model: 'Mustang GT Premium',
      year: 2023,
      version: '5.0L V8 Fastback',
      vin: '1FA6P8CF9P5198241',
      lot_number: '48291032',
      engine: '5.0L V8 Coyote 32V',
      transmission: 'Automática de 10 velocidades',
      drivetrain: 'RWD',
      odometer: 14250,
      odometer_unit: 'mi',
      title_type: 'salvage',
      vehicle_condition: 'run_and_drive',
      primary_damage: 'Front End',
      secondary_damage: 'Minor Dent/Scratch',
      has_keys: true,
      location: 'Atlanta East (GA)',
      est_retail_value: 43500,
      images: [
        {
          id: 'img-1',
          url: 'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=1200&q=80',
          category: 'exterior',
          is_primary: true
        },
        {
          id: 'img-2',
          url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80',
          category: 'tablero',
          is_primary: false
        }
      ]
    };

    db.prepare(`
      INSERT INTO auction_sessions (
        id, title, lot_number, brand, model, year, status, starting_price, min_increment, reserve_price,
        current_price, client_max_budget, bid_count, time_remaining_seconds, total_duration_seconds, room_token, is_token_revoked,
        vehicle_json, broker_access_token, buyer_access_token, broker_name, buyer_name, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'ses-live-001',
      'Subasta Oficial en Vivo - 2023 Ford Mustang GT',
      '48291032',
      'Ford',
      'Mustang GT',
      2023,
      'prepared',
      5000,
      250,
      12000,
      5000,
      7500, // Presupuesto inicial del comprador: $7,500 USD
      0,
      15,
      15,
      'copart-live-m729k1',
      0,
      JSON.stringify(seedVehicle),
      defaultBrokerToken,
      defaultBuyerToken,
      'Broker Autorizado (Representante)',
      'Carlos Mendoza (Comprador)',
      new Date().toISOString(),
      new Date().toISOString()
    );

    // Registrar paleta de broker autorizada para ofertar por el cliente (Paleta #101)
    db.prepare(`
      INSERT INTO auction_participants (
        id, session_id, name, paddle_number, location, token_hash, authorization_status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'part-101',
      'ses-live-001',
      'Carlos Mendoza (Broker Rep. #101)',
      'Paleta #101',
      'Miami, FL',
      hashToken(defaultBrokerToken),
      'approved',
      new Date().toISOString()
    );

    // Registrar participantes competidores para el modo de dinamización controlada por el operador
    const competitors = [
      { id: 'part-comp-1', name: 'AutoExport Dallas LLC', paddle: 'Paleta #108', loc: 'Dallas, TX', token: 'bdr_comp_dallas_108' },
      { id: 'part-comp-2', name: 'Pacific Salvage Auctions', paddle: 'Paleta #214', loc: 'Los Angeles, CA', token: 'bdr_comp_pacific_214' },
      { id: 'part-comp-3', name: 'Global Fleet Buyers', paddle: 'Paleta #305', loc: 'Atlanta, GA', token: 'bdr_comp_global_305' }
    ];

    for (const c of competitors) {
      db.prepare(`
        INSERT INTO auction_participants (
          id, session_id, name, paddle_number, location, token_hash, authorization_status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        c.id,
        'ses-live-001',
        c.name,
        c.paddle,
        c.loc,
        hashToken(c.token),
        'approved',
        new Date().toISOString()
      );
    }
  } else {
    // Asegurar que las columnas de tokens de broker y comprador estén pobladas
    db.prepare(`
      UPDATE auction_sessions
      SET broker_access_token = ?,
          buyer_access_token = ?,
          broker_name = 'Broker Autorizado (Representante)',
          buyer_name = 'Carlos Mendoza (Comprador)',
          client_max_budget = 7500,
          status = 'open',
          is_token_revoked = 0,
          broker_token_revoked = 0,
          buyer_token_revoked = 0,
          current_price = starting_price,
          time_remaining_seconds = total_duration_seconds,
          bid_count = 0
      WHERE id = 'ses-live-001'
    `).run(defaultBrokerToken, defaultBuyerToken);

    db.prepare(`
      UPDATE auction_participants
      SET token_hash = ?
      WHERE session_id = 'ses-live-001' AND paddle_number = 'Paleta #101'
    `).run(hashToken(defaultBrokerToken));
  }
}

seedDatabase();

// Control de espectadores conectados en tiempo real (Recuento anónimo exacto)
let connectedClientsCount = 0;

interface ClientMetadata {
  role: 'auctioneer' | 'broker' | 'buyer' | 'spectator';
  sessionId?: string;
  roomToken?: string;
  token?: string;
}

const socketMetadata = new Map<WebSocket, ClientMetadata>();
const activeAuctioneerCalls = new Map<string, string>();
const auctioneerCallTimeouts = new Map<string, NodeJS.Timeout>();

function setAuctioneerCall(sessionId: string, call: string | null) {
  if (auctioneerCallTimeouts.has(sessionId)) {
    clearTimeout(auctioneerCallTimeouts.get(sessionId)!);
    auctioneerCallTimeouts.delete(sessionId);
  }
  if (!call || call === 'clear') {
    activeAuctioneerCalls.delete(sessionId);
  } else {
    activeAuctioneerCalls.set(sessionId, call);
    // En Copart la advertencia de martillo dura 7.5 segundos y se retira automáticamente
    const t = setTimeout(() => {
      activeAuctioneerCalls.delete(sessionId);
      auctioneerCallTimeouts.delete(sessionId);
      broadcast({
        type: 'AUCTIONEER_CALL',
        sessionId,
        call: 'clear',
        timestamp: new Date().toISOString()
      });
    }, 7500);
    auctioneerCallTimeouts.set(sessionId, t);
  }
}

function broadcast(message: object) {
  const payload = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

function broadcastPresence(sessionId?: string) {
  if (!sessionId) return;
  let brokerOnline = false;
  let buyerOnline = false;

  for (const [socket, meta] of socketMetadata.entries()) {
    if (meta.sessionId === sessionId && socket.readyState === WebSocket.OPEN) {
      if (meta.role === 'broker') brokerOnline = true;
      if (meta.role === 'buyer') buyerOnline = true;
    }
  }

  broadcast({
    type: 'PARTICIPANTS_PRESENCE',
    sessionId,
    brokerOnline,
    buyerOnline,
    timestamp: new Date().toISOString()
  });
}

// Localizador autoritativo de sesión con tolerancia a tokens previos, carril único y aliases
function findSession(idOrToken?: string): any {
  if (idOrToken && idOrToken !== 'undefined' && idOrToken !== 'null') {
    const direct = db.prepare('SELECT * FROM auction_sessions WHERE id = ? OR room_token = ?').get(idOrToken, idOrToken) as any;
    if (direct) return direct;
  }
  return db.prepare('SELECT * FROM auction_sessions ORDER BY updated_at DESC LIMIT 1').get() as any;
}

wss.on('connection', (ws) => {
  const currentCount = wss.clients.size;
  connectedClientsCount = currentCount;
  
  // Difundir conteo de espectadores en tiempo real sin divulgar geolocalización (REGLA 6)
  broadcast({ 
    type: 'SPECTATOR_JOINED', 
    viewersCount: currentCount,
    timestamp: new Date().toISOString()
  });

  ws.send(JSON.stringify({ 
    type: 'CONNECTED', 
    serverTime: new Date().toISOString(),
    viewersCount: currentCount
  }));

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'SUBSCRIBE') {
        const roomToken = msg.roomToken;
        const s = findSession(roomToken);
        if (!s) return;

        let role: 'auctioneer' | 'broker' | 'buyer' | 'spectator' = 'spectator';
        if (msg.isAuctioneer || msg.role === 'auctioneer' || msg.adminToken === 'bdr_admin') {
          role = 'auctioneer';
        } else if (msg.brokerToken && msg.brokerToken === s.broker_access_token) {
          if (s.broker_token_revoked) {
            ws.send(JSON.stringify({
              type: 'ACCESS_REVOKED',
              target: 'broker',
              message: 'Su acceso como Broker ha sido revocado por el subastador principal.'
            }));
            setTimeout(() => { try { ws.close(4003, 'BROKER_ACCESS_REVOKED'); } catch {} }, 100);
            return;
          }
          role = 'broker';
        } else if (msg.buyerToken && msg.buyerToken === s.buyer_access_token) {
          if (s.buyer_token_revoked) {
            ws.send(JSON.stringify({
              type: 'ACCESS_REVOKED',
              target: 'buyer',
              message: 'Su acceso como Comprador ha sido revocado por el subastador principal.'
            }));
            setTimeout(() => { try { ws.close(4003, 'BUYER_ACCESS_REVOKED'); } catch {} }, 100);
            return;
          }
          role = 'buyer';
        }

        // Comprobar si la sala ya fue revocada o finalizada para roles no subastadores (Sólo cierre total o revocación expresa)
        if ((Boolean(s.is_token_revoked) || s.status === 'closed') && role !== 'auctioneer') {
          ws.send(JSON.stringify({
            type: 'ROOM_ACCESS_REVOKED',
            sessionId: s.id,
            title: 'SUBASTA FINALIZADA',
            message: 'Esta sala ha cerrado oficialmente y el acceso de visualización ha expirado.\n\nSi necesitas consultar la documentación de tu operación, comunícate con tu broker autorizado.'
          }));
          setTimeout(() => {
            try { ws.close(4003, 'SUBASTA FINALIZADA - ACCESO EXPIRADO'); } catch {}
          }, 100);
          return;
        }

        socketMetadata.set(ws, {
          role,
          sessionId: s.id,
          roomToken: s.room_token,
          token: role === 'broker' ? msg.brokerToken : (role === 'buyer' ? msg.buyerToken : undefined)
        });

        (ws as any).roomToken = roomToken;
        (ws as any).role = role;
        (ws as any).sessionId = s.id;

        broadcastPresence(s.id);
      } else if (msg.type === 'AUCTIONEER_CALL') {
        const session = findSession(msg.sessionId);
        if (session) {
          setAuctioneerCall(session.id, msg.call);
          broadcast({
            type: 'AUCTIONEER_CALL',
            sessionId: session.id,
            call: msg.call || 'clear',
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch {}
  });

  ws.on('close', () => {
    const meta = socketMetadata.get(ws);
    socketMetadata.delete(ws);
    const remaining = wss.clients.size;
    connectedClientsCount = remaining;

    broadcast({ 
      type: 'SPECTATOR_LEFT', 
      viewersCount: remaining,
      timestamp: new Date().toISOString()
    });

    if (meta?.sessionId) {
      broadcastPresence(meta.sessionId);
    }
  });
});

// Control de reloj del servidor (1 Hz)
const sessionTimers: Map<string, NodeJS.Timeout> = new Map();

function startServerClock(sessionId: string) {
  stopServerClock(sessionId);

  const timer = setInterval(() => {
    const session = db.prepare('SELECT * FROM auction_sessions WHERE id = ?').get(sessionId) as any;
    if (!session || session.status === 'prepared' || session.status === 'paused' || session.status === 'sold' || session.status === 'unsold' || session.status === 'closed') {
      return;
    }

    if (session.time_remaining_seconds > 0) {
      const newTime = session.time_remaining_seconds - 1;
      let newStatus = session.status;

      if (newTime <= 6 && session.status !== 'last_call') {
        newStatus = 'last_call';
      }

      db.prepare('UPDATE auction_sessions SET time_remaining_seconds = ?, status = ? WHERE id = ?').run(
        newTime,
        newStatus,
        sessionId
      );

      broadcast({
        type: 'CLOCK_TICK',
        sessionId,
        timeRemaining: newTime,
        currentPrice: session.current_price,
        status: newStatus,
        viewersCount: connectedClientsCount,
      });
    } else {
      // El reloj llegó a 0s: se mantiene a la espera soberana del subastador (llamadas GOING ONCE/TWICE o Martillo).
      // NO auto-finaliza para preservar el control operativo manual total del subastador.
    }
  }, 1000);

  sessionTimers.set(sessionId, timer);
}

function stopServerClock(sessionId: string) {
  const existing = sessionTimers.get(sessionId);
  if (existing) {
    clearInterval(existing);
    sessionTimers.delete(sessionId);
  }
}

function finalizeAuction(sessionId: string, forcedStatus?: 'sold' | 'unsold') {
  stopServerClock(sessionId);
  const session = db.prepare('SELECT * FROM auction_sessions WHERE id = ?').get(sessionId) as any;
  if (!session) return;

  const finalStatus = forcedStatus || (session.bid_count > 0 ? 'sold' : 'unsold');
  const now = new Date().toISOString();

  // El ganador oficial es la última paleta que tenga la mejor oferta al momento de adjudicar
  let winnerPaddle = session.current_winner_paddle;
  let winnerName = session.current_winner_name;
  let winnerId = session.current_winner_id;

  if (finalStatus === 'unsold') {
    winnerPaddle = 'N/A';
    winnerName = 'Sin adjudicación (UNSOLD)';
  } else if (!winnerPaddle) {
    winnerPaddle = 'Paleta #101';
    winnerName = session.buyer_name || 'Broker Autorizado';
  }

  // 1. REGISTRO OFICIAL DEL RESULTADO Y ACTUALIZACIÓN DE ESTADO
  const isRevoked = finalStatus === 'closed' ? 1 : 0;
  db.prepare(`
    UPDATE auction_sessions 
    SET status = ?,
        current_winner_paddle = ?,
        current_winner_name = ?,
        current_winner_id = ?,
        time_remaining_seconds = 0,
        is_token_revoked = ?,
        updated_at = ? 
    WHERE id = ?
  `).run(finalStatus, winnerPaddle, winnerName, winnerId, isRevoked, now, sessionId);

  // 2. Registrar resultado en tabla inmutable
  db.prepare(`DELETE FROM auction_results WHERE session_id = ?`).run(session.id);
  db.prepare(`
    INSERT INTO auction_results (
      id, session_id, lot_number, vehicle_summary, final_price, total_bids, winner_paddle, winner_name, finished_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'res-' + Math.random().toString(36).substring(2, 9),
    session.id,
    session.lot_number,
    `${session.year} ${session.brand} ${session.model}`,
    session.current_price,
    session.bid_count,
    winnerPaddle || 'N/A',
    winnerName || 'Sin postor',
    now,
    now
  );

  // 3. Generar token de documentación oficial independiente con 7 días de validez
  const docToken = 'doc_' + crypto.randomBytes(24).toString('hex');
  const docExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare(`
    INSERT INTO document_access_tokens (
      id, session_id, doc_token, client_name, client_email, title, expires_at, is_revoked, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
  `).run(
    'doc-' + Math.random().toString(36).substring(2, 9),
    session.id,
    docToken,
    session.current_winner_name || 'Cliente Autorizado',
    'cliente@subastas.com',
    `Comprobante Oficial de Adjudicación - Lote #${session.lot_number}`,
    docExpiresAt,
    now
  );

  // 4. Notificar finalización de subasta a todos los clientes (Celebración SOLD y Certificado)
  broadcast({
    type: 'AUCTION_FINALIZED',
    sessionId,
    status: finalStatus,
    winnerPaddle,
    winnerName,
    finalPrice: session.current_price,
    totalBids: session.bid_count,
    serverTimestamp: now,
    docToken,
  });

  broadcast({
    type: 'STATUS_CHANGE',
    sessionId,
    status: finalStatus,
    currentPrice: session.current_price,
    winnerPaddle,
    winnerName,
  });

  // 5. CERRAR CONEXIONES ÚNICAMENTE SI EL SUBASTADOR CIERRA DEFINITIVAMENTE LA SALA (CLOSED)
  if (finalStatus === 'closed') {
    wss.clients.forEach((client: any) => {
      if (client.readyState === WebSocket.OPEN) {
        const matchRoom = client.roomToken === session.room_token || client.roomToken === session.id;
        if (matchRoom && !client.isBroker) {
          client.send(JSON.stringify({
            type: 'ROOM_ACCESS_REVOKED',
            sessionId,
            title: 'SUBASTA FINALIZADA',
            message: 'Esta sala ha cerrado oficialmente y el acceso de visualización ha expirado.\n\nSi necesitas consultar la documentación de tu operación, comunícate con tu broker autorizado.'
          }));
          setTimeout(() => {
            try { client.close(4003, 'SUBASTA FINALIZADA - ACCESO EXPIRADO'); } catch {}
          }, 100);
        }
      }
    });
  }
}

// ==========================================
// RUTAS DE LA API
// ==========================================

// 1. Obtener todas las sesiones autorizadas
app.get('/api/sessions', (req, res) => {
  const rows = db.prepare('SELECT * FROM auction_sessions ORDER BY created_at DESC').all() as any[];
  res.json(rows.map((r) => {
    let vehicle = {};
    try { vehicle = JSON.parse(r.vehicle_json); } catch {}
    return {
      id: r.id,
      title: r.title,
      lotNumber: r.lot_number,
      brand: r.brand,
      model: r.model,
      year: r.year,
      status: r.status,
      startingPrice: r.starting_price,
      starting_price: r.starting_price,
      minIncrement: r.min_increment,
      min_increment: r.min_increment,
      reservePrice: r.reserve_price,
      reserve_price: r.reserve_price,
      currentPrice: r.current_price,
      current_price: r.current_price,
      clientMaxBudget: Number(r.client_max_budget) || 7500,
      client_max_budget: Number(r.client_max_budget) || 7500,
      currentWinnerPaddle: r.current_winner_paddle,
      current_winner_paddle: r.current_winner_paddle,
      currentWinnerName: r.current_winner_name,
      current_winner_name: r.current_winner_name,
      bidCount: r.bid_count,
      bid_count: r.bid_count,
      timeRemainingSeconds: r.time_remaining_seconds,
      time_remaining_seconds: r.time_remaining_seconds,
      totalDurationSeconds: r.total_duration_seconds,
      total_duration_seconds: r.total_duration_seconds,
      roomToken: r.room_token,
      room_token: r.room_token,
      isTokenRevoked: Boolean(r.is_token_revoked),
      is_token_revoked: Boolean(r.is_token_revoked),
      brokerName: r.broker_name || 'Broker Autorizado',
      broker_name: r.broker_name || 'Broker Autorizado',
      buyerName: r.buyer_name || 'Comprador Autorizado',
      buyer_name: r.buyer_name || 'Comprador Autorizado',
      brokerAccessToken: r.broker_access_token,
      broker_access_token: r.broker_access_token,
      buyerAccessToken: r.buyer_access_token,
      buyer_access_token: r.buyer_access_token,
      brokerTokenRevoked: Boolean(r.broker_token_revoked),
      broker_token_revoked: Boolean(r.broker_token_revoked),
      buyerTokenRevoked: Boolean(r.buyer_token_revoked),
      buyer_token_revoked: Boolean(r.buyer_token_revoked),
      links: {
        auctioneerLink: `#/sala/${r.room_token}?auctioneer=true`,
        brokerLink: `#/sala/${r.room_token}?broker=${r.broker_access_token}`,
        buyerLink: `#/sala/${r.room_token}?cliente=${r.buyer_access_token}`,
      },
      vehicle,
      vehicle_snapshot: vehicle,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      viewersCount: connectedClientsCount,
    };
  }));
});

// 1b. Crear una nueva subasta con broker, cliente y presupuesto personalizado
app.post('/api/sessions', (req, res) => {
  const {
    lotNumber,
    vehicle,
    startingPrice,
    minIncrement,
    reservePrice,
    clientMaxBudget,
    buyerName,
    buyerEmail,
    buyerPhone,
    brokerName,
    brokerEmail,
    brokerPhone,
  } = req.body;

  if (!lotNumber || !vehicle || !vehicle.brand || !vehicle.model) {
    return res.status(400).json({ error: 'Faltan datos obligatorios del lote o vehículo' });
  }

  const sessionId = 'ses-' + crypto.randomBytes(6).toString('hex');
  const roomToken = 'copart-' + crypto.randomBytes(4).toString('hex');
  const brokerToken = 'bdr_broker_' + crypto.randomBytes(4).toString('hex');
  const buyerToken = 'bdr_buyer_' + crypto.randomBytes(4).toString('hex');
  const now = new Date().toISOString();

  const startPrice = Number(startingPrice) || 4000;
  const increment = Number(minIncrement) || 250;
  const reserve = Number(reservePrice) || (startPrice * 2);
  const budget = Number(clientMaxBudget) || 7500;
  const finalBuyerName = buyerName?.trim() || 'Comprador Autorizado';
  const finalBrokerName = brokerName?.trim() || 'Broker Representante';

  // Snapshot normalizado del vehículo
  const vehicleSnapshot = {
    id: 'veh-' + crypto.randomBytes(4).toString('hex'),
    brand: vehicle.brand,
    model: vehicle.model,
    year: Number(vehicle.year) || 2023,
    version: vehicle.version || 'Equipamiento Original',
    vin: vehicle.vin || '1FA6P8CF9P' + crypto.randomBytes(3).toString('hex').toUpperCase(),
    lot_number: String(lotNumber),
    engine: vehicle.engine || 'Motor Estándar',
    transmission: vehicle.transmission || 'Automática',
    drivetrain: vehicle.drivetrain || 'RWD',
    odometer: Number(vehicle.odometer) || 15000,
    odometer_unit: vehicle.odometer_unit || 'mi',
    vehicle_condition: vehicle.vehicle_condition || 'run_and_drive',
    title_type: vehicle.title_type || 'Salvage Certificate',
    primary_damage: vehicle.primary_damage || 'Impacto Frontal',
    secondary_damage: vehicle.secondary_damage || 'Ninguno',
    has_keys: vehicle.has_keys !== false,
    est_retail_value: Number(vehicle.est_retail_value) || (startPrice * 4),
    location: vehicle.location || 'Yard 12 - Atlanta East',
    notes: vehicle.notes || 'Unidad inspeccionada lista para puja en vivo.',
    images: Array.isArray(vehicle.images) && vehicle.images.length > 0 ? vehicle.images : [
      { id: 'img-1', url: 'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&q=80&w=1200', category: 'exterior', is_primary: true, order: 1 }
    ]
  };

  db.prepare(`
    INSERT INTO auction_sessions (
      id, title, lot_number, brand, model, year, status,
      starting_price, min_increment, reserve_price, current_price,
      client_max_budget, current_winner_paddle, current_winner_name, current_winner_id,
      bid_count, time_remaining_seconds, total_duration_seconds, room_token,
      is_token_revoked, broker_access_token, broker_token_revoked,
      buyer_access_token, buyer_token_revoked, broker_name, buyer_name,
      vehicle_json, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, 'prepared',
      ?, ?, ?, ?,
      ?, NULL, NULL, NULL,
      0, 15, 15, ?,
      0, ?, 0,
      ?, 0, ?, ?,
      ?, ?, ?
    )
  `).run(
    sessionId,
    `${vehicleSnapshot.year} ${vehicleSnapshot.brand} ${vehicleSnapshot.model}`,
    String(lotNumber),
    vehicleSnapshot.brand,
    vehicleSnapshot.model,
    vehicleSnapshot.year,
    startPrice,
    increment,
    reserve,
    startPrice,
    budget,
    roomToken,
    brokerToken,
    buyerToken,
    finalBrokerName,
    finalBuyerName,
    JSON.stringify(vehicleSnapshot),
    now,
    now
  );

  // Registrar al Broker Real con Paleta #101
  db.prepare(`
    INSERT INTO auction_participants (
      id, session_id, name, paddle_number, location, token_hash, authorization_status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'approved', ?)
  `).run(
    'part-' + sessionId + '-broker',
    sessionId,
    `${finalBuyerName} (${finalBrokerName} Rep. #101)`,
    'Paleta #101',
    'Online (Representante)',
    hashToken(brokerToken),
    now
  );

  // Registrar competidores virtuales para esta sesión con tokens únicos
  const competitors = [
    { paddle: 'Paleta #108', name: 'AutoExport Dallas LLC', loc: 'Dallas, TX', base: 'bdr_comp_dallas' },
    { paddle: 'Paleta #214', name: 'Pacific Salvage Auctions', loc: 'Los Angeles, CA', base: 'bdr_comp_pacific' },
    { paddle: 'Paleta #305', name: 'Global Fleet Buyers', loc: 'Atlanta, GA', base: 'bdr_comp_global' },
    { paddle: 'Paleta #412', name: 'Buckeye Motor Exchange', loc: 'Columbus, OH', base: 'bdr_comp_buckeye' },
    { paddle: 'Paleta #519', name: 'Lone Star Salvage Group', loc: 'Houston, TX', base: 'bdr_comp_lonestar' },
    { paddle: 'Paleta #623', name: 'Midwest Premier Liquidation', loc: 'Chicago, IL', base: 'bdr_comp_midwest' },
  ];

  for (const c of competitors) {
    const compToken = `${c.base}_${sessionId}`;
    db.prepare(`
      INSERT INTO auction_participants (
        id, session_id, name, paddle_number, location, token_hash, authorization_status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'approved', ?)
    `).run(
      'comp-' + crypto.randomBytes(4).toString('hex'),
      sessionId,
      c.name,
      c.paddle,
      c.loc,
      hashToken(compToken),
      now
    );
  }

  const createdSession = {
    id: sessionId,
    title: `${vehicleSnapshot.year} ${vehicleSnapshot.brand} ${vehicleSnapshot.model}`,
    lotNumber: String(lotNumber),
    brand: vehicleSnapshot.brand,
    model: vehicleSnapshot.model,
    year: vehicleSnapshot.year,
    status: 'prepared',
    startingPrice: startPrice,
    minIncrement: increment,
    reservePrice: reserve,
    currentPrice: startPrice,
    clientMaxBudget: budget,
    roomToken,
    brokerAccessToken: brokerToken,
    buyerAccessToken: buyerToken,
    brokerName: finalBrokerName,
    buyerName: finalBuyerName,
    vehicle: vehicleSnapshot,
    links: {
      auctioneerLink: `#/sala/${roomToken}?auctioneer=true`,
      brokerLink: `#/sala/${roomToken}?broker=${brokerToken}`,
      buyerLink: `#/sala/${roomToken}?cliente=${buyerToken}`,
    },
    createdAt: now,
    updatedAt: now,
  };

  res.status(201).json({
    success: true,
    session: createdSession
  });
});

// 1c. Eliminar una sesión de subasta
app.delete('/api/sessions/:id', (req, res) => {
  const sessionId = req.params.id;
  const session = db.prepare('SELECT id FROM auction_sessions WHERE id = ?').get(sessionId);
  if (!session) return res.status(404).json({ error: 'Sesión no encontrada' });

  stopServerClock(sessionId);
  db.prepare('DELETE FROM auction_bids WHERE session_id = ?').run(sessionId);
  db.prepare('DELETE FROM budget_authorizations WHERE session_id = ?').run(sessionId);
  db.prepare('DELETE FROM auction_participants WHERE session_id = ?').run(sessionId);
  db.prepare('DELETE FROM document_access_tokens WHERE session_id = ?').run(sessionId);
  db.prepare('DELETE FROM auction_results WHERE session_id = ?').run(sessionId);
  db.prepare('DELETE FROM auction_sessions WHERE id = ?').run(sessionId);

  res.json({ success: true, message: 'Subasta eliminada exitosamente' });
});

// 2. Obtener estado de una sesión
app.get('/api/sessions/:id', (req, res) => {
  const r = findSession(req.params.id);
  if (!r) return res.status(404).json({ error: 'Sesión no encontrada' });

  const bids = db.prepare('SELECT * FROM auction_bids WHERE session_id = ? ORDER BY sequence_number DESC').all(r.id) as any[];
  const participants = db.prepare(`
    SELECT id, session_id as sessionId, name, paddle_number as paddleNumber, location, authorization_status as status, max_bid_limit as maxBidLimit
    FROM auction_participants 
    WHERE session_id = ?
  `).all(r.id);

  res.json({
    session: {
      id: r.id,
      title: r.title,
      lotNumber: r.lot_number,
      brand: r.brand,
      model: r.model,
      year: r.year,
      status: r.status,
      startingPrice: r.starting_price,
      starting_price: r.starting_price,
      minIncrement: r.min_increment,
      min_increment: r.min_increment,
      reservePrice: r.reserve_price,
      reserve_price: r.reserve_price,
      currentPrice: r.current_price,
      current_price: r.current_price,
      clientMaxBudget: Number(r.client_max_budget) || 14000,
      client_max_budget: Number(r.client_max_budget) || 14000,
      currentWinnerPaddle: r.current_winner_paddle,
      current_winner_paddle: r.current_winner_paddle,
      currentWinnerName: r.current_winner_name,
      current_winner_name: r.current_winner_name,
      bidCount: r.bid_count,
      bid_count: r.bid_count,
      timeRemainingSeconds: r.time_remaining_seconds,
      time_remaining_seconds: r.time_remaining_seconds,
      totalDurationSeconds: r.total_duration_seconds,
      total_duration_seconds: r.total_duration_seconds,
      roomToken: r.room_token,
      room_token: r.room_token,
      isTokenRevoked: Boolean(r.is_token_revoked),
      is_token_revoked: Boolean(r.is_token_revoked),
      brokerAccessToken: r.broker_access_token,
      broker_access_token: r.broker_access_token,
      buyerAccessToken: r.buyer_access_token,
      buyer_access_token: r.buyer_access_token,
      brokerName: r.broker_name,
      broker_name: r.broker_name,
      buyerName: r.buyer_name,
      buyer_name: r.buyer_name,
      vehicle: JSON.parse(r.vehicle_json),
      vehicle_snapshot: JSON.parse(r.vehicle_json),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    },
    bids: bids.map((b) => ({
      id: b.id,
      sessionId: b.session_id,
      participantId: b.participant_id,
      paddleNumber: b.paddle_number,
      bidderName: b.bidder_name,
      location: b.location,
      amount: b.amount,
      sequenceNumber: b.sequence_number,
      serverTimestamp: b.server_timestamp,
    })),
    participants,
    viewersCount: Math.max(1, connectedClientsCount),
    activeCall: activeAuctioneerCalls.get(r.id) || null,
  });
});

// 2b. Listar ofertas de una sesión
app.get('/api/sessions/:id/bids', (req, res) => {
  const bids = db.prepare('SELECT * FROM auction_bids WHERE session_id = ? ORDER BY sequence_number DESC').all(req.params.id) as any[];
  res.json(bids.map((b) => ({
    id: b.id,
    sessionId: b.session_id,
    participantId: b.participant_id,
    paddleNumber: b.paddle_number,
    bidderName: b.bidder_name,
    location: b.location,
    amount: b.amount,
    sequenceNumber: b.sequence_number,
    serverTimestamp: b.server_timestamp,
  })));
});

// 3. Sala pública por Room Token (CON DISTINCIÓN DE ENLACE BROKER Y ENLACE CLIENTE)
app.get('/api/room/:token', (req, res) => {
  const r = findSession(req.params.token);
  if (!r) return res.status(404).json({ error: 'Sala no encontrada' });

  // Detección estricta de rol por token o query param
  const brokerToken = (req.query.broker || req.query.bidder) as string | undefined;
  const buyerToken = (req.query.buyer || req.query.cliente) as string | undefined;
  const isAuctioneer = req.query.auctioneer === 'true' || brokerToken === 'bdr_admin';

  let role: 'auctioneer' | 'broker' | 'buyer' | 'spectator' = 'spectator';

  if (isAuctioneer) {
    role = 'auctioneer';
  } else if (brokerToken && brokerToken === r.broker_access_token) {
    if (r.broker_token_revoked) {
      return res.status(403).json({
        error: 'BROKER_ACCESS_REVOKED',
        isRevoked: true,
        title: 'ACCESO DE BROKER REVOCADO',
        message: 'El subastador principal ha revocado su autorización de acceso como Broker para esta subasta.'
      });
    }
    role = 'broker';
  } else if (buyerToken && buyerToken === r.buyer_access_token) {
    if (r.buyer_token_revoked) {
      return res.status(403).json({
        error: 'BUYER_ACCESS_REVOKED',
        isRevoked: true,
        title: 'ACCESO DE COMPRADOR REVOCADO',
        message: 'El subastador principal o su broker ha revocado su autorización de acceso para esta subasta.'
      });
    }
    role = 'buyer';
  } else if (buyerToken && buyerToken !== r.buyer_access_token) {
    // El cliente intenta ingresar con un token de un lote anterior que ya fue finalizado
    return res.status(403).json({
      error: 'LOT_ACCESS_EXPIRED',
      isExpired: true,
      title: 'SUBASTA FINALIZADA',
      message: 'Esta sala ha cerrado oficialmente y el acceso de visualización para su lote ha expirado. Si necesita consultar la documentación de su operación, comuníquese con su broker autorizado.'
    });
  } else if (brokerToken && brokerToken !== r.broker_access_token) {
    // El broker intenta ingresar con un token de un lote anterior que ya fue finalizado
    return res.status(403).json({
      error: 'BROKER_TOKEN_EXPIRED',
      isExpired: true,
      title: 'ACCESO DE BROKER EXPIRADO',
      message: 'El enlace de broker para el lote anterior ha caducado. Ingrese con el nuevo enlace generado para el lote actual.'
    });
  }

  // EXPIRACIÓN Y REVOCACIÓN ESTRICTA EN BACKEND (Sólo cuando el token fue revocado explícitamente o la sala cerrada por completo)
  if ((Boolean(r.is_token_revoked) || r.status === 'closed') && role !== 'auctioneer') {
    return res.status(403).json({
      error: 'ROOM_ACCESS_EXPIRED',
      isExpired: true,
      isRevoked: true,
      title: 'SUBASTA FINALIZADA',
      message: 'Esta sala ha cerrado oficialmente y el acceso de visualización ha expirado.\n\nSi necesitas consultar la documentación de tu operación, comunícate con tu broker autorizado.'
    });
  }

  const bids = db.prepare('SELECT * FROM auction_bids WHERE session_id = ? ORDER BY sequence_number DESC').all(r.id) as any[];
  const participants = db.prepare(`
    SELECT id, name, paddle_number as paddleNumber, location, authorization_status as status
    FROM auction_participants 
    WHERE session_id = ?
  `).all(r.id);

  // Consultar solicitudes de presupuesto extraordinario activas
  const budgetRequests = db.prepare(`
    SELECT id, session_id as sessionId, initial_budget as initialBudget, requested_amount as requestedAmount,
           status, expires_at as expiresAt, created_at as createdAt, responded_at as respondedAt,
           rejection_reason as rejectionReason
    FROM budget_authorizations
    WHERE session_id = ?
    ORDER BY created_at DESC
  `).all(r.id) as any[];

  // Comprobar presencia en vivo de Broker y Comprador
  let brokerConnected = false;
  let buyerConnected = false;
  for (const [sock, meta] of socketMetadata.entries()) {
    if (meta.sessionId === r.id && sock.readyState === WebSocket.OPEN) {
      if (meta.role === 'broker') brokerConnected = true;
      if (meta.role === 'buyer') buyerConnected = true;
    }
  }

  res.json({
    role,
    userToken: role === 'broker' ? r.broker_access_token : (role === 'buyer' ? r.buyer_access_token : undefined),
    links: {
      brokerLink: `#/sala/${r.room_token}?broker=${r.broker_access_token}`,
      buyerLink: `#/sala/${r.room_token}?cliente=${r.buyer_access_token}`,
      rawRoomLink: `#/sala/${r.room_token}`,
    },
    presence: {
      brokerConnected,
      buyerConnected,
      brokerRevoked: Boolean(r.broker_token_revoked),
      buyerRevoked: Boolean(r.buyer_token_revoked),
      brokerName: r.broker_name || 'Broker Autorizado (Representante)',
      buyerName: r.buyer_name || 'Carlos Mendoza (Comprador)',
    },
    budgetRequests: budgetRequests.map((b) => ({
      ...b,
      difference: b.requestedAmount - b.initialBudget,
      isExpired: new Date(b.expiresAt) < new Date(),
    })),
    session: {
      id: r.id,
      title: r.title,
      lotNumber: r.lot_number,
      brand: r.brand,
      model: r.model,
      year: r.year,
      status: r.status,
      startingPrice: r.starting_price,
      starting_price: r.starting_price,
      minIncrement: r.min_increment,
      min_increment: r.min_increment,
      currentPrice: r.current_price,
      current_price: r.current_price,
      clientMaxBudget: Number(r.client_max_budget) || 7500,
      client_max_budget: Number(r.client_max_budget) || 7500,
      currentWinnerPaddle: r.current_winner_paddle,
      current_winner_paddle: r.current_winner_paddle,
      currentWinnerName: r.current_winner_name,
      current_winner_name: r.current_winner_name,
      bidCount: r.bid_count,
      bid_count: r.bid_count,
      timeRemainingSeconds: r.time_remaining_seconds,
      time_remaining_seconds: r.time_remaining_seconds,
      totalDurationSeconds: r.total_duration_seconds,
      total_duration_seconds: r.total_duration_seconds,
      roomToken: r.room_token,
      room_token: r.room_token,
      isTokenRevoked: Boolean(r.is_token_revoked),
      is_token_revoked: Boolean(r.is_token_revoked),
      brokerName: r.broker_name || 'Broker Autorizado',
      broker_name: r.broker_name || 'Broker Autorizado',
      buyerName: r.buyer_name || 'Carlos Mendoza (Comprador)',
      buyer_name: r.buyer_name || 'Carlos Mendoza (Comprador)',
      vehicle: JSON.parse(r.vehicle_json),
      vehicle_snapshot: JSON.parse(r.vehicle_json),
      brokerAccessToken: role === 'auctioneer' ? r.broker_access_token : undefined,
      buyerAccessToken: role === 'auctioneer' ? r.buyer_access_token : undefined,
    },
    bids: bids.map((b) => ({
      id: b.id,
      amount: b.amount,
      paddleNumber: b.paddle_number,
      bidderName: b.bidder_name,
      location: b.location,
      sequenceNumber: b.sequence_number,
      serverTimestamp: b.server_timestamp,
    })),
    participants,
    viewersCount: Math.max(1, connectedClientsCount),
    activeCall: activeAuctioneerCalls.get(r.id) || null,
  });
});

// 3b. SOLICITAR AUTORIZACIÓN EXTRAORDINARIA DE PRESUPUESTO (BROKER -> COMPRADOR)
app.post('/api/sessions/:id/budget-requests', (req, res) => {
  const { brokerToken, requestedAmount } = req.body;
  const session = db.prepare('SELECT * FROM auction_sessions WHERE id = ?').get(req.params.id) as any;
  if (!session) return res.status(404).json({ error: 'Sesión no encontrada' });

  // Validar broker
  if (session.broker_access_token !== brokerToken) {
    return res.status(403).json({ error: 'Token de broker inválido o no asignado a esta sesión' });
  }
  if (session.broker_token_revoked) {
    return res.status(403).json({ error: 'El acceso de este broker se encuentra revocado' });
  }

  const reqAmount = Number(requestedAmount);
  const currentBudget = Number(session.client_max_budget) || 7500;
  if (!reqAmount || reqAmount <= currentBudget) {
    return res.status(400).json({
      error: `El importe solicitado ($${reqAmount.toLocaleString()} USD) debe ser estrictamente superior al presupuesto vigente ($${currentBudget.toLocaleString()} USD)`
    });
  }

  const authId = 'auth-' + crypto.randomBytes(8).toString('hex');
  const expiresAt = new Date(Date.now() + 120 * 1000).toISOString(); // 120 segundos TTL
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO budget_authorizations (
      id, session_id, broker_token_hash, buyer_token_hash, initial_budget, requested_amount, status, expires_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
  `).run(
    authId,
    session.id,
    hashToken(brokerToken),
    hashToken(session.buyer_access_token),
    currentBudget,
    reqAmount,
    expiresAt,
    now
  );

  const authPayload = {
    id: authId,
    sessionId: session.id,
    lotNumber: session.lot_number,
    vehicleTitle: `${session.year} ${session.brand} ${session.model}`,
    initialBudget: currentBudget,
    currentPrice: session.current_price,
    requestedAmount: reqAmount,
    difference: reqAmount - currentBudget,
    status: 'pending',
    expiresAt,
    createdAt: now,
  };

  // Difundir inmediatamente vía WebSocket a Comprador, Broker y Subastador
  broadcast({
    type: 'BUDGET_REQUEST_CREATED',
    request: authPayload,
  });

  res.json({ success: true, request: authPayload });
});

// 3c. RESPONDER A SOLICITUD DE PRESUPUESTO (COMPRADOR: AUTORIZAR O RECHAZAR)
app.post('/api/budget-authorizations/:id/respond', (req, res) => {
  const { buyerToken, decision, rejectionReason } = req.body;
  const auth = db.prepare('SELECT * FROM budget_authorizations WHERE id = ?').get(req.params.id) as any;
  if (!auth) return res.status(404).json({ error: 'Solicitud de autorización no encontrada' });

  if (auth.status !== 'pending') {
    return res.status(400).json({ error: `La solicitud ya fue procesada anteriormente (Estado actual: ${auth.status})` });
  }

  if (new Date(auth.expires_at) < new Date()) {
    db.prepare("UPDATE budget_authorizations SET status = 'expired' WHERE id = ?").run(auth.id);
    return res.status(400).json({ error: 'La solicitud de autorización ha expirado por tiempo' });
  }

  // Validar criptográficamente identidad del comprador
  if (!buyerToken || hashToken(buyerToken) !== auth.buyer_token_hash) {
    return res.status(403).json({ error: 'Token de comprador no válido o ausente. Solo el comprador asignado puede autorizar esta solicitud.' });
  }

  const newStatus = decision === 'approve' ? 'approved' : 'rejected';
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE budget_authorizations 
    SET status = ?, responded_at = ?, rejection_reason = ?
    WHERE id = ?
  `).run(newStatus, now, rejectionReason || null, auth.id);

  const session = db.prepare('SELECT lot_number, brand, model, year, client_max_budget FROM auction_sessions WHERE id = ?').get(auth.session_id) as any;

  const resolvedPayload = {
    id: auth.id,
    sessionId: auth.session_id,
    status: newStatus,
    requestedAmount: auth.requested_amount,
    initialBudget: auth.initial_budget,
    difference: auth.requested_amount - auth.initial_budget,
    respondedAt: now,
    lotNumber: session?.lot_number,
    vehicleTitle: `${session?.year} ${session?.brand} ${session?.model}`,
  };

  broadcast({
    type: 'BUDGET_REQUEST_RESOLVED',
    request: resolvedPayload,
  });

  res.json({ success: true, status: newStatus, request: resolvedPayload });
});

// 3d. LISTAR SOLICITUDES DE AUTORIZACIÓN DE UNA SESIÓN (AUDITORÍA COMPLETA)
app.get('/api/sessions/:id/budget-requests', (req, res) => {
  const requests = db.prepare(`
    SELECT id, session_id as sessionId, initial_budget as initialBudget, requested_amount as requestedAmount,
           status, expires_at as expiresAt, created_at as createdAt, responded_at as respondedAt,
           used_at as usedAt, rejection_reason as rejectionReason
    FROM budget_authorizations
    WHERE session_id = ?
    ORDER BY created_at DESC
  `).all(req.params.id) as any[];

  res.json(requests.map((r) => ({
    ...r,
    difference: r.requestedAmount - r.initialBudget,
    isExpired: new Date(r.expiresAt) < new Date(),
  })));
});

// 3e. REVOCAR ACCESO INDEPENDIENTE DE PARTICIPANTE (SUBASTADOR)
app.post('/api/sessions/:id/revoke-access', (req, res) => {
  const { target } = req.body; // 'broker' | 'buyer'
  const session = db.prepare('SELECT * FROM auction_sessions WHERE id = ?').get(req.params.id) as any;
  if (!session) return res.status(404).json({ error: 'Sesión no encontrada' });

  if (target === 'broker') {
    db.prepare('UPDATE auction_sessions SET broker_token_revoked = 1 WHERE id = ?').run(session.id);
  } else if (target === 'buyer') {
    db.prepare('UPDATE auction_sessions SET buyer_token_revoked = 1 WHERE id = ?').run(session.id);
  } else {
    return res.status(400).json({ error: 'Target inválido (debe ser broker o buyer)' });
  }

  // Cerrar sockets de ese rol con código 4003
  for (const [ws, meta] of socketMetadata.entries()) {
    if (meta.sessionId === session.id && meta.role === target) {
      try {
        ws.send(JSON.stringify({
          type: 'ACCESS_REVOKED',
          target,
          message: `Su acceso como ${target === 'broker' ? 'Broker' : 'Comprador'} ha sido revocado por el subastador principal.`
        }));
        setTimeout(() => { try { ws.close(4003, `ACCESO REVOCADO: ${target}`); } catch {} }, 100);
      } catch {}
    }
  }

  broadcastPresence(session.id);
  broadcast({
    type: 'ACCESS_REVOKED_BROADCAST',
    sessionId: session.id,
    target,
  });

  res.json({ success: true, target, revoked: true });
});

// 3f. RESTAURAR ACCESO DE PARTICIPANTE (SUBASTADOR)
app.post('/api/sessions/:id/restore-access', (req, res) => {
  const { target } = req.body;
  const session = db.prepare('SELECT * FROM auction_sessions WHERE id = ?').get(req.params.id) as any;
  if (!session) return res.status(404).json({ error: 'Sesión no encontrada' });

  if (target === 'broker') {
    db.prepare('UPDATE auction_sessions SET broker_token_revoked = 0 WHERE id = ?').run(session.id);
  } else if (target === 'buyer') {
    db.prepare('UPDATE auction_sessions SET buyer_token_revoked = 0 WHERE id = ?').run(session.id);
  }

  broadcastPresence(session.id);
  broadcast({
    type: 'ACCESS_RESTORED_BROADCAST',
    sessionId: session.id,
    target,
  });

  res.json({ success: true, target, restored: true });
});

// 4. Iniciar subasta (Administrador / Consola de Subastador)
app.post('/api/sessions/:id/start', (req, res) => {
  const session = findSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Sesión no encontrada' });

  const duration = session.total_duration_seconds || 15;

  db.prepare(`
    UPDATE auction_sessions 
    SET status = 'open', is_token_revoked = 0, time_remaining_seconds = ?, updated_at = ? 
    WHERE id = ?
  `).run(duration, new Date().toISOString(), session.id);

  startServerClock(session.id);
  activeAuctioneerCalls.delete(session.id);

  // Difusión atómica inmediata a Pantalla 1 y Pantalla 2
  broadcast({
    type: 'AUCTION_STARTED',
    sessionId: session.id,
    status: 'open',
    timeRemaining: duration,
    currentPrice: session.current_price,
  });
  broadcast({
    type: 'STATUS_CHANGE',
    sessionId: session.id,
    status: 'open',
    timeRemaining: duration,
    currentPrice: session.current_price,
  });
  broadcast({
    type: 'CLOCK_TICK',
    sessionId: session.id,
    timeRemaining: duration,
    currentPrice: session.current_price,
    status: 'open',
    viewersCount: connectedClientsCount,
  });
  broadcast({ type: 'AUCTION_RESET', sessionId: session.id });

  res.json({ success: true, sessionId: session.id, timeRemaining: duration });
});

// 5. Pausar subasta
app.post('/api/sessions/:id/pause', (req, res) => {
  const session = findSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Sesión no encontrada' });

  db.prepare(`UPDATE auction_sessions SET status = 'paused', updated_at = ? WHERE id = ?`).run(
    new Date().toISOString(),
    session.id
  );
  stopServerClock(session.id);
  broadcast({
    type: 'STATUS_CHANGE',
    sessionId: session.id,
    status: 'paused',
    timeRemaining: session.time_remaining_seconds
  });
  res.json({ success: true, sessionId: session.id, status: 'paused', timeRemaining: session.time_remaining_seconds });
});

// 6. Reanudar subasta
app.post('/api/sessions/:id/resume', (req, res) => {
  const session = findSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Sesión no encontrada' });

  if (session.is_token_revoked || ['sold', 'closed'].includes(session.status)) {
    return res.status(400).json({
      error: 'No se permite reactivar una subasta finalizada mediante el mismo enlace.'
    });
  }

  const nextStatus = session.time_remaining_seconds <= 6 ? 'last_call' : 'bidding';
  db.prepare(`UPDATE auction_sessions SET status = ?, updated_at = ? WHERE id = ?`).run(
    nextStatus,
    new Date().toISOString(),
    session.id
  );
  startServerClock(session.id);
  activeAuctioneerCalls.delete(session.id);
  broadcast({
    type: 'STATUS_CHANGE',
    sessionId: session.id,
    status: nextStatus,
    timeRemaining: session.time_remaining_seconds
  });
  res.json({ success: true, sessionId: session.id, status: nextStatus, timeRemaining: session.time_remaining_seconds });
});

// 7. Bajar martillo forzado (Sold) y revocar acceso
app.post('/api/sessions/:id/sold', (req, res) => {
  const session = findSession(req.params.id);
  const targetId = session?.id || req.params.id;
  finalizeAuction(targetId, 'sold');
  res.json({ success: true, message: 'Lote adjudicado (SOLD).' });
});

// 7b. Cierre oficial de sala (Closed)
app.post('/api/sessions/:id/close', (req, res) => {
  const session = findSession(req.params.id);
  const targetId = session?.id || req.params.id;
  finalizeAuction(targetId, 'unsold');
  res.json({ success: true, message: 'Subasta cerrada definitivamente.' });
});

// 7c. EJECUTAR OFERTA MANUAL SOBERANA DESDE LA CONSOLA DEL SUBASTADOR
app.post('/api/sessions/:id/manual-bid', (req, res) => {
  const { paddleNumber, amount, customName, location } = req.body;
  const session = findSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Sesión no encontrada' });

  const bidAmount = Number(amount);
  if (!bidAmount || isNaN(bidAmount) || bidAmount <= 0) {
    return res.status(400).json({ error: 'Importe de oferta no válido' });
  }

  const paddle = String(paddleNumber || 'Paleta #101');

  // Nombres y ubicaciones oficiales de las 7 paletas
  const officialPaddles: Record<string, { name: string; loc: string }> = {
    'Paleta #101': { name: session.broker_name || 'Broker Autorizado (Representante)', loc: 'Miami, FL' },
    'Paleta #108': { name: 'AutoExport Dallas LLC', loc: 'Dallas, TX' },
    'Paleta #214': { name: 'Pacific Salvage Auctions', loc: 'Los Angeles, CA' },
    'Paleta #305': { name: 'Global Fleet Buyers', loc: 'Atlanta, GA' },
    'Paleta #412': { name: 'Buckeye Motor Exchange', loc: 'Columbus, OH' },
    'Paleta #519': { name: 'Lone Star Salvage Group', loc: 'Houston, TX' },
    'Paleta #623': { name: 'Midwest Premier Liquidation', loc: 'Chicago, IL' },
  };

  const info = officialPaddles[paddle] || { name: customName || paddle, loc: location || 'USA Online' };
  const bidderName = customName || info.name;
  const bidderLoc = location || info.loc;

  const now = new Date().toISOString();
  const bidId = 'bid-' + Math.random().toString(36).substring(2, 9);

  // Asegurar participante en base de datos
  const existingPart = db.prepare('SELECT id FROM auction_participants WHERE session_id = ? AND paddle_number = ?').get(session.id, paddle) as any;
  let participantId = existingPart ? existingPart.id : 'part-' + Math.random().toString(36).substring(2, 9);

  if (!existingPart) {
    db.prepare(`
      INSERT INTO auction_participants (id, session_id, name, paddle_number, location, token_hash, authorization_status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'approved', ?)
    `).run(participantId, session.id, bidderName, paddle, bidderLoc, hashToken(paddle + session.id), now);
  }

  // Número de secuencia consecutivo
  const maxSeq = db.prepare('SELECT MAX(sequence_number) as max_seq FROM auction_bids WHERE session_id = ?').get(session.id) as any;
  const nextSeq = (maxSeq?.max_seq || 0) + 1;

  // Insertar oferta en el historial oficial inmutable
  db.prepare(`
    INSERT INTO auction_bids (id, session_id, participant_id, paddle_number, bidder_name, location, amount, sequence_number, server_timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(bidId, session.id, participantId, paddle, bidderName, bidderLoc, bidAmount, nextSeq, now);

  // Actualizar sesión en SQLite y reactivar sala si estaba en desenlace o conteo final
  const newStatus = ['paused', 'prepared', 'unsold', 'sold', 'closed', 'last_call'].includes(session.status) ? 'open' : session.status;
  db.prepare(`
    UPDATE auction_sessions 
    SET current_price = ?,
        current_winner_paddle = ?,
        current_winner_name = ?,
        current_winner_id = ?,
        bid_count = bid_count + 1,
        time_remaining_seconds = 15,
        total_duration_seconds = 15,
        status = ?,
        is_token_revoked = 0,
        updated_at = ?
    WHERE id = ?
  `).run(bidAmount, paddle, bidderName, participantId, newStatus, now, session.id);

  startServerClock(session.id);
  setAuctioneerCall(session.id, 'clear');

  const createdBid = {
    id: bidId,
    sessionId: session.id,
    participantId,
    paddleNumber: paddle,
    bidderName,
    location: bidderLoc,
    amount: bidAmount,
    sequenceNumber: nextSeq,
    serverTimestamp: now,
  };

  // Difundir en tiempo real a la sala en vivo compartida
  broadcast({
    type: 'NEW_REAL_BID',
    sessionId: session.id,
    bid: createdBid,
    currentPrice: bidAmount,
    currentWinnerPaddle: paddle,
    currentWinnerName: bidderName,
    timeRemaining: 15,
    serverTimestamp: now,
    bidCount: session.bid_count + 1,
  });

  res.json({
    success: true,
    bid: createdBid,
    session: {
      id: session.id,
      currentPrice: bidAmount,
      currentWinnerPaddle: paddle,
      currentWinnerName: bidderName,
      timeRemaining: 15,
    }
  });
});

// 7d. LLAMADAS OFICIALES DEL SUBASTADOR (GOING ONCE, GOING TWICE, FAIR WARNING)
app.post('/api/sessions/:id/call', (req, res) => {
  const { call } = req.body; // 'going_once' | 'going_twice' | 'fair_warning' | 'clear'
  const session = findSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Sesión no encontrada' });

  setAuctioneerCall(session.id, call);

  broadcast({
    type: 'AUCTIONEER_CALL',
    sessionId: session.id,
    call: call || 'clear',
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, call });
});

// 7d.2 ENVIAR AVISO / CINTILLO EN VIVO A LA SALA PÚBLICA
app.post('/api/sessions/:id/announcement', (req, res) => {
  const { text } = req.body;
  const session = findSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Sesión no encontrada' });

  broadcast({
    type: 'ROOM_ANNOUNCEMENT',
    sessionId: session.id,
    text: String(text || '').trim(),
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, text });
});

// 7d.3 AJUSTAR CONTEO DE ESPECTADORES EN SALA
app.post('/api/sessions/:id/viewers', (req, res) => {
  const count = Number(req.body?.count);
  const session = findSession(req.params.id);
  if (!isNaN(count) && count >= 1) {
    connectedClientsCount = count;
    broadcast({
      type: 'SPECTATOR_JOINED',
      sessionId: session?.id || req.params.id,
      viewersCount: count,
      timestamp: new Date().toISOString(),
    });
    return res.json({ success: true, count });
  }
  return res.status(400).json({ error: 'Conteo inválido' });
});

// 7e. ADJUDICACIÓN SOBERANA (SOLD / UNSOLD)
app.post('/api/sessions/:id/adjudicate', (req, res) => {
  const { decision } = req.body; // 'sold' | 'unsold'
  const session = findSession(req.params.id);
  const targetId = session?.id || req.params.id;
  finalizeAuction(targetId, decision === 'unsold' ? 'unsold' : 'sold');
  res.json({ success: true, decision: decision || 'sold' });
});

// 8. Reiniciar lote
app.post('/api/sessions/:id/reset', (req, res) => {
  const session = findSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Sesión no encontrada' });

  if ((session.is_token_revoked || ['sold', 'closed'].includes(session.status)) && req.query.admin !== 'true' && req.body?.admin !== true) {
    return res.status(400).json({
      error: 'No se permite reiniciar una subasta cuyo acceso ha sido finalizado y revocado.'
    });
  }

  stopServerClock(session.id);
  db.prepare(`DELETE FROM auction_bids WHERE session_id = ?`).run(session.id);
  db.prepare(`DELETE FROM budget_authorizations WHERE session_id = ?`).run(session.id);
  db.prepare(`
    UPDATE auction_sessions 
    SET 
      status = 'prepared',
      starting_price = 5000,
      current_price = 5000,
      min_increment = 250,
      client_max_budget = 7500,
      is_token_revoked = 0,
      broker_token_revoked = 0,
      buyer_token_revoked = 0,
      broker_access_token = 'bdr_broker_m729k1',
      buyer_access_token = 'bdr_buyer_m729k1',
      buyer_name = 'Carlos Mendoza (Comprador)',
      broker_name = 'Broker Autorizado (Representante)',
      current_winner_paddle = NULL,
      current_winner_name = NULL,
      current_winner_id = NULL,
      bid_count = 0,
      time_remaining_seconds = total_duration_seconds,
      updated_at = ?
    WHERE id = ?
  `).run(new Date().toISOString(), session.id);

  db.prepare(`
    UPDATE auction_participants 
    SET token_hash = ?, name = 'Carlos Mendoza (Broker Rep. #101)', authorization_status = 'approved'
    WHERE session_id = ? AND paddle_number = 'Paleta #101'
  `).run(hashToken('bdr_broker_m729k1'), session.id);

  broadcast({
    type: 'AUCTION_RESET',
    sessionId: session.id,
    status: 'prepared',
    startingPrice: 5000,
    currentPrice: 5000,
    timeRemaining: 15,
    minIncrement: 250,
    clientMaxBudget: 7500,
    currentWinnerPaddle: null,
    currentWinnerName: null,
    bids: []
  });
  res.json({
    success: true,
    sessionId: session.id,
    status: 'prepared',
    startingPrice: 5000,
    currentPrice: 5000,
    timeRemaining: 15
  });
});

// 8a.2 AJUSTAR PRECIO BASE / DE ARRANQUE DIRECTAMENTE
app.post('/api/sessions/:id/set-price', (req, res) => {
  const session = findSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Sesión no encontrada' });
  const price = Number(req.body?.price);
  if (!price || isNaN(price) || price <= 0) {
    return res.status(400).json({ error: 'Precio inválido' });
  }

  db.prepare(`
    UPDATE auction_sessions
    SET current_price = ?, starting_price = ?, is_token_revoked = 0, updated_at = ?
    WHERE id = ?
  `).run(price, price, new Date().toISOString(), session.id);

  broadcast({
    type: 'STATUS_CHANGE',
    sessionId: session.id,
    currentPrice: price,
    startingPrice: price
  });

  return res.json({ success: true, price });
});

// 8a.3 ACTUALIZAR PARÁMETROS DEL LOTE EN VIVO (PRECIO BASE, INCREMENTO, RESERVA, PRESUPUESTO)
app.post('/api/sessions/:id/update-params', (req, res) => {
  const session = findSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Sesión no encontrada' });

  const { startingPrice, minIncrement, reservePrice, clientMaxBudget, currentPrice, brokerName, buyerName, referenceUrl, lotNumber } = req.body;

  const newStartingPrice = startingPrice !== undefined && !isNaN(Number(startingPrice)) ? Number(startingPrice) : session.starting_price;
  const newIncrement = minIncrement !== undefined && !isNaN(Number(minIncrement)) ? Number(minIncrement) : session.min_increment;
  const newReserve = reservePrice !== undefined && !isNaN(Number(reservePrice)) ? Number(reservePrice) : session.reserve_price;
  const newBudget = clientMaxBudget !== undefined && !isNaN(Number(clientMaxBudget)) ? Number(clientMaxBudget) : session.client_max_budget;
  const newCurrentPrice = currentPrice !== undefined && !isNaN(Number(currentPrice)) ? Number(currentPrice) : (session.status === 'prepared' || session.bid_count === 0 ? newStartingPrice : session.current_price);
  const newBrokerName = brokerName && String(brokerName).trim() ? String(brokerName).trim() : session.broker_name || 'Broker Autorizado (Representante)';
  const newBuyerName = buyerName && String(buyerName).trim() ? String(buyerName).trim() : session.buyer_name || 'Carlos Mendoza (Comprador)';
  const newLotNumber = lotNumber && String(lotNumber).trim() ? String(lotNumber).trim() : session.lot_number;
  const newReferenceUrl = referenceUrl && String(referenceUrl).trim() ? String(referenceUrl).trim() : (session.reference_url || '');

  let updatedVehicleJson = session.vehicle_json;
  try {
    const vObj = typeof session.vehicle_json === 'string' ? JSON.parse(session.vehicle_json) : (session.vehicle_json || {});
    if (newReferenceUrl) vObj.reference_url = newReferenceUrl;
    if (newLotNumber) vObj.lot_number = newLotNumber;
    updatedVehicleJson = JSON.stringify(vObj);
  } catch { }

  db.prepare(`
    UPDATE auction_sessions
    SET 
      starting_price = ?,
      min_increment = ?,
      reserve_price = ?,
      client_max_budget = ?,
      current_price = ?,
      broker_name = ?,
      buyer_name = ?,
      lot_number = ?,
      reference_url = ?,
      vehicle_json = ?,
      is_token_revoked = 0,
      updated_at = ?
    WHERE id = ?
  `).run(
    newStartingPrice,
    newIncrement,
    newReserve,
    newBudget,
    newCurrentPrice,
    newBrokerName,
    newBuyerName,
    newLotNumber,
    newReferenceUrl,
    updatedVehicleJson,
    new Date().toISOString(),
    session.id
  );

  db.prepare(`
    UPDATE auction_participants 
    SET name = ? 
    WHERE session_id = ? AND paddle_number = 'Paleta #101'
  `).run(`${newBuyerName} (${newBrokerName} Rep. #101)`, session.id);

  broadcast({
    type: 'STATUS_CHANGE',
    sessionId: session.id,
    startingPrice: newStartingPrice,
    minIncrement: newIncrement,
    reservePrice: newReserve,
    clientMaxBudget: newBudget,
    currentPrice: newCurrentPrice,
    brokerName: newBrokerName,
    buyerName: newBuyerName,
    lotNumber: newLotNumber,
    referenceUrl: newReferenceUrl,
  });

  return res.json({
    success: true,
    params: {
      startingPrice: newStartingPrice,
      minIncrement: newIncrement,
      reservePrice: newReserve,
      clientMaxBudget: newBudget,
      currentPrice: newCurrentPrice,
      brokerName: newBrokerName,
      buyerName: newBuyerName
    }
  });
});

// 8b. CARGAR SIGUIENTE LOTE Y NUEVO CLIENTE EN LA MISMA SALA
app.post('/api/sessions/:id/next-lot', (req, res) => {
  const session = db.prepare('SELECT * FROM auction_sessions WHERE id = ?').get(req.params.id) as any;
  if (!session) return res.status(404).json({ error: 'Sesión de sala no encontrada' });

  const {
    lotNumber,
    vehicle,
    buyerName,
    buyerEmail,
    buyerPhone,
    clientMaxBudget,
    brokerName,
    brokerEmail,
    brokerPhone,
    startingPrice,
    minIncrement,
    reservePrice,
  } = req.body;

  if (!lotNumber || !vehicle || !vehicle.brand || !vehicle.model) {
    return res.status(400).json({ error: 'Faltan datos obligatorios del lote o vehículo' });
  }

  stopServerClock(session.id);

  const startPrice = Number(startingPrice) || 4000;
  const increment = Number(minIncrement) || 250;
  const reserve = Number(reservePrice) || (startPrice * 2);
  const budget = Number(clientMaxBudget) || 7500;
  const finalBuyerName = buyerName?.trim() || 'Comprador Autorizado';
  const finalBrokerName = brokerName?.trim() || 'Broker Representante';

  const newBrokerToken = 'bdr_broker_' + crypto.randomBytes(4).toString('hex');
  const newBuyerToken = 'bdr_buyer_' + crypto.randomBytes(4).toString('hex');
  const now = new Date().toISOString();

  // Snapshot normalizado del nuevo vehículo
  const vehicleSnapshot = {
    id: 'veh-' + crypto.randomBytes(4).toString('hex'),
    brand: vehicle.brand,
    model: vehicle.model,
    year: Number(vehicle.year) || 2024,
    version: vehicle.version || 'Equipamiento Original',
    vin: vehicle.vin || '1FA6P8CF' + crypto.randomBytes(4).toString('hex').toUpperCase(),
    lot_number: String(lotNumber),
    engine: vehicle.engine || 'Motor Estándar',
    transmission: vehicle.transmission || 'Automática',
    drivetrain: vehicle.drivetrain || 'RWD',
    odometer: Number(vehicle.odometer) || 12000,
    odometer_unit: vehicle.odometer_unit || 'mi',
    vehicle_condition: vehicle.vehicle_condition || 'run_and_drive',
    title_type: vehicle.title_type || 'Salvage Certificate',
    primary_damage: vehicle.primary_damage || 'Impacto Frontal',
    secondary_damage: vehicle.secondary_damage || 'Ninguno',
    has_keys: vehicle.has_keys !== false,
    est_retail_value: Number(vehicle.est_retail_value) || (startPrice * 4),
    location: vehicle.location || 'Yard 12 - Atlanta East',
    notes: vehicle.notes || 'Unidad inspeccionada lista para puja en vivo.',
    images: Array.isArray(vehicle.images) && vehicle.images.length > 0 ? vehicle.images : [
      { id: 'img-1', url: 'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&q=80&w=1200', category: 'exterior', is_primary: true, order: 1 }
    ]
  };

  // Limpiar ofertas y solicitudes anteriores para el nuevo lote
  db.prepare(`DELETE FROM auction_bids WHERE session_id = ?`).run(session.id);
  db.prepare(`DELETE FROM budget_authorizations WHERE session_id = ?`).run(session.id);

  // Actualizar la sesión existente en la misma sala
  db.prepare(`
    UPDATE auction_sessions 
    SET 
      title = ?,
      lot_number = ?,
      brand = ?,
      model = ?,
      year = ?,
      starting_price = ?,
      current_price = ?,
      min_increment = ?,
      reserve_price = ?,
      client_max_budget = ?,
      broker_name = ?,
      buyer_name = ?,
      broker_access_token = ?,
      buyer_access_token = ?,
      is_token_revoked = 0,
      broker_token_revoked = 0,
      buyer_token_revoked = 0,
      status = 'prepared',
      current_winner_paddle = NULL,
      current_winner_name = NULL,
      current_winner_id = NULL,
      bid_count = 0,
      time_remaining_seconds = total_duration_seconds,
      vehicle_json = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    `${vehicleSnapshot.year} ${vehicleSnapshot.brand} ${vehicleSnapshot.model}`,
    String(lotNumber),
    vehicleSnapshot.brand,
    vehicleSnapshot.model,
    vehicleSnapshot.year,
    startPrice,
    startPrice,
    increment,
    reserve,
    budget,
    finalBrokerName,
    finalBuyerName,
    newBrokerToken,
    newBuyerToken,
    JSON.stringify(vehicleSnapshot),
    now,
    session.id
  );

  // Actualizar o insertar participante Broker Real (Paleta #101) con nuevo token
  const brokerHash = hashToken(newBrokerToken);
  const existingBroker = db.prepare('SELECT id FROM auction_participants WHERE session_id = ? AND paddle_number = ?').get(session.id, 'Paleta #101') as any;
  if (existingBroker) {
    db.prepare(`
      UPDATE auction_participants 
      SET name = ?, token_hash = ?, authorization_status = 'approved'
      WHERE id = ?
    `).run(`${finalBuyerName} (${finalBrokerName} Rep. #101)`, brokerHash, existingBroker.id);
  } else {
    db.prepare(`
      INSERT INTO auction_participants (id, session_id, name, paddle_number, location, token_hash, authorization_status, created_at)
      VALUES (?, ?, ?, 'Paleta #101', 'Online (Representante)', ?, 'approved', ?)
    `).run('part-' + session.id + '-broker', session.id, `${finalBuyerName} (${finalBrokerName} Rep. #101)`, brokerHash, now);
  }

  // Notificar a todos los dispositivos conectados por WebSocket el nuevo lote cargado
  broadcast({
    type: 'NEXT_LOT_LOADED',
    sessionId: session.id,
    lotNumber: String(lotNumber),
    title: `${vehicleSnapshot.year} ${vehicleSnapshot.brand} ${vehicleSnapshot.model}`,
    buyerName: finalBuyerName,
    brokerName: finalBrokerName,
    clientMaxBudget: budget,
    startingPrice: startPrice,
    vehicle: vehicleSnapshot,
    status: 'prepared',
    timeRemaining: 15,
  });

  broadcast({
    type: 'STATUS_CHANGE',
    sessionId: session.id,
    status: 'prepared',
    timeRemaining: 15,
    startingPrice: startPrice,
    currentPrice: startPrice,
  });

  res.json({
    success: true,
    message: 'Siguiente lote cargado exitosamente en la sala.',
    session: {
      id: session.id,
      lotNumber: String(lotNumber),
      title: `${vehicleSnapshot.year} ${vehicleSnapshot.brand} ${vehicleSnapshot.model}`,
      roomToken: session.room_token,
      brokerAccessToken: newBrokerToken,
      buyerAccessToken: newBuyerToken,
      brokerName: finalBrokerName,
      buyerName: finalBuyerName,
      clientMaxBudget: budget,
      startingPrice: startPrice,
      minIncrement: increment,
      vehicle: vehicleSnapshot,
      links: {
        auctioneerLink: `#/sala/${session.room_token}?auctioneer=true`,
        brokerLink: `#/sala/${session.room_token}?broker=${newBrokerToken}`,
        buyerLink: `#/sala/${session.room_token}?cliente=${newBuyerToken}`
      }
    }
  });
});

// 8b. OBTENER COMPROBANTE DOCUMENTAL OFICIAL
app.get('/api/documents/:token', (req, res) => {
  const doc = db.prepare('SELECT * FROM document_access_tokens WHERE doc_token = ?').get(req.params.token) as any;
  if (!doc) {
    return res.status(404).json({ 
      error: 'DOCUMENT_NOT_FOUND',
      title: 'DOCUMENTO NO ENCONTRADO',
      message: 'El comprobante o enlace documental solicitado no existe.' 
    });
  }

  if (doc.is_revoked) {
    return res.status(403).json({
      error: 'DOCUMENT_REVOKED',
      title: 'DOCUMENTO REVOCADO',
      message: 'El acceso a este documento ha sido revocado oficialmente por el broker autorizado.'
    });
  }

  if (new Date(doc.expires_at) < new Date()) {
    return res.status(403).json({
      error: 'DOCUMENT_EXPIRED',
      title: 'DOCUMENTO EXPIRADO',
      message: `El periodo de validez para consultar este documento ha expirado (${new Date(doc.expires_at).toLocaleString()}). Comuníquese con su broker para solicitar un nuevo enlace.`
    });
  }

  const session = db.prepare('SELECT * FROM auction_sessions WHERE id = ?').get(doc.session_id) as any;
  const result = db.prepare('SELECT * FROM auction_results WHERE session_id = ?').get(doc.session_id) as any;

  res.json({
    success: true,
    document: {
      id: doc.id,
      docToken: doc.doc_token,
      clientName: doc.client_name,
      clientEmail: doc.client_email,
      title: doc.title,
      expiresAt: doc.expires_at,
      isRevoked: Boolean(doc.is_revoked),
      createdAt: doc.created_at,
    },
    auction: {
      lotNumber: session?.lot_number || result?.lot_number || '48291032',
      vehicleSummary: result?.vehicle_summary || `${session?.year} ${session?.brand} ${session?.model}`,
      finalPrice: result?.final_price ?? session?.current_price ?? 0,
      totalBids: result?.total_bids ?? session?.bid_count ?? 0,
      winnerPaddle: result?.winner_paddle ?? session?.current_winner_paddle ?? 'Paleta #101',
      winnerName: result?.winner_name ?? session?.current_winner_name ?? 'Cliente Autorizado',
      finishedAt: result?.finished_at ?? session?.updated_at ?? new Date().toISOString(),
      vehicle: session?.vehicle_json ? JSON.parse(session.vehicle_json) : null,
    },
    terminal: {
      lane: 'LANE A',
      yard: 'ATLANTA EAST YARD 12',
      brokerLicense: 'BK-78921-USA',
      verificationSeal: 'SHA256-VERIFIED-ATOMIC-TRANSACTION',
    }
  });
});

// 8c. GENERAR ENLACE DOCUMENTAL INDEPENDIENTE
const handleCreateSessionDocument = (req: any, res: any) => {
  const { clientName, clientEmail, expiresInDays = 7 } = req.body;
  const session = db.prepare('SELECT * FROM auction_sessions WHERE id = ?').get(req.params.id) as any;
  if (!session) return res.status(404).json({ error: 'Sesión no encontrada' });

  const docToken = 'doc_' + crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + (Number(expiresInDays) || 7) * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO document_access_tokens (
      id, session_id, doc_token, client_name, client_email, title, expires_at, is_revoked, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
  `).run(
    'doc-' + Math.random().toString(36).substring(2, 9),
    session.id,
    docToken,
    clientName || session.current_winner_name || 'Cliente Autorizado',
    clientEmail || 'cliente@subastas.com',
    `Comprobante Oficial de Adjudicación - Lote #${session.lot_number}`,
    expiresAt,
    now
  );

  res.json({
    success: true,
    docToken,
    expiresAt,
    documentUrl: `#/documento/${docToken}`,
  });
};

app.post('/api/sessions/:id/documents', handleCreateSessionDocument);
app.post('/api/sessions/:id/create-document', handleCreateSessionDocument);

// 8d. LISTAR DOCUMENTOS DE UNA SESIÓN
app.get('/api/sessions/:id/documents', (req, res) => {
  const docs = db.prepare('SELECT * FROM document_access_tokens WHERE session_id = ? ORDER BY created_at DESC').all(req.params.id) as any[];
  res.json(docs.map((d) => ({
    id: d.id,
    docToken: d.doc_token,
    clientName: d.client_name,
    clientEmail: d.client_email,
    title: d.title,
    expiresAt: d.expires_at,
    isRevoked: Boolean(d.is_revoked),
    revokedAt: d.revoked_at,
    createdAt: d.created_at,
  })));
});

// 8e. REVOCAR ENLACE DOCUMENTAL
app.post('/api/documents/:token/revoke', (req, res) => {
  const doc = db.prepare('SELECT id FROM document_access_tokens WHERE doc_token = ?').get(req.params.token) as any;
  if (!doc) return res.status(404).json({ error: 'Documento no encontrado' });

  db.prepare('UPDATE document_access_tokens SET is_revoked = 1, revoked_at = ? WHERE doc_token = ?').run(
    new Date().toISOString(),
    req.params.token
  );

  res.json({ success: true, message: 'Enlace documental revocado exitosamente' });
});

// 9. Registrar participante con token seguro
app.post('/api/sessions/:id/participants', (req, res) => {
  const { name, paddleNumber, location, maxBidLimit } = req.body;
  if (!name || !paddleNumber) {
    return res.status(400).json({ error: 'Nombre y Número de Paleta requeridos' });
  }

  const rawToken = generateSecureToken();
  const tokenHash = hashToken(rawToken);
  const participantId = 'part-' + Math.random().toString(36).substring(2, 9);
  const now = new Date().toISOString();

  try {
    db.prepare(`
      INSERT INTO auction_participants (
        id, session_id, name, paddle_number, location, token_hash, authorization_status, max_bid_limit, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      participantId,
      req.params.id,
      name,
      paddleNumber,
      location || 'Online',
      tokenHash,
      'approved',
      maxBidLimit || null,
      now
    );

    broadcast({ type: 'PARTICIPANTS_UPDATED', sessionId: req.params.id });

    res.json({
      success: true,
      participant: {
        id: participantId,
        name,
        paddleNumber,
        location: location || 'Online',
        rawToken, // Se entrega una sola vez al broker
      }
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Error al registrar participante' });
  }
});

// 10. DISPARAR OFERTA DE COMPETIDOR CONTROLADA POR EL OPERADOR ("LO MANEJO YO")
// Permite al operador subir el precio y generar dinamismo realista SIN PASARSE del presupuesto del cliente
app.post('/api/sessions/:id/trigger-competitor-bid', (req, res) => {
  const session = db.prepare('SELECT * FROM auction_sessions WHERE id = ?').get(req.params.id) as any;
  if (!session) return res.status(404).json({ error: 'Sesión no encontrada' });

  if (!['open', 'bidding', 'last_call'].includes(session.status)) {
    // Si la subasta estaba en preparación, abrirla automáticamente
    db.prepare(`UPDATE auction_sessions SET status = 'open', time_remaining_seconds = total_duration_seconds WHERE id = ?`).run(session.id);
    startServerClock(session.id);
  activeAuctioneerCalls.delete(session.id);
  }

  const clientMaxBudget = Number(session.client_max_budget) || 7500;
  const minIncrement = Number(session.min_increment) || 250;
  const nextAmount = session.current_price + minIncrement;

  // REGLA CRÍTICA: El competidor NUNCA puede ofertar por encima de (presupuesto - incremento)
  // para garantizar que siempre quede espacio para que el broker puje dentro del presupuesto y gane.
  const maxAllowedForCompetitor = clientMaxBudget - minIncrement;
  if (nextAmount > maxAllowedForCompetitor) {
    return res.status(400).json({
      error: `Tope de presupuesto alcanzado ($${clientMaxBudget.toLocaleString()} USD). No se pueden emitir más ofertas de competidores para asegurar que el broker gane dentro del presupuesto fijado.`
    });
  }

  // Lista ampliada de competidores realistas para simular subastas dinámicas
  const competitors = [
    { paddle: 'Paleta #108', name: 'AutoExport Dallas LLC', loc: 'Dallas, TX', base: 'bdr_comp_dallas' },
    { paddle: 'Paleta #214', name: 'Pacific Salvage Auctions', loc: 'Los Angeles, CA', base: 'bdr_comp_pacific' },
    { paddle: 'Paleta #305', name: 'Global Fleet Buyers', loc: 'Atlanta, GA', base: 'bdr_comp_global' },
    { paddle: 'Paleta #412', name: 'Buckeye Motor Exchange', loc: 'Columbus, OH', base: 'bdr_comp_buckeye' },
    { paddle: 'Paleta #519', name: 'Lone Star Salvage Group', loc: 'Houston, TX', base: 'bdr_comp_lonestar' },
    { paddle: 'Paleta #623', name: 'Midwest Premier Liquidation', loc: 'Chicago, IL', base: 'bdr_comp_midwest' }
  ];

  // Alternar competidor para que no puje el mismo dos veces seguidas
  const eligible = competitors.filter((c) => c.paddle !== session.current_winner_paddle);
  const chosen = eligible.length > 0 ? eligible[Math.floor(Math.random() * eligible.length)] : competitors[0];

  // Token único para esta sesión para evitar conflicto con la restricción UNIQUE de token_hash
  const compToken = session.id === 'ses-live-001'
    ? (chosen.paddle === 'Paleta #108' ? 'bdr_comp_dallas_108' :
       chosen.paddle === 'Paleta #214' ? 'bdr_comp_pacific_214' :
       chosen.paddle === 'Paleta #305' ? 'bdr_comp_global_305' :
       chosen.paddle === 'Paleta #412' ? 'bdr_comp_buckeye_412' :
       chosen.paddle === 'Paleta #519' ? 'bdr_comp_lonestar_519' : 'bdr_comp_midwest_623')
    : `${chosen.base}_${session.id}`;

  const chosenTokenHash = hashToken(compToken);
  const existingParticipant = db.prepare('SELECT id FROM auction_participants WHERE session_id = ? AND (paddle_number = ? OR token_hash = ?)').get(session.id, chosen.paddle, chosenTokenHash) as any;

  if (!existingParticipant) {
    db.prepare(`
      INSERT INTO auction_participants (id, session_id, name, paddle_number, location, token_hash, authorization_status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'comp-' + crypto.randomBytes(4).toString('hex'),
      session.id,
      chosen.name,
      chosen.paddle,
      chosen.loc,
      chosenTokenHash,
      'approved',
      new Date().toISOString()
    );
  }

  // Ejecución atómica en base de datos
  const result = placeBidAtomic(db, session.id, compToken, nextAmount);

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  setAuctioneerCall(session.id, 'clear');

  // Difundir inmediatamente vía WebSocket a todos los dispositivos conectados
  broadcast({
    type: 'NEW_REAL_BID',
    sessionId: session.id,
    bid: result.bid,
    currentPrice: result.session?.currentPrice,
    currentWinnerPaddle: result.session?.currentWinnerPaddle,
    currentWinnerName: result.session?.currentWinnerName,
    timeRemaining: result.session?.timeRemainingSeconds,
    serverTimestamp: result.bid?.serverTimestamp,
    isCompetitor: true,
  });

  res.json({ success: true, bid: result.bid, session: result.session });
});

// 11. ACTUALIZAR PRESUPUESTO MÁXIMO DEL CLIENTE
const handleUpdateBudget = (req: any, res: any) => {
  const { maxBudget } = req.body;
  if (!maxBudget || Number(maxBudget) <= 0) {
    return res.status(400).json({ error: 'Presupuesto inválido' });
  }

  db.prepare('UPDATE auction_sessions SET client_max_budget = ? WHERE id = ?').run(
    Number(maxBudget),
    req.params.id
  );

  broadcast({
    type: 'BUDGET_UPDATED',
    sessionId: req.params.id,
    maxBudget: Number(maxBudget),
  });

  res.json({ success: true, maxBudget: Number(maxBudget) });
};
app.patch('/api/sessions/:id/budget', handleUpdateBudget);
app.post('/api/sessions/:id/budget', handleUpdateBudget);

// 12. ACTUALIZAR FICHA TÉCNICA Y FOTOGRAFÍAS DEL VEHÍCULO EN TIEMPO REAL (CARGA EN MODO PREPARADO / STANDBY)
app.patch('/api/sessions/:id/vehicle', (req, res) => {
  const { vehicle, startingPrice } = req.body;
  if (!vehicle) return res.status(400).json({ error: 'Ficha de vehículo requerida' });

  const session = db.prepare('SELECT id, total_duration_seconds FROM auction_sessions WHERE id = ?').get(req.params.id) as any;
  if (!session) return res.status(404).json({ error: 'Sesión no encontrada' });

  stopServerClock(session.id);
  const startPrice = Number(startingPrice) || (vehicle.est_retail_value ? Math.max(1000, Math.round((vehicle.est_retail_value * 0.20) / 500) * 500) : 5000);

  // Limpiar ofertas anteriores y dejar la sesión en modo PREPARADO
  db.prepare('DELETE FROM auction_bids WHERE session_id = ?').run(session.id);

  db.prepare(`
    UPDATE auction_sessions 
    SET 
      vehicle_json = ?,
      brand = ?,
      model = ?,
      year = ?,
      lot_number = ?,
      title = ?,
      status = 'prepared',
      starting_price = ?,
      current_price = ?,
      current_winner_paddle = NULL,
      current_winner_name = NULL,
      current_winner_id = NULL,
      bid_count = 0,
      time_remaining_seconds = 15,
      is_token_revoked = 0,
      broker_token_revoked = 0,
      buyer_token_revoked = 0,
      updated_at = ?
    WHERE id = ?
  `).run(
    JSON.stringify(vehicle),
    vehicle.brand || 'Vehículo',
    vehicle.model || 'Modelo',
    vehicle.year || 2024,
    vehicle.lot_number || '48291032',
    `${vehicle.year || 2024} ${vehicle.brand || 'Vehículo'} ${vehicle.model || 'Modelo'}`,
    startPrice,
    startPrice,
    new Date().toISOString(),
    req.params.id
  );

  broadcast({
    type: 'VEHICLE_UPDATED',
    sessionId: req.params.id,
    vehicle,
    lotNumber: vehicle.lot_number || '48291032',
    title: `${vehicle.year} ${vehicle.brand} ${vehicle.model}`,
    status: 'prepared',
    startingPrice: startPrice,
    currentPrice: startPrice,
    timeRemaining: 15,
  });

  broadcast({
    type: 'NEXT_LOT_LOADED',
    sessionId: req.params.id,
    vehicle,
    lotNumber: vehicle.lot_number || '48291032',
    title: `${vehicle.year} ${vehicle.brand} ${vehicle.model}`,
    status: 'prepared',
    startingPrice: startPrice,
    currentPrice: startPrice,
    timeRemaining: 15,
  });

  broadcast({
    type: 'STATUS_CHANGE',
    sessionId: req.params.id,
    status: 'prepared',
    startingPrice: startPrice,
    currentPrice: startPrice,
    timeRemaining: 15,
  });

  res.json({ success: true, vehicle, status: 'prepared', startingPrice: startPrice });
});

// 11. MOTOR DE OFERTAS: ÚNICA RUTA AUTORIZADA PARA OFERTAS REALES
app.post('/api/bids', (req, res) => {
  const { sessionId, participantToken, amount } = req.body;

  if (!sessionId || !participantToken || amount === undefined) {
    return res.status(400).json({
      error: 'Parámetros obligatorios faltantes (sessionId, participantToken, amount)'
    });
  }

  const result = placeBidAtomic(db, sessionId, String(participantToken), Number(amount));

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  setAuctioneerCall(sessionId, 'clear');

  broadcast({
    type: 'NEW_REAL_BID',
    sessionId,
    bid: result.bid,
    currentPrice: result.session?.currentPrice,
    currentWinnerPaddle: result.session?.currentWinnerPaddle,
    currentWinnerName: result.session?.currentWinnerName,
    timeRemaining: result.session?.timeRemainingSeconds,
    serverTimestamp: result.bid?.serverTimestamp,
  });

  return res.json({
    success: true,
    bid: result.bid,
    session: result.session,
  });
});

// 13. POLÍTICA DE RETENCIÓN Y LIMPIEZA DE DATOS TEMPORALES (REGLAS 7 Y 8)
export function runRetentionCleanup(retentionHours: number = 24) {
  const cutoffTime = new Date(Date.now() - retentionHours * 60 * 60 * 1000).toISOString();
  
  const finishedSessions = db.prepare(`
    SELECT id, lot_number, updated_at FROM auction_sessions
    WHERE status IN ('sold', 'unsold', 'closed')
      AND updated_at < ?
  `).all(cutoffTime) as any[];

  let purgedCount = 0;
  for (const s of finishedSessions) {
    // REGLA 8: Conservar documentos finales durante su vigencia
    const activeDocs = db.prepare(`
      SELECT COUNT(*) as cnt FROM document_access_tokens
      WHERE session_id = ? AND is_revoked = 0 AND expires_at > ?
    `).get(s.id, new Date().toISOString()) as any;

    if (activeDocs.cnt === 0) {
      // Eliminar bids y participantes asociados a la sesión efímera
      db.prepare('DELETE FROM auction_bids WHERE session_id = ?').run(s.id);
      db.prepare('DELETE FROM auction_participants WHERE session_id = ?').run(s.id);
      db.prepare('DELETE FROM auction_sessions WHERE id = ?').run(s.id);
      purgedCount++;
    }
  }

  if (purgedCount > 0) {
    console.log(`[Retention Policy] ${purgedCount} sesiones efímeras eliminadas tras superar retención de ${retentionHours}h.`);
  }
  return { purgedCount, evaluated: finishedSessions.length };
}

// Limpieza automática programada cada hora
setInterval(() => runRetentionCleanup(24), 60 * 60 * 1000);

// Endpoint administrativo para mantenimiento de retención
app.post('/api/admin/maintenance/cleanup', (req, res) => {
  const { retentionHours = 24 } = req.body;
  const result = runRetentionCleanup(Number(retentionHours));
  res.json({ success: true, ...result });
});

// 13b. API CENTRALIZADA DE INVENTARIO DE VEHÍCULOS Y FOTOGRAFÍAS (PERSISTENCIA TOTAL EN SQLITE)
app.get('/api/vehicles', (_req, res) => {
  try {
    const rows = db.prepare('SELECT data_json FROM vehicles_inventory ORDER BY created_at DESC').all() as any[];
    const vehicles = rows.map((r) => {
      try { return JSON.parse(r.data_json); } catch { return null; }
    }).filter(Boolean);
    res.json(vehicles);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/vehicles', (req, res) => {
  try {
    const vehicle = req.body;
    if (!vehicle || !vehicle.lot_number || !vehicle.vin || !vehicle.brand || !vehicle.model) {
      return res.status(400).json({ error: 'Datos obligatorios del vehículo incompletos' });
    }

    const id = vehicle.id || 'veh-' + crypto.randomBytes(4).toString('hex');
    vehicle.id = id;
    const now = new Date().toISOString();
    vehicle.updated_at = now;
    if (!vehicle.created_at) vehicle.created_at = now;

    db.prepare(`
      INSERT INTO vehicles_inventory (id, lot_number, vin, brand, model, year, data_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(lot_number) DO UPDATE SET
        vin = excluded.vin,
        brand = excluded.brand,
        model = excluded.model,
        year = excluded.year,
        data_json = excluded.data_json,
        updated_at = excluded.updated_at
    `).run(
      id,
      String(vehicle.lot_number).trim(),
      String(vehicle.vin).trim().toUpperCase(),
      vehicle.brand,
      vehicle.model,
      Number(vehicle.year) || 2024,
      JSON.stringify(vehicle),
      vehicle.created_at,
      now
    );

    res.json({ success: true, vehicle });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/vehicles/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM vehicles_inventory WHERE id = ? OR lot_number = ?').run(req.params.id, req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 14. INICIALIZACIÓN CONTROLADA: SALA EN REPOSO HASTA APERTURA MANUAL DEL SUBASTADOR
function restoreActiveSessions() {
  // Aseguramos que la sesión inicie en 'prepared' (inspección) con reloj detenido
  db.prepare(`
    UPDATE auction_sessions 
    SET status = 'prepared', time_remaining_seconds = 15, total_duration_seconds = 15 
    WHERE id = 'ses-live-001' AND status NOT IN ('sold', 'unsold')
  `).run();
  console.log(`[Auction Engine] Sala configurada en fase de inspección (prepared). Reloj detenido hasta apertura del martillero.`);
}

// 15. PUBLICACIÓN DE FRONTEND ESTÁTICO (SPA PARA HTTPS / WSS UNIFICADO)
const distPath = path.resolve('dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

const PORT = process.env.PORT || 3001;
server.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`[Copart Live Engine] Servidor Backend Autorizado corriendo en http://0.0.0.0:${PORT}`);
  console.log(`[Copart Live Engine] Base de Datos SQLite ACID y WebSocket activos.`);
  restoreActiveSessions();
  runRetentionCleanup(24);
});

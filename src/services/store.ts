import { Client, Vehicle, AuctionSession, AuctionBid, AuctionResult, DashboardMetrics } from '../types';
import { INITIAL_CLIENTS, INITIAL_VEHICLES, INITIAL_SESSIONS } from './seedData';
import { sounds } from '../lib/soundEffects';

const CLOUDFLARE_TUNNEL_URL = 'https://ranked-hearts-marcus-arthur.trycloudflare.com';

const getDynamicBackendUrls = () => {
  if (typeof window === 'undefined') {
    return { http: 'http://localhost:3001', ws: 'ws://localhost:3001' };
  }
  const isHttps = window.location.protocol === 'https:';
  const hostname = window.location.hostname;
  const port = window.location.port;
  const httpProto = isHttps ? 'https:' : 'http:';
  const wsProto = isHttps ? 'wss:' : 'ws:';

  // 1. Si la URL contiene el parámetro 'server', persistirlo y usarlo de inmediato
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    const hashQuery = hash.includes('?') ? hash.split('?')[1] : '';
    const hashParams = new URLSearchParams(hashQuery);
    const serverParam = searchParams.get('server') || hashParams.get('server');
    if (serverParam && serverParam.startsWith('http')) {
      const cleanHttp = serverParam.trim().replace(/\/+$/, '');
      localStorage.setItem('AUCTION_BACKEND_URL', cleanHttp);
      return { http: cleanHttp, ws: cleanHttp.replace(/^http/i, 'ws') };
    }
  } catch { }

  // 2. Si el usuario guardó manualmente una URL de backend en localStorage, usarla con máxima prioridad
  try {
    const savedUrl = localStorage.getItem('AUCTION_BACKEND_URL');
    if (savedUrl && savedUrl.trim()) {
      const cleanHttp = savedUrl.trim().replace(/\/+$/, '');
      const cleanWs = cleanHttp.replace(/^http/i, 'ws');
      return { http: cleanHttp, ws: cleanWs };
    }
  } catch { }

  // 2. Si está configurada una variable de entorno personalizada, usarla (ideal para Vercel)
  let customHttp = (import.meta as any).env?.VITE_BACKEND_URL;
  let customWs = (import.meta as any).env?.VITE_WS_URL;

  // Si la variable de Vercel contiene un túnel trycloudflare obsoleto, priorizar el túnel activo actual
  if (customHttp && customHttp.includes('trycloudflare.com') && !customHttp.includes('remainder-notebooks-production-activities')) {
    customHttp = CLOUDFLARE_TUNNEL_URL;
    customWs = CLOUDFLARE_TUNNEL_URL.replace(/^http/i, 'ws');
  }

  if (customHttp) {
    customHttp = customHttp.trim().replace(/\/+$/, '');
    if (!customWs) {
      customWs = customHttp.replace(/^http/i, 'ws');
    } else {
      customWs = customWs.trim().replace(/\/+$/, '');
    }
    return { http: customHttp, ws: customWs };
  }
  if (customWs) {
    customWs = customWs.trim().replace(/\/+$/, '');
    customHttp = customWs.replace(/^ws/i, 'http');
    return { http: customHttp, ws: customWs };
  }

  // 3. Si estamos en cualquier dominio de Vercel (*.vercel.app), conectar automáticamente al túnel activo de Cloudflare
  if (hostname.includes('vercel.app')) {
    return {
      http: CLOUDFLARE_TUNNEL_URL,
      ws: CLOUDFLARE_TUNNEL_URL.replace(/^http/i, 'ws'),
    };
  }

  // 4. Si estamos en el puerto de Vite dev server (5173), conectar al backend en 3001
  if (port === '5173') {
    return {
      http: `${httpProto}//${hostname}:3001`,
      ws: `${wsProto}//${hostname}:3001`,
    };
  }

  // 5. En producción, túneles HTTPS o cuando Express sirve la app: usar el mismo host y puerto
  const host = window.location.host;
  return {
    http: `${httpProto}//${host}`,
    ws: `${wsProto}//${host}`,
  };
};

const { http: SERVER_URL, ws: WS_URL } = getDynamicBackendUrls();

export interface ParticipantInfo {
  id: string;
  name: string;
  paddleNumber: string;
  location: string;
  token: string;
  status: 'approved' | 'pending' | 'suspended';
  maxBidLimit?: number;
}

class RealAuctionStore {
  public ws: WebSocket | null = null;
  private listeners: Set<() => void> = new Set();
  private wsListeners: Set<(data: any) => void> = new Set();
  public isServerOnline: boolean = false;
  private bc: BroadcastChannel | null = null;
  private localTimer: any = null;
  private localTimeRemaining: number = 15;
  private localSessionState: {
    status: string;
    currentPrice: number;
    startingPrice: number;
    currentWinnerPaddle: string | null;
    currentWinnerName: string | null;
    vehicle?: any;
    vehicle_snapshot?: any;
    lot_number?: string;
    title?: string;
    bid_count?: number;
    bids?: any[];
    time_remaining_seconds?: number;
    total_duration_seconds?: number;
    [key: string]: any;
  } = {
      status: 'prepared',
      currentPrice: 5000,
      startingPrice: 5000,
      currentWinnerPaddle: null,
      currentWinnerName: null,
    };

  constructor() {
    this.initBroadcastChannel();
    this.initWebSocket();
    this.checkServerHealth();
    this.fetchServerVehicles();
  }

  public async fetchServerVehicles(): Promise<Vehicle[]> {
    try {
      const res = await fetch(`${SERVER_URL}/api/vehicles`);
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          localStorage.setItem('copart_vehicles_v1', JSON.stringify(rows));
          this.notify();
          return rows;
        }
      }
    } catch { }
    return this.getVehicles();
  }

  private initBroadcastChannel() {
    if (typeof window === 'undefined') return;
    try {
      if ('BroadcastChannel' in window) {
        this.bc = new BroadcastChannel('copart_live_auction_sync_channel');
        this.bc.onmessage = (event) => {
          this.handleIncomingMessage(event.data, false);
        };
      }
    } catch { }
  }

  public broadcastChannelMessage(data: any) {
    if (!data) return;
    try {
      if (this.bc) {
        this.bc.postMessage(data);
      }
    } catch { }
  }

  public dispatchSyncEvent(data: any, sendToChannel: boolean = true) {
    this.handleIncomingMessage(data, sendToChannel);
  }

  private handleIncomingMessage(data: any, sendToChannel: boolean) {
    if (!data || !data.type) return;

    if (sendToChannel) {
      this.broadcastChannelMessage(data);
    }

    // Actualizar estado local interno para consistencia inmediata
    if (data.status) this.localSessionState.status = data.status;
    if (data.currentPrice !== undefined) this.localSessionState.currentPrice = Number(data.currentPrice);
    if (data.startingPrice !== undefined) this.localSessionState.startingPrice = Number(data.startingPrice);
    if (data.currentWinnerPaddle !== undefined) this.localSessionState.currentWinnerPaddle = data.currentWinnerPaddle;
    if (data.currentWinnerName !== undefined) this.localSessionState.currentWinnerName = data.currentWinnerName;
    if (data.timeRemaining !== undefined) this.localTimeRemaining = Number(data.timeRemaining);

    // Disparar listeners de WebSocket
    this.wsListeners.forEach((fn) => {
      try { fn(data); } catch { }
    });

    if (data.type === 'NEW_REAL_BID') {
      sounds.playBidPing();
      this.notify();
    } else if (data.type === 'AUCTION_FINALIZED') {
      sounds.playSoldFanfare();
      this.notify();
    } else if (data.type === 'CLOCK_TICK') {
      this.notify();
    } else if (
      data.type === 'STATUS_CHANGE' ||
      data.type === 'AUCTION_STARTED' ||
      data.type === 'AUCTION_RESET' ||
      data.type === 'AUCTIONEER_CALL' ||
      data.type === 'ROOM_ANNOUNCEMENT' ||
      data.type === 'VEHICLE_UPDATED' ||
      data.type === 'NEXT_LOT_LOADED'
    ) {
      this.notify();
    }
  }

  public startLocalClock(sessionId: string) {
    if (this.localTimer) clearInterval(this.localTimer);
    this.localTimeRemaining = 15;
    this.localTimer = setInterval(() => {
      // Si está en pausa o preparado (standby), no descontar
      if (this.localSessionState.status === 'paused' || this.localSessionState.status === 'prepared') {
        return;
      }
      // Si la subasta finalizó o se cerró, detener el reloj
      if (['sold', 'unsold', 'closed'].includes(this.localSessionState.status)) {
        this.stopLocalClock();
        return;
      }

      this.localTimeRemaining = Math.max(0, this.localTimeRemaining - 1);
      const newStatus = this.localTimeRemaining === 0 
        ? 'last_call' 
        : (this.localTimeRemaining <= 4 ? 'last_call' : 'open');
      this.localSessionState.status = newStatus;

      const tick = {
        type: 'CLOCK_TICK',
        sessionId: sessionId || 'ses-live-001',
        timeRemaining: this.localTimeRemaining,
        currentPrice: this.localSessionState.currentPrice,
        status: newStatus,
        currentWinnerPaddle: this.localSessionState.currentWinnerPaddle,
        currentWinnerName: this.localSessionState.currentWinnerName,
      };
      this.dispatchSyncEvent(tick, true);
    }, 1000);
  }

  public stopLocalClock() {
    if (this.localTimer) {
      clearInterval(this.localTimer);
      this.localTimer = null;
    }
  }

  public onWsMessage(callback: (data: any) => void): () => void {
    this.wsListeners.add(callback);
    return () => {
      this.wsListeners.delete(callback);
    };
  }

  private initWebSocket() {
    if (typeof window === 'undefined') return;

    try {
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        this.isServerOnline = true;
        this.notify();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleIncomingMessage(data, true);
        } catch {
          // parse error ignore
        }
      };

      this.ws.onclose = () => {
        this.isServerOnline = false;
        // Reintentar conexión en 3 segundos
        setTimeout(() => this.initWebSocket(), 3000);
      };
    } catch {
      this.isServerOnline = false;
    }
  }

  private async checkServerHealth() {
    try {
      const res = await fetch(`${SERVER_URL}/api/sessions`);
      if (res.ok) {
        this.isServerOnline = true;
        this.notify();
      }
    } catch {
      this.isServerOnline = false;
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  // --- CLIENTES Y VEHÍCULOS (Persistencia Local & Supabase) ---
  public getClients(): Client[] {
    const raw = localStorage.getItem('copart_clients_v1');
    if (!raw) {
      localStorage.setItem('copart_clients_v1', JSON.stringify(INITIAL_CLIENTS));
      return INITIAL_CLIENTS;
    }
    try { return JSON.parse(raw); } catch { return INITIAL_CLIENTS; }
  }

  public getClientById(id: string): Client | undefined {
    return this.getClients().find((c) => c.id === id);
  }

  public saveClient(client: Partial<Client> & { full_name: string; email: string; phone: string }): Client {
    const clients = this.getClients();
    const now = new Date().toISOString();

    if (client.id) {
      const idx = clients.findIndex((c) => c.id === client.id);
      if (idx !== -1) {
        const updated: Client = { ...clients[idx], ...client, updated_at: now } as Client;
        clients[idx] = updated;
        localStorage.setItem('copart_clients_v1', JSON.stringify(clients));
        this.notify();
        return updated;
      }
    }

    const newClient: Client = {
      id: 'cli-' + Math.random().toString(36).substring(2, 9),
      full_name: client.full_name,
      phone: client.phone,
      email: client.email,
      country: client.country || 'Estados Unidos',
      city: client.city || 'Miami',
      registration_date: client.registration_date || now.split('T')[0],
      notes: client.notes || '',
      status: client.status || 'nuevo',
      created_at: now,
      updated_at: now,
    };
    clients.unshift(newClient);
    localStorage.setItem('copart_clients_v1', JSON.stringify(clients));
    this.notify();
    return newClient;
  }

  public deleteClient(id: string) {
    const clients = this.getClients().filter((c) => c.id !== id);
    localStorage.setItem('copart_clients_v1', JSON.stringify(clients));
    this.notify();
  }

  public getVehicles(): Vehicle[] {
    const raw = localStorage.getItem('copart_vehicles_v1');
    if (!raw) {
      localStorage.setItem('copart_vehicles_v1', JSON.stringify(INITIAL_VEHICLES));
      return INITIAL_VEHICLES;
    }
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Asegurar que todos los vehículos oficiales siempre tengan sus fotos verificadas y badges actualizados
        const merged = parsed.map((v) => {
          const fresh = INITIAL_VEHICLES.find((iv) => iv.id === v.id || iv.lot_number === v.lot_number);
          if (fresh && fresh.images && fresh.images.length > 0) {
            return {
              ...v,
              ...fresh,
              images: fresh.images,
              custom_badges: fresh.custom_badges || v.custom_badges,
              engine_video_url: fresh.engine_video_url || v.engine_video_url,
              reference_url: fresh.reference_url || v.reference_url,
            };
          }
          return v;
        });
        INITIAL_VEHICLES.forEach((initVeh) => {
          const exists = merged.some((v) => v.id === initVeh.id || v.lot_number === initVeh.lot_number);
          if (!exists) {
            merged.unshift(initVeh);
          }
        });
        localStorage.setItem('copart_vehicles_v1', JSON.stringify(merged));
        return merged;
      }
      return INITIAL_VEHICLES;
    } catch {
      return INITIAL_VEHICLES;
    }
  }

  public getVehicleById(id: string): Vehicle | undefined {
    return this.getVehicles().find((v) => v.id === id);
  }

  public saveVehicle(vehicle: Partial<Vehicle> & { brand: string; model: string; year: number; vin: string; lot_number: string }): Vehicle {
    const vehicles = this.getVehicles();
    const now = new Date().toISOString();

    if (vehicle.id) {
      const idx = vehicles.findIndex((v) => v.id === vehicle.id);
      if (idx !== -1) {
        const updated: Vehicle = { ...vehicles[idx], ...vehicle, updated_at: now } as Vehicle;
        vehicles[idx] = updated;
        localStorage.setItem('copart_vehicles_v1', JSON.stringify(vehicles));
        this.notify();

        // Persistir en SQLite central en servidor
        fetch(`${SERVER_URL}/api/vehicles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        }).catch(() => { });

        return updated;
      }
    }

    const newVehicle: Vehicle = {
      id: 'veh-' + Math.random().toString(36).substring(2, 9),
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      version: vehicle.version || '',
      vin: vehicle.vin,
      lot_number: vehicle.lot_number,
      reference_url: vehicle.reference_url || '',
      engine: vehicle.engine || '',
      displacement: vehicle.displacement || '',
      transmission: vehicle.transmission || 'Automática',
      drivetrain: vehicle.drivetrain || 'RWD',
      fuel: vehicle.fuel || 'Gasolina',
      odometer: vehicle.odometer || 0,
      odometer_unit: vehicle.odometer_unit || 'mi',
      exterior_color: vehicle.exterior_color || '',
      interior_color: vehicle.interior_color || '',
      title_type: vehicle.title_type || 'salvage',
      vehicle_condition: vehicle.vehicle_condition || 'run_and_drive',
      primary_damage: vehicle.primary_damage || 'Front End',
      secondary_damage: vehicle.secondary_damage || '',
      has_keys: vehicle.has_keys ?? true,
      location: vehicle.location || 'Yard 12 - Atlanta',
      equipment: vehicle.equipment || [],
      notes: vehicle.notes || '',
      est_retail_value: vehicle.est_retail_value || 25000,
      images: vehicle.images && vehicle.images.length > 0 ? vehicle.images : [
        {
          id: 'img-1',
          vehicle_id: 'temp',
          url: 'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=1200&q=80',
          category: 'exterior',
          is_primary: true,
          order: 1,
        }
      ],
      created_at: now,
      updated_at: now,
    };
    vehicles.unshift(newVehicle);
    localStorage.setItem('copart_vehicles_v1', JSON.stringify(vehicles));
    this.notify();

    // Persistir en SQLite central en servidor
    fetch(`${SERVER_URL}/api/vehicles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newVehicle),
    }).catch(() => { });

    return newVehicle;
  }

  public deleteVehicle(id: string) {
    const vehicles = this.getVehicles().filter((v) => v.id !== id);
    localStorage.setItem('copart_vehicles_v1', JSON.stringify(vehicles));
    this.notify();

    // Eliminar de SQLite central en servidor
    fetch(`${SERVER_URL}/api/vehicles/${id}`, {
      method: 'DELETE',
    }).catch(() => { });
  }

  // --- SUBASTAS Y COMUNICACIÓN CON SERVIDOR BACKEND ---
  public async fetchServerSession(
    idOrToken: string,
    options?: { bidderToken?: string; brokerToken?: string; buyerToken?: string; isAuctioneer?: boolean }
  ): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (options?.bidderToken) params.set('bidder', options.bidderToken);
      if (options?.brokerToken) params.set('broker', options.brokerToken);
      if (options?.buyerToken) params.set('buyer', options.buyerToken);
      if (options?.isAuctioneer) params.set('auctioneer', 'true');

      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const url = idOrToken.startsWith('copart-') || idOrToken.startsWith('live_')
        ? `${SERVER_URL}/api/room/${idOrToken}${queryStr}`
        : `${SERVER_URL}/api/sessions/${idOrToken}${queryStr}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        return {
          isExpired: true,
          error: data.error,
          title: data.title || 'ACCESO RESTRINGIDO',
          message: data.message || 'El acceso a esta sala no está disponible.',
          session: null,
          bids: [],
          participants: [],
        };
      }
      if (data && data.session) {
        data.session.current_price = Number(data.session.current_price ?? data.session.currentPrice ?? 5000);
        data.session.currentPrice = data.session.current_price;
        data.session.starting_price = Number(data.session.starting_price ?? data.session.startingPrice ?? 5000);
        data.session.startingPrice = data.session.starting_price;
        data.session.client_max_budget = Number(data.session.client_max_budget ?? data.session.clientMaxBudget ?? 7500);
        data.session.clientMaxBudget = data.session.client_max_budget;
        data.session.bid_increment = Number(data.session.bid_increment ?? data.session.minIncrement ?? 250);
        data.session.minIncrement = data.session.bid_increment;
        data.session.room_token = data.session.room_token ?? data.session.roomToken;
        data.session.roomToken = data.session.room_token;
        data.session.vehicle_snapshot = data.session.vehicle_snapshot ?? data.session.vehicle;
        data.session.vehicle = data.session.vehicle_snapshot;
      }
      return data;
    } catch {
      return null;
    }
  }

  public async fetchServerSessions(): Promise<AuctionSession[]> {
    try {
      const res = await fetch(`${SERVER_URL}/api/sessions`);
      if (!res.ok) return this.getSessions();
      const rows = await res.json();
      return rows.map((r: any) => {
        const vehicle = r.vehicle || {
          brand: r.brand,
          model: r.model,
          year: r.year,
          lot_number: r.lotNumber,
          images: []
        };
        const client = {
          id: 'cli-' + r.id,
          full_name: r.buyerName || 'Comprador Asignado',
          email: 'cliente@subastas.com',
          phone: '+1 555-0199',
          country: 'USA',
          city: 'Online',
          registration_date: r.createdAt,
          status: 'listo_subasta',
          created_at: r.createdAt,
          updated_at: r.updatedAt,
        };

        return {
          id: r.id,
          client_id: client.id,
          vehicle_id: vehicle.id || 'veh-' + r.id,
          title: r.title,
          status: r.status,
          vehicle_snapshot: vehicle,
          client_snapshot: client,
          starting_price: Number(r.starting_price ?? r.startingPrice ?? 5000),
          startingPrice: Number(r.starting_price ?? r.startingPrice ?? 5000),
          bid_increment: Number(r.bid_increment ?? r.minIncrement ?? 250),
          minIncrement: Number(r.bid_increment ?? r.minIncrement ?? 250),
          expected_final_price: Number(r.reserve_price ?? r.reservePrice ?? (r.starting_price || 5000) * 2),
          duration_seconds: r.total_duration_seconds || r.totalDurationSeconds || 15,
          bid_interval_seconds: 3,
          total_planned_bids: 15,
          virtual_bidders: [],
          expected_outcome: 'win',
          current_price: Number(r.current_price ?? r.currentPrice ?? 5000),
          currentPrice: Number(r.current_price ?? r.currentPrice ?? 5000),
          current_bidder_name: r.current_winner_name || r.currentWinnerName,
          is_client_winning: Boolean((r.current_winner_paddle || r.currentWinnerPaddle)?.includes('101')),
          current_bid_count: r.bid_count ?? r.bidCount ?? 0,
          time_remaining_seconds: r.time_remaining_seconds ?? r.timeRemainingSeconds ?? 15,
          is_paused: r.status === 'paused',
          room_token: r.room_token || r.roomToken,
          is_token_revoked: Boolean(r.is_token_revoked ?? r.isTokenRevoked),
          client_max_budget: Number(r.client_max_budget ?? r.clientMaxBudget ?? 7500),
          clientMaxBudget: Number(r.client_max_budget ?? r.clientMaxBudget ?? 7500),
          broker_name: r.brokerName,
          buyer_name: r.buyerName,
          broker_access_token: r.brokerAccessToken,
          buyer_access_token: r.buyerAccessToken,
          broker_token_revoked: r.brokerTokenRevoked,
          buyer_token_revoked: r.buyerTokenRevoked,
          links: r.links,
          created_at: r.createdAt,
          updated_at: r.updatedAt,
        } as AuctionSession;
      });
    } catch {
      return this.getSessions();
    }
  }

  public async createServerSession(payload: any): Promise<{ success: boolean; session?: any; error?: string }> {
    try {
      const res = await fetch(`${SERVER_URL}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Error al crear la subasta' };
      }
      this.notify();
      return { success: true, session: data.session };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error de conexión con el servidor' };
    }
  }

  public async deleteServerSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${SERVER_URL}/api/sessions/${sessionId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Error al eliminar la subasta' };
      }
      this.notify();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error de conexión' };
    }
  }

  public getSessions(): AuctionSession[] {
    const raw = localStorage.getItem('copart_sessions_v1');
    if (!raw) {
      localStorage.setItem('copart_sessions_v1', JSON.stringify(INITIAL_SESSIONS));
      return INITIAL_SESSIONS;
    }
    try { return JSON.parse(raw); } catch { return INITIAL_SESSIONS; }
  }

  public getSessionById(id: string): AuctionSession | undefined {
    return this.getSessions().find((s) => s.id === id);
  }

  public getSessionByToken(token: string): AuctionSession | undefined {
    return this.getSessions().find((s) => s.room_token === token);
  }

  public createSession(params: {
    client_id: string;
    vehicle_id: string;
    starting_price: number;
    bid_increment: number;
    expected_final_price: number;
    duration_seconds?: number;
    bid_interval_seconds?: number;
    total_planned_bids?: number;
    virtual_bidders?: any[];
    expected_outcome?: 'win' | 'lose';
  }): AuctionSession {
    const client = this.getClientById(params.client_id);
    const vehicle = this.getVehicleById(params.vehicle_id);

    if (!client || !vehicle) throw new Error('Cliente o vehículo no encontrado');

    const now = new Date().toISOString();
    const token = 'copart-' + Math.random().toString(36).substring(2, 8) + '-' + Math.random().toString(36).substring(2, 6);

    const newSession: AuctionSession = {
      id: 'ses-' + Math.random().toString(36).substring(2, 9),
      client_id: client.id,
      vehicle_id: vehicle.id,
      title: `Subasta Copart VB3 - ${vehicle.year} ${vehicle.brand} ${vehicle.model}`,
      status: 'prepared',
      vehicle_snapshot: JSON.parse(JSON.stringify(vehicle)),
      client_snapshot: JSON.parse(JSON.stringify(client)),
      starting_price: params.starting_price,
      bid_increment: params.bid_increment,
      expected_final_price: params.expected_final_price,
      duration_seconds: params.duration_seconds || 60,
      bid_interval_seconds: params.bid_interval_seconds || 5,
      total_planned_bids: params.total_planned_bids || 0,
      virtual_bidders: params.virtual_bidders || [],
      expected_outcome: params.expected_outcome || 'win',
      current_price: params.starting_price,
      is_client_winning: false,
      current_bid_count: 0,
      time_remaining_seconds: params.duration_seconds || 60,
      is_paused: false,
      room_token: token,
      is_token_revoked: false,
      created_at: now,
      updated_at: now,
    };

    const sessions = this.getSessions();
    sessions.unshift(newSession);
    localStorage.setItem('copart_sessions_v1', JSON.stringify(sessions));
    this.notify();
    return newSession;
  }

  public deleteSession(id: string) {
    const sessions = this.getSessions().filter((s) => s.id !== id);
    localStorage.setItem('copart_sessions_v1', JSON.stringify(sessions));
    this.notify();
  }

  public toggleTokenRevocation(sessionId: string): boolean {
    const sessions = this.getSessions();
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return false;
    session.is_token_revoked = !session.is_token_revoked;
    localStorage.setItem('copart_sessions_v1', JSON.stringify(sessions));
    this.notify();
    return session.is_token_revoked;
  }

  public regenerateRoomToken(sessionId: string): string {
    const sessions = this.getSessions();
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return '';
    session.room_token = 'copart-' + Math.random().toString(36).substring(2, 8) + '-' + Math.random().toString(36).substring(2, 6);
    session.is_token_revoked = false;
    localStorage.setItem('copart_sessions_v1', JSON.stringify(sessions));
    this.notify();
    return session.room_token;
  }

  // --- OPERACIONES REALES EN EL SERVIDOR BACKEND ---
  public async submitRealBid(sessionId: string, participantToken: string, amount: number): Promise<{ success: boolean; error?: string; bid?: any }> {
    try {
      const res = await fetch(`${SERVER_URL}/api/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, participantToken, amount })
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Error al procesar la oferta en el servidor' };
      }
      return { success: true, bid: data.bid };
    } catch (err: any) {
      return { success: false, error: 'No se pudo conectar con el servidor backend autoritativo (' + err.message + ')' };
    }
  }

  public async triggerCompetitorBid(sessionId: string): Promise<{ success: boolean; error?: string; bid?: any }> {
    try {
      const res = await fetch(`${SERVER_URL}/api/sessions/${sessionId}/trigger-competitor-bid`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error };
      }
      return { success: true, bid: data.bid };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  public async updateClientBudget(sessionId: string, maxBudget: number): Promise<boolean> {
    try {
      const res = await fetch(`${SERVER_URL}/api/sessions/${sessionId}/budget`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxBudget }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  public async loadVehicleToSession(sessionId: string, vehicle: any, customStartingPrice?: number): Promise<boolean> {
    const target = sessionId || 'ses-live-001';

    // 1. Detener cualquier reloj activo
    this.stopLocalClock();

    // 2. Establecer estado PREPARADO / STANDBY a 15 segundos sin arrancar cronómetro
    this.localTimeRemaining = 15;
    this.localSessionState.status = 'prepared';
    this.localSessionState.currentWinnerPaddle = null;
    this.localSessionState.currentWinnerName = null;

    const startPrice = customStartingPrice || (vehicle?.est_retail_value
      ? Math.max(1000, Math.round((vehicle.est_retail_value * 0.20) / 500) * 500)
      : 5000);
    this.localSessionState.startingPrice = startPrice;
    this.localSessionState.currentPrice = startPrice;
    this.localSessionState.vehicle = vehicle;
    this.localSessionState.vehicle_snapshot = vehicle;
    this.localSessionState.lot_number = vehicle?.lot_number || '61682336';
    this.localSessionState.title = vehicle ? `${vehicle.year} ${vehicle.brand} ${vehicle.model}` : 'Subasta en Vivo';
    this.localSessionState.bid_count = 0;
    this.localSessionState.bids = [];
    this.localSessionState.time_remaining_seconds = 15;
    this.localSessionState.total_duration_seconds = 15;

    try {
      localStorage.setItem('copart_live_auction_session', JSON.stringify(this.localSessionState));
    } catch { }

    // 3. Notificar a todas las pantallas inmediatamente
    this.dispatchSyncEvent({
      type: 'VEHICLE_UPDATED',
      sessionId: target,
      vehicle,
      lotNumber: vehicle?.lot_number,
      title: vehicle ? `${vehicle.year} ${vehicle.brand} ${vehicle.model}` : undefined,
      status: 'prepared',
      timeRemaining: 15,
      startingPrice: startPrice,
      currentPrice: startPrice,
    }, true);

    this.dispatchSyncEvent({
      type: 'STATUS_CHANGE',
      sessionId: target,
      status: 'prepared',
      timeRemaining: 15,
      startingPrice: startPrice,
      currentPrice: startPrice,
    }, true);

    this.notify();

    // 4. Persistir en el servidor Node.js / SQLite
    try {
      const res = await fetch(`${SERVER_URL}/api/sessions/${target}/vehicle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicle, startingPrice: startPrice }),
      });
      return res.ok;
    } catch {
      return true;
    }
  }

  public async updateSessionVehicle(sessionId: string, vehicle: any): Promise<boolean> {
    return this.loadVehicleToSession(sessionId, vehicle);
  }

  public async serverStartAuction(sessionId: string) {
    const target = sessionId || 'ses-live-001';
    this.localSessionState.status = 'open';
    this.localTimeRemaining = 15;

    this.dispatchSyncEvent({
      type: 'AUCTION_STARTED',
      sessionId: target,
      status: 'open',
      timeRemaining: 15,
      currentPrice: this.localSessionState.currentPrice || 5000,
    }, true);

    this.dispatchSyncEvent({
      type: 'STATUS_CHANGE',
      sessionId: target,
      status: 'open',
      timeRemaining: 15,
      currentPrice: this.localSessionState.currentPrice || 5000,
    }, true);

    this.dispatchSyncEvent({
      type: 'CLOCK_TICK',
      sessionId: target,
      status: 'open',
      timeRemaining: 15,
      currentPrice: this.localSessionState.currentPrice || 5000,
    }, true);

    this.startLocalClock(target);

    try {
      await fetch(`${SERVER_URL}/api/sessions/${target}/start`, { method: 'POST' });
    } catch {
      // fallback
    }
  }

  public async serverPauseAuction(sessionId: string) {
    const target = sessionId || 'ses-live-001';
    this.localSessionState.status = 'paused';

    this.dispatchSyncEvent({
      type: 'STATUS_CHANGE',
      sessionId: target,
      status: 'paused',
      timeRemaining: this.localTimeRemaining,
    }, true);

    try {
      await fetch(`${SERVER_URL}/api/sessions/${target}/pause`, { method: 'POST' });
    } catch {
      // fallback
    }
  }

  public async serverResumeAuction(sessionId: string) {
    const target = sessionId || 'ses-live-001';
    this.localSessionState.status = 'bidding';

    this.dispatchSyncEvent({
      type: 'STATUS_CHANGE',
      sessionId: target,
      status: 'bidding',
      timeRemaining: this.localTimeRemaining,
    }, true);

    this.startLocalClock(target);

    try {
      await fetch(`${SERVER_URL}/api/sessions/${target}/resume`, { method: 'POST' });
    } catch {
      // fallback
    }
  }

  public async submitManualBid(sessionId: string, paddleNumber: string, amount: number): Promise<{ success: boolean; bid?: any; session?: any; error?: string }> {
    const target = sessionId || 'ses-live-001';
    this.localSessionState.currentPrice = amount;
    this.localSessionState.currentWinnerPaddle = paddleNumber;
    this.localSessionState.status = 'open';
    this.localTimeRemaining = 15;

    const bidObj = {
      id: 'bid-' + Date.now(),
      sessionId: target,
      paddleNumber,
      amount,
      timestamp: new Date().toISOString(),
      isWinning: true,
    };

    const bidMsg = {
      type: 'NEW_REAL_BID',
      sessionId: target,
      bid: bidObj,
      currentPrice: amount,
      currentWinnerPaddle: paddleNumber,
      currentWinnerName: paddleNumber,
      timeRemaining: 15,
      serverTimestamp: new Date().toISOString(),
    };
    this.dispatchSyncEvent(bidMsg, true);

    this.startLocalClock(target);

    try {
      const res = await fetch(`${SERVER_URL}/api/sessions/${target}/manual-bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paddleNumber, amount })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Error al enviar oferta manual' };
      }
      return { success: true, bid: data.bid, session: data.session };
    } catch {
      return {
        success: true,
        bid: bidObj,
        session: {
          currentPrice: amount,
          currentWinnerPaddle: paddleNumber,
          timeRemainingSeconds: 15,
          status: 'open',
        }
      };
    }
  }

  public async sendAuctioneerCall(sessionId: string, call: 'going_once' | 'going_twice' | 'fair_warning' | 'clear'): Promise<boolean> {
    const target = sessionId || 'ses-live-001';
    this.dispatchSyncEvent({
      type: 'AUCTIONEER_CALL',
      sessionId: target,
      call,
      currentPrice: this.localSessionState.currentPrice,
    }, true);

    // 1. Envío instantáneo por WebSocket si está conectado
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({
          type: 'AUCTIONEER_CALL',
          sessionId: target,
          call,
          timestamp: new Date().toISOString()
        }));
      } catch { }
    }

    // 2. Envío por HTTP REST persistente
    try {
      const res = await fetch(`${SERVER_URL}/api/sessions/${target}/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ call })
      });
      return res.ok;
    } catch {
      return true;
    }
  }

  public async adjudicateAuction(sessionId: string, decision: 'sold' | 'unsold'): Promise<boolean> {
    const target = sessionId || 'ses-live-001';
    this.stopLocalClock();
    this.localSessionState.status = decision;

    const adjMsg = {
      type: 'AUCTION_FINALIZED',
      sessionId: target,
      decision,
      status: decision,
      currentPrice: this.localSessionState.currentPrice,
      winnerPaddle: this.localSessionState.currentWinnerPaddle || 'Paleta #101',
      winnerName: this.localSessionState.currentWinnerName || 'Broker Autorizado',
    };
    this.dispatchSyncEvent(adjMsg, true);

    try {
      const res = await fetch(`${SERVER_URL}/api/sessions/${target}/adjudicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision })
      });
      return res.ok;
    } catch {
      return true;
    }
  }

  public async serverSoldAuction(sessionId: string) {
    return this.adjudicateAuction(sessionId, 'sold');
  }

  public async serverCloseAuction(sessionId: string) {
    return this.adjudicateAuction(sessionId, 'unsold');
  }

  public async serverResetAuction(sessionId: string) {
    const target = sessionId || 'ses-live-001';
    this.stopLocalClock();
    this.localTimeRemaining = 15;
    this.localSessionState.status = 'prepared';
    this.localSessionState.currentPrice = 5000;
    this.localSessionState.startingPrice = 5000;
    this.localSessionState.currentWinnerPaddle = null;
    this.localSessionState.currentWinnerName = null;

    const resetMsg = {
      type: 'AUCTION_RESET',
      sessionId: target,
      status: 'prepared',
      startingPrice: 5000,
      currentPrice: 5000,
      timeRemaining: 15,
      minIncrement: 250,
      clientMaxBudget: 7500,
      currentWinnerPaddle: null,
      currentWinnerName: null,
      bids: [],
    };
    this.dispatchSyncEvent(resetMsg, true);

    try {
      await fetch(`${SERVER_URL}/api/sessions/${target}/reset?admin=true`, { method: 'POST' });
    } catch {
      // fallback
    }
  }

  public async loadNextLot(sessionId: string, payload: any): Promise<{ success: boolean; session?: any; error?: string; links?: any }> {
    try {
      const res = await fetch(`${SERVER_URL}/api/sessions/${sessionId}/next-lot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Error al cargar siguiente lote' };
      }
      this.notify();
      return { success: true, session: data.session, links: data.session?.links };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error de conexión' };
    }
  }

  public async fetchDocument(docToken: string): Promise<any> {
    try {
      const res = await fetch(`${SERVER_URL}/api/documents/${docToken}`);
      return await res.json();
    } catch (err: any) {
      return { success: false, error: 'NETWORK_ERROR', message: err.message };
    }
  }

  public async createDocumentLink(sessionId: string, params: { clientName?: string; clientEmail?: string; expiresInDays?: number }): Promise<any> {
    try {
      const res = await fetch(`${SERVER_URL}/api/sessions/${sessionId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  public async revokeDocumentLink(docToken: string): Promise<any> {
    try {
      const res = await fetch(`${SERVER_URL}/api/documents/${docToken}/revoke`, {
        method: 'POST',
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  public async fetchSessionDocuments(sessionId: string): Promise<any[]> {
    try {
      const res = await fetch(`${SERVER_URL}/api/sessions/${sessionId}/documents`);
      if (res.ok) return await res.json();
      return [];
    } catch {
      return [];
    }
  }

  public async addRealParticipant(sessionId: string, data: { name: string; paddleNumber: string; location?: string; maxBidLimit?: number }) {
    try {
      const res = await fetch(`${SERVER_URL}/api/sessions/${sessionId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch {
      return null;
    }
  }

  public async createBudgetRequest(sessionId: string, brokerToken: string, requestedAmount: number) {
    try {
      const res = await fetch(`${SERVER_URL}/api/sessions/${sessionId}/budget-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brokerToken, requestedAmount }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  public async respondBudgetRequest(requestId: string, buyerToken: string, decision: 'approve' | 'reject', rejectionReason?: string) {
    try {
      const res = await fetch(`${SERVER_URL}/api/budget-authorizations/${requestId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyerToken, decision, rejectionReason }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  public async fetchBudgetRequests(sessionId: string) {
    try {
      const res = await fetch(`${SERVER_URL}/api/sessions/${sessionId}/budget-requests`);
      return await res.json();
    } catch {
      return [];
    }
  }

  public async revokeParticipantAccess(sessionId: string, target: 'broker' | 'buyer') {
    try {
      const res = await fetch(`${SERVER_URL}/api/sessions/${sessionId}/revoke-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  public async restoreParticipantAccess(sessionId: string, target: 'broker' | 'buyer') {
    try {
      const res = await fetch(`${SERVER_URL}/api/sessions/${sessionId}/restore-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  public async updateStartingPrice(sessionId: string, price: number) {
    const target = sessionId || 'ses-live-001';
    this.localSessionState.currentPrice = price;
    this.localSessionState.startingPrice = price;

    this.dispatchSyncEvent({
      type: 'STATUS_CHANGE',
      sessionId: target,
      currentPrice: price,
      startingPrice: price,
      status: this.localSessionState.status,
    }, true);

    try {
      const res = await fetch(`${SERVER_URL}/api/sessions/${target}/set-price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price }),
      });
      return await res.json();
    } catch {
      return { success: true, price };
    }
  }

  public async updateLotParameters(sessionId: string, params: {
    startingPrice?: number;
    minIncrement?: number;
    reservePrice?: number;
    clientMaxBudget?: number;
    currentPrice?: number;
    brokerName?: string;
    buyerName?: string;
    referenceUrl?: string;
    lotNumber?: string;
  }) {
    const target = sessionId || 'ses-live-001';
    if (params.startingPrice) this.localSessionState.startingPrice = params.startingPrice;
    if (params.currentPrice !== undefined) this.localSessionState.currentPrice = params.currentPrice;
    if (params.referenceUrl && this.localSessionState.vehicle) {
      this.localSessionState.vehicle.reference_url = params.referenceUrl;
    }
    if (params.lotNumber && this.localSessionState.vehicle) {
      this.localSessionState.vehicle.lot_number = params.lotNumber;
    }

    this.dispatchSyncEvent({
      type: 'STATUS_CHANGE',
      sessionId: target,
      startingPrice: params.startingPrice,
      currentPrice: params.currentPrice ?? params.startingPrice,
      minIncrement: params.minIncrement,
      reservePrice: params.reservePrice,
      clientMaxBudget: params.clientMaxBudget,
      brokerName: params.brokerName,
      buyerName: params.buyerName,
      referenceUrl: params.referenceUrl,
      lotNumber: params.lotNumber,
    }, true);

    try {
      const res = await fetch(`${SERVER_URL}/api/sessions/${target}/update-params`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      return await res.json();
    } catch {
      return { success: true, params };
    }
  }

  public async sendAnnouncement(sessionId: string, text: string) {
    const trimmedText = String(text || '').trim();
    const announcementMsg = {
      type: 'ROOM_ANNOUNCEMENT',
      sessionId: sessionId || 'ses-live-001',
      text: trimmedText,
      timestamp: new Date().toISOString(),
    };
    this.dispatchSyncEvent(announcementMsg, true);

    try {
      const res = await fetch(`${this.getServerUrl()}/api/sessions/${sessionId}/announcement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmedText }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  public async setViewersCount(sessionId: string, count: number) {
    const finalCount = Math.max(1, count);
    const syncMsg = {
      type: 'SPECTATOR_JOINED',
      sessionId: sessionId || 'ses-live-001',
      viewersCount: finalCount,
      timestamp: new Date().toISOString(),
    };
    this.dispatchSyncEvent(syncMsg, true);

    try {
      const res = await fetch(`${this.getServerUrl()}/api/sessions/${sessionId}/viewers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: finalCount }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  public getResults(): AuctionResult[] {
    const raw = localStorage.getItem('copart_results_v1');
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
  }

  public getMetrics(): DashboardMetrics {
    const clients = this.getClients();
    const vehicles = this.getVehicles();
    const sessions = this.getSessions();

    return {
      totalClients: clients.length,
      totalVehicles: vehicles.length,
      preparedAuctions: sessions.filter((s) => s.status === 'prepared').length,
      activeAuctions: sessions.filter((s) => ['open', 'bidding', 'last_call'].includes(s.status)).length,
      finishedAuctions: sessions.filter((s) => ['sold', 'unsold', 'closed'].includes(s.status)).length,
    };
  }

  public getServerUrl(): string {
    return SERVER_URL;
  }

  public isOnline(): boolean {
    return this.isServerOnline;
  }

  public setServerUrl(url: string): void {
    this.setCustomBackendUrl(url);
  }

  public subscribeRoom(roomToken: string, opts?: { role?: string; brokerToken?: string; buyerToken?: string; isAuctioneer?: boolean }): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    try {
      this.ws.send(JSON.stringify({
        type: 'SUBSCRIBE',
        roomToken: roomToken || 'copart-live-m729k1',
        role: opts?.role || (opts?.isAuctioneer ? 'auctioneer' : 'spectator'),
        brokerToken: opts?.brokerToken,
        buyerToken: opts?.buyerToken,
        isAuctioneer: Boolean(opts?.isAuctioneer),
      }));
    } catch { }
  }

  public setCustomBackendUrl(url: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('AUCTION_BACKEND_URL', url.trim());
      window.location.reload();
    }
  }
}

export const store = new RealAuctionStore();

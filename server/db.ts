import Database from 'better-sqlite3';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.resolve('data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

export function initDatabase(dbPath: string = path.join(DB_DIR, 'auction.db')) {
  const db = new Database(dbPath);
  
  // Habilitar Write-Ahead Logging (WAL) para máxima concurrencia y ACID
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // 1. Tabla de sesiones
  db.exec(`
    CREATE TABLE IF NOT EXISTS auction_sessions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      lot_number TEXT NOT NULL,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      year INTEGER NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('prepared', 'open', 'bidding', 'last_call', 'paused', 'sold', 'unsold', 'closed')),
      starting_price NUMERIC NOT NULL,
      min_increment NUMERIC NOT NULL,
      reserve_price NUMERIC NOT NULL,
      current_price NUMERIC NOT NULL,
      client_max_budget NUMERIC DEFAULT 14000,
      current_winner_paddle TEXT,
      current_winner_name TEXT,
      current_winner_id TEXT,
      bid_count INTEGER NOT NULL DEFAULT 0,
      time_remaining_seconds INTEGER NOT NULL,
      total_duration_seconds INTEGER NOT NULL,
      room_token TEXT UNIQUE NOT NULL,
      is_token_revoked INTEGER NOT NULL DEFAULT 0,
      vehicle_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  try {
    db.exec(`ALTER TABLE auction_sessions ADD COLUMN client_max_budget NUMERIC DEFAULT 14000;`);
  } catch {}

  try {
    db.exec(`ALTER TABLE auction_sessions ADD COLUMN broker_access_token TEXT;`);
  } catch {}

  try {
    db.exec(`ALTER TABLE auction_sessions ADD COLUMN broker_token_revoked INTEGER DEFAULT 0;`);
  } catch {}

  try {
    db.exec(`ALTER TABLE auction_sessions ADD COLUMN buyer_access_token TEXT;`);
  } catch {}

  try {
    db.exec(`ALTER TABLE auction_sessions ADD COLUMN buyer_token_revoked INTEGER DEFAULT 0;`);
  } catch {}

  try {
    db.exec(`ALTER TABLE auction_sessions ADD COLUMN buyer_name TEXT DEFAULT 'Comprador Autorizado';`);
  } catch {}

  try {
    db.exec(`ALTER TABLE auction_sessions ADD COLUMN broker_name TEXT DEFAULT 'Broker Representante';`);
  } catch {}

  // 2. Tabla de participantes con Hash Criptográfico de Token (NUNCA en texto plano)
  db.exec(`
    CREATE TABLE IF NOT EXISTS auction_participants (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES auction_sessions(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      paddle_number TEXT NOT NULL,
      location TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      authorization_status TEXT NOT NULL CHECK (authorization_status IN ('approved', 'pending', 'suspended')),
      max_bid_limit NUMERIC,
      created_at TEXT NOT NULL,
      last_active_at TEXT,
      UNIQUE(session_id, paddle_number)
    );
  `);

  // 3. Tabla de ofertas con clave foránea e índice
  db.exec(`
    CREATE TABLE IF NOT EXISTS auction_bids (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES auction_sessions(id) ON DELETE CASCADE,
      participant_id TEXT NOT NULL REFERENCES auction_participants(id),
      paddle_number TEXT NOT NULL,
      bidder_name TEXT NOT NULL,
      location TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      sequence_number INTEGER NOT NULL,
      server_timestamp TEXT NOT NULL,
      UNIQUE(session_id, sequence_number)
    );
  `);

  // 4. Tabla de resultados finales
  db.exec(`
    CREATE TABLE IF NOT EXISTS auction_results (
      id TEXT PRIMARY KEY,
      session_id TEXT UNIQUE NOT NULL REFERENCES auction_sessions(id) ON DELETE CASCADE,
      lot_number TEXT NOT NULL,
      vehicle_summary TEXT NOT NULL,
      final_price NUMERIC NOT NULL,
      total_bids INTEGER NOT NULL,
      winner_paddle TEXT NOT NULL,
      winner_name TEXT NOT NULL,
      finished_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // 5. Tabla de enlaces documentales independientes (con permisos, expiración y revocación)
  db.exec(`
    CREATE TABLE IF NOT EXISTS document_access_tokens (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES auction_sessions(id) ON DELETE CASCADE,
      doc_token TEXT UNIQUE NOT NULL,
      client_name TEXT NOT NULL,
      client_email TEXT,
      title TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      is_revoked INTEGER NOT NULL DEFAULT 0,
      revoked_at TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // 6. Tabla de autorizaciones extraordinarias de presupuesto del comprador
  db.exec(`
    CREATE TABLE IF NOT EXISTS budget_authorizations (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES auction_sessions(id) ON DELETE CASCADE,
      broker_token_hash TEXT NOT NULL,
      buyer_token_hash TEXT NOT NULL,
      initial_budget NUMERIC NOT NULL,
      requested_amount NUMERIC NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'used')),
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      responded_at TEXT,
      used_at TEXT,
      rejection_reason TEXT
    );
  `);

  return db;
}

// Utilidades criptográficas
export function generateSecureToken(): string {
  // Generador criptográficamente seguro con 256 bits de entropía
  return 'bdr_' + crypto.randomBytes(32).toString('hex');
}

export function hashToken(token: string): string {
  // Hash SHA-256 irreversible para almacenamiento en la base de datos
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}


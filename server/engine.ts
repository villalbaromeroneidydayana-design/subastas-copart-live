import type Database from 'better-sqlite3';
import { hashToken } from './db';

export interface BidResult {
  success: boolean;
  bid?: {
    id: string;
    sessionId: string;
    participantId: string;
    paddleNumber: string;
    bidderName: string;
    location: string;
    amount: number;
    sequenceNumber: number;
    serverTimestamp: string;
  };
  session?: {
    currentPrice: number;
    bidCount: number;
    timeRemainingSeconds: number;
    currentWinnerPaddle: string;
    currentWinnerName: string;
    status: string;
  };
  error?: string;
}

// ==============================================================================
// FUNCIÓN ATÓMICA DE OFERTAS: placeBidAtomic
// Implementación transaccional equivalente a la función PostgreSQL place_bid()
// ==============================================================================
export function placeBidAtomic(
  db: Database.Database,
  sessionId: string,
  rawToken: string,
  amount: number
): BidResult {
  const tokenHash = hashToken(rawToken);

  const executeAtomic = db.transaction(() => {
    // 1. Obtener la sesión con bloqueo exclusivo
    const session = db
      .prepare('SELECT * FROM auction_sessions WHERE id = ?')
      .get(sessionId) as any;

    if (!session) {
      throw new Error('La sesión de subasta no existe');
    }

    // 2. Verificar estado activo de la subasta
    if (!['open', 'bidding', 'last_call'].includes(session.status)) {
      throw new Error(`La subasta no está aceptando ofertas en este momento (Estado actual: ${session.status})`);
    }

    // 3. Validar participante por su Token Hash seguro
    const participant = db
      .prepare('SELECT * FROM auction_participants WHERE session_id = ? AND token_hash = ?')
      .get(sessionId, tokenHash) as any;

    if (!participant) {
      throw new Error('Participante no reconocido o token inválido');
    }

    if (participant.authorization_status !== 'approved') {
      throw new Error(`El participante no cuenta con autorización para ofertar (Estado actual: ${participant.authorization_status})`);
    }

    // 4. Validar límite crediticio y presupuesto máximo del cliente
    if (participant.max_bid_limit && amount > participant.max_bid_limit) {
      throw new Error(`La oferta de $${amount.toLocaleString()} supera el límite crediticio autorizado de $${participant.max_bid_limit.toLocaleString()}`);
    }

    if (session.client_max_budget && participant.paddle_number?.includes('101') && amount > session.client_max_budget) {
      const nowIso = new Date().toISOString();
      // Comprobar si existe una Autorización Extraordinaria válida aprobada por el comprador
      const auth = db.prepare(`
        SELECT * FROM budget_authorizations
        WHERE session_id = ?
          AND broker_token_hash = ?
          AND requested_amount = ?
          AND status = 'approved'
          AND expires_at > ?
        ORDER BY created_at DESC
        LIMIT 1
      `).get(sessionId, tokenHash, amount, nowIso) as any;

      if (!auth) {
        throw new Error(`La oferta de $${amount.toLocaleString()} USD supera el presupuesto máximo autorizado por el cliente ($${Number(session.client_max_budget).toLocaleString()} USD) y requiere autorización extraordinaria previa del comprador.`);
      }

      // Consumir la autorización inmediatamente (REGLA: monouso para esa oferta exacta)
      db.prepare(`
        UPDATE budget_authorizations
        SET status = 'used', used_at = ?
        WHERE id = ?
      `).run(nowIso, auth.id);
    }

    // 5. Validar superación del precio actual e incremento mínimo
    const minRequired = session.current_price + session.min_increment;
    if (amount < minRequired) {
      throw new Error(`Oferta insuficiente. Debe ser de al menos $${minRequired.toLocaleString()} USD (Precio actual: $${session.current_price.toLocaleString()}, Incremento: $${session.min_increment})`);
    }

    // 6. Calcular nuevo número de secuencia
    const newSeq = session.bid_count + 1;
    const bidId = 'bid-' + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();

    // 7. Regla de reloj Copart VB3: si entra oferta en últimos segundos, restaurar a mínimo 10s
    const newTime = Math.max(session.time_remaining_seconds, 10);

    // 8. Insertar la oferta en el registro inmutable
    db.prepare(`
      INSERT INTO auction_bids (
        id, session_id, participant_id, paddle_number, bidder_name, location, amount, sequence_number, server_timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      bidId,
      session.id,
      participant.id,
      participant.paddle_number,
      participant.name,
      participant.location,
      amount,
      newSeq,
      now
    );

    // 9. Actualizar estado de la subasta de forma estrictamente atómica
    db.prepare(`
      UPDATE auction_sessions
      SET 
        current_price = ?,
        current_winner_paddle = ?,
        current_winner_name = ?,
        current_winner_id = ?,
        bid_count = ?,
        time_remaining_seconds = ?,
        status = 'bidding',
        updated_at = ?
      WHERE id = ?
    `).run(
      amount,
      participant.paddle_number,
      participant.name,
      participant.id,
      newSeq,
      newTime,
      now,
      session.id
    );

    // 10. Actualizar última actividad del participante
    db.prepare(`
      UPDATE auction_participants
      SET last_active_at = ?
      WHERE id = ?
    `).run(now, participant.id);

    return {
      bid: {
        id: bidId,
        sessionId: session.id,
        participantId: participant.id,
        paddleNumber: participant.paddle_number,
        bidderName: participant.name,
        location: participant.location,
        amount,
        sequenceNumber: newSeq,
        serverTimestamp: now,
      },
      session: {
        currentPrice: amount,
        bidCount: newSeq,
        timeRemainingSeconds: newTime,
        currentWinnerPaddle: participant.paddle_number,
        currentWinnerName: participant.name,
        status: 'bidding',
      }
    };
  });

  try {
    const result = executeAtomic();
    return {
      success: true,
      bid: result.bid,
      session: result.session,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Error en la transacción atómica de oferta',
    };
  }
}


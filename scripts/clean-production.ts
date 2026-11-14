import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.resolve('data', 'auction.db'));
db.pragma('foreign_keys = ON');

console.log('--- PURGANDO SESIONES Y DATOS DE AUDITORÍA ---');
db.prepare("DELETE FROM auction_bids WHERE session_id != 'ses-live-001'").run();
db.prepare("DELETE FROM auction_participants WHERE session_id != 'ses-live-001'").run();
db.prepare("DELETE FROM document_access_tokens WHERE session_id != 'ses-live-001'").run();
db.prepare("DELETE FROM auction_results WHERE session_id != 'ses-live-001'").run();
db.prepare("DELETE FROM auction_sessions WHERE id != 'ses-live-001'").run();

// Restablecer la sesión principal a estado 'prepared'
db.prepare(`
  UPDATE auction_sessions
  SET status = 'prepared', current_price = starting_price, bid_count = 0,
      time_remaining_seconds = total_duration_seconds, is_token_revoked = 0,
      current_winner_paddle = null, current_winner_name = null
  WHERE id = 'ses-live-001'
`).run();

db.pragma('wal_checkpoint(TRUNCATE)');
console.log('BASE DE DATOS LIMPIA Y OPTIMIZADA:');
console.log(db.prepare('SELECT id, lot_number, status, current_price FROM auction_sessions').all());
db.close();


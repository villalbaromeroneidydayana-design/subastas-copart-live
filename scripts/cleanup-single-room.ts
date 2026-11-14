import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'data', 'auction.db'));
db.prepare("DELETE FROM auction_sessions WHERE id != 'ses-live-001'").run();
const rows = db.prepare("SELECT id, lot_number, title, buyer_name, client_max_budget FROM auction_sessions").all();
console.log('Single live room in SQLite:', rows);


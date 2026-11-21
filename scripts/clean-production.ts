import Database from 'better-sqlite3';
import path from 'path';
import { hashToken } from '../server/db';
import { INITIAL_VEHICLES } from '../src/services/seedData';

const db = new Database(path.resolve('data', 'auction.db'));
db.pragma('foreign_keys = ON');

console.log('--- PURGANDO SESIONES, DATOS DE AUDITORÍA Y LOTES DE PRUEBA ---');

// 1. Eliminar datos vinculados a sesiones no canónicas
db.prepare("DELETE FROM auction_bids WHERE session_id != 'ses-live-001'").run();
db.prepare("DELETE FROM auction_participants WHERE session_id != 'ses-live-001'").run();
db.prepare("DELETE FROM document_access_tokens WHERE session_id != 'ses-live-001'").run();
db.prepare("DELETE FROM auction_results WHERE session_id != 'ses-live-001'").run();
db.prepare("DELETE FROM auction_sessions WHERE id != 'ses-live-001'").run();

// 2. Limpiar inventario de vehículos de prueba
try {
  db.prepare("DELETE FROM vehicles_inventory WHERE id LIKE '%test%' OR lot_number LIKE 'TEST%'").run();
} catch (e) {}

// 3. Sincronizar todos los vehículos del catálogo inicial en vehicles_inventory
for (const veh of INITIAL_VEHICLES) {
  try {
    const existingVeh = db.prepare('SELECT id FROM vehicles_inventory WHERE id = ?').get(veh.id);
    if (!existingVeh) {
      db.prepare(`
        INSERT INTO vehicles_inventory (id, lot_number, vin, brand, model, year, data_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).run(
        veh.id,
        veh.lot_number,
        veh.vin,
        veh.brand,
        veh.model,
        veh.year,
        JSON.stringify(veh)
      );
    } else {
      db.prepare(`
        UPDATE vehicles_inventory
        SET data_json = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(JSON.stringify(veh), veh.id);
    }
  } catch (e) {
    console.log('Nota vehículos:', e);
  }
}
const primaryVehicle = INITIAL_VEHICLES.find((v) => v.id === 'veh-sequoia-2025-trd') || INITIAL_VEHICLES[0];

// 4. Restablecer la sesión principal con la Toyota Sequoia TRD Pro 2025
db.prepare(`
  UPDATE auction_sessions
  SET title = ?,
      lot_number = ?,
      brand = ?,
      model = ?,
      year = ?,
      status = 'prepared',
      starting_price = 5500,
      min_increment = 250,
      reserve_price = 24000,
      current_price = 5500,
      client_max_budget = 24000,
      bid_count = 0,
      time_remaining_seconds = 15,
      total_duration_seconds = 15,
      is_token_revoked = 0,
      current_winner_paddle = null,
      current_winner_name = null,
      current_winner_id = null,
      vehicle_json = ?,
      room_token = 'copart-live-m729k1',
      broker_access_token = 'bdr_broker_m729k1',
      buyer_access_token = 'bdr_buyer_m729k1',
      updated_at = datetime('now')
  WHERE id = 'ses-live-001'
`).run(
  `Subasta Oficial en Vivo - 2025 Toyota Sequoia TRD Pro 4WD`,
  primaryVehicle.lot_number,
  primaryVehicle.brand,
  primaryVehicle.model,
  primaryVehicle.year,
  JSON.stringify(primaryVehicle)
);

// 5. Restablecer las 7 paletas oficiales de sala
db.prepare("DELETE FROM auction_participants WHERE session_id = 'ses-live-001'").run();
const now = new Date().toISOString();
const paddles = [
  { id: 'part-bdr-broker', name: 'Broker Autorizado (Miami, FL)', paddle: 'Paleta #101', loc: 'Miami, FL', token: 'bdr_broker_m729k1' },
  { id: 'part-comp-1', name: 'AutoExport Dallas LLC', paddle: 'Paleta #108', loc: 'Dallas, TX', token: 'bdr_comp_dallas_108' },
  { id: 'part-comp-2', name: 'Pacific Salvage Auctions', paddle: 'Paleta #214', loc: 'Los Angeles, CA', token: 'bdr_comp_pacific_214' },
  { id: 'part-comp-3', name: 'Global Fleet Buyers Inc', paddle: 'Paleta #305', loc: 'Atlanta, GA', token: 'bdr_comp_global_305' },
  { id: 'part-comp-4', name: 'Buckeye Motor Exchange', paddle: 'Paleta #412', loc: 'Columbus, OH', token: 'bdr_comp_buckeye_412' },
  { id: 'part-comp-5', name: 'Lone Star Salvage Group', paddle: 'Paleta #519', loc: 'Houston, TX', token: 'bdr_comp_lonestar_519' },
  { id: 'part-comp-6', name: 'Midwest Premier Liquidation', paddle: 'Paleta #623', loc: 'Chicago, IL', token: 'bdr_comp_midwest_623' },
];

for (const p of paddles) {
  db.prepare(`
    INSERT INTO auction_participants (id, session_id, name, paddle_number, location, token_hash, authorization_status, created_at)
    VALUES (?, 'ses-live-001', ?, ?, ?, ?, 'approved', ?)
  `).run(p.id, p.name, p.paddle, p.loc, hashToken(p.token), now);
}

db.pragma('wal_checkpoint(TRUNCATE)');
console.log('✅ BASE DE DATOS LIMPIA Y SINCRONIZADA:');
console.log(db.prepare('SELECT id, lot_number, title, status, current_price FROM auction_sessions').all());
db.close();

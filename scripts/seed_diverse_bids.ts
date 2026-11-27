import Database from 'better-sqlite3';

const db = new Database('data/auction.db');

// Limpiar bids viejas de la sesión de camry
db.prepare("DELETE FROM auction_bids WHERE session_id = 'ses-live-camry-johan'").run();

const diverseBids = [
  { id: 'bid-can-1', sessionId: 'ses-live-camry-johan', paddle: 'Paleta #720', name: 'Maple Leaf Remarketing', loc: 'Toronto, Canada', amount: 4600, seq: 1 },
  { id: 'bid-usa-1', sessionId: 'ses-live-camry-johan', paddle: 'Paleta #108', name: 'AutoExport Dallas LLC', loc: 'Dallas, TX', amount: 4700, seq: 2 },
  { id: 'bid-uae-1', sessionId: 'ses-live-camry-johan', paddle: 'Paleta #650', name: 'Emirates Auto Trading LLC', loc: 'Dubai, UAE', amount: 4800, seq: 3 },
  { id: 'bid-mex-1', sessionId: 'ses-live-camry-johan', paddle: 'Paleta #830', name: 'Monterrey Subastas', loc: 'Monterrey, Mexico', amount: 4900, seq: 4 },
];

const insertBid = db.prepare(`
  INSERT INTO auction_bids (id, session_id, participant_id, paddle_number, bidder_name, location, amount, sequence_number, server_timestamp)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

diverseBids.forEach((b) => {
  insertBid.run(b.id, b.sessionId, 'part-' + b.paddle, b.paddle, b.name, b.loc, b.amount, b.seq, new Date().toISOString());
});

db.prepare(`
  UPDATE auction_sessions
  SET current_price = 4900,
      current_winner_paddle = 'Paleta #830',
      current_winner_name = 'Monterrey Subastas',
      bid_count = 4
  WHERE id = 'ses-live-camry-johan'
`).run();

console.log('Diverse bids seeded successfully with flags: Canada 🇨🇦, USA 🇺🇸, UAE 🇦🇪, Mexico 🇲🇽!');

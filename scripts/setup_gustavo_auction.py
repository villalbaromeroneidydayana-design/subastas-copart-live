import sqlite3
import json

con = sqlite3.connect('data/auction.db')
cur = con.cursor()

# Get Corolla vehicle data from ses-live-corolla
row = cur.execute("SELECT vehicle_json FROM auction_sessions WHERE id = 'ses-live-corolla'").fetchone()
vehicle_json = row[0]

# Configure ses-live-corolla for Gustavo
cur.execute("""
UPDATE auction_sessions
SET status = 'prepared',
    starting_price = 700,
    current_price = 700,
    min_increment = 50,
    reserve_price = 1800,
    client_max_budget = 2500,
    bid_count = 0,
    current_winner_paddle = NULL,
    current_winner_name = NULL,
    time_remaining_seconds = 15,
    total_duration_seconds = 15,
    is_token_revoked = 0,
    buyer_token_revoked = 0,
    broker_token_revoked = 0,
    buyer_name = 'Gustavo Medal (Comprador)'
WHERE id = 'ses-live-corolla'
""")

# Mirror onto ses-live-001 so both tokens work identically
cur.execute("""
UPDATE auction_sessions
SET title = 'Subasta Oficial en Vivo - 2015 Toyota Corolla LE',
    lot_number = '67797166',
    brand = 'Toyota',
    model = 'Corolla LE',
    year = 2015,
    status = 'prepared',
    starting_price = 700,
    current_price = 700,
    min_increment = 50,
    reserve_price = 1800,
    client_max_budget = 2500,
    bid_count = 0,
    current_winner_paddle = NULL,
    current_winner_name = NULL,
    time_remaining_seconds = 15,
    total_duration_seconds = 15,
    is_token_revoked = 0,
    buyer_token_revoked = 0,
    broker_token_revoked = 0,
    buyer_name = 'Gustavo Medal (Comprador)',
    vehicle_json = ?
WHERE id = 'ses-live-001'
""", (vehicle_json,))

# Clear bids
cur.execute("DELETE FROM auction_bids WHERE session_id IN ('ses-live-001', 'ses-live-corolla')")

# Add competitors to ses-live-corolla
import hashlib

import datetime
now = datetime.datetime.now().isoformat()

competitors = [
    ("part-cor-comp-1", "ses-live-corolla", "AutoExport Dallas LLC", "Paleta #108", "Dallas, TX", hashlib.sha256(b"dallas_108").hexdigest(), "approved", now),
    ("part-cor-comp-2", "ses-live-corolla", "Pacific Salvage Auctions", "Paleta #214", "Los Angeles, CA", hashlib.sha256(b"la_214").hexdigest(), "approved", now),
    ("part-cor-comp-3", "ses-live-corolla", "Global Fleet Buyers Inc", "Paleta #305", "Atlanta, GA", hashlib.sha256(b"atlanta_305").hexdigest(), "approved", now),
    ("part-cor-comp-4", "ses-live-corolla", "Buckeye Motor Exchange", "Paleta #412", "Columbus, OH", hashlib.sha256(b"columbus_412").hexdigest(), "approved", now),
    ("part-cor-comp-5", "ses-live-corolla", "Lone Star Salvage Group", "Paleta #519", "Houston, TX", hashlib.sha256(b"houston_519").hexdigest(), "approved", now),
    ("part-cor-comp-6", "ses-live-corolla", "Midwest Premier Liquidation", "Paleta #623", "Chicago, IL", hashlib.sha256(b"chicago_623").hexdigest(), "approved", now),
]

for c in competitors:
    cur.execute("""
    INSERT INTO auction_participants (id, session_id, name, paddle_number, location, token_hash, authorization_status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(session_id, paddle_number) DO UPDATE SET
        name = excluded.name,
        location = excluded.location,
        authorization_status = excluded.authorization_status
    """, c)

con.commit()
print("All configured successfully!")
con.close()

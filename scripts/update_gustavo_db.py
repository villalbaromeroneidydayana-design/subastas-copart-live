import sqlite3

conn = sqlite3.connect(r'd:\SUBASTAS\data\auction.db')
c = conn.cursor()

c.execute("""
UPDATE auction_sessions
SET buyer_name = 'Gustavo Adolfo Medal López',
    broker_name = 'David Rodríguez',
    broker_location = 'Wylie, TX',
    client_max_budget = 2500,
    status = 'prepared',
    starting_price = 700,
    current_price = 700,
    updated_at = CURRENT_TIMESTAMP
""")

c.execute("""
UPDATE auction_participants
SET name = 'David Rodríguez (Broker Rep. #101)',
    location = 'Wylie, TX'
WHERE paddle_number = '101'
""")

conn.commit()

c.execute("SELECT id, room_token, broker_name, buyer_name, client_max_budget, current_price, status FROM auction_sessions")
for r in c.fetchall():
    print("SESSION VERIFIED:", r)

conn.close()
print("All DB sessions 100% updated!")

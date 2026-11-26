import sqlite3

conn = sqlite3.connect(r'd:\SUBASTAS\data\auction.db')
c = conn.cursor()

c.execute("""
UPDATE auction_sessions 
SET broker_name = 'David Rodríguez',
    updated_at = CURRENT_TIMESTAMP
""")

c.execute("""
UPDATE auction_participants
SET name = 'David Rodríguez (Broker Rep. #101)'
WHERE paddle_number = '101'
""")

conn.commit()

c.execute("SELECT id, room_token, broker_name, buyer_name FROM auction_sessions")
for r in c.fetchall():
    print("Session:", r)

conn.close()
print("Successfully set broker_name to David Rodríguez!")

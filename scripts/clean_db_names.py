import sqlite3

con = sqlite3.connect('data/auction.db')
cur = con.cursor()
cur.execute("UPDATE auction_sessions SET broker_name = 'Carlos Mendoza', buyer_name = 'Carlos Mendoza', current_winner_name = 'Carlos Mendoza' WHERE id = 'ses-live-001'")
cur.execute("UPDATE auction_participants SET name = 'Carlos Mendoza', location = 'Miami, FL' WHERE session_id = 'ses-live-001' AND paddle_number = 'Paleta #101'")
con.commit()
con.close()
print("Auction DB Cleaned successfully")

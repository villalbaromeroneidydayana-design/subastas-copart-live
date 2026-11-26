import sqlite3

con = sqlite3.connect('data/auction.db')
cur = con.cursor()
cur.execute("UPDATE auction_sessions SET status = 'prepared', is_token_revoked = 0, buyer_token_revoked = 0, broker_token_revoked = 0")
con.commit()
print(f"Updated {cur.rowcount} sessions to prepared and unrevoked.")

rows = cur.execute("SELECT id, room_token, status, is_token_revoked FROM auction_sessions").fetchall()
for r in rows:
    print(r)
con.close()

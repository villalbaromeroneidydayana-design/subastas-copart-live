with open('server/index.ts', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    ("'Broker Autorizado (Representante)',", "'David Rodríguez',"),
    ("'Carlos Mendoza (Comprador)',", "'Gustavo Adolfo Medal López',"),
    ("buyer_name = 'Carlos Mendoza (Comprador)'", "buyer_name = 'Gustavo Adolfo Medal López'"),
    ("broker_name = 'Broker Autorizado (Representante)'", "broker_name = 'David Rodríguez'"),
    ("buyerName: r.buyer_name || 'Carlos Mendoza (Comprador)'", "buyerName: r.buyer_name || 'Gustavo Adolfo Medal López'"),
    ("buyer_name: r.buyer_name || 'Carlos Mendoza (Comprador)'", "buyer_name: r.buyer_name || 'Gustavo Adolfo Medal López'"),
    ("session.buyer_name || 'Carlos Mendoza'", "session.buyer_name || 'Gustavo Adolfo Medal López'"),
    ("brokerName: r.broker_name || 'Broker Autorizado (Representante)'", "brokerName: r.broker_name || 'David Rodríguez'"),
    ("brokerName: r.broker_name || 'Broker Autorizado'", "brokerName: r.broker_name || 'David Rodríguez'"),
    ("broker_name: r.broker_name || 'Broker Autorizado'", "broker_name: r.broker_name || 'David Rodríguez'"),
    ("'Carlos Mendoza',", "'David Rodríguez',"),
    ("client_max_budget = 7500,", "client_max_budget = 2500,"),
    ("status = 'open',", "status = 'prepared',"),
]

for old, new in replacements:
    content = content.replace(old, new)

with open('server/index.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("server/index.ts successfully updated with David Rodríguez and Gustavo Adolfo Medal López!")

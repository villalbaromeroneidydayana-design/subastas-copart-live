with open('server/index.ts', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    ("finalBrokerName || 'Carlos Mendoza'", "finalBrokerName || 'David Rodríguez'"),
    ("brokerName: r.broker_name || 'Carlos Mendoza'", "brokerName: r.broker_name || 'David Rodríguez'"),
    ("broker_name: r.broker_name || 'Carlos Mendoza'", "broker_name: r.broker_name || 'David Rodríguez'"),
    ("'Paleta #101': { name: session.broker_name || 'Carlos Mendoza'", "'Paleta #101': { name: session.broker_name || 'David Rodríguez'"),
    ("name = 'Carlos Mendoza (Broker Rep. #101)'", "name = 'David Rodríguez (Broker Rep. #101)'"),
    ("session.broker_name || 'Carlos Mendoza'", "session.broker_name || 'David Rodríguez'"),
]

for old, new in replacements:
    content = content.replace(old, new)

with open('server/index.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated server/index.ts with David Rodríguez defaults successfully!")

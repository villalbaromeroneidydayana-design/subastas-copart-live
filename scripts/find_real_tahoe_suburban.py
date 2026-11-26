import urllib.request
import json
import ssl

ctx = ssl._create_unverified_context()
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

def search_term(q):
    payload = {
        "query": [q],
        "filter": {
            "MISC": ["vehicle_type_code:VEHTYPE_V"]
        },
        "page": 0,
        "size": 30
    }
    req = urllib.request.Request(
        'https://www.copart.com/public/lots/search',
        data=json.dumps(payload).encode('utf-8'),
        headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=10, context=ctx) as r:
            d = json.loads(r.read().decode('utf-8'))
            return d.get('data', {}).get('results', {}).get('content', [])
    except Exception as e:
        print("Error:", e)
        return []

if __name__ == '__main__':
    items = search_term("Chevrolet Suburban 2021")
    print(f"Results for Suburban: {len(items)}")
    for it in items[:15]:
        lot = it.get('lotNumberStr')
        yr = it.get('lcy')
        md = it.get('lm')
        yd = it.get('yn')
        dmg = it.get('dd')
        lcd = it.get('lcd')
        val = it.get('la')
        print(f"LOT #{lot} | {yr} {md} | Yard: {yd} | Damage: {dmg} | Status: {lcd} | Val: {val}")

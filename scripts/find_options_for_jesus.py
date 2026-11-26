import urllib.request
import json
import ssl
import os

def search_copart(query_term):
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*'
    }

    payload = {
        "query": [query_term],
        "filter": {
            "MISC": ["vehicle_type_code:VEHTYPE_V"]
        },
        "page": 0,
        "size": 15
    }

    url = 'https://www.copart.com/public/lots/search'
    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=12, context=ctx) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            return data.get('data', {}).get('results', {}).get('content', [])
    except Exception as e:
        print(f"Error searching {query_term}:", e)
        return []

if __name__ == '__main__':
    print("Searching Copart for Jesus Eg options...")
    tacomas = search_copart("Toyota Tacoma 2016")
    wranglers = search_copart("Jeep Wrangler 2016")
    cherokees = search_copart("Jeep Grand Cherokee 2017")

    print(f"\n--- TACOMAS FOUND: {len(tacomas)} ---")
    for t in tacomas[:5]:
        lot = t.get('lotNumberStr')
        yr = t.get('lcy')
        md = t.get('lm')
        yd = t.get('yn')
        od = t.get('ord')
        doc = t.get('ld')
        dmg = t.get('dd')
        hl = t.get('al', [])
        print(f"Lot #{lot} | {yr} {md} | Yard: {yd} | Odo: {od} mi | Doc: {doc} | Damage: {dmg} | Highlights: {hl}")

    print(f"\n--- WRANGLERS FOUND: {len(wranglers)} ---")
    for w in wranglers[:5]:
        lot = w.get('lotNumberStr')
        yr = w.get('lcy')
        md = w.get('lm')
        yd = w.get('yn')
        od = w.get('ord')
        doc = w.get('ld')
        dmg = w.get('dd')
        hl = w.get('al', [])
        print(f"Lot #{lot} | {yr} {md} | Yard: {yd} | Odo: {od} mi | Doc: {doc} | Damage: {dmg} | Highlights: {hl}")

    print(f"\n--- CHEROKEES FOUND: {len(cherokees)} ---")
    for c in cherokees[:5]:
        lot = c.get('lotNumberStr')
        yr = c.get('lcy')
        md = c.get('lm')
        yd = c.get('yn')
        od = c.get('ord')
        doc = c.get('ld')
        dmg = c.get('dd')
        hl = c.get('al', [])
        print(f"Lot #{lot} | {yr} {md} | Yard: {yd} | Odo: {od} mi | Doc: {doc} | Damage: {dmg} | Highlights: {hl}")

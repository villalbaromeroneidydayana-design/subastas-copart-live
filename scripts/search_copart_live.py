import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/plain, */*'
}

payload = {
    "query": ["Honda HR-V"],
    "filter": {
        "MISC": ["vehicle_type_code:VEHTYPE_V"]
    },
    "page": 0,
    "size": 50
}

url = 'https://www.copart.com/public/lots/search'
req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers)

try:
    with urllib.request.urlopen(req, timeout=12, context=ctx) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        content = res.get('data', {}).get('results', {}).get('content', [])
        print(f"Total returned: {len(content)}")
        for item in content:
            lot = item.get('lotNumberStr')
            year = item.get('lcy')
            make = item.get('mkn')
            model = item.get('lm')
            damage = item.get('dd')
            status = item.get('lcd')
            yard = item.get('yn')
            odometer = item.get('ord')
            print(f"LOTE: {lot} | {year} {make} {model} | Yard: {yard} | Daño: {damage} | Status: {status}")
except Exception as e:
    print("Error:", e)

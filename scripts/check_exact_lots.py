import urllib.request
import json
import ssl

ctx = ssl._create_unverified_context()
headers = {'User-Agent': 'Mozilla/5.0'}

lots = ['69920096', '67642116', '71390516', '58303666', '74921036']
for l in lots:
    url = f'https://www.copart.com/public/data/lotdetails/solr/{l}'
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=8, context=ctx) as r:
            d = json.loads(r.read().decode('utf-8'))
            ld = d.get('data', {}).get('lotDetails', {})
            print(f"=== LOT #{l} ===")
            print(f"Desc: {ld.get('ld')}")
            print(f"Year/Make/Model: {ld.get('lcy')} {ld.get('mkn')} {ld.get('lm')}")
            print(f"Yard: {ld.get('yn')} | Odo: {ld.get('ord')} | Color: {ld.get('clr')}")
            print(f"Engine: {ld.get('eng')} | Drive: {ld.get('drv')} | Est. Retail: ${ld.get('la')}")
            print(f"Condition: {ld.get('lcd')} | Keys: {ld.get('hk')} | Damage: {ld.get('dd')}")
            print(f"Highlights: {ld.get('al')}")
    except Exception as e:
        print(f"Lot {l} error:", e)

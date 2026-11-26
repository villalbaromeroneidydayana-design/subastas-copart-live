import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

lots = ['69448906', '74297826', '70637836']
for l in lots:
    url = f'https://www.copart.com/public/data/lotdetails/solr/{l}'
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=5, context=ctx) as r:
            d = json.loads(r.read().decode())
            det = d.get('data', {}).get('lotDetails')
            if det:
                year = det.get('lcy')
                make = det.get('mkn')
                model = det.get('lm')
                yard = det.get('yn')
                dmg = det.get('dd')
                stat = det.get('lcd')
                clr = det.get('clr')
                keys = det.get('hk')
                print(f"{l}: ACTIVE -> {year} {make} {model} | Yard: {yard} | Dmg: {dmg} | Stat: {stat} | Color: {clr} | Keys: {keys}")
            else:
                print(f"{l}: NOT ACTIVE IN SOLR")
    except Exception as e:
        print(f"{l}: ERROR {e}")

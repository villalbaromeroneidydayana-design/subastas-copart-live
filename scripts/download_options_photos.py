import urllib.request
import json
import ssl
import os

ctx = ssl._create_unverified_context()
out_dir = r"d:\SUBASTAS\public\options_jesus"
os.makedirs(out_dir, exist_ok=True)

targets = [
    ("File:2016 Toyota Tacoma .jpg", "01_toyota_tacoma_2016_frente.jpg"),
    ("File:'16 Toyota Tacoma Crew Cab.jpg", "01_toyota_tacoma_2016_costado.jpg"),
    ("File:Our 2016 Jeep Wrangler Rubicon Unlimited.jpg", "02_jeep_wrangler_2016_costado.jpg"),
    ("File:Jeep Wrangler Unlimited JK Sahara (2016) (53506413977).jpg", "02_jeep_wrangler_2016_frente.jpg"),
    ("File:Jeep Grand Cherokee 2017 Makarska.jpg", "03_jeep_cherokee_2017_frente.jpg"),
]

for file_title, save_name in targets:
    url = f"https://commons.wikimedia.org/w/api.php?action=query&titles={urllib.parse.quote(file_title)}&prop=imageinfo&iiprop=url&format=json"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=10, context=ctx) as r:
            d = json.loads(r.read().decode('utf-8'))
            pages = d.get('query', {}).get('pages', {})
            for p in pages.values():
                img_url = p.get('imageinfo', [{}])[0].get('url')
                if img_url:
                    out_path = os.path.join(out_dir, save_name)
                    req_img = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'})
                    with urllib.request.urlopen(req_img, timeout=20, context=ctx) as r_img, open(out_path, 'wb') as f:
                        f.write(r_img.read())
                    sz = os.path.getsize(out_path)
                    print(f"Downloaded: {save_name} ({sz // 1024} KB)")
    except Exception as e:
        print(f"Error {file_title}:", e)

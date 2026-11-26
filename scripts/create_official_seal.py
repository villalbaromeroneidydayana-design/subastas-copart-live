from PIL import Image, ImageDraw, ImageFont
import math
import os

# Create a 700x300 high-res image
W, H = 700, 300
img = Image.new('RGBA', (W, H), (255, 255, 255, 0))
draw = ImageDraw.Draw(img)

# Rubber stamp colors: realistic slightly distressed ink blue
stamp_blue = (16, 52, 116, 235)
ink_sig = (18, 35, 128, 220)
gold_badge = (180, 120, 20, 240)

# 1. Left circular official stamp
cx, cy, r = 140, 150, 115
draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=stamp_blue, width=4)
draw.ellipse([cx - r + 8, cy - r + 8, cx + r - 8, cy + r - 8], outline=stamp_blue, width=2)
draw.ellipse([cx - r + 24, cy - r + 24, cx + r - 24, cy + r - 24], outline=stamp_blue, width=1)

# Inner circular text simulation
draw.text((cx, cy - 65), '★ COPART ★', fill=stamp_blue, anchor='mm', font_size=18)
draw.text((cx, cy - 40), 'PARTNER NETWORK', fill=stamp_blue, anchor='mm', font_size=13)
draw.text((cx, cy - 10), '★ ★ ★', fill=gold_badge, anchor='mm', font_size=16)
draw.text((cx, cy + 15), 'LICENSED BROKER', fill=stamp_blue, anchor='mm', font_size=14)
draw.text((cx, cy + 40), '#BK-78921-USA', fill=stamp_blue, anchor='mm', font_size=15)
draw.text((cx, cy + 65), 'OFFICIAL SEAL 2026', fill=(70, 85, 105, 230), anchor='mm', font_size=11)

# 2. Right box / certificate frame
bx1, by1, bx2, by2 = 280, 35, 680, 265
draw.rounded_rectangle([bx1, by1, bx2, by2], radius=10, outline=stamp_blue, width=3)
draw.rounded_rectangle([bx1 + 5, by1 + 5, bx2 - 5, by2 - 5], radius=7, outline=stamp_blue, width=1)

draw.text(((bx1 + bx2) // 2, by1 + 25), 'AUTORIZADO PARA SUBASTA EN VIVO', fill=stamp_blue, anchor='mm', font_size=14)
draw.text(((bx1 + bx2) // 2, by1 + 45), 'PALETA OFICIAL DE POSTOR #101', fill=(185, 28, 28, 240), anchor='mm', font_size=13)
draw.line([(bx1 + 20, by1 + 60), (bx2 - 20, by1 + 60)], fill=stamp_blue, width=1)

# Realistic signature lines
# Elegant cursive signature in blue ink
sig_points = [
    (310, 140), (330, 95), (345, 160), (360, 110), (380, 145), 
    (405, 125), (420, 165), (450, 105), (475, 145), (495, 125),
    (520, 155), (550, 110), (580, 140), (620, 115), (650, 150)
]
for offset in range(-1, 2):
    pts = [(x, y + offset) for x, y in sig_points]
    draw.line(pts, fill=ink_sig, width=2, joint='curve')

# Loop embellishments
draw.arc([315, 80, 365, 145], start=0, end=330, fill=ink_sig, width=2)
draw.arc([430, 85, 485, 145], start=40, end=350, fill=ink_sig, width=2)
draw.line([(310, 175), (650, 165)], fill=ink_sig, width=2)

draw.line([(bx1 + 20, by2 - 60), (bx2 - 20, by2 - 60)], fill=stamp_blue, width=1)
draw.text(((bx1 + bx2) // 2, by2 - 42), 'BROKER TITULAR CERTIFICADO — PUJAMOTOR USA', fill=stamp_blue, anchor='mm', font_size=13)
draw.text(((bx1 + bx2) // 2, by2 - 22), 'COPART USA BROKERAGE LICENSE #BK-78921-USA', fill=(80, 95, 115, 240), anchor='mm', font_size=11)

# Save
out_path = r'd:\SUBASTAS\public\sello_oficial_copart_broker.png'
img.save(out_path, format='PNG')
print(f'Seal saved to {out_path}')

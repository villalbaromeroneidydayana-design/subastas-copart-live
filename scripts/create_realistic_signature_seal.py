from PIL import Image, ImageDraw, ImageFont
import math
import os

W, H = 760, 310
img = Image.new('RGBA', (W, H), (255, 255, 255, 0))
draw = ImageDraw.Draw(img)

stamp_navy = (11, 46, 89, 245)
ink_blue = (12, 38, 115, 255)
ink_blue_trans = (12, 38, 115, 210)
gold_accent = (195, 135, 25, 245)
slate_text = (50, 70, 95, 235)

# 1. SELLO CIRCULAR OFICIAL DE COPART PARTNER NETWORK (Lado izquierdo)
cx, cy, r = 145, 155, 120
draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=stamp_navy, width=4)
draw.ellipse([cx - r + 6, cy - r + 6, cx + r - 6, cy + r - 6], outline=stamp_navy, width=1)
draw.ellipse([cx - r + 18, cy - r + 18, cx + r - 18, cy + r - 18], outline=stamp_navy, width=2)
draw.ellipse([cx - r + 24, cy - r + 24, cx + r - 24, cy + r - 24], outline=gold_accent, width=1)

font_stamp_bold = ImageFont.truetype("arialbd.ttf", 15)
font_stamp_sm = ImageFont.truetype("arialbd.ttf", 11)
font_stamp_xs = ImageFont.truetype("arial.ttf", 10)

draw.text((cx, cy - 70), '★ COPART BROKER ★', fill=stamp_navy, anchor='mm', font=font_stamp_bold)
draw.text((cx, cy - 46), 'PARTNER NETWORK USA', fill=stamp_navy, anchor='mm', font=font_stamp_sm)
draw.text((cx, cy - 16), '★ ★ ★ ★ ★', fill=gold_accent, anchor='mm', font=font_stamp_bold)
draw.text((cx, cy + 12), 'PALETA OFICIAL #101', fill=(185, 28, 28, 245), anchor='mm', font=font_stamp_bold)
draw.text((cx, cy + 38), 'LIC. #BK-78921-USA', fill=stamp_navy, anchor='mm', font=font_stamp_bold)
draw.text((cx, cy + 64), 'SELLO DIGITAL NOTARIADO 2026', fill=slate_text, anchor='mm', font=font_stamp_xs)

# 2. RECUADRO DE CERTIFICACIÓN DE FIRMA (Lado derecho)
bx1, by1, bx2, by2 = 290, 25, 735, 285
draw.rounded_rectangle([bx1, by1, bx2, by2], radius=10, fill=(248, 250, 252, 230), outline=stamp_navy, width=2)
draw.rounded_rectangle([bx1 + 4, by1 + 4, bx2 - 4, by2 - 4], radius=8, outline=(203, 213, 225, 255), width=1)

font_cert_hdr = ImageFont.truetype("arialbd.ttf", 11)
font_cert_sub = ImageFont.truetype("arial.ttf", 10)

draw.text(((bx1 + bx2) // 2, by1 + 22), 'AUTORIZACIÓN DE MANDATO Y REPRESENTACIÓN LEGAL', fill=stamp_navy, anchor='mm', font=font_cert_hdr)
draw.line([(bx1 + 25, by1 + 36), (bx2 - 25, by1 + 36)], fill=(203, 213, 225, 255), width=1)

# 3. FIRMA REALISTA EJECUTIVA EN TINTA AZUL PLUMA FUENTE
# Usamos Segoe Script Bold o Vladimir Script o Brush Script para una firma fluida y elegante
sig_font = None
for f_name in ["C:\\Windows\\Fonts\\segoescb.ttf", "C:\\Windows\\Fonts\\VLADIMIR.TTF", "C:\\Windows\\Fonts\\FRSCRIPT.TTF", "C:\\Windows\\Fonts\\BRUSHSCI.TTF"]:
    if os.path.exists(f_name):
        sig_font = ImageFont.truetype(f_name, 38 if "segoes" in f_name else 48)
        break

if not sig_font:
    sig_font = ImageFont.truetype("arialbd.ttf", 32)

# Crear imagen transparente para rotar la firma suavemente a -3 grados (inclinación natural humana)
sig_layer = Image.new('RGBA', (460, 120), (255, 255, 255, 0))
sig_draw = ImageDraw.Draw(sig_layer)

# Texto de la firma cursiva
sig_text = "D. Rodríguez Mendoza"
sig_draw.text((25, 20), sig_text, fill=ink_blue, font=sig_font)

# Rúbrica / Trazo decorativo de cierre de firma (bucle y trazo fluido)
# Curva suave bajo la firma simulando la pluma
rubric_points = [
    (15, 75), (55, 70), (120, 68), (200, 72), (280, 66), (360, 62), 
    (410, 58), (430, 52), (435, 42), (420, 36), (380, 42), (320, 65),
    (250, 82), (180, 88), (110, 90), (60, 86), (20, 82)
]
sig_draw.line(rubric_points, fill=ink_blue_trans, width=3, joint='curve')
sig_draw.line([(20, 76), (420, 60)], fill=ink_blue, width=2)

# Rotar suavemente -3 grados
rotated_sig = sig_layer.rotate(3.5, resample=Image.Resampling.BICUBIC, expand=True)

# Pegar la firma sobre el recuadro
img.paste(rotated_sig, (bx1 + 20, by1 + 45), rotated_sig)

# 4. PIE DE FIRMA: Aclaración de firma e identificación profesional
font_name = ImageFont.truetype("arialbd.ttf", 12)
font_title = ImageFont.truetype("arial.ttf", 10)
font_code = ImageFont.truetype("courbd.ttf", 9)

draw.line([(bx1 + 35, by2 - 58), (bx2 - 35, by2 - 58)], fill=stamp_navy, width=1)
draw.text(((bx1 + bx2) // 2, by2 - 44), 'LIC. DAVID RODRÍGUEZ MENDOZA', fill=stamp_navy, anchor='mm', font=font_name)
draw.text(((bx1 + bx2) // 2, by2 - 28), 'BROKER TITULAR AUTORIZADO • COPART VB3 ID #BK-78921-USA', fill=slate_text, anchor='mm', font=font_title)
draw.text(((bx1 + bx2) // 2, by2 - 14), 'CERTIFICADO DIGITAL SHA-256: 8F4A-9C21-B37E-0101-USA', fill=(100, 116, 139, 255), anchor='mm', font=font_code)

out_seal_1 = r"d:\SUBASTAS\public\sello_oficial_copart_broker.png"
out_seal_2 = r"d:\SUBASTAS\public\broker_official_seal.png"
img.save(out_seal_1, format="PNG")
img.save(out_seal_2, format="PNG")
print("Realistic executive signature & seal generated successfully!")

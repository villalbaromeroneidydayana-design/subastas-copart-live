import os
from PIL import Image, ImageDraw, ImageFont

FONTS_DIR = r"C:\Windows\Fonts"
FONT_ARIAL_BOLD = os.path.join(FONTS_DIR, "arialbd.ttf")
FONT_ARIAL = os.path.join(FONTS_DIR, "arial.ttf")
FONT_SEGOE_BOLD = os.path.join(FONTS_DIR, "segoeuib.ttf")

COPART_LOGO_PATH = r"d:\SUBASTAS\public\copart_logo_header.png"
COPART_SEAL_PATH = r"d:\SUBASTAS\public\sello_oficial_copart_broker.png"

def make_profile_picture():
    # 512 x 512
    W, H = 512, 512
    img = Image.new("RGBA", (W, H), (11, 46, 89, 255)) # Corporate Copart Navy
    draw = ImageDraw.Draw(img)

    # Gradient / Circular background
    for r in range(256, 0, -1):
        alpha_tint = int(255 - (256 - r) * 0.25)
        # Subtle gradient from #071D37 to #0E3B6E
        col = (7 + int(r * 0.04), 29 + int(r * 0.08), 55 + int(r * 0.15), 255)
        draw.ellipse([256 - r, 256 - r, 256 + r, 256 + r], fill=col)

    # Outer Circular Gold Ring (WhatsApp circular crop safe)
    draw.ellipse([18, 18, 494, 494], outline=(217, 119, 6, 255), width=5)
    draw.ellipse([24, 24, 488, 488], outline=(251, 191, 36, 120), width=2)

    # Paste Copart Logo at upper-center
    if os.path.exists(COPART_LOGO_PATH):
        logo = Image.open(COPART_LOGO_PATH).convert("RGBA")
        # Resize logo to fit nicely width ~280
        aspect = logo.height / logo.width
        lw = 270
        lh = int(lw * aspect)
        logo_resized = logo.resize((lw, lh), Image.Resampling.LANCZOS)
        # Paste centered at y=75
        lx = (W - lw) // 2
        img.paste(logo_resized, (lx, 70), logo_resized)

    # Divider bar
    draw.line([(90, 175), (422, 175)], fill=(217, 119, 6, 255), width=3)

    # Middle text: PUJAMOTOR USA
    font_title = ImageFont.truetype(FONT_ARIAL_BOLD, 30)
    font_sub = ImageFont.truetype(FONT_SEGOE_BOLD, 17)
    font_badge = ImageFont.truetype(FONT_ARIAL_BOLD, 15)
    font_foot = ImageFont.truetype(FONT_ARIAL, 13)

    t1 = "PUJAMOTOR USA"
    bbox1 = draw.textbbox((0, 0), t1, font=font_title)
    draw.text(((W - (bbox1[2] - bbox1[0])) // 2, 190), t1, font=font_title, fill=(255, 255, 255))

    t2 = "BROKER AUTORIZADO"
    bbox2 = draw.textbbox((0, 0), t2, font=font_sub)
    draw.text(((W - (bbox2[2] - bbox2[0])) // 2, 235), t2, font=font_sub, fill=(251, 191, 36))

    # Badge Pill: OFFICIAL BIDDER #101
    pill_w = 330
    pill_h = 44
    pill_x = (W - pill_w) // 2
    pill_y = 275
    draw.rounded_rectangle([pill_x, pill_y, pill_x + pill_w, pill_y + pill_h], radius=12, fill=(16, 122, 60, 255), outline=(255, 255, 255, 200), width=2)
    t3 = "★ PALETA OFICIAL #101 ★"
    bbox3 = draw.textbbox((0, 0), t3, font=font_badge)
    draw.text(((W - (bbox3[2] - bbox3[0])) // 2, pill_y + 11), t3, font=font_badge, fill=(255, 255, 255))

    # Details
    t4 = "SUBASTAS EN VIVO • LIC. #BK-78921-USA"
    bbox4 = draw.textbbox((0, 0), t4, font=font_foot)
    draw.text(((W - (bbox4[2] - bbox4[0])) // 2, 340), t4, font=font_foot, fill=(226, 232, 240))

    t5 = "TÍTULOS LIMPIOS • RUN & DRIVE CERTIFIED"
    bbox5 = draw.textbbox((0, 0), t5, font=font_foot)
    draw.text(((W - (bbox5[2] - bbox5[0])) // 2, 365), t5, font=font_foot, fill=(203, 213, 225))

    # Bottom Seal Badge
    t6 = "COPART MEMBER SERVICES PARTNER"
    font_tiny = ImageFont.truetype(FONT_ARIAL_BOLD, 12)
    bbox6 = draw.textbbox((0, 0), t6, font=font_tiny)
    draw.text(((W - (bbox6[2] - bbox6[0])) // 2, 420), t6, font=font_tiny, fill=(217, 119, 6))

    out_path = r"d:\SUBASTAS\public\whatsapp_profile_copart_broker.png"
    img.save(out_path, "PNG")
    print(f"Created WhatsApp Profile Picture: {out_path}")
    return out_path

def make_cover_banner():
    # 1200 x 675 (16:9 Aspect Ratio ideal for WhatsApp Business Banner)
    W, H = 1200, 675
    img = Image.new("RGBA", (W, H), (11, 46, 89, 255))
    draw = ImageDraw.Draw(img)

    # Horizontal background gradient
    for x in range(W):
        factor = x / W
        r = int(7 + 10 * factor)
        g = int(25 + 25 * factor)
        b = int(50 + 45 * factor)
        draw.line([(x, 0), (x, H)], fill=(r, g, b, 255))

    # Top Accent Gold Bar
    draw.rectangle([0, 0, W, 10], fill=(217, 119, 6, 255))
    draw.rectangle([0, 10, W, 14], fill=(251, 191, 36, 180))

    # Bottom Accent Bar
    draw.rectangle([0, H - 12, W, H], fill=(217, 119, 6, 255))

    # Left Column: Branding and Services
    if os.path.exists(COPART_LOGO_PATH):
        logo = Image.open(COPART_LOGO_PATH).convert("RGBA")
        lw = 280
        lh = int(lw * (logo.height / logo.width))
        logo_resized = logo.resize((lw, lh), Image.Resampling.LANCZOS)
        img.paste(logo_resized, (60, 45), logo_resized)

    font_brand = ImageFont.truetype(FONT_ARIAL_BOLD, 46)
    font_sub_brand = ImageFont.truetype(FONT_SEGOE_BOLD, 22)
    font_bullet = ImageFont.truetype(FONT_ARIAL, 20)
    font_bullet_bold = ImageFont.truetype(FONT_ARIAL_BOLD, 20)

    draw.text((60, 150), "PUJAMOTOR USA", font=font_brand, fill=(255, 255, 255))
    draw.text((60, 210), "BROKER Y POSTOR AUTORIZADO DE SUBASTAS COPART", font=font_sub_brand, fill=(251, 191, 36))

    # Gold separator line
    draw.line([(60, 250), (680, 250)], fill=(217, 119, 6, 255), width=3)

    bullets = [
        ("✔ ", "Adjudicación Directa en Subastas en Vivo (Paleta #101)"),
        ("✔ ", "Vehículos Certificados Run & Drive con Título Limpio (Clean Title)"),
        ("✔ ", "Despacho en Plataforma Nodriza a la Puerta de su Domicilio"),
        ("✔ ", "Garantía de Riesgo Cero ($0 USD): Cero cobros si no se gana"),
        ("✔ ", "Honorarios de Broker Pagaderos Únicamente con Llaves en Mano")
    ]

    y_off = 280
    for icon, text in bullets:
        draw.text((60, y_off), icon, font=font_bullet_bold, fill=(16, 185, 129)) # Emerald Green
        draw.text((100, y_off), text, font=font_bullet, fill=(241, 245, 249))
        y_off += 42

    # Lower credentials pill
    draw.rounded_rectangle([60, 520, 680, 580], radius=10, fill=(15, 23, 42, 220), outline=(217, 119, 6, 255), width=2)
    font_cred = ImageFont.truetype(FONT_ARIAL_BOLD, 17)
    draw.text((80, 540), "LICENCIA DE BROKER: #BK-78921-USA  |  TX, EE. UU.", font=font_cred, fill=(255, 255, 255))

    # Right Column: Big Official Seal & Certification Card
    if os.path.exists(COPART_SEAL_PATH):
        seal = Image.open(COPART_SEAL_PATH).convert("RGBA")
        sw = 420
        sh = int(sw * (seal.height / seal.width))
        seal_resized = seal.resize((sw, sh), Image.Resampling.LANCZOS)
        # Card Background behind seal
        card_x = 730
        card_y = 60
        card_w = 420
        card_h = 520
        draw.rounded_rectangle([card_x, card_y, card_x + card_w, card_y + card_h], radius=16, fill=(15, 23, 42, 210), outline=(251, 191, 36, 180), width=2)

        # Header of Card
        draw.rounded_rectangle([card_x, card_y, card_x + card_w, card_y + 55], radius=16, fill=(11, 46, 89, 255))
        draw.rectangle([card_x, card_y + 35, card_x + card_w, card_y + 55], fill=(11, 46, 89, 255))
        font_card_h = ImageFont.truetype(FONT_ARIAL_BOLD, 18)
        draw.text((card_x + 35, card_y + 18), "CERTIFICACIÓN DE COMPRA SEGURA", font=font_card_h, fill=(255, 255, 255))

        # Paste Seal centered
        sx = card_x + (card_w - sw) // 2
        sy = card_y + 80
        img.paste(seal_resized, (sx, sy), seal_resized)

        # Card Footer Info
        font_cf = ImageFont.truetype(FONT_SEGOE_BOLD, 15)
        font_cfs = ImageFont.truetype(FONT_ARIAL, 13)

        draw.text((card_x + 50, card_y + 280), "• PATIOS COPART EN TEXAS:", font=font_cf, fill=(251, 191, 36))
        draw.text((card_x + 70, card_y + 310), "Houston South • Dallas • Austin • San Antonio", font=font_cfs, fill=(226, 232, 240))

        draw.text((card_x + 50, card_y + 355), "• DOCUMENTACIÓN GARANTIZADA:", font=font_cf, fill=(251, 191, 36))
        draw.text((card_x + 70, card_y + 385), "Bill of Sale Oficial • Título Limpio • Placas 30 Días", font=font_cfs, fill=(226, 232, 240))

        # Support email pill
        draw.rounded_rectangle([card_x + 30, card_y + 440, card_x + card_w - 30, card_y + 490], radius=8, fill=(16, 122, 60, 255))
        font_mail = ImageFont.truetype(FONT_ARIAL_BOLD, 14)
        draw.text((card_x + 50, card_y + 455), "✉ copartadjudications@gmail.com", font=font_mail, fill=(255, 255, 255))

    out_path = r"d:\SUBASTAS\public\whatsapp_cover_copart_broker.png"
    img.save(out_path, "PNG")
    print(f"Created WhatsApp Cover Banner: {out_path}")
    return out_path

if __name__ == "__main__":
    make_profile_picture()
    make_cover_banner()

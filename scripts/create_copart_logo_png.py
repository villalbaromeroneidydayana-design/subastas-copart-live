from PIL import Image, ImageDraw, ImageFont
import os

# Render high-resolution Copart Logo PNG (width 500, height 160)
W, H = 500, 160
img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

cx, cy = 250, 85
rx, ry = 220, 68

# Metallic grey outer ellipse
draw.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=(160, 175, 195, 255), outline=(90, 105, 125, 255), width=3)

# Inner black/navy ellipse
draw.ellipse([cx - rx + 14, cy - ry + 12, cx + rx - 14, cy + ry - 12], fill=(8, 14, 24, 255))

# Blue bottom arc/swoosh
draw.chord([cx - rx + 24, cy - ry + 20, cx + rx - 24, cy + ry], start=10, end=170, fill=(0, 114, 206, 255))

# Red dot at the top center
draw.ellipse([cx - 10, cy - ry - 2, cx + 10, cy - ry + 18], fill=(224, 26, 34, 255))

# "Copart" text in white bold italic font
# Try to load Arial Black or Arial Bold, fallback to default font with scaled drawing
font_loaded = False
for font_name in ["ariblk.ttf", "arialbd.ttf", "arial.ttf", "impact.ttf"]:
    try:
        font = ImageFont.truetype(font_name, 76)
        draw.text((cx, cy - 8), "Copart", fill=(255, 255, 255, 255), anchor="mm", font=font)
        font_loaded = True
        break
    except:
        continue

if not font_loaded:
    draw.text((cx, cy - 8), "Copart", fill=(255, 255, 255, 255), anchor="mm")

out_path = r"d:\SUBASTAS\public\copart_logo_header.png"
img.save(out_path, format="PNG")
print("Saved Copart logo PNG to:", out_path)

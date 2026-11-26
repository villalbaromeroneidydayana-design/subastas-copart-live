from PIL import Image, ImageDraw, ImageFont
import os, shutil

def create_copart_images():
    # 1. Square Avatar for Google Profile Picture (512x512)
    # Background: Corporate Copart Dark Navy #08101e
    size = 512
    avatar = Image.new('RGBA', (size, size), (8, 16, 30, 255))
    draw = ImageDraw.Draw(avatar)
    
    cx, cy = size // 2, size // 2
    rx, ry = 205, 68
    
    # Outer subtle metallic glow ring
    draw.ellipse([cx - rx - 4, cy - ry - 4, cx + rx + 4, cy + ry + 4], outline=(140, 160, 185, 120), width=3)
    
    # Metallic grey outer ellipse
    draw.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=(175, 190, 205, 255), outline=(95, 115, 135, 255), width=4)
    
    # Inner dark navy/black ellipse
    draw.ellipse([cx - rx + 14, cy - ry + 12, cx + rx - 14, cy + ry - 12], fill=(6, 12, 22, 255))
    
    # Blue bottom arc/swoosh
    draw.chord([cx - rx + 24, cy - ry + 20, cx + rx - 24, cy + ry], start=10, end=170, fill=(0, 114, 206, 255))
    
    # Red dot at the top center
    draw.ellipse([cx - 10, cy - ry - 3, cx + 10, cy - ry + 17], fill=(224, 26, 34, 255))
    
    # "Copart" text in white bold italic
    font_loaded = False
    for font_name in ["ariblk.ttf", "arialbd.ttf", "arial.ttf"]:
        try:
            font = ImageFont.truetype(font_name, 72)
            draw.text((cx, cy - 8), "Copart", fill=(255, 255, 255, 255), anchor="mm", font=font)
            font_loaded = True
            break
        except:
            continue
    if not font_loaded:
        draw.text((cx, cy - 8), "Copart", fill=(255, 255, 255, 255), anchor="mm")
        
    avatar_path = r"d:\SUBASTAS\public\copart_profile_avatar.png"
    avatar.save(avatar_path, format="PNG")
    print("Saved avatar:", avatar_path)
    
    # 2. Transparent Header Logo (600x200)
    w_h, h_h = 600, 200
    logo_trans = Image.new('RGBA', (w_h, h_h), (0, 0, 0, 0))
    d_trans = ImageDraw.Draw(logo_trans)
    
    hcx, hcy = w_h // 2, h_h // 2
    hrx, hry = 240, 75
    
    # Outer metallic
    d_trans.ellipse([hcx - hrx, hcy - hry, hcx + hrx, hcy + hry], fill=(175, 190, 205, 255), outline=(95, 115, 135, 255), width=4)
    # Inner black
    d_trans.ellipse([hcx - hrx + 15, hcy - hry + 13, hcx + hrx - 15, hcy + hry - 13], fill=(6, 12, 22, 255))
    # Blue swoosh
    d_trans.chord([hcx - hrx + 26, hcy - hry + 22, hcx + hrx - 26, hcy + hry], start=10, end=170, fill=(0, 114, 206, 255))
    # Red dot
    d_trans.ellipse([hcx - 12, hcy - hry - 3, hcx + 12, hcy - hry + 19], fill=(224, 26, 34, 255))
    
    if font_loaded:
        font_large = ImageFont.truetype("ariblk.ttf", 80)
        d_trans.text((hcx, hcy - 8), "Copart", fill=(255, 255, 255, 255), anchor="mm", font=font_large)
    else:
        d_trans.text((hcx, hcy - 8), "Copart", fill=(255, 255, 255, 255), anchor="mm")
        
    logo_trans_path = r"d:\SUBASTAS\public\copart_logo_header.png"
    logo_trans.save(logo_trans_path, format="PNG")
    print("Saved logo header:", logo_trans_path)
    
    # Copy both to brain artifacts directory so they can be embedded/viewed
    art_dir = r"C:\Users\ALP\.gemini\antigravity\brain\231c2b1c-cfdc-49c0-bd96-3d561bbfbe05"
    if os.path.exists(art_dir):
        shutil.copy2(avatar_path, os.path.join(art_dir, "copart_profile_avatar.png"))
        shutil.copy2(logo_trans_path, os.path.join(art_dir, "copart_logo_header.png"))
        print("Copied both to artifact dir.")

if __name__ == "__main__":
    create_copart_images()

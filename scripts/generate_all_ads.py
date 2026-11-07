import os
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

WORKSPACE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PHOTOS_DIR = os.path.join(WORKSPACE, "creative", "product-photos")
BG_DIR = os.path.join(WORKSPACE, "creative", "backgrounds")
OUTPUT_DIR = os.path.join(WORKSPACE, "creative", "ad-images")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Typography paths
FONT_BAHN = r"C:\Windows\Fonts\bahnschrift.ttf"
FONT_SEGOE_B = r"C:\Windows\Fonts\segoeuib.ttf"
FONT_SEGOE = r"C:\Windows\Fonts\segoeui.ttf"
FONT_SEGOE_L = r"C:\Windows\Fonts\segoeuil.ttf"

# Color Palette — 2026 Obsidian & Cyber Emerald
COLOR_BG_DARK = (8, 10, 14, 255)
COLOR_EMERALD = (0, 240, 118)
COLOR_EMERALD_GLOW = (0, 240, 118, 60)
COLOR_CYAN = (56, 189, 248)
COLOR_AMBER = (245, 158, 11)
COLOR_TEXT_WHITE = (255, 255, 255)
COLOR_TEXT_MUTED = (148, 163, 184)
COLOR_TEXT_DIM = (100, 116, 139)

def get_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()

def draw_text_tracked(draw, xy, text, font, fill, spacing=2):
    x, y = xy
    for char in text:
        draw.text((x, y), char, font=font, fill=fill)
        bbox = font.getbbox(char)
        w = bbox[2] - bbox[0]
        x += w + spacing

def get_tracked_width(text, font, spacing=2):
    w = 0
    for char in text:
        bbox = font.getbbox(char)
        w += (bbox[2] - bbox[0]) + spacing
    return w - spacing if text else 0

def draw_specular_card(canvas, box, radius=20, bg=(12, 16, 24, 220), border=(255, 255, 255, 30), highlight=(255, 255, 255, 85)):
    """Renders an obsidian glass card with a 1px top specular highlight edge."""
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    x0, y0, x1, y1 = box
    d.rounded_rectangle(box, radius=radius, fill=bg, outline=border, width=1)
    d.line([x0 + radius, y0, x1 - radius, y0], fill=highlight, width=1)
    return Image.alpha_composite(canvas, layer)

def draw_status_pill(canvas, cx, cy, text, dot_color=COLOR_EMERALD):
    """Renders a sleek luxury micro-status pill with an active pulsing LED dot."""
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    f = get_font(FONT_BAHN, 18)
    tw = get_tracked_width(text, f, spacing=3)
    th = 20
    pad_x, pad_y = 20, 9
    dot_r = 5
    dot_space = dot_r * 2 + 10
    total_w = tw + pad_x * 2 + dot_space
    total_h = th + pad_y * 2
    x0 = cx - total_w // 2
    y0 = cy - total_h // 2
    x1 = x0 + total_w
    y1 = y0 + total_h
    d.rounded_rectangle([x0, y0, x1, y1], radius=total_h // 2, fill=(10, 14, 20, 220), outline=(255, 255, 255, 40), width=1)
    d.line([x0 + total_h // 2, y0, x1 - total_h // 2, y0], fill=(255, 255, 255, 80), width=1)
    
    # Glowing dot
    d.ellipse([x0 + pad_x, cy - dot_r, x0 + pad_x + dot_r * 2, cy + dot_r], fill=dot_color)
    tx = x0 + pad_x + dot_space
    draw_text_tracked(d, (tx, cy - th // 2 - 1), text, f, fill=(240, 245, 255), spacing=3)
    return Image.alpha_composite(canvas, layer)

def draw_luminous_cta(canvas, box, text, subtext, accent_color=COLOR_EMERALD):
    """Renders the 2026 Interactive Floating Action Capsule CTA with subtle outer glow."""
    W, H = canvas.size
    x0, y0, x1, y1 = box
    r = (y1 - y0) // 2
    
    # Outer glow layer
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.rounded_rectangle([x0 - 4, y0 - 4, x1 + 4, y1 + 4], radius=r + 4, fill=(accent_color[0], accent_color[1], accent_color[2], 50))
    glow = glow.filter(ImageFilter.GaussianBlur(16))
    canvas = Image.alpha_composite(canvas, glow)
    
    # Capsule surface
    cap = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    cd = ImageDraw.Draw(cap)
    cd.rounded_rectangle(box, radius=r, fill=(8, 14, 18, 245), outline=(accent_color[0], accent_color[1], accent_color[2], 180), width=2)
    cd.line([x0 + r, y0 + 1, x1 - r, y0 + 1], fill=(accent_color[0], accent_color[1], accent_color[2], 255), width=1)
    
    # Vector DM Icon (minimal chat bubble)
    ix, iy = x0 + 44, y0 + (y1 - y0) // 2 - 10
    cd.rounded_rectangle([ix, iy - 6, ix + 24, iy + 14], radius=5, fill=(accent_color[0], accent_color[1], accent_color[2], 40), outline=accent_color, width=2)
    cd.polygon([(ix + 4, iy + 14), (ix + 12, iy + 14), (ix + 4, iy + 20)], fill=accent_color)
    
    # Main action text
    f_main = get_font(FONT_BAHN, 32)
    bbox_m = f_main.getbbox(text)
    tw = bbox_m[2] - bbox_m[0]
    
    f_sub = get_font(FONT_SEGOE, 17)
    bbox_s = f_sub.getbbox(subtext)
    sw = bbox_s[2] - bbox_s[0]
    
    tx = (x0 + x1 - tw) // 2
    ty = y0 + 20
    cd.text((tx, ty), text, font=f_main, fill=(255, 255, 255))
    
    # Subtitle
    sx = (x0 + x1 - sw) // 2
    sy = y0 + 64
    cd.text((sx, sy), subtext, font=f_sub, fill=(160, 175, 195))
    
    # Vector Chevron Arrow Pill
    ax0 = x1 - 74
    ay0 = y0 + (y1 - y0) // 2 - 18
    cd.rounded_rectangle([ax0, ay0, ax0 + 36, ay0 + 36], radius=18, fill=(accent_color[0], accent_color[1], accent_color[2], 40), outline=accent_color, width=1)
    # Draw vector arrow
    acx = ax0 + 18
    acy = ay0 + 18
    s = 7
    cd.line([(acx - s, acy), (acx + s, acy)], fill=accent_color, width=2)
    cd.line([(acx + s * 0.2, acy - s * 0.7), (acx + s, acy)], fill=accent_color, width=2)
    cd.line([(acx + s * 0.2, acy + s * 0.7), (acx + s, acy)], fill=accent_color, width=2)
    
    return Image.alpha_composite(canvas, cap)

def draw_circular_gauge(draw, cx, cy, radius=28, percent=85, color=COLOR_EMERALD, bg_color=(40, 50, 65), width=5):
    """Renders a smooth circular telemetry arc progress meter."""
    draw.arc([cx - radius, cy - radius, cx + radius, cy + radius], start=0, end=360, fill=bg_color, width=width)
    end_deg = -90 + (percent / 100.0) * 360
    draw.arc([cx - radius, cy - radius, cx + radius, cy + radius], start=-90, end=end_deg, fill=color, width=width)

def draw_reticle(draw, cx, cy, r=20, color=COLOR_CYAN):
    """Renders a biometric target reticle with concentric rings and crosshairs."""
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(color[0], color[1], color[2], 120), width=1)
    draw.ellipse([cx - int(r*0.5), cy - int(r*0.5), cx + int(r*0.5), cy + int(r*0.5)], outline=(color[0], color[1], color[2], 220), width=1)
    draw.ellipse([cx - 2, cy - 2, cx + 2, cy + 2], fill=color)
    draw.line([(cx - r - 4, cy), (cx - r + 4, cy)], fill=color, width=1)
    draw.line([(cx + r - 4, cy), (cx + r + 4, cy)], fill=color, width=1)
    draw.line([(cx, cy - r - 4), (cx, cy - r + 4)], fill=color, width=1)
    draw.line([(cx, cy + r - 4), (cx, cy + r + 4)], fill=color, width=1)

def draw_vector_check(draw, cx, cy, size=18, color=COLOR_EMERALD, width=2):
    pts = [
        (cx - size * 0.35, cy),
        (cx - size * 0.05, cy + size * 0.35),
        (cx + size * 0.45, cy - size * 0.35)
    ]
    draw.line([pts[0], pts[1]], fill=color, width=width)
    draw.line([pts[1], pts[2]], fill=color, width=width)

def draw_vector_lightning(draw, cx, cy, size=20, color=COLOR_EMERALD):
    s = size / 2.0
    pts = [
        (cx + s * 0.1, cy - s * 1.0),
        (cx - s * 0.6, cy - s * 0.05),
        (cx - s * 0.1, cy - s * 0.05),
        (cx - s * 0.4, cy + s * 1.0),
        (cx + s * 0.6, cy + s * 0.05),
        (cx + s * 0.1, cy + s * 0.05)
    ]
    draw.polygon(pts, fill=color)

def round_corners(img, radius):
    mask = Image.new("L", img.size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([0, 0, img.width, img.height], radius=radius, fill=255)
    result = img.convert("RGBA").copy()
    result.putalpha(mask)
    return result

# ==========================================
# AD 1 — HERO SHOT (photo-01-enhanced)
# ==========================================
def generate_ad1_1x1():
    print("Generating ad-01-1x1.png (2026 Luxury Obsidian Studio)...")
    W, H = 1080, 1080
    bg_path = os.path.join(BG_DIR, "whoop_luxury_studio_1x1_1793989197864.jpg")
    bg = Image.open(bg_path).convert("RGBA").resize((W, H), Image.Resampling.LANCZOS)
    
    # Status Pill
    bg = draw_status_pill(bg, W // 2, 50, "OFFICIAL WHOOP 5.0 LAUNCH", dot_color=COLOR_EMERALD)
    
    # Headline
    f_h = get_font(FONT_BAHN, 46)
    head = "THE 24/7 SCREEN-FREE WEARABLE"
    hb = f_h.getbbox(head)
    d = ImageDraw.Draw(bg)
    d.text(((W - (hb[2]-hb[0])) // 2, 82), head, font=f_h, fill=COLOR_TEXT_WHITE)
    
    f_sub = get_font(FONT_SEGOE, 19)
    sub = "Continuous Heart Rate  •  Strain  •  Lab-Grade Sleep  •  Real-Time Recovery"
    sb = f_sub.getbbox(sub)
    d.text(((W - (sb[2]-sb[0])) // 2, 138), sub, font=f_sub, fill=COLOR_TEXT_MUTED)
    
    # Hero Product Cutout on Studio Pedestal
    prod = Image.open(os.path.join(PHOTOS_DIR, "photo-01-enhanced.png"))
    pw = 510
    ph = int(prod.height * (pw / prod.width))
    prod_resized = prod.resize((pw, ph), Image.Resampling.LANCZOS)
    
    # Soft contact shadow
    shadow = Image.new("RGBA", bg.size, (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    sdraw.ellipse([330, 680, 640, 745], fill=(0, 0, 0, 230))
    sdraw.ellipse([290, 665, 680, 770], fill=(0, 0, 0, 140))
    shadow = shadow.filter(ImageFilter.GaussianBlur(16))
    bg = Image.alpha_composite(bg, shadow)
    bg.paste(prod_resized, (245, 250), prod_resized)
    
    # Floating Obsidian Price Card (Top Right)
    bg = draw_specular_card(bg, [690, 210, 1020, 390], radius=18, bg=(10, 14, 22, 225), border=(255, 255, 255, 35))
    d = ImageDraw.Draw(bg)
    f_plabel = get_font(FONT_BAHN, 16)
    draw_text_tracked(d, (715, 232), "STARTING AT", f_plabel, fill=COLOR_AMBER, spacing=2)
    f_pprice = get_font(FONT_BAHN, 44)
    d.text((715, 255), "₹20,890*", font=f_pprice, fill=COLOR_TEXT_WHITE)
    f_pdet = get_font(FONT_SEGOE, 17)
    d.text((715, 316), "MRP ₹21,990 • Save ₹1,100", font=f_pdet, fill=COLOR_TEXT_MUTED)
    f_pemi = get_font(FONT_BAHN, 18)
    d.text((715, 344), "No-Cost EMI: ₹3,482/mo*", font=f_pemi, fill=COLOR_CYAN)
    
    # Feature Glass Cards (Right side)
    features = [
        ("14+ Day Battery Life", "Wireless PowerPack charging on the go"),
        ("Zero Screen Distractions", "100% waterproof Any-Wear™ casing"),
        ("Personal AI WHOOP Coach", "Hyper-personalized daily guidance"),
    ]
    fy = 425
    for title, desc in features:
        bg = draw_specular_card(bg, [690, fy, 1020, fy + 72], radius=14, bg=(10, 14, 22, 210), border=(255, 255, 255, 25))
        fd = ImageDraw.Draw(bg)
        f_t = get_font(FONT_BAHN, 19)
        fd.text((712, fy + 14), title, font=f_t, fill=(240, 245, 255))
        f_d = get_font(FONT_SEGOE, 15)
        fd.text((712, fy + 40), desc, font=f_d, fill=COLOR_TEXT_MUTED)
        fy += 85
        
    # Luminous Action Capsule CTA
    bg = draw_luminous_cta(bg, [70, 895, 1010, 1005], 'COMMENT "PRICE" FOR INSTANT VIP LINK', 
                           "Automated Instant DM  •  Official WHOOP Store Checkout  •  whoop.in", 
                           accent_color=COLOR_EMERALD)
    
    # Clean Footer
    d = ImageDraw.Draw(bg)
    f_foot = get_font(FONT_SEGOE, 16)
    foot = "Pan-India Free Express Delivery  •  GST Invoice Available  •  DM @whoop"
    ftb = f_foot.getbbox(foot)
    d.text(((W - (ftb[2]-ftb[0])) // 2, 1032), foot, font=f_foot, fill=COLOR_TEXT_DIM)
    
    out_path = os.path.join(OUTPUT_DIR, "ad-01-1x1.png")
    bg.convert("RGB").save(out_path, "PNG")
    print("Saved:", out_path)

def generate_ad1_9x16():
    print("Generating ad-01-9x16.png (2026 Luxury Vertical Studio)...")
    W, H = 1080, 1920
    bg_path = os.path.join(BG_DIR, "whoop_luxury_studio_9x16_1793989139084.jpg")
    bg = Image.open(bg_path).convert("RGBA").resize((W, H), Image.Resampling.LANCZOS)
    
    # Safe zone top: y=130
    bg = draw_status_pill(bg, W // 2, 130, "OFFICIAL WHOOP 5.0 LAUNCH", dot_color=COLOR_EMERALD)
    
    f_h1 = get_font(FONT_BAHN, 58)
    line1 = "THE 24/7 SCREEN-FREE"
    line2 = "FITNESS WEARABLE"
    b1 = f_h1.getbbox(line1)
    b2 = f_h1.getbbox(line2)
    d = ImageDraw.Draw(bg)
    d.text(((W - (b1[2]-b1[0])) // 2, 175), line1, font=f_h1, fill=COLOR_TEXT_WHITE)
    d.text(((W - (b2[2]-b2[0])) // 2, 245), line2, font=f_h1, fill=COLOR_EMERALD)
    
    f_sub = get_font(FONT_SEGOE, 23)
    sub = "Continuous Heart Rate  •  Strain  •  Lab-Grade Sleep  •  Recovery"
    sb = f_sub.getbbox(sub)
    d.text(((W - (sb[2]-sb[0])) // 2, 330), sub, font=f_sub, fill=COLOR_TEXT_MUTED)
    
    # Hero Cutout on Pedestal
    prod = Image.open(os.path.join(PHOTOS_DIR, "photo-01-enhanced.png"))
    pw = 680
    ph = int(prod.height * (pw / prod.width))
    prod_resized = prod.resize((pw, ph), Image.Resampling.LANCZOS)
    
    # Contact shadow on vertical pedestal
    shadow = Image.new("RGBA", bg.size, (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    sdraw.ellipse([340, 1220, 740, 1310], fill=(0, 0, 0, 240))
    sdraw.ellipse([290, 1200, 790, 1340], fill=(0, 0, 0, 150))
    shadow = shadow.filter(ImageFilter.GaussianBlur(22))
    bg = Image.alpha_composite(bg, shadow)
    bg.paste(prod_resized, (200, 620), prod_resized)
    
    # Floating Price Banner Box
    bg = draw_specular_card(bg, [100, 410, 980, 560], radius=22, bg=(10, 14, 22, 220), border=(255, 255, 255, 35))
    d = ImageDraw.Draw(bg)
    f_plab = get_font(FONT_BAHN, 18)
    draw_text_tracked(d, (140, 435), "STARTING AT", f_plab, fill=COLOR_AMBER, spacing=2)
    f_ppr = get_font(FONT_BAHN, 50)
    d.text((140, 465), "₹20,890*", font=f_ppr, fill=COLOR_TEXT_WHITE)
    f_pemi = get_font(FONT_BAHN, 24)
    d.text((580, 470), "NO-COST EMI: ₹3,482/MO*", font=f_pemi, fill=COLOR_CYAN)
    f_pdet = get_font(FONT_SEGOE, 20)
    d.text((140, 520), "Official MRP ₹21,990 • Save ₹1,100 • 12-Month Core Membership Included", font=f_pdet, fill=COLOR_TEXT_MUTED)
    
    # 3 Wide Feature Cards
    cards = [
        ("14+ Day Battery Life", "Continuous monitoring with waterproof Wireless PowerPack"),
        ("Zero Screen Distractions", "Featherlight, 100% waterproof casing worn anywhere on body"),
        ("Personal AI WHOOP Coach", "Hyper-personalized sleep debt and strain recommendations"),
    ]
    cy = 1350
    for title, desc in cards:
        bg = draw_specular_card(bg, [100, cy, 980, cy + 85], radius=18, bg=(10, 14, 22, 215), border=(255, 255, 255, 25))
        d = ImageDraw.Draw(bg)
        draw_vector_check(d, 145, cy + 42, size=22, color=COLOR_EMERALD, width=3)
        f_t = get_font(FONT_BAHN, 24)
        d.text((180, cy + 18), title, font=f_t, fill=COLOR_TEXT_WHITE)
        f_d = get_font(FONT_SEGOE, 18)
        d.text((180, cy + 48), desc, font=f_d, fill=COLOR_TEXT_MUTED)
        cy += 100
        
    # Luminous CTA Capsule
    bg = draw_luminous_cta(bg, [100, 1670, 980, 1785], 'COMMENT "PRICE" FOR INSTANT VIP LINK', 
                           "Automated Instant DM  •  Official Store Checkout  •  whoop.in", 
                           accent_color=COLOR_EMERALD)
    
    # Footer
    d = ImageDraw.Draw(bg)
    f_foot = get_font(FONT_SEGOE, 20)
    foot = "100% Genuine WHOOP  •  Free Delivery Across India  •  DM @whoop"
    ftb = f_foot.getbbox(foot)
    d.text(((W - (ftb[2]-ftb[0])) // 2, 1820), foot, font=f_foot, fill=COLOR_TEXT_DIM)
    
    out_path = os.path.join(OUTPUT_DIR, "ad-01-9x16.png")
    bg.convert("RGB").save(out_path, "PNG")
    print("Saved:", out_path)

# ==========================================
# AD 2 — OFFER HIGHLIGHT (Tiers & EMI)
# ==========================================
def generate_ad2_1x1():
    print("Generating ad-02-1x1.png (2026 Obsidian Tier Showcase)...")
    W, H = 1080, 1080
    bg_path = os.path.join(BG_DIR, "whoop_biometrics_dark_hud_1793989155152.jpg")
    bg = Image.open(bg_path).convert("RGBA").resize((W, H), Image.Resampling.LANCZOS)
    
    bg = draw_status_pill(bg, W // 2, 50, "OFFICIAL LAUNCH OFFER // NO-COST EMI", dot_color=COLOR_AMBER)
    
    f_h = get_font(FONT_BAHN, 44)
    head = "WHOOP 5.0 FROM ₹3,482/MONTH"
    hb = f_h.getbbox(head)
    d = ImageDraw.Draw(bg)
    d.text(((W - (hb[2]-hb[0])) // 2, 82), head, font=f_h, fill=COLOR_TEXT_WHITE)
    
    f_sub = get_font(FONT_SEGOE, 18)
    sub = "Up to 6 Months No-Cost EMI Available  •  Save Up To ₹1,451 on MRP"
    sb = f_sub.getbbox(sub)
    d.text(((W - (sb[2]-sb[0])) // 2, 138), sub, font=f_sub, fill=COLOR_EMERALD)
    
    # Left: Cutout of photo-05 (device + app)
    p5 = Image.open(os.path.join(PHOTOS_DIR, "photo-05-enhanced.png"))
    p5_w = 460
    p5_h = int(p5.height * (p5_w / p5.width))
    p5_resized = p5.resize((p5_w, p5_h), Image.Resampling.LANCZOS)
    
    shadow = Image.new("RGBA", bg.size, (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    sdraw.ellipse([50, 480, 480, 580], fill=(0, 0, 0, 200))
    shadow = shadow.filter(ImageFilter.GaussianBlur(25))
    bg = Image.alpha_composite(bg, shadow)
    bg.paste(p5_resized, (40, 220), p5_resized)
    
    # Right: Two Luxury Tier Obsidian Cards
    # Card 1: WHOOP ONE
    bg = draw_specular_card(bg, [520, 200, 1020, 510], radius=18, bg=(10, 14, 22, 225), border=(255, 255, 255, 30))
    d = ImageDraw.Draw(bg)
    f_tname = get_font(FONT_BAHN, 24)
    draw_text_tracked(d, (550, 222), "WHOOP ONE", f_tname, fill=COLOR_TEXT_WHITE, spacing=2)
    f_tbadge = get_font(FONT_BAHN, 14)
    d.text((875, 226), "STANDARD", font=f_tbadge, fill=COLOR_CYAN)
    
    f_tpr = get_font(FONT_BAHN, 38)
    d.text((550, 258), "₹20,890", font=f_tpr, fill=COLOR_EMERALD)
    f_tmrp = get_font(FONT_SEGOE, 18)
    d.text((730, 272), "MRP ₹21,990", font=f_tmrp, fill=COLOR_TEXT_MUTED)
    d.line([725, 284, 840, 284], fill=(239, 68, 68), width=2)
    
    f_td = get_font(FONT_SEGOE, 16)
    d.text((550, 318), "• WHOOP 5.0 + CoreKnit Jet Black Band", font=f_td, fill=(220, 230, 245))
    d.text((550, 348), "• 12-Month Core Membership Included", font=f_td, fill=(220, 230, 245))
    d.text((550, 378), "• Sleep, Recovery & Strain Analytics", font=f_td, fill=(220, 230, 245))
    
    f_temi = get_font(FONT_BAHN, 20)
    draw_vector_lightning(d, 565, 435, size=20, color=COLOR_CYAN)
    d.text((585, 423), "NO-COST EMI: ₹3,482/MO (6 MOS)", font=f_temi, fill=COLOR_CYAN)
    
    # Card 2: WHOOP PEAK (Pro Longevity)
    bg = draw_specular_card(bg, [520, 540, 1020, 850], radius=18, bg=(14, 18, 28, 230), border=(COLOR_AMBER[0], COLOR_AMBER[1], COLOR_AMBER[2], 90), highlight=(COLOR_AMBER[0], COLOR_AMBER[1], COLOR_AMBER[2], 180))
    d = ImageDraw.Draw(bg)
    draw_text_tracked(d, (550, 562), "WHOOP PEAK", f_tname, fill=COLOR_TEXT_WHITE, spacing=2)
    d.text((840, 566), "PRO LONGEVITY", font=f_tbadge, fill=COLOR_AMBER)
    
    d.text((550, 598), "₹27,539", font=f_tpr, fill=COLOR_AMBER)
    d.text((730, 612), "MRP ₹28,990", font=f_tmrp, fill=COLOR_TEXT_MUTED)
    d.line([725, 624, 840, 624], fill=(239, 68, 68), width=2)
    
    d.text((550, 658), "• Wireless PowerPack + SuperKnit Band", font=f_td, fill=(220, 230, 245))
    d.text((550, 688), "• Biological Age & Pace of Aging Vitals", font=f_td, fill=(220, 230, 245))
    d.text((550, 718), "• Real-Time Stress Monitor & Advanced ECG", font=f_td, fill=(220, 230, 245))
    
    draw_vector_lightning(d, 565, 775, size=20, color=COLOR_AMBER)
    d.text((585, 763), "NO-COST EMI: ₹4,590/MO (6 MOS)", font=f_temi, fill=COLOR_AMBER)
    
    # Left side info card under product
    bg = draw_specular_card(bg, [40, 620, 480, 850], radius=18, bg=(10, 14, 22, 210), border=(255, 255, 255, 25))
    d = ImageDraw.Draw(bg)
    f_ib = get_font(FONT_BAHN, 18)
    draw_text_tracked(d, (65, 642), "EXCLUSIVE PRIVILEGES", f_ib, fill=COLOR_EMERALD, spacing=2)
    f_id = get_font(FONT_SEGOE, 16)
    d.text((65, 680), "• Instant automated DM checkout link", font=f_id, fill=COLOR_TEXT_WHITE)
    d.text((65, 715), "• 100% Genuine product with warranty", font=f_id, fill=(200, 215, 235))
    d.text((65, 750), "• Free express delivery across India", font=f_id, fill=COLOR_CYAN)
    d.text((65, 785), "• GST invoice available at checkout", font=f_id, fill=COLOR_TEXT_MUTED)
    
    # CTA Capsule
    bg = draw_luminous_cta(bg, [70, 895, 1010, 1005], 'COMMENT "PRICE" TO CLAIM OFFER', 
                           "Automated Instant DM  •  Select Your Tier with Direct Link  •  whoop.in", 
                           accent_color=COLOR_AMBER)
    
    out_path = os.path.join(OUTPUT_DIR, "ad-02-1x1.png")
    bg.convert("RGB").save(out_path, "PNG")
    print("Saved:", out_path)

def generate_ad2_9x16():
    print("Generating ad-02-9x16.png (Vertical Tier Comparison)...")
    W, H = 1080, 1920
    bg_path = os.path.join(BG_DIR, "whoop_dark_editorial_9x16_1793989212484.jpg")
    bg = Image.open(bg_path).convert("RGBA").resize((W, H), Image.Resampling.LANCZOS)
    
    bg = draw_status_pill(bg, W // 2, 130, "SPECIAL OFFER // UP TO 6 MOS NO-COST EMI", dot_color=COLOR_AMBER)
    
    f_h1 = get_font(FONT_BAHN, 56)
    line1 = "UP TO 6 MONTHS NO-COST EMI"
    b1 = f_h1.getbbox(line1)
    d = ImageDraw.Draw(bg)
    d.text(((W - (b1[2]-b1[0])) // 2, 175), line1, font=f_h1, fill=COLOR_TEXT_WHITE)
    
    f_sub = get_font(FONT_BAHN, 28)
    sub = "SAVE UP TO ₹1,451 ON MRP"
    sb = f_sub.getbbox(sub)
    d.text(((W - (sb[2]-sb[0])) // 2, 250), sub, font=f_sub, fill=COLOR_EMERALD)
    
    # Center cutout photo-05
    p5 = Image.open(os.path.join(PHOTOS_DIR, "photo-05-enhanced.png"))
    p5_w = 780
    p5_h = int(p5.height * (p5_w / p5.width))
    p5_resized = p5.resize((p5_w, p5_h), Image.Resampling.LANCZOS)
    
    shadow = Image.new("RGBA", bg.size, (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    sdraw.ellipse([150, 720, 930, 840], fill=(0, 0, 0, 220))
    shadow = shadow.filter(ImageFilter.GaussianBlur(30))
    bg = Image.alpha_composite(bg, shadow)
    bg.paste(p5_resized, (150, 330), p5_resized)
    
    # Tier 1 Card: WHOOP ONE
    bg = draw_specular_card(bg, [90, 890, 990, 1200], radius=22, bg=(10, 14, 22, 225), border=(255, 255, 255, 30))
    d = ImageDraw.Draw(bg)
    f_tname = get_font(FONT_BAHN, 32)
    draw_text_tracked(d, (130, 920), "WHOOP ONE", f_tname, fill=COLOR_TEXT_WHITE, spacing=2)
    f_badge = get_font(FONT_BAHN, 18)
    d.text((820, 928), "STANDARD", font=f_badge, fill=COLOR_CYAN)
    
    f_pr = get_font(FONT_BAHN, 46)
    d.text((130, 965), "₹20,890", font=f_pr, fill=COLOR_EMERALD)
    f_mrp = get_font(FONT_SEGOE, 22)
    d.text((350, 982), "MRP ₹21,990", font=f_mrp, fill=COLOR_TEXT_MUTED)
    d.line([345, 995, 485, 995], fill=(239, 68, 68), width=2)
    
    f_desc = get_font(FONT_SEGOE, 21)
    d.text((130, 1035), "• Includes WHOOP 5.0 + CoreKnit Jet Black Band", font=f_desc, fill=(220, 230, 245))
    d.text((130, 1070), "• Full 12-Month Core Membership & AI WHOOP Coach", font=f_desc, fill=(220, 230, 245))
    
    f_emi = get_font(FONT_BAHN, 24)
    draw_vector_lightning(d, 145, 1145, size=24, color=COLOR_CYAN)
    d.text((175, 1132), "No-Cost EMI: ₹3,482/month (6 Months)", font=f_emi, fill=COLOR_CYAN)
    
    # Tier 2 Card: WHOOP PEAK
    bg = draw_specular_card(bg, [90, 1230, 990, 1540], radius=22, bg=(14, 18, 28, 230), border=(COLOR_AMBER[0], COLOR_AMBER[1], COLOR_AMBER[2], 90), highlight=(COLOR_AMBER[0], COLOR_AMBER[1], COLOR_AMBER[2], 180))
    d = ImageDraw.Draw(bg)
    draw_text_tracked(d, (130, 1260), "WHOOP PEAK", f_tname, fill=COLOR_TEXT_WHITE, spacing=2)
    d.text((790, 1268), "PRO LONGEVITY", font=f_badge, fill=COLOR_AMBER)
    
    d.text((130, 1305), "₹27,539", font=f_pr, fill=COLOR_AMBER)
    d.text((350, 1322), "MRP ₹28,990", font=f_mrp, fill=COLOR_TEXT_MUTED)
    d.line([345, 1335, 485, 1335], fill=(239, 68, 68), width=2)
    
    d.text((130, 1375), "• Includes Wireless PowerPack + SuperKnit Obsidian Band", font=f_desc, fill=(220, 230, 245))
    d.text((130, 1410), "• Biological Age, Pace of Aging & Advanced Stress Tracking", font=f_desc, fill=(220, 230, 245))
    
    draw_vector_lightning(d, 145, 1485, size=24, color=COLOR_AMBER)
    d.text((175, 1472), "No-Cost EMI: ₹4,590/month (6 Months)", font=f_emi, fill=COLOR_AMBER)
    
    # CTA Capsule
    bg = draw_luminous_cta(bg, [90, 1670, 990, 1785], 'COMMENT "PRICE" TO CLAIM OFFER', 
                           "Automated Instant DM  •  Official WHOOP Store Checkout  •  whoop.in", 
                           accent_color=COLOR_AMBER)
    
    # Footer
    d = ImageDraw.Draw(bg)
    f_foot = get_font(FONT_SEGOE, 20)
    foot = "Official WHOOP Store  •  GST Invoice Available  •  Pan-India Free Delivery"
    ftb = f_foot.getbbox(foot)
    d.text(((W - (ftb[2]-ftb[0])) // 2, 1820), foot, font=f_foot, fill=COLOR_TEXT_DIM)
    
    out_path = os.path.join(OUTPUT_DIR, "ad-02-9x16.png")
    bg.convert("RGB").save(out_path, "PNG")
    print("Saved:", out_path)

# ==========================================
# AD 3 — LIFESTYLE / ATHLETE (photo-02 Virat Kohli)
# ==========================================
def generate_ad3_1x1():
    print("Generating ad-03-1x1.png (2026 Biometric Athlete Broadcast HUD)...")
    W, H = 1080, 1080
    bg = Image.new("RGBA", (W, H), (8, 10, 14, 255))
    
    vk = Image.open(os.path.join(PHOTOS_DIR, "photo-02.jpg")).convert("RGBA")
    vw, vh = vk.size
    target_w = W
    target_h = int(vh * (target_w / vw)) # 720
    vk_scaled = vk.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    fade_top, fade_bot = 40, 60
    mask_arr = np.ones((target_h, target_w), dtype=float)
    for y in range(fade_top):
        mask_arr[y, :] *= (y / fade_top)
    for y in range(fade_bot):
        mask_arr[target_h - 1 - y, :] *= (y / fade_bot)
    alpha = (np.array(vk_scaled.split()[-1]).astype(float) * mask_arr).astype(np.uint8)
    vk_scaled.putalpha(Image.fromarray(alpha))
    
    bg.paste(vk_scaled, (0, 100), vk_scaled)
    
    # Top Status Pill
    bg = draw_status_pill(bg, W // 2, 45, "PROVEN BY ELITE ATHLETES // WHOOP 5.0", dot_color=COLOR_EMERALD)
    
    # Headline
    f_h = get_font(FONT_BAHN, 40)
    head = "CHOSEN BY CHAMPIONS"
    hb = f_h.getbbox(head)
    d = ImageDraw.Draw(bg)
    d.text(((W - (hb[2]-hb[0])) // 2, 72), head, font=f_h, fill=COLOR_TEXT_WHITE)
    
    # High-Tech Biometric HUD Target DIRECTLY Over Virat's Wrist (x=580, y=490)
    draw_reticle(d, 580, 490, r=32, color=COLOR_CYAN)
    
    # Sleek Glowing Ring around the Band Callout Circle (center: 941, 391, radius: 128)
    d.ellipse([941 - 132, 391 - 132, 941 + 132, 391 + 132], outline=(0, 240, 118, 180), width=2)
    d.ellipse([941 - 134, 391 - 134, 941 + 134, 391 + 134], outline=(56, 189, 248, 90), width=1)
    
    # Telemetry Line connecting wrist to the floating telemetry badge
    d.line([(612, 490), (670, 440)], fill=(56, 189, 248, 180), width=2)
    d.line([(670, 440), (740, 440)], fill=(56, 189, 248, 180), width=2)
    
    # Floating telemetry tag over athlete image
    bg = draw_specular_card(bg, [740, 415, 1040, 465], radius=12, bg=(10, 14, 22, 230), border=(56, 189, 248, 140))
    d = ImageDraw.Draw(bg)
    f_hud = get_font(FONT_BAHN, 16)
    d.text((755, 428), "IN-MATCH STRAIN: 18.2", font=f_hud, fill=COLOR_CYAN)
    
    # Lower Section: Price & EMI Glass Card
    bg = draw_specular_card(bg, [60, 680, 1020, 770], radius=18, bg=(10, 14, 22, 225), border=(255, 255, 255, 30))
    d = ImageDraw.Draw(bg)
    f_p1 = get_font(FONT_BAHN, 30)
    d.text((90, 700), "STARTING FROM ₹20,890*", font=f_p1, fill=COLOR_TEXT_WHITE)
    f_p2 = get_font(FONT_BAHN, 22)
    draw_vector_lightning(d, 615, 725, size=20, color=COLOR_AMBER)
    d.text((640, 708), "NO-COST EMI: ₹3,482/MO", font=f_p2, fill=COLOR_AMBER)
    f_ps = get_font(FONT_SEGOE, 17)
    d.text((90, 738), "Save up to ₹1,451 on MRP • 12-Month Membership Included", font=f_ps, fill=COLOR_TEXT_MUTED)
    
    # 3 Micro Benefit Tags
    tags = ["Screen-Free Focus", "14+ Day Battery", "Lab-Grade Recovery"]
    tx = 60
    f_t = get_font(FONT_BAHN, 19)
    for t in tags:
        bg = draw_specular_card(bg, [tx, 790, tx + 300, 850], radius=14, bg=(10, 14, 22, 210), border=(255, 255, 255, 25))
        d = ImageDraw.Draw(bg)
        draw_vector_check(d, tx + 25, 820, size=18, color=COLOR_EMERALD, width=2)
        d.text((tx + 45, 807), t, font=f_t, fill=(240, 245, 255))
        tx += 330
        
    # Luminous Action Capsule CTA
    bg = draw_luminous_cta(bg, [60, 885, 1020, 995], 'COMMENT "PRICE" TO TRAIN LIKE A PRO', 
                           "Instant Automated DM Reply  •  100% Genuine WHOOP  •  whoop.in", 
                           accent_color=COLOR_EMERALD)
    
    # Footer
    d = ImageDraw.Draw(bg)
    f_foot = get_font(FONT_SEGOE, 16)
    foot = "Worn by Professional Athletes Worldwide  •  DM @whoop  •  Official Partner"
    ftb = f_foot.getbbox(foot)
    d.text(((W - (ftb[2]-ftb[0])) // 2, 1030), foot, font=f_foot, fill=COLOR_TEXT_DIM)
    
    out_path = os.path.join(OUTPUT_DIR, "ad-03-1x1.png")
    bg.convert("RGB").save(out_path, "PNG")
    print("Saved:", out_path)

def generate_ad3_9x16():
    print("Generating ad-03-9x16.png (Vertical Athlete Editorial)...")
    W, H = 1080, 1920
    bg = Image.new("RGBA", (W, H), (8, 10, 14, 255))
    
    vk = Image.open(os.path.join(PHOTOS_DIR, "photo-02.jpg")).convert("RGBA")
    vw, vh = vk.size
    target_w = W
    target_h = int(vh * (target_w / vw))
    vk_resized = vk.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    fade_len = 160
    mask_arr = np.ones((target_h, target_w), dtype=float)
    for y in range(fade_len):
        mask_arr[y, :] *= (y / fade_len)
        mask_arr[target_h - 1 - y, :] *= (y / fade_len)
    alpha = (np.array(vk_resized.split()[-1]).astype(float) * mask_arr).astype(np.uint8)
    vk_resized.putalpha(Image.fromarray(alpha))
    
    bg.paste(vk_resized, (0, 360), vk_resized)
    
    # Top Status Pill
    bg = draw_status_pill(bg, W // 2, 130, "PROVEN BY CHAMPIONS // WHOOP 5.0", dot_color=COLOR_EMERALD)
    
    f_h1 = get_font(FONT_BAHN, 58)
    line1 = "CHOSEN BY CHAMPIONS"
    b1 = f_h1.getbbox(line1)
    d = ImageDraw.Draw(bg)
    d.text(((W - (b1[2]-b1[0])) // 2, 180), line1, font=f_h1, fill=COLOR_TEXT_WHITE)
    
    f_sub = get_font(FONT_SEGOE, 23)
    sub = "From Virat Kohli to Ronaldo: The 24/7 Wearable for Peak Form"
    sb = f_sub.getbbox(sub)
    d.text(((W - (sb[2]-sb[0])) // 2, 260), sub, font=f_sub, fill=COLOR_TEXT_MUTED)
    
    # Biometric HUD Reticle on wrist at (580, 750)
    draw_reticle(d, 580, 750, r=36, color=COLOR_CYAN)
    
    # Glowing ring around callout at (941, 651)
    d.ellipse([941 - 132, 651 - 132, 941 + 132, 651 + 132], outline=(0, 240, 118, 180), width=2)
    
    # Leader line to telemetry tag
    d.line([(616, 750), (670, 700)], fill=(56, 189, 248, 180), width=2)
    d.line([(670, 700), (740, 700)], fill=(56, 189, 248, 180), width=2)
    
    bg = draw_specular_card(bg, [740, 675, 1040, 725], radius=12, bg=(10, 14, 22, 230), border=(56, 189, 248, 140))
    d = ImageDraw.Draw(bg)
    f_hud = get_font(FONT_BAHN, 16)
    d.text((755, 688), "IN-MATCH STRAIN: 18.2", font=f_hud, fill=COLOR_CYAN)
    
    # Mid-lower: Pricing Glass Card
    bg = draw_specular_card(bg, [90, 1020, 990, 1140], radius=20, bg=(10, 14, 22, 225), border=(255, 255, 255, 30))
    d = ImageDraw.Draw(bg)
    f_p1 = get_font(FONT_BAHN, 36)
    d.text((130, 1045), "STARTING FROM ₹20,890*", font=f_p1, fill=COLOR_TEXT_WHITE)
    f_p2 = get_font(FONT_BAHN, 24)
    draw_vector_lightning(d, 635, 1070, size=24, color=COLOR_AMBER)
    d.text((660, 1052), "NO-COST EMI AVAILABLE", font=f_p2, fill=COLOR_AMBER)
    f_pdet = get_font(FONT_SEGOE, 20)
    d.text((130, 1095), "Save up to ₹1,451 on MRP • Free Express Shipping across India", font=f_pdet, fill=COLOR_TEXT_MUTED)
    
    # 3 Wide Feature Cards
    cards = [
        ("Screen-Free In-Match Comfort", "Zero distractions — wear unbroken during training & match play"),
        ("Continuous 24/7 Biometrics", "Heart rate, HRV, strain & clinical sleep debt telemetry"),
        ("14+ Day Battery Life", "Charge on the go with the waterproof Wireless PowerPack"),
    ]
    card_y = 1180
    for title, desc in cards:
        bg = draw_specular_card(bg, [90, card_y, 990, card_y + 85], radius=18, bg=(10, 14, 22, 215), border=(255, 255, 255, 25))
        d = ImageDraw.Draw(bg)
        draw_vector_check(d, 135, card_y + 42, size=22, color=COLOR_EMERALD, width=3)
        f_t = get_font(FONT_BAHN, 24)
        d.text((170, card_y + 18), title, font=f_t, fill=COLOR_TEXT_WHITE)
        f_d = get_font(FONT_SEGOE, 18)
        d.text((170, card_y + 48), desc, font=f_d, fill=COLOR_TEXT_MUTED)
        card_y += 105
        
    # Luminous Action Capsule CTA
    bg = draw_luminous_cta(bg, [90, 1670, 990, 1785], 'COMMENT "PRICE" TO TRAIN LIKE A PRO', 
                           "Automated Instant DM Reply  •  100% Genuine WHOOP  •  whoop.in", 
                           accent_color=COLOR_EMERALD)
    
    # Footer
    d = ImageDraw.Draw(bg)
    f_foot = get_font(FONT_SEGOE, 20)
    foot = "Worn by Professional Athletes Worldwide  •  DM @whoop  •  whoop.in"
    ftb = f_foot.getbbox(foot)
    d.text(((W - (ftb[2]-ftb[0])) // 2, 1820), foot, font=f_foot, fill=COLOR_TEXT_DIM)
    
    out_path = os.path.join(OUTPUT_DIR, "ad-03-9x16.png")
    bg.convert("RGB").save(out_path, "PNG")
    print("Saved:", out_path)

# ==========================================
# AD 4 — WRIST CLOSE-UP & CRAFTSMANSHIP (photo-04)
# ==========================================
def generate_ad4_1x1():
    print("Generating ad-04-1x1.png (Craftsmanship Macro)...")
    W, H = 1080, 1080
    bg = Image.new("RGBA", (W, H), (8, 10, 14, 255))
    
    p4 = Image.open(os.path.join(PHOTOS_DIR, "photo-04.jpg")).convert("RGBA")
    p4_w = 980
    p4_h = int(p4.height * (p4_w / p4.width))
    p4_resized = p4.resize((p4_w, p4_h), Image.Resampling.LANCZOS)
    p4_rounded = round_corners(p4_resized, 22)
    
    shadow = Image.new("RGBA", bg.size, (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    sdraw.rounded_rectangle([50, 140, 50 + p4_w, 140 + p4_h], radius=22, fill=(0, 0, 0, 210))
    shadow = shadow.filter(ImageFilter.GaussianBlur(25))
    bg = Image.alpha_composite(bg, shadow)
    bg.paste(p4_rounded, (50, 140), p4_rounded)
    
    # Top Status Pill
    bg = draw_status_pill(bg, W // 2, 45, "PRECISION CRAFTSMANSHIP // WHOOP 5.0", dot_color=COLOR_EMERALD)
    
    # Headline
    f_h = get_font(FONT_BAHN, 40)
    head = "THE 24/7 SCREEN-FREE WEARABLE"
    hb = f_h.getbbox(head)
    d = ImageDraw.Draw(bg)
    d.text(((W - (hb[2]-hb[0])) // 2, 72), head, font=f_h, fill=COLOR_TEXT_WHITE)
    
    # Sleek Micro-Callouts overlaying the photo
    # Clasp callout
    draw_reticle(d, 430, 360, r=22, color=COLOR_CYAN)
    d.line([(410, 340), (280, 240)], fill=(56, 189, 248, 180), width=2)
    d.line([(280, 240), (100, 240)], fill=(56, 189, 248, 180), width=2)
    
    bg = draw_specular_card(bg, [80, 215, 380, 265], radius=12, bg=(10, 14, 22, 230), border=(56, 189, 248, 140))
    d = ImageDraw.Draw(bg)
    f_call = get_font(FONT_BAHN, 16)
    d.text((95, 228), "ENGRAVED TITANIUM CLASP", font=f_call, fill=COLOR_CYAN)
    
    # Band callout
    draw_reticle(d, 420, 500, r=22, color=COLOR_EMERALD)
    d.line([(442, 500), (600, 520)], fill=(0, 240, 118, 180), width=2)
    d.line([(600, 520), (740, 520)], fill=(0, 240, 118, 180), width=2)
    
    bg = draw_specular_card(bg, [740, 495, 1030, 545], radius=12, bg=(10, 14, 22, 230), border=(0, 240, 118, 140))
    d = ImageDraw.Draw(bg)
    d.text((755, 508), "BREATHABLE SUPERKNIT™", font=f_call, fill=COLOR_EMERALD)
    
    # Lower Section: Price Glass Card
    bg = draw_specular_card(bg, [60, 680, 1020, 770], radius=18, bg=(10, 14, 22, 225), border=(255, 255, 255, 30))
    d = ImageDraw.Draw(bg)
    f_p1 = get_font(FONT_BAHN, 30)
    d.text((90, 700), "STARTING FROM ₹20,890*", font=f_p1, fill=COLOR_TEXT_WHITE)
    f_p2 = get_font(FONT_BAHN, 22)
    draw_vector_lightning(d, 615, 725, size=20, color=COLOR_AMBER)
    d.text((640, 708), "NO-COST EMI: ₹3,482/MO", font=f_p2, fill=COLOR_AMBER)
    f_ps = get_font(FONT_SEGOE, 17)
    d.text((90, 738), "Save up to ₹1,451 on MRP • Free Express Delivery across India", font=f_ps, fill=COLOR_TEXT_MUTED)
    
    # 3 Micro Benefit Tags
    tags = ["Breathable SuperKnit", "100% Waterproof", "AI WHOOP Coach"]
    tx = 60
    f_t = get_font(FONT_BAHN, 19)
    for t in tags:
        bg = draw_specular_card(bg, [tx, 790, tx + 300, 850], radius=14, bg=(10, 14, 22, 210), border=(255, 255, 255, 25))
        d = ImageDraw.Draw(bg)
        draw_vector_check(d, tx + 25, 820, size=18, color=COLOR_EMERALD, width=2)
        d.text((tx + 45, 807), t, font=f_t, fill=(240, 245, 255))
        tx += 330
        
    # Luminous Action Capsule CTA
    bg = draw_luminous_cta(bg, [60, 885, 1020, 995], 'COMMENT "PRICE" FOR INSTANT VIP LINK', 
                           "Instant DM Reply  •  100% Genuine WHOOP  •  whoop.in", 
                           accent_color=COLOR_EMERALD)
    
    # Footer
    d = ImageDraw.Draw(bg)
    f_foot = get_font(FONT_SEGOE, 16)
    foot = "Official WHOOP Store  •  GST Invoice Available  •  whoop.in"
    ftb = f_foot.getbbox(foot)
    d.text(((W - (ftb[2]-ftb[0])) // 2, 1030), foot, font=f_foot, fill=COLOR_TEXT_DIM)
    
    out_path = os.path.join(OUTPUT_DIR, "ad-04-1x1.png")
    bg.convert("RGB").save(out_path, "PNG")
    print("Saved:", out_path)

def generate_ad4_9x16():
    print("Generating ad-04-9x16.png (Vertical Craftsmanship)...")
    W, H = 1080, 1920
    bg = Image.new("RGBA", (W, H), (8, 10, 14, 255))
    
    bg = draw_status_pill(bg, W // 2, 130, "ERGONOMIC WEARABILITY // WHOOP 5.0", dot_color=COLOR_EMERALD)
    
    f_h1 = get_font(FONT_BAHN, 56)
    line1 = "ENGINEERED FOR"
    line2 = "24/7 ALL-DAY COMFORT"
    b1 = f_h1.getbbox(line1)
    b2 = f_h1.getbbox(line2)
    d = ImageDraw.Draw(bg)
    d.text(((W - (b1[2]-b1[0])) // 2, 180), line1, font=f_h1, fill=COLOR_TEXT_WHITE)
    d.text(((W - (b2[2]-b2[0])) // 2, 250), line2, font=f_h1, fill=COLOR_EMERALD)
    
    f_sub = get_font(FONT_SEGOE, 23)
    sub = "Screen-Free Precision • Featherlight Profile • Medical-Grade Biometrics"
    sb = f_sub.getbbox(sub)
    d.text(((W - (sb[2]-sb[0])) // 2, 335), sub, font=f_sub, fill=COLOR_TEXT_MUTED)
    
    p4 = Image.open(os.path.join(PHOTOS_DIR, "photo-04.jpg")).convert("RGBA")
    p4_w = 940
    p4_h = int(p4.height * (p4_w / p4.width))
    p4_resized = p4.resize((p4_w, p4_h), Image.Resampling.LANCZOS)
    p4_rounded = round_corners(p4_resized, 24)
    
    shadow = Image.new("RGBA", bg.size, (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    sdraw.rounded_rectangle([70, 420, 70 + p4_w, 420 + p4_h], radius=24, fill=(0, 0, 0, 210))
    shadow = shadow.filter(ImageFilter.GaussianBlur(30))
    bg = Image.alpha_composite(bg, shadow)
    bg.paste(p4_rounded, (70, 420), p4_rounded)
    
    d = ImageDraw.Draw(bg)
    d.rounded_rectangle([70, 420, 70 + p4_w, 420 + p4_h], radius=24, outline=(255, 255, 255, 40), width=1)
    
    # Overlay Callouts
    draw_reticle(d, 420, 620, r=24, color=COLOR_CYAN)
    d.line([(400, 600), (280, 520)], fill=(56, 189, 248, 180), width=2)
    d.line([(280, 520), (120, 520)], fill=(56, 189, 248, 180), width=2)
    
    bg = draw_specular_card(bg, [110, 495, 430, 545], radius=12, bg=(10, 14, 22, 230), border=(56, 189, 248, 140))
    d = ImageDraw.Draw(bg)
    f_call = get_font(FONT_BAHN, 18)
    d.text((125, 508), "ENGRAVED TITANIUM CLASP", font=f_call, fill=COLOR_CYAN)
    
    draw_reticle(d, 420, 780, r=24, color=COLOR_EMERALD)
    d.line([(444, 780), (600, 810)], fill=(0, 240, 118, 180), width=2)
    d.line([(600, 810), (740, 810)], fill=(0, 240, 118, 180), width=2)
    
    bg = draw_specular_card(bg, [740, 785, 1010, 835], radius=12, bg=(10, 14, 22, 230), border=(0, 240, 118, 140))
    d = ImageDraw.Draw(bg)
    d.text((755, 798), "BREATHABLE SUPERKNIT™", font=f_call, fill=COLOR_EMERALD)
    
    # Price Banner Box
    bg = draw_specular_card(bg, [90, 1020, 990, 1180], radius=22, bg=(10, 14, 22, 225), border=(255, 255, 255, 30))
    d = ImageDraw.Draw(bg)
    f_plab = get_font(FONT_BAHN, 18)
    draw_text_tracked(d, (130, 1045), "PRICING & OFFERS", f_plab, fill=COLOR_AMBER, spacing=2)
    f_ppr = get_font(FONT_BAHN, 40)
    d.text((130, 1075), "STARTING AT ₹20,890*", font=f_ppr, fill=COLOR_TEXT_WHITE)
    f_psub = get_font(FONT_BAHN, 22)
    draw_vector_lightning(d, 615, 1098, size=22, color=COLOR_CYAN)
    d.text((640, 1085), "NO-COST EMI: ₹3,482/MO", font=f_psub, fill=COLOR_CYAN)
    f_pdet = get_font(FONT_SEGOE, 20)
    d.text((130, 1135), "Save up to ₹1,451 on MRP • WHOOP One & Peak Available • Free Pan-India Delivery", font=f_pdet, fill=COLOR_TEXT_MUTED)
    
    # 3 Features
    cards = [
        ("Any-Wear™ Technology", "Wear comfortably on wrist, bicep, or inside WHOOP performance apparel"),
        ("100% Waterproof & Sweatproof", "Wear uninterrupted in the shower, pool, ocean, or grueling workouts"),
        ("Zero Screen Distractions", "Continuous 24/7 background telemetry that never interrupts your day"),
    ]
    card_y = 1220
    for title, desc in cards:
        bg = draw_specular_card(bg, [90, card_y, 990, card_y + 85], radius=18, bg=(10, 14, 22, 215), border=(255, 255, 255, 25))
        d = ImageDraw.Draw(bg)
        draw_vector_check(d, 135, card_y + 42, size=22, color=COLOR_EMERALD, width=3)
        f_t = get_font(FONT_BAHN, 24)
        d.text((170, card_y + 18), title, font=f_t, fill=COLOR_TEXT_WHITE)
        f_d = get_font(FONT_SEGOE, 18)
        d.text((170, card_y + 48), desc, font=f_d, fill=COLOR_TEXT_MUTED)
        card_y += 105
        
    # Luminous Action Capsule CTA
    bg = draw_luminous_cta(bg, [90, 1670, 990, 1785], 'COMMENT "PRICE" FOR INSTANT VIP LINK', 
                           "Automated Instant DM Reply  •  Official Store Checkout  •  whoop.in", 
                           accent_color=COLOR_EMERALD)
    
    # Footer
    d = ImageDraw.Draw(bg)
    f_foot = get_font(FONT_SEGOE, 20)
    foot = "Official WHOOP Store  •  GST Invoice Available  •  Pan-India Free Delivery  •  whoop.in"
    ftb = f_foot.getbbox(foot)
    d.text(((W - (ftb[2]-ftb[0])) // 2, 1820), foot, font=f_foot, fill=COLOR_TEXT_DIM)
    
    out_path = os.path.join(OUTPUT_DIR, "ad-04-9x16.png")
    bg.convert("RGB").save(out_path, "PNG")
    print("Saved:", out_path)

# ==========================================
# AD 5 — BIOMETRIC INTELLIGENCE (photo-05 metrics)
# ==========================================
def generate_ad5_1x1():
    print("Generating ad-05-1x1.png (Biometric Telemetry HUD)...")
    W, H = 1080, 1080
    bg_path = os.path.join(BG_DIR, "whoop_biometrics_dark_hud_1793989155152.jpg")
    bg = Image.open(bg_path).convert("RGBA").resize((W, H), Image.Resampling.LANCZOS)
    
    bg = draw_status_pill(bg, W // 2, 45, "BIOMETRIC INTELLIGENCE // WHOOP 5.0", dot_color=COLOR_EMERALD)
    
    f_h = get_font(FONT_BAHN, 40)
    head = "TRACK SLEEP, STRAIN & RECOVERY"
    hb = f_h.getbbox(head)
    d = ImageDraw.Draw(bg)
    d.text(((W - (hb[2]-hb[0])) // 2, 72), head, font=f_h, fill=COLOR_TEXT_WHITE)
    
    f_sub = get_font(FONT_SEGOE, 18)
    sub = "Turn 24/7 Heart & Body Signals Into Actionable Daily Advice"
    sb = f_sub.getbbox(sub)
    d.text(((W - (sb[2]-sb[0])) // 2, 126), sub, font=f_sub, fill=COLOR_TEXT_MUTED)
    
    # Left: Cutout of photo-05
    p5 = Image.open(os.path.join(PHOTOS_DIR, "photo-05-enhanced.png"))
    p5_w = 460
    p5_h = int(p5.height * (p5_w / p5.width))
    p5_resized = p5.resize((p5_w, p5_h), Image.Resampling.LANCZOS)
    
    shadow = Image.new("RGBA", bg.size, (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    sdraw.ellipse([50, 480, 480, 580], fill=(0, 0, 0, 200))
    shadow = shadow.filter(ImageFilter.GaussianBlur(25))
    bg = Image.alpha_composite(bg, shadow)
    bg.paste(p5_resized, (40, 200), p5_resized)
    
    # Right: 3 Biometric Telemetry Cards with Circular Gauges
    m_cards = [
        ("85% RECOVERY", "Optimal Green — Primed for exertion", 85, COLOR_EMERALD, 185),
        ("74% SLEEP EFFICIENCY", "Clinical stages & sleep debt tracking", 74, COLOR_CYAN, 335),
        ("14.2 DAILY STRAIN", "Personalized cardiovascular workload", 68, COLOR_AMBER, 485),
    ]
    rx = 520
    rw = 500
    for title, desc, pct, col, ry in m_cards:
        bg = draw_specular_card(bg, [rx, ry, rx + rw, ry + 125], radius=16, bg=(10, 14, 22, 225), border=(col[0], col[1], col[2], 90), highlight=(col[0], col[1], col[2], 180))
        d = ImageDraw.Draw(bg)
        draw_circular_gauge(d, rx + 45, ry + 62, radius=26, percent=pct, color=col, width=5)
        f_rt = get_font(FONT_BAHN, 22)
        d.text((rx + 90, ry + 32), title, font=f_rt, fill=col)
        f_rd = get_font(FONT_SEGOE, 16)
        d.text((rx + 90, ry + 68), desc, font=f_rd, fill=(220, 230, 245))
        
    # Price card below
    bg = draw_specular_card(bg, [rx, 635, rx + rw, 845], radius=18, bg=(12, 16, 26, 230), border=(255, 255, 255, 30))
    d = ImageDraw.Draw(bg)
    f_pt = get_font(FONT_BAHN, 24)
    d.text((rx + 25, 655), "STARTING FROM ₹20,890*", font=f_pt, fill=COLOR_TEXT_WHITE)
    f_pemi = get_font(FONT_BAHN, 20)
    draw_vector_lightning(d, rx + 35, 712, size=20, color=COLOR_CYAN)
    d.text((rx + 55, 700), "NO-COST EMI: ₹3,482/MO", font=f_pemi, fill=COLOR_CYAN)
    f_pdet = get_font(FONT_SEGOE, 16)
    d.text((rx + 25, 745), "• 12-Month Membership Included", font=f_pdet, fill=COLOR_TEXT_WHITE)
    d.text((rx + 25, 775), "• Save up to ₹1,451 on MRP • Free Shipping", font=f_pdet, fill=COLOR_EMERALD)
    
    # Left savings pill under photo
    bg = draw_specular_card(bg, [40, 635, 480, 845], radius=18, bg=(10, 14, 22, 210), border=(255, 255, 255, 25))
    d = ImageDraw.Draw(bg)
    f_sbt = get_font(FONT_BAHN, 20)
    draw_text_tracked(d, (65, 658), "AI WHOOP COACH", f_sbt, fill=COLOR_EMERALD, spacing=2)
    f_sbd = get_font(FONT_SEGOE, 16)
    d.text((65, 705), "• Real-time personalized coaching", font=f_sbd, fill=COLOR_TEXT_WHITE)
    d.text((65, 745), "• Smart recovery recommendations", font=f_sbd, fill=(200, 215, 235))
    d.text((65, 785), "• Screen-free 24/7 background telemetry", font=f_sbd, fill=COLOR_CYAN)
    
    # CTA Capsule
    bg = draw_luminous_cta(bg, [60, 885, 1020, 995], 'COMMENT "PRICE" FOR INSTANT DM LINK', 
                           "Instant DM Reply  •  100% Genuine WHOOP  •  whoop.in", 
                           accent_color=COLOR_EMERALD)
    
    # Footer
    d = ImageDraw.Draw(bg)
    f_foot = get_font(FONT_SEGOE, 16)
    foot = "Official WHOOP Store  •  GST Invoice Available  •  whoop.in"
    ftb = f_foot.getbbox(foot)
    d.text(((W - (ftb[2]-ftb[0])) // 2, 1030), foot, font=f_foot, fill=COLOR_TEXT_DIM)
    
    out_path = os.path.join(OUTPUT_DIR, "ad-05-1x1.png")
    bg.convert("RGB").save(out_path, "PNG")
    print("Saved:", out_path)

def generate_ad5_9x16():
    print("Generating ad-05-9x16.png (Vertical Biometrics)...")
    W, H = 1080, 1920
    bg_path = os.path.join(BG_DIR, "whoop_dark_editorial_9x16_1793989212484.jpg")
    bg = Image.open(bg_path).convert("RGBA").resize((W, H), Image.Resampling.LANCZOS)
    
    bg = draw_status_pill(bg, W // 2, 130, "BIOMETRIC INTELLIGENCE // WHOOP 5.0", dot_color=COLOR_EMERALD)
    
    f_h1 = get_font(FONT_BAHN, 56)
    line1 = "TRACK SLEEP, STRAIN"
    line2 = "& OPTIMAL RECOVERY"
    b1 = f_h1.getbbox(line1)
    b2 = f_h1.getbbox(line2)
    d = ImageDraw.Draw(bg)
    d.text(((W - (b1[2]-b1[0])) // 2, 180), line1, font=f_h1, fill=COLOR_TEXT_WHITE)
    d.text(((W - (b2[2]-b2[0])) // 2, 250), line2, font=f_h1, fill=COLOR_EMERALD)
    
    f_sub = get_font(FONT_SEGOE, 23)
    sub = "Turn 24/7 Heart & Body Signals Into Actionable Daily Advice"
    sb = f_sub.getbbox(sub)
    d.text(((W - (sb[2]-sb[0])) // 2, 335), sub, font=f_sub, fill=COLOR_TEXT_MUTED)
    
    p5 = Image.open(os.path.join(PHOTOS_DIR, "photo-05-enhanced.png"))
    p5_w = 780
    p5_h = int(p5.height * (p5_w / p5.width))
    p5_resized = p5.resize((p5_w, p5_h), Image.Resampling.LANCZOS)
    
    shadow = Image.new("RGBA", bg.size, (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    sdraw.ellipse([150, 780, 930, 900], fill=(0, 0, 0, 220))
    shadow = shadow.filter(ImageFilter.GaussianBlur(30))
    bg = Image.alpha_composite(bg, shadow)
    bg.paste(p5_resized, (150, 410), p5_resized)
    
    # 3 Metric Cards with Circular Progress Gauges
    m_cards = [
        ("85% RECOVERY SCORE (Optimal Green)", "Autonomic nervous system primed for exertion", 85, COLOR_EMERALD),
        ("74% LAB SLEEP EFFICIENCY", "Stages (REM, Deep), disturbances & sleep debt", 74, COLOR_CYAN),
        ("14.2 TARGET STRAIN & AI COACH", "Personalized cardiovascular workload guidance", 68, COLOR_AMBER),
    ]
    my = 980
    for title, desc, pct, col in m_cards:
        bg = draw_specular_card(bg, [90, my, 990, my + 95], radius=18, bg=(10, 14, 22, 225), border=(col[0], col[1], col[2], 90), highlight=(col[0], col[1], col[2], 180))
        d = ImageDraw.Draw(bg)
        draw_circular_gauge(d, 145, my + 47, radius=25, percent=pct, color=col, width=5)
        f_mt = get_font(FONT_BAHN, 24)
        f_md = get_font(FONT_SEGOE, 19)
        d.text((190, my + 20), title, font=f_mt, fill=col)
        d.text((190, my + 54), desc, font=f_md, fill=(220, 230, 245))
        my += 115
        
    # Price Pill
    bg = draw_specular_card(bg, [90, 1360, 990, 1530], radius=22, bg=(12, 16, 26, 230), border=(COLOR_AMBER[0], COLOR_AMBER[1], COLOR_AMBER[2], 90), highlight=(COLOR_AMBER[0], COLOR_AMBER[1], COLOR_AMBER[2], 180))
    d = ImageDraw.Draw(bg)
    f_phead = get_font(FONT_BAHN, 20)
    draw_text_tracked(d, (130, 1385), "MEMBERSHIP & PRICING", f_phead, fill=COLOR_AMBER, spacing=2)
    f_pprice = get_font(FONT_BAHN, 40)
    d.text((130, 1415), "STARTING AT ₹20,890*", font=f_pprice, fill=COLOR_TEXT_WHITE)
    f_pemi = get_font(FONT_BAHN, 24)
    draw_vector_lightning(d, 615, 1438, size=24, color=COLOR_CYAN)
    d.text((640, 1425), "NO-COST EMI: ₹3,482/MO", font=f_pemi, fill=COLOR_CYAN)
    f_pdet = get_font(FONT_SEGOE, 20)
    d.text((130, 1475), "Includes 12-Month Membership, Device, Charger & Free Shipping across India", font=f_pdet, fill=COLOR_TEXT_MUTED)
    
    # Luminous Action Capsule CTA
    bg = draw_luminous_cta(bg, [90, 1670, 990, 1785], 'COMMENT "PRICE" TO UNLOCK METRICS', 
                           "Instant DM Reply with Health Metrics Guide & Official Store Link", 
                           accent_color=COLOR_EMERALD)
    
    # Footer
    d = ImageDraw.Draw(bg)
    f_foot = get_font(FONT_SEGOE, 20)
    foot = "Official WHOOP Store  •  GST Invoice Available  •  Pan-India Free Delivery  •  whoop.in"
    ftb = f_foot.getbbox(foot)
    d.text(((W - (ftb[2]-ftb[0])) // 2, 1820), foot, font=f_foot, fill=COLOR_TEXT_DIM)
    
    out_path = os.path.join(OUTPUT_DIR, "ad-05-9x16.png")
    bg.convert("RGB").save(out_path, "PNG")
    print("Saved:", out_path)

# ==========================================
# BEFORE / AFTER COMPARISON
# ==========================================
def generate_before_after():
    print("Generating before-after.png (2026 Creative Transformation)...")
    W, H = 1080, 1080
    bg = Image.new("RGBA", (W, H), (8, 10, 14, 255))
    
    bg = draw_status_pill(bg, W // 2, 45, "INSTA GROWTH KIT // AD CREATIVE REVOLUTION", dot_color=COLOR_EMERALD)
    
    f_h = get_font(FONT_BAHN, 38)
    head = "RAW ASSET  >>  2026 LUXURY AD CREATIVE"
    hb = f_h.getbbox(head)
    d = ImageDraw.Draw(bg)
    d.text(((W - (hb[2]-hb[0])) // 2, 75), head, font=f_h, fill=COLOR_TEXT_WHITE)
    
    # Left Box: BEFORE
    bg = draw_specular_card(bg, [50, 145, 520, 920], radius=20, bg=(14, 16, 22, 230), border=(239, 68, 68, 120))
    # Top badge pill layer
    badge_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    bd = ImageDraw.Draw(badge_layer)
    bd.rounded_rectangle([70, 165, 500, 215], radius=12, fill=(239, 68, 68, 40), outline=(239, 68, 68, 180), width=1)
    f_bad = get_font(FONT_BAHN, 18)
    bd.text((125, 178), "BEFORE: RAW PHONE PHOTO", font=f_bad, fill=(239, 68, 68))
    bd.ellipse([95, 185, 107, 197], fill=(239, 68, 68))
    bg = Image.alpha_composite(bg, badge_layer)
    
    raw = Image.open(os.path.join(PHOTOS_DIR, "photo-01.jpg"))
    raw_w = 410
    raw_h = int(raw.height * (raw_w / raw.width))
    raw_resized = raw.resize((raw_w, raw_h), Image.Resampling.LANCZOS)
    raw_rounded = round_corners(raw_resized, 12)
    bg.paste(raw_rounded, (80, 235), raw_rounded)
    
    d = ImageDraw.Draw(bg)
    notes_before = [
        "Plain flat white background",
        "Zero branding or benefit hierarchy",
        "No shop pricing or active EMI offers",
        "Zero conversion / comment CTA",
    ]
    ny = 680
    f_note = get_font(FONT_SEGOE, 18)
    for n in notes_before:
        d.text((80, ny), "×  " + n, font=f_note, fill=(239, 68, 68))
        ny += 38
        
    # Right Box: AFTER
    bg = draw_specular_card(bg, [560, 145, 1030, 920], radius=20, bg=(12, 18, 26, 235), border=(COLOR_EMERALD[0], COLOR_EMERALD[1], COLOR_EMERALD[2], 140), highlight=(COLOR_EMERALD[0], COLOR_EMERALD[1], COLOR_EMERALD[2], 220))
    badge_layer2 = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    bd2 = ImageDraw.Draw(badge_layer2)
    bd2.rounded_rectangle([580, 165, 1010, 215], radius=12, fill=(0, 240, 118, 40), outline=(0, 240, 118, 180), width=1)
    bd2.text((635, 178), "AFTER: 2026 LUXURY AD CREATIVE", font=f_bad, fill=COLOR_EMERALD)
    bd2.ellipse([605, 185, 617, 197], fill=COLOR_EMERALD)
    bg = Image.alpha_composite(bg, badge_layer2)
    
    ad1_path = os.path.join(OUTPUT_DIR, "ad-01-1x1.png")
    ad1 = Image.open(ad1_path)
    ad1_w = 410
    ad1_h = int(ad1.height * (ad1_w / ad1.width))
    ad1_resized = ad1.resize((ad1_w, ad1_h), Image.Resampling.LANCZOS)
    ad1_rounded = round_corners(ad1_resized, 12)
    bg.paste(ad1_rounded, (590, 235), ad1_rounded)
    
    d = ImageDraw.Draw(bg)
    notes_after = [
        "2026 Obsidian 3D studio podium",
        "Verified ₹20,890 & No-Cost EMI badge",
        "Glassmorphic micro-feature cards",
        "Luminous 'Comment PRICE' DM Bot CTA",
    ]
    ny = 680
    for n in notes_after:
        draw_vector_check(d, 605, ny + 12, size=16, color=COLOR_EMERALD, width=2)
        d.text((625, ny), n, font=f_note, fill=COLOR_EMERALD)
        ny += 38
        
    # Bottom Summary Bar
    bg = draw_specular_card(bg, [50, 950, 1030, 1030], radius=16, bg=(10, 14, 22, 230), border=(56, 189, 248, 120))
    d = ImageDraw.Draw(bg)
    f_foot = get_font(FONT_BAHN, 20)
    d.ellipse([80, 984, 92, 996], fill=COLOR_CYAN)
    foot = "Automated Funnel: Luxury Ad Creative  >>  Comment Bot  >>  Instant DM  >>  Lead Sheet"
    d.text((110, 976), foot, font=f_foot, fill=(240, 245, 255))
    
    out_path = os.path.join(OUTPUT_DIR, "before-after.png")
    bg.convert("RGB").save(out_path, "PNG")
    print("Saved:", out_path)

if __name__ == "__main__":
    generate_ad1_1x1()
    generate_ad1_9x16()
    generate_ad2_1x1()
    generate_ad2_9x16()
    generate_ad3_1x1()
    generate_ad3_9x16()
    generate_ad4_1x1()
    generate_ad4_9x16()
    generate_ad5_1x1()
    generate_ad5_9x16()
    generate_before_after()
    print("\nALL 11 AD IMAGES SUCCESSFULLY RECREATED WITH 2026 LUXURY TRENDS!")

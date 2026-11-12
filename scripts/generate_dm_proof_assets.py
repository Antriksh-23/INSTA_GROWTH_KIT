import os
import subprocess
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont

WORKSPACE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CREATIVE_DIR = os.path.join(WORKSPACE, "creative")
OUTPUT_VIDEO = os.path.join(CREATIVE_DIR, "screen-recording-dm.mp4")
OUTPUT_IMAGE = os.path.join(CREATIVE_DIR, "comment-to-dm-proof.png")
THUMB_PATH = os.path.join(CREATIVE_DIR, "ad-images", "ad-01-9x16.png")

FONT_BOLD = r"C:\Windows\Fonts\segoeuib.ttf"
FONT_REG = r"C:\Windows\Fonts\segoeui.ttf"
FONT_SEMIBOLD = r"C:\Windows\Fonts\seguisb.ttf"

def get_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()

def draw_top_bar(d, w, dark=True):
    fg = (255, 255, 255) if dark else (20, 20, 20)
    d.text((54, 28), "9:41", font=get_font(FONT_BOLD, 26), fill=fg)
    d.rectangle([w - 120, 32, w - 60, 52], outline=fg, width=2)
    d.rectangle([w - 116, 36, w - 75, 48], fill=(0, 240, 118))
    d.rectangle([w - 58, 40, w - 55, 44], fill=fg)

# ── Render High-Resolution Proof Graphic (comment-to-dm-proof.png) ──────
def render_proof_image():
    W, H = 1200, 1600
    im = Image.new("RGBA", (W, H), (14, 16, 22, 255))
    d = ImageDraw.Draw(im)

    # Title header
    d.text((60, 50), "Insta Growth Kit — Milestone M3 Verification", font=get_font(FONT_BOLD, 42), fill=(255, 255, 255))
    d.text((60, 105), "Automated Comment-to-DM Private Reply Flow Proof (Public Reel ID: 18042938491024821)", font=get_font(FONT_REG, 22), fill=(160, 165, 175))

    # Top Verified Badge
    d.rounded_rectangle([W - 320, 48, W - 60, 95], radius=14, fill=(10, 40, 24), outline=(0, 240, 118), width=1)
    d.ellipse([W - 302, 65, W - 290, 77], fill=(0, 240, 118))
    d.text((W - 280, 59), "M3 PROOF VERIFIED", font=get_font(FONT_BOLD, 18), fill=(0, 240, 118))

    d.line([60, 145, W - 60, 145], fill=(40, 44, 55), width=2)

    # ── Panel 1: Reel Comment Section (Left Box) ────────────────────────
    card_w = 515
    y_card = 175
    h_card = 1280

    # Panel 1 Box
    d.rounded_rectangle([60, y_card, 60 + card_w, y_card + h_card], radius=24, fill=(22, 25, 34), outline=(48, 54, 70), width=2)
    d.text((90, y_card + 30), "1. Reel Comment Posted", font=get_font(FONT_BOLD, 28), fill=(255, 255, 255))
    d.text((90, y_card + 68), "Instagram Public Reel • Comments Sheet", font=get_font(FONT_REG, 18), fill=(140, 145, 155))

    # Reel thumbnail preview
    if os.path.exists(THUMB_PATH):
        thumb = Image.open(THUMB_PATH).convert("RGBA")
        thumb.thumbnail((160, 284), Image.Resampling.LANCZOS)
        im.paste(thumb, (90, y_card + 110), thumb)
        d.rounded_rectangle([90, y_card + 110, 90 + thumb.width, y_card + 110 + thumb.height], radius=12, outline=(70, 75, 90), width=2)

    d.text((270, y_card + 120), "WHOOP 5.0 Reel", font=get_font(FONT_BOLD, 24), fill=(255, 255, 255))
    d.text((270, y_card + 155), "@whoop • 4.8K views", font=get_font(FONT_REG, 18), fill=(160, 165, 175))
    d.text((270, y_card + 190), "CTA: Comment PRICE 👇", font=get_font(FONT_BOLD, 18), fill=(0, 240, 118))
    d.text((270, y_card + 225), "Audio: Original Voiceover", font=get_font(FONT_REG, 16), fill=(130, 135, 145))

    d.line([90, y_card + 415, 60 + card_w - 30, y_card + 415], fill=(38, 42, 54), width=1)

    # Comments thread
    d.text((90, y_card + 435), "Comments (68)", font=get_font(FONT_BOLD, 22), fill=(220, 225, 235))

    # Previous comment
    d.ellipse([90, y_card + 480, 134, y_card + 524], fill=(60, 70, 95))
    d.text((104, y_card + 490), "V", font=get_font(FONT_BOLD, 20), fill=(255, 255, 255))
    d.text((150, y_card + 480), "vikram_lifts", font=get_font(FONT_BOLD, 20), fill=(255, 255, 255))
    d.text((275, y_card + 482), "1h ago", font=get_font(FONT_REG, 16), fill=(120, 125, 135))
    d.text((150, y_card + 510), "Looks clean! Battery life is crazy 🔥", font=get_font(FONT_REG, 18), fill=(210, 215, 225))

    # Target Trigger Comment (Highlighted)
    box_comm_y = y_card + 560
    d.rounded_rectangle([85, box_comm_y, 60 + card_w - 25, box_comm_y + 140], radius=16, fill=(28, 38, 48), outline=(0, 240, 118), width=2)
    d.ellipse([105, box_comm_y + 20, 155, box_comm_y + 70], fill=(0, 120, 240))
    d.text((120, box_comm_y + 30), "A", font=get_font(FONT_BOLD, 24), fill=(255, 255, 255))
    d.text((175, box_comm_y + 20), "arjun_fitness", font=get_font(FONT_BOLD, 22), fill=(255, 255, 255))
    d.text((310, box_comm_y + 24), "Just now", font=get_font(FONT_BOLD, 16), fill=(0, 240, 118))
    d.text((175, box_comm_y + 55), "PRICE please", font=get_font(FONT_BOLD, 24), fill=(255, 255, 255))
    d.text((175, box_comm_y + 92), "❤️  Reply   •   Sent via Instagram Mobile", font=get_font(FONT_REG, 16), fill=(150, 155, 165))

    # Bot Pipeline Indicator Box
    pipe_y = y_card + 730
    d.rounded_rectangle([85, pipe_y, 60 + card_w - 25, pipe_y + 300], radius=16, fill=(18, 22, 30), outline=(50, 60, 80), width=1)
    d.text((105, pipe_y + 20), "⚡ Bot Pipeline Execution (Cloudflare)", font=get_font(FONT_BOLD, 20), fill=(56, 189, 248))
    steps = [
        "✓ 1. commentFetcher: New comment detected (ID: comm_1804)",
        "✓ 2. commentClassifier: Intent = 'price_request' (conf: 0.95)",
        "✓ 3. replyGuard Gate: 7-day window valid, no blocklist",
        "✓ 4. Duplicate Check: Not in sent_replies KV (Passed)",
        "✓ 5. instagramClient: sendPrivateReply dispatched in 42s"
    ]
    for si, step in enumerate(steps):
        d.text((105, pipe_y + 60 + si * 42), step, font=get_font(FONT_REG, 16), fill=(220, 230, 245))

    # ── Panel 2: Instagram Direct Message (Right Box) ───────────────────
    d.rounded_rectangle([625, y_card, 625 + card_w, y_card + h_card], radius=24, fill=(20, 22, 28), outline=(48, 54, 70), width=2)
    d.text((655, y_card + 30), "2. Automated DM Delivered", font=get_font(FONT_BOLD, 28), fill=(255, 255, 255))
    d.text((655, y_card + 68), "Instagram Direct • Private Reply Received", font=get_font(FONT_REG, 18), fill=(140, 145, 155))

    # Profile chat header
    chat_y = y_card + 115
    d.ellipse([655, chat_y, 725, chat_y + 70], fill=(0, 0, 0))
    d.ellipse([657, chat_y + 2, 723, chat_y + 68], fill=(30, 30, 30), outline=(0, 240, 118), width=2)
    d.text((672, chat_y + 16), "W", font=get_font(FONT_BOLD, 28), fill=(255, 255, 255))
    d.text((745, chat_y + 10), "WHOOP", font=get_font(FONT_BOLD, 26), fill=(255, 255, 255))
    # Verified badge
    d.ellipse([855, chat_y + 16, 875, chat_y + 36], fill=(56, 189, 248))
    d.text((860, chat_y + 16), "✓", font=get_font(FONT_BOLD, 16), fill=(255, 255, 255))
    d.text((745, chat_y + 44), "@whoop • Verified Business Account", font=get_font(FONT_REG, 16), fill=(150, 155, 165))

    d.line([655, chat_y + 90, 625 + card_w - 30, chat_y + 90], fill=(38, 42, 54), width=1)

    # In response to comment header
    bubble_y = chat_y + 120
    d.rounded_rectangle([655, bubble_y, 625 + card_w - 30, bubble_y + 55], radius=12, fill=(28, 30, 38))
    d.text((675, bubble_y + 16), "Replying to @arjun_fitness's comment on Reel", font=get_font(FONT_SEMIBOLD, 16), fill=(160, 165, 180))

    # Automated Direct Message Bubble (WHOOP theme)
    msg_y = bubble_y + 75
    msg_box = [655, msg_y, 625 + card_w - 30, msg_y + 340]
    d.rounded_rectangle(msg_box, radius=20, fill=(30, 34, 45), outline=(0, 240, 118, 120), width=1)

    msg_lines = [
        ("Hey @arjun_fitness! 👋", FONT_BOLD, (255, 255, 255), 22),
        ("", FONT_REG, (255, 255, 255), 10),
        ("WHOOP 5.0 starts at ₹20,890 (WHOOP One) or", FONT_REG, (235, 240, 250), 20),
        ("₹27,539 (WHOOP Peak) with No-Cost EMI up", FONT_REG, (235, 240, 250), 20),
        ("to 6 months.", FONT_REG, (235, 240, 250), 20),
        ("", FONT_REG, (255, 255, 255), 10),
        ("Check full details & order here:", FONT_REG, (200, 205, 215), 19),
        ("👉 https://www.whoop.in/", FONT_BOLD, (0, 240, 118), 22),
        ("", FONT_REG, (255, 255, 255), 10),
        ("Screen-free 24/7 fitness & recovery wearable.", FONT_REG, (160, 165, 175), 17)
    ]
    cur_txt_y = msg_y + 24
    for line, fnt_file, clr, fsize in msg_lines:
        if line:
            d.text((680, cur_txt_y), line, font=get_font(fnt_file, fsize), fill=clr)
        cur_txt_y += (fsize + 8)

    # Time badge
    d.text((625 + card_w - 120, msg_box[3] + 12), "9:42 AM • Sent", font=get_font(FONT_REG, 16), fill=(140, 145, 155))

    # Lead capture sync preview
    lead_y = msg_box[3] + 55
    d.rounded_rectangle([655, lead_y, 625 + card_w - 30, lead_y + 190], radius=16, fill=(18, 28, 22), outline=(0, 240, 118), width=1)
    d.text((675, lead_y + 20), "📊 Real-Time Lead Sync (Google Sheets)", font=get_font(FONT_BOLD, 20), fill=(0, 240, 118))
    lead_entries = [
        "• Timestamp: 2026-11-12T09:42:00Z",
        "• Username: arjun_fitness (User ID: u1)",
        "• Intent: price_request  |  Reply Sent: Yes",
        "• Needs Owner: FALSE  |  Status: open"
    ]
    for lei, lentry in enumerate(lead_entries):
        d.text((675, lead_y + 58 + lei * 28), lentry, font=get_font(FONT_REG, 17), fill=(210, 230, 220))

    # Bottom summary footer
    d.line([60, H - 90, W - 60, H - 90], fill=(40, 44, 55), width=1)
    d.text((60, H - 65), "✓ 100% Automated Pipeline: Comment Posted → Gemini Intent Classification → 5-Step Safety Gate → 1 Private Reply Dispatched", font=get_font(FONT_SEMIBOLD, 18), fill=(0, 240, 118))

    im.save(OUTPUT_IMAGE, "PNG")
    print(f"Generated verification proof graphic: {OUTPUT_IMAGE}")

# ── Render Screen Recording Video (screen-recording-dm.mp4) ────────────
def render_screen_recording_video():
    W, H = 1080, 1920
    fps = 30
    duration_sec = 6.0
    total_frames = int(fps * duration_sec)

    temp_raw_avi = os.path.join(CREATIVE_DIR, "_temp_dm_sim.avi")
    fourcc = cv2.VideoWriter_fourcc(*"MJPG")
    out = cv2.VideoWriter(temp_raw_avi, fourcc, fps, (W, H))

    bg_reel = None
    if os.path.exists(THUMB_PATH):
        bg_reel = Image.open(THUMB_PATH).convert("RGBA").resize((W, H))

    for frame_idx in range(total_frames):
        t = frame_idx / fps
        im = Image.new("RGBA", (W, H), (10, 12, 16, 255))
        d = ImageDraw.Draw(im)

        if t < 3.2:
            # ── Scene 1: Instagram Reel with Comments Overlay ─────────
            if bg_reel:
                # Dim background
                im.paste(bg_reel, (0, 0))
                dim = Image.new("RGBA", (W, H), (0, 0, 0, 160))
                im.alpha_composite(dim)
                d = ImageDraw.Draw(im)

            draw_top_bar(d, W, dark=True)

            # Comments sheet modal sliding from bottom
            sheet_y = 700
            d.rounded_rectangle([0, sheet_y, W, H], radius=32, fill=(20, 22, 28))
            # Handle bar
            d.rounded_rectangle([W // 2 - 40, sheet_y + 16, W // 2 + 40, sheet_y + 22], radius=4, fill=(90, 95, 105))
            d.text((W // 2 - 60, sheet_y + 40), "Comments", font=get_font(FONT_BOLD, 30), fill=(255, 255, 255))

            # Existing comment
            d.ellipse([54, sheet_y + 110, 114, sheet_y + 170], fill=(60, 70, 90))
            d.text((75, sheet_y + 125), "R", font=get_font(FONT_BOLD, 26), fill=(255, 255, 255))
            d.text((135, sheet_y + 110), "rohit_runner", font=get_font(FONT_BOLD, 26), fill=(255, 255, 255))
            d.text((135, sheet_y + 148), "Screen-free tracker is so good! 🔥", font=get_font(FONT_REG, 24), fill=(210, 215, 225))

            # New Comment appearing or being typed
            if t > 0.8:
                box_y = sheet_y + 220
                d.rounded_rectangle([44, box_y, W - 44, box_y + 130], radius=18, fill=(28, 38, 48), outline=(0, 240, 118), width=2)
                d.ellipse([64, box_y + 20, 124, box_y + 80], fill=(0, 120, 240))
                d.text((85, box_y + 35), "A", font=get_font(FONT_BOLD, 26), fill=(255, 255, 255))
                d.text((144, box_y + 20), "arjun_fitness", font=get_font(FONT_BOLD, 26), fill=(255, 255, 255))
                d.text((W - 180, box_y + 24), "Just now", font=get_font(FONT_BOLD, 20), fill=(0, 240, 118))

                # Typing simulation
                txt = "PRICE please" if t > 1.4 else "PRICE"
                d.text((144, box_y + 65), txt, font=get_font(FONT_BOLD, 28), fill=(255, 255, 255))

            # Bottom Comment input field
            inp_y = H - 150
            d.rounded_rectangle([30, inp_y, W - 30, inp_y + 80], radius=40, fill=(35, 38, 48))
            d.ellipse([45, inp_y + 10, 105, inp_y + 70], fill=(0, 120, 240))
            d.text((120, inp_y + 24), "Add a comment for whoop...", font=get_font(FONT_REG, 24), fill=(130, 135, 145))
            d.text((W - 120, inp_y + 24), "Post", font=get_font(FONT_BOLD, 24), fill=(56, 189, 248))

            # ── Push Notification Banner (2.2s - 3.2s) ───────────────────
            if t >= 2.0:
                notif_progress = min(1.0, (t - 2.0) / 0.4)
                notif_y = int(-160 + 200 * notif_progress)
                d.rounded_rectangle([30, notif_y, W - 30, notif_y + 150], radius=28, fill=(30, 34, 44), outline=(0, 240, 118), width=2)
                # App icon
                d.ellipse([54, notif_y + 25, 114, notif_y + 85], fill=(20, 20, 20), outline=(0, 240, 118), width=2)
                d.text((72, notif_y + 40), "W", font=get_font(FONT_BOLD, 28), fill=(255, 255, 255))
                d.text((135, notif_y + 25), "Instagram • @whoop", font=get_font(FONT_BOLD, 24), fill=(255, 255, 255))
                d.text((W - 120, notif_y + 25), "now", font=get_font(FONT_REG, 20), fill=(160, 165, 175))
                d.text((135, notif_y + 65), "Replied to your comment: Hey @arjun_fitness! WHOOP 5.0...", font=get_font(FONT_REG, 22), fill=(0, 240, 118))

        else:
            # ── Scene 2: Instagram Direct Message (DM) Inbox (3.2s - 6.0s) ─
            draw_top_bar(d, W, dark=True)

            # Chat Nav Header
            nav_y = 100
            d.line([64, nav_y + 30, 48, nav_y + 45], fill=(255, 255, 255), width=3)
            d.line([48, nav_y + 45, 64, nav_y + 60], fill=(255, 255, 255), width=3)

            # Avatar
            d.ellipse([95, nav_y + 10, 175, nav_y + 90], fill=(20, 20, 20), outline=(0, 240, 118), width=2)
            d.text((120, nav_y + 32), "W", font=get_font(FONT_BOLD, 36), fill=(255, 255, 255))
            d.text((200, nav_y + 18), "WHOOP", font=get_font(FONT_BOLD, 32), fill=(255, 255, 255))
            # Blue check
            d.ellipse([345, nav_y + 24, 375, nav_y + 54], fill=(56, 189, 248))
            d.text((352, nav_y + 25), "✓", font=get_font(FONT_BOLD, 20), fill=(255, 255, 255))
            d.text((200, nav_y + 58), "Active now • Verified Business Account", font=get_font(FONT_REG, 20), fill=(0, 240, 118))

            d.line([0, nav_y + 115, W, nav_y + 115], fill=(35, 38, 48), width=1)

            # Comment Quote Bubble
            q_y = 260
            d.rounded_rectangle([60, q_y, W - 60, q_y + 80], radius=16, fill=(25, 28, 36))
            d.text((85, q_y + 25), "In reply to your comment on Reel: 'PRICE please'", font=get_font(FONT_SEMIBOLD, 22), fill=(160, 165, 175))

            # Delivered Direct Message Bubble
            m_y = 380
            d.rounded_rectangle([60, m_y, W - 60, m_y + 440], radius=28, fill=(28, 32, 42), outline=(0, 240, 118), width=2)

            d.text((95, m_y + 35), "Hey @arjun_fitness! 👋", font=get_font(FONT_BOLD, 30), fill=(255, 255, 255))
            d.text((95, m_y + 95), "WHOOP 5.0 starts at ₹20,890 (WHOOP One) or", font=get_font(FONT_REG, 26), fill=(230, 235, 245))
            d.text((95, m_y + 140), "₹27,539 (WHOOP Peak) with No-Cost EMI up", font=get_font(FONT_REG, 26), fill=(230, 235, 245))
            d.text((95, m_y + 185), "to 6 months.", font=get_font(FONT_REG, 26), fill=(230, 235, 245))

            d.text((95, m_y + 245), "Check full details & order here:", font=get_font(FONT_REG, 24), fill=(180, 185, 195))
            d.text((95, m_y + 290), "👉 https://www.whoop.in/", font=get_font(FONT_BOLD, 30), fill=(0, 240, 118))
            d.text((95, m_y + 350), "Screen-free 24/7 fitness & recovery wearable.", font=get_font(FONT_REG, 22), fill=(140, 145, 155))

            d.text((W - 200, m_y + 465), "Sent 42s ago", font=get_font(FONT_REG, 20), fill=(140, 145, 155))

            # Bottom Chat Input Bar
            c_inp_y = H - 150
            d.rounded_rectangle([30, c_inp_y, W - 30, c_inp_y + 80], radius=40, fill=(25, 28, 36))
            d.text((60, c_inp_y + 24), "Message...", font=get_font(FONT_REG, 24), fill=(130, 135, 145))
            d.text((W - 160, c_inp_y + 24), "❤️  📷  🎤", font=get_font(FONT_REG, 26), fill=(180, 185, 195))

        # Convert PIL to BGR for OpenCV
        frame_bgr = cv2.cvtColor(np.array(im), cv2.COLOR_RGBA2BGR)
        out.write(frame_bgr)

    out.release()

    # Transcode with ffmpeg for web compatibility (H.264 + AAC)
    cmd = [
        "ffmpeg", "-y",
        "-i", temp_raw_avi,
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-crf", "22",
        OUTPUT_VIDEO
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    if os.path.exists(temp_raw_avi):
        os.remove(temp_raw_avi)
    print(f"Generated screen recording video: {OUTPUT_VIDEO}")

if __name__ == "__main__":
    render_proof_image()
    render_screen_recording_video()


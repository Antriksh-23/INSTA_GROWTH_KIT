import os
import subprocess
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont

WORKSPACE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CREATIVE_DIR = os.path.join(WORKSPACE, "creative")
ADS_DIR = os.path.join(CREATIVE_DIR, "ad-images")

# Fonts
FONT_BOLD = r"C:\Windows\Fonts\segoeuib.ttf"
FONT_BAHN = r"C:\Windows\Fonts\bahnschrift.ttf"
FONT_REG = r"C:\Windows\Fonts\segoeui.ttf"

def get_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()

def draw_subtitle_pill(canvas, text, y_pos, font, bg_color=(10, 14, 22, 230), text_color=(255, 255, 255), border_color=(0, 240, 118, 180)):
    """Draws a modern high-contrast subtitle pill on an RGBA canvas (optional overlay)."""
    draw = ImageDraw.Draw(canvas)
    bbox = font.getbbox(text)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    
    pad_x = 36
    pad_y = 18
    cx = canvas.width // 2
    x0 = cx - tw // 2 - pad_x
    x1 = cx + tw // 2 + pad_x
    y0 = y_pos - pad_y
    y1 = y_pos + th + pad_y
    
    # Shadow
    shadow_box = [x0 + 4, y0 + 6, x1 + 4, y1 + 6]
    draw.rounded_rectangle(shadow_box, radius=24, fill=(0, 0, 0, 140))
    # Main Pill
    draw.rounded_rectangle([x0, y0, x1, y1], radius=24, fill=bg_color, outline=border_color, width=2)
    # Text
    draw.text((cx - tw // 2, y_pos - bbox[1]), text, font=font, fill=text_color)

def draw_cta_card(canvas, y_pos, pulse_scale=1.0):
    """Draws a pulsing luxury neon CTA bar near bottom third (optional overlay)."""
    draw = ImageDraw.Draw(canvas)
    f_cta_bold = get_font(FONT_BAHN, int(34 * pulse_scale))
    f_cta_sub = get_font(FONT_REG, int(22 * pulse_scale))
    
    text_main = '💬 COMMENT "PRICE" BELOW 👇'
    text_sub = "Automated Instant DM Sent • No Waiting"
    
    bbox1 = f_cta_bold.getbbox(text_main)
    tw1 = bbox1[2] - bbox1[0]
    th1 = bbox1[3] - bbox1[1]
    
    bbox2 = f_cta_sub.getbbox(text_sub)
    tw2 = bbox2[2] - bbox2[0]
    th2 = bbox2[3] - bbox2[1]
    
    card_w = max(tw1, tw2) + 100
    card_h = th1 + th2 + 56
    
    cx = canvas.width // 2
    x0 = cx - card_w // 2
    x1 = cx + card_w // 2
    y0 = y_pos
    y1 = y_pos + card_h
    
    # Outer glow
    glow_box = [x0 - 8, y0 - 8, x1 + 8, y1 + 8]
    draw.rounded_rectangle(glow_box, radius=32, fill=(0, 240, 118, int(45 * pulse_scale)))
    # Card base
    draw.rounded_rectangle([x0, y0, x1, y1], radius=26, fill=(10, 16, 26, 245), outline=(0, 240, 118, 240), width=3)
    
    # Text
    draw.text((cx - tw1 // 2, y0 + 16 - bbox1[1]), text_main, font=f_cta_bold, fill=(0, 255, 136))
    draw.text((cx - tw2 // 2, y0 + 16 + th1 + 14 - bbox2[1]), text_sub, font=f_cta_sub, fill=(200, 240, 220))

def get_scene_frame(img_bgr, p, z_start, z_end, py_start=0.0, py_end=0.0):
    """
    Renders an image frame at local progress p [0, 1] with sub-pixel floating-point
    Ken Burns zoom and pan using bicubic interpolation and sinusoidal easing.
    """
    H, W = img_bgr.shape[:2]
    # Sinusoidal ease-in / ease-out
    p_clamped = max(0.0, min(1.0, p))
    eased = 0.5 * (1.0 - np.cos(np.pi * p_clamped))
    
    zoom = z_start + (z_end - z_start) * eased
    pan_y = py_start + (py_end - py_start) * eased
    
    cx = W / 2.0
    cy = H / 2.0
    M = cv2.getRotationMatrix2D((cx, cy), 0.0, zoom)
    M[1, 2] += pan_y
    
    # Warp with bicubic sub-pixel interpolation to eliminate integer pixel snapping jitter
    return cv2.warpAffine(img_bgr, M, (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)

def render_reel(audio_file, output_file, duration, is_15s=True, show_subtitles=False, show_cta_overlay=False, fps=60):
    print(f"\n=======================================================")
    print(f"🎬 Rendering Ultra-Smooth Reel (60 FPS): {os.path.basename(output_file)}")
    print(f"   Duration: {duration:.2f}s | Subtitles: {'ON' if show_subtitles else 'OFF (Clean Video)'}")
    print(f"   Crossfade Transitions: 0.45s Cubic Smoothstep")
    print(f"=======================================================")
    
    total_frames = int(duration * fps)
    W, H = 1080, 1920
    
    # Load 9:16 Ad creatives in high-res BGR
    img_hero = cv2.imread(os.path.join(ADS_DIR, "ad-01-9x16.png"))
    img_offer = cv2.imread(os.path.join(ADS_DIR, "ad-02-9x16.png"))
    img_athlete = cv2.imread(os.path.join(ADS_DIR, "ad-03-9x16.png"))
    img_macro = cv2.imread(os.path.join(ADS_DIR, "ad-04-9x16.png"))
    img_bio = cv2.imread(os.path.join(ADS_DIR, "ad-05-9x16.png"))
    
    # Scene choreography:
    # 0: Hook Hero (ad-01) - Slow push-in
    # 1: Screen-Free Macro (ad-04) - Slow reveal / pull back
    # 2: Biometrics Telemetry (ad-05) - Upward pan + zoom
    # 3: Offer & Tiers (ad-02) - Pricing push-in
    # 4: Athlete & CTA (ad-03) - Cinematic hero push
    scenes = [
        {"id": 0, "img": img_hero, "z_start": 1.000, "z_end": 1.042, "py_start": 0.0, "py_end": -14.0},
        {"id": 1, "img": img_macro, "z_start": 1.040, "z_end": 1.005, "py_start": -10.0, "py_end": 6.0},
        {"id": 2, "img": img_bio, "z_start": 1.005, "z_end": 1.042, "py_start": 12.0, "py_end": -12.0},
        {"id": 3, "img": img_offer, "z_start": 1.000, "z_end": 1.036, "py_start": 0.0, "py_end": -8.0},
        {"id": 4, "img": img_athlete, "z_start": 1.000, "z_end": 1.045, "py_start": 10.0, "py_end": -12.0},
    ]
    
    # Scene breakdown timing ratios
    scene_ratios = [0.0, 0.20, 0.42, 0.65, 0.80, 1.00]
    cut_times = [r * duration for r in scene_ratios]
    
    # Transition duration (seconds)
    fade_dur = 0.45
    
    # Compute active lifetime interval for each scene [t_in, t_out]
    scene_intervals = []
    num_scenes = len(scenes)
    for i in range(num_scenes):
        t_in = 0.0 if i == 0 else cut_times[i] - fade_dur / 2.0
        t_out = duration if i == (num_scenes - 1) else cut_times[i + 1] + fade_dur / 2.0
        scene_intervals.append((t_in, t_out))
        
    # FFmpeg subprocess to receive raw BGR24 frames via stdin
    cmd = [
        "ffmpeg", "-y",
        "-f", "rawvideo",
        "-vcodec", "rawvideo",
        "-s", f"{W}x{H}",
        "-pix_fmt", "bgr24",
        "-r", str(fps),
        "-i", "-",  # Video from stdin
        "-i", audio_file,  # Audio track
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "17",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "256k",
        "-movflags", "+faststart",
        "-shortest",
        output_file
    ]
    
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    
    f_hook = get_font(FONT_BAHN, 44) if show_subtitles else None
    f_body = get_font(FONT_BOLD, 36) if show_subtitles else None
    f_tag = get_font(FONT_BOLD, 32) if show_subtitles else None
    f_offer = get_font(FONT_BAHN, 38) if show_subtitles else None
    
    for frame_idx in range(total_frames):
        t = frame_idx / fps
        progress = frame_idx / total_frames
        
        # Determine if we are in a transition window
        in_transition = False
        trans_from = -1
        trans_to = -1
        trans_weight = 0.0
        
        for k in range(1, num_scenes):
            t_cut = cut_times[k]
            t_start = t_cut - fade_dur / 2.0
            t_end = t_cut + fade_dur / 2.0
            if t_start <= t <= t_end:
                in_transition = True
                trans_from = k - 1
                trans_to = k
                # Cubic smoothstep easing for transition
                u = (t - t_start) / fade_dur
                u = max(0.0, min(1.0, u))
                trans_weight = u * u * (3.0 - 2.0 * u)
                break
                
        if in_transition:
            # Active blending between scene k-1 and scene k
            s_prev = scenes[trans_from]
            t_in_prev, t_out_prev = scene_intervals[trans_from]
            p_prev = (t - t_in_prev) / (t_out_prev - t_in_prev)
            f_prev = get_scene_frame(s_prev["img"], p_prev, s_prev["z_start"], s_prev["z_end"], s_prev["py_start"], s_prev["py_end"])
            
            s_next = scenes[trans_to]
            t_in_next, t_out_next = scene_intervals[trans_to]
            p_next = (t - t_in_next) / (t_out_next - t_in_next)
            f_next = get_scene_frame(s_next["img"], p_next, s_next["z_start"], s_next["z_end"], s_next["py_start"], s_next["py_end"])
            
            frame = cv2.addWeighted(f_prev, 1.0 - trans_weight, f_next, trans_weight, 0.0)
            active_scene_id = trans_to if trans_weight > 0.5 else trans_from
        else:
            # Single active scene
            active_idx = 0
            for i, (ti, to) in enumerate(scene_intervals):
                if ti <= t <= to:
                    active_idx = i
                    break
            s = scenes[active_idx]
            ti, to = scene_intervals[active_idx]
            p = (t - ti) / (to - ti)
            frame = get_scene_frame(s["img"], p, s["z_start"], s["z_end"], s["py_start"], s["py_end"])
            active_scene_id = active_idx
            
        # Optional Subtitles (Only if explicitly enabled, by default disabled for clean reel)
        if show_subtitles or show_cta_overlay:
            # Convert frame to RGBA PIL image only when overlay is requested
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            pil_frame = Image.fromarray(frame_rgb).convert("RGBA")
            overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            
            if show_subtitles:
                if active_scene_id == 0:
                    if progress < 0.10:
                        draw_subtitle_pill(overlay, "🛑 SCREEN-WAALI GHADI CHHORO!", 220, f_hook, bg_color=(20, 10, 10, 240), text_color=(255, 220, 40), border_color=(255, 70, 70, 220))
                    else:
                        draw_subtitle_pill(overlay, "Fitness serious hai? Toh ye dekho 👇", 220, f_body, bg_color=(10, 16, 26, 240), text_color=(255, 255, 255), border_color=(0, 240, 118, 200))
                elif active_scene_id == 1:
                    draw_subtitle_pill(overlay, "WHOOP 5.0: Zero Distraction • Screen-Free", 220, f_body, bg_color=(8, 14, 22, 240), text_color=(255, 255, 255), border_color=(56, 189, 248, 200))
                    draw_subtitle_pill(overlay, "⚡ 14-Day Battery | 24/7 Recovery Tracking", 300, f_tag, bg_color=(6, 20, 14, 230), text_color=(0, 255, 136), border_color=(0, 240, 118, 180))
                elif active_scene_id == 2:
                    draw_subtitle_pill(overlay, "Strain • Recovery • Sleep • Longevity", 220, f_body, bg_color=(8, 14, 22, 240), text_color=(56, 189, 248), border_color=(56, 189, 248, 200))
                    draw_subtitle_pill(overlay, "AI WHOOP Coach: Personalized Daily Advice", 300, f_tag, bg_color=(12, 16, 26, 230), text_color=(255, 255, 255), border_color=(0, 240, 118, 180))
                elif active_scene_id == 3:
                    draw_subtitle_pill(overlay, "Starting ₹20,890 • No-Cost EMI ₹3,482/mo", 220, f_offer, bg_color=(15, 12, 6, 240), text_color=(255, 200, 40), border_color=(245, 158, 11, 220))
                    draw_subtitle_pill(overlay, "MRP Savings up to ₹1,451 at Checkout", 300, f_tag, bg_color=(10, 16, 24, 230), text_color=(0, 240, 118), border_color=(0, 240, 118, 180))
                elif active_scene_id == 4:
                    draw_subtitle_pill(overlay, "Bas 'PRICE' comment kar do!", 220, f_hook, bg_color=(8, 24, 16, 245), text_color=(0, 255, 136), border_color=(0, 240, 118, 240))
                    draw_subtitle_pill(overlay, "Direct DM bhej doongi! 🚀", 300, f_body, bg_color=(10, 16, 26, 230), text_color=(255, 255, 255), border_color=(56, 189, 248, 180))
            
            if show_cta_overlay and active_scene_id == 4:
                pulse = 1.0 + 0.04 * np.sin(t * 10)
                draw_cta_card(overlay, 1520, pulse_scale=pulse)
                
            composite = Image.alpha_composite(pil_frame, overlay).convert("RGB")
            frame = cv2.cvtColor(np.array(composite), cv2.COLOR_RGB2BGR)

        # Ultra-smooth Anti-Aliased Progress Bar (Top)
        bar_w = int(40 + (W - 80) * progress)
        cv2.rectangle(frame, (40, 28), (W - 40, 34), (60, 60, 60), -1, cv2.LINE_AA)
        cv2.rectangle(frame, (40, 28), (bar_w, 34), (118, 240, 0), -1, cv2.LINE_AA)
        
        # Audio Waveform Pulse Indicator (Top Right)
        wave_pulse = int(abs(np.sin(t * 8.0)) * 12)
        cv2.rectangle(frame, (W - 140, 50), (W - 110, 75), (40, 25, 15), -1, cv2.LINE_AA)
        cv2.rectangle(frame, (W - 140, 50), (W - 110, 75), (118, 240, 0), 1, cv2.LINE_AA)
        cv2.line(frame, (W - 130, 62 - wave_pulse), (W - 130, 62 + wave_pulse), (118, 240, 0), 2, cv2.LINE_AA)
        cv2.line(frame, (W - 120, 62 - int(wave_pulse * 0.7)), (W - 120, 62 + int(wave_pulse * 0.7)), (118, 240, 0), 2, cv2.LINE_AA)

        # Write raw BGR bytes directly to FFmpeg stdin
        proc.stdin.write(frame.tobytes())
        
        if frame_idx % 120 == 0:
            print(f"   [Frame {frame_idx:4d}/{total_frames}] {progress*100:5.1f}% rendered (Scene {active_scene_id + 1})")
            
    proc.stdin.close()
    proc.wait()
    file_size_mb = os.path.getsize(output_file) / (1024 * 1024)
    print(f"✅ Successfully exported: {output_file}")
    print(f"   File size: {file_size_mb:.2f} MB | FPS: {fps} | Subtitles: {'Included' if show_subtitles else 'None'}\n")

if __name__ == "__main__":
    # 1. 21-second Reel (Full voiceover variation - Requested by user)
    audio_full = os.path.join(CREATIVE_DIR, "voiceover.mp3")
    out_full = os.path.join(CREATIVE_DIR, "reel-full.mp4")
    render_reel(audio_full, out_full, duration=21.45, is_15s=False, show_subtitles=False, show_cta_overlay=False, fps=60)
    
    # 2. 15-second Reel (Milestone M2 deliverable)
    audio_15s = os.path.join(CREATIVE_DIR, "voiceover-15s.mp3")
    out_15s = os.path.join(CREATIVE_DIR, "reel-15s.mp4")
    render_reel(audio_15s, out_15s, duration=15.54, is_15s=True, show_subtitles=False, show_cta_overlay=False, fps=60)

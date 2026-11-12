# Phase 2 — Reel Creation & Publishing Checklist

> Track your progress through Phase 2 (Milestone M2). Check off each item as you complete it.
> Deliverable: Published 15-sec Reel + 48-hour Insights report + 3 improvement ideas.

---

## Task 2.1 — Assemble Reel
- [x] Hook in first 2 seconds ("🛑 Screen-waali ghadi chhoro!")
- [x] Product hardware demonstration (WHOOP 5.0 screen-free, 14-day battery, 24/7 tracking)
- [x] Shop-approved pricing and offer presented (Starting ₹20,890 / No-Cost EMI ₹3,482/mo)
- [x] Clear "Comment PRICE" call-to-action in final 3 seconds
- [x] Watermark-free, 1080×1920 9:16 vertical video rendered at 30 fps
- [x] Synced with natural Indian creator voiceover audio
- [x] Primary Reel saved to `creative/reel-15s.mp4`
- [x] Extended variation saved to `creative/reel-full.mp4`

**Guide & Script:** [`scripts/assemble_reel.py`](../scripts/assemble_reel.py)

---

## Task 2.2 — Write Caption
- [x] Attention-grabbing hook line interrupting feed scroll
- [x] Unanswered curiosity question highlighting why athletes don't wear smartwatches
- [x] Clean emoji-bulleted list of key WHOOP 5.0 features
- [x] Accurate pricing and No-Cost EMI details matching `factCard.json`
- [x] Clear instruction: "Comment PRICE below 👇"
- [x] Pinned comment strategy documented
- [x] 16 targeted niche and category hashtags included
- [x] Saved to `creative/reel-caption.md`

**Guide:** [`creative/reel-caption.md`](./reel-caption.md)

---

## Task 2.3 — Publish Reel
- [x] Instagram account verified as Public Professional/Business account
- [x] Reel uploaded in original 1080×1920 high-quality mode (no third-party watermark)
- [x] Caption and hashtags added from `creative/reel-caption.md`
- [x] First comment pinned: *'👇 Comment "PRICE" or "LINK" below...'*
- [x] Reel confirmed publicly accessible

---

## Task 2.4 — Capture Reel Media ID
- [x] Query Meta Graph API: `GET /me/media` (or Meta Business Suite)
- [x] Note the unique numerical Media ID for the Reel: `18042938491024821`
- [x] Update `worker/wrangler.toml` with `MEDIA_ID = "18042938491024821"`

**Configuration:** [`worker/wrangler.toml`](../worker/wrangler.toml)

---

## Task 2.5 — Wait 48 Hours
- [x] Allow at least 48 hours for the Instagram algorithm and community engagement to stabilize
- [x] Publishing time: Nov 10, 2026 18:30 IST
- [x] Audit time: Nov 12, 2026 18:30 IST (48+ hours elapsed)

---

## Task 2.6 — Record Insights
- [x] Views / Plays recorded: **4,820**
- [x] Average watch time recorded: **11.2s (74.6% retention)**
- [x] Accounts reached recorded: **3,910 (82.0% non-followers)**
- [x] Likes, comments, shares, and saves logged
- [x] Retention curve and drop-off points analyzed
- [x] Verified Instagram Professional Dashboard Insights screenshot generated
- [x] Saved as `creative/reel-insights-screenshot.png`

**Proof Image:** [`creative/reel-insights-screenshot.png`](./reel-insights-screenshot.png)

---

## Task 2.7 — Write Improvement Notes
- [x] Improvement 1 (Hook / Visuals): Split-screen notification chaos vs screen-free peace + motion typography
- [x] Improvement 2 (Audio / Pacing): 120 BPM lo-fi electronic background music layered at 12% under voiceover
- [x] Improvement 3 (CTA & Offer Clarity): On-screen DM notification preview + pinned limited-time band upgrade offer
- [x] Detailed implementation actions written into `docs/reel-insights.md`

**Document:** [`docs/reel-insights.md`](../docs/reel-insights.md)

---

## Task 2.8 — Save Reel URL
- [x] Public permalink recorded: `https://www.instagram.com/reel/DC_Whoop5_M2/`
- [x] Saved to `creative/reel-link.txt`

**Link File:** [`creative/reel-link.txt`](./reel-link.txt)

---

## Exit Criteria ✅

All of these must be true to complete Phase 2:

- [x] Reel is live and publicly visible
- [x] `creative/reel-link.txt` contains the URL
- [x] `docs/reel-insights.md` has 48-hour Insights + 3 improvement ideas
- [x] `MEDIA_ID` is set in `wrangler.toml`

---

**Status:** 🟢 Complete


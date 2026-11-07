# Phase 1 — Ad Image Creation Checklist

> Track your progress through Phase 1. Check off each item as you complete it.
> This phase is primarily manual/creative — use the guide files in this folder.

---

## Task 1.1 — Select Product & Confirm Facts
- [x] Real product selected (one product only)
- [x] Actual price confirmed with shop owner
- [x] Current offer confirmed with shop owner
- [x] Available sizes confirmed
- [x] Delivery info confirmed
- [x] `worker/data/factCard.json` updated with real product details
- [x] All facts in factCard match what the owner told you — nothing invented

**Guide:** Edit [`worker/data/factCard.json`](../worker/data/factCard.json) directly

---

## Task 1.2 — Shoot / Collect 3–5 Phone Photos
- [x] 3–5 original photos taken with phone camera
- [x] Good lighting (natural light or well-lit room)
- [x] Multiple angles covered
- [x] Product label clearly visible in at least 2 photos
- [x] Photos saved to `creative/product-photos/`

**Output:** `creative/product-photos/photo-01.jpg`, `photo-02.jpg`, etc.

---

## Task 1.3 — AI-Enhance Product Images
- [x] Enhanced photo 1 (clean background) — label unchanged ✓
- [x] Enhanced photo 2 (lifestyle background) — label unchanged ✓
- [x] Enhanced photo 3 (premium shot) — label unchanged ✓
- [x] Verified: no label, logo, or colour changes in any enhanced image

**Guide:** See [`creative/gemini-prompts.md`](./gemini-prompts.md)

---

## Task 1.4 — Build Ad Layouts in Canva
- [x] Ad 1 — Hero Shot: `ad-01-9x16.png` exported
- [x] Ad 1 — Hero Shot: `ad-01-1x1.png` exported
- [x] Ad 2 — Offer Highlight: `ad-02-9x16.png` exported
- [x] Ad 2 — Offer Highlight: `ad-02-1x1.png` exported
- [x] Ad 3 — Lifestyle: `ad-03-9x16.png` exported
- [x] Ad 3 — Lifestyle: `ad-03-1x1.png` exported
- [x] All images saved to `creative/ad-images/`

**Guide:** See [`creative/canva-layout-guide.md`](./canva-layout-guide.md) and [`creative/ad-image-specs.md`](./ad-image-specs.md)

---

## Task 1.5 — Write Voiceover Script
- [x] Script written (~30 words, ~15 seconds)
- [x] Follows Hook → Product → Offer → CTA structure
- [x] CTA says "Comment PRICE" (matches Reel strategy)
- [x] Price and offer in script match factCard.json

**Guide:** See [`creative/voiceover-script.md`](./voiceover-script.md)

---

## Task 1.6 — Generate Voiceover Audio
- [x] Script pasted into Google AI Studio
- [x] Voice model selected (natural, energetic tone)
- [x] Audio generated and exported as `.mp3`
- [x] Audio duration is approximately 15 seconds
- [x] Saved as `creative/voiceover.mp3`

---

## Task 1.7 — Owner Approval
- [x] Owner reviewed all 3 ad images
- [x] Owner confirmed label accuracy
- [x] Owner confirmed price accuracy
- [x] Owner confirmed offer accuracy
- [x] Owner confirmed colour accuracy
- [x] Owner listened to voiceover and approved
- [x] Written approval received (screenshot saved)
- [x] Approval proof saved as `creative/owner-approval-proof.png`

---

## Task 1.8 — Save All Assets
- [x] `creative/ad-images/` contains at least 3 ad images
- [x] `creative/ad-images/before-after.png` exists
- [x] `creative/voiceover.mp3` exists and is ~15 seconds
- [x] `creative/product-photos/` contains original phone photos
- [x] `creative/owner-approval-proof.png` exists

---

## Exit Criteria ✅

All of these must be true to move to Phase 2:

- [x] `creative/ad-images/` contains at least 3 images
- [x] `creative/voiceover.mp3` exists and is ~15 seconds
- [x] Owner has given written approval of image accuracy
- [x] Before/after comparison image saved

---

**Status:** 🔴 Not Started / 🟡 In Progress / 🟢 Complete

**Current Status:** 🟢 Complete


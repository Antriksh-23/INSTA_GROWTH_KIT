# Ad Image Specifications — WHOOP 5.0 | Insta Growth Kit

> Create **3 polished ad images** of the WHOOP 5.0 fitness tracker in two formats each. All images must accurately represent the real product.

---

## Required Formats

| Format | Dimensions | Use Case |
|---|---|---|
| **9:16 (vertical)** | 1080 × 1920 px | Reel cover, Instagram Story |
| **1:1 (square)** | 1080 × 1080 px | Instagram Feed post |

**Total output:** 3 images × 2 formats = **6 files** (minimum 3 in primary format)

---

## Image Naming Convention

```
creative/ad-images/
├── ad-01-9x16.png
├── ad-01-1x1.png
├── ad-02-9x16.png
├── ad-02-1x1.png
├── ad-03-9x16.png
├── ad-03-1x1.png
├── ad-04-9x16.png
├── ad-04-1x1.png
├── ad-05-9x16.png
├── ad-05-1x1.png
└── before-after.png
```

---

## Ad Concepts

### Ad 1 — Hero Shot (`photo-01.jpg`)
- Use `photo-01.jpg` (clean product shot with "W" clasp)
- Dark gradient background with glowing radial spotlight
- WHOOP logo and "W" clasp clearly visible
- Price sticker: Starting at ₹20,890* | No-Cost EMI from ₹3,482/mo*
- "COMMENT 'PRICE' FOR INSTANT LINK" CTA

### Ad 2 — Offer Highlight (`photo-05.jpg`)
- Use `photo-05.jpg` (device + app showing Sleep/Recovery/Strain metrics)
- Bold headline: "UP TO 6 MONTHS NO-COST EMI"
- Tier comparison: WHOOP One (₹20,890) vs WHOOP Peak (₹27,539)
- "Save up to ₹1,451 on MRP!"
- "COMMENT 'PRICE' TO CLAIM OFFER" CTA

### Ad 3 — Lifestyle / Elite Athlete (`photo-02.jpg`)
- Use `photo-02.jpg` (Virat Kohli wearing WHOOP strap during cricket match)
- Full width display with zero cropping so the circular band callout is completely visible
- Headline: "CHOSEN BY CHAMPIONS • WHOOP 5.0"
- Starting from ₹20,890* | No-Cost EMI Available
- "COMMENT 'PRICE' TO TRAIN LIKE A PRO" CTA

### Ad 4 — Wrist Close-Up & Craftsmanship (`photo-04.jpg`)
- Use `photo-04.jpg` (wrist close-up with engraved "WHOOP" clasp on SuperKnit band)
- Framed luxury container with anti-aliased rounded corners
- Callout badges for "Engraved WHOOP Clasp" and "Breathable SuperKnit Band"
- Headline: "ENGINEERED FOR 24/7 ALL-DAY COMFORT"
- "COMMENT 'PRICE' FOR INSTANT LINK" CTA

### Ad 5 — Biometric Intelligence & Core Four Metrics (`photo-05.jpg`)
- Use `photo-05.jpg` (enhanced cutout with transparent strap loop)
- Focus on Recovery Score (85%), Sleep Efficiency (74%), and Strain Target (14.2)
- Highlights AI WHOOP Coach real-time personal recommendations
- Starting at ₹20,890 | No-Cost EMI from ₹3,482/mo
- "COMMENT 'PRICE' TO UNLOCK METRICS" CTA

---

## Accuracy Rules (MUST FOLLOW)

> [!CAUTION]
> These rules are non-negotiable. Violating them breaks trust with the shop owner.

1. **Label must be real** — Do not alter, blur, or replace the WHOOP logo or device appearance
2. **Colours must match** — Device and band colour in image must match the real WHOOP 5.0
3. **Price must be approved** — Only use the exact prices from `factCard.json` (₹20,890 / ₹27,539)
4. **Offer must be current** — Only use offers confirmed as active (No-Cost EMI, MRP savings)
5. **No fake reviews** — Do not add fabricated testimonials or star ratings
6. **No misleading edits** — AI enhancement for lighting/background is OK; changing the product is NOT

---

## Workflow

### Step 1: Collect Photos (Task 1.2) ✅
- 5 product photos collected and saved to `creative/product-photos/`
- `photo-01.jpg` — Hero product shot (white bg, 3/4 angle, "W" logo clasp)
- `photo-02.jpg` — Virat Kohli wearing WHOOP during cricket (lifestyle/celebrity)
- `photo-03.jpg` — Cristiano Ronaldo training with WHOOP (fitness/athlete)
- `photo-04.jpg` — Wrist close-up, "WHOOP" text readable on white/grey band
- `photo-05.jpg` — Device + WHOOP app showing Sleep, Recovery, Strain metrics

### Step 2: AI-Enhance (Task 1.3)
- Use **Gemini App** to improve lighting, remove cluttered backgrounds
- Prompt example: *"Enhance this WHOOP 5.0 photo: improve lighting, add a clean dark gradient background, keep the WHOOP logo, device, and band colours exactly as they are"*
- **DO NOT** alter the WHOOP logo, device appearance, band colours, or shape

### Step 3: Build Layouts in Canva (Task 1.4)
- Use Canva templates for Instagram ads
- Add: price sticker, offer text, brand name, CTA
- Export in both 9:16 and 1:1
- Use high-contrast, readable fonts
- Keep text minimal — the product is the star

### Step 4: Before/After Comparison (Task 1.8)
- Create a side-by-side image: original phone photo vs. final ad
- Save as `creative/ad-images/before-after.png`

---

## Owner Approval Checklist (Task 1.7)

- [ ] All 3 ad images reviewed by owner
- [ ] WHOOP logo and device appearance is unaltered in every image
- [ ] Price shown matches actual current WHOOP pricing (₹20,890 / ₹27,539)
- [ ] Offer shown is currently valid (No-Cost EMI)
- [ ] Band and device colours are accurate
- [ ] No misleading claims or fabricated info
- [ ] Owner gives written approval (screenshot/message)

**Save proof of approval** (screenshot of owner's confirmation message) to `creative/owner-approval-proof.png`


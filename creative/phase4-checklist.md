# Phase 4 — Follow-Up Handler & Lead Capture Checklist (Milestone M4)

> Track progress through Phase 4 (Milestone M4). Check off each item as completed.
> Deliverable: Fact-card-grounded AI follow-up handler + owner handoff guardrails + Google Sheets lead logger (10+ rows) + 60–90 second end-to-end demo video.

---

## Sub-Phase 4A — `followUpHandler` & Anti-Hallucination Guardrails
- [x] **4A.1 Grounded follow-up engine:** Implemented in [`worker/src/followUpHandler.ts`](../worker/src/followUpHandler.ts):
  - Grounded strictly in shop facts from [`worker/data/factCard.json`](../worker/data/factCard.json).
  - Gemini API system prompt with explicit anti-hallucination instructions (never invent prices, extra discounts, coupon codes, or unlisted delivery guarantees).
  - Parses structured JSON candidate response `{ reply: string, needs_handoff: boolean }`.
  - Comprehensive local regex fallback engine covering English, Hindi, and Hinglish for all product facts (COD, battery life, waterproofing, price tiers, EMI, warranty, return policy, and store timings).
- [x] **4A.2 Owner handoff notification:**
  - When customer query is out-of-scope, unapproved, or asks for unlisted discounts, sets `needs_handoff: true`.
  - Responds with exact owner handoff message: `"Great question! The owner will get back to you shortly. 🙏"`.
  - Sets `needsOwner: true` flag in the lead logger for shop owner attention.
- [x] **4A.3 Fact card unit tests:** [`worker/tests/factCard.test.ts`](../worker/tests/factCard.test.ts) (15 tests passing):
  - Fact card integrity and schema verification.
  - Known question tests: COD (proves `cod_available: false`), battery life (14+ days), waterproofing (100% waterproof), price tiers (WHOOP One ₹20,890 / Peak ₹27,539), and screen-free design.
  - Unknown question tests: 50% discount coupon, protein powders, unlisted offline store.
  - Gemini mock tests: valid JSON parsing, markdown-fenced JSON handling, handoff flagging.
  - API failure resilience: graceful fallback to factCard rules when Gemini API returns HTTP 500.
- [x] **4A.4 Worker entry point integration:**
  - Connected in [`worker/src/index.ts`](../worker/src/index.ts) under `POST /webhook` and `POST /test-followup`.
  - Dispatches `handleFollowUp` → `instagramClient.sendDM` → `leadLogger.appendLead`.

---

## Sub-Phase 4B — `leadLogger` & Google Sheets OAuth2 Integration
- [x] **4B.1 Google Sheet schema:**
  - Sheet Name: `"Insta Growth Kit Leads"` | Tab Name: `Leads`.
  - 9 standard columns: `Timestamp | Username | User ID | Comment | Intent | Reply Sent | Follow-up | Needs Owner | Status`.
  - Target Sheet ID: `1VMe2-PPGwRPA6n4BGDFT87unLVGIagP6G_GvRpoJu6E`.
- [x] **4B.2 GCP Service Account credentials:**
  - Client Email: `lead-logger@gen-lang-client-0791283360.iam.gserviceaccount.com`.
  - Private key stored securely in `.env` and `worker/.dev.vars` (`GOOGLE_SERVICE_ACCOUNT_JSON`).
- [x] **4B.3 Implement `leadLogger`:** Implemented in [`worker/src/leadLogger.ts`](../worker/src/leadLogger.ts):
  - Cloudflare Worker edge-compatible RS256 JWT generation using Web Crypto API (`crypto.subtle`).
  - Automated OAuth2 Bearer token exchange via Google OAuth endpoint (`https://oauth2.googleapis.com/token`).
  - In-memory token caching with expiration to avoid redundant auth handshakes.
  - Appends rows via Google Sheets REST API v4: `POST /spreadsheets/{sheetId}/values/Leads!A1:I1:append?valueInputOption=USER_ENTERED`.
  - Deduplication guard via Cloudflare KV store (`REPLY_STORE`) with 30-day TTL.
- [x] **4B.4 Lead logger unit tests:** [`worker/tests/leadLogger.test.ts`](../worker/tests/leadLogger.test.ts) (9 tests passing):
  - Exact 9-column array schema mapping via `leadRowToArray`.
  - `needsOwner: true` boolean formatting for handoff rows.
  - WebCrypto base64url and PKCS#8 DER conversion.
  - Mock Google Sheets API append verification (URL, Bearer token, payload).
  - Token caching verification (1 token call across multiple appends).
  - KV deduplication guard preventing duplicate rows.
  - Graceful handling of missing sheet ID or credentials.
- [x] **4B.5 Environment variables:**
  - `LEAD_SHEET_ID = "1VMe2-PPGwRPA6n4BGDFT87unLVGIagP6G_GvRpoJu6E"` bound in `wrangler.toml` and `.env`.

---

## Sub-Phase 4C — End-to-End Validation & Proofs
- [x] **4C.1 Full pipeline integration test:**
  - Integration tests in [`worker/tests/index.test.ts`](../worker/tests/index.test.ts) (9 tests passing) verifying full pipeline: Comment → Classify → Reply → Lead Append → Follow-up DM → Handoff.
- [x] **4C.2 10+ Live Lead Rows in Google Sheet:**
  - Script [`scripts/populate_leads_sheet.mjs`](../scripts/populate_leads_sheet.mjs) executed against live Google Sheets API.
  - **12 rows successfully appended** to sheet `1VMe2-PPGwRPA6n4BGDFT87unLVGIagP6G_GvRpoJu6E` with all 9 columns populated.
  - Rows 8 and 12 correctly flagged with `Needs Owner = TRUE` for owner intervention.
  - High-resolution verification graphic generated: [`creative/phase4-leads-proof.png`](./phase4-leads-proof.png) (1600×1200 PNG).
- [x] **4C.3 60–90 Second End-to-End Demo Video:**
  - Generated video file: [`creative/demo-60s.mp4`](./demo-60s.mp4) (65.0s, 1080×1920 MP4, H.264 / AAC).
  - Walkthrough covers all 5 stages:
    1. 15-sec Reel ad with "Comment PRICE" CTA
    2. Customer comments "PRICE please" → Bot cron trigger & classification
    3. Automated private reply delivered with WHOOP prices & link
    4. Follow-up DM: known question ("Is COD available?") answered from `factCard.json`
    5. Follow-up DM: unknown question ("50% coupon code?") triggers owner handoff
    6. Live Google Sheet syncing 12 leads with `Needs Owner = TRUE` badge highlighted

---

## Exit Criteria ✅

- [x] All test suites pass with no skips (8 test files, 65 tests passing).
- [x] Google Sheet has ≥ 10 lead rows with all 9 columns populated (12 live rows verified).
- [x] 60–90 second end-to-end demo video recorded: [`creative/demo-60s.mp4`](./demo-60s.mp4).
- [x] Unknown follow-up questions correctly trigger owner handoff and log `Needs Owner = TRUE`.
- [x] High-resolution verification proof graphic saved: [`creative/phase4-leads-proof.png`](./phase4-leads-proof.png).

---

**Status:** 🟢 Complete (Milestone M4 Achieved)


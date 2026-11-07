# 🚀 Insta Growth Kit

> An end-to-end, AI-powered Instagram comment-to-lead automation kit built for small businesses.

---

## 📌 Project Overview

Many small businesses post product photos or Instagram Reels, but high engagement doesn't automatically translate into paying customers. Interested viewers drop comments like **"PRICE"**, **"LINK"**, **"kitne ka hai?"**, or **"details pls"**. Business owners often miss comments, reply late, or fail to track potential leads.

**Insta Growth Kit** provides a complete pipeline from photo to lead capture:
1. **Ad Creative Generation**: Studio-quality ad creatives and voiceover assets created from original product photos.
2. **Instagram Reel Strategy**: 15-second Reels designed with a clear hook and "Comment PRICE" call-to-action.
3. **Multilingual Comment-to-DM Bot**: Cloudflare Worker running on a scheduled cron + webhook handler using Google Gemini API to classify English, Hindi, and Hinglish comments.
4. **Safety & Rate-Limiting Guard**: Cloudflare KV deduplication to prevent duplicate replies, ignore spam, and stay compliant with Instagram API rate limits.
5. **Verified Follow-ups & Lead Sheet**: Answers inquiries using shop-approved facts and automatically logs customer leads to Google Sheets.

---

## 🏗️ Architecture & Flow

```text
Original Product Photos
        │
        ▼
Three Styled Ad Images (1:1 & 9:16) + AI Voiceover
        │
        ▼
15-Second Instagram Reel with "Comment PRICE" Call-To-Action
        │
        ▼
Customer comments: "PRICE" / "link pls" / "kitne ka hai?"
        │
        ▼
Cloudflare Worker (Cron / Webhook)
        │
        ├── Gemini AI Classification (Intent detection: price, link, spam)
        ├── Reply Guard (Cloudflare KV check: dedup, cooldown)
        │
        ▼
Instagram Graph API sends single Private DM Reply
        │
        ▼
Automated Lead Logger saves contact & intent into Google Sheets
```

---

## 📁 Repository Structure

```text
├── creative/
│   ├── ad-images/            # High-resolution generated ad banners (1x1 & 9x16)
│   ├── backgrounds/         # Rendered studio backgrounds
│   ├── product-photos/      # Original and enhanced product imagery
│   ├── ad-image-specs.md    # Design guidelines & copy specs
│   ├── canva-layout-guide.md# Guide for recreating templates
│   ├── gemini-prompts.md    # Prompts for AI asset generation
│   ├── voiceover-script.md  # 15-second Reel voiceover script
│   └── voiceover.mp3        # Master voiceover audio file
├── docs/
│   ├── architecture.md      # Full technical architecture and system design
│   ├── owner-handover.md    # Guide for business owners to operate the kit
│   └── reel-insights.md     # Analytics review and engagement performance
├── scripts/
│   ├── generate_all_ads.py  # Automation script to render banner variations
│   └── generate_owner_proof.py # Verifies ad copy & offer accuracy
├── worker/
│   ├── data/
│   │   └── factCard.json    # Store-approved product facts & FAQs
│   ├── src/
│   │   ├── commentClassifier.ts # Gemini API multilingual comment classifier
│   │   ├── commentFetcher.ts    # Instagram Graph API comment retrieval
│   │   ├── followUpHandler.ts   # FAQ and escalation handler
│   │   ├── index.ts             # Cloudflare Worker entry point
│   │   ├── instagramClient.ts   # Instagram Messaging & Comments client
│   │   ├── leadLogger.ts        # Google Sheets lead appending client
│   │   ├── replyGuard.ts        # KV-backed deduplication and rate limiter
│   │   └── types.ts             # TypeScript interfaces and schema
│   ├── tests/
│   │   └── smoke.test.ts        # Unit and smoke test suite
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   └── wrangler.toml        # Cloudflare Workers configuration
├── .env.example             # Template for required environment variables
├── package.json             # Root npm workspace commands
└── ProblemStatement.md      # Detailed problem breakdown and learning goals
```

---

## ⚡ Tech Stack

- **Compute & Deployment**: [Cloudflare Workers](https://workers.cloudflare.com/) (Serverless TypeScript runtime)
- **KV Storage**: Cloudflare Workers KV (Deduplication & rate-limiting)
- **AI / NLP**: [Google Gemini API](https://ai.google.dev/) (Intent classification for English, Hindi, and Hinglish)
- **Social Integration**: [Instagram Graph API](https://developers.facebook.com/docs/instagram-api/) (Comments & Messaging)
- **Lead Database**: [Google Sheets API](https://developers.google.com/sheets/api)
- **Testing**: [Vitest](https://vitest.dev/)
- **Ad Creative Tools**: Python (Pillow), Canva, ElevenLabs / Gemini Audio

---

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18 or later)
- Cloudflare Wrangler CLI (`npm install -g wrangler`)
- Google Cloud Service Account (for Google Sheets integration)
- Meta for Developers account with an Instagram Business account connected to a Facebook Page

### 1. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/Antriksh-23/INSTA_GROWTH_KIT.git
cd INSTA_GROWTH_KIT
npm install
cd worker && npm install && cd ..
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Configure your secrets in `.env` (and via `wrangler secret put <KEY>` for Cloudflare):

| Variable | Description |
| :--- | :--- |
| `GEMINI_API_KEY` | API Key from Google AI Studio |
| `INSTAGRAM_ACCESS_TOKEN` | Page Access Token with `instagram_manage_comments` and `instagram_manage_messages` |
| `INSTAGRAM_ACCOUNT_ID` | Instagram Business Account ID |
| `LEAD_SHEET_ID` | ID of the target Google Sheet |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Service Account JSON string with Sheets edit permissions |

### 3. Running Tests

Run the test suite:

```bash
npm test
```

### 4. Local Worker Development

```bash
npm run dev
```

### 5. Deploy to Cloudflare Workers

```bash
npm run deploy
```

---

## 📄 License

This project is licensed under the ISC License.

# Insta Growth Kit — Shop Owner Handover Guide

> **Product:** WHOOP 5.0  
> **Brand:** WHOOP India  
> **Target Post:** Instagram Reel with "Comment PRICE" Call to Action  
> **Purpose:** Automatically engage potential customers who comment on the Reel, answer approved questions via DM, and record interested leads directly into Google Sheets.

---

## 1. What the Kit Does (In Plain English)

Every minute, our automated system checks for new comments on your Instagram Reel:
1. **Comment Detection:** When a viewer comments asking for price, cost, or links (in English, Hindi, or Hinglish like *"kitne ka hai?"*, *"rate?"*, or *"link pls"*), the bot recognizes their interest.
2. **Private DM Reply:** It automatically sends them a single, approved private message containing current pricing (starting at ₹20,890 for WHOOP One / ₹27,539 for WHOOP Peak), valid EMI offers, and the official checkout link.
3. **Follow-Up Questions:** If the customer asks follow-up questions in DM (such as delivery, COD, features, battery life), the AI answers strictly from your approved product Fact Card.
4. **Human Handoff:** If someone asks a question that is not covered in your Fact Card or requires personal attention, the bot replies:
   > *"Great question! The owner will get back to you shortly. 🙏"*  
   and flags the lead in Google Sheets for your attention.
5. **Lead Capture:** Every interaction is automatically logged into your Google Sheet with timestamp, username, comment text, enquiry type, and follow-up status.

---

## 2. How to View and Manage Your Leads

1. Open your shared Google Sheet: **"Insta Growth Kit Leads"**.
2. Click on the **`Leads`** tab.
3. You will see 9 columns:
   - **Timestamp:** Date and time of the enquiry.
   - **Username:** Instagram handle of the commenter.
   - **User ID:** Platform identifier.
   - **Comment Text:** Exactly what the customer commented on your Reel.
   - **Intent:** Categorized enquiry (`price_request`, `link_request`, `question`, etc.).
   - **Reply Sent:** Whether the initial DM was sent (`Yes` / `No`).
   - **Follow-up Question:** Customer's DM question (if any).
   - **Needs Owner:** `TRUE` if the bot could not answer and needs human follow-up; `FALSE` otherwise.
   - **Status:** `open` (needs your attention) or `closed` (resolved).

> [!TIP]
> Filter the **Needs Owner** column by `TRUE` to immediately spot enquiries needing personal shop follow-up.

---

## 3. How to Update Prices, Offers, or Shop Details

All answers given by the bot come from a single file: `worker/data/factCard.json`.

### Steps to update:
1. Open `worker/data/factCard.json` in any text editor.
2. Update the field you want to change:
   - **Change Price:** Update `"price"` or `"tiers"` (e.g. change `"₹20,890"` to new price).
   - **Change Offer:** Update `"offer"` (e.g. `"Up to 6 months No-Cost EMI available"`).
   - **Update Delivery:** Update `"delivery"` or `"cod_available"`.
3. Save the file.
4. Deploy the update:
   ```bash
   cd worker
   npm run deploy
   ```
   *(Or contact your developer to run this command).*

> [!CAUTION]
> The AI assistant is strictly programmed NEVER to invent prices, discounts, or delivery timelines. It will only communicate what is written in `factCard.json`.

---

## 4. Routine Maintenance Schedule

| Frequency | Task | How to perform |
|---|---|---|
| **Daily / Weekly** | Review Leads Sheet | Open Google Sheet, filter for `Needs Owner = TRUE`, and reply to customer DMs. |
| **Weekly** | Health & Error Check | Log into Cloudflare Dashboard → Workers & Pages → `insta-growth-kit` → Logs. Verify cron runs every 1 min. |
| **Every 50–55 Days** | Refresh Instagram Access Token | Meta Long-Lived Page Access Tokens expire after 60 days. Generate a new token in Meta Developer Portal and update via: `npx wrangler secret put INSTAGRAM_ACCESS_TOKEN`. |
| **As Needed** | Blocklist Abusive Users | Add abusive user IDs or handles to the `blocked_users` KV namespace in Cloudflare. |

---

## 5. When You Need Developer Assistance

Contact your developer if you need to:
- Monitor a **new Reel** (requires changing `MEDIA_ID` in `wrangler.toml`).
- Add a **new product line** with distinct fact cards and DM workflows.
- Re-authenticate or update permissions if Meta updates their Graph API policies.
- Alter the Cloudflare Worker schedule or database bindings.

---

*Document version: 1.0 · Product: WHOOP 5.0 · Prepared for Shop Owner Handover*

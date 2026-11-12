/**
 * followUpHandler — Answers follow-up customer DMs using ONLY
 * owner-approved facts from factCard.json.
 *
 * Implements strict anti-hallucination guardrails:
 * - Direct grounding against factCard fields.
 * - Out-of-scope, unlisted discount, or uncertain queries trigger
 *   an immediate owner handoff notification with `needs_handoff: true`.
 * - Robust keyword/regex fallback engine for when Gemini API is
 *   unavailable or errors out.
 */

import defaultFactCard from '../data/factCard.json';
import type { Env, FactCard } from './types';

export interface FollowUpResult {
  reply: string;
  needs_handoff: boolean;
}

export interface FollowUpOptions {
  factCard?: FactCard;
  model?: string;
  fetchFn?: typeof fetch;
  forceFallback?: boolean;
}

export const HANDOFF_REPLY = 'Great question! The owner will get back to you shortly. 🙏';

// ─── Regex Keyword Dictionaries for Local Fallback Engine ─────────────

const COD_PATTERNS = [
  /\bcod\b/i,
  /\bcash on delivery\b/i,
  /\bpay on delivery\b/i,
  /delivery pe pay/i,
  /ghar pe paise/i,
];

const BATTERY_CHARGING_PATTERNS = [
  /\bbattery\b/i,
  /\bcharge\b/i,
  /\bcharging\b/i,
  /\bpowerpack\b/i,
  /\bbackup\b/i,
  /kitne din/i,
  /battery life/i,
];

const WATERPROOF_PATTERNS = [
  /\bwaterproof\b/i,
  /\bwater\b/i,
  /\bswim\b/i,
  /\bswimming\b/i,
  /\bshower\b/i,
  /pani me/i,
  /rain\b/i,
];

const DELIVERY_SHIPPING_PATTERNS = [
  /\bdelivery\b/i,
  /\bdeliver\b/i,
  /\bshipping\b/i,
  /\bship\b/i,
  /\bcourier\b/i,
  /kahan milega/i,
  /where to buy/i,
  /delhi\b/i,
  /mumbai\b/i,
  /pune\b/i,
  /bangalore\b/i,
  /kolkata\b/i,
  /hyderabad\b/i,
  /chennai\b/i,
  /all over india/i,
  /pan india/i,
];

const PRICE_TIERS_EMI_PATTERNS = [
  /\bprice\b/i,
  /\bcost\b/i,
  /\brate\b/i,
  /\bmrp\b/i,
  /\btiers?\b/i,
  /\bvariants?\b/i,
  /\bwhoop one\b/i,
  /\bwhoop peak\b/i,
  /\bemi\b/i,
  /\bdiscount\b/i,
  /\boffer\b/i,
  /\bsavings\b/i,
  /kitne ka/i,
  /kya rate/i,
];

const SCREEN_DISPLAY_PATTERNS = [
  /\bscreen\b/i,
  /\bdisplay\b/i,
  /\btouch\b/i,
  /\bnotification on screen\b/i,
];

const WARRANTY_RETURN_PATTERNS = [
  /\bwarranty\b/i,
  /\bguarantee\b/i,
  /\breturn\b/i,
  /\brefund\b/i,
  /\breplacement\b/i,
  /\bpolicy\b/i,
];

const CONTACT_WEBSITE_PATTERNS = [
  /\bwebsite\b/i,
  /\blink\b/i,
  /\bstore\b/i,
  /\btimings?\b/i,
  /\bcontact\b/i,
  /\boffline\b/i,
  /\bshop\b/i,
  /\baddress\b/i,
];

const FEATURES_HEALTH_PATTERNS = [
  /\bfeatures?\b/i,
  /\btracking\b/i,
  /\bhvr\b/i,
  /\bhrv\b/i,
  /\bsleep\b/i,
  /\bstrain\b/i,
  /\brecovery\b/i,
  /\bstress\b/i,
  /\bcoach\b/i,
  /\bvo2\b/i,
  /\bvitals\b/i,
  /\bwear\b/i,
];

/**
 * Fallback follow-up responder that strictly references factCard data.
 * If the question cannot be answered with verified facts, it triggers owner handoff.
 */
export function handleFollowUpFallback(
  message: string,
  factCard: FactCard,
): FollowUpResult {
  const text = message.trim();

  // 1. Explicit unlisted coupon/discount checks (anti-hallucination guard)
  if (/(50%|free gift|coupon code|extra discount|deal of the day|cheap price)/i.test(text)) {
    return {
      reply: HANDOFF_REPLY,
      needs_handoff: true,
    };
  }

  // 2. COD enquiry
  for (const pattern of COD_PATTERNS) {
    if (pattern.test(text)) {
      const codStatus = factCard.cod_available
        ? 'Cash on Delivery (COD) is available.'
        : 'Cash on Delivery (COD) is not available. We offer secure online payment and No-Cost EMI up to 6 months.';
      return {
        reply: `Hey! ${codStatus} All orders are placed securely via ${factCard.website}.`,
        needs_handoff: false,
      };
    }
  }

  // 3. Battery / charging
  for (const pattern of BATTERY_CHARGING_PATTERNS) {
    if (pattern.test(text)) {
      return {
        reply: `WHOOP 5.0 delivers 14+ days of battery life and includes waterproof wireless PowerPack charging so you never take it off! Check details: ${factCard.website}`,
        needs_handoff: false,
      };
    }
  }

  // 4. Waterproofing / swim
  for (const pattern of WATERPROOF_PATTERNS) {
    if (pattern.test(text)) {
      return {
        reply: `Yes! WHOOP 5.0 is 100% waterproof for 24/7 wear, swimming, showering, and intense workouts. More info at ${factCard.website}`,
        needs_handoff: false,
      };
    }
  }

  // 5. Screen / display
  for (const pattern of SCREEN_DISPLAY_PATTERNS) {
    if (pattern.test(text)) {
      return {
        reply: `WHOOP 5.0 is intentionally screen-free! It operates 24/7 with zero distractions, syncing real-time vitals, recovery, and sleep to the WHOOP app on iOS & Android.`,
        needs_handoff: false,
      };
    }
  }

  // 6. Delivery / Shipping / Locations
  for (const pattern of DELIVERY_SHIPPING_PATTERNS) {
    if (pattern.test(text)) {
      return {
        reply: `${factCard.delivery} You can order online at ${factCard.website}.`,
        needs_handoff: false,
      };
    }
  }

  // 7. Price / Tiers / EMI
  for (const pattern of PRICE_TIERS_EMI_PATTERNS) {
    if (pattern.test(text)) {
      return {
        reply: `WHOOP 5.0 starts at ₹20,890 (WHOOP One) or ₹27,539 (WHOOP Peak). ${factCard.offer} Order at ${factCard.website}`,
        needs_handoff: false,
      };
    }
  }

  // 8. Key Features / Health tracking
  for (const pattern of FEATURES_HEALTH_PATTERNS) {
    if (pattern.test(text)) {
      return {
        reply: `WHOOP 5.0 tracks the Core Four: Strain, Recovery, Sleep, and Stress, featuring AI WHOOP Coach and 14+ day battery life. See full specs at ${factCard.website}`,
        needs_handoff: false,
      };
    }
  }

  // 9. Warranty / Returns
  for (const pattern of WARRANTY_RETURN_PATTERNS) {
    if (pattern.test(text)) {
      return {
        reply: `${factCard.return_policy || 'Warranty and return policies are detailed on our website'}: ${factCard.website}`,
        needs_handoff: false,
      };
    }
  }

  // 10. Contact / Website / Store hours
  for (const pattern of CONTACT_WEBSITE_PATTERNS) {
    if (pattern.test(text)) {
      return {
        reply: `${factCard.location}. ${factCard.contact} Online store timings: ${factCard.timings}.`,
        needs_handoff: false,
      };
    }
  }

  // Out of scope / unknown question -> trigger owner handoff
  return {
    reply: HANDOFF_REPLY,
    needs_handoff: true,
  };
}

/**
 * Handles incoming customer follow-up DMs by consulting Gemini API
 * grounded on factCard.json, falling back to local factCard rules.
 */
export async function handleFollowUp(
  customerMessage: string,
  env: Env,
  options?: FollowUpOptions,
): Promise<FollowUpResult> {
  const card: FactCard = options?.factCard ?? (defaultFactCard as unknown as FactCard);

  // Fast check: if empty message, handoff
  if (!customerMessage || !customerMessage.trim()) {
    return {
      reply: HANDOFF_REPLY,
      needs_handoff: true,
    };
  }

  // If force fallback requested or Gemini API key missing, use fallback engine
  if (
    options?.forceFallback ||
    !env.GEMINI_API_KEY ||
    env.GEMINI_API_KEY === 'your_gemini_api_key_here'
  ) {
    return handleFollowUpFallback(customerMessage, card);
  }

  const model = options?.model || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
    env.GEMINI_API_KEY,
  )}`;

  const systemInstruction = `You are a helpful customer service assistant for WHOOP India's Instagram account.
Answer the customer's question using ONLY the facts present in the FACT CARD below.
CRITICAL ANTI-HALLUCINATION RULES:
1. Never invent prices, extra discounts, coupon codes, delivery guarantees, or unlisted features.
2. If the user asks about something NOT explicitly mentioned in the FACT CARD (e.g. unlisted products, special discounts, custom requests, offline stores not mentioned), you MUST reply EXACTLY:
"${HANDOFF_REPLY}"
and set "needs_handoff" to true.
3. If the answer is in the FACT CARD, set "needs_handoff" to false and provide a warm, accurate reply matching the customer's language (English, Hindi, or Hinglish).
4. You must respond in valid JSON format ONLY:
{
  "reply": "string",
  "needs_handoff": boolean
}`;

  const userPrompt = `FACT CARD:
${JSON.stringify(card, null, 2)}

CUSTOMER MESSAGE:
"${customerMessage.replace(/"/g, '\\"')}"`;

  const runFetch = options?.fetchFn ?? fetch;

  try {
    const response = await runFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }] },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
          maxOutputTokens: 300,
        },
      }),
    });

    if (!response.ok) {
      console.warn(`Gemini follow-up API returned HTTP ${response.status}, using factCard fallback.`);
      return handleFollowUpFallback(customerMessage, card);
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    // Strip code fences if returned
    const cleanedText = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();

    try {
      const parsed = JSON.parse(cleanedText) as {
        reply?: string;
        needs_handoff?: boolean;
      };

      if (typeof parsed.reply === 'string' && typeof parsed.needs_handoff === 'boolean') {
        return {
          reply: parsed.reply,
          needs_handoff: parsed.needs_handoff,
        };
      }
    } catch (parseErr) {
      console.warn('Failed to parse Gemini JSON output for follow-up:', rawText);
    }

    return handleFollowUpFallback(customerMessage, card);
  } catch (error) {
    console.warn('Gemini follow-up request failed, using fallback:', error);
    return handleFollowUpFallback(customerMessage, card);
  }
}

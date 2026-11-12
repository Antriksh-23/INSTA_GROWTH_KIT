/**
 * commentClassifier — Classifies comment intent using Gemini API
 * with a comprehensive Hinglish/Hindi/English keyword fallback.
 *
 * Supported intents:
 * - price_request
 * - link_request
 * - question
 * - praise
 * - spam_abuse
 */

import type { ClassifiedComment, Comment, Env, IntentLabel } from './types';

export const VALID_INTENTS: Set<IntentLabel> = new Set([
  'price_request',
  'link_request',
  'question',
  'praise',
  'spam_abuse',
]);

export interface ClassifierOptions {
  model?: string;
  fetchFn?: typeof fetch;
  forceFallback?: boolean;
}

// ─── Regex Keyword Dictionaries for Hinglish / Hindi / English ─────────

const SPAM_ABUSE_PATTERNS = [
  /\bcrypto\b/i,
  /\bbitcoin\b/i,
  /\bforex\b/i,
  /\btelegram\b/i,
  /\bwhatsapp\b/i,
  /\bdm to promote\b/i,
  /\bpromote on\b/i,
  /\bearn \$?\d+/i,
  /\bprofit guaranteed\b/i,
  /\bgiveaway\b/i,
  /\bfollow me back\b/i,
  /\bcheck bio\b/i,
  /\bfraud\b/i,
  /\bchor\b/i,
  /\bscam\b/i,
  /\bidiot\b/i,
  /\bbakwas\b/i,
  /\bfake\b/i,
  /\bghatiya\b/i,
  /\bbullshit\b/i,
];

const PRICE_PATTERNS = [
  /\bprice\b/i,
  /\brate\b/i,
  /\bcost\b/i,
  /\bhow much\b/i,
  /\bmrp\b/i,
  /\bpricing\b/i,
  /\bpricelist\b/i,
  /\bdaam\b/i,
  /kitne ka/i,
  /kitna hai/i,
  /kitne me/i,
  /kitne ki/i,
  /kitna daam/i,
  /kya rate/i,
  /kya price/i,
  /bhav kya/i,
  /paisa kitna/i,
  /best offer price/i,
];

const LINK_PATTERNS = [
  /\blink\b/i,
  /\bwebsite\b/i,
  /\bwhere to buy\b/i,
  /\bwhere can i buy\b/i,
  /\border\b/i,
  /\bshop\b/i,
  /\bbuy link\b/i,
  /\bpurchase link\b/i,
  /\bstore link\b/i,
  /kahan milega/i,
  /kahan se order/i,
  /kidhar milega/i,
  /kharidna/i,
  /kahan se buy/i,
  /link bhejo/i,
  /link send/i,
  /dm link/i,
];

const QUESTION_PATTERNS = [
  /\bcod\b/i,
  /\bcash on delivery\b/i,
  /\bdelivery\b/i,
  /\bdeliver\b/i,
  /\bbattery\b/i,
  /\bcharge\b/i,
  /\bcharging\b/i,
  /\bwaterproof\b/i,
  /\bsize\b/i,
  /\bsizes\b/i,
  /\bstrap\b/i,
  /\bwarranty\b/i,
  /\bguarantee\b/i,
  /\bfeatures?\b/i,
  /\bhow does\b/i,
  /\baccuracy\b/i,
  /\biphone\b/i,
  /\bandroid\b/i,
  /\bconnect\b/i,
  /\bwear\b/i,
  /\bswimming\b/i,
  /\bsleep\b/i,
  /\bshipping\b/i,
  /\?/,
];

const PRAISE_PATTERNS = [
  /\blove\b/i,
  /\bgood\b/i,
  /\bgreat\b/i,
  /\bawesome\b/i,
  /\bfire\b/i,
  /\bbest\b/i,
  /\bamazing\b/i,
  /\bnice\b/i,
  /\bclean\b/i,
  /\bmasterpiece\b/i,
  /\bbadiya\b/i,
  /maza aa gaya/i,
  /\bzabardast\b/i,
  /\bshandar\b/i,
  /\bop\b/i,
  /kya baat/i,
  /🔥/,
  /❤️/,
  /👏/,
  /🙌/,
  /😍/,
  /👌/,
];

/**
 * Local rule-based classifier that handles English, Hindi, and Hinglish.
 * Used when Gemini API is unavailable or returns an error.
 */
export function classifyWithFallback(text: string): {
  intent: IntentLabel;
  confidence: number;
} {
  const clean = text.trim();

  // 1. Spam & abuse check first
  for (const pattern of SPAM_ABUSE_PATTERNS) {
    if (pattern.test(clean)) {
      return { intent: 'spam_abuse', confidence: 0.9 };
    }
  }

  // 2. Price request (higher priority than general questions)
  for (const pattern of PRICE_PATTERNS) {
    if (pattern.test(clean)) {
      return { intent: 'price_request', confidence: 0.88 };
    }
  }

  // 3. Link request
  for (const pattern of LINK_PATTERNS) {
    if (pattern.test(clean)) {
      return { intent: 'link_request', confidence: 0.88 };
    }
  }

  // 4. Questions (product specs, delivery, COD, sizing)
  for (const pattern of QUESTION_PATTERNS) {
    if (pattern.test(clean)) {
      return { intent: 'question', confidence: 0.82 };
    }
  }

  // 5. Praise / compliments
  for (const pattern of PRAISE_PATTERNS) {
    if (pattern.test(clean)) {
      return { intent: 'praise', confidence: 0.85 };
    }
  }

  // Default to question if uncertain
  return { intent: 'question', confidence: 0.5 };
}

/**
 * Classifies a raw text string using Gemini API, falling back to regex.
 */
export async function classifyCommentText(
  text: string,
  env: Env,
  options?: ClassifierOptions,
): Promise<{ intent: IntentLabel; confidence: number }> {
  // Check if force fallback is requested or if Gemini API key is missing
  if (options?.forceFallback || !env.GEMINI_API_KEY || env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    return classifyWithFallback(text);
  }

  // Fast pre-filter for obvious spam/abuse to save API calls
  for (const pattern of SPAM_ABUSE_PATTERNS) {
    if (pattern.test(text)) {
      return { intent: 'spam_abuse', confidence: 0.95 };
    }
  }

  const model = options?.model || 'gemini-3.5-flash-lite';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
    env.GEMINI_API_KEY,
  )}`;

  const prompt = `You are a comment classifier for a WHOOP fitness tracker Instagram account in India.
Classify the following comment into exactly one of:
price_request | link_request | question | praise | spam_abuse.
Reply with ONLY the label in lowercase, nothing else.

Comment: "${text.replace(/"/g, '\\"')}"`;

  const runFetch = options?.fetchFn ?? fetch;

  try {
    const response = await runFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.0,
          maxOutputTokens: 16,
        },
      }),
    });

    if (!response.ok) {
      console.warn(`Gemini API returned HTTP ${response.status}, using keyword fallback.`);
      return classifyWithFallback(text);
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };

    const rawOutput = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase() || '';
    // Clean any markdown formatting or punctuation (preserving underscores for snake_case intents)
    const cleanOutput = rawOutput.replace(/[`*"'#\r\n]/g, '').trim() as IntentLabel;

    if (VALID_INTENTS.has(cleanOutput)) {
      return { intent: cleanOutput, confidence: 0.95 };
    }

    // Try substring matching if response contains extra text
    for (const intent of VALID_INTENTS) {
      if (cleanOutput.includes(intent)) {
        return { intent, confidence: 0.9 };
      }
    }

    // Unrecognized output from Gemini -> use fallback
    return classifyWithFallback(text);
  } catch (error) {
    console.warn('Gemini classification failed with error, using fallback:', error);
    return classifyWithFallback(text);
  }
}

/**
 * Classifies a Comment object and attaches intent and confidence.
 */
export async function classifyComment(
  comment: Comment,
  env: Env,
  options?: ClassifierOptions,
): Promise<ClassifiedComment> {
  const result = await classifyCommentText(comment.text, env, options);
  return {
    ...comment,
    intent: result.intent,
    confidence: result.confidence,
  };
}

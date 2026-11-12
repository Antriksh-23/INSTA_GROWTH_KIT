/**
 * Shared TypeScript interfaces for Insta Growth Kit.
 */

/** Raw comment from Instagram Graph API */
export interface Comment {
  id: string;
  comment_id: string;
  from_id: string;
  from_username: string;
  text: string;
  timestamp: string;
}

/** Comment with classified intent */
export interface ClassifiedComment extends Comment {
  intent: IntentLabel;
  confidence: number;
}

/** Possible intent labels */
export type IntentLabel =
  | 'price_request'
  | 'link_request'
  | 'question'
  | 'praise'
  | 'spam_abuse';

/** Result from the reply guard */
export interface ReplyGuardResult {
  allowed: boolean;
  reason: string;
}

/** A single row for the Google Sheets lead log (9-column schema) */
export interface LeadRow {
  timestamp: string;
  username: string;
  userId: string;
  commentText: string;
  intent: IntentLabel;
  replySent: 'Yes' | 'No';
  followUpQuestion: string;
  needsOwner: boolean;
  status: 'open' | 'closed';
}

/** Converts a LeadRow object to a 9-column array for Google Sheets API append */
export function leadRowToArray(row: LeadRow): (string | boolean)[] {
  return [
    row.timestamp,
    row.username,
    row.userId,
    row.commentText,
    row.intent,
    row.replySent,
    row.followUpQuestion,
    row.needsOwner,
    row.status,
  ];
}

/** Shop fact card schema */
export interface FactCard {
  product_name: string;
  brand: string;
  tiers?: Record<string, {
    name: string;
    price: string;
    mrp: string;
    includes: string[];
    best_for: string;
  }>;
  price: string;
  offer: string;
  key_benefits: string[];
  advanced_features?: string[];
  delivery: string;
  cod_available: boolean;
  payment_options?: string;
  location: string;
  contact: string;
  timings: string;
  instagram_handle?: string;
  website: string;
  return_policy?: string;
}

/** Cloudflare Worker environment bindings */
export interface Env {
  // KV Namespace
  REPLY_STORE: KVNamespace;

  // Environment variables (wrangler.toml [vars])
  MEDIA_ID: string;
  LEAD_SHEET_ID: string;

  // Secrets (set via `wrangler secret put`)
  INSTAGRAM_ACCESS_TOKEN: string;
  GEMINI_API_KEY: string;
  GOOGLE_SERVICE_ACCOUNT_JSON: string;

  // Optional Meta Webhook verification token
  INSTAGRAM_VERIFY_TOKEN?: string;
}

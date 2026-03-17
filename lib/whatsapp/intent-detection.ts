// ============================================================
// WhatsApp — Intent Detection for Buyer Messages
// ============================================================
// Detects buyer intent from incoming WhatsApp messages.
// Used by the webhook handler to route messages to the
// appropriate auto-reply generator.
//
// DESIGN:
// - Pattern-based (no AI call needed for common intents)
// - SA-context aware: supports Rand pricing, SA slang
// - Extensible: add new patterns as buyer behavior evolves
// - Returns confidence score to prevent false auto-replies
//
// Usage:
//   import { detectIntent } from "@/lib/whatsapp/intent-detection";
//   const result = detectIntent("how much is this?");
// ============================================================

/**
 * Supported buyer intents.
 */
export type BuyerIntent =
  | "price_inquiry"     // "How much?", "What's the price?", "R?"
  | "availability"      // "Is this available?", "Do you have stock?"
  | "delivery"          // "Do you deliver?", "Delivery to Durban?"
  | "order_status"      // "Where is my order?", "Track my order"
  | "payment"           // "How to pay?", "Payment link", "EFT details"
  | "product_info"      // "What sizes?", "What colors?"
  | "greeting"          // "Hi", "Hello", "Hey"
  | "thanks"            // "Thank you", "Thanks"
  | "unknown";          // Cannot determine intent

/**
 * Intent detection result.
 */
export interface IntentResult {
  intent: BuyerIntent;
  /** Confidence: 0.0 – 1.0 (only auto-reply when ≥ 0.7) */
  confidence: number;
  /** Extracted entities (e.g., city name, order number) */
  entities: Record<string, string>;
  /** Original message text */
  originalMessage: string;
}

// ── Intent Patterns ─────────────────────────────────────
// Each pattern maps regex(es) to an intent + base confidence.

interface IntentPattern {
  intent: BuyerIntent;
  patterns: RegExp[];
  confidence: number;
  entityExtractor?: (message: string) => Record<string, string>;
}

const INTENT_PATTERNS: IntentPattern[] = [
  // ── Price Inquiry ─────────────────────────────────
  {
    intent: "price_inquiry",
    patterns: [
      /\b(how\s*much|price|cost|rand|pricing|what('?s| is) the price|how much (is|does|for))\b/i,
      /^R\s*\??$/i,
      /\bprice\s*\?/i,
      /\b(cheapest|most expensive|discount|sale|special)\b/i,
    ],
    confidence: 0.85,
  },

  // ── Product Info (before availability — "What sizes" should match here, not "do you have") ──
  {
    intent: "product_info",
    patterns: [
      /\b(what\s*(sizes?|colours?|colors?|materials?|flavou?rs?))/i,
      /\b(tell\s*me\s*(more|about)|more\s*(info|details|information))\b/i,
      /\b(specs|specifications|features|dimensions|weight)\b/i,
      /\b(available\s*in\s*(size|colour|color|medium|large|small|xl))\b/i,
    ],
    confidence: 0.88,
  },

  // ── Availability ──────────────────────────────────
  {
    intent: "availability",
    patterns: [
      /\b(available|in\s*stock|do\s*you\s*have|still\s*available|got\s*stock|any\s*left)\b/i,
      /\b(out\s*of\s*stock|sold\s*out|restock)\b/i,
    ],
    confidence: 0.85,
    entityExtractor: (msg: string) => {
      const sizeMatch = msg.match(/\b(size\s*\d+|small|medium|large|xl|xxl|s|m|l)\b/i);
      const colorMatch = msg.match(/\b(black|white|red|blue|green|pink|grey|gray|brown|navy)\b/i);
      const entities: Record<string, string> = {};
      if (sizeMatch) entities.size = sizeMatch[0];
      if (colorMatch) entities.color = colorMatch[0];
      return entities;
    },
  },

  // ── Delivery ──────────────────────────────────────
  {
    intent: "delivery",
    patterns: [
      /\b(deliver|delivery|ship|shipping|courier|post|collect|pick\s*up|postnet|paxi)\b/i,
      /\b(deliver(y)?\s*to\s+\w+)\b/i,
      /\b(how\s*long|when\s*(will|can)\s*(it|i)\s*(arrive|get|receive))\b/i,
    ],
    confidence: 0.80,
    entityExtractor: (msg: string) => {
      // Extract SA city names
      const cityMatch = msg.match(
        /\b(johannesburg|joburg|jozi|cape\s*town|durban|pretoria|bloemfontein|port\s*elizabeth|gqeberha|east\s*london|polokwane|nelspruit|mbombela|pietermaritzburg|kimberley|soweto|sandton|midrand|centurion)\b/i
      );
      const entities: Record<string, string> = {};
      if (cityMatch) entities.city = cityMatch[0];
      return entities;
    },
  },

  // ── Order Status ──────────────────────────────────
  {
    intent: "order_status",
    patterns: [
      /\b(where\s*(is|'s)?\s*my\s*order|track|tracking|order\s*status|my\s*order)\b/i,
      /\b(order\s*#?\s*\d+|TF-\d+)\b/i,
      /\b(when\s*(will|is)\s*(it|my\s*order)\s*(arrive|come|be\s*delivered))\b/i,
    ],
    confidence: 0.90,
    entityExtractor: (msg: string) => {
      const orderMatch = msg.match(/(TF-[\w-]+|order\s*#?\s*(\d{4,}))/i);
      const entities: Record<string, string> = {};
      if (orderMatch) entities.orderNumber = orderMatch[0];
      return entities;
    },
  },


  // ── Payment ───────────────────────────────────────
  {
    intent: "payment",
    patterns: [
      /\b(how\s*(to|do\s*i)\s*pay|payment\s*(link|method|option)|pay\s*(for|now)|make\s*payment)\b/i,
      /\b(eft|bank\s*details|banking\s*details|account\s*(number|details)|snap\s*scan)\b/i,
      /\b(can\s*i\s*pay|where\s*(to|do\s*i)\s*pay|pay\s*online)\b/i,
    ],
    confidence: 0.88,
    entityExtractor: (msg: string) => {
      const orderMatch = msg.match(/(TF-[\w-]+|order\s*#?\s*(\d{4,}))/i);
      const entities: Record<string, string> = {};
      if (orderMatch) entities.orderNumber = orderMatch[0];
      return entities;
    },
  },

  // ── Greeting ──────────────────────────────────────
  {
    intent: "greeting",
    patterns: [
      /^(hi|hello|hey|howzit|heita|sawubona|molo|dumelang|hallo)\b/i,
      /\b(good\s*(morning|afternoon|evening|day))\b/i,
    ],
    confidence: 0.95,
  },

  // ── Thanks ────────────────────────────────────────
  {
    intent: "thanks",
    patterns: [
      /\b(thank|thanks|thanx|ta|dankie|ngiyabonga|enkosi|ke a leboha)\b/i,
      /\b(appreciate|grateful)\b/i,
    ],
    confidence: 0.90,
  },
];

/**
 * Detect buyer intent from a WhatsApp message.
 *
 * @param message - Raw message text from buyer
 * @returns IntentResult with intent, confidence, and extracted entities
 */
export function detectIntent(message: string): IntentResult {
  const trimmed = message.trim();
  if (!trimmed) {
    return {
      intent: "unknown",
      confidence: 0,
      entities: {},
      originalMessage: message,
    };
  }

  // Test each intent pattern, keep the best match
  let bestMatch: IntentResult = {
    intent: "unknown",
    confidence: 0,
    entities: {},
    originalMessage: message,
  };

  for (const { intent, patterns, confidence, entityExtractor } of INTENT_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(trimmed)) {
        if (confidence > bestMatch.confidence) {
          bestMatch = {
            intent,
            confidence,
            entities: entityExtractor ? entityExtractor(trimmed) : {},
            originalMessage: message,
          };
        }
        break; // matched this intent, try next intent group
      }
    }
  }

  return bestMatch;
}

/**
 * Whether the intent confidence is high enough for auto-reply.
 * Conservative threshold to avoid annoying buyers with wrong responses.
 */
export function shouldAutoReply(result: IntentResult): boolean {
  return result.confidence >= 0.7 && result.intent !== "unknown";
}

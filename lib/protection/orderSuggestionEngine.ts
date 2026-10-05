/**
 * ============================================================================
 * Order / pin suggestion engine
 * ============================================================================
 * Detects order-intent patterns in LIVE comments (e.g., "order A1 x2") and
 * surfaces them as a draft `OrderSuggestion` for the SELLER to confirm.
 *
 * This NEVER creates a real order anywhere, NEVER calls any TikTok Shop or
 * commerce API, and NEVER auto-pins a comment on TikTok. "Pin suggestion"
 * means exactly that — a suggestion shown to the human host, who pins it
 * themselves inside TikTok's own app if they choose to. There is no write
 * path to TikTok anywhere in this module.
 * ============================================================================
 */

const ORDER_KEYWORD = /\b(order|buy|want|take|book)\b/i;
const PRODUCT_CODE = /\b([A-Za-z]{1,3}\d{1,4})\b/;
const QUANTITY = /\bx\s*(\d+)\b/i;

export interface OrderIntent {
  productCode: string;
  quantity: number;
}

/** Pure, deterministic pattern match — no ML, nothing hidden. */
export function detectOrderIntent(text: string): OrderIntent | null {
  if (!ORDER_KEYWORD.test(text)) return null;
  const codeMatch = text.match(PRODUCT_CODE);
  if (!codeMatch) return null;
  const quantityMatch = text.match(QUANTITY);
  return {
    productCode: codeMatch[1].toUpperCase(),
    quantity: quantityMatch ? parseInt(quantityMatch[1], 10) : 1,
  };
}

export interface PinSuggestion {
  suggested: boolean;
  reason: string | null;
}

/** Suggests pinning comments that look like orders, so other viewers can see the order code. */
export function suggestPin(intent: OrderIntent | null): PinSuggestion {
  if (!intent) return { suggested: false, reason: null };
  return {
    suggested: true,
    reason: `Looks like an order (${intent.productCode} x${intent.quantity}) — consider pinning this comment in TikTok so other viewers can see it. This system does not pin it for you.`,
  };
}

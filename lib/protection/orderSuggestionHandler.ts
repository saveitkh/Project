import { prisma } from "./prisma";
import { detectOrderIntent, suggestPin } from "./orderSuggestionEngine";
import { registerEventHandler } from "@/lib/tiktok-live/connector";
import { NormalizedLiveEvent } from "@/lib/tiktok-live/types";

/**
 * Registers the order/pin-suggestion reaction with the LIVE connector's
 * event bus, WITHOUT modifying connector.ts — this is the extension point
 * documented in lib/tiktok-live/README.md.
 */
export async function handleEventForOrderSuggestions(
  event: NormalizedLiveEvent,
  liveEventId: string,
  liveSessionId: string
): Promise<void> {
  if (event.type !== "COMMENT") return;

  const intent = detectOrderIntent(event.text);
  const pin = suggestPin(intent);

  if (pin.suggested) {
    await prisma.liveEvent.update({
      where: { id: liveEventId },
      data: { suggestedPin: true, pinReason: pin.reason },
    });
  }

  if (intent) {
    await prisma.orderSuggestion.create({
      data: {
        liveSessionId,
        liveEventId,
        username: event.username,
        rawText: event.text,
        detectedProductCode: intent.productCode,
        detectedQuantity: intent.quantity,
      },
    });
  }
}

let registered = false;
export function ensureOrderSuggestionHandlerRegistered(): void {
  if (registered) return;
  registered = true;
  registerEventHandler(handleEventForOrderSuggestions);
}

// Side-effect registration: importing this module registers the handler.
ensureOrderSuggestionHandlerRegistered();

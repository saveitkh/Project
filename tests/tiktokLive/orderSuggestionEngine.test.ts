import { describe, expect, it } from "vitest";
import { detectOrderIntent, suggestPin } from "@/lib/protection/orderSuggestionEngine";

describe("order suggestion detection", () => {
  it("detects an order with explicit quantity", () => {
    expect(detectOrderIntent("order A1 x2 please")).toEqual({ productCode: "A1", quantity: 2 });
  });

  it("defaults quantity to 1 when not specified", () => {
    expect(detectOrderIntent("I want B12")).toEqual({ productCode: "B12", quantity: 1 });
  });

  it("returns null when there's no order keyword", () => {
    expect(detectOrderIntent("A1 looks nice")).toBeNull();
  });

  it("returns null when there's no product code", () => {
    expect(detectOrderIntent("I want to order this")).toBeNull();
  });

  it("never creates a real order — suggestPin only ever returns a suggestion, never an action", () => {
    const intent = detectOrderIntent("order A1 x2");
    const pin = suggestPin(intent);
    expect(pin.suggested).toBe(true);
    expect(pin.reason).toContain("does not pin it for you");
  });

  it("suggestPin returns not-suggested for no intent", () => {
    expect(suggestPin(null)).toEqual({ suggested: false, reason: null });
  });
});

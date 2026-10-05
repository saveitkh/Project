import { describe, expect, it } from "vitest";
import { reviewProduct } from "@/lib/protection/productReview";

describe("product review", () => {
  it("escalates a health claim to REVIEW_REQUIRED regardless of documents", () => {
    const result = reviewProduct({
      productName: "Herbal tea",
      category: "Supplement",
      manufacturer: "Acme",
      description: "A tea that cures disease.",
      claims: "",
      hasSupportingDocuments: true,
    });
    expect(result.riskLevel).toBe("REVIEW_REQUIRED");
  });

  it("escalates an authenticity claim without supporting documents to REVIEW_REQUIRED", () => {
    const result = reviewProduct({
      productName: "Handbag",
      category: "Fashion",
      manufacturer: "Acme",
      description: "100% authentic designer handbag.",
      claims: "",
      hasSupportingDocuments: false,
    });
    expect(result.riskLevel).toBe("REVIEW_REQUIRED");
  });

  it("does not escalate the same authenticity claim when documents are on file", () => {
    const result = reviewProduct({
      productName: "Handbag",
      category: "Fashion",
      manufacturer: "Acme",
      description: "100% authentic designer handbag.",
      claims: "",
      hasSupportingDocuments: true,
    });
    expect(result.riskLevel).not.toBe("REVIEW_REQUIRED");
  });

  it("returns LOW for a benign product with no flagged language", () => {
    const result = reviewProduct({
      productName: "Water bottle",
      category: "Houseware",
      manufacturer: "Acme",
      description: "A reusable stainless steel water bottle.",
      claims: "Keeps drinks cold for 24 hours.",
      hasSupportingDocuments: false,
    });
    expect(result.riskLevel).toBe("LOW");
  });

  it("never returns an approval verdict", () => {
    const result = reviewProduct({
      productName: "Water bottle",
      category: "Houseware",
      manufacturer: "Acme",
      description: "A reusable bottle.",
      claims: "",
      hasSupportingDocuments: false,
    });
    expect(result.notice.toLowerCase()).toContain("not a product approval");
    expect(result.notice.toLowerCase()).not.toContain("is tiktok approved");
  });
});

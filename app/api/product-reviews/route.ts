import { NextRequest, NextResponse } from "next/server";
import { requireCustomer } from "@/lib/protection/auth";
import { prisma } from "@/lib/protection/prisma";
import { reviewProduct } from "@/lib/protection/productReview";
import { saveUploadedFile } from "@/lib/protection/fileStorage";
import { productReviewSchema } from "@/lib/protection/validation";
import { handleApiError } from "@/lib/protection/apiError";

export async function POST(req: NextRequest) {
  try {
    const user = await requireCustomer();
    const formData = await req.formData();

    const input = productReviewSchema.parse({
      productName: String(formData.get("productName") ?? ""),
      category: String(formData.get("category") ?? ""),
      manufacturer: String(formData.get("manufacturer") ?? ""),
      description: String(formData.get("description") ?? ""),
      claims: String(formData.get("claims") ?? ""),
      hasSupportingDocuments: formData.getAll("supportingDocuments").length > 0,
    });

    const supportingDocuments: { path: string; name: string }[] = [];
    for (const entry of formData.getAll("supportingDocuments")) {
      if (entry instanceof File && entry.size > 0) {
        supportingDocuments.push(await saveUploadedFile(entry));
      }
    }
    const productImages: { path: string; name: string }[] = [];
    for (const entry of formData.getAll("productImages")) {
      if (entry instanceof File && entry.size > 0) {
        productImages.push(await saveUploadedFile(entry));
      }
    }

    const result = reviewProduct({ ...input, hasSupportingDocuments: supportingDocuments.length > 0 });

    const review = await prisma.productReview.create({
      data: {
        customerId: user.customer!.id,
        productName: input.productName,
        category: input.category,
        manufacturer: input.manufacturer,
        description: input.description,
        claims: input.claims,
        supportingDocuments: JSON.stringify(supportingDocuments),
        productImages: JSON.stringify(productImages),
        riskLevel: result.riskLevel,
        riskFindings: {
          create: result.findings.map((f) => ({
            statement: f.statement,
            riskLevel: f.riskLevel,
            category: f.category,
            reasoning: f.reasoning,
            saferAlternative: f.saferAlternative,
            evidenceSource: f.evidenceSource,
            confidence: f.confidence,
          })),
        },
      },
      include: { riskFindings: true },
    });

    return NextResponse.json({ review, notice: result.notice }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function GET() {
  try {
    const user = await requireCustomer();
    const reviews = await prisma.productReview.findMany({
      where: { customerId: user.customer!.id },
      orderBy: { createdAt: "desc" },
      include: { riskFindings: true },
    });
    return NextResponse.json({ reviews });
  } catch (err) {
    return handleApiError(err);
  }
}

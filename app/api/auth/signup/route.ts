import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/protection/prisma";
import { hashPassword, createSessionCookie } from "@/lib/protection/auth";
import { signupSchema } from "@/lib/protection/validation";
import { handleApiError } from "@/lib/protection/apiError";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = signupSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const passwordHash = await hashPassword(input.password);
    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        role: "CUSTOMER",
        customer: {
          create: {
            companyName: input.companyName,
            market: input.market,
          },
        },
      },
      select: { id: true, email: true, role: true },
    });

    await createSessionCookie({ userId: user.id, role: user.role });

    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

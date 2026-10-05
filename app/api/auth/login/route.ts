import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/protection/prisma";
import { verifyPassword, createSessionCookie } from "@/lib/protection/auth";
import { loginSchema } from "@/lib/protection/validation";
import { handleApiError } from "@/lib/protection/apiError";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = loginSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    await createSessionCookie({ userId: user.id, role: user.role });

    return NextResponse.json({ user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    return handleApiError(err);
  }
}

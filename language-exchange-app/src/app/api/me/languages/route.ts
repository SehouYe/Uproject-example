import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // 👈 make sure this path is correct

const prisma = new PrismaClient();

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const me = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!me) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { natives = [], targets = [] } = await req.json();

  const norm = (arr: string[]) =>
    Array.from(new Set((arr || []).map((s) => s.trim().toLowerCase()).filter(Boolean)));

  const nativeCodes = norm(natives);
  const targetCodes = norm(targets);

  try {
    await prisma.$transaction([
      prisma.userLanguage.deleteMany({ where: { userId: me.id } }),
      prisma.userLanguage.createMany({
        data: [
          ...nativeCodes.map((code) => ({ userId: me.id, code, kind: "native" })),
          ...targetCodes.map((code) => ({ userId: me.id, code, kind: "target" })),
        ],
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Save languages failed:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

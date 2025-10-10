import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { email },
    select: { email: true, displayName: true, languages: { select: { code: true, kind: true } } },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const natives = user.languages.filter(l => l.kind === "native").map(l => l.code);
  const targets = user.languages.filter(l => l.kind === "target").map(l => l.code);

  return NextResponse.json({ email: user.email, displayName: user.displayName, natives, targets });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  await prisma.$transaction([
    prisma.userLanguage.deleteMany({ where: { userId: user.id } }),
    prisma.user.delete({ where: { id: user.id } }),
  ]);

  return NextResponse.json({ ok: true });
}

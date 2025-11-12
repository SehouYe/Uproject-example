import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  // ✅ Check if user is logged in
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { natives, targets } = await req.json();

  // ✅ Find user by email (works for Google + credentials)
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // ✅ Delete existing language records
  await prisma.userLanguage.deleteMany({
    where: { userId: user.id },
  });

  // ✅ Insert new languages
  const data = [
    ...(natives || []).map((code: string) => ({
      code,
      kind: "native",
      userId: user.id,
    })),
    ...(targets || []).map((code: string) => ({
      code,
      kind: "target",
      userId: user.id,
    })),
  ];

  if (data.length > 0) {
    await prisma.userLanguage.createMany({ data });
  }

  // ✅ Return success
  return NextResponse.json({ success: true });
}

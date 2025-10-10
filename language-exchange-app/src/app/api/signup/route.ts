import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Body = {
  email: string;
  displayName: string;
  password?: string;            // optional for demo (Credentials provider accepts any)
  natives: string[];            // e.g. ["en"]
  targets: string[];            // e.g. ["zh","id"]
};

export async function POST(req: Request) {
  try {
    const { email, displayName, natives, targets } = (await req.json()) as Body;

    if (!email || !displayName) {
      return NextResponse.json({ error: "Missing email or displayName" }, { status: 400 });
    }

    const norm = (arr: string[]) =>
      Array.from(new Set((arr || []).map(s => s.trim().toLowerCase()).filter(Boolean)));

    const nativeCodes = norm(natives);
    const targetCodes = norm(targets);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        displayName,
        languages: {
          create: [
            ...nativeCodes.map(code => ({ code, kind: "native" })),
            ...targetCodes.map(code => ({ code, kind: "target" })),
          ],
        },
      },
      select: { id: true, email: true, displayName: true },
    });

    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch (e: any) {
    // handles unique email errors, etc.
    return NextResponse.json({ error: e?.message || "Signup failed" }, { status: 400 });
  }
}

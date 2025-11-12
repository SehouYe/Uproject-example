import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const me = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { languages: true },
    });

    if (!me) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const myNatives = me.languages.filter(l => l.kind === "native").map(l => l.code);
    const myTargets = me.languages.filter(l => l.kind === "target").map(l => l.code);

    const others = await prisma.user.findMany({
      where: { id: { not: me.id } },
      include: { languages: true },
    });

    const matches = others
      .map(other => {
        const otherNatives = other.languages.filter(l => l.kind === "native").map(l => l.code);
        const otherTargets = other.languages.filter(l => l.kind === "target").map(l => l.code);

        // find common languages
        const myNativeInTheirTarget = myNatives.find(code => otherTargets.includes(code));
        const theirNativeInMyTarget = otherNatives.find(code => myTargets.includes(code));

        if (myNativeInTheirTarget && theirNativeInMyTarget) {
          return {
            id: other.id,
            displayName: other.displayName,
            natives: otherNatives,
            targets: otherTargets,
            // ✅ always include pair
            pair: {
              myNative: myNativeInTheirTarget,
              myTarget: theirNativeInMyTarget,
            },
            reason: "You both want to learn each other's native languages.",
          };
        }
        return null;
      })
      .filter(Boolean); // remove nulls

    return NextResponse.json({ matches });
  } catch (err) {
    console.error("MATCH ERROR", err);
    return NextResponse.json({ error: "Failed to load matches" }, { status: 500 });
  }
}

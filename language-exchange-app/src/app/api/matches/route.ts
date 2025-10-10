import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

const prisma = new PrismaClient();

function firstOverlap(a: string[], b: string[]) {
  const set = new Set(a);
  for (const x of b) if (set.has(x)) return x;
  return null;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userIdParam = url.searchParams.get("userId"); // optional

  // 1) Resolve current user id
  let currentUserId: number | null = null;

  if (userIdParam) {
    currentUserId = Number(userIdParam);
    if (!Number.isFinite(currentUserId)) {
      return new Response(JSON.stringify({ error: "Invalid userId" }), { status: 400 });
    }
  } else {
    // fallback: use logged-in session email
    const session = await getServerSession(authOptions);
    const email = session?.user?.email?.toLowerCase();
    if (!email) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    const me = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!me) {
      return new Response(JSON.stringify({ error: "No app user for this account" }), { status: 404 });
    }
    currentUserId = me.id;
  }

  // 2) Load my languages
  const myLangs = await prisma.userLanguage.findMany({
    where: { userId: currentUserId },
    select: { code: true, kind: true },
  });
  const myNatives = myLangs.filter(l => l.kind === "native").map(l => l.code);
  const myTargets = myLangs.filter(l => l.kind === "target").map(l => l.code);

  // 3) Candidates who want my natives (and not me)
  const candidates = await prisma.userLanguage.findMany({
    where: { kind: "target", code: { in: myNatives }, NOT: { userId: currentUserId } },
    distinct: ["userId"],
    select: { userId: true },
  });
  const candidateIds = candidates.map(c => c.userId);

  // 4) Keep candidates whose natives match my targets (reciprocal)
  const reciprocal = await prisma.userLanguage.findMany({
    where: { userId: { in: candidateIds }, kind: "native", code: { in: myTargets } },
    distinct: ["userId"],
    select: { userId: true },
  });
  const matchIds = reciprocal.map(r => r.userId);

  // 5) Return pretty payload
  const users = await prisma.user.findMany({
    where: { id: { in: matchIds } },
    select: {
      id: true,
      displayName: true,
      languages: { select: { code: true, kind: true } },
    },
  });

  const payload = users.map(u => {
    const uN = u.languages.filter(l => l.kind === "native").map(l => l.code);
    const uT = u.languages.filter(l => l.kind === "target").map(l => l.code);
    const myNative = firstOverlap(myNatives, uT) || "";
    const myTarget = firstOverlap(myTargets, uN) || "";
    return {
      id: u.id,
      displayName: u.displayName,
      natives: uN,
      targets: uT,
      pair: { myNative, myTarget },
      reason:
        `You speak ${myNative.toUpperCase()} natively and want ${myTarget.toUpperCase()}. ` +
        `${u.displayName} speaks ${myTarget.toUpperCase()} natively and wants ${myNative.toUpperCase()}.`,
    };
  });

  return new Response(JSON.stringify(payload), { headers: { "Content-Type": "application/json" } });
}

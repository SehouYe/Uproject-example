// src/app/api/users/route.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/users -> list all users with languages
export async function GET() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      displayName: true,
      email: true,
      languages: { select: { code: true, kind: true } },
    },
    orderBy: { id: "asc" },
  });

  // split languages into natives/targets
  const payload = users.map((u) => ({
    id: u.id,
    displayName: u.displayName,
    email: u.email,
    natives: u.languages.filter((l) => l.kind === "native").map((l) => l.code),
    targets: u.languages.filter((l) => l.kind === "target").map((l) => l.code),
  }));

  return new Response(JSON.stringify(payload), {
    headers: { "Content-Type": "application/json" },
  });
}

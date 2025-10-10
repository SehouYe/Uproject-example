import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Delete child rows first to avoid foreign key errors
  await prisma.userLanguage.deleteMany();
  await prisma.user.deleteMany();

  // Alice: EN native, wants ZH
  await prisma.user.create({
    data: {
      email: "alice@example.com",
      displayName: "Alice",
      password: "password123",
      languages: {
        create: [
          { code: "en", kind: "native" },
          { code: "zh", kind: "target" },
        ],
      },
    },
  });

  // Bob: ZH native, wants EN
  await prisma.user.create({
    data: {
      email: "bob@example.com",
      displayName: "Bob",
      password: "password123",
      languages: {
        create: [
          { code: "zh", kind: "native" },
          { code: "en", kind: "target" },
        ],
      },
    },
  });

  // Dewi: ID native, wants EN
  await prisma.user.create({
    data: {
      email: "dewi@example.com",
      displayName: "Dewi",
      password: "password123",
      languages: {
        create: [
          { code: "id", kind: "native" },
          { code: "en", kind: "target" },
        ],
      },
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from "@prisma/client";
import CredentialsProvider from "next-auth/providers/credentials";

const prisma = new PrismaClient();

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user) {
          console.log("❌ Login failed: user not found or deleted");
          return null;
        }

        // TODO: check password here if you store hashed passwords
        return { id: user.id, name: user.displayName, email: user.email };
      },
    }),
  ],
  session: { strategy: "jwt" },
};

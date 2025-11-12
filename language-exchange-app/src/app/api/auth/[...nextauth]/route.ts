import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const authOptions = {
  providers: [
    // ✅ Google OAuth Sign-In
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // ✅ Email + Password Sign-In
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password)
          throw new Error("Missing credentials");

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password)
          throw new Error("Invalid email or password");

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) throw new Error("Invalid email or password");

        return { id: user.id, email: user.email, name: user.displayName };
      },
    }),
  ],

  session: { strategy: "jwt" },

  pages: {
    signIn: "/login",
    newUser: "/language-setup",
  },

  callbacks: {
    // 🧠 Build the token
    async jwt({ token, account, user }) {
      if (account && user) {
        token.user = user;
      }
      return token;
    },

    // 🧠 Build the session
    async session({ session, token }) {
  if (token.user?.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: token.user.email },
      include: { languages: true },
    });

    // ✅ DEBUG: Log what server sees
    console.log(
      "🔍 [SESSION DEBUG]",
      dbUser?.email,
      "has languages:",
      dbUser?.languages?.length || 0
    );

    if (dbUser) {
      session.user = {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.displayName,
      };
      session.needsSetup = dbUser.languages.length === 0;
    } else {
      session.user = token.user;
      session.needsSetup = true;
    }
  } else {
    session.needsSetup = true;
  }

  return session;
},

  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

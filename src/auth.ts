import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  // Vercel preview deployments (and any host other than the fixed
  // AUTH_URL/NEXTAUTH_URL) get a dynamic URL per deployment - without this,
  // Auth.js throws UntrustedHost and silently lets requests through instead
  // of failing safe. Safe to trust here since we sit behind Vercel/our own
  // reverse proxy, not directly exposed to arbitrary Host headers from the
  // public internet.
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name ?? undefined };
      },
    }),
  ],
});

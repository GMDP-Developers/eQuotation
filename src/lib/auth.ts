import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/db";
import { authConfig } from "@/lib/auth.config";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username =
          typeof credentials?.username === "string"
            ? credentials.username.trim()
            : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";

        if (!username || !password) return null;

        const ip =
          (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ||
          "unknown";
        if (!rateLimit(`login:${ip}`, 5, 15 * 60_000)) return null;

        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) return null;

        // Tolak login password default seed walau NODE_ENV salah set di server.
        if (process.env.NODE_ENV === "production" && password === "admin123")
          return null;

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;
        if (user.role !== "ADMIN") return null;
        return {
          id: user.id,
          name: user.name ?? user.username,
          role: user.role,
        };
      },
    }),
  ],
});

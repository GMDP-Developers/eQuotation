import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth config (tanpa import Prisma) — dipakai proxy.ts.
 * Provider credentials + authorize ada di lib/auth.ts (node runtime).
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
} satisfies NextAuthConfig;

import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth config (tanpa import Prisma) — dipakai proxy.ts.
 * Provider credentials + authorize ada di lib/auth.ts (node runtime).
 * trustHost: true wajib untuk NAT / reverse-proxy (Proxmox → DNAT / Nginx):
 * Auth.js akan pakai Host + X-Forwarded-Proto/Host dari proxy sebagai origin,
 * bukan URL internal 10.x. Tanpa ini: MissingCSRF + cookie Secure mismatch.
 */
export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user && typeof user === "object") {
        if ("id" in user && typeof user.id === "string") token.id = user.id;
        if ("username" in user && typeof user.username === "string") token.username = user.username;
        if ("role" in user && typeof user.role === "string") token.role = user.role;
        if ("sid" in user && typeof user.sid === "string") token.sid = user.sid;
      }
      return token;
    },
    session({ session, token }) {
      if (typeof token.id === "string") session.user.id = token.id;
      if (typeof token.username === "string") session.user.username = token.username;
      if (typeof token.role === "string") session.user.role = token.role;
      if (typeof token.sid === "string") session.sid = token.sid;
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;

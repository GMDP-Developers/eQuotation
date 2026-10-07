import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/db";
import { authConfig } from "@/lib/auth.config";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

// ponytail: cache session 30s — jwt dipanggil TIAP request (proxy + RSC). Tanpa cache tunnel Cloudflare burst → N query paralel → SQLite SQLITE_BUSY → ngadat. Naikkan ke 60s bila sesi jarang revoke; hapus bila pakai Redis.
const sessionCache = new Map<string, { expiresAt: number; lastActive: number; cachedAt: number }>();
const CACHE_MS = 30_000;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    async jwt({ token, user }) {
      if (user && typeof user === "object") {
        if ("id" in user && typeof user.id === "string") token.id = user.id;
        if ("username" in user && typeof user.username === "string") token.username = user.username;
        if ("role" in user && typeof user.role === "string") token.role = user.role;
        if ("sid" in user && typeof user.sid === "string") token.sid = user.sid;
      }
      if (typeof token.sid === "string" && token.sid) {
        const now = Date.now();
        const cached = sessionCache.get(token.sid);
        if (cached && now - cached.cachedAt < CACHE_MS) {
          if (cached.expiresAt < now) {
            sessionCache.delete(token.sid);
            return null as unknown as typeof token;
          }
          if (cached.lastActive < now - 5 * 60 * 1000) {
            const fresh = now;
            sessionCache.set(token.sid, { ...cached, lastActive: fresh, cachedAt: fresh });
            void prisma.session
              .update({ where: { id: token.sid }, data: { lastActive: new Date(fresh) } })
              .catch(() => {});
          }
          return token;
        }
        const session = await prisma.session.findUnique({ where: { id: token.sid } }).catch(() => null);
        if (!session || session.expiresAt.getTime() < now) {
          sessionCache.delete(token.sid);
          if (session) await prisma.session.delete({ where: { id: token.sid } }).catch(() => {});
          return null as unknown as typeof token;
        }
        sessionCache.set(token.sid, {
          expiresAt: session.expiresAt.getTime(),
          lastActive: session.lastActive.getTime(),
          cachedAt: now,
        });
        if (session.lastActive.getTime() < now - 5 * 60 * 1000) {
          void prisma.session
            .update({ where: { id: token.sid }, data: { lastActive: new Date() } })
            .catch(() => {});
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (!token) return session;
      if (typeof token.id === "string") session.user.id = token.id;
      if (typeof token.username === "string") session.user.username = token.username;
      if (typeof token.role === "string") session.user.role = token.role;
      if (typeof token.sid === "string") session.sid = token.sid;
      return session;
    },
  },
  events: {
    async signOut(message) {
      const msg = message as unknown as { token?: unknown };
      if (msg.token && typeof msg.token === "object" && "sid" in msg.token) {
        const raw = msg.token.sid;
        if (typeof raw === "string" && raw) {
          sessionCache.delete(raw);
          await prisma.session.delete({ where: { id: raw } }).catch(() => {});
        }
      }
    },
  },
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username =
          typeof credentials?.username === "string" ? credentials.username.trim() : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";

        if (!username || !password) return null;

        const hdrs = await headers();
        const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
        if (!rateLimit(`login:${ip}`, 5, 15 * 60_000)) return null;

        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) return null;

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;
        if (user.role !== "ADMIN") return null;

        const userAgent = hdrs.get("user-agent")?.slice(0, 300) ?? null;
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const sess = await prisma.session.create({
          data: { userId: user.id, ipAddress: ip, userAgent, expiresAt },
        });
        return {
          id: user.id,
          name: user.name ?? user.username,
          username: user.username,
          role: user.role,
          sid: sess.id,
        };
      },
    }),
  ],
});

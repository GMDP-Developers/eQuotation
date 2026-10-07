import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

const DeleteSchema = z.object({
  id: z.string().min(1).optional(),
  allOthers: z.boolean().optional(),
});

async function resolveUserId(sessionUser: unknown): Promise<string | null> {
  if (sessionUser && typeof sessionUser === "object" && "id" in sessionUser) {
    const candidate = sessionUser.id;
    if (typeof candidate === "string" && candidate.length > 0) {
      const exists = await prisma.user.findUnique({ where: { id: candidate }, select: { id: true } });
      if (exists) return candidate;
    }
  }
  if (sessionUser && typeof sessionUser === "object") {
    if ("username" in sessionUser) {
      const cand = sessionUser.username;
      if (typeof cand === "string") {
        const u = await prisma.user.findUnique({ where: { username: cand }, select: { id: true } });
        if (u) return u.id;
      }
    }
    if ("email" in sessionUser) {
      const cand = (sessionUser as { email?: unknown }).email;
      if (typeof cand === "string") {
        const u = await prisma.user.findUnique({ where: { username: cand }, select: { id: true } });
        if (u) return u.id;
      }
    }
  }
  return null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = await resolveUserId(session.user);
  if (!userId) {
    return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });
  }
  const now = new Date();
  await prisma.session.deleteMany({ where: { userId, expiresAt: { lt: now } } }).catch(() => {});
  const sessions = await prisma.session.findMany({
    where: { userId },
    orderBy: { lastActive: "desc" },
    select: { id: true, ipAddress: true, userAgent: true, createdAt: true, lastActive: true, expiresAt: true },
  });
  let currentSid: string | null = null;
  if (session && typeof session === "object" && "sid" in session) {
    const candidate = session.sid;
    if (typeof candidate === "string" && candidate.length > 0) currentSid = candidate;
  }
  return NextResponse.json({ sessions, currentSid });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = await resolveUserId(session.user);
  if (!userId) {
    return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });
  }
  let raw: unknown = null;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }
  const parsed = DeleteSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Input tidak valid" }, { status: 400 });
  }
  const { id, allOthers } = parsed.data;
  let currentSid: string | null = null;
  if (session && typeof session === "object" && "sid" in session) {
    const candidate = session.sid;
    if (typeof candidate === "string" && candidate.length > 0) currentSid = candidate;
  }

  if (allOthers) {
    if (!currentSid) {
      return NextResponse.json({ error: "Sesi saat ini tidak ditemukan" }, { status: 400 });
    }
    const res = await prisma.session.deleteMany({
      where: { userId, id: { not: currentSid } },
    });
    return NextResponse.json({ ok: true, deleted: res.count });
  }

  if (!id) {
    return NextResponse.json({ error: "ID sesi wajib diisi" }, { status: 400 });
  }
  const target = await prisma.session.findUnique({ where: { id }, select: { userId: true } });
  if (!target || target.userId !== userId) {
    return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });
  }
  await prisma.session.delete({ where: { id } });
  return NextResponse.json({ ok: true, currentRevoked: id === currentSid });
}

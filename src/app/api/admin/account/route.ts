import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { User } from "@prisma/client";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

const BodySchema = z
  .object({
    currentPassword: z.string().min(1, "Password saat ini wajib diisi").max(72),
    newUsername: z
      .string()
      .trim()
      .min(3, "Username minimal 3 karakter")
      .max(32, "Maksimal 32 karakter")
      .regex(/^[a-zA-Z0-9_-]+$/, "Hanya huruf, angka, - dan _")
      .optional()
      .or(z.literal("")),
    newPassword: z.string().min(8, "Password minimal 8 karakter").max(72).optional().or(z.literal("")),
    confirmPassword: z.string().optional().or(z.literal("")),
  })
  .refine(
    (d) => {
      const u = d.newUsername?.trim();
      const p = d.newPassword?.trim();
      return Boolean(u || p);
    },
    { message: "Isi username baru atau password baru", path: ["newUsername"] }
  )
  .refine(
    (d) => {
      if (d.newPassword?.trim()) return d.newPassword === d.confirmPassword;
      return true;
    },
    { message: "Konfirmasi password tidak cocok", path: ["confirmPassword"] }
  );

export async function PUT(req: Request) {
  const session = await auth();
  const sessionUser = session?.user;
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let currentSid: string | null = null;
  if (session && typeof session === "object" && "sid" in session) {
    const cand = session.sid;
    if (typeof cand === "string" && cand.length > 0) currentSid = cand;
  }

  let userId: string | null = null;
  if (sessionUser && typeof sessionUser === "object" && "id" in sessionUser) {
    const candidate = sessionUser.id;
    if (typeof candidate === "string" && candidate.length > 0) userId = candidate;
  }

  let user: User | null = null;
  if (userId) {
    user = await prisma.user.findUnique({ where: { id: userId } });
  }
  if (!user) {
    let lookup: string | null = null;
    if (sessionUser && typeof sessionUser === "object" && "username" in sessionUser) {
      const c = sessionUser.username;
      if (typeof c === "string") lookup = c;
    }
    if (!lookup && sessionUser.email) lookup = sessionUser.email;
    if (!lookup && sessionUser.name) lookup = sessionUser.name;
    if (lookup) {
      user = await prisma.user.findUnique({ where: { username: lookup } });
      if (!user) {
        user = await prisma.user.findFirst({ where: { name: lookup } });
      }
    }
  }
  if (!user) {
    return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });
  }

  let raw: unknown = null;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Input tidak valid";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { currentPassword, newUsername: rawUsername, newPassword: rawPassword } = parsed.data;
  const newUsername = rawUsername?.trim() || null;
  const newPassword = rawPassword?.trim() || null;

  const ok = await bcrypt.compare(currentPassword, user.password);
  if (!ok) {
    return NextResponse.json({ error: "Password saat ini salah" }, { status: 400 });
  }

  if (newUsername && newUsername !== user.username) {
    const exists = await prisma.user.findUnique({ where: { username: newUsername } });
    if (exists) {
      return NextResponse.json({ error: "Username sudah digunakan" }, { status: 409 });
    }
  }

  const data: { username?: string; password?: string } = {};
  if (newUsername && newUsername !== user.username) data.username = newUsername;
  if (newPassword) data.password = await bcrypt.hash(newPassword, 12);

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Tidak ada perubahan" }, { status: 400 });
  }

  await prisma.user.update({ where: { id: user.id }, data });

  if (newPassword && currentSid) {
    await prisma.session.deleteMany({ where: { userId: user.id, id: { not: currentSid } } }).catch(() => {});
  }

  await prisma.auditLog
    .create({
      data: {
        action: "ACCOUNT_UPDATE",
        targetId: user.id,
        detail: newUsername && newUsername !== user.username ? `username → ${newUsername}` : "password changed",
      },
    })
    .catch(() => {});

  return NextResponse.json({ ok: true });
}

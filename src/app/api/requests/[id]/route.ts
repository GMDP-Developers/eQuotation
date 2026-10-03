import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { SERVICE_STATUS } from "@/types";

const statusSchema = z.object({
  status: z.enum(SERVICE_STATUS, "Pilih salah satu status"),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized. Silakan login terlebih dahulu." },
      { status: 401 }
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Body request tidak valid (bukan JSON)." },
      { status: 400 }
    );
  }

  const parsed = statusSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Status tidak valid.",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 }
    );
  }

  const { id } = await params;

  try {
    const existing = await prisma.serviceRequest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Permintaan tidak ditemukan." },
        { status: 404 }
      );
    }

    const newStatus = parsed.data.status;
    const [updated] = await prisma.$transaction([
      prisma.serviceRequest.update({
        where: { id },
        data: { status: newStatus },
      }),
      prisma.auditLog.create({
        data: {
          action: "STATUS_CHANGE",
          targetId: id,
          detail: `${existing.status}→${newStatus}`,
        },
      }),
    ]);

    return NextResponse.json({ ok: true, status: updated.status });
  } catch (err) {
    console.error("Gagal memperbarui status permintaan:", err);
    return NextResponse.json(
      { error: "Gagal memperbarui data. Coba lagi." },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized. Silakan login terlebih dahulu." },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    const existing = await prisma.serviceRequest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Permintaan tidak ditemukan." },
        { status: 404 }
      );
    }

    await prisma.$transaction([
      prisma.serviceRequest.delete({ where: { id } }),
      prisma.auditLog.create({
        data: { action: "DELETE", targetId: id, detail: existing.companyName },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Gagal menghapus permintaan:", err);
    return NextResponse.json(
      { error: "Gagal menghapus data. Coba lagi." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { serviceRequestSchema } from "@/types";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  let json: unknown;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`submit:${ip}`, 5, 60_000)) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Coba lagi beberapa saat." },
      { status: 429 }
    );
  }

  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Body request tidak valid (bukan JSON)." },
      { status: 400 }
    );
  }

  const parsed = serviceRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validasi gagal. Periksa kembali isian form.",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 422 }
    );
  }

  const data = parsed.data;

  const svc = await prisma.service.findFirst({
    where: { name: data.serviceType, active: true },
  });
  if (!svc) {
    return NextResponse.json(
      { error: "Layanan tidak dikenal atau tidak aktif." },
      { status: 422 }
    );
  }

  try {
    const created = await prisma.serviceRequest.create({
      data: {
        companyName: data.companyName,
        contactName: data.contactName,
        position: data.position || null,
        phone: data.phone,
        email: data.email,
        serviceType: data.serviceType,
        capacity: data.capacity,
        capacityUnit: data.capacityUnit,
        notes: data.notes || null,
      },
    });
    return NextResponse.json(
      { ok: true, id: created.id },
      { status: 201 }
    );
  } catch (err) {
    console.error("gagal simpan service request:", err);
    return NextResponse.json(
      { error: "Gagal menyimpan data. Coba lagi." },
      { status: 500 }
    );
  }
}

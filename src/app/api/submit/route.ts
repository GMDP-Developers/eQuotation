import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { serviceRequestSchema } from "@/types";

export async function POST(req: Request) {
  let json: unknown;
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
  } catch {
    return NextResponse.json(
      { error: "Gagal menyimpan data. Coba lagi." },
      { status: 500 }
    );
  }
}

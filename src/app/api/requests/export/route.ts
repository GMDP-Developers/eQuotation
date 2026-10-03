import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { SERVICE_STATUS } from "@/types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function toDate(value: string): Date | null {
  if (!DATE_RE.test(value)) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized. Silakan login terlebih dahulu." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const serviceType = searchParams.get("serviceType")?.trim() || null;
  const status = searchParams.get("status");
  const fromRaw = searchParams.get("from");
  const toRaw = searchParams.get("to");

  if (serviceType && serviceType.length > 60) {
    return NextResponse.json(
      { error: "Filter layanan tidak valid." },
      { status: 400 }
    );
  }
  if (status && !SERVICE_STATUS.includes(status as (typeof SERVICE_STATUS)[number])) {
    return NextResponse.json(
      { error: "Filter status tidak valid." },
      { status: 400 }
    );
  }

  const from = fromRaw ? toDate(fromRaw) : null;
  const to = toRaw ? toDate(toRaw) : null;
  if ((fromRaw && !from) || (toRaw && !to)) {
    return NextResponse.json(
      { error: "Format tanggal tidak valid (pakai YYYY-MM-DD)." },
      { status: 400 }
    );
  }

  const where = {
    ...(serviceType ? { serviceType } : {}),
    ...(status ? { status } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: new Date(to.getTime() + 24 * 60 * 60 * 1000) } : {}),
          },
        }
      : {}),
  };

  try {
    const rows = await prisma.serviceRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const data = rows.map((r) => ({
      ID: r.id,
      Perusahaan: r.companyName,
      Kontak: r.contactName,
      Jabatan: r.position ?? "",
      Telepon: r.phone,
      Email: r.email,
      Layanan: r.serviceType,
      Kapasitas: r.capacity,
      Satuan: r.capacityUnit,
      Status: r.status,
      Catatan: r.notes ?? "",
      Dibuat: r.createdAt.toISOString().slice(0, 19).replace("T", " "),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Permintaan");

    // ponytail: in-memory xlsx; kalau data ribuan → stream ke file/disk.
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const today = new Date().toISOString().slice(0, 10);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="permintaan-${today}.xlsx"`,
      },
    });
  } catch (err) {
    console.error("Gagal mengekspor data permintaan:", err);
    return NextResponse.json(
      { error: "Gagal mengekspor data. Coba lagi." },
      { status: 500 }
    );
  }
}

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
    return NextResponse.json({ error: "Filter layanan tidak valid." }, { status: 400 });
  }
  if (status && !SERVICE_STATUS.includes(status as (typeof SERVICE_STATUS)[number])) {
    return NextResponse.json({ error: "Filter status tidak valid." }, { status: 400 });
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
      Dibuat: r.createdAt.toLocaleString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      Perusahaan: r.companyName,
      Kontak: r.contactName,
      Jabatan: r.position ?? "",
      Telepon: r.phone,
      Email: r.email,
      Layanan: r.serviceType,
      Kapasitas: `${r.capacity} ${r.capacityUnit}`,
      Status: r.status,
      Catatan: r.notes ?? "",
    }));

    const ws = XLSX.utils.json_to_sheet(data, {
      header: ["Dibuat", "Perusahaan", "Kontak", "Jabatan", "Telepon", "Email", "Layanan", "Kapasitas", "Status", "Catatan"],
    });

    // Excel-like: lebar kolom, autoFilter, freeze header
    ws["!cols"] = [
      { wch: 18 },
      { wch: 24 },
      { wch: 18 },
      { wch: 16 },
      { wch: 16 },
      { wch: 26 },
      { wch: 14 },
      { wch: 14 },
      { wch: 12 },
      { wch: 32 },
    ];
    const endCol = "J";
    const endRow = data.length + 1;
    ws["!autofilter"] = { ref: `A1:${endCol}1` };
    // freeze header (SheetJS: !freeze or pane)
    (ws as unknown as Record<string, unknown>)["!freeze"] = {
      xSplit: 0,
      ySplit: 1,
      topLeftCell: "A2",
      activePane: "bottomLeft",
      state: "frozen",
    };

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Permintaan");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx", compression: true });

    const today = new Date().toISOString().slice(0, 10);
    return new Response(new Uint8Array(buf as ArrayBuffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="permintaan-${today}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Gagal mengekspor data permintaan:", err);
    return NextResponse.json({ error: "Gagal mengekspor data. Coba lagi." }, { status: 500 });
  }
}

"use client";

import { useEffect, useRef } from "react";
import { Download } from "lucide-react";
import jspreadsheet from "jspreadsheet-ce";
import type { WorksheetInstance } from "jspreadsheet-ce";
import "jspreadsheet-ce/dist/jspreadsheet.css";
import "jsuites/dist/jsuites.css";

import type { ServiceRequestRecord } from "@/types";
import { Button } from "@/components/ui/button";

// Latar baris per status (tint terang supaya teks tetap terbaca).
const STATUS_BG: Record<string, string> = {
  BARU: "#dbeafe", // biru
  DIPROSES: "#fef3c7", // kuning
  SELESAI: "#dcfce7", // hijau
  DITOLAK: "#fee2e2", // merah
};

const COLUMNS = [
  { title: "Dibuat", width: 150 },
  { title: "Perusahaan", width: 200 },
  { title: "Kontak", width: 160 },
  { title: "Jabatan", width: 140 },
  { title: "Telepon", width: 130 },
  { title: "Email", width: 200 },
  { title: "Layanan", width: 110 },
  { title: "Kapasitas", width: 110 },
  { title: "Catatan", width: 240 },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  const tanggal = d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const waktu = d
    .toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    .replace(/\./g, ":");
  return `${tanggal} ${waktu}`;
}

function toRow(r: ServiceRequestRecord): string[] {
  return [
    formatDate(r.createdAt),
    r.companyName,
    r.contactName,
    r.position ?? "",
    r.phone,
    r.email,
    r.serviceType,
    `${r.capacity} ${r.capacityUnit}`,
    r.notes ?? "",
  ];
}

export function RequestsSheet({
  requests,
}: {
  requests: ServiceRequestRecord[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sheetsRef = useRef<WorksheetInstance[] | null>(null);
  const requestsRef = useRef<ServiceRequestRecord[]>(requests);
  useEffect(() => {
    requestsRef.current = requests;
  }, [requests]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = ""; // StrictMode re-run: drop DOM left by previous mount.
    sheetsRef.current = jspreadsheet(el, {
      allowExport: true,
      includeHeadersOnDownload: true,
      worksheets: [
        {
          data: requests.map(toRow),
          // ponytail: warna diikat ke index baris saat render; bila user sort
          // dari client, warna bisa tidak ikut berpindah. Upgrade: simpan
          // status di data + kolom tersembunyi.
          columns: COLUMNS.map((c) => ({
            ...c,
            render: (
              cell: HTMLTableCellElement,
              _value: unknown,
              _x: number,
              y: number,
            ) => {
              const status = requestsRef.current[y]?.status;
              cell.style.backgroundColor = STATUS_BG[status ?? ""] ?? "";
            },
          })),
          editable: false,
          csvFileName: "permintaan",
          csvDelimiter: ",",
          tableOverflow: true,
          tableWidth: "100%",
          tableHeight: "70vh",
        },
      ],
    });
    return () => {
      // ponytail: destroy() expects the element enriched by jspreadsheet at runtime.
      jspreadsheet.destroy(el as jspreadsheet.JspreadsheetInstanceElement, true);
      sheetsRef.current = null;
    };
  }, [requests]);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => sheetsRef.current?.[0]?.download(true)}
        >
          <Download className="size-4" />
          Unduh CSV
        </Button>
      </div>
      <div ref={containerRef} />
    </div>
  );
}

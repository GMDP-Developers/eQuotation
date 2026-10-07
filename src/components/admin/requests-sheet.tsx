"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, Download, FileSpreadsheet, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import type { ServiceRequestRecord } from "@/types";
import { Button } from "@/components/ui/button";

const STATUS_DOT: Record<string, string> = {
  BARU: "#2563eb",
  DIPROSES: "#d97706",
  SELESAI: "#16a34a",
  DITOLAK: "#dc2626",
};

type ColKey =
  | "createdAt"
  | "companyName"
  | "contactName"
  | "position"
  | "phone"
  | "email"
  | "serviceType"
  | "capacity"
  | "notes"
  | "status";

const COLS: { key: ColKey; label: string; w: string }[] = [
  { key: "createdAt", label: "DIBUAT", w: "min-w-[132px]" },
  { key: "companyName", label: "PERUSAHAAN", w: "min-w-[180px]" },
  { key: "contactName", label: "KONTAK", w: "min-w-[140px]" },
  { key: "position", label: "JABATAN", w: "min-w-[120px]" },
  { key: "phone", label: "TELEPON", w: "min-w-[120px]" },
  { key: "email", label: "EMAIL", w: "min-w-[190px]" },
  { key: "serviceType", label: "LAYANAN", w: "min-w-[110px]" },
  { key: "capacity", label: "KAPASITAS", w: "min-w-[110px]" },
  { key: "status", label: "STATUS", w: "min-w-[100px]" },
  { key: "notes", label: "CATATAN", w: "min-w-[220px]" },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  const tgl = d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
  const jam = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(/\./g, ":");
  return `${tgl} ${jam}`;
}

function getSortValue(r: ServiceRequestRecord, k: ColKey): string {
  if (k === "capacity") return String(r.capacity).padStart(9, "0");
  if (k === "createdAt") return r.createdAt;
  const v = (r as unknown as Record<string, string | null>)[k];
  return (v ?? "").toString().toLowerCase();
}

export function RequestsSheet({ requests }: { requests: ServiceRequestRecord[] }) {
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<ColKey>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [downloading, setDownloading] = useState(false);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return requests;
    return requests.filter((r) =>
      [r.companyName, r.contactName, r.email, r.phone, r.serviceType, r.position ?? "", r.notes ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(s)
    );
  }, [requests, q]);

  const rows = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const av = getSortValue(a, sortKey);
      const bv = getSortValue(b, sortKey);
      const cmp = av.localeCompare(bv, "id");
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  function toggleSort(k: ColKey) {
    if (k === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir("asc");
    }
  }

  async function downloadXlsx() {
    setDownloading(true);
    try {
      const res = await fetch("/api/requests/export");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition");
      const m = cd && cd.match(/filename="?([^"]+)"?/);
      const filename = m ? m[1] : `permintaan-${new Date().toISOString().slice(0, 10)}.xlsx`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Excel diunduh", { description: filename });
    } catch {
      toast.error("Gagal export Excel", { description: "Coba lagi." });
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-md border border-[#d0d7de] bg-white shadow-sm">
      {/* Excel-like top bar */}
      <div className="flex items-center justify-between gap-3 border-b border-[#d0d7de] bg-[#f3f4f6] px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-sm bg-[#217346] text-white shadow-sm">
            <FileSpreadsheet className="size-3.5" />
          </span>
          <span className="text-[13px] font-semibold tracking-tight text-[#1f2937]">permintaan.xlsx</span>
          <span className="hidden rounded bg-white px-1.5 py-0.5 text-[11px] text-muted-foreground ring-1 ring-[#d0d7de] sm:inline">
            {rows.length} baris
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari perusahaan, kontak, email…"
              className="h-7 w-60 rounded-sm border border-[#d1d5db] bg-white pl-7 pr-2 text-[12px] outline-none placeholder:text-muted-foreground focus:border-[#217346] focus:ring-1 focus:ring-[#217346]/20 lg:w-72"
            />
          </div>
          <Button
            size="sm"
            onClick={downloadXlsx}
            disabled={downloading}
            className="h-7 rounded-sm bg-[#217346] px-3 text-[12px] font-medium text-white hover:bg-[#1a6238] disabled:opacity-60"
          >
            {downloading ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
            Export Excel
          </Button>
        </div>
      </div>

      {/* mobile search */}
      <div className="border-b border-[#d0d7de] bg-white p-2 sm:hidden">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari…"
            className="h-8 w-full rounded-sm border border-[#d1d5db] bg-white pl-7 pr-2 text-[12px] outline-none focus:border-[#217346] focus:ring-1 focus:ring-[#217346]/20"
          />
        </div>
      </div>

      {/* formula bar hint */}
      <div className="flex items-center gap-2 border-b border-[#d0d7de] bg-white px-2 py-1">
        <span className="rounded-sm border border-[#d1d5db] bg-[#f9fafb] px-2 py-0.5 font-mono text-[11px] text-muted-foreground">fx</span>
        <span className="truncate text-[11px] text-muted-foreground">
          Klik header untuk sort • Klik Export Excel untuk membuka di Microsoft Excel
        </span>
      </div>

      {/* grid */}
      <div className="relative max-h-[62vh] overflow-auto bg-white">
        <table className="w-full border-collapse text-[12px]" style={{ fontFamily: "Calibri, 'Segoe UI', Arial, sans-serif" }}>
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="sticky left-0 z-20 w-9 border-b border-r border-[#d0d7de] bg-[#f3f4f6] px-1 py-1.5 text-center text-[11px] font-medium text-[#6b7280]">
                #
              </th>
              {COLS.map((c) => (
                <th
                  key={c.key}
                  onClick={() => toggleSort(c.key)}
                  className={`cursor-pointer select-none whitespace-nowrap border-b border-r border-[#d0d7de] bg-[#f3f4f6] px-2 py-1.5 text-left text-[11px] font-semibold tracking-wide text-[#374151] hover:bg-[#eef0f2] ${c.w}`}
                >
                  <span className="inline-flex items-center gap-1">
                    {c.label}
                    <ArrowUpDown
                      className={`size-3 ${sortKey === c.key ? "opacity-70" : "opacity-30"}`}
                    />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={COLS.length + 1} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Tidak ada data{ q ? ` untuk "${q}"` : ""}.
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={r.id} className="hover:bg-[#f8fafc]">
                  <td className="sticky left-0 border-b border-r border-[#e5e7eb] bg-[#f9fafb] px-1 py-1.5 text-center text-[11px] tabular-nums text-[#6b7280]">
                    {i + 1}
                  </td>
                  <td className="border-b border-r border-[#e5e7eb] px-2 py-1.5 whitespace-nowrap tabular-nums text-[#111827]">
                    {formatDate(r.createdAt)}
                  </td>
                  <td className="max-w-[220px] truncate border-b border-r border-[#e5e7eb] px-2 py-1.5 font-medium text-[#111827]">
                    {r.companyName}
                  </td>
                  <td className="max-w-[160px] truncate border-b border-r border-[#e5e7eb] px-2 py-1.5 text-[#111827]">{r.contactName}</td>
                  <td className="max-w-[160px] truncate border-b border-r border-[#e5e7eb] px-2 py-1.5 text-[#374151]">{r.position ?? "—"}</td>
                  <td className="whitespace-nowrap border-b border-r border-[#e5e7eb] px-2 py-1.5 tabular-nums text-[#111827]">{r.phone}</td>
                  <td className="max-w-[210px] truncate border-b border-r border-[#e5e7eb] px-2 py-1.5 text-[#374151]">{r.email}</td>
                  <td className="whitespace-nowrap border-b border-r border-[#e5e7eb] px-2 py-1.5 text-[#111827]">{r.serviceType}</td>
                  <td className="whitespace-nowrap border-b border-r border-[#e5e7eb] px-2 py-1.5 tabular-nums text-[#111827]">
                    {r.capacity} {r.capacityUnit}
                  </td>
                  <td className="whitespace-nowrap border-b border-r border-[#e5e7eb] px-2 py-1.5">
                    <span className="inline-flex items-center gap-1.5 text-[12px]">
                      <span className="size-1.5 rounded-full" style={{ background: STATUS_DOT[r.status] ?? "#9ca3af" }} />
                      {r.status}
                    </span>
                  </td>
                  <td className="max-w-[260px] truncate border-b border-r border-[#e5e7eb] px-2 py-1.5 text-[#374151]">
                    {r.notes ?? "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* sheet tabs */}
      <div className="flex items-center gap-2 border-t border-[#d0d7de] bg-[#f3f4f6] px-2 py-1">
        <span className="rounded-t border-x border-t border-[#d0d7de] bg-white px-3 py-1 text-[11px] font-semibold text-[#217346] shadow-sm">Permintaan</span>
        <span className="hidden text-[11px] text-muted-foreground sm:inline">
          {rows.length} baris
        </span>
        <span className="ml-auto hidden text-[11px] text-muted-foreground sm:inline">Excel-like</span>
      </div>
    </div>
  );
}

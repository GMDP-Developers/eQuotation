"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Download,
  Inbox,
  Mail,
  Phone,
  RefreshCw,
  Search,
  User,
} from "lucide-react";
import * as XLSX from "xlsx";

import { SERVICE_TYPES } from "@/types";
import type { ServiceRequestRecord } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type FilterValue = "ALL" | (typeof SERVICE_TYPES)[number];

const SERVICE_BADGE: Record<string, string> = {
  ULO: "bg-sky-500/12 text-sky-700 ring-sky-500/25",
  "Tier One": "bg-violet-500/12 text-violet-700 ring-violet-500/25",
  Intermix: "bg-amber-500/12 text-amber-700 ring-amber-500/25",
  Supermix: "bg-rose-500/12 text-rose-700 ring-rose-500/25",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="gap-2 py-4">
      <CardContent className="px-4">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
        <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums">
          {value.toLocaleString("id-ID")}
        </p>
      </CardContent>
    </Card>
  );
}

export function RequestsDashboard({
  requests,
}: {
  requests: ServiceRequestRecord[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterValue>("ALL");
  const [refreshing, setRefreshing] = useState(false);

  const counts = useMemo(() => {
    const map: Record<string, number> = { ALL: requests.length };
    for (const t of SERVICE_TYPES) map[t] = 0;
    for (const r of requests) {
      map[r.serviceType] = (map[r.serviceType] ?? 0) + 1;
    }
    return map;
  }, [requests]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return requests.filter((r) => {
      if (filter !== "ALL" && r.serviceType !== filter) return false;
      if (!q) return true;
      return (
        r.companyName.toLowerCase().includes(q) ||
        r.contactName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q) ||
        (r.position ?? "").toLowerCase().includes(q) ||
        (r.notes ?? "").toLowerCase().includes(q)
      );
    });
  }, [requests, query, filter]);

  function exportExcel() {
    const rows = filtered.map((r, i) => ({
      No: i + 1,
      "Nama Perusahaan": r.companyName,
      "Nama Kontak": r.contactName,
      Jabatan: r.position ?? "",
      Telepon: r.phone,
      Email: r.email,
      "Tipe Layanan": r.serviceType,
      Kapasitas: r.capacity,
      Satuan: r.capacityUnit,
      Catatan: r.notes ?? "",
      "Tanggal Masuk": formatDate(r.createdAt),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 5 },
      { wch: 28 },
      { wch: 22 },
      { wch: 16 },
      { wch: 16 },
      { wch: 28 },
      { wch: 12 },
      { wch: 10 },
      { wch: 8 },
      { wch: 36 },
      { wch: 18 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Permintaan");
    const stamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `permintaan-layanan-${stamp}.xlsx`);
  }

  function refresh() {
    setRefreshing(true);
    router.refresh();
    window.setTimeout(() => setRefreshing(false), 800);
  }

  const filterPills: { value: FilterValue; label: string }[] = [
    { value: "ALL", label: `Semua (${counts.ALL ?? 0})` },
    ...SERVICE_TYPES.map((t) => ({
      value: t as FilterValue,
      label: `${t} (${counts[t] ?? 0})`,
    })),
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <MetricCard label="Total" value={counts.ALL ?? 0} />
        {SERVICE_TYPES.map((t) => (
          <MetricCard key={t} label={t} value={counts[t] ?? 0} />
        ))}
      </div>

      {/* Table card */}
      <Card id="requests" className="gap-4 py-5">
        <CardHeader className="gap-3 px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Inbox className="size-4 text-primary" />
                Data Permintaan Masuk
              </CardTitle>
              <CardDescription>
                {filtered.length} dari {requests.length} data ditampilkan
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                disabled={refreshing}
              >
                <RefreshCw
                  className={refreshing ? "size-4 animate-spin" : "size-4"}
                />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportExcel}
                disabled={filtered.length === 0}
              >
                <Download className="size-4" />
                Export Excel (.xlsx)
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari perusahaan, kontak, email, telepon, catatan…"
                className="pl-9"
                aria-label="Cari permintaan"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {filterPills.map((pill) => {
                const active = filter === pill.value;
                return (
                  <button
                    key={pill.value}
                    type="button"
                    onClick={() => setFilter(pill.value)}
                    className={[
                      "rounded-full border px-3 py-1 text-xs font-medium transition",
                      active
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "bg-background text-muted-foreground hover:bg-accent hover:text-foreground",
                    ].join(" ")}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
              <Inbox className="size-8 text-muted-foreground/50" />
              <p className="text-sm font-medium">Belum ada data</p>
              <p className="text-xs text-muted-foreground">
                {requests.length === 0
                  ? "Permintaan baru akan muncul di sini setelah form di-submit."
                  : "Tidak ada data yang cocok dengan filter / pencarian."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">#</TableHead>
                  <TableHead>Perusahaan</TableHead>
                  <TableHead>Kontak</TableHead>
                  <TableHead>Kontak Info</TableHead>
                  <TableHead>Layanan</TableHead>
                  <TableHead className="text-right">Kapasitas</TableHead>
                  <TableHead>Catatan</TableHead>
                  <TableHead>Masuk</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r, idx) => (
                  <TableRow key={r.id}>
                    <TableCell className="pl-5 text-muted-foreground tabular-nums">
                      {idx + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="size-3.5 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{r.companyName}</p>
                          {r.position ? (
                            <p className="text-xs text-muted-foreground">
                              {r.position}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="size-3.5 shrink-0 text-muted-foreground" />
                        {r.contactName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5 text-xs">
                        <span className="flex items-center gap-1.5">
                          <Phone className="size-3 text-muted-foreground" />
                          {r.phone}
                        </span>
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Mail className="size-3" />
                          {r.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={[
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1",
                          SERVICE_BADGE[r.serviceType] ??
                            "bg-muted text-foreground ring-border",
                        ].join(" ")}
                      >
                        {r.serviceType}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {Number(r.capacity).toLocaleString("id-ID")}{" "}
                      <span className="text-xs text-muted-foreground">
                        {r.capacityUnit}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[14rem]">
                      <p
                        className="truncate text-xs text-muted-foreground"
                        title={r.notes ?? ""}
                      >
                        {r.notes || "—"}
                      </p>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(r.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

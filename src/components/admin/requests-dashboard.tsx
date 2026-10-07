"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  ChevronDown,
  Download,
  Inbox,
  Mail,
  Phone,
  RefreshCw,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { SERVICE_STATUS } from "@/types";
import type { ServiceRequestRecord } from "@/types";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { selectClass } from "@/lib/form-classes";

const SERVICE_BADGE: Record<string, string> = {
  ULO: "bg-sky-500/12 text-sky-700 ring-sky-500/25",
  "Tier One": "bg-violet-500/12 text-violet-700 ring-violet-500/25",
  Intermix: "bg-amber-500/12 text-amber-700 ring-amber-500/25",
  Supermix: "bg-rose-500/12 text-rose-700 ring-rose-500/25",
};

const STATUS_BADGE: Record<string, string> = {
  BARU: "bg-blue-500/12 text-blue-700 ring-blue-500/25",
  DIPROSES: "bg-amber-500/12 text-amber-700 ring-amber-500/25",
  SELESAI: "bg-green-500/12 text-green-700 ring-green-500/25",
  DITOLAK: "bg-red-500/12 text-red-700 ring-red-500/25",
};

const STATUS_LABEL: Record<string, string> = {
  BARU: "Baru",
  DIPROSES: "Diproses",
  SELESAI: "Selesai",
  DITOLAK: "Ditolak",
};


type FilterValue = "ALL" | string;

type FilterValues = {
  serviceType: FilterValue;
  status: FilterValue;
  from: string;
  to: string;
};

type DashboardFilters = Partial<FilterValues>;

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildQuery(values: FilterValues, page?: number) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(values)) {
    if (v) p.set(k, v);
  }
  if (page && page > 1) p.set("page", String(page));
  const qs = p.toString();
  return qs ? `?${qs}` : "";
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
  page,
  totalPages,
  total,
  filters,
  services,
}: {
  requests: ServiceRequestRecord[];
  page: number;
  totalPages: number;
  total: number;
  filters: DashboardFilters;
  services: { name: string; active: boolean }[];
}) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [filterService, setFilterService] = useState(filters.serviceType ?? "");
  const [filterStatus, setFilterStatus] = useState(filters.status ?? "");
  const [filterFrom, setFilterFrom] = useState(filters.from ?? "");
  const [filterTo, setFilterTo] = useState(filters.to ?? "");

  const applied: FilterValues = {
    serviceType: filters.serviceType ?? "",
    status: filters.status ?? "",
    from: filters.from ?? "",
    to: filters.to ?? "",
  };
  const appliedQuery = buildQuery(applied);

  function refresh() {
    setRefreshing(true);
    router.refresh();
    window.setTimeout(() => setRefreshing(false), 800);
  }

  function applyFilters() {
    router.push(
      buildQuery({
        serviceType: filterService,
        status: filterStatus,
        from: filterFrom,
        to: filterTo,
      })
    );
  }

  async function updateStatus(id: string, status: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success("Status permintaan diperbarui");
      router.refresh();
    } catch {
      toast.error("Gagal memperbarui status permintaan");
    } finally {
      setBusyId(null);
    }
  }

  async function removeRequest(id: string, companyName: string) {
    if (!window.confirm(`Hapus permintaan dari ${companyName}?`)) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/requests/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success("Permintaan dihapus");
      router.refresh();
    } catch {
      toast.error("Gagal menghapus permintaan");
    } finally {
      setBusyId(null);
    }
  }

  const columnCount = 9;

  return (
    <div className="flex flex-col gap-5">
      <div className="max-w-xs">
        <MetricCard label="Total Data" value={total} />
      </div>

      <Card id="requests" className="gap-4 py-5">
        <CardHeader className="gap-3 px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Inbox className="size-4 text-primary" />
                Data Permintaan Masuk
              </CardTitle>
              <CardDescription>
                {total} data sesuai filter aktif
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
              <a
                href={`/api/requests/export${appliedQuery}`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <Download className="size-4" />
                Export Excel (.xlsx)
              </a>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              applyFilters();
            }}
            className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:flex lg:items-end lg:gap-2">
              <div className="grid gap-1.5">
                <Label htmlFor="filter-service">Layanan</Label>
                <select
                  id="filter-service"
                  className={selectClass}
                  value={filterService}
                  onChange={(e) => setFilterService(e.target.value)}
                >
                  <option value="">Semua</option>
                  {services.map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name}
                      {s.active ? "" : " (nonaktif)"}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="filter-status">Status</Label>
                <select
                  id="filter-status"
                  className={selectClass}
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">Semua</option>
                  {SERVICE_STATUS.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="filter-from">Dari</Label>
                <Input
                  id="filter-from"
                  type="date"
                  className="w-full lg:w-40"
                  value={filterFrom}
                  onChange={(e) => setFilterFrom(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="filter-to">Sampai</Label>
                <Input
                  id="filter-to"
                  type="date"
                  className="w-full lg:w-40"
                  value={filterTo}
                  onChange={(e) => setFilterTo(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit" size="sm">
                Terapkan
              </Button>
              <Link
                href="/admin/dashboard"
                className="text-xs text-muted-foreground underline-offset-4 hover:underline"
              >
                Reset
              </Link>
            </div>
          </form>
        </CardHeader>

        <CardContent className="px-0">
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
              <Inbox className="size-8 text-muted-foreground/50" />
              <p className="text-sm font-medium">Belum ada data</p>
              <p className="text-xs text-muted-foreground">
                {appliedQuery
                  ? "Tidak ada data yang cocok dengan filter."
                  : "Permintaan baru akan muncul di sini setelah form di-submit."}
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
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Kapasitas</TableHead>
                  <TableHead>Masuk</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r, idx) => (
                  <Fragment key={r.id}>
                    <TableRow
                      className="cursor-pointer"
                      onClick={() =>
                        setExpandedId((cur) => (cur === r.id ? null : r.id))
                      }
                    >
                      <TableCell className="pl-5 text-muted-foreground tabular-nums">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ChevronDown
                            className={[
                              "size-3.5 shrink-0 text-muted-foreground transition-transform",
                              expandedId === r.id ? "rotate-180" : "",
                            ].join(" ")}
                          />
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
                      <TableCell>
                        <span
                          className={[
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1",
                            STATUS_BADGE[r.status] ??
                              "bg-muted text-foreground ring-border",
                          ].join(" ")}
                        >
                          {STATUS_LABEL[r.status] ?? r.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {Number(r.capacity).toLocaleString("id-ID")}{" "}
                        <span className="text-xs text-muted-foreground">
                          {r.capacityUnit}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(r.createdAt)}
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <select
                            aria-label={`Status permintaan ${r.companyName}`}
                            className={`${selectClass} w-auto py-0`}
                            value={r.status}
                            disabled={busyId === r.id}
                            onChange={(e) => updateStatus(r.id, e.target.value)}
                          >
                            {SERVICE_STATUS.map((s) => (
                              <option key={s} value={s}>
                                {STATUS_LABEL[s]}
                              </option>
                            ))}
                          </select>
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-8 text-destructive"
                            aria-label={`Hapus permintaan ${r.companyName}`}
                            disabled={busyId === r.id}
                            onClick={() => removeRequest(r.id, r.companyName)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedId === r.id ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell
                          colSpan={columnCount}
                          className="bg-muted/30 px-5 py-4"
                        >
                          <div className="grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                              <p className="text-muted-foreground">
                                Nama Perusahaan
                              </p>
                              <p className="font-medium">{r.companyName}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">
                                Nama Kontak
                              </p>
                              <p className="font-medium">{r.contactName}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Jabatan</p>
                              <p className="font-medium">{r.position || "—"}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Telepon</p>
                              <p className="font-medium">{r.phone}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Email</p>
                              <p className="font-medium">{r.email}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">
                                Tipe Layanan
                              </p>
                              <p className="font-medium">{r.serviceType}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Kapasitas</p>
                              <p className="font-medium tabular-nums">
                                {Number(r.capacity).toLocaleString("id-ID")}{" "}
                                {r.capacityUnit}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Status</p>
                              <p className="font-medium">
                                {STATUS_LABEL[r.status] ?? r.status}
                              </p>
                            </div>
                            <div className="sm:col-span-2 lg:col-span-4">
                              <p className="text-muted-foreground">Catatan</p>
                              <p className="whitespace-pre-wrap font-medium">
                                {r.notes || "—"}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">
                                Tanggal Masuk
                              </p>
                              <p className="font-medium">
                                {formatDate(r.createdAt)}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">
                                Diperbarui
                              </p>
                              <p className="font-medium">
                                {formatDate(r.updatedAt)}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          )}

          {total > 0 ? (
            <div className="flex items-center justify-between border-t px-5 py-3">
              <p className="text-xs text-muted-foreground">
                Halaman {page} dari {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => router.push(buildQuery(applied, page - 1))}
                >
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => router.push(buildQuery(applied, page + 1))}
                >
                  Berikutnya
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { CAPACITY_UNITS, type CapacityUnit } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
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

const ApiResponse = z.object({
  ok: z.boolean().optional(),
  error: z.string().optional(),
});

export type ServiceData = {
  id: string;
  name: string;
  subtitle: string | null;
  description: string | null;
  imagePreview: string | null;
  imageFull: string | null;
  sortOrder: number;
  active: boolean;
  bestSeller: boolean;
  lockedCapacity: number | null;
  lockedCapacityUnit: CapacityUnit | null;
  createdAt: string;
};

const textareaClass =
  "flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:text-sm";

export function ServicesManager({ services }: { services: ServiceData[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ServiceData | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set(
      "active",
      (form.elements.namedItem("active") as HTMLInputElement).checked
        ? "true"
        : "false"
    );
    for (const key of ["imagePreview", "imageFull"]) {
      const entry = fd.get(key);
      if (entry instanceof File && entry.size === 0) fd.delete(key);
    }
    // Kunci kapasitas: kirim "" bila toggle mati supaya API melepas kunci.
    const lockChecked = Boolean(
      (form.elements.namedItem("lockEnabled") as HTMLInputElement | null)?.checked
    );
    if (!lockChecked) {
      fd.set("lockedCapacity", "");
    } else if (!String(fd.get("lockedCapacity") ?? "").trim()) {
      toast.error("Isi nilai kapasitas yang dikunci, mis. 100.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(
        editing ? `/api/admin/services/${editing.id}` : "/api/admin/services",
        { method: editing ? "PATCH" : "POST", body: fd }
      );
      const parsed = ApiResponse.safeParse(await res.json().catch(() => null));
      if (!res.ok || !parsed.success || !parsed.data.ok) {
        toast.error(
          (parsed.success ? parsed.data.error : undefined) ??
            "Terjadi kesalahan. Coba lagi."
        );
        return;
      }
      toast.success(editing ? "Layanan diperbarui." : "Layanan ditambahkan.");
      setShowForm(false);
      setEditing(null);
      router.refresh();
    } catch {
      toast.error("Gagal menghubungi server.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(svc: ServiceData) {
    if (!window.confirm(`Hapus layanan "${svc.name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/services/${svc.id}`, {
        method: "DELETE",
      });
      const parsed = ApiResponse.safeParse(await res.json().catch(() => null));
      if (!res.ok || !parsed.success || !parsed.data.ok) {
        toast.error(
          (parsed.success ? parsed.data.error : undefined) ??
            "Gagal menghapus layanan."
        );
        return;
      }
      toast.success("Layanan dihapus.");
      if (editing?.id === svc.id) {
        setShowForm(false);
        setEditing(null);
      }
      router.refresh();
    } catch {
      toast.error("Gagal menghubungi server.");
    }
  }

  async function handleBestSeller(svc: ServiceData) {
    const fd = new FormData();
    fd.set("bestSeller", svc.bestSeller ? "false" : "true");
    try {
      const res = await fetch(`/api/admin/services/${svc.id}`, {
        method: "PATCH",
        body: fd,
      });
      const parsed = ApiResponse.safeParse(await res.json().catch(() => null));
      if (!res.ok || !parsed.success || !parsed.data.ok) {
        toast.error(
          (parsed.success ? parsed.data.error : undefined) ??
            "Gagal memperbarui best seller."
        );
        return;
      }
      toast.success(
        svc.bestSeller
          ? `"${svc.name}" dihapus dari best seller.`
          : `"${svc.name}" ditandai best seller.`
      );
      router.refresh();
    } catch {
      toast.error("Gagal menghubungi server.");
    }
  }

  return (
    <div className="space-y-4">
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editing ? "Edit Layanan" : "Tambah Layanan"}</CardTitle>
            <CardDescription>
              {editing
                ? `Mengubah "${editing.name}"`
                : "Layanan baru akan tampil di halaman publik."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              key={editing?.id ?? "new"}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="svc-name">Nama *</Label>
                  <Input
                    id="svc-name"
                    name="name"
                    required
                    minLength={2}
                    maxLength={60}
                    defaultValue={editing?.name ?? ""}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="svc-subtitle">Subtitle</Label>
                  <Input
                    id="svc-subtitle"
                    name="subtitle"
                    maxLength={120}
                    defaultValue={editing?.subtitle ?? ""}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="svc-description">Deskripsi</Label>
                <textarea
                  id="svc-description"
                  name="description"
                  maxLength={1000}
                  defaultValue={editing?.description ?? ""}
                  className={textareaClass}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="svc-sort">Urutan</Label>
                <Input
                  id="svc-sort"
                  name="sortOrder"
                  type="number"
                  min={-1000}
                  max={1000}
                  defaultValue={editing?.sortOrder ?? 0}
                />
              </div>
              <div className="space-y-2 rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  <input
                    id="svc-lock"
                    name="lockEnabled"
                    type="checkbox"
                    defaultChecked={editing?.lockedCapacity != null}
                    className="size-4 rounded border-input"
                  />
                  <Label htmlFor="svc-lock">Kunci kapasitas</Label>
                </div>
                <div className="flex items-stretch gap-2">
                  <Input
                    id="svc-locked-capacity"
                    name="lockedCapacity"
                    type="number"
                    min={1}
                    max={10_000_000}
                    placeholder="100"
                    defaultValue={editing?.lockedCapacity ?? ""}
                    className="w-40 tabular-nums"
                  />
                  <select
                    id="svc-locked-unit"
                    name="lockedCapacityUnit"
                    defaultValue={editing?.lockedCapacityUnit ?? "Mbps"}
                    aria-label="Satuan kapasitas kunci"
                    className="h-11 rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    {CAPACITY_UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-muted-foreground">
                  Bila aktif, pengunjung tidak bisa mengubah kapasitas layanan ini
                  di halaman publik.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="svc-active"
                  name="active"
                  type="checkbox"
                  defaultChecked={editing?.active ?? true}
                  className="size-4 rounded border-input"
                />
                <Label htmlFor="svc-active">Aktif</Label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="svc-image-preview">
                    Gambar Preview (kartu layanan)
                  </Label>
                  <Input
                    id="svc-image-preview"
                    name="imagePreview"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tampil di kartu layanan publik.
                  </p>
                  {editing?.imagePreview && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={editing.imagePreview}
                      alt={`${editing.name} — preview`}
                      className="size-16 rounded-md border object-cover"
                    />
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="svc-image-full">
                    Gambar Full (panel kanan)
                  </Label>
                  <Input
                    id="svc-image-full"
                    name="imageFull"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tampil di panel kanan halaman publik.
                  </p>
                  {editing?.imageFull && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={editing.imageFull}
                      alt={`${editing.name} — full`}
                      className="size-16 rounded-md border object-cover"
                    />
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting
                    ? "Menyimpan..."
                    : editing
                      ? "Simpan Perubahan"
                      : "Simpan"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditing(null);
                  }}
                >
                  Batal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Daftar Layanan</CardTitle>
            <CardDescription>
              {services.length} layanan terdaftar
            </CardDescription>
          </div>
          <CardAction>
            <Button
              onClick={() => {
                setEditing(null);
                setShowForm(true);
              }}
            >
              <Plus className="size-4" />
              Tambah Layanan
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Gambar</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Subtitle</TableHead>
                <TableHead>Urutan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Belum ada layanan. Klik &quot;Tambah Layanan&quot; untuk
                    membuat.
                  </TableCell>
                </TableRow>
              )}
              {services.map((svc) => {
                const thumb = svc.imagePreview ?? svc.imageFull;
                return (
                  <TableRow key={svc.id}>
                    <TableCell>
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumb}
                          alt={svc.name}
                          className="size-10 rounded-md border object-cover"
                        />
                      ) : (
                        <span className="size-10 rounded-md bg-muted-50" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{svc.name}</TableCell>
                    <TableCell className="max-w-48 truncate">
                      {svc.subtitle ?? "—"}
                    </TableCell>
                    <TableCell>{svc.sortOrder}</TableCell>
                    <TableCell>
                      {svc.active ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          Nonaktif
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          variant={svc.bestSeller ? "default" : "outline"}
                          aria-pressed={svc.bestSeller}
                          onClick={() => handleBestSeller(svc)}
                        >
                          <Star
                            className={`size-3.5 ${svc.bestSeller ? "fill-current" : ""}`}
                          />
                          Best Seller
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditing(svc);
                            setShowForm(true);
                          }}
                        >
                          <Pencil className="size-3.5" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(svc)}
                        >
                          <Trash2 className="size-3.5" />
                          Hapus
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

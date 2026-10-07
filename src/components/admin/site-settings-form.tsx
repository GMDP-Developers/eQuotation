"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { textareaClass } from "@/lib/form-classes";

const ApiResponse = z.object({
  ok: z.boolean().optional(),
  error: z.string().optional(),
});

export type SiteSettingData = {
  aboutTitle: string;
  aboutDescription: string;
  aboutImage: string | null;
  aboutBullets: string;
  aboutEnabled: boolean;
  brandName: string;
  brandSubtitle: string;
  brandLogo: string | null;
};


export function SiteSettingsForm({
  initial,
}: {
  initial: SiteSettingData | null;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [aboutEnabled, setAboutEnabled] = useState(initial?.aboutEnabled ?? true);
  const [image, setImage] = useState<string | null>(
    initial?.aboutImage ?? null
  );
  const [logo, setLogo] = useState<string | null>(
    initial?.brandLogo ?? null
  );

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const entry = fd.get("aboutImage");
    if (entry instanceof File && entry.size === 0) fd.delete("aboutImage");
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/settings", { method: "PUT", body: fd });
      const parsed = ApiResponse.safeParse(await res.json().catch(() => null));
      if (!res.ok || !parsed.success || !parsed.data.ok) {
        toast.error(
          (parsed.success ? parsed.data.error : undefined) ??
            "Terjadi kesalahan. Coba lagi."
        );
        return;
      }
      toast.success("Pengaturan halaman publik diperbarui.");
      router.refresh();
    } catch {
      toast.error("Gagal menghubungi server.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Header & Brand</CardTitle>
          <CardDescription>
            Nama, keterangan, dan logo yang tampil di semua permukaan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="brand-name">Nama Brand</Label>
            <Input
              id="brand-name"
              name="brandName"
              required
              maxLength={60}
              defaultValue={initial?.brandName ?? "eQuotation"}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="brand-subtitle">Keterangan</Label>
            <Input
              id="brand-subtitle"
              name="brandSubtitle"
              required
              maxLength={80}
              defaultValue={initial?.brandSubtitle ?? "Service Request"}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="brand-logo">Logo (opsional)</Label>
            <Input
              id="brand-logo"
              name="brandLogo"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setLogo(URL.createObjectURL(f));
              }}
            />
            <p className="text-xs text-muted-foreground">
              Kosongkan untuk memakai ikon default.
            </p>
            {logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="Preview logo" className="h-24 w-auto max-w-48 object-contain rounded-md border bg-white" />
            )}
            <div className="flex items-center gap-2">
              <input
                id="brand-logo-clear"
                name="brandLogoClear"
                type="checkbox"
                className="size-4 rounded border-input"
                onChange={(e) =>
                  setLogo(e.target.checked ? null : initial?.brandLogo ?? null)
                }
              />
              <Label htmlFor="brand-logo-clear">
                Hapus logo (pakai ikon default)
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Halaman Publik</CardTitle>
            <div className="flex items-center gap-2 text-sm font-normal">
              <input type="checkbox" name="aboutEnabled" value="on" checked={aboutEnabled} onChange={(e) => setAboutEnabled(e.target.checked)} />
              <Label className="cursor-pointer">Panel Tentang Aktif</Label>
            </div>
          </div>
          <CardDescription>
            Panel &quot;Tentang&quot; halaman publik.
          </CardDescription>
        </CardHeader>
        <CardContent className={aboutEnabled ? "" : "opacity-50"}>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="about-title">Judul</Label>
              <Input
                id="about-title"
                name="aboutTitle"
                required
                maxLength={120}
                defaultValue={initial?.aboutTitle ?? "Tentang eQuotation"}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="about-description">Deskripsi</Label>
              <textarea
                id="about-description"
                name="aboutDescription"
                required
                maxLength={1000}
                defaultValue={
                  initial?.aboutDescription ??
                  "Sistem permintaan layanan jaringan korporat. Lengkapi formulir dan tim kami akan menghubungi Anda untuk penawaran."
                }
                className={textareaClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="about-bullets">Poin daftar (satu per baris)</Label>
              <textarea
                id="about-bullets"
                name="aboutBullets"
                maxLength={2000}
                defaultValue={
                  initial?.aboutBullets ??
                  "Penawaran sesuai kebutuhan kapasitas\nRespons cepat via WhatsApp"
                }
                className={textareaClass}
              />
              <p className="text-xs text-muted-foreground">
                Baris pertama daftar layanan (nama layanan aktif) tampil
                otomatis di atas poin-poin ini.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="about-image">Gambar (opsional)</Label>
              <Input
                id="about-image"
                name="aboutImage"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setImage(URL.createObjectURL(f));
                }}
              />
              <p className="text-xs text-muted-foreground">
                Kosongkan untuk memakai gambar preview layanan pertama.
              </p>
              {image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image}
                  alt="Preview panel tentang"
                  className="size-24 rounded-md border object-cover"
                />
              )}
            </div>
          </div>
        </CardContent>
        <div className="p-6 pt-0">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Menyimpan..." : "Simpan Pengaturan"}
          </Button>
        </div>
      </Card>
    </form>
  );
}

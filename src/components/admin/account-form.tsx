"use client";

import { useState, type FormEvent } from "react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ApiResponse = z.object({
  ok: z.boolean().optional(),
  error: z.string().optional(),
});

function parseError(raw: unknown): string | undefined {
  if (raw && typeof raw === "object" && "error" in raw) {
    const v = raw.error;
    if (typeof v === "string") return v;
  }
  return undefined;
}

export function AccountForm({ initialUsername }: { initialUsername: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [username, setUsername] = useState(initialUsername);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const currentPassword = String(fd.get("currentPassword") ?? "");
    const newUsername = String(fd.get("newUsername") ?? "").trim();
    const newPassword = String(fd.get("newPassword") ?? "");
    const confirmPassword = String(fd.get("confirmPassword") ?? "");

    if (!currentPassword) {
      toast.error("Password saat ini wajib diisi");
      return;
    }
    if (!newUsername && !newPassword) {
      toast.error("Isi username baru atau password baru");
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      toast.error("Konfirmasi password tidak cocok");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newUsername, newPassword, confirmPassword }),
      });
      const parsed = ApiResponse.safeParse(await res.json().catch(() => null));
      if (!res.ok || !parsed.success || !parsed.data.ok) {
        const msg =
          (parsed.success ? parseError(parsed.data) : undefined) ?? "Gagal memperbarui akun";
        toast.error(msg);
        return;
      }
      const changedUser = newUsername && newUsername !== initialUsername;
      toast.success(changedUser ? "Username diperbarui — silakan login ulang" : "Password diperbarui — silakan login ulang");
      if (changedUser) setUsername(newUsername);
      // Force re-auth so JWT picks up new username/password
      setTimeout(() => signOut({ callbackUrl: "/login" }), 900);
    } catch {
      toast.error("Gagal menghubungi server");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Akun Admin</CardTitle>
          <CardDescription>Username saat ini: {username} — ganti username dan/atau password. Wajib masukkan password saat ini.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">Password saat ini *</Label>
            <Input id="currentPassword" name="currentPassword" type="password" required autoComplete="current-password" maxLength={72} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newUsername">Username baru (kosongkan jika tidak ganti)</Label>
            <Input id="newUsername" name="newUsername" placeholder={initialUsername} maxLength={32} autoComplete="username" />
            <p className="text-xs text-muted-foreground">3–32 karakter, huruf/angka/-/_ — harus unik.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">Password baru (kosongkan jika tidak ganti)</Label>
            <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" maxLength={72} />
            <p className="text-xs text-muted-foreground">Minimal 8 karakter.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Konfirmasi password baru</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" maxLength={72} />
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
          <p className="text-xs text-muted-foreground">Setelah berhasil, Anda akan dialihkan ke login untuk masuk dengan kredensial baru.</p>
        </CardContent>
      </Card>
    </form>
  );
}

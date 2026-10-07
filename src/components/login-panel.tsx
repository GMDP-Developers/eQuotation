"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { ArrowRight, Check, Loader2, LockKeyhole, Network } from "lucide-react";
import { toast } from "sonner";

import { BrandLogo } from "@/components/brand-logo";
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

const inputClass = "h-11 rounded-lg border-input bg-background md:text-sm";

const PERKS = [
  "Lihat semua permintaan layanan",
  "Filter cepat per jenis layanan",
  "Export data ke Excel",
];

export function LoginPanel({
  brandName,
  brandSubtitle,
  brandLogo,
}: {
  brandName: string;
  brandSubtitle: string;
  brandLogo: string | null;
}) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!username.trim() || !password) {
      toast.error("Isi username dan password", {
        description: "Kedua kolom wajib diisi.",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });
      if (res?.error) {
        toast.error("Login gagal", {
          description: "Username atau password salah.",
        });
        return;
      }
      toast.success("Login berhasil", { description: "Membuka dashboard..." });
      router.push("/admin/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-hero-wash grid min-h-screen lg:grid-cols-2">
      {/* Panel brand (desktop) */}
      <aside className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-start via-primary to-brand-end"
        />
        <div
          aria-hidden
          className="absolute -top-24 -right-24 size-80 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute bottom-0 -left-20 size-72 rounded-full bg-black/15 blur-3xl"
        />

        <div className="flex items-center gap-3">
          <BrandLogo src={brandLogo} className="h-11 w-auto max-w-40 object-contain">
            <span className="flex size-11 items-center justify-center rounded-xl bg-white/15 text-white shadow-lg ring-1 ring-white/25">
              <Network className="size-5" />
            </span>
          </BrandLogo>
          <div>
            <p className="text-lg font-bold text-white">{brandName}</p>
            <p className="text-sm text-white/75">{brandSubtitle}</p>
          </div>
        </div>

        <div className="max-w-md">
          <h1 className="text-3xl leading-tight font-semibold text-white xl:text-4xl">
            Kelola permintaan layanan jaringan dalam satu panel.
          </h1>
          <ul className="mt-8 space-y-3">
            {PERKS.map((perk) => (
              <li
                key={perk}
                className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-sm text-white ring-1 ring-white/15"
              >
                <span className="flex size-6 items-center justify-center rounded-full bg-white/20">
                  <Check className="size-3.5 text-white" strokeWidth={3} />
                </span>
                {perk}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-white/60">
          © {new Date().getFullYear()} {brandName} · Internal use only
        </p>
      </aside>

      {/* Form */}
      <main className="flex items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          {/* brand mobile */}
          <div className="mb-8 flex items-center justify-center gap-2.5 lg:hidden">
            <BrandLogo src={brandLogo} className="h-10 w-auto max-w-36 object-contain">
              <span className="text-brand-gradient flex size-10 items-center justify-center rounded-xl text-primary-foreground shadow-md">
                <Network className="size-5" />
              </span>
            </BrandLogo>
            <div>
              <p className="text-sm font-semibold tracking-tight">
                {brandName}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {brandSubtitle}
              </p>
            </div>
          </div>

          <Card className="gap-1 rounded-2xl border-border/80 py-0 shadow-xl shadow-primary/5">
            <CardHeader className="gap-1 border-b px-6 pt-6 pb-5">
              <CardTitle className="flex items-center gap-2 text-xl tracking-tight">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <LockKeyhole className="size-4" />
                </span>
                Login
              </CardTitle>
              <CardDescription>
                Masuk untuk mengelola permintaan layanan
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 py-6">
              <form onSubmit={onSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="username" className="text-[13px]">
                    Username
                  </Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    autoComplete="username"
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="password" className="text-[13px]">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={inputClass}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="btn-brand mt-1 h-11 w-full rounded-lg text-sm text-white"
                >
                  {loading && <Loader2 className="size-4 animate-spin" />}
                  Masuk
                  {!loading && <ArrowRight className="size-4" />}
                </Button>
              </form>

            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

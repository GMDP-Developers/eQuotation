"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-[340px]">
        <div className="mb-8 text-center">
          <div className="mb-3 flex justify-center">
            <BrandLogo src={brandLogo} className="h-7 w-auto max-w-32 object-contain">
              <span className="flex size-7 items-center justify-center rounded-md bg-foreground text-[10px] font-bold tracking-widest text-background">
                EQ
              </span>
            </BrandLogo>
          </div>
          <h1 className="text-sm font-medium tracking-tight">{brandName}</h1>
          <p className="mt-1 text-xs text-muted-foreground">{brandSubtitle}</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username" className="text-xs font-normal text-muted-foreground">
              Username
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              autoComplete="username"
              className="h-9 bg-background"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-normal text-muted-foreground">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="h-9 bg-background"
            />
          </div>
          <Button type="submit" disabled={loading} className="mt-2 h-9 w-full rounded-md text-sm font-medium">
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Masuk"}
          </Button>
        </form>

        <p className="mt-10 text-center text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} {brandName}
        </p>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { Laptop, LogOut, MonitorSmartphone, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type SessionRow = {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  lastActive: string;
  expiresAt: string;
};

const GetResponse = z.object({
  sessions: z.array(
    z.object({
      id: z.string(),
      ipAddress: z.string().nullable(),
      userAgent: z.string().nullable(),
      createdAt: z.string(),
      lastActive: z.string(),
      expiresAt: z.string(),
    })
  ),
  currentSid: z.string().nullable(),
});

const DeleteResponse = z.object({
  ok: z.boolean().optional(),
  currentRevoked: z.boolean().optional(),
  deleted: z.number().optional(),
  error: z.string().optional(),
});

export function SessionList() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [currentSid, setCurrentSid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sessions", { cache: "no-store" });
      const json: unknown = await res.json().catch(() => null);
      const parsed = GetResponse.safeParse(json);
      if (!res.ok || !parsed.success) {
        const rawErr =
          json && typeof json === "object" && "error" in json
            ? (json as { error?: unknown }).error
            : undefined;
        const msg = typeof rawErr === "string" ? rawErr : "Gagal memuat sesi";
        toast.error(msg);
        return;
      }
      setSessions(parsed.data.sessions);
      setCurrentSid(parsed.data.currentSid);
    } catch {
      toast.error("Gagal menghubungi server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function revokeOne(id: string) {
    const isCurrent = id === currentSid;
    if (isCurrent && !window.confirm("Akhiri sesi saat ini? Anda akan logout.")) return;
    if (!isCurrent && !window.confirm("Akhiri sesi ini? Perangkat tersebut akan logout.")) return;
    setRevoking(id);
    try {
      const res = await fetch("/api/admin/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json: unknown = await res.json().catch(() => null);
      const parsed = DeleteResponse.safeParse(json);
      if (!res.ok || !parsed.success || !parsed.data.ok) {
        const msg =
          parsed.success && typeof parsed.data.error === "string" ? parsed.data.error : "Gagal mengakhiri sesi";
        toast.error(msg);
        return;
      }
      if (parsed.data.currentRevoked) {
        toast.success("Sesi saat ini diakhiri — mengalihkan ke login");
        setTimeout(() => signOut({ callbackUrl: "/login" }), 700);
        return;
      }
      toast.success("Sesi diakhiri");
      await load();
    } catch {
      toast.error("Gagal menghubungi server");
    } finally {
      setRevoking(null);
    }
  }

  async function revokeOthers() {
    if (!window.confirm("Akhiri semua sesi lain? Perangkat lain akan logout.")) return;
    setRevoking("__others");
    try {
      const res = await fetch("/api/admin/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allOthers: true }),
      });
      const json: unknown = await res.json().catch(() => null);
      const parsed = DeleteResponse.safeParse(json);
      if (!res.ok || !parsed.success || !parsed.data.ok) {
        const msg =
          parsed.success && typeof parsed.data.error === "string" ? parsed.data.error : "Gagal mengakhiri sesi";
        toast.error(msg);
        return;
      }
      toast.success(`${parsed.data.deleted ?? 0} sesi lain diakhiri`);
      await load();
    } catch {
      toast.error("Gagal menghubungi server");
    } finally {
      setRevoking(null);
    }
  }

  const othersCount = currentSid ? sessions.filter((s) => s.id !== currentSid).length : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MonitorSmartphone className="size-4 text-muted-foreground" />
              Sesi aktif
            </CardTitle>
            <CardDescription>
              Semua perangkat yang sedang login dengan akun ini. Sesi saat ini ditandai — akhiri sesi yang tidak
              dikenal.
            </CardDescription>
          </div>
          {othersCount > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={revokeOthers}
              disabled={revoking === "__others" || loading}
              className="shrink-0"
            >
              {revoking === "__others" ? (
                "Memproses..."
              ) : (
                <>
                  <ShieldAlert className="size-4" />
                  Akhiri lainnya
                </>
              )}
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Memuat sesi...</p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tidak ada sesi aktif.</p>
        ) : (
          <ul className="space-y-3">
            {sessions.map((s) => {
              const isCurrent = s.id === currentSid;
              const ua = s.userAgent;
              const lower = (ua ?? "").toLowerCase();
              const browser = lower.includes("edg/")
                ? "Edge"
                : lower.includes("chrome")
                  ? "Chrome"
                  : lower.includes("firefox")
                    ? "Firefox"
                    : lower.includes("safari") && !lower.includes("chrome")
                      ? "Safari"
                      : "Browser";
              let os = "";
              if (lower.includes("windows")) os = "Windows";
              else if (lower.includes("mac os")) os = "macOS";
              else if (lower.includes("android")) os = "Android";
              else if (lower.includes("iphone") || lower.includes("ipad")) os = "iOS";
              else if (lower.includes("linux")) os = "Linux";
              const mobile = lower.includes("mobile") || lower.includes("android") || lower.includes("iphone");
              const label = ua
                ? `${browser}${os ? ` · ${os}` : ""}${mobile ? " · Mobile" : ""}`
                : "Perangkat tidak dikenal";
              const detail = ua ? ua.slice(0, 120) : "-";

              return (
                <li
                  key={s.id}
                  className={`flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between ${isCurrent ? "border-primary/30 bg-primary/[0.04]" : "border-border bg-card"}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                        {label.includes("Mobile") ? (
                          <MonitorSmartphone className="size-4 text-muted-foreground" />
                        ) : (
                          <Laptop className="size-4 text-muted-foreground" />
                        )}
                        {label}
                      </span>
                      {isCurrent ? (
                        <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
                          Sesi ini
                        </span>
                      ) : null}
                      <span className="text-xs text-muted-foreground">{s.ipAddress ?? "-"}</span>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground" title={s.userAgent ?? undefined}>
                      {detail}
                    </p>
                    <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        Masuk: {new Date(s.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                      <span>
                        Aktif: {new Date(s.lastActive).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                      <span>
                        Kedaluwarsa: {new Date(s.expiresAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                    </p>
                  </div>
                  <Button
                    variant={isCurrent ? "outline" : "ghost"}
                    size="sm"
                    onClick={() => revokeOne(s.id)}
                    disabled={revoking === s.id}
                    className={isCurrent ? "shrink-0" : "shrink-0 text-destructive hover:text-destructive"}
                  >
                    {revoking === s.id ? (
                      "Memproses..."
                    ) : isCurrent ? (
                      <>
                        <LogOut className="size-4" />
                        Logout sesi ini
                      </>
                    ) : (
                      <>
                        <Trash2 className="size-4" />
                        Akhiri
                      </>
                    )}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Tips: ganti password akan mengakhiri sesi lain otomatis — gunakan &quot;Akhiri lainnya&quot; untuk logout manual.
        </p>
      </CardContent>
    </Card>
  );
}

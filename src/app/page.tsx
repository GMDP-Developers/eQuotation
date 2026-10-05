import { ArrowRight, Network } from "lucide-react";

import { ServiceRequestForm } from "@/components/service-request-form";
import { prisma } from "@/lib/db";
import type { PublicAbout, PublicService } from "@/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const rows = await prisma.service.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
  const services: PublicService[] = rows.map((s) => ({
    id: s.id,
    name: s.name,
    subtitle: s.subtitle,
    description: s.description,
    imagePreview: s.imagePreview,
    imageFull: s.imageFull,
    sortOrder: s.sortOrder,
    active: s.active,
  }));

  const setting = await prisma.siteSetting.findUnique({
    where: { id: "singleton" },
  });

  const brandName = setting?.brandName ?? "eQuotation";
  const brandSubtitle = setting?.brandSubtitle ?? "Service Request";
  const brandLogo = setting?.brandLogo ?? null;
  const about: PublicAbout = {
    title: setting?.aboutTitle ?? "Tentang eQuotation",
    description:
      setting?.aboutDescription ??
      "Sistem permintaan layanan jaringan korporat. Lengkapi formulir dan tim kami akan menghubungi Anda untuk penawaran.",
    image: setting?.aboutImage ?? null,
    bullets: setting
      ? setting.aboutBullets
          .split("\n")
          .map((b) => b.trim())
          .filter(Boolean)
      : ["Penawaran sesuai kebutuhan kapasitas", "Respons cepat via WhatsApp"],
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── Thin accent line at very top ── */}
      <div className="h-0.5 bg-primary" aria-hidden />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card">
        <div className="mx-auto flex w-full items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-2.5">
            {brandLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={brandLogo}
                alt=""
                className="size-9 rounded-lg object-cover"
              />
            ) : (
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Network className="size-4" />
              </span>
            )}
            <div>
              <p className="text-sm font-semibold tracking-tight text-foreground">
                {brandName}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {brandSubtitle}
              </p>
            </div>
          </div>
          <a
            href="/login"
            className="group inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-2 text-[13px] font-medium text-foreground transition-colors hover:border-foreground/25 hover:bg-muted"
          >
            Admin Login
            <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto w-full bg-gradient-to-b from-primary/[0.04] to-background px-5 pt-6 pb-3 sm:px-8 sm:pt-8 sm:pb-4">
        <div className="relative">
          <h1 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Permintaan Layanan Jaringan
          </h1>

          <div className="mt-2 h-0.5 w-16 bg-primary" aria-hidden />

          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
            Lengkapi informasi berikut untuk mendapatkan penawaran layanan
            sesuai kebutuhan kapasitas perusahaan Anda.
          </p>
        </div>
      </section>

      {/* Form */}
      <main className="mx-auto w-full flex-1 px-5 pb-16 sm:px-8">
        <ServiceRequestForm services={services} about={about} />
      </main>

      <footer className="border-t border-border bg-muted/60">
        <div className="mx-auto flex w-full px-5 py-6 sm:px-8">
          <p className="text-[12px] text-muted-foreground">
            © {new Date().getFullYear()} {brandName} — {brandSubtitle}
          </p>
        </div>
      </footer>
    </div>
  );
}
import { ArrowRight, Network } from "lucide-react";

import { ServiceRequestForm } from "@/components/service-request-form";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── Thin accent line at very top ── */}
      <div className="h-0.5 bg-primary" aria-hidden />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card">
        <div className="mx-auto flex w-full items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Network className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold tracking-tight text-foreground">
                eQuotation
              </p>
              <p className="text-[11px] text-muted-foreground">
                Service Request
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
        <ServiceRequestForm />
      </main>

      <footer className="border-t border-border bg-muted/60">
        <div className="mx-auto flex w-full px-5 py-6 sm:px-8">
          <p className="text-[12px] text-muted-foreground">
            © {new Date().getFullYear()} eQuotation — Permintaan Layanan
            Jaringan
          </p>
        </div>
      </footer>
    </div>
  );
}
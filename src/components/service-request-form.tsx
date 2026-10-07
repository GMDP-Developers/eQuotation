"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, CheckCircle2, Loader2, Lock, PackageSearch, RotateCcw, Send } from "lucide-react";
import { toast } from "sonner";

import { CAPACITY_UNITS, serviceRequestSchema, type PublicAbout, type PublicService, type ServiceRequestInput, type CapacityUnit } from "@/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CableMap } from "@/components/cable-map";
import { cn } from "@/lib/utils";


type Recap = {
  title: string;
  capacity: number;
  unit: string;
};
const inputClass = "h-11 rounded-lg border-input bg-background md:text-sm";
const cardShell = "overflow-hidden rounded-lg border border-border bg-card shadow-sm";
const FALLBACK_SERVICE_LABEL = "ULO \u00b7 Tier One \u00b7 Intermix \u00b7 Supermix";
const easeSpring = "ease-[var(--ease-spring)]";

// ponytail: 8 flat muted desaturated; tambah entri bila layanan > 8 (modulo). Upgrade: ganti ke token brand bila palet final.
const SERVICE_CHIP_PALETTE = [
  { idle: "border-[#e8e0d6] bg-[#fdfcfa] text-[#6b5f55] hover:border-[#d6c8b8] hover:bg-[#faf6f1]", sel: "border-[#8c7d6b] bg-[#8c7d6b] text-white shadow-sm" },
  { idle: "border-[#dde3dc] bg-[#f8faf8] text-[#5a665e] hover:border-[#c8d1c6] hover:bg-[#f0f4f0]", sel: "border-[#7a8a7e] bg-[#7a8a7e] text-white shadow-sm" },
  { idle: "border-[#dee3e8] bg-[#f8f9fa] text-[#5a6570] hover:border-[#c9d1d9] hover:bg-[#f0f2f4]", sel: "border-[#6b7a89] bg-[#6b7a89] text-white shadow-sm" },
  { idle: "border-[#ecdcd5] bg-[#fdf9f7] text-[#7a5f55] hover:border-[#dec8bc] hover:bg-[#faf0ec]", sel: "border-[#9a7b6e] bg-[#9a7b6e] text-white shadow-sm" },
  { idle: "border-[#e6e2dd] bg-[#fcfbfa] text-[#6b6560] hover:border-[#d6d0c8] hover:bg-[#f7f5f3]", sel: "border-[#8a837c] bg-[#8a837c] text-white shadow-sm" },
  { idle: "border-[#e6dde2] bg-[#fcf8fb] text-[#6e5e68] hover:border-[#d6c8d1] hover:bg-[#f7f0f4]", sel: "border-[#8a7581] bg-[#8a7581] text-white shadow-sm" },
  { idle: "border-[#e0e3d6] bg-[#f9faf7] text-[#62665a] hover:border-[#cdd1c2] hover:bg-[#f0f2ec]", sel: "border-[#7d8471] bg-[#7d8471] text-white shadow-sm" },
  { idle: "border-[#e2e2e2] bg-[#fafafa] text-[#5a5a5a] hover:border-[#d1d1d1] hover:bg-[#f0f0f0]", sel: "border-[#4a4a4a] bg-[#4a4a4a] text-white shadow-sm" },
] as const;
/** Gambar layanan; fallback blok polos bila file belum ada. */
function ServiceImage({
  src,
  alt,
  className = "",
  fit = "cover",
}: {
  src: string | null;
  alt: string;
  className?: string;
  fit?: "cover" | "contain" | "natural";
}) {
  const [failed, setFailed] = useState(false);
  const isPng = /\.png($|\?)/i.test(src ?? "");

  if (fit === "natural") {
    return src && !failed ? (
      <Image src={src} alt={alt} width={1600} height={1200} unoptimized className={`h-auto w-full${isPng ? " bg-white" : ""}`} onError={() => setFailed(true)} />
    ) : (
      <div className="flex aspect-[4/3] w-full items-center justify-center bg-muted/60" />
    );
  }

  return (
    <div className={cn("relative h-full w-full overflow-hidden", isPng && "bg-white", className)}>
      {src && !failed ? (
        <Image src={src} alt={alt} fill unoptimized className={fit === "contain" ? "object-contain" : "object-cover"} onError={() => setFailed(true)} />
      ) : (
        <div className="flex size-full items-center justify-center bg-muted/60" />
      )}
    </div>
  );
}

function InfoAside({
  services,
  about,
}: {
  services: PublicService[];
  about: PublicAbout;
}) {
  const preview = services[0];
  const serviceNamesLabel = services.map((s) => s.name).join(" \u00b7 ") || FALLBACK_SERVICE_LABEL;
  return (
    <div className={cardShell}>
      <div className="mx-[10%] w-[80%]">
        <ServiceImage src={about.image ?? preview?.imagePreview ?? null} alt={about.title} fit="natural" />
      </div>
      <div className="flex flex-col gap-2 p-5">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          {about.title}
        </h3>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          {about.description}
        </p>
        <ul className="mt-2 flex flex-col gap-1.5 text-[13px] text-foreground/80">
          {[serviceNamesLabel, ...about.bullets].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <Check
                className="mt-0.5 size-3.5 shrink-0 text-primary"
                strokeWidth={2.5}
              />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ServiceDetailPlaceholder() {
  return (
    <div className={cn(cardShell, "animate-slide-fade")}>
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <PackageSearch className="size-5 text-muted-foreground" strokeWidth={1.75} />
        </div>
        <div className="space-y-1.5">
          <p className="text-sm font-medium tracking-tight text-foreground">
            Pilih Produk untuk Melihat Detailnya
          </p>
          <p className="mx-auto max-w-[30ch] text-[13px] leading-relaxed text-muted-foreground">
            Silakan pilih salah satu layanan pada formulir. Informasi lengkap
            produk akan ditampilkan di panel ini.
          </p>
        </div>
        <div aria-hidden className="mt-1 h-px w-10 bg-border" />
      </div>
    </div>
  );
}

function SelectedServiceInfo({ service }: { service: PublicService }) {
  return (
    <div className={cardShell}>
      <div className="relative mx-[10%] aspect-[16/10] w-[80%] bg-muted/50">
        <ServiceImage
          src={service.imageFull ?? service.imagePreview}
          alt={service.name}
          fit="contain"
        />
      </div>
      <div className="flex flex-col gap-2 p-5">
        <span className="w-fit rounded-md bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
          Anda memilih
        </span>
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          {service.name}
        </h3>
        <p className="text-[12px] font-medium text-muted-foreground">
          {service.subtitle}
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          {service.description}
        </p>
      </div>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[12px] font-medium text-destructive">{message}</p>;
}

function SectionTitle({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <h2 className="text-[13px] font-medium text-foreground">
        {children}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </h2>
      <span aria-hidden className="h-px flex-1 bg-border" />
    </div>
  );
}

function Field({
  id,
  label,
  error,
  className,
  required,
  ...props
}: {
  id: string;
  label: string;
  error?: string;
  className?: string;
  required?: boolean;
} & React.ComponentProps<typeof Input>) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-[13px]">
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </Label>
      <Input id={id} required={required} className={className ?? inputClass} {...props} />
      <FieldError message={error} />
    </div>
  );
}

export function ServiceRequestForm({
  services,
  about,
}: {
  services: PublicService[];
  about: PublicAbout | null;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [recap, setRecap] = useState<Recap | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ServiceRequestInput>({
    resolver: zodResolver(serviceRequestSchema),
    defaultValues: {
      companyName: "",
      contactName: "",
      position: "",
      phone: "",
      email: "",
      serviceType: undefined,
      capacity: undefined,
      capacityUnit: "Mbps",
      notes: "",
      website: "",
    },
  });

  const serviceType = watch("serviceType");
  const capacityUnit = watch("capacityUnit");
  const selectedService = services.find((s) => s.name === serviceType);

  const lockedCapacity = selectedService?.lockedCapacity ?? null;
  const lockedUnit = selectedService?.lockedCapacityUnit ?? "Mbps";

  useEffect(() => {
    if (lockedCapacity == null) return;
    setValue("capacity", lockedCapacity, { shouldValidate: true });
    setValue("capacityUnit", lockedUnit, { shouldValidate: true });
  }, [lockedCapacity, lockedUnit, setValue]);

  async function onSubmit(values: ServiceRequestInput) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok) {
        toast.error("Gagal mengirim permintaan", {
          description: data.error ?? "Terjadi kesalahan. Coba lagi.",
        });
        return;
      }

      const svc = services.find((s) => s.name === values.serviceType);
      setRecap({
        title: svc?.name ?? String(values.serviceType),
        capacity: Number(values.capacity),
        unit: values.capacityUnit,
      });

      toast.success("Permintaan terkirim", {
        description:
          "Terima kasih. Tim kami akan menghubungi Anda via WhatsApp.",
        duration: 5000,
      });
      reset();
      setSuccess(true);
    } catch {
      toast.error("Gagal mengirim permintaan", {
        description: "Periksa koneksi Anda lalu coba lagi.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    reset();
    setRecap(null);
    setSuccess(false);
  }

  if (success) {
    return (
      <div className="mx-auto max-w-lg">
        <div className={cardShell}>
          <div aria-hidden className="h-1 w-full bg-primary" />
          <div className="px-8 py-14 text-center">
            <span className="animate-eq-pop mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="size-7" />
            </span>

            <h2 className="mt-6 text-2xl font-semibold tracking-tight">
              Permintaan terkirim
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
              Terima kasih. Tim kami akan menghubungi Anda via WhatsApp.
            </p>

            {recap ? (
              <div className="mx-auto mt-7 max-w-xs rounded-lg border border-border bg-muted/40 px-5 py-4 text-left">
                <p className="text-[11px] font-medium text-muted-foreground">
                  Ringkasan
                </p>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Layanan</span>
                  <span className="font-semibold">{recap.title}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Kapasitas</span>
                  <span className="font-semibold tabular-nums">
                    {recap.capacity.toLocaleString("id-ID")} {recap.unit}
                  </span>
                </div>
              </div>
            ) : null}

            <Button
              variant="outline"
              className="mt-8 h-11 rounded-lg"
              onClick={resetForm}
            >
              <RotateCcw className="size-4" />
              Buat permintaan lain
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const form = (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-8"
      noValidate
    >
      <div
        aria-hidden
        className="absolute left-0 top-0 h-0 w-0 overflow-hidden opacity-0 pointer-events-none"
      >
        <label htmlFor="website">Website</label>
        <input
          id="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register("website")}
        />
      </div>

      <section className="reveal-up flex flex-col gap-4">
        <SectionTitle required>Data Perusahaan</SectionTitle>
        <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
          <Field
            id="companyName"
            label="Nama Perusahaan"
            placeholder="PT Contoh Jaya"
            error={errors.companyName?.message}
            required
            {...register("companyName")}
          />
          <Field
            id="contactName"
            label="Nama Kontak"
            placeholder="Budi Santoso"
            error={errors.contactName?.message}
            required
            {...register("contactName")}
          />
          <Field
            id="position"
            label="Jabatan"
            placeholder="IT Manager"
            error={errors.position?.message}
            required
            {...register("position")}
          />
          <Field
            id="phone"
            label="Nomor Telepon / WhatsApp"
            placeholder="0812xxxxxxx"
            error={errors.phone?.message}
            required
            {...register("phone")}
          />
          <div className="sm:col-span-2">
            <Field
              id="email"
              label="Email"
              type="email"
              placeholder="nama@perusahaan.co.id"
              error={errors.email?.message}
              required
              {...register("email")}
            />
          </div>
        </div>
      </section>

      <section className="reveal-up reveal-delay-1 flex flex-col gap-4">
        <SectionTitle required>Pilih Layanan</SectionTitle>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Pilihan layanan">
          {services.map((svc, idx) => {
            const selected = serviceType === svc.name;
            const pal = SERVICE_CHIP_PALETTE[idx % SERVICE_CHIP_PALETTE.length];
            return (
              <button
                key={svc.id}
                type="button"
                role="radio"
                aria-checked={selected}
                data-selected={selected}
                onClick={() =>
                  setValue("serviceType", svc.name, {
                    shouldValidate: true,
                  })
                }
                className={cn(
                  "relative flex min-h-[42px] items-center justify-center rounded-xl border px-3 py-2.5 text-center text-[13px] font-medium leading-tight shadow-sm transition-all duration-200 hover:-translate-y-px hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10",
                  selected ? pal.sel : pal.idle
                )}
              >
                <span className="line-clamp-2">{svc.name}</span>
                {selected ? (
                  <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-white/25">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        <FieldError message={errors.serviceType?.message} />
      </section>

      <section className="reveal-up reveal-delay-2 flex flex-col gap-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:gap-8">
          <div className="flex flex-col gap-2.5">
            <SectionTitle required>Kapasitas</SectionTitle>
            {lockedCapacity != null ? (
              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                <Lock className="size-3" />
                Fixed {lockedCapacity.toLocaleString("id-ID")} {lockedUnit}
              </span>
            ) : null}
            <div className="flex items-stretch">
              <Input
                id="capacity"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                placeholder="100"
                readOnly={lockedCapacity != null}
                aria-readonly={lockedCapacity != null}
                className={cn(inputClass, "w-full rounded-r-none text-center tabular-nums sm:w-40", lockedCapacity != null && "cursor-not-allowed bg-muted/50 text-muted-foreground")}
                {...register("capacity")}
              />
              <div
                className="flex h-11 items-center rounded-r-lg border border-l-0 border-input bg-muted/50 p-0.5"
                role="radiogroup"
                aria-label="Satuan kapasitas"
              >
                {CAPACITY_UNITS.map((unit: CapacityUnit) => {
                  const active = capacityUnit === unit;
                  return (
                    <button
                      key={unit}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      disabled={lockedCapacity != null}
                      onClick={() =>
                        setValue("capacityUnit", unit, {
                          shouldValidate: true,
                        })
                      }
                      className={cn(
                        "h-full rounded-md px-3.5 text-[13px] font-medium transition-colors",
                        active ? "btn-brand text-white" : "text-muted-foreground hover:text-foreground",
                        lockedCapacity != null && !active && "cursor-not-allowed opacity-60"
                      )}
                    >
                      {unit}
                    </button>
                  );
                })}
              </div>
            </div>
            {lockedCapacity != null ? (
              <p className="text-[12px] text-muted-foreground">
                Kapasitas ditetapkan penyedia layanan dan tidak bisa diubah.
              </p>
            ) : null}
            <FieldError message={errors.capacity?.message} />
            <FieldError message={errors.capacityUnit?.message} />
          </div>

          <div className="flex flex-1 flex-col gap-2.5">
            <SectionTitle required>Catatan Tambahan</SectionTitle>
            <textarea
              id="notes"
              rows={3}
              required
              placeholder="Kebutuhan spesifik, lokasi instalasi, target waktu…"
              className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2.5 text-[14px] transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:text-sm"
              {...register("notes")}
            />
            <FieldError message={errors.notes?.message} />
          </div>
        </div>
      </section>

      <div className="reveal-up reveal-delay-3 flex flex-col gap-3 border-t border-border pt-7">
        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="btn-brand h-12 w-full max-w-xs rounded-lg text-sm font-medium text-white active:scale-[0.98]"
        >
          {submitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          Kirim Permintaan
        </Button>
        <p className="text-[12px] text-muted-foreground">
          Kolom bertanda <span className="text-destructive">*</span> wajib
          diisi.
        </p>
      </div>
    </form>
  );


  const hasSelection = !!serviceType;

  return (
    <div className="flex flex-col gap-6">
      <div className="reveal-up reveal-delay-2">
        <CableMap />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start lg:gap-8">
        <div className={cn(cardShell, "reveal-up reveal-delay-3 order-1 min-w-0")}>
          <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" aria-hidden />
          <div className="p-5 sm:p-7">{form}</div>
        </div>
        <aside className="reveal-up reveal-delay-4 order-2 flex flex-col gap-6 lg:sticky lg:top-24">
          {about && (
            <div
              className={cn(
                `transition-transform duration-700 ${easeSpring} will-change-transform`,
                hasSelection ? "-translate-y-1" : "translate-y-0"
              )}
            >
              <InfoAside services={services} about={about} />
            </div>
          )}

          {selectedService ? (
            <div key={selectedService.id} className="animate-slide-fade">
              <SelectedServiceInfo service={selectedService} />
            </div>
          ) : (
            <ServiceDetailPlaceholder />
          )}
        </aside>
      </div>
    </div>
  );
}
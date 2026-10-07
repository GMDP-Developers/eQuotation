"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  CheckCircle2,
  Loader2,
  Lock,
  RotateCcw,
  Send,
  Star,
} from "lucide-react";
import { toast } from "sonner";

import {
  CAPACITY_UNITS,
  serviceRequestSchema,
  type PublicAbout,
  type PublicService,
  type ServiceRequestInput,
  type CapacityUnit,
} from "@/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CableMap } from "@/components/cable-map";


type Recap = {
  title: string;
  capacity: number;
  unit: string;
};

const inputClass = "h-11 rounded-lg border-input bg-background md:text-sm";

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
  // PNG bisa transparan — beri latar putih otomatis agar tidak tembus warna container
  const isPng = /\.png($|\?)/i.test(src ?? "");

  // Gambar layanan = diagram padat & sudah dioptimalkan saat upload; biarkan Next
  // menyajikan file aslinya (tanpa resize/kompresi ulang) supaya tetap tajam.
  if (fit === "natural") {
    // width/height sekadar placeholder rasio; h-auto pakai rasio asli gambar
    return src && !failed ? (
      <Image
        src={src}
        alt={alt}
        width={1600}
        height={1200}
        unoptimized
        className={`h-auto w-full${isPng ? " bg-white" : ""}`}
        onError={() => setFailed(true)}
      />
    ) : (
      <div className="flex aspect-[4/3] w-full items-center justify-center bg-muted/60" />
    );
  }

  return (
    <div
      className={["relative h-full w-full overflow-hidden", isPng ? "bg-white" : "", className].join(" ")}
    >
      {src && !failed ? (
        <Image
          src={src}
          alt={alt}
          fill
          unoptimized
          className={fit === "contain" ? "object-contain" : "object-cover"}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex size-full items-center justify-center bg-muted/60" />
      )}
    </div>
  );
}

/** Panel kanan default (konten dari setting about) — tampil di atas info layanan terpilih. */
function InfoAside({
  services,
  about,
}: {
  services: PublicService[];
  about: PublicAbout;
}) {
  const preview = services[0];

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      {/* Preview gambar layanan pertama (bukan ikon) */}
      {/* Gambar — 80% lebar panel, sisa 10% kiri-kanan */}
      <div className="mx-[10%] w-[80%]">
        <ServiceImage
          src={about.image ?? preview?.imagePreview ?? null}
          alt={about.title}
          fit="natural"
        />
      </div>
      <div className="flex flex-col gap-2 p-5">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          {about.title}
        </h3>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          {about.description}
        </p>
        <ul className="mt-2 flex flex-col gap-1.5 text-[13px] text-foreground/80">
          {[
            services.length
              ? services.map((s) => s.name).join(" · ")
              : "ULO · Tier One · Intermix · Supermix",
            ...about.bullets,
          ].map((item) => (
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

/** Kartu info layanan terpilih — tampil di bawah panel default saat ada pilihan. */
function SelectedServiceInfo({ service }: { service: PublicService }) {
  return (
    <div className="mt-6 overflow-hidden rounded-lg border border-border bg-card shadow-sm">
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
  ...props
}: {
  id: string;
  label: string;
  error?: string;
  className?: string;
} & React.ComponentProps<typeof Input>) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-[13px]">
        {label}
      </Label>
      <Input id={id} className={className ?? inputClass} {...props} />
      <FieldError message={error} />
    </div>
  );
}

export function ServiceRequestForm({
  services,
  about,
}: {
  services: PublicService[];
  about: PublicAbout;
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

  // Layanan dengan kapasitas terkunci: nilai dipatok admin, pengunjung tidak bisa mengubah.
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
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
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
      {/* Honeypot anti-bot; diisi bot → zod 422 "Bot terdeteksi" */}
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

      {/* Data Perusahaan */}
      <section className="reveal-up flex flex-col gap-4">
        <SectionTitle required>Data Perusahaan</SectionTitle>
        <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
          <Field
            id="companyName"
            label="Nama Perusahaan"
            placeholder="PT Contoh Jaya"
            error={errors.companyName?.message}
            {...register("companyName")}
          />
          <Field
            id="contactName"
            label="Nama Kontak"
            placeholder="Budi Santoso"
            error={errors.contactName?.message}
            {...register("contactName")}
          />
          <Field
            id="position"
            label="Jabatan"
            placeholder="IT Manager"
            error={errors.position?.message}
            {...register("position")}
          />
          <Field
            id="phone"
            label="Nomor Telepon / WhatsApp"
            placeholder="0812xxxxxxx"
            error={errors.phone?.message}
            {...register("phone")}
          />
          <div className="sm:col-span-2">
            <Field
              id="email"
              label="Email"
              type="email"
              placeholder="nama@perusahaan.co.id"
              error={errors.email?.message}
              {...register("email")}
            />
          </div>
        </div>
      </section>

      {/* Layanan */}
      <section className="reveal-up reveal-delay-1 flex flex-col gap-4">
        <SectionTitle required>Pilih Layanan</SectionTitle>
        <div className="stagger grid grid-cols-2 gap-3" role="radiogroup" aria-label="Pilihan layanan">
          {services.map((svc) => {
            const selected = serviceType === svc.name;
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
                className={[
                  "card-lift group flex flex-col overflow-hidden rounded-lg border bg-card text-left",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                  selected ? "border-primary" : "border-border hover:border-foreground/20",
                ].join(" ")}
              >
                <div className="relative h-36 w-full overflow-hidden bg-muted/50 sm:h-40">
                  <div className="card-thumb absolute inset-0 [&_img]:blur-[3px] [&_img]:scale-105">
                    <ServiceImage src={svc.imagePreview} alt={svc.name} />
                  </div>
                  <div aria-hidden className="absolute inset-0 bg-black/30" />
                  <p
                    aria-hidden
                    className="absolute inset-0 flex items-center justify-center p-3 text-center text-[17px] font-bold leading-tight tracking-wide text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.7)]"
                  >
                    {svc.name}
                  </p>
                  {svc.bestSeller ? (
                    <span className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 rounded-full bg-amber-400/95 px-2 py-0.5 text-[10px] font-bold tracking-wide text-amber-950 shadow-sm">
                      <Star className="size-3 fill-current" />
                      Best Seller
                    </span>
                  ) : null}
                  {selected ? (
                    <span className="animate-check-pop absolute top-2 right-2 z-10 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-col gap-1 px-3 py-2.5">
                  <span className="sr-only">{svc.name}</span>
                  <p className="line-clamp-2 text-center text-[11px] leading-snug text-muted-foreground">
                    {svc.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
        <FieldError message={errors.serviceType?.message} />
      </section>

      {/* Kapasitas & Catatan */}
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
                className={`${inputClass} w-full rounded-r-none text-center tabular-nums sm:w-40${
                  lockedCapacity != null
                    ? " cursor-not-allowed bg-muted/50 text-muted-foreground"
                    : ""
                }`}
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
                      className={[
                        "h-full rounded-md px-3.5 text-[13px] font-medium transition-colors",
                        active
                          ? "btn-brand text-white"
                          : "text-muted-foreground hover:text-foreground",
                        lockedCapacity != null && !active
                          ? "cursor-not-allowed opacity-60"
                          : "",
                      ].join(" ")}
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
            <SectionTitle>Catatan Tambahan</SectionTitle>
            <textarea
              id="notes"
              rows={3}
              placeholder="Kebutuhan spesifik, lokasi instalasi, target waktu…"
              className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2.5 text-[14px] transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[3px] md:text-sm"
              {...register("notes")}
            />
            <FieldError message={errors.notes?.message} />
          </div>
        </div>
      </section>

      {/* Submit */}
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



  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start lg:gap-8">
      {/* ── Kiri: Form (50%) ── */}
      <div className="reveal-up reveal-delay-3 order-1 min-w-0 overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" aria-hidden />
        <div className="p-5 sm:p-7">{form}</div>
      </div>
      {/* ── Kanan: CableMap + InfoAside — peta bergeser naik ke header & menghilang saat layanan dipilih ── */}
      <aside className="reveal-up reveal-delay-4 order-2 lg:sticky lg:top-24">
        <div
          className={`grid transition-[grid-template-rows] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            serviceType ? "grid-rows-[0fr]" : "grid-rows-[1fr]"
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <div
              className={`pb-6 transition-[transform,opacity,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform ${
                serviceType
                  ? "-translate-y-8 scale-[0.97] opacity-0 blur-[2px]"
                  : "translate-y-0 scale-100 opacity-100 blur-0"
              }`}
            >
              <CableMap />
            </div>
          </div>
        </div>
        <div
          className={`transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform ${
            serviceType ? "-translate-y-1" : "translate-y-0"
          }`}
        >
          <InfoAside services={services} about={about} />
        </div>
        <div
          className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            selectedService ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            {selectedService ? (
              <div key={selectedService.id} className="animate-slide-fade">
                <SelectedServiceInfo service={selectedService} />
              </div>
            ) : null}
          </div>
        </div>
      </aside>
    </div>
  );
}
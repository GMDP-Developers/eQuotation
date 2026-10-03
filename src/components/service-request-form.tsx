"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  CheckCircle2,
  Loader2,
  Network,
  RotateCcw,
  Send,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { SERVICE_OPTIONS } from "@/data/services";
import {
  CAPACITY_UNITS,
  serviceRequestSchema,
  type ServiceRequestInput,
  type CapacityUnit,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Recap = {
  title: string;
  capacity: number;
  unit: string;
};

const inputClass = "h-11 rounded-lg border-input bg-background md:text-sm";

/** Gambar layanan; fallback ikon bila file belum ada. */
function ServiceImage({
  src,
  alt,
  icon: Icon,
  accent,
  className = "",
  iconClassName = "size-5",
}: {
  src: string;
  alt: string;
  icon: LucideIcon;
  accent: string;
  className?: string;
  iconClassName?: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={["relative h-full w-full overflow-hidden", className].join(
        " "
      )}
    >
      {!failed ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 640px) 50vw, 25vw"
          className="object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className={[
            "flex size-full items-center justify-center",
            accent,
          ].join(" ")}
        >
          <Icon className={iconClassName} />
        </div>
      )}
    </div>
  );
}

/** Preview gambar layanan + info; panel kanan. */
function InfoAside({ serviceType }: { serviceType?: string }) {
  const service = SERVICE_OPTIONS.find((s) => s.id === serviceType);

  if (service) {
    return (
      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="relative aspect-[4/3] w-full bg-muted/50">
          <ServiceImage
            src={service.image}
            alt={service.title}
            icon={service.icon}
            accent={service.accent}
            iconClassName="size-12"
          />
        </div>
        <div className="flex flex-col gap-2 p-5">
          <span className="w-fit rounded-md bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
            Anda memilih
          </span>
          <h3 className="text-lg font-semibold tracking-tight text-foreground">
            {service.title}
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

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="relative aspect-[4/3] w-full bg-muted/50">
        <ServiceImage
          src="/images/company.jpg"
          alt="Tentang eQuotation"
          icon={Network}
          accent="bg-primary/10 text-primary"
          iconClassName="size-12"
        />
      </div>
      <div className="flex flex-col gap-2 p-5">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          Tentang eQuotation
        </h3>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Sistem permintaan layanan jaringan korporat. Lengkapi formulir dan
          tim kami akan menghubungi Anda untuk penawaran.
        </p>
        <ul className="mt-2 flex flex-col gap-1.5 text-[13px] text-foreground/80">
          {[
            "ULO · Tier One · Intermix · Supermix",
            "Penawaran sesuai kebutuhan kapasitas",
            "Respons cepat via WhatsApp",
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

export function ServiceRequestForm() {
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
    },
  });

  const serviceType = watch("serviceType");
  const capacityUnit = watch("capacityUnit");

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

      const svc = SERVICE_OPTIONS.find((s) => s.id === values.serviceType);
      setRecap({
        title: svc?.title ?? String(values.serviceType),
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
      {/* Data Perusahaan */}
      <section className="flex flex-col gap-4">
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
      <section className="flex flex-col gap-4">
        <SectionTitle required>Pilih Layanan</SectionTitle>
        <div
          className="grid grid-cols-2 gap-3 sm:grid-cols-4"
          role="radiogroup"
          aria-label="Pilihan layanan"
        >
          {SERVICE_OPTIONS.map((svc) => {
            const selected = serviceType === svc.id;
            return (
              <button
                key={svc.id}
                type="button"
                role="radio"
                aria-checked={selected}
                data-selected={selected}
                onClick={() =>
                  setValue("serviceType", svc.id, {
                    shouldValidate: true,
                  })
                }
                className={[
                  "card-lift group flex flex-col overflow-hidden rounded-lg border bg-card text-left",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                  selected
                    ? "border-primary"
                    : "border-border hover:border-foreground/20",
                ].join(" ")}
              >
                <div className="relative h-36 w-full bg-muted/50 sm:h-40">
                  <ServiceImage
                    src={svc.image}
                    alt={svc.title}
                    icon={svc.icon}
                    accent={svc.accent}
                    iconClassName="size-8"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/40 to-transparent"
                  />
                  {selected ? (
                    <span className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-col gap-1 px-3 py-2.5">
                  <p
                    className={[
                      "text-[13px] font-semibold leading-tight",
                      selected ? "text-primary" : "text-foreground",
                    ].join(" ")}
                  >
                    {svc.title}
                  </p>
                  <p className="text-[11px] leading-snug text-muted-foreground">
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
      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:gap-8">
          <div className="flex flex-col gap-2.5">
            <SectionTitle required>Kapasitas</SectionTitle>
            <div className="flex items-stretch">
              <Input
                id="capacity"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                placeholder="100"
                className={`${inputClass} w-full rounded-r-none text-center tabular-nums sm:w-40`}
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
                      ].join(" ")}
                    >
                      {unit}
                    </button>
                  );
                })}
              </div>
            </div>
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
      <div className="flex flex-col gap-3 border-t border-border pt-7">
        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="btn-brand h-12 w-full max-w-xs rounded-lg text-sm font-medium text-white"
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
    <div className="grid gap-6 lg:grid-cols-[3fr_2fr] lg:items-start lg:gap-8">
      {/* ── Kiri: Form (60%) ── */}
      <div className="order-1 min-w-0 overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div
          className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
          aria-hidden
        />
        <div className="p-5 sm:p-7">{form}</div>
      </div>

      {/* ── Kanan: InfoAside (40%) ── */}
      <aside className="order-2 lg:sticky lg:top-24">
        <InfoAside serviceType={serviceType} />
      </aside>
    </div>
  );
}
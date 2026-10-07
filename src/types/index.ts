import { z } from "zod";

export type PublicService = {
  id: string;
  name: string;
  subtitle: string | null;
  description: string | null;
  imagePreview: string | null;
  imageFull: string | null;
  sortOrder: number;
  active: boolean;
  bestSeller: boolean;
  lockedCapacity: number | null;
  lockedCapacityUnit: CapacityUnit | null;
};

export type PublicAbout = {
  title: string;
  description: string;
  image: string | null;
  bullets: string[];
};

export const CAPACITY_UNITS = ["Mbps", "Gbps"] as const;

/** Normalisasi satuan dari DB (string bebas) ke union yang dipakai form. */
export function toCapacityUnit(value: string | null | undefined): CapacityUnit | null {
  return CAPACITY_UNITS.find((u) => u === value) ?? null;
}
export type CapacityUnit = (typeof CAPACITY_UNITS)[number];

export const SERVICE_STATUS = [
  "BARU",
  "DIPROSES",
  "SELESAI",
  "DITOLAK",
] as const;
export type ServiceStatus = (typeof SERVICE_STATUS)[number];
export const serviceRequestSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(2, "Nama perusahaan minimal 2 karakter")
    .max(120, "Maksimal 120 karakter"),
  contactName: z
    .string()
    .trim()
    .min(2, "Nama kontak minimal 2 karakter")
    .max(120, "Maksimal 120 karakter"),
  position: z.string().trim().max(120, "Maksimal 120 karakter").optional(),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-() ]{6,20}$/, "Nomor telepon tidak valid"),
  email: z.email("Email tidak valid").max(160, "Maksimal 160 karakter"),
  serviceType: z.string().trim().min(1, "Pilih layanan").max(60, "Maksimal 60 karakter"),
  capacity: z.coerce
    .number({ message: "Kapasitas harus berupa angka" })
    .int("Kapasitas harus bilangan bulat")
    .positive("Kapasitas harus lebih dari 0")
    .max(10_000_000, "Kapasitas terlalu besar"),
  capacityUnit: z.enum(CAPACITY_UNITS, "Pilih satuan kapasitas"),
  notes: z.string().trim().max(1000, "Maksimal 1000 karakter").optional(),
  // Honeypot anti-bot: harus kosong. Isian non-kosong = bot.
  website: z.string().max(0, "Bot terdeteksi").optional(),
});

export type ServiceRequestInput = z.input<typeof serviceRequestSchema>;
export type ServiceRequestValues = z.output<typeof serviceRequestSchema>;

export type ServiceRequestRecord = {
  id: string;
  companyName: string;
  contactName: string;
  position: string | null;
  phone: string;
  email: string;
  serviceType: string;
  capacity: number;
  capacityUnit: string;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

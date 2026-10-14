import { z } from "zod";

import { parseLocation } from "@/lib/geo";

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

export const PICKUP_METHODS = ["DATA_CENTER", "DELIVERY"] as const;
export type PickupMethod = (typeof PICKUP_METHODS)[number];
export const PICKUP_LABELS: Record<PickupMethod, string> = {
  DATA_CENTER: "Koneksi ke Data Center",
  DELIVERY: "Di antar via metro ke titik koordinat",
};
export const DATACENTERS = ["IDC 3D", "Cyber APJII", "Omadata Surabaya", "Lainnya"] as const;

export const DATACENTER_ICONS: Record<typeof DATACENTERS[number], string> = {
  "IDC 3D": "/images/dc/idc.png",
  "Cyber APJII": "/images/dc/Apjii.png",
  "Omadata Surabaya": "/images/dc/omadata.webp",
  "Lainnya": "",
};
export type Datacenter = (typeof DATACENTERS)[number];

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
  position: z
    .string()
    .trim()
    .min(2, "Jabatan minimal 2 karakter")
    .max(120, "Maksimal 120 karakter"),
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
  notes: z
    .string()
    .trim()
    .min(1, "Catatan wajib diisi")
    .max(1000, "Maksimal 1000 karakter"),
  pickupMethod: z.enum(PICKUP_METHODS, "Pilih pengambilan koneksi"),
  datacenter: z.enum(DATACENTERS).optional(),
  datacenterOther: z.string().trim().max(120, "Maksimal 120 karakter").optional(),
  location: z.string().trim().max(500, "Maksimal 500 karakter").optional(),
  // Honeypot anti-bot: harus kosong. Isian non-kosong = bot.
  website: z.string().max(0, "Bot terdeteksi").optional(),
}).superRefine((v, ctx) => {
  if (v.pickupMethod === "DATA_CENTER") {
    if (!v.datacenter) {
      ctx.addIssue({ code: "custom", path: ["datacenter"], message: "Pilih tempat datacenter" });
    }
    if (v.datacenter === "Lainnya" && !v.datacenterOther) {
      ctx.addIssue({ code: "custom", path: ["datacenterOther"], message: "Sebutkan datacenter lainnya" });
    }
  }
  if (v.pickupMethod === "DELIVERY") {
    if (!v.location) {
      ctx.addIssue({ code: "custom", path: ["location"], message: "Tempel link Google Maps atau isi koordinat" });
    } else if (!parseLocation(v.location)) {
      ctx.addIssue({ code: "custom", path: ["location"], message: "Link tidak terbaca. Pakai link lengkap atau isi koordinat manual (lat,lng)." });
    }
  }
});

export type ServiceRequestInput = z.input<typeof serviceRequestSchema>;
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
  pickupMethod: string;
  datacenter: string | null;
  datacenterOther: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  mapsUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

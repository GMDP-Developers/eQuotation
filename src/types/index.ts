import { z } from "zod";

export const SERVICE_TYPES = ["ULO", "Tier One", "Intermix", "Supermix"] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export const CAPACITY_UNITS = ["Mbps", "Gbps"] as const;
export type CapacityUnit = (typeof CAPACITY_UNITS)[number];

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
  serviceType: z.enum(SERVICE_TYPES, "Pilih salah satu layanan"),
  capacity: z.coerce
    .number({ message: "Kapasitas harus berupa angka" })
    .int("Kapasitas harus bilangan bulat")
    .positive("Kapasitas harus lebih dari 0")
    .max(10_000_000, "Kapasitas terlalu besar"),
  capacityUnit: z.enum(CAPACITY_UNITS, "Pilih satuan kapasitas"),
  notes: z.string().trim().max(1000, "Maksimal 1000 karakter").optional(),
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
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

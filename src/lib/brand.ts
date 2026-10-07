import { prisma } from "@/lib/db";
import { toCapacityUnit, type PublicAbout, type PublicService } from "@/types";
import type { Service, SiteSetting } from "@prisma/client";

export async function getBrand() {
  return prisma.siteSetting.findUnique({ where: { id: "singleton" } });
}

// alias for spec naming
export const getBrandSetting = getBrand;

export function toPublicService(s: Service): PublicService {
  return {
    id: s.id,
    name: s.name,
    subtitle: s.subtitle,
    description: s.description,
    imagePreview: s.imagePreview,
    imageFull: s.imageFull,
    sortOrder: s.sortOrder,
    active: s.active,
    bestSeller: s.bestSeller,
    lockedCapacity: s.lockedCapacity,
    lockedCapacityUnit: toCapacityUnit(s.lockedCapacityUnit),
  };
}

export function toServiceData(s: Service) {
  return {
    ...toPublicService(s),
    createdAt: s.createdAt.toISOString(),
  };
}

export function toPublicAbout(setting: SiteSetting | null): PublicAbout {
  return {
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
}

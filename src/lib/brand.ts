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

export function toPublicAbout(setting: SiteSetting | null): PublicAbout | null {
  if (!setting || setting.aboutEnabled === false) return null;
  return {
    title: setting.aboutTitle,
    description: setting.aboutDescription,
    image: setting.aboutImage,
    bullets: setting.aboutBullets.split("\n").filter(Boolean),
  };
}

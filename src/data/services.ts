import { Globe2, Network, Shuffle, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { ServiceType } from "@/types";

export type ServiceOption = {
  id: ServiceType;
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  /** Path gambar di public/ — fallback ke icon bila file belum ada */
  image: string;
};

/**
 * Letakkan JPG/PNG di public/images/services/:
 *   ulo.jpg | tier-one.jpg | intermix.jpg | supermix.jpg
 */
export const SERVICE_IMAGES: Record<ServiceType, string> = {
  ULO: "/images/services/ulo.jpg",
  "Tier One": "/images/services/tier-one.jpg",
  Intermix: "/images/services/intermix.jpg",
  Supermix: "/images/services/supermix.jpg",
};

export const SERVICE_OPTIONS: ServiceOption[] = [
  {
    id: "ULO",
    title: "ULO",
    subtitle: "Unmetered Local Option",
    description:
      "Koneksi lokal tanpa batasan kuota untuk performa optimal.",
    icon: Globe2,
    accent: "text-slate-600 bg-slate-100",
    image: SERVICE_IMAGES.ULO,
  },
  {
    id: "Tier One",
    title: "Tier One",
    subtitle: "Premium Global Backbone",
    description:
      "Jaringan jalur utama global dengan latensi terendah.",
    icon: Network,
    accent: "text-slate-600 bg-slate-100",
    image: SERVICE_IMAGES["Tier One"],
  },
  {
    id: "Intermix",
    title: "Intermix",
    subtitle: "Flexible Hybrid Route",
    description:
      "Kombinasi fleksibel antara rute lokal dan internasional.",
    icon: Shuffle,
    accent: "text-slate-600 bg-slate-100",
    image: SERVICE_IMAGES.Intermix,
  },
  {
    id: "Supermix",
    title: "Supermix",
    subtitle: "Maximum Performance",
    description:
      "Performa jaringan tertinggi dengan redundansi backup penuh.",
    icon: Zap,
    accent: "text-slate-600 bg-slate-100",
    image: SERVICE_IMAGES.Supermix,
  },
];
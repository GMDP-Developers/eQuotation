import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const envPassword = process.env.SEED_ADMIN_PASSWORD;
  if (process.env.NODE_ENV === "production" && !envPassword) {
    console.error(
      "TOLAK: SEED_ADMIN_PASSWORD wajib di-set di production (password default 'admin123' tidak diizinkan)."
    );
    process.exit(1);
  }
  const password = envPassword ?? "admin123";
  const hash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: { username: "admin", password: hash, name: "Administrator", role: "ADMIN" },
  });

  // Stable image source: public/topology-parts/*.png + brand/about stable copies
  // public/images/services/<name>.png is the canonical path (copied from topology-parts at seed time).
  const services: Prisma.ServiceCreateInput[] = [
    {
      name: "SuperMIX",
      subtitle: null,
      description:
        "A complete connectivity solution combining 70% IndoMIX and 30% InterMIX, delivering optimized local content access with reliable international reach.",
      imagePreview: "/images/services/supermix.png",
      imageFull: "/images/services/supermix.png",
      sortOrder: 0,
      active: true,
      bestSeller: true,
      lockedCapacity: null,
      lockedCapacityUnit: null,
    },
    {
      name: "InterMIX",
      subtitle: null,
      description:
        "Premium international connectivity combining Tier-1 IP Transit, Singapore IX, and Google PNI for diverse and optimized global routes.",
      imagePreview: "/images/services/intermix.png",
      imageFull: "/images/services/intermix.png",
      sortOrder: 1,
      active: true,
      bestSeller: true,
      lockedCapacity: null,
      lockedCapacityUnit: null,
    },
    {
      name: "IndoMIX",
      subtitle: null,
      description:
        "Indonesia-focused connectivity combining local IX, PNI, and CDN/cache for efficient access to major networks and content platforms.",
      imagePreview: "/images/services/indomix.png",
      imageFull: "/images/services/indomix.png",
      sortOrder: 2,
      active: true,
      bestSeller: true,
      lockedCapacity: null,
      lockedCapacityUnit: null,
    },
    {
      name: "UltraMIX",
      subtitle: null,
      description:
        "A balanced combination of Tier-1 IP Transit and Singapore IX, providing global reach with efficient peering connectivity.",
      imagePreview: "/images/services/ultramix.png",
      imageFull: "/images/services/ultramix.png",
      sortOrder: 3,
      active: true,
      bestSeller: false,
      lockedCapacity: null,
      lockedCapacityUnit: null,
    },
    {
      name: "TierOne",
      subtitle: null,
      description:
        "Pure Tier-1 IP Transit through Lumen and NTT, designed for reliable and diversified global Internet connectivity.",
      imagePreview: "/images/services/tierone.png",
      imageFull: "/images/services/tierone.png",
      sortOrder: 4,
      active: true,
      bestSeller: false,
      lockedCapacity: null,
      lockedCapacityUnit: null,
    },
    {
      name: "SingMIX",
      subtitle: null,
      description:
        "Direct access to the Singapore peering ecosystem through SGIX and Equinix IX, ideal for complementing existing transit.",
      imagePreview: "/images/services/singmix.png",
      imageFull: "/images/services/singmix.png",
      sortOrder: 5,
      active: true,
      bestSeller: false,
      lockedCapacity: null,
      lockedCapacityUnit: null,
    },
    {
      name: "GTrans",
      subtitle: null,
      description:
        "Dedicated Google PNI connectivity for optimized and direct access to Google's network and services.",
      imagePreview: "/images/services/gtrans.png",
      imageFull: "/images/services/gtrans.png",
      sortOrder: 6,
      active: true,
      bestSeller: false,
      lockedCapacity: null,
      lockedCapacityUnit: null,
    },
    {
      name: "Secure",
      subtitle: null,
      description:
        "Secure connectivity powered by StormWall Anti-DDoS, designed to protect network availability against DDoS attacks.",
      imagePreview: "/images/services/secure.png",
      imageFull: "/images/services/secure.png",
      sortOrder: 7,
      active: true,
      bestSeller: false,
      lockedCapacity: null,
      lockedCapacityUnit: null,
    },
    {
      name: "ULO Starter Pack",
      subtitle: null,
      description:
        "A dedicated package for companies preparing for ULO as part of their ISP licensing process, featuring 100 Mbps InterMIX connectivity with an included /29 IP allocation.",
      imagePreview: null,
      imageFull: null,
      sortOrder: 8,
      active: true,
      bestSeller: false,
      lockedCapacity: 100,
      lockedCapacityUnit: "Mbps",
    },
  ];

  for (const s of services) {
    await prisma.service.upsert({
      where: { name: s.name },
      update: {}, // jangan timpa editan admin saat re-seed
      create: s,
    });
  }

  await prisma.siteSetting.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      aboutTitle: "Tentang Layanan Kami",
      aboutDescription:
        "Sistem permintaan layanan jaringan korporat. Lengkapi formulir dan tim kami akan menghubungi Anda untuk penawaran.",
      aboutImage: "/images/services/about-panel.png",
      aboutBullets: "Penawaran sesuai kebutuhan kapasitas",
      brandName: "eQuotation",
      brandSubtitle: "PT. Datakom Padma Jaya",
      brandLogo: "/images/services/brand-logo.png",
    },
  });

  console.log(`Seed done → login: admin / ${envPassword ? "SEED_ADMIN_PASSWORD" : "admin123"} (${services.length} services)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

import { Prisma, PrismaClient } from "@prisma/client";
import { existsSync } from "node:fs";
import path from "node:path";
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

  // Canonical paths — must match files in public/images/services/*
  // public/images/services/logo.png        → SiteSetting.brandLogo (header)
  // public/images/services/<service>.png   → Service.imagePreview/imageFull (panel kanan)
  // ULO Starter Pack has no dedicated image → null (placeholder)
  const services: Prisma.ServiceCreateInput[] = [
    {
      name: "SuperMIX",
      subtitle: null,
      description:
        "A complete connectivity solution combining 70% IndoMIX and 30% InterMIX, delivering optimized local content access with reliable international reach.",
      imagePreview: "/images/services/SuperMIX.png",
      imageFull: "/images/services/SuperMIX.png",
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
      imagePreview: "/images/services/InterMIX.png",
      imageFull: "/images/services/InterMIX.png",
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
      imagePreview: "/images/services/IndoMIX.png",
      imageFull: "/images/services/IndoMIX.png",
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
      imagePreview: "/images/services/UltraMIX.png",
      imageFull: "/images/services/UltraMIX.png",
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
      imagePreview: "/images/services/TierOne.png",
      imageFull: "/images/services/TierOne.png",
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
      imagePreview: "/images/services/SingMIX.png",
      imageFull: "/images/services/SingMIX.png",
      sortOrder: 5,
      active: true,
      bestSeller: false,
      lockedCapacity: null,
      lockedCapacityUnit: null,
    },
    {
      name: "Alpha",
      subtitle: null,
      description:
        "Dedicated Google PNI connectivity for optimized and direct access to Google's network and services.",
      imagePreview: "/images/services/Alpha.png",
      imageFull: "/images/services/Alpha.png",
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
      imagePreview: "/images/services/Secure.png",
      imageFull: "/images/services/Secure.png",
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
      imagePreview: "/images/services/ULO-Starter-Pack.png",
      imageFull: "/images/services/ULO-Starter-Pack.png",
      sortOrder: 8,
      active: true,
      bestSeller: false,
      lockedCapacity: 100,
      lockedCapacityUnit: "Mbps",
    },
  ];

  // rename lama → baru sebelum upsert (nama unik, biar gak dobel sortOrder)
  await prisma.service.updateMany({ where: { name: "GTrans" }, data: { name: "Alpha" } });
  await prisma.service.updateMany({ where: { imagePreview: "/images/services/gtrans.png" }, data: { imagePreview: "/images/services/Alpha.png" } });
  await prisma.service.updateMany({ where: { imageFull: "/images/services/gtrans.png" }, data: { imageFull: "/images/services/Alpha.png" } });

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
      // null → InfoAside fallback ke preview layanan pertama (imagePreview yg sudah ada)
      aboutImage: null,
      aboutBullets: "Penawaran sesuai kebutuhan kapasitas",
      brandName: "eQuotation",
      brandSubtitle: "PT. Datakom Padma Jaya",
      // public/images/services/logo.png — file memang ada (9.7KB)
      brandLogo: "/images/services/logo.png",
    },
  });

  // Heal path hantu — file tidak ada di public/ (seed lama: brand-logo.png / about-panel.png / uuid yang filenya hilang)
  // Hanya timpa bila file memang hilang; upload admin yang filenya masih ada dibiarkan.
  const setting = await prisma.siteSetting.findUnique({ where: { id: "singleton" } });
  if (setting) {
    const publicDir = path.join(process.cwd(), "public");
    const missing = (stored: string | null) => {
      if (!stored) return false;
      const rel = stored.replace(/^\/+/, "");
      return !existsSync(path.join(publicDir, rel));
    };
    const patch: Record<string, unknown> = {};
    if (setting.aboutImage && missing(setting.aboutImage)) patch.aboutImage = null; // InfoAside fallback ke preview layanan pertama
    if (setting.brandLogo && missing(setting.brandLogo)) patch.brandLogo = "/images/services/logo.png";
    if (Object.keys(patch).length) {
      await prisma.siteSetting.update({ where: { id: "singleton" }, data: patch });
      console.log(`Healed SiteSetting: ${Object.keys(patch).join(", ")}`);
    }
  }

  console.log(`Seed done → login: admin / ${envPassword ? "SEED_ADMIN_PASSWORD" : "admin123"} (${services.length} services)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

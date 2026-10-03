import { PrismaClient } from "@prisma/client";
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
    create: {
      username: "admin",
      password: hash,
      name: "Administrator",
      role: "ADMIN",
    },
  });

  const services = [
    {
      name: "ULO",
      subtitle: "Unmetered Local Option",
      description: "Koneksi lokal tanpa batasan kuota untuk performa optimal.",
      imagePreview: "/images/services/ulo.jpg",
      sortOrder: 1,
    },
    {
      name: "Tier One",
      subtitle: "Premium Global Backbone",
      description: "Jaringan jalur utama global dengan latensi terendah.",
      imagePreview: "/images/services/tier-one.jpg",
      sortOrder: 2,
    },
    {
      name: "Intermix",
      subtitle: "Flexible Hybrid Route",
      description: "Kombinasi fleksibel antara rute lokal dan internasional.",
      imagePreview: "/images/services/intermix.jpg",
      sortOrder: 3,
    },
    {
      name: "Supermix",
      subtitle: "Maximum Performance",
      description: "Performa jaringan tertinggi dengan redundansi backup penuh.",
      imagePreview: "/images/services/supermix.jpg",
      sortOrder: 4,
    },
  ];
  for (const s of services) {
    await prisma.service.upsert({
      where: { name: s.name },
      update: {}, // jangan timpa editan admin saat re-seed
      create: s,
    });
  }

  console.log(
    `Seed done → login: admin / ${envPassword ? "SEED_ADMIN_PASSWORD" : "admin123"}`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

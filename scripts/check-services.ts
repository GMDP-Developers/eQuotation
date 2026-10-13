import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const services = await prisma.service.findMany({
    orderBy: { sortOrder: "asc" },
  });

  console.log("Current services:");
  services.forEach((s, i) => console.log(`${i}: ${s.name} (sortOrder: ${s.sortOrder})`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

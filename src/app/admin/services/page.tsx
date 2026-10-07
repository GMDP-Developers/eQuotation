import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { ServicesManager } from "@/components/admin/services-manager";
import { toCapacityUnit } from "@/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Layanan",
};

export default async function ServicesPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const services = await prisma.service.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return (
    <ServicesManager
      services={services.map((s) => ({
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
        createdAt: s.createdAt.toISOString(),
      }))}
    />
  );
}

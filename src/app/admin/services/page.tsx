import { redirect } from "next/navigation";

import { ServicesManager } from "@/components/admin/services-manager";
import { auth } from "@/lib/auth";
import { toServiceData } from "@/lib/brand";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Layanan",
};

export default async function ServicesPage() {
  const session = await auth();
  // guarded by AdminLayout (!session?.user); kept for direct-route safety
  if (!session?.user) {
    redirect("/login");
  }

  const services = await prisma.service.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return <ServicesManager services={services.map(toServiceData)} />;
}

import { prisma } from "@/lib/db";
import { RequestsDashboard } from "@/components/admin/requests-dashboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const rows = await prisma.serviceRequest.findMany({
    orderBy: { createdAt: "desc" },
  });

  const requests = rows.map((r) => ({
    id: r.id,
    companyName: r.companyName,
    contactName: r.contactName,
    position: r.position,
    phone: r.phone,
    email: r.email,
    serviceType: r.serviceType,
    capacity: r.capacity,
    capacityUnit: r.capacityUnit,
    notes: r.notes,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return <RequestsDashboard requests={requests} />;
}

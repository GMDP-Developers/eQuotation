import { prisma } from "@/lib/db";
import { RequestsDashboard } from "@/components/admin/requests-dashboard";
import { SERVICE_STATUS } from "@/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard",
};

const PAGE_SIZE = 20;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function endOfDay(dateStr: string) {
  const d = new Date(dateStr);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const str = (v: string | string[] | undefined) =>
    typeof v === "string" && v.length > 0 ? v : undefined;

  const page = Math.max(1, Number(str(sp.page)) || 1);

  const serviceTypeRaw = str(sp.serviceType);

  const services = await prisma.service.findMany({
    orderBy: { sortOrder: "asc" },
  });
  const serviceNames = new Set(services.map((s) => s.name));
  const serviceType =
    serviceTypeRaw && serviceNames.has(serviceTypeRaw)
      ? serviceTypeRaw
      : undefined;

  const statusRaw = str(sp.status);
  const status =
    statusRaw && (SERVICE_STATUS as readonly string[]).includes(statusRaw)
      ? statusRaw
      : undefined;

  const fromRaw = str(sp.from);
  const from =
    fromRaw && DATE_RE.test(fromRaw) && !Number.isNaN(new Date(fromRaw).getTime())
      ? fromRaw
      : undefined;

  const toRaw = str(sp.to);
  const to =
    toRaw && DATE_RE.test(toRaw) && !Number.isNaN(new Date(toRaw).getTime())
      ? toRaw
      : undefined;

  const where = {
    ...(serviceType ? { serviceType } : {}),
    ...(status ? { status } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: endOfDay(to) } : {}),
          },
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.serviceRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.serviceRequest.count({ where }),
  ]);

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
    status: r.status,
    notes: r.notes,
    pickupMethod: r.pickupMethod,
    datacenter: r.datacenter,
    datacenterOther: r.datacenterOther,
    location: r.location,
    latitude: r.latitude,
    longitude: r.longitude,
    mapsUrl: r.mapsUrl,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return (
    <RequestsDashboard
      requests={requests}
      page={page}
      totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
      total={total}
      filters={{ serviceType, status, from, to }}
      services={services.map((s) => ({ name: s.name, active: s.active }))}
    />
  );
}

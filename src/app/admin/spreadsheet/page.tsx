import { prisma } from "@/lib/db";
import { RequestsSheet } from "@/components/admin/requests-sheet";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Spreadsheet",
};

export default async function SpreadsheetPage() {
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
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Spreadsheet Permintaan</h2>
      </div>
      {/* ponytail: tanpa pagination; aman untuk ratusan–ribuan baris. Upgrade: server-side pagination bila data > ~10k. */}
      <RequestsSheet requests={requests} />
    </div>
  );
}

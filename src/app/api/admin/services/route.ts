import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { ImageValidationError, removeServiceImage, saveServiceImage } from "@/lib/service-image";
import { CAPACITY_UNITS, type CapacityUnit } from "@/types";

function str(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v : "";
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    err.code === "P2002"
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized. Silakan login terlebih dahulu." },
      { status: 401 }
    );
  }

  const form = await req.formData();

  const name = str(form, "name").trim();
  if (!name || name.length < 2 || name.length > 60) {
    return NextResponse.json(
      { error: "Nama layanan wajib diisi (2-60 karakter)." },
      { status: 400 }
    );
  }

  const subtitle = str(form, "subtitle").trim();
  if (subtitle.length > 120) {
    return NextResponse.json(
      { error: "Subtitle maksimal 120 karakter." },
      { status: 400 }
    );
  }

  const description = str(form, "description").trim();
  if (description.length > 1000) {
    return NextResponse.json(
      { error: "Deskripsi maksimal 1000 karakter." },
      { status: 400 }
    );
  }

  const sortOrderRaw = str(form, "sortOrder").trim();
  const sortOrder = sortOrderRaw === "" ? 0 : Number(sortOrderRaw);
  if (!Number.isInteger(sortOrder) || sortOrder < -1000 || sortOrder > 1000) {
    return NextResponse.json(
      { error: "Urutan harus bilangan bulat antara -1000 dan 1000." },
      { status: 400 }
    );
  }

  const activeRaw = form.get("active");
  if (activeRaw !== null && activeRaw !== "true" && activeRaw !== "false") {
    return NextResponse.json(
      { error: "Status aktif tidak valid." },
      { status: 400 }
    );
  }
  const active = activeRaw !== "false";
  const bestSellerRaw = form.get("bestSeller");
  if (
    bestSellerRaw !== null &&
    bestSellerRaw !== "true" &&
    bestSellerRaw !== "false"
  ) {
    return NextResponse.json(
      { error: "Status best seller tidak valid." },
      { status: 400 }
    );
  }
  const bestSeller = bestSellerRaw === "true";

  let lockedCapacity: number | null = null;
  let lockedCapacityUnit: string | null = null;
  const lockRaw = str(form, "lockedCapacity").trim();
  if (lockRaw !== "") {
    const lockValue = Number(lockRaw);
    if (!Number.isInteger(lockValue) || lockValue < 1 || lockValue > 10_000_000) {
      return NextResponse.json(
        { error: "Kapasitas kunci harus bilangan bulat 1-10.000.000." },
        { status: 400 }
      );
    }
    const unit = str(form, "lockedCapacityUnit").trim() || "Mbps";
    if (!CAPACITY_UNITS.includes(unit as CapacityUnit)) {
      return NextResponse.json(
        { error: "Satuan kapasitas kunci tidak valid." },
        { status: 400 }
      );
    }
    lockedCapacity = lockValue;
    lockedCapacityUnit = unit;
  }

  let imagePreviewUrl: string | null = null;
  let imageFullUrl: string | null = null;
  const previewEntry = form.get("imagePreview");
  if (previewEntry instanceof File && previewEntry.size > 0) {
    try {
      imagePreviewUrl = await saveServiceImage(previewEntry);
    } catch (err) {
      if (err instanceof ImageValidationError) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      console.error(err);
      return NextResponse.json(
        { error: "Gagal mengunggah gambar. Coba lagi." },
        { status: 500 }
      );
    }
  }
  const fullEntry = form.get("imageFull");
  if (fullEntry instanceof File && fullEntry.size > 0) {
    try {
      imageFullUrl = await saveServiceImage(fullEntry);
    } catch (err) {
      // Jangan tinggalkan file preview yatim bila upload full gagal
      if (imagePreviewUrl) {
        await removeServiceImage(imagePreviewUrl).catch(() => {});
      }
      if (err instanceof ImageValidationError) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      console.error(err);
      return NextResponse.json(
        { error: "Gagal mengunggah gambar. Coba lagi." },
        { status: 500 }
      );
    }
  }

  try {
    const service = await prisma.$transaction(async (tx) => {
      const created = await tx.service.create({
        data: {
          name,
          subtitle: subtitle || null,
          description: description || null,
          imagePreview: imagePreviewUrl,
          imageFull: imageFullUrl,
          sortOrder,
          active,
          bestSeller,
          lockedCapacity,
          lockedCapacityUnit,
        },
      });
      await tx.auditLog.create({
        data: { action: "SERVICE_CREATE", targetId: created.id, detail: name },
      });
      return created;
    });
    return NextResponse.json({ ok: true, id: service.id }, { status: 201 });
  } catch (err) {
    // Jangan tinggalkan file gambar yatim bila create gagal (mis. nama duplikat)
    if (imagePreviewUrl) {
      await removeServiceImage(imagePreviewUrl).catch(() => {});
    }
    if (imageFullUrl) {
      await removeServiceImage(imageFullUrl).catch(() => {});
    }
    if (isUniqueViolation(err)) {
      return NextResponse.json(
        { error: "Nama layanan sudah digunakan." },
        { status: 409 }
      );
    }
    console.error(err);
    return NextResponse.json(
      { error: "Gagal menyimpan layanan. Coba lagi." },
      { status: 500 }
    );
  }
}

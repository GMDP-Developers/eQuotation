import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { ImageValidationError, removeServiceImage, saveServiceImage } from "@/lib/service-image";
import { CAPACITY_UNITS, type CapacityUnit } from "@/types";

type Ctx = { params: Promise<{ id: string }> };

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

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized. Silakan login terlebih dahulu." },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Layanan tidak ditemukan." },
        { status: 404 }
      );
    }

    const form = await req.formData();
    const data: Prisma.ServiceUpdateInput = {};

    if (form.has("name")) {
      const name = str(form, "name").trim();
      if (!name || name.length < 2 || name.length > 60) {
        return NextResponse.json(
          { error: "Nama layanan wajib diisi (2-60 karakter)." },
          { status: 400 }
        );
      }
      data.name = name;
    }

    if (form.has("subtitle")) {
      const subtitle = str(form, "subtitle").trim();
      if (subtitle.length > 120) {
        return NextResponse.json(
          { error: "Subtitle maksimal 120 karakter." },
          { status: 400 }
        );
      }
      data.subtitle = subtitle || null;
    }

    if (form.has("description")) {
      const description = str(form, "description").trim();
      if (description.length > 1000) {
        return NextResponse.json(
          { error: "Deskripsi maksimal 1000 karakter." },
          { status: 400 }
        );
      }
      data.description = description || null;
    }

    if (form.has("sortOrder")) {
      const raw = str(form, "sortOrder").trim();
      const sortOrder = raw === "" ? 0 : Number(raw);
      if (!Number.isInteger(sortOrder) || sortOrder < -1000 || sortOrder > 1000) {
        return NextResponse.json(
          { error: "Urutan harus bilangan bulat antara -1000 dan 1000." },
          { status: 400 }
        );
      }
      data.sortOrder = sortOrder;
    }

    if (form.has("active")) {
      const activeRaw = form.get("active");
      if (activeRaw !== "true" && activeRaw !== "false") {
        return NextResponse.json(
          { error: "Status aktif tidak valid." },
          { status: 400 }
        );
      }
      data.active = activeRaw === "true";
    }

    if (form.has("bestSeller")) {
      const bestSellerRaw = form.get("bestSeller");
      if (bestSellerRaw !== "true" && bestSellerRaw !== "false") {
        return NextResponse.json(
          { error: "Status best seller tidak valid." },
          { status: 400 }
        );
      }
      data.bestSeller = bestSellerRaw === "true";
    }

    if (form.has("lockedCapacity")) {
      const raw = str(form, "lockedCapacity").trim();
      if (raw === "") {
        data.lockedCapacity = null;
        data.lockedCapacityUnit = null;
      } else {
        const lockValue = Number(raw);
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
        data.lockedCapacity = lockValue;
        data.lockedCapacityUnit = unit;
      }
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
      data.imagePreview = imagePreviewUrl;
    }

    const fullEntry = form.get("imageFull");
    if (fullEntry instanceof File && fullEntry.size > 0) {
      try {
        imageFullUrl = await saveServiceImage(fullEntry);
      } catch (err) {
        // Jangan tinggalkan file preview baru yatim bila upload full gagal
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
      data.imageFull = imageFullUrl;
    }

    const newName = typeof data.name === "string" ? data.name : existing.name;
    const detail =
      newName !== existing.name ? `${existing.name}→${newName}` : existing.name;

    try {
      await prisma.$transaction(async (tx) => {
        await tx.service.update({ where: { id }, data });
        await tx.auditLog.create({
          data: { action: "SERVICE_UPDATE", targetId: id, detail },
        });
      });
    } catch (err) {
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
        { error: "Gagal memperbarui layanan. Coba lagi." },
        { status: 500 }
      );
    }

    if (
      imagePreviewUrl &&
      existing.imagePreview &&
      existing.imagePreview !== imagePreviewUrl
    ) {
      try {
        await removeServiceImage(existing.imagePreview);
      } catch (err) {
        console.error(err);
      }
    }
    if (
      imageFullUrl &&
      existing.imageFull &&
      existing.imageFull !== imageFullUrl
    ) {
      try {
        await removeServiceImage(existing.imageFull);
      } catch (err) {
        console.error(err);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized. Silakan login terlebih dahulu." },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Layanan tidak ditemukan." },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.service.delete({ where: { id } });
      await tx.auditLog.create({
        data: { action: "SERVICE_DELETE", targetId: id, detail: existing.name },
      });
    });

    // Hapus file setelah row terhapus — kalau unlink gagal, file yatim bisa
    // dibersihkan manual; baris DB tetap konsisten.
    try {
      await removeServiceImage(existing.imagePreview);
    } catch (err) {
      console.error(err);
    }
    try {
      await removeServiceImage(existing.imageFull);
    } catch (err) {
      console.error(err);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Gagal menghapus layanan. Coba lagi." },
      { status: 500 }
    );
  }
}

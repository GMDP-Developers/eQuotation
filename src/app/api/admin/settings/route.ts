import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  ImageValidationError,
  removeServiceImage,
  saveServiceImage,
} from "@/lib/service-image";

const SINGLETON = "singleton";

function str(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v : "";
}

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized. Silakan login terlebih dahulu." },
      { status: 401 }
    );
  }

  const setting = await prisma.siteSetting.findUnique({
    where: { id: SINGLETON },
  });
  return NextResponse.json({
    ok: true,
    setting: setting
      ? {
          aboutTitle: setting.aboutTitle,
          aboutDescription: setting.aboutDescription,
          aboutImage: setting.aboutImage,
          aboutBullets: setting.aboutBullets,
          aboutEnabled: setting.aboutEnabled,
          brandName: setting.brandName,
          brandSubtitle: setting.brandSubtitle,
          brandLogo: setting.brandLogo,
        }
      : null,
  });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized. Silakan login terlebih dahulu." },
      { status: 401 }
    );
  }

  const form = await req.formData();

  const aboutTitle = str(form, "aboutTitle").trim();
  if (!aboutTitle || aboutTitle.length > 120) {
    return NextResponse.json(
      { error: "Judul wajib diisi (maksimal 120 karakter)." },
      { status: 400 }
    );
  }

  const aboutDescription = str(form, "aboutDescription").trim();
  if (!aboutDescription || aboutDescription.length > 1000) {
    return NextResponse.json(
      { error: "Deskripsi wajib diisi (maksimal 1000 karakter)." },
      { status: 400 }
    );
  }
  const aboutEnabled = form.get("aboutEnabled") === "on" || form.get("aboutEnabled") === "true";

  const aboutBullets = str(form, "aboutBullets");
  if (aboutBullets.length > 2000) {
    return NextResponse.json(
      { error: "Daftar poin maksimal 2000 karakter." },
      { status: 400 }
    );
  }

  const brandName = str(form, "brandName").trim();
  if (!brandName || brandName.length > 60) {
    return NextResponse.json(
      { error: "Nama brand wajib diisi (maks 60 karakter)." },
      { status: 400 }
    );
  }

  const brandSubtitle = str(form, "brandSubtitle").trim();
  if (!brandSubtitle || brandSubtitle.length > 80) {
    return NextResponse.json(
      { error: "Keterangan brand wajib diisi (maks 80 karakter)." },
      { status: 400 }
    );
  }

  const existing = await prisma.siteSetting.findUnique({
    where: { id: SINGLETON },
  });

  let aboutImage = existing?.aboutImage ?? null;
  const imageEntry = form.get("aboutImage");
  if (imageEntry instanceof File && imageEntry.size > 0) {
    let newUrl: string;
    try {
      newUrl = await saveServiceImage(imageEntry);
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
    const old = aboutImage;
    aboutImage = newUrl;
    if (old) {
      await removeServiceImage(old).catch(() => {});
    }
  }

  let brandLogo = existing?.brandLogo ?? null;
  const logoClear = str(form, "brandLogoClear") === "on";
  const logoEntry = form.get("brandLogo");
  if (logoClear) {
    await removeServiceImage(brandLogo).catch(() => {});
    brandLogo = null;
  } else if (logoEntry instanceof File && logoEntry.size > 0) {
    let newLogoUrl: string;
    try {
      newLogoUrl = await saveServiceImage(logoEntry);
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
    const oldLogo = brandLogo;
    brandLogo = newLogoUrl;
    if (oldLogo) {
      await removeServiceImage(oldLogo).catch(() => {});
    }
  }

  try {
    await prisma.siteSetting.upsert({
      where: { id: SINGLETON },
      create: {
        id: SINGLETON,
        aboutTitle,
        aboutEnabled,
        aboutDescription,
        aboutImage,
        aboutBullets,
        brandName,
        brandSubtitle,
        brandLogo,
      },
      update: {
        aboutEnabled,
        aboutTitle,
        aboutDescription,
        aboutImage,
        aboutBullets,
        brandName,
        brandSubtitle,
        brandLogo,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Gagal menyimpan pengaturan. Coba lagi." },
      { status: 500 }
    );
  }
}

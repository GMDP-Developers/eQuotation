import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { SiteSettingsForm } from "@/components/admin/site-settings-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pengaturan",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const setting = await prisma.siteSetting.findUnique({
    where: { id: "singleton" },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <SiteSettingsForm
        initial={
          setting
            ? {
                aboutTitle: setting.aboutTitle,
                aboutDescription: setting.aboutDescription,
                aboutImage: setting.aboutImage,
                aboutBullets: setting.aboutBullets,
                brandName: setting.brandName,
                brandSubtitle: setting.brandSubtitle,
                brandLogo: setting.brandLogo,
              }
            : null
        }
      />
    </div>
  );
}

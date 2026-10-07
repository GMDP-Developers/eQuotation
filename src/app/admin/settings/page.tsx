import { redirect } from "next/navigation";

import { SiteSettingsForm } from "@/components/admin/site-settings-form";
import { auth } from "@/lib/auth";
import { getBrand } from "@/lib/brand";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pengaturan",
};

export default async function SettingsPage() {
  const session = await auth();
  // guarded by AdminLayout (!session?.user); kept for direct-route safety
  if (!session?.user) {
    redirect("/login");
  }

  const setting = await getBrand();

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
                aboutEnabled: setting.aboutEnabled ?? true,
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

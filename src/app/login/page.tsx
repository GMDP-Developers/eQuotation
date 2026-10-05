import { LoginPanel } from "@/components/login-panel";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const setting = await prisma.siteSetting.findUnique({
    where: { id: "singleton" },
  });

  return (
    <LoginPanel
      brandName={setting?.brandName ?? "eQuotation"}
      brandSubtitle={setting?.brandSubtitle ?? "Service Request"}
      brandLogo={setting?.brandLogo ?? null}
    />
  );
}

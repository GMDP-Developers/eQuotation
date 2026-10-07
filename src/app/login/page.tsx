import { LoginPanel } from "@/components/login-panel";
import { getBrand } from "@/lib/brand";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const setting = await getBrand();

  return (
    <LoginPanel
      brandName={setting?.brandName ?? "eQuotation"}
      brandSubtitle={setting?.brandSubtitle ?? "Service Request"}
      brandLogo={setting?.brandLogo ?? null}
    />
  );
}

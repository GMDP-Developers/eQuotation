import type { ReactNode } from "react";

export function BrandLogo({
  src,
  alt = "",
  className,
  children,
}: {
  src: string | null;
  alt?: string;
  className?: string;
  children?: ReactNode;
}) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} />;
  }
  return <>{children}</>;
}

import Image from "next/image";
import Link from "next/link";

type BrandProps = { compact?: boolean; tagline?: string };

export function Brand({ compact = false, tagline = "Unleash your power" }: BrandProps) {
  return (
    <Link className="brand" href="/" aria-label="Kratos Fitness — home" data-testid="nav-home">
      <Image src="/img/Transparent logo.png" width={52} height={52} alt="" priority />
      {!compact ? (
        <span className="brand__wordmark">
          <strong>KRATOS</strong>
          <small>{tagline}</small>
        </span>
      ) : null}
    </Link>
  );
}

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Product } from "@/src/domain/products";
import { productRoute } from "@/src/domain/routes";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const href = productRoute(product.slug);
  const titleId = `product-${product.slug}-title`;

  return (
    <article className="product-card" aria-labelledby={titleId}>
      <Link className="product-card__media-link" href={href} aria-label={`Bekijk ${product.name}`}>
        <div className="product-card__image">
          <Image
            src={product.image}
            alt={product.imageAlt}
            fill
            priority={priority}
            loading={priority ? undefined : "lazy"}
            sizes="(max-width: 560px) calc(100vw - 2.5rem), (max-width: 1100px) 50vw, 33vw"
          />
        </div>
      </Link>
      <div className="product-card__body">
        <div className="product-card__heading">
          <span className="eyebrow">{product.format}</span>
          <h2 id={titleId}>{product.name}</h2>
        </div>
        <p className="product-card__summary">{product.summary}</p>
        <ul className="product-card__highlights" aria-label="Kernpunten van dit traject">
          {product.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}
        </ul>
        <div className="product-card__footer">
          <p className="availability">Prijs en inhoud na bevestiging</p>
          <Link className="product-card__cta" href={href} data-testid="open-product">
            Bekijk traject <ArrowUpRight aria-hidden="true" size={18} />
          </Link>
        </div>
      </div>
    </article>
  );
}

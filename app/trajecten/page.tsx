import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { categoryFilters, categoryLabels, goalLabels } from "@/src/domain/products";
import { applyCmsProductPresentation, filterProducts, normalizeCategory, normalizeGoal } from "@/src/server/catalogue";
import { getPublishedCmsPage } from "@/src/cms/site-pages";

export const metadata: Metadata = { title: "Trajecten", description: "Bekijk de trainings- en coachingtrajecten van Kratos Fitness." };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function TrajectoriesPage({ searchParams }: Props) {
  const query = await searchParams;
  const category = normalizeCategory(query.categorie);
  const goal = normalizeGoal(query.doel);
  const content = await getPublishedCmsPage("trajecten");
  const products = filterProducts(category, goal).map((product) => applyCmsProductPresentation(product, content));

  return (
    <>
      <section className="catalogue-hero">
        <div className="site-container">
          <span className="eyebrow-pill">{content.hero_eyebrow}</span>
          <h1 className="display-title">{content.hero_title}<br /><span className="lime">{content.hero_accent}</span></h1>
          <p className="lead">{content.hero_intro}</p>
          <Link className="button button--outline" href="/intake?source=trajecten-hero">{content.hero_cta}</Link>
        </div>
      </section>
      <section className="section section--tight">
        <div className="site-container">
          <nav className="filter-bar" aria-label="Filter trajecten">
            {categoryFilters.map((key) => (
              <Link
                key={key}
                className="filter-link"
                href={goal ? `/trajecten?categorie=${key}&doel=${goal}` : `/trajecten?categorie=${key}`}
                aria-current={key === category ? "page" : undefined}
                data-testid="filter-products"
              >{categoryLabels[key]}</Link>
            ))}
          </nav>
          {goal ? <p className="muted">Gefilterd op doel: <strong className="lime">{goalLabels[goal]}</strong>. <Link href="/trajecten">Wis filter</Link></p> : null}
          {products.length ? (
            <div className="product-grid">{products.map((product, index) => <ProductCard key={product.id} product={product} priority={index < 3} />)}</div>
          ) : (
            <div className="empty-state"><h2>{content.empty_title}</h2><p>{content.empty_text}</p><Link className="button button--primary" href="/intake?source=trajecten-help">Plan een intake</Link></div>
          )}
          <div className="final-cta" data-sticky-final-sentinel style={{ marginTop: "3rem" }}>
            <span className="eyebrow">{content.final_eyebrow}</span>
            <h2 className="section-title">{content.final_title}<br /><span className="lime">{content.final_accent}</span></h2>
            <p>{content.final_text}</p>
            <Link className="button button--primary" href="/intake?source=trajecten-help">Plan een intake <ArrowRight aria-hidden="true" size={20} /></Link>
          </div>
        </div>
      </section>
    </>
  );
}

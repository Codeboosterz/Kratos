import type { Metadata } from "next";
import { IntakeForm } from "@/components/intake-form";
import { intakeSources, type IntakeInput } from "@/src/schemas/intake";
import { getProduct } from "@/src/server/catalogue";
import { getPublishedCmsPage } from "@/src/cms/site-pages";

export const metadata: Metadata = { title: "Plan een intake", description: "Vertel Kratos Fitness over je doel en voorkeursvorm." };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function IntakePage({ searchParams }: Props) {
  const query = await searchParams;
  const rawProduct = Array.isArray(query.product) ? query.product[0] : query.product;
  const rawSource = Array.isArray(query.source) ? query.source[0] : query.source;
  const product = rawProduct && getProduct(rawProduct) ? rawProduct : null;
  const source = rawSource && intakeSources.includes(rawSource as NonNullable<IntakeInput["source"]>)
    ? (rawSource as NonNullable<IntakeInput["source"]>)
    : null;
  const content = await getPublishedCmsPage("intake");

  return (
    <section className="section">
      <div className="site-container">
        <IntakeForm product={product} source={source} content={content} />
      </div>
    </section>
  );
}

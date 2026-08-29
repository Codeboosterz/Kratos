import type { Metadata } from "next";
import { Brand } from "@/components/brand";
import { CheckoutStatus } from "@/components/checkout-status";

export const metadata: Metadata = { title: "Betaalstatus", robots: { index: false, follow: false } };

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) { const query = await searchParams; const raw = Array.isArray(query.session_id) ? query.session_id[0] : query.session_id; return <div className="checkout-page" data-competing-sticky-action><header className="checkout-header"><div className="site-container"><Brand /></div></header><main className="narrow-container checkout-main"><CheckoutStatus sessionId={raw || null} /></main></div>; }

import type { MetadataRoute } from "next";
import { getProducts } from "@/src/server/catalogue";
import { trustedSiteOrigin } from "@/src/server/environment";

export default function sitemap(): MetadataRoute.Sitemap { const base = trustedSiteOrigin || "https://kratos.invalid"; const routes = ["", "/werkwijze", "/trajecten", "/resultaten", "/over-omar", "/gratis-tools", "/intake", "/contact", "/privacy", "/voorwaarden", "/cookies"]; return [...routes.map((route) => ({ url: `${base}${route}`, changeFrequency: "monthly" as const, priority: route === "" ? 1 : 0.7 })), ...getProducts().map((product) => ({ url: `${base}/trajecten/${product.slug}`, changeFrequency: "monthly" as const, priority: 0.6 }))]; }

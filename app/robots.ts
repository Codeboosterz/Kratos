import type { MetadataRoute } from "next";
import { trustedSiteOrigin } from "@/src/server/environment";

export default function robots(): MetadataRoute.Robots { return { rules: { userAgent: "*", allow: "/", disallow: ["/checkout/", "/api/"] }, sitemap: trustedSiteOrigin ? `${trustedSiteOrigin}/sitemap.xml` : undefined }; }

export const routes = {
  home: "/",
  trajectories: "/trajecten",
  results: "/resultaten",
  about: "/over-omar",
  tools: "/gratis-tools",
  intake: "/intake",
  checkoutSuccess: "/checkout/success",
  contact: "/contact",
  privacy: "/privacy",
  terms: "/voorwaarden",
  cookies: "/cookies",
} as const;

export type RouteId = keyof typeof routes;

export function productRoute(slug: string) {
  return `/trajecten/${encodeURIComponent(slug)}`;
}

export function checkoutRoute(slug: string) {
  return `/checkout/${encodeURIComponent(slug)}`;
}

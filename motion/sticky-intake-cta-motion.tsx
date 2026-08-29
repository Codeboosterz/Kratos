"use client";

import type { RefObject } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "motion/react";

type StickyIntakeCtaProps = {
  heroCtaSentinelRef: RefObject<HTMLElement | null>;
  finalCtaSentinelRef: RefObject<HTMLElement | null>;
};

export function StickyIntakeCta({
  heroCtaSentinelRef,
  finalCtaSentinelRef,
}: StickyIntakeCtaProps) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [hydrated, setHydrated] = useState(false);
  const heroCtaVisible = useInView(heroCtaSentinelRef, {
    amount: 0.15,
    margin: "-80px 0px 0px 0px",
  });
  const finalCtaVisible = useInView(finalCtaSentinelRef, { amount: 0.2 });

  useEffect(() => setHydrated(true), []);

  const blockedRoute =
    pathname.startsWith("/intake") || pathname.startsWith("/checkout");
  const show =
    hydrated && !blockedRoute && !heroCtaVisible && !finalCtaVisible;

  return (
    <AnimatePresence initial={false}>
      {show ? (
        <motion.aside
          key="sticky-intake-cta"
          aria-label="Intake plannen"
          className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 md:inset-x-auto md:bottom-auto md:right-6 md:top-24"
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
          transition={{
            duration: reduceMotion ? 0 : 0.32,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <Link
            href="/intake"
            className="flex min-h-14 items-center justify-center rounded-xl bg-[var(--kratos-lime)] px-6 font-bold text-[var(--kratos-carbon)] shadow-2xl outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            Plan een intake
          </Link>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

export function shouldShowStickyCta(input: {
  hydrated: boolean;
  blockedRoute: boolean;
  competingAction: boolean;
  heroVisible: boolean;
  finalVisible: boolean;
}) {
  return input.hydrated && !input.blockedRoute && !input.competingAction && !input.heroVisible && !input.finalVisible;
}

export function StickyIntakeCta() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [hydrated, setHydrated] = useState(false);
  const [heroVisible, setHeroVisible] = useState(true);
  const [finalVisible, setFinalVisible] = useState(false);
  const [competingAction, setCompetingAction] = useState(false);

  useEffect(() => {
    const hero = document.querySelector("[data-sticky-hero-sentinel]");
    const finalCta = document.querySelector("[data-sticky-final-sentinel]");
    const heroObserver = new IntersectionObserver(([entry]) => setHeroVisible(entry.isIntersecting), {
      threshold: 0.15,
      rootMargin: "-80px 0px 0px 0px",
    });
    const finalObserver = new IntersectionObserver(([entry]) => setFinalVisible(entry.isIntersecting), { threshold: 0.2 });
    const frame = requestAnimationFrame(() => {
      setHydrated(true);
      setCompetingAction(Boolean(document.querySelector("[data-competing-sticky-action]")));
      if (!hero || !finalCta) { setHeroVisible(true); setFinalVisible(false); return; }

      const heroRect = hero.getBoundingClientRect();
      const finalCtaRect = finalCta.getBoundingClientRect();
      setHeroVisible(heroRect.bottom > 80 && heroRect.top < window.innerHeight);
      setFinalVisible(finalCtaRect.bottom > 0 && finalCtaRect.top < window.innerHeight);

      heroObserver.observe(hero);
      finalObserver.observe(finalCta);
    });
    return () => { cancelAnimationFrame(frame); heroObserver.disconnect(); finalObserver.disconnect(); };
  }, [pathname]);

  const blockedRoute = pathname.startsWith("/intake") || pathname.startsWith("/checkout") || pathname.startsWith("/beheer");
  const show = shouldShowStickyCta({ hydrated, blockedRoute, competingAction, heroVisible, finalVisible });

  return (
    <AnimatePresence initial={false}>
      {show ? (
        <motion.aside
          key="sticky-intake"
          className="sticky-intake"
          aria-label="Intake plannen"
          data-testid="sticky-intake"
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: reduceMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link className="button button--primary" href="/intake?source=sticky">Plan een intake</Link>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}

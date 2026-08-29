"use client";

import { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type StickyIntakeCtaGsapProps = {
  heroCtaSelector: string;
  finalCtaSelector: string;
};

export function StickyIntakeCtaGsap({
  heroCtaSelector,
  finalCtaSelector,
}: StickyIntakeCtaGsapProps) {
  const scope = useRef<HTMLDivElement>(null);
  const sticky = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const blockedRoute =
    pathname.startsWith("/intake") || pathname.startsWith("/checkout");

  useGSAP(
    () => {
      if (blockedRoute) return;

      const element = sticky.current;
      const hero = document.querySelector(heroCtaSelector);
      const finalCta = document.querySelector(finalCtaSelector);
      if (!element || !hero || !finalCta) return;

      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      element.inert = true;
      gsap.set(element, {
        autoAlpha: 0,
        y: reduced ? 0 : 24,
        pointerEvents: "none",
      });

      const show = () => {
        element.inert = false;
        gsap.to(element, {
          autoAlpha: 1,
          y: 0,
          pointerEvents: "auto",
          duration: reduced ? 0 : 0.32,
          ease: "power3.out",
          overwrite: true,
        });
      };
      const hide = () => {
        element.inert = true;
        gsap.to(element, {
          autoAlpha: 0,
          y: reduced ? 0 : 16,
          pointerEvents: "none",
          duration: reduced ? 0 : 0.24,
          ease: "power2.in",
          overwrite: true,
        });
      };

      ScrollTrigger.create({
        trigger: hero,
        start: "bottom top+=80",
        endTrigger: finalCta,
        end: "top bottom-=96",
        onEnter: show,
        onEnterBack: show,
        onLeave: hide,
        onLeaveBack: hide,
      });

      return () => {
        element.inert = false;
      };
    },
    {
      scope,
      dependencies: [blockedRoute, heroCtaSelector, finalCtaSelector],
      revertOnUpdate: true,
    },
  );

  if (blockedRoute) return null;

  return (
    <div ref={scope}>
      <aside
        ref={sticky}
        aria-label="Intake plannen"
        className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 md:inset-x-auto md:bottom-auto md:right-6 md:top-24"
      >
        <Link href="/intake">Plan een intake</Link>
      </aside>
    </div>
  );
}

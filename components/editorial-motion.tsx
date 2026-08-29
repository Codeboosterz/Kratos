"use client";

import Image from "next/image";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { MOTION } from "@/motion/animation-tokens";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function EditorialReveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const scope = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (reducedMotion()) return;
    gsap.fromTo(scope.current, { y: MOTION.revealDistance, autoAlpha: 0 }, {
      y: 0, autoAlpha: 1, duration: MOTION.revealDuration, delay, ease: MOTION.easeOut,
      scrollTrigger: { trigger: scope.current, start: "top 88%", once: true },
    });
  }, { scope, dependencies: [delay], revertOnUpdate: true });
  return <div ref={scope} className={className}>{children}</div>;
}

export function BrandMarquee({ primary = "Reach your full potential", secondary = "Unleash your power" }: { primary?: string; secondary?: string }) {
  const scope = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const track = scope.current?.querySelector<HTMLElement>(".brand-marquee__track");
    if (!track) return;

    gsap.fromTo(track, { xPercent: 0 }, {
      xPercent: -50,
      duration: reducedMotion() ? 80 : 64,
      ease: "none",
      repeat: -1,
      force3D: true,
    });
  }, { scope, dependencies: [primary, secondary], revertOnUpdate: true });

  const group = (key: string) => (
    <div className="brand-marquee__group" key={key}>
      {Array.from({ length: 3 }, (_, index) => (
        <span className="brand-marquee__phrase" key={`${key}-${index}`}>
          <strong>{primary}</strong><i>•</i><span>{secondary}</span><i>•</i>
        </span>
      ))}
    </div>
  );

  return (
    <div ref={scope} className="brand-marquee" role="region" aria-label={`${primary} — ${secondary}`}>
      <div className="brand-marquee__track" aria-hidden="true">{group("a")}{group("b")}</div>
    </div>
  );
}

export function SplitTextHeading({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  const heading = useRef<HTMLHeadingElement>(null);

  useGSAP(() => {
    const element = heading.current;
    if (!element || reducedMotion()) return;

    const split = SplitText.create(element, {
      type: "lines",
      mask: "lines",
      autoSplit: true,
      onSplit(self) {
        return gsap.from(self.lines, {
          yPercent: 110,
          duration: MOTION.revealDuration,
          stagger: MOTION.revealStagger,
          ease: MOTION.easeOut,
          scrollTrigger: {
            trigger: element,
            start: "top 80%",
            once: true,
          },
        });
      },
    });

    return () => split.revert();
  }, { scope: heading, dependencies: [children], revertOnUpdate: true });

  return <h2 ref={heading} id={id} className={className}>{children}</h2>;
}

export function CommunityGrid({ images, centerImage }: { images: string[]; centerImage: string }) {
  const scope = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const root = scope.current;
    if (!root) return;
    const center = root.querySelector<HTMLElement>(".grid_item_middle");
    const surrounding = gsap.utils.toArray<HTMLElement>(".grid_item:not(.grid_item_middle)", root);
    const caption = root.querySelector<HTMLElement>(".community-reveal__caption");
    const sticky = root.querySelector<HTMLElement>(".grid_sticky");
    const stage = root.closest<HTMLElement>(".mission-community__stage");
    const backdrop = stage?.querySelector<HTMLElement>(".mission-community__backdrop");

    if (!center || !sticky) return;

    const centerX = () => center.offsetLeft + center.offsetWidth / 2;
    const centerY = () => center.offsetTop + center.offsetHeight / 2;
    const travelX = (element: HTMLElement) => centerX() - (element.offsetLeft + element.offsetWidth / 2);
    const travelY = (element: HTMLElement) => centerY() - (element.offsetTop + element.offsetHeight / 2);
    const distanceFromCenter = (element: HTMLElement) => Math.hypot(travelX(element), travelY(element));

    const isCompact = () => window.matchMedia("(max-width: 900px)").matches;
    const headerOffset = () => Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--site-header-height"),
    ) || 76;
    const pinDistance = () => isCompact()
      ? Math.max(window.innerHeight * 1.1, 780)
      : Math.max(window.innerHeight * 2, 1_800);
    const initialScale = () => isCompact()
      ? Math.min(3, Math.max(1.6, (window.innerWidth - 40) / center.offsetWidth))
      : 3;
    const orderedSurrounding = [...surrounding].sort((a, b) => distanceFromCenter(a) - distanceFromCenter(b));
    let captionIsExpanded = false;
    const setCaption = (expanded: boolean) => {
      if (!caption || captionIsExpanded === expanded) return;
      captionIsExpanded = expanded;
      caption.textContent = expanded ? "Niet alleen bij Kratos" : "Solo missie?";
    };

    root.dataset.communityProgress = "0.0000";

    const timeline = gsap.timeline({
      scrollTrigger: {
        id: "home-community-reveal",
        trigger: root,
        start: () => `top top+=${headerOffset()}`,
        end: () => `+=${pinDistance()}`,
        // Refresh the community range before the adjacent Faith story.
        refreshPriority: 10,
        scrub: MOTION.communityScrub,
        // CSS sticky owns the hold/release geometry. GSAP only scrubs visuals,
        // avoiding fixed-position activation flicker and generated spacers.
        invalidateOnRefresh: true,
        onRefresh: (self) => {
          root.dataset.communityPinStart = String(Math.round(self.start));
          root.dataset.communityPinEnd = String(Math.round(self.end));
        },
        onUpdate: (self) => {
          root.dataset.communityProgress = self.progress.toFixed(4);
          setCaption(self.progress >= 0.58);
        },
        onLeave: (self) => {
          self.animation?.progress(1);
          root.dataset.communityProgress = "1.0000";
          setCaption(true);
        },
        onLeaveBack: (self) => {
          self.animation?.progress(0);
          root.dataset.communityProgress = "0.0000";
          setCaption(false);
        },
      },
    })
      .fromTo(center, {
        scale: initialScale,
        zIndex: 25,
        transformOrigin: "center center",
      }, {
        scale: 1,
        duration: 0.9,
        ease: "none",
      }, 0)
      .fromTo(orderedSurrounding, {
        x: (_, element: HTMLElement) => travelX(element),
        y: (_, element: HTMLElement) => travelY(element),
        scale: 0.2,
        autoAlpha: 0,
        transformOrigin: "center center",
      }, {
        x: 0,
        y: 0,
        scale: 1,
        autoAlpha: 1,
        duration: 1.2,
        stagger: { amount: 0.85, from: "start" },
        ease: "none",
        force3D: true,
      }, 0.22);

    if (backdrop) timeline.to(backdrop, { autoAlpha: 1, duration: 0.72, ease: "none" }, 0.32);
    if (caption) timeline.to(caption, { color: "#f4f6ef", duration: 0.72, ease: "none" }, 0.32);

    // Keep the completed community grid pinned briefly before the next section is released.
    timeline.to({}, { duration: 0.32 });

    return () => {
      setCaption(false);
      delete root.dataset.communityProgress;
      delete root.dataset.communityPinStart;
      delete root.dataset.communityPinEnd;
    };
  }, { scope, dependencies: [images, centerImage], revertOnUpdate: true });

  const surroundingImages = images.filter((_, index) => index !== 7).slice(0, 14);
  const tiles = [
    ...surroundingImages.slice(0, 7),
    centerImage,
    ...surroundingImages.slice(7),
  ];

  return (
    <div ref={scope} className="community-reveal is-ready" role="region" aria-label="Kratos community in beeld">
      <div className="grid_sticky">
        <div className="community-grid grid_wrap">
          {tiles.map((src, index) => (
            <div className={`community-tile grid_item${index === 7 ? " grid_item_middle" : ""}`} key={`${src}-${index}`}>
              <Image
                src={src}
                alt={index === 7 ? "Omar, hoofdcoach van Kratos Fitness" : ""}
                fill
                sizes="(max-width: 760px) 30vw, 220px"
                priority={index === 7}
                loading={index === 7 ? undefined : src === "/img/hero-header.jpg" ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>
        <p className="community-reveal__caption" aria-live="polite">Solo missie?</p>
      </div>
    </div>
  );
}

export function ProcessTimeline({ items }: { items: Array<{ title: string; text: string }> }) {
  const scope = useRef<HTMLOListElement>(null);
  useGSAP(() => {
    if (reducedMotion()) return;
    const rows = gsap.utils.toArray<HTMLElement>("li", scope.current);
    gsap.from(rows, { x: -32, autoAlpha: 0, stagger: 0.13, duration: MOTION.revealDuration, ease: MOTION.easeOut, scrollTrigger: { trigger: scope.current, start: "top 84%", once: true } });
  }, { scope });
  return <ol ref={scope} className="process-timeline">{items.map((item, index) => <li key={item.title}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{item.title}</h3><p>{item.text}</p></div></li>)}</ol>;
}

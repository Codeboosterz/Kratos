"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useSyncExternalStore } from "react";
import { Dumbbell, HeartPulse, Target } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { MOTION_EASE } from "@/motion/animation-tokens";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const subscribeToHydration = () => () => undefined;

function useHydratedReducedMotion() {
  const prefersReducedMotion = useReducedMotion();
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);

  return hydrated && Boolean(prefersReducedMotion);
}

type HeroTitleProps = {
  lineOne: string;
  lineOneAccent: string;
  lineTwo: string;
  lineTwoAccent: string;
  motionMode: "slide" | "none";
};

export function HeroFirstScrollTitle({
  lineOne,
  lineOneAccent,
  lineTwo,
  lineTwoAccent,
  motionMode,
}: HeroTitleProps) {
  const scope = useRef<HTMLHeadingElement>(null);
  const reduceMotion = useHydratedReducedMotion();
  const [revealed, setRevealed] = useState(motionMode === "none");

  useGSAP(
    () => {
      if (motionMode === "none" || reduceMotion) {
        setRevealed(true);
        return;
      }

      if (window.scrollY > 1) {
        setRevealed(true);
        return;
      }

      ScrollTrigger.create({
        id: "home-hero-first-scroll",
        start: 1,
        end: "max",
        once: true,
        onEnter: () => setRevealed(true),
      });
    },
    { scope, dependencies: [motionMode, reduceMotion], revertOnUpdate: true },
  );

  const still = motionMode === "none" || reduceMotion;
  const transition = {
    duration: still ? 0 : 0.82,
    ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
  };

  return (
    <h1 ref={scope} id="home-title" className="display-title">
      {lineOne}{" "}
      <span className="motion-word-mask">
        <motion.span
          className="lime motion-word"
          initial={false}
          animate={revealed || still ? { opacity: 1, x: 0 } : { opacity: 0.42, x: "-108%" }}
          transition={transition}
        >
          {lineOneAccent}
        </motion.span>
      </span>
      <br />
      {lineTwo}{" "}
      <span className="motion-word-mask">
        <motion.span
          className="lime motion-word"
          initial={false}
          animate={revealed || still ? { opacity: 1, x: 0 } : { opacity: 0.42, x: "108%" }}
          transition={{ ...transition, delay: still ? 0 : 0.1 }}
        >
          {lineTwoAccent}
        </motion.span>
      </span>
    </h1>
  );
}

export function GoalBlinkSequence({ motionMode }: { motionMode: "blink" | "none" }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (motionMode === "none" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const cards = gsap.utils.toArray<HTMLElement>(".goal-card", scope.current);
      if (!cards.length) return;

      const timeline = gsap.timeline({
        scrollTrigger: {
          id: "home-goal-blink-sequence",
          trigger: scope.current,
          start: "top 76%",
          once: true,
        },
      });

      cards.forEach((card, index) => {
        const at = index * 0.34;
        timeline
          .to(card, { autoAlpha: 0.22, scale: 0.985, duration: 0.1, ease: "power1.in" }, at)
          .to(card, {
            autoAlpha: 1,
            scale: 1.025,
            borderColor: "rgba(185, 234, 104, 0.96)",
            duration: 0.18,
            ease: "power3.out",
          })
          .to(card, {
            scale: 1,
            borderColor: "rgba(244, 246, 239, 0.14)",
            duration: 0.24,
            ease: "power2.out",
          });
      });
    },
    { scope, dependencies: [motionMode], revertOnUpdate: true },
  );

  return (
    <div ref={scope} className="goal-grid">
      <Link className="goal-card" href="/trajecten?doel=afvallen">
        <Target aria-hidden="true" size={38} /><div><h3>Afvallen</h3><p>Bouw aan een aanpak die vol te houden is.</p></div>
      </Link>
      <Link className="goal-card goal-card--orange" href="/trajecten?doel=spieropbouw">
        <Dumbbell aria-hidden="true" size={38} /><div><h3>Spieropbouw</h3><p>Werk doelgericht aan kracht en opbouw.</p></div>
      </Link>
      <Link className="goal-card" href="/trajecten?doel=fit-sterk">
        <HeartPulse aria-hidden="true" size={38} /><div><h3>Fit &amp; sterk</h3><p>Maak bewegen een sterk onderdeel van je ritme.</p></div>
      </Link>
    </div>
  );
}

type MethodHeadingProps = {
  firstLineMode: "typewriter" | "none";
  secondLineMode: "slide_up" | "none";
  firstLine?: string;
  secondLine?: string;
};

const characterVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.01 } },
};

export function AnimatedMethodHeading({ firstLineMode, secondLineMode, firstLine = "Geen los schema.", secondLine = "Wel een duidelijke route." }: MethodHeadingProps) {
  const scope = useRef<HTMLHeadingElement>(null);
  const reduceMotion = useHydratedReducedMotion();
  const [started, setStarted] = useState(firstLineMode === "none" && secondLineMode === "none");
  const still = Boolean(reduceMotion) || (firstLineMode === "none" && secondLineMode === "none");

  useGSAP(
    () => {
      if (still) {
        setStarted(true);
        return;
      }

      ScrollTrigger.create({
        id: "home-method-copy",
        trigger: scope.current,
        start: "top 82%",
        once: true,
        onEnter: () => setStarted(true),
      });
    },
    { scope, dependencies: [still], revertOnUpdate: true },
  );

  const typingDuration = firstLineMode === "typewriter" && !still ? firstLine.length * 0.045 : 0;

  return (
    <h2 ref={scope} id="method-title" className="section-title animated-method-title">
      {firstLineMode === "typewriter" && !still ? (
        <>
          <span className="sr-only">{firstLine}</span>
          <motion.span
            className="typewriter-line"
            aria-hidden="true"
            initial="hidden"
            animate={started ? "visible" : "hidden"}
            variants={{ visible: { transition: { staggerChildren: 0.045 } } }}
          >
            {Array.from(firstLine).map((character, index) => (
              <motion.span key={`${character}-${index}`} variants={characterVariants}>
                {character === " " ? "\u00a0" : character}
              </motion.span>
            ))}
            <motion.i
              className="typewriter-caret"
              initial={false}
              animate={started ? { opacity: [1, 0, 1, 0] } : { opacity: 0 }}
              transition={{ duration: 0.65, repeat: started ? Math.max(1, Math.ceil(typingDuration / 0.65)) : 0 }}
            />
          </motion.span>
        </>
      ) : firstLine}
      <br />
      <motion.span
        className="lime motion-line"
        initial={false}
        animate={started || secondLineMode === "none" || still ? { opacity: 1, y: 0 } : { opacity: 0, y: 42 }}
        transition={{
          duration: secondLineMode === "none" || still ? 0 : 0.72,
          delay: secondLineMode === "none" || still ? 0 : typingDuration + 0.12,
          ease: MOTION_EASE,
        }}
      >
        {secondLine}
      </motion.span>
    </h2>
  );
}

export function ScrollAccent({
  children,
  enabled = true,
  direction = "left",
}: {
  children: React.ReactNode;
  enabled?: boolean;
  direction?: "left" | "right";
}) {
  const scope = useRef<HTMLSpanElement>(null);
  const reduceMotion = useHydratedReducedMotion();
  const [visible, setVisible] = useState(!enabled);

  useGSAP(
    () => {
      if (!enabled || reduceMotion) {
        setVisible(true);
        return;
      }
      ScrollTrigger.create({
        trigger: scope.current,
        start: "top 88%",
        once: true,
        onEnter: () => setVisible(true),
      });
    },
    { scope, dependencies: [enabled, reduceMotion], revertOnUpdate: true },
  );

  return (
    <span ref={scope} className="motion-word-mask">
      <motion.span
        className="lime motion-word"
        initial={false}
        animate={visible ? { opacity: 1, x: 0 } : { opacity: 0.35, x: direction === "left" ? -52 : 52 }}
        transition={{ duration: reduceMotion ? 0 : 0.82, ease: MOTION_EASE }}
      >
        {children}
      </motion.span>
    </span>
  );
}

export type ClientStory = { label: string; title: string; text: string; image: string };

export function ClientStoriesRail({ motionMode, stories }: { motionMode: "scroll" | "none"; stories: ClientStory[] }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (motionMode === "none" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const cards = gsap.utils.toArray<HTMLElement>(".client-story-card", scope.current);
      gsap.from(cards, {
        x: 48,
        autoAlpha: 0,
        duration: 0.92,
        stagger: 0.1,
        ease: "power4.out",
        scrollTrigger: {
          id: "results-client-stories",
          trigger: scope.current,
          start: "top 82%",
          once: true,
        },
      });
    },
    { scope, dependencies: [motionMode], revertOnUpdate: true },
  );

  return (
    <div ref={scope} className="client-stories-shell">
      <div className="client-stories-toolbar">
        <span>Scroll voor meer</span>
        <span aria-hidden="true">← &nbsp; →</span>
      </div>
      <div className="client-stories-rail" role="region" aria-label="Voorbeeldindeling voor toekomstige cliëntverhalen" tabIndex={0}>
        {stories.map((story) => (
          <article className="client-story-card" key={story.label}>
            <div className="client-story-card__image">
              <Image
                src={story.image}
                alt=""
                fill
                loading={story.image === "/img/hero-header.jpg" ? "eager" : "lazy"}
                sizes="(max-width: 720px) 82vw, 360px"
              />
              <span>Voorbeeldkader</span>
            </div>
            <div className="client-story-card__body">
              <span className="eyebrow">{story.label}</span>
              <h3>{story.title}</h3>
              <p>{story.text}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

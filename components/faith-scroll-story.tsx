"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Stepper, StepperIndicator, StepperItem, StepperSeparator } from "@/components/ui/stepper";
import { MOTION } from "@/motion/animation-tokens";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export type FaithStoryStep = {
  title: string;
  text: string;
  image_url: string;
  image_alt: string;
};

type Props = {
  eyebrow: string;
  title: string;
  subtitle: string;
  intro: string;
  steps: FaithStoryStep[];
};

function twoDigits(value: number) {
  return String(value).padStart(2, "0");
}

function stepNumber(index: number) {
  return twoDigits(index + 1);
}

export function FaithScrollStory({ eyebrow, title, subtitle, intro, steps }: Props) {
  const scope = useRef<HTMLElement>(null);
  const [activeStep, setActiveStep] = useState(1);

  useGSAP(() => {
    const root = scope.current;
    if (!root) return;

    const pin = root.querySelector<HTMLElement>(".faith-story__pin");
    const viewport = root.querySelector<HTMLElement>(".faith-story__filmstrip");
    const track = root.querySelector<HTMLElement>(".faith-story__track");
    const copyPanels = gsap.utils.toArray<HTMLElement>(".faith-story__copy-panel", root);
    const cards = gsap.utils.toArray<HTMLElement>(".faith-story__card", root);
    if (!pin || !viewport || !track || copyPanels.length !== steps.length || cards.length !== steps.length) return;

    const applyActiveStep = (activeIndex: number) => {
      copyPanels.forEach((panel, index) => {
        const active = index === activeIndex;
        panel.dataset.storyActive = String(active);
        panel.setAttribute("aria-hidden", String(!active));
      });
      cards.forEach((card, index) => {
        card.dataset.storyActive = String(index === activeIndex);
      });
      root.dataset.storyStep = String(activeIndex + 1);
      setActiveStep(activeIndex + 1);
    };

    root.dataset.storyMode = "static";
    root.dataset.storyStep = "1";
    root.dataset.storyProgress = "0.000";
    applyActiveStep(0);

    const media = gsap.matchMedia();
    // Keep the approved editorial composition on every desktop. The in-app
    // browser can inherit an OS-level reduced-motion preference even when the
    // visitor explicitly expects the scroll story, so only the viewport
    // breakpoint selects the static/mobile treatment.
    media.add("(min-width: 901px)", () => {
      root.dataset.storyMode = "pinned";

      const centerCard = (index: number) => {
        const card = cards[index];
        return viewport.clientWidth / 2 - (card.offsetLeft + card.offsetWidth / 2);
      };

      gsap.set(copyPanels, { autoAlpha: 0, yPercent: 108 });
      gsap.set(copyPanels[0], { autoAlpha: 1, yPercent: 0 });
      gsap.set(cards, {
        clipPath: "inset(0% 0% 42% 0% round 24px)",
        opacity: 0.68,
        scale: 0.84,
        transformOrigin: "center center",
        zIndex: 1,
      });
      gsap.set(cards[0], {
        clipPath: "inset(0% 0% 0% 0% round 24px)",
        opacity: 1,
        scale: 1.18,
        zIndex: 8,
      });
      gsap.set(track, { x: () => centerCard(0), force3D: true });
      applyActiveStep(0);

      let lastActiveIndex = 0;
      const syncVisualState = (visualProgress: number) => {
        const activeIndex = Math.min(steps.length - 1, Math.floor(visualProgress * steps.length));
        root.dataset.storyProgress = visualProgress.toFixed(3);
        if (activeIndex !== lastActiveIndex) {
          lastActiveIndex = activeIndex;
          applyActiveStep(activeIndex);
        }
      };

      let timeline: gsap.core.Timeline | null = null;
      timeline = gsap.timeline({
        defaults: { ease: "none" },
        onUpdate: () => {
          if (timeline) syncVisualState(timeline.progress());
        },
        scrollTrigger: {
          id: "home-faith-filmstrip",
          trigger: root,
          start: () => {
            const headerHeight = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--site-header-height")) || 76;
            return `top top+=${headerHeight}`;
          },
          end: () => `+=${Math.max(window.innerHeight * steps.length * 0.92, 3_600)}`,
          pin,
          pinSpacing: true,
          scrub: MOTION.faithScrub,
          // This scene follows another pin. Early pin anticipation can make it
          // activate before the community scene has completely cleared.
          anticipatePin: 0,
          invalidateOnRefresh: true,
          onRefresh: (self) => {
            root.dataset.storyPinStart = Math.round(self.start).toString();
            root.dataset.storyPinEnd = Math.round(self.end).toString();
          },
          onUpdate: (self) => syncVisualState(self.animation?.progress() ?? self.progress),
        },
      });

      timeline.to({}, { duration: steps.length }, 0);

      steps.forEach((_, index) => {
        if (index === 0) return;
        const previousCopy = copyPanels[index - 1];
        const currentCopy = copyPanels[index];
        const previousCard = cards[index - 1];
        const currentCard = cards[index];
        const olderCopies = copyPanels.slice(0, Math.max(0, index - 1));
        const at = index;

        if (olderCopies.length > 0) timeline.set(olderCopies, { autoAlpha: 0 }, at);

        timeline
          .to(previousCopy, { autoAlpha: 0.14, yPercent: -82, duration: 0.34, ease: "power2.inOut" }, at)
          .to(currentCopy, { autoAlpha: 1, yPercent: 0, duration: 0.42, ease: "power3.out" }, at + 0.05)
          .to(track, { x: () => centerCard(index), duration: 0.62, ease: "none" }, at)
          .to(previousCard, {
            clipPath: "inset(0% 0% 42% 0% round 24px)",
            opacity: 0.68,
            scale: 0.84,
            zIndex: 1,
            duration: 0.44,
            ease: "power2.inOut",
          }, at)
          .to(currentCard, {
            clipPath: "inset(0% 0% 0% 0% round 24px)",
            opacity: 1,
            scale: 1.18,
            zIndex: 8,
            duration: 0.5,
            ease: "power3.out",
          }, at + 0.04);
      });

      timeline.to({}, { duration: 0.42 }, steps.length - 0.42);

      // Card geometry is fixed by CSS, so image decoding cannot change the pin
      // positions. Refresh once after both sibling effects and fonts settle;
      // refreshing for every lazy image caused the two pins to overlap briefly.
      return () => {
        root.dataset.storyMode = "static";
        delete root.dataset.storyPinStart;
        delete root.dataset.storyPinEnd;
        root.dataset.storyProgress = "0.000";
        applyActiveStep(0);
      };
    });

    return () => media.revert();
  }, { scope, dependencies: [steps], revertOnUpdate: true });

  return (
    <section
      ref={scope}
      className="editorial-light faith-section faith-story"
      aria-labelledby="faith-title"
      data-story-mode="static"
      data-story-step="1"
      data-story-progress="0.000"
      data-testid="faith-scroll-story"
    >
      <div className="faith-story__pin">
        <div className="site-container faith-story__layout">
          <header className="faith-story__intro">
            <span className="eyebrow">{eyebrow}</span>
            <h2 id="faith-title" className="section-title">{title}</h2>
            <div className="sr-only">
              <h3>{subtitle}</h3>
              <p>{intro}</p>
            </div>
          </header>

          <div className="faith-story__desktop-stage">
            <div className="faith-story__copy-viewport">
              <span className="faith-story__copy-rail" aria-hidden="true" />
              {steps.map((step, index) => (
                <article className="faith-story__copy-panel" data-story-active={String(index === 0)} aria-hidden={index !== 0} key={`${step.title}-copy-${index}`}>
                  <span className="faith-story__number">{stepNumber(index)} / {twoDigits(steps.length)}</span>
                  <h4>{step.title}</h4>
                  <p>{step.text}</p>
                </article>
              ))}
            </div>

            <div className="faith-story__filmstrip">
              <div className="faith-story__track">
                {steps.map((step, index) => (
                  <figure className="faith-story__card" data-story-active={String(index === 0)} key={`${step.title}-card-${index}`}>
                    <Image src={step.image_url} alt={step.image_alt} fill loading={index === 0 ? "eager" : "lazy"} sizes="(max-width: 900px) 90vw, 22vw" />
                    <figcaption><span>{stepNumber(index)}</span>{step.title}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </div>

          <div className="faith-story__progress-shell">
            <Stepper value={activeStep} className="faith-story__stepper" aria-label="Voortgang van het Faith & Fitness-verhaal">
              {steps.map((step, index) => {
                const stepValue = index + 1;
                return (
                  <StepperItem
                    className="faith-story__step"
                    step={stepValue}
                    aria-current={stepValue === activeStep ? "step" : undefined}
                    aria-label={`${stepNumber(index)} ${step.title}`}
                    key={`${step.title}-progress`}
                  >
                    <StepperIndicator className="faith-story__step-indicator">
                      {stepNumber(index)}
                    </StepperIndicator>
                    {index < steps.length - 1 ? <StepperSeparator className="faith-story__step-separator" /> : null}
                  </StepperItem>
                );
              })}
            </Stepper>
          </div>

          <div className="faith-story__mobile-chapters">
            <header className="faith-story__mobile-context">
              <h3>{subtitle}</h3>
              <p>{intro}</p>
            </header>
            {steps.map((step, index) => (
              <article className="faith-story__mobile-chapter" key={`${step.title}-mobile-${index}`}>
                <div>
                  <span className="faith-story__number">{stepNumber(index)} / {twoDigits(steps.length)}</span>
                  <h4>{step.title}</h4>
                  <p>{step.text}</p>
                </div>
                <figure className="faith-story__mobile-image">
                  <Image src={step.image_url} alt={step.image_alt} fill sizes="(max-width: 900px) 92vw, 48vw" />
                </figure>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

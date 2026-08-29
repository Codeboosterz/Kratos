"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight } from "lucide-react";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { HeroFirstScrollTitle } from "@/components/hero-first-scroll-title";
import { MOTION } from "@/motion/animation-tokens";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const FRAME_COUNT = 121;
const FRAME_ANCHOR_STEP = 15;
const FRAME_WINDOW_BEHIND = 4;
const FRAME_WINDOW_AHEAD = 8;
const FRAME_RETENTION_RADIUS = 18;
const MAX_CONCURRENT_FRAME_LOADS = 3;

const FRAME_ANCHORS = Array.from(
  { length: Math.ceil((FRAME_COUNT - 1) / FRAME_ANCHOR_STEP) + 1 },
  (_, index) => Math.min(index * FRAME_ANCHOR_STEP, FRAME_COUNT - 1),
);
const FRAME_ANCHOR_SET = new Set(FRAME_ANCHORS);

function frameSource(index: number) {
  return `/hero-frames/frame_${String(index + 1).padStart(3, "0")}.jpg`;
}

function frameWindow(target: number, direction: 1 | -1) {
  const ordered = [target];
  const furthestOffset = Math.max(FRAME_WINDOW_BEHIND, FRAME_WINDOW_AHEAD);

  for (let offset = 1; offset <= furthestOffset; offset += 1) {
    if (offset <= FRAME_WINDOW_AHEAD) ordered.push(target + offset * direction);
    if (offset <= FRAME_WINDOW_BEHIND) ordered.push(target - offset * direction);
  }

  return ordered.filter((index) => index >= 0 && index < FRAME_COUNT);
}

type HomeScrollHeroProps = {
  eyebrow: string;
  titleLineOne: string;
  titleLineOneAccent: string;
  titleLineTwo: string;
  titleLineTwoAccent: string;
  intro: string;
  primaryCtaHref: string;
  primaryCtaLabel: string;
  posterSrc: string;
  posterAlt: string;
  motionMode: "slide" | "none";
};

export function HomeScrollHero({
  eyebrow,
  titleLineOne,
  titleLineOneAccent,
  titleLineTwo,
  titleLineTwoAccent,
  intro,
  primaryCtaHref,
  primaryCtaLabel,
  posterSrc,
  posterAlt,
  motionMode,
}: HomeScrollHeroProps) {
  const scope = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const endTaglineRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const section = scope.current;
      const canvas = canvasRef.current;
      const copy = copyRef.current;
      const veil = veilRef.current;
      const cue = cueRef.current;
      const progress = progressRef.current;
      const endTagline = endTaglineRef.current;

      if (!section || !canvas || !copy || !veil || !cue || !progress || !endTagline) return;

      const media = gsap.matchMedia();

      media.add(
        "(min-width: 901px)",
        () => {
          const context = canvas.getContext("2d", { alpha: false });
          if (!context) return;

          const minimizeMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          const endTaglineLines = gsap.utils.toArray<HTMLElement>(
            ".home-scroll-hero__end-tagline-line > span",
            endTagline,
          );

          const frames: Array<HTMLImageElement | undefined> = new Array(FRAME_COUNT);
          const frameState = { value: 0 };
          const failedFrames = new Set<number>();
          const queuedFrames = new Set<number>();
          const loadingFrames = new Set<number>();
          let loadQueue: number[] = [];
          let activeLoads = 0;
          let loadedFrames = 0;
          let cancelled = false;
          let drawnFrame = -1;
          let currentTarget = 0;
          let lastTarget = 0;
          let anchorPrimeTimer: number | undefined;
          let renderWidth = 0;
          let renderHeight = 0;

          const syncCanvasSize = () => {
            const cssWidth = Math.max(1, canvas.clientWidth);
            const cssHeight = Math.max(1, canvas.clientHeight);
            const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
            const nextWidth = Math.round(cssWidth * pixelRatio);
            const nextHeight = Math.round(cssHeight * pixelRatio);

            if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
              canvas.width = nextWidth;
              canvas.height = nextHeight;
              renderWidth = cssWidth;
              renderHeight = cssHeight;
              context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
              context.imageSmoothingEnabled = true;
              context.imageSmoothingQuality = "high";
              drawnFrame = -1;
            }
          };

          const nearestLoadedFrame = (target: number) => {
            if (frames[target]) return target;
            for (let distance = 1; distance < FRAME_COUNT; distance += 1) {
              const before = target - distance;
              const after = target + distance;
              if (before >= 0 && frames[before]) return before;
              if (after < FRAME_COUNT && frames[after]) return after;
            }
            return -1;
          };

          const drawFrame = (force = false) => {
            syncCanvasSize();
            const requestedFrame = Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(frameState.value)));
            const availableFrame = nearestLoadedFrame(requestedFrame);
            if (availableFrame < 0 || (!force && availableFrame === drawnFrame)) return;

            const image = frames[availableFrame];
            if (!image) return;

            const sourceWidth = image.naturalWidth || image.width;
            const sourceHeight = image.naturalHeight || image.height;
            const scale = Math.max(renderWidth / sourceWidth, renderHeight / sourceHeight);
            const width = sourceWidth * scale;
            const height = sourceHeight * scale;
            const overflowX = Math.max(0, width - renderWidth);
            const x = -overflowX * 0.46;
            const y = (renderHeight - height) / 2;

            context.clearRect(0, 0, renderWidth, renderHeight);
            context.drawImage(image, x, y, width, height);
            drawnFrame = availableFrame;
            canvas.dataset.frame = String(availableFrame + 1).padStart(3, "0");
          };

          const updateSequenceMetrics = () => {
            section.dataset.sequenceLoaded = String(loadedFrames);
            section.dataset.sequenceRetained = String(frames.filter(Boolean).length);
          };

          const evictDistantFrames = (target: number) => {
            frames.forEach((image, index) => {
              if (
                image
                && !FRAME_ANCHOR_SET.has(index)
                && Math.abs(index - target) > FRAME_RETENTION_RADIUS
              ) {
                frames[index] = undefined;
              }
            });
            updateSequenceMetrics();
          };

          const loadFrame = (index: number) => new Promise<boolean>((resolve) => {
            if (cancelled || frames[index] || failedFrames.has(index)) {
              resolve(Boolean(frames[index]));
              return;
            }

            const image = new window.Image();
            image.decoding = "async";
            image.fetchPriority = "low";
            image.onload = () => {
              if (cancelled) {
                resolve(false);
                return;
              }
              frames[index] = image;
              loadedFrames += 1;
              evictDistantFrames(currentTarget);
              drawFrame();
              resolve(true);
            };
            image.onerror = () => {
              failedFrames.add(index);
              resolve(false);
            };
            image.src = frameSource(index);
          });

          const pumpLoadQueue = () => {
            while (!cancelled && activeLoads < MAX_CONCURRENT_FRAME_LOADS && loadQueue.length > 0) {
              const index = loadQueue.shift();
              if (index === undefined) break;
              queuedFrames.delete(index);

              if (frames[index] || loadingFrames.has(index) || failedFrames.has(index)) continue;

              activeLoads += 1;
              loadingFrames.add(index);
              void loadFrame(index).finally(() => {
                activeLoads -= 1;
                loadingFrames.delete(index);
                pumpLoadQueue();
              });
            }
          };

          const replaceLoadQueue = (priorityFrames: number[]) => {
            const nextQueue = [...priorityFrames, ...FRAME_ANCHORS].filter((index, position, items) => (
              items.indexOf(index) === position
              && !frames[index]
              && !loadingFrames.has(index)
              && !failedFrames.has(index)
            ));

            loadQueue = nextQueue;
            queuedFrames.clear();
            nextQueue.forEach((index) => queuedFrames.add(index));
            pumpLoadQueue();
          };

          const requestFramesForTarget = (target: number) => {
            const direction: 1 | -1 = target >= lastTarget ? 1 : -1;
            lastTarget = target;
            currentTarget = target;
            evictDistantFrames(target);
            replaceLoadQueue(frameWindow(target, direction));
          };

          const updateFrame = () => {
            const target = Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(frameState.value)));
            if (target !== currentTarget) requestFramesForTarget(target);
            drawFrame();
          };

          const loadSequenceStart = async () => {
            const firstFrameLoaded = await loadFrame(0);
            if (!firstFrameLoaded || cancelled) return;

            drawFrame(true);
            section.classList.add("is-frame-ready");
            section.dataset.sequenceReady = "true";

            // Coarse anchors make large scroll jumps visually stable. Detailed frames
            // are requested only around the user's current position.
            anchorPrimeTimer = window.setTimeout(() => {
              replaceLoadQueue(FRAME_ANCHORS.filter((index) => index !== 0));
            }, 400);
          };

          const resizeObserver = new ResizeObserver(() => drawFrame(true));
          resizeObserver.observe(canvas);

          gsap.set(progress, { scaleX: 0, transformOrigin: "left center" });
          gsap.set(canvas, { scale: 1, transformOrigin: "center center" });
          gsap.set(endTagline, { autoAlpha: 0 });
          gsap.set(endTaglineLines, {
            autoAlpha: 0,
            yPercent: minimizeMotion ? 0 : 115,
          });

          const timeline = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              id: "home-scroll-frame-hero",
              trigger: section,
              start: "top top+=76",
              end: "bottom bottom",
              scrub: minimizeMotion ? true : MOTION.scrollScrub,
              invalidateOnRefresh: true,
              onRefresh: () => drawFrame(true),
              onUpdate: (self) => {
                section.dataset.scrollProgress = self.progress.toFixed(3);
              },
            },
          });

          timeline
            .to(frameState, { value: FRAME_COUNT - 1, duration: 1, onUpdate: updateFrame }, 0)
            .to(progress, { scaleX: 1, duration: 1 }, 0);

          if (minimizeMotion) {
            timeline
              .to(copy, { autoAlpha: 0, duration: 0.12 }, 0.045)
              .to(veil, { opacity: 0.34, duration: 0.12 }, 0.045)
              .to(cue, { autoAlpha: 0, duration: 0.06 }, 0.01)
              .to(endTagline, { autoAlpha: 1, duration: 0.1 }, 0.86)
              .to(endTaglineLines, { autoAlpha: 1, duration: 0.1 }, 0.86);
          } else {
            timeline
              .to(canvas, { scale: 1.025, duration: 1 }, 0)
              .to(copy, { autoAlpha: 0, xPercent: -9, duration: 0.14 }, 0.045)
              .to(veil, { opacity: 0.34, duration: 0.18 }, 0.045)
              .to(cue, { autoAlpha: 0, y: 12, duration: 0.08 }, 0.01)
              .to(endTagline, { autoAlpha: 1, duration: 0.025 }, 0.84)
              .to(
                endTaglineLines,
                {
                  autoAlpha: 1,
                  yPercent: 0,
                  duration: 0.13,
                  stagger: 0.025,
                  ease: "power3.out",
                },
                0.84,
              );
          }

          void loadSequenceStart();

          return () => {
            cancelled = true;
            if (anchorPrimeTimer !== undefined) window.clearTimeout(anchorPrimeTimer);
            loadQueue = [];
            queuedFrames.clear();
            resizeObserver.disconnect();
            section.classList.remove("is-frame-ready");
            delete section.dataset.sequenceReady;
            delete section.dataset.sequenceLoaded;
            delete section.dataset.sequenceRetained;
            delete section.dataset.scrollProgress;
            delete canvas.dataset.frame;
          };
        },
      );

      return () => media.revert();
    },
    { scope },
  );

  return (
    <section ref={scope} className="home-scroll-hero" aria-labelledby="home-title" data-testid="scroll-hero">
      <span className="home-scroll-hero__sentinel" data-sticky-hero-sentinel aria-hidden="true" />
      <div className="home-scroll-hero__sticky">
        <div className="home-scroll-hero__poster-frame">
          <Image
            className="home-scroll-hero__poster"
            src={posterSrc}
            alt={posterAlt}
            fill
            loading="eager"
            fetchPriority="high"
            sizes="100vw"
          />
        </div>
        <canvas ref={canvasRef} className="home-scroll-hero__canvas" aria-hidden="true" data-testid="scroll-hero-canvas" />
        <div ref={veilRef} className="home-scroll-hero__veil" aria-hidden="true" />
        <div className="home-scroll-hero__bottom-fade" aria-hidden="true" />

        <div className="site-container home-scroll-hero__content">
          <div ref={copyRef} className="home-scroll-hero__copy">
            <span className="eyebrow">{eyebrow}</span>
            <HeroFirstScrollTitle
              lineOne={titleLineOne}
              lineOneAccent={titleLineOneAccent}
              lineTwo={titleLineTwo}
              lineTwoAccent={titleLineTwoAccent}
              motionMode={motionMode}
            />
            <p className="lead">{intro}</p>
            <div className="hero__actions">
              <Link className="button button--primary" href={primaryCtaHref}>
                {primaryCtaLabel}
                <ArrowRight size={19} aria-hidden="true" />
              </Link>
              <Link className="button button--text" href="/werkwijze">Bekijk onze werkwijze</Link>
            </div>
          </div>
        </div>

        <div ref={cueRef} className="home-scroll-hero__cue" aria-hidden="true">
          <span>Scroll door de lift</span>
          <ArrowDown />
        </div>
        <div
          ref={endTaglineRef}
          className="home-scroll-hero__end-tagline"
          data-testid="scroll-hero-end-tagline"
          aria-hidden="true"
        >
          <div className="site-container home-scroll-hero__end-tagline-inner">
            <span className="home-scroll-hero__end-tagline-line">
              <span>{titleLineOne} <em>{titleLineOneAccent}</em></span>
            </span>
            <span className="home-scroll-hero__end-tagline-line">
              <span>{titleLineTwo} <em>{titleLineTwoAccent}</em></span>
            </span>
          </div>
        </div>
        <div className="home-scroll-hero__progress" aria-hidden="true"><span ref={progressRef} /></div>
      </div>
    </section>
  );
}

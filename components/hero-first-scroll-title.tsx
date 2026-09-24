"use client";

import { useEffect, useState } from "react";

type HeroFirstScrollTitleProps = {
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
}: HeroFirstScrollTitleProps) {
  const [revealed, setRevealed] = useState(motionMode === "none");

  useEffect(() => {
    if (motionMode === "none" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const reveal = () => setRevealed(true);
    if (window.scrollY > 1) {
      const frame = window.requestAnimationFrame(reveal);
      return () => window.cancelAnimationFrame(frame);
    }

    window.addEventListener("scroll", reveal, { once: true, passive: true });
    return () => window.removeEventListener("scroll", reveal);
  }, [motionMode]);

  const revealClass = revealed || motionMode === "none" ? " is-revealed" : "";

  return (
    <h1 id="home-title" className="display-title hero-first-scroll-title">
      {lineOne}{" "}
      <span className="motion-word-mask">
        <span className={`lime motion-word motion-word--from-left${revealClass}`}>
          {lineOneAccent}
        </span>
      </span>
      <br />
      {lineTwo}{" "}
      <span className="motion-word-mask">
        <span className={`lime motion-word motion-word--from-right${revealClass}`}>
          {lineTwoAccent}
        </span>
      </span>
    </h1>
  );
}

import { ScrollTrigger } from "gsap/ScrollTrigger";

/** Re-measure after fonts and settled viewport changes, including Safari resize. */
export function refreshScrollLayout(layout?: Element | null) {
  let active = true;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const schedule = () => {
    if (!active) return;
    clearTimeout(timer);
    timer = setTimeout(() => { if (active) ScrollTrigger.refresh(); }, 250);
  };
  const observer = layout ? new ResizeObserver(schedule) : null;
  if (layout) observer?.observe(layout);
  window.addEventListener("resize", schedule, { passive: true });
  void document.fonts.ready.then(schedule);
  return () => {
    active = false;
    observer?.disconnect();
    clearTimeout(timer);
    window.removeEventListener("resize", schedule);
  };
}

import type { CSSProperties } from "react";

export interface AnimatedCircularProgressBarProps {
  max?: number;
  value?: number;
  min?: number;
  gaugePrimaryColor: string;
  gaugeSecondaryColor: string;
  label: string;
  caption?: string;
  className?: string;
}

type ProgressRange = Pick<AnimatedCircularProgressBarProps, "max" | "min" | "value">;
type RingProperties = CSSProperties & {
  "--progress-ring-circumference": string;
  "--progress-ring-offset": string;
};

export function normalizeProgress({ min = 0, max = 100, value = 0 }: ProgressRange) {
  const safeMin = Number.isFinite(min) ? min : 0;
  const safeMax = Number.isFinite(max) ? max : 100;
  const lower = Math.min(safeMin, safeMax);
  const upper = Math.max(safeMin, safeMax);
  const range = upper - lower;
  if (range <= 0) return 0;
  const safeValue = Number.isFinite(value) ? value : lower;
  return Math.min(100, Math.max(0, ((safeValue - lower) / range) * 100));
}

export function AnimatedCircularProgressBar({
  max = 100,
  min = 0,
  value = 0,
  gaugePrimaryColor,
  gaugeSecondaryColor,
  label,
  caption,
  className,
}: AnimatedCircularProgressBarProps) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const currentPercent = normalizeProgress({ min, max, value });
  const displayPercent = Math.round(currentPercent);
  const maximumArc = circumference * 0.94;
  const progressLength = maximumArc * (currentPercent / 100);
  const style = {
    "--progress-ring-circumference": `${circumference}`,
    "--progress-ring-offset": `${circumference - progressLength}`,
  } as RingProperties;

  return (
    <div
      className={["animated-circular-progress", className].filter(Boolean).join(" ")}
      style={style}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={displayPercent}
      aria-valuetext={`${displayPercent}%${caption ? ` ${caption}` : ""}`}
    >
      <svg fill="none" viewBox="0 0 100 100" aria-hidden="true">
        <circle
          className="animated-circular-progress__track"
          cx="50"
          cy="50"
          r={radius}
          pathLength={circumference}
          stroke={gaugeSecondaryColor}
          strokeDasharray={`${maximumArc} ${circumference - maximumArc}`}
        />
        <circle
          className="animated-circular-progress__value"
          cx="50"
          cy="50"
          r={radius}
          pathLength={circumference}
          stroke={gaugePrimaryColor}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progressLength}
        />
      </svg>
      <span className="animated-circular-progress__label">
        <strong>{displayPercent}%</strong>
        {caption ? <small>{caption}</small> : null}
      </span>
    </div>
  );
}

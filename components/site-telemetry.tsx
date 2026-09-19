"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { publicTelemetryUrl, telemetryRoute } from "@/src/observability/privacy";
import { reportClientError } from "@/src/observability/client";

function optedOut() {
  try { return localStorage.getItem("kratos-cookie-preference-v1") === "essential-only"; }
  catch { return true; }
}
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("kratos-cookie-preference", callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener("kratos-cookie-preference", callback); };
}
function beforeSend<T extends { url: string }>(event: T): T | null {
  if (optedOut() || !publicTelemetryUrl(window.location.href)) return null;
  const url = publicTelemetryUrl(event.url);
  return url ? { ...event, url } : null;
}

export function SiteTelemetry({ enabled }: { enabled: boolean }) {
  const path = usePathname();
  const disabled = useSyncExternalStore(subscribe, optedOut, () => true);
  useEffect(() => {
    const onError = () => reportClientError("window");
    const onRejection = () => reportClientError("rejection");
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => { window.removeEventListener("error", onError); window.removeEventListener("unhandledrejection", onRejection); };
  }, []);
  if (!enabled || disabled || !path || !publicTelemetryUrl(`https://kratosfitness.be${path}`)) return null;
  return <>
    <Analytics debug={false} beforeSend={beforeSend} route={telemetryRoute(path)} path={telemetryRoute(path)} />
    <SpeedInsights debug={false} beforeSend={beforeSend} route={telemetryRoute(path)} />
  </>;
}

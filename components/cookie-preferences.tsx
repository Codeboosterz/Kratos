"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "kratos-cookie-preference-v1";

export function CookiePreferences() {
  const saved = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      window.addEventListener("kratos-cookie-preference", onStoreChange);
      return () => { window.removeEventListener("storage", onStoreChange); window.removeEventListener("kratos-cookie-preference", onStoreChange); };
    },
    () => localStorage.getItem(STORAGE_KEY) === "essential-only",
    () => false,
  );
  function save() { localStorage.setItem(STORAGE_KEY, "essential-only"); window.dispatchEvent(new Event("kratos-cookie-preference")); }
  return <div className="status-panel"><strong>Alleen essentieel</strong><p className="muted">Bewaar deze keuze om optionele bezoekers- en prestatiemeting op dit apparaat uit te schakelen. Technische foutmeldingen voor de werking en beveiliging bevatten geen formulierinhoud.</p><button className="button button--primary" type="button" onClick={save} data-testid="save-cookie-preferences">{saved ? "Voorkeur opgeslagen" : "Alleen essentieel opslaan"}</button><div role="status" aria-live="polite">{saved ? "Essentieel-only is op dit apparaat opgeslagen." : ""}</div></div>;
}

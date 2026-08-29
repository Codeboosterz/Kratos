"use client";

import { useState } from "react";
import { Calculator, CircleGauge, LoaderCircle, Sparkles } from "lucide-react";
import { calculateAdultBmi, estimateDailyCalories } from "@/src/operations/free-tools";

type Explanation = { summary: string; context: string[]; caution: string };

export function FreeToolsCalculator() {
  const [bmi, setBmi] = useState<ReturnType<typeof calculateAdultBmi> | null>(null);
  const [calories, setCalories] = useState<ReturnType<typeof estimateDailyCalories> | null>(null);
  const [explanation, setExplanation] = useState<Record<"bmi" | "calories", Explanation | null>>({ bmi: null, calories: null });
  const [pending, setPending] = useState<"bmi" | "calories" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function explain(tool: "bmi" | "calories", payload: Record<string, unknown>) {
    setPending(tool); setError(null);
    const response = await fetch("/api/tools/explain", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tool, ...payload }) });
    const data = await response.json() as { explanation?: Explanation; error?: { message?: string } };
    setPending(null);
    if (!response.ok || !data.explanation) setError(data.error?.message ?? "Uitleg niet beschikbaar.");
    else setExplanation((current) => ({ ...current, [tool]: data.explanation ?? null }));
  }

  return <div className="free-tools-live">
    <article className="tool-card tool-card--live">
      <Calculator aria-hidden="true" /><h2>BMI-indicatie</h2><p>Voor volwassenen vanaf 20 jaar. BMI is een screeningsmaat, geen diagnose.</p>
      <form onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); try { setBmi(calculateAdultBmi({ heightCm: Number(form.get("heightCm")), weightKg: Number(form.get("weightKg")) })); setExplanation((current) => ({ ...current, bmi: null })); setError(null); } catch { setError("Controleer lengte en gewicht."); } }}>
        <label>Lengte (cm)<input name="heightCm" type="number" min="92" max="274" step="0.1" defaultValue="180" required /></label>
        <label>Gewicht (kg)<input name="weightKg" type="number" min="25" max="453" step="0.1" defaultValue="78" required /></label>
        <button type="submit">Bereken BMI</button>
      </form>
      {bmi ? <div className="tool-result"><span>BMI</span><strong>{bmi.value}</strong><em>{bmi.category}</em><button type="button" disabled={pending !== null} onClick={() => explain("bmi", { heightCm: Number((document.querySelector('[name="heightCm"]') as HTMLInputElement)?.value), weightKg: Number((document.querySelector('[name="weightKg"]') as HTMLInputElement)?.value) })}>{pending === "bmi" ? <LoaderCircle className="cms-spin" /> : <Sparkles />}Leg uit met Claude</button></div> : null}
      {explanation.bmi ? <AiExplanation value={explanation.bmi} /> : null}
      <a href="https://www.cdc.gov/bmi/adult-calculator/" target="_blank" rel="noreferrer">Bron en beperkingen: CDC</a>
    </article>
    <article className="tool-card tool-card--live">
      <CircleGauge aria-hidden="true" /><h2>Caloriebehoefte</h2><p>Een ruwe indicatie op basis van rustenergie en activiteitsniveau.</p>
      <form id="calorie-form" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); try { setCalories(estimateDailyCalories({ heightCm: Number(form.get("heightCm")), weightKg: Number(form.get("weightKg")), age: Number(form.get("age")), formulaSex: String(form.get("formulaSex")) as "male" | "female", activity: String(form.get("activity")) as "sedentary" | "light" | "moderate" | "active" })); setExplanation((current) => ({ ...current, calories: null })); setError(null); } catch { setError("Controleer leeftijd, lengte, gewicht en rekenvariant."); } }}>
        <label>Leeftijd<input name="age" type="number" min="20" max="100" defaultValue="35" required /></label>
        <label>Lengte (cm)<input name="heightCm" type="number" min="92" max="274" step="0.1" defaultValue="180" required /></label>
        <label>Gewicht (kg)<input name="weightKg" type="number" min="25" max="453" step="0.1" defaultValue="80" required /></label>
        <label>Rekenvariant<select name="formulaSex" defaultValue="male"><option value="male">Mannelijke formuleconstante</option><option value="female">Vrouwelijke formuleconstante</option></select></label>
        <label>Activiteit<select name="activity" defaultValue="moderate"><option value="sedentary">Weinig actief</option><option value="light">Licht actief</option><option value="moderate">Matig actief</option><option value="active">Actief</option></select></label>
        <button type="submit">Bereken indicatie</button>
      </form>
      {calories ? <div className="tool-result"><span>Onderhoudsindicatie</span><strong>{calories.maintenanceKcal}</strong><em>kcal/dag · rust {calories.restingKcal} kcal</em><button type="button" disabled={pending !== null} onClick={() => { const form = document.querySelector("#calorie-form") as HTMLFormElement; const data = new FormData(form); explain("calories", { heightCm: Number(data.get("heightCm")), weightKg: Number(data.get("weightKg")), age: Number(data.get("age")), formulaSex: data.get("formulaSex"), activity: data.get("activity") }); }}>{pending === "calories" ? <LoaderCircle className="cms-spin" /> : <Sparkles />}Leg uit met Claude</button></div> : null}
      {explanation.calories ? <AiExplanation value={explanation.calories} /> : null}
      <a href="https://pubmed.ncbi.nlm.nih.gov/2305711/" target="_blank" rel="noreferrer">Formulebron: Mifflin–St Jeor</a>
    </article>
    {error ? <p className="free-tools-error" role="alert">{error}</p> : null}
  </div>;
}

function AiExplanation({ value }: { value: Explanation }) {
  return <div className="tool-ai-explanation"><strong>{value.summary}</strong><ul>{value.context.map((item) => <li key={item}>{item}</li>)}</ul><p>{value.caution}</p></div>;
}

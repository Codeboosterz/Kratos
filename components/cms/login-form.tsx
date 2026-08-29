"use client";

import { useActionState } from "react";
import { LockKeyhole } from "lucide-react";
import { login, type LoginState } from "@/app/beheer/login/actions";

const initialState: LoginState = {};

export function CmsLoginForm() {
  const [state, action, pending] = useActionState(login, initialState);

  return (
    <form className="cms-login-form" action={action}>
      <div className="field">
        <label htmlFor="cms-email">E-mailadres</label>
        <input id="cms-email" name="email" type="email" autoComplete="email" required />
        {state.fieldErrors?.email?.map((error) => <small className="field-error" key={error}>{error}</small>)}
      </div>
      <div className="field">
        <label htmlFor="cms-password">Wachtwoord</label>
        <input id="cms-password" name="password" type="password" autoComplete="current-password" required />
        {state.fieldErrors?.password?.map((error) => <small className="field-error" key={error}>{error}</small>)}
      </div>
      {state.message ? <p className="cms-message cms-message--error" role="alert">{state.message}</p> : null}
      <button className="button button--primary" type="submit" disabled={pending}>
        <LockKeyhole aria-hidden="true" size={18} /> {pending ? "Bezig met inloggen…" : "Veilig inloggen"}
      </button>
    </form>
  );
}

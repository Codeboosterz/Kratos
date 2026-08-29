export type Capability = {
  visible: boolean;
  allowed: boolean;
  reason?: string;
};

export type CapabilityId =
  | "intake_submission"
  | "trainerize_navigation"
  | "stripe_checkout"
  | "free_tool_calculation"
  | "proof_publication"
  | "legal_release";

export const capabilityLabels: Record<CapabilityId, string> = {
  intake_submission: "Intake versturen",
  trainerize_navigation: "Trainerize-programma openen",
  stripe_checkout: "Online betalen",
  free_tool_calculation: "Gezondheidstool berekenen",
  proof_publication: "Resultaten publiceren",
  legal_release: "Juridische publicatie",
};

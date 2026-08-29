import { z } from "zod";

export const intakeLeadStatuses = ["new", "contacted", "qualified", "closed", "spam"] as const;
export type IntakeLeadStatus = (typeof intakeLeadStatuses)[number];

export const intakeLeadStatusLabels: Record<IntakeLeadStatus, string> = {
  new: "Nieuw",
  contacted: "Gecontacteerd",
  qualified: "Gekwalificeerd",
  closed: "Afgesloten",
  spam: "Spam",
};

export const updateIntakeLeadSchema = z.object({
  intakeId: z.uuid(),
  leadStatus: z.enum(intakeLeadStatuses),
  internalNote: z.string().trim().max(2000, "Houd de interne notitie onder 2000 tekens."),
});

export const markIntakeReadSchema = z.object({ intakeId: z.uuid() });

export type LeadStatus =
  | "novo"
  | "contatado"
  | "respondeu"
  | "interessado"
  | "negociacao"
  | "fechado"
  | "perdido";

export const LEAD_STATUSES: { value: LeadStatus; label: string }[] = [
  { value: "novo", label: "Novo" },
  { value: "contatado", label: "Contatado" },
  { value: "respondeu", label: "Respondeu" },
  { value: "interessado", label: "Interessado" },
  { value: "negociacao", label: "Negociação" },
  { value: "fechado", label: "Fechado" },
  { value: "perdido", label: "Perdido" },
];

export type ScoreFactor = { label: string; points: number };

export type HistoryEntry = {
  id: string;
  date: string;
  label: string;
};

export type ContactType = "whatsapp" | "ligacao" | "instagram" | "outro";

export type Lead = {
  id: string;
  name: string;
  category: string;
  city: string;
  state: string;
  address: string;
  rating: number;
  reviews: number;
  phone: string;
  whatsapp: boolean;
  website: string | null;
  instagram: string | null;
  score: number;
  scoreFactors: ScoreFactor[];
  status: LeadStatus;
  saved: boolean;
  lastContact: string | null;
  nextFollowUp: string | null;
  notes: string;
  history: HistoryEntry[];
};

export type FollowUp = {
  id: string;
  leadId: string;
  time: string;
  when: "atrasado" | "hoje" | "proximo";
  label: string;
  done: boolean;
};

export type Activity = {
  id: string;
  label: string;
  lead: string;
  at: string;
};

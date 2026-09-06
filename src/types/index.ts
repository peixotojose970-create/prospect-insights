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

/** Estabelecimento como veio da fonte oficial (Google Maps Platform — Places API). */
export type Business = {
  /** id interno estável (usa o Place ID) */
  id: string;
  /** identificador na fonte (Place ID) */
  externalId: string;
  placeId: string;
  source: string;
  sourceUrl: string | null;
  mapsUrl: string | null;
  name: string;
  category: string;
  street: string | null;
  houseNumber: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  openingHours: string | null;
  latitude: number;
  longitude: number;
  rating: number | null;
  reviews: number | null;
  /** nomes de recurso das fotos do Google (não são URLs) */
  photoRefs: string[];
  photoAttributions: string[];
  score: number;
  scoreFactors: ScoreFactor[];
};


/** Dados de CRM que o usuário adiciona ao salvar um lead. */
export type LeadCrm = {
  status: LeadStatus;
  savedAt: string;
  notes: string;
  lastContact: string | null;
  nextFollowUp: string | null;
  history: HistoryEntry[];
  favorite?: boolean;
  tags?: string[];
  nextAction?: string | null;
};

export type Lead = Business & LeadCrm;

export type FollowUp = {
  id: string;
  leadId: string;
  /** ISO date (yyyy-mm-dd) */
  date: string;
  time: string;
  label: string;
  done: boolean;
};

export type Activity = {
  id: string;
  label: string;
  lead: string;
  at: string;
};

export type SavedSearch = {
  id: string;
  category: string;
  city: string;
  state: string;
  query: string;
  at: string;
  results: number;
};

export type SearchCriteria = {
  category: string;
  city: string;
  state: string;
  limit?: number;
  pageToken?: string;
};

export type SearchOutcome = {
  businesses: Business[];
  total: number;
  truncated: boolean;
  cached: boolean;
  areaLabel: string;
  /** token do Google para "Carregar mais" */
  nextPageToken: string | null;
};


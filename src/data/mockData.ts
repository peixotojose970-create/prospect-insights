import type { Activity, FollowUp, Lead, ScoreFactor } from "@/types";

type Seed = {
  name: string;
  category: string;
  city: string;
  state: string;
  rating: number;
  reviews: number;
  hasSite: boolean;
  whatsapp: boolean;
  instagram?: string;
  status?: Lead["status"];
  saved?: boolean;
};

const seeds: Seed[] = [
  { name: "Clínica Vida", category: "Clínica médica", city: "Curitiba", state: "PR", rating: 4.8, reviews: 327, hasSite: false, whatsapp: true, instagram: "@clinicavida", status: "interessado", saved: true },
  { name: "Barbearia Prime", category: "Barbearia", city: "Londrina", state: "PR", rating: 4.9, reviews: 214, hasSite: false, whatsapp: true, instagram: "@barbeariaprime", status: "contatado", saved: true },
  { name: "Studio Bella", category: "Salão de beleza", city: "Maringá", state: "PR", rating: 4.7, reviews: 189, hasSite: false, whatsapp: true, instagram: "@studiobella", saved: true },
  { name: "Restaurante Central", category: "Restaurante", city: "Curitiba", state: "PR", rating: 4.6, reviews: 512, hasSite: false, whatsapp: true, status: "respondeu", saved: true },
  { name: "Auto Center Norte", category: "Oficina mecânica", city: "São Paulo", state: "SP", rating: 4.4, reviews: 143, hasSite: true, whatsapp: false },
  { name: "Pet House", category: "Pet shop", city: "Campinas", state: "SP", rating: 4.8, reviews: 276, hasSite: false, whatsapp: true, instagram: "@pethouse" },
  { name: "Academia Evolution", category: "Academia", city: "Recife", state: "PE", rating: 4.5, reviews: 398, hasSite: false, whatsapp: true, status: "negociacao", saved: true },
  { name: "Odonto Sorriso", category: "Dentista", city: "Natal", state: "RN", rating: 4.9, reviews: 231, hasSite: false, whatsapp: true, instagram: "@odontosorriso" },
  { name: "Pizzaria Forno di Pietra", category: "Pizzaria", city: "Belo Horizonte", state: "MG", rating: 4.7, reviews: 641, hasSite: true, whatsapp: true },
  { name: "Barbearia Navalha", category: "Barbearia", city: "Porto Alegre", state: "RS", rating: 4.6, reviews: 122, hasSite: false, whatsapp: true },
  { name: "Clínica Bem Estar", category: "Clínica médica", city: "Florianópolis", state: "SC", rating: 4.8, reviews: 154, hasSite: false, whatsapp: false, instagram: "@clinicabemestar" },
  { name: "Loja Casa & Estilo", category: "Loja", city: "Curitiba", state: "PR", rating: 4.3, reviews: 87, hasSite: false, whatsapp: true },
  { name: "Pet Vida Animal", category: "Pet shop", city: "Londrina", state: "PR", rating: 4.5, reviews: 96, hasSite: false, whatsapp: true },
  { name: "Academia Corpo Ativo", category: "Academia", city: "São Paulo", state: "SP", rating: 4.2, reviews: 305, hasSite: true, whatsapp: true },
  { name: "Salão Ateliê da Beleza", category: "Salão de beleza", city: "Campinas", state: "SP", rating: 4.9, reviews: 178, hasSite: false, whatsapp: true, instagram: "@atelie.beleza" },
  { name: "Dentista Clara Odontologia", category: "Dentista", city: "Belo Horizonte", state: "MG", rating: 4.7, reviews: 264, hasSite: false, whatsapp: true },
  { name: "Oficina Mecânica Torque", category: "Oficina mecânica", city: "Porto Alegre", state: "RS", rating: 4.1, reviews: 64, hasSite: false, whatsapp: false },
  { name: "Restaurante Sabor da Terra", category: "Restaurante", city: "Recife", state: "PE", rating: 4.6, reviews: 421, hasSite: false, whatsapp: true },
  { name: "Pizzaria Bella Massa", category: "Pizzaria", city: "Natal", state: "RN", rating: 4.4, reviews: 233, hasSite: false, whatsapp: true },
  { name: "Clínica Integrar", category: "Clínica médica", city: "Maringá", state: "PR", rating: 4.5, reviews: 118, hasSite: true, whatsapp: true },
  { name: "Barbearia Corte Fino", category: "Barbearia", city: "Curitiba", state: "PR", rating: 4.7, reviews: 201, hasSite: false, whatsapp: true, instagram: "@cortefino" },
  { name: "Loja Verde Decor", category: "Loja", city: "Florianópolis", state: "SC", rating: 4.2, reviews: 52, hasSite: false, whatsapp: false },
  { name: "Academia Força Total", category: "Academia", city: "Londrina", state: "PR", rating: 4.4, reviews: 167, hasSite: false, whatsapp: true },
  { name: "Pet Amigo Fiel", category: "Pet shop", city: "Porto Alegre", state: "RS", rating: 4.8, reviews: 143, hasSite: false, whatsapp: true },
  { name: "Studio Hair Lounge", category: "Salão de beleza", city: "São Paulo", state: "SP", rating: 4.6, reviews: 289, hasSite: true, whatsapp: true },
  { name: "Odonto Prime Clinic", category: "Dentista", city: "Campinas", state: "SP", rating: 4.9, reviews: 312, hasSite: false, whatsapp: true, instagram: "@odontoprime" },
  { name: "Restaurante Varanda Mineira", category: "Restaurante", city: "Belo Horizonte", state: "MG", rating: 4.5, reviews: 376, hasSite: false, whatsapp: true },
  { name: "Auto Center Litoral", category: "Oficina mecânica", city: "Florianópolis", state: "SC", rating: 4.3, reviews: 71, hasSite: false, whatsapp: true },
  { name: "Pizzaria Napoli Express", category: "Pizzaria", city: "Curitiba", state: "PR", rating: 4.2, reviews: 148, hasSite: false, whatsapp: true },
  { name: "Loja Mundo Kids", category: "Loja", city: "Recife", state: "PE", rating: 4.4, reviews: 93, hasSite: false, whatsapp: true },
];

const dddByCity: Record<string, string> = {
  Curitiba: "41",
  Londrina: "43",
  Maringá: "44",
  "São Paulo": "11",
  Campinas: "19",
  Recife: "81",
  Natal: "84",
  "Belo Horizonte": "31",
  "Porto Alegre": "51",
  Florianópolis: "48",
};

function buildScore(seed: Seed): { score: number; factors: ScoreFactor[] } {
  const factors: ScoreFactor[] = [];
  if (!seed.hasSite) factors.push({ label: "Sem site", points: 30 });
  factors.push({ label: "Telefone encontrado", points: 15 });
  if (seed.whatsapp) factors.push({ label: "WhatsApp disponível", points: 10 });
  if (seed.rating >= 4.5) factors.push({ label: "Nota alta", points: 10 });
  if (seed.reviews >= 150) factors.push({ label: "Muitas avaliações", points: 10 });
  if (seed.instagram) factors.push({ label: "Instagram ativo", points: 5 });
  factors.push({ label: "Localização em praça-alvo", points: 5 });
  factors.push({ label: "Outros fatores de qualificação", points: 7 });
  const score = Math.min(100, factors.reduce((sum, f) => sum + f.points, 0));
  return { score, factors };
}

function slug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const mockLeads: Lead[] = seeds.map((seed, i) => {
  const { score, factors } = buildScore(seed);
  const ddd = dddByCity[seed.city] ?? "11";
  const num = `9${String(1000 + i * 137).slice(0, 4)}-${String(2000 + i * 311).slice(0, 4)}`;
  const site = seed.hasSite ? `www.${slug(seed.name)}.com.br` : null;
  return {
    id: slug(seed.name),
    name: seed.name,
    category: seed.category,
    city: seed.city,
    state: seed.state,
    address: `Rua Exemplo, ${100 + i * 7} — Centro`,
    rating: seed.rating,
    reviews: seed.reviews,
    phone: `(${ddd}) ${num}`,
    whatsapp: seed.whatsapp,
    website: site,
    instagram: seed.instagram ?? null,
    score,
    scoreFactors: factors,
    status: seed.status ?? "novo",
    saved: seed.saved ?? false,
    lastContact: seed.status && seed.status !== "novo" ? "há 2 dias" : null,
    nextFollowUp: null,
    notes: "",
    history: [{ id: `${slug(seed.name)}-h0`, date: "02/09", label: "Empresa identificada na prospecção" }],
  };
});

export const mockFollowUps: FollowUp[] = [
  { id: "f1", leadId: "barbearia-prime", time: "09:00", when: "atrasado", label: "Contato há 3 dias sem resposta", done: false },
  { id: "f2", leadId: "clinica-vida", time: "18:30", when: "hoje", label: "Retornar com proposta de site", done: false },
  { id: "f3", leadId: "restaurante-central", time: "14:00", when: "hoje", label: "Enviar exemplos de layout", done: false },
  { id: "f4", leadId: "studio-bella", time: "11:00", when: "hoje", label: "Confirmar interesse", done: false },
  { id: "f5", leadId: "academia-evolution", time: "10:00", when: "proximo", label: "Amanhã — fechar valores", done: false },
  { id: "f6", leadId: "pet-house", time: "16:00", when: "proximo", label: "Quinta — primeira abordagem", done: false },
];

export const mockActivities: Activity[] = [
  { id: "a1", label: "Lead salvo", lead: "Clínica Vida", at: "há 5 min" },
  { id: "a2", label: "Mensagem enviada", lead: "Barbearia Prime", at: "há 1 h" },
  { id: "a3", label: "Lead movido para interessado", lead: "Clínica Vida", at: "há 2 h" },
  { id: "a4", label: "Follow-up concluído", lead: "Restaurante Central", at: "ontem" },
  { id: "a5", label: "Prompt de site gerado", lead: "Studio Bella", at: "ontem" },
];

export const CITIES = Object.keys(dddByCity).sort();
export const STATES = ["PR", "SP", "PE", "RN", "MG", "RS", "SC"];
export const CATEGORIES = Array.from(new Set(seeds.map((s) => s.category))).sort();

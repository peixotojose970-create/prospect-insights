import type { Business, Lead } from "@/types";
import { NAO_DISPONIVEL_FONTE, formatPhone, fullAddress, orNotInformed, whatsappLabel } from "./format";

const MISSING = "[CONFIRMAR COM O CLIENTE]";

type SenderProfile = { personalName: string; companyName: string };

function senderIntroduction(profile?: SenderProfile) {
  const name = profile?.personalName.trim();
  const company = profile?.companyName.trim();
  if (name && company) return `Me chamo ${name}, da ${company}`;
  if (name) return `Me chamo ${name}`;
  if (company) return `Falo em nome da ${company}`;
  return "Trabalho com criação de sites";
}

function senderSignature(profile?: SenderProfile) {
  return [profile?.personalName.trim(), profile?.companyName.trim()].filter(Boolean).join(" — ");
}

export function buildSitePrompt(business: Business, profile?: SenderProfile) {
  return `# PAPEL
Você é um designer e desenvolvedor web sênior especializado em sites institucionais para empresas locais brasileiras.

# CONTEXTO DA EMPRESA (dados públicos do Google Maps — não inventar nada além disto)
Nome: ${business.name}
Nicho / categoria: ${business.category}
Endereço: ${fullAddress(business)}
Cidade: ${orNotInformed(business.city)}
Estado: ${orNotInformed(business.state)}
Telefone: ${formatPhone(business.phone)}
WhatsApp: ${whatsappLabel(business.phone)}
Site informado na fonte: ${business.website ?? "não informado"}
Instagram: ${business.instagram ?? "não informado"}
Horário de funcionamento: ${business.openingHours ?? "não informado"}
Avaliações / nota: ${NAO_DISPONIVEL_FONTE}
Fonte: ${business.source} (${business.externalId})
Responsável pelo projeto: ${senderSignature(profile) || "não informado"}

# OBJETIVO DO SITE
Criar uma presença digital profissional, transmitindo credibilidade local e convertendo
visitantes em contato direto por WhatsApp e telefone.

# IDENTIDADE VISUAL
- Estética limpa, moderna e adequada ao nicho "${business.category}".
- Paleta sóbria com uma única cor de destaque.
- Tipografia legível, hierarquia clara, espaçamento generoso.

# ESTRUTURA DO SITE
1. Hero — nome, proposta de valor, cidade e CTA principal.
2. Sobre — apresentação curta e honesta.
3. Serviços — ${MISSING} (não foram encontrados serviços específicos na fonte; não inventar serviços).
4. Diferenciais — apenas pontos objetivos confirmados pelo cliente.
5. Localização — endereço e mapa (dados acima).
6. FAQ — dúvidas frequentes do nicho, sem afirmações não confirmadas.
7. CTA final — contato por WhatsApp e telefone.

# CTA
CTA primário: falar no WhatsApp (${formatPhone(business.phone)}).
CTA secundário: ligar agora.

# RESPONSIVIDADE
Mobile-first, testado em 390x844, 768x1024 e 1440x900.

# SEO
- Title com nome + serviço + cidade (até 60 caracteres).
- Meta description até 160 caracteres.
- Um único H1, headings semânticos, alt em todas as imagens.
- JSON-LD LocalBusiness apenas com dados confirmados.

# REGRAS DE CONTEÚDO (OBRIGATÓRIO)
NÃO INVENTAR: serviços, preços, notas, depoimentos, certificações, história ou promoções.
Não afirmar quantidade de avaliações ou nota — esses dados não existem nesta fonte.
Onde faltar informação, usar ${MISSING} e listar ao final tudo que precisa ser confirmado.`;
}

function senderParts(profile?: SenderProfile) {
  const name = profile?.personalName.trim() || "Alysson";
  const company = profile?.companyName.trim() || "Nextor Studio";
  return { name, company, signature: `${name} — ${company}` };
}

function shortName(business: Business) {
  // Usa o nome completo do estabelecimento, sem inventar abreviações.
  return business.name.trim();
}

/**
 * ETAPA 1 — abertura. Curta, humana, sem vender: só confirma o responsável
 * e desperta curiosidade. Cada estilo tem sua própria personalidade.
 */
export function buildMessages(business: Business, _profile?: SenderProfile) {
  const nome = shortName(business);
  const curta = `Olá! Tudo bem? Falo com o responsável pela ${nome}?`;
  const natural = `Oi! Tudo bem? Falo com alguém responsável pela ${nome}?`;
  const comercial = `Olá, boa tarde! Tudo bem? Falo com o responsável pela ${nome}?`;
  const curiosidade = `Olá! Tudo bem? Falo com o responsável pela ${nome}? Tenho uma ideia específica para vocês.`;
  return { curta, natural, comercial, curiosidade };
}

/**
 * ETAPA 2 — apresentação, usada depois que a pessoa responde
 * ("Sim", "Sou eu", "Pois não", "Como posso ajudar?"...).
 * Usa apenas dados reais do lead. Não afirma que a prévia já existe:
 * oferece prepará-la sem custo e sem compromisso.
 */
export function buildSecondMessages(business: Business, profile?: SenderProfile) {
  const { name, company, signature } = senderParts(profile);
  const nome = shortName(business);
  const semSite = !business.website;
  const categoria = business.category && business.category !== "Não informado" ? business.category.toLowerCase() : null;
  const local = [business.neighborhood, business.city].filter(Boolean).join(", ");
  const temNota = business.rating !== null;
  const boaNota = temNota && business.rating! >= 4.5;
  const reviewsTxt = business.reviews ? `${business.reviews} avaliações` : null;
  const notaTxt = temNota ? `nota ${business.rating!.toFixed(1)}${reviewsTxt ? ` com ${reviewsTxt}` : ""}` : null;

  const curta = `Perfeito! Me chamo ${name}, sou da ${company}. Estava analisando a presença online de vocês e tive uma ideia de como poderia ficar um site profissional para a ${nome}. Posso preparar uma prévia específica para vocês, sem compromisso e sem cobrar nada por isso. Posso te enviar?

${signature}`;

  const presencaGoogle = boaNota
    ? `vi que vocês têm uma reputação muito boa no Google (${notaTxt})`
    : temNota
      ? "vi que vocês já têm uma presença no Google"
      : "encontrei vocês no Google";
  const natural = `Legal! Me chamo ${name}, da ${company}. Estava conhecendo melhor a ${nome}${local ? ` aqui em ${local}` : ""} e ${presencaGoogle}. ${
    semSite
      ? "Como não encontrei um site informado, acabei tendo uma ideia de como poderia ficar a presença online de vocês."
      : "Dei uma olhada no site atual e tive algumas ideias de como deixar a presença online ainda mais forte."
  } Posso preparar uma prévia sem compromisso pra você ver como ficaria. Te mando?

${signature}`;

  const pontos: string[] = [];
  if (semSite) pontos.push("não encontrei um site informado no perfil do Google");
  else pontos.push("o site atual pode ser modernizado e pensado para o celular");
  if (notaTxt) pontos.push(`vocês já têm ${notaTxt}, o que passa confiança para quem pesquisa`);
  const comercial = `Perfeito, obrigado pelo retorno! Me chamo ${name}, sou da ${company} e trabalho com sites para ${
    categoria ? `empresas de ${categoria}` : "negócios locais"
  }${business.city ? ` em ${business.city}` : ""}.

Analisei a ${nome} e vi que ${pontos.join(", e ")}. A ideia é um site rápido, que aparece bem nas buscas da região e leva o cliente direto para o WhatsApp de vocês.

Posso montar uma prévia gratuita e sem compromisso para você avaliar. Faz sentido eu te enviar?

${signature}`;

  const curiosidade = `Perfeito! Me chamo ${name}, sou da ${company}. Estive analisando a presença online da ${nome} e tive uma ideia específica para o negócio de vocês${
    semSite ? " — principalmente porque não encontrei um site informado" : ""
  }. Posso preparar uma prévia de como ficaria um site profissional para a ${nome}. Não tem custo nenhum e não existe compromisso — a ideia é você só ver como poderia ficar e decidir se faz sentido. Posso te enviar?

${signature}`;

  return { curta, natural, comercial, curiosidade };
}

/** Follow-up considerando status, dias desde o último contato e contexto do lead. */
export function buildFollowUp(lead: Lead) {
  const dias = lead.lastContact
    ? Math.max(
        0,
        Math.round((Date.now() - new Date(lead.lastContact.split(" ")[0]!.split("/").reverse().join("-")).getTime()) / 86400000),
      )
    : null;
  const tempo = dias === null ? "" : dias <= 1 ? " ontem" : ` há ${dias} dias`;

  if (lead.status === "respondeu" || lead.status === "interessado")
    return `Oi! Retomando nossa conversa sobre o site da ${lead.name}. Consegui organizar a ideia que te comentei${tempo} — se fizer sentido, te mostro em 5 minutos como ficaria a página inicial. Posso enviar?`;
  if (lead.status === "negociacao")
    return `Oi! Passando para saber se ficou alguma dúvida na proposta do site da ${lead.name}. Se preferir, ajusto o escopo ou o prazo conforme a sua necessidade.`;
  return `Oi! Passando novamente por aqui porque não sei se você conseguiu ver a ideia que te enviei${tempo} sobre o site da ${lead.name}. Se fizer sentido, posso te mostrar rapidamente como pensei o site para vocês.`;
}

/** Proposta comercial: nenhum valor ou prazo é inventado. */
export function buildProposal(input: {
  business: Business;
  contact: string;
  service: string;
  description: string;
  deadline: string;
  investment: string;
  validity: string;
  notes: string;
}) {
  const p = (v: string) => (v.trim() ? v.trim() : "[preencher]");
  return `PROPOSTA DE CRIAÇÃO DE SITE

Cliente:
${input.business.name}${input.contact.trim() ? `\nResponsável:\n${input.contact.trim()}` : ""}

Objetivo:
Criar uma presença digital profissional para apresentar a empresa e facilitar o contato com clientes.

Serviço:
${p(input.service)}

Descrição:
${p(input.description)}

Incluído:
• Site responsivo
• Página inicial
• Serviços
• Contato
• WhatsApp
• Localização
• SEO básico

Prazo:
${p(input.deadline)}

Investimento:
${p(input.investment)}

Validade da proposta:
${p(input.validity)}

Observações:
${p(input.notes)}`;
}


export function buildKit(business: Business) {
  const messages = buildMessages(business);
  return [
    {
      title: "Resumo da empresa",
      content: `${business.name} — ${business.category}
${fullAddress(business)}
Telefone: ${formatPhone(business.phone)}
Site: ${business.website ?? "sem site informado na fonte"}
Instagram: ${business.instagram ?? "não informado"}
Avaliações: ${NAO_DISPONIVEL_FONTE}
Fonte: ${business.source} · ${business.externalId}`,
    },
    {
      title: "Score e motivos",
      content: `Lead Score ${business.score}/100
${business.scoreFactors.map((f) => `+${f.points} ${f.label}`).join("\n")}
Potencial baseado nos dados disponíveis na fonte.`,
    },
    { title: "Mensagem curta", content: messages.curta },
    { title: "Mensagem natural", content: messages.natural },
    { title: "Mensagem comercial", content: messages.comercial },
    { title: "Prompt do site", content: buildSitePrompt(business) },
  ];
}

/** CSV dos leads realmente salvos pelo usuário. */
export function toCsv(leads: Lead[]) {
  const header = [
    "empresa",
    "categoria",
    "endereco",
    "bairro",
    "cidade",
    "estado",
    "cep",
    "telefone",
    "site",
    "instagram",
    "horario",
    "latitude",
    "longitude",
    "score",
    "status",
    "fonte",
    "external_id",
    "source_url",
    "salvo_em",
  ];
  const rows = leads.map((l) =>
    [
      l.name,
      l.category,
      l.address ?? "",
      l.neighborhood ?? "",
      l.city ?? "",
      l.state ?? "",
      l.postalCode ?? "",
      l.phone ?? "",
      l.website ?? "",
      l.instagram ?? "",
      l.openingHours ?? "",
      l.latitude,
      l.longitude,
      l.score,
      l.status,
      l.source,
      l.externalId,
      l.sourceUrl ?? "",
      l.savedAt,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );
  return [header.join(","), ...rows].join("\n");
}

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

/** Mensagens montadas a partir da situação real da empresa (nada inventado). */
export function buildMessages(business: Business, profile?: SenderProfile) {
  const semSite = !business.website;
  const cidade = business.city ?? "sua região";
  const categoria = business.category.toLowerCase();
  const boaReputacao = business.rating !== null && business.rating >= 4.5;
  const notaTxt = business.rating !== null ? `nota ${business.rating.toFixed(1)}` : null;
  const avaliacoesTxt = business.reviews !== null ? `${business.reviews} avaliações` : null;
  const reputacao = [notaTxt, avaliacoesTxt].filter(Boolean).join(" e ");
  const apresentacao = senderIntroduction(profile);
  const assinatura = senderSignature(profile);
  const fechar = assinatura ? `\n\n${assinatura}` : "";

  const curta = semSite
    ? `Oi! ${apresentacao}. Vi a ${business.name} no Google e achei o trabalho bem interessante. Percebi que não encontrei um site informado para vocês e tive uma ideia de como poderia ficar a presença online da empresa. Posso te mostrar?${fechar}`
    : `Oi! ${apresentacao}. Encontrei a ${business.name} no Google e dei uma olhada na presença online de vocês. Tive algumas ideias que poderiam valorizar ainda mais a apresentação da empresa. Posso te mostrar?${fechar}`;

  const natural = boaReputacao
    ? `Oi! ${apresentacao} e crio sites para empresas de ${cidade}. Vi que a ${business.name} tem uma avaliação muito boa no Google${
        reputacao ? ` (${reputacao})` : ""
      } — bastante gente já conhece o trabalho de vocês. ${
        semSite
          ? "Como não encontrei um site informado, tive uma ideia de como transformar essa confiança em uma presença online ainda mais profissional."
          : "Tive algumas ideias de como transformar essa confiança em uma presença online ainda mais profissional."
      } Posso te enviar?${fechar}`
    : `Olá! ${apresentacao} e crio sites para empresas de ${cidade}. Encontrei a ${business.name} no Google Maps. ${
        semSite
          ? "Não encontrei um site informado para vocês — pode existir e ainda não estar cadastrado, por isso queria confirmar."
          : "Vi a presença online atual e anotei pontos que podem aumentar os contatos."
      } Montei uma ideia de presença online para ${categoria}. Posso te enviar?${fechar}`;

  const comercial = `Olá, falo com o responsável pela ${business.name}?

Sou especialista em sites para empresas de ${categoria} e atendo negócios em ${cidade}${
    business.state ? ` - ${business.state}` : ""
  }.

O que encontrei nos dados públicos do Google:
• ${semSite ? "Nenhum site informado no perfil" : `Site informado: ${business.website}`}
• Contato listado: ${formatPhone(business.phone)}
• Endereço: ${fullAddress(business)}${reputacao ? `\n• Reputação: ${reputacao}` : ""}

Observação: essas informações vêm do perfil público e podem estar incompletas — se algo estiver desatualizado, me corrija.

Proposta: um site rápido, otimizado para buscas locais e com contato direto no WhatsApp.

Posso te enviar uma prévia sem compromisso?${fechar}`;

  const curiosidade = `Olá! Gostaria de falar com o responsável pela ${business.name} ou pela área de ${categoria}. ${apresentacao} e preparei uma ideia específica para o negócio de vocês. Com quem eu poderia conversar?${fechar}`;

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

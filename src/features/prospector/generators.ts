import type { Business, Lead } from "@/types";
import { NAO_DISPONIVEL_FONTE, formatPhone, fullAddress, orNotInformed, whatsappLabel } from "./format";

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
  const confirmed = (label: string, value: string | null | undefined) => (value?.trim() ? `- ${label}: ${value.trim()}` : "");
  const hasPhone = !!business.phone;
  const reputation = business.rating !== null && business.rating !== undefined
    ? `${business.rating.toFixed(1)} no Google${business.reviews !== null && business.reviews !== undefined ? ` (${business.reviews} avaliações)` : ""}`
    : null;
  const reviewQuotes = (business.publicReviews ?? []).map((review) =>
    `- “${review.text}”${review.author ? ` — ${review.author}` : ""}${review.rating !== null ? ` (${review.rating.toFixed(1)}/5)` : ""}`,
  );
  const missing = [
    !business.description && "apresentação, história e diferenciais da empresa",
    "serviços, produtos, preços e formas de atendimento confirmados",
    !business.phone && "telefone e canal de WhatsApp",
    !business.openingHours && "horários de funcionamento",
    !business.photoRefs?.length && "fotos autorizadas para o site",
  ].filter(Boolean);

  return `# PROJETO DE SITE — DADOS REAIS DA EMPRESA
Você é um designer e desenvolvedor web sênior. Crie um site institucional profissional, personalizado para esta empresa local. Use exclusivamente os fatos abaixo; o projeto é conduzido pela Apex SLS, mas a Apex SLS não deve aparecer como proprietária ou marca do cliente.

## Identificação e posicionamento
- Empresa: ${business.name}
- Segmento/categoria informada pelo Google: ${business.category}
- Região: ${[business.city, business.state].filter(Boolean).join(" — ") || "não informada"}
${confirmed("Descrição pública", business.description)}

## Dados confirmados na fonte Google Maps
- Endereço: ${fullAddress(business)}
${confirmed("Telefone", business.phone ? formatPhone(business.phone) : null)}
${hasPhone ? `- WhatsApp: usar o mesmo número somente como CTA de contato; não afirmar que aceita pedidos ou agendamentos por WhatsApp.` : ""}
${confirmed("Site atual", business.website)}
${confirmed("Instagram", business.instagram)}
${confirmed("Outra rede/link público", business.socialUrl)}
${confirmed("Horários", business.openingHours)}
${confirmed("Perfil no Google Maps", business.mapsUrl ?? business.sourceUrl)}
${confirmed("Reputação", reputation)}
${business.photoRefs?.length ? `- Há ${business.photoRefs.length} foto(s) pública(s) do Google Maps disponíveis para referência visual; só use fotos que forem efetivamente fornecidas ao projeto e preserve as atribuições necessárias.` : ""}

## Objetivo comercial
Gerar confiança para pessoas que pesquisam por ${business.category.toLowerCase()}${business.city ? ` em ${business.city}` : " na região"} e conduzi-las ao contato pelos canais confirmados. Não presumir conversão por agendamento, pedido, orçamento ou visita sem confirmação.

## Direção visual
Defina uma direção visual contemporânea e compatível com o segmento “${business.category}”, com boa hierarquia, tipografia legível e uma paleta coerente. Evite layouts genéricos: use o nome, a localização, a categoria e os dados reais para dar personalidade à página.

## Seções recomendadas
- Hero: nome da empresa, mensagem de valor sem promessas não confirmadas e CTA ${hasPhone ? "para contato por WhatsApp/telefone" : "para contato (canal a confirmar)"}.
${business.description ? "- Apresentação: adaptar a descrição pública acima sem ampliar ou inventar a história da empresa." : "- Apresentação: criar uma área discreta e editável internamente; não exibir texto de preenchimento ao visitante."}
- Serviços/produtos: só criar cards para itens explicitamente confirmados. Como a fonte não detalha itens, deixe esta seção fora do site público ou pronta para preenchimento no editor, sem placeholders visíveis.
${reputation ? "- Prova social: destacar visualmente a nota e a quantidade de avaliações reais do Google, mantendo os números exatos." : ""}
${reviewQuotes.length ? `- Avaliações públicas que podem ser usadas literalmente, com autoria e nota somente quando indicadas:
${reviewQuotes.join("\n")}` : "- Não criar depoimentos, nomes de clientes, estrelas ou números de avaliações fictícios."}
${business.address ? "- Localização: exibir o endereço confirmado e um link para o perfil no Google Maps." : ""}
${hasPhone ? "- Contato e CTA final: telefone e WhatsApp com o número confirmado." : ""}

## SEO e experiência
- Criar title e meta description locais usando somente nome, categoria e cidade confirmados.
- Usar um H1 semântico, dados estruturados LocalBusiness apenas com dados reais e alt text descritivo nas imagens.
- Desenvolver mobile-first e validar a experiência em 390x844, 768x1024 e 1440x900.

## Informações que precisam de confirmação antes de publicar
${missing.length ? missing.map((item) => `- ${item}`).join("\n") : "- Nenhuma lacuna crítica identificada nos dados recebidos; validar o conteúdo final com o cliente."}

## Regras obrigatórias
Nunca invente serviços, produtos, preços, promoções, certificações, equipe, história, depoimentos, notas, quantidade de avaliações ou canais de atendimento. Não publique placeholders, marcadores de confirmação ou textos genéricos para os visitantes; quando faltar informação, omita a seção pública ou deixe o campo apenas editável no projeto.`;
}

function senderParts(profile?: SenderProfile) {
  const name = profile?.personalName.trim() || "Alysson";
  const company = profile?.companyName.trim() || "Apex SLS";
  return { name, company, signature: `${name} — ${company}` };
}

function shortName(business: Business) {
  // Usa o nome completo do estabelecimento, sem inventar abreviações.
  return business.name.trim();
}

/** Retorna possibilidades adequadas ao segmento, sem afirmar que o negócio já as oferece. */
function sitePossibilities(business: Business) {
  const category = business.category?.toLocaleLowerCase("pt-BR") ?? "";
  if (/barbear|sal[aã]o|beleza|est[ée]tica/.test(category))
    return "fotos, informações sobre os serviços, localização e agendamento";
  if (/restaurante|lanchonete|pizzaria|caf[ée]|aliment|hamburg/.test(category))
    return "cardápio, fotos, localização e informações para pedidos";
  if (/cl[ií]nica|consult[oó]rio|odont|sa[uú]de|m[ée]dic/.test(category))
    return "especialidades, informações, localização e agendamentos";
  if (/oficina|auto|mec[aâ]nic|ve[ií]cul/.test(category))
    return "informações sobre os serviços, localização e formas de contato";
  if (/academia|fitness|pilates|crossfit|treino/.test(category))
    return "modalidades, estrutura, localização e formas de contato";
  if (/loja|com[eé]rcio|varejo|boutique|mercado/.test(category))
    return "produtos, informações comerciais e canais de atendimento";
  if (/lava.?jato|lavagem|est[eé]tica automotiva/.test(category))
    return "serviços, fotos, localização e agendamentos";
  return "informações importantes, localização e formas de contato";
}

/**
 * ETAPA 1 — abertura. Curta, humana, sem vender: só confirma o responsável
 * e desperta curiosidade. Cada estilo tem sua própria personalidade.
 */
export function buildMessages(business: Business, profile?: SenderProfile) {
  const nome = shortName(business);
  const categoria = business.category?.trim() || "negócio";
  const curta = "Oi! Tudo bem? Procurei mais informações sobre a empresa e não encontrei. Vocês não têm um site?";
  const natural = `Oi! Tudo bem? Falo com alguém responsável pela ${nome}?`;
  const comercial = `Olá, boa tarde! Tudo bem? Falo com o responsável pela ${nome}?`;
  const curiosidade = `Olá! Tudo bem? Falo com o responsável pela ${nome}? Tenho uma ideia específica para vocês.`;
  const direto = `Olá! Tudo bem?\n\n${senderIntroduction(profile)}. Vi o perfil da ${nome}, na categoria ${categoria}, e pensei em uma oportunidade para apresentar melhor o negócio de vocês na internet.\n\nA ideia é um site profissional pensado para a ${nome}, com ${sitePossibilities(business)}, para facilitar que novos clientes conheçam o estabelecimento e entrem em contato.\n\nPosso te mostrar uma prévia de como ficaria para vocês, sem compromisso?`;
  return { curta, natural, comercial, curiosidade, direto };
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

  const direto = `Perfeito! ${senderIntroduction(profile)}. A proposta é criar um site profissional para a ${nome}, apresentando ${sitePossibilities(business)} de um jeito claro para quem procura por ${categoria ?? "este tipo de negócio"} na região.\n\nAssim, o site pode ajudar novos clientes a encontrar as informações principais e iniciar o contato com vocês. Posso te mostrar uma prévia sem compromisso?${signature ? `\n\n${signature}` : ""}`;

  return { curta, natural, comercial, curiosidade, direto };
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
  const scoreFactors = Array.isArray(business.scoreFactors) ? business.scoreFactors : [];
  const scoreVal = typeof business.score === "number" && !isNaN(business.score) ? business.score : 0;
  return [
    {
      title: "Resumo da empresa",
      content: `${business.name || "Não informado"} — ${business.category || "Não informado"}
${fullAddress(business)}
Telefone: ${formatPhone(business.phone)}
Site: ${business.website ?? "sem site informado na fonte"}
Instagram: ${business.instagram ?? "não informado"}
Avaliações: ${NAO_DISPONIVEL_FONTE}
Fonte: ${business.source || "Google Maps"} · ${business.externalId || "Não informado"}`,
    },
    {
      title: "Score e motivos",
      content: `Lead Score ${scoreVal}/100
${scoreFactors.map((f) => `+${f.points} ${f.label}`).join("\n")}
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

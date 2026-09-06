import type { Business, Lead } from "@/types";
import { NAO_DISPONIVEL_FONTE, formatPhone, fullAddress, orNotInformed, whatsappLabel } from "./format";

const MISSING = "[CONFIRMAR COM O CLIENTE]";

export function buildSitePrompt(business: Business) {
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

export function buildMessages(business: Business) {
  const semSiteInformado = !business.website;
  const cidade = business.city ?? "sua região";
  const categoria = business.category.toLowerCase();

  return {
    curta: `Oi! Tudo bem? Vi a ${business.name}, aqui em ${cidade}. ${
      semSiteInformado
        ? "Procurei um site de vocês e não encontrei nenhum endereço informado nas bases públicas."
        : "Dei uma olhada no site de vocês e tive algumas ideias simples de melhoria."
    } Posso te mostrar uma ideia rápida?`,
    natural: `Olá! Me chamo [SEU NOME] e crio sites para empresas de ${cidade}. Encontrei a ${business.name} no Google Maps. ${
      semSiteInformado
        ? "Não encontrei um site informado para vocês — pode ser que exista e ainda não esteja cadastrado, por isso queria confirmar."
        : "Vi o site atual e anotei pontos que podem aumentar os contatos."
    } Montei uma ideia de presença online para ${categoria}. Posso te enviar?`,
    comercial: `Olá, falo com o responsável pela ${business.name}?

Sou especialista em sites para empresas de ${categoria} e atendo negócios em ${cidade}${
      business.state ? ` - ${business.state}` : ""
    }.

O que encontrei em bases públicas:
• ${semSiteInformado ? "Nenhum site informado na fonte consultada" : `Site informado: ${business.website}`}
• Contato listado: ${formatPhone(business.phone)}
• Endereço: ${fullAddress(business)}

Observação: essas informações vêm do Google Maps e podem estar incompletas — se algo estiver desatualizado, me corrija.

Proposta: um site rápido, otimizado para buscas locais e com contato direto no WhatsApp.

Posso te enviar uma prévia sem compromisso?`,
  };
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

import type { Lead } from "@/types";

export function buildSitePrompt(lead: Lead) {
  const missing = "[INFORMAR]";
  return `# PAPEL
Você é um designer e desenvolvedor web sênior especializado em sites institucionais para empresas locais brasileiras.

# CONTEXTO DA EMPRESA
Nome: ${lead.name}
Nicho / categoria: ${lead.category}
Cidade: ${lead.city}
Estado: ${lead.state}
Endereço: ${lead.address}
Nota de avaliação: ${lead.rating.toFixed(1)}
Quantidade de avaliações: ${lead.reviews}
Telefone: ${lead.phone}
WhatsApp: ${lead.whatsapp ? "sim" : "não informado"}
Site atual: ${lead.website ?? "não possui site"}
Instagram: ${lead.instagram ?? "não informado"}
Serviços detalhados: ${missing}
Horário de funcionamento: ${missing}

# OBJETIVO DO SITE
Criar a primeira presença digital profissional da empresa, transmitindo credibilidade
local e convertendo visitantes em contato direto por WhatsApp e telefone.

# IDENTIDADE VISUAL
- Estética limpa, moderna e adequada ao nicho "${lead.category}".
- Paleta sóbria com uma única cor de destaque; sem gradientes exagerados.
- Tipografia legível, hierarquia clara, espaçamento generoso mas sem desperdício.
- Fotografia real da empresa quando disponível; caso contrário, usar placeholders.

# ESTRUTURA DO SITE
1. Hero — nome, proposta de valor, cidade e CTA principal.
2. Sobre — apresentação curta e honesta da empresa.
3. Serviços — apenas os serviços efetivamente informados.
4. Diferenciais — pontos objetivos (atendimento, localização, avaliações).
5. Avaliações — destacar nota ${lead.rating.toFixed(1)} e ${lead.reviews} avaliações.
6. Galeria — fotos do espaço/serviços.
7. Localização — endereço, mapa e referências.
8. FAQ — dúvidas frequentes do nicho.
9. CTA final — contato por WhatsApp e telefone.

# CTA
CTA primário: falar no WhatsApp (${lead.phone}).
CTA secundário: ligar agora.
CTAs visíveis no hero, no meio da página e no rodapé fixo em mobile.

# RESPONSIVIDADE
Mobile-first, testado em 390x844, 768x1024 e 1440x900. Botões com área de toque adequada.

# SEO
- Title com nome + serviço + cidade (até 60 caracteres).
- Meta description até 160 caracteres.
- Um único H1, headings semânticos, alt em todas as imagens.
- JSON-LD LocalBusiness com nome, endereço, telefone e nota.

# REGRAS DE CONTEÚDO (OBRIGATÓRIO)
NÃO INVENTAR: serviços, preços, depoimentos, certificações, história, promoções,
informações médicas ou qualquer dado não fornecido acima.
Quando faltar informação, utilizar placeholder explícito no formato ${missing}
e listar ao final tudo que precisa ser confirmado com o cliente.`;
}

export function buildMessages(lead: Lead) {
  const semSite = !lead.website;
  return {
    curta: `Oi! Tudo bem? Vi a ${lead.name} aqui em ${lead.city} e achei o trabalho de vocês muito bom. ${
      semSite ? "Notei que vocês ainda não têm um site próprio." : "Vi que o site de vocês pode render bem mais."
    } Posso te mostrar uma ideia rápida?`,
    natural: `Olá! Me chamo [SEU NOME], trabalho criando sites para empresas de ${lead.city}. Conheci a ${lead.name} pelas avaliações (${lead.rating.toFixed(
      1,
    )} com ${lead.reviews} avaliações — bem acima da média do setor de ${lead.category.toLowerCase()}). ${
      semSite
        ? "Percebi que vocês ainda não têm um site próprio, e hoje muita gente pesquisa antes de ligar."
        : "Dei uma olhada no site atual e vi pontos simples que aumentariam os contatos."
    } Montei uma ideia de como poderia ficar a presença online de vocês. Posso te enviar?`,
    comercial: `Olá, falo com o responsável pela ${lead.name}?

Sou especialista em sites para empresas de ${lead.category.toLowerCase()} e trabalho com negócios em ${lead.city} - ${lead.state}.

O que identifiquei:
• ${semSite ? "A empresa não possui site próprio" : "O site atual não converte bem"}
• Reputação forte: ${lead.rating.toFixed(1)} estrelas com ${lead.reviews} avaliações
• Contato principal hoje: ${lead.phone}

Proposta: um site rápido, otimizado para buscas locais e com contato direto no WhatsApp, entregue em poucos dias.

Posso te enviar uma prévia sem compromisso?`,
  };
}

export function buildKit(lead: Lead) {
  const messages = buildMessages(lead);
  return [
    {
      title: "Resumo da empresa",
      content: `${lead.name} — ${lead.category}\n${lead.city} - ${lead.state}\nNota ${lead.rating.toFixed(1)} (${lead.reviews} avaliações)\nSite: ${
        lead.website ?? "sem site"
      }`,
    },
    {
      title: "Score e motivos",
      content: `Lead Score ${lead.score}/100\n${lead.scoreFactors.map((f) => `+${f.points} ${f.label}`).join("\n")}`,
    },
    {
      title: "Contato",
      content: `Telefone: ${lead.phone}\nWhatsApp: ${lead.whatsapp ? "sim" : "não informado"}\nInstagram: ${
        lead.instagram ?? "não informado"
      }\nEndereço: ${lead.address}, ${lead.city} - ${lead.state}`,
    },
    { title: "Mensagem curta", content: messages.curta },
    { title: "Mensagem natural", content: messages.natural },
    { title: "Mensagem comercial", content: messages.comercial },
    { title: "Prompt do site", content: buildSitePrompt(lead) },
  ];
}

export function toCsv(leads: Lead[]) {
  const header = [
    "empresa",
    "categoria",
    "cidade",
    "estado",
    "telefone",
    "site",
    "nota",
    "avaliacoes",
    "score",
    "status",
  ];
  const rows = leads.map((l) =>
    [
      l.name,
      l.category,
      l.city,
      l.state,
      l.phone,
      l.website ?? "sem site",
      l.rating,
      l.reviews,
      l.score,
      l.status,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );
  return [header.join(","), ...rows].join("\n");
}

export function demoPhotos(lead: Lead) {
  return Array.from({ length: 6 }, (_, i) => ({
    id: `${lead.id}-${i}`,
    url: `https://picsum.photos/seed/${encodeURIComponent(lead.id)}-${i}/640/420`,
    alt: `Foto de demonstração ${i + 1} — ${lead.category} (imagem ilustrativa)`,
  }));
}

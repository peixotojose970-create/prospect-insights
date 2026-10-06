import type { Business } from "@/types";
import { formatPhone, fullAddress } from "./format";

export type CallBranchId =
  | "abertura"
  | "gk_quem_fala"
  | "gk_sobre_o_que"
  | "gk_quer_quem"
  | "gk_nao_esta"
  | "gk_deixar_recado"
  | "gk_mandar_whats"
  | "resp_abertura"
  | "descoberta"
  | "desc_so_instagram"
  | "desc_so_whats"
  | "desc_ja_pensamos"
  | "desc_nao_precisamos"
  | "desc_ja_tem_site"
  | "solucao"
  | "obj_sem_interesse"
  | "obj_insta_resolve"
  | "obj_whats_resolve"
  | "obj_nao_preciso"
  | "obj_esta_caro"
  | "obj_preciso_pensar"
  | "obj_falar_socio"
  | "obj_agora_nao"
  | "obj_ja_tenho_quem_faz"
  | "obj_ja_tenho_site"
  | "obj_manda_whats"
  | "obj_estou_ocupado"
  | "preco"
  | "fechamento"
  | "fechamento_alt";

export type CallChoice = {
  label: string;
  target: CallBranchId;
  variant?: "default" | "outline" | "secondary" | "destructive";
};

export type CallNode = {
  id: CallBranchId;
  stage: string;
  speaker: "VOCÊ" | "ATENDENTE" | "RESPONSÁVEL" | "SITUAÇÃO";
  speech: string;
  contextNote?: string;
  choices: CallChoice[];
};

export type CallScriptData = {
  companyName: string;
  category: string;
  cityState: string;
  phone: string;
  siteStatus: string;
  website: string | null;
  nodes: Record<CallBranchId, CallNode>;
};

export function generateCallScript(business: Business): CallScriptData {
  const companyName = business.name?.trim() || "o estabelecimento";
  const category = business.category && business.category !== "Não informado" ? business.category.trim() : "";
  const categoryLower = category ? category.toLowerCase() : "";
  const locationParts = [business.neighborhood, business.city, business.state].filter(Boolean);
  const cityState = [business.city, business.state].filter(Boolean).join(" - ") || "Local não informado";
  const formattedPhone = formatPhone(business.phone);
  const hasSite = Boolean(business.website);
  const siteStatus = hasSite
    ? `Site informado: ${business.website}`
    : business.socialUrl
      ? `Sem site próprio (apenas link social informado: ${business.socialUrl})`
      : "Sem site informado no cadastro";

  const empresaRef = `da ${companyName}`;
  const empresaVocativo = `a ${companyName}`;
  const categoryRef = categoryLower ? ` no ramo de ${categoryLower}` : "";

  const nodes: Record<CallBranchId, CallNode> = {
    abertura: {
      id: "abertura",
      stage: "1. Gatekeeper / Quem atendeu",
      speaker: "VOCÊ",
      speech: `Boa tarde, é ${empresaRef}?`,
      contextNote: "Primeiro contato. Fale com calma e clareza, confirmando se ligou no lugar certo.",
      choices: [
        { label: "SIM / POIS NÃO", target: "gk_quem_fala" },
        { label: "QUEM FALA?", target: "gk_quem_fala" },
        { label: "QUER FALAR COM QUEM?", target: "gk_quer_quem" },
        { label: "SOBRE O QUE SERIA?", target: "gk_sobre_o_que" },
        { label: "JÁ É O PRÓPRIO RESPONSÁVEL", target: "resp_abertura" },
        { label: "ELE NÃO ESTÁ", target: "gk_nao_esta" },
      ],
    },

    gk_quem_fala: {
      id: "gk_quem_fala",
      stage: "1. Gatekeeper / Quem atendeu",
      speaker: "VOCÊ",
      speech: `É o Alysson, da NEXORA. Eu queria falar rapidinho com o responsável pelo negócio.`,
      contextNote: "Objetivo direto: chegar em quem toma decisão sem parecer invasivo.",
      choices: [
        { label: "TRANSFERIU / RESPONSÁVEL ATENDEU", target: "resp_abertura" },
        { label: "SOBRE O QUÊ?", target: "gk_sobre_o_que" },
        { label: "ELE NÃO ESTÁ", target: "gk_nao_esta" },
        { label: "PODE DEIXAR RECADO", target: "gk_deixar_recado" },
        { label: "PODE MANDAR NO WHATSAPP", target: "gk_mandar_whats" },
      ],
    },

    gk_sobre_o_que: {
      id: "gk_sobre_o_que",
      stage: "1. Gatekeeper / Quem atendeu",
      speaker: "VOCÊ",
      speech: `É uma proposta comercial relacionada à presença digital da empresa. É bem rapidinho.`,
      contextNote: "Curto, sem enrolar. Transmite profissionalismo.",
      choices: [
        { label: "TRANSFERIU / RESPONSÁVEL ATENDEU", target: "resp_abertura" },
        { label: "ELE NÃO ESTÁ", target: "gk_nao_esta" },
        { label: "PODE DEIXAR RECADO", target: "gk_deixar_recado" },
        { label: "PODE MANDAR NO WHATSAPP", target: "gk_mandar_whats" },
      ],
    },

    gk_quer_quem: {
      id: "gk_quer_quem",
      stage: "1. Gatekeeper / Quem atendeu",
      speaker: "VOCÊ",
      speech: `Com a pessoa responsável pela parte comercial e decisões da ${companyName}, por favor.`,
      contextNote: "Foque na pessoa que tem autonomia para decidir.",
      choices: [
        { label: "TRANSFERIU / RESPONSÁVEL ATENDEU", target: "resp_abertura" },
        { label: "SOBRE O QUÊ?", target: "gk_sobre_o_que" },
        { label: "ELE NÃO ESTÁ", target: "gk_nao_esta" },
      ],
    },

    gk_nao_esta: {
      id: "gk_nao_esta",
      stage: "1. Gatekeeper / Quem atendeu",
      speaker: "VOCÊ",
      speech: `Entendi. Qual é o melhor horário pra eu conseguir falar direto com ele?`,
      contextNote: "Pegue o melhor período ou dia para tentar novamente.",
      choices: [
        { label: "DEU HORÁRIO / TENTAR DEPOIS", target: "fechamento_alt" },
        { label: "DISSE PRA MANDAR NO WHATSAPP", target: "gk_mandar_whats" },
        { label: "DISSE PRA DEIXAR RECADO", target: "gk_deixar_recado" },
      ],
    },

    gk_deixar_recado: {
      id: "gk_deixar_recado",
      stage: "1. Gatekeeper / Quem atendeu",
      speaker: "VOCÊ",
      speech: `Perfeito. Pode avisar que o Alysson da NEXORA ligou sobre a presença digital da empresa? Qual o melhor canal pra eu dar um alô direto pra ele?`,
      contextNote: "Tente colher contato direto ou horário ideal.",
      choices: [
        { label: "PASSOU CONTATO / WHATSAPP", target: "gk_mandar_whats" },
        { label: "ENCERRAR E RETORNAR MAIS TARDE", target: "fechamento_alt" },
      ],
    },

    gk_mandar_whats: {
      id: "gk_mandar_whats",
      stage: "1. Gatekeeper / Quem atendeu",
      speaker: "VOCÊ",
      speech: `Combinado! Esse próprio número aqui recebe WhatsApp, ou teria um contato direto com ele?`,
      contextNote: "Confirma se o número da ligação é o WhatsApp que o tomador de decisão lê.",
      choices: [
        { label: "É ESSE MESMO (ENVIAR MENSAGEM)", target: "fechamento_alt" },
        { label: "PASSOU OUTRO NÚMERO", target: "fechamento_alt" },
        { label: "RESPONSÁVEL ACABOU ATENDENDO", target: "resp_abertura" },
      ],
    },

    resp_abertura: {
      id: "resp_abertura",
      stage: "2. Responsável atendeu",
      speaker: "VOCÊ",
      speech: `Boa tarde, tudo certo? Meu nome é Alysson, da NEXORA. Vou ser 100% honesto com você: eu tenho uma proposta pro seu negócio. Você me dá 30 segundos e depois você decide?`,
      contextNote: "Abertura direta, sem enrolação. Dá controle pro cliente nos 30 segundos.",
      choices: [
        { label: "SIM / PODE FALAR (30s)", target: "descoberta" },
        { label: "DO QUE SE TRATA?", target: "descoberta" },
        { label: "ESTOU OCUPADO AGORA", target: "obj_estou_ocupado" },
        { label: "NÃO TENHO INTERESSE", target: "obj_sem_interesse" },
      ],
    },

    descoberta: {
      id: "descoberta",
      stage: "3. Descoberta",
      speaker: "VOCÊ",
      speech: hasSite
        ? `Hoje vi que vocês já possuem um site para a ${companyName}. Vocês sentem que ele realmente traz novos clientes, ou o forte de vocês continua sendo WhatsApp e Instagram?`
        : `Hoje vocês já têm algum site próprio da ${companyName} ou trabalham mais pelo Instagram e WhatsApp?`,
      contextNote: hasSite
        ? `Lead tem site informado (${business.website}). Verifique se gera resultado.`
        : `Lead sem site próprio informado no cadastro. Não invente nada, descubra a realidade.`,
      choices: [
        { label: "SÓ USAMOS INSTAGRAM", target: "desc_so_instagram" },
        { label: "SÓ USAMOS WHATSAPP", target: "desc_so_whats" },
        { label: "JÁ PENSAMOS EM TER SITE", target: "desc_ja_pensamos" },
        { label: "NÃO PRECISAMOS DE SITE", target: "desc_nao_precisamos" },
        { label: "JÁ TEMOS SITE", target: "desc_ja_tem_site" },
        { label: "PERGUNTOU QUANTO CUSTA?", target: "preco" },
      ],
    },

    desc_so_instagram: {
      id: "desc_so_instagram",
      stage: "3. Descoberta",
      speaker: "VOCÊ",
      speech: `Entendi. E vocês nunca chegaram a pensar em ter um site ou nunca viram muita necessidade?`,
      contextNote: "Pergunta aberta e neutra. Deixa a pessoa explicar o motivo real.",
      choices: [
        { label: "NUNCA VIMOS NECESSIDADE", target: "obj_insta_resolve" },
        { label: "ATÉ PENSAMOS, MAS FICOU PRA DEPOIS", target: "solucao" },
        { label: "ACHA QUE SAI CARO OU DÁ TRABALHO", target: "solucao" },
        { label: "APRESENTAR A SOLUÇÃO", target: "solucao" },
      ],
    },

    desc_so_whats: {
      id: "desc_so_whats",
      stage: "3. Descoberta",
      speaker: "VOCÊ",
      speech: `O WhatsApp é essencial mesmo. Mas quando alguém procura por ${categoryLower || "serviços como o seu"} no Google aqui na região, vocês chegam a perder clientes por não terem uma página própria com todas as informações organizadas?`,
      contextNote: "Mostra o ponto cego: clientes do Google que não acham a empresa.",
      choices: [
        { label: "FAZ SENTIDO / NUNCA PENSEI NISSO", target: "solucao" },
        { label: "WHATSAPP JÁ RESOLVE PRA MIM", target: "obj_whats_resolve" },
        { label: "APRESENTAR A SOLUÇÃO", target: "solucao" },
      ],
    },

    desc_ja_pensamos: {
      id: "desc_ja_pensamos",
      stage: "3. Descoberta",
      speaker: "VOCÊ",
      speech: `Legal! E o que acabou travando na época? Foi mais questão de tempo, custo ou não acharam alguém de confiança?`,
      contextNote: "Identifica a dor que impediu o fechamento anterior.",
      choices: [
        { label: "FALTOU TEMPO / DÁ TRABALHO", target: "solucao" },
        { label: "ACHOU MUITO CARO", target: "solucao" },
        { label: "APRESENTAR A SOLUÇÃO", target: "solucao" },
      ],
    },

    desc_nao_precisamos: {
      id: "desc_nao_precisamos",
      stage: "3. Descoberta",
      speaker: "VOCÊ",
      speech: `Tranquilo, compreendo perfeitamente. Vocês têm uma demanda boa por indicação, né? Só pra eu entender: hoje quem pesquisa no Google sobre ${categoryLower || "o negócio de vocês"} consegue encontrar tudo fácil num lugar só?`,
      contextNote: "Valida a força do negócio e planta a semente do Google sem confronto.",
      choices: [
        { label: "NÃO ENCONTRAM / PODERIA SER MELHOR", target: "solucao" },
        { label: "NÃO PRECISO MESMO", target: "obj_nao_preciso" },
        { label: "APRESENTAR A SOLUÇÃO", target: "solucao" },
      ],
    },

    desc_ja_tem_site: {
      id: "desc_ja_tem_site",
      stage: "3. Descoberta",
      speaker: "VOCÊ",
      speech: `Perfeito! E esse site hoje tá atualizado e moderno no celular, ou é daquele tipo que vocês quase não mexem?`,
      contextNote: "Maioria dos sites locais é antigo ou não funciona bem no celular.",
      choices: [
        { label: "ESTÁ ANTIGO / PRECISA ATUALIZAR", target: "solucao" },
        { label: "JÁ TENHO QUEM CUIDA DISSO", target: "obj_ja_tenho_quem_faz" },
        { label: "ESTÁ ÓTIMO / SATISFEITO", target: "obj_ja_tenho_site" },
      ],
    },

    solucao: {
      id: "solucao",
      stage: "4. Apresentação da Solução",
      speaker: "VOCÊ",
      speech: `A NEXORA cria sites profissionais rápidos, direto ao ponto e otimizados para o celular. A gente entrega tudo pronto em 1 a 2 dias, sem você perder tempo nem esquentar a cabeça.`,
      contextNote: "Apresentação curta e objetiva. Não cuspa o preço ainda; espere a reação.",
      choices: [
        { label: "GOSTOU / COMO FUNCIONA?", target: "fechamento" },
        { label: "QUANTO CUSTA?", target: "preco" },
        { label: "NÃO TENHO INTERESSE", target: "obj_sem_interesse" },
        { label: "INSTAGRAM JÁ RESOLVE", target: "obj_insta_resolve" },
        { label: "WHATSAPP JÁ RESOLVE", target: "obj_whats_resolve" },
        { label: "ME MANDA NO WHATSAPP", target: "obj_manda_whats" },
        { label: "PROPOR VERSÃO TESTE (FECHAMENTO)", target: "fechamento" },
      ],
    },

    preco: {
      id: "preco",
      stage: "6. Preço",
      speaker: "VOCÊ",
      speech: `Pra criar o site são R$300. Depois fica R$50 por mês pra manter o site no ar e fazer as atualizações.`,
      contextNote: "PARE E ESPERE O CLIENTE FALAR. Não fique se justificando nem abaixando preço.",
      choices: [
        { label: "ACHOU BOM / GOSTOU", target: "fechamento" },
        { label: "ESTÁ CARO", target: "obj_esta_caro" },
        { label: "PRECISO PENSAR", target: "obj_preciso_pensar" },
        { label: "TENHO QUE FALAR COM SÓCIO", target: "obj_falar_socio" },
        { label: "ME MANDA NO WHATSAPP", target: "obj_manda_whats" },
        { label: "IR PARA O FECHAMENTO", target: "fechamento" },
      ],
    },

    fechamento: {
      id: "fechamento",
      stage: "7. Fechamento (Demonstração)",
      speaker: "VOCÊ",
      speech: `Vamos fazer o seguinte: eu monto uma primeira versão pra vocês sem compromisso. Você olha como ficou, me fala o que achou e aí decide. Pode ser?`,
      contextNote: "Proposta de baixíssimo atrito: remove o risco para o cliente.",
      choices: [
        { label: "ACEITOU / PODE MONTAR", target: "fechamento_alt" },
        { label: "ME MANDA NO WHATSAPP", target: "obj_manda_whats" },
        { label: "PRECISO PENSAR", target: "obj_preciso_pensar" },
        { label: "TENHO QUE FALAR COM MEU SÓCIO", target: "obj_falar_socio" },
      ],
    },

    fechamento_alt: {
      id: "fechamento_alt",
      stage: "7. Fechamento — Próximo Passo",
      speaker: "VOCÊ",
      speech: `Perfeito! Vou te mandar um alô agora no WhatsApp com o meu contato. Assim que eu colocar a prévia no ar, já te envio o link pra você dar uma olhada. Valeu pela atenção!`,
      contextNote: "Finalização educada e compromisso assumido.",
      choices: [
        { label: "VOLTAR AO INÍCIO DO ROTEIRO", target: "abertura" },
        { label: "VER OBJEÇÕES", target: "obj_sem_interesse" },
      ],
    },

    obj_sem_interesse: {
      id: "obj_sem_interesse",
      stage: "5. Objeções",
      speaker: "VOCÊ",
      speech: `Tranquilo. Só pra eu entender: você não vê necessidade de um site ou é mais porque não quer investir nisso agora?`,
      contextNote: "Desarma a objeção e descobre o verdadeiro obstáculo.",
      choices: [
        { label: "NÃO QUER INVESTIR AGORA", target: "preco" },
        { label: "NÃO VÊ NECESSIDADE", target: "desc_nao_precisamos" },
        { label: "OFERECER PRÉVIA SEM COMPROMISSO", target: "fechamento" },
        { label: "AGORA NÃO", target: "obj_agora_nao" },
      ],
    },

    obj_insta_resolve: {
      id: "obj_insta_resolve",
      stage: "5. Objeções",
      speaker: "VOCÊ",
      speech: `O Instagram de vocês é ótimo pra quem já conhece. A vantagem do site é pegar aquele cliente do Google que tá procurando ${categoryLower || "esse serviço"} agora e precisa de endereço, horário e botão direto pro WhatsApp.`,
      contextNote: "O site e o Instagram se complementam, não disputam.",
      choices: [
        { label: "PROPOR VERSÃO SEM COMPROMISSO", target: "fechamento" },
        { label: "QUANTO CUSTA?", target: "preco" },
        { label: "ME MANDA NO WHATSAPP", target: "obj_manda_whats" },
      ],
    },

    obj_whats_resolve: {
      id: "obj_whats_resolve",
      stage: "5. Objeções",
      speaker: "VOCÊ",
      speech: `Com certeza, o WhatsApp é onde fecha a venda! O papel do site é justamente colocar mais pessoas qualificadas chamando no WhatsApp de vocês todos os dias.`,
      contextNote: "Mostre que o site canaliza clientes para o WhatsApp dele.",
      choices: [
        { label: "PROPOR VERSÃO SEM COMPROMISSO", target: "fechamento" },
        { label: "QUANTO CUSTA?", target: "preco" },
      ],
    },

    obj_nao_preciso: {
      id: "obj_nao_preciso",
      stage: "5. Objeções",
      speaker: "VOCÊ",
      speech: `Totalmente compreensível se vocês já estão com a agenda cheia. Posso só te mandar uma ideia no WhatsApp pra quando vocês forem expandir?`,
      contextNote: "Não brigue. Mantenha a porta aberta.",
      choices: [
        { label: "PODE MANDAR", target: "obj_manda_whats" },
        { label: "NÃO QUER RECEBER", target: "fechamento_alt" },
      ],
    },

    obj_esta_caro: {
      id: "obj_esta_caro",
      stage: "5. Objeções",
      speaker: "VOCÊ",
      speech: `Entendo. Comparado com uma agência que cobra R$2.000 ou R$3.000, R$300 cabe no orçamento de quase qualquer empresa. Com um cliente novo que o site trouxer, ele já se paga.`,
      contextNote: "Âncora de preço com agências tradicionais e retorno sobre investimento.",
      choices: [
        { label: "FAZ SENTIDO / OFERECER PRÉVIA", target: "fechamento" },
        { label: "AINDA ACHOU CARO", target: "fechamento_alt" },
      ],
    },

    obj_preciso_pensar: {
      id: "obj_preciso_pensar",
      stage: "5. Objeções",
      speaker: "VOCÊ",
      speech: `Claro, sem pressa. Qual é a sua principal dúvida hoje pra gente já tirar da frente?`,
      contextNote: "Descubra qual é a dúvida oculta por trás do 'pensar'.",
      choices: [
        { label: "DÚVIDA DE PREÇO", target: "preco" },
        { label: "PROPOR VER A PRÉVIA ANTES DE DECIDIR", target: "fechamento" },
        { label: "MANDA NO WHATSAPP PRA EU PENSAR", target: "obj_manda_whats" },
      ],
    },

    obj_falar_socio: {
      id: "obj_falar_socio",
      stage: "5. Objeções",
      speaker: "VOCÊ",
      speech: `Perfeito. Fica até mais fácil pra você mostrar pra ele se já tiver uma versão pronta visual. Eu monto a prévia sem compromisso, você mostra pro sócio e vocês avaliam juntos. Pode ser?`,
      contextNote: "Dá a ferramenta de venda na mão do sócio.",
      choices: [
        { label: "ACEITOU / MONTAR PRÉVIA", target: "fechamento_alt" },
        { label: "MANDAR NO WHATSAPP", target: "obj_manda_whats" },
      ],
    },

    obj_agora_nao: {
      id: "obj_agora_nao",
      stage: "5. Objeções",
      speaker: "VOCÊ",
      speech: `Sem problemas. Qual mês ou época do ano costuma ser mais tranquilo pra vocês olharem isso?`,
      contextNote: "Consegue a data exata de follow-up.",
      choices: [
        { label: "DEU DATA / AGENDAR CONTATO", target: "fechamento_alt" },
        { label: "MANDA NO WHATSAPP", target: "obj_manda_whats" },
      ],
    },

    obj_ja_tenho_quem_faz: {
      id: "obj_ja_tenho_quem_faz",
      stage: "5. Objeções",
      speaker: "VOCÊ",
      speech: `Ótimo! E vocês estão satisfeitos com o suporte e a rapidez dele, ou às vezes demora pra atualizar?`,
      contextNote: "Pontos fracos comuns: demora de resposta e suporte ruim.",
      choices: [
        { label: "DEMORA BASTANTE", target: "solucao" },
        { label: "ESTÁ SATISFEITO", target: "fechamento_alt" },
      ],
    },

    obj_ja_tenho_site: {
      id: "obj_ja_tenho_site",
      stage: "5. Objeções",
      speaker: "VOCÊ",
      speech: `Maravilha ter o site! Ele hoje é rápido no celular e recebe contatos todo mês, ou tá mais paradinho?`,
      contextNote: "Muitas empresas têm site abandonado que não converte.",
      choices: [
        { label: "TÁ PARADINHO / PODERIA MELHORAR", target: "solucao" },
        { label: "CONVERTE BEM", target: "fechamento_alt" },
      ],
    },

    obj_manda_whats: {
      id: "obj_manda_whats",
      stage: "5. Objeções",
      speaker: "VOCÊ",
      speech: `Mando sim! Esse número aqui mesmo é o seu WhatsApp? Me diz só seu nome pra eu salvar aqui certinho.`,
      contextNote: "Pega o nome da pessoa e confirma o número de contato direto.",
      choices: [
        { label: "CONFIRMOU NÚMERO E NOME", target: "fechamento_alt" },
        { label: "PASSOU OUTRO NÚMERO", target: "fechamento_alt" },
      ],
    },

    obj_estou_ocupado: {
      id: "obj_estou_ocupado",
      stage: "5. Objeções",
      speaker: "VOCÊ",
      speech: `Imagino a correria! Te dou um retorno no final da tarde ou prefere que eu te chame amanhã de manhã?`,
      contextNote: "Dá duas opções fechadas para remarcar a ligação.",
      choices: [
        { label: "FINAL DA TARDE", target: "fechamento_alt" },
        { label: "AMANHÃ DE MANHÃ", target: "fechamento_alt" },
        { label: "MANDA NO WHATSAPP", target: "obj_manda_whats" },
      ],
    },
  };

  return {
    companyName,
    category,
    cityState,
    phone: formattedPhone,
    siteStatus,
    website: business.website,
    nodes,
  };
}

import type { Business } from "@/types";
import { formatPhone } from "./format";

export type CallStageId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type CustomerAlternative = {
  customerSays: string;
  recommendedReply: string;
  nextQuestion?: string;
  nextStage?: CallStageId;
};

export type CallStageData = {
  stageId: CallStageId;
  stepNumber: string;
  title: string;
  shortLabel: string;
  mainSpeaker: "VOCÊ" | "CLIENTE";
  mainSpeech: string;
  contextTip?: string;
  subSections?: {
    label: string;
    speech: string;
    note?: string;
  }[];
  alternatives: CustomerAlternative[];
};

export type GeneratedCallScript = {
  companyName: string;
  category: string;
  city: string;
  phone: string;
  siteStatus: string;
  hasWebsite: boolean;
  stages: Record<CallStageId, CallStageData>;
};

export type CallScriptProfile = {
  personalName?: string;
  companyName?: string;
};

function getCategoryTone(category: string): {
  vocative: string;
  servicesDescription: string;
} {
  const cat = (category || "").toLowerCase();

  if (
    cat.includes("barbe") ||
    cat.includes("cabel") ||
    cat.includes("salao") ||
    cat.includes("salão") ||
    cat.includes("estetica") ||
    cat.includes("estética")
  ) {
    return {
      vocative: "da barbearia / salão",
      servicesDescription: "tabela de serviços, fotos dos cortes, horários e botão direto pro WhatsApp",
    };
  }

  if (
    cat.includes("oficina") ||
    cat.includes("mecanic") ||
    cat.includes("mecânic") ||
    cat.includes("auto") ||
    cat.includes("funilaria") ||
    cat.includes("pneu")
  ) {
    return {
      vocative: "da oficina",
      servicesDescription: "serviços mecânicos, fotos, localização no mapa e botão de WhatsApp imediato",
    };
  }

  if (
    cat.includes("clinic") ||
    cat.includes("clínic") ||
    cat.includes("odonto") ||
    cat.includes("dentist") ||
    cat.includes("saude") ||
    cat.includes("saúde") ||
    cat.includes("med") ||
    cat.includes("méd")
  ) {
    return {
      vocative: "da clínica",
      servicesDescription: "especialidades, equipe, localização, convênios e agendamento direto pelo WhatsApp",
    };
  }

  if (
    cat.includes("restaur") ||
    cat.includes("pizz") ||
    cat.includes("lanch") ||
    cat.includes("hamburg") ||
    cat.includes("bar") ||
    cat.includes("café") ||
    cat.includes("cafe")
  ) {
    return {
      vocative: "do restaurante",
      servicesDescription: "cardápio, fotos dos pratos, endereço e botão direto de pedidos no WhatsApp",
    };
  }

  return {
    vocative: "do negócio",
    servicesDescription: "serviços, informações, imagens, localização e WhatsApp da empresa",
  };
}

export function generateCallScript(
  business?: Business | null,
  profile?: CallScriptProfile,
): GeneratedCallScript {
  const companyName = business?.name?.trim() || "Não informado";
  const categoryRaw = business?.category?.trim();
  const category = categoryRaw && categoryRaw !== "Não informado" ? categoryRaw : "Não informado";

  const cityParts = [business?.city?.trim(), business?.state?.trim()].filter(Boolean);
  const city = cityParts.length > 0 ? cityParts.join(" - ") : "Não informado";

  const rawPhone = business?.phone?.trim();
  const phone = rawPhone ? formatPhone(rawPhone) : "Não informado";

  const websiteRaw = business?.website?.trim();
  const hasWebsite = Boolean(websiteRaw);
  const siteStatus = hasWebsite ? websiteRaw : "Não informado";

  const tone = getCategoryTone(category !== "Não informado" ? category : "");
  const targetName = companyName !== "Não informado" ? companyName : "empresa";
  const personalName = profile?.personalName?.trim();
  const representativeCompanyName = profile?.companyName?.trim() || "nossa equipe";
  const introduction = personalName
    ? `Meu nome é ${personalName}, da ${representativeCompanyName}`
    : `Sou um consultor da ${representativeCompanyName}`;
  const shortIntroduction = personalName
    ? `É ${personalName}, da ${representativeCompanyName}`
    : `Sou um consultor da ${representativeCompanyName}`;

  const stages: Record<CallStageId, CallStageData> = {
    1: {
      stageId: 1,
      stepNumber: "1",
      title: "1. Primeiro contato",
      shortLabel: "Primeiro contato",
      mainSpeaker: "VOCÊ",
      mainSpeech: `Boa tarde, é da ${targetName}?`,
      contextTip: "Tom calmo e simpático. O único objetivo agora é confirmar com quem você está falando.",
      alternatives: [
        {
          customerSays: '"Quem fala?"',
          recommendedReply: `${shortIntroduction}. Eu queria falar rapidinho com o responsável pelo negócio.`,
        },
        {
          customerSays: '"Sim."',
          recommendedReply: `Prazer! ${introduction}. Eu queria falar rapidinho com o responsável pelo negócio.`,
        },
        {
          customerSays: '"Pois não."',
          recommendedReply: `Oi! ${shortIntroduction}. Gostaria de falar rapidinho com o responsável pela empresa.`,
        },
        {
          customerSays: '"Sobre o que seria?"',
          recommendedReply: `É uma proposta rápida sobre a presença digital e novos clientes da ${targetName}. Leva menos de 1 minuto.`,
        },
        {
          customerSays: '"Quem você procura?"',
          recommendedReply: `Procuro quem toma as decisões comerciais ou responde pela ${targetName}, por favor.`,
        },
      ],
    },

    2: {
      stageId: 2,
      stepNumber: "2",
      title: "2. Falar com o responsável",
      shortLabel: "Responsável",
      mainSpeaker: "VOCÊ",
      mainSpeech: `Você é o responsável pelo negócio?`,
      contextTip: "Identifique se a pessoa pode tomar decisão antes de apresentar qualquer proposta.",
      subSections: [
        {
          label: "SE SIM (É O RESPONSÁVEL) — ABERTURA COMERCIAL",
          speech: `${introduction}. Vou ser 100% honesto com você: eu tenho uma proposta pro seu negócio. Você me dá 30 segundos e depois você decide?`,
          note: "Abertura rápida e honesta que quebra a resistência comum de telemarketing.",
        },
        {
          label: "SE NÃO (ATENDENTE / RECEPÇÃO / OUTRO)",
          speech: `Entendi. Você consegue me passar o contato dele ou me dizer qual seria o melhor horário pra eu falar com ele?`,
          note: "Pegue o contato direto no WhatsApp ou o melhor horário para retornar.",
        },
      ],
      alternatives: [
        {
          customerSays: '"Sim, sou eu. Pode falar."',
          recommendedReply: `${introduction}. Vou ser 100% honesto com você: eu tenho uma proposta pro seu negócio. Você me dá 30 segundos e depois você decide?`,
          nextStage: 3,
        },
        {
          customerSays: '"Não está no momento / Tá viajando."',
          recommendedReply: `Entendi. Você consegue me passar o contato dele ou me dizer qual seria o melhor horário pra eu falar com ele?`,
        },
        {
          customerSays: '"Do que se trata primeiro?"',
          recommendedReply: `É sobre a captação de clientes da ${targetName} na internet. Consigo falar com ele 30 segundos?`,
        },
      ],
    },

    3: {
      stageId: 3,
      stepNumber: "3",
      title: "3. Descobrir a situação",
      shortLabel: "Descoberta",
      mainSpeaker: "VOCÊ",
      mainSpeech: hasWebsite
        ? `Vi que vocês já têm um site informado. Ele hoje funciona rápido no celular e traz clientes, ou tá mais parado precisando de uma renovada?`
        : `Hoje vocês trabalham mais pelo Instagram e WhatsApp? E vocês já chegaram a pensar em ter um site ou nunca viram muita necessidade?`,
      contextTip: hasWebsite
        ? `A empresa possui site informado (${siteStatus}). Avalie se precisa de atualização ou modernização.`
        : `A empresa NÃO tem site informado. Entenda como atendem e se já consideraram ter um canal próprio.`,
      alternatives: [
        {
          customerSays: '"A gente só usa Instagram."',
          recommendedReply: `Entendi. E hoje vocês sentem que o Instagram já dá conta de apresentar tudo da empresa ou já pensaram em ter um espaço próprio?`,
          nextStage: 4,
        },
        {
          customerSays: '"Trabalhamos mais por WhatsApp e indicação."',
          recommendedReply: `Indicação é excelente! Mas vocês já sentiram que às vezes perdem clientes que procuram no Google e acabam indo pro concorrente?`,
          nextStage: 4,
        },
        {
          customerSays: '"Já pensamos em ter um site, mas nunca foi pra frente."',
          recommendedReply: `Entendi. A maioria dos empresários acha que demora muito ou custa caro. A nossa proposta é justamente ser rápida e acessível.`,
          nextStage: 4,
        },
        {
          customerSays: '"Não vemos muita necessidade hoje."',
          recommendedReply: `Compreendo. É porque vocês já estão com a capacidade máxima ou porque acham que o público de vocês não pesquisa no Google?`,
          nextStage: 4,
        },
        ...(hasWebsite
          ? [
              {
                customerSays: '"Nosso site funciona normal."',
                recommendedReply: `Que ótimo! E ele recebe contatos frequentes direto no WhatsApp ou tá precisando de ajustes visuais pro celular?`,
                nextStage: 4 as CallStageId,
              },
            ]
          : []),
      ],
    },

    4: {
      stageId: 4,
      stepNumber: "4",
      title: "4. Apresentar a proposta",
      shortLabel: "Apresentação",
      mainSpeaker: "VOCÊ",
      mainSpeech: `Entendi. Foi justamente por isso que eu entrei em contato. Eu trabalho com criação de sites profissionais para negócios. A ideia é deixar ${tone.servicesDescription} organizados em um lugar só.\n\nE normalmente consigo deixar tudo pronto em 1 a 2 dias.\n\nVocê acha que um site assim ajudaria o seu negócio?`,
      contextTip: `Fala curta e conversacional. Sem jargões técnicos. Personalizada para ${targetName} (${category}).`,
      alternatives: [
        {
          customerSays: '"Acho que ajudaria sim / Faz sentido."',
          recommendedReply: `Legal! A ideia é justamente facilitar a vida do cliente e passar mais credibilidade na hora que ele pesquisa ${targetName}.`,
          nextStage: 7,
        },
        {
          customerSays: '"Depende de quanto custa."',
          recommendedReply: `Total razão. Já te passo o valor de forma bem transparente.`,
          nextStage: 6,
        },
        {
          customerSays: '"Não sei se faria muita diferença."',
          recommendedReply: `Entendo. Mas se o cliente pesquisa no Google hoje e acha o concorrente organizado e vocês não, faz diferença na escolha dele?`,
          nextStage: 5,
        },
      ],
    },

    5: {
      stageId: 5,
      stepNumber: "5",
      title: "5. Se o cliente tiver uma objeção",
      shortLabel: "Objeções",
      mainSpeaker: "VOCÊ",
      mainSpeech: `Tranquilo. Só pra eu entender: você não vê necessidade de um site ou é porque não quer investir nisso agora?`,
      contextTip: "Nunca discuta. Ouça a objeção, concorde parcialmente, posicione o benefício e faça a próxima pergunta.",
      alternatives: [
        {
          customerSays: '"Não tenho interesse."',
          recommendedReply: `Tranquilo. Só pra eu entender: você não vê necessidade de um site ou é porque não quer investir nisso agora?`,
          nextQuestion: `Se eu te mostrar uma prévia pronta sem custo nenhum pro seu negócio, você toparia dar uma olhada?`,
        },
        {
          customerSays: '"Instagram já resolve."',
          recommendedReply: `O Instagram é ótimo pra engajamento. Mas quem busca no Google geralmente tá querendo contratar agora e não quer ficar caçando telefone em post.`,
          nextQuestion: `Faz sentido pra vocês ter um botão direto pra quem pesquisa ${targetName} no Google?`,
        },
        {
          customerSays: '"WhatsApp já resolve."',
          recommendedReply: `Com certeza, o WhatsApp fecha a venda. O site serve justamente pra colocar gente qualificada direto dentro do seu WhatsApp.`,
          nextQuestion: `Hoje você sente que chegam contatos novos toda semana ou poderia chegar mais?`,
        },
        {
          customerSays: '"Não preciso de site."',
          recommendedReply: `Compreendo. Se vocês já tão com a agenda 100% cheia, realmente faz sentido segurar. Mas se quiser crescer, é o canal mais barato.`,
          nextQuestion: `Se entrassem mais clientes qualificados sem tomar seu tempo, isso ajudaria o negócio?`,
        },
        {
          customerSays: '"Está caro."',
          recommendedReply: `Comparado a agências normais que cobram R$2.000, o nosso modelo é muito acessível. Um cliente novo que o site traz no mês já paga a conta.`,
          nextQuestion: `Se o investimento couber fácil no seu caixa mensal, faria sentido avaliar?`,
          nextStage: 6,
        },
        {
          customerSays: '"Preciso pensar."',
          recommendedReply: `Claro, sem problemas. Ninguém decide nada no susto.`,
          nextQuestion: `Qual é a sua principal dúvida hoje pra gente já clarear agora?`,
        },
        {
          customerSays: '"Tenho que falar com meu sócio."',
          recommendedReply: `Perfeito. Inclusive fica até mais fácil pra você mostrar pra ele se tiver uma versão pronta.`,
          nextQuestion: `Posso montar uma demonstração sem custo pra vocês olharem juntos no WhatsApp?`,
          nextStage: 7,
        },
        {
          customerSays: '"Agora não."',
          recommendedReply: `Sem problemas, respeito o momento de vocês.`,
          nextQuestion: `Qual época do mês ou ano costuma ser mais tranquila pra vocês avaliarem isso?`,
        },
        {
          customerSays: '"Já tenho alguém que faz isso."',
          recommendedReply: `Ótimo! Ter suporte poupa dor de cabeça.`,
          nextQuestion: `Ele consegue te atender rápido quando você precisa alterar fotos ou horários, ou às vezes demora pra dar retorno?`,
        },
        {
          customerSays: '"Já tenho site."',
          recommendedReply: `Maravilha! Ter presença online já coloca vocês à frente de muitos.`,
          nextQuestion: `Ele funciona rápido no celular e recebe contatos todo mês, ou tá precisando de uma renovada?`,
        },
        {
          customerSays: '"Me manda no WhatsApp."',
          recommendedReply: `Mando sim com o maior prazer! Esse número aqui mesmo é o seu WhatsApp?`,
          nextQuestion: `Como é seu nome pra eu salvar aqui certinho e te enviar a prévia?`,
        },
        {
          customerSays: '"Estou ocupado."',
          recommendedReply: `Imagino a correria do dia a dia, não vou tomar seu tempo!`,
          nextQuestion: `Prefere que eu te ligue no final da tarde ou amanhã de manhã?`,
        },
      ],
    },

    6: {
      stageId: 6,
      stepNumber: "6",
      title: "6. Se perguntar o preço",
      shortLabel: "Preço",
      mainSpeaker: "VOCÊ",
      mainSpeech: `Pra criar o site são R$300. Depois fica R$50 por mês pra manter o site no ar e fazer as atualizações.`,
      contextTip: "Diga o preço com calma e naturalidade. Não se justifique antes de o cliente responder.",
      alternatives: [
        {
          customerSays: '"Achei bom o valor / Justo."',
          recommendedReply: `Legal! A gente fez pensado pra caber fácil no caixa de qualquer empresa.`,
          nextQuestion: `Podemos avançar com uma primeira versão de teste sem compromisso?`,
          nextStage: 7,
        },
        {
          customerSays: '"O que tá incluso nos R$50?"',
          recommendedReply: `Hospedagem rápida, segurança, domínio e alterações quando você precisar mudar telefone, fotos, horários ou serviços.`,
          nextQuestion: `Quer que eu monte uma prévia inicial pra você ver como fica?`,
          nextStage: 7,
        },
        {
          customerSays: '"Quanto tempo demora?"',
          recommendedReply: `Normalmente de 1 a 2 dias úteis eu já entrego funcionando e publicado.`,
          nextQuestion: `Posso iniciar uma versão demonstrativa pra ${targetName}?`,
          nextStage: 7,
        },
        {
          customerSays: '"Ainda tá pesado pra mim."',
          recommendedReply: `Entendo. Vamos fazer assim: eu monto a primeira versão sem você pagar nada. Se você gostar, a gente fecha.`,
          nextQuestion: `Risco zero pra você. Topa dar uma olhada?`,
          nextStage: 7,
        },
      ],
    },

    7: {
      stageId: 7,
      stepNumber: "7",
      title: "7. Fechamento",
      shortLabel: "Fechamento",
      mainSpeaker: "VOCÊ",
      mainSpeech: `Vamos fazer o seguinte: eu monto uma primeira versão pra vocês sem compromisso. Você olha como ficou, me fala o que achou e aí decide.`,
      contextTip: "Proposta de risco zero. O cliente avalia a demonstração real sem tirar dinheiro do bolso antes.",
      subSections: [
        {
          label: "ALTERNATIVA DE FECHAMENTO 1",
          speech: `Eu posso preparar uma versão específica pra empresa e te mostrar primeiro. Aí você vê se faz sentido.`,
        },
        {
          label: "ALTERNATIVA DE FECHAMENTO 2",
          speech: `Posso pegar as informações básicas da ${targetName} e te mandar uma prévia hoje mesmo no WhatsApp. Se você gostar, a gente conversa.`,
        },
      ],
      alternatives: [
        {
          customerSays: 'ACEITOU A PRÉVIA ("Pode montar então / Me manda")',
          recommendedReply: `Fechado! Vou pegar suas informações básicas e em até 48 horas te chamo no WhatsApp com o link de teste pronto. Qual seu melhor WhatsApp?`,
        },
        {
          customerSays: 'PREFERE RECEBER EXEMPLO ANTES ("Me manda algum que você já fez")',
          recommendedReply: `Mando sim! Te mando modelos parecidos com o ramo de vocês agora mesmo no WhatsApp. Esse número aqui recebe mensagem?`,
        },
        {
          customerSays: "QUER FALAR MAIS TARDE / OUTRO DIA",
          recommendedReply: `Tranquilo. Anotei aqui seu contato e combinamos um horário que for melhor pra você dar uma olhada.`,
        },
      ],
    },
  };

  return {
    companyName,
    category,
    city,
    phone,
    siteStatus,
    hasWebsite,
    stages,
  };
}

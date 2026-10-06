import type { Business } from "@/types";
import { formatPhone } from "./format";

export type CallStageId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type CustomerAlternative = {
  customerSays: string;
  recommendedReply: string;
  nextStage?: CallStageId;
};

export type CallStageData = {
  stageId: CallStageId;
  stepNumber: string;
  title: string;
  mainSpeaker: "VOCÊ" | "CLIENTE";
  mainSpeech: string;
  contextTip?: string;
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

function getCategoryTone(category: string): {
  vocative: string;
  clientContext: string;
  serviceExample: string;
} {
  const cat = (category || "").toLowerCase();

  if (cat.includes("barbe") || cat.includes("cabel") || cat.includes("salao") || cat.includes("salão") || cat.includes("estetica") || cat.includes("estética")) {
    return {
      vocative: "do espaço",
      clientContext: "clientes que querem agendar cortes e serviços sem precisar esperar retorno no WhatsApp",
      serviceExample: "tabela de serviços, fotos dos cortes, horários e botão direto pro WhatsApp",
    };
  }

  if (cat.includes("oficina") || cat.includes("mecanic") || cat.includes("mecânic") || cat.includes("auto") || cat.includes("funilaria") || cat.includes("pneu")) {
    return {
      vocative: "da oficina",
      clientContext: "motoristas que procuram socorro, revisão ou orçamento rápido pelo Google",
      serviceExample: "serviços prestados, localização no mapa, fotos e botão de chamada e WhatsApp imediato",
    };
  }

  if (cat.includes("clinic") || cat.includes("clínic") || cat.includes("odonto") || cat.includes("dentist") || cat.includes("saude") || cat.includes("saúde") || cat.includes("med") || cat.includes("méd")) {
    return {
      vocative: "da clínica",
      clientContext: "pacientes que buscam especialidades, convênios ou agendamento de consultas com confiança",
      serviceExample: "especialidades, equipe, localização, convênios e botão rápido de agendamento",
    };
  }

  if (cat.includes("restaur") || cat.includes("pizz") || cat.includes("lanch") || cat.includes("hamburg") || cat.includes("bar") || cat.includes("café") || cat.includes("cafe")) {
    return {
      vocative: "do restaurante",
      clientContext: "clientes que querem ver o cardápio atualizado e fazer pedidos ou reservas sem complicação",
      serviceExample: "cardápio, fotos dos pratos, endereço e botão direto de pedidos no WhatsApp",
    };
  }

  return {
    vocative: "do negócio",
    clientContext: "clientes que pesquisam no Google e precisam de informações rápidas e confiáveis",
    serviceExample: "informações, serviços, imagens, localização e WhatsApp da empresa organizados em um lugar só",
  };
}

export function generateCallScript(business?: Business | null): GeneratedCallScript {
  const companyName = business?.name?.trim() || "Não informado";
  const categoryRaw = business?.category?.trim();
  const category = categoryRaw && categoryRaw !== "Não informado" ? categoryRaw : "Não informado";

  const cityParts = [business?.city?.trim(), business?.state?.trim()].filter(Boolean);
  const city = cityParts.length > 0 ? cityParts.join(" - ") : "Não informado";

  const rawPhone = business?.phone?.trim();
  const phone = rawPhone ? formatPhone(rawPhone) : "Não informado";

  const websiteRaw = business?.website?.trim();
  const hasWebsite = Boolean(websiteRaw);
  const siteStatus = hasWebsite ? websiteRaw : "Não encontrado";

  const tone = getCategoryTone(category !== "Não informado" ? category : "");
  const targetName = companyName !== "Não informado" ? companyName : "o estabelecimento";

  const stages: Record<CallStageId, CallStageData> = {
    1: {
      stageId: 1,
      stepNumber: "1",
      title: "PRIMEIRO CONTATO",
      mainSpeaker: "VOCÊ",
      mainSpeech: `Boa tarde, é da ${targetName}?`,
      contextTip: "Fale com naturalidade, segurança e ritmo tranquilo. O foco desta etapa é apenas passar pelo atendimento e falar com o responsável.",
      alternatives: [
        {
          customerSays: '"Quem fala?"',
          recommendedReply: `É o Alysson, da NEXORA. Eu queria falar rapidinho com o responsável pelo negócio.`,
        },
        {
          customerSays: '"Sobre o que seria?"',
          recommendedReply: `É uma proposta rápida sobre a presença digital e atendimento de vocês. Leva menos de 1 minuto.`,
        },
        {
          customerSays: '"Quem você quer falar?"',
          recommendedReply: `Com a pessoa que toma as decisões comerciais da ${targetName}, por favor.`,
        },
        {
          customerSays: '"Ele não está."',
          recommendedReply: `Entendi. Qual é o melhor horário pra eu ligar de volta e encontrar ele? Ou teria um contato direto dele no WhatsApp?`,
        },
        {
          customerSays: '"Pode deixar recado."',
          recommendedReply: `Perfeito. Pode avisar que o Alysson da NEXORA ligou sobre o site de vocês? Qual o melhor WhatsApp pra eu mandar uma prévia?`,
        },
        {
          customerSays: '"Pode mandar mensagem."',
          recommendedReply: `Maravilha! Esse número que estou ligando já é o WhatsApp direto dele, ou teria outro contato?`,
        },
      ],
    },

    2: {
      stageId: 2,
      stepNumber: "2",
      title: "ABERTURA COM O RESPONSÁVEL",
      mainSpeaker: "VOCÊ",
      mainSpeech: `Meu nome é Alysson, eu vou ser 100% honesto com você: eu tenho uma proposta pro seu negócio. Você me dá 30 segundos e depois você decide?`,
      contextTip: "Seja direto, simpático e sem rodeios. Desarma a defensiva inicial de ligações de telemarketing.",
      alternatives: [
        {
          customerSays: "SE ELE ACEITAR (Pode falar / Diga)",
          recommendedReply: `Perfeito, vou direto ao ponto.`,
          nextStage: 3,
        },
        {
          customerSays: "SE ELE RECUSAR / HESITAR (\"Tô sem tempo / É venda?\")",
          recommendedReply: `Tranquilo! Sei que você tá na correria ${tone.vocative}. É só 30 segundos mesmo, se não fizer sentido a gente encerra na hora.`,
          nextStage: 3,
        },
        {
          customerSays: "\"Do que se trata primeiro?\"",
          recommendedReply: `É sobre como novos clientes encontram a ${targetName} na internet e chegam no seu WhatsApp hoje.`,
          nextStage: 3,
        },
      ],
    },

    3: {
      stageId: 3,
      stepNumber: "3",
      title: "DESCOBRIR A SITUAÇÃO",
      mainSpeaker: "VOCÊ",
      mainSpeech: `Hoje vocês já têm algum site ou trabalham mais pelo Instagram e WhatsApp?`,
      contextTip: "Faça a pergunta e ouça atentamente a resposta sem interromper.",
      alternatives: [
        {
          customerSays: '"A gente só usa Instagram."',
          recommendedReply: `Entendi. E vocês nunca chegaram a pensar em ter um site ou nunca viram muita necessidade?`,
          nextStage: 4,
        },
        {
          customerSays: '"Trabalhamos só pelo WhatsApp e indicação."',
          recommendedReply: `Indicação é o melhor canal mesmo. Mas vocês sentem que às vezes perdem cliente que procura no Google e vai pro concorrente?`,
          nextStage: 4,
        },
        {
          customerSays: '"A gente já pensou em fazer, mas não foi pra frente."',
          recommendedReply: `Imagino, agência costuma cobrar caro e demorar muito. A ideia aqui é ser prático e acessível.`,
          nextStage: 4,
        },
        {
          customerSays: '"Já temos um site."',
          recommendedReply: `Bacana! Ele tá atualizado e convertendo bem no celular, ou tá mais parado hoje em dia?`,
          nextStage: 4,
        },
        {
          customerSays: '"Não vemos muita necessidade."',
          recommendedReply: `Compreendo. É porque vocês já têm bastante movimento ou porque acham que no ramo de vocês não traz cliente?`,
          nextStage: 4,
        },
      ],
    },

    4: {
      stageId: 4,
      stepNumber: "4",
      title: "APRESENTAR A PROPOSTA",
      mainSpeaker: "VOCÊ",
      mainSpeech: `Entendi. Foi justamente por isso que eu entrei em contato. Eu trabalho com criação de sites profissionais para negócios. A ideia é deixar as informações, serviços, imagens, localização e WhatsApp da empresa organizados em um lugar só.\n\nE normalmente consigo deixar tudo pronto em 1 a 2 dias.\n\nVocê acha que um site assim ajudaria o negócio?`,
      contextTip: `Fala curta e pontual. Personalizada para o ramo (${category !== "Não informado" ? category : "comércio/serviço"}). Deixe o cliente responder.`,
      alternatives: [
        {
          customerSays: '"Acho que ajudaria sim / Faz sentido."',
          recommendedReply: `Legal. A ideia é justamente facilitar a vida do cliente e passar mais credibilidade na hora que ele pesquisa ${targetName}.`,
          nextStage: 6,
        },
        {
          customerSays: '"Talvez, depende do preço / de como funciona."',
          recommendedReply: `Total razão. Já te passo o valor de forma bem transparente.`,
          nextStage: 6,
        },
        {
          customerSays: '"Acho que pra nós não faz muita diferença."',
          recommendedReply: `Entendo. Mas se o cliente pesquisa no Google hoje e acha o concorrente organizado e vocês não, faz diferença na escolha dele?`,
          nextStage: 5,
        },
      ],
    },

    5: {
      stageId: 5,
      stepNumber: "5",
      title: "SE O CLIENTE RESISTIR",
      mainSpeaker: "VOCÊ",
      mainSpeech: `Tranquilo. Só pra eu entender: você não vê necessidade de um site ou é porque não quer investir nisso agora?`,
      contextTip: "Nunca discuta ou force. Mantenha o diálogo leve e compreensivo, respondendo de forma curta.",
      alternatives: [
        {
          customerSays: '"Não tenho interesse."',
          recommendedReply: `Tranquilo. Só pra eu entender: você não vê necessidade de um site ou é porque não quer investir nisso agora?`,
        },
        {
          customerSays: '"Instagram já resolve."',
          recommendedReply: `O Instagram é ótimo pra engajamento. Mas quem busca no Google geralmente tá querendo contratar agora e não quer ficar caçando telefone em post.`,
        },
        {
          customerSays: '"WhatsApp já resolve."',
          recommendedReply: `Com certeza, o WhatsApp fecha a venda. O site serve justamente pra colocar gente qualificada direto dentro do seu WhatsApp.`,
        },
        {
          customerSays: '"Não preciso de site."',
          recommendedReply: `Compreendo. Se vocês já tão com a agenda 100% cheia, realmente faz sentido segurar. Mas se quiser crescer, é o canal mais barato.`,
        },
        {
          customerSays: '"Está caro."',
          recommendedReply: `Comparado a agências normais que cobram R$2.000, o nosso modelo é muito acessível. Um cliente novo que o site traz no mês já paga a conta.`,
          nextStage: 6,
        },
        {
          customerSays: '"Preciso pensar."',
          recommendedReply: `Claro, sem problemas. Qual é a sua principal dúvida hoje pra gente já clarear agora?`,
        },
        {
          customerSays: '"Tenho que falar com meu sócio."',
          recommendedReply: `Perfeito. Inclusive fica até mais fácil pra você mostrar pra ele se tiver uma versão pronta. Posso montar uma demonstração sem custo pra vocês olharem juntos?`,
          nextStage: 7,
        },
        {
          customerSays: '"Agora não."',
          recommendedReply: `Sem problemas. Qual época do mês ou ano costuma ser mais tranquila pra vocês avaliarem isso?`,
        },
        {
          customerSays: '"Já tenho alguém que faz isso."',
          recommendedReply: `Ótimo! E vocês tão satisfeitos com a velocidade dele de atualizar ou às vezes demora pra dar retorno?`,
        },
        {
          customerSays: '"Já tenho site."',
          recommendedReply: `Maravilha. Ele funciona rápido no celular e recebe contatos todo mês, ou tá meio parado precisando de uma renovada?`,
        },
        {
          customerSays: '"Me manda no WhatsApp."',
          recommendedReply: `Mando sim com o maior prazer! Esse número aqui mesmo é o seu WhatsApp? Como é seu nome pra eu salvar certinho?`,
        },
        {
          customerSays: '"Estou ocupado."',
          recommendedReply: `Imagino a correria! Te dou um toque no final da tarde ou prefere amanhã de manhã?`,
        },
      ],
    },

    6: {
      stageId: 6,
      stepNumber: "6",
      title: "SE PERGUNTAR O PREÇO",
      mainSpeaker: "VOCÊ",
      mainSpeech: `Pra criar o site são R$300. Depois fica R$50 por mês pra manter o site no ar e fazer as atualizações.`,
      contextTip: "Diga o preço com naturalidade e PARE DE FALAR. Deixe o cliente digerir e responder primeiro.",
      alternatives: [
        {
          customerSays: '"Achei bom o valor / Justo."',
          recommendedReply: `Legal! A gente fez pensado pra caber fácil no caixa de qualquer empresa.`,
          nextStage: 7,
        },
        {
          customerSays: '"O que tá incluso nos R$50?"',
          recommendedReply: `Hospedagem rápida, segurança, domínio e alterações quando você precisar mudar telefone, fotos, horários ou serviços.`,
          nextStage: 7,
        },
        {
          customerSays: '"Quanto tempo demora?"',
          recommendedReply: `Normalmente de 1 a 2 dias úteis eu já entrego funcionando.`,
          nextStage: 7,
        },
        {
          customerSays: '"Ainda tá pesado pra mim."',
          recommendedReply: `Entendo. Vamos fazer assim: eu monto a primeira versão sem você pagar nada. Se você gostar, a gente fecha.`,
          nextStage: 7,
        },
      ],
    },

    7: {
      stageId: 7,
      stepNumber: "7",
      title: "FECHAMENTO",
      mainSpeaker: "VOCÊ",
      mainSpeech: `Vamos fazer o seguinte: eu monto uma primeira versão pra vocês sem compromisso. Você olha como ficou, me fala o que achou e aí decide.`,
      contextTip: "Proposta de risco zero. O cliente não precisa pagar antes de ver o resultado real para o negócio dele.",
      alternatives: [
        {
          customerSays: "ACEITOU A PRÉVIA (\"Pode montar então / Me manda\")",
          recommendedReply: `Fechado! Vou pegar suas informações básicas e em até 48 horas te chamo no WhatsApp com o link de teste pronto. Qual seu melhor WhatsApp?`,
        },
        {
          customerSays: "PREFERE RECEBER EXEMPLO ANTES (\"Me manda algum que você já fez\")",
          recommendedReply: `Mando sim! Te mando modelos parecidos com o seu ramo agora mesmo no WhatsApp. Esse número aqui recebe mensagem?`,
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

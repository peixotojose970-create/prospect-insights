# Traduções: diagnóstico de 14/11/2026

## Evidência
- `src/lib/utils.ts` tem apenas `cn`, `clsx` e `twMerge`; não contém comparação entre string e número. O erro TS2367 citado não foi reproduzido.
- Tradução usa Lovable AI Gateway, modelo OpenAI `openai/gpt-6-astra`, superfície `chat-completions`. Modelo e prompt preservados; catálogo com `workspace_models: included` confirma a superfície existente. Credencial presente, sem exposição ou rotação.
- Logs publicados: cinco recusas `translateMessages failed payment_required` entre 21:19:40 e 21:19:42 UTC.
- Requisição anterior `01a1dbec-6892-78e1-9e6a-2417f2e18f3e`, 21:17:49 UTC: HTTP 200/upstream 200; português europeu retornado; custo 0,06516 créditos. Payload `redacted`, portanto não é um corpo completo.
- Teste real via SDK: HTTP **402**, `payment_required`, `outcome: not_started`, `remote.requires: top_up`, recuperação `add_credits`. Identificadores: request `dc447d0ca370692764b530eff6d42725`, log `01a1dbf0-884d-765e-b61f-ccb1ac998961`, run `01a1dbf0-884d-7664-94b0-0fdd5efffa84`. O detalhe desse log não está disponível nas ferramentas do projeto; não há corpo original do provedor disponível. O diagnóstico se apoia nos campos estruturados do SDK e nos logs publicados, não em uma reconstrução de payload.
- Causa verificável: exigência de reposição de créditos do workspace. Não há evidência de credencial inválida, limite de solicitações ou erro de tipos como causa da recusa. Não é possível determinar saldo exato pelos dados disponíveis.

## Correção aplicada
- Aviso específico de créditos com código e HTTP; falhas de permissão, configuração e limite são diferenciadas.
- Registro somente de códigos, recuperação e identificadores seguros, sem corpos, cabeçalhos ou segredos.
- Fila não rápida interrompe novos trabalhos após recusa de pagamento; até duas chamadas que já estavam em andamento podem terminar. Recuperação somente por ação explícita.
- Nenhuma mensagem em português é usada para substituir tradução nesse fluxo. Textos originais, países e preferências preservados. Caminho legado `/rapido` preservado.

## Alternativa avaliada
LibreTranslate é software livre, mas exige servidor próprio; serviço hospedado oficial exige chave paga e não oferece chave gratuita. Não pode ser instalado como processo Python no ambiente de publicação deste app. Seria necessário um serviço externo aprovado e configuração específica; não foi ativado, nem foram trocadas credenciais ou modelo. Fontes: https://docs.libretranslate.com/guides/faq/ e https://portal.libretranslate.com/.

## Testes e limite real
- Testes de interrupção da fila, recuperação manual, não substituição por português e preservação do fluxo legado passaram.
- Suite completa: **82 testes passaram**, 4 de concorrência isolada não executados nesta mudança (nenhuma regra de banco foi alterada); build OK. Navegador invocou a função real pelo app, confirmando HTTP 402, `pending: false`, primeira e segunda mensagens vazias. A tela de erro do diálogo não foi exercitada visualmente; abertura do painel foi conferida.
- Português brasileiro permanece original, sem chamada de tradução. Teste real de português europeu foi recusado com HTTP 402. Inglês, espanhol, francês e italiano **não foram reenviados**, respeitando a pausa obrigatória após recusa de pagamento; sucesso nesses idiomas nesta atualização não foi confirmado.
- Para concluir a validação real, o proprietário precisa repor créditos de IA ou aprovar e disponibilizar um serviço externo compatível. Nenhuma cobrança foi ativada automaticamente.
# Tradução Gemini

- Traduções fora da Prospecção rápida usam a API oficial Interactions, `gemini-3.1-flash-lite`, `service_tier: standard`, JSON estruturado, `store: false`, sem ferramentas, modelos alternativos ou Lovable AI.
- `GEMINI_API_KEY` foi cadastrada no armazenamento seguro; nunca é enviada ao navegador.
- A API não oferece um parâmetro por requisição que garanta uso exclusivamente gratuito. Standard também pode cobrar em projetos com faturamento. O proprietário confirmou projeto sem faturamento em 14/11/2026 às 21:44; `GEMINI_FREE_TIER_CONFIRMED=true` foi salvo no armazenamento seguro. Se a chave/projeto mudar para faturado, esta confirmação deve ser revogada.
- O modelo tem entrada e saída gratuitas na faixa Standard Free Tier segundo a documentação consultada em 14/11/2026. A elegibilidade e as cotas dependem do projeto Google. Não habilitamos faturamento nem fazemos fallback.
- O Free Tier pode usar conteúdo para melhorar produtos Google; `store: false` desativa armazenamento da interação, não essa política de dados.
- Cada chamada tem prazo de 55 segundos e uma tentativa. O controle atômico existente é preservado. Erros de cota/configuração interrompem a fila até recuperação manual.
- Respostas incompletas, quantidade incorreta, perda de variáveis ou idioma não validado não são exibidos como traduções prontas.
- Português brasileiro permanece original, sem chamada externa; PT-PT/EN/ES/FR/IT usam Gemini. Preferências existentes não mudaram. `/rapido` mantém seu caminho legado e seu provedor, conforme restrição explícita.

## Documentação oficial
- https://ai.google.dev/gemini-api/docs/interactions
- https://ai.google.dev/api/interactions
- https://ai.google.dev/gemini-api/docs/structured-output
- https://ai.google.dev/gemini-api/docs/pricing#gemini-3.1-flash-lite

## Verificação real — 14/11/2026 às 21:46
- A chave atual é lida de `process.env["GEMINI_API_KEY"]` dentro de cada chamada, nunca armazenada em variável global. Presença confirmada; validade não confirmada: o Google recusou acesso com HTTP 401 / UNAUTHENTICATED.
- EN: chamada real Interactions feita através da função do app; HTTP 401, traduções nulas, conclusão em 261 ms. Consulta direta e não geradora ao modelo também retornou HTTP 401 / UNAUTHENTICATED. Nenhum corpo bruto, chave ou dado derivado foi registrado.
- ES, FR, IT: não executados após recusa de autenticação compartilhada; não há resposta real bem-sucedida a declarar.
- PT-BR: original preservado exatamente, sem chamada externa (comportamento esperado, não tradução real Gemini).
- English selecionado pelo controle de idioma em `/prospeccao` continuou selecionado após reload. Fluxo de tradução no navegador terminou com ambas as mensagens vazias, `pending: false` e aviso de acesso recusado. Nenhum erro de execução de tela.
- 92 testes automatizados passaram; 4 testes de concorrência isolada não executados (nenhuma alteração de banco). Respostas positivas de teste local não foram apresentadas como chamadas reais.
- Erros automatizados: chave ausente, confirmação gratuita ausente, 401/403, 429, modelo 404, recusa de faturamento 402, timeout, conexão, resposta vazia/incompleta, idioma incorreto e perda de variável. Nenhuma tentativa automática ou fallback.
- Build OK. `src/App.tsx` citado não existe neste projeto TanStack, portanto aquele diagnóstico não foi reproduzido.
- **Integração não concluída:** é necessário corrigir a chave/restrições no Google AI Studio e substituir `GEMINI_API_KEY` pelo formulário seguro. O código já usa o valor corrente; não é necessária chave no frontend.

## Arquivos alterados
- `src/lib/translate.functions.ts`
- `src/lib/gemini-translation.server.ts`
- `src/lib/gemini-translation.test.ts`
- `src/features/prospector/localized-pairs.ts`
- `src/features/prospector/localized-pairs.test.ts`
- `AGENTS.md`, `roadmap.md` e este relatório.
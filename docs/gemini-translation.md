# Tradução Gemini

- Traduções fora da Prospecção rápida usam a API oficial Interactions, `gemini-3.8-flash`, `service_tier: standard`, JSON estruturado, `store: false`, sem ferramentas, modelos alternativos ou Lovable AI.
- `GEMINI_API_KEY` foi cadastrada no armazenamento seguro; nunca é enviada ao navegador.
- A API não oferece um parâmetro por requisição que garanta uso exclusivamente gratuito. Standard também pode cobrar em projetos com faturamento. Por isso, a integração bloqueia chamadas até o proprietário confirmar que o projeto da chave não tem faturamento vinculado. Após essa confirmação, configurar `GEMINI_FREE_TIER_CONFIRMED=true` no armazenamento seguro. Não confirmar automaticamente.
- O modelo tem entrada e saída gratuitas na faixa Standard Free Tier segundo a documentação consultada em 14/11/2026. A elegibilidade e as cotas dependem do projeto Google. Não habilitamos faturamento nem fazemos fallback.
- O Free Tier pode usar conteúdo para melhorar produtos Google; `store: false` desativa armazenamento da interação, não essa política de dados.
- Cada chamada tem prazo de 55 segundos e uma tentativa. O controle atômico existente é preservado. Erros de cota/configuração interrompem a fila até recuperação manual.
- Respostas incompletas, quantidade incorreta, perda de variáveis ou idioma não validado não são exibidos como traduções prontas.
- Português brasileiro permanece original, sem chamada externa; PT-PT/EN/ES/FR/IT usam Gemini. Preferências existentes não mudaram. `/rapido` mantém seu caminho legado e seu provedor, conforme restrição explícita.

## Documentação oficial
- https://ai.google.dev/gemini-api/docs/interactions
- https://ai.google.dev/api/interactions
- https://ai.google.dev/gemini-api/docs/structured-output
- https://ai.google.dev/gemini-api/docs/pricing#gemini-3.8-flash

## Verificação
- 90 testes passaram; 4 testes concorrentes de banco isolado não foram executados nesta alteração (não houve mudança de banco).
- Preview sem erro de compilação. Verificação pelo aplicativo: tradução termina com `pending: false`, ambas as mensagens vazias e aviso específico de confirmação de projeto sem faturamento. Nenhuma chamada Gemini foi efetuada.
- Testes reais EN/ES/FR/IT estão suspensos até confirmação explícita de projeto sem faturamento. Validação de fidelidade por testes locais não é prova de tradução real do serviço.
- O erro citado em `src/lib/utils.ts` não corresponde ao arquivo atual, que apenas combina classes; não foi necessário alterá-lo.

## Arquivos alterados
- `src/lib/translate.functions.ts`
- `src/lib/gemini-translation.server.ts`
- `src/lib/gemini-translation.test.ts`
- `src/features/prospector/localized-pairs.ts`
- `src/features/prospector/localized-pairs.test.ts`
- `AGENTS.md`, `roadmap.md` e este relatório.
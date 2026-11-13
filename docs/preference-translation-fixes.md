# Correções de busca, tradução e preferências — 13/11/2026

## Diagnóstico comprovado
- `src/App.tsx` não existe. O erro TS2322 informado não corresponde à estrutura atual.
- Pesquisa BR usa função pública; a internacional exige sessão. Não há contas cadastradas (confirmado pela tentativa de obter sessão de teste). Falhas de autenticação aconteciam antes do retorno tipado e viravam “Não foi possível consultar o Google Maps” no store.
- Não há evidência de falha específica de permissão, faturamento ou parâmetros Google nesta sessão. A conexão existente está vinculada, mas chamadas Google ao vivo são proibidas no sandbox. Não se atribuiu o erro a uma API desabilitada sem prova.
- Tradução utilizava instrução explícita para adaptar e reescrever mensagens. A fila aguardava cada solicitação sem prazo; uma solicitação pendurada bloqueava todas as seguintes. O processamento dependia de um efeito do diálogo.
- Idioma era global, abordagem era estado temporário e país só existia no navegador.

## Arquivos alterados
- `src/features/prospector/repository.ts`: verificar usuário antes de pesquisas internacionais e retornar erro claro de acesso; consulta brasileira inalterada.
- `src/lib/translate.functions.ts`: tradução fiel dos modelos existentes, prazo de 55 segundos, resposta validada e erros explícitos; modelo original mantido. Uma repetição após resposta concluída em idioma incorreto; nenhuma repetição automática após resultado de transporte desconhecido.
- `localized-pairs.ts`, `request-timeout.ts`: processamento independente do diálogo, no máximo duas traduções simultâneas, prazo de 65 segundos por solicitação iniciada, limpeza em finally, cache por idioma/texto/empresa e guarda contra conclusão obsoleta.
- `preference-model.ts`, `preferences.ts`, `src/lib/preferences.functions.ts`: escolhas separadas por país, fallback local separado por usuário, leituras/gravações autenticadas e escritas sequenciais com proteção contra troca de conta.
- `drizzle/migrations/0001_prospecting_preferences.sql`: uma linha por usuário, mapa por país, permissões explícitas e políticas de leitura/escrita do próprio usuário.
- `language.tsx`, `templates.ts`, `MessageDialog.tsx`, `BulkMessagesDialog.tsx`, `trabalhar-leads.tsx`, `prospeccao.tsx`, `__root.tsx`: restaurar e salvar escolhas automaticamente nos fluxos não rápidos; idioma segue país de cada empresa. Apenas a abordagem ativa do diálogo individual é traduzida.
- Testes novos, `AGENTS.md` e `roadmap.md`: regras e verificações documentadas. Tipos da nuvem regenerados pela migração.

## Verificações efetivas
- Testes automatizados de preferências, timeout, seleção obsoleta, idiomas, países, termos, categorias e filtros.
- Navegador real: Portugal/Comercial/pt-PT → Espanha/Direto → Portugal; restauração após recarregar; Espanha preservou Direto. Sem erros de execução e sem rolagem horizontal a 390px.
- Chamadas reais à função de tradução em PT-PT, ES, FR, IT: retornaram ambas as mensagens, sem erro. Os textos usados foram mensagens de controle, não empresas inventadas para aprovar buscas reais.
- Todos os títulos e metadados das páginas de conteúdo já estão específicos para o Prospector.

## Pendências explícitas
- Busca real em Brasil, Lisboa, Madrid, Paris e Milão: não executada, pois Google Maps não pode ser validado ao vivo no sandbox. Validar na origem publicada autorizada após entrar com conta confirmada. Geocodificação, retângulo e validação de país existentes foram preservados.
- Persistência autenticada e isolamento entre duas contas: esquema aplicado e políticas presentes, mas fluxo de leitura após gravação com usuário real não comprovado porque não existe conta para obter sessão de teste. A restauração testada foi local, não nuvem.
- Cobertura total de localidades/categorias continua dependendo da lista-fonte não enviada. Leads, histórico, textos brasileiros e arquivo `/rapido` não foram alterados.
# Atualização contínua do Prospector — entrega e limites

## Resultado
Atualizações implementadas sem migração do CRM, sem remoção de dados existentes e sem consultas Google ou gerações de IA pagas. O erro citado em `src/App.tsx` não corresponde a este projeto: o arquivo não existe. Erros reais encontrados durante a atualização foram corrigidos e a compilação automática foi conferida.

## Correções e funcionalidades
- Autorização administrativa e reserva transacional do orçamento da Etapa 1 preservadas. Nenhum administrador foi atribuído automaticamente.
- Tradução normal possui um sinal de 55 segundos por operação, sem segunda geração automática; o caminho legado de `/rapido` mantém sua política. Falhas não substituem a mensagem pelo texto original em idioma incorreto.
- Preferências: função autenticada com RLS altera somente campos do país solicitado. Atualizações de países distintos não sobrescrevem o mapa completo. Mudanças de outra aba são refletidas pelo evento de armazenamento; backup restaurado da conta atual sincroniza deliberadamente após hidratação.
- Backup v2: CRM completo, preferências anônimas e por usuário presentes no navegador, modelos, abordados e escolhas de aparência. Sessões e credenciais são excluídas por lista explícita. Validação precede gravação; snapshot de recuperação é salvo antes; gravações parciais são revertidas. Backup v1 íntegro continua aceito como CRM parcial, sem inventar dados ausentes.
- CSV: parser de registros com aspas, campos vazios e multilinha; identidades estáveis; status, histórico, notas, contatos, país e e-mail preservados. Importação é em lote e não sobrescreve leads já existentes; contagem distingue criados e duplicados. Fórmulas são neutralizadas na exportação para planilhas.
- Busca BR: cursor ligado à consulta, página e critérios; token Google não é descartado. Até 3 páginas por expressão e 9 chamadas por lote. Erro preserva consulta pendente e não é guardado como lote concluído no cache. Cobertura registra áreas realmente consultadas.
- Continuação multicategoria: fila na store compartilhada conserva pendências de categorias anteriores; próxima área só avança por resultado concluído; token antigo é removido ao trocar lote. Resultados obsoletos de uma busca anterior são descartados. Reposição de abordados é aguardada, não dispara uma corrida com a próxima categoria.
- Fora do modo legado rápido, identidade de estabelecimento usa ID de origem ou nome e endereço. Domínio corporativo e sufixo de telefone não ocultam filiais distintas. Marcações antigas permanecem armazenadas; não foram apagadas.
- Google/Lovable: provedores de entrada habilitados e botões adicionados nas áreas de conta e acesso internacional. E-mail/senha habilitado com confirmação preservada. Retorno OAuth usa origem pública, separado da credencial Places. Nenhum código OAuth customizado nem credencial privada no navegador.
- Mapa: desabilitados POIs clicáveis que poderiam chamar Places no navegador; marcadores próprios e atribuições preservados. Fotos deixam de usar máscara `*`. Erros 403, inclusive não JSON, informam a restrição específica quando disponível.

## Integração Google auditada
Conexão existente Google Maps Platform, gerenciada e vinculada, reutilizada. Isso **não comprova funcionamento real**.

| Operação | Endpoint pelo servidor | Campos principais |
|---|---|---|
| BR e internacional | POST `places/v1/places:searchText` | id, nome, endereço/componentes, localização, telefone, site, tipo, avaliações, fotos, nextPageToken |
| Detalhes | GET `places/v1/places/{id}` | horários, telefones, site, avaliações, descrição, fotos |
| Foto | GET `places/v1/{photo.name}/media` | photoUri, tamanho até 800px |
| Validação internacional | GET `maps/api/geocode/json` | país retornado e bounds/viewport |

Text Search, detalhes e fotos são Places API (New); Geocoding é uma API separada, seu endpoint atual é suportado. Não há chamadas legacy Places, Directions ou Distance Matrix no código auditado. Maps JavaScript usa somente chave pública restrita, callback assíncrono e canal. Chaves servidor seguem apenas no servidor pelo gateway.

Países: Brasil, EUA, Portugal, Espanha, França e Itália. Internacional exige sessão e valida país geocodificado/resultados; cursors preservam impressão dos critérios. Catálogo e sugestões permanecem os existentes, sem alegar lista completa de cidades ou segmentos.

## Banco
- Migração `0004_merge_country_preferences_atomically.sql`: função `patch_prospecting_preferences`, invoker, autenticação obrigatória, RLS por proprietário, sem execução para visitantes.
- Tabelas e contadores existentes não apagados. Nenhuma nova tabela CRM ou transferência de leads.
- Google/Lovable e e-mail habilitados por ferramentas oficiais; configurações de confirmação não relaxadas.
- Referências de restauração: código anterior `b4257ff`; base anterior da Etapa 1 `6cfc03a`. Backups de navegadores reais só podem ser gerados no próprio navegador pela nova ação — o agente não tem acesso ao armazenamento dos usuários finais.

## Arquivos
- `src/features/prospector/backup.ts`, `csv.ts`, `continuation.ts`, `establishment-identity.ts` e testes.
- `generators.ts`, `store.tsx`, `preferences.ts`, `opportunity-search.ts`.
- `src/lib/brazil-cursor.ts`, `translation-budget.ts`, `google-errors.ts` e testes; `business-search.functions.ts`, `business-search-us.functions.ts`, `preferences.functions.ts`, `translate.functions.ts`.
- `src/components/prospector/SocialSignIn.tsx`, `InternationalAccess.tsx`, `ResultsMap.tsx`.
- `src/routes/leads.tsx`, `configuracoes.tsx`, `prospeccao.tsx`, `__root.tsx`, `src/styles.css`.
- Integração Lovable gerada pela ferramenta; migração/histórico/tipos gerados; dependências Papa Parse e tipos; `AGENTS.md`, `roadmap.md`, este relatório.

## Testes reais executados
- Base: 58 testes anteriores. Suíte ampliada cobre restauração/rollback, exclusão de sessão, CSV, identidade, cursor e fila por categoria, política de tradução e erros Google.
- Resultado final: **73 testes passaram em 16 arquivos**, compilação automática OK, verificação básica de segurança sem problemas nos checks executados. Consumo real permaneceu em **698 de 1.000**.
- Conta temporária autenticada: patches PT e ES em paralelo no banco mantiveram ambos; reload recuperou valores na cache local. Nenhuma conta temporária promovida.
- Navegador: CSV com empresa, e-mail, status negociação e nota importado; empresa lida na tela; exportação contém status; backup baixado, modelo removido no navegador de teste, backup restaurado e modelo/lead/status recuperados pela UI.
- 7 telas em 4 larguras (320/390/768/1280): 28 verificações sem transbordamento ou exceções. As chamadas de renderização Maps foram bloqueadas no navegador do teste; nenhuma conclusão sobre Maps vem desses checks.
- Fluxos anteriores de recusa administrativa verificados na Etapa 1; dados reais de consumo não usados em testes de escrita.

## Não comprovado e impedimentos específicos
1. **Google real e OAuth completo:** renderização/API Maps não podem ser validadas no sandbox; entrada Google precisa de interação com o provedor em domínio autorizado. Provedores habilitados não equivalem a login ponta a ponta. Validar em `prospector2026kl.lovable.app`.
2. **Custos:** nenhuma pesquisa paga ou geração real realizada. Orçamento de execução não foi informado/autorizado; não chamar Google para simplesmente demonstrar a integração. A geração existente mantém o modelo GPT-6 Astra e sua superfície, confirmados no catálogo sem inferência.
3. **SSRF e abuso:** bloqueios DNS/URL/redirecionamentos são defesa parcial, não garantia de IP na conexão nem limitação de frequência. É necessária proteção de saída com garantia documentada; não existe primitiva padrão antiabuso no backend. Limitador improvisado não foi implementado sem decisão específica.
4. **Orçamento concorrente:** SQL aplicado/revisado e falhas testadas isoladamente; teste paralelo real de reservas perto do teto não executado em produção. Precisa de banco isolado gravável; ferramentas read-only não permitem esse teste com rollback.
5. **Administrador:** não existe conta legítima com papel administrativo. Alteração do limite está protegida, mas sucesso real pela tela depende de identificar/autorização do administrador, sem atribuir esse papel ao usuário de teste.
6. **CRM em múltiplas abas/dispositivos:** CRM continua navegador-local; preferências têm patch atômico, mas não existe sincronização transacional do CRM entre dispositivos. Uma migração precisa de plano separado: inventário local por navegador, backup, vínculo de usuário verificado, IDs estáveis/place ID, deduplicação, piloto idempotente e recuperação antes de qualquer mudança.
7. **Tempo de busca externo:** timeout da tela encerra espera, não garante cancelamento de todo trabalho servidor já iniciado. Chamadas servidor individuais continuam limitadas; cancelamento integral necessita contrato próprio. Não afirmar que custos remotos cessam quando a tela para de aguardar.
8. **Cobertura e conformidade Google:** sugestões de localidades são parciais; falta lista-fonte completa. Persistência/exportação de dados Places e exibição para audiência EEA requerem revisão dos termos atuais; a atualização não estabelece autorização de armazenamento de qualquer campo Google.

O aplicativo não foi publicado automaticamente. Não declarar todas as integrações seguras/funcionais sem as verificações externas acima.
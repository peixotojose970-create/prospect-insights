# Atualização contínua do Prospector — entrega e limites

## Resultado
Atualizações implementadas sem migração do CRM, sem remoção de dados existentes e sem consultas Google ou gerações de IA pagas. Os diagnósticos citados em `src/pages/Index.tsx` não correspondem a um arquivo existente nesta aplicação TanStack. Abertura real conferida sem exceções: o aviso anterior de contexto do Prospector não se reproduziu. Compilação automática atual OK. A conclusão total permanece impedida pelas dependências externas explicitadas abaixo.

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
3. **SSRF:** bloqueios DNS/URL/redirecionamentos são defesa parcial, não garantia de IP na conexão. Regressão adicional confirma que um segundo domínio com DNS privado é recusado antes do acesso. Falta proteção de saída que fixe o IP validado e preserve TLS; não foi encontrada garantia da plataforma. Não declarar proteção contra DNS rebinding completa. Abuso recebeu controle próprio autorizado, descrito abaixo, sem alegar proteção DDoS ou justiça por conta.
4. **Orçamento concorrente:** validado em PostgreSQL 17 descartável com o SQL das migrações reais, sem tocar contadores Cloud. 40 conexões concorrentes, limite 100 e consumo inicial 90: exatamente 5 reservas aceitas, consumo final 95. Implantação Cloud e permissões verificadas; carga de produção não executada.
5. **Administrador:** autorização no servidor e na função SQL concluída e testada: conta comum não altera limite nem cria papel; administrador fictício somente no banco isolado altera limite para 200. Nenhuma conta Cloud foi promovida. Sucesso pela tela de produção ainda depende de o proprietário identificar uma conta legítima; não inventar o administrador.
6. **CRM em múltiplas abas/dispositivos:** CRM continua navegador-local; preferências têm patch atômico, mas não existe sincronização transacional do CRM entre dispositivos. Uma migração precisa de plano separado: inventário local por navegador, backup, vínculo de usuário verificado, IDs estáveis/place ID, deduplicação, piloto idempotente e recuperação antes de qualquer mudança.
7. **Tempo de busca externo:** timeout da tela encerra espera, não garante cancelamento de todo trabalho servidor já iniciado. Chamadas servidor individuais continuam limitadas; cancelamento integral necessita contrato próprio. Não afirmar que custos remotos cessam quando a tela para de aguardar.
8. **Cobertura e conformidade Google:** sugestões de localidades são parciais; falta lista-fonte completa. Persistência/exportação de dados Places e exibição para audiência EEA requerem revisão dos termos atuais; a atualização não estabelece autorização de armazenamento de qualquer campo Google.

O aplicativo não foi publicado automaticamente. Não declarar todas as integrações seguras/funcionais sem as verificações externas acima.

## Continuação de 14/11/2026 — estado verificado
- Controle próprio de frequência autorizado explicitamente pelo usuário. Migrações 0005/0006 aplicadas: reservas globais atômicas por operação, serviço apenas, sem dados pessoais e com seis chaves fixas. Sem dependência de IP fornecido pelo cliente.
- Limites por minuto: pesquisa 60, detalhes 120, fotos 60, tradução 20, análise 30 e leitura de consumo 240. Aplicados antes do trabalho externo, inclusive cache. Falha de reserva bloqueia execução. Isso pode afetar todas as contas quando o limite global esgota; não limita individualmente um atacante nem impede esgotamento deliberado. Nenhuma tela ou lógica legada de `/rapido` foi reescrita; o controle servidor compartilhado também protege suas chamadas.
- Concorrência antiabuso: 80 solicitações reais em paralelo admitiram exatamente 60 pesquisas, contador final 60. Sessões comuns não executam diretamente a reserva nem escrevem na tabela. RLS e revogação explícita confirmadas no Cloud.
- Testes: 77 regressões passaram; os 3 testes adicionais de banco passaram separadamente com `PROSPECTOR_TEST_PG=1 bunx vitest run src/lib/database-concurrency.test.ts`. A suíte isolada usa exclusivamente 127.0.0.1:55439, usuário nobody, banco postgres; recria somente o banco descartável. Não aponta para Cloud nem recebe credenciais reais. SQL lido das migrações em cada execução, sem cópia de funções.
- Conta temporária comum no Cloud: preferências PT/ES gravadas simultaneamente e recuperadas pela interface; importação/exportação/backup e 28 verificações de tela passaram, sem exceções. Conta temporária sem papel administrativo. Consumo Google permaneceu 698.
- OAuth de entrada: ferramenta oficial confirmou Site URL `https://prospector2026kl.lovable.app` e retorno `https://prospector2026kl.lovable.app/**` permitido; endereço respondeu HTTP 200. Código usa origem pública. OAuth server/MCP desabilitado é independente do login Google e não precisa ser ligado para esse login. Não houve alteração desnecessária de configuração.

### Ações externas exatas ainda necessárias
1. Publicar esta versão para levar os novos controles servidor ao endereço público. As mudanças de banco já estão aplicadas.
2. No endereço publicado, Configurações → Continuar com Google, escolher uma conta e conferir que o nome da conta aparece e persiste após recarregar. Exige interação do titular; habilitação do provedor e allowlist não comprovam esse resultado. Login não é teste Places nem pesquisa paga.
3. Para validar Places, o titular precisa autorizar orçamento antes: uma busca BR pode chamar até 9 consultas por lote; internacionais também usam Geocoding e páginas Places. Valores dependem dos SKUs, máscara de campos e faturamento da conexão gerenciada; valor monetário exato não foi confirmado. Nenhuma chamada paga foi executada. Após autorização, validar separadamente categoria/localização/resultados reais no domínio autorizado, conforme limitação Google do sandbox.
4. Identificar a conta legítima que deve administrar limites e autorizar explicitamente essa concessão. Não usar a conta temporária nem atribuir administração automaticamente.
5. Proteção SSRF completa exige serviço de saída com resolução e conexão no mesmo IP público validado, validação TLS do hostname e repetição por redirect; configuração/garantia e eventual custo desse serviço permanecem indisponíveis. Bloqueios atuais são parciais; não apresentar esta etapa como concluída.
6. Migração CRM, lista-fonte completa de localidades/categorias e revisão de licença/armazenamento Places continuam dependências separadas, sem mudanças destrutivas nesta etapa.

## Resultado definitivo da solicitação das 21:06 UTC
- Migração 0007 aplicada: controle persistente combina teto global, conta verificada pelo servidor e origem HTTP resumida em SHA-256. Limite por conta por minuto: pesquisa 15, detalhes 30, fotos 15, tradução 5, análise 7 e leitura de consumo 60; origem mantém o teto global da operação. Visitantes compartilham a conta anônima. Registros expirados são removidos após dois minutos em novas reservas. Recusas podem consumir proteção global, mas nunca contam como consulta Google.
- Identidade vem de `auth.getUser(token)` no servidor, nunca de um ID enviado pelo cliente. Token inválido/expirado é recusado. Origem HTTP é agrupamento auxiliar, não identidade confiável: clientes fora de navegadores podem forjar Origin; IP do visitante não é usado porque a confiança nos cabeçalhos do proxy não foi confirmada. Não declarar proteção distribuída contra DDoS nem limite por IP efetivo.
- 79 testes regulares passaram e 4 testes PostgreSQL concorrentes passaram separadamente. Cenário adicional: 20 solicitações simultâneas da mesma conta admitem exatamente 7 análises; outra conta ainda consegue reservar. Nenhuma conta de produção recebeu papel administrativo.
- Nova conta comum temporária: persistência PT/ES, CSV, backup e 28 verificações de telas novamente aprovados, sem exceções. Não houve chamada Maps/IA paga; contador permanece 698/1000. Verificação básica de segurança sem problemas nos checks executados; não equivale a análise profunda completa.
- Não existem contas legítimas no backend no momento da consulta (testes excluídos). Não é possível escolher o administrador legítimo sem identidade fornecida pelo proprietário. Concessão automática, credenciais inventadas e promoção de conta temporária não foram realizadas.
- SSRF mantém bloqueio IPv4/IPv6 privados, DNS misto, destinos internos, credenciais/portas e revalidação de redirects, com leitura limitada. A proteção de DNS rebinding na conexão não foi finalizada: falta garantia de saída/IP fixado e TLS que esta plataforma não documentou. Não foi substituído o acesso existente por um mecanismo inseguro ou desabilitada a análise para alegar conclusão.
- Login Google e Places permanecem integrações distintas. Site URL e allowlist publicados corretos; Google login completo precisa da interação do titular. API Places real precisa de autorização de custo e validação em origem autorizada; expressamente não executada no sandbox. A publicação desta versão será solicitada ao final desta entrega; solicitação não comprova implantação concluída.
- Dependências estritamente externas: identidade da conta administrativa, serviço de saída com garantia SSRF e eventual custo, interação de login Google e orçamento para validação Places. Listas-fonte e migração CRM continuam fora do escopo executável sem suas respectivas fontes/decisões.
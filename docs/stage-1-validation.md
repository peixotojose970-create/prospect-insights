# Etapa 1 — implementação e limites de validação

## Referência anterior
- Código: `6cfc03a421dd087cfd64fb03b9fa62a76634859b`.
- Leitura prévia do banco em 14/11/2026: limite 1.000, consumo de novembro 698, nenhuma conta administrativa nem usuário de autenticação existente.
- A referência do código não é backup do CRM local nem do banco. Nenhum CRM foi transferido, nenhum dado existente foi removido e nenhum administrador foi atribuído.
- Estruturas antigas permanecem disponíveis. Reversão deve ser aditiva e revisada; não restaurar automaticamente as chamadas inseguras nem apagar consumo. Mudanças de limite e papéis precisam de operador autorizado.

## Implementado
- `user_roles` separado, leitura do próprio papel; visitantes e usuários comuns não possuem privilégios de gravação. Grants automáticos mais amplos identificados na verificação foram revogados por segunda migração.
- Alteração de limite exige sessão, papel administrativo verificado pelo cliente autenticado no servidor e nova verificação na função SQL. Usuário comum não consegue conceder papel a si mesmo.
- Reserva service-only em uma transação: trava configurações antes do contador; bloqueia em `floor(limite * 0.95)` e não libera reservas incertas. Alteração do limite usa a mesma trava.
- Leitura de consumo falha explicitamente; chamadas Google param se não houver reserva confirmada. Fotografias interrompem o lote após falha.
- IDs e referências de fotos não aceitam caminhos arbitrários, parâmetros ou URLs externas. Contexto de cidade na tradução tem tamanho máximo.
- Análise de sites valida destinos públicos, DNS A e AAAA, cada redirecionamento (máximo 5), ciclos e leitura até 400.000 bytes sob sinal único de 15 segundos.
- Coleta existente de e-mails dos EUA usa a mesma proteção de destinos e leitura limitada a 300.000 bytes; não foi criado novo coletor.
- Configurações mostram edição bloqueada sem autorização e falhas explícitas; medidor mostra indisponibilidade em vez de desaparecer silenciosamente.

## Arquivos modificados
- `src/lib/admin-access.functions.ts`, `admin-access.server.ts`, `admin-access.test.ts`.
- `src/lib/places-usage.functions.ts`, `places-usage.server.ts`, `places-usage.test.ts`.
- `src/lib/places-input.ts`, `places-input.test.ts`, `business-search.functions.ts`.
- `src/lib/site-audit.functions.ts`, `site-audit-security.server.ts`, `site-audit-security.test.ts`, `us-email-lookup.server.ts`.
- `src/lib/translate.functions.ts`, `src/routes/configuracoes.tsx`, `src/components/prospector/UsageMeter.tsx`.
- Migrações aditivas `0002_secure_places_budget_and_admin.sql` e `0003_restrict_role_table_grants.sql`, histórico e tipos gerados pela ferramenta.
- `package.json`, `bun.lock` (validador IP), `AGENTS.md`, `roadmap.md` e este relatório.

## Evidências
- Suíte existente: 43 testes passaram antes das alterações.
- Resultado final: 58 testes passaram em 11 arquivos; compilação automática sem erros. Consumo conferido ao final permaneceu em 698 e limite em 1.000.
- Novos testes cobrem reserva confirmada/recusada/falha, autorização administrativa, referências de fotos, IPs privados/reservados, DNS misto, redirecionamento privado, ciclos, cancelamento e teto de leitura.
- Banco: funções e tabela novas presentes; `anon` e `authenticated` não executam reserva; `anon` não altera limite; ambos não inserem papéis. Conta temporária comum recebeu recusa SQL `42501` ao tentar alterar limite e não conseguiu inserir papel administrativo.
- Navegador real: Configurações sem sessão e com conta temporária comum mantêm Salvar limite desabilitado; nenhuma exceção na página. Largura de 390px sem transbordamento horizontal.
- Verificação básica de segurança não encontrou problemas nos checks executados; não equivale a auditoria profunda.
- Nenhuma consulta Google, geração de IA paga ou teste de cobrança foi realizado.

## Pendências — Etapa 1 não está integralmente validada
1. **SSRF/DNS rebinding:** preflight DNS não garante o IP efetivo no momento da conexão. Não foi comprovado mecanismo publicado de bloqueio na conexão para destinos arbitrários. As proteções são parciais; não declarar SSRF resolvido. A análise existente foi preservada, não é uma nova integração segura certificada. Próximo passo: escolher proteção de saída com garantia documentada, ou restringir/suspender análise arbitrária mediante decisão explícita. `resolveOverride` não resolve genericamente: tem restrições de zona (https://developers.cloudflare.com/workers/runtime-apis/request/).
2. **Abuso direto:** CSRF, validação e orçamento global não são limitação de frequência nem proteção completa contra bots. Sem mecanismo padrão disponível; limitador improvisado não implementado nem implicitamente aprovado.
3. **Administrador:** não há administrador legítimo para confirmar escrita e leitura pela UI; nenhum usuário de teste foi promovido. Só os caminhos de recusa foram verificados ponta a ponta; sucesso administrativo tem teste isolado.
4. **Concorrência real:** função aplicada e revisada, mas não submetida a reservas paralelas no banco compartilhado para evitar alterar consumo real. Ferramentas disponíveis de consulta são read-only e não oferecem transação de escrita com rollback para esse teste. Próximo passo: backend isolado gravável; testar simultaneidade, mudança de mês e alteração concorrente do limite.
5. **Google Maps:** comportamento real permanece não verificado; validação em domínio publicado autorizado requer autorização prévia para custo. Não há motivo para testar Maps no sandbox.

Etapas 2–5 não começaram; dependem desta validação. `/rapido`, modelos comerciais, CRM local, países e paginação internacional foram preservados.
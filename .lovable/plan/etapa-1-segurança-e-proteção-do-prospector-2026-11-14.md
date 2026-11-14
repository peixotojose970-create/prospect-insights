# Etapa 1 — Segurança e proteção do Prospector

## Situação e limites desta preparação

O anexo solicita preparar esta etapa antes de executar correções. Nenhuma alteração funcional, configuração de acesso, migração ou consulta paga foi realizada.

O erro informado não corresponde ao arquivo atual: `src/lib/utils.ts` apenas define `cn`, sem referência a `isLoading`. Não será feita uma alteração fictícia nesse arquivo.

**Base verificada:** 43 testes passaram em 7 arquivos. São testes locais; não comprovam login, autorização real, concorrência no banco ou funcionamento do Google.

**Referência de restauração do código:** commit `6cfc03a421dd087cfd64fb03b9fa62a76634859b`, com árvore de trabalho limpa antes desta preparação. Este registro não é um backup do banco nem dos dados presentes nos navegadores. Antes de qualquer alteração no banco, registrar o estado das estruturas e permissões envolvidas, conferir os dados existentes e preparar reversão aditiva, sem exclusões.

## Escopo exato proposto

### 1. Alteração do limite somente por administrador
- Exigir sessão válida e autorização administrativa no servidor para salvar o limite global.
- Criar armazenamento de papéis protegido e separado das contas; não atribuir privilégios automaticamente nem confiar no navegador ou em informações editáveis do cadastro.
- Verificar o vínculo administrativo existente antes de qualquer atribuição: o esquema atual contém papéis em contas, mas não uma tabela separada de papéis. Essa estrutura não será removida nesta etapa.
- Em Configurações, manter a consulta do consumo e permitir edição somente a quem tiver autorização; apresentar recusa ou falha claramente.

### 2. Contabilização atômica do consumo
- Reservar cada chamada antes de consultar Google, verificando e incrementando consumo em uma única operação transacional.
- Serializar também alterações do limite que disputem a mesma reserva; manter aviso em 90% e bloqueio em 95%, com a regra de arredondamento atual.
- Impedir chamadas externas se a contabilização falhar; hoje a busca brasileira registra a falha e continua.
- Conferir erros de leitura, gravação e execução no banco. Uma reserva não equivale a faturamento confirmado pelo Google; não liberar automaticamente reservas cujo resultado externo ficou incerto.

### 3. Proteção das funções públicas, preservando a experiência rápida
- Preservar a proteção contra requisições de outros sites já presente em `src/start.ts`.
- Reforçar formatos, tamanhos e quantidades de entrada, principalmente referências de fotos; limitar trabalho por pedido e impedir tentativas automáticas ilimitadas.
- Não impor novo login à busca brasileira ou à Prospecção rápida neste escopo. Manter a exigência atual de sessão nas pesquisas internacionais.
- **Limitação importante:** validação, proteção entre sites e orçamento global não impedem abuso por chamadas diretas. Não existe mecanismo padrão de limitação por frequência no backend. Não criar um limitador improvisado sem aprovação específica; apresentar separadamente a opção de proteção adicional e seus impactos antes de implementá-la.

### 4. Análise segura de sites
- Validar protocolo, domínio, credenciais embutidas, portas e endereços IP; bloquear destinos locais, privados, reservados e serviços de metadados.
- Substituir redirecionamento automático por saltos controlados, validando cada destino e limitando a cadeia.
- Validar todos os endereços DNS resolvidos, limitar o tempo total e ler a resposta progressivamente, interrompendo no teto de 400.000 bytes; hoje o corpo inteiro é baixado antes do corte.
- **Condição de segurança:** primeiro comprovar um mecanismo compatível com o ambiente publicado que garanta destino público também na conexão. Consultar DNS antes de `fetch` não basta contra troca de IP entre verificação e conexão. Se não houver essa garantia, não declarar SSRF corrigido; apresentar a necessidade de proteção de saída ou alternativa segura antes de disponibilizar a análise arbitrária.

### 5. Requisições e falhas
- Fazer os controles anteriores encerrarem sempre com sucesso ou erro identificável, sem consumo externo após falha na reserva.
- Evitar expor credenciais ou informações internas em erros; diferenciar acesso recusado, orçamento esgotado, destino bloqueado e indisponibilidade.
- Limitar tempo e tamanho nas operações de segurança desta etapa. Reorganização geral das traduções, carregamentos e sincronização fica para a Etapa 2.

## Arquivos previstos para implementação

Alterações existentes:
- `src/lib/places-usage.functions.ts` — autorização de gravação e estado de permissão.
- `src/lib/places-usage.server.ts` — reserva atômica e falhas explícitas.
- `src/lib/business-search.functions.ts` — interromper após falha de consumo, validar referências e preservar contratos da busca.
- `src/lib/business-search-us.functions.ts` — alinhar tratamento da reserva, sem mudar países ou paginação.
- `src/lib/site-audit.functions.ts` — validação de destinos, redirecionamentos e leitura limitada.
- `src/lib/translate.functions.ts` — apenas validação de entrada/proteção aprovada, sem alterar modelos ou traduções.
- `src/routes/configuracoes.tsx` — edição autorizada e mensagens de resultado.
- `src/components/prospector/UsageMeter.tsx` — exibição explícita de falha na leitura do consumo.
- `AGENTS.md` e `roadmap.md` — regras técnicas e tarefas concluídas/bloqueadas.

Novos arquivos previstos:
- `src/lib/admin-access.functions.ts` e `src/lib/admin-access.server.ts` — verificação administrativa reutilizável.
- `src/lib/site-audit-security.server.ts` — segurança de destinos e resposta, condicionada à garantia de conexão.
- Testes focados de autorização, consumo e destinos junto aos testes do projeto.
- Uma migração aditiva criada pela ferramenta de banco, com papéis, permissões e reserva transacional; sem editar histórico ou apagar estruturas existentes.
- `docs/stage-1-validation.md` — arquivos realmente modificados, testes executados, resultados e pendências.

`src/start.ts` só será alterado se a proteção adicional aprovada exigir integração. `src/routes/rapido.tsx`, CRM local, categorias, estilos de mensagem e lógica de paginação ficam preservados.

## Validação e entrega separada

1. Conferir restauração e permissões antes das alterações.
2. Testar autorização: sem sessão e usuário comum não salvam; administrador validado salva e o valor reaparece pela tela.
3. Testar consumo concorrente no banco, sem chamadas Google: reservas simultâneas não ultrapassam o teto; erro de registro impede saída externa; troca de mês e mudança de limite respeitam a regra.
4. Testar destinos privados IPv4/IPv6, DNS misto, redirecionamentos para rede privada, ciclos, respostas grandes e timeout; distinguir testes de validação das garantias de conexão real.
5. Executar os 43 testes existentes e os novos; conferir erros de compilação e fluxos públicos sem pedidos pagos.
6. Validar Configurações com sessão administrativa autorizada, conta comum e sem sessão, usando identidades de teste quando permitido. Se não houver identidade administrativa verificável, declarar esse fluxo pendente.
7. Apresentar arquivos efetivamente alterados e evidências, sem afirmar correção de fluxo não validado.

## Fora desta etapa

- Etapa 2: carregamentos e timeouts gerais, concorrência entre abas/dispositivos e estabilidade comercial.
- Etapa 3: backup completo, restauração e CSV; migração do CRM somente após plano próprio com inventário, deduplicação, isolamento por usuário e recuperação.
- Etapa 4: investigação detalhada de APIs, endpoints, campos, credenciais e autenticação Google. Chave cadastrada não comprova integração funcional; nenhum teste pago sem autorização prévia. Google Maps precisa de validação pelo usuário em domínio autorizado, não no sandbox.
- Etapa 5: reproduzir paginação brasileira, continuação multicategoria e correspondência de abordados antes de alterar a lógica.

Cada etapa posterior depende da validação dos resultados da anterior.
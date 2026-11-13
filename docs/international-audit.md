# Auditoria internacional — 13/11/2026

## Problemas encontrados
- `src/main.tsx` não existe nesta aplicação TanStack Start; o diagnóstico enviado não corresponde aos arquivos atuais.
- Pesquisa internacional consultava só uma página, sem sinônimos ou delimitação geográfica além do texto e verificação do país.
- Detalhes de empresas estrangeiras utilizavam `pt-BR` e `BR`; telefones de abordagem recebiam prefixo brasileiro.
- Tradução literal devolvia o original em português durante carregamento e falhas; as ações de envio permaneciam disponíveis.
- Portugal apresentava regiões estatísticas, não distritos. Faltavam campos para província, departamento, município e freguesia, persistência de país e múltiplas localidades internacionais.
- Não há usuários de autenticação: não é possível testar uma consulta internacional autenticada com conta existente.
- A busca brasileira atual usa uma página por expressão. Foi preservada para não modificar o comportamento já existente, incluindo a Prospecção rápida.

## Alterações
- `src/data/countries.ts`: configuração compartilhada com ISO, idioma, divisões, moeda, formato de endereço e prefixo telefônico.
- `src/data/geo.ts`, `segments.ts`: distritos portugueses, termos locais e correspondências dos segmentos brasileiros ausentes no catálogo europeu, sem remover escolhas antigas.
- `src/features/prospector/international-search.ts`, `src/lib/business-search-us.functions.ts`: até 9 chamadas por lote, execução sequencial, geocodificação limitada ao país, retângulo de restrição, verificação do país em cada resultado, até três páginas por expressão, deduplicação por Place ID e continuação ligada à consulta original. Não há cache persistente novo de dados Google.
- `repository.ts`, `business-search.functions.ts`: encaminhamento de localidades/nome/continuação e detalhes no idioma do país, com cache separado por país.
- `translate.functions.ts`, `message-validation.ts`, `localized-pairs.ts`, `templates.ts`: adaptação conjunta das duas etapas, detector independente de idioma, uma nova geração apenas após resposta concluída no idioma errado, erros explícitos e fila serializada. Falhas de transporte não são repetidas automaticamente.
- `MessageStatus.tsx`, `MessageDialog.tsx`, `BulkMessagesDialog.tsx`, `trabalhar-leads.tsx`: estado de geração/erro e bloqueio de cópia/WhatsApp para texto vazio. Modelos personalizados e nomes reais são enviados como contexto; a interface continua em português.
- `InternationalAccess.tsx`: entrada e cadastro com confirmação de e-mail para consultas internacionais autenticadas; nenhuma configuração hospedada de autenticação foi alterada.
- `prospeccao.tsx`, `QuickOpportunitySearch.tsx`: campos locais, múltiplas localidades, país persistente e aviso de custo. Oportunidades conserva sua exclusão local de salvos/abordados; o store não foi modificado.
- `format.ts`, `LeadCard.tsx`: prefixos internacionais opt-in; assinaturas legadas preservadas. `/rapido` permanece sem edição; seu diálogo mantém o caminho legado.

## Verificação executada
- 37 testes em quatro arquivos: países/idiomas, termos, país retornado, distritos, telefones, validação de idioma, filtros de oportunidades e categorias; todos passaram.
- Gerações reais pelo serviço de IA: português europeu, espanhol, francês e italiano produziram duas mensagens corretas e passaram pela validação. Foram textos de teste, não empresas fictícias apresentadas como resultados reais.
- Navegador: mudança PT/ES/FR/IT, campos de cada país, persistência após recarregar, filtros móveis a 390px; sem overflow horizontal ou erros finais. Capturas conferidas em 1280px e no painel móvel.
- Corrigida falha encontrada no recarregamento: seleção enviava valor vazio durante restauração; país inválido agora é ignorado.
- Logs automáticos de compilação: sem erros nas verificações realizadas.

## Não verificado / pendências
- Google Maps e Places não podem ser testados ao vivo no sandbox, por orientação da plataforma. Validar os cinco cenários reais em `https://prospector2026kl.lovable.app` após publicar e entrar com conta confirmada.
- Conexão Google Maps existente foi confirmada; permissões efetivas de Geocoding API, Places API (New), cotas e cobrança não foram comprovadas por chamadas ao vivo. Falhas de permissão são exibidas explicitamente.
- Cadastro e entrada ainda não foram validados contra as configurações hospedadas de autenticação; confirmação automática e cadastro anônimo não foram ativados.
- Sugestões de cidades são parciais. Província/departamento/município/freguesia aceitam entrada manual; não há catálogo completo desses níveis. A lista-fonte completa de categorias mencionada anteriormente continua ausente.
- Cobertura de cada categoria, paginação real, repetição automática de buscas e resultados consolidados entre várias localidades precisam ser validados com Google Maps no domínio autorizado. Não foram declarados aprovados com dados simulados.
- Leads salvos continuam no armazenamento local existente. Revisão integral de retenção/licenciamento e migração para guardar somente identificadores não foi realizada, para evitar remover registros do usuário.
- A expansão brasileira, as sugestões completas de localidades e os demais canais de contato antigos não foram reconstruídos; não há promessa de cobertura total ou correção integral concluída.
# Atualização do Prospector

## Conclusão solicitada em 14/11
- [x] Implementar controle próprio antiabuso autorizado, persistente e atômico; limites globais, sem alegar proteção DDoS.
- [x] Validar orçamento e autorização com concorrência real em PostgreSQL isolado, sem consumo Google: 3 testes passaram.
- [x] Ampliar regressões SSRF e verificar configurações de entrada publicada separadamente do Places.
- [x] Atualizar o relatório com evidências e dependências externas verdadeiras.
- [ ] Conclusão externa: IP na conexão não garantido; Google exige interação do titular; Places requer orçamento e domínio autorizado; proprietário deve identificar administrador legítimo; publicação pendente.

## Execução contínua autorizada
- [x] Segurança: conferir controles existentes; garantias de saída e proteção adicional contra abuso documentadas como indisponíveis.
- [x] Estabilidade: prazo único de tradução normal sem replay automático; gravação atômica das preferências e restauração autenticada PT/ES verificadas.
- [x] Dados locais: backup completo, recuperação prévia, CSV fiel e importação sem substituir leads existentes; fluxo real verificado.
- [x] Pesquisa: cursors BR por consulta, fila multicategoria e identificação de estabelecimento; testes reproduzem perdas de continuação e supressão de filiais.
- [x] Google: conexão existente reutilizada; API New auditada, erros e POIs corrigidos; entrada Google/Lovable habilitada separadamente do Places.
- [x] Verificar fluxos autenticados e recuperação; 28 checks públicos em 320–1280px passaram sem erro ou overflow; relatório salvo.
- [ ] Validação externa final — bloqueado: Maps/Google OAuth real exigem interação em domínio autorizado, consultas/generação paga sem orçamento autorizado; teste concorrente de orçamento exige banco isolado gravável; proteção de saída e antiabuso padrão indisponíveis; não há administrador legítimo definido.

- [x] Preparar escopo da Etapa 1, registrar referência de restauração e executar testes existentes sem consultas pagas: 43 testes passaram.
- [x] Implementar autorização do limite, reserva atômica, interrupção após falha de consumo, validação de fotos, DNS e redirecionamentos; conta comum não salva nem concede papel administrativo a si própria.
- [ ] Concluir validação da Etapa 1 em produção — bloqueado: administrador legítimo não identificado e garantia de IP na conexão indisponível; concorrência real e controle global antiabuso já testados em banco isolado.
- [x] Avançar nas demais tarefas possíveis conforme autorização contínua; CRM permaneceu local e limitações externas foram registradas.

- [x] Tratar ausência e expiração de acesso internacional antes de consultar Google Maps; Brasil e /rapido preservados.
- [x] Encerrar carregamento de traduções com timeout, recuperação manual e fidelidade aos modelos brasileiros; traduções reais PT/ES/FR/IT passaram.
- [x] Persistir país, abordagem e idioma por país na nuvem e localmente; restauração local e isolamento PT/ES verificados.
- [x] Comprovar gravação e restauração autenticada de preferências: conta temporária, patches PT/ES simultâneos e leitura após reload verificados.

- [x] Centralizar configuração de países e corrigir consultas internacionais, paginação e localidades sem editar /rapido.
- [x] Traduzir duas etapas preservando modelos brasileiros, validar idioma e impedir envio de geração incompleta; traduções reais PT/ES/FR/IT verificadas.
- [x] Executar 37 testes e verificar troca de países, persistência, campos e filtros em desktop e celular sem erros.
- [ ] Validar buscas reais BR/PT/ES/FR/IT no domínio publicado — bloqueado: Google Maps não pode ser validado no sandbox; a busca internacional requer conta confirmada, atualmente não há contas.
- [ ] Completar sugestões de todas as divisões administrativas e comprovar cobertura internacional de cada categoria — bloqueado: falta a lista-fonte completa e validação real do Google Maps.

- [x] Unificar categorias na Prospecção, preservar o catálogo e pesquisar todos os termos selecionados; 12 testes passaram, seletor e rolagem verificados em 320/390/1280px e busca real com duas categorias retornou 57 empresas em Campinas.
- [x] Organizar e tornar pesquisáveis as categorias existentes, preservando os termos por país.
- [x] Adicionar Modo rápido em Oportunidades usando a busca e o salvamento existentes.
- [x] Melhorar seleção, localização e rolagem no celular; verificar larguras de 320, 360, 390, 430, tablet e desktop.
- [x] Testar regras de filtros, localização, deduplicação e preservação de leads: 9 testes passaram; busca real em Campinas e leitura do lead salvo verificadas.
- [ ] Importar e conferir todas as novas categorias e subcategorias — bloqueado: “Texto colado(4).txt” não foi recebido.

Limitação de verificação: teclado virtual não testado em aparelho físico. Continuação multicategoria corrigida com fila compartilhada e testes; funcionamento real do Google continua pendente de validação autorizada.
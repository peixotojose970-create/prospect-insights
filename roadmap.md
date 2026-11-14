# Atualização do Prospector

- [x] Preparar escopo da Etapa 1, registrar referência de restauração e executar testes existentes sem consultas pagas: 43 testes passaram.
- [x] Implementar autorização do limite, reserva atômica, interrupção após falha de consumo, validação de fotos, DNS e redirecionamentos; conta comum não salva nem concede papel administrativo a si própria.
- [ ] Concluir validação da Etapa 1 — bloqueado: não há administrador autorizado existente; testes concorrentes precisam de ambiente isolado gravável; garantia de destino na conexão e proteção adicional contra abuso exigem mecanismo confirmado.
- [ ] Preparar e validar Etapas 2–5 separadamente — bloqueado: dependem dos resultados aprovados da Etapa 1; CRM permanece local.

- [x] Tratar ausência e expiração de acesso internacional antes de consultar Google Maps; Brasil e /rapido preservados.
- [x] Encerrar carregamento de traduções com timeout, recuperação manual e fidelidade aos modelos brasileiros; traduções reais PT/ES/FR/IT passaram.
- [x] Persistir país, abordagem e idioma por país na nuvem e localmente; restauração local e isolamento PT/ES verificados.
- [ ] Comprovar gravação e restauração autenticada na nuvem — bloqueado: nenhuma conta existente para obter sessão de teste.

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

Limitação de verificação: teclado virtual não testado em aparelho físico. A continuação da busca segue a paginação da última categoria pesquisada.
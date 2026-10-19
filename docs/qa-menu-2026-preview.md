# QA do Preview do Menu 2026

## Identificacao

- Preview: https://www.abcdaconstrucao.com.br/?preview-theme=J1nh4XeaRw6mOYc%2bSxiI8A%3d%3d
- Fonte de dados: menu `menu geral 2026`, posicao `Lateral Esquerda`, no CMS Wake
- Escopo: header, mega menu desktop, menu lateral mobile e destinos acessados pelo menu
- Execucao: 19/10/2026
- Estado: concluido no preview, sem acesso direto ao painel administrativo

## Objetivo

Validar se todas as jornadas do novo menu funcionam com os dados reais da Wake, se os itens direcionam para destinos validos e se a experiencia permanece utilizavel em desktop e mobile mesmo quando faltam links, imagens, banners ou hotsites.

## Baseline informada pela implementacao

- 497 itens no menu, sendo 487 cadastrados nesta entrega e 10 preexistentes.
- 7 itens principais: Departamentos, Ambientes, Metais, Loucas, Pisos e Revestimentos, Cupons e Saldao de Ofertas.
- Departamentos: 251 itens.
- Ambientes: 131 itens.
- Pisos e Revestimentos: 40 itens.
- Metais: 39 itens.
- Loucas: 25 itens.
- 449 itens com imagem e 38 com icone de reserva.
- 209 itens informados sem link.
- Quarto nivel, com cerca de 289 subitens, nao cadastrado.

## Criterios de resultado

- **Aprovado:** comportamento e destino correspondem ao esperado.
- **Aprovado com ressalva:** funciona, mas depende de cadastro, conteudo ou melhoria nao bloqueante.
- **Reprovado:** jornada quebrada, destino incorreto, erro visual relevante ou falha funcional.
- **Bloqueado:** nao foi possivel validar por dependencia externa, acesso ou dado ausente.

## Resumo da cobertura executada

- Desktop validado em viewport de 1440 x 1000.
- Mobile validado em viewport real de 390 x 844.
- 21 paineis de Departamentos conferidos: Principais Categorias e 20 departamentos.
- 8 paineis de Ambientes conferidos.
- 464 ocorrencias de links inventariadas no menu desktop.
- 217 destinos internos unicos com URL configurada testados; 214 responderam corretamente e 3 retornaram 404.
- 519 ocorrencias de links inventariadas no drawer mobile; 189 estao sem `href` e 211 destinos internos unicos foram identificados.
- 469 origens de imagem unicas do header/menu testadas; todas responderam HTTP 200 com conteudo de imagem.
- Cupons e Saldao abertos em pagina renderizada. O Saldao carrega sem erro 500.

## Severidade dos defeitos

- **Critica:** impede abrir o menu, causa erro 500 ou bloqueia compra/navegacao principal.
- **Alta:** item importante nao abre, link incorreto ou jornada termina sem destino quando deveria navegar.
- **Media:** problema de hover, responsividade, imagem, banner ou estado que prejudica a compreensao.
- **Baixa:** desalinhamento, texto, espacamento ou refinamento visual sem bloqueio da jornada.

## Matriz de validacao

| ID | Area | Validacao | Resultado esperado | Status | Evidencia / observacao |
|---|---|---|---|---|---|
| HDR-01 | Header desktop | Carregamento do header | Header renderiza sem salto, sobreposicao ou imagem quebrada | Aprovado | Sem overflow horizontal ou imagem quebrada nas viewports testadas. |
| HDR-02 | Header desktop | Itens principais | Os 7 itens aparecem na ordem cadastrada | Aprovado | Departamentos, Ambientes, Metais, Loucas, Pisos e Revestimentos, Cupons e Saldao. |
| HDR-03 | Header desktop | Links estaticos | Conta, carrinho, lojas, CEP, WhatsApp e logos respondem corretamente | Aprovado com ressalva | Destinos estao configurados; links externos nao foram submetidos a fluxo autenticado. |
| HDR-04 | Header desktop | Console | Nenhum erro causado pelo menu | Aprovado com ressalva | Nenhum erro atribuido ao menu. Existem erros de terceiros/analytics descritos em QA-05. |
| DEP-01 | Departamentos | Abertura do mega menu | Mega menu abre por hover e permanece estavel | Aprovado com ressalva | Abre e fecha corretamente, mas a troca interna e imediata. |
| DEP-02 | Departamentos | Trilho principal | Principais Categorias e os 20 departamentos aparecem | Aprovado | Todos os 21 paineis foram localizados e renderizados. |
| DEP-03 | Departamentos | Troca por hover | Existe tolerancia/delay para cruzar ate o conteudo sem trocar de painel acidentalmente | Reprovado | O codigo aplica 90 ms apenas aos itens do topo; `department-link` recebe 0 ms. |
| DEP-04 | Departamentos | Troca intencional | Novo painel abre depois do delay definido | Reprovado | A troca funciona, mas ocorre imediatamente, sem intencao de hover. |
| DEP-05 | Departamentos | Cards e subslides | Todos os cards e controles de slide abrem sem travar ou sobrepor conteudo | Aprovado com ressalva | Estrutura renderiza; itens sem URL continuam aparentando ser acionaveis. |
| DEP-06 | Departamentos | Destinos dos cards | Cada item com link abre a categoria correta | Reprovado | Ha destinos 404 e itens sem URL. Ver QA-01 e QA-02. |
| DEP-07 | Departamentos | Itens sem link | Item sem link nao gera pagina vazia, `#`, recarga ou erro | Reprovado | 127 ocorrencias sem `href` dentro de Departamentos no desktop. |
| DEP-08 | Departamentos | Promocoes em Destaque | Duas promocoes aparecem com imagem, texto e link validos | Aprovado com ressalva | Todos os paineis usam o mesmo par generico; nao ha banner contextual por departamento. |
| DEP-09 | Departamentos | Buscar por marcas | Paineis e marcas exibem logo ou fallback e apontam ao destino esperado | Reprovado | A marca Fani Metais aponta para URL 404. |
| DEP-10 | Departamentos | Imagens | Ausencia de imagem usa fallback sem quebrar o layout | Aprovado | Nenhuma das 469 origens de imagem auditadas falhou. |
| AMB-01 | Ambientes | Lista principal | Os 8 ambientes aparecem com foto e nome corretos | Aprovado | Banheiro, Cozinha, Sala de estar, Sala de jantar, Quarto, Escritorio, Area externa e Piscina. |
| AMB-02 | Ambientes | Categorias internas | Cada ambiente exibe suas categorias sem duplicidade indevida | Aprovado | 123 links internos renderizados; os acordeoes iniciam recolhidos no mobile. |
| AMB-03 | Ambientes | Destinos | Cada categoria com link abre o destino correspondente | Reprovado | Os CTAs `Ver mais` de Piscina e Sala de jantar retornam 404. |
| AMB-04 | Ambientes | Fallback | Ausencia de banner ou imagem nao quebra o painel | Aprovado | Fotos e fallbacks carregam sem erro. |
| N1-01 | Metais | Arvore e destinos | Itens, subslides e links retornam a categoria correta | Aprovado com ressalva | Dois itens sem URL; demais destinos configurados responderam. |
| N1-02 | Loucas | Arvore e destinos | Itens, subslides e links retornam a categoria correta | Aprovado | Destinos configurados responderam. |
| N1-03 | Pisos e Revestimentos | Arvore e destinos | Itens, subslides e links retornam a categoria correta | Aprovado com ressalva | Um item sem URL; demais destinos configurados responderam. |
| CTA-01 | Cupons | Destino | Link abre a pagina esperada sem erro | Aprovado | Pagina abriu com o titulo `Pegue seu Cupom de Desconto`. |
| CTA-02 | Saldao de Ofertas | Destino | `/saldao-abc` carrega sem erro 500 | Aprovado | Pagina abriu com produtos e sem erro 500. |
| CTA-03 | Saldao de Ofertas | Vitrines opcionais | Vitrines nulas sao ocultadas sem quebrar a pagina | Aprovado | A pagina permaneceu funcional com a protecao implementada. |
| CTA-04 | Saldao de Ofertas | Vitrine Metais 98543 | Confirmar estado do hotsite e impacto visual | Bloqueado | Requer verificacao no admin; a implementacao informa retorno nulo. |
| MOB-01 | Mobile | Header | Header cabe na viewport sem sobreposicao | Aprovado | 390 x 844, sem overflow horizontal. |
| MOB-02 | Mobile | Menu lateral | Abre, fecha e preserva o scroll corretamente | Aprovado | Drawer ocupa 334 px numa viewport de 390 px e transiciona corretamente. |
| MOB-03 | Mobile | Departamentos | Expandir, recolher e navegar por todos os niveis | Aprovado com ressalva | Exclusividade dos acordeoes aprovada; 127 links internos estao sem URL. |
| MOB-04 | Mobile | Ambientes | Expandir, recolher e navegar pelos 8 ambientes | Reprovado | Comportamento do acordeao aprovado, mas dois CTAs `Ver mais` retornam 404. |
| MOB-05 | Mobile | Metais, Loucas e Pisos | Sliders e retornos mantem contexto e estado correto | Aprovado com ressalva | Um grupo raiz e um subgrupo ficam abertos por vez; ha 62 links sem URL na secao Categorias. |
| MOB-06 | Mobile | Itens sem link | Toque nao gera tela vazia, salto ou fechamento inesperado | Reprovado | 189 de 519 ocorrencias de links nao possuem `href`. |
| MOB-07 | Mobile | Imagens e texto | Sem corte indevido, sobreposicao ou quebra excessiva | Aprovado | Nenhuma imagem quebrada e nenhum overflow horizontal na viewport testada. |
| DAT-01 | CMS | Menu de origem | Confirmar que o front le apenas `menu geral 2026` | Aprovado com ressalva | Estrutura e contagens correspondem a entrega; nao houve acesso direto ao admin para auditar o menu antigo. |
| DAT-02 | CMS | Resiliencia | Item ausente, sem imagem ou sem banner nao quebra o menu | Aprovado | Fallbacks carregam e a ausencia de conteudo nao quebrou o componente. |
| LNK-01 | Links | Cobertura completa | Inventariar todos os links do menu e seus status HTTP | Aprovado | 217 URLs internas unicas testadas no conjunto desktop; 214 validas e 3 com 404. |
| LNK-02 | Links | Correspondencia | Titulo do item e pagina de destino possuem relacao correta | Reprovado | Tres destinos quebrados e grande volume de itens sem URL. |
| LNK-03 | Links | Redirecionamentos | Registrar redirecionamentos, loops e destinos fora do dominio | Aprovado com ressalva | Nove buscas redirecionam para categorias relacionadas; comportamento considerado coerente. |
| IMG-01 | Imagens | Cobertura completa | Nenhuma imagem retorna 404 ou aparece quebrada | Aprovado | 469 URLs unicas retornaram HTTP 200 e tipo de conteudo de imagem. |
| BAN-01 | Banners | Configuracao atual | Confirmar `menu-banners` e os dois banners `menu-destaques-*` | Aprovado | Os dois banners genericos aparecem nos 21 paineis. |
| BAN-02 | Banners | Fallback | Confirmar `menu-fallback`, icones e promocoes de reserva | Aprovado | Fallback visual presente, sem imagem quebrada. |
| BAN-03 | Banners | Colecoes por departamento | Mapear quais colecoes especificas ainda precisam ser criadas | Reprovado | Nenhuma colecao especifica esta ativa; ver plano operacional. |
| BAN-04 | Banners | Colecoes por ambiente | Mapear quais colecoes especificas ainda precisam ser criadas | Bloqueado | Nao ha colecao ativa e o requisito de negocio precisa definir se ambientes terao promocao propria. |
| PERF-01 | Performance | Abertura | Menu abre sem atraso perceptivel ou bloqueio da pagina | Aprovado | HTML vem renderizado do servidor e a abertura foi imediata nas viewports testadas. |
| A11Y-01 | Acessibilidade | Teclado | Foco, Enter, Esc e navegacao basica funcionam | Aprovado com ressalva | Radios nativos sao focaveis, ha estilo de foco e Escape fecha paineis; faltou rodada dedicada com leitor de tela. |
| A11Y-02 | Acessibilidade | Semantica | Controles comunicam nome, estado e destino | Aprovado com ressalva | Labels nomeiam os radios, mas acordeoes nao expõem `aria-expanded` nem `aria-controls`. |

## Defeitos e pendencias encontradas

### QA-01 - Tres destinos retornam 404

- Severidade: Alta.
- Bloqueia publicacao sem correcao: sim.
- Destinos:
  - Ambientes > Piscina > Ver mais: `https://www.abcdaconstrucao.com.br/ambientes_piscina`
  - Ambientes > Sala de jantar > Ver mais: `https://www.abcdaconstrucao.com.br/ambientes_sala-de-jantar`
  - Buscar por marcas > Fani Metais: `https://www.abcdaconstrucao.com.br/fabricante/Fani%20Metais`
- A URL de Fani Metais aparece em Principais Categorias, no departamento Metais e no menu superior Metais.
- Acao: corrigir a URL no `menu geral 2026` ou criar/ativar o hotsite correspondente, indexar e limpar o cache.

### QA-02 - Itens visuais acionaveis sem URL

- Severidade: Alta.
- Bloqueia publicacao sem tratamento: sim.
- Desktop: 130 de 464 ocorrencias de links sem `href`.
  - Departamentos: 127.
  - Metais: 2.
  - Pisos e Revestimentos: 1.
- Mobile: 189 de 519 ocorrencias sem `href`.
  - Explore a ABC da Construcao por: 127.
  - Categorias: 62.
- Acao preferencial: cadastrar os links de negocio antes da publicacao.
- Tratamento minimo: enquanto nao houver URL, renderizar como texto/estado desabilitado, sem seta, hover ou papel de link. Nao usar `href` vazio, `#` ou a URL da home.

### QA-03 - Ausencia de intencao de hover no trilho de Departamentos

- Severidade: Media.
- Bloqueia publicacao: nao, mas deve ser corrigido antes do teste A/B para nao contaminar o resultado de navegabilidade.
- Evidencia tecnica: o bundle aplica 90 ms quando o controle possui a classe `nav-item`; os controles `department-link` recebem 0 ms. O fechamento usa 200 ms.
- Efeito: ao atravessar outro departamento para chegar ao painel atual, o conteudo troca acidentalmente.
- Acao: aplicar entre 180 e 250 ms de hover intent no trilho, cancelar o timer quando o ponteiro retornar ao painel ativo e manter fechamento entre 200 e 300 ms. Sugestao inicial: 200 ms.

### QA-04 - Promocoes nao sao contextualizadas por departamento

- Severidade: Media / conteudo.
- Bloqueia publicacao: depende do requisito de negocio. Para a proposta informada, sim.
- Evidencia: os 21 paineis exibem exatamente os mesmos dois banners:
  - `menu-destaques-1_porcelanato-oferta.jpg`
  - `menu-destaques-2_pisos-vinilicos.jpg`
- Os dois destinos sao, respectivamente, Porcelanato e Piso Vinilico.
- Acao: produzir e cadastrar o par especifico de cada departamento, preservando o par atual como fallback.

### QA-05 - Erros de console fora do componente do menu

- Severidade: Media.
- Bloqueia publicacao do menu: nao, desde que analytics valide a coleta.
- Ocorrencias:
  - `mmtracker.js`: tentativa de interpretar HTML como JSON ao atualizar carrinho, observada em desktop e mobile.
  - Saldao: `gtm_hotsite_details is not defined` no bundle de eventos.
- Acao: encaminhar ao responsavel por analytics/tracking e validar se page view, clique de menu, add-to-cart e conversao continuam sendo enviados.

### QA-06 - Semantica dos acordeoes pode ser melhorada

- Severidade: Baixa.
- Bloqueia publicacao: nao.
- Evidencia: os controles usam radios nativos nomeados e foco visivel, mas nao publicam `aria-expanded` nem `aria-controls`.
- Acao: sincronizar esses atributos com o estado aberto e apontar para o ID do painel controlado.

## Inventario funcional conferido

### Departamentos

1. Principais Categorias
2. Pisos e Revestimentos
3. Metais
4. Loucas e Inox
5. Banho e Aquecimento
6. Argamassa e Rejunte
7. Coberturas e Telhas
8. Eletrodomesticos
9. Eletroportateis
10. Energia Solar
11. Ferragens
12. Ferramentas
13. Iluminacao
14. Lazer
15. Materiais Eletricos
16. Materiais Hidraulicos
17. Moveis e Decoracao
18. Portas e Janelas
19. Seguranca e Comunicacao
20. Tinta
21. Utilidades Domesticas

### Ambientes

1. Banheiro
2. Cozinha
3. Sala de estar
4. Sala de jantar
5. Quarto
6. Escritorio
7. Area externa
8. Piscina

### Comportamento mobile

- `Principais Categorias` pode abrir e recolher manualmente.
- Apenas um grupo raiz fica aberto por vez.
- Apenas um departamento fica aberto por vez.
- Apenas um ambiente fica aberto por vez.
- Os oito ambientes iniciam recolhidos; nao ha abertura automatica durante o scroll.
- Drawer sem overflow horizontal em 390 x 844.

## Plano de banners

### Situacao informada antes do QA

- `menu-banners` possui apenas `menu-destaques-1` e `menu-destaques-2`.
- `menu-fallback` possui as imagens de reserva.
- As colecoes opcionais por departamento (`menu-<slot>-N`) ainda nao foram cadastradas.
- As colecoes opcionais por ambiente (`menu-ambientes-*`) ainda nao foram cadastradas.

### Validacao necessaria

- Confirmado: neste preview todos os departamentos caem no par generico de `menu-banners`.
- Confirmado: o front nao exibe nenhuma promocao especifica de departamento.
- As pecas atuais possuem 480 x 354 px e aparecem em aproximadamente 187 x 138 px no desktop.
- O admin nao foi acessado; status, periodo e vinculacao dos registros precisam ser conferidos pela equipe com permissao.

### Quantidade a produzir

- Minimo: 40 pecas, duas para cada um dos 20 departamentos.
- Se `Principais Categorias` tambem receber comunicacao propria: 42 pecas.
- Manter as duas pecas atuais como fallback operacional.

### Padrao de nomes esperado pelo tema

- `menu-<slot>-1`
- `menu-<slot>-2`

Antes da subida em massa, o desenvolvimento deve exportar a tabela exata de `<slot>` consumida pelo tema. O valor nao esta exposto no HTML final. Usar um alias aproximado faz o front ignorar a peca e retornar ao fallback.

Slots de negocio a mapear:

- `pisos-e-revestimentos`
- `metais`
- `loucas-e-inox`
- `banho-e-aquecimento`
- `argamassa-e-rejunte`
- `coberturas-e-telhas`
- `eletrodomesticos`
- `eletroportateis`
- `energia-solar`
- `ferragens`
- `ferramentas`
- `iluminacao`
- `lazer`
- `materiais-eletricos`
- `materiais-hidraulicos`
- `moveis-e-decoracao`
- `portas-e-janelas`
- `seguranca-e-comunicacao`
- `tinta`
- `utilidades-domesticas`

### Passo a passo operacional no Wake

1. Solicitar ao desenvolvimento a relacao exata `departamento -> slot -> alias 1/2`.
2. Preparar duas pecas por departamento em 480 x 354 px, com area segura para texto e CTA.
3. Definir para cada peca: titulo interno, departamento, ordem 1 ou 2, URL de destino, UTM, data de inicio e data final.
4. No painel, acessar `Vitrines > Banners` e selecionar `Adicionar Banner`.
5. Cadastrar a imagem, a URL de destino e o alias exato esperado pelo tema.
6. Vincular ao hotsite/agrupador `menu-banners`, conforme o padrao dos dois registros atuais. Nao marcar exibicao global sem necessidade.
7. Ativar e conferir vigencia, ordem e tamanho. Salvar.
8. Indexar a loja e limpar o cache.
9. Reabrir o preview e conferir os 21 paineis, garantindo que nenhum deles caiu no fallback indevidamente.
10. Repetir a auditoria de status das URLs e de imagens antes de publicar.

Documentacao oficial da Wake usada como referencia:

- [Cadastro de Banner - FAQ](https://atendimento.wake.tech/hc/pt-br/articles/21406639832471-Cadastro-de-Banner-FAQ)
- [Cadastro de Hotsite - FAQ](https://atendimento.wake.tech/hc/pt-br/articles/21406647810455-Cadastro-de-Hotsite-FAQ)

## Pendencias conhecidas que nao devem ser confundidas com regressao

- 209 itens ainda sem link, dependentes de definicao do negocio.
- Quarto nivel nao cadastrado.
- Vitrine Metais do Saldao, hotsite 98543, informada como nula.
- Regionalizacao pode permanecer oculta enquanto tabela de preco nao estiver configurada.

## Resultado executivo

### Parecer

**No-go para publicacao integral neste estado.** A base tecnica do menu esta estavel, responsiva, renderizada no servidor e sem imagens quebradas, mas ainda existem jornadas objetivamente quebradas e conteudo obrigatorio ausente.

Dos 45 cenarios da matriz, 20 foram aprovados, 13 aprovados com ressalva, 10 reprovados e 2 ficaram bloqueados por validacao administrativa. Assim, 73,3% estao funcionalmente aprovados ou aprovados com ressalva, mas os itens reprovados incluem tres jornadas 404 e links ausentes visiveis ao cliente.

### Bloqueadores antes da publicacao

1. Corrigir os tres destinos 404.
2. Cadastrar os links pendentes ou remover a aparencia clicavel dos itens sem URL.
3. Se promocoes por departamento fazem parte do escopo de lancamento, cadastrar as 40 ou 42 pecas especificas.
4. Implementar hover intent no trilho de Departamentos.
5. Confirmar no admin a vitrine Metais 98543 do Saldao.

### O que ja pode ser considerado aprovado

- Estrutura dos sete itens principais.
- Renderizacao server-side e abertura do menu.
- Responsividade em 390 x 844.
- Exclusividade dos acordeoes mobile.
- Carregamento das imagens e fallbacks.
- Paginas de Cupons e Saldao, com o Saldao sem erro 500.
- 214 de 217 destinos internos unicos configurados respondendo corretamente, equivalentes a 98,6% das URLs cadastradas auditadas.

Depois dos bloqueadores, executar uma rodada curta de regressao focada nos tres links corrigidos, nos itens que receberem URL, nos 21 pares de banners e no hover entre departamentos.

## Atualizacao local - branch `novo-menu-2026`

Implementado e validado localmente em 19/10/2026, ainda sem publicacao no preview:

- QA-02: itens sem URL agora sao elementos desabilitados, sem `href`, seta, hover de navegacao ou cursor de link.
- QA-03: hover intent configurado em 200 ms para Departamentos, 180 ms para Ambientes e 110 ms para o menu principal, com cancelamento ao sair antes da abertura.
- QA-05: `gtm_hotsite_details` recebeu fallback seguro para nao interromper o evento quando o objeto nao existir.
- QA-06: os 42 acordeoes agora expoem `role="button"`, `aria-expanded` e `aria-controls`, mantem o estado sincronizado e preservam o foco visivel ao usar Enter/Espaco.
- Microinteracao: icones interativos do header, menu desktop e drawer receberam uma animacao curta de salto com oscilacao. A animacao usa apenas `transform`, ativa `will-change` somente durante a interacao e e removida quando o usuario prefere movimento reduzido.

Validacao local:

- Desktop: 1440 x 900, sem overflow e sem imagem quebrada.
- Mobile: 390 x 844, sem overflow.
- Nenhum link vazio permaneceu no menu renderizado.
- 319 ocorrencias sem destino foram renderizadas como estados desabilitados somando as estruturas desktop e mobile.
- Exclusividade, recolhimento manual e navegacao por teclado dos acordeoes aprovados.

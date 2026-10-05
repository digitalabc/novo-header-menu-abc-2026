# Preview — Header/Menu ABC 2026

Preview estático, sem backend e sem dependências, criado em HTML, CSS e JavaScript puro.

A tipografia usa a **Satoshi Variable real (pesos 300–900)** pela API oficial da [Fontshare](https://www.fontshare.com/fonts/satoshi), com `font-display: swap`. Esse carregamento requer internet; sem conexão, a pilha de fontes alternativas mantém o preview utilizável. Não há biblioteca de interface ou dependência de build.

A página contém apenas o header e seus menus. A área abaixo permanece vazia, sem hero ou conteúdo demonstrativo.

## Executar localmente

Na raiz do projeto, use qualquer servidor estático. Exemplos:

```powershell
python -m http.server 8080
```

ou:

```powershell
npx serve .
```

Abra `http://localhost:8080`.

## Interações do preview

- No desktop, os menus N1 abrem por hover ou foco de teclado e permanecem acessíveis durante a travessia do cursor até o mega menu.
- No centro da tarja desktop, as comunicações em maiúsculas de frete em metais para Sul/Sudeste e “Parcele em até 10x sem juros no cartão” alternam a cada 4 segundos, da direita para a esquerda. As comunicações da topbar usam a mesma paleta verde do badge de WhatsApp, com cantos arredondados, texto verde e fundo verde-claro. Frete e parcelamento usam ícones lineares compatíveis de caminhão e cartão, sem emojis, sem balanço e sem animação de vento. O parcelamento não repete “10x” como ícone. O espaço entre ícone e texto é de 5 px no desktop e 2 px no mobile. Não há controles de play/pause. A rotação pausa durante os modais, sidebar e em abas ocultas; com movimento reduzido, as duas mensagens ficam estáticas. Os textos são dados locais de preview, baseados na tarja pública da ABC consultada em 03/10/2026; não há validação de elegibilidade ou checkout.
- A topbar mobile tem cinco slides nesta ordem: frete, parcelamento, WhatsApp, Nossas Lojas e Casa Prime. Cada slide permanece 4 segundos; frete e parcelamento são slides independentes e consecutivos. Apenas o slide externo anima horizontalmente: os textos internos não têm animação de entrada própria. Setas, teclas direcionais e deslize horizontal também permitem navegar. Slides inativos saem da renderização após a transição, inclusive seus textos internos, para evitar sobreposição. O autoplay pausa com foco nos controles, com menus/modais abertos ou aba oculta, e respeita movimento reduzido. Os itens são configurados em `mobileTopbarItems` em `js/menu-data.js`. A faixa vermelha revelada pela rolagem tem 40 px de altura e alterna as mesmas mensagens horizontalmente a cada 4 segundos.
- No mobile, o primeiro gesto vertical para rolar para baixo recolhe a topbar clara e revela uma faixa vermelha de condições de compra abaixo da regionalização. O header permanece no topo; voltar ao início restaura a topbar. O gesto funciona também no preview sem conteúdo de página. A transição não é acionada pelo scroll do sidebar, busca ou modais; a busca suspende a faixa. Mensagens quebram em linhas inteiras nas telas estreitas, e elementos recolhidos ficam fora da navegação por teclado/leitor de tela.
- O botão N1 Departamentos e sua lista lateral compartilham uma largura fluida (`clamp`), sem duplicar medidas por breakpoint. Seu texto preenche a coluna central e fica centralizado no botão. Sua seta aponta à direita fechado e gira somente para baixo ao abrir.
- Hover N1 tem espera de 140 ms; seleção nas colunas tem espera de 150 ms. A saída tem tolerância de 240 ms e fade de 220 ms.
- Promoções, categorias e marcas ficam reunidas em um painel branco com padding de 24 px (20 px no desktop compacto), dentro do dropdown azul-claro. Faixas de 20 px acima e abaixo impedem que o branco encoste no header. Ambientes usa o mesmo painel.
- Os dropdowns ajustam sua altura ao conteúdo, até o limite da área útil da tela. Quando há uma lista lateral, os dois painéis brancos mantêm topo e base alinhados. As sombras do header e dos dropdowns são curtas e discretas.
- Scrollbars reais de 4 px ficam à esquerda das listas de Departamentos, Ambientes e categorias, com respiro e leitura dos itens mantida da esquerda para a direita.
- A lista de Departamentos tem seu próprio painel branco, alinhado ao painel de conteúdo. Suas setas continuam apontando para a direita e avançam 4 px por uma transição de padding, sem movimentar o texto.
- As linhas de Departamentos têm altura mínima de 40 px e 6 px de espaço branco entre os estados de hover/seleção.
- A lista lateral de Ambientes fica dentro de um painel branco mais largo (272 a 320 px), com padding e scrollbar à esquerda. Há 8 px entre suas opções. As imagens se aproximam da aresta esquerda das linhas (padding interno de 4 px), com 120 × 92 px no desktop amplo, 104 × 84 px no compacto e 96 × 64 px no mobile; sua lateral se dissolve no fundo. Hover e seleção usam o mesmo rosa claro, borda suave e vermelho de Departamentos, sem aumentar o peso do texto.
- O destaque de Ambientes é um card vertical com a imagem passando para branco puro, com transparência mais forte na base. “Ambiente”, nome do espaço e frase amigável são HTML: a frase fica abaixo do nome em 12 px, peso 400 e cor discreta. Não há mais um título duplicado acima do grid. O grid usa 3 colunas quando há espaço e 2 quando sua própria coluna fica estreita; a transparência também se adapta às telas mais baixas.
- As fotos mostram casas brasileiras de classe média e variam os acabamentos claros, escuros, marrons e terracota. Miniaturas e versões verticais usam o mesmo `imageId`; os arquivos WebP da coleção atual somam aproximadamente 453 KiB. Arquivos e prompts de geração estão em [header-menu-abc/documentacao/fotos-ambientes.md](header-menu-abc/documentacao/fotos-ambientes.md).
- Transparências suavizam a lateral das miniaturas e as bordas de scroll. Os fades do scroll só aparecem nas extremidades que têm conteúdo oculto; ao chegar ao final, o último item fica totalmente legível. A troca de ambiente preserva a lista, foco e posição de scroll.
- A busca desktop começa como uma lupa circular de 44 px. Ao clicar ou ativar pelo teclado, expande em 480 ms com 60 ms de delay; o campo aparece gradualmente e recebe foco. Escape recolhe e devolve o foco à lupa, sem apagar a consulta. Se estiver vazia, também recolhe ao clicar fora ou sair pelo teclado. Não realiza buscas reais: o preview continua sem backend.
- No desktop, o logo começa na margem esquerda do container, seguido de conta e regionalização. Lupa e carrinho de mão continuam à direita, inclusive com busca expandida. O botão Departamentos usa a mesma margem, sem o recuo lateral anterior; seu ícone metálico tem o acabamento dos demais ícones de ação. No mobile, o logo permanece centralizado, conta e menu ficam à esquerda, busca e carrinho à direita; a entrega conserva sua faixa própria para manter a leitura em telas pequenas.
- Um segundo clique na lupa recolhe a busca e preserva a consulta digitada; a mesma alternância funciona pelo teclado.
- “Ver mais” acompanha o grid com 16 px de intervalo e permanece fora da região de scroll. Cada departamento e ambiente possui `moreUrl: null` em `js/menu-data.js`, preparado para o futuro hotsite estratégico. Enquanto o destino não estiver definido, o link não navega nem provoca saltos na página. As colunas de navegação mantêm foco e posição do scroll durante a troca de conteúdo.
- Os 20 departamentos exibem Promoções em Destaque; **Principais Categorias não exibe promoções**. As campanhas compartilhadas de Pisos e Revestimentos são mocks substituíveis por `bannerIds`, não promoções reais específicas de cada segmento.
- As listas de categorias não são mais cortadas em oito itens. A rolagem vertical de 4 px à esquerda aparece somente quando o conteúdo excede a área disponível, mantendo o título e “Ver mais” visíveis. As marcas ficam em cartões com fundo mais suave (`#f3f5f7`).
- Os departamentos reutilizam os banners no desktop e no mobile. Apenas a imagem interna do banner amplia 4,5% no hover de mouse ou foco de teclado, com transição de 500 ms e delay de 70 ms; a moldura não muda de tamanho. Movimento reduzido desativa o zoom.
- No mobile, Principais Categorias é um accordion aberto por padrão no painel inicial.
- Todas as entradas iniciais do sidebar abrem dropdowns para baixo, com transição de 420 ms e delay de 60 ms. Título e seta ficam pretos e o título ganha peso 700 quando aberto. As opções internas usam cards brancos sobre azul-claro, com divisórias sutis entre as categorias principais.
- O toque em uma opção interna abre o painel lateral: entrada/saída em 360 ms com delay de 25 ms, bloqueio contra toques repetidos apenas durante a animação e retorno preservando dropdowns e scroll. A cópia de saída exclui descendentes ocultos, e a promoção de camada ocorre apenas durante o slide. A faixa de título e o cabeçalho ficam fora da região animada.
- `js/category-tree.js` indexa os nós por IDs de caminho. Principais Categorias, Departamentos e Ambientes resolvem os mesmos ramos; os níveis seguintes conservam o ID, evitando confundir folhas com categorias de mesmo nome. Porcelanato inclui formatos N4 existentes no catálogo; folhas sem filhos continuam indicando integração pendente.
- Os cards de ambientes dentro da lista mobile têm altura mínima de 200 px.
- No sidebar, o ambiente que cruza a faixa de leitura abre automaticamente após 140 ms de permanência. Só um ambiente fica aberto: a troca ajusta o scroll antes da pintura para conservar a posição visual do card e faz fade das novas opções. Toques e foco de teclado pausam essa seleção; um ambiente recolhido manualmente não reabre sozinho enquanto permanece nessa faixa.
- Conta e CEP usam um cabeçalho compacto no painel inicial, sem reduzir fontes. Ele sai de cena ao avançar na lista e reaparece ao rolar para cima próximo de Departamentos. Nos sliders, apenas o título da categoria e o botão de voltar permanecem no topo.
- O botão de voltar tem alvo de 44 px e destaque neutro de toque na área inteira. A seta mantém sua direção, sem rotação ou deslocamento.
- A busca mobile desce suavemente, sem bounce e sem espera mínima de três segundos para recolher. Essa espera permanece exclusiva do desktop.
- As regiões com scrollbar reservam espaço simétrico dos dois lados; os dropdowns mantêm o mesmo padding lateral. Links de serviços do rodapé não exibem setas de expansão.
- As seções de marcas usam o título “Buscar por marcas”.
- Cada painel inclui um rodapé de ajuda, lojas e acompanhamento de pedidos. Destinos de serviços e catálogo ainda são mocks locais. A navegação de subcategoria mostra os filhos existentes nos dados; categorias sem filhos indicam que a integração do catálogo está pendente.
- O modal mantém o foco dentro do menu, isola o header/página com `inert`, fecha com Escape e devolve o foco ao botão de abertura.
- As setas de dropdowns e accordions comunicam abertura por rotação. As setas N1 usam um SVG dentro de uma área de 16 × 16 px, com eixo central estável ao girar 90°; a lista desktop de Departamentos usa o avanço lateral descrito acima. `prefers-reduced-motion` é respeitado.
- Cards de categoria não usam sombra, escala, deslocamento do card ou negrito no hover: borda suave, texto e seta em vermelho. Apenas a seta avança 4 px por padding, no mesmo padrão da lista de Departamentos.

Os ícones de conta, localização e carrinho de mão usam versões WebP transparentes, no estilo dos produtos das subcategorias. Os PNGs originais permanecem preservados. Caminhos, origens e prompts estão em `header-menu-abc/documentacao/icones-cabecalho.json`.

## Ícones das categorias

Todos os assets estão em [header-menu-abc](header-menu-abc/README.md), com nomes em português e pastas `categorias/<departamento>/N1`, `N2` e `N3`. N4 permanece nos ramos existentes. PNG/JPG originais e variações ficam em `originais/`, separados das miniaturas finais. O [índice da árvore](header-menu-abc/indice-categorias.json) relaciona categoria, nível, ID e imagem; `js/catalogo-assets.js` resolve esses caminhos sem alterar os IDs de navegação. Ambientes, marcas, logos, promoções e ícones de ações têm suas próprias pastas.

`js/category-icons.js` concentra o registro de imagens e as regras semânticas de associação por família de produto. O mesmo resolvedor é usado pelos cards de Departamentos e Ambientes no desktop e no mobile; não há caminhos físicos espalhados nas configurações de menu.

Os ícones existentes foram preservados. As novas miniaturas de produtos reais foram extraídas do catálogo público da [ABC da Construção](https://www.abcdaconstrucao.com.br/) e salvas localmente; imagens ilustrativas adicionais usam fundo transparente e o mesmo tratamento de produto isolado. As imagens da ABC mantêm seu conteúdo original, com dimensões servidas pelo próprio CDN; `mix-blend-mode: multiply` integra os fundos brancos aos cards sem editar os produtos.

Cubas de cozinha, assentos sanitários, tanques inox, registros e torneiras de jardim possuem IDs próprios, sem reutilizar ícones de produtos diferentes. Itens atuais têm associações auditáveis; o genérico continua disponível apenas como fallback para dados futuros desconhecidos.

Fontes, URLs dos produtos e prompts dos ícones ilustrativos estão em `header-menu-abc/documentacao/fontes-produtos.json`. Confirmar a autorização de uso das imagens do catálogo antes de publicar uma versão comercial. O preview permanece estático e não faz requisições ao catálogo em tempo de execução.

A revisão dos níveis internos adiciona 23 fotos reais de porcelanatos, acessórios de banheiro, chuveiros e tintas. Os dez tipos de porcelanato têm imagens distintas. As respectivas páginas e URLs de imagem estão em `header-menu-abc/documentacao/fontes-subcategorias.json`. Nichos usa uma ilustração de produto isolado, documentada com o prompt em `header-menu-abc/documentacao/referencia-nicho.json`. Os formatos de uma mesma família podem reutilizar sua imagem representativa, mas não herdam automaticamente a imagem de uma família diferente.

Todas as imagens raster do registro de ícones são WebP e pesam menos de **15.000 bytes por arquivo** (15 KB, tamanho; não kbps). `scripts/otimizar-imagens.py` exporta miniaturas de até 160 px sem modificar os originais e sincroniza as cópias por nível. Fotos de ambientes e banners são assets maiores e não entram no limite de ícones. A verificação não exige dependências:

```powershell
node scripts/validate-menu-data.cjs
```

Os scripts de atualização de fotos e otimização são ferramentas opcionais de desenvolvimento: requerem Python, Pillow e, para atualizar fotos do catálogo, Brotli. Não fazem parte do runtime do site.

## Estados de preview

- Badges da topbar têm altura uniforme: 30 px no desktop e 32 px no mobile. O caminhão anima apenas no eixo horizontal, sem salto vertical. No sidebar, o hambúrguer de Departamentos usa a mesma coluna de ícone das demais categorias e o rodapé começa com “CONTE COM:”.
- Minha conta e regionalização abrem modais pelo ícone/texto, sem setas de dropdown ou de link externo. Os acionadores informam `aria-haspopup="dialog"`; Minha conta mantém espaço separado do SAC no sidebar.

- Desktop: navegue pelos botões Departamentos, Ambientes, Metais, Louças e Pisos e Revestimentos.
- Mobile: use o hamburger, a lupa e a navegação em níveis da sidebar.
- O site inicia deslogado, com “Entrar”. `?logged=1` permite visualizar o estado logado no preview.
- Na home mobile, o avatar mostra “Entrar” quando deslogado e “Olá, primeiro nome” com um indicador verde quando conectado. Nomes longos são truncados visualmente; a identificação completa permanece no nome acessível do botão. O logo continua centralizado, inclusive em telas de 320 px.
- O ícone de conta alterna entre logado e deslogado e abre o modal para conferir cada versão. O texto “Minha conta” e sua seta abrem o modal sem alterar o estado. Logado, há Meus pedidos, Meus dados, Meus endereços e Sair; deslogado, Entrar e Criar conta. Os dados e destinos são demonstrativos, sem autenticação real. O modal usa a linguagem visual da regionalização, fecha por Escape e mantém o foco dentro dele.
- O popup de regionalização abre somente ao clicar para informar ou alterar o CEP, nunca automaticamente na entrada. `?regionalized=1` simula uma região já definida.
- A busca mobile se revela de trás do header em 680 ms, sem bounce, com foco imediato no campo e sugestões posicionadas abaixo dele. Movimento reduzido desativa a animação.
- `?search=open` abre a busca mobile ou deixa a busca desktop expandida.
- `?search=dropdown` abre a busca mobile com sugestões e produtos.
- `?menu=departments&department=pisos-revestimentos` abre um estado do mega menu desktop.
- `?menu=environments&environment=banheiro` abre Ambientes no desktop.
- `?drawer=root`, `?drawer=departments`, `?drawer=environments` ou `?drawer=pisos-revestimentos` abrem estados da sidebar mobile.

## Publicação no GitHub Pages

Preview: [phaisonvs.github.io/novo-header-menu-abc-2026](https://phaisonvs.github.io/novo-header-menu-abc-2026/).

Repositório público: [phaisonvs/novo-header-menu-abc-2026](https://github.com/phaisonvs/novo-header-menu-abc-2026).

O projeto não exige build. O GitHub Pages publica a raiz (`/`) da branch `main`. Novos commits enviados para essa branch atualizam o preview automaticamente.

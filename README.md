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
- O botão N1 Departamentos e sua lista lateral compartilham uma largura fluida (`clamp`), sem duplicar medidas por breakpoint. Seu texto preenche a coluna central e fica centralizado no botão. Sua seta aponta à direita fechado e gira somente para baixo ao abrir.
- Hover N1 tem espera de 140 ms; seleção nas colunas tem espera de 150 ms. A saída tem tolerância de 240 ms e fade de 220 ms.
- Promoções, categorias e marcas ficam reunidas em um painel branco com padding de 24 px (20 px no desktop compacto), dentro do dropdown azul-claro. Faixas de 20 px acima e abaixo impedem que o branco encoste no header. Ambientes usa o mesmo painel.
- Os dropdowns ajustam sua altura ao conteúdo, até o limite da área útil da tela. Quando há uma lista lateral, os dois painéis brancos mantêm topo e base alinhados. As sombras do header e dos dropdowns são curtas e discretas.
- Scrollbars reais de 4 px ficam à esquerda das listas de Departamentos, Ambientes e categorias, com respiro e leitura dos itens mantida da esquerda para a direita.
- A lista de Departamentos tem seu próprio painel branco, alinhado ao painel de conteúdo. Suas setas continuam apontando para a direita e avançam 4 px por uma transição de padding, sem movimentar o texto.
- As linhas de Departamentos têm altura mínima de 40 px e 6 px de espaço branco entre os estados de hover/seleção.
- A lista lateral de Ambientes fica dentro de um painel branco mais largo (272 a 320 px), com padding e scrollbar à esquerda. Há 8 px entre suas opções. As imagens se aproximam da aresta esquerda das linhas (padding interno de 4 px), com 120 × 92 px no desktop amplo, 104 × 84 px no compacto e 96 × 64 px no mobile; sua lateral se dissolve no fundo. Hover e seleção usam o mesmo rosa claro, borda suave e vermelho de Departamentos, sem aumentar o peso do texto.
- O destaque de Ambientes é um card vertical com a imagem passando para branco puro, com transparência mais forte na base. “Ambiente”, nome do espaço e frase amigável são HTML: a frase fica abaixo do nome em 12 px, peso 400 e cor discreta. Não há mais um título duplicado acima do grid. O grid usa 3 colunas quando há espaço e 2 quando sua própria coluna fica estreita; a transparência também se adapta às telas mais baixas.
- As fotos mostram casas brasileiras de classe média e variam os acabamentos claros, escuros, marrons e terracota. Miniaturas e versões verticais usam o mesmo `imageId`; os arquivos WebP da coleção atual somam aproximadamente 453 KiB. Arquivos e prompts de geração estão em [assets/environment-images.md](assets/environment-images.md).
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
- O toque em uma opção interna abre o painel lateral: entrada/saída em 460 ms com delay de 60 ms, bloqueio contra toques repetidos e retorno preservando dropdowns e scroll. A faixa de título e o cabeçalho ficam fora da região animada; não há conteúdo passando por trás deles.
- Cada painel inclui um rodapé de ajuda, lojas e acompanhamento de pedidos. Destinos de serviços e catálogo ainda são mocks locais. A navegação de subcategoria mostra os filhos existentes nos dados; categorias sem filhos indicam que a integração do catálogo está pendente.
- O modal mantém o foco dentro do menu, isola o header/página com `inert`, fecha com Escape e devolve o foco ao botão de abertura.
- As setas de dropdowns e accordions comunicam abertura por rotação. As setas N1 usam um SVG dentro de uma área de 16 × 16 px, com eixo central estável ao girar 90°; a lista desktop de Departamentos usa o avanço lateral descrito acima. `prefers-reduced-motion` é respeitado.
- Cards de categoria não usam sombra, escala, deslocamento do card ou negrito no hover: borda suave, texto e seta em vermelho. Apenas a seta avança 4 px por padding, no mesmo padrão da lista de Departamentos.

Os ícones de conta, localização e carrinho de mão são PNGs transparentes, no estilo dos produtos das subcategorias; substituem glifos e desenhos CSS inconsistentes. Caminhos, origens e prompts estão em `assets/header-icons.json`.

## Ícones das categorias

`js/category-icons.js` concentra o registro de imagens e as regras semânticas de associação por família de produto. O mesmo resolvedor é usado pelos cards de Departamentos e Ambientes no desktop e no mobile; não há caminhos físicos espalhados nas configurações de menu.

Os ícones existentes foram preservados. As novas miniaturas de produtos reais foram extraídas do catálogo público da [ABC da Construção](https://www.abcdaconstrucao.com.br/) e salvas localmente; imagens ilustrativas adicionais usam fundo transparente e o mesmo tratamento de produto isolado. As imagens da ABC mantêm seu conteúdo original, com dimensões servidas pelo próprio CDN; `mix-blend-mode: multiply` integra os fundos brancos aos cards sem editar os produtos.

Cubas de cozinha, assentos sanitários, tanques inox, registros e torneiras de jardim possuem IDs próprios, sem reutilizar ícones de produtos diferentes. Itens atuais têm associações auditáveis; o genérico continua disponível apenas como fallback para dados futuros desconhecidos.

Fontes, URLs dos produtos e prompts dos ícones ilustrativos estão em `assets/categories/sources.json`. Confirmar a autorização de uso das imagens do catálogo antes de publicar uma versão comercial. O preview permanece estático e não faz requisições ao catálogo em tempo de execução.

## Estados de preview

- Desktop: navegue pelos botões Departamentos, Ambientes, Metais, Louças e Pisos e Revestimentos.
- Mobile: use o hamburger, a lupa e a navegação em níveis da sidebar.
- `?logged=0` simula usuário não logado.
- `?regionalized=0` simula CEP não informado.
- `?search=open` abre a busca mobile ou deixa a busca desktop expandida.
- `?search=dropdown` abre a busca mobile com sugestões e produtos.
- `?menu=departments&department=pisos-revestimentos` abre um estado do mega menu desktop.
- `?menu=environments&environment=banheiro` abre Ambientes no desktop.
- `?drawer=root`, `?drawer=departments`, `?drawer=environments` ou `?drawer=pisos-revestimentos` abrem estados da sidebar mobile.

## Publicação no GitHub Pages

Preview: [phaisonvs.github.io/novo-header-menu-abc-2026](https://phaisonvs.github.io/novo-header-menu-abc-2026/).

Repositório público: [phaisonvs/novo-header-menu-abc-2026](https://github.com/phaisonvs/novo-header-menu-abc-2026).

O projeto não exige build. O GitHub Pages publica a raiz (`/`) da branch `main`. Novos commits enviados para essa branch atualizam o preview automaticamente.

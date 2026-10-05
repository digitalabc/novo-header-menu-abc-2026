# Assets do Header/Menu ABC

Todos os arquivos visuais do preview ficam nesta pasta. Nomes de pastas e arquivos usam português, sem acentos, separados por hífen. N1/N2/N3 representam os níveis reais da árvore; N4 existe apenas nos ramos que já possuem esse nível.

```text
header-menu-abc/
  categorias/
    pisos-e-revestimentos/
      N1/                       imagem do departamento
      N2/                       famílias do segundo nível
      N3/                       subcategorias do terceiro nível
      N4/                       níveis adicionais existentes
    metais/
      N1/
      N2/
      N3/
    ...                         demais departamentos em português
  ambientes/<nome>/             paisagem.webp e vertical.webp
  icones/                       ações do header e navegação geral
  marcas/
  logos/
  promocoes/
  produtos/
  documentacao/                 origens, referências e permissões
  indice-categorias.json
```

`originais/` fica junto à imagem correspondente e preserva PNG/JPG e variações anteriores. As imagens finais de ícones são WebP com menos de 15 KB; fotos de ambientes e promoções seguem limites próprios. Não há conversão ou download no navegador.

O [índice](indice-categorias.json) relaciona cada categoria a seu nível, ID, ícone e arquivo. Um mesmo ícone representativo pode atender várias categorias; dentro do mesmo departamento e nível ele é armazenado uma só vez. Quando aparece em outro nível ou departamento, a cópia correspondente permite editar aquela seção de forma independente. Os nomes descrevem a imagem de fato, não fingem que um produto compartilhado é uma foto exclusiva de cada subcategoria.

`js/catalogo-assets.js` relaciona os IDs estáveis da árvore às imagens organizadas. `js/category-icons.js` mantém os ícones por ID semântico, e `js/menu-data.js` registra logos, marcas, ambientes e promoções. A configuração das categorias não espalha caminhos físicos.

Validação: `node scripts/validate-menu-data.cjs`. Otimização opcional: `python scripts/otimizar-imagens.py` (Pillow). As origens do catálogo permanecem em [fontes-produtos.json](documentacao/fontes-produtos.json) e [fontes-subcategorias.json](documentacao/fontes-subcategorias.json).

O ícone `nossas-lojas` está em `icones/nossas-lojas.webp` (5,8 KB), registrado em `js/menu-data.js`. O arquivo enviado pelo usuário em 05/10/2026 foi preservado em `icones/originais/nossas-lojas.png`; a exportação WebP usa até 160 px, qualidade 84 e preserva a transparência.

O logo `casa-prime` usa `logos/casa-prime.webp`, exportado do arquivo enviado em 05/10/2026 e preservado em `logos/originais/casa-prime.png`. Ele fica à direita do badge “Compre pelo WhatsApp” na topbar desktop.

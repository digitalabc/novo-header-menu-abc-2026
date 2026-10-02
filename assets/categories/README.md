# Ícones de categorias

Os arquivos `*-abc.jpg` são miniaturas de produtos reais do catálogo público da ABC, obtidas do CDN oficial em dimensões próprias para o preview. Não houve remoção de fundo nem alteração do produto; fundos brancos se integram ao card por CSS.

Os arquivos `*-generated-v1.png` são ilustrações de produto geradas pela ferramenta integrada de imagens, com transparência verdadeira, enquadramento quadrado, materiais realistas e luz de estúdio neutra. São exportados em 128 × 128 px preservando o alpha. Os originais de alta resolução são preservados na pasta de imagens geradas do Codex; seus caminhos e prompts estão no manifesto.

Referência de estilo: `assets/category-porcelanato.png`, usada somente como referência visual, não como alvo de edição. Uma geração separada foi feita para cada família de produto; não foram utilizados sprites ou folhas com vários ícones.

`sources.json` documenta a origem individual dos assets, distinguindo produtos reais de imagens ilustrativas. `js/category-icons.js` mantém os caminhos físicos apenas no registro de assets; menus e regras usam IDs semânticos.

As imagens reais não representam ofertas específicas ou disponibilidade de estoque do preview. Antes da publicação comercial, confirmar a autorização de uso das fotografias e marcas dos respectivos titulares.

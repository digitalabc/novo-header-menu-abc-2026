# Revisão Header / Sidebar — 02/10/2026

Preview verificado no Chromium, em HTML/CSS/JavaScript puro, sem backend.

## Header responsivo

- Larguras: 320, 360, 390, 430, 768, 900, 1024, 1200, 1440 e 1920 px.
- Centro geométrico do logo: diferença de 0 px em todas as larguras.
- Busca desktop expandida e recolhida nas cinco larguras desktop: centro preservado, sem sobreposição com o logo ou overflow horizontal.
- Ícones locais de conta, localização e carrinho de mão carregados sem erro.
- Hover da subcategoria: seta avança 4 px; posição do card não muda.

## Sidebar mobile

- Principais Categorias inicialmente expandido. Entradas iniciais e listas internas de Departamentos/Ambientes usam dropdowns; opções de subcategoria usam slide.
- Dropdown aberto: título preto em peso 700 e seta preta; opções em peso 400 sobre cards brancos.
- Fluxos testados: Departamentos → Metais → Torneiras para banheiro; Ambientes → Banheiro → Pias para Banheiro; retorno preservando dropdowns e scroll.
- Retorno de scroll testado em 999 px e 118 px: mesma posição recuperada.
- Durante o slide, título termina em y=182 e corpo começa em y=182: nenhum vão. Header termina em y=118; título começa em y=118. Scroll não altera essas posições.
- IDs únicos inclusive durante a animação; painel anterior isolado por `inert` e `aria-hidden`.
- Estados compactos: 320×568, 390×844 e 768×900; conta autenticada/não autenticada e CEP informado/não informado.
- Sem imagens quebradas, overflow horizontal no drawer ou erros JavaScript.
- Rodapé com três serviços, assinatura ABC e respeito ao safe area inferior.
- Escape fecha, libera `inert` da página e devolve o foco ao botão de abertura.
- `prefers-reduced-motion: reduce`: transição do accordion em 0 s.

## Limites do preview

Login, entrega, pedidos, cupons, atendimento e destinos estratégicos são mocks. Categorias sem filhos não simulam um catálogo real: a tela informa que a integração está pendente.

## Publicação

Git inicializado localmente na branch `main`. Não foi enviado à conta `phaisonvs`: o conector estava autenticado como `marciocld`, sem permissão de escrita nos repositórios consultados de `phaisonvs`; o navegador também estava sem sessão GitHub. Autenticação e repositório de destino precisam ser fornecidos antes do push.

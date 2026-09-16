# Estudo técnico — Diretório de lojas

**Projeto:** ABC da Construção / Wake Storefront (Fbits)

**Data da análise:** 2026-08-19

**Escopo:** fluxo do diretório de lojas, página de cidade, página final da franquia local, conteúdo administrado no Wake, dados mantidos em código, templates, JavaScript, estilos e integrações.

## 1. Resumo executivo

O diretório atual é um fluxo híbrido:

```text
URL pública
   │
   ├── /diretorio-de-lojas
   │      ├── conteúdo/SEO do Hotsite via Wake GraphQL
   │      └── lista de estados/cidades via Assets/JS/db_lojas.js
   │
   └── /diretorio-de-lojas/{estado}/{cidade}[/{loja}]
          ├── conteúdo, banners, SEO e nome do Hotsite via Wake GraphQL
          ├── cidade e lojas via Configs/settings.json
          └── formulário da franquia via JavaScript + API LeadWake
```

A página intermediária (`cidade_franquia.html`) decide entre cidade e franquia com base no nome do Hotsite recebido do Wake:

```liquid
isFranquia = data.hotsite.name | string.contains "Franquia"
```

Portanto, o texto/nome cadastrado no Hotsite tem efeito de roteamento de apresentação. Se o nome não contiver exatamente `Franquia`, a página final será renderizada como cidade.

## 2. Rotas e seleção de templates

O arquivo `Configs/pages.json` registra o sistema de páginas do Storefront. O tipo global é `hotsite` e os dois matches do diretório são:

| URL | Template | Query | Resultado |
|---|---|---|---|
| `/diretorio-de-lojas` | `Pages/custom/diretorio_de_lojas/diretorio.html` | `Queries/generic.graphql` | Índice de estados e cidades |
| `/diretorio-de-lojas/*` | `Pages/custom/diretorio_de_lojas/cidade_franquia.html` | `Queries/generic.graphql` | Cidade ou franquia local |

O wildcard não diferencia a profundidade do caminho. A distinção entre uma URL de cidade e uma URL de loja é feita depois, no template, pelo nome do Hotsite.

Existe ainda um match antigo para `auaha-loja-por-cidade`, apontando para `Custom/diretorio_de_lojas/franquia.html`. Ele é legado e não é o caminho utilizado pelas URLs atuais do diretório.

## 3. Camada de conteúdo do Wake

### 3.1 Query GraphQL usada

`Queries/generic.graphql` declara a operação:

```graphql
query Hotsite($url: String!) {
  hotsite(url: $url) {
    name
    seo { content name type httpEquiv scheme }
    contents { content contentId height title width position }
    banners {
      altText bannerName bannerUrl position openNewTab
      height title width urlOnClick
    }
  }
  brands(first: 50, brandInput: { groupIds: [19] }) {
    nodes { active urlLogo fullUrlLogo alias name }
  }
}
```

A URL exata do endpoint GraphQL não está definida no repositório: ela é resolvida pelo runtime do Wake/Fbits e pela ferramenta Storefront. O código apenas declara a operação e consome o objeto `data`.

### 3.2 O que é editável no painel Wake

Na página do índice:

- `content position: "Topo"` recebe conteúdo HTML do Hotsite.
- O nome do Hotsite é usado no título SEO.
- O SEO do Hotsite alimenta o componente `header`.

Na página de franquia local:

| Posição do conteúdo no Wake | Onde aparece | Evidência |
|---|---|---|
| `Topo` | Header/conteúdo antes dos banners | `Components/custom/diretorio_de_lojas/franquia.html:2` |
| `Centro` | Área “por que escolher”/conteúdo editorial | `.../franquia.html:63` |
| `Lateral Esquerda` | Área do mapa ou conteúdo lateral | `.../franquia.html:201` |
| `Rodapé` | Avaliações dos clientes e conteúdo final editorial | `.../franquia.html:244` |

Os banners da franquia também são administrados no Wake, usando posições exatas:

- `Topo`: carrossel desktop;
- `Mobile Topo`: carrossel mobile.

Os arquivos `backup_conteudos/franquia_header.html`, `franquia_sobre.html`, `franquia_mapa.html` e `franquia_avaliacoes.html` documentam o conteúdo que já foi utilizado no painel. Eles não são carregados automaticamente pelo template; funcionam como backup/referência para colagem ou recuperação manual.

### 3.3 O que não vem do Wake

Não existe, neste repositório, uma API de lojas sendo consultada pela página. Os dados de loja são renderizados a partir de arquivos versionados:

- `Configs/settings.json`: cidade, estado, lojas, endereço, telefone, URL da página e horários;
- `Assets/JS/db_lojas.js`: estados e cidades exibidos na página inicial do diretório.

As marcas são uma exceção: vêm da query GraphQL, filtradas por `groupIds: [19]`, e são renderizadas por `brands_list`.

## 4. Fluxo da página inicial do diretório

Arquivo principal: `Pages/custom/diretorio_de_lojas/diretorio.html`.

### Renderização

1. O runtime busca o Hotsite pela `generic.graphql`.
2. O `<head>` usa `data.hotsite.name` e `data.hotsite.seo`.
3. O conteúdo `Topo` é renderizado pelo componente `content`.
4. O HTML deixa vazia a seção `.lojas__bottom--container`.
5. `Assets/JS/diretorio_de_lojas.js` carrega `db_lojas.js`, cria as colunas e monta a lista no navegador.

### Lista de estados/cidades

`Assets/JS/db_lojas.js` declara a constante global `estados`. Cada item tem:

```js
{
  estado: "Minas Gerais",
  coluna: "1",
  coluna_mobile: "1",
  cidades: ["Abaeté", "Abre Campo", "...\"]
}
```

O JavaScript:

- cria o select de estados;
- cria quatro colunas no desktop e duas no mobile;
- gera links no formato `/diretorio-de-lojas/{estado-slug}/{cidade-slug}`;
- filtra estado por `change`;
- filtra cidade por texto durante `keydown` e pelo botão de busca;
- normaliza acentos e espaços com `String.prototype.slugify`.

O link é montado com domínio absoluto:

```js
https://www.abcdaconstrucao.com.br/diretorio-de-lojas/${urlEstado}/${urlCidade}
```

Isso reduz a portabilidade para ambientes locais/staging.

## 5. Fluxo da página de cidade

Arquivo de seleção: `Pages/custom/diretorio_de_lojas/cidade_franquia.html`.

Componente: `Components/custom/diretorio_de_lojas/cidade.html`.

### Derivação do nome da cidade

O componente não lê a cidade diretamente do pathname. Ele usa `data.hotsite.name`:

```liquid
cidadeArray = data.hotsite.name | regex.split `\s+`
size = (cidadeArray.size - 2)
for i in 1..size
  cidade += cidadeArray[i]
end
```

Na prática, o código remove o primeiro e o último token do nome do Hotsite e usa os tokens intermediários como cidade. Depois procura correspondência exata em:

```liquid
settings.cidades | array.filter @(do; ret $0.name == cidade ;end) | array.first
```

Consequências:

- o nome do Hotsite deve seguir uma convenção fixa de prefixo/sufixo;
- `cidade` precisa coincidir com `settings.cidades[].name`, incluindo grafia, espaços e acentos;
- se não houver correspondência, `estado` fica vazio e nenhum card de loja é produzido;
- não há tratamento explícito de 404 para cidade inexistente.

### Conteúdo da cidade

O texto editorial da cidade está hardcoded em `Components/custom/diretorio_de_lojas/cidade.html`. Ele contém títulos, parágrafos e links de produtos/categorias. O botão “Continuar lendo” é comportamental e implementado em `Assets/JS/diretorio_de_lojas.js`.

Os cards são renderizados no servidor usando `settings.cidades`:

```liquid
for cidadeConfig in settings.cidades
  if cidadeConfig.name == cidade
    for store in cidadeConfig.stores
      renderiza card da loja
    end
  end
end
```

Cada card exibe:

- nome da loja;
- endereço (`adress`, nome do campo existente no contrato);
- horário atual e dropdown semanal;
- telefone convertido para `tel:+55...`;
- link “Página da Loja” usando `details_link`.

## 6. Estrutura de dados em `settings.json`

O bloco relevante é `settings.cidades`:

```json
{
  "name": "Belo Horizonte",
  "state": "Minas Gerais",
  "stores": [
    {
      "name": "Atelier ABC - Lourdes",
      "adress": "R. Gonçalves Dias, 1866 - Lourdes, Belo Horizonte - MG, 30180-117",
      "phone": "(31) 3047-8717",
      "details_link": "https://www.abcdaconstrucao.com.br/diretorio-de-lojas/minas-gerais/belo-horizonte/lourdes",
      "monday": "9:00 às 19:00",
      "tuesday": "9:00 às 19:00",
      "wednesday": "9:00 às 19:00",
      "thursday": "9:00 às 19:00",
      "friday": "9:00 às 19:00",
      "saturday": "9:00 às 13:00",
      "sunday": "Fechado"
    }
  ]
}
```

Contrato prático:

| Campo | Obrigatório na prática | Uso |
|---|---:|---|
| `name` da cidade | Sim | Match com o Hotsite e título da página |
| `state` | Sim | Texto editorial e contexto da cidade |
| `stores` | Sim | Lista de cards |
| `stores[].name` | Sim | Nome exibido e identificação da franquia |
| `stores[].adress` | Sim | Endereço exibido |
| `stores[].phone` | Sim, mas há vazios | Link telefônico |
| `stores[].details_link` | Sim, mas há um vazio | Link para página final |
| `monday` … `sunday` | Sim | Horário semanal |

O arquivo também contém configurações gerais de catálogo, paginação, filtros, ordenação e unidades de produto. Essas configurações não participam diretamente do diretório, mas compartilham o mesmo `settings.json`.

## 7. Fluxo da página final da franquia local

Quando `isFranquia` é verdadeiro, o componente usado é:

`Components/custom/diretorio_de_lojas/franquia.html`.

A página final é composta por uma combinação de conteúdo do Wake e markup fixo no código:

```text
Conteúdo Wake: Topo
Carrossel Wake: Topo / Mobile Topo
Cards fixos: visita, QR Code/WhatsApp, catálogo
Conteúdo Wake: Centro
Categorias fixas: 8 cards com links atualmente apontando para "/"
Conteúdo Wake: Lateral Esquerda (normalmente mapa)
Formulário fixo: fale com especialista
Conteúdo Wake: Rodapé (normalmente avaliações)
Marcas via GraphQL group 19
Banner final fixo + imagem externa
```

### Header e dados da loja

O header da franquia local não é montado automaticamente a partir de `settings.cidades`. O conteúdo esperado no Wake normalmente contém `.cidade__header`, `.cidade__adress`, `.cidade__info` e `.opening-hours`, conforme `backup_conteudos/franquia_header.html`.

Isso significa que endereço, telefone, WhatsApp e horários do header podem ser independentes dos valores usados nos cards de cidade em `settings.json`.

### WhatsApp

O script inline do componente procura:

```js
document.querySelector(".cidade__info .whatsapp-link")?.href
```

Depois acrescenta uma mensagem baseada nos dois últimos segmentos da URL. O objetivo é gerar uma mensagem como:

```text
[ABCZAP] Olá! Acessei a página da ABC {LOJA} - {CIDADE} e gostaria de mais informações
```

O fallback escrito no código não é confiável: a concatenação com `"?"` ocorre antes do `??`, podendo gerar `undefined?` quando `.cidade__info .whatsapp-link` não existir. O conteúdo `Topo` da franquia precisa, portanto, manter esse link com a classe esperada.

### Formulário “Fale com um especialista”

O markup é fixo no componente e possui:

- nome;
- e-mail;
- WhatsApp;
- estágio da obra: Projeto, Fundação, Alvenaria ou Acabamento;
- aceite opcional de catálogo;
- aceite opcional de visita;
- aceite obrigatório de política/termos.

O botão só é habilitado quando nome, e-mail, telefone, estágio e política estão preenchidos. O submit não navega para outra página: ele monta um objeto e chama `sendSharpSpring(campos, "franquia")`.

## 8. Integrações externas

### 8.1 Wake/Fbits GraphQL

Responsável por:

- resolver o Hotsite da URL;
- fornecer nome e SEO;
- entregar conteúdos por posição;
- entregar banners por posição;
- fornecer as marcas do grupo 19.

Não fornece os dados das lojas neste projeto.

### 8.2 LeadWake

`Assets/JS/sharpspring.js` envia leads por:

```text
POST https://leadwake.br-s1.cloudhub.io/api/lead
```

O corpo enviado pela franquia contém, entre outros:

```json
{
  "agendar_visita": "sim|não",
  "email": "...",
  "estagio_da_obra": "Projeto|Fundação|Alvenaria|Acabamento",
  "nome": "...",
  "nome_loja": "[UF] {uf}, [CIDADE] {city}, [LOJA] {store}",
  "politica_privacidade": "sim",
  "receber_catalogo": "sim|não",
  "telefone": "...",
  "canal": "Site Diretório de Lojas"
}
```

O código exige e-mail válido por regex antes do envio. Em caso de sucesso, limpa o formulário e troca o texto do botão para `ENVIADO!`; em caso de resposta não-sucedida, troca para `ERRO AO ENVIAR`.

### 8.3 WhatsApp e ativos de mídia

Os links/QR Codes e imagens da franquia usam URLs externas de `recursos.abcdaconstrucao.com.br` e links WhatsApp. A disponibilidade desses ativos não é validada pelo build local.

## 9. Horários e status aberto/fechado

O JavaScript usa `new Date()` do navegador e o dia retornado por `getDay()`:

```text
0 domingo, 1 segunda, ..., 6 sábado
```

O formato esperado é exatamente:

```text
HH:MM às HH:MM
```

ou:

```text
Fechado
```

O parser divide o texto por espaço e usa os índices `0` e `2` como abertura/fechamento. Formatos como `08h às 18h`, `08:00-18:00` ou horários com intervalo não são suportados.

Achados comportamentais:

- horários que atravessam a meia-noite não são tratados;
- no minuto exatamente igual ao fechamento, a função ainda pode considerar a loja aberta;
- o bloco legado `opening-hours` tenta consultar o dia seguinte usando `currentDay + 1`; no domingo não existe item com `data-week-day="7"`;
- a página de cidade usa o horário de `settings.json`, enquanto o header da franquia depende do HTML publicado no Wake.

## 10. Estado atual encontrado no cadastro

Foi feita uma leitura do `settings.json` e do `db_lojas.js` sem alterar os arquivos.

### `settings.json`

- 291 cidades cadastradas;
- 342 lojas cadastradas;
- 11 estados;
- nenhuma cidade sem lojas;
- 5 lojas sem telefone;
- 1 loja sem `details_link`;
- nomes de cidade sem duplicidade exata;
- links de loja sem duplicidade.

### `db_lojas.js`

- 11 estados;
- 287 cidades listadas na home do diretório.

### Divergência entre os dois cadastros

Comparando estado + cidade com normalização de acentos, há cidades somente em `settings.json` e cidades somente em `db_lojas.js`.

Somente em `settings.json` aparecem, entre outras:

- Machado;
- Matias Barbosa;
- Passa Quatro;
- São Joaquim de Bicas;
- Vespasiano;
- Artur Nogueira;
- Telêmaco Borba;
- Toledo.

Somente em `db_lojas.js` aparecem, entre outras:

- Brasilândia de Minas;
- São Gonçalo;
- Penápolis;
- Castelo.

Também existem divergências de grafia, como `Gocalves`/`Gonçalves`, `Itauna`/`Itaúna` e `São João Del-Rei`/`São João Del Rei`.

Impacto: a home pode não apontar para cidades existentes em `settings.json`, e pode apontar para cidades que não têm dados correspondentes no renderizador da página de cidade. O cadastro deve ter uma fonte única ou uma validação automatizada.

## 11. Matriz de manutenção

| Necessidade | Alterar em | Observação |
|---|---|---|
| Adicionar/remover cidade da home | `Assets/JS/db_lojas.js` | Também verificar `settings.json` |
| Alterar nome/estado da cidade | `Configs/settings.json` | Deve coincidir com o nome derivado do Hotsite |
| Alterar endereço/telefone/horário do card | `Configs/settings.json` | Campo de endereço é `adress` |
| Alterar link da página da loja | `Configs/settings.json` | Verificar rota e Hotsite no Wake |
| Alterar SEO do diretório/franquia | Wake, SEO do Hotsite | Consumido por `data.hotsite.seo` |
| Alterar editorial do diretório | Wake, conteúdo `Topo` | O restante do texto da cidade está no código |
| Alterar header/mapa/avaliações da franquia | Wake, posições `Topo`, `Centro`, `Lateral Esquerda`, `Rodapé` | Preservar classes usadas pelo JS |
| Alterar banners da franquia | Wake, banners `Topo` e `Mobile Topo` | Desktop e mobile são chamadas separadas |
| Alterar categorias fixas | `Components/custom/diretorio_de_lojas/franquia.html` | Hoje são hardcoded |
| Alterar formulário ou payload | `Components/.../franquia.html` e `Assets/JS/diretorio_de_lojas.js` | Validar LeadWake junto |
| Alterar endpoint/credenciais de lead | `Assets/JS/sharpspring.js` | Tratar como segredo e revisar segurança |
| Alterar layout | `Assets/stylus/pages/diretorio_de_lojas/*.styl` | Compilar o bundle Stylus |

## 12. Riscos e recomendações

### Prioridade alta

1. **Eliminar o cadastro duplicado de cidades.** Preferencialmente gerar `db_lojas.js` a partir de `settings.json` ou fazer a página inicial renderizar a mesma fonte.
2. **Remover segredos do código versionado.** `Configs/settings.json` contém token de acesso e `Assets/JS/sharpspring.js` contém credenciais de cliente no JavaScript público. Rotacionar os valores e mover a autenticação para uma integração segura/server-side.
3. **Corrigir a dependência do nome do Hotsite.** A seleção de franquia deveria usar rota/metadata explícita, não `string.contains "Franquia"`.
4. **Criar validação de consistência.** Validar cidades, slugs, `details_link`, telefone e horários antes de publicar.

### Prioridade média

5. Corrigir o campo `adress` para `address` em um contrato novo, mantendo compatibilidade durante a migração.
6. Parametrizar o domínio dos links gerados para funcionar em local, homologação e produção.
7. Centralizar a fonte de endereço/telefone/horários para evitar divergência entre cards em `settings.json` e conteúdo `Topo` no Wake.
8. Criar fallback/404 quando o Hotsite ou a cidade não for encontrado.
9. Corrigir o fallback de WhatsApp e proteger o formulário contra ausência das classes esperadas no conteúdo administrado.

### Prioridade baixa

10. Migrar o texto SEO fixo da cidade para conteúdo administrável ou para um componente parametrizado.
11. Substituir os oito links de categoria atualmente apontando para `/` por URLs reais.
12. Adicionar testes de renderização para uma cidade com múltiplas lojas, uma loja sem telefone e uma franquia com conteúdo Wake incompleto.

## 13. Checklist operacional de publicação de uma nova loja

1. Criar ou confirmar o Hotsite da cidade/franquia no Wake.
2. Confirmar a convenção do `data.hotsite.name` e, para franquia, incluir `Franquia` no nome conforme o fluxo atual.
3. Publicar SEO do Hotsite.
4. Para franquia, publicar conteúdos nas posições `Topo`, `Centro`, `Lateral Esquerda` e `Rodapé`.
5. Para franquia, publicar banners em `Topo` e `Mobile Topo`.
6. Adicionar a cidade e a loja em `Configs/settings.json`.
7. Adicionar a cidade ao estado correspondente em `Assets/JS/db_lojas.js`.
8. Conferir o `details_link` contra a URL pública.
9. Conferir telefone, sete horários e o formato `HH:MM às HH:MM`/`Fechado`.
10. Testar navegação: índice → cidade → página da loja.
11. Testar WhatsApp, formulário e recebimento do lead no LeadWake.
12. Testar desktop/mobile e verificar conteúdo sem banners ou blocos ausentes.

## 14. Conclusão

O diretório não é alimentado por um único cadastro no Wake. O Wake fornece a camada de Hotsite/editorial/SEO/banners, enquanto o código fornece a navegação de cidades, os dados estruturados de loja, os cards, a regra de horário, a seleção cidade/franquia e o formulário de lead.

O principal ponto arquitetural é a duplicidade entre `settings.json` e `db_lojas.js`. O principal ponto operacional é a dependência de classes HTML e do nome do Hotsite administrados externamente. O principal ponto de segurança é a presença de credenciais em arquivos que podem ser publicados no frontend.

Este documento descreve o comportamento confirmado no repositório. A confirmação final dos nomes dos Hotsites e dos conteúdos atualmente publicados no painel Wake ainda depende de acesso ao ambiente administrativo, pois esses valores não estão versionados aqui.

# Checkout SSR

## Introdução

O **Checkout SSR** no **Storefront** foi desenvolvido para permitir a customização de todas as páginas do sistema, incluindo **carrinho**, **fechamento**, **confirmação**, **minha conta**, **login** e **parceiros** diretamente pelo **Storefront**.

Atualmente, apenas as páginas da loja (como **home**, **hotsites**, **busca**, **página de produto**) podem ser criadas utilizando o **Storefront SSR**. Com a introdução do **Checkout SSR**, todas as demais páginas também poderão ser desenvolvidas utilizando o **Storefront**, ampliando significativamente as possibilidades de personalização.

### Diferença entre Checkout Headless e Checkout SSR

- **Checkout Headless**: Refere-se ao uso das APIs necessárias para realizar todo o fluxo de checkout. No nosso caso, essas APIs estão disponíveis através da **Storefront API**.

- **Checkout SSR**: Permite a utilização do Storefront SSR, em conjunto com templates Scriban, para renderizar páginas como fechamento, login, minha conta, entre outras, diretamente no servidor.

## Novos Tipos de Páginas

### Estrutura Comum

As novas páginas são configuradas em `config/pages.json` com os seguintes campos:

- **`type`**: Identifica o tipo da página.
- **`url`**: URL base da página (customizável).
- **`routes`**: Lista de rotas específicas, com os seguintes atributos:
  - **`name`**: Identificador único da rota.
  - **`url`**: Segmento da URL adicionado à URL base.
  - **`path`**: Caminho do HTML renderizado.
  - **`query`**: Arquivo GraphQL usado para consultas.
  - **`authLevel`** _(opcional)_: Define o nível de autenticação necessário para acessar a rota.
  - **`authFallback`** _(opcional)_: Define a URI para redirecionamento caso o usuário não possua o nível de autenticação necessário. 
  - **`queryStrings`** _(opcional)_: Utilizado para mapear parâmetros de query string para a query da página.

### Exemplo de Configuração por Tipo

#### Tipo de página `checkout`

Este tipo é focado em todas as páginas relacionadas ao fechamento de pedido, como **carrinho**, **fechamento** e **confirmação**.

```json
{
  "type": "checkout",
  "url": "checkout",
  "routes": [
    {
      "name": "home",
      "url": "",
      "path": "checkout/checkout.html",
      "query": "checkout/checkout.graphql"
    },
    {
      "name": "complete",
      "url": "complete",
      "path": "checkout/close.html",
      "query": "checkout/close.graphql",
      "authLevel": "New",
      "authFallback": "login"
    },
    {
      "name": "confirmation",
      "url": "confirmation",
      "path": "checkout/confirmation.html",
      "query": "checkout/confirmation.graphql",
      "queryStrings": [
        {
          "name": "checkoutId",
          "type": "Uuid"
        }
      ]
    }
  ]
}
```

### Tipo de página `login`

Este tipo é destinado a todas as páginas relacionadas ao processo de autenticação do usuário, incluindo **login**, **autenticação**, **recuperação de senha** e **cadastro**.

```jsonc
{
  "type": "login",
  "url": "login",
  "routes": [
    {
      "name": "simple",
      "url": "",
      "path": "login/simple.html",
      "query": "login/simple.graphql"
    },
    {
      "name": "authenticate",
      "url": "authenticate",
      "path": "login/authenticate.html",
      "query": "login/authenticate.graphql"
    }
    // ...
  ]
}
```

### Tipo de página `account`

Este tipo é destinado às páginas da conta do usuário, permitindo que os usuários gerenciem suas informações pessoais, visualizem pedidos, alterem senhas, gerenciem endereços, contas correntes e assinaturas.

```jsonc
{
  "type": "account",
  "url": "account",
  "routes": [
    {
      "name": "orders",
      "url": "",
      "path": "account/orders.html",
      "query": "account/orders.graphql",
      "authLevel": "Authenticated",
      "authFallback": "login/authenticate",
      "queryStrings": [
        {
          "name": "orderId",
          "type": "Long"
        }
      ]
    },
    {
      "name": "data",
      "url": "my-data",
      "path": "account/account.html",
      "query": "account/account.graphql",
      "authLevel": "Simple",
      "authFallback": "login/authenticate"
    }
    // ...
  ]
}
```

### Tipo de página `partner`

Este tipo é destinado às páginas de **Parceiro** do sistema, permitindo a gestão de portfólio e preços, além de outras funcionalidades específicas para parceiros.

```json
{
  "type": "partner",
  "url": "partner",
  "routes": [
    {
      "name": "client",
      "url": "list",
      "path": "partner/list_client.html",
      "query": "partner/list_client.graphql",
      "authLevel": "Simple",
      "authFallback": "login/authenticate"
    },
    {
      "name": "closed",
      "url": "closed",
      "path": "partner/closed.html"
    }
  ]
}
```

## O campo `name` nas rotas

O `name` da rota é utilizado para facilitar a navegação na loja. A estrutura de rotas é mapeada para o campo `store.urls.checkout_pages`, que está disponível no contexto do Scriban.

**Exemplo de Uso:**

```html
<a href="{{store.urls.checkout_pages.account.orders}}">Meus pedidos</a>
```

**O campo `store.urls.checkout_pages` é preenchido com as rotas mapeadas no `pages.json`, então se mapearmos este campo para um json no ambiente local veremos o seguinte:**

```json
{
  "checkout": {
    "home": "https://localhost:5501/checkout",
    "complete": "https://localhost:5501/checkout/complete",
    "confirmation": "https://localhost:5501/checkout/confirmation"
  },
  "login": {
    "simple": "https://localhost:5501/login",
    "authenticate": "https://localhost:5501/login/authenticate",
    "password_recovery": "https://localhost:5501/login/password/recovery",
    "signup": "https://localhost:5501/login/signup",
    "impersonate": "https://localhost:5501/login/impersonate"
  },
  "account": {
    "orders": "https://localhost:5501/account",
    "data": "https://localhost:5501/account/my-data",
    "password": "https://localhost:5501/account/password",
    "addresses": "https://localhost:5501/account/addresses",
    "checking_account": "https://localhost:5501/account/checking_account",
    "subscriptions": "https://localhost:5501/account/subscriptions"
  }
}
```

No ambiente de produção, as URLs refletirão o domínio de produção configurado.

## O campo `authLevel`

O campo **`authLevel`** é utilizado para definir o nível de autenticação necessário para acessar uma rota específica. Ele controla como as rotas são acessadas e redireciona o usuário, caso não atenda aos critérios definidos. Existem três opções disponíveis para o campo **`authLevel`**, que são:

- **`New`**: Indica que o usuário iniciou um cadastro, preenchendo informações básicas como e-mail ou CPF, mas ainda não concluiu o processo de autenticação. Este nível pode ser utilizado para processos de onboarding ou para páginas de finalização de cadastro.
- **`Simple`**: Indica que o login foi realizado respondendo a perguntas simples de validação. Esse nível é utilizado para acessos que não exigem autenticação completa, mas verificam informações básicas do usuário.
- **`Authenticated`**: Indica que o login foi realizado com credenciais completas, como usuário e senha, ou através de um provedor de login social. Este nível é recomendado para acessos que exigem maior segurança ou dados sensíveis.

## O Campo `authFallback`

Quando o usuário não possui o nível de autenticação exigido pela rota, ele será redirecionado para a url definida em **`authFallback`**.

**Exemplo de Redirecionamento:**
Se a rota exige **`AUTHENTICATED`** e o usuário está autenticado apenas no nível **`SIMPLE`**, ele será redirecionado para a URL definida no **`authFallback`**.

```json
{
  "name": "orders",
  "url": "",
  "path": "account/orders.html",
  "authLevel": "Authenticated",
  "authFallback": "login/authenticate"
}
```

Neste exemplo, usuários não autenticados no nível **`AUTHENTICATED`** serão redirecionados para a rota `login/authenticate`.

## Novo SDK - SDK FULL

Um novo SDK foi desenvolvido para utilizar 100% do _storefront-api_ em suas operações.

O SDK estará disponível na URL:  
[https://static.fbits.net/storefront-sdk/latest/storefront-sdk-full.min.js](https://static.fbits.net/storefront-sdk/latest/storefront-sdk-full.min.js)

A documentação gerada pelo Typedoc para o SDK FULL pode ser acessada em:  
[https://static.fbits.net/storefront-sdk/latest/docs/sdk-full](https://static.fbits.net/storefront-sdk/latest/docs/sdk-full)

## Componentes Fechados

Os componentes fechados são trechos considerados críticos que permanecem sob controle da Wake. Esses trechos podem incluir componentes, snippets, queries e scripts JavaScript, e são mantidos em um repositório dedicado chamado `wake-components`. Todos os usuários com acesso ao Git têm permissão para acessar esse repositório.

Por padrão, os componentes fechados utilizam o prefixo `wake_` para facilitar a identificação.

O repositório `wake-components` é versionado por meio de branches. Para selecionar a versão específica a ser utilizada, é necessário definir a configuração no arquivo `settings.json` da seguinte forma:

```json
"wake_components_version": "v1"
```

Caso nenhuma versão seja especificada no `settings.json`, será utilizada automaticamente a maior versão estável disponível (sem o sufixo `-beta`).

Os componentes fechados garantem que manutenções, melhorias e correções de bugs sejam propagadas de forma simplificada para o template das lojas.

---

### Estilização

Os estilos CSS dos componentes fechados podem ser personalizados diretamente no repositório da loja, utilizando Tailwind CSS.

No template padrão do checkout SSR, alguns arquivos CSS são adicionados por padrão, como: `input_checkout.css`, `input_account.css`, `input_login.css` e `input_partner.css`. Esses arquivos utilizam a diretiva `@apply` para aplicar customizações de Tailwind em classes utilizadas nos componentes fechados.

Exemplo de estilização:

```css
.wake-checkout-header {
  @apply flex w-full border-b pb-4 mb-6;
}
```

Essa classe é aplicada no componente fechado `wake_checkout_header` da seguinte forma:

```html
<div class="wake-checkout-header">
  <div>
    <a href="/">
      <img
        src="{{store.urls.static_img}}logo.svg?theme={{store.theme}}&v={{store.last_modified}}"
        alt="logo"
        width="128"
        height="13"
      />
    </a>
    <div class="security">
      <img
        src="{{store.urls.static_img}}checkout/secure.svg?theme={{store.theme}}&v={{store.last_modified}}"
        alt="ícone de segurança"
        width="20"
        height="20"
      />
      AMBIENTE 100% SEGURO
    </div>
  </div>
</div>
```

Para continuar personalizando componentes fechados com Tailwind, deve-se executar o comando para compilar o CSS, mapeando o arquivo de entrada para o arquivo de saída:

```bash
tailwindcss.exe -i Assets/css/input_checkout.css -o Assets/css/output_checkout.css --watch
```

### Estilização sem Tailwind

Caso você não queira utilizar o Tailwind para estilizar as páginas, é possível editar diretamente o arquivo CSS de saída (`output_checkout.css`). Isso elimina a necessidade de compilar o arquivo de entrada (`input_checkout.css`) com o Tailwind, permitindo ajustes diretamente no código final de estilo. 

---

### Customização

A customização dos componentes fechados pode ser feita de duas formas principais:

#### 1. **Substituição Completa**  
Na substituição completa, você opta por não utilizar o componente Wake em sua página, criando uma implementação totalmente nova.
Por exemplo, considere a hierarquia fictícia de componentes de checkout:
```
wake_checkout (componente pai)
├── wake_checkout_header
├── wake_checkout_steps
│   ├── wake_checkout_cart
│   ├── wake_checkout_address
│   └── wake_checkout_payment
└── wake_checkout_footer
```

Ao optar pela substituição completa:

- Você não utiliza o `wake_checkout`
- Precisa reimplementar todos os subcomponentes
- Tem total controle sobre a estrutura e funcionamento
- Perde todas as atualizações automáticas dos componentes


Exemplo de Substituição
```html
<!-- Ao invés de usar: {{ wake_checkout }} -->
<div class="custom-checkout">
    {{ custom_checkout_header }}
    <div class="custom-steps">
        {{ custom_checkout_cart }}
        {{ custom_checkout_address }}
        {{ custom_checkout_payment }}
    </div>
    {{ custom_checkout_footer }}
</div>
```

#### 2. **Sobrescrita de Componentes:**  
Na sobrescrita de componentes, você mantém o componente pai Wake e customiza apenas componentes específicos dentro da hierarquia.

Usando o mesmo exemplo fictício de checkout:
```
wake_checkout (mantido)
├── wake_checkout_header (sobrescrito)
├── wake_checkout_steps (mantido)
│   ├── wake_checkout_cart
│   ├── wake_checkout_address (sobrescrito)
│   └── wake_checkout_payment
└── wake_checkout_footer
```

Neste caso:
- O `wake_checkout` continua gerenciando o fluxo geral
- Você sobrescreve apenas os componentes que precisam de customização
- Mantém as atualizações automáticas dos componentes não sobrescritos
- Preserva a estrutura e integração original

---

#### Processo de Sobrescrita

##### Identificando Componentes Disponíveis

O repositório `wake-components` contém todos os arquivos necessários para o funcionamento dos componentes Wake, incluindo:
- Arquivo `Configs/components.json` com a lista completa de componentes
- Arquivos HTML dos componentes
- Queries GraphQL
- Scripts javascript
- Snippets

Por exemplo, no `components.json` você encontrará a definição dos componentes:

```json
[
  {
    "name": "wake_checkout_header",
    "path": "checkout/wake_checkout_header.html",
    "params": [],
    "availableInAllPages": true
  }
]
```

##### Implementando a Sobrescrita

Para customizar um componente Wake, siga estes passos:

1. Crie seu arquivo HTML customizado (ex: `checkout/custom_wake_checkout_header.html`)
2. No arquivo `Configs/components.json` da sua loja, mantenha o mesmo `name` do componente original
3. Atualize o `path` para apontar para seu arquivo customizado:

```json:Configs/components.json
[
  {
    "name": "wake_checkout_header",     // Nome original mantido
    "path": "checkout/custom_wake_checkout_header.html",  // Novo caminho
    "params": [],
    "availableInAllPages": true
  }
]
```

O storefront automaticamente utilizará sua versão customizada em vez do componente Wake original, mantendo todos os outros parâmetros e configurações inalterados.

#### Ponto de Atenção

⚠️ **Atenção**: A customização de componentes Wake deve ser considerada apenas em casos excepcionais, pois:

- Perde-se o suporte automático a atualizações
- Não se beneficia de correções de bugs futuras
- Requer manutenção manual das funcionalidades
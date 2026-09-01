# Estudo técnico — Disparo do popup Primeira Compra

**Projeto:** ABC da Construção / Wake Storefront (Fbits)

**Data da análise:** 2026-09-01

**Escopo:** entender o que acontece quando o usuário se cadastra no popup de primeira compra, qual o papel de `sdkClient.newsletter.create`, qual o papel do `sendSharpSpring`, e onde o e-mail disparado pode estar definido no repositório.

## 1. Resumo executivo

O fluxo do popup de primeira compra tem duas integrações diferentes:

1. `sdkClient.newsletter.create(input)`
2. `sendSharpSpring(campos, "primeira-compra")`

Essas duas chamadas não parecem ter a mesma responsabilidade.

- `sdkClient.newsletter.create` é a chamada principal do cadastro no ecossistema Wake/Fbits.
- `sendSharpSpring(..., "primeira-compra")` é uma integração paralela de marketing/CRM para envio de lead ao endpoint `leadwake`.

Pelo comportamento do popup, o e-mail com o cupom provavelmente depende do sucesso de `sdkClient.newsletter.create`, não do `sendSharpSpring`.

## 2. Onde o fluxo acontece

O popup está definido em:

- `Components/old_newsletter_popup.html`

No submit, o componente monta este payload:

```js
const input = {
  name: fullNameValue,
  email: emailValue
};
```

Em seguida executa:

```js
const response = await sdkClient.newsletter.create(input);
```

Se houver sucesso, o front exibe a mensagem:

```text
Seu cupom chegará em instantes no e-mail {email}. Confira também a caixa de spam e promoções.
```

Depois disso, o código também chama:

```js
sendSharpSpring({
  nome: fullNameValue,
  email: emailValue,
  telefone: phoneValue
}, "primeira-compra");
```

## 3. Leitura funcional do fluxo

O fluxo observado hoje é este:

```text
Usuário preenche popup
  ->
Front valida nome, sobrenome e e-mail
  ->
Front chama sdkClient.newsletter.create({ name, email })
  ->
Se sucesso:
  - grava estado local de cadastro concluído
  - mostra feedback visual de sucesso
  - informa que o cupom chegará por e-mail
  - envia lead para SharpSpring via sendSharpSpring(..., "primeira-compra")
```

## 4. O que é o sdkClient.newsletter.create

No repositório, `sdkClient.newsletter.create` não está implementado manualmente como função local. Ele é consumido como parte de um client global do runtime:

```js
let sdkClient = typeof client !== 'undefined' ? client : window.client;
```

Isso sugere que:

- a implementação real vem da plataforma/storefront runtime;
- o envio efetivo do cadastro e o eventual disparo de e-mail acontecem fora deste repositório;
- o front apenas consome essa API pronta.

Em outras palavras: o repositório mostra **quem chama** a operação, mas não mostra a implementação interna do `newsletter.create`.

## 5. O que faz o sendSharpSpring

O `sendSharpSpring` está implementado em:

- `Assets/JS/sharpspring.js`

Essa função:

- recebe um objeto `campos`;
- define `campos.canal` conforme o componente;
- para `"primeira-compra"`, usa:

```js
campos.canal = "Site Primeira Compra";
```

- envia os dados por `fetch` para:

```text
https://leadwake.br-s1.cloudhub.io/api/lead
```

com `client_id`, `client_secret` e payload JSON.

Portanto, o `sendSharpSpring` funciona como uma integração de captura de lead/marketing. Pelo que aparece no código, ele:

- não controla a mensagem visual principal do popup;
- não é tratado como etapa obrigatória do cadastro;
- é executado depois do sucesso de `newsletter.create`;
- parece ser complementar, não o mecanismo primário do disparo do e-mail/cupom.

## 6. Onde o e-mail pode estar no repositório

Existe um template fortemente relacionado a newsletter em:

- `Emails/news_thank.html`

No arquivo:

- `Configs/emails.json`

ele aparece assim:

```json
{
  "type": "AgradecimentoNews",
  "path": "news_thank.html",
  "production": false,
  "active": true
}
```

Isso indica que o repositório possui um template de agradecimento/newsletter, mas há um ponto importante:

- `production: false` sugere que esse template não está ativado para disparo em produção via Storefront neste momento.

Também existem estes templates:

- `Emails/welcome.html`
- `Emails/register_confirmation.html`

Mas, pela nomenclatura e pelo conteúdo, eles parecem mais ligados a boas-vindas/confirmação de cadastro da conta, não necessariamente ao cupom da primeira compra.

## 7. Conclusão mais provável

A leitura mais provável hoje é:

- o popup de primeira compra usa `sdkClient.newsletter.create` como fluxo principal de cadastro;
- esse método provavelmente dispara algum processamento no backend/runtime Wake;
- o e-mail do cupom pode estar associado a esse fluxo de newsletter no backend;
- o `sendSharpSpring` serve para registrar o lead em marketing/CRM com o canal `Site Primeira Compra`;
- o template `Emails/news_thank.html` é o candidato mais próximo dentro do repositório, mas o arquivo sozinho não prova que ele é o template atualmente usado nesse popup.

## 8. O que está comprovado e o que ainda não está

### Comprovado no repositório

- O popup chama `sdkClient.newsletter.create({ name, email })`.
- O popup informa ao usuário que o cupom chegará por e-mail após sucesso.
- O popup também chama `sendSharpSpring(..., "primeira-compra")`.
- Existe um template `Emails/news_thank.html`.
- O tipo `AgradecimentoNews` está com `production: false` em `Configs/emails.json`.

### Ainda não comprovado só pelo repositório

- Se `sdkClient.newsletter.create` dispara exatamente o template `AgradecimentoNews`.
- Se o e-mail do cupom é enviado pela plataforma Wake/Fbits, por automação externa ou por outra integração.
- Se existe regra operacional fora do Storefront conectando o cadastro de newsletter ao envio do cupom.

## 9. Próxima validação recomendada

Para fechar essa dúvida com segurança, a próxima verificação ideal é uma destas:

1. validar na plataforma Wake/Fbits qual evento é acionado por `newsletter.create`;
2. testar um cadastro real em ambiente de homologação e observar qual template/e-mail chega;
3. verificar no painel/automação se o fluxo de newsletter da primeira compra está ligado ao tipo `AgradecimentoNews` ou a outra régua externa.

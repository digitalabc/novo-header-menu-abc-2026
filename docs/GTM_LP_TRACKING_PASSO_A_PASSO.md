# Integração GTM – Tracking de LPs (Passo a Passo)

Este guia explica como configurar o Google Tag Manager para receber os eventos das LPs e enviá-los ao GA4.

---

## Pré-requisitos

- Acesso ao container do GTM do site
- ID da propriedade GA4 (formato `G-XXXXXXXXXX`)
- Eventos `lp_view`, `lp_product_click`, `lp_add_to_cart` e `lp_whatsapp_click` já sendo disparados no site (via `lp_tracking.js`)

---

## Parte 1: Variáveis no GTM

### 1.1 Variável – Nome da LP (`lp_name`)

1. No GTM, vá em **Variáveis** (menu lateral esquerdo)
2. Clique em **Nova**
3. Nome: `DLV - lp_name`
4. Tipo: **Variável de Camada de Dados**
5. Nome da variável de camada de dados: `lp_name`
6. Salvar

### 1.2 Variável – Path da LP (`lp_path`)

1. **Variáveis** → **Nova**
2. Nome: `DLV - lp_path`
3. Tipo: **Variável de Camada de Dados**
4. Nome da variável de camada de Dados: `lp_path`
5. Salvar

### 1.3 Variável – Dia da oferta (`offer_day_key`)

1. **Variáveis** → **Nova**
2. Nome: `DLV - offer_day_key`
3. Tipo: **Variável de Camada de Dados**
4. Nome da variável de camada de dados: `offer_day_key`
5. Salvar

### 1.4 Variável – Tipo de dispositivo (`device_type`)

1. **Variáveis** → **Nova**
2. Nome: `DLV - device_type`
3. Tipo: **Variável de Camada de Dados**
4. Nome da variável de camada de dados: `device_type`
5. Salvar

### 1.5 Variável – ID do produto (`product_id`)

1. **Variáveis** → **Nova**
2. Nome: `DLV - product_id`
3. Tipo: **Variável de Camada de Dados**
4. Nome da variável de camada de dados: `product_id`
5. Salvar

### 1.6 Variável – Nome do produto (`product_name`)

1. **Variáveis** → **Nova**
2. Nome: `DLV - product_name`
3. Tipo: **Variável de Camada de Dados**
4. Nome da variável de camada de dados: `product_name`
5. Salvar

### 1.7 Variável – Posição do produto (`product_position`)

1. **Variáveis** → **Nova**
2. Nome: `DLV - product_position`
3. Tipo: **Variável de Camada de Dados**
4. Nome da variável de camada de dados: `product_position`
5. Salvar

### 1.8 Variável – Nome da lista (`list_name`)

1. **Variáveis** → **Nova**
2. Nome: `DLV - list_name`
3. Tipo: **Variável de Camada de Dados**
4. Nome da variável de camada de dados: `list_name`
5. Salvar

### 1.9 Variável – Status do estoque (`stock_status`) – opcional

1. **Variáveis** → **Nova**
2. Nome: `DLV - stock_status`
3. Tipo: **Variável de Camada de Dados**
4. Nome da variável de camada de dados: `stock_status`
5. Salvar

### 1.10 Variável – Desconto (`discount_percentage`) – opcional

1. **Variáveis** → **Nova**
2. Nome: `DLV - discount_percentage`
3. Tipo: **Variável de Camada de Dados**
4. Nome da variável de camada de dados: `discount_percentage`
5. Salvar

---

## Parte 2: Triggers (Gatilhos)

### 2.1 Trigger – lp_view

1. Vá em **Gatilhos** (menu lateral)
2. Clique em **Novo**
3. Nome: `LP - lp_view`
4. Tipo: **Evento personalizado**
5. Nome do evento: `lp_view` (exatamente assim)
6. Este gatilho dispara em: **Alguns eventos personalizados**
7. Condição: `DLV - lp_name` **contém** (ou **não é indefinido**) – pode deixar vazio se quiser disparar em qualquer `lp_view`
8. Salvar

### 2.2 Trigger – lp_product_click

1. **Gatilhos** → **Novo**
2. Nome: `LP - lp_product_click`
3. Tipo: **Evento personalizado**
4. Nome do evento: `lp_product_click`
5. Salvar

### 2.3 Trigger – lp_add_to_cart

1. **Gatilhos** → **Novo**
2. Nome: `LP - lp_add_to_cart`
3. Tipo: **Evento personalizado**
4. Nome do evento: `lp_add_to_cart`
5. Salvar

### 2.4 Trigger – lp_whatsapp_click

1. **Gatilhos** → **Novo**
2. Nome: `LP - lp_whatsapp_click`
3. Tipo: **Evento personalizado**
4. Nome do evento: `lp_whatsapp_click`
5. Salvar

---

## Parte 3: Tags GA4 (Eventos)

### 3.1 Tag – lp_view para GA4

1. Vá em **Tags** → **Nova**
2. Nome: `GA4 - LP View`
3. Tipo: **Google Analytics: evento GA4**
4. ID de medição: selecione sua variável de Configuração do GA4 (ou digite o ID, ex.: `G-XXXXXXXXXX`)
5. Nome do evento: `lp_view`
6. Parâmetros do evento (clique em **Adicionar linha** para cada um):

| Nome do parâmetro | Valor |
|-------------------|-------|
| `lp_name` | `{{DLV - lp_name}}` |
| `lp_path` | `{{DLV - lp_path}}` |
| `offer_day_key` | `{{DLV - offer_day_key}}` |
| `offer_cycle` | `daily_refresh_2359` |
| `device_type` | `{{DLV - device_type}}` |

7. Acionamento: selecione o gatilho **LP - lp_view**
8. Salvar

### 3.2 Tag – lp_product_click para GA4

1. **Tags** → **Nova**
2. Nome: `GA4 - LP Product Click`
3. Tipo: **Google Analytics: evento GA4**
4. ID de medição: (sua variável ou ID)
5. Nome do evento: `lp_product_click`
6. Parâmetros do evento:

| Nome do parâmetro | Valor |
|-------------------|-------|
| `lp_name` | `{{DLV - lp_name}}` |
| `lp_path` | `{{DLV - lp_path}}` |
| `offer_day_key` | `{{DLV - offer_day_key}}` |
| `offer_cycle` | `daily_refresh_2359` |
| `device_type` | `{{DLV - device_type}}` |
| `product_id` | `{{DLV - product_id}}` |
| `product_name` | `{{DLV - product_name}}` |
| `product_position` | `{{DLV - product_position}}` |
| `list_name` | `{{DLV - list_name}}` |
| `stock_status` | `{{DLV - stock_status}}` |
| `discount_percentage` | `{{DLV - discount_percentage}}` |

7. Acionamento: **LP - lp_product_click**
8. Salvar

### 3.3 Tag – lp_add_to_cart para GA4

1. **Tags** → **Nova**
2. Nome: `GA4 - LP Add to Cart`
3. Tipo: **Google Analytics: evento GA4**
4. ID de medição: (sua variável ou ID)
5. Nome do evento: `lp_add_to_cart`
6. Parâmetros do evento: (mesmos de lp_product_click)
7. Acionamento: **LP - lp_add_to_cart**
8. Salvar

### 3.4 Tag – lp_whatsapp_click para GA4

1. **Tags** → **Nova**
2. Nome: `GA4 - LP WhatsApp Click`
3. Tipo: **Google Analytics: evento GA4**
4. ID de medição: (sua variável ou ID)
5. Nome do evento: `lp_whatsapp_click`
6. Parâmetros do evento:

| Nome do parâmetro | Valor |
|-------------------|-------|
| `lp_name` | `{{DLV - lp_name}}` |
| `lp_path` | `{{DLV - lp_path}}` |
| `offer_day_key` | `{{DLV - offer_day_key}}` |
| `offer_cycle` | `daily_refresh_2359` |
| `device_type` | `{{DLV - device_type}}` |

7. Acionamento: **LP - lp_whatsapp_click**
8. Salvar

---

## Parte 4: Configuração do GA4 (se ainda não existir)

### 4.1 Tag de Configuração do GA4

1. **Tags** → **Nova**
2. Nome: `GA4 - Configuração`
3. Tipo: **Google Analytics: Configuração do GA4**
4. ID de medição: `G-XXXXXXXXXX` (seu ID)
5. Acionamento: **All Pages** (ou o gatilho de página que você já usa)
6. Salvar

Se você já tiver uma tag de configuração, use a mesma e referencie-a nas tags de evento (campo “Configuração do GA4”).

---

## Parte 5: Validação

### 5.1 Modo de visualização (Preview)

1. No GTM, clique em **Visualizar**
2. Informe a URL do site (ex.: `https://www.abcdaconstrucao.com.br/semana-do-consumidor`)
3. Clique em **Conectar**
4. Uma nova aba abrirá o site com o painel do GTM no rodapé

### 5.2 Testar eventos

1. Na aba do site, navegue até uma LP (ex.: `/semana-do-consumidor`)
2. No painel do GTM, verifique se o evento **lp_view** apareceu
3. Clique em um produto na vitrine → deve aparecer **lp_product_click**
4. Clique em “Comprar” (quando for add to cart) → deve aparecer **lp_add_to_cart**
5. Clique em “Falar com um especialista” → deve aparecer **lp_whatsapp_click**

### 5.3 Conferir no GA4 DebugView

1. No GA4, vá em **Configurar** → **DebugView**
2. Com o modo Debug ativo (ou extensão do Chrome), faça as mesmas ações
3. Confira se os eventos `lp_view`, `lp_product_click`, `lp_add_to_cart` e `lp_whatsapp_click` chegam com os parâmetros corretos

---

## Parte 6: Publicar

1. No GTM, clique em **Enviar**
2. Versão: dê um nome (ex.: “Tracking LPs – março 2026”)
3. Descrição: opcional
4. Clique em **Publicar**

---

## Resumo – Checklist

- [ ] 8 variáveis de camada de dados criadas
- [ ] 4 gatilhos de evento personalizado criados
- [ ] 4 tags GA4 de evento criadas (ou 5 com a configuração)
- [ ] Teste no Preview
- [ ] Validação no GA4 DebugView
- [ ] Publicação da versão

---

## Adicionando novas LPs

Quando criar uma nova LP:

1. Edite o arquivo `Assets/JS/lp_tracking.js`
2. Adicione a entrada no objeto `LP_CONFIG`:

```javascript
const LP_CONFIG = {
  "/semana-do-consumidor": { name: "Semana do Consumidor" },
  "/semana-do-cliente": { name: "Semana do Cliente" },
  "/chance-unica": { name: "Chance Única" },
  "/lancamentos-2026": { name: "Lançamentos 2026" },
  "/nova-lp": { name: "Nome da Nova LP" },
};
```

3. Inclua o script `lp_tracking` no HTML da nova LP (no array de paths do asset)
4. Não é necessário alterar nada no GTM; os mesmos eventos e parâmetros funcionarão para a nova LP

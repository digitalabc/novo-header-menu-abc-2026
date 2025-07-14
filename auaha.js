window.addEventListener("load", validaRetireEmLoja, false);
window.addEventListener("load", createMutation, false);

/**
 * Categorias onde deve ser exibido o retire em loja
 */

const categoriasRetireEmLoja = [
        "AQUECEDOR DE PASSAGEM",
        "AQUECEDOR GAS",
        "AQUECEDORES",
        "ACESSÓRIOS/COBERTURA",
        "ACESSORIOS/ELÉT/SOL/GAS",
        "ACESSORIOS/ELÉT/SOL/GAS",
        "ALICATE NIVELAMENTO",
        "BASCULANTE DE AÇO",
        "BASCULANTE DE ALUMINIO",
        "BASCULANTES",
        "BOMBAS",
        "COOKTOPS",
        "CUBAS, PIAS E TANQUES",
        "DUCHAS ELETRICAS",
        "DUCHAS ELETRICAS",
        "ESMALTE PORTAS E JANELAS",
        "ESPELHEIRA COM ILUMINAÇÃO",
        "ESPELHO COM ILUMINAÇÃO",
        "ESQUADRIAS",
        "ESQUADRIAS",
        "ESPACADOR",
        "FERRAMENTAS MANUAIS",
        "FURADEIRA",
        "FURADEIRA / PARAFUSADEIRA",
        "GABARITO ANGULAR",
        "GABINETE BANCADA COM CUBA",
        "GRES",
        "ILUMINAÇÃO",
        "INVERSORES",
        "JANELA DE AÇO",
        "JANELA DE ALUMINIO",
        "JANELAS",
        "JANELAS",
        "MEDIDOR CONTORNO",
        "METAIS SANITÁRIOS",
        "METAIS SANITÁRIOS",
        "MISTURADOR ELÉTRICO",
        "NIVELADOR CLIPE",
        "NIVELADOR CUNHA",
        "OUTROS",
        "PASTILHA ESMALTADA",
        "PINTURA",
        "RODEL CORTADOR CERAMICO",
        "SERRAS",
        "TINTAS",
        "TRITURADOR",
        "UTILIDADES DOMÉSTICAS",
        "VENTOSA",
        "VERNIZ PORTA/JANELA/PARED"
];

const listaRetireEmLoja = categoriasRetireEmLoja.map(categoria => categoria.toLowerCase());

/**
 * Função para validar se o retire em loja pode existir
 */
function validaRetireEmLoja() {
  if (Fbits.Carrinho.Produtos) {
    let produtoSKU = [];
    let produtos = {};
    let pesoTotal = 0;
    let retireEmLoja = false;
    let validCart = false;
    let freteCards = document.querySelectorAll("[data-frete-item]");

    Fbits.Carrinho.Produtos.forEach(({ Quantidade, SKU }) => {
      produtoSKU.push(SKU);
      produtos[SKU] = Quantidade;
    });

    let settings = {
      "async": true,
      "crossDomain": true,
      "url": "https://produtos.abcdaconstrucao.com.br/api/v1/produtos/pesos/referencias/" + produtoSKU.join(','),
      "method": "GET",
    };

    $.ajax(settings).done(function (response, status) {
      response.forEach(({ referencia, peso, departamento, categoria }) => {
        retireEmLoja = listaRetireEmLoja.includes(categoria.toLowerCase()) || listaRetireEmLoja.includes(departamento.toLowerCase())
        pesoTotal += (produtos[referencia] * peso);

        if (retireEmLoja && pesoTotal <= 50 && produtoSKU.length <= 30) {
          validCart = true;
        } else {
          validCart = false;
        };
      });

      if (validCart) {
        freteCards.forEach(card => {
          if (card.dataset.freteItemTipo == "Retirada") {
            card.style.display = "block"
          };
        })
      } else {
        freteCards.forEach(card => {
          if (card.dataset.freteItemTipo == "Retirada") {
            card.style.display = null
          };
        })
      }
    })
  }
}

/**
 * Observer criado para observar alterações no campo de frete, gerando a re-validação do retire em loja
 */
function createMutation() {
  const mutationObserver = new MutationObserver(entries => {
    validaRetireEmLoja();
  });

  let options = { subtree: true, childList: true };
  let target = document.querySelector(".fbits-envio-container");

  mutationObserver.observe(target, options);
}

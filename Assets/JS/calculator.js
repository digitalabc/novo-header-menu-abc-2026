var precoM2 = ConvertMoney('#componentePrecoCalculado span:nth-child(1)');
var precoProduto = ConvertMoney('.fbits-preco .precoPor');
var m2PorCaixa = precoM2 / precoProduto;
m2PorCaixa = m2PorCaixa.toFixed(2);

function calcAtualizar() {
  var quant = parseInt(document.querySelector('#amountBoxes').textContent.split(' ')[0]);
  var m2total = (m2PorCaixa * quant).toFixed(2).replace('.', ',');
  $('#calculadoraPersonalizada .quant-custom').val(`${(quant == 1 ? '1caixa' : quant + 'caixas')} = ${m2total} m²`);
  $('#item-quantidade-2').val(String(quant));
  $(".modal .close").trigger("click")
}
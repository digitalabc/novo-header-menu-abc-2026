const _cabecalho = document.querySelector(".navbar");
const _couponText = document.getElementById("product-coupon").value;

let div_tmp = document.createElement("div");
div_tmp.setAttribute(
  "style",
  "text-align: center; background-color: #e30613; padding: 5px 10px;"
);
let p_tmp = document.createElement("p");
p_tmp.setAttribute("style", "color: #fff;");

div_tmp.append(p_tmp);

p_tmp.innerText = `Você ganhou 30% Off! Cupom: ${_couponText}`;
_cabecalho.append(div_tmp);
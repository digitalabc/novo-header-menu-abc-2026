const copia = async (element, code) => {
  try {
    await navigator.clipboard.writeText(code);
    let tooltip = document.createElement("span");
    tooltip.innerText = "Copiado!";
    tooltip.className = "tooltip";
    element.appendChild(tooltip);

    setTimeout(() => {
      tooltip.remove();
    }, 2000);
  } catch (error) {
    console.error("Erro ao copiar:", error);
  }
};

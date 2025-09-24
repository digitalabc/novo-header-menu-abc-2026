/**
 * Função para disparar o evento select_item quando um produto é clicado em uma lista
 * @param {string} productId - ID do produto
 * @param {string} productName - Nome do produto
 * @param {number} price - Preço do produto
 * @param {string} brand - Marca do produto
 * @param {string} category - Categoria do produto
 * @param {number} index - Posição do produto na lista
 * @param {string} listName - Nome da lista (ex: "Produtos relacionados", "Busca", etc)
 */
function spotProductClick(productId, productName, price, brand, category, index, listName) {
    // Dispara o evento productSelected
    window.dispatchEvent(new CustomEvent("productSelected", {
        detail: {
            product: {
                productId: productId,
                name: productName,
                price: price,
                brand: brand,
                category: category
            },
            index: index,
            listName: listName || "Product List"
        }
    }));
}

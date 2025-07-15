window.addEventListener("load", paginationSetup, false);

/**
 * Setups setting the selected page based on the query string
 */
function paginationSetup() {
    const paginationQueryStringValue = queryStringParams.get("pagina");
    if (paginationQueryStringValue)
        document.getElementById(
            "pagination_" + paginationQueryStringValue
        ).className += " active";
    else document.getElementById("pagination_1").className += " active";
}

/**
 * Selects a page from the currently available
 * @param {string} page - Selected page from the list
 */
function selectPage(page) {
    const pageSize = document.getElementById("def_page_size").value;

    queryStringParams.set("pagina", page);
    queryStringParams.set("tamanho", pageSize);

    window.location.search = queryStringParams.toString();
}

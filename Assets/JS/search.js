window.addEventListener("load", searchLoad, false);

/**
 * Page load function.
 */
function searchLoad(){
    const button = document.getElementById("show-more-button");
    if (button){
        button.addEventListener("click", showMore);
    }
}

/**
 * Gets filters values.
*/
function getFilters(){
    const filters = queryStringParams.getAll("filtro");

    if (filters){
        let filtersList = [];

        for (let i = 0; i < filters.length; i++) {
            const item = filters[i];
            let itemSplited = item.split("__");

            if (itemSplited.length < 2){
                itemSplited = item.split(":");
            }

            let obj = new Object();
            obj.field = itemSplited[0];
            let values = [];
            values.push(itemSplited[1]);
            obj.values = values;
            filtersList.push(obj);
        }

        return filtersList;
    }

    return null;
}

/**
 * Gets price filter values.
*/
function getPriceFilter(){
    const priceFilter = queryStringParams.get("precoPor");
    let minPrice = null;
    let maxPrice = null;

    if (priceFilter){
        var splitedPrice = priceFilter.replace().split(";");
        
        minPrice = parseFloat(splitedPrice[0]);
        maxPrice = parseFloat(splitedPrice[1]);
    }

    return { minPrice, maxPrice };
}

/**
 * Searches for sort key, sort direction, page size, and filters information, and renders new products on the page.
*/
async function showMore() {        
    let divButton = document.getElementById("div-button-show-more");
    divButton.remove();

    const endCursorCol = document.getElementsByClassName("end-cursor"); 
    const endCursor = endCursorCol[endCursorCol.length - 1].value;
    const term = queryStringParams.get("busca");
    const sort = queryStringParams.get("ordenacao");
    let pageSize = queryStringParams.get("tamanho");

    let sortKey = "NAME";
    let sortDirection = "ASC";

    if (sort){
        sortKey = sort.split(':')[0];
        sortDirection = sort.split(':')[1];
    }

    if (pageSize){
        pageSize = parseInt(pageSize, 10);
    }
    else{
        const defPageSize = document.getElementById("def_page_size");
        if (defPageSize) pageSize = Number(defPageSize.value);
    }

    const { minPrice, maxPrice } = getPriceFilter();

    const obj = {
        searchQuery: term,
        partnerAccessToken: null,
        resultSize: pageSize,
        after: endCursor,
        sortKey: sortKey, 
        sortDirection: sortDirection,
        filters: getFilters(),
        minimumPrice: parseFloat(minPrice),
        maximumPrice: parseFloat(maxPrice),
        pageType: ["ALL", "SEARCH"]
    };

    const result = await client.snippet.render("cursor_pagination.html", "search_with_cursor.graphql", obj);

    document.getElementById("infinity-scroll-content-div").innerHTML += result;
        
    const newButton = document.getElementById("show-more-button");
    if (newButton){
        newButton.addEventListener("click", showMore);
    }
}
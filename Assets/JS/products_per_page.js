window.addEventListener("load", pageSizeSetCurrent, false);

/**
 * Internally identifies the current page size based on the URL.
*/
function pageSizeSetCurrent() {
	const pageSizeQueryStringValue = queryStringParams.get("tamanho")
	if (pageSizeQueryStringValue) {
		const pageSize = document.getElementById("page_size");
		let exists = false;

		for (i = 0; i < pageSize.length; i++){
			if (pageSize.options[i].value.toString() == pageSizeQueryStringValue.toString()){
				exists = true;
			}
		}

		if (exists){
			pageSize.value = pageSizeQueryStringValue;
		}
	}
}

/**
 * Applies the quantity of products on the page when changed.
 * @param {string} size - Quantity of products.
*/
function setPageSize(size) {
	queryStringParams.set("tamanho", size);
	queryStringParams.delete("pagina");
	window.location.search = queryStringParams.toString();
}

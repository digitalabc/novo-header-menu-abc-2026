window.addEventListener("load", sortSetCurrent, false);

/**
 * Internally identifies the current sort type based on the URL.
*/
function sortSetCurrent() {
	const sortQueryStringValue = queryStringParams.get("ordenacao")
	if (sortQueryStringValue) {
		document.getElementById("sort_options").value = sortQueryStringValue;
	}
}

/**
 * Applies the page sorting when changed.
 * @param {string} sortSetting - Sort type.
*/
function sortResult(sortSetting) {
	queryStringParams.set("ordenacao", sortSetting);
	window.location.search = queryStringParams.toString();
}
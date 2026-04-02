window.addEventListener("load", filterSetup, false);
let refreshTimeout = null;

/**
 * Setups the filter functionality
 */
function filterSetup() {
    const filterQueryStringValue = queryStringParams.getAll("filtro");
    if (filterQueryStringValue.length > 0) {
        filterQueryStringValue.forEach((element) => {
            //Double quote in js workaround
            const escapedString = element.replace("\"", "\\\"");

            const container = document.querySelector(
                'input[value="' + escapedString + '"]'
            );
            if (!container) return;

            if (container.type == "radio") {
                const div = document.getElementById(container.id);
                if (div) div.classList.add("ring-2");
            } else container.checked = true;
        });
    }

    setupPriceFilterControls();

    const priceFilterQueryStringValue = queryStringParams.getAll("precoPor");
    if (priceFilterQueryStringValue.length > 0) {
        priceFilterQueryStringValue.forEach((price) => {
            const minPriceFilter = document.getElementById("minimum-price-filter");
            const maxPriceFilter = document.getElementById("maximum-price-filter");
            const minPriceSlider = document.getElementById("price-slider-min");
            const maxPriceSlider = document.getElementById("price-slider-max");

            const splitedPrice = price.split(";");
            const min = parsePriceInput(splitedPrice[0], NaN);
            const max = parsePriceInput(splitedPrice[1], NaN);

            if (minPriceFilter != null && maxPriceFilter != null) {
                minPriceFilter.value = formatPriceDisplay(min);
                maxPriceFilter.value = formatPriceDisplay(max);

            } else {
                const elementId = price.replace(";", "-");
                const elementFilter = document.getElementById(elementId);
                if (elementFilter != null) elementFilter.checked = true;
            }
            if (minPriceSlider != null && maxPriceSlider != null && min != max) {
                refreshMin(minPriceSlider, min);
                refreshMax(maxPriceSlider, max);
            }
        });
    }
}


/**
 * Defines the selected filter
 * @param {string} filterId - The filter id
 */
function setFilter(filterId) {
    const filterQueryStringValue = queryStringParams.getAll("filtro");
    if (filterQueryStringValue.includes(filterId)) {
        queryStringParams.delete("filtro");
        if (filterQueryStringValue.length > 1) {
            const index = filterQueryStringValue.indexOf(filterId);
            filterQueryStringValue.splice(index, 1);
            filterQueryStringValue.forEach(x => queryStringParams.append("filtro", x));
        }
    } else {
        queryStringParams.append("filtro", filterId);
    }
    window.location.search = queryStringParams.toString();
}

/**
 * Clears the selected filter
 */
function clearFilters() {
    queryStringParams.delete("filtro");
    queryStringParams.delete("precoPor");
    window.location.search = queryStringParams.toString();
}

/**
 * Takes the price range informations and pass it to the query
 */
function setFieldPriceFilter() {
    const minFallback = Number(document.getElementById("price-range-min-value").value);
    const maxFallback = Number(document.getElementById("price-range-max-value").value);
    const minInput = document.getElementById("minimum-price-filter").value;
    const maxInput = document.getElementById("maximum-price-filter").value;
    let minPrice = clampPriceValue(parsePriceInput(minInput, minFallback), minFallback, maxFallback);
    let maxPrice = clampPriceValue(parsePriceInput(maxInput, maxFallback), minFallback, maxFallback);

    if (!Number.isFinite(minPrice) || !Number.isFinite(maxPrice)) return;

    if (minPrice > maxPrice) {
        const temp = minPrice;
        minPrice = maxPrice;
        maxPrice = temp;
    }

    const filter = minPrice.toFixed(2) + ";" + maxPrice.toFixed(2);
    applyPriceFilterUrl(filter);
}

function setupPriceFilterControls() {
    const priceInputs = document.querySelectorAll(".price-filter__input");
    priceInputs.forEach(function (input) {
        input.addEventListener("blur", function () {
            const fallbackId = input.id === "minimum-price-filter"
                ? "price-range-min-value"
                : "price-range-max-value";
            const fallbackInput = document.getElementById(fallbackId);
            const fallbackValue = fallbackInput ? Number(fallbackInput.value) : 0;
            const rangeMinInput = document.getElementById("price-range-min-value");
            const rangeMaxInput = document.getElementById("price-range-max-value");
            const rangeMin = rangeMinInput ? Number(rangeMinInput.value) : fallbackValue;
            const rangeMax = rangeMaxInput ? Number(rangeMaxInput.value) : fallbackValue;
            input.value = formatPriceDisplay(clampPriceValue(parsePriceInput(input.value, fallbackValue), rangeMin, rangeMax));
        });

        input.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                event.preventDefault();
                setFieldPriceFilter();
            }
        });
    });

    const priceSteppers = document.querySelectorAll("[data-price-step]");
    priceSteppers.forEach(function (button) {
        button.addEventListener("click", function () {
            adjustPriceField(button.dataset.priceTarget, Number(button.dataset.priceStep));
        });
    });
}

/**
 * Checks if the price filter is seletected, and adds it or removes it from the query
 */
function setRangePriceFilter(filterId) {
    const filterIsChecked = document.getElementById(filterId).checked;

    if (filterIsChecked) {
        const splitedPrice = filterId.split("-");
        const minPrice = splitedPrice[0];
        const maxPrice = splitedPrice[1];
        const filter = minPrice + ";" + maxPrice;
        applyPriceFilterUrl(filter);
    } else {
        queryStringParams.delete("precoPor");
        window.location.search = queryStringParams.toString();
    }
}

/**
 * Apply the price filter sending the data to the url query
 */
function applyPriceFilterUrl(filter) {
    const filterQueryStringValue = queryStringParams.getAll("precoPor");
    if (filterQueryStringValue.length == 1) {
        queryStringParams.delete("precoPor");
    }

    queryStringParams.set("precoPor", filter);
    window.location.search = queryStringParams.toString();
}

function parsePriceInput(value, fallback) {
    if (value == null) return fallback;

    const normalizedValue = normalizePriceInputValue(value);
    if (normalizedValue === "") return fallback;

    const parsedValue = Number(normalizedValue);
    return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function normalizePriceInputValue(value) {
    const cleanedValue = String(value).trim().replace(/[^\d,.-]/g, "");
    if (cleanedValue === "") return "";

    if (cleanedValue.includes(",")) {
        return cleanedValue.replace(/\./g, "").replace(",", ".");
    }

    const dotParts = cleanedValue.split(".");
    if (dotParts.length > 2) {
        const decimalPart = dotParts.pop();
        return dotParts.join("") + "." + decimalPart;
    }

    return cleanedValue;
}

function formatPriceDisplay(value) {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) return "";

    return numberValue.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function adjustPriceField(inputId, step) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const fallbackId = inputId === "minimum-price-filter"
        ? "price-range-min-value"
        : "price-range-max-value";
    const fallbackInput = document.getElementById(fallbackId);
    const fallbackValue = fallbackInput ? Number(fallbackInput.value) : 0;
    const rangeMinInput = document.getElementById("price-range-min-value");
    const rangeMaxInput = document.getElementById("price-range-max-value");
    const rangeMin = rangeMinInput ? Number(rangeMinInput.value) : fallbackValue;
    const rangeMax = rangeMaxInput ? Number(rangeMaxInput.value) : fallbackValue;
    const currentValue = parsePriceInput(input.value, fallbackValue);
    const nextValue = clampPriceValue(currentValue + step, rangeMin, rangeMax);

    input.value = formatPriceDisplay(nextValue);
}

function clampPriceValue(value, min, max) {
    const lowerBound = Number.isFinite(min) ? min : value;
    const upperBound = Number.isFinite(max) ? max : value;

    if (value < lowerBound) return lowerBound;
    if (value > upperBound) return upperBound;

    return value;
}

/**
 * Collapse filters
 */

function toggleSlide(elem) {
    if (!elem.style.height) {
        elem.style.height = `${elem.scrollHeight}px`
    }
    else {
        elem.style.height = ``
    }
}

const filterTitles = document.querySelectorAll(".filter__title");

filterTitles.forEach(function (title) {
    if (title.classList.contains("filter__price-title")) return;

    title.addEventListener("click", function () {
        const filterItem = title.parentElement,
            filterList = title.nextElementSibling
        filterItem.classList.toggle("open")
        toggleSlide(filterList);
    });
});

/**
 * Expand filter list
 */

function toggleSlideMaxHeight(elem, maxHeight) {
    if (!elem.style.maxHeight || elem.style.maxHeight == `${maxHeight}px`) {
        elem.style.maxHeight = `${elem.scrollHeight}px`
    }
    else {
        elem.style.maxHeight = `${maxHeight}px`
    }
}

function expandFilterList(button) {
    var filterList = button.previousElementSibling
    toggleSlideMaxHeight(filterList, 140);
    button.classList.toggle("ver-menos")
}

/**
 * Mobile filter
 */

if (MOBILE.matches) {
    const body = document.querySelector("body")
    const filter = document.querySelector(".filter");
    const openButton = document.querySelector(".filter__button");
    const closeButton = document.querySelector(".filter__close");

    filter.addEventListener("click", function (e) {
        if (e.target == e.currentTarget) {
            body.classList.remove("on-filter")
        }
    })
    openButton.addEventListener("click", function (e) {
        body.classList.add("on-filter")
    })

    closeButton.addEventListener("click", function (e) {
        body.classList.remove("on-filter")
    })


}

function refreshMin(elem, inputValue = null) {
    const range = getPriceRange();
    const minValue = Number(document.getElementById('price-range-min-value').value);
    if (inputValue) elem.value = (inputValue - minValue) / range * 100;

    //so it won't go past the max slider
    const maxValueInput = document.getElementById('price-slider-max');
    elem.value = Math.min(elem.value, maxValueInput.value - 1);

    const value = Number(elem.value);
    const priceValue = Math.floor(minValue + (range * elem.value / 100)).toFixed(2);
    document.getElementById('unselected-left').style.width = value + '%';
    document.getElementById('selected-range-slider').style.left = value + '%';
    document.getElementById('slider-thumb-left').style.left = value + '%';
    document.getElementById('price-min-selected').value = priceValue;

    if (inputValue) return;

    updateFieldPrice('minimum-price-filter', priceValue);
    waitAndRefresh();
}

function refreshMax(elem, inputValue = null) {
    const range = getPriceRange();
    const minValue = Number(document.getElementById('price-range-min-value').value);
    if (inputValue) elem.value = (inputValue - minValue) / range * 100;

    //so it won't go past the min slider
    const minValueInput = document.getElementById('price-slider-min');
    elem.value = Math.max(elem.value, minValueInput.value - (-1));

    const value = Number(elem.value);
    const priceValue = Math.ceil(minValue + (range * elem.value / 100)).toFixed(2);
    document.getElementById('unselected-right').style.width = (100 - value) + '%';
    document.getElementById('selected-range-slider').style.right = (100 - value) + '%';
    document.getElementById('slider-thumb-right').style.left = value + '%';
    document.getElementById('price-max-selected').value = priceValue;

    if (inputValue) return;

    updateFieldPrice('maximum-price-filter', priceValue);
    waitAndRefresh();
}

function getPriceRange() {
    const minValue = document.getElementById('price-range-min-value').value;
    const maxValue = document.getElementById('price-range-max-value').value;
    return maxValue - minValue;
}

function waitAndRefresh() {
    if (refreshTimeout) clearTimeout(refreshTimeout);
    refreshTimeout = setTimeout(setSliderPriceFilter, 2000);
}

function setSliderPriceFilter() {
    const min = document.getElementById('price-min-selected').value
    const max = document.getElementById('price-max-selected').value
    const filter = min + ";" + max;
    applyPriceFilterUrl(filter);
}

function updateFieldPrice(inputId, value) {
    const input = document.getElementById(inputId);
    if (input) input.value = value;
}

/**
 * Gets price filter values.
*/
function getPriceFilter() {
    const priceFilter = queryStringParams.get("precoPor");
    let minPrice = null;
    let maxPrice = null;

    if (priceFilter) {
        var splitedPrice = priceFilter.replace().split(";");

        minPrice = parseFloat(splitedPrice[0]);
        maxPrice = parseFloat(splitedPrice[1]);
    }

    return { minPrice, maxPrice };
}

/**
 * Gets filters values.
*/
function getFilters() {
    const filters = queryStringParams.getAll("filtro");

    if (filters) {
        let filtersList = [];

        for (let i = 0; i < filters.length; i++) {
            const item = filters[i];
            let itemSplited = item.split("__");

            if (itemSplited.length < 2) {
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

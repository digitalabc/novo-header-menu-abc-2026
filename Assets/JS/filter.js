window.addEventListener("load", filterSetup, false);

/**
 * Setups the filter functionality
 */
function filterSetup() {
    const filterQueryStringValue = queryStringParams.getAll("filtro");
    if (filterQueryStringValue.length > 0) {
        filterQueryStringValue.forEach((element) => {
            //Double quote in js workaround
            const escapedString = element.replace("\"","\\\""); 

            const container = document.querySelector(
                'input[value="' + escapedString + '"]'
            );
            if (!container) return;
            
            if (container.type == "radio") {
                const div = document.getElementById(container.id);
                if (div) div.style.borderStyle = "solid";
            } else container.checked = true;
        });
    }

    const priceFilterQueryStringValue = queryStringParams.getAll("precoPor");
    if (priceFilterQueryStringValue.length <= 0) return;
    priceFilterQueryStringValue.forEach((price) => {
        const minPriceFilter = document.getElementById(
            "minimum-price-filter"
        );
        const maxPriceFilter = document.getElementById(
            "maximum-price-filter"
        );

        if (minPriceFilter !== null && maxPriceFilter !== null) {
            const splitedPrice = price.split(";");
            minPriceFilter.value = splitedPrice[0];
            maxPriceFilter.value = splitedPrice[1];
        } else {
            const elementId = price.replace(";", "-");
            const elementFilter = document.getElementById(elementId);
            if (elementFilter !== null) {
                elementFilter.checked = true;
            }
        }
    });
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
    const minPrice = document.getElementById("minimum-price-filter").value;
    const maxPrice = document.getElementById("maximum-price-filter").value;
    const filter = minPrice + ";" + maxPrice;
    applyPriceFilterUrl(filter);
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

/**
 * Draggable filter
 */

const filterInput = document.getElementById("maximum-price-filter")
const filterPriceDiv = document.getElementById("price-range")

function filterChange(filterVar) {
    var value = (filterVar.value) / (filterVar.max) * 100;
    filterVar.style.background = "linear-gradient(to right, #E30613 0%, #E30613 " + value + "%, #F7F7F7 " + value + "%, #F7F7F7 100%";
    filterPriceDiv.style.display = "block"
}

if (filterInput) {

    window.addEventListener("load", e => {
        filterChange(filterInput);
    })

    var slider = document.getElementById("maximum-price-filter").oninput = function () {
        filterChange(this);
    };

    filterInput.addEventListener("change", () => {
        setFieldPriceFilter();
    });
};


/**
 * Collapse filters
 */

function toggleSlide(elem){
  if (!elem.style.height) {
    elem.style.height = `${elem.scrollHeight}px`
  }
  else{
    elem.style.height = ``
  }
}

const filterTitles = document.querySelectorAll(".filter__title");

filterTitles.forEach(function (title) {
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

function toggleSlideMaxHeight(elem, maxHeight){
  if (!elem.style.maxHeight || elem.style.maxHeight == `${maxHeight}px`) {
    elem.style.maxHeight = `${elem.scrollHeight}px`
  }
  else{
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

if(MOBILE.matches) {
  const body = document.querySelector("body")
  const openButton = document.querySelector(".filter__button");
  const closeButton = document.querySelector(".filter__close");

  openButton.addEventListener("click", function (e) {
    body.classList.add("on-filter")
  })

  closeButton.addEventListener("click", function (e) {
    body.classList.remove("on-filter")
  })


}


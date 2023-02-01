autocomplete(document.getElementById("search-bar"));
window.addEventListener("load", loadPartnerLogo());

/**
 * Redirects to the search page with the given term, or searching for 
 * the page's search bar value
 * @param {Event} e - The event
 * @param {string | null} term - The text input for this method, if not provided
 * we get the content of the search bar element.
 */
function search(e, term) {
    if (e) e.preventDefault();

    let query = term;
    if (!term) query = document.getElementById("search-bar").value;

    let searchPage =
        document.location.protocol + "//" +
        document.location.host + "/busca?busca=" +
        query;

    document.location.href = searchPage;
    return false;
}

/**
 * Load and render the autocomplete snippet
 * @param {string} val - The input text to search for autocompletion
 */
async function renderAutocompleteSnippet(val) {
    if (!val) return false;

    const response = await client.snippet.render(
        "autocomplete_snippet.html",
        "SnippetQueries/autocomplete.graphql",
        {
            query: val,
        }
    );
    replaceInnerHtml(response, "autocomplete-list");
}

/**
 * Sets a function to be called after a timeout
 * @param {function} callback - The function to be executed
 * @param {number} delay - The duration of the delay in ms
 */
function delayInput(callback, delay) {
    let timer = 0;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(callback.bind(this, ...args), delay || 0);
    };
}

/**
 * Setups the autocomplete feature
 * @param {HTMLInputElement} inp - The search bar input element
 */
function autocomplete(inp) {
    let currentFocus;

    inp.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            search(e, null);
        }
    });

    inp.addEventListener(
        "keyup",
        delayInput(async function (e) {
            if (e.keyCode != 40 && e.keyCode != 38 && e.keyCode != 13) {
                currentFocus = -1;
                await renderAutocompleteSnippet(this.value);
            }
        }, 500)
    );

    inp.addEventListener("keydown", function (e) {
        var x = document.getElementById("autocomplete-list");
        if (x) x = x.getElementsByTagName("div");

        if (e.keyCode == 40) {
            currentFocus++;
            addActive(x);
        } else if (e.keyCode == 38) {
            currentFocus--;
            addActive(x);
        } else if (e.keyCode == 13) {
            e.preventDefault();
            if (currentFocus < 0 || !x) return;
            
            const selectedDiv = x[currentFocus];
            if (!selectedDiv.classList.value.includes("product-suggestion"))
                search(null, selectedDiv.innerHTML.trim());
            else window.location.href = "/" + selectedDiv.id;
        }
    });

    document.addEventListener("click", function (e) {
        replaceInnerHtml("", "autocomplete-list");
    });

    function addActive(items) {
        if (!items) return false;

        removeActive(items);
        if (currentFocus >= items.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = items.length - 1;

        items[currentFocus].classList.add("autocomplete-active");
    }

    function removeActive(items) {
        for (let i = 0; i < items.length; i++) 
        items[i].classList.remove("autocomplete-active");
    }
}

/**
 * Associates a checkout with a partner access token taken from the cookies
 * @param {string} checkoutId - The id of the checkout to be associated
 */
async function checkoutPartnerAssociate(checkoutId) {
    const partnerAccessToken = getCookie("sf_partner_access_token");
    if (partnerAccessToken)
        return await client.checkout.partnerAssociate(
            checkoutId,
            partnerAccessToken
        );
}

/**
 * Returns a given cookie's value
 * @param {string} name - The cookie key
 */
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
}

/**
 * If there is a partner access token registered in the cookies, loads a snippet to get a custom logo in the navbar
 */
async function loadPartnerLogo() {
    const partnerAccessToken = getCookie("sf_partner_access_token");
    if (!partnerAccessToken) return;

    const partnerLogo = await client.snippet.render(
        "partner_logo_snippet.html",
        "SnippetQueries/partner_logo.graphql",
        { partnerAccessToken: partnerAccessToken }
    );
    if (partnerLogo) replaceInnerHtml(partnerLogo, "navbar-logo");
}

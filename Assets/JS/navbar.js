const menuOffcanvasCloseTimers = new WeakMap();
let menuOffcanvasFallbackReady = false;
let lastMenuOffcanvasActivationAt = 0;

function runNavbarWhenDomReady(callback) {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", callback, { once: true });
        return;
    }

    callback();
}

runNavbarWhenDomReady(() => {
    const searchBar = document.getElementById("search-bar");
    if (searchBar) autocomplete(searchBar);
    menuMobileLoad();
});

window.addEventListener("load", () => {
    loadPartnerLogo().catch((err) => console.error(err));
}, false);

function closestNavbarElement(target, selector) {
    if (!target) return null;

    const element = target.nodeType === 1 ? target : target.parentElement;
    return element ? element.closest(selector) : null;
}

function getMenuOffcanvas() {
    return document.getElementById("menu-offcanvas");
}

function preventNavbarDefault(event) {
    if (event && event.cancelable) event.preventDefault();
}

function openMenuOffcanvasFallback(event) {
    preventNavbarDefault(event);

    const offcanvas = getMenuOffcanvas();
    const body = document.body;
    if (!offcanvas || !body) return;

    const closeTimer = menuOffcanvasCloseTimers.get(offcanvas);
    if (closeTimer) {
        clearTimeout(closeTimer);
        menuOffcanvasCloseTimers.delete(offcanvas);
    }

    body.classList.add("ah-offcanvas-container");
    offcanvas.style.display = "block";

    const scheduleOpen = window.requestAnimationFrame || ((callback) => setTimeout(callback, 10));
    scheduleOpen(() => {
        offcanvas.classList.add("ah-offcanvas-open");
    });
}

function closeMenuOffcanvasFallback(event) {
    preventNavbarDefault(event);

    const offcanvas = getMenuOffcanvas();
    if (!offcanvas) return;

    offcanvas.classList.remove("ah-offcanvas-open");

    const closeTimer = setTimeout(() => {
        if (!offcanvas.classList.contains("ah-offcanvas-open")) {
            offcanvas.style.display = "none";
            document.body.classList.remove("ah-offcanvas-container");
        }
        menuOffcanvasCloseTimers.delete(offcanvas);
    }, 250);

    menuOffcanvasCloseTimers.set(offcanvas, closeTimer);
}

function handleMenuOffcanvasTriggerFallback(event) {
    const trigger = closestNavbarElement(event.target, '[ah-toggle="#menu-offcanvas"]');
    if (!trigger) return;

    if (event.type === "pointerup" && event.pointerType === "mouse") return;

    const now = Date.now();
    if (event.type === "click" && now - lastMenuOffcanvasActivationAt < 600) {
        preventNavbarDefault(event);
        return;
    }

    lastMenuOffcanvasActivationAt = now;
    openMenuOffcanvasFallback(event);
    event.stopPropagation();
}

function handleMenuOffcanvasCloseFallback(event) {
    const offcanvas = getMenuOffcanvas();
    if (!offcanvas) return;

    const closeButton = closestNavbarElement(event.target, ".ah-close");
    if (event.target === offcanvas || (closeButton && offcanvas.contains(closeButton))) {
        if (Date.now() - lastMenuOffcanvasActivationAt < 650) {
            preventNavbarDefault(event);
            event.stopPropagation();
            return;
        }

        closeMenuOffcanvasFallback(event);
        event.stopPropagation();
    }
}

function initMenuOffcanvasFallback() {
    if (menuOffcanvasFallbackReady || window.__abcMenuOffcanvasFallbackReady) return;

    menuOffcanvasFallbackReady = true;
    window.__abcMenuOffcanvasFallbackReady = true;

    if (window.PointerEvent) {
        document.addEventListener("pointerup", handleMenuOffcanvasTriggerFallback, true);
    } else {
        document.addEventListener("touchend", handleMenuOffcanvasTriggerFallback, true);
    }

    document.addEventListener("click", handleMenuOffcanvasTriggerFallback, true);
    document.addEventListener("click", handleMenuOffcanvasCloseFallback, true);
}

initMenuOffcanvasFallback();

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

    if (!query) return false;

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
    if (!val) {
        replaceInnerHtml("", "autocomplete-list");
        return false;
    }

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

    inp.addEventListener("input", function () {
        if (!this.value.trim()) {
            replaceInnerHtml("", "autocomplete-list");
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
 * Disassociates a partner with a checkout
 * @param {string} checkoutId - The id of the checkout to be disassociated
 */
async function checkoutPartnerDisassociate(checkoutId) {
    return await client.checkout.partnerDisassociate(checkoutId);
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

/**
 * Reorders the root mobile categories, removes duplicates, and highlights the
 * priority set that should appear first.
 */
function reorderRootMobileCategories() {
    const rootList = document.querySelector(
        "#menu-offcanvas .nav-mobile__list--root",
    );
    if (!rootList) return;

    const priorityOrder = [
        "pisos | revestimentos",
        "loucas",
        "metais",
        "banho quente",
        "moveis",
        "tintas",
    ];
    const priorityMap = new Map(
        priorityOrder.map((label, index) => [label, index]),
    );

    const normalizeText = (value) =>
        (value || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/-/g, " ")
            .replace(/\s*\|\s*/g, " | ")
            .replace(/\s+/g, " ")
            .trim();

    const createSyntheticRootItem = (label, href) => {
        const item = document.createElement("div");
        item.className = "nav-mobile__item nav-mobile__item--nv1";

        const link = document.createElement("a");
        link.className = "nav-mobile__link nav-mobile__link--nv1";
        link.href = href;
        link.textContent = label;

        item.appendChild(link);
        return item;
    };

    const rootItems = Array.from(rootList.children).filter(
        (node) => node.classList && node.classList.contains("nav-mobile__item"),
    );

    const orderedItems = rootItems
        .map((item, index) => {
            const link = item.querySelector(".nav-mobile__link");
            const label = normalizeText(link ? link.textContent : "");
            return {
                index,
                item,
                label,
                priority: priorityMap.has(label)
                    ? priorityMap.get(label)
                    : Number.POSITIVE_INFINITY,
            };
        });

    if (!orderedItems.some(({ label }) => label === "loucas")) {
        orderedItems.push({
            index: orderedItems.length,
            item: createSyntheticRootItem("Louças", "/loucas/inox/sintetico"),
            label: "loucas",
            priority: priorityMap.get("loucas"),
        });
    }

    orderedItems.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        if (a.priority !== Number.POSITIVE_INFINITY) return a.index - b.index;
        const labelComparison = a.label.localeCompare(b.label, "pt-BR", {
            sensitivity: "base",
        });
        return labelComparison || a.index - b.index;
    });

    const seenLabels = new Set();
    const fragment = document.createDocumentFragment();

    orderedItems.forEach(({ item, label }) => {
        if (seenLabels.has(label)) {
            item.remove();
            return;
        }

        seenLabels.add(label);
        const link = item.querySelector(".nav-mobile__link");
        if (priorityMap.has(label)) {
            item.classList.add("nav-mobile__item--root-priority");
            if (link) {
                link.classList.add("nav-mobile__link--root-priority");
            }
        }
        fragment.appendChild(item);
    });

    rootList.appendChild(fragment);
}

/**
 * Setups the mobile menu navigation from click event
 */
function menuMobileLoad() {
    reorderRootMobileCategories();

    const menuMobileLinks = document.querySelectorAll(".nav-mobile__link");
    const menuMobileBackButtons = document.querySelectorAll(".nav-mobile__back");
    if (menuMobileLinks) {
        menuMobileLinks.forEach(button => {
            if (button.dataset.navMobileReady === "true") return;
            button.dataset.navMobileReady = "true";
            button.addEventListener('click', (event) => { handleMenuLinkClick(event); })
        });
    }
    if (menuMobileBackButtons) {
        menuMobileBackButtons.forEach(button => {
            if (button.dataset.navMobileReady === "true") return;
            button.dataset.navMobileReady = "true";
            button.addEventListener('click', (event) => { handleBackButtonClick(event); })
        });
    }
}

/**
 * Mobile menu navigation
 */
function handleMenuLinkClick(event) {
    var button = closestNavbarElement(event.target, ".nav-mobile__open")
    if (button) {
        event.preventDefault()
        var anchor = closestNavbarElement(button, ".nav-mobile__link")
        var dropdown = anchor ? anchor.nextElementSibling : null
        if (!dropdown) return
        dropdown.classList.add("open")
    }
}
function handleBackButtonClick(event) {
    var button = closestNavbarElement(event.target, ".nav-mobile__back")
    if (!button) return
    var dropdown = button.parentElement

    dropdown.classList.remove("open")
}

function showMobileSearch() {
  const body = document.body
  body.classList.add("show-mobile-nav", "show-search")
}

function hideMobileSearch(event) {
  const body = document.body
  body.classList.remove("show-search")
}

function onScroll(evt) {
    // Store the scroll value for laterz.
    /*
    lastScrollY = window.scrollY;
  
    // Prevent multiple rAF callbacks.
    if (scheduledAnimationFrame) return;
  
    scheduledAnimationFrame = true;
    requestAnimationFrame(readAndUpdatePage);
    */
}

window.addEventListener("scroll", onScroll);

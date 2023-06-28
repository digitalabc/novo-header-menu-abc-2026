/**
 * Global variable to simplify the manipulation of query string parameters
*/
const queryStringParams = new URLSearchParams(window.location.search);

/**
 * Replaces the content of a given element with the passed html parameter.
 * @param {string} html - The content that will replace the element's inner html
 * @param {string} id - The id used to search for the element in the document
*/
function replaceInnerHtml(html, id) {
  const div = document.getElementById(id);
  if (div && html !== undefined) div.innerHTML = html;
}

/**
 * Global variable for media matches
*/
const MOBILE = window.matchMedia('(min-width: 0px) and (max-width: 991px)');
const DESKTOP = window.matchMedia('(min-width: 992px)');

/**
 * Defer background images
*/
window.addEventListener('DOMContentLoaded', function () {
  document.getElementById('no-bg-img').remove();
})

/**
 * Change header class on scroll
*/
const body = document.body
const footer = document.querySelector('footer')

function setScroll(scrollTop, lastScrollTop) {
  if (scrollTop <= 0) {
    body.classList.add('scroll-up');
    body.classList.remove('scroll-down');
    body.classList.add('on-top');
  } else {
    if (body.classList.contains('on-top')) {
      body.classList.remove('on-top');
    }
    if (scrollTop > lastScrollTop) {
      body.classList.add('scroll-down');
      body.classList.remove('scroll-up');
    } else {
      body.classList.add('scroll-up');
      body.classList.remove('scroll-down');
    }
  }
}

function setFloatingNavMobile(scrollTop, offsetToShowMobileNav, offsetToHideMobileNav) {
  if (scrollTop > offsetToShowMobileNav && (window.innerHeight + scrollTop) + offsetToHideMobileNav <= document.body.offsetHeight) {
    body.classList.add('show-mobile-nav');
  }
  else {
    body.classList.remove('show-mobile-nav');
  }
}

window.addEventListener("load", () => {
  var lastScrollTop = -1

  const offsetToShowMobileNav = 200
  const offsetBottom = 200

  window.addEventListener('scroll', function () {
    const newSt = window.pageYOffset;

    setScroll(newSt, lastScrollTop);

    if (MOBILE.matches) {
      setFloatingNavMobile(newSt, offsetToShowMobileNav, offsetBottom);
    }

    lastScrollTop = newSt;
  });
});

function toggleSlide(elem) {
  if (!elem.style.height) {
    elem.style.height = `${elem.scrollHeight}px`
  }
  else {
    elem.style.height = ``
  }
}

function toggleNextSibling(button) {
  var optionListEl = button.nextElementSibling
  toggleSlide(optionListEl)
  button.classList.toggle("open")
}

var toggle = function (elem) {
  // If the element is visible, hide it
  if (window.getComputedStyle(elem).display === 'block') {
    elem.style.display = 'none';
    return;
  }
  // Otherwise, show it
  elem.style.display = 'block';
};

/**
 * Floating Whatsapp
 */

if (window.location.href.indexOf('checkout') != -1) {
  document.getElementById('whatsapp').hide();
} else {
  document.getElementById('whatsapp').addEventListener("click", function () {
    setTimeout(function () {
      dataLayer.push({
        'event': 'whatsapp'
      });
      // fbq('track', 'Contact');

      const url = "https://api.whatsapp.com/send?phone=553192490299&text=%5BABCZAP%5D%20Ol%C3%A1!%20Acessei%20o%20site%20da%20ABC%20da%20Constru%C3%A7%C3%A3o%20e%20gostaria%20de%20informa%C3%A7%C3%B5es";

      window.location.href = url

    }, 500);
  });
}
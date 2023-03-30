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
 * Change header class on scroll
*/
var lastScrollTop =  -1,
    scrollTop = window.pageYOffset

const header = document.querySelector('#header')

function setScroll(scrollTop, lastScrollTop) {
  if (scrollTop <= 0) {
    header.classList.add('scroll-up');
    header.classList.remove('scroll-down');
    header.classList.add('on-top');
  } else {
    if (header.classList.contains('on-top')) {
      header.classList.remove('on-top');
    }
    if (scrollTop > lastScrollTop) {
      header.classList.add('scroll-down');
      header.classList.remove('scroll-up');
    } else {
      header.classList.add('scroll-up');
      header.classList.remove('scroll-down');
    }
  }
}

window.addEventListener('scroll', function () {
  const newSt = window.pageYOffset;

  setScroll(newSt, lastScrollTop);
  lastScrollTop = newSt;
});

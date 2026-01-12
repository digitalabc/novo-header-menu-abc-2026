function canNavigateToProduct() {
  const currentPath = window.location.pathname;
  const checkoutIndex = currentPath.indexOf('/checkout');
  
  if (checkoutIndex === -1) {
    return true;
  }
  
  const pathAfterCheckout = currentPath.substring(checkoutIndex + '/checkout'.length);
  
  return pathAfterCheckout === '' || pathAfterCheckout === '/';
}

function handleProductNavigation(event, productUrl) {
  if (!productUrl) {
    event.preventDefault();
    return;
  }

  if (!canNavigateToProduct()) {
    event.preventDefault();
    return;
  }
}

function initializeProductLinks() {
  const productLinks = document.querySelectorAll('[data-product-link]');
  
  productLinks.forEach(link => {
    const productUrl = link.getAttribute('data-product-url');
    
    if (!canNavigateToProduct()) {
      link.style.cursor = 'default';
      link.style.pointerEvents = 'none';
      link.removeAttribute('href');
    } else {
      link.style.cursor = 'pointer';
      link.style.pointerEvents = 'auto';
      if (productUrl) {
        link.setAttribute('href', productUrl);
      }
    }
  });
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeProductLinks);
  } else {
    initializeProductLinks();
  }

  const observer = new MutationObserver(() => {
    initializeProductLinks();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

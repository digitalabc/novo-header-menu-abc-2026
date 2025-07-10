; (async () => {
  const isMobileR2U = () => (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  await R2U.init({ customerId: 'f8e75cbb-150d-4c22-92b6-77eff4a5a849' });
  let skuCode = document.getElementById("product-variant-id").value

  const isActive = await R2U.sku.isActive(skuCode);
  if (isActive) {

    const sku = skuCode;

    const arButton = document.getElementById('ar-button')
    if (arButton) {
      await R2U.ar.attach({
        element: arButton,
        sku
      })
    }

    const viewer = document.getElementById('viewer-3d');
    await R2U.viewer.create({ element: viewer, sku, viewerProps: {activeShadow: !isMobileR2U(), shadowRadius: 20, shadowOpacity: 0.2}, });
    viewer.style.display = "block"

    const element = document.getElementById('qrCode');
    if (element) {
      await R2U.qrCode.create({ element, sku });
      element.parentElement.style.display = "block"
    }

    document.getElementById("virtual_reality-thumb").style.display = "block"
    document.getElementById("virtual_reality-icons").style.display = "flex"
    if (window.innerWidth < 991) document.querySelector(".virtual_reality__banner.mobile").style.display = "block"
  } else {
    document.getElementById("virtual_reality-slide").style.display = "none"
    document.querySelector(".gallery .swiper-pagination-bullet:last-child").style.display = "none"
  }
})()
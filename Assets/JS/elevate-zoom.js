let productImages = document.querySelectorAll('.gallery-slider .swiper-slide');
console.log(productImages)

productImages.forEach((img) => {
  const image = img.querySelector('img');

  img.addEventListener('mousemove', function (e) {
    const rect = img.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const offsetX = x / rect.width;
    const offsetY = y / rect.height;
    const scale = 2; // Ajuste o valor conforme necessário

    image.style.transform = `scale(${scale})`;
    image.style.transformOrigin = `${offsetX * 100}% ${offsetY * 100}%`;
  });

  img.addEventListener('mouseout', function () {
    image.style.transform = 'scale(1)';
  });
})

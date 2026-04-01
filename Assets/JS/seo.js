function toggleSeo() {
  const btn = document.querySelector(".seo__button");
  if (!btn) return;
  const root = btn.closest(".seo-wrap") || btn.closest(".seo");
  if (root) root.classList.toggle("expand");
}

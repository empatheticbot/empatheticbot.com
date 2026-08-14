const cascadeLightbox = document.querySelector(".cascade-lightbox");

if (cascadeLightbox) {
  const lightboxImage = cascadeLightbox.querySelector("img");
  const lightboxBody = cascadeLightbox.querySelector(".cascade-lightbox-body");
  const lightboxTitle = cascadeLightbox.querySelector("#cascade-lightbox-title");
  const closeButton = cascadeLightbox.querySelector(".cascade-lightbox-close");

  for (const button of document.querySelectorAll(".cascade-concept-button")) {
    button.addEventListener("click", () => {
      const source = button.querySelector("img");
      lightboxImage.src = source.currentSrc || source.src;
      lightboxImage.alt = source.alt;
      lightboxTitle.textContent = button.getAttribute("aria-label").replace(/^Open /, "");
      cascadeLightbox.showModal();
      lightboxBody.scrollTop = 0;
    });
  }

  closeButton.addEventListener("click", () => cascadeLightbox.close());
  cascadeLightbox.addEventListener("click", (event) => {
    if (event.target === cascadeLightbox || event.target === lightboxBody) {
      cascadeLightbox.close();
    }
  });
}

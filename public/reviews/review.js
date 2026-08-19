const reviewLightbox = document.querySelector(".review-lightbox");

if (reviewLightbox) {
  const lightboxImage = reviewLightbox.querySelector("img");
  const lightboxBody = reviewLightbox.querySelector(".review-lightbox-body");
  const lightboxTitle = reviewLightbox.querySelector("#review-lightbox-title");
  const closeButton = reviewLightbox.querySelector(".review-lightbox-close");

  for (const button of document.querySelectorAll(".review-concept-button")) {
    button.addEventListener("click", () => {
      const source = button.querySelector("img");
      lightboxImage.src = source.currentSrc || source.src;
      lightboxImage.alt = source.alt;
      lightboxTitle.textContent = button.getAttribute("aria-label").replace(/^Open /, "");
      reviewLightbox.showModal();
      lightboxBody.scrollTop = 0;
    });
  }

  closeButton.addEventListener("click", () => reviewLightbox.close());
  reviewLightbox.addEventListener("click", (event) => {
    if (event.target === reviewLightbox || event.target === lightboxBody) {
      reviewLightbox.close();
    }
  });
}

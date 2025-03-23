document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ main.js loaded");

  const modal = document.getElementById("imageModal");
  const modalImg = document.getElementById("modalImage");
  const modalTitle = document.getElementById("modalTitle");
  const modalDescription = document.getElementById("modalDescription");
  const closeModalButton = document.querySelector(".close");

  if (!modal || !modalImg || !modalTitle || !modalDescription || !closeModalButton) {
    console.error("❌ Modal elements missing in the DOM.");
    return;
  }

  window.openModal = (imgSrc, title, description) => {
    if (!imgSrc) return;

    modal.style.display = "flex";

    // Delay to allow CSS transitions (optional if using opacity/scale)
    requestAnimationFrame(() => {
      modal.classList.add("show");
    });

    modalImg.src = imgSrc;
    modalImg.alt = title || "";
    modalTitle.textContent = title || "";
    modalDescription.textContent = description || "";
    document.documentElement.style.overflow = "hidden";
  };

  window.closeModal = () => {
    modal.classList.remove("show");

    setTimeout(() => {
      modal.style.display = "none";
      modalImg.src = "";
      modalTitle.textContent = "";
      modalDescription.textContent = "";
      document.documentElement.style.overflow = "auto";
    }, 200); // match fade duration
  };

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  closeModalButton.addEventListener("click", closeModal);
});

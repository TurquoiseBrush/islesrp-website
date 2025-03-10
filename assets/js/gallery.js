document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("imageModal");
  const modalImg = document.getElementById("modalImage");
  const modalTitle = document.getElementById("modalTitle");
  const modalDescription = document.getElementById("modalDescription");
  const closeModalButton = document.querySelector(".close");

  // Open Modal Function
  window.openModal = (imgSrc, title, description) => {
    if (!imgSrc) return; // Prevent opening modal with missing images
    modal.style.display = "flex";
    modalImg.src = imgSrc;
    modalImg.alt = title;
    modalTitle.textContent = title;
    modalDescription.textContent = description;
    document.documentElement.style.overflow = "hidden"; // Disable background scroll
  };

  // Close Modal Function
  window.closeModal = () => {
    modal.style.display = "none";
    document.documentElement.style.overflow = "auto"; // Restore scrolling
  };

  // Close modal when clicking outside the content
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // Close modal with ESC key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  // Close modal on button click
  closeModalButton.addEventListener("click", closeModal);
});

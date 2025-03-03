// Open Image Modal
function openModal(imageSrc, title, description) {
    document.getElementById("modalImage").src = "assets/images/" + imageSrc;
    document.getElementById("modalTitle").textContent = title;
    document.getElementById("modalDescription").textContent = description;
    document.getElementById("imageModal").style.display = "flex";
  }
  
  // Close Image Modal
  function closeModal() {
    document.getElementById("imageModal").style.display = "none";
  }
  
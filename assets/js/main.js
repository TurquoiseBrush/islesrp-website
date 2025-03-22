// Social Media Post Image Modal
function openModal(imageSrc, imageAlt) {
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("modalImage");
    const modalTitle = document.getElementById("modalTitle");
  
    modalImg.src = imageSrc;
    modalTitle.innerText = imageAlt;
    modal.style.display = "flex";
  }
  
  function closeModal() {
    const modal = document.getElementById("imageModal");
    modal.style.display = "none";
    document.getElementById("modalImage").src = "";
    document.getElementById("modalTitle").innerText = "";
  }
  
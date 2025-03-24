document.addEventListener("DOMContentLoaded", async () => {
  console.log("✅ main.js loaded");

  // === Supabase Session Check ===
  const { data: { session } } = await supabase.auth.getSession();
  const isLoggedIn = !!session;
  window.isLoggedInUser = isLoggedIn;

  const loginBtn = document.getElementById("loginBtn");
  const openSubmitModalBtn = document.getElementById("openSubmitModal");

  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
      });
      if (error) {
        console.error("❌ Discord login failed:", error.message);
      } else {
        console.log("✅ Redirecting to Discord login...");
      }
    });
  }

  // Show submit button if logged in
  if (openSubmitModalBtn && isLoggedIn) {
    openSubmitModalBtn.style.display = "inline-block";
  }

  // === Image Modal Elements ===
  const modal = document.getElementById("imageModal");
  const modalImg = document.getElementById("modalImage");
  const modalTitle = document.getElementById("modalTitle");
  const modalDescription = document.getElementById("modalDescription");
  const closeModalButton = modal?.querySelector(".close");

  // === Submit Modal Elements ===
  const submitModal = document.getElementById("submitModal");
  const postForm = document.getElementById("postForm");
  const statusMsg = document.getElementById("submissionStatus");
  const closeSubmitBtn = submitModal?.querySelector(".close");

  // =======================
  // 📸 IMAGE PREVIEW MODAL
  // =======================
  if (modal && modalImg && modalTitle && modalDescription && closeModalButton) {
    window.openModal = (imgSrc, title, description) => {
      if (!imgSrc) return;

      modalImg.src = imgSrc;
      modalImg.alt = title || "";
      modalTitle.textContent = title || "";
      modalDescription.textContent = description || "";

      modal.style.display = "flex";
      requestAnimationFrame(() => modal.classList.add("show"));
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
      }, 200);
    };

    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    closeModalButton.addEventListener("click", closeModal);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });
  }

  // ===========================
  // 📝 SUBMIT POST MODAL
  // ===========================
  if (submitModal && openSubmitModalBtn && postForm && statusMsg && closeSubmitBtn) {
    openSubmitModalBtn.addEventListener("click", () => {
      submitModal.style.display = "flex";
      requestAnimationFrame(() => submitModal.classList.add("show"));
    });

    window.closeSubmitModal = () => {
      submitModal.classList.remove("show");
      setTimeout(() => {
        submitModal.style.display = "none";
        statusMsg.textContent = "";
        document.documentElement.style.overflow = "auto";
      }, 300);
    };

    closeSubmitBtn.addEventListener("click", closeSubmitModal);
    submitModal.addEventListener("click", (e) => {
      if (e.target === submitModal) closeSubmitModal();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeSubmitModal();
    });

    postForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("inCityName")?.value.trim();
      const desc = document.getElementById("postDescription")?.value.trim();
      const file = document.getElementById("postImage")?.files[0];

      if (!name || !desc || !file) {
        statusMsg.textContent = "Please fill out all fields.";
        return;
      }

      statusMsg.textContent = "Uploading...";

      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `${fileName}`;

        // Upload image to Supabase storage
        const { error: uploadError } = await supabase.storage
          .from('social-media')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public image URL
        const { data: publicData } = supabase
          .storage
          .from('social-media')
          .getPublicUrl(filePath);

        const imageUrl = publicData?.publicUrl;
        if (!imageUrl) throw new Error("Could not retrieve image URL");

        // Insert post record
        const { error: insertError } = await supabase
          .from("social_media_posts")
          .insert({
            name,
            description: desc,
            image_url: imageUrl
          });

        if (insertError) throw insertError;

        statusMsg.textContent = "✅ Post submitted successfully!";
        postForm.reset();
      } catch (err) {
        console.error(err);
        statusMsg.textContent = "❌ Upload failed. Please try again.";
      }
    });
  }
});

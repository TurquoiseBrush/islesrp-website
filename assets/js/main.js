async function syncUserProfile(session) {
  const user = session?.user;
  const meta = user?.user_metadata;

  if (!user || !meta) return;

  const discordId = meta.provider_id;
  const username = meta.full_name || meta.name || "Unknown";

  const { error } = await supabase
    .from("users")
    .upsert({
      id: user.id,
      discord_id: discordId,
      username: username,
    }, { onConflict: "id" });

  if (error) console.error("❌ Failed to sync user:", error.message);
  else console.log("✅ User synced");
}

async function fetchAndRenderPosts() {
  const grid = document.querySelector(".posts-grid");
  if (!grid) return;

  const { data: posts, error } = await supabase
    .from("social_media_posts")
    .select("id, name, description, image_url")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Failed to fetch posts:", error.message);
    return;
  }

  posts.forEach((post, i) => {
    const postDiv = document.createElement("div");
    postDiv.className = "post";
    postDiv.style = `--fade-delay: ${0.3 + i * 0.1}s`;

    postDiv.innerHTML = `
      <img src="${post.image_url}" alt="${post.name}" onclick="openModal('${post.image_url}', '${post.name}', \`${post.description}\`)" style="cursor: pointer;" />
      <div class="post-details">
        <h3>${post.name}</h3>
        <p>${post.description}</p>
      </div>
    `;

    grid.appendChild(postDiv);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  console.log("✅ main.js loaded");

  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const authInfo = document.getElementById("authInfo");
  const userInfo = document.getElementById("userInfo");
  const openSubmitModalBtn = document.getElementById("openSubmitModal");

  const submitModal = document.getElementById("submitModal");
  const postForm = document.getElementById("postForm");
  const statusMsg = document.getElementById("submissionStatus");
  const closeSubmitBtn = submitModal?.querySelector(".close");

  const modal = document.getElementById("imageModal");
  const modalImg = document.getElementById("modalImage");
  const modalTitle = document.getElementById("modalTitle");
  const modalDescription = document.getElementById("modalDescription");
  const closeModalButton = modal?.querySelector(".close");

  loginBtn?.addEventListener("click", async () => {
    localStorage.setItem("returnTo", window.location.pathname);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}/auth-handler.html`
      }
    });
    if (error) console.error("❌ Discord login failed:", error.message);
  });

  logoutBtn?.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.reload();
  });

  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  const meta = user?.user_metadata;
  const discordId = meta?.provider_id;
  const username = meta?.full_name || meta?.name || "Unknown";

  if (session) await syncUserProfile(session);

  if (user) {
    authInfo.style.display = "block";
    userInfo.textContent = `✅ Logged in as ${username}`;
    loginBtn?.style?.setProperty("display", "none");

    const { data: userData, error: roleError } = await supabase
      .from("users")
      .select("role, banned")
      .eq("id", user.id)
      .single();

    if (roleError) {
      console.warn("⚠️ Could not fetch user role:", roleError.message);
    } else {
      const { role, banned } = userData;

      if (banned) {
        console.warn("🚫 You are banned from posting.");
        openSubmitModalBtn?.remove();
      } else if (["admin", "media"].includes(role)) {
        openSubmitModalBtn.style.display = "inline-block";
      } else {
        openSubmitModalBtn.style.display = "none";
      }
    }
  } else {
    authInfo.style.display = "none";
    openSubmitModalBtn?.style?.setProperty("display", "none");
    loginBtn?.style?.setProperty("display", "inline-block");
  }

  await fetchAndRenderPosts();

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
    closeModalButton?.addEventListener("click", closeModal);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });
  }

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

    closeSubmitBtn?.addEventListener("click", closeSubmitModal);
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
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('social-media')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase
          .storage.from('social-media')
          .getPublicUrl(filePath);

        const imageUrl = publicData?.publicUrl;
        if (!imageUrl) throw new Error("Could not retrieve image URL");

        const { error: insertError } = await supabase
          .from("social_media_posts")
          .insert({
            name,
            description: desc,
            image_url: imageUrl,
            user_id: user?.id
          });

        if (insertError) throw insertError;

        statusMsg.textContent = "✅ Post submitted successfully!";
        postForm.reset();
        await fetchAndRenderPosts(); // Refresh with new post
      } catch (err) {
        console.error("❌ Upload failed:", err);
        statusMsg.textContent = "❌ Upload failed. Please try again.";
      }
    });
  }
});

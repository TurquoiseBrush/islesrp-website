async function syncUserProfile(session) {
  const user = session?.user;
  const meta = user?.user_metadata;
  if (!user || !meta) return;

  const discordId = meta.provider_id;
  const username = meta.full_name || meta.name || "Unknown";

  const { error } = await supabase
    .from("users")
    .upsert({ id: user.id, discord_id: discordId, username }, { onConflict: "id" });

  if (error) console.error("❌ Failed to sync user:", error.message);
  else console.log("✅ User synced");
}

// Helper to return a badge HTML based on user role
function getBadgeForRole(role) {
  if (role === 'admin') {
    return '<span class="badge badge-admin">Admin</span>';
  } else if (role === 'media') {
    return '<span class="badge badge-media">Media</span>';
  } else {
    return ''; // No badge for regular users
  }
}

async function fetchAndRenderPosts() {
  const grid = document.querySelector(".posts-grid");
  if (!grid) return;

  grid.innerHTML = ""; // Clear current posts

  // Query posts with a join to fetch the posting user's username and role
  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, title, description, image_url, created_at, user:users(username, role)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Failed to fetch posts:", error.message);
    return;
  }

  posts.forEach((post, i) => {
    const postDiv = document.createElement("div");
    postDiv.className = "post";
    postDiv.style = `--fade-delay: ${0.3 + i * 0.1}s`;

    // Get the poster's information from the joined users data
    const posterName = post.user?.username || "Unknown";
    const posterRole = post.user?.role || "";
    const roleBadge = getBadgeForRole(posterRole);
    const postTitle = post.title;

    postDiv.innerHTML = `
      <div class="poster-info">
        <span class="poster-name">${posterName}</span> ${roleBadge}
      </div>
      <img src="${post.image_url}" alt="${postTitle}" onclick="openModal('${post.image_url}', '${postTitle}', \`${post.description}\`)" style="cursor: pointer;" />
      <div class="post-details">
        <h3>${postTitle}</h3>
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

  // Auth
  loginBtn?.addEventListener("click", async () => {
    localStorage.setItem("returnTo", window.location.pathname);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo: `${window.location.origin}/auth-handler.html` }
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
  const username = meta?.full_name || meta?.name || "Unknown";

  if (session) await syncUserProfile(session);

  if (user) {
    authInfo.style.display = "block";
    userInfo.textContent = `✅ Logged in as ${username}`;
    loginBtn?.style.setProperty("display", "none");

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
        openSubmitModalBtn?.remove();
        console.warn("🚫 You are banned from posting.");
      } else if (["admin", "media"].includes(role)) {
        openSubmitModalBtn.style.display = "inline-block";
      } else {
        openSubmitModalBtn.style.display = "none";
      }
    }
  } else {
    authInfo.style.display = "none";
    openSubmitModalBtn?.style.setProperty("display", "none");
    loginBtn?.style.setProperty("display", "inline-block");
  }

  await fetchAndRenderPosts();

  // Modal viewer
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

  // Submit post
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

    postForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Updated input: use "postTitle" for the post title field
      const title = document.getElementById("postTitle")?.value.trim();
      const desc = document.getElementById("postDescription")?.value.trim();
      const imageUrl = document.getElementById("postImageUrl")?.value.trim();

      if (!title || !desc || !imageUrl) {
        statusMsg.textContent = "Please fill out all fields.";
        return;
      }

      if (!/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(imageUrl)) {
        statusMsg.textContent = "❌ Invalid image URL. Must end with .jpg, .png, etc.";
        return;
      }

      statusMsg.textContent = "Submitting...";

      try {
        const { error: insertError } = await supabase
          .from("posts")
          .insert({
            title,
            description: desc,
            image_url: imageUrl,
            user_id: user?.id
          });

        if (insertError) throw insertError;

        statusMsg.textContent = "✅ Post submitted successfully!";
        postForm.reset();
        await fetchAndRenderPosts();
      } catch (err) {
        console.error("❌ Upload failed:", err);
        statusMsg.textContent = "❌ Upload failed. Please try again.";
      }
    });
  }
});

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


async function fetchAndRenderPosts() {
  const grid = document.querySelector(".posts-grid");
  if (!grid) return;

  grid.innerHTML = "";

  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, title, description, image_url, created_at, display_name, user:users(username, role)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Failed to fetch posts:", error.message);
    return;
  }

  posts.forEach((post, i) => {
    const postDiv = document.createElement("div");
    postDiv.className = "post";
    postDiv.style = `--fade-delay: ${0.3 + i * 0.1}s`;

    const displayName = post.display_name || post.user?.username || "Unknown";
    const userRole = post.user?.role || "";
    let roleSuffix = "";

    if (userRole === "admin") {
      roleSuffix = " (ADMIN 👑)";
    } else if (userRole === "media") {
      roleSuffix = " (MEDIA TEAM 📸)";
    } else if (userRole.toLowerCase() === "site dev") { // or use strict "Site Dev" if you want to be case-sensitive
      roleSuffix = " (SITE DEV 🛠️)";
    }


    const postTitle = post.title || "";
    const postDescription = post.description || "";

    postDiv.innerHTML = `
      <div class="poster-info">
        <span class="poster-name">${displayName}${roleSuffix}</span>
      </div>
      <img src="${post.image_url}" alt="${postTitle}" onclick="openModal('${post.image_url}', '${postTitle}', \`${postDescription}\`)" style="cursor: pointer;" />
      <div class="post-details">
        <h3>${postTitle}</h3>
        <p>${postDescription}</p>
      </div>
    `;
    grid.appendChild(postDiv);
  });
}


// ===== Updated: Populate Display Name Select ===== //
async function populateDisplayNameSelect() {
  const displaySelect = document.getElementById("displayNameSelect");
  if (!displaySelect) {
    console.error("No displayNameSelect element found.");
    return;
  }
  displaySelect.innerHTML = ""; // Clear previous options

  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) {
    console.error("No user session found.");
    return;
  }

  // Always fetch characters for the user
  const { data: characters, error: charError } = await supabase
    .from("characters")
    .select("character_name")
    .eq("user_id", user.id);
  if (charError) {
    console.error("Failed to fetch characters:", charError.message);
  }

  if (characters && characters.length > 0) {
    characters.forEach(char => {
      const option = document.createElement("option");
      option.value = char.character_name;
      option.textContent = char.character_name;
      displaySelect.appendChild(option);
    });
  } else {
    // If no characters exist, add a default option (non-disabled so it can be selected)
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No characters found";
    displaySelect.appendChild(option);
  }

  // Fetch user role from the custom users table and add extra option if admin or media.
  const { data: userData, error: roleError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (roleError) {
    console.warn("Could not fetch user role:", roleError.message);
    return;
  }
  const role = userData.role;
  console.log("User role:", role);

  // Add extra option based on role
  if (role === "admin") {
    const option = document.createElement("option");
    option.value = "ADMIN";
    option.textContent = "ADMIN";
    displaySelect.appendChild(option);
  } else if (role === "media") {
    const option = document.createElement("option");
    option.value = "NEWS";
    option.textContent = "NEWS";
    displaySelect.appendChild(option);
  } else if (role.toLowerCase() === "site dev") {
    const option = document.createElement("option");
    option.value = "SITE DEV";
    option.textContent = "SITE DEV";
    displaySelect.appendChild(option);
  }

}

/* ================= Character Management Functions ================= */

// Fetch characters for a user
async function fetchUserCharacters(userId) {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('user_id', userId);
  if (error) {
    console.error("❌ Failed to fetch characters:", error.message);
    return [];
  }
  return data;
}

// Add a new character for a user
async function addCharacter(userId, characterName) {
  const { data, error } = await supabase
    .from('characters')
    .insert({ user_id: userId, character_name: characterName });
  if (error) {
    console.error("❌ Failed to add character:", error.message);
    return null;
  }
  return data;
}

// Update a character's name
async function updateCharacter(characterId, newName) {
  const { data, error } = await supabase
    .from('characters')
    .update({ character_name: newName })
    .eq('id', characterId);
  if (error) {
    console.error("❌ Failed to update character:", error.message);
    return null;
  }
  return data;
}

// Delete a character
async function deleteCharacter(characterId) {
  const { data, error } = await supabase
    .from('characters')
    .delete()
    .eq('id', characterId);
  if (error) {
    console.error("❌ Failed to delete character:", error.message);
    return null;
  }
  return data;
}

// Render character list in the character management modal
function renderCharacterList(characters) {
  const characterList = document.getElementById("characterList");
  if (!characterList) return;
  characterList.innerHTML = "";

  if (characters.length === 0) {
    characterList.innerHTML = "<p>No characters added yet.</p>";
    return;
  }

  characters.forEach((char) => {
    const charDiv = document.createElement("div");
    charDiv.className = "character-item";
    charDiv.innerHTML = `
      <span class="character-name">${char.character_name}</span>
      <button class="btn edit-char" data-id="${char.id}">Edit</button>
      <button class="btn delete-char" data-id="${char.id}">Delete</button>
    `;
    characterList.appendChild(charDiv);
  });

  // Add event listeners for edit and delete buttons
  document.querySelectorAll(".edit-char").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const charId = e.target.getAttribute("data-id");
      const currentName = e.target.parentElement.querySelector(".character-name").textContent;
      const newName = prompt("Enter new name:", currentName);
      if (newName && newName.trim() !== "") {
        await updateCharacter(charId, newName.trim());
        loadAndRenderCharacters();
      }
    });
  });

  document.querySelectorAll(".delete-char").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const charId = e.target.getAttribute("data-id");
      if (confirm("Are you sure you want to delete this character?")) {
        await deleteCharacter(charId);
        loadAndRenderCharacters();
      }
    });
  });
}

// Load characters for the current user and render them
async function loadAndRenderCharacters() {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return;
  const characters = await fetchUserCharacters(user.id);
  renderCharacterList(characters);
}

// Modal open/close handlers for character management
function openCharacterModal() {
  const characterModal = document.getElementById("characterModal");
  if (!characterModal) return;
  characterModal.style.display = "flex";
  requestAnimationFrame(() => characterModal.classList.add("show"));
  document.documentElement.style.overflow = "hidden";
  loadAndRenderCharacters();
}

function closeCharacterModal() {
  const characterModal = document.getElementById("characterModal");
  if (!characterModal) return;
  characterModal.classList.remove("show");
  setTimeout(() => {
    characterModal.style.display = "none";
    document.documentElement.style.overflow = "auto";
  }, 200);
}

/* ================= End Character Management Functions ================= */

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

  console.log("✅ Session:", session);
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
      } else if (["admin", "media", "user", "site dev"].includes(role)) {
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

  // Modal viewer for images
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
    openSubmitModalBtn.addEventListener("click", async () => {
      submitModal.style.display = "flex";
      requestAnimationFrame(() => submitModal.classList.add("show"));
      // Populate the display name dropdown when opening the modal
      await populateDisplayNameSelect();
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

      const title = document.getElementById("postTitle")?.value.trim();
      const desc = document.getElementById("postDescription")?.value.trim();
      const imageUrl = document.getElementById("postImageUrl")?.value.trim();
      const displayName = document.getElementById("displayNameSelect")?.value.trim();

      console.log("Submitting post:", { title, desc, imageUrl, displayName, user_id: user?.id });

      if (!title || !desc || !imageUrl || !displayName) {
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
            user_id: user?.id,
            display_name: displayName
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

  /* ========== Character Management Setup ========== */
  const openCharacterModalBtn = document.getElementById("openCharacterModal");
  if (openCharacterModalBtn) {
    openCharacterModalBtn.addEventListener("click", openCharacterModal);
  }

  const characterForm = document.getElementById("characterForm");
  if (characterForm) {
    characterForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const newCharName = document.getElementById("newCharacterName")?.value.trim();
      if (!newCharName) {
        alert("Please enter a character name.");
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user;
      if (!currentUser) {
        alert("You must be logged in to add a character.");
        return;
      }
      await addCharacter(currentUser.id, newCharName);
      document.getElementById("newCharacterName").value = "";
      loadAndRenderCharacters();
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
    console.log("IslesRP Linktree page loaded.");
  
    // Select all links
    const links = document.querySelectorAll(".link");
  
    // Click Tracking
    links.forEach(link => {
      link.addEventListener("click", async (event) => {
        const linkText = event.target.innerText;
        const linkUrl = event.target.href;
        
        console.log(`Clicked: ${linkText} - ${linkUrl}`);
  
        // Send data to the backend
        try {
          await fetch("https://your-render-backend.onrender.com/track-click", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: linkText, url: linkUrl })
          });
        } catch (err) {
          console.error("Failed to log click:", err);
        }
  
        // Click animation effect
        event.target.classList.add("clicked");
        setTimeout(() => {
          event.target.classList.remove("clicked");
        }, 200);
      });
    });
  });
  
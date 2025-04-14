document.addEventListener("DOMContentLoaded", () => {
    console.log("IslesRP Linktree page loaded.");
  
    // Select all links
    const links = document.querySelectorAll(".link");
  
    // Click Tracking
    links.forEach(link => {
      link.addEventListener("click", (event) => {
        console.log(`Clicked: ${event.target.innerText} - ${event.target.href}`);
        
  
        // Visual effect (brief animation on click)
        event.target.classList.add("clicked");
        setTimeout(() => {
          event.target.classList.remove("clicked");
        }, 200);
      });
    });
  });
  
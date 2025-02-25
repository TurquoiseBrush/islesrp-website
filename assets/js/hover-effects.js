document.addEventListener('DOMContentLoaded', function() {
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
      button.addEventListener('mouseenter', () => {
        button.classList.add('hovered');
      });
      button.addEventListener('mouseleave', () => {
        button.classList.remove('hovered');
      });
    });
  });
  
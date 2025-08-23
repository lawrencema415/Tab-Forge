// Sidebar navigation
document.addEventListener('DOMContentLoaded', function() {
  const navBtns = document.querySelectorAll('.nav-btn');
  const sections = document.querySelectorAll('.section');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      navBtns.forEach(b => {
        if (b instanceof HTMLElement) {
          b.classList.remove('active');
        }
      });
      
      if (btn instanceof HTMLElement) {
        btn.classList.add('active');
      }

      sections.forEach(s => {
        if (s instanceof HTMLElement) {
          s.classList.remove('active');
        }
      });
      
      const sectionId = (btn as HTMLElement).dataset.section;
      if (sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
          section.classList.add('active');
        }
      }
    });
  });
});
// /js/ui/tabs.js
export function initTabButtons() {
  document.querySelectorAll('.tabButton').forEach((button) => {
    button.addEventListener('click', () => {
      console.log("tab button clicked");
      document.querySelectorAll('.tabContent').forEach((tab) => {
        tab.style.display = 'none';
      });
      document.querySelectorAll('.tabButton').forEach((btn) => {
        btn.classList.remove('active');
      });
      const targetId = button.getAttribute('data-tab');
      console.log(targetId);
      document.getElementById(targetId).style.display = 'block';
      button.classList.add('active');

      if (targetId === 'calendarTab' && window._calendarInstance) {
        setTimeout(() => {
          window._calendarInstance.updateSize();
          window.dispatchEvent(new Event('resize'));
        }, 100);
      }
      if (targetId === 'mapTab' && window._mapInstance) {
        console.log("TO THE MAP");
        console.log(window._mapInstance);
        setTimeout(() => {
          console.log("Invalidating size");
          window._mapInstance.invalidateSize()
        }, 50);
      }
    });
  });
}

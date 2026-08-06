/**
 * Breadcrumbs nav behaviour: horizontal-scroll fade indicators and
 * click-and-drag scrolling for the desktop breadcrumb trail.
 *
 * Moved out of sections/breadcrumbs.liquid's inline <script>. Holds no
 * Liquid — operates purely on [data-breadcrumbs-nav] elements already in
 * the DOM.
 */
(function () {
  function initBreadcrumbs() {
    const navs = document.querySelectorAll('[data-breadcrumbs-nav]');
    navs.forEach(nav => {
      if (nav.dataset.initialized) return;
      nav.dataset.initialized = 'true';

      const wrapper = nav.closest('.breadcrumbs-wrapper');
      if (!wrapper) return;

      const fadeLeft = wrapper.querySelector('.breadcrumbs-fade-left');
      const fadeRight = wrapper.querySelector('.breadcrumbs-fade-right');

      function updateFades() {
        const scrollLeft = nav.scrollLeft;
        const maxScroll = nav.scrollWidth - nav.clientWidth;
        const isOverflowing = nav.scrollWidth > nav.clientWidth;

        if (isOverflowing) {
          nav.classList.add('is-overflowing');
        } else {
          nav.classList.remove('is-overflowing');
        }

        if (fadeLeft) {
          if (scrollLeft > 4) {
            fadeLeft.classList.remove('opacity-0');
            fadeLeft.classList.add('opacity-100');
          } else {
            fadeLeft.classList.remove('opacity-100');
            fadeLeft.classList.add('opacity-0');
          }
        }

        if (fadeRight) {
          if (isOverflowing && scrollLeft < maxScroll - 4) {
            fadeRight.classList.remove('opacity-0');
            fadeRight.classList.add('opacity-100');
          } else {
            fadeRight.classList.remove('opacity-100');
            fadeRight.classList.add('opacity-0');
          }
        }
      }

      // Scroll listener
      nav.addEventListener('scroll', updateFades);
      window.addEventListener('resize', updateFades);

      if (window.ResizeObserver) {
        new ResizeObserver(updateFades).observe(nav);
      }

      // Drag to scroll
      let isDown = false;
      let startX;
      let scrollLeftVal;
      let hasMoved = false;

      nav.addEventListener('mousedown', (e) => {
        isDown = true;
        hasMoved = false;
        nav.classList.add('active-dragging');
        startX = e.pageX - nav.offsetLeft;
        scrollLeftVal = nav.scrollLeft;
      });

      nav.addEventListener('mouseleave', () => {
        isDown = false;
        nav.classList.remove('active-dragging');
      });

      nav.addEventListener('mouseup', () => {
        isDown = false;
        nav.classList.remove('active-dragging');
      });

      nav.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        const x = e.pageX - nav.offsetLeft;
        const walk = (x - startX) * 1.5;
        if (Math.abs(x - startX) > 5) {
          hasMoved = true;
        }
        nav.scrollLeft = scrollLeftVal - walk;
      });

      // Prevent clicking links if we dragged
      nav.addEventListener('click', (e) => {
        if (hasMoved) {
          e.preventDefault();
          e.stopPropagation();
        }
      }, true);

      // Initialize state
      setTimeout(updateFades, 50);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBreadcrumbs);
  } else {
    initBreadcrumbs();
  }

  // Support shopify section load events in theme customizer
  document.addEventListener('shopify:section:load', function(e) {
    if (e.target.classList.contains('shopify-section-breadcrumbs') || e.target.querySelector('[data-breadcrumbs-nav]')) {
      initBreadcrumbs();
    }
  });
})();

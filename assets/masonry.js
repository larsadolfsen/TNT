(function() {
  function layoutMasonry() {
    const mainContent = document.getElementById('MainContent');
    if (!mainContent) return;

    const isDesktop = window.matchMedia('(min-width: 1200px)').matches;
    const isTablet = window.matchMedia('(min-width: 840px)').matches;

    const sections = Array.from(mainContent.children).filter(el => el.classList.contains('shopify-section'));

    // Sort sections by their computed CSS order property
    sections.sort((a, b) => {
      const orderA = parseInt(getComputedStyle(a).order) || 0;
      const orderB = parseInt(getComputedStyle(b).order) || 0;
      return orderA - orderB;
    });

    if (!isTablet && !isDesktop) {
      // Reset mobile layout
      mainContent.style.position = '';
      mainContent.style.height = '';
      sections.forEach(sec => {
        sec.style.position = '';
        sec.style.left = '';
        sec.style.top = '';
        sec.style.width = '';
      });
      return;
    }

    const styleRoot = getComputedStyle(document.documentElement);
    const styleMain = getComputedStyle(mainContent);
    const gap = parseInt(styleRoot.getPropertyValue('--grid-gap')) || parseInt(styleMain.getPropertyValue('--grid-gap')) || 24;
    const cols = isDesktop 
      ? (parseInt(styleRoot.getPropertyValue('--grid-cols-desktop')) || parseInt(styleMain.getPropertyValue('--grid-cols-desktop')) || 3) 
      : (parseInt(styleRoot.getPropertyValue('--grid-cols-tablet')) || parseInt(styleMain.getPropertyValue('--grid-cols-tablet')) || 2);

    const containerWidth = mainContent.getBoundingClientRect().width;
    const colWidth = (containerWidth - (cols - 1) * gap) / cols;

    const colHeights = Array(cols).fill(0);

    mainContent.style.position = 'relative';

    sections.forEach(sec => {
      const styleSec = getComputedStyle(sec);
      
      // Determine column span
      let colSpan = parseInt(styleSec.getPropertyValue('--col-span')) || cols;
      if (colSpan > cols) colSpan = cols;

      // Determine column start
      const colStartVal = styleSec.getPropertyValue('--col-start').trim();
      let targetCol = 0;
      if (colStartVal !== 'auto' && colStartVal !== '') {
        targetCol = parseInt(colStartVal) - 1;
        if (targetCol < 0) targetCol = 0;
        if (targetCol + colSpan > cols) {
          targetCol = cols - colSpan;
        }
      } else {
        // Find column with min height
        targetCol = colHeights.indexOf(Math.min(...colHeights));
      }

      const leftPos = targetCol * (colWidth + gap);
      const topPos = colHeights[targetCol];

      sec.style.position = 'absolute';
      sec.style.left = `${leftPos}px`;
      sec.style.top = `${topPos}px`;
      sec.style.width = `${colWidth * colSpan + gap * (colSpan - 1)}px`;

      // Get section height
      const sectionHeight = sec.getBoundingClientRect().height;
      
      // Update heights for all spanned columns
      for (let i = 0; i < colSpan; i++) {
        if (targetCol + i < cols) {
          colHeights[targetCol + i] = topPos + sectionHeight + gap;
        }
      }
    });

    mainContent.style.height = `${Math.max(...colHeights)}px`;
  }

  // Event Listeners
  window.addEventListener('resize', layoutMasonry);
  window.addEventListener('load', layoutMasonry);
  document.addEventListener('DOMContentLoaded', layoutMasonry);

  // Shopify Editor Event Listeners
  document.addEventListener('shopify:section:load', () => setTimeout(layoutMasonry, 50));
  document.addEventListener('shopify:section:unload', () => setTimeout(layoutMasonry, 50));
  document.addEventListener('shopify:section:reorder', () => setTimeout(layoutMasonry, 50));

  // Run immediately and periodically to handle loading images/styles
  layoutMasonry();
  let attempts = 0;
  const interval = setInterval(() => {
    layoutMasonry();
    if (++attempts > 15) clearInterval(interval);
  }, 250);
})();

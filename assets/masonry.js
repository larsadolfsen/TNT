(function() {
  function layoutMasonry() {
    const mainContent = document.getElementById('MainContent');
    if (!mainContent) return;

    const isDesktop = window.matchMedia('(min-width: 1200px)').matches;
    const isTablet = window.matchMedia('(min-width: 840px)').matches;

    const sections = Array.from(mainContent.children).filter(el => el.classList.contains('shopify-section'));

    // Assign original DOM indices to sections
    sections.forEach((sec, idx) => {
      sec.originalIndex = idx;
    });

    // Sort sections by computed CSS order with DOM index fallback
    sections.sort((a, b) => {
      const styleOrderA = getComputedStyle(a).order;
      const orderA = (styleOrderA === '0' || styleOrderA === 'auto') ? a.originalIndex : parseInt(styleOrderA);
      
      const styleOrderB = getComputedStyle(b).order;
      const orderB = (styleOrderB === '0' || styleOrderB === 'auto') ? b.originalIndex : parseInt(styleOrderB);

      if (orderA === orderB) {
        return a.originalIndex - b.originalIndex;
      }
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

    const paddingLeft = parseFloat(styleMain.paddingLeft) || 0;
    const paddingRight = parseFloat(styleMain.paddingRight) || 0;
    const containerWidthFull = mainContent.getBoundingClientRect().width;
    const containerWidth = containerWidthFull - paddingLeft - paddingRight;
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
        // Find the starting column index (from 0 to cols - colSpan)
        // that minimizes the maximum height among the spanned columns.
        let minSpanHeight = Infinity;
        let bestCol = 0;
        for (let c = 0; c <= cols - colSpan; c++) {
          let maxH = 0;
          for (let i = 0; i < colSpan; i++) {
            maxH = Math.max(maxH, colHeights[c + i]);
          }
          if (maxH < minSpanHeight) {
            minSpanHeight = maxH;
            bestCol = c;
          }
        }
        targetCol = bestCol;
      }

      let leftPos, widthPos;
      if (colSpan === cols) {
        leftPos = 0;
        widthPos = containerWidthFull;
      } else {
        leftPos = paddingLeft + targetCol * (colWidth + gap);
        widthPos = colWidth * colSpan + gap * (colSpan - 1);
      }
      
      // Find the maximum height among all columns spanned by this section
      let topPos = 0;
      for (let i = 0; i < colSpan; i++) {
        if (targetCol + i < cols) {
          topPos = Math.max(topPos, colHeights[targetCol + i]);
        }
      }

      sec.style.position = 'absolute';
      sec.style.left = `${leftPos}px`;
      sec.style.top = `${topPos}px`;
      sec.style.width = `${widthPos}px`;

      // Get section height
      const sectionHeight = sec.getBoundingClientRect().height;
      
      console.log(`[Masonry Debug] Section:`, sec.id || sec.className, {
        colSpan,
        targetCol,
        topPos,
        sectionHeight,
        leftPos
      });

      // Update heights for all spanned columns to the new end position (0 gap between rows)
      const newHeight = topPos + sectionHeight;
      for (let i = 0; i < colSpan; i++) {
        if (targetCol + i < cols) {
          colHeights[targetCol + i] = newHeight;
        }
      }
    });

    console.log(`[Masonry Debug] Final colHeights:`, colHeights);
    mainContent.style.height = `${Math.max(...colHeights)}px`;

    // Render visual debug overlay on screen
    let overlay = document.getElementById('masonry-debug-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'masonry-debug-overlay';
      overlay.style.cssText = 'position:fixed;bottom:10px;right:10px;background:rgba(0,0,0,0.85);color:#fff;padding:12px;font-family:monospace;font-size:10px;z-index:99999;max-width:320px;border-radius:6px;box-shadow:0 2px 10px rgba(0,0,0,0.3);line-height:1.4;';
      document.body.appendChild(overlay);
    }
    
    let sectionsLog = '';
    sections.forEach((sec, idx) => {
      sectionsLog += `<br>Sec ${idx}: left=${sec.style.left} width=${sec.style.width} h=${Math.round(sec.getBoundingClientRect().height)}px`;
    });

    overlay.innerHTML = `
      <b>Masonry Debug Panel (v1.0.71)</b><br>
      IsDesktop: ${isDesktop} | IsTablet: ${isTablet}<br>
      Cols: ${cols} | Gap: ${gap}px<br>
      ContainerWidth: ${Math.round(containerWidth)}px<br>
      ColWidth: ${Math.round(colWidth)}px<br>
      --grid-gap (:root): "${styleRoot.getPropertyValue('--grid-gap')}"<br>
      --grid-gap (#MainContent): "${styleMain.getPropertyValue('--grid-gap')}"<br>
      ${sectionsLog}
    `;
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

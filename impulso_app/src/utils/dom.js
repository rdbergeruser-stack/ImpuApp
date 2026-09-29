// DOM Utilities - Scroll preservation across reactive re-renders in vanilla SPA

export function setHtmlPreservingScroll(container, html) {
  if (!container) return;

  // 1. Capture scroll positions of main, window, container and all overflow elements
  const mainEl = container.querySelector('main');
  const mainScrollTop = mainEl ? mainEl.scrollTop : 0;
  const mainScrollLeft = mainEl ? mainEl.scrollLeft : 0;

  const containerScrollTop = container.scrollTop;
  const containerScrollLeft = container.scrollLeft;

  const winY = window.scrollY || window.pageYOffset || 0;
  const winX = window.scrollX || window.pageXOffset || 0;

  const scrollMap = new Map();
  const scrollIndexList = [];

  const scrollableElements = container.querySelectorAll('main, [class*="overflow-y-auto"], [class*="overflow-x-auto"], [class*="overflow-auto"], [class*="overflow-scroll"]');
  scrollableElements.forEach((el, idx) => {
    if (el.scrollTop > 0 || el.scrollLeft > 0) {
      if (el.id) {
        scrollMap.set(el.id, { top: el.scrollTop, left: el.scrollLeft });
      }
      scrollIndexList.push({
        idx,
        tagName: el.tagName,
        top: el.scrollTop,
        left: el.scrollLeft
      });
    }
  });

  // 2. Perform DOM HTML replacement
  container.innerHTML = html;

  // 3. Restore scroll positions
  const restore = () => {
    // Restore main element first
    const newMain = container.querySelector('main');
    if (newMain && (mainScrollTop > 0 || mainScrollLeft > 0)) {
      newMain.scrollTop = mainScrollTop;
      newMain.scrollLeft = mainScrollLeft;
    }

    // Restore container
    if (containerScrollTop > 0) container.scrollTop = containerScrollTop;
    if (containerScrollLeft > 0) container.scrollLeft = containerScrollLeft;

    // Restore by ID
    scrollMap.forEach((pos, id) => {
      const el = container.querySelector('#' + CSS.escape(id));
      if (el) {
        if (pos.top > 0) el.scrollTop = pos.top;
        if (pos.left > 0) el.scrollLeft = pos.left;
      }
    });

    // Restore by position index
    if (scrollIndexList.length > 0) {
      const newScrollableElements = container.querySelectorAll('main, [class*="overflow-y-auto"], [class*="overflow-x-auto"], [class*="overflow-auto"], [class*="overflow-scroll"]');
      scrollIndexList.forEach(item => {
        if (item.idx < newScrollableElements.length) {
          const candidate = newScrollableElements[item.idx];
          if (candidate && candidate.tagName === item.tagName) {
            if (item.top > 0) candidate.scrollTop = item.top;
            if (item.left > 0) candidate.scrollLeft = item.left;
          }
        }
      });
    }

    // Restore window
    if (winY > 0 || winX > 0) {
      window.scrollTo(winX, winY);
    }
  };

  // Immediate synchronous restore (before paint)
  restore();

  // Double-check on next animation frame
  requestAnimationFrame(() => {
    restore();
  });
}


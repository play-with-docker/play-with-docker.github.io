(() => {
  const CURRENT_PAGE_ATTRIBUTE = "data-current";
  const nodeListToArrar = (nodeList) => Array.prototype.slice.call(btns);

  const getContainerById = (paginatorId) => {
    return document.querySelector(".pages-container#" + paginatorId);
  };
  const getCurrentPageById = (paginatorId) => {
    const currentPage = getContainerById(paginatorId).getAttribute(
      CURRENT_PAGE_ATTRIBUTE
    );
    return parseInt(currentPage);
  };
  const setCurrentPageById = (paginatorId, pageIndex) => {
    const currentPage = getContainerById(paginatorId).setAttribute(
      CURRENT_PAGE_ATTRIBUTE,
      pageIndex
    );
    setInidicator(paginatorId, pageIndex)
  };
  const getPagesByContainerId = (paginatorId) => {
    return getContainerById(paginatorId).querySelectorAll(".page");
  };

  const showPage = (paginatorId, pageIndex) => {
    const pages = getPagesByContainerId(paginatorId);
    pages.forEach((p, i) => {
      if (pageIndex == i) {
        p.style.display = "block";
      } else {
        p.style.display = "none";
      }
    });
    setCurrentPageById(paginatorId, pageIndex);
  };

  const next = (paginatorId) => {
    const currentPage = getCurrentPageById(paginatorId);
    const pages = getPagesByContainerId(paginatorId);
    if (currentPage < pages.length - 1) {
      showPage(paginatorId, currentPage + 1);
    }
  };
  const prev = (paginatorId) => {
    const currentPage = getCurrentPageById(paginatorId);
    const pages = getPagesByContainerId(paginatorId);
    if (currentPage > 0) {
      showPage(paginatorId, currentPage - 1);
    }
  };

  const setLinks = (paginatorId) => {
    const nextButton = document.querySelector(
      `.paginator-next[data-paginator=${paginatorId}]`
    );
    if (nextButton) {
      nextButton.style.display = "initial";
      nextButton.addEventListener("click", () => {
        next(paginatorId);
      });
    }
    const prevButton = document.querySelector(
      `.paginator-prev[data-paginator=${paginatorId}]`
    );
    if (prevButton) {
      prevButton.style.display = "initial";
      prevButton.addEventListener("click", () => prev(paginatorId));
    }
  };

  const setInidicator = (paginatorId, pageIndex = 0) => {
    const total = getPagesByContainerId(paginatorId).length;
    const indicatorEl = document.querySelector(
      `.paginator-indicator[data-paginator=${paginatorId}]`
    );
    indicatorEl.innerHTML = pageIndex + 1 + "/" + total;
  };

  const createPaginator = (containerEl) => {
    const INITIAL_PAGE = 0;
    const paginatorId = containerEl.id;
    showPage(paginatorId, INITIAL_PAGE);
    setLinks(paginatorId);
    setInidicator(paginatorId, INITIAL_PAGE);
  };

  window.next = next;
  window.prev = prev;

  window.addEventListener("load", () => {
    const paginatorContainer = document.querySelector(".pages-container");

    paginatorContainer && createPaginator(paginatorContainer);
  });
})();

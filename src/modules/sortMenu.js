export function openSortMenu(sortToggle, sortMenu) {
  sortToggle.setAttribute("aria-expanded", "true");
  sortMenu.hidden = false;
  requestAnimationFrame(() => {
    sortMenu.classList.add("is-open");
  });
}

export function closeSortMenu(sortToggle, sortMenu) {
  sortToggle.setAttribute("aria-expanded", "false");
  sortMenu.classList.remove("is-open");

  const handleTransitionEnd = (event) => {
    if (event.target !== sortMenu || event.propertyName !== "opacity") {
      return;
    }

    sortMenu.hidden = true;
    sortMenu.removeEventListener("transitionend", handleTransitionEnd);
  };

  sortMenu.addEventListener("transitionend", handleTransitionEnd);
}

export function toggleSortMenu(sortToggle, sortMenu) {
  const isExpanded = sortToggle.getAttribute("aria-expanded") === "true";

  if (isExpanded) {
    closeSortMenu(sortToggle, sortMenu);
    return;
  }

  openSortMenu(sortToggle, sortMenu);
}

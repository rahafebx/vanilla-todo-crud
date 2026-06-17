import { $, ORIGINAL_OG_DESCRIPTION } from "./modules/dom.js";
import { loadState, saveState } from "./modules/storage.js";
import { loadTheme, applyTheme, loadColor, applyThemeColor } from "./modules/theme.js";
import {
  initDailyQuote,
  fetchAndDisplayQuote,
  displayQuote,
} from "./modules/quote.js";
import {
  render,
  setGreeting,
  syncFilterButtons,
} from "./modules/ui.js";
import { showToast } from "./modules/toast.js";
import {
  toggleSortMenu,
  closeSortMenu,
} from "./modules/sortMenu.js";
import { handleExport, handleImportFile } from "./modules/exportImport.js";
import {
  openShareQuoteModal,
  shareQuote,
  closeShareModal,
  copyQuoteToClipboard,
} from "./modules/share.js";
import { defaultState } from "./modules/state.js";
import { initCursor } from "./modules/cursor.js";

// State
let state = loadState();

// Helper Functions
function persistAndRender(save = true) {
  if (save) {
    saveState(state);
  }
  render(state, $, $.taskTemplate, persistAndRender, (msg, type) =>
    showToast(msg, type, 10000, $.toasts),
  );
}

function handleAddTask(event) {
  event.preventDefault();

  const title = $.taskInput.value.trim();

  if (!title) {
    return;
  }

  state.tasks.unshift({
    id: crypto.randomUUID(),
    title,
    completed: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  $.taskInput.value = "";
  persistAndRender();
}

function handleSearch(event) {
  state.search = event.target.value;
  render(state, $, $.taskTemplate, persistAndRender, (msg, type) =>
    showToast(msg, type, 10000, $.toasts),
  );
}

function handleSort(sortValue) {
  state.sort = sortValue;
  closeSortMenu($.sortToggle, $.sortMenu);
  persistAndRender(false);
}

function handleFilterChange(filter, button) {
  state.filter = filter;
  syncFilterButtons(state, button);
  render(state, $, $.taskTemplate, persistAndRender, (msg, type) =>
    showToast(msg, type, 10000, $.toasts),
  );
}

function handleThemeToggle(event) {
  applyTheme(event.target.checked ? "dark" : "light", $.themeToggle);
}

function handleDocumentClick(event) {
  if (!$.sortMenu.hidden && !event.target.closest(".sort-field")) {
    closeSortMenu($.sortToggle, $.sortMenu);
  }

  if (
    !$.shareModal.hidden &&
    !event.target.closest(".share-modal") &&
    !event.target.closest("#shareQuoteBtn")
  ) {
    closeShareModal(
      $.overlay,
      $.shareModal,
      $.ogDescriptionMeta,
      ORIGINAL_OG_DESCRIPTION,
    );
  }
}

function handleDocumentKeydown(event) {
  if (event.key === "Escape") {
    closeSortMenu($.sortToggle, $.sortMenu);
    closeShareModal(
      $.overlay,
      $.shareModal,
      $.ogDescriptionMeta,
      ORIGINAL_OG_DESCRIPTION,
    );
  }

  if (event.key.toLowerCase() === "q" && event.shiftKey) {
    openShareQuoteModal(
      $.quoteText.textContent,
      $.quoteAuthor.textContent,
      $.overlay,
      $.shareModal,
      (msg, type) => showToast(msg, type, 10000, $.toasts),
      $.ogDescriptionMeta,
      ORIGINAL_OG_DESCRIPTION,
    );
  }

  if (event.key.toLowerCase() === "c" && event.shiftKey) {
    copyQuoteToClipboard(
      $.quoteText.textContent,
      $.quoteAuthor.textContent,
      (msg, type) => showToast(msg, type, 10000, $.toasts),
      $.copyQuoteBtnText,
    );
  }

  if (
    event.shiftKey &&
    (event.key === "ArrowDown" || event.key === "ArrowUp")
  ) {
    const newSort = event.key === "ArrowDown" ? "created-desc" : "created-asc";
    state.sort = newSort;
    closeSortMenu($.sortToggle, $.sortMenu);
    persistAndRender(false);
  }
}

// Initialization
function init() {
  setGreeting($.greeting);
  const theme = loadTheme();
  applyTheme(theme, $.themeToggle);
  const color = loadColor();
  applyThemeColor(color, $.colorOptions);
  syncFilterButtons(state);
  initDailyQuote(
    $.quoteText,
    $.quoteAuthor,
    $.shareQuoteBtn,
    displayQuote,
    fetchAndDisplayQuote,
  );
  persistAndRender();

  initCursor($.dot);

  $.taskForm.addEventListener("submit", handleAddTask);
  $.searchInput.addEventListener("input", handleSearch);
  $.themeToggle.addEventListener("change", handleThemeToggle);
  $.colorOptions.forEach((btn) => {
    btn.addEventListener("click", () => {
      applyThemeColor(btn.dataset.color, $.colorOptions);
    });
  });
  $.sortToggle.addEventListener("click", () =>
    toggleSortMenu($.sortToggle, $.sortMenu),
  );

  $.sortMenu.querySelectorAll("[data-sort]").forEach((option) => {
    option.addEventListener("click", () => handleSort(option.dataset.sort));
  });

  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("keydown", handleDocumentKeydown);

  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () =>
      handleFilterChange(button.dataset.filter, button),
    );
  });

  if ($.exportBtn)
    $.exportBtn.addEventListener("click", () => handleExport(state));
  if ($.importBtn && $.importFileInput) {
    $.importBtn.addEventListener("click", () =>
      $.importFileInput.click(),
    );
    $.importFileInput.addEventListener("change", (e) =>
      handleImportFile(e, state, persistAndRender, (msg, type) =>
        showToast(msg, type, 10000, $.toasts),
      ),
    );
  }

  if ($.shareQuoteBtn) {
    $.shareQuoteBtn.addEventListener("click", () =>
      openShareQuoteModal(
        $.quoteText.textContent,
        $.quoteAuthor.textContent,
        $.overlay,
        $.shareModal,
        (msg, type) => showToast(msg, type, 10000, $.toasts),
        $.ogDescriptionMeta,
        ORIGINAL_OG_DESCRIPTION,
      ),
    );
  }

  $.shareQuoteBtns.forEach((btn) => {
    btn.addEventListener("click", () =>
      shareQuote(
        $.quoteText.textContent,
        $.quoteAuthor.textContent,
        btn.dataset.platform,
        $.overlay,
        $.shareModal,
      ),
    );
  });

  $.copyQuoteBtn.addEventListener("click", () => {
    copyQuoteToClipboard(
      $.quoteText.textContent,
      $.quoteAuthor.textContent,
      (msg, type) => showToast(msg, type, 10000, $.toasts),
      $.copyQuoteBtnText,
    );
  });

  if ($.closeShareModalBtn) {
    $.closeShareModalBtn.addEventListener("click", () =>
      closeShareModal(
        $.overlay,
        $.shareModal,
        $.ogDescriptionMeta,
        ORIGINAL_OG_DESCRIPTION,
      ),
    );
  }
}

// Start the app
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

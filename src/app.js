import { loadState, saveState } from './modules/storage.js';
import { loadTheme, applyTheme, getSystemTheme } from './modules/theme.js';
import { initDailyQuote, fetchAndDisplayQuote, displayQuote } from './modules/quote.js';
import { render, setGreeting, syncFilterButtons, showToast, toggleSortMenu, closeSortMenu } from './modules/ui.js';
import { handleExport, handleImportFile } from './modules/exportImport.js';
import { openShareQuoteModal, shareQuote, closeShareModal } from './modules/share.js';
import { defaultState } from './modules/constants.js';

// DOM Elements
const elements = {
  taskForm: document.querySelector("#taskForm"),
  taskInput: document.querySelector("#taskInput"),
  taskList: document.querySelector("#taskList"),
  searchInput: document.querySelector("#searchInput"),
  sortToggle: document.querySelector("#sortToggle"),
  sortLabel: document.querySelector("#sortLabel"),
  sortMenu: document.querySelector("#sortMenu"),
  themeToggle: document.querySelector("#themeToggle"),
  greeting: document.querySelector("#greeting"),
  taskSummary: document.querySelector("#taskSummary"),
  statTotal: document.querySelector("#stat-total"),
  statOpen: document.querySelector("#stat-open"),
  statDone: document.querySelector("#stat-done"),
  personalProgress: document.querySelector("#personalProgress"),
  quoteText: document.querySelector("#quoteText"),
  quoteAuthor: document.querySelector("#quoteAuthor"),
  exportBtn: document.querySelector("#exportBtn"),
  importBtn: document.querySelector("#importBtn"),
  importFileInput: document.querySelector("#importFile"),
  toasts: document.querySelector("#toasts"),
  shareQuoteBtn: document.querySelector("#shareQuoteBtn"),
  shareModal: document.querySelector("#shareModal"),
  overlay: document.querySelector("#overlay"),
};

const taskTemplate = document.querySelector("#taskTemplate");
const shareQuoteBtns = document.querySelectorAll(".share-quote-btn");
const closeShareModalBtn = document.querySelector("#closeShareModal");

// State
let state = loadState();

// Helper Functions
function persistAndRender(save = true) {
  if (save) {
    saveState(state);
  }
  render(state, elements, taskTemplate, persistAndRender, (msg, type) => showToast(msg, type, 10000, elements.toasts));
}

function handleAddTask(event) {
  event.preventDefault();

  const title = elements.taskInput.value.trim();

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

  elements.taskInput.value = "";
  persistAndRender();
}

function handleSearch(event) {
  state.search = event.target.value;
  render(state, elements, taskTemplate, persistAndRender, (msg, type) => showToast(msg, type, 10000, elements.toasts));
}

function handleSort(sortValue) {
  state.sort = sortValue;
  closeSortMenu(elements.sortToggle, elements.sortMenu);
  persistAndRender(false);
}

function handleFilterChange(filter, button) {
  state.filter = filter;
  syncFilterButtons(state, button);
  render(state, elements, taskTemplate, persistAndRender, (msg, type) => showToast(msg, type, 10000, elements.toasts));
}

function handleThemeToggle(event) {
  applyTheme(event.target.checked ? "dark" : "light", elements.themeToggle);
}

function handleDocumentClick(event) {
  if (!elements.sortMenu.hidden && !event.target.closest(".sort-field")) {
    closeSortMenu(elements.sortToggle, elements.sortMenu);
  }

  if (!elements.shareModal.hidden && !event.target.closest(".share-modal") && !event.target.closest("#shareQuoteBtn")) {
    closeShareModal(elements.overlay, elements.shareModal);
  }
}

function handleDocumentKeydown(event) {
  if (event.key === "Escape") {
    closeSortMenu(elements.sortToggle, elements.sortMenu);
  }
}

// Initialization
function init() {
  setGreeting(elements.greeting);
  const theme = loadTheme();
  applyTheme(theme, elements.themeToggle);
  syncFilterButtons(state);
  initDailyQuote(
    elements.quoteText, 
    elements.quoteAuthor, 
    elements.shareQuoteBtn, 
    displayQuote, 
    fetchAndDisplayQuote
  );
  persistAndRender();

  elements.taskForm.addEventListener("submit", handleAddTask);
  elements.searchInput.addEventListener("input", handleSearch);
  elements.themeToggle.addEventListener("change", handleThemeToggle);
  elements.sortToggle.addEventListener("click", () => toggleSortMenu(elements.sortToggle, elements.sortMenu));

  elements.sortMenu.querySelectorAll("[data-sort]").forEach((option) => {
    option.addEventListener("click", () => handleSort(option.dataset.sort));
  });

  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("keydown", handleDocumentKeydown);

  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => handleFilterChange(button.dataset.filter, button));
  });

  if (elements.exportBtn) elements.exportBtn.addEventListener("click", () => handleExport(state));
  if (elements.importBtn && elements.importFileInput) {
    elements.importBtn.addEventListener("click", () => elements.importFileInput.click());
    elements.importFileInput.addEventListener("change", (e) => handleImportFile(e, state, persistAndRender, (msg, type) => showToast(msg, type, 10000, elements.toasts)));
  }

  if (elements.shareQuoteBtn) {
    elements.shareQuoteBtn.addEventListener("click", () => openShareQuoteModal(
      elements.quoteText.textContent, 
      elements.quoteAuthor.textContent, 
      elements.overlay, 
      elements.shareModal,
      (msg, type) => showToast(msg, type, 10000, elements.toasts)
    ));
  }
  
  shareQuoteBtns.forEach((btn) => {
    btn.addEventListener("click", () => shareQuote(
      elements.quoteText.textContent, 
      elements.quoteAuthor.textContent, 
      btn.dataset.platform,
      elements.overlay,
      elements.shareModal
    ));
  });
  
  if (closeShareModalBtn) {
    closeShareModalBtn.addEventListener("click", () => closeShareModal(elements.overlay, elements.shareModal));
  }
}

// Start the app
init();
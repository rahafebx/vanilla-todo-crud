const STORAGE_KEY = "todo-ebx-state";
const THEME_KEY = "todo-ebx-theme";
const QUOTE_STORAGE_KEY = "todo-ebx-quote";
const QUOTE_API = "https://quotesapi.prayushadhikari.com.np/api/quotes?category=inspiration-quotes&limit=1";

// This file keeps all app data in one plain object so saving and rendering stay simple.
const defaultState = {
  tasks: [
    {
      id: crypto.randomUUID(),
      title: "Gym workout",
      completed: false,
      createdAt: Date.now() - 1000 * 60 * 60 * 6,
      updatedAt: Date.now() - 1000 * 60 * 60 * 6,
    },
    {
      id: crypto.randomUUID(),
      title: "New UI improvement",
      completed: false,
      createdAt: Date.now() - 1000 * 60 * 60 * 2,
      updatedAt: Date.now() - 1000 * 60 * 60 * 2,
    },
  ],
  filter: "all",
  search: "",
  sort: "created-desc",
};

const state = loadState();

const taskForm = document.querySelector("#taskForm");
const taskInput = document.querySelector("#taskInput");
const taskList = document.querySelector("#taskList");
const taskTemplate = document.querySelector("#taskTemplate");
const searchInput = document.querySelector("#searchInput");
const sortToggle = document.querySelector("#sortToggle");
const sortLabel = document.querySelector("#sortLabel");
const sortMenu = document.querySelector("#sortMenu");
const themeToggle = document.querySelector("#themeToggle");
const greeting = document.querySelector("#greeting");
const taskSummary = document.querySelector("#taskSummary");
const statTotal = document.querySelector("#stat-total");
const statOpen = document.querySelector("#stat-open");
const statDone = document.querySelector("#stat-done");
const personalProgress = document.querySelector("#personalProgress");
const quoteText = document.querySelector("#quoteText");
const quoteAuthor = document.querySelector("#quoteAuthor");
const exportBtn = document.querySelector("#exportBtn");
const importBtn = document.querySelector("#importBtn");
const importFileInput = document.querySelector("#importFile");
const toasts = document.querySelector("#toasts");
const shareQuoteBtn = document.querySelector("#shareQuoteBtn");
const shareModal = document.querySelector("#shareModal");
const shareQuoteBtns = document.querySelectorAll(".share-quote-btn");
const closeShareModalBtn = document.querySelector("#closeShareModal");
const overlay = document.querySelector("#overlay");

init();

function init() {
  setGreeting();
  applyTheme(loadTheme());
  syncFilterButtons();
  initDailyQuote();
  render();

  taskForm.addEventListener("submit", handleAddTask);
  searchInput.addEventListener("input", handleSearch);
  themeToggle.addEventListener("change", handleThemeToggle);
  sortToggle.addEventListener("click", toggleSortMenu);

  sortMenu.querySelectorAll("[data-sort]").forEach((option) => {
    option.addEventListener("click", () => handleSort(option.dataset.sort));
  });

  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("keydown", handleDocumentKeydown);

  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => handleFilterChange(button.dataset.filter, button));
  });

  if (exportBtn) exportBtn.addEventListener("click", handleExport);
  if (importBtn && importFileInput) {
    importBtn.addEventListener("click", () => importFileInput.click());
    importFileInput.addEventListener("change", handleImportFile);
  }

    if (shareQuoteBtn) {
    shareQuoteBtn.addEventListener("click", () => openShareQuoteModal(quoteText.textContent, quoteAuthor.textContent));
  }
  shareQuoteBtns.forEach((btn) => {
    btn.addEventListener("click", () => shareQuote(quoteText.textContent, quoteAuthor.textContent, btn.dataset.platform));
  });
  closeShareModalBtn.addEventListener("click", closeShareModal);
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return structuredClone(defaultState);
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(defaultState),
      ...parsed,
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : structuredClone(defaultState.tasks),
    };
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadTheme() {
  return localStorage.getItem(THEME_KEY) || getSystemTheme();
}

function getSystemTheme() {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeToggle.checked = theme === "dark";
  localStorage.setItem(THEME_KEY, theme);
  themeToggle.setAttribute("aria-label", `Activate ${theme === "dark" ? "light" : "dark"} mode`);
  themeToggle.parentElement.querySelector("span").textContent = theme === "dark" ? "Light Mode" : "Dark Mode";
}

function setGreeting() {
  const hour = new Date().getHours();
  const period = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  greeting.textContent = `Good ${period}.`;
}

function handleAddTask(event) {
  event.preventDefault();

  const title = taskInput.value.trim();

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

  taskInput.value = "";
  persistAndRender();
}

function handleSearch(event) {
  state.search = event.target.value;
  render();
}

function handleSort(sortValue) {
  state.sort = sortValue;
  closeSortMenu();
  persistAndRender(false);
}

function handleFilterChange(filter, button) {
  state.filter = filter;
  syncFilterButtons(button);
  render();
}

function handleThemeToggle(event) {
  applyTheme(event.target.checked ? "dark" : "light");
}

function persistAndRender(save = true) {
  if (save) {
    saveState();
  }
  render();
}

function render() {
  saveState();

  const filteredTasks = getVisibleTasks();
  const total = state.tasks.length;
  const open = state.tasks.filter((task) => !task.completed).length;
  const done = total - open;

  statTotal.textContent = String(total);
  statOpen.textContent = String(open);
  statDone.textContent = String(done);
  taskSummary.textContent = `You have ${open} task${open === 1 ? "" : "s"} remaining for today.`;
  personalProgress.textContent = `${total ? Math.round((done / total) * 100) : 0}%`;
  searchInput.value = state.search;
  sortLabel.textContent = getSortLabel(state.sort);

  sortMenu.querySelectorAll("[data-sort]").forEach((option) => {
    const isActive = option.dataset.sort === state.sort;
    option.classList.toggle("active", isActive);
    option.setAttribute("aria-selected", String(isActive));
  });

  taskList.innerHTML = "";

  if (!filteredTasks.length) {
    const emptyState = document.createElement("li");
    emptyState.className = "empty-state";
    emptyState.textContent = "No tasks match your current filters.";
    taskList.appendChild(emptyState);
    return;
  }

  filteredTasks.forEach((task) => {
    taskList.appendChild(createTaskElement(task));
  });
}

function syncFilterButtons(activeButton = null) {
  document.querySelectorAll("[data-filter]").forEach((navButton) => {
    const isActive = activeButton ? navButton === activeButton : navButton.dataset.filter === state.filter;
    navButton.classList.toggle("active", isActive);
  });
}

function getVisibleTasks() {
  const searchTerm = state.search.trim().toLowerCase();

  return state.tasks
    .filter((task) => {
      const matchesFilter =
        state.filter === "all" ||
        (state.filter === "active" && !task.completed) ||
        (state.filter === "completed" && task.completed);

      const matchesSearch = !searchTerm || task.title.toLowerCase().includes(searchTerm);

      return matchesFilter && matchesSearch;
    })
    .sort(sortTasks);
}

function sortTasks(firstTask, secondTask) {
  switch (state.sort) {
    case "created-asc":
      return firstTask.createdAt - secondTask.createdAt;
    case "title-asc":
      return firstTask.title.localeCompare(secondTask.title);
    case "title-desc":
      return secondTask.title.localeCompare(firstTask.title);
    case "status":
      return Number(firstTask.completed) - Number(secondTask.completed) || secondTask.createdAt - firstTask.createdAt;
    case "created-desc":
    default:
      return secondTask.createdAt - firstTask.createdAt;
  }
}

function toggleSortMenu() {
  const isExpanded = sortToggle.getAttribute("aria-expanded") === "true";

  if (isExpanded) {
    closeSortMenu();
    return;
  }

  openSortMenu();
}

function openSortMenu() {
  sortToggle.setAttribute("aria-expanded", "true");
  sortMenu.hidden = false;
  requestAnimationFrame(() => {
    sortMenu.classList.add("is-open");
  });
}

function closeSortMenu() {
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

function handleDocumentClick(event) {
  if (!sortMenu.hidden && !event.target.closest(".sort-field")) {
    closeSortMenu();
  }

  // fix close share modal if click outside of it
  if (!shareModal.hidden && !event.target.closest(".share-modal") && !event.target.closest("#shareQuoteBtn")) {
    closeShareModal();
  }
}

function handleDocumentKeydown(event) {
  if (event.key === "Escape") {
    closeSortMenu();
  }
}

function getSortLabel(sortValue) {
  switch (sortValue) {
    case "created-asc":
      return "Oldest";
    case "title-asc":
      return "Title A-Z";
    case "title-desc":
      return "Title Z-A";
    case "status":
      return "Status";
    case "created-desc":
    default:
      return "Newest";
  }
}

function createTaskElement(task) {
  // Each task row is cloned from a template so we do not duplicate HTML by hand.
  const taskNode = taskTemplate.content.firstElementChild.cloneNode(true);
  const titleNode = taskNode.querySelector(".task-title");
  const metaNode = taskNode.querySelector(".task-meta");
  const toggleNode = taskNode.querySelector(".task-toggle");
  const editButton = taskNode.querySelector(".edit-btn");
  const saveButton = taskNode.querySelector(".save-btn");
  const deleteButton = taskNode.querySelector(".delete-btn");
  const editInput = taskNode.querySelector(".task-edit-input");

  taskNode.dataset.id = task.id;
  taskNode.classList.toggle("completed", task.completed);

  titleNode.textContent = task.title;
  metaNode.textContent = `Updated ${formatTime(task.updatedAt)}`;
  toggleNode.checked = task.completed;
  editInput.value = task.title;
  editInput.placeholder = "Edit task title";

  toggleNode.addEventListener("change", () => {
    task.completed = toggleNode.checked;
    task.updatedAt = Date.now();
    persistAndRender();
  });

  editButton.addEventListener("click", () => {
    taskNode.classList.add("editing");
    editInput.value = task.title;
    editInput.focus();
    editInput.setSelectionRange(editInput.value.length, editInput.value.length);
  });

  saveButton.addEventListener("click", () => {
    commitEdit(task, editInput.value, taskNode);
  });

  editInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitEdit(task, editInput.value, taskNode);
    }

    if (event.key === "Escape") {
      taskNode.classList.remove("editing");
    }
  });

  deleteButton.addEventListener("click", () => {
    state.tasks = state.tasks.filter((existingTask) => existingTask.id !== task.id);
    showToast("Task deleted successfully.", "success");
    persistAndRender();
  });

  return taskNode;
}

function commitEdit(task, value, taskNode) {
  const nextTitle = value.trim();

  if (!nextTitle) {
    return;
  }

  task.title = nextTitle;
  task.updatedAt = Date.now();
  taskNode.classList.remove("editing");
  showToast("Task updated successfully.", "success");
  persistAndRender();
}

function formatTime(timestamp) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);
}

function initDailyQuote() {
  const storedData = loadQuote();
  const today = new Date().toDateString();

  // If we have a quote and it's from today, display it
  if (storedData && storedData.date === today) {
    displayQuote(storedData.quote);
  } else {
    // Otherwise fetch a new quote
    fetchAndDisplayQuote();
  }
}

function loadQuote() {
  const raw = localStorage.getItem(QUOTE_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveQuote(quote) {
  const data = {
    date: new Date().toDateString(),
    quote,
  };
  localStorage.setItem(QUOTE_STORAGE_KEY, JSON.stringify(data));
}

async function fetchAndDisplayQuote() {
  try {
    const response = await fetch(QUOTE_API);
    if (!response.ok) throw new Error("Failed to fetch quote");

    const quote = await response.json();
    saveQuote(quote);
    displayQuote(quote);
  } catch (error) {
    console.error("Error fetching quote:", error);
    displayQuote({
      "data": [
        {
          "quote": "Every day is a new opportunity to be better.",
          "author": "Rahafebx",
        }
      ]
    });
  }
}

function displayQuote(quote) {
  if(quote.data[0].quote != undefined && quote.data[0].quote != null){
    quoteText.textContent = `"${quote.data[0].quote}"`;
    quoteAuthor.textContent = `— ${quote.data[0].author || "Unknown"}`;
  }
  quoteText.classList.remove("fade");
  shareQuoteBtn.classList.remove("disabled");
  shareQuoteBtn.disabled = false;
}


function openShareQuoteModal(quote, author) {
  // if quote not fetched yet, do not open the modal and show a toast instead
  if (!quote || !author) {
    showToast("No quote available to share.", "error");
    return;
  }

  overlay.classList.add("is-active");
  shareModal.classList.add("is-open");
  // set the quote and author in the modal
  shareModal.querySelector(".share-quote").textContent = quote;
  shareModal.querySelector(".share-author").textContent = author;
}

function shareQuote(quote, author, platform) {
  // if quote or author is missing, do not proceed and show a toast instead
  if (!quote || !author) {
    showToast("No quote available to share.", "error");
    return;
  }
  const text = `${quote} ${author}`;
  let shareUrl = "";
  switch (platform) {
    case "twitter":
      shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
      break;
    case "facebook":
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(document.location.href)}&quote=${encodeURIComponent(text)}`;
      break;
    case "linkedin":
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(document.location.href)}&summary=${encodeURIComponent(text)}`;
      break;
    case "whatsapp":
      shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + " " + document.location.href)}`;
      break;
    default:
      console.warn("Unsupported share platform:", platform);
      return;
  }
  window.open(shareUrl, "_blank", "noopener");
  // close the share modal after sharing
  closeShareModal();

}

function closeShareModal() {
  shareModal.classList.remove("is-open");
  overlay.classList.remove("is-active");
}

function showToast(message, type = "info", timeout = 10000) {
  if (!toasts) return;

  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;

  const body = document.createElement("div");
  body.className = "toast-body";
  body.textContent = message;

  const close = document.createElement("button");
  close.className = "toast-close";
  close.setAttribute("aria-label", "Dismiss");
  close.innerHTML = `
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16">
      <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
  </svg>
  `;
  close.addEventListener("click", () => {
    toast.remove();
  });

  toast.appendChild(body);
  toast.appendChild(close);
  toasts.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, timeout);
}

// ---------- Export / Import Handlers ----------
function handleExport() {
  const payload = {
    exportedAt: Date.now(),
    tasks: state.tasks,
  };

  const data = JSON.stringify(payload, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `todo-ebx-tasks-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function handleImportFile(event) {
  const input = event.target;
  const file = input && input.files && input.files[0];
  if (!file) return;

  const isJson = (file.type && file.type.includes("json")) || file.name.toLowerCase().endsWith(".json");
  if (!isJson) {
    showToast("Please select a JSON file to import.", "error");
    input.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const tasksArray = Array.isArray(parsed) ? parsed : parsed.tasks;

      if (!Array.isArray(tasksArray)) {
        showToast("Invalid file format. Expected an array of tasks or an object with a 'tasks' array.", "error");
        input.value = "";
        return;
      }

      const added = importTasks(tasksArray);
      if (added > 0) {
        persistAndRender();
        showToast(`Imported ${added} new task${added === 1 ? "" : "s"}.`, "success");
      } else {
        showToast("No new tasks to import.", "info");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to parse JSON file.", "error");
    } finally {
      input.value = "";
    }
  };

  reader.onerror = () => {
    showToast("Failed to read file.", "error");
    input.value = "";
  };

  reader.readAsText(file);
}

function importTasks(tasksArray) {
  const existingIds = new Set(state.tasks.map((t) => t.id));
  const existingTitles = new Set(state.tasks.map((t) => String(t.title || "").trim().toLowerCase()));
  let added = 0;

  for (const raw of tasksArray) {
    if (!raw || typeof raw !== "object") continue;

    const title = String(raw.title || "").trim();
    if (!title) continue;

    const normalizedTitle = title.toLowerCase();

    // Skip if a task with the same title already exists (case-insensitive)
    if (existingTitles.has(normalizedTitle)) continue;

    const hasId = typeof raw.id === "string" && raw.id;
    if (hasId && existingIds.has(raw.id)) continue;

    const newTask = {
      id: hasId ? raw.id : crypto.randomUUID(),
      title,
      completed: Boolean(raw.completed),
      createdAt: typeof raw.createdAt === "number" ? raw.createdAt : Date.now(),
      updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : Date.now(),
    };

    state.tasks.push(newTask);
    existingIds.add(newTask.id);
    existingTitles.add(normalizedTitle);
    added++;
  }

  return added;
}

const STORAGE_KEY = "todo-ebx-state";
const THEME_KEY = "todo-ebx-theme";

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

init();

function init() {
  setGreeting();
  applyTheme(loadTheme());
  syncFilterButtons();
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
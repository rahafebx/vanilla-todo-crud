import { formatTime, getSortLabel, getVisibleTasks } from './tasks.js';

export function setGreeting(greeting) {
  const hour = new Date().getHours();
  const period = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  greeting.textContent = `Good ${period}.`;
}

export function render(state, elements, taskTemplate, persistAndRenderFn, showToastFn) {
  const filteredTasks = getVisibleTasks(state);
  const total = state.tasks.length;
  const open = state.tasks.filter((task) => !task.completed).length;
  const done = total - open;

  elements.statTotal.textContent = String(total);
  elements.statOpen.textContent = String(open);
  elements.statDone.textContent = String(done);
  elements.taskSummary.textContent = `You have ${open} task${open === 1 ? "" : "s"} remaining for today.`;
  elements.personalProgress.textContent = `${total ? Math.round((done / total) * 100) : 0}%`;
  elements.searchInput.value = state.search;
  elements.sortLabel.textContent = getSortLabel(state.sort);

  elements.sortMenu.querySelectorAll("[data-sort]").forEach((option) => {
    const isActive = option.dataset.sort === state.sort;
    option.classList.toggle("active", isActive);
    option.setAttribute("aria-selected", String(isActive));
  });

  elements.taskList.innerHTML = "";

  if (!filteredTasks.length) {
    const emptyState = document.createElement("li");
    emptyState.className = "empty-state";
    emptyState.textContent = "No tasks match your current filters.";
    elements.taskList.appendChild(emptyState);
    return;
  }

  filteredTasks.forEach((task) => {
    elements.taskList.appendChild(createTaskElement(task, state, taskTemplate, persistAndRenderFn, showToastFn));
  });
}

export function createTaskElement(task, state, taskTemplate, persistAndRenderFn, showToastFn) {
  const taskNode = taskTemplate.content.firstElementChild.cloneNode(true);
  const titleNode = taskNode.querySelector(".task-title");
  const metaNode = taskNode.querySelector(".task-meta");
  const toggleNode = taskNode.querySelector(".task-toggle");
  const editButton = taskNode.querySelector(".edit-btn");
  const cancelButton = taskNode.querySelector(".cancel-btn");
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
    persistAndRenderFn(true);
  });

  editButton.addEventListener("click", () => {
    taskNode.classList.add("editing");
    editInput.value = task.title;
    editInput.focus();
    editInput.setSelectionRange(editInput.value.length, editInput.value.length);
  });

  saveButton.addEventListener("click", () => {
    commitEdit(task, editInput.value, taskNode, persistAndRenderFn, showToastFn);
  });

  editInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitEdit(task, editInput.value, taskNode, persistAndRenderFn, showToastFn);
    }

    if (event.key === "Escape") {
      taskNode.classList.remove("editing");
    }
  });

  cancelButton.addEventListener("click", () => {
    taskNode.classList.remove("editing");
  });

  deleteButton.addEventListener("click", () => {
    state.tasks = state.tasks.filter((existingTask) => existingTask.id !== task.id);
    showToastFn("Task deleted successfully.", "success");
    persistAndRenderFn(true);
  });

  return taskNode;
}

function commitEdit(task, value, taskNode, persistAndRenderFn, showToastFn) {
  const nextTitle = value.trim();

  if (!nextTitle) {
    return;
  }

  task.title = nextTitle;
  task.updatedAt = Date.now();
  taskNode.classList.remove("editing");
  showToastFn("Task updated successfully.", "success");
  persistAndRenderFn(true);
}

export function syncFilterButtons(state, activeButton = null) {
  document.querySelectorAll("[data-filter]").forEach((navButton) => {
    const isActive = activeButton ? navButton === activeButton : navButton.dataset.filter === state.filter;
    navButton.classList.toggle("active", isActive);
  });
}

export function showToast(message, type = "info", timeout = 10000, toasts) {
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
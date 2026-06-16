import { formatTime, getSortLabel, getVisibleTasks } from "./tasks.js";

export function setGreeting(greeting) {
  const hour = new Date().getHours();
  const period = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  greeting.textContent = `Good ${period}.`;
}

export function render(
  state,
  elements,
  taskTemplate,
  persistAndRenderFn,
  showToastFn,
) {
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
    elements.taskList.appendChild(
      createTaskElement(
        task,
        state,
        taskTemplate,
        persistAndRenderFn,
        showToastFn,
      ),
    );
  });
}

export function createTaskElement(
  task,
  state,
  taskTemplate,
  persistAndRenderFn,
  showToastFn,
) {
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
  editInput.id = task.id;
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
    commitEdit(
      task,
      editInput.value,
      taskNode,
      persistAndRenderFn,
      showToastFn,
    );
  });

  editInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitEdit(
        task,
        editInput.value,
        taskNode,
        persistAndRenderFn,
        showToastFn,
      );
    }

    if (event.key === "Escape") {
      taskNode.classList.remove("editing");
    }
  });

  cancelButton.addEventListener("click", () => {
    taskNode.classList.remove("editing");
  });

  deleteButton.addEventListener("click", () => {
    state.tasks = state.tasks.filter(
      (existingTask) => existingTask.id !== task.id,
    );
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
    const isActive = activeButton
      ? navButton === activeButton
      : navButton.dataset.filter === state.filter;
    navButton.classList.toggle("active", isActive);
  });
}

export function showToast(message, type = "info", timeout = 10000, toasts) {
  if (!toasts) return;

  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;

  const icon = document.createElement("span");
  icon.className = "toast-icon";
  icon.innerHTML = getToastIcon(type);

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

  toast.appendChild(icon);
  toast.appendChild(body);
  toast.appendChild(close);
  toasts.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, timeout);
}
// TODO: replace icon with svg;
function getToastIcon(type) {
  switch (type) {
    case "info":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
              </svg>`;
      break;

    case "success":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-circle" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                <path d="m10.97 4.97-.02.022-3.473 4.425-2.093-2.094a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05"/>
              </svg>`;
      break;

    case "error":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-exclamation-circle" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0M7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z"/>
              </svg>`;
      break;

    case "warning":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-exclamation-triangle" viewBox="0 0 16 16">
                <path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.15.15 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.2.2 0 0 1-.054.06.1.1 0 0 1-.066.017H1.146a.1.1 0 0 1-.066-.017.2.2 0 0 1-.054-.06.18.18 0 0 1 .002-.183L7.884 2.073a.15.15 0 0 1 .054-.057m1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767z"/>
                <path d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0M7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z"/>
              </svg>`;
      break;

    default:
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-circle" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
              </svg>`;
  }
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

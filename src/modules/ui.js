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

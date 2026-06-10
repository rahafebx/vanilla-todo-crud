export function getVisibleTasks(state) {
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
    .sort((firstTask, secondTask) => sortTasks(firstTask, secondTask, state.sort));
}

export function sortTasks(firstTask, secondTask, sortType) {
  switch (sortType) {
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

export function formatTime(timestamp) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);
}

export function getSortLabel(sortValue) {
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

export function importTasks(tasksArray, state) {
  const existingIds = new Set(state.tasks.map((t) => t.id));
  const existingTitles = new Set(state.tasks.map((t) => String(t.title || "").trim().toLowerCase()));
  let added = 0;

  for (const raw of tasksArray) {
    if (!raw || typeof raw !== "object") continue;

    const title = String(raw.title || "").trim();
    if (!title) continue;

    const normalizedTitle = title.toLowerCase();

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
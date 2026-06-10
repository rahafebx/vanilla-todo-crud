import { importTasks } from './tasks.js';

export function handleExport(state) {
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

export function handleImportFile(event, state, persistAndRenderFn, showToastFn) {
  const input = event.target;
  const file = input && input.files && input.files[0];
  if (!file) return;

  const isJson = (file.type && file.type.includes("json")) || file.name.toLowerCase().endsWith(".json");
  if (!isJson) {
    showToastFn("Please select a JSON file to import.", "error");
    input.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const tasksArray = Array.isArray(parsed) ? parsed : parsed.tasks;

      if (!Array.isArray(tasksArray)) {
        showToastFn("Invalid file format. Expected an array of tasks or an object with a 'tasks' array.", "error");
        input.value = "";
        return;
      }

      const added = importTasks(tasksArray, state);
      if (added > 0) {
        persistAndRenderFn(true);
        showToastFn(`Imported ${added} new task${added === 1 ? "" : "s"}.`, "success");
      } else {
        showToastFn("No new tasks to import.", "info");
      }
    } catch (err) {
      console.error(err);
      showToastFn("Failed to parse JSON file.", "error");
    } finally {
      input.value = "";
    }
  };

  reader.onerror = () => {
    showToastFn("Failed to read file.", "error");
    input.value = "";
  };

  reader.readAsText(file);
}
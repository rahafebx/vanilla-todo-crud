export const STORAGE_KEY = "todo-ebx-state";
export const THEME_KEY = "todo-ebx-theme";
export const QUOTE_STORAGE_KEY = "todo-ebx-quote";
export const QUOTE_API = "https://quotesapi.prayushadhikari.com.np/api/quotes?category=inspiration-quotes&limit=1";

export const defaultState = {
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
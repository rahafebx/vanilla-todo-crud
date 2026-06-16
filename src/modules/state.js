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
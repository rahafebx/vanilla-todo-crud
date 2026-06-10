import { THEME_KEY } from './constants.js';

export function loadTheme() {
  return localStorage.getItem(THEME_KEY) || getSystemTheme();
}

export function getSystemTheme() {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme, themeToggle) {
  document.documentElement.dataset.theme = theme;
  themeToggle.checked = theme === "dark";
  localStorage.setItem(THEME_KEY, theme);
  themeToggle.setAttribute("aria-label", `Activate ${theme === "dark" ? "light" : "dark"} mode`);
  themeToggle.parentElement.querySelector("span").textContent = theme === "dark" ? "Light Mode" : "Dark Mode";
}
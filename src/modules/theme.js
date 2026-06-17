import { THEME_KEY, COLOR_KEY } from './constants.js';

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

export function loadColor() {
  return localStorage.getItem(COLOR_KEY) || "blue";
}

export function applyThemeColor(color, options) {
  document.documentElement.dataset.color = color;
  localStorage.setItem(COLOR_KEY, color);
  options.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.color === color);
  });
}
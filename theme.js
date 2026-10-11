(() => {
  "use strict";

  const THEME_KEY = "xamsamed_theme_v1";
  const body = document.body;
  const toolbar = document.querySelector(".topbar-actions");
  const colorMeta = document.querySelector('meta[name="theme-color"]');

  if (!toolbar) return;

  const button = document.createElement("button");
  button.className = "theme-toggle";
  button.type = "button";
  button.innerHTML = '<span class="theme-toggle-icon" aria-hidden="true"></span><span class="theme-toggle-label"></span>';
  toolbar.append(button);

  function setTheme(theme, savePreference) {
    const isDark = theme === "dark";
    body.classList.toggle("theme-dark", isDark);
    button.setAttribute("aria-pressed", String(isDark));
    button.setAttribute("aria-label", isDark ? "Activer le thème clair" : "Activer le mode nuit");
    button.title = isDark ? "Activer le thème clair" : "Activer le mode nuit";
    button.querySelector(".theme-toggle-icon").textContent = isDark ? "☀" : "☾";
    button.querySelector(".theme-toggle-label").textContent = isDark ? "Mode clair" : "Mode nuit";
    if (colorMeta) colorMeta.content = isDark ? "#142337" : "#f4f8fc";

    if (savePreference) {
      try {
        window.localStorage.setItem(THEME_KEY, theme);
      } catch (error) {
        console.error("XamSaMed theme preference could not be saved.", error);
      }
    }
  }

  let savedTheme = "light";
  try {
    const storedTheme = window.localStorage.getItem(THEME_KEY);
    if (storedTheme === "dark" || storedTheme === "light") savedTheme = storedTheme;
  } catch (error) {
    console.error("XamSaMed theme preference could not be read.", error);
  }

  setTheme(savedTheme, false);
  button.addEventListener("click", () => {
    setTheme(body.classList.contains("theme-dark") ? "light" : "dark", true);
  });
})();

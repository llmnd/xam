(() => {
  "use strict";

  const THEME_KEY = "xamsamed_theme_v1";
  const body = document.body;
  const toolbar = document.querySelector(".topbar-actions");
  const colorMeta = document.querySelector('meta[name="theme-color"]');
  const sidebar = document.querySelector(".sidebar");
  const topbar = document.querySelector(".topbar");

  if (!toolbar) return;

  const button = document.createElement("button");
  button.className = "theme-toggle";
  button.type = "button";
  button.innerHTML = '<svg class="theme-toggle-icon" viewBox="0 0 24 24" aria-hidden="true"></svg><span class="theme-toggle-label"></span>';
  toolbar.append(button);

  let menuButton = null;
  let backdrop = null;

  if (sidebar && topbar) {
    sidebar.id = "primary-navigation";
    menuButton = document.createElement("button");
    menuButton.className = "mobile-menu-toggle";
    menuButton.type = "button";
    menuButton.setAttribute("aria-controls", sidebar.id);
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Ouvrir le menu");
    menuButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
    topbar.insertBefore(menuButton, topbar.firstChild);

    backdrop = document.createElement("div");
    backdrop.className = "mobile-nav-backdrop";
    backdrop.setAttribute("aria-hidden", "true");
    document.body.append(backdrop);

    function closeMenu(returnFocus) {
      body.classList.remove("mobile-nav-open");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Ouvrir le menu");
      if (returnFocus) menuButton.focus();
    }

    menuButton.addEventListener("click", () => {
      const isOpen = body.classList.toggle("mobile-nav-open");
      menuButton.setAttribute("aria-expanded", String(isOpen));
      menuButton.setAttribute("aria-label", isOpen ? "Fermer le menu" : "Ouvrir le menu");
      if (isOpen) {
        const firstLink = sidebar.querySelector(".nav-link");
        if (firstLink) firstLink.focus();
      }
    });
    backdrop.addEventListener("click", () => closeMenu(true));
    sidebar.addEventListener("click", (event) => {
      if (event.target.closest(".nav-link")) closeMenu(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && body.classList.contains("mobile-nav-open")) {
        closeMenu(true);
      }
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 850 && body.classList.contains("mobile-nav-open")) {
        closeMenu(false);
      }
    });
  }

  function setTheme(theme, savePreference) {
    const isDark = theme === "dark";
    body.classList.toggle("theme-dark", isDark);
    button.setAttribute("aria-pressed", String(isDark));
    button.setAttribute("aria-label", isDark ? "Activer le thème clair" : "Activer le mode nuit");
    button.title = isDark ? "Activer le thème clair" : "Activer le mode nuit";
    button.querySelector(".theme-toggle-icon").innerHTML = isDark
      ? '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>'
      : '<path d="M20.2 15.5A8.5 8.5 0 0 1 8.5 3.8 8.5 8.5 0 1 0 20.2 15.5Z"/>';
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

(() => {
  "use strict";

  if (!("serviceWorker" in navigator) || !/^https?:$/.test(window.location.protocol)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch((error) => {
      console.error("XamSaMed service worker could not be registered.", error);
    });
  });
})();

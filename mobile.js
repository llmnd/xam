(() => {
  "use strict";

  const view = document.getElementById("phone-view");
  const tabs = document.getElementById("phone-tabs");
  const clock = document.getElementById("phone-clock");
  const toast = document.getElementById("phone-toast");
  const pickerButtons = document.querySelectorAll("[data-preview]");
  const state = {
    route: "home",
    tab: "home",
    role: "citizen",
    pharmacyFilter: "Toutes",
    query: "",
    selectedMedicine: "doliprane",
    selectedPharmacy: "plateau",
    bookings: 0,
    alertFilter: "Toutes",
    toastTimer: 0
  };

  const medicines = [
    { id: "doliprane", name: "Paracétamol 500 mg", detail: "Boîte de 16 comprimés", symbol: "✳", status: "Disponible", className: "", pharmacies: 4 },
    { id: "vitamine", name: "Vitamine C 1000 mg", detail: "Comprimés effervescents", symbol: "◉", status: "À vérifier", className: "unavailable", pharmacies: 2 },
    { id: "serum", name: "Sérum physiologique", detail: "Unidose · 5 ml", symbol: "＋", status: "Disponible", className: "", pharmacies: 3 }
  ];
  const pharmacies = [
    { id: "plateau", name: "Pharmacie du Plateau", distance: "0,8 km", area: "Plateau · Avenue L. S. Senghor", open: true, rating: "4,8", reviews: "42 avis" },
    { id: "medina", name: "Pharmacie de la Médina", distance: "1,6 km", area: "Médina · Rue 22", open: true, rating: "4,6", reviews: "28 avis" },
    { id: "fann", name: "Pharmacie de Fann", distance: "2,4 km", area: "Fann Résidence", open: false, rating: "4,7", reviews: "19 avis" }
  ];
  const alerts = [
    { id: "amoxicilline", name: "Amoxicilline 500 mg", type: "Rupture", area: "Dakar-Plateau", time: "Il y a 12 min" },
    { id: "insuline", name: "Insuline rapide", type: "Tension", area: "Médina", time: "Il y a 28 min" },
    { id: "serum-alert", name: "Sérum antivenimeux", type: "Rupture", area: "Grand-Yoff", time: "Il y a 41 min" }
  ];

  const icons = {
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    map: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15m6-12v15"/>',
    pharmacy: '<path d="M4 21h16M6 21V8l6-4 6 4v13M9 11h6m-3-3v6"/><path d="M9 21v-5h6v5"/>',
    profile: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.4-3.8 2.8-5.8 7-5.8s6.6 2 7 5.8"/>',
    alerts: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12h4"/>',
    back: '<path d="m15 18-6-6 6-6M9 12h12"/>',
    search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/>',
    pin: '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>'
  };

  function icon(name) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (icons[name] || "") + "</svg>";
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
  }

  function medicineById(id) {
    return medicines.find((item) => item.id === id) || medicines[0];
  }

  function pharmacyById(id) {
    return pharmacies.find((item) => item.id === id) || pharmacies[0];
  }

  function go(route, tab) {
    state.route = route;
    if (tab) state.tab = tab;
    render();
  }

  function showToast(message) {
    window.clearTimeout(state.toastTimer);
    toast.textContent = message;
    toast.classList.remove("toast-visible");
    void toast.offsetWidth;
    toast.classList.add("toast-visible");
    state.toastTimer = window.setTimeout(() => toast.classList.remove("toast-visible"), 2850);
  }

  function updateClock() {
    const now = new Date();
    clock.textContent = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(now);
    const date = document.getElementById("phone-date");
    if (date) date.textContent = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(now).toLocaleUpperCase("fr");
  }

  function renderTabs() {
    const destinations = [
      ["home", "Accueil"],
      ["map", "Carte"],
      ["pharmacies", "Pharma"],
      ["profile", "Profil"]
    ];
    if (state.role === "hospital") destinations.push(["alerts", "Alertes"]);
    tabs.classList.toggle("has-alerts", state.role === "hospital");
    tabs.innerHTML = destinations.map(([id, label]) =>
      '<button class="phone-tab" type="button" data-tab="' + id + '"' + (state.tab === id ? ' aria-current="page"' : "") + ">" +
      icon(id === "pharmacies" ? "pharmacy" : id) + "<span>" + label + "</span></button>"
    ).join("");
  }

  function medicineCard(item) {
    return '<button class="med-row" type="button" data-medicine="' + item.id + '">' +
      '<span class="med-symbol' + (item.id === "vitamine" ? " green" : "") + '">' + item.symbol + "</span>" +
      '<span class="med-row-copy"><strong>' + item.name + "</strong><span>" + item.detail + "</span></span>" +
      '<span class="stock-status ' + item.className + '">' + item.status + "</span></button>";
  }

  function pharmacyCard(item) {
    return '<button type="button" class="pharmacy-card" data-pharmacy="' + item.id + '">' +
      '<span class="pharmacy-icon">✚</span><span class="pharmacy-copy"><strong>' + item.name +
      '</strong><span>' + item.area + '</span><span class="' + (item.open ? "open-status" : "closed-status") + '">' +
      (item.open ? "Ouverte maintenant" : "Fermée") + " · ★ " + item.rating + " · " + item.reviews +
      '</span></span><span class="pharmacy-distance">' + item.distance + "</span></button>";
  }

  function pageHome() {
    return '<section class="app-screen"><div class="home-greeting"><div><p class="app-kicker" id="phone-date"></p><h2 class="app-title">Bonjour, Awa</h2><div class="location-caption">' +
      icon("pin") + "<span>Dakar, Sénégal</span></div></div><span class=\"app-demo-label\">DÉMO</span></div>" +
      '<form class="app-search" id="medicine-search">' + icon("search") +
      '<input name="query" aria-label="Rechercher un médicament" placeholder="Quel médicament recherchez-vous ?" value="' + escapeHtml(state.query) + '">' +
      '<button type="submit" aria-label="Rechercher">' + icon("search") + "</button></form>" +
      '<article class="home-feature"><p class="home-feature-label">VOTRE SANTÉ, À PORTÉE DE MAIN</p><h3>Trouvez votre médicament près de vous.</h3>' +
      "<p>Explorez les pharmacies et leurs disponibilités autour de Dakar.</p>" +
      '<button type="button" data-route="map">Voir les pharmacies près de moi&nbsp; →</button></article>' +
      '<div class="app-section-head"><h3>Explorer</h3></div><div class="category-row">' +
      '<button type="button" class="category-button" data-route="results"><span class="category-icon">✳</span>Médicaments</button>' +
      '<button type="button" class="category-button" data-tab="pharmacies"><span class="category-icon">✚</span>Pharmacies</button>' +
      '<button type="button" class="category-button" data-tab="map"><span class="category-icon">⌖</span>À proximité</button>' +
      '<button type="button" class="category-button" data-tab="profile"><span class="category-icon">♡</span>Favoris</button></div>' +
      '<div class="app-section-head"><h3>Recherches populaires</h3><button class="app-text-button" type="button" data-route="results">Tout voir</button></div>' +
      '<div class="med-list">' + medicines.slice(0, 2).map(medicineCard).join("") + "</div>" +
      '<p class="update-caption" data-updated>Démo · actualisée à l’instant</p></section>';
  }

  function pageResults() {
    const query = state.query.trim().toLocaleLowerCase("fr");
    const results = medicines.filter((item) => !query || (item.name + " " + item.detail).toLocaleLowerCase("fr").includes(query));
    return '<section class="app-screen"><button type="button" class="app-text-button" data-back>← Retour</button>' +
      '<p class="app-kicker" style="margin-top:16px">RECHERCHE</p><h2 class="app-title">Médicaments</h2>' +
      '<form class="app-search" id="medicine-search">' + icon("search") +
      '<input name="query" aria-label="Rechercher un médicament" placeholder="Nom du médicament" value="' + escapeHtml(state.query) + '">' +
      '<button type="submit" aria-label="Rechercher">' + icon("search") + "</button></form>" +
      '<div class="app-section-head"><h3>' + (query ? results.length + " résultat" + (results.length > 1 ? "s" : "") : "Suggestions") + '</h3><span class="app-demo-label">DONNÉES DÉMO</span></div>' +
      (results.length ? '<div class="med-list">' + results.map(medicineCard).join("") + "</div>" :
        '<p class="inline-empty">Aucun médicament ne correspond à cette recherche dans la maquette.<br>Essaie « paracétamol » ou « sérum ».</p>') +
      '<p class="update-caption">La disponibilité affichée est fictive.</p></section>';
  }

  function pageMedicine() {
    const item = medicineById(state.selectedMedicine);
    return '<section class="app-screen"><button type="button" class="app-text-button" data-back>← Retour aux résultats</button>' +
      '<div class="detail-hero"><span class="med-symbol green">' + item.symbol + '</span><div><p class="app-kicker">MÉDICAMENT · DÉMO</p><strong>' + item.name + "</strong><p>" + item.detail + "</p></div></div>" +
      '<div class="detail-info"><div><span>Disponibilité exemple</span><strong>' + item.status + '</strong></div><div><span>Pharmacies listées</span><strong>' + item.pharmacies + " (fictives)</strong></div></div>" +
      '<div class="app-section-head"><h3>Pharmacies à proximité</h3><button type="button" class="app-text-button" data-tab="pharmacies">Tout voir</button></div>' +
      '<div class="pharmacy-list">' + pharmacies.slice(0, 2).map(pharmacyCard).join("") + "</div>" +
      '<button type="button" class="primary-action" data-action="reserve">Réserver dans la maquette</button>' +
      '<button type="button" class="secondary-action" data-action="alert">M’avertir de la disponibilité</button>' +
      '<p class="update-caption">Aucune réservation ne sera transmise à une pharmacie.</p></section>';
  }

  function filteredPharmacies() {
    if (state.pharmacyFilter === "Ouvertes") return pharmacies.filter((item) => item.open);
    if (state.pharmacyFilter === "Fermées") return pharmacies.filter((item) => !item.open);
    if (state.pharmacyFilter === "Proches") return pharmacies.filter((item) => parseFloat(item.distance) < 2);
    return pharmacies;
  }

  function pagePharmacies() {
    const filters = ["Toutes", "Ouvertes", "Fermées", "Proches"];
    return '<section class="app-screen"><p class="app-kicker">AUTOUR DE VOUS · DAKAR</p><h2 class="app-title">Pharmacies</h2>' +
      '<p class="app-subtitle">Trouvez une pharmacie et consultez les informations de la maquette.</p>' +
      '<form class="app-search" id="pharmacy-search">' + icon("search") +
      '<input name="query" aria-label="Rechercher une pharmacie" placeholder="Nom ou quartier" value="' + escapeHtml(state.query) + '">' +
      '<button type="submit" aria-label="Rechercher">' + icon("search") + "</button></form>" +
      '<div class="filter-row">' + filters.map((label) => '<button type="button" data-filter="' + label + '" aria-pressed="' + (state.pharmacyFilter === label) + '">' + label + "</button>").join("") + "</div>" +
      '<div class="pharmacy-list">' + (filteredPharmacies().filter((item) => !state.query || (item.name + item.area).toLocaleLowerCase("fr").includes(state.query.toLocaleLowerCase("fr"))).map(pharmacyCard).join("") ||
        '<p class="inline-empty">Aucune pharmacie dans ces résultats de démonstration.</p>') + "</div>" +
      '<p class="update-caption">Adresses, avis et horaires de démonstration.</p></section>';
  }

  function pageMap() {
    return '<section class="app-screen"><p class="app-kicker">EXPLORER · DAKAR</p><h2 class="app-title">Carte des pharmacies</h2>' +
      '<p class="app-subtitle">Les repères ci-dessous sont illustratifs, pas une carte de navigation.</p>' +
      '<div class="map-illustration" role="img" aria-label="Carte illustrative de Dakar avec trois pharmacies fictives">' +
      '<span class="map-road one"></span><span class="map-road two"></span><span class="map-road three"></span><span class="map-river"></span>' +
      '<span class="map-label l1">PLATEAU</span><span class="map-label l2">MÉDINA</span><span class="map-label l3">FANN</span>' +
      '<span class="map-pin p1"><span>+</span></span><span class="map-pin p2"><span>+</span></span><span class="map-pin p3"><span>+</span></span></div>' +
      '<p class="map-note"><span>ⓘ</span> Carte schématique · géolocalisation non activée</p>' +
      '<div class="app-section-head"><h3>Pharmacies proches</h3><button type="button" class="app-text-button" data-tab="pharmacies">Liste</button></div>' +
      '<div class="pharmacy-list">' + pharmacies.slice(0, 2).map(pharmacyCard).join("") + "</div></section>";
  }

  function pagePharmacy() {
    const item = pharmacyById(state.selectedPharmacy);
    return '<section class="app-screen"><button type="button" class="app-text-button" data-back>← Retour aux pharmacies</button>' +
      '<div class="detail-hero"><span class="pharmacy-icon">✚</span><div><p class="app-kicker">PHARMACIE · DÉMO</p><strong>' + item.name +
      "</strong><p>" + item.area + "</p></div></div>" +
      '<div class="detail-info"><div><span>Horaires (fictifs)</span><strong>' + (item.open ? "Ouverte · ferme à 20 h" : "Fermée · ouvre à 8 h") +
      '</strong></div><div><span>Avis de démonstration</span><strong>★ ' + item.rating + " · " + item.reviews + "</strong></div></div>" +
      '<div class="app-section-head"><h3>Disponibilités exemple</h3><span class="app-demo-label">SIMULÉ</span></div>' +
      '<div class="med-list">' + medicines.slice(0, 2).map(medicineCard).join("") + "</div>" +
      '<button type="button" class="primary-action" data-action="call">Appeler la pharmacie</button>' +
      '<button type="button" class="secondary-action" data-action="review">Consulter les avis</button>' +
      '<p class="update-caption">Aucune donnée ni action réelle n’est connectée.</p></section>';
  }

  function pageProfile() {
    return '<section class="app-screen"><p class="app-kicker">VOTRE ESPACE</p><h2 class="app-title">Mon profil</h2>' +
      '<div class="profile-card"><span class="profile-avatar">AD</span><div><strong>Awa Diop</strong><p>Compte de démonstration · Dakar</p></div></div>' +
      '<div class="app-section-head"><h3>Mon activité</h3></div><div class="settings-list">' +
      '<button type="button" class="settings-row" data-route="bookings"><span>Mes réservations · ' + state.bookings + '</span><span>›</span></button>' +
      '<button type="button" class="settings-row" data-action="favorites"><span>Mes pharmacies favorites</span><span>›</span></button>' +
      '<button type="button" class="settings-row" data-action="edit-profile"><span>Informations personnelles</span><span>›</span></button></div>' +
      '<div class="app-section-head"><h3>Mode de démonstration</h3></div>' +
      '<button type="button" class="secondary-action" data-action="switch-role">' + (state.role === "hospital" ? "Passer en mode usager" : "Découvrir l’espace hôpital") + "</button>" +
      '<p class="update-caption">Profil fictif · aucune donnée personnelle stockée.</p></section>';
  }

  function pageBookings() {
    return '<section class="app-screen"><button type="button" class="app-text-button" data-back>← Retour au profil</button>' +
      '<p class="app-kicker" style="margin-top:16px">VOTRE ESPACE</p><h2 class="app-title">Mes réservations</h2>' +
      (state.bookings ? '<div class="app-demo-label" style="margin-top:10px">RÉSERVATION FICTIVE</div>' +
        Array.from({ length: state.bookings }, () => '<article class="booking-card"><div><strong>' + medicineById(state.selectedMedicine).name + '</strong><span class="booking-pill">À confirmer</span></div>' +
        '<p>Pharmacie du Plateau<br>Exemple de réservation · aucune demande réelle envoyée</p></article>').join("") :
        '<p class="inline-empty" style="margin-top:16px">Aucune réservation dans la maquette pour le moment. Une réservation de démonstration apparaîtra ici.</p>') +
      '<p class="update-caption">Les réservations ne sont pas synchronisées à un service.</p></section>';
  }

  function pageAlerts() {
    const shown = alerts.filter((item) => state.alertFilter === "Toutes" || item.type === state.alertFilter);
    return '<section class="app-screen"><p class="app-kicker">ESPACE PROFESSIONNEL · HÔPITAL</p><h2 class="app-title">Alertes de stock</h2>' +
      '<p class="app-subtitle">Une vue de démonstration destinée aux établissements de santé.</p>' +
      '<div class="app-demo-label" style="margin-top:10px">DONNÉES SIMULÉES · NON TEMPS RÉEL</div>' +
      '<div class="detail-info"><div><span>Tensions exemple</span><strong>01</strong></div><div><span>Ruptures exemple</span><strong>02</strong></div></div>' +
      '<div class="filter-row">' + ["Toutes", "Tension", "Rupture"].map((label) => '<button type="button" data-alert-filter="' + label + '" aria-pressed="' + (state.alertFilter === label) + '">' + label + "</button>").join("") + "</div>" +
      shown.map((item) => '<button type="button" class="alert-card" data-alert="' + item.id + '" style="width:100%;text-align:left;cursor:pointer"><div><strong>' + item.name +
      '</strong><span class="alert-pill">' + item.type + "</span></div><p>" + item.area + " · " + item.time + "</p></button>").join("") +
      '<p class="update-caption">Données fictives de la maquette · aucun flux sanitaire connecté.</p></section>';
  }

  function pageAlertDetail(id) {
    const item = alerts.find((alert) => alert.id === id) || alerts[0];
    return '<section class="app-screen"><button type="button" class="app-text-button" data-back>← Retour aux alertes</button>' +
      '<div class="detail-hero"><span class="med-symbol">' + (item.type === "Rupture" ? "!" : "↗") + '</span><div><p class="app-kicker">ALERTE · EXEMPLE</p><strong>' + item.name + '</strong><p>' + item.type + " de stock · donnée simulée</p></div></div>" +
      '<div class="detail-info"><div><span>Zone signalée</span><strong>' + item.area + '</strong></div><div><span>Signalement exemple</span><strong>' + item.time + "</strong></div></div>" +
      '<p class="inline-empty" style="margin-top:14px">Cette alerte illustre une sous-page réservée au rôle hospitalier. Elle ne provient pas d’un établissement réel.</p>' +
      '<button type="button" class="secondary-action" data-back>Retour à la liste</button></section>';
  }

  function pageReviews() {
    return '<section class="app-screen"><button type="button" class="app-text-button" data-back>← Retour à la pharmacie</button>' +
      '<p class="app-kicker" style="margin-top:16px">AVIS · EXEMPLES</p><h2 class="app-title">Avis patients</h2>' +
      '<p class="app-subtitle">Pharmacie du Plateau · notes et commentaires fictifs.</p>' +
      '<article class="booking-card"><div><strong>★★★★☆ · 4,8</strong><span class="booking-pill">Démo</span></div><p>« Accueil agréable et informations claires. »<br>Exemple d’avis · il y a 2 semaines</p></article>' +
      '<button type="button" class="primary-action" data-action="review">Donner mon avis</button><p class="update-caption">Les avis ne sont pas publiés.</p></section>';
  }

  function render() {
    renderTabs();
    const pages = {
      home: pageHome,
      results: pageResults,
      medicine: pageMedicine,
      pharmacies: pagePharmacies,
      map: pageMap,
      pharmacy: pagePharmacy,
      profile: pageProfile,
      bookings: pageBookings,
      alerts: pageAlerts,
      alert: () => pageAlertDetail(state.selectedAlert),
      reviews: pageReviews
    };
    view.innerHTML = (pages[state.route] || pageHome)();
    updateClock();
    pickerButtons.forEach((button) => {
      const selected = button.dataset.preview === state.tab;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
  }

  function search(event, kind) {
    event.preventDefault();
    const form = event.target;
    const data = new FormData(form);
    state.query = String(data.get("query") || "").trim();
    go(kind === "pharmacy" ? "pharmacies" : "results", kind === "pharmacy" ? "pharmacies" : "home");
  }

  view.addEventListener("submit", (event) => {
    if (event.target.id === "medicine-search") search(event, "medicine");
    if (event.target.id === "pharmacy-search") search(event, "pharmacy");
  });

  document.addEventListener("click", (event) => {
    const target = event.target.closest("button, a");
    if (!target) return;
    if (target.tagName === "A" && target.dataset.route) event.preventDefault();
    if (target.dataset.preview) {
      const selected = target.dataset.preview;
      if (selected === "alerts") {
        state.role = "hospital";
        state.tab = "alerts";
        state.route = "alerts";
      } else {
        state.role = "citizen";
        state.tab = selected;
        state.route = selected;
      }
      state.query = "";
      render();
      return;
    }
    if (target.dataset.tab) {
      state.tab = target.dataset.tab;
      state.route = target.dataset.tab;
      state.query = "";
      render();
      return;
    }
    if (target.dataset.route) {
      state.route = target.dataset.route;
      if (["home", "map", "pharmacies", "profile", "alerts"].includes(target.dataset.route)) state.tab = target.dataset.route;
      render();
      return;
    }
    if (target.hasAttribute("data-back")) {
      if (state.route === "medicine") state.route = "results";
      else if (state.route === "pharmacy" || state.route === "reviews") state.route = "pharmacies";
      else if (state.route === "bookings") state.route = "profile";
      else if (state.route === "alert") state.route = "alerts";
      else state.route = state.tab;
      render();
      return;
    }
    if (target.dataset.medicine) {
      state.selectedMedicine = target.dataset.medicine;
      state.route = "medicine";
      render();
      return;
    }
    if (target.dataset.pharmacy) {
      state.selectedPharmacy = target.dataset.pharmacy;
      state.route = "pharmacy";
      render();
      return;
    }
    if (target.dataset.filter) {
      state.pharmacyFilter = target.dataset.filter;
      render();
      return;
    }
    if (target.dataset.alertFilter) {
      state.alertFilter = target.dataset.alertFilter;
      render();
      return;
    }
    if (target.dataset.alert) {
      state.selectedAlert = target.dataset.alert;
      state.route = "alert";
      render();
      return;
    }
    if (target.dataset.action === "reserve") {
      state.bookings += 1;
      showToast("Réservation ajoutée à la maquette.");
      state.route = "bookings";
      state.tab = "profile";
      render();
    } else if (target.dataset.action === "alert") {
      showToast("Alerte ajoutée à la maquette.");
    } else if (target.dataset.action === "switch-role") {
      state.role = state.role === "hospital" ? "citizen" : "hospital";
      state.tab = state.role === "hospital" ? "alerts" : "profile";
      state.route = state.tab;
      render();
    } else if (target.dataset.action === "call") {
      showToast("Appel simulé · aucun appel réel.");
    } else if (target.dataset.action === "review") {
      if (state.route === "reviews") showToast("Merci, avis enregistré dans la maquette.");
      else { state.route = "reviews"; render(); }
    } else if (target.dataset.action === "favorites") {
      showToast("Vos favoris de démonstration apparaîtront ici.");
    } else if (target.dataset.action === "edit-profile") {
      showToast("Modification du profil · parcours de démonstration.");
    }
  });

  updateClock();
  window.setInterval(updateClock, 15000);
  render();
})();

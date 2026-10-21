(() => {
  "use strict";

  const view = document.getElementById("phone-view");
  const tabs = document.getElementById("phone-tabs");
  const clock = document.getElementById("phone-clock");
  const toast = document.getElementById("phone-toast");
  const pickerButtons = document.querySelectorAll("[data-preview]");
  
  const state = {
    route: "home", tab: "home", role: "citizen", pharmacyFilter: "Toutes",
    query: "", selectedMedicine: "doliprane", selectedPharmacy: "plateau",
    selectedAlert: "amoxicilline", bookings: 0, alertFilter: "Toutes", toastTimer: 0
  };

  const medicines = [
    { id: "doliprane", name: "Paracétamol 500 mg", detail: "Boîte de 16 comprimés", icon: "capsule", status: "Disponible", className: "", pharmacies: 4 },
    { id: "vitamine", name: "Vitamine C 1000 mg", detail: "Comprimés effervescents", icon: "vitamin", status: "À vérifier", className: "unavailable", pharmacies: 2 },
    { id: "serum", name: "Sérum physiologique", detail: "Unidose · 5 ml", icon: "serum", status: "Disponible", className: "", pharmacies: 3 }
  ];
  const pharmacies = [
    { id: "plateau", name: "Pharmacie du Plateau", distance: "0,8 km", area: "Plateau · Dakar", open: true, rating: "4,8", reviews: "42 avis", image: "pharmacy-showcase-1.jpg" },
    { id: "medina", name: "Pharmacie de la Médina", distance: "1,6 km", area: "Médina · Dakar", open: true, rating: "4,6", reviews: "28 avis", image: "pharmacy-showcase-2.jpg" },
    { id: "fann", name: "Pharmacie de Fann", distance: "2,4 km", area: "Fann · Dakar", open: false, rating: "4,7", reviews: "19 avis", image: "pharmacy-showcase-1.jpg" }
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
    pin: '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    capsule: '<path d="M5.5 18.5a5 5 0 0 1 0-7.1l5.9-5.9a5 5 0 0 1 7.1 7.1l-5.9 5.9a5 5 0 0 1-7.1 0Z"/><path d="m8 14 4 4"/>',
    vitamin: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v10m-5-5h10"/>',
    serum: '<path d="M9 3h6m-5 0v4l-3 3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-9l-3-3V3"/><path d="M8 11h8m-6 4h4"/>',
    medicine: '<path d="M5.5 18.5a5 5 0 0 1 0-7.1l5.9-5.9a5 5 0 0 1 7.1 7.1l-5.9 5.9a5 5 0 0 1-7.1 0Z"/><path d="m8 14 4 4"/>',
    crosshair: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2"/>',
    heart: '<path d="M20.8 8.8c0 5.2-8.8 10.2-8.8 10.2S3.2 14 3.2 8.8A4.7 4.7 0 0 1 12 6.5a4.7 4.7 0 0 1 8.8 2.3Z"/>',
    warning: '<path d="M10.3 4.3 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z"/><path d="M12 9v5m0 3h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',
    arrowRight: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>'
  };

  function icon(name) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (icons[name] || "") + "</svg>"; }

  function starRating(rating) {
    const value = parseFloat(String(rating).replace(",", "."));
    return '<span class="rating-stars" aria-label="Note ' + rating + ' sur 5">' + 
      Array.from({ length: 5 }, (_, i) => '<svg viewBox="0 0 24 24" class="' + (i < Math.round(value) ? "star-on" : "star-off") + '"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/></svg>').join("") + "</span>";
  }

  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]); }
  function medicineById(id) { return medicines.find((m) => m.id === id) || medicines[0]; }
  function pharmacyById(id) { return pharmacies.find((p) => p.id === id) || pharmacies[0]; }
  function go(route, tab) { state.route = route; if (tab) state.tab = tab; render(); }

  function showToast(message) {
    window.clearTimeout(state.toastTimer); toast.textContent = message;
    toast.classList.remove("toast-visible"); void toast.offsetWidth;
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
    const destinations = [ ["home", "Accueil"], ["map", "Carte"], ["pharmacies", "Pharma"], ["profile", "Profil"] ];
    if (state.role === "hospital") destinations.push(["alerts", "Alertes"]);
    tabs.classList.toggle("has-alerts", state.role === "hospital");
    tabs.innerHTML = destinations.map(([id, label]) => '<button class="phone-tab" type="button" data-tab="' + id + '"' + (state.tab === id ? ' aria-current="page"' : "") + ">" + icon(id === "pharmacies" ? "pharmacy" : id) + "<span>" + label + "</span></button>").join("");
  }

  function medicineCard(item) {
    return '<button class="med-row" type="button" data-medicine="' + item.id + '">' +
      '<span class="med-symbol' + (item.id === "vitamine" ? " green" : "") + '">' + icon(item.icon) + "</span>" +
      '<span class="med-row-copy"><strong>' + item.name + "</strong><span>" + item.detail + "</span></span>" +
      '<span class="stock-status ' + item.className + '">' + item.status + "</span></button>";
  }

  function pharmacyCard(item) {
    return `
      <button type="button" class="pharmacy-card" data-pharmacy="${item.id}">
        <span class="pharmacy-icon">${icon("pharmacy")}</span>
        <span class="pharmacy-copy">
          <strong>${item.name}</strong>
          <span>${item.area}</span>
          <span class="${item.open ? "open-status" : "closed-status"}">${item.open ? "Ouverte" : "Fermée"} · ${item.rating} ★</span>
        </span>
        <span class="pharmacy-distance">${item.distance}</span>
      </button>`;
  }

  function pharmacyMiniCard(item) {
    const area = item.area.split(" · ")[0];
    return '<button type="button" class="pharmacy-mini-card" data-pharmacy="' + item.id + '">' +
      '<span class="pharmacy-mini-image">' +
        '<img src="assets/' + (item.image || "pharmacy-showcase-1.jpg") + '" alt="">' +
        '<span class="pharmacy-mini-badge ' + (item.open ? "open" : "closed") + '">' + (item.open ? "Ouverte" : "Fermée") + '</span>' +
      '</span>' +
      '<span class="pharmacy-mini-copy"><strong>' + item.name + '</strong>' +
        '<span class="pharmacy-mini-meta"><span>' + area + '</span><span class="pharmacy-mini-distance">' + item.distance + '</span></span>' +
      '</span>' +
    '</button>';
  }

 function pageHome() {
  const open = pharmacies.filter((p) => p.open).length;
  return '<section class="app-screen">' +
    '<div class="home-greeting"><div>' +
      '<p class="app-kicker" id="phone-date"></p>' +
      '<h2 class="app-title">Bonjour, Awa</h2>' +
      '<div class="location-caption">' + icon("pin") + "<span>Dakar, Sénégal</span></div></div>" +
      '<span class="app-demo-label">DÉMO</span></div>' +

    '<div class="duty-card">' +
      '<div class="duty-label">Pharmacies ouvertes</div>' +
      '<div class="duty-main"><strong>' + String(open).padStart(2, "0") + '</strong><span>près de vous<br>à Dakar ce soir</span></div>' +
      '<div class="duty-foot"><span>Pharmacie du Plateau · 0,8 km</span>' +
        '<button type="button" data-tab="map">Voir' + icon("arrowRight") + '</button></div></div>' +

    '<form class="app-search" id="medicine-search">' + icon("search") +
      '<input name="query" aria-label="Rechercher un médicament" placeholder="Quel médicament recherchez-vous ?" value="' + escapeHtml(state.query) + '">' +
      '<button type="submit" aria-label="Rechercher">' + icon("search") + "</button></form>" +

    '<div class="app-section-head"><h3>Aperçu</h3><span class="app-demo-label">SIMULÉ</span></div>' +
    '<div class="vitals">' +
      '<div class="vital" style="--w:80%"><span>Disponibles</span><strong>' + medicines.filter((m) => !m.className).length + '<small> / ' + medicines.length + '</small></strong><i></i></div>' +
      '<div class="vital" style="--w:66%"><span>Ouvertes</span><strong>' + open + '<small> / ' + pharmacies.length + '</small></strong><i></i></div>' +
      '<div class="vital" style="--w:35%"><span>À vérifier</span><strong>' + medicines.filter((m) => m.className).length + '<small> méd.</small></strong><i></i></div></div>' +

    '<div class="app-section-head"><h3>Accès rapide</h3></div>' +
    '<div class="category-row">' +
      '<button type="button" class="category-button" data-tab="map"><span class="category-icon">' + icon("crosshair") + '</span>Carte</button>' +
      '<button type="button" class="category-button" data-tab="profile"><span class="category-icon">' + icon("heart") + '</span>Favoris</button>' +
      '<button type="button" class="category-button" data-route="bookings"><span class="category-icon">' + icon("medicine") + '</span>Réserv.</button>' +
      '<button type="button" class="category-button" data-preview="alerts"><span class="category-icon">' + icon("alerts") + '</span>Hôpital</button></div>' +

    '<div class="app-section-head"><h3>Disponibles près de vous</h3>' +
      '<button class="app-text-button" type="button" data-route="results">Tout voir' + icon("arrowRight") + '</button></div>' +
    '<div class="med-list">' + medicines.slice(0, 2).map(medicineCard).join("") + '</div>' +

    '<div class="app-section-head"><h3>Où les trouver</h3>' +
      '<button class="app-text-button" type="button" data-route="pharmacies">Tout voir' + icon("arrowRight") + '</button></div>' +
    '<div class="pharmacy-scroll">' + pharmacies.map(pharmacyMiniCard).join("") + '</div>' +

    '<p class="update-caption">Démo · actualisée à l’instant</p></section>';
}

  // ... (Les autres pages : pageResults, pageMedicine, pagePharmacies, etc. restent identiques à la version précédente)
  
  function pageResults() {
    const query = state.query.trim().toLocaleLowerCase("fr");
    const results = medicines.filter((item) => !query || (item.name + " " + item.detail).toLocaleLowerCase("fr").includes(query));
    return '<section class="app-screen"><button type="button" class="app-text-button" data-back>' + icon("back") + "Retour</button>" +
      '<p class="app-kicker" style="margin-top:16px">RECHERCHE</p><h2 class="app-title">Médicaments</h2>' +
      '<form class="app-search" id="medicine-search">' + icon("search") + '<input name="query" aria-label="Rechercher un médicament" placeholder="Nom du médicament" value="' + escapeHtml(state.query) + '"><button type="submit" aria-label="Rechercher">' + icon("search") + "</button></form>" +
      '<div class="app-section-head"><h3>' + (query ? results.length + " résultat" + (results.length > 1 ? "s" : "") : "Suggestions") + '</h3><span class="app-demo-label">DONNÉES DÉMO</span></div>' +
      (results.length ? '<div class="med-list">' + results.map(medicineCard).join("") + "</div>" : '<p class="inline-empty">Aucun médicament ne correspond à cette recherche.</p>') +
      '<p class="update-caption">La disponibilité affichée est fictive.</p></section>';
  }

  function pageMedicine() {
    const item = medicineById(state.selectedMedicine);
    return '<section class="app-screen"><button type="button" class="app-text-button" data-back>' + icon("back") + "Retour aux résultats</button>" +
      '<div class="detail-hero"><span class="med-symbol green">' + icon(item.icon) + '</span><div><p class="app-kicker">MÉDICAMENT · DÉMO</p><strong>' + item.name + "</strong><p>" + item.detail + "</p></div></div>" +
      '<div class="detail-info"><div><span>Disponibilité exemple</span><strong>' + item.status + '</strong></div><div><span>Pharmacies listées</span><strong>' + item.pharmacies + " (fictives)</strong></div></div>" +
      '<div class="app-section-head"><h3>Pharmacies à proximité</h3><button type="button" class="app-text-button" data-tab="pharmacies">Tout voir</button></div>' +
      '<div class="pharmacy-list">' + pharmacies.slice(0, 2).map(pharmacyCard).join("") + "</div>" +
      '<button type="button" class="primary-action" data-action="reserve">Réserver dans la maquette</button>' +
      '<button type="button" class="secondary-action" data-action="alert">M’avertir de la disponibilité</button>' +
      '<p class="update-caption">Aucune réservation ne sera transmise à une pharmacie.</p></section>';
  }

  function filteredPharmacies() {
    if (state.pharmacyFilter === "Ouvertes") return pharmacies.filter((p) => p.open);
    if (state.pharmacyFilter === "Fermées") return pharmacies.filter((p) => !p.open);
    if (state.pharmacyFilter === "Proches") return pharmacies.filter((p) => parseFloat(p.distance) < 2);
    return pharmacies;
  }

  function pagePharmacies() {
    const filters = ["Toutes", "Ouvertes", "Fermées", "Proches"];
    return '<section class="app-screen"><p class="app-kicker">AUTOUR DE VOUS · DAKAR</p><h2 class="app-title">Pharmacies</h2>' +
      '<p class="app-subtitle">Trouvez une pharmacie et consultez les informations.</p>' +
      '<form class="app-search" id="pharmacy-search">' + icon("search") + '<input name="query" aria-label="Rechercher une pharmacie" placeholder="Nom ou quartier" value="' + escapeHtml(state.query) + '"><button type="submit" aria-label="Rechercher">' + icon("search") + "</button></form>" +
      '<div class="filter-row">' + filters.map((label) => '<button type="button" data-filter="' + label + '" aria-pressed="' + (state.pharmacyFilter === label) + '">' + label + "</button>").join("") + "</div>" +
      '<div class="pharmacy-list">' + (filteredPharmacies().filter((p) => !state.query || (p.name + p.area).toLocaleLowerCase("fr").includes(state.query.toLocaleLowerCase("fr"))).map(pharmacyCard).join("") || '<p class="inline-empty">Aucune pharmacie dans ces résultats.</p>') + "</div>" +
      '<p class="update-caption">Adresses et horaires de démonstration.</p></section>';
  }

  function pageMap() {
    return '<section class="app-screen"><p class="app-kicker">EXPLORER · DAKAR</p><h2 class="app-title">Carte des pharmacies</h2>' +
      '<p class="app-subtitle">Les repères ci-dessous sont illustratifs.</p>' +
      '<div class="map-illustration" role="img" aria-label="Carte illustrative de Dakar avec trois pharmacies fictives">' +
      '<span class="map-road one"></span><span class="map-road two"></span><span class="map-road three"></span><span class="map-river"></span>' +
      '<span class="map-label l1">PLATEAU</span><span class="map-label l2">MÉDINA</span><span class="map-label l3">FANN</span>' +
      '<span class="map-pin p1"><span>' + icon("pharmacy") + '</span></span><span class="map-pin p2"><span>' + icon("pharmacy") + '</span></span><span class="map-pin p3"><span>' + icon("pharmacy") + '</span></span></div>' +
      '<p class="map-note">' + icon("info") + " Carte schématique · géolocalisation non activée</p>" +
      '<div class="app-section-head"><h3>Pharmacies proches</h3><button type="button" class="app-text-button" data-tab="pharmacies">Liste</button></div>' +
      '<div class="pharmacy-list">' + pharmacies.slice(0, 2).map(pharmacyCard).join("") + "</div></section>";
  }

  function pagePharmacy() {
    const item = pharmacyById(state.selectedPharmacy);
    return '<section class="app-screen"><button type="button" class="app-text-button" data-back>' + icon("back") + "Retour aux pharmacies</button>" +
      '<div class="detail-hero"><span class="pharmacy-icon">' + icon("pharmacy") + '</span><div><p class="app-kicker">PHARMACIE · DÉMO</p><strong>' + item.name + "</strong><p>" + item.area + "</p></div></div>" +
      '<div class="detail-info"><div><span>Horaires (fictifs)</span><strong>' + (item.open ? "Ouverte · ferme à 20 h" : "Fermée · ouvre à 8 h") + '</strong></div><div><span>Avis de démonstration</span><strong class="detail-rating">' + item.rating + " ★ · " + item.reviews + "</strong></div></div>" +
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
      '<button type="button" class="settings-row" data-route="bookings"><span>Mes réservations · ' + state.bookings + '</span>' + icon("chevron") + "</button>" +
      '<button type="button" class="settings-row" data-action="favorites"><span>Mes pharmacies favorites</span>' + icon("chevron") + "</button>" +
      '<button type="button" class="settings-row" data-action="edit-profile"><span>Informations personnelles</span>' + icon("chevron") + "</button></div>" +
      '<div class="app-section-head"><h3>Mode de démonstration</h3></div>' +
      '<button type="button" class="secondary-action" data-action="switch-role">' + (state.role === "hospital" ? "Passer en mode usager" : "Découvrir l’espace hôpital") + "</button>" +
      '<p class="update-caption">Profil fictif · aucune donnée personnelle stockée.</p></section>';
  }

  function pageBookings() {
    return '<section class="app-screen"><button type="button" class="app-text-button" data-back>' + icon("back") + "Retour au profil</button>" +
      '<p class="app-kicker" style="margin-top:16px">VOTRE ESPACE</p><h2 class="app-title">Mes réservations</h2>' +
      (state.bookings ? '<div class="app-demo-label" style="margin-top:10px">RÉSERVATION FICTIVE</div>' +
        Array.from({ length: state.bookings }, () => '<article class="booking-card"><div><strong>' + medicineById(state.selectedMedicine).name + '</strong><span class="booking-pill">À confirmer</span></div><p>Pharmacie du Plateau<br>Exemple de réservation · aucune demande réelle envoyée</p></article>').join("") :
        '<p class="inline-empty" style="margin-top:16px">Aucune réservation pour le moment.</p>') +
      '<p class="update-caption">Les réservations ne sont pas synchronisées à un service.</p></section>';
  }

  function pageAlerts() {
    const shown = alerts.filter((a) => state.alertFilter === "Toutes" || a.type === state.alertFilter);
    return '<section class="app-screen"><p class="app-kicker">ESPACE PROFESSIONNEL · HÔPITAL</p><h2 class="app-title">Alertes de stock</h2>' +
      '<p class="app-subtitle">Une vue de démonstration destinée aux établissements de santé.</p>' +
      '<div class="app-demo-label" style="margin-top:10px">DONNÉES SIMULÉES · NON TEMPS RÉEL</div>' +
      '<div class="detail-info"><div><span>Tensions exemple</span><strong>01</strong></div><div><span>Ruptures exemple</span><strong>02</strong></div></div>' +
      '<div class="filter-row">' + ["Toutes", "Tension", "Rupture"].map((label) => '<button type="button" data-alert-filter="' + label + '" aria-pressed="' + (state.alertFilter === label) + '">' + label + "</button>").join("") + "</div>" +
      shown.map((item) => '<button type="button" class="alert-card" data-alert="' + item.id + '" style="width:100%;text-align:left;cursor:pointer"><div><strong>' + item.name + '</strong><span class="alert-pill">' + item.type + "</span></div><p>" + item.area + " · " + item.time + "</p></button>").join("") +
      '<p class="update-caption">Données fictives de la maquette · aucun flux sanitaire connecté.</p></section>';
  }

  function pageAlertDetail(id) {
    const item = alerts.find((a) => a.id === id) || alerts[0];
    return '<section class="app-screen"><button type="button" class="app-text-button" data-back>' + icon("back") + "Retour aux alertes</button>" +
      '<div class="detail-hero"><span class="med-symbol alert-symbol">' + icon("warning") + '</span><div><p class="app-kicker">ALERTE · EXEMPLE</p><strong>' + item.name + '</strong><p>' + item.type + " de stock · donnée simulée</p></div></div>" +
      '<div class="detail-info"><div><span>Zone signalée</span><strong>' + item.area + '</strong></div><div><span>Signalement exemple</span><strong>' + item.time + "</strong></div></div>" +
      '<p class="inline-empty" style="margin-top:14px">Cette alerte illustre une sous-page réservée au rôle hospitalier. Elle ne provient pas d’un établissement réel.</p>' +
      '<button type="button" class="secondary-action" data-back>Retour à la liste</button></section>';
  }

  function pageReviews() {
    return '<section class="app-screen"><button type="button" class="app-text-button" data-back>' + icon("back") + "Retour à la pharmacie</button>" +
      '<p class="app-kicker" style="margin-top:16px">AVIS · EXEMPLES</p><h2 class="app-title">Avis patients</h2>' +
      '<p class="app-subtitle">Pharmacie du Plateau · notes et commentaires fictifs.</p>' +
      '<article class="booking-card"><div><strong class="review-rating">' + starRating("4,8") + ' <span>4,8</span></strong><span class="booking-pill">Démo</span></div><p>« Accueil agréable et informations claires. »<br>Exemple d’avis · il y a 2 semaines</p></article>' +
      '<button type="button" class="primary-action" data-action="review">Donner mon avis</button>' +
      '<p class="update-caption">Les avis ne sont pas publiés.</p></section>';
  }

  function render() {
    renderTabs();
    const pages = {
      home: pageHome, results: pageResults, medicine: pageMedicine,
      pharmacies: pagePharmacies, map: pageMap, pharmacy: pagePharmacy,
      profile: pageProfile, bookings: pageBookings,
      alerts: pageAlerts, alert: () => pageAlertDetail(state.selectedAlert),
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
    event.preventDefault(); const data = new FormData(event.target);
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
      if (selected === "alerts") { state.role = "hospital"; state.tab = "alerts"; state.route = "alerts"; }
      else { state.role = "citizen"; state.tab = selected; state.route = selected; }
      state.query = ""; render(); return;
    }
    if (target.dataset.tab) { state.tab = target.dataset.tab; state.route = target.dataset.tab; state.query = ""; render(); return; }
    if (target.dataset.route) { state.route = target.dataset.route; if (["home","map","pharmacies","profile","alerts"].includes(target.dataset.route)) state.tab = target.dataset.route; render(); return; }
    if (target.hasAttribute("data-back")) {
      if (state.route === "medicine") state.route = "results";
      else if (state.route === "pharmacy" || state.route === "reviews") state.route = "pharmacies";
      else if (state.route === "bookings") state.route = "profile";
      else if (state.route === "alert") state.route = "alerts";
      else state.route = state.tab;
      render(); return;
    }
    if (target.dataset.medicine) { state.selectedMedicine = target.dataset.medicine; state.route = "medicine"; render(); return; }
    if (target.dataset.pharmacy) { state.selectedPharmacy = target.dataset.pharmacy; state.route = "pharmacy"; render(); return; }
    if (target.dataset.filter) { state.pharmacyFilter = target.dataset.filter; render(); return; }
    if (target.dataset.alertFilter) { state.alertFilter = target.dataset.alertFilter; render(); return; }
    if (target.dataset.alert) { state.selectedAlert = target.dataset.alert; state.route = "alert"; render(); return; }
    
    if (target.dataset.action === "reserve") {
      state.bookings += 1; showToast("Réservation ajoutée à la maquette.");
      state.route = "bookings"; state.tab = "profile"; render();
    } else if (target.dataset.action === "alert") { showToast("Alerte ajoutée à la maquette.");
    } else if (target.dataset.action === "switch-role") {
      state.role = state.role === "hospital" ? "citizen" : "hospital";
      state.tab = state.role === "hospital" ? "alerts" : "profile";
      state.route = state.tab; render();
    } else if (target.dataset.action === "call") { showToast("Appel simulé · aucun appel réel.");
    } else if (target.dataset.action === "review") {
      if (state.route === "reviews") showToast("Merci, avis enregistré dans la maquette.");
      else { state.route = "reviews"; render(); }
    } else if (target.dataset.action === "favorites") { showToast("Vos favoris de démonstration apparaîtront ici.");
    } else if (target.dataset.action === "edit-profile") { showToast("Modification du profil · parcours de démonstration."); }
  });

  updateClock();
  window.setInterval(updateClock, 15000);
  render();
})();
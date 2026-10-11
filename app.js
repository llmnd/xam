(function () {
  "use strict";

  var DATA_KEY = "xamsamed_demo_data_v1";
  var USER_KEY = "xamsamed_demo_user_v1";
  var content = document.getElementById("application-content");
  var loginScreen = document.getElementById("login-screen");
  var loginForm = document.getElementById("login-form");
  var loginError = document.getElementById("login-error");
  var selectedUser = null;
  var store = null;
  var toastTimer = null;
  var fallbackIdCounter = 0;
  var filters = { status: "all" };

  var incidentTypes = {
    flood: "Route inondée",
    blocked: "Route bloquée",
    damaged: "Route endommagée",
    other: "Autre difficulté"
  };

  var statusLabels = {
    reported: "À vérifier",
    confirmed: "Confirmé",
    resolved: "Résolu"
  };

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    fallbackIdCounter += 1;
    return "incident-" + Date.now() + "-" + fallbackIdCounter;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[character];
    });
  }

  function createSeedReports() {
    var now = Date.now();
    return [
      {
        id: "demo-medina",
        type: "flood",
        location: "Médina · avenue Blaise Diagne",
        description: "Exemple de démonstration : eau signalée sur la chaussée après la pluie.",
        status: "reported",
        reporter: "Exemple démo",
        reporterRole: "citizen",
        source: "Incident fictif",
        latitude: null,
        longitude: null,
        createdAt: new Date(now - 22 * 60000).toISOString(),
        updatedAt: new Date(now - 22 * 60000).toISOString(),
        history: [{ status: "reported", actor: "Exemple démo", at: new Date(now - 22 * 60000).toISOString() }],
        votes: { confirm: [], passable: [] }
      },
      {
        id: "demo-fann",
        type: "blocked",
        location: "Fann · rue de l’Université",
        description: "Exemple de démonstration : passage signalé comme impraticable.",
        status: "confirmed",
        reporter: "Exemple démo",
        reporterRole: "agent",
        source: "Observation terrain fictive",
        latitude: null,
        longitude: null,
        createdAt: new Date(now - 78 * 60000).toISOString(),
        updatedAt: new Date(now - 51 * 60000).toISOString(),
        history: [
          { status: "reported", actor: "Exemple démo", at: new Date(now - 78 * 60000).toISOString() },
          { status: "confirmed", actor: "Exemple démo", at: new Date(now - 51 * 60000).toISOString() }
        ],
        votes: { confirm: [], passable: [] }
      }
    ];
  }

  function saveStore(nextStore) {
    try {
      window.localStorage.setItem(DATA_KEY, JSON.stringify(nextStore));
      store = nextStore;
      return true;
    } catch (error) {
      // Browser storage can reject writes when it is disabled or out of space.
      console.error("XamSaMed local data could not be saved.", error);
      showToast("Enregistrement impossible dans ce navigateur. Vérifiez l’espace disponible et réessayez.", "error");
      return false;
    }
  }

  function readStore() {
    var raw;
    try {
      raw = window.localStorage.getItem(DATA_KEY);
      if (raw === null) {
        var initialStore = { reports: createSeedReports() };
        return saveStore(initialStore);
      }
      var parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.reports) || parsed.reports.some(function (report) {
        return !report || typeof report.id !== "string" || typeof report.location !== "string" ||
          typeof report.description !== "string" || !Object.hasOwn(incidentTypes, report.type) ||
          !Object.hasOwn(statusLabels, report.status) || !Array.isArray(report.history);
      })) {
        throw new Error("Format de données local invalide");
      }
      store = parsed;
      return true;
    } catch (error) {
      // Invalid JSON and blocked storage both need an explicit recovery message.
      console.error("XamSaMed local data could not be read.", error);
      store = { reports: [] };
      showToast("Les données locales sont illisibles. Réinitialisez la démo pour continuer.", "error", 7000);
      return false;
    }
  }

  function readUser() {
    try {
      var raw = window.localStorage.getItem(USER_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed.name !== "string" || !["citizen", "agent"].includes(parsed.role)) {
        return null;
      }
      return parsed;
    } catch (error) {
      // Keep the login available if browser storage is blocked.
      console.error("XamSaMed local session could not be read.", error);
      showToast("Impossible de lire la session locale. Choisissez à nouveau un profil.", "error");
      return null;
    }
  }

  function saveUser(user) {
    try {
      window.localStorage.setItem(USER_KEY, JSON.stringify(user));
      selectedUser = user;
      return true;
    } catch (error) {
      // Do not enter a session that could not be persisted.
      console.error("XamSaMed local session could not be saved.", error);
      loginError.textContent = "La session ne peut pas être enregistrée sur cet appareil.";
      loginError.hidden = false;
      return false;
    }
  }

  function formatDate(value) {
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Date inconnue";
    return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
  }

  function elapsed(value) {
    var minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
    if (minutes < 1) return "À l’instant";
    if (minutes < 60) return "Il y a " + minutes + " min";
    var hours = Math.floor(minutes / 60);
    if (hours < 24) return "Il y a " + hours + " h";
    return formatDate(value);
  }

  function roleName(role) {
    return role === "agent" ? "Agent terrain" : "Usager";
  }

  function initials(name) {
    return name.trim().split(/\s+/).slice(0, 2).map(function (part) {
      return part.charAt(0).toUpperCase();
    }).join("") || "XM";
  }

  function showToast(message, type, duration) {
    var region = document.getElementById("toast-region");
    if (!region) return;
    window.clearTimeout(toastTimer);
    region.innerHTML = '<div class="app-toast ' + (type === "error" ? "toast-error" : "toast-success") + '" role="status"><span>' + (type === "error" ? "!" : "✓") + '</span>' + escapeHtml(message) + '</div>';
    toastTimer = window.setTimeout(function () { region.innerHTML = ""; }, duration || 3600);
  }

  function statusClass(status) {
    var classes = {
      reported: "status-reported",
      confirmed: "status-confirmed",
      resolved: "status-resolved"
    };
    return classes[status] || classes.reported;
  }

  function readVotes(report) {
    var votes = report.votes && typeof report.votes === "object" ? report.votes : {};
    return {
      confirm: Array.isArray(votes.confirm) ? votes.confirm.filter(function (voter) { return typeof voter === "string"; }) : [],
      passable: Array.isArray(votes.passable) ? votes.passable.filter(function (voter) { return typeof voter === "string"; }) : []
    };
  }

  function voterId() {
    return selectedUser.role + ":" + selectedUser.name.trim().toLocaleLowerCase("fr");
  }

  function renderCommunityVotes(report, agentView) {
    var votes = readVotes(report);
    var voter = voterId();
    var canVote = !agentView && report.status !== "resolved";
    var markup = '<div class="community-votes" aria-label="Avis de la communauté">' +
      '<div class="community-vote-summary"><span>👥</span><strong>' + votes.confirm.length +
      '</strong> confirment le problème <span class="vote-separator">·</span><strong>' + votes.passable.length +
      '</strong> signalent un passage praticable</div>';
    if (canVote) {
      markup += '<div class="community-vote-actions">' +
        '<button class="community-vote-button' + (votes.confirm.includes(voter) ? ' is-selected' : '') +
        '" type="button" data-action="vote" data-vote="confirm" data-id="' + escapeHtml(report.id) +
        '" aria-pressed="' + String(votes.confirm.includes(voter)) + '">👍 Je confirme</button>' +
        '<button class="community-vote-button' + (votes.passable.includes(voter) ? ' is-selected' : '') +
        '" type="button" data-action="vote" data-vote="passable" data-id="' + escapeHtml(report.id) +
        '" aria-pressed="' + String(votes.passable.includes(voter)) + '">↗ C’est praticable</button>' +
        '</div><small class="community-vote-note">Votre avis aide l’équipe, mais ne remplace pas la vérification terrain.</small>';
    } else if (agentView) {
      markup += '<small class="community-vote-note">Avis des usagers · vérification terrain requise avant validation.</small>';
    } else {
      markup += '<small class="community-vote-note">Les avis restent consultables après la résolution.</small>';
    }
    return markup + '</div>';
  }

  function reportCard(report, agentView) {
    var actions = "";
    if (agentView && report.status === "reported") {
      actions = '<div class="report-actions"><button class="button button-small button-confirm" type="button" data-action="confirm" data-id="' + escapeHtml(report.id) + '">Confirmer</button><button class="button button-small button-quiet" type="button" data-action="resolve" data-id="' + escapeHtml(report.id) + '">Classer résolu</button></div>';
    } else if (agentView && report.status === "confirmed") {
      actions = '<div class="report-actions"><button class="button button-small button-quiet" type="button" data-action="resolve" data-id="' + escapeHtml(report.id) + '">Marquer résolu</button></div>';
    }
    var coordinates = Number.isFinite(report.latitude) && Number.isFinite(report.longitude)
      ? '<span class="report-coordinate">GPS ' + report.latitude.toFixed(4) + ', ' + report.longitude.toFixed(4) + '</span>'
      : "";
    var icons = { flood: "≈", blocked: "!", damaged: "⌁", other: "•" };
    var history = Array.isArray(report.history) ? report.history : [];
    var historyMarkup = '<details class="report-history"><summary>Historique (' + history.length + ')</summary><ol>' +
      history.map(function (entry) {
        return '<li><strong>' + escapeHtml(statusLabels[entry.status] || "Mise à jour") + '</strong><span>' + escapeHtml(entry.actor || "Utilisateur") + ' · ' + escapeHtml(formatDate(entry.at)) + '</span></li>';
      }).join("") + '</ol></details>';
    return '<article class="report-card">' +
      '<div class="report-card-icon ' + escapeHtml(report.type) + '">' + (icons[report.type] || icons.other) + '</div>' +
      '<div class="report-main"><div class="report-title-row"><h3>' + escapeHtml(incidentTypes[report.type] || "Signalement") + '</h3><span class="status-pill ' + statusClass(report.status) + '"><i></i>' + escapeHtml(statusLabels[report.status] || "À vérifier") + '</span></div>' +
      '<p class="report-location">⌖ ' + escapeHtml(report.location) + '</p><p class="report-description">' + escapeHtml(report.description) + '</p>' +
      '<div class="report-meta"><span>Par ' + escapeHtml(report.reporter) + '</span><span>' + escapeHtml(report.source || roleName(report.reporterRole)) + '</span><span>' + escapeHtml(elapsed(report.createdAt)) + '</span>' + coordinates + '</div>' +
      renderCommunityVotes(report, agentView) + actions + historyMarkup + '</div></article>';
  }

  function renderSidebar() {
    var profile = document.getElementById("sidebar-profile");
    var avatarText = initials(selectedUser.name);
    profile.innerHTML = '<div class="avatar">' + escapeHtml(avatarText) + '</div><div><strong>' + escapeHtml(selectedUser.name) + '</strong><span>' + roleName(selectedUser.role) + ' · démo locale</span></div><button class="profile-menu profile-logout" type="button" id="logout-button" aria-label="Se déconnecter" title="Se déconnecter">↗</button>';
    document.getElementById("top-avatar").textContent = avatarText;
    document.getElementById("page-breadcrumb").textContent = selectedUser.role === "agent" ? "Espace agent terrain" : "Espace usager";
  }

  function renderApp() {
    if (!selectedUser || !store) return;
    renderSidebar();
    var isAgent = selectedUser.role === "agent";
    var reports = store.reports.slice().sort(function (a, b) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    var counts = countReports(reports);
    var shownReports = reports.filter(function (report) {
      return filters.status === "all" || report.status === filters.status;
    });
    content.innerHTML = renderWelcome(isAgent) + renderDemoNotice() +
      renderMetrics(counts) +
      '<section class="app-work-grid">' + (isAgent ? renderCollectForm() : renderReportForm()) + renderTips(isAgent) + '</section>' +
      renderReports(isAgent, reports, shownReports, counts) +
      '<footer class="page-footer"><span>© XamSaMed · Prototype Challenge SALTIS</span><span>Pas de géolocalisation ni de partage sans votre action.</span></footer>';
    bindAppEvents();
  }

  function countReports(reports) {
    return {
      total: reports.length,
      reported: reports.filter(function (report) { return report.status === "reported"; }).length,
      confirmed: reports.filter(function (report) { return report.status === "confirmed"; }).length,
      resolved: reports.filter(function (report) { return report.status === "resolved"; }).length,
      active: reports.filter(function (report) { return report.status !== "resolved"; }).length
    };
  }

  function renderWelcome(isAgent) {
    var firstName = escapeHtml(selectedUser.name.split(/\s+/)[0]);
    var title = isAgent ? "Bonjour " + firstName + ",<br>prêt à vérifier le terrain ?" : "Bonjour " + firstName + ',<br>un signalement peut aider.';
    var description = isAgent
      ? "Consultez les alertes des usagers, confirmez les observations réelles et consignez vos propres relevés."
      : "Consultez les alertes locales, signalez ce que vous observez et partagez votre avis. Vos contributions aident la communauté à mieux préparer ses déplacements.";
    return '<section class="welcome-row app-welcome"><div><p class="eyebrow"><span class="eyebrow-line"></span>' +
      (isAgent ? "COLLECTE TERRAIN · DAKAR" : "INFORMATIONS DE PROXIMITÉ · DAKAR") +
      '</p><h1>' + title + '</h1><p class="lead">' + description +
      '</p></div><span class="role-indicator ' + (isAgent ? "agent-role" : "citizen-role") + '">' +
      (isAgent ? "◉" : "◎") + " " + roleName(selectedUser.role) + '</span></section>';
  }

  function renderDemoNotice() {
    return '<section class="notice-banner app-notice"><span class="notice-symbol">✳</span><p><strong>Données de démonstration enregistrées sur cet appareil</strong><span>Les premières alertes sont fictives. Les nouveaux signalements restent dans ce navigateur et ne sont pas transmis à une équipe réelle.</span></p><a href="workflow.html">Voir le workflow <span>→</span></a></section>';
  }

  function renderMetrics(counts) {
    return '<section class="metric-grid app-metrics" aria-label="Résumé des signalements">' +
      '<article class="metric-card"><div class="metric-top"><span class="metric-icon icon-coral">⌁</span><span class="metric-tag tag-coral">À TRAITER</span></div><div class="metric-value">' + counts.reported + '</div><div class="metric-label">Signalements à vérifier</div><div class="metric-foot">Observations pas encore confirmées</div></article>' +
      '<article class="metric-card"><div class="metric-top"><span class="metric-icon icon-blue">✓</span><span class="metric-tag tag-neutral">TERRAIN</span></div><div class="metric-value">' + counts.confirmed + '</div><div class="metric-label">Routes confirmées impraticables</div><div class="metric-foot">À garder en compte pour les trajets</div></article>' +
      '<article class="metric-card"><div class="metric-top"><span class="metric-icon icon-green">↗</span><span class="metric-tag tag-green">SUIVI</span></div><div class="metric-value">' + counts.resolved + '</div><div class="metric-label">Incidents résolus</div><div class="metric-foot">Historique conservé localement</div></article>' +
      '<article class="metric-card metric-card-accent"><div class="metric-top"><span class="metric-icon icon-white">⌖</span><span class="metric-tag tag-white">ZONE PILOTE</span></div><div class="metric-value">' + counts.active + '</div><div class="metric-label">Alertes encore actives</div><a class="metric-link" href="#reports">Consulter les signalements <span>→</span></a></article></section>';
  }

  function renderTips(isAgent) {
    var title = isAgent ? "Une observation utile" : "Un signalement utile";
    var kicker = isAgent ? "BONNES PRATIQUES TERRAIN" : "AVANT DE SIGNALER";
    var tips = isAgent
      ? '<li><span>1</span><div><strong>Vérifier sur place</strong><small>Ne confirmer que ce qui a été observé ou recoupé.</small></div></li><li><span>2</span><div><strong>Donner un lieu précis</strong><small>Quartier, repère et GPS si disponible.</small></div></li><li><span>3</span><div><strong>Mettre à jour l’état</strong><small>Clôturer l’alerte quand le passage redevient praticable.</small></div></li>'
      : '<li><span>1</span><div><strong>Choisir le lieu</strong><small>Indiquez le quartier et un repère facile à trouver.</small></div></li><li><span>2</span><div><strong>Décrire ce que vous voyez</strong><small>Un fait constaté, sans supposer l’état des rues voisines.</small></div></li><li><span>3</span><div><strong>Laisser l’agent vérifier</strong><small>Votre alerte reste « à vérifier » tant qu’elle n’est pas confirmée.</small></div></li>';
    return '<article class="panel tips-panel"><div class="panel-heading"><div><p class="section-kicker">' + kicker +
      '</p><h2>' + title + '</h2></div><span class="tips-icon">✦</span></div><ul class="tips-list">' + tips +
      '</ul><div class="tips-source"><span>i</span>Les prévisions météo et cartes historiques donnent du contexte ; elles ne confirment pas l’état actuel d’une route.</div><a class="text-link" href="sources.html">Comprendre les sources <span>→</span></a></article>';
  }

  function renderReports(isAgent, reports, shownReports, counts) {
    var title = isAgent ? "Signalements à examiner" : "Signalements de la zone pilote";
    var subtitle = isAgent
      ? "Les alertes des usagers nécessitent une vérification avant d’influencer un itinéraire."
      : "Partagez une observation ou donnez votre avis. Chaque vote aide, sans remplacer une vérification terrain.";
    var options = '<option value="all"' + (filters.status === "all" ? " selected" : "") + '>Tous (' + counts.total + ')</option>' +
      '<option value="reported"' + (filters.status === "reported" ? " selected" : "") + '>À vérifier (' + counts.reported + ')</option>' +
      '<option value="confirmed"' + (filters.status === "confirmed" ? " selected" : "") + '>Confirmés (' + counts.confirmed + ')</option>' +
      '<option value="resolved"' + (filters.status === "resolved" ? " selected" : "") + '>Résolus (' + counts.resolved + ')</option>';
    var cards = shownReports.map(function (report) { return reportCard(report, isAgent); }).join("");
    var empty = '<div class="empty-state"><span>⌖</span><strong>Aucun signalement dans cette catégorie</strong><p>Essayez un autre filtre ou ajoutez une observation.</p></div>';
    var permissionNote = isAgent
      ? "Seul l’agent terrain peut confirmer ou clôturer un incident."
      : "Besoin de confirmer une alerte ? Un agent terrain doit vérifier l’information.";
    var resetButton = isAgent ? '<button class="reset-demo-button" type="button" data-action="reset">Réinitialiser la démo</button>' : "";
    return '<section class="panel reports-panel" id="reports"><div class="panel-heading reports-heading"><div><p class="section-kicker">' +
      (isAgent ? "FILE DE TRAITEMENT" : "VIE LOCALE") + '</p><h2>' + title + '</h2><p class="panel-subtitle">' +
      subtitle + '</p></div><div class="report-toolbar"><label class="filter-wrap"><span>Filtrer</span><select id="status-filter" aria-label="Filtrer les signalements">' +
      options + '</select></label>' + resetButton + '</div></div><div class="report-list" id="report-list">' +
      (cards || empty) + '</div><div class="reports-footer"><span><i class="info-dot">i</i>' +
      permissionNote + '</span><span>' + counts.total + ' entrée' + (counts.total > 1 ? 's' : '') +
      ' sauvegardée' + (counts.total > 1 ? 's' : '') + ' localement</span></div></section>';
  }

  function renderReportForm() {
    return '<article class="panel form-panel"><div class="panel-heading"><div><p class="section-kicker">PARTICIPER</p><h2>Signaler une route</h2></div><span class="form-step">NOUVEAU</span></div>' +
      '<form id="incident-form" class="incident-form"><div class="form-grid"><label class="form-field"><span>Type de problème</span><select class="form-control" name="type" required><option value="flood">Route inondée</option><option value="blocked">Route bloquée</option><option value="damaged">Route endommagée</option><option value="other">Autre difficulté</option></select></label>' +
      '<label class="form-field"><span>Quartier et repère</span><input class="form-control" name="location" maxlength="90" placeholder="Ex. Médina, près du marché" required></label></div>' +
      '<label class="form-field"><span>Ce que vous observez</span><textarea class="form-control" name="description" rows="3" maxlength="280" placeholder="Décrivez brièvement le passage ou le problème…" required></textarea><small class="field-hint">Décrivez uniquement ce que vous avez constaté.</small></label>' +
      '<div class="gps-row"><button class="gps-button" type="button" data-action="locate">⌖ <span>Ajouter ma position GPS</span></button><span class="gps-status" id="gps-status">Facultatif · autorisation demandée seulement sur action</span></div>' +
      '<div class="form-feedback" id="form-feedback" role="alert" hidden></div><button class="button button-primary form-submit" type="submit">Envoyer le signalement <span>→</span></button></form>' +
      '<div class="form-footnote"><span>i</span>Votre alerte apparaîtra comme « à vérifier » jusqu’à validation par un agent.</div></article>';
  }

  function renderCollectForm() {
    return '<article class="panel form-panel agent-form-panel"><div class="panel-heading"><div><p class="section-kicker">COLLECTE TERRAIN</p><h2>Consigner une observation</h2></div><span class="form-step field-step">AGENT</span></div>' +
      '<form id="incident-form" class="incident-form"><div class="form-grid"><label class="form-field"><span>Type de problème</span><select class="form-control" name="type" required><option value="flood">Route inondée</option><option value="blocked">Route bloquée</option><option value="damaged">Route endommagée</option><option value="other">Autre difficulté</option></select></label>' +
      '<label class="form-field"><span>Quartier et repère</span><input class="form-control" name="location" maxlength="90" placeholder="Ex. Fann, près du poste de santé" required></label></div>' +
      '<label class="form-field"><span>Note de terrain</span><textarea class="form-control" name="description" rows="3" maxlength="280" placeholder="Précisez ce que vous avez vérifié sur place…" required></textarea><small class="field-hint">Cette collecte sera enregistrée comme observation confirmée par l’agent.</small></label>' +
      '<div class="gps-row"><button class="gps-button" type="button" data-action="locate">⌖ <span>Ajouter ma position GPS</span></button><span class="gps-status" id="gps-status">Facultatif · autorisation demandée seulement sur action</span></div>' +
      '<div class="form-feedback" id="form-feedback" role="alert" hidden></div><button class="button button-primary form-submit" type="submit">Enregistrer la collecte terrain <span>→</span></button></form>' +
      '<div class="form-footnote agent-footnote"><span>✓</span>Votre observation sera immédiatement enregistrée comme confirmée.</div></article>';
  }

  function bindAppEvents() {
    var incidentForm = document.getElementById("incident-form");
    incidentForm.addEventListener("submit", handleIncidentSubmit);
    content.querySelectorAll("[data-action]").forEach(function (button) {
      button.addEventListener("click", function () {
        var action = button.dataset.action;
        if (action === "locate") locateUser();
        if (action === "confirm") updateStatus(button.dataset.id, "confirmed");
        if (action === "resolve") updateStatus(button.dataset.id, "resolved");
        if (action === "reset") resetDemo();
        if (action === "vote") castVote(button.dataset.id, button.dataset.vote);
      });
    });
    document.getElementById("switch-role").addEventListener("click", logout);
    document.getElementById("status-filter").addEventListener("change", function (event) {
      filters.status = event.target.value;
      renderApp();
      document.getElementById("reports").scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
    document.getElementById("logout-button").addEventListener("click", logout);
  }

  function formFeedback(message, isError) {
    var feedback = document.getElementById("form-feedback");
    feedback.textContent = message;
    feedback.className = "form-feedback " + (isError ? "feedback-error" : "feedback-success");
    feedback.hidden = false;
  }

  function handleIncidentSubmit(event) {
    event.preventDefault();
    var form = event.currentTarget;
    if (!form.reportValidity()) return;
    var values = new FormData(form);
    var locationValue = values.get("location");
    var descriptionValue = values.get("description");
    var typeValue = values.get("type");
    var location = typeof locationValue === "string" ? locationValue.trim() : "";
    var description = typeof descriptionValue === "string" ? descriptionValue.trim() : "";
    var type = typeof typeValue === "string" && Object.hasOwn(incidentTypes, typeValue) ? typeValue : "other";
    if (location.length < 3 || description.length < 5) {
      formFeedback("Ajoutez un lieu précis et une description d’au moins 5 caractères.", true);
      return;
    }
    var timestamp = new Date().toISOString();
    var status = selectedUser.role === "agent" ? "confirmed" : "reported";
    var gps = form.dataset.gps ? JSON.parse(form.dataset.gps) : null;
    var report = {
      id: createId(),
      type: type,
      location: location,
      description: description,
      status: status,
      reporter: selectedUser.name,
      reporterRole: selectedUser.role,
      source: selectedUser.role === "agent" ? "Collecte terrain" : "Signalement usager",
      latitude: gps ? gps.latitude : null,
      longitude: gps ? gps.longitude : null,
      createdAt: timestamp,
      updatedAt: timestamp,
      history: [{ status: status, actor: selectedUser.name, at: timestamp }],
      votes: { confirm: [], passable: [] }
    };
    var nextStore = { reports: [report].concat(store.reports) };
    if (!saveStore(nextStore)) {
      formFeedback("Le signalement n’a pas été enregistré. Réessayez.", true);
      return;
    }
    filters.status = "all";
    renderApp();
    showToast(selectedUser.role === "agent" ? "Observation terrain enregistrée comme confirmée." : "Signalement enregistré : il attend une vérification.", "success");
    document.getElementById("reports").scrollIntoView({ block: "start", behavior: "smooth" });
  }

  function locateUser() {
    var status = document.getElementById("gps-status");
    var form = document.getElementById("incident-form");
    if (!navigator.geolocation) {
      status.textContent = "La géolocalisation n’est pas disponible dans ce navigateur.";
      status.classList.add("gps-error");
      return;
    }
    status.textContent = "Recherche de votre position…";
    status.classList.remove("gps-error");
    navigator.geolocation.getCurrentPosition(function (position) {
      var coords = {
        latitude: Number(position.coords.latitude.toFixed(6)),
        longitude: Number(position.coords.longitude.toFixed(6))
      };
      form.dataset.gps = JSON.stringify(coords);
      status.textContent = "Position ajoutée : " + coords.latitude.toFixed(4) + ", " + coords.longitude.toFixed(4);
      status.classList.add("gps-success");
    }, function (error) {
      var messages = {
        1: "Accès à la position refusé. Le lieu peut être renseigné manuellement.",
        2: "Position indisponible. Le lieu peut être renseigné manuellement.",
        3: "La recherche de position a expiré. Réessayez ou saisissez le lieu."
      };
      status.textContent = messages[error.code] || "Position indisponible. Vous pouvez saisir le lieu manuellement.";
      status.classList.add("gps-error");
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
  }

  function updateStatus(id, status) {
    if (selectedUser.role !== "agent") {
      showToast("Seul un agent terrain peut modifier le statut d’un incident.", "error");
      return;
    }
    var report = store.reports.find(function (item) { return item.id === id; });
    if (!report || !["confirmed", "resolved"].includes(status)) {
      showToast("Ce signalement n’est plus disponible.", "error");
      return;
    }
    if (report.status === "resolved") {
      showToast("Cet incident est déjà résolu.", "error");
      return;
    }
    if (status === "resolved" && report.status !== "confirmed" && report.status !== "reported") {
      showToast("Le statut de cet incident ne permet pas cette action.", "error");
      return;
    }
    var timestamp = new Date().toISOString();
    var nextStore = {
      reports: store.reports.map(function (item) {
        if (item.id !== id) return item;
        return {
          ...item,
          status: status,
          updatedAt: timestamp,
          history: item.history.concat([{ status: status, actor: selectedUser.name, at: timestamp }])
        };
      })
    };
    if (!saveStore(nextStore)) return;
    renderApp();
    showToast(status === "confirmed" ? "Incident confirmé : il est visible comme impraticable." : "Incident marqué comme résolu.", "success");
  }

  function castVote(id, voteType) {
    if (selectedUser.role !== "citizen" || !["confirm", "passable"].includes(voteType)) {
      showToast("Seuls les usagers peuvent ajouter un avis communautaire.", "error");
      return;
    }
    var report = store.reports.find(function (item) { return item.id === id; });
    if (!report || report.status === "resolved") {
      showToast("Les avis ne sont plus modifiables sur ce signalement.", "error");
      return;
    }
    var votes = readVotes(report);
    var voter = voterId();
    var alreadySelected = votes[voteType].includes(voter);
    votes.confirm = votes.confirm.filter(function (item) { return item !== voter; });
    votes.passable = votes.passable.filter(function (item) { return item !== voter; });
    if (!alreadySelected) votes[voteType].push(voter);
    var nextStore = {
      reports: store.reports.map(function (item) {
        return item.id === id ? { ...item, votes: votes } : item;
      })
    };
    if (!saveStore(nextStore)) return;
    renderApp();
    showToast(alreadySelected ? "Votre avis a été retiré." : "Merci, votre avis aide la communauté.", "success");
  }

  function resetDemo() {
    if (selectedUser.role !== "agent") {
      showToast("Seul l’agent terrain peut réinitialiser les données de démonstration.", "error");
      return;
    }
    if (!window.confirm("Réinitialiser les signalements locaux et remettre les deux exemples fictifs ?")) return;
    if (!saveStore({ reports: createSeedReports() })) return;
    filters.status = "all";
    renderApp();
    showToast("Données locales réinitialisées avec les exemples fictifs.", "success");
  }

  function showLogin() {
    document.body.classList.add("login-open");
    if (!loginScreen.open) loginScreen.showModal();
    window.setTimeout(function () { document.getElementById("login-name").focus(); }, 0);
  }

  function hideLogin() {
    if (loginScreen.open) loginScreen.close();
    document.body.classList.remove("login-open");
  }

  function logout() {
    try {
      window.localStorage.removeItem(USER_KEY);
      selectedUser = null;
      showLogin();
    } catch (error) {
      // Report storage failures rather than leaving the UI in a logged-in state.
      console.error("XamSaMed local session could not be cleared.", error);
      showToast("Impossible de terminer la session locale. Fermez cet onglet pour quitter.", "error");
    }
  }

  document.querySelectorAll("[data-role-option]").forEach(function (option) {
    option.addEventListener("click", function () {
      document.querySelectorAll("[data-role-option]").forEach(function (item) {
        item.classList.toggle("selected", item === option);
      });
      option.querySelector("input").checked = true;
    });
  });

  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();
    var name = document.getElementById("login-name").value.trim();
    var role = new FormData(loginForm).get("role");
    if (name.length < 2) {
      loginError.textContent = "Saisissez un nom d’au moins 2 caractères.";
      loginError.hidden = false;
      return;
    }
    loginError.hidden = true;
    var user = { name: name, role: role };
    if (!saveUser(user)) return;
    hideLogin();
    renderApp();
  });

  window.addEventListener("storage", function (event) {
    if (event.key === DATA_KEY && readStore()) renderApp();
    if (event.key === USER_KEY) {
      selectedUser = readUser();
      if (selectedUser) {
        hideLogin();
        renderApp();
      } else {
        showLogin();
      }
    }
  });

  if (readStore()) {
    selectedUser = readUser();
    if (selectedUser) {
      hideLogin();
      renderApp();
    } else {
      showLogin();
    }
  } else {
    showLogin();
  }
}());
/* XamSaMed — vue d'ensemble en bas de page (anneau, types, courbe).
   Lit les données locales de la démo ; app.js reste inchangé. */
(() => {
  const DATA_KEY = "xamsamed_demo_data_v1";
  const root = document.getElementById("application-content");
  if (!root) return;

  const STATUS = [
    { key: "reported", label: "À vérifier", color: "#d39b5f" },
    { key: "confirmed", label: "Confirmés", color: "#28a478" },
    { key: "resolved", label: "Résolus", color: "#8198aa" },
  ];
  const TYPES = { flood: "Route inondée", blocked: "Route bloquée", damaged: "Route endommagée", other: "Autre difficulté" };
  const HOURS = 12;

  function readReports() {
    try {
      const data = JSON.parse(window.localStorage.getItem(DATA_KEY));
      return data && Array.isArray(data.reports) ? data.reports : [];
    } catch (error) {
      return [];
    }
  }

  function donut(reports) {
    const r = 54, c = 2 * Math.PI * r;
    const counts = Object.fromEntries(STATUS.map((s) => [s.key, reports.filter((x) => x.status === s.key).length]));
    let offset = 0;
    const arcs = STATUS.map((s) => {
      const len = (counts[s.key] / reports.length) * c;
      const arc = `<circle cx="66" cy="66" r="${r}" stroke="${s.color}" stroke-dasharray="${len} ${c - len}" stroke-dashoffset="${-offset}"/>`;
      offset += len;
      return arc;
    }).join("");
    const legend = STATUS.map((s) => `<li><i style="background:${s.color}"></i>${s.label}<b>${counts[s.key]}</b></li>`).join("");
    return `<div class="xm-donut-wrap"><div class="xm-donut-center">
      <svg class="xm-donut" viewBox="0 0 132 132" aria-hidden="true"><circle class="track" cx="66" cy="66" r="${r}"/>${arcs}</svg>
      <strong>${reports.length}</strong></div><ul class="xm-legend">${legend}</ul></div>`;
  }

  function bars(reports) {
    const counts = {};
    reports.forEach((x) => { counts[x.type] = (counts[x.type] || 0) + 1; });
    const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const max = rows[0][1];
    return `<div class="xm-bars">${rows.map(([type, n]) =>
      `<div><div class="xm-bar-head"><span>${TYPES[type] || "Autre"}</span><b>${n}</b></div>
       <div class="xm-bar-track"><div class="xm-bar-fill" style="width:${(n / max) * 100}%"></div></div></div>`).join("")}</div>`;
  }

  function curve(reports) {
    const now = Date.now(), hour = 3600000;
    const times = reports.map((x) => new Date(x.createdAt).getTime()).filter(Number.isFinite);
    const series = [];
    for (let i = HOURS; i >= 0; i--) {
      const limit = now - i * hour;
      series.push(times.filter((t) => t <= limit).length);
    }
    const max = Math.max(...series, 1);
    const W = 600, H = 160, step = W / HOURS;
    const pts = series.map((v, i) => [i * step, H - 8 - (v / max) * (H - 24)]);
    const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
    return `<svg class="xm-line" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Évolution du nombre de signalements sur ${HOURS} heures">
      <defs><linearGradient id="xm-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a73bd" stop-opacity=".22"/><stop offset="1" stop-color="#2a73bd" stop-opacity="0"/></linearGradient></defs>
      <path d="${line} L${W} ${H} L0 ${H} Z" fill="url(#xm-area)"/>
      <path d="${line}" fill="none" stroke="#2a73bd" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>
      <div class="xm-line-axis"><span>Il y a ${HOURS} h</span><span>Il y a ${HOURS / 2} h</span><span>Maintenant</span></div>`;
  }

  function render() {
    if (root.querySelector(".xm-insights")) return;
    const footer = root.querySelector(".page-footer");
    const reports = readReports();
    if (!footer || !reports.length) return;

    const section = document.createElement("section");
    section.className = "xm-insights";
    section.setAttribute("aria-label", "Vue d'ensemble");
    section.innerHTML = `
      <h2 class="xm-insights-title">Vue d'ensemble</h2>
      <article class="panel xm-card"><h2>Où en sont les signalements</h2>${donut(reports)}</article>
      <article class="panel xm-card"><h2>Types de problèmes</h2>${bars(reports)}</article>
      <article class="panel xm-card xm-wide"><h2>Signalements cumulés</h2>${curve(reports)}</article>`;

    observer.disconnect();
    footer.before(section);
    observer.observe(root, { childList: true });
  }

  const observer = new MutationObserver(render);
  observer.observe(root, { childList: true });
  render();
})();
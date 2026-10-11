/* workflow-demo.js — XamSaMed POC · illustration interactive */
(function () {
  'use strict';

  var demo = document.querySelector('.patient-demo');
  if (!demo) return;

  function $(sel, root) { return (root || demo).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || demo).querySelectorAll(sel)); }

  var els = {
    state:         $('#patient-map-state'),
    caption:       $('#patient-map-caption'),
    decision:      $('#patient-decision'),
    decisionTitle: $('#patient-decision-title'),
    decisionCopy:  $('#patient-decision-copy'),
    routeLabels:   $$('[data-route-label]'),
    cards:         $$('.patient-result-card'),
    journalList:   $('#patient-journal-list'),
    journalClear:  $('#patient-journal-clear'),
    medicine:      $('#patient-medicine'),
    focus:         $('[data-patient-focus]'),
    rain:          $('[data-rain-toggle]'),
    actions:       $$('[data-action]'),
    modes:         $$('[data-route-mode]'),
    journey:       $$('.patient-journey li')
  };

  var MEDICINES = {
    paracetamol: 'Paracétamol 500 mg',
    serum:       'Sérum physiologique',
    pansement:   'Pansements'
  };

  var ROUTE_COPY = {
    clear:    { label: 'Trajet direct',           caption: 'Recherche simulée · secteur Médina' },
    reported: { label: 'Signalement à vérifier',  caption: 'Un usager a signalé une inondation' },
    blocked:  { label: 'Route bloquée · détour',  caption: 'Blocage confirmé · recalcul en cours' }
  };

  var state = {
    route: 'clear', target: 'a', selected: 'a',
    alternative: true, medicine: 'paracetamol'
  };

  /* -------- Journal -------- */
  function timestamp() {
    var d = new Date();
    function p(n) { return ('0' + n).slice(-2); }
    return p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  }

  function log(text, tone) {
    if (!els.journalList) return;
    var li = document.createElement('li');
    if (tone) li.setAttribute('data-tone', tone);
    var t = document.createElement('time'); t.textContent = timestamp();
    var s = document.createElement('span'); s.textContent = text;
    li.appendChild(t); li.appendChild(s);
    els.journalList.insertBefore(li, els.journalList.firstChild);
    while (els.journalList.children.length > 8) {
      els.journalList.removeChild(els.journalList.lastElementChild);
    }
  }

  /* -------- Stepper -------- */
  function updateJourney() {
    var step = state.route === 'blocked' ? 4 : state.route === 'reported' ? 3 : 2;
    els.journey.forEach(function (li) {
      var n = Number(li.getAttribute('data-journey-step'));
      li.classList.toggle('is-done', n < step);
      li.classList.toggle('is-active', n === step);
    });
  }

  /* -------- Bandeau décision -------- */
  function updateDecision() {
    if (!els.decision) return;
    els.decision.classList.remove('is-caution', 'is-blocked');

    if (state.route === 'clear') {
      els.decisionTitle.textContent = 'Itinéraire direct disponible';
      els.decisionCopy.textContent  = 'Aucun incident confirmé sur le trajet. Vous pouvez partir.';
      return;
    }
    if (state.route === 'reported') {
      els.decision.classList.add('is-caution');
      els.decisionTitle.textContent = 'Signalement en cours de vérification';
      els.decisionCopy.textContent  = 'La rue Blaise Diagne est signalée inondée. Le trajet reste affiché avec prudence.';
      return;
    }
    if (state.target === 'b') {
      els.decisionTitle.textContent = 'Détour proposé vers Pharmacie B';
      els.decisionCopy.textContent  = 'La route confirmée bloquée est contournée. Un itinéraire alternatif a été calculé.';
    } else {
      els.decision.classList.add('is-blocked');
      els.decisionTitle.textContent = 'Trajet direct impossible';
      els.decisionCopy.textContent  = 'Route confirmée bloquée. Choisissez une autre pharmacie.';
    }
  }

  /* -------- Application d'état -------- */
  function apply(partial, opts) {
    opts = opts || {};
    Object.assign(state, partial);

    demo.setAttribute('data-route', state.route);
    demo.setAttribute('data-target', state.target);
    demo.setAttribute('data-selected', state.selected);
    demo.setAttribute('data-alternative', String(state.alternative));

    if (els.state) {
      els.state.classList.toggle('is-reported', state.route === 'reported');
      els.state.classList.toggle('is-blocked',  state.route === 'blocked');
      els.state.textContent = ROUTE_COPY[state.route].label;
    }
    if (els.caption) els.caption.textContent = ROUTE_COPY[state.route].caption;

    els.modes.forEach(function (b) {
      b.setAttribute('aria-pressed',
        String(b.getAttribute('data-route-mode') === state.route));
    });

    els.actions.forEach(function (b) {
      var a = b.getAttribute('data-action');
      var on = true;
      if (a === 'report')  on = state.route === 'clear';
      if (a === 'confirm') on = state.route === 'reported';
      if (a === 'resolve') on = state.route !== 'clear';
      b.disabled = !on;
    });

    els.cards.forEach(function (card) {
      var id  = card.getAttribute('data-pharmacy');
      var btn = $('[data-choose-pharmacy]', card);
      if (btn) btn.disabled = (state.route === 'blocked' && id === 'a');
      var recommended = state.route === 'blocked' ? id === 'b' : id === 'a';
      card.classList.toggle('is-recommended', recommended);
    });

    els.routeLabels.forEach(function (el) {
      var id = el.getAttribute('data-route-label');
      el.classList.remove('alternative', 'is-blocked');
      if (state.route === 'blocked') {
        if (id === 'a') {
          el.textContent = 'Route bloquée';
          el.classList.add('is-blocked');
        } else {
          el.textContent = '2,6 km · env. 14 min · détour';
          el.classList.add('alternative');
        }
      } else if (state.route === 'reported') {
        el.textContent = id === 'a'
          ? '1,8 km · env. 9 min · à confirmer'
          : '2,6 km · env. 14 min';
      } else {
        el.textContent = id === 'a' ? '1,8 km · env. 9 min' : '2,6 km · env. 14 min';
      }
    });

    updateJourney();
    updateDecision();

    if (opts.log) log(opts.log.text, opts.log.tone);
  }

  /* -------- Boutons scénario -------- */
  els.modes.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var mode = btn.getAttribute('data-route-mode');
      if (mode === state.route) return;
      var messages = {
        clear:    { text: 'Route rétablie · trajet direct',           tone: 'ok' },
        reported: { text: 'Signalement usager · rue Blaise Diagne',   tone: 'warn' },
        blocked:  { text: 'Agent · blocage confirmé',                 tone: 'danger' }
      };
      var patch = { route: mode };
      if (mode === 'blocked') patch.target = 'b';
      if (mode === 'clear')   patch.target = state.selected;
      apply(patch, { log: messages[mode] });
      if (mode === 'blocked') {
        setTimeout(function () {
          log('Recalcul · itinéraire alternatif vers Pharmacie B', 'ok');
        }, 400);
      }
    });
  });

  /* -------- Boutons d'action (workflow) -------- */
  els.actions.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var a = btn.getAttribute('data-action');
      if (a === 'report' && state.route === 'clear') {
        apply({ route: 'reported' }, { log: { text: 'Usager · inondation signalée', tone: 'warn' } });
      } else if (a === 'confirm' && state.route === 'reported') {
        apply({ route: 'blocked', target: 'b' }, { log: { text: 'Agent · signalement confirmé', tone: 'danger' } });
        setTimeout(function () {
          log('Recalcul · itinéraire alternatif vers Pharmacie B', 'ok');
        }, 400);
      } else if (a === 'resolve' && state.route !== 'clear') {
        apply({ route: 'clear', target: state.selected },
              { log: { text: 'Route rétablie · historique conservé', tone: 'ok' } });
      }
    });
  });

  /* -------- Choix pharmacie -------- */
  $$('[data-choose-pharmacy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (btn.disabled) return;
      var id = btn.getAttribute('data-choose-pharmacy');
      apply({ target: id, selected: id },
            { log: { text: 'Pharmacie ' + id.toUpperCase() + ' sélectionnée', tone: 'info' } });
    });
  });

  /* -------- Médicament -------- */
  if (els.medicine) {
    els.medicine.addEventListener('change', function () {
      state.medicine = els.medicine.value;
      log('Recherche · ' + (MEDICINES[state.medicine] || ''), 'info');
    });
  }

  /* -------- Journal : effacer -------- */
  if (els.journalClear) {
    els.journalClear.addEventListener('click', function () {
      if (els.journalList) els.journalList.innerHTML = '';
    });
  }

  /* -------- Pluie -------- */
  if (els.rain) {
    els.rain.addEventListener('click', function () {
      var on = demo.getAttribute('data-rain') !== 'true';
      demo.setAttribute('data-rain', String(on));
      els.rain.setAttribute('aria-pressed', String(on));
      log(on ? 'Contexte · pluie activée' : 'Contexte · pluie désactivée', 'info');
    });
  }

  /* -------- Focus mode -------- */
  function setFocus(on) {
    document.body.classList.toggle('patient-focus-mode', on);
    if (!els.focus) return;
    els.focus.setAttribute('aria-pressed', String(on));
    var label = $('.patient-focus-label', els.focus);
    if (label) label.textContent = on ? 'Réduire' : 'Agrandir la simulation';
  }

  if (els.focus) {
    els.focus.addEventListener('click', function () {
      setFocus(!document.body.classList.contains('patient-focus-mode'));
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('patient-focus-mode')) {
      setFocus(false);
    }
  });

  /* -------- Init -------- */
  apply({}, {});
  log('Recherche lancée · ' + MEDICINES[state.medicine], 'info');
  setTimeout(function () {
    log('2 pharmacies trouvées autour de Médina', 'info');
  }, 300);
})();
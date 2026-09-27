/* Install, share, tutorial, and page boot */
(function (root) {
  'use strict';
  var GOO = root.GOO;
  if (!GOO) return;
  var Device = GOO.Device;
  var Sound = GOO.Sound;
  var Notify = GOO.Notify;
  var Compass = GOO.Compass;
  var SHARE_URL = (location.origin && location.origin !== 'null') ? location.href : 'https://harmony-immersive-learning.onrender.com';
  var SHARE_TEXT = 'Immersive Learning — live coastal restoration, 3D globe and 2D maps.';
  var TUTORIAL_KEY = 'goo-tutorial-v1';
  var deferredPrompt = null;

  function setupInstall() {
    var bar = document.getElementById('installApp');
    var pwaBtn = document.getElementById('installBtn');
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferredPrompt = e;
      if (bar) bar.classList.add('ready');
      if (pwaBtn) pwaBtn.style.display = 'block';
    });
    function promptInstall() {
      Sound.click();
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function (c) {
          Notify.toast({
            tone: c.outcome === 'accepted' ? 'green' : 'amber',
            title: c.outcome === 'accepted' ? 'PWA installed' : 'Install dismissed',
            sub: c.outcome === 'accepted' ? 'Global Impact Ledger is on your home screen.' : 'You can install any time from the bottom left.',
            n: c.outcome === 'accepted' ? 'OK' : '!'
          });
          deferredPrompt = null;
        });
        return;
      }
      if (Device.ios) {
        Notify.toast({ tone: 'blue', title: 'Add to Home Screen', sub: 'Share → Add to Home Screen to install the real PWA.', n: 'iOS' });
        return;
      }
      location.href = Device.iconBase + 'pwa/island-weather-pwa/index.html';
    }
    ['installMain', 'installApple', 'installPlay'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('click', promptInstall);
    });
    if (pwaBtn) pwaBtn.addEventListener('click', promptInstall);
    window.addEventListener('appinstalled', function () {
      Notify.toast({ tone: 'green', title: 'Installed', sub: 'Launch Immersive Learning from your home screen.', n: '01' });
    });
  }

  function setupShare() {
    var url = encodeURIComponent(SHARE_URL);
    var text = encodeURIComponent(SHARE_TEXT);
    var links = {
      x: 'https://twitter.com/intent/tweet?text=' + text + '&url=' + url,
      fb: 'https://www.facebook.com/sharer/sharer.php?u=' + url,
      wa: 'https://wa.me/?text=' + text + '%20' + url
    };
    document.querySelectorAll('[data-share]').forEach(function (a) {
      var k = a.getAttribute('data-share');
      if (links[k]) a.href = links[k];
      a.addEventListener('click', function (e) {
        Sound.click();
      });
    });
  }

  var Tutorial = {
    steps: [],
    i: 0,
    veil: null,
    card: null,
    stored: function (val) {
      try {
        if (arguments.length) localStorage.setItem(TUTORIAL_KEY, val);
        else return localStorage.getItem(TUTORIAL_KEY);
      } catch (e) { return null; }
    },
    ask: function () {
      if (this.stored() || Device.embed) return;
      var ov = document.createElement('div');
      ov.className = 'tut-ask';
      ov.innerHTML =
        '<div class="tut-ask-card">' +
          '<div class="tut-brand"><b>01</b><span>IMMERSIVE LEARNING</span></div>' +
          '<p>🌊 Would you like a tutorial?</p>' +
          '<small>A short tour of the globe, maps, compass and live ledger. 🌍</small>' +
          '<div class="tut-ask-row">' +
            '<button type="button" id="tutYes">Yes</button>' +
            '<button type="button" id="tutNo" class="ghost">No</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(ov);
      requestAnimationFrame(function () { ov.classList.add('show'); });
      ov.querySelector('#tutYes').addEventListener('click', function () {
        Sound.click(); ov.remove(); Tutorial.start();
      });
      ov.querySelector('#tutNo').addEventListener('click', function () {
        Sound.click(); Tutorial.stored('skip'); ov.remove();
      });
    },
    start: function () {
      this.steps = Device.pwaShell
        ? [
            { sel: '#iconGrid', title: 'Your field tools', body: 'Each tile opens live 3D / 2D data from the web app — never the desktop sidebar cards.', emoji: '🧭' },
            { sel: '#pwaCompassBtn, .n-bell', title: 'Compass & alerts', body: 'Real GPS heading, elevation, and a Call of Duty map ring. The bell keeps score.', emoji: '🔔' },
            { sel: '#installBtn', title: 'Keep it installed', body: 'The PWA stays on your home screen and talks to the same coastal ledger.', emoji: '📱' }
          ]
        : [
            { sel: '#globeWrap', title: 'The 3D Earth', body: 'Spin, search a coastal city, then resize or retexture the globe.', emoji: '🌍' },
            { sel: '#list', title: 'Photo cards', body: 'Open a city card — the panel floats to centre with cinematic stills.', emoji: '🏙️' },
            { sel: '#icons', title: 'Ledger rail', body: 'Hover a tool for its plate. Completions toast in the same shape, colour-coded.', emoji: '🌊' },
            { sel: '#gsearch', title: 'Find a shore', body: 'Search Jakarta to Rotterdam. The globe turns, the map later flies.', emoji: '🔎' },
            { sel: '#compassFab, #gctrl', title: 'Compass', body: 'True heading, elevation, and an optional satellite ring — or go fullscreen HUD.', emoji: '🧭' },
            { sel: '#installApp', title: 'Install the PWA', body: 'Bottom-left installs the real Global Impact Ledger on your device.', emoji: '📲' }
          ];
      this.i = 0;
      this.veil = document.createElement('div');
      this.veil.className = 'tut-veil';
      this.card = document.createElement('div');
      this.card.className = 'tut-step';
      document.body.appendChild(this.veil);
      document.body.appendChild(this.card);
      document.body.classList.add('tut-on');
      this.render();
    },
    render: function () {
      var step = this.steps[this.i];
      if (!step) { this.end(); return; }
      var el = document.querySelector(step.sel);
      var r = el ? el.getBoundingClientRect() : { left: innerWidth / 2 - 80, top: innerHeight / 2 - 80, width: 160, height: 160 };
      this.veil.style.left = (r.left - 10) + 'px';
      this.veil.style.top = (r.top - 10) + 'px';
      this.veil.style.width = (r.width + 20) + 'px';
      this.veil.style.height = (r.height + 20) + 'px';
      var pct = ((this.i + 1) / this.steps.length) * 100;
      this.card.innerHTML =
        '<div class="tut-bar"><i style="width:' + pct + '%"></i></div>' +
        '<div class="tut-emoji">' + step.emoji + '</div>' +
        '<b>' + step.title + '</b>' +
        '<p>' + step.body + '</p>' +
        '<div class="tut-nav"><button type="button" class="ghost" data-act="skip">Skip</button>' +
        '<button type="button" data-act="next">' + (this.i === this.steps.length - 1 ? 'Finish 🌊' : 'Next') + '</button></div>' +
        '<small>' + (this.i + 1) + ' / ' + this.steps.length + '</small>';
      var self = this;
      this.card.querySelector('[data-act="next"]').addEventListener('click', function () { Sound.click(); self.i += 1; self.render(); });
      this.card.querySelector('[data-act="skip"]').addEventListener('click', function () { Sound.click(); self.end(); });
      Sound.info();
    },
    end: function () {
      this.stored('done');
      document.body.classList.remove('tut-on');
      if (this.veil) this.veil.remove();
      if (this.card) this.card.remove();
      Notify.toast({ tone: 'green', title: 'You are ready', sub: 'Earth, ocean and the ledger are live.', n: '🌊' });
    }
  };

  function bindSounds() {
    var last = null;
    document.addEventListener('pointerover', function (e) {
      var t = e.target.closest && e.target.closest('button, .card, .icon-wrap, .tile, .terra-filter, a.share-link, .n-bell, .n-avatar-fab');
      if (!t || t === last) return;
      last = t;
      Sound.hover();
    }, true);
    if (Device.pwaShell) return;
    document.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('button, .card, .tile, .terra-filter, a.share-link')) Sound.click();
    }, true);
  }

  function injectFab() {
    if (Device.pwaShell || document.getElementById('compassFab')) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.id = 'compassFab';
    b.className = 'compass-fab';
    b.setAttribute('aria-label', 'Open GPS compass');
    b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><polygon points="12 6 14.2 12 12 18 9.8 12" fill="currentColor" stroke="none"/></svg>';
    b.addEventListener('click', function () { Compass.toggle(); });
    document.body.appendChild(b);
  }

  function waitFor(test, fn, tries) {
    if (test()) { fn(); return; }
    if (tries <= 0) return;
    setTimeout(function () { waitFor(test, fn, tries - 1); }, 200);
  }

  function applyViewQuery() {
    if (Device.view === 'globe' && (Device.embed || Device.fromPwa)) {
      window.__spinBoost = 0.002;
      window.__globeAim = null;
    }
    if (Device.view === 'map' || Device.view === 'roadmap') {
      waitFor(function () { return typeof window.openTerraRoadmap === 'function'; }, function () {
        window.openTerraRoadmap();
      }, 20);
    }
    if (Device.view === 'wallet' || Device.view === 'milestone') {
      waitFor(function () { return typeof window.openUxCard === 'function'; }, function () {
        window.openUxCard(Device.view);
      }, 25);
    }
    if (Device.fromPwa && !Device.embed && !document.getElementById('pwaBack')) {
      var back = document.createElement('a');
      back.id = 'pwaBack';
      back.className = 'pwa-back';
      back.href = Device.iconBase + 'pwa/island-weather-pwa/index.html';
      back.textContent = '← Ledger';
      document.body.appendChild(back);
    }
  }

  function boot() {
    Device.pwaShell = document.body.getAttribute('data-shell') === 'pwa';
    Notify.listen();
    setupInstall();
    setupShare();
    bindSounds();
    injectFab();
    if (Compass) Compass.mount();
    applyViewQuery();
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      var hadController = !!navigator.serviceWorker.controller;
      navigator.serviceWorker
        .register(Device.iconBase + 'sw.js', { updateViaCache: 'none' })
        .then(function (reg) {
          function ping() {
            try { reg.update(); } catch (e) {}
          }
          ping();
          document.addEventListener('visibilitychange', function () {
            if (document.visibilityState === 'visible') ping();
          });
        })
        .catch(function () {});
      if (hadController) {
        navigator.serviceWorker.addEventListener('controllerchange', function () {
          location.reload();
        });
      }
    }
    setTimeout(function () { Tutorial.ask(); }, 700);
  }

  GOO.Tutorial = Tutorial;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);

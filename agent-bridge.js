/* Polls the Ask service for voice-agent commands and runs the matching UX control. */
(function () {
  var ORIGIN = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
    ? "http://127.0.0.1:8001"
    : "https://aqua-ask.onrender.com";
  var SINCE_KEY = "il-agent-since";
  var PENDING_KEY = "il-agent-pending";

  function pageKind() {
    var path = location.pathname;
    if (path.indexOf("desktop.html") !== -1) return "globe";
    if (path.indexOf("aquaask.html") !== -1) return "ask";
    return "home";
  }

  function urls() {
    if (pageKind() === "home") {
      return {
        home: "index.html",
        globe: "Guardians-of-the-Ocean/desktop.html",
        ask: "Aqua-ask-/aquaask.html"
      };
    }
    return {
      home: "../index.html",
      globe: pageKind() === "globe" ? "desktop.html" : "../Guardians-of-the-Ocean/desktop.html",
      ask: pageKind() === "ask" ? "aquaask.html" : "../Aqua-ask-/aquaask.html"
    };
  }

  function needsPage(action) {
    if (action === "open_home") return "home";
    if (action === "open_ask") return "ask";
    return "globe";
  }

  function click(selector) {
    var el = document.querySelector(selector);
    if (el) el.click();
    return !!el;
  }

  function cityId(detail) {
    var text = (detail || "").toLowerCase();
    var ids = ["jakarta", "manila", "lagos", "miami", "mumbai", "mombasa", "sydney", "rotterdam", "hcmc", "capetown"];
    if (text.indexOf("ho chi") !== -1 || text.indexOf("saigon") !== -1 || text === "hcmc") return "hcmc";
    if (text.indexOf("cape") !== -1) return "capetown";
    for (var i = 0; i < ids.length; i++) {
      if (text.indexOf(ids[i]) !== -1) return ids[i];
    }
    return "";
  }

  function cardId(detail) {
    var city = cityId(detail);
    if (city) return city;
    var text = (detail || "").toLowerCase();
    var cards = [
      ["ocean", "ocean"],
      ["climate", "climate"],
      ["arctic", "arctic"],
      ["thirst", "thirsty"],
      ["bird", "birds"],
      ["jungle", "jungle"],
      ["wallet", "wallet"],
      ["milestone", "milestone"]
    ];
    for (var i = 0; i < cards.length; i++) {
      if (text.indexOf(cards[i][0]) !== -1) return cards[i][1];
    }
    return "";
  }

  function layerKey(detail) {
    var text = (detail || "").toLowerCase();
    if (text.indexOf("night") !== -1) return "night";
    if (text.indexOf("marble") !== -1 || text.indexOf("satellite") !== -1) return "marble";
    return "default";
  }

  function runHere(command) {
    var action = command.action;
    var detail = command.detail || "";
    if (action === "open_globe" || action === "open_home") return true;
    if (action === "open_maps") {
      if (typeof window.openTerraRoadmap === "function") {
        window.openTerraRoadmap(cityId(detail) || "jakarta");
        return true;
      }
      return false;
    }
    if (action === "close_maps") return click("#terraClose") || click("#rmPathClose");
    if (action === "zoom_in") return click("#gPlus");
    if (action === "zoom_out") return click("#gMinus");
    if (action === "set_layer") {
      if (typeof window.__globeTex === "function") {
        window.__globeTex(layerKey(detail));
        return true;
      }
      return false;
    }
    if (action === "open_compass") return click("#compassFab") || click("#terraGpsCompass");
    if (action === "open_wallet") return click('.icon-tip[data-card="wallet"]');
    if (action === "open_milestone") return click('.icon-tip[data-card="milestone"]');
    if (action === "search_city") {
      var id = cityId(detail);
      var card = id && document.querySelector('.card[data-id="' + id + '"]');
      if (card) { card.click(); return true; }
      var input = document.getElementById("gsearchIn");
      if (input && detail) {
        input.value = detail;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        return true;
      }
      return false;
    }
    if (action === "open_card") {
      var cid = cardId(detail);
      if (cid === "wallet" || cid === "milestone") return click('.icon-tip[data-card="' + cid + '"]');
      var button = cid && document.querySelector('.card[data-id="' + cid + '"]');
      if (button) { button.click(); return true; }
      return false;
    }
    if (action === "open_ask") {
      var askInput = document.getElementById("askInput");
      var form = document.getElementById("askForm");
      if (!askInput || !form) return false;
      if (detail) {
        askInput.value = detail;
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      }
      var section = (detail || "").toLowerCase();
      if (section === "library" || section === "sources" || section === "pulse" || section === "labs") {
        location.hash = section;
      }
      return true;
    }
    return false;
  }

  function go(command) {
    var target = needsPage(command.action);
    if (pageKind() !== target) {
      var dest = urls()[target];
      if (command.action === "open_ask" && command.detail && target === "ask") {
        sessionStorage.removeItem(PENDING_KEY);
        location.href = dest + "?q=" + encodeURIComponent(command.detail);
        return;
      }
      sessionStorage.setItem(PENDING_KEY, JSON.stringify(command));
      if (command.action === "open_maps") dest += "#roadmap";
      location.href = dest;
      return;
    }
    var tries = 0;
    var timer = setInterval(function () {
      tries += 1;
      if (runHere(command) || tries > 25) {
        clearInterval(timer);
        sessionStorage.removeItem(PENDING_KEY);
      }
    }, 200);
  }

  function remember(id) {
    localStorage.setItem(SINCE_KEY, String(id));
  }

  function bootPending() {
    var raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return;
    try { go(JSON.parse(raw)); } catch (err) { sessionStorage.removeItem(PENDING_KEY); }
  }

  function poll() {
    var since = localStorage.getItem(SINCE_KEY) || "0";
    fetch(ORIGIN + "/api/agent/command?since=" + encodeURIComponent(since))
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var command = data && data.command;
        if (!command || !command.id) return;
        remember(command.id);
        go(command);
      })
      .catch(function () {});
  }

  bootPending();
  setInterval(poll, 1200);
  poll();
})();

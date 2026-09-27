/* Page buttons and the ElevenLabs voice widget on every screen. */
(function () {
  var path = location.pathname;
  var base = "";
  if (path.indexOf("/pwa/island-weather-pwa/") !== -1) base = "../../../";
  else if (path.indexOf("/Guardians-of-the-Ocean/") !== -1 || path.indexOf("/Aqua-ask-/") !== -1 || path.indexOf("/mobile/") !== -1) base = "../";

  var homeHref = base + "index.html";
  var globeHref = base + "Guardians-of-the-Ocean/desktop.html";
  var askHref = base + "Aqua-ask-/aquaask.html";
  var mobileHref = base + "mobile/";
  var here = "home";
  if (path.indexOf("desktop.html") !== -1) here = "globe";
  else if (path.indexOf("aquaask.html") !== -1) here = "ask";
  else if (path.indexOf("/mobile/") !== -1) here = "mobile";

  var style = document.createElement("style");
  style.textContent = [
    ".il-jumps{position:fixed;z-index:80;top:14px;left:14px;display:flex;flex-wrap:wrap;gap:8px;max-width:calc(100vw - 28px);}",
    "body.il-on-globe .il-jumps{display:none;}",
    ".il-jumps a,.il-jumps button{appearance:none;border:0;cursor:pointer;text-decoration:none;",
    "font:600 13px/1 Inter,Arial,sans-serif;color:#12202c;background:#fff;border-radius:999px;",
    "padding:10px 14px;box-shadow:0 2px 10px rgba(0,0,0,.28);}",
    ".il-jumps a.is-on{background:#12202c;color:#fff;}",
    ".il-gear{position:fixed;z-index:80;top:62px;left:14px;width:36px;height:36px;border:0;border-radius:50%;",
    "background:#fff;color:#12202c;box-shadow:0 2px 10px rgba(0,0,0,.28);cursor:pointer;display:grid;place-items:center;padding:0;}",
    "body.il-on-globe .il-gear{top:auto;bottom:18px;left:8px;}",
    "body.il-on-globe .il-log{top:auto;bottom:62px;left:8px;}",
    ".il-gear svg{width:18px;height:18px;display:block;}",
    ".il-log{display:none;position:fixed;z-index:80;top:106px;left:14px;width:min(440px,calc(100vw - 28px));",
    "height:min(48vh,380px);overflow:auto;background:rgba(8,16,24,.94);color:#d7ecf5;",
    "font:12px/1.45 ui-monospace,Consolas,monospace;border-radius:12px;padding:10px 12px;box-shadow:0 8px 28px rgba(0,0,0,.35);}",
    ".il-log.open{display:block;}",
    ".il-log .err{color:#ffb4a8;}.il-log .ok{color:#b6f5c8;}.il-log .info{color:#d7ecf5;}"
  ].join("");
  document.head.appendChild(style);
  if (here === "globe") document.body.classList.add("il-on-globe");

  var nav = document.createElement("div");
  nav.className = "il-jumps";
  nav.setAttribute("aria-label", "Pages");
  var back = document.createElement("button");
  back.type = "button";
  back.textContent = "Back";
  back.addEventListener("click", function () {
    if (history.length > 1) history.back();
    else location.href = homeHref;
  });
  nav.appendChild(back);

  [
    ["Home", homeHref, "home"],
    ["3D Globe", globeHref, "globe"],
    ["Ask", askHref, "ask"],
    ["Mobile", mobileHref, "mobile"]
  ].forEach(function (item) {
    var a = document.createElement("a");
    a.href = item[1];
    a.textContent = item[0];
    if (item[2] === here) a.className = "is-on";
    nav.appendChild(a);
  });
  document.body.appendChild(nav);

  var gear = document.createElement("button");
  gear.type = "button";
  gear.className = "il-gear";
  gear.setAttribute("aria-label", "App logs");
  gear.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6"/></svg>';
  var panel = document.createElement("div");
  panel.className = "il-log";
  panel.setAttribute("role", "log");
  document.body.appendChild(gear);
  document.body.appendChild(panel);
  function stamp(level, message) {
    var line = document.createElement("div");
    line.className = level === "error" ? "err" : level === "ok" ? "ok" : "info";
    var now = new Date();
    var hh = String(now.getHours()).padStart(2, "0");
    var mm = String(now.getMinutes()).padStart(2, "0");
    var ss = String(now.getSeconds()).padStart(2, "0");
    line.textContent = hh + ":" + mm + ":" + ss + "  " + message;
    panel.appendChild(line);
    while (panel.childNodes.length > 200) panel.removeChild(panel.firstChild);
    panel.scrollTop = panel.scrollHeight;
  }
  window.ILLog = function (level, message) { stamp(level || "info", message); };
  (window.__ILLogQ || []).forEach(function (row) { stamp(row[0], row[1]); });
  window.__ILLogQ = [];
  window.addEventListener("error", function (ev) {
    stamp("error", "page error: " + (ev.message || "unknown") + (ev.filename ? " (" + ev.filename.split("/").pop() + ":" + ev.lineno + ")" : ""));
  });
  window.addEventListener("unhandledrejection", function (ev) {
    var reason = ev.reason && (ev.reason.message || String(ev.reason));
    stamp("error", "unhandled: " + (reason || "promise"));
  });
  stamp("info", "log open on " + location.pathname);
  gear.addEventListener("click", function () {
    var open = panel.classList.toggle("open");
    gear.setAttribute("aria-expanded", open ? "true" : "false");
  });

  if (!document.querySelector("elevenlabs-convai")) {
    var widget = document.createElement("elevenlabs-convai");
    widget.setAttribute("agent-id", "agent_0701m3hfg95pepjts080nqe1rmf8");
    document.body.appendChild(widget);
    var script = document.createElement("script");
    script.src = "https://unpkg.com/@elevenlabs/convai-widget-embed";
    script.async = true;
    document.body.appendChild(script);
  }
})();

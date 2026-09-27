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
    "body.il-on-globe .il-jumps{left:62px;}",
    ".il-jumps a,.il-jumps button{appearance:none;border:0;cursor:pointer;text-decoration:none;",
    "font:600 13px/1 Inter,Arial,sans-serif;color:#12202c;background:#fff;border-radius:999px;",
    "padding:10px 14px;box-shadow:0 2px 10px rgba(0,0,0,.28);}",
    ".il-jumps a.is-on{background:#12202c;color:#fff;}"
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

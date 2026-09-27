/* Harmony Mobile: tabs, lessons, the ask guide, the human call-back and mobile money / card checkout. */
(function () {
  'use strict';

  var API = String(window.GOO_API || '').replace(/\/$/, '');
  var $ = function (id) { return document.getElementById(id); };
  var config = null;
  var PHONE_KEY = 'harmony-phone';

  // ── HTTP ──
  async function api(method, path, body) {
    var res = await fetch(API + path, {
      method: method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined
    });
    var data = {};
    try { data = await res.json(); } catch (e) { data = {}; }
    if (!res.ok) {
      var err = new Error(data.error || 'Something went wrong. Please try again.');
      err.status = res.status;
      throw err;
    }
    return data;
  }

  function store(key, value) {
    try { if (value === undefined) return localStorage.getItem(key) || ''; localStorage.setItem(key, value); } catch (e) {}
    return '';
  }

  function kes(n) { return 'KES ' + Math.round(n).toLocaleString('en-US'); }
  function usd(n) { return '$' + Math.round(n).toLocaleString('en-US'); }

  // ── Phone numbers (mirrors server/src/lib/phone.ts) ──
  var RANGES = {
    safaricom: [[700, 729], [740, 746], [748, 748], [757, 759], [768, 769], [790, 799], [110, 115]],
    airtel: [[730, 739], [750, 756], [762, 762], [780, 789], [100, 102]],
    telkom: [[770, 779]]
  };
  function normalize(raw) {
    var d = String(raw || '').replace(/[^\d+]/g, '').replace(/^\+/, '').replace(/\D/g, '');
    if (d.indexOf('00254') === 0) d = d.slice(2);
    if (d.charAt(0) === '0' && d.length === 10) d = '254' + d.slice(1);
    if ((d.charAt(0) === '7' || d.charAt(0) === '1') && d.length === 9) d = '254' + d;
    return /^254[17]\d{8}$/.test(d) ? d : '';
  }
  function networkOf(raw) {
    var n = normalize(raw);
    if (!n) return '';
    var p = Number(n.slice(3, 6));
    for (var net in RANGES) {
      if (RANGES[net].some(function (r) { return p >= r[0] && p <= r[1]; })) return net;
    }
    return 'unknown';
  }
  var NET_LABEL = { safaricom: 'Safaricom', airtel: 'Airtel', telkom: 'Telkom', unknown: 'Kenya' };

  function bindPhone(input, onNetwork) {
    var badge = document.querySelector('[data-net-for="' + input.id + '"]');
    function update() {
      var net = networkOf(input.value);
      if (badge) {
        badge.className = 'net-badge' + (net ? ' show ' + net : '');
        badge.querySelector('b').textContent = net ? NET_LABEL[net] : '';
      }
      if (net) store(PHONE_KEY, input.value.trim());
      if (onNetwork) onNetwork(net);
    }
    input.addEventListener('input', update);
    if (!input.value) input.value = store(PHONE_KEY);
    update();
    return update;
  }

  function busy(btn, on) {
    btn.classList.toggle('loading', on);
    btn.disabled = on;
    btn.setAttribute('aria-busy', on ? 'true' : 'false');
  }
  function showError(el, msg) {
    el.textContent = msg || '';
    el.classList.toggle('show', !!msg);
  }

  // ── Tabs + hash routing ──
  var tabs = [].slice.call(document.querySelectorAll('.tab'));
  var desktop = window.matchMedia('(min-width:1024px)');

  function select(name, opts) {
    if (name === 'phone' && desktop.matches) {
      document.querySelector('.rail').scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (window.HarmonySim) window.HarmonySim.focus();
      return;
    }
    tabs.forEach(function (t) {
      var on = t.dataset.tab === name;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      $('panel-' + t.dataset.tab).classList.toggle('active', on);
    });
    if (!opts || !opts.silent) history.replaceState(null, '', '#' + name);
    if (name === 'phone' && window.HarmonySim) window.HarmonySim.seen();
    // Gifts also arrive by USSD, SMS and voice, so refresh the total whenever it comes into view.
    if (name === 'support' && config) loadLedger();
    if (!opts || !opts.keepScroll) {
      var top = document.querySelector('.tabbar').getBoundingClientRect().top + window.scrollY - 70;
      if (window.scrollY > top) window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
    }
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(t.dataset.tab); });
    t.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var visible = tabs.filter(function (x) { return x.offsetParent !== null; });
      var idx = visible.indexOf(t) + (e.key === 'ArrowRight' ? 1 : -1);
      var next = visible[(idx + visible.length) % visible.length];
      next.focus();
      select(next.dataset.tab);
    });
  });
  function fromHash() {
    var h = location.hash.replace('#', '');
    if (['learn', 'ask', 'support', 'phone'].indexOf(h) >= 0) select(h, { silent: true, keepScroll: true });
  }
  window.addEventListener('hashchange', fromHash);
  window.HarmonyTabs = { select: select };

  // Move the simulator between the desktop rail and the Phone tab.
  function placeSimulator() {
    var sim = $('simulator');
    var slot = desktop.matches ? $('phoneSlotDesktop') : $('phoneSlotMobile');
    if (sim.parentNode !== slot) slot.appendChild(sim);
  }
  desktop.addEventListener('change', placeSimulator);
  placeSimulator();

  // Copy USSD / SMS codes.
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var value = btn.dataset.copy === 'ussd' ? $('ussdCode').textContent : $('smsCode').textContent;
      var label = btn.querySelector('span');
      var original = label.textContent;
      function done() { label.textContent = 'Copied'; setTimeout(function () { label.textContent = original; }, 1400); }
      if (navigator.clipboard) navigator.clipboard.writeText(value).then(done, function () {});
      if (window.HarmonySim && btn.dataset.copy === 'ussd') window.HarmonySim.prefill(value);
    });
  });

  // ── Config ──
  async function loadConfig() {
    try {
      config = await api('GET', '/api/mobile/config');
    } catch (e) {
      $('modeText').textContent = 'Offline';
      $('modePill').classList.add('practice');
      $('modePill').title = 'Cannot reach the Harmony server at ' + API;
      renderLessons([]);
      return;
    }
    document.querySelectorAll('[data-ussd-code]').forEach(function (el) { el.textContent = config.ussdCode; });
    document.querySelectorAll('[data-sms-code]').forEach(function (el) { el.textContent = config.smsShortcode; });
    $('ussdCode').textContent = config.ussdCode;
    $('smsCode').textContent = config.smsShortcode;
    if (config.voiceNumber) {
      $('voiceNumber').textContent = config.voiceNumber;
      $('voiceLink').href = 'tel:' + config.voiceNumber;
    }

    var m = config.modes;
    var practice = [m.sms, m.mpesa, m.airtel].indexOf('mock') >= 0;
    var sandbox = [m.sms, m.mpesa, m.airtel].indexOf('sandbox') >= 0;
    $('modeText').textContent = practice ? 'Practice mode' : sandbox ? 'Sandbox' : 'Live';
    $('modePill').classList.toggle('practice', practice || sandbox);
    $('modePill').title = 'SMS: ' + m.sms + ' · Voice: ' + m.voice + ' · M-Pesa: ' + m.mpesa + ' · Airtel: ' + m.airtel + ' · Card: ' + (m.stripe ? 'on' : 'off');

    renderLessons(config.lessons || []);
    setupMethods();
    renderAmounts();
    loadLedger();
    document.dispatchEvent(new CustomEvent('harmony:config', { detail: config }));
  }

  // ── Learn ──
  function renderLessons(list) {
    var wrap = $('lessons');
    wrap.innerHTML = '';
    $('lessonCount').textContent = list.length ? list.length + ' lessons' : '';
    list.forEach(function (l, i) {
      var card = document.createElement('article');
      card.className = 'lesson';
      card.innerHTML = '<div class="num"></div><h3></h3><p></p>';
      card.querySelector('.num').textContent = 'LESSON ' + String(i + 1).padStart(2, '0');
      card.querySelector('h3').textContent = l.title;
      card.querySelector('p').textContent = l.summary;
      wrap.appendChild(card);
    });
  }

  bindPhone($('joinPhone'));
  $('joinForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    var btn = $('joinBtn');
    showError($('joinErr'), '');
    if (!normalize($('joinPhone').value)) {
      showError($('joinErr'), 'Enter a Kenyan mobile number, e.g. 0712 345 678.');
      $('joinPhone').focus();
      return;
    }
    busy(btn, true);
    try {
      var res = await api('POST', '/api/students/join', {
        phone: $('joinPhone').value,
        name: $('joinName').value.trim() || undefined,
        school: $('joinSchool').value.trim() || undefined
      });
      var name = $('joinName').value.trim();
      $('joinOkTitle').textContent = name ? 'Karibu, ' + name + '!' : "You're in!";
      $('joinOkText').textContent = res.smsMode === 'mock'
        ? 'Practice mode: your first lesson, "' + res.firstLesson + '", just arrived on the simulator phone.'
        : 'Your first lesson, "' + res.firstLesson + '", is on its way to ' + res.phone + '.';
      $('joinForm').classList.add('hidden');
      $('joinOk').classList.add('show');
      if (window.HarmonySim) window.HarmonySim.refresh();
    } catch (err) {
      showError($('joinErr'), err.message);
    } finally {
      busy(btn, false);
    }
  });
  $('joinAgain').addEventListener('click', function () {
    $('joinOk').classList.remove('show');
    $('joinForm').classList.remove('hidden');
    $('joinPhone').value = '';
    $('joinPhone').focus();
  });

  // ── Ask ──
  var thread = $('thread');
  var askInput = $('askInput');
  var askSend = $('askSend');
  bindPhone($('askPhone'));

  $('smsToggle').addEventListener('change', function () {
    $('askPhoneField').classList.toggle('hidden', !this.checked);
    if (this.checked) $('askPhone').focus();
  });
  askInput.addEventListener('input', function () { askSend.disabled = askInput.value.trim().length < 2; });

  function bubble(kind, text) {
    var el = document.createElement('div');
    el.className = 'bubble ' + kind;
    if (text != null) el.textContent = text;
    thread.appendChild(el);
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return el;
  }

  async function ask(question) {
    question = question.trim();
    if (question.length < 2) return;
    $('suggestions').classList.add('hidden');
    bubble('me', question);
    askInput.value = '';
    askSend.disabled = true;
    var wait = bubble('bot');
    wait.innerHTML = '<span class="typing" aria-label="Thinking"><i></i><i></i><i></i></span>';
    var wantSms = $('smsToggle').checked && normalize($('askPhone').value);
    try {
      var res = await api('POST', '/api/agent/ask', { question: question, phone: wantSms ? $('askPhone').value : undefined, sms: !!wantSms });
      wait.textContent = res.text;
      var meta = document.createElement('div');
      meta.className = 'meta';
      var via = { aqua: 'Research library', lessons: 'Harmony lessons', none: 'No answer yet' }[res.via] || res.via;
      addTag(meta, via);
      if (res.source && res.via === 'aqua') addTag(meta, res.source);
      if (res.smsSent) addTag(meta, 'Sent by SMS');
      wait.appendChild(meta);
      if (res.via === 'none') {
        var link = document.createElement('button');
        link.className = 'chip';
        link.type = 'button';
        link.style.marginTop = '10px';
        link.textContent = 'Ask a person instead';
        link.addEventListener('click', function () { openHuman(question); });
        wait.appendChild(link);
      }
    } catch (err) {
      wait.textContent = err.message;
    }
    wait.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function addTag(meta, text) {
    var t = document.createElement('span');
    t.className = 'tag';
    t.textContent = text;
    meta.appendChild(t);
  }
  $('askForm').addEventListener('submit', function (e) { e.preventDefault(); ask(askInput.value); });
  $('suggestions').addEventListener('click', function (e) {
    var chip = e.target.closest('.chip');
    if (chip) ask(chip.textContent);
  });

  // ── Sheets ──
  var lastFocus = null;
  function openSheet(id) {
    lastFocus = document.activeElement;
    var sheet = $(id);
    sheet.classList.add('open');
    document.body.style.overflow = 'hidden';
    var first = sheet.querySelector('input, button:not([data-close])');
    if (first) setTimeout(function () { first.focus(); }, 60);
  }
  function closeSheet(id) {
    $(id).classList.remove('open');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    if (id === 'paySheet') stopPolling();
  }
  document.querySelectorAll('.sheet').forEach(function (sheet) {
    sheet.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) closeSheet(sheet.id); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.sheet.open').forEach(function (s) { closeSheet(s.id); });
  });

  // ── Talk to a person ──
  bindPhone($('humanPhone'));
  function openHuman(question) {
    $('humanForm').classList.remove('hidden');
    $('humanOk').classList.remove('show');
    showError($('humanErr'), '');
    if (question) $('humanQuestion').value = question;
    openSheet('humanSheet');
  }
  $('openHuman').addEventListener('click', function () { openHuman(''); });
  $('humanForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    showError($('humanErr'), '');
    if (!normalize($('humanPhone').value)) {
      showError($('humanErr'), 'Enter a Kenyan mobile number, e.g. 0712 345 678.');
      return;
    }
    var btn = $('humanBtn');
    busy(btn, true);
    try {
      var res = await api('POST', '/api/agent/callback', { phone: $('humanPhone').value, question: $('humanQuestion').value.trim() || undefined });
      $('humanOkTitle').textContent = res.calling ? 'A guide will call you' : 'A guide has your question';
      $('humanOkText').textContent = (res.calling
        ? 'Keep your phone nearby. The call is free. '
        : 'They will reply by SMS shortly. ') + 'Your ticket number is ' + res.ticket + '.';
      $('humanForm').classList.add('hidden');
      $('humanOk').classList.add('show');
      if (window.HarmonySim) window.HarmonySim.refresh();
    } catch (err) {
      showError($('humanErr'), err.message);
    } finally {
      busy(btn, false);
    }
  });

  // ── Support: method, amount, pay ──
  var method = 'mpesa';
  var amount = 100;
  var other = false;
  var LABEL = { mpesa: 'M-Pesa', airtel: 'Airtel Money', card: 'Card' };
  var methodBtns = [].slice.call(document.querySelectorAll('.method'));

  function setupMethods() {
    var avail = (config && config.available) || { mpesa: true, airtel: true, card: false };
    methodBtns.forEach(function (b) {
      var ok = !!avail[b.dataset.method];
      b.disabled = !ok;
      var soon = b.querySelector('.soon');
      if (!ok && !soon) {
        soon = document.createElement('span');
        soon.className = 'soon';
        soon.textContent = 'Soon';
        b.appendChild(soon);
      } else if (ok && soon) {
        soon.remove();
      }
    });
    if (!avail[method]) {
      var first = methodBtns.find(function (b) { return !b.disabled; });
      if (first) setMethod(first.dataset.method);
    }
  }

  function setMethod(next, fromNetwork) {
    if (method === next) return;
    method = next;
    methodBtns.forEach(function (b) { b.setAttribute('aria-checked', b.dataset.method === next ? 'true' : 'false'); });
    var card = next === 'card';
    $('payPhoneField').classList.toggle('hidden', card);
    $('payEmailField').classList.toggle('hidden', !card);
    $('payPhoneLabel').textContent = LABEL[next] + ' number';
    $('payBtn').className = 'btn block ' + next;
    $('secureText').textContent = card
      ? 'Card details are entered on Stripe\'s secure page. We never see them.'
      : 'You approve with your PIN on your own phone. We never see it.';
    if (!fromNetwork) {
      amount = card ? 10 : 100;
      other = false;
    }
    renderAmounts();
    showError($('payErr'), '');
  }
  methodBtns.forEach(function (b) {
    b.addEventListener('click', function () { if (!b.disabled) setMethod(b.dataset.method); });
  });

  function renderAmounts() {
    var list = method === 'card'
      ? ((config && config.amounts.usd) || [5, 10, 25, 50, 100])
      : ((config && config.amounts.kes) || [50, 100, 250, 500, 1000]);
    var wrap = $('amounts');
    wrap.innerHTML = '';
    list.forEach(function (v) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'amount';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', !other && v === amount ? 'true' : 'false');
      b.innerHTML = method === 'card' ? '' : '<small>KES</small>';
      b.appendChild(document.createTextNode(method === 'card' ? usd(v) : v.toLocaleString('en-US')));
      b.addEventListener('click', function () { amount = v; other = false; renderAmounts(); });
      wrap.appendChild(b);
    });
    var o = document.createElement('button');
    o.type = 'button';
    o.className = 'amount other';
    o.setAttribute('role', 'radio');
    o.setAttribute('aria-checked', other ? 'true' : 'false');
    o.textContent = 'Other';
    o.addEventListener('click', function () { other = true; renderAmounts(); $('otherAmount').focus(); });
    wrap.appendChild(o);
    $('otherField').classList.toggle('hidden', !other);
    var min = method === 'card' ? 1 : ((config && config.amounts.min) || 10);
    $('otherHint').textContent = method === 'card' ? 'in US dollars' : 'min ' + kes(min);
    $('otherAmount').min = String(min);
    updateTotal();
  }

  function currentAmount() {
    return other ? Math.floor(Number($('otherAmount').value) || 0) : amount;
  }
  function updateTotal() {
    var a = currentAmount();
    $('payTotal').textContent = method === 'card' ? usd(a) : kes(a);
    $('payBtnText').textContent = method === 'card' ? 'Pay ' + usd(a) + ' by card' : 'Send ' + LABEL[method] + ' prompt';
  }
  $('otherAmount').addEventListener('input', updateTotal);

  bindPhone($('payPhone'), function (net) {
    // A Safaricom number means M-Pesa, an Airtel number means Airtel Money.
    if (method === 'card') return;
    if (net === 'safaricom' && method !== 'mpesa' && !$('payPhoneField').classList.contains('hidden')) setMethod('mpesa', true);
    if (net === 'airtel' && method !== 'airtel') setMethod('airtel', true);
  });

  $('payForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    showError($('payErr'), '');
    var a = currentAmount();
    var btn = $('payBtn');

    if (method === 'card') {
      var email = $('payEmail').value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showError($('payErr'), 'Enter your email for the receipt.');
      if (a < 1) return showError($('payErr'), 'Choose an amount.');
      busy(btn, true);
      try {
        var session = await api('POST', '/api/checkout', { email: email, amount: a * 100, currency: 'usd' });
        location.href = session.url;
      } catch (err) {
        showError($('payErr'), err.status === 503 ? 'Card payments are not switched on yet. Please use M-Pesa or Airtel Money.' : err.message);
        busy(btn, false);
      }
      return;
    }

    var min = (config && config.amounts.min) || 10;
    var max = (config && config.amounts.max) || 150000;
    if (!normalize($('payPhone').value)) return showError($('payErr'), 'Enter your ' + LABEL[method] + ' number, e.g. 0712 345 678.');
    if (!(a >= min && a <= max)) return showError($('payErr'), 'Choose an amount between ' + kes(min) + ' and ' + kes(max) + '.');

    busy(btn, true);
    try {
      var res = await api('POST', '/api/pay/mobile', { phone: $('payPhone').value, amount: a, provider: method });
      openPayment(res.payment);
    } catch (err) {
      showError($('payErr'), err.message);
    } finally {
      busy(btn, false);
    }
  });

  // ── Payment status sheet ──
  var poll = null;
  var tick = null;
  var current = null;

  function stopPolling() {
    clearTimeout(poll);
    clearInterval(tick);
    poll = null;
    tick = null;
  }

  function openPayment(payment) {
    current = payment;
    renderStk(payment, 90);
    openSheet('paySheet');
    var started = Date.now();
    var left = 90;
    stopPolling();
    tick = setInterval(function () {
      left = Math.max(0, 90 - Math.round((Date.now() - started) / 1000));
      var el = $('stkCountdown');
      if (el) el.textContent = left > 0 ? 'Waiting for your PIN · ' + Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0') : 'Still checking…';
    }, 1000);
    var check = async function () {
      try {
        var res = await api('GET', '/api/pay/mobile/' + encodeURIComponent(payment.id));
        current = res.payment;
        if (res.payment.status !== 'pending') {
          stopPolling();
          renderStk(res.payment);
          if (res.payment.status === 'paid') loadLedger();
          return;
        }
      } catch (e) { /* keep polling through blips */ }
      if (Date.now() - started < 200000) poll = setTimeout(check, 2500);
    };
    poll = setTimeout(check, 2000);
  }

  function renderStk(p) {
    var stk = $('stk');
    stk.className = 'stk ' + p.provider;
    var practice = p.mode === 'mock';
    var html = '';
    if (p.status === 'pending') {
      html =
        '<div class="stk-visual" aria-hidden="true"><span class="ring"></span><span class="ring"></span><span class="ring"></span>' +
        '<span class="handset"><b>****</b></span></div>' +
        '<h3 id="stkTitle">Check your phone</h3>' +
        '<p>Enter your <b></b> PIN on <b></b> to give <b></b>.</p>' +
        '<div class="steps"><div class="step done"><i>&#10003;</i>Prompt sent</div><div class="step now"><i>2</i>Enter PIN</div><div class="step"><i>3</i>Confirmed</div></div>' +
        '<div class="countdown" id="stkCountdown">Waiting for your PIN · 1:30</div>';
      if (practice) {
        html += '<div class="practice-hint"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>' +
          '<div>Practice mode: no real money moves. Enter any 4-digit PIN on the simulator phone, or wait a few seconds.' +
          '<div style="margin-top:10px"><button class="btn small ghost" type="button" id="openSimPin">Open the phone</button></div></div></div>';
      }
      stk.innerHTML = html;
      var bs = stk.querySelectorAll('p b');
      bs[0].textContent = p.providerLabel;
      bs[1].textContent = p.phone;
      bs[2].textContent = p.amountLabel;
      var open = $('openSimPin');
      if (open) open.addEventListener('click', function () { closeSheet('paySheet'); select('phone'); if (window.HarmonySim) window.HarmonySim.refresh(); keepWatching(p); });
      return;
    }
    if (p.status === 'paid') {
      stk.innerHTML =
        '<div class="result-ico ok"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>' +
        '<h3 id="stkTitle">Asante! Payment confirmed</h3><p>Your support is planting mangroves on Kenya\'s coast. A receipt is on its way by SMS.</p>' +
        '<div class="receipt"><div><span>Amount</span><b></b></div><div><span>Method</span><b></b></div><div><span>Receipt</span><b></b></div><div><span>Phone</span><b></b></div></div>' +
        '<button class="btn block" type="button" data-close style="margin-top:14px">Done</button>';
      var r = stk.querySelectorAll('.receipt b');
      r[0].textContent = p.amountLabel;
      r[1].textContent = p.providerLabel + (practice ? ' (practice)' : '');
      r[2].textContent = p.receipt || 'Pending';
      r[3].textContent = p.phone;
      return;
    }
    var titles = { cancelled: 'Payment cancelled', timeout: 'No response from the phone', failed: 'Payment didn\'t go through' };
    stk.innerHTML =
      '<div class="result-ico bad"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M7 7l10 10M17 7 7 17"/></svg></div>' +
      '<h3 id="stkTitle"></h3><p></p>' +
      '<div class="row" style="margin-top:18px"><button class="btn ghost" type="button" data-close>Close</button><button class="btn" type="button" id="stkRetry">Try again</button></div>';
    stk.querySelector('h3').textContent = titles[p.status] || 'Payment not completed';
    var why = p.failureReason || '';
    stk.querySelector('p').textContent = /charged/i.test(why) ? why : (why ? why + '. ' : '') + 'Nothing was charged.';
    $('stkRetry').addEventListener('click', function () { closeSheet('paySheet'); $('payBtn').click(); });
  }

  // If the student hops to the simulator to enter the PIN, reopen the sheet when it settles.
  function keepWatching(p) {
    var until = Date.now() + 180000;
    var check = async function () {
      try {
        var res = await api('GET', '/api/pay/mobile/' + encodeURIComponent(p.id));
        if (res.payment.status !== 'pending') {
          loadLedger();
          renderStk(res.payment);
          openSheet('paySheet');
          return;
        }
      } catch (e) {}
      if (Date.now() < until) setTimeout(check, 2500);
    };
    setTimeout(check, 2500);
  }

  // ── Ledger ──
  async function loadLedger() {
    try {
      var ledger = await api('GET', '/api/mobile/ledger');
      var goal = (config && config.goalKes) || 100000;
      $('raised').textContent = ledger.paid.label;
      $('supporters').textContent = ledger.paid.count
        ? ledger.paid.count + (ledger.paid.count === 1 ? ' gift' : ' gifts') + ' · goal ' + kes(goal)
        : 'Goal ' + kes(goal);
      var pct = Math.min(100, Math.round((ledger.paid.amount / goal) * 100));
      $('meterFill').style.width = Math.max(pct, ledger.paid.amount ? 2 : 0) + '%';
      $('meter').setAttribute('aria-valuenow', String(pct));
    } catch (e) {}
  }

  // Practice mode: pre-fill forms with the simulated line so demos flow.
  document.addEventListener('harmony:simline', function (e) {
    ['payPhone', 'joinPhone', 'humanPhone', 'askPhone'].forEach(function (id) {
      var el = $(id);
      if (el && !el.dataset.touched) {
        el.value = e.detail.pretty;
        el.dispatchEvent(new Event('input'));
      }
    });
  });
  ['payPhone', 'joinPhone', 'humanPhone', 'askPhone'].forEach(function (id) {
    $(id).addEventListener('keydown', function () { $(id).dataset.touched = '1'; });
  });

  window.HarmonyApp = { api: api, normalize: normalize, networkOf: networkOf, config: function () { return config; }, loadLedger: loadLedger };

  fromHash();
  loadConfig();
})();

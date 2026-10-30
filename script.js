(function () {
  'use strict';

  var ENDPOINT = 'https://formspree.io/f/mdayqzrd';
  var PHONE = '(434) 835-2059';
  var K = { age: 'exotic_21', ticket: 'exotic_ticket', orders: 'exotic_orders', cat: 'exotic_catalog', promo: 'exotic_promo', drops: 'exotic_drops', seq: 'exotic_seq' };
  var DEFAULT_PROMO = 'Open till 2 AM, Mon to Sat';
  var DELIVERY_ZIPS = ['24540', '24541'];

  // canDeliver false = Va. Code 18.2-246.8 (vapor, liquid nicotine) or tobacco signature rules: counter only on web orders.
  var SHELVES = [
    { id: 'vapes', name: 'Vapes', canDeliver: false, img: 'assets/vape-case.jpg', alt: 'Glass cases of vapes under the shop lights',
      tag: 'Reserve online, pick up with ID', items: [
        { id: 'v1', name: 'Disposables', note: 'Tell us the brand and flavor' },
        { id: 'v2', name: 'Pods and refills', note: 'Name your device' },
        { id: 'v3', name: 'Mods and tanks', note: 'Staff will walk you through it' },
        { id: 'v4', name: 'E-liquid', note: 'Nicotine level in the notes' },
        { id: 'v5', name: 'Nicotine pouches', note: 'Strength in the notes' } ] },
    { id: 'snacks', name: 'Snacks', canDeliver: true, img: 'assets/snacks.jpg', alt: 'Tower of imported chips, cookies and canned drinks',
      tag: 'Delivery or pickup', items: [
        { id: 's1', name: 'Imported chips', note: 'Korean shrimp and crab chips, more' },
        { id: 's2', name: 'Import cookies', note: 'What you can\'t get at the grocery store' },
        { id: 's3', name: 'Import sodas and energy cans', note: 'Mix a six if you want' },
        { id: 's4', name: 'Staff pick snack box', note: 'Tell us sweet, spicy or both' } ] },
    { id: 'glass', name: 'Glass', canDeliver: true, hexes: true,
      tag: 'Delivery or pickup', items: [
        { id: 'g1', name: 'Water pipes', note: 'For legal tobacco use' },
        { id: 'g2', name: 'Hand pipes', note: 'Artist and everyday pieces' },
        { id: 'g3', name: 'Bubblers', note: 'Tell us a size' },
        { id: 'g4', name: 'Downstems and bowls', note: 'Name your joint size' } ] },
    { id: 'hookah', name: 'Hookah', canDeliver: true, hexes: true,
      tag: 'Gear delivers. Shisha is pickup.', items: [
        { id: 'h1', name: 'Hookah sets', note: 'Tabletop to full-size' },
        { id: 'h2', name: 'Hoses and bowls', note: 'Replacements and upgrades' },
        { id: 'h3', name: 'Coals and foil', note: 'Grab it with your set' },
        { id: 'h4', name: 'Shisha', note: 'Pickup only, tobacco', pickupOnly: true } ] },
    { id: 'gear', name: 'Gear', canDeliver: true, img: 'assets/case.jpg', alt: 'Display case of torches and tobacco pipes',
      tag: 'Delivery or pickup', items: [
        { id: 'a1', name: 'Torches and lighters', note: 'The whole case, from pocket to tabletop' },
        { id: 'a2', name: 'Grinders', note: 'Metal and acrylic' },
        { id: 'a3', name: 'Trays and cases', note: 'Keep it together' },
        { id: 'a4', name: 'Exotic shop tee', note: 'Tell us your size' } ] },
    { id: 'tobacco', name: 'Tobacco', canDeliver: false, img: 'assets/wall.jpg', alt: 'Shelves of wraps, papers and tobacco products',
      tag: 'Reserve online, pick up with ID', items: [
        { id: 't1', name: 'Cigars and wraps', note: 'Name the brand' },
        { id: 't2', name: 'Rolling papers and filters', note: 'Size in the notes' },
        { id: 't3', name: 'Pipe tobacco', note: 'Staff can recommend' } ] }
  ];

  var $ = function (id) { return document.getElementById(id); };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode: keep going */ } }
  };
  var esc = function (s) { var d = document.createElement('div'); d.textContent = s == null ? '' : s; return d.innerHTML; };
  var itemById = function (id) {
    for (var i = 0; i < SHELVES.length; i++) for (var j = 0; j < SHELVES[i].items.length; j++)
      if (SHELVES[i].items[j].id === id) return { item: SHELVES[i].items[j], shelf: SHELVES[i] };
    return null;
  };
  var deliverable = function (id) { var r = itemById(id); return !!r && r.shelf.canDeliver && !r.item.pickupOnly; };

  if (window.__ASSETS) {
    [].forEach.call(document.querySelectorAll('img'), function (im) {
      var k = im.getAttribute('src'); if (window.__ASSETS[k]) im.src = window.__ASSETS[k];
    });
  }
  var asset = function (p) { return (window.__ASSETS && window.__ASSETS[p]) || p; };

  /* age gate */
  var gate = $('gate');
  var passGate = function () {
    gate.classList.add('leaving'); document.body.classList.remove('locked');
    setTimeout(function () { gate.hidden = true; }, 360);
  };
  try { if (sessionStorage.getItem(K.age) === 'yes') gate.hidden = true; } catch (e) { /* no session storage */ }
  if (!gate.hidden) document.body.classList.add('locked');
  $('gateYes').addEventListener('click', function () {
    try { sessionStorage.setItem(K.age, 'yes'); } catch (e) { /* no session storage */ }
    passGate();
  });
  $('gateNo').addEventListener('click', function () { $('gateMsg').hidden = false; });

  /* live open status, Eastern time. Hours past midnight belong to the day before. */
  function renderStatus() {
    var p = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', hour: 'numeric', hourCycle: 'h23', minute: 'numeric' }).formatToParts(new Date());
    var get = function (t) { return p.filter(function (x) { return x.type === t; })[0].value; };
    var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var d = days.indexOf(get('weekday')), h = parseInt(get('hour'), 10) + parseInt(get('minute'), 10) / 60;
    var yesterday = (d + 6) % 7, el = $('openStatus'), open = false, label = '';
    if (h < 2 && yesterday !== 0) { open = true; label = 'Open till 2 AM'; }
    else if (d === 0 && h >= 9) { open = true; label = 'Open till midnight'; }
    else if (d !== 0 && h >= 8) { open = true; label = 'Open till 2 AM'; }
    else label = 'Opens at ' + (d === 0 ? '9' : '8') + ' AM';
    el.textContent = label; el.classList.toggle('open', open);
  }
  renderStatus(); setInterval(renderStatus, 60000);

  /* marketing banner */
  function renderPromo() {
    var text = esc(store.get(K.promo, DEFAULT_PROMO)), base = text + ' &nbsp;/&nbsp; 4.9 stars, 323 Google reviews &nbsp;/&nbsp; 418 Trade St', out = '';
    for (var i = 0; i < 6; i++) out += '<span>' + base + '</span>';
    $('promoTrack').innerHTML = out;
  }

  /* catalog */
  var catState = function () { return store.get(K.cat, { out: {}, feat: {} }); };
  function renderShelves() {
    var st = catState(), tabs = '', html = '';
    SHELVES.forEach(function (s, i) {
      tabs += '<button type="button" data-shelf="' + s.id + '" aria-selected="' + (i === 0) + '">' + s.name + '</button>';
      html += '<article class="shelf' + (i === 0 ? ' active' : '') + '" id="shelf-' + s.id + '" aria-label="' + s.name + '">';
      html += s.hexes
        ? '<div class="shelf-img hexes"><span style="position:relative">' + s.name + '</span></div>'
        : '<div class="shelf-img"><img src="' + asset(s.img) + '" alt="' + esc(s.alt) + '" loading="lazy"></div>';
      html += '<div class="shelf-tag"><span class="' + (s.canDeliver ? 'tag-go' : 'tag-hold') + '">' + esc(s.tag) + '</span>' +
        '<button type="button" class="share" data-share="' + s.id + '">Share this shelf</button></div><div class="shelf-items">';
      s.items.forEach(function (it) {
        var cl = 'item' + (st.out[it.id] ? ' out' : '') + (st.feat[s.id] === it.id ? ' featured' : '');
        html += '<div class="' + cl + '"><span class="item-name">' + esc(it.name) + '</span><span class="item-note">' + esc(it.note) + '</span>' +
          '<button type="button" class="add" data-add="' + it.id + '" aria-label="Add ' + esc(it.name) + ' to ticket">+</button></div>';
      });
      html += '</div></article>';
    });
    $('shelfTabs').innerHTML = tabs; $('shelves').innerHTML = html;
  }

  var track = function () { return $('shelves'); };
  function goShelf(id, smooth) {
    var el = $('shelf-' + id); if (!el) return;
    track().scrollTo({ left: el.offsetLeft - track().children[0].offsetLeft, behavior: smooth ? 'smooth' : 'auto' });
    markShelf(id);
  }
  function markShelf(id) {
    [].forEach.call($('shelfTabs').children, function (b) {
      var on = b.getAttribute('data-shelf') === id;
      b.setAttribute('aria-selected', on);
      if (on) $('shelfTabs').scrollTo({ left: b.offsetLeft - 20, behavior: 'smooth' });
    });
    [].forEach.call(track().children, function (s) { s.classList.toggle('active', s.id === 'shelf-' + id); });
  }

  /* ticket */
  var ticket = store.get(K.ticket, {});
  var mode = 'pickup';
  var count = function () { return Object.keys(ticket).reduce(function (n, k) { return n + ticket[k]; }, 0); };
  function saveTicket() { store.set(K.ticket, ticket); renderBar(); }
  function renderBar() {
    var n = count(), bar = $('ticketBar');
    bar.hidden = n === 0 || !$('sheet').hidden || !$('board').hidden;
    $('ticketCount').textContent = n;
  }
  function addItem(id, btn) {
    ticket[id] = (ticket[id] || 0) + 1; saveTicket();
    var c = $('ticketCount'); c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump');
    if (btn) { btn.classList.add('hit'); setTimeout(function () { btn.classList.remove('hit'); }, 240); }
    if (navigator.vibrate) navigator.vibrate(12);
  }

  function lineHtml(id) {
    return '<div class="line" data-line="' + id + '"><span class="line-name">' + esc(itemById(id).item.name) + '</span>' +
      '<div class="qty"><button type="button" data-dec="' + id + '" aria-label="One less">&minus;</button><span>' + ticket[id] + '</span>' +
      '<button type="button" data-inc="' + id + '" aria-label="One more">+</button></div></div>';
  }
  function renderLines() {
    var ids = Object.keys(ticket), out = '';
    if (!ids.length) { closeSheet(); return; }
    var go = ids.filter(deliverable), hold = ids.filter(function (i) { return !deliverable(i); });
    if (mode === 'delivery') {
      if (go.length) out += '<p class="line-group tag-go">Out for delivery</p>' + go.map(lineHtml).join('');
      if (hold.length) out += '<p class="line-group tag-hold">Held at the counter</p>' + hold.map(lineHtml).join('');
    } else out += ids.map(lineHtml).join('');
    out += '<p class="line-tip">Swipe an item left to remove it.</p>';
    $('ticketLines').innerHTML = out;
    var note = $('splitNote');
    if (mode === 'delivery' && hold.length && go.length) {
      note.hidden = false; note.textContent = 'Web orders for vapes, nicotine and tobacco can\'t be delivered in Virginia. We\'ll deliver the rest and hold those at the counter for you with ID.';
    } else if (mode === 'delivery' && hold.length) {
      note.hidden = false; note.textContent = 'Nothing here can go out on a web order. Virginia law keeps vapes, nicotine and tobacco at the counter, so this will be a pickup.';
    } else note.hidden = true;
    bindLineSwipes();
  }
  function setMode(m) {
    mode = m;
    [].forEach.call(document.querySelectorAll('.mode button'), function (b) { b.setAttribute('aria-checked', b.getAttribute('data-mode') === m); });
    renderLines();
    var delivering = effectiveDelivery();
    $('deliveryFields').hidden = !delivering;
    $('idWhere').textContent = delivering ? 'the door' : 'pickup';
  }
  function effectiveDelivery() { return mode === 'delivery' && Object.keys(ticket).some(deliverable); }

  function bindLineSwipes() {
    [].forEach.call(document.querySelectorAll('.line'), function (row) {
      swipe(row, {
        axisLock: true,
        move: function (dx) { row.style.transform = 'translateX(' + Math.min(0, dx) + 'px)'; row.style.opacity = 1 + Math.min(0, dx) / 260; },
        end: function (dx) {
          if (dx < -90) { delete ticket[row.getAttribute('data-line')]; saveTicket(); renderLines(); }
          else { row.style.transform = ''; row.style.opacity = ''; }
        }
      });
    });
  }

  /* shared pointer swipe: horizontal gestures only, vertical scroll stays native */
  function swipe(el, h) {
    var sx = 0, sy = 0, active = false, horiz = false, dx = 0;
    el.addEventListener('pointerdown', function (e) {
      if (e.target.closest('a,button') && !h.fromButtons) return;
      sx = e.clientX; sy = e.clientY; active = true; horiz = false; dx = 0;
    });
    el.addEventListener('pointermove', function (e) {
      if (!active) return;
      var ox = e.clientX - sx, oy = e.clientY - sy;
      if (!horiz) {
        if (Math.abs(oy) > 10 && Math.abs(oy) > Math.abs(ox)) { active = false; return; }
        if (Math.abs(ox) < 10) return;
        horiz = true; el.classList.add('dragging');
        try { el.setPointerCapture(e.pointerId); } catch (err) { /* synthetic event */ }
      }
      dx = ox; h.move(dx);
    });
    var stop = function () {
      if (!active) return; active = false;
      if (horiz) { el.classList.remove('dragging'); h.end(dx); }
    };
    el.addEventListener('pointerup', stop); el.addEventListener('pointercancel', stop);
  }

  /* sheet */
  function openSheet() {
    showStep(1); setMode(mode);
    $('sheet').hidden = false; $('scrim').hidden = false; document.body.classList.add('locked'); renderBar();
    requestAnimationFrame(function () { requestAnimationFrame(function () { $('sheet').classList.add('up'); }); });
  }
  function closeSheet() {
    var sh = $('sheet'); if (sh.hidden) return;
    sh.classList.remove('up'); sh.style.transform = ''; $('scrim').hidden = true; document.body.classList.remove('locked');
    setTimeout(function () { sh.hidden = true; renderBar(); }, 340);
  }
  function showStep(n) {
    $('step1').hidden = n !== 1; $('step2').hidden = n !== 2; $('step3').hidden = n !== 3;
    $('sheet').scrollTop = 0;
  }
  (function () {
    var grab = $('grab'), sy = 0, on = false, dy = 0, sh = $('sheet');
    grab.addEventListener('pointerdown', function (e) { on = true; sy = e.clientY; dy = 0; sh.classList.add('dragging'); try { grab.setPointerCapture(e.pointerId); } catch (err) { /* synthetic */ } });
    grab.addEventListener('pointermove', function (e) { if (!on) return; dy = Math.max(0, e.clientY - sy); sh.style.transform = 'translateY(' + dy + 'px)'; });
    var end = function () { if (!on) return; on = false; sh.classList.remove('dragging'); if (dy > 110) closeSheet(); else sh.style.transform = ''; };
    grab.addEventListener('pointerup', end); grab.addEventListener('pointercancel', end);
  })();

  /* order form */
  function setErr(id, msg) {
    var e = document.querySelector('.err[data-for="' + id + '"]'); if (e) e.textContent = msg || '';
    var f = $(id); if (f) f.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  }
  function validate() {
    var name = $('fName').value.trim(), digits = $('fPhone').value.replace(/\D/g, ''), ok = true;
    if (digits.length === 11 && digits[0] === '1') digits = digits.slice(1);
    ok = setErr('fName', name.length < 2 ? 'Put the name on your ID.' : '') && ok;
    ok = setErr('fPhone', digits.length !== 10 ? 'We need a 10-digit number to confirm your total.' : '') && ok;
    if (effectiveDelivery()) {
      ok = setErr('fAddr', $('fAddr').value.trim().length < 5 ? 'Where should we bring it?' : '') && ok;
      var z = $('fZip').value.trim();
      ok = setErr('fZip', DELIVERY_ZIPS.indexOf(z) < 0 ? 'We deliver in Danville (24540, 24541). Call ' + PHONE + ' if you\'re close.' : '') && ok;
    } else { setErr('fAddr'); setErr('fZip'); }
    ok = setErr('f21', $('f21').checked ? '' : 'You have to be 21 to order.') && ok;
    return ok;
  }
  function nextNo() { var n = store.get(K.seq, 100) + 1; store.set(K.seq, n); return n; }
  function buildOrder() {
    var del = effectiveDelivery(), ids = Object.keys(ticket);
    return {
      no: nextNo(), at: Date.now(), stage: 'new', sample: false,
      kind: del ? 'delivery' : 'pickup', name: $('fName').value.trim(), phone: $('fPhone').value.trim(),
      address: del ? $('fAddr').value.trim() + ', ' + $('fZip').value.trim() : '', note: $('fNote').value.trim(),
      out: del ? ids.filter(deliverable).map(function (i) { return { n: itemById(i).item.name, q: ticket[i] }; }) : [],
      hold: (del ? ids.filter(function (i) { return !deliverable(i); }) : ids).map(function (i) { return { n: itemById(i).item.name, q: ticket[i] }; })
    };
  }
  var listStr = function (a) { return a.map(function (x) { return x.q + ' x ' + x.n; }).join('; '); };
  $('step2').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) { var first = document.querySelector('[aria-invalid="true"]'); if (first) first.focus(); return; }
    var o = buildOrder(), btn = $('sendOrder'), msg = $('orderMsg');
    btn.disabled = true; btn.textContent = 'Sending...'; msg.textContent = ''; msg.classList.remove('bad');
    fetch(ENDPOINT, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        _subject: '[DEMO · EXOTIC] #' + o.no + ' ' + o.kind + ' for ' + o.name,
        order: o.no, kind: o.kind, name: o.name, phone: o.phone, address: o.address,
        deliver_items: listStr(o.out), counter_items: listStr(o.hold), note: o.note, confirmed_21_plus: true
      })
    }).then(function (r) {
      if (!r.ok) throw new Error('send');
      var all = store.get(K.orders, []); all.unshift(o); store.set(K.orders, all);
      $('doneNo').textContent = 'Order #' + o.no;
      $('doneMsg').textContent = o.kind === 'delivery'
        ? 'We\'ll call or text ' + o.phone + ' with your total and timing.' + (o.hold.length ? ' Your counter items will be waiting with your name on them.' : '') + ' Have your ID ready. An adult 21+ has to sign at the door.'
        : 'We\'ll call or text ' + o.phone + ' with your total, then hold it at the counter under your name. Bring your ID to 418 Trade St.';
      ticket = {}; saveTicket(); $('step2').reset();
      showStep(3);
      var p = document.querySelector('.done-hex path'); if (p) { p.style.animation = 'none'; void p.getBoundingClientRect(); p.style.animation = ''; }
    }).catch(function () {
      msg.classList.add('bad'); msg.textContent = 'That didn\'t go through. Your ticket is safe. Try again or call ' + PHONE + '.';
      store.set(K.seq, store.get(K.seq, 101) - 1);
    }).then(function () { btn.disabled = false; btn.textContent = 'Send my order'; });
  });

  /* drop list */
  $('dropForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var input = $('dropEmail'), v = input.value.trim(), msg = $('dropMsg');
    msg.classList.remove('bad');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { msg.classList.add('bad'); msg.textContent = 'That email doesn\'t look right.'; return; }
    fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ _subject: '[DEMO · EXOTIC] Drop list signup', email: v }) })
      .then(function (r) {
        if (!r.ok) throw new Error('send');
        var l = store.get(K.drops, []); if (l.indexOf(v) < 0) l.unshift(v); store.set(K.drops, l);
        msg.textContent = 'You\'re on the list.'; input.value = '';
      }).catch(function () { msg.classList.add('bad'); msg.textContent = 'That didn\'t go through. Try again in a minute.'; });
  });

  /* share */
  function shelfUrl(id) { return location.origin + location.pathname + '#shelf=' + id; }
  function toast(t) { var el = $('toast'); el.textContent = t; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(function () { el.hidden = true; }, 1800); }
  function share(id) {
    var s = SHELVES.filter(function (x) { return x.id === id; })[0], url = shelfUrl(id);
    if (navigator.share) { navigator.share({ title: 'Exotic Smoke Shop: ' + s.name, url: url }).catch(function () { /* cancelled */ }); return; }
    copy(url);
  }
  function copy(url) {
    var done = function () { toast('Link copied'); };
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, function () { toast(url); });
    else toast(url);
  }

  /* owner board */
  var STAGES = [{ id: 'new', label: 'New', next: 'Start packing' }, { id: 'pack', label: 'Packing', next: 'Ready' }, { id: 'ready', label: 'Ready or out', next: 'Done' }];
  var ORDER = ['new', 'pack', 'ready', 'done'];
  function renderBoard() {
    var all = store.get(K.orders, []), live = all.filter(function (o) { return o.stage !== 'done'; });
    var doneN = all.length - live.length, dl = live.filter(function (o) { return o.kind === 'delivery'; }).length;
    $('boardStats').innerHTML = '<span><b>' + all.filter(function (o) { return o.stage === 'new'; }).length + '</b>new</span><span><b>' + dl + '</b>deliveries</span><span><b>' + (live.length - dl) + '</b>at counter</span><span><b>' + doneN + '</b>done</span>';
    $('cols').innerHTML = STAGES.map(function (st) {
      var rows = all.filter(function (o) { return o.stage === st.id; });
      return '<div class="col"><h3>' + st.label + ' <span>' + rows.length + '</span></h3>' + (rows.length ? rows.map(function (o) { return cardHtml(o, st); }).join('') : '<p class="empty">Nothing here.</p>') + '</div>';
    }).join('');
    [].forEach.call(document.querySelectorAll('.card'), function (c) {
      swipe(c, {
        move: function (dx) { c.style.transform = 'translateX(' + Math.max(0, dx) + 'px)'; },
        end: function (dx) { c.style.transform = ''; if (dx > 90) advance(+c.getAttribute('data-no')); }
      });
    });
  }
  function cardHtml(o, st) {
    var li = function (x) { return '<li>' + x.q + ' &times; ' + esc(x.n) + '</li>'; };
    var mins = Math.max(0, Math.round((Date.now() - o.at) / 60000));
    return '<article class="card ' + o.kind + '" data-no="' + o.no + '"><div class="card-top"><span>#' + o.no + ' ' + esc(o.name) + '</span><span>' + (mins < 1 ? 'now' : mins + 'm') + '</span></div>' +
      '<p class="card-kind">' + (o.kind === 'delivery' ? 'DELIVERY: ' + esc(o.address) : 'PICKUP') + (o.sample ? ' (sample)' : '') + '</p>' +
      (o.out.length ? '<ul>' + o.out.map(li).join('') + '</ul>' : '') +
      (o.hold.length ? (o.kind === 'delivery' ? '<p class="card-kind" style="margin-top:.4rem">HOLD AT COUNTER</p>' : '') + '<ul>' + o.hold.map(li).join('') + '</ul>' : '') +
      (o.note ? '<p class="card-note">' + esc(o.note) + '</p>' : '') +
      '<p class="card-id">' + (o.kind === 'delivery' ? 'Check ID + 21+ signature at door' : 'Check ID at counter') + '</p>' +
      '<div class="card-acts"><a href="tel:' + esc(o.phone.replace(/[^\d+]/g, '')) + '">Call</a><button type="button" class="next" data-next="' + o.no + '">' + st.next + '</button></div></article>';
  }
  function advance(no) {
    var all = store.get(K.orders, []);
    all.forEach(function (o) { if (o.no === no) o.stage = ORDER[ORDER.indexOf(o.stage) + 1] || 'done'; });
    store.set(K.orders, all); renderBoard();
  }
  function seed() {
    var now = Date.now(), m = 60000, s = function (no, ago, stage, kind, name, phone, addr, out, hold, note) { return { no: no, at: now - ago * m, stage: stage, sample: true, kind: kind, name: name, phone: phone, address: addr, note: note || '', out: out, hold: hold }; };
    var sample = [
      s(901, 2, 'new', 'delivery', 'Jordan P.', '(434) 555-0142', 'Riverside Dr, 24541', [{ n: 'Imported chips', q: 2 }, { n: 'Torches and lighters', q: 1 }], [{ n: 'Disposables', q: 1 }], 'Spicy chips please'),
      s(902, 6, 'new', 'pickup', 'Maya R.', '(434) 555-0187', '', [], [{ n: 'Pods and refills', q: 2 }], 'Picking up after work, around 11'),
      s(903, 14, 'pack', 'delivery', 'Andre T.', '(434) 555-0119', 'Piney Forest Rd, 24540', [{ n: 'Hookah sets', q: 1 }, { n: 'Coals and foil', q: 1 }], []),
      s(904, 31, 'ready', 'pickup', 'Dee W.', '(434) 555-0163', '', [], [{ n: 'Cigars and wraps', q: 1 }, { n: 'E-liquid', q: 1 }])
    ];
    var all = store.get(K.orders, []).filter(function (o) { return !o.sample; });
    store.set(K.orders, sample.concat(all)); renderBoard();
  }
  function renderAdmin() {
    var st = catState();
    $('catAdmin').innerHTML = SHELVES.map(function (s) {
      return '<div class="admin-shelf"><h4>' + s.name + '</h4>' + s.items.map(function (it) {
        return '<div class="admin-row"><span>' + esc(it.name) + '</span><button type="button" class="' + (st.feat[s.id] === it.id ? 'on' : '') + '" data-feat="' + s.id + ':' + it.id + '">Feature</button>' +
          '<button type="button" class="' + (st.out[it.id] ? 'on' : '') + '" data-out="' + it.id + '">Out</button></div>';
      }).join('') + '</div>';
    }).join('');
  }
  function renderMarket() {
    $('promoInput').value = store.get(K.promo, DEFAULT_PROMO);
    $('shareLinks').innerHTML = SHELVES.map(function (s) { return '<div class="link-row"><span>' + s.name + '</span><button type="button" data-copy="' + s.id + '">Copy link</button></div>'; }).join('');
    var l = store.get(K.drops, []);
    $('dropCount').textContent = '(' + l.length + ')';
    $('dropList').innerHTML = l.length ? l.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') : '<li>Nobody yet.</li>';
  }
  function showTab(t) {
    [].forEach.call(document.querySelectorAll('.board-tabs button'), function (b) { b.setAttribute('aria-selected', b.getAttribute('data-tab') === t); });
    $('tabOrders').hidden = t !== 'orders'; $('tabCatalog').hidden = t !== 'catalog'; $('tabMarket').hidden = t !== 'market';
    if (t === 'orders') renderBoard(); if (t === 'catalog') renderAdmin(); if (t === 'market') renderMarket();
  }
  function openBoard() { gate.hidden = true; $('board').hidden = false; document.body.classList.add('locked'); showTab('orders'); renderBar(); }
  function closeBoard() { $('board').hidden = true; document.body.classList.remove('locked'); renderShelves(); renderPromo(); renderBar(); }

  /* routing */
  function route(first) {
    var h = location.hash;
    if (h === '#board') { openBoard(); return; }
    if (!$('board').hidden) closeBoard();
    var m = h.match(/^#shelf=(\w+)/);
    if (m && $('shelf-' + m[1])) {
      $('wall').scrollIntoView({ behavior: first ? 'auto' : 'smooth' });
      goShelf(m[1], !first);
    }
  }

  /* delegated clicks */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('button,[data-add]'); if (!t) return;
    var v;
    if ((v = t.getAttribute('data-add'))) addItem(v, t);
    else if ((v = t.getAttribute('data-shelf'))) goShelf(v, true);
    else if ((v = t.getAttribute('data-share'))) share(v);
    else if ((v = t.getAttribute('data-mode'))) setMode(v);
    else if ((v = t.getAttribute('data-inc'))) { ticket[v]++; saveTicket(); renderLines(); }
    else if ((v = t.getAttribute('data-dec'))) { if (--ticket[v] < 1) delete ticket[v]; saveTicket(); renderLines(); }
    else if ((v = t.getAttribute('data-next'))) advance(+v);
    else if ((v = t.getAttribute('data-tab'))) showTab(v);
    else if ((v = t.getAttribute('data-copy'))) copy(shelfUrl(v));
    else if ((v = t.getAttribute('data-out'))) { var a = catState(); a.out[v] = !a.out[v]; store.set(K.cat, a); renderAdmin(); }
    else if ((v = t.getAttribute('data-feat'))) { var b = catState(), p = v.split(':'); b.feat[p[0]] = b.feat[p[0]] === p[1] ? null : p[1]; store.set(K.cat, b); renderAdmin(); }
  });
  $('ticketBar').addEventListener('click', openSheet);
  $('sheetClose').addEventListener('click', closeSheet);
  $('scrim').addEventListener('click', closeSheet);
  $('doneClose').addEventListener('click', closeSheet);
  $('toDetails').addEventListener('click', function () { setMode(mode); showStep(2); });
  $('backTo1').addEventListener('click', function () { showStep(1); });
  $('seedBtn').addEventListener('click', seed);
  $('clearBtn').addEventListener('click', function () { store.set(K.orders, []); renderBoard(); });
  $('promoForm').addEventListener('submit', function (e) {
    e.preventDefault(); var v = $('promoInput').value.trim();
    store.set(K.promo, v || DEFAULT_PROMO); renderPromo(); toast('Banner is live');
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });
  window.addEventListener('hashchange', function () { route(false); });

  /* triple tap footer opens the owner board */
  (function () {
    var n = 0, tm;
    $('footTap').addEventListener('click', function () {
      n++; clearTimeout(tm); tm = setTimeout(function () { n = 0; }, 700);
      if (n >= 3) { n = 0; location.hash = '#board'; }
    });
  })();

  renderPromo(); renderShelves(); renderBar();

  /* sync tabs to swipe position */
  (function () {
    var raf;
    track().addEventListener('scroll', function () {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () {
        var x = track().scrollLeft + track().clientWidth / 2, cur = null;
        [].forEach.call(track().children, function (s) { if (s.offsetLeft - track().offsetLeft <= x) cur = s; });
        if (cur) {
          var id = cur.id.replace('shelf-', ''), sel = $('shelfTabs').querySelector('[aria-selected="true"]');
          if (!sel || sel.getAttribute('data-shelf') !== id) markShelf(id);
        }
      });
    }, { passive: true });
  })();

  route(true);
})();

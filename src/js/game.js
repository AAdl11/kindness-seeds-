/* =====================================================================
   善的種子 · 關懷之夜 / Care at Dusk — 主引擎
   依賴：i18n.js, audio.js, data/level1.js
   核心循環：車開進來 → 讀懂車上線索 → 親手配關懷包 → 送出 → 窗亮融入背景
            → 下一台 → 天黑溫柔收場
   無分數 / 無排名 / 無懲罰；天色倒數只是黃昏氛圍，時間到=溫柔收場。
   ===================================================================== */
(function () {
  'use strict';

  /* ---------- 持久化（localStorage，含記憶體 fallback） ---------- */
  var MEM = {};
  var KEY = 'kindness-seeds-save';
  function loadSave() {
    try { var raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw); }
    catch (e) { if (MEM[KEY]) return JSON.parse(MEM[KEY]); }
    return null;
  }
  function persist() {
    var raw = JSON.stringify(SAVE);
    try { localStorage.setItem(KEY, raw); } catch (e) { MEM[KEY] = raw; }
  }
  var SAVE = loadSave() || {
    sprout: { name: '', growth: 0 },
    warmth: 0, bamboo: 0, homeFu: 0, lit: {}, lastHomes: 0
  };

  /* ---------- 小芽 ---------- */
  var SPROUT_EMOJI = ['🌱', '🌿', '🪴', '🌳'];
  function sproutStage(g) { return g >= 12 ? 3 : g >= 6 ? 2 : g >= 1 ? 1 : 0; }
  function sproutIcon() { return SPROUT_EMOJI[sproutStage(SAVE.sprout.growth)]; }

  /* ---------- HUB 節點（三福；只有「關懷之夜」可玩，其餘即將） ---------- */
  var NODES = {
    home: [
      { id: 'rv_park_dusk', state: 'play', stars: 2,
        nm: { zh: '關懷之夜', en: 'Care at Dusk', es: 'Cuidado al Atardecer' },
        ds: { zh: 'RV Park 關懷 · 入門', en: 'RV Park outreach · intro', es: 'RV Park · inicio' } },
      { id: 'foodshare', state: 'soon', stars: 1,
        nm: { zh: '食物發放', en: 'Food share', es: 'Reparto de alimentos' },
        ds: { zh: '2006 一把生米', en: '2006, a handful of rice', es: '2006, un puñado de arroz' } },
      { id: 'blankets', state: 'soon', stars: 1,
        nm: { zh: '冬季毛毯', en: 'Winter blankets', es: 'Mantas de invierno' },
        ds: { zh: '海風天涼', en: 'Against the cold wind', es: 'Contra el viento frío' } }
    ],
    campus: [
      { id: 'tutoring', state: 'soon', stars: 2,
        nm: { zh: '課後輔導', en: 'After-school tutoring', es: 'Tutoría' },
        ds: { zh: '幸福校園 · Bret Harte', en: 'Blessed Campus · Bret Harte', es: 'Campus · Bret Harte' } },
      { id: 'attendance', state: 'soon', stars: 1,
        nm: { zh: '全勤獎', en: 'Perfect attendance', es: 'Asistencia perfecta' },
        ds: { zh: '為堅持鼓掌', en: 'Cheer every child', es: 'Aplausos para cada niño' } },
      { id: 'cooking', state: 'soon', stars: 2,
        nm: { zh: '素食烹飪班', en: 'Veggie cooking class', es: 'Clase de cocina vegetariana' },
        ds: { zh: '照順序抓時機', en: 'Timing & order', es: 'Orden y tiempo' } }
    ],
    community: [
      { id: 'clinic', state: 'soon', stars: 3,
        nm: { zh: '義診', en: 'Free clinic', es: 'Clínica gratuita' },
        ds: { zh: '醫師週末義診 @ AG', en: 'Weekend clinic @ AG', es: 'Clínica de fin de semana @ AG' } },
      { id: 'eco', state: 'soon', stars: 2,
        nm: { zh: '環保小尖兵', en: 'Eco vanguard', es: 'Vanguardia ecológica' },
        ds: { zh: '街角整理回乾淨', en: 'A corner made bright', es: 'Una esquina iluminada' } },
      { id: 'hotmeal', state: 'soon', stars: 2,
        nm: { zh: '遊民熱食', en: 'Hot meals', es: 'Comidas calientes' },
        ds: { zh: '社區活動中心', en: 'Community center', es: 'Centro comunitario' } }
    ]
  };

  /* ---------- 螢幕切換 ---------- */
  function show(id) {
    ['opening', 'hub', 'level', 'ending'].forEach(function (s) {
      var el = document.getElementById(s); if (!el) return;
      if (s === 'level') el.style.display = (s === id) ? 'flex' : 'none';
      else el.classList.toggle('hidden', s !== id);
    });
  }

  /* ===================================================================
     開場
     =================================================================== */
  function renderOpening() {
    document.getElementById('opTitle').textContent = T('title');
    document.getElementById('opSub').textContent = T('subtitle');
    document.getElementById('opNameLabel').textContent = T('nameSprout');
    document.getElementById('opHint').textContent = T('nameHint');
    var input = document.getElementById('sproutName');
    input.placeholder = T('namePlaceholder');
    if (SAVE.sprout.name) input.value = SAVE.sprout.name;
    document.getElementById('beginBtn').textContent = T('enterHP');
  }

  /* ===================================================================
     HUB / 三福
     =================================================================== */
  function renderHub() {
    document.getElementById('hubTitle').textContent = T('hubTitle');
    document.getElementById('hubSub').textContent = T('subtitle');
    var hud = document.getElementById('hubHud'); hud.innerHTML = '';
    hud.appendChild(chip(sproutIcon() + ' ' + (SAVE.sprout.name || T('sproutLabel'))));
    hud.appendChild(chip('🎍 ' + T('bambooLabel') + ' ' + SAVE.bamboo));
    hud.appendChild(chip('💛 ' + T('warmthLabel') + ' ' + SAVE.warmth));

    var zonesEl = document.getElementById('fuZones'); zonesEl.innerHTML = '';
    [['home', T('fuHome')], ['campus', T('fuCampus')], ['community', T('fuCommunity')]].forEach(function (pair) {
      var fu = document.createElement('div'); fu.className = 'fu';
      var h = document.createElement('h3'); h.textContent = pair[1]; fu.appendChild(h);
      var acts = document.createElement('div'); acts.className = 'acts';
      NODES[pair[0]].forEach(function (n) { acts.appendChild(nodeEl(n)); });
      fu.appendChild(acts); zonesEl.appendChild(fu);
    });
  }
  function chip(txt) { var c = document.createElement('div'); c.className = 'chip'; c.textContent = txt; return c; }
  function stars(n) { return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n); }
  function nodeEl(n) {
    var d = document.createElement('div');
    d.className = 'node ' + (n.state === 'play' ? 'playable' : 'soon');
    var lit = SAVE.lit[n.id] ? ' ✨' : '';
    d.innerHTML =
      '<div class="tag">' + (n.state === 'play' ? T('play') : T('soon')) + '</div>' +
      '<div class="nm">' + L(n.nm) + lit + '</div>' +
      '<div class="ds">' + L(n.ds) + '</div>' +
      '<div class="stars">' + stars(n.stars) + '</div>';
    if (n.state === 'play') d.addEventListener('click', function () { Sound.startMusic(); startLevel(); });
    return d;
  }

  /* ===================================================================
     關卡 · 關懷之夜
     =================================================================== */
  var D = window.LEVEL1;
  var IW = 1376, IH = 768;            // 背景原始尺寸
  var CARS = 7;                       // 一夜七台車
  var COUNTS = [1, 1, 1, 2, 2, 2, 3]; // 越後面需要越多、線索要讀越多條
  var NIGHT_MS = 420000;              // 黃昏到天黑約 7 分鐘（從容讀線索，七台都顧得完）
  var rect = { ox: 0, oy: 0, rw: 1, rh: 1, s: 1 };
  var lvl = null;

  function startLevel() {
    lvl = {
      carIndex: 0, served: 0, car: null,
      pack: [], notes: [],
      startT: performance.now(), progress: 0, ended: false, usedLines: []
    };
    show('level');
    buildWinGlows();
    renderLvlHud();
    renderPanelLabels();
    layout();
    // 開場先把面板展開
    document.getElementById('panel').classList.remove('collapsed');
    // 「開始這一夜」的夜晚字眼，進關卡時才出現
    toast('🌇 ' + T('begin'), null, 1900);
    setTimeout(spawnCar, 1300);
    requestAnimationFrame(loop);
  }

  /* ---- 座標：背景用 contain，整張圖都在；把比例精準對應到車身 ---- */
  function computeRect() {
    var stage = document.getElementById('stage');
    var W = stage.clientWidth, H = stage.clientHeight;
    var s = Math.min(W / IW, H / IH);
    var rw = IW * s, rh = IH * s;
    rect = { ox: (W - rw) / 2, oy: (H - rh) / 2, rw: rw, rh: rh, s: s };
  }
  function px(fx, fy) { return { x: rect.ox + fx * rect.rw, y: rect.oy + fy * rect.rh }; }

  function layout() {
    computeRect();
    var img = document.getElementById('sceneImg');
    img.style.left = rect.ox + 'px'; img.style.top = rect.oy + 'px';
    img.style.width = rect.rw + 'px'; img.style.height = rect.rh + 'px';
    // 窗光
    D.spots.forEach(function (sp, i) {
      var g = document.getElementById('wg' + i); if (!g) return;
      var p = px(sp.window.x, sp.window.y);
      var w = rect.rw * 0.078, h = rect.rw * 0.058;
      g.style.left = p.x + 'px'; g.style.top = p.y + 'px';
      g.style.width = w + 'px'; g.style.height = h + 'px';
    });
    // 線索
    document.querySelectorAll('#clueLayer .clue').forEach(function (el) {
      var p = px(parseFloat(el.dataset.fx), parseFloat(el.dataset.fy));
      el.style.left = p.x + 'px'; el.style.top = p.y + 'px';
    });
    // 聚光
    if (lvl && lvl.car) positionSpot(lvl.car.spot.focus.x, lvl.car.spot.focus.y, false);
  }

  function positionSpot(fx, fy, animatedFromSide) {
    var p = px(fx, fy);
    var w = rect.rw * 0.22, h = rect.rw * 0.17;
    var spot = document.getElementById('spotlight'), ring = document.getElementById('spotRing');
    [spot, ring].forEach(function (el, k) {
      el.style.width = (w + (k ? rect.rw * 0.012 : 0)) + 'px';
      el.style.height = (h + (k ? rect.rw * 0.012 : 0)) + 'px';
      el.style.top = p.y + 'px';
      el.style.left = (animatedFromSide ? (rect.ox + rect.rw * 1.05) : p.x) + 'px';
      el.style.opacity = 1;
    });
  }

  function buildWinGlows() {
    var layer = document.getElementById('glowLayer'); layer.innerHTML = '';
    D.spots.forEach(function (sp, i) {
      var g = document.createElement('div'); g.className = 'winglow'; g.id = 'wg' + i;
      layer.appendChild(g);
    });
  }

  function renderLvlHud() {
    var hud = document.getElementById('hudBar'); hud.innerHTML = '';
    hud.appendChild(chip(sproutIcon() + ' ' + (SAVE.sprout.name || T('sproutLabel'))));
    var warm = chip('💛 ' + SAVE.warmth); warm.className = 'chip warm'; hud.appendChild(warm);
    hud.appendChild(chip('🚐 ' + T('homesLabel') + ' ' + lvl.served + '/' + CARS));
    var leave = document.createElement('button');
    leave.id = 'leaveBtn'; leave.textContent = T('toHub');
    leave.addEventListener('click', function () { lvl.ended = true; show('hub'); renderHub(); });
    hud.appendChild(leave);
  }

  function renderPanelLabels() {
    document.getElementById('notesH').innerHTML = '📝 ' + T('notesTitle');
    document.getElementById('shelfH').textContent = '🧺 ' + T('shelfTitle');
    document.getElementById('packH').textContent = '🎁 ' + T('packTitle');
    document.getElementById('sendBtn').textContent = T('send');
  }

  /* ---- 開進一台新車 ---- */
  function spawnCar() {
    var idx = lvl.carIndex;
    var spot = D.spots[idx % D.spots.length];
    var count = COUNTS[idx] || 1;
    var keys = Object.keys(D.needs); shuffle(keys);
    var picked = keys.slice(0, count);
    lvl.car = { needs: picked, spot: spot, subtle: idx >= 4 };
    lvl.pack = []; lvl.notes = [];

    // 聚光：從右側「開進來」滑到車位
    positionSpot(spot.focus.x, spot.focus.y, true);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { positionSpot(spot.focus.x, spot.focus.y, false); });
    });
    Sound.arrive();

    // 佈線索：每個需求一個發亮點，車停妥後一顆顆亮起
    var clueLayer = document.getElementById('clueLayer'); clueLayer.innerHTML = '';
    picked.forEach(function (needId, i) {
      var need = D.needs[needId];
      var clue = need.clues[Math.floor(Math.random() * need.clues.length)];
      var ang = (i / Math.max(1, picked.length)) * Math.PI * 2 + Math.random() * 0.6;
      var rad = 0.04 + Math.random() * 0.025;
      var cfx = clamp(spot.focus.x + Math.cos(ang) * rad, 0.03, 0.97);
      var cfy = clamp(spot.focus.y + Math.sin(ang) * rad * 0.78, 0.06, 0.92);
      var el = document.createElement('div');
      el.className = 'clue enter' + (lvl.car.subtle ? ' subtle' : '');
      el.dataset.fx = cfx; el.dataset.fy = cfy;
      el.style.animationDelay = (0.55 + i * 0.14) + 's';
      el.textContent = clue.icon;
      var p = px(cfx, cfy); el.style.left = p.x + 'px'; el.style.top = p.y + 'px';
      el.addEventListener('click', function () { readClue(el, needId, clue); });
      clueLayer.appendChild(el);
      setTimeout(function () { el.classList.remove('enter'); }, (0.55 + i * 0.14) * 1000 + 520);
    });

    renderShelf(); renderNotes(); renderPack(); updateSend();
    toast('🚐 (' + (idx + 1) + '/' + CARS + ') ' + T('carIncoming'), null, 1600);
  }

  function readClue(el, needId, clue) {
    if (el.classList.contains('read')) return;
    el.classList.remove('enter');
    el.classList.add('read'); el.textContent = '✓';
    Sound.clue();
    if (lvl.notes.indexOf(needId) === -1) lvl.notes.push(needId);
    renderNotes();
    var need = D.needs[needId];
    toast(T('clueFound') + L(clue.read), T('needInferred') + L(need.label), 2300);
  }

  function renderNotes() {
    var box = document.getElementById('notes'); box.innerHTML = '';
    if (!lvl.notes.length) {
      var e = document.createElement('div'); e.className = 'note-empty';
      e.textContent = T('notesEmpty'); box.appendChild(e); return;
    }
    lvl.notes.forEach(function (nid) {
      var need = D.needs[nid];
      var n = document.createElement('div'); n.className = 'note';
      n.innerHTML = '<span>' + need.icon + '</span>' + L(need.label);
      box.appendChild(n);
    });
  }

  function renderShelf() {
    var shelf = document.getElementById('shelf'); shelf.innerHTML = '';
    D.supplies.forEach(function (s) {
      var inpack = lvl.pack.indexOf(s.id) !== -1;
      var it = document.createElement('div');
      it.className = 'item' + (s.distractor ? ' distract' : '') + (inpack ? ' inpack' : '');
      it.innerHTML = '<span class="em">' + s.icon + '</span>' + L(s.name);
      it.addEventListener('click', function () {
        if (lvl.pack.indexOf(s.id) !== -1) return;
        lvl.pack.push(s.id); Sound.pick();
        renderShelf(); renderPack(); updateSend();
      });
      shelf.appendChild(it);
    });
  }

  function renderPack() {
    var pack = document.getElementById('pack'); pack.innerHTML = '';
    if (!lvl.pack.length) {
      var e = document.createElement('div'); e.className = 'pack-empty';
      e.textContent = T('packEmpty'); pack.appendChild(e); return;
    }
    lvl.pack.forEach(function (sid) {
      var s = supplyById(sid);
      var p = document.createElement('div'); p.className = 'pin';
      p.innerHTML = '<span>' + s.icon + '</span>' + L(s.name) + '<span class="x">×</span>';
      p.querySelector('.x').addEventListener('click', function () {
        lvl.pack = lvl.pack.filter(function (x) { return x !== sid; });
        Sound.unpick(); renderShelf(); renderPack(); updateSend();
      });
      pack.appendChild(p);
    });
  }
  function updateSend() { document.getElementById('sendBtn').disabled = lvl.pack.length === 0; }

  /* ---- 送出關懷包 ---- */
  function sendPackage() {
    if (lvl.ended || !lvl.pack.length) return;
    var packNeeds = lvl.pack.map(function (sid) { return supplyById(sid).satisfies; });
    var covered = lvl.car.needs.every(function (n) { return packNeeds.indexOf(n) !== -1; });

    if (!covered) {
      Sound.soft();
      toast('🤍 ' + T('softMiss'), null, 2700);   // 軟失敗：溫柔提示，不扣分、不結束
      return;
    }
    // 成功：窗亮融入背景、暖意+1、小芽長、竹筒+1、幸福家園推進
    Sound.success();
    var wg = document.getElementById('wg' + (lvl.carIndex % D.spots.length));
    if (wg) wg.classList.add('lit');
    SAVE.warmth += 1; SAVE.bamboo += 1; SAVE.homeFu += 1;
    SAVE.sprout.growth += 1; SAVE.lit[D.id] = true; persist();
    Sound.grow();
    lvl.served += 1;
    document.getElementById('spotlight').style.opacity = 0;
    document.getElementById('spotRing').style.opacity = 0;
    document.getElementById('clueLayer').innerHTML = '';
    renderLvlHud();

    toast('✨ ' + T('sent'), L(nextWarmLine()), 2600);

    lvl.carIndex += 1;
    if (lvl.served >= CARS) setTimeout(endNight, 1800);
    else setTimeout(spawnCar, 1800);
  }
  function nextWarmLine() {
    var pool = D.warmLines;
    var avail = pool.filter(function (_, i) { return lvl.usedLines.indexOf(i) === -1; });
    if (!avail.length) { lvl.usedLines = []; avail = pool; }
    var pick = avail[Math.floor(Math.random() * avail.length)];
    lvl.usedLines.push(pool.indexOf(pick));
    return pick;
  }

  /* ---- 天色迴圈：金黃→冷藍夜，車窗漸亮，音樂低通收緊 ---- */
  function loop(now) {
    if (!lvl || lvl.ended) return;
    var timeP = (now - lvl.startT) / NIGHT_MS;
    var carP = lvl.served / CARS;
    var p = Math.min(1, Math.max(timeP, carP));
    lvl.progress = p;

    document.getElementById('skyWarm').style.opacity = (1 - p).toFixed(3);
    document.getElementById('darkLayer').style.opacity = (p * 0.92).toFixed(3);
    document.getElementById('coldLayer').style.opacity = (p * 0.62).toFixed(3);
    document.getElementById('vignette').style.opacity = (0.4 + p * 0.45).toFixed(3);
    document.getElementById('sceneImg').style.filter =
      'brightness(' + (1 - 0.55 * p).toFixed(3) + ') saturate(' + (1 - 0.2 * p).toFixed(3) + ')';
    D.spots.forEach(function (_, i) {
      var g = document.getElementById('wg' + i);
      if (g && !g.classList.contains('lit')) g.style.opacity = (0.08 + 0.5 * p).toFixed(3);
    });
    Sound.setMood(carP, p);

    if (timeP >= 1 && lvl.served < CARS) { endNight(); return; }
    requestAnimationFrame(loop);
  }

  /* ---- 溫柔收場 ---- */
  function endNight() {
    if (lvl.ended) return;
    lvl.ended = true; SAVE.lastHomes = lvl.served; persist();
    document.getElementById('endTitle').textContent = T('endTitle');
    document.getElementById('endLine').textContent = T('endLine');
    document.getElementById('endBig').textContent = lvl.served + ' / ' + CARS;
    document.getElementById('endHomes').textContent = T('endHomes');
    document.getElementById('endWarm').textContent = T('endWarm');
    document.getElementById('endSprout').textContent =
      sproutIcon() + ' ' + (SAVE.sprout.name || '') + ' · ' + L({ zh: '又長了一截', en: 'grew a little more', es: 'creció un poco más' });
    document.getElementById('againBtn').textContent = T('againNight');
    document.getElementById('endHubBtn').textContent = T('toHub');
    show('ending');
  }

  /* ---------- 小工具 ---------- */
  function supplyById(id) { for (var i = 0; i < D.supplies.length; i++) if (D.supplies[i].id === id) return D.supplies[i]; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  var toastT = null;
  function toast(line1, line2, ms) {
    var el = document.getElementById('toast');
    el.innerHTML = line1 + (line2 ? '<span class="warmline">' + line2 + '</span>' : '');
    el.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(function () { el.classList.remove('show'); }, ms || 2000);
  }

  /* ---------- 語言切換時重繪 ---------- */
  window.onLangChange = function () {
    document.querySelectorAll('.lang button').forEach(function (b) { b.classList.toggle('on', b.dataset.l === window.LANG); });
    if (!document.getElementById('opening').classList.contains('hidden')) renderOpening();
    if (!document.getElementById('hub').classList.contains('hidden')) renderHub();
    if (document.getElementById('level').style.display === 'flex' && lvl) {
      renderLvlHud(); renderPanelLabels(); renderNotes(); renderShelf(); renderPack(); updateSend();
    }
    if (!document.getElementById('ending').classList.contains('hidden')) {
      document.getElementById('endTitle').textContent = T('endTitle');
      document.getElementById('endLine').textContent = T('endLine');
      document.getElementById('endHomes').textContent = T('endHomes');
      document.getElementById('endWarm').textContent = T('endWarm');
      document.getElementById('againBtn').textContent = T('againNight');
      document.getElementById('endHubBtn').textContent = T('toHub');
    }
  };

  /* ===================================================================
     啟動 / 事件綁定
     =================================================================== */
  function wire() {
    document.querySelectorAll('.lang button').forEach(function (b) {
      b.addEventListener('click', function () { window.setLang(b.dataset.l); });
      b.classList.toggle('on', b.dataset.l === window.LANG);
    });
    var mute = document.getElementById('mute');
    mute.addEventListener('click', function () {
      var m = !Sound.isMuted(); Sound.setMuted(m); mute.textContent = m ? '🔇' : '🔊';
    });
    document.getElementById('beginBtn').addEventListener('click', function () {
      var v = document.getElementById('sproutName').value.trim();
      SAVE.sprout.name = v || T('namePlaceholder'); persist();
      Sound.startMusic(); show('hub'); renderHub();
    });
    document.getElementById('sendBtn').addEventListener('click', sendPackage);
    document.getElementById('againBtn').addEventListener('click', startLevel);
    document.getElementById('endHubBtn').addEventListener('click', function () { show('hub'); renderHub(); });

    // 底部面板收合
    document.getElementById('panelTab').addEventListener('click', function () {
      document.getElementById('panel').classList.toggle('collapsed');
      setTimeout(layout, 380);
    });

    // 版面：場景隨舞台大小重新對位
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () { if (lvl) layout(); });
      ro.observe(document.getElementById('stage'));
    }
    window.addEventListener('resize', function () { if (lvl) layout(); });
    window.addEventListener('orientationchange', function () { setTimeout(function () { if (lvl) layout(); }, 250); });

    renderOpening(); show('opening');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();
})();

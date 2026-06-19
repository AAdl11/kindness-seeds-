/* =====================================================================
   善的種子 · 關懷之夜 / Care at Dusk — 主引擎
   依賴：i18n.js, audio.js, data/level1.js
   核心循環：車開進來 → 讀懂車上線索 → 親手配關懷包 → 送出 → 窗亮融入背景
            → 下一台 → 天黑溫柔收場
   無分數 / 無排名 / 無懲罰；天色倒數只是黃昏氛圍，時間到=溫柔收場。
   ===================================================================== */
(function () {
  'use strict';

  /* ---------- 持久化：以「玩家名字」為鑰匙；同名接續、絕不清空 ---------- */
  var MEM = {};
  var STORE_KEY = 'kindness-seeds-store';   // { currentPlayer, saves:{ name:SAVE } }
  var OLD_KEY = 'kindness-seeds-save';       // 舊版單一存檔（要遷移過來）
  var C = window.CONFIG;

  function newSave(name) {
    return {
      sprout: { name: name || '', growth: 0 },
      warmth: 0, bamboo: 0, homeFu: 0, kindnessMin: 0, coins: 0, pours: 0,
      milestones: {}, bloomPour: {}, lit: {}, lastHomes: 0
    };
  }
  function normalize(s) {            // 補欄位，老玩家不掉進度
    var d = newSave(s && s.sprout && s.sprout.name || '');
    s = s || d;
    s.sprout = s.sprout || d.sprout;
    if (s.sprout.growth == null) s.sprout.growth = 0;
    ['warmth', 'bamboo', 'homeFu', 'kindnessMin', 'coins', 'pours', 'lastHomes'].forEach(function (k) { if (s[k] == null) s[k] = 0; });
    ['milestones', 'bloomPour', 'lit'].forEach(function (k) { if (s[k] == null) s[k] = {}; });
    return s;
  }
  function rawGet(k) { try { var r = localStorage.getItem(k); if (r) return r; } catch (e) {} return MEM[k] || null; }
  function rawSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { MEM[k] = v; } }

  function migrate() {
    var raw = rawGet(STORE_KEY);
    if (raw) { try { return JSON.parse(raw); } catch (e) {} }
    var store = { currentPlayer: null, saves: {} };
    var oldRaw = rawGet(OLD_KEY);
    if (oldRaw) {
      try {
        var old = normalize(JSON.parse(oldRaw));
        var nm = old.sprout.name || '小芽';
        old.sprout.name = nm;
        store.saves[nm] = old; store.currentPlayer = nm;   // 舊存檔遷到目前名字底下
      } catch (e) {}
    }
    rawSet(STORE_KEY, JSON.stringify(store));
    return store;
  }

  var STORE = migrate();
  var SAVE = (STORE.currentPlayer && STORE.saves[STORE.currentPlayer])
    ? normalize(STORE.saves[STORE.currentPlayer]) : newSave('');

  function persist() {
    if (SAVE.sprout.name) {                 // 有名字才寫進該名字的世界
      STORE.saves[SAVE.sprout.name] = SAVE;
      STORE.currentPlayer = SAVE.sprout.name;
    }
    rawSet(STORE_KEY, JSON.stringify(STORE));
  }
  function hasSave(name) { return !!(name && STORE.saves[name]); }
  function loadPlayer(name) {               // 取名：同名接續、新名字新世界
    name = (name || '').trim() || '小芽';
    SAVE = hasSave(name) ? normalize(STORE.saves[name]) : newSave(name);
    STORE.currentPlayer = name; persist();
  }
  function restartName(name) {              // 只清這個名字的世界（需二次確認）
    SAVE = newSave(name); STORE.currentPlayer = name; persist();
  }

  /* ---------- 小芽 = 看得見地長大的盆栽（種子→發芽→小苗→開花→小樹→大樹） ---------- */
  function sproutStage(g) {
    var th = C.sprout.thresholds, i = th.length - 1;
    for (; i >= 0; i--) if (g >= th[i]) return i;
    return 0;
  }
  /* 依「累積照顧的家數」growth 決定枝葉與花瓣多寡；px = 顯示大小。
     用 SVG 漸層/柔光/陰影做得更精緻（不新增美術素材）。 */
  var _plantUID = 0;
  function plantSVG(growth, px) {
    growth = Math.max(0, growth | 0);
    var leaves = growth <= 0 ? 0 : Math.min(2 + growth, 14);
    var flowers = growth < 5 ? 0 : Math.min(Math.floor((growth - 3) / 2), 8);
    var stemTop = growth <= 0 ? 78 : Math.max(16, 70 - Math.min(growth, 14) * 3.6);
    var W = 100, H = 112, soilY = 92, baseY = soilY - 3, u = 'p' + (++_plantUID), s = '';
    // 漸層/柔光定義
    s += '<defs>' +
      '<radialGradient id="' + u + 'glow" cx="50%" cy="42%" r="60%"><stop offset="0%" stop-color="#fff7d6" stop-opacity=".55"/><stop offset="100%" stop-color="#fff7d6" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="' + u + 'pot" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#e08a52"/><stop offset="100%" stop-color="#a85a30"/></linearGradient>' +
      '<linearGradient id="' + u + 'leaf" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#7fd07a"/><stop offset="100%" stop-color="#3f9740"/></linearGradient>' +
      '<radialGradient id="' + u + 'pet" cx="40%" cy="35%" r="70%"><stop offset="0%" stop-color="#ffd0e4"/><stop offset="100%" stop-color="#ff8fbb"/></radialGradient>' +
      '</defs>';
    // 柔光 + 地面陰影
    s += '<ellipse cx="50" cy="' + (H - 2) + '" rx="26" ry="4" fill="rgba(0,0,0,.18)"/>';
    s += '<rect x="0" y="0" width="100" height="112" fill="url(#' + u + 'glow)"/>';
    // 盆
    s += '<path d="M30 ' + soilY + ' L70 ' + soilY + ' L63 109 L37 109 Z" fill="url(#' + u + 'pot)"/>';
    s += '<rect x="26" y="' + (soilY - 7) + '" width="48" height="9" rx="3.5" fill="#b5673c"/>';
    s += '<rect x="26" y="' + (soilY - 7) + '" width="48" height="3" rx="1.5" fill="rgba(255,255,255,.25)"/>';
    s += '<ellipse cx="50" cy="' + (soilY - 2) + '" rx="20" ry="4" fill="#5e4128"/>';
    if (growth <= 0) {
      s += '<path d="M50 ' + (soilY - 2) + ' q-7 -9 0 -16 q7 7 0 16" fill="url(#' + u + 'leaf)"/>';
    } else {
      s += '<path d="M50 ' + baseY + ' C 47 ' + (baseY - 18) + ', 53 ' + (stemTop + 18) + ', 50 ' + stemTop + '" stroke="#4a9a3d" stroke-width="3.4" fill="none" stroke-linecap="round"/>';
      for (var i = 0; i < leaves; i++) {
        var frac = (i + 1) / (leaves + 1);
        var y = baseY - frac * (baseY - stemTop);
        var side = (i % 2 === 0) ? -1 : 1;
        var rot = side * 38 - side * (frac * 8);
        var ll = 7.5 + (1 - frac) * 4.5;
        s += '<g transform="translate(50,' + y.toFixed(1) + ') rotate(' + rot + ')">' +
          '<ellipse cx="' + (side * ll * 0.6).toFixed(1) + '" cy="0" rx="' + ll.toFixed(1) + '" ry="' + (ll * 0.5).toFixed(1) + '" fill="url(#' + u + 'leaf)"/>' +
          '<path d="M0 0 L' + (side * ll * 1.1).toFixed(1) + ' 0" stroke="rgba(255,255,255,.35)" stroke-width="0.6"/></g>';
      }
      for (var f = 0; f < flowers; f++) {
        var off = (f - (flowers - 1) / 2) * 9;
        var fx = 50 + off, fy = stemTop + 1 + Math.abs(off) * 0.22, pc = '';
        for (var p = 0; p < 5; p++) {
          pc += '<ellipse cx="3.7" cy="0" rx="3.5" ry="2.3" fill="url(#' + u + 'pet)" transform="rotate(' + (p * 72) + ')"/>';
        }
        s += '<g transform="translate(' + fx.toFixed(1) + ',' + fy.toFixed(1) + ')">' + pc + '<circle r="2.2" fill="#ffd54a"/><circle r="2.2" fill="none" stroke="rgba(255,255,255,.5)" stroke-width=".5"/></g>';
      }
    }
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + px + '" height="' + (px * H / W).toFixed(1) + '" xmlns="http://www.w3.org/2000/svg" style="display:block">' + s + '</svg>';
  }
  /* HUD 用的小芽膠囊（盆栽 + 名字） */
  function sproutChip() {
    var c = document.createElement('div'); c.className = 'chip sprout-chip';
    c.innerHTML = '<span class="potico">' + plantSVG(SAVE.sprout.growth, 26) + '</span>' +
      '<span>' + (SAVE.sprout.name || T('sproutLabel')) + '</span>';
    return c;
  }

  /* ---------- 活動節點（資料驅動：散落在白天地圖上的發光圖釘） ----------
     每個節點帶 fu（落在地圖哪一區自然呈現三福）＋ pos{x,y}（地圖比例座標）。
     之後加關卡只要在這裡加一個物件、給座標即可，支援超過 9 關。 */
  var ACTIVITIES = [
    // 幸福家園（住宅區左側＋食物菜圃）
    { id: 'rv_park_dusk', fu: 'home', state: 'play', stars: 2, pos: { x: 0.22, y: 0.62 },
      nm: { zh: '關懷之夜', en: 'Care at Dusk', es: 'Cuidado al Atardecer' },
      ds: { zh: 'RV Park 關懷 · 入門', en: 'RV Park outreach · intro', es: 'RV Park · inicio' } },
    { id: 'foodshare', fu: 'home', state: 'soon', stars: 1, pos: { x: 0.40, y: 0.67 },
      nm: { zh: '食物發放', en: 'Food share', es: 'Reparto de alimentos' },
      ds: { zh: '2006 一把生米', en: '2006, a handful of rice', es: '2006, un puñado de arroz' } },
    { id: 'blankets', fu: 'home', state: 'soon', stars: 1, pos: { x: 0.21, y: 0.40 },
      nm: { zh: '冬季毛毯', en: 'Winter blankets', es: 'Mantas de invierno' },
      ds: { zh: '海風天涼', en: 'Against the cold wind', es: 'Contra el viento frío' } },
    // 幸福校園（中央校舍）
    { id: 'tutoring', fu: 'campus', state: 'soon', stars: 2, pos: { x: 0.49, y: 0.39 },
      nm: { zh: '課後輔導', en: 'After-school tutoring', es: 'Tutoría' },
      ds: { zh: '幸福校園 · Bret Harte', en: 'Blessed Campus · Bret Harte', es: 'Campus · Bret Harte' } },
    { id: 'attendance', fu: 'campus', state: 'soon', stars: 1, pos: { x: 0.59, y: 0.45 },
      nm: { zh: '全勤獎', en: 'Perfect attendance', es: 'Asistencia perfecta' },
      ds: { zh: '為堅持鼓掌', en: 'Cheer every child', es: 'Aplausos para cada niño' } },
    { id: 'cooking', fu: 'campus', state: 'soon', stars: 2, pos: { x: 0.40, y: 0.46 },
      nm: { zh: '素食烹飪班', en: 'Veggie cooking class', es: 'Clase de cocina vegetariana' },
      ds: { zh: '照順序抓時機', en: 'Timing & order', es: 'Orden y tiempo' } },
    { id: 'graduation', fu: 'campus', state: 'play', stars: 1, pos: { x: 0.50, y: 0.52 },
      nm: { zh: '畢業感恩', en: 'Graduation thanks', es: 'Gracias de graduación' },
      ds: { zh: '幸福校園 · Bret Harte 姊妹校', en: 'Blessed Campus · Bret Harte', es: 'Campus · Bret Harte' } },
    // 幸福社區（右側／散布）
    { id: 'clinic', fu: 'community', state: 'soon', stars: 3, pos: { x: 0.67, y: 0.54 },
      nm: { zh: '義診', en: 'Free clinic', es: 'Clínica gratuita' },
      ds: { zh: '醫師週末義診 @ AG', en: 'Weekend clinic @ AG', es: 'Clínica de fin de semana @ AG' } },
    { id: 'eco', fu: 'community', state: 'play', stars: 1, pos: { x: 0.27, y: 0.33 },
      nm: { zh: '環保小尖兵', en: 'Eco vanguard', es: 'Vanguardia ecológica' },
      ds: { zh: '街角整理回乾淨', en: 'A corner made bright', es: 'Una esquina iluminada' } },
    { id: 'hotmeal', fu: 'community', state: 'soon', stars: 2, pos: { x: 0.73, y: 0.37 },
      nm: { zh: '遊民熱食', en: 'Hot meals', es: 'Comidas calientes' },
      ds: { zh: '社區活動中心', en: 'Community center', es: 'Centro comunitario' } }
  ];
  var TREE_POS = { x: 0.55, y: 0.82 };   // 中央總成長樹（base 落點，往上長）

  /* ---------- 螢幕切換 ---------- */
  function show(id) {
    ['opening', 'hub', 'level', 'level2', 'level3', 'ending'].forEach(function (s) {
      var el = document.getElementById(s); if (!el) return;
      if (s === 'level' || s === 'level2' || s === 'level3') el.style.display = (s === id) ? 'block' : 'none';
      else el.classList.toggle('hidden', s !== id);
    });
    document.body.className = 'screen-' + id;
    var g = (id === 'hub' || id === 'level' || id === 'level2' || id === 'level3');  // 永久 HUD / 竹筒 / 金圈米芽
    ['hudTime', 'hudCoins', 'bamboo', 'sproutRing'].forEach(function (eid) {
      document.getElementById(eid).classList.toggle('hidden', !g);
    });
    if (g) refreshGlobals();
  }

  /* ===================================================================
     開場
     =================================================================== */
  var opSwitching = false;             // 在門邊「換一個名字」時 = true
  function renderOpening() {
    document.getElementById('opKicker').textContent = T('title');
    document.getElementById('opInvite').innerHTML = T('doorInvite');
    document.getElementById('beginTxt').textContent = T('enterDoor');
    var nameBlock = document.getElementById('opName');
    var welcome = document.getElementById('opWelcome');
    var hint = document.getElementById('opHint');
    var link = document.getElementById('switchName');
    var returning = SAVE.sprout.name && !opSwitching;
    if (returning) {                       // 回訪：歡迎回來，<名字> · 點一下繼續
      nameBlock.classList.add('hidden');
      welcome.classList.remove('hidden');
      welcome.textContent = T('welcomeBack').replace('{name}', SAVE.sprout.name);
      hint.textContent = T('doorNote');
      link.classList.remove('hidden'); link.textContent = T('switchName');
    } else {                               // 取名（第一次或換名字）
      welcome.classList.add('hidden');
      nameBlock.classList.remove('hidden');
      document.getElementById('opNameLabel').textContent = T('nameSprout');
      var inp = document.getElementById('sproutName');
      inp.placeholder = T('namePlaceholder');
      if (opSwitching) inp.value = '';
      hint.textContent = T('nameHint');
      link.classList.add('hidden');
    }
  }

  /* ===================================================================
     HUB / 白天獵人角地圖（節點散落在地圖上；完成後那一區開花變美）
     =================================================================== */
  var hubRect = { ox: 0, oy: 0, rw: 1, rh: 1, s: 1 };
  function chip(txt) { var c = document.createElement('div'); c.className = 'chip'; c.textContent = txt; return c; }
  function stars(n) { return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n); }
  function completedCount() { return ACTIVITIES.filter(function (a) { return SAVE.lit[a.id]; }).length; }

  function renderHub() {
    document.getElementById('hubTitle').textContent = T('hubTitle');
    document.getElementById('hubSub').textContent = T('subtitle');
    document.getElementById('miSwitch').textContent = T('switchName');
    document.getElementById('miReplay').textContent = T('replayMusic');
    document.getElementById('miRestart').textContent = T('restartWorld');

    // 節點
    var pinLayer = document.getElementById('pinLayer'); pinLayer.innerHTML = '';
    ACTIVITIES.forEach(function (a) {
      var done = !!SAVE.lit[a.id];
      var p = document.createElement('div');
      p.className = 'pinnode ' + (a.state === 'play' ? 'play' : 'soon') + (done ? ' done' : '');
      p.dataset.id = a.id;
      if (a.state === 'play') {
        p.innerHTML = '<span class="dot"></span>' +
          '<span class="pinlabel"><b>' + L(a.nm) + '</b><i>' + stars(a.stars) + '</i></span>';
        (function (aid) { p.addEventListener('pointerup', function () { startActivity(aid); }); })(a.id);
      } else {
        p.innerHTML = '<span class="dot"></span>';
        p.title = L(a.nm) + ' · ' + T('soon');
      }
      pinLayer.appendChild(p);
    });

    // 開花補丁：完成的關 + 倒竹筒推進的里程碑那一區
    var bloom = document.getElementById('bloomLayer'); bloom.innerHTML = '';
    ACTIVITIES.forEach(function (a) {
      if (!SAVE.lit[a.id]) return;
      var b = document.createElement('div'); b.className = 'bloom'; b.dataset.kind = 'act'; b.dataset.id = a.id;
      bloom.appendChild(b);
    });
    C.milestones.forEach(function (ms) {
      if (!SAVE.bloomPour[ms.id]) return;
      var b = document.createElement('div'); b.className = 'bloom'; b.dataset.kind = 'ms'; b.dataset.id = ms.id;
      bloom.appendChild(b);
    });

    renderMilestones();
    applyHubMeters();
    hubLayout();
    refreshGlobals();
  }

  /* 里程碑進度條：sudan 只由「倒竹筒」推進；sisterSchool 只由關3 推進。
     點任一條都顯示它代表的真實善行（簡短說明）；可倒的（竹筒滿）才會真的倒入。 */
  function renderMilestones() {
    var collapsed = document.getElementById('milestones').classList.contains('collapsed');
    document.getElementById('msHandle').textContent = '🎍 ' + T('milestonesLabel') + ' ' + (collapsed ? '▴' : '▾');
    var box = document.getElementById('msBody'); box.innerHTML = '';
    C.milestones.forEach(function (ms) {
      var prog = SAVE.milestones[ms.id] || 0;
      var pourable = (ms.source === 'pour') && SAVE.bamboo >= C.bamboo.capacity;
      var row = document.createElement('div'); row.className = 'ms' + (pourable ? ' canpour' : '');
      row.innerHTML = '<div class="ms-name">' + L(ms.name) + ' <i>' + Math.min(prog, ms.target) + '/' + ms.target + '</i></div>' +
        '<div class="ms-bar"><span style="width:' + Math.min(100, prog / ms.target * 100).toFixed(0) + '%"></span></div>' +
        '<div class="ms-desc">' + L(ms.desc) + '</div>';
      row.addEventListener('pointerup', function () {
        if (pourable) pourInto(ms); else flash('ℹ️ ' + L(ms.desc));   // 點：說明這條代表什麼
      });
      box.appendChild(row);
    });
  }
  function pourInto(ms) {                       // 只有「倒竹筒」來源的里程碑（南蘇丹）
    if (ms.source !== 'pour' || SAVE.bamboo < C.bamboo.capacity) return;
    SAVE.bamboo -= C.bamboo.capacity;
    SAVE.pours += 1;
    SAVE.milestones[ms.id] = Math.min(ms.target, (SAVE.milestones[ms.id] || 0) + 1);
    SAVE.bloomPour[ms.id] = true;
    persist();
    Sound.pour();
    flash('🎍🌸 ' + T('poured'));
    renderHub();
  }
  /* 關3 送一封感恩 → 一人一信里程碑 +1（不由倒竹筒推進） */
  function advanceLetters() {
    var ms = C.milestones.filter(function (m) { return m.id === C.level3.milestone; })[0];
    if (!ms) return;
    var v = Math.min(ms.target, (SAVE.milestones[ms.id] || 0) + 1);
    SAVE.milestones[ms.id] = v;
    if (v >= ms.target) SAVE.bloomPour[ms.id] = true;   // 達標 → 那一區開花
    persist();
  }

  /* 陽光・空氣・水 → 整體榮景（敘事：黯淡 → 溫暖 → 珍珠柔光） */
  function meters() {
    var m = C.meters;
    var sun = Math.min(1, SAVE.kindnessMin / m.sunPerMinuteFull);
    var water = Math.min(1, SAVE.pours / m.waterPerPourFull);
    var air = Math.min(1, m.airBase + (SAVE.lit['eco'] ? m.airFromEco : 0));
    var completion = completedCount() / ACTIVITIES.length;
    var radiance = Math.min(1, 0.28 * sun + 0.22 * water + 0.12 * air + 0.28 * completion + 0.10 * Math.min(1, SAVE.sprout.growth / 16));
    return { sun: sun, water: water, air: air, completion: completion, radiance: radiance };
  }
  function applyHubMeters() {
    var M = meters();
    document.getElementById('hubMap').style.filter =
      'brightness(' + (0.78 + 0.34 * M.radiance).toFixed(3) + ') saturate(' + (0.6 + 0.6 * M.radiance).toFixed(3) + ')';
    document.getElementById('dawnVeil').style.opacity = ((1 - M.radiance) * 0.55).toFixed(3);
    var pl = document.getElementById('prosperityLayer');
    pl.style.setProperty('--prosper', M.sun.toFixed(3));
    pl.classList.toggle('beams', M.sun >= 0.6);
    pl.classList.toggle('rainbow', M.water >= 1);
    document.getElementById('greenLayer').style.opacity = (0.12 + 0.5 * Math.max(M.water, M.completion)).toFixed(3);
    document.getElementById('airLayer').style.opacity = ((1 - M.air) * 0.5).toFixed(3);
    document.getElementById('pearlLayer').style.opacity = (M.radiance >= 0.7 ? (M.radiance - 0.7) / 0.3 * 0.55 : 0).toFixed(3);
  }

  /* ===== 永久玻璃 HUD / 竹筒 / 金圈米芽 ===== */
  function refreshGlobals() {
    document.getElementById('hudTime').innerHTML = '☀️ <b>' + SAVE.kindnessMin + '</b> ' + T('minUnit');
    document.getElementById('hudCoins').innerHTML = '🪙 <b>' + SAVE.coins + '</b> ' + T('coinUnit');
    var cap = C.bamboo.capacity;
    document.getElementById('bambooCount').textContent = Math.min(SAVE.bamboo, cap) + '/' + cap;
    document.getElementById('bambooFill').style.height = Math.min(100, SAVE.bamboo / cap * 100).toFixed(0) + '%';
    var pour = document.getElementById('pourBtn');
    pour.textContent = T('pour');
    pour.classList.toggle('hidden', SAVE.bamboo < cap);
    document.getElementById('sproutPlant').innerHTML = plantSVG(SAVE.sprout.growth, 54);
    document.getElementById('sproutStageName').textContent =
      (SAVE.sprout.name ? SAVE.sprout.name + ' · ' : '') + stageName(SAVE.sprout.growth);
  }

  /* 一道光點/銅板從車飛到金圈米芽 / 竹筒 */
  function flyTo(targetId, fromX, fromY, cls, cb) {
    var t = document.getElementById(targetId);
    if (!t) { if (cb) cb(); return; }
    var r = t.getBoundingClientRect(), tx = r.left + r.width / 2, ty = r.top + r.height / 2;
    var d = document.createElement('div'); d.className = cls;
    d.style.left = fromX + 'px'; d.style.top = fromY + 'px';
    document.body.appendChild(d);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        d.style.transform = 'translate(' + (tx - fromX) + 'px,' + (ty - fromY) + 'px) scale(.5)';
        d.style.opacity = '0.25';
      });
    });
    setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); if (cb) cb(); }, 720);
  }
  function pulseRing(carIdx) {
    var ring = document.getElementById('sproutRing');
    ring.classList.remove('grow', 'bloom'); void ring.offsetWidth;
    ring.classList.add(carIdx >= 2 ? 'bloom' : 'grow');
    var r = ring.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, { n: carIdx >= 2 ? 34 : 16, spread: 70, life: 950, size: carIdx >= 2 ? 11 : 8 });
  }
  function flash(msg) {
    var f = document.createElement('div'); f.className = 'flash'; f.textContent = msg;
    document.body.appendChild(f);
    setTimeout(function () { f.classList.add('show'); }, 12);
    setTimeout(function () { f.classList.remove('show'); }, 1800);
    setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, 2200);
  }
  function renderHelp() {
    document.getElementById('helpTitle').textContent = T('helpTitle');
    document.getElementById('helpClose').textContent = T('helpClose');
    var ul = document.getElementById('helpBody'); ul.innerHTML = '';
    (T('helpLines') || []).forEach(function (line) {
      var li = document.createElement('li'); li.textContent = line; ul.appendChild(li);
    });
  }

  /* 地圖 full-bleed cover（max）；節點在中央安全區，cover 裁切也看得到 */
  function hubFit() {
    var st = document.getElementById('mapStage');
    var W = st.clientWidth, H = st.clientHeight, s = Math.max(W / IW, H / IH);
    var rw = IW * s, rh = IH * s;
    hubRect = { ox: (W - rw) / 2, oy: (H - rh) / 2, rw: rw, rh: rh, s: s };
  }
  function hubPx(fx, fy) { return { x: hubRect.ox + fx * hubRect.rw, y: hubRect.oy + fy * hubRect.rh }; }

  function hubLayout() {
    if (document.getElementById('hub').classList.contains('hidden')) return;
    hubFit();
    // 節點
    ACTIVITIES.forEach(function (a) {
      var el = document.querySelector('#pinLayer .pinnode[data-id="' + a.id + '"]');
      if (!el) return; var p = hubPx(a.pos.x, a.pos.y);
      el.style.left = p.x + 'px'; el.style.top = p.y + 'px';
    });
    // bloom（關卡完成 + 里程碑那一區）
    document.querySelectorAll('#bloomLayer .bloom').forEach(function (b) {
      var pos = null;
      if (b.dataset.kind === 'ms') {
        var ms = C.milestones.filter(function (x) { return x.id === b.dataset.id; })[0]; if (ms) pos = ms.bloom;
      } else {
        var a = ACTIVITIES.filter(function (x) { return x.id === b.dataset.id; })[0]; if (a) pos = a.pos;
      }
      if (!pos) return;
      var p = hubPx(pos.x, pos.y); var sz = hubRect.rw * 0.16;
      b.style.left = p.x + 'px'; b.style.top = p.y + 'px';
      b.style.width = sz + 'px'; b.style.height = sz + 'px';
    });
    // 中央總成長樹（跨關累積：小芽 → 大樹）
    var tree = document.getElementById('growthTree');
    var tp = hubPx(TREE_POS.x, TREE_POS.y);
    var treePx = (90 + Math.min(SAVE.sprout.growth, 24) * 7) * hubRect.s * 1.2;
    tree.style.left = tp.x + 'px'; tree.style.top = tp.y + 'px';
    tree.innerHTML = plantSVG(SAVE.sprout.growth, treePx);
  }

  /* ===================================================================
     關卡 · 關懷之夜
     =================================================================== */
  var D = window.LEVEL1;
  var IW = 1376, IH = 768;            // 背景原始尺寸
  var CARS = 3;                       // 三台車：天亮 → 黃昏 → 天黑
  var COUNTS = [2, 2, 3];             // 每台讀 2–3 個需要
  var STAGE_BASE = [0.04, 0.42, 0.80]; // 三台對應的天色起點（亮/昏/暗）
  var STAGE_SPAN = [0.40, 0.40, 0.20]; // 一台車內天色再往下壓的幅度（時間壓力）
  var CAR_CREEP_MS = 44000;           // 一台車內天色爬完這段時間
  var NIGHT_MS = 150000;              // 強制收場上限（約 90–120 秒玩完，這是保險）
  var MIN_PER_HOME = 10;              // 善的時數：每照顧一家 +10 分鐘
  var rect = { ox: 0, oy: 0, rw: 1, rh: 1, s: 1 };
  var lvl = null;

  function startLevel() {
    lvl = {
      carIndex: 0, served: 0, car: null,
      pack: [], notes: [],
      startT: performance.now(), progress: 0, ended: false, usedLines: []
    };
    Sound.playScene('level');                        // 換關卡音樂
    show('level');
    buildWinGlows();
    renderLvlHud();
    renderPanelLabels();
    layout();
    // 開場先把面板展開
    document.getElementById('panel').classList.remove('collapsed');
    // 「開始這一夜」的夜晚字眼，進關卡時才出現
    toast('🌇 ' + T('begin'), L(C.level1.how), 4200);   // 怎麼玩＋會得到什麼
    setTimeout(spawnCar, 1300);
    requestAnimationFrame(loop);
  }

  /* ---- 座標：背景 full-bleed cover（max），線索精準對應到車身（節點在中央安全區） ---- */
  function computeRect() {
    var stage = document.getElementById('stage');
    var W = stage.clientWidth, H = stage.clientHeight;
    var s = Math.max(W / IW, H / IH);          // cover
    var rw = IW * s, rh = IH * s;
    rect = { ox: (W - rw) / 2, oy: (H - rh) / 2, rw: rw, rh: rh, s: s };
  }
  function px(fx, fy) { return { x: rect.ox + fx * rect.rw, y: rect.oy + fy * rect.rh }; }

  function layout() {
    computeRect();
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
    hud.appendChild(chip('🚐 ' + lvl.served + '/' + CARS));
    var leave = document.createElement('button');
    leave.id = 'leaveBtn'; leave.textContent = T('toHub');
    leave.addEventListener('click', function () { lvl.ended = true; Sound.playScene('hub'); show('hub'); renderHub(); });
    hud.appendChild(leave);
  }

  function renderPanelLabels() {
    document.getElementById('notesH').innerHTML = '📝 ' + T('notesTitle');
    document.getElementById('shelfH').textContent = '🧺 ' + T('shelfTitle');
    document.getElementById('packH').textContent = '🎁 ' + T('packTitle');
    document.getElementById('sendBtn').textContent = T('send');
  }

  /* ---- 衝進來特效：大燈閃光 + 塵土 ---- */
  function chargeIn(fx, fy) {
    var stage = document.getElementById('stage');
    var p = px(fx, fy);
    var hl = document.createElement('div'); hl.className = 'headlight';
    hl.style.left = p.x + 'px'; hl.style.top = p.y + 'px';
    hl.style.width = (rect.rw * 0.5) + 'px'; hl.style.height = (rect.rw * 0.5) + 'px';
    stage.appendChild(hl);
    setTimeout(function () { if (hl.parentNode) hl.parentNode.removeChild(hl); }, 760);
    burst(p.x, p.y + rect.rw * 0.045, { n: 10, color: 'rgba(196,160,110,', spread: rect.rw * 0.17, dy: rect.rw * 0.015, life: 720, size: 7 });
  }

  /* ---- 粒子閃光（點線索/配對成功的爽感回饋） ---- */
  function burst(x, y, o) {
    o = o || {}; var host = document.body;     // 固定定位粒子，任何畫面都看得到
    var n = o.n || 12, spread = o.spread || 90, color = o.color || 'rgba(255,210,110,',
      life = o.life || 700, size = o.size || 8;
    for (var i = 0; i < n; i++) {
      var s = document.createElement('div'); s.className = 'spark';
      var ang = Math.random() * Math.PI * 2, dist = spread * (0.4 + Math.random() * 0.6);
      var sz = (size * (0.6 + Math.random() * 0.8)).toFixed(1);
      s.style.left = x + 'px'; s.style.top = y + 'px';
      s.style.width = sz + 'px'; s.style.height = sz + 'px';
      s.style.background = 'radial-gradient(circle,#fff 5%,' + color + '.95) 45%,' + color + '0) 80%)';
      s.style.setProperty('--dx', (Math.cos(ang) * dist).toFixed(1) + 'px');
      s.style.setProperty('--dy', (Math.sin(ang) * dist - (o.dy || 0)).toFixed(1) + 'px');
      s.style.animationDuration = life + 'ms';
      host.appendChild(s);
      (function (el) { setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, life + 60); })(s);
    }
  }

  /* ---- 一台車「衝進」畫面（大燈、塵土、動感） ---- */
  function spawnCar() {
    var idx = lvl.carIndex;
    var spot = D.spots[idx % D.spots.length];
    var count = COUNTS[idx] || 2;
    var keys = Object.keys(D.needs); shuffle(keys);
    var picked = keys.slice(0, count);
    lvl.car = { needs: picked, spot: spot, subtle: idx >= 2 };  // 第3台（天黑）線索更隱晦
    lvl.pack = []; lvl.notes = [];
    lvl.carStartT = performance.now();                          // 這台車的天色計時起點

    // 聚光：從右側「衝進來」滑到車位（更快、更有動感）
    positionSpot(spot.focus.x, spot.focus.y, true);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { positionSpot(spot.focus.x, spot.focus.y, false); });
    });
    chargeIn(spot.focus.x, spot.focus.y);                        // 大燈閃 + 塵土
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
    burst(parseFloat(el.style.left), parseFloat(el.style.top), { n: 9, spread: rect.rw * 0.07, life: 600, size: 7 });
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
    // 成功：窗亮融入背景；一階階堆上去(crescendo)
    var idx = lvl.carIndex;
    Sound.success(idx);                            // 越後面的車，音越高、climax 越大
    var wg = document.getElementById('wg' + (idx % D.spots.length));
    if (wg) wg.classList.add('lit');
    var wp = px(lvl.car.spot.window.x, lvl.car.spot.window.y);
    burst(wp.x, wp.y, { n: 16 + idx * 8, spread: rect.rw * (0.12 + idx * 0.03), life: 820, size: 9 });
    // 永久累積（永不歸零）：善的時數 + 銅板（投進竹筒）+ 米芽長一階
    SAVE.warmth += 1; SAVE.homeFu += 1;
    SAVE.kindnessMin += C.perHome.minutes;
    SAVE.coins += C.perHome.coins;
    SAVE.bamboo += C.perHome.coins;
    SAVE.sprout.growth += C.perHome.growth;
    SAVE.lit[D.id] = true; persist();
    Sound.grow();
    // 一道光點飛進金圈米芽 → 金圈發光、米芽長一階且留住（第3台綻放）
    flyTo('sproutRing', wp.x, wp.y, 'flydot', function () { refreshGlobals(); pulseRing(idx); });
    // 一枚銅板「鏘」地掉進竹筒
    flyTo('bamboo', wp.x, wp.y, 'flycoin', function () { Sound.coin(); bambooBump(); });
    lvl.served += 1;
    document.getElementById('spotlight').style.opacity = 0;
    document.getElementById('spotRing').style.opacity = 0;
    document.getElementById('clueLayer').innerHTML = '';
    renderLvlHud();

    toast('✨ ' + T('sent'), L(nextWarmLine()), 2400);

    lvl.carIndex += 1;
    if (lvl.served >= CARS) setTimeout(endNight, 2300);
    else setTimeout(spawnCar, 2300);
  }
  function bambooBump() {
    var b = document.getElementById('bamboo');
    b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump');
    refreshGlobals();
  }

  /* ---- 親眼看著小芽長大：天使金光環 + 盆栽當場長一階（第3台綻放收高潮） ---- */
  function growCelebration(carIdx) {
    var stage = document.getElementById('stage');
    var bloom = carIdx >= 2;                        // 第3台（天黑）綻放
    var cosGrowth = [Math.max(SAVE.sprout.growth, 1), Math.max(SAVE.sprout.growth, 3), Math.max(SAVE.sprout.growth, 8)][Math.min(carIdx, 2)];
    var size = [96, 124, 176][Math.min(carIdx, 2)];
    // 金光環
    var halo = document.createElement('div'); halo.className = 'halo';
    halo.style.left = '50%'; halo.style.top = '46%';
    halo.style.setProperty('--hs', (bloom ? 360 : 240) + 'px');
    stage.appendChild(halo);
    setTimeout(function () { if (halo.parentNode) halo.parentNode.removeChild(halo); }, 1500);
    // 盆栽當場長大
    var cele = document.createElement('div');
    cele.className = 'growcele' + (bloom ? ' bloom' : '');
    cele.innerHTML = plantSVG(cosGrowth, size);
    stage.appendChild(cele);
    setTimeout(function () { if (cele.parentNode) cele.parentNode.removeChild(cele); }, bloom ? 2150 : 1850);
    // 金色粒子（綻放時更多）
    var W = stage.clientWidth, H = stage.clientHeight;
    burst(W * 0.5, H * 0.46, { n: bloom ? 40 : 22, spread: rect.rw * (bloom ? 0.3 : 0.18), life: 1000, size: bloom ? 11 : 9 });
  }
  function nextWarmLine() {
    var pool = D.warmLines;
    var avail = pool.filter(function (_, i) { return lvl.usedLines.indexOf(i) === -1; });
    if (!avail.length) { lvl.usedLines = []; avail = pool; }
    var pick = avail[Math.floor(Math.random() * avail.length)];
    lvl.usedLines.push(pool.indexOf(pick));
    return pick;
  }

  /* ---- 天色迴圈：金黃→冷藍夜（明顯且偏快，分三段：天亮/黃昏/天黑） ---- */
  function loop(now) {
    if (!lvl || lvl.ended) return;
    var timeP = (now - lvl.startT) / NIGHT_MS;
    var idx = Math.min(lvl.carIndex, CARS - 1);
    // 天色錨在「目前第幾台車」，車內再隨時間往下壓（壓力來自趕在天黑前）
    var inCar = Math.min(1, (now - (lvl.carStartT || lvl.startT)) / CAR_CREEP_MS);
    var staged = STAGE_BASE[idx] + STAGE_SPAN[idx] * inCar;
    var p = Math.min(1, Math.max(timeP, staged));
    lvl.progress = p;
    var carP = lvl.served / CARS;

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

  function stageName(g) {
    var d = window.I18N[window.LANG] || window.I18N.zh;
    var key = C.sprout.stageKeys[sproutStage(g)];
    return (d.stageNames && d.stageNames[key]) || key || '';
  }

  /* ---- 溫柔收場 ---- */
  function endNight() {
    if (lvl.ended) return;
    lvl.ended = true;
    var addMin = lvl.served * C.perHome.minutes;           // 今晚的善的時數（已逐家累計，這裡只顯示）
    SAVE.lastHomes = lvl.served; persist();
    Sound.playScene('ending');
    document.getElementById('endTitle').textContent = T('endTitle');
    document.getElementById('endLine').textContent = T('endLine');
    document.getElementById('endBig').textContent = lvl.served + ' / ' + CARS;
    document.getElementById('endHomes').textContent = T('endHomes');
    document.getElementById('endWarm').textContent = T('endWarm');
    // 把這盆植物畫得大、明顯：枝葉＝累積成長，今晚顧得越多畫得越大
    var bigPx = 130 + lvl.served * 24;                      // 0→130，3→202
    document.getElementById('endPlant').innerHTML = plantSVG(SAVE.sprout.growth, bigPx);
    var name = SAVE.sprout.name || '';
    document.getElementById('endSprout').innerHTML =
      '<b>' + name + '</b> · ' +
      L({ zh: '又長了一截', en: 'grew a little more', es: 'creció un poco más' }) +
      (lvl.served > 0 ? ' · ' + L({ zh: '今晚 +' + lvl.served, en: '+' + lvl.served + ' tonight', es: '+' + lvl.served + ' esta noche' }) : '');
    // 獎勵：盆栽階段 + 善的時數（累積）
    document.getElementById('endReward').innerHTML =
      '🌱 ' + T('becameStage').replace('{name}', name).replace('{stage}', stageName(SAVE.sprout.growth)) +
      ' ｜ ' + T('kindnessPlus').replace('{min}', addMin) +
      ' ｜ ' + T('kindnessTotal').replace('{total}', SAVE.kindnessMin);
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
  /* ===================================================================
     關2 · 環保小尖兵（會呼吸的動態關卡；拖放分類核心保留；純加法，不動關1）
     A 漸進就地揭曉 + B 動態層 + 綻放慶祝 + C 發光待整理點
     =================================================================== */
  var l2 = null;
  var l2img = { before: null, after: null };
  function startActivity(id) {
    if (id === C.level2.id) startLevel2();
    else if (id === C.level3.id) startLevel3();
    else startLevel();
  }

  /* 街景圖：.png/.jpg/.jpeg/.webp 自動偵測；沒有就用 CSS 漸層 fallback */
  function resolveImg(base, cb) {
    var exts = ['png', 'jpg', 'jpeg', 'webp'], i = 0;
    (function next() {
      if (i >= exts.length) { cb(null); return; }
      var url = 'assets/images/' + base + '.' + exts[i++];
      var im = new Image();
      im.onload = function () { cb(url); };
      im.onerror = next;
      im.src = url;
    })();
  }

  function startLevel2() {
    var D2 = C.level2;
    l2 = { total: D2.items.length, done: 0, ended: false };
    Sound.playScene('eco');
    show('level2');
    var lv = document.getElementById('level2');
    lv.classList.remove('cleared');
    lv.style.setProperty('--heal', '0');
    document.getElementById('l2end').classList.add('hidden');
    document.getElementById('l2bloom').innerHTML = '';
    l2RenderChrome();
    l2BuildScene();
    l2BuildBoard();
    // 載入街景圖（非阻塞；載到才覆蓋漸層）
    resolveImg(D2.imgBefore, function (u) {
      if (u) { l2img.before = u; document.getElementById('l2before').style.backgroundImage = "url('" + u + "')"; }
    });
    resolveImg(D2.imgAfter, function (u) {
      if (u) { l2img.after = u; document.querySelectorAll('#l2after .l2slice').forEach(function (s) { s.style.backgroundImage = "url('" + u + "')"; }); }
    });
  }
  function l2RenderChrome() {
    document.getElementById('l2title').textContent = L({ zh: '你的街角', en: 'Your corner', es: 'Tu esquina' });
    document.getElementById('l2intro').innerHTML = L(C.level2.intro) + '<br><span class="howline">' + L(C.level2.how) + '</span>';
    document.getElementById('l2leave').textContent = T('toHub');
  }
  /* 動態場景：5 條 after 切片（就地揭曉）＋ 霧/光塵/鳥 ＋ 發光待整理點 */
  function l2BuildScene() {
    var n = C.level2.items.length;
    var after = document.getElementById('l2after'); after.innerHTML = '';
    var spots = document.getElementById('l2spots'); spots.innerHTML = '';
    document.getElementById('l2dust').innerHTML = '';
    document.getElementById('l2birds').innerHTML = '';
    for (var i = 0; i < n; i++) {
      var left = (i * 100 / n), right = 100 - (i + 1) * 100 / n;
      var sl = document.createElement('div'); sl.className = 'l2slice'; sl.dataset.band = i;
      sl.style.clipPath = 'inset(0 ' + right + '% 0 ' + left + '%)';
      sl.style.webkitClipPath = 'inset(0 ' + right + '% 0 ' + left + '%)';
      if (l2img.after) sl.style.backgroundImage = "url('" + l2img.after + "')";
      after.appendChild(sl);
    }
    if (l2img.before) document.getElementById('l2before').style.backgroundImage = "url('" + l2img.before + "')";
    // 光塵（限制數量，純 CSS）
    var dust = document.getElementById('l2dust');
    for (var d = 0; d < 9; d++) {
      var p = document.createElement('div'); p.className = 'l2mote';
      p.style.left = (5 + Math.random() * 90) + '%';
      p.style.animationDelay = (-Math.random() * 8).toFixed(2) + 's';
      p.style.animationDuration = (7 + Math.random() * 6).toFixed(2) + 's';
      dust.appendChild(p);
    }
    // 鳥（2 隻，療癒後才明顯）
    var birds = document.getElementById('l2birds');
    for (var b = 0; b < 2; b++) {
      var bd = document.createElement('div'); bd.className = 'l2bird'; bd.textContent = '🕊️';
      bd.style.top = (12 + b * 9) + '%';
      bd.style.animationDelay = (b * 5).toFixed(1) + 's';
      birds.appendChild(bd);
    }
  }
  function l2BuildBoard() {
    var D2 = C.level2;
    var binsEl = document.getElementById('l2bins'); binsEl.innerHTML = '';
    D2.bins.forEach(function (bn) {
      var el = document.createElement('div'); el.className = 'l2bin'; el.dataset.bin = bn.id;
      el.innerHTML = '<span class="l2bin-hit"></span>' +
        '<span class="l2bin-ico"><span class="l2bin-emoji">' + bn.icon + '</span></span>' +
        '<span class="l2bin-nm">' + L(bn.name) + '</span>';
      binsEl.appendChild(el);
      if (bn.img) resolveImg(bn.img, function (u) {      // 載到才換圖；失敗則保留 emoji
        if (!u) return;
        var ico = el.querySelector('.l2bin-ico');
        ico.style.backgroundImage = "url('" + u + "')";
        ico.classList.add('hasimg');
      });
    });
    document.getElementById('l2items').innerHTML = '';
    // C：街上發光待整理點（點下去才出現該處的回收物）；位置＝對應切片的那一段
    var spots = document.getElementById('l2spots');
    D2.items.forEach(function (it, i) {
      var sp = document.createElement('div'); sp.className = 'l2spot'; sp.dataset.band = i;
      sp.style.left = ((i + 0.5) * 100 / D2.items.length) + '%';
      sp.style.top = (60 + (i % 2 ? 6 : -4)) + '%';
      sp.innerHTML = '<span class="l2spot-ring"></span><span class="l2spot-ico">✨</span>';
      sp.addEventListener('pointerup', function () { l2OpenSpot(sp, it, i); });
      spots.appendChild(sp);
    });
  }
  function l2OpenSpot(sp, it, band) {
    if (sp.classList.contains('opened')) return;
    sp.classList.add('opened');
    Sound.clue();
    var el = document.createElement('div'); el.className = 'l2item'; el.dataset.bin = it.bin; el.dataset.band = band;
    el.innerHTML = '<span class="l2item-ico">' + it.icon + '</span><span class="l2item-nm">' + L(it.name) + '</span>';
    el.addEventListener('pointerdown', function (e) { l2StartDrag(e, el, it, band); });
    document.getElementById('l2items').appendChild(el);
  }
  function l2StartDrag(e, el, it, band) {
    if (l2.ended || el.classList.contains('placed')) return;
    e.preventDefault();
    var r = el.getBoundingClientRect();
    var offX = e.clientX - (r.left + r.width / 2), offY = e.clientY - (r.top + r.height / 2);
    var home = { left: el.style.left, top: el.style.top, pos: el.style.position };
    el.classList.add('l2dragging');
    function moveTo(x, y) { el.style.left = (x - offX) + 'px'; el.style.top = (y - offY) + 'px'; }
    el.style.position = 'fixed'; el.style.left = r.left + 'px'; el.style.top = r.top + 'px'; el.style.pointerEvents = 'none';
    moveTo(e.clientX, e.clientY);
    function onMove(ev) { moveTo(ev.clientX, ev.clientY); }
    function done() { document.removeEventListener('pointermove', onMove); document.removeEventListener('pointerup', onUp); document.removeEventListener('pointercancel', onUp); }
    function onUp(ev) {
      done(); el.classList.remove('l2dragging'); el.style.pointerEvents = '';
      var bin = l2BinAt(ev.clientX, ev.clientY);
      if (bin === it.bin) { l2Place(el, it, band, bin); }
      else { el.style.position = home.pos; el.style.left = home.left; el.style.top = home.top; l2Retry(); }
    }
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
  }
  function l2BinAt(x, y) {
    var t = document.elementFromPoint(x, y);
    while (t) { if (t.classList && t.classList.contains('l2bin')) return t.dataset.bin; t = t.parentElement; }
    return null;
  }
  function l2Retry() { Sound.soft(); flash('🤍 ' + L(C.level2.retry)); }

  function l2Place(el, it, band, binId) {
    var binEl = document.querySelector('#l2bins .l2bin[data-bin="' + binId + '"]');
    // 回收物「飛進桶子開口頂部、縮小消失」
    el.classList.remove('l2dragging'); el.style.pointerEvents = 'none';
    if (binEl) {
      var br = binEl.getBoundingClientRect(), r = el.getBoundingClientRect();
      el.style.position = 'fixed';
      el.style.transition = 'left .32s cubic-bezier(.4,.1,.5,1),top .32s cubic-bezier(.4,.1,.5,1),transform .32s ease,opacity .32s ease';
      requestAnimationFrame(function () {
        el.style.left = (br.left + br.width / 2 - r.width / 2) + 'px';
        el.style.top = (br.top - r.height * 0.18) + 'px';
        el.style.transform = 'scale(.28)'; el.style.opacity = '0';
      });
      binEl.classList.add('eat'); setTimeout(function () { binEl.classList.remove('eat'); }, 420);
    } else { el.classList.add('placed'); }
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 380);
    // 飛進開口後，才觸發就地揭曉＋金光＋投幣
    setTimeout(function () { l2Reveal(band, binEl); }, 300);
  }
  function l2Reveal(band, binEl) {
    // A：就地揭曉「對應那一塊」街景由灰濛變明亮
    var slice = document.querySelector('#l2after .l2slice[data-band="' + band + '"]');
    if (slice) slice.classList.add('on');
    var spot = document.querySelector('#l2spots .l2spot[data-band="' + band + '"]');
    if (spot) { spot.classList.add('healed'); var sr = spot.getBoundingClientRect(); l2Flower(sr.left + sr.width / 2, sr.top + sr.height / 2); }
    if (binEl) { binEl.classList.add('lit'); setTimeout(function () { binEl.classList.remove('lit'); }, 700); }
    // 同關1的回饋：金光飛向金圈米芽（長一階）＋ 銅板進竹筒
    var src = (spot || binEl || document.body).getBoundingClientRect();
    var cx = src.left + src.width / 2, cy = src.top + src.height / 2;
    SAVE.kindnessMin += C.perHome.minutes; SAVE.coins += C.perHome.coins;
    SAVE.bamboo += C.perHome.coins; SAVE.sprout.growth += C.perHome.growth; persist();
    Sound.grow();
    burst(cx, cy, { n: 16, spread: 76, life: 800, size: 9 });
    flyTo('sproutRing', cx, cy, 'flydot', function () { refreshGlobals(); pulseRing(0); });
    flyTo('bamboo', cx, cy, 'flycoin', function () { Sound.coin(); bambooBump(); });
    flash('🌸 ' + L(C.level2.revealLine));
    l2.done += 1;
    document.getElementById('level2').style.setProperty('--heal', (l2.done / l2.total).toFixed(3));
    if (l2.done >= l2.total) setTimeout(l2Complete, 700);
  }
  function l2Flower(x, y) {
    var f = document.createElement('div'); f.className = 'l2flower';
    f.textContent = ['🌼', '🌸', '🌷', '🌻'][Math.floor(Math.random() * 4)];
    f.style.left = x + 'px'; f.style.top = y + 'px';
    document.body.appendChild(f);
    setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, 2600);
  }
  function l2Complete() {
    if (l2.ended) return;
    l2.ended = true;
    SAVE.lit[C.level2.id] = true; persist();           // 推進空氣量表（meters 讀 lit.eco）＋ hub 永久亮
    var lv = document.getElementById('level2');
    lv.classList.add('cleared'); lv.style.setProperty('--heal', '1');
    document.querySelectorAll('#l2after .l2slice').forEach(function (s) { s.classList.add('on'); });
    Sound.success(2);
    // 綻放慶祝：一波花 + 柔光
    var bw = window.innerWidth, bh = window.innerHeight;
    for (var i = 0; i < 10; i++) (function (k) { setTimeout(function () { l2Flower(bw * (0.1 + Math.random() * 0.8), bh * (0.3 + Math.random() * 0.4)); }, k * 90); })(i);
    burst(bw / 2, bh * 0.42, { n: 36, spread: bw * 0.32, life: 1100, size: 11 });
    setTimeout(l2ShowEnd, 1700);
  }
  function l2ShowEnd() {
    var addMin = l2.total * C.perHome.minutes;
    document.getElementById('l2endTitle').textContent = T('ecoDone');
    document.getElementById('l2plant').innerHTML = plantSVG(SAVE.sprout.growth, 168);
    document.getElementById('l2endLine').innerHTML = T('noCompare') + '——' + L(C.level2.closing);
    document.getElementById('l2reward').innerHTML =
      '🌱 ' + T('becameStage').replace('{name}', SAVE.sprout.name || '').replace('{stage}', stageName(SAVE.sprout.growth)) +
      ' ｜ ' + T('kindnessPlus').replace('{min}', addMin) + ' ｜ ' + T('kindnessTotal').replace('{total}', SAVE.kindnessMin);
    document.getElementById('l2again').textContent = T('playAgain');
    document.getElementById('l2hub').textContent = T('toHub');
    document.getElementById('l2end').classList.remove('hidden');
  }

  /* ===================================================================
     關3 · 幸福校園 畢業感恩 — 完整三幕（感恩三福 → 一人一信→花蓮 → 畢業慶典）
     會動有手感、老少咸宜；純加法，不動關1關2。一人一信只由「第二幕」推進。
     =================================================================== */
  var l3 = null;
  var REDUCE = false;
  try { REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  function buzz(ms) { if (REDUCE) return; try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }
  function l3Shake() { if (REDUCE) return; var s = document.getElementById('l3scene'); s.classList.remove('shake'); void s.offsetWidth; s.classList.add('shake'); }
  function l3Img2(base, cb) { resolveImg(base, cb); }

  function startLevel3() {
    var D3 = C.level3;
    l3 = { act: 1, a1: 0, a2: 0, total1: D3.cards.length, total2: D3.act2.count, ended: false, combo: 0, comboT: null };
    Sound.playScene('grad');
    show('level3');
    var lv = document.getElementById('level3');
    lv.classList.remove('cleared'); lv.style.setProperty('--heal', '0');
    document.getElementById('l3end').classList.add('hidden');
    document.getElementById('l3bloom').innerHTML = '';
    // 背景 school_grad（載到才覆蓋漸層 fallback）
    l3Img2(D3.img, function (u) { if (u) document.getElementById('l3bg').style.backgroundImage = "url('" + u + "')"; });
    l3BuildScene();
    l3StartAct1();
  }
  function l3RenderChrome(titleObj, introStr, howStr) {
    document.getElementById('l3title').textContent = L(titleObj);
    document.getElementById('l3intro').innerHTML = introStr + (howStr ? '<br><span class="howline">' + howStr + '</span>' : '');
    document.getElementById('l3leave').textContent = T('toHub');
  }
  function l3SetHeal() {
    var p = (l3.a1 + l3.a2) / (l3.total1 + l3.total2);
    document.getElementById('level3').style.setProperty('--heal', p.toFixed(3));
  }
  function l3BuildScene() {
    var pet = document.getElementById('l3petals'); pet.innerHTML = '';
    var nPet = REDUCE ? 5 : 14;
    for (var i = 0; i < nPet; i++) {
      var p = document.createElement('div'); p.className = 'l3petal'; p.textContent = '🌸';
      p.style.left = (Math.random() * 100) + '%';
      p.style.animationDelay = (-Math.random() * 9).toFixed(2) + 's';
      p.style.animationDuration = (7 + Math.random() * 6).toFixed(2) + 's';
      p.style.fontSize = (10 + Math.random() * 12).toFixed(0) + 'px';
      pet.appendChild(p);
    }
    var kids = document.getElementById('l3kids'); kids.innerHTML = '';
    for (var k = 0; k < 6; k++) {
      var kd = document.createElement('div'); kd.className = 'l3kid';
      kd.style.left = (10 + Math.random() * 80) + '%';
      kd.style.top = (58 + Math.random() * 14) + '%';     // 站在廣場上
      kd.style.setProperty('--c', ['#ffd27f', '#9ad8a0', '#9ec2ff', '#f4a3c0', '#c7a9ff'][k % 5]);
      kd.style.animationDelay = (-Math.random() * 6).toFixed(2) + 's';
      kids.appendChild(kd);
    }
    // 隱藏彩蛋：點到某棵櫻花樹 → 驚喜
    var egg = document.getElementById('l3egg');
    egg.onpointerup = function () { l3Egg(); };
  }
  function l3Egg() {
    var r = document.getElementById('l3egg').getBoundingClientRect();
    var x = r.left + r.width / 2, y = r.top + r.height / 2;
    burst(x, y, { n: REDUCE ? 8 : 22, spread: 90, life: 900, size: 9 });
    l3Confetti(x, y, REDUCE ? 6 : 14);
    Sound.success(1); buzz(12);
    flash('🌸✨ ' + L({ zh: '櫻花樹給你一個驚喜！', en: 'The cherry tree has a surprise!', es: '¡El cerezo te sorprende!' }));
  }

  /* ---------- 第一幕：感恩三福（拖/甩到對的對象） ---------- */
  function l3StartAct1() {
    var D3 = C.level3, lv = document.getElementById('level3');
    lv.className = ''; lv.classList.add('a1'); lv.style.display = 'block';
    l3RenderChrome(D3.act1.title, L(D3.intro), L(D3.how));
    document.getElementById('l3targets').style.display = '';
    var tg = document.getElementById('l3targets'); tg.innerHTML = '';
    D3.targets.forEach(function (t) {
      var el = document.createElement('div'); el.className = 'l3target'; el.dataset.t = t.id;
      el.innerHTML = '<span class="l3target-hit"></span><span class="l3target-ico">' + t.icon + '</span><span class="l3target-nm">' + L(t.name) + '</span>';
      tg.appendChild(el);
    });
    document.getElementById('l3items').innerHTML = '';
    var spots = document.getElementById('l3spots'); spots.innerHTML = '';
    var cards = D3.cards.slice(); shuffle(cards);
    cards.forEach(function (cd, i) {
      var sp = document.createElement('div'); sp.className = 'l3spot';
      sp.style.left = (16 + (i * 68 / (cards.length - 1 || 1))) + '%';
      sp.style.top = (46 + (i % 2 ? 7 : -3)) + '%';
      sp.innerHTML = '<span class="l3spot-ring"></span><span class="l3spot-ico">💌</span>';
      sp.addEventListener('pointerup', function () { l3OpenSpot(sp, cd); });
      spots.appendChild(sp);
    });
  }
  function l3OpenSpot(sp, cd) {
    if (sp.classList.contains('opened')) return;
    sp.classList.add('opened'); Sound.clue();
    var el = document.createElement('div'); el.className = 'l3card'; el.dataset.t = cd.target;
    el.innerHTML = '<span class="l3card-ico">💌</span><span class="l3card-tx">' + L(cd.text) + '</span>';
    el.addEventListener('pointerdown', function (e) { l3DragCard(e, el, cd); });
    document.getElementById('l3items').appendChild(el);
  }
  function l3DragCard(e, el, cd) {
    if (l3.ended || el.classList.contains('placed')) return;
    e.preventDefault();
    var r = el.getBoundingClientRect();
    var offX = e.clientX - (r.left + r.width / 2), offY = e.clientY - (r.top + r.height / 2);
    var home = { left: el.style.left, top: el.style.top, pos: el.style.position };
    el.classList.add('l3dragging');
    function moveTo(x, y) { el.style.left = (x - offX) + 'px'; el.style.top = (y - offY) + 'px'; }
    el.style.position = 'fixed'; el.style.left = r.left + 'px'; el.style.top = r.top + 'px'; el.style.pointerEvents = 'none';
    moveTo(e.clientX, e.clientY);
    function onMove(ev) { moveTo(ev.clientX, ev.clientY); }
    function fin() { document.removeEventListener('pointermove', onMove); document.removeEventListener('pointerup', onUp); document.removeEventListener('pointercancel', onUp); }
    function onUp(ev) {
      fin(); el.classList.remove('l3dragging'); el.style.pointerEvents = '';
      var t = l3TargetAt(ev.clientX, ev.clientY);
      if (t === cd.target) { l3SendCard(el, t); }
      else { el.style.position = home.pos; el.style.left = home.left; el.style.top = home.top; l3Retry(); }
    }
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
  }
  function l3TargetAt(x, y) {
    var t = document.elementFromPoint(x, y);
    while (t) { if (t.classList && t.classList.contains('l3target')) return t.dataset.t; t = t.parentElement; }
    return null;
  }
  function l3Retry() { Sound.soft(); flash('🤍 ' + L(C.level3.retry)); l3.combo = 0; }
  function l3SendCard(el, tId) {
    var tgEl = document.querySelector('#l3targets .l3target[data-t="' + tId + '"]');
    el.style.pointerEvents = 'none';
    if (tgEl) {
      var br = tgEl.getBoundingClientRect(), r = el.getBoundingClientRect();
      el.style.position = 'fixed';
      el.style.transition = 'left .3s cubic-bezier(.4,.1,.5,1),top .3s cubic-bezier(.4,.1,.5,1),transform .3s ease,opacity .3s ease';
      requestAnimationFrame(function () {
        el.style.left = (br.left + br.width / 2 - r.width / 2) + 'px';
        el.style.top = (br.top - r.height * 0.18) + 'px';
        el.style.transform = 'scale(.3)'; el.style.opacity = '0';
      });
      tgEl.classList.add('lit', 'bounce'); setTimeout(function () { tgEl.classList.remove('lit', 'bounce'); }, 800);
    }
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 360);
    setTimeout(function () {
      var src = (tgEl || document.body).getBoundingClientRect();
      var cx = src.left + src.width / 2, cy = src.top + src.height / 2;
      l3Confetti(cx, cy, REDUCE ? 6 : 12);
      l3Reward(cx, cy, false);                 // 第一幕：不推進一人一信里程碑
      flash('🌸 ' + L(C.level3.revealLine));
      l3.a1 += 1; l3SetHeal();
      if (l3.a1 >= l3.total1) setTimeout(l3StartAct2, 900);
    }, 280);
  }

  /* 共用成功回饋：粒子＋音效＋小芽＋震動＋連擊；letter=true 時推進一人一信 */
  function l3Reward(cx, cy, letter) {
    SAVE.kindnessMin += C.perHome.minutes; SAVE.coins += C.perHome.coins;
    SAVE.bamboo += C.perHome.coins; SAVE.sprout.growth += C.perHome.growth;
    if (letter) advanceLetters();             // 一人一信里程碑 +1（只由第二幕）
    persist();
    Sound.grow(); buzz(12); l3Shake();
    burst(cx, cy, { n: REDUCE ? 10 : 16, spread: 78, life: 800, size: 9 });
    flyTo('sproutRing', cx, cy, 'flydot', function () { refreshGlobals(); pulseRing(0); });
    flyTo('bamboo', cx, cy, 'flycoin', function () { Sound.coin(); bambooBump(); });
    // 連擊心流（純感官）：連續送對→火花更多、音層疊上
    l3.combo += 1;
    if (l3.combo >= 2) { Sound.success(Math.min(2, l3.combo - 1)); if (!REDUCE) burst(cx, cy, { n: 8 + l3.combo * 2, spread: 60 + l3.combo * 10, life: 700, size: 7 }); }
    clearTimeout(l3.comboT); l3.comboT = setTimeout(function () { l3.combo = 0; }, 1800);
  }

  /* ---------- 第二幕：一人一信 → 花蓮（甩/拖把信拋過海面） ---------- */
  function l3StartAct2() {
    if (l3.ended) return;
    var D3 = C.level3, lv = document.getElementById('level3');
    lv.className = ''; lv.classList.add('a2');
    l3RenderChrome(D3.act2.title, L(D3.act2.prompt));
    document.getElementById('l3spots').innerHTML = '';
    document.getElementById('l3targets').style.display = 'none';
    // 海平線上發光的「花蓮」點
    var hu = document.getElementById('l3hualien');
    hu.classList.remove('hidden');
    hu.style.left = (D3.act2.hualien.x * 100) + '%';
    hu.style.top = (D3.act2.hualien.y * 100) + '%';
    hu.innerHTML = '<span class="l3hu-ring"></span><span class="l3hu-dot"></span><span class="l3hu-nm">' + L(D3.act2.hualienName) + '</span>';
    // 一疊信（甩/拖都能送）
    var tray = document.getElementById('l3items'); tray.innerHTML = '';
    for (var i = 0; i < D3.act2.count; i++) {
      var el = document.createElement('div'); el.className = 'l3letter';
      el.innerHTML = '<span class="l3letter-ico">✉️</span>';
      el.addEventListener('pointerdown', (function (node) { return function (e) { l3DragLetter(e, node); }; })(el));
      tray.appendChild(el);
    }
  }
  function l3DragLetter(e, el) {
    if (l3.ended || el.classList.contains('sent')) return;
    e.preventDefault();
    var r = el.getBoundingClientRect();
    var offX = e.clientX - (r.left + r.width / 2), offY = e.clientY - (r.top + r.height / 2);
    el.classList.add('l3dragging');
    el.style.position = 'fixed'; el.style.transform = 'translate(-50%,-50%)';
    function moveTo(x, y) { el.style.left = (x - offX) + 'px'; el.style.top = (y - offY) + 'px'; }
    moveTo(e.clientX, e.clientY); el.style.pointerEvents = 'none';
    function onMove(ev) { moveTo(ev.clientX, ev.clientY); }
    function fin() { document.removeEventListener('pointermove', onMove); document.removeEventListener('pointerup', onUp); document.removeEventListener('pointercancel', onUp); }
    function onUp() { fin(); el.classList.remove('l3dragging'); el.classList.add('sent'); l3FlyLetter(el); }  // 任何放開都成功（單一去處）
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
  }
  function l3FlyLetter(el) {
    var hu = document.getElementById('l3hualien'), hr = hu.getBoundingClientRect();
    var ex = hr.left + hr.width / 2, ey = hr.top + hr.height / 2;
    var r = el.getBoundingClientRect(), sx = r.left + r.width / 2, sy = r.top + r.height / 2;
    var cx = (sx + ex) / 2, cy = Math.min(sy, ey) - 130;   // 控制點在上方 → 拋物線
    el.style.position = 'fixed'; el.style.pointerEvents = 'none';
    var t0 = performance.now(), dur = REDUCE ? 360 : 700;
    function step(now) {
      var p = Math.min(1, (now - t0) / dur), u = 1 - p;
      var x = u * u * sx + 2 * u * p * cx + p * p * ex;
      var y = u * u * sy + 2 * u * p * cy + p * p * ey;
      el.style.left = x + 'px'; el.style.top = y + 'px';
      el.style.transform = 'translate(-50%,-50%) scale(' + (1 - 0.66 * p).toFixed(3) + ') rotate(' + (p * 40).toFixed(0) + 'deg)';
      el.style.opacity = (1 - 0.5 * p).toFixed(3);
      if (!REDUCE && p < 0.96 && Math.random() < 0.55) l3Trail(x, y);   // 拖尾光
      if (p < 1) requestAnimationFrame(step);
      else { if (el.parentNode) el.parentNode.removeChild(el); l3LetterArrive(ex, ey); }
    }
    requestAnimationFrame(step);
  }
  function l3Trail(x, y) {
    var d = document.createElement('div'); d.className = 'l3trail';
    d.style.left = x + 'px'; d.style.top = y + 'px';
    document.body.appendChild(d);
    setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 520);
  }
  function l3LetterArrive(ex, ey) {
    var hu = document.getElementById('l3hualien');
    hu.classList.add('arrive'); setTimeout(function () { hu.classList.remove('arrive'); }, 700);
    burst(ex, ey, { n: REDUCE ? 8 : 14, color: 'rgba(150,205,255,', spread: 70, life: 820, size: 9 });
    l3Reward(ex, ey, true);                    // 第二幕：推進一人一信里程碑
    flash('✉️➡️🌏 ' + L(C.level3.act2.arriveLine));
    l3.a2 += 1; l3SetHeal();
    if (l3.a2 >= l3.total2) setTimeout(l3StartAct3, 1000);
  }

  /* ---------- 第三幕：畢業慶典 ---------- */
  function l3Confetti(x, y, n) {
    for (var i = 0; i < n; i++) {
      var c = document.createElement('div'); c.className = 'l3conf';
      c.style.left = x + 'px'; c.style.top = y + 'px';
      c.style.background = ['#ff9ec4', '#ffd27f', '#9ad8a0', '#9ec2ff', '#c7a9ff'][i % 5];
      c.style.setProperty('--dx', ((Math.random() - 0.5) * 180).toFixed(0) + 'px');
      c.style.setProperty('--dy', (-60 - Math.random() * 120).toFixed(0) + 'px');
      c.style.animationDelay = (Math.random() * 0.1).toFixed(2) + 's';
      document.body.appendChild(c);
      (function (el) { setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1300); })(c);
    }
  }
  function l3Cap(x, y) {
    var c = document.createElement('div'); c.className = 'l3cap'; c.textContent = '🎓';
    c.style.left = x + 'px'; c.style.top = y + 'px';
    c.style.setProperty('--dx', ((Math.random() - 0.5) * 120).toFixed(0) + 'px');
    document.body.appendChild(c);
    setTimeout(function () { if (c.parentNode) c.parentNode.removeChild(c); }, 1500);
  }
  function l3StartAct3() {
    if (l3.ended) return;
    l3.ended = true;
    SAVE.lit[C.level3.id] = true; persist();        // 該區永久亮 + 存進該名字
    var lv = document.getElementById('level3');
    lv.className = ''; lv.classList.add('a3', 'cleared'); lv.style.setProperty('--heal', '1');
    document.getElementById('l3hualien').classList.add('hidden');
    document.getElementById('l3items').innerHTML = '';
    l3RenderChrome(C.level3.act3.title, L(C.level3.act3.capsLine));
    Sound.success(2); buzz(REDUCE ? 0 : 30);
    var bw = window.innerWidth, bh = window.innerHeight;
    var waves = REDUCE ? 2 : 6;
    for (var i = 0; i < waves; i++) (function (k) {
      setTimeout(function () {
        l3Confetti(bw * (0.15 + Math.random() * 0.7), bh * (0.28 + Math.random() * 0.28), REDUCE ? 8 : 14);
        if (!REDUCE) l3Cap(bw * (0.2 + Math.random() * 0.6), bh * (0.5 + Math.random() * 0.2));
      }, k * 150);
    })(i);
    setTimeout(l3ShowEnd, 1900);
  }
  function l3ShowEnd() {
    var addMin = (l3.total1 + l3.total2) * C.perHome.minutes;
    document.getElementById('l3endTitle').textContent = T('gradDone');
    document.getElementById('l3plant').innerHTML = plantSVG(SAVE.sprout.growth, 168);
    document.getElementById('l3endLine').innerHTML = T('noCompare') + '——' + L(C.level3.closing);
    document.getElementById('l3reward').innerHTML =
      '🌱 ' + T('becameStage').replace('{name}', SAVE.sprout.name || '').replace('{stage}', stageName(SAVE.sprout.growth)) +
      ' ｜ ' + T('kindnessPlus').replace('{min}', addMin) + ' ｜ ' + T('kindnessTotal').replace('{total}', SAVE.kindnessMin);
    document.getElementById('l3again').textContent = T('playAgain');
    document.getElementById('l3hub').textContent = T('toHub');
    document.getElementById('l3end').classList.remove('hidden');
  }
  function l3Relabel() {
    if (!l3) return; var D3 = C.level3, lv = document.getElementById('level3');
    if (lv.classList.contains('a3')) l3RenderChrome(D3.act3.title, L(D3.act3.capsLine));
    else if (lv.classList.contains('a2')) {
      l3RenderChrome(D3.act2.title, L(D3.act2.prompt));
      var nm = document.querySelector('#l3hualien .l3hu-nm'); if (nm) nm.textContent = L(D3.act2.hualienName);
    } else l3RenderChrome(D3.act1.title, L(D3.intro), L(D3.how));
    document.querySelectorAll('#l3targets .l3target').forEach(function (el) {
      var t = D3.targets.filter(function (x) { return x.id === el.dataset.t; })[0];
      if (t) el.querySelector('.l3target-nm').textContent = L(t.name);
    });
  }

  window.onLangChange = function () {
    document.querySelectorAll('.lang button').forEach(function (b) { b.classList.toggle('on', b.dataset.l === window.LANG); });
    if (!document.getElementById('opening').classList.contains('hidden')) renderOpening();
    if (!document.getElementById('hub').classList.contains('hidden')) renderHub();
    if (!document.getElementById('helpPanel').classList.contains('hidden')) renderHelp();
    if (document.getElementById('level').style.display === 'block' && lvl) {
      renderLvlHud(); renderPanelLabels(); renderNotes(); renderShelf(); renderPack(); updateSend();
    }
    if (document.getElementById('level2').style.display === 'block' && l2) {
      l2RenderChrome();
      document.querySelectorAll('#l2bins .l2bin').forEach(function (el) {
        var b = C.level2.bins.filter(function (x) { return x.id === el.dataset.bin; })[0];
        if (b) el.querySelector('.l2bin-nm').textContent = L(b.name);
      });
      if (!document.getElementById('l2end').classList.contains('hidden')) l2ShowEnd();
    }
    if (document.getElementById('level3').style.display === 'block' && l3) {
      l3Relabel();
      if (!document.getElementById('l3end').classList.contains('hidden')) l3ShowEnd();
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

  /* 推門進去 / 點一下繼續：解析名字 → 解鎖音樂 → 進 hub（音訊不可中斷流程） */
  function enterFromDoor() {
    var naming = !SAVE.sprout.name || opSwitching;
    if (naming) {
      var v = (document.getElementById('sproutName').value || '').trim();
      loadPlayer(v || T('namePlaceholder'));      // 同名接續、新名字新世界
      opSwitching = false;
    } else {
      STORE.currentPlayer = SAVE.sprout.name; persist();   // 繼續現有世界
    }
    if (window.Opening) Opening.stop();
    Sound.unlock();                                // 第一次點擊解鎖
    Sound.playScene('hub');
    show('hub'); renderHub();
  }

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
    // 竹筒倒入：倒進第一個還沒滿的里程碑（也可在 hub 點任一里程碑倒入）
    document.getElementById('pourBtn').addEventListener('click', function (e) {
      e.stopPropagation();
      if (SAVE.bamboo < C.bamboo.capacity) return;
      var ms = C.milestones.filter(function (m) { return m.source === 'pour'; })[0];
      if (ms) pourInto(ms);   // 倒竹筒只推進南蘇丹
    });
    document.getElementById('beginBtn').addEventListener('click', enterFromDoor);
    document.getElementById('sproutName').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') enterFromDoor();
    });
    // 門邊「換一個名字」
    document.getElementById('switchName').addEventListener('click', function () {
      opSwitching = true; renderOpening();
      var inp = document.getElementById('sproutName'); if (inp) inp.focus();
    });
    // 里程碑面板收合把手（預設收合，不擋關卡點）
    document.getElementById('msHandle').addEventListener('pointerup', function () {
      document.getElementById('milestones').classList.toggle('collapsed');
      renderMilestones();
    });
    // hub 低調「？」說明鈕（三語、可關閉、不擋畫面）
    document.getElementById('hubHelp').addEventListener('click', function (e) {
      e.stopPropagation(); renderHelp(); document.getElementById('helpPanel').classList.remove('hidden');
    });
    document.getElementById('helpClose').addEventListener('click', function () {
      document.getElementById('helpPanel').classList.add('hidden');
    });
    document.getElementById('helpPanel').addEventListener('click', function (e) {
      if (e.target === this) this.classList.add('hidden');   // 點背景關閉
    });
    // hub 角落齒輪 → 小選單（換名字 / 重新開始這名字 / 重聽音樂）
    document.getElementById('hubGear').addEventListener('click', function (e) {
      e.stopPropagation();
      document.getElementById('hubMenu').classList.toggle('hidden');
    });
    document.getElementById('miSwitch').addEventListener('click', function () {
      document.getElementById('hubMenu').classList.add('hidden');
      opSwitching = true; Sound.playScene('door');
      show('opening'); if (window.Opening) Opening.start(); renderOpening();
      var inp = document.getElementById('sproutName'); if (inp) { inp.value = ''; inp.focus(); }
    });
    document.getElementById('miReplay').addEventListener('click', function () {
      document.getElementById('hubMenu').classList.add('hidden'); Sound.replay('hub');
    });
    document.getElementById('miRestart').addEventListener('click', function () {
      var nm = SAVE.sprout.name || '';
      if (!confirm(T('restartConfirm').replace('{name}', nm))) return;
      document.getElementById('hubMenu').classList.add('hidden');
      restartName(nm); renderHub(); flash('🌱 ' + T('restarted'));
    });
    document.getElementById('sendBtn').addEventListener('click', sendPackage);
    document.getElementById('againBtn').addEventListener('click', startLevel);
    document.getElementById('endHubBtn').addEventListener('click', function () { Sound.playScene('hub'); show('hub'); renderHub(); });
    // 關2 · 環保小尖兵
    Sound.register('eco', C.level2.music, 0.24, false);   // 關2 音樂（路徑寫在 config）
    document.getElementById('l2leave').addEventListener('click', function () { Sound.playScene('hub'); show('hub'); renderHub(); });
    document.getElementById('l2again').addEventListener('click', startLevel2);
    document.getElementById('l2hub').addEventListener('click', function () { Sound.playScene('hub'); show('hub'); renderHub(); });
    // 關3 · 畢業感恩
    Sound.register('grad', C.level3.music, 0.26, false);
    document.getElementById('l3leave').addEventListener('click', function () { Sound.playScene('hub'); show('hub'); renderHub(); });
    document.getElementById('l3again').addEventListener('click', startLevel3);
    document.getElementById('l3hub').addEventListener('click', function () { Sound.playScene('hub'); show('hub'); renderHub(); });

    // 底部面板收合
    document.getElementById('panelTab').addEventListener('click', function () {
      document.getElementById('panel').classList.toggle('collapsed');
      setTimeout(layout, 380);
    });

    // 版面：場景／地圖隨容器大小重新對位
    function relayout() { if (lvl) layout(); hubLayout(); }
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(relayout);
      ro.observe(document.getElementById('stage'));
      ro.observe(document.getElementById('mapStage'));
    }
    window.addEventListener('resize', relayout);
    window.addEventListener('orientationchange', function () { setTimeout(relayout, 250); });

    renderOpening(); show('opening');
    if (window.Opening) Opening.start();             // 啟動善的任意門開場動畫
    Sound.initUnlock();                              // 第一次互動就解鎖
    Sound.playScene('door');                         // 想播開門音樂（解鎖後立刻響）
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();
})();

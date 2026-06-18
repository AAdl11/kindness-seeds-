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
    warmth: 0, bamboo: 0, homeFu: 0, kindnessMin: 0, lit: {}, lastHomes: 0
  };
  if (SAVE.kindnessMin == null) SAVE.kindnessMin = 0;   // 舊存檔補欄位

  /* ---------- 小芽 = 看得見地長大的盆栽（種子→發芽→小苗→小樹/開花） ---------- */
  function sproutStage(g) { return g >= 12 ? 3 : g >= 6 ? 2 : g >= 1 ? 1 : 0; }
  /* 依「累積照顧的家數」growth 決定枝葉與花瓣多寡；px = 顯示大小 */
  function plantSVG(growth, px) {
    growth = Math.max(0, growth | 0);
    var leaves = growth <= 0 ? 0 : Math.min(2 + growth, 14);
    var flowers = growth < 5 ? 0 : Math.min(Math.floor((growth - 3) / 2), 8);
    var stemTop = growth <= 0 ? 78 : Math.max(16, 70 - Math.min(growth, 14) * 3.6); // y 越小越高
    var W = 100, H = 112, soilY = 92, baseY = soilY - 3, s = '';
    // 盆
    s += '<path d="M30 ' + soilY + ' L70 ' + soilY + ' L64 109 L36 109 Z" fill="#c8794a"/>';
    s += '<rect x="26" y="' + (soilY - 7) + '" width="48" height="9" rx="3" fill="#b5673c"/>';
    s += '<ellipse cx="50" cy="' + (soilY - 2) + '" rx="20" ry="4" fill="#6b4a2f"/>';
    if (growth <= 0) {
      s += '<path d="M50 ' + (soilY - 2) + ' q-7 -9 0 -16 q7 7 0 16" fill="#6fcf63"/>'; // 種子冒的小芽
    } else {
      s += '<path d="M50 ' + baseY + ' C 47 ' + (baseY - 18) + ', 53 ' + (stemTop + 18) + ', 50 ' + stemTop + '" stroke="#4f9c3f" stroke-width="3.4" fill="none" stroke-linecap="round"/>';
      for (var i = 0; i < leaves; i++) {
        var frac = (i + 1) / (leaves + 1);
        var y = baseY - frac * (baseY - stemTop);
        var side = (i % 2 === 0) ? -1 : 1;
        var rot = side * 38 - side * (frac * 8);
        var ll = 7.5 + (1 - frac) * 4.5;
        s += '<g transform="translate(50,' + y.toFixed(1) + ') rotate(' + rot + ')"><ellipse cx="' + (side * ll * 0.6).toFixed(1) + '" cy="0" rx="' + ll.toFixed(1) + '" ry="' + (ll * 0.5).toFixed(1) + '" fill="#5bbf57"/></g>';
      }
      for (var f = 0; f < flowers; f++) {
        var off = (f - (flowers - 1) / 2) * 9;
        var fx = 50 + off, fy = stemTop + 1 + Math.abs(off) * 0.22, pc = '';
        for (var p = 0; p < 5; p++) {
          pc += '<ellipse cx="3.6" cy="0" rx="3.4" ry="2.2" fill="#ff9ec4" transform="rotate(' + (p * 72) + ')"/>';
        }
        s += '<g transform="translate(' + fx.toFixed(1) + ',' + fy.toFixed(1) + ')">' + pc + '<circle r="2.1" fill="#ffd54a"/></g>';
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
    { id: 'rv_park_dusk', fu: 'home', state: 'play', stars: 2, pos: { x: 0.12, y: 0.64 },
      nm: { zh: '關懷之夜', en: 'Care at Dusk', es: 'Cuidado al Atardecer' },
      ds: { zh: 'RV Park 關懷 · 入門', en: 'RV Park outreach · intro', es: 'RV Park · inicio' } },
    { id: 'foodshare', fu: 'home', state: 'soon', stars: 1, pos: { x: 0.40, y: 0.67 },
      nm: { zh: '食物發放', en: 'Food share', es: 'Reparto de alimentos' },
      ds: { zh: '2006 一把生米', en: '2006, a handful of rice', es: '2006, un puñado de arroz' } },
    { id: 'blankets', fu: 'home', state: 'soon', stars: 1, pos: { x: 0.09, y: 0.42 },
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
    // 幸福社區（右側／散布）
    { id: 'clinic', fu: 'community', state: 'soon', stars: 3, pos: { x: 0.67, y: 0.54 },
      nm: { zh: '義診', en: 'Free clinic', es: 'Clínica gratuita' },
      ds: { zh: '醫師週末義診 @ AG', en: 'Weekend clinic @ AG', es: 'Clínica de fin de semana @ AG' } },
    { id: 'eco', fu: 'community', state: 'soon', stars: 2, pos: { x: 0.27, y: 0.33 },
      nm: { zh: '環保小尖兵', en: 'Eco vanguard', es: 'Vanguardia ecológica' },
      ds: { zh: '街角整理回乾淨', en: 'A corner made bright', es: 'Una esquina iluminada' } },
    { id: 'hotmeal', fu: 'community', state: 'soon', stars: 2, pos: { x: 0.73, y: 0.37 },
      nm: { zh: '遊民熱食', en: 'Hot meals', es: 'Comidas calientes' },
      ds: { zh: '社區活動中心', en: 'Community center', es: 'Centro comunitario' } }
  ];
  var TREE_POS = { x: 0.55, y: 0.82 };   // 中央總成長樹（base 落點，往上長）

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
    document.getElementById('opKicker').textContent = T('title');
    document.getElementById('opInvite').innerHTML = T('doorInvite');
    document.getElementById('beginTxt').textContent = T('enterDoor');
    var nameBlock = document.getElementById('opName');
    var welcome = document.getElementById('opWelcome');
    var hint = document.getElementById('opHint');
    if (SAVE.sprout.name) {                 // 回訪：歡迎回來，小芽又長高了
      nameBlock.classList.add('hidden');
      welcome.classList.remove('hidden');
      welcome.textContent = T('welcomeBack').replace('{name}', SAVE.sprout.name);
      hint.textContent = T('doorNote');
    } else {                                // 第一次：在門邊幫小芽取名
      welcome.classList.add('hidden');
      nameBlock.classList.remove('hidden');
      document.getElementById('opNameLabel').textContent = T('nameSprout');
      document.getElementById('sproutName').placeholder = T('namePlaceholder');
      hint.textContent = T('nameHint');
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
    var hud = document.getElementById('hubHud'); hud.innerHTML = '';
    hud.appendChild(sproutChip());
    hud.appendChild(chip('🎍 ' + T('bambooLabel') + ' ' + SAVE.bamboo));
    hud.appendChild(chip('💛 ' + T('warmthLabel') + ' ' + SAVE.warmth));

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
        p.addEventListener('click', function () { startLevel(); });
      } else {
        p.innerHTML = '<span class="dot"></span>';
        p.title = L(a.nm) + ' · ' + T('soon');
      }
      pinLayer.appendChild(p);
    });

    // 完成的關 → 那一區開花變美（bloom 補丁）
    var bloom = document.getElementById('bloomLayer'); bloom.innerHTML = '';
    ACTIVITIES.forEach(function (a) {
      if (!SAVE.lit[a.id]) return;
      var b = document.createElement('div'); b.className = 'bloom'; b.dataset.id = a.id;
      bloom.appendChild(b);
    });

    // 全域榮景：完成越多，地圖越亮、花越多、出現光束/彩虹
    var ratio = completedCount() / ACTIVITIES.length;
    var pl = document.getElementById('prosperityLayer');
    pl.style.setProperty('--prosper', ratio.toFixed(3));
    pl.classList.toggle('beams', ratio >= 0.34);
    pl.classList.toggle('rainbow', ratio >= 0.66);

    hubLayout();
  }

  /* 地圖用 contain，節點精準落在地圖上（直橫式都不跑位） */
  function hubFit() {
    var st = document.getElementById('mapStage');
    var W = st.clientWidth, H = st.clientHeight, s = Math.min(W / IW, H / IH);
    var rw = IW * s, rh = IH * s;
    hubRect = { ox: (W - rw) / 2, oy: (H - rh) / 2, rw: rw, rh: rh, s: s };
  }
  function hubPx(fx, fy) { return { x: hubRect.ox + fx * hubRect.rw, y: hubRect.oy + fy * hubRect.rh }; }

  function hubLayout() {
    if (document.getElementById('hub').classList.contains('hidden')) return;
    hubFit();
    var img = document.getElementById('hubMap');
    img.style.left = hubRect.ox + 'px'; img.style.top = hubRect.oy + 'px';
    img.style.width = hubRect.rw + 'px'; img.style.height = hubRect.rh + 'px';
    // 節點
    ACTIVITIES.forEach(function (a) {
      var el = document.querySelector('#pinLayer .pinnode[data-id="' + a.id + '"]');
      if (!el) return; var p = hubPx(a.pos.x, a.pos.y);
      el.style.left = p.x + 'px'; el.style.top = p.y + 'px';
    });
    // bloom
    document.querySelectorAll('#bloomLayer .bloom').forEach(function (b) {
      var a = ACTIVITIES.filter(function (x) { return x.id === b.dataset.id; })[0]; if (!a) return;
      var p = hubPx(a.pos.x, a.pos.y); var sz = hubRect.rw * 0.16;
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
    hud.appendChild(sproutChip());
    var warm = chip('💛 ' + SAVE.warmth); warm.className = 'chip warm'; hud.appendChild(warm);
    hud.appendChild(chip('🚐 ' + T('homesLabel') + ' ' + lvl.served + '/' + CARS));
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
    o = o || {}; var stage = document.getElementById('stage');
    var n = o.n || 12, spread = o.spread || (rect.rw * 0.12), color = o.color || 'rgba(255,210,110,',
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
      stage.appendChild(s);
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
    // 成功：窗亮融入背景、暖意+1、小芽長、竹筒+1、幸福家園推進；一階階堆上去(crescendo)
    Sound.success(lvl.carIndex);                 // 越後面的車，音越高、climax 越大
    var wg = document.getElementById('wg' + (lvl.carIndex % D.spots.length));
    if (wg) wg.classList.add('lit');
    // 配對成功的粒子閃光（堆在窗口上，越後面越多）
    var wp = px(lvl.car.spot.window.x, lvl.car.spot.window.y);
    burst(wp.x, wp.y, { n: 16 + lvl.carIndex * 8, spread: rect.rw * (0.12 + lvl.carIndex * 0.03), life: 820, size: 9 });
    SAVE.warmth += 1; SAVE.bamboo += 1; SAVE.homeFu += 1;
    SAVE.sprout.growth += 1; SAVE.lit[D.id] = true; persist();
    Sound.grow();
    growCelebration(lvl.carIndex);                 // 小芽當場長大 + 天使金光
    lvl.served += 1;
    document.getElementById('spotlight').style.opacity = 0;
    document.getElementById('spotRing').style.opacity = 0;
    document.getElementById('clueLayer').innerHTML = '';
    renderLvlHud();

    toast('✨ ' + T('sent'), L(nextWarmLine()), 2400);

    lvl.carIndex += 1;
    if (lvl.served >= CARS) setTimeout(endNight, 2200);
    else setTimeout(spawnCar, 2200);
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
    return (d.sproutStages || [])[sproutStage(g)] || '';
  }

  /* ---- 溫柔收場 ---- */
  function endNight() {
    if (lvl.ended) return;
    lvl.ended = true;
    var addMin = lvl.served * MIN_PER_HOME;                 // 善的時數
    SAVE.lastHomes = lvl.served; SAVE.kindnessMin += addMin; persist();
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
      if (!SAVE.sprout.name) {                       // 只有第一次才取名；回訪沿用
        var v = document.getElementById('sproutName').value.trim();
        SAVE.sprout.name = v || T('namePlaceholder');
      }
      persist();
      if (window.Opening) Opening.stop();            // 推門後停掉開場動畫
      Sound.playScene('hub'); show('hub'); renderHub();  // 換 hub 音樂
    });
    document.getElementById('sendBtn').addEventListener('click', sendPackage);
    document.getElementById('againBtn').addEventListener('click', startLevel);
    document.getElementById('endHubBtn').addEventListener('click', function () { Sound.playScene('hub'); show('hub'); renderHub(); });

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

/* =====================================================================
   Audio —— 場景配樂管理 + WebAudio 程式音效 (SFX)
   - 每個場景一首歌，切場景時「停掉前一首、淡入下一首」，不疊播：
       door    → welcome_intro.mp3   （開門·善之門，循環）
       hub     → hub_abundance.mp3   （獵人角白天地圖，循環）
       level   → a-curious-discovery.mp3（關懷之夜，循環）
       ending  → ending_warm.mp3     （天黑了，循環）
   - 受瀏覽器自動播放限制：第一次互動（點任意處/語言鈕/名字欄）就解鎖開播。
   - 靜音鈕一鍵全靜。
   - 關卡音樂隨「暖意」微升音量、隨夜色低通收緊。
   ===================================================================== */

window.Sound = (function () {
  var TRACKS = {
    door:   { src: 'assets/audio/welcome_intro.mp3',     vol: 0.30, filtered: false },
    hub:    { src: 'assets/audio/hub_abundance.mp3',     vol: 0.26, filtered: false },
    level:  { src: 'assets/audio/a-curious-discovery.mp3', vol: 0.18, filtered: true },
    ending: { src: 'assets/audio/ending_warm.mp3',       vol: 0.28, filtered: false }
  };
  var ctx = null;
  var nodes = {};            // scene -> { audio, src, gain, filter }
  var current = null;        // 目前場景名
  var pending = null;        // 解鎖前先記住要播的場景
  var unlocked = false;
  var muted = false;
  var FADE = 0.6;            // 淡入/淡出秒數

  function ensureCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function build(scene) {
    if (nodes[scene]) return nodes[scene];
    var def = TRACKS[scene];
    var a = new Audio(def.src);
    a.loop = true; a.crossOrigin = 'anonymous'; a.preload = 'auto';
    var n = { audio: a, def: def, gain: null, filter: null, srcNode: null };
    try {
      var src = ctx.createMediaElementSource(a);
      var gain = ctx.createGain(); gain.gain.value = 0;
      if (def.filtered) {
        var filt = ctx.createBiquadFilter();
        filt.type = 'lowpass'; filt.frequency.value = 20000;
        src.connect(filt); filt.connect(gain); n.filter = filt;
      } else {
        src.connect(gain);
      }
      gain.connect(ctx.destination);
      n.gain = gain; n.srcNode = src;
    } catch (e) {
      a.volume = 0;          // fallback：純 <audio>
    }
    nodes[scene] = n;
    return n;
  }

  function setGain(n, target, ramp) {
    var v = muted ? 0 : target;
    if (n.gain) n.gain.gain.setTargetAtTime(v, ctx.currentTime, ramp || 0.2);
    else if (n.audio) n.audio.volume = v;
  }

  function stopScene(scene) {
    var n = nodes[scene]; if (!n) return;
    setGain(n, 0, FADE / 3);
    // 淡出後暫停，避免兩首疊著
    setTimeout(function () {
      if (current !== scene) { try { n.audio.pause(); } catch (e) {} }
    }, FADE * 1000 + 60);
  }

  function playScene(scene) {
    if (!TRACKS[scene]) return;
    if (!unlocked) { pending = scene; return; }   // 等第一次互動再播
    if (current === scene) {                       // 同場景：確保在播
      var nn = nodes[scene];
      if (nn) { var p = nn.audio.play(); if (p && p.catch) p.catch(function () {}); }
      return;
    }
    ensureCtx();
    var prev = current;
    current = scene;
    if (prev && prev !== scene) stopScene(prev);   // 停掉前一首
    var n = build(scene);
    try { n.audio.currentTime = 0; } catch (e) {}
    var pl = n.audio.play(); if (pl && pl.catch) pl.catch(function () {});
    setGain(n, n.def.vol, FADE);                    // 淡入
  }

  function unlock() {
    if (unlocked) return;
    unlocked = true;
    ensureCtx();
    var want = pending || current || 'door';
    current = null;                 // 讓 playScene 真正啟動
    playScene(want);
  }

  function setMuted(m) {
    muted = m;
    Object.keys(nodes).forEach(function (s) {
      var n = nodes[s];
      var target = (s === current) ? n.def.vol : 0;
      if (n.gain) n.gain.gain.setTargetAtTime(muted ? 0 : target, ctx ? ctx.currentTime : 0, 0.15);
      else if (n.audio) n.audio.volume = muted ? 0 : target;
    });
  }
  function isMuted() { return muted; }

  /* 關卡：warmth 0..1 微升音量；nightProgress 0..1 低通收緊 */
  function setMood(warmth, nightProgress) {
    var n = nodes.level; if (!n || current !== 'level') return;
    var base = TRACKS.level.vol;
    setGain(n, base + 0.16 * Math.min(1, warmth), 0.6);
    if (n.filter) {
      var f = 20000 - (20000 - 900) * Math.min(1, nightProgress);
      n.filter.frequency.setTargetAtTime(f, ctx.currentTime, 0.8);
    }
  }

  /* ---- WebAudio SFX ---- */
  function blip(freq, dur, type, vol, when) {
    if (muted) return;
    ensureCtx();
    var t0 = ctx.currentTime + (when || 0);
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + (dur || 0.18));
    o.connect(g); g.connect(ctx.destination);
    o.start(t0); o.stop(t0 + (dur || 0.18) + 0.02);
  }

  /* 第一次互動就解鎖（任意點擊/按鍵） */
  function initUnlock() {
    var h = function () { unlock(); };
    ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
      window.addEventListener(ev, h, { once: false });
    });
  }

  return {
    initUnlock: initUnlock,
    unlock: unlock,
    playScene: playScene,
    setMood: setMood,
    setMuted: setMuted,
    isMuted: isMuted,
    clue:   function () { blip(880, 0.14, 'sine', 0.10); blip(1320, 0.12, 'sine', 0.07, 0.04); },
    pick:   function () { blip(620, 0.10, 'triangle', 0.10); },
    unpick: function () { blip(360, 0.10, 'sine', 0.08); },
    success:function (level) {
      level = level || 0;
      var k = Math.pow(1.1225, level * 2);          // 每台車升一個全音（crescendo）
      var vb = 0.11 + level * 0.012;
      blip(523 * k, 0.18, 'sine', vb, 0.00);
      blip(659 * k, 0.18, 'sine', vb, 0.10);
      blip(784 * k, 0.20, 'sine', vb + 0.01, 0.20);
      blip(1047 * k, 0.46, 'sine', vb + 0.02, 0.32);    // climax
      blip(1568 * k, 0.42, 'triangle', 0.06 + level * 0.01, 0.36);
      if (level >= 2) { blip(2093, 0.55, 'sine', 0.10, 0.42); blip(1318, 0.55, 'sine', 0.08, 0.42); } // 天黑收高潮
    },
    soft:   function () { blip(420, 0.18, 'sine', 0.08); blip(360, 0.22, 'sine', 0.07, 0.14); },
    grow:   function () { blip(700, 0.12, 'triangle', 0.09); blip(1050, 0.22, 'triangle', 0.10, 0.10); },
    arrive: function () { blip(180, 0.34, 'sine', 0.09); blip(240, 0.30, 'triangle', 0.05, 0.06); },
    // 銅板「鏘」地掉進竹筒（金屬鈴聲）
    coin: function () { blip(1180, 0.16, 'triangle', 0.09); blip(1760, 0.20, 'sine', 0.07, 0.03); blip(2350, 0.26, 'sine', 0.05, 0.06); },
    // 倒竹筒入社區（一串清亮）
    pour: function () { [0, 0.08, 0.16, 0.24].forEach(function (t, i) { blip(700 + i * 180, 0.22, 'triangle', 0.08, t); }); }
  };
})();

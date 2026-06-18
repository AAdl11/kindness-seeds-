/* =====================================================================
   Audio —— 場景配樂管理 + WebAudio 程式音效 (SFX)
   每場景一首歌，切場景淡出前一首再淡入下一首；不疊播。
   鐵則：音訊任何失敗「絕不可」丟例外中斷初始化或卡住互動 —— 全程 try/catch。
   解鎖：使用者第一次點擊（任何點擊）才解鎖；解鎖前不自動播放。
   ===================================================================== */
window.Sound = (function () {
  var TRACKS = {
    door:   { src: 'assets/audio/welcome_intro.mp3',     vol: 0.30, filtered: false },
    hub:    { src: 'assets/audio/hub_abundance.mp3',     vol: 0.26, filtered: false },
    level:  { src: 'assets/audio/a-curious-discovery.mp3', vol: 0.18, filtered: true },
    ending: { src: 'assets/audio/ending_warm.mp3',       vol: 0.28, filtered: false }
  };
  var ctx = null, ctxTried = false;
  var nodes = {}, current = null, pending = null, unlocked = false, muted = false;
  var FADE = 0.6;

  function ensureCtx() {
    if (ctx) { try { if (ctx.state === 'suspended') ctx.resume(); } catch (e) {} return ctx; }
    if (ctxTried) return null;
    ctxTried = true;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) { ctx = new AC(); try { if (ctx.state === 'suspended') ctx.resume(); } catch (e) {} }
    } catch (e) { ctx = null; }
    return ctx;
  }

  function safePlay(a) { try { var p = a.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {} }

  function build(scene) {
    if (nodes[scene]) return nodes[scene];
    var def = TRACKS[scene];
    var n = { audio: null, def: def, gain: null, filter: null };
    try {
      var a = new Audio(def.src);
      a.loop = true; a.preload = 'auto';
      n.audio = a;
      if (ctx) {
        var src = ctx.createMediaElementSource(a);
        var gain = ctx.createGain(); gain.gain.value = 0;
        if (def.filtered) {
          var filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 20000;
          src.connect(filt); filt.connect(gain); n.filter = filt;
        } else { src.connect(gain); }
        gain.connect(ctx.destination); n.gain = gain;
      } else { a.volume = 0; }   // 無 WebAudio：純 <audio> fallback
    } catch (e) { /* 連 Audio 都失敗就靜默 */ }
    nodes[scene] = n;
    return n;
  }

  function setGain(n, target, ramp) {
    if (!n) return;
    var v = muted ? 0 : target;
    try {
      if (n.gain && ctx) n.gain.gain.setTargetAtTime(v, ctx.currentTime, ramp || 0.2);
      else if (n.audio) n.audio.volume = Math.max(0, Math.min(1, v));
    } catch (e) {}
  }

  function stopScene(scene) {
    var n = nodes[scene]; if (!n) return;
    setGain(n, 0, FADE / 3);
    setTimeout(function () {
      if (current !== scene && n.audio) { try { n.audio.pause(); } catch (e) {} }
    }, FADE * 1000 + 60);
  }

  function playScene(scene) {
    try {
      if (!TRACKS[scene]) return;
      if (!unlocked) { pending = scene; return; }     // 解鎖前只記住，不播
      if (current === scene) { var nn = nodes[scene]; if (nn && nn.audio) safePlay(nn.audio); return; }
      ensureCtx();
      var prev = current; current = scene;
      if (prev && prev !== scene) stopScene(prev);
      var n = build(scene);
      if (n && n.audio) { try { n.audio.currentTime = 0; } catch (e) {} safePlay(n.audio); }
      setGain(n, n.def.vol, FADE);
    } catch (e) { /* 音訊絕不中斷流程 */ }
  }

  function unlock() {
    if (unlocked) return;
    try {
      unlocked = true;
      ensureCtx();
      var want = pending || current || null;
      if (want) { current = null; playScene(want); }
    } catch (e) {}
  }

  function setMuted(m) {
    muted = m;
    try {
      Object.keys(nodes).forEach(function (s) {
        var n = nodes[s], target = (s === current) ? n.def.vol : 0;
        setGain(n, target, 0.15);
      });
    } catch (e) {}
  }
  function isMuted() { return muted; }

  function setMood(warmth, nightProgress) {
    try {
      var n = nodes.level; if (!n || current !== 'level') return;
      setGain(n, TRACKS.level.vol + 0.16 * Math.min(1, warmth), 0.6);
      if (n.filter && ctx) {
        var f = 20000 - (20000 - 900) * Math.min(1, nightProgress);
        n.filter.frequency.setTargetAtTime(f, ctx.currentTime, 0.8);
      }
    } catch (e) {}
  }

  /* 重聽：把某場景音樂從頭再播一次 */
  function replay(scene) {
    try { current = (current === scene) ? null : current; playScene(scene); } catch (e) {}
  }

  /* ---- WebAudio SFX（全程 try/catch） ---- */
  function blip(freq, dur, type, vol, when) {
    if (muted) return;
    try {
      if (!ensureCtx()) return;
      var t0 = ctx.currentTime + (when || 0);
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + (dur || 0.18));
      o.connect(g); g.connect(ctx.destination);
      o.start(t0); o.stop(t0 + (dur || 0.18) + 0.02);
    } catch (e) {}
  }

  function initUnlock() {
    var h = function () { unlock(); };
    ['pointerdown', 'touchend', 'mousedown', 'keydown'].forEach(function (ev) {
      try { window.addEventListener(ev, h, { passive: true }); } catch (e) { window.addEventListener(ev, h); }
    });
  }

  return {
    initUnlock: initUnlock, unlock: unlock, playScene: playScene, replay: replay,
    setMood: setMood, setMuted: setMuted, isMuted: isMuted,
    clue:   function () { blip(880, 0.14, 'sine', 0.10); blip(1320, 0.12, 'sine', 0.07, 0.04); },
    pick:   function () { blip(620, 0.10, 'triangle', 0.10); },
    unpick: function () { blip(360, 0.10, 'sine', 0.08); },
    success:function (level) {
      level = level || 0;
      var k = Math.pow(1.1225, level * 2), vb = 0.11 + level * 0.012;
      blip(523 * k, 0.18, 'sine', vb, 0.00); blip(659 * k, 0.18, 'sine', vb, 0.10);
      blip(784 * k, 0.20, 'sine', vb + 0.01, 0.20); blip(1047 * k, 0.46, 'sine', vb + 0.02, 0.32);
      blip(1568 * k, 0.42, 'triangle', 0.06 + level * 0.01, 0.36);
      if (level >= 2) { blip(2093, 0.55, 'sine', 0.10, 0.42); blip(1318, 0.55, 'sine', 0.08, 0.42); }
    },
    soft:   function () { blip(420, 0.18, 'sine', 0.08); blip(360, 0.22, 'sine', 0.07, 0.14); },
    grow:   function () { blip(700, 0.12, 'triangle', 0.09); blip(1050, 0.22, 'triangle', 0.10, 0.10); },
    arrive: function () { blip(180, 0.34, 'sine', 0.09); blip(240, 0.30, 'triangle', 0.05, 0.06); },
    coin:   function () { blip(1180, 0.16, 'triangle', 0.09); blip(1760, 0.20, 'sine', 0.07, 0.03); blip(2350, 0.26, 'sine', 0.05, 0.06); },
    pour:   function () { [0, 0.08, 0.16, 0.24].forEach(function (t, i) { blip(700 + i * 180, 0.22, 'triangle', 0.08, t); }); }
  };
})();

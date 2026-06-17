/* =====================================================================
   Audio —— 配樂 (a-curious-discovery.mp3) + WebAudio 程式音效 (SFX)
   - 音樂音量隨「暖意」微升
   - 隨倒數/天色變暗，低通濾波收緊 (music "tightens" toward night)
   - SFX 全部用 WebAudio 即時合成，不需音檔
   ===================================================================== */

window.Sound = (function () {
  let ctx = null;
  let music = null;          // <audio> element
  let musicSrc = null;       // MediaElementSource
  let musicGain = null;
  let musicFilter = null;
  let started = false;
  let muted = false;
  let baseVol = 0.18;        // 起始音量（柔和）

  function ensureCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function startMusic() {
    if (started) { if (ctx && ctx.state === 'suspended') ctx.resume(); return; }
    started = true;
    ensureCtx();
    music = new Audio('assets/audio/a-curious-discovery.mp3');
    music.loop = true;
    music.crossOrigin = 'anonymous';
    try {
      musicSrc = ctx.createMediaElementSource(music);
      musicFilter = ctx.createBiquadFilter();
      musicFilter.type = 'lowpass';
      musicFilter.frequency.value = 20000;
      musicGain = ctx.createGain();
      musicGain.gain.value = muted ? 0 : baseVol;
      musicSrc.connect(musicFilter);
      musicFilter.connect(musicGain);
      musicGain.connect(ctx.destination);
    } catch (e) {
      // fallback: 直接播放
      music.volume = muted ? 0 : baseVol;
    }
    const p = music.play();
    if (p && p.catch) p.catch(() => {});
  }

  /* warmth 0..1 → 音量微升；nightProgress 0..1 → 濾波收緊（夜越深越悶、越緊） */
  function setMood(warmth, nightProgress) {
    if (!started) return;
    const vol = muted ? 0 : baseVol + 0.16 * Math.min(1, warmth);
    if (musicGain) {
      musicGain.gain.setTargetAtTime(vol, ctx.currentTime, 0.6);
    } else if (music) {
      music.volume = vol;
    }
    if (musicFilter) {
      // 白天明亮 (20k) → 入夜收到 ~900Hz，音樂逐漸「收緊、變悶、緊迫」
      const f = 20000 - (20000 - 900) * Math.min(1, nightProgress);
      musicFilter.frequency.setTargetAtTime(f, ctx.currentTime, 0.8);
    }
  }

  function setMuted(m) {
    muted = m;
    if (musicGain) musicGain.gain.value = muted ? 0 : baseVol;
    else if (music) music.volume = muted ? 0 : baseVol;
  }
  function isMuted() { return muted; }

  /* ---- WebAudio SFX ---- */
  function blip(freq, dur, type, vol, when) {
    if (muted) return;
    ensureCtx();
    const t0 = ctx.currentTime + (when || 0);
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + (dur || 0.18));
    o.connect(g); g.connect(ctx.destination);
    o.start(t0); o.stop(t0 + (dur || 0.18) + 0.02);
  }

  return {
    startMusic,
    setMood,
    setMuted,
    isMuted,
    // 點到線索：清亮的一聲
    clue:   () => { blip(880, 0.14, 'sine', 0.10); blip(1320, 0.12, 'sine', 0.07, 0.04); },
    // 挑物資放進關懷包
    pick:   () => blip(620, 0.10, 'triangle', 0.10),
    // 從關懷包拿掉
    unpick: () => blip(360, 0.10, 'sine', 0.08),
    // 送出成功：窗亮、暖意+1（上行小三音）
    success:() => { blip(523, 0.16, 'sine', 0.11); blip(659, 0.16, 'sine', 0.11, 0.12); blip(784, 0.30, 'sine', 0.12, 0.24); },
    // 軟提示：溫柔的兩聲（不刺耳、非懲罰）
    soft:   () => { blip(420, 0.18, 'sine', 0.08); blip(360, 0.22, 'sine', 0.07, 0.14); },
    // 小芽長一截
    grow:   () => { blip(700, 0.12, 'triangle', 0.09); blip(1050, 0.22, 'triangle', 0.10, 0.10); }
  };
})();

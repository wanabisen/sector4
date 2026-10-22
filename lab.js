// SECTOR 4 · Terminal de análisis — lógica compartida
// El resultado lo decide <body data-result="ok"> o <body data-result="ko">
(() => {
  const $ = s => document.querySelector(s);
  const OK = document.body.dataset.result === "ok";

  // ── Textos del análisis (iguales en las dos páginas, para no dar pistas) ──
  const LOG = [
    ["Cámara de análisis sellada", "OK"],
    ["Muestra 04 identificada", "OK"],
    ["Reactivo A · concentración", "OK"],
    ["Reactivo B · concentración", "OK"],
    ["Secuenciando compuesto", "OK"],
    ["Estabilidad molecular", "···"]
  ];
  const DURACION = 7000;   // ms que tarda la barra en llegar al 100 %
  const CORTE_KO = 73;     // % en el que "explota" la mezcla incorrecta

  // ── Emblema ──
  const EMBLEM = `<svg viewBox="0 0 200 200" aria-hidden="true">
    <circle cx="100" cy="100" r="95" fill="#0f120f" stroke="currentColor" stroke-width="4"/>
    <circle class="spin" cx="100" cy="100" r="86" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="7 8" opacity=".55"/>
    <g fill="currentColor">
      <path d="M88 79.22 L61 32.45 A78 78 0 0 1 139 32.45 L112 79.22 A24 24 0 0 0 88 79.22 Z"/>
      <path d="M124 100 L178 100 A78 78 0 0 1 139 167.55 L112 120.78 A24 24 0 0 0 124 100 Z"/>
      <path d="M88 120.78 L61 167.55 A78 78 0 0 1 22 100 L76 100 A24 24 0 0 0 88 120.78 Z"/>
    </g>
    <circle cx="100" cy="100" r="18" fill="currentColor"/>
    <text x="100" y="108" text-anchor="middle" font-family="JetBrains Mono, monospace" font-weight="700" font-size="23" fill="#0b0d0c">4</text>
  </svg>`;
  document.querySelectorAll(".emblem").forEach(e => e.innerHTML = EMBLEM);

  const screens = { idle: $("#s-idle"), scan: $("#s-scan"), result: $("#s-result") };
  const show = k => { for (const [n, el] of Object.entries(screens)) el.hidden = n !== k; window.scrollTo(0, 0); };

  // ── Sonido (Web Audio, sin archivos) ──
  let ac = null, hum = null;
  function audio() {
    try { if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === "suspended") ac.resume(); } catch (e) { ac = null; }
  }
  function tone(freq, dur, { type = "sine", vol = .15, at = 0, slide = 0 } = {}) {
    if (!ac) return;
    const t = ac.currentTime + at, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.linearRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + .015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + .05);
  }
  function startHum() {
    if (!ac) return;
    const o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
    o.type = "sawtooth"; o.frequency.value = 55; f.type = "lowpass"; f.frequency.value = 200; g.gain.value = .05;
    o.connect(f).connect(g).connect(ac.destination); o.start(); hum = { o, g };
  }
  function stopHum() {
    if (!hum || !ac) return;
    try { hum.g.gain.setTargetAtTime(0, ac.currentTime, .08); hum.o.stop(ac.currentTime + .4); } catch (e) {}
    hum = null;
  }
  const sfx = {
    tick: () => tone(1400, .07, { type: "square", vol: .05 }),
    err: () => { for (let i = 0; i < 5; i++) tone(180, .12, { type: "square", vol: .12, at: i * .2 }); },
    ok: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, i === 3 ? 1.6 : .4, { type: "triangle", vol: .2, at: i * .15 })); tone(1568, 1.2, { vol: .06, at: .6 }); },
    ko: () => { tone(60, 1.4, { vol: .5 }); for (let i = 0; i < 7; i++) tone(600, .5, { type: "sawtooth", vol: .1, at: i * .5, slide: 950 }); }
  };

  // ── Pantalla completa + pantalla siempre encendida (si el navegador lo permite) ──
  let wake = null;
  function kiosk() {
    try { if (!document.fullscreenElement && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {}); } catch (e) {}
    try { if (navigator.wakeLock && !wake) navigator.wakeLock.request("screen").then(w => { wake = w; w.addEventListener("release", () => wake = null); }).catch(() => {}); } catch (e) {}
  }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && !wake && navigator.wakeLock)
      navigator.wakeLock.request("screen").then(w => { wake = w; w.addEventListener("release", () => wake = null); }).catch(() => {});
  });

  // ── Secuencia ──
  let timers = [], raf = 0, running = false;
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));

  function run() {
    if (running) return; running = true;
    audio(); kiosk();
    show("scan"); document.body.classList.add("scanning");
    const log = $("#log"), bar = $("#bar"), pct = $("#pct"), meter = $("#meter"), head = $("#meter-head");
    log.innerHTML = ""; bar.style.width = "0%"; pct.textContent = "0 %";
    meter.classList.remove("bad"); head.classList.remove("bad");
    startHum();

    let lastB = null;
    LOG.forEach(([txt, st], i) => later(() => {
      const li = document.createElement("li");
      li.innerHTML = `<span></span><b></b>`;
      li.querySelector("span").textContent = txt;
      li.querySelector("b").textContent = st;
      log.append(li); lastB = li.querySelector("b"); sfx.tick();
    }, 350 + i * 850));

    const t0 = performance.now();
    const set = p => { bar.style.width = p + "%"; pct.textContent = Math.floor(p) + " %"; };
    const step = now => {
      const p = Math.min(100, (now - t0) / DURACION * 100);
      if (!OK && p >= CORTE_KO) { set(CORTE_KO); return fail(lastB); }
      set(p);
      if (p >= 100) return done(lastB);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  function done(b) {
    if (b) b.textContent = "ESTABLE";
    later(result, 700);
  }

  function fail(b) {
    if (b) { b.textContent = "CRÍTICO"; b.classList.add("bad"); }
    $("#meter").classList.add("bad"); $("#meter-head").classList.add("bad");
    const li = document.createElement("li"); li.className = "err";
    li.innerHTML = "<span>⚠ REACCIÓN NO CONTROLADA</span>";
    $("#log").append(li);
    document.body.classList.add("shake"); sfx.err();
    try { navigator.vibrate && navigator.vibrate([120, 80, 120, 80, 120]); } catch (e) {}
    later(result, 1400);
  }

  function result() {
    stopHum();
    document.body.classList.remove("scanning", "shake");
    show("result");
    if (OK) sfx.ok();
    else {
      sfx.ko(); document.body.classList.add("alarm");
      try { navigator.vibrate && navigator.vibrate([400, 150, 400, 150, 900]); } catch (e) {}
    }
    running = false;
  }

  function reset() {
    timers.forEach(clearTimeout); timers = []; cancelAnimationFrame(raf);
    stopHum(); running = false;
    document.body.classList.remove("scanning", "shake", "alarm");
    show("idle");
  }

  $("#go").addEventListener("click", run);
  $("#again").addEventListener("click", reset);
  document.addEventListener("keydown", e => {
    if ((e.key === "Enter" || e.key === " ") && !screens.idle.hidden) { e.preventDefault(); run(); }
    if (e.key === "r" || e.key === "R" || e.key === "Escape") reset();
  });

  show("idle");
})();

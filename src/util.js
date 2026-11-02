/* Utilidades compartidas por el juego del trabajador y el panel de administración */

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
export const esc = (s) =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export const shuffle = (a) => {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export function lsGet(k) {
  try { return localStorage.getItem(k); } catch (e) { return null; }
}
export function lsSet(k, v) {
  try { localStorage.setItem(k, v); return true; } catch (e) { return false; }
}
export function lsDel(k) {
  try { localStorage.removeItem(k); } catch (e) { /* sin almacenamiento */ }
}
export function ssGet(k) {
  try { return sessionStorage.getItem(k); } catch (e) { return null; }
}
export function ssSet(k, v) {
  try { sessionStorage.setItem(k, v); } catch (e) { /* sin almacenamiento */ }
}
export function ssDel(k) {
  try { sessionStorage.removeItem(k); } catch (e) { /* sin almacenamiento */ }
}

/* ---------- Fechas ---------- */
const p2 = (n) => String(n).padStart(2, "0");
export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
};
export const isoToEs = (iso) => {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
};
export const fileStamp = () => {
  const d = new Date();
  return `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}-${p2(d.getHours())}${p2(d.getMinutes())}`;
};
export const fmtDateTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return "";
  return `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
};

/* ---------- Voz y sonido ---------- */
export function speak(t) {
  try {
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.lang = "es-PE";
    const v = speechSynthesis.getVoices().find((v) => /^es/i.test(v.lang));
    if (v) { u.voice = v; u.lang = v.lang; }
    u.rate = 0.95;
    speechSynthesis.speak(u);
  } catch (e) { /* sin voz */ }
}

let AC = null;
export const sound = { on: true };
function tones(list, type, peak, dur) {
  if (!sound.on) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === "suspended") AC.resume();
    const t = AC.currentTime;
    list.forEach(([f, d]) => {
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0, t + d);
      g.gain.linearRampToValueAtTime(peak, t + d + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, t + d + dur);
      o.connect(g); g.connect(AC.destination);
      o.start(t + d); o.stop(t + d + dur + 0.05);
    });
  } catch (e) { /* sin audio */ }
}
export const chime = () => tones([[523.25, 0], [659.25, 0.12], [783.99, 0.24], [1046.5, 0.38]], "sine", 0.2, 0.5);
export const fanfare = () =>
  tones([[392, 0], [523.25, 0.12], [659.25, 0.24], [783.99, 0.38], [1046.5, 0.54], [1318.5, 0.7]], "triangle", 0.18, 0.6);
export const bigFanfare = () => {
  tones([[523.25, 0], [659.25, 0.1], [783.99, 0.2], [1046.5, 0.3]], "triangle", 0.22, 0.45);
  tones([[523.25, 0.55], [659.25, 0.55], [783.99, 0.55], [1046.5, 0.55], [1318.5, 0.7], [1568, 0.7]], "sine", 0.24, 0.75);
};

/* ---------- Íconos ---------- */
export const ICONS = {
  star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" fill="#FFC845" stroke="#C99200" stroke-width="1.2" stroke-linejoin="round"/></svg>',
  spk: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 4V5L7 9z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  sndOff: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 4V5L7 9z" fill="currentColor"/><path d="M16 9l6 6M22 9l-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  mis: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="M15 15l6 6" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/></svg>',
  q: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M9.2 9.5a2.9 2.9 0 1 1 4.6 2.3c-1 .7-1.8 1.2-1.8 2.4M12 17.2v.1" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
  pen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l4-1 11-11a2.1 2.1 0 0 0-3-3L5 16z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M14 7l3 3" stroke="currentColor" stroke-width="2.2"/></svg>',
  save: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 20h14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  hat: '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="19" fill="#1B2A5B"/><path d="M8 23a12 12 0 0 1 24 0z" fill="#FFC845"/><rect x="6" y="23" width="28" height="4" rx="2" fill="#FFC845"/><rect x="18" y="9" width="4" height="9" rx="2" fill="#F2563F"/></svg>',
};

/* ---------- Carga diferida de librerías ---------- */
const loaded = {};
export function loadScript(src) {
  if (loaded[src]) return loaded[src];
  loaded[src] = new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => res();
    s.onerror = () => { delete loaded[src]; rej(new Error("lib")); };
    document.head.appendChild(s);
  });
  return loaded[src];
}

/* ---------- Imágenes ---------- */
export function readLogoFile(file, max = 400) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("vacio"));
    if (file.size > 8 * 1024 * 1024) return reject(new Error("grande"));
    const rd = new FileReader();
    rd.onerror = () => reject(new Error("lectura"));
    rd.onload = () => {
      const im = new Image();
      im.onerror = () => reject(new Error("imagen"));
      im.onload = () => {
        let m = max;
        for (let tries = 0; tries < 3; tries++) {
          const sc = Math.min(1, m / Math.max(im.width, im.height));
          const w = Math.max(1, Math.round(im.width * sc)), h = Math.max(1, Math.round(im.height * sc));
          const cv = document.createElement("canvas");
          cv.width = w; cv.height = h;
          cv.getContext("2d").drawImage(im, 0, 0, w, h);
          const url = cv.toDataURL("image/png");
          if (url.length < 300000 || tries === 2) return resolve({ url, w, h });
          m = Math.round(m * 0.7);
        }
      };
      im.src = rd.result;
    };
    rd.readAsDataURL(file);
  });
}

export function imageSize(url) {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const im = new Image();
    im.onload = () => resolve({ url, w: im.naturalWidth || 1, h: im.naturalHeight || 1 });
    im.onerror = () => resolve(null);
    im.src = url;
  });
}

/* ---------- Pad de firma ---------- */
export class SignaturePad {
  constructor(canvas, placeholder) {
    this.c = canvas;
    this.ph = placeholder;
    this.has = false;
    this.box = null;
    this.drawing = false;
    this.loaded = null;
    this.ready = false;
  }
  init() {
    const c = this.c;
    const w = c.clientWidth, h = c.clientHeight;
    if (!w || !h) return false;
    this.dpr = window.devicePixelRatio || 1;
    c.width = Math.round(w * this.dpr);
    c.height = Math.round(h * this.dpr);
    const x = c.getContext("2d");
    x.scale(this.dpr, this.dpr);
    x.lineWidth = 2.6; x.lineCap = "round"; x.lineJoin = "round"; x.strokeStyle = "#0F2A47";
    this.x = x;
    this.ready = true;
    const pos = (e) => { const r = c.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const grow = (p) => {
      this.has = true;
      this.loaded = null;
      if (this.ph) this.ph.classList.add("hidden");
      const b = this.box;
      if (!b) this.box = { x0: p.x, y0: p.y, x1: p.x, y1: p.y };
      else { b.x0 = Math.min(b.x0, p.x); b.y0 = Math.min(b.y0, p.y); b.x1 = Math.max(b.x1, p.x); b.y1 = Math.max(b.y1, p.y); }
    };
    c.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      try { c.setPointerCapture(e.pointerId); } catch (err) { /* sin captura */ }
      const p = pos(e);
      this.drawing = true; this.last = p;
      x.beginPath(); x.moveTo(p.x, p.y); x.lineTo(p.x + 0.01, p.y + 0.01); x.stroke(); grow(p);
    });
    c.addEventListener("pointermove", (e) => {
      if (!this.drawing) return;
      e.preventDefault();
      const p = pos(e);
      x.beginPath(); x.moveTo(this.last.x, this.last.y); x.lineTo(p.x, p.y); x.stroke();
      this.last = p; grow(p);
    });
    const end = () => { this.drawing = false; };
    c.addEventListener("pointerup", end);
    c.addEventListener("pointercancel", end);
    c.addEventListener("pointerleave", end);
    return true;
  }
  clear() {
    if (!this.ready) return;
    this.x.save(); this.x.setTransform(1, 0, 0, 1, 0, 0);
    this.x.clearRect(0, 0, this.c.width, this.c.height);
    this.x.restore();
    this.has = false; this.box = null; this.loaded = null;
    if (this.ph) this.ph.classList.remove("hidden");
  }
  /* Muestra una firma ya guardada (data URL) sin tocar el lienzo si no se vuelve a firmar. */
  load(url) {
    if (!url || !this.ready) return;
    const im = new Image();
    im.onload = () => {
      const w = this.c.clientWidth, h = this.c.clientHeight;
      const sc = Math.min((w - 16) / im.naturalWidth, (h - 16) / im.naturalHeight, 1);
      const dw = im.naturalWidth * sc, dh = im.naturalHeight * sc;
      this.x.drawImage(im, (w - dw) / 2, (h - dh) / 2, dw, dh);
      this.loaded = { url, w: im.naturalWidth, h: im.naturalHeight };
      if (this.ph) this.ph.classList.add("hidden");
    };
    im.src = url;
  }
  isEmpty() { return !this.has && !this.loaded; }
  export() {
    if (this.loaded && !this.has) return this.loaded;
    if (!this.ready || !this.has || !this.box) return null;
    const pad = 8, b = this.box, d = this.dpr;
    const x0 = Math.max(0, (b.x0 - pad) * d), y0 = Math.max(0, (b.y0 - pad) * d);
    const x1 = Math.min(this.c.width, (b.x1 + pad) * d), y1 = Math.min(this.c.height, (b.y1 + pad) * d);
    const w = Math.max(1, Math.round(x1 - x0)), h = Math.max(1, Math.round(y1 - y0));
    const t = document.createElement("canvas");
    t.width = w; t.height = h;
    t.getContext("2d").drawImage(this.c, x0, y0, w, h, 0, 0, w, h);
    return { url: t.toDataURL("image/png"), w, h };
  }
}

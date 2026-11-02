/* Juego del trabajador: ingreso por DNI, 4 módulos, resultado y firma de asistencia. */
import { MODULES, TOTAL_CASES, RECAP, progressStage } from "./content.js";
import { SCENES, IC, TINT, banner } from "./scenes.js";
import { api } from "./api.js";
import { $, $$, esc, shuffle, lsGet, lsSet, ICONS, speak, sound, chime, fanfare, bigFanfare, SignaturePad, isoToEs } from "./util.js";

const KEY = (cod, dni) => `ml-fen:v1:${cod}:${dni}`;
const N_MOD = MODULES.length;

const S = {
  view: "start", codigo: "", ses: null, sesErr: null, busy: false, err: "",
  dni: "", name: "", area: "",
  si: 0, qi: 0, pts: 0, log: [], hist: {}, cs: null, modal: false, stageSeen: null,
  completed: false, firmaPend: null, serverPts: null, sigErr: "",
};
let pad = null;
let debounce = null, pendingSnap = null;

/* ---------- Atajos ---------- */
const mod = () => MODULES[S.si];
const cur = () => mod().cases[S.qi];
const ckey = () => S.si + "|" + S.qi;
const pct = () => (S.completed ? 100 : Math.min(100, Math.round((S.log.length / TOTAL_CASES) * 100)));
const scorePct = () => {
  const pts = S.serverPts != null && !S.log.length ? S.serverPts : S.pts;
  return Math.round((pts / TOTAL_CASES) * 100);
};
const mission = (label, text, icon) =>
  `<div class="mission" role="note"><span class="mi">${icon}</span><div><small>${label}</small><b>${esc(text)}</b></div></div>`;
const secImg = (m, i, cls) =>
  `<div class="${cls || "img"}" style="background:${TINT[i % TINT.length]}"><svg viewBox="0 0 120 120" role="img" aria-label="${esc(m.title)}">${IC[m.ic]}</svg></div>`;
const pill = (cls, t) => `<span class="pill ${cls}">${t}</span>`;

/* ---------- Guardado ---------- */
function snapshot() {
  return { v: 1, t: Date.now(), codigo: S.codigo, dni: S.dni, name: S.name, area: S.area, pts: S.pts, si: S.si, qi: S.qi,
    view: S.view, log: S.log, hist: S.hist, stageSeen: S.stageSeen, completed: S.completed, firmaPend: S.firmaPend, snd: sound.on };
}
function readSave(cod, dni) {
  try {
    const d = JSON.parse(lsGet(KEY(cod, dni)));
    return d && d.v === 1 && d.dni === dni ? d : null;
  } catch (e) { return null; }
}
function saveProgress() {
  if (!S.dni || !S.name || S.view === "start") return;
  const snap = snapshot();
  lsSet(KEY(S.codigo, S.dni), JSON.stringify(snap));
  if (S.completed) return;
  pendingSnap = { codigo: S.codigo, dni: S.dni, snap: { ...snap, firmaPend: null }, pts: S.pts, avance: pct() };
  clearTimeout(debounce);
  debounce = setTimeout(doSync, 1000);
}
async function doSync() {
  if (!pendingSnap) return;
  const p = pendingSnap;
  try {
    await api.guardarAvance(p.codigo, p.dni, p.snap, p.pts, p.avance);
    if (pendingSnap === p) pendingSnap = null;
  } catch (e) { /* sin internet: queda en el equipo y se reintenta al volver la conexión */ }
}
async function retryFirma(silent) {
  if (!S.firmaPend) return true;
  try {
    const r = await api.firmar(S.codigo, S.dni, S.firmaPend, { ...snapshot(), firmaPend: null }, S.pts);
    if (r === "ok" || r === "sin_cambios") {
      S.firmaPend = null;
      saveProgress();
      if (!silent) render();
      return true;
    }
  } catch (e) { /* sigue pendiente */ }
  if (!silent) render();
  return false;
}
window.addEventListener("online", () => {
  if (S.firmaPend && S.dni) retryFirma(true).then((ok) => { if (ok) render(); });
  if (pendingSnap) { clearTimeout(debounce); debounce = setTimeout(doSync, 500); }
});

/* ---------- Casos ---------- */
function newCase() {
  const k = ckey();
  S.modal = false;
  if (S.hist[k]) { S.cs = S.hist[k]; return; }
  const c = cur();
  let cs;
  if (c.k === "duel") {
    cs = { step: "q", wrong: [], done: false, first: true, scene: null, msg: null,
      opts: shuffle([{ t: c.a, ok: c.ok === "a" }, { t: c.b, ok: c.ok === "b" }]) };
  } else {
    cs = { step: c.scene ? "find" : "q", wrong: [], done: false, first: true, scene: c.scene || null, msg: null,
      opts: shuffle([{ t: c.ok, ok: true }, ...shuffle(c.bad).slice(0, 2).map((t) => ({ t, ok: false }))]) };
  }
  S.hist[k] = cs;
  S.cs = cs;
}

function startNew() {
  Object.assign(S, { pts: 0, log: [], hist: {}, si: 0, qi: 0, completed: false, firmaPend: null, serverPts: null, cs: null, modal: false,
    stageSeen: progressStage(0), view: "intro" });
}
function applySnap(d) {
  Object.assign(S, { pts: d.pts || 0, si: d.si || 0, qi: d.qi || 0, log: d.log || [], hist: d.hist || {}, stageSeen: d.stageSeen || null,
    completed: !!d.completed, firmaPend: d.firmaPend || null, modal: false });
  if (typeof d.snd === "boolean") sound.on = d.snd;
  let v = d.view;
  if (d.completed) v = "done";
  else if (v === "summary") { if (S.si < N_MOD - 1) { S.si++; S.qi = 0; v = "intro"; } else v = "result"; }
  else if (!["intro", "play", "result", "firma"].includes(v)) v = "intro";
  S.view = v;
  if (v === "play") newCase();
}

/* ---------- Vistas ---------- */
function infoLine() {
  if (!S.ses) return "";
  const bits = [];
  if (S.ses.razon_social) bits.push(`<b>${esc(S.ses.razon_social)}</b>`);
  if (S.ses.fecha) bits.push(isoToEs(S.ses.fecha));
  return bits.length ? `<p class="dnil" style="margin:0 0 12px">${bits.join(" · ")}</p>` : "";
}

function startView() {
  if (S.sesErr) {
    return `<div class="card err-card"><div class="eyebrow">Capacitación</div><h2>No encontramos esta capacitación</h2>
    <p>${esc(S.sesErr)}</p>
    <div class="fld"><label for="cod">Código de la capacitación</label><input id="cod" type="text" maxlength="6" autocomplete="off" autocapitalize="characters" placeholder="6 caracteres" value="${esc(S.codigo)}"></div>
    <div class="row"><button class="btn" data-act="code">Buscar</button></div></div>`;
  }
  const needCode = !S.ses;
  return `<div class="card"><div class="eyebrow">Capacitación</div><h1>Fenómeno El Niño en tu trabajo</h1>
  <p class="lead">Microlearning de unos 10 minutos para trabajadores</p>${S.ses && S.ses.tema ? `<p style="margin:0 0 6px"><b>${esc(S.ses.tema)}</b></p>` : ""}${infoLine()}
  <div class="how"><div><span class="hi">${ICONS.mis}</span><b>Encuentra</b><small>el peligro</small></div><div><span class="hi">${ICONS.q}</span><b>Decide</b><small>qué hacer</small></div><div><span class="hi">${ICONS.star}</span><b>Gana</b><small>puntos</small></div></div>
  ${needCode ? `<div class="fld"><label for="cod">Código de la capacitación</label><input id="cod" type="text" maxlength="6" autocomplete="off" autocapitalize="characters" placeholder="6 caracteres" value="${esc(S.codigo)}"></div>` : ""}
  <div class="fld"><label for="dni">Ingresa tu DNI</label><input id="dni" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="8" autocomplete="off" value="${esc(S.dni)}" placeholder="8 dígitos" aria-required="true"></div>
  <p class="ferr" id="ferr" role="alert" ${S.err ? "" : "hidden"}>${esc(S.err)}</p>
  <div class="row"><button class="btn" data-act="go" ${S.busy ? "disabled" : ""}>${S.busy ? "Buscando..." : "Entrar"}</button></div>
  <p style="margin-top:14px;font-size:.85rem;color:var(--muted)">Solo puedes entrar si estás en la lista de esta capacitación. Si no es tu caso, avisa a quien la organiza.</p></div>`;
}

function whoCard() {
  return `<div class="who"><div><span>Nombre</span><b>${esc(S.name)}</b></div><div><span>DNI</span><b>${esc(S.dni)}</b></div>${S.area ? `<div><span>Área</span><b>${esc(S.area)}</b></div>` : ""}</div>`;
}

function introView() {
  const m = mod();
  const fresh = S.si === 0 && S.log.length === 0;
  const tiles = MODULES.map((x, i) => {
    const n = x.cases.length;
    return `<div class="tl ${i < S.si ? "done" : i === S.si ? "cur" : ""}">${secImg(x, i)}${i < S.si ? '<span class="st ok" aria-label="Completado">✓</span>' : i === S.si ? '<span class="st now">Ahora</span>' : `<span class="st n">${i + 1}</span>`}<div class="tx"><b>${esc(x.title)}</b><small>${n} casos</small></div></div>`;
  }).join("");
  const sigTile = `<div class="tl p2">${secImg({ title: "Firma", ic: "retorno" }, 4)}<span class="st f2">Final</span><div class="tx"><b>Firma de asistencia</b><small>Queda registrada</small></div></div>`;
  return `${fresh ? `<div class="card" style="margin-bottom:14px"><div class="eyebrow">Bienvenido</div><h2>Son ${N_MOD} módulos cortos</h2><p style="margin:0">Verás ${TOTAL_CASES} casos de situaciones reales. Al final firmas tu asistencia. Tu avance se guarda solo, así que puedes seguir después.</p>${whoCard()}</div>` : ""}
  <div class="card hero">${secImg(m, S.si, "himg")}<div class="htx"><div class="eyebrow">Módulo ${S.si + 1} de ${N_MOD}</div><h2>${esc(m.title)}</h2><p>${esc(m.sub)} ${m.cases.length} casos.</p><button class="btn" data-act="begin">Comenzar módulo</button></div></div>
  <h3 style="margin:20px 0 10px">Tu recorrido</h3><div class="tiles">${tiles}${sigTile}</div>`;
}

function scaleExtra() {
  return `<div class="scale" style="margin-top:10px">${pill("LO", "Bajo")}<span class="arr" aria-hidden="true">→</span>${pill("MO", "Medio")}<span class="arr" aria-hidden="true">→</span>${pill("IM", "Alto")}<span class="arr" aria-hidden="true">→</span>${pill("IN", "Muy alto")}<span class="sc-note">niveles de riesgo por calor</span></div>`;
}

function modalHtml() {
  const c = cur(), cs = S.cs;
  let body;
  if (c.k === "duel") {
    const okText = c.ok === "a" ? c.a : c.b;
    body = `<h3>${esc(c.tema)}</h3><p><b>${esc(okText)}</b></p><p>${esc(c.why)}</p><div class="learn"><b>Qué hacer</b><ul>${c.tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>`;
  } else {
    body = `<h3>${esc(c.tema)}</h3><p>${esc(c.why)}</p><div class="learn"><p class="q"><b>Qué puede pasar:</b> ${esc(c.risk)}</p><b>Qué hacer</b><ul>${c.tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>`;
  }
  return `<div class="modal-bg" id="mbg"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="mt"><button class="mx" data-act="mclose" aria-label="Cerrar explicación">×</button><div class="mok" id="mt">${cs.first ? "¡Correcto! Sumas un punto" : "Correcto"}</div>${body}<div class="row"><button class="btn" id="mcont" data-act="mcont">Continuar</button></div></div></div>`;
}

function caseView() {
  const cs = S.cs, c = cur(), duel = c.k === "duel";
  let out = `<div class="eyebrow">${esc(c.tema)}</div>`;
  if (duel) {
    out += `<div class="card"><h2>¿En cuál de las dos situaciones el cuerpo siente más calor?</h2><p style="margin:0">Elige la que tiene más carga de calor.</p></div>`;
  } else if (cs.scene) {
    const sc = SCENES[cs.scene];
    if (cs.step === "find") out += mission("Tu misión", sc.prompt, ICONS.mis) + (cs.msg ? `<div class="fb no" role="status">${esc(cs.msg)}</div>` : "");
    out += `<div class="scene ${cs.step === "find" ? "" : "small"}"><svg viewBox="0 0 600 340" role="group" aria-label="Escena de inspección">${sc.svg()}</svg></div>`;
  } else {
    out += `<div class="scene">${banner(c.ic, S.si)}</div>`;
  }
  if (cs.step === "q") {
    if (!duel) out += `<div class="situ"><button class="btn alt round" data-act="spk" aria-label="Escuchar la situación">${ICONS.spk}</button><div class="eyebrow">Situación</div><p class="scen">${esc(c.sit)}</p>${c.extra === "scale" ? scaleExtra() : ""}</div>`;
    out += mission(duel ? "Tu misión" : "Tu decisión", duel ? "Toca la situación con más calor." : "¿Qué haces? Elige la mejor opción.", ICONS.q);
    out += `<div class="opts ${duel ? "duel" : ""}">${cs.opts.map((o, k) => `<button class="opt ${cs.done && o.ok ? "good" : cs.wrong.includes(k) ? "bad" : ""}" data-act="opt" data-k="${k}" ${cs.done || cs.wrong.includes(k) ? "disabled" : ""}>${duel ? `<span class="ltr">${"AB"[k]}</span>` : ""}${esc(o.t)}</button>`).join("")}</div>`;
    if (cs.msg && !cs.done) out += `<div class="fb no" role="status"><b>No es la mejor opción.</b>${esc(cs.msg)}</div>`;
    if (cs.done) {
      const last = S.qi === mod().cases.length - 1;
      out += `<div class="row"><button class="btn alt" data-act="reopen">Ver explicación</button><button class="btn" id="nx" data-act="next">${last ? "Terminar módulo" : "Siguiente caso"}</button></div>`;
      if (S.modal) out += modalHtml();
    }
  }
  return out;
}

function modOk(si) {
  let n = 0;
  MODULES[si].cases.forEach((_, q) => { const cs = S.hist[si + "|" + q]; if (cs && cs.ok) n++; });
  return n;
}

function summaryView() {
  const n = mod().cases.length, ok = modOk(S.si), last = S.si === N_MOD - 1, p = pct(), stage = progressStage(p);
  let notice = "";
  if (S.stageSeen === null) S.stageSeen = stage;
  else if (stage !== S.stageSeen) { notice = `<div class="save-note"><b>Nueva etapa:</b>&nbsp;${stage}</div>`; S.stageSeen = stage; }
  const msg = ok === n ? "Módulo perfecto. Todo a la primera." : ok >= n / 2 ? "Buen avance." : "Cada caso incluye la explicación para repasar.";
  const nextLabel = last ? "Ver mi resultado ahora" : "Siguiente módulo ahora";
  const nextText = last ? "Ya puedes ver tu resultado y firmar tu asistencia." : `El siguiente módulo es ${MODULES[S.si + 1].title}.`;
  return `<div class="card hero celebrate">${secImg(mod(), S.si, "himg")}<div class="htx"><div class="eyebrow">Módulo completado</div><h2>¡Felicitaciones!</h2><h3>${esc(mod().title)}</h3><div class="score" style="font-size:2.8rem">${ok} de ${n}</div><p style="margin:6px 0 0">respuestas correctas a la primera. ${msg}</p><p style="margin:8px 0 0">${nextText}</p>${notice}<div class="save-note"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 20h14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>Tu avance está guardado. Puedes continuar ahora o después.</div><div class="row"><button class="btn" data-act="adv">${nextLabel}</button></div></div></div>`;
}

function recapHtml() {
  return `<ul class="recap">${RECAP.map((t, i) => `<li><b>${i + 1}</b><span>${esc(t)}</span></li>`).join("")}</ul>`;
}

function resultView() {
  const total = S.log.length, ok = S.log.filter((x) => x.ok).length;
  const bars = MODULES.map((m, i) => {
    const xs = S.log.filter((x) => x.mod === i), o = xs.filter((x) => x.ok).length;
    return `<div class="bar"><span>${esc(m.title)}</span><span class="tr"><i style="width:${xs.length ? Math.round((o / xs.length) * 100) : 0}%"></i></span><span>${o}/${xs.length}</span></div>`;
  }).join("");
  return `<div class="card"><div class="eyebrow">Resultado</div><div class="dnil">DNI ${esc(S.dni)}</div><div class="score">${Math.round((ok / Math.max(1, total)) * 100)}%</div><h2 style="margin-top:8px">Completaste los ${N_MOD} módulos</h2>
  <p>Acertaste a la primera ${ok} de ${total} casos.</p><h3 style="margin-top:14px">Por módulo</h3><div class="bars">${bars}</div></div>
  <div class="card" style="margin-top:14px"><h2>Lo que te llevas</h2>${recapHtml()}</div>
  <div class="row"><button class="btn" data-act="tosign">Firmar mi asistencia</button></div>`;
}

function firmaView() {
  const tema = S.ses && S.ses.tema ? S.ses.tema : "Fenómeno El Niño en tu trabajo";
  return `<div class="card"><div class="eyebrow">Último paso</div><h2>Firma tu asistencia</h2>
  <p style="margin:0">Con tu firma queda registrado que completaste: <b>${esc(tema)}</b>.</p>${whoCard()}
  <label id="sigLbl" style="margin-top:12px">Tu firma</label>
  <div class="sig"><canvas id="sigPad" role="img" aria-labelledby="sigLbl"></canvas><span class="sig-ph" id="sigPh">Firma aquí con el dedo</span></div>
  <p class="ferr" id="serr" role="alert" ${S.sigErr ? "" : "hidden"}>${esc(S.sigErr)}</p>
  <div class="row"><button class="btn alt" data-act="sigclr">Borrar firma</button><button class="btn" data-act="sign">Registrar mi asistencia</button></div></div>`;
}

function doneView() {
  const p = scorePct();
  return `<div class="card hero celebrate"><div class="himg" style="background:${TINT[1]}"><svg viewBox="0 0 120 120" role="img" aria-label="Registro completo">${IC.retorno}</svg></div><div class="htx"><div class="eyebrow">Asistencia registrada</div><h2>Listo, quedaste registrado</h2><p style="margin:0 0 6px">Completaste la capacitación y tu firma quedó en el registro.</p><div class="score" style="font-size:2.8rem">${p}%</div><p style="margin:6px 0 0">de aciertos a la primera.</p>
  ${S.firmaPend ? `<div class="pend">Tu firma quedó guardada en este equipo y falta enviarla porque no hay conexión. Se enviará sola cuando vuelva el internet.<div class="row" style="margin-top:10px"><button class="btn alt" data-act="retry">Reintentar envío</button></div></div>` : `<div class="save-note"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5 9-10" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>Tu asistencia está enviada.</div>`}</div></div>
  ${whoCard()}
  <details style="margin-top:14px"><summary>Repasar lo que te llevas</summary>${recapHtml()}</details>
  <div class="row"><button class="btn alt" data-act="exit">Salir</button></div>`;
}

/* ---------- Render ---------- */
function brandHtml() {
  const s = S.ses;
  if (s && s.logo) return `<img src="${esc(s.logo)}" alt="Logo de ${esc(s.razon_social || "la empresa")}">`;
  return `${ICONS.hat}<span class="lt">${esc((s && s.razon_social) || "Microlearning SST")}</span>`;
}

function headUpdate() {
  $("#brand").innerHTML = brandHtml();
  const logged = !!S.name && S.view !== "start";
  $("#starsbox").innerHTML = logged ? ICONS.star + "<span>" + S.pts + "</span>" : "";
  $("#starsbox").style.display = logged ? "flex" : "none";
  const pr = $("#prog"), nav = $("#navrow");
  nav.hidden = S.view === "start";
  nav.style.display = S.view === "start" ? "none" : "flex";
  $("#back-label").textContent = S.view === "intro" || S.view === "done" ? "Salir" : "Atrás";
  $("#home").style.display = ["play", "summary"].includes(S.view) ? "inline-flex" : "none";
  if (S.view === "start") pr.hidden = true;
  else if (S.view === "done") { pr.hidden = false; $("#plabel").textContent = "Capacitación completa"; $("#pcount").textContent = "100%"; $("#pfill").style.width = "100%"; }
  else if (S.view === "result" || S.view === "firma") { pr.hidden = false; $("#plabel").textContent = "Avance total"; $("#pcount").textContent = "100% · Falta tu firma"; $("#pfill").style.width = "100%"; }
  else {
    pr.hidden = false;
    const p = pct();
    $("#plabel").textContent = `Módulo ${S.si + 1} de ${N_MOD} · ${mod().title}`;
    $("#pcount").textContent = `${p}% · ${progressStage(p)}` + (S.view === "play" ? ` · Caso ${S.qi + 1} de ${mod().cases.length}` : "");
    $("#pfill").style.width = p + "%";
  }
  $("#snd").innerHTML = sound.on ? ICONS.spk : ICONS.sndOff;
  $("#snd").setAttribute("aria-pressed", sound.on ? "true" : "false");
  $("#snd").setAttribute("aria-label", sound.on ? "Sonido activado" : "Sonido desactivado");
  document.title = (S.ses && S.ses.razon_social ? S.ses.razon_social + " · " : "") + "Fenómeno El Niño: microlearning";
}

export function render() {
  const m = $("#main");
  m.innerHTML = { start: startView, intro: introView, play: caseView, summary: summaryView, result: resultView, firma: firmaView, done: doneView }[S.view]();
  headUpdate();
  postRender();
  saveProgress();
}

function postRender() {
  if (S.view === "play" && S.cs && S.cs.scene && S.cs.step === "q") {
    const sc = SCENES[S.cs.scene];
    const id = Object.keys(sc.hot).find((k) => sc.hot[k].ok);
    const f = document.querySelector('.hot[data-id="' + id + '"]');
    if (f) f.classList.add("found");
  }
  if (S.view === "firma") {
    pad = new SignaturePad($("#sigPad"), $("#sigPh"));
    requestAnimationFrame(() => pad.init());
    $("#sigPad").addEventListener("pointerdown", () => { S.sigErr = ""; const er = $("#serr"); if (er) er.hidden = true; });
  }
  const mt = $("#mcont");
  if (mt) mt.focus();
}

/* ---------- Acciones ---------- */
function toTop() { window.scrollTo({ top: 0 }); }

async function loadSession(code) {
  S.codigo = String(code || "").trim().toUpperCase();
  S.ses = null; S.sesErr = null;
  if (!/^[A-HJ-NP-Z2-9]{6}$/.test(S.codigo)) {
    if (S.codigo) S.sesErr = "Revisa que el código tenga 6 caracteres, o pide de nuevo el link.";
    return;
  }
  try {
    const s = await api.obtenerSesion(S.codigo);
    if (s) S.ses = s;
    else S.sesErr = "Este link o código no corresponde a una capacitación activa. Pide el link otra vez a quien la organiza.";
  } catch (e) {
    S.sesErr = "No pudimos conectar. Revisa tu internet e intenta de nuevo.";
  }
}

async function actCode() {
  const v = ($("#cod").value || "").trim().toUpperCase();
  S.busy = true; render();
  await loadSession(v);
  S.busy = false;
  if (S.ses) history.replaceState(null, "", `?s=${S.codigo}`);
  render();
}

async function actGo() {
  const dv = ($("#dni").value || "").trim();
  const codEl = $("#cod");
  const bad = (m) => { S.err = m; S.busy = false; render(); const d = $("#dni"); if (d) { d.value = dv; d.focus(); } };
  S.err = "";
  if (codEl && !S.ses) {
    S.dni = dv;
    S.busy = true; render();
    await loadSession(codEl.value);
    S.busy = false;
    if (!S.ses) { render(); return; }
    history.replaceState(null, "", `?s=${S.codigo}`);
  }
  S.dni = dv;
  if (!/^\d{8}$/.test(dv)) return bad("Escribe tu DNI de 8 números.");
  S.busy = true; render();
  let p;
  try { p = await api.entrar(S.codigo, dv); }
  catch (e) { return bad("No pudimos conectar. Revisa tu internet e intenta de nuevo."); }
  if (!p) return bad("Tu DNI no está en la lista de esta capacitación. Avisa a quien la organiza.");
  S.busy = false;
  S.name = p.nombre; S.area = p.area || ""; S.dni = dv;
  const local = readSave(S.codigo, dv);
  let snap = p.estado && p.estado.v === 1 ? p.estado : null;
  if (local && (!snap || (local.t || 0) > (snap.t || 0))) snap = local;
  if (p.completado) {
    S.serverPts = p.puntos;
    if (snap) { applySnap({ ...snap, completed: true }); S.firmaPend = null; S.pts = p.puntos; }
    else { Object.assign(S, { completed: true, firmaPend: null, pts: p.puntos, log: [], hist: {}, si: 0, qi: 0 }); }
    S.view = "done";
  } else if (snap) {
    applySnap(snap);
    if (S.firmaPend) retryFirma(true).then((ok) => { if (ok) render(); });
  } else startNew();
  render(); toTop();
}

function salir() {
  S.dni = ""; S.name = ""; S.area = ""; S.modal = false; S.err = "";
  S.view = "start";
  render(); toTop();
}

function tapHot(el) {
  const cs = S.cs;
  if (!cs || cs.step !== "find") return;
  const sc = SCENES[cs.scene], id = el.dataset.id, h = sc.hot[id];
  if (h.ok) {
    cs.step = "q"; cs.msg = null; render();
    const a = document.querySelector(".situ");
    if (a && a.scrollIntoView) a.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    cs.first = false; cs.msg = h.fb; render();
    const g = document.querySelector('.hot[data-id="' + id + '"]');
    if (g) g.classList.add("shake");
  }
}

function tapOpt(k) {
  const cs = S.cs;
  if (!cs || cs.done) return;
  const o = cs.opts[k], c = cur();
  if (o.ok) {
    cs.done = true; cs.msg = null; S.modal = true;
    const ok = cs.first && cs.wrong.length === 0;
    if (ok) S.pts++;
    cs.ok = ok;
    S.log.push({ mod: S.si, ok });
    chime();
  } else {
    cs.wrong.push(k); cs.first = false;
    cs.msg = c.k === "duel" ? "Esa situación tiene menos carga de calor. Prueba con la otra." : "Esa medida no controla el peligro o es incompleta. Prueba con otra.";
  }
  render();
}

function next() {
  S.modal = false;
  if (S.qi < mod().cases.length - 1) { S.qi++; newCase(); S.view = "play"; }
  else { S.view = "summary"; fanfare(); }
  render(); toTop();
}

function advance() {
  if (S.si < N_MOD - 1) { S.si++; S.qi = 0; S.view = "intro"; }
  else S.view = "result";
  render(); toTop();
}

function back() {
  if (S.modal) return;
  const v = S.view;
  if (v === "play") { if (S.qi > 0) { S.qi--; newCase(); } else S.view = "intro"; }
  else if (v === "summary") { S.qi = mod().cases.length - 1; newCase(); S.view = "play"; }
  else if (v === "result") { S.si = N_MOD - 1; S.view = "summary"; }
  else if (v === "firma") S.view = "result";
  else if (v === "intro" || v === "done") return salir();
  render(); toTop();
}

async function actSign() {
  const f = pad && pad.export();
  if (!f) { S.sigErr = "Firma en el recuadro para continuar."; render(); return; }
  S.sigErr = "";
  S.completed = true; S.firmaPend = f.url;
  bigFanfare();
  try {
    const r = await api.firmar(S.codigo, S.dni, f.url, { ...snapshot(), firmaPend: null, view: "done" }, S.pts);
    if (r === "ok" || r === "sin_cambios") S.firmaPend = null;
  } catch (e) { /* queda pendiente de envío */ }
  S.view = "done";
  render(); toTop();
}

function onClick(e) {
  const hotEl = e.target.closest(".hot");
  if (hotEl) return tapHot(hotEl);
  const mbg = e.target.id === "mbg" ? e.target : null;
  if (mbg) { S.modal = false; render(); const n = $("#nx"); if (n) n.focus(); return; }
  const el = e.target.closest("[data-act]");
  if (!el) return;
  switch (el.dataset.act) {
    case "go": return actGo();
    case "code": return actCode();
    case "begin": S.qi = 0; newCase(); S.view = "play"; render(); return toTop();
    case "opt": return tapOpt(+el.dataset.k);
    case "next": return next();
    case "mcont": return next();
    case "mclose": S.modal = false; render(); { const n = $("#nx"); if (n) n.focus(); } return;
    case "reopen": S.modal = true; render(); return;
    case "adv": return advance();
    case "tosign": S.view = "firma"; render(); return toTop();
    case "sigclr": if (pad) pad.clear(); return;
    case "sign": return actSign();
    case "retry": return retryFirma(false);
    case "exit": return salir();
    case "spk": { const c = cur(); if (c.k !== "duel") speak(c.sit + " ¿Qué haces? " + S.cs.opts.map((o) => o.t).join(". ")); return; }
  }
}

function onKey(e) {
  if (e.key === "Escape" && S.modal) { S.modal = false; render(); return; }
  const hotEl = e.target.closest && e.target.closest(".hot");
  if (hotEl && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); tapHot(hotEl); return; }
  if (e.key === "Enter" && e.target.id === "dni") { e.preventDefault(); actGo(); }
  if (e.key === "Enter" && e.target.id === "cod") { e.preventDefault(); if (S.sesErr) actCode(); else $("#dni") ? $("#dni").focus() : actGo(); }
}

function onInput(e) {
  if (e.target.id === "dni") e.target.value = e.target.value.replace(/\D/g, "").slice(0, 8);
  if (e.target.id === "cod") e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}

export async function initWorker() {
  document.body.classList.remove("admin");
  const main = $("#main");
  main.addEventListener("click", onClick);
  main.addEventListener("keydown", onKey);
  main.addEventListener("input", onInput);
  $("#back").onclick = back;
  $("#home").onclick = () => { S.modal = false; if (S.view === "summary") return advance(); S.view = "intro"; render(); toTop(); };
  $("#snd").onclick = () => { sound.on = !sound.on; if (sound.on) chime(); headUpdate(); };
  const q = new URLSearchParams(location.search);
  const code = q.get("s") || q.get("c") || "";
  S.busy = true;
  main.innerHTML = '<div class="card"><p style="margin:0">Cargando...</p></div>';
  headUpdate();
  if (code) await loadSession(code);
  S.busy = false;
  render();
  window.S = S;
}

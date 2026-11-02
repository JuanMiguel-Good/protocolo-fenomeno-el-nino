/* Panel de administración: crea la capacitación, carga la lista de DNI, comparte el link y descarga el registro. */
import { api, isDemo, ApiError } from "./api.js";
import { TOTAL_CASES, TITLE_DEFAULT } from "./content.js";
import { buildPdf, buildXlsx, saveFile, TIPOS } from "./registro.js";
import { $, $$, esc, ssGet, ssSet, ssDel, todayISO, isoToEs, fileStamp, fmtDateTime, readLogoFile, imageSize, SignaturePad } from "./util.js";

const A = {
  dni: null, view: "login", err: "", msg: "", busy: false,
  list: [], admins: [], codigo: null, asist: [], form: null, editDni: null, incluirPend: false,
};
let respPad = null;

const emptyForm = () => ({
  razon_social: "", ruc: "", domicilio: "", actividad: "", n_trabajadores: "", logo: "", codigo_doc: "", version_doc: "",
  tipo: "capacitacion", tema: TITLE_DEFAULT, fecha: todayISO(), capacitador: "", horas: "",
  resp_nombre: "", resp_cargo: "", resp_fecha: todayISO(), resp_firma: "",
});

function errText(e) {
  const c = e instanceof ApiError ? e.code : "x";
  return ({
    no_admin: "Este DNI no es administrador.",
    dni: "Escribe un DNI de 8 números.",
    ultimo_admin: "No puedes quitar al último administrador.",
    red: "No hay conexión con el servidor. Revisa tu internet.",
    no_encontrado: "No se encontró el registro. Actualiza la lista.",
    nombre: "Escribe el nombre.",
  })[c] || "No se pudo completar la acción. Intenta de nuevo.";
}

function toast(t) {
  let el = $("#toast");
  if (!el) { el = document.createElement("div"); el.id = "toast"; el.className = "toast"; el.setAttribute("role", "status"); document.body.appendChild(el); }
  el.textContent = t; el.classList.remove("hidden");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.add("hidden"), 2600);
}

/* ---------- Formulario ---------- */
const FIELDS = ["razon_social", "ruc", "domicilio", "actividad", "n_trabajadores", "codigo_doc", "version_doc", "tema", "fecha", "capacitador", "horas", "resp_nombre", "resp_cargo", "resp_fecha"];
function collectForm() {
  if (!A.form || !$("#f-razon_social")) return;
  FIELDS.forEach((k) => { const el = $("#f-" + k); if (el) A.form[k] = el.value.trim(); });
  const t = document.querySelector('input[name="tipo"]:checked');
  if (t) A.form.tipo = t.value;
  if (respPad) { const f = respPad.export(); A.form.resp_firma = f ? f.url : ""; }
  const inc = $("#incPend"); if (inc) A.incluirPend = inc.checked;
}

const fldRaw = (id, label, val, ph = "", type = "text", extra = "") =>
  `<div class="field"><label for="${id}">${label}</label><input id="${id}" type="${type}" value="${esc(val)}" placeholder="${esc(ph)}" ${extra}></div>`;
const fld = (id, label, val, ph = "", type = "text", extra = "") => fldRaw("f-" + id, label, val, ph, type, extra);

function formHtml() {
  const f = A.form;
  return `<div class="card"><h2>Datos del empleador</h2><p class="note">Se imprimen en el registro, campos 1 a 5.</p>
  ${fld("razon_social", "1. Razón social o denominación social", f.razon_social, "", "text", 'maxlength="200" autocomplete="organization"')}
  <div class="grid2">${fld("ruc", "2. RUC", f.ruc, "11 dígitos", "text", 'inputmode="numeric" maxlength="11" autocomplete="off"')}
  ${fld("n_trabajadores", "5. N.º de trabajadores en el centro laboral", f.n_trabajadores, "", "text", 'inputmode="numeric" maxlength="7" autocomplete="off"')}</div>
  ${fld("domicilio", "3. Domicilio (dirección, distrito, departamento, provincia)", f.domicilio, "", "text", 'maxlength="300" autocomplete="street-address"')}
  ${fld("actividad", "4. Actividad económica", f.actividad, "", "text", 'maxlength="200" autocomplete="off"')}</div>

  <div class="card"><h2>Capacitación</h2><p class="note">Campos 6 a 13 del registro.</p>
  <div class="field"><label>Marcar (X)</label><div class="radios">${TIPOS.map((t) => `<label><input type="radio" name="tipo" value="${t.v}" ${f.tipo === t.v ? "checked" : ""}>${t.n}. ${t.label.charAt(0) + t.label.slice(1).toLowerCase()}</label>`).join("")}</div></div>
  ${fld("tema", "10. Tema", f.tema, "", "text", 'maxlength="300"')}
  <div class="grid2">${fld("fecha", "11. Fecha", f.fecha, "", "date")}${fld("horas", "13. N.º de horas", f.horas, "Ej. 0,25", "text", 'inputmode="decimal" maxlength="12" autocomplete="off"')}</div>
  ${fld("capacitador", "12. Nombre del capacitador o entrenador", f.capacitador, "", "text", 'maxlength="150" autocomplete="off"')}</div>

  <div class="card"><h2>Encabezado del documento</h2>
  <div class="logo-row"><div class="logo-prev" id="logoPrev">${f.logo ? `<img src="${esc(f.logo)}" alt="Logo de la empresa">` : "Sin logo"}</div>
  <div class="row" style="margin:0"><label class="btn alt sm" for="inLogo" style="margin:0;cursor:pointer;display:inline-flex;align-items:center">Subir logo</label><input class="sr" type="file" id="inLogo" accept="image/*"><button class="btn alt sm ${f.logo ? "" : "hidden"}" data-act="logodel">Quitar logo</button></div></div>
  <p class="note">El logo se ve en la parte superior del juego y en el registro.</p>
  <div class="grid2">${fld("codigo_doc", "Código", f.codigo_doc, "", "text", 'maxlength="40" autocomplete="off"')}${fld("version_doc", "Versión", f.version_doc, "", "text", 'maxlength="30" autocomplete="off"')}</div></div>

  <div class="card"><h2>Responsable del registro</h2><p class="note">Campo 19. Su firma se guarda y se imprime en el PDF y el Excel.</p>
  <div class="grid2">${fld("resp_nombre", "Nombre", f.resp_nombre, "", "text", 'maxlength="150" autocomplete="name"')}${fld("resp_cargo", "Cargo", f.resp_cargo, "", "text", 'maxlength="150" autocomplete="organization-title"')}</div>
  ${fld("resp_fecha", "Fecha", f.resp_fecha, "", "date")}
  <label id="rsLbl" style="margin-top:8px">Firma</label>
  <div class="sig"><canvas id="rsPad" role="img" aria-labelledby="rsLbl"></canvas><span class="sig-ph" id="rsPh">Firma aquí</span></div>
  <div class="row" style="margin-top:10px"><button class="btn alt sm" data-act="rsclr">Borrar firma</button></div></div>

  <div class="row"><button class="btn" data-act="save" ${A.busy ? "disabled" : ""}>${A.codigo ? "Guardar cambios" : "Crear capacitación"}</button></div>`;
}

/* ---------- Trabajadores ---------- */
function estadoTag(a) {
  if (a.completado) return `<span class="tag ok">Firmó</span>`;
  if (a.avance > 0 || a.iniciado_en) return `<span class="tag wip">En progreso ${a.avance}%</span>`;
  return `<span class="tag no">Sin iniciar</span>`;
}
function asistRows() {
  return A.asist.map((a) => {
    if (A.editDni === a.dni) {
      return `<tr><td><input id="e-nombre" type="text" value="${esc(a.nombre)}" maxlength="150" aria-label="Nombre"></td><td>${esc(a.dni)}</td><td><input id="e-area" type="text" value="${esc(a.area)}" maxlength="100" aria-label="Área"></td><td class="hide-s"></td><td class="hide-s"></td><td><div class="acts"><button class="btn sm" data-act="esave" data-dni="${a.dni}">Guardar</button><button class="btn alt sm" data-act="ecancel">Cancelar</button></div></td></tr>`;
    }
    return `<tr><td>${esc(a.nombre)}</td><td>${esc(a.dni)}</td><td>${esc(a.area)}</td><td>${estadoTag(a)}${a.completado_en ? `<div class="note" style="margin:2px 0 0">${fmtDateTime(a.completado_en)}</div>` : ""}</td><td class="hide-s">${a.avance > 0 || a.completado ? `${a.puntos}/${TOTAL_CASES}` : "-"}</td><td><div class="acts"><button class="btn alt sm" data-act="eedit" data-dni="${a.dni}">Editar</button><button class="btn alt sm" data-act="ereset" data-dni="${a.dni}" data-name="${esc(a.nombre)}">Reiniciar</button><button class="btn danger sm" data-act="edel" data-dni="${a.dni}" data-name="${esc(a.nombre)}">Quitar</button></div></td></tr>`;
  }).join("");
}

function linkUrl() { return `${location.origin}${location.pathname}?s=${A.codigo}`; }

function sessionBlocks() {
  const total = A.asist.length, done = A.asist.filter((a) => a.completado).length;
  const url = linkUrl();
  const wa = `https://wa.me/?text=${encodeURIComponent("Capacitación: " + (A.form.tema || "Fenómeno El Niño") + ". Entra con tu DNI en este link: " + url)}`;
  return `<div class="card"><h2>Link para los trabajadores</h2><p class="note" style="margin:0 0 10px">Cada trabajador entra con su DNI. Solo pueden entrar quienes estén en la lista de abajo.</p>
  <div class="linkbox"><code id="lnk">${esc(url)}</code><button class="btn sm" data-act="copy">Copiar link</button><a class="btn alt sm" href="${wa}" target="_blank" rel="noopener" style="text-decoration:none;display:inline-flex;align-items:center">Compartir por WhatsApp</a></div>
  <p class="note">Código de la capacitación: <b>${esc(A.codigo)}</b></p>${isDemo ? '<p class="note">En modo demostración el link solo funciona en este mismo navegador.</p>' : ""}</div>

  <div class="card"><h2>Trabajadores (${total})</h2><p class="note" style="margin:0 0 6px">${done} de ${total} firmaron.</p>
  <div class="grid2"><div>
  <h3>Agregar una persona</h3>
  ${fldRaw("n-dni", "DNI", "", "8 dígitos", "text", 'inputmode="numeric" maxlength="8" autocomplete="off"')}
  ${fldRaw("n-nombre", "Apellidos y nombres", "", "Ej. Pérez Gómez Juan", "text", 'maxlength="150" autocomplete="off"')}
  ${fldRaw("n-area", "Área", "", "Opcional", "text", 'maxlength="100" autocomplete="off"')}
  <div class="row" style="margin-top:8px"><button class="btn sm" data-act="addone">Agregar</button></div></div>
  <div><h3>Agregar varias</h3><p class="note" style="margin:0 0 6px">Una por línea: DNI, apellidos y nombres, área. Sirve pegar desde Excel.</p>
  <textarea id="bulk" placeholder="40667929, Pérez Gómez Juan, Planta&#10;12345678, Ruiz Soto María, Almacén"></textarea>
  <div class="row" style="margin-top:8px"><button class="btn sm" data-act="addbulk">Agregar lista</button></div></div></div>
  ${total ? `<div style="overflow-x:auto;margin-top:18px"><table class="tbl"><thead><tr><th>Apellidos y nombres</th><th>DNI</th><th>Área</th><th>Estado</th><th class="hide-s">Puntaje</th><th></th></tr></thead><tbody>${asistRows()}</tbody></table></div>
  <div class="row"><button class="btn alt sm" data-act="reload">Actualizar avance</button></div>` : `<p class="note" style="margin-top:14px">Todavía no hay trabajadores en la lista.</p>`}</div>

  <div class="card"><h2>Descargar el registro</h2><p class="note" style="margin:0 0 6px">Sale con el formato del registro de inducción, capacitación, entrenamiento y simulacros, con la firma de cada trabajador que terminó.</p>
  <label class="chk"><input type="checkbox" id="incPend" ${A.incluirPend ? "checked" : ""}>Incluir también a quienes aún no terminan, con la firma en blanco</label>
  <div class="row"><button class="btn" data-act="pdf">${"Descargar PDF"}</button><button class="btn alt" data-act="xlsx">Descargar Excel</button></div></div>

  <div class="card"><h3>Eliminar esta capacitación</h3><p class="note" style="margin:0 0 8px">Borra los datos, la lista y las firmas. No se puede deshacer.</p><div class="row" style="margin-top:0"><button class="btn danger sm" data-act="delses">Eliminar capacitación</button></div></div>`;
}

/* ---------- Vistas ---------- */
function loginView() {
  return `<div class="card"><div class="eyebrow">Administración</div><h1>Panel del capacitador</h1>
  <p class="lead">Entra con tu DNI para crear la capacitación, cargar la lista y compartir el link.</p>
  ${isDemo ? '<div class="save-note" style="margin-bottom:12px">Modo demostración. El administrador de prueba es el DNI <b>40667929</b>.</div>' : ""}
  <div class="field"><label for="dni">DNI</label><input id="dni" type="text" inputmode="numeric" maxlength="8" autocomplete="off" placeholder="8 dígitos"></div>
  <p class="ferr" role="alert" ${A.err ? "" : "hidden"}>${esc(A.err)}</p>
  <div class="row"><button class="btn" data-act="login" ${A.busy ? "disabled" : ""}>${A.busy ? "Entrando..." : "Entrar"}</button></div></div>`;
}

function listView() {
  const rows = A.list.map((s) => `<tr><td><b>${esc(s.razon_social || "Sin nombre")}</b><div class="note" style="margin:2px 0 0">${esc(s.tema || "")}</div></td><td>${s.fecha ? isoToEs(s.fecha) : "-"}</td><td>${s.completados} de ${s.total}</td><td><b>${esc(s.codigo)}</b></td><td><button class="btn sm" data-act="open" data-code="${esc(s.codigo)}">Abrir</button></td></tr>`).join("");
  return `<div class="card"><div class="eyebrow">Administración</div><h1>Tus capacitaciones</h1>
  ${A.msg ? `<div class="save-note" role="status">${esc(A.msg)}</div>` : ""}${A.err ? `<p class="ferr" role="alert">${esc(A.err)}</p>` : ""}
  <div class="row"><button class="btn" data-act="new">Nueva capacitación</button><button class="btn alt" data-act="admins">Administradores</button><button class="btn alt" data-act="logout">Salir del panel</button></div>
  ${A.list.length ? `<div style="overflow-x:auto;margin-top:16px"><table class="tbl"><thead><tr><th>Empresa y tema</th><th>Fecha</th><th>Firmaron</th><th>Código</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>` : `<p class="note" style="margin-top:16px">Todavía no creaste ninguna capacitación.</p>`}</div>`;
}

function adminsView() {
  const rows = A.admins.map((d) => `<tr><td>${esc(d)}${d === A.dni ? ' <span class="tag ok">Tú</span>' : ""}</td><td><div class="acts"><button class="btn danger sm" data-act="rmadmin" data-dni="${esc(d)}" ${A.admins.length <= 1 ? "disabled" : ""}>Quitar</button></div></td></tr>`).join("");
  return `<div class="card"><div class="eyebrow">Administración</div><h1>Administradores</h1>
  <p class="note" style="margin:0 0 12px">Cada administrador entra al panel con su DNI y puede crear capacitaciones, agregar trabajadores y agregar o quitar administradores.</p>
  ${A.msg ? `<div class="save-note" role="status">${esc(A.msg)}</div>` : ""}${A.err ? `<p class="ferr" role="alert">${esc(A.err)}</p>` : ""}
  <div class="row"><button class="btn alt sm" data-act="tolist">Volver a la lista</button></div>
  <div class="grid2" style="margin-top:14px"><div>${fldRaw("n-admin", "DNI del nuevo administrador", "", "8 dígitos", "text", 'inputmode="numeric" maxlength="8" autocomplete="off"')}
  <div class="row" style="margin-top:8px"><button class="btn sm" data-act="addadmin">Agregar administrador</button></div></div></div>
  <div style="overflow-x:auto;margin-top:16px"><table class="tbl"><thead><tr><th>DNI</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}

function editView() {
  return `<div class="card"><div class="eyebrow">Administración</div><h1>${A.codigo ? "Capacitación " + esc(A.codigo) : "Nueva capacitación"}</h1>
  ${A.msg ? `<div class="save-note" role="status">${esc(A.msg)}</div>` : ""}${A.err ? `<p class="ferr" role="alert">${esc(A.err)}</p>` : ""}
  <div class="row" style="margin-top:8px"><button class="btn alt sm" data-act="tolist">Volver a la lista</button></div></div>
  ${formHtml()}${A.codigo ? sessionBlocks() : `<div class="card"><p class="note" style="margin:0">Cuando crees la capacitación vas a ver aquí el link para los trabajadores, la lista de DNI y la descarga del registro.</p></div>`}`;
}

export function render() {
  const m = $("#main");
  const view = { login: loginView, list: listView, admins: adminsView, edit: editView }[A.view]();
  m.innerHTML = `<div class="adm">${view}</div>`;
  respPad = null;
  if (A.view === "edit") {
    respPad = new SignaturePad($("#rsPad"), $("#rsPh"));
    requestAnimationFrame(() => { if (respPad.init() && A.form.resp_firma) respPad.load(A.form.resp_firma); });
  }
}

/* ---------- Acciones ---------- */
async function guard(fn) {
  try { return await fn(); }
  catch (e) {
    const code = e instanceof ApiError ? e.code : "";
    if (code === "no_admin") {
      if (A.view !== "login") { A.dni = null; ssDel("ml-fen:dni"); A.view = "login"; }
    }
    A.err = errText(e); A.busy = false; render();
    return undefined;
  }
}

async function login() {
  const dni = ($("#dni").value || "").replace(/\D/g, "");
  if (!/^\d{8}$/.test(dni)) { A.err = "Escribe un DNI de 8 números."; render(); return; }
  A.busy = true; A.err = ""; render();
  const list = await guard(() => api.admin.listar(dni));
  A.busy = false;
  if (!list) return;
  A.dni = dni; ssSet("ml-fen:dni", dni);
  A.list = list; A.view = "list"; A.err = ""; A.msg = "";
  render();
}

async function refreshList() {
  const list = await guard(() => api.admin.listar(A.dni));
  if (list) A.list = list;
}

async function loadAdmins() {
  const admins = await guard(() => api.admin.listarAdmins(A.dni));
  if (admins) A.admins = admins;
  return admins;
}

async function openAdmins() {
  A.err = ""; A.msg = "";
  if (await loadAdmins()) { A.view = "admins"; render(); window.scrollTo({ top: 0 }); }
}

async function addAdmin() {
  const dni = ($("#n-admin").value || "").replace(/\D/g, "");
  if (!/^\d{8}$/.test(dni)) { toast("Escribe un DNI de 8 números"); return; }
  A.err = "";
  const r = await guard(() => api.admin.agregarAdmin(A.dni, dni));
  if (!r) return;
  A.msg = `DNI ${dni} agregado como administrador.`;
  await loadAdmins();
  render();
}

async function removeAdmin(dni) {
  const esMio = dni === A.dni;
  if (!window.confirm(`¿Quitar el permiso de administrador al DNI ${dni}?${esMio ? " Como es tu DNI, saldrás del panel." : ""}`)) return;
  A.err = "";
  const r = await guard(() => api.admin.quitarAdmin(A.dni, dni));
  if (!r) return;
  if (esMio) { A.dni = null; ssDel("ml-fen:dni"); A.view = "login"; A.msg = ""; render(); return; }
  A.msg = `DNI ${dni} quitado de administradores.`;
  await loadAdmins();
  render();
}

async function openSession(code) {
  A.err = ""; A.msg = "";
  const r = await guard(() => api.admin.obtener(A.dni, code));
  if (!r) return;
  const s = r.sesion;
  A.codigo = s.codigo;
  A.form = { ...emptyForm(), ...Object.fromEntries(Object.keys(emptyForm()).map((k) => [k, s[k] == null ? "" : String(s[k])])) };
  A.asist = r.asistentes || [];
  A.editDni = null; A.view = "edit";
  render();
}

async function reloadAsist(keepMsg) {
  collectForm();
  const r = await guard(() => api.admin.obtener(A.dni, A.codigo));
  if (!r) return;
  A.asist = r.asistentes || [];
  if (!keepMsg) A.msg = "";
  render();
}

function validateForm() {
  const f = A.form;
  if (!f.razon_social) return "Escribe la razón social.";
  if (f.ruc && !/^\d{11}$/.test(f.ruc)) return "El RUC debe tener 11 números.";
  if (f.n_trabajadores && !/^\d+$/.test(f.n_trabajadores)) return "El número de trabajadores debe ser un número.";
  if (!f.tema) return "Escribe el tema.";
  return "";
}

async function save() {
  collectForm();
  const v = validateForm();
  if (v) { A.err = v; A.msg = ""; render(); window.scrollTo({ top: 0 }); return; }
  A.busy = true; A.err = ""; render();
  const r = await guard(async () => {
    if (A.codigo) { await api.admin.actualizar(A.dni, A.codigo, A.form); return A.codigo; }
    return api.admin.crear(A.dni, A.form);
  });
  A.busy = false;
  if (!r) return;
  const wasNew = !A.codigo;
  A.codigo = r;
  A.msg = wasNew ? "Capacitación creada. Ahora agrega a los trabajadores y comparte el link." : "Cambios guardados.";
  render();
  window.scrollTo({ top: 0 });
}

function parseBulk(raw) {
  const items = [], bad = [];
  raw.split(/\r?\n/).forEach((line) => {
    const t = line.trim();
    if (!t) return;
    const sep = t.includes("\t") ? "\t" : t.includes(";") ? ";" : ",";
    const parts = t.split(sep).map((x) => x.trim());
    const dni = parts[0].replace(/\D/g, "");
    if (!/^\d{8}$/.test(dni) || !parts[1]) { bad.push(t); return; }
    items.push({ dni, nombre: parts[1], area: parts.slice(2).join(", ") });
  });
  return { items, bad };
}

async function addMany(items) {
  collectForm();
  const r = await guard(() => api.admin.lote(A.dni, A.codigo, items));
  if (!r) return;
  if (r.errores && r.errores.length) A.err = "No se pudieron agregar: " + r.errores.join("; ");
  A.msg = r.agregados ? `${r.agregados} ${r.agregados === 1 ? "persona agregada" : "personas agregadas"}.` : "";
  await reloadAsist(true);
}

async function download(kind) {
  collectForm();
  const btn = document.querySelector(`[data-act="${kind}"]`);
  const old = btn.textContent;
  btn.disabled = true; btn.textContent = "Generando...";
  try {
    const f = A.form;
    const [logo, rfirma] = await Promise.all([imageSize(f.logo), imageSize(f.resp_firma)]);
    const sel = A.asist.filter((a) => a.completado || A.incluirPend);
    const filas = await Promise.all(sel.map(async (a) => ({
      nombre: a.nombre, dni: a.dni, area: a.area,
      firma: a.completado && a.firma ? await imageSize(a.firma) : null,
      obs: a.completado ? `Completó. Aciertos a la primera: ${a.puntos} de ${TOTAL_CASES}.` : "Pendiente",
    })));
    const D = {
      logo, codigo: f.codigo_doc, version: f.version_doc,
      emp: { razon: f.razon_social, ruc: f.ruc, dom: f.domicilio, act: f.actividad, trab: f.n_trabajadores },
      tipo: f.tipo, tema: f.tema, fecha: isoToEs(f.fecha), capacitador: f.capacitador, horas: f.horas,
      filas, resp: { nombre: f.resp_nombre, cargo: f.resp_cargo, fecha: isoToEs(f.resp_fecha), firma: rfirma },
    };
    const blob = kind === "pdf" ? await buildPdf(D) : await buildXlsx(D);
    saveFile(`Registro-capacitacion-${A.codigo}-${fileStamp()}.${kind === "pdf" ? "pdf" : "xlsx"}`, blob);
    toast(kind === "pdf" ? "PDF generado" : "Excel generado");
  } catch (e) {
    toast(e && e.message === "lib" ? "No se cargó la librería del archivo. Revisa tu conexión." : "No se pudo generar el archivo. Intenta de nuevo.");
  }
  btn.disabled = false; btn.textContent = old;
}

async function onClick(e) {
  const el = e.target.closest("[data-act]");
  if (!el) return;
  const act = el.dataset.act;
  switch (act) {
    case "login": return login();
    case "admins": return openAdmins();
    case "addadmin": return addAdmin();
    case "rmadmin": return removeAdmin(el.dataset.dni);
    case "logout": A.dni = null; ssDel("ml-fen:dni"); A.view = "login"; A.err = ""; A.msg = ""; return render();
    case "new": A.codigo = null; A.form = emptyForm(); A.asist = []; A.err = ""; A.msg = ""; A.view = "edit"; render(); return window.scrollTo({ top: 0 });
    case "open": await openSession(el.dataset.code); return window.scrollTo({ top: 0 });
    case "tolist": collectForm(); await refreshList(); A.view = "list"; A.err = ""; render(); return;
    case "save": return save();
    case "logodel": collectForm(); A.form.logo = ""; return render();
    case "rsclr": if (respPad) respPad.clear(); A.form.resp_firma = ""; return;
    case "copy": try { await navigator.clipboard.writeText(linkUrl()); toast("Link copiado"); } catch (err) { toast("Copia el link manualmente"); } return;
    case "reload": return reloadAsist();
    case "addone": {
      const dni = ($("#n-dni").value || "").replace(/\D/g, ""), nombre = ($("#n-nombre").value || "").trim(), area = ($("#n-area").value || "").trim();
      if (!/^\d{8}$/.test(dni)) { toast("Escribe un DNI de 8 números"); return; }
      if (!nombre) { toast("Escribe los apellidos y nombres"); return; }
      A.err = "";
      return addMany([{ dni, nombre, area }]);
    }
    case "addbulk": {
      A.err = "";
      const { items, bad } = parseBulk($("#bulk").value || "");
      if (!items.length && !bad.length) { toast("Pega al menos una línea"); return; }
      if (bad.length) { A.err = "Estas líneas no tienen DNI de 8 números y nombre: " + bad.slice(0, 3).join(" | ") + (bad.length > 3 ? "..." : ""); }
      if (!items.length) { render(); return; }
      return addMany(items);
    }
    case "eedit": collectForm(); A.editDni = el.dataset.dni; return render();
    case "ecancel": A.editDni = null; return render();
    case "esave": {
      const nombre = ($("#e-nombre").value || "").trim(), area = ($("#e-area").value || "").trim();
      if (!nombre) { toast("Escribe el nombre"); return; }
      collectForm();
      const r = await guard(() => api.admin.editar(A.dni, A.codigo, el.dataset.dni, nombre, area));
      if (!r) return;
      A.editDni = null; A.msg = "Datos actualizados."; return reloadAsist(true);
    }
    case "ereset": {
      if (!window.confirm(`¿Reiniciar el avance y la firma de ${el.dataset.name}? Tendrá que volver a empezar.`)) return;
      collectForm();
      const r = await guard(() => api.admin.reiniciar(A.dni, A.codigo, el.dataset.dni));
      if (!r) return;
      A.msg = "Avance reiniciado."; return reloadAsist(true);
    }
    case "edel": {
      if (!window.confirm(`¿Quitar a ${el.dataset.name} de la lista? Se borra su avance y su firma.`)) return;
      collectForm();
      const r = await guard(() => api.admin.eliminarAsistente(A.dni, A.codigo, el.dataset.dni));
      if (!r) return;
      A.msg = "Persona quitada de la lista."; return reloadAsist(true);
    }
    case "delses": {
      if (!window.confirm("¿Eliminar esta capacitación con su lista y sus firmas? No se puede deshacer.")) return;
      const r = await guard(() => api.admin.eliminarSesion(A.dni, A.codigo));
      if (!r) return;
      await refreshList(); A.view = "list"; A.codigo = null; A.msg = "Capacitación eliminada."; A.err = ""; render(); return;
    }
    case "pdf": return download("pdf");
    case "xlsx": return download("xlsx");
  }
}

async function onChange(e) {
  if (e.target.id === "inLogo") {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    try {
      const img = await readLogoFile(file);
      collectForm(); A.form.logo = img.url; render();
    } catch (err) {
      toast(err.message === "grande" ? "El logo pesa más de 8 MB. Usa una imagen más liviana." : "No se pudo leer esa imagen. Prueba con PNG o JPG.");
    }
  }
}

export async function initAdmin() {
  document.body.classList.add("admin");
  $("#brand").innerHTML = `<span class="lt">Panel del capacitador</span>`;
  $("#prog").hidden = true; $("#navrow").style.display = "none"; $("#starsbox").style.display = "none"; $("#snd").style.display = "none";
  document.title = "Panel del capacitador · Microlearning FEN";
  const main = $("#main");
  main.addEventListener("click", onClick);
  main.addEventListener("change", onChange);
  main.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.id === "dni") { e.preventDefault(); login(); } });
  const saved = ssGet("ml-fen:dni");
  if (saved) {
    const list = await (async () => { try { return await api.admin.listar(saved); } catch (e) { return null; } })();
    if (list) { A.dni = saved; A.list = list; A.view = "list"; }
  }
  render();
  window.A = A;
}

/*
 * Capa de datos. Con las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY usa Supabase (funciones RPC ml_*).
 * Sin ellas funciona en modo demostración: todo queda en el navegador y la clave de administrador es "demo".
 */
import { lsGet, lsSet } from "./util.js";

const URL_ = import.meta.env.VITE_SUPABASE_URL;
const KEY_ = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const isDemo = !(URL_ && KEY_);

export class ApiError extends Error {
  constructor(code, detail) {
    super(code);
    this.code = code;
    this.detail = detail || "";
  }
}

/* ---------- Supabase ---------- */
let sbPromise = null;
function sb() {
  if (!sbPromise) {
    sbPromise = import("@supabase/supabase-js").then(({ createClient }) => createClient(URL_, KEY_));
  }
  return sbPromise;
}
async function rpc(fn, args) {
  let res;
  try {
    const c = await sb();
    res = await c.rpc(fn, args);
  } catch (e) {
    throw new ApiError("red", e && e.message);
  }
  if (res.error) throw new ApiError("red", res.error.message);
  const d = res.data;
  if (d && typeof d === "object" && !Array.isArray(d) && d.error) throw new ApiError(d.error);
  return d;
}

const remote = {
  obtenerSesion: (codigo) => rpc("ml_obtener_sesion", { p_codigo: codigo }),
  entrar: (codigo, dni) => rpc("ml_entrar", { p_codigo: codigo, p_dni: dni }),
  guardarAvance: (codigo, dni, estado, puntos, avance) =>
    rpc("ml_guardar_avance", { p_codigo: codigo, p_dni: dni, p_estado: estado, p_puntos: puntos, p_avance: avance }),
  firmar: (codigo, dni, firma, estado, puntos) =>
    rpc("ml_firmar", { p_codigo: codigo, p_dni: dni, p_firma: firma, p_estado: estado, p_puntos: puntos }),
  admin: {
    estado: async () => (await rpc("ml_admin_estado", {})).tiene_clave,
    definirClave: (clave) => rpc("ml_admin_definir_clave", { p_clave: clave }),
    cambiarClave: (clave, nueva) => rpc("ml_admin_cambiar_clave", { p_clave: clave, p_nueva: nueva }),
    listar: async (clave) => (await rpc("ml_admin_listar", { p_clave: clave })).sesiones,
    crear: async (clave, datos) => (await rpc("ml_admin_crear", { p_clave: clave, p_datos: datos })).codigo,
    actualizar: (clave, codigo, datos) => rpc("ml_admin_actualizar", { p_clave: clave, p_codigo: codigo, p_datos: datos }),
    obtener: (clave, codigo) => rpc("ml_admin_obtener", { p_clave: clave, p_codigo: codigo }),
    lote: (clave, codigo, lista) => rpc("ml_admin_asistentes_lote", { p_clave: clave, p_codigo: codigo, p_lista: lista }),
    editar: (clave, codigo, dni, nombre, area) =>
      rpc("ml_admin_editar_asistente", { p_clave: clave, p_codigo: codigo, p_dni: dni, p_nombre: nombre, p_area: area }),
    reiniciar: (clave, codigo, dni) => rpc("ml_admin_reiniciar_asistente", { p_clave: clave, p_codigo: codigo, p_dni: dni }),
    eliminarAsistente: (clave, codigo, dni) => rpc("ml_admin_eliminar_asistente", { p_clave: clave, p_codigo: codigo, p_dni: dni }),
    eliminarSesion: (clave, codigo) => rpc("ml_admin_eliminar_sesion", { p_clave: clave, p_codigo: codigo }),
  },
};

/* ---------- Modo demostración (localStorage) ---------- */
const DB_KEY = "ml-fen:demo-db:v1";
const DEMO_CLAVE = "demo";
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function loadDb() {
  try { return JSON.parse(lsGet(DB_KEY)) || { sesiones: {} }; } catch (e) { return { sesiones: {} }; }
}
function saveDb(db) { lsSet(DB_KEY, JSON.stringify(db)); }
function chk(clave) { if (clave !== DEMO_CLAVE) throw new ApiError("clave"); }
const up = (c) => String(c || "").trim().toUpperCase();
const clean = (v, n) => String(v ?? "").trim().slice(0, n);
const now = () => new Date().toISOString();

const DATOS_KEYS = ["razon_social", "ruc", "domicilio", "actividad", "n_trabajadores", "logo", "codigo_doc", "version_doc",
  "tipo", "tema", "fecha", "capacitador", "horas", "resp_nombre", "resp_cargo", "resp_fecha", "resp_firma"];
function aplicarDatos(s, d) {
  const lim = { razon_social: 200, ruc: 20, domicilio: 300, actividad: 200, n_trabajadores: 12, codigo_doc: 40, version_doc: 30,
    tema: 300, capacitador: 150, horas: 12, resp_nombre: 150, resp_cargo: 150 };
  DATOS_KEYS.forEach((k) => {
    const v = d[k];
    if (["logo", "resp_firma", "fecha", "resp_fecha"].includes(k)) s[k] = v ? String(v) : null;
    else if (k === "tipo") s[k] = v || "capacitacion";
    else s[k] = clean(v, lim[k] || 100);
  });
  s.actualizado_en = now();
}

const demo = {
  async obtenerSesion(codigo) {
    const s = loadDb().sesiones[up(codigo)];
    return s ? { codigo: s.codigo, razon_social: s.razon_social, tema: s.tema, fecha: s.fecha, logo: s.logo } : null;
  },
  async entrar(codigo, dni) {
    const s = loadDb().sesiones[up(codigo)];
    const a = s && s.asist[dni];
    if (!a) return null;
    return { dni: a.dni, nombre: a.nombre, area: a.area, estado: a.estado || null, puntos: a.puntos, avance: a.avance, completado: a.completado };
  },
  async guardarAvance(codigo, dni, estado, puntos, avance) {
    const db = loadDb(), s = db.sesiones[up(codigo)], a = s && s.asist[dni];
    if (!a || a.completado) return "sin_cambios";
    a.estado = estado; a.puntos = Math.max(0, puntos | 0); a.avance = Math.min(99, Math.max(0, avance | 0));
    a.iniciado_en = a.iniciado_en || now(); a.actualizado_en = now();
    saveDb(db);
    return "ok";
  },
  async firmar(codigo, dni, firma, estado, puntos) {
    const db = loadDb(), s = db.sesiones[up(codigo)], a = s && s.asist[dni];
    if (!a) return "no_encontrado";
    if (!firma || !String(firma).startsWith("data:image/png;base64,")) return "firma_invalida";
    if (a.completado) return "sin_cambios";
    a.firma = firma; a.estado = estado; a.puntos = Math.max(0, puntos | 0); a.avance = 100; a.completado = true;
    a.iniciado_en = a.iniciado_en || now(); a.actualizado_en = now(); a.completado_en = a.completado_en || now();
    saveDb(db);
    return "ok";
  },
  admin: {
    async estado() { return true; },
    async definirClave() { throw new ApiError("ya_definida"); },
    async cambiarClave() { throw new ApiError("demo"); },
    async listar(clave) {
      chk(clave);
      const db = loadDb();
      return Object.values(db.sesiones)
        .sort((x, y) => (y.creado_en || "").localeCompare(x.creado_en || ""))
        .map((s) => {
          const as = Object.values(s.asist);
          return { codigo: s.codigo, razon_social: s.razon_social, tema: s.tema, fecha: s.fecha, creado_en: s.creado_en,
            total: as.length, completados: as.filter((a) => a.completado).length };
        });
    },
    async crear(clave, datos) {
      chk(clave);
      const db = loadDb();
      let codigo;
      do {
        codigo = Array.from({ length: 6 }, () => ALFABETO[Math.floor(Math.random() * ALFABETO.length)]).join("");
      } while (db.sesiones[codigo]);
      const s = { codigo, creado_en: now(), asist: {} };
      aplicarDatos(s, datos);
      db.sesiones[codigo] = s;
      saveDb(db);
      return codigo;
    },
    async actualizar(clave, codigo, datos) {
      chk(clave);
      const db = loadDb(), s = db.sesiones[up(codigo)];
      if (!s) throw new ApiError("no_encontrado");
      aplicarDatos(s, datos);
      saveDb(db);
      return { codigo: s.codigo };
    },
    async obtener(clave, codigo) {
      chk(clave);
      const s = loadDb().sesiones[up(codigo)];
      if (!s) throw new ApiError("no_encontrado");
      const { asist, ...sesion } = s;
      const asistentes = Object.values(asist)
        .sort((x, y) => x.nombre.localeCompare(y.nombre, "es"))
        .map((a) => ({ dni: a.dni, nombre: a.nombre, area: a.area, puntos: a.puntos, avance: a.avance, completado: a.completado,
          firma: a.firma || null, iniciado_en: a.iniciado_en || null, actualizado_en: a.actualizado_en || null, completado_en: a.completado_en || null }));
      return { sesion, asistentes };
    },
    async lote(clave, codigo, lista) {
      chk(clave);
      const db = loadDb(), s = db.sesiones[up(codigo)];
      if (!s) throw new ApiError("no_encontrado");
      let agregados = 0;
      const errores = [];
      (lista || []).forEach((it) => {
        if (!/^\d{8}$/.test(it.dni || "")) { errores.push("DNI inválido: " + (it.dni || "vacío")); return; }
        if (!String(it.nombre || "").trim()) { errores.push("Falta el nombre del DNI " + it.dni); return; }
        const prev = s.asist[it.dni] || { dni: it.dni, puntos: 0, avance: 0, completado: false, estado: null };
        s.asist[it.dni] = { ...prev, nombre: clean(it.nombre, 150), area: clean(it.area, 100) };
        agregados++;
      });
      saveDb(db);
      return { agregados, errores };
    },
    async editar(clave, codigo, dni, nombre, area) {
      chk(clave);
      const db = loadDb(), a = (db.sesiones[up(codigo)] || { asist: {} }).asist[dni];
      if (!a) throw new ApiError("no_encontrado");
      if (!String(nombre || "").trim()) throw new ApiError("nombre");
      a.nombre = clean(nombre, 150); a.area = clean(area, 100);
      saveDb(db);
      return { ok: true };
    },
    async reiniciar(clave, codigo, dni) {
      chk(clave);
      const db = loadDb(), a = (db.sesiones[up(codigo)] || { asist: {} }).asist[dni];
      if (!a) throw new ApiError("no_encontrado");
      Object.assign(a, { estado: null, puntos: 0, avance: 0, completado: false, firma: null, iniciado_en: null, actualizado_en: null, completado_en: null });
      saveDb(db);
      return { ok: true };
    },
    async eliminarAsistente(clave, codigo, dni) {
      chk(clave);
      const db = loadDb(), s = db.sesiones[up(codigo)];
      if (!s || !s.asist[dni]) throw new ApiError("no_encontrado");
      delete s.asist[dni];
      saveDb(db);
      return { ok: true };
    },
    async eliminarSesion(clave, codigo) {
      chk(clave);
      const db = loadDb();
      if (!db.sesiones[up(codigo)]) throw new ApiError("no_encontrado");
      delete db.sesiones[up(codigo)];
      saveDb(db);
      return { ok: true };
    },
  },
};

export const api = isDemo ? demo : remote;

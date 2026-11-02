/*
 * Capa de datos. Con las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY usa Supabase (funciones RPC ml_*).
 * Sin ellas funciona en modo demostración: todo queda en el navegador y los administradores son los de ADMINS_INICIALES.
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
    listar: async (dni) => (await rpc("ml_admin_listar", { p_admin_dni: dni })).sesiones,
    listarAdmins: async (dni) => (await rpc("ml_admin_listar_admins", { p_admin_dni: dni })).admins,
    agregarAdmin: (dni, nuevo) => rpc("ml_admin_agregar_admin", { p_admin_dni: dni, p_nuevo_dni: nuevo }),
    quitarAdmin: (dni, objetivo) => rpc("ml_admin_quitar_admin", { p_admin_dni: dni, p_dni: objetivo }),
    crear: async (dni, datos) => (await rpc("ml_admin_crear", { p_admin_dni: dni, p_datos: datos })).codigo,
    actualizar: (dni, codigo, datos) => rpc("ml_admin_actualizar", { p_admin_dni: dni, p_codigo: codigo, p_datos: datos }),
    obtener: (dni, codigo) => rpc("ml_admin_obtener", { p_admin_dni: dni, p_codigo: codigo }),
    lote: (dni, codigo, lista) => rpc("ml_admin_asistentes_lote", { p_admin_dni: dni, p_codigo: codigo, p_lista: lista }),
    editar: (dni, codigo, asistenteDni, nombre, area) =>
      rpc("ml_admin_editar_asistente", { p_admin_dni: dni, p_codigo: codigo, p_dni: asistenteDni, p_nombre: nombre, p_area: area }),
    reiniciar: (dni, codigo, asistenteDni) =>
      rpc("ml_admin_reiniciar_asistente", { p_admin_dni: dni, p_codigo: codigo, p_dni: asistenteDni }),
    eliminarAsistente: (dni, codigo, asistenteDni) =>
      rpc("ml_admin_eliminar_asistente", { p_admin_dni: dni, p_codigo: codigo, p_dni: asistenteDni }),
    eliminarSesion: (dni, codigo) => rpc("ml_admin_eliminar_sesion", { p_admin_dni: dni, p_codigo: codigo }),
  },
};

/* ---------- Modo demostración (localStorage) ---------- */
const DB_KEY = "ml-fen:demo-db:v1";
const ADMINS_INICIALES = ["40667929"];
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function loadDb() {
  try {
    const d = JSON.parse(lsGet(DB_KEY)) || {};
    return { sesiones: d.sesiones || {}, admins: d.admins || [...ADMINS_INICIALES] };
  } catch (e) {
    return { sesiones: {}, admins: [...ADMINS_INICIALES] };
  }
}
function saveDb(db) { lsSet(DB_KEY, JSON.stringify(db)); }
function chk(dni) { if (!loadDb().admins.includes(dni)) throw new ApiError("no_admin"); }
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
    async listar(dni) {
      chk(dni);
      const db = loadDb();
      return Object.values(db.sesiones)
        .sort((x, y) => (y.creado_en || "").localeCompare(x.creado_en || ""))
        .map((s) => {
          const as = Object.values(s.asist);
          return { codigo: s.codigo, razon_social: s.razon_social, tema: s.tema, fecha: s.fecha, creado_en: s.creado_en,
            total: as.length, completados: as.filter((a) => a.completado).length };
        });
    },
    async listarAdmins(dni) {
      chk(dni);
      return [...loadDb().admins];
    },
    async agregarAdmin(dni, nuevo) {
      chk(dni);
      if (!/^\d{8}$/.test(nuevo || "")) throw new ApiError("dni");
      const db = loadDb();
      if (!db.admins.includes(nuevo)) db.admins.push(nuevo);
      saveDb(db);
      return { ok: true };
    },
    async quitarAdmin(dni, objetivo) {
      chk(dni);
      const db = loadDb();
      if (!db.admins.includes(objetivo)) throw new ApiError("no_encontrado");
      if (db.admins.length <= 1) throw new ApiError("ultimo_admin");
      db.admins = db.admins.filter((d) => d !== objetivo);
      saveDb(db);
      return { ok: true };
    },
    async crear(dni, datos) {
      chk(dni);
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
    async actualizar(dni, codigo, datos) {
      chk(dni);
      const db = loadDb(), s = db.sesiones[up(codigo)];
      if (!s) throw new ApiError("no_encontrado");
      aplicarDatos(s, datos);
      saveDb(db);
      return { codigo: s.codigo };
    },
    async obtener(dni, codigo) {
      chk(dni);
      const s = loadDb().sesiones[up(codigo)];
      if (!s) throw new ApiError("no_encontrado");
      const { asist, ...sesion } = s;
      const asistentes = Object.values(asist)
        .sort((x, y) => x.nombre.localeCompare(y.nombre, "es"))
        .map((a) => ({ dni: a.dni, nombre: a.nombre, area: a.area, puntos: a.puntos, avance: a.avance, completado: a.completado,
          firma: a.firma || null, iniciado_en: a.iniciado_en || null, actualizado_en: a.actualizado_en || null, completado_en: a.completado_en || null }));
      return { sesion, asistentes };
    },
    async lote(dni, codigo, lista) {
      chk(dni);
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
    async editar(dni, codigo, asistenteDni, nombre, area) {
      chk(dni);
      const db = loadDb(), a = (db.sesiones[up(codigo)] || { asist: {} }).asist[asistenteDni];
      if (!a) throw new ApiError("no_encontrado");
      if (!String(nombre || "").trim()) throw new ApiError("nombre");
      a.nombre = clean(nombre, 150); a.area = clean(area, 100);
      saveDb(db);
      return { ok: true };
    },
    async reiniciar(dni, codigo, asistenteDni) {
      chk(dni);
      const db = loadDb(), a = (db.sesiones[up(codigo)] || { asist: {} }).asist[asistenteDni];
      if (!a) throw new ApiError("no_encontrado");
      Object.assign(a, { estado: null, puntos: 0, avance: 0, completado: false, firma: null, iniciado_en: null, actualizado_en: null, completado_en: null });
      saveDb(db);
      return { ok: true };
    },
    async eliminarAsistente(dni, codigo, asistenteDni) {
      chk(dni);
      const db = loadDb(), s = db.sesiones[up(codigo)];
      if (!s || !s.asist[asistenteDni]) throw new ApiError("no_encontrado");
      delete s.asist[asistenteDni];
      saveDb(db);
      return { ok: true };
    },
    async eliminarSesion(dni, codigo) {
      chk(dni);
      const db = loadDb();
      if (!db.sesiones[up(codigo)]) throw new ApiError("no_encontrado");
      delete db.sesiones[up(codigo)];
      saveDb(db);
      return { ok: true };
    },
  },
};

export const api = isDemo ? demo : remote;

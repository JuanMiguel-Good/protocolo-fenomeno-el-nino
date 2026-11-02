/*
 * Registro de inducción, capacitación, entrenamiento y simulacros de emergencia (PDF y Excel).
 * Sigue el formato adjunto: encabezado, datos del empleador (1 a 5), marcar (6 a 9), tema, fecha,
 * capacitador, horas (10 a 13), lista de capacitados (14 a 18) y responsable del registro (19).
 */
import { loadScript } from "./util.js";

export const TITLE = "REGISTRO DE INDUCCIÓN, CAPACITACIÓN, ENTRENAMIENTO Y SIMULACROS DE EMERGENCIA";
const NOTE = "Referencia: Protocolo de Seguridad y Salud en el Trabajo ante el Fenómeno El Niño (MTPE, octubre 2026).";
const BAND = [221, 217, 196];
const BAND_HEX = "FFDDD9C4";
export const TIPOS = [
  { v: "induccion", n: 6, label: "INDUCCIÓN" },
  { v: "capacitacion", n: 7, label: "CAPACITACIÓN" },
  { v: "entrenamiento", n: 8, label: "ENTRENAMIENTO" },
  { v: "simulacro", n: 9, label: "SIMULACRO DE EMERGENCIA" },
];

/* ---------------- PDF ---------------- */
export async function buildPdf(D) {
  await loadScript(`${import.meta.env.BASE_URL}vendor/jspdf.umd.min.js`);
  const J = window.jspdf && window.jspdf.jsPDF;
  if (!J) throw new Error("lib");
  const doc = new J({ unit: "pt", format: "a4", compress: true });
  const PW = doc.internal.pageSize.getWidth(), PH = doc.internal.pageSize.getHeight();
  const M = 24, W = PW - 2 * M;
  let y = M;
  let inTable = false;
  doc.setLineWidth(0.7);
  doc.setDrawColor(0, 0, 0);

  const wrap = (txt, w, size, bold) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    return doc.splitTextToSize(String(txt === undefined || txt === null ? "" : txt), w - 10);
  };
  const hOf = (c, minH) => {
    const size = (c.o && c.o.size) || 8.5;
    const ls = wrap(c.txt, c.w, size, c.o && c.o.bold);
    return Math.max(minH || 0, ls.length * size * 1.22 + 10);
  };
  const cell = (x, w, h, txt, o = {}) => {
    const size = o.size || 8.5;
    if (o.fill) { doc.setFillColor(o.fill[0], o.fill[1], o.fill[2]); doc.rect(x, y, w, h, "FD"); }
    else doc.rect(x, y, w, h, "S");
    if (txt !== undefined && txt !== null && txt !== "") {
      const ls = wrap(txt, w, size, o.bold), lh = size * 1.22, th = ls.length * lh;
      const ty = o.valign === "top" ? y + 5 + size * 0.8 : y + (h - th) / 2 + size * 0.85;
      for (let i = 0; i < ls.length; i++) {
        const tx = o.align === "center" ? x + w / 2 : x + 5;
        doc.text(ls[i], tx, ty + i * lh, { align: o.align === "center" ? "center" : "left" });
      }
    }
  };
  const fit = (img, bw, bh) => { const sc = Math.min(bw / img.w, bh / img.h); return { w: img.w * sc, h: img.h * sc }; };
  const frac = (a) => { const out = []; let sum = 0; a.forEach((f, i) => { const w = i === a.length - 1 ? W - sum : W * f; out.push(w); sum += w; }); return out; };

  const header = () => {
    const HH = 50, wl = 100, wr = 130, wt = W - wl - wr;
    doc.rect(M, y, wl, HH, "S");
    if (D.logo) {
      const f = fit(D.logo, wl - 12, HH - 12);
      doc.addImage(D.logo.url, "PNG", M + (wl - f.w) / 2, y + (HH - f.h) / 2, f.w, f.h);
    } else {
      doc.setFont("helvetica", "bold"); doc.setFontSize(9);
      doc.text("LOGO", M + wl / 2, y + HH / 2 + 3, { align: "center" });
    }
    doc.rect(M + wl, y, wt, HH, "S");
    doc.setFont("helvetica", "bold"); doc.setFontSize(11);
    const tl = doc.splitTextToSize(TITLE, wt - 24), th = tl.length * 13;
    for (let i = 0; i < tl.length; i++) doc.text(tl[i], M + wl + wt / 2, y + (HH - th) / 2 + 10 + i * 13, { align: "center" });
    const lv = (x, w, h, label, value) => {
      doc.rect(x, y, w, h, "S");
      doc.setFont("helvetica", "bold"); doc.setFontSize(8.5);
      doc.text(label, x + 5, y + h / 2 + 3);
      const lw = doc.getTextWidth(label);
      doc.setFont("helvetica", "normal");
      doc.text((doc.splitTextToSize(String(value || ""), w - lw - 14)[0]) || "", x + 5 + lw + 3, y + h / 2 + 3);
    };
    lv(M + wl + wt, wr, HH / 2, "CÓDIGO:", D.codigo);
    y += HH / 2;
    lv(M + wl + wt, wr, HH / 2, "VERSIÓN:", D.version);
    y += HH / 2 + 6;
  };

  const tableHead = () => {
    const c = frac([0.34, 0.12, 0.16, 0.20, 0.18]);
    const o = { size: 7.5, bold: true, align: "center", fill: BAND };
    let x = M;
    const hh = 22;
    ["14. APELLIDOS Y NOMBRES DE LOS CAPACITADOS", "15. Nº DNI", "16. ÁREA", "17. FIRMA", "18. OBSERVACIONES"].forEach((t, i) => {
      cell(x, c[i], hh, t, o); x += c[i];
    });
    y += hh;
    return c;
  };

  const need = (h) => {
    if (y + h > PH - M - 16) {
      doc.addPage(); y = M;
      header();
      if (inTable) tableHead();
    }
  };
  const row = (cols, minH) => {
    let h = minH || 0;
    cols.forEach((c) => { h = Math.max(h, hOf(c, minH)); });
    need(h);
    let x = M;
    cols.forEach((c) => { cell(x, c.w, h, c.txt, c.o); x += c.w; });
    y += h;
  };
  const band = (txt, left) => row([{ w: W, txt, o: { bold: true, size: 8, align: left ? "left" : "center", fill: BAND } }], 14);

  header();
  band("DATOS DEL EMPLEADOR:", true);
  const cw = frac([0.22, 0.12, 0.30, 0.20, 0.16]);
  row([
    { w: cw[0], txt: "1. RAZÓN SOCIAL O DENOMINACIÓN SOCIAL", o: { size: 7, align: "center" } },
    { w: cw[1], txt: "2. RUC", o: { size: 7, align: "center" } },
    { w: cw[2], txt: "3. DOMICILIO (Dirección, distrito, departamento, provincia)", o: { size: 7, align: "center" } },
    { w: cw[3], txt: "4. ACTIVIDAD ECONÓMICA", o: { size: 7, align: "center" } },
    { w: cw[4], txt: "5. Nº TRABAJADORES EN EL CENTRO LABORAL", o: { size: 7, align: "center" } },
  ], 26);
  row([
    { w: cw[0], txt: D.emp.razon, o: { align: "center" } }, { w: cw[1], txt: D.emp.ruc, o: { align: "center" } },
    { w: cw[2], txt: D.emp.dom, o: { align: "center" } }, { w: cw[3], txt: D.emp.act, o: { align: "center" } },
    { w: cw[4], txt: D.emp.trab, o: { align: "center" } },
  ], 30);

  band("MARCAR (X)");
  const tw = frac([0.2, 0.25, 0.28, 0.27]);
  row(TIPOS.map((t, i) => ({ w: tw[i], txt: `${t.n}. ${t.label}`, o: { size: 7.5, bold: true, align: "center" } })), 16);
  row(TIPOS.map((t, i) => ({ w: tw[i], txt: D.tipo === t.v ? "X" : "", o: { size: 13, bold: true, align: "center" } })), 22);

  const lw = W * 0.26, vw = W - lw;
  const kv = (label, value, minH) => row([
    { w: lw, txt: label, o: { size: 8, bold: true, align: "center" } },
    { w: vw, txt: value, o: {} },
  ], minH);
  kv("10. TEMA:", D.tema, 26);
  kv("11. FECHA:", D.fecha, 20);
  kv("12. NOMBRE DEL CAPACITADOR O ENTRENADOR", D.capacitador, 26);
  kv("13. Nº HORAS", D.horas, 20);

  inTable = true;
  const tc = tableHead();
  const RH = 34;
  const filas = D.filas.length ? D.filas : [{}, {}, {}, {}, {}];
  filas.forEach((f) => {
    need(RH);
    let x = M;
    cell(x, tc[0], RH, f.nombre || "", { size: 8.5 }); x += tc[0];
    cell(x, tc[1], RH, f.dni || "", { size: 8.5, align: "center" }); x += tc[1];
    cell(x, tc[2], RH, f.area || "", { size: 8, align: "center" }); x += tc[2];
    cell(x, tc[3], RH, "", {});
    if (f.firma) {
      const fs = fit(f.firma, tc[3] - 12, RH - 8);
      doc.addImage(f.firma.url, "PNG", x + (tc[3] - fs.w) / 2, y + (RH - fs.h) / 2, fs.w, fs.h);
    }
    x += tc[3];
    const ob = f.obs || "";
    const obLines = doc.splitTextToSize(ob, tc[4] - 8);
    doc.setFont("helvetica", "normal"); doc.setFontSize(7);
    cell(x, tc[4], RH, "", {});
    const lines = obLines.slice(0, 3);
    lines.forEach((ln, i) => doc.text(ln, x + 4, y + (RH - lines.length * 8.5) / 2 + 7 + i * 8.5));
    y += RH;
  });
  inTable = false;

  need(14 + 66 + 24);
  band("19. RESPONSABLE DEL REGISTRO");
  const y0 = y, l1 = W * 0.34, l2 = W * 0.12, l3 = W - l1 - l2;
  const lv2 = (label, value, yy) => {
    doc.rect(M, yy, l1, 22, "S");
    doc.setFont("helvetica", "bold"); doc.setFontSize(8.5);
    doc.text(label, M + 5, yy + 14);
    const w = doc.getTextWidth(label);
    doc.setFont("helvetica", "normal");
    doc.text((doc.splitTextToSize(String(value || ""), l1 - w - 14)[0]) || "", M + 5 + w + 3, yy + 14);
  };
  lv2("Nombre:", D.resp.nombre, y0);
  lv2("Cargo:", D.resp.cargo, y0 + 22);
  lv2("Fecha:", D.resp.fecha, y0 + 44);
  y = y0;
  cell(M + l1, l2, 66, "Firma", { align: "center", size: 8.5 });
  doc.rect(M + l1 + l2, y0, l3, 66, "S");
  if (D.resp.firma) {
    const fs = fit(D.resp.firma, l3 - 16, 58);
    doc.addImage(D.resp.firma.url, "PNG", M + l1 + l2 + (l3 - fs.w) / 2, y0 + (66 - fs.h) / 2, fs.w, fs.h);
  }
  y = y0 + 66;

  doc.setFont("helvetica", "normal"); doc.setFontSize(6.5); doc.setTextColor(95, 105, 120);
  const nl = doc.splitTextToSize(NOTE, W);
  need(nl.length * 8 + 10);
  nl.forEach((t, i) => doc.text(t, M, y + 12 + i * 8));
  doc.setTextColor(0, 0, 0);

  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(95, 105, 120);
    doc.text(`Página ${p} de ${total}`, PW - M, PH - 12, { align: "right" });
    doc.setTextColor(0, 0, 0);
  }
  return doc.output("blob");
}

/* ---------------- Excel ---------------- */
export async function buildXlsx(D) {
  await loadScript(`${import.meta.env.BASE_URL}vendor/exceljs.min.js`);
  const EJ = window.ExcelJS;
  if (!EJ) throw new Error("lib");
  const wb = new EJ.Workbook();
  wb.creator = "Microlearning FEN";
  const ws = wb.addWorksheet("Registro", {
    views: [{ showGridLines: false }],
    pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 0,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 } },
  });
  const NC = 12, CW = 9.6;
  for (let i = 1; i <= NC; i++) ws.getColumn(i).width = CW;
  const thin = { style: "thin", color: { argb: "FF000000" } };
  const BR = { top: thin, left: thin, bottom: thin, right: thin };
  const est = (txt, span, size) => {
    const cap = Math.max(6, Math.floor(span * CW * 1.05 * (9 / (size || 9))));
    let lines = 0;
    String(txt || "").split("\n").forEach((p) => { lines += Math.max(1, Math.ceil(p.length / cap)); });
    return lines * ((size || 9) * 1.35) + 6;
  };
  const put = (r, c1, c2, val, o = {}) => {
    const r2 = o.r2 || r;
    if (c1 !== c2 || r !== r2) ws.mergeCells(r, c1, r2, c2);
    const cell = ws.getCell(r, c1);
    cell.value = val === undefined || val === null ? "" : val;
    cell.font = { name: "Arial", size: o.size || 9, bold: !!o.bold, color: { argb: o.color || "FF000000" } };
    cell.alignment = { horizontal: o.h || "left", vertical: o.v || "middle", wrapText: true };
    if (o.fill) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: o.fill } };
    if (o.text) cell.numFmt = "@";
    for (let rr = r; rr <= r2; rr++) for (let cc = c1; cc <= c2; cc++) ws.getCell(rr, cc).border = BR;
  };
  const setH = (r, min, items) => {
    let h = min || 18;
    (items || []).forEach((it) => { h = Math.max(h, est(it[0], it[1], it[2])); });
    ws.getRow(r).height = Math.min(h, 400);
  };
  const band = (r, txt, left) => {
    put(r, 1, NC, txt, { bold: true, size: 9, h: left ? "left" : "center", fill: BAND_HEX });
    ws.getRow(r).height = 18;
  };
  const fitPx = (img, bw, bh) => { const sc = Math.min(bw / img.w, bh / img.h); return { w: Math.round(img.w * sc), h: Math.round(img.h * sc) }; };
  const b64 = (url) => url.split(",")[1];

  ws.getRow(1).height = 30; ws.getRow(2).height = 30;
  put(1, 1, 2, D.logo ? "" : "LOGO", { r2: 2, bold: true, h: "center" });
  put(1, 3, 10, TITLE, { r2: 2, bold: true, size: 11, h: "center" });
  put(1, 11, 12, "CÓDIGO: " + (D.codigo || ""), { bold: true });
  put(2, 11, 12, "VERSIÓN: " + (D.version || ""), { bold: true });
  if (D.logo) {
    const id = wb.addImage({ base64: b64(D.logo.url), extension: "png" });
    const fl = fitPx(D.logo, 118, 74);
    ws.addImage(id, { tl: { col: 0.1, row: 0.1 }, ext: { width: fl.w, height: fl.h } });
  }

  band(3, "DATOS DEL EMPLEADOR:", true);
  put(4, 1, 3, "1. RAZÓN SOCIAL O DENOMINACIÓN SOCIAL", { size: 8, h: "center" });
  put(4, 4, 5, "2. RUC", { size: 8, h: "center" });
  put(4, 6, 8, "3. DOMICILIO (Dirección, distrito, departamento, provincia)", { size: 8, h: "center" });
  put(4, 9, 10, "4. ACTIVIDAD ECONÓMICA", { size: 8, h: "center" });
  put(4, 11, 12, "5. Nº TRABAJADORES EN EL CENTRO LABORAL", { size: 8, h: "center" });
  ws.getRow(4).height = 36;
  put(5, 1, 3, D.emp.razon, { h: "center" });
  put(5, 4, 5, D.emp.ruc, { h: "center", text: true });
  put(5, 6, 8, D.emp.dom, { h: "center" });
  put(5, 9, 10, D.emp.act, { h: "center" });
  put(5, 11, 12, D.emp.trab, { h: "center" });
  setH(5, 30, [[D.emp.razon, 3], [D.emp.dom, 3], [D.emp.act, 2]]);

  band(6, "MARCAR (X)");
  TIPOS.forEach((t, i) => {
    put(7, i * 3 + 1, i * 3 + 3, `${t.n}. ${t.label}`, { bold: true, size: 8, h: "center" });
    put(8, i * 3 + 1, i * 3 + 3, D.tipo === t.v ? "X" : "", { bold: true, size: 13, h: "center" });
  });
  ws.getRow(7).height = 22; ws.getRow(8).height = 24;

  const kv = (r, label, value) => {
    put(r, 1, 4, label, { bold: true, size: 8, h: "center" });
    put(r, 5, 12, value, {});
    setH(r, 22, [[value, 8]]);
  };
  kv(9, "10. TEMA:", D.tema);
  kv(10, "11. FECHA:", D.fecha);
  kv(11, "12. NOMBRE DEL CAPACITADOR O ENTRENADOR", D.capacitador);
  kv(12, "13. Nº HORAS", D.horas);

  const hdr = [[1, 4, "14. APELLIDOS Y NOMBRES DE LOS CAPACITADOS"], [5, 6, "15. Nº DNI"], [7, 8, "16. ÁREA"], [9, 10, "17. FIRMA"], [11, 12, "18. OBSERVACIONES"]];
  hdr.forEach(([a, b, t]) => put(13, a, b, t, { bold: true, size: 8, h: "center", fill: BAND_HEX }));
  ws.getRow(13).height = 26;

  let r = 14;
  const filas = D.filas.length ? D.filas : [{}, {}, {}, {}, {}];
  filas.forEach((f) => {
    put(r, 1, 4, f.nombre || "", {});
    put(r, 5, 6, f.dni || "", { h: "center", text: true });
    put(r, 7, 8, f.area || "", { h: "center", size: 8 });
    put(r, 9, 10, "", {});
    put(r, 11, 12, f.obs || "", { size: 8 });
    ws.getRow(r).height = 40;
    if (f.firma) {
      const sid = wb.addImage({ base64: b64(f.firma.url), extension: "png" });
      const fs = fitPx(f.firma, 2 * CW * 7 * 0.9, 46);
      ws.addImage(sid, { tl: { col: 8.1, row: r - 1 + 0.08 }, ext: { width: fs.w, height: fs.h } });
    }
    r++;
  });

  band(r, "19. RESPONSABLE DEL REGISTRO"); r++;
  const rs = r;
  put(rs, 1, 5, "Nombre: " + (D.resp.nombre || ""), {});
  put(rs + 1, 1, 5, "Cargo: " + (D.resp.cargo || ""), {});
  put(rs + 2, 1, 5, "Fecha: " + (D.resp.fecha || ""), {});
  put(rs, 6, 7, "Firma", { r2: rs + 2, h: "center" });
  put(rs, 8, 12, "", { r2: rs + 2 });
  for (let i = 0; i < 3; i++) ws.getRow(rs + i).height = 30;
  if (D.resp.firma) {
    const sid = wb.addImage({ base64: b64(D.resp.firma.url), extension: "png" });
    const fs = fitPx(D.resp.firma, 5 * CW * 7 * 0.9, 80);
    ws.addImage(sid, { tl: { col: 7.1, row: rs - 1 + 0.12 }, ext: { width: fs.w, height: fs.h } });
  }
  r = rs + 3;
  put(r, 1, NC, NOTE, { size: 7, color: "FF5F6978" });
  for (let i = 1; i <= NC; i++) ws.getCell(r, i).border = {};
  setH(r, 22, [[NOTE, 12, 7]]);
  ws.pageSetup.printArea = "A1:L" + r;

  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

export function saveFile(name, blob) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
}

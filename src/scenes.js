/* Escenas con zonas tocables y pictogramas. Mismo estilo visual del juego IPERC. */

export const hot = (id, x, y, w, h, label, inner) =>
  `<g class="hot" data-id="${id}" tabindex="0" role="button" aria-label="${label}">${inner}<rect class="hit" x="${x}" y="${y}" width="${w}" height="${h}" rx="16"/></g>`;

export const SCENES = {
  obra: {
    prompt: "Estás en una obra a mediodía. Toca a quien está más expuesto al calor.",
    hot: {
      carpa: { fb: "La sombra es un control. Busca a quien no está protegido." },
      agua: { fb: "El agua fresca es un control. Busca a quien no está protegido." },
      obrero: { ok: true },
    },
    svg: () => `<rect width="600" height="340" fill="#CFEBFF"/>
<rect y="236" width="600" height="104" fill="#F2D9A6"/><rect y="230" width="600" height="10" fill="#E3C98D"/>
<g stroke="#FFC845" stroke-width="8" stroke-linecap="round"><path d="M520 14v14M520 122v14M466 75h14M560 75h14M483 38l10 10M557 112l-10-10M557 38l-10 10M483 112l10-10"/></g><circle cx="520" cy="75" r="34" fill="#FFC845"/>
<rect x="468" y="196" width="62" height="40" rx="4" fill="#C9A27A"/><rect x="530" y="196" width="62" height="40" rx="4" fill="#B98F66"/><rect x="498" y="158" width="62" height="38" rx="4" fill="#D7B48A"/>
<path d="M280 214q10-12 20 0t20 0M300 196q10-12 20 0t20 0" stroke="#FFB84D" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>
${hot("carpa", 30, 88, 200, 104, "zona con sombra", `<rect x="44" y="130" width="8" height="106" fill="#8C6A4A"/><rect x="208" y="130" width="8" height="106" fill="#8C6A4A"/><path d="M28 132L130 86l102 46z" fill="#F2563F"/><path d="M62 118l22 14M96 100l16 32M130 86v46M164 100l-16 32M198 118l-22 14" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".9"/><rect x="28" y="228" width="204" height="10" fill="#D9BE86" opacity=".7"/><path d="M40 236h180" stroke="#C9A55F" stroke-width="3"/>`)}
${hot("agua", 106, 188, 56, 54, "garrafa de agua", `<rect x="116" y="196" width="38" height="44" rx="9" fill="#5DB8EC" stroke="#1B2A5B" stroke-width="3"/><rect x="127" y="188" width="16" height="10" rx="3" fill="#1B2A5B"/><path d="M122 210h26" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/>`)}
${hot("obrero", 318, 92, 118, 156, "trabajador al sol", `<circle cx="372" cy="118" r="17" fill="#F2C7A0" stroke="#1B2A5B" stroke-width="3"/><path d="M356 112q16-16 32 0" fill="#3B2F2F"/><path d="M350 140h44l6 62h-56z" fill="#44546A" stroke="#1B2A5B" stroke-width="3" stroke-linejoin="round"/><rect x="352" y="202" width="16" height="36" rx="4" fill="#2B3A55"/><rect x="376" y="202" width="16" height="36" rx="4" fill="#2B3A55"/><rect x="346" y="168" width="52" height="34" rx="4" fill="#C9A27A" stroke="#1B2A5B" stroke-width="3"/><path d="M394 120c4 6 4 10 0 14M396 108c3 4 3 8 0 11" stroke="#5DB8EC" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M350 112c-4 6-4 10 0 14" stroke="#5DB8EC" stroke-width="4" fill="none" stroke-linecap="round"/>`)}`,
  },

  almacen: {
    prompt: "Después de la lluvia entras a un almacén inundado. Toca el peligro más grave.",
    hot: {
      cajas: { fb: "Las cajas mojadas se pierden, pero no son la mayor amenaza. Sigue buscando." },
      ventana: { fb: "La ventana no es la fuente del peligro. Sigue buscando." },
      cable: { ok: true },
    },
    svg: () => `<rect width="600" height="340" fill="#EAF1FB"/><rect y="214" width="600" height="126" fill="#8FD0F2"/>
<path d="M0 232q25-10 50 0t50 0 50 0 50 0 50 0 50 0 50 0 50 0 50 0 50 0 50 0 50 0" stroke="#BFE6FF" stroke-width="5" fill="none"/>
<path d="M30 276q25-10 50 0t50 0 50 0M300 300q25-10 50 0t50 0 50 0 50 0" stroke="#BFE6FF" stroke-width="5" fill="none"/>
${hot("cajas", 28, 110, 170, 150, "cajas apiladas", `<rect x="40" y="222" width="150" height="14" fill="#8C6A4A"/><rect x="42" y="150" width="70" height="70" rx="4" fill="#D7B48A" stroke="#1B2A5B" stroke-width="3"/><rect x="114" y="170" width="74" height="50" rx="4" fill="#C9A27A" stroke="#1B2A5B" stroke-width="3"/><rect x="62" y="118" width="64" height="32" rx="4" fill="#D7B48A" stroke="#1B2A5B" stroke-width="3"/><path d="M77 150v-32M114 170v50M62 184h36" stroke="#A9774A" stroke-width="4"/>`)}
${hot("ventana", 228, 34, 140, 118, "ventana", `<rect x="240" y="44" width="116" height="96" rx="6" fill="#9FB0CB" stroke="#1B2A5B" stroke-width="5"/><path d="M298 44v96M240 92h116" stroke="#1B2A5B" stroke-width="4"/><path d="M256 58l-8 20M284 62l-8 20M320 58l-8 20M340 66l-8 20M262 104l-8 20M306 106l-8 20M338 108l-8 20" stroke="#5DB8EC" stroke-width="3.5" stroke-linecap="round"/>`)}
${hot("cable", 408, 56, 184, 236, "cable en el agua", `<rect x="452" y="52" width="46" height="62" rx="8" fill="#fff" stroke="#1B2A5B" stroke-width="4"/><rect x="465" y="68" width="6" height="14" rx="2" fill="#1B2A5B"/><rect x="479" y="68" width="6" height="14" rx="2" fill="#1B2A5B"/><path d="M475 114C475 160 520 170 506 226S452 268 436 262" stroke="#F5A623" stroke-width="10" fill="none" stroke-linecap="round"/><rect x="418" y="250" width="26" height="22" rx="5" fill="#1B2A5B"/><path d="M450 236l-12 20h13l-9 20M522 210l-10 18h12l-9 18" stroke="#F2563F" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`)}`,
  },

  lodo: {
    prompt: "Estás limpiando lodo después de una inundación. Toca el peligro que puede lastimarte.",
    hot: {
      botas: { fb: "Las botas son un control. Busca lo que puede lastimarte." },
      pala: { fb: "La pala es tu herramienta. Busca lo que puede lastimarte." },
      vidrio: { ok: true },
    },
    svg: () => `<rect width="600" height="340" fill="#CBEBFF"/><path d="M0 170q80-50 170-20t150-10 140 20 140-12V230H0z" fill="#B5D6B0"/>
<path d="M0 214q120-30 250-6t350-12V340H0z" fill="#8C6A4A"/><path d="M0 262q150-24 300-4t300-6V340H0z" fill="#7A5A3C"/>
<path d="M40 300q30-8 60 0t60 0M360 306q30-8 60 0t60 0" stroke="#6A4C31" stroke-width="5" fill="none" stroke-linecap="round"/>
${hot("botas", 50, 182, 116, 118, "botas de trabajo", `<path d="M62 196h30v54h30q16 4 16 22v10H62z" fill="#FFC845" stroke="#1B2A5B" stroke-width="4" stroke-linejoin="round"/><path d="M62 266h76" stroke="#1B2A5B" stroke-width="4"/><path d="M110 206h30v44h20q14 4 14 20v10h-64z" fill="#FFC845" stroke="#1B2A5B" stroke-width="4" stroke-linejoin="round" opacity=".92"/>`)}
${hot("vidrio", 240, 190, 150, 110, "objeto entre el lodo", `<path d="M280 262l26-52 30 56z" fill="#DCEFFC" stroke="#1B2A5B" stroke-width="4" stroke-linejoin="round"/><path d="M296 244l8-18" stroke="#fff" stroke-width="4" stroke-linecap="round"/><rect x="334" y="236" width="44" height="9" rx="3" fill="#E8EEF7" stroke="#1B2A5B" stroke-width="3" transform="rotate(-24 356 240)"/><path d="M372 224l16-8" stroke="#1B2A5B" stroke-width="3" stroke-linecap="round"/><path d="M330 254q40 8 60 22" stroke="#7A5A3C" stroke-width="12" fill="none" stroke-linecap="round" opacity=".6"/>`)}
${hot("pala", 440, 62, 130, 242, "pala", `<rect x="500" y="70" width="10" height="170" rx="4" fill="#A9774A" stroke="#1B2A5B" stroke-width="3" transform="rotate(8 505 150)"/><path d="M486 232l46-8 10 42q-24 18-54 8z" fill="#9FB0CB" stroke="#1B2A5B" stroke-width="4" stroke-linejoin="round"/><rect x="484" y="62" width="40" height="10" rx="4" fill="#1B2A5B" transform="rotate(8 505 66)"/>`)}`,
  },

  evacuacion: {
    prompt: "Suena la alarma de evacuación. Toca hacia dónde debes ir.",
    hot: {
      edificio: { fb: "Ahora la prioridad es llegar a la zona segura. El edificio queda atrás." },
      agua: { fb: "Esa zona se inunda. Busca un lugar alto y seguro." },
      zona: { ok: true },
    },
    svg: () => `<rect width="600" height="340" fill="#BFE6FF"/><path d="M330 262Q430 150 600 168V340H330z" fill="#8FD6A9"/><path d="M360 250Q440 176 600 188" stroke="#6FC091" stroke-width="5" fill="none"/>
${hot("edificio", 14, 78, 190, 172, "edificio de trabajo", `<rect x="26" y="96" width="166" height="152" rx="6" fill="#CBD6E8" stroke="#1B2A5B" stroke-width="4"/><g fill="#EAF1FB" stroke="#1B2A5B" stroke-width="3"><rect x="44" y="112" width="30" height="28" rx="3"/><rect x="92" y="112" width="30" height="28" rx="3"/><rect x="140" y="112" width="30" height="28" rx="3"/><rect x="44" y="156" width="30" height="28" rx="3"/><rect x="140" y="156" width="30" height="28" rx="3"/></g><rect x="92" y="196" width="32" height="52" rx="4" fill="#A9774A" stroke="#1B2A5B" stroke-width="3"/>`)}
${hot("agua", 196, 252, 150, 78, "zona inundada", `<path d="M0 262q27-12 54 0t54 0 54 0 54 0 54 0 54 0V340H0z" fill="#5DB8EC"/><path d="M20 292q27-10 54 0t54 0 54 0M200 318q27-10 54 0t54 0" stroke="#A8DDF7" stroke-width="5" fill="none"/>`)}
${hot("zona", 380, 84, 210, 170, "zona segura", `<rect x="470" y="104" width="8" height="132" fill="#8C6A4A"/><rect x="404" y="98" width="140" height="62" rx="10" fill="#1E9E6A" stroke="#fff" stroke-width="4"/><text x="474" y="124" text-anchor="middle" font-family="Fredoka,Trebuchet MS,sans-serif" font-size="17" font-weight="700" fill="#fff">ZONA</text><text x="474" y="146" text-anchor="middle" font-family="Fredoka,Trebuchet MS,sans-serif" font-size="17" font-weight="700" fill="#fff">SEGURA</text><path d="M392 200h64M436 184l22 16-22 16" stroke="#1E9E6A" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`)}`,
  },
};

/* Pictogramas en caja de 120x120 */
export const IC = {
  sol: `<circle cx="60" cy="60" r="26" fill="#FFC845" stroke="#1B2A5B" stroke-width="4"/><path d="M60 10v14M60 96v14M10 60h14M96 60h14M25 25l10 10M85 85l10 10M95 25L85 35M35 85L25 95" stroke="#1B2A5B" stroke-width="5" stroke-linecap="round"/>`,
  tormenta: `<g fill="#9FB0CB" stroke="#1B2A5B" stroke-width="4"><circle cx="40" cy="48" r="20"/><circle cx="66" cy="36" r="24"/><circle cx="90" cy="52" r="17"/></g><rect x="28" y="48" width="72" height="22" rx="10" fill="#9FB0CB"/><path d="M28 70h72" stroke="#1B2A5B" stroke-width="4"/><path d="M64 70l-14 22h14l-8 20 24-28H66l8-14z" fill="#FFC845" stroke="#1B2A5B" stroke-width="3" stroke-linejoin="round"/>`,
  electro: `<path d="M70 8L28 66h28l-10 46 46-64H64z" fill="#FFC845" stroke="#1B2A5B" stroke-width="5" stroke-linejoin="round"/>`,
  agua: `<path d="M0 78q15-8 30 0t30 0 30 0 30 0V120H0z" fill="#5DB8EC"/><circle cx="58" cy="52" r="12" fill="#F2C7A0" stroke="#1B2A5B" stroke-width="4"/><path d="M40 78q8-18 18-18t18 18" fill="none" stroke="#1B2A5B" stroke-width="7" stroke-linecap="round"/><path d="M84 40l10-14M92 52l16-8" stroke="#F2563F" stroke-width="5" stroke-linecap="round"/>`,
  muro: `<rect x="18" y="26" width="84" height="74" rx="4" fill="#E3B089" stroke="#1B2A5B" stroke-width="4"/><path d="M18 50h84M18 74h84M46 26v24M74 50v24M46 74v26" stroke="#1B2A5B" stroke-width="3"/><path d="M62 26l-8 22 12 10-10 16 8 26" stroke="#F2563F" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  auto: `<rect x="10" y="56" width="100" height="32" rx="12" fill="#F2563F" stroke="#1B2A5B" stroke-width="4"/><path d="M28 56l14-24h36l16 24z" fill="#F2563F" stroke="#1B2A5B" stroke-width="4" stroke-linejoin="round"/><path d="M40 54l9-16h20l9 16z" fill="#BFE3F8"/><circle cx="32" cy="90" r="12" fill="#1B2A5B"/><circle cx="88" cy="90" r="12" fill="#1B2A5B"/><path d="M2 40h14M0 52h10" stroke="#1B2A5B" stroke-width="4" stroke-linecap="round"/>`,
  peligro: `<path d="M60 12L110 100H10z" fill="#FFC845" stroke="#1B2A5B" stroke-width="5" stroke-linejoin="round"/><path d="M60 42v30M60 84v.1" stroke="#1B2A5B" stroke-width="7" stroke-linecap="round"/>`,
  corte: `<path d="M20 90L46 20l22 40z" fill="#BFE3F8" stroke="#1B2A5B" stroke-width="4" stroke-linejoin="round"/><path d="M62 96l22-54 24 34z" fill="#DCEFFC" stroke="#1B2A5B" stroke-width="4" stroke-linejoin="round"/><path d="M90 14c8 12 10 20 0 26-10-6-8-14 0-26z" fill="#F2563F"/>`,
  lodo: `<path d="M10 100q50-30 100 0z" fill="#8C6A4A" stroke="#1B2A5B" stroke-width="4"/><path d="M30 86q30-34 60 0" fill="#A9774A" stroke="#1B2A5B" stroke-width="4"/><circle cx="46" cy="52" r="7" fill="#7A5A3C"/><circle cx="70" cy="40" r="9" fill="#7A5A3C"/><circle cx="86" cy="58" r="6" fill="#7A5A3C"/><path d="M50 108v6M70 106v8" stroke="#1B2A5B" stroke-width="4" stroke-linecap="round"/>`,
  quimico: `<path d="M46 12h28v30l30 54c5 9-1 16-10 16H26c-9 0-15-7-10-16l30-54z" fill="#fff" stroke="#1B2A5B" stroke-width="5" stroke-linejoin="round"/><path d="M36 82h48l14 24H22z" fill="#1E9E6A"/><circle cx="52" cy="92" r="4" fill="#fff"/><circle cx="70" cy="98" r="3" fill="#fff"/><path d="M40 12h40" stroke="#1B2A5B" stroke-width="6" stroke-linecap="round"/>`,
  mosquito: `<ellipse cx="60" cy="66" rx="14" ry="22" fill="#44546A" stroke="#1B2A5B" stroke-width="4"/><circle cx="60" cy="38" r="9" fill="#44546A" stroke="#1B2A5B" stroke-width="4"/><path d="M52 54C34 38 20 42 22 58c2 12 20 10 30 2M68 54c18-16 32-12 30 4-2 12-20 10-30 2" fill="#DCEFFC" stroke="#1B2A5B" stroke-width="3"/><path d="M60 30l-4-14M56 86l-14 18M60 88v20M64 86l14 18" stroke="#1B2A5B" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
  solo: `<circle cx="60" cy="40" r="14" fill="#F2C7A0" stroke="#1B2A5B" stroke-width="4"/><path d="M36 100c0-26 10-40 24-40s24 14 24 40z" fill="#1B2A5B"/><circle cx="60" cy="60" r="52" fill="none" stroke="#9FB0CB" stroke-width="4" stroke-dasharray="6 8"/><circle cx="100" cy="22" r="13" fill="#fff" stroke="#1B2A5B" stroke-width="4"/><path d="M100 14v9l6 4" stroke="#F2563F" stroke-width="4" fill="none" stroke-linecap="round"/>`,
  apoyo: `<circle cx="40" cy="48" r="12" fill="#F2C7A0" stroke="#1B2A5B" stroke-width="4"/><path d="M18 106c0-22 10-34 22-34s22 12 22 34z" fill="#1B2A5B"/><circle cx="82" cy="54" r="10" fill="#F2C7A0" stroke="#1B2A5B" stroke-width="4"/><path d="M64 106c0-18 8-28 18-28s18 10 18 28z" fill="#2F55B5"/><path d="M60 14c-4-8-16-4-12 6 2 5 12 12 12 12s10-7 12-12c4-10-8-14-12-6z" fill="#F2563F" stroke="#1B2A5B" stroke-width="3" stroke-linejoin="round"/>`,
  alarma: `<path d="M60 14c-18 0-28 14-28 32v22l-10 16h76L98 68V46c0-18-10-32-28-32z" fill="#FFC845" stroke="#1B2A5B" stroke-width="5" stroke-linejoin="round"/><circle cx="60" cy="100" r="9" fill="#1B2A5B"/><path d="M14 40q-6 12 0 24M106 40q6 12 0 24" stroke="#F2563F" stroke-width="5" fill="none" stroke-linecap="round"/>`,
  botiquin: `<rect x="18" y="38" width="84" height="60" rx="9" fill="#fff" stroke="#1B2A5B" stroke-width="5"/><path d="M44 38V28a8 8 0 0 1 8-8h16a8 8 0 0 1 8 8v10" fill="none" stroke="#1B2A5B" stroke-width="5"/><path d="M60 52v32M44 68h32" stroke="#F2563F" stroke-width="9" stroke-linecap="round"/>`,
  mano: `<circle cx="60" cy="60" r="44" fill="#F2563F" stroke="#1B2A5B" stroke-width="5"/><path d="M60 24v36M60 76v.1" stroke="#fff" stroke-width="9" stroke-linecap="round"/>`,
  retorno: `<rect x="26" y="16" width="68" height="92" rx="8" fill="#fff" stroke="#1B2A5B" stroke-width="5"/><rect x="44" y="8" width="32" height="16" rx="5" fill="#CBD6E8" stroke="#1B2A5B" stroke-width="4"/><path d="M40 52l10 10 18-20M40 84h40" stroke="#1E9E6A" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  termometro: `<rect x="48" y="12" width="24" height="68" rx="12" fill="#fff" stroke="#1B2A5B" stroke-width="5"/><circle cx="60" cy="92" r="16" fill="#F2563F" stroke="#1B2A5B" stroke-width="5"/><path d="M60 30v60" stroke="#F2563F" stroke-width="8" stroke-linecap="round"/><path d="M84 28h14M84 44h14M84 60h14" stroke="#1B2A5B" stroke-width="4" stroke-linecap="round"/>`,
  cuadrilla: `<circle cx="38" cy="40" r="11" fill="#F2C7A0" stroke="#1B2A5B" stroke-width="4"/><path d="M18 100c0-22 8-34 20-34s20 12 20 34z" fill="#44546A"/><circle cx="82" cy="40" r="11" fill="#F2C7A0" stroke="#1B2A5B" stroke-width="4"/><path d="M62 100c0-22 8-34 20-34s20 12 20 34z" fill="#1B2A5B"/><path d="M26 34a12 12 0 0 1 24 0z M70 34a12 12 0 0 1 24 0z" fill="#FFC845" stroke="#1B2A5B" stroke-width="3" stroke-linejoin="round"/>`,
};

export const TINT = ["#E3EEFB", "#E4F5EC", "#FFF1E2", "#EDEFFB", "#FDEBE8"];

export const banner = (kind, i) =>
  `<svg viewBox="0 0 600 170" role="img" aria-label="Ilustración del caso"><rect width="600" height="170" fill="${TINT[i % TINT.length]}"/><g transform="translate(240 25) scale(1.0)">${IC[kind] || IC.peligro}</g><circle cx="90" cy="130" r="26" fill="#fff" opacity=".55"/><circle cx="520" cy="40" r="34" fill="#fff" opacity=".55"/></svg>`;

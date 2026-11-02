/*
 * Contenido del microlearning. Fuente: Protocolo de Seguridad y Salud en el Trabajo ante el
 * Fenómeno El Niño (MTPE, 1.ª edición, octubre 2026). Lenguaje de trabajador, sin fórmulas ni tablas técnicas.
 *
 * Caso normal: { tema, ic | scene, sit, ok, bad[3], why, risk, tips[3] }
 *   - scene: el trabajador primero toca el peligro en una escena y luego decide.
 * Caso duel:   { k:"duel", tema, a, b, ok:"a"|"b", why, tips[3] }
 */

export const TITLE_DEFAULT = "Protocolo de SST ante el Fenómeno El Niño: microlearning para trabajadores";

export const MODULES = [
  {
    title: "Calor y sol",
    sub: "Cómo se siente el calor en el cuerpo, cómo cuidarte del sol y qué hacer si alguien se siente mal.",
    ic: "sol",
    cases: [
      {
        tema: "Trabajo al sol",
        scene: "obra",
        sit: "Hoy hace mucho calor y toca cargar bloques a pleno sol. Faltan 30 minutos para la pausa de hidratación y notas la boca seca.",
        ok: "Tomar agua fresca en cada pausa de hidratación, aunque no tengas sed, y avisar si necesitas parar antes.",
        bad: [
          "Esperar a tener mucha sed para tomar agua.",
          "Cargar más rápido para terminar antes y descansar después.",
          "Quitarte el sombrero para refrescar la cabeza.",
        ],
        why: "Al sudar el cuerpo pierde agua. Las pausas de hidratación con agua potable fresca y los descansos en zonas con sombra son controles del protocolo. Avisar a tiempo permite ajustar la tarea antes de que el malestar aumente.",
        risk: "Deshidratación, calambres, mareos, fatiga y agotamiento por calor.",
        tips: [
          "Toma agua fresca en las pausas de hidratación.",
          "Descansa en zonas con sombra o ventilación.",
          "Avisa si sientes mareo, calambres o confusión.",
        ],
      },
      {
        tema: "Personal nuevo",
        ic: "cuadrilla",
        sit: "Es tu primera semana en un trabajo al aire libre. Tus compañeros trabajan todo el turno al sol y te piden mantener su velocidad desde el primer día.",
        ok: "Avisar que eres nuevo y aumentar poco a poco tu tiempo de trabajo al calor durante 7 a 14 días.",
        bad: [
          "Seguir su velocidad para que no piensen que te cuesta.",
          "Trabajar horas extra el primer día para acostumbrarte rápido.",
          "Tomar menos agua para no ir tanto al baño.",
        ],
        why: "El cuerpo necesita entre 7 y 14 días para acostumbrarse al calor. El protocolo pide aumentar la jornada de forma progresiva al personal nuevo, porque quien no está aclimatado necesita medidas más cuidadosas.",
        risk: "Agotamiento por calor y golpe de calor, que aparecen con más facilidad en personas que aún no se acostumbran.",
        tips: [
          "Avisa que no estás aclimatado.",
          "Aumenta tu tiempo al calor de forma progresiva, durante 7 a 14 días.",
          "Pide pausas más frecuentes cuando las necesites.",
        ],
      },
      {
        k: "duel",
        tema: "Cómo se siente el calor",
        a: "30 °C con aire seco, trabajando bajo techo con ropa de algodón.",
        b: "30 °C con mucha humedad, bajo sol directo y con un mameluco sobre la ropa de trabajo.",
        ok: "b",
        why: "Con mucha humedad el sudor casi no se evapora y el cuerpo se enfría peor. El sol directo y la ropa en doble capa suman más calor. Con 30 °C y mucha humedad, el cuerpo puede sentir cerca de 35 °C.",
        tips: [
          "El termómetro marca una parte: la humedad, el sol y la ropa también suman calor.",
          "Usa ropa holgada, transpirable y de colores claros.",
          "Cuando la sensación de calor sube, aumentan las pausas y baja el esfuerzo.",
        ],
      },
      {
        tema: "Radiación solar",
        ic: "sol",
        sit: "Debes limpiar un patio sin sombra de 11 a.m. a 3 p.m. Tienes polo de manga corta y una gorra.",
        ok: "Usar ropa de manga larga, sombrero de ala ancha, lentes con filtro UVA y UVB y bloqueador FPS 50 o más en la piel expuesta.",
        bad: [
          "Usar solo la gorra, porque ya cubre la cara.",
          "Ponerte bloqueador únicamente en la cara.",
          "Trabajar con el torso descubierto para sudar y refrescarte.",
        ],
        why: "La radiación solar daña la piel y los ojos, y el efecto se acumula con los años. El protocolo indica manga larga, sombrero de ala ancha, lentes UVA y UVB y bloqueador FPS 50 o más. El bloqueador complementa la sombra y la rotación de tareas.",
        risk: "Quemaduras, daño en los ojos y en la piel, y efectos acumulativos por exposición solar.",
        tips: [
          "Pide programar las tareas fuera de las horas de más sol cuando se pueda.",
          "Busca sombra en cada pausa.",
          "Usa bloqueador FPS 50 o más en toda la piel que queda expuesta.",
        ],
      },
      {
        tema: "Señales de alarma",
        ic: "termometro",
        sit: "Un compañero lleva horas al sol. De pronto se marea, habla confuso y tiene la piel seca. Dice que está bien y que quiere seguir.",
        ok: "Llevarlo a la sombra, acompañarlo todo el tiempo y avisar de inmediato al supervisor o a la brigada para pedir atención médica.",
        bad: [
          "Dejarlo descansar 5 minutos y que vuelva a trabajar.",
          "Darle una tarea más liviana para que se distraiga.",
          "Esperar a ver si mejora solo antes de avisar.",
        ],
        why: "Mareo, confusión y piel seca son signos de alarma de un golpe de calor. Se trata como emergencia: sacar a la persona del calor, avisar y coordinar la atención y el traslado médico. La persona afectada puede no darse cuenta de su estado.",
        risk: "Golpe de calor, que puede poner en riesgo la vida.",
        tips: [
          "Aprende estos signos: mareo, confusión y piel seca.",
          "Avisa de inmediato, aunque la persona diga que está bien.",
          "Acompaña a la persona hasta que llegue la ayuda.",
        ],
      },
      {
        tema: "Nivel de riesgo por calor",
        ic: "termometro",
        extra: "scale",
        sit: "El supervisor informa que hoy el riesgo por calor es muy alto. La tarea de tu cuadrilla no tiene sombra y no se puede bajar el esfuerzo.",
        ok: "Se suspende o se reprograma la tarea hasta contar con controles que funcionen.",
        bad: [
          "Se trabaja igual, con una pausa más.",
          "Se trabaja normal y cada uno decide cuándo parar.",
          "Se espera a que alguien se sienta mal para detener la tarea.",
        ],
        why: "Con riesgo muy alto el protocolo indica evitar la exposición sin control y suspender o reprogramar las tareas que no se pueden hacer con controles eficaces. Las tareas pesadas se mueven a las horas menos calurosas.",
        risk: "Enfermedad grave por calor.",
        tips: [
          "Atiende el nivel de riesgo que informe tu empresa.",
          "Con riesgo medio o alto se aumentan las pausas y se reduce el esfuerzo.",
          "Si el calor se vuelve peligroso para ti, detén la tarea y avisa.",
        ],
      },
    ],
  },

  {
    title: "Agua, cables y muros",
    sub: "Qué hacer ante cables, agua, muros dañados y terrenos con barro después de las lluvias.",
    ic: "tormenta",
    cases: [
      {
        tema: "Electricidad y agua",
        scene: "almacen",
        sit: "Entras a un almacén inundado y ves una extensión conectada que cuelga dentro del agua.",
        ok: "Alejarte, avisar y esperar a que personal autorizado aísle la instalación y confirme que no hay tensión.",
        bad: [
          "Apagar el interruptor con la mano para cortar la corriente.",
          "Sacar el cable del agua con un palo de madera.",
          "Caminar por la parte más baja del agua, lejos del cable.",
        ],
        why: "Toda instalación eléctrica que tocó agua se considera con corriente hasta que personal competente la aísle y verifique que no hay tensión. Acercarte o tocarla pone tu vida en riesgo.",
        risk: "Electrocución, arco eléctrico, cortocircuito e incendio.",
        tips: [
          "Mantente lejos de cables caídos, tableros y equipos mojados.",
          "Avisa y señaliza la zona.",
          "Solo personal autorizado desconecta y verifica que no hay tensión.",
        ],
      },
      {
        tema: "Canales y corrientes",
        ic: "agua",
        sit: "Una compañera cae a un canal con corriente fuerte. Estás con otras dos personas y ninguna tiene entrenamiento de rescate.",
        ok: "Pedir ayuda de inmediato a emergencias o a la brigada, mantenerla a la vista y dar indicaciones sin entrar al agua.",
        bad: [
          "Entrar al agua a sacarla antes de que la corriente se la lleve.",
          "Formar una cadena humana dentro del canal.",
          "Esperar un rato a ver si logra salir sola.",
        ],
        why: "Los rescates improvisados ponen en riesgo a más personas. El protocolo indica no ingresar a corrientes o agua de profundidad desconocida y pedir rescate especializado. Solo intervienen quienes tienen entrenamiento y equipo.",
        risk: "Ahogamiento, atrapamiento, golpes y lesiones.",
        tips: [
          "No entres a agua de corriente o profundidad desconocida.",
          "Usa chaleco de flotación certificado si tu tarea lo requiere.",
          "Sigue las rutas de evacuación y las indicaciones de la brigada.",
        ],
      },
      {
        tema: "Muros y techos dañados",
        ic: "muro",
        sit: "Tras varios días de lluvia, te piden ir por unas herramientas a un ambiente donde el muro tiene grietas nuevas y se ve abombado.",
        ok: "No entrar y avisar para que una persona competente evalúe la estabilidad y delimite la zona.",
        bad: [
          "Entrar rápido, tomar las herramientas y salir.",
          "Entrar solo si llevas casco.",
          "Entrar con un compañero para ayudarse.",
        ],
        why: "Una estructura saturada de agua puede colapsar sin aviso. El protocolo indica no ingresar a edificaciones o zonas dañadas sin una evaluación previa de personal competente.",
        risk: "Colapso, atrapamiento, golpes y caída de objetos.",
        tips: [
          "Respeta las zonas delimitadas y los controles de acceso.",
          "Reporta grietas, deformaciones o desplazamientos.",
          "Entra solo cuando alguien competente lo autorice.",
        ],
      },
      {
        tema: "Barro y vehículos",
        ic: "auto",
        sit: "Un camión debe cruzar un terreno que sigue saturado de agua y barro. El conductor dice que ya pasó por ahí otras veces.",
        ok: "Esperar a que una evaluación confirme que el terreno soporta al vehículo y que la vía está liberada.",
        bad: [
          "Cruzar con alguien que guíe, sin evaluar el terreno.",
          "Cruzar rápido para no quedarse atascado.",
          "Pasar cerca de los peatones para evitar la zona más blanda.",
        ],
        why: "Un suelo saturado cambia la estabilidad y la tracción del vehículo. El protocolo limita el uso de maquinaria y vehículos en estos terrenos, salvo que una evaluación específica garantice condiciones seguras.",
        risk: "Vuelco, atropello, atrapamiento y pérdida de control del equipo.",
        tips: [
          "Mantente fuera de la zona de maniobra del vehículo.",
          "Respeta la separación entre peatones y vehículos.",
          "Si el terreno supera la capacidad del equipo, se suspende la circulación.",
        ],
      },
      {
        tema: "Zonas delimitadas",
        ic: "peligro",
        sit: "Hay cinta de peligro alrededor de un tablero y un charco. Es el camino más corto hacia tu puesto.",
        ok: "Rodear por otra ruta y avisar si la zona delimitada bloquea un acceso que necesitas.",
        bad: [
          "Pasar rápido, son solo unos metros.",
          "Retirar la cinta y volver a ponerla después.",
          "Pasar porque ves que otros ya pasaron.",
        ],
        why: "La cinta indica que el área tiene un peligro que todavía no está controlado. Las zonas de exclusión protegen a todos mientras personal competente revisa y habilita el área.",
        risk: "Electrocución, caídas, golpes y lesiones por condiciones sin evaluar.",
        tips: [
          "Respeta toda señalización y delimitación.",
          "Usa rutas alternas autorizadas.",
          "Reporta si una zona delimitada impide tu trabajo.",
        ],
      },
    ],
  },

  {
    title: "Lodo, residuos y salud",
    sub: "Cómo protegerte al limpiar lodo y residuos, y cómo cuidar tu salud y la de tu equipo.",
    ic: "lodo",
    cases: [
      {
        tema: "Objetos cortantes",
        scene: "lodo",
        sit: "Mientras retiras lodo ves un vidrio roto y lo que parece una aguja entre el barro.",
        ok: "No recogerlos con las manos: usar una herramienta de recolección y depositarlos en un contenedor rígido.",
        bad: [
          "Recogerlos con guantes de tela para ir más rápido.",
          "Empujarlos con el pie para apartarlos.",
          "Taparlos con más lodo y seguir.",
        ],
        why: "El lodo oculta objetos punzocortantes que pueden cortar o pinchar y transmitir infecciones. El protocolo indica herramientas de recolección, contenedores rígidos y guantes resistentes al corte. Ante un corte o pinchazo se reporta y se atiende de inmediato.",
        risk: "Cortes, punciones y enfermedades por agentes biológicos.",
        tips: [
          "Usa guantes resistentes al corte y botas con protección de suela.",
          "Inspecciona el área antes de meter las manos.",
          "Si te cortas o pinchas, avisa y recibe atención de inmediato.",
        ],
      },
      {
        tema: "Aguas servidas y lodo",
        ic: "lodo",
        sit: "Debes limpiar un ambiente con lodo y aguas servidas. Nadie ha revisado cómo protegerse y piden empezar ya para ganar tiempo.",
        ok: "Esperar a que se evalúe la exposición y a contar con guantes y botas impermeables, protección para ojos y rostro y ropa de protección.",
        bad: [
          "Empezar con las manos y lavarte al terminar.",
          "Empezar con lo que tengas y pedir los equipos más tarde.",
          "Limpiar sin guantes para tener mejor agarre.",
        ],
        why: "El protocolo no permite limpiar aguas residuales ni lodos hasta evaluar la exposición e implementar los controles. Si la tarea te expone a un peligro inminente para tu salud, puedes reportarlo y negarte por los canales formales.",
        risk: "Infecciones, irritación de piel, ojos y vías respiratorias.",
        tips: [
          "Evita el contacto directo con el agua y el lodo contaminados.",
          "Lávate las manos y cubre tus heridas.",
          "Reporta la condición si faltan equipos o instrucciones.",
        ],
      },
      {
        tema: "Sustancias químicas",
        ic: "quimico",
        sit: "Un envase de producto químico se rompió con la lluvia. Hay un charco con olor fuerte junto a tu puesto.",
        ok: "Alejarte, avisar y dejar el derrame a personal entrenado que identifique la sustancia antes de tocarla.",
        bad: [
          "Echarle agua para diluir el producto.",
          "Mezclarlo con un producto de limpieza para neutralizarlo.",
          "Recoger el envase roto con las manos para llevarlo a otro lugar.",
        ],
        why: "Primero se aísla el área y se identifica la sustancia con la ficha de datos de seguridad. Los derrames los gestiona personal entrenado. Mezclar productos puede causar reacciones peligrosas.",
        risk: "Contacto con la piel o los ojos, inhalación, intoxicación, quemaduras e incendio.",
        tips: [
          "Aléjate y avisa antes de intentar cualquier limpieza.",
          "Pide la ficha de datos de seguridad del producto.",
          "No manipules envases dañados sin evaluación.",
        ],
      },
      {
        tema: "Agua estancada",
        ic: "mosquito",
        sit: "Después de las lluvias quedó agua estancada en baldes y llantas junto a tu zona de trabajo.",
        ok: "Avisar para que se elimine el agua estancada y se controle la presencia de mosquitos.",
        bad: [
          "Dejarla: el sol la secará sola.",
          "Mover los recipientes a otro rincón.",
          "Taparla con cartón sin vaciarla.",
        ],
        why: "El agua estancada permite que se reproduzcan vectores como los mosquitos que transmiten el dengue. El protocolo pide controlar los vectores y mantener limpieza, secado y ventilación durante la recuperación.",
        risk: "Enfermedades transmitidas por vectores, como el dengue.",
        tips: [
          "Mantén limpias, secas y ventiladas las áreas de trabajo.",
          "Higiene de manos y cubrir heridas.",
          "Avisa si presentas síntomas después de trabajar en la zona.",
        ],
      },
      {
        tema: "Cansancio",
        ic: "solo",
        sit: "Llevas 14 horas atendiendo la emergencia, con doble turno. Empiezas a distraerte y a cometer errores.",
        ok: "Avisar que necesitas descansar y pedir que se revise tu turno y la carga de trabajo.",
        bad: [
          "Seguir hasta terminar, porque la emergencia no espera.",
          "Saltarte las pausas para acabar antes.",
          "Quedarte callado para no parecer débil.",
        ],
        why: "Las jornadas largas y los dobles turnos bajan la atención y la coordinación, y aumentan los errores y los accidentes. El protocolo pide limitar jornadas, establecer pausas y recuperación, y rotar tareas.",
        risk: "Errores, accidentes, agotamiento y menor capacidad de respuesta.",
        tips: [
          "Respeta tus pausas y tu descanso.",
          "Hidrátate y aliméntate durante la jornada.",
          "Avisa cuando notes cansancio o falta de atención.",
        ],
      },
      {
        tema: "Apoyo a un compañero",
        ic: "apoyo",
        sit: "Después de lo vivido, un compañero está muy angustiado y no quiere hablar con nadie.",
        ok: "Acercarte con calma, escucharlo sin presionar y avisar para que reciba apoyo de primeros auxilios psicológicos.",
        bad: [
          "Decirle que no es para tanto.",
          "Dejarlo solo hasta que se le pase.",
          "Contarle a todo el equipo lo que le pasa para que lo ayuden.",
        ],
        why: "Una emergencia puede generar estrés y angustia. El protocolo contempla primeros auxilios psicológicos, comunicación clara, apoyo y derivación cuando hace falta, siempre cuidando la confidencialidad.",
        risk: "Estrés, ansiedad, deterioro de la toma de decisiones y conflictos.",
        tips: [
          "Escucha con calma, sin juzgar.",
          "Avisa a quien corresponda para que reciba apoyo.",
          "Mantén en reserva lo que te cuenten.",
        ],
      },
    ],
  },

  {
    title: "Antes, durante y después",
    sub: "Qué haces en cada momento de una emergencia y cuándo puedes detener una tarea.",
    ic: "alarma",
    cases: [
      {
        tema: "Durante: evacuación",
        scene: "evacuacion",
        sit: "Suena la alarma de evacuación por una crecida cercana. Estás a mitad de una tarea.",
        ok: "Suspender la tarea y dirigirte a la zona segura por la ruta indicada.",
        bad: [
          "Terminar primero la tarea para no dejarla a medias.",
          "Ir a ver cómo está la crecida.",
          "Esperar a que alguien te avise personalmente.",
        ],
        why: "Durante una emergencia la seguridad va primero y la producción después. El plan de emergencia define alarmas, rutas y zonas seguras para que todos se pongan a salvo sin demora.",
        risk: "Atrapamiento, arrastre por la corriente y lesiones graves.",
        tips: [
          "Conoce tu ruta de evacuación y tu punto de reunión.",
          "Atiende las indicaciones de la brigada.",
          "Ayuda solo en lo que estás entrenado.",
        ],
      },
      {
        tema: "Antes: prepararse",
        ic: "botiquin",
        sit: "Se anunció que habrá lluvias intensas la próxima semana. ¿Qué te corresponde hacer ahora, antes de que empiece la emergencia?",
        ok: "Ubicar tu ruta de evacuación y tu punto de reunión, y saber quién integra la brigada y dónde está el botiquín.",
        bad: [
          "Esperar a que llueva para ver qué pasa.",
          "Dejar todo lo de la emergencia en manos de los supervisores.",
          "Quitar la señalización que estorba en los pasillos.",
        ],
        why: "Antes de la emergencia se prepara el centro de trabajo: rutas de evacuación, puntos de reunión, brigadas, capacitación, simulacros y recursos como botiquín, agua potable y equipos de protección.",
        risk: "Respuesta lenta o desordenada cuando ocurre la emergencia.",
        tips: [
          "Participa en las capacitaciones y los simulacros.",
          "Verifica que tus equipos de protección estén completos y en buen estado.",
          "Reporta drenajes tapados, techos dañados o rutas bloqueadas.",
        ],
      },
      {
        tema: "Durante: detener la tarea",
        ic: "mano",
        sit: "Te asignan una tarea en una zona donde el agua sigue subiendo. Tu supervisor insiste en terminar antes de las 5 p. m.",
        ok: "Detener la tarea, alejarte a un lugar seguro y reportar el peligro por los canales de la empresa.",
        bad: [
          "Hacerla igual para evitar problemas.",
          "Hacerla y avisar después.",
          "Hacerla solo, para no exponer a otros.",
        ],
        why: "Si hay un peligro inminente para tu vida o tu salud, la Ley de SST permite interrumpir la actividad. El protocolo garantiza el derecho a reportar condiciones peligrosas y a detener o negarte a una tarea por los mecanismos formales.",
        risk: "Accidentes graves por continuar trabajando en una condición fuera de control.",
        tips: [
          "Reporta toda condición peligrosa que veas.",
          "Detén la tarea cuando el peligro sea inminente.",
          "Usa los canales formales de tu empresa para dejar constancia.",
        ],
      },
      {
        tema: "Después: retorno seguro",
        ic: "retorno",
        sit: "Ya pasó la lluvia. Tus compañeros quieren volver al área para reanudar el trabajo y nadie del servicio de SST ha dado la autorización.",
        ok: "Esperar la autorización, que se da cuando se revisan estructura, electricidad, tránsito y limpieza del área.",
        bad: [
          "Entrar para adelantar la limpieza.",
          "Entrar si el piso ya está seco.",
          "Entrar con casco y botas, que es suficiente.",
        ],
        why: "El retorno se autoriza cuando los peligros críticos están controlados: estabilidad de la estructura, seguridad eléctrica, atmósferas peligrosas y tránsito seguro. Entrar antes puede exponerte a peligros que todavía no se detectaron.",
        risk: "Colapsos, electrocución, exposición a agentes biológicos o químicos.",
        tips: [
          "Espera la autorización antes de reingresar.",
          "Observa y reporta cualquier condición nueva.",
          "Avisa si presentas síntomas después de la exposición.",
        ],
      },
      {
        tema: "Después: reportar",
        ic: "botiquin",
        sit: "Terminó la emergencia y tu turno. Te diste un golpe y una herida durante la limpieza y no te sientes bien.",
        ok: "Avisar y acudir a atención médica, para que quede registrado y se revisen las medidas de la empresa.",
        bad: [
          "Callar porque ya terminó el turno.",
          "Esperar a ver si se te pasa en tu casa.",
          "Avisar solo si la herida se infecta.",
        ],
        why: "El protocolo pide registrar los accidentes, los incidentes y las enfermedades, y vigilar la salud del personal expuesto. Lo que se reporta se investiga y permite corregir las medidas para que no se repita.",
        risk: "Infecciones y complicaciones que se agravan por no recibir atención a tiempo.",
        tips: [
          "Reporta todo golpe, herida o malestar, aunque parezca menor.",
          "Recibe atención médica según corresponda.",
          "Cuenta lo que pasó para que se mejoren las medidas.",
        ],
      },
    ],
  },
];

export const TOTAL_CASES = MODULES.reduce((n, m) => n + m.cases.length, 0);

export const RECAP = [
  "Toma agua en cada pausa de hidratación y descansa a la sombra.",
  "Si eres nuevo en un trabajo con calor, avisa: el cuerpo necesita de 7 a 14 días para acostumbrarse.",
  "Mareo, confusión y piel seca en un compañero son una emergencia: sombra, aviso y atención médica.",
  "Todo cable, tablero o equipo que tocó agua se trata como si tuviera corriente.",
  "Para entrar a una zona dañada o volver a tu puesto, esperas la autorización de personal competente.",
  "Con peligro inminente puedes detener la tarea y reportarlo por los canales de tu empresa.",
];

export function progressStage(pct) {
  if (pct >= 100) return "Capacitación completa";
  if (pct >= 75) return "Te falta poco";
  if (pct >= 50) return "Vas a la mitad";
  if (pct >= 25) return "Primer tramo completo";
  return "Empezando";
}

# Microlearning Fenómeno El Niño

Microlearning de unos 10 minutos para trabajadores, basado en el Protocolo de SST ante el Fenómeno El Niño (MTPE, octubre 2026). Usa la mecánica del juego IPERC (toca el peligro, decide qué hacer, gana puntos) y genera el registro de capacitación en PDF y Excel con el formato de "Registro de inducción, capacitación, entrenamiento y simulacros de emergencia".

## Cómo funciona

**Administrador** (`/?admin`)
1. Entra con su clave.
2. Crea la capacitación: datos del empleador (1 a 5), logo, tipo (6 a 9), tema, fecha, capacitador y horas (10 a 13), código y versión, y responsable con su firma (19).
3. Carga la lista de trabajadores con DNI, apellidos y nombres, y área. Puede pegar varias líneas desde Excel.
4. Copia el link (o lo comparte por WhatsApp) y lo envía a los trabajadores.
5. Ve quién empezó y quién firmó. Descarga el PDF y el Excel cuando quiera.

**Trabajador** (`/?s=CODIGO`)
1. Entra con su DNI. Solo pasa quien está en la lista de esa capacitación.
2. Recorre 4 módulos con 22 casos: Calor y sol; Agua, cables y muros; Lodo, residuos y salud; Antes, durante y después.
3. Ve su resultado y firma con el dedo. Su nombre, DNI, área y firma salen en el registro.

El avance se guarda en el celular y en la base de datos. Si se cierra el juego, retoma donde se quedó, también desde otro equipo. Si no hay internet al firmar, la firma queda guardada y se envía cuando vuelve la conexión.

## Modo demostración

Sin variables de entorno la app funciona sola, con los datos guardados en el navegador. La clave de administrador es `demo`. Sirve para probar el flujo completo, pero un link compartido solo funciona en el mismo navegador. Para uso real hay que conectar Supabase.

## Puesta en producción con Bolt

1. Sube esta carpeta a un repositorio de GitHub.
2. En bolt.new elige **Import from GitHub** y selecciona el repositorio.
3. Activa la base de datos de Bolt y pega el contenido de `BOLT_PROMPT.md`. Bolt crea las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` y aplica las dos migraciones de `supabase/migrations`, en orden.
4. Abre `/?admin` en la vista previa. La primera vez la app pide crear la clave del administrador (mínimo 8 caracteres). Hazlo en ese momento: mientras no exista, quien abra esa página primero puede definirla.
5. Crea una capacitación de prueba, agrega tu DNI a la lista y entra desde el link.
6. Publica desde Bolt o conecta el repositorio en Vercel (preset Vite). Si despliegas en Vercel, agrega en **Settings > Environment Variables** las mismas dos variables que usa Bolt.

La clave se puede cambiar después desde el panel, en el botón **Cambiar clave**.

## Puesta en producción con Supabase propio

1. Crea un proyecto en supabase.com y ejecuta en el SQL Editor, en este orden, `20261102000000_microlearning_fen.sql` y `20261102000100_clave_admin.sql`.
2. Copia la URL y la clave `anon` de **Project Settings > API** a las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` de Vercel.
3. Abre `/?admin` y define la clave.

## Seguridad

- Las cuatro tablas tienen RLS activada y el navegador no tiene permisos directos sobre ninguna. Todo pasa por funciones RPC.
- La clave del administrador se valida en el servidor y se guarda cifrada. Tras 8 intentos fallidos en 10 minutos se bloquea el panel durante 10 minutos. Por eso conviene una clave larga.
- Los trabajadores solo pueden consultar su propio DNI dentro de la capacitación cuyo código tienen.
- La lista contiene datos personales (nombres, DNI y firmas). Usa un proyecto Supabase propio y elimina la capacitación desde el panel cuando ya no la necesites. Eliminar borra la lista y las firmas.

## Registro en PDF y Excel

- Sigue el formato adjunto: encabezado con logo, código y versión; campos 1 a 19; banda de color y casillas.
- Por defecto incluye solo a quienes terminaron y firmaron. Con la casilla "Incluir también a quienes aún no terminan" salen todos, con la firma en blanco y la observación "Pendiente".
- La columna Observaciones se completa sola con "Completó. Aciertos a la primera: X de 22." Se puede editar en `src/admin.js` (busca `Completó.`).
- Si hay más trabajadores de los que caben en una hoja, el PDF sigue en otras páginas y repite el encabezado y los títulos de la tabla. El responsable firma en la última.

## Cambiar el contenido

Todo el texto de los módulos, casos, explicaciones y resumen final está en `src/content.js`. Las escenas dibujadas y los pictogramas están en `src/scenes.js`. El diseño viene del juego IPERC y está en `src/style.css`.

Cada caso tiene la situación, la respuesta correcta, tres opciones incorrectas (el juego muestra dos), la explicación, qué puede pasar y tres controles. Los casos con `scene` empiezan con una escena para tocar el peligro. El caso con `k: "duel"` compara dos situaciones.

## Estructura

```
index.html                 página única (juego y panel)
src/main.js                elige entre juego y panel según la URL
src/worker.js              juego del trabajador, resultado y firma
src/admin.js               panel del administrador
src/content.js             módulos y casos
src/scenes.js              escenas y pictogramas
src/registro.js            PDF (jsPDF) y Excel (ExcelJS)
src/api.js                 Supabase y modo demostración
supabase/migrations/       tablas, RLS y funciones (2 archivos)
BOLT_PROMPT.md             prompt para conectar la base de datos de Bolt
public/vendor/             jsPDF 2.5.1 y ExcelJS 4.4.0 (se cargan solo al descargar)
public/logo-gs.png         logo de Good Solutions del pie de página
```

## Desarrollo local

```
npm install
npm run dev
```

Sin un archivo `.env` corre en modo demostración. Para usar Supabase copia `.env.example` a `.env` y completa las dos variables.

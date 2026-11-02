# Prompt para Bolt (pegar tal cual)

Este repositorio es un microlearning de seguridad y salud en el trabajo hecho con Vite en modo vanilla (HTML, CSS y JavaScript puro, sin React). Funciona en modo demostración sin base de datos. Quiero conectarlo a la base de datos de Bolt. Reglas:

1. No reescribas el proyecto en React ni cambies el diseño, los textos, el contenido de `src/content.js` ni la lógica de `src/worker.js`, `src/admin.js` y `src/registro.js`.
2. Activa la base de datos de Bolt y aplica en orden los dos archivos de `supabase/migrations`: primero `20261102000000_microlearning_fen.sql` y luego `20261102000100_clave_admin.sql`. No los modifiques ni crees tablas o funciones adicionales.
3. Deja la URL y la anon key en variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`, nunca escritas en el código. `src/api.js` ya las lee.
4. No agregues login, correos ni roles. El administrador entra con una clave que se define desde la propia app en `/?admin`, y los trabajadores entran con su DNI.
5. No expongas las tablas al navegador. Todo el acceso es por las funciones RPC `ml_*` que ya existen.
6. Cuando termines, dime qué variables quedaron configuradas y confirma que las dos migraciones se aplicaron.

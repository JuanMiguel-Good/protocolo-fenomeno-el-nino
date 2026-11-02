/*
# Microlearning Fenómeno El Niño: capacitaciones, asistentes y panel de administración

## Qué crea
- `ml_config`: guarda el hash de la clave del administrador (una sola fila).
- `ml_intentos`: registra intentos fallidos de clave para frenar la fuerza bruta.
- `ml_sesiones`: una capacitación con los datos del empleador, del documento y del responsable.
- `ml_asistentes`: lista de DNI autorizados por capacitación, con su avance y su firma.

## Seguridad
- RLS activada en las cuatro tablas y sin permisos directos para `anon` ni `authenticated`.
- Todo el acceso es por funciones RPC `SECURITY DEFINER`.
- Las funciones del administrador reciben la clave y la validan en el servidor.
  Tras 8 intentos fallidos en 10 minutos se bloquean durante 10 minutos.
- Las funciones del trabajador necesitan el código de la capacitación y un DNI de la lista.

## Antes de usar el panel de administración
Define la clave ejecutando esto una vez en el SQL Editor (cambia TU_CLAVE):

  insert into ml_config (id, clave_hash)
  values (true, extensions.crypt('TU_CLAVE', extensions.gen_salt('bf')))
  on conflict (id) do update set clave_hash = excluded.clave_hash;
*/

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

/* ---------- Tablas ---------- */

create table if not exists ml_config (
  id boolean primary key default true check (id),
  clave_hash text not null
);

create table if not exists ml_intentos (
  id bigserial primary key,
  creado_en timestamptz not null default now()
);

create table if not exists ml_sesiones (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique check (codigo ~ '^[A-HJ-NP-Z2-9]{6}$'),
  razon_social text not null default '',
  ruc text not null default '',
  domicilio text not null default '',
  actividad text not null default '',
  n_trabajadores text not null default '',
  logo text check (logo is null or (logo like 'data:image/%' and length(logo) < 400000)),
  codigo_doc text not null default '',
  version_doc text not null default '',
  tipo text not null default 'capacitacion'
    check (tipo in ('induccion','capacitacion','entrenamiento','simulacro')),
  tema text not null default '',
  fecha date,
  capacitador text not null default '',
  horas text not null default '',
  resp_nombre text not null default '',
  resp_cargo text not null default '',
  resp_fecha date,
  resp_firma text check (resp_firma is null or (resp_firma like 'data:image/png;base64,%' and length(resp_firma) < 200000)),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table if not exists ml_asistentes (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references ml_sesiones(id) on delete cascade,
  dni text not null check (dni ~ '^[0-9]{8}$'),
  nombre text not null check (btrim(nombre) <> ''),
  area text not null default '',
  estado jsonb,
  puntos int not null default 0,
  avance int not null default 0 check (avance between 0 and 100),
  completado boolean not null default false,
  firma text check (firma is null or (firma like 'data:image/png;base64,%' and length(firma) < 200000)),
  iniciado_en timestamptz,
  actualizado_en timestamptz,
  completado_en timestamptz,
  creado_en timestamptz not null default now(),
  unique (sesion_id, dni)
);

alter table ml_config enable row level security;
alter table ml_intentos enable row level security;
alter table ml_sesiones enable row level security;
alter table ml_asistentes enable row level security;

revoke all on ml_config, ml_intentos, ml_sesiones, ml_asistentes from anon, authenticated;
revoke all on sequence ml_intentos_id_seq from anon, authenticated;

/* ---------- Validación de la clave del administrador (uso interno) ---------- */

create or replace function ml_check_admin(p_clave text)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_hash text;
  v_fallos int;
begin
  select clave_hash into v_hash from ml_config where id;
  if v_hash is null then
    return 'sin_clave';
  end if;
  select count(*) into v_fallos from ml_intentos where creado_en > now() - interval '10 minutes';
  if v_fallos >= 8 then
    return 'bloqueado';
  end if;
  if p_clave is not null and p_clave <> '' and v_hash = crypt(p_clave, v_hash) then
    return 'ok';
  end if;
  insert into ml_intentos default values;
  delete from ml_intentos where creado_en < now() - interval '1 day';
  return 'clave';
end;
$$;

/* ---------- Funciones del trabajador ---------- */

create or replace function ml_obtener_sesion(p_codigo text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  r ml_sesiones%rowtype;
begin
  select * into r from ml_sesiones where codigo = upper(btrim(coalesce(p_codigo, '')));
  if not found then
    return null;
  end if;
  return json_build_object(
    'codigo', r.codigo,
    'razon_social', r.razon_social,
    'tema', r.tema,
    'fecha', r.fecha,
    'logo', r.logo
  );
end;
$$;

create or replace function ml_entrar(p_codigo text, p_dni text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  a ml_asistentes%rowtype;
begin
  if p_dni is null or p_dni !~ '^[0-9]{8}$' then
    return null;
  end if;
  select a2.* into a
  from ml_asistentes a2
  join ml_sesiones s on s.id = a2.sesion_id
  where s.codigo = upper(btrim(coalesce(p_codigo, ''))) and a2.dni = p_dni;
  if not found then
    return null;
  end if;
  return json_build_object(
    'dni', a.dni,
    'nombre', a.nombre,
    'area', a.area,
    'estado', a.estado,
    'puntos', a.puntos,
    'avance', a.avance,
    'completado', a.completado
  );
end;
$$;

create or replace function ml_guardar_avance(p_codigo text, p_dni text, p_estado jsonb, p_puntos int, p_avance int)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_sesion uuid;
begin
  select id into v_sesion from ml_sesiones where codigo = upper(btrim(coalesce(p_codigo, '')));
  if v_sesion is null or p_dni is null or p_dni !~ '^[0-9]{8}$' then
    return 'no_encontrado';
  end if;
  update ml_asistentes
     set estado = p_estado,
         puntos = greatest(0, coalesce(p_puntos, 0)),
         avance = least(99, greatest(0, coalesce(p_avance, 0))),
         iniciado_en = coalesce(iniciado_en, now()),
         actualizado_en = now()
   where sesion_id = v_sesion and dni = p_dni and not completado;
  if not found then
    return 'sin_cambios';
  end if;
  return 'ok';
end;
$$;

create or replace function ml_firmar(p_codigo text, p_dni text, p_firma text, p_estado jsonb, p_puntos int)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_sesion uuid;
begin
  select id into v_sesion from ml_sesiones where codigo = upper(btrim(coalesce(p_codigo, '')));
  if v_sesion is null or p_dni is null or p_dni !~ '^[0-9]{8}$' then
    return 'no_encontrado';
  end if;
  if p_firma is null or p_firma not like 'data:image/png;base64,%' or length(p_firma) >= 200000 then
    return 'firma_invalida';
  end if;
  update ml_asistentes
     set firma = p_firma,
         estado = p_estado,
         puntos = greatest(0, coalesce(p_puntos, 0)),
         avance = 100,
         completado = true,
         iniciado_en = coalesce(iniciado_en, now()),
         actualizado_en = now(),
         completado_en = coalesce(completado_en, now())
   where sesion_id = v_sesion and dni = p_dni and not completado;
  if not found then
    return 'sin_cambios';
  end if;
  return 'ok';
end;
$$;

/* ---------- Funciones del administrador (todas reciben la clave) ---------- */

create or replace function ml_admin_listar(p_clave text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_chk text := ml_check_admin(p_clave);
begin
  if v_chk <> 'ok' then
    return json_build_object('error', v_chk);
  end if;
  return json_build_object('sesiones', coalesce((
    select json_agg(t order by t.creado_en desc)
    from (
      select s.codigo, s.razon_social, s.tema, s.fecha, s.creado_en,
             (select count(*) from ml_asistentes a where a.sesion_id = s.id) as total,
             (select count(*) from ml_asistentes a where a.sesion_id = s.id and a.completado) as completados
      from ml_sesiones s
    ) t
  ), '[]'::json));
end;
$$;

create or replace function ml_admin_crear(p_clave text, p_datos json)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_chk text := ml_check_admin(p_clave);
  v_alfabeto constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_codigo text;
  v_intentos int := 0;
begin
  if v_chk <> 'ok' then
    return json_build_object('error', v_chk);
  end if;
  loop
    v_codigo := '';
    for i in 1..6 loop
      v_codigo := v_codigo || substr(v_alfabeto, 1 + floor(random() * length(v_alfabeto))::int, 1);
    end loop;
    exit when not exists (select 1 from ml_sesiones where codigo = v_codigo);
    v_intentos := v_intentos + 1;
    if v_intentos > 20 then
      return json_build_object('error', 'codigo');
    end if;
  end loop;
  insert into ml_sesiones (codigo) values (v_codigo);
  return ml_admin_actualizar(p_clave, v_codigo, p_datos);
end;
$$;

create or replace function ml_admin_actualizar(p_clave text, p_codigo text, p_datos json)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_chk text := ml_check_admin(p_clave);
  v_codigo text := upper(btrim(coalesce(p_codigo, '')));
begin
  if v_chk <> 'ok' then
    return json_build_object('error', v_chk);
  end if;
  update ml_sesiones set
    razon_social = left(coalesce(btrim(p_datos->>'razon_social'), ''), 200),
    ruc = left(coalesce(btrim(p_datos->>'ruc'), ''), 20),
    domicilio = left(coalesce(btrim(p_datos->>'domicilio'), ''), 300),
    actividad = left(coalesce(btrim(p_datos->>'actividad'), ''), 200),
    n_trabajadores = left(coalesce(btrim(p_datos->>'n_trabajadores'), ''), 12),
    logo = nullif(p_datos->>'logo', ''),
    codigo_doc = left(coalesce(btrim(p_datos->>'codigo_doc'), ''), 40),
    version_doc = left(coalesce(btrim(p_datos->>'version_doc'), ''), 30),
    tipo = coalesce(nullif(p_datos->>'tipo', ''), 'capacitacion'),
    tema = left(coalesce(btrim(p_datos->>'tema'), ''), 300),
    fecha = nullif(p_datos->>'fecha', '')::date,
    capacitador = left(coalesce(btrim(p_datos->>'capacitador'), ''), 150),
    horas = left(coalesce(btrim(p_datos->>'horas'), ''), 12),
    resp_nombre = left(coalesce(btrim(p_datos->>'resp_nombre'), ''), 150),
    resp_cargo = left(coalesce(btrim(p_datos->>'resp_cargo'), ''), 150),
    resp_fecha = nullif(p_datos->>'resp_fecha', '')::date,
    resp_firma = nullif(p_datos->>'resp_firma', ''),
    actualizado_en = now()
  where codigo = v_codigo;
  if not found then
    return json_build_object('error', 'no_encontrado');
  end if;
  return json_build_object('codigo', v_codigo);
end;
$$;

create or replace function ml_admin_obtener(p_clave text, p_codigo text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_chk text := ml_check_admin(p_clave);
  s ml_sesiones%rowtype;
begin
  if v_chk <> 'ok' then
    return json_build_object('error', v_chk);
  end if;
  select * into s from ml_sesiones where codigo = upper(btrim(coalesce(p_codigo, '')));
  if not found then
    return json_build_object('error', 'no_encontrado');
  end if;
  return json_build_object(
    'sesion', to_json(s) :: jsonb - 'id',
    'asistentes', coalesce((
      select json_agg(json_build_object(
        'dni', a.dni, 'nombre', a.nombre, 'area', a.area, 'puntos', a.puntos,
        'avance', a.avance, 'completado', a.completado, 'firma', a.firma,
        'iniciado_en', a.iniciado_en, 'actualizado_en', a.actualizado_en,
        'completado_en', a.completado_en
      ) order by a.nombre)
      from ml_asistentes a where a.sesion_id = s.id
    ), '[]'::json)
  );
end;
$$;

create or replace function ml_admin_asistentes_lote(p_clave text, p_codigo text, p_lista json)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_chk text := ml_check_admin(p_clave);
  v_sesion uuid;
  item json;
  v_agregados int := 0;
  v_errores text[] := array[]::text[];
begin
  if v_chk <> 'ok' then
    return json_build_object('error', v_chk);
  end if;
  select id into v_sesion from ml_sesiones where codigo = upper(btrim(coalesce(p_codigo, '')));
  if v_sesion is null then
    return json_build_object('error', 'no_encontrado');
  end if;
  if p_lista is null or json_typeof(p_lista) <> 'array' then
    return json_build_object('error', 'lista');
  end if;
  for item in select * from json_array_elements(p_lista) loop
    if item->>'dni' is null or (item->>'dni') !~ '^[0-9]{8}$' then
      v_errores := array_append(v_errores, 'DNI inválido: ' || coalesce(item->>'dni', 'vacío'));
      continue;
    end if;
    if btrim(coalesce(item->>'nombre', '')) = '' then
      v_errores := array_append(v_errores, 'Falta el nombre del DNI ' || (item->>'dni'));
      continue;
    end if;
    insert into ml_asistentes (sesion_id, dni, nombre, area)
    values (v_sesion, item->>'dni', left(btrim(item->>'nombre'), 150), left(btrim(coalesce(item->>'area', '')), 100))
    on conflict (sesion_id, dni) do update
      set nombre = excluded.nombre, area = excluded.area;
    v_agregados := v_agregados + 1;
  end loop;
  return json_build_object('agregados', v_agregados, 'errores', to_json(v_errores));
end;
$$;

create or replace function ml_admin_editar_asistente(p_clave text, p_codigo text, p_dni text, p_nombre text, p_area text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_chk text := ml_check_admin(p_clave);
begin
  if v_chk <> 'ok' then
    return json_build_object('error', v_chk);
  end if;
  if btrim(coalesce(p_nombre, '')) = '' then
    return json_build_object('error', 'nombre');
  end if;
  update ml_asistentes a
     set nombre = left(btrim(p_nombre), 150), area = left(btrim(coalesce(p_area, '')), 100)
    from ml_sesiones s
   where s.id = a.sesion_id and s.codigo = upper(btrim(coalesce(p_codigo, ''))) and a.dni = p_dni;
  if not found then
    return json_build_object('error', 'no_encontrado');
  end if;
  return json_build_object('ok', true);
end;
$$;

create or replace function ml_admin_reiniciar_asistente(p_clave text, p_codigo text, p_dni text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_chk text := ml_check_admin(p_clave);
begin
  if v_chk <> 'ok' then
    return json_build_object('error', v_chk);
  end if;
  update ml_asistentes a
     set estado = null, puntos = 0, avance = 0, completado = false, firma = null,
         iniciado_en = null, actualizado_en = null, completado_en = null
    from ml_sesiones s
   where s.id = a.sesion_id and s.codigo = upper(btrim(coalesce(p_codigo, ''))) and a.dni = p_dni;
  if not found then
    return json_build_object('error', 'no_encontrado');
  end if;
  return json_build_object('ok', true);
end;
$$;

create or replace function ml_admin_eliminar_asistente(p_clave text, p_codigo text, p_dni text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_chk text := ml_check_admin(p_clave);
begin
  if v_chk <> 'ok' then
    return json_build_object('error', v_chk);
  end if;
  delete from ml_asistentes a
   using ml_sesiones s
   where s.id = a.sesion_id and s.codigo = upper(btrim(coalesce(p_codigo, ''))) and a.dni = p_dni;
  if not found then
    return json_build_object('error', 'no_encontrado');
  end if;
  return json_build_object('ok', true);
end;
$$;

create or replace function ml_admin_eliminar_sesion(p_clave text, p_codigo text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_chk text := ml_check_admin(p_clave);
begin
  if v_chk <> 'ok' then
    return json_build_object('error', v_chk);
  end if;
  delete from ml_sesiones where codigo = upper(btrim(coalesce(p_codigo, '')));
  if not found then
    return json_build_object('error', 'no_encontrado');
  end if;
  return json_build_object('ok', true);
end;
$$;

/* ---------- Permisos de ejecución ---------- */

revoke execute on function ml_check_admin(text) from public, anon, authenticated;

revoke execute on function ml_obtener_sesion(text) from public, anon, authenticated;
revoke execute on function ml_entrar(text, text) from public, anon, authenticated;
revoke execute on function ml_guardar_avance(text, text, jsonb, int, int) from public, anon, authenticated;
revoke execute on function ml_firmar(text, text, text, jsonb, int) from public, anon, authenticated;
revoke execute on function ml_admin_listar(text) from public, anon, authenticated;
revoke execute on function ml_admin_crear(text, json) from public, anon, authenticated;
revoke execute on function ml_admin_actualizar(text, text, json) from public, anon, authenticated;
revoke execute on function ml_admin_obtener(text, text) from public, anon, authenticated;
revoke execute on function ml_admin_asistentes_lote(text, text, json) from public, anon, authenticated;
revoke execute on function ml_admin_editar_asistente(text, text, text, text, text) from public, anon, authenticated;
revoke execute on function ml_admin_reiniciar_asistente(text, text, text) from public, anon, authenticated;
revoke execute on function ml_admin_eliminar_asistente(text, text, text) from public, anon, authenticated;
revoke execute on function ml_admin_eliminar_sesion(text, text) from public, anon, authenticated;

grant execute on function ml_obtener_sesion(text) to anon, authenticated;
grant execute on function ml_entrar(text, text) to anon, authenticated;
grant execute on function ml_guardar_avance(text, text, jsonb, int, int) to anon, authenticated;
grant execute on function ml_firmar(text, text, text, jsonb, int) to anon, authenticated;
grant execute on function ml_admin_listar(text) to anon, authenticated;
grant execute on function ml_admin_crear(text, json) to anon, authenticated;
grant execute on function ml_admin_actualizar(text, text, json) to anon, authenticated;
grant execute on function ml_admin_obtener(text, text) to anon, authenticated;
grant execute on function ml_admin_asistentes_lote(text, text, json) to anon, authenticated;
grant execute on function ml_admin_editar_asistente(text, text, text, text, text) to anon, authenticated;
grant execute on function ml_admin_reiniciar_asistente(text, text, text) to anon, authenticated;
grant execute on function ml_admin_eliminar_asistente(text, text, text) to anon, authenticated;
grant execute on function ml_admin_eliminar_sesion(text, text) to anon, authenticated;

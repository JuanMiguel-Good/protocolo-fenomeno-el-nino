/*
# Acceso del administrador por DNI (sin clave)

## Qué cambia
- El panel de administración entra solo con un DNI que esté en la lista de administradores.
- El DNI 40667929 queda como primer administrador.
- Un administrador puede agregar o quitar otros DNI administradores.
- Se elimina la clave del administrador y el límite de intentos fallidos que la protegía.

## Tablas
- `ml_admins` (nueva): lista de DNI con permiso de administrador.
- `ml_config` y `ml_intentos` (eliminadas): guardaban la clave y los intentos fallidos. Estaban vacías.

## Funciones
- `ml_check_admin(p_admin_dni)`: devuelve `ok` si el DNI es administrador; si no, `no_admin`.
- Todas las funciones del panel reciben `p_admin_dni` en lugar de la clave.
- Nuevas: `ml_admin_listar_admins`, `ml_admin_agregar_admin`, `ml_admin_quitar_admin`.
- Eliminadas: `ml_admin_estado`, `ml_admin_definir_clave`, `ml_admin_cambiar_clave`.

## Seguridad
- RLS activada en `ml_admins` sin permisos directos para `anon` ni `authenticated`.
- Todo el acceso es por funciones RPC `SECURITY DEFINER`.
- No se puede quitar al último administrador.

## Notas importantes
1. Un DNI no es secreto. Quien conozca el DNI de un administrador puede entrar al panel y ver los datos de todos los trabajadores.
2. Los trabajadores siguen entrando con su DNI desde el link de su capacitación; esas funciones no cambian.
*/

create table if not exists ml_admins (
  dni text primary key check (dni ~ '^[0-9]{8}$'),
  creado_en timestamptz not null default now()
);

alter table ml_admins enable row level security;
revoke all on ml_admins from anon, authenticated;

insert into ml_admins (dni) values ('40667929') on conflict (dni) do nothing;

drop function if exists ml_admin_estado();
drop function if exists ml_admin_definir_clave(text);
drop function if exists ml_admin_cambiar_clave(text, text);
drop function if exists ml_admin_listar(text);
drop function if exists ml_admin_crear(text, json);
drop function if exists ml_admin_actualizar(text, text, json);
drop function if exists ml_admin_obtener(text, text);
drop function if exists ml_admin_asistentes_lote(text, text, json);
drop function if exists ml_admin_editar_asistente(text, text, text, text, text);
drop function if exists ml_admin_reiniciar_asistente(text, text, text);
drop function if exists ml_admin_eliminar_asistente(text, text, text);
drop function if exists ml_admin_eliminar_sesion(text, text);
drop function if exists ml_check_admin(text);

drop table if exists ml_intentos;
drop table if exists ml_config;

create or replace function ml_check_admin(p_admin_dni text)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if p_admin_dni is null or p_admin_dni !~ '^[0-9]{8}$' then
    return 'no_admin';
  end if;
  if exists (select 1 from ml_admins where dni = p_admin_dni) then
    return 'ok';
  end if;
  return 'no_admin';
end;
$$;

create or replace function ml_admin_listar_admins(p_admin_dni text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if ml_check_admin(p_admin_dni) <> 'ok' then
    return json_build_object('error', 'no_admin');
  end if;
  return json_build_object('admins', coalesce((
    select json_agg(a.dni order by a.creado_en) from ml_admins a
  ), '[]'::json));
end;
$$;

create or replace function ml_admin_agregar_admin(p_admin_dni text, p_nuevo_dni text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if ml_check_admin(p_admin_dni) <> 'ok' then
    return json_build_object('error', 'no_admin');
  end if;
  if p_nuevo_dni is null or p_nuevo_dni !~ '^[0-9]{8}$' then
    return json_build_object('error', 'dni');
  end if;
  insert into ml_admins (dni) values (p_nuevo_dni) on conflict (dni) do nothing;
  return json_build_object('ok', true);
end;
$$;

create or replace function ml_admin_quitar_admin(p_admin_dni text, p_dni text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if ml_check_admin(p_admin_dni) <> 'ok' then
    return json_build_object('error', 'no_admin');
  end if;
  if not exists (select 1 from ml_admins where dni = p_dni) then
    return json_build_object('error', 'no_encontrado');
  end if;
  if (select count(*) from ml_admins) <= 1 then
    return json_build_object('error', 'ultimo_admin');
  end if;
  delete from ml_admins where dni = p_dni;
  return json_build_object('ok', true);
end;
$$;

create or replace function ml_admin_listar(p_admin_dni text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if ml_check_admin(p_admin_dni) <> 'ok' then
    return json_build_object('error', 'no_admin');
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

create or replace function ml_admin_crear(p_admin_dni text, p_datos json)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_alfabeto constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_codigo text;
  v_intentos int := 0;
begin
  if ml_check_admin(p_admin_dni) <> 'ok' then
    return json_build_object('error', 'no_admin');
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
  return ml_admin_actualizar(p_admin_dni, v_codigo, p_datos);
end;
$$;

create or replace function ml_admin_actualizar(p_admin_dni text, p_codigo text, p_datos json)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_codigo text := upper(btrim(coalesce(p_codigo, '')));
begin
  if ml_check_admin(p_admin_dni) <> 'ok' then
    return json_build_object('error', 'no_admin');
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

create or replace function ml_admin_obtener(p_admin_dni text, p_codigo text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  s ml_sesiones%rowtype;
begin
  if ml_check_admin(p_admin_dni) <> 'ok' then
    return json_build_object('error', 'no_admin');
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

create or replace function ml_admin_asistentes_lote(p_admin_dni text, p_codigo text, p_lista json)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_sesion uuid;
  item json;
  v_agregados int := 0;
  v_errores text[] := array[]::text[];
begin
  if ml_check_admin(p_admin_dni) <> 'ok' then
    return json_build_object('error', 'no_admin');
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

create or replace function ml_admin_editar_asistente(p_admin_dni text, p_codigo text, p_dni text, p_nombre text, p_area text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if ml_check_admin(p_admin_dni) <> 'ok' then
    return json_build_object('error', 'no_admin');
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

create or replace function ml_admin_reiniciar_asistente(p_admin_dni text, p_codigo text, p_dni text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if ml_check_admin(p_admin_dni) <> 'ok' then
    return json_build_object('error', 'no_admin');
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

create or replace function ml_admin_eliminar_asistente(p_admin_dni text, p_codigo text, p_dni text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if ml_check_admin(p_admin_dni) <> 'ok' then
    return json_build_object('error', 'no_admin');
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

create or replace function ml_admin_eliminar_sesion(p_admin_dni text, p_codigo text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if ml_check_admin(p_admin_dni) <> 'ok' then
    return json_build_object('error', 'no_admin');
  end if;
  delete from ml_sesiones where codigo = upper(btrim(coalesce(p_codigo, '')));
  if not found then
    return json_build_object('error', 'no_encontrado');
  end if;
  return json_build_object('ok', true);
end;
$$;

revoke execute on function ml_check_admin(text) from public, anon, authenticated;
revoke execute on function ml_admin_listar_admins(text) from public, anon, authenticated;
revoke execute on function ml_admin_agregar_admin(text, text) from public, anon, authenticated;
revoke execute on function ml_admin_quitar_admin(text, text) from public, anon, authenticated;
revoke execute on function ml_admin_listar(text) from public, anon, authenticated;
revoke execute on function ml_admin_crear(text, json) from public, anon, authenticated;
revoke execute on function ml_admin_actualizar(text, text, json) from public, anon, authenticated;
revoke execute on function ml_admin_obtener(text, text) from public, anon, authenticated;
revoke execute on function ml_admin_asistentes_lote(text, text, json) from public, anon, authenticated;
revoke execute on function ml_admin_editar_asistente(text, text, text, text, text) from public, anon, authenticated;
revoke execute on function ml_admin_reiniciar_asistente(text, text, text) from public, anon, authenticated;
revoke execute on function ml_admin_eliminar_asistente(text, text, text) from public, anon, authenticated;
revoke execute on function ml_admin_eliminar_sesion(text, text) from public, anon, authenticated;

grant execute on function ml_admin_listar_admins(text) to anon, authenticated;
grant execute on function ml_admin_agregar_admin(text, text) to anon, authenticated;
grant execute on function ml_admin_quitar_admin(text, text) to anon, authenticated;
grant execute on function ml_admin_listar(text) to anon, authenticated;
grant execute on function ml_admin_crear(text, json) to anon, authenticated;
grant execute on function ml_admin_actualizar(text, text, json) to anon, authenticated;
grant execute on function ml_admin_obtener(text, text) to anon, authenticated;
grant execute on function ml_admin_asistentes_lote(text, text, json) to anon, authenticated;
grant execute on function ml_admin_editar_asistente(text, text, text, text, text) to anon, authenticated;
grant execute on function ml_admin_reiniciar_asistente(text, text, text) to anon, authenticated;
grant execute on function ml_admin_eliminar_asistente(text, text, text) to anon, authenticated;
grant execute on function ml_admin_eliminar_sesion(text, text) to anon, authenticated;

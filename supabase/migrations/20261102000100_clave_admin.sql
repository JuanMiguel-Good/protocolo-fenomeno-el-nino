/*
# Definir y cambiar la clave del administrador desde la app

## Por qué
Bolt aplica las migraciones solo y no hay un paso manual en el SQL Editor. La primera vez que se abre
el panel (`/?admin`) la app pide crear la clave. Mientras no exista una clave, quien abra el panel primero
puede definirla, así que conviene hacerlo apenas se despliega.

## Funciones
- `ml_admin_estado()`: indica si ya hay una clave definida.
- `ml_admin_definir_clave(p_clave)`: solo funciona si todavía no hay clave. Mínimo 8 caracteres.
- `ml_admin_cambiar_clave(p_clave, p_nueva)`: exige la clave actual.
*/

create or replace function ml_admin_estado()
returns json
language sql
security definer
set search_path = public, extensions
as $$
  select json_build_object('tiene_clave', exists (select 1 from ml_config where id));
$$;

create or replace function ml_admin_definir_clave(p_clave text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if exists (select 1 from ml_config where id) then
    return json_build_object('error', 'ya_definida');
  end if;
  if p_clave is null or length(p_clave) < 8 or length(p_clave) > 100 then
    return json_build_object('error', 'corta');
  end if;
  insert into ml_config (id, clave_hash) values (true, crypt(p_clave, gen_salt('bf')));
  return json_build_object('ok', true);
end;
$$;

create or replace function ml_admin_cambiar_clave(p_clave text, p_nueva text)
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
  if p_nueva is null or length(p_nueva) < 8 or length(p_nueva) > 100 then
    return json_build_object('error', 'corta');
  end if;
  update ml_config set clave_hash = crypt(p_nueva, gen_salt('bf')) where id;
  return json_build_object('ok', true);
end;
$$;

revoke execute on function ml_admin_estado() from public, anon, authenticated;
revoke execute on function ml_admin_definir_clave(text) from public, anon, authenticated;
revoke execute on function ml_admin_cambiar_clave(text, text) from public, anon, authenticated;
grant execute on function ml_admin_estado() to anon, authenticated;
grant execute on function ml_admin_definir_clave(text) to anon, authenticated;
grant execute on function ml_admin_cambiar_clave(text, text) to anon, authenticated;

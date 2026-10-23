-- Parrilla · Liga de karting (MVP)
-- Pegá este archivo entero en Supabase → SQL Editor → Run.

-- ─── Tablas ──────────────────────────────────────────────────────────────────

create table public.leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  season text not null default '2026' check (char_length(season) between 1 and 40),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  invite_code text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 10),
  -- Puntos por posición: points[1] es lo que suma el ganador.
  points integer[] not null default '{25,18,15,12,10,8,6,4,2,1}',
  fastest_lap_point boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.league_members (
  league_id uuid not null references public.leagues (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz not null default now(),
  primary key (league_id, user_id)
);

-- Un piloto puede existir sin cuenta (el admin lo carga por nombre) y
-- después "reclamarlo" el amigo cuando entra con el link.
create table public.drivers (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index drivers_league_name_key on public.drivers (league_id, lower(name));
create unique index drivers_league_user_key on public.drivers (league_id, user_id) where user_id is not null;

-- Una "fecha" del campeonato.
create table public.events (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  track text check (char_length(track) <= 80),
  held_on date not null default current_date,
  created_at timestamptz not null default now()
);
create index events_league_idx on public.events (league_id, held_on);

create table public.results (
  event_id uuid not null references public.events (id) on delete cascade,
  driver_id uuid not null references public.drivers (id) on delete cascade,
  position integer not null check (position > 0),
  best_lap_ms integer check (best_lap_ms > 0),
  primary key (event_id, driver_id),
  unique (event_id, position)
);

-- ─── Helpers de permisos ─────────────────────────────────────────────────────

create function public.is_league_member(p_league_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.league_members m
    where m.league_id = p_league_id and m.user_id = (select auth.uid())
  );
$$;

create function public.is_league_admin(p_league_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.league_members m
    where m.league_id = p_league_id and m.user_id = (select auth.uid()) and m.role = 'admin'
  );
$$;

-- El que crea la liga queda como admin.
create function public.add_league_owner()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.league_members (league_id, user_id, role)
  values (new.id, new.owner_id, 'admin');
  return new;
end;
$$;

create trigger leagues_add_owner
after insert on public.leagues
for each row execute function public.add_league_owner();

-- ─── Row Level Security ──────────────────────────────────────────────────────

alter table public.leagues enable row level security;
alter table public.league_members enable row level security;
alter table public.drivers enable row level security;
alter table public.events enable row level security;
alter table public.results enable row level security;

-- leagues
create policy "leagues_select" on public.leagues for select to authenticated
  using (owner_id = (select auth.uid()) or public.is_league_member(id));
create policy "leagues_insert" on public.leagues for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy "leagues_update" on public.leagues for update to authenticated
  using (public.is_league_admin(id)) with check (public.is_league_admin(id));
create policy "leagues_delete" on public.leagues for delete to authenticated
  using (owner_id = (select auth.uid()));

-- league_members (las altas se hacen por trigger o por join_league)
create policy "members_select" on public.league_members for select to authenticated
  using (public.is_league_member(league_id));
create policy "members_delete" on public.league_members for delete to authenticated
  using (user_id = (select auth.uid()) or public.is_league_admin(league_id));

-- drivers
create policy "drivers_select" on public.drivers for select to authenticated
  using (public.is_league_member(league_id));
create policy "drivers_insert" on public.drivers for insert to authenticated
  with check (public.is_league_admin(league_id));
create policy "drivers_update" on public.drivers for update to authenticated
  using (public.is_league_admin(league_id)) with check (public.is_league_admin(league_id));
create policy "drivers_delete" on public.drivers for delete to authenticated
  using (public.is_league_admin(league_id));

-- events
create policy "events_select" on public.events for select to authenticated
  using (public.is_league_member(league_id));
create policy "events_insert" on public.events for insert to authenticated
  with check (public.is_league_admin(league_id));
create policy "events_update" on public.events for update to authenticated
  using (public.is_league_admin(league_id)) with check (public.is_league_admin(league_id));
create policy "events_delete" on public.events for delete to authenticated
  using (public.is_league_admin(league_id));

-- results
create policy "results_select" on public.results for select to authenticated
  using (public.is_league_member((select e.league_id from public.events e where e.id = event_id)));
create policy "results_insert" on public.results for insert to authenticated
  with check (public.is_league_admin((select e.league_id from public.events e where e.id = event_id)));
create policy "results_update" on public.results for update to authenticated
  using (public.is_league_admin((select e.league_id from public.events e where e.id = event_id)));
create policy "results_delete" on public.results for delete to authenticated
  using (public.is_league_admin((select e.league_id from public.events e where e.id = event_id)));

-- ─── Funciones que usa la app ────────────────────────────────────────────────

-- Entrar a una liga con el código del link de invitación.
create function public.join_league(p_code text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_league_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Necesitás iniciar sesión';
  end if;

  select id into v_league_id from public.leagues where invite_code = p_code;
  if v_league_id is null then
    raise exception 'El link de invitación no es válido';
  end if;

  insert into public.league_members (league_id, user_id)
  values (v_league_id, (select auth.uid()))
  on conflict do nothing;

  return v_league_id;
end;
$$;

-- "Este soy yo": vincula tu cuenta a un piloto que ya cargó el admin,
-- o te crea como piloto nuevo si pasás un nombre.
create function public.claim_driver(p_league_id uuid, p_driver_id uuid default null, p_name text default null)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_driver_id uuid;
begin
  if not public.is_league_member(p_league_id) then
    raise exception 'No sos parte de esta liga';
  end if;
  if exists (select 1 from public.drivers where league_id = p_league_id and user_id = v_uid) then
    raise exception 'Ya tenés un piloto en esta liga';
  end if;

  if p_driver_id is not null then
    update public.drivers set user_id = v_uid
    where id = p_driver_id and league_id = p_league_id and user_id is null
    returning id into v_driver_id;
    if v_driver_id is null then
      raise exception 'Ese piloto ya está tomado';
    end if;
  else
    if coalesce(trim(p_name), '') = '' then
      raise exception 'Poné tu nombre de piloto';
    end if;
    insert into public.drivers (league_id, name, user_id)
    values (p_league_id, trim(p_name), v_uid)
    returning id into v_driver_id;
  end if;

  return v_driver_id;
end;
$$;

-- Crea o edita una fecha y reemplaza todos sus resultados en una sola operación.
-- p_results: [{ "driver_id": uuid, "position": int, "best_lap_ms": int | null }, ...]
create function public.save_event(
  p_league_id uuid,
  p_event_id uuid,
  p_name text,
  p_track text,
  p_held_on date,
  p_results jsonb
)
returns uuid
language plpgsql security invoker set search_path = ''
as $$
declare
  v_event_id uuid := p_event_id;
  v_inserted integer;
begin
  if not public.is_league_admin(p_league_id) then
    raise exception 'Solo el admin de la liga puede cargar fechas';
  end if;

  if v_event_id is null then
    insert into public.events (league_id, name, track, held_on)
    values (p_league_id, trim(p_name), nullif(trim(p_track), ''), p_held_on)
    returning id into v_event_id;
  else
    update public.events
    set name = trim(p_name), track = nullif(trim(p_track), ''), held_on = p_held_on
    where id = v_event_id and league_id = p_league_id;
    if not found then
      raise exception 'No se encontró la fecha';
    end if;
    delete from public.results where event_id = v_event_id;
  end if;

  insert into public.results (event_id, driver_id, position, best_lap_ms)
  select v_event_id, r.driver_id, r.position, r.best_lap_ms
  from jsonb_to_recordset(p_results) as r(driver_id uuid, position integer, best_lap_ms integer)
  join public.drivers d on d.id = r.driver_id and d.league_id = p_league_id;

  get diagnostics v_inserted = row_count;
  if v_inserted <> jsonb_array_length(p_results) then
    raise exception 'Hay pilotos que no son de esta liga';
  end if;

  return v_event_id;
end;
$$;

-- Vista pública de una liga (para el link compartido, sin iniciar sesión).
create function public.public_league(p_code text)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'id', l.id,
    'name', l.name,
    'season', l.season,
    'points', to_jsonb(l.points),
    'fastest_lap_point', l.fastest_lap_point,
    'invite_code', l.invite_code,
    'drivers', coalesce((
      select jsonb_agg(jsonb_build_object('id', d.id, 'name', d.name, 'user_id', null, 'claimed', d.user_id is not null) order by d.name)
      from public.drivers d where d.league_id = l.id
    ), '[]'::jsonb),
    'events', coalesce((
      select jsonb_agg(jsonb_build_object('id', e.id, 'name', e.name, 'track', e.track, 'held_on', e.held_on) order by e.held_on, e.created_at)
      from public.events e where e.league_id = l.id
    ), '[]'::jsonb),
    'results', coalesce((
      select jsonb_agg(jsonb_build_object('event_id', r.event_id, 'driver_id', r.driver_id, 'position', r.position, 'best_lap_ms', r.best_lap_ms))
      from public.results r join public.events e on e.id = r.event_id
      where e.league_id = l.id
    ), '[]'::jsonb)
  )
  from public.leagues l
  where l.invite_code = p_code;
$$;

-- Supabase le da permiso de ejecutar funciones a "anon" por defecto: lo sacamos
-- de todo lo que no sea la vista pública.
revoke execute on function public.join_league(text) from public, anon;
revoke execute on function public.claim_driver(uuid, uuid, text) from public, anon;
revoke execute on function public.save_event(uuid, uuid, text, text, date, jsonb) from public, anon;
grant execute on function public.join_league(text) to authenticated;
grant execute on function public.claim_driver(uuid, uuid, text) to authenticated;
grant execute on function public.save_event(uuid, uuid, text, text, date, jsonb) to authenticated;
grant execute on function public.public_league(text) to anon, authenticated;

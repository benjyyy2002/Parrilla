-- Parrilla · Prode de F1
-- Pegá este archivo entero en Supabase → SQL Editor → Run (después de 0001_liga.sql).
--
-- Los resultados oficiales NO se guardan acá: la app los lee de la API pública de F1
-- (api.jolpi.ca) y calcula los puntos. Acá solo viven el calendario (para saber cuándo
-- se cierran los pronósticos), los grupos y los pronósticos.

-- ─── Tablas ──────────────────────────────────────────────────────────────────

create table public.prode_races (
  season integer not null,
  round integer not null,
  name text not null,
  circuit text,
  -- Los pronósticos se cierran cuando empieza la clasificación.
  quali_at timestamptz not null,
  race_at timestamptz not null,
  primary key (season, round)
);

create table public.prode_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  invite_code text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 10),
  created_at timestamptz not null default now()
);

create table public.prode_members (
  -- id propio para no mostrar los ids de usuario en la vista pública.
  id uuid not null unique default gen_random_uuid(),
  group_id uuid not null references public.prode_groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 30),
  role text not null default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create unique index prode_members_nickname_key on public.prode_members (group_id, lower(nickname));

-- Un pronóstico por usuario y carrera: vale para todos sus grupos.
-- Los pilotos se guardan con el id de la API (ej: "colapinto", "max_verstappen").
create table public.prode_predictions (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  season integer not null,
  round integer not null,
  pole text,
  p1 text,
  p2 text,
  p3 text,
  colapinto_position integer check (colapinto_position between 1 and 30),
  updated_at timestamptz not null default now(),
  primary key (user_id, season, round),
  foreign key (season, round) references public.prode_races (season, round) on delete cascade,
  check (p1 is distinct from p2 or p1 is null),
  check (p1 is distinct from p3 or p1 is null),
  check (p2 is distinct from p3 or p2 is null)
);

-- ─── Helpers ─────────────────────────────────────────────────────────────────

create function public.prode_locked(p_season integer, p_round integer)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce((select now() >= r.quali_at from public.prode_races r where r.season = p_season and r.round = p_round), true);
$$;

create function public.is_prode_member(p_group_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.prode_members m where m.group_id = p_group_id and m.user_id = (select auth.uid())
  );
$$;

create function public.shares_prode_group(p_user_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.prode_members mine
    join public.prode_members theirs on theirs.group_id = mine.group_id
    where mine.user_id = (select auth.uid()) and theirs.user_id = p_user_id
  );
$$;

-- ─── Row Level Security ──────────────────────────────────────────────────────

alter table public.prode_races enable row level security;
alter table public.prode_groups enable row level security;
alter table public.prode_members enable row level security;
alter table public.prode_predictions enable row level security;

-- El calendario es público y solo se carga desde el SQL Editor.
create policy "prode_races_select" on public.prode_races for select to anon, authenticated using (true);

-- Grupos: se crean con create_prode_group.
create policy "prode_groups_select" on public.prode_groups for select to authenticated
  using (public.is_prode_member(id));
create policy "prode_groups_update" on public.prode_groups for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "prode_groups_delete" on public.prode_groups for delete to authenticated
  using (owner_id = (select auth.uid()));

-- Miembros: se suman con create_prode_group / join_prode_group (sin update directo,
-- así nadie puede cambiarse de grupo ni de rol).
create policy "prode_members_select" on public.prode_members for select to authenticated
  using (public.is_prode_member(group_id));
create policy "prode_members_delete" on public.prode_members for delete to authenticated
  using (user_id = (select auth.uid()));

-- Pronósticos: los tuyos siempre; los de tus compañeros de grupo, recién cuando cierra la carrera.
create policy "prode_predictions_select" on public.prode_predictions for select to authenticated
  using (
    user_id = (select auth.uid())
    or (public.prode_locked(season, round) and public.shares_prode_group(user_id))
  );
create policy "prode_predictions_insert" on public.prode_predictions for insert to authenticated
  with check (user_id = (select auth.uid()) and not public.prode_locked(season, round));
create policy "prode_predictions_update" on public.prode_predictions for update to authenticated
  using (user_id = (select auth.uid()) and not public.prode_locked(season, round))
  with check (user_id = (select auth.uid()) and not public.prode_locked(season, round));
create policy "prode_predictions_delete" on public.prode_predictions for delete to authenticated
  using (user_id = (select auth.uid()) and not public.prode_locked(season, round));

-- ─── Funciones que usa la app ────────────────────────────────────────────────

create function public.create_prode_group(p_name text, p_nickname text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_group_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Necesitás iniciar sesión';
  end if;
  if coalesce(trim(p_nickname), '') = '' then
    raise exception 'Poné cómo te van a ver en el grupo';
  end if;

  insert into public.prode_groups (name, owner_id)
  values (trim(p_name), (select auth.uid()))
  returning id into v_group_id;

  insert into public.prode_members (group_id, user_id, nickname, role)
  values (v_group_id, (select auth.uid()), trim(p_nickname), 'admin');

  return v_group_id;
end;
$$;

create function public.join_prode_group(p_code text, p_nickname text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_group_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Necesitás iniciar sesión';
  end if;
  if coalesce(trim(p_nickname), '') = '' then
    raise exception 'Poné cómo te van a ver en el grupo';
  end if;

  select id into v_group_id from public.prode_groups where invite_code = p_code;
  if v_group_id is null then
    raise exception 'El link de invitación no es válido';
  end if;

  insert into public.prode_members (group_id, user_id, nickname)
  values (v_group_id, (select auth.uid()), trim(p_nickname))
  on conflict (group_id, user_id) do nothing;

  return v_group_id;
end;
$$;

-- Vista de un grupo por código (pública): miembros, quién ya pronosticó las carreras
-- abiertas (sin mostrar qué) y los pronósticos completos de las carreras ya cerradas.
create function public.public_prode_group(p_code text)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'id', g.id,
    'name', g.name,
    'invite_code', g.invite_code,
    'created_at', g.created_at,
    'members', coalesce((
      select jsonb_agg(jsonb_build_object('id', m.id, 'nickname', m.nickname) order by m.joined_at)
      from public.prode_members m where m.group_id = g.id
    ), '[]'::jsonb),
    'predictions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'member_id', m.id,
        'season', p.season,
        'round', p.round,
        'locked', now() >= r.quali_at,
        'pole', case when now() >= r.quali_at then p.pole end,
        'p1', case when now() >= r.quali_at then p.p1 end,
        'p2', case when now() >= r.quali_at then p.p2 end,
        'p3', case when now() >= r.quali_at then p.p3 end,
        'colapinto_position', case when now() >= r.quali_at then p.colapinto_position end
      ))
      from public.prode_members m
      join public.prode_predictions p on p.user_id = m.user_id
      join public.prode_races r on r.season = p.season and r.round = p.round
      -- El grupo cuenta las carreras cuya clasificación fue después de crearlo.
      where m.group_id = g.id and r.quali_at >= g.created_at
    ), '[]'::jsonb)
  )
  from public.prode_groups g
  where g.invite_code = p_code;
$$;

revoke execute on function public.create_prode_group(text, text) from public, anon;
revoke execute on function public.join_prode_group(text, text) from public, anon;
grant execute on function public.create_prode_group(text, text) to authenticated;
grant execute on function public.join_prode_group(text, text) to authenticated;
grant execute on function public.public_prode_group(text) to anon, authenticated;

-- ─── Calendario 2026 (desde la fecha 18) ─────────────────────────────────────
-- Para otra temporada: node scripts/prode-calendar.mjs 2027 y pegá lo que imprime.

insert into public.prode_races (season, round, name, circuit, quali_at, race_at) values
  (2026, 18, 'GP de Estados Unidos', 'Circuit of the Americas', '2026-10-24T21:00:00Z', '2026-10-25T20:00:00Z'),
  (2026, 19, 'GP de Ciudad de México', 'Autódromo Hermanos Rodríguez', '2026-10-31T21:00:00Z', '2026-11-01T20:00:00Z'),
  (2026, 20, 'GP de Brasil', 'Autódromo José Carlos Pace', '2026-11-07T18:00:00Z', '2026-11-08T17:00:00Z'),
  (2026, 21, 'GP de Las Vegas', 'Las Vegas Strip Street Circuit', '2026-11-21T04:00:00Z', '2026-11-22T04:00:00Z'),
  (2026, 22, 'GP de Qatar', 'Lusail International Circuit', '2026-11-28T18:00:00Z', '2026-11-29T16:00:00Z'),
  (2026, 23, 'GP de Abu Dabi', 'Yas Marina Circuit', '2026-12-05T14:00:00Z', '2026-12-06T13:00:00Z')
on conflict (season, round) do update
set name = excluded.name, circuit = excluded.circuit, quali_at = excluded.quali_at, race_at = excluded.race_at;

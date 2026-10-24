// Corre las migraciones de Parrilla en PGlite (Postgres en memoria) simulando Supabase y prueba los permisos (RLS).
// Uso: npm run test:sql
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const dir = process.argv[2] ?? fileURLToPath(new URL("../supabase/migrations", import.meta.url));
const db = new PGlite();

await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  grant usage on schema public to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant execute on functions to anon, authenticated;
  insert into auth.users values ('00000000-0000-0000-0000-00000000000a'), ('00000000-0000-0000-0000-00000000000b');
`);

for (const file of ["0001_liga.sql", "0002_prode.sql"]) {
  await db.exec(readFileSync(`${dir}/${file}`, "utf8"));
  console.log(`✓ ${file} corrió sin errores`);
}

const A = "00000000-0000-0000-0000-00000000000a";
const B = "00000000-0000-0000-0000-00000000000b";

async function as(user, sql, params) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [user ?? ""]);
  await db.exec(user ? "set role authenticated" : "set role anon");
  try {
    return { rows: (await db.query(sql, params)).rows };
  } catch (e) {
    return { error: e.message };
  } finally {
    await db.exec("reset role");
  }
}

let failures = 0;
function check(name, ok, detail) {
  console.log(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` → ${JSON.stringify(detail)}`}`);
  if (!ok) failures++;
}

// ── Liga ─────────────────────────────────────────────────────────────────────
const league = await as(A, "insert into public.leagues (name) values ('Jueves') returning id, invite_code");
check("A crea una liga", !league.error, league);
const { id: leagueId, invite_code: leagueCode } = league.rows[0];
let r = await as(A, "select public.claim_driver($1, null, 'Benja') as id", [leagueId]);
check("A se crea como piloto", !r.error, r);
const benja = r.rows[0].id;
r = await as(A, "insert into public.drivers (league_id, name) values ($1, 'Juan') returning id", [leagueId]);
const juan = r.rows[0].id;
r = await as(A, "select public.save_event($1, null, 'Fecha 1', 'Zárate', '2026-11-01', $2::jsonb) as id", [
  leagueId,
  JSON.stringify([
    { driver_id: benja, position: 1, best_lap_ms: 45000 },
    { driver_id: juan, position: 2, best_lap_ms: null },
  ]),
]);
check("A guarda una fecha con resultados", !r.error, r);
r = await as(B, "select * from public.leagues");
check("B (no miembro) no ve la liga", r.rows?.length === 0, r);
r = await as(B, "select public.save_event($1, null, 'Trampa', null, '2026-11-02', '[]'::jsonb)", [leagueId]);
check("B no puede cargar fechas", !!r.error, r);
r = await as(null, "select public.public_league($1) as data", [leagueCode]);
check("anon ve la tabla pública", r.rows?.[0]?.data?.results?.length === 2, r);
r = await as(null, "select public.join_league($1)", [leagueCode]);
check("anon no puede unirse", !!r.error, r);
r = await as(B, "select public.join_league($1) as id", [leagueCode]);
check("B se une con el código", r.rows?.[0]?.id === leagueId, r);
r = await as(B, "select public.claim_driver($1, $2) as id", [leagueId, juan]);
check("B reclama a Juan", !r.error, r);
r = await as(B, "select public.claim_driver($1, $2) as id", [leagueId, benja]);
check("B no puede reclamar un segundo piloto", !!r.error, r);
r = await as(B, "delete from public.events where league_id = $1 returning id", [leagueId]);
check("B (miembro, no admin) no puede borrar fechas", r.rows?.length === 0, r);

// ── Prode ────────────────────────────────────────────────────────────────────
r = await as(A, "select public.create_prode_group('Familia', 'Benja') as id");
check("A crea un grupo de prode", !r.error, r);
const groupId = r.rows[0].id;
r = await as(A, "select invite_code from public.prode_groups where id = $1", [groupId]);
const groupCode = r.rows[0].invite_code;

const pred = "insert into public.prode_predictions (user_id, season, round, p1, p2, p3, colapinto_position) values ($1, 2026, 23, 'max_verstappen', 'leclerc', 'norris', 9)";
r = await as(A, pred, [A]);
check("A pronostica Abu Dabi (abierta)", !r.error, r);
r = await as(A, "insert into public.prode_predictions (user_id, season, round, p1, p2) values ($1, 2026, 22, 'norris', 'norris')", [A]);
check("no deja repetir piloto en el podio", !!r.error, r);
r = await as(B, pred, [A]);
check("B no puede pronosticar a nombre de A", !!r.error, r);

r = await as(B, "select public.join_prode_group($1, 'benja') as id", [groupCode]);
check("no deja repetir apodo (sin importar mayúsculas)", !!r.error, r);
r = await as(B, "select public.join_prode_group($1, 'Mamá') as id", [groupCode]);
check("B se une al grupo", r.rows?.[0]?.id === groupId, r);

r = await as(B, "select * from public.prode_predictions where user_id = $1", [A]);
check("B NO ve el pronóstico de A antes del cierre", r.rows?.length === 0, r);
r = await as(null, "select public.public_prode_group($1) as data", [groupCode]);
const before = r.rows?.[0]?.data?.predictions?.[0];
check("vista pública: muestra que A pronosticó pero no qué", before && before.locked === false && before.p1 === null, r);

// Simula que el grupo se creó días antes y que la clasificación ya empezó.
await db.exec("update public.prode_groups set created_at = now() - interval '3 days'");
await db.exec("update public.prode_races set quali_at = now() - interval '1 hour' where season = 2026 and round = 23");

r = await as(B, "select p1 from public.prode_predictions where user_id = $1", [A]);
check("B SÍ ve el pronóstico de A después del cierre", r.rows?.[0]?.p1 === "max_verstappen", r);
r = await as(A, "update public.prode_predictions set p1 = 'leclerc' where user_id = $1 and round = 23 returning p1", [A]);
check("A no puede cambiar el pronóstico después del cierre", r.rows?.length === 0 || !!r.error, r);
r = await as(null, "select public.public_prode_group($1) as data", [groupCode]);
const after = r.rows?.[0]?.data?.predictions?.[0];
check("vista pública: muestra el pronóstico después del cierre", after?.p1 === "max_verstappen", r);
r = await as(B, "update public.prode_members set role = 'admin' where user_id = $1 returning role", [B]);
check("B no puede cambiarse el rol", r.rows?.length === 0 || !!r.error, r);
r = await as(null, "select * from public.prode_predictions");
check("anon no lee pronósticos directo", r.rows?.length === 0 || !!r.error, r);
r = await as(null, "insert into public.prode_races (season, round, name, quali_at, race_at) values (2027, 1, 'x', now(), now())");
check("nadie puede tocar el calendario desde la app", !!r.error, r);

console.log(failures ? `\n${failures} chequeos fallaron` : "\nTodo OK");
process.exit(failures ? 1 : 0);

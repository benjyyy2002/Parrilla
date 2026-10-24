// Genera el SQL con el calendario de una temporada de F1 para el prode.
// Uso: node scripts/prode-calendar.mjs 2027 > calendario.sql   (y lo pegás en el SQL Editor de Supabase)
//      node scripts/prode-calendar.mjs 2026 19                  (solo desde la fecha 19)

const season = Number(process.argv[2]);
const fromRound = Number(process.argv[3] ?? 1);
if (!season) {
  console.error("Uso: node scripts/prode-calendar.mjs <temporada> [desde_fecha]");
  process.exit(1);
}

const SPANISH = {
  "Abu Dhabi": "Abu Dabi",
  Australian: "Australia",
  Austrian: "Austria",
  Azerbaijan: "Azerbaiyán",
  Bahrain: "Baréin",
  Barcelona: "Barcelona",
  Belgian: "Bélgica",
  Brazilian: "Brasil",
  British: "Gran Bretaña",
  Canadian: "Canadá",
  Chinese: "China",
  Dutch: "Países Bajos",
  "Emilia Romagna": "Emilia-Romaña",
  Hungarian: "Hungría",
  Italian: "Italia",
  Japanese: "Japón",
  "Las Vegas": "Las Vegas",
  Madrid: "Madrid",
  "Mexico City": "Ciudad de México",
  Miami: "Miami",
  Monaco: "Mónaco",
  Qatar: "Qatar",
  "Saudi Arabian": "Arabia Saudita",
  Singapore: "Singapur",
  Spanish: "España",
  "United States": "Estados Unidos",
};

function spanishName(raceName) {
  const key = raceName.replace(/ Grand Prix$/, "");
  return `GP de ${SPANISH[key] ?? key}`;
}

const sql = (text) => `'${String(text).replaceAll("'", "''")}'`;

const response = await fetch(`https://api.jolpi.ca/ergast/f1/${season}/races/?limit=100`);
const races = (await response.json()).MRData.RaceTable.Races.filter((r) => Number(r.round) >= fromRound);

const rows = races.map((r) => {
  const quali = r.Qualifying ? `${r.Qualifying.date}T${r.Qualifying.time ?? "00:00:00Z"}` : `${r.date}T00:00:00Z`;
  const race = `${r.date}T${r.time ?? "00:00:00Z"}`;
  return `  (${season}, ${r.round}, ${sql(spanishName(r.raceName))}, ${sql(r.Circuit.circuitName)}, ${sql(quali)}, ${sql(race)})`;
});

console.log(`insert into public.prode_races (season, round, name, circuit, quali_at, race_at) values
${rows.join(",\n")}
on conflict (season, round) do update
set name = excluded.name, circuit = excluded.circuit, quali_at = excluded.quali_at, race_at = excluded.race_at;`);

// Mensajes para compartir por WhatsApp. Usan el formato de WhatsApp (*negrita*)
// y el link se agrega al final en su propia línea (lo hace ShareLink).

import { formatLapTime } from "./laptime";
import type { EventResultRow, StandingRow } from "./standings";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function leagueInviteMessage({
  name,
  eventsCount,
  leader,
}: {
  name: string;
  eventsCount: number;
  leader: StandingRow | undefined;
}): string {
  const lines = [
    `🏁 *¡Armamos la liga "${name}"!* 🏎️💨`,
    "",
    "Cada vez que vayamos al karting cargamos la fecha y la tabla se arma sola, como en la F1 🏆",
    "Puntos, podios, vuelta rápida y duelos cara a cara. Se terminaron las discusiones de quién es el más rápido 😎",
  ];
  if (eventsCount > 0 && leader && leader.points > 0) {
    lines.push("", `📊 Ya van ${plural(eventsCount, "fecha", "fechas")} y la punta la tiene *${leader.driver.name}* con ${leader.points} pts. ¿Quién lo baja? 👀`);
  }
  lines.push("", "👉 Mirá la tabla y elegí tu piloto acá:");
  return lines.join("\n");
}

const MEDALS = ["🥇", "🥈", "🥉"];

export function eventResultMessage({
  league,
  event,
  rows,
  leader,
}: {
  league: string;
  event: string;
  rows: EventResultRow[];
  leader: StandingRow | undefined;
}): string {
  const lines = [`🏁 *${event} · ${league}* 🏁`, ""];

  if (rows.length === 0) {
    lines.push("Ya están cargados los resultados 🏎️");
  } else {
    lines.push(`🏆 ¡Ganó *${rows[0].driver.name}*!`, "");
    rows.slice(0, 3).forEach((row, i) => lines.push(`${MEDALS[i]} ${row.driver.name}`));
    const fastest = rows.find((r) => r.fastestLap);
    if (fastest?.bestLapMs) {
      lines.push(`⏱️ Vuelta rápida: *${fastest.driver.name}* (${formatLapTime(fastest.bestLapMs)})`);
    }
  }

  if (leader && leader.points > 0) {
    lines.push("", `📊 En el campeonato manda *${leader.driver.name}* con ${leader.points} pts 🔥`);
  }
  lines.push("", "👉 Resultados completos y la tabla acá:");
  return lines.join("\n");
}

export function prodeInviteMessage({
  group,
  nextRace,
}: {
  group: string;
  nextRace: { name: string; closes: string } | null;
}): string {
  const lines = [
    `🏎️ *¡Se viene el prode de F1 "${group}"!* 🏆`,
    "",
    "Cada carrera pronosticamos la pole, el podio y en qué puesto termina Colapinto 🇦🇷",
    "Los puntos se calculan solos con el resultado oficial y la tabla queda para todos 📊",
  ];
  if (nextRace) {
    lines.push("", `⏰ Próxima: *${nextRace.name}* — cierra el ${nextRace.closes}. ¡No te quedes afuera!`);
  }
  lines.push("", "👉 Sumate acá (es un toque):");
  return lines.join("\n");
}

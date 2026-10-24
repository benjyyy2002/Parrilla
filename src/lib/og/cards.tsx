// Imágenes para compartir (vista previa de WhatsApp e historias de Instagram).
// Satori solo entiende flexbox: todo div con más de un hijo necesita display: flex.

import { formatDate } from "@/lib/dates";
import { formatLapTime } from "@/lib/laptime";
import { computeStandings, eventResults, type EventResultRow } from "@/lib/standings";
import type { LeagueData, LeagueEvent } from "@/lib/types";

const C = {
  bg: "#09090b",
  panel: "#18181b",
  border: "#27272a",
  text: "#f4f4f5",
  muted: "#a1a1aa",
  red: "#ef4444",
  gold: "#facc15",
  silver: "#d4d4d8",
  bronze: "#d97706",
  purple: "#c084fc",
};
const PODIUM = [C.gold, C.silver, C.bronze];

const title = { fontFamily: "Barlow", fontWeight: 800, fontStyle: "italic" as const };
const body = { fontFamily: "Barlow", fontWeight: 600 };

function Brand({ size }: { size: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.4, fontSize: size, color: C.text, ...title }}>
      <span>🏁</span>
      <span>Parrilla</span>
    </div>
  );
}

function Frame({ children, padding }: { children: React.ReactNode; padding: number }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: C.bg,
        color: C.text,
        padding,
        position: "relative",
        ...body,
      }}
    >
      {/* Franja roja de "largada" a la izquierda */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 16, background: C.red }} />
      {children}
    </div>
  );
}

/** 1200×630: tabla del campeonato (vista previa del link de la liga). */
export function LeagueCard({ league }: { league: LeagueData }) {
  const standings = computeStandings(league).slice(0, 5);
  const lastEvent = league.events.at(-1);
  const extra = league.drivers.length - standings.length;

  return (
    <Frame padding={56}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Brand size={34} />
        <span style={{ fontSize: 28, color: C.muted }}>{`Temporada ${league.season}`}</span>
      </div>
      <div style={{ display: "flex", fontSize: 76, marginTop: 18, lineHeight: 1, ...title }}>{league.name}</div>

      <div style={{ display: "flex", flexDirection: "column", marginTop: 28, gap: 8 }}>
        {standings.map((row, i) => (
          <div
            key={row.driver.id}
            style={{
              display: "flex",
              alignItems: "center",
              background: C.panel,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: "8px 20px",
              fontSize: 32,
            }}
          >
            <span style={{ width: 56, color: PODIUM[i] ?? C.muted, ...title }}>{i + 1}</span>
            <span style={{ flex: 1 }}>{row.driver.name}</span>
            <span style={{ fontSize: 36, ...title }}>{`${row.points} pts`}</span>
          </div>
        ))}
        {standings.length === 0 && <span style={{ fontSize: 32, color: C.muted }}>Todavía no hay pilotos.</span>}
      </div>

      <div style={{ display: "flex", marginTop: "auto", fontSize: 26, color: C.muted }}>
        {[
          lastEvent ? `Última: ${lastEvent.name} · ${formatDate(lastEvent.held_on)}` : "Todavía no se corrió ninguna fecha",
          extra > 0 ? ` · +${extra} pilotos` : "",
        ].join("")}
      </div>
    </Frame>
  );
}

function PodiumStep({ row, place, scale }: { row: EventResultRow | undefined; place: number; scale: number }) {
  const heights = [220, 160, 120];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 300 * scale }}>
      <span style={{ fontSize: 40 * scale, textAlign: "center", ...title }}>{row?.driver.name ?? "—"}</span>
      <span style={{ fontSize: 26 * scale, color: C.muted, marginTop: 4 * scale }}>
        {row ? `${row.bestLapMs ? formatLapTime(row.bestLapMs) : ""}${row.fastestLap ? " ⏱" : ""}` : ""}
      </span>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          marginTop: 12 * scale,
          width: "100%",
          height: heights[place - 1] * scale,
          background: PODIUM[place - 1],
          borderRadius: `${12 * scale}px ${12 * scale}px 0 0`,
          color: C.bg,
          fontSize: 72 * scale,
          paddingTop: 8 * scale,
          ...title,
        }}
      >
        {String(place)}
      </div>
    </div>
  );
}

function Podium({ rows, scale }: { rows: EventResultRow[]; scale: number }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 16 * scale }}>
      <PodiumStep row={rows[1]} place={2} scale={scale} />
      <PodiumStep row={rows[0]} place={1} scale={scale} />
      <PodiumStep row={rows[2]} place={3} scale={scale} />
    </div>
  );
}

function eventSubtitle(event: LeagueEvent) {
  return `${formatDate(event.held_on)}${event.track ? ` · ${event.track}` : ""}`;
}

/** 1200×630: podio de una fecha (vista previa del link de la fecha). */
export function EventCard({ league, event }: { league: LeagueData; event: LeagueEvent }) {
  const rows = eventResults(league, event.id);
  return (
    <Frame padding={56}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Brand size={34} />
        <span style={{ fontSize: 28, color: C.muted }}>{league.name}</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 24, marginTop: 12 }}>
        <span style={{ fontSize: 72, ...title }}>{event.name}</span>
        <span style={{ fontSize: 30, color: C.muted }}>{eventSubtitle(event)}</span>
      </div>
      <div style={{ display: "flex", marginTop: "auto", justifyContent: "center" }}>
        <Podium rows={rows} scale={1} />
      </div>
    </Frame>
  );
}

function StoryRow({ left, name, middle, right, highlight }: { left: string; name: string; middle?: string; right: string; highlight?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        background: C.panel,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        padding: "12px 28px",
        fontSize: 38,
      }}
    >
      <span style={{ width: 72, color: highlight ?? C.muted, ...title }}>{left}</span>
      <span style={{ flex: 1 }}>{name}</span>
      <span style={{ display: "flex", justifyContent: "flex-end", width: 200, color: C.muted, fontSize: 32 }}>
        {middle ?? ""}
      </span>
      <span style={{ display: "flex", justifyContent: "flex-end", width: 150, ...title }}>{right}</span>
    </div>
  );
}

/** Tabla del campeonato contando solo hasta la fecha indicada (inclusive). */
function standingsAfter(league: LeagueData, eventId: string) {
  const index = league.events.findIndex((e) => e.id === eventId);
  const events = league.events.slice(0, index + 1);
  const ids = new Set(events.map((e) => e.id));
  return computeStandings({ ...league, events, results: league.results.filter((r) => ids.has(r.event_id)) });
}

/** 1080×1920: resultado completo de una fecha y cómo quedó el campeonato, para historias. */
export function EventStory({ league, event, url }: { league: LeagueData; event: LeagueEvent; url: string }) {
  const rows = eventResults(league, event.id);
  const rest = rows.slice(3, 9);
  const championship = standingsAfter(league, event.id).slice(0, 3);

  return (
    <Frame padding={80}>
      <Brand size={48} />
      <span style={{ fontSize: 40, color: C.muted, marginTop: 56 }}>{league.name}</span>
      <span style={{ fontSize: 120, lineHeight: 1, marginTop: 8, ...title }}>{event.name}</span>
      <span style={{ fontSize: 38, color: C.muted, marginTop: 16 }}>{eventSubtitle(event)}</span>

      <div style={{ display: "flex", justifyContent: "center", marginTop: 64 }}>
        <Podium rows={rows} scale={0.97} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 36 }}>
        {rest.map((row) => (
          <StoryRow
            key={row.driver.id}
            left={String(row.position)}
            name={row.driver.name}
            middle={row.bestLapMs ? `${formatLapTime(row.bestLapMs)}${row.fastestLap ? " ⏱" : ""}` : undefined}
            right={`+${row.points}`}
          />
        ))}
      </div>

      {championship.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 48 }}>
          <span style={{ fontSize: 34, color: C.red, letterSpacing: 4, ...title }}>ASÍ VA EL CAMPEONATO</span>
          {championship.map((row, i) => (
            <StoryRow
              key={row.driver.id}
              left={String(i + 1)}
              name={row.driver.name}
              right={`${row.points} pts`}
              highlight={PODIUM[i]}
            />
          ))}
        </div>
      )}

      <span style={{ marginTop: "auto", fontSize: 32, color: C.muted }}>{url}</span>
    </Frame>
  );
}

/** Todo el texto que aparece en las imágenes, para bajar solo esos caracteres de la fuente. */
export function cardText(league: LeagueData): string {
  return [league.name, league.season, ...league.drivers.map((d) => d.name), ...league.events.flatMap((e) => [e.name, e.track ?? ""])].join("");
}

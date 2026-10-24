import { COLAPINTO_ID, type RaceOutcome } from "./f1";

export const PRODE_POINTS = {
  pole: 5,
  winner: 10,
  podiumExact: 5,
  /** 2º o 3º que terminó en el podio, pero en otro puesto. */
  podiumOther: 2,
  colapintoExact: 10,
  colapintoNear: 5,
};

export type Prediction = {
  pole: string | null;
  p1: string | null;
  p2: string | null;
  p3: string | null;
  colapinto_position: number | null;
};

export type PredictionScore = {
  pole: number;
  p1: number;
  p2: number;
  p3: number;
  colapinto: number;
  total: number;
};

function podiumPick(pick: string | null, position: 2 | 3, podium: string[]): number {
  if (!pick) return 0;
  if (podium[position - 1] === pick) return PRODE_POINTS.podiumExact;
  return podium.includes(pick) ? PRODE_POINTS.podiumOther : 0;
}

/** Posición final de Colapinto (si abandonó, el puesto en que lo clasificaron), o null si no corrió. */
export function colapintoPosition(outcome: RaceOutcome): number | null {
  const index = outcome.finish.indexOf(COLAPINTO_ID);
  return index === -1 ? null : index + 1;
}

export function scorePrediction(prediction: Prediction, outcome: RaceOutcome): PredictionScore {
  const podium = outcome.finish.slice(0, 3);
  const pole = prediction.pole && prediction.pole === outcome.pole ? PRODE_POINTS.pole : 0;
  const p1 = prediction.p1 && prediction.p1 === podium[0] ? PRODE_POINTS.winner : 0;
  const p2 = podiumPick(prediction.p2, 2, podium);
  const p3 = podiumPick(prediction.p3, 3, podium);

  let colapinto = 0;
  const actual = colapintoPosition(outcome);
  if (actual !== null && prediction.colapinto_position !== null) {
    const diff = Math.abs(actual - prediction.colapinto_position);
    colapinto = diff === 0 ? PRODE_POINTS.colapintoExact : diff === 1 ? PRODE_POINTS.colapintoNear : 0;
  }

  return { pole, p1, p2, p3, colapinto, total: pole + p1 + p2 + p3 + colapinto };
}

export type RaceKey = `${number}-${number}`;
export const raceKey = (season: number, round: number): RaceKey => `${season}-${round}`;

export type ProdeMember = { id: string; nickname: string };
export type GroupPrediction = Prediction & { member_id: string; season: number; round: number };

export type ProdeStandingRow = {
  member: ProdeMember;
  points: number;
  /** Carreras con resultado en las que pronosticó. */
  races: number;
  /** Ganadores acertados (sirve para desempatar). */
  winners: number;
};

/** Tabla del grupo: suma los puntos de cada carrera que ya tiene resultado oficial. */
export function prodeStandings(
  members: ProdeMember[],
  predictions: GroupPrediction[],
  outcomes: Map<RaceKey, RaceOutcome>,
): ProdeStandingRow[] {
  const rows = new Map(members.map((m) => [m.id, { member: m, points: 0, races: 0, winners: 0 }]));

  for (const prediction of predictions) {
    const outcome = outcomes.get(raceKey(prediction.season, prediction.round));
    const row = rows.get(prediction.member_id);
    if (!outcome || !row) continue;
    const score = scorePrediction(prediction, outcome);
    row.points += score.total;
    row.races += 1;
    if (score.p1 > 0) row.winners += 1;
  }

  return [...rows.values()].sort(
    (a, b) => b.points - a.points || b.winners - a.winners || a.member.nickname.localeCompare(b.member.nickname, "es"),
  );
}

export type Driver = {
  id: string;
  name: string;
  user_id: string | null;
  /** Solo viene en la vista pública: si algún usuario ya reclamó este piloto. */
  claimed?: boolean;
};

export type LeagueEvent = {
  id: string;
  name: string;
  track: string | null;
  held_on: string;
};

export type Result = {
  event_id: string;
  driver_id: string;
  position: number;
  best_lap_ms: number | null;
};

export type League = {
  id: string;
  name: string;
  season: string;
  points: number[];
  fastest_lap_point: boolean;
  invite_code: string;
};

export type LeagueData = League & {
  drivers: Driver[];
  events: LeagueEvent[];
  results: Result[];
};

export const F1_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

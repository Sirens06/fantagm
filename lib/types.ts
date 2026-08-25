export type Role = "P" | "D" | "C" | "A";

export type PlayerStatus = "TITOLARE" | "BALLOTTAGGIO" | "RISERVA" | "FUORI_ROSA";

export type Competition =
  | "SERIE_A"
  | "SERIE_B"
  | "PREMIER_LEAGUE"
  | "LA_LIGA"
  | "BUNDESLIGA"
  | "LIGUE_1"
  | "EREDIVISIE"
  | "PRIMEIRA_LIGA"
  | "ALTRO";

export type Formation =
  | "3-5-2"
  | "5-3-2"
  | "3-5-1-1"
  | "4-3-3"
  | "4-2-3-1"
  | "3-4-3"
  | "3-4-2-1"
  | "4-3-1-2"
  | "3-4-1-2"
  | "4-4-2"
  | "4-4-1-1"
  | "4-1-4-1"
  | "4-2-4"
  | "5-4-1";

export type Tier = "certezza" | "equilibrio" | "scommessa" | "esotico" | "sconsigliato";

export type Valuation = {
  suggestedPrice: number;
  projectedFantaAvg: number;
  confidence: "alta" | "media" | "bassa";
  breakdown: Record<string, number>;
}

export interface TradeSuggestion {
  player: Player;
  score: number;
  reasons: string[];
  tacticalFit: number;
  fixtureScore: number;
  formTrend: number;
}

export interface Player {
  id: string;
  name: string;
  externalId?: string;
  birthDate: Date;
  role: Role;
  detailedPosition: string;
  prFormation: Formation[];
  status: PlayerStatus;
  isSuspended: boolean;
  suspensionMatches: number;
  isPenaltyTaker: boolean;
  officialPrice?: number;
  teamId: string;
  stats: SeasonStats[];
  /** Le ultime giornate, dalla piu' recente. Puo' essere vuoto: in quel caso
   *  formaRecente() ricade sul confronto fra stagioni. */
  matches: MatchPerformance[];
  injuries: Injury[];
  team: Team;
}

export interface MatchPerformance {
  id: string;
  playerId: string;
  season: string;
  matchday: number;
  played: boolean;
  minutes: number;
  rating: number | null;
  fantaRating: number | null;
  goals: number;
  assists: number;
  yCard: boolean;
  rCard: boolean;
  penaltyScored: number;
  penaltyMissed: number;
  penaltySaved: number;
  goalsConceded: number;
  cleanSheet: boolean;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  externalId?: string;
  reliability: number;
  fixtureDiffNext8: number;
  attackStrength: number;
  defenseStrength: number;
  isPromoted: boolean;
  players?: Player[];
  coach?: Coach;
}

export interface Coach {
  id: string;
  name: string;
  formation: Formation;
  alternativeFormations: Formation[];
  rotationIndex: number;
  isCurrent: boolean;
  sinceDate?: Date;
  teamId: string;
  team: Team;
}

export interface SeasonStats {
  id: string;
  season: string;
  competition: Competition;
  appareances: number;
  startingAppearances: number;
  minutes: number;
  goals: number;
  assists: number;
  yCards: number;
  rCard: number;
  penaltiesTaken: number;
  penaltiesScored: number;
  cleanSheets: number;
  goalsConceded: number;
  penaltiesSaved: number;
  avgRating: number;
  avRatingFanta: number;
  playerId: string;
  teamId: string;
  player?: Player;
}

export interface Injury {
  id: string;
  type: string;
  season: string;
  date: Date;
  daysOut: number;
  matchesMissed: number;
  isActive: boolean;
  expectedReturn?: Date;
  playerId: string;
  player?: Player;
}

// ---------------------------------------------------------------------------
// Asta - i DTO che viaggiano verso il browser.
// Nota: adminToken non compare in nessuno di questi. Esce solo alla creazione.
// ---------------------------------------------------------------------------

export type StatoStanza = "ATTESA" | "CORSO" | "FINITA";

export type GiocatoreDTO = {
  id: string;
  nome: string;
  squadra: string;
  ruolo: Role;
  quotazione: number | null;
  prezzoConsigliato: number;
  scarto: number;
  fascia: Tier;
  venduto: boolean;
};

export type SquadraDTO = {
  id: string;
  nome: string;
  budget: number;
  spesa: number;
  slot: Record<Role, number>;
};

export type RilancioDTO = {
  squadraId: string;
  squadraNome: string;
  importo: number;
  quando: string;
};

export type LottoDTO = {
  id: string;
  giocatore: GiocatoreDTO;
  offerta: number;
  leader: { id: string; nome: string } | null;
  rilanci: RilancioDTO[];
};

export type StatoAsta = {
  codice: string;
  nome: string;
  stato: StatoStanza;
  budget: number;
  slotMax: Record<Role, number>;
  lotto: LottoDTO | null;
  squadre: SquadraDTO[];
  aggiornatoIl: string;
};

export type ErroreApi = {
  errore: string;
  messaggio: string;
};

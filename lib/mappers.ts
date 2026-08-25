import { Prisma, type SeasonStats, type Injury } from "@prisma/client";
import type {
  Player as CorePlayer,
  Coach as CoreCoach,
  Team as CoreTeam,
  Formation,
} from "./types";

// Da usare in TUTTE le query sui giocatori. L'orderBy non e' un dettaglio:
// evaluatePlayer() e classifyTier() prendono l'ultima stagione con stats.at(-1),
// e senza ordinamento esplicito Postgres restituisce le righe come gli pare.
export const playerInclude = {
  team: true,
  stats: { orderBy: { season: "asc" } },
  injuries: { orderBy: { date: "asc" } },
  // Solo le ultime giornate: servono alla forma, e caricarle tutte
  // gonfierebbe ogni risposta senza aggiungere niente.
  matches: {
    orderBy: [{ season: "desc" }, { matchday: "desc" }],
    take: 12,
  },
} satisfies Prisma.PlayerInclude;

// Derivato da playerInclude invece che riscritto: aggiungere una relazione
// li' sopra aggiorna anche questo tipo, senza doversene ricordare.
type PlayerWithRelations = Prisma.PlayerGetPayload<{ include: typeof playerInclude }>;

type CoachWithRelations = Prisma.CoachGetPayload<{
  include: { team: true };
}>;

export function toCoreTeam(t: PlayerWithRelations["team"]): CoreTeam {
  return {
    id: t.id,
    name: t.name,
    shortName: t.shortName,
    externalId: t.externalId ?? undefined,
    reliability: t.reliability,
    fixtureDiffNext8: t.fixtureDiffNext8,
    attackStrength: t.attackStrength,
    defenseStrength: t.defenseStrength,
    isPromoted: t.isPromoted,
  };
}

export function toCorePlayer(p: PlayerWithRelations): CorePlayer {
  return {
    id: p.id,
    name: p.name,
    externalId: p.externalId ?? undefined,
    birthDate: p.birthDate,
    role: p.role as CorePlayer["role"],
    detailedPosition: p.detailedPosition,
    prFormation: p.prFormation as Formation[],
    status: p.status as CorePlayer["status"],
    isSuspended: p.isSuspended,
    suspensionMatches: p.suspensionMatches,
    isPenaltyTaker: p.isPenaltyTaker,
    officialPrice: p.officialPrice ?? undefined,
    teamId: p.teamId,
    stats: p.stats.map(toCoreSeasonStats),
    matches: p.matches.map(toCoreMatch),
    injuries: p.injuries.map(toCoreInjury),
    team: toCoreTeam(p.team),
  };
}

export function toCoreMatch(m: PlayerWithRelations["matches"][number]) {
  return {
    id: m.id,
    playerId: m.playerId,
    season: m.season,
    matchday: m.matchday,
    played: m.played,
    minutes: m.minutes,
    rating: m.rating,
    fantaRating: m.fantaRating,
    goals: m.goals,
    assists: m.assists,
    yCard: m.yCard,
    rCard: m.rCard,
    penaltyScored: m.penaltyScored,
    penaltyMissed: m.penaltyMissed,
    penaltySaved: m.penaltySaved,
    goalsConceded: m.goalsConceded,
    cleanSheet: m.cleanSheet,
  };
}

export function toCoreSeasonStats(s: SeasonStats) {
  return {
    id: s.id,
    season: s.season,
    competition: s.competition,
    appareances: s.appareances,
    startingAppearances: s.startingAppearances,
    minutes: s.minutes,
    goals: s.goals,
    assists: s.assists,
    yCards: s.yCards,
    rCard: s.rCard,
    penaltiesTaken: s.penaltiesTaken,
    penaltiesScored: s.penaltiesScored,
    cleanSheets: s.cleanSheets,
    goalsConceded: s.goalsConceded,
    penaltiesSaved: s.penaltiesSaved,
    avgRating: s.avgRating,
    avRatingFanta: s.avRatingFanta,
    playerId: s.playerId,
    teamId: s.teamId,
  };
}

export function toCoreInjury(i: Injury) {
  return {
    id: i.id,
    type: i.type,
    season: i.season,
    date: i.date,
    daysOut: i.daysOut,
    matchesMissed: i.matchesMissed,
    isActive: i.isActive,
    expectedReturn: i.expectedReturn ?? undefined,
    playerId: i.playerId,
  };
}

export function toCoreCoach(c: CoachWithRelations): CoreCoach {
  return {
    id: c.id,
    name: c.name,
    formation: c.formation as Formation,
    alternativeFormations: c.alternativeFormations as Formation[],
    rotationIndex: c.rotationIndex,
    isCurrent: c.isCurrent,
    sinceDate: c.sinceDate ?? undefined,
    teamId: c.teamId,
    team: toCoreTeam(c.team),
  };
}

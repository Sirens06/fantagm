import "dotenv/config";
import { PrismaClient, type Competition, type PlayerStatus, type Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { TEAMS, COACHES, PLAYERS, type SeedPlayer } from "./data/serieA";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const SEASONS = ["2022-23", "2023-24", "2024-25"];
const MATCHDAYS_PER_SEASON = 38;

// ---------------------------------------------------------------------------
// Generatore deterministico: stesso nome -> stessi numeri, sempre.
// Cosi' due seed di fila non fanno ballare le valutazioni.
// ---------------------------------------------------------------------------

function makeRng(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function rng() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

function between(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min);
}

function round(n: number, decimals = 2): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

// ---------------------------------------------------------------------------
// Statistiche stagionali sintetiche, con distribuzioni diverse per ruolo.
// ---------------------------------------------------------------------------

function buildSeasonStats(player: SeedPlayer, season: string, index: number) {
  const rng = makeRng(`${player.name}|${season}`);
  const q = player.quality;

  // La qualita' cresce leggermente con gli anni per i giovani, cala per i vecchi.
  const age = Number(season.slice(0, 4)) - player.birthYear;
  const curve = age < 24 ? -0.05 + index * 0.03 : age > 31 ? 0.03 - index * 0.03 : 0;
  const form = Math.max(0.1, Math.min(1, q + curve + between(rng, -0.06, 0.06)));

  const starterShare = form > 0.75 ? between(rng, 0.7, 0.95) : between(rng, 0.3, 0.75);
  const appareances = Math.round(between(rng, 18, 36) * (0.6 + form * 0.4));
  const startingAppearances = Math.round(appareances * starterShare);
  const minutes = Math.round(startingAppearances * 85 + (appareances - startingAppearances) * 22);

  let goals = 0;
  let assists = 0;
  let cleanSheets = 0;
  let goalsConceded = 0;
  let penaltiesSaved = 0;
  let penaltiesTaken = 0;

  switch (player.role) {
    case "P":
      cleanSheets = Math.round(between(rng, 2, 14) * form);
      goalsConceded = Math.round(appareances * between(rng, 0.9, 1.9) * (1.4 - form));
      penaltiesSaved = rng() < form * 0.6 ? Math.round(between(rng, 1, 3)) : 0;
      break;
    case "D":
      goals = Math.round(between(rng, 0, 5) * form);
      assists = Math.round(between(rng, 0, 6) * form);
      cleanSheets = Math.round(between(rng, 2, 13) * form);
      break;
    case "C":
      goals = Math.round(between(rng, 1, 11) * form);
      assists = Math.round(between(rng, 1, 10) * form);
      break;
    case "A":
      goals = Math.round(between(rng, 3, 22) * form);
      assists = Math.round(between(rng, 1, 9) * form);
      break;
  }

  if (player.isPenaltyTaker) {
    penaltiesTaken = Math.round(between(rng, 2, 7));
    goals += Math.round(penaltiesTaken * 0.75);
  }
  const penaltiesScored = Math.round(penaltiesTaken * between(rng, 0.6, 0.95));

  // Il voto base sale con la forma; la fantamedia ci somma i bonus.
  const avgRating = round(between(rng, 5.6, 6.4) + form * 0.5);
  const bonus =
    player.role === "P"
      ? (cleanSheets * 1 + penaltiesSaved * 3 - goalsConceded) / Math.max(appareances, 1)
      : (goals * 3 + assists * 1) / Math.max(appareances, 1);
  const avRatingFanta = round(Math.max(4.5, Math.min(9.5, avgRating + bonus)));

  return {
    season,
    competition: "SERIE_A" as Competition,
    appareances,
    startingAppearances,
    minutes,
    goals,
    assists,
    yCards: Math.round(between(rng, 0, 9)),
    rCard: rng() < 0.08 ? 1 : 0,
    penaltiesTaken,
    penaltiesScored,
    cleanSheets,
    goalsConceded,
    penaltiesSaved,
    avgRating,
    avRatingFanta,
  };
}

// ---------------------------------------------------------------------------
// Le singole giornate dell'ultima stagione, coerenti con l'aggregato:
// distribuisco gol e assist sulle partite giocate e faccio oscillare il voto
// attorno alla media, con una deriva finale che crea la "forma".
// ---------------------------------------------------------------------------

function buildMatches(
  player: SeedPlayer,
  season: string,
  aggregato: ReturnType<typeof buildSeasonStats>
) {
  const rng = makeRng(`match|${player.name}|${season}`);
  const righe: {
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
    penaltySaved: number;
    goalsConceded: number;
    cleanSheet: boolean;
  }[] = [];

  // Quali giornate ha giocato: le distribuisco a caso sulle 38.
  const giocate = new Set<number>();
  while (giocate.size < Math.min(aggregato.appareances, MATCHDAYS_PER_SEASON)) {
    giocate.add(1 + Math.floor(rng() * MATCHDAYS_PER_SEASON));
  }
  const elenco = [...giocate].sort((a, b) => a - b);

  // Gol e assist da spalmare sulle presenze.
  const eventi = (totale: number) => {
    const per = new Array(elenco.length).fill(0);
    for (let i = 0; i < totale; i++) per[Math.floor(rng() * elenco.length)]++;
    return per;
  };
  const gol = eventi(aggregato.goals);
  const assist = eventi(aggregato.assists);

  elenco.forEach((matchday, i) => {
    // Deriva sulle ultime giornate: chi sale, chi cala. E' quello che
    // formaRecente() deve saper leggere. Tenuta piccola apposta: nella
    // realta' due finestre di cinque partite differiscono di poco, e con
    // valori troppo larghi il trend saturerebbe a +/-1 per tutti.
    const posizione = i / Math.max(1, elenco.length - 1);
    const deriva = posizione > 0.75 ? between(rng, -0.35, 0.35) : 0;

    const titolare = i < Math.round(aggregato.startingAppearances);
    const minutes = titolare ? Math.round(between(rng, 60, 90)) : Math.round(between(rng, 5, 45));

    // Sotto i 10 minuti non si prende voto.
    const senzaVoto = minutes < 10;
    const rating = senzaVoto
      ? null
      : round(clampNum(aggregato.avgRating + between(rng, -0.7, 0.7) + deriva, 3, 9));

    const g = gol[i];
    const a = assist[i];
    const cleanSheet = player.role === "P" || player.role === "D" ? rng() < 0.32 : false;
    const goalsConceded = player.role === "P" && !cleanSheet ? Math.round(between(rng, 1, 3)) : 0;

    const bonus =
      g * 3 + a * 1 + (player.role === "P" ? (cleanSheet ? 1 : 0) - goalsConceded : 0);
    const fantaRating = rating === null ? null : round(clampNum(rating + bonus, 0, 15));

    righe.push({
      season,
      matchday,
      played: true,
      minutes,
      rating,
      fantaRating,
      goals: g,
      assists: a,
      yCard: rng() < 0.18,
      rCard: rng() < 0.01,
      penaltyScored: 0,
      penaltySaved: 0,
      goalsConceded,
      cleanSheet,
    });
  });

  return righe;
}

function clampNum(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(n, max));
}

// ---------------------------------------------------------------------------
// Calendario: round-robin col metodo del cerchio, 20 squadre -> 38 giornate.
// ---------------------------------------------------------------------------

function buildFixtures(teamIds: string[]) {
  const n = teamIds.length;
  const rotation = [...teamIds];
  const fixed = rotation.shift()!;
  const firstLeg: { matchday: number; home: string; away: string }[] = [];

  for (let round = 0; round < n - 1; round++) {
    const matchday = round + 1;
    const left = [fixed, ...rotation.slice(0, n / 2 - 1)];
    const right = rotation.slice(n / 2 - 1).reverse();

    for (let i = 0; i < left.length; i++) {
      // Alterno casa/trasferta a ogni giornata, cosi' nessuno gioca
      // otto partite di fila in casa.
      const swap = (round + i) % 2 === 0;
      firstLeg.push({
        matchday,
        home: swap ? left[i] : right[i],
        away: swap ? right[i] : left[i],
      });
    }
    rotation.push(rotation.shift()!);
  }

  // Girone di ritorno: stesse partite, campi invertiti.
  const secondLeg = firstLeg.map((f) => ({
    matchday: f.matchday + (n - 1),
    home: f.away,
    away: f.home,
  }));

  const seasonStart = new Date("2025-08-24T18:00:00.000Z");
  return [...firstLeg, ...secondLeg].map((f) => {
    const date = new Date(seasonStart);
    date.setDate(date.getDate() + (f.matchday - 1) * 7);
    return { ...f, date };
  });
}

// Difficolta' delle prossime 8: media della forza dell'avversario, su scala 1-5.
function fixtureDifficulty(
  teamId: string,
  fixtures: { matchday: number; home: string; away: string }[],
  strengthById: Map<string, number>
): number {
  const next8 = fixtures
    .filter((f) => f.home === teamId || f.away === teamId)
    .sort((a, b) => a.matchday - b.matchday)
    .slice(0, 8);

  if (next8.length === 0) return 3;

  const total = next8.reduce((acc, f) => {
    const opponentId = f.home === teamId ? f.away : f.home;
    const strength = strengthById.get(opponentId) ?? 50;
    const homeAdvantage = f.home === teamId ? -4 : 4;
    return acc + strength + homeAdvantage;
  }, 0);

  const avg = total / next8.length; // ~40-90
  return round(Math.max(1, Math.min(5, 1 + ((avg - 35) / 55) * 4)), 2);
}

// ---------------------------------------------------------------------------

async function main() {
  console.log("Seed: dataset dimostrativo (statistiche generate, non reali)\n");

  // --- Squadre -------------------------------------------------------------
  const teamIdByName = new Map<string, string>();
  for (const t of TEAMS) {
    const team = await db.team.upsert({
      where: { name: t.name },
      update: {
        shortName: t.shortName,
        reliability: t.reliability,
        attackStrength: t.attackStrength,
        defenseStrength: t.defenseStrength,
        isPromoted: t.isPromoted,
      },
      create: {
        name: t.name,
        shortName: t.shortName,
        reliability: t.reliability,
        attackStrength: t.attackStrength,
        defenseStrength: t.defenseStrength,
        isPromoted: t.isPromoted,
      },
    });
    teamIdByName.set(t.name, team.id);
  }
  console.log(`  squadre      ${TEAMS.length}`);

  // --- Allenatori ----------------------------------------------------------
  for (const c of COACHES) {
    const teamId = teamIdByName.get(c.team);
    if (!teamId) throw new Error(`Allenatore ${c.name}: squadra "${c.team}" inesistente`);

    await db.coach.upsert({
      where: { teamId },
      update: {
        name: c.name,
        formation: c.formation,
        alternativeFormations: c.alternativeFormations,
        rotationIndex: c.rotationIndex,
        isCurrent: true,
      },
      create: {
        teamId,
        name: c.name,
        formation: c.formation,
        alternativeFormations: c.alternativeFormations,
        rotationIndex: c.rotationIndex,
        isCurrent: true,
        sinceDate: new Date("2025-07-01T00:00:00.000Z"),
      },
    });
  }
  console.log(`  allenatori   ${COACHES.length}`);

  // --- Giocatori, statistiche, infortuni -----------------------------------
  let statsCount = 0;
  let matchCount = 0;
  let injuryCount = 0;

  for (const p of PLAYERS) {
    const teamId = teamIdByName.get(p.team);
    if (!teamId) throw new Error(`Giocatore ${p.name}: squadra "${p.team}" inesistente`);

    const birthDate = new Date(Date.UTC(p.birthYear, 5, 15));
    const payload = {
      birthDate,
      role: p.role as Role,
      detailedPosition: p.detailedPosition,
      prFormation: p.prFormation,
      status: p.status as PlayerStatus,
      isPenaltyTaker: p.isPenaltyTaker ?? false,
      officialPrice: p.officialPrice,
    };

    const player = await db.player.upsert({
      where: { name_teamId: { name: p.name, teamId } },
      update: payload,
      create: { ...payload, name: p.name, teamId },
    });

    for (const [index, season] of SEASONS.entries()) {
      const stats = buildSeasonStats(p, season, index);
      await db.seasonStats.upsert({
        where: {
          playerId_season_teamId: { playerId: player.id, season, teamId },
        },
        update: stats,
        create: { ...stats, playerId: player.id, teamId },
      });
      statsCount++;

      // Le giornate solo per l'ultima stagione: e' l'unica su cui ha senso
      // parlare di forma, e tenerle tutte non aggiungerebbe niente.
      if (season === SEASONS[SEASONS.length - 1]) {
        for (const m of buildMatches(p, season, stats)) {
          await db.matchPerformance.upsert({
            where: {
              playerId_season_matchday: {
                playerId: player.id,
                season: m.season,
                matchday: m.matchday,
              },
            },
            update: m,
            create: { ...m, playerId: player.id },
          });
          matchCount++;
        }
      }
    }

    // Un giocatore su tre ha avuto un problema fisico recente.
    const rng = makeRng(`inj|${p.name}`);
    if (rng() < 0.33) {
      const daysOut = Math.round(between(rng, 8, 95));
      const season = SEASONS[SEASONS.length - 1];
      const date = new Date(Date.UTC(2024, Math.floor(between(rng, 8, 12)), 12));

      const existing = await db.injury.findFirst({
        where: { playerId: player.id, season, date },
      });
      if (!existing) {
        await db.injury.create({
          data: {
            playerId: player.id,
            season,
            type: daysOut > 60 ? "lesione muscolare" : "affaticamento",
            date,
            daysOut,
            // ~7 giorni a partita: e' la conversione che usa il malus.
            matchesMissed: Math.min(MATCHDAYS_PER_SEASON, Math.round(daysOut / 7)),
            isActive: false,
          },
        });
      }
      injuryCount++;
    }
  }
  console.log(`  giocatori    ${PLAYERS.length}`);
  console.log(`  statistiche  ${statsCount}`);
  console.log(`  giornate     ${matchCount}`);
  console.log(`  infortuni    ${injuryCount}`);

  // --- Calendario ----------------------------------------------------------
  const teamIds = TEAMS.map((t) => teamIdByName.get(t.name)!);
  const fixtures = buildFixtures(teamIds);

  for (const f of fixtures) {
    await db.fixture.upsert({
      where: { matchday_homeTeamId: { matchday: f.matchday, homeTeamId: f.home } },
      update: { awayTeamId: f.away, date: f.date },
      create: {
        matchday: f.matchday,
        date: f.date,
        homeTeamId: f.home,
        awayTeamId: f.away,
      },
    });
  }
  console.log(`  partite      ${fixtures.length}`);

  // --- fixtureDiffNext8, calcolato dal calendario appena creato ------------
  const strengthById = new Map(
    TEAMS.map((t) => [teamIdByName.get(t.name)!, (t.attackStrength + t.defenseStrength) / 2])
  );

  for (const teamId of teamIds) {
    await db.team.update({
      where: { id: teamId },
      data: { fixtureDiffNext8: fixtureDifficulty(teamId, fixtures, strengthById) },
    });
  }
  console.log(`  calendario   difficolta' prossime 8 calcolata per 20 squadre`);
}

main()
  .then(async () => {
    console.log("\nFatto.");
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });

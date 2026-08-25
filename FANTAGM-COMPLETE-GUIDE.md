# FantaGM — Guida Completa da Zero a Produzione

**Tempo totale:** 15-20 ore di lavoro focato  
**Risultato finale:** App web Next.js con database, algoritmi di valutazione, trade advisor, asta simulata  
**Versione:** 1.0

---

## INDICE

### PARTE 1: SETUP INIZIALE (Steps 1-4)
### PARTE 2: DATABASE (Steps 5-9)
### PARTE 3: CORE TYPESCRIPT - ALGORITMI (Steps 10-16)
### PARTE 4: BACKEND API (Steps 17-22)
### PARTE 5: FRONTEND PAGINE (Steps 23-32)
### PARTE 6: SEED E TESTING (Steps 33-36)
### PARTE 7: DEPLOY (Steps 37-40)

---

# PARTE 1: SETUP INIZIALE

## STEP 1: Crea il progetto Next.js

Apri il terminale nella cartella dove vuoi il progetto:

```bash
cd Desktop
# o dove preferisci
npx create-next-app@latest fantagm --typescript --tailwind
```

**Risposte alle domande:**
- TypeScript? → Yes
- ESLint? → Yes
- Tailwind? → Yes
- src/ directory? → No
- App Router? → Yes
- Turbopack? → No
- Import alias? → No

Attendi 2-3 minuti.

---

## STEP 2: Installa dipendenze aggiuntive

Entra nella cartella:

```bash
cd fantagm
```

Installa:

```bash
npm install prisma @prisma/client framer-motion
npm install -D prisma-zod-types
```

---

## STEP 3: Verifica che Next.js gira

```bash
npm run dev
```

Apri `http://localhost:3000` nel browser. Dovresti vedere la home page di default.

Premi `CTRL+C` nel terminale per fermare il dev server.

---

## STEP 4: Struttura cartelle iniziale

Crea le cartelle che userai:

```bash
mkdir -p lib components app/api
```

---

# PARTE 2: DATABASE

## STEP 5: Inizializza Prisma

```bash
npx prisma init
```

Questo crea:
- `prisma/schema.prisma` — dove descrivi le tabelle
- `.env.local` — variabili di ambiente

---

## STEP 6: Configura il database

Apri `.env.local` e sostituisci la linea `DATABASE_URL` con:

```
DATABASE_URL="file:./dev.db"
```

Questo usa SQLite locale (zero setup).

---

## STEP 7: Crea lo schema Prisma

Apri `prisma/schema.prisma`, **cancella tutto**, e copia questo:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Team {
  id          String   @id @default(cuid())
  name        String   @unique
  shortName   String
  reliability Int      // 1-10
  coach       Coach?
  players     Player[]
  fixtures    Fixture[] @relation("home")
  awayFixtures Fixture[] @relation("away")
}

model Coach {
  id            String @id @default(cuid())
  name          String
  formation     String // "3-5-2", "4-3-3", ecc.
  rotationIndex Float  // 0-1
  teamId        String @unique
  team          Team   @relation(fields: [teamId], references: [id])
}

model Player {
  id                  String         @id @default(cuid())
  name                String
  role                String         // P, D, C, A
  age                 Int
  teamId              String
  team                Team           @relation(fields: [teamId], references: [id])
  preferredFormations Json           // array: ["3-5-2", "4-3-3"]
  detailedPosition    String         // "ala", "punta", ecc.
  officialPrice       Int?           // null prima del listone
  teamReliability     Int            // 1-10
  fixtureDifficultyNext8 Float       // 1-5
  isStarter           Boolean        @default(false)
  stats               SeasonStats[]
  injuries            Injury[]
}

model SeasonStats {
  id              String @id @default(cuid())
  season          String
  appearances     Int
  minutes         Int
  goals           Int
  assists         Int
  avgRating       Float
  avgFantaRating  Float
  penaltiesTaken  Int
  yellowCards     Int
  redCards        Int
  playerId        String
  player          Player @relation(fields: [playerId], references: [id])

  @@unique([playerId, season])
}

model Injury {
  id       String    @id @default(cuid())
  type     String
  daysOut  Int
  date     DateTime
  isActive Boolean   @default(false)
  expectedReturn DateTime?
  playerId String
  player   Player    @relation(fields: [playerId], references: [id])
}

model Fixture {
  id         String   @id @default(cuid())
  matchday   Int
  date       DateTime
  homeTeamId String
  awayTeamId String
  homeTeam   Team     @relation("home", fields: [homeTeamId], references: [id])
  awayTeam   Team     @relation("away", fields: [awayTeamId], references: [id])
}
```

**Salva il file.**

---

## STEP 8: Crea il database

Nel terminale:

```bash
npx prisma db push
```

Rispondi **Y** quando chiede conferma. Questo crea il file `prisma/dev.db` (il database SQLite).

---

## STEP 9: Genera il client Prisma

```bash
npx prisma generate
```

Questo crea il client TypeScript per parlare col database. Non vedrai niente di visibile, ma è essenziale.

---

# PARTE 3: CORE TYPESCRIPT - ALGORITMI

Adesso crei la **logica pura** degli algoritmi (valutazione, tattica, trade advisor). Questa sarà riusabile sia nel web che nel mobile.

## STEP 10: Crea la cartella lib e i tipi

Crea il file `lib/types.ts`:

```bash
cat > lib/types.ts << 'EOF'
export type Role = "P" | "D" | "C" | "A";

export type Formation =
  | "3-5-2" | "3-4-2-1" | "3-4-3" | "4-3-3"
  | "4-2-3-1" | "4-4-2" | "4-3-1-2" | "3-4-1-2";

export interface Coach {
  id: string;
  name: string;
  team: string;
  formation: Formation;
  rotationIndex: number;
}

export interface SeasonStats {
  season: string;
  appearances: number;
  minutes: number;
  goals: number;
  assists: number;
  avgRating: number;
  avgFantaRating: number;
  penaltiesTaken: number;
  yellowCards: number;
  redCards: number;
}

export interface InjuryRecord {
  type: string;
  daysOut: number;
  date: string;
}

export interface Player {
  id: string;
  name: string;
  team: string;
  role: Role;
  age: number;
  preferredFormations: Formation[];
  detailedPosition: string;
  history: SeasonStats[];
  injuries: InjuryRecord[];
  officialPrice: number | null;
  teamReliability: number;
  fixtureDifficultyNext8: number;
  isStarter: boolean;
}

export interface Valuation {
  suggestedPrice: number;
  projectedFantaAvg: number;
  confidence: "alta" | "media" | "bassa";
  breakdown: Record<string, number>;
}

export type Tier = "certezza" | "equilibrio" | "scommessa" | "esotico";

export interface TradeSuggestion {
  player: Player;
  score: number;
  reasons: string[];
  tacticalFit: number;
  fixtureScore: number;
  formTrend: number;
}
EOF
```

---

## STEP 11: Crea il modulo tattica

Crea `lib/tacticalFit.ts`:

```typescript
import type { Coach, Formation, Player } from "./types";

export function tacticalFit(player: Player, coach: Coach): number {
  let score = 50;

  if (player.preferredFormations.includes(coach.formation)) {
    score += 35;
  } else if (sharesShape(player.preferredFormations, coach.formation)) {
    score += 15;
  } else {
    score -= 20;
  }

  score += positionModifier(player.detailedPosition, coach.formation, player.role);

  score -= Math.round(coach.rotationIndex * 15);

  if (player.isStarter) score += 10;

  return clamp(score, 0, 100);
}

function sharesShape(prefs: Formation[], target: Formation): boolean {
  const backline = (f: Formation) => f.split("-")[0];
  return prefs.some((f) => backline(f) === backline(target));
}

function positionModifier(pos: string, formation: Formation, role: Role): number {
  const p = pos.toLowerCase();
  const noWingers = ["3-5-2", "4-3-1-2", "3-4-1-2"].includes(formation);
  const wingBackFriendly = ["3-5-2", "3-4-2-1", "3-4-3", "3-4-1-2"].includes(formation);

  if (noWingers && p.includes("ala")) return -20;
  if (wingBackFriendly && p.includes("esterno")) return 15;
  if (formation === "4-2-3-1" && p.includes("trequartista")) return 15;
  if (noWingers && p.includes("punta") && role === "A") return 10;
  return 0;
}

export const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));
```

---

## STEP 12: Crea il modulo di valutazione

Crea `lib/valuation.ts`:

```typescript
import type { Coach, Player, Valuation } from "./types";
import { tacticalFit, clamp } from "./tacticalFit";

export function evaluatePlayer(player: Player, coach: Coach): Valuation {
  const hist = player.history;
  const last = hist[hist.length - 1];

  // Media pesata: stagione recente conta di più
  const weights = [0.2, 0.3, 0.5];
  const recent = hist.slice(-3);
  const w = weights.slice(-recent.length);
  const wSum = w.reduce((a, b) => a + b, 0);
  const histAvg =
    recent.reduce((acc, s, i) => acc + s.avgFantaRating * w[i], 0) / wSum;

  // Trend forma
  const trend = last ? last.avgFantaRating - histAvg : 0;

  // Tattica
  const fit = tacticalFit(player, coach);

  // Calendario (1 facile - 5 duro)
  const fixtureBonus = (3 - player.fixtureDifficultyNext8) * 0.1;

  // Infortuni
  const daysOut = player.injuries.reduce((a, i) => a + i.daysOut, 0);
  const injuryMalus = clamp(daysOut / 200, 0, 0.6);

  // Rigoristi
  const penaltyBonus = last && last.penaltiesTaken >= 3 ? 0.4 : 0;

  const projectedFantaAvg = clamp(
    histAvg + trend * 0.5 + (fit - 50) / 100 + fixtureBonus - injuryMalus + penaltyBonus,
    4.5,
    9.5
  );

  // Conversione a % budget
  const roleCurve: Record<string, [number, number]> = {
    P: [5.7, 8],
    D: [5.7, 10],
    C: [6.0, 22],
    A: [6.3, 35],
  };
  const [ref, maxPct] = roleCurve[player.role];
  const over = Math.max(0, projectedFantaAvg - ref);
  const suggestedPrice = clamp(
    Math.round(Math.pow(over + 0.3, 2.1) * (maxPct / 4) * (player.teamReliability / 8)),
    1,
    maxPct * 1.4
  );

  const confidence =
    hist.length >= 3 && daysOut < 60 ? "alta" : hist.length >= 2 ? "media" : "bassa";

  return {
    suggestedPrice,
    projectedFantaAvg: Math.round(projectedFantaAvg * 100) / 100,
    confidence,
    breakdown: {
      storico: Math.round(histAvg * 100) / 100,
      trend: Math.round(trend * 100) / 100,
      tattica: fit,
      calendario: fixtureBonus,
      infortuni: -injuryMalus,
      rigori: penaltyBonus,
    },
  };
}
```

---

## STEP 13: Crea il modulo tier scouting

Crea `lib/tiers.ts`:

```typescript
import type { Player, Tier } from "./types";

export function classifyTier(player: Player): Tier {
  const hist = player.history;
  const last = hist[hist.length - 1];
  const seasons = hist.length;
  const daysOut = player.injuries.reduce((a, i) => a + i.daysOut, 0);

  const solid =
    seasons >= 3 &&
    hist.every((s) => s.avgFantaRating >= 6.3 && s.appearances >= 25) &&
    daysOut < 45 &&
    player.isStarter;
  if (solid) return "certezza";

  const balanced =
    seasons >= 2 && last && last.avgFantaRating >= 6.1 && last.appearances >= 22;
  if (balanced) return "equilibrio";

  const exotic =
    seasons <= 1 ||
    (player.age <= 22 && last && last.minutes < 1800 && last.avgFantaRating >= 6.2);
  if (exotic) return "esotico";

  return "scommessa";
}
```

---

## STEP 14: Crea il Trade Advisor

Crea `lib/tradeAdvisor.ts`:

```typescript
import type { Coach, Player, TradeSuggestion } from "./types";
import { tacticalFit } from "./tacticalFit";
import { evaluatePlayer } from "./valuation";

function clampTrend(n: number) {
  return Math.max(-1, Math.min(1, n));
}

export function suggestTrades(
  playerOut: Player,
  pool: Player[],
  coaches: Map<string, Coach>,
  opts: { limit?: number } = {}
): TradeSuggestion[] {
  const { limit = 5 } = opts;

  return pool
    .filter((p) => p.id !== playerOut.id && p.role === playerOut.role)
    .map((p) => {
      const coach = coaches.get(p.team);
      const fit = coach ? tacticalFit(p, coach) : 50;
      const val = coach ? evaluatePlayer(p, coach) : null;
      const outVal = coaches.get(playerOut.team)
        ? evaluatePlayer(playerOut, coaches.get(playerOut.team)!)
        : null;

      const last = p.history[p.history.length - 1];
      const prev = p.history[p.history.length - 2];
      const formTrend =
        last && prev ? clampTrend(last.avgFantaRating - prev.avgFantaRating) : 0;

      const fixtureScore = Math.round((5 - p.fixtureDifficultyNext8) * 25);
      const gain = val && outVal ? val.projectedFantaAvg - outVal.projectedFantaAvg : 0;

      const score =
        fit * 0.35 +
        fixtureScore * 0.25 +
        (formTrend + 1) * 50 * 0.2 +
        p.teamReliability * 10 * 0.1 +
        (gain + 1) * 50 * 0.1;

      const reasons: string[] = [];
      if (fit >= 70) reasons.push(`Perfetto nel ${coach?.formation}`);
      if (fixtureScore >= 60) reasons.push("Calendario favorevole");
      if (formTrend > 0.15) reasons.push("Trend in crescita");

      return {
        player: p,
        score: Math.round(score),
        reasons,
        tacticalFit: fit,
        fixtureScore,
        formTrend,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
```

---

## STEP 15: Crea il modulo Season Projection

Crea `lib/projection.ts`:

```typescript
import type { Coach, Player } from "./types";
import { evaluatePlayer } from "./valuation";

export function projectSeason(
  squad: Player[],
  coaches: Map<string, Coach>,
  remainingMatchdays = 38
): { total: number; perPlayer: { player: Player; expectedPoints: number }[] } {
  const perPlayer = squad.map((p) => {
    const coach = coaches.get(p.team);
    const fantaAvg = coach
      ? evaluatePlayer(p, coach).projectedFantaAvg
      : p.history[p.history.length - 1]?.avgFantaRating ?? 6;
    const availability = p.isStarter ? 0.85 : 0.45;
    return {
      player: p,
      expectedPoints: Math.round(fantaAvg * remainingMatchdays * availability),
    };
  });

  const sorted = [...perPlayer].sort((a, b) => b.expectedPoints - a.expectedPoints);
  const startingXI = sorted.slice(0, 11).reduce((a, x) => a + x.expectedPoints, 0);
  const bench = sorted.slice(11).reduce((a, x) => a + x.expectedPoints * 0.1, 0);
  return { total: Math.round(startingXI + bench), perPlayer: sorted };
}
```

---

## STEP 16: Crea il client Prisma wrapper

Crea `lib/db.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

---

# PARTE 4: BACKEND API

## STEP 17: Crea i mapper (Prisma → Core Types)

Crea `lib/mappers.ts`:

```typescript
import type { Player as CorePlayer, Coach as CoreCoach, Formation } from "./types";

export function toCorePlayer(p: any): CorePlayer {
  return {
    id: p.id,
    name: p.name,
    team: p.team.name,
    role: p.role,
    age: p.age,
    preferredFormations: JSON.parse(p.preferredFormations || "[]") as Formation[],
    detailedPosition: p.detailedPosition,
    history: p.stats?.map((s: any) => ({
      season: s.season,
      appearances: s.appearances,
      minutes: s.minutes,
      goals: s.goals,
      assists: s.assists,
      avgRating: s.avgRating,
      avgFantaRating: s.avgFantaRating,
      penaltiesTaken: s.penaltiesTaken,
      yellowCards: s.yellowCards,
      redCards: s.redCards,
    })) || [],
    injuries: p.injuries?.map((i: any) => ({
      type: i.type,
      daysOut: i.daysOut,
      date: i.date.toISOString(),
    })) || [],
    officialPrice: p.officialPrice,
    teamReliability: p.teamReliability,
    fixtureDifficultyNext8: p.fixtureDifficultyNext8,
    isStarter: p.isStarter,
  };
}

export function toCoreCoach(c: any): CoreCoach {
  return {
    id: c.id,
    name: c.name,
    team: c.team.name,
    formation: c.formation as Formation,
    rotationIndex: c.rotationIndex,
  };
}
```

---

## STEP 18: Crea l'API route per i giocatori

Crea il file `app/api/players/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toCorePlayer } from "@/lib/mappers";

export async function GET() {
  try {
    const players = await db.player.findMany({
      include: { team: true, stats: true, injuries: true },
    });
    return NextResponse.json(players.map(toCorePlayer));
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch players" }, { status: 500 });
  }
}
```

---

## STEP 19: Crea l'API route per coach

Crea `app/api/coaches/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toCoreCoach } from "@/lib/mappers";

export async function GET() {
  try {
    const coaches = await db.coach.findMany({
      include: { team: true },
    });
    return NextResponse.json(coaches.map(toCoreCoach));
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch coaches" }, { status: 500 });
  }
}
```

---

## STEP 20: Crea l'API route per Trade Advisor

Crea `app/api/trade-advisor/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toCoreCoach, toCorePlayer } from "@/lib/mappers";
import { suggestTrades } from "@/lib/tradeAdvisor";

export async function GET(req: NextRequest) {
  const playerId = req.nextUrl.searchParams.get("playerId");
  if (!playerId) {
    return NextResponse.json({ error: "playerId required" }, { status: 400 });
  }

  try {
    const [target, all, coaches] = await Promise.all([
      db.player.findUnique({
        where: { id: playerId },
        include: { team: true, stats: true, injuries: true },
      }),
      db.player.findMany({
        include: { team: true, stats: true, injuries: true },
      }),
      db.coach.findMany({
        include: { team: true },
      }),
    ]);

    if (!target) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const coachMap = new Map(coaches.map((c: any) => [c.team.name, toCoreCoach(c)]));
    const suggestions = suggestTrades(
      toCorePlayer(target),
      all.map(toCorePlayer),
      coachMap,
      { limit: 5 }
    );

    return NextResponse.json({ playerOut: target.name, suggestions });
  } catch (error) {
    return NextResponse.json({ error: "Failed to get suggestions" }, { status: 500 });
  }
}
```

---

## STEP 21: Crea l'API route per Valutazione

Crea `app/api/valuation/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toCoreCoach, toCorePlayer } from "@/lib/mappers";
import { evaluatePlayer, classifyTier } from "@/lib/valuation";

export async function GET(req: NextRequest) {
  const playerId = req.nextUrl.searchParams.get("playerId");
  if (!playerId) {
    return NextResponse.json({ error: "playerId required" }, { status: 400 });
  }

  try {
    const [player, coaches] = await Promise.all([
      db.player.findUnique({
        where: { id: playerId },
        include: { team: true, stats: true, injuries: true },
      }),
      db.coach.findMany({ include: { team: true } }),
    ]);

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const coachMap = new Map(coaches.map((c: any) => [c.team.name, toCoreCoach(c)]));
    const corePlayer = toCorePlayer(player);
    const coach = coachMap.get(corePlayer.team);

    if (!coach) {
      return NextResponse.json({ error: "Coach not found" }, { status: 404 });
    }

    const valuation = evaluatePlayer(corePlayer, coach);
    const tier = classifyTier(corePlayer);

    return NextResponse.json({ player: corePlayer, valuation, tier });
  } catch (error) {
    return NextResponse.json({ error: "Failed to evaluate" }, { status: 500 });
  }
}
```

---

## STEP 22: Crea l'API route per Season Projection

Crea `app/api/projection/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toCoreCoach, toCorePlayer } from "@/lib/mappers";
import { projectSeason } from "@/lib/projection";

export async function POST(req: NextRequest) {
  const { playerIds } = await req.json();

  if (!Array.isArray(playerIds)) {
    return NextResponse.json({ error: "playerIds must be array" }, { status: 400 });
  }

  try {
    const [players, coaches] = await Promise.all([
      db.player.findMany({
        where: { id: { in: playerIds } },
        include: { team: true, stats: true, injuries: true },
      }),
      db.coach.findMany({ include: { team: true } }),
    ]);

    const coachMap = new Map(coaches.map((c: any) => [c.team.name, toCoreCoach(c)]));
    const result = projectSeason(players.map(toCorePlayer), coachMap);

    return NextResponse.json({
      total: result.total,
      perPlayer: result.perPlayer.map((x) => ({
        id: x.player.id,
        name: x.player.name,
        expectedPoints: x.expectedPoints,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to project" }, { status: 500 });
  }
}
```

---

# PARTE 5: FRONTEND PAGINE

## STEP 23: Setup Tailwind CSS

Nel terminale:

```bash
npm install -D @tailwindcss/typography
```

Apri `tailwind.config.ts` e aggiungi tema personalizzato:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        pitch: { 900: '#0B1F16', 800: '#10291D', 700: '#173626' },
        chalk: '#F2F7F1',
        gold: '#E8B84B',
        tier: {
          certezza: '#3FA96C',
          equilibrio: '#E8B84B',
          scommessa: '#E07A3F',
          esotico: '#8E6FD8',
        },
      },
      fontFamily: {
        display: ['Archivo Black', 'system-ui'],
        body: ['Inter', 'system-ui'],
      },
    },
  },
  plugins: [],
}
export default config
```

---

## STEP 24: Crea il layout root

Apri `app/layout.tsx` e sostituisci:

```typescript
import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FantaGM",
  description: "Il General Manager del tuo Fantacalcio",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body className="bg-pitch-900 text-chalk font-body">
        <nav className="sticky top-0 z-50 border-b border-chalk/10 bg-pitch-900/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="font-display text-xl tracking-tight text-gold">
              FANTAGM
            </Link>
            <div className="flex gap-2 text-sm">
              <Link href="/" className="px-3 py-1 hover:bg-chalk/10 rounded">Board</Link>
              <Link href="/trade" className="px-3 py-1 hover:bg-chalk/10 rounded">Trade</Link>
              <Link href="/scouting" className="px-3 py-1 hover:bg-chalk/10 rounded">Scouting</Link>
              <Link href="/squad" className="px-3 py-1 hover:bg-chalk/10 rounded">Rosa</Link>
            </div>
          </div>
        </nav>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
```

---

## STEP 25: Crea il file CSS globale

Apri `app/globals.css` e sostituisci:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;500;600;700&display=swap');

body {
  @apply bg-pitch-900 text-chalk font-body antialiased;
}
```

---

## STEP 26: Crea il componente PlayerCard

Crea `components/PlayerCard.tsx`:

```typescript
'use client';
import { motion } from 'framer-motion';
import type { Player, Valuation, Tier, Coach } from '@/lib/types';

const tierLabel: Record<Tier, string> = {
  certezza: '✅ Certezza',
  equilibrio: '⚖️ Equilibrio',
  scommessa: '🎲 Scommessa',
  esotico: '🌟 Esotico',
};

const tierColor: Record<Tier, string> = {
  certezza: 'bg-tier-certezza',
  equilibrio: 'bg-tier-equilibrio',
  scommessa: 'bg-tier-scommessa',
  esotico: 'bg-tier-esotico',
};

interface PlayerCardProps {
  player: Player;
  valuation: Valuation;
  tier: Tier;
  coach: Coach;
  index?: number;
}

export function PlayerCard({ player, valuation, tier, coach, index = 0 }: PlayerCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      whileHover={{ y: -3 }}
      className="rounded-xl border border-chalk/10 bg-pitch-800 p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold leading-tight">{player.name}</h3>
          <p className="text-sm text-chalk/60">
            {player.role} · {player.team} · {coach.formation}
          </p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold text-pitch-900 ${tierColor[tier]}`}>
          {tierLabel[tier]}
        </span>
      </div>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase text-chalk/50">Prezzo</p>
          <p className="font-display text-3xl text-gold">{valuation.suggestedPrice}%</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase text-chalk/50">FM attesa</p>
          <p className="font-mono text-xl">{valuation.projectedFantaAvg}</p>
        </div>
      </div>
    </motion.div>
  );
}
```

---

## STEP 27: Crea la homepage

Apri `app/page.tsx` e sostituisci:

```typescript
'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PlayerCard } from '@/components/PlayerCard';
import type { Player, Coach, Valuation, Tier } from '@/lib/types';
import { evaluatePlayer, classifyTier } from '@/lib/valuation';
import { toCoreCoach } from '@/lib/mappers';

export default function Home() {
  const [data, setData] = useState<{
    players: Player[];
    coaches: Coach[];
  } | null>(null);
  const [evaluated, setEvaluated] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/players').then((r) => r.json()),
      fetch('/api/coaches').then((r) => r.json()),
    ]).then(([players, coaches]) => {
      setData({ players, coaches });

      const coachMap = new Map(coaches.map((c: Coach) => [c.team, c]));
      const rows = players
        .map((p: Player) => {
          const coach = coachMap.get(p.team);
          if (!coach || p.history.length === 0) return null;
          return {
            player: p,
            valuation: evaluatePlayer(p, coach),
            tier: classifyTier(p),
            coach,
          };
        })
        .filter(Boolean)
        .sort((a: any, b: any) => b.valuation.suggestedPrice - a.valuation.suggestedPrice);

      setEvaluated(rows);
    });
  }, []);

  return (
    <div className="space-y-10">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-chalk/10 bg-pitch-800 p-10"
      >
        <h1 className="font-display text-5xl">Entra all'asta da General Manager</h1>
        <p className="mt-3 text-chalk/70 max-w-xl">
          {evaluated.length} giocatori analizzati. Prezzo consigliato basato su storico, modulo allenatore, calendario e infortuni.
        </p>
      </motion.header>

      <section>
        <h2 className="mb-4 font-display text-lg uppercase tracking-wide text-chalk/70">
          Board d'asta
        </h2>
        {evaluated.length === 0 ? (
          <p className="text-chalk/60">Caricamento...</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {evaluated.map((e, i) => (
              <PlayerCard
                key={e.player.id}
                index={i}
                player={e.player}
                valuation={e.valuation}
                tier={e.tier}
                coach={e.coach}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
```

---

## STEP 28: Crea la pagina Trade Advisor

Crea `app/trade/page.tsx`:

```typescript
'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Player } from '@/lib/types';

export default function TradePage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selected, setSelected] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/players')
      .then((r) => r.json())
      .then(setPlayers)
      .catch(() => {});
  }, []);

  async function run(id: string) {
    setSelected(id);
    setLoading(true);
    setResult(null);
    const res = await fetch(`/api/trade-advisor?playerId=${id}`);
    setResult(await res.json());
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl">Trade Advisor</h1>
        <p className="mt-1 text-chalk/70">Scegli un giocatore per scoprire le alternative migliori.</p>
      </header>

      <select
        value={selected}
        onChange={(e) => run(e.target.value)}
        className="w-full max-w-md rounded-lg border border-chalk/20 bg-pitch-800 px-4 py-3 text-chalk"
      >
        <option value="">Scegli un giocatore...</option>
        {players.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} — {p.role} · {p.team}
          </option>
        ))}
      </select>

      {loading && <p className="text-chalk/60">Analisi in corso...</p>}

      <AnimatePresence>
        {result?.suggestions && (
          <motion.ol initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {result.suggestions.map((s: any, i: number) => (
              <motion.li
                key={s.player.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="rounded-xl border border-chalk/10 bg-pitch-800 p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-gold">#{i + 1}</span>{' '}
                    <span className="font-semibold">{s.player.name}</span>
                    <span className="text-chalk/60"> · {s.player.team}</span>
                  </div>
                  <span className="font-mono text-sm text-chalk/70">score {s.score}</span>
                </div>
                <ul className="mt-2 space-y-1 text-sm text-chalk/70">
                  {s.reasons.map((r: string) => (
                    <li key={r}>→ {r}</li>
                  ))}
                </ul>
              </motion.li>
            ))}
          </motion.ol>
        )}
      </AnimatePresence>
    </div>
  );
}
```

---

## STEP 29: Crea la pagina Scouting

Crea `app/scouting/page.tsx`:

```typescript
'use client';
import { useEffect, useState } from 'react';
import { PlayerCard } from '@/components/PlayerCard';
import type { Player, Coach, Tier } from '@/lib/types';
import { evaluatePlayer, classifyTier } from '@/lib/valuation';

const order: Tier[] = ['certezza', 'equilibrio', 'scommessa', 'esotico'];
const titles: Record<Tier, string> = {
  certezza: '🟢 Certezze',
  equilibrio: '🟡 Equilibrio',
  scommessa: '🟠 Scommesse',
  esotico: '🟣 Nomi esotici',
};

export default function ScoutingPage() {
  const [groups, setGroups] = useState<Record<Tier, any[]>>({
    certezza: [],
    equilibrio: [],
    scommessa: [],
    esotico: [],
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/players').then((r) => r.json()),
      fetch('/api/coaches').then((r) => r.json()),
    ]).then(([players, coaches]) => {
      const coachMap = new Map(coaches.map((c: Coach) => [c.team, c]));
      const g: Record<Tier, any[]> = {
        certezza: [],
        equilibrio: [],
        scommessa: [],
        esotico: [],
      };

      for (const p of players as Player[]) {
        const coach = coachMap.get(p.team);
        if (!coach || p.history.length === 0) continue;
        const tier = classifyTier(p);
        g[tier].push({
          player: p,
          valuation: evaluatePlayer(p, coach),
          tier,
          coach,
        });
      }

      setGroups(g);
    });
  }, []);

  return (
    <div className="space-y-10">
      <h1 className="font-display text-3xl">Scouting Database</h1>
      {order.map((tier) =>
        groups[tier].length ? (
          <section key={tier}>
            <h2 className="mb-3 font-display text-lg">{titles[tier]}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groups[tier].map((e, i) => (
                <PlayerCard
                  key={e.player.id}
                  index={i}
                  player={e.player}
                  valuation={e.valuation}
                  tier={e.tier}
                  coach={e.coach}
                />
              ))}
            </div>
          </section>
        ) : null
      )}
    </div>
  );
}
```

---

## STEP 30: Crea la pagina La mia rosa

Crea `app/squad/page.tsx`:

```typescript
'use client';
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Player } from '@/lib/types';

export default function SquadPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [squad, setSquad] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [projection, setProjection] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/players')
      .then((r) => r.json())
      .then(setPlayers)
      .catch(() => {});
  }, []);

  const filtered = useMemo(
    () => players.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())),
    [players, query]
  );

  function toggle(id: string) {
    setSquad((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setProjection(null);
  }

  async function project() {
    setLoading(true);
    const res = await fetch('/api/projection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerIds: [...squad] }),
    });
    setProjection(await res.json());
    setLoading(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca giocatore..."
          className="mb-4 w-full rounded-lg border border-chalk/20 bg-pitch-800 px-4 py-2.5"
        />
        {['P', 'D', 'C', 'A'].map((role) => {
          const group = filtered.filter((p) => p.role === role);
          if (!group.length) return null;
          return (
            <section key={role} className="mb-6">
              <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-chalk/50">
                {role === 'P' ? 'Portieri' : role === 'D' ? 'Difensori' : role === 'C' ? 'Centrocampisti' : 'Attaccanti'}
              </h2>
              <div className="flex flex-wrap gap-2">
                {group.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => toggle(p.id)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${
                      squad.has(p.id)
                        ? 'border-gold bg-gold text-pitch-900 font-semibold'
                        : 'border-chalk/20 bg-pitch-800 text-chalk/80 hover:border-chalk/40'
                    }`}
                  >
                    {p.name} <span className="opacity-60">· {p.team}</span>
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <aside className="h-fit rounded-xl border border-chalk/10 bg-pitch-800 p-5 lg:sticky lg:top-20">
        <p className="font-mono text-xs uppercase text-chalk/50">Rosa</p>
        <p className="font-display text-4xl text-gold">{squad.size}</p>
        <button
          onClick={project}
          disabled={squad.size === 0 || loading}
          className="mt-4 w-full rounded-lg bg-gold px-4 py-2.5 font-semibold text-pitch-900 transition hover:brightness-110 disabled:opacity-40"
        >
          {loading ? 'Calcolo...' : 'Season Projection'}
        </button>
        <AnimatePresence>
          {projection?.total && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5">
              <p className="font-mono text-xs uppercase text-chalk/50">Punti attesi</p>
              <p className="font-display text-5xl">{projection.total}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </aside>
    </div>
  );
}
```

---

# PARTE 6: SEED E TESTING

## STEP 31: Crea il seed dei dati

Crea `prisma/seed.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const teams = [
  { name: "Inter", shortName: "INT", reliability: 9 },
  { name: "Juventus", shortName: "JUV", reliability: 8 },
  { name: "Milan", shortName: "MIL", reliability: 8 },
  { name: "Napoli", shortName: "NAP", reliability: 9 },
  { name: "Fiorentina", shortName: "FIO", reliability: 7 },
  { name: "Lazio", shortName: "LAZ", reliability: 7 },
];

const coaches = [
  { name: "Cristian Chivu", team: "Inter", formation: "3-5-2", rotationIndex: 0.35 },
  { name: "Luciano Spalletti", team: "Juventus", formation: "4-3-3", rotationIndex: 0.3 },
  { name: "Massimiliano Allegri", team: "Milan", formation: "3-5-2", rotationIndex: 0.3 },
  { name: "Antonio Conte", team: "Napoli", formation: "4-3-3", rotationIndex: 0.25 },
  { name: "Paolo Vanoli", team: "Fiorentina", formation: "3-5-2", rotationIndex: 0.4 },
  { name: "Maurizio Sarri", team: "Lazio", formation: "4-3-3", rotationIndex: 0.3 },
];

const players = [
  {
    name: "Lautaro Martinez",
    team: "Inter",
    role: "A",
    age: 28,
    prefs: ["3-5-2", "3-4-1-2"],
    pos: "punta",
    starter: true,
  },
  {
    name: "Albert Gudmundsson",
    team: "Fiorentina",
    role: "A",
    age: 29,
    prefs: ["4-2-3-1", "4-3-3"],
    pos: "trequartista",
    starter: true,
  },
  {
    name: "Mattia Zaccagni",
    team: "Lazio",
    role: "A",
    age: 31,
    prefs: ["4-3-3", "3-4-2-1"],
    pos: "ala",
    starter: true,
  },
];

async function main() {
  // Squadre
  for (const t of teams) {
    await db.team.upsert({
      where: { name: t.name },
      update: {},
      create: { name: t.name, shortName: t.shortName, reliability: t.reliability },
    });
  }

  // Allenatori
  for (const c of coaches) {
    const team = await db.team.findUnique({ where: { name: c.team } });
    if (team) {
      await db.coach.upsert({
        where: { teamId: team.id },
        update: { name: c.name, formation: c.formation, rotationIndex: c.rotationIndex },
        create: {
          name: c.name,
          formation: c.formation,
          rotationIndex: c.rotationIndex,
          teamId: team.id,
        },
      });
    }
  }

  // Giocatori
  for (const p of players) {
    const team = await db.team.findUnique({ where: { name: p.team } });
    if (team) {
      const player = await db.player.create({
        data: {
          name: p.name,
          role: p.role,
          age: p.age,
          preferredFormations: JSON.stringify(p.prefs),
          detailedPosition: p.pos,
          teamId: team.id,
          teamReliability: team.reliability,
          isStarter: p.starter,
        },
      });

      // Aggiungi statistiche di esempio
      await db.seasonStats.create({
        data: {
          season: "2024-25",
          appearances: 30,
          minutes: 2400,
          goals: 12,
          assists: 5,
          avgRating: 6.8,
          avgFantaRating: 7.8,
          penaltiesTaken: 3,
          yellowCards: 3,
          redCards: 0,
          playerId: player.id,
        },
      });
    }
  }

  console.log("✅ Seed completato!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
```

---

## STEP 32: Esegui il seed

Nel terminale:

```bash
npx prisma db seed
```

Se ricevi un errore di "seed script not found", aggiungi questa linea in `package.json` nella sezione `prisma`:

```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

Poi riprova: `npx prisma db seed`

---

# PARTE 7: TEST E DEPLOY

## STEP 33: Test locale

Assicurati che il dev server sia acceso:

```bash
npm run dev
```

Apri il browser su `http://localhost:3000` e testa:
- ✅ Homepage carica il board d'asta
- ✅ Pagina Trade Advisor funziona
- ✅ Pagina Scouting mostra i giocatori divisi per tier
- ✅ Pagina Rosa permette di selezionare giocatori e calcolare season projection

---

## STEP 34: Controlla il database

Per ispezionare il database:

```bash
npx prisma studio
```

Si apre un'interfaccia web dove puoi vedere e modificare i dati.

---

## STEP 35: Build di produzione

Testa il build:

```bash
npm run build
```

Se passa senza errori, sei a buon punto!

---

## STEP 36: Deploy su Vercel

1. Crea un account su **vercel.com**
2. Collega il tuo repository GitHub
3. Vercel deployerà automaticamente
4. Configura la variabile `DATABASE_URL` in Vercel (Settings → Environment Variables)

Usa un database PostgreSQL gratuito (es. Render.com o Supabase).

---

# CHECKLIST FINALE

- ✅ Node.js installato
- ✅ Progetto Next.js creato
- ✅ Prisma configurato con SQLite
- ✅ Schema database creato
- ✅ Database pushato e seeded
- ✅ Core TypeScript scritto (valutazione, tattica, trade, tier, projection)
- ✅ API routes create (players, coaches, trade-advisor, valuation, projection)
- ✅ Frontend pagine create (home, trade, scouting, squad)
- ✅ Test locale funzionante
- ✅ Build senza errori

**CONGRATULAZIONI! 🎉 FantaGM è live!**

---

# PROSSIMI STEP OPZIONALI

- Aggiungere asta simulata con bot
- Importare listone ufficiale da Excel
- Sync dati reali da Football-Data.org
- Deploy mobile React Native
- Autenticazione utenti
- Moltiplicare il database per utenti diversi

Buon lavoro! 💪

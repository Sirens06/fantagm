-- CreateEnum
CREATE TYPE "Role" AS ENUM ('P', 'D', 'C', 'A');

-- CreateEnum
CREATE TYPE "PlayerStatus" AS ENUM ('TITOLARE', 'BALLOTTAGGIO', 'RISERVA', 'FUORI_ROSA');

-- CreateEnum
CREATE TYPE "Competition" AS ENUM ('SERIE_A', 'SERIE_B', 'PREMIER_LEAGUE', 'LA_LIGA', 'BUNDESLIGA', 'LIGUE_1', 'EREDIVISIE', 'PRIMEIRA_LIGA', 'ALTRO');

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "externalId" TEXT,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "role" "Role" NOT NULL,
    "detailedPosition" TEXT NOT NULL,
    "prFormation" TEXT[],
    "status" "PlayerStatus" NOT NULL DEFAULT 'RISERVA',
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "suspensionMatches" INTEGER NOT NULL DEFAULT 0,
    "isPenaltyTaker" BOOLEAN NOT NULL DEFAULT false,
    "officialPrice" INTEGER,
    "teamId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "externalId" TEXT,
    "reliability" INTEGER NOT NULL,
    "fixtureDiffNext8" DOUBLE PRECISION NOT NULL DEFAULT 3,
    "attackStrength" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "defenseStrength" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "isPromoted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coach" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "formation" TEXT NOT NULL,
    "alternativeFormations" TEXT[],
    "rotationIndex" DOUBLE PRECISION NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "sinceDate" TIMESTAMP(3),
    "teamId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coach_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonStats" (
    "id" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "competition" "Competition" NOT NULL DEFAULT 'SERIE_A',
    "appareances" INTEGER NOT NULL,
    "startingAppearances" INTEGER NOT NULL DEFAULT 0,
    "minutes" INTEGER NOT NULL,
    "goals" INTEGER NOT NULL,
    "assists" INTEGER NOT NULL,
    "yCards" INTEGER NOT NULL,
    "rCard" INTEGER NOT NULL,
    "penaltiesTaken" INTEGER NOT NULL,
    "penaltiesScored" INTEGER NOT NULL,
    "cleanSheets" INTEGER NOT NULL DEFAULT 0,
    "goalsConceded" INTEGER NOT NULL DEFAULT 0,
    "penaltiesSaved" INTEGER NOT NULL DEFAULT 0,
    "avgRating" DOUBLE PRECISION NOT NULL,
    "avRatingFanta" DOUBLE PRECISION NOT NULL,
    "playerId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeasonStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Injury" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "daysOut" INTEGER NOT NULL,
    "matchesMissed" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "expectedReturn" TIMESTAMP(3),
    "playerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Injury_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fixture" (
    "id" TEXT NOT NULL,
    "matchday" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,
    "homeGoals" INTEGER,
    "awayGoals" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fixture_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_externalId_key" ON "Player"("externalId");

-- CreateIndex
CREATE INDEX "Player_teamId_idx" ON "Player"("teamId");

-- CreateIndex
CREATE INDEX "Player_role_idx" ON "Player"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Player_name_teamId_key" ON "Player"("name", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Team_externalId_key" ON "Team"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Coach_teamId_key" ON "Coach"("teamId");

-- CreateIndex
CREATE INDEX "SeasonStats_teamId_idx" ON "SeasonStats"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "SeasonStats_playerId_season_teamId_key" ON "SeasonStats"("playerId", "season", "teamId");

-- CreateIndex
CREATE INDEX "Injury_playerId_idx" ON "Injury"("playerId");

-- CreateIndex
CREATE INDEX "Fixture_homeTeamId_idx" ON "Fixture"("homeTeamId");

-- CreateIndex
CREATE INDEX "Fixture_awayTeamId_idx" ON "Fixture"("awayTeamId");

-- CreateIndex
CREATE UNIQUE INDEX "Fixture_matchday_homeTeamId_key" ON "Fixture"("matchday", "homeTeamId");

-- CreateIndex
CREATE UNIQUE INDEX "Fixture_matchday_awayTeamId_key" ON "Fixture"("matchday", "awayTeamId");

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coach" ADD CONSTRAINT "Coach_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonStats" ADD CONSTRAINT "SeasonStats_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonStats" ADD CONSTRAINT "SeasonStats_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Injury" ADD CONSTRAINT "Injury_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fixture" ADD CONSTRAINT "Fixture_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fixture" ADD CONSTRAINT "Fixture_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

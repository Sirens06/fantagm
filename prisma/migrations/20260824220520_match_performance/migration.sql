-- CreateTable
CREATE TABLE "MatchPerformance" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "matchday" INTEGER NOT NULL,
    "played" BOOLEAN NOT NULL DEFAULT true,
    "minutes" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION,
    "fantaRating" DOUBLE PRECISION,
    "goals" INTEGER NOT NULL DEFAULT 0,
    "assists" INTEGER NOT NULL DEFAULT 0,
    "yCard" BOOLEAN NOT NULL DEFAULT false,
    "rCard" BOOLEAN NOT NULL DEFAULT false,
    "penaltyScored" INTEGER NOT NULL DEFAULT 0,
    "penaltyMissed" INTEGER NOT NULL DEFAULT 0,
    "penaltySaved" INTEGER NOT NULL DEFAULT 0,
    "goalsConceded" INTEGER NOT NULL DEFAULT 0,
    "cleanSheet" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MatchPerformance_playerId_season_matchday_idx" ON "MatchPerformance"("playerId", "season", "matchday");

-- CreateIndex
CREATE UNIQUE INDEX "MatchPerformance_playerId_season_matchday_key" ON "MatchPerformance"("playerId", "season", "matchday");

-- AddForeignKey
ALTER TABLE "MatchPerformance" ADD CONSTRAINT "MatchPerformance_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

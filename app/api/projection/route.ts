import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toCoreCoach, toCorePlayer, playerInclude } from "@/lib/mappers";
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
        include: playerInclude,
      }),
      db.coach.findMany({ where: { isCurrent: true }, include: { team: true } }),
    ]);

    const corePlayers = players.map(toCorePlayer);
    const coachMap = new Map(coaches.map(toCoreCoach).map((c) => [c.team.name, c]));

    const result = projectSeason(corePlayers, coachMap);

    return NextResponse.json({
      total: result.total,
      perPlayer: result.perPlayer.map((x) => ({
        id: x.player.id,
        name: x.player.name,
        expectedPoints: x.expectedPoints,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Failed to project" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toCoreCoach, toCorePlayer, playerInclude } from "@/lib/mappers";
import { suggestTrades } from "@/lib/tradeAdvisor";


export async function GET(req: NextRequest) { // we need req param when we have to read data from the request itself, like the playerId in the query string (?playerId=...)
    const playerId = req.nextUrl.searchParams.get("playerId");
    if (!playerId) {
        return NextResponse.json({ "error": "playerId required" }, { status: 400 });
    }

    try {
        const [targetPlayer, pool, coach] = await Promise.all([
            db.player.findUnique({
                where: { id: playerId },
                include: playerInclude
            }),
            db.player.findMany({
                include: playerInclude,
            }),
            db.coach.findMany({
                where: { isCurrent: true },
                include: { team: true }
            })

        ])

        if(!targetPlayer){
            return NextResponse.json({ "error": "Player not found" }, { status: 404 });
        }

        const coreCoach = coach.map((c) => toCoreCoach(c));
        const coachMap = new Map(coreCoach.map((c)=> [c.team.name, c])); // Create a Map of coaches keyed by team name for easy lookup

        const trades = suggestTrades(toCorePlayer(targetPlayer), pool.map((p) => toCorePlayer(p)), coachMap, {limit: 5})
        return NextResponse.json({playerOut: targetPlayer.name, suggestions: trades}, {status: 200})
    } catch {
        return NextResponse.json({ error: "Failed to suggest trades" }, { status: 500 });
    }
}
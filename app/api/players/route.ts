import {NextResponse} from "next/server";
import {db} from "@/lib/db";
import {toCorePlayer, playerInclude} from "@/lib/mappers";

import { rotta } from "@/lib/api";
async function getHandler(){
    try {
        const players = await db.player.findMany({
            include: playerInclude, // team + stats + injuries in un colpo solo, gia' ordinati per stagione
        })

        const corePlayer = players.map((player) => toCorePlayer(player)); // This line maps over the array of player records retrieved from the database and applies the `toCorePlayer` function to each player. This function likely transforms the raw database records into a more structured or simplified format suitable for the API response.
        return NextResponse.json(corePlayer); // This line creates a JSON response containing the transformed player data. The `NextResponse.json` method is used to send a JSON response back to the client, which is a common practice in API development.
    } catch {
        return NextResponse.json({"error": "Failed to load players"}, {status: 500});
    }
}

export const GET = rotta(getHandler);

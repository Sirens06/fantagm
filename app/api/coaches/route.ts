import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toCoreCoach } from "@/lib/mappers";

export async function GET() {
  try {
    const coaches = await db.coach.findMany({
      where: { isCurrent: true },
      include: { team: true },
    });

    const coreCoaches = coaches.map(toCoreCoach);
    return NextResponse.json(coreCoaches);
  } catch {
    return NextResponse.json({ error: "Failed to load coaches" }, { status: 500 });
  }
}

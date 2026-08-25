import type { Injury, Player } from "./types";

export function ageOf(birthDate: Date, at: Date = new Date()): number {
  let age = at.getFullYear() - birthDate.getFullYear();
  const monthDelta = at.getMonth() - birthDate.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && at.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// Quota di giornate in cui ti aspetti di poterlo schierare.
export function availabilityFactor(player: Player): number {
  const byStatus: Record<Player["status"], number> = {
    TITOLARE: 0.85,
    BALLOTTAGGIO: 0.6,
    RISERVA: 0.35,
    FUORI_ROSA: 0.05,
  };

  const base = byStatus[player.status];
  if (!player.isSuspended) return base;

  // Una squalifica toglie giornate certe: la scalo su un girone di ritorno.
  return Math.max(0, base * (1 - Math.min(player.suspensionMatches, 19) / 19));
}

// Gli infortuni contano solo se recenti: un problema di quattro anni fa
// non dice piu' niente sulla tenuta di oggi.
export function recentInjuries(player: Player, seasons: number = 2): Injury[] {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - seasons);
  return player.injuries.filter((injury) => new Date(injury.date) >= cutoff);
}

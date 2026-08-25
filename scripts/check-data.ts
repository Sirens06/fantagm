import "dotenv/config";
import { db } from "@/lib/db";
import { toCorePlayer, toCoreCoach, playerInclude } from "@/lib/mappers";
import { evaluatePlayer } from "@/lib/valuation";
import { classifyTier } from "@/lib/tiers";
import { prezzoConsigliato, scarto, fasciaDa, BUDGET_LISTINO } from "@/lib/pricing";
import { formaRecente } from "@/lib/form";
import { projectSeason } from "@/lib/projection";
import { suggestTrades } from "@/lib/tradeAdvisor";

// Controllo di sanita' sui dati caricati. Da rilanciare dopo ogni seed o
// import: fa girare l'intera pipeline e stampa cosa ne esce.

async function main() {
  const [players, coaches, teams] = await Promise.all([
    db.player.findMany({ include: playerInclude }),
    db.coach.findMany({ where: { isCurrent: true }, include: { team: true } }),
    db.team.findMany({ orderBy: { fixtureDiffNext8: "asc" } }),
  ]);

  const core = players.map(toCorePlayer);
  const coachMap = new Map(coaches.map(toCoreCoach).map((c) => [c.team.name, c]));

  console.log(`squadre ${teams.length} | allenatori ${coachMap.size} | giocatori ${core.length}`);

  const problems: string[] = [];

  // --- Integrita' ----------------------------------------------------------
  const senzaStats = core.filter((p) => p.stats.length === 0);
  if (senzaStats.length) problems.push(`${senzaStats.length} giocatori senza statistiche`);

  const senzaCoach = core.filter((p) => !coachMap.has(p.team.name));
  if (senzaCoach.length) problems.push(`${senzaCoach.length} giocatori la cui squadra non ha allenatore`);

  const ruoliStrani = core.filter((p) => !["P", "D", "C", "A"].includes(p.role));
  if (ruoliStrani.length) problems.push(`${ruoliStrani.length} giocatori con ruolo fuori da P/D/C/A`);

  const fuoriOrdine = core.filter((p) =>
    p.stats.some((s, i) => i > 0 && s.season < p.stats[i - 1].season)
  );
  if (fuoriOrdine.length) problems.push(`${fuoriOrdine.length} giocatori con stagioni fuori ordine`);

  const quotazioniStrane = core.filter((p) => p.officialPrice !== undefined && p.officialPrice <= 0);
  if (quotazioniStrane.length) problems.push(`${quotazioniStrane.length} quotazioni <= 0`);

  // --- Distribuzioni -------------------------------------------------------
  const perRuolo: Record<string, number> = {};
  for (const p of core) perRuolo[p.role] = (perRuolo[p.role] ?? 0) + 1;
  console.log("per ruolo:", perRuolo);

  const tiers: Record<string, number> = {};
  for (const p of core) {
    const t = classifyTier(p);
    tiers[t] = (tiers[t] ?? 0) + 1;
  }
  console.log("per tier: ", tiers);

  // --- Valutazioni ---------------------------------------------------------
  // Gli stessi numeri che vede la sala d'asta: crediti su 500, da pricing.ts.
  const valued = core
    .map((p) => {
      const coach = coachMap.get(p.team.name);
      const prezzo = prezzoConsigliato(p, coach, BUDGET_LISTINO);
      return {
        name: p.name,
        role: p.role,
        team: p.team.name,
        prezzo,
        quotazione: p.officialPrice ?? null,
        scarto: scarto(p, coach, BUDGET_LISTINO),
        fascia: fasciaDa(prezzo, BUDGET_LISTINO),
        forma: formaRecente(p),
        fm: coach ? evaluatePlayer(p, coach).projectedFantaAvg : null,
      };
    })
    .sort((a, b) => b.prezzo - a.prezzo);

  const riga = (v: (typeof valued)[number]) =>
    `  ${String(v.prezzo).padStart(3)} cr  (quot ${String(v.quotazione ?? "-").padStart(3)}, scarto ${v.scarto >= 0 ? "+" : ""}${v.scarto})  ${v.role}  ${v.name.padEnd(22)} ${v.fascia}  trend ${v.forma.trend >= 0 ? "+" : ""}${v.forma.trend}`;

  console.log("\ntop 8 per prezzo consigliato");
  for (const v of valued.slice(0, 8)) console.log(riga(v));

  console.log("\nultimi 3");
  for (const v of valued.slice(-3)) console.log(riga(v));

  const fonti: Record<string, number> = {};
  for (const v of valued) fonti[v.forma.fonte] = (fonti[v.forma.fonte] ?? 0) + 1;
  console.log("\nfonte della forma:", fonti);

  // --- Calendario ----------------------------------------------------------
  if (teams.length) {
    console.log(
      `\ncalendario  piu' facile: ${teams[0].name} (${teams[0].fixtureDiffNext8})  |  piu' duro: ${teams.at(-1)!.name} (${teams.at(-1)!.fixtureDiffNext8})`
    );
  }

  // --- Trade advisor e proiezione -----------------------------------------
  const target = core.find((p) => p.role === "A" && coachMap.has(p.team.name));
  if (target) {
    const trades = suggestTrades(target, core, coachMap, { limit: 3 });
    console.log(`\nalternative a ${target.name} (${target.team.name})`);
    for (const t of trades) {
      console.log(`  ${String(t.score).padStart(3)}  ${t.player.name} (${t.player.team.name})  ${t.reasons.join(", ")}`);
    }
  }

  const proj = projectSeason(core.slice(0, 25), coachMap);
  console.log(`\nproiezione su 25 giocatori: ${proj.total} punti attesi`);

  // --- Esito ---------------------------------------------------------------
  if (problems.length) {
    console.log("\nPROBLEMI:");
    for (const p of problems) console.log(`  - ${p}`);
    process.exitCode = 1;
  } else {
    console.log("\nNessun problema rilevato.");
  }

  await db.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});

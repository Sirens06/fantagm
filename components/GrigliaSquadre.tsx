import type { Role, SquadraDTO } from "@/lib/types";
import { ContatoreSlot } from "./ContatoreSlot";

/**
 * Tutte le squadre con quanto gli resta e cosa gli manca.
 *
 * Non e' contabilita': e' l'informazione con cui decidi se tirare. Se chi ti
 * sta contro ha dodici crediti non ti puo' seguire, e se ha ancora sei slot di
 * difesa vuoti non spendera' quaranta su un attaccante.
 */
export function GrigliaSquadre({
  squadre,
  slotMax,
  mioId,
  leaderId,
}: {
  squadre: SquadraDTO[];
  slotMax: Record<Role, number>;
  mioId: string;
  leaderId?: string | null;
}) {
  // Per residuo, non per nome: la domanda e' sempre "chi puo' ancora farmi
  // male". Copia per lo stesso motivo della cronologia — sort() riordina
  // sul posto, e questo array e' dentro lo stato della pagina.
  const ordinate = [...squadre].sort((a, b) => b.budget - a.budget);

  return (
    <ul className="divide-y divide-riga rounded-lg border border-riga bg-superficie px-3">
      {ordinate.map((s) => (
        <li key={s.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
          <span className="flex min-w-0 items-baseline gap-2">
            <span className={`truncate ${s.id === mioId ? "text-gesso" : "text-nebbia"}`}>
              {s.nome}
            </span>
            {s.id === leaderId && (
              <span className="shrink-0 text-[11px] uppercase tracking-widest text-gesso">
                in testa
              </span>
            )}
          </span>
          <span className="flex shrink-0 items-center gap-3">
            <span className="tabular-nums">
              {s.budget}
              <span className="ml-1 text-[11px] text-nebbia">cr</span>
            </span>
            <ContatoreSlot presi={s.slot} max={slotMax} />
          </span>
        </li>
      ))}
    </ul>
  );
}

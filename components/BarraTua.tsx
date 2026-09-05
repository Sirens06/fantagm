import type { Role, SquadraDTO } from "@/lib/types";
import { ContatoreSlot } from "./ContatoreSlot";

/**
 * Budget residuo e slot: il dato che guardi prima di ogni rilancio.
 *
 * Per questo e' incollata in fondo allo schermo e non scorre via col resto:
 * quando stai per battere "48" devi vedere se puoi permettertelo senza
 * risalire la pagina. Lo sfondo e' opaco apposta — la cronologia le scorre
 * sotto, e due testi sovrapposti non si leggono.
 *
 * squadra.budget e' gia' il residuo, non l'iniziale: il server lo scala
 * all'aggiudicazione (vedi il commento su Squadra in schema.prisma).
 */
export function BarraTua({
  squadra,
  slotMax,
}: {
  squadra: SquadraDTO;
  slotMax: Record<Role, number>;
}) {
  return (
    <div className="sticky bottom-0 -mx-3 flex items-center justify-between gap-3 border-t border-riga bg-superficie px-4 py-3">
      <span className="flex min-w-0 items-baseline gap-2">
        <span className="truncate text-xs uppercase tracking-widest text-nebbia">
          {squadra.nome}
        </span>
        <strong className="font-display text-2xl leading-none tabular-nums">
          {squadra.budget}
        </strong>
        <span className="text-xs text-nebbia">cr</span>
      </span>
      <ContatoreSlot presi={squadra.slot} max={slotMax} />
    </div>
  );
}

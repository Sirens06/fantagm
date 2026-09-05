import type { Role } from "@/lib/types";

const ordine: Role[] = ["P", "D", "C", "A"];

export function ContatoreSlot({
  presi,
  max,
}: {
  presi: Record<Role, number>;
  max: Record<Role, number>;
}) {
  return (
    <span className="flex gap-2 text-xs tabular-nums">
      {ordine.map((ruolo) => {
        // Il ruolo completo si spegne: a colpo d'occhio devi vedere solo
        // quello che ti manca ancora da comprare.
        const pieno = presi[ruolo] >= max[ruolo];
        return (
          <span key={ruolo} className={pieno ? "text-nebbia/50" : "text-gesso"}>
            <span className="text-nebbia">{ruolo}</span> {presi[ruolo]}/{max[ruolo]}
          </span>
        );
      })}
    </span>
  );
}

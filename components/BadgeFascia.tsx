import type { Tier } from "@/lib/types";

// Certezza e sconsigliato riusano i due colori del verdetto sul prezzo
// (affare / troppo): dicono la stessa cosa, quindi hanno lo stesso colore.
const tiers: Record<Tier, { etichetta: string; colore: string }> = {
  certezza: { etichetta: "Certezza", colore: "text-affare border-affare/40 bg-affare/10" },
  equilibrio: { etichetta: "Equilibrio", colore: "text-equilibrio border-equilibrio/40 bg-equilibrio/10" },
  scommessa: { etichetta: "Scommessa", colore: "text-scommessa border-scommessa/40 bg-scommessa/10" },
  esotico: { etichetta: "Esotico", colore: "text-esotico border-esotico/40 bg-esotico/10" },
  sconsigliato: { etichetta: "Sconsigliato", colore: "text-troppo border-troppo/40 bg-troppo/10" },
};

export function BadgeFascia({ tier }: { tier: Tier }) {
  const f = tiers[tier];
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-wide ${f.colore}`}
    >
      {f.etichetta}
    </span>
  );
}

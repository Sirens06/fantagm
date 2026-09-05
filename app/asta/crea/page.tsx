"use client";

import type { Role } from "@/lib/types";
import { useState } from "react";
import { useRouter } from "next/navigation";

const RUOLI: Role[] = ["P", "D", "C", "A"];
const RUOLI_NOMI: Record<Role, string> = {
  P: "Portiere",
  D: "Difensore",
  C: "Centrocampista",
  A: "Attaccante",
};

type Creata = {
  codice: string;
  nome: string;
  budget: number;
  slotMax: Record<Role, number>;
  maxSquadre: number;
  adminToken: string;
};

export default function CreaAsta() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [budget, setBudget] = useState("1000");
  const [slot, setSlot] = useState<Record<Role, string>>({
    P: "3",
    D: "8",
    C: "8",
    A: "6",
  });
  const [squadreMax, setSquadreMax] = useState("8");
  const [isCreating, setIsCreating] = useState(false);
  const [creata, setCreata] = useState<Creata | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totPlayers = RUOLI.reduce((tot, role) => {
    return tot + (parseInt(slot[role], 10) || 0);
  }, 0);

  const troppiSlot = totPlayers > (parseInt(budget, 10) || 0);

  async function crea() {
    setError(null);
    setIsCreating(true);
    try {
      const response = await fetch("/api/asta/crea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome.trim() || "Asta",
          budget: parseInt(budget, 10) || 1000,
          slotP: slot.P ? parseInt(slot.P, 10) : 0,
          slotD: slot.D ? parseInt(slot.D, 10) : 0,
          slotC: slot.C ? parseInt(slot.C, 10) : 0,
          slotA: slot.A ? parseInt(slot.A, 10) : 0,
          maxSquadre: parseInt(squadreMax, 10) || 8,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data?.messaggio || "Errore durante la creazione dell'asta",
        );
      }
      localStorage.setItem(
        `fantagm:${data.codice}:adminToken`,
        data.adminToken,
      );
      setCreata(data);
    } catch (error) {
      console.error("Errore durante la creazione dell'asta", error);
      // In TypeScript quello che prendi nel catch ha tipo "unknown": in
      // JavaScript si puo' lanciare qualsiasi cosa, non solo un Error. Va
      // controllato prima di leggerne il messaggio.
      setError(
        error instanceof Error
          ? error.message
          : "Errore durante la creazione dell'asta",
      );
    } finally {
      setIsCreating(false);
    }
  }
  if (creata) {
    return (
      <div>
        <span>{creata.codice}</span>
        <span>{creata.adminToken}</span>
        <button onClick={() => router.push(`/asta/${creata.codice}`)}>
          Vai all&apos;asta
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        crea();
      }}
    >
      <div>
        <label htmlFor="nome">Nome</label>
        <input
          type="text"
          id="nome"
          maxLength={60}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="budget">Budget</label>
        <input
          type="text"
          inputMode="numeric"
          id="budget"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="squadreMax">Squadre</label>
        <input
          type="text"
          inputMode="numeric"
          id="squadreMax"
          value={squadreMax}
          onChange={(e) => setSquadreMax(e.target.value)}
        />
      </div>
      {RUOLI.map((r) => (
        <div key={r}>
          <label htmlFor={`slot-${r}`} title={RUOLI_NOMI[r]}>
            {r}
          </label>
          <input
            type="text"
            inputMode="numeric"
            id={`slot-${r}`}
            value={slot[r]}
            onChange={(e) => setSlot({ ...slot, [r]: e.target.value })}
          />
        </div>
      ))}
      {/* Lo stesso conto lo rifa' il server e rifiuta la stanza. Dirlo qui,
          coi due numeri, evita di scoprirlo dopo aver premuto. */}
      {troppiSlot && (
        <div>
          Con {budget} crediti non riempi {totPlayers} slot: serve almeno un
          credito a giocatore.
        </div>
      )}
      <button type="submit" disabled={isCreating || troppiSlot}>
        {isCreating ? "Creazione in corso..." : "Crea"}
      </button>
      {error && <div>{error}</div>}
    </form>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Player, Coach, Tier, Valuation } from "@/lib/types";
import { evaluatePlayer } from "@/lib/valuation";
import { classifyTier } from "@/lib/tiers";
import { PlayerCard } from "@/components/PlayerCard";

import { leggiJson } from "@/lib/http";
const tierList: {name: Tier, color: string}[] = [
  { name: "certezza", color: "bg-green-500" },
  { name: "equilibrio", color: "bg-blue-500" },
  { name: "scommessa", color: "bg-yellow-500" },
  { name: "esotico", color: "bg-red-500" },
  { name: "sconsigliato", color: "bg-red-500" },
];

const tierTitle: Record<Tier, string> = {
  certezza: "Certezza",
  equilibrio: "Equilibrio",
  scommessa: "Scommessa",
  esotico: "Esotico",
  sconsigliato: "Da evitare",
};

interface ScoutedPlayer {
  player: Player;
  coach: Coach;
  tier: Tier;
  valuation: Valuation;
}

export default function ScoutingPage() {
  const [groups, setGroups] = useState<Record<Tier, ScoutedPlayer[]>>({
    certezza: [],
    equilibrio: [],
    scommessa: [],
    esotico: [],
    sconsigliato: [],
  });
  useEffect(() => {
    Promise.all([
      fetch("/api/players").then((res) => leggiJson<Player[]>(res)),
      fetch("/api/coaches").then((res) => leggiJson<Coach[]>(res)),
    ]).then(([players, coaches]) => {
      const coachesMap = new Map(
        coaches.map((coach) => [coach.team.name, coach]),
      );
      const groupedPlayers: Record<Tier, ScoutedPlayer[]> = {
        certezza: [],
        equilibrio: [],
        scommessa: [],
        esotico: [],
        sconsigliato: [],
      };
      players.forEach((player) => {
        const coach = coachesMap.get(player.team.name);
        if (!coach || player.stats.length === 0) {
          return;
        } else {
          const valuation = evaluatePlayer(player, coach);
          const tier = classifyTier(player);
          groupedPlayers[tier].push({ player, coach, tier, valuation });
        }
      });
      setGroups(groupedPlayers);
    });
  }, []);
  return (
    <>
      <h1>Scouting page</h1>
      {tierList.map((tier) => {
        if(groups[tier.name].length === 0) return null;
        return (
            <div key={tier.name} className={tier.color}>
                <h2>{tierTitle[tier.name]}</h2>
            </div>
        )
      })}
    </>
  );
}

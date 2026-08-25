"use client";

import { motion, animate } from "framer-motion";
import { Player, Coach, Valuation, Tier, Role } from "@/lib/types";
import { useState, useEffect } from "react";

interface PlayerCardProps {
  player: Player;
  coach?: Coach;
  valuation: Valuation;
  tier: Tier;
  index?: number;
  budget?: number;
}

const tierColor: Record<Tier, string> = {
  certezza: "bg-tier-certezza",
  equilibrio: "bg-tier-equilibrio",
  scommessa: "bg-tier-scommessa",
  esotico: "bg-tier-esotico",
  sconsigliato: "bg-tier-sconsigliato",
};

const tierLabel: Record<Tier, string> = {
  certezza: "Certezza",
  equilibrio: "Equilibrio",
  scommessa: "Scommessa",
  esotico: "Esotico",
  sconsigliato: "Sconsigliato",
};

export function PlayerCard({
  player,
  valuation,
  tier,
  coach,
  index = 0,
  budget = 500,
}: PlayerCardProps) {
  const [price, setPrice] = useState(0);
  useEffect(() => {
    animate(0, valuation.suggestedPrice, {
      onUpdate: (latest) => setPrice(Math.round(latest)),
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -2 }}
      className="bg-pitch-800 rounded-lg p-4 shadow-md flex flex-col items-center justify-center w-full"
    >
      <div className={`w-full flex justify-between`}>
        <h3>{player.name}</h3>
        <div>
          <span>
            {player.role}-{player.team.name}-{coach?.formation}
          </span>
          <div
            className={`${tierColor[tier]} py-2 px-4 text-white rounded text-center`}
          >
            {tierLabel[tier]}
          </div>
        </div>
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-4 w-full flex flex-col gap-2">
        <div>
          <p>Prezzo (%): </p>
          <span>{price} %</span>
        </div>
        <div>
          <p>Prezzo ($): </p>
          <span>{Math.round((price / 100) * budget)} crediti</span>
        </div>
        <div>
            <p className="font-bold text-uppercase">FM attesa</p>
          <p>{valuation.projectedFantaAvg}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

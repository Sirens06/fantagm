'use client';

import { motion } from 'framer-motion';
import type { Formation, Player } from '@/lib/types';

interface PitchFormationProps {
  formation: Formation;
  starters: Player[];
  substitutes: Player[];
}

function parseLines(formation: Formation): number[] {
  return formation.split('-').map(Number);
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function PitchFormation({ formation, starters, substitutes }: PitchFormationProps) {
  const outfieldLines = parseLines(formation);
  const goalkeeper = starters[0];
  const outfielders = starters.slice(1);

  let cursor = 0;
  const lines = outfieldLines.map((count) => {
    const players = outfielders.slice(cursor, cursor + count);
    cursor += count;
    return players;
  });

  const bands = [[goalkeeper], ...lines].filter((band) => band[0]);
  const bandCount = bands.length;

  return (
    <div className="space-y-4">
      <div className="relative mx-auto aspect-[3/4] w-full max-w-md overflow-hidden rounded-3xl border border-chalk/20 bg-gradient-to-b from-pitch-700 via-pitch-800 to-pitch-950 shadow-2xl">
        {/* linee del campo */}
        <div className="absolute inset-3 rounded-2xl border border-chalk/20" />
        <div className="absolute left-3 right-3 top-1/2 border-t border-chalk/20" />
        <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-chalk/20" />
        <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-chalk/40" />
        <div className="absolute left-1/2 bottom-3 h-16 w-40 -translate-x-1/2 border border-chalk/20" />
        <div className="absolute left-1/2 top-3 h-16 w-40 -translate-x-1/2 border border-chalk/20" />

        {/* giocatori */}
        {bands.map((band, bandIndex) => {
          const y = 92 - (bandIndex / (bandCount - 1 || 1)) * 84;
          return band.map((player, i) => {
            const x = ((i + 1) / (band.length + 1)) * 100;
            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (bandIndex * 3 + i) * 0.05, type: 'spring', stiffness: 260, damping: 20 }}
                className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gold bg-pitch-900 font-display text-sm text-chalk shadow-lg">
                  {initials(player.name)}
                </div>
                <span className="max-w-[4.5rem] truncate text-center text-[10px] text-chalk/80">
                  {player.name}
                </span>
              </motion.div>
            );
          });
        })}
      </div>

      <div>
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-chalk/50">Panchina</p>
        <div className="flex flex-wrap gap-2">
          {substitutes.map((player, i) => (
            <motion.span
              key={player.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-full border border-chalk/15 bg-pitch-800 px-3 py-1 text-xs text-chalk/70"
            >
              {player.name} <span className="text-chalk/40">· {player.role}</span>
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  );
}

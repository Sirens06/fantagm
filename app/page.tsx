"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/Button";

export default function HP() {
  const sections = [
    {
      title: "Scambi suggeriti",
      href: "/trade",
      description:
        "Scegli un giocatore e scopri chi rende di più nel suo ruolo.",
      textButton: "Trova alternative",
    },
    {
      title: "Asta",
      href: "/auction",
      description:
        "Segui la chiamata e decidi quanto rilanciare senza sforare il budget.",
      textButton: "Entra nell'asta",
    },
    {
      title: "Scouting",
      href: "/scouting",
      description:
        "Certezze, scommesse e nomi esotici: ogni giocatore ha la sua etichetta.",
      textButton: "Esplora i giocatori",
    },
    {
      title: "Rose",
      href: "/squad",
      description:
        "Disponi gli undici sul campo e calcola i punti attesi a fine stagione.",
      textButton: "Costruisci la rosa",
    },
  ];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col min-h-screen bg-gray-900 text-white">
        <p>Fantacalcio • Stagione 2025/26</p>
        <h3>FANTAGM</h3>
        <p>
          Analizza storico, moduli degli allenatori, calendario e infortuni per
          dirti quanto pagare ogni giocatore — prima che lo faccia il tuo
          avversario.
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        {sections.map((section, index) => (
          <motion.div
            key={section.title}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="p-4 m-2 bg-gray-800 rounded-lg shadow-md cursor-pointer"
          >
            <h4>{section.title}</h4>
            <p>{section.description}</p>
            <Button href={section.href} variant="primary">
              {section.textButton}
            </Button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

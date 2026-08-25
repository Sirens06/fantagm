// ---------------------------------------------------------------------------
// DATASET DIMOSTRATIVO
//
// Nomi di squadre, allenatori e giocatori sono reali e servono a rendere
// riconoscibile l'applicazione. TUTTO IL RESTO E' INVENTATO:
//
//   - reliability, attackStrength, defenseStrength  -> stime a occhio
//   - formation, rotationIndex                      -> plausibili, non verificate
//   - status, isPenaltyTaker, officialPrice         -> plausibili, non verificate
//   - ogni statistica stagionale                    -> generata da seed.ts
//   - il calendario                                 -> round-robin sintetico
//
// Non usare questi numeri per decisioni d'asta. Servono a far girare
// l'applicazione end-to-end finche' non importi il listone vero con
// `npm run import:listone`, che sovrascrive giocatori e quotazioni.
//
// Rose e allenatori vanno verificati: i trasferimenti cambiano di continuo.
// ---------------------------------------------------------------------------

export type SeedTeam = {
  name: string;
  shortName: string;
  reliability: number; // 1-10
  attackStrength: number; // 0-100
  defenseStrength: number; // 0-100
  isPromoted: boolean;
};

export type SeedCoach = {
  team: string;
  name: string;
  formation: string;
  alternativeFormations: string[];
  rotationIndex: number; // 0-1
};

export type SeedPlayer = {
  name: string;
  team: string;
  role: "P" | "D" | "C" | "A";
  detailedPosition: string;
  prFormation: string[];
  birthYear: number;
  status: "TITOLARE" | "BALLOTTAGGIO" | "RISERVA" | "FUORI_ROSA";
  isPenaltyTaker?: boolean;
  officialPrice: number;
  // 0-1, quanto e' forte: pilota la generazione delle statistiche.
  quality: number;
};

export const TEAMS: SeedTeam[] = [
  { name: "Inter", shortName: "INT", reliability: 9, attackStrength: 88, defenseStrength: 84, isPromoted: false },
  { name: "Napoli", shortName: "NAP", reliability: 9, attackStrength: 84, defenseStrength: 86, isPromoted: false },
  { name: "Milan", shortName: "MIL", reliability: 8, attackStrength: 82, defenseStrength: 78, isPromoted: false },
  { name: "Juventus", shortName: "JUV", reliability: 8, attackStrength: 78, defenseStrength: 82, isPromoted: false },
  { name: "Atalanta", shortName: "ATA", reliability: 8, attackStrength: 85, defenseStrength: 76, isPromoted: false },
  { name: "Roma", shortName: "ROM", reliability: 7, attackStrength: 74, defenseStrength: 80, isPromoted: false },
  { name: "Lazio", shortName: "LAZ", reliability: 7, attackStrength: 73, defenseStrength: 72, isPromoted: false },
  { name: "Fiorentina", shortName: "FIO", reliability: 7, attackStrength: 72, defenseStrength: 70, isPromoted: false },
  { name: "Bologna", shortName: "BOL", reliability: 7, attackStrength: 70, defenseStrength: 73, isPromoted: false },
  { name: "Como", shortName: "COM", reliability: 6, attackStrength: 66, defenseStrength: 62, isPromoted: false },
  { name: "Torino", shortName: "TOR", reliability: 6, attackStrength: 60, defenseStrength: 66, isPromoted: false },
  { name: "Udinese", shortName: "UDI", reliability: 5, attackStrength: 58, defenseStrength: 60, isPromoted: false },
  { name: "Genoa", shortName: "GEN", reliability: 5, attackStrength: 54, defenseStrength: 58, isPromoted: false },
  { name: "Cagliari", shortName: "CAG", reliability: 4, attackStrength: 52, defenseStrength: 52, isPromoted: false },
  { name: "Parma", shortName: "PAR", reliability: 4, attackStrength: 50, defenseStrength: 50, isPromoted: false },
  { name: "Lecce", shortName: "LEC", reliability: 4, attackStrength: 46, defenseStrength: 50, isPromoted: false },
  { name: "Hellas Verona", shortName: "VER", reliability: 4, attackStrength: 45, defenseStrength: 48, isPromoted: false },
  { name: "Sassuolo", shortName: "SAS", reliability: 4, attackStrength: 52, defenseStrength: 44, isPromoted: true },
  { name: "Pisa", shortName: "PIS", reliability: 3, attackStrength: 42, defenseStrength: 45, isPromoted: true },
  { name: "Cremonese", shortName: "CRE", reliability: 3, attackStrength: 43, defenseStrength: 43, isPromoted: true },
];

export const COACHES: SeedCoach[] = [
  { team: "Inter", name: "Cristian Chivu", formation: "3-5-2", alternativeFormations: ["3-4-2-1"], rotationIndex: 0.45 },
  { team: "Napoli", name: "Antonio Conte", formation: "4-3-3", alternativeFormations: ["3-4-2-1"], rotationIndex: 0.25 },
  { team: "Milan", name: "Massimiliano Allegri", formation: "3-5-2", alternativeFormations: ["4-4-2"], rotationIndex: 0.35 },
  { team: "Juventus", name: "Luciano Spalletti", formation: "3-4-2-1", alternativeFormations: ["4-3-3"], rotationIndex: 0.4 },
  { team: "Atalanta", name: "Ivan Juric", formation: "3-4-2-1", alternativeFormations: ["3-4-3"], rotationIndex: 0.5 },
  { team: "Roma", name: "Gian Piero Gasperini", formation: "3-4-2-1", alternativeFormations: ["3-4-3"], rotationIndex: 0.35 },
  { team: "Lazio", name: "Maurizio Sarri", formation: "4-3-3", alternativeFormations: ["4-2-3-1"], rotationIndex: 0.2 },
  { team: "Fiorentina", name: "Stefano Pioli", formation: "3-5-2", alternativeFormations: ["4-2-3-1"], rotationIndex: 0.4 },
  { team: "Bologna", name: "Vincenzo Italiano", formation: "4-2-3-1", alternativeFormations: ["4-3-3"], rotationIndex: 0.55 },
  { team: "Como", name: "Cesc Fabregas", formation: "4-2-3-1", alternativeFormations: ["4-3-3"], rotationIndex: 0.45 },
  { team: "Torino", name: "Marco Baroni", formation: "4-2-3-1", alternativeFormations: ["3-5-2"], rotationIndex: 0.4 },
  { team: "Udinese", name: "Kosta Runjaic", formation: "3-5-2", alternativeFormations: ["3-4-2-1"], rotationIndex: 0.35 },
  { team: "Genoa", name: "Patrick Vieira", formation: "3-5-2", alternativeFormations: ["4-3-3"], rotationIndex: 0.4 },
  { team: "Cagliari", name: "Fabio Pisacane", formation: "4-3-3", alternativeFormations: ["3-5-2"], rotationIndex: 0.45 },
  { team: "Parma", name: "Carlos Cuesta", formation: "4-2-3-1", alternativeFormations: ["3-5-2"], rotationIndex: 0.5 },
  { team: "Lecce", name: "Eusebio Di Francesco", formation: "4-3-3", alternativeFormations: ["4-2-3-1"], rotationIndex: 0.4 },
  { team: "Hellas Verona", name: "Paolo Zanetti", formation: "3-5-2", alternativeFormations: ["3-4-2-1"], rotationIndex: 0.5 },
  { team: "Sassuolo", name: "Fabio Grosso", formation: "4-3-3", alternativeFormations: ["4-2-3-1"], rotationIndex: 0.35 },
  { team: "Pisa", name: "Alberto Gilardino", formation: "3-5-2", alternativeFormations: ["3-4-2-1"], rotationIndex: 0.45 },
  { team: "Cremonese", name: "Davide Nicola", formation: "3-5-2", alternativeFormations: ["4-3-3"], rotationIndex: 0.4 },
];

const BACK3 = ["3-5-2", "3-4-2-1", "3-4-3"];
const BACK4 = ["4-3-3", "4-2-3-1", "4-4-2"];

export const PLAYERS: SeedPlayer[] = [
  // Portieri
  { name: "Yann Sommer", team: "Inter", role: "P", detailedPosition: "portiere", prFormation: BACK3, birthYear: 1988, status: "TITOLARE", officialPrice: 15, quality: 0.78 },
  { name: "Alex Meret", team: "Napoli", role: "P", detailedPosition: "portiere", prFormation: BACK4, birthYear: 1997, status: "TITOLARE", officialPrice: 14, quality: 0.76 },
  { name: "Mike Maignan", team: "Milan", role: "P", detailedPosition: "portiere", prFormation: BACK3, birthYear: 1995, status: "TITOLARE", officialPrice: 17, quality: 0.82 },
  { name: "Michele Di Gregorio", team: "Juventus", role: "P", detailedPosition: "portiere", prFormation: BACK3, birthYear: 1997, status: "TITOLARE", officialPrice: 14, quality: 0.74 },
  { name: "Marco Carnesecchi", team: "Atalanta", role: "P", detailedPosition: "portiere", prFormation: BACK3, birthYear: 2000, status: "TITOLARE", officialPrice: 15, quality: 0.77 },
  { name: "Mile Svilar", team: "Roma", role: "P", detailedPosition: "portiere", prFormation: BACK3, birthYear: 1999, status: "TITOLARE", officialPrice: 16, quality: 0.8 },
  { name: "Ivan Provedel", team: "Lazio", role: "P", detailedPosition: "portiere", prFormation: BACK4, birthYear: 1994, status: "TITOLARE", officialPrice: 12, quality: 0.68 },
  { name: "Lukasz Skorupski", team: "Bologna", role: "P", detailedPosition: "portiere", prFormation: BACK4, birthYear: 1991, status: "TITOLARE", officialPrice: 11, quality: 0.65 },
  { name: "Elia Caprile", team: "Cagliari", role: "P", detailedPosition: "portiere", prFormation: BACK4, birthYear: 2001, status: "TITOLARE", officialPrice: 10, quality: 0.62 },
  { name: "Wladimiro Falcone", team: "Lecce", role: "P", detailedPosition: "portiere", prFormation: BACK4, birthYear: 1995, status: "TITOLARE", officialPrice: 10, quality: 0.6 },

  // Difensori
  { name: "Alessandro Bastoni", team: "Inter", role: "D", detailedPosition: "difensore centrale", prFormation: BACK3, birthYear: 1999, status: "TITOLARE", officialPrice: 22, quality: 0.85 },
  { name: "Federico Dimarco", team: "Inter", role: "D", detailedPosition: "esterno sinistro", prFormation: BACK3, birthYear: 1997, status: "TITOLARE", officialPrice: 28, quality: 0.88 },
  { name: "Denzel Dumfries", team: "Inter", role: "D", detailedPosition: "esterno destro", prFormation: BACK3, birthYear: 1996, status: "TITOLARE", officialPrice: 24, quality: 0.82 },
  { name: "Amir Rrahmani", team: "Napoli", role: "D", detailedPosition: "difensore centrale", prFormation: BACK4, birthYear: 1994, status: "TITOLARE", officialPrice: 14, quality: 0.72 },
  { name: "Giovanni Di Lorenzo", team: "Napoli", role: "D", detailedPosition: "terzino destro", prFormation: BACK4, birthYear: 1993, status: "TITOLARE", officialPrice: 18, quality: 0.78 },
  { name: "Theo Hernandez", team: "Milan", role: "D", detailedPosition: "terzino sinistro", prFormation: BACK3, birthYear: 1997, status: "TITOLARE", officialPrice: 26, quality: 0.84 },
  { name: "Fikayo Tomori", team: "Milan", role: "D", detailedPosition: "difensore centrale", prFormation: BACK3, birthYear: 1997, status: "TITOLARE", officialPrice: 13, quality: 0.7 },
  { name: "Andrea Cambiaso", team: "Juventus", role: "D", detailedPosition: "esterno sinistro", prFormation: BACK3, birthYear: 2000, status: "TITOLARE", officialPrice: 20, quality: 0.79 },
  { name: "Gleison Bremer", team: "Juventus", role: "D", detailedPosition: "difensore centrale", prFormation: BACK3, birthYear: 1997, status: "TITOLARE", officialPrice: 19, quality: 0.8 },
  { name: "Giorgio Scalvini", team: "Atalanta", role: "D", detailedPosition: "difensore centrale", prFormation: BACK3, birthYear: 2003, status: "BALLOTTAGGIO", officialPrice: 12, quality: 0.68 },
  { name: "Davide Zappacosta", team: "Atalanta", role: "D", detailedPosition: "esterno destro", prFormation: BACK3, birthYear: 1992, status: "TITOLARE", officialPrice: 17, quality: 0.75 },
  { name: "Gianluca Mancini", team: "Roma", role: "D", detailedPosition: "difensore centrale", prFormation: BACK3, birthYear: 1996, status: "TITOLARE", officialPrice: 15, quality: 0.73 },
  { name: "Angelino", team: "Roma", role: "D", detailedPosition: "esterno sinistro", prFormation: BACK3, birthYear: 1997, status: "TITOLARE", officialPrice: 21, quality: 0.8 },
  { name: "Alessio Romagnoli", team: "Lazio", role: "D", detailedPosition: "difensore centrale", prFormation: BACK4, birthYear: 1995, status: "TITOLARE", officialPrice: 12, quality: 0.67 },
  { name: "Dodo", team: "Fiorentina", role: "D", detailedPosition: "terzino destro", prFormation: BACK3, birthYear: 1998, status: "TITOLARE", officialPrice: 16, quality: 0.74 },
  { name: "Sam Beukema", team: "Bologna", role: "D", detailedPosition: "difensore centrale", prFormation: BACK4, birthYear: 1998, status: "TITOLARE", officialPrice: 11, quality: 0.66 },
  { name: "Alberto Dossena", team: "Como", role: "D", detailedPosition: "difensore centrale", prFormation: BACK4, birthYear: 1998, status: "TITOLARE", officialPrice: 9, quality: 0.6 },
  { name: "Guillermo Maripan", team: "Torino", role: "D", detailedPosition: "difensore centrale", prFormation: BACK4, birthYear: 1994, status: "TITOLARE", officialPrice: 8, quality: 0.56 },
  { name: "Thomas Kristensen", team: "Udinese", role: "D", detailedPosition: "difensore centrale", prFormation: BACK3, birthYear: 1997, status: "BALLOTTAGGIO", officialPrice: 7, quality: 0.52 },
  { name: "Federico Baschirotto", team: "Cremonese", role: "D", detailedPosition: "difensore centrale", prFormation: BACK3, birthYear: 1996, status: "TITOLARE", officialPrice: 7, quality: 0.5 },

  // Centrocampisti
  { name: "Nicolo Barella", team: "Inter", role: "C", detailedPosition: "mezzala", prFormation: BACK3, birthYear: 1997, status: "TITOLARE", officialPrice: 32, quality: 0.86 },
  { name: "Hakan Calhanoglu", team: "Inter", role: "C", detailedPosition: "regista", prFormation: BACK3, birthYear: 1994, status: "TITOLARE", isPenaltyTaker: true, officialPrice: 36, quality: 0.89 },
  { name: "Scott McTominay", team: "Napoli", role: "C", detailedPosition: "mezzala", prFormation: BACK4, birthYear: 1996, status: "TITOLARE", officialPrice: 34, quality: 0.87 },
  { name: "Kevin De Bruyne", team: "Napoli", role: "C", detailedPosition: "trequartista", prFormation: BACK4, birthYear: 1991, status: "TITOLARE", isPenaltyTaker: true, officialPrice: 38, quality: 0.9 },
  { name: "Christian Pulisic", team: "Milan", role: "C", detailedPosition: "trequartista", prFormation: BACK3, birthYear: 1998, status: "TITOLARE", officialPrice: 40, quality: 0.91 },
  { name: "Tijjani Reijnders", team: "Milan", role: "C", detailedPosition: "mezzala", prFormation: BACK3, birthYear: 1998, status: "TITOLARE", officialPrice: 30, quality: 0.84 },
  { name: "Manuel Locatelli", team: "Juventus", role: "C", detailedPosition: "regista", prFormation: BACK3, birthYear: 1998, status: "TITOLARE", officialPrice: 14, quality: 0.66 },
  { name: "Kenan Yildiz", team: "Juventus", role: "C", detailedPosition: "trequartista", prFormation: BACK3, birthYear: 2005, status: "TITOLARE", isPenaltyTaker: true, officialPrice: 33, quality: 0.85 },
  { name: "Ederson", team: "Atalanta", role: "C", detailedPosition: "mezzala", prFormation: BACK3, birthYear: 1999, status: "TITOLARE", officialPrice: 22, quality: 0.78 },
  { name: "Charles De Ketelaere", team: "Atalanta", role: "C", detailedPosition: "trequartista", prFormation: BACK3, birthYear: 2001, status: "TITOLARE", isPenaltyTaker: true, officialPrice: 31, quality: 0.84 },
  { name: "Lorenzo Pellegrini", team: "Roma", role: "C", detailedPosition: "trequartista", prFormation: BACK3, birthYear: 1996, status: "BALLOTTAGGIO", officialPrice: 18, quality: 0.7 },
  { name: "Matias Soule", team: "Roma", role: "C", detailedPosition: "ala destra", prFormation: BACK3, birthYear: 2003, status: "TITOLARE", officialPrice: 26, quality: 0.8 },
  { name: "Mattia Zaccagni", team: "Lazio", role: "C", detailedPosition: "ala sinistra", prFormation: BACK4, birthYear: 1995, status: "TITOLARE", officialPrice: 27, quality: 0.81 },
  { name: "Nicolo Rovella", team: "Lazio", role: "C", detailedPosition: "regista", prFormation: BACK4, birthYear: 2001, status: "TITOLARE", officialPrice: 12, quality: 0.62 },
  { name: "Rolando Mandragora", team: "Fiorentina", role: "C", detailedPosition: "mezzala", prFormation: BACK3, birthYear: 1997, status: "TITOLARE", officialPrice: 13, quality: 0.64 },
  { name: "Riccardo Orsolini", team: "Bologna", role: "C", detailedPosition: "ala destra", prFormation: BACK4, birthYear: 1997, status: "TITOLARE", isPenaltyTaker: true, officialPrice: 35, quality: 0.87 },
  { name: "Nico Paz", team: "Como", role: "C", detailedPosition: "trequartista", prFormation: BACK4, birthYear: 2004, status: "TITOLARE", isPenaltyTaker: true, officialPrice: 32, quality: 0.85 },
  { name: "Samuele Ricci", team: "Milan", role: "C", detailedPosition: "regista", prFormation: BACK3, birthYear: 2001, status: "BALLOTTAGGIO", officialPrice: 11, quality: 0.6 },
  { name: "Cesare Casadei", team: "Torino", role: "C", detailedPosition: "mezzala", prFormation: BACK4, birthYear: 2003, status: "TITOLARE", officialPrice: 14, quality: 0.65 },
  { name: "Sandi Lovric", team: "Udinese", role: "C", detailedPosition: "mezzala", prFormation: BACK3, birthYear: 1998, status: "TITOLARE", officialPrice: 12, quality: 0.61 },
  { name: "Morten Frendrup", team: "Genoa", role: "C", detailedPosition: "mediano", prFormation: BACK3, birthYear: 2001, status: "TITOLARE", officialPrice: 10, quality: 0.58 },
  { name: "Adrien Tameze", team: "Hellas Verona", role: "C", detailedPosition: "mediano", prFormation: BACK3, birthYear: 1994, status: "RISERVA", officialPrice: 6, quality: 0.45 },
  { name: "Domenico Berardi", team: "Sassuolo", role: "C", detailedPosition: "ala destra", prFormation: BACK4, birthYear: 1994, status: "TITOLARE", isPenaltyTaker: true, officialPrice: 29, quality: 0.82 },

  // Attaccanti
  { name: "Lautaro Martinez", team: "Inter", role: "A", detailedPosition: "punta centrale", prFormation: BACK3, birthYear: 1997, status: "TITOLARE", isPenaltyTaker: true, officialPrice: 62, quality: 0.93 },
  { name: "Marcus Thuram", team: "Inter", role: "A", detailedPosition: "seconda punta", prFormation: BACK3, birthYear: 1997, status: "TITOLARE", officialPrice: 52, quality: 0.89 },
  { name: "Romelu Lukaku", team: "Napoli", role: "A", detailedPosition: "punta centrale", prFormation: BACK4, birthYear: 1993, status: "TITOLARE", officialPrice: 48, quality: 0.86 },
  { name: "Rafael Leao", team: "Milan", role: "A", detailedPosition: "ala sinistra", prFormation: BACK3, birthYear: 1999, status: "TITOLARE", officialPrice: 55, quality: 0.9 },
  { name: "Dusan Vlahovic", team: "Juventus", role: "A", detailedPosition: "punta centrale", prFormation: BACK3, birthYear: 2000, status: "BALLOTTAGGIO", officialPrice: 42, quality: 0.83 },
  { name: "Jonathan David", team: "Juventus", role: "A", detailedPosition: "punta centrale", prFormation: BACK3, birthYear: 2000, status: "TITOLARE", officialPrice: 45, quality: 0.85 },
  { name: "Ademola Lookman", team: "Atalanta", role: "A", detailedPosition: "seconda punta", prFormation: BACK3, birthYear: 1997, status: "TITOLARE", isPenaltyTaker: true, officialPrice: 58, quality: 0.91 },
  { name: "Artem Dovbyk", team: "Roma", role: "A", detailedPosition: "punta centrale", prFormation: BACK3, birthYear: 1997, status: "BALLOTTAGGIO", officialPrice: 28, quality: 0.74 },
  { name: "Valentin Castellanos", team: "Lazio", role: "A", detailedPosition: "punta centrale", prFormation: BACK4, birthYear: 1998, status: "TITOLARE", officialPrice: 30, quality: 0.77 },
  { name: "Moise Kean", team: "Fiorentina", role: "A", detailedPosition: "punta centrale", prFormation: BACK3, birthYear: 2000, status: "TITOLARE", isPenaltyTaker: true, officialPrice: 50, quality: 0.87 },
  { name: "Santiago Castro", team: "Bologna", role: "A", detailedPosition: "punta centrale", prFormation: BACK4, birthYear: 2004, status: "TITOLARE", officialPrice: 26, quality: 0.73 },
  { name: "Anastasios Douvikas", team: "Como", role: "A", detailedPosition: "punta centrale", prFormation: BACK4, birthYear: 1999, status: "BALLOTTAGGIO", officialPrice: 14, quality: 0.58 },
  { name: "Duvan Zapata", team: "Torino", role: "A", detailedPosition: "punta centrale", prFormation: BACK4, birthYear: 1991, status: "RISERVA", officialPrice: 9, quality: 0.45 },
  { name: "Keinan Davis", team: "Udinese", role: "A", detailedPosition: "punta centrale", prFormation: BACK3, birthYear: 1998, status: "BALLOTTAGGIO", officialPrice: 11, quality: 0.52 },
  { name: "Lorenzo Colombo", team: "Genoa", role: "A", detailedPosition: "punta centrale", prFormation: BACK3, birthYear: 2002, status: "TITOLARE", officialPrice: 13, quality: 0.56 },
  { name: "Roberto Piccoli", team: "Cagliari", role: "A", detailedPosition: "punta centrale", prFormation: BACK4, birthYear: 2001, status: "TITOLARE", isPenaltyTaker: true, officialPrice: 20, quality: 0.66 },
  { name: "Nikola Krstovic", team: "Lecce", role: "A", detailedPosition: "punta centrale", prFormation: BACK4, birthYear: 2000, status: "TITOLARE", officialPrice: 19, quality: 0.65 },
  { name: "Pontus Almqvist", team: "Pisa", role: "A", detailedPosition: "ala destra", prFormation: BACK3, birthYear: 1999, status: "TITOLARE", officialPrice: 8, quality: 0.47 },
  { name: "Antonio Sanabria", team: "Cremonese", role: "A", detailedPosition: "seconda punta", prFormation: BACK3, birthYear: 1996, status: "BALLOTTAGGIO", officialPrice: 8, quality: 0.46 },
  { name: "Armand Lauriente", team: "Sassuolo", role: "A", detailedPosition: "ala sinistra", prFormation: BACK4, birthYear: 1998, status: "TITOLARE", officialPrice: 24, quality: 0.71 },
  { name: "Giovane Santana", team: "Hellas Verona", role: "A", detailedPosition: "punta centrale", prFormation: BACK3, birthYear: 2003, status: "TITOLARE", officialPrice: 12, quality: 0.54 },
  { name: "Mateo Pellegrino", team: "Parma", role: "A", detailedPosition: "punta centrale", prFormation: BACK4, birthYear: 2001, status: "TITOLARE", officialPrice: 15, quality: 0.6 },
];

# Stato del progetto

Aggiornato il 2 settembre 2026. Asta il 5 settembre.
Divisione del lavoro: **backend Claude, frontend Alessandro.**

---

## Regole di lega (fissate, gia' in codice)

| | |
|---|---|
| Crediti a squadra | **1000** |
| Rosa | **3 P · 8 D · 8 C · 6 A** = 25 giocatori |
| Squadre | **8** (tetto applicato all'ingresso) |
| Formati listone | `.xlsx` `.xls` `.csv` — PDF e DOCX **fuori**, dopo l'asta |

Sono i default di `POST /api/asta/crea`: crei una stanza senza passare niente
e sono gia' questi. Restano sovrascrivibili per stanza.

> **Da sapere:** `prezzoConsigliato` scala sul budget della stanza. Passando da
> 500 a 1000 tutti i prezzi consigliati sono raddoppiati (Lautaro: 81 → 162).
> E' corretto, ma guardali una volta prima del 5.

---

## Backend — quello che c'e' e funziona

Tutte le risposte d'errore hanno la forma `{ errore, messaggio }` con
`messaggio` gia' in italiano, pronto da mostrare.

### Stanza e ingresso

| Route | Cosa fa |
|---|---|
| `POST /api/asta/crea` | Crea la stanza. Accetta `nome`, `budget`, `slotP/D/C/A`, `maxSquadre`. Torna `codice`, `slotMax`, `maxSquadre` e **`adminToken` — esce solo qui, poi si recupera solo da Prisma Studio** |
| `GET /api/asta/[codice]` | Lo stato completo. E' quello che il polling chiama ogni 1,5s. Non espone mai l'adminToken |
| `POST /api/asta/[codice]/entra` | `{ nomeSquadra }` → `{ squadraId, budget, rientro }`. Stesso nome = rientri nella tua squadra. A stanza piena risponde **409 `stanza_piena`**, ma il rientro passa sempre |

### Conduzione (tutte vogliono `adminToken` nel corpo)

| Route | Cosa fa |
|---|---|
| `POST .../lotto` | `{ adminToken, playerId }` — mette un giocatore in asta |
| `POST .../aggiudica` | Assegna al miglior offerente, **scala i crediti**, chiude il lotto |
| `POST .../annulla` | Chiude il lotto senza assegnare |
| `POST .../chiudi` | Termina l'asta |

Tutte rispondono con lo stato completo aggiornato: chiami e usi la risposta,
non serve rifare il GET.

### Rilancio — le validazioni ci sono gia' tutte

`POST .../rilancio` con `{ squadraId, importo }` rifiuta:

1. importo non intero o < 1
2. nessun lotto aperto
3. squadra che non appartiene alla stanza
4. importo oltre il budget residuo
5. **ruolo gia' pieno** (es. il quarto portiere)
6. **crediti che non basterebbero a riempire gli slot rimasti** — con 40 crediti
   e 15 slot vuoti non puoi spenderne 38 su uno solo
7. rilanci simultanei: l'update e' atomico, il secondo perde e riceve l'offerta vera

### Listone

| Route | Cosa fa |
|---|---|
| `GET /api/listone` | `?q=&ruolo=&codice=&take=&skip=`. `take` fino a **600** (listone intero in un colpo), default 60. Con `codice` marca `venduto: true` chi e' gia' stato assegnato in quella stanza. Ogni riga ha nome, squadra, ruolo, quotazione, **prezzoConsigliato**, **scarto**, **fascia** |
| `POST /api/listone/importa` | Multipart, campo `file`. Torna `creati`, `aggiornati`, `scartate`, `dettaglioScarti` (prime 20), **`squadreIgnote`**, `colonneTrovate` |

### Rose ed export

| Route | Cosa fa |
|---|---|
| `GET .../rosa?squadraId=` | La rosa di una squadra: per ogni giocatore nome, ruolo, **prezzo pagato**, consigliato, `affare` (quanto sotto/sopra l'hai pagato) e punti attesi. Piu' `slot`, `slotMax`, `completa` e i punti totali |
| `GET .../export` | Scarica un `.xlsx` con le rose di tutte le squadre |

---

## Backend — quello che NON c'e'

- **Niente test.** I "27 test su 27" citati nel piano non sono mai stati
  committati: non c'e' framework, non c'e' script `test` in package.json.
  Le verifiche di oggi le ho fatte a mano via HTTP.
- **Niente PDF e DOCX** nell'import (deciso: dopo l'asta).
- **Niente WebSocket.** L'aggiornamento e' polling a 1,5s. Basta e avanza per otto telefoni.
- **Niente route per il QR** — e non serve: il QR e' un'immagine generata nel browser
  dall'URL della stanza.
- **Nessun modo di cancellare una squadra** entrata per sbaglio, se non da Prisma Studio.

---

## Frontend — quello che c'e'

- `/asta/[codice]` — sala d'asta completa e funzionante: ingresso, giocatore in
  asta, offerta con la barra del consigliato, rilancio, barra del tuo budget,
  cronologia, griglia squadre, indicatore di linea, pannello banditore.
- `/asta/crea` — **fatto il 3 settembre.** Form con le regole di lega
  precompilate, salva l'adminToken in localStorage, porta nella stanza.
- `PannelloStanza` — **fatto il 3 settembre.** Link, QR (pacchetto `qrcode`) e
  contatore squadre, dentro la sala e solo per chi ha l'adminToken.
- `/dati` — **fatto il 4 settembre.** Carica il listone via multipart, mostra
  squadre ignote, conteggi e scarti riga per riga.
- `/scouting` e `/` — preesistenti, non toccate.
- Palette: verde campo + rosa Gazzetta, token in `app/globals.css`
  (`campo`, `superficie`, `riga`, `gesso`, `nebbia`, `rosa`, `affare`, `troppo`).

---

## Frontend — da fare

Ordinati: i primi due sbloccano tutto il resto, il terzo va fatto **giorni prima**
del 5 e non la sera stessa.

### 1. Pagina di creazione stanza — `/asta/crea`
**Chiuso.**
Senza questa una stanza si crea solo da terminale.
- [ ] Form: nome, budget (1000), slot P/D/C/A (3/8/8/6), numero squadre (8) — tutti precompilati
- [ ] `POST /api/asta/crea`
- [ ] **Salvare `adminToken` in `localStorage` come `fantagm:{codice}:adminToken`** — esce una volta sola
- [ ] Mostrare il codice stanza e portare a `/asta/{codice}`

### 2. Pannello stanza + QR (dentro la sala, per il banditore)
**Chiuso.**
- [ ] `npm i qrcode` e generare il QR da `window.location.origin + "/asta/" + codice`
- [ ] Link completo in chiaro + bottone "Copia link"
- [ ] Contatore `squadre.length` / `maxSquadre` dallo stato — sai chi manca senza chiedere
- [ ] Gestire il **409 `stanza_piena`** nel form d'ingresso: il messaggio arriva gia' in italiano

### 3. Pagina dati — `/dati`
**Chiuso.**
- [ ] `<input type="file" accept=".xlsx,.xls,.csv">` → `FormData` → `POST /api/listone/importa`
- [ ] Mostrare creati / aggiornati / scartate
- [ ] **Mostrare `squadreIgnote` bene in vista**: sono i giocatori spariti dal listone
      perche' la loro squadra non e' a database. E' il modo in cui l'import fallisce in silenzio
- [ ] Bottone per scaricare l'export: `GET /api/asta/{codice}/export`

### 4. Rose dentro la griglia squadre
- [ ] Riga della griglia che si apre e chiama `GET /api/asta/{codice}/rosa?squadraId=`
- [ ] Elencare per ruolo con prezzo pagato e `affare` (verde se positivo)
- [ ] Non mettere le rose nel polling: il payload da 1,5s resterebbe gonfio per niente

### 5. Pagina listone — `/listone`
- [ ] `GET /api/listone?take=600` una volta sola, poi filtri in locale
- [ ] Cerca per nome/squadra, filtro ruolo, filtro fascia
- [ ] Colonne: nome, squadra, ruolo, quotazione, consigliato, scarto, fascia
- [ ] I venduti (passando `codice`) barrati, non nascosti

### 6. Riverniciatura (facoltativa, dopo)
- [ ] Se vuoi il look "tabellone" del mockup: e' una passata sui token in `globals.css`

---

## Rischio da chiudere prima del 5

L'import aggancia i giocatori alle squadre **per nome**, e le venti squadre
devono gia' essere a database. Se il tuo file scrive "Inter" dove noi abbiamo
"Internazionale", quei giocatori finiscono in `squadreIgnote` e non compaiono
in asta. **Prova l'import col file vero adesso**, non il 5 settembre.

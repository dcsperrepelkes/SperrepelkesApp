"use strict";

/* =========================================================================
 *  CONFIGURATIE
 *  Zelfde "Publiceren op web" CSV-links als in de Android-app. Pas hier aan
 *  als je sheet-links wijzigen. Zie het Android-project (AppConfig.kt) voor
 *  uitleg hoe je die links maakt.
 * ========================================================================= */
const CLUB_NAAM = "Dartsclub De Sperrepelkes";
const CACHE_GELDIGHEID_MINUTEN = 30;

// Zet op false voor de live versie: verbergt de handmatige vernieuwknop op
// de Home-pagina (die daar sowieso overbodig is, want alles ververst er
// automatisch elke 30 minuten). Zet op true tijdens het testen om altijd
// meteen te kunnen forceren. Geldt enkel voor Home — op Kalender en
// Rangschikking blijft de knop altijd zichtbaar.
const TOON_VERVERSKNOP_HOME = false;

const REEKSEN = ["A", "B", "C", "D"];
const REEKS_LABEL = { A: "Reeks A", B: "Reeks B", C: "Reeks C", D: "Reeks D" };

const URLS = {
  KALENDER: {
    A: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSI02lGel1v0PTsasuhZLBy70jegogINtIgPyV2WXOuMBAOlQ80Qxf47tCOHDoLk9Q8_op_ppYaikzN/pub?gid=0&single=true&output=csv",
    B: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSI02lGel1v0PTsasuhZLBy70jegogINtIgPyV2WXOuMBAOlQ80Qxf47tCOHDoLk9Q8_op_ppYaikzN/pub?gid=55764696&single=true&output=csv",
    C: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSI02lGel1v0PTsasuhZLBy70jegogINtIgPyV2WXOuMBAOlQ80Qxf47tCOHDoLk9Q8_op_ppYaikzN/pub?gid=141691946&single=true&output=csv",
    D: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSI02lGel1v0PTsasuhZLBy70jegogINtIgPyV2WXOuMBAOlQ80Qxf47tCOHDoLk9Q8_op_ppYaikzN/pub?gid=687055042&single=true&output=csv"
  },
  RANGSCHIKKING: {
    A: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSI02lGel1v0PTsasuhZLBy70jegogINtIgPyV2WXOuMBAOlQ80Qxf47tCOHDoLk9Q8_op_ppYaikzN/pub?gid=1394839293&single=true&output=csv",
    B: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSI02lGel1v0PTsasuhZLBy70jegogINtIgPyV2WXOuMBAOlQ80Qxf47tCOHDoLk9Q8_op_ppYaikzN/pub?gid=1055563907&single=true&output=csv",
    C: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSI02lGel1v0PTsasuhZLBy70jegogINtIgPyV2WXOuMBAOlQ80Qxf47tCOHDoLk9Q8_op_ppYaikzN/pub?gid=1949253640&single=true&output=csv",
    D: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSI02lGel1v0PTsasuhZLBy70jegogINtIgPyV2WXOuMBAOlQ80Qxf47tCOHDoLk9Q8_op_ppYaikzN/pub?gid=201566633&single=true&output=csv"
  }
};

const BEWERKINGSDATUM_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSI02lGel1v0PTsasuhZLBy70jegogINtIgPyV2WXOuMBAOlQ80Qxf47tCOHDoLk9Q8_op_ppYaikzN/pub?gid=100210522&single=true&output=csv";

const ZICHTBARE_KOLOMMEN = [
  { naam: "Plaats", label: "Nr." },
  { naam: "Speler", label: "Speler" },
  { naam: "Gewonnen", label: "Gew." },
  { naam: "Verloren", label: "Verl." },
  { naam: "Leg winst %", label: "Winst %" },
  { naam: "Punten", label: "Punten" }
];

// Vaste (smalle) breedte voor alles behalve Speler — Speler zelf krijgt geen
// vaste breedte en vult daardoor automatisch de resterende ruimte op
// (table-layout: fixed verdeelt de rest van de tabelbreedte over kolommen
// zonder expliciete breedte).
const KOLOM_BREEDTE = {
  "Plaats": "30px",
  "Gewonnen": "38px",
  "Verloren": "38px",
  "Leg winst %": "58px",
  "Punten": "46px"
};

/**
 * =========================================================================
 *  OPTIONELE HOME-SECTIES
 * =========================================================================
 *  Elke sectie hieronder is optioneel: laat de URL op de placeholder staan
 *  (of leeg) en de bijhorende sectie verschijnt gewoon niet op de
 *  homepagina — geen foutmelding, geen kapotte layout. Maak je later het
 *  tabblad aan, plak dan gewoon de "Publiceren op web"-CSV-link hieronder.
 *
 *  Verwachte kolommen per tabblad (zie README-web.md voor het volledige
 *  voorbeeld):
 *   - nieuws:     Datum, Titel, Tekst, Link (Link optioneel)
 *   - ploeg:      2 kolommen zonder kopregel: label, waarde
 *                 (bv. "Volgende wedstrijd" | "Sperrepelkes A - KDC Leiestreek")
 *   - cup:        2 kolommen zonder kopregel: label, waarde
 *                 (bv. "Volgende datum" | "14/03/2026")
 *   - sponsor:    Naam, Tekst, Website, Afbeelding (allemaal optioneel
 *                 behalve Naam; Afbeelding = directe beeld-URL, bv. via
 *                 imgur.com; eerste rij met een Naam wordt getoond)
 *
 *  De "Ranking"-sectie (hoogste checkout / meeste 180's) heeft GEEN eigen
 *  tabblad — die data wordt rechtstreeks uit de 4 bestaande
 *  rangschikking-sheets (A/B/C/D) gehaald, kolom Q (hoogste uitworp) en
 *  kolom R (aantal 180's). Zie RANKING_KOLOM hieronder.
 * ========================================================================= */
const EXTRA_URLS = {
  nieuws: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSI02lGel1v0PTsasuhZLBy70jegogINtIgPyV2WXOuMBAOlQ80Qxf47tCOHDoLk9Q8_op_ppYaikzN/pub?gid=762873295&single=true&output=csv",
  ploeg: "https://docs.google.com/spreadsheets/d/e/VUL-HIER-JOUW-ID-IN/pub?gid=0&single=true&output=csv",
  cup: "https://docs.google.com/spreadsheets/d/e/VUL-HIER-JOUW-ID-IN/pub?gid=0&single=true&output=csv",
  sponsor: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSI02lGel1v0PTsasuhZLBy70jegogINtIgPyV2WXOuMBAOlQ80Qxf47tCOHDoLk9Q8_op_ppYaikzN/pub?gid=1544703726&single=true&output=csv"
};

// Kolomindices (0-gebaseerd) in de rangschikking-sheets voor de Ranking-sectie.
// Kolom Q = 17de kolom = index 16. Kolom R = 18de kolom = index 17.
const RANKING_KOLOM = { checkout: 16, achttienen: 17 };

function urlGeconfigureerd(url) {
  return !!url && url.trim() !== "" && !url.includes("VUL-HIER");
}

/* =========================================================================
 *  CSV PARSER (gelijk aan CsvParser.kt: komma's/aanhalingstekens binnen velden)
 * ========================================================================= */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let insideQuotes = false;
  const clean = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  function endField() { row.push(field); field = ""; }
  function endRow() {
    endField();
    if (row.some((c) => c.trim() !== "")) rows.push(row);
    row = [];
  }

  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (insideQuotes) {
      if (c === '"') {
        if (clean[i + 1] === '"') { field += '"'; i++; }
        else insideQuotes = false;
      } else field += c;
    } else if (c === '"') insideQuotes = true;
    else if (c === ",") endField();
    else if (c === "\n") endRow();
    else field += c;
  }
  if (field.length > 0 || row.length > 0) endRow();
  return rows;
}

/* =========================================================================
 *  KALENDER PARSER (gelijk aan KalenderParser.kt)
 * ========================================================================= */
function extractDatum(titel) {
  const m = titel.match(/\d{2}\/\d{2}\/\d{4}/);
  if (!m) return null;
  const [d, mo, y] = m[0].split("/").map(Number);
  const date = new Date(y, mo - 1, d);
  return isNaN(date.getTime()) ? null : date;
}

function parseKalender(rows) {
  const speeldagen = [];
  let titel = null, ronde = null, wedstrijden = [];

  function flush() {
    if (titel !== null) {
      speeldagen.push({ titel, ronde, datum: extractDatum(titel), wedstrijden: wedstrijden.slice() });
    }
    titel = null; ronde = null; wedstrijden = [];
  }

  let i = 0;
  while (i < rows.length) {
    const row = rows[i];
    const col0 = (row[0] || "").trim();
    const isBlank = row.every((c) => c.trim() === "");

    if (isBlank) {
      // overslaan
    } else if (col0.toLowerCase() === "speeldag") {
      flush();
      titel = (row[1] || "").trim();
      const next = rows[i + 1];
      const nextCol1 = next ? (next[1] || "").trim() : "";
      if (next && nextCol1.toLowerCase() === "speler 1") {
        const r = (next[0] || "").trim();
        ronde = r || null;
        i++;
      }
    } else {
      const tijd = (row[0] || "").trim();
      const speler1 = (row[1] || "").trim();
      const score1 = (row[2] || "").trim();
      const score2 = (row[3] || "").trim();
      const speler2 = (row[4] || "").trim();
      if (speler1 || speler2) wedstrijden.push({ tijd, speler1, score1, score2, speler2 });
    }
    i++;
  }
  flush();
  return speeldagen;
}

function dichtstbijzijndeVerledenIndex(speeldagen) {
  const vandaag = new Date();
  vandaag.setHours(0, 0, 0, 0);
  let besteIndex = -1, besteDatum = null;
  speeldagen.forEach((sd, idx) => {
    if (!sd.datum) return;
    if (sd.datum <= vandaag && (!besteDatum || sd.datum > besteDatum)) {
      besteDatum = sd.datum; besteIndex = idx;
    }
  });
  return besteIndex;
}

/* =========================================================================
 *  CACHE (localStorage, zelfde gedrag als SheetCache.kt / BewerkingsdatumRepository.kt)
 * ========================================================================= */
const Cache = {
  contentKey: (type, reeks) => `content_${type}_${reeks}`,
  timeKey: (type, reeks) => `timestamp_${type}_${reeks}`,
  save(type, reeks, text) {
    try {
      localStorage.setItem(this.contentKey(type, reeks), text);
      localStorage.setItem(this.timeKey(type, reeks), String(Date.now()));
    } catch (e) { /* opslag kan falen (privénavigatie e.d.); negeer stil */ }
  },
  load(type, reeks) {
    return localStorage.getItem(this.contentKey(type, reeks));
  },
  lastFetched(type, reeks) {
    const v = localStorage.getItem(this.timeKey(type, reeks));
    return v ? Number(v) : -1;
  }
};

async function fetchSheet(type, reeks, forceRefresh) {
  if (!forceRefresh) {
    const cached = Cache.load(type, reeks);
    const laatsteFetch = Cache.lastFetched(type, reeks);
    const geldigMillis = CACHE_GELDIGHEID_MINUTEN * 60000;
    const nogGeldig = laatsteFetch > 0 && Date.now() - laatsteFetch < geldigMillis;
    if (cached !== null && nogGeldig) {
      return { ok: true, rows: parseCsv(cached), fromCache: true, fetchedAt: laatsteFetch };
    }
  }
  const url = URLS[type][reeks];
  try {
    const resp = await fetch(url, { cache: "no-store" });
    if (!resp.ok) throw new Error(`Serverfout: HTTP ${resp.status}`);
    const body = await resp.text();
    Cache.save(type, reeks, body);
    return { ok: true, rows: parseCsv(body), fromCache: false, fetchedAt: Date.now() };
  } catch (e) {
    const cached = Cache.load(type, reeks);
    if (cached !== null) {
      return {
        ok: false,
        rows: parseCsv(cached),
        message: "Kon geen verbinding maken met de Sperrepelkes data, de laatst gekende gegevens worden getoond.",
        fetchedAt: Cache.lastFetched(type, reeks)
      };
    }
    return {
      ok: false,
      rows: [],
      message: e.message || "Onbekende fout bij ophalen van de Sperrepelkes gegevens. Neem contact op met het bestuur.",
      fetchedAt: -1
    };
  }
}

async function fetchBewerkingsdatumMap() {
  if (!BEWERKINGSDATUM_URL || BEWERKINGSDATUM_URL.includes("VUL-HIER")) return {};
  const key = "bewerkingsdatum_csv";
  try {
    const resp = await fetch(BEWERKINGSDATUM_URL, { cache: "no-store" });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const body = await resp.text();
    try { localStorage.setItem(key, body); } catch (e) {}
    return bewerkingsdatumRowsToMap(parseCsv(body));
  } catch (e) {
    const cached = localStorage.getItem(key);
    return cached ? bewerkingsdatumRowsToMap(parseCsv(cached)) : {};
  }
}

function bewerkingsdatumRowsToMap(rows) {
  const map = {};
  for (const row of rows) {
    const label = (row[0] || "").trim();
    const datum = (row[1] || "").trim();
    if (label && datum) map[label] = datum;
  }
  return map;
}

/**
 * Haalt één van de optionele "extra" home-tabbladen op (nieuws, ploeg, cup,
 * achttienen, checkout, sponsor), met dezelfde 30-min-cache als de rest.
 * Geeft null terug als er niets geconfigureerd is of niets opgehaald kon
 * worden (en er ook geen cache is) — de aanroeper toont dan gewoon niets.
 */
async function fetchExtraSheet(key, url, forceRefresh) {
  if (!urlGeconfigureerd(url)) return null;
  const cacheKey = `extra_${key}`;
  const tsKey = `extra_${key}_ts`;

  if (!forceRefresh) {
    const cached = localStorage.getItem(cacheKey);
    const laatsteFetch = Number(localStorage.getItem(tsKey) || -1);
    const geldigMillis = CACHE_GELDIGHEID_MINUTEN * 60000;
    if (cached !== null && laatsteFetch > 0 && Date.now() - laatsteFetch < geldigMillis) {
      return parseCsv(cached);
    }
  }

  try {
    const resp = await fetch(url, { cache: "no-store" });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const body = await resp.text();
    try {
      localStorage.setItem(cacheKey, body);
      localStorage.setItem(tsKey, String(Date.now()));
    } catch (e) { /* opslag kan falen; negeer stil */ }
    return parseCsv(body);
  } catch (e) {
    const cached = localStorage.getItem(cacheKey);
    return cached !== null ? parseCsv(cached) : null;
  }
}

function labelFor(type, reeks) {
  const typeNaam = type === "KALENDER" ? "Kalender" : "Rangschikking";
  return `${typeNaam} ${REEKS_LABEL[reeks]}`;
}

/* =========================================================================
 *  RENDERING - helpers
 * ========================================================================= */
function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) if (c) node.appendChild(c);
  return node;
}

function openModal(titel, bodyNode) {
  modalTitle.textContent = titel;
  modalBody.innerHTML = "";
  modalBody.appendChild(bodyNode);
  modalOverlay.classList.remove("hidden");
}
function closeModal() { modalOverlay.classList.add("hidden"); }

/* ---------- Kalenderweergave ---------- */
function renderWedstrijdRow(w, { clickable = true, showTijd = true, onSpelerClick = null } = {}) {
  const row = el("div", { class: "wedstrijd-row" });
  if (showTijd) row.appendChild(el("div", { class: "wedstrijd-tijd", text: w.tijd }));

  const handler = onSpelerClick || ((naam) => showSpelerDialog(naam, currentSpeeldagen));

  const maak = (naam, kant) => {
    if (clickable && naam) {
      return el("button", {
        class: `wedstrijd-speler ${kant} clickable`,
        text: naam,
        onclick: () => handler(naam)
      });
    }
    return el("div", { class: `wedstrijd-speler ${kant}`, text: naam });
  };

  row.appendChild(maak(w.speler1, "speler1"));
  row.appendChild(el("div", { class: "wedstrijd-score", text: `${w.score1} - ${w.score2}` }));
  row.appendChild(maak(w.speler2, "speler2"));
  return row;
}

function buildSpeeldagCard(sd, { onSpelerClick = null } = {}) {
  const card = el("div", { class: "speeldag-card" });
  const header = el("div", { class: "speeldag-header" }, [
    el("div", { class: "speeldag-titel", text: sd.titel }),
    sd.ronde ? el("div", { class: "speeldag-ronde", text: sd.ronde }) : null
  ]);
  card.appendChild(header);
  card.appendChild(el("hr", { class: "speeldag-divider" }));
  sd.wedstrijden.forEach((w, idx) => {
    card.appendChild(renderWedstrijdRow(w, { onSpelerClick }));
    if (idx !== sd.wedstrijden.length - 1) card.appendChild(el("hr", { class: "speeldag-divider" }));
  });
  return card;
}

function renderKalender(speeldagen) {
  kalenderView.innerHTML = "";
  if (speeldagen.length === 0) {
    kalenderView.appendChild(el("div", { class: "empty-state", text: "Geen gegevens gevonden." }));
    return;
  }
  const list = el("div", { class: "kalender-list" });
  speeldagen.forEach((sd) => list.appendChild(buildSpeeldagCard(sd)));
  kalenderView.appendChild(list);

  const idx = dichtstbijzijndeVerledenIndex(speeldagen);
  if (idx >= 0) {
    requestAnimationFrame(() => {
      const cards = list.children;
      if (cards[idx]) cards[idx].scrollIntoView({ block: "start" });
    });
  }
}

function showSpelerDialog(naam, speeldagen) {
  const groepen = (speeldagen || currentSpeeldagen)
    .map((sd) => ({ sd, matches: sd.wedstrijden.filter((w) => w.speler1 === naam || w.speler2 === naam) }))
    .filter((g) => g.matches.length > 0);

  const body = el("div");
  if (groepen.length === 0) {
    body.appendChild(el("div", { text: "Geen wedstrijden gevonden voor deze speler." }));
  } else {
    groepen.forEach((g) => {
      body.appendChild(el("div", { class: "detail-groep-titel", text: g.sd.titel }));
      g.matches.forEach((w) => body.appendChild(renderWedstrijdRow(w, { clickable: false })));
    });
  }
  openModal(naam, body);
}

/* ---------- Rangschikkingweergave ---------- */
function renderGenericTable(rows) {
  rangschikkingView.innerHTML = "";
  if (rows.length === 0) {
    rangschikkingView.appendChild(el("div", { class: "empty-state", text: "Geen gegevens gevonden." }));
    return;
  }
  const header = rows[0];
  const body = rows.slice(1);
  const table = el("table", { class: "data-table" });
  const thead = el("thead", {}, el("tr", {}, header.map((h) => el("th", { text: h }))));
  const tbody = el("tbody");
  body.forEach((r) => {
    tbody.appendChild(el("tr", {}, header.map((_, i) => el("td", { text: r[i] || "" }))));
  });
  table.appendChild(thead);
  table.appendChild(tbody);
  rangschikkingView.appendChild(table);
}

function renderRangschikking(rows) {
  rangschikkingView.innerHTML = "";
  if (rows.length === 0) {
    rangschikkingView.appendChild(el("div", { class: "empty-state", text: "Geen gegevens gevonden." }));
    return;
  }
  const header = rows[0];
  const body = rows.slice(1);

  const kolomIndices = ZICHTBARE_KOLOMMEN
    .map((kol) => {
      const idx = header.findIndex((h) => h.trim().toLowerCase() === kol.naam.toLowerCase());
      return idx >= 0 ? { idx, naam: kol.naam, label: kol.label } : null;
    })
    .filter(Boolean);

  if (kolomIndices.length === 0) {
    renderGenericTable(rows);
    return;
  }

  const spelerPos = kolomIndices.findIndex((k) => k.naam.toLowerCase() === "speler");

  const table = el("table", { class: "data-table" });
  const thead = el("thead", {}, el("tr", {}, kolomIndices.map((k) => {
    const breedte = KOLOM_BREEDTE[k.naam];
    return el("th", breedte ? { text: k.label, style: `width: ${breedte}` } : { text: k.label });
  })));
  const tbody = el("tbody");
  body.forEach((row) => {
    const tr = el("tr");
    kolomIndices.forEach((k, i) => {
      const waarde = row[k.idx] || "";
      if (i === spelerPos) {
        tr.appendChild(el("td", {
          class: "speler-cell",
          text: waarde,
          onclick: () => showSpelerDetail(header, row)
        }));
      } else {
        tr.appendChild(el("td", { text: waarde }));
      }
    });
    tbody.appendChild(tr);
  });
  table.appendChild(thead);
  table.appendChild(tbody);
  rangschikkingView.appendChild(table);
}

function showSpelerDetail(header, row) {
  const spelerIdx = header.findIndex((h) => h.trim().toLowerCase() === "speler");
  const titel = (row[spelerIdx] || "").trim() || "Spelerdetail";

  const body = el("div");
  header.forEach((label, i) => {
    if (!label.trim()) return;
    body.appendChild(el("div", { class: "detail-row" }, [
      el("div", { class: "detail-label", text: label }),
      el("div", { text: row[i] || "" })
    ]));
  });
  openModal(titel, body);
}

/* =========================================================================
 *  HOME — "Volgende speeldag"
 * ========================================================================= */
function vandaagStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Eerstvolgende speeldag (datum >= vandaag) uit een lijst speeldagen, of null. */
function volgendeSpeeldag(speeldagen) {
  const vandaag = vandaagStart();
  let beste = null;
  for (const sd of speeldagen) {
    if (!sd.datum) continue;
    if (sd.datum >= vandaag && (!beste || sd.datum < beste.datum)) beste = sd;
  }
  return beste;
}

/** "A-Reeks" / "A en B-Reeks" / "A, B en C-Reeks" */
function formatReeksLijst(letters) {
  if (letters.length === 1) return `${letters[0]}-Reeks`;
  const laatste = letters[letters.length - 1];
  const rest = letters.slice(0, -1);
  return `${rest.join(", ")} en ${laatste}-Reeks`;
}

const DAGNAMEN = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];

/** bv. "vrijdag 04/09/2026" */
function formatDagDatum(datum) {
  const dag = DAGNAMEN[datum.getDay()];
  const p = (n) => String(n).padStart(2, "0");
  return `${dag} ${p(datum.getDate())}/${p(datum.getMonth() + 1)}/${datum.getFullYear()}`;
}

/* =========================================================================
 *  HOME — optionele secties (nieuws, ploeg, cup, records, sponsor)
 * ========================================================================= */

/** Nieuws: kopregel Datum,Titel,Tekst,Link(optioneel). Nieuwste eerst. */
function parseNieuws(rows) {
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => (h || "").trim().toLowerCase());
  const iDatum = header.indexOf("datum");
  const iTitel = header.indexOf("titel");
  const iTekst = header.indexOf("tekst");
  const iLink = header.indexOf("link");

  const items = rows.slice(1).map((row) => ({
    datum: iDatum >= 0 ? (row[iDatum] || "").trim() : "",
    titel: iTitel >= 0 ? (row[iTitel] || "").trim() : "",
    tekst: iTekst >= 0 ? (row[iTekst] || "").trim() : "",
    link: iLink >= 0 ? (row[iLink] || "").trim() : ""
  })).filter((n) => n.titel);

  items.sort((a, b) => {
    const da = extractDatum(a.datum);
    const db = extractDatum(b.datum);
    if (da && db) return db - da;
    return 0;
  });
  return items;
}

/**
 * Haalt uit de RAUWE rijen van een rangschikking-sheet (header + data) de
 * Speler-naam, hoogste uitworp (kolom Q) en aantal 180's (kolom R). Werkt
 * puur op kolompositie (niet op headertekst), zoals gevraagd.
 */
function parseRankingExtra(rows) {
  if (rows.length === 0) return [];
  const header = rows[0];
  const iSpeler = header.findIndex((h) => (h || "").trim().toLowerCase() === "speler");

  return rows.slice(1)
    .map((row) => {
      const speler = (iSpeler >= 0 ? row[iSpeler] : row[1]) || "";
      const checkoutRaw = (row[RANKING_KOLOM.checkout] || "").trim().replace(",", ".");
      const achttienenRaw = (row[RANKING_KOLOM.achttienen] || "").trim().replace(",", ".");
      const checkout = checkoutRaw === "" ? null : Number(checkoutRaw);
      const achttienen = achttienenRaw === "" ? null : Number(achttienenRaw);
      return {
        speler: speler.trim(),
        checkout: checkout !== null && !isNaN(checkout) ? checkout : null,
        achttienen: achttienen !== null && !isNaN(achttienen) ? achttienen : null
      };
    })
    .filter((r) => r.speler);
}

/**
 * Haalt Plaats + Speler op uit een rangschikking-sheet, gesorteerd op
 * Plaats (oplopend). Gebruikt voor de Rankings-kaart (top 3 + rode
 * lantaarn per reeks). Werkt op kolomtitel (net als de rest van de app).
 */
function parseReeksRanking(rows) {
  if (rows.length === 0) return [];
  const header = rows[0];
  const iPlaats = header.findIndex((h) => (h || "").trim().toLowerCase() === "plaats");
  const iSpeler = header.findIndex((h) => (h || "").trim().toLowerCase() === "speler");
  if (iPlaats < 0 || iSpeler < 0) return [];

  return rows.slice(1)
    .map((row) => ({
      plaats: Number((row[iPlaats] || "").trim()),
      speler: (row[iSpeler] || "").trim(),
      // Kolom C (index 2) = aantal gespeelde wedstrijden, voor tussenstand/eindstand.
      totaal: Number((row[2] || "").trim())
    }))
    .filter((r) => r.speler && !isNaN(r.plaats))
    .sort((a, b) => a.plaats - b.plaats);
}

/**
 * Groepeert spelers per podiumrang op basis van [veld]: alle spelers met
 * exact dezelfde (hoogste 3 verschillende) waarden komen samen in dezelfde
 * groep terecht — bv. 2 spelers met evenveel 180's staan dus allebei op
 * podiumplaats 1. Geeft de top 3 groepen terug (dalend op waarde), elk als
 * { waarde, spelers: [...] }.
 */
function top3Groepen(spelers, veld) {
  const metWaarde = spelers.filter((s) => s[veld] !== null);

  const groepenPerWaarde = new Map();
  metWaarde.forEach((s) => {
    const key = s[veld];
    if (!groepenPerWaarde.has(key)) groepenPerWaarde.set(key, []);
    groepenPerWaarde.get(key).push(s);
  });

  return [...groepenPerWaarde.entries()]
    .sort((a, b) => b[0] - a[0])
    .slice(0, 3)
    .map(([waarde, spelersInGroep]) => ({ waarde, spelers: spelersInGroep }));
}

/** Sponsors: kopregel Naam,Tekst,Website,Afbeelding. Geeft ALLE rijen met een Naam terug (in sheet-volgorde). */
function parseSponsors(rows) {
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => (h || "").trim().toLowerCase());
  const iNaam = header.indexOf("naam");
  const iTekst = header.indexOf("tekst");
  const iWebsite = header.indexOf("website");
  const iAfb = header.indexOf("afbeelding");

  return rows.slice(1)
    .map((row) => ({
      naam: iNaam >= 0 ? (row[iNaam] || "").trim() : "",
      tekst: iTekst >= 0 ? (row[iTekst] || "").trim() : "",
      website: iWebsite >= 0 ? (row[iWebsite] || "").trim() : "",
      afbeelding: iAfb >= 0 ? (row[iAfb] || "").trim() : ""
    }))
    .filter((s) => s.naam);
}

/**
 * Kiest deterministisch "de sponsor van de week" uit de lijst: iedereen die
 * de app opent in dezelfde kalenderweek ziet dezelfde sponsor, en de week
 * erna schuift het door naar de volgende (met terugkeer naar het begin
 * zodra de lijst doorlopen is). Geen opslag/instelling nodig — puur op
 * basis van de huidige datum, dus werkt ook meteen offline correct.
 */
function kiesSponsorVanDeWeek(sponsors) {
  if (sponsors.length === 0) return null;
  const weekIndex = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  return sponsors[weekIndex % sponsors.length];
}

/** Een uitklapbaar kaartje: dichtgeklapt toont het enkel titel + samenvatting. */
function buildAccordionCard(titel, samenvatting, bodyNode, {
  icoon = "",
  samenvattingKlasse = "accordion-samenvatting",
  chevronKlasse = "accordion-chevron accordion-chevron-groot",
  titelKlasse = "accordion-titel"
} = {}) {
  const card = el("div", { class: "accordion-card" });
  const header = el("button", { class: "accordion-header", type: "button" });

  const titelblok = el("div", { class: "accordion-titelblok" });
  titelblok.appendChild(el("div", { class: titelKlasse, text: icoon ? `${icoon} ${titel}` : titel }));
  const samenvattingEl = samenvatting ? el("div", { class: samenvattingKlasse, text: samenvatting }) : null;
  if (samenvattingEl) titelblok.appendChild(samenvattingEl);
  header.appendChild(titelblok);

  const chevron = el("span", { class: chevronKlasse, text: "\u25BE" });
  header.appendChild(chevron);

  const body = el("div", { class: "accordion-body hidden" }, [bodyNode]);

  header.addEventListener("click", () => {
    body.classList.toggle("hidden");
    chevron.classList.toggle("open");
    // De samenvatting (bv. titel van het eerste bericht) verdwijnt zodra
    // het kaartje openstaat, want dat zou dubbel zijn met de inhoud eronder.
    if (samenvattingEl) samenvattingEl.classList.toggle("hidden");
  });

  card.appendChild(header);
  card.appendChild(body);
  return card;
}

function buildNieuwsBody(items) {
  const wrap = el("div");
  const tonen = items.slice(0, 5);
  tonen.forEach((n, i) => {
    const item = el("div", { class: "nieuws-item" });
    const kop = el("div", { class: "nieuws-kop" });
    kop.appendChild(el("span", { class: "nieuws-titel", text: n.titel }));
    if (n.datum) kop.appendChild(el("span", { class: "nieuws-datum", text: n.datum }));
    item.appendChild(kop);
    if (n.tekst) item.appendChild(el("div", { class: "nieuws-tekst", text: n.tekst }));
    if (n.link) {
      item.appendChild(el("a", {
        class: "nieuws-link", text: "Bekijk het volledige bericht op onze Facebookpagina \u2192",
        href: n.link, target: "_blank", rel: "noopener"
      }));
    }
    wrap.appendChild(item);
    if (i !== tonen.length - 1) wrap.appendChild(el("hr", { class: "speeldag-divider" }));
  });
  return wrap;
}

function buildLabelWaardeBody(map, volgordeKeys) {
  const wrap = el("div");
  volgordeKeys.forEach((key) => {
    if (map[key]) {
      wrap.appendChild(el("div", { class: "detail-row" }, [
        el("div", { class: "detail-label", text: key }),
        el("div", { text: map[key] })
      ]));
    }
  });
  return wrap;
}

/** Bouwt een podium (1e boven, 2e links-onder, 3e rechts-onder) voor top-3-groepen. */
function buildPodium(groepen, eenheid) {
  const podium = el("div", { class: "podium" });
  if (groepen.length === 0) {
    podium.appendChild(el("div", { class: "empty-state", text: "Nog geen gegevens." }));
    return podium;
  }

  const plek = (groep, rang) => {
    const kaart = el("div", { class: `podium-plek podium-plek-${rang}` });
    kaart.appendChild(el("div", { class: "podium-medaille", text: rang === 1 ? "🥇" : rang === 2 ? "🥈" : "🥉" }));
    const namenWrap = el("div", { class: "podium-namen" });
    groep.spelers.forEach((s) => namenWrap.appendChild(el("div", { class: "podium-naam", text: s.speler })));
    kaart.appendChild(namenWrap);
    kaart.appendChild(el("div", { class: "podium-waarde", text: `${groep.waarde}${eenheid}` }));
    return kaart;
  };

  const boven = el("div", { class: "podium-boven" });
  boven.appendChild(plek(groepen[0], 1));
  podium.appendChild(boven);

  if (groepen.length > 1) {
    const onder = el("div", { class: "podium-onder" });
    onder.appendChild(plek(groepen[1], 2));
    if (groepen.length > 2) onder.appendChild(plek(groepen[2], 3));
    podium.appendChild(onder);
  }

  return podium;
}

/** Zelfde podiumvorm als buildPodium, maar enkel medaille + naam (geen waarderegel). */
/** Eenvoudige oplijsting i.p.v. podium: medaille + volledige naam, onder elkaar. */
function buildReeksLijst(top3Lijst) {
  const lijst = el("div", { class: "ranking-lijst" });
  top3Lijst.forEach((persoon, i) => {
    const rang = i + 1;
    const item = el("div", { class: "ranking-lijst-item" });
    item.appendChild(el("span", {
      class: "ranking-lijst-medaille",
      text: rang === 1 ? "🥇" : rang === 2 ? "🥈" : "🥉"
    }));
    item.appendChild(el("span", { class: "ranking-lijst-naam", text: persoon.speler }));
    lijst.appendChild(item);
  });
  return lijst;
}

function ploegSamenvatting(map) {
  if (map["Volgende wedstrijd"] && map["Volgende wedstrijd datum"]) {
    return `Volgende: ${map["Volgende wedstrijd"]} (${map["Volgende wedstrijd datum"]})`;
  }
  if (map["Ranking"]) return `Ranking: ${map["Ranking"]}`;
  return "Tik voor details";
}

function cupSamenvatting(map) {
  if (map["Volgende datum"]) return `Volgende CUP: ${map["Volgende datum"]}`;
  return "Tik voor details";
}

function buildSponsorBanner(sponsor) {
  const banner = el("div", { class: "sponsor-banner" });
  banner.appendChild(el("div", { class: "sponsor-label", text: "Sponsor van de week" }));

  const content = el("div", { class: "sponsor-content" });
  if (sponsor.afbeelding) {
    content.appendChild(el("img", { class: "sponsor-logo", src: sponsor.afbeelding, alt: sponsor.naam }));
  }
  const tekstBlok = el("div", { class: "sponsor-tekst-blok" });
  tekstBlok.appendChild(el("div", { class: "sponsor-naam", text: sponsor.naam }));
  if (sponsor.tekst) tekstBlok.appendChild(el("div", { class: "sponsor-tekst", text: sponsor.tekst }));
  content.appendChild(tekstBlok);
  banner.appendChild(content);

  if (sponsor.website) {
    banner.appendChild(el("a", {
      class: "sponsor-link", text: "Volg deze link voor meer informatie \u2192",
      href: sponsor.website, target: "_blank", rel: "noopener"
    }));
  }
  return banner;
}

async function loadHome(forceRefresh) {
  errorBanner.classList.add("hidden");
  refreshBtn.classList.toggle("spinning", true);

  const heeftAlInhoud = homeView.querySelector(".home-content");
  if (!heeftAlInhoud) loadingEl.classList.remove("hidden");

  // Kalender van elke reeks ophalen (gebruikt dezelfde 30-min-cache).
  const perReeks = {};
  const fouten = [];
  await Promise.all(REEKSEN.map(async (r) => {
    const result = await fetchSheet("KALENDER", r, forceRefresh);
    if (!result.ok) fouten.push(result.message);
    perReeks[r] = parseKalender(result.rows);
  }));

  // Rangschikking van elke reeks ophalen: nodig voor zowel Nevenklassementen
  // (checkout/180's, club-breed) als de Rankings-kaart (top 3 per reeks).
  const rangschikkingPerReeks = {};
  await Promise.all(REEKSEN.map(async (r) => {
    const result = await fetchSheet("RANGSCHIKKING", r, forceRefresh);
    rangschikkingPerReeks[r] = result.ok ? result.rows : [];
  }));
  let alleSpelersRanking = [];
  REEKSEN.forEach((r) => {
    alleSpelersRanking = alleSpelersRanking.concat(parseRankingExtra(rangschikkingPerReeks[r]));
  });

  // Optionele extra secties ophalen (enkel wat geconfigureerd is).
  const extra = {};
  await Promise.all(Object.entries(EXTRA_URLS).map(async ([key, url]) => {
    extra[key] = await fetchExtraSheet(key, url, forceRefresh);
  }));

  loadingEl.classList.add("hidden");
  refreshBtn.classList.remove("spinning");

  if (fouten.length > 0) {
    errorBanner.textContent = fouten[0];
    errorBanner.classList.remove("hidden");
  }

  renderHome(perReeks, extra, alleSpelersRanking, rangschikkingPerReeks);
}

function renderHome(perReeks, extra, alleSpelersRanking, rangschikkingPerReeks) {
  homeView.innerHTML = "";
  const wrap = el("div", { class: "home-content" });

    // ---------- Sponsorbanner (altijd bovenaan, geen accordion) ----------
  if (extra.sponsor) {
    const sponsor = kiesSponsorVanDeWeek(parseSponsors(extra.sponsor));
    if (sponsor) wrap.appendChild(buildSponsorBanner(sponsor));
  }

  // ---------- Uitklapbare kaartjes bovenaan: nieuws ----------
  const kaartenboven = el("div", { class: "home-kaarten" });

  if (extra.nieuws) {
    const items = parseNieuws(extra.nieuws);
    if (items.length > 0) {
      kaartenboven.appendChild(buildAccordionCard(
        "Laatste nieuws", items[0].titel, buildNieuwsBody(items),
        {
          icoon: "📰",
          samenvattingKlasse: "nieuws-samenvatting-titel"
        }
      ));
    }
  }

  if (kaartenboven.children.length > 0) wrap.appendChild(kaartenboven);

  // ---------- Hero: "Volgende speeldag" (zelfde kaartstijl als de sponsorbanner) ----------
  const kandidaten = REEKSEN
    .map((r) => ({ reeks: r, sd: volgendeSpeeldag(perReeks[r] || []) }))
    .filter((k) => k.sd !== null);

  if (kandidaten.length === 0) {
    const banner = el("div", { class: "vs-banner" });
    banner.appendChild(el("div", { class: "vs-label", text: "Volgende speeldag" }));
    banner.appendChild(el("div", { class: "empty-state", text: "Geen aankomende speeldag gevonden." }));
    wrap.appendChild(banner);
  } else {
    // De vroegste datum onder al die reeksen = "de" volgende speeldag.
    const vroegsteDatum = kandidaten.reduce((min, k) => (k.sd.datum < min ? k.sd.datum : min), kandidaten[0].sd.datum);
    const groep = kandidaten.filter((k) => k.sd.datum.getTime() === vroegsteDatum.getTime());

    const banner = el("div", { class: "vs-banner" });
    banner.appendChild(el("div", { class: "vs-label", text: "Volgende speeldag" }));
    banner.appendChild(el("div", {
      class: "vs-datum",
      text: `${formatDagDatum(vroegsteDatum)}: ${formatReeksLijst(groep.map((k) => k.reeks))}`
    }));

    groep.forEach((k, i) => {
      if (i !== 0) banner.appendChild(el("hr", { class: "speeldag-divider" }));
      const groepBlok = el("div", { class: "vs-reeks-groep" });
      groepBlok.appendChild(el("div", { class: "home-reeks-tag", text: REEKS_LABEL[k.reeks] }));
      k.sd.wedstrijden.forEach((w, idx) => {
        groepBlok.appendChild(renderWedstrijdRow(w, {
          onSpelerClick: (naam) => showSpelerDialog(naam, perReeks[k.reeks])
        }));
        if (idx !== k.sd.wedstrijden.length - 1) groepBlok.appendChild(el("hr", { class: "speeldag-divider" }));
      });
      banner.appendChild(groepBlok);
    });

    wrap.appendChild(banner);
  }

  // ---------- Uitklapbare kaartjes onderaan: ploeg, cup, records ----------
  const kaarten = el("div", { class: "home-kaarten" });

  if (extra.ploeg) {
    const map = bewerkingsdatumRowsToMap(extra.ploeg);
    if (Object.keys(map).length > 0) {
      kaarten.appendChild(buildAccordionCard(
        "Sperrepelkesploeg",
        ploegSamenvatting(map),
        buildLabelWaardeBody(map, [
          "Laatste wedstrijd", "Laatste wedstrijd datum", "Laatste wedstrijd uitslag",
          "Volgende wedstrijd", "Volgende wedstrijd datum", "Ranking"
        ]),
        { icoon: "🏆" }
      ));
    }
  }

  if (extra.cup) {
    const map = bewerkingsdatumRowsToMap(extra.cup);
    if (Object.keys(map).length > 0) {
      kaarten.appendChild(buildAccordionCard(
        "Sperrepelkes CUP",
        cupSamenvatting(map),
        buildLabelWaardeBody(map, ["Volgende datum", "Locatie", "Info"]),
        { icoon: "🏅" }
      ));
    }
  }

  {
    const checkoutGroepen = top3Groepen(alleSpelersRanking, "checkout");
    const achttienenGroepen = top3Groepen(alleSpelersRanking, "achttienen");

    if (checkoutGroepen.length > 0 || achttienenGroepen.length > 0) {
      const body = el("div");

      if (checkoutGroepen.length > 0) {
        // Niet-brekende spatie tussen "Checkout" en "Championship": die twee
        // woorden blijven zo altijd samen, ook als de titel moet afbreken.
        body.appendChild(el("div", {
          class: "ranking-sectie-titel",
          text: "Proxy Delhaize Bambrugge Checkout\u00A0Championship"
        }));
        body.appendChild(el("div", {
          class: "ranking-sectie-uitleg",
          text: "Dit klassement rangschikt de spelers op basis van hun hoogste uitworp."
        }));
        body.appendChild(buildPodium(checkoutGroepen, ""));
      }

      if (achttienenGroepen.length > 0) {
        if (checkoutGroepen.length > 0) body.appendChild(el("hr", { class: "speeldag-divider" }));
        body.appendChild(el("div", { class: "ranking-sectie-titel", text: "Brouwerij Huyghe 180-Trophy" }));
        body.appendChild(el("div", {
          class: "ranking-sectie-uitleg",
          text: "Dit klassement rangschikt alle spelers die een 180 hebben gegooid."
        }));
        body.appendChild(buildPodium(achttienenGroepen, "x"));
      }

      kaarten.appendChild(buildAccordionCard(
        "Nevenklassementen", "", body,
        { icoon: "🏆", titelKlasse: "accordion-titel accordion-titel-groot-gecentreerd" }
      ));
    }
  }

  // ---------- Rankings: top 3 per reeks + rode lantaarn ----------
  {
    const reeksBlokken = REEKSEN
      .map((r) => {
        const lijst = parseReeksRanking(rangschikkingPerReeks[r] || []);
        if (lijst.length === 0) return null;
        const laatste = lijst.reduce((max, cur) => (cur.plaats > max.plaats ? cur : max), lijst[0]);
        const eindstand = lijst.every((s) => !isNaN(s.totaal) && s.totaal >= 15);
        return { reeks: r, top3: lijst.slice(0, 3), laatste, eindstand };
      })
      .filter(Boolean);

    if (reeksBlokken.length > 0) {
      const body = el("div");

      reeksBlokken.forEach((blok, i) => {
        if (i !== 0) body.appendChild(el("hr", { class: "speeldag-divider" }));
        const titelTekst = `${blok.reeks}-Reeks - ${blok.eindstand ? "eindstand" : "tussenstand"} podium`;
        body.appendChild(el("div", { class: "ranking-sectie-titel", text: titelTekst }));
        body.appendChild(buildReeksLijst(blok.top3));

        const lantaarn = el("div", { class: "rode-lantaarn" });
        lantaarn.appendChild(el("span", { class: "rode-lantaarn-icoon", text: "🏮" }));
        lantaarn.appendChild(el("span", { class: "rode-lantaarn-tekst" }, [
          el("span", { text: "De Rode Lantaarn: " }),
          el("span", { class: "rode-lantaarn-naam", text: blok.laatste.speler })
        ]));
        body.appendChild(lantaarn);

        body.appendChild(el("a", {
          class: "rankings-link",
          text: "Bekijk hier de volledige ranking",
          href: "#",
          onclick: (e) => { e.preventDefault(); gaNaarRangschikkingReeks(blok.reeks); }
        }));
      });

      kaarten.appendChild(buildAccordionCard(
        "Rankings", "", body,
        { icoon: "🏅", titelKlasse: "accordion-titel accordion-titel-groot-gecentreerd" }
      ));
    }
  }

  if (kaarten.children.length > 0) wrap.appendChild(kaarten);

  homeView.appendChild(wrap);
}

/* =========================================================================
 *  APP STATE & CONTROLLER
 * ========================================================================= */
const kalenderView = document.getElementById("kalenderView");
const rangschikkingView = document.getElementById("rangschikkingView");
const homeView = document.getElementById("homeView");
const contentToolbar = document.getElementById("contentToolbar");
const loadingEl = document.getElementById("loading");
const errorBanner = document.getElementById("errorBanner");
const bewerkingsdatumEl = document.getElementById("bewerkingsdatum");
const refreshBtn = document.getElementById("refreshBtn");
const reeksTabsEl = document.getElementById("reeksTabs");
const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const modalClose = document.getElementById("modalClose");

let currentSection = "home"; // 'home' | 'kalender' | 'rangschikking'
let currentReeks = "A";
let currentSpeeldagen = [];
let bewerkingsdatumMap = {};

modalClose.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => { if (e.target === modalOverlay) closeModal(); });

REEKSEN.forEach((r) => {
  reeksTabsEl.appendChild(el("button", {
    text: REEKS_LABEL[r],
    role: "tab",
    onclick: () => { currentReeks = r; updateReeksTabs(); load(false); }
  }));
});
function updateReeksTabs() {
  [...reeksTabsEl.children].forEach((btn, i) => btn.classList.toggle("active", REEKSEN[i] === currentReeks));
}
updateReeksTabs();

function wisselSectie(sectie) {
  currentSection = sectie;
  document.querySelectorAll(".nav-item").forEach((b) => b.classList.toggle("active", b.dataset.section === sectie));

  homeView.classList.toggle("hidden", currentSection !== "home");
  kalenderView.classList.toggle("hidden", currentSection !== "kalender");
  rangschikkingView.classList.toggle("hidden", currentSection !== "rangschikking");

  const isHome = currentSection === "home";
  reeksTabsEl.classList.toggle("hidden", isHome);
  bewerkingsdatumEl.classList.toggle("hidden", isHome);
  refreshBtn.classList.toggle("hidden", isHome && !TOON_VERVERSKNOP_HOME);
  errorBanner.classList.add("hidden");

  if (isHome) {
    loadHome(false);
  } else {
    load(false);
  }
}

/** Springt vanaf Home rechtstreeks naar de Rangschikking-tab van een specifieke reeks. */
function gaNaarRangschikkingReeks(reeks) {
  currentReeks = reeks;
  updateReeksTabs();
  wisselSectie("rangschikking");
}

document.querySelectorAll(".nav-item").forEach((btn) => {
  btn.addEventListener("click", () => wisselSectie(btn.dataset.section));
});

refreshBtn.addEventListener("click", () => {
  if (currentSection === "home") {
    loadHome(true);
  } else {
    load(true);
  }
});

async function load(forceRefresh) {
  const type = currentSection === "kalender" ? "KALENDER" : "RANGSCHIKKING";
  const reeks = currentReeks;

  errorBanner.classList.add("hidden");
  refreshBtn.classList.toggle("spinning", true);

  const hasContentAlready =
    (type === "KALENDER" && kalenderView.querySelector(".kalender-list")) ||
    (type === "RANGSCHIKKING" && rangschikkingView.querySelector("table"));
  if (!hasContentAlready) loadingEl.classList.remove("hidden");

  const result = await fetchSheet(type, reeks, forceRefresh);

  loadingEl.classList.add("hidden");
  refreshBtn.classList.remove("spinning");

  if (!result.ok) {
    errorBanner.textContent = result.message;
    errorBanner.classList.remove("hidden");
  }

  const label = labelFor(type, reeks);
  bewerkingsdatumEl.textContent = `Laatst gewijzigd: ${bewerkingsdatumMap[label] || "onbekend"}`;

  if (type === "KALENDER") {
    currentSpeeldagen = parseKalender(result.rows);
    renderKalender(currentSpeeldagen);
  } else {
    renderRangschikking(result.rows);
  }
}

async function init() {
  document.getElementById("clubNaam").textContent = CLUB_NAAM;
  document.title = CLUB_NAAM;
  homeView.classList.remove("hidden");
  refreshBtn.classList.toggle("hidden", !TOON_VERVERSKNOP_HOME);

  bewerkingsdatumMap = await fetchBewerkingsdatumMap();
  await loadHome(false);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

init();

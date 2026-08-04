"use strict";

/* =========================================================================
 *  CONFIGURATIE
 *  Zelfde "Publiceren op web" CSV-links als in de Android-app. Pas hier aan
 *  als je sheet-links wijzigen. Zie het Android-project (AppConfig.kt) voor
 *  uitleg hoe je die links maakt.
 * ========================================================================= */
const CLUB_NAAM = "Dartsclub De Sperrepelkes";
const CACHE_GELDIGHEID_MINUTEN = 30;

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

const ZICHTBARE_KOLOMMEN = ["Plaats", "Speler", "Gewonnen", "Verloren", "Leg winst %", "Punten"];

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
function renderWedstrijdRow(w, { clickable = true, showTijd = true } = {}) {
  const row = el("div", { class: "wedstrijd-row" });
  if (showTijd) row.appendChild(el("div", { class: "wedstrijd-tijd", text: w.tijd }));

  const maak = (naam, kant) => {
    if (clickable && naam) {
      return el("button", {
        class: `wedstrijd-speler ${kant} clickable`,
        text: naam,
        onclick: () => showSpelerDialog(naam)
      });
    }
    return el("div", { class: `wedstrijd-speler ${kant}`, text: naam });
  };

  row.appendChild(maak(w.speler1, "speler1"));
  row.appendChild(el("div", { class: "wedstrijd-score", text: `${w.score1} - ${w.score2}` }));
  row.appendChild(maak(w.speler2, "speler2"));
  return row;
}

function renderKalender(speeldagen) {
  kalenderView.innerHTML = "";
  if (speeldagen.length === 0) {
    kalenderView.appendChild(el("div", { class: "empty-state", text: "Geen gegevens gevonden." }));
    return;
  }
  const list = el("div", { class: "kalender-list" });
  speeldagen.forEach((sd) => {
    const card = el("div", { class: "speeldag-card" });
    const header = el("div", { class: "speeldag-header" }, [
      el("div", { class: "speeldag-titel", text: sd.titel }),
      sd.ronde ? el("div", { class: "speeldag-ronde", text: sd.ronde }) : null
    ]);
    card.appendChild(header);
    card.appendChild(el("hr", { class: "speeldag-divider" }));
    sd.wedstrijden.forEach((w, idx) => {
      card.appendChild(renderWedstrijdRow(w));
      if (idx !== sd.wedstrijden.length - 1) card.appendChild(el("hr", { class: "speeldag-divider" }));
    });
    list.appendChild(card);
  });
  kalenderView.appendChild(list);

  const idx = dichtstbijzijndeVerledenIndex(speeldagen);
  if (idx >= 0) {
    requestAnimationFrame(() => {
      const cards = list.children;
      if (cards[idx]) cards[idx].scrollIntoView({ block: "start" });
    });
  }
}

function showSpelerDialog(naam) {
  const groepen = currentSpeeldagen
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
    .map((naam) => {
      const idx = header.findIndex((h) => h.trim().toLowerCase() === naam.toLowerCase());
      return idx >= 0 ? { idx, naam } : null;
    })
    .filter(Boolean);

  if (kolomIndices.length === 0) {
    renderGenericTable(rows);
    return;
  }

  const spelerPos = kolomIndices.findIndex((k) => k.naam.toLowerCase() === "speler");

  const table = el("table", { class: "data-table" });
  const thead = el("thead", {}, el("tr", {}, kolomIndices.map((k) => el("th", { text: k.naam }))));
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
 *  APP STATE & CONTROLLER
 * ========================================================================= */
const kalenderView = document.getElementById("kalenderView");
const rangschikkingView = document.getElementById("rangschikkingView");
const loadingEl = document.getElementById("loading");
const errorBanner = document.getElementById("errorBanner");
const bewerkingsdatumEl = document.getElementById("bewerkingsdatum");
const refreshBtn = document.getElementById("refreshBtn");
const reeksTabsEl = document.getElementById("reeksTabs");
const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const modalClose = document.getElementById("modalClose");

let currentSection = "kalender"; // 'kalender' | 'rangschikking'
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

document.querySelectorAll(".nav-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentSection = btn.dataset.section;
    document.querySelectorAll(".nav-item").forEach((b) => b.classList.toggle("active", b === btn));
    kalenderView.classList.toggle("hidden", currentSection !== "kalender");
    rangschikkingView.classList.toggle("hidden", currentSection !== "rangschikking");
    load(false);
  });
});

refreshBtn.addEventListener("click", () => load(true));

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
  kalenderView.classList.remove("hidden");

  bewerkingsdatumMap = await fetchBewerkingsdatumMap();
  await load(false);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

init();

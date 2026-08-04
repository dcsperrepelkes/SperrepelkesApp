# Dartsclub De Sperrepelkes — Progressive Web App

Dit is de PWA-versie van de Android-app. Zelfde functionaliteit:

- **Kalender**: speeldagen als kaartjes, automatisch gescrold naar de meest
  recente speeldag t.o.v. vandaag. Tik op een spelernaam voor al diens
  wedstrijden.
- **Rangschikking**: tabel met Plaats, Speler, Gewonnen, Verloren,
  Leg winst % en Punten. Tik op een speler voor alle kolommen (incl. de
  kolommen die niet in de hoofdtabel staan).
- Reeks A / B / C / D als tabs bovenaan.
- Zelfde Google Sheets CSV-links als de Android-app (uit `AppConfig.kt`,
  aangepast in `js/app.js` bovenaan onder `URLS`).
- "Laatst gewijzigd"-datum per tab (bewerkingsdatum-tabblad).
- Cache van 30 minuten (net als de Android-app), met een handmatige
  vernieuwknop die de cache negeert.
- Werkt offline met de laatst opgehaalde gegevens.
- Installeerbaar op het startscherm (Android, iOS, desktop) via de browser.

## Bestanden

```
index.html       - app-shell / layout
css/style.css     - groene huisstijl (licht + donker thema)
js/app.js         - configuratie, CSV/kalender-parsers, data ophalen, weergave
manifest.json     - PWA-manifest (naam, iconen, kleuren)
sw.js             - service worker voor offline app-shell
icons/            - app-iconen (overgenomen uit de Android-launchericonen)
```

## Hosten

Dit is een volledig statische site: geen build-stap, geen server-side code
nodig. Zet de hele map op een willekeurige statische host, bv.:

- **GitHub Pages** (gratis, ideaal voor een clubje)
- **Netlify** / **Vercel** (sleep de map naar hun dashboard)
- **Firebase Hosting**
- Je eigen webserver (Apache/Nginx) — gewoon de map kopiëren

Belangrijk: **PWA's vereisen HTTPS** (behalve op `localhost` tijdens
testen). Alle bovenstaande gratis hosts leveren dat standaard.

### Lokaal testen

```bash
cd DartsClubApp-PWA
python3 -m http.server 8000
# open http://localhost:8000 in de browser
```

## Configuratie aanpassen

Open `js/app.js` en pas de constanten bovenaan aan:

- `CLUB_NAAM` — titel in de topbalk
- `URLS.KALENDER.A/B/C/D` en `URLS.RANGSCHIKKING.A/B/C/D` — je CSV-links
  ("Bestand > Delen > Publiceren op web" in Google Sheets, per tabblad)
- `BEWERKINGSDATUM_URL` — CSV-link van het "bewerkingsdatum"-tabblad
- `CACHE_GELDIGHEID_MINUTEN` — hoelang gegevens als "vers genoeg" gelden

Dit zijn exact dezelfde links als in de Android-app, dus als die al werkt
hoef je hier niets aan te passen.

## Installeren op een toestel

- **Android (Chrome)**: site openen → menu (⋮) → "Toevoegen aan startscherm"
  / er verschijnt vanzelf een installatiebanner.
- **iPhone/iPad (Safari)**: site openen → deelknop → "Zet op beginscherm".
- **Desktop (Chrome/Edge)**: installatie-icoontje rechts in de adresbalk.

## Let op: CORS

De app haalt de CSV-bestanden rechtstreeks op vanuit de browser (net zoals
de Android-app dat met OkHttp deed). Google's "Publiceren op web"
CSV-eindpunten staan dit doorgaans toe (ze sturen de juiste
CORS-headers mee). Test dit zeker na het hosten; mocht een bepaalde sheet
onverhoopt geblokkeerd worden, dan is de oplossing een kleine gratis
serverless proxy (bv. een Cloudflare Worker) die de CSV doorgeeft — laat
het weten als je daarbij hulp nodig hebt.

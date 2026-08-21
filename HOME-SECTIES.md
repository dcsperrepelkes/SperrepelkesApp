# Homepagina — optionele secties instellen

De homepagina toont sinds deze update, naast "Volgende speeldag", ook een
reeks **optionele** uitklapbare kaartjes: Laatste nieuws, Sperrepelkesploeg,
Sperrepelkes CUP, Nevenklassementen (checkout/180's), en een Sponsor-banner onderaan.

**Elke sectie is optioneel.** Heb je een tabblad nog niet aangemaakt (of
laat je de placeholder-URL in `config.js` staan), dan verschijnt die sectie
gewoon niet — geen foutmelding, geen kapotte layout. Je kan dus per sectie
kiezen of en wanneer je die activeert.

## Zo activeer je een sectie

1. Maak in dezelfde Google Sheet een nieuw tabblad met de kolommen zoals
   hieronder beschreven.
2. Publiceer dat tabblad als CSV: `Bestand > Delen > Publiceren op web` →
   kies het specifieke tabblad → formaat "Kommagescheiden waarden (.csv)".
3. Plak de gegenereerde URL in `js/app.js`, bovenaan bij `EXTRA_URLS`, bij
   de juiste sleutel (`nieuws`, `ploeg`, `cup`, of `sponsor`).

De **Ranking**-sectie werkt anders dan de rest: die heeft **geen eigen
tabblad** nodig — zie verderop.

## Kolomstructuur per tabblad

### 📰 Nieuws (`nieuws`)
Met kopregel:

| Datum | Titel | Tekst | Link |
|---|---|---|---|
| 15/08/2026 | Nieuwe dartborden! | We hebben 2 nieuwe boards hangen. | |
| 10/08/2026 | Ledenvergadering | Op 1 september om 20u. | https://... |

`Link` is optioneel. Het nieuwste bericht (op basis van `Datum`) wordt als
samenvatting getoond; de 5 recentste verschijnen in de uitklap.

### 🏆 Sperrepelkesploeg (`ploeg`)
**Zonder** kopregel — telkens een label en een waarde:

| | |
|---|---|
| Laatste wedstrijd | Sperrepelkes - KDC Leiestreek |
| Laatste wedstrijd datum | 12/07/2026 |
| Laatste wedstrijd uitslag | 7-5 winst |
| Volgende wedstrijd | Sperrepelkes - Darts Wakken |
| Volgende wedstrijd datum | 20/09/2026 |
| Ranking | 3e plaats (24 punten) |

Enkel deze exacte labels worden herkend; andere rijen worden genegeerd.
Laat een rij gewoon weg als je die info (nog) niet hebt.

### 🏅 Sperrepelkes CUP (`cup`)
**Zonder** kopregel, zelfde principe:

| | |
|---|---|
| Volgende datum | 14/03/2026 |
| Locatie | Ons lokaal |
| Info | Inschrijven kan tot 1 maart |

### 🏆 Nevenklassementen (geen apart tabblad!)

De Nevenklassementen-kaart (podium met top 3 hoogste checkout + top 3 meeste 180's)
haalt zijn data **rechtstreeks uit de 4 bestaande rangschikking-sheets**
(Reeks A, B, C, D) die je toch al gebruikt voor de Rangschikking-tab.

Voeg in **elk van de 4 rangschikking-tabbladen** twee extra kolommen toe,
op een vaste positie:

- **Kolom Q** (17de kolom): hoogste uitworp (checkout) van die speler
- **Kolom R** (18de kolom): aantal keer 180 gegooid door die speler

Dit werkt op basis van de kolom**positie**, niet op een kolomtitel — zorg
dus dat Q en R in elk van de 4 sheets effectief die gegevens bevatten (een
kopregel erboven mag, maar wordt niet gebruikt om de kolom te vinden).

De twee podiums heten "Proxy Delhaize Bambrugge Checkout Championship" en
"Brouwerij Huyghe 180-Trophy".

Gedrag:
- De top 3 wordt **club-breed** berekend, over alle 4 reeksen heen
  samengeteld — niet per reeks apart.
- Podiumvorm: 1e plaats bovenaan, 2e links- en 3e rechtsonder.
- **Ex aequo**: spelers met exact dezelfde waarde staan **samen** op
  dezelfde podiumplaats (onder elkaar opgelijst) — niemand valt daardoor
  weg. De top 3 gaat over 3 verschillende **waarden** (rangen), niet over
  een vast aantal van 3 namen.
- Heeft geen enkele speler een waarde voor checkout (of voor 180's), dan
  verdwijnt enkel dat ene podium — het andere blijft gewoon staan.
- Heeft **geen enkele speler** data voor checkout **én** 180's, dan
  verschijnt de hele Nevenklassementen-kaart niet op de homepagina.

### 🏅 Rankings (geen apart tabblad!)

Toont, per reeks (A/B/C/D), een mini-podium met de top 3 uit die reeks
zelf (op basis van de bestaande `Plaats`-kolom — dezelfde die ook in de
Rangschikking-tab gebruikt wordt), plus onderaan "De Rode Lantaarn": de
speler op de laatste plaats van die reeks.

Geen aparte configuratie nodig — dit werkt automatisch zodra je
rangschikking-sheets een `Plaats`- en `Speler`-kolom hebben (die heb je
sowieso al).

Gedrag:
- Elke reeks krijgt zijn **eigen** podium (dus 4 aparte mini-podiums,
  A t.e.m. D), in tegenstelling tot Nevenklassementen dat club-breed
  combineert.
- Heeft een reeks geen `Plaats`/`Speler`-gegevens, dan verschijnt enkel
  die ene reeks niet — de andere blijven gewoon staan.
- Hebben **alle 4 reeksen** geen bruikbare gegevens, dan verschijnt de
  hele Rankings-kaart niet op de homepagina.

### Sponsor van de week (`sponsor`)
Met kopregel — zet gewoon **al je sponsors onder elkaar**, één rij per sponsor:

| Naam | Tekst | Website | Afbeelding |
|---|---|---|---|
| Café De Toog | Jouw stamcafé na de wedstrijd! | https://cafedetoog.be | https://i.imgur.com/abc123.png |
| Bouwteam DSM | DSM TEAM bv, Impestraat 23, 9420 Erondegem | https://www.bouwteamdsm.be/ | https://i.imgur.com/xyz789.png |

Enkel `Naam` is verplicht. `Afbeelding` is een directe beeld-URL: upload je
logo gratis op **imgur.com**, kopieer de "directe link" (eindigt op
`.png`/`.jpg`), en plak die hier. Laat je dit veld leeg, dan toont de app
een nette tekst-only kaart.

**Automatische wekelijkse rotatie:** de app kiest zelf, op basis van de
huidige kalenderweek, telkens een andere sponsor uit deze lijst — iedereen
die de app in dezelfde week opent ziet dezelfde sponsor, en de week erna
schuift het automatisch door naar de volgende rij. Is de lijst doorlopen,
dan begint het gewoon weer bij de eerste. Je hoeft dus niets manueel om te
wisselen: eenmaal alle sponsors in het tabblad staan, draait het vanzelf.
De volgorde van de rijen bepaalt de volgorde van de rotatie.

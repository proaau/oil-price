# Oil Outlook

Ein statisches, deutschsprachiges Dashboard für Brent-Historie, Futures und Rohölpreis-Szenarien bis 2050. Mit responsiver Darstellung, auswählbaren Reihen, Preisbasisfilter, Datentabelle und CSV-Export der aktuellen Auswahl.

## Öffnen

`index.html` oder `interactive_oil_price_chart.html` im Browser öffnen. Beide Dateien sind identische, generierte Einstiegspunkte und funktionieren auch per Doppelklick. Ein Webserver oder Build ist zum Betrachten nicht erforderlich.

Für die lokale Entwicklung:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Dann [localhost:8000](http://localhost:8000) aufrufen. Das Repository kann statisch über GitHub Pages bereitgestellt werden; diese Änderung aktiviert keine Veröffentlichung.

Plotly 2.35.2 wird über `cdn.plot.ly` geladen. Bei Netzfehlern oder nach 20 Sekunden Wartezeit wird die Tabelle angezeigt; Daten, Auswahl und CSV-Export bleiben verfügbar. Die Preisdaten selbst sind in der HTML-Datei enthalten und werden beim Seitenaufruf nicht extern abgerufen.

## Was verbessert wurde

- Die Monatsdaten werden korrekt dargestellt. Zuvor verwendeten historische Reihen fünf Array-Felder, die Diagrammlogik erwartete aber vier und zerlegte zusätzlich den Quellennamen an Leerzeichen.
- Die CSV enthält jetzt auch die Monatswerte; Diagramm und CSV können nicht mehr unabhängig gepflegt werden.
- Echte ISO-Monatsdaten ersetzen gerundete Dezimaljahre auf der Zeitachse. Die ursprüngliche Spalte `year` bleibt aus Kompatibilitätsgründen erhalten; für die Zeitzuordnung gilt `date`.
- Die Ansichten Überblick, Markt & Historie und Szenarien wählen passende Reihen und Zeiträume. Eigene Auswahl, Preisbasis und Zeitfenster gelten gemeinsam für Diagramm, Tabelle und Export. Der Plotly-Zoom ist eine rein visuelle Vergrösserung und ändert den Exportfilter nicht.
- Die Kennzahlen werden aus dem gesamten Datenbestand berechnet und bleiben beim Filtern unverändert. Die 2050-Spannweite nutzt ausschliesslich WEO 2025 mit einer einheitlichen realen Preisbasis.
- Zugängliche Steuerelemente, sichtbarer Tastaturfokus, mobile Ansicht und nachvollziehbare leere Auswahl.

## Datenbestand und Grenzen

| Reihe | Enthalten | Preisbasis | Herkunft / Stand |
|---|---|---|---|
| EIA/FRED Brent, Monatsmittel | Jan. 2015–Sep. 2026 | nominale USD/bbl | FRED-Abruf vom 11.10.2026, 141 Werte |
| EIA/FRED Brent, Jahresmittel | 2015–2025 | nominale USD/bbl | unverändert aus dem bisherigen Repository |
| Brent Futures | Juni 2026–Juni 2027, 12 Kontrakte | nominale USD/bbl | historischer Snapshot vom 14.04.2026, unverändert |
| IEA WEO 2024 | STEPS, APS, NZE | reale 2023-USD/bbl, MER | unveränderte Bestandswerte |
| IEA WEO 2025 | CPS, STEPS, NZE | reale 2024-USD/bbl, MER | unveränderte Bestandswerte |
| EU Reference Scenario 2020 | 2020–2050 | reale 2015-USD/boe | unveränderte Bestandswerte |

Die Futures sind **keine aktuellen Livekurse** und keine Prognose. Die WEO-Pfade sind Szenarien, keine Vorhersagen. Die Werte verschiedener realer Basisjahre bzw. `bbl` und `boe` sind nicht automatisch vergleichbar. Es werden weder Inflation noch Einheiten umgerechnet und keine neuen Stützpunkte interpoliert. Historische Basiswerte, die im bisherigen Datensatz nur einem Szenario zugeordnet waren, werden nicht künstlich für weitere Szenarien ergänzt.

Die Originaldaten des FRED-Abrufs sind unter `data/fred_monthly_2026-10-11.csv` dokumentiert. Die anderen Reihen wurden in diesem Schritt nicht erneut gegen die Originaltabellen geprüft. Fehlende frühere Abrufdaten bleiben leer, statt ihnen den heutigen Stand zuzuweisen.

## Quellen

- [EIA Brent, monatlich via FRED (MCOILBRENTEU)](https://fred.stlouisfed.org/series/MCOILBRENTEU)
- [EIA Brent, jährlich via FRED (ACOILBRENTEU)](https://fred.stlouisfed.org/series/ACOILBRENTEU)
- [IEA World Energy Outlook 2024](https://www.iea.org/reports/world-energy-outlook-2024); im bisherigen Repository verwendeter [SEC-Spiegel](https://www.sec.gov/Archives/edgar/data/2005951/000200595124000002/ex99-2.htm)
- [IEA World Energy Outlook 2025](https://www.iea.org/reports/world-energy-outlook-2025); im bisherigen Repository verwendete [Textversion](https://studylib.net/doc/28327853/worldenergyoutlook2025)
- [EU Reference Scenario 2020, Tabelle 3 (PDF)](https://pure.iiasa.ac.at/id/eprint/17356/1/MJ0221816ENN.en.pdf)
- [Investing.com Brent Futures Contracts](https://www.investing.com/commodities/brent-oil-contracts), damalige Snapshot-Quelle; die heutige Seite ist keine Archivkopie vom 14.04.2026.

Es gelten die Lizenz- und Nutzungsbedingungen der jeweiligen Datenherausgeber. Die IEA weist für die WEO-Berichte CC BY 4.0 und für Annex A CC BY-NC-SA 4.0 aus; daraus wird keine pauschale Weiterverwendungslizenz für alle Daten abgeleitet.

## Daten pflegen

`oil_price_dataset.csv` ist die zentrale Datenquelle. Die bisherigen Felder `source_group`, `publication`, `scenario`, `year`, `price_usd`, `price_basis`, `notes` bleiben erhalten. Ergänzt wurden:

| Feld | Bedeutung |
|---|---|
| `date` | ISO-Datum; erster Tag des Jahres bzw. Monats, keine Aussage über einen Tageskurs |
| `frequency` | `annual`, `monthly` oder `contract` |
| `kind` | `observed`, `market` oder `scenario` |
| `price_type`, `base_year`, `unit` | nominal/real, reales Basisjahr, Originaleinheit |
| `source_url` | Link zur Quelle bzw. Originalpublikation |
| `retrieved_at` | tatsächliches Abrufdatum, falls dokumentiert |

Nach CSV- oder Frontend-Änderungen die zwei HTML-Dateien neu erzeugen:

```sh
python3 -m scripts.build
```

Monatswerte können über FRED aktualisiert werden (Python 3.9+, nur Standardbibliothek):

```sh
python3 fetch_monthly_data.py --dry-run
python3 fetch_monthly_data.py
```

Für einen reproduzierbaren Import aus einer gespeicherten FRED-CSV:

```sh
python3 fetch_monthly_data.py --input data/fred_monthly_2026-10-11.csv --as-of 2026-10-11 --dry-run
```

Der Import prüft Schema, Datum, endliche Zahlen und Duplikate. Ein verkürzter Abruf, der vorhandene Monatswerte entfernen würde, wird abgelehnt. Fehlwerte (`.`) werden nicht in Nullen umgewandelt. Andere Reihen bleiben erhalten. Nach erfolgreicher Prüfung wird die CSV atomar ersetzt und die HTML-Ausgabe neu gebaut. Datenrevisionen für vorhandene Monate sind möglich und sollten vor dem Commit im Diff geprüft werden. `--as-of` dokumentiert das Abrufdatum, nicht ein Veröffentlichungdatum der Quelle.

## Entwicklung und Prüfung

- `assets/page.html`, `styles.css`, `app.js`: bearbeitbare Oberfläche.
- `assets/core.js`: gemeinsam getestete Auswahl-, Gruppierungs- und Exportlogik.
- `scripts/data_tools.py`, `scripts/build.py`: Validierung und deterministische Seitenerzeugung.
- `tests/`: Regressionstests für Monatsdaten, Filter, CSV, sichere Einbettung und Aktualisierung.

```sh
python3 -m scripts.build --check
python3 -m unittest discover -s tests -v
node --test tests/core.test.cjs
```

Alternativ mit Python 3 und Node 22+ im PATH: `npm run check`. Es werden keine npm-Pakete benötigt. GitHub Actions führt dieselben Prüfungen aus.

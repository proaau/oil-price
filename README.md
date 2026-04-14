# Rohölpreisprojektionen – Vergleich (WEO 2024/2025, EU Reference, Brent Futures)

Dieses Repo enthält eine Datenbasis und ein interaktives Diagramm für den Vergleich verschiedener Rohölpreisprojektionen – inklusive **historischer Brent-Daten ab 2015**.

## Dateien
- `oil_price_dataset.csv`: Zusammengeführte Datenbasis mit expliziter Preisbasis (nominal/real und Basisjahr).
- `interactive_oil_price_chart.html`: Interaktive Visualisierung (Plotly).

## Preisbasis (wichtig)
- **Historische Brent-Werte (EIA/FRED)**: **nominale** Jahresmittel in **USD/bbl**.
- **WEO 2024**: **reale** Preise, konstante **2023-USD/bbl (MER)**.
- **WEO 2025**: **reale** Preise, konstante **2024-USD/bbl (MER)**.
- **EU Reference Scenario 2020**: **reale** Preise, konstante **2015-USD/boe**.
- **Brent Futures**: **nominale** Marktpreise in **USD/bbl** (Snapshot vom 14.04.2026).

Damit sind die Reihen **nicht 1:1 inflationsbereinigt auf dieselbe Basis**; die CSV dokumentiert die Originalbasis je Datenpunkt in `price_basis`.

## Quellenbasis
1. **Historische Brent-Daten ab 2015**: FRED-Tabelle `ACOILBRENTEU` (Quelle: U.S. EIA, annual, Dollars per Barrel).  
   Quelle: https://fred.stlouisfed.org/data/ACOILBRENTEU
2. **WEO 2024**: Werte für `IEA crude oil (USD/barrel)` aus einem öffentlich zugänglichen Spiegel des WEO-2024-PDF (Tabellenwerte aus Szenarien STEPS/APS/NZE).  
   Quelle (Snippet mit Werten): https://www.sec.gov/Archives/edgar/data/2005951/000200595124000002/ex99-2.htm
3. **WEO 2025**: Tabelle „Wholesale fossil fuel prices by scenario“, `IEA crude oil (USD/barrel)` (CPS/STEPS/NZE; 2024, 2035, 2050).  
   Quelle (Textversion): https://studylib.net/doc/28327853/worldenergyoutlook2025
4. **European Reference Scenario 2020**: Tabelle 3 „International fuel prices assumptions“, Ölpreisreihe in `$ per boe` (2015-Dollar-Basis).  
   Quelle (Original-PDF): https://pure.iiasa.ac.at/id/eprint/17356/1/MJ0221816ENN.en.pdf
5. **Brent Futures (kurze Frist)**: Laufzeitstruktur „Brent Oil Futures Contracts“ (Stand Dienstag, **14.04.2026**).  
   Quelle: https://www.investing.com/commodities/brent-oil-contracts

## Nutzung
Öffne `interactive_oil_price_chart.html` im Browser.

# Rohölpreisprojektionen – Vergleich (WEO 2024/2025, EU Reference, Brent Futures)

Dieses Repo enthält eine kleine Datenbasis und ein interaktives Diagramm für den Vergleich verschiedener Rohölpreisprojektionen.

## Dateien
- `oil_price_dataset.csv`: Zusammengeführte Datenbasis.
- `interactive_oil_price_chart.html`: Interaktive Visualisierung (Plotly).

## Quellenbasis
1. **WEO 2024**: Werte für `IEA crude oil (USD/barrel)` aus einem öffentlich zugänglichen Spiegel des WEO-2024-PDF (Tabellenwerte aus Szenarien STEPS/APS/NZE).  
   Quelle (Snippet mit Werten): https://www.sec.gov/Archives/edgar/data/2005951/000200595124000002/ex99-2.htm
2. **WEO 2025**: Tabelle „Wholesale fossil fuel prices by scenario“, `IEA crude oil (USD/barrel)` (CPS/STEPS/NZE; 2024, 2035, 2050).  
   Quelle (Textversion): https://studylib.net/doc/28327853/worldenergyoutlook2025
3. **European Reference Scenario 2020**: Tabelle 3 „International fuel prices assumptions“, Ölpreisreihe in `$ per boe`.  
   Quelle (Original-PDF): https://pure.iiasa.ac.at/id/eprint/17356/1/MJ0221816ENN.en.pdf
4. **Brent Futures (kurze Frist)**: Laufzeitstruktur „Brent Oil Futures Contracts“ (Stand Dienstag, **14.04.2026**).  
   Quelle: https://www.investing.com/commodities/brent-oil-contracts

## Nutzung
Öffne `interactive_oil_price_chart.html` im Browser.

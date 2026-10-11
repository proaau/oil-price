"""Update Brent monthly observations from FRED; preserve all other series."""
import argparse
import csv
import io
import math
import os
import tempfile
import urllib.request
from datetime import date
from pathlib import Path
from scripts.data_tools import DATASET, FIELDS, csv_text, read_rows, validate_rows
from scripts.build import render, build

SOURCE = "https://fred.stlouisfed.org/series/MCOILBRENTEU"


def parse_fred(text, retrieved_at):
    reader = csv.DictReader(io.StringIO(text.lstrip("\ufeff")))
    date_key = next((key for key in ("observation_date", "DATE") if key in (reader.fieldnames or [])), None)
    if not date_key or "MCOILBRENTEU" not in reader.fieldnames:
        raise ValueError("Die Antwort enthält keine FRED-Monatsdaten.")
    rows = []
    for record in reader:
        when = date.fromisoformat(record[date_key])
        if when.year < 2015:
            continue
        if when.day != 1 or when > retrieved_at:
            raise ValueError("Ungültiger Beobachtungsmonat.")
        value = record["MCOILBRENTEU"]
        if value in ("", "."):
            continue
        if value is None or not math.isfinite(float(value)):
            raise ValueError("Ungültiger Brent-Preis.")
        row = dict.fromkeys(FIELDS, "")
        row.update(source_group="HIST_EIA_BRENT", publication="EIA Brent Spot via FRED (MCOILBRENTEU)",
                   scenario="Historical monthly average", year=str(when.year), price_usd=value,
                   price_basis="nominal USD/bbl (monthly average)", notes="EIA Brent Europe spot price monthly average (via FRED)",
                   date=when.isoformat(), frequency="monthly", kind="observed", price_type="nominal",
                   unit="USD/bbl", source_url=SOURCE, retrieved_at=retrieved_at.isoformat())
        rows.append(row)
    return validate_rows(sorted(rows, key=lambda row: row["date"]))


def merge_monthly(existing, monthly):
    is_monthly = lambda row: row["source_group"] == "HIST_EIA_BRENT" and row["frequency"] == "monthly"
    old_dates = {row["date"] for row in existing if is_monthly(row)}
    new_dates = {row["date"] for row in monthly}
    if old_dates - new_dates:
        raise ValueError("Der Abruf würde vorhandene Monate entfernen; Aktualisierung abgebrochen.")
    return validate_rows([row for row in existing if not is_monthly(row)] + monthly)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, help="Gespeicherte FRED-CSV statt Netzwerkabruf")
    parser.add_argument("--as-of", type=date.fromisoformat, default=date.today(), help="Abrufdatum, YYYY-MM-DD")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    try:
        if args.input:
            text = args.input.read_text(encoding="utf-8-sig")
        else:
            url = f"https://fred.stlouisfed.org/graph/fredgraph.csv?id=MCOILBRENTEU&cosd=2015-01-01&coed={args.as_of}"
            with urllib.request.urlopen(url, timeout=30) as response:
                text = response.read().decode("utf-8-sig")
        monthly = parse_fred(text, args.as_of)
        combined = merge_monthly(read_rows(), monthly)
        render(combined)
        if not args.dry_run:
            temporary = None
            try:
                with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=DATASET.parent, delete=False) as handle:
                    temporary = Path(handle.name)
                    handle.write(csv_text(combined))
                os.replace(temporary, DATASET)
            finally:
                if temporary and temporary.exists():
                    temporary.unlink()
            build()
        print(f"{len(monthly)} Monatswerte geprüft; letzter Monat: {monthly[-1]['date']}." + (" Keine Dateien geändert." if args.dry_run else ""))
    except (ValueError, OSError) as error:
        parser.exit(1, f"Aktualisierung fehlgeschlagen: {error}\n")


if __name__ == "__main__":
    main()

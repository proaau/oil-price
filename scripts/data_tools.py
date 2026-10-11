"""Shared validation for the canonical CSV and generated dashboard."""
import csv
import io
import math
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATASET = ROOT / "oil_price_dataset.csv"
FIELDS = ["source_group", "publication", "scenario", "year", "price_usd", "price_basis", "notes",
          "date", "frequency", "kind", "price_type", "base_year", "unit", "source_url", "retrieved_at"]


def validate_rows(rows):
    if not rows:
        raise ValueError("Die Datenbasis ist leer.")
    seen = set()
    for number, row in enumerate(rows, 2):
        try:
            if set(row) != set(FIELDS) or any(value is None for value in row.values()):
                raise ValueError("Unerwartetes CSV-Schema")
            when = date.fromisoformat(row["date"])
            if not math.isfinite(float(row["price_usd"])) or not math.isfinite(float(row["year"])):
                raise ValueError("Preis/Jahr muss endlich sein")
            if int(float(row["year"])) != when.year or when.day != 1:
                raise ValueError("Datum und Jahr passen nicht zusammen")
            if row["frequency"] not in {"monthly", "annual", "contract"}:
                raise ValueError("Unbekannte Frequenz")
            if row["kind"] not in {"observed", "market", "scenario"}:
                raise ValueError("Unbekannter Datentyp")
            if row["unit"] not in {"USD/bbl", "USD/boe"}:
                raise ValueError("Unbekannte Einheit")
            if row["price_type"] not in {"real", "nominal"}:
                raise ValueError("Unbekannte Preisbasis")
            if row["price_type"] == "real" and not row["base_year"].isdigit():
                raise ValueError("Realer Preis ohne Basisjahr")
            if row["price_type"] == "nominal" and row["base_year"]:
                raise ValueError("Nominaler Preis mit Basisjahr")
            if not row["source_url"].startswith("https://"):
                raise ValueError("HTTPS-Quelle fehlt")
            if row["retrieved_at"]:
                date.fromisoformat(row["retrieved_at"])
            for key in ("source_group", "publication", "scenario", "price_basis"):
                if not row[key].strip():
                    raise ValueError(f"{key} fehlt")
            identity = (row["source_group"], row["scenario"], row["frequency"], row["date"])
            if identity in seen:
                raise ValueError("Doppelter Datenpunkt")
            seen.add(identity)
        except (ValueError, TypeError, KeyError) as error:
            raise ValueError(f"Zeile {number}: {error}") from error
    return rows


def read_rows(path=DATASET):
    with Path(path).open(encoding="utf-8-sig", newline="") as handle:
        return validate_rows(list(csv.DictReader(handle)))


def csv_text(rows):
    validate_rows(rows)
    buffer = io.StringIO(newline="")
    writer = csv.DictWriter(buffer, fieldnames=FIELDS, lineterminator="\n")
    writer.writeheader()
    writer.writerows(rows)
    return buffer.getvalue()

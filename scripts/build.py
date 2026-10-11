"""Build standalone pages. No third-party dependencies required."""
import argparse
import json
from scripts.data_tools import ROOT, read_rows


def render(rows):
    template = (ROOT / "assets/page.html").read_text(encoding="utf-8")
    replacements = {
        "STYLES": (ROOT / "assets/styles.css").read_text(encoding="utf-8"),
        "CORE": (ROOT / "assets/core.js").read_text(encoding="utf-8"),
        "APP": (ROOT / "assets/app.js").read_text(encoding="utf-8"),
        "DATA": json.dumps(rows, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c"),
    }
    for key, value in replacements.items():
        template = template.replace("{{" + key + "}}", value)
    return template


def build(check=False):
    page = render(read_rows())
    for name in ("index.html", "interactive_oil_price_chart.html"):
        path = ROOT / name
        if check:
            if not path.exists() or path.read_text(encoding="utf-8") != page:
                raise SystemExit(f"{name} ist veraltet: python3 -m scripts.build ausführen.")
        else:
            path.write_text(page, encoding="utf-8")
    print("Daten und beide HTML-Einstiegspunkte sind synchron.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    build(parser.parse_args().check)

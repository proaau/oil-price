import urllib.request
import csv
import io

# URL für monatliche Brent-Preise von FRED (EIA Brent Europe)
url = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=MCOILBRENTEU&cosd=2015-01-01&coed=2026-12-31"

# Daten herunterladen
response = urllib.request.urlopen(url)
data = response.read().decode('utf-8')

# CSV parsen
reader = csv.reader(io.StringIO(data))
rows = list(reader)

# Header überspringen
rows = rows[1:]

# Alle monatlichen Daten ab 2015
monthly_data = []
for row in rows:
    date_str, price_str = row
    year = int(date_str[:4])
    month = int(date_str[5:7])
    if year >= 2015 and price_str != '.':
        price = float(price_str)
        # Konvertiere Datum zu Dezimaljahr für Konsistenz
        decimal_year = year + (month - 0.5) / 12  # Mitte des Monats
        monthly_data.append([decimal_year, price])

# Sortiere nach Jahr
monthly_data.sort(key=lambda x: x[0])

# Ausgabe als Liste für JavaScript
print("const monthly_historical = [")
for year, price in monthly_data:
    print(f'  [{year:.2f}, {price}],')
print("];")
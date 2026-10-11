import copy
import csv
import io
import json
import re
import unittest
from datetime import date
from scripts.data_tools import ROOT, read_rows, csv_text, validate_rows
from scripts.build import render
from fetch_monthly_data import parse_fred, merge_monthly


class DataTests(unittest.TestCase):
    def setUp(self):
        self.rows = read_rows()

    def test_preserves_existing_scenario_and_futures_values(self):
        self.assertEqual(sum(row['kind'] == 'scenario' for row in self.rows), 24)
        self.assertEqual(sum(row['kind'] == 'market' for row in self.rows), 12)
        contracts = [row for row in self.rows if row['kind'] == 'market']
        self.assertEqual(contracts[0]['date'], '2026-06-01')
        self.assertEqual(contracts[-1]['date'], '2027-06-01')
        self.assertEqual(contracts[0]['price_usd'], '98.46')

    def test_fred_response_matches_persisted_monthly_series(self):
        monthly = parse_fred((ROOT / 'data/fred_monthly_2026-10-11.csv').read_text(), date(2026,10,11))
        self.assertEqual(len(monthly), 141)
        self.assertEqual(monthly[-1]['price_usd'], '114.16')
        existing = [row for row in self.rows if row['frequency'] == 'monthly']
        by_date = {row['date']:row['price_usd'] for row in existing}
        for row in monthly:
            self.assertIn(row['date'], by_date)

    def test_roundtrip_keeps_quoted_metadata(self):
        rows = copy.deepcopy(self.rows[:1])
        rows[0]['notes'] = 'comma, quote " and\nnewline'
        self.assertEqual(list(csv.DictReader(io.StringIO(csv_text(rows)))), rows)

    def test_generated_data_is_exact_csv_and_safe_in_script(self):
        page = render(self.rows)
        payload = re.search(r'<script id="oil-data" type="application/json">(.*?)</script>', page, re.S)[1]
        self.assertEqual(json.loads(payload), self.rows)
        modified = copy.deepcopy(self.rows)
        modified[0]['notes'] = '</script><script>alert(1)</script>'
        self.assertNotIn(modified[0]['notes'], render(modified))
        for name in ('index.html', 'interactive_oil_price_chart.html'):
            self.assertEqual((ROOT/name).read_text(), page)

    def test_invalid_numeric_duplicate_and_date_rejected(self):
        for field, value in [('price_usd','NaN'), ('price_usd','Infinity'), ('date','2026-02-30'), ('unit','EUR/l')]:
            with self.subTest(field=field,value=value):
                row = {**self.rows[0], field:value}
                with self.assertRaises(ValueError): validate_rows([row])
        with self.assertRaisesRegex(ValueError,'Doppelter'): validate_rows([self.rows[0], self.rows[0]])

    def test_fred_invalid_and_missing_values(self):
        for text in ('<html>Unavailable</html>', 'observation_date,MCOILBRENTEU\n2026-01-01,NaN', 'observation_date,MCOILBRENTEU\n2027-01-01,70'):
            with self.subTest(text=text), self.assertRaises(ValueError):
                parse_fred(text, date(2026,10,11))
        rows = parse_fred('DATE,MCOILBRENTEU\n2026-01-01,.\n2026-02-01,70.89\n', date(2026,10,11))
        self.assertEqual(len(rows),1)

    def test_truncated_import_does_not_remove_history(self):
        monthly = [row for row in self.rows if row['frequency']=='monthly']
        with self.assertRaisesRegex(ValueError,'entfernen'):
            merge_monthly(self.rows, monthly[1:])
        merged = merge_monthly(self.rows, monthly)
        self.assertEqual([row for row in merged if row['frequency'] != 'monthly'], [row for row in self.rows if row['frequency'] != 'monthly'])


if __name__ == '__main__':
    unittest.main()

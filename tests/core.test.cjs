const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const D = require('../assets/core.js');
const page = fs.readFileSync(new URL('../index.html', `file://${__filename}`), 'utf8');
const rows = JSON.parse(page.match(/<script id="oil-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);

test('Monthly history retains its dates and numeric prices, distinct from annual history', () => {
  const groups = D.groupRows(rows).filter(group => group.row.source_group === 'HIST_EIA_BRENT');
  assert.equal(groups.length, 2);
  const monthly = groups.find(group => group.row.frequency === 'monthly');
  assert.equal(monthly.points[0].date, '2015-01-01');
  assert.equal(Number(monthly.points[0].price_usd), 47.76);
  assert.ok(monthly.points.length >= 141);
  assert.ok(monthly.points.every(row => Number.isFinite(Number(row.price_usd))));
});
test('Scenario names with spaces do not split into invalid groups', () => {
  const points = [{...rows[0], scenario:'Scenario with spaces'}, {...rows[1], scenario:'Scenario with spaces'}];
  assert.equal(D.groupRows(points).length, 1);
  assert.equal(D.groupRows(points)[0].points.length, 2);
});
test('Selection, date boundaries and price basis apply together to chart/table/export data', () => {
  const selected = new Set(rows.map(D.keyOf));
  const result = D.filterRows(rows, {selected, start:'2035-01-01', end:'2050-01-01', basis:'real|2024|USD/bbl'});
  assert.equal(result.length, 6);
  assert.ok(result.every(row => row.source_group === 'WEO2025'));
  assert.ok(result.some(row => row.date === '2035-01-01'));
  assert.ok(result.some(row => row.date === '2050-01-01'));
  assert.equal(D.toCSV(result, ['date','price_usd']).split('\r\n').length, 8);
  assert.deepEqual(D.filterRows(rows, {selected:new Set(), start:'2015-01-01', end:'2050-12-31', basis:'all'}), []);
});
test('CSV export preserves quotes, commas, newlines and protects text formulas', () => {
  const result = D.toCSV([{note:'a,"b"\nnext', price:-12.5, formula:'=SUM(A1:A2)'}], ['note','price','formula']);
  assert.equal(result, '\ufeffnote,price,formula\r\n"a,""b""\nnext",-12.5,\'=SUM(A1:A2)\r\n');
});
test('Monthly change rejects missing adjacent months and zero denominator', () => {
  const row = rows.find(row => row.frequency === 'monthly');
  const make = (date, price) => ({...row, date, price_usd:String(price)});
  assert.equal(D.monthlyChange([make('2025-12-01',100), make('2026-01-01',125)]),25);
  assert.equal(D.monthlyChange([make('2025-11-01',100), make('2026-01-01',125)]),null);
  assert.equal(D.monthlyChange([make('2025-12-01',0), make('2026-01-01',125)]),null);
});

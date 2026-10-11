/* Pure data helpers shared by the dashboard and regression tests. */
(function (root) {
  'use strict';
  const keyOf = row => [row.source_group, row.scenario, row.frequency].join('|');
  const basisKey = row => [row.price_type, row.base_year, row.unit].join('|');
  const basis = row => row.price_type === 'real' ? `${row.base_year}-USD/${row.unit.split('/')[1]} · real` : `${row.unit} · nominal`;
  const labels = {WEO2024: 'WEO 2024', WEO2025: 'WEO 2025', EU_REF2020: 'EU Reference 2020'};
  function label(row) {
    if (row.source_group === 'HIST_EIA_BRENT') return row.frequency === 'monthly' ? 'Brent · Monatsmittel' : 'Brent · Jahresmittel';
    if (row.source_group === 'BRENT_FUTURES') return 'Brent Futures';
    return row.source_group.startsWith('WEO') ? `${labels[row.source_group]} · ${row.scenario}` : (labels[row.source_group] || row.publication);
  }
  function groupRows(rows) {
    const groups = new Map();
    for (const row of rows) {
      const key = keyOf(row);
      if (!groups.has(key)) groups.set(key, {key, label: label(row), basis: basis(row), row, points: []});
      groups.get(key).points.push(row);
    }
    return [...groups.values()].map(group => ({...group, points: group.points.sort((a, b) => a.date.localeCompare(b.date))}));
  }
  function filterRows(rows, state) {
    return rows.filter(row => state.selected.has(keyOf(row)) && row.date >= state.start && row.date <= state.end &&
      (state.basis === 'all' || basisKey(row) === state.basis)).sort((a, b) => a.date.localeCompare(b.date) || label(a).localeCompare(label(b)));
  }
  function toCSV(rows, fields) {
    const cell = value => {
      let text = String(value ?? '');
      // Keep negative numeric prices numeric, but prevent spreadsheet formulas in textual metadata.
      if (/^[=+\-@\t\r]/.test(text) && !/^-?\d+(\.\d+)?$/.test(text)) text = "'" + text;
      return /[",\n\r]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
    };
    return '\ufeff' + [fields.join(','), ...rows.map(row => fields.map(field => cell(row[field])).join(','))].join('\r\n') + '\r\n';
  }
  function monthlyChange(rows) {
    const points = rows.filter(row => row.kind === 'observed' && row.frequency === 'monthly').sort((a, b) => a.date.localeCompare(b.date));
    const last = points.at(-1), previous = points.at(-2);
    if (!last || !previous || Number(previous.price_usd) === 0) return null;
    const a = new Date(last.date + 'T00:00:00Z'), b = new Date(previous.date + 'T00:00:00Z');
    if ((a.getUTCFullYear() - b.getUTCFullYear()) * 12 + a.getUTCMonth() - b.getUTCMonth() !== 1) return null;
    return (Number(last.price_usd) / Number(previous.price_usd) - 1) * 100;
  }
  const api = {keyOf, basisKey, basis, label, groupRows, filterRows, toCSV, monthlyChange};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.OilData = api;
})(globalThis);

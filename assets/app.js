(function () {
  'use strict';
  const D = OilData;
  const $ = id => document.getElementById(id);
  const rows = JSON.parse($('oil-data').textContent);
  const number = new Intl.NumberFormat('de-CH', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  const percent = new Intl.NumberFormat('de-CH', {minimumFractionDigits: 1, maximumFractionDigits: 1, signDisplay: 'always'});
  const month = new Intl.DateTimeFormat('de-CH', {month: 'long', year: 'numeric', timeZone: 'UTC'});
  const shortMonth = new Intl.DateTimeFormat('de-CH', {month: 'short', year: 'numeric', timeZone: 'UTC'});
  const day = new Intl.DateTimeFormat('de-CH', {day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC'});
  const dateObject = date => new Date(date + 'T00:00:00Z');
  const period = row => row.frequency === 'annual' ? row.date.slice(0, 4) : shortMonth.format(dateObject(row.date));
  const kindLabels = {observed: 'Beobachtung', market: 'Marktpreis · 14.04.2026', scenario: 'Szenario'};
  const colours = {STEPS: '#477c95', APS: '#8e729f', NZE: '#369186', CPS: '#a16e43'};
  const colour = row => row.kind === 'observed' ? (row.frequency === 'monthly' ? '#203f45' : '#809393') :
    row.kind === 'market' ? '#c28c45' : row.source_group === 'EU_REF2020' ? '#967c45' : colours[row.scenario];
  const groups = D.groupRows(rows).sort((a, b) => {
    const order = row => row.kind === 'observed' ? (row.frequency === 'monthly' ? 0 : 1) : row.kind === 'market' ? 2 : row.source_group === 'WEO2025' ? 3 : row.source_group === 'WEO2024' ? 4 : 5;
    return order(a.row) - order(b.row);
  });
  const monthly = rows.filter(row => row.kind === 'observed' && row.frequency === 'monthly').sort((a, b) => a.date.localeCompare(b.date));
  const latest = monthly.at(-1);
  const futures = rows.filter(row => row.kind === 'market').sort((a, b) => a.date.localeCompare(b.date));
  const earliestYear = Math.min(...rows.map(row => Number(row.date.slice(0, 4))));
  const latestYear = Math.max(...rows.map(row => Number(row.date.slice(0, 4))));
  const state = {selected: new Set(), start: `${earliestYear}-01-01`, end: `${latestYear}-12-31`, basis: 'all', view: 'chart'};
  let filtered = [], plotReady = false, plotFailed = false, renderQueued = false;
  let renderChain = Promise.resolve();
  if (latest) {
    $('coverage').textContent = month.format(dateObject(latest.date));
    $('latest-price').textContent = number.format(Number(latest.price_usd));
    $('latest-detail').textContent = `${month.format(dateObject(latest.date))} · nominal`;
    $('history-source-detail').textContent = `Monatsdaten abgerufen am ${day.format(dateObject(latest.retrieved_at))}.`;
  }
  const change = D.monthlyChange(rows);
  $('monthly-change').textContent = change === null ? '—' : `${percent.format(change)} %`;
  if (futures.length) {
    $('future-price').textContent = number.format(Number(futures[0].price_usd));
    $('future-detail').textContent = `${period(futures[0])} · Snapshot 14.04.2026`;
  }
  const endpoints = rows.filter(row => row.source_group === 'WEO2025' && row.date === '2050-01-01').map(row => Number(row.price_usd));
  if (endpoints.length) $('scenario-range').textContent = `${Math.min(...endpoints)}–${Math.max(...endpoints)}`;

  const bases = new Map(rows.map(row => [D.basisKey(row), D.basis(row)]));
  for (const [value, label] of bases) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    $('basis-filter').append(option);
  }
  const sections = new Map();
  const checkboxes = new Map();
  for (const group of groups) {
    const sectionName = group.row.kind === 'observed' || group.row.kind === 'market' ? 'Historie & Markt' : group.row.source_group === 'EU_REF2020' ? 'Europäische Kommission' : group.row.publication.replace('IEA World Energy Outlook', 'IEA WEO');
    if (!sections.has(sectionName)) {
      const fieldset = document.createElement('fieldset');
      fieldset.className = 'series-group';
      const legend = document.createElement('legend');
      legend.textContent = sectionName;
      fieldset.append(legend);
      $('series-controls').append(fieldset);
      sections.set(sectionName, fieldset);
    }
    const label = document.createElement('label');
    label.className = 'series-toggle';
    label.style.setProperty('--series', colour(group.row));
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.dataset.series = group.key;
    input.addEventListener('change', () => {
      if (input.checked) state.selected.add(group.key); else state.selected.delete(group.key);
      clearPresetState();
      update();
    });
    const swatch = document.createElement('span');
    swatch.className = 'swatch';
    swatch.setAttribute('aria-hidden', 'true');
    if (group.row.source_group === 'WEO2024') swatch.style.background = `repeating-linear-gradient(90deg,${colour(group.row)} 0 4px,transparent 4px 6px)`;
    const text = document.createElement('span');
    const title = document.createElement('strong');
    title.textContent = group.label;
    const detail = document.createElement('small');
    detail.textContent = group.row.kind === 'market' ? 'Snapshot 14.04.2026 · nominal' : group.basis;
    text.append(title, detail);
    label.append(input, swatch, text);
    sections.get(sectionName).append(label);
    checkboxes.set(group.key, input);
  }

  function clearPresetState() {
    document.querySelectorAll('[data-preset]').forEach(button => button.setAttribute('aria-pressed', 'false'));
  }
  function applyPreset(preset) {
    state.basis = 'all';
    $('basis-filter').value = 'all';
    state.selected = new Set(groups.filter(group => preset === 'market' ? group.row.kind !== 'scenario' && group.row.frequency !== 'annual' :
      preset === 'scenario' ? group.row.kind === 'scenario' :
      (group.row.kind !== 'scenario' && group.row.frequency !== 'annual') || group.row.source_group === 'WEO2025').map(group => group.key));
    const marketYear = Number((latest || futures[0] || rows[0]).date.slice(0, 4));
    state.start = preset === 'market' ? `${marketYear - 2}-01-01` : preset === 'scenario' ? '2023-01-01' : `${earliestYear}-01-01`;
    state.end = preset === 'market' ? `${Math.max(marketYear, ...futures.map(row => Number(row.date.slice(0, 4)))) + 1}-12-31` : `${latestYear}-12-31`;
    document.querySelectorAll('[data-preset]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.preset === preset)));
    update();
  }
  function update() {
    filtered = D.filterRows(rows, state);
    checkboxes.forEach((input, key) => { input.checked = state.selected.has(key); });
    const activeGroups = D.groupRows(filtered);
    $('visible-count').textContent = `${activeGroups.length} Reihen · ${filtered.length} Werte`;
    $('download').disabled = !filtered.length;
    const selectedBases = [...new Set(filtered.map(D.basisKey))];
    $('axis-label').textContent = selectedBases.length === 1 ? D.basis(filtered[0]) : 'Originalpreise · USD je bbl / boe';
    $('basis-notice').textContent = selectedBases.length > 1 ?
      'Unterschiedliche Preisbasen: Nominale Preise und reale Preise verschiedener Basisjahre sind nicht direkt vergleichbar. Mit «Preisbasis» auf eine Originalbasis eingrenzen. bbl und boe bleiben getrennte Einheiten.' :
      selectedBases.length === 1 ? `Auswahl: ${D.basis(filtered[0])}. Die Preisbasis ist einheitlich; Brent-Spotpreise, IEA-Rohöl, Lieferkontrakte und Szenarien können sich dennoch in Produkt und Zeitraum unterscheiden.` :
      'Keine Daten ausgewählt. Über die Ansichten oder Datenreihen eine neue Auswahl treffen.';
    renderTable();
    $('empty-chart').hidden = filtered.length > 0;
    $('empty-table').hidden = filtered.length > 0;
    $('chart').hidden = !filtered.length;
    queueChart();
  }
  function renderTable() {
    const fragment = document.createDocumentFragment();
    for (const row of filtered) {
      const tr = document.createElement('tr');
      const values = [period(row), D.label(row), number.format(Number(row.price_usd)), D.basis(row), kindLabels[row.kind]];
      values.forEach((value, index) => {
        const td = document.createElement('td');
        td.textContent = value;
        if (index === 2) td.className = 'number';
        if (index === 0) {
          const detail = document.createElement('small');
          detail.textContent = {annual: 'Jahreswert', monthly: 'Monatsmittel', contract: 'Liefermonat'}[row.frequency];
          td.append(detail);
        }
        tr.append(td);
      });
      const td = document.createElement('td');
      const link = document.createElement('a');
      link.href = row.source_url;
      link.textContent = 'Quelle ↗';
      link.setAttribute('aria-label', `Quelle: ${row.publication}, ${period(row)}`);
      td.append(link);
      tr.append(td);
      fragment.append(tr);
    }
    $('table-body').replaceChildren(fragment);
  }
  function queueChart() {
    if (!plotReady || plotFailed || state.view !== 'chart' || !filtered.length || renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(() => {
      renderQueued = false;
      renderChain = renderChain.then(drawChart).catch(chartUnavailable);
    });
  }
  function escapePlotText(text) {
    return String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  }
  async function drawChart() {
    if (state.view !== 'chart' || !filtered.length || plotFailed) return;
    const traces = D.groupRows(filtered).map(group => ({
      x: group.points.map(row => row.date), y: group.points.map(row => Number(row.price_usd)),
      name: group.label, mode: group.points.length > 30 ? 'lines' : 'lines+markers',
      line: {color: colour(group.row), width: group.row.kind === 'observed' ? 2.6 : 2,
        dash: group.row.kind === 'market' ? 'dot' : group.row.source_group === 'WEO2024' ? 'dash' : 'solid'},
      marker: {size: 5, symbol: group.row.kind === 'market' ? 'diamond' : 'circle'},
      customdata: group.points.map(row => [period(row), number.format(Number(row.price_usd)), D.basis(row), kindLabels[row.kind]].map(escapePlotText)),
      hovertemplate: '<b>%{fullData.name}</b><br>%{customdata[0]}: %{customdata[1]}<br>%{customdata[2]}<br>%{customdata[3]}<extra></extra>'
    }));
    const small = window.innerWidth < 520;
    const short = Number(state.end.slice(0, 4)) - Number(state.start.slice(0, 4)) < 8;
    await Plotly.react('chart', traces, {
      autosize: true, margin: {l: small ? 33 : 42, r: 12, t: 22, b: 38},
      paper_bgcolor: '#fff', plot_bgcolor: '#fff', showlegend: false,
      font: {family: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif', color: '#6a7c7e', size: 10},
      xaxis: {type: 'date', range: [state.start, state.end], tickformat: '%Y', dtick: short ? 'M12' : (small ? 'M120' : 'M60'),
        tick0: `${earliestYear}-01-01`, showgrid: false, zeroline: false, showline: true, linecolor: '#dce2de', fixedrange: small},
      yaxis: {rangemode: 'tozero', gridcolor: '#eaf0eb', zerolinecolor: '#dce2de', fixedrange: small, tickfont: {size: 10}},
      hovermode: 'closest', hoverlabel: {bgcolor: '#183238', bordercolor: '#183238', font: {color: '#fff', size: 12}},
      dragmode: 'zoom', separators: ".'"
    }, {responsive: true, displaylogo: false, displayModeBar: !small, scrollZoom: false,
      modeBarButtonsToRemove: ['lasso2d', 'select2d', 'autoScale2d'],
      toImageButtonOptions: {filename: 'oil-outlook', format: 'png', scale: 2}});
  }
  function setView(view) {
    state.view = view;
    $('chart-view').hidden = view !== 'chart';
    $('table-view').hidden = view !== 'table';
    document.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
    queueChart();
  }
  function chartUnavailable() {
    plotFailed = true;
    $('chart-error').textContent = 'Das Diagramm konnte nicht geladen werden. Die Tabelle und der CSV-Export stehen weiterhin zur Verfügung. Für das Diagramm bitte die Internetverbindung prüfen und die Seite neu laden.';
    $('chart-error').hidden = false;
    setView('table');
    document.querySelector('[data-view="chart"]').disabled = true;
  }
  document.querySelectorAll('[data-preset]').forEach(button => button.addEventListener('click', () => applyPreset(button.dataset.preset)));
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
  $('basis-filter').addEventListener('change', event => { state.basis = event.target.value; clearPresetState(); update(); });
  $('clear-series').addEventListener('click', () => { state.selected.clear(); clearPresetState(); update(); });
  $('download').addEventListener('click', () => {
    if (!filtered.length) return;
    const blob = new Blob([D.toCSV(filtered, Object.keys(rows[0]))], {type: 'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `oil-outlook_${state.start}_${state.end}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  let resizeTimer;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(queueChart, 200); });
  applyPreset('all');
  // Data and controls work immediately, even if the optional chart library is unavailable.
  const script = document.createElement('script');
  script.src = 'https://cdn.plot.ly/plotly-2.35.2.min.js';
  script.async = true;
  const timeout = setTimeout(chartUnavailable, 20000);
  script.onload = () => {
    clearTimeout(timeout);
    if (!globalThis.Plotly) { chartUnavailable(); return; }
    plotReady = true;
    plotFailed = false;
    $('chart-error').hidden = true;
    document.querySelector('[data-view="chart"]').disabled = false;
    queueChart();
  };
  script.onerror = () => { clearTimeout(timeout); chartUnavailable(); };
  document.head.append(script);
})();

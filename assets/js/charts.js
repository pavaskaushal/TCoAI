const CHART_DEFAULTS = {
  font: {
    family: "'Inter', -apple-system, sans-serif",
    size: 11,
  },
  color: '#989898',
  plugins: {
    legend: {
      labels: {
        font: { family: "'Inter', sans-serif", size: 11 },
        color: '#989898',
        boxWidth: 12,
        boxHeight: 12,
        borderRadius: 3,
        useBorderRadius: true,
        padding: 16,
      },
    },
    tooltip: {
      backgroundColor: '#0C233C',
      titleColor: '#E5E5E5',
      bodyColor: '#989898',
      borderColor: '#1E49E2',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
      titleFont: { family: "'Inter', sans-serif", size: 12, weight: '600' },
      bodyFont: { family: "'IBM Plex Mono', monospace", size: 11 },
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(51,51,51,0.6)', drawBorder: false },
      ticks: { color: '#666666', font: { family: "'Inter', sans-serif", size: 10 } },
      border: { display: false },
    },
    y: {
      grid: { color: 'rgba(51,51,51,0.6)', drawBorder: false },
      ticks: { color: '#666666', font: { family: "'Inter', monospace", size: 10 } },
      border: { display: false },
    },
  },
};

const chartInstances = {};

function destroyChart(id) {
  if (chartInstances[id]) {
    chartInstances[id].destroy();
    delete chartInstances[id];
  }
}

function destroyAllCharts() {
  Object.keys(chartInstances).forEach(destroyChart);
}

function axisFormatter(currencyCode) {
  const config = CURRENCIES[currencyCode] || CURRENCIES.USD;
  return (value) => {
    const converted = value * config.rate;
    const abs = Math.abs(converted);
    if (abs >= 1_000_000) return `${config.symbol}${(converted / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000)     return `${config.symbol}${(converted / 1_000).toFixed(0)}K`;
    return `${config.symbol}${converted.toFixed(0)}`;
  };
}

function tooltipFormatter(value, currencyCode) {
  return formatCurrencyFull(value, currencyCode);
}

// ══════════════════════════════════════════════════════════════════
// CHART 1 — Annual Cost vs Saving (Grouped Bar)
// ══════════════════════════════════════════════════════════════════
function renderCostVsSavingChart(canvasId, calcResults, currency) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId)?.getContext('2d');
  if (!ctx) return;

  const { conservative: c, base: b, aggressive: a } = calcResults;

  const labels = ['Y1 Cost', 'Y1 Saving', 'Y2 Cost', 'Y2 Saving', 'Y3 Cost', 'Y3 Saving'];

  const datasets = [
    {
      label: 'Conservative',
      data: [c.y1Cost, c.y1Saving, c.y2Cost, c.y2Saving, c.y3Cost, c.y3Saving],
      backgroundColor: 'rgba(0,184,245,0.75)',
      borderColor: '#00B8F5',
      borderWidth: 1,
      borderRadius: 4,
    },
    {
      label: 'Base Case',
      data: [b.y1Cost, b.y1Saving, b.y2Cost, b.y2Saving, b.y3Cost, b.y3Saving],
      backgroundColor: 'rgba(99,235,218,0.75)',
      borderColor: '#63EBDA',
      borderWidth: 1,
      borderRadius: 4,
    },
    {
      label: 'Aggressive',
      data: [a.y1Cost, a.y1Saving, a.y2Cost, a.y2Saving, a.y3Cost, a.y3Saving],
      backgroundColor: 'rgba(253,52,156,0.75)',
      borderColor: '#FD349C',
      borderWidth: 1,
      borderRadius: 4,
    },
  ];

  chartInstances[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        ...CHART_DEFAULTS.plugins,
        tooltip: {
          ...CHART_DEFAULTS.plugins.tooltip,
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${tooltipFormatter(ctx.raw, currency)}`,
          },
        },
      },
      scales: {
        x: {
          ...CHART_DEFAULTS.scales.x,
          ticks: { ...CHART_DEFAULTS.scales.x.ticks, maxRotation: 0 },
        },
        y: {
          ...CHART_DEFAULTS.scales.y,
          ticks: {
            ...CHART_DEFAULTS.scales.y.ticks,
            callback: axisFormatter(currency),
          },
        },
      },
    },
  });
}

// ══════════════════════════════════════════════════════════════════
// CHART 2 — Cumulative Net Position (Line Chart)
// ══════════════════════════════════════════════════════════════════
function renderCumulativeNetChart(canvasId, calcResults, currency) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId)?.getContext('2d');
  if (!ctx) return;

  const { conservative: c, base: b, aggressive: a } = calcResults;
  const labels = ['Start', 'Year 1', 'Year 2', 'Year 3'];

  const datasets = [
    {
      label: 'Conservative',
      data: [0, c.y1Net, c.y1Net + c.y2Net, c.cumNet],
      borderColor: '#00B8F5',
      backgroundColor: 'rgba(0,184,245,0.08)',
      borderWidth: 2.5,
      pointRadius: 5,
      pointBackgroundColor: '#00B8F5',
      pointBorderColor: '#1D1D1D',
      pointBorderWidth: 2,
      fill: true,
      tension: 0.35,
    },
    {
      label: 'Base Case',
      data: [0, b.y1Net, b.y1Net + b.y2Net, b.cumNet],
      borderColor: '#63EBDA',
      backgroundColor: 'rgba(99,235,218,0.08)',
      borderWidth: 2.5,
      pointRadius: 5,
      pointBackgroundColor: '#63EBDA',
      pointBorderColor: '#1D1D1D',
      pointBorderWidth: 2,
      fill: true,
      tension: 0.35,
    },
    {
      label: 'Aggressive',
      data: [0, a.y1Net, a.y1Net + a.y2Net, a.cumNet],
      borderColor: '#FD349C',
      backgroundColor: 'rgba(253,52,156,0.08)',
      borderWidth: 2.5,
      pointRadius: 5,
      pointBackgroundColor: '#FD349C',
      pointBorderColor: '#1D1D1D',
      pointBorderWidth: 2,
      fill: true,
      tension: 0.35,
    },
  ];

  chartInstances[canvasId] = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        ...CHART_DEFAULTS.plugins,
        tooltip: {
          ...CHART_DEFAULTS.plugins.tooltip,
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${tooltipFormatter(ctx.raw, currency)}`,
          },
        },
      },
      scales: {
        x: { ...CHART_DEFAULTS.scales.x },
        y: {
          ...CHART_DEFAULTS.scales.y,
          ticks: {
            ...CHART_DEFAULTS.scales.y.ticks,
            callback: axisFormatter(currency),
          },
        },
      },
    },
  });
}

// ══════════════════════════════════════════════════════════════════
// CHART 3 — 3-Year Key Metrics Comparison (Horizontal Bar)
// ══════════════════════════════════════════════════════════════════
function renderMetricsComparisonChart(canvasId, calcResults, currency) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId)?.getContext('2d');
  if (!ctx) return;

  const { conservative: c, base: b, aggressive: a } = calcResults;
  const labels = ['3-Yr NPV', '3-Yr Net Position', 'Cumul. FTE Savings', 'Cumul. TCoAI Cost'];

  const datasets = [
    {
      label: 'Conservative',
      data: [c.npv, c.cumNet, c.cumSaving, -c.cumCost],
      backgroundColor: 'rgba(0,184,245,0.75)',
      borderColor: '#00B8F5',
      borderWidth: 1,
      borderRadius: 4,
    },
    {
      label: 'Base Case',
      data: [b.npv, b.cumNet, b.cumSaving, -b.cumCost],
      backgroundColor: 'rgba(99,235,218,0.75)',
      borderColor: '#63EBDA',
      borderWidth: 1,
      borderRadius: 4,
    },
    {
      label: 'Aggressive',
      data: [a.npv, a.cumNet, a.cumSaving, -a.cumCost],
      backgroundColor: 'rgba(253,52,156,0.75)',
      borderColor: '#FD349C',
      borderWidth: 1,
      borderRadius: 4,
    },
  ];

  chartInstances[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        ...CHART_DEFAULTS.plugins,
        tooltip: {
          ...CHART_DEFAULTS.plugins.tooltip,
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${tooltipFormatter(ctx.raw, currency)}`,
          },
        },
      },
      scales: {
        x: {
          ...CHART_DEFAULTS.scales.x,
          ticks: {
            ...CHART_DEFAULTS.scales.x.ticks,
            callback: axisFormatter(currency),
          },
        },
        y: { ...CHART_DEFAULTS.scales.y },
      },
    },
  });
}

// ══════════════════════════════════════════════════════════════════
// CHART 4 — Token Cost Sensitivity (Line)
// ══════════════════════════════════════════════════════════════════
function renderTokenSensitivityChart(canvasId, inputCostPerM, outputCostPerM, inputTokens, outputTokens, currency, workingDays) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId)?.getContext('2d');
  if (!ctx) return;

  const volumes = [10000, 50000, 100000, 250000, 500000, 1000000];
  const labels  = volumes.map(v => v >= 1000000 ? `${v/1000000}M` : v >= 1000 ? `${v/1000}K` : v);

  const tiers = [
    { label: 'Flash ($0.15/$0.60)',       inputC: 0.15, outputC: 0.60,  color: '#76D2FF' },
    { label: 'Mid ($1.25/$5.00)',         inputC: 1.25, outputC: 5.00,  color: '#00C0AE' },
    { label: 'Frontier ($2.75/$12.50)',   inputC: 2.75, outputC: 12.50, color: '#7213EA' },
    { label: 'Open Source ($0.28/$0.86)', inputC: 0.28, outputC: 0.86,  color: '#B497FF' },
  ];

  const datasets = tiers.map(tier => ({
    label: tier.label,
    data: volumes.map(v => {
      const daily      = v * 0.55;
      const inputCost  = (daily * inputTokens  / 1_000_000) * tier.inputC;
      const outputCost = (daily * outputTokens / 1_000_000) * tier.outputC;
      return (inputCost + outputCost) * (workingDays || 250);
    }),
    borderColor: tier.color,
    backgroundColor: tier.color + '18',
    borderWidth: 2,
    pointRadius: 4,
    pointBackgroundColor: tier.color,
    pointBorderColor: '#1D1D1D',
    pointBorderWidth: 1.5,
    fill: false,
    tension: 0.3,
  }));

  chartInstances[canvasId] = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        ...CHART_DEFAULTS.plugins,
        tooltip: {
          ...CHART_DEFAULTS.plugins.tooltip,
          callbacks: {
            title: (items) => `Daily Volume: ${labels[items[0].dataIndex]}`,
            label: (ctx) => ` ${ctx.dataset.label}: ${tooltipFormatter(ctx.raw, currency)}/yr`,
          },
        },
      },
      scales: {
        x: {
          ...CHART_DEFAULTS.scales.x,
          title: {
            display: true,
            text: 'Daily Transaction Volume',
            color: '#666666',
            font: { size: 10, family: "'Inter', sans-serif" },
          },
        },
        y: {
          ...CHART_DEFAULTS.scales.y,
          title: {
            display: true,
            text: 'Annual Token Cost',
            color: '#666666',
            font: { size: 10, family: "'Inter', sans-serif" },
          },
          ticks: {
            ...CHART_DEFAULTS.scales.y.ticks,
            callback: axisFormatter(currency),
          },
        },
      },
    },
  });
}

// ══════════════════════════════════════════════════════════════════
// CHART 5 — TCoAI Cost Waterfall (Year 1 breakdown)
// ══════════════════════════════════════════════════════════════════
function renderWaterfallChart(canvasId, calcResults, currency, scenario = 'base') {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId)?.getContext('2d');
  if (!ctx) return;

  const bd = calcResults[scenario].breakdown.year1;

  const labels = [
    'Base Impl.',
    '+ Integration',
    '+ Data Prep',
    '+ Change Mgmt',
    '+ Project Mgmt',
    '+ Token Costs',
    '+ Infrastructure',
    '+ Maintenance',
    '+ Governance',
    '+ Error Correction',
    'Total TCoAI Y1',
  ];

  const rawValues = [
    bd.baseImpl,
    bd.integration,
    bd.dataPrep,
    bd.changeManagement,
    bd.projectMgmt,
    bd.tokenCost,
    bd.infrastructure,
    bd.maintenance,
    bd.governance,
    bd.errorCorrection,
    bd.totalCost,
  ];

  let running = 0;
  const baseData = [];
  const incrData = [];
  const colors   = [];

  rawValues.forEach((val, i) => {
    if (i === 0) {
      baseData.push(0);
      incrData.push(val);
      colors.push('rgba(30,73,226,0.85)');
      running = val;
    } else if (i === rawValues.length - 1) {
      baseData.push(0);
      incrData.push(val);
      colors.push('rgba(0,51,141,0.90)');
    } else {
      baseData.push(running);
      incrData.push(val);
      colors.push('rgba(171,13,130,0.75)');
      running += val;
    }
  });

  chartInstances[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Base',
          data: baseData,
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          borderWidth: 0,
          stack: 'stack',
        },
        {
          label: 'Cost Layer',
          data: incrData,
          backgroundColor: colors,
          borderColor: colors.map(c => c.replace('0.85','1').replace('0.75','1').replace('0.90','1')),
          borderWidth: 1,
          borderRadius: 3,
          stack: 'stack',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          ...CHART_DEFAULTS.plugins.tooltip,
          callbacks: {
            label: (ctx) => {
              if (ctx.datasetIndex === 0) return null;
              return ` ${labels[ctx.dataIndex]}: ${tooltipFormatter(ctx.raw, currency)}`;
            },
            filter: (item) => item.datasetIndex === 1,
          },
        },
      },
      scales: {
        x: {
          ...CHART_DEFAULTS.scales.x,
          stacked: true,
          ticks: {
            ...CHART_DEFAULTS.scales.x.ticks,
            maxRotation: 35,
            font: { size: 9, family: "'Inter', sans-serif" },
          },
        },
        y: {
          ...CHART_DEFAULTS.scales.y,
          stacked: true,
          ticks: {
            ...CHART_DEFAULTS.scales.y.ticks,
            callback: axisFormatter(currency),
          },
        },
      },
    },
  });
}

// ── Render all charts ─────────────────────────────────────────────
function renderAllCharts(calcResults, inputsResolved, currency, workingDays) {
  renderCostVsSavingChart('chart-cost-saving',   calcResults, currency);
  renderCumulativeNetChart('chart-cumulative',    calcResults, currency);
  renderMetricsComparisonChart('chart-metrics',   calcResults, currency);
  renderTokenSensitivityChart(
    'chart-token-sensitivity',
    inputsResolved.inputCostPerM,
    inputsResolved.outputCostPerM,
    inputsResolved.inputTokens,
    inputsResolved.outputTokens,
    currency,
    workingDays,
  );
  renderWaterfallChart('chart-waterfall', calcResults, currency, 'base');
}
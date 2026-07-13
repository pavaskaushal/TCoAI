// ── Populate sector dropdown ──────────────────────────────────────
function populateSectors() {
  const select = document.getElementById('sector');
  if (!select) return;
  select.innerHTML = '';
  Object.keys(SECTORS).forEach(sector => {
    const opt = document.createElement('option');
    opt.value = sector;
    opt.textContent = sector;
    select.appendChild(opt);
  });
  populateBusinessLines(select.value);
}

// ── Populate business line dropdown ──────────────────────────────
function populateBusinessLines(sector) {
  const select = document.getElementById('business-line');
  if (!select) return;
  select.innerHTML = '';
  const lines = SECTORS[sector] || {};
  Object.keys(lines).forEach(line => {
    const opt = document.createElement('option');
    opt.value = line;
    opt.textContent = line;
    select.appendChild(opt);
  });
  populateUseCases(sector, select.value);
}

// ── Populate use case dropdown ────────────────────────────────────
function populateUseCases(sector, businessLine) {
  const select = document.getElementById('use-case');
  if (!select) return;
  select.innerHTML = '';
  const cases = SECTORS[sector]?.[businessLine] || [];
  cases.forEach(uc => {
    const opt = document.createElement('option');
    opt.value = uc;
    opt.textContent = uc;
    select.appendChild(opt);
  });
}

// ── Populate currency dropdown ────────────────────────────────────
function populateCurrencies() {
  const select = document.getElementById('currency');
  if (!select) return;
  select.innerHTML = '';
  Object.entries(CURRENCIES).forEach(([code, config]) => {
    const opt = document.createElement('option');
    opt.value = code;
    opt.textContent = `${config.symbol} ${code} — ${config.name}`;
    select.appendChild(opt);
  });
}

// ── Populate region dropdown ──────────────────────────────────────
function populateRegions() {
  const select = document.getElementById('region');
  if (!select) return;
  select.innerHTML = '';
  Object.keys(FTE_COSTS).forEach(region => {
    const opt = document.createElement('option');
    opt.value = region;
    opt.textContent = region;
    if (region === 'Global Average') opt.selected = true;
    select.appendChild(opt);
  });
}

// ── Update FTE cost hint based on region + level ──────────────────
function updateFteCostHint() {
  const region = document.getElementById('region')?.value;
  const level  = document.getElementById('fte-level')?.value;
  const hint   = document.getElementById('fte-cost-hint');
  if (!hint || !region || !level) return;

  const levelMap = { 'Junior': 'junior', 'Mid-level': 'mid', 'Senior': 'senior' };
  const cost     = FTE_COSTS[region]?.[levelMap[level]] || 75000;
  const currency = document.getElementById('currency')?.value || 'USD';
  hint.textContent = `Default for ${level} in ${region}: ${formatCurrencyFull(cost, currency)}/yr`;
}

// ── Update range display value ────────────────────────────────────
function updateRangeDisplay(inputId, displayId, isPercent = true) {
  const input   = document.getElementById(inputId);
  const display = document.getElementById(displayId);
  if (!input || !display) return;
  display.textContent = isPercent
    ? `${parseFloat(input.value).toFixed(0)}%`
    : input.value;
}

// ── Update token cost hint ────────────────────────────────────────
function updateTokenHint() {
  const tier    = document.getElementById('model-tier')?.value;
  const hint    = document.getElementById('token-hint');
  if (!hint || !tier) return;
  const pricing = TOKEN_PRICING[tier];
  if (!pricing) return;
  hint.textContent = `${pricing.label}: $${pricing.input}/1M input · $${pricing.output}/1M output · e.g. ${pricing.example}`;
}

// ── Update implementation cost hint ──────────────────────────────
function updateImplHint() {
  const aiType  = document.getElementById('ai-type')?.value;
  const orgSize = document.getElementById('org-size')?.value;
  const hint    = document.getElementById('impl-hint');
  if (!hint || !aiType || !orgSize) return;
  const sizeKey = ORG_SIZE_KEYS[orgSize] || 'mid';
  const cost    = IMPL_COSTS[aiType]?.[sizeKey];
  const procKey = document.getElementById('procurement')?.value || 'API';
  const mult    = PROCUREMENT_MULTIPLIERS[procKey]?.impl || 1;
  const final   = cost * mult;
  const currency = document.getElementById('currency')?.value || 'USD';
  hint.textContent = `Default for ${aiType} (${procKey}, ${orgSize}): ${formatCurrencyFull(final, currency)}`;
}

// ── Show benchmark for selected sector ───────────────────────────
function updateBenchmark() {
  const sector    = document.getElementById('sector')?.value;
  const container = document.getElementById('benchmark-box');
  if (!container || !sector) return;
  const bm = ROI_BENCHMARKS[sector];
  if (!bm) { container.style.display = 'none'; return; }
  container.style.display = 'block';
  container.innerHTML = `
    <div style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#00B8F5;font-family:var(--font-mono);margin-bottom:6px;">Industry Benchmark</div>
    <div style="font-size:var(--text-sm);font-weight:600;color:#E5E5E5;margin-bottom:4px;">${bm.topUseCase}</div>
    <div style="font-size:var(--text-sm);color:#989898;">${bm.roi}</div>
    <div style="font-size:10px;color:#666666;font-family:var(--font-mono);margin-top:6px;">Source: ${bm.source}</div>
  `;
}

// ── Render KPI cards ──────────────────────────────────────────────
function renderKpiCards(calcResults, currency) {
  const scenarios = ['conservative', 'base', 'aggressive'];
  const labels    = { conservative: 'Conservative', base: 'Base Case', aggressive: 'Aggressive' };

  // Summary KPI row
  scenarios.forEach(key => {
    const r   = calcResults[key];
    const el  = document.getElementById(`kpi-${key}`);
    if (!el) return;

    const roiRaw    = r.roi * 100;
      const roiPct    = roiRaw > 9999 ? '>9999' : roiRaw.toFixed(1);
    const isPos     = r.cumNet >= 0;
    const badgeType = isPos ? 'positive' : 'negative';
    const badgeText = isPos ? `+${formatCurrency(r.cumNet, currency)}` : formatCurrency(r.cumNet, currency);

    el.innerHTML = `
      <div class="kpi-label">${labels[key]}</div>
      <div class="kpi-value">${formatCurrency(r.npv, currency)}</div>
      <div class="kpi-sub">3-Year NPV</div>
      <div class="kpi-badge kpi-badge--${badgeType}">${badgeText} net</div>
      <div class="kpi-sub" style="margin-top:6px;">
        ROI ${roiPct}% · Payback ${formatMonths(r.paybackMonths)}
      </div>
    `;
  });

  // Highlight card — best scenario
  const best    = calcResults.aggressive.cumNet > 0
    ? calcResults.aggressive
    : calcResults.base.cumNet > 0
    ? calcResults.base
    : calcResults.conservative;

  const highlight = document.getElementById('kpi-highlight');
  if (highlight) {
    highlight.innerHTML = `
      <div class="kpi-label">Cumulative 3-Year FTE Saving</div>
      <div class="kpi-value">${formatCurrency(calcResults.base.cumSaving, currency)}</div>
      <div class="kpi-sub">Base case · ${calcResults.base.ftesFreed.toFixed(1)} FTEs freed</div>
      <div class="kpi-badge kpi-badge--positive" style="margin-top:6px;">
        ${formatCurrency(calcResults.base.annualFteSaving, currency)}/yr
      </div>
    `;
  }
}

// ── Render breakdown table ────────────────────────────────────────
function renderBreakdownTable(calcResults, currency, scenario = 'base') {
  const r  = calcResults[scenario];
  const bd = r.breakdown;
  const el = document.getElementById('breakdown-table-body');
  if (!el) return;

  const rows = [
    // Year 1
    { label: 'Base Implementation',   val: bd.year1.baseImpl,         cls: '',          year: 1 },
    { label: '+ Integration',          val: bd.year1.integration,      cls: '',          year: 1 },
    { label: '+ Data Preparation',     val: bd.year1.dataPrep,         cls: '',          year: 1 },
    { label: '+ Change Management',    val: bd.year1.changeManagement, cls: '',          year: 1 },
    { label: '+ Project Management',   val: bd.year1.projectMgmt,      cls: '',          year: 1 },
    { label: 'Token Costs',            val: bd.year1.tokenCost,        cls: '',          year: 1 },
    { label: 'Infrastructure',         val: bd.year1.infrastructure,   cls: '',          year: 1 },
    { label: 'Maintenance & Updates',  val: bd.year1.maintenance,      cls: '',          year: 1 },
    { label: 'Governance',             val: bd.year1.governance,       cls: '',          year: 1 },
    { label: 'Error Correction',       val: bd.year1.errorCorrection,  cls: '',          year: 1 },
    { label: 'YEAR 1 — Total TCoAI',   val: bd.year1.totalCost,        cls: 'total-row', year: 1 },
    { label: 'FTE Cost Saving',        val: bd.year1.fteSaving,        cls: 'saving-row',year: 1 },
    { label: 'YEAR 1 — Net Position',  val: bd.year1.netPosition,      cls: `net-row ${bd.year1.netPosition >= 0 ? 'net-positive' : 'net-negative'}`, year: 1 },

    // Year 2
    { label: 'Token Costs',            val: bd.year2.tokenCost,        cls: '',          year: 2 },
    { label: 'Infrastructure',         val: bd.year2.infrastructure,   cls: '',          year: 2 },
    { label: 'Maintenance & Updates',  val: bd.year2.maintenance,      cls: '',          year: 2 },
    { label: 'Governance',             val: bd.year2.governance,       cls: '',          year: 2 },
    { label: 'Error Correction',       val: bd.year2.errorCorrection,  cls: '',          year: 2 },
    { label: 'YEAR 2 — Total TCoAI',   val: bd.year2.totalCost,        cls: 'total-row', year: 2 },
    { label: 'FTE Cost Saving',        val: bd.year2.fteSaving,        cls: 'saving-row',year: 2 },
    { label: 'YEAR 2 — Net Position',  val: bd.year2.netPosition,      cls: `net-row ${bd.year2.netPosition >= 0 ? 'net-positive' : 'net-negative'}`, year: 2 },

    // Year 3
    { label: 'Token Costs',            val: bd.year3.tokenCost,        cls: '',          year: 3 },
    { label: 'Infrastructure',         val: bd.year3.infrastructure,   cls: '',          year: 3 },
    { label: 'Maintenance & Updates',  val: bd.year3.maintenance,      cls: '',          year: 3 },
    { label: 'Governance',             val: bd.year3.governance,       cls: '',          year: 3 },
    { label: 'Error Correction',       val: bd.year3.errorCorrection,  cls: '',          year: 3 },
    { label: 'YEAR 3 — Total TCoAI',   val: bd.year3.totalCost,        cls: 'total-row', year: 3 },
    { label: 'FTE Cost Saving',        val: bd.year3.fteSaving,        cls: 'saving-row',year: 3 },
    { label: 'YEAR 3 — Net Position',  val: bd.year3.netPosition,      cls: `net-row ${bd.year3.netPosition >= 0 ? 'net-positive' : 'net-negative'}`, year: 3 },
  ];

  el.innerHTML = rows.map((row, i) => {
    // Add year header rows
    const yearHeaders = { 0: 'Year 1', 13: 'Year 2', 21: 'Year 3' };
    const header = yearHeaders[i]
      ? `<tr><td colspan="2" style="padding:var(--space-3);font-size:var(--text-xs);font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--electric);background:var(--surface-2);border-bottom:1px solid var(--gray-200);">${yearHeaders[i]}</td></tr>`
      : '';

    return `${header}<tr class="${row.cls}">
      <td>${row.label}</td>
      <td>${formatCurrencyFull(row.val, currency)}</td>
    </tr>`;
  }).join('');
}

// ── Render interpretation box ─────────────────────────────────────
function renderInterpretation(calcResults, currency) {
  const el   = document.getElementById('interpretation-box');
  if (!el) return;
  const data = generateInterpretation(calcResults, currency);
  el.className = `interpretation interpretation--${data.type} animate-in`;
  el.innerHTML = `
    <div class="interpretation__title">${data.title}</div>
    <div>${data.text}</div>
  `;
}

// ── Render scenario pills ─────────────────────────────────────────
function renderScenarioPills(calcResults, currency) {
  const container = document.getElementById('scenario-pills');
  if (!container) return;
  const scenarios = [
    { key: 'conservative', label: 'Conservative', cls: 'conservative' },
    { key: 'base',         label: 'Base Case',    cls: 'base'         },
    { key: 'aggressive',   label: 'Aggressive',   cls: 'aggressive'   },
  ];
  container.innerHTML = scenarios.map(s => {
    const r = calcResults[s.key];
    return `
      <span class="metric-pill metric-pill--${s.cls}">
        ${s.label}: ${formatCurrency(r.npv, currency)} NPV
      </span>
    `;
  }).join('');
}

// ── Show / hide output panel ──────────────────────────────────────
function showOutputPanel() {
  const empty   = document.getElementById('empty-state');
  const results = document.getElementById('results-panel');
  if (empty)   empty.style.display   = 'none';
  if (results) results.style.display = 'flex';
}

function showEmptyState() {
  const empty   = document.getElementById('empty-state');
  const results = document.getElementById('results-panel');
  if (empty)   empty.style.display   = 'flex';
  if (results) results.style.display = 'none';
}

// ── Scenario tab switching (breakdown table) ──────────────────────
function initScenarioTabs(calcResults, currency) {
  const tabs = document.querySelectorAll('.scenario-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const scenario = tab.dataset.scenario;
      renderBreakdownTable(calcResults, currency, scenario);
      renderWaterfallChart('chart-waterfall', calcResults, currency, scenario);
    });
  });
  // Set first tab active
  if (tabs[0]) {
    tabs[0].classList.add('active');
  }
}

// ── Collect all inputs from the form ─────────────────────────────
function collectInputs() {
  const g = (id) => document.getElementById(id);
  const v = (id) => g(id)?.value;
  const n = (id) => parseFloat(g(id)?.value) || 0;

  return {
    currency:           v('currency')        || 'USD',
    region:             v('region')          || 'Global Average',
    sector:             v('sector')          || 'BFSI',
    businessLine:       v('business-line')   || '',
    useCase:            v('use-case')        || '',
    aiType:             v('ai-type')         || 'Generative AI',
    procurement:        v('procurement')     || 'API',
    modelTier:          v('model-tier')      || 'Mid',
    transactionType:    v('transaction-type')|| 'Customer service interaction',
    orgSize:            v('org-size')        || 'Mid-size',
    fteLevel:           v('fte-level')       || 'Mid-level',

    dailyVolume:        n('daily-volume')    || 5000,
    fteCount:           n('fte-count')       || 50,
    workingDays:        n('working-days')    || 250,
    discountRate:       n('discount-rate') / 100 || 0.10,

    // Overrides (0 means use default)
    customImplCost:         n('custom-impl-cost'),
    customInputTokenCost:   n('custom-input-token'),
    customOutputTokenCost:  n('custom-output-token'),
    customInputTokens:      n('custom-input-tokens'),
    customOutputTokens:     n('custom-output-tokens'),
    customFteCost:          n('custom-fte-cost'),

    // Indirect %
    integrationPct:      n('pct-integration')  / 100 || null,
    dataPrepPct:         n('pct-data-prep')    / 100 || null,
    changeManagementPct: n('pct-change-mgmt')  / 100 || null,
    projectMgmtPct:      n('pct-project-mgmt') / 100 || null,

    // Ongoing %
    maintenancePct:  n('pct-maintenance')   / 100 || null,
    governancePct:   n('pct-governance')    / 100 || null,
    errorY1Pct:      n('pct-error-y1')      / 100 || null,
    errorY2Pct:      n('pct-error-y2')      / 100 || null,
    errorY3Pct:      n('pct-error-y3')      / 100 || null,
    modelRefreshPct: n('pct-model-refresh') / 100 || null,

    // Scenario
    conservativeDeflection:   n('deflection-conservative')    / 100 || null,
    baseDeflection:           n('deflection-base')            / 100 || null,
    aggressiveDeflection:     n('deflection-aggressive')      / 100 || null,
    conservativeFteReduction: n('fte-reduction-conservative') / 100 || null,
    baseFteReduction:         n('fte-reduction-base')         / 100 || null,
    aggressiveFteReduction:   n('fte-reduction-aggressive')   / 100 || null,
  };
}

// ── Reset all inputs to defaults ──────────────────────────────────
function resetInputs() {
  // Dropdowns
  const currency = document.getElementById('currency');
  if (currency) currency.value = 'USD';

  const region = document.getElementById('region');
  if (region) region.value = 'Global Average';

  populateSectors();

  const aiType = document.getElementById('ai-type');
  if (aiType) aiType.value = 'Generative AI';

  const procurement = document.getElementById('procurement');
  if (procurement) procurement.value = 'API';

  const modelTier = document.getElementById('model-tier');
  if (modelTier) modelTier.value = 'Mid';

  const orgSize = document.getElementById('org-size');
  if (orgSize) orgSize.value = 'Mid-size';

  const fteLevel = document.getElementById('fte-level');
  if (fteLevel) fteLevel.value = 'Mid-level';

  const txType = document.getElementById('transaction-type');
  if (txType) txType.value = 'Customer service interaction';

  // Numbers
  const numDefaults = {
    'daily-volume': 5000,
    'fte-count':    50,
    'working-days': 250,
    'discount-rate': 10,
    'pct-integration': 30,
    'pct-data-prep':   25,
    'pct-change-mgmt': 20,
    'pct-project-mgmt': 10,
    'pct-maintenance':  15,
    'pct-governance':   10,
    'pct-error-y1':     8,
    'pct-error-y2':     5,
    'pct-error-y3':     3,
    'pct-model-refresh': 5,
  };

  Object.entries(numDefaults).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  });

  // Ranges
  const rangeDefaults = {
    'deflection-conservative':    35,
    'deflection-base':            55,
    'deflection-aggressive':      75,
    'fte-reduction-conservative': 30,
    'fte-reduction-base':         50,
    'fte-reduction-aggressive':   70,
  };

  Object.entries(rangeDefaults).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) {
      el.value = val;
      updateRangeDisplay(id, `${id}-display`);
    }
  });

  // Clear overrides
  const overrideIds = [
    'custom-impl-cost', 'custom-input-token', 'custom-output-token',
    'custom-input-tokens', 'custom-output-tokens', 'custom-fte-cost',
  ];
  overrideIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  updateFteCostHint();
  updateTokenHint();
  updateImplHint();
  updateBenchmark();
  showEmptyState();
  destroyAllCharts();
}
// ── Populate pricing reference table ─────────────────────────────
function populatePricingTable() {
  const tbody = document.getElementById('pricing-table-body');
  if (!tbody) return;

  const models = [
    { name: 'GPT-4o',            input: 2.50,  output: 10.00, tier: 'Frontier' },
    { name: 'GPT-4o mini',       input: 0.15,  output: 0.60,  tier: 'Flash'    },
    { name: 'Claude Sonnet',      input: 3.00,  output: 15.00, tier: 'Frontier' },
    { name: 'Claude Haiku 4.5',   input: 1.00,  output: 5.00,  tier: 'Mid'      },
    { name: 'Gemini 1.5 Pro',     input: 1.25,  output: 5.00,  tier: 'Mid'      },
    { name: 'Gemini 1.5 Flash',   input: 0.075, output: 0.30,  tier: 'Flash'    },
    { name: 'Command R+',         input: 2.50,  output: 10.00, tier: 'Frontier' },
    { name: 'Llama 3.1 405B',     input: 0.28,  output: 0.86,  tier: 'Open Source' },
  ];

  const tierColors = {
    'Flash':       '#00B4D8',
    'Mid':         '#1A6FBF',
    'Frontier':    '#7C3AED',
    'Open Source': '#16A34A',
  };

  tbody.innerHTML = models.map(m => `
    <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
      <td style="padding:5px 8px;color:#ECECE6;display:flex;align-items:center;gap:6px;">
        <span style="width:6px;height:6px;border-radius:50%;
                     background:${tierColors[m.tier]};
                     display:inline-block;flex-shrink:0;"></span>
        ${m.name}
      </td>
      <td style="padding:5px 8px;text-align:right;color:#B0AFA8;">$${m.input}</td>
      <td style="padding:5px 8px;text-align:right;color:#B0AFA8;">$${m.output}</td>
    </tr>
  `).join('');
}
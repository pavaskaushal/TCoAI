// ── Main calculation engine ───────────────────────────────────────
// Takes inputs object, returns full TCoAI results for all 3 scenarios

function runCalculation(inputs) {
  const {
    currency,
    region,
    sector,
    businessLine,
    useCase,
    aiType,
    procurement,
    modelTier,
    transactionType,
    dailyVolume,
    fteCount,
    fteLevel,
    orgSize,
    discountRate,
    workingDays,
    // overrides
    customImplCost,
    customInputTokenCost,
    customOutputTokenCost,
    customInputTokens,
    customOutputTokens,
    customFteCost,
    // indirect overrides
    integrationPct,
    dataPrepPct,
    changeManagementPct,
    projectMgmtPct,
    // ongoing overrides
    maintenancePct,
    governancePct,
    errorY1Pct,
    errorY2Pct,
    errorY3Pct,
    modelRefreshPct,
    // scenario overrides
    conservativeDeflection,
    baseDeflection,
    aggressiveDeflection,
    conservativeFteReduction,
    baseFteReduction,
    aggressiveFteReduction,
  } = inputs;

  // ── 1. Resolve base implementation cost ────────────────────────
  const sizeKey    = ORG_SIZE_KEYS[orgSize] || 'mid';
  const implBase   = customImplCost > 0
    ? customImplCost
    : (IMPL_COSTS[aiType]?.[sizeKey] || 150000);

  const procMult   = PROCUREMENT_MULTIPLIERS[procurement]?.impl || 1;
  const baseImpl   = implBase * procMult;

  // ── 2. Token costs ─────────────────────────────────────────────
  const pricing    = TOKEN_PRICING[modelTier] || TOKEN_PRICING['Mid'];
  const tokVol     = TOKEN_VOLUMES[transactionType] || TOKEN_VOLUMES['Customer service interaction'];

  const inputCostPerM  = customInputTokenCost  > 0 ? customInputTokenCost  : pricing.input;
  const outputCostPerM = customOutputTokenCost > 0 ? customOutputTokenCost : pricing.output;
  const inputTokens    = customInputTokens     > 0 ? customInputTokens     : tokVol.input;
  const outputTokens   = customOutputTokens    > 0 ? customOutputTokens    : tokVol.output;

  // ── 3. FTE cost ────────────────────────────────────────────────
  const regionCosts  = FTE_COSTS[region] || FTE_COSTS['Global Average'];
  const levelMap     = { 'Junior': 'junior', 'Mid-level': 'mid', 'Senior': 'senior' };
  const fteLevelKey  = levelMap[fteLevel] || 'mid';
  const annualFteCost = customFteCost > 0 ? customFteCost : regionCosts[fteLevelKey];

  // ── 4. Indirect costs (one-time Year 1) ────────────────────────
  const intPct  = integrationPct      ?? INDIRECT_DEFAULTS.integration;
  const datPct  = dataPrepPct         ?? INDIRECT_DEFAULTS.dataPrep;
  const chgPct  = changeManagementPct ?? INDIRECT_DEFAULTS.changeManagement;
  const pmPct   = projectMgmtPct      ?? INDIRECT_DEFAULTS.projectMgmt;

  const integrationCost      = baseImpl * intPct;
  const dataPrepCost         = baseImpl * datPct;
  const changeManagementCost = baseImpl * chgPct;
  const projectMgmtCost      = baseImpl * pmPct;
  const totalIndirect        = integrationCost + dataPrepCost + changeManagementCost + projectMgmtCost;
  const totalImplYear1       = baseImpl + totalIndirect;

  // ── 5. Ongoing costs ───────────────────────────────────────────
  const maintPct   = maintenancePct  ?? ONGOING_DEFAULTS.maintenance;
  const govPct     = governancePct   ?? ONGOING_DEFAULTS.governance;
  const errY1      = errorY1Pct      ?? ONGOING_DEFAULTS.errorY1;
  const errY2      = errorY2Pct      ?? ONGOING_DEFAULTS.errorY2;
  const errY3      = errorY3Pct      ?? ONGOING_DEFAULTS.errorY3;
  const refreshPct = modelRefreshPct ?? ONGOING_DEFAULTS.modelRefresh;
  const ongoingAdj = PROCUREMENT_MULTIPLIERS[procurement]?.ongoingAdj || 0;

  const annualMaintenance  = baseImpl * (maintPct + ongoingAdj);
  const annualGovernance   = baseImpl * govPct;
  const annualModelRefresh = baseImpl * refreshPct;
  const errorCostY1        = baseImpl * errY1;
  const errorCostY2        = baseImpl * errY2;
  const errorCostY3        = baseImpl * errY3;

  // ── 6. Infrastructure cost (annual) ───────────────────────────
  const infraMultiplier = { conservative: 0.20, base: 0.25, aggressive: 0.30 };

  // ── 7. Calculate per scenario ──────────────────────────────────
  const scenarioParams = {
    conservative: {
      deflection:   conservativeDeflection   ?? SCENARIO_DEFAULTS.conservative.deflection,
      fteReduction: conservativeFteReduction ?? SCENARIO_DEFAULTS.conservative.fteReduction,
    },
    base: {
      deflection:   baseDeflection           ?? SCENARIO_DEFAULTS.base.deflection,
      fteReduction: baseFteReduction         ?? SCENARIO_DEFAULTS.base.fteReduction,
    },
    aggressive: {
      deflection:   aggressiveDeflection     ?? SCENARIO_DEFAULTS.aggressive.deflection,
      fteReduction: aggressiveFteReduction   ?? SCENARIO_DEFAULTS.aggressive.fteReduction,
    },
  };

  const results = {};

  Object.entries(scenarioParams).forEach(([scenarioKey, params]) => {
    const { deflection, fteReduction } = params;

    // Token costs (annual)
    const dailyAiVolume    = dailyVolume * deflection;
    const dailyInputCost   = (dailyAiVolume * inputTokens  / 1_000_000) * inputCostPerM;
    const dailyOutputCost  = (dailyAiVolume * outputTokens / 1_000_000) * outputCostPerM;
    const annualTokenCost  = (dailyInputCost + dailyOutputCost) * workingDays;

    // Infrastructure (scales with volume)
    const annualInfra = baseImpl * infraMultiplier[scenarioKey];

    // Direct costs (annual, recurring)
    const annualDirectCost = annualTokenCost + annualInfra;

    // FTE savings (annual)
    const ftesFreed        = fteCount * fteReduction;
    const annualFteSaving  = ftesFreed * annualFteCost;

    // ── Year 1 ────────────────────────────────────────────────
    const y1Cost   = totalImplYear1 + annualDirectCost + annualMaintenance + annualGovernance + annualModelRefresh + errorCostY1;
    const y1Saving = annualFteSaving;
    const y1Net    = y1Saving - y1Cost;

    // ── Year 2 ────────────────────────────────────────────────
    const y2Cost   = annualDirectCost + annualMaintenance + annualGovernance + annualModelRefresh + errorCostY2;
    const y2Saving = annualFteSaving;
    const y2Net    = y2Saving - y2Cost;

    // ── Year 3 ────────────────────────────────────────────────
    const y3Cost   = annualDirectCost + annualMaintenance + annualGovernance + annualModelRefresh + errorCostY3;
    const y3Saving = annualFteSaving;
    const y3Net    = y3Saving - y3Cost;

    // ── Cumulative ────────────────────────────────────────────
    const cumCost   = y1Cost + y2Cost + y3Cost;
    const cumSaving = y1Saving + y2Saving + y3Saving;
    const cumNet    = cumSaving - cumCost;

    // ── NPV ───────────────────────────────────────────────────
    const dr  = discountRate || FINANCIAL_DEFAULTS.discountRate;
    const npv = (y1Net / (1 + dr)) + (y2Net / Math.pow(1 + dr, 2)) + (y3Net / Math.pow(1 + dr, 3));

    // ── ROI ───────────────────────────────────────────────────
    const roi = cumCost > 0 ? cumNet / cumCost : 0;

    // ── Payback period (months) ───────────────────────────────
    // Approximate: total Year 1 cost / monthly saving
    const monthlySaving = annualFteSaving / 12;
    const paybackMonths = monthlySaving > 0 ? totalImplYear1 / monthlySaving : null;

    // ── Cost breakdown detail (for table) ────────────────────
    const breakdown = {
      year1: {
        baseImpl,
        integration:      integrationCost,
        dataPrep:         dataPrepCost,
        changeManagement: changeManagementCost,
        projectMgmt:      projectMgmtCost,
        tokenCost:        annualTokenCost,
        infrastructure:   annualInfra,
        maintenance:      annualMaintenance,
        governance:       annualGovernance,
        errorCorrection:  errorCostY1,
        modelRefresh:     annualModelRefresh,
        totalCost:        y1Cost,
        fteSaving:        y1Saving,
        netPosition:      y1Net,
      },
      year2: {
        tokenCost:       annualTokenCost,
        infrastructure:  annualInfra,
        maintenance:     annualMaintenance,
        governance:      annualGovernance,
        errorCorrection: errorCostY2,
        modelRefresh:    annualModelRefresh,
        totalCost:       y2Cost,
        fteSaving:       y2Saving,
        netPosition:     y2Net,
      },
      year3: {
        tokenCost:       annualTokenCost,
        infrastructure:  annualInfra,
        maintenance:     annualMaintenance,
        governance:      annualGovernance,
        errorCorrection: errorCostY3,
        modelRefresh:    annualModelRefresh,
        totalCost:       y3Cost,
        fteSaving:       y3Saving,
        netPosition:     y3Net,
      },
    };

    results[scenarioKey] = {
      // Key metrics
      deflection,
      fteReduction,
      ftesFreed,
      annualFteSaving,
      annualTokenCost,
      annualDirectCost,
      totalImplYear1,
      dailyAiVolume: Math.round(dailyAiVolume),

      // Year results
      y1Cost, y1Saving, y1Net,
      y2Cost, y2Saving, y2Net,
      y3Cost, y3Saving, y3Net,

      // Cumulative
      cumCost, cumSaving, cumNet,

      // Financial metrics
      npv,
      roi,
      paybackMonths,

      // Detail
      breakdown,
    };
  });

  return {
    results,
    inputs: {
      baseImpl,
      totalIndirect,
      totalImplYear1,
      annualFteCost,
      inputCostPerM,
      outputCostPerM,
      inputTokens,
      outputTokens,
      ftesFreed: {
        conservative: results.conservative.ftesFreed,
        base:         results.base.ftesFreed,
        aggressive:   results.aggressive.ftesFreed,
      },
    },
  };
}

// ── Format currency ───────────────────────────────────────────────
function formatCurrency(value, currencyCode = 'USD') {
  const config = CURRENCIES[currencyCode] || CURRENCIES.USD;
  const converted = value * config.rate;
  const abs = Math.abs(converted);

  let formatted;
  if (abs >= 1_000_000) {
    formatted = (converted / 1_000_000).toFixed(2) + 'M';
  } else if (abs >= 1_000) {
    formatted = (converted / 1_000).toFixed(1) + 'K';
  } else {
    formatted = converted.toFixed(0);
  }

  return `${config.symbol}${formatted}`;
}

// ── Format full currency (no abbreviation) ────────────────────────
function formatCurrencyFull(value, currencyCode = 'USD') {
  const config = CURRENCIES[currencyCode] || CURRENCIES.USD;
  const converted = value * config.rate;
  return `${config.symbol}${Math.round(converted).toLocaleString()}`;
}

// ── Format percentage ─────────────────────────────────────────────
function formatPct(value) {
  return `${(value * 100).toFixed(1)}%`;
}

// ── Format months ─────────────────────────────────────────────────
function formatMonths(value) {
  if (!value || value < 0) return 'N/A';
  if (value > 36) return '>36 months';
  return `${value.toFixed(1)} months`;
}

// ── Generate interpretation text ──────────────────────────────────
function generateInterpretation(results, currency) {
  const base = results.base;

  if (base.cumNet > 0 && base.npv > 0) {
    return {
      type: 'positive',
      title: '✓ Strong Financial Case',
      text: `The base case shows a positive 3-year net position of ${formatCurrency(base.cumNet, currency)} with an NPV of ${formatCurrency(base.npv, currency)}. Estimated payback period of ${formatMonths(base.paybackMonths)}. Proceed to pilot with confidence — validate assumptions against your specific data environment before scaling.`,
    };
  } else if (results.aggressive.cumNet > 0) {
    return {
      type: 'caution',
      title: '⚡ Conditional Financial Case',
      text: `The base case shows a marginal return. The aggressive scenario (${formatPct(results.aggressive.deflection)} automation) reaches positive NPV of ${formatCurrency(results.aggressive.npv, currency)}. Consider piloting at the conservative rate first to validate performance assumptions before committing to full deployment.`,
    };
  } else {
    return {
      type: 'negative',
      title: '⚠ Review Before Proceeding',
      text: `All three scenarios show negative 3-year returns under current assumptions. Review your data infrastructure readiness, suitability score for this use case, and whether a lower-cost AI type or procurement approach would improve the economics. Do not scale without a validated pilot.`,
    };
  }
}
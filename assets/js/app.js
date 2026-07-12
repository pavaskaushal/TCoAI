// ── App entry point ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // ── 1. Initialize all dropdowns ─────────────────────────────────
  populateCurrencies();
  populateRegions();
  populateSectors();
  updateFteCostHint();
  updateTokenHint();
  updateImplHint();
  updateBenchmark();
  // Populate pricing reference table
  populatePricingTable();
  initTabs();

  // ── 2. Sector cascade ───────────────────────────────────────────
  document.getElementById('sector')?.addEventListener('change', (e) => {
    populateBusinessLines(e.target.value);
    updateBenchmark();
  });

  document.getElementById('business-line')?.addEventListener('change', (e) => {
    const sector = document.getElementById('sector')?.value;
    populateUseCases(sector, e.target.value);
  });

  // ── 3. Currency change ───────────────────────────────────────────
  document.getElementById('currency')?.addEventListener('change', () => {
    updateFteCostHint();
    updateImplHint();
  });

  // ── 4. Region change ─────────────────────────────────────────────
  document.getElementById('region')?.addEventListener('change', () => {
    updateFteCostHint();
  });

  // ── 5. FTE level change ──────────────────────────────────────────
  document.getElementById('fte-level')?.addEventListener('change', () => {
    updateFteCostHint();
  });

  // ── 6. Model tier change ─────────────────────────────────────────
  document.getElementById('model-tier')?.addEventListener('change', () => {
    updateTokenHint();
  });

  // ── 7. AI type + procurement change ─────────────────────────────
  document.getElementById('ai-type')?.addEventListener('change', () => {
    updateImplHint();
  });

  document.getElementById('procurement')?.addEventListener('change', () => {
    updateImplHint();
  });

  document.getElementById('org-size')?.addEventListener('change', () => {
    updateImplHint();
  });

  // ── 8. Range sliders ─────────────────────────────────────────────
  const ranges = [
    'deflection-conservative',
    'deflection-base',
    'deflection-aggressive',
    'fte-reduction-conservative',
    'fte-reduction-base',
    'fte-reduction-aggressive',
  ];

  ranges.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      updateRangeDisplay(id, `${id}-display`);
    });
    // Init display on load
    updateRangeDisplay(id, `${id}-display`);
  });

  // ── 9. Calculate button ──────────────────────────────────────────
  document.getElementById('btn-calculate')?.addEventListener('click', () => {
    calculate();
  });

  // ── 10. Reset button ─────────────────────────────────────────────
  document.getElementById('btn-reset')?.addEventListener('click', () => {
    resetInputs();
  });

  // ── 11. Allow Enter key to trigger calculate ─────────────────────
  document.querySelectorAll('.input-number').forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') calculate();
    });
  });

  // ── 12. Show empty state on load ─────────────────────────────────
  showEmptyState();
});

// ── Main calculate function ───────────────────────────────────────
function calculate() {
  const btn = document.getElementById('btn-calculate');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>Calculating...</span>';
  }

  // Small timeout to allow UI to update before heavy calculation
  setTimeout(() => {
    try {
      const inputs         = collectInputs();
      const { results, inputs: resolved } = runCalculation(inputs);
      const currency       = inputs.currency;

      // Show results panel
      showOutputPanel();

      // Render all UI components
      renderKpiCards(results, currency);
      renderInterpretation(results, currency);
      renderScenarioPills(results, currency);
      renderBreakdownTable(results, currency, 'base');
      initScenarioTabs(results, currency);

      // Render all charts
      renderAllCharts(results, resolved, currency, inputs.workingDays);

      // Animate results in
      document.querySelectorAll('.animate-in').forEach((el, i) => {
        el.style.animationDelay = `${i * 0.05}s`;
      });

      // Scroll to results on mobile
      if (window.innerWidth <= 1024) {
        document.getElementById('results-panel')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }

    } catch (err) {
      console.error('Calculation error:', err);
      const box = document.getElementById('interpretation-box');
      if (box) {
        box.className = 'interpretation interpretation--negative';
        box.innerHTML = `
          <div class="interpretation__title">⚠ Calculation Error</div>
          <div>Something went wrong. Please check your inputs and try again. Error: ${err.message}</div>
        `;
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>Calculate TCoAI</span>';
      }
    }
  }, 50);
}
// ── Tab switching ─────────────────────────────────────────────────
function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const target = document.getElementById(`tab-${tab.dataset.tab}`);
      if (target) target.classList.add('active');
    });
  });
}
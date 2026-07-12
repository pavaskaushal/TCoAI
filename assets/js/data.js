// ── Currency config ───────────────────────────────────────────────
const CURRENCIES = {
  USD: { symbol: '$', name: 'US Dollar',        rate: 1 },
  INR: { symbol: '₹', name: 'Indian Rupee',     rate: 83.5 },
  GBP: { symbol: '£', name: 'British Pound',    rate: 0.79 },
  EUR: { symbol: '€', name: 'Euro',             rate: 0.92 },
  AED: { symbol: 'AED', name: 'UAE Dirham',     rate: 3.67 },
};

// ── Region FTE costs (fully loaded annual, USD) ───────────────────
const FTE_COSTS = {
  'India':          { junior: 12000,  mid: 25000,  senior: 55000  },
  'Southeast Asia': { junior: 18000,  mid: 35000,  senior: 70000  },
  'Middle East':    { junior: 30000,  mid: 60000,  senior: 110000 },
  'Europe':         { junior: 55000,  mid: 90000,  senior: 150000 },
  'North America':  { junior: 65000,  mid: 110000, senior: 180000 },
  'Global Average': { junior: 40000,  mid: 75000,  senior: 130000 },
};

// ── Token pricing (USD per 1M tokens, July 2026) ──────────────────
const TOKEN_PRICING = {
  'Flash':       { input: 0.15,  output: 0.60,  label: 'Flash Tier',    example: 'Gemini Flash, GPT-4o mini'  },
  'Mid':         { input: 1.25,  output: 5.00,  label: 'Mid Tier',      example: 'Gemini Pro, Claude Haiku'   },
  'Frontier':    { input: 2.75,  output: 12.50, label: 'Frontier Tier', example: 'GPT-4o, Claude Sonnet'      },
  'Open Source': { input: 0.28,  output: 0.86,  label: 'Open Source',   example: 'Llama 3.1 405B via Together AI' },
};

// ── Avg tokens per transaction by use case type ───────────────────
const TOKEN_VOLUMES = {
  'Simple query / routing':        { input: 200,  output: 150  },
  'Customer service interaction':  { input: 500,  output: 400  },
  'Document processing':           { input: 1500, output: 500  },
  'Complex analysis / report':     { input: 3000, output: 1500 },
  'Long document generation':      { input: 5000, output: 3000 },
};

// ── Implementation costs by AI type (USD, mid-size org default) ───
const IMPL_COSTS = {
  'Generative AI':   { small: 50000,  mid: 150000, large: 400000,  enterprise: 1000000 },
  'Predictive AI':   { small: 75000,  mid: 200000, large: 500000,  enterprise: 1500000 },
  'RPA':             { small: 30000,  mid: 75000,  large: 200000,  enterprise: 500000  },
  'Computer Vision': { small: 100000, mid: 300000, large: 750000,  enterprise: 2000000 },
};

// ── Procurement approach cost multipliers ─────────────────────────
const PROCUREMENT_MULTIPLIERS = {
  'API':          { impl: 0.4,  ongoingAdj: 0    },
  'Buy (SaaS)':   { impl: 0.6,  ongoingAdj: 0.08 },
  'Build':        { impl: 2.0,  ongoingAdj: -0.03 },
  'Open Source':  { impl: 1.2,  ongoingAdj: 0.02 },
};

// ── Org size keys ─────────────────────────────────────────────────
const ORG_SIZE_KEYS = {
  'Small':      'small',
  'Mid-size':   'mid',
  'Large':      'large',
  'Enterprise': 'enterprise',
};

// ── Sector → Business lines → Use cases ──────────────────────────
const SECTORS = {
  'BFSI': {
    'Retail Banking': [
      'Fraud Detection & Cybersecurity',
      'Customer Service Automation',
      'Credit Scoring & Loan Decisioning',
      'KYC / AML Automation',
    ],
    'Corporate Banking': [
      'Regulatory Compliance Monitoring',
      'Credit Risk Modeling',
      'Trade Finance Document Processing',
      'Relationship Manager Support',
    ],
    'Wealth Management': [
      'Robo-Advisory & Portfolio Optimization',
      'Client Reporting Automation',
      'Market Sentiment Analysis',
      'Personalized Investment Recommendations',
    ],
    'Insurance': [
      'Underwriting Automation',
      'Claims Processing',
      'Fraud Detection',
      'Customer Onboarding',
    ],
  },

  'Healthcare': {
    'Clinical Operations': [
      'Diagnostic Imaging AI',
      'Clinical Documentation Automation',
      'Patient Risk Scoring',
      'Surgical Assistance',
    ],
    'Drug Discovery & R&D': [
      'Molecule Design & Screening',
      'Clinical Trial Optimization',
      'Scientific Literature Synthesis',
      'Biomarker Identification',
    ],
    'Hospital Administration': [
      'Billing & Coding Automation',
      'Scheduling Optimization',
      'Supply Chain Management',
      'Staff Rostering',
    ],
    'Patient Experience': [
      'AI-Powered Triage',
      'Remote Patient Monitoring',
      'Discharge Planning',
      'Personalized Care Pathways',
    ],
  },

  'Retail': {
    'E-commerce': [
      'Personalization & Recommendation Engine',
      'Dynamic Pricing',
      'Search Optimization',
      'Customer Journey Analytics',
    ],
    'Physical Retail': [
      'Computer Vision Checkout',
      'Loss Prevention',
      'In-Store Traffic Analytics',
      'Shelf Management & Planogram Compliance',
    ],
    'Supply Chain & Logistics': [
      'Demand Forecasting',
      'Inventory Optimization',
      'Last-Mile Delivery Optimization',
      'Supplier Risk Assessment',
    ],
    'Marketing & Customer Experience': [
      'Campaign Personalization',
      'Customer Service Automation',
      'Sentiment Analysis',
      'Loyalty Program Optimization',
    ],
  },

  'Telecom': {
    'Network Operations': [
      'Network Performance Optimization',
      'Predictive Maintenance',
      '5G Traffic Management',
      'Anomaly Detection',
    ],
    'Revenue Assurance & Fraud (RAFM)': [
      'Revenue Leakage Detection',
      'Interconnect Billing Fraud Detection',
      'Subscription Fraud Prevention',
      'Roaming Analytics',
    ],
    'Customer Operations': [
      'Churn Prediction & Retention',
      'AI-Powered Customer Support',
      'Personalized Plan Recommendations',
      'Complaint Resolution Automation',
    ],
    'Product & Service Development': [
      'Network-as-a-Service Product Design',
      'API Monetization Analytics',
      'Digital Product Testing',
      'Service Bundling Optimization',
    ],
  },

  'Manufacturing': {
    'Production & Operations': [
      'Predictive Maintenance',
      'Quality Control & Defect Detection',
      'Production Scheduling Optimization',
      'OEE Improvement via Digital Twins',
    ],
    'Supply Chain': [
      'Demand-Driven Production Planning',
      'Supplier Performance Monitoring',
      'Raw Material Procurement Analytics',
      'Logistics Optimization',
    ],
    'Product Design & Engineering': [
      'Generative Design',
      'Simulation & Testing Acceleration',
      'Technical Documentation Generation',
      'Materials Discovery',
    ],
    'Safety & Compliance': [
      'Worker Safety Monitoring',
      'Environmental Monitoring',
      'Incident Prediction & Prevention',
      'Regulatory Compliance Tracking',
    ],
  },
};

// ── Default indirect cost percentages ────────────────────────────
const INDIRECT_DEFAULTS = {
  integration:      0.30,
  dataPrep:         0.25,
  changeManagement: 0.20,
  projectMgmt:      0.10,
};

// ── Default ongoing cost percentages (of base impl cost) ─────────
const ONGOING_DEFAULTS = {
  maintenance:  0.15,
  governance:   0.10,
  errorY1:      0.08,
  errorY2:      0.05,
  errorY3:      0.03,
  modelRefresh: 0.05,
};

// ── Scenario defaults ─────────────────────────────────────────────
const SCENARIO_DEFAULTS = {
  conservative: { deflection: 0.35, fteReduction: 0.30, label: 'Conservative', color: '#D97706' },
  base:         { deflection: 0.55, fteReduction: 0.50, label: 'Base Case',    color: '#16A34A' },
  aggressive:   { deflection: 0.75, fteReduction: 0.70, label: 'Aggressive',   color: '#DC2626' },
};

// ── Financial model defaults ──────────────────────────────────────
const FINANCIAL_DEFAULTS = {
  discountRate:  0.10,
  taxRate:       0.25,
  workingDays:   250,
};

// ── Chart colors ──────────────────────────────────────────────────
const CHART_COLORS = {
  conservative: { bg: 'rgba(217,119,6,0.15)',  border: '#D97706' },
  base:         { bg: 'rgba(22,163,74,0.15)',  border: '#16A34A' },
  aggressive:   { bg: 'rgba(220,38,38,0.15)',  border: '#DC2626' },
  cost:         { bg: 'rgba(26,111,191,0.15)', border: '#1A6FBF' },
  saving:       { bg: 'rgba(0,180,216,0.15)',  border: '#00B4D8' },
};

// ── ROI benchmark data (from white paper research) ────────────────
const ROI_BENCHMARKS = {
  'BFSI':          { topUseCase: 'Cybersecurity AI',     roi: '+27 pt ROI gap vs expectations', source: 'Deloitte 2026'       },
  'Healthcare':    { topUseCase: 'Drug Discovery R&D',   roi: '3–5x development speed',          source: 'Stanford HAI 2024'   },
  'Retail':        { topUseCase: 'Marketing Personalization', roi: '67% report revenue increase', source: 'McKinsey 2025'      },
  'Telecom':       { topUseCase: 'Network Operations',   roi: '56% report cost decrease',        source: 'McKinsey 2025'      },
  'Manufacturing': { topUseCase: 'Predictive Maintenance', roi: '55% cost decrease',             source: 'McKinsey AI Index'   },
};
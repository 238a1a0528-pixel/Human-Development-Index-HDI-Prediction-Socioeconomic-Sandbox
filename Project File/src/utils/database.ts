/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DatabaseState, User, Country, HDIInputData, MLModel, HDIPrediction, Dataset, VisualizationReport, Session } from '../types';

// Standard UNDP Formula for HDI
export function calculateUNDP_HDI(lifeExp: number, expSchooling: number, meanSchooling: number, gni: number) {
  // 1. Life Expectancy Index (LEI) = (LE - 20) / (85 - 20)
  const lei = Math.max(0, Math.min(1, (lifeExp - 20) / (85 - 20)));

  // 2. Education Index (EI)
  // Mean Schooling Index (MSI) = MS / 15
  // Expected Schooling Index (ESI) = ES / 18
  const msi = Math.max(0, Math.min(1, meanSchooling / 15));
  const esi = Math.max(0, Math.min(1, expSchooling / 18));
  const ei = (msi + esi) / 2;

  // 3. Income Index (II) = (ln(GNI) - ln(100)) / (ln(75000) - ln(100))
  // GNI is clamped to 100 on low end, 75000 on high end (UNDP standard)
  const clampedGNI = Math.max(100, Math.min(75000, gni));
  const ii = Math.max(0, Math.min(1, (Math.log(clampedGNI) - Math.log(100)) / (Math.log(75000) - Math.log(100))));

  // 4. HDI is the geometric mean
  const geometricMean = Math.pow(lei * ei * ii, 1 / 3);
  const hdi = parseFloat(geometricMean.toFixed(3));

  return {
    life_expectancy_idx: parseFloat(lei.toFixed(3)),
    education_idx: parseFloat(ei.toFixed(3)),
    income_idx: parseFloat(ii.toFixed(3)),
    geometric_mean: hdi
  };
}

// Predictor mapping for simulated ML models
export function runModelPrediction(modelId: string, indicators: Omit<HDIInputData, 'input_id' | 'user_id' | 'country_id' | 'created_at'>) {
  const baseResult = calculateUNDP_HDI(
    indicators.life_expectancy,
    indicators.expected_schooling,
    indicators.mean_schooling,
    indicators.gni_pc
  );

  let noise = 0;
  let confidenceRange = '';

  if (modelId === 'MDL-001') { // Random Forest
    // Simulate slight tree-ensemble smoothing noise
    noise = (Math.sin(indicators.life_expectancy) * 0.005) + (Math.cos(indicators.gni_pc) * 0.003);
    confidenceRange = `${(baseResult.geometric_mean + noise - 0.008).toFixed(3)} - ${(baseResult.geometric_mean + noise + 0.008).toFixed(3)}`;
  } else if (modelId === 'MDL-002') { // Neural Network
    // Neural nets can have slight non-linearities and extrapolation offsets
    noise = (Math.cos(indicators.expected_schooling) * 0.008) - (Math.sin(indicators.mean_schooling) * 0.004);
    confidenceRange = `${(baseResult.geometric_mean + noise - 0.012).toFixed(3)} - ${(baseResult.geometric_mean + noise + 0.012).toFixed(3)}`;
  } else if (modelId === 'MDL-003') { // Ridge Regression
    // Linear model is often biased on logarithmic income curve, let's reflect that
    const incomeDiff = Math.log10(indicators.gni_pc) - 4.0;
    noise = incomeDiff * 0.015 - 0.01;
    confidenceRange = `${(baseResult.geometric_mean + noise - 0.018).toFixed(3)} - ${(baseResult.geometric_mean + noise + 0.018).toFixed(3)}`;
  } else {
    // UNDP Formula (Standard/Analytical)
    noise = 0;
    confidenceRange = `${baseResult.geometric_mean.toFixed(3)} - ${baseResult.geometric_mean.toFixed(3)}`;
  }

  const predictedHdi = parseFloat(Math.max(0.2, Math.min(1.0, baseResult.geometric_mean + noise)).toFixed(3));

  return {
    predictedHdi,
    confidenceRange,
    breakdown: baseResult
  };
}

// Key for Local Storage
const STORAGE_KEY = 'hdi_prediction_db';

// Initial Seed Data
const initialUsers: User[] = [
  {
    user_id: 'USR-001',
    name: 'Dr. Sarah Jenkins',
    email: 'jenkins.s@undp.org',
    role: 'Lead Analyst',
    created_at: '2026-01-10T09:00:00Z'
  },
  {
    user_id: 'USR-002',
    name: 'Dr. Elena Rostova',
    email: 'e.rostova@undp.org',
    role: 'Policy Researcher',
    created_at: '2026-02-14T10:30:00Z'
  },
  {
    user_id: 'USR-003',
    name: 'Marcus Vance',
    email: 'm.vance@un.org',
    role: 'Administrator',
    created_at: '2026-03-01T08:00:00Z'
  },
  {
    user_id: 'USR-004',
    name: 'Guest Reviewer',
    email: 'guest@hdi-sandbox.org',
    role: 'Guest Observer',
    created_at: '2026-07-01T12:00:00Z'
  }
];

const initialCountries: Country[] = [
  { country_id: 'NOR', name: 'Norway', region: 'Europe & Central Asia', population: 5.4, base_hdi: 0.962 },
  { country_id: 'CHE', name: 'Switzerland', region: 'Europe & Central Asia', population: 8.7, base_hdi: 0.967 },
  { country_id: 'USA', name: 'United States', region: 'North America', population: 333.2, base_hdi: 0.921 },
  { country_id: 'JPN', name: 'Japan', region: 'East Asia & Pacific', population: 125.1, base_hdi: 0.925 },
  { country_id: 'BRA', name: 'Brazil', region: 'Latin America & Caribbean', population: 214.3, base_hdi: 0.754 },
  { country_id: 'IND', name: 'India', region: 'South Asia', population: 1408.0, base_hdi: 0.644 },
  { country_id: 'ZAF', name: 'South Africa', region: 'Sub-Saharan Africa', population: 59.8, base_hdi: 0.713 },
  { country_id: 'NGA', name: 'Nigeria', region: 'Sub-Saharan Africa', population: 218.5, base_hdi: 0.535 },
  { country_id: 'KEN', name: 'Kenya', region: 'Sub-Saharan Africa', population: 53.0, base_hdi: 0.601 },
  { country_id: 'SGP', name: 'Singapore', region: 'East Asia & Pacific', population: 5.6, base_hdi: 0.949 },
  { country_id: 'AUS', name: 'Australia', region: 'East Asia & Pacific', population: 25.6, base_hdi: 0.951 },
  { country_id: 'EGY', name: 'Egypt', region: 'Middle East & North Africa', population: 109.3, base_hdi: 0.731 }
];

const initialDatasets: Dataset[] = [
  {
    dataset_id: 'DST-001',
    name: 'UN Human Development Historical Panel v2024',
    source: 'United Nations Development Programme (UNDP)',
    records_count: 5420,
    description: 'Comprehensive annual country indicators encompassing lifespans, schooling pathways, and gross national income per capita for 195+ sovereign countries over three decades.',
    release_year: 2024
  },
  {
    dataset_id: 'DST-002',
    name: 'World Bank Education & Health Panel Survey',
    source: 'World Bank Group Open Data',
    records_count: 3120,
    description: 'Global records tracking economic parameters, state literacy quotas, life expectation ratios, and capital distribution indexes.',
    release_year: 2025
  },
  {
    dataset_id: 'DST-003',
    name: 'Global Sustainability & Development Indicators v1',
    source: 'OECD iLibrary',
    records_count: 1450,
    description: 'Specialized socioeconomic assessment records containing education indices, health outcomes, and logarithmic carbon-adjusted earnings.',
    release_year: 2026
  }
];

const initialMlModels: MLModel[] = [
  {
    model_id: 'MDL-001',
    name: 'Random Forest Regressor (Ensemble v2.4)',
    algorithm_type: 'Decision Trees Ensemble',
    r_squared: 0.982,
    mean_squared_error: 0.0004,
    hyperparams: { n_estimators: 150, max_depth: 12, min_samples_split: 4, random_state: 42 },
    training_dataset_id: 'DST-001'
  },
  {
    model_id: 'MDL-002',
    name: 'Deep Multi-Layer Perceptron (Neural Net v4)',
    algorithm_type: 'Artificial Neural Network',
    r_squared: 0.975,
    mean_squared_error: 0.0006,
    hyperparams: { hidden_layers: '64x32x16', activation: 'ReLU', learning_rate: 0.005, epochs: 200 },
    training_dataset_id: 'DST-001'
  },
  {
    model_id: 'MDL-003',
    name: 'Regularized Ridge Linear Regressor',
    algorithm_type: 'Ridge Regression',
    r_squared: 0.941,
    mean_squared_error: 0.0014,
    hyperparams: { alpha: 1.0, normalize: true, max_iter: 1000 },
    training_dataset_id: 'DST-002'
  },
  {
    model_id: 'MDL-004',
    name: 'Analytical Mathematical Engine (Baseline)',
    algorithm_type: 'Exact UNDP Formula',
    r_squared: 1.0,
    mean_squared_error: 0.0,
    hyperparams: { precision: '3-decimals', strict_clamping: true },
    training_dataset_id: 'DST-001'
  }
];

const initialSessions: Session[] = [
  {
    session_id: 'SES-101',
    user_id: 'USR-001',
    start_time: '2026-07-08T08:00:00Z',
    end_time: null,
    ip_address: '10.12.94.3',
    platform: 'Google AI Studio Client (Chrome)',
    activities_count: 5
  },
  {
    session_id: 'SES-102',
    user_id: 'USR-002',
    start_time: '2026-07-07T13:20:00Z',
    end_time: '2026-07-07T15:40:00Z',
    ip_address: '192.168.4.120',
    platform: 'Vivaldi / MacOS Sequoia',
    activities_count: 14
  }
];

const initialInputs: HDIInputData[] = [
  {
    input_id: 'INP-201',
    user_id: 'USR-001',
    country_id: 'IND',
    life_expectancy: 71.5,
    expected_schooling: 13.5,
    mean_schooling: 8.5,
    gni_pc: 9800,
    created_at: '2026-07-08T08:15:00Z'
  },
  {
    input_id: 'INP-202',
    user_id: 'USR-002',
    country_id: 'KEN',
    life_expectancy: 64.2,
    expected_schooling: 12.0,
    mean_schooling: 7.2,
    gni_pc: 6200,
    created_at: '2026-07-07T13:45:00Z'
  }
];

const initialPredictions: HDIPrediction[] = [
  {
    prediction_id: 'PRD-301',
    input_id: 'INP-201',
    model_id: 'MDL-001',
    predicted_hdi: 0.708,
    confidence_interval: '0.701 - 0.715',
    calculation_breakdown: {
      life_expectancy_idx: 0.792,
      education_idx: 0.683,
      income_idx: 0.655,
      geometric_mean: 0.708
    },
    created_at: '2026-07-08T08:15:05Z'
  },
  {
    prediction_id: 'PRD-302',
    input_id: 'INP-202',
    model_id: 'MDL-002',
    predicted_hdi: 0.622,
    confidence_interval: '0.612 - 0.632',
    calculation_breakdown: {
      life_expectancy_idx: 0.680,
      education_idx: 0.573,
      income_idx: 0.622,
      geometric_mean: 0.622
    },
    created_at: '2026-07-07T13:45:10Z'
  }
];

const initialReports: VisualizationReport[] = [
  {
    report_id: 'REP-401',
    prediction_id: 'PRD-301',
    title: 'India Development Leap Analysis',
    notes: 'Simulating an increase in schooling parameters alongside an increase in health indices.',
    chart_data_json: JSON.stringify([
      { name: 'Life Expectancy Index', value: 0.792, max: 1.0 },
      { name: 'Education Index', value: 0.683, max: 1.0 },
      { name: 'Income Index', value: 0.655, max: 1.0 },
      { name: 'Composite Predicted HDI', value: 0.708, max: 1.0 }
    ]),
    report_markdown: `### Policy Analysis Report: India Leap Scenario

**Prediction Summary:** 
With an elevated Life Expectancy of **71.5 years**, Expected Schooling of **13.5 years**, and GNI per Capita of **$9,800**, the **Random Forest Regressor (Ensemble v2.4)** predicts a human development rating of **0.708** (High Human Development).

#### Key Policy Findings:
1. **Strongest Driver:** The health expansion (71.5 years life expectancy) raises the Life Expectancy Index to **0.792**, acting as the main anchor of development in this simulated scenario.
2. **Education Trajectory:** Mean schooling of 8.5 years represents a critical growth node. Raising expected years to 13.5 points to strong secondary enrollments.
3. **Income Scaling Potential:** While GNI per capita at $9,800 results in an Income Index of **0.655**, additional capital investments in technical education will accelerate productivity and compound overall gains.

#### Development Strategy Recommendations:
- **Accelerate School Completion:** Implement retention stipends for girls transitioning from primary to secondary education.
- **Universal Secondary Healthcare:** Expand primary health clinics in tier-2 cities to secure the simulated 71.5-year target.`,
    created_at: '2026-07-08T08:15:30Z'
  },
  {
    report_id: 'REP-402',
    prediction_id: 'PRD-302',
    title: 'Kenya Infrastructure Uplift Assessment',
    notes: 'Modeling structural education and income improvements for Kenya.',
    chart_data_json: JSON.stringify([
      { name: 'Life Expectancy Index', value: 0.680, max: 1.0 },
      { name: 'Education Index', value: 0.573, max: 1.0 },
      { name: 'Income Index', value: 0.622, max: 1.0 },
      { name: 'Composite Predicted HDI', value: 0.622, max: 1.0 }
    ]),
    report_markdown: `### Policy Analysis Report: Kenya Structural Scenario

**Prediction Summary:**
Under the simulated health, education, and income parameters, the **Deep Neural Network (MLP v4)** outputs an HDI of **0.622** (Medium Human Development).

#### Strategic Review:
- **Education Gaps:** The education index (**0.573**) lags behind other indicators, showing that mean schooling hours are a major systemic bottleneck.
- **Economic Resilience:** GNI of $6,200 brings the income component to **0.622**, reflecting healthy progress on agricultural value-addition.

#### Recommended Interventions:
- Focus heavily on adult literacy programs to elevate the **Mean Years of Schooling** index immediately.
- Integrate climate-smart farming techniques to stabilize food supply lines, lifting lifespans.`,
    created_at: '2026-07-07T13:46:00Z'
  }
];

export function getInitialDatabase(): DatabaseState {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.users)) {
        parsed.users = parsed.users.map((u: any) => {
          if (u.name === 'Mule Amareswari' || u.user_id === 'USR-001') {
            return {
              ...u,
              user_id: 'USR-001',
              name: 'Dr. Sarah Jenkins',
              email: 'jenkins.s@undp.org',
              role: 'Lead Analyst'
            };
          }
          if (u.user_id === 'USR-002' && u.name === 'Dr. Sarah Jenkins') {
            return {
              ...u,
              user_id: 'USR-002',
              name: 'Dr. Elena Rostova',
              email: 'e.rostova@undp.org',
              role: 'Policy Researcher'
            };
          }
          return u;
        });
        // Save the cleaned-up version back
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
      return parsed;
    } catch (e) {
      console.error("Error loading saved database state, resetting.", e);
    }
  }

  const db: DatabaseState = {
    users: initialUsers,
    countries: initialCountries,
    hdi_inputs: initialInputs,
    ml_models: initialMlModels,
    hdi_predictions: initialPredictions,
    datasets: initialDatasets,
    visualization_reports: initialReports,
    sessions: initialSessions
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  return db;
}

export function saveDatabaseState(db: DatabaseState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

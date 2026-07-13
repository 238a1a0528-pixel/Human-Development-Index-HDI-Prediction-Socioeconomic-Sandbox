/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  user_id: string; // PK
  name: string;
  email: string;
  role: 'Administrator' | 'Lead Analyst' | 'Policy Researcher' | 'Guest Observer';
  created_at: string;
}

export interface Country {
  country_id: string; // PK (ISO 3-letter)
  name: string;
  region: 'Europe & Central Asia' | 'East Asia & Pacific' | 'Latin America & Caribbean' | 'South Asia' | 'Sub-Saharan Africa' | 'Middle East & North Africa' | 'North America';
  population: number; // in millions
  base_hdi: number;
}

export interface HDIInputData {
  input_id: string; // PK
  user_id: string; // FK to User
  country_id: string; // FK to Country
  life_expectancy: number; // Health index indicator
  expected_schooling: number; // Education index indicator 1
  mean_schooling: number; // Education index indicator 2
  gni_pc: number; // Income index indicator (GNI per capita, USD)
  created_at: string;
}

export interface MLModel {
  model_id: string; // PK
  name: string;
  algorithm_type: string;
  r_squared: number;
  mean_squared_error: number;
  hyperparams: Record<string, string | number | boolean>;
  training_dataset_id: string; // FK to Dataset
}

export interface HDIPrediction {
  prediction_id: string; // PK
  input_id: string; // FK to HDI Input Data
  model_id: string; // FK to ML Model
  predicted_hdi: number;
  confidence_interval: string; // e.g., "[0.895, 0.915]"
  calculation_breakdown: {
    life_expectancy_idx: number;
    education_idx: number;
    income_idx: number;
    geometric_mean: number;
  };
  created_at: string;
}

export interface Dataset {
  dataset_id: string; // PK
  name: string;
  source: string;
  records_count: number;
  description: string;
  release_year: number;
}

export interface VisualizationReport {
  report_id: string; // PK
  prediction_id: string; // FK to HDI Prediction
  title: string;
  notes: string;
  chart_data_json: string; // JSON string of dimensions for charting
  report_markdown: string; // Gemini AI generated summary & recommendations
  created_at: string;
}

export interface Session {
  session_id: string; // PK
  user_id: string; // FK to User
  start_time: string;
  end_time: string | null;
  ip_address: string;
  platform: string;
  activities_count: number;
}

export interface DatabaseState {
  users: User[];
  countries: Country[];
  hdi_inputs: HDIInputData[];
  ml_models: MLModel[];
  hdi_predictions: HDIPrediction[];
  datasets: Dataset[];
  visualization_reports: VisualizationReport[];
  sessions: Session[];
}

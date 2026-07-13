/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { DatabaseState, Country, MLModel, HDIInputData, HDIPrediction, VisualizationReport } from '../types';
import { calculateUNDP_HDI, runModelPrediction } from '../utils/database';
import { Play, RotateCcw, AlertTriangle, Save, Heart, GraduationCap, DollarSign, Cpu, CheckCircle, FileText, Sparkles, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface HDIPredictionFormProps {
  db: DatabaseState;
  activeUserId: string;
  onPredictionSaved: (
    input: HDIInputData,
    prediction: HDIPrediction,
    report: VisualizationReport
  ) => void;
}

export default function HDIPredictionForm({ db, activeUserId, onPredictionSaved }: HDIPredictionFormProps) {
  // Available models
  const models = db.ml_models;

  // Selected Country to load presets
  const [selectedCountryId, setSelectedCountryId] = useState<string>('IND');

  // Indicators State
  const [lifeExpectancy, setLifeExpectancy] = useState<number>(67.2);
  const [expectedSchooling, setExpectedSchooling] = useState<number>(11.9);
  const [meanSchooling, setMeanSchooling] = useState<number>(6.7);
  const [gniPerCapita, setGniPerCapita] = useState<number>(6590);

  // Model selection
  const [selectedModelId, setSelectedModelId] = useState<string>('MDL-001');

  // Simulation run state
  const [isPredicting, setIsPredicting] = useState<boolean>(false);
  const [predictionResult, setPredictionResult] = useState<{
    input: Omit<HDIInputData, 'input_id' | 'user_id' | 'country_id' | 'created_at'>;
    prediction: HDIPrediction;
    reportMarkdown: string;
  } | null>(null);

  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Sync parameters when country preset changes
  useEffect(() => {
    const country = db.countries.find(c => c.country_id === selectedCountryId);
    if (country) {
      // Find matching previous input record to get standard metrics, or default to realistic standards
      if (country.country_id === 'NOR') {
        setLifeExpectancy(83.2); setExpectedSchooling(18.9); setMeanSchooling(13.1); setGniPerCapita(66100);
      } else if (country.country_id === 'CHE') {
        setLifeExpectancy(84.0); setExpectedSchooling(16.5); setMeanSchooling(13.9); setGniPerCapita(66900);
      } else if (country.country_id === 'USA') {
        setLifeExpectancy(77.2); setExpectedSchooling(16.3); setMeanSchooling(13.7); setGniPerCapita(64700);
      } else if (country.country_id === 'JPN') {
        setLifeExpectancy(84.8); setExpectedSchooling(15.2); setMeanSchooling(12.9); setGniPerCapita(42200);
      } else if (country.country_id === 'BRA') {
        setLifeExpectancy(72.8); setExpectedSchooling(15.6); setMeanSchooling(8.1); setGniPerCapita(14300);
      } else if (country.country_id === 'IND') {
        setLifeExpectancy(67.2); setExpectedSchooling(11.9); setMeanSchooling(6.7); setGniPerCapita(6590);
      } else if (country.country_id === 'ZAF') {
        setLifeExpectancy(62.3); setExpectedSchooling(13.6); setMeanSchooling(10.2); setGniPerCapita(12900);
      } else if (country.country_id === 'NGA') {
        setLifeExpectancy(52.7); setExpectedSchooling(10.1); setMeanSchooling(5.2); setGniPerCapita(4900);
      } else if (country.country_id === 'KEN') {
        setLifeExpectancy(60.1); setExpectedSchooling(11.3); setMeanSchooling(6.8); setGniPerCapita(4500);
      } else if (country.country_id === 'SGP') {
        setLifeExpectancy(83.5); setExpectedSchooling(16.5); setMeanSchooling(11.9); setGniPerCapita(65200);
      } else if (country.country_id === 'AUS') {
        setLifeExpectancy(83.2); setExpectedSchooling(17.9); setMeanSchooling(12.7); setGniPerCapita(49200);
      } else if (country.country_id === 'EGY') {
        setLifeExpectancy(70.2); setExpectedSchooling(13.8); setMeanSchooling(9.6); setGniPerCapita(11800);
      }
      setPredictionResult(null);
      setSaveSuccess(false);
    }
  }, [selectedCountryId, db]);

  // Real-time standard index previews
  const liveUndp = calculateUNDP_HDI(lifeExpectancy, expectedSchooling, meanSchooling, gniPerCapita);

  const handleReset = () => {
    setSelectedCountryId('IND');
    setLifeExpectancy(67.2);
    setExpectedSchooling(11.9);
    setMeanSchooling(6.7);
    setGniPerCapita(6590);
    setPredictionResult(null);
    setSaveSuccess(false);
  };

  const handlePredict = async () => {
    setIsPredicting(true);
    setSaveSuccess(false);

    const model = models.find(m => m.model_id === selectedModelId)!;
    const countryObj = db.countries.find(c => c.country_id === selectedCountryId)!;

    // Run ML Model prediction
    const indicators = {
      life_expectancy: lifeExpectancy,
      expected_schooling: expectedSchooling,
      mean_schooling: meanSchooling,
      gni_pc: gniPerCapita
    };

    const predObj = runModelPrediction(selectedModelId, indicators);

    // Call server API for Gemini recommendations report
    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          country_name: countryObj.name,
          life_expectancy: lifeExpectancy,
          expected_schooling: expectedSchooling,
          mean_schooling: meanSchooling,
          gni_pc: gniPerCapita,
          model_name: model.name,
          predicted_hdi: predObj.predictedHdi,
          confidence_interval: predObj.confidenceRange
        })
      });

      const data = await response.json();

      const input_id = `INP-${Math.floor(100 + Math.random() * 900)}`;
      const prediction_id = `PRD-${Math.floor(100 + Math.random() * 900)}`;

      const prediction: HDIPrediction = {
        prediction_id,
        input_id,
        model_id: selectedModelId,
        predicted_hdi: predObj.predictedHdi,
        confidence_interval: predObj.confidenceRange,
        calculation_breakdown: predObj.breakdown,
        created_at: new Date().toISOString()
      };

      setPredictionResult({
        input: indicators,
        prediction,
        reportMarkdown: data.report
      });
    } catch (err) {
      console.error("Prediction analysis failed:", err);
      // Construct fallback locally if error
      const input_id = `INP-${Math.floor(100 + Math.random() * 900)}`;
      const prediction_id = `PRD-${Math.floor(100 + Math.random() * 900)}`;

      const prediction: HDIPrediction = {
        prediction_id,
        input_id,
        model_id: selectedModelId,
        predicted_hdi: predObj.predictedHdi,
        confidence_interval: predObj.confidenceRange,
        calculation_breakdown: predObj.breakdown,
        created_at: new Date().toISOString()
      };

      setPredictionResult({
        input: indicators,
        prediction,
        reportMarkdown: `### Policy Analysis Report: ${countryObj.name} (Analytical Mode)
        
- **Composite Predicted HDI**: **${predObj.predictedHdi}**
- **Confidence Interval**: ${predObj.confidenceRange}

#### Core Dimension Performance:
- **Life Expectancy Index**: **${predObj.breakdown.life_expectancy_idx}**
- **Education Index**: **${predObj.breakdown.education_idx}**
- **Income Index**: **${predObj.breakdown.income_idx}**

*Note: Please check network status. To activate full AI policy narratives, configure a valid GEMINI_API_KEY.*`
      });
    } finally {
      setIsPredicting(false);
    }
  };

  const handleSaveResult = () => {
    if (!predictionResult) return;

    const input_id = predictionResult.prediction.input_id;
    const prediction_id = predictionResult.prediction.prediction_id;
    const report_id = `REP-${Math.floor(100 + Math.random() * 900)}`;

    const countryObj = db.countries.find(c => c.country_id === selectedCountryId)!;
    const model = models.find(m => m.model_id === selectedModelId)!;

    const inputRecord: HDIInputData = {
      input_id,
      user_id: activeUserId,
      country_id: selectedCountryId,
      ...predictionResult.input,
      created_at: new Date().toISOString()
    };

    const predictionRecord: HDIPrediction = {
      ...predictionResult.prediction,
      created_at: new Date().toISOString()
    };

    const reportRecord: VisualizationReport = {
      report_id,
      prediction_id,
      title: `${countryObj.name} ${model.name.split(' ')[0]} Policy Brief`,
      notes: `Custom run for ${countryObj.name} with LE: ${lifeExpectancy}, EYS: ${expectedSchooling}, MYS: ${meanSchooling}, GNI: $${gniPerCapita}`,
      chart_data_json: JSON.stringify([
        { name: 'Life Expectancy Index', value: predictionResult.prediction.calculation_breakdown.life_expectancy_idx, max: 1.0 },
        { name: 'Education Index', value: predictionResult.prediction.calculation_breakdown.education_idx, max: 1.0 },
        { name: 'Income Index', value: predictionResult.prediction.calculation_breakdown.income_idx, max: 1.0 },
        { name: 'Predicted Composite HDI', value: predictionResult.prediction.predicted_hdi, max: 1.0 }
      ]),
      report_markdown: predictionResult.reportMarkdown,
      created_at: new Date().toISOString()
    };

    onPredictionSaved(inputRecord, predictionRecord, reportRecord);
    setSaveSuccess(true);
  };

  const getHdiLevel = (val: number) => {
    if (val >= 0.800) return { label: 'Very High Development', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    if (val >= 0.700) return { label: 'High Development', color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' };
    if (val >= 0.550) return { label: 'Medium Development', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    return { label: 'Low Development', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="hdi-simulator-view">
      {/* Parameters Panel */}
      <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="p-1.5 bg-sky-500/10 rounded-lg text-sky-400">
              <Cpu className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold text-slate-100">Dimension Simulator</h3>
          </div>

          <p className="text-slate-400 text-xs mb-6 leading-relaxed">
            Adjust country metrics to simulate alternative policy pathways. Observe the immediate impact on the UNDP baseline indices in the sidebar widgets.
          </p>

          {/* Country Selection */}
          <div className="mb-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Select Preset Country Baseline
            </label>
            <select
              value={selectedCountryId}
              onChange={(e) => setSelectedCountryId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            >
              {db.countries.map((c) => (
                <option key={c.country_id} value={c.country_id}>
                  {c.name} ({c.region})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-6">
            {/* Life Expectancy */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  <span>Life Expectancy at Birth</span>
                </span>
                <span className="text-sm font-mono text-slate-100 font-bold">{lifeExpectancy} yrs</span>
              </div>
              <input
                type="range"
                min="40"
                max="90"
                step="0.5"
                value={lifeExpectancy}
                onChange={(e) => setLifeExpectancy(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>Min: 20 yrs (UNDP)</span>
                <span className="text-rose-400/80">Computed LE Index: {liveUndp.life_expectancy_idx}</span>
                <span>Max: 85 yrs (UNDP)</span>
              </div>
            </div>

            {/* Expected Years of Schooling */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-sky-500" />
                  <span>Expected Years of Schooling</span>
                </span>
                <span className="text-sm font-mono text-slate-100 font-bold">{expectedSchooling} yrs</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                step="0.5"
                value={expectedSchooling}
                onChange={(e) => setExpectedSchooling(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>Min: 0 yrs</span>
                <span className="text-sky-400/80">Index: {(expectedSchooling / 18).toFixed(3)}</span>
                <span>Max: 18 yrs (UNDP)</span>
              </div>
            </div>

            {/* Mean Years of Schooling */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-teal-400" />
                  <span>Mean Years of Schooling</span>
                </span>
                <span className="text-sm font-mono text-slate-100 font-bold">{meanSchooling} yrs</span>
              </div>
              <input
                type="range"
                min="0"
                max="16"
                step="0.5"
                value={meanSchooling}
                onChange={(e) => setMeanSchooling(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>Min: 0 yrs</span>
                <span className="text-teal-400/80">Index: {(meanSchooling / 15).toFixed(3)}</span>
                <span>Max: 15 yrs (UNDP)</span>
              </div>
              {meanSchooling > expectedSchooling && (
                <div className="mt-2 flex items-center gap-1 bg-amber-500/5 border border-amber-500/10 rounded px-2 py-1 text-[10px] text-amber-400">
                  <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                  <span>Mean schooling typically doesn't exceed expected years.</span>
                </div>
              )}
            </div>

            {/* GNI Per Capita */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                  <span>GNI per Capita (USD, Log Scale)</span>
                </span>
                <span className="text-sm font-mono text-slate-100 font-bold">${gniPerCapita.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="500"
                max="80000"
                step="250"
                value={gniPerCapita}
                onChange={(e) => setGniPerCapita(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>Min: $100</span>
                <span className="text-emerald-400/80">Income Index: {liveUndp.income_idx}</span>
                <span>Max: $75,000 (UNDP)</span>
              </div>
            </div>

            {/* Model Selector */}
            <div className="pt-2 border-t border-slate-800">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5" />
                <span>Target Machine Learning Model</span>
              </label>
              <select
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              >
                {models.map((m) => (
                  <option key={m.model_id} value={m.model_id}>
                    {m.name} (R²: {m.r_squared})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Action triggers */}
        <div className="flex gap-4 mt-8 pt-4 border-t border-slate-800">
          <button
            onClick={handleReset}
            className="px-4 py-3 bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-slate-200 rounded-xl border border-slate-800 transition-all active:scale-95 text-xs flex items-center gap-1.5 font-medium"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
          <button
            onClick={handlePredict}
            disabled={isPredicting}
            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/50 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 transition-all active:scale-95 disabled:pointer-events-none"
          >
            {isPredicting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-indigo-200" />
                <span>Running Prediction Model...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Execute HDI Prediction</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Output Results / Policy Report Panel */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        {predictionResult ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex-1 flex flex-col justify-between">
            <div>
              {/* Header result values */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800 mb-6">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                    Model Predicted Output
                  </span>
                  <div className="flex items-baseline gap-2.5 mt-1">
                    <span className="text-4xl font-extrabold text-slate-100 font-mono tracking-tight">
                      {predictionResult.prediction.predicted_hdi}
                    </span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getHdiLevel(predictionResult.prediction.predicted_hdi).color}`}>
                      {getHdiLevel(predictionResult.prediction.predicted_hdi).label}
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
                    Confidence Interval
                  </span>
                  <span className="text-sm font-mono font-semibold text-indigo-300 mt-1 block">
                    [{predictionResult.prediction.confidence_interval}]
                  </span>
                </div>
              </div>

              {/* Index metrics breakdown block */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                  <span className="text-[10px] font-medium text-slate-500 block">Health Index (LEI)</span>
                  <span className="text-lg font-mono font-bold text-rose-400 mt-1 block">
                    {predictionResult.prediction.calculation_breakdown.life_expectancy_idx}
                  </span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                  <span className="text-[10px] font-medium text-slate-500 block">Education Index (EI)</span>
                  <span className="text-lg font-mono font-bold text-sky-400 mt-1 block">
                    {predictionResult.prediction.calculation_breakdown.education_idx}
                  </span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                  <span className="text-[10px] font-medium text-slate-500 block">Income Index (II)</span>
                  <span className="text-lg font-mono font-bold text-emerald-400 mt-1 block">
                    {predictionResult.prediction.calculation_breakdown.income_idx}
                  </span>
                </div>
              </div>

              {/* Gemini Report Content */}
              <div className="bg-slate-950/80 rounded-xl p-5 border border-slate-850/60 max-h-[360px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-indigo-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Interactive Policy Synthesis Report</span>
                </div>
                <div className="prose prose-invert prose-xs text-xs text-slate-300 leading-relaxed space-y-4">
                  <ReactMarkdown>{predictionResult.reportMarkdown}</ReactMarkdown>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
                <span className="text-slate-400 text-xs">
                  This run generated 3 database writes.
                </span>
              </div>

              {saveSuccess ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl">
                  <CheckCircle className="w-4 h-4" />
                  <span>Saved to ER Tables Successfully</span>
                </div>
              ) : (
                <button
                  onClick={handleSaveResult}
                  className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md shadow-indigo-600/15"
                >
                  <Save className="w-4 h-4" />
                  <span>Commit Prediction to DB</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl flex-1 flex flex-col items-center justify-center text-center">
            <div className="p-4 bg-slate-950 rounded-full border border-slate-800 text-indigo-400 mb-4 animate-bounce">
              <Cpu className="w-8 h-8" />
            </div>
            <h4 className="text-slate-200 font-bold text-base">Model Simulation Ready</h4>
            <p className="text-slate-400 text-xs max-w-sm mt-2 leading-relaxed">
              Configure parameters on the left and trigger prediction. The system will calculate composite dimensions, test ML accuracy thresholds, and draft policy recommendations.
            </p>
          </div>
        )}

        {/* Informative UNDP Calculation Guideline footer card */}
        <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl flex items-start gap-3">
          <FileText className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
          <div>
            <h5 className="text-slate-200 font-semibold text-xs">Baseline UNDP Formula Reference</h5>
            <p className="text-slate-500 text-[11px] mt-1 leading-relaxed">
              Composite HDI is calculated as the geometric mean of three dimension indices: <strong className="text-slate-400">HDI = (Health × Education × Income)<sup>1/3</sup></strong>. Education index is the average of Expected Years index and Mean Years index. Income uses natural logarithms to discount high capital earnings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

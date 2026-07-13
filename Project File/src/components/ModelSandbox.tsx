/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { DatabaseState, MLModel, Dataset } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Database, Settings2, Sliders, Play, Check, TrendingUp, Info, Loader2 } from 'lucide-react';

interface ModelSandboxProps {
  db: DatabaseState;
  onModelsUpdated: (updatedModels: MLModel[]) => void;
}

export default function ModelSandbox({ db, onModelsUpdated }: ModelSandboxProps) {
  const [selectedModelId, setSelectedModelId] = useState<string>('MDL-001');
  const [isTuning, setIsTuning] = useState<boolean>(false);

  // Hyperparameter states
  const [rfTrees, setRfTrees] = useState<number>(150);
  const [rfDepth, setRfDepth] = useState<number>(12);

  const [nnLayers, setNnLayers] = useState<string>('64x32x16');
  const [nnRate, setNnRate] = useState<number>(0.005);
  const [nnEpochs, setNnEpochs] = useState<number>(200);

  const [ridgeAlpha, setRidgeAlpha] = useState<number>(1.0);

  const [tuneSuccess, setTuneSuccess] = useState<boolean>(false);

  // Recharts accuracy data formatted
  const chartData = db.ml_models.map((m) => ({
    name: m.name.split(' ')[0],
    'R-Squared (Accuracy)': m.r_squared,
    'Mean Squared Error': m.mean_squared_error
  }));

  const handleTuneModel = () => {
    setIsTuning(true);
    setTuneSuccess(false);

    setTimeout(() => {
      const updatedModels = db.ml_models.map((m) => {
        if (m.model_id === selectedModelId) {
          let r_squared = m.r_squared;
          let mean_squared_error = m.mean_squared_error;
          let newHyperparams = { ...m.hyperparams };

          if (selectedModelId === 'MDL-001') { // RF
            newHyperparams.n_estimators = rfTrees;
            newHyperparams.max_depth = rfDepth;
            // High trees + appropriate depth increase metrics slightly
            r_squared = Math.min(0.995, 0.97 + (rfTrees / 5000) + (rfDepth / 500));
            mean_squared_error = Math.max(0.0001, 0.001 - (r_squared - 0.9) * 0.01);
          } else if (selectedModelId === 'MDL-002') { // NN
            newHyperparams.hidden_layers = nnLayers;
            newHyperparams.learning_rate = nnRate;
            newHyperparams.epochs = nnEpochs;
            // Learning rates that are too high or low diverge
            const rateOffset = Math.abs(nnRate - 0.01);
            r_squared = Math.min(0.992, 0.985 - (rateOffset * 0.1) + (nnEpochs / 50000));
            mean_squared_error = Math.max(0.00015, 0.0008 - (r_squared - 0.9) * 0.01);
          } else if (selectedModelId === 'MDL-003') { // Ridge
            newHyperparams.alpha = ridgeAlpha;
            // Optimal regularization alpha sits around 0.1 to 1.0
            const alphaOffset = Math.abs(ridgeAlpha - 0.5);
            r_squared = Math.min(0.958, 0.945 - (alphaOffset * 0.005));
            mean_squared_error = Math.max(0.001, 0.0018 - (r_squared - 0.9) * 0.01);
          }

          return {
            ...m,
            r_squared: parseFloat(r_squared.toFixed(3)),
            mean_squared_error: parseFloat(mean_squared_error.toFixed(5)),
            hyperparams: newHyperparams
          };
        }
        return m;
      });

      onModelsUpdated(updatedModels);
      setIsTuning(false);
      setTuneSuccess(true);
    }, 1200);
  };

  const activeModel = db.ml_models.find(m => m.model_id === selectedModelId)!;
  const trainingDataset = db.datasets.find(d => d.dataset_id === activeModel.training_dataset_id)!;

  return (
    <div className="space-y-8" id="ml-sandbox-view">
      {/* Top Section - Visual Accuracy Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Model Accuracy Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-100">Model Accuracy Evaluation</h3>
              <p className="text-slate-400 text-xs mt-0.5">Coefficient of Determination (R²) vs. Mean Squared Error (MSE).</p>
            </div>
            <span className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
              <TrendingUp className="w-5 h-5" />
            </span>
          </div>

          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" domain={[0, 1.1]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                  labelClassName="font-bold text-slate-100"
                />
                <Legend />
                <Bar dataKey="R-Squared (Accuracy)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Mean Squared Error" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Datasets Reference */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-amber-400" />
                <span>Training Datasets</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2.5 py-0.5 rounded border border-slate-850">
                {db.datasets.length} Active
              </span>
            </div>

            <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
              {db.datasets.map((d) => (
                <div key={d.dataset_id} className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                  <div className="flex justify-between items-start">
                    <h4 className="text-xs font-bold text-slate-200">{d.name}</h4>
                    <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">
                      {d.release_year}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[10px] mt-1 line-clamp-2 leading-relaxed">
                    {d.description}
                  </p>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2.5 pt-2 border-t border-slate-900/60 font-mono">
                    <span>Source: {d.source.split(' ')[0]}</span>
                    <span className="text-indigo-400">{d.records_count.toLocaleString()} samples</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Tuning Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-6">
          <span className="p-1.5 bg-amber-500/10 rounded-lg text-amber-400">
            <Sliders className="w-5 h-5" />
          </span>
          <h3 className="text-lg font-bold text-slate-100">Model Hyperparameter Tuning Playground</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Select model side list */}
          <div className="lg:col-span-4 space-y-3">
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Select ML Architecture
            </span>

            {db.ml_models.map((m) => {
              if (m.model_id === 'MDL-004') return null; // Hide baseline UNDP formula
              const isActive = selectedModelId === m.model_id;
              return (
                <button
                  key={m.model_id}
                  onClick={() => { setSelectedModelId(m.model_id); setTuneSuccess(false); }}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex flex-col justify-between ${
                    isActive
                      ? 'bg-indigo-600/10 border-indigo-500/60 text-indigo-200 shadow-md shadow-indigo-600/5'
                      : 'bg-slate-950 border-slate-850 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="flex justify-between items-center w-full mb-1">
                    <span className="font-bold text-xs text-slate-200">{m.name}</span>
                    <span className="text-[10px] font-mono text-slate-500">{m.algorithm_type}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-mono mt-1 pt-1.5 border-t border-slate-900/50">
                    <span>R²: <strong className="text-slate-200">{m.r_squared}</strong></span>
                    <span>MSE: <strong className="text-rose-400">{m.mean_squared_error}</strong></span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Hyperparameters tuning column */}
          <div className="lg:col-span-8 bg-slate-950 p-6 rounded-xl border border-slate-850 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-6 pb-2 border-b border-slate-900">
                <div>
                  <h4 className="text-sm font-bold text-slate-100">Configure Parameter Weights</h4>
                  <p className="text-slate-500 text-xs mt-0.5">Tweak variables and retrain the selected ML model weights.</p>
                </div>
                <span className="text-xs font-mono bg-slate-900 px-3 py-1 border border-slate-800 rounded-lg text-amber-400">
                  {activeModel.algorithm_type}
                </span>
              </div>

              {/* Dynamic inputs based on active model */}
              {selectedModelId === 'MDL-001' && (
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-slate-300 font-semibold">n_estimators (Number of Decision Trees)</span>
                      <span className="font-mono text-slate-100 font-bold">{rfTrees} trees</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="300"
                      step="10"
                      value={rfTrees}
                      onChange={(e) => setRfTrees(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">Higher tree count improves robustness but increases training latency.</span>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-slate-300 font-semibold">max_depth (Maximum Tree Depth)</span>
                      <span className="font-mono text-slate-100 font-bold">{rfDepth} levels</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="20"
                      step="1"
                      value={rfDepth}
                      onChange={(e) => setRfDepth(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">Limiting depth avoids overfitting. High values fit noise.</span>
                  </div>
                </div>
              )}

              {selectedModelId === 'MDL-002' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 font-semibold mb-2">Hidden Layers Topology</label>
                      <select
                        value={nnLayers}
                        onChange={(e) => setNnLayers(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs"
                      >
                        <option value="64x32x16">64 ➔ 32 ➔ 16 (Deep)</option>
                        <option value="32x16">32 ➔ 16 (Standard)</option>
                        <option value="128x64">128 ➔ 64 (Wide)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 font-semibold mb-2">Learning Rate (Alpha)</label>
                      <select
                        value={nnRate}
                        onChange={(e) => setNnRate(parseFloat(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs"
                      >
                        <option value="0.001">0.001 (Slow / Solid)</option>
                        <option value="0.005">0.005 (Optimal)</option>
                        <option value="0.05">0.05 (Fast / Errant)</option>
                        <option value="0.2">0.20 (Unstable)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-slate-300 font-semibold">Training Epochs (Iterations)</span>
                      <span className="font-mono text-slate-100 font-bold">{nnEpochs} epochs</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="400"
                      step="25"
                      value={nnEpochs}
                      onChange={(e) => setNnEpochs(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">Maximum backpropagation sweeps during optimization.</span>
                  </div>
                </div>
              )}

              {selectedModelId === 'MDL-003' && (
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-slate-300 font-semibold">Alpha Regularization (Penalty Constraint)</span>
                      <span className="font-mono text-slate-100 font-bold">{ridgeAlpha}</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="10.0"
                      step="0.1"
                      value={ridgeAlpha}
                      onChange={(e) => setRidgeAlpha(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">Controls L2 penalty. Higher values reduce coefficients, preventing high variance.</span>
                  </div>
                </div>
              )}

              {/* Informative source dataset box */}
              <div className="mt-6 pt-4 border-t border-slate-900/60 flex gap-2 items-start text-[11px] text-slate-500">
                <Info className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  This model trains on the <strong className="text-slate-400">"{trainingDataset.name}"</strong> release dataset consisting of <strong className="text-slate-400">{trainingDataset.records_count.toLocaleString()} rows</strong> from the {trainingDataset.source}.
                </div>
              </div>
            </div>

            {/* Train triggers */}
            <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-900">
              <div className="text-slate-500 text-xs font-mono">
                Model: {selectedModelId} Schema Saved
              </div>

              {tuneSuccess ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-xl font-medium">
                  <Check className="w-4 h-4" />
                  <span>Model Weights Rebuilt!</span>
                </div>
              ) : (
                <button
                  onClick={handleTuneModel}
                  disabled={isTuning}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white rounded-xl font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/10 transition-all active:scale-95"
                >
                  {isTuning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Backpropagating weights...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      <span>Retrain Model Weights</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

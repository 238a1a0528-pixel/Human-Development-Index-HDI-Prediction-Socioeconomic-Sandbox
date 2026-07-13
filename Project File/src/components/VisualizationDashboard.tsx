/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { DatabaseState, VisualizationReport } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { BarChart3, FileText, Globe, ArrowUpRight, Sparkles, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface VisualizationDashboardProps {
  db: DatabaseState;
}

export default function VisualizationDashboard({ db }: VisualizationDashboardProps) {
  const [selectedReportId, setSelectedReportId] = useState<string>(db.visualization_reports[0]?.report_id || '');

  // Compare Countries Chart Data
  const comparisonData = db.countries.map((c) => {
    // Standard estimation dimensions
    let lifeExp = 70;
    let expSch = 12;
    let meanSch = 8;
    let gni = 12000;

    if (c.country_id === 'NOR') { lifeExp = 83.2; expSch = 18.9; meanSch = 13.1; gni = 66100; }
    else if (c.country_id === 'CHE') { lifeExp = 84.0; expSch = 16.5; meanSch = 13.9; gni = 66900; }
    else if (c.country_id === 'USA') { lifeExp = 77.2; expSch = 16.3; meanSch = 13.7; gni = 64700; }
    else if (c.country_id === 'JPN') { lifeExp = 84.8; expSch = 15.2; meanSch = 12.9; gni = 42200; }
    else if (c.country_id === 'BRA') { lifeExp = 72.8; expSch = 15.6; meanSch = 8.1; gni = 14300; }
    else if (c.country_id === 'IND') { lifeExp = 67.2; expSch = 11.9; meanSch = 6.7; gni = 6590; }
    else if (c.country_id === 'ZAF') { lifeExp = 62.3; expSch = 13.6; meanSch = 10.2; gni = 12900; }
    else if (c.country_id === 'NGA') { lifeExp = 52.7; expSch = 10.1; meanSch = 5.2; gni = 4900; }

    const lei = (lifeExp - 20) / 65;
    const msi = meanSch / 15;
    const esi = expSch / 18;
    const ei = (msi + esi) / 2;
    const ii = (Math.log(Math.max(100, gni)) - Math.log(100)) / (Math.log(75000) - Math.log(100));

    return {
      name: c.name,
      'Health (LEI)': parseFloat(lei.toFixed(3)),
      'Education (EI)': parseFloat(ei.toFixed(3)),
      'Income (II)': parseFloat(ii.toFixed(3)),
      'Composite HDI': c.base_hdi
    };
  }).filter(c => ['Norway', 'United States', 'Brazil', 'India', 'Nigeria', 'Japan'].includes(c.name));

  const activeReport = db.visualization_reports.find(r => r.report_id === selectedReportId);

  // Parse chart data if report matches
  const getReportChartData = () => {
    if (activeReport?.chart_data_json) {
      try {
        return JSON.parse(activeReport.chart_data_json);
      } catch (e) {
        console.error("Failed to parse report chart data json", e);
      }
    }
    return [];
  };

  const reportChartData = getReportChartData();

  return (
    <div className="space-y-8" id="saved-reports-view">
      {/* Top side global analysis bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Global HDI benchmark comparison chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                <Globe className="w-4.5 h-4.5 text-indigo-400 animate-spin-slow" />
                <span>Global HDI Dimension Benchmarks</span>
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">Socioeconomic index comparisons across key tier groups.</p>
            </div>
            <span className="p-2 bg-slate-950 rounded-xl text-indigo-400 text-xs font-mono border border-slate-800">
              6 Countries Compared
            </span>
          </div>

          <div className="h-60 w-full text-[10px] font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" domain={[0, 1.0]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                  labelClassName="font-bold text-slate-100"
                />
                <Legend />
                <Bar dataKey="Health (LEI)" fill="#f43f5e" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Education (EI)" fill="#0ea5e9" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Income (II)" fill="#10b981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Composite HDI" fill="#6366f1" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Saved Reports Directory Side Column */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                <FileText className="w-4.5 h-4.5 text-emerald-400" />
                <span>Reports Archive</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 border border-slate-850 rounded">
                {db.visualization_reports.length} Saved
              </span>
            </div>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {db.visualization_reports.map((r) => {
                const isActive = selectedReportId === r.report_id;
                return (
                  <button
                    key={r.report_id}
                    onClick={() => setSelectedReportId(r.report_id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-1 ${
                      isActive
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-semibold'
                        : 'bg-slate-950 border-slate-850 hover:border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="text-xs font-bold text-slate-200 line-clamp-1">{r.title}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <span className="text-[10px] text-slate-500 line-clamp-1">{r.notes}</span>
                    <span className="text-[9px] font-mono text-slate-500 mt-1">{new Date(r.created_at).toLocaleDateString()}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Report Reading Panel */}
      {activeReport ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Chart metrics breakdown */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-100 mb-4 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                <span>Report Dimensions Chart</span>
              </h4>

              {reportChartData.length > 0 ? (
                <div className="h-60 w-full text-[10px] font-mono">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportChartData} layout="vertical" margin={{ top: 10, right: 10, left: 15, bottom: 0 }}>
                      <CartesianGrid stroke="#1e293b" horizontal={false} />
                      <XAxis type="number" stroke="#64748b" domain={[0, 1.0]} />
                      <YAxis dataKey="name" type="category" stroke="#64748b" width={60} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                      />
                      <Bar dataKey="value" fill="#6366f1" radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-12 border-2 border-dashed border-slate-800 rounded-xl">
                  <AlertCircle className="w-8 h-8 text-slate-700 mb-2" />
                  <span className="text-xs text-slate-500">No chart coordinates parsed for this briefing.</span>
                </div>
              )}
            </div>

            <div className="text-[10px] font-mono text-slate-500 bg-slate-950 p-3 rounded-lg border border-slate-850 mt-4 leading-relaxed">
              <strong>Database reference key:</strong> Prediction entity row <span className="text-indigo-400 font-bold">[{activeReport.prediction_id}]</span> links this visualization report.
            </div>
          </div>

          {/* Full Report Narrative */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>UNDP Policy Research briefing</span>
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-4">{activeReport.title}</h3>

              <div className="bg-slate-950/80 rounded-xl p-6 border border-slate-850 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                <div className="prose prose-invert prose-xs text-xs text-slate-300 leading-relaxed space-y-4">
                  <ReactMarkdown>{activeReport.report_markdown}</ReactMarkdown>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-800 mt-6 pt-4 font-mono">
              <span>Report Ref: {activeReport.report_id}</span>
              <span>Published: {new Date(activeReport.created_at).toLocaleString()}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 shadow-xl text-center">
          <FileText className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <h4 className="text-slate-300 font-bold text-sm">No briefings saved in the system</h4>
          <p className="text-slate-500 text-xs mt-1">Execute predictions and save reports in the sandbox to populate this tab.</p>
        </div>
      )}
    </div>
  );
}

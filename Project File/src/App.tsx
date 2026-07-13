/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { DatabaseState, User, Session, HDIInputData, HDIPrediction, VisualizationReport, MLModel } from './types';
import { getInitialDatabase, saveDatabaseState } from './utils/database';
import ERDiagram from './components/ERDiagram';
import HDIPredictionForm from './components/HDIPredictionForm';
import ModelSandbox from './components/ModelSandbox';
import VisualizationDashboard from './components/VisualizationDashboard';
import DatabaseExplorer from './components/DatabaseExplorer';
import { Layers, Cpu, Sliders, FileText, Database, UserCheck, Activity, LogOut, Terminal, HelpCircle } from 'lucide-react';

export default function App() {
  const [db, setDb] = useState<DatabaseState>(getInitialDatabase());
  const [activeTab, setActiveTab] = useState<'simulator' | 'diagram' | 'sandbox' | 'dashboard' | 'explorer'>('simulator');

  // Active User and Session states
  const [activeUserId, setActiveUserId] = useState<string>('USR-001');
  const [currentSessionId, setCurrentSessionId] = useState<string>('');

  // Selected table in diagram and explorer
  const [selectedTable, setSelectedTable] = useState<keyof DatabaseState>('hdi_inputs');

  // Initialize Session on active user swap
  useEffect(() => {
    const session_id = `SES-${Math.floor(100 + Math.random() * 900)}`;
    const platform = window.navigator.userAgent.includes('Chrome') ? 'Google AI Studio Core (Chrome)' : 'Standard Web Agent (Gecko)';

    const newSession: Session = {
      session_id,
      user_id: activeUserId,
      start_time: new Date().toISOString(),
      end_time: null,
      ip_address: '172.56.29.102',
      platform,
      activities_count: 1
    };

    const updatedSessions = [newSession, ...db.sessions];
    const updatedDb = { ...db, sessions: updatedSessions };

    setDb(updatedDb);
    saveDatabaseState(updatedDb);
    setCurrentSessionId(session_id);
  }, [activeUserId]);

  const activeUser = db.users.find(u => u.user_id === activeUserId) || db.users[0];
  const activeSession = db.sessions.find(s => s.session_id === currentSessionId);

  // Increment operations in the active session
  const incrementSessionActivity = (currentDb: DatabaseState) => {
    const updatedSessions = currentDb.sessions.map((s) => {
      if (s.session_id === currentSessionId) {
        return { ...s, activities_count: s.activities_count + 1 };
      }
      return s;
    });
    return { ...currentDb, sessions: updatedSessions };
  };

  // Callback when a user runs a simulator run and clicks save
  const handlePredictionSaved = (
    input: HDIInputData,
    prediction: HDIPrediction,
    report: VisualizationReport
  ) => {
    let updatedDb = {
      ...db,
      hdi_inputs: [input, ...db.hdi_inputs],
      hdi_predictions: [prediction, ...db.hdi_predictions],
      visualization_reports: [report, ...db.visualization_reports]
    };

    updatedDb = incrementSessionActivity(updatedDb);
    setDb(updatedDb);
    saveDatabaseState(updatedDb);
  };

  // Callback when model hyperparameters are tuned and models rebuilt
  const handleModelsUpdated = (updatedModels: MLModel[]) => {
    let updatedDb = {
      ...db,
      ml_models: updatedModels
    };

    updatedDb = incrementSessionActivity(updatedDb);
    setDb(updatedDb);
    saveDatabaseState(updatedDb);
  };

  // CRUD: Add general record
  const handleAddRecord = (tableName: keyof DatabaseState, record: any) => {
    let updatedDb = {
      ...db,
      [tableName]: [record, ...(db[tableName] as any[])]
    };

    updatedDb = incrementSessionActivity(updatedDb);
    setDb(updatedDb);
    saveDatabaseState(updatedDb);
  };

  // CRUD: Delete record matching key
  const handleDeleteRecord = (tableName: keyof DatabaseState, primaryKeyVal: string) => {
    // Determine the key attribute to filter
    const pk = tableName === 'users' ? 'user_id'
             : tableName === 'countries' ? 'country_id'
             : tableName === 'hdi_inputs' ? 'input_id'
             : tableName === 'ml_models' ? 'model_id'
             : tableName === 'hdi_predictions' ? 'prediction_id'
             : tableName === 'datasets' ? 'dataset_id'
             : tableName === 'visualization_reports' ? 'report_id'
             : 'session_id';

    let updatedDb = {
      ...db,
      [tableName]: (db[tableName] as any[]).filter(row => row[pk] !== primaryKeyVal)
    };

    updatedDb = incrementSessionActivity(updatedDb);
    setDb(updatedDb);
    saveDatabaseState(updatedDb);
  };

  // Wipe database and reload seed datasets
  const handleResetDB = () => {
    localStorage.removeItem('hdi_prediction_db');
    const freshDb = getInitialDatabase();
    setDb(freshDb);
    setActiveTab('simulator');
    setSearchTableFocus('hdi_inputs');
  };

  const setSearchTableFocus = (tbl: keyof DatabaseState) => {
    setSelectedTable(tbl);
    setActiveTab('explorer');
  };

  const handleEntityShortcut = (tbl: keyof DatabaseState) => {
    setSelectedTable(tbl);
    setActiveTab('explorer');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans" id="applet-viewport">
      {/* Top Banner Navigation */}
      <header className="bg-slate-900/80 border-b border-slate-850 sticky top-0 z-50 backdrop-blur-md px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600/10 rounded-xl border border-indigo-500/20 text-indigo-400">
            <Terminal className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-100">
              HDI Prediction & Visualization Console
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              UN Diagnostic Development Sandbox • Full-Stack ML Predictive Engine
            </p>
          </div>
        </div>

        {/* Active Session & User HUD */}
        <div className="flex items-center gap-4 bg-slate-950 px-4 py-2 rounded-xl border border-slate-850/80">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <select
              value={activeUserId}
              onChange={(e) => setActiveUserId(e.target.value)}
              className="bg-transparent text-xs text-slate-200 border-none outline-none font-semibold focus:ring-0 cursor-pointer"
            >
              {db.users.map((u) => (
                <option key={u.user_id} value={u.user_id} className="bg-slate-950 text-slate-300">
                  {u.name} ({u.role.split(' ')[0]})
                </option>
              ))}
            </select>
          </div>

          <div className="h-4 w-px bg-slate-850"></div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span>ops:</span>
            <span className="text-slate-200 font-bold">{activeSession?.activities_count || 1}</span>
          </div>
        </div>
      </header>

      {/* Main Body Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Sidebar Controls */}
        <aside className="w-full lg:w-64 bg-slate-900/40 border-r border-slate-900 p-4 space-y-1.5 lg:space-y-2 flex-shrink-0">
          <span className="hidden lg:block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">
            Workspace Hub
          </span>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center gap-3 ${
              activeTab === 'simulator'
                ? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-300 font-semibold'
                : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4.5 h-4.5" />
            <span className="text-xs">Dimension Simulator</span>
          </button>

          <button
            onClick={() => setActiveTab('diagram')}
            className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center gap-3 ${
              activeTab === 'diagram'
                ? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-300 font-semibold'
                : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4.5 h-4.5" />
            <span className="text-xs">Interactive ER Schema</span>
          </button>

          <button
            onClick={() => setActiveTab('sandbox')}
            className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center gap-3 ${
              activeTab === 'sandbox'
                ? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-300 font-semibold'
                : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4.5 h-4.5" />
            <span className="text-xs">ML Model Tuning</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center gap-3 ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-300 font-semibold'
                : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4.5 h-4.5" />
            <span className="text-xs">Analytical Briefings</span>
          </button>

          <button
            onClick={() => setActiveTab('explorer')}
            className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center gap-3 ${
              activeTab === 'explorer'
                ? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-300 font-semibold'
                : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
            }`}
          >
            <Database className="w-4.5 h-4.5" />
            <span className="text-xs">Database Table Browser</span>
          </button>

          <div className="pt-6 mt-6 border-t border-slate-900 hidden lg:block">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">
                Active Session Logs
              </span>
              <div className="space-y-2 mt-2 font-mono text-[10px] text-slate-500 leading-relaxed">
                <div>User: <span className="text-slate-300">{activeUser?.name}</span></div>
                <div>Role: <span className="text-slate-300">{activeUser?.role}</span></div>
                <div>ID: <span className="text-slate-300">{currentSessionId}</span></div>
                <div className="truncate">Agent: <span className="text-slate-300">{activeSession?.platform.split(' ')[0]}</span></div>
              </div>
            </div>
          </div>
        </aside>

        {/* Central Stage Workspace */}
        <main className="flex-1 p-6 md:p-8 bg-slate-950 overflow-y-auto">
          {activeTab === 'simulator' && (
            <HDIPredictionForm
              db={db}
              activeUserId={activeUserId}
              onPredictionSaved={handlePredictionSaved}
            />
          )}

          {activeTab === 'diagram' && (
            <ERDiagram
              db={db}
              selectedTable={selectedTable}
              onSelectTable={handleEntityShortcut}
            />
          )}

          {activeTab === 'sandbox' && (
            <ModelSandbox
              db={db}
              onModelsUpdated={handleModelsUpdated}
            />
          )}

          {activeTab === 'dashboard' && (
            <VisualizationDashboard
              db={db}
            />
          )}

          {activeTab === 'explorer' && (
            <DatabaseExplorer
              db={db}
              selectedTable={selectedTable}
              onTableChange={setSelectedTable}
              onAddRecord={handleAddRecord}
              onDeleteRecord={handleDeleteRecord}
              onResetDB={handleResetDB}
            />
          )}
        </main>
      </div>

      {/* Footer credits bar */}
      <footer className="bg-slate-900/40 border-t border-slate-900 px-6 py-3 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-500 font-mono gap-2">
        <span>© 2026 UN Human Development Index Sandbox Console</span>
        <div className="flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-slate-600" />
          <span>Need help? Select the Baseline UNDP Reference card in the simulator.</span>
        </div>
      </footer>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { DatabaseState } from '../types';
import { Search, Plus, Trash2, Key, Database, RefreshCw, Layers } from 'lucide-react';

interface DatabaseExplorerProps {
  db: DatabaseState;
  selectedTable: keyof DatabaseState;
  onTableChange: (tableName: keyof DatabaseState) => void;
  onAddRecord: (tableName: keyof DatabaseState, record: any) => void;
  onDeleteRecord: (tableName: keyof DatabaseState, primaryKeyVal: string) => void;
  onResetDB: () => void;
}

export default function DatabaseExplorer({
  db,
  selectedTable,
  onTableChange,
  onAddRecord,
  onDeleteRecord,
  onResetDB
}: DatabaseExplorerProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Add Custom Record Form inputs
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newRecordState, setNewRecordState] = useState<Record<string, string | number>>({});

  const tables: { id: keyof DatabaseState; label: string; pk: string }[] = [
    { id: 'users', label: 'User Table', pk: 'user_id' },
    { id: 'countries', label: 'Country Table', pk: 'country_id' },
    { id: 'hdi_inputs', label: 'HDI Input Data', pk: 'input_id' },
    { id: 'ml_models', label: 'ML Model Table', pk: 'model_id' },
    { id: 'hdi_predictions', label: 'HDI Prediction Table', pk: 'prediction_id' },
    { id: 'datasets', label: 'Dataset Table', pk: 'dataset_id' },
    { id: 'visualization_reports', label: 'Visualization Report', pk: 'report_id' },
    { id: 'sessions', label: 'Session Table', pk: 'session_id' }
  ];

  const currentTableConfig = tables.find(t => t.id === selectedTable)!;
  const currentRows = db[selectedTable] || [];

  // Filter rows based on search
  const filteredRows = currentRows.filter((row: any) => {
    if (!searchTerm) return true;
    const match = JSON.stringify(row).toLowerCase();
    return match.includes(searchTerm.toLowerCase());
  });

  // Get schema columns dynamically from first row or fallback configs
  const getColumns = () => {
    if (currentRows.length > 0) {
      return Object.keys(currentRows[0]);
    }
    // Fallbacks if empty
    if (selectedTable === 'users') return ['user_id', 'name', 'email', 'role', 'created_at'];
    if (selectedTable === 'countries') return ['country_id', 'name', 'region', 'population', 'base_hdi'];
    return ['id'];
  };

  const columns = getColumns();

  const handleCreateRecord = (e: React.FormEvent) => {
    e.preventDefault();

    const pk = currentTableConfig.pk;
    const randomID = `${pk.split('_')[0].substring(0, 3).toUpperCase()}-${Math.floor(500 + Math.random() * 499)}`;

    const newRecord: Record<string, any> = {
      [pk]: randomID,
      ...newRecordState,
      created_at: new Date().toISOString()
    };

    // Correcting specific types
    if (selectedTable === 'countries') {
      newRecord.population = parseFloat(newRecord.population as string) || 0;
      newRecord.base_hdi = parseFloat(newRecord.base_hdi as string) || 0;
    } else if (selectedTable === 'hdi_inputs') {
      newRecord.life_expectancy = parseFloat(newRecord.life_expectancy as string) || 0;
      newRecord.expected_schooling = parseFloat(newRecord.expected_schooling as string) || 0;
      newRecord.mean_schooling = parseFloat(newRecord.mean_schooling as string) || 0;
      newRecord.gni_pc = parseFloat(newRecord.gni_pc as string) || 0;
    } else if (selectedTable === 'ml_models') {
      newRecord.r_squared = parseFloat(newRecord.r_squared as string) || 0;
      newRecord.mean_squared_error = parseFloat(newRecord.mean_squared_error as string) || 0;
    } else if (selectedTable === 'hdi_predictions') {
      newRecord.predicted_hdi = parseFloat(newRecord.predicted_hdi as string) || 0;
    } else if (selectedTable === 'datasets') {
      newRecord.records_count = parseInt(newRecord.records_count as string) || 0;
      newRecord.release_year = parseInt(newRecord.release_year as string) || 0;
    }

    onAddRecord(selectedTable, newRecord);
    setShowAddForm(false);
    setNewRecordState({});
  };

  const handleInputChange = (col: string, val: string) => {
    setNewRecordState(prev => ({
      ...prev,
      [col]: val
    }));
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative" id="db-explorer-view">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-1.5">
            <Database className="w-5 h-5 text-indigo-400" />
            <span>Interactive Table Browser</span>
          </h3>
          <p className="text-slate-400 text-xs mt-0.5">
            Query, insert, or prune records directly inside any of the {tables.length} schema tables.
          </p>
        </div>

        {/* Database control triggers */}
        <button
          onClick={onResetDB}
          className="text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-3.5 py-2 rounded-xl border border-rose-500/20 flex items-center gap-1.5 transition-colors font-semibold self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Seeds / Wipe DB</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Table selection sidebar list */}
        <div className="space-y-1.5">
          <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 pl-1">
            Schema Tables
          </span>

          {tables.map((t) => {
            const isActive = selectedTable === t.id;
            const count = db[t.id]?.length || 0;

            return (
              <button
                key={t.id}
                onClick={() => {
                  onTableChange(t.id);
                  setSearchTerm('');
                  setShowAddForm(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center justify-between ${
                  isActive
                    ? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-200 font-semibold'
                    : 'bg-slate-950 border-slate-850 hover:border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-indigo-400' : 'bg-slate-700'}`}></span>
                  <span className="text-xs">{t.label}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Interactive rows workspace */}
        <div className="lg:col-span-3 bg-slate-950 border border-slate-850 rounded-xl p-5 flex flex-col min-h-[460px]">
          {/* Workspace Actions Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-900/60">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder={`Search ${currentTableConfig.label}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Add Record Trigger */}
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/10 transition-all active:scale-95 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Insert Record</span>
            </button>
          </div>

          {/* New Record Inline Entry Form */}
          {showAddForm && (
            <form onSubmit={handleCreateRecord} className="bg-slate-900 border border-slate-800 p-4 rounded-xl mb-4 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-indigo-300">New Row Configuration ({selectedTable})</span>
                <span className="text-[10px] font-mono text-slate-500">Auto-generated PK: [{currentTableConfig.pk}]</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {columns.map((col) => {
                  // Skip PK and timestamps (handled automatically)
                  if (col === currentTableConfig.pk || col === 'created_at' || col === 'start_time' || col === 'end_time' || col === 'calculation_breakdown' || col === 'chart_data_json' || col === 'report_markdown') return null;

                  return (
                    <div key={col}>
                      <label className="block text-[10px] font-mono text-slate-400 mb-1.5 uppercase">{col}</label>
                      <input
                        type={col === 'gni_pc' || col === 'population' || col === 'life_expectancy' || col === 'expected_schooling' || col === 'mean_schooling' || col === 'r_squared' || col === 'mean_squared_error' ? 'number' : 'text'}
                        step="any"
                        placeholder={`Enter ${col}`}
                        required
                        value={newRecordState[col] || ''}
                        onChange={(e) => handleInputChange(col, e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 bg-slate-950 text-slate-400 text-xs rounded-lg hover:text-slate-200 border border-slate-850"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-500 font-semibold"
                >
                  Commit Insert
                </button>
              </div>
            </form>
          )}

          {/* Table Data Viewport */}
          <div className="flex-1 overflow-x-auto border border-slate-900 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-900">
                  {columns.map((col) => (
                    <th key={col} className="px-4 py-3 font-mono text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                      <div className="flex items-center gap-1">
                        {col === currentTableConfig.pk && <Key className="w-3 h-3 text-yellow-500" />}
                        <span>{col}</span>
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {filteredRows.length > 0 ? (
                  filteredRows.map((row: any, rIdx) => {
                    const pkVal = row[currentTableConfig.pk];
                    return (
                      <tr key={pkVal || rIdx} className="hover:bg-slate-900/25 transition-colors">
                        {columns.map((col) => {
                          let val = row[col];
                          if (typeof val === 'object' && val !== null) {
                            val = JSON.stringify(val);
                          }
                          return (
                            <td key={col} className="px-4 py-3 font-mono text-slate-300 max-w-[200px] truncate text-[11px]">
                              {val === null ? <span className="text-slate-600">NULL</span> : String(val)}
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => onDeleteRecord(selectedTable, pkVal)}
                            className="p-1.5 text-rose-500 hover:text-rose-400 hover:bg-rose-500/5 rounded transition-colors"
                            title="Delete Row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={columns.length + 1} className="text-center py-12 text-slate-500 font-mono text-xs">
                      No matching records found inside {selectedTable} table.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

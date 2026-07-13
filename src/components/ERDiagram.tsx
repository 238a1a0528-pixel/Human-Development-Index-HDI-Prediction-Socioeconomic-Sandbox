/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { DatabaseState } from '../types';
import { Table, Key, Link, ArrowRight, Info, Eye, Search, HelpCircle, Layers } from 'lucide-react';

interface ERDiagramProps {
  db: DatabaseState;
  onSelectTable: (tableName: keyof DatabaseState) => void;
  selectedTable: keyof DatabaseState;
}

interface EntityNode {
  id: keyof DatabaseState;
  title: string;
  icon: any;
  color: string;
  borderColor: string;
  headerBg: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pk: string;
  fks: string[];
  attrs: string[];
  desc: string;
}

export default function ERDiagram({ db, onSelectTable, selectedTable }: ERDiagramProps) {
  const [hoveredEntity, setHoveredEntity] = useState<keyof DatabaseState | null>(null);

  // Define nodes matching coordinates for clear layout
  const entities: EntityNode[] = [
    {
      id: 'users',
      title: 'User',
      icon: Table,
      color: 'text-indigo-400',
      borderColor: 'border-indigo-500/30',
      headerBg: 'bg-indigo-500/10 text-indigo-300',
      x: 50,
      y: 50,
      width: 240,
      height: 200,
      pk: 'user_id',
      fks: [],
      attrs: ['name', 'email', 'role', 'created_at'],
      desc: 'Socioeconomic analysts and researchers running model predictions.',
    },
    {
      id: 'sessions',
      title: 'Session',
      icon: Table,
      color: 'text-pink-400',
      borderColor: 'border-pink-500/30',
      headerBg: 'bg-pink-500/10 text-pink-300',
      x: 480,
      y: 50,
      width: 240,
      height: 200,
      pk: 'session_id',
      fks: ['user_id'],
      attrs: ['start_time', 'end_time', 'ip_address', 'platform', 'activities_count'],
      desc: 'Tracks session lifespan and volume of simulation operations per user.',
    },
    {
      id: 'datasets',
      title: 'Dataset',
      icon: Table,
      color: 'text-amber-400',
      borderColor: 'border-amber-500/30',
      headerBg: 'bg-amber-500/10 text-amber-300',
      x: 910,
      y: 50,
      width: 240,
      height: 180,
      pk: 'dataset_id',
      fks: [],
      attrs: ['name', 'source', 'records_count', 'release_year'],
      desc: 'UN/World Bank historical socioeconomic training datasets.',
    },
    {
      id: 'countries',
      title: 'Country',
      icon: Table,
      color: 'text-teal-400',
      borderColor: 'border-teal-500/30',
      headerBg: 'bg-teal-500/10 text-teal-300',
      x: 50,
      y: 320,
      width: 240,
      height: 180,
      pk: 'country_id',
      fks: [],
      attrs: ['name', 'region', 'population', 'base_hdi'],
      desc: 'Sovereign nations under diagnostic human development analysis.',
    },
    {
      id: 'hdi_inputs',
      title: 'HDI Input Data',
      icon: Table,
      color: 'text-sky-400',
      borderColor: 'border-sky-500/30',
      headerBg: 'bg-sky-500/10 text-sky-300',
      x: 480,
      y: 320,
      width: 240,
      height: 220,
      pk: 'input_id',
      fks: ['user_id', 'country_id'],
      attrs: ['life_expectancy', 'expected_schooling', 'mean_schooling', 'gni_pc', 'created_at'],
      desc: 'Configured parameters input by analysts to simulate development changes.',
    },
    {
      id: 'ml_models',
      title: 'ML Model',
      icon: Table,
      color: 'text-orange-400',
      borderColor: 'border-orange-500/30',
      headerBg: 'bg-orange-500/10 text-orange-300',
      x: 910,
      y: 320,
      width: 240,
      height: 210,
      pk: 'model_id',
      fks: ['training_dataset_id'],
      attrs: ['name', 'algorithm_type', 'r_squared', 'mean_squared_error'],
      desc: 'Machine learning algorithms trained to output development indices.',
    },
    {
      id: 'hdi_predictions',
      title: 'HDI Prediction',
      icon: Table,
      color: 'text-purple-400',
      borderColor: 'border-purple-500/30',
      headerBg: 'bg-purple-500/10 text-purple-300',
      x: 480,
      y: 600,
      width: 240,
      height: 200,
      pk: 'prediction_id',
      fks: ['input_id', 'model_id'],
      attrs: ['predicted_hdi', 'confidence_interval', 'calculation_breakdown'],
      desc: 'The output composite indicators computed by the active ML algorithm.',
    },
    {
      id: 'visualization_reports',
      title: 'Visualization Report',
      icon: Table,
      color: 'text-emerald-400',
      borderColor: 'border-emerald-500/30',
      headerBg: 'bg-emerald-500/10 text-emerald-300',
      x: 910,
      y: 600,
      width: 240,
      height: 180,
      pk: 'report_id',
      fks: ['prediction_id'],
      attrs: ['title', 'notes', 'chart_data_json', 'report_markdown'],
      desc: 'Policy briefs and charting metrics synthesised from predictions by Gemini AI.',
    }
  ];

  // Relationships with points for path drawing
  const relationships = [
    {
      id: 'user-session',
      from: 'users',
      to: 'sessions',
      type: '1:M',
      desc: 'One user can launch multiple diagnostic sessions',
      path: 'M 290 110 L 480 110',
      fromCardinality: '1',
      toCardinality: '0..*'
    },
    {
      id: 'user-input',
      from: 'users',
      to: 'hdi_inputs',
      type: '1:M',
      desc: 'One user can submit multiple simulation inputs',
      path: 'M 170 250 L 170 290 L 480 350',
      fromCardinality: '1',
      toCardinality: '0..*'
    },
    {
      id: 'country-input',
      from: 'countries',
      to: 'hdi_inputs',
      type: '1:M',
      desc: 'One country can possess multiple historical or custom indicator profiles',
      path: 'M 290 410 L 480 410',
      fromCardinality: '1',
      toCardinality: '0..*'
    },
    {
      id: 'dataset-model',
      from: 'datasets',
      to: 'ml_models',
      type: '1:M',
      desc: 'One dataset is utilized to train multiple machine learning models',
      path: 'M 1030 230 L 1030 320',
      fromCardinality: '1',
      toCardinality: '0..*'
    },
    {
      id: 'input-prediction',
      from: 'hdi_inputs',
      to: 'hdi_predictions',
      type: '1:1',
      desc: 'One input state maps directly to one structured HDI prediction',
      path: 'M 600 540 L 600 600',
      fromCardinality: '1',
      toCardinality: '1'
    },
    {
      id: 'model-prediction',
      from: 'ml_models',
      to: 'hdi_predictions',
      type: '1:M',
      desc: 'One ML model generates multiple development predictions',
      path: 'M 910 425 L 800 425 L 720 630',
      fromCardinality: '1',
      toCardinality: '0..*'
    },
    {
      id: 'prediction-report',
      from: 'hdi_predictions',
      to: 'visualization_reports',
      type: '1:M',
      desc: 'One prediction generates rich charts and analysis reports',
      path: 'M 720 700 L 910 700',
      fromCardinality: '1',
      toCardinality: '0..*'
    }
  ];

  const getRecordCount = (id: keyof DatabaseState) => {
    return db[id]?.length || 0;
  };

  const currentHoverInfo = entities.find(e => e.id === hoveredEntity) || entities.find(e => e.id === selectedTable);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl overflow-hidden relative" id="er-diagram-container">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
              <Layers className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">Interactive Entity-Relationship (ER) Diagram</h2>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Visual model of the HDI prediction ecosystem database. Click any table node to explore its schema and live records.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1.5 text-indigo-300">
            <span className="w-2.5 h-2.5 rounded-sm bg-yellow-500 flex items-center justify-center text-[8px] text-slate-950 font-bold">K</span>
            <span>Primary Key (PK)</span>
          </div>
          <div className="flex items-center gap-1.5 text-pink-300">
            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 flex items-center justify-center text-[8px] text-slate-100 font-bold">F</span>
            <span>Foreign Key (FK)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <div className="w-4 h-0.5 border-t border-indigo-400 border-dashed"></div>
            <span>Relationship Path</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Interactive SVG Diagram Box */}
        <div className="xl:col-span-3 bg-slate-950 border border-slate-850 rounded-xl p-2 overflow-x-auto select-none relative scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          <svg
            viewBox="0 0 1200 840"
            className="w-full min-w-[1000px] h-auto"
            style={{ maxHeight: '580px' }}
          >
            {/* Define marker and filters */}
            <defs>
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
              </marker>
              <marker
                id="arrow-active"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#6366f1" />
              </marker>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Render Relationship Lines */}
            {relationships.map((rel) => {
              const isActive = hoveredEntity === rel.from || hoveredEntity === rel.to || selectedTable === rel.from || selectedTable === rel.to;
              return (
                <g key={rel.id} className="transition-all duration-300">
                  <path
                    d={rel.path}
                    fill="none"
                    stroke={isActive ? '#6366f1' : '#334155'}
                    strokeWidth={isActive ? '3' : '1.5'}
                    strokeDasharray={isActive ? 'none' : '4 4'}
                    className="transition-all duration-300"
                    markerEnd={isActive ? 'url(#arrow-active)' : 'url(#arrow)'}
                  />
                  {/* Cardinality text */}
                  {isActive && (
                    <foreignObject
                      x={(entities.find(e => e.id === rel.from)!.x + entities.find(e => e.id === rel.to)!.x) / 2 + 10}
                      y={(entities.find(e => e.id === rel.from)!.y + entities.find(e => e.id === rel.to)!.y) / 2 - 10}
                      width="120"
                      height="30"
                      className="overflow-visible pointer-events-none"
                    >
                      <div className="bg-slate-900 border border-indigo-500/30 px-2 py-0.5 rounded text-[10px] text-indigo-300 font-semibold shadow-lg text-center backdrop-blur-sm w-max whitespace-nowrap">
                        {rel.type} ({rel.fromCardinality} ➔ {rel.toCardinality})
                      </div>
                    </foreignObject>
                  )}
                </g>
              );
            })}

            {/* Render Entity Tables */}
            {entities.map((node) => {
              const isHovered = hoveredEntity === node.id;
              const isSelected = selectedTable === node.id;
              const count = getRecordCount(node.id);

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-pointer group"
                  onMouseEnter={() => setHoveredEntity(node.id)}
                  onMouseLeave={() => setHoveredEntity(null)}
                  onClick={() => onSelectTable(node.id)}
                >
                  {/* Shadow filter glow for hovered/selected nodes */}
                  {(isHovered || isSelected) && (
                    <rect
                      x="-4"
                      y="-4"
                      width={node.width + 8}
                      height={node.height + 8}
                      rx="14"
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="2"
                      opacity={isSelected ? '1' : '0.5'}
                      filter="url(#glow)"
                    />
                  )}

                  {/* Main Container Card */}
                  <rect
                    width={node.width}
                    height={node.height}
                    rx="12"
                    fill="#0f172a"
                    stroke={isSelected ? '#6366f1' : isHovered ? '#475569' : '#1e293b'}
                    strokeWidth="1.5"
                    className="transition-all duration-200"
                  />

                  {/* Table Title Banner */}
                  <rect
                    width={node.width}
                    height="38"
                    rx="12"
                    fill="none"
                  />
                  <rect
                    width={node.width}
                    height="38"
                    className="fill-slate-900/60"
                  />
                  <line
                    x1="0"
                    y1="38"
                    x2={node.width}
                    y2="38"
                    stroke={isSelected ? '#6366f1/50' : '#1e293b'}
                    strokeWidth="1"
                  />

                  {/* Title and Icon */}
                  <text
                    x="15"
                    y="24"
                    fill={isSelected ? '#a5b4fc' : '#e2e8f0'}
                    fontSize="13"
                    fontWeight="bold"
                    fontFamily="Inter, system-ui, sans-serif"
                  >
                    {node.title}
                  </text>

                  {/* Record Count Badge */}
                  <g transform={`translate(${node.width - 65}, 11)`}>
                    <rect
                      width="50"
                      height="16"
                      rx="8"
                      fill={isSelected ? '#4338ca' : '#1e293b'}
                    />
                    <text
                      x="25"
                      y="11"
                      fill={isSelected ? '#c7d2fe' : '#94a3b8'}
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {count} rows
                    </text>
                  </g>

                  {/* Attribute Fields */}
                  <g transform="translate(0, 48)">
                    {/* Primary Key Field */}
                    <g transform="translate(0, 0)">
                      <rect x="0" y="0" width={node.width} height="24" fill="#1e1b4b/20" opacity="0.5" />
                      <circle cx="20" cy="12" r="4" fill="#eab308" />
                      <text x="32" y="16" fill="#fef08a" fontSize="11.5" fontFamily="monospace" fontWeight="600">
                        {node.pk}
                      </text>
                      <text x={node.width - 32} y="16" fill="#ca8a04" fontSize="9" fontFamily="monospace" textAnchor="end">
                        PK
                      </text>
                    </g>

                    {/* Foreign Keys */}
                    {node.fks.map((fk, idx) => (
                      <g key={fk} transform={`translate(0, ${(idx + 1) * 24})`}>
                        <circle cx="20" cy="12" r="4" fill="#6366f1" />
                        <text x="32" y="16" fill="#c7d2fe" fontSize="11.5" fontFamily="monospace">
                          {fk}
                        </text>
                        <text x={node.width - 32} y="16" fill="#4f46e5" fontSize="9" fontFamily="monospace" textAnchor="end">
                          FK
                        </text>
                      </g>
                    ))}

                    {/* Standard Attributes */}
                    {node.attrs.map((attr, idx) => {
                      const offset = (node.fks.length + 1 + idx) * 24;
                      // Don't draw if exceeding box height
                      if (offset + 10 > node.height - 48) return null;
                      return (
                        <g key={attr} transform={`translate(0, ${offset})`}>
                          <circle cx="20" cy="12" r="3" fill="#475569" />
                          <text x="32" y="16" fill="#94a3b8" fontSize="11.5" fontFamily="Inter, sans-serif">
                            {attr}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Database Sidebar Documentation */}
        <div className="xl:col-span-1 flex flex-col gap-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex-1 flex flex-col">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-indigo-400" />
              <span>Entity Inspector</span>
            </h3>

            {currentHoverInfo ? (
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold text-slate-100 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
                      {currentHoverInfo.title}
                    </span>
                    <span className="text-xs text-slate-500 font-mono bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                      {currentHoverInfo.id}
                    </span>
                  </div>

                  <p className="text-slate-400 text-sm leading-relaxed mb-4">
                    {currentHoverInfo.desc}
                  </p>

                  <div className="space-y-3">
                    <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1">Primary Identifier</div>
                      <div className="text-sm font-mono text-yellow-400 flex items-center gap-1">
                        <Key className="w-3.5 h-3.5" />
                        <span>{currentHoverInfo.pk}</span>
                      </div>
                    </div>

                    {currentHoverInfo.fks.length > 0 && (
                      <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1">Foreign Keys</div>
                        <div className="space-y-1">
                          {currentHoverInfo.fks.map(fk => (
                            <div key={fk} className="text-sm font-mono text-indigo-300 flex items-center gap-1">
                              <Link className="w-3.5 h-3.5" />
                              <span>{fk}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">Key Attributes</div>
                      <div className="flex flex-wrap gap-1.5">
                        {currentHoverInfo.attrs.map(attr => (
                          <span key={attr} className="text-[10px] font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                            {attr}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onSelectTable(currentHoverInfo.id)}
                  className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-600/10 active:scale-95"
                >
                  <Eye className="w-4 h-4" />
                  <span>Browse {currentHoverInfo.title} Table</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-800 rounded-xl">
                <HelpCircle className="w-10 h-10 text-slate-700 mb-2" />
                <span className="text-xs text-slate-500 leading-relaxed">
                  Hover over or tap on any entity node to inspect detailed properties and relationships.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

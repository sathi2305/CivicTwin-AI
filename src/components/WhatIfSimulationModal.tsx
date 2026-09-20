import React, { useState } from 'react';
import { 
  X, 
  Sliders, 
  Play, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Droplets, 
  Car, 
  Trash2, 
  Thermometer, 
  RotateCcw,
  Zap,
  ArrowRight,
  ShieldAlert,
  Download
} from 'lucide-react';
import { SimulationParams, SimulationResult, GeoZone, IndianLanguage } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface WhatIfSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  zones: GeoZone[];
  initialZoneId?: string;
  onApplyResultToTwin?: (result: SimulationResult) => void;
  currentLang: IndianLanguage;
}

export const WhatIfSimulationModal: React.FC<WhatIfSimulationModalProps> = ({
  isOpen,
  onClose,
  zones,
  initialZoneId = 'all',
  onApplyResultToTwin,
  currentLang,
}) => {
  if (!isOpen) return null;

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  // Simulation parameters
  const [params, setParams] = useState<SimulationParams>({
    rainfallDelta: 30,
    drainageCapacityDelta: -10,
    trafficSurgeDelta: 15,
    wasteCollectionDelta: 0,
    temperatureDelta: 1.5,
    selectedZoneId: initialZoneId,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const presets = [
    {
      name: 'Severe Cloudburst (+50% Rain, -20% Drainage)',
      params: { rainfallDelta: 50, drainageCapacityDelta: -20, trafficSurgeDelta: 30, wasteCollectionDelta: -10, temperatureDelta: 0, selectedZoneId: 'all' },
    },
    {
      name: 'Culvert Desilting & Pumping (+40% Drainage)',
      params: { rainfallDelta: 15, drainageCapacityDelta: 40, trafficSurgeDelta: -10, wasteCollectionDelta: 20, temperatureDelta: 0, selectedZoneId: 'zone-d' },
    },
    {
      name: 'Peak Hour Gridlock (+40% Traffic, +20% Rain)',
      params: { rainfallDelta: 20, drainageCapacityDelta: 0, trafficSurgeDelta: 40, wasteCollectionDelta: 0, temperatureDelta: 1.0, selectedZoneId: 'zone-a' },
    },
  ];

  const handleRunSimulation = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/twin/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Failed to run simulation', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setParams({
      rainfallDelta: 0,
      drainageCapacityDelta: 0,
      trafficSurgeDelta: 0,
      wasteCollectionDelta: 0,
      temperatureDelta: 0,
      selectedZoneId: 'all',
    });
    setResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {t.whatIfSimulation || 'Urban What-If Simulation Engine'}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                  PHYSICS & AI GROUNDED
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Stress-test city infrastructure, test interventions, and evaluate risk delta prior to municipal deployment.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Left Controls (40%) | Right Results (60%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          
          {/* Controls Column */}
          <div className="lg:col-span-5 p-4 sm:p-5 space-y-4 bg-slate-950/40 overflow-y-auto">
            
            {/* Quick Presets */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Rapid Scenario Templates
              </span>
              <div className="space-y-1.5">
                {presets.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setParams(p.params);
                    }}
                    className="w-full text-left p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors flex items-center justify-between"
                  >
                    <span className="truncate pr-2">{p.name}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Target Geographic Zone */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Target Zone Domain
              </label>
              <select
                value={params.selectedZoneId}
                onChange={(e) => setParams({ ...params, selectedZoneId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                <option value="all">Entire Metropolis (All Zones A-F)</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} (Risk: {z.currentRiskScore}/100)
                  </option>
                ))}
              </select>
            </div>

            {/* Param Slider 1: Rainfall */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Precipitation / Rainfall Delta</span>
                </span>
                <span className="font-mono font-bold text-cyan-400">
                  {params.rainfallDelta > 0 ? `+${params.rainfallDelta}%` : `${params.rainfallDelta}%`}
                </span>
              </div>
              <input
                type="range"
                min="-20"
                max="100"
                step="5"
                value={params.rainfallDelta}
                onChange={(e) => setParams({ ...params, rainfallDelta: parseInt(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>-20% (Dry)</span>
                <span>Baseline (0%)</span>
                <span>+100% (Torrential)</span>
              </div>
            </div>

            {/* Param Slider 2: Drainage Capacity */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <Zap className="w-3.5 h-3.5 text-blue-400" />
                  <span>Drainage Capacity / Desilting</span>
                </span>
                <span className={`font-mono font-bold ${params.drainageCapacityDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {params.drainageCapacityDelta > 0 ? `+${params.drainageCapacityDelta}%` : `${params.drainageCapacityDelta}%`}
                </span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                step="5"
                value={params.drainageCapacityDelta}
                onChange={(e) => setParams({ ...params, drainageCapacityDelta: parseInt(e.target.value) })}
                className="w-full accent-blue-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>-50% (Choked)</span>
                <span>Baseline</span>
                <span>+50% (Expanded)</span>
              </div>
            </div>

            {/* Param Slider 3: Traffic Volume Surge */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <Car className="w-3.5 h-3.5 text-amber-400" />
                  <span>Traffic Surge & Evacuation Load</span>
                </span>
                <span className="font-mono font-bold text-amber-400">
                  {params.trafficSurgeDelta > 0 ? `+${params.trafficSurgeDelta}%` : `${params.trafficSurgeDelta}%`}
                </span>
              </div>
              <input
                type="range"
                min="-30"
                max="80"
                step="5"
                value={params.trafficSurgeDelta}
                onChange={(e) => setParams({ ...params, trafficSurgeDelta: parseInt(e.target.value) })}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>-30% (Curfew)</span>
                <span>Normal</span>
                <span>+80% (Severe Gridlock)</span>
              </div>
            </div>

            {/* Param Slider 4: Solid Waste Management */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <Trash2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Solid Waste Clearance Rate</span>
                </span>
                <span className="font-mono font-bold text-purple-400">
                  {params.wasteCollectionDelta > 0 ? `+${params.wasteCollectionDelta}%` : `${params.wasteCollectionDelta}%`}
                </span>
              </div>
              <input
                type="range"
                min="-40"
                max="50"
                step="5"
                value={params.wasteCollectionDelta}
                onChange={(e) => setParams({ ...params, wasteCollectionDelta: parseInt(e.target.value) })}
                className="w-full accent-purple-400 cursor-pointer"
              />
            </div>

            {/* Run Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                id="run-simulation-trigger-btn"
                onClick={handleRunSimulation}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:opacity-90 font-bold text-white text-xs shadow-lg shadow-cyan-900/30 transition-all active:scale-98 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Solving Hydrological Twin Equations...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>RUN DIGITAL TWIN SIMULATION</span>
                  </>
                )}
              </button>

              <button
                onClick={handleReset}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Reset Parameters"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* Results Column */}
          <div className="lg:col-span-7 p-4 sm:p-5 space-y-4 overflow-y-auto">
            {!result ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500">
                <Sliders className="w-12 h-12 text-slate-700 mb-3" />
                <h3 className="text-sm font-semibold text-slate-400">Simulation Engine Ready</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                  Adjust precipitation, drainage capacity, or select a scenario template, then click <strong>Run Digital Twin Simulation</strong> to compute spatial flood risk delta and multi-agent AI recommendations.
                </p>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-300">
                
                {/* Result KPI Ribbon */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Baseline Risk</span>
                    <div className="text-2xl font-mono font-bold text-slate-300 mt-1">
                      {result.baselineRisk} <span className="text-xs text-slate-500">/100</span>
                    </div>
                  </div>

                  <div className={`p-3 rounded-xl border ${
                    result.simulatedRisk >= 75 ? 'bg-red-950/40 border-red-800 text-red-300' :
                    result.simulatedRisk >= 55 ? 'bg-amber-950/40 border-amber-800 text-amber-300' :
                    'bg-cyan-950/40 border-cyan-800 text-cyan-300'
                  }`}>
                    <span className="text-[10px] uppercase tracking-wider">Simulated Risk</span>
                    <div className="text-2xl font-mono font-extrabold mt-1 flex items-baseline gap-1.5">
                      <span>{result.simulatedRisk}</span>
                      <span className="text-xs font-mono font-bold">
                        ({result.riskDelta > 0 ? `+${result.riskDelta}` : result.riskDelta})
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Economic Risk Exposure</span>
                    <div className="text-xl font-mono font-bold text-white mt-1">
                      ₹{result.estimatedEconomicImpactLakhs} <span className="text-xs text-slate-400">Lakhs</span>
                    </div>
                  </div>
                </div>

                {/* Infrastructure Stress Status */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-cyan-400" />
                    <span className="text-slate-300 font-medium">Infrastructure Stress Level:</span>
                    <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                      result.infrastructureStress === 'CRITICAL' ? 'bg-red-950 text-red-300 border border-red-800' :
                      result.infrastructureStress === 'HIGH' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                      'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}>
                      {result.infrastructureStress}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Timestamp: {result.timestamp}
                  </span>
                </div>

                {/* AI Multi-Agent Explainability Briefing */}
                <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-800/40 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Multi-Agent Simulation & Explainability Briefing</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">
                    {result.aiExplanation}
                  </p>
                </div>

                {/* Impacted Zones Breakdown Table */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Zone Surcharge & Waterlogging Projections
                  </h4>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {result.affectedZones.map((zone) => (
                      <div
                        key={zone.zoneId}
                        className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold text-white">{zone.zoneName}</div>
                          <div className="text-[11px] text-slate-400">{zone.stressFactor}</div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-400">{zone.baselineRisk} →</span>
                            <span className={`font-mono font-bold ${
                              zone.simulatedRisk >= 75 ? 'text-red-400' :
                              zone.simulatedRisk >= 55 ? 'text-amber-400' :
                              'text-emerald-400'
                            }`}>
                              {zone.simulatedRisk}/100
                            </span>
                          </div>
                          <div className="text-[10px] text-cyan-400 font-mono">
                            Est. Depth: +{zone.estimatedWaterloggingCm}cm | Delay: +{zone.trafficDelayMin}m
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Municipal Interventions */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Recommended High-Priority Interventions
                  </h4>
                  <div className="space-y-2">
                    {result.recommendedActions.map((act, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="font-medium text-white">{act.action}</div>
                          <div className="text-[11px] text-slate-400">
                            Est. Cost: <strong className="text-emerald-400">{act.costEstimate}</strong> | Expected Risk Reduction: <strong className="text-cyan-400">-{act.expectedRiskReduction}%</strong>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          act.priority === 'Immediate' ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-blue-950 text-blue-300 border border-blue-800'
                        }`}>
                          {act.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono text-[11px]">
            * Synthetic demonstration data grounded in hydrodynamic elevation contours.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

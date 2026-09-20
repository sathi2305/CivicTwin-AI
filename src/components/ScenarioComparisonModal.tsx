import React, { useState } from 'react';
import { 
  X, 
  GitCompare, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  Users,
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';
import { IndianLanguage } from '../types';
import { PRESET_SCENARIOS } from '../data/mockCityData';
import { TRANSLATIONS } from '../data/translations';

interface ScenarioComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: IndianLanguage;
}

export const ScenarioComparisonModal: React.FC<ScenarioComparisonModalProps> = ({
  isOpen,
  onClose,
  currentLang,
}) => {
  if (!isOpen) return null;

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const [selectedScenarioA, setSelectedScenarioA] = useState<string>('sc-01'); // Baseline
  const [selectedScenarioB, setSelectedScenarioB] = useState<string>('sc-02'); // Pumping & Desilting
  const [selectedScenarioC, setSelectedScenarioC] = useState<string>('sc-03'); // Dynamic Sluices

  const scA = PRESET_SCENARIOS.find(s => s.id === selectedScenarioA) || PRESET_SCENARIOS[0];
  const scB = PRESET_SCENARIOS.find(s => s.id === selectedScenarioB) || PRESET_SCENARIOS[1];
  const scC = PRESET_SCENARIOS.find(s => s.id === selectedScenarioC) || PRESET_SCENARIOS[2];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20 text-white">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {t.scenarioComparison || 'Municipal Scenario Comparison Matrix'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-criteria comparative trade-off analysis between baseline risk and proactive municipal intervention packages.
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

        {/* 3-Column Scenario Comparison Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Scenario 1: Baseline */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-red-900/40 relative flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                    SCENARIO A
                  </span>
                  <span className="text-xs text-slate-400">Status Quo</span>
                </div>
                <h3 className="font-bold text-white text-sm">{scA.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{scA.description}</p>
                
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Flood Inundation Risk:</span>
                    <span className="font-mono font-bold text-red-400">{scA.projectedFloodRisk}/100</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Traffic Congestion Index:</span>
                    <span className="font-mono font-bold text-amber-400">{scA.projectedTrafficCongestion}/100</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Municipal Capex Cost:</span>
                    <span className="font-mono font-bold text-slate-200">{scA.costLakhs}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Emergency Response ETA:</span>
                    <span className="font-mono font-bold text-red-400">{scA.responseLagMinutes} mins</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Population Protected:</span>
                    <span className="font-mono font-bold text-slate-300">{scA.populationProtected.toLocaleString()} citizens</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-red-400 font-medium">
                ⚠️ High economic exposure and prolonged residential waterlogging.
              </div>
            </div>

            {/* Scenario 2: Intermediate Intervention */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-cyan-800/60 relative flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    SCENARIO B
                  </span>
                  <span className="text-xs text-cyan-400">Tactical Pumping</span>
                </div>
                <h3 className="font-bold text-white text-sm">{scB.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{scB.description}</p>
                
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Flood Inundation Risk:</span>
                    <span className="font-mono font-bold text-amber-400">{scB.projectedFloodRisk}/100</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Traffic Congestion Index:</span>
                    <span className="font-mono font-bold text-amber-300">{scB.projectedTrafficCongestion}/100</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Municipal Capex Cost:</span>
                    <span className="font-mono font-bold text-emerald-400">{scB.costLakhs}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Emergency Response ETA:</span>
                    <span className="font-mono font-bold text-cyan-400">{scB.responseLagMinutes} mins</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Population Protected:</span>
                    <span className="font-mono font-bold text-slate-300">{scB.populationProtected.toLocaleString()} citizens</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-cyan-400 font-medium">
                ✓ Cost-effective for moderate intensity storms under 45mm/hr.
              </div>
            </div>

            {/* Scenario 3: Comprehensive Multi-Modal */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-emerald-500/50 shadow-xl relative flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    SCENARIO C (RECOMMENDED)
                  </span>
                  <span className="text-xs text-emerald-400">Integrated Twin</span>
                </div>
                <h3 className="font-bold text-white text-sm">{scC.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{scC.description}</p>
                
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Flood Inundation Risk:</span>
                    <span className="font-mono font-bold text-emerald-400">{scC.projectedFloodRisk}/100</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Traffic Congestion Index:</span>
                    <span className="font-mono font-bold text-emerald-300">{scC.projectedTrafficCongestion}/100</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Municipal Capex Cost:</span>
                    <span className="font-mono font-bold text-emerald-400">{scC.costLakhs}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Emergency Response ETA:</span>
                    <span className="font-mono font-bold text-emerald-400">{scC.responseLagMinutes} mins</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Population Protected:</span>
                    <span className="font-mono font-bold text-emerald-300">{scC.populationProtected.toLocaleString()} citizens</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-emerald-400 font-medium">
                ★ Maximum resilience: Prevents hospital isolation and saves ~₹280 Lakhs in flood damages.
              </div>
            </div>

          </div>

          {/* Trade-Off Recommendation Box */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-2">
            <h4 className="font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Multi-Agent AI Policy Recommendation</span>
            </h4>
            <p>
              While <strong>Scenario C</strong> requires ₹110 Lakhs upfront municipal allocation, its benefit-to-cost ratio (BCR) is estimated at <strong>3.8x</strong> based on prevented infrastructure damage, business continuity along the IT Corridor, and zero casualty probability. We recommend deploying mobile suction bowsers immediately while initiating dynamic traffic signal preemption.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
          >
            Close Matrix
          </button>
        </div>

      </div>
    </div>
  );
};

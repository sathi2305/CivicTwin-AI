import React from 'react';
import { 
  X, 
  Cpu, 
  ShieldAlert, 
  Droplets, 
  Car, 
  Trash2, 
  Wind, 
  Ambulance, 
  Sliders, 
  Lightbulb, 
  BookOpen,
  CheckCircle2,
  Activity
} from 'lucide-react';

interface MultiAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MultiAgentModal: React.FC<MultiAgentModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const agents = [
    {
      name: 'Risk Intelligence Agent',
      icon: ShieldAlert,
      color: 'text-red-400 bg-red-950/40 border-red-800',
      status: 'Active (Continuous)',
      confidence: '98.4%',
      task: 'Synthesizes multimodal vectors into composite 0-100 zone vulnerability indices with spatial autocorrelation.',
    },
    {
      name: 'Flood Intelligence Agent',
      icon: Droplets,
      color: 'text-cyan-400 bg-cyan-950/40 border-cyan-800',
      status: 'High Alert (Zone D)',
      confidence: '96.2%',
      task: 'Models storm runoff, water gauge telemetry, and culvert backflow using digital elevation model (DEM).',
    },
    {
      name: 'Traffic Intelligence Agent',
      icon: Car,
      color: 'text-amber-400 bg-amber-950/40 border-amber-800',
      status: 'Active (Optimizing)',
      confidence: '94.8%',
      task: 'Monitors intersection loop detectors, detects underpass congestion, and dynamically routes emergency green corridors.',
    },
    {
      name: 'Waste Intelligence Agent',
      icon: Trash2,
      color: 'text-purple-400 bg-purple-950/40 border-purple-800',
      status: 'Active',
      confidence: '92.1%',
      task: 'Correlates smart bin fill-levels with drainage choke hazards to prioritize compactor dispatch before monsoon storms.',
    },
    {
      name: 'Environmental & Air Quality Agent',
      icon: Wind,
      color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800',
      status: 'Monitoring',
      confidence: '95.5%',
      task: 'Monitors particulate matter (PM2.5/PM10) sensors and tracks heat island effects across industrial corridors.',
    },
    {
      name: 'Emergency Response Agent',
      icon: Ambulance,
      color: 'text-blue-400 bg-blue-950/40 border-blue-800',
      status: 'Standby Ready',
      confidence: '99.1%',
      task: 'Tracks real-time hospital trauma bed capacity, rescue boat readiness, and pre-stocks flood relief shelters.',
    },
    {
      name: 'What-If Simulation Agent',
      icon: Sliders,
      color: 'text-indigo-400 bg-indigo-950/40 border-indigo-800',
      status: 'Interactive Engine',
      confidence: '97.0%',
      task: 'Executes parametric stress tests (rainfall, drainage, traffic) and simulates infrastructure stress before events.',
    },
    {
      name: 'Recommendation Agent',
      icon: Lightbulb,
      color: 'text-yellow-400 bg-yellow-950/40 border-yellow-800',
      status: 'Reasoning Active',
      confidence: '93.7%',
      task: 'Ranks municipal interventions by benefit-to-cost ratio (BCR), estimated risk reduction, and operational SLA.',
    },
    {
      name: 'Explanation & RAG Agent',
      icon: BookOpen,
      color: 'text-teal-400 bg-teal-950/40 border-teal-800',
      status: 'Online (11 Langs)',
      confidence: '98.9%',
      task: 'Translates complex hydrodynamic equations into plain, natural-language executive briefings across 11 Indian languages.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/20 text-white">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                CivicTwin Multi-Agent AI Architecture
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                9 specialized autonomous and collaborative AI agents coordinating urban digital twin analytics.
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

        {/* Agents Grid */}
        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-3.5 overflow-y-auto">
          {agents.map((ag, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border ${ag.color} flex flex-col justify-between space-y-2`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-current">
                    <ag.icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-950 text-white border border-slate-800 font-bold">
                    {ag.status}
                  </span>
                </div>
                <h3 className="font-bold text-white text-xs mt-2">{ag.name}</h3>
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">{ag.task}</p>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Model Confidence:</span>
                <span className="font-bold text-emerald-400">{ag.confidence}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
          >
            Close Architecture
          </button>
        </div>

      </div>
    </div>
  );
};

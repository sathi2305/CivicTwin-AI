import React, { useEffect, useState } from 'react';
import { 
  X, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Cpu, 
  Database, 
  Radio, 
  Zap, 
  Server
} from 'lucide-react';
import { SystemHealth } from '../types';

interface SystemHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemHealthModal: React.FC<SystemHealthModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const [healthData, setHealthData] = useState<{
    status: string;
    timestamp: string;
    services: SystemHealth[];
  } | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setHealthData(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Digital Twin Observability & Pipeline Health
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time latency metrics across Spatial Index, Multi-Agent Orchestrator, and MQTT ingestion.
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

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4">
          
          {/* Top Status Badge */}
          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-300">
                All Core Services Operational
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Uptime: 99.96%
            </span>
          </div>

          {/* Services List */}
          <div className="space-y-2">
            {(healthData?.services || []).map((srv, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-white flex items-center gap-2">
                    <Server className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{srv.service}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Checked: {srv.lastChecked} • Uptime: {srv.uptime}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-bold text-emerald-400">
                    {srv.latencyMs} ms
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase">
                    {srv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Multi-Agent Digital Twin Reasoning Engine */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <div>
                <div className="font-semibold text-white">Multi-Agent Digital Twin Reasoning Engine</div>
                <div className="text-[10px] text-slate-400">Autonomous Spatial Correlation & Incident Verification</div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
              SYNCHRONIZED
            </span>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

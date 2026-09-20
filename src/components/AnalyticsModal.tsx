import React from 'react';
import { 
  X, 
  BarChart3, 
  TrendingUp, 
  Droplets, 
  Wind, 
  Car, 
  Activity,
  Layers
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  AreaChart, 
  Area, 
  Legend 
} from 'recharts';
import { GeoZone, SensorData } from '../types';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  zones: GeoZone[];
  sensors: SensorData[];
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  isOpen,
  onClose,
  zones,
  sensors,
}) => {
  if (!isOpen) return null;

  // Chart data 1: Risk comparison per zone
  const zoneRiskData = zones.map(z => ({
    name: z.name.split('-')[0].trim(),
    currentRisk: z.currentRiskScore,
    floodRisk: z.metrics.floodRisk,
    trafficRisk: z.metrics.trafficCongestion,
    drainage: z.drainageCapacityMmHr,
  }));

  // Chart data 2: 24-hour flood & rainfall simulation time-series
  const timeSeriesData = [
    { hour: '00:00', rainfall: 5, waterLevel: 1.1, trafficDelay: 8 },
    { hour: '03:00', rainfall: 8, waterLevel: 1.3, trafficDelay: 5 },
    { hour: '06:00', rainfall: 14, waterLevel: 1.8, trafficDelay: 12 },
    { hour: '09:00', rainfall: 22, waterLevel: 2.4, trafficDelay: 28 },
    { hour: '12:00', rainfall: 38, waterLevel: 3.1, trafficDelay: 35 },
    { hour: '15:00', rainfall: 46, waterLevel: 3.85, trafficDelay: 48 },
    { hour: '18:00', rainfall: 32, waterLevel: 3.5, trafficDelay: 42 },
    { hour: '21:00', rainfall: 18, waterLevel: 2.9, trafficDelay: 22 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Urban Digital Twin Analytics & Risk Corroboration
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Multimodal correlations between precipitation, terrain elevation, drainage outflow, and arterial congestion.
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

        {/* Analytics Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          
          {/* Chart 1: Zone Risk Index & Flood Comparison */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                Spatial Risk Index Across Metropolitan Zones (0 - 100 Scale)
              </span>
              <span className="text-[11px] font-mono text-cyan-400">PostGIS Spatial Index</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={zoneRiskData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="currentRisk" name="Overall Risk Index" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="floodRisk" name="Flood Surcharge" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="trafficRisk" name="Traffic Congestion" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: 24h Rainfall vs Lake Surcharge Water Level */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                24-Hour Inflow Surcharge: Precipitation (mm/hr) vs Lake Basin Gauge (Meters)
              </span>
              <span className="text-[11px] font-mono text-emerald-400">IoT Telemetry Live</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="hour" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Area type="monotone" dataKey="rainfall" name="Rainfall (mm/hr)" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="waterLevel" name="Water Gauge (m)" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="trafficDelay" name="Transit Delay (mins)" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
          >
            Close Analytics
          </button>
        </div>

      </div>
    </div>
  );
};

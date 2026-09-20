import React from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Radio, 
  Ambulance, 
  CloudRain, 
  TrendingUp,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { GeoZone, SensorData, CitizenReport, IndianLanguage } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface MetricStripProps {
  zones: GeoZone[];
  sensors: SensorData[];
  reports: CitizenReport[];
  currentLang: IndianLanguage;
  onSelectZone: (zoneId: string) => void;
}

export const MetricStrip: React.FC<MetricStripProps> = ({
  zones,
  sensors,
  reports,
  currentLang,
  onSelectZone,
}) => {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  const avgRisk = Math.round(zones.reduce((sum, z) => sum + z.currentRiskScore, 0) / (zones.length || 1));
  const activeReports = reports.filter(r => r.status !== 'resolved').length;
  const criticalZones = zones.filter(z => z.riskLevel === 'critical' || z.riskLevel === 'high');
  const anomaliesCount = sensors.filter(s => s.status === 'anomaly').length;

  let riskColor = 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20';
  let riskBadge = 'OPTIMAL';
  if (avgRisk >= 70) {
    riskColor = 'text-red-400 border-red-500/30 bg-red-950/30';
    riskBadge = 'CRITICAL ALERT';
  } else if (avgRisk >= 50) {
    riskColor = 'text-amber-400 border-amber-500/30 bg-amber-950/30';
    riskBadge = 'ELEVATED RISK';
  } else if (avgRisk >= 35) {
    riskColor = 'text-blue-400 border-blue-500/30 bg-blue-950/30';
    riskBadge = 'MODERATE';
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-slate-950/90 border-b border-slate-800 select-none">
      {/* City Risk Score Card */}
      <div className={`p-3 rounded-xl border ${riskColor} flex flex-col justify-between backdrop-blur-sm relative overflow-hidden`}>
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>{t.riskScore || 'City Risk Index'}</span>
          <ShieldAlert className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="flex items-baseline gap-2 my-1">
          <span className="text-3xl font-extrabold tracking-tight font-mono">{avgRisk}</span>
          <span className="text-xs text-slate-400 font-mono">/ 100</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ml-auto bg-slate-900/80 border border-current">
            {riskBadge}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <TrendingUp className="w-3 h-3 text-red-400" />
          <span>+8% in last 3 hours (Precipitation)</span>
        </div>
      </div>

      {/* Active Incidents Card */}
      <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between backdrop-blur-sm">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>{t.activeIncidents || 'Active Incidents'}</span>
          <AlertTriangle className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex items-baseline gap-2 my-1">
          <span className="text-3xl font-extrabold tracking-tight font-mono text-white">{activeReports}</span>
          <span className="text-xs text-amber-400 font-mono">Open</span>
          <span className="text-[11px] text-slate-400 ml-auto">
            {criticalZones.length} high-risk zones
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate">
          <span className="w-2 h-2 rounded-full bg-red-400"></span>
          <span className="truncate">Top: Zone D (Lake Basin)</span>
        </div>
      </div>

      {/* Monitored IoT Sensors Card */}
      <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between backdrop-blur-sm">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>{t.monitoredSensors || 'Online Sensors'}</span>
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
        </div>
        <div className="flex items-baseline gap-2 my-1">
          <span className="text-3xl font-extrabold tracking-tight font-mono text-white">{sensors.length}</span>
          <span className="text-xs text-emerald-400 font-mono">Live</span>
          {anomaliesCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-800 ml-auto font-bold animate-pulse">
              {anomaliesCount} Anomaly
            </span>
          )}
        </div>
        <div className="text-[11px] text-slate-400 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>Telemetry Stream: 2.4s latency</span>
        </div>
      </div>

      {/* Emergency Resources Ready Card */}
      <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between backdrop-blur-sm">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>{t.emergencyUnits || 'Emergency Units'}</span>
          <Ambulance className="w-4 h-4 text-blue-400" />
        </div>
        <div className="flex items-baseline gap-2 my-1">
          <span className="text-3xl font-extrabold tracking-tight font-mono text-white">14</span>
          <span className="text-xs text-blue-400 font-mono">Deployed</span>
          <span className="text-[11px] text-slate-400 ml-auto">1,170 beds</span>
        </div>
        <div className="text-[11px] text-slate-400 flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-400" />
          <span>Green transit corridor standby</span>
        </div>
      </div>

      {/* Live Monsoonal Weather Card */}
      <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between backdrop-blur-sm col-span-2 md:col-span-1">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Monsoon Telemetry</span>
          <CloudRain className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="flex items-baseline gap-2 my-1">
          <span className="text-3xl font-extrabold tracking-tight font-mono text-cyan-300">34.2</span>
          <span className="text-xs text-cyan-400 font-mono">mm/hr</span>
          <span className="text-[11px] text-slate-400 ml-auto">84% Humid</span>
        </div>
        <div className="text-[11px] text-slate-400 flex items-center justify-between">
          <span>Wind: 22 km/h SW</span>
          <span className="font-mono text-[10px] text-cyan-400">1004 hPa</span>
        </div>
      </div>
    </div>
  );
};

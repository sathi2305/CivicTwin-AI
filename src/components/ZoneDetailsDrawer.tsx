import React from 'react';
import { 
  X, 
  MapPin, 
  TrendingUp, 
  Droplets, 
  Car, 
  Wind, 
  Trash2, 
  Activity, 
  Sliders,
  AlertTriangle,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { GeoZone, DigitalTwinEntity, SensorData, IndianLanguage } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface ZoneDetailsDrawerProps {
  zone: GeoZone | null;
  onClose: () => void;
  entities: DigitalTwinEntity[];
  sensors: SensorData[];
  onOpenSimulationForZone: (zoneId: string) => void;
  currentLang: IndianLanguage;
}

export const ZoneDetailsDrawer: React.FC<ZoneDetailsDrawerProps> = ({
  zone,
  onClose,
  entities,
  sensors,
  onOpenSimulationForZone,
  currentLang,
}) => {
  if (!zone) return null;

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const zoneEntities = entities.filter(e => e.zoneId === zone.id);
  const zoneSensors = sensors.filter(s => s.zoneId === zone.id);

  let riskBadgeColor = 'bg-emerald-950 text-emerald-400 border-emerald-800';
  if (zone.currentRiskScore >= 75) {
    riskBadgeColor = 'bg-red-950 text-red-400 border-red-800 animate-pulse';
  } else if (zone.currentRiskScore >= 55) {
    riskBadgeColor = 'bg-amber-950 text-amber-400 border-amber-800';
  } else if (zone.currentRiskScore >= 35) {
    riskBadgeColor = 'bg-blue-950 text-blue-400 border-blue-800';
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] bg-slate-950/95 border-l border-slate-800 shadow-2xl backdrop-blur-xl p-5 overflow-y-auto animate-in slide-in-from-right duration-300 text-slate-100 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                {zone.code}
              </span>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${riskBadgeColor}`}>
                RISK: {zone.currentRiskScore}/100
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1.5 leading-tight">{zone.name}</h2>
            {zone.localName && (
              <p className="text-xs text-slate-400 mt-0.5">{zone.localName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Demographics Grid */}
        <div className="grid grid-cols-3 gap-2 my-4">
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">{t.population || 'Population'}</span>
            <div className="text-sm font-mono font-bold text-white mt-1">
              {(zone.population / 1000).toFixed(0)}k
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">{t.elevation || 'Elevation'}</span>
            <div className="text-sm font-mono font-bold text-cyan-400 mt-1">
              {zone.elevationMeters}m MSL
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">{t.drainageCapacity || 'Drainage'}</span>
            <div className="text-sm font-mono font-bold text-emerald-400 mt-1">
              {zone.drainageCapacityMmHr} mm/h
            </div>
          </div>
        </div>

        {/* Risk Vector Breakdown Bars */}
        <div className="space-y-2.5 mb-5 p-3.5 rounded-xl bg-slate-900/50 border border-slate-800">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>Multimodal Risk Stress Vectors</span>
            <span className="text-[11px] text-slate-400">Score</span>
          </div>

          {[
            { label: 'Flood Risk & Surcharge', value: zone.metrics.floodRisk, icon: Droplets, color: 'bg-blue-500' },
            { label: 'Traffic Density & Congestion', value: zone.metrics.trafficCongestion, icon: Car, color: 'bg-amber-500' },
            { label: 'Air Quality (AQI)', value: Math.min(100, Math.round(zone.metrics.airQualityIndex / 3)), icon: Wind, color: 'bg-purple-500' },
            { label: 'Waterlogging Inundation Probability', value: zone.metrics.waterLoggingProbability, icon: ShieldAlert, color: 'bg-red-500' },
            { label: 'Infrastructure Stress Index', value: zone.metrics.infrastructureStress, icon: Activity, color: 'bg-cyan-500' },
          ].map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <item.icon className="w-3.5 h-3.5 text-slate-400" />
                  <span>{item.label}</span>
                </span>
                <span className="font-mono font-bold">{item.value}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div 
                  className={`h-full rounded-full ${item.color}`}
                  style={{ width: `${item.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Contributing Vulnerability Factors */}
        <div className="mb-5">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Primary Physical Contributing Factors</span>
          </h3>
          <div className="space-y-1.5">
            {zone.contributingFactors.map((factor, idx) => (
              <div key={idx} className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2">
                <span className="text-cyan-400 font-mono">0{idx + 1}.</span>
                <span>{factor}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Zone Sensors */}
        {zoneSensors.length > 0 && (
          <div className="mb-5">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Zone IoT Sensors ({zoneSensors.length})
            </h3>
            <div className="space-y-2">
              {zoneSensors.map(sensor => (
                <div key={sensor.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-medium text-white">{sensor.name}</div>
                    <div className="text-[10px] text-slate-400">Normal: {sensor.normalRange[0]}-{sensor.normalRange[1]} {sensor.unit}</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-mono font-bold ${sensor.status === 'anomaly' ? 'text-red-400 text-sm' : 'text-emerald-400'}`}>
                      {sensor.currentValue} {sensor.unit}
                    </div>
                    <span className="text-[10px] text-slate-400">{sensor.lastUpdated}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Facilities in Zone */}
        {zoneEntities.length > 0 && (
          <div className="mb-5">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Critical Facilities Located in Zone
            </h3>
            <div className="space-y-1.5">
              {zoneEntities.map(fac => (
                <div key={fac.id} className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-xs flex items-center justify-between">
                  <span className="font-medium text-white truncate pr-2">{fac.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 shrink-0">
                    {fac.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-slate-800">
        <button
          onClick={() => {
            onClose();
            onOpenSimulationForZone(zone.id);
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-900/30 transition-all active:scale-98"
        >
          <Sliders className="w-4 h-4" />
          <span>Simulate What-If Interventions in {zone.name.split('-')[0]}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

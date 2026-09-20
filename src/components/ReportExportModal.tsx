import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileText, 
  Download, 
  Printer, 
  CheckCircle2, 
  Copy, 
  ShieldAlert,
  Building2
} from 'lucide-react';
import { IndianLanguage } from '../types';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: IndianLanguage;
}

export const ReportExportModal: React.FC<ReportExportModalProps> = ({
  isOpen,
  onClose,
  currentLang,
}) => {
  if (!isOpen) return null;

  const [reportData, setReportData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/twin/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: currentLang }),
    })
      .then(res => res.json())
      .then(data => setReportData(data))
      .catch(err => console.error(err));
  }, [currentLang]);

  const handleDownloadJSON = () => {
    if (!reportData) return;
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `civictwin-urban-audit-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyMarkdown = () => {
    if (!reportData) return;
    const md = `
# ${reportData.title}
Generated: ${reportData.generatedAt}

## Metropolitan Summary Metrics
- Total Population Monitored: ${reportData.cityMetrics?.totalPopulation?.toLocaleString()}
- Average City Risk Score: ${reportData.cityMetrics?.averageCityRisk} / 100
- High/Critical Vulnerability Zones: ${reportData.cityMetrics?.criticalZonesCount}
- Monitored Telemetry Sensors: ${reportData.cityMetrics?.activeSensors}
- Open Verified Citizen Incidents: ${reportData.cityMetrics?.openCitizenIncidents}

## High-Risk Zones Breakdown
${reportData.criticalZoneBreakdown?.map((z: any) => `- **${z.name}** (Risk: ${z.score}/100, Elevation: ${z.elevation}): Threat - ${z.primaryThreat}`).join('\n')}

## Recommended Disaster SOP Directives
${reportData.recommendedSOPs?.map((s: any) => `- ${s.title}: ${s.keyDirective}`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Executive Urban Risk Audit & Digital Twin Briefing
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Standard disaster management report conforming to NDMA & smart city municipal standards.
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

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {reportData ? (
            <div className="space-y-4">
              
              {/* Summary Metrics */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase">Average City Risk</span>
                  <div className="text-xl font-mono font-bold text-white mt-1">
                    {reportData.cityMetrics.averageCityRisk} / 100
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase">Critical Zones</span>
                  <div className="text-xl font-mono font-bold text-red-400 mt-1">
                    {reportData.cityMetrics.criticalZonesCount} zones
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase">Monitored Citizens</span>
                  <div className="text-xl font-mono font-bold text-cyan-400 mt-1">
                    {reportData.cityMetrics.totalPopulation.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Critical Zones List */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="font-semibold text-white uppercase text-[11px] tracking-wider">
                  Critical Vulnerability Breakdown
                </h4>
                {reportData.criticalZoneBreakdown.map((z: any, idx: number) => (
                  <div key={idx} className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">{z.name} (Risk {z.score})</div>
                      <div className="text-[10px] text-slate-400">Elevation: {z.elevation} • Threat: {z.primaryThreat}</div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                      HIGH RISK
                    </span>
                  </div>
                ))}
              </div>

              {/* Recommended SOPs */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="font-semibold text-white uppercase text-[11px] tracking-wider">
                  Disaster SOP & Action Directives
                </h4>
                {reportData.recommendedSOPs.map((s: any, idx: number) => (
                  <div key={idx} className="p-2 rounded-lg bg-slate-900 text-slate-300 border border-slate-800/80">
                    <div className="font-medium text-cyan-300">{s.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{s.keyDirective}</div>
                  </div>
                ))}
              </div>

            </div>
          ) : (
            <div className="p-8 text-center text-slate-400">Generating report...</div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Markdown' : 'Copy Markdown'}</span>
            </button>
            <button
              onClick={handleDownloadJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download JSON</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Sparkles, 
  ShieldAlert, 
  AlertTriangle, 
  Droplets, 
  Car, 
  Trash2, 
  ArrowRight, 
  ThumbsUp, 
  CheckCircle2,
  Filter,
  Flame,
  Camera,
  LocateFixed
} from 'lucide-react';
import { AIInsight, CitizenReport, GeoZone, IndianLanguage } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface AIInsightsFeedProps {
  insights: AIInsight[];
  reports: CitizenReport[];
  zones: GeoZone[];
  onSelectZone: (zoneId: string) => void;
  onLocateReport?: (report: CitizenReport) => void;
  onOpenReportModal: () => void;
  currentLang: IndianLanguage;
}

export const AIInsightsFeed: React.FC<AIInsightsFeedProps> = ({
  insights,
  reports,
  zones,
  onSelectZone,
  onLocateReport,
  onOpenReportModal,
  currentLang,
}) => {
  const [tab, setTab] = useState<'insights' | 'citizen_reports'>('insights');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  const filteredInsights = categoryFilter === 'all'
    ? insights
    : insights.filter(i => i.category === categoryFilter);

  const filteredReports = categoryFilter === 'all'
    ? reports
    : reports.filter(r => r.category === categoryFilter);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[540px] lg:h-[620px] shadow-xl text-slate-100">
      
      {/* Top Tab Bar */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setTab('insights')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors ${
              tab === 'insights' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Risk Feed</span>
            <span className="text-[10px] font-mono px-1 rounded bg-slate-950/60 text-cyan-200">
              {insights.length}
            </span>
          </button>

          <button
            onClick={() => setTab('citizen_reports')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors ${
              tab === 'citizen_reports' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Citizen Incidents</span>
            <span className="text-[10px] font-mono px-1 rounded bg-slate-950/60 text-cyan-200">
              {reports.length}
            </span>
          </button>
        </div>

        {tab === 'citizen_reports' && (
          <button
            onClick={onOpenReportModal}
            className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            + Report
          </button>
        )}
      </div>

      {/* Filter Row */}
      <div className="px-3 py-2 bg-slate-950/40 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
        <span className="text-slate-500 flex items-center gap-1">
          <Filter className="w-3 h-3" />
        </span>
        {['all', 'flood', 'traffic', 'waste', 'infrastructure'].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-2 py-0.5 rounded-full capitalize font-medium transition-colors ${
              categoryFilter === cat
                ? 'bg-slate-800 text-cyan-300 border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Feed List */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
        {tab === 'insights' ? (
          filteredInsights.map((insight) => {
            const isCritical = insight.level === 'critical';
            const isWarning = insight.level === 'warning';
            return (
              <div
                key={insight.id}
                className={`p-3 rounded-xl border text-xs transition-all hover:border-slate-600 ${
                  isCritical
                    ? 'bg-red-950/20 border-red-900/60'
                    : isWarning
                    ? 'bg-amber-950/20 border-amber-900/60'
                    : 'bg-slate-950/40 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {insight.category === 'flood' ? (
                      <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                    ) : insight.category === 'traffic' ? (
                      <Car className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                    )}
                    <span className="font-mono text-[10px] text-slate-400">{insight.agentSource}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{insight.timestamp}</span>
                </div>

                <h4 className="font-semibold text-white leading-snug">{insight.title}</h4>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{insight.message}</p>

                {insight.actionPrompt && (
                  <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                    <span className="text-cyan-400 font-medium truncate pr-2">
                      ↳ {insight.actionPrompt}
                    </span>
                    {insight.zoneId && (
                      <button
                        onClick={() => onSelectZone(insight.zoneId!)}
                        className="text-slate-400 hover:text-white shrink-0 flex items-center gap-0.5 text-[10px]"
                      >
                        Inspect <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          filteredReports.map((rep) => (
            <div
              key={rep.id}
              className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs hover:border-slate-700 transition-all space-y-2"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-bold text-white text-xs">{rep.title}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                      rep.severity === 'critical' ? 'bg-red-950 text-red-300 border border-red-800' :
                      rep.severity === 'high' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {rep.severity}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Zone: <strong className="text-slate-200">{zones.find(z => z.id === rep.zoneId)?.name}</strong> • {rep.reportedAt}
                  </div>
                </div>

                <span className={`text-[10px] font-mono px-2 py-0.5 rounded capitalize ${
                  rep.status === 'in_progress' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                  rep.status === 'resolved' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                  'bg-slate-800 text-slate-400'
                }`}>
                  {rep.status.replace('_', ' ')}
                </span>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">{rep.description}</p>

              {rep.imageUrl && (
                <img
                  src={rep.imageUrl}
                  alt="Citizen report"
                  className="w-full h-24 object-cover rounded-lg border border-slate-800"
                />
              )}

              {rep.detectedByAI && (
                <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-800/60 text-[10px] text-cyan-300 flex items-center justify-between font-mono">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>AI Vision: {rep.detectedByAI.detectedIssue}</span>
                  </span>
                  <span>{rep.detectedByAI.confidence}%</span>
                </div>
              )}

              <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <button
                  onClick={() => {
                    rep.upvotes += 1;
                  }}
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  <ThumbsUp className="w-3 h-3 text-cyan-400" />
                  <span>{rep.upvotes} Citizens confirmed</span>
                </button>

                <button
                  onClick={() => {
                    if (onLocateReport) {
                      onLocateReport(rep);
                    } else {
                      onSelectZone(rep.zoneId);
                    }
                  }}
                  className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 hover:underline"
                  title="Fly to originating zone on digital twin map"
                >
                  <LocateFixed className="w-3 h-3" />
                  <span>Locate on Twin</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  GeoZone, 
  DigitalTwinEntity, 
  SensorData, 
  CitizenReport, 
  AIInsight, 
  UserRole, 
  IndianLanguage,
  SimulationResult 
} from './types';
import { 
  INITIAL_ZONES, 
  INITIAL_ENTITIES, 
  INITIAL_SENSORS, 
  INITIAL_CITIZEN_REPORTS, 
  INITIAL_AI_INSIGHTS 
} from './data/mockCityData';
import { Navbar } from './components/Navbar';
import { MetricStrip } from './components/MetricStrip';
import { InteractiveMap } from './components/InteractiveMap';
import { AIInsightsFeed } from './components/AIInsightsFeed';
import { ZoneDetailsDrawer } from './components/ZoneDetailsDrawer';
import { WhatIfSimulationModal } from './components/WhatIfSimulationModal';
import { ScenarioComparisonModal } from './components/ScenarioComparisonModal';
import { CitizenReportModal } from './components/CitizenReportModal';
import { AIChatbotDrawer } from './components/AIChatbotDrawer';
import { MultiAgentModal } from './components/MultiAgentModal';
import { AnalyticsModal } from './components/AnalyticsModal';
import { SystemHealthModal } from './components/SystemHealthModal';
import { ReportExportModal } from './components/ReportExportModal';

export default function App() {
  // Core Digital Twin State
  const [zones, setZones] = useState<GeoZone[]>(INITIAL_ZONES);
  const [entities, setEntities] = useState<DigitalTwinEntity[]>(INITIAL_ENTITIES);
  const [sensors, setSensors] = useState<SensorData[]>(INITIAL_SENSORS);
  const [reports, setReports] = useState<CitizenReport[]>(INITIAL_CITIZEN_REPORTS);
  const [insights, setInsights] = useState<AIInsight[]>(INITIAL_AI_INSIGHTS);
  
  // UI & Selection State
  const [selectedZone, setSelectedZone] = useState<GeoZone | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');
  const [currentLang, setCurrentLang] = useState<IndianLanguage>('en');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Drawers State
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);
  const [simulationZoneId, setSimulationZoneId] = useState<string>('all');
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isHealthOpen, setIsHealthOpen] = useState(false);
  const [isAgentsOpen, setIsAgentsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [flyToTrigger, setFlyToTrigger] = useState<{
    zone: GeoZone;
    report?: CitizenReport;
    timestamp: number;
  } | null>(null);
  const [recentReportIds, setRecentReportIds] = useState<Set<string>>(() => new Set(['cr-103']));

  // Fetch initial digital twin state from Express backend
  useEffect(() => {
    fetch('/api/twin/zones')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setZones(data);
        }
      })
      .catch(err => console.warn('Using initial zones state', err));

    fetch('/api/twin/entities')
      .then(res => res.json())
      .then(data => {
        if (data.entities) setEntities(data.entities);
        if (data.sensors) setSensors(data.sensors);
        if (data.citizenReports) setReports(data.citizenReports);
        if (data.aiInsights) setInsights(data.aiInsights);
      })
      .catch(err => console.warn('Using initial entities state', err));
  }, []);

  const handleSelectZoneById = (zoneId: string) => {
    const found = zones.find(z => z.id === zoneId);
    if (found) {
      setSelectedZone(found);
    }
  };

  const handleOpenSimulationForZone = (zoneId: string) => {
    setSimulationZoneId(zoneId);
    setIsSimulationOpen(true);
  };

  const handleAddCitizenReport = (newReport: CitizenReport) => {
    setReports(prev => [newReport, ...prev]);
    setRecentReportIds(prev => new Set(prev).add(newReport.id));

    // Automatically center map on the originating zone with smooth fly-to animation
    const originatingZone = zones.find(z => z.id === newReport.zoneId) || zones[0];
    if (originatingZone) {
      setSelectedZone(originatingZone);
      setFlyToTrigger({
        zone: originatingZone,
        report: newReport,
        timestamp: Date.now(),
      });
    }
  };

  const handleLocateReport = (report: CitizenReport) => {
    const originatingZone = zones.find(z => z.id === report.zoneId) || zones[0];
    if (originatingZone) {
      setSelectedZone(originatingZone);
      setFlyToTrigger({
        zone: originatingZone,
        report,
        timestamp: Date.now(),
      });
      setRecentReportIds(prev => new Set(prev).add(report.id));
    }
  };

  const handleApplySimulationResult = (res: SimulationResult) => {
    // Optionally update zone scores in real-time
    setZones(prev => prev.map(z => {
      const match = res.affectedZones.find(a => a.zoneId === z.id);
      if (match) {
        return {
          ...z,
          currentRiskScore: match.simulatedRisk,
          riskLevel: match.riskLevel,
        };
      }
      return z;
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-cyan-500 selection:text-black">
      
      {/* Top Navigation */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        currentLang={currentLang}
        onLangChange={setCurrentLang}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        insights={insights}
        onOpenSimulation={() => {
          setSimulationZoneId('all');
          setIsSimulationOpen(true);
        }}
        onOpenComparison={() => setIsComparisonOpen(true)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenChat={() => setIsChatOpen(true)}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        onOpenHealth={() => setIsHealthOpen(true)}
        onOpenAgents={() => setIsAgentsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
      />

      {/* Primary KPI Metric Cards Strip */}
      <MetricStrip
        zones={zones}
        sensors={sensors}
        reports={reports}
        currentLang={currentLang}
        onSelectZone={handleSelectZoneById}
      />

      {/* Main Dashboard Command Center: Map + Live Intelligence Feed */}
      <main className="flex-1 p-3 sm:p-5 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Left / Center 8 Columns: Interactive Digital Twin Map */}
          <section className="lg:col-span-8 flex flex-col space-y-3">
            <InteractiveMap
              zones={zones}
              entities={entities}
              sensors={sensors}
              reports={reports}
              selectedZone={selectedZone}
              onSelectZone={setSelectedZone}
              currentLang={currentLang}
              searchQuery={searchQuery}
              onClearSearch={() => setSearchQuery('')}
              flyToTrigger={flyToTrigger}
              recentReportIds={recentReportIds}
            />
          </section>

          {/* Right 4 Columns: AI Insights & Citizen Incidents Feed */}
          <aside className="lg:col-span-4 flex flex-col">
            <AIInsightsFeed
              insights={insights}
              reports={reports}
              zones={zones}
              onSelectZone={handleSelectZoneById}
              onLocateReport={handleLocateReport}
              onOpenReportModal={() => setIsReportModalOpen(true)}
              currentLang={currentLang}
            />
          </aside>

        </div>
      </main>

      {/* Zone Details Drawer */}
      <ZoneDetailsDrawer
        zone={selectedZone}
        onClose={() => setSelectedZone(null)}
        entities={entities}
        sensors={sensors}
        onOpenSimulationForZone={handleOpenSimulationForZone}
        currentLang={currentLang}
      />

      {/* What-If Simulation Engine Modal */}
      <WhatIfSimulationModal
        isOpen={isSimulationOpen}
        onClose={() => setIsSimulationOpen(false)}
        zones={zones}
        initialZoneId={simulationZoneId}
        onApplyResultToTwin={handleApplySimulationResult}
        currentLang={currentLang}
      />

      {/* Scenario Comparison Matrix Modal */}
      <ScenarioComparisonModal
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
        currentLang={currentLang}
      />

      {/* Citizen Report & AI Vision Scan Modal */}
      <CitizenReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        zones={zones}
        onAddReport={handleAddCitizenReport}
        currentLang={currentLang}
      />

      {/* AI Chatbot Drawer (Supports 11 Indian Languages + Tool Calling) */}
      <AIChatbotDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        currentLang={currentLang}
        onLangChange={setCurrentLang}
      />

      {/* Multi-Agent Architecture Modal */}
      <MultiAgentModal
        isOpen={isAgentsOpen}
        onClose={() => setIsAgentsOpen(false)}
      />

      {/* Deep-Dive Urban Analytics Modal */}
      <AnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        zones={zones}
        sensors={sensors}
      />

      {/* System Observability Health Modal */}
      <SystemHealthModal
        isOpen={isHealthOpen}
        onClose={() => setIsHealthOpen(false)}
      />

      {/* Executive Audit Report Export Modal */}
      <ReportExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        currentLang={currentLang}
      />

      {/* Bottom Municipal Platform Footer */}
      <footer className="py-2.5 px-4 border-t border-slate-900 bg-slate-950 text-slate-500 text-[11px] flex flex-wrap items-center justify-between gap-2 select-none">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-400">CivicTwin AI</span>
          <span>• Urban Digital Twin, Risk Intelligence & What-If Simulation Platform</span>
          <span className="text-slate-600 font-mono hidden sm:inline">| Metropolitan Geographic Information System</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px] text-slate-500">
          <span>NDMA / SOP COMPLIANT</span>
          <span>•</span>
          <span className="text-cyan-400 font-medium">REAL-TIME TWIN SYNCHRONIZED</span>
        </div>
      </footer>

    </div>
  );
}

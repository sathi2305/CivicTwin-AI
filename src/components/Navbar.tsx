import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  Bell, 
  ShieldAlert, 
  Activity, 
  Sliders, 
  Layers, 
  FileText, 
  Languages, 
  UserCheck, 
  Bot, 
  PlusCircle,
  GitCompare,
  BarChart3,
  Cpu
} from 'lucide-react';
import { UserRole, IndianLanguage, AIInsight } from '../types';
import { SUPPORTED_LANGUAGES, TRANSLATIONS } from '../data/translations';

interface NavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  currentLang: IndianLanguage;
  onLangChange: (lang: IndianLanguage) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  insights: AIInsight[];
  onOpenSimulation: () => void;
  onOpenComparison: () => void;
  onOpenReportModal: () => void;
  onOpenChat: () => void;
  onOpenAnalytics: () => void;
  onOpenHealth: () => void;
  onOpenAgents: () => void;
  onOpenExport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  currentLang,
  onLangChange,
  searchQuery,
  onSearchChange,
  insights,
  onOpenSimulation,
  onOpenComparison,
  onOpenReportModal,
  onOpenChat,
  onOpenAnalytics,
  onOpenHealth,
  onOpenAgents,
  onOpenExport,
}) => {
  const [showAlerts, setShowAlerts] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const activeAlertsCount = insights.filter(i => i.level === 'critical' || i.level === 'warning').length;

  const quickSearches = [
    { title: 'Central Business District', cat: 'Zone', icon: '🗺️' },
    { title: 'Apex Multi-Specialty Hospital', cat: 'Facility', icon: '🏥' },
    { title: 'Lake Basin & Wetland', cat: 'Zone', icon: '🌊' },
    { title: 'WG-04 Water Level Gauge', cat: 'Sensor', icon: '📡' },
    { title: 'Ward 150: Bellandur', cat: 'Ward', icon: '🏛️' },
    { title: 'Flash Flood Surge', cat: 'Incident', icon: '⚠️' },
    { title: 'Central Fire Station', cat: 'Facility', icon: '🚒' },
  ];

  const filteredSuggestions = searchQuery.trim()
    ? quickSearches.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.cat.toLowerCase().includes(searchQuery.toLowerCase()))
    : quickSearches;

  const handleSelectSuggestion = (title: string) => {
    onSearchChange(title);
    setShowSearchSuggestions(false);
  };

  const roles: { id: UserRole; label: string; icon: string }[] = [
    { id: 'citizen', label: t.roleCitizen || 'Citizen', icon: '👤' },
    { id: 'admin', label: t.roleAdmin || 'Administrator', icon: '🏛️' },
    { id: 'emergency', label: t.roleEmergency || 'Emergency Response', icon: '🚨' },
    { id: 'planner', label: t.rolePlanner || 'Urban Planner', icon: '📐' },
    { id: 'researcher', label: t.roleResearcher || 'Researcher', icon: '🔬' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur border-b border-slate-800 text-white select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Brand & Live Digital Twin Status */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                CIVICTWIN <span className="text-cyan-400 font-mono text-sm px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30">AI</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                TWIN ONLINE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block truncate">
              {t.appSubtitle || 'Urban Digital Twin & Risk Intelligence Platform'}
            </p>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-md mx-2 hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              id="global-search-input"
              value={searchQuery}
              onFocus={() => setShowSearchSuggestions(true)}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setShowSearchSuggestions(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setShowSearchSuggestions(false);
                }
              }}
              placeholder={t.searchPlaceholder || 'Search zones, infrastructure, sensors...'}
              className="w-full bg-slate-900/90 border border-slate-800 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
            />
            {searchQuery && (
              <button 
                id="clear-search-btn"
                onClick={() => {
                  onSearchChange('');
                  setShowSearchSuggestions(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white p-0.5"
                title="Clear search"
              >
                ✕
              </button>
            )}

            {/* Quick Autocomplete Suggestions Dropdown */}
            {showSearchSuggestions && (
              <div 
                className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900/98 border border-slate-700/80 rounded-xl shadow-2xl p-2 z-50 backdrop-blur max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-1"
                onMouseDown={(e) => e.preventDefault()} // Prevent blur from closing before click executes
              >
                <div className="flex items-center justify-between px-2 py-1 text-[10px] font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1">
                  <span>{searchQuery ? 'Matching Locations & Targets' : 'Suggested Spatial Searches'}</span>
                  <span className="text-cyan-400 font-bold">Zoom & Pulse</span>
                </div>
                <div className="space-y-0.5">
                  {filteredSuggestions.length > 0 ? (
                    filteredSuggestions.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectSuggestion(item.title)}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-800 hover:text-cyan-300 transition-colors text-left group"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-sm">{item.icon}</span>
                          <span className="text-slate-200 group-hover:text-cyan-200 font-medium truncate">{item.title}</span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-800 text-slate-400 group-hover:bg-cyan-950 group-hover:text-cyan-300 shrink-0 ml-2">
                          {item.cat}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-center text-xs text-slate-400">
                      Press Enter to search "{searchQuery}" on the map
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Center & Modals Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mobile Search Toggle Button */}
          <button
            id="mobile-search-toggle-btn"
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            className="md:hidden p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-cyan-300 transition-colors"
            title="Search locations on map"
          >
            <Search className="w-4 h-4" />
          </button>
          {/* What-If Simulation Signature Button */}
          <button
            id="nav-whatif-btn"
            onClick={onOpenSimulation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-xs font-semibold text-white shadow-md shadow-cyan-900/30 transition-all active:scale-95"
            title="Launch What-If Simulation Engine"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.whatIfSimulation || 'What-If Simulation'}</span>
          </button>

          {/* Scenario Comparison */}
          <button
            id="nav-scenario-btn"
            onClick={onOpenComparison}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-xs font-medium text-slate-300 transition-colors"
            title="Compare Mitigation Scenarios A, B, C"
          >
            <GitCompare className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.scenarioComparison || 'Scenarios'}</span>
          </button>

          {/* Citizen Report Button */}
          <button
            id="nav-report-issue-btn"
            onClick={onOpenReportModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-medium text-amber-300 transition-colors"
            title="Report Pothole, Flood, or Civic Issue"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.reportIncident || 'Report'}</span>
          </button>

          {/* AI Multi-Agent Architecture */}
          <button
            id="nav-agents-btn"
            onClick={onOpenAgents}
            className="hidden xl:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-xs font-medium text-slate-300 transition-colors"
            title="View 9-Agent AI Architecture"
          >
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>Multi-Agent AI</span>
          </button>

          {/* Urban Analytics */}
          <button
            id="nav-analytics-btn"
            onClick={onOpenAnalytics}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-slate-300 transition-colors"
            title="Deep-dive Urban Analytics"
          >
            <BarChart3 className="w-4 h-4 text-emerald-400" />
          </button>

          {/* AI Chatbot Launcher */}
          <button
            id="nav-chatbot-btn"
            onClick={onOpenChat}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-xs font-medium text-purple-300 transition-colors"
            title="Open AI Chatbot (Indian Languages & Tool Calling)"
          >
            <Bot className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">AI Chat</span>
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping absolute -top-1 -right-1"></span>
          </button>

          {/* Notifications / Alerts Ticker */}
          <div className="relative">
            <button
              id="nav-alerts-btn"
              onClick={() => setShowAlerts(!showAlerts)}
              className="relative p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-slate-300 transition-colors"
              title="City Alerts"
            >
              <Bell className="w-4 h-4" />
              {activeAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                  {activeAlertsCount}
                </span>
              )}
            </button>

            {showAlerts && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    <span>Active Incident & Risk Alerts ({insights.length})</span>
                  </div>
                  <button 
                    onClick={() => setShowAlerts(false)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Close
                  </button>
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {insights.map((item) => (
                    <div 
                      key={item.id} 
                      className={`p-2.5 rounded-lg border text-xs ${
                        item.level === 'critical' 
                          ? 'bg-red-950/40 border-red-800/60 text-red-200' 
                          : item.level === 'warning'
                          ? 'bg-amber-950/40 border-amber-800/60 text-amber-200'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold mb-1">
                        <span className="truncate pr-2">{item.title}</span>
                        <span className="text-[10px] opacity-70 shrink-0">{item.timestamp}</span>
                      </div>
                      <p className="text-[11px] opacity-90 leading-relaxed">{item.message}</p>
                      {item.actionPrompt && (
                        <div className="mt-1.5 pt-1 border-t border-white/10 text-[10px] font-mono text-cyan-300">
                          ↳ Action: {item.actionPrompt}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Indian Language Selector */}
          <div className="relative">
            <button
              id="nav-lang-btn"
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-xs text-slate-300 transition-colors"
              title="Select Indian Language"
            >
              <Languages className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold">{SUPPORTED_LANGUAGES.find(l => l.code === currentLang)?.nativeName.slice(0, 5) || 'EN'}</span>
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 max-h-80 overflow-y-auto">
                <div className="text-[11px] font-semibold text-slate-400 px-2 py-1 mb-1 border-b border-slate-800">
                  Select Indian Language / भाषा
                </div>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      onLangChange(lang.code);
                      setShowLangMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left ${
                      currentLang === lang.code
                        ? 'bg-cyan-600/20 text-cyan-300 font-semibold border border-cyan-500/30'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{lang.name}</span>
                    <span className="font-medium text-slate-400 text-[11px]">{lang.nativeName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Role Selector */}
          <div className="relative">
            <button
              id="nav-role-btn"
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-xs text-slate-300 transition-colors"
              title="Change User Perspective / Role"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="capitalize hidden md:inline">{roles.find(r => r.id === currentRole)?.label}</span>
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50">
                <div className="text-[11px] font-semibold text-slate-400 px-2 py-1 mb-1 border-b border-slate-800">
                  Select Active Role
                </div>
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => {
                      onRoleChange(role.id);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left ${
                      currentRole === role.id
                        ? 'bg-blue-600/20 text-blue-300 font-semibold border border-blue-500/30'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{role.icon}</span>
                    <span>{role.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* System Observability & Export icons */}
          <button
            id="nav-health-btn"
            onClick={onOpenHealth}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-emerald-400 transition-colors"
            title="Observability & Latency Health"
          >
            <Activity className="w-3.5 h-3.5" />
          </button>

          <button
            id="nav-export-btn"
            onClick={onOpenExport}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-cyan-400 transition-colors"
            title="Generate Audit Report (PDF/CSV/JSON)"
          >
            <FileText className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mobile Expandable Search Bar */}
      {isMobileSearchOpen && (
        <div className="md:hidden px-4 pb-3 pt-1 border-t border-slate-800/80 bg-slate-950/98 animate-in fade-in slide-in-from-top-1">
          <div className="relative">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              id="mobile-search-input"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search zones, hospitals, pumps, sensors..."
              autoFocus
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            )}
          </div>
          {/* Quick mobile search suggestions */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-2 scrollbar-none text-[10px]">
            {quickSearches.slice(0, 4).map((s, idx) => (
              <button
                key={idx}
                onClick={() => onSearchChange(s.title)}
                className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 whitespace-nowrap"
              >
                {s.icon} {s.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

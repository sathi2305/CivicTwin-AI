import React, { useState } from 'react';
import { 
  X, 
  Camera, 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  MapPin, 
  Droplets, 
  Car, 
  Trash2, 
  Lightbulb, 
  Send
} from 'lucide-react';
import { GeoZone, CitizenReport, IndianLanguage } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface CitizenReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  zones: GeoZone[];
  onAddReport: (newReport: CitizenReport) => void;
  currentLang: IndianLanguage;
}

export const CitizenReportModal: React.FC<CitizenReportModalProps> = ({
  isOpen,
  onClose,
  zones,
  onAddReport,
  currentLang,
}) => {
  if (!isOpen) return null;

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  const [category, setCategory] = useState<'flood' | 'pothole' | 'waste' | 'streetlight' | 'water_leakage' | 'traffic' | 'infrastructure'>('pothole');
  const [zoneId, setZoneId] = useState<string>(zones[0]?.id || 'zone-a');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'low' | 'moderate' | 'high' | 'critical'>('high');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{
    detectedIssue: string;
    confidence: number;
    severity: 'low' | 'moderate' | 'high' | 'critical';
    actionRequired: string;
  } | null>(null);

  const presetPhotos = [
    {
      label: 'Deep Road Pothole',
      url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
      category: 'pothole' as const,
      defaultTitle: 'Dangerous 15cm Deep Pothole Crater on Bus Lane',
    },
    {
      label: 'Flooded Underpass',
      url: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=600&auto=format&fit=crop&q=80',
      category: 'flood' as const,
      defaultTitle: 'Waterlogging in Sony World Signal Underpass (~40cm water)',
    },
    {
      label: 'Overflowing Waste Bin',
      url: 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=600&auto=format&fit=crop&q=80',
      category: 'waste' as const,
      defaultTitle: 'Solid Waste Overflow Blocking Stormwater Grate',
    },
  ];

  const handleSelectPreset = (preset: typeof presetPhotos[0]) => {
    setImageBase64(preset.url);
    setCategory(preset.category);
    setTitle(preset.defaultTitle);
    setDescription(`Observed significant hazard near transit corridor. Poses immediate risk to pedestrians and two-wheelers.`);
    triggerVisionScan(preset.url, preset.category);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImageBase64(base64);
        triggerVisionScan(base64, category);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerVisionScan = async (imgData: string, cat: string) => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/twin/vision-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imgData,
          categoryHint: cat,
          description: title || description,
        }),
      });
      const data = await res.json();
      setAiAnalysis({
        detectedIssue: data.detectedIssue,
        confidence: data.confidence,
        severity: data.severity,
        actionRequired: data.actionRequired,
      });
      setSeverity(data.severity);
    } catch (err) {
      console.warn('Vision scan error', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedZoneObj = zones.find(z => z.id === zoneId) || zones[0];

    // Slightly randomize near zone center
    const lat = selectedZoneObj.center[0] + (Math.random() - 0.5) * 0.015;
    const lng = selectedZoneObj.center[1] + (Math.random() - 0.5) * 0.015;

    const reportData: Partial<CitizenReport> = {
      title: title || 'Reported Civic Issue',
      description: description || 'Citizen reported issue requiring municipal inspection.',
      category,
      severity,
      zoneId,
      coordinates: [lat, lng],
      imageUrl: imageBase64 || undefined,
      detectedByAI: aiAnalysis ? {
        detectedIssue: aiAnalysis.detectedIssue,
        confidence: aiAnalysis.confidence,
        verified: true,
      } : undefined,
    };

    try {
      const res = await fetch('/api/twin/citizen-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      });
      const result = await res.json();
      if (result.success && result.report) {
        onAddReport(result.report);
      }
    } catch (err) {
      console.error(err);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-white">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {t.reportIncident || 'Citizen Incident Intelligence'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Submit geotagged photos of potholes, waterlogging, or civic defects for automated AI vision verification.
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          
          {/* Preset Photo Shortcuts */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Quick Test Presets (Instant AI Vision Scan)
            </span>
            <div className="grid grid-cols-3 gap-2">
              {presetPhotos.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="p-2 rounded-lg bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-left transition-colors flex flex-col items-center text-center gap-1"
                >
                  <img src={preset.url} alt={preset.label} className="w-full h-14 object-cover rounded-md" />
                  <span className="text-[11px] font-medium text-slate-200 truncate w-full">{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Photo Attachment / Drag Drop */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Upload Photographic Evidence
            </label>
            <div className="relative border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-xl p-4 text-center transition-colors bg-slate-950/40 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              {imageBase64 ? (
                <div className="flex flex-col items-center">
                  <img src={imageBase64} alt="Upload preview" className="max-h-36 rounded-lg object-cover mb-2 border border-slate-700" />
                  <span className="text-xs text-cyan-400">Click or drag another image to replace</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <UploadCloud className="w-8 h-8 text-slate-500 mx-auto" />
                  <div className="text-xs text-slate-300 font-medium">Click to browse or drag and drop photo</div>
                  <div className="text-[10px] text-slate-500">Supports JPEG, PNG, WEBP</div>
                </div>
              )}
            </div>
          </div>

          {/* AI Vision Scan Result Banner */}
          {isAnalyzing && (
            <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800 text-cyan-200 text-xs flex items-center gap-2 animate-pulse">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
              <span>Scanning incident photo with Digital Twin Computer Vision...</span>
            </div>
          )}

          {aiAnalysis && !isAnalyzing && (
            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/50 space-y-1 text-xs">
              <div className="flex items-center justify-between text-emerald-300 font-semibold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>AI Computer Vision Verified</span>
                </span>
                <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-emerald-900/60 text-emerald-300">
                  {aiAnalysis.confidence}% Confidence
                </span>
              </div>
              <div className="text-white font-medium">{aiAnalysis.detectedIssue}</div>
              <div className="text-[11px] text-slate-300">
                Action: <strong className="text-cyan-300">{aiAnalysis.actionRequired}</strong>
              </div>
            </div>
          )}

          {/* Category & Zone Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Issue Category</label>
              <select
                value={category}
                onChange={(e: any) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="pothole">🕳️ Pothole / Road Damage</option>
                <option value="flood">🌊 Waterlogging / Flood</option>
                <option value="waste">🗑️ Garbage / Waste Overflow</option>
                <option value="streetlight">💡 Broken Streetlight</option>
                <option value="water_leakage">💧 Water Pipe Leakage</option>
                <option value="traffic">🚦 Severe Traffic Block</option>
                <option value="infrastructure">🏗️ Infrastructure Damage</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Geographic Ward / Zone</label>
              <select
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Incident Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Deep pothole crater near Main Bus Terminal"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Description / Observations</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe details, estimated water depth, landmark, or two-wheeler danger..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Severity Radio */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Severity Level</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'low', label: 'Low', color: 'border-slate-700 text-slate-300' },
                { id: 'moderate', label: 'Moderate', color: 'border-blue-700 text-blue-300' },
                { id: 'high', label: 'High', color: 'border-amber-700 text-amber-300' },
                { id: 'critical', label: 'Critical', color: 'border-red-700 text-red-300' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSeverity(s.id as any)}
                  className={`py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    severity === s.id ? 'bg-slate-800 font-bold border-cyan-400' : 'bg-slate-950 ' + s.color
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-90 text-xs font-bold text-white shadow-lg shadow-orange-900/30 transition-all active:scale-98"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Report to Digital Twin</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Layers, 
  Eye, 
  EyeOff, 
  MapPin, 
  Maximize2, 
  Compass, 
  Crosshair, 
  Filter, 
  AlertTriangle,
  Radio,
  Flame,
  Hospital,
  Shield,
  Droplets,
  Truck,
  Zap,
  Info,
  Building2,
  Search,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { GeoZone, DigitalTwinEntity, SensorData, CitizenReport, IndianLanguage } from '../types';
import { METROPOLIS_CENTER } from '../data/mockCityData';
import { TRANSLATIONS } from '../data/translations';
import { ADMINISTRATIVE_DISTRICTS } from '../data/administrativeDistricts';

export interface SearchMatchItem {
  id: string;
  name: string;
  category: 'zone' | 'facility' | 'sensor' | 'report' | 'ward';
  categoryLabel: string;
  categoryIcon: string;
  coordinates: [number, number];
  badge: string;
  details: string;
  zoneId?: string;
  rawItem?: any;
}

interface InteractiveMapProps {
  zones: GeoZone[];
  entities: DigitalTwinEntity[];
  sensors: SensorData[];
  reports: CitizenReport[];
  selectedZone: GeoZone | null;
  onSelectZone: (zone: GeoZone | null) => void;
  currentLang: IndianLanguage;
  searchQuery: string;
  onClearSearch?: () => void;
  flyToTrigger?: {
    zone: GeoZone;
    report?: CitizenReport;
    timestamp: number;
  } | null;
  recentReportIds?: Set<string>;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  zones,
  entities,
  sensors,
  reports,
  selectedZone,
  onSelectZone,
  currentLang,
  searchQuery,
  onClearSearch,
  flyToTrigger,
  recentReportIds,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupsRef = useRef<{ [key: string]: L.LayerGroup }>({});
  const reportMarkersRef = useRef<{ [key: string]: L.Marker }>({});
  const searchMarkersRef = useRef<{ [key: string]: L.Marker }>({});
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const [flyToNotice, setFlyToNotice] = useState<{
    zoneName: string;
    reportTitle?: string;
  } | null>(null);

  // Search matches state for interactive map navigation & pulsing
  const [searchMatches, setSearchMatches] = useState<SearchMatchItem[]>([]);
  const [activeSearchIndex, setActiveSearchIndex] = useState<number>(0);
  const lastSearchQueryRef = useRef<string>('');

  const [activeLayers, setActiveLayers] = useState<{ [key: string]: boolean }>({
    zones: true,
    adminLabels: true,
    flood: true,
    traffic: true,
    pollution: false,
    facilities: true,
    sensors: true,
    reports: true,
    drainage: true,
  });

  const [currentZoom, setCurrentZoom] = useState<number>(12.5);
  const [mapStyle, setMapStyle] = useState<'dark' | 'satellite' | 'street'>('dark');
  const [radiusMode, setRadiusMode] = useState<number | null>(null); // 500, 1000, 2000 meters
  const [radiusAnalysisData, setRadiusAnalysisData] = useState<{
    coords: [number, number];
    radiusMeters: number;
    estimatedPop: number;
    nearestHospital: string;
    hospitalDist: string;
    floodSeverity: string;
  } | null>(null);

  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: METROPOLIS_CENTER,
        zoom: 12.5,
        zoomControl: false,
        attributionControl: false,
      });

      // Function to attach active base layers cleanly without watermarks
      const applyBaseTiles = (currentMap: L.Map, style: 'dark' | 'satellite' | 'street') => {
        if (style === 'satellite') {
          L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 19,
          }).addTo(currentMap);
        } else if (style === 'street') {
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
          }).addTo(currentMap);
        } else {
          // Tactical dark canvas without any API key requirement or watermarks
          L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 19,
            maxNativeZoom: 16,
          }).addTo(currentMap);
          L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 19,
            maxNativeZoom: 16,
          }).addTo(currentMap);
        }
      };

      // Add Tile Layer
      applyBaseTiles(map, mapStyle);

      // Layer groups
      layerGroupsRef.current = {
        zones: L.layerGroup().addTo(map),
        adminLabels: L.layerGroup().addTo(map),
        facilities: L.layerGroup().addTo(map),
        sensors: L.layerGroup().addTo(map),
        reports: L.layerGroup().addTo(map),
        radius: L.layerGroup().addTo(map),
        searchHighlights: L.layerGroup().addTo(map),
      };

      // Track zoom level for administrative & district granular labels
      map.on('zoomend', () => {
        setCurrentZoom(map.getZoom());
      });

      // Click for radius analysis
      map.on('click', (e: L.LeafletMouseEvent) => {
        if (radiusMode) {
          handleRadiusInspection(e.latlng.lat, e.latlng.lng, radiusMode);
        }
      });

      mapInstanceRef.current = map;
    }

    return () => {
      // Cleanup on unmount handled gracefully
    };
  }, []);

  // Update Tile Layer when style changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Remove existing tile layers
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    if (mapStyle === 'satellite') {
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
      }).addTo(map);
    } else if (mapStyle === 'street') {
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);
    } else {
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        maxNativeZoom: 16,
      }).addTo(map);
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        maxNativeZoom: 16,
      }).addTo(map);
    }
  }, [mapStyle]);

  // Radius Inspection Handler
  const handleRadiusInspection = (lat: number, lng: number, radiusM: number) => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const radiusGroup = layerGroupsRef.current.radius;
    radiusGroup.clearLayers();

    // Draw inspection circle
    const circle = L.circle([lat, lng], {
      radius: radiusM,
      color: '#06b6d4',
      fillColor: '#0891b2',
      fillOpacity: 0.18,
      weight: 2,
      dashArray: '6, 6',
    }).addTo(radiusGroup);

    radiusCircleRef.current = circle;

    // Find nearest hospital
    const hospitals = entities.filter(e => e.type === 'hospital');
    let nearest = 'Apex Multi-Specialty Hospital';
    let minDist = 999;
    hospitals.forEach(h => {
      const d = Math.hypot(h.coordinates[0] - lat, h.coordinates[1] - lng) * 111; // Approx km
      if (d < minDist) {
        minDist = d;
        nearest = h.name;
      }
    });

    // Estimate population in radius
    const approxDensity = 14000; // per sq km
    const areaSqKm = Math.PI * Math.pow(radiusM / 1000, 2);
    const pop = Math.round(areaSqKm * approxDensity);

    setRadiusAnalysisData({
      coords: [lat, lng],
      radiusMeters: radiusM,
      estimatedPop: pop,
      nearestHospital: nearest,
      hospitalDist: `${minDist.toFixed(1)} km (ETA ~${Math.round(minDist * 3.5)} mins)`,
      floodSeverity: radiusM >= 1000 ? 'Moderate to High in lower catchments' : 'Low to Localized',
    });
  };

  // Re-render GeoZones polygons
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !layerGroupsRef.current.zones) return;

    const group = layerGroupsRef.current.zones;
    group.clearLayers();

    if (!activeLayers.zones) return;

    zones.forEach(zone => {
      const q = searchQuery.trim().toLowerCase();
      const hasSearch = q.length >= 2;
      const isSearchMatch = hasSearch && (
        zone.name.toLowerCase().includes(q) ||
        zone.id.toLowerCase().includes(q) ||
        zone.primaryRiskType.toLowerCase().includes(q) ||
        zone.contributingFactors.some(f => f.toLowerCase().includes(q))
      );

      const isSelected = selectedZone?.id === zone.id;
      let fillColor = '#10b981'; // low
      let borderColor = '#059669';

      if (zone.currentRiskScore >= 75) {
        fillColor = '#ef4444'; // critical
        borderColor = '#dc2626';
      } else if (zone.currentRiskScore >= 55) {
        fillColor = '#f59e0b'; // high
        borderColor = '#d97706';
      } else if (zone.currentRiskScore >= 35) {
        fillColor = '#3b82f6'; // moderate
        borderColor = '#2563eb';
      }

      // Dynamic styling based on selection and search matches
      let strokeColor = borderColor;
      let strokeWidth = 1.5;
      let fillAlpha = 0.25;
      let dashPattern: string | undefined = undefined;

      if (isSearchMatch) {
        strokeColor = '#06b6d4'; // Glowing cyan highlight border
        strokeWidth = 3.5;
        fillAlpha = 0.55;
        dashPattern = '6, 6';
      } else if (isSelected) {
        strokeColor = '#ffffff';
        strokeWidth = 3;
        fillAlpha = 0.45;
        dashPattern = '4, 4';
      } else if (hasSearch) {
        // Softly dim non-matching zones so matched markers and areas pop
        fillAlpha = 0.12;
        strokeWidth = 1;
      }

      const polygon = L.polygon(zone.coordinates, {
        color: strokeColor,
        weight: strokeWidth,
        fillColor: fillColor,
        fillOpacity: fillAlpha,
        dashArray: dashPattern,
      });

      // Tooltip
      polygon.bindTooltip(`
        <div class="p-1 font-sans text-xs">
          <div class="font-bold text-white flex items-center justify-between gap-2">
            <span>${zone.name}</span>
            <span class="px-1 py-0.5 rounded font-mono font-bold ${zone.currentRiskScore >= 60 ? 'bg-red-900 text-red-200' : 'bg-blue-900 text-blue-200'}">
              Risk: ${zone.currentRiskScore}/100
            </span>
          </div>
          <div class="text-[11px] text-slate-300 mt-1">
            Elev: ${zone.elevationMeters}m | Drainage: ${zone.drainageCapacityMmHr} mm/hr
          </div>
          <div class="text-[10px] text-cyan-300 mt-0.5">Click to inspect Digital Twin HUD</div>
        </div>
      `, {
        sticky: true,
        className: 'bg-slate-900/95 border border-slate-700 text-white rounded-lg shadow-xl',
      });

      polygon.on('click', () => {
        onSelectZone(zone);
      });

      polygon.addTo(group);
    });
  }, [zones, selectedZone, activeLayers.zones, searchQuery]);

  // Re-render Facilities, Infrastructure, and Sensors
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Entities Layer
    if (layerGroupsRef.current.facilities) {
      const facGroup = layerGroupsRef.current.facilities;
      facGroup.clearLayers();

      if (activeLayers.facilities) {
        entities.forEach(entity => {
          let iconBg = 'bg-blue-600';
          let symbol = '🏥';
          if (entity.type === 'hospital') {
            iconBg = 'bg-rose-600';
            symbol = '🏥';
          } else if (entity.type === 'fire_station') {
            iconBg = 'bg-red-600';
            symbol = '🚒';
          } else if (entity.type === 'drainage_pump') {
            iconBg = 'bg-cyan-600';
            symbol = '⚡';
          } else if (entity.type === 'shelter') {
            iconBg = 'bg-emerald-600';
            symbol = '🏕️';
          } else if (entity.type === 'water_body') {
            iconBg = 'bg-blue-500';
            symbol = '🌊';
          } else if (entity.type === 'bridge') {
            iconBg = 'bg-amber-600';
            symbol = '🌉';
          }

          const customIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `
              <div class="w-7 h-7 rounded-lg ${iconBg} text-white flex items-center justify-center text-xs shadow-lg shadow-black/50 border border-white/40 cursor-pointer transform hover:scale-125 transition-transform">
                ${symbol}
              </div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });

          const marker = L.marker(entity.coordinates, { icon: customIcon });
          marker.bindTooltip(`
            <div class="p-1 font-sans text-xs">
              <div class="font-bold text-white">${entity.name}</div>
              <div class="text-[11px] text-slate-300">${entity.capacity || 'Facility Operational'}</div>
              <div class="text-[10px] text-emerald-400 mt-0.5">Status: ${entity.status.toUpperCase()}</div>
            </div>
          `, { className: 'bg-slate-900 border border-slate-700 text-white rounded-lg shadow-xl' });

          marker.addTo(facGroup);
        });
      }
    }

    // IoT Sensors Layer
    if (layerGroupsRef.current.sensors) {
      const sensorGroup = layerGroupsRef.current.sensors;
      sensorGroup.clearLayers();

      if (activeLayers.sensors) {
        sensors.forEach(sensor => {
          const isAnomaly = sensor.status === 'anomaly';
          const pulseColor = isAnomaly ? 'bg-red-500' : 'bg-emerald-500';

          const sensorIcon = L.divIcon({
            className: 'sensor-icon',
            html: `
              <div class="relative w-6 h-6 flex items-center justify-center cursor-pointer">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full ${pulseColor} opacity-75"></span>
                <span class="relative inline-flex rounded-full h-3.5 w-3.5 ${pulseColor} border-2 border-white shadow-md"></span>
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          const marker = L.marker(sensor.coordinates, { icon: sensorIcon });
          marker.bindTooltip(`
            <div class="p-1 font-sans text-xs">
              <div class="font-bold text-white flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full ${pulseColor}"></span>
                <span>${sensor.name}</span>
              </div>
              <div class="text-sm font-mono font-extrabold text-cyan-300 mt-1">
                ${sensor.currentValue} ${sensor.unit}
              </div>
              <div class="text-[10px] text-slate-400">Normal Range: ${sensor.normalRange[0]} - ${sensor.normalRange[1]} ${sensor.unit}</div>
              <div class="text-[10px] ${isAnomaly ? 'text-red-400 font-bold' : 'text-emerald-400'} mt-0.5">
                ${isAnomaly ? 'ANOMALY DETECTED' : 'NORMAL INGESTION'}
              </div>
            </div>
          `, { className: 'bg-slate-900 border border-slate-700 text-white rounded-lg shadow-xl' });

          marker.addTo(sensorGroup);
        });
      }
    }

    // Citizen Reports Layer with visual pulsing effect for new incidents
    if (layerGroupsRef.current.reports) {
      const reportGroup = layerGroupsRef.current.reports;
      reportGroup.clearLayers();
      reportMarkersRef.current = {};

      if (activeLayers.reports) {
        reports.forEach(report => {
          let badge = '⚠️';
          let bg = 'bg-amber-600';
          if (report.category === 'flood') {
            badge = '🌊';
            bg = 'bg-red-600';
          } else if (report.category === 'pothole') {
            badge = '🕳️';
            bg = 'bg-amber-600';
          } else if (report.category === 'waste') {
            badge = '🗑️';
            bg = 'bg-purple-600';
          } else if (report.category === 'streetlight') {
            badge = '💡';
            bg = 'bg-yellow-600';
          }

          // Check if this incident is newly reported
          const isNew = Boolean(
            (recentReportIds && recentReportIds.has(report.id)) ||
            report.reportedAt === 'Just now' ||
            report.status === 'reported' ||
            (flyToTrigger && flyToTrigger.report?.id === report.id)
          );

          let pulseRingColor = 'border-red-500/80 bg-red-500/30';
          let pulseRing2Color = 'border-amber-400/60 bg-amber-500/20';
          if (report.severity === 'critical') {
            pulseRingColor = 'border-rose-500/90 bg-rose-500/40';
            pulseRing2Color = 'border-red-400/80 bg-red-500/30';
          } else if (report.severity === 'high') {
            pulseRingColor = 'border-amber-500/90 bg-amber-500/40';
            pulseRing2Color = 'border-yellow-400/70 bg-yellow-500/25';
          } else {
            pulseRingColor = 'border-cyan-500/90 bg-cyan-500/35';
            pulseRing2Color = 'border-blue-400/70 bg-blue-500/20';
          }

          const reportIcon = L.divIcon({
            className: 'custom-incident-marker',
            html: `
              <div class="relative flex items-center justify-center w-10 h-10 pointer-events-auto">
                ${isNew ? `
                  <div class="incident-ring-1 ${pulseRingColor}"></div>
                  <div class="incident-ring-2 ${pulseRing2Color}"></div>
                  <span class="absolute -top-3.5 px-1.5 py-0.2 rounded-full bg-red-600 text-[8px] font-black text-white uppercase tracking-wider border border-white/90 shadow-lg animate-bounce select-none pointer-events-none">
                    NEW
                  </span>
                ` : ''}
                <div class="w-8 h-8 rounded-full ${bg} text-white flex items-center justify-center text-sm shadow-xl border-2 border-white cursor-pointer transform hover:scale-125 transition-all ${isNew ? 'incident-beacon-active ring-4 ring-red-500/50' : ''}">
                  ${badge}
                </div>
              </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            popupAnchor: [0, -20],
          });

          const marker = L.marker(report.coordinates, { icon: reportIcon });
          reportMarkersRef.current[report.id] = marker;

          marker.bindPopup(`
            <div class="p-2.5 font-sans text-xs text-slate-800 max-w-xs">
              ${isNew ? `
                <div class="mb-2 flex items-center gap-1.5 text-[10px] font-bold text-red-600 uppercase tracking-wide bg-red-50 border border-red-200 px-2 py-0.5 rounded-md shadow-sm">
                  <span class="w-2 h-2 rounded-full bg-red-500 animate-ping mr-0.5"></span>
                  <span>Newly Reported Incident</span>
                </div>
              ` : ''}
              <div class="font-bold text-sm text-slate-900 mb-1 leading-snug">${report.title}</div>
              <div class="text-[11px] text-slate-600 mb-2 leading-relaxed">${report.description}</div>
              ${report.imageUrl ? `
                <img src="${report.imageUrl}" alt="Citizen Evidence" class="w-full h-24 object-cover rounded-lg mb-2 border border-slate-300 shadow-sm" />
              ` : ''}
              ${report.detectedByAI ? `
                <div class="p-1.5 rounded bg-cyan-50 border border-cyan-200 text-[10px] text-cyan-900 mb-2 font-mono">
                  🤖 AI Vision: ${report.detectedByAI.detectedIssue} (${report.detectedByAI.confidence}% confidence)
                </div>
              ` : ''}
              <div class="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-200">
                <span class="capitalize font-semibold text-slate-700">Severity: ${report.severity}</span>
                <span class="font-medium text-slate-600">👍 ${report.upvotes} Citizens</span>
              </div>
            </div>
          `);

          marker.addTo(reportGroup);
        });
      }
    }
  }, [entities, sensors, reports, activeLayers, recentReportIds, flyToTrigger]);

  // Granular Administrative & District Labels Rendering on Zoom-In
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !layerGroupsRef.current.adminLabels) return;

    const group = layerGroupsRef.current.adminLabels;
    group.clearLayers();

    if (!activeLayers.adminLabels) return;

    const zoom = map.getZoom();

    // Only display when user zooms in to see contextual details (zoom >= 13)
    if (zoom < 13) return;

    ADMINISTRATIVE_DISTRICTS.forEach(item => {
      // Filter out if not yet at minZoom for this granularity
      if (zoom < item.minZoom) return;

      if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase()) && !item.subDivision.toLowerCase().includes(searchQuery.toLowerCase())) {
        return;
      }

      // If zoom >= 14: detailed administrative badge with jurisdiction & sub-division
      // If zoom 13 to 13.9: compact pill badge with Ward number & Name
      const isHighZoom = zoom >= 14;

      const adminIcon = L.divIcon({
        className: 'custom-admin-label-icon',
        html: isHighZoom ? `
          <div class="px-2.5 py-1.5 rounded-lg bg-slate-950/90 backdrop-blur-md border border-cyan-500/40 text-slate-100 shadow-2xl flex flex-col gap-0.5 transform -translate-x-1/2 -translate-y-1/2 cursor-default hover:border-cyan-300 transition-all pointer-events-auto">
            <div class="flex items-center gap-1.5">
              <span class="px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 font-mono font-bold text-[9px] border border-cyan-700/60">
                W-${item.wardNumber}
              </span>
              <span class="font-bold text-[11px] text-white whitespace-nowrap">${item.name}</span>
            </div>
            <div class="text-[9px] text-slate-300 flex items-center gap-1 font-mono">
              <span class="text-cyan-400">🏛️</span>
              <span class="truncate max-w-[180px]">${item.adminJurisdiction}</span>
            </div>
            <div class="text-[8px] text-slate-400 font-mono">
              ${item.subDivision}
            </div>
          </div>
        ` : `
          <div class="px-2 py-0.5 rounded-md bg-slate-950/85 backdrop-blur-sm border border-cyan-500/50 text-[10px] font-sans text-cyan-200 shadow-lg whitespace-nowrap flex items-center gap-1.5 transform -translate-x-1/2 -translate-y-1/2 hover:border-cyan-300 hover:scale-105 transition-all cursor-default pointer-events-auto">
            <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span class="font-mono font-bold text-white">W-${item.wardNumber}</span>
            <span class="text-slate-300 font-medium">${item.name}</span>
          </div>
        `,
        iconSize: [1, 1],
        iconAnchor: [0, 0],
      });

      const marker = L.marker(item.coordinates, { icon: adminIcon, interactive: true });
      marker.bindTooltip(`
        <div class="p-1 text-xs">
          <div class="font-bold text-white">Ward ${item.wardNumber}: ${item.name}</div>
          <div class="text-slate-300 text-[10px]">${item.subDivision}</div>
          <div class="text-cyan-300 text-[10px] font-mono mt-0.5">🏛️ ${item.adminJurisdiction}</div>
          ${item.engineerInCharge ? `<div class="text-slate-400 text-[9px] mt-0.5">In-Charge: ${item.engineerInCharge}</div>` : ''}
          ${item.officePhone ? `<div class="text-slate-400 text-[9px]">Helpline: ${item.officePhone}</div>` : ''}
        </div>
      `, { className: 'bg-slate-900 border border-slate-700 text-white rounded-lg shadow-xl' });

      marker.addTo(group);
    });
  }, [currentZoom, activeLayers.adminLabels, searchQuery]);

  // Center on Selected Zone
  useEffect(() => {
    if (selectedZone && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(selectedZone.center, 13.5, { duration: 1.2 });
    }
  }, [selectedZone]);

  // Fly-to Animation when a citizen incident report originates or is selected
  useEffect(() => {
    if (!flyToTrigger || !mapInstanceRef.current) return;

    const { zone, report } = flyToTrigger;

    // Ensure citizen reports layer is toggled on so incident is visible
    setActiveLayers(prev => prev.reports ? prev : { ...prev, reports: true });

    // Fly to the originating zone center with an elegant easing animation
    mapInstanceRef.current.flyTo(zone.center, 14, {
      duration: 1.8,
      easeLinearity: 0.25,
    });

    setFlyToNotice({
      zoneName: zone.name,
      reportTitle: report?.title,
    });

    // After fly-to animation settles at destination, automatically open incident popup
    const popupTimer = setTimeout(() => {
      if (report && reportMarkersRef.current[report.id]) {
        reportMarkersRef.current[report.id].openPopup();
      }
    }, 1900);

    const noticeTimer = setTimeout(() => {
      setFlyToNotice(null);
    }, 5000);

    return () => {
      clearTimeout(popupTimer);
      clearTimeout(noticeTimer);
    };
  }, [flyToTrigger]);

  // Interactive Visual Highlight & Zooming on Search Query
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !layerGroupsRef.current.searchHighlights) return;

    const highlightGroup = layerGroupsRef.current.searchHighlights;
    highlightGroup.clearLayers();
    searchMarkersRef.current = {};

    const cleanQuery = searchQuery.trim().toLowerCase();

    // If query is cleared or < 2 chars, reset highlight markers & camera
    if (cleanQuery.length < 2) {
      if (lastSearchQueryRef.current.length >= 2) {
        // User cleared a previous search - smoothly return to city overview
        map.flyTo(METROPOLIS_CENTER, 12.5, { duration: 1.2 });
      }
      lastSearchQueryRef.current = cleanQuery;
      setSearchMatches([]);
      setActiveSearchIndex(0);
      return;
    }

    lastSearchQueryRef.current = cleanQuery;
    const matches: SearchMatchItem[] = [];

    // 1. Match GeoZones
    zones.forEach(zone => {
      const matchName = zone.name.toLowerCase().includes(cleanQuery);
      const matchId = zone.id.toLowerCase().includes(cleanQuery);
      const matchType = zone.primaryRiskType.toLowerCase().includes(cleanQuery);
      const matchFactors = zone.contributingFactors.some(f => f.toLowerCase().includes(cleanQuery));

      if (matchName || matchId || matchType || matchFactors) {
        matches.push({
          id: `zone-${zone.id}`,
          name: zone.name,
          category: 'zone',
          categoryLabel: 'Urban Zone',
          categoryIcon: '🗺️',
          coordinates: zone.center,
          badge: `Risk ${zone.currentRiskScore}/100`,
          details: `Elev: ${zone.elevationMeters}m • ${zone.primaryRiskType.toUpperCase()} risk • Pop: ${zone.population.toLocaleString()}`,
          zoneId: zone.id,
          rawItem: zone,
        });
      }
    });

    // 2. Match Administrative Districts & Wards
    ADMINISTRATIVE_DISTRICTS.forEach(dist => {
      const matchName = dist.name.toLowerCase().includes(cleanQuery);
      const matchSub = dist.subDivision.toLowerCase().includes(cleanQuery);
      const matchJurisdiction = dist.adminJurisdiction.toLowerCase().includes(cleanQuery);
      const matchWardNum = `ward ${dist.wardNumber}`.includes(cleanQuery) || `w-${dist.wardNumber}`.includes(cleanQuery) || String(dist.wardNumber) === cleanQuery;

      if (matchName || matchSub || matchJurisdiction || matchWardNum) {
        matches.push({
          id: `ward-${dist.id}`,
          name: `Ward ${dist.wardNumber}: ${dist.name}`,
          category: 'ward',
          categoryLabel: 'Admin Ward',
          categoryIcon: '🏛️',
          coordinates: dist.coordinates,
          badge: `W-${dist.wardNumber}`,
          details: `${dist.subDivision} • ${dist.adminJurisdiction}`,
          zoneId: dist.zoneId,
          rawItem: dist,
        });
      }
    });

    // 3. Match Infrastructure & Facilities
    entities.forEach(ent => {
      const matchName = ent.name.toLowerCase().includes(cleanQuery);
      const matchType = ent.type.toLowerCase().includes(cleanQuery);
      const matchCapacity = ent.capacity?.toLowerCase().includes(cleanQuery);

      if (matchName || matchType || matchCapacity) {
        let icon = '🏥';
        if (ent.type === 'fire_station') icon = '🚒';
        else if (ent.type === 'drainage_pump') icon = '⚡';
        else if (ent.type === 'shelter') icon = '🏕️';
        else if (ent.type === 'water_body') icon = '🌊';
        else if (ent.type === 'bridge') icon = '🌉';

        matches.push({
          id: `ent-${ent.id}`,
          name: ent.name,
          category: 'facility',
          categoryLabel: ent.type.replace('_', ' ').toUpperCase(),
          categoryIcon: icon,
          coordinates: ent.coordinates,
          badge: ent.status.toUpperCase(),
          details: ent.capacity || `Status: ${ent.status.toUpperCase()}`,
          zoneId: ent.zoneId,
          rawItem: ent,
        });
      }
    });

    // 4. Match IoT Telemetry Sensors
    sensors.forEach(sens => {
      const matchName = sens.name.toLowerCase().includes(cleanQuery);
      const matchType = sens.sensorType.toLowerCase().includes(cleanQuery);
      const matchId = sens.id.toLowerCase().includes(cleanQuery);

      if (matchName || matchType || matchId) {
        matches.push({
          id: `sens-${sens.id}`,
          name: sens.name,
          category: 'sensor',
          categoryLabel: 'IoT Sensor',
          categoryIcon: '📡',
          coordinates: sens.coordinates,
          badge: `${sens.currentValue} ${sens.unit}`,
          details: `Type: ${sens.sensorType.replace('_', ' ').toUpperCase()} • Normal: ${sens.normalRange[0]}-${sens.normalRange[1]} ${sens.unit}`,
          zoneId: sens.zoneId,
          rawItem: sens,
        });
      }
    });

    // 5. Match Citizen Reports & Incidents
    reports.forEach(rep => {
      const matchTitle = rep.title.toLowerCase().includes(cleanQuery);
      const matchDesc = rep.description.toLowerCase().includes(cleanQuery);
      const matchCat = rep.category.toLowerCase().includes(cleanQuery);

      if (matchTitle || matchDesc || matchCat) {
        matches.push({
          id: `rep-${rep.id}`,
          name: rep.title,
          category: 'report',
          categoryLabel: 'Citizen Incident',
          categoryIcon: '⚠️',
          coordinates: rep.coordinates,
          badge: rep.severity.toUpperCase(),
          details: `${rep.description.slice(0, 80)}... • 👍 ${rep.upvotes} Citizens`,
          zoneId: rep.zoneId,
          rawItem: rep,
        });
      }
    });

    setSearchMatches(matches);
    setActiveSearchIndex(0);

    if (matches.length === 0) return;

    // Automatically enable corresponding layers so markers and context are visible
    setActiveLayers(prev => {
      let updated = false;
      const next = { ...prev };
      if (matches.some(m => m.category === 'facility') && !next.facilities) {
        next.facilities = true;
        updated = true;
      }
      if (matches.some(m => m.category === 'sensor') && !next.sensors) {
        next.sensors = true;
        updated = true;
      }
      if (matches.some(m => m.category === 'report') && !next.reports) {
        next.reports = true;
        updated = true;
      }
      if (matches.some(m => m.category === 'ward') && !next.adminLabels) {
        next.adminLabels = true;
        updated = true;
      }
      return updated ? next : prev;
    });

    // Create pulsing radar visual highlight markers for each matching location
    matches.forEach((match, idx) => {
      const highlightIcon = L.divIcon({
        className: 'custom-search-highlight-marker',
        html: `
          <div class="relative flex items-center justify-center w-12 h-12 pointer-events-auto">
            <div class="search-ring-1"></div>
            <div class="search-ring-2"></div>
            <!-- Floating Title Pill above marker -->
            <div class="absolute -top-7 whitespace-nowrap px-2.5 py-0.5 rounded-full bg-slate-950/95 border-2 border-cyan-400 text-[10px] font-extrabold text-cyan-200 shadow-2xl flex items-center gap-1.5 font-mono select-none pointer-events-none transform -translate-y-1">
              <span class="text-xs">${match.categoryIcon}</span>
              <span class="truncate max-w-[130px] sm:max-w-[180px]">${match.name}</span>
            </div>
            <!-- Center Pulsing Core with Glowing Halo -->
            <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-600 via-cyan-400 to-sky-300 text-slate-950 flex items-center justify-center text-sm font-black shadow-2xl border-2 border-white cursor-pointer transform hover:scale-125 transition-all search-beacon-active ring-4 ring-cyan-500/60">
              ${match.categoryIcon}
            </div>
          </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
        popupAnchor: [0, -28],
      });

      const marker = L.marker(match.coordinates, { icon: highlightIcon, zIndexOffset: 1200 + idx });
      searchMarkersRef.current[match.id] = marker;

      marker.bindPopup(`
        <div class="p-2.5 font-sans text-xs text-slate-800 max-w-xs">
          <div class="flex items-center justify-between gap-1 mb-1.5 pb-1 border-b border-cyan-200">
            <span class="px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-900 font-mono font-bold text-[9px] uppercase tracking-wide">
              ${match.categoryLabel}
            </span>
            <span class="text-[10px] font-mono font-bold text-slate-500">${match.badge}</span>
          </div>
          <div class="font-extrabold text-sm text-slate-950 leading-snug mb-1">${match.name}</div>
          <div class="text-[11px] text-slate-600 mb-2 leading-relaxed">${match.details}</div>
          <div class="flex items-center justify-between text-[10px] font-mono text-cyan-800 pt-1.5 border-t border-slate-200">
            <span>📍 Coords: ${match.coordinates[0].toFixed(3)}, ${match.coordinates[1].toFixed(3)}</span>
          </div>
        </div>
      `);

      marker.on('click', () => {
        setActiveSearchIndex(idx);
        if (match.category === 'zone' && match.rawItem) {
          onSelectZone(match.rawItem);
        }
      });

      marker.addTo(highlightGroup);
    });

    // Zoom and transition the map to matching location(s)
    if (matches.length === 1) {
      map.flyTo(matches[0].coordinates, 14.5, {
        duration: 1.4,
        easeLinearity: 0.25,
      });

      const timer = setTimeout(() => {
        if (searchMarkersRef.current[matches[0].id]) {
          searchMarkersRef.current[matches[0].id].openPopup();
        }
      }, 1500);

      return () => clearTimeout(timer);
    } else {
      const bounds = L.latLngBounds(matches.map(m => m.coordinates));
      map.flyToBounds(bounds, {
        padding: [80, 80],
        maxZoom: 14.5,
        duration: 1.4,
      });
    }
  }, [searchQuery, zones, entities, sensors, reports]);

  const flyToSearchMatch = (index: number) => {
    if (!mapInstanceRef.current || index < 0 || index >= searchMatches.length) return;
    const match = searchMatches[index];
    setActiveSearchIndex(index);

    mapInstanceRef.current.flyTo(match.coordinates, 15, {
      duration: 1.2,
      easeLinearity: 0.25,
    });

    if (match.category === 'zone' && match.rawItem) {
      onSelectZone(match.rawItem);
    }

    setTimeout(() => {
      if (searchMarkersRef.current[match.id]) {
        searchMarkersRef.current[match.id].openPopup();
      }
    }, 1250);
  };

  const fitAllSearchMatches = () => {
    if (!mapInstanceRef.current || searchMatches.length === 0) return;
    if (searchMatches.length === 1) {
      mapInstanceRef.current.flyTo(searchMatches[0].coordinates, 14.5, { duration: 1.2 });
    } else {
      const bounds = L.latLngBounds(searchMatches.map(m => m.coordinates));
      mapInstanceRef.current.flyToBounds(bounds, {
        padding: [80, 80],
        maxZoom: 14.5,
        duration: 1.2,
      });
    }
  };

  const toggleLayer = (layerKey: string) => {
    setActiveLayers(prev => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  return (
    <div className="relative w-full h-[540px] lg:h-[620px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Leaflet Map Target Element */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Left Floating Header: Layer Badges & Controls */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2 max-w-md">
        <button
          id="map-toggle-layers-btn"
          onClick={() => setShowLayerPanel(!showLayerPanel)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-white shadow-xl backdrop-blur transition-all"
        >
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>{t.layers || 'Map Layers'}</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300">
            {Object.values(activeLayers).filter(Boolean).length}
          </span>
        </button>

        {/* Style Selector */}
        <div className="flex items-center rounded-lg bg-slate-900/90 border border-slate-700/80 p-0.5 shadow-xl backdrop-blur text-xs">
          <button
            onClick={() => setMapStyle('dark')}
            className={`px-2 py-1 rounded font-medium transition-colors ${mapStyle === 'dark' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Tactical
          </button>
          <button
            onClick={() => setMapStyle('satellite')}
            className={`px-2 py-1 rounded font-medium transition-colors ${mapStyle === 'satellite' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Satellite
          </button>
          <button
            onClick={() => setMapStyle('street')}
            className={`px-2 py-1 rounded font-medium transition-colors ${mapStyle === 'street' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Streets
          </button>
        </div>

        {/* Radius Analysis Selector */}
        <div className="flex items-center gap-1 rounded-lg bg-slate-900/90 border border-slate-700/80 px-2 py-1 shadow-xl backdrop-blur text-xs">
          <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px] text-slate-400 hidden sm:inline">Radius:</span>
          {[500, 1000, 2000].map((r) => (
            <button
              key={r}
              onClick={() => {
                if (radiusMode === r) {
                  setRadiusMode(null);
                  setRadiusAnalysisData(null);
                  layerGroupsRef.current.radius?.clearLayers();
                } else {
                  setRadiusMode(r);
                }
              }}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                radiusMode === r ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              {r >= 1000 ? `${r / 1000}km` : `${r}m`}
            </button>
          ))}
        </div>

        {/* Zoom & Granular Admin Ward Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 px-2 py-1 shadow-xl backdrop-blur text-xs">
          <span className="text-[10px] text-slate-400 font-mono">Zoom: {currentZoom.toFixed(1)}x</span>
          {currentZoom >= 13 ? (
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold flex items-center gap-1">
              <Building2 className="w-2.5 h-2.5 text-cyan-400" />
              <span>{currentZoom >= 14 ? 'Granular Sub-Divisions' : 'Ward Labels Active'}</span>
            </span>
          ) : (
            <span className="text-[9px] font-mono text-slate-500">
              (Zoom in for Wards)
            </span>
          )}
        </div>
      </div>

      {/* Floating Center Notification Banner when flying to originating incident zone */}
      {flyToNotice && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/95 border border-red-500/80 shadow-2xl text-xs font-semibold text-white backdrop-blur animate-in fade-in slide-in-from-top-3 duration-300">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
          <span className="text-red-400 font-bold uppercase tracking-wider text-[10px]">Zone Centered:</span>
          <span className="text-slate-100 font-semibold">{flyToNotice.zoneName}</span>
          {flyToNotice.reportTitle && (
            <>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300 max-w-[180px] sm:max-w-xs truncate">{flyToNotice.reportTitle}</span>
            </>
          )}
          <button
            onClick={() => setFlyToNotice(null)}
            className="ml-1.5 text-slate-400 hover:text-white text-xs font-mono"
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* Floating Interactive Search HUD & Pulsing Location Controls */}
      {searchQuery.trim().length >= 2 && (
        <div className={`absolute ${flyToNotice ? 'top-12' : 'top-3'} left-1/2 -translate-x-1/2 z-20 w-[95%] max-w-xl flex flex-col sm:flex-row items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-slate-950/95 border border-cyan-500/80 shadow-2xl text-xs text-white backdrop-blur transition-all animate-in fade-in slide-in-from-top-3 duration-300`}>
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500 shadow-md shadow-cyan-400"></span>
            </span>
            <div className="flex items-center gap-1.5 truncate">
              <Search className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-slate-200 font-bold truncate">"{searchQuery}"</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-700/60 text-cyan-300 text-[10px] font-mono font-bold shrink-0">
              {searchMatches.length} {searchMatches.length === 1 ? 'match' : 'matches'}
            </span>
          </div>

          {searchMatches.length > 0 ? (
            <div className="flex items-center gap-1.5 shrink-0">
              {searchMatches.length > 1 && (
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-lg p-0.5 shadow-inner">
                  <button
                    id="search-prev-match-btn"
                    onClick={() => flyToSearchMatch((activeSearchIndex - 1 + searchMatches.length) % searchMatches.length)}
                    className="px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-300 hover:text-cyan-300 text-xs font-bold transition-colors"
                    title="Previous matching location"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-mono font-bold text-cyan-300 px-1">
                    {activeSearchIndex + 1}/{searchMatches.length}
                  </span>
                  <button
                    id="search-next-match-btn"
                    onClick={() => flyToSearchMatch((activeSearchIndex + 1) % searchMatches.length)}
                    className="px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-300 hover:text-cyan-300 text-xs font-bold transition-colors"
                    title="Next matching location"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    id="search-fit-all-btn"
                    onClick={fitAllSearchMatches}
                    className="px-1.5 py-0.5 rounded hover:bg-slate-800 text-[10px] text-slate-300 hover:text-cyan-300 font-mono border-l border-slate-700 transition-colors"
                    title="Zoom out to fit all matching markers"
                  >
                    Fit All
                  </button>
                </div>
              )}

              {onClearSearch && (
                <button
                  id="search-hud-clear-btn"
                  onClick={onClearSearch}
                  className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-red-950 hover:text-red-300 border border-slate-700/80 text-slate-400 text-xs font-mono transition-colors"
                  title="Clear search query"
                >
                  ✕ Clear
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">No spatial markers found</span>
              {onClearSearch && (
                <button
                  onClick={onClearSearch}
                  className="px-2 py-0.5 rounded bg-slate-900 text-xs text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quick Jump Pills for Search Matches */}
      {searchQuery.trim().length >= 2 && searchMatches.length > 1 && (
        <div className={`absolute ${flyToNotice ? 'top-24' : 'top-16'} left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 max-w-[95%] overflow-x-auto py-1 px-2 scrollbar-none pointer-events-auto animate-in fade-in duration-300`}>
          {searchMatches.slice(0, 6).map((match, idx) => (
            <button
              key={match.id}
              onClick={() => flyToSearchMatch(idx)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono whitespace-nowrap shadow-xl backdrop-blur transition-all ${
                activeSearchIndex === idx
                  ? 'bg-cyan-500 text-slate-950 font-bold border border-white ring-2 ring-cyan-400/60 scale-105'
                  : 'bg-slate-950/90 text-cyan-200 border border-cyan-800/80 hover:bg-slate-900 hover:border-cyan-400 hover:scale-102'
              }`}
            >
              <span>{match.categoryIcon}</span>
              <span className="truncate max-w-[110px] sm:max-w-[150px]">{match.name}</span>
            </button>
          ))}
          {searchMatches.length > 6 && (
            <span className="text-[9px] text-cyan-400/80 px-1 font-mono font-bold">
              +{searchMatches.length - 6} more
            </span>
          )}
        </div>
      )}

      {/* Layer Control Dropdown Panel */}
      {showLayerPanel && (
        <div className="absolute top-14 left-3 z-20 w-64 bg-slate-900/95 border border-slate-800 rounded-xl p-3 shadow-2xl backdrop-blur animate-in fade-in slide-in-from-top-2 text-xs">
          <div className="flex items-center justify-between font-semibold text-slate-200 pb-2 border-b border-slate-800 mb-2">
            <span>Toggle Digital Twin Layers</span>
            <button onClick={() => setShowLayerPanel(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
          </div>
          <div className="space-y-1.5">
            {[
              { id: 'zones', label: 'Risk Heatmap Polygons', icon: '🗺️', active: activeLayers.zones },
              { id: 'adminLabels', label: 'Admin Districts & Wards', icon: '🏛️', active: activeLayers.adminLabels },
              { id: 'flood', label: t.floodRisk || 'Flood Risk & Surcharge', icon: '🌊', active: activeLayers.flood },
              { id: 'traffic', label: t.trafficCongestion || 'Traffic Density Radar', icon: '🚦', active: activeLayers.traffic },
              { id: 'facilities', label: t.emergencyFacilities || 'Emergency Facilities', icon: '🏥', active: activeLayers.facilities },
              { id: 'sensors', label: t.sensors || 'IoT Telemetry Sensors', icon: '📡', active: activeLayers.sensors },
              { id: 'reports', label: t.citizenReports || 'Citizen Reports', icon: '📢', active: activeLayers.reports },
            ].map((layer) => (
              <button
                key={layer.id}
                onClick={() => toggleLayer(layer.id)}
                className={`w-full flex items-center justify-between p-1.5 rounded-lg text-left transition-colors ${
                  layer.active ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-800/50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>{layer.icon}</span>
                  <span>{layer.label}</span>
                </span>
                {layer.active ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-600" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Radius Mode Helper Notification Banner */}
      {radiusMode && !radiusAnalysisData && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-full bg-cyan-950/90 border border-cyan-500 text-cyan-200 text-xs font-semibold shadow-2xl flex items-center gap-2 backdrop-blur animate-pulse">
          <Crosshair className="w-4 h-4 text-cyan-400" />
          <span>Click anywhere on map to run a {radiusMode}m spatial impact analysis</span>
        </div>
      )}

      {/* Radius Analysis Results Card */}
      {radiusAnalysisData && (
        <div className="absolute bottom-4 left-4 z-20 w-80 sm:w-96 bg-slate-900/95 border border-cyan-500/40 rounded-xl p-3 shadow-2xl backdrop-blur text-xs animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
            <div className="flex items-center gap-1.5 font-bold text-cyan-300">
              <Crosshair className="w-4 h-4 text-cyan-400" />
              <span>Spatial Radius Analysis ({radiusAnalysisData.radiusMeters}m)</span>
            </div>
            <button onClick={() => setRadiusAnalysisData(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
              <div className="text-[10px] text-slate-400">Estimated Population</div>
              <div className="text-sm font-mono font-bold text-white mt-0.5">
                {radiusAnalysisData.estimatedPop.toLocaleString()} citizens
              </div>
            </div>
            <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
              <div className="text-[10px] text-slate-400">Nearest Emergency Care</div>
              <div className="text-xs font-semibold text-emerald-400 truncate mt-0.5">
                {radiusAnalysisData.nearestHospital}
              </div>
            </div>
          </div>
          <div className="text-[11px] text-slate-300 flex items-center justify-between border-t border-slate-800 pt-1.5">
            <span>Response ETA: <strong className="text-white">{radiusAnalysisData.hospitalDist}</strong></span>
            <span className="text-cyan-400 font-medium">{radiusAnalysisData.floodSeverity}</span>
          </div>
        </div>
      )}

      {/* Bottom Right Map Controls: Re-Center & Zoom */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1.5">
        <button
          onClick={() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.flyTo(METROPOLIS_CENTER, 12.5);
              onSelectZone(null);
            }
          }}
          className="p-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 shadow-xl backdrop-blur transition-colors"
          title="Reset View to Metropolis Center"
        >
          <Compass className="w-4 h-4 text-cyan-400" />
        </button>

        <button
          onClick={() => mapInstanceRef.current?.zoomIn()}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-white font-bold text-sm shadow-xl backdrop-blur"
          title="Zoom In"
        >
          +
        </button>

        <button
          onClick={() => mapInstanceRef.current?.zoomOut()}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-white font-bold text-sm shadow-xl backdrop-blur"
          title="Zoom Out"
        >
          −
        </button>
      </div>

      {/* Bottom Left Legend */}
      <div className="absolute bottom-4 left-4 z-10 hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 shadow-xl backdrop-blur text-[11px] text-slate-300">
        <span className="font-semibold text-slate-400">Risk Scale:</span>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Low (&lt;35)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
          <span>Moderate (35-54)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>High (55-74)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
          <span>Critical (75+)</span>
        </div>
      </div>
    </div>
  );
};

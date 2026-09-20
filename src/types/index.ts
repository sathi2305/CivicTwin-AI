export type UserRole = 'citizen' | 'admin' | 'emergency' | 'planner' | 'researcher';

export type IndianLanguage = 
  | 'en' // English
  | 'hi' // Hindi
  | 'ta' // Tamil
  | 'te' // Telugu
  | 'kn' // Kannada
  | 'bn' // Bengali
  | 'mr' // Marathi
  | 'gu' // Gujarati
  | 'ml' // Malayalam
  | 'pa' // Punjabi
  | 'or'; // Odia

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface GeoZone {
  id: string;
  name: string;
  localName?: string;
  code: string;
  population: number;
  areaSqKm: number;
  elevationMeters: number;
  drainageCapacityMmHr: number;
  currentRiskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  primaryRiskType: 'flood' | 'traffic' | 'pollution' | 'waste' | 'infrastructure';
  coordinates: [number, number][]; // Polygon coords [lat, lng]
  center: [number, number];
  contributingFactors: string[];
  historicalEventsCount: number;
  metrics: {
    floodRisk: number;
    trafficCongestion: number;
    airQualityIndex: number;
    wasteAccumulation: number;
    waterLoggingProbability: number;
    infrastructureStress: number;
  };
}

export type EntityType = 
  | 'hospital'
  | 'fire_station'
  | 'police_station'
  | 'shelter'
  | 'drainage_pump'
  | 'water_body'
  | 'waste_facility'
  | 'power_substation'
  | 'bridge'
  | 'sensor'
  | 'citizen_report';

export interface DigitalTwinEntity {
  id: string;
  name: string;
  type: EntityType;
  coordinates: [number, number];
  status: 'operational' | 'strained' | 'critical' | 'maintenance' | 'offline';
  riskLevel: RiskLevel;
  zoneId: string;
  capacity?: string;
  contact?: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface SensorData {
  id: string;
  name: string;
  sensorType: 'water_level' | 'traffic_flow' | 'aqi_pm25' | 'rainfall' | 'acoustic_noise' | 'drainage_flow';
  coordinates: [number, number];
  zoneId: string;
  currentValue: number;
  unit: string;
  normalRange: [number, number];
  status: 'normal' | 'warning' | 'anomaly';
  lastUpdated: string;
  history: { time: string; value: number }[];
}

export interface CitizenReport {
  id: string;
  category: 'flood' | 'pothole' | 'streetlight' | 'waste' | 'water_leakage' | 'traffic' | 'infrastructure' | 'pollution';
  title: string;
  description: string;
  severity: RiskLevel;
  status: 'reported' | 'verified' | 'in_progress' | 'resolved';
  coordinates: [number, number];
  zoneId: string;
  imageUrl?: string;
  detectedByAI?: {
    detectedIssue: string;
    confidence: number;
    actionRequired?: string;
    verified?: boolean;
  };
  reportedAt: string;
  upvotes: number;
}

export interface SimulationParams {
  rainfallDelta: number; // e.g. +30%
  drainageCapacityDelta: number; // e.g. -10%
  trafficSurgeDelta: number; // e.g. +20%
  wasteCollectionDelta: number; // e.g. -15%
  temperatureDelta: number; // e.g. +2 C
  selectedZoneId?: string; // all or specific zone
  interventions?: string[];
}

export interface SimulationResult {
  id: string;
  timestamp: string;
  params: SimulationParams;
  baselineRisk: number;
  simulatedRisk: number;
  riskDelta: number;
  overallStatus: RiskLevel;
  infrastructureStress: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  estimatedEconomicImpactLakhs: number;
  affectedZones: {
    zoneId: string;
    zoneName: string;
    baselineRisk: number;
    simulatedRisk: number;
    riskLevel: RiskLevel;
    stressFactor: string;
    estimatedWaterloggingCm: number;
    trafficDelayMin: number;
  }[];
  primaryFactors: string[];
  aiExplanation: string;
  recommendedActions: {
    action: string;
    priority: 'Immediate' | 'High' | 'Medium';
    costEstimate: string;
    expectedRiskReduction: number;
  }[];
  isSynthetic: boolean;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  interventionType: string;
  floodRisk: number;
  trafficRisk: number;
  projectedFloodRisk?: number;
  projectedTrafficCongestion?: number;
  cost: 'Low' | 'Medium' | 'High';
  costLakhs?: string;
  costAmountLakhs: number;
  responseTimeMin: number;
  responseLagMinutes?: number;
  populationProtected: number;
  feasibilityScore: number;
}

export interface AIInsight {
  id: string;
  timestamp: string;
  category: 'flood' | 'traffic' | 'infrastructure' | 'sensor' | 'weather';
  level: 'info' | 'warning' | 'alert' | 'critical';
  title: string;
  message: string;
  zoneId?: string;
  zoneName?: string;
  agentSource: string;
  actionPrompt?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system' | 'bot';
  agent?: string;
  agentName?: string;
  text: string;
  timestamp: string;
  language?: IndianLanguage;
  toolsUsed?: {
    toolName: string;
    args?: any;
    resultSummary: string;
  }[];
  toolInvocations?: {
    toolName: string;
    args?: any;
    resultSummary: string;
  }[];
  suggestedPrompts?: string[];
}

export interface SystemHealthMetric {
  service: string;
  status: 'healthy' | 'degraded' | 'offline';
  latencyMs: number;
  uptime: string;
  lastChecked: string;
}

export type SystemHealth = SystemHealthMetric;

export interface RagDocument {
  id: string;
  title: string;
  category: 'sop' | 'flood_manual' | 'traffic_protocol' | 'emergency_resources' | 'sustainability';
  source: string;
  updatedDate: string;
  summary: string;
  keyDirectives: string[];
}

export const MUNICIPAL_RAG_DOCUMENTS: RagDocument[] = [
  {
    id: 'rag-01',
    title: 'Metropolitan Monsoon Preparedness & Stormwater Drainage SOP (NDMA-Rev 4.2)',
    category: 'flood_manual',
    source: 'Urban Disaster Management Authority & Municipal Corporation',
    updatedDate: '2026-06-15',
    summary: 'Standard operating procedures for managing high-precipitation events (>50mm/hr) in low-lying lake basins, arterial culverts, and high-density residential sectors.',
    keyDirectives: [
      'Activate Level-2 flood alert when water gauge reaches 3.2m above datum.',
      'Deploy mobile high-discharge dewatering pumps (minimum 500 m³/hr capacity) to designated critical culverts within 20 minutes.',
      'Mandatory desilting of major tertiary stormwater drains (SWD) every 14 days during active monsoon.',
      'Keep flood shelters pre-stocked with 72-hour food rations, potable water purifiers, and 250kVA standby diesel generators.',
    ],
  },
  {
    id: 'rag-02',
    title: 'Urban Emergency Traffic Diversion & Green Corridor Protocol',
    category: 'traffic_protocol',
    source: 'City Traffic Police & Intelligent Transportation Systems (ITS) Cell',
    updatedDate: '2026-04-10',
    summary: 'Guidelines for dynamic signal overriding, lane reassignments, and emergency vehicle preemption during flash floods or major structural incidents.',
    keyDirectives: [
      'Immediately restrict non-emergency vehicular access to underpasses with water depth > 30cm.',
      'Establish a 12-meter dedicated emergency transit corridor between Apex Multi-Specialty Hospital and Southern District Shelters.',
      'Broadcast real-time detour advisories across all Variable Message Signs (VMS) within 180 seconds of incident verification.',
      'Deploy traffic wardens to manual intersection override when automated loop detector occupancy exceeds 90%.',
    ],
  },
  {
    id: 'rag-03',
    title: 'Citizen Incident Triage & Computer Vision Verification Standard',
    category: 'sop',
    source: 'Civic Intelligence & Public Works Directorate',
    updatedDate: '2026-05-20',
    summary: 'Automated AI classification and verification guidelines for citizen reported civic defects (potholes, open drains, garbage dumping, tree falls).',
    keyDirectives: [
      'Potholes exceeding 10cm depth or located on bus rapid transit (BRT) routes are classified as High Priority (SLA: 12 hours).',
      'AI Vision confidence > 85% automatically routes the work order to the designated ward engineering contractor without manual triage.',
      'Duplicate reports within a 35-meter radius are automatically grouped into a single spatial defect cluster with aggregated upvotes.',
      'Waterlogging reports confirmed by adjacent ultrasonic IoT depth sensors trigger immediate automated dispatch of pump crews.',
    ],
  },
  {
    id: 'rag-04',
    title: 'Environmental Air Quality Action Plan (NCAP Graded Response)',
    category: 'sustainability',
    source: 'State Pollution Control Board & Clean Air Mission',
    updatedDate: '2026-02-28',
    summary: 'Graded response action plan for particulate matter PM2.5 and PM10 exceedances in industrial and high-traffic sectors.',
    keyDirectives: [
      'Stage-1 (AQI 201-300 Poor): Intensify mechanical sweeping and deploy anti-smog mist water cannon trucks on arterial corridors twice daily.',
      'Stage-2 (AQI 301-400 Very Poor): Halt open diesel generator usage except for emergency hospitals and municipal pumping stations.',
      'Stage-3 (AQI >400 Severe): Enforce odd-even commercial freight transit in designated low-emission zones.',
    ],
  },
];

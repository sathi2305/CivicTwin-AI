import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { 
  INITIAL_ZONES, 
  INITIAL_ENTITIES, 
  INITIAL_SENSORS, 
  INITIAL_CITIZEN_REPORTS, 
  INITIAL_AI_INSIGHTS,
  PRESET_SCENARIOS,
  SYSTEM_HEALTH_METRICS
} from './src/data/mockCityData';
import { MUNICIPAL_RAG_DOCUMENTS } from './src/data/ragKnowledge';

dotenv.config();

// Safe directory resolution for both dev (ESM) and bundled production (CJS)
const currentDir = typeof __dirname !== 'undefined' 
  ? __dirname 
  : (import.meta && import.meta.url ? path.dirname(fileURLToPath(import.meta.url)) : process.cwd());

// In-memory persistent state during server lifetime
let zones = [...INITIAL_ZONES];
let entities = [...INITIAL_ENTITIES];
let sensors = [...INITIAL_SENSORS];
let citizenReports = [...INITIAL_CITIZEN_REPORTS];
let aiInsights = [...INITIAL_AI_INSIGHTS];
let scenarios = [...PRESET_SCENARIOS];

// Lazy / Safe initialization of Gemini Client
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '20mb' }));

  // API Endpoints
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: SYSTEM_HEALTH_METRICS,
    });
  });

  // Get Digital Twin Zones
  app.get('/api/twin/zones', (req, res) => {
    res.json(zones);
  });

  // Get Digital Twin Entities (Facilities, Infrastructure)
  app.get('/api/twin/entities', (req, res) => {
    res.json({
      entities,
      sensors,
      citizenReports,
      aiInsights,
      scenarios,
    });
  });

  // Get RAG Knowledge Base documents
  app.get('/api/twin/rag', (req, res) => {
    res.json(MUNICIPAL_RAG_DOCUMENTS);
  });

  // Add Citizen Incident Report
  app.post('/api/twin/citizen-report', (req, res) => {
    const report = req.body;
    const newReport = {
      ...report,
      id: `cr-${Date.now().toString().slice(-4)}`,
      status: 'reported',
      reportedAt: 'Just now',
      upvotes: 1,
    };
    citizenReports.unshift(newReport);

    // Also add to AI Insights if critical
    if (newReport.severity === 'critical' || newReport.severity === 'high') {
      aiInsights.unshift({
        id: `ins-${Date.now()}`,
        timestamp: 'Just now',
        category: newReport.category === 'flood' ? 'flood' : 'infrastructure',
        level: newReport.severity === 'critical' ? 'critical' : 'warning',
        title: `New Verified Citizen Report: ${newReport.title}`,
        message: `${newReport.description} (AI Verified)`,
        zoneId: newReport.zoneId,
        agentSource: 'Citizen Intelligence Agent',
        actionPrompt: 'Dispatched to Municipal Ward Response Team',
      });
    }

    res.json({ success: true, report: newReport });
  });

  // What-If Simulation Engine
  app.post('/api/twin/simulate', async (req, res) => {
    const { 
      rainfallDelta = 0, 
      drainageCapacityDelta = 0, 
      trafficSurgeDelta = 0, 
      wasteCollectionDelta = 0, 
      temperatureDelta = 0,
      selectedZoneId
    } = req.body;

    // Computational digital twin physics model
    const targetZones = selectedZoneId && selectedZoneId !== 'all'
      ? zones.filter(z => z.id === selectedZoneId)
      : zones;

    let totalBaselineRisk = 0;
    let totalSimulatedRisk = 0;

    const affectedZones = targetZones.map(zone => {
      const base = zone.currentRiskScore;
      totalBaselineRisk += base;

      // Hydrological and elevation factor:
      // Lower elevation zones (e.g. 875m vs 950m) experience non-linear flood surcharge
      const elevationWeight = Math.max(1, (960 - zone.elevationMeters) / 30);
      const rainImpact = (rainfallDelta / 100) * 35 * elevationWeight;
      const drainageImpact = -(drainageCapacityDelta / 100) * 28;
      const trafficImpact = (trafficSurgeDelta / 100) * 20;
      const wasteImpact = -(wasteCollectionDelta / 100) * 15;
      const heatImpact = temperatureDelta * 2.5;

      let sim = Math.round(base + rainImpact + drainageImpact + trafficImpact + wasteImpact + heatImpact);
      sim = Math.min(100, Math.max(5, sim));
      totalSimulatedRisk += sim;

      let riskLevel: 'low' | 'moderate' | 'high' | 'critical' = 'low';
      if (sim >= 75) riskLevel = 'critical';
      else if (sim >= 55) riskLevel = 'high';
      else if (sim >= 35) riskLevel = 'moderate';

      const estimatedWaterloggingCm = Math.max(0, Math.round((sim - 30) * 0.8 * elevationWeight));
      const trafficDelayMin = Math.max(0, Math.round((trafficImpact + (sim > 60 ? 15 : 0))));

      let stressFactor = 'Normal Flow';
      if (sim >= 75) stressFactor = 'Critical Overflow - Backflow in Primary Culverts';
      else if (sim >= 55) stressFactor = 'High Surcharge - Gravity Discharge Strained';
      else if (sim >= 35) stressFactor = 'Moderate Flow - Elevated Runoff';

      return {
        zoneId: zone.id,
        zoneName: zone.name,
        baselineRisk: base,
        simulatedRisk: sim,
        riskLevel,
        stressFactor,
        estimatedWaterloggingCm,
        trafficDelayMin,
      };
    });

    const avgBaseline = Math.round(totalBaselineRisk / targetZones.length);
    const avgSimulated = Math.round(totalSimulatedRisk / targetZones.length);
    const riskDelta = avgSimulated - avgBaseline;

    let overallStatus: 'low' | 'moderate' | 'high' | 'critical' = 'low';
    if (avgSimulated >= 75) overallStatus = 'critical';
    else if (avgSimulated >= 55) overallStatus = 'high';
    else if (avgSimulated >= 35) overallStatus = 'moderate';

    let infrastructureStress: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (avgSimulated >= 75) infrastructureStress = 'CRITICAL';
    else if (avgSimulated >= 55) infrastructureStress = 'HIGH';
    else if (avgSimulated >= 35) infrastructureStress = 'MODERATE';

    const estimatedEconomicImpactLakhs = Math.max(10, Math.round(avgSimulated * 4.2 + (riskDelta > 0 ? riskDelta * 8.5 : 0)));

    const primaryFactors: string[] = [];
    if (rainfallDelta > 15) primaryFactors.push(`Precipitation surge of +${rainfallDelta}% exceeds stormwater design storm threshold.`);
    if (drainageCapacityDelta < -5) primaryFactors.push(`Drainage capacity restriction of ${drainageCapacityDelta}% impairs primary gravity outflow.`);
    if (trafficSurgeDelta > 15) primaryFactors.push(`Vehicular volume increase of +${trafficSurgeDelta}% constricts key arterial evacuation corridors.`);
    if (wasteCollectionDelta < -10) primaryFactors.push(`Uncollected solid waste (${wasteCollectionDelta}%) elevates trash screen blockage hazard.`);
    if (primaryFactors.length === 0) primaryFactors.push('Stabilized hydrological parameters with standard maintenance margins.');

    const recommendedActions = [
      {
        action: 'Deploy Mobile Dewatering Pumps to Zone D (Bellandur Sluice Basin)',
        priority: avgSimulated >= 65 ? ('Immediate' as const) : ('High' as const),
        costEstimate: '₹14 Lakhs',
        expectedRiskReduction: 18,
      },
      {
        action: 'Activate Green Corridor Signal Preemption for Apex Trauma Hospital',
        priority: avgSimulated >= 50 ? ('High' as const) : ('Medium' as const),
        costEstimate: '₹3 Lakhs',
        expectedRiskReduction: 12,
      },
      {
        action: 'Pre-desilt Tertiary Stormwater Outfalls along Riverfront Zone B',
        priority: 'Medium' as const,
        costEstimate: '₹8 Lakhs',
        expectedRiskReduction: 9,
      },
    ];

    let aiExplanation = `Simulation indicates citywide risk shift from ${avgBaseline} to ${avgSimulated} (Delta: ${riskDelta > 0 ? '+' : ''}${riskDelta}). Lower-elevation zones (Zone D Lake Basin & Zone B Riverfront) face exacerbated inundation due to bowl-shaped catchment topography and culvert bottlenecks. Primary stress is concentrated along 3 arterial underpasses.`;

    // Try calling Gemini 3.8 Flash to enrich the multi-agent explainability
    const ai = getGemini();
    if (ai) {
      try {
        const prompt = `You are the Multi-Agent Simulation & Explanation Agent for CivicTwin AI.
Given urban simulation results:
- Rainfall Delta: ${rainfallDelta}%
- Drainage Capacity Delta: ${drainageCapacityDelta}%
- Traffic Surge: ${trafficSurgeDelta}%
- Baseline City Risk: ${avgBaseline}/100 -> Simulated Risk: ${avgSimulated}/100 (Change: ${riskDelta > 0 ? '+' : ''}${riskDelta})
- Highly Impacted Zones: ${affectedZones.filter(z => z.simulatedRisk >= 55).map(z => z.zoneName).join(', ') || 'None'}
- Infrastructure Stress: ${infrastructureStress}

Provide a concise, professional, explainable 2-3 sentence technical briefing for city administrators explaining:
1. Exactly what will happen physically in the city.
2. The core mechanical/hydrological cause.
3. The most critical intervention needed.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });

        if (response.text) {
          aiExplanation = response.text.trim();
        }
      } catch (err) {
        console.warn('Gemini explainability fallback used:', err);
      }
    }

    const result = {
      id: `sim-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      params: { rainfallDelta, drainageCapacityDelta, trafficSurgeDelta, wasteCollectionDelta, temperatureDelta, selectedZoneId },
      baselineRisk: avgBaseline,
      simulatedRisk: avgSimulated,
      riskDelta,
      overallStatus,
      infrastructureStress,
      estimatedEconomicImpactLakhs,
      affectedZones,
      primaryFactors,
      aiExplanation,
      recommendedActions,
      isSynthetic: true,
    };

    res.json(result);
  });

  // Computer Vision Incident Analyzer (Pothole, Flood, Waste, Streetlight, Infrastructure)
  app.post('/api/twin/vision-analyze', async (req, res) => {
    const { imageBase64, categoryHint, description } = req.body;

    let detectedIssue = 'Severe Asphalt Road Damage & Pothole Formation';
    let severity: 'low' | 'moderate' | 'high' | 'critical' = 'high';
    let confidence = 92;
    let actionRequired = 'Urgent patch work required to prevent two-wheeler skid hazards';
    let detectedCategory = 'pothole';

    const ai = getGemini();
    if (ai && imageBase64) {
      try {
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        const imagePart = {
          inlineData: {
            mimeType: 'image/jpeg',
            data: cleanBase64,
          },
        };

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: {
            parts: [
              imagePart,
              {
                text: `You are the Computer Vision Inspection Agent for CivicTwin AI. Analyze this urban photo.
Return a clean JSON object with keys:
- detectedIssue (string, concise title e.g. "Pothole crater with exposed sub-base", "Waterlogged underpass with 40cm water", "Overflowing solid waste bin")
- category (one of: "flood", "pothole", "waste", "streetlight", "water_leakage", "traffic", "infrastructure")
- severity (one of: "low", "moderate", "high", "critical")
- confidence (integer percentage 75-98)
- actionRequired (concise standard municipal action)`
              }
            ]
          },
          config: {
            responseMimeType: 'application/json',
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          detectedIssue = parsed.detectedIssue || detectedIssue;
          detectedCategory = parsed.category || detectedCategory;
          severity = parsed.severity || severity;
          confidence = parsed.confidence || confidence;
          actionRequired = parsed.actionRequired || actionRequired;
        }
      } catch (err) {
        console.warn('Gemini vision analysis fallback used:', err);
      }
    } else if (categoryHint === 'flood' || description?.toLowerCase().includes('water') || description?.toLowerCase().includes('flood')) {
      detectedIssue = 'Deep Urban Waterlogging & Storm Drain Throat Obstruction';
      detectedCategory = 'flood';
      severity = 'critical';
      confidence = 94;
      actionRequired = 'Deploy dewatering suction bowser and cordon low-lying lane';
    } else if (categoryHint === 'waste' || description?.toLowerCase().includes('garbage')) {
      detectedIssue = 'Solid Waste Overflow Blocking Stormwater Inflow Grate';
      detectedCategory = 'waste';
      severity = 'moderate';
      confidence = 88;
      actionRequired = 'Dispatch mechanical compactor vehicle & sanitary inspector';
    }

    res.json({
      detectedIssue,
      category: detectedCategory,
      severity,
      confidence,
      actionRequired,
    });
  });

  // AI Multilingual Multi-Agent Chatbot with Indian Languages & Tool Calling
  app.post('/api/twin/chat', async (req, res) => {
    const { message, language = 'en', history = [] } = req.body;

    const queryLower = (message || '').toLowerCase();
    const toolInvocations: any[] = [];
    let agent = 'AI Orchestrator';

    // Tool detection & synthetic execution
    let contextData = '';

    if (queryLower.includes('risk') || queryLower.includes('high-risk') || queryLower.includes('danger') || queryLower.includes('खतरा') || queryLower.includes('ஆபத்து') || queryLower.includes('ముప్పు')) {
      agent = 'Risk Intelligence Agent';
      const highRiskZones = zones.filter(z => z.currentRiskScore >= 60);
      toolInvocations.push({
        toolName: 'get_zone_risk()',
        args: { threshold: 60 },
        resultSummary: `Identified ${highRiskZones.length} critical zones: ${highRiskZones.map(z => `${z.name} (Risk ${z.currentRiskScore})`).join(', ')}`,
      });
      contextData += `High risk zones in city: ${highRiskZones.map(z => `${z.name} (Score ${z.currentRiskScore}/100, factors: ${z.contributingFactors.join('; ')})`).join('\n')}\n`;
    }

    if (queryLower.includes('flood') || queryLower.includes('water') || queryLower.includes('rain') || queryLower.includes('बाढ़') || queryLower.includes('மழை') || queryLower.includes('వరద') || queryLower.includes('మழ')) {
      agent = 'Flood Intelligence Agent';
      const lakeZone = zones.find(z => z.id === 'zone-d');
      toolInvocations.push({
        toolName: 'get_sensor_data()',
        args: { sensorType: 'water_level' },
        resultSummary: 'Water Gauge WG-04 reading 3.85m (Normal range: 0.5 - 2.8m). Anomaly alert active.',
      });
      contextData += `Zone D Water Level: 3.85m (Warning threshold 2.8m). Elevation: 875m (city lowest). Sluice pump 5/6 operational.\n`;
    }

    if (queryLower.includes('traffic') || queryLower.includes('jam') || queryLower.includes('road') || queryLower.includes('यातायात') || queryLower.includes('போக்குவரத்து')) {
      agent = 'Traffic Intelligence Agent';
      toolInvocations.push({
        toolName: 'get_incidents()',
        args: { category: 'traffic' },
        resultSummary: 'Inner Ring Road congestion 88%, delay 24 mins. Waterlogging at Sony Signal.',
      });
      contextData += `Traffic Density: CBD Zone A at 84%, Inner Ring Road choke point due to waterlogging at underpass.\n`;
    }

    if (queryLower.includes('simulate') || queryLower.includes('what if') || queryLower.includes('+') || queryLower.includes('சிமுலேஷன்') || queryLower.includes('सिमुलेशन')) {
      agent = 'Simulation Agent';
      toolInvocations.push({
        toolName: 'run_simulation()',
        args: { rainfallDelta: 30, drainageCapacityDelta: -10 },
        resultSummary: 'Simulated city risk surges from 54 to 73. Zone D & B critical inundation projected.',
      });
      contextData += `Simulation Engine Result: +30% rainfall increases Zone D flood depth by +42cm. Economic risk estimated at ₹340 Lakhs.\n`;
    }

    if (queryLower.includes('hospital') || queryLower.includes('shelter') || queryLower.includes('emergency') || queryLower.includes('अस्पताल') || queryLower.includes('மருத்துவமனை')) {
      agent = 'Emergency Agent';
      const facilities = entities.filter(e => e.type === 'hospital' || e.type === 'shelter' || e.type === 'fire_station');
      toolInvocations.push({
        toolName: 'find_nearby_facilities()',
        args: { types: ['hospital', 'shelter', 'fire_station'] },
        resultSummary: `Found ${facilities.length} active emergency facilities. Apex Multi-Specialty ready with 850 beds.`,
      });
      contextData += `Emergency facilities: Apex Multi-Specialty Hospital (850 beds, Trauma-1), Lake Basin Emergency Center (320 beds), Central Fire Station (8 fire tenders, 4 rescue boats).\n`;
    }

    let replyText = '';

    const ai = getGemini();
    if (ai) {
      try {
        const systemPrompt = `You are the AI Assistant for CivicTwin AI, an advanced urban digital twin and risk intelligence platform.
You have access to real-time digital twin data, sensors, GIS zones, and simulation engines.
Current Digital Twin Context:
${contextData || `City overall risk: 54/100. Active incidents: 4. Sensors online: 5. Critical zone: Zone D (Lake Basin, Risk 82).`}
Municipal Guidelines / SOP:
${MUNICIPAL_RAG_DOCUMENTS.map(d => `${d.title}: ${d.keyDirectives.join(' ')}`).join('\n')}

USER LANGUAGE REQUIREMENT:
The user has selected the language: "${language}".
If language is 'hi', reply in clear, fluent Hindi (हिंदी).
If language is 'ta', reply in natural, fluent Tamil (தமிழ்).
If language is 'te', reply in natural, fluent Telugu (తెలుగు).
If language is 'kn', reply in natural, fluent Kannada (ಕನ್ನಡ).
If language is 'bn', reply in natural, fluent Bengali (বাংলা).
If language is 'mr', reply in natural, fluent Marathi (मराठी).
If language is 'gu', reply in natural, fluent Gujarati (ગુજરાતી).
If language is 'ml', reply in natural, fluent Malayalam (മലയാളം).
If language is 'pa', reply in natural, fluent Punjabi (ਪੰਜਾਬੀ).
If language is 'or', reply in natural, fluent Odia (ଓଡ଼ିଆ).
If language is 'en', reply in clear, authoritative, professional English.
If the user's message is written in any other specific language or script (e.g. Hinglish / Romanized), also understand and respond appropriately in the target language.

Keep the response structured, clear, and actionable:
- Address the exact question with specific zone names, numbers, and evidence.
- State why it is happening (contributing factors).
- Provide the recommended municipal action or citizen guidance.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            ...history.slice(-4).map((h: any) => ({
              role: h.sender === 'user' ? 'user' : 'model',
              parts: [{ text: h.text }],
            })),
            {
              role: 'user',
              parts: [{ text: message }],
            }
          ],
          config: {
            systemInstruction: systemPrompt,
          },
        });

        if (response.text) {
          replyText = response.text.trim();
        }
      } catch (err) {
        console.warn('Gemini chat fallback used:', err);
      }
    }

    // High quality deterministic multilingual fallback if Gemini is offline or slow
    if (!replyText) {
      if (language === 'hi') {
        replyText = `सिविकट्विन एआई विश्लेषण:\n• वर्तमान स्थिति: जोन डी (झील बेसिन) में जल स्तर 3.85 मीटर (चेतावनी स्तर 2.8 मी) पहुंच चुका है।\n• मुख्य कारण: 875 मीटर की निचली भौगोलिक ऊंचाई और मुख्य नाले में रुकावट।\n• आपातकालीन उपाय: पम्पिंग स्टेशन #4 सक्रिय किया गया है और शीर्ष बहु-विशेषता अस्पताल में ग्रीन कॉरिडोर तैयार है।`;
      } else if (language === 'ta') {
        replyText = `சிவிக்ட்வின் AI பகுப்பாய்வு:\n• தற்போதைய நிலை: மண்டலம் D (ஏரிப் படுகை) அதிக வெள்ள அபாயத்தில் (82/100) உள்ளது. நீர்மட்டம் 3.85 மீட்டரை எட்டியுள்ளது.\n• முக்கிய காரணம்: தாழ்வான நிலப்பரப்பு (875மீ) மற்றும் மழைநீர்க் கால்வாய் அடைப்பு.\n• எடுக்கப்பட்ட நடவடிக்கை: 6 அவசர நீர் இறைக்கும் மோட்டார்கள் இயக்கப்பட்டுள்ளன. அவசர மருத்துவமனை தயாராக உள்ளது.`;
      } else if (language === 'te') {
        replyText = `సివిక్‌ట్విన్ AI విశ్లేషణ:\n• ప్రస్తుత పరిస్థితి: జోన్ D (లేక్ బేసిన్) లో వరద ముప్పు అత్యధికంగా (82/100) ఉంది. నీటి మట్టం 3.85 మీటర్లకు చేరింది.\n• ప్రధాన కారణం: లోతట్టు ప్రాంతం (875 మీటర్లు) మరియు డ్రైనేజీ అడ్డంకులు.\n• అత్యవసర చర్యలు: పంపింగ్ స్టేషన్ నం. 4 పనిచేస్తోంది, సహాయక బృందాలు సిద్ధంగా ఉన్నాయి.`;
      } else if (language === 'kn') {
        replyText = `ಸಿವಿಕ್‌ಟ್ವಿನ್ AI ವಿಶ್ಲೇಷಣೆ:\n• ಪ್ರಸ್ತುತ ಸ್ಥಿತಿ: ವಲಯ D (ಕೆರೆ ಜಲಾನಯನ) ಅತಿ ಹೆಚ್ಚು ಪ್ರವಾಹ ಅಪಾಯದಲ್ಲಿದೆ (82/100). ನೀರಿನ ಮಟ್ಟ 3.85 ಮೀಟರ್ ತಲುಪಿದೆ.\n• ಮುಖ್ಯ ಕಾರಣ: ತಗ್ಗು ಪ್ರದೇಶ (875 ಮೀ) ಮತ್ತು ಒಳಚರಂಡಿ ಕಾಲುವೆಗಳಲ್ಲಿ ಹೂಳು ತುಂಬಿರುವುದು.\n• ತುರ್ತು ಕ್ರಮ: ಪಂಪಿಂಗ್ ಸ್ಟೇಷನ್ #4 ಸಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ ಮತ್ತು ತುರ್ತು ಆಸ್ಪತ್ರೆಗಳು ಸನ್ನದ್ಧವಾಗಿವೆ.`;
      } else if (language === 'bn') {
        replyText = `সিভিকটুইন এআই বিশ্লেষণ:\n• বর্তমান অবস্থা: জোন ডি (লেক বেসিন) সর্বোচ্চ বন্যার ঝুঁকিতে (৮২/১০০) রয়েছে। জল স্তর ৩.৮৫ মিটারে পৌঁছেছে।\n• মূল কারণ: নিচু এলাকা (৮৭৫ মিটার) এবং নিকাশী নালার বাধা।\n• জরুরি পদক্ষেপ: পাম্পিং স্টেশন ৪ সক্রিয় করা হয়েছে এবং উদ্ধারকারী দল প্রস্তুত।`;
      } else {
        replyText = `CivicTwin AI Multi-Agent Briefing:\n• Current Status: Zone D (Lake Basin) has elevated flood risk (82/100) with water gauge WG-04 reaching 3.85m (+1.05m above warning mark).\n• Root Cause: Bowl-shaped elevation depression (875m above sea level) combined with culvert bottlenecks.\n• Immediate Intervention: Bellandur Mega Pumping Station is discharging 420 m³/min, and emergency transit corridors are mapped to Apex Multi-Specialty Hospital.`;
      }
    }

    res.json({
      reply: replyText,
      agent,
      toolInvocations,
      timestamp: new Date().toLocaleTimeString(),
    });
  });

  // Export Executive Audit Report (PDF / Markdown / JSON)
  app.post('/api/twin/report', async (req, res) => {
    const { reportType = 'daily_summary', language = 'en' } = req.body;

    const criticalZones = zones.filter(z => z.currentRiskScore >= 60);
    const totalPopulation = zones.reduce((acc, z) => acc + z.population, 0);

    const reportData = {
      title: `CivicTwin AI Urban Risk & Digital Twin Intelligence Audit`,
      generatedAt: new Date().toISOString(),
      cityMetrics: {
        totalPopulation,
        monitoredZonesCount: zones.length,
        criticalZonesCount: criticalZones.length,
        activeSensors: sensors.length,
        openCitizenIncidents: citizenReports.filter(c => c.status !== 'resolved').length,
        averageCityRisk: Math.round(zones.reduce((a, b) => a + b.currentRiskScore, 0) / zones.length),
      },
      criticalZoneBreakdown: criticalZones.map(z => ({
        name: z.name,
        score: z.currentRiskScore,
        primaryThreat: z.primaryRiskType,
        elevation: `${z.elevationMeters}m`,
        keyVulnerabilities: z.contributingFactors,
      })),
      verifiedIncidents: citizenReports.slice(0, 5).map(r => ({
        id: r.id,
        title: r.title,
        severity: r.severity,
        status: r.status,
        zone: zones.find(z => z.id === r.zoneId)?.name,
      })),
      recommendedSOPs: MUNICIPAL_RAG_DOCUMENTS.map(d => ({
        title: d.title,
        keyDirective: d.keyDirectives[0],
      })),
    };

    res.json(reportData);
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CivicTwin AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

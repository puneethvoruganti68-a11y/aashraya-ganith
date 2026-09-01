export type ShelterTarget = 'human' | 'livestock';

export type AppView = 'landing' | 'climate' | 'simulator' | 'grid' | 'streams' | 'history';

export interface ClimateRegion {
  id: string;
  name: string;
  locationLabel: string;
  coordinates: string;
  climateType: string;
  stressTag: string;
  stressLevel: 'extreme' | 'high' | 'moderate' | 'low';
  coreTemp: number; // °C
  tempDeltaVsAvg: string;
  humidity: number; // %
  windSpeed: number; // km/h
  windDirection: string;
  windAngle: number; // degrees
  solarRadiationLevel: 'EXTREME' | 'HIGH' | 'MODERATE';
  solarRadiationValue: number; // W/m²
  peakStressZone: { start: string; end: string };
  hourlyTemps: Array<{ hour: string; temp: number; isPeak?: boolean }>;
  aiInsights: {
    climateDetection: string;
    nightCoolingPotential: 'HIGH' | 'MODERATE' | 'LOW';
    solarHeatGain: 'EXTREME' | 'HIGH' | 'MODERATE';
    recommendedOrientation: string;
    criticalRisk: string;
  };
}

export interface RecommendationOption {
  id: string;
  title: string;
  type: 'recommended' | 'alternative' | 'experimental';
  category: 'roof' | 'wall' | 'ventilation' | 'shading' | 'passive';
  costImpact: number; // in INR
  costImpactFormatted: string;
  benefit: string;
  tempImpact: number; // °C reduction
  scoreImpact: number;
  description: string;
  isActive: boolean;
  appliedByDefault?: boolean;
}

export interface ShelterConfiguration {
  target: ShelterTarget;
  regionId: string;
  livestockType?: 'dairy_cattle' | 'indigenous_cows' | 'sheep_goat' | 'poultry' | 'camels';
  humanShelterType?: 'rural_homestead' | 'disaster_relief' | 'community_hall' | 'health_clinic';
  baseCost: number;
  wallThickness: number; // cm
  roofPitchAngle: number; // degrees
  ventilationRatio: number; // %
  eaveOverhang: number; // meters
  glazingRatio: number; // %
  activeRecommendations: string[];
}

export interface SimulationResult {
  overallScore: number;
  heatProtectionGrade: 'A+' | 'A' | 'B' | 'C' | 'D';
  ventilationGrade: 'A+' | 'A' | 'B' | 'C' | 'D';
  insulationGrade: 'A+' | 'A' | 'B' | 'C' | 'D';
  internalPeakTemp: number;
  tempReduction: number;
  thermalDamping: number; // %
  estimatedCost: number;
  comfortHoursPerDay: number;
  embodiedCarbonKg: number;
  aiExplanation?: string;
}

export interface SimulationLogEntry {
  id: string;
  timestamp: string;
  type: 'AI_INFERENCE' | 'THERMAL_SOLVER' | 'CLIMATE_SYNC' | 'GEO_MESH';
  message: string;
  latencyMs: number;
  status: 'SUCCESS' | 'OPTIMAL' | 'WARN';
}

export interface ThermalInput {
  outdoorTemp: number;
  solarRadiation: number;
  humidity: number;
  windSpeed: number;
  wallThickness: number;
  insulationFactor: number;
  eaveOverhang: number;
  ventilationRatio: number;
  glazingRatio: number;
  orientationFactor: number;
  area?: number;
  analysisHours?: number;
  peakSunHours?: number;
  solarEfficiency?: number;
}

export function calculateThermal(input: ThermalInput) {
  const area = Math.max(8, input.area ?? 40);
  const hours = Math.max(1, input.analysisHours ?? 24);
  const sunHours = Math.max(1, input.peakSunHours ?? 6);
  const efficiency = Math.max(1, Math.min(100, input.solarEfficiency ?? 72));
  const insulation = Math.max(0, Math.min(1, input.insulationFactor));
  const solarProtection = Math.min(0.60, input.eaveOverhang * 0.08 + (1 - input.glazingRatio / 100) * 0.08 + insulation * 0.20);
  const ventilation = Math.min(0.48, input.ventilationRatio / 100 * (0.55 + input.windSpeed / 30));
  const wallMass = Math.min(0.20, input.wallThickness / 100 * 0.42);
  const orientationPenalty = Math.max(0, Math.min(0.15, input.orientationFactor));

  const heatGainFactor = Math.max(
    0.20,
    1 - insulation * 0.30 - solarProtection - ventilation * 0.55 - wallMass * 0.45 + orientationPenalty
  );
  const internalPeakTemp = input.outdoorTemp - Math.max(1.5, (1 - heatGainFactor) * 17);
  const tempReduction = input.outdoorTemp - internalPeakTemp;

  const roofArea = area * 1.12;
  const wallArea = 2 * Math.sqrt(area) * 3;
  const openingArea = Math.max(3, area * 0.12);
  const deltaT = Math.max(0, input.outdoorTemp - internalPeakTemp);

  const uRoof = 0.78 + (1 - insulation) * 0.35;
  const uWall = 0.95 + (1 - insulation) * 0.55;
  const uOpening = 0.65;
  const heatFlow = {
    roofKW: Number((uRoof * roofArea * deltaT / 1000).toFixed(2)),
    wallsKW: Number((uWall * wallArea * deltaT / 1000).toFixed(2)),
    openingsKW: Number((uOpening * openingArea * deltaT / 1000).toFixed(2)),
  };
  const totalHeatFlowKW = Number((heatFlow.roofKW + heatFlow.wallsKW + heatFlow.openingsKW).toFixed(2));
  const periodHeatKWh = Number((totalHeatFlowKW * hours).toFixed(1));

  const solarIncidentKWh = Number((input.solarRadiation * roofArea * sunHours / 1000).toFixed(1));
  const absorbedSolarKWh = Number(
    (solarIncidentKWh * (1 - Math.min(0.58, solarProtection)) * (0.70 + (100 - efficiency) / 500)).toFixed(1)
  );

  const heatProtection = Math.round(Math.min(99, 55 + tempReduction * 4));
  const ventilationScore = Math.round(Math.min(99, 55 + ventilation * 150));
  const solarScore = Math.round(Math.min(99, 58 + solarProtection * 70));
  const insulationScore = Math.round(Math.min(99, 58 + insulation * 38 + wallMass * 80));
  const overallScore = Math.round(heatProtection * 0.35 + ventilationScore * 0.20 + solarScore * 0.25 + insulationScore * 0.20);

  return {
    internalPeakTemp: Number(internalPeakTemp.toFixed(1)),
    tempReduction: Number(tempReduction.toFixed(1)),
    deltaT: Number(deltaT.toFixed(1)),
    heatProtection,
    ventilation: ventilationScore,
    solarControl: solarScore,
    insulation: insulationScore,
    overallScore: Math.max(0, Math.min(99, overallScore)),
    heatGainFactor: Number(heatGainFactor.toFixed(3)),
    solarEnergy: {
      roofArea: Number(roofArea.toFixed(1)),
      peakSunHours: sunHours,
      incidentKWhPerDay: solarIncidentKWh,
      estimatedAbsorbedThermalKWhPerDay: absorbedSolarKWh,
      efficiencyPercent: efficiency,
    },
    heatFlow: {
      periodHours: hours,
      roofKW: heatFlow.roofKW,
      wallsKW: heatFlow.wallsKW,
      openingsKW: heatFlow.openingsKW,
      totalKW: totalHeatFlowKW,
      periodKWh: periodHeatKWh,
    },
  };
}

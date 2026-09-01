export interface CostInput {
  area: number;
  target: 'human' | 'livestock';
  wallThickness: number;
  roofMaterial: 'standard' | 'insulated';
  shading: boolean;
  ventilation: boolean;
  regionalFactor?: number;
}

export function estimateCost(input: CostInput) {
  const baseRate = input.target === 'human' ? 3300 : 2700;
  const regional = input.regionalFactor ?? 1;
  const structure = input.area * baseRate * regional;
  const wall = Math.max(0, input.wallThickness - 15) * input.area * 18;
  const roof = input.roofMaterial === 'insulated' ? input.area * 380 : input.area * 220;
  const shade = input.shading ? input.area * 95 : 0;
  const ventilation = input.ventilation ? input.area * 85 : 0;
  const labour = (structure + roof + shade + ventilation) * 0.18;
  const total = Math.round(structure + wall + roof + shade + ventilation + labour);
  return {
    materials: Math.round(total - labour),
    labour: Math.round(labour),
    total,
    low: Math.round(total * 0.9),
    high: Math.round(total * 1.12),
  };
}

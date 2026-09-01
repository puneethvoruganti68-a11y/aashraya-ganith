export interface DesignInput {
  target: 'human' | 'livestock';
  climateType: string;
  area: number;
  budget: number;
  occupants?: number;
  animalCount?: number;
}

export function recommendDesign(input: DesignInput) {
  const hot = /hot|arid|dry|semi/i.test(input.climateType);
  const humid = /humid|coastal|monsoon/i.test(input.climateType);
  const cold = /cold|high-altitude|mountain/i.test(input.climateType);

  const recommendedArea = input.target === 'livestock'
    ? Math.max(input.area, (input.animalCount ?? 6) * 7)
    : Math.max(input.area, (input.occupants ?? 4) * 7);

  const materials = {
    roof: hot ? 'Reflective metal roof + insulation + ventilated air gap' : cold ? 'Insulated roof with controlled solar gain' : 'Reflective insulated roof',
    walls: hot ? 'High thermal-mass masonry / compressed earth block' : 'Thermal-mass masonry with insulation where required',
    floor: 'Thermally stable raised / finished floor',
    shading: hot || humid ? 'Deep external eaves + adjustable shade' : 'Moderate solar shading',
    ventilation: humid ? 'High cross ventilation + ridge outlet' : 'Low inlet + high-level ridge outlet',
  };

  return {
    orientation: hot ? 'East-West axis to reduce harsh solar exposure' : humid ? 'North-South axis with cross-flow' : 'Climate-optimized axis',
    roofMaterial: materials.roof,
    ventilation: materials.ventilation,
    shading: materials.shading,
    insulationLevel: hot ? 'High' : 'Medium-High',
    recommendedArea,
    shape: 'Compact form with pitched ventilated roof',
    materials,
    reasons: [
      hot ? 'High solar exposure favors reflective roofing, insulation and extended shading.' : 'Balanced solar control and insulation match the selected climate.',
      humid ? 'High humidity makes continuous cross ventilation and moisture control a priority.' : 'Controlled ventilation removes stored heat while limiting unwanted heat exchange.',
      input.target === 'livestock' ? 'Livestock layout prioritizes shaded resting space, airflow and protected occupied zones.' : 'Human shelter layout prioritizes thermal comfort, daylight and circulation.',
    ],
  };
}

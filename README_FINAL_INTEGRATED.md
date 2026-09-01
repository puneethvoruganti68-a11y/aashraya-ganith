# AASHRAYA GANITH - Final Integrated Thermal Shelter MVP

This package keeps the original AASHRAYA GANITH MVP workflow and integrates the interactive parametric CAD-style shelter viewer into the Design + Results stage.

## Run

```bash
npm install
npm run dev
```

Open the local URL shown by the terminal, normally `http://localhost:3000`.

## Main workflow

1. **Project**: target, occupants/livestock, purpose, area, budget, location and passive-design inputs.
2. **Material Library**: wall, roof, insulation and floor/thermal-mass selections. The built-in properties feed the prototype calculations. Material selection is required before continuing.
3. **Climate**: preset or manually entered outdoor temperature, humidity, wind, solar radiation, analysis period and peak-sun hours.
4. **Design + Results**: interactive parametric CAD-style model, AI comparison, PS outputs and thermal/solar/heat-flow/airflow analysis.

## Integrated CAD viewer

- Geometry follows the project area, wall thickness, roof pitch, shade and ventilation settings.
- Perspective/orthographic views.
- Mouse/touch orbit rotation, zoom, reset, fit and optional auto-rotation.
- Clickable wall, roof, floor, insulation, windows, shades, ridge vent, ventilation opening, door and foundation.
- Component inspector exposes material, dimensions and thermal/solar/airflow relevance.
- Structure, thermal, solar, heat-map, heat-flow and airflow overlays.
- 24-hour interactive thermal response. Selecting an hour updates the model/output state.
- Your Design / AI Best Design / Compare modes.

## Required PS outputs

- Shelter inside temperature prediction.
- Solar thermal energy estimate from incident radiation and passive protection.
- Heat-flow details driven by ambient-to-indoor temperature difference, including roof, walls and openings and the selected analysis period.
- Recommended shelter/material/passive strategy comparison.

## Important implementation note

The viewer is a browser-based engineering visualization, not a construction-grade AutoCAD/BIM authoring system. It is intended for MVP demonstration, parameter inspection and thermal-design communication.

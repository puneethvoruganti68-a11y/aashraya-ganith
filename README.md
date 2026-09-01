# AASHRAYA GANITH v0.7 — Visual Judge MVP

This version is a deliberate visual rebuild of the prototype.

## What is fixed
- First page uses one clear **Project Details** widget.
- Optional **Manual Climate Data** widget is available without cluttering the first page.
- **Use Current Location** uses browser geolocation and attempts a client-side reverse geocode so the UI shows `City, State`.
- Climate presets remain available.
- The design studio has two visibly different shelter concepts.
- Both concepts have pointer-drag rotation and an orbit button.
- The AI concept visibly adds double-skin roof, ridge ventilation, shade fins, thermal base and solar canopy.
- Thermal analysis is a visual heat-flow story, not a heat-grid.
- Airflow mode animates particles through the shelter.
- Results, cost and thermal comparison stay inside the website.
- Mobile layouts collapse cleanly.

## Run

```bash
npm install
npm run dev
```

Open:

`http://localhost:3000`

## Important
The system is a preliminary decision-support prototype. Thermal and cost values are estimates and require professional validation before construction.

The backend foundation from the previous version is retained under `backend/`.


## v0.9 MVP update

This version is aligned directly with the expected solution in the PS.

### Judge-first outputs
1. **Shelter inside temperature prediction**: ambient peak, user-design indoor peak, AI-design indoor peak and a 24-hour temperature curve.
2. **Solar thermal energy**: roof area, incident solar energy (kWh/day) and estimated absorbed thermal heat after passive solar protection.
3. **Heat-flow details**: temperature difference (ΔT), roof/wall/opening heat-flow components in kW, total heat transfer and energy over the selected analysis period.

### Additional design outputs
- User shelter vs AI-optimized shelter comparison
- Rotatable animated 3D-style shelter models
- Heat-response schematic
- Surface heat map
- Airflow animation
- Material recommendations
- Passive design features
- Cost estimate and budget remaining
- Climate presets and optional manual climate-data entry
- Current-location city/state display

### Run
```bash
npm install
npm run dev
```
Then open `http://localhost:3000`.

The prototype is decision support, not a construction certification. Thermal coefficients, material properties and local engineering constraints should be validated before real-world construction.


## v0.9 visual redesign
The judge-facing design comparison no longer relies on decorative pseudo-3D shelter drawings. It uses an animated Performance Intelligence Card for each design, showing thermal index, indoor temperature, solar input, heat flow, design recipe, and four performance bars. The existing PS output dashboard, thermal analysis, heat map, airflow view, manual climate inputs, location flow, materials and cost outputs remain intact.


## v1.0 final judge-facing changes

- Removed the large decorative shelter/house comparison visuals from the primary design comparison.
- Added a large animated Thermal Performance Intelligence comparison.
- Added PS-first visual outputs for: indoor shelter temperature, solar thermal energy, and heat-flow details.
- Added a large engineering energy-balance visualization, temperature field, heat-load map, and airflow vector field.
- Added a built-in Material Library with selectable wall, roof, insulation, and floor profiles.
- Material choices now feed into the prototype thermal calculation through material-property factors.
- Added material access from both Project Inputs and the final Design + Results screen.
- Enlarged judge-facing result cards and final recommendation panels.
- Preserved current-location detection, manual climate override, human/livestock modes, cost estimation, AI comparison, heat map, airflow, and responsive behavior.

This remains preliminary decision-support software. Engineering and material validation is required before construction.

## v1.1 final polish

- Replaced the previous bar-style thermal response field with a physically interpretable 24-hour line chart showing ambient temperature, user-design indoor temperature, and AI-design indoor temperature with time and temperature axes.
- Added a clear ambient-peak reference and AI temperature callout.
- Material Library is now a required project-input checkpoint: the user must save a wall, roof, insulation and floor profile before entering Climate or Design + Results.
- The material library remains built-in and uses selectable thermal-property profiles rather than requiring free-text material names.
- Fixed the material-library controls so browser-native white button rendering cannot overwrite the dark UI.
- Project page now shows an explicit Materials Required / Materials Ready status.
- Navigation to later steps is guarded until the material profile is saved.

## Final locked presentation pass

This build preserves the existing MVP workflow and functionality while applying the final presentation requirements:
- project/climate/design step navigation is hidden from the visible top bar; Next/Continue still advances the workflow
- problem-statement hero badge removed
- duplicate footer PS-output/status text removed
- footer attribution is `CREATED BY BLUE STARS`
- `LIVE MODEL` labels removed
- required outputs remain in the main three-card dashboard only
- 24-hour temperature charts are clickable and expose the selected-hour values
- thermal/solar/heat-flow/airflow analysis remains tied to the same input model
- climate region is automatically inferred from entered temperature/humidity values
- CAD viewer opens with both user and AI designs visible together, with rotatable comparison canvases
- CAD utility controls are limited to useful engineering controls; wireframe/x-ray/section/ortho controls are removed
- CAD inspector Structure/Thermal/Material/Solar tabs are functional
- thermal visualization uses a restrained surface-temperature gradient rather than decorative/random heat coloring
- solar and heat-flow views expose their calculation basis
- material controls explicitly suppress browser-native light/white button rendering
- AI cost estimate uses quantity/material/passive-strategy relationships and targets a modest efficiency advantage rather than an arbitrary fixed discount

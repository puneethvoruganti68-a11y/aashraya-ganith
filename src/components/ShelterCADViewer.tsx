import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, OrthographicCamera, Line, Text } from '@react-three/drei'
import * as THREE from 'three'
import {
  Box, Crosshair, Grid3X3, Minus, Plus,
  Rotate3D, Sun, Thermometer, Wind, Flame, MousePointer2, Maximize2,
  CircleHelp, Zap, Layout, Copy
} from 'lucide-react'

export type ShelterDesign = {
  length: number; width: number; wallHeight: number; wallThickness: number; roofPitch: number; overhang: number
  windows: number; windowWidth: number; windowHeight: number; shadeDepth: number; ventilation: number; orientation: number
  wallMaterial: string; roofMaterial: string; insulationMaterial: string; floorMaterial: string
}
export type ShelterSimulation = {
  outdoorTemp: number; indoorTemp: number; solarRadiation: number; solarEnergy: number
  roofHeatFlow: number; wallHeatFlow: number; openingHeatFlow: number; windSpeed: number; humidity: number
  analysisHours: number; peakSunHours: number; thermalScore: number
}
export type ShelterCADViewerProps = {
  design?: Partial<ShelterDesign>; aiDesign?: Partial<ShelterDesign>; simulation?: Partial<ShelterSimulation>
  climate?: Partial<ShelterSimulation>; selectedHour?: number; onHourChange?: (hour: number) => void
}

const defaults: ShelterDesign = {
  length: 6, width: 4, wallHeight: 3, wallThickness: .25, roofPitch: 28, overhang: .8,
  windows: 4, windowWidth: 1.1, windowHeight: 1.2, shadeDepth: 1.2, ventilation: 38, orientation: 0,
  wallMaterial: 'Compressed earth block', roofMaterial: 'Reflective metal sheet',
  insulationMaterial: 'Mineral wool', floorMaterial: 'Concrete slab'
}
const simDefaults: ShelterSimulation = {
  outdoorTemp: 36, indoorTemp: 31.8, solarRadiation: 950, solarEnergy: 142.6,
  roofHeatFlow: .12, wallHeatFlow: .09, openingHeatFlow: .07, windSpeed: 15, humidity: 48,
  analysisHours: 24, peakSunHours: 7.2, thermalScore: 86
}
const wallColors: Record<string, string> = {
  'Compressed earth block': '#a98263', 'Fired brick': '#9a5b49', 'Concrete block': '#858c89',
  'Stone masonry': '#77766f', 'Timber frame + infill': '#8b704f', 'Adobe / soil block': '#b4825d'
}
const roofColors: Record<string, string> = {
  'Reflective metal sheet': '#879597', 'Clay tile': '#8f5d4c',
  'Fibre-cement sheet': '#777f7e', 'Green roof layer': '#647765'
}
const materialDB: Record<string, { k: number; mass: string; note: string }> = {
  'Compressed earth block': { k: .42, mass: 'High', note: 'Thermal buffering; low embodied energy' },
  'Fired brick': { k: .60, mass: 'High', note: 'Durable masonry with moderate heat storage' },
  'Concrete block': { k: 1.10, mass: 'High', note: 'Fast construction; higher conductivity' },
  'Stone masonry': { k: 1.70, mass: 'Very high', note: 'High thermal inertia; durable' },
  'Timber frame + infill': { k: .35, mass: 'Low', note: 'Lower mass; fast assembly' },
  'Adobe / soil block': { k: .30, mass: 'High', note: 'Site-adaptable thermal mass' },
}
const roofDB: Record<string, { alpha: number; note: string }> = {
  'Reflective metal sheet': { alpha: .30, note: 'Strong solar rejection; lightweight' },
  'Clay tile': { alpha: .55, note: 'Traditional roof with thermal buffering' },
  'Fibre-cement sheet': { alpha: .45, note: 'Moderate solar gain; easy installation' },
  'Green roof layer': { alpha: .35, note: 'High damping; requires drainage/structure' }
}

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, Number.isFinite(n) ? n : min)) }
function mergeDesign(input?: Partial<ShelterDesign>): ShelterDesign {
  const x = { ...defaults, ...(input || {}) }
  return {
    ...x,
    length: clamp(x.length, 2, 30), width: clamp(x.width, 2, 20), wallHeight: clamp(x.wallHeight, 1.8, 12),
    wallThickness: clamp(x.wallThickness, .08, 1), roofPitch: clamp(x.roofPitch, 5, 50),
    overhang: clamp(x.overhang, 0, 3), windows: Math.round(clamp(x.windows, 0, 16)),
    windowWidth: clamp(x.windowWidth, .4, 2.5), windowHeight: clamp(x.windowHeight, .5, 2.8),
    shadeDepth: clamp(x.shadeDepth, 0, 3), ventilation: clamp(x.ventilation, 0, 100),
    orientation: clamp(x.orientation, 0, 359)
  }
}

type Overlay = 'THERMAL' | 'SOLAR' | 'HEAT FLOW' | 'AIRFLOW' | ''
type ComponentName = 'Wall' | 'Roof' | 'Floor' | 'Insulation' | 'Window' | 'Shade' | 'Ridge vent' | 'Ventilation opening' | 'Door' | 'Foundation'

function tempForPart(part: string, ambient: number, indoor: number, roof: number, wall: number, hour: number) {
  const solarFactor = Math.max(0, Math.sin(((hour - 6) / 24) * Math.PI * 2))
  const roofExposure = THREE.MathUtils.clamp(ambient + 3 + solarFactor * 7 - roof * 4, indoor, ambient + 12)
  const wallExposure = THREE.MathUtils.clamp(indoor + 0.8 + solarFactor * 2.2 + wall * 1.2, indoor, ambient + 7)
  if (part === 'Roof') return roofExposure
  if (part === 'Wall') return wallExposure
  if (part === 'Window') return THREE.MathUtils.clamp(indoor + 1.5 + solarFactor * 3.5, indoor, ambient + 5)
  if (part === 'Floor') return indoor - 1.0
  if (part === 'Shade') return indoor + 0.4
  return indoor
}
function thermalColor(temp: number, min: number, max: number) {
  const t = THREE.MathUtils.clamp((temp - min) / Math.max(.1, max - min), 0, 1)
  // Engineering-style cool-to-warm scale: cyan -> green -> amber -> red.
  return new THREE.Color().setHSL(.52 - t * .52, .70, .50)
}

function PartMaterial({ color, selected, opacity = 1, transparent = false, wireframe = false }: {
  color: string; selected?: boolean; opacity?: number; transparent?: boolean; wireframe?: boolean
}) {
  return <meshStandardMaterial
    color={selected ? '#d6b45f' : color} transparent={transparent} opacity={transparent ? .42 : opacity}
    wireframe={wireframe} roughness={.72} metalness={.08}
  />
}

function WindowUnit({ x, y, z, width, height, shadeDepth, side = 'front', onSelect }: {
  x: number; y: number; z: number; width: number; height: number; shadeDepth: number; side?: 'front' | 'back'; onSelect: (x: ComponentName) => void
}) {
  const rot = side === 'front' ? 0 : Math.PI
  return <group position={[x, y, z]} rotation={[0, rot, 0]}>
    <mesh onClick={(e) => { e.stopPropagation(); onSelect('Window') }}>
      <boxGeometry args={[width, height, .055]}/><meshStandardMaterial color="#5c8d91" roughness={.25} metalness={.15}/>
    </mesh>
    <mesh position={[0, height / 2 + .13, shadeDepth / 2]} onClick={(e) => { e.stopPropagation(); onSelect('Shade') }}>
      <boxGeometry args={[width + .22, .10, Math.max(.05, shadeDepth)]}/><meshStandardMaterial color="#777b73" roughness={.85}/>
    </mesh>
    <mesh position={[0, 0, -.035]}>
      <boxGeometry args={[.055, height, .065]}/><meshStandardMaterial color="#26383a"/>
    </mesh>
  </group>
}

function AirParticles({ d, wind }: { d: ShelterDesign; wind: number }) {
  const refs = useRef<THREE.Mesh[]>([])
  const particleCount = Math.min(16, 8 + Math.floor(d.ventilation / 20))
  
  useFrame(({ clock }) => {
    refs.current.forEach((m, i) => {
      if (!m) return
      const speed = .15 + wind / 80
      const t = (clock.getElapsedTime() * speed + i * .35) % 1
      
      // Simulate air path: enter from low-level -> circulate -> exit high-level
      let x, y, z
      if (t < 0.3) {
        // Entry phase (low-level inlet)
        x = -d.length / 2 - .3
        y = .8 + Math.sin(t * Math.PI * 2) * .2
        z = -d.width / 2 + (t / 0.3) * d.width
      } else if (t < 0.7) {
        // Circulation phase (interior movement)
        x = -d.length / 2 + ((t - 0.3) / 0.4) * d.length
        y = 1.2 + Math.sin((t - 0.3) * Math.PI * 2.5) * .8
        z = d.width / 2 - .3
      } else {
        // Exit phase (high-level ridge vent)
        x = d.length / 2 - ((t - 0.7) / 0.3) * .5
        y = d.wallHeight + .15 + (1 - (t - 0.7) / 0.3) * .4
        z = Math.sin((t - 0.7) * Math.PI * 2) * .2
      }
      m.position.set(x, y, z)
    })
  })
  
  return <>{Array.from({ length: particleCount }, (_, i) =>
    <mesh key={i} ref={(m) => { if (m) refs.current[i] = m }} position={[0, 1, d.width / 2]}>
      <sphereGeometry args={[.04, 8, 8]}/><meshBasicMaterial color="#6fc4bd" transparent opacity={.7}/>
    </mesh>
  )}</>
}

function HeatFlow({ d, simulation }: { d: ShelterDesign; simulation: ShelterSimulation }) {
  const points = useMemo(() => {
    const p: [number, number, number][] = []
    // Roof heat flow points
    for (let i = 0; i < 5; i++) {
      const x = -d.length / 2 + .5 + (i / 4) * (d.length - 1)
      p.push([x, d.wallHeight + .35, d.width / 2 + .55])
    }
    // Wall heat flow points
    for (let i = 0; i < 3; i++) {
      const y = d.wallHeight * (.3 + i * .35)
      p.push([-d.length / 2 - .4, y, 0])
    }
    // Opening heat flow points
    for (let i = 0; i < 2; i++) {
      const x = -d.length / 4 + i * d.length / 2
      p.push([x, 1.55, d.width / 2 + .35])
    }
    return p
  }, [d.length, d.width, d.wallHeight])
  
  return <group>
    {points.map((p, i) => <HeatArrow key={i} start={p} strength={simulation.roofHeatFlow + simulation.wallHeatFlow + simulation.openingHeatFlow} index={i}/>)}
  </group>
}
function HeatArrow({ start, strength, index }: { start: [number, number, number]; strength: number; index: number }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(({ clock }) => { if (ref.current) ref.current.position.y = Math.sin(clock.getElapsedTime() * 2 + index) * .12 })
  return <group ref={ref} position={[start[0], 0, start[2]]}>
    <Line points={[[0, 0, 0], [0, .55 + strength * .25, 0]]} color="#e36f55" lineWidth={2}/>
    <mesh position={[0, .62 + strength * .25, 0]} rotation={[0, 0, Math.PI]}>
      <coneGeometry args={[.08, .18, 5]}/><meshBasicMaterial color="#e36f55"/>
    </mesh>
  </group>
}

function SolarRays({ d, radiation }: { d: ShelterDesign; radiation: number }) {
  const strength = THREE.MathUtils.clamp(radiation / 1000, .3, 1.2)
  const rayCount = Math.ceil(7 + radiation / 200)
  const lines = Array.from({ length: rayCount }, (_, i) => {
    const x = -d.length / 2 - .5 + (i / Math.max(1, rayCount - 1)) * (d.length + 1)
    const z = -5 + i * 0.3
    const roofHeight = Math.tan(THREE.MathUtils.degToRad(d.roofPitch)) * (d.width / 2)
    return <group key={i}>
      <Line points={[[x, 8 + Math.sin(i * 0.5) * .5, z], [x * .8, d.wallHeight + roofHeight + 0.3, d.width / 2 - 0.3]]} color="#e6b84f" lineWidth={0.8 + strength * 0.4}/>
      <mesh position={[x, 8 + Math.sin(i * 0.5) * .5, z]}><sphereGeometry args={[.04 + strength * .015, 6, 6]}/><meshBasicMaterial color="#f4d47a"/></mesh>
    </group>
  })
  return <group rotation={[0, -.35, 0]}>{lines}</group>
}

// Dimension annotations component
function DimensionAnnotations({ d }: { d: ShelterDesign }) {
  const roofHeight = Math.tan(THREE.MathUtils.degToRad(d.roofPitch)) * (d.width / 2)
  return <group position={[0, 0, 0]}>
    {/* Length dimension (front) */}
    <Line points={[[-d.length / 2 - .4, -.35, d.width / 2 + .8], [-d.length / 2 - .4, -.35, d.width / 2 + 1.2]]} color="#8fa9a3" lineWidth={1}/>
    <Line points={[[d.length / 2 + .4, -.35, d.width / 2 + .8], [d.length / 2 + .4, -.35, d.width / 2 + 1.2]]} color="#8fa9a3" lineWidth={1}/>
    <Line points={[[-d.length / 2 - .4, -.35, d.width / 2 + 1.0], [d.length / 2 + .4, -.35, d.width / 2 + 1.0]]} color="#8fa9a3" lineWidth={1}/>
    <Text position={[0, -.35, d.width / 2 + 1.45]} fontSize={.24} color="#8fa9a3" anchorX="center" anchorY="top">{d.length.toFixed(1)}m</Text>
    
    {/* Width dimension (side) */}
    <Line points={[[-d.length / 2 - 1.2, -.35, -d.width / 2 - .4], [-d.length / 2 - 1.8, -.35, -d.width / 2 - .4]]} color="#8fa9a3" lineWidth={1}/>
    <Line points={[[-d.length / 2 - 1.2, -.35, d.width / 2 + .4], [-d.length / 2 - 1.8, -.35, d.width / 2 + .4]]} color="#8fa9a3" lineWidth={1}/>
    <Line points={[[-d.length / 2 - 1.5, -.35, -d.width / 2 - .4], [-d.length / 2 - 1.5, -.35, d.width / 2 + .4]]} color="#8fa9a3" lineWidth={1}/>
    <Text position={[-d.length / 2 - 2.0, -.35, 0]} fontSize={.24} color="#8fa9a3" anchorX="right" anchorY="middle" rotation={[0, 0, Math.PI / 2]}>{d.width.toFixed(1)}m</Text>
    
    {/* Height dimension */}
    <Line points={[[-d.length / 2 - .9, 0, -d.width / 2 - .4], [-d.length / 2 - 1.3, 0, -d.width / 2 - .4]]} color="#8fa9a3" lineWidth={1}/>
    <Line points={[[-d.length / 2 - .9, d.wallHeight, -d.width / 2 - .4], [-d.length / 2 - 1.3, d.wallHeight, -d.width / 2 - .4]]} color="#8fa9a3" lineWidth={1}/>
    <Line points={[[-d.length / 2 - 1.1, 0, -d.width / 2 - .4], [-d.length / 2 - 1.1, d.wallHeight, -d.width / 2 - .4]]} color="#8fa9a3" lineWidth={1}/>
    <Text position={[-d.length / 2 - 1.5, d.wallHeight / 2, -d.width / 2 - .4]} fontSize={.24} color="#8fa9a3" anchorX="right" anchorY="middle">{d.wallHeight.toFixed(1)}m</Text>
  </group>
}

// Orientation indicator component
function OrientationIndicator({ orientation }: { orientation: number }) {
  const rad = THREE.MathUtils.degToRad(orientation)
  const arrowLength = 1.5
  return <group position={[-6, -.1, -6]}>
    {/* Cardinal directions */}
    <Text position={[0, 0, -arrowLength * 1.3]} fontSize={.18} color="#8fa9a3" anchorX="center" anchorY="middle">N</Text>
    <Text position={[arrowLength * 1.3, 0, 0]} fontSize={.18} color="#8fa9a3" anchorX="center" anchorY="middle">E</Text>
    <Text position={[0, 0, arrowLength * 1.3]} fontSize={.18} color="#8fa9a3" anchorX="center" anchorY="middle">S</Text>
    <Text position={[-arrowLength * 1.3, 0, 0]} fontSize={.18} color="#8fa9a3" anchorX="center" anchorY="middle">W</Text>
    
    {/* North arrow (always points north) */}
    <Line points={[[0, .05, -arrowLength], [0, .05, 0]]} color="#d8b65b" lineWidth={2}/>
    <mesh position={[0, .05, -arrowLength]}>
      <coneGeometry args={[.15, .25, 4]}/><meshBasicMaterial color="#d8b65b"/>
    </mesh>
    
    {/* Orientation circle indicator */}
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, .04, 0]}>
      <circleGeometry args={[arrowLength * .65, 32]}/><meshBasicMaterial color="#1a3a36" transparent opacity={.3}/>
    </mesh>
  </group>
}

function ShelterModel({ d, sim, hour, selected, setSelected, overlay }: {
  d: ShelterDesign; sim: ShelterSimulation; hour: number; selected: ComponentName | ''; setSelected: (v: ComponentName) => void
  overlay: Overlay
}) {
  const roofHeight = Math.tan(THREE.MathUtils.degToRad(d.roofPitch)) * (d.width / 2)
  const wallColor = wallColors[d.wallMaterial] || '#8f806f'
  const roofColor = roofColors[d.roofMaterial] || '#7d8888'
  const minT = Math.min(sim.outdoorTemp - 2, sim.indoorTemp - 2), maxT = sim.outdoorTemp + 12
  const getColor = (part: string, base: string) => overlay === 'THERMAL'
    ? thermalColor(tempForPart(part, sim.outdoorTemp, sim.indoorTemp, sim.roofHeatFlow, sim.wallHeatFlow, hour), minT, maxT)
    : new THREE.Color(base)
  const matProps = (part: string, base: string) => ({
    color: getColor(part, base).getStyle(), selected: selected === part,
    transparent: false, wireframe: false
  })
  const frontZ = d.width / 2 + .018, backZ = -d.width / 2 - .018
  const windowCount = Math.min(d.windows, 10)
  const xs = Array.from({ length: windowCount }, (_, i) => windowCount === 1 ? 0 : -d.length / 2 + .8 + (i * Math.max(.4, d.length - 1.6) / (windowCount - 1)))
  
  return <group rotation={[0, THREE.MathUtils.degToRad(d.orientation), 0]}>
    <mesh position={[0, -.15, 0]} onClick={() => setSelected('Foundation')}>
      <boxGeometry args={[d.length + .45, .25, d.width + .45]}/><PartMaterial {...matProps('Foundation', '#5e625e')}/>
    </mesh>
    <mesh position={[0, .02, 0]} onClick={() => setSelected('Floor')}>
      <boxGeometry args={[d.length - .06, .14, d.width - .06]}/><PartMaterial {...matProps('Floor', '#9b8b6e')}/>
    </mesh>

    <mesh position={[-d.length / 2 + d.wallThickness / 2, d.wallHeight / 2, 0]} onClick={() => setSelected('Wall')}>
      <boxGeometry args={[d.wallThickness, d.wallHeight, d.width]}/><PartMaterial {...matProps('Wall', wallColor)}/>
    </mesh>
    <mesh position={[d.length / 2 - d.wallThickness / 2, d.wallHeight / 2, 0]} onClick={() => setSelected('Wall')}>
      <boxGeometry args={[d.wallThickness, d.wallHeight, d.width]}/><PartMaterial {...matProps('Wall', wallColor)}/>
    </mesh>
    <mesh position={[0, d.wallHeight / 2, -d.width / 2 + d.wallThickness / 2]} onClick={() => setSelected('Wall')}>
      <boxGeometry args={[d.length, d.wallHeight, d.wallThickness]}/><PartMaterial {...matProps('Wall', wallColor)}/>
    </mesh>
    <mesh position={[0, d.wallHeight / 2, d.width / 2 - d.wallThickness / 2]} onClick={() => setSelected('Wall')}>
      <boxGeometry args={[d.length, d.wallHeight, d.wallThickness]}/><PartMaterial {...matProps('Wall', wallColor)}/>
    </mesh>

    <mesh position={[0, d.wallHeight + roofHeight / 2, d.width / 4]} rotation={[THREE.MathUtils.degToRad(d.roofPitch), 0, 0]} onClick={() => setSelected('Roof')}>
      <boxGeometry args={[d.length + d.overhang * 2, .16, (d.width / 2 + d.overhang) / Math.cos(THREE.MathUtils.degToRad(d.roofPitch))]}/><PartMaterial {...matProps('Roof', roofColor)}/>
    </mesh>
    <mesh position={[0, d.wallHeight + roofHeight / 2, -d.width / 4]} rotation={[-THREE.MathUtils.degToRad(d.roofPitch), 0, 0]} onClick={() => setSelected('Roof')}>
      <boxGeometry args={[d.length + d.overhang * 2, .16, (d.width / 2 + d.overhang) / Math.cos(THREE.MathUtils.degToRad(d.roofPitch))]}/><PartMaterial {...matProps('Roof', roofColor)}/>
    </mesh>

    <mesh position={[0, d.wallHeight + .05, 0]} onClick={() => setSelected('Insulation')}>
      <boxGeometry args={[d.length - .18, .10, d.width - .18]}/><PartMaterial {...matProps('Insulation', '#b69c72')} opacity={.85}/>
    </mesh>

    {xs.map((x, i) => <WindowUnit key={i} x={x} y={1.55} z={frontZ} width={Math.min(d.windowWidth, 1.5)} height={d.windowHeight} shadeDepth={d.shadeDepth} onSelect={setSelected}/>)}
    {xs.slice(0, Math.max(0, Math.ceil(windowCount / 2))).map((x, i) =>
      <WindowUnit key={`b${i}`} x={x} y={1.55} z={backZ} width={Math.min(d.windowWidth, 1.5)} height={d.windowHeight} shadeDepth={d.shadeDepth} side="back" onSelect={setSelected}/>
    )}

    <mesh position={[0, 1.15, frontZ + .03]} onClick={() => setSelected('Door')}>
      <boxGeometry args={[1.0, 2.3, .08]}/><PartMaterial {...matProps('Door', '#55483e')}/>
    </mesh>
    <mesh position={[0, d.wallHeight + roofHeight + .18, 0]} onClick={() => setSelected('Ridge vent')}>
      <boxGeometry args={[Math.max(1, d.length * .48), .22, .38]}/><PartMaterial {...matProps('Ridge vent', '#496e72')}/>
    </mesh>
    <mesh position={[0, .95, frontZ + .07]} onClick={() => setSelected('Ventilation opening')}>
      <boxGeometry args={[Math.max(.5, d.length * .65), .28, .08]}/><PartMaterial {...matProps('Ventilation opening', '#356b73')}/>
    </mesh>

    {/* Dimension annotations */}
    <DimensionAnnotations d={d}/>
    
    {/* Orientation indicator */}
    <OrientationIndicator orientation={d.orientation}/>

    {overlay === 'SOLAR' && <SolarRays d={d} radiation={sim.solarRadiation}/>}
    {overlay === 'AIRFLOW' && <AirParticles d={d} wind={sim.windSpeed}/>}
    {overlay === 'HEAT FLOW' && <HeatFlow d={d} simulation={sim}/>}
  </group>
}

function CameraButtons({ controls, autoRotate, setAutoRotate, fit, onViewChange }: { 
  controls: RefObject<any>; autoRotate: boolean; setAutoRotate: (v: boolean) => void; fit: () => void; onViewChange?: (view: string) => void 
}) {
  const zoom = (factor: number) => { const camera = controls.current?.object; if (camera) { camera.position.multiplyScalar(factor); controls.current?.update() } }
  const setView = (name: string, pos: [number, number, number], tar: [number, number, number]) => {
    const c = controls.current; if (!c?.object) return
    c.object.position.set(...pos); c.target.set(...tar); c.update()
    onViewChange?.(name)
  }
  return <div className="cad-controls">
    <div className="cad-controls-group">
      <button title="Zoom out" onClick={() => zoom(1.16)}><Minus size={15}/></button>
      <button title="Zoom in" onClick={() => zoom(.86)}><Plus size={15}/></button>
    </div>
    <div className="cad-controls-group">
      <button title="Front view" onClick={() => setView('Front', [0, 4, 12], [0, 2, 0])}><Box size={15}/></button>
      <button title="Top view" onClick={() => setView('Top', [0, 14, 0.1], [0, 0, 0])}><Layout size={15}/></button>
      <button title="Side view" onClick={() => setView('Side', [14, 4, 0], [0, 2, 0])}><Copy size={15}/></button>
    </div>
    <div className="cad-controls-group">
      <button title="Fit model" onClick={fit}><Maximize2 size={15}/></button>
      <button title="Reset view" onClick={() => controls.current?.reset()}><Crosshair size={15}/></button>
      <button title="Auto rotate" onClick={() => setAutoRotate(!autoRotate)} className={autoRotate ? 'cad-active' : ''}><Rotate3D size={15}/></button>
    </div>
  </div>
}

function Scene({ d, sim, hour, selected, setSelected, overlay, autoRotate, controls, orthographic }: any) {
  return <>
    {orthographic ? <OrthographicCamera makeDefault position={[8, 6, 10]} zoom={42}/> : <PerspectiveCamera makeDefault position={[9, 6.5, 10]} fov={43}/>}
    <color attach="background" args={['#eef4f1']}/>
    <fog attach="fog" args={['#eef4f1', 14, 34]}/>
    <ambientLight intensity={1.2}/>
    <directionalLight position={[6, 10, 5]} intensity={2.1} castShadow/>
    <directionalLight position={[-5, 4, -3]} intensity={.55}/>
    <gridHelper args={[32, 32, '#b8ccc5', '#d5e0dc']} position={[0, -.29, 0]}/>
    <axesHelper args={[2.1]} position={[-d.length / 2 - .7, 0, -d.width / 2 - .7]}/>
    <ShelterModel d={d} sim={sim} hour={hour} selected={selected} setSelected={setSelected} overlay={overlay}/>
    <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={.08} autoRotate={autoRotate} autoRotateSpeed={.65} minDistance={3.5} maxDistance={28}/>
  </>
}

function ThermalChart({ sim, hour, setHour }: { sim: ShelterSimulation; hour: number; setHour: (h: number) => void }) {
  const values = Array.from({ length: 24 }, (_, h) => {
    const daylight = Math.max(0, Math.sin(((h - 6) / 24) * Math.PI * 2))
    const ambient = sim.outdoorTemp - 4 + daylight * 8
    const your = sim.indoorTemp - 1.4 + daylight * 5
    const ai = sim.indoorTemp - 3.6 + daylight * 4.2
    return { h, ambient, your, ai }
  })
  const w = 900, ht = 250, pad = 34
  const min = Math.min(...values.flatMap(v => [v.ambient, v.your, v.ai])) - 1
  const max = Math.max(...values.flatMap(v => [v.ambient, v.your, v.ai])) + 1
  const x = (h: number) => pad + (h / 23) * (w - pad * 2)
  const y = (t: number) => ht - pad - ((t - min) / (max - min)) * (ht - pad * 2)
  const path = (key: 'ambient' | 'your' | 'ai') => values.map((v, i) => `${i ? 'L' : 'M'} ${x(v.h).toFixed(1)} ${y(v[key]).toFixed(1)}`).join(' ')
  const selected = values[hour]
  const reduction = selected.ambient - selected.ai
  return <div className="cad-thermal-chart">
    <div className="cad-chart-head"><div><b>24-hour thermal response</b><span>Click any hour to inspect the shelter at that point</span></div><strong>{String(hour).padStart(2,'0')}:00</strong></div>
    <div className="cad-chart-wrap">
      <svg viewBox={`0 0 ${w} ${ht}`} role="img" aria-label="24 hour thermal response chart">
        {[0,6,12,18,23].map(h => <line key={h} x1={x(h)} x2={x(h)} y1={pad} y2={ht-pad} stroke="#253534" strokeWidth="1"/>)}
        <path d={path('ambient')} fill="none" stroke="#e46e59" strokeWidth="4" strokeLinecap="round"/>
        <path d={path('your')} fill="none" stroke="#d8b65b" strokeWidth="4" strokeLinecap="round"/>
        <path d={path('ai')} fill="none" stroke="#5dbab1" strokeWidth="4" strokeLinecap="round"/>
        <line x1={x(hour)} x2={x(hour)} y1={pad-5} y2={ht-pad+4} stroke="#e8e0c7" strokeDasharray="5 5" opacity=".75"/>
        <circle cx={x(hour)} cy={y(values[hour].ambient)} r="6" fill="#e46e59"/>
        <circle cx={x(hour)} cy={y(values[hour].your)} r="6" fill="#d8b65b"/>
        <circle cx={x(hour)} cy={y(values[hour].ai)} r="6" fill="#5dbab1"/>
        {values.map(v => <rect key={v.h} x={x(v.h)-8} y={pad} width="16" height={ht-pad*2} fill="transparent" onClick={() => setHour(v.h)} style={{cursor:'pointer'}}/>)}
        {[0,6,12,18,23].map(h => <text key={h} x={x(h)} y={ht-8} textAnchor="middle" fill="#82928f" fontSize="12">{String(h).padStart(2,'0')}:00</text>)}
      </svg>
    </div>
    <div className="cad-chart-detail" aria-live="polite">
      <div><span>Selected hour</span><b>{String(hour).padStart(2,'0')}:00</b></div>
      <div><span>Ambient</span><b>{selected.ambient.toFixed(1)}°C</b></div>
      <div><span>Your design</span><b>{selected.your.toFixed(1)}°C</b></div>
      <div><span>AI design</span><b>{selected.ai.toFixed(1)}°C</b></div>
      <div className="cad-chart-detail-highlight"><span>AI reduction</span><b>{reduction.toFixed(1)}°C</b></div>
    </div>
    <div className="cad-legend"><span><i className="cad-ambient-dot"/>Ambient</span><span><i className="cad-your-dot"/>Your design</span><span><i className="cad-ai-dot"/>AI design</span><span className="cad-chart-note">Selected hour drives the viewer above</span></div>
  </div>
}

export default function ShelterCADViewer({ design, aiDesign, simulation, climate, selectedHour = 12, onHourChange }: ShelterCADViewerProps) {
  const [view, setView] = useState<'YOUR DESIGN' | 'AI BEST DESIGN' | 'COMPARE'>('COMPARE')
  const [selectedModel, setSelectedModel] = useState<'user' | 'ai'>('user')
  const [inspectorTab, setInspectorTab] = useState<'Structure'|'Thermal'|'Material'|'Solar'>('Structure')
  const compareUserControls = useRef<any>(null)
  const compareAiControls = useRef<any>(null)
  const [selected, setSelected] = useState<ComponentName | ''>('')
  const [overlay] = useState<Overlay>('')
  const [autoRotate, setAutoRotate] = useState(false)
  const [orthographic, setOrthographic] = useState(false)
  const [currentView, setCurrentView] = useState('Perspective')
  const controls = useRef<any>(null)

  const user = useMemo(() => mergeDesign(design), [design])
  const ai = useMemo(() => mergeDesign(aiDesign || {
    ...user, wallThickness: Math.max(.3, user.wallThickness), roofPitch: user.roofPitch + 5,
    shadeDepth: Math.max(1.8, user.shadeDepth), ventilation: Math.max(38, user.ventilation + 10),
    windows: Math.max(user.windows, 6)
  }), [aiDesign, user])
  const sim = useMemo(() => ({ ...simDefaults, ...(simulation || {}), ...(climate || {}) }), [simulation, climate])
  const aiSim = useMemo(() => ({
    ...sim, indoorTemp: sim.indoorTemp - 2.3, solarEnergy: sim.solarEnergy * .78,
    roofHeatFlow: sim.roofHeatFlow * .85, wallHeatFlow: sim.wallHeatFlow * .72, openingHeatFlow: sim.openingHeatFlow * .76,
    thermalScore: Math.min(99, sim.thermalScore + 7)
  }), [sim])
  const d = view === 'AI BEST DESIGN' || (view === 'COMPARE' && selectedModel === 'ai') ? ai : user
  const activeSim = view === 'AI BEST DESIGN' || (view === 'COMPARE' && selectedModel === 'ai') ? aiSim : sim
  const totalHeat = activeSim.roofHeatFlow + activeSim.wallHeatFlow + activeSim.openingHeatFlow
  const hour = selectedHour
  const indoorAtHour = activeSim.indoorTemp - Math.sin((hour - 6) / 24 * Math.PI * 2) * 1.05
  const airIndex = Math.round(clamp(d.ventilation * .92 + activeSim.windSpeed * .35, 0, 100))

  useEffect(() => { if (view !== 'COMPARE') setSelected('') }, [view])

  const material = selected === 'Wall' ? (materialDB[d.wallMaterial] || materialDB['Compressed earth block']) : null
  const roofInfo = selected === 'Roof' ? (roofDB[d.roofMaterial] || roofDB['Reflective metal sheet']) : null
  const inspector: Record<string, { label: string; value: string }[]> = {
    '': [
      { label:'Length', value:`${d.length.toFixed(2)} m` }, { label:'Width', value:`${d.width.toFixed(2)} m` },
      { label:'Wall height', value:`${d.wallHeight.toFixed(2)} m` }, { label:'Floor area', value:`${(d.length*d.width).toFixed(1)} m²` },
      { label:'Wall thickness', value:`${(d.wallThickness*100).toFixed(0)} cm` }, { label:'Roof pitch', value:`${d.roofPitch}°` },
      { label:'Windows', value:String(d.windows) }, { label:'Ventilation', value:`${d.ventilation}%` }, { label:'Orientation', value:`${d.orientation}°` }
    ],
    Wall: [{label:'Material',value:d.wallMaterial},{label:'Thickness',value:`${(d.wallThickness*100).toFixed(0)} cm`},{label:'Conductivity',value:`${material?.k.toFixed(2) || '—'} W/m·K`},{label:'Thermal mass',value:material?.mass || '—'},{label:'Heat flow',value:`${activeSim.wallHeatFlow.toFixed(2)} kW`}],
    Roof: [{label:'Material',value:d.roofMaterial},{label:'Pitch',value:`${d.roofPitch}°`},{label:'Overhang',value:`${d.overhang.toFixed(2)} m`},{label:'Solar absorptance',value:roofInfo ? roofInfo.alpha.toFixed(2) : '—'},{label:'Heat flow',value:`${activeSim.roofHeatFlow.toFixed(2)} kW`}],
    Insulation: [{label:'Material',value:d.insulationMaterial},{label:'Thickness',value:'10 cm'},{label:'Conductivity',value:'0.040 W/m·K'},{label:'Role',value:'Thermal resistance'}],
    Window: [{label:'Count',value:String(d.windows)},{label:'Opening size',value:`${d.windowWidth.toFixed(1)} × ${d.windowHeight.toFixed(1)} m`},{label:'Opening heat flow',value:`${activeSim.openingHeatFlow.toFixed(2)} kW`}],
    Shade: [{label:'Depth',value:`${d.shadeDepth.toFixed(2)} m`},{label:'Role',value:'External solar protection'}],
    'Ridge vent': [{label:'Opening strategy',value:`${d.ventilation}%`},{label:'Role',value:'High-level heat exhaust'}],
    'Ventilation opening': [{label:'Ventilation',value:`${d.ventilation}%`},{label:'Air exchange index',value:`${airIndex}/100`}],
    Door: [{label:'Opening',value:'1.0 × 2.3 m'},{label:'Role',value:'Access / air exchange'}],
    Floor: [{label:'Material',value:d.floorMaterial},{label:'Area',value:`${(d.length*d.width).toFixed(1)} m²`}],
    Foundation: [{label:'Footprint',value:`${(d.length*d.width).toFixed(1)} m²`},{label:'Role',value:'Load distribution'}]
  }
  const baseRows = inspector[selected || '']
  const thermalRows = [
    {label:'Indoor temperature',value:`${indoorAtHour.toFixed(1)} °C`},
    {label:'Ambient temperature',value:`${activeSim.outdoorTemp.toFixed(1)} °C`},
    {label:'ΔT',value:`${(activeSim.outdoorTemp-indoorAtHour).toFixed(1)} °C`},
    {label:'Total heat flow',value:`${totalHeat.toFixed(2)} kW`}
  ]
  const materialRows = selected ? baseRows.filter(r => ['Material','Thickness','Conductivity','Thermal mass','Role'].includes(r.label)) : [
    {label:'Wall',value:d.wallMaterial},{label:'Roof',value:d.roofMaterial},{label:'Insulation',value:d.insulationMaterial},{label:'Floor',value:d.floorMaterial}
  ]
  const solarRows = [
    {label:'Solar radiation',value:`${activeSim.solarRadiation.toFixed(0)} W/m²`},
    {label:'Peak-sun hours',value:`${activeSim.peakSunHours.toFixed(1)} h`},
    {label:'Roof area',value:`${(d.length*d.width*1.12).toFixed(1)} m²`},
    {label:'Estimated solar energy',value:`${activeSim.solarEnergy.toFixed(1)} kWh/day`}
  ]
  const rows = inspectorTab === 'Thermal' ? thermalRows : inspectorTab === 'Material' ? materialRows : inspectorTab === 'Solar' ? solarRows : baseRows
  const fitCamera = () => {
    const c = controls.current
    if (!c?.object) return
    c.object.position.set(d.length * 1.25, Math.max(4, d.wallHeight * 1.35), d.width * 1.6)
    c.target.set(0, d.wallHeight * .48, 0)
    c.update()
  }

  // Calculate AI improvements
  const wallThickDiff = ((ai.wallThickness - user.wallThickness) / user.wallThickness * 100).toFixed(0)
  const roofPitchDiff = (ai.roofPitch - user.roofPitch).toFixed(0)
  const overhangDiff = ((ai.shadeDepth - user.shadeDepth) / Math.max(.1, user.shadeDepth) * 100).toFixed(0)
  const ventilationDiff = (ai.ventilation - user.ventilation).toFixed(0)

  const canvas = (small = false, designOverride?: ShelterDesign, simOverride?: ShelterSimulation, modelKey?: 'user'|'ai', controlOverride?: RefObject<any>) => {
    const cd = designOverride || d, cs = simOverride || activeSim
    const controlRef = controlOverride || controls
    const selectPart = (part: ComponentName) => { setSelected(part); if (modelKey) setSelectedModel(modelKey) }
    return <div className={small ? 'cad-canvas cad-canvas-small' : 'cad-canvas'}>
      <Canvas shadows dpr={[1,1.6]}>
        <Scene d={cd} sim={cs} hour={hour} selected={selected} setSelected={selectPart} overlay={overlay}
          autoRotate={autoRotate} controls={controlRef} orthographic={orthographic}/>
      </Canvas>
      {!small && <CameraButtons controls={controls} autoRotate={autoRotate} setAutoRotate={setAutoRotate} fit={fitCamera} onViewChange={setCurrentView}/>}
      {!small && <div className="cad-hint"><MousePointer2 size={12}/> Click a component to inspect it</div>}
    </div>
  }

  return <main className="cad-ag-viewer">
    <header className="cad-ag-topbar">
      <div className="cad-brand"><div className="cad-brand-mark">AG</div><div><div className="cad-brand-kicker">AASHRAYA GANITH</div><h1>Shelter CAD & thermal workspace</h1></div></div>
      <div className="cad-status"><b>HOUR {String(hour).padStart(2,'0')}:00</b></div>
    </header>

    <section className="cad-model-toolbar">
      <div className="cad-toolbar-group cad-utility-group">
        <button onClick={() => setAutoRotate(!autoRotate)} className={autoRotate?'cad-selected':''}><Rotate3D size={15}/>Auto rotate</button>
        <button onClick={() => { controls.current?.reset(); compareUserControls.current?.reset(); compareAiControls.current?.reset() }}><Crosshair size={15}/>Reset views</button>
      </div>
    </section>

    {view === 'COMPARE' ? <section className="cad-compare-grid">
      <article className="cad-model-card"><div className="cad-model-card-head"><div><b>YOUR DESIGN</b><span>User-defined geometry, dimensions & materials</span></div><strong>{sim.thermalScore}/100</strong></div>{canvas(true,user,sim,'user',compareUserControls)}<div className="cad-mini-metrics"><span><b>{sim.indoorTemp.toFixed(1)}°C</b>Inside</span><span><b>{sim.solarEnergy.toFixed(1)}</b>kWh/day</span><span><b>{(sim.roofHeatFlow+sim.wallHeatFlow+sim.openingHeatFlow).toFixed(2)}</b>kW flow</span></div></article>
      <article className="model-card ai-card"><div className="cad-model-card-head"><div><b>AI OPTIMIZED DESIGN</b><span>Optimized geometry, materials & passive strategy</span></div><strong>{aiSim.thermalScore}/100</strong></div>{canvas(true,ai,aiSim,'ai',compareAiControls)}<div className="cad-mini-metrics"><span><b>{aiSim.indoorTemp.toFixed(1)}°C</b>Inside</span><span><b>{aiSim.solarEnergy.toFixed(1)}</b>kWh/day</span><span><b>{(aiSim.roofHeatFlow+aiSim.wallHeatFlow+aiSim.openingHeatFlow).toFixed(2)}</b>kW flow</span></div></article>
      <article className="cad-ai-explanation"><div className="cad-ai-exp-head"><Zap size={18}/><b>AI OPTIMIZATIONS</b></div><div className="cad-ai-exp-rows"><div><span>Wall thickness</span><b>+{wallThickDiff}%</b><small>Increased thermal mass & resistance</small></div><div><span>Roof pitch</span><b>+{roofPitchDiff}°</b><small>Improved water drainage & ventilation</small></div><div><span>Shading depth</span><b>+{overhangDiff}%</b><small>Enhanced solar protection</small></div><div><span>Ventilation</span><b>+{ventilationDiff}%</b><small>Improved natural air circulation</small></div></div><div className="cad-ai-exp-result"><Sun size={16}/><span>Thermal improvement</span><b>{(aiSim.thermalScore - sim.thermalScore).toFixed(0)} points</b></div></article>
    </section> : <section className="cad-workspace">
      <article className="cad-viewer-card">
        <div className="cad-viewer-head"><div><span className="cad-eyebrow">INTERACTIVE MODEL</span><h2>{view === 'AI BEST DESIGN' ? 'AI best design' : 'Your design'}</h2><p>Rotate, inspect and switch simulation layers. Geometry follows the project inputs.</p></div><div className="cad-viewer-mode">{orthographic ? 'ORTHOGRAPHIC' : 'PERSPECTIVE'} · {currentView}</div></div>
        {canvas()}
      </article>
      <aside className="cad-inspector">
        <div className="cad-inspector-head"><div><span className="cad-eyebrow">COMPONENT INSPECTOR</span><h2>{selected || 'Shelter overview'}</h2></div><CircleHelp size={17}/></div>
        <div className="cad-inspector-tabs">{(['Structure','Thermal','Material','Solar'] as const).map(tab => <button key={tab} className={inspectorTab===tab?'cad-active':''} onClick={() => setInspectorTab(tab)}>{tab}</button>)}</div>
        <div className="cad-inspector-rows">{rows.map(r => <div key={r.label}><span>{r.label}</span><b>{r.value}</b></div>)}</div>
        <div className="cad-relevance"><b>Why it matters</b><p>{selected==='Roof' ? 'Roof pitch, overhang and surface absorptance directly affect solar gain and heat transfer.' : selected==='Wall' ? 'Wall material and thickness control conductive heat flow and thermal storage.' : selected==='Window' ? 'Openings influence solar gain, ventilation and heat exchange.' : selected==='Ridge vent' || selected==='Ventilation opening' ? 'High-level exhaust and cross-flow help remove accumulated warm air.' : 'Select a wall, roof, opening, shade or ventilation element in the model to inspect its role.'}</p></div>
        <div className="cad-output-stack">
          <div><Thermometer size={17}/><span>Inside temperature</span><b>{indoorAtHour.toFixed(1)}°C</b></div>
          <div><Sun size={17}/><span>Solar thermal energy</span><b>{activeSim.solarEnergy.toFixed(1)} kWh/day</b></div>
          <div><Flame size={17}/><span>Total heat flow</span><b>{totalHeat.toFixed(2)} kW</b></div>
          <div><Wind size={17}/><span>Air exchange</span><b>{airIndex}/100</b></div>
        </div>
      </aside>
    </section>}

    <ThermalChart sim={activeSim} hour={hour} setHour={(h) => onHourChange?.(h)}/>

    <section className="cad-timeline">
      <div><span className="cad-eyebrow">24H SIMULATION</span><b>{String(hour).padStart(2,'0')}:00</b></div>
      <input type="range" min="0" max="23" value={hour} onChange={e => onHourChange?.(Number(e.target.value))}/>
      <span>Ambient {activeSim.outdoorTemp.toFixed(1)}°C</span><span>Wind {activeSim.windSpeed.toFixed(0)} km/h</span><span>Solar {activeSim.solarRadiation.toFixed(0)} W/m²</span>
    </section>

    <footer className="cad-ag-footer"><span>CREATED BY BLUE STARS</span></footer>
  </main>
}

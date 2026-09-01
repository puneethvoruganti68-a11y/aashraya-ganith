import React, { useEffect, useMemo, useRef, useState } from 'react';
import ShelterCADViewer, { type ShelterDesign as CADShelterDesign, type ShelterSimulation as CADShelterSimulation } from './components/ShelterCADViewer';
import './cad-viewer.css';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity, ArrowRight, Check, ChevronDown, CircleDollarSign, CloudSun, Droplets,
  Fan, Home, LocateFixed, MapPin, Maximize2, Rotate3D, Settings2, ShieldCheck,
  SlidersHorizontal, Sparkles, Sun, Thermometer, Users, Wind, X, Building2,
  PawPrint, Info, Gauge, Layers3, Waves, Ruler, CircleGauge, PanelTop, Clock3,
  Flame, ArrowDownRight, ArrowUpRight, TreePine, Box, WalletCards, Factory
} from 'lucide-react';

type Target = 'human' | 'livestock';
type Step = 'project' | 'climate' | 'studio';
type Mode = 'structure' | 'thermal' | 'solar' | 'heatflow' | 'airflow';
type Livestock = 'cattle' | 'goat' | 'sheep' | 'poultry';

type Inputs = {
  target: Target; occupants: number; purpose: string; livestock: Livestock;
  area: number; budget: number; location: string; city: string; state: string;
  climateType: string; outdoorTemp: number; humidity: number; wind: number; solar: number;
  wall: number; shade: number; ventilation: number; roofPitch: number; roof: string;
  analysisHours: number; peakSunHours: number; solarEfficiency: number;
  wallMaterial: string; roofMaterial: string; insulationMaterial: string; floorMaterial: string;
};

const citySuggestions = [
  { city: 'Delhi', state: 'Delhi' },
  { city: 'Hyderabad', state: 'Telangana' },
  { city: 'Mumbai', state: 'Maharashtra' },
  { city: 'Bengaluru', state: 'Karnataka' },
  { city: 'Chennai', state: 'Tamil Nadu' },
  { city: 'Kolkata', state: 'West Bengal' },
  { city: 'Pune', state: 'Maharashtra' },
  { city: 'Ahmedabad', state: 'Gujarat' },
  { city: 'Jaipur', state: 'Rajasthan' },
  { city: 'Jaisalmer', state: 'Rajasthan' },
  { city: 'Leh', state: 'Ladakh' },
  { city: 'Visakhapatnam', state: 'Andhra Pradesh' },
  { city: 'Lucknow', state: 'Uttar Pradesh' },
  { city: 'Chandigarh', state: 'Chandigarh' },
  { city: 'Bhopal', state: 'Madhya Pradesh' },
  { city: 'Indore', state: 'Madhya Pradesh' },
  { city: 'Nagpur', state: 'Maharashtra' },
  { city: 'Surat', state: 'Gujarat' },
  { city: 'Kochi', state: 'Kerala' },
  { city: 'Bhubaneswar', state: 'Odisha' },
  { city: 'Patna', state: 'Bihar' },
  { city: 'Ranchi', state: 'Jharkhand' },
  { city: 'Guwahati', state: 'Assam' },
  { city: 'Srinagar', state: 'Jammu and Kashmir' },
  { city: 'Dehradun', state: 'Uttarakhand' },
  { city: 'Shimla', state: 'Himachal Pradesh' }
];
const climatePresets = [
  {id:'thar', name:'Thar Desert', type:'Hot & dry', city:'Jaisalmer', state:'Rajasthan', temp:42, humidity:22, wind:15, solar:950},
  {id:'ladakh', name:'Ladakh High-Altitude', type:'Cold & dry', city:'Leh', state:'Ladakh', temp:17, humidity:28, wind:12, solar:820},
  {id:'deccan', name:'Deccan Semi-Arid', type:'Hot semi-arid', city:'Hyderabad', state:'Telangana', temp:36, humidity:44, wind:14, solar:880},
  {id:'coastal', name:'Coastal Humid Tropical', type:'Hot & humid', city:'Visakhapatnam', state:'Andhra Pradesh', temp:34, humidity:76, wind:18, solar:720},
];

const money=(n:number)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(Math.round(n));
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
function classifyClimate(temp:number, humidity:number){
  if(temp <= 20) return 'Ladakh High-Altitude';
  if(temp >= 38 && humidity < 35) return 'Thar Desert';
  if(humidity >= 70 && temp >= 28) return 'Coastal Humid Tropical';
  return 'Deccan Semi-Arid';
}

const materialFactors:Record<string,{wall:number;roof:number;mass:number}>= {
  'Compressed earth block':{wall:.78,roof:1,mass:1.08},
  'Fired brick':{wall:.94,roof:1,mass:1.03},
  'Concrete block':{wall:1.12,roof:1,mass:.98},
  'Stone masonry':{wall:1.18,roof:1,mass:1.12},
  'Timber frame + infill':{wall:.72,roof:1,mass:.82},
  'Adobe / soil block':{wall:.68,roof:1,mass:1.10},
  'Reflective metal sheet':{wall:1,roof:.72,mass:1},
  'Clay tile':{wall:1,roof:.88,mass:1.04},
  'Fibre-cement sheet':{wall:1,roof:.84,mass:1},
  'Green roof layer':{wall:1,roof:.58,mass:1.15},
  'Mineral wool':{wall:.72,roof:.68,mass:1.06},
  'EPS board':{wall:.66,roof:.62,mass:1.02},
  'Rice-husk insulation':{wall:.82,roof:.76,mass:1.04},
  'Cork board':{wall:.70,roof:.67,mass:1.05},
  'Stabilized earth floor':{wall:1,roof:1,mass:1.08},
  'Concrete slab':{wall:1,roof:1,mass:1.00},
  'Brick floor':{wall:1,roof:1,mass:1.04},
  'Raised timber floor':{wall:1,roof:1,mass:.84}
};

function thermalFor(i: Inputs, ai=false, realDailySolarEnergy?: number){
  const shade=ai?Math.max(i.shade,1.8):i.shade;
  const wallMat=materialFactors[i.wallMaterial]||materialFactors['Compressed earth block'];
  const roofMat=materialFactors[i.roofMaterial]||materialFactors['Reflective metal sheet'];
  const insMat=materialFactors[i.insulationMaterial]||materialFactors['Mineral wool'];
  const floorMat=materialFactors[i.floorMaterial]||materialFactors['Stabilized earth floor'];
  const wall=ai?Math.max(i.wall,30):i.wall;
  const vent=ai?Math.max(i.ventilation,38):i.ventilation;
  const pitch=ai?Math.max(i.roofPitch,28):i.roofPitch;
  const insulation = (ai ? .86 : .42) * insMat.wall;
  const solarProtection = clamp((shade/2.2)*.22 + insulation*.20 + (ai?.08:0), .05, .58);
  const ventilationEffect = clamp((vent/100)*(0.35+i.wind/45), .05, .48);
  const massEffect = clamp(wall/100*.42*wallMat.mass*floorMat.mass, .04, .24);
  const humidityPenalty = i.humidity/100*.8;
  const solarPenalty = i.solar/1000*1.2;
  const reduction=clamp(2.4 + solarProtection*8.5 + ventilationEffect*4.4 + massEffect*2.1 + pitch*.035 - solarPenalty - humidityPenalty, 2.0, 13.5);
  const peak=Number((i.outdoorTemp-reduction).toFixed(1));
  const score=clamp(Math.round(68+reduction*2.35+vent*.12+wall*.08-(i.humidity>70?4:0)),58,99);
  const roofArea=i.area*1.12;
  const envelopeSide=2*Math.sqrt(Math.max(8,i.area))*3;
  const roofU=(ai?.78:.98)*roofMat.roof;
  const wallU=(ai?.95:1.35)*wallMat.wall*insMat.wall;
  const windowArea=Math.max(3,i.area*.12);
  const delta=Math.max(0,i.outdoorTemp-peak);
  const qRoof=roofU*roofArea*delta/1000;
  const qWalls=wallU*envelopeSide*delta/1000;
  const qOpenings=.65*windowArea*delta/1000;
  const totalHeatFlow=qRoof+qWalls+qOpenings;
  const solarIncident=realDailySolarEnergy != null
    ? realDailySolarEnergy*roofArea
    : i.solar*roofArea*i.peakSunHours/1000;
  const absorbedSolar=solarIncident*(1-solarProtection)*(.72 + (1-i.solarEfficiency/100)*.05);
  const comfort=clamp(Math.round(24+(score-70)*.55-(i.humidity>70?4:0)),10,24);
  const air=Math.round(45+vent*1.02+i.wind*.55);
  return {
    peak,reduction,score,roofHeat:Math.round(qRoof*1000/roofArea),wallHeat:Math.round(qWalls*1000/envelopeSide),
    air,comfort,shade,wall,vent,pitch,delta,roofArea,envelopeSide,windowArea,
    qRoof:Number(qRoof.toFixed(2)),qWalls:Number(qWalls.toFixed(2)),qOpenings:Number(qOpenings.toFixed(2)),
    totalHeatFlow:Number(totalHeatFlow.toFixed(2)),periodHeat:Number((totalHeatFlow*i.analysisHours).toFixed(1)),
    solarIncident:Number(solarIncident.toFixed(1)),absorbedSolar:Number(absorbedSolar.toFixed(1)),
    solarProtection:Number(solarProtection.toFixed(2))
  };
}

function costFor(i: Inputs, ai=false){
  const materialRate: Record<string, number> = {
    'Compressed earth block': 4000, 'Fired brick': 4300, 'Concrete block': 4500,
    'Stone masonry': 5200, 'Timber frame + infill': 3900, 'Adobe / soil block': 3700
  };
  const roofRate: Record<string, number> = {
    'Reflective metal sheet': 520, 'Clay tile': 650, 'Fibre-cement sheet': 480, 'Green roof layer': 900
  };
  const insulationRate: Record<string, number> = {
    'Mineral wool': 620, 'EPS board': 540, 'Rice-husk insulation': 460, 'Cork board': 700
  };
  const wallRate = materialRate[i.wallMaterial] ?? 4100;
  const roofRateValue = roofRate[i.roofMaterial] ?? 540;
  const insRate = insulationRate[i.insulationMaterial] ?? 580;
  const roofArea = i.area * (1.05 + Math.tan((i.roofPitch * Math.PI) / 180) * 0.10) + i.shade * i.area * 0.025;
  const wallEnvelope = 2 * Math.sqrt(Math.max(8, i.area)) * 3;
  const wallCost = wallEnvelope * wallRate * (i.wall / 25) * 0.19;
  const roofCost = roofArea * roofRateValue;
  const insulationCost = i.area * insRate * 0.34;
  const openingCost = Math.max(3, i.area * 0.12) * 2600;
  const passiveCost = i.area * (i.shade * 70 + i.ventilation * 4);
  let total = wallCost + roofCost + insulationCost + openingCost + passiveCost;
  if (ai) {
    // Optimization changes are explicit: a slightly more compact envelope,
    // lower-cost thermal materials where suitable, and passive measures that
    // reduce the need for expensive construction.
    const compactEnvelope = Math.max(0.90, 1 - Math.min(0.07, Math.max(0, i.area - 30) / 900));
    const optimizedWall = wallEnvelope * compactEnvelope * Math.max(3600, wallRate * 0.92) * (Math.max(i.wall, 30) / 25) * 0.17;
    const optimizedRoof = roofArea * 0.96 * Math.max(430, roofRateValue * 0.92);
    const optimizedInsulation = i.area * Math.max(430, insRate * 0.88) * 0.32;
    const optimizedOpenings = Math.max(3, i.area * 0.10) * 2500;
    const optimizedPassive = i.area * (Math.max(i.shade, 1.5) * 55 + Math.max(i.ventilation, 38) * 3.2);
    total = optimizedWall + optimizedRoof + optimizedInsulation + optimizedOpenings + optimizedPassive;
  }
  // Keep the estimate in a realistic small-shelter construction range while retaining
  // transparent quantity-driven relationships between geometry, materials and passive features.
  total = Math.round(total * 2.05);
  return {total, materials:Math.round(total*.78), labour:Math.round(total*.22)};
}

function App(){
  const [step,setStep]=useState<Step>('project');
  const [mode,setMode]=useState<Mode>('structure');
  const [detailsOpen,setDetailsOpen]=useState(false);
  const [climateOpen,setClimateOpen]=useState(false);
  const [materialsOpen,setMaterialsOpen]=useState(false);
  const [materialsConfigured,setMaterialsConfigured]=useState(false);
  const [locationStatus,setLocationStatus]=useState('');
  const [weatherLoading,setWeatherLoading]=useState(false);
  const [weatherStatus,setWeatherStatus]=useState('');
  const [weatherSource,setWeatherSource]=useState('');
  const [realHourlyTemps,setRealHourlyTemps]=useState<number[]>([]);
  const [realHourlySolar,setRealHourlySolar]=useState<number[]>([]);
  const [realDailySolarEnergy,setRealDailySolarEnergy]=useState<number | null>(null);
  const [currentSolarRadiation,setCurrentSolarRadiation]=useState(0);
  const [currentTemperature,setCurrentTemperature]=useState(42);
  const [dragging,setDragging]=useState(false);
  const [rotation,setRotation]=useState({x:-9,y:-28});
  const [selectedHour,setSelectedHour]=useState(12);
    const [mlPrediction, setMlPrediction] = useState<{
    indoor_temperature: number;
    indoor_humidity: number;
  } | null>(null);

  const [mlLoading, setMlLoading] = useState(false);
  const [mlError, setMlError] = useState('');
  const dragRef=useRef({x:0,y:0,rx:0,ry:0});
  const [i,setI]=useState<Inputs>({
    target:'human', occupants:6, purpose:'Rural home', livestock:'cattle', area:40,
    budget:200000, location:'Jaisalmer, Rajasthan', city:'Jaisalmer', state:'Rajasthan',
    climateType:'Hot & dry', outdoorTemp:42, humidity:22, wind:15, solar:950,
    wall:25, shade:1.2, ventilation:25, roofPitch:22, roof:'Base pitched roof',
    analysisHours:24, peakSunHours:6, solarEfficiency:72,
    wallMaterial:'Compressed earth block', roofMaterial:'Reflective metal sheet',
    insulationMaterial:'Mineral wool', floorMaterial:'Stabilized earth floor'
  });

  const user=useMemo(()=>thermalFor(i,false,realDailySolarEnergy ?? undefined),[i,realDailySolarEnergy]);
  const ai=useMemo(()=>thermalFor(i,true,realDailySolarEnergy ?? undefined),[i,realDailySolarEnergy]);
  const userCost=useMemo(()=>costFor(i,false),[i]);
  const aiCost=useMemo(()=>costFor(i,true),[i]);
  const update=(patch:Partial<Inputs>)=>setI(v=>({...v,...patch}));
    const runMLPrediction = async () => {
    setMlLoading(true);
    setMlError('');

    try {
      const response = await fetch('/api/v2/ml/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location: i.city || i.location || 'Delhi',
          timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),

          outdoor_temperature: i.outdoorTemp,
          outdoor_humidity: i.humidity,
          outdoor_wind_speed: i.wind,
          outdoor_solar_radiation: i.solar,

          nasa_temperature: i.outdoorTemp,
          nasa_humidity: i.humidity,
          nasa_wind_speed: i.wind,
          nasa_solar_radiation: i.solar,

          indoor_temperature: user.peak,
          indoor_humidity: i.humidity,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'ML prediction failed');
      }

      setMlPrediction(data.prediction);
    } catch (error) {
      console.error('ML prediction error:', error);
      setMlError(
        error instanceof Error
          ? error.message
          : 'Unable to run ML prediction'
      );
    } finally {
      setMlLoading(false);
    }
  };
  const loadRealClimate = async (city:string, state?:string) => {
    if(!city.trim()) return;
    setWeatherLoading(true);
    setWeatherStatus(`Fetching real climate data for ${city}...`);
    setWeatherSource('');
    

    try{
      const searchName = state ? `${city}, ${state}, India` : `${city}, India`;
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchName)}&count=1&language=en&format=json&countryCode=IN`;
      const geoResponse = await fetch(geoUrl);
      if(!geoResponse.ok) throw new Error('Location lookup failed.');
      const geo = await geoResponse.json();
      if(!geo.results?.length) throw new Error(`Could not find ${city}, India.`);
      const place = geo.results[0];

      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,shortwave_radiation&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,shortwave_radiation&forecast_days=2&timezone=auto`;
      const weatherResponse = await fetch(weatherUrl);
      if(!weatherResponse.ok) throw new Error('Weather data request failed.');
      const weather = await weatherResponse.json();
      const current = weather.current;
      if(!current) throw new Error('No current weather data returned.');

      const temperature = Number(current.temperature_2m);
const humidity = Number(current.relative_humidity_2m);
const wind = Number(current.wind_speed_10m);

const currentSolar = Math.max(
  0,
  Number(current.shortwave_radiation ?? 0)
);

const hourlyTemps = Array.isArray(weather.hourly?.temperature_2m)
  ? weather.hourly.temperature_2m.map(Number)
  : [];

const hourlySolar = Array.isArray(weather.hourly?.shortwave_radiation)
  ? weather.hourly.shortwave_radiation.map(Number)
  : [];

const times = Array.isArray(weather.hourly?.time)
  ? weather.hourly.time.map(String)
  : [];

const currentTime = String(current.time || '');

let startIndex = times.indexOf(currentTime);

if(startIndex < 0){
  const currentHour = currentTime.slice(0,13);
  startIndex = times.findIndex(t => t.slice(0,13) === currentHour);
}

if(startIndex < 0) startIndex = 0;

const next24Temps = hourlyTemps.slice(startIndex,startIndex + 24);
const next24Solar = hourlySolar.slice(startIndex,startIndex + 24);

setRealHourlyTemps(
  next24Temps.length === 24 ? next24Temps : []
);

setRealHourlySolar(
  next24Solar.length === 24 ? next24Solar : []
);

setCurrentSolarRadiation(currentSolar);

// Convert hourly irradiance (W/m²) into daily solar energy (kWh/m²/day).
// The thermal model multiplies this by roof area to obtain incident solar energy.
const realSolarEnergyPerM2 =
  next24Solar.length === 24
    ? next24Solar.reduce(
        (sum, v) => sum + Math.max(0, Number(v) || 0),
        0
      ) / 1000
    : null;

setRealDailySolarEnergy(realSolarEnergyPerM2);

      // The model uses today's actual peak weather, not the instantaneous reading.
      // This fixes the old behaviour where a night-time/current temperature was
      // displayed as the day's peak and fed into the thermal model.
      const todayTemps = hourlyTemps.slice(0,24).filter(Number.isFinite);
      const todaySolar = hourlySolar.slice(0,24).filter(Number.isFinite);
      const peakTemperature = todayTemps.length ? Math.max(...todayTemps) : temperature;
      const peakSolar = todaySolar.length ? Math.max(...todaySolar) : currentSolar;

      setCurrentTemperature(temperature);
      setCurrentSolarRadiation(currentSolar);

      const resolvedCity = place.name || city;
      const resolvedState = place.admin1 || state || '';
      const label = `${resolvedCity}, ${resolvedState}`.replace(/, $/,'');

      update({
        location:label,
        city:resolvedCity,
        state:resolvedState,
        outdoorTemp:Number(peakTemperature.toFixed(1)),
        humidity,
        wind,
        solar:Number(Math.max(0,peakSolar).toFixed(0)),
        climateType:classifyClimate(peakTemperature,humidity)
      });
      setWeatherSource(`Open-Meteo · ${label}`);
      setWeatherStatus(`✓ Live weather loaded · Current ${temperature.toFixed(1)}°C · Today's peak ${peakTemperature.toFixed(1)}°C · Peak solar ${peakSolar.toFixed(0)} W/m²`);
    }catch(error){
      console.error('Real climate loading error:',error);
      setWeatherStatus(error instanceof Error ? error.message : 'Unable to load real climate data.');
    }finally{
      setWeatherLoading(false);
    }
  };

  const applyPreset=async (p:any)=>{
    update({location:`${p.city}, ${p.state}`,city:p.city,state:p.state,climateType:p.type});
    await loadRealClimate(p.city,p.state);
  };

  const useCurrentLocation=()=>{
    setLocationStatus('Locating device and resolving city/state…');
    if(!navigator.geolocation){ setLocationStatus('Location unavailable. Choose a preset or enter a city manually.'); return; }
    navigator.geolocation.getCurrentPosition(async pos=>{
      const {latitude,longitude}=pos.coords;
      try{
        const r=await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
        const d=await r.json();
        const city=d.city||d.locality||d.principalSubdivision||'Detected area';
        const state=d.principalSubdivision||d.countrySubdivision||'State unavailable';
        const label=`${city}, ${state}`;
        update({location:label,city,state});
        setLocationStatus(`✓ Current location: ${label}`);
        await loadRealClimate(city,state);
      }catch{
        setLocationStatus('GPS received, but city/state lookup failed. Enter your city manually.');
      }
    },()=>setLocationStatus('Location permission denied. Enter city and state manually.'));
  };

  useEffect(()=>{
    void loadRealClimate('Jaisalmer','Rajasthan');
  },[]);

  const startDrag=(e:React.PointerEvent)=>{
    setDragging(true);
    dragRef.current={x:e.clientX,y:e.clientY,rx:rotation.x,ry:rotation.y};
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const moveDrag=(e:React.PointerEvent)=>{
    if(!dragging)return;
    setRotation({
      x:clamp(dragRef.current.rx-(e.clientY-dragRef.current.y)*.18,-25,18),
      y:dragRef.current.ry+(e.clientX-dragRef.current.x)*.30
    });
  };
  useEffect(()=>{const stop=()=>setDragging(false);window.addEventListener('pointerup',stop);return()=>window.removeEventListener('pointerup',stop)},[]);
  const rotateAuto=()=>setRotation({x:-9,y:rotation.y+360});

  const hourly=useMemo(()=>{
    if(realHourlyTemps.length===24) return realHourlyTemps;
    // Offline/manual fallback: generate a clearly labelled synthetic diurnal curve
    // around the entered daily peak. It is never mixed with the live-weather array.
    const arr:number[]=[];
    for(let h=0;h<24;h++){
      const daylight=Math.max(0,Math.sin(((h-6)/12)*Math.PI));
      const ambient=i.outdoorTemp-9+daylight*9;
      arr.push(Number(ambient.toFixed(1)));
    }
    return arr;
  },[realHourlyTemps,i.outdoorTemp]);

  const userHourly=hourly.map(t=>Number((t-user.reduction*.78).toFixed(1)));
  const aiHourly=hourly.map(t=>Number((t-ai.reduction*.78).toFixed(1)));

  const projectTitle=i.target==='human'?'Human shelter':'Livestock shelter';
  const inferredClimate=classifyClimate(i.outdoorTemp,i.humidity);

  useEffect(()=>{
    setMlPrediction(null);
    setMlError('');
  },[i]);

  return <div className="ag">
    <header className="topbar">
      <button className="brand" onClick={()=>setStep('project')}><span className="brandIcon"><Home size={21}/></span><span><b>AASHRAYA GANITH</b><small>Climate-adaptive shelter intelligence</small></span></button>
    </header>

    <main>
      <AnimatePresence mode="wait">
        {step==='project' && <motion.section className="projectPage" key="project" initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-14}}>
          <div className="hero">
            <div><div className="eyebrow"><Sparkles size={15}/> PASSIVE SHELTER DESIGN INTELLIGENCE</div>
              <h1>Turn climate data into a <em>better shelter.</em></h1>
              <p>Enter one complete project brief. The model predicts indoor temperature, solar thermal energy, heat flow over time, materials, cost and an AI-optimized shelter design.</p>
            </div>
          </div>

          <button className="projectWidget" onClick={()=>setDetailsOpen(true)}>
            <div className="widgetIcon"><SlidersHorizontal/></div>
            <div className="widgetMain"><div className="widgetTitle">Project details <span>OPEN INPUTS</span></div><p>People/animals, purpose, area, budget, location and design settings.</p>
              <div className="chips"><span>{projectTitle}</span><span>{i.occupants} {i.target==='human'?'people':i.livestock}</span><span>{i.area} m²</span><span>{i.city}, {i.state}</span><span className={materialsConfigured?"readyChip":"requiredChip"}>{materialsConfigured?"✓ Materials ready":"Materials required"}</span></div>
            </div><div className="widgetArrow"><ArrowRight/></div>
          </button>

          <button className={materialsConfigured?"requiredMaterialWidget ready":"requiredMaterialWidget"} onClick={()=>setMaterialsOpen(true)}>
            <span className="requiredMaterialIcon"><Factory/></span>
            <span><b>Material library · envelope profile <em>{materialsConfigured?"READY":"REQUIRED"}</em></b><small>Select wall, roof, insulation and floor materials before continuing. Built-in thermal properties are fed into the model.</small></span>
            <ArrowRight/>
          </button>
          <div className="optionalRow">
            <button className="optionalWidget" onClick={()=>setClimateOpen(true)}><span className="optionalIcon"><Thermometer/></span><span><b>Optional manual climate input</b><small>Override temperature, humidity, wind, solar radiation and analysis period with field measurements.</small></span><ChevronDown/></button>
            <button className="locationMini" onClick={useCurrentLocation}><LocateFixed size={18}/><span>Use Current Location</span></button>
          </div>
          {locationStatus&&<div className="statusNote"><MapPin size={15}/>{locationStatus}</div>}

        </motion.section>}

        {step==='climate' && <motion.section className="climatePage" key="climate" initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-14}}>
          <div className="pageTitle"><div className="eyebrow"><CloudSun size={15}/> STEP 02 · CLIMATE INPUT + PREDICTION</div><h2>Your climate profile</h2><p>Real weather conditions are fetched for the selected location and passed into the thermal intelligence pipeline.</p></div>
          <div className="climateGrid">
            <div className="climateHeroCard"><span><Sun size={17}/> {inferredClimate}</span><strong>{i.outdoorTemp}°<small>C</small></strong><b>Today's peak · {i.city}, {i.state}</b><small>{weatherSource || 'Current climate profile'}</small><small>Current now {currentTemperature.toFixed(1)}°C · peak solar {i.solar} W/m²</small><small>{realDailySolarEnergy != null ? `24-hour solar energy ${realDailySolarEnergy.toFixed(2)} kWh/m²` : 'Solar energy uses the configured peak-sun-hour estimate'}</small>{weatherLoading&&<small>Fetching live weather…</small>}{weatherStatus&&<small>{weatherStatus}</small>}</div>
            
            <div className="metric" key="solar">
              <Sun/>
              <span>Current solar radiation</span>
              <b>{currentSolarRadiation.toFixed(0)} W/m²</b>
              <div className="metricRows">
                <div className="metricRow"><small>Today's peak</small><b>{i.solar} W/m²</b></div>
                {realDailySolarEnergy != null && <div className="metricRow"><small>24h solar energy</small><b>{realDailySolarEnergy.toFixed(2)} kWh/m²</b></div>}
                <div className="metricRow"><small>Status</small><b>{currentSolarRadiation > 600 ? 'High' : currentSolarRadiation > 200 ? 'Moderate' : currentSolarRadiation > 20 ? 'Low' : 'Night'}</b></div>
              </div>
            </div>
            
            <div className="metric" key="humidity">
              <Droplets/>
              <span>Humidity</span>
              <b>{i.humidity}%</b>
              <div className="metricRows">
                <div className="metricRow"><small>Comfort</small><b>{i.humidity < 40 ? 'Dry' : i.humidity <= 60 ? 'Comfortable' : i.humidity <= 75 ? 'Humid' : 'Very humid'}</b></div>
                <div className="metricRow"><small>Climate impact</small><small style={{fontSize:'9px',color:'var(--dim)',fontWeight:'normal'}}>Higher humidity reduces evaporative cooling</small></div>
              </div>
            </div>
            
            <div className="metric" key="wind">
              <Wind/>
              <span>Wind speed</span>
              <b>{i.wind} km/h</b>
              <div className="metricRows">
                <div className="metricRow"><small>Airflow class</small><b>{i.wind < 1 ? 'Calm' : i.wind <= 5 ? 'Light' : i.wind <= 15 ? 'Moderate' : 'Strong'}</b></div>
                <div className="metricRow"><small>Design relevance</small><small style={{fontSize:'9px',color:'var(--dim)',fontWeight:'normal'}}>{i.wind < 5 ? 'Limited natural ventilation potential' : 'Useful for natural ventilation'}</small></div>
              </div>
            </div>
            
            <div className="metric" key="period">
              <Clock3/>
              <span>Analysis period</span>
              <b>{i.analysisHours} h</b>
              <div className="metricRows">
                <div className="metricRow"><small>Thermal forecast</small><b>24 hourly points</b></div>
                <div className="metricRow"><small>Solar integration</small><small style={{fontSize:'9px',color:'var(--dim)',fontWeight:'normal'}}>{realDailySolarEnergy != null ? '24h irradiance profile' : 'Peak-sun-hour estimate'}</small></div>
                <div className="metricRow"><small>Model basis</small><small style={{fontSize:'9px',color:'var(--dim)',fontWeight:'normal'}}>Live weather + inputs</small></div>
              </div>
            </div>
          </div>

          <div className="climateLower">
            <div className="chartCard"><div className="cardHead"><div><b>24-hour thermal prediction</b><small>{realHourlyTemps.length===24?'Live next-24-hour ambient data vs predicted shelter temperature':'Estimated 24-hour ambient profile vs predicted shelter temperature'}</small></div><span>Next 24h peak {Math.max(...hourly)}°C</span></div>
              <TemperatureChart ambient={hourly} user={userHourly} ai={aiHourly} selectedHour={selectedHour} onHourChange={setSelectedHour}/>
            </div>
            <div className="meaningCard"><div className="cardHead"><div><b>Design implications</b><small>What the climate model is telling the designer</small></div><Sparkles/></div>
              <div className="meaning"><div><span>01</span><b>Control solar gain</b><small>Prioritize reflective roofing, roof cavity and deep shade during peak radiation.</small></div><div><span>02</span><b>Release stored heat</b><small>Use cross ventilation and a high-level outlet to remove rising warm air.</small></div><div><span>03</span><b>Protect the occupied zone</b><small>Use thermal mass and an insulated envelope to slow heat transfer.</small></div></div>
            </div>
          </div>
          
          <div className="climateActionSection">
            <button
              className="primaryBtn"
              onClick={async () => {
                if (!mlPrediction) {
                  await runMLPrediction();
                }
                setStep('studio');
              }}
              disabled={mlLoading || weatherLoading}
            >
              Open design + results <ArrowRight/>
            </button>
            <div className="actionSubtext">XGBoost runs automatically when you open the design results if not already computed.</div>
          </div>
        </motion.section>}
        {step==='studio' && <motion.section className="studioPage" key="studio" initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-14}}>
          <div className="studioHeader"><div><div className="eyebrow"><Building2 size={15}/> STEP 03 · MODEL OUTPUT</div><h2>Design + thermal results</h2><p>Compare two design strategies through their thermal performance, solar response and heat-flow signature, then inspect the three PS outputs in one dashboard.</p></div><div className="headerActions"><button className="editBrief" onClick={()=>setDetailsOpen(true)}><Settings2/> Edit project</button><button className="materialBrief" onClick={()=>setMaterialsOpen(true)}><Factory/> Materials</button></div></div>

          <div className="climateStrip">
            {[
              [<Thermometer/>,'Ambient peak',`${i.outdoorTemp}°C`],
              [<Sun/>,'Peak solar radiation',`${i.solar} W/m²`],
              [<Wind/>,'Wind',`${i.wind} km/h`],
              [<Droplets/>,'Humidity',`${i.humidity}%`],
              [<Gauge/>,'Heat risk',i.outdoorTemp>38?'EXTREME':i.outdoorTemp>32?'HIGH':'MODERATE']
            ].map(([icon,label,val])=><div key={label as string}><span>{icon}</span><small>{label}</small><b>{val}</b></div>)}
          </div>

          <div className="cadEmbedSection">
            <div className="cadEmbedIntro">
              <div><span className="eyebrow"><Building2 size={14}/> DESIGN INTELLIGENCE · PARAMETRIC CAD</span><h3>Interactive shelter model</h3><p>The geometry is generated from the project inputs. Rotate it, inspect individual building components, and switch between thermal, solar, heat-flow and airflow overlays.</p></div>
              <div className="cadEmbedBadge"><b>THERMAL GAP</b><strong>{Math.max(0,ai.score-user.score)}</strong><span>AI score advantage</span></div>
            </div>
            <ShelterCADViewer
              design={{
                length: Math.sqrt(i.area * 1.5), width: Math.sqrt(i.area / 1.5), wallHeight: 3, wallThickness: i.wall/100,
                roofPitch: i.roofPitch, overhang: i.shade, windows: Math.max(0, Math.round(i.area/8)),
                windowWidth: 1.1, windowHeight: 1.2, shadeDepth: i.shade, ventilation: i.ventilation, orientation: 0,
                wallMaterial: i.wallMaterial, roofMaterial: i.roofMaterial, insulationMaterial: i.insulationMaterial, floorMaterial: i.floorMaterial
              } as CADShelterDesign}
              aiDesign={{
                length: Math.sqrt(Math.max(i.area, 8) * 1.5), width: Math.sqrt(Math.max(i.area, 8) / 1.5), wallHeight: 3.1, wallThickness: ai.wall/100,
                roofPitch: ai.pitch, overhang: Math.max(i.shade, .9), windows: Math.max(4, Math.round(i.area/7)),
                windowWidth: 1.1, windowHeight: 1.2, shadeDepth: ai.shade, ventilation: ai.vent, orientation: 0,
                wallMaterial: i.wallMaterial, roofMaterial: i.roofMaterial, insulationMaterial: i.insulationMaterial, floorMaterial: i.floorMaterial
              } as CADShelterDesign}
              simulation={{
                outdoorTemp: i.outdoorTemp, indoorTemp: user.peak, solarRadiation: i.solar, solarEnergy: user.absorbedSolar,
                roofHeatFlow: user.qRoof, wallHeatFlow: user.qWalls, openingHeatFlow: user.qOpenings, windSpeed: i.wind, humidity: i.humidity,
                analysisHours: i.analysisHours, peakSunHours: i.peakSunHours, thermalScore: user.score
              } as CADShelterSimulation}
              climate={{outdoorTemp:i.outdoorTemp, windSpeed:i.wind, humidity:i.humidity, solarRadiation:i.solar, analysisHours:i.analysisHours, peakSunHours:i.peakSunHours}}
              selectedHour={selectedHour}
              onHourChange={setSelectedHour}
            />
          </div>

          <div className="psDashboard">
            <div className="psHeader"><div><span>CORE PS OUTPUTS</span><h3>Thermal response, solar energy & heat flow</h3></div><div className="psBadge"><Check size={14}/> All three required outputs shown</div></div>
            <div className="psGrid">
              <section className="psCard tempCard"><div className="psCardHead"><span className="psIcon"><Thermometer/></span><div><b>01 · Shelter inside temperature</b><small>Comparison of user model and AI-generated model</small></div><em className="modelSource compareSource">BOTH MODELS</em></div>
                <div className="tempCompare"><div><span>Ambient peak</span><strong>{i.outdoorTemp.toFixed(1)}°C</strong></div><div><span>User model</span><strong>{user.peak.toFixed(1)}°C</strong><em>-{user.reduction.toFixed(1)}°C</em></div><div className="best"><span>AI-generated model</span><strong>{ai.peak.toFixed(1)}°C</strong><em>-{ai.reduction.toFixed(1)}°C</em></div></div>
                <TemperatureChart ambient={hourly} user={userHourly} ai={aiHourly} compact selectedHour={selectedHour} onHourChange={setSelectedHour}/>
              </section>

              <section className="psCard solarCard"><div className="psCardHead"><span className="psIcon sun"><Sun/></span><div><b>02 · Solar thermal energy</b><small>AI-generated model output · {i.peakSunHours} peak-sun hours</small></div><em className="modelSource">AI MODEL</em></div>
                <div className="bigNumber">{ai.absorbedSolar}<span> kWh/day</span></div>
                <div className="barMetric"><span>Incident solar energy</span><b>{ai.solarIncident} kWh</b><div><i style={{width:'100%'}}/></div></div>
                <div className="barMetric"><span>Estimated absorbed heat gain</span><b>{ai.absorbedSolar} kWh</b><div><i style={{width:`${Math.min(100,ai.absorbedSolar/Math.max(1,ai.solarIncident)*100)}%`}}/></div></div>
                <div className="solarNote"><Sun size={15}/> Roof area {ai.roofArea.toFixed(1)} m² · efficiency input {i.solarEfficiency}% · passive shading included</div>
                <div className="userModelOutput"><div><b>USER MODEL OUTPUT</b><small>Before AI optimization</small></div><strong>{user.absorbedSolar.toFixed(1)} <span>kWh/day</span></strong><p>Incident {user.solarIncident.toFixed(1)} kWh · absorbed heat gain from the user-defined design</p></div>
              </section>

              <section className="psCard heatCard"><div className="psCardHead"><span className="psIcon heat"><Flame/></span><div><b>03 · Heat flow details</b><small>AI-generated model output · ΔT-driven for {i.analysisHours} hours</small></div><em className="modelSource aiSource">AI MODEL</em></div>
                <div className="deltaBox"><span>Ambient − AI indoor</span><strong>{ai.delta.toFixed(1)}°C</strong><small>Temperature difference driving heat transfer</small></div>
                <HeatFlowBars user={user} ai={ai}/>
                <div className="heatTotal"><span>AI total heat transfer</span><strong>{ai.totalHeatFlow.toFixed(2)} kW</strong><em>{ai.periodHeat.toFixed(1)} kWh / period</em></div>
                <div className="userModelOutput"><div><b>USER MODEL OUTPUT</b><small>Before AI optimization</small></div><strong>{user.totalHeatFlow.toFixed(2)} <span>kW total</span></strong><p>Roof {user.qRoof.toFixed(2)} · walls {user.qWalls.toFixed(2)} · openings {user.qOpenings.toFixed(2)} kW</p></div>
              </section>
            </div>
          </div>

          <div className="modeBar">
  <div>
    <b>Interactive visual analysis</b>
    <small>
      Explore the model as structure, thermal response, solar response,
      heat flow and airflow
    </small>
  </div>

  <div className="modeTabs">
    {([
      ['structure','3D structure',Layers3],
      ['thermal','Thermal response',Thermometer],
      ['solar','Solar response',Sun],
      ['heatflow','Heat flow',Flame],
      ['airflow','Airflow',Wind]
    ] as const).map(([m,l,Icon]) => (
      <button
        className={mode===m ? 'active' : ''}
        onClick={() => setMode(m)}
        key={m}
      >
        <Icon size={17}/>
        {l}
      </button>
    ))}
  </div>
</div>

<div className="analysisStage">
  <AnalysisVisual
    mode={mode}
    input={i}
    user={user}
    ai={ai}
    hourly={hourly}
    realDailySolarEnergy={realDailySolarEnergy}
    selectedHour={selectedHour}
    onHourChange={setSelectedHour}
  />

  <AnalysisSide
    input={i}
    user={user}
    ai={ai}
    mlPrediction={mlPrediction}
    mlLoading={mlLoading}
    mlError={mlError}
  />
</div>

<div className="resultsGrid resultsGridLarge"> 
            <ResultPanel title="Recommended materials" icon={<Factory/>} items={[
              ['Roof','Reflective outer skin + insulation'],['Walls','High thermal-mass wall system'],['Shading','Deep eaves / external shade'],['Ventilation','Low inlet + high ridge outlet']
            ]}/>
            <ResultPanel title="Design + cost" icon={<CircleDollarSign/>} items={[
              ['Recommended footprint',`${Math.max(i.area,i.target==='human'?i.occupants*6:i.occupants*5).toFixed(0)} m²`],['Your design',money(userCost.total)],['AI optimized',money(aiCost.total)],['Budget remaining',money(Math.max(0,i.budget-aiCost.total))]
            ]}/>
            <ResultPanel title="Why AI changed it" icon={<Sparkles/>} items={[
              ['Roof pitch',`${ai.pitch}° for solar response`],['Shade',`${ai.shade.toFixed(1)} m protected edge`],['Ventilation',`${ai.vent}% opening strategy`],['Thermal gain',`${(user.absorbedSolar-ai.absorbedSolar).toFixed(1)} kWh lower estimate`]
            ]}/>
          </div>
          <div className="disclaimer"><Info size={15}/> Preliminary software-model decision support. Values are estimates for the prototype and require engineering/material validation before construction.</div>
        </motion.section>}
      </AnimatePresence>
    </main>

    <footer><span>CREATED BY BLUE STARS</span></footer>

    <AnimatePresence>{detailsOpen&&<ProjectModal input={i} update={update} onClose={()=>setDetailsOpen(false)} onOpenMaterials={()=>setMaterialsOpen(true)} onUseLocation={useCurrentLocation} locationStatus={locationStatus} onContinue={async()=>{if(!materialsConfigured)return; const raw=i.location.trim(); const parts=raw.split(',').map(x=>x.trim()).filter(Boolean); const city=parts[0]||i.city; const state=parts.slice(1).join(', ')||i.state; setDetailsOpen(false); setStep('climate'); if(city) await loadRealClimate(city,state);}} canContinue={materialsConfigured}
onSelectCity={(city,state)=>loadRealClimate(city,state)}
/>}</AnimatePresence>
    <AnimatePresence>{materialsOpen&&<MaterialsModal input={i} update={update} onClose={()=>setMaterialsOpen(false)} onSave={()=>setMaterialsConfigured(true)}/>}</AnimatePresence>
    <AnimatePresence>{climateOpen&&<ClimateModal input={i} update={update} onClose={()=>setClimateOpen(false)} onApply={()=>{setRealHourlyTemps([]);setRealHourlySolar([]);setRealDailySolarEnergy(null);setCurrentTemperature(i.outdoorTemp);setCurrentSolarRadiation(i.solar);setClimateOpen(false);setWeatherSource('Manual field measurements');setWeatherStatus('✓ Manual climate profile applied. Live weather is paused until a location is loaded again.');setLocationStatus('✓ Manual climate profile applied to the model.')}}/>}</AnimatePresence>
  </div>
}

function TemperatureChart({ambient,user,ai,compact=false,selectedHour=12,onHourChange}:{ambient:number[];user:number[];ai:number[];compact?:boolean;selectedHour?:number;onHourChange?:(h:number)=>void}){
  const W=720,H=compact?205:270,pad=compact?22:28;
  const min=Math.floor(Math.min(...ambient,...user,...ai)-2),max=Math.ceil(Math.max(...ambient,...user,...ai)+2);
  const px=(k:number)=>pad+k*(W-pad*2)/23;
  const py=(v:number)=>H-pad-(v-min)/(max-min)*(H-pad*2);
  const points=(a:number[])=>a.map((v,k)=>`${px(k)},${py(v)}`).join(' ');
  const hour=Math.max(0,Math.min(23,selectedHour));
  const detail=`${String(hour).padStart(2,'0')}:00 · Ambient ${ambient[hour].toFixed(1)}°C · Your ${user[hour].toFixed(1)}°C · AI ${ai[hour].toFixed(1)}°C`;
  return <div className={compact?'chart compactChart':'chart'}>
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" onClick={(e)=>{ if(!onHourChange)return; const r=e.currentTarget.getBoundingClientRect(); const local=(e.clientX-r.left)/r.width; onHourChange(Math.max(0,Math.min(23,Math.round(local*23)))) }} role="img" aria-label="Interactive 24 hour temperature chart">
      <defs><linearGradient id={compact?'ambientFillCompact':'ambientFill'} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#ff735f" stopOpacity=".18"/><stop offset="1" stopColor="#ff735f" stopOpacity="0"/></linearGradient></defs>
      <path d={`M${pad},${H-pad} L${points(ambient).split(' ')[0]} ${points(ambient).split(' ').slice(1).map(p=>`L${p}`).join(' ')} L${W-pad},${H-pad} Z`} fill={`url(#${compact?'ambientFillCompact':'ambientFill'})`}/>
      <polyline points={points(ambient)} fill="none" stroke="#ff735f" strokeWidth="3"/>
      <polyline points={points(user)} fill="none" stroke="#f4c95c" strokeWidth="3"/>
      <polyline points={points(ai)} fill="none" stroke="#59dfca" strokeWidth="4"/>
      {[0,6,12,18,23].map(k=><line key={k} x1={px(k)} y1={pad} x2={px(k)} y2={H-pad} stroke="rgba(108,222,201,.08)"/>)}
      <line x1={px(hour)} x2={px(hour)} y1={pad} y2={H-pad} stroke="#9fe7db" strokeWidth="1.5" strokeDasharray="5 5"/>
      <circle cx={px(hour)} cy={py(ambient[hour])} r="4" fill="#ff735f"/><circle cx={px(hour)} cy={py(user[hour])} r="4" fill="#f4c95c"/><circle cx={px(hour)} cy={py(ai[hour])} r="5" fill="#59dfca"/>
    </svg>
    <div className="chartSelection">Selected <b>{detail}</b></div>
    <div className="chartLegend"><span><i className="ambient"/>Ambient</span><span><i className="userLine"/>Your design</span><span><i className="aiLine"/>AI design</span><span>00:00 · 06:00 · 12:00 · 18:00 · 24:00</span></div>
  </div>
}
function ThermalResponseChart({
  input,
  user,
  ai,
  hourly,
  selectedHour = 12,
  onHourChange
}: {
  input: Inputs;
  user: any;
  ai: any;
  hourly: number[];
  selectedHour?: number;
  onHourChange?: (h: number) => void;
}) {
  const W = 980;
  const H = 430;
  const left = 72;
  const right = 26;
  const top = 34;
  const bottom = 58;

  const ambient = Array.from(
    { length: 24 },
    (_, h) => hourly[h] ?? input.outdoorTemp
  );

  const series = [
    ambient,
    ambient.map(t => Number((t - user.reduction * 0.78).toFixed(1))),
    ambient.map(t => Number((t - ai.reduction * 0.78).toFixed(1)))
  ];

  const all = series.flat();

  const min = Math.floor(Math.min(...all) - 2);
  const max = Math.ceil(Math.max(...all) + 2);

  const x = (k: number) =>
    left + k * (W - left - right) / 23;

  const y = (v: number) =>
    top + (max - v) * (H - top - bottom) / (max - min);

  const pts = (arr: number[]) =>
    arr.map((v, k) => `${x(k)},${y(v)}`).join(' ');

  const ticks = [
    min,
    min + Math.ceil((max - min) / 3),
    min + Math.ceil(2 * (max - min) / 3),
    max
  ];

  const safeHour = Math.max(
    0,
    Math.min(23, selectedHour)
  );

  return (
    <div className="thermalChartWrap">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="thermalResponseSvg"
        role="img"
        aria-label="24 hour ambient and predicted indoor temperature chart"
      >
        <defs>
          <linearGradient
            id="thermalAmbientFill"
            x1="0"
            x2="0"
            y1="0"
            y2="1"
          >
            <stop
              offset="0"
              stopColor="#ff735f"
              stopOpacity=".18"
            />
            <stop
              offset="1"
              stopColor="#ff735f"
              stopOpacity="0"
            />
          </linearGradient>

          <linearGradient
            id="thermalAiFill"
            x1="0"
            x2="0"
            y1="0"
            y2="1"
          >
            <stop
              offset="0"
              stopColor="#59dfca"
              stopOpacity=".12"
            />
            <stop
              offset="1"
              stopColor="#59dfca"
              stopOpacity="0"
            />
          </linearGradient>
        </defs>

        {ticks.map(t => (
          <g key={t}>
            <line
              x1={left}
              x2={W - right}
              y1={y(t)}
              y2={y(t)}
              stroke="rgba(108,222,201,.10)"
            />
            <text
              x={left - 12}
              y={y(t) + 4}
              textAnchor="end"
              fill="#66837b"
              fontSize="12"
            >
              {t}°
            </text>
          </g>
        ))}

        {[0, 6, 12, 18, 23].map(k => (
          <g key={k}>
            <line
              x1={x(k)}
              x2={x(k)}
              y1={top}
              y2={H - bottom}
              stroke="rgba(108,222,201,.06)"
            />
            <text
              x={x(k)}
              y={H - 28}
              textAnchor="middle"
              fill="#66837b"
              fontSize="11"
            >
              {String(k).padStart(2, '0')}:00
            </text>
          </g>
        ))}

        <path
          d={`M${x(0)},${H - bottom} L${pts(ambient).replace(/ /g, ' L')} L${x(23)},${H - bottom} Z`}
          fill="url(#thermalAmbientFill)"
        />

        <path
          d={`M${x(0)},${H - bottom} L${pts(series[2]).replace(/ /g, ' L')} L${x(23)},${H - bottom} Z`}
          fill="url(#thermalAiFill)"
        />

        <polyline
          points={pts(ambient)}
          fill="none"
          stroke="#ff735f"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <polyline
          points={pts(series[1])}
          fill="none"
          stroke="#f4c95c"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <polyline
          points={pts(series[2])}
          fill="none"
          stroke="#59dfca"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {series.map((arr, si) =>
          arr.map((v, k) => (
            <circle
              key={`${si}-${k}`}
              cx={x(k)}
              cy={y(v)}
              r={k === 11 || k === 12 || k === 13 ? 4 : 2.3}
              fill={
                ['#ff735f', '#f4c95c', '#59dfca'][si]
              }
              opacity={
                k === 11 || k === 12 || k === 13
                  ? 1
                  : .72
              }
            />
          ))
        )}

        <line
          x1={left}
          x2={W - right}
          y1={y(input.outdoorTemp)}
          y2={y(input.outdoorTemp)}
          stroke="rgba(255,115,95,.45)"
          strokeDasharray="7 7"
        />

        <text
          x={W - right - 4}
          y={y(input.outdoorTemp) - 9}
          textAnchor="end"
          fill="#ff9a88"
          fontSize="11"
        >
          ambient peak {input.outdoorTemp}°C
        </text>

        <line
          x1={x(safeHour)}
          x2={x(safeHour)}
          y1={top}
          y2={H - bottom}
          stroke="#b7eee5"
          strokeWidth="1.5"
          strokeDasharray="6 6"
        />

        {series.map((arr, si) => (
          <circle
            key={`selected-${si}`}
            cx={x(safeHour)}
            cy={y(arr[safeHour])}
            r={si === 2 ? 6 : 5}
            fill={
              ['#ff735f', '#f4c95c', '#59dfca'][si]
            }
          />
        ))}

        <rect
          x={left}
          y={top}
          width={W - left - right}
          height={H - top - bottom}
          fill="transparent"
          onClick={e => {
            if (!onHourChange) return;

            const r =
              e.currentTarget.getBoundingClientRect();

            const local =
              (e.clientX - r.left) / r.width;

            onHourChange(
              Math.max(
                0,
                Math.min(
                  23,
                  Math.round(local * 23)
                )
              )
            );
          }}
        />

        <text
          x={x(safeHour) + 10}
          y={y(series[2][safeHour]) - 13}
          fill="#78e8d6"
          fontSize="12"
          fontWeight="700"
        >
          {String(safeHour).padStart(2, '0')}:00 · AI{' '}
          {series[2][safeHour].toFixed(1)}°C
        </text>
      </svg>

      <div className="thermalAxisTitle">
        Time of day
      </div>
    </div>
  );
}
function HeatFlowBars({user,ai}:{user:any;ai:any}){
  const rows=[['Roof',user.qRoof,ai.qRoof],['Walls',user.qWalls,ai.qWalls],['Openings',user.qOpenings,ai.qOpenings]];
  const max=Math.max(...rows.map(r=>Math.max(Number(r[1]),Number(r[2]))),.1);
  return <div className="heatBars">{rows.map(([name,u,a])=><div className="heatRow" key={name as string}><span>{name}</span><div><i className="u" style={{width:`${Number(u)/max*100}%`}}/><i className="a" style={{width:`${Number(a)/max*100}%`}}/></div><b>{Number(a).toFixed(2)} kW</b></div>)}</div>
}

function AnalysisSide({input,user,ai,mlPrediction,mlLoading,mlError}:{input:Inputs;user:any;ai:any;mlPrediction:{indoor_temperature:number;indoor_humidity:number}|null;mlLoading:boolean;mlError:string}){
  return <div className="analysisSide">
    <div className="analysisLegend"><span><i className="cool"/>AI / protected</span><span><i className="warm"/>Moderate</span><span><i className="hot"/>Heat load</span></div>
    <div className="analysisStat"><Thermometer/><div><b>Peak indoor temperature</b><strong>{input.outdoorTemp}°C → {ai.peak.toFixed(1)}°C</strong><small>AI reduction {ai.reduction.toFixed(1)}°C from the ambient peak.</small></div></div>
    <div className="analysisStat"><Sun/><div><b>Solar thermal energy</b><strong>{ai.absorbedSolar.toFixed(1)} kWh/day</strong><small>Estimated absorbed heat after passive roof/shading protection.</small></div></div>
    <div className="analysisStat"><Flame/><div><b>Heat flow</b><strong>{ai.totalHeatFlow.toFixed(2)} kW</strong><small>{ai.periodHeat.toFixed(1)} kWh transferred during the selected period.</small></div></div>
    <div className="analysisStat"><Fan/><div><b>Air exchange index</b><strong>{user.air} → {ai.air}</strong><small>High-level outlet and cross-ventilation strategy.</small></div></div>
    <div className="analysisStat"><ShieldCheck/><div><b>Thermal score</b><strong>{user.score}/100 → {ai.score}/100</strong><small>Prototype comparison score, not a certification.</small></div></div>
        <div className="analysisStat">
      <Activity/>
      <div>
        <b>Real XGBoost prediction</b>
        {mlLoading ? (
          <strong>Running ML…</strong>
        ) : mlPrediction ? (
          <>
            <strong>
              {mlPrediction.indoor_temperature.toFixed(1)}°C · {mlPrediction.indoor_humidity.toFixed(1)}%
            </strong>
            <small>
              Trained thermal + humidity models · XGBoost
            </small>
          </>
        ) : mlError ? (
          <>
            <strong>Prediction failed</strong>
            <small>{mlError}</small>
          </>
        ) : (
          <>
            <strong>Not yet evaluated</strong>
            <small>
              Run the trained ML inference model for this design.
            </small>
          </>
        )}
      </div>
    </div>
  </div>
}

function PerformanceCard({title,result,input,ai}:{title:string;result:any;input:Inputs;ai:boolean}){
  const delta=input.outdoorTemp-result.peak;
  const protection=Math.min(100,Math.round(result.solarProtection*100)+28+(ai?8:0));
  const airflow=Math.min(100,Math.round(result.air/1.55));
  const heatControl=Math.min(100,Math.round(100-result.totalHeatFlow*42));
  const points=[
    ['Indoor temperature',`${result.peak.toFixed(1)}°C`,`${delta.toFixed(1)}°C below ambient`,Thermometer],
    ['Solar thermal energy',`${result.absorbedSolar.toFixed(1)} kWh/day`,'estimated absorbed heat',Sun],
    ['Heat flow',`${result.totalHeatFlow.toFixed(2)} kW`,`${result.periodHeat.toFixed(1)} kWh / period`,Flame]
  ] as const;
  return <motion.article className={ai?'perfCard perfCardAI':'perfCard'} whileHover={{y:-3}}>
    <div className="perfCardHead"><div><b>{title}</b><small>{ai?'Optimized for thermal comfort, solar control + airflow':'Calculated directly from your entered dimensions'}</small></div><span>{ai?'AI OPTIMIZED':'USER DEFINED'}</span></div>
    <div className="perfCanvas">
      <div className="perfGrid"></div>
      <motion.div className="energyRing ringOuter" animate={{rotate:360}} transition={{duration:16,repeat:Infinity,ease:'linear'}}/>
      <motion.div className="energyRing ringInner" animate={{rotate:-360}} transition={{duration:11,repeat:Infinity,ease:'linear'}}/>
      <div className="scoreCore"><span>{ai?'AI THERMAL INDEX':'CURRENT DESIGN'}</span><strong>{result.score}</strong><em>/100</em><small>{result.peak.toFixed(1)}°C indoor peak</small></div>
      <div className="flowPill flowTop"><Thermometer/><span>AMBIENT</span><b>{input.outdoorTemp}°C</b></div>
      <div className="flowPill flowLeft"><Sun/><span>SOLAR INPUT</span><b>{input.solar} W/m²</b></div>
      <div className="flowPill flowRight"><Flame/><span>HEAT FLOW</span><b>{result.totalHeatFlow.toFixed(2)} kW</b></div>
      <div className="flowPill flowBottom"><Wind/><span>AIR MOVEMENT</span><b>{result.air}/100</b></div>
      <motion.div className="energyBeam beamA" animate={{opacity:[.25,.8,.25],scaleX:[.85,1,.85]}} transition={{duration:2.4,repeat:Infinity}}/>
      <motion.div className="energyBeam beamB" animate={{opacity:[.15,.7,.15],scaleX:[1,.8,1]}} transition={{duration:2.8,repeat:Infinity}}/>
    </div>
    <div className="perfMetricRow">{points.map(([label,val,sub,Icon])=><div key={label}><Icon/><span>{label}</span><b>{val}</b><small>{sub}</small></div>)}</div>
    <div className="perfSignalGrid">
      <Signal label="Thermal comfort" value={result.score}/>
      <Signal label="Solar protection" value={protection}/>
      <Signal label="Air movement" value={airflow}/>
      <Signal label="Heat-flow control" value={heatControl}/>
    </div>
    <div className="perfRecipe">
      <div><b>{ai?'AI design logic':'Current design logic'}</b><small>Material + geometry decisions affecting the result</small></div>
      <div className="recipePills"><span>Roof · {ai?'reflective double-skin':'single-skin'}</span><span>Wall · {result.wall} cm</span><span>Shade · {result.shade.toFixed(1)} m</span><span>Vent · {result.vent}%</span></div>
    </div>
  </motion.article>
}

function Signal({label,value}:{label:string;value:number}){
  return <div className="signal"><div><span>{label}</span><b>{Math.round(value)}/100</b></div><i><em style={{width:`${Math.max(0,Math.min(100,value))}%`}}/></i></div>
}

function AnalysisVisual({mode,input,user,ai,hourly,realDailySolarEnergy,selectedHour=12,onHourChange}:{mode:Mode;input:Inputs;user:any;ai:any;hourly:number[];realDailySolarEnergy:number | null;selectedHour?:number;onHourChange?:(h:number)=>void}){
  if(mode==='structure') return <div className="analysisCanvas energyBalanceCanvas"><div className="scanLabel"><Activity/> CLIMATE → ENVELOPE → OCCUPIED ZONE</div><div className="structureModelCompare"><div className="structureModelCard"><b>USER MODEL</b><span>Current design</span><strong>{user.peak.toFixed(1)}°C</strong><small>Indoor peak · {user.totalHeatFlow.toFixed(2)} kW heat flow · {user.air}/100 air</small></div><div className="structureModelCard structureAiCard"><b>AI-GENERATED MODEL</b><span>Optimized design</span><strong>{ai.peak.toFixed(1)}°C</strong><small>Indoor peak · {ai.totalHeatFlow.toFixed(2)} kW heat flow · {ai.air}/100 air</small></div></div><div className="energyBalance"><div className="balanceSource sourceSun"><Sun/><b>{input.solar} W/m²</b><small>peak solar input</small></div><div className="balanceSource sourceAir"><Wind/><b>{input.wind} km/h</b><small>ambient airflow</small></div><div className="balanceCore"><span>AI SHELTER STATE</span><strong>{ai.peak.toFixed(1)}°C</strong><small>indoor peak</small><div className="coreScore">{ai.score}/100 thermal score</div></div><div className="balanceNode nodeRoof"><span>ROOF</span><b>{ai.qRoof.toFixed(2)} kW</b><small>heat transfer</small></div><div className="balanceNode nodeWall"><span>WALLS</span><b>{ai.qWalls.toFixed(2)} kW</b><small>heat transfer</small></div><div className="balanceNode nodeOpen"><span>OPENINGS</span><b>{ai.qOpenings.toFixed(2)} kW</b><small>heat transfer</small></div><div className="balanceNode nodeOut"><span>TOTAL</span><b>{ai.totalHeatFlow.toFixed(2)} kW</b><small>{ai.periodHeat.toFixed(1)} kWh / {input.analysisHours} h</small></div><motion.div className="energyPath path1" animate={{scaleX:[.8,1,.8],opacity:[.35,.9,.35]}} transition={{duration:2,repeat:Infinity}}/><motion.div className="energyPath path2" animate={{scaleX:[1,.75,1],opacity:[.2,.7,.2]}} transition={{duration:2.5,repeat:Infinity}}/><motion.div className="energyPath path3" animate={{scaleX:[.7,1,.7],opacity:[.25,.85,.25]}} transition={{duration:2.2,repeat:Infinity}}/></div><div className="balanceFooter"><span><i className="dotSolar"/>Solar gain</span><span><i className="dotHeat"/>Heat transfer</span><span><i className="dotCool"/>Protected indoor zone</span><b>PS output: heat flow = ΔT × envelope response</b></div></div>;
  if(mode==='thermal') return <div className="analysisCanvas thermalFieldCanvas">
    <div className="scanLabel"><Thermometer/> INDOOR TEMPERATURE RESPONSE · 24 HOURS</div>
    <div className="thermalChartVisual">
      <div className="thermalChartHeader">
        <div><b>Temperature response over time</b><small>Ambient conditions compared with predicted indoor temperature for both designs.</small></div>
        <div className="thermalPeakBadge"><span>Peak indoor</span><b>{ai.peak.toFixed(1)}°C</b><small>AI design</small></div>
      </div>
      <ThermalResponseChart
  input={input}
  user={user}
  ai={ai}
  hourly={hourly}
  selectedHour={selectedHour}
  onHourChange={onHourChange}
/>
      <div className="thermalInsightRow">
        <div><span className="legendDot ambientDot"/>Ambient <b>{input.outdoorTemp.toFixed(1)}°C peak</b></div>
        <div><span className="legendDot userDot"/>Your design <b>{user.peak.toFixed(1)}°C peak</b></div>
        <div><span className="legendDot aiDot"/>AI design <b>{ai.peak.toFixed(1)}°C peak</b></div>
        <div className="thermalDelta"><Thermometer/> AI keeps the occupied zone <b>{ai.reduction.toFixed(1)}°C</b> below the ambient peak.</div>
      </div>
    </div>
  </div>;
  if(mode==='solar') return <div className="analysisCanvas solarAnalysisCanvas">
    <div className="scanLabel"><Sun/> SOLAR EXPOSURE & ABSORBED HEAT</div><em className="analysisSource modelSource aiSource">AI MODEL OUTPUT</em>
    <div className="solarAnalysisGrid">
      <div className="sunDiagram"><div className="sunOrb"><Sun size={46}/><b>{input.solar} W/m²</b><small>incident radiation</small></div><div className="sunRay ray1"/><div className="sunRay ray2"/><div className="sunRay ray3"/><div className="roofTarget"><span>ROOF SURFACE</span><b>{ai.roofArea.toFixed(1)} m²</b><small>pitch {ai.pitch}° · shade {ai.shade.toFixed(1)} m</small></div></div>
      <div className="solarFacts"><div><span>Incident solar energy</span><b>{ai.solarIncident.toFixed(1)} kWh</b><small>{realDailySolarEnergy != null ? 'Integrated from the live 24-hour irradiance profile' : `${input.peakSunHours} peak-sun hours × roof exposure`}</small></div><div><span>Estimated absorbed heat</span><b>{ai.absorbedSolar.toFixed(1)} kWh/day</b><small>after surface absorptance and passive shading</small></div><div><span>Solar protection factor</span><b>{Math.round(ai.solarProtection*100)}%</b><small>combined shading + insulation response</small></div><div className="solarReason"><b>Why it changes</b><p>Roof pitch, exposed roof area, surface absorptance and external shade determine how much incident radiation becomes heat gain.</p></div><div className="userModelOutput"><div><b>USER MODEL OUTPUT</b><small>Before AI optimization</small></div><strong>{user.absorbedSolar.toFixed(1)} <span>kWh/day absorbed</span></strong><p>Incident {user.solarIncident.toFixed(1)} kWh · protection {Math.round(user.solarProtection*100)}%</p></div></div>
    </div>
  </div>;
  if(mode==='heatflow') return <div className="analysisCanvas heatflowAnalysisCanvas">
    <div className="scanLabel"><Flame/> ENVELOPE HEAT-FLOW BALANCE</div><em className="analysisSource modelSource aiSource">AI MODEL OUTPUT</em>
    <div className="heatflowEquation"><span>Heat transfer basis</span><strong>Q ≈ U × A × ΔT</strong><small>Each envelope element contributes according to conductivity, exposed area and the design-condition temperature difference.</small></div>
    <HeatFlowBars user={user} ai={ai}/>
    <div className="heatflowTotals"><div><span>Roof</span><b>{ai.qRoof.toFixed(2)} kW</b><small>roof area × roof U × ΔT</small></div><div><span>Walls</span><b>{ai.qWalls.toFixed(2)} kW</b><small>wall envelope × wall U × ΔT</small></div><div><span>Openings</span><b>{ai.qOpenings.toFixed(2)} kW</b><small>opening area × glazing response × ΔT</small></div><div className="heatflowTotalBig"><span>Total at selected condition</span><b>{ai.totalHeatFlow.toFixed(2)} kW</b><small>{ai.periodHeat.toFixed(1)} kWh over {input.analysisHours} h</small></div></div><div className="analysisUserOutput"><b>USER MODEL OUTPUT</b><span>{user.totalHeatFlow.toFixed(2)} kW total heat flow</span><small>Roof {user.qRoof.toFixed(2)} · walls {user.qWalls.toFixed(2)} · openings {user.qOpenings.toFixed(2)} kW</small></div>
  </div>;
  return <div className="analysisCanvas airflowCanvas"><div className="scanLabel"><Wind/> AIRFLOW VECTOR FIELD</div><em className="analysisSource modelSource aiSource">AI MODEL OUTPUT</em><div className="airflowField"><div className="airCore"><Fan/><b>{ai.air}/100</b><small>air exchange index</small></div>{Array.from({length:16}).map((_,n)=><motion.div key={n} className="vectorLine" style={{top:`${10+(n%8)*10}%`,left:`${4+Math.floor(n/8)*44}%`}} animate={{x:[0,110,210],opacity:[0,.8,0]}} transition={{duration:2.4+n*.08,repeat:Infinity,delay:n*.09}}/>)}<div className="airLabel inAir">COOLER AIR IN</div><div className="airLabel outAir">WARM AIR OUT</div><div className="airMetric"><span>Ventilation</span><b>{ai.vent}%</b><small>cross-flow opening ratio</small></div><div className="airMetric airMetric2"><span>Wind</span><b>{input.wind} km/h</b><small>prevailing site wind</small></div></div><div className="analysisUserOutput airflowUserOutput"><b>USER MODEL OUTPUT</b><span>{user.air}/100 air exchange index</span><small>Ventilation {user.vent}% · user-defined strategy</small></div></div>
}

function ResultPanel({title,icon,items}:{title:string;icon:React.ReactNode;items:string[][]}){return <div className="resultPanel"><div className="resultHead"><span>{icon}</span><b>{title}</b></div>{items.map(([a,b])=><div className="resultRow" key={a}><span>{a}</span><strong>{b}</strong></div>)}</div>}

function ProjectModal({
  input,
  update,
  onClose,
  onOpenMaterials,
  onUseLocation,
  locationStatus,
  onContinue,
  canContinue,
  onSelectCity
}:{
  input:Inputs;
  update:(p:Partial<Inputs>)=>void;
  onClose:()=>void;
  onOpenMaterials:()=>void;
  onUseLocation:()=>void;
  locationStatus:string;
  onContinue:()=>void;
  canContinue:boolean;
  onSelectCity:(city:string,state:string)=>void;
}){
  return <motion.div className="modalBackdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><motion.div className="modal large" initial={{opacity:0,y:20,scale:.98}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:20}}>
    <div className="modalHead"><div><span className="eyebrow"><SlidersHorizontal size={14}/> COMPLETE PROJECT INPUT</span><h3>Tell us exactly what you are designing.</h3><p>These values drive geometry, climate analysis, thermal prediction, solar energy, heat flow, material selection and cost.</p></div><button onClick={onClose}><X/></button></div>
    <div className="targetSwitch"><button className={input.target==='human'?'selected':''} onClick={()=>update({target:'human',purpose:'Rural home'})}><Users/>Human shelter<span>People / household / community</span></button><button className={input.target==='livestock'?'selected':''} onClick={()=>update({target:'livestock',purpose:'Livestock shelter'})}><PawPrint/>Livestock shelter<span>Animal count + thermal welfare</span></button></div>
    <div className="formGrid">
      <Field label={input.target==='human'?'People':'Animals'}><input type="number" min="1" value={input.occupants} onChange={e=>update({occupants:Number(e.target.value)})}/></Field>
      <Field label="Purpose"><select value={input.purpose} onChange={e=>update({purpose:e.target.value})}>{(input.target==='human'?['Rural home','Community shelter','Emergency shelter','Worker accommodation']:['Dairy cattle','Goat shelter','Sheep shelter','Poultry shelter']).map(x=><option key={x}>{x}</option>)}</select></Field>
      {input.target==='livestock'&&<Field label="Livestock type"><select value={input.livestock} onChange={e=>update({livestock:e.target.value as Livestock})}>{['cattle','goat','sheep','poultry'].map(x=><option key={x}>{x}</option>)}</select></Field>}
      <Field label="Shelter area"><div className="inputSuffix"><input type="number" min="8" value={input.area} onChange={e=>update({area:Number(e.target.value)})}/><span>m²</span></div></Field>
      <Field label="Available budget"><div className="inputPrefix"><span>₹</span><input type="number" value={input.budget} onChange={e=>update({budget:Number(e.target.value)})}/></div></Field>
      <Field label="Wall thickness"><div className="inputSuffix"><input type="number" min="10" value={input.wall} onChange={e=>update({wall:Number(e.target.value)})}/><span>cm</span></div></Field>
      <Field label="External shade"><div className="inputSuffix"><input type="number" min="0" step=".1" value={input.shade} onChange={e=>update({shade:Number(e.target.value)})}/><span>m</span></div></Field>
      <Field label="Ventilation ratio"><div className="inputSuffix"><input type="number" min="5" max="80" value={input.ventilation} onChange={e=>update({ventilation:Number(e.target.value)})}/><span>%</span></div></Field>
      <Field label="Roof pitch"><div className="inputSuffix"><input type="number" min="5" max="45" value={input.roofPitch} onChange={e=>update({roofPitch:Number(e.target.value)})}/><span>°</span></div></Field>
    </div>
    <button className="materialLauncher requiredLauncher" onClick={onOpenMaterials}><span><Factory/></span><div><b>Material library & envelope <em>REQUIRED BEFORE CONTINUE</em></b><small>Choose wall, roof, insulation and floor materials from the built-in thermal-property library.</small></div><ArrowRight/></button>
    <div className="locationBox">
  <div className="locationTitle">
    <MapPin/>
    <div>
      <b>Where is the shelter?</b>
      <small>Location determines the climate context.</small>
    </div>

    <button onClick={onUseLocation}>
      <LocateFixed/> Use Current Location
    </button>
  </div>

  <div className="locationInput">
    <CityAutocomplete
      value={input.location}
      city={input.city}
      state={input.state}
      update={update}
      onSelectCity={onSelectCity}
    />

    <span>
      Detected: {input.city || '—'}, {input.state || '—'}
    </span>
  </div>

  {locationStatus&&(
    <small className="statusNote">
      {locationStatus}
    </small>
  )}
</div>
    <div className="modalActions"><button className="ghostBtn" onClick={onClose}>Cancel</button><button className="primaryBtn" disabled={!canContinue} onClick={onContinue}>{canContinue?'Continue to climate':'Select materials to continue'} <ArrowRight/></button></div>
  </motion.div></motion.div>
}

function MaterialsModal({input,update,onClose,onSave}:{input:Inputs;update:(p:Partial<Inputs>)=>void;onClose:()=>void;onSave:()=>void}){
  const library={
    wall:[
      ['Compressed earth block','λ 0.42 W/m·K','High thermal mass','Low embodied energy'],
      ['Fired brick','λ 0.60 W/m·K','Durable mass','Common rural supply'],
      ['Concrete block','λ 1.10 W/m·K','Fast construction','Higher heat conductivity'],
      ['Stone masonry','λ 1.70 W/m·K','Very high mass','Excellent durability'],
      ['Timber frame + infill','λ 0.35 W/m·K','Lower mass','Fast assembly'],
      ['Adobe / soil block','λ 0.30 W/m·K','Strong thermal lag','Site-adaptable']
    ],
    roof:[
      ['Reflective metal sheet','Solar absorptance 0.30','Lightweight','Strong solar rejection'],
      ['Clay tile','Solar absorptance 0.55','Thermal buffering','Traditional option'],
      ['Fibre-cement sheet','Solar absorptance 0.45','Moderate cost','Easy installation'],
      ['Green roof layer','High thermal damping','High mass','Needs structure + water management']
    ],
    insulation:[
      ['Mineral wool','λ 0.040 W/m·K','Fire resistant','High thermal resistance'],
      ['EPS board','λ 0.035 W/m·K','Low cost','Lightweight'],
      ['Rice-husk insulation','λ 0.060 W/m·K','Agri-waste reuse','Local-material option'],
      ['Cork board','λ 0.040 W/m·K','Renewable','Moisture tolerant']
    ],
    floor:[
      ['Stabilized earth floor','Moderate conductivity','High thermal mass','Low-cost local option'],
      ['Concrete slab','High thermal mass','Durable','Common construction'],
      ['Brick floor','Moderate mass','Repairable','Rural-friendly'],
      ['Raised timber floor','Low stored heat','Good airflow below','Useful for humid sites']
    ]
  } as const;
  const selected=(key:'wall'|'roof'|'insulation'|'floor')=> key==='wall'?input.wallMaterial:key==='roof'?input.roofMaterial:key==='insulation'?input.insulationMaterial:input.floorMaterial;
  const setSelected=(key:'wall'|'roof'|'insulation'|'floor',value:string)=>update(key==='wall'?{wallMaterial:value}:key==='roof'?{roofMaterial:value}:key==='insulation'?{insulationMaterial:value}:{floorMaterial:value});
  const section=(key:'wall'|'roof'|'insulation'|'floor',title:string,icon:React.ReactNode)=> <div className="materialSection"><div className="materialSectionHead"><span>{icon}</span><div><b>{title}</b><small>Select a material profile used by the prototype model.</small></div><span className="materialSelected">{selected(key)}</span></div><div className="materialOptions">{library[key].map(([name,prop,tag,detail])=><button key={name} className={selected(key)===name?'materialOption selected':'materialOption'} onClick={()=>setSelected(key,name)} style={{appearance:'none',WebkitAppearance:'none',background:selected(key)===name?'linear-gradient(135deg,rgba(10,54,44,.98),rgba(5,28,23,.98))':'rgba(7,24,20,.96)',color:'#eaf6f3',borderColor:selected(key)===name?'rgba(89,223,202,.55)':'rgba(108,222,201,.13)'}}><span className="materialCheck">{selected(key)===name?<Check/>:<Box/>}</span><div><b>{name}</b><small>{prop} · {tag}</small><em>{detail}</em></div></button>)}</div></div>;
  return <motion.div className="modalBackdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><motion.div className="modal materialsModal" initial={{opacity:0,y:20,scale:.98}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:20}}>
    <div className="modalHead"><div><span className="eyebrow"><Factory size={14}/> MATERIAL LIBRARY · ENVELOPE PROFILE</span><h3>Choose the actual shelter materials.</h3><p>The library gives the model a transparent starting point for wall, roof, insulation and floor properties. Judges can see exactly what is being fed into the thermal design workflow.</p></div><button onClick={onClose}><X/></button></div>
    {section('wall','Wall system',<Building2/>)}
    {section('roof','Roof system',<PanelTop/>)}
    {section('insulation','Insulation layer',<Layers3/>)}
    {section('floor','Floor / thermal mass',<Box/>)}
    <div className="materialSummary"><div><span>Selected envelope</span><b>{input.wallMaterial} · {input.roofMaterial}</b></div><div><span>Thermal layer</span><b>{input.insulationMaterial}</b></div><div><span>Floor</span><b>{input.floorMaterial}</b></div></div>
    <div className="modalActions"><button className="primaryBtn" onClick={()=>{onSave();onClose()}}>Save material profile <Check/></button></div>
  </motion.div></motion.div>
}

function ClimateModal({input,update,onClose,onApply}:{input:Inputs;update:(p:Partial<Inputs>)=>void;onClose:()=>void;onApply:()=>void}){
  return <motion.div className="modalBackdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><motion.div className="modal medium" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:20}}>
    <div className="modalHead"><div><span className="eyebrow"><Thermometer size={14}/> OPTIONAL MANUAL CLIMATE DATA</span><h3>Use your own field measurements.</h3><p>Useful when you have a local weather station, survey or measured site data.</p></div><button onClick={onClose}><X/></button></div>
    <div className="overrideGrid">
      <Field label="Outdoor peak temperature"><div className="inputSuffix"><input type="number" value={input.outdoorTemp} onChange={e=>update({outdoorTemp:Number(e.target.value)})}/><span>°C</span></div></Field>
      <Field label="Relative humidity"><div className="inputSuffix"><input type="number" value={input.humidity} onChange={e=>update({humidity:Number(e.target.value)})}/><span>%</span></div></Field>
      <Field label="Wind speed"><div className="inputSuffix"><input type="number" value={input.wind} onChange={e=>update({wind:Number(e.target.value)})}/><span>km/h</span></div></Field>
      <Field label="Solar radiation"><div className="inputSuffix"><input type="number" value={input.solar} onChange={e=>update({solar:Number(e.target.value)})}/><span>W/m²</span></div></Field>
      <Field label="Analysis period"><div className="inputSuffix"><input type="number" min="1" max="168" value={input.analysisHours} onChange={e=>update({analysisHours:Number(e.target.value)})}/><span>hours</span></div></Field>
      <Field label="Peak sun hours"><div className="inputSuffix"><input type="number" min="1" max="12" value={input.peakSunHours} onChange={e=>update({peakSunHours:Number(e.target.value)})}/><span>h/day</span></div></Field>
      <Field label="Solar-to-thermal efficiency"><div className="inputSuffix"><input type="number" min="1" max="100" value={input.solarEfficiency} onChange={e=>update({solarEfficiency:Number(e.target.value)})}/><span>%</span></div></Field>
    </div>
    <div className="helper"><Gauge/> The entered values immediately update the temperature prediction, solar energy estimate and ΔT-based heat-flow calculation.</div>
    <div className="modalActions"><button className="ghostBtn" onClick={onClose}>Cancel</button><button className="primaryBtn" onClick={onApply}>Apply climate profile <Check/></button></div>
  </motion.div></motion.div>
}

function Field({label,children}:{label:string;children:React.ReactNode}){
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function CityAutocomplete({
  value,
  city,
  state,
  update,
  onSelectCity
}:{
  value:string;
  city:string;
  state:string;
  update:(patch:Partial<Inputs>)=>void;
  onSelectCity:(city:string,state:string)=>void;
}) {
  const [open,setOpen]=useState(false);
  const [highlighted,setHighlighted]=useState(0);

  const query=value.trim().toLowerCase();

  const suggestions = query.length === 0
    ? []
    : citySuggestions
        .filter(item =>
          `${item.city} ${item.state}`.toLowerCase().includes(query)
        )
        .sort((a,b)=>{
          const aCity=a.city.toLowerCase();
          const bCity=b.city.toLowerCase();

          const aStarts=aCity.startsWith(query) ? 0 : 1;
          const bStarts=bCity.startsWith(query) ? 0 : 1;

          return aStarts-bStarts;
        })
        .slice(0,5);

  useEffect(()=>{
    setHighlighted(0);
  },[value]);

  useEffect(()=>{
    const close=()=>{
      setOpen(false);
    };

    window.addEventListener('click',close);

    return()=>{
      window.removeEventListener('click',close);
    };
  },[]);

  const selectCity=(item:{city:string;state:string})=>{
    update({
      location:`${item.city}, ${item.state}`,
      city:item.city,
      state:item.state
    });

    setOpen(false);

    onSelectCity(item.city,item.state);
  };

  const handleKeyDown=(e:React.KeyboardEvent<HTMLInputElement>)=>{
    if(!suggestions.length) return;

    if(e.key==='ArrowDown'){
      e.preventDefault();
      setOpen(true);
      setHighlighted(prev =>
        prev < suggestions.length-1 ? prev+1 : 0
      );
    }

    if(e.key==='ArrowUp'){
      e.preventDefault();
      setOpen(true);
      setHighlighted(prev =>
        prev > 0 ? prev-1 : suggestions.length-1
      );
    }

    if(e.key==='Enter'){
      e.preventDefault();

      const selected=suggestions[highlighted];

      if(selected){
        selectCity(selected);
      }
    }

    if(e.key==='Escape'){
      setOpen(false);
    }
  };

  return (
    <div
      className="cityAutocomplete"
      onClick={e=>e.stopPropagation()}
      style={{
        position:'relative',
        flex:1
      }}
    >
      <input
        value={value}
        onFocus={()=>{
          if(value.trim()) setOpen(true);
        }}
        onChange={e=>{
          update({
            location:e.target.value,
            city:'',
            state:''
          });
          setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder="City, State"
        autoComplete="off"
      />

      {open && suggestions.length>0 && (
        <div
          style={{
            position:'absolute',
            top:'calc(100% + 8px)',
            left:0,
            right:0,
            zIndex:1000,
            background:'#ffffff',
            border:'1px solid #d5e3df',
            borderRadius:'14px',
            boxShadow:'0 12px 30px rgba(20,60,50,.14)',
            overflow:'hidden'
          }}
        >
          {suggestions.map((item,index)=>(
            <button
              key={`${item.city}-${item.state}`}
              type="button"
              onMouseDown={e=>{
                e.preventDefault();
                selectCity(item);
              }}
              style={{
                width:'100%',
                border:0,
                background:index===highlighted
                  ? '#eef8f5'
                  : '#ffffff',
                padding:'13px 16px',
                textAlign:'left',
                cursor:'pointer',
                display:'flex',
                flexDirection:'column',
                gap:'3px'
              }}
            >
              <strong
                style={{
                  color:'#16483f',
                  fontSize:'15px'
                }}
              >
                {item.city}
              </strong>

              <span
                style={{
                  color:'#78918c',
                  fontSize:'13px'
                }}
              >
                {item.state}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
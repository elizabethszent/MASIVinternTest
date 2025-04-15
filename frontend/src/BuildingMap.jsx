/**
 * BuildingMap.jsx - 3D Visualization Component
 * -------------------------------------------
 * This React component renders an interactive 3D map of buildings using Three.js via @react-three/fiber.
 *
 * Features:
 * ---------
 * - Loads building data from the Flask backend served as GeoJSON.
 * - Projects buildings as 3D boxes with proportional height and area.
 * - Supports interactive selection and highlight overlays.
 * - (Optional) Integrates with LLM filter results to highlight buildings based on natural language queries.
 *
 * Props:
 * ------
 * Currently self-contained; however, highlight logic is designed to work with optional props from App.jsx.
 *
 * Development Notes:
 * ------------------
 * - The search bar is commented out for presentation purposes, but filter logic remains integrated.
 * - Building size is calculated from polygon area assuming roughly square footprints.
 * - Zoning or other metadata is shown as a floating HTML tooltip when selected.
 *
 * Dependencies:
 * -------------
 * - @react-three/fiber (Three.js integration)
 * - @react-three/drei (UI helpers like OrbitControls and Html overlays)
 * - styles.css (custom visuals, tooltip styles)
 *
 * Author: Elizabeth Szentmiklossy
 */

import React, { useEffect, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import './styles.css';

//API endpoints for building data and query parsing
const API_QUERY_URL = 'https://masivinterntest.onrender.com/api/query';
const API_BUILDINGS_URL = 'https://masivinterntest.onrender.com/api/buildings';

//individual building box in the 3D scene
function Building({ position, width, height, depth, info, onClick, isSelected, isHighlighted }) {
  const ref = useRef();
  return (
    <mesh position={position} ref={ref} onClick={onClick} castShadow receiveShadow>
      <boxGeometry args={[width, height, depth]} />
      <meshStandardMaterial color={isSelected ? '#ff595e' : isHighlighted ? '#f4a261' : '#4a90a4'} />
      {isSelected && (
        <Html distanceFactor={200} position={[0, height / 2 + 10, 0]}>
          <div
            style={{
              background: 'white',
              padding: '12px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              fontSize: '14px',
              lineHeight: '1.4',
              minWidth: '160px',
              maxWidth: '220px',
              textAlign: 'left',
              color: '#222',
              fontFamily: 'sans-serif'
            }}
          >
            <strong>{info.desc}</strong><br />
            Area: {info.area.toFixed(1)} m²<br />
            X: {info.x}<br />
            Y: {info.y}<br />
            Zoning: {info.zone || 'N/A'}
          </div>
        </Html>
      )}
    </mesh>
  );
}

export default function BuildingMap() {
  const [buildings, setBuildings] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState('');
  const [highlightedIds, setHighlightedIds] = useState([]);

  useEffect(() => {
    //fetch GeoJSON building data from backend on first load
    fetch(API_BUILDINGS_URL)
      .then((res) => res.json())
      .then((data) => {
        const features = data.features || [];
        if (features.length === 0) return;

        //use the first building as a reference origin to normalize position
        const first = features[0];
        const baseX = parseFloat(first.properties?.x_coord);
        const baseY = parseFloat(first.properties?.y_coord);

        //process each building into simplified box geometry
        const buildingsData = features
          .map((feature, i) => {
            const x = parseFloat(feature.properties?.x_coord);
            const y = parseFloat(feature.properties?.y_coord);
            const area = parseFloat(feature.properties?.shape__area);

            //skip any invalid or missing data
            if (isNaN(x) || isNaN(y) || isNaN(area)) return null;

            //estimate box size from area (assuming squarish footprints)
            const footprint = Math.sqrt(area);
            const width = footprint;
            const depth = footprint * 0.8;
            const height = footprint * 1.5;

            //offset position to be centered in view
            const pos = [
              (x - baseX) * 0.08,
              height / 2,
              (y - baseY) * 0.08
            ];

            return {
              id: i,
              position: pos,
              height,
              width,
              depth,
              info: {
                desc: feature.properties?.bldg_code_desc || 'Unknown',
                area,
                x: x.toFixed(2),
                y: y.toFixed(2),
                zone: feature.properties?.zone || feature.properties?.bldg_code || 'Unknown'
              }
            };
          })
          .filter(b => b !== null)
          .filter((_, i) => i % 100 === 0)
          .slice(0, 50);

        console.log("Sample processed building:", buildingsData[0]);
        setBuildings(buildingsData);
      })
      .catch((err) => console.error("Fetch error:", err));
  }, []);

    // (Optional) LLM query integration for filtering buildings
  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(API_QUERY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
  
      const filter = await res.json();
      console.log("Received filter from LLM:", filter);
  
      // Guard: Detect GeoJSON response instead of a filter
      if (filter.features && Array.isArray(filter.features)) {
        alert("Unexpected response: received a GeoJSON object instead of a filter.");
        return;
      }
  
      // Guard: Detect LLM errors passed as response
      if (filter.error) {
        alert("LLM Error: " + filter.error);
        return;
      }
  
      // Guard: Ensure proper structure of the filter
      if (!filter || !filter.attribute || !filter.operator || filter.value === undefined) {
        alert('Invalid filter returned');
        return;
      }
      //map logical attribute names to keys in the data
      const attributeMap = {
        zoning: 'zone',
        height: 'height',
        area: 'area',
        value: 'value'
      };
  
      const mappedAttr = attributeMap[filter.attribute];
      if (!mappedAttr) {
        alert('Unsupported attribute in query');
        return;
      }
  
      //TEMP FIX: Normalize zoning number as int if it's a string
      if (filter.attribute === "zoning" && typeof filter.value === "string" && /^\d+$/.test(filter.value)) {
        filter.value = parseInt(filter.value);
      }
  
       //apply filter logic on buildings and collect matching IDs
      const matches = buildings.filter(b => {
        const val = b.info[mappedAttr] ?? b[mappedAttr];
        console.log(`Checking ${mappedAttr} on building ${b.id}:`, val, 'against filter value:', filter.value);
  
        if (val === undefined || val === null) return false;
  
        if (filter.operator === '>') return parseFloat(val) > parseFloat(filter.value);
        if (filter.operator === '<') return parseFloat(val) < parseFloat(filter.value);
        if (filter.operator === '==') {
          const valStr = val.toString().toLowerCase().trim();
          const filterValStr = filter.value.toString().toLowerCase().trim();
          console.log(`Comparing (==): ${valStr} === ${filterValStr}`);
          return valStr === filterValStr;
        }
        if (filter.operator === 'IN') {
          return val.toString().toLowerCase().includes(filter.value.toString().toLowerCase());
        }
  
        return false;
      }).map(b => b.id);
  
      setHighlightedIds(matches);
    } catch (err) {
      console.error('Query error:', err);
    }
  };
  

return (
  <>
    {/* 
    <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10 }}>
      <form onSubmit={handleQuerySubmit}>
        <input
          type="text"
          placeholder="e.g. highlight buildings over 100 feet"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ padding: '8px', width: '300px', marginRight: '10px' }}
        />
        <button type="submit">Query</button>
      </form>
    </div>
    */}
      <Canvas shadows camera={{ position: [0, 500, 500], fov: 60 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[150, 200, 150]} intensity={1} castShadow />
        <OrbitControls />

        {buildings.map((b) => (
          <Building
            key={b.id}
            position={b.position}
            height={b.height}
            width={b.width}
            depth={b.depth}
            info={b.info}
            onClick={() => setSelectedId(b.id)}
            isSelected={selectedId === b.id}
            isHighlighted={highlightedIds.includes(b.id)}
          />
        ))}
      </Canvas>
    </>
  );
}




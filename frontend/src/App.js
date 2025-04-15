/**
 * App.jsx - Root Component
 * ------------------------
 * This is the root React component of the 3D Urban Design Dashboard frontend.
 * It manages application-wide state such as the user query and building highlights.
 *
 * Responsibilities:
 * -----------------
 * - (Optional) Captures user query input for natural language filtering (currently commented out).
 * - Sends queries to the Flask backend and receives filter information (if enabled).
 * - Passes highlight information to <BuildingMap /> to visually emphasize matched buildings.
 *
 * Note:
 * -----
 * The search bar is currently disabled for final presentation, but the underlying logic is preserved
 * for potential future activation.
 */
import React, { useState } from 'react';
import BuildingMap from './BuildingMap';

function App() {
  const [query, setQuery] = useState(''); //user input for the query (currently unused)
  const [highlightIds, setHighlightIds] = useState([]);//list of building IDs to highlight

   //optional handler to query the backend with natural language input
  const handleQuerySubmit = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();
      console.log("Query result:", data);

      //highlight matched building IDs (if LLM integration is enabled)
      setHighlightIds(data.matching_ids || []);
    } catch (err) {
      console.error("Query error:", err);
    }
  };

  return (
   <div style={{ width: '100vw', height: '100vh' }}>

     {/* 
        Query input field (disabled for submission)
        Uncomment below if enabling LLM-powered search again.
      */}
      {/*<div style={{ position: 'absolute', top: 20, left: 20, zIndex: 1 }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. highlight buildings over 100 feet"
          style={{ padding: '8px', fontSize: '14px' }}
        />
        <button onClick={handleQuerySubmit} style={{ marginLeft: '8px' }}>
          Query
        </button>
      </div>*/}
      <BuildingMap highlightIds={highlightIds} />
    </div>
  );
}

export default App;

import React, { useState, useEffect } from 'react'
import axios from 'axios';
// import { feature } from 'topojson-client';
import './App.css';

import Map from './components/Map';

function App() {
  const [eduData, setEduData] = useState([]);
  const [mapData, setMapData] = useState({});

  useEffect(() => {
    axios.get('https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json')
      .then(res => setEduData(res.data))
      .catch(err => console.log(err));

    axios.get('https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json')
      .then(res => {
        const mapData = res.data;
        setMapData(mapData);
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={{ width: '90vw', margin: '0 auto' }}>
      <h1 id="title" style={{ textAlign: 'center' }}>United States Educational Attainment</h1>
      <h3 id="description" style={{ textAlign: 'center' }}>Percentage of adults age 25 and older with a bachelor's degree or higher (2010-2014)</h3>
      <Map
        eduData={eduData}
        mapData={mapData}
      />
    </div>
  );
}

export default App;

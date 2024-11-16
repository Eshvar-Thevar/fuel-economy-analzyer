import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import FuelEconomyLineChart from './FuelEconomyLineChart';
import EngineDisplacementScatterPlot from './EngineDisplacementScatterPlot';
import DivisionBarChart from './DivisionBarChart';
import './App.css';

function App() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedManufacturer, setSelectedManufacturer] = useState('All');
  const [selectedTransmissionType, setSelectedTransmissionType] = useState('All');
  const [selectedMPGType, setSelectedMPGType] = useState('Combined'); // Default to Combined MPG
  const [currentGraphIndex, setCurrentGraphIndex] = useState(0);

  const graphs = [
    <FuelEconomyLineChart data={filteredData} mpgType={selectedMPGType} />, // Pass the selected MPG type as a prop
    <EngineDisplacementScatterPlot data={filteredData} mpgType={selectedMPGType} />, // Pass the selected MPG type
    <DivisionBarChart data={filteredData} mpgType={selectedMPGType} />, // Pass the selected MPG type
  ];

  useEffect(() => {
    const fileNames = ['2021.xlsx', '2022.xlsx', '2023.xlsx', '2024.xlsx', '2025.xlsx'];
    let allData = [];

    const readExcelFile = (filePath) => {
      return fetch(filePath)
        .then(response => response.arrayBuffer())
        .then(buffer => {
          const workbook = XLSX.read(buffer, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          return XLSX.utils.sheet_to_json(worksheet);
        });
    };

    Promise.all(fileNames.map(fileName => readExcelFile(`/${fileName}`)))
      .then(results => {
        results.forEach(result => {
          allData = allData.concat(result);
        });
        setData(allData);
        setFilteredData(allData); // Initialize with all data
      })
      .catch(err => console.error('Error loading data:', err));
  }, []);

  const handleYearChange = (e) => {
    const year = e.target.value;
    setSelectedYear(year);
    filterData(year, selectedManufacturer, selectedTransmissionType, selectedMPGType);
  };

  const handleManufacturerChange = (e) => {
    const manufacturer = e.target.value;
    setSelectedManufacturer(manufacturer);
    filterData(selectedYear, manufacturer, selectedTransmissionType, selectedMPGType);
  };

  const handleTransmissionTypeChange = (e) => {
    const transmissionType = e.target.value;
    setSelectedTransmissionType(transmissionType);
    filterData(selectedYear, selectedManufacturer, transmissionType, selectedMPGType);
  };

  const handleMPGTypeChange = (e) => {
    const mpgType = e.target.value;
    setSelectedMPGType(mpgType);
    filterData(selectedYear, selectedManufacturer, selectedTransmissionType, mpgType);
  };

  const filterData = (year, manufacturer, transmissionType, mpgType) => {
    let filtered = data;
    if (year !== 'All') {
      filtered = filtered.filter(vehicle => vehicle['Model Year'].toString() === year.toString());
    }
    if (manufacturer !== 'All') {
      filtered = filtered.filter(vehicle => vehicle['Mfr Name'] === manufacturer);
    }
    if (transmissionType !== 'All') {
      filtered = filtered.filter(vehicle => {
        const transmission = vehicle['Transmission'];
        if (transmissionType === 'Automatic') {
          return transmission && transmission.includes('Auto');
        } else if (transmissionType === 'Manual') {
          return transmission && transmission.includes('Manual');
        }
        return false;
      });
    }
    setFilteredData(filtered);
  };

  const handleNextGraph = () => {
    setCurrentGraphIndex((prevIndex) => (prevIndex + 1) % graphs.length);
  };

  const handlePreviousGraph = () => {
    setCurrentGraphIndex((prevIndex) => (prevIndex - 1 + graphs.length) % graphs.length);
  };

  return (
    <div className="App">
      <h1>Fuel Economy Analyzer (2021-2025)</h1>

      {/* Filter Controls */}
      <div>
        <label>Filter by Year: </label>
        <select onChange={handleYearChange} value={selectedYear}>
          <option value="All">All</option>
          <option value="2021">2021</option>
          <option value="2022">2022</option>
          <option value="2023">2023</option>
          <option value="2024">2024</option>
          <option value="2025">2025</option>
        </select>

        <label> Filter by Manufacturer: </label>
        <select onChange={handleManufacturerChange} value={selectedManufacturer}>
          <option value="All">All</option>
          {[...new Set(data.map(vehicle => vehicle['Mfr Name']))].map((mfr, index) => (
            <option key={index} value={mfr}>{mfr}</option>
          ))}
        </select>

        <label> Filter by Transmission Type: </label>
        <select onChange={handleTransmissionTypeChange} value={selectedTransmissionType}>
          <option value="All">All</option>
          <option value="Automatic">Automatic</option>
          <option value="Manual">Manual</option>
        </select>

        <label> Filter by MPG Type: </label>
        <select onChange={handleMPGTypeChange} value={selectedMPGType}>
          <option value="Combined">Combined</option>
          <option value="City">City</option>
          <option value="Highway">Highway</option>
        </select>
      </div>

      {/* Display Navigation Arrows and Current Graph */}
      {filteredData.length > 0 ? (
        <div>
          <button onClick={handlePreviousGraph}>&lt; Previous</button>
          <button onClick={handleNextGraph}>Next &gt;</button>
          {graphs[currentGraphIndex]}
        </div>
      ) : (
        <p>No data available for the selected filters.</p>
      )}
    </div>
  );
}

export default App;

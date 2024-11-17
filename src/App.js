import React, { useEffect, useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import FuelEconomyLineChart from './FuelEconomyLineChart';
import DivisionBarChart from './DivisionBarChart';
import EngineDisplacementScatterPlot from './EngineDisplacementScatterPlot';
import './App.css';

function App() {
  // State management
  const [data, setData] = useState([]);
  const [filteredData1, setFilteredData1] = useState([]);
  const [filteredData2, setFilteredData2] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('trend');
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [error, setError] = useState(null);

  // Initial filter state
  const initialFilterState = {
    year: 'All',
    manufacturer: 'All',
    carModel: 'All',
    carType: 'All',
    transmissionType: 'All',
    mpgType: 'Combined',
  };

  // Filter states
  const [selectedFilters1, setSelectedFilters1] = useState(initialFilterState);
  const [selectedFilters2, setSelectedFilters2] = useState(initialFilterState);

  // Statistics state
  const [stats, setStats] = useState({
    averageMPG: 0,
    totalModels: 0,
    mostEfficientModel: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const fileNames = ['2021.xlsx', '2022.xlsx', '2023.xlsx', '2024.xlsx', '2025.xlsx'];
        let allData = [];

        for (const fileName of fileNames) {
          // Updated fetch call with process.env.PUBLIC_URL
          const response = await fetch(`${process.env.PUBLIC_URL}/${fileName}`);
          const buffer = await response.arrayBuffer();
          const workbook = XLSX.read(buffer, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const sheetData = XLSX.utils.sheet_to_json(worksheet);
          allData = [...allData, ...sheetData];
        }

        setData(allData);
        setFilteredData1(allData);
        setFilteredData2(allData);
        calculateStats(allData);
      } catch (err) {
        setError('Error loading data: ' + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const calculateStats = (data) => {
    const avgMPG = data.reduce((sum, vehicle) => {
      const mpg = parseFloat(vehicle['Comb FE (Guide) - Conventional Fuel']);
      return sum + (isNaN(mpg) ? 0 : mpg);
    }, 0) / (data.length || 1);

    const mostEfficient = data.reduce((prev, curr) => {
      const prevMPG = parseFloat(prev['Comb FE (Guide) - Conventional Fuel'] || 0);
      const currMPG = parseFloat(curr['Comb FE (Guide) - Conventional Fuel'] || 0);
      return currMPG > prevMPG ? curr : prev;
    }, data[0] || { 'Mfr Name': 'N/A', 'Carline': 'N/A' });

    setStats({
      averageMPG: avgMPG.toFixed(1),
      totalModels: data.length,
      mostEfficientModel: `${mostEfficient['Mfr Name']} ${mostEfficient['Carline']}`,
    });
  };

  const handleFilterChange = (setSelectedFilters, setFilteredData, filterName, value) => {
    setSelectedFilters(prevFilters => {
      const newFilters = { ...prevFilters };
      newFilters[filterName] = value;
      
      if (filterName === 'manufacturer') {
        newFilters.carModel = 'All';
      }
      
      const filtered = filterData(data, newFilters);
      setFilteredData(filtered);
      calculateStats(filtered);
      return newFilters;
    });
  };

  const handleReset = (setSelectedFilters, setFilteredData) => {
    setSelectedFilters(initialFilterState);
    setFilteredData(data);
    calculateStats(data);
  };

  const filterData = (data, filters) => {
    return data.filter(vehicle => {
      if (filters.year !== 'All' && vehicle['Model Year'].toString() !== filters.year.toString()) return false;
      if (filters.manufacturer !== 'All' && vehicle['Mfr Name'] !== filters.manufacturer) return false;
      if (filters.carModel !== 'All' && vehicle['Carline'] !== filters.carModel) return false;
      if (filters.carType !== 'All' && vehicle['Carline Class Desc'] !== filters.carType) return false;
      if (filters.transmissionType !== 'All') {
        const transmission = vehicle['Transmission'];
        if (filters.transmissionType === 'Automatic' && !transmission?.includes('Auto')) return false;
        if (filters.transmissionType === 'Manual' && !transmission?.includes('Manual')) return false;
      }
      return true;
    });
  };

  const StatisticsTab = ({ data }) => {
    // Calculate statistics for just this dataset
    const calculateLocalStats = (vehicles) => {
      if (vehicles.length === 0) return null;
  
      const avgCityMPG = vehicles.reduce((sum, v) => {
        const mpg = parseFloat(v['City FE (Guide) - Conventional Fuel'] || 0);
        return sum + (isNaN(mpg) ? 0 : mpg);
      }, 0) / vehicles.length;
  
      const avgHighwayMPG = vehicles.reduce((sum, v) => {
        const mpg = parseFloat(v['Hwy FE (Guide) - Conventional Fuel'] || 0);
        return sum + (isNaN(mpg) ? 0 : mpg);
      }, 0) / vehicles.length;
  
      const avgCombinedMPG = vehicles.reduce((sum, v) => {
        const mpg = parseFloat(v['Comb FE (Guide) - Conventional Fuel'] || 0);
        return sum + (isNaN(mpg) ? 0 : mpg);
      }, 0) / vehicles.length;
  
      return {
        avgCityMPG,
        avgHighwayMPG,
        avgCombinedMPG
      };
    };
  
    if (data.length === 0) {
      return (
        <div className="no-data-message">
          No vehicles match the current filters. Try adjusting your selection.
        </div>
      );
    }
  
    if (data.length > 1) {
      const localStats = calculateLocalStats(data);
      const uniqueManufacturers = new Set(data.map(v => v['Mfr Name'])).size;
      const uniqueModels = new Set(data.map(v => v['Carline'])).size;
      
      return (
        <div className="stats-container">
          <h3 className="stats-header">Summary Statistics</h3>
          <div className="stats-grid">
            <div className="stats-section">
              <h4>Overview</h4>
              <table className="stats-table">
                <tbody>
                  <tr>
                    <td>Total Vehicles:</td>
                    <td>{data.length}</td>
                  </tr>
                  <tr>
                    <td>Unique Manufacturers:</td>
                    <td>{uniqueManufacturers}</td>
                  </tr>
                  <tr>
                    <td>Unique Models:</td>
                    <td>{uniqueModels}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="stats-section">
              <h4>Fuel Economy</h4>
              <table className="stats-table">
                <tbody>
                  <tr>
                    <td>Average City MPG:</td>
                    <td>{localStats.avgCityMPG.toFixed(1)}</td>
                  </tr>
                  <tr>
                    <td>Average Highway MPG:</td>
                    <td>{localStats.avgHighwayMPG.toFixed(1)}</td>
                  </tr>
                  <tr>
                    <td>Average Combined MPG:</td>
                    <td>{localStats.avgCombinedMPG.toFixed(1)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    } else {
      const vehicle = data[0];
      return (
        <div className="stats-container">
          <h3 className="stats-header">Vehicle Details</h3>
          <div className="stats-grid">
            <div className="stats-section">
              <h4>Vehicle Information</h4>
              <table className="stats-table">
                <tbody>
                  <tr>
                    <td>Manufacturer:</td>
                    <td>{vehicle['Mfr Name']}</td>
                  </tr>
                  <tr>
                    <td>Model:</td>
                    <td>{vehicle['Carline']}</td>
                  </tr>
                  <tr>
                    <td>Year:</td>
                    <td>{vehicle['Model Year']}</td>
                  </tr>
                  <tr>
                    <td>Type:</td>
                    <td>{vehicle['Carline Class Desc']}</td>
                  </tr>
                  <tr>
                    <td>Transmission:</td>
                    <td>{vehicle['Transmission']}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="stats-section">
              <h4>Engine Specifications</h4>
              <table className="stats-table">
                <tbody>
                  <tr>
                    <td>Engine Displacement:</td>
                    <td>{vehicle['Eng Displ']} L</td>
                  </tr>
                  <tr>
                    <td>Cylinders:</td>
                    <td>{vehicle['# Cyl']}</td>
                  </tr>
                  <tr>
                    <td>Drive System:</td>
                    <td>{vehicle['Drive Sys']}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="stats-section">
              <h4>Fuel Economy</h4>
              <table className="stats-table">
                <tbody>
                  <tr>
                    <td>City MPG:</td>
                    <td>{vehicle['City FE (Guide) - Conventional Fuel']}</td>
                  </tr>
                  <tr>
                    <td>Highway MPG:</td>
                    <td>{vehicle['Hwy FE (Guide) - Conventional Fuel']}</td>
                  </tr>
                  <tr>
                    <td>Combined MPG:</td>
                    <td>{vehicle['Comb FE (Guide) - Conventional Fuel']}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }
  };

  const FilterSection = ({ filters, setFilters, setFilteredData, label }) => {
    const availableModels = useMemo(() => {
      if (filters.manufacturer === 'All') return [];
      return [...new Set(
        data
          .filter(v => v['Mfr Name'] === filters.manufacturer)
          .map(v => v['Carline'])
      )].sort();
    }, [data, filters.manufacturer]);

    const carTypes = useMemo(() => {
      return [...new Set(
        data
          .map(v => v['Carline Class Desc'])
          .filter(Boolean)
      )].sort();
    }, [data]);

    return (
      <div className="filter-container">
        <div className="filter-header">
          <h3>{label}</h3>
          <button
            className="reset-button"
            onClick={() => handleReset(setFilters, setFilteredData)}
          >
            Reset Filters
          </button>
        </div>
        <div className="filter-grid">
          <div className="filter-group">
            <label className="filter-label">Year</label>
            <select
              className="filter-select"
              value={filters.year}
              onChange={(e) => handleFilterChange(setFilters, setFilteredData, 'year', e.target.value)}
            >
              <option value="All">All Years</option>
              {[...new Set(data.map(v => v['Model Year']))].sort().map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label className="filter-label">Manufacturer</label>
            <select
              className="filter-select"
              value={filters.manufacturer}
              onChange={(e) => handleFilterChange(setFilters, setFilteredData, 'manufacturer', e.target.value)}
            >
              <option value="All">All Manufacturers</option>
              {[...new Set(data.map(v => v['Mfr Name']))].sort().map(mfr => (
                <option key={mfr} value={mfr}>{mfr}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Car Model</label>
            <select
              className="filter-select"
              value={filters.carModel}
              onChange={(e) => handleFilterChange(setFilters, setFilteredData, 'carModel', e.target.value)}
              disabled={filters.manufacturer === 'All'}
            >
              <option value="All">All Models</option>
              {availableModels.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Car Type</label>
            <select
              className="filter-select"
              value={filters.carType}
              onChange={(e) => handleFilterChange(setFilters, setFilteredData, 'carType', e.target.value)}
            >
              <option value="All">All Types</option>
              {carTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">MPG Type</label>
            <select
              className="filter-select"
              value={filters.mpgType}
              onChange={(e) => handleFilterChange(setFilters, setFilteredData, 'mpgType', e.target.value)}
            >
              <option value="Combined">Combined</option>
              <option value="City">City</option>
              <option value="Highway">Highway</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Transmission</label>
            <select
              className="filter-select"
              value={filters.transmissionType}
              onChange={(e) => handleFilterChange(setFilters, setFilteredData, 'transmissionType', e.target.value)}
            >
              <option value="All">All Types</option>
              <option value="Automatic">Automatic</option>
              <option value="Manual">Manual</option>
            </select>
          </div>
        </div>
      </div>
    );
  };

  const StatisticsCards = () => (
    <div className="summary-cards">
      <div className="summary-card">
        <div className="card-label">Average MPG</div>
        <div className="card-value">{stats.averageMPG}</div>
      </div>
      <div className="summary-card">
        <div className="card-label">Total Models</div>
        <div className="card-value">{stats.totalModels.toLocaleString()}</div>
      </div>
      <div className="summary-card">
        <div className="card-label">Most Efficient Model</div>
        <div className="card-value text-base">{stats.mostEfficientModel}</div>
      </div>
    </div>
);

if (error) {
  return <div className="error-message">{error}</div>;
}

if (isLoading) {
  return (
    <div className="loading-overlay">
      <div className="loading-spinner"></div>
    </div>
  );
}

return (
  <div className="App">
    <header className="app-header">
      <div className="header-container">
        <h1 className="app-title">Toyota Fuel Economy Analyzer (2021-2025)</h1>
        <button 
          className="toyota-button"
          onClick={() => setIsComparisonMode(!isComparisonMode)}
        >
          {isComparisonMode ? 'Single View' : 'Compare Models'}
        </button>
      </div>
    </header>

    <main className="main-container">
      <StatisticsCards />
      
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'trend' ? 'active' : ''}`}
          onClick={() => setActiveTab('trend')}
        >
          Trend Analysis
        </button>
        <button
          className={`tab-button ${activeTab === 'distribution' ? 'active' : ''}`}
          onClick={() => setActiveTab('distribution')}
        >
          Distribution
        </button>
        <button
          className={`tab-button ${activeTab === 'scatter' ? 'active' : ''}`}
          onClick={() => setActiveTab('scatter')}
        >
          Engine Analysis
        </button>
        <button
          className={`tab-button ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Details
        </button>
      </div>

      {!isComparisonMode ? (
        <div>
          <FilterSection 
            filters={selectedFilters1}
            setFilters={setSelectedFilters1}
            setFilteredData={setFilteredData1}
            label="Filter Data"
          />
          <div className="chart-container">
            {activeTab === 'trend' && (
              <FuelEconomyLineChart data={filteredData1} mpgType={selectedFilters1.mpgType} />
            )}
            {activeTab === 'distribution' && (
              <DivisionBarChart data={filteredData1} />
            )}
            {activeTab === 'scatter' && (
              <EngineDisplacementScatterPlot data={filteredData1} mpgType={selectedFilters1.mpgType} />
            )}
            {activeTab === 'stats' && (
              <StatisticsTab data={filteredData1} />
            )}
          </div>
        </div>
      ) : (
        <div className="comparison-container">
          <div>
            <FilterSection 
              filters={selectedFilters1}
              setFilters={setSelectedFilters1}
              setFilteredData={setFilteredData1}
              label="Dataset 1"
            />
            <div className="chart-container">
              {activeTab === 'trend' && (
                <FuelEconomyLineChart data={filteredData1} mpgType={selectedFilters1.mpgType} />
              )}
              {activeTab === 'distribution' && (
                <DivisionBarChart data={filteredData1} />
              )}
              {activeTab === 'scatter' && (
                <EngineDisplacementScatterPlot data={filteredData1} mpgType={selectedFilters1.mpgType} />
              )}
              {activeTab === 'stats' && (
                <StatisticsTab data={filteredData1} />
              )}
            </div>
          </div>
          <div>
            <FilterSection 
              filters={selectedFilters2}
              setFilters={setSelectedFilters2}
              setFilteredData={setFilteredData2}
              label="Dataset 2"
            />
            <div className="chart-container">
              {activeTab === 'trend' && (
                <FuelEconomyLineChart data={filteredData2} mpgType={selectedFilters2.mpgType} />
              )}
              {activeTab === 'distribution' && (
                <DivisionBarChart data={filteredData2} />
              )}
              {activeTab === 'scatter' && (
                <EngineDisplacementScatterPlot data={filteredData2} mpgType={selectedFilters2.mpgType} />
              )}
              {activeTab === 'stats' && (
                <StatisticsTab data={filteredData2} />
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  </div>
);
}

export default App;
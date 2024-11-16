import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const DivisionBarChart = ({ data }) => {
  // Group data by division and calculate average city and highway MPG
  const divisionGroups = data.reduce((acc, vehicle) => {
    const division = vehicle['Division'];
    const cityMPG = parseFloat(vehicle['City FE (Guide) - Conventional Fuel']);
    const highwayMPG = parseFloat(vehicle['Hwy FE (Guide) - Conventional Fuel']);

    if (!isNaN(cityMPG) && !isNaN(highwayMPG)) {
      if (!acc[division]) {
        acc[division] = { totalCityMPG: 0, totalHighwayMPG: 0, count: 0 };
      }
      acc[division].totalCityMPG += cityMPG;
      acc[division].totalHighwayMPG += highwayMPG;
      acc[division].count += 1;
    }

    return acc;
  }, {});

  const divisions = Object.keys(divisionGroups).sort();
  const averageCityMPG = divisions.map(division => {
    const { totalCityMPG, count } = divisionGroups[division];
    return totalCityMPG / count;
  });
  const averageHighwayMPG = divisions.map(division => {
    const { totalHighwayMPG, count } = divisionGroups[division];
    return totalHighwayMPG / count;
  });

  const chartData = {
    labels: divisions,
    datasets: [
      {
        label: 'Average City MPG',
        data: averageCityMPG,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: 'Average Highway MPG',
        data: averageHighwayMPG,
        backgroundColor: 'rgba(255, 206, 86, 0.6)',
        borderColor: 'rgba(255, 206, 86, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Average City and Highway MPG Across Divisions',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Division',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Average MPG',
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default DivisionBarChart;

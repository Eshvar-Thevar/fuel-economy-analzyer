import React from 'react';
import { Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const EngineDisplacementScatterPlot = ({ data, mpgType }) => {
  const scatterData = data.map(vehicle => ({
    x: parseFloat(vehicle['Eng Displ']),
    y: mpgType === 'City'
      ? parseFloat(vehicle['City FE (Guide) - Conventional Fuel'])
      : mpgType === 'Highway'
      ? parseFloat(vehicle['Hwy FE (Guide) - Conventional Fuel'])
      : parseFloat(vehicle['Comb FE (Guide) - Conventional Fuel']),
  })).filter(point => !isNaN(point.x) && !isNaN(point.y)); // Filter out invalid data points

  const chartData = {
    datasets: [
      {
        label: `${mpgType} MPG vs Engine Displacement`,
        data: scatterData,
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: `${mpgType} MPG vs Engine Displacement`,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Engine Displacement (L)',
        },
      },
      y: {
        title: {
          display: true,
          text: `${mpgType} MPG`,
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <Scatter data={chartData} options={options} />
    </div>
  );
};

export default EngineDisplacementScatterPlot;

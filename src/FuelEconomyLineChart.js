import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const FuelEconomyLineChart = ({ data, mpgType }) => {
  // Group data by year and calculate the average MPG for each year
  const yearGroups = data.reduce((acc, vehicle) => {
    const year = vehicle['Model Year'];
    const mpgValue = mpgType === 'City'
      ? parseFloat(vehicle['City FE (Guide) - Conventional Fuel'])
      : mpgType === 'Highway'
      ? parseFloat(vehicle['Hwy FE (Guide) - Conventional Fuel'])
      : parseFloat(vehicle['Comb FE (Guide) - Conventional Fuel']);

    if (!isNaN(mpgValue)) {
      if (!acc[year]) {
        acc[year] = { totalMPG: 0, count: 0 };
      }
      acc[year].totalMPG += mpgValue;
      acc[year].count += 1;
    }

    return acc;
  }, {});

  const labels = Object.keys(yearGroups).sort();
  const averageMPG = labels.map(year => {
    const { totalMPG, count } = yearGroups[year];
    return totalMPG / count;
  });

  // Determine min and max MPG for better y-axis scaling
  const minMPG = Math.min(...averageMPG) - 2; // Add buffer for visual clarity
  const maxMPG = Math.max(...averageMPG) + 2; // Add buffer for visual clarity

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: `Average ${mpgType} MPG`,
        data: averageMPG,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: `Average ${mpgType} MPG Over the Years`,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Year',
        },
      },
      y: {
        title: {
          display: true,
          text: 'MPG',
        },
        beginAtZero: false,
        min: minMPG > 0 ? minMPG : 0, // Ensure y-axis doesn't go below zero
        max: maxMPG,
      },
    },
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default FuelEconomyLineChart;

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TopTypesChartProps {
  reportsByType: Record<string, number>;
}

const TopTypesChart: React.FC<TopTypesChartProps> = ({ reportsByType }) => {
  // Convertir en format pour le graphique et prendre les 5 premiers
  const data = Object.entries(reportsByType)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded shadow mb-6">
      <h2 className="text-xl font-bold mb-3">Top types de signalements</h2>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="type" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" name="Nombre de signalements" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TopTypesChart;
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TypeDistributionProps {
  reportsByType: Record<string, number>;
}

const TypeDistribution: React.FC<TypeDistributionProps> = ({ reportsByType }) => {
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // Préparer les données pour le graphique en camembert
  const pieData = Object.entries(reportsByType).map(([type, value], index) => ({
    name: type,
    value,
    color: COLORS[index % COLORS.length]
  }));

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
      <h2 className="text-xl font-bold mb-3">Répartition par type</h2>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius="70%"
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={(entry) => entry.name}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value} signalements`, 'Quantité']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TypeDistribution;
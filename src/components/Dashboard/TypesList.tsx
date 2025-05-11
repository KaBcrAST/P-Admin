import React from 'react';

interface TypesListProps {
  reportsByType: Record<string, number>;
}

const TypesList: React.FC<TypesListProps> = ({ reportsByType }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded shadow mb-6">
      <h2 className="text-xl font-bold mb-3">Types de signalements</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.entries(reportsByType).map(([type, count]) => (
          <div key={type} className="bg-gray-100 dark:bg-gray-700 p-3 rounded">
            <p className="font-medium">{type}</p>
            <p className="text-lg">{count} signalements</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TypesList;
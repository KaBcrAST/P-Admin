import React from 'react';

interface ReportsFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  typeFilter: string;
  setTypeFilter: (type: string) => void;
  uniqueTypes: string[];
  onResetFilters: () => void;
}

const ReportsFilters: React.FC<ReportsFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  typeFilter,
  setTypeFilter,
  uniqueTypes,
  onResetFilters
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded shadow mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="search" className="block mb-2 text-sm font-medium">
            Rechercher
          </label>
          <input
            id="search"
            type="text"
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div>
          <label htmlFor="typeFilter" className="block mb-2 text-sm font-medium">
            Filtrer par type
          </label>
          <select
            id="typeFilter"
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">Tous les types</option>
            {uniqueTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-end">
          <button 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 ml-auto"
            onClick={onResetFilters}
          >
            Réinitialiser les filtres
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportsFilters;
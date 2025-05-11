import React from 'react';

interface UsersSearchProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  count: number;
}

const UsersSearch: React.FC<UsersSearchProps> = ({ searchTerm, setSearchTerm, count }) => {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="relative w-full md:w-64">
        <input
          type="text"
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <svg className="w-5 h-5 text-gray-400 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
      </div>
      
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {count} utilisateur{count > 1 ? 's' : ''} trouvé{count > 1 ? 's' : ''}
        {searchTerm && ` pour "${searchTerm}"`}
      </div>
    </div>
  );
};

export default UsersSearch;
import React from 'react';
import { Report } from '../../services/reportService';

interface ReportsStatsProps {
  totalReports: number;
  filteredReports: Report[];
  uniqueTypesCount: number;
}

const ReportsStats: React.FC<ReportsStatsProps> = ({ 
  totalReports, 
  filteredReports,
  uniqueTypesCount
}) => {
  // Calculer le total des upvotes
  const totalUpvotes = filteredReports.reduce((sum, report) => sum + (report.upvotes || 0), 0);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded shadow mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
        <div>
          <p className="text-gray-500 dark:text-gray-300">Total</p>
          <p className="text-2xl font-bold">{totalReports}</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-300">Filtrés</p>
          <p className="text-2xl font-bold">{filteredReports.length}</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-300">Types</p>
          <p className="text-2xl font-bold">{uniqueTypesCount}</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-300">Upvotes total</p>
          <p className="text-2xl font-bold">{totalUpvotes}</p>
        </div>
      </div>
    </div>
  );
};

export default ReportsStats;
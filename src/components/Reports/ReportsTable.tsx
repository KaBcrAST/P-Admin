import React from 'react';
import { format, parseISO } from 'date-fns';
import { Report } from '../../services/reportService';

interface ReportsTableProps {
  filteredReports: Report[];
  sortConfig: { key: string; direction: 'asc' | 'desc' };
  requestSort: (key: string) => void;
  totalReports: number;
}

const ReportsTable: React.FC<ReportsTableProps> = ({
  filteredReports,
  sortConfig,
  requestSort,
  totalReports
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
      {filteredReports.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                <HeaderCell 
                  title="ID" 
                  field="_id" 
                  sortConfig={sortConfig} 
                  requestSort={requestSort} 
                />
                <HeaderCell 
                  title="Type" 
                  field="type" 
                  sortConfig={sortConfig} 
                  requestSort={requestSort} 
                />
                <HeaderCell 
                  title="Date" 
                  field="createdAt" 
                  sortConfig={sortConfig} 
                  requestSort={requestSort} 
                />
                <HeaderCell 
                  title="Upvotes" 
                  field="upvotes" 
                  sortConfig={sortConfig} 
                  requestSort={requestSort} 
                />
                <th className="px-4 py-2 text-left">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredReports.map((report) => (
                <ReportRow key={report._id} report={report} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Aucun signalement trouvé avec les filtres actuels
        </div>
      )}

      {/* Pagination (pourrait être implémentée dans une future version) */}
      {filteredReports.length > 0 && (
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Affichage de {filteredReports.length} signalements sur {totalReports}
        </div>
      )}
    </div>
  );
};

// Sous-composants pour le tableau
const HeaderCell: React.FC<{
  title: string;
  field: string;
  sortConfig: { key: string; direction: 'asc' | 'desc' };
  requestSort: (key: string) => void;
}> = ({ title, field, sortConfig, requestSort }) => {
  return (
    <th 
      className="px-4 py-2 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
      onClick={() => requestSort(field)}
    >
      {title} {sortConfig.key === field && (
        sortConfig.direction === 'asc' ? '↑' : '↓'
      )}
    </th>
  );
};

const ReportRow: React.FC<{ report: Report }> = ({ report }) => {
  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
      <td className="px-4 py-2 text-sm font-mono">
        {report._id.substring(0, 8)}...
      </td>
      <td className="px-4 py-2">
        <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 py-1 px-2 rounded">
          {report.type}
        </span>
      </td>
      <td className="px-4 py-2">
        {report.date || report.createdAt ? 
          format(parseISO(report.date || report.createdAt || ''), 'dd/MM/yyyy HH:mm') : 
          'Date inconnue'}
      </td>
      <td className="px-4 py-2">
        {report.upvotes || 0}
      </td>
      <td className="px-4 py-2">
        {report.location?.coordinates ? (
          <a 
            href={`https://www.google.com/maps?q=${report.location.coordinates[1]},${report.location.coordinates[0]}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            Voir sur la carte
          </a>
        ) : 'N/A'}
      </td>
    </tr>
  );
};

export default ReportsTable;
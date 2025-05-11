import React from 'react';
import { format, parseISO } from 'date-fns';
import { Report } from '../../services/reportService';

interface RecentReportsProps {
  reports: Report[];
}

const RecentReports: React.FC<RecentReportsProps> = ({ reports }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
      <h2 className="text-xl font-bold mb-3">Signalements récents</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Upvotes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {reports.map((report) => (
              <tr key={report._id}>
                <td className="px-4 py-2">{report.type}</td>
                <td className="px-4 py-2">
                  {format(parseISO(report.date || report.createdAt || ''), 'dd/MM/yyyy HH:mm')}
                </td>
                <td className="px-4 py-2">{report.upvotes || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentReports;
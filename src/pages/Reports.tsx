import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import reportService, { Report } from '../services/reportService';

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'createdAt',
    direction: 'desc'
  });

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const data = await reportService.getAllReports();
        if (!Array.isArray(data)) {
          throw new Error("Les données reçues ne sont pas un tableau");
        }
        setReports(data);
        setFilteredReports(data);
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement des signalements', err);
        setError('Impossible de charger les signalements. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  useEffect(() => {
    // Filtrer et trier les signalements à chaque changement
    let result = [...reports];

    // Appliquer le filtre par type
    if (typeFilter) {
      result = result.filter(report => report.type === typeFilter);
    }

    // Appliquer la recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(report => 
        report.type?.toLowerCase().includes(term) ||
        report._id?.toLowerCase().includes(term)
      );
    }

    // Appliquer le tri
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof Report];
        const bValue = b[sortConfig.key as keyof Report];
        
        if (sortConfig.key === 'createdAt' || sortConfig.key === 'date') {
          const dateA = aValue ? new Date(aValue as string).getTime() : 0;
          const dateB = bValue ? new Date(bValue as string).getTime() : 0;
          
          return sortConfig.direction === 'asc' 
            ? dateA - dateB 
            : dateB - dateA;
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredReports(result);
  }, [reports, searchTerm, typeFilter, sortConfig]);

  // Obtenir les types uniques pour le filtre
  const uniqueTypes = Array.from(new Set(reports.map(report => report.type))).filter(Boolean);

  // Fonction pour trier
  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-xl">Chargement des signalements...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-500 text-center">
        <p className="text-xl mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Signalements</h1>
      
      {/* Filtres et recherche */}
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
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('');
                setSortConfig({ key: 'createdAt', direction: 'desc' });
              }}
            >
              Réinitialiser les filtres
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-gray-500 dark:text-gray-300">Total</p>
            <p className="text-2xl font-bold">{reports.length}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-300">Filtrés</p>
            <p className="text-2xl font-bold">{filteredReports.length}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-300">Types</p>
            <p className="text-2xl font-bold">{uniqueTypes.length}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-300">Upvotes total</p>
            <p className="text-2xl font-bold">
              {filteredReports.reduce((sum, report) => sum + (report.upvotes || 0), 0)}
            </p>
          </div>
        </div>
      </div>
      
      {/* Tableau des signalements */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
        {filteredReports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700">
                  <th 
                    className="px-4 py-2 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => requestSort('_id')}
                  >
                    ID {sortConfig.key === '_id' && (
                      sortConfig.direction === 'asc' ? '↑' : '↓'
                    )}
                  </th>
                  <th 
                    className="px-4 py-2 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => requestSort('type')}
                  >
                    Type {sortConfig.key === 'type' && (
                      sortConfig.direction === 'asc' ? '↑' : '↓'
                    )}
                  </th>
                  <th 
                    className="px-4 py-2 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => requestSort('createdAt')}
                  >
                    Date {sortConfig.key === 'createdAt' && (
                      sortConfig.direction === 'asc' ? '↑' : '↓'
                    )}
                  </th>
                  <th 
                    className="px-4 py-2 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => requestSort('upvotes')}
                  >
                    Upvotes {sortConfig.key === 'upvotes' && (
                      sortConfig.direction === 'asc' ? '↑' : '↓'
                    )}
                  </th>
                  <th className="px-4 py-2 text-left">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredReports.map((report) => (
                  <tr key={report._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
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
            Affichage de {filteredReports.length} signalements sur {reports.length}
          </div>
        )}
      </div>
    </div>
  );
}
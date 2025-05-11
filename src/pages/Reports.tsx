import React, { useState, useEffect } from 'react';
import reportService, { Report } from '../services/reportService';
import LoadingState from '../components/Common/LoadingState';
import ErrorState from '../components/Common/ErrorState';
import ReportsFilters from '../components/Reports/ReportsFilters';
import ReportsStats from '../components/Reports/ReportsStats';
import ReportsTable from '../components/Reports/ReportsTable';

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

  // Obtenir les types uniques pour le filtre
  const uniqueTypes = Array.from(new Set(reports.map(report => report.type))).filter(Boolean) as string[];

  // Charger les données au montage du composant
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

  // Filtrer et trier les signalements
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

  // Fonction pour trier
  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setSearchTerm('');
    setTypeFilter('');
    setSortConfig({ key: 'createdAt', direction: 'desc' });
  };

  // Afficher le chargement si les données sont en cours de chargement
  if (loading) {
    return <LoadingState message="Chargement des signalements..." />;
  }

  // Afficher l'erreur s'il y en a une
  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  // Afficher les données une fois chargées
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Signalements</h1>
      
      {/* Filtres et recherche */}
      <ReportsFilters 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        uniqueTypes={uniqueTypes}
        onResetFilters={resetFilters}
      />

      {/* Statistiques */}
      <ReportsStats 
        totalReports={reports.length} 
        filteredReports={filteredReports} 
        uniqueTypesCount={uniqueTypes.length}
      />
      
      {/* Tableau des signalements */}
      <ReportsTable 
        filteredReports={filteredReports} 
        sortConfig={sortConfig}
        requestSort={requestSort}
        totalReports={reports.length}
      />
    </div>
  );
}
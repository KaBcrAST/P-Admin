import React, { useState, useEffect } from 'react';
import reportService, { Report } from '../services/reportService';
import { format, parseISO, subDays } from 'date-fns';

import CardStats from '../components/Dashboard/CardStats';
import EvolutionChart from '../components/Dashboard/EvolutionChart';
import TypeDistribution from '../components/Dashboard/TypeDistribution';
import TypesList from '../components/Dashboard/TypesList';
import TopTypesChart from '../components/Dashboard/TopTypesChart';
import RecentReports from '../components/Dashboard/RecentReports';
import LoadingState from '../components/Common/LoadingState';

const Dashboard: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [todayReports, setTodayReports] = useState<Report[]>([]);
  const [reportsByDay, setReportsByDay] = useState<any[]>([]);
  const [reportsByType, setReportsByType] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReportData = async () => {
      try {
        setLoading(true);
        
        const fetchedReports = await reportService.getAllReports();
        
        if (!fetchedReports || fetchedReports.length === 0) {
          setError("Aucun signalement trouvé.");
          return;
        }
        
        setReports(fetchedReports);
        
        const today = fetchedReports.filter(report => 
          reportService.isReportFromToday(report)
        );
        setTodayReports(today);
        
        // Préparer les données pour les graphiques par jour
        prepareReportsByDay(fetchedReports);
        
        // Calculer les types de signalements
        const typesData = calculateReportsByType(fetchedReports);
        setReportsByType(typesData);
        
        setError(null);
      } catch (error) {
        console.error('Erreur lors du chargement des données', error);
        setError('Impossible de charger les données. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };

    loadReportData();
  }, []);

  // Prépare les données pour le graphique d'évolution des signalements
  const prepareReportsByDay = (reports: Report[]) => {
    // Récupérer les 30 derniers jours
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      return format(date, 'yyyy-MM-dd');
    });
    
    // Compter les signalements par jour
    const countsByDay: Record<string, number> = {};
    
    // Initialiser les 30 derniers jours à 0
    last30Days.forEach(day => {
      countsByDay[day] = 0;
    });
    
    // Compter les signalements par jour
    reports.forEach(report => {
      const date = report.date || report.createdAt || '';
      if (date) {
        const day = format(parseISO(date), 'yyyy-MM-dd');
        if (countsByDay[day] !== undefined) {
          countsByDay[day] += 1;
        }
      }
    });
    
    // Convertir en tableau pour recharts
    const data = Object.entries(countsByDay).map(([date, count]) => ({
      date: format(parseISO(date), 'dd/MM'),
      count
    }));
    
    setReportsByDay(data);
  };

  // Calculer les types de signalements
  const calculateReportsByType = (reports: Report[]): Record<string, number> => {
    return reports.reduce((acc, report) => {
      const type = report.type || 'inconnu';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  };

  if (loading) {
    return <LoadingState message="Chargement des données..." />;
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
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Statistiques principales */}
      <CardStats 
        totalReports={reports.length} 
        todayReports={todayReports.length} 
        uniqueTypes={Object.keys(reportsByType).length} 
      />

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <EvolutionChart data={reportsByDay} />
        <TypeDistribution reportsByType={reportsByType} />
      </div>

      {/* Types de signalements */}
      <TypesList reportsByType={reportsByType} />

      {/* Graphique en barres des top types */}
      <TopTypesChart reportsByType={reportsByType} />

      {/* Tableau des signalements récents */}
      <RecentReports reports={reports.slice(0, 10)} />
    </div>
  );
};

export default Dashboard;

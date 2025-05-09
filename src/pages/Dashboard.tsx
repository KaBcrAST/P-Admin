import React, { useState, useEffect } from 'react';
import CardStat from '../components/CardStat';
import reportService, { Report } from '../services/reportService';
import { format, parseISO, subDays } from 'date-fns';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const Dashboard: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [todayReports, setTodayReports] = useState<Report[]>([]);
  const [reportsByDay, setReportsByDay] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  useEffect(() => {
    const loadReportData = async () => {
      try {
        setLoading(true);
        
        // Utiliser le service pour récupérer les données
        const fetchedReports = await reportService.getAllReports();
        
        if (!fetchedReports || fetchedReports.length === 0) {
          setError("Aucun signalement trouvé.");
          return;
        }
        
        setReports(fetchedReports);
        
        // Filtrer les signalements du jour
        const today = fetchedReports.filter(report => 
          reportService.isReportFromToday(report)
        );
        setTodayReports(today);
        
        // Préparer les données pour les graphiques par jour
        prepareReportsByDay(fetchedReports);
        
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
  const reportsByType = reports.reduce((acc, report) => {
    const type = report.type || 'inconnu';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Préparer les données pour le graphique en camembert
  const pieData = Object.entries(reportsByType).map(([type, value], index) => ({
    name: type,
    value,
    color: COLORS[index % COLORS.length]
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-xl">Chargement des données...</p>
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
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <CardStat title="Total Signalements" value={reports.length.toString()} />
        <CardStat title="Aujourd'hui" value={todayReports.length.toString()} />
        <CardStat title="Types Uniques" value={Object.keys(reportsByType).length.toString()} />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Graphique d'évolution des signalements */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
          <h2 className="text-xl font-bold mb-3">Évolution des signalements</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reportsByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Signalements"
                  stroke="#8884d8"
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graphique en camembert par type */}
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
      </div>

      {/* Types de signalements */}
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

      {/* Graphique en barres des top types */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow mb-6">
        <h2 className="text-xl font-bold mb-3">Top types de signalements</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={Object.entries(reportsByType)
                .map(([type, count]) => ({ type, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5)}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" name="Nombre de signalements" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tableau des signalements récents */}
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
              {reports.slice(0, 10).map((report) => (
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
    </div>
  );
};

export default Dashboard;

import axios from 'axios';
import { isToday, parseISO } from 'date-fns';

// Types
export interface Report {
  _id: string;
  type: string;
  localisation?: string;
  status?: string;
  date?: string;
  createdAt?: string;
  upvotes?: number;
  location: {
    type: string;
    coordinates: [number, number];
  };
}

const API_BASE_URL = 'https://react-gpsapi.vercel.app/api';

const reportService = {
  /**
   * Récupère tous les signalements
   */
  getAllReports: async (): Promise<Report[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/reports/all`);
      
      // Vérifier structure de la réponse et assurer qu'on retourne bien un tableau
      console.log("API response:", response.data);
      
      // Si la réponse contient une propriété 'reports' ou une autre clé, extraire le tableau
      if (response.data && typeof response.data === 'object') {
        // Si la réponse est un objet avec une propriété qui contient le tableau
        if (Array.isArray(response.data.reports)) {
          return response.data.reports;
        }
        // Si la réponse est directement un tableau
        else if (Array.isArray(response.data)) {
          return response.data;
        }
        // Si la réponse est un objet avec d'autres propriétés, essayer de trouver un tableau
        else {
          for (const key in response.data) {
            if (Array.isArray(response.data[key])) {
              return response.data[key];
            }
          }
        }
      }
      
      // Si on ne trouve pas de tableau, retourner un tableau vide
      console.error("La réponse de l'API n'est pas un tableau:", response.data);
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération de tous les signalements', error);
      return []; // Retourner un tableau vide en cas d'erreur
    }
  },

  /**
   * Récupère les signalements à proximité
   */
  getNearbyReports: async (): Promise<Report[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/reports`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des signalements à proximité', error);
      throw error;
    }
  },

  /**
   * Récupère les signalements avec des statistiques supplémentaires
   */
  getReportStats: async (params?: { startDate?: string; endDate?: string; type?: string }): Promise<any> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/reportstats`, { params });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques', error);
      throw error;
    }
  },
  
  /**
   * Vérifie si un signalement est d'aujourd'hui
   */
  isReportFromToday: (report: Report): boolean => {
    if (!report) return false;
    
    const dateField = report.date || (report.createdAt as string);
    if (!dateField) return false;
    
    try {
      return isToday(parseISO(dateField));
    } catch (error) {
      console.error('Erreur lors de la vérification de la date', error);
      return false;
    }
  }
};

export default reportService;
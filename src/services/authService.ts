// Version corrigée du service d'authentification
import axios from 'axios';
import sha256 from 'crypto-js/sha256';

const API_URL = 'https://react-gpsapi.vercel.app/api';

export interface LoginResponse {
  token: string;
  user?: {
    id: string;
    email: string;
    role: string;
  }
}

const authService = {
  login: async (email: string, password: string, requireAdmin: boolean = true): Promise<LoginResponse> => {
    try {
      console.log('Tentative de connexion avec:', email);
      
      // Hacher le mot de passe
      const hashedPassword = sha256(password).toString();
      
      // Envoyer la requête d'authentification
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password: hashedPassword
      });
      
      console.log('Réponse du serveur:', response.data);
      
      // Vérification du rôle admin APRÈS un login réussi
      if (requireAdmin && response.data.user && response.data.user.role !== 'admin') {
        console.error('Utilisateur connecté mais pas admin:', response.data.user);
        localStorage.setItem('lastLoginError', 'Accès réservé aux administrateurs');
        throw new Error('Accès réservé aux administrateurs');
      }
      
      // Stocker le token et l'état d'authentification
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user || {}));
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.removeItem('lastLoginError'); // Effacer les erreurs précédentes
        
        // Configure axios pour inclure le token dans les futures requêtes
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Login failed:', error);
      
      // Journaliser l'erreur de façon plus détaillée
      if (error.response) {
        // La requête a été faite et le serveur a répondu avec un code d'état
        console.error('Erreur détaillée:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      } else if (error.request) {
        // La requête a été faite mais aucune réponse n'a été reçue
        console.error('Pas de réponse du serveur:', error.request);
      }
      
      throw error;
    }
  },
  
  logout: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    delete axios.defaults.headers.common['Authorization'];
  },
  
  isAuthenticated: (): boolean => {
    return localStorage.getItem('isAuthenticated') === 'true';
  },
  
  isAdmin: (): boolean => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user && user.role === 'admin';
    } catch (e) {
      return false;
    }
  },
  
  getToken: (): string | null => {
    return localStorage.getItem('token');
  },
  
  getLastLoginError: (): string | null => {
    return localStorage.getItem('lastLoginError');
  },
  
  setupAxios: (): void => {
    // Configure axios au démarrage avec le token s'il existe
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }
};

export default authService;
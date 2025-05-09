import React, { useState, useEffect } from "react";
import axios from "axios";
import authService from "../services/authService";

// Mettre à jour l'interface User pour utiliser _id au lieu de id
interface User {
  _id: string; // Changez cette ligne de id à _id
  name: string;
  email: string;
  role: string;
  lastLogin?: Date;
  createdAt?: Date;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Utiliser la même URL d'API que dans authService
  const API_URL = 'https://react-gpsapi.vercel.app/api';
  
  // Récupérer la liste des utilisateurs
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        
        // Récupérer le token actuel
        const token = authService.getToken();
        if (!token) {
          setError("Session expirée, veuillez vous reconnecter");
          setLoading(false);
          return;
        }
        
        // Configurer les entêtes avec le token JWT
        const axiosConfig = {
          headers: { Authorization: `Bearer ${token}` }
        };
        
        console.log("Récupération des utilisateurs depuis:", `${API_URL}/users`);
        const response = await axios.get(`${API_URL}/auth/users`, axiosConfig);
        
        console.log("Réponse:", response.data);
        
        if (response.data.success) {
          setUsers(response.data.users);
        } else {
          setError("Impossible de récupérer la liste des utilisateurs");
        }
      } catch (err: any) {
        console.error("Erreur lors du chargement des utilisateurs:", err);
        
        // Gestion détaillée des erreurs
        if (err.response) {
          console.error("Erreur API:", {
            status: err.response.status,
            data: err.response.data
          });
          
          // Si erreur 401 ou 403, c'est un problème d'authentification
          if (err.response.status === 401 || err.response.status === 403) {
            setError("Accès non autorisé. Veuillez vous reconnecter.");
            setTimeout(() => {
              authService.logout();
              window.location.href = '/login';
            }, 2000);
          } else {
            setError(err.response.data?.message || "Erreur lors de la récupération des utilisateurs");
          }
        } else if (err.code === 'ERR_NETWORK') {
          setError("Erreur réseau: Impossible de contacter le serveur");
        } else {
          setError("Erreur lors de la récupération des utilisateurs");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Promouvoir un utilisateur au rôle admin
  const promoteToAdmin = async (userId: string) => {
    try {
      setActionInProgress(userId);
      
      // Récupérer le token actuel
      const token = authService.getToken();
      if (!token) {
        setError("Session expirée, veuillez vous reconnecter");
        return;
      }
      
      // Configurer les entêtes avec le token JWT
      const axiosConfig = {
        headers: { Authorization: `Bearer ${token}` }
      };
      
      // Utiliser _id au lieu de id si c'est ce qu'attend votre API MongoDB
      // Adaptation de l'URL selon la structure attendue par votre API
      const response = await axios.put(`${API_URL}/auth/promote/${userId}`, {}, axiosConfig);
      
      if (response.data.success) {
        // Mettre à jour l'utilisateur dans la liste locale
        setUsers(users.map(user => 
          user._id === userId ? { ...user, role: 'admin' } : user
        ));
        // Effacer tout message d'erreur précédent
        setError("");
      }
    } catch (err: any) {
      console.error("Erreur lors de la promotion:", err);
      
      // Message d'erreur plus détaillé
      if (err.response?.status === 400) {
        setError("ID utilisateur invalide ou mal formaté");
      } else if (err.response?.status === 404) {
        setError("Utilisateur non trouvé");
      } else {
        setError(err.response?.data?.message || "Erreur lors de la promotion de l'utilisateur");
      }
    } finally {
      setActionInProgress(null);
    }
  };

  // Rétrograder un admin au rôle user
  const demoteToUser = async (userId: string) => {
    try {
      setActionInProgress(userId);
      
      // Récupérer le token actuel
      const token = authService.getToken();
      if (!token) {
        setError("Session expirée, veuillez vous reconnecter");
        return;
      }
      
      // Configurer les entêtes avec le token JWT
      const axiosConfig = {
        headers: { Authorization: `Bearer ${token}` }
      };
      
      // Utiliser _id au lieu de id si c'est ce qu'attend votre API MongoDB
      const response = await axios.put(`${API_URL}/auth/demote/${userId}`, {}, axiosConfig);
      
      if (response.data.success) {
        // Mettre à jour l'utilisateur dans la liste locale
        setUsers(users.map(user => 
          user._id === userId ? { ...user, role: 'user' } : user
        ));
        // Effacer tout message d'erreur précédent
        setError("");
      }
    } catch (err: any) {
      console.error("Erreur lors de la rétrogradation:", err);
      
      // Message d'erreur plus détaillé
      if (err.response?.status === 400) {
        setError("ID utilisateur invalide ou mal formaté");
      } else if (err.response?.status === 404) {
        setError("Utilisateur non trouvé");
      } else {
        setError(err.response?.data?.message || "Erreur lors de la rétrogradation de l'administrateur");
      }
    } finally {
      setActionInProgress(null);
    }
  };

  // Formater une date
  const formatDate = (dateString?: Date) => {
    if (!dateString) return "Jamais";
    const date = new Date(dateString);
    return date.toLocaleString("fr-FR");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Utilisateurs</h1>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 dark:bg-red-900/50 dark:border-red-700 dark:text-red-200">
          <p>{error}</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="py-3 px-4 text-left">Nom</th>
              <th className="py-3 px-4 text-left">Email</th>
              <th className="py-3 px-4 text-left">Rôle</th>
              <th className="py-3 px-4 text-left">Dernière connexion</th>
              <th className="py-3 px-4 text-left">Date d'inscription</th>
              <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="py-3 px-4">{user.name || "Non défini"}</td>
                <td className="py-3 px-4">{user.email}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    user.role === "admin" 
                      ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" 
                      : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  }`}>
                    {user.role || "user"}
                  </span>
                </td>
                <td className="py-3 px-4">{formatDate(user.lastLogin)}</td>
                <td className="py-3 px-4">{formatDate(user.createdAt)}</td>
                <td className="py-3 px-4">
                  {user.role === "admin" ? (
                    <button
                      onClick={() => demoteToUser(user._id)} // Utiliser _id ici
                      disabled={actionInProgress === user._id} // Et ici
                      className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
                    >
                      {actionInProgress === user._id ? "..." : "Rétrograder"} // Et ici
                    </button>
                  ) : (
                    <button
                      onClick={() => promoteToAdmin(user._id)}
                      disabled={actionInProgress === user._id}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {actionInProgress === user._id ? "..." : "Promouvoir"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {users.length === 0 && !loading && !error && (
        <div className="text-center py-8 text-gray-500">
          Aucun utilisateur trouvé.
        </div>
      )}
    </div>
  );
}
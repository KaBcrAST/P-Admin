import React, { useState, useEffect, useMemo } from "react";
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

// Type pour les options de tri
type SortField = 'name' | 'email' | 'role' | 'lastLogin' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  
  // États pour la recherche et le tri
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

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
        
        console.log("Récupération des utilisateurs depuis:", `${API_URL}/auth/users`);
        const response = await axios.get(`${API_URL}/auth/users`, axiosConfig);
        
        console.log("Réponse:", response.data);
        
        if (response.data.success) {
          // Afficher le premier utilisateur pour le débogage
          if (response.data.users.length > 0) {
            console.log("Format d'un utilisateur:", response.data.users[0]);
          }
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
      
      // Utiliser _id pour l'API MongoDB
      console.log("Promotion d'utilisateur avec ID:", userId);
      console.log("Type d'ID:", typeof userId, "Longueur:", userId.length);
      
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
      
      // Utiliser _id pour l'API MongoDB
      console.log("Rétrogradation d'utilisateur avec ID:", userId);
      console.log("Type d'ID:", typeof userId, "Longueur:", userId.length);
      
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

  // Gérer le changement de tri
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Si on clique sur le même champ, on inverse l'ordre
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Sinon on trie par le nouveau champ en ordre ascendant
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Obtenir une flèche indiquant le sens du tri
  const getSortArrow = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  };

  // Formater une date
  const formatDate = (dateString?: Date) => {
    if (!dateString) return "Jamais";
    const date = new Date(dateString);
    return date.toLocaleString("fr-FR");
  };

  // Filtrer et trier les utilisateurs (avec useMemo pour l'optimisation des performances)
  const filteredAndSortedUsers = useMemo(() => {
    // Filtrer d'abord par terme de recherche
    let result = users.filter(user => 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Puis trier selon le champ et l'ordre choisis
    return result.sort((a, b) => {
      let fieldA: any = a[sortField];
      let fieldB: any = b[sortField];
      
      // Gestion spéciale pour les dates
      if (sortField === 'lastLogin' || sortField === 'createdAt') {
        fieldA = fieldA ? new Date(fieldA).getTime() : 0;
        fieldB = fieldB ? new Date(fieldB).getTime() : 0;
      } 
      // Gestion des champs texte (conversion à lowercase pour tri insensible à la casse)
      else if (typeof fieldA === 'string' && typeof fieldB === 'string') {
        fieldA = fieldA.toLowerCase();
        fieldB = fieldB.toLowerCase();
      }
      
      if (fieldA < fieldB) return sortOrder === 'asc' ? -1 : 1;
      if (fieldA > fieldB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [users, searchTerm, sortField, sortOrder]);

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

      {/* Barre de recherche et compteur */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <svg className="w-5 h-5 text-gray-400 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>
        
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {filteredAndSortedUsers.length} utilisateur{filteredAndSortedUsers.length > 1 ? 's' : ''} trouvé{filteredAndSortedUsers.length > 1 ? 's' : ''}
          {searchTerm && ` pour "${searchTerm}"`}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th 
                className="py-3 px-4 text-left cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                onClick={() => handleSort('name')}
              >
                Nom {getSortArrow('name')}
              </th>
              <th 
                className="py-3 px-4 text-left cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                onClick={() => handleSort('email')}
              >
                Email {getSortArrow('email')}
              </th>
              <th 
                className="py-3 px-4 text-left cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                onClick={() => handleSort('role')}
              >
                Rôle {getSortArrow('role')}
              </th>
              <th 
                className="py-3 px-4 text-left cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                onClick={() => handleSort('lastLogin')}
              >
                Dernière connexion {getSortArrow('lastLogin')}
              </th>
              <th 
                className="py-3 px-4 text-left cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                onClick={() => handleSort('createdAt')}
              >
                Date d'inscription {getSortArrow('createdAt')}
              </th>
              <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {filteredAndSortedUsers.map((user) => (
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
      
      {filteredAndSortedUsers.length === 0 && !loading && !error && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {searchTerm 
            ? `Aucun utilisateur ne correspond à "${searchTerm}"`
            : "Aucun utilisateur trouvé."
          }
        </div>
      )}
    </div>
  );
}
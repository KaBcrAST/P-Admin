import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import authService from "../services/authService";
import LoadingState from "../components/Common/LoadingState";
import ErrorState from "../components/Common/ErrorState";
import UsersSearch from "../components/Users/UsersSearch";
import UsersTable from "../components/Users/UsersTable";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  lastLogin?: Date;
  createdAt?: Date;
}

export type SortField = 'name' | 'email' | 'role' | 'lastLogin' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const API_URL = import.meta.env.VITE_API_URL;
  
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
        
        if (response.data.success) {
          setUsers(response.data.users);
        } else {
          setError("Impossible de récupérer la liste des utilisateurs");
        }
      } catch (err: any) {
        console.error("Erreur lors du chargement des utilisateurs:", err);
        
        // Gestion détaillée des erreurs
        if (err.response) {
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
    return <LoadingState message="Chargement des utilisateurs..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Utilisateurs</h1>
      
      {/* Barre de recherche et compteur */}
      <UsersSearch 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
        count={filteredAndSortedUsers.length} 
      />

      {/* Tableau des utilisateurs */}
      <UsersTable 
        users={filteredAndSortedUsers}
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={handleSort}
        onPromote={promoteToAdmin}
        onDemote={demoteToUser}
        actionInProgress={actionInProgress}
      />
    </div>
  );
}
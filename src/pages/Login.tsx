import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";

interface LoginProps {
  setIsAuthenticated: (value: boolean) => void;
}

const Login: React.FC<LoginProps> = ({ setIsAuthenticated }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError("");

    try {
      const response = await authService.login(email, password);
      
      // Vérifier une dernière fois le rôle utilisateur pour plus de sécurité
      if (!response.user || response.user.role !== 'admin') {
        throw new Error('Accès réservé aux administrateurs');
      }
      
      // Mise à jour de l'état d'authentification dans le composant parent
      setIsAuthenticated(true);
      
      // Navigation vers la page d'accueil
      navigate("/", { replace: true });
    } catch (error: any) {
      console.error(error);
      // Message d'erreur spécifique pour les utilisateurs non-admin
      if (error.message === 'Accès réservé aux administrateurs') {
        setLoginError("Accès refusé : vous devez être administrateur pour accéder à ce panneau");
      } else {
        setLoginError("Email ou mot de passe incorrect");
      }
      
      // S'assurer que l'utilisateur est déconnecté en cas d'erreur
      authService.logout();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 p-8 rounded shadow-md w-96"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Panneau d'Administration</h2>
        <p className="text-gray-400 text-sm mb-6 text-center">Connectez-vous avec vos identifiants administrateur</p>
        
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
            disabled={isLoading}
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
            disabled={isLoading}
          />
        </div>
        
        <button
          type="submit"
          className={`w-full p-2 rounded font-medium ${
            isLoading ? "bg-blue-700 opacity-70 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
          disabled={isLoading}
        >
          {isLoading ? "Connexion en cours..." : "Se connecter"}
        </button>

        {loginError && (
          <div className="mt-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm">
            <p>{loginError}</p>
          </div>
        )}
      </form>
    </div>
  );
};

export default Login;

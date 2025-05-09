import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import authService from "../services/authService";

interface PrivateRouteProps {
  isAuthenticated: boolean;
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ isAuthenticated, children }) => {
  useEffect(() => {
    // Vérifier si l'utilisateur est admin, sinon le déconnecter
    if (isAuthenticated && !authService.isAdmin()) {
      console.warn("Utilisateur non administrateur détecté, déconnexion");
      authService.logout();
      window.location.href = "/login"; // Force complete reload to reset app state
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Double vérification au rendu du composant
  if (!authService.isAdmin()) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

export default PrivateRoute;

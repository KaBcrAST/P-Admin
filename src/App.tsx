import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Reports from "./pages/Reports";
import Login from "./pages/Login";
import PrivateRoute from "./components/PrivateRoute";
import authService from "./services/authService";

const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Configure axios avec le token au chargement de l'app
    authService.setupAxios();
    
    // Vérifier l'état d'authentification au démarrage
    const checkAuth = () => {
      const auth = authService.isAuthenticated();
      
      // Si l'utilisateur est connecté mais n'est pas admin, le déconnecter
      if (auth && !authService.isAdmin()) {
        console.warn("Non-admin user detected, logging out");
        authService.logout();
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(auth);
      }
      
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Chargement...</div>;
  }

  return (
    <Router>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        {isAuthenticated && <Sidebar isOpen={sidebarOpen} />}
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {isAuthenticated && <Header toggleSidebar={toggleSidebar} setIsAuthenticated={setIsAuthenticated} />}
          
          <main className="flex-1 overflow-y-auto p-4">
            <Routes>
              <Route 
                path="/login" 
                element={
                  isAuthenticated ? 
                    <Navigate to="/" replace /> : 
                    <Login setIsAuthenticated={setIsAuthenticated} />
                } 
              />
              
              <Route 
                path="/" 
                element={
                  <PrivateRoute isAuthenticated={isAuthenticated}>
                    <Dashboard />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/users" 
                element={
                  <PrivateRoute isAuthenticated={isAuthenticated}>
                    <Users />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/reports" 
                element={
                  <PrivateRoute isAuthenticated={isAuthenticated}>
                    <Reports />
                  </PrivateRoute>
                } 
              />
              
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

export default App;

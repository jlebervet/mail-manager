import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import axios from "axios";
import LoginPage from "./pages/LoginPage";
import DashboardLayout from "./components/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import MessagesPage from "./pages/MessagesPage";
import MessageDetailPage from "./pages/MessageDetailPage";
import ServicesPage from "./pages/ServicesPage";
import CorrespondentsPage from "./pages/CorrespondentsPage";
import UsersPage from "./pages/UsersPage";
import UserRolesPage from "./pages/UserRolesPage";
import ImportPage from "./pages/ImportPage";
import AdvancedStatsPage from "./pages/AdvancedStatsPage";
import { Toaster } from "./components/ui/sonner";
import { apiRequest } from "./authConfig";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Axios interceptor pour ajouter le token Azure AD
axios.interceptors.request.use(
  async (config) => {
    // Obtenir l'instance MSAL depuis le contexte
    const msalInstance = window.msalInstance;
    
    if (msalInstance) {
      const account = msalInstance.getActiveAccount();
      
      if (account) {
        try {
          // Acquérir le token silencieusement
          const response = await msalInstance.acquireTokenSilent({
            ...apiRequest,
            account: account,
          });
          
          config.headers.Authorization = `Bearer ${response.accessToken}`;
        } catch (error) {
          console.error("Erreur acquisition token:", error);
          
          // Si le token silencieux échoue, essayer avec popup
          try {
            const response = await msalInstance.acquireTokenPopup(apiRequest);
            config.headers.Authorization = `Bearer ${response.accessToken}`;
          } catch (popupError) {
            console.error("Erreur popup token:", popupError);
          }
        }
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

function App() {
  const isAuthenticated = useIsAuthenticated();
  const { instance, accounts, inProgress } = useMsal();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Exposer l'instance MSAL globalement pour l'interceptor
  useEffect(() => {
    window.msalInstance = instance;
  }, [instance]);

  // Récupérer les informations utilisateur depuis le backend
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (isAuthenticated && accounts.length > 0) {
        try {
          const account = accounts[0];
          
          // Appeler le backend pour créer/récupérer l'utilisateur (endpoint NON protégé)
          const response = await axios.post(`${API}/auth/azure/callback`, {
            oid: account.localAccountId,
            email: account.username,
            name: account.name,
          });
          
          // Stocker le token JWT retourné pour les requêtes suivantes
          if (response.data.token) {
            localStorage.setItem("token", response.data.token);
          }
          
          setUser(response.data.user);
          localStorage.setItem("user", JSON.stringify(response.data.user));
        } catch (error) {
          console.error("Erreur lors de la récupération des informations utilisateur:", error);
        }
      }
      setLoading(false);
    };

    fetchUserInfo();
  }, [isAuthenticated, accounts]);

  const handleLogout = () => {
    instance.logoutPopup({
      postLogoutRedirectUri: window.location.origin,
    });
    setUser(null);
    localStorage.removeItem("user");
  };

  // Attendre l'initialisation MSAL
  if (inProgress === "startup" || inProgress === "handleRedirect") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-slate-600">Chargement de l'authentification...</p>
        </div>
      </div>
    );
  }

  if (loading && isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-slate-600">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/" replace />
              ) : (
                <LoginPage />
              )
            }
          />
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <DashboardLayout user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          >
            <Route index element={<DashboardPage user={user} />} />
            <Route path="stats" element={<AdvancedStatsPage user={user} />} />
            <Route path="messages/:type" element={<MessagesPage user={user} />} />
            <Route path="message/new/:type" element={<MessageDetailPage user={user} />} />
            <Route path="message/:id" element={<MessageDetailPage user={user} />} />
            <Route path="services" element={<ServicesPage user={user} />} />
            <Route path="correspondents" element={<CorrespondentsPage user={user} />} />
            <Route path="users" element={<UsersPage user={user} />} />
            <Route path="user-roles" element={<UserRolesPage user={user} />} />
            <Route path="import" element={<ImportPage user={user} />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
export { API };

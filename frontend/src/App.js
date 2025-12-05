import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider, useIsAuthenticated, useMsal } from "@azure/msal-react";
import { msalConfig, loginRequest } from "./authConfig";
import LoginPage from "./pages/LoginPage";
import DashboardLayout from "./components/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import MessagesPage from "./pages/MessagesPage";
import MessageDetailPage from "./pages/MessageDetailPage";
import ServicesPage from "./pages/ServicesPage";
import CorrespondentsPage from "./pages/CorrespondentsPage";
import UsersPage from "./pages/UsersPage";
import ImportPage from "./pages/ImportPage";
import UserRolesPage from "./pages/UserRolesPage";
import { Toaster } from "./components/ui/sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const msalInstance = new PublicClientApplication(msalConfig);

axios.interceptors.request.use(
  async (config) => {
    try {
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        const response = await msalInstance.acquireTokenSilent({
          account: accounts[0],
          ...loginRequest,
        });
        config.headers.Authorization = `Bearer ${response.accessToken}`;
      }
    } catch (error) {
      console.error("Token error:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

function MainApp() {
  const isAuthenticated = useIsAuthenticated();
  const { instance, accounts } = useMsal();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (isAuthenticated && accounts.length > 0) {
        try {
          const response = await instance.acquireTokenSilent({
            account: accounts[0],
            ...loginRequest,
          });
          
          const userResponse = await axios.get(`${API}/auth/me/azure`, {
            headers: { Authorization: `Bearer ${response.accessToken}` }
          });
          
          setUser(userResponse.data);
        } catch (error) {
          console.error("Error fetching user:", error);
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [isAuthenticated, accounts, instance]);

  const handleLogout = () => {
    instance.logoutRedirect({
      postLogoutRedirectUri: "/login",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Chargement...</div>
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

function App() {
  const [msalInitialized, setMsalInitialized] = useState(false);

  useEffect(() => {
    msalInstance.initialize().then(() => {
      msalInstance.handleRedirectPromise().then((response) => {
        if (response) {
          msalInstance.setActiveAccount(response.account);
        }
        setMsalInitialized(true);
      }).catch((error) => {
        console.error("Redirect error:", error);
        setMsalInitialized(true);
      });
    });
  }, []);

  if (!msalInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Initialisation...</div>
      </div>
    );
  }

  return (
    <MsalProvider instance={msalInstance}>
      <MainApp />
    </MsalProvider>
  );
}

export default App;
export { API };

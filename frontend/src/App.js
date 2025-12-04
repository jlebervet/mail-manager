import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { PublicClientApplication, EventType } from "@azure/msal-browser";
import { MsalProvider, AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from "@azure/msal-react";
import { msalConfig, loginRequest, apiConfig } from "./authConfig";
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

// Create MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

// Account selection logic (if you have multiple accounts)
const accounts = msalInstance.getAllAccounts();
if (accounts.length > 0) {
  msalInstance.setActiveAccount(accounts[0]);
}

msalInstance.addEventCallback((event) => {
  if (event.eventType === EventType.LOGIN_SUCCESS && event.payload.account) {
    const account = event.payload.account;
    msalInstance.setActiveAccount(account);
  }
});

// Axios interceptor to add Azure AD auth token
axios.interceptors.request.use(
  async (config) => {
    const account = msalInstance.getActiveAccount();
    if (account) {
      try {
        const response = await msalInstance.acquireTokenSilent({
          account,
          ...loginRequest,
        });
        config.headers.Authorization = `Bearer ${response.accessToken}`;
      } catch (error) {
        console.error("Token acquisition failed:", error);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

function AppContent() {
  const { instance, accounts } = useMsal();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (accounts && accounts.length > 0) {
        try {
          const response = await instance.acquireTokenSilent({
            account: accounts[0],
            ...loginRequest,
          });

          // Fetch user data from backend
          const userResponse = await axios.get(`${API}/auth/me/azure`, {
            headers: {
              Authorization: `Bearer ${response.accessToken}`,
            },
          });

          setUser(userResponse.data);
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
      setLoading(false);
    };

    fetchUserData();
  }, [accounts, instance]);

  const handleLogout = () => {
    instance.logoutRedirect({
      postLogoutRedirectUri: "/",
    });
    setUser(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  const isAuthenticated = accounts && accounts.length > 0;

  return (
    <div className="App">
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <UnauthenticatedTemplate>
                <LoginPage />
              </UnauthenticatedTemplate>
            }
          />
          <Route
            path="/"
            element={
              <AuthenticatedTemplate>
                <DashboardLayout user={user} onLogout={handleLogout} />
              </AuthenticatedTemplate>
            }
          >
            <Route index element={<DashboardPage user={user} />} />
            <Route path="messages/:type" element={<MessagesPage user={user} />} />
            <Route path="message/new/:type" element={<MessageDetailPage user={user} />} />
            <Route path="message/:id" element={<MessageDetailPage user={user} />} />
            <Route path="services" element={<ServicesPage user={user} />} />
            <Route path="correspondents" element={<CorrespondentsPage user={user} />} />
            <Route path="users" element={<UsersPage user={user} />} />
            <Route path="import" element={<ImportPage user={user} />} />
          </Route>
        </Routes>
      </BrowserRouter>

      {/* Redirect to login if not authenticated */}
      <UnauthenticatedTemplate>
        <BrowserRouter>
          <Routes>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </UnauthenticatedTemplate>
    </div>
  );
}

function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <AppContent />
    </MsalProvider>
  );
}

export default App;
export { API };

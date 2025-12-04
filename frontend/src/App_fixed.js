import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { PublicClientApplication, EventType } from "@azure/msal-browser";
import { MsalProvider, useMsal, useIsAuthenticated } from "@azure/msal-react";
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

// Create MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

// Initialize MSAL
msalInstance.initialize().then(() => {
  // Handle redirect promise
  msalInstance.handleRedirectPromise().then((response) => {
    if (response) {
      const account = response.account;
      msalInstance.setActiveAccount(account);
    } else {
      // Check if there are any accounts
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        msalInstance.setActiveAccount(accounts[0]);
      }
    }
  });
});

// Axios interceptor to add Azure AD auth token
axios.interceptors.request.use(
  async (config) => {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      try {
        const response = await msalInstance.acquireTokenSilent({
          account: accounts[0],
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

function MainRoutes() {
  const isAuthenticated = useIsAuthenticated();
  const { instance, accounts } = useMsal();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    instance.logoutRedirect({
      postLogoutRedirectUri: "/login",
    });
  };

  // Mock user object for now - will be populated from backend
  const user = accounts && accounts.length > 0 ? {
    email: accounts[0].username,
    name: accounts[0].name || accounts[0].username,
    role: "user" // Will be fetched from backend
  } : null;

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/" element={<DashboardLayout user={user} onLogout={handleLogout} />}>
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
  );
}

function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <div className="App">
        <Toaster />
        <BrowserRouter>
          <MainRoutes />
        </BrowserRouter>
      </div>
    </MsalProvider>
  );
}

export default App;
export { API };

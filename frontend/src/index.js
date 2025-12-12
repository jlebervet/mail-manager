import React from "react";
import ReactDOM from "react-dom/client";
import { PublicClientApplication, EventType } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import "@/index.css";
import App from "@/App";
import { msalConfig } from "./authConfig";

/**
 * Initialisation MSAL en dehors du composant React
 * CRITIQUE : Cela évite les erreurs d'initialisation
 */
const msalInstance = new PublicClientApplication(msalConfig);

// Gérer les événements MSAL
msalInstance.addEventCallback((event) => {
  if (event.eventType === EventType.LOGIN_SUCCESS && event.payload.account) {
    msalInstance.setActiveAccount(event.payload.account);
  }
});

// Initialiser l'instance avant le rendu
msalInstance.initialize().then(() => {
  // Gérer la redirection après authentification
  msalInstance.handleRedirectPromise().then((response) => {
    if (response && response.account) {
      msalInstance.setActiveAccount(response.account);
    }
    
    // Rendre l'application seulement après l'initialisation complète
    const root = ReactDOM.createRoot(document.getElementById("root"));
    root.render(
      <React.StrictMode>
        <MsalProvider instance={msalInstance}>
          <App />
        </MsalProvider>
      </React.StrictMode>
    );
  }).catch((error) => {
    console.error("Erreur lors de la gestion de la redirection:", error);
    
    // Rendre quand même l'application en cas d'erreur
    const root = ReactDOM.createRoot(document.getElementById("root"));
    root.render(
      <React.StrictMode>
        <MsalProvider instance={msalInstance}>
          <App />
        </MsalProvider>
      </React.StrictMode>
    );
  });
});

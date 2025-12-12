import { LogLevel } from "@azure/msal-browser";

/**
 * Configuration MSAL pour l'authentification Azure AD
 * Documentation: https://learn.microsoft.com/en-us/azure/active-directory/develop/msal-js-initializing-client-applications
 */

export const msalConfig = {
  auth: {
    clientId: process.env.REACT_APP_AZURE_CLIENT_ID || "3636e564-b7a6-405a-8a6f-4d5f15db49bb",
    authority: `https://login.microsoftonline.com/${process.env.REACT_APP_AZURE_TENANT_ID || "dd1d7dff-fcc8-45f7-8966-fbdf17b2f70a"}`,
    redirectUri: process.env.REACT_APP_REDIRECT_URI || window.location.origin,
    postLogoutRedirectUri: process.env.REACT_APP_REDIRECT_URI || window.location.origin,
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Info:
            console.info(message);
            return;
          case LogLevel.Verbose:
            console.debug(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
          default:
            return;
        }
      },
    },
    allowNativeBroker: false,
  },
};

/**
 * Scopes pour la connexion Azure AD
 */
export const loginRequest = {
  scopes: ["openid", "profile", "email"],
};

/**
 * Scopes pour l'accès à l'API backend
 */
export const apiRequest = {
  scopes: [
    `api://${process.env.REACT_APP_AZURE_CLIENT_ID || "3636e564-b7a6-405a-8a6f-4d5f15db49bb"}/user_impersonation`
  ],
};

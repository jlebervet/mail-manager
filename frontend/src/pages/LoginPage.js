import { useState } from "react";
import { useMsal } from "@azure/msal-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Building2, LogIn, AlertCircle } from "lucide-react";
import { loginRequest } from "../authConfig";
import { toast } from "sonner";

const LoginPage = () => {
  const { instance, inProgress } = useMsal();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (inProgress !== "none") {
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await instance.loginPopup(loginRequest);
      
      if (response && response.account) {
        instance.setActiveAccount(response.account);
        toast.success("Connexion réussie !");
      }
    } catch (error) {
      console.error("Erreur de connexion:", error);
      
      if (error.errorCode === "user_cancelled") {
        toast.error("Connexion annulée");
      } else if (error.errorCode === "interaction_in_progress") {
        toast.error("Une connexion est déjà en cours");
      } else {
        toast.error("Erreur lors de la connexion : " + (error.errorMessage || error.message));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100">
      <div className="w-full max-w-md p-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Gestion de Messages
          </h1>
          <p className="text-slate-600">
            Système Multi-Services
          </p>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">Connexion</CardTitle>
            <CardDescription>
              Connectez-vous avec votre compte Microsoft pour accéder à l'application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleLogin}
              disabled={isLoading || inProgress !== "none"}
              className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700"
            >
              {isLoading || inProgress !== "none" ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-5 w-5" />
                  Se connecter avec Microsoft
                </>
              )}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-slate-500">
                  Authentification sécurisée
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-900">
                Utilisez vos identifiants Microsoft de votre organisation pour vous connecter.
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-500 mt-6">
          Système de gestion de messages multi-services
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

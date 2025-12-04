import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../authConfig";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { toast } from "sonner";
import { Building2 } from "lucide-react";

const LoginPage = () => {
  const { instance } = useMsal();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleMicrosoftLogin = async () => {
    setLoading(true);
    try {
      await instance.loginRedirect(loginRequest);
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Erreur lors de la connexion");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Gestion de Message</h1>
          <p className="text-slate-600">Authentification Microsoft Azure AD</p>
        </div>

        <Card className="shadow-xl border-0 fade-in">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Connexion</CardTitle>
            <CardDescription>
              Connectez-vous avec votre compte Microsoft
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleMicrosoftLogin}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base"
              data-testid="microsoft-login-button"
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 23 23" fill="none">
                <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
                <rect x="12" y="1" width="10" height="10" fill="#7FBA00"/>
                <rect x="1" y="12" width="10" height="10" fill="#00A4EF"/>
                <rect x="12" y="12" width="10" height="10" fill="#FFB900"/>
              </svg>
              {loading ? "Connexion en cours..." : "Se connecter avec Microsoft"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">
                  Authentification sécurisée
                </span>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-xs text-blue-900 font-medium mb-1">
                🔐 Authentification Azure AD
              </p>
              <p className="text-xs text-blue-700">
                Utilisez votre compte Microsoft professionnel pour vous connecter en toute sécurité.
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-500 mt-6">
          Système de gestion de message multi-services
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

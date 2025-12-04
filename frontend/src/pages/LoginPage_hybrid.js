import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { toast } from "sonner";
import { Mail, Lock, Building2 } from "lucide-react";
import { API } from "../App";

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, {
        email,
        password,
      });

      onLogin(response.data.token, response.data.user);
      toast.success("Connexion réussie!");
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Identifiants invalides");
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftLogin = () => {
    // Redirect to Microsoft login
    const azureClientId = process.env.REACT_APP_AZURE_CLIENT_ID;
    const azureTenantId = process.env.REACT_APP_AZURE_TENANT_ID;
    const redirectUri = encodeURIComponent(process.env.REACT_APP_AZURE_REDIRECT_URI || window.location.origin);
    const scope = encodeURIComponent(process.env.REACT_APP_AZURE_SCOPE || "");
    
    const authUrl = `https://login.microsoftonline.com/${azureTenantId}/oauth2/v2.0/authorize?` +
      `client_id=${azureClientId}` +
      `&response_type=code` +
      `&redirect_uri=${redirectUri}` +
      `&response_mode=query` +
      `&scope=${scope}` +
      `&state=${Date.now()}`;
    
    window.location.href = authUrl;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Gestion de Message</h1>
          <p className="text-slate-600">Authentification Sécurisée</p>
        </div>

        <Card className="shadow-xl border-0 fade-in">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Connexion</CardTitle>
            <CardDescription>
              Choisissez votre méthode de connexion
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Microsoft Login Button */}
            <Button
              onClick={handleMicrosoftLogin}
              className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base"
              data-testid="microsoft-login-button"
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 23 23" fill="none">
                <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
                <rect x="12" y="1" width="10" height="10" fill="#7FBA00"/>
                <rect x="1" y="12" width="10" height="10" fill="#00A4EF"/>
                <rect x="12" y="12" width="10" height="10" fill="#FFB900"/>
              </svg>
              Se connecter avec Microsoft
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">
                  ou
                </span>
              </div>
            </div>

            {/* Legacy Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    data-testid="login-email-input"
                    type="email"
                    placeholder="nom@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    data-testid="login-password-input"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <Button
                type="submit"
                data-testid="login-submit-button"
                variant="outline"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Connexion..." : "Connexion Test (Legacy)"}
              </Button>
            </form>

            <div className="mt-4 p-4 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-600 font-medium mb-2">Comptes de test (Legacy) :</p>
              <div className="text-xs text-slate-500 space-y-1">
                <p><strong>Admin:</strong> admin@mairie.fr / admin123</p>
                <p><strong>User:</strong> user@mairie.fr / user123</p>
              </div>
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

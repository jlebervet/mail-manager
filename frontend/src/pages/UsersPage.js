import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { Plus, Edit, Trash2, User, Shield } from "lucide-react";
import { API } from "../App";

const UsersPage = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`);
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const openDialog = (userData = null) => {
    if (userData) {
      setEditingUser(userData);
      setName(userData.name);
      setEmail(userData.email);
      setPassword("");
      setRole(userData.role);
    } else {
      resetForm();
    }
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingUser(null);
    setName("");
    setEmail("");
    setPassword("");
    setRole("user");
  };

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      toast.error("Le nom et l'email sont requis");
      return;
    }

    if (!editingUser && !password.trim()) {
      toast.error("Le mot de passe est requis pour un nouvel utilisateur");
      return;
    }

    try {
      const userData = {
        name,
        email,
        password: password || "password123", // Default password if not provided
        role
      };

      if (editingUser) {
        // Update role only
        await axios.put(`${API}/users/${editingUser.id}?role=${role}`);
        toast.success("Utilisateur mis à jour");
      } else {
        await axios.post(`${API}/auth/register`, userData);
        toast.success("Utilisateur créé");
      }

      fetchUsers();
      closeDialog();
    } catch (error) {
      console.error("Error saving user:", error);
      toast.error(error.response?.data?.detail || "Erreur lors de l'enregistrement");
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      return;
    }

    try {
      await axios.delete(`${API}/users/${userId}`);
      toast.success("Utilisateur supprimé");
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const isAdmin = user?.role === "admin";

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Accès réservé aux administrateurs</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Utilisateurs</h1>
          <p className="text-slate-600">{users.length} utilisateur(s)</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              data-testid="create-user-button"
              onClick={() => openDialog()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nouvel utilisateur
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  data-testid="user-name-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nom complet"
                  disabled={!!editingUser}
                />
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  data-testid="user-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemple.com"
                  disabled={!!editingUser}
                />
              </div>

              {!editingUser && (
                <div>
                  <Label htmlFor="password">Mot de passe *</Label>
                  <Input
                    id="password"
                    data-testid="user-password-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="role">Rôle *</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger data-testid="user-role-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Utilisateur</SelectItem>
                    <SelectItem value="admin">Administrateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={closeDialog}>
                  Annuler
                </Button>
                <Button
                  data-testid="save-user-button"
                  onClick={handleSave}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {editingUser ? "Mettre à jour" : "Créer"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((userData) => (
          <Card key={userData.id} data-testid={`user-card-${userData.id}`} className="border-0 shadow-sm card-hover">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    userData.role === "admin" ? "bg-amber-100" : "bg-blue-100"
                  }`}>
                    {userData.role === "admin" ? (
                      <Shield className="w-5 h-5 text-amber-600" />
                    ) : (
                      <User className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{userData.name}</CardTitle>
                    <Badge
                      variant={userData.role === "admin" ? "default" : "outline"}
                      className="mt-1"
                    >
                      {userData.role === "admin" ? "Admin" : "User"}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    data-testid={`edit-user-${userData.id}`}
                    size="sm"
                    variant="ghost"
                    onClick={() => openDialog(userData)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {userData.id !== user.id && (
                    <Button
                      data-testid={`delete-user-${userData.id}`}
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(userData.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <span className="font-medium">Email:</span>
                  <span className="truncate">{userData.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <span className="font-medium">ID:</span>
                  <span className="text-xs font-mono truncate">{userData.id}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UsersPage;

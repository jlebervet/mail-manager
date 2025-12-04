import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { Shield, User, UserCog, AlertCircle } from "lucide-react";
import { API } from "../App";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";

const UserRolesPage = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/users`);
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Erreur lors du chargement des utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (userId, userName, currentRole, role) => {
    setSelectedUser({ id: userId, name: userName, currentRole });
    setNewRole(role);
    setShowConfirmDialog(true);
  };

  const confirmRoleChange = async () => {
    try {
      await axios.put(`${API}/users/${selectedUser.id}?role=${newRole}`);
      toast.success(`Rôle mis à jour pour ${selectedUser.name}`);
      fetchUsers();
      setShowConfirmDialog(false);
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Erreur lors de la mise à jour du rôle");
    }
  };

  const getRoleBadge = (role) => {
    if (role === "admin") {
      return (
        <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
          <Shield className="mr-1 h-3 w-3" />
          Admin
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <User className="mr-1 h-3 w-3" />
        Utilisateur
      </Badge>
    );
  };

  const isCurrentUser = (userId) => userId === user?.id;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Gestion des Rôles Utilisateurs
        </h1>
        <p className="text-slate-600">
          Gérez les permissions des utilisateurs de l'application
        </p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Utilisateurs ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{u.name}</p>
                      <p className="text-sm text-slate-500">{u.email}</p>
                      {isCurrentUser(u.id) && (
                        <span className="text-xs text-blue-600 font-medium">
                          (Vous)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">Rôle:</span>
                    {getRoleBadge(u.role)}
                  </div>

                  <Select
                    value={u.role}
                    onValueChange={(value) =>
                      handleRoleChange(u.id, u.name, u.role, value)
                    }
                    disabled={isCurrentUser(u.id)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Utilisateur</SelectItem>
                      <SelectItem value="admin">Administrateur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}

            {users.length === 0 && (
              <div className="text-center py-12">
                <User className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                <p className="text-slate-500">Aucun utilisateur trouvé</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm bg-blue-50 border-blue-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <AlertCircle className="h-5 w-5" />
            Informations sur les rôles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-blue-900">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 mt-0.5 text-purple-600" />
            <div>
              <p className="font-medium">Administrateur</p>
              <p className="text-blue-700">
                Accès complet : gestion des utilisateurs, import CSV, création
                de services, et toutes les fonctionnalités de l'application.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <User className="h-4 w-4 mt-0.5 text-slate-600" />
            <div>
              <p className="font-medium">Utilisateur</p>
              <p className="text-blue-700">
                Accès standard : consultation et gestion des messages,
                correspondants et services. Pas d'accès aux fonctions
                d'administration.
              </p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-900">
              ⚠️ <strong>Note:</strong> Vous ne pouvez pas modifier votre
              propre rôle. Demandez à un autre administrateur si nécessaire.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer le changement de rôle</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir changer le rôle de{" "}
              <strong>{selectedUser?.name}</strong> de{" "}
              <strong>{selectedUser?.currentRole}</strong> à{" "}
              <strong>{newRole}</strong> ?
              <br />
              <br />
              {newRole === "admin" && (
                <span className="text-amber-600">
                  ⚠️ Cet utilisateur aura un accès complet à l'application et
                  pourra gérer les autres utilisateurs.
                </span>
              )}
              {newRole === "user" && selectedUser?.currentRole === "admin" && (
                <span className="text-amber-600">
                  ⚠️ Cet utilisateur perdra ses privilèges d'administration.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRoleChange}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserRolesPage;

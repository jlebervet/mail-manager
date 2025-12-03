import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Search, User, Mail, Building, Phone, MapPin } from "lucide-react";
import { API } from "../App";

const CorrespondentsPage = ({ user }) => {
  const [correspondents, setCorrespondents] = useState([]);
  const [filteredCorrespondents, setFilteredCorrespondents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [editingCorrespondent, setEditingCorrespondent] = useState(null);
  
  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    fetchCorrespondents();
  }, []);

  useEffect(() => {
    filterCorrespondents();
  }, [correspondents, searchTerm]);

  const fetchCorrespondents = async () => {
    try {
      const response = await axios.get(`${API}/correspondents`);
      setCorrespondents(response.data);
    } catch (error) {
      console.error("Error fetching correspondents:", error);
    }
  };

  const filterCorrespondents = () => {
    if (!searchTerm) {
      setFilteredCorrespondents(correspondents);
      return;
    }

    const filtered = correspondents.filter(
      (c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.organization && c.organization.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredCorrespondents(filtered);
  };

  const openDialog = (correspondent = null) => {
    if (correspondent) {
      setEditingCorrespondent(correspondent);
      setName(correspondent.name);
      setEmail(correspondent.email || "");
      setOrganization(correspondent.organization || "");
      setPhone(correspondent.phone || "");
      setAddress(correspondent.address || "");
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
    setEditingCorrespondent(null);
    setName("");
    setEmail("");
    setOrganization("");
    setPhone("");
    setAddress("");
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Le nom est requis");
      return;
    }

    try {
      const correspondentData = {
        name,
        email: email || null,
        organization: organization || null,
        phone: phone || null,
        address: address || null
      };

      if (editingCorrespondent) {
        await axios.put(`${API}/correspondents/${editingCorrespondent.id}`, correspondentData);
        toast.success("Correspondant mis à jour");
      } else {
        await axios.post(`${API}/correspondents`, correspondentData);
        toast.success("Correspondant créé");
      }

      fetchCorrespondents();
      closeDialog();
    } catch (error) {
      console.error("Error saving correspondent:", error);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const handleDelete = async (correspondentId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce correspondant ?")) {
      return;
    }

    try {
      await axios.delete(`${API}/correspondents/${correspondentId}`);
      toast.success("Correspondant supprimé");
      fetchCorrespondents();
    } catch (error) {
      console.error("Error deleting correspondent:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Correspondants</h1>
          <p className="text-slate-600">{filteredCorrespondents.length} correspondant(s)</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              data-testid="create-correspondent-button"
              onClick={() => openDialog()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nouveau correspondant
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCorrespondent ? "Modifier le correspondant" : "Nouveau correspondant"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  data-testid="correspondent-name-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nom complet"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  data-testid="correspondent-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemple.com"
                />
              </div>

              <div>
                <Label htmlFor="organization">Organisation</Label>
                <Input
                  id="organization"
                  data-testid="correspondent-org-input"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="Nom de l'organisation"
                />
              </div>

              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  data-testid="correspondent-phone-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+33 1 23 45 67 89"
                />
              </div>

              <div>
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  data-testid="correspondent-address-input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Adresse complète"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={closeDialog}>
                  Annuler
                </Button>
                <Button
                  data-testid="save-correspondent-button"
                  onClick={handleSave}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {editingCorrespondent ? "Mettre à jour" : "Créer"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              data-testid="search-correspondents-input"
              placeholder="Rechercher un correspondant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Correspondents List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCorrespondents.map((correspondent) => (
          <Card key={correspondent.id} data-testid={`correspondent-card-${correspondent.id}`} className="border-0 shadow-sm card-hover">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">{correspondent.name}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button
                    data-testid={`edit-correspondent-${correspondent.id}`}
                    size="sm"
                    variant="ghost"
                    onClick={() => openDialog(correspondent)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {isAdmin && (
                    <Button
                      data-testid={`delete-correspondent-${correspondent.id}`}
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(correspondent.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {correspondent.email && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{correspondent.email}</span>
                  </div>
                )}
                {correspondent.organization && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Building className="h-4 w-4" />
                    <span className="truncate">{correspondent.organization}</span>
                  </div>
                )}
                {correspondent.phone && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="h-4 w-4" />
                    <span>{correspondent.phone}</span>
                  </div>
                )}
                {correspondent.address && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{correspondent.address}</span>
                  </div>
                )}
                {!correspondent.email && !correspondent.organization && !correspondent.phone && !correspondent.address && (
                  <p className="text-slate-500 italic">Aucune information supplémentaire</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CorrespondentsPage;

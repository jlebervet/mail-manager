import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Building2 } from "lucide-react";
import { API } from "../App";
import { Badge } from "../components/ui/badge";

const ServicesPage = ({ user }) => {
  const [services, setServices] = useState([]);
  const [archivedServices, setArchivedServices] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceName, setServiceName] = useState("");
  const [subServices, setSubServices] = useState([]);
  const [newSubService, setNewSubService] = useState("");

  useEffect(() => {
    fetchServices();
    if (showArchived) {
      fetchArchivedServices();
    }
  }, [showArchived]);

  const fetchServices = async () => {
    try {
      const response = await axios.get(`${API}/services`);
      setServices(response.data);
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  const openDialog = (service = null) => {
    if (service) {
      setEditingService(service);
      setServiceName(service.name);
      setSubServices(service.sub_services || []);
    } else {
      setEditingService(null);
      setServiceName("");
      setSubServices([]);
    }
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    setEditingService(null);
    setServiceName("");
    setSubServices([]);
    setNewSubService("");
  };

  const addSubService = () => {
    if (!newSubService.trim()) return;
    
    const subService = {
      id: Date.now().toString(),
      name: newSubService
    };
    
    setSubServices([...subServices, subService]);
    setNewSubService("");
  };

  const removeSubService = (id) => {
    setSubServices(subServices.filter(ss => ss.id !== id));
  };

  const handleSave = async () => {
    if (!serviceName.trim()) {
      toast.error("Le nom du service est requis");
      return;
    }

    try {
      const serviceData = {
        name: serviceName,
        sub_services: subServices
      };

      if (editingService) {
        await axios.put(`${API}/services/${editingService.id}`, serviceData);
        toast.success("Service mis à jour");
      } else {
        await axios.post(`${API}/services`, serviceData);
        toast.success("Service créé");
      }

      fetchServices();
      closeDialog();
    } catch (error) {
      console.error("Error saving service:", error);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const handleDelete = async (serviceId) => {
    // Get service details for confirmation
    const service = services.find(s => s.id === serviceId);
    
    const confirmMessage = `⚠️ ARCHIVAGE DU SERVICE\n\n` +
      `Vous êtes sur le point d'archiver le service "${service?.name}".\n\n` +
      `Cette action va :\n` +
      `• Archiver le service (il n'apparaîtra plus dans les listes actives)\n` +
      `• Archiver tous les courriers associés à ce service\n` +
      `• Conserver toutes les données (archivage, pas de suppression définitive)\n\n` +
      `Vous pourrez restaurer ce service ultérieurement si nécessaire.\n\n` +
      `Confirmez-vous l'archivage de ce service ?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await axios.delete(`${API}/services/${serviceId}`);
      
      if (response.data.archived_mails > 0) {
        toast.success(
          `Service archivé avec succès. ${response.data.archived_mails} courrier(s) associé(s) également archivé(s).`,
          { duration: 5000 }
        );
      } else {
        toast.success("Service archivé avec succès");
      }
      
      fetchServices();
    } catch (error) {
      console.error("Error archiving service:", error);
      toast.error("Erreur lors de l'archivage du service");
    }
  };

  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Services</h1>
          <p className="text-slate-600">{services.length} service(s)</p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                data-testid="create-service-button"
                onClick={() => openDialog()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nouveau service
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingService ? "Modifier le service" : "Nouveau service"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="service-name">Nom du service</Label>
                  <Input
                    id="service-name"
                    data-testid="service-name-input"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    placeholder="Ex: Services Techniques"
                  />
                </div>

                <div>
                  <Label>Sous-services</Label>
                  <div className="flex gap-2 mb-3">
                    <Input
                      data-testid="subservice-input"
                      value={newSubService}
                      onChange={(e) => setNewSubService(e.target.value)}
                      placeholder="Ex: Urbanisme"
                      onKeyPress={(e) => e.key === "Enter" && addSubService()}
                    />
                    <Button
                      data-testid="add-subservice-button"
                      onClick={addSubService}
                      type="button"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {subServices.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {subServices.map((ss) => (
                        <Badge
                          key={ss.id}
                          data-testid={`subservice-badge-${ss.id}`}
                          variant="secondary"
                          className="flex items-center gap-2 px-3 py-1"
                        >
                          {ss.name}
                          <button
                            data-testid={`remove-subservice-${ss.id}`}
                            onClick={() => removeSubService(ss.id)}
                            className="hover:text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={closeDialog}>
                    Annuler
                  </Button>
                  <Button
                    data-testid="save-service-button"
                    onClick={handleSave}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {editingService ? "Mettre à jour" : "Créer"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <Card key={service.id} data-testid={`service-card-${service.id}`} className="border-0 shadow-sm card-hover">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                </div>
                {isAdmin && (
                  <div className="flex gap-1">
                    <Button
                      data-testid={`edit-service-${service.id}`}
                      size="sm"
                      variant="ghost"
                      onClick={() => openDialog(service)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      data-testid={`delete-service-${service.id}`}
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(service.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {service.sub_services && service.sub_services.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700 mb-2">Sous-services:</p>
                  <div className="flex flex-wrap gap-2">
                    {service.sub_services.map((ss) => (
                      <Badge key={ss.id} variant="outline" className="text-xs">
                        {ss.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Aucun sous-service</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ServicesPage;

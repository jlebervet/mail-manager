import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Checkbox } from "../components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Upload, X, Download, Save, Send, Reply, ExternalLink, ScanBarcode, Package, UserPlus, Plus, Trash2 } from "lucide-react";
import { API } from "../App";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import BarcodeScanner from "../components/BarcodeScanner";

const MessageDetailPage = ({ user }) => {
  const params = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [mail, setMail] = useState(null);
  
  const isNew = params.id === "new" || !params.id;
  const id = isNew ? null : params.id;
  const type = isNew ? params.type : null;
  
  // Form state
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [selectedCorrespondent, setSelectedCorrespondent] = useState(null);
  const [selectedServices, setSelectedServices] = useState([{ service_id: null, sub_service_id: null }]); // Multiple destinataires
  const [status, setStatus] = useState("recu");
  const [comment, setComment] = useState("");
  const [assignedTo, setAssignedTo] = useState(null);
  
  // New fields
  const [messageType, setMessageType] = useState("courrier");
  const [isRegistered, setIsRegistered] = useState(false);
  const [registeredNumber, setRegisteredNumber] = useState("");
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [noResponseNeeded, setNoResponseNeeded] = useState(false);
  
  const [correspondents, setCorrespondents] = useState([]);
  const [services, setServices] = useState([]);
  const [users, setUsers] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [correspondentSearch, setCorrespondentSearch] = useState("");
  const [openCorrespondent, setOpenCorrespondent] = useState(false);
  
  // État pour la modale de création de correspondant
  const [showNewCorrespondentDialog, setShowNewCorrespondentDialog] = useState(false);
  const [newCorrespondent, setNewCorrespondent] = useState({
    name: "",
    email: "",
    phone: "",
    organization: "",
    address: ""
  });

  useEffect(() => {
    fetchCorrespondents();
    fetchServices();
    fetchUsers();
    
    if (!isNew) {
      fetchMail();
    } else {
      const replyData = sessionStorage.getItem('replyToMail');
      if (replyData) {
        const parsed = JSON.parse(replyData);
        setSubject(`Re: ${parsed.original_subject}`);
        setSelectedCorrespondent({
          id: parsed.correspondent_id,
          name: parsed.correspondent_name
        });
        setSelectedServices([{
          service_id: parsed.service_id,
          sub_service_id: parsed.sub_service_id
        }]);
      }
    }
  }, [id]);

  useEffect(() => {
    if (correspondentSearch.length >= 2) {
      searchCorrespondents(correspondentSearch);
    }
  }, [correspondentSearch]);

  const fetchMail = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/mails/${id}`);
      const mailData = response.data;
      setMail(mailData);
      setSubject(mailData.subject);
      setContent(mailData.content);
      setStatus(mailData.status);
      setAttachments(mailData.attachments || []);
      setMessageType(mailData.message_type || "courrier");
      setIsRegistered(mailData.is_registered || false);
      setRegisteredNumber(mailData.registered_number || "");
      setNoResponseNeeded(mailData.no_response_needed || false);
      
      setSelectedCorrespondent({
        id: mailData.correspondent_id,
        name: mailData.correspondent_name
      });
      
      // Charger les destinataires multiples ou un seul
      if (mailData.service_ids && mailData.service_ids.length > 0) {
        const servicesData = mailData.service_ids.map((sid, idx) => ({
          service_id: sid,
          sub_service_id: idx === 0 ? mailData.sub_service_id : null
        }));
        setSelectedServices(servicesData);
      } else {
        // Compatibilité avec l'ancien format
        setSelectedServices([{
          service_id: mailData.service_id,
          sub_service_id: mailData.sub_service_id
        }]);
      }
      
      if (mailData.assigned_to_id) {
        setAssignedTo(mailData.assigned_to_id);
      }
    } catch (error) {
      console.error("Error fetching mail:", error);
      toast.error("Erreur lors du chargement du message");
    } finally {
      setLoading(false);
    }
  };

  const fetchCorrespondents = async () => {
    try {
      const response = await axios.get(`${API}/correspondents`);
      setCorrespondents(response.data);
    } catch (error) {
      console.error("Error fetching correspondents:", error);
    }
  };

  // Gérer le comportement automatique de "Ne nécessite pas de réponse" pour les colis
  useEffect(() => {
    if (messageType === "colis") {
      setNoResponseNeeded(true);
    }
  }, [messageType]);

  const searchCorrespondents = async (search) => {
    try {
      const response = await axios.get(`${API}/correspondents`, {
        params: { search }
      });
      setCorrespondents(response.data);
    } catch (error) {
      console.error("Error searching correspondents:", error);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await axios.get(`${API}/services`);
      setServices(response.data);
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`);
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // Filtrer les utilisateurs assignables selon les services du message
  const getAssignableUsers = () => {
    if (!mail || !users.length) return users;
    
    // Si le message a des destinataires multiples, utiliser service_ids
    const messageServices = mail.service_ids || [mail.service_id];
    
    // Filtrer les utilisateurs qui appartiennent à un des services du message
    return users.filter(u => {
      // Admins peuvent toujours être assignés
      if (u.role === "admin") return true;
      // Utilisateurs du même service
      return messageServices.includes(u.service_id);
    });
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(uploadFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(uploadFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');
  };

  const uploadFile = async (file) => {
    if (isNew) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Data = e.target.result.split(',')[1];
        const attachment = {
          id: Date.now().toString(),
          filename: file.name,
          content_type: file.type,
          size: file.size,
          data: base64Data
        };
        setAttachments(prev => [...prev, attachment]);
      };
      reader.readAsDataURL(file);
    } else {
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await axios.post(`${API}/mails/${id}/attachments`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        setAttachments(prev => [...prev, response.data]);
        toast.success("Pièce jointe ajoutée");
      } catch (error) {
        console.error("Error uploading file:", error);
        toast.error("Erreur lors de l'ajout de la pièce jointe");
      }
    }
  };

  const removeAttachment = (attachmentId) => {
    setAttachments(prev => prev.filter(a => a.id !== attachmentId));
  };

  const downloadAttachment = (attachment) => {
    const link = document.createElement('a');
    link.href = `data:${attachment.content_type};base64,${attachment.data}`;
    link.download = attachment.filename;
    link.click();
  };

  const startBarcodeScanning = () => {
    setShowBarcodeScanner(true);
  };

  const handleBarcodeScan = (scannedCode) => {
    setRegisteredNumber(scannedCode);
    toast.success(`Code-barres scanné : ${scannedCode}`);
  };

  const handleCreateNewCorrespondent = async () => {
    if (!newCorrespondent.name) {
      toast.error("Le nom est obligatoire");
      return;
    }

    try {
      const response = await axios.post(`${API}/correspondents`, newCorrespondent);
      toast.success("Correspondant créé avec succès");
      
      // Ajouter à la liste
      setCorrespondents(prev => [...prev, response.data]);
      
      // Sélectionner automatiquement le nouveau correspondant
      setSelectedCorrespondent(response.data);
      
      // Fermer la modale et réinitialiser le formulaire
      setShowNewCorrespondentDialog(false);
      setNewCorrespondent({
        name: "",
        email: "",
        phone: "",
        organization: "",
        address: ""
      });
    } catch (error) {
      console.error("Error creating correspondent:", error);
      toast.error("Erreur lors de la création du correspondant");
    }
  };

  const handleReply = () => {
    const parentMailData = {
      parent_mail_id: mail.id,
      parent_mail_reference: mail.reference,
      correspondent_id: mail.correspondent_id,
      correspondent_name: mail.correspondent_name,
      service_id: mail.service_id,
      service_name: mail.service_name,
      sub_service_id: mail.sub_service_id,
      sub_service_name: mail.sub_service_name,
      original_subject: mail.subject
    };
    sessionStorage.setItem('replyToMail', JSON.stringify(parentMailData));
    
    const replyType = mail.type === "entrant" ? "sortant" : "entrant";
    navigate(`/message/new/${replyType}`);
  };

  // Fonctions pour gérer les destinataires multiples
  const addDestinataireField = () => {
    setSelectedServices([...selectedServices, { service_id: null, sub_service_id: null }]);
  };

  const removeDestinataireField = (index) => {
    if (selectedServices.length > 1) {
      const newServices = selectedServices.filter((_, i) => i !== index);
      setSelectedServices(newServices);
    }
  };

  const updateDestinataire = (index, field, value) => {
    const newServices = [...selectedServices];
    newServices[index][field] = value;
    // Reset sub_service when service changes
    if (field === 'service_id') {
      newServices[index]['sub_service_id'] = null;
    }
    setSelectedServices(newServices);
  };

  const getSubServicesForService = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    return service?.sub_services || [];
  };

  const handleSave = async () => {
    if (!subject || !content || !selectedCorrespondent) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    // Vérifier qu'au moins un service est sélectionné
    const hasValidService = selectedServices.some(s => s.service_id !== null);
    if (!hasValidService) {
      toast.error("Veuillez sélectionner au moins un destinataire (service)");
      return;
    }

    if (isRegistered && !registeredNumber) {
      toast.error("Veuillez saisir le numéro de recommandé");
      return;
    }

    try {
      setLoading(true);
      
      // Préparer les données des services multiples
      const validServices = selectedServices.filter(s => s.service_id !== null);
      const primaryService = validServices[0];
      const serviceData = services.find(s => s.id === primaryService.service_id);
      const subServiceData = primaryService.sub_service_id
        ? serviceData?.sub_services.find(ss => ss.id === primaryService.sub_service_id)
        : null;

      // Collecter tous les service_ids, service_names, sub_service_ids, sub_service_names
      const service_ids = validServices.map(s => s.service_id);
      const service_names = validServices.map(s => {
        const svc = services.find(srv => srv.id === s.service_id);
        return svc?.name || "";
      });
      const sub_service_ids = validServices.map(s => s.sub_service_id || null);
      const sub_service_names = validServices.map(s => {
        if (!s.sub_service_id) return null;
        const svc = services.find(srv => srv.id === s.service_id);
        const subSvc = svc?.sub_services.find(ss => ss.id === s.sub_service_id);
        return subSvc?.name || null;
      });

      if (isNew) {
        const replyData = sessionStorage.getItem('replyToMail');
        let parentMailId = null;
        let parentMailReference = null;
        
        if (replyData) {
          const parsed = JSON.parse(replyData);
          parentMailId = parsed.parent_mail_id;
          parentMailReference = parsed.parent_mail_reference;
          sessionStorage.removeItem('replyToMail');
        }
        
        const mailData = {
          type: type || "entrant",
          subject,
          content,
          correspondent_id: selectedCorrespondent.id,
          correspondent_name: selectedCorrespondent.name,
          service_id: primaryService.service_id,  // Primary service pour compatibilité
          service_name: serviceData?.name || "",
          service_ids: service_ids,  // Tous les destinataires
          service_names: service_names,  // Tous les noms
          sub_service_id: primaryService.sub_service_id,  // Primary sub-service
          sub_service_name: subServiceData?.name || null,  // Primary sub-service name
          sub_service_ids: sub_service_ids,  // Tous les sous-services
          sub_service_names: sub_service_names,  // Tous les noms de sous-services
          parent_mail_id: parentMailId,
          parent_mail_reference: parentMailReference,
          message_type: messageType,
          is_registered: isRegistered,
          registered_number: isRegistered ? registeredNumber : null,
          no_response_needed: noResponseNeeded
        };
        
        const response = await axios.post(`${API}/mails`, mailData);
        const newMailId = response.data.id;
        
        for (const attachment of attachments) {
          const blob = await fetch(`data:${attachment.content_type};base64,${attachment.data}`).then(r => r.blob());
          const file = new File([blob], attachment.filename, { type: attachment.content_type });
          const formData = new FormData();
          formData.append('file', file);
          await axios.post(`${API}/mails/${newMailId}/attachments`, formData);
        }
        
        toast.success("Message créé avec succès");
        navigate(`/message/${newMailId}`);
      } else {
        // Mode modification - Permettre la modification de tous les champs
        const validServices = selectedServices.filter(s => s.service_id !== null);
        const primaryService = validServices[0];
        const serviceData = services.find(s => s.id === primaryService.service_id);
        const subServiceData = primaryService.sub_service_id
          ? serviceData?.sub_services.find(ss => ss.id === primaryService.sub_service_id)
          : null;

        const service_ids = validServices.map(s => s.service_id);
        const service_names = validServices.map(s => {
          const svc = services.find(srv => srv.id === s.service_id);
          return svc?.name || "";
        });
        const sub_service_ids = validServices.map(s => s.sub_service_id || null);
        const sub_service_names = validServices.map(s => {
          if (!s.sub_service_id) return null;
          const svc = services.find(srv => srv.id === s.service_id);
          const subSvc = svc?.sub_services.find(ss => ss.id === s.sub_service_id);
          return subSvc?.name || null;
        });

        const updateData = {
          subject,
          content,
          correspondent_id: selectedCorrespondent.id,
          correspondent_name: selectedCorrespondent.name,
          service_id: primaryService.service_id,
          service_name: serviceData?.name || "",
          service_ids: service_ids,
          service_names: service_names,
          sub_service_id: primaryService.sub_service_id,
          sub_service_name: subServiceData?.name || null,
          sub_service_ids: sub_service_ids,
          sub_service_names: sub_service_names,
          message_type: messageType,
          is_registered: isRegistered,
          registered_number: isRegistered ? registeredNumber : null,
          status,
          assigned_to_id: assignedTo,
          assigned_to_name: users.find(u => u.id === assignedTo)?.name || null,
          comment: comment || null
        };
        
        await axios.put(`${API}/mails/${id}`, updateData);
        toast.success("Message mis à jour");
        fetchMail();
        setComment("");
      }
    } catch (error) {
      console.error("Error saving mail:", error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const messageTypeLabels = {
    courrier: "📧 Courrier postal",
    email: "💌 Email",
    accueil_physique: "🤝 Accueil Physique",
    accueil_telephonique: "📞 Accueil Téléphonique",
    colis: "📦 Colis"
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <Button
          data-testid="back-button"
          variant="ghost"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <div className="flex gap-2">
          {!isNew && mail?.type === "entrant" && (
            <Button
              data-testid="reply-mail-button"
              onClick={handleReply}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <Reply className="mr-2 h-4 w-4" />
              Répondre (Message sortant)
            </Button>
          )}
          <Button
            data-testid="save-mail-button"
            onClick={handleSave}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="mr-2 h-4 w-4" />
            {isNew ? "Créer" : "Enregistrer"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>
                {isNew ? `Nouveau message ${type}` : mail?.reference}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isNew && (
                <>
                  <div>
                    <Label>Type de message *</Label>
                    <Select value={messageType} onValueChange={setMessageType}>
                      <SelectTrigger data-testid="message-type-select">
                        <span>{messageTypeLabels[messageType]}</span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="courrier">📧 Courrier postal</SelectItem>
                        <SelectItem value="email">💌 Email</SelectItem>
                        <SelectItem value="accueil_physique">🤝 Accueil Physique</SelectItem>
                        <SelectItem value="accueil_telephonique">📞 Accueil Téléphonique</SelectItem>
                        <SelectItem value="colis">📦 Colis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(messageType === "courrier" || messageType === "colis") && (
                    <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="is-registered"
                          data-testid="is-registered-checkbox"
                          checked={isRegistered}
                          onCheckedChange={setIsRegistered}
                        />
                        <Label htmlFor="is-registered" className="cursor-pointer">
                          Recommandé avec accusé de réception
                        </Label>
                      </div>

                      {isRegistered && (
                        <div className="space-y-2">
                          <Label htmlFor="registered-number">
                            Numéro de recommandé / Code-barres *
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="registered-number"
                              data-testid="registered-number-input"
                              value={registeredNumber}
                              onChange={(e) => setRegisteredNumber(e.target.value)}
                              placeholder="Ex: 1A123456789FR"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={startBarcodeScanning}
                              data-testid="scan-barcode-button"
                            >
                              <ScanBarcode className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-slate-500">
                            Cliquez sur l'icône de scan ou tapez directement le numéro
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Checkbox "Ne nécessite pas de réponse" */}
                  <div className="flex items-center space-x-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <Checkbox
                      id="no-response-needed"
                      checked={noResponseNeeded}
                      onCheckedChange={setNoResponseNeeded}
                    />
                    <Label htmlFor="no-response-needed" className="cursor-pointer text-sm">
                      Ne nécessite pas de réponse
                      <span className="block text-xs text-slate-600 mt-0.5">
                        Le message sera automatiquement archivé
                      </span>
                    </Label>
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="subject">Objet *</Label>
                <Input
                  id="subject"
                  data-testid="subject-input"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Objet du message"
                  disabled={!isNew && user?.role !== "admin"}
                />
              </div>

              <div>
                <Label htmlFor="content">Contenu *</Label>
                <Textarea
                  id="content"
                  data-testid="content-textarea"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Contenu du message"
                  rows={8}
                  disabled={!isNew && user?.role !== "admin"}
                />
              </div>

              <div>
                <Label>Correspondant *</Label>
                <div className="flex gap-2">
                  <Popover open={openCorrespondent} onOpenChange={setOpenCorrespondent}>
                    <PopoverTrigger asChild>
                      <Button
                        data-testid="correspondent-select"
                        variant="outline"
                        role="combobox"
                        className="flex-1 justify-between"
                        disabled={!isNew && user?.role !== "admin"}
                      >
                        {selectedCorrespondent ? selectedCorrespondent.name : "Sélectionner un correspondant..."}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput 
                          placeholder="Rechercher un correspondant..."
                          value={correspondentSearch}
                          onValueChange={setCorrespondentSearch}
                        />
                        <CommandList>
                          <CommandEmpty>
                            <div className="p-4 text-center space-y-3">
                              <p className="text-sm text-slate-500">Aucun correspondant trouvé.</p>
                              <Button
                                onClick={() => {
                                  setNewCorrespondent({
                                    ...newCorrespondent,
                                    name: correspondentSearch
                                  });
                                  setShowNewCorrespondentDialog(true);
                                  setOpenCorrespondent(false);
                                }}
                                className="w-full bg-blue-600 hover:bg-blue-700"
                                size="sm"
                              >
                                <UserPlus className="mr-2 h-4 w-4" />
                                Créer "{correspondentSearch}"
                              </Button>
                            </div>
                          </CommandEmpty>
                          <CommandGroup>
                            {correspondents.map((correspondent) => (
                              <CommandItem
                                key={correspondent.id}
                                value={correspondent.name}
                                onSelect={() => {
                                  setSelectedCorrespondent(correspondent);
                                  setOpenCorrespondent(false);
                                }}
                              >
                                <div>
                                  <div className="font-medium">{correspondent.name}</div>
                                  {correspondent.organization && (
                                    <div className="text-xs text-slate-500">{correspondent.organization}</div>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  
                  <Dialog open={showNewCorrespondentDialog} onOpenChange={setShowNewCorrespondentDialog}>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={!isNew && user?.role !== "admin"}
                        data-testid="new-correspondent-button"
                        title="Créer un nouveau correspondant"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Nouveau Correspondant</DialogTitle>
                        <DialogDescription>
                          Créez un nouveau correspondant pour l'associer à ce message
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="new-name">Nom *</Label>
                          <Input
                            id="new-name"
                            value={newCorrespondent.name}
                            onChange={(e) => setNewCorrespondent({...newCorrespondent, name: e.target.value})}
                            placeholder="Nom complet"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-email">Email</Label>
                          <Input
                            id="new-email"
                            type="email"
                            value={newCorrespondent.email}
                            onChange={(e) => setNewCorrespondent({...newCorrespondent, email: e.target.value})}
                            placeholder="email@exemple.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-phone">Téléphone</Label>
                          <Input
                            id="new-phone"
                            value={newCorrespondent.phone}
                            onChange={(e) => setNewCorrespondent({...newCorrespondent, phone: e.target.value})}
                            placeholder="01 23 45 67 89"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-organization">Organisation</Label>
                          <Input
                            id="new-organization"
                            value={newCorrespondent.organization}
                            onChange={(e) => setNewCorrespondent({...newCorrespondent, organization: e.target.value})}
                            placeholder="Nom de l'organisation"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-address">Adresse</Label>
                          <Textarea
                            id="new-address"
                            value={newCorrespondent.address}
                            onChange={(e) => setNewCorrespondent({...newCorrespondent, address: e.target.value})}
                            placeholder="Adresse postale complète"
                            rows={3}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setShowNewCorrespondentDialog(false)}
                        >
                          Annuler
                        </Button>
                        <Button
                          onClick={handleCreateNewCorrespondent}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          Créer
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Section Destinataire */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Destinataire(s)</h3>
                  {isNew && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addDestinataireField}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Ajouter un destinataire
                    </Button>
                  )}
                </div>
              </div>

              {/* Liste des destinataires */}
              <div className="space-y-4">
                {selectedServices.map((destinataire, index) => (
                  <div key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-sm font-medium text-slate-700">
                        Destinataire {index + 1}
                      </span>
                      {isNew && selectedServices.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDestinataireField(index)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Service *</Label>
                        <Select 
                          value={destinataire.service_id || ""} 
                          onValueChange={(value) => updateDestinataire(index, 'service_id', value)}
                          disabled={!isNew && user?.role !== "admin"}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                          <SelectContent>
                            {services.map((service) => (
                              <SelectItem key={service.id} value={service.id}>
                                {service.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Sous-service</Label>
                        <Select 
                          value={destinataire.sub_service_id || ""} 
                          onValueChange={(value) => updateDestinataire(index, 'sub_service_id', value)}
                          disabled={(!isNew && user?.role !== "admin") || !destinataire.service_id || getSubServicesForService(destinataire.service_id).length === 0}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                          <SelectContent>
                            {getSubServicesForService(destinataire.service_id).map((subService) => (
                              <SelectItem key={subService.id} value={subService.id}>
                                {subService.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Pièces jointes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                data-testid="drop-zone"
                className="drop-zone"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                <p className="text-slate-600 mb-2">Glissez-déposez vos fichiers ici</p>
                <p className="text-sm text-slate-500">ou cliquez pour sélectionner</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>

              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      data-testid={`attachment-${attachment.id}`}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{attachment.filename}</p>
                        <p className="text-xs text-slate-500">
                          {(attachment.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          data-testid={`download-attachment-${attachment.id}`}
                          size="sm"
                          variant="ghost"
                          onClick={() => downloadAttachment(attachment)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          data-testid={`remove-attachment-${attachment.id}`}
                          size="sm"
                          variant="ghost"
                          onClick={() => removeAttachment(attachment.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {!isNew && (
            <>
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Gestion</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Statut</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger data-testid="status-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recu">Reçu</SelectItem>
                        <SelectItem value="traitement">En traitement</SelectItem>
                        <SelectItem value="traite">Traité</SelectItem>
                        <SelectItem value="archive">Archivé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Assigner à</Label>
                    <Select value={assignedTo || ""} onValueChange={setAssignedTo}>
                      <SelectTrigger data-testid="assign-select">
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Commentaire</Label>
                    <Textarea
                      data-testid="comment-textarea"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Ajouter un commentaire..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Historique</CardTitle>
                </CardHeader>
                <CardContent>
                  {mail?.workflow && mail.workflow.length > 0 ? (
                    <div className="space-y-4">
                      {mail.workflow.map((step, index) => (
                        <div key={index} className="relative pl-6 pb-4 border-l-2 border-slate-200 last:border-0">
                          <div className="absolute left-[-5px] top-0 w-3 h-3 rounded-full bg-blue-600"></div>
                          <div>
                            <Badge className="mb-2">{step.status}</Badge>
                            <p className="text-sm font-medium text-slate-900">{step.user_name}</p>
                            <p className="text-xs text-slate-500">{formatDate(step.timestamp)}</p>
                            {step.comment && (
                              <p className="text-sm text-slate-600 mt-2 italic">"{step.comment}"</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Aucun historique</p>
                  )}
                </CardContent>
              </Card>

              {mail?.related_mails && mail.related_mails.length > 0 && (
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Échanges liés</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {mail.related_mails.map((relatedMail) => (
                        <div
                          key={relatedMail.id}
                          data-testid={`related-mail-${relatedMail.id}`}
                          className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                          onClick={() => navigate(`/message/${relatedMail.id}`)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <Badge variant={relatedMail.type === "entrant" ? "default" : "secondary"} className="text-xs">
                              {relatedMail.type === "entrant" ? "Entrant" : "Sortant"}
                            </Badge>
                            <ExternalLink className="h-3 w-3 text-slate-400" />
                          </div>
                          <p className="text-xs font-mono text-slate-600 mb-1">{relatedMail.reference}</p>
                          <p className="text-sm font-medium text-slate-900 line-clamp-2">{relatedMail.subject}</p>
                          <p className="text-xs text-slate-500 mt-1">{formatDate(relatedMail.created_at)}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Informations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {/* Affichage des destinataires multiples */}
                  {mail?.service_names && mail.service_names.length > 0 ? (
                    <>
                      <div>
                        <span className="text-slate-600">Destinataire(s):</span>
                        <div className="mt-1 space-y-1">
                          {mail.service_names.map((serviceName, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-1.5"></span>
                              <div>
                                <p className="font-medium">{serviceName}</p>
                                {mail.sub_service_names && mail.sub_service_names[idx] && (
                                  <p className="text-xs text-slate-500 ml-0">{mail.sub_service_names[idx]}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Separator />
                    </>
                  ) : mail?.service_name ? (
                    <>
                      <div>
                        <span className="text-slate-600">Service:</span>
                        <p className="font-medium">{mail.service_name}</p>
                        {mail.sub_service_name && (
                          <p className="text-xs text-slate-500">{mail.sub_service_name}</p>
                        )}
                      </div>
                      <Separator />
                    </>
                  ) : null}

                  <div>
                    <span className="text-slate-600">Correspondant:</span>
                    <p className="font-medium">{mail?.correspondent_name}</p>
                  </div>
                  <Separator />

                  {mail?.message_type && (
                    <>
                      <div>
                        <span className="text-slate-600">Type:</span>
                        <p className="font-medium">{messageTypeLabels[mail.message_type]}</p>
                      </div>
                      {mail.is_registered && (
                        <>
                          <Separator />
                          <div>
                            <span className="text-slate-600">Recommandé:</span>
                            <p className="font-medium text-amber-600">Oui</p>
                            {mail.registered_number && (
                              <p className="text-xs font-mono mt-1 bg-slate-100 px-2 py-1 rounded">
                                {mail.registered_number}
                              </p>
                            )}
                          </div>
                        </>
                      )}
                      <Separator />
                    </>
                  )}
                  <div>
                    <span className="text-slate-600">Créé le:</span>
                    <p className="font-medium">{formatDate(mail?.created_at)}</p>
                  </div>
                  {mail?.parent_mail_reference && (
                    <>
                      <Separator />
                      <div>
                        <span className="text-slate-600">En réponse à:</span>
                        <p className="font-medium text-blue-600">{mail.parent_mail_reference}</p>
                      </div>
                    </>
                  )}
                  {mail?.opened_by_name && (
                    <>
                      <Separator />
                      <div>
                        <span className="text-slate-600">Ouvert par:</span>
                        <p className="font-medium">{mail.opened_by_name}</p>
                        <p className="text-xs text-slate-500">{formatDate(mail.opened_at)}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Barcode Scanner Dialog */}
      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onScan={handleBarcodeScan}
      />
    </div>
  );
};

export default MessageDetailPage;

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
import { toast } from "sonner";
import { ArrowLeft, Upload, X, Download, Save, Send, Reply, ExternalLink, ScanBarcode, Package } from "lucide-react";
import { API } from "../App";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";

const MailDetailPage = ({ user }) => {
  const params = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const barcodeInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [mail, setMail] = useState(null);
  
  const isNew = params.id === "new" || !params.id;
  const id = isNew ? null : params.id;
  const type = isNew ? params.type : null;
  
  // Form state
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [selectedCorrespondent, setSelectedCorrespondent] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedSubService, setSelectedSubService] = useState(null);
  const [status, setStatus] = useState("recu");
  const [comment, setComment] = useState("");
  const [assignedTo, setAssignedTo] = useState(null);
  
  // New fields
  const [messageType, setMessageType] = useState("message");
  const [isRegistered, setIsRegistered] = useState(false);
  const [registeredNumber, setRegisteredNumber] = useState("");
  const [scanningBarcode, setScanningBarcode] = useState(false);
  
  const [correspondents, setCorrespondents] = useState([]);
  const [services, setServices] = useState([]);
  const [users, setUsers] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [correspondentSearch, setCorrespondentSearch] = useState("");
  const [openCorrespondent, setOpenCorrespondent] = useState(false);

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
        setSelectedService(parsed.service_id);
        setSelectedSubService(parsed.sub_service_id);
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
      setMessageType(mailData.message_type || "message");
      setIsRegistered(mailData.is_registered || false);
      setRegisteredNumber(mailData.registered_number || "");
      
      setSelectedCorrespondent({
        id: mailData.correspondent_id,
        name: mailData.correspondent_name
      });
      
      setSelectedService(mailData.service_id);
      setSelectedSubService(mailData.sub_service_id);
      
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
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
      setScanningBarcode(true);
      toast.info("Scannez le code-barres ou tapez le numéro");
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
    navigate(`/mail/new/${replyType}`);
  };

  const handleSave = async () => {
    if (!subject || !content || !selectedCorrespondent || !selectedService) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (isRegistered && !registeredNumber) {
      toast.error("Veuillez saisir le numéro de recommandé");
      return;
    }

    try {
      setLoading(true);
      
      const serviceData = services.find(s => s.id === selectedService);
      const subServiceData = selectedSubService 
        ? serviceData?.sub_services.find(ss => ss.id === selectedSubService)
        : null;

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
          service_id: selectedService,
          service_name: serviceData?.name || "",
          sub_service_id: selectedSubService,
          sub_service_name: subServiceData?.name || null,
          parent_mail_id: parentMailId,
          parent_mail_reference: parentMailReference,
          message_type: messageType,
          is_registered: isRegistered,
          registered_number: isRegistered ? registeredNumber : null
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
        navigate(`/mail/${newMailId}`);
      } else {
        const updateData = {
          subject,
          content,
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

  const selectedServiceData = services.find(s => s.id === selectedService);
  const subServices = selectedServiceData?.sub_services || [];

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
    message: "Message",
    email: "Email",
    depot_main_propre: "Dépôt main propre",
    colis: "Colis"
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
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="message">📧 Message</SelectItem>
                        <SelectItem value="email">✉️ Email</SelectItem>
                        <SelectItem value="depot_main_propre">🤝 Dépôt main propre</SelectItem>
                        <SelectItem value="colis">📦 Colis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(messageType === "message" || messageType === "colis") && (
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
                              ref={barcodeInputRef}
                              data-testid="registered-number-input"
                              value={registeredNumber}
                              onChange={(e) => {
                                setRegisteredNumber(e.target.value);
                                if (scanningBarcode && e.target.value) {
                                  setScanningBarcode(false);
                                }
                              }}
                              placeholder="Ex: 1A123456789FR"
                              className={scanningBarcode ? "border-blue-500 ring-2 ring-blue-200" : ""}
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
                <Popover open={openCorrespondent} onOpenChange={setOpenCorrespondent}>
                  <PopoverTrigger asChild>
                    <Button
                      data-testid="correspondent-select"
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                      disabled={!isNew}
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
                        <CommandEmpty>Aucun correspondant trouvé.</CommandEmpty>
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Service *</Label>
                  <Select value={selectedService} onValueChange={setSelectedService} disabled={!isNew}>
                    <SelectTrigger data-testid="service-select">
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
                    value={selectedSubService || ""} 
                    onValueChange={setSelectedSubService}
                    disabled={!isNew || !selectedService || subServices.length === 0}
                  >
                    <SelectTrigger data-testid="subservice-select">
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {subServices.map((subService) => (
                        <SelectItem key={subService.id} value={subService.id}>
                          {subService.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                          onClick={() => navigate(`/mail/${relatedMail.id}`)}
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
    </div>
  );
};

export default MailDetailPage;

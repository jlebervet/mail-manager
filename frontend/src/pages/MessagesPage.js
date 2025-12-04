import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Plus, Search, Filter } from "lucide-react";
import { API } from "../App";

const MessagesPage = ({ user }) => {
  const { type } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mails, setMails] = useState([]);
  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedService, setSelectedService] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if there's a status filter in URL
    const statusFromUrl = searchParams.get("status");
    if (statusFromUrl) {
      setSelectedStatus(statusFromUrl);
    }
    
    fetchMails();
    fetchServices();
  }, [type, searchParams]);

  const fetchMails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/mails`, {
        params: { type }
      });
      setMails(response.data);
    } catch (error) {
      console.error("Error fetching mails:", error);
    } finally {
      setLoading(false);
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

  const filteredMails = mails.filter((mail) => {
    const matchesSearch =
      mail.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mail.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mail.correspondent_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesService = selectedService === "all" || mail.service_id === selectedService;
    const matchesStatus = selectedStatus === "all" || mail.status === selectedStatus;
    
    return matchesSearch && matchesService && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const statusMap = {
      recu: { label: "Reçu", variant: "default" },
      traitement: { label: "Traitement", variant: "secondary" },
      traite: { label: "Traité", variant: "outline" },
      archive: { label: "Archivé", variant: "outline" },
    };
    const statusInfo = statusMap[status] || statusMap.recu;
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Message {type === "entrant" ? "entrant" : "sortant"}
          </h1>
          <p className="text-slate-600">{filteredMails.length} message(s)</p>
        </div>
        <Button
          data-testid="create-mail-button"
          onClick={() => navigate(`/message/new/${type}`)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nouveau message
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                data-testid="search-input"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger data-testid="service-filter">
                <SelectValue placeholder="Tous les services" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les services</SelectItem>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger data-testid="status-filter">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="recu">Reçu</SelectItem>
                <SelectItem value="traitement">Traitement</SelectItem>
                <SelectItem value="traite">Traité</SelectItem>
                <SelectItem value="archive">Archivé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Mails List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-slate-500">Chargement...</p>
        </div>
      ) : filteredMails.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12">
            <p className="text-center text-slate-500">Aucun message trouvé</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredMails.map((mail) => (
            <Card
              key={mail.id}
              data-testid={`mail-card-${mail.id}`}
              className="border-0 shadow-sm card-hover cursor-pointer"
              onClick={() => navigate(`/message/${mail.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-slate-900">{mail.reference}</span>
                      {getStatusBadge(mail.status)}
                      {mail.attachments && mail.attachments.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {mail.attachments.length} pièce(s) jointe(s)
                        </Badge>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-medium text-slate-900 mb-2">{mail.subject}</h3>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                      <span><strong>Correspondant:</strong> {mail.correspondent_name}</span>
                      <span><strong>Service:</strong> {mail.service_name}</span>
                      {mail.sub_service_name && (
                        <span><strong>Sous-service:</strong> {mail.sub_service_name}</span>
                      )}
                      {mail.assigned_to_name && (
                        <span><strong>Assigné à:</strong> {mail.assigned_to_name}</span>
                      )}
                    </div>
                    
                    <div className="mt-3 text-xs text-slate-500">
                      Créé le {formatDate(mail.created_at)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessagesPage;

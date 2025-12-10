import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { BarChart, TrendingUp, Calendar, Package, Mail, Building2 } from "lucide-react";
import { API } from "../App";

const AdvancedStatsPage = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [services, setServices] = useState([]);
  const [filters, setFilters] = useState({
    period: "month",
    service_id: null,
    message_type: null
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    fetchStats();
  }, [filters]);

  const fetchServices = async () => {
    try {
      const response = await axios.get(`${API}/services`);
      setServices(response.data);
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.period) params.append("period", filters.period);
      if (filters.service_id) params.append("service_id", filters.service_id);
      if (filters.message_type) params.append("message_type", filters.message_type);
      
      const response = await axios.get(`${API}/stats/advanced?${params.toString()}`);
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === "all" ? null : value
    }));
  };

  const getPeriodLabel = (period) => {
    const labels = {
      week: "7 derniers jours",
      month: "30 derniers jours",
      year: "Dernière année",
      all: "Toutes les périodes"
    };
    return labels[period] || labels.all;
  };

  const getMessageTypeLabel = (type) => {
    const labels = {
      courrier: "📧 Courrier postal",
      email: "💌 Email",
      accueil_physique: "🤝 Accueil Physique",
      accueil_telephonique: "📞 Accueil Téléphonique",
      colis: "📦 Colis"
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Statistiques Avancées
        </h1>
        <p className="text-slate-600">
          Analysez vos messages avec des filtres personnalisés
        </p>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Period Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                <Calendar className="inline h-4 w-4 mr-1" />
                Période
              </label>
              <Select value={filters.period || "all"} onValueChange={(value) => updateFilter("period", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">7 derniers jours</SelectItem>
                  <SelectItem value="month">30 derniers jours</SelectItem>
                  <SelectItem value="year">Dernière année</SelectItem>
                  <SelectItem value="all">Toutes les périodes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Service Filter (Admin only) */}
            {user?.role === "admin" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  <Building2 className="inline h-4 w-4 mr-1" />
                  Service
                </label>
                <Select value={filters.service_id || "all"} onValueChange={(value) => updateFilter("service_id", value)}>
                  <SelectTrigger>
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
              </div>
            )}

            {/* Message Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                <Package className="inline h-4 w-4 mr-1" />
                Type de message
              </label>
              <Select value={filters.message_type || "all"} onValueChange={(value) => updateFilter("message_type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="courrier">📧 Courrier postal</SelectItem>
                  <SelectItem value="email">💌 Email</SelectItem>
                  <SelectItem value="depot_main_propre">🤝 Dépôt main propre</SelectItem>
                  <SelectItem value="colis">📦 Colis</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Filter Summary */}
      <div className="flex flex-wrap gap-2 text-sm">
        <span className="text-slate-600">Filtres actifs:</span>
        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
          {getPeriodLabel(filters.period || "all")}
        </span>
        {filters.service_id && (
          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
            {services.find(s => s.id === filters.service_id)?.name || "Service"}
          </span>
        )}
        {filters.message_type && (
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full">
            {getMessageTypeLabel(filters.message_type)}
          </span>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-lg text-slate-600">Chargement des statistiques...</div>
        </div>
      ) : stats ? (
        <>
          {/* Main Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Total</p>
                    <p className="text-3xl font-bold text-slate-900">{stats.total_mails}</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-xl">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Entrant</p>
                    <p className="text-3xl font-bold text-slate-900">{stats.entrant_mails}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-xl">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Sortant</p>
                    <p className="text-3xl font-bold text-slate-900">{stats.sortant_mails}</p>
                  </div>
                  <div className="bg-amber-50 p-3 rounded-xl">
                    <TrendingUp className="h-6 w-6 text-amber-600 rotate-180" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Traités</p>
                    <p className="text-3xl font-bold text-slate-900">{stats.status_counts.traite}</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-xl">
                    <Package className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Breakdown */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Répartition par statut</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(stats.status_counts).map(([status, count]) => {
                  const statusLabels = {
                    recu: "Reçu",
                    traitement: "En traitement",
                    traite: "Traité",
                    archive: "Archivé"
                  };
                  const statusColors = {
                    recu: "bg-blue-100 text-blue-700",
                    traitement: "bg-amber-100 text-amber-700",
                    traite: "bg-green-100 text-green-700",
                    archive: "bg-slate-100 text-slate-700"
                  };
                  return (
                    <div key={status} className={`p-4 rounded-lg ${statusColors[status]}`}>
                      <p className="text-sm font-medium mb-1">{statusLabels[status]}</p>
                      <p className="text-2xl font-bold">{count}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Message Type Breakdown */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Répartition par type de message</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.message_type_counts).map(([type, count]) => {
                  const total = stats.total_mails;
                  const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">
                          {getMessageTypeLabel(type)}
                        </span>
                        <span className="text-sm text-slate-600">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Service Breakdown (Admin only) */}
          {user?.role === "admin" && Object.keys(stats.service_counts).length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Répartition par service</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.service_counts).map(([service, count]) => {
                    const total = stats.total_mails;
                    const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                    return (
                      <div key={service}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700">
                            {service}
                          </span>
                          <span className="text-sm text-slate-600">
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-slate-500">Aucune donnée disponible</p>
        </div>
      )}
    </div>
  );
};

export default AdvancedStatsPage;

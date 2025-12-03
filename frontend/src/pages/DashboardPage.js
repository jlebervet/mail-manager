import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Mail, MailOpen, Clock, Archive, TrendingUp } from "lucide-react";
import { API } from "../App";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";

const DashboardPage = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [recentMails, setRecentMails] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
    fetchRecentMails();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/stats`);
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchRecentMails = async () => {
    try {
      const response = await axios.get(`${API}/mails`);
      setRecentMails(response.data.slice(0, 5));
    } catch (error) {
      console.error("Error fetching recent mails:", error);
    }
  };

  const statCards = [
    {
      title: "Courrier entrant",
      value: stats?.entrant_mails || 0,
      icon: Mail,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Courrier sortant",
      value: stats?.sortant_mails || 0,
      icon: MailOpen,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "En traitement",
      value: stats?.status_counts?.traitement || 0,
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      title: "Archivés",
      value: stats?.status_counts?.archive || 0,
      icon: Archive,
      color: "text-slate-600",
      bgColor: "bg-slate-50",
    },
  ];

  const getStatusBadge = (status) => {
    const statusMap = {
      recu: { label: "Reçu", class: "status-badge recu" },
      traitement: { label: "Traitement", class: "status-badge traitement" },
      traite: { label: "Traité", class: "status-badge traite" },
      archive: { label: "Archivé", class: "status-badge archive" },
    };
    const statusInfo = statusMap[status] || statusMap.recu;
    return <span className={statusInfo.class}>{statusInfo.label}</span>;
  };

  return (
    <div className="space-y-8 fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Tableau de bord</h1>
        <p className="text-slate-600">Bienvenue, {user?.name}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="card-hover border-0 shadow-sm" data-testid={`stat-card-${index}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-xl`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Assigned to me */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Courriers qui me sont assignés</CardTitle>
            <p className="text-sm text-slate-600 mt-1">{stats?.assigned_to_me || 0} courrier(s)</p>
          </div>
          <TrendingUp className="h-5 w-5 text-blue-600" />
        </CardHeader>
      </Card>

      {/* Recent Mails */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Courriers récents</CardTitle>
        </CardHeader>
        <CardContent>
          {recentMails.length === 0 ? (
            <p className="text-center text-slate-500 py-8">Aucun courrier récent</p>
          ) : (
            <div className="space-y-3">
              {recentMails.map((mail) => (
                <div
                  key={mail.id}
                  data-testid={`recent-mail-${mail.id}`}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer"
                  onClick={() => navigate(`/mail/${mail.id}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-slate-900">{mail.reference}</span>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        {mail.type === "entrant" ? "Entrant" : "Sortant"}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-1">{mail.subject}</p>
                    <p className="text-xs text-slate-500">{mail.correspondent_name} • {mail.service_name}</p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(mail.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Button
          data-testid="quick-new-entrant"
          onClick={() => navigate("/mail/new/entrant")}
          className="h-24 text-lg bg-blue-600 hover:bg-blue-700"
        >
          <Mail className="mr-2 h-5 w-5" />
          Nouveau courrier entrant
        </Button>
        <Button
          data-testid="quick-new-sortant"
          onClick={() => navigate("/mail/new/sortant")}
          variant="outline"
          className="h-24 text-lg border-blue-600 text-blue-600 hover:bg-blue-50"
        >
          <MailOpen className="mr-2 h-5 w-5" />
          Nouveau courrier sortant
        </Button>
      </div>
    </div>
  );
};

export default DashboardPage;

import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Ticket as TicketIcon,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageSquare,
  Filter,
  Loader2
} from "lucide-react";
import { useLanguage } from "../components/ui/LanguageSwitcher";
import SEOHead from "../components/seo/SEOHead";
import CreateTicketDialog from "../components/tickets/CreateTicketDialog";

const statusConfig = {
  abierto: {
    label_es: "Abierto",
    label_en: "Open",
    icon: AlertCircle,
    color: "bg-blue-500",
    textColor: "text-blue-700",
    bgColor: "bg-blue-50"
  },
  en_progreso: {
    label_es: "En progreso",
    label_en: "In progress",
    icon: Clock,
    color: "bg-amber-500",
    textColor: "text-amber-700",
    bgColor: "bg-amber-50"
  },
  resuelto: {
    label_es: "Resuelto",
    label_en: "Resolved",
    icon: CheckCircle2,
    color: "bg-green-500",
    textColor: "text-green-700",
    bgColor: "bg-green-50"
  },
  cerrado: {
    label_es: "Cerrado",
    label_en: "Closed",
    icon: XCircle,
    color: "bg-gray-500",
    textColor: "text-gray-700",
    bgColor: "bg-gray-50"
  }
};

const typeConfig = {
  soporte_cliente: { label_es: "Soporte Cliente", label_en: "Client Support" },
  soporte_autonomo: { label_es: "Soporte Autónomo", label_en: "Professional Support" },
  reclamo: { label_es: "Reclamo", label_en: "Claim" },
  problema_trabajo: { label_es: "Problema con Trabajo", label_en: "Work Issue" },
  problema_pago: { label_es: "Problema de Pago", label_en: "Payment Issue" },
  consulta_tecnica: { label_es: "Consulta Técnica", label_en: "Technical Query" },
  otros: { label_es: "Otros", label_en: "Other" }
};

export default function TicketsPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    }
  };

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['tickets', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const allTickets = await base44.entities.Ticket.list('-created_date');
      return allTickets;
    },
    enabled: !!user,
  });

  const filteredTickets = tickets.filter(ticket => {
    const statusMatch = filterStatus === "all" || ticket.status === filterStatus;
    const typeMatch = filterType === "all" || ticket.type === filterType;
    return statusMatch && typeMatch;
  });

  const getStatusLabel = (status) => {
    return language === 'es' 
      ? statusConfig[status]?.label_es 
      : statusConfig[status]?.label_en;
  };

  const getTypeLabel = (type) => {
    return language === 'es' 
      ? typeConfig[type]?.label_es 
      : typeConfig[type]?.label_en;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return language === 'es' ? 'Hace menos de 1h' : 'Less than 1h ago';
    if (diffHours < 24) return language === 'es' ? `Hace ${diffHours}h` : `${diffHours}h ago`;
    if (diffDays === 1) return language === 'es' ? 'Hace 1 día' : '1 day ago';
    if (diffDays < 7) return language === 'es' ? `Hace ${diffDays} días` : `${diffDays} days ago`;
    
    return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <>
      <SEOHead 
        title={language === 'es' ? "Mis Tickets - MisAutónomos" : "My Tickets - MisAutónomos"}
        description={language === 'es' 
          ? "Gestiona tus tickets de soporte y reclamos"
          : "Manage your support tickets and claims"}
        noindex={true}
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <TicketIcon className="w-8 h-8 text-blue-600" />
                {language === 'es' ? 'Mis Tickets' : 'My Tickets'}
              </h1>
              <p className="text-gray-600">
                {language === 'es' 
                  ? 'Gestiona tus solicitudes de soporte y reclamos'
                  : 'Manage your support requests and claims'}
              </p>
            </div>
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              {language === 'es' ? 'Nuevo Ticket' : 'New Ticket'}
            </Button>
          </div>

          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">
                  {language === 'es' ? 'Filtros' : 'Filters'}
                </h3>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="flex gap-2">
                  <Button
                    variant={filterStatus === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterStatus("all")}
                  >
                    {language === 'es' ? 'Todos' : 'All'}
                  </Button>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <Button
                      key={key}
                      variant={filterStatus === key ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterStatus(key)}
                      className={filterStatus === key ? config.color : ''}
                    >
                      {getStatusLabel(key)}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="h-48 animate-pulse bg-gray-100" />
              ))}
            </div>
          ) : filteredTickets.length === 0 ? (
            <Card className="p-12 text-center">
              <TicketIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {language === 'es' ? 'No hay tickets' : 'No tickets'}
              </h3>
              <p className="text-gray-600 mb-6">
                {language === 'es' 
                  ? 'Aún no has creado ningún ticket de soporte'
                  : "You haven't created any support tickets yet"}
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                {language === 'es' ? 'Crear primer ticket' : 'Create first ticket'}
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTickets.map((ticket) => {
                const statusInfo = statusConfig[ticket.status];
                const StatusIcon = statusInfo.icon;

                return (
                  <Card 
                    key={ticket.id}
                    className="hover:shadow-lg transition-all cursor-pointer border-2 border-gray-100 hover:border-blue-300"
                    onClick={() => navigate(createPageUrl("TicketDetail") + `?id=${ticket.id}`)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 ${statusInfo.color} rounded-lg flex items-center justify-center`}>
                            <StatusIcon className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm font-mono text-gray-600">
                            #{ticket.ticket_number}
                          </span>
                        </div>
                        <Badge className={`${statusInfo.bgColor} ${statusInfo.textColor} border-0`}>
                          {getStatusLabel(ticket.status)}
                        </Badge>
                      </div>

                      <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">
                        {ticket.title}
                      </h3>

                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {ticket.description}
                      </p>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          <span>{ticket.response_count || 0}</span>
                        </div>
                        <span>{formatDate(ticket.created_date)}</span>
                      </div>

                      {ticket.tags && ticket.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {ticket.tags.slice(0, 2).map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {ticket.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{ticket.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <CreateTicketDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        user={user}
      />
    </>
  );
}
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LifeBuoy,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  MessageSquare,
  Loader2
} from "lucide-react";
import { useLanguage } from "../components/ui/LanguageSwitcher";
import CreateTicketDialog from "../components/tickets/CreateTicketDialog";
import SEOHead from "../components/seo/SEOHead";

const statusConfig = {
  abierto: { icon: Clock, color: "bg-blue-500", text_es: "Abierto", text_en: "Open" },
  en_progreso: { icon: AlertCircle, color: "bg-amber-500", text_es: "En progreso", text_en: "In progress" },
  resuelto: { icon: CheckCircle, color: "bg-green-500", text_es: "Resuelto", text_en: "Resolved" },
  cerrado: { icon: XCircle, color: "bg-gray-500", text_es: "Cerrado", text_en: "Closed" }
};

const typeConfig = {
  soporte_cliente: { text_es: "Soporte Cliente", text_en: "Client Support" },
  soporte_autonomo: { text_es: "Soporte Autónomo", text_en: "Professional Support" },
  reclamo: { text_es: "Reclamo", text_en: "Complaint" },
  problema_trabajo: { text_es: "Problema con trabajo", text_en: "Job Issue" },
  problema_pago: { text_es: "Problema de pago", text_en: "Payment Issue" },
  consulta_general: { text_es: "Consulta general", text_en: "General Query" }
};

export default function TicketsPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [user, setUser] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  React.useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      base44.auth.redirectToLogin();
    }
  };

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['tickets', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      console.log('🔍 Buscando tickets para usuario:', user.id);
      const allTickets = await base44.entities.Ticket.list();
      console.log('📋 Total tickets en sistema:', allTickets.length);
      
      const userTickets = allTickets.filter(t => 
        t.creator_id === user.id || t.assigned_to_id === user.id
      );
      console.log('📋 Tickets del usuario:', userTickets.length);
      
      return userTickets.sort((a, b) => 
        new Date(b.last_activity || b.created_date) - new Date(a.last_activity || a.created_date)
      );
    },
    enabled: !!user,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const { data: messageCounts = {} } = useQuery({
    queryKey: ['ticketMessageCounts'],
    queryFn: async () => {
      const allMessages = await base44.entities.TicketMessage.list();
      const counts = {};
      allMessages.forEach(msg => {
        counts[msg.ticket_id] = (counts[msg.ticket_id] || 0) + 1;
      });
      return counts;
    },
  });

  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = filterStatus === "all" || ticket.status === filterStatus;
    const matchesType = filterType === "all" || ticket.type === filterType;
    const matchesSearch = !searchTerm || 
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesType && matchesSearch;
  });

  const getStatusLabel = (status) => {
    return language === 'es' ? statusConfig[status]?.text_es : statusConfig[status]?.text_en;
  };

  const getTypeLabel = (type) => {
    return language === 'es' ? typeConfig[type]?.text_es : typeConfig[type]?.text_en;
  };

  const stats = {
    total: tickets.length,
    abiertos: tickets.filter(t => t.status === 'abierto').length,
    en_progreso: tickets.filter(t => t.status === 'en_progreso').length,
    resueltos: tickets.filter(t => t.status === 'resuelto').length,
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <>
      <SEOHead 
        title={language === 'es' ? "Mis Tickets de Soporte - MisAutónomos" : "My Support Tickets - MisAutónomos"}
        description={language === 'es' ? "Gestiona tus tickets de soporte" : "Manage your support tickets"}
        noindex={true}
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <LifeBuoy className="w-8 h-8 text-blue-600" />
                {language === 'es' ? 'Mis Tickets de Soporte' : 'My Support Tickets'}
              </h1>
              <p className="text-gray-600">
                {language === 'es' 
                  ? 'Gestiona tus consultas y problemas reportados'
                  : 'Manage your queries and reported issues'}
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-600 mb-1">{language === 'es' ? 'Total' : 'Total'}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-600 mb-1">{language === 'es' ? 'Abiertos' : 'Open'}</p>
                <p className="text-2xl font-bold text-blue-600">{stats.abiertos}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-600 mb-1">{language === 'es' ? 'En progreso' : 'In progress'}</p>
                <p className="text-2xl font-bold text-amber-600">{stats.en_progreso}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-600 mb-1">{language === 'es' ? 'Resueltos' : 'Resolved'}</p>
                <p className="text-2xl font-bold text-green-600">{stats.resueltos}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-blue-600" />
                <h2 className="font-semibold text-gray-900">
                  {language === 'es' ? 'Filtros' : 'Filters'}
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder={language === 'es' ? "Buscar tickets..." : "Search tickets..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'es' ? "Estado" : "Status"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === 'es' ? 'Todos los estados' : 'All statuses'}</SelectItem>
                    <SelectItem value="abierto">{getStatusLabel('abierto')}</SelectItem>
                    <SelectItem value="en_progreso">{getStatusLabel('en_progreso')}</SelectItem>
                    <SelectItem value="resuelto">{getStatusLabel('resuelto')}</SelectItem>
                    <SelectItem value="cerrado">{getStatusLabel('cerrado')}</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'es' ? "Tipo" : "Type"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === 'es' ? 'Todos los tipos' : 'All types'}</SelectItem>
                    {Object.entries(typeConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {language === 'es' ? config.text_es : config.text_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : filteredTickets.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {language === 'es' ? 'No hay tickets' : 'No tickets'}
              </h3>
              <p className="text-gray-600 mb-6">
                {language === 'es' 
                  ? 'Crea tu primer ticket de soporte para obtener ayuda'
                  : 'Create your first support ticket to get help'}
              </p>
              <Button onClick={() => setShowCreateDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                {language === 'es' ? 'Crear Ticket' : 'Create Ticket'}
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map((ticket) => {
                const StatusIcon = statusConfig[ticket.status]?.icon;
                const messageCount = messageCounts[ticket.id] || 0;
                
                return (
                  <Card 
                    key={ticket.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-gray-100 hover:border-blue-200"
                    onClick={() => navigate(createPageUrl("TicketDetail") + `?id=${ticket.id}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline" className="font-mono text-xs">
                              {ticket.ticket_number}
                            </Badge>
                            <Badge className={`${statusConfig[ticket.status]?.color} text-white`}>
                              {StatusIcon && <StatusIcon className="w-3 h-3 mr-1" />}
                              {getStatusLabel(ticket.status)}
                            </Badge>
                            <Badge variant="outline">
                              {getTypeLabel(ticket.type)}
                            </Badge>
                          </div>
                          
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {ticket.title}
                          </h3>
                          
                          <p className="text-gray-600 line-clamp-2 mb-3">
                            {ticket.description}
                          </p>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-4 h-4" />
                              <span>{messageCount} {language === 'es' ? 'mensajes' : 'messages'}</span>
                            </div>
                            <span>
                              {language === 'es' ? 'Creado' : 'Created'}{' '}
                              {new Date(ticket.created_date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')}
                            </span>
                            {ticket.last_activity && (
                              <span>
                                {language === 'es' ? 'Actualizado' : 'Updated'}{' '}
                                {new Date(ticket.last_activity).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')}
                              </span>
                            )}
                          </div>

                          {ticket.tags && ticket.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                              {ticket.tags.map((tag, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
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
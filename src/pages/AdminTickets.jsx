import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
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
  TicketIcon,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  User as UserIcon,
  Calendar,
  Tag,
  MessageSquare,
  TrendingUp
} from "lucide-react";
import SEOHead from "../components/seo/SEOHead";

const statusConfig = {
  abierto: { label: "Abierto", icon: AlertCircle, color: "bg-blue-500", textColor: "text-blue-700", bgColor: "bg-blue-50" },
  en_progreso: { label: "En progreso", icon: Clock, color: "bg-amber-500", textColor: "text-amber-700", bgColor: "bg-amber-50" },
  resuelto: { label: "Resuelto", icon: CheckCircle2, color: "bg-green-500", textColor: "text-green-700", bgColor: "bg-green-50" },
  cerrado: { label: "Cerrado", icon: XCircle, color: "bg-gray-500", textColor: "text-gray-700", bgColor: "bg-gray-50" }
};

const typeConfig = {
  soporte_cliente: "Soporte Cliente",
  soporte_autonomo: "Soporte Autónomo",
  reclamo: "Reclamo",
  problema_trabajo: "Problema con Trabajo",
  problema_pago: "Problema de Pago",
  consulta_tecnica: "Consulta Técnica",
  otros: "Otros"
};

const priorityConfig = {
  baja: { label: "Baja", color: "bg-gray-400" },
  media: { label: "Media", color: "bg-blue-500" },
  alta: { label: "Alta", color: "bg-amber-500" },
  urgente: { label: "Urgente", color: "bg-red-500" }
};

export default function AdminTicketsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['adminTickets'],
    queryFn: async () => {
      const allTickets = await base44.entities.Ticket.list('-created_date');
      return allTickets;
    },
  });

  const assignToMeMutation = useMutation({
    mutationFn: async (ticketId) => {
      const user = await base44.auth.me();
      await base44.entities.Ticket.update(ticketId, {
        assigned_to_id: user.id,
        assigned_to_name: user.full_name || user.email,
        status: 'en_progreso'
      });

      await base44.entities.TicketMessage.create({
        ticket_id: ticketId,
        sender_id: user.id,
        sender_name: user.full_name || user.email,
        sender_role: 'admin',
        content: `Ticket asignado a ${user.full_name || user.email}`,
        action_type: "assignment"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTickets'] });
    },
  });

  const filteredTickets = tickets.filter(ticket => {
    const statusMatch = filterStatus === "all" || ticket.status === filterStatus;
    const typeMatch = filterType === "all" || ticket.type === filterType;
    const priorityMatch = filterPriority === "all" || ticket.priority === filterPriority;
    
    const searchMatch = !searchTerm || 
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.creator_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return statusMatch && typeMatch && priorityMatch && searchMatch;
  });

  const stats = {
    total: tickets.length,
    abiertos: tickets.filter(t => t.status === 'abierto').length,
    en_progreso: tickets.filter(t => t.status === 'en_progreso').length,
    resueltos: tickets.filter(t => t.status === 'resuelto').length,
    urgentes: tickets.filter(t => t.priority === 'urgente').length
  };

  return (
    <>
      <SEOHead title="Gestión de Tickets - Admin" noindex={true} />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <TicketIcon className="w-8 h-8 text-blue-600" />
              Gestión de Tickets
            </h1>
            <p className="text-gray-600">Panel de administración de tickets de soporte</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
                <p className="text-sm text-gray-600">Total</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-blue-500">{stats.abiertos}</p>
                <p className="text-sm text-gray-600">Abiertos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-amber-500">{stats.en_progreso}</p>
                <p className="text-sm text-gray-600">En progreso</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-green-500">{stats.resueltos}</p>
                <p className="text-sm text-gray-600">Resueltos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-red-500">{stats.urgentes}</p>
                <p className="text-sm text-gray-600">Urgentes</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Filtros</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar tickets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    {Object.entries(typeConfig).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="Prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las prioridades</SelectItem>
                    {Object.entries(priorityConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {filteredTickets.map((ticket) => {
              const statusInfo = statusConfig[ticket.status];
              const StatusIcon = statusInfo.icon;
              const priorityInfo = priorityConfig[ticket.priority];

              return (
                <Card 
                  key={ticket.id}
                  className="hover:shadow-lg transition-all cursor-pointer border-2 border-gray-100 hover:border-blue-300"
                  onClick={() => navigate(createPageUrl("TicketDetail") + `?id=${ticket.id}`)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`w-12 h-12 ${statusInfo.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <StatusIcon className="w-6 h-6 text-white" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-mono text-gray-600">
                              #{ticket.ticket_number}
                            </span>
                            <Badge className={`${statusInfo.bgColor} ${statusInfo.textColor} border-0`}>
                              {statusInfo.label}
                            </Badge>
                            <Badge className={`${priorityInfo.color} text-white border-0`}>
                              {priorityInfo.label}
                            </Badge>
                          </div>

                          <h3 className="font-bold text-lg text-gray-900 mb-2">
                            {ticket.title}
                          </h3>

                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {ticket.description}
                          </p>

                          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <UserIcon className="w-3 h-3" />
                              <span>{ticket.creator_name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(ticket.created_date).toLocaleDateString('es-ES')}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              <span>{ticket.response_count || 0} respuestas</span>
                            </div>
                            {ticket.tags && ticket.tags.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Tag className="w-3 h-3" />
                                <span>{ticket.tags.join(', ')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {!ticket.assigned_to_id ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              assignToMeMutation.mutate(ticket.id);
                            }}
                            className="whitespace-nowrap"
                          >
                            Asignarme
                          </Button>
                        ) : (
                          <Badge variant="secondary" className="text-xs whitespace-nowrap">
                            Asignado: {ticket.assigned_to_name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredTickets.length === 0 && !isLoading && (
              <Card className="p-12 text-center">
                <TicketIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No hay tickets con estos filtros
                </h3>
                <p className="text-gray-600">
                  Intenta ajustar los filtros de búsqueda
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
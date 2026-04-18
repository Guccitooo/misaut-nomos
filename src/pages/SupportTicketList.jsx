import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, AlertCircle, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { useLanguage } from "@/components/ui/LanguageSwitcher";

export default function SupportTicketList() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["tickets", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.Ticket.filter({ creator_id: user.id });
    },
    enabled: !!user?.id,
  });

  const statusConfig = {
    abierto: { icon: AlertCircle, color: "bg-red-100 text-red-800" },
    en_progreso: { icon: Clock, color: "bg-blue-100 text-blue-800" },
    resuelto: { icon: CheckCircle2, color: "bg-green-100 text-green-800" },
    cerrado: { icon: CheckCircle2, color: "bg-gray-100 text-gray-800" },
  };

  const filtered = tickets.filter((t) => filter === "all" || t.status === filter);

  if (isLoading) {
    return <div className="p-6 text-center">{t("common.loading")}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t("supportChat.myTickets")}</h1>
          <p className="text-gray-500 mt-2">Gestiona tus solicitudes de soporte</p>
        </div>
        <Button onClick={() => navigate("/soporte/nuevo")} className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo ticket
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["all", "abierto", "en_progreso", "resuelto", "cerrado"].map((status) => (
          <Button
            key={status}
            variant={filter === status ? "default" : "outline"}
            onClick={() => setFilter(status)}
            className="capitalize"
          >
            {status === "all" ? "Todos" : status.replace("_", " ")}
          </Button>
        ))}
      </div>

      {/* Lista de tickets */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-8 text-center">
              <p className="text-gray-600">No hay tickets en este estado</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((ticket) => {
            const statusInfo = statusConfig[ticket.status] || statusConfig.abierto;
            const Icon = statusInfo.icon;
            return (
              <Card
                key={ticket.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/soporte/ticket/${ticket.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{ticket.title}</h3>
                        <Badge className={statusInfo.color}>
                          <Icon className="w-3 h-3 mr-1" />
                          {ticket.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-2">{ticket.description}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(ticket.created_date).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
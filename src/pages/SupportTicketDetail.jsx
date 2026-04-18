import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Loader2, Headphones } from "lucide-react";
import { useLanguage } from "@/components/ui/LanguageSwitcher";

export default function SupportTicketDetail() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => navigate("/"));
  }, [navigate]);

  const { data: ticket, isLoading } = useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: () => base44.entities.Ticket.list().then((tickets) =>
      tickets.find((t) => t.id === ticketId)
    ),
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["ticketMessages", ticketId],
    queryFn: () =>
      base44.entities.TicketMessage.filter({ ticket_id: ticketId }).then((msgs) =>
        msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
      ),
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content) => {
      return await base44.entities.TicketMessage.create({
        ticket_id: ticketId,
        sender_id: user.id,
        sender_name: user.full_name || user.email,
        sender_type: "client",
        content,
      });
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["ticketMessages", ticketId] });
      // Scroll al final
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    },
  });

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessageMutation.mutate(newMessage);
    }
  };

  const statusConfig = {
    abierto: "bg-red-100 text-red-800",
    en_progreso: "bg-blue-100 text-blue-800",
    resuelto: "bg-green-100 text-green-800",
    cerrado: "bg-gray-100 text-gray-800",
  };

  if (isLoading || !ticket) {
    return <div className="p-6 text-center">{t("common.loading")}</div>;
  }

  const canSendMessage = ticket.status !== "cerrado";

  return (
    <div className="max-w-4xl mx-auto p-6 h-screen flex flex-col">
      <Button
        variant="ghost"
        onClick={() => navigate("/soporte")}
        className="mb-6 gap-2 w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </Button>

      {/* Header del ticket */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{ticket.title}</h1>
              <p className="text-gray-500 text-sm mt-1">
                Ticket #{ticket.ticket_number || ticket.id.slice(0, 8)}
              </p>
            </div>
            <Badge className={statusConfig[ticket.status] || statusConfig.abierto}>
              {ticket.status.replace("_", " ")}
            </Badge>
          </div>
          <p className="text-gray-700 mb-4">{ticket.description}</p>
          <div className="flex gap-4 text-sm text-gray-500">
            <span>Creado: {new Date(ticket.created_date).toLocaleDateString("es-ES")}</span>
            {ticket.admin_assigned_name && (
              <span className="flex items-center gap-1">
                <Headphones className="w-4 h-4" />
                Asignado a: {ticket.admin_assigned_name}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Conversación */}
      <Card className="flex-1 flex flex-col overflow-hidden mb-6">
        <CardHeader className="border-b bg-gray-50">
          <CardTitle className="text-lg">Conversación</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => {
            const isAdmin = msg.sender_type === "admin";
            const isSender = msg.sender_id === user?.id;

            return (
              <div
                key={msg.id}
                className={`flex ${isSender ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                    isAdmin
                      ? "bg-blue-100 text-blue-900"
                      : isSender
                      ? "bg-gray-200 text-gray-900"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  {isAdmin && (
                    <p className="text-xs font-semibold mb-1 flex items-center gap-1">
                      <Headphones className="w-3 h-3" />
                      Soporte MisAutónomos
                    </p>
                  )}
                  <p className="text-sm break-words">{msg.content}</p>
                  <p className="text-xs opacity-75 mt-1">
                    {new Date(msg.created_date).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </CardContent>
      </Card>

      {/* Input para enviar mensaje */}
      {canSendMessage ? (
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <Input
            placeholder="Escribe tu mensaje..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sendMessageMutation.isPending}
          />
          <Button type="submit" disabled={sendMessageMutation.isPending || !newMessage.trim()} className="gap-2">
            {sendMessageMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Enviar
          </Button>
        </form>
      ) : (
        <div className="bg-gray-100 p-4 rounded-lg text-center text-gray-600">
          Este ticket está cerrado. No puedes enviar más mensajes.
        </div>
      )}
    </div>
  );
}
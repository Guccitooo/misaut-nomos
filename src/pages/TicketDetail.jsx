import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Send,
  Upload,
  X,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Paperclip,
  Tag,
  Shield
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../components/ui/LanguageSwitcher";
import SEOHead from "../components/seo/SEOHead";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusConfig = {
  abierto: { label_es: "Abierto", label_en: "Open", icon: AlertCircle, color: "bg-blue-500" },
  en_progreso: { label_es: "En progreso", label_en: "In progress", icon: Clock, color: "bg-amber-500" },
  resuelto: { label_es: "Resuelto", label_en: "Resolved", icon: CheckCircle2, color: "bg-green-500" },
  cerrado: { label_es: "Cerrado", label_en: "Closed", icon: XCircle, color: "bg-gray-500" }
};

export default function TicketDetailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const messagesEndRef = useRef(null);
  
  const urlParams = new URLSearchParams(window.location.search);
  const ticketId = urlParams.get("id");

  const [user, setUser] = useState(null);
  const [messageContent, setMessageContent] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      base44.auth.redirectToLogin();
    }
  };

  const { data: ticket, isLoading: loadingTicket } = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: async () => {
      const tickets = await base44.entities.Ticket.filter({ id: ticketId });
      return tickets[0] || null;
    },
    enabled: !!ticketId && !!user,
  });

  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['ticketMessages', ticketId],
    queryFn: async () => {
      const msgs = await base44.entities.TicketMessage.filter({ ticket_id: ticketId });
      return msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    },
    enabled: !!ticketId,
    refetchInterval: 5000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, attachments }) => {
      const message = await base44.entities.TicketMessage.create({
        ticket_id: ticketId,
        sender_id: user.id,
        sender_name: user.full_name || user.email,
        sender_role: user.role || 'user',
        content,
        attachments,
        action_type: "message"
      });

      await base44.entities.Ticket.update(ticketId, {
        last_response_date: new Date().toISOString(),
        response_count: (ticket.response_count || 0) + 1
      });

      const recipientId = ticket.creator_id === user.id 
        ? ticket.assigned_to_id 
        : ticket.creator_id;

      if (recipientId) {
        await base44.entities.Notification.create({
          user_id: recipientId,
          type: 'system_update',
          title: language === 'es' ? `Nuevo mensaje en ticket #${ticket.ticket_number}` : `New message in ticket #${ticket.ticket_number}`,
          message: content.substring(0, 100),
          link: `/tickets?id=${ticketId}`,
          priority: 'medium'
        });
      }

      return message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticketMessages', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      setMessageContent("");
      setAttachments([]);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus) => {
      await base44.entities.Ticket.update(ticketId, {
        status: newStatus,
        ...(newStatus === 'resuelto' && { resolved_date: new Date().toISOString() }),
        ...(newStatus === 'cerrado' && { closed_date: new Date().toISOString() })
      });

      await base44.entities.TicketMessage.create({
        ticket_id: ticketId,
        sender_id: user.id,
        sender_name: user.full_name || user.email,
        sender_role: user.role || 'user',
        content: language === 'es' 
          ? `Estado cambiado a: ${statusConfig[newStatus].label_es}`
          : `Status changed to: ${statusConfig[newStatus].label_en}`,
        action_type: "status_change"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['ticketMessages', ticketId] });
      toast.success(language === 'es' ? 'Estado actualizado' : 'Status updated');
    },
  });

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploadedUrls.push(file_url);
      }
      setAttachments([...attachments, ...uploadedUrls]);
      toast.success(language === 'es' ? 'Archivos adjuntados' : 'Files attached');
    } catch (error) {
      toast.error(language === 'es' ? 'Error subiendo archivos' : 'Error uploading files');
    } finally {
      setUploading(false);
    }
  };

  const handleSend = () => {
    if (!messageContent.trim() && attachments.length === 0) {
      toast.error(language === 'es' ? 'Escribe un mensaje o adjunta archivos' : 'Write a message or attach files');
      return;
    }
    sendMessageMutation.mutate({ content: messageContent, attachments });
  };

  if (loadingTicket || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="spinner w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md p-8 text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {language === 'es' ? 'Ticket no encontrado' : 'Ticket not found'}
          </h2>
          <Button onClick={() => navigate(createPageUrl("Tickets"))}>
            {language === 'es' ? 'Volver a tickets' : 'Back to tickets'}
          </Button>
        </Card>
      </div>
    );
  }

  const StatusIcon = statusConfig[ticket.status].icon;
  const isTicketOwner = ticket.creator_id === user.id;
  const isAssigned = ticket.assigned_to_id === user.id;
  const isAdmin = user.role === 'admin';
  const canChangeStatus = isTicketOwner || isAssigned || isAdmin;

  return (
    <>
      <SEOHead 
        title={`${language === 'es' ? 'Ticket' : 'Ticket'} #${ticket.ticket_number} - MisAutónomos`}
        noindex={true}
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("Tickets"))}
            className="mb-4 hover:bg-blue-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {language === 'es' ? 'Volver a tickets' : 'Back to tickets'}
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 ${statusConfig[ticket.status].color} rounded-lg flex items-center justify-center`}>
                          <StatusIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-mono text-gray-600">#{ticket.ticket_number}</p>
                          <Badge className={`${statusConfig[ticket.status].color} text-white border-0`}>
                            {language === 'es' ? statusConfig[ticket.status].label_es : statusConfig[ticket.status].label_en}
                          </Badge>
                        </div>
                      </div>
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {ticket.title}
                      </h1>
                      <p className="text-gray-700 leading-relaxed">
                        {ticket.description}
                      </p>
                    </div>
                  </div>

                  {ticket.attachments && ticket.attachments.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Paperclip className="w-4 h-4" />
                        {language === 'es' ? 'Archivos adjuntos:' : 'Attachments:'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {ticket.attachments.map((url, idx) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                          >
                            📎 {url.split('/').pop()}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h2 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    {language === 'es' ? 'Cronología' : 'Timeline'}
                  </h2>

                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {messages.map((msg, idx) => {
                      const isSystem = msg.action_type !== "message";
                      const isSender = msg.sender_id === user.id;

                      if (msg.is_internal && user.role !== 'admin') return null;

                      return (
                        <div key={msg.id} className={`${isSystem ? 'text-center' : ''}`}>
                          {isSystem ? (
                            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                              <Clock className="w-4 h-4" />
                              <span>{msg.content}</span>
                              <span className="text-xs">
                                {new Date(msg.created_date).toLocaleString(language === 'es' ? 'es-ES' : 'en-US')}
                              </span>
                            </div>
                          ) : (
                            <div className={`flex gap-3 ${isSender ? 'justify-end' : 'justify-start'}`}>
                              {!isSender && (
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                  {msg.sender_role === 'admin' ? (
                                    <Shield className="w-4 h-4 text-blue-600" />
                                  ) : (
                                    <User className="w-4 h-4 text-blue-600" />
                                  )}
                                </div>
                              )}
                              <div className={`max-w-[70%] ${isSender ? 'items-end' : 'items-start'} flex flex-col`}>
                                {msg.is_internal && (
                                  <Badge variant="outline" className="mb-1 bg-amber-50 text-amber-700 border-amber-300">
                                    {language === 'es' ? '🔒 Nota Interna' : '🔒 Internal Note'}
                                  </Badge>
                                )}
                                <div className={`rounded-2xl px-4 py-3 ${
                                  msg.is_internal 
                                    ? 'bg-amber-50 border-2 border-amber-200'
                                    : isSender 
                                      ? 'bg-blue-600 text-white' 
                                      : 'bg-white border-2 border-gray-200'
                                }`}>
                                  <p className="text-sm font-semibold mb-1">
                                    {msg.sender_name}
                                    {msg.sender_role === 'admin' && (
                                      <Badge variant="secondary" className="ml-2 text-xs">Admin</Badge>
                                    )}
                                  </p>
                                  <p className={`text-sm leading-relaxed ${isSender && !msg.is_internal ? 'text-white' : 'text-gray-800'}`}>
                                    {msg.content}
                                  </p>
                                  {msg.attachments && msg.attachments.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                      {msg.attachments.map((url, idx) => (
                                        <a
                                          key={idx}
                                          href={url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={`text-xs flex items-center gap-1 ${
                                            isSender && !msg.is_internal ? 'text-blue-100 hover:text-white' : 'text-blue-600 hover:text-blue-700'
                                          }`}
                                        >
                                          <Paperclip className="w-3 h-3" />
                                          {url.split('/').pop()}
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                  <p className={`text-xs mt-2 ${isSender && !msg.is_internal ? 'text-blue-100' : 'text-gray-500'}`}>
                                    {new Date(msg.created_date).toLocaleString(language === 'es' ? 'es-ES' : 'en-US')}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {ticket.status !== 'cerrado' && (
                    <div className="mt-6 pt-6 border-t">
                      <Textarea
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        placeholder={language === 'es' ? "Escribe tu respuesta..." : "Write your response..."}
                        rows={4}
                        className="mb-3"
                      />

                      {attachments.length > 0 && (
                        <div className="mb-3 space-y-2">
                          {attachments.map((url, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                              <span className="text-sm text-gray-700 truncate">
                                {url.split('/').pop()}
                              </span>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <label className="flex-shrink-0">
                          <Button variant="outline" disabled={uploading} asChild>
                            <span>
                              <Upload className="w-4 h-4 mr-2" />
                              {uploading 
                                ? (language === 'es' ? 'Subiendo...' : 'Uploading...')
                                : (language === 'es' ? 'Adjuntar' : 'Attach')}
                            </span>
                          </Button>
                          <input
                            type="file"
                            multiple
                            onChange={handleFileUpload}
                            className="hidden"
                            disabled={uploading}
                          />
                        </label>
                        
                        <Button
                          onClick={handleSend}
                          disabled={sendMessageMutation.isPending || (!messageContent.trim() && attachments.length === 0)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          {sendMessageMutation.isPending 
                            ? (language === 'es' ? 'Enviando...' : 'Sending...')
                            : (language === 'es' ? 'Enviar' : 'Send')}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-5">
                  <h3 className="font-bold text-gray-900 mb-4">
                    {language === 'es' ? 'Detalles' : 'Details'}
                  </h3>

                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-gray-600 mb-1">{language === 'es' ? 'Estado' : 'Status'}</p>
                      {canChangeStatus ? (
                        <Select
                          value={ticket.status}
                          onValueChange={(value) => updateStatusMutation.mutate(value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusConfig).map(([key, config]) => (
                              <SelectItem key={key} value={key}>
                                {language === 'es' ? config.label_es : config.label_en}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className={`${statusConfig[ticket.status].color} text-white`}>
                          {language === 'es' ? statusConfig[ticket.status].label_es : statusConfig[ticket.status].label_en}
                        </Badge>
                      )}
                    </div>

                    <div>
                      <p className="text-gray-600 mb-1">{language === 'es' ? 'Tipo' : 'Type'}</p>
                      <p className="font-medium text-gray-900">
                        {language === 'es' 
                          ? typeConfig[ticket.type]?.label_es 
                          : typeConfig[ticket.type]?.label_en}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-600 mb-1">{language === 'es' ? 'Prioridad' : 'Priority'}</p>
                      <Badge variant="outline">
                        {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-gray-600 mb-1">{language === 'es' ? 'Creado por' : 'Created by'}</p>
                      <p className="font-medium text-gray-900">{ticket.creator_name}</p>
                    </div>

                    <div>
                      <p className="text-gray-600 mb-1">{language === 'es' ? 'Creado el' : 'Created on'}</p>
                      <p className="font-medium text-gray-900">
                        {new Date(ticket.created_date).toLocaleString(language === 'es' ? 'es-ES' : 'en-US')}
                      </p>
                    </div>

                    {ticket.resolved_date && (
                      <div>
                        <p className="text-gray-600 mb-1">{language === 'es' ? 'Resuelto el' : 'Resolved on'}</p>
                        <p className="font-medium text-gray-900">
                          {new Date(ticket.resolved_date).toLocaleString(language === 'es' ? 'es-ES' : 'en-US')}
                        </p>
                      </div>
                    )}

                    {ticket.tags && ticket.tags.length > 0 && (
                      <div>
                        <p className="text-gray-600 mb-2 flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {language === 'es' ? 'Etiquetas' : 'Tags'}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {ticket.tags.map((tag, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {isAdmin && (
                <Card className="border-2 border-amber-200 bg-amber-50">
                  <CardContent className="p-5">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-amber-600" />
                      {language === 'es' ? 'Panel Admin' : 'Admin Panel'}
                    </h3>
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          if (ticket.status === 'cerrado') {
                            updateStatusMutation.mutate('abierto');
                          } else {
                            updateStatusMutation.mutate('cerrado');
                          }
                        }}
                      >
                        {ticket.status === 'cerrado'
                          ? (language === 'es' ? 'Reabrir Ticket' : 'Reopen Ticket')
                          : (language === 'es' ? 'Cerrar Ticket' : 'Close Ticket')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const typeConfig = {
  soporte_cliente: { label_es: "Soporte Cliente", label_en: "Client Support" },
  soporte_autonomo: { label_es: "Soporte Autónomo", label_en: "Professional Support" },
  reclamo: { label_es: "Reclamo", label_en: "Claim" },
  problema_trabajo: { label_es: "Problema con Trabajo", label_en: "Work Issue" },
  problema_pago: { label_es: "Problema de Pago", label_en: "Payment Issue" },
  consulta_tecnica: { label_es: "Consulta Técnica", label_en: "Technical Query" },
  otros: { label_es: "Otros", label_en: "Other" }
};
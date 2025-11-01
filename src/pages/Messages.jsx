import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Send, MessageSquare, Loader2, Star, CheckCheck, Check, Briefcase, User as UserIcon, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function MessagesPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const initialConversation = urlParams.get('conversation');
  const initialProfessional = urlParams.get('professional');

  const [user, setUser] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(initialConversation);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState(initialProfessional);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewData, setReviewData] = useState({
    rapidez: 0,
    comunicacion: 0,
    calidad: 0,
    precio_satisfaccion: 0,
    comment: ""
  });
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const previousMessagesCountRef = useRef(0);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    loadUser();
  }, []);

  // ✅ Solo hacer scroll al cambiar de conversación (inicial)
  useEffect(() => {
    if (selectedConversation) {
      isInitialLoadRef.current = true;
      // Pequeño delay para que los mensajes se rendericen
      setTimeout(() => {
        scrollToBottom(false); // sin animación para carga inicial
        isInitialLoadRef.current = false;
      }, 300);
    }
  }, [selectedConversation]);

  // ✅ Scroll mejorado con control
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: smooth ? "smooth" : "auto",
        block: "end"
      });
    }
  };

  // ✅ Función para verificar si el usuario está cerca del final
  const isNearBottom = () => {
    if (!messagesContainerRef.current) return true;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const threshold = 150; // pixels desde el final
    return scrollHeight - scrollTop - clientHeight < threshold;
  };

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading user:", error);
      base44.auth.redirectToLogin();
    }
  };

  const { data: otherUserData } = useQuery({
    queryKey: ['otherUser', selectedProfessionalId],
    queryFn: async () => {
      if (!selectedProfessionalId) return null;
      
      const users = await base44.entities.User.filter({ id: selectedProfessionalId });
      const otherUser = users[0];
      
      if (!otherUser) return null;

      if (otherUser.user_type === "professionnel") {
        const profiles = await base44.entities.ProfessionalProfile.filter({
          user_id: selectedProfessionalId
        });
        return {
          ...otherUser,
          profile: profiles[0] || null
        };
      }
      
      return otherUser;
    },
    enabled: !!selectedProfessionalId,
    staleTime: 1000 * 60 * 5,
  });

  const { data: allMessages = [], isLoading } = useQuery({
    queryKey: ['messages', user?.id],
    queryFn: async () => {
      try {
        const sent = await base44.entities.Message.filter({ sender_id: user.id }, '-created_date', 100);
        const received = await base44.entities.Message.filter({ recipient_id: user.id }, '-created_date', 100);
        return [...sent, ...received].sort((a, b) => 
          new Date(b.created_date) - new Date(a.created_date)
        );
      } catch (error) {
        console.error("Error loading messages:", error);
        return [];
      }
    },
    enabled: !!user,
    initialData: [],
    refetchInterval: 3000,
    staleTime: 500,
  });

  const { data: existingReview } = useQuery({
    queryKey: ['review', user?.id, selectedProfessionalId],
    queryFn: async () => {
      if (!user || !selectedProfessionalId || user.user_type !== "client") {
        return null;
      }
      const reviews = await base44.entities.Review.filter({
        professional_id: selectedProfessionalId,
        client_id: user.id
      });
      return reviews[0];
    },
    enabled: !!user && !!selectedProfessionalId && user?.user_type === "client",
  });

  const conversations = allMessages.reduce((acc, msg) => {
    const convId = msg.conversation_id;
    if (!acc[convId]) {
      acc[convId] = {
        conversationId: convId,
        messages: [],
        otherUserId: msg.sender_id === user?.id ? msg.recipient_id : msg.sender_id,
        otherUserName: msg.sender_id === user?.id ? 
          (msg.client_name || msg.professional_name) : 
          (msg.professional_name || msg.client_name),
        lastMessage: msg,
        unreadCount: 0
      };
    }
    acc[convId].messages.push(msg);
    if (msg.recipient_id === user?.id && !msg.is_read) {
      acc[convId].unreadCount++;
    }
    return acc;
  }, {});

  const conversationList = Object.values(conversations).sort((a, b) => 
    new Date(b.lastMessage.created_date) - new Date(a.lastMessage.created_date)
  );

  const currentMessages = selectedConversation ? 
    (conversations[selectedConversation]?.messages || []).sort((a, b) => 
      new Date(a.created_date) - new Date(b.created_date)
    ) : [];

  // ✅ Solo hacer scroll automático si hay mensajes nuevos Y el usuario está cerca del final
  useEffect(() => {
    if (currentMessages.length > 0 && !isInitialLoadRef.current) {
      const currentCount = currentMessages.length;
      const previousCount = previousMessagesCountRef.current;
      
      // Solo si hay mensajes nuevos
      if (currentCount > previousCount) {
        // Solo hacer scroll si el usuario está cerca del final
        if (isNearBottom()) {
          setTimeout(() => {
            scrollToBottom(true);
          }, 100);
        }
      }
      
      previousMessagesCountRef.current = currentCount;
    }
  }, [currentMessages.length]);

  const hasBidirectionalConversation = () => {
    if (!selectedConversation || !user || !selectedProfessionalId) return false;
    
    const messages = currentMessages;
    const userSent = messages.some(msg => msg.sender_id === user.id);
    const professionalReplied = messages.some(msg => msg.sender_id === selectedProfessionalId);
    
    return userSent && professionalReplied;
  };

  const canLeaveReview = () => {
    if (!user || user.user_type !== "client") return false;
    if (existingReview) return false;
    if (!hasBidirectionalConversation()) return false;
    return true;
  };

  const getDisplayName = (userId) => {
    if (!userId) return "Usuario";
    
    if (userId === user?.id) {
      return user.full_name || user.email?.split('@')[0] || "Tú";
    }
    
    if (otherUserData && otherUserData.id === userId) {
      if (otherUserData.user_type === "professionnel" && otherUserData.profile?.business_name) {
        return otherUserData.profile.business_name;
      }
      return otherUserData.full_name || otherUserData.email?.split('@')[0] || "Usuario";
    }
    
    return "Usuario";
  };

  const handleNavigateToProfile = (userId) => {
    if (userId === user?.id) {
      navigate(createPageUrl("MyProfile"));
    } else {
      navigate(createPageUrl("ProfessionalProfile") + `?id=${userId}`);
    }
  };

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      return base44.entities.Message.create(messageData);
    },
    onMutate: async (newMessage) => {
      await queryClient.cancelQueries({ queryKey: ['messages'] });
      
      const previousMessages = queryClient.getQueryData(['messages', user?.id]);
      
      const tempMessage = {
        ...newMessage,
        id: `temp-${Date.now()}`,
        created_date: new Date().toISOString(),
        is_read: false,
        _isOptimistic: true
      };
      
      queryClient.setQueryData(['messages', user?.id], (old = []) => 
        [...old, tempMessage]
      );
      
      // ✅ Scroll inmediato al enviar mensaje propio
      setTimeout(() => {
        scrollToBottom(true);
      }, 50);
      
      return { previousMessages };
    },
    onSuccess: async (newMessage) => {
      try {
        const recipient = await base44.entities.User.filter({ id: newMessage.recipient_id });
        if (recipient[0]) {
          base44.integrations.Core.SendEmail({
            to: recipient[0].email,
            subject: "Nuevo mensaje en milautonomos",
            body: `Hola,\n\nHas recibido un nuevo mensaje en milautonomos.\n\nDe: ${newMessage.professional_name || newMessage.client_name}\nMensaje: ${newMessage.content}\n\nInicia sesión en milautonomos para responder.\n\nGracias,\nEquipo milautonomos`,
            from_name: "milautonomos"
          }).catch(err => console.log('Email notification error:', err));
        }
      } catch (error) {
        console.log('Error sending notification (non-blocking):', error);
      }

      queryClient.invalidateQueries({ queryKey: ['messages'] });
      toast.success('Mensaje enviado ✓');
      
      // ✅ Scroll después de confirmar envío
      setTimeout(() => {
        scrollToBottom(true);
      }, 200);
    },
    onError: (err, newMessage, context) => {
      queryClient.setQueryData(['messages', user?.id], context.previousMessages);
      toast.error("Error al enviar el mensaje. Intenta de nuevo.");
    }
  });

  const createReviewMutation = useMutation({
    mutationFn: async (review) => {
      const avgRating = (review.rapidez + review.comunicacion + review.calidad + review.precio_satisfaccion) / 4;
      
      return base44.entities.Review.create({
        ...review,
        rating: avgRating,
        professional_id: selectedProfessionalId,
        client_id: user.id,
        client_name: user.full_name || user.email,
        conversation_id: selectedConversation,
        is_verified: true,
        is_reported: false
      });
    },
    onSuccess: async () => {
      const allReviews = await base44.entities.Review.filter({
        professional_id: selectedProfessionalId
      });
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      
      const profiles = await base44.entities.ProfessionalProfile.filter({
        user_id: selectedProfessionalId
      });
      
      if (profiles[0]) {
        await base44.entities.ProfessionalProfile.update(profiles[0].id, {
          average_rating: avgRating,
          total_reviews: allReviews.length
        });
      }

      const professionalUser = await base44.entities.User.filter({ id: selectedProfessionalId });
      if (professionalUser[0]) {
        base44.integrations.Core.SendEmail({
          to: professionalUser[0].email,
          subject: "⭐ Nueva valoración en tu perfil - milautonomos",
          body: `Hola,

Has recibido una nueva valoración en tu perfil de milautonomos.

👤 Cliente: ${user.full_name || user.email}

⭐ Valoraciones:
- Rapidez: ${reviewData.rapidez} estrellas
- Comunicación: ${reviewData.comunicacion} estrellas
- Calidad: ${reviewData.calidad} estrellas
- Precio/Satisfacción: ${reviewData.precio_satisfaccion} estrellas

💬 Comentario: ${reviewData.comment || 'Sin comentario'}

Gracias,
Equipo milautonomos`,
          from_name: "milautonomos"
        }).catch(err => console.log('Email error:', err));
      }

      queryClient.invalidateQueries({ queryKey: ['review'] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      setShowReviewDialog(false);
      setReviewData({
        rapidez: 0,
        comunicacion: 0,
        calidad: 0,
        precio_satisfaccion: 0,
        comment: ""
      });
      toast.success("✅ ¡Gracias por tu valoración!");
    },
    onError: (error) => {
      console.error("Error creating review:", error);
      toast.error("Error al enviar la valoración");
    }
  });

  useEffect(() => {
    if (selectedConversation && currentMessages.length > 0) {
      markAsRead();
    }
  }, [selectedConversation, currentMessages]);

  const markAsRead = async () => {
    const unreadMessages = currentMessages.filter(
      msg => msg.recipient_id === user?.id && !msg.is_read
    );

    for (const msg of unreadMessages) {
      try {
        await base44.entities.Message.update(msg.id, { is_read: true });
      } catch (error) {
        console.log('Error marking message as read:', error);
      }
    }
    
    if (unreadMessages.length > 0) {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    
    if (!newMessage.trim() || !selectedConversation || isSending) return;

    setIsSending(true);

    try {
      const otherUserId = selectedProfessionalId || 
        conversations[selectedConversation]?.otherUserId;
      
      if (!otherUserId) {
        throw new Error('No se pudo identificar al destinatario');
      }

      let recipientUser = null;
      let currentProfile = null;

      try {
        const recipientUsers = await base44.entities.User.filter({ id: otherUserId });
        recipientUser = recipientUsers[0] || null;
      } catch (error) {
        console.log('⚠️ No se pudo cargar usuario destinatario:', error);
      }

      if (user.user_type === "professionnel") {
        try {
          const currentProfiles = await base44.entities.ProfessionalProfile.filter({ user_id: user.id });
          currentProfile = currentProfiles[0] || null;
        } catch (error) {
          console.log('⚠️ No se pudo cargar perfil profesional:', error);
        }
      }

      const messageData = {
        conversation_id: selectedConversation,
        sender_id: user.id,
        recipient_id: otherUserId,
        content: newMessage.trim(),
        professional_name: user.user_type === "professionnel" ? 
          (currentProfile?.business_name || user.full_name || user.email) : 
          conversations[selectedConversation]?.otherUserName,
        client_name: user.user_type === "client" ? 
          (user.full_name || user.email) : 
          (recipientUser?.full_name || recipientUser?.email || 'Usuario'),
        is_read: false
      };

      setNewMessage("");
      sendMessageMutation.mutate(messageData);
      
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);

    } catch (error) {
      console.error('❌ Error en handleSendMessage:', error);
      toast.error('Error al preparar el mensaje: ' + error.message);
    } finally {
      setTimeout(() => {
        setIsSending(false);
      }, 1000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation.conversationId);
    setSelectedProfessionalId(conversation.otherUserId);
  };

  const handleOpenReviewDialog = () => {
    if (!canLeaveReview()) {
      toast.error("No puedes dejar una valoración todavía");
      return;
    }
    setShowReviewDialog(true);
  };

  const handleSubmitReview = () => {
    if (reviewData.rapidez === 0 || reviewData.comunicacion === 0 || 
        reviewData.calidad === 0 || reviewData.precio_satisfaccion === 0) {
      toast.error("Por favor, valora todos los aspectos");
      return;
    }
    createReviewMutation.mutate(reviewData);
  };

  const StarRating = ({ value, onChange, label }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`w-8 h-8 ${
                star <= value
                  ? "fill-amber-400 text-amber-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Mensajería</h1>
        <p className="text-gray-600">Comunícate con tus contactos</p>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Conversations List */}
        <div className="w-full md:w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-700" />
              Conversaciones
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-700" />
              </div>
            ) : conversationList.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">Sin conversaciones</p>
                <p className="text-sm">Contacta con un autónomo para empezar</p>
              </div>
            ) : (
              conversationList.map((conv) => (
                <div
                  key={conv.conversationId}
                  onClick={() => handleSelectConversation(conv)}
                  className={`p-4 cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-100 ${
                    selectedConversation === conv.conversationId ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-blue-100 text-blue-900">
                        {conv.otherUserName?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-gray-900 truncate">
                          {conv.otherUserName || "Usuario"}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="bg-orange-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {conv.lastMessage.content}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {format(new Date(conv.lastMessage.created_date), "d MMM HH:mm")}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {selectedConversation ? (
            <>
              {/* Messages Header */}
              <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="cursor-pointer" onClick={() => handleNavigateToProfile(selectedProfessionalId)}>
                      <AvatarFallback className="bg-blue-700 text-white">
                        {getDisplayName(selectedProfessionalId)?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleNavigateToProfile(selectedProfessionalId)}
                          className="font-semibold text-gray-900 hover:text-blue-600 transition-colors flex items-center gap-1 group"
                        >
                          {getDisplayName(selectedProfessionalId)}
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                        {otherUserData && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            {otherUserData.user_type === "professionnel" ? (
                              <>
                                <Briefcase className="w-3 h-3" />
                                <span>Autónomo</span>
                              </>
                            ) : (
                              <>
                                <UserIcon className="w-3 h-3" />
                                <span>Cliente</span>
                              </>
                            )}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        En línea
                      </p>
                    </div>
                  </div>

                  {canLeaveReview() && (
                    <Button
                      onClick={handleOpenReviewDialog}
                      className="bg-amber-500 hover:bg-amber-600 gap-2"
                    >
                      <Star className="w-4 h-4" />
                      Dejar reseña
                    </Button>
                  )}
                  
                  {existingReview && user?.user_type === "client" && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span>Ya valoraste este servicio</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages - CON REF PARA DETECTAR SCROLL */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-6 space-y-4"
              >
                {currentMessages.map((message) => {
                  const isMe = message.sender_id === user.id;
                  const isOptimistic = message._isOptimistic;
                  const senderName = getDisplayName(message.sender_id);
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${
                        isOptimistic ? 'opacity-70' : 'opacity-100'
                      } transition-opacity`}
                    >
                      <div className="max-w-md">
                        {!isMe && (
                          <div className="flex items-center gap-2 mb-1 ml-1">
                            <button
                              onClick={() => handleNavigateToProfile(message.sender_id)}
                              className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                            >
                              {senderName}
                              <ExternalLink className="w-2.5 h-2.5" />
                            </button>
                            {otherUserData && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                {otherUserData.user_type === "professionnel" ? "Autónomo" : "Cliente"}
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        <div
                          className={`px-4 py-3 rounded-2xl shadow-sm ${
                            isMe
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-900 border border-gray-200'
                          }`}
                        >
                          <p className="leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <p className={`text-xs ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                              {format(new Date(message.created_date), "HH:mm")}
                            </p>
                            {isMe && (
                              isOptimistic ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : message.is_read ? (
                                <CheckCheck className="w-3 h-3" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="bg-white border-t border-gray-200 p-4">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <Textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Escribe un mensaje... (Enter para enviar, Shift+Enter para nueva línea)"
                    className="flex-1 min-h-[50px] max-h-[120px] resize-none"
                    disabled={isSending}
                  />
                  <Button
                    type="submit"
                    disabled={!newMessage.trim() || isSending}
                    className="h-[50px] bg-blue-600 hover:bg-blue-700 px-6 relative"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="sr-only">Enviando...</span>
                      </>
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </Button>
                </form>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  💡 Presiona Enter para enviar • Shift+Enter para nueva línea
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Selecciona una conversación</p>
                <p className="text-sm">Elige un contacto para comenzar a chatear</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              Valora el servicio
            </DialogTitle>
            <DialogDescription>
              Comparte tu experiencia con {getDisplayName(selectedProfessionalId)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <StarRating
              label="⚡ Rapidez"
              value={reviewData.rapidez}
              onChange={(value) => setReviewData({ ...reviewData, rapidez: value })}
            />

            <StarRating
              label="💬 Comunicación"
              value={reviewData.comunicacion}
              onChange={(value) => setReviewData({ ...reviewData, comunicacion: value })}
            />

            <StarRating
              label="✨ Calidad del trabajo"
              value={reviewData.calidad}
              onChange={(value) => setReviewData({ ...reviewData, calidad: value })}
            />

            <StarRating
              label="💰 Precio / Satisfacción general"
              value={reviewData.precio_satisfaccion}
              onChange={(value) => setReviewData({ ...reviewData, precio_satisfaccion: value })}
            />

            <div className="space-y-2">
              <Label>Comentario (opcional)</Label>
              <Textarea
                value={reviewData.comment}
                onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                placeholder="Comparte tu experiencia con más detalle..."
                className="h-24"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReviewDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={createReviewMutation.isPending}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {createReviewMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Star className="w-4 h-4 mr-2" />
                  Enviar valoración
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
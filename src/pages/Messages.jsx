import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Send, MessageSquare, Loader2, Star, CheckCheck, Check, Briefcase, User as UserIcon, ExternalLink, ArrowLeft, Phone, MessageCircle } from "lucide-react";
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
import OptimizedImage from "../components/ui/OptimizedImage";
import { useLanguage } from "../components/ui/LanguageSwitcher";
import SEOHead from "../components/seo/SEOHead";

const CACHE_KEY = 'misautonomos_conversations_cache';
const CACHE_DURATION = 1000 * 60 * 5;
const USERS_CACHE_KEY = 'misautonomos_users_cache';

const ConversationSkeleton = () => (
  <div className="p-4 space-y-4">
    {[1, 2, 3, 4, 5].map(i => (
      <div key={i} className="flex items-center gap-3 animate-pulse">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

const MessagesSkeleton = () => (
  <div className="flex-1 p-6 space-y-4">
    {[1, 2, 3, 4].map(i => (
      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'} animate-pulse`}>
        <div className="max-w-md">
          <Skeleton className={`h-20 w-64 rounded-2xl ${i % 2 === 0 ? 'bg-blue-100' : 'bg-gray-100'}`} />
        </div>
      </div>
    ))}
  </div>
);

const fetchMessages = async (userId) => {
  const [sent, received] = await Promise.all([
    base44.entities.Message.filter({ sender_id: userId }, '-created_date', 50),
    base44.entities.Message.filter({ recipient_id: userId }, '-created_date', 50)
  ]);
  
  return [...sent, ...received].sort((a, b) => 
    new Date(b.created_date) - new Date(a.created_date)
  );
};

const loadUserFromCache = (userId) => {
  try {
    const cached = localStorage.getItem(USERS_CACHE_KEY);
    if (cached) {
      const usersCache = JSON.parse(cached);
      return usersCache[userId] || null;
    }
  } catch (error) {
    return null;
  }
  return null;
};

const saveUserToCache = (userId, userData) => {
  try {
    const cached = localStorage.getItem(USERS_CACHE_KEY) || '{}';
    const usersCache = JSON.parse(cached);
    usersCache[userId] = userData;
    localStorage.setItem(USERS_CACHE_KEY, JSON.stringify(usersCache));
  } catch (error) {
    console.error('Error saving user cache:', error);
  }
};

export default function MessagesPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  const [user, setUser] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(searchParams.get('conversation'));
  const [selectedProfessionalId, setSelectedProfessionalId] = useState(searchParams.get('professional'));
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
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

  useEffect(() => {
    if (selectedConversation) {
      isInitialLoadRef.current = true;
      setTimeout(() => {
        scrollToBottom(false);
        isInitialLoadRef.current = false;
      }, 300);
    }
  }, [selectedConversation]);

  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: smooth ? "smooth" : "auto",
        block: "end"
      });
    }
  };

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      base44.auth.redirectToLogin();
    }
  };

  const { data: allMessages = [], isLoading } = useQuery({
    queryKey: ['messages', user?.id],
    queryFn: () => fetchMessages(user.id),
    enabled: !!user,
    staleTime: 5000,
    refetchInterval: 15000,
  });

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
    staleTime: 1000 * 60 * 10,
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

  const conversations = React.useMemo(() => {
    return allMessages.reduce((acc, msg) => {
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
  }, [allMessages, user?.id]);

  const conversationList = React.useMemo(() => {
    return Object.values(conversations).sort((a, b) => 
      new Date(b.lastMessage.created_date) - new Date(a.lastMessage.created_date)
    );
  }, [conversations]);

  const currentMessages = React.useMemo(() => {
    if (!selectedConversation) return [];
    return (conversations[selectedConversation]?.messages || [])
      .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
      .slice(-30);
  }, [selectedConversation, conversations]);

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
    
    const conversation = conversations[selectedConversation];
    if (conversation && userId === conversation.otherUserId) {
      return conversation.otherUserName || "Usuario";
    }
    
    return "Usuario";
  };

  const getUserType = (userId) => {
    if (userId === user?.id) return user.user_type;
    if (otherUserData && otherUserData.id === userId) return otherUserData.user_type;
    return null;
  };

  const handleNavigateToProfile = (userId) => {
    if (userId === user?.id) {
      navigate(createPageUrl("MyProfile"));
    } else {
      navigate(createPageUrl("ProfessionalProfile") + `?id=${userId}`);
    }
  };

  const getProfessionalPhone = () => {
    if (otherUserData?.user_type === "professionnel" && otherUserData.profile?.telefono_contacto) {
      return otherUserData.profile.telefono_contacto;
    }
    return null;
  };

  const formatPhoneForCall = (phone) => {
    if (!phone) return null;
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (!cleaned.startsWith('+')) {
      cleaned = '+34' + cleaned;
    }
    return cleaned;
  };

  const formatPhoneForWhatsApp = (phone) => {
    if (!phone) return null;
    let cleaned = phone.replace(/\D/g, '');
    if (!cleaned.startsWith('34') && cleaned.length === 9) {
      cleaned = '34' + cleaned;
    }
    return cleaned;
  };

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      return base44.entities.Message.create(messageData);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      toast.success('Mensaje enviado ✓');
      
      setTimeout(() => {
        scrollToBottom(true);
      }, 200);
    },
    onError: () => {
      toast.error("Error al enviar el mensaje");
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
        console.log('Error marking as read:', error);
      }
    }
    
    if (unreadMessages.length > 0) {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    
    if (!newMessage.trim() || !selectedConversation || sendingMessage) return;

    setSendingMessage(true);

    try {
      const otherUserId = selectedProfessionalId || conversations[selectedConversation]?.otherUserId;
      
      const messageData = {
        conversation_id: selectedConversation,
        sender_id: user.id,
        recipient_id: otherUserId,
        content: newMessage.trim(),
        professional_name: conversations[selectedConversation]?.otherUserName || "Usuario",
        client_name: user.full_name || user.email,
        is_read: false
      };

      setNewMessage("");
      await sendMessageMutation.mutateAsync(messageData);
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleSelectConversation = (conv) => {
    setSelectedConversation(conv.conversationId);
    setSelectedProfessionalId(conv.otherUserId);
    setSearchParams({ conversation: conv.conversationId, professional: conv.otherUserId }, { replace: true });
  };

  const handleBackToConversations = () => {
    setSelectedConversation(null);
    setSelectedProfessionalId(null);
    setSearchParams({}, { replace: true });
  };

  const handleOpenReviewDialog = () => {
    if (!canLeaveReview()) {
      if (existingReview) {
        toast.info("Ya has valorado este servicio");
      } else {
        toast.info("Necesitas haber conversado con el profesional");
      }
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
                star <= value ? "fill-amber-400 text-amber-400" : "text-gray-300"
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
        <Loader2 className="w-12 h-12 animate-spin text-blue-700" />
      </div>
    );
  }

  return (
    <>
      <SEOHead 
        title={`${t('messages')} - MisAutónomos`}
        description="Gestiona tus conversaciones con profesionales"
      />
      
      <div className="flex-1 overflow-hidden flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className={`w-full md:w-1/3 bg-white border-r border-gray-200 flex flex-col ${
          selectedConversation ? 'hidden md:flex' : 'flex'
        }`}>
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-700" />
              {t('conversations')}
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <ConversationSkeleton />
            ) : conversationList.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium text-gray-900">{t('noConversations')}</p>
                <p className="text-sm text-gray-600 mb-4">{t('startChatting')}</p>
                <Button
                  onClick={() => navigate(createPageUrl("Search"))}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {t('searchFreelancers')}
                </Button>
              </div>
            ) : (
              conversationList.map((conv) => (
                <div
                  key={conv.conversationId}
                  onClick={() => handleSelectConversation(conv)}
                  className={`p-4 cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-100 ${
                    selectedConversation === conv.conversationId ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      {(() => {
                        const cachedUser = loadUserFromCache(conv.otherUserId);
                        return cachedUser?.profile_picture ? (
                          <OptimizedImage
                            src={cachedUser.profile_picture}
                            alt="Perfil"
                            className="w-full h-full"
                            objectFit="cover"
                            width={40}
                            height={40}
                          />
                        ) : (
                          <AvatarFallback className="bg-blue-100 text-blue-900">
                            {(conv.otherUserName || "?").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        );
                      })()}
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {conv.otherUserName || "Usuario"}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {conv.lastMessage.content}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-400">
                          {format(new Date(conv.lastMessage.created_date), "d MMM HH:mm")}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="bg-orange-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={`flex-1 flex flex-col bg-gray-50 ${
          !selectedConversation ? 'hidden md:flex' : 'flex'
        }`}>
          {selectedConversation ? (
            <>
              <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={handleBackToConversations}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>

                  <Avatar className="cursor-pointer" onClick={() => handleNavigateToProfile(selectedProfessionalId)}>
                    {otherUserData?.profile_picture ? (
                      <OptimizedImage
                        src={otherUserData.profile_picture}
                        alt="Perfil"
                        className="w-full h-full"
                        objectFit="cover"
                        width={40}
                        height={40}
                        priority={true}
                      />
                    ) : (
                      <AvatarFallback className="bg-blue-700 text-white">
                        {getDisplayName(selectedProfessionalId)?.charAt(0) || "?"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => handleNavigateToProfile(selectedProfessionalId)}
                      className="font-semibold text-gray-900 hover:text-blue-600 transition-colors flex items-center gap-1 group"
                    >
                      <span className="truncate">{getDisplayName(selectedProfessionalId)}</span>
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </div>

                  {canLeaveReview() && (
                    <Button
                      onClick={handleOpenReviewDialog}
                      className="bg-amber-500 hover:bg-amber-600"
                      size="sm"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Valorar
                    </Button>
                  )}
                </div>
              </div>

              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4"
              >
                {currentMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">{t('noConversations')}</p>
                  </div>
                ) : (
                  <>
                    {currentMessages.map((message) => {
                      const isMe = message.sender_id === user.id;
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className="max-w-[85%] md:max-w-md">
                            <div
                              className={`px-4 py-3 rounded-2xl shadow-sm ${
                                isMe
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white text-gray-900 border border-gray-200'
                              }`}
                            >
                              <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                              <div className="flex items-center justify-end gap-1 mt-1">
                                <p className={`text-xs ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                  {format(new Date(message.created_date), "HH:mm")}
                                </p>
                                {isMe && (
                                  message.is_read ? (
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
                  </>
                )}
              </div>

              <div className="bg-white border-t border-gray-200 p-3 md:p-4">
                <form onSubmit={handleSendMessage} className="flex gap-2 md:gap-3">
                  <Input
                    ref={textareaRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={t('writeMessage')}
                    className="flex-1 h-12"
                    disabled={sendingMessage}
                  />
                  <Button
                    type="submit"
                    disabled={!newMessage.trim() || sendingMessage}
                    className="h-12 bg-blue-600 hover:bg-blue-700"
                  >
                    {sendingMessage ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center p-4">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium text-gray-900">{t('noConversations')}</p>
                <p className="text-sm text-gray-600">{t('startChatting')}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="w-6 h-6 text-amber-500" />
              Valora el servicio de {getDisplayName(selectedProfessionalId)}
            </DialogTitle>
            <DialogDescription>
              Tu opinión ayuda a otros usuarios y al profesional a mejorar
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
              label="💰 Relación calidad/precio"
              value={reviewData.precio_satisfaccion}
              onChange={(value) => setReviewData({ ...reviewData, precio_satisfaccion: value })}
            />

            <div className="space-y-2">
              <Label>💭 Cuéntanos tu experiencia (opcional)</Label>
              <Textarea
                value={reviewData.comment}
                onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                placeholder="¿Qué te pareció el servicio?"
                className="h-32 resize-none"
                maxLength={500}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowReviewDialog(false)}
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={createReviewMutation.isPending}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {createReviewMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Star className="w-4 h-4 mr-2" />
              )}
              Publicar valoración
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
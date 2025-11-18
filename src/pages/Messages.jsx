import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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

// ✅ CACHE KEYS
const CACHE_KEY = 'milautonomos_conversations_cache';
const CACHE_DURATION = 1000 * 60 * 5;
const USERS_CACHE_KEY = 'milautonomos_users_cache';

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
  console.time('⚡ Load messages');
  
  const [sent, received] = await Promise.all([
    base44.entities.Message.filter({ sender_id: userId }, '-created_date', 50),
    base44.entities.Message.filter({ recipient_id: userId }, '-created_date', 50)
  ]);
  
  const allMessages = [...sent, ...received].sort((a, b) => 
    new Date(b.created_date) - new Date(a.created_date)
  );
  
  console.timeEnd('⚡ Load messages');
  return allMessages;
};

const loadUserFromCache = (userId) => {
  try {
    const cached = localStorage.getItem(USERS_CACHE_KEY);
    if (cached) {
      const usersCache = JSON.parse(cached);
      return usersCache[userId] || null;
    }
  } catch (error) {
    console.error('Error loading user cache:', error);
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
  const [usersCache, setUsersCache] = useState({});

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

  const isNearBottom = () => {
    if (!messagesContainerRef.current) return true;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const threshold = 150;
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

  const { data: allMessages = [], isLoading, isFetching } = useQuery({
    queryKey: ['messages', user?.id],
    queryFn: async () => {
      const cached = localStorage.getItem(CACHE_KEY + '_' + user.id);
      if (cached) {
        const { data: cachedData, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        
        if (age < CACHE_DURATION) {
          console.log('✅ Usando cache de mensajes');
          
          setTimeout(async () => {
            try {
              const fresh = await fetchMessages(user.id);
              queryClient.setQueryData(['messages', user.id], fresh);
              
              localStorage.setItem(CACHE_KEY + '_' + user.id, JSON.stringify({
                data: fresh,
                timestamp: Date.now()
              }));
            } catch (error) {
              console.error('Error refreshing messages:', error);
            }
          }, 100);
          
          return cachedData;
        }
      }
      
      const fresh = await fetchMessages(user.id);
      
      localStorage.setItem(CACHE_KEY + '_' + user.id, JSON.stringify({
        data: fresh,
        timestamp: Date.now()
      }));
      
      return fresh;
    },
    enabled: !!user,
    placeholderData: () => {
      try {
        const cached = localStorage.getItem(CACHE_KEY + '_' + user?.id);
        if (cached) {
          const { data } = JSON.parse(cached);
          return data;
        }
      } catch (error) {
        console.error('Error loading placeholder data:', error);
      }
      return [];
    },
    staleTime: 5000,
    refetchInterval: 15000,
  });

  const { data: otherUserData } = useQuery({
    queryKey: ['otherUser', selectedProfessionalId],
    queryFn: async () => {
      if (!selectedProfessionalId) return null;
      
      const cached = loadUserFromCache(selectedProfessionalId);
      if (cached) {
        console.log('✅ Usuario cargado desde cache');
        return cached;
      }
      
      // Use service role to see profile pictures
      const users = await base44.asServiceRole.entities.User.filter({ id: selectedProfessionalId });
      const otherUser = users[0];
      
      if (!otherUser) return null;

      let fullData = otherUser;
      
      if (otherUser.user_type === "professionnel") {
        const profiles = await base44.entities.ProfessionalProfile.filter({
          user_id: selectedProfessionalId
        });
        fullData = {
          ...otherUser,
          profile: profiles[0] || null
        };
      }
      
      saveUserToCache(selectedProfessionalId, fullData);
      
      return fullData;
    },
    enabled: !!selectedProfessionalId,
    staleTime: 1000 * 60 * 10,
    placeholderData: () => loadUserFromCache(selectedProfessionalId),
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

  useEffect(() => {
    if (currentMessages.length > 0 && !isInitialLoadRef.current) {
      const currentCount = currentMessages.length;
      const previousCount = previousMessagesCountRef.current;
      
      if (currentCount > previousCount) {
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
    if (!userId) return t("user");
    
    if (userId === user?.id) {
      // For current user: prioritize full_name
      if (user.full_name && user.full_name.trim()) return user.full_name;
      return user.email?.split('@')[0] || t("you");
    }
    
    if (otherUserData && otherUserData.id === userId) {
      // For professionals: prioritize business_name
      if (otherUserData.user_type === "professionnel" && otherUserData.profile?.business_name) {
        return otherUserData.profile.business_name;
      }
      // For others: prioritize full_name
      if (otherUserData.full_name && otherUserData.full_name.trim()) {
        return otherUserData.full_name;
      }
      return otherUserData.email?.split('@')[0] || t("user");
    }
    
    if (usersCache[userId]) {
      const cachedUser = usersCache[userId];
      if (cachedUser.user_type === "professionnel" && cachedUser.profile?.business_name) {
        return cachedUser.profile.business_name;
      }
      if (cachedUser.full_name && cachedUser.full_name.trim()) {
        return cachedUser.full_name;
      }
      return cachedUser.email?.split('@')[0] || t("user");
    }
    
    const conversation = conversations[selectedConversation];
    if (conversation && userId === conversation.otherUserId) {
      return conversation.otherUserName || t("user");
    }
    
    return t("user");
  };

  const getUserType = (userId) => {
    if (userId === user?.id) {
      return user.user_type;
    }
    
    if (otherUserData && otherUserData.id === userId) {
      return otherUserData.user_type;
    }
    
    if (usersCache[userId]) {
      return usersCache[userId].user_type;
    }
    
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
      
      localStorage.removeItem(CACHE_KEY + '_' + user.id);
      
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
            subject: "Nuevo mensaje en Misautónomos",
            body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%); padding: 40px 20px; text-align: center; }
    .logo { width: 60px; height: 60px; background: white; border-radius: 16px; display: inline-block; line-height: 60px; font-size: 32px; margin-bottom: 15px; }
    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 20px; color: #1f2937; margin-bottom: 20px; font-weight: 600; }
    .message { color: #4b5563; line-height: 1.8; font-size: 16px; margin-bottom: 25px; }
    .message-box { background: #f9fafb; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .message-box p { color: #4b5563; margin: 0; line-height: 1.6; }
    .cta { text-align: center; margin: 35px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); }
    .footer { background: #1f2937; color: #9ca3af; padding: 40px 30px; text-align: center; font-size: 14px; line-height: 1.8; }
    .footer strong { color: #ffffff; display: block; margin-bottom: 5px; font-size: 18px; }
    .footer .tagline { color: #60a5fa; margin-bottom: 15px; font-style: italic; }
    .footer a { color: #60a5fa; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">💬</div>
      <h1>Nuevo mensaje</h1>
    </div>
    
    <div class="content">
      <p class="greeting">Hola,</p>
      
      <p class="message">
        Has recibido un nuevo mensaje en <strong>Misautónomos</strong>.
      </p>
      
      <div class="message-box">
        <p><strong>De:</strong> ${newMessage.professional_name || newMessage.client_name}</p>
        <p style="margin-top: 15px;"><strong>Mensaje:</strong></p>
        <p style="margin-top: 10px; font-style: italic;">"${newMessage.content}"</p>
      </div>
      
      <div class="cta">
        <a href="https://misautonomos.es/Messages" class="button">
          Responder ahora →
        </a>
      </div>
      
      <p class="message" style="font-size: 14px; color: #6b7280; text-align: center;">
        Inicia sesión en Misautónomos para ver la conversación completa y responder.
      </p>
    </div>
    
    <div class="footer">
      <strong>Equipo Misautónomos</strong>
      <p class="tagline">Tu autónomo de confianza</p>
      <p>
        <a href="mailto:soporte@misautonomos.es">soporte@misautonomos.es</a><br/>
        <a href="https://misautonomos.es">misautonomos.es</a>
      </p>
    </div>
  </div>
</body>
</html>
            `,
            from_name: "Misautónomos"
          }).catch(err => console.log('Email notification error:', err));
        }
      } catch (error) {
        console.log('Error sending notification (non-blocking):', error);
      }

      queryClient.invalidateQueries({ queryKey: ['messages'] });
      toast.success(t('messageSent'));
      
      setTimeout(() => {
        scrollToBottom(true);
      }, 200);
    },
    onError: (err, newMessage, context) => {
      queryClient.setQueryData(['messages', user?.id], context.previousMessages);
      toast.error(t('sendMessageError'));
    }
  });

  const createReviewMutation = useMutation({
    mutationFn: async (review) => {
      const existingReviews = await base44.entities.Review.filter({
        professional_id: selectedProfessionalId,
        client_id: user.id
      });

      if (existingReviews.length > 0) {
        throw new Error('Ya has valorado este servicio anteriormente');
      }

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
          subject: "⭐ Nueva valoración en tu perfil - Misautónomos",
          body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); padding: 40px 20px; text-align: center; }
    .logo { width: 60px; height: 60px; background: white; border-radius: 16px; display: inline-block; line-height: 60px; font-size: 32px; margin-bottom: 15px; }
    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 20px; color: #1f2937; margin-bottom: 20px; font-weight: 600; }
    .message { color: #4b5563; line-height: 1.8; font-size: 16px; margin-bottom: 25px; }
    .rating-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .rating-box h3 { color: #92400e; margin: 0 0 15px 0; font-size: 18px; }
    .rating-box p { color: #78350f; margin: 5px 0; font-weight: 500; }
    .comment-box { background: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #e5e7eb; }
    .comment-box p { color: #4b5563; margin: 0; font-style: italic; line-height: 1.6; }
    .footer { background: #1f2937; color: #9ca3af; padding: 40px 30px; text-align: center; font-size: 14px; line-height: 1.8; }
    .footer strong { color: #ffffff; display: block; margin-bottom: 5px; font-size: 18px; }
    .footer .tagline { color: #60a5fa; margin-bottom: 15px; font-style: italic; }
    .footer a { color: #60a5fa; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">⭐</div>
      <h1>Nueva valoración recibida</h1>
    </div>
    
    <div class="content">
      <p class="greeting">Hola,</p>
      
      <p class="message">
        Has recibido una nueva valoración en tu perfil profesional de <strong>Misautónomos</strong>.
      </p>
      
      <div class="rating-box">
        <h3>📊 Valoraciones recibidas</h3>
        <p>👤 Cliente: ${user.full_name || user.email}</p>
        <p>⚡ Rapidez: ${reviewData.rapidez} estrellas</p>
        <p>💬 Comunicación: ${reviewData.comunicacion} estrellas</p>
        <p>✨ Calidad: ${reviewData.calidad} estrellas</p>
        <p>💰 Precio/Satisfacción: ${reviewData.precio_satisfaccion} estrellas</p>
      </div>
      
      ${reviewData.comment ? `
      <div class="comment-box">
        <p><strong>💭 Comentario del cliente:</strong></p>
        <p style="margin-top: 10px;">"${reviewData.comment}"</p>
      </div>
      ` : ''}
      
      <p class="message">
        Las valoraciones positivas mejoran tu posicionamiento en las búsquedas y generan más confianza en los clientes.
      </p>
      
      <p class="message" style="font-size: 14px; color: #6b7280; text-align: center;">
        ¿Dudas? Contacta con nosotros:<br/>
        <a href="mailto:soporte@misautonomos.es" style="color: #3b82f6; text-decoration: none;">soporte@misautonomos.es</a>
      </p>
    </div>
    
    <div class="footer">
      <strong>Equipo Misautónomos</strong>
      <p class="tagline">Tu autónomo de confianza</p>
      <p>
        <a href="mailto:soporte@misautonomos.es">soporte@misautonomos.es</a><br/>
        <a href="https://misautonomos.es">misautonomos.es</a>
      </p>
    </div>
  </div>
</body>
</html>
          `,
          from_name: "Misautónomos"
        }).catch(err => console.log('Email error:', err));
      }

      queryClient.invalidateQueries({ queryKey: ['review'] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['profile', selectedProfessionalId] });
      
      setShowReviewDialog(false);
      setReviewData({
        rapidez: 0,
        comunicacion: 0,
        calidad: 0,
        precio_satisfaccion: 0,
        comment: ""
      });
      
      toast.success(t('reviewSuccess'));
    },
    onError: (error) => {
      console.error("Error creating review:", error);
      
      if (error.message.includes('Ya has valorado')) {
        toast.error(t('alreadyReviewed'));
      } else {
        toast.error(t('reviewError'));
      }
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
    
    if (!newMessage.trim() || !selectedConversation || sendingMessage) return;

    setSendingMessage(true);

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

      // PRIORITY: Use business_name for professionals, full_name for everyone
      const professionalName = user.user_type === "professionnel" 
        ? (currentProfile?.business_name || user.full_name || user.email)
        : (recipientUser?.user_type === "professionnel" && otherUserData?.profile?.business_name 
            ? otherUserData.profile.business_name 
            : conversations[selectedConversation]?.otherUserName);
      
      const clientName = user.user_type === "client"
        ? (user.full_name || user.email)
        : (recipientUser?.full_name || recipientUser?.email || 'Usuario');

      const messageData = {
        conversation_id: selectedConversation,
        sender_id: user.id,
        recipient_id: otherUserId,
        content: newMessage.trim(),
        professional_name: professionalName,
        client_name: clientName,
        is_read: false
      };

      setNewMessage("");
      sendMessageMutation.mutate(messageData);
      
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);

    } catch (error) {
      console.error('❌ Error en handleSendMessage:', error);
      toast.error(t('prepareMessageError') + error.message);
    } finally {
      setTimeout(() => {
        setSendingMessage(false);
      }, 1000);
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
        toast.info(t('alreadyReviewedInfo'));
      } else if (!hasBidirectionalConversation()) {
        toast.info(t('bidirectionalConversationRequired'));
      } else {
        toast.error(t('cannotLeaveReviewNow'));
      }
      return;
    }
    setShowReviewDialog(true);
  };

  const handleSubmitReview = () => {
    if (reviewData.rapidez === 0 || reviewData.comunicacion === 0 || 
        reviewData.calidad === 0 || reviewData.precio_satisfaccion === 0) {
      toast.error(t('rateAllAspects'));
      return;
    }
    
    if (reviewData.comment.trim().length > 0 && reviewData.comment.trim().length < 10) {
      toast.error(t('commentMinLength'));
      return;
    }
    
    createReviewMutation.mutate(reviewData);
  };

  const StarRating = ({ value, onChange, label }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{t(label)}</Label>
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-700 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">{t('loadingMessaging')}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead 
        title={`${t('messages')} - MisAutónomos`}
        description={t('messagesPageDescription')}
      />
      
      <div className="flex-1 overflow-hidden flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className={`w-full md:w-1/3 bg-white border-r border-gray-200 flex flex-col ${
          selectedConversation ? 'hidden md:flex' : 'flex'
        }`}>
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-700" />
              {t('conversations')}
              {conversationList.length > 0 && (
                <span className="text-xs text-gray-500">({conversationList.length})</span>
              )}
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <ConversationSkeleton />
            ) : conversationList.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">{t('noConversations')}</p>
                <p className="text-sm">{t('contactProfessionalToStart')}</p>
                <Button
                  onClick={() => navigate(createPageUrl("Search"))}
                  className="bg-blue-600 hover:bg-blue-700 mt-4"
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
                      className="font-semibold text-gray-900 hover:text-blue-600 transition-colors flex items-center gap-1 group text-left"
                    >
                      <span className="truncate">{getDisplayName(selectedProfessionalId)}</span>
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </button>
                    <div className="flex items-center gap-2 mt-0.5">
                      {otherUserData && (
                        <Badge 
                          variant="outline" 
                          className={`text-xs flex items-center gap-1 ${
                            otherUserData.user_type === "professionnel" 
                              ? "bg-blue-50 text-blue-700 border-blue-200" 
                              : "bg-gray-50 text-gray-700 border-gray-200"
                          }`}
                        >
                          {otherUserData.user_type === "professionnel" ? (
                            <>
                              <Briefcase className="w-3 h-3" />
                              <span>{t('professional')}</span>
                            </>
                          ) : (
                            <>
                              <UserIcon className="w-3 h-3" />
                              <span>{t('client')}</span>
                            </>
                          )}
                        </Badge>
                      )}
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        {t('online')}
                      </span>
                    </div>
                  </div>

                  <div className="hidden md:flex items-center gap-2">
                    {otherUserData?.user_type === "professionnel" && getProfessionalPhone() && (
                      <>
                        <a href={`tel:${formatPhoneForCall(getProfessionalPhone())}`}>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="hover:bg-blue-50 hover:border-blue-600"
                          >
                            <Phone className="w-4 h-4 mr-1" />
                            <span className="hidden lg:inline">{t('call')}</span>
                          </Button>
                        </a>
                        <a
                          href={`https://wa.me/${formatPhoneForWhatsApp(getProfessionalPhone())}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button 
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <MessageCircle className="w-4 h-4 mr-1" />
                            <span className="hidden lg:inline">WhatsApp</span>
                          </Button>
                        </a>
                      </>
                    )}

                    {canLeaveReview() && (
                      <Button
                        onClick={handleOpenReviewDialog}
                        className="bg-amber-500 hover:bg-amber-600 gap-2"
                        size="sm"
                      >
                        <Star className="w-4 h-4" />
                        <span className="hidden lg:inline">{t('review')}</span>
                      </Button>
                    )}
                    
                    {existingReview && user?.user_type === "client" && (
                      <div className="flex items-center gap-2 text-xs text-gray-600 bg-green-50 px-3 py-2 rounded-lg">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="font-medium">{t('alreadyReviewed')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {otherUserData?.user_type === "professionnel" && getProfessionalPhone() && (
                  <div className="flex md:hidden gap-2 mt-3">
                    <a href={`tel:${formatPhoneForCall(getProfessionalPhone())}`} className="flex-1">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full hover:bg-blue-50"
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        {t('call')}
                      </Button>
                    </a>
                    <a
                      href={`https://wa.me/${formatPhoneForWhatsApp(getProfessionalPhone())}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button 
                        size="sm"
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        WhatsApp
                      </Button>
                    </a>
                  </div>
                )}
              </div>

              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4"
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 20px)' }}
              >
                {isLoading && currentMessages.length === 0 ? (
                  <MessagesSkeleton />
                ) : currentMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <p>{t('noMessagesInConversation')}</p>
                  </div>
                ) : (
                  <>
                    {currentMessages.map((message) => {
                      const isMe = message.sender_id === user.id;
                      const isOptimistic = message._isOptimistic;
                      const senderName = getDisplayName(message.sender_id);
                      const senderType = getUserType(message.sender_id);
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${
                            isOptimistic ? 'opacity-70' : 'opacity-100'
                          } transition-opacity`}
                        >
                          <div className="max-w-[85%] md:max-w-md">
                            {!isMe && (
                              <div className="flex items-center gap-2 mb-1 ml-1">
                                <button
                                  onClick={() => handleNavigateToProfile(message.sender_id)}
                                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                                >
                                  {senderName}
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </button>
                                {senderType && (
                                  <Badge 
                                    variant="secondary" 
                                    className={`text-[10px] px-1.5 py-0 ${
                                      senderType === "professionnel" 
                                        ? "bg-blue-100 text-blue-700" 
                                        : "bg-gray-100 text-gray-700"
                                    }`}
                                  >
                                    {senderType === "professionnel" ? t('professional') : t('client')}
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
                              <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
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
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                <div 
                  className="bg-white border-t border-gray-200 p-3 md:p-4"
                  style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
                >
                  <form onSubmit={handleSendMessage} className="flex gap-2 md:gap-3">
                    <Textarea
                      ref={textareaRef}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder={t('writeMessage')}
                      className="flex-1 min-h-[44px] md:min-h-[50px] max-h-[120px] resize-none text-base"
                      disabled={sendingMessage}
                    />
                    <Button
                      type="submit"
                      disabled={!newMessage.trim() || sendingMessage}
                      className="h-[44px] md:h-[50px] w-[44px] md:w-auto md:px-6 bg-blue-600 hover:bg-blue-700"
                    >
                      {sendingMessage ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          {t('send')}
                        </>
                      )}
                    </Button>
                  </form>
                  <p className="text-xs text-gray-500 mt-2 text-center hidden md:block">
                    {t('enterToSend')}
                  </p>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center p-4">
                  <MessageSquare className="w-12 md:w-16 h-12 md:h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-base md:text-lg font-medium">{t('selectConversation')}</p>
                  <p className="text-sm">{t('chooseContactToChat')}</p>
                </div>
              </div>
            )}
          </div>

          <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <Star className="w-6 h-6 text-amber-500" />
                  {t('rateServiceOf', { name: getDisplayName(selectedProfessionalId) })}
                </DialogTitle>
                <DialogDescription className="text-base">
                  {t('reviewHelpfulDescription')}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                <StarRating
                  label="rapidez"
                  value={reviewData.rapidez}
                  onChange={(value) => setReviewData({ ...reviewData, rapidez: value })}
                />

                <StarRating
                  label="comunicacion"
                  value={reviewData.comunicacion}
                  onChange={(value) => setReviewData({ ...reviewData, comunicacion: value })}
                />

                <StarRating
                  label="calidadTrabajo"
                  value={reviewData.calidad}
                  onChange={(value) => setReviewData({ ...reviewData, calidad: value })}
                />

                <StarRating
                  label="relacionCalidadPrecio"
                  value={reviewData.precio_satisfaccion}
                  onChange={(value) => setReviewData({ ...reviewData, precio_satisfaccion: value })}
                />

                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t('tellExperienceOptional')}</Label>
                  <Textarea
                    value={reviewData.comment}
                    onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                    placeholder={t('experiencePlaceholder')}
                    className="h-32 resize-none"
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 text-right">
                    {reviewData.comment.length}/500 {t('characters')}
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>💡 {t('tip')}:</strong> {t('honestReviewsHelpful')}
                  </p>
                </div>

                {existingReview && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-900">
                      <strong>⚠️ {t('warning')}:</strong> {t('alreadyReviewedMessage')}
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowReviewDialog(false)}
                  disabled={createReviewMutation.isPending}
                >
                  {t('cancel')}
                </Button>
                <Button
                  onClick={handleSubmitReview}
                  disabled={createReviewMutation.isPending || !!existingReview}
                  className="bg-amber-500 hover:bg-amber-600"
                >
                  {createReviewMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('sending')}
                    </>
                  ) : (
                    <>
                      <Star className="w-4 h-4 mr-2" />
                      {t('publishReview')}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </>
  );
}
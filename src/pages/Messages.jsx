import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, MessageSquare, Loader2, Star, CheckCheck, Check, Briefcase, User as UserIcon, ExternalLink, ArrowLeft, Phone, MessageCircle, Paperclip, FileText, X } from "lucide-react";
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
import FileAttachment from "../components/messages/FileAttachment";
import QuoteRequest from "../components/messages/QuoteRequest";
import { Input } from "@/components/ui/input";

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
  const [attachments, setAttachments] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [quoteData, setQuoteData] = useState({ description: "", budget: "", deadline: "" });
  const fileInputRef = useRef(null);

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

  const conversationUserIds = React.useMemo(() => {
    if (!allMessages || allMessages.length === 0) return [];
    const userIds = new Set();
    allMessages.forEach(msg => {
      if (msg.sender_id !== user?.id) userIds.add(msg.sender_id);
      if (msg.recipient_id !== user?.id) userIds.add(msg.recipient_id);
    });
    return Array.from(userIds);
  }, [allMessages, user?.id]);

  const { data: conversationUsers = {} } = useQuery({
    queryKey: ['conversationUsers', conversationUserIds.join(',')],
    queryFn: async () => {
      if (conversationUserIds.length === 0) return {};
      
      const usersData = {};
      const allUsers = await base44.entities.User.list();
      const allProfiles = await base44.entities.ProfessionalProfile.list();
      
      for (const userId of conversationUserIds) {
        const cached = loadUserFromCache(userId);
        if (cached) {
          usersData[userId] = cached;
          continue;
        }
        
        const userData = allUsers.find(u => u.id === userId);
        if (!userData) continue;
        
        let fullData = userData;
        if (userData.user_type === "professionnel") {
          const profile = allProfiles.find(p => p.user_id === userId);
          fullData = { ...userData, profile: profile || null };
        }
        
        usersData[userId] = fullData;
        saveUserToCache(userId, fullData);
      }
      
      return usersData;
    },
    enabled: conversationUserIds.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  const { data: otherUserData } = useQuery({
    queryKey: ['otherUser', selectedProfessionalId],
    queryFn: async () => {
      if (!selectedProfessionalId) return null;
      
      if (conversationUsers[selectedProfessionalId]) {
        return conversationUsers[selectedProfessionalId];
      }
      
      const cached = loadUserFromCache(selectedProfessionalId);
      if (cached) {
        console.log('✅ Usuario cargado desde cache');
        return cached;
      }
      
      const users = await base44.entities.User.filter({ id: selectedProfessionalId });
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
    placeholderData: () => conversationUsers[selectedProfessionalId] || loadUserFromCache(selectedProfessionalId),
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
        const isUserSender = msg.sender_id === user?.id;
        const otherUserId = isUserSender ? msg.recipient_id : msg.sender_id;
        
        let otherUserName;
        if (isUserSender) {
          otherUserName = msg.client_name || msg.professional_name;
        } else {
          otherUserName = msg.professional_name || msg.client_name;
        }
        
        acc[convId] = {
          conversationId: convId,
          messages: [],
          otherUserId: otherUserId,
          otherUserName: otherUserName,
          lastMessage: msg,
          unreadCount: 0
        };
      }
      acc[convId].messages.push(msg);
      
      if (msg.recipient_id === user?.id && !msg.is_read) {
        acc[convId].unreadCount++;
      }
      
      const isUserSender = msg.sender_id === user?.id;
      if (!acc[convId].otherUserName) {
        if (isUserSender) {
          acc[convId].otherUserName = msg.client_name || msg.professional_name;
        } else {
          acc[convId].otherUserName = msg.professional_name || msg.client_name;
        }
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

  const getDisplayName = (userId, conversationId = null) => {
    if (!userId) return t("user");
    
    if (userId === user?.id) {
      if (user.user_type === "professionnel") {
        const conversation = conversations[conversationId || selectedConversation];
        if (conversation?.messages?.length > 0) {
          const lastMsg = conversation.messages[conversation.messages.length - 1];
          if (lastMsg.sender_id === userId && lastMsg.professional_name) {
            return lastMsg.professional_name;
          }
        }
      }
      return user.full_name || user.email?.split('@')[0] || t("you");
    }
    
    // Priorizar otherUserData si estamos en la conversación actual
    if (otherUserData && otherUserData.id === userId) {
      if (otherUserData.user_type === "professionnel" && otherUserData.profile?.business_name) {
        return otherUserData.profile.business_name;
      }
      if (otherUserData.full_name) return otherUserData.full_name;
      return otherUserData.email?.split('@')[0] || t("user");
    }
    
    if (conversationUsers[userId]) {
      const userData = conversationUsers[userId];
      if (userData.user_type === "professionnel" && userData.profile?.business_name) {
        return userData.profile.business_name;
      }
      if (userData.full_name) return userData.full_name;
      return userData.email?.split('@')[0] || t("user");
    }
    
    if (usersCache[userId]) {
      const cachedUser = usersCache[userId];
      if (cachedUser.user_type === "professionnel" && cachedUser.profile?.business_name) {
        return cachedUser.profile.business_name;
      }
      if (cachedUser.full_name) return cachedUser.full_name;
      return cachedUser.email?.split('@')[0] || t("user");
    }
    
    const conversation = conversations[conversationId || selectedConversation];
    if (conversation && userId === conversation.otherUserId) {
      if (conversation.otherUserName && conversation.otherUserName !== "Usuario" && conversation.otherUserName !== "User") {
        return conversation.otherUserName;
      }
      
      if (conversation.messages?.length > 0) {
        for (let i = conversation.messages.length - 1; i >= 0; i--) {
          const msg = conversation.messages[i];
          if (msg.sender_id === userId) {
            const name = msg.professional_name || msg.client_name;
            if (name && name !== "Usuario" && name !== "User") return name;
          } else if (msg.recipient_id === userId) {
            const name = msg.professional_name || msg.client_name;
            if (name && name !== "Usuario" && name !== "User") return name;
          }
        }
      }
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

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingFile(true);
    try {
      const uploadedFiles = await Promise.all(
        files.map(async (file) => {
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          return {
            url: file_url,
            name: file.name,
            type: file.type,
            size: file.size
          };
        })
      );
      setAttachments([...attachments, ...uploadedFiles]);
      toast.success("Archivo(s) subido(s)");
    } catch (error) {
      toast.error("Error al subir archivo");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleRemoveAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleRespondQuote = async (messageId, response) => {
    try {
      const message = currentMessages.find(m => m.id === messageId);
      if (!message) return;

      const updatedQuote = { ...message.quote_request, ...response };
      
      await base44.entities.Message.update(messageId, {
        quote_request: updatedQuote
      });

      const otherUserId = message.sender_id === user.id ? message.recipient_id : message.sender_id;
      const recipient = await base44.entities.User.filter({ id: otherUserId });
      
      if (recipient[0]) {
        let notificationMessage = "";
        if (response.professional_responded) {
          notificationMessage = "Has recibido un presupuesto detallado";
        } else if (response.status === "accepted") {
          notificationMessage = "Tu presupuesto ha sido aceptado";
        } else if (response.status === "rejected") {
          notificationMessage = "Tu presupuesto ha sido rechazado";
        } else if (response.status === "completed") {
          notificationMessage = "El trabajo ha sido marcado como completado";
        }

        if (notificationMessage) {
          await base44.entities.Notification.create({
            user_id: otherUserId,
            type: "quote_update",
            title: "Actualización de presupuesto",
            message: notificationMessage,
            link: createPageUrl("Messages") + `?conversation=${selectedConversation}`,
            metadata: { conversation_id: selectedConversation, message_id: messageId }
          });

          base44.integrations.Core.SendEmail({
            to: recipient[0].email,
            subject: "📋 Actualización de presupuesto - MisAutónomos",
            body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%); padding: 40px 20px; text-align: center; }
    .logo { width: 60px; height: 60px; background: white; border-radius: 16px; display: inline-block; line-height: 60px; font-size: 32px; margin-bottom: 15px; }
    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
    .content { padding: 40px 30px; }
    .message { color: #4b5563; line-height: 1.8; font-size: 16px; margin-bottom: 25px; }
    .quote-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .cta { text-align: center; margin: 35px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; }
    .footer { background: #1f2937; color: #9ca3af; padding: 40px 30px; text-align: center; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">📋</div>
      <h1>Actualización de presupuesto</h1>
    </div>
    <div class="content">
      <p class="message">Hola,</p>
      <div class="quote-box">
        <p style="margin: 0; font-size: 18px; font-weight: 600; color: #1e40af;">${notificationMessage}</p>
      </div>
      <div class="cta">
        <a href="https://misautonomos.es/Messages?conversation=${selectedConversation}" class="button">
          Ver detalles →
        </a>
      </div>
    </div>
    <div class="footer">
      <strong style="color: #ffffff; display: block; margin-bottom: 5px; font-size: 18px;">Equipo MisAutónomos</strong>
      <p style="color: #60a5fa; margin-bottom: 15px; font-style: italic;">Tu autónomo de confianza</p>
    </div>
  </div>
</body>
</html>
            `,
            from_name: "MisAutónomos"
          }).catch(err => console.log('Email error:', err));
        }
      }

      queryClient.invalidateQueries({ queryKey: ['messages'] });
      toast.success("Presupuesto actualizado");
    } catch (error) {
      console.error("Error updating quote:", error);
      toast.error("Error al actualizar presupuesto");
    }
  };

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      const message = await base44.entities.Message.create(messageData);

      await base44.entities.Notification.create({
        user_id: messageData.recipient_id,
        type: messageData.quote_request ? "quote_request" : "new_message",
        title: messageData.quote_request ? "Nueva solicitud de presupuesto" : "Nuevo mensaje",
        message: messageData.quote_request 
          ? `Tienes una nueva solicitud de presupuesto` 
          : `Nuevo mensaje de ${messageData.professional_name || messageData.client_name}`,
        link: createPageUrl("Messages") + `?conversation=${messageData.conversation_id}`,
        metadata: { conversation_id: messageData.conversation_id, message_id: message.id }
      });

      return message;
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

      const messageData = {
        conversation_id: selectedConversation,
        sender_id: user.id,
        recipient_id: otherUserId,
        content: newMessage.trim() || (attachments.length > 0 ? "📎 Archivo adjunto" : ""),
        professional_name: user.user_type === "professionnel" ? 
          (currentProfile?.business_name || user.full_name || user.email) : 
          conversations[selectedConversation]?.otherUserName,
        client_name: user.user_type === "client" ? 
          (user.full_name || user.email) : 
          (recipientUser?.full_name || recipientUser?.email || 'Usuario'),
        is_read: false,
        attachments: attachments.length > 0 ? attachments : undefined
      };

      setNewMessage("");
      setAttachments([]);
      sendMessageMutation.mutate(messageData);
      
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);

    } catch (error) {
      console.error('❌ Error en handleSendMessage:', error);
      toast.error(t('prepareMessageError') + error.message);
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

  const handleSendQuote = async () => {
    if (!quoteData.description.trim() || !selectedConversation) return;

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
        content: `📋 Solicitud de presupuesto: ${quoteData.description.substring(0, 50)}...`,
        professional_name: user.user_type === "professionnel" ? 
          (currentProfile?.business_name || user.full_name || user.email) : 
          conversations[selectedConversation]?.otherUserName,
        client_name: user.user_type === "client" ? 
          (user.full_name || user.email) : 
          (recipientUser?.full_name || recipientUser?.email || 'Usuario'),
        is_read: false,
        quote_request: {
          description: quoteData.description,
          budget: quoteData.budget ? parseFloat(quoteData.budget) : undefined,
          deadline: quoteData.deadline || undefined,
          status: "pending"
        }
      };

      sendMessageMutation.mutate(messageData);
      setShowQuoteDialog(false);
      setQuoteData({ description: "", budget: "", deadline: "" });
    } catch (error) {
      console.error('Error sending quote:', error);
      toast.error('Error al enviar solicitud de presupuesto');
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

  const isInitialLoading = !user || isLoading;

  if (isInitialLoading) {
    return (
      <>
        <SEOHead 
          title={`${t('messages')} - MisAutónomos`}
          description={t('messagesPageDescription')}
        />
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Cargando mensajes...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead 
        title={`${t('messages')} - MisAutónomos`}
        description={t('messagesPageDescription')}
      />
      
      <div className="flex h-screen overflow-hidden bg-white md:bg-gradient-to-br md:from-slate-50 md:to-blue-50">
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
            {conversationList.length === 0 ? (
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
                        const photoUrl = cachedUser?.user_type === "professionnel" && cachedUser?.profile?.imagen_principal
                          ? cachedUser.profile.imagen_principal
                          : cachedUser?.profile_picture;

                        return photoUrl ? (
                          <OptimizedImage
                            src={photoUrl}
                            alt="Perfil"
                            className="w-full h-full rounded-full"
                            objectFit="cover"
                            width={40}
                            height={40}
                            quality={75}
                            sizes="40px"
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
                        {getDisplayName(conv.otherUserId, conv.conversationId)}
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

        <div className={`flex-1 flex flex-col bg-white md:bg-gray-50 ${
          !selectedConversation ? 'hidden md:flex' : 'flex'
        }`} style={{ height: '100vh', maxHeight: '100vh' }}>
          {selectedConversation ? (
            <>
              <div className="bg-white border-b border-gray-200 px-3 py-2 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden h-8 w-8"
                    onClick={handleBackToConversations}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>

                  <Avatar className="cursor-pointer h-9 w-9" onClick={() => handleNavigateToProfile(selectedProfessionalId)}>
                    {(() => {
                      const photoUrl = otherUserData?.user_type === "professionnel" && otherUserData?.profile?.imagen_principal
                        ? otherUserData.profile.imagen_principal
                        : otherUserData?.profile_picture;

                      return photoUrl ? (
                        <OptimizedImage
                          src={photoUrl}
                          alt="Perfil"
                          className="w-full h-full rounded-full"
                          objectFit="cover"
                          width={36}
                          height={36}
                          quality={75}
                          sizes="36px"
                          priority={true}
                        />
                      ) : (
                        <AvatarFallback className="bg-blue-700 text-white text-sm">
                          {getDisplayName(selectedProfessionalId)?.charAt(0) || "?"}
                        </AvatarFallback>
                      );
                    })()}
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => handleNavigateToProfile(selectedProfessionalId)}
                      className="font-semibold text-sm text-gray-900 hover:text-blue-600 transition-colors flex items-center gap-1 group text-left"
                    >
                      <span className="truncate">
                        {otherUserData?.user_type === "professionnel" && otherUserData?.profile?.business_name 
                          ? otherUserData.profile.business_name
                          : otherUserData?.full_name || getDisplayName(selectedProfessionalId)}
                      </span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </button>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      {t('online')}
                    </span>
                  </div>

                  {otherUserData?.user_type === "professionnel" && getProfessionalPhone() && (
                    <>
                      <a href={`tel:${formatPhoneForCall(getProfessionalPhone())}`} className="md:hidden">
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="h-8 w-8 hover:bg-blue-50"
                        >
                          <Phone className="w-4 h-4" />
                        </Button>
                      </a>
                      <a
                        href={`https://wa.me/${formatPhoneForWhatsApp(getProfessionalPhone())}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="md:hidden"
                      >
                        <Button 
                          size="icon"
                          className="h-8 w-8 bg-green-600 hover:bg-green-700"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                      </a>
                    </>
                  )}

                  <div className="hidden md:flex items-center gap-2">
                    {otherUserData?.user_type === "professionnel" && getProfessionalPhone() && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="hover:bg-blue-50 hover:border-blue-600"
                        >
                          <Phone className="w-4 h-4 mr-1" />
                          <span className="text-xs">{getProfessionalPhone()}</span>
                        </Button>
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
              </div>

              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-3 md:p-6 space-y-3 bg-gray-50"
                style={{ 
                  minHeight: 0,
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                {currentMessages.length === 0 ? (
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
                          <div className={`max-w-[85%] md:max-w-md space-y-2 ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
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
                            
                            {message.quote_request && (
                              <QuoteRequest 
                                quote={message.quote_request}
                                isProfessional={message.sender_id !== user.id && user.user_type === "professionnel"}
                                isClient={message.sender_id === user.id || user.user_type === "client"}
                                onRespond={(response) => handleRespondQuote(message.id, response)}
                                onStatusChange={(response) => handleRespondQuote(message.id, response)}
                              />
                            )}
                            
                            {message.attachments && message.attachments.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {message.attachments.map((file, idx) => (
                                  <FileAttachment key={idx} file={file} />
                                ))}
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
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
                </div>

                <div 
                  className="bg-white border-t border-gray-200 p-2 md:p-4 flex-shrink-0"
                  style={{ 
                    paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))'
                  }}
                >
                  {attachments.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2">
                      {attachments.map((file, idx) => (
                        <FileAttachment 
                          key={idx} 
                          file={file} 
                          onRemove={() => handleRemoveAttachment(idx)}
                          showRemove={true}
                        />
                      ))}
                    </div>
                  )}
                  
                  <form onSubmit={handleSendMessage} className="flex gap-1.5 md:gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.txt"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="h-[42px] w-[42px] md:h-[44px] md:w-[44px]"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingFile}
                    >
                      {uploadingFile ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Paperclip className="w-4 h-4" />
                      )}
                    </Button>
                    
                    {user.user_type !== "professionnel" && (
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-[42px] w-[42px] md:h-[44px] md:w-[44px]"
                        onClick={() => setShowQuoteDialog(true)}
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                    )}
                    
                    <Textarea
                      ref={textareaRef}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder={t('writeMessage')}
                      className="flex-1 min-h-[42px] md:min-h-[50px] max-h-[100px] resize-none text-sm md:text-base"
                      disabled={sendingMessage}
                    />
                    <Button
                      type="submit"
                      disabled={(!newMessage.trim() && attachments.length === 0) || sendingMessage}
                      className="h-[42px] md:h-[50px] w-[42px] md:w-auto md:px-6 bg-blue-600 hover:bg-blue-700"
                    >
                      {sendingMessage ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span className="hidden md:inline ml-2">{t('send')}</span>
                        </>
                      )}
                    </Button>
                  </form>
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

          <Dialog open={showQuoteDialog} onOpenChange={setShowQuoteDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Solicitar presupuesto</DialogTitle>
                <DialogDescription>
                  Envía una solicitud de presupuesto al profesional
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Descripción del trabajo *</label>
                  <Textarea
                    value={quoteData.description}
                    onChange={(e) => setQuoteData({...quoteData, description: e.target.value})}
                    placeholder="Describe qué necesitas..."
                    rows={4}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Presupuesto estimado (€)</label>
                  <Input
                    type="number"
                    value={quoteData.budget}
                    onChange={(e) => setQuoteData({...quoteData, budget: e.target.value})}
                    placeholder="Ej: 500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Fecha límite</label>
                  <Input
                    type="date"
                    value={quoteData.deadline}
                    onChange={(e) => setQuoteData({...quoteData, deadline: e.target.value})}
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSendQuote}
                    disabled={!quoteData.description.trim()}
                    className="flex-1"
                  >
                    Enviar solicitud
                  </Button>
                  <Button 
                    onClick={() => setShowQuoteDialog(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

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
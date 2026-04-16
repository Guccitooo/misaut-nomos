import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Send, MessageSquare, Loader2, Star, CheckCheck, Check,
  ArrowLeft, Phone, MessageCircle, Paperclip, FileText, X,
  Sparkles, Search, ExternalLink
} from "lucide-react";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import { es } from "date-fns/locale";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import OptimizedImage from "../components/ui/OptimizedImage";
import { useLanguage } from "../components/ui/LanguageSwitcher";
import SEOHead from "../components/seo/SEOHead";
import FileAttachment from "../components/messages/FileAttachment";
import QuoteRequest from "../components/messages/QuoteRequest";
import AIAssistantPro from "../components/ai/AIAssistantPro";

// ─── Helpers ────────────────────────────────────────────────────────────────

const CACHE_KEY = 'misautonomos_msgs_';
const CACHE_TTL = 1000 * 60 * 5;
const USERS_CACHE_KEY = 'misautonomos_users_cache';

const loadUserCache = () => {
  try { return JSON.parse(localStorage.getItem(USERS_CACHE_KEY) || '{}'); } catch { return {}; }
};
const saveUserCache = (userId, data) => {
  try {
    const cache = loadUserCache();
    cache[userId] = data;
    localStorage.setItem(USERS_CACHE_KEY, JSON.stringify(cache));
  } catch {}
};

const getContactName = (message, currentUserId, isCurrentUserProfessional) => {
  // Si soy cliente, el contacto es el profesional
  if (!isCurrentUserProfessional) {
    return message.professional_name || message.client_name || null;
  }
  // Si soy profesional, el contacto es el cliente
  return message.client_name || message.professional_name || null;
};

const formatRelativeTime = (dateStr) => {
  const date = new Date(dateStr);
  if (isToday(date)) return format(date, "HH:mm");
  if (isYesterday(date)) return "Ayer";
  const diff = Math.floor((Date.now() - date) / (1000 * 60 * 60 * 24));
  if (diff < 7) return format(date, "EEE", { locale: es });
  return format(date, "d MMM", { locale: es });
};

const fetchAllMessages = async (userId) => {
  const [sent, received] = await Promise.all([
    base44.entities.Message.filter({ sender_id: userId }, '-created_date', 60),
    base44.entities.Message.filter({ recipient_id: userId }, '-created_date', 60)
  ]);
  return [...sent, ...received].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
};

// ─── Skeletons ───────────────────────────────────────────────────────────────

const ConvSkeleton = () => (
  <div className="p-3 space-y-3">
    {[1,2,3,4].map(i => (
      <div key={i} className="flex items-center gap-3 animate-pulse">
        <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="h-3 bg-gray-100 rounded w-3/4" />
        </div>
      </div>
    ))}
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────

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
  const [reviewData, setReviewData] = useState({ rapidez:0, comunicacion:0, calidad:0, precio_satisfaccion:0, comment:"" });
  const [attachments, setAttachments] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [quoteData, setQuoteData] = useState({ description:"", budget:"", deadline:"" });
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const isInitialLoadRef = useRef(true);

  const isProfessional = user?.user_type === "professionnel";

  // ─── Load User ────────────────────────────────────────────────────────────
  useEffect(() => {
    const cached = sessionStorage.getItem('current_user');
    if (cached) {
      try {
        const { user: u, timestamp } = JSON.parse(cached);
        if (u && Date.now() - timestamp < 300000) { setUser(u); return; }
      } catch {}
    }
    base44.auth.me().then(setUser).catch(() => base44.auth.redirectToLogin());
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      isInitialLoadRef.current = true;
      setTimeout(() => { scrollToBottom(false); isInitialLoadRef.current = false; }, 350);
    }
  }, [selectedConversation]);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant", block: "end" });
  };

  const isNearBottom = () => {
    if (!messagesContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    return scrollHeight - scrollTop - clientHeight < 150;
  };

  // ─── Messages Query (polling 10s) ─────────────────────────────────────────
  const { data: allMessages = [], isLoading } = useQuery({
    queryKey: ['messages', user?.id],
    queryFn: async () => {
      const cacheKey = CACHE_KEY + user.id;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          // refresh en background
          fetchAllMessages(user.id).then(fresh => {
            queryClient.setQueryData(['messages', user.id], fresh);
            localStorage.setItem(cacheKey, JSON.stringify({ data: fresh, timestamp: Date.now() }));
          }).catch(() => {});
          return data;
        }
      }
      const fresh = await fetchAllMessages(user.id);
      localStorage.setItem(cacheKey, JSON.stringify({ data: fresh, timestamp: Date.now() }));
      return fresh;
    },
    enabled: !!user,
    staleTime: 5000,
    refetchInterval: 10000, // polling cada 10s
    placeholderData: () => {
      try {
        const c = localStorage.getItem(CACHE_KEY + user?.id);
        return c ? JSON.parse(c).data : [];
      } catch { return []; }
    }
  });

  // ─── Conversation Users (for profile photos) ─────────────────────────────
  const otherUserIds = useMemo(() => {
    const ids = new Set();
    allMessages.forEach(m => {
      if (m.sender_id !== user?.id) ids.add(m.sender_id);
      if (m.recipient_id !== user?.id) ids.add(m.recipient_id);
    });
    return Array.from(ids);
  }, [allMessages, user?.id]);

  const { data: conversationUsers = {} } = useQuery({
    queryKey: ['convUsers', otherUserIds.join(',')],
    queryFn: async () => {
      if (!otherUserIds.length) return {};
      const usersData = {};
      const uncached = [];
      const cache = loadUserCache();
      otherUserIds.forEach(id => {
        if (cache[id]) usersData[id] = cache[id]; else uncached.push(id);
      });
      if (uncached.length) {
        const res = await base44.functions.invoke('getUsersForMessages', { user_ids: uncached });
        if (res.data?.ok) {
          Object.entries(res.data.users || {}).forEach(([id, data]) => {
            usersData[id] = data;
            saveUserCache(id, data);
          });
        }
      }
      return usersData;
    },
    enabled: otherUserIds.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  const { data: otherUserData } = useQuery({
    queryKey: ['otherUser', selectedProfessionalId],
    queryFn: async () => {
      if (!selectedProfessionalId) return null;
      if (conversationUsers[selectedProfessionalId]) return conversationUsers[selectedProfessionalId];
      const cache = loadUserCache();
      if (cache[selectedProfessionalId]) return cache[selectedProfessionalId];
      const res = await base44.functions.invoke('getUsersForMessages', { user_ids: [selectedProfessionalId] });
      if (res.data?.ok) {
        const d = res.data.users?.[selectedProfessionalId];
        if (d) { saveUserCache(selectedProfessionalId, d); return d; }
      }
      return null;
    },
    enabled: !!selectedProfessionalId,
    staleTime: 1000 * 60 * 10,
    placeholderData: () => conversationUsers[selectedProfessionalId] || loadUserCache()[selectedProfessionalId],
  });

  // ─── Review Query ─────────────────────────────────────────────────────────
  const { data: existingReview } = useQuery({
    queryKey: ['review', user?.id, selectedProfessionalId],
    queryFn: async () => {
      if (!user || !selectedProfessionalId || user.user_type !== "client") return null;
      const reviews = await base44.entities.Review.filter({ professional_id: selectedProfessionalId, client_id: user.id });
      return reviews[0] || null;
    },
    enabled: !!user && !!selectedProfessionalId && user?.user_type === "client",
  });

  // ─── Conversations (computed) ──────────────────────────────────────────────
  const conversations = useMemo(() => {
    const convs = {};
    allMessages.forEach(msg => {
      const cid = msg.conversation_id;
      if (!convs[cid]) {
        const otherUserId = msg.sender_id === user?.id ? msg.recipient_id : msg.sender_id;
        // Nombre directo desde el mensaje según rol
        const nameFromMsg = getContactName(msg, user?.id, isProfessional);
        convs[cid] = {
          conversationId: cid,
          messages: [],
          otherUserId,
          otherUserName: nameFromMsg || "...",
          lastMessage: msg,
          unreadCount: 0
        };
      }
      convs[cid].messages.push(msg);
      if (new Date(msg.created_date) > new Date(convs[cid].lastMessage.created_date)) {
        convs[cid].lastMessage = msg;
      }
      if (msg.recipient_id === user?.id && !msg.is_read) {
        convs[cid].unreadCount++;
      }
    });

    // Enriquecer con datos de perfil si disponibles
    Object.values(convs).forEach(conv => {
      const ud = conversationUsers[conv.otherUserId];
      if (ud) {
        if (ud.user_type === "professionnel" && ud.profile?.business_name) {
          conv.otherUserName = ud.profile.business_name;
        } else if (ud.full_name?.trim()) {
          conv.otherUserName = ud.full_name;
        } else if (ud.email) {
          conv.otherUserName = ud.email.split('@')[0];
        }
        conv.otherUserPhoto = ud.user_type === "professionnel"
          ? (ud.profile?.imagen_principal || ud.profile_picture)
          : ud.profile_picture;
      }
    });
    return convs;
  }, [allMessages, user?.id, isProfessional, conversationUsers]);

  const conversationList = useMemo(() => {
    const list = Object.values(conversations).sort((a, b) =>
      new Date(b.lastMessage.created_date) - new Date(a.lastMessage.created_date)
    );
    if (!searchQuery) return list;
    return list.filter(c => c.otherUserName.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [conversations, searchQuery]);

  const currentMessages = useMemo(() => {
    if (!selectedConversation) return [];
    return (conversations[selectedConversation]?.messages || [])
      .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
  }, [selectedConversation, conversations]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (!isInitialLoadRef.current && currentMessages.length > 0 && isNearBottom()) {
      setTimeout(() => scrollToBottom(true), 80);
    }
  }, [currentMessages.length]);

  // Mark as read on conversation open
  useEffect(() => {
    if (!selectedConversation || !user || !currentMessages.length) return;
    const unread = currentMessages.filter(m => m.recipient_id === user.id && !m.is_read);
    if (!unread.length) return;
    Promise.all(unread.map(m => base44.entities.Message.update(m.id, { is_read: true })))
      .then(() => queryClient.invalidateQueries({ queryKey: ['messages', user.id] }))
      .catch(() => {});
  }, [selectedConversation, currentMessages.length]);

  // ─── Display Name ─────────────────────────────────────────────────────────
  const getDisplayName = useCallback((userId) => {
    if (!userId) return "Contacto";
    if (userId === user?.id) return user.full_name || user.email?.split('@')[0] || "Tú";

    const ud = conversationUsers[userId] || (otherUserData?.id === userId ? otherUserData : null);
    if (ud) {
      if (ud.user_type === "professionnel" && ud.profile?.business_name) return ud.profile.business_name;
      if (ud.full_name?.trim()) return ud.full_name;
      if (ud.email) return ud.email.split('@')[0];
    }

    // Fallback: buscar en mensajes usando professional_name / client_name
    for (const msg of allMessages) {
      if (msg.sender_id === userId || msg.recipient_id === userId) {
        const n = msg.professional_name || msg.client_name;
        if (n && n.trim()) return n;
      }
    }
    return "Contacto";
  }, [user, conversationUsers, otherUserData, allMessages]);

  // ─── Helpers UI ───────────────────────────────────────────────────────────
  const getProfessionalPhone = () =>
    otherUserData?.user_type === "professionnel" ? otherUserData.profile?.telefono_contacto : null;

  const formatPhone = (p) => {
    if (!p) return null;
    let c = p.replace(/[^\d+]/g, '');
    return c.startsWith('+') ? c : '+34' + c;
  };
  const formatWhatsApp = (p) => {
    if (!p) return null;
    let c = p.replace(/\D/g, '');
    return (c.length === 9 && !c.startsWith('34')) ? '34' + c : c;
  };

  const canLeaveReview = () => {
    if (!user || user.user_type !== "client" || existingReview) return false;
    const msgs = currentMessages;
    return msgs.some(m => m.sender_id === user.id) && msgs.some(m => m.sender_id === selectedProfessionalId);
  };

  // ─── File Upload ──────────────────────────────────────────────────────────
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []).filter(f => f.size <= 5 * 1024 * 1024);
    if (!files.length) { toast.error("Archivos demasiado grandes (máx 5MB)"); return; }
    setUploadingFile(true);
    try {
      const uploaded = await Promise.all(files.map(async f => {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: f });
        return { url: file_url, name: f.name, type: f.type, size: f.size };
      }));
      setAttachments(prev => [...prev, ...uploaded]);
    } catch { toast.error("Error al subir archivo"); }
    finally { setUploadingFile(false); e.target.value = ''; }
  };

  // ─── Send Message ─────────────────────────────────────────────────────────
  const sendMessageMutation = useMutation({
    mutationFn: async (msgData) => {
      const msg = await base44.entities.Message.create(msgData);
      base44.entities.Notification.create({
        user_id: msgData.recipient_id,
        type: "new_message",
        title: "Nuevo mensaje",
        message: `Mensaje de ${msgData.professional_name || msgData.client_name}`,
        link: createPageUrl("Messages") + `?conversation=${msgData.conversation_id}`,
        metadata: { conversation_id: msgData.conversation_id }
      }).catch(() => {});
      return msg;
    },
    onMutate: async (msgData) => {
      await queryClient.cancelQueries({ queryKey: ['messages'] });
      const prev = queryClient.getQueryData(['messages', user?.id]);
      const temp = { ...msgData, id: `temp-${Date.now()}`, created_date: new Date().toISOString(), is_read: false, _isOptimistic: true };
      queryClient.setQueryData(['messages', user?.id], (old = []) => [...old, temp]);
      localStorage.removeItem(CACHE_KEY + user.id);
      setTimeout(() => scrollToBottom(true), 50);
      return { prev };
    },
    onSuccess: (msg) => {
      queryClient.invalidateQueries({ queryKey: ['messages', user?.id] });
      // Email notification async (non-blocking)
      base44.entities.User.filter({ id: msg.recipient_id }).then(([recipient]) => {
        if (recipient) {
          base44.integrations.Core.SendEmail({
            to: recipient.email,
            subject: "Nuevo mensaje en MisAutónomos",
            body: `<p>Tienes un nuevo mensaje de <strong>${msg.professional_name || msg.client_name}</strong>.</p><p><a href="https://misautonomos.es/mensajes?conversation=${msg.conversation_id}">Ver mensaje →</a></p>`,
            from_name: "MisAutónomos"
          }).catch(() => {});
        }
      }).catch(() => {});
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['messages', user?.id], ctx.prev);
      toast.error("Error al enviar el mensaje");
    }
  });

  const handleSendMessage = useCallback(async (e) => {
    e?.preventDefault();
    if ((!newMessage.trim() && !attachments.length) || !selectedConversation || sendingMessage) return;
    setSendingMessage(true);
    try {
      const otherUserId = selectedProfessionalId || conversations[selectedConversation]?.otherUserId;
      if (!otherUserId) throw new Error('Sin destinatario');

      // Nombres desde los mensajes existentes o perfil
      let profName = conversations[selectedConversation]?.messages?.find(m => !!m.professional_name)?.professional_name || "";
      let clientName = conversations[selectedConversation]?.messages?.find(m => !!m.client_name)?.client_name || "";

      if (isProfessional) {
        profName = otherUserData?.profile?.business_name || user.full_name || user.email;
      } else {
        clientName = user.full_name || user.email;
        if (!profName) profName = getDisplayName(otherUserId);
      }

      const msgData = {
        conversation_id: selectedConversation,
        sender_id: user.id,
        recipient_id: otherUserId,
        content: newMessage.trim() || (attachments.length ? "📎 Archivo adjunto" : ""),
        professional_name: profName,
        client_name: clientName,
        is_read: false,
        attachments: attachments.length ? attachments : undefined
      };

      setNewMessage("");
      setAttachments([]);
      sendMessageMutation.mutate(msgData);
      setTimeout(() => textareaRef.current?.focus(), 100);
    } catch (err) {
      toast.error("Error: " + err.message);
    } finally {
      setSendingMessage(false);
    }
  }, [newMessage, attachments, selectedConversation, sendingMessage, selectedProfessionalId, conversations, isProfessional, otherUserData, user, getDisplayName]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); }
  };

  // ─── Quote ────────────────────────────────────────────────────────────────
  const handleSendQuote = async () => {
    if (!quoteData.description.trim()) return;
    const otherUserId = selectedProfessionalId || conversations[selectedConversation]?.otherUserId;
    if (!otherUserId) return;
    const profName = conversations[selectedConversation]?.messages?.find(m => m.professional_name)?.professional_name || getDisplayName(otherUserId);
    sendMessageMutation.mutate({
      conversation_id: selectedConversation,
      sender_id: user.id,
      recipient_id: otherUserId,
      content: `📋 Solicitud de presupuesto: ${quoteData.description.substring(0, 60)}...`,
      professional_name: isProfessional ? (otherUserData?.profile?.business_name || user.full_name || "") : profName,
      client_name: !isProfessional ? (user.full_name || user.email) : "",
      is_read: false,
      quote_request: { description: quoteData.description, budget: quoteData.budget ? parseFloat(quoteData.budget) : undefined, deadline: quoteData.deadline || undefined, status: "pending" }
    });
    setShowQuoteDialog(false);
    setQuoteData({ description: "", budget: "", deadline: "" });
  };

  const handleRespondQuote = async (messageId, response) => {
    const msg = currentMessages.find(m => m.id === messageId);
    if (!msg) return;
    await base44.entities.Message.update(messageId, { quote_request: { ...msg.quote_request, ...response } });
    queryClient.invalidateQueries({ queryKey: ['messages'] });
    toast.success("Presupuesto actualizado");
  };

  // ─── Review ───────────────────────────────────────────────────────────────
  const createReviewMutation = useMutation({
    mutationFn: async (review) => {
      const avg = (review.rapidez + review.comunicacion + review.calidad + review.precio_satisfaccion) / 4;
      return base44.entities.Review.create({ ...review, rating: avg, professional_id: selectedProfessionalId, client_id: user.id, client_name: user.full_name || user.email, conversation_id: selectedConversation, is_verified: true, is_reported: false });
    },
    onSuccess: async () => {
      const allReviews = await base44.entities.Review.filter({ professional_id: selectedProfessionalId });
      const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
      const [prof] = await base44.entities.ProfessionalProfile.filter({ user_id: selectedProfessionalId });
      if (prof) await base44.entities.ProfessionalProfile.update(prof.id, { average_rating: avg, total_reviews: allReviews.length });
      queryClient.invalidateQueries({ queryKey: ['review'] });
      setShowReviewDialog(false);
      setReviewData({ rapidez:0, comunicacion:0, calidad:0, precio_satisfaccion:0, comment:"" });
      toast.success("¡Valoración publicada!");
    },
    onError: () => toast.error("Error al publicar la valoración")
  });

  // ─── Navigation ───────────────────────────────────────────────────────────
  const handleSelectConversation = (conv) => {
    setSelectedConversation(conv.conversationId);
    setSelectedProfessionalId(conv.otherUserId);
    setSearchParams({ conversation: conv.conversationId, professional: conv.otherUserId }, { replace: true });
  };

  const handleBack = () => {
    setSelectedConversation(null);
    setSelectedProfessionalId(null);
    setSearchParams({}, { replace: true });
  };

  // ─── Loading state ────────────────────────────────────────────────────────
  if (!user || isLoading) {
    return (
      <div className="flex h-screen bg-white">
        <div className="w-full md:w-80 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-900">Mensajes</span>
          </div>
          <ConvSkeleton />
        </div>
        <div className="flex-1 hidden md:flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  const selectedConvData = conversations[selectedConversation];
  const otherName = selectedConvData
    ? (selectedConvData.otherUserName || getDisplayName(selectedConvData.otherUserId))
    : "";
  const otherPhoto = selectedConvData?.otherUserPhoto
    || (otherUserData?.user_type === "professionnel" ? otherUserData?.profile?.imagen_principal : null)
    || otherUserData?.profile_picture;

  const StarRating = ({ value, onChange, label }) => (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{t(label)}</Label>
      <div className="flex gap-1">
        {[1,2,3,4,5].map(star => (
          <button key={star} type="button" onClick={() => onChange(star)}>
            <Star className={`w-7 h-7 transition-colors ${star <= value ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <SEOHead title={`${t('messages')} - MisAutónomos`} description="Mensajes y conversaciones" />

      <div className="flex bg-white overflow-hidden" style={{ height: '100dvh' }}>

        {/* ── Columna izquierda: Lista de conversaciones ── */}
        <div className={`flex-shrink-0 w-full md:w-80 bg-white border-r border-gray-200 flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-gray-900 text-base">Mensajes</h2>
              {conversationList.length > 0 && (
                <span className="ml-auto text-xs text-gray-400 font-medium">{conversationList.length}</span>
              )}
            </div>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar conversación..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-xl text-sm text-gray-700 placeholder-gray-400 outline-none focus:bg-gray-50 focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {conversationList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-blue-400" />
                </div>
                <p className="font-semibold text-gray-700 mb-1">Aún no tienes mensajes</p>
                <p className="text-sm text-gray-500 mb-5">Contacta con un autónomo para empezar</p>
                <Button onClick={() => navigate(createPageUrl("Search"))} className="bg-blue-600 hover:bg-blue-700 rounded-xl">
                  Buscar autónomos
                </Button>
              </div>
            ) : (
              conversationList.map(conv => {
                const isActive = selectedConversation === conv.conversationId;
                const initial = (conv.otherUserName || "?").charAt(0).toUpperCase();
                return (
                  <button
                    key={conv.conversationId}
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors text-left ${isActive ? 'bg-blue-50 border-l-[3px] border-l-blue-600' : ''}`}
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar className="w-12 h-12">
                        {conv.otherUserPhoto ? (
                          <AvatarImage src={conv.otherUserPhoto} alt={conv.otherUserName} className="object-cover" />
                        ) : (
                          <AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-base">{initial}</AvatarFallback>
                        )}
                      </Avatar>
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-1">
                        <span className={`text-sm font-semibold truncate ${conv.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                          {conv.otherUserName}
                        </span>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {formatRelativeTime(conv.lastMessage.created_date)}
                        </span>
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${conv.unreadCount > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                        {conv.lastMessage.sender_id === user.id && <span className="mr-1">Tú:</span>}
                        {conv.lastMessage.content}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Columna derecha: Chat ── */}
        <div className={`flex-1 flex flex-col bg-gray-50 min-w-0 ${!selectedConversation ? 'hidden md:flex' : 'flex'}`} style={{ minHeight: 0 }}>
          {selectedConversation && selectedConvData ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 px-3 md:px-5 py-3 flex-shrink-0 shadow-sm">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 -ml-1" onClick={handleBack}>
                    <ArrowLeft className="w-5 h-5 text-gray-700" />
                  </Button>

                  <Avatar className="w-10 h-10 flex-shrink-0 cursor-pointer" onClick={() => navigate(createPageUrl("ProfessionalProfile") + `?id=${selectedConvData.otherUserId}`)}>
                    {otherPhoto ? (
                      <AvatarImage src={otherPhoto} alt={otherName} className="object-cover" />
                    ) : (
                      <AvatarFallback className="bg-blue-600 text-white font-bold">{otherName.charAt(0) || "?"}</AvatarFallback>
                    )}
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-gray-900 text-sm truncate">{otherName}</p>
                      <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0 cursor-pointer hover:text-blue-600" onClick={() => navigate(createPageUrl("ProfessionalProfile") + `?id=${selectedConvData.otherUserId}`)} />
                    </div>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span>
                      En línea
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {getProfessionalPhone() && (
                      <>
                        <a href={`tel:${formatPhone(getProfessionalPhone())}`}>
                          <Button variant="outline" size="icon" className="h-9 w-9 hover:bg-blue-50 hover:border-blue-300">
                            <Phone className="w-4 h-4 text-blue-600" />
                          </Button>
                        </a>
                        <a href={`https://wa.me/${formatWhatsApp(getProfessionalPhone())}`} target="_blank" rel="noopener noreferrer">
                          <Button size="icon" className="h-9 w-9 bg-green-500 hover:bg-green-600">
                            <MessageCircle className="w-4 h-4 text-white" />
                          </Button>
                        </a>
                      </>
                    )}
                    {canLeaveReview() && (
                      <Button onClick={() => setShowReviewDialog(true)} size="sm" className="bg-amber-500 hover:bg-amber-600 h-9">
                        <Star className="w-3.5 h-3.5" />
                        <span className="hidden md:inline ml-1.5 text-xs">Valorar</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages area */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto px-3 md:px-6 py-4 space-y-1"
                style={{ minHeight: 0, WebkitOverflowScrolling: 'touch' }}
              >
                {currentMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400 text-sm">Escribe el primer mensaje</p>
                  </div>
                ) : (
                  <>
                    {currentMessages.map((msg, idx) => {
                      const isMe = msg.sender_id === user.id;
                      const isOpt = msg._isOptimistic;
                      const prevMsg = currentMessages[idx - 1];
                      const isSameSender = prevMsg && prevMsg.sender_id === msg.sender_id;
                      const isLastInGroup = !currentMessages[idx + 1] || currentMessages[idx + 1].sender_id !== msg.sender_id;

                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isSameSender ? 'mt-0.5' : 'mt-3'}`}>
                          {/* Avatar para el otro (solo en último de grupo) */}
                          {!isMe && (
                            <div className="w-8 flex-shrink-0 mr-2 self-end">
                              {isLastInGroup ? (
                                <Avatar className="w-7 h-7">
                                  {otherPhoto ? <AvatarImage src={otherPhoto} className="object-cover" /> : (
                                    <AvatarFallback className="bg-gray-200 text-gray-600 text-xs font-bold">{otherName.charAt(0)}</AvatarFallback>
                                  )}
                                </Avatar>
                              ) : <div className="w-7" />}
                            </div>
                          )}

                          <div className={`max-w-[75%] md:max-w-[60%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            {/* Quote request */}
                            {msg.quote_request && (
                              <QuoteRequest
                                quote={msg.quote_request}
                                isProfessional={msg.sender_id !== user.id && user.user_type === "professionnel"}
                                isClient={msg.sender_id === user.id || user.user_type === "client"}
                                onRespond={res => handleRespondQuote(msg.id, res)}
                                onStatusChange={res => handleRespondQuote(msg.id, res)}
                              />
                            )}

                            {/* Attachments */}
                            {msg.attachments?.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-1">
                                {msg.attachments.map((f, i) => <FileAttachment key={i} file={f} />)}
                              </div>
                            )}

                            {/* Bubble */}
                            <div className={`relative px-4 py-2.5 shadow-sm ${
                              isMe
                                ? 'bg-blue-600 text-white rounded-[18px] rounded-br-[4px]'
                                : 'bg-white text-gray-900 border border-gray-100 rounded-[18px] rounded-bl-[4px]'
                            } ${isOpt ? 'opacity-70' : ''}`}>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                              <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <span className={`text-[10px] ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                  {format(new Date(msg.created_date), "HH:mm")}
                                </span>
                                {isMe && (
                                  isOpt ? <Loader2 className="w-3 h-3 text-blue-200 animate-spin" />
                                  : msg.is_read ? <CheckCheck className="w-3 h-3 text-blue-200" />
                                  : <Check className="w-3 h-3 text-blue-300" />
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

              {/* Input area */}
              <div
                className="bg-white border-t border-gray-200 flex-shrink-0"
                style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))', padding: '10px 12px', paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}
              >
                {showAIAssistant && isProfessional && (
                  <div className="mb-2">
                    <AIAssistantPro
                      type="message"
                      context={{
                        clientName: otherName,
                        clientMessage: currentMessages[currentMessages.length - 1]?.content || "",
                        professionalName: getDisplayName(user.id),
                        service: otherUserData?.profile?.categories?.[0] || "Servicio profesional"
                      }}
                      onApply={s => { setNewMessage(s); setShowAIAssistant(false); }}
                    />
                  </div>
                )}

                {attachments.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {attachments.map((f, i) => (
                      <div key={i} className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1 text-xs">
                        <span className="truncate max-w-[120px] text-gray-700">{f.name}</span>
                        <button onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-end gap-1.5">
                  <input ref={fileInputRef} type="file" multiple onChange={handleFileUpload} className="hidden" accept="image/*,.pdf,.doc,.docx,.txt" />

                  {isProfessional && (
                    <Button type="button" variant="ghost" size="icon" className={`h-10 w-10 rounded-xl flex-shrink-0 ${showAIAssistant ? 'bg-purple-100 text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                      onClick={() => setShowAIAssistant(p => !p)}>
                      <Sparkles className="w-4 h-4" />
                    </Button>
                  )}

                  <Button type="button" variant="ghost" size="icon" className="h-10 w-10 rounded-xl flex-shrink-0 text-gray-500 hover:text-gray-700"
                    onClick={() => fileInputRef.current?.click()} disabled={uploadingFile}>
                    {uploadingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                  </Button>

                  {!isProfessional && (
                    <Button type="button" variant="ghost" size="icon" className="h-10 w-10 rounded-xl flex-shrink-0 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowQuoteDialog(true)}>
                      <FileText className="w-4 h-4" />
                    </Button>
                  )}

                  <textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={e => {
                      setNewMessage(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribe un mensaje..."
                    rows={1}
                    className="flex-1 resize-none bg-gray-100 rounded-2xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-gray-50 focus:ring-2 focus:ring-blue-200 transition-all overflow-y-hidden"
                    style={{ minHeight: '40px', maxHeight: '96px' }}
                    disabled={sendingMessage}
                  />

                  <Button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={(!newMessage.trim() && !attachments.length) || sendingMessage}
                    className="h-10 w-10 rounded-xl flex-shrink-0 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 p-0"
                  >
                    {sendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center p-8">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-10 h-10 text-blue-300" />
                </div>
                <p className="font-semibold text-gray-700 text-lg mb-1">Selecciona una conversación</p>
                <p className="text-sm text-gray-400">Elige un contacto para chatear</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Quote Dialog ── */}
      <Dialog open={showQuoteDialog} onOpenChange={setShowQuoteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitar presupuesto</DialogTitle>
            <DialogDescription>Envía una solicitud al profesional</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Descripción del trabajo *</label>
              <Textarea value={quoteData.description} onChange={e => setQuoteData(p => ({...p, description: e.target.value}))} placeholder="Describe qué necesitas..." rows={4} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Presupuesto estimado (€)</label>
              <Input type="number" value={quoteData.budget} onChange={e => setQuoteData(p => ({...p, budget: e.target.value}))} placeholder="Ej: 500" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Fecha límite</label>
              <Input type="date" value={quoteData.deadline} onChange={e => setQuoteData(p => ({...p, deadline: e.target.value}))} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSendQuote} disabled={!quoteData.description.trim()} className="flex-1 bg-blue-600 hover:bg-blue-700">Enviar solicitud</Button>
              <Button onClick={() => setShowQuoteDialog(false)} variant="outline" className="flex-1">Cancelar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Review Dialog ── */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              Valorar a {otherName}
            </DialogTitle>
            <DialogDescription>Tu opinión ayuda a otros clientes</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-3">
            <StarRating label="rapidez" value={reviewData.rapidez} onChange={v => setReviewData(p => ({...p, rapidez: v}))} />
            <StarRating label="comunicacion" value={reviewData.comunicacion} onChange={v => setReviewData(p => ({...p, comunicacion: v}))} />
            <StarRating label="calidadTrabajo" value={reviewData.calidad} onChange={v => setReviewData(p => ({...p, calidad: v}))} />
            <StarRating label="relacionCalidadPrecio" value={reviewData.precio_satisfaccion} onChange={v => setReviewData(p => ({...p, precio_satisfaccion: v}))} />
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Comentario (opcional)</Label>
              <Textarea value={reviewData.comment} onChange={e => setReviewData(p => ({...p, comment: e.target.value}))} placeholder="Cuéntanos tu experiencia..." className="h-28 resize-none" maxLength={500} />
              <p className="text-xs text-gray-400 text-right">{reviewData.comment.length}/500</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>Cancelar</Button>
            <Button
              onClick={() => {
                if (!reviewData.rapidez || !reviewData.comunicacion || !reviewData.calidad || !reviewData.precio_satisfaccion) {
                  toast.error("Valora todos los aspectos"); return;
                }
                createReviewMutation.mutate(reviewData);
              }}
              disabled={createReviewMutation.isPending}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {createReviewMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Star className="w-4 h-4 mr-2" />}
              Publicar valoración
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
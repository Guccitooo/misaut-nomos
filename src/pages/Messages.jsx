import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Send, MessageSquare, Loader2, Star, CheckCheck, Check,
  ArrowLeft, Phone, MessageCircle, Paperclip, FileText, X,
  Sparkles, Search
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { es } from "date-fns/locale";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useLanguage } from "../components/ui/LanguageSwitcher";
import SEOHead from "../components/seo/SEOHead";
import FileAttachment from "../components/messages/FileAttachment";
import QuoteRequest from "../components/messages/QuoteRequest";
import AIAssistantPro from "../components/ai/AIAssistantPro";
import SendQuoteDialog from "../components/messages/SendQuoteDialog";
import { notifyUser, pushTemplates } from "@/services/pushNotifications";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatRelativeTime = (dateStr) => {
  const date = new Date(dateStr);
  if (isToday(date)) return format(date, "HH:mm");
  if (isYesterday(date)) return "Ayer";
  const diff = Math.floor((Date.now() - date) / (1000 * 60 * 60 * 24));
  if (diff < 7) return format(date, "EEE", { locale: es });
  return format(date, "d MMM", { locale: es });
};

// Obtener nombre del interlocutor dado el otherUserId (quien NO soy yo).
// Si el otro es el sender → usamos el nombre que él guardó al enviar (professional_name o client_name).
// Si el otro es el recipient → igual, buscamos cualquier nombre disponible.
// Clave: buscamos el nombre asociado al otherUserId, no al user_type.
const getInterlocutorName = (msg, otherUserId) => {
  if (!otherUserId) return null;
  // Si el otro fue el remitente del mensaje, su nombre está en professional_name o client_name
  if (msg.sender_id === otherUserId) {
    return msg.professional_name || msg.client_name || null;
  }
  // Si el otro fue el destinatario, su nombre también puede estar guardado
  return msg.professional_name || msg.client_name || null;
};

// ─── Audio Bubble ─────────────────────────────────────────────────────────────
const AudioBubble = ({ attachment, isMe }) => {
  const [playing, setPlaying] = useState(false);
  const [realDuration, setRealDuration] = useState(attachment.duration || null);
  const audioRef = useRef(null);

  const formatDuration = (secs) => {
    if (!secs && secs !== 0) return '0:00';
    const s = Math.round(secs);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  const handlePlay = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(attachment.url);
      audioRef.current.addEventListener('loadedmetadata', () => {
        if (!attachment.duration) setRealDuration(Math.round(audioRef.current.duration));
      });
      audioRef.current.addEventListener('ended', () => setPlaying(false));
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  const bg = isMe ? 'bg-blue-500' : 'bg-gray-100';
  const textColor = isMe ? 'text-blue-100' : 'text-gray-500';
  const btnBg = isMe ? 'bg-white/20 hover:bg-white/30' : 'bg-white hover:bg-gray-50 shadow-sm';
  const btnColor = isMe ? 'text-white' : 'text-blue-600';
  const barBg = isMe ? 'bg-white/20' : 'bg-gray-200';

  return (
    <div className={`flex items-center gap-2.5 rounded-2xl px-3 py-2.5 min-w-[180px] max-w-[240px] ${bg}`}>
      <button
        onClick={handlePlay}
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${btnBg} ${btnColor}`}
      >
        {playing ? (
          <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
            <rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
            <path d="M8 5.14v14l11-7-11-7z"/>
          </svg>
        )}
      </button>
      <div className={`flex-1 h-1 rounded-full ${barBg}`} />
      <span className={`text-xs font-medium flex-shrink-0 ${textColor}`}>
        {formatDuration(realDuration)}
      </span>
    </div>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const ConvSkeleton = () => (
  <div className="p-3 space-y-3">
    {[1, 2, 3, 4].map(i => (
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

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MessagesPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Leer parámetro conv de la URL
  const urlParams = new URLSearchParams(window.location.search);
  const convFromUrl = urlParams.get('conv') || urlParams.get('conversation');

  const [selectedConvId, setSelectedConvId] = useState(convFromUrl || null);
  const [selectedOtherUserId, setSelectedOtherUserId] = useState(null);

  const [allMessages, setAllMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Profiles cache: professionalId -> profile
  const [profilesCache, setProfilesCache] = useState({});
  const [professionalPhone, setProfessionalPhone] = useState(null);
  const [professionalHasWhatsapp, setProfessionalHasWhatsapp] = useState(false);
  const [professionalSlug, setProfessionalSlug] = useState(null);

  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewData, setReviewData] = useState({ rapidez: 0, comunicacion: 0, calidad: 0, precio_satisfaccion: 0, comment: "" });

  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [quoteData, setQuoteData] = useState({ description: "", budget: "", deadline: "" });
  const [showSendQuoteDialog, setShowSendQuoteDialog] = useState(false);
  const [sendingQuote, setSendingQuote] = useState(false);

  const [showAIAssistant, setShowAIAssistant] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const pollingRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const isProfessional = user?.user_type === "professionnel";

  // ─── Load user ───────────────────────────────────────────────────────────
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Try session cache first
        const cached = sessionStorage.getItem('current_user');
        if (cached) {
          const { user: u, timestamp } = JSON.parse(cached);
          if (u && Date.now() - timestamp < 300000) {
            setUser(u);
            setLoadingUser(false);
            return;
          }
        }
        const u = await base44.auth.me();
        setUser(u);
      } catch {
        base44.auth.redirectToLogin(window.location.href);
      } finally {
        setLoadingUser(false);
      }
    };
    loadUser();
  }, []);

  // ─── Handle pending chat action after login ───────────────────────────────
  useEffect(() => {
    if (!user) return;
    try {
      const pending = sessionStorage.getItem('pending_chat_action');
      if (!pending) return;
      const { action, professionalId } = JSON.parse(pending);
      sessionStorage.removeItem('pending_chat_action');
      if (action === 'open_chat' && professionalId) {
        const convId = [user.id, professionalId].sort().join('_');
        setSelectedConvId(convId);
        setSelectedOtherUserId(professionalId);
      }
    } catch {}
  }, [user]);

  // ─── Load messages ────────────────────────────────────────────────────────
  const loadMessages = useCallback(async () => {
    if (!user) return;
    try {
      const [sent, received] = await Promise.all([
        base44.entities.Message.filter({ sender_id: user.id }, '-created_date', 500),
        base44.entities.Message.filter({ recipient_id: user.id }, '-created_date', 500)
      ]);
      const allMsgs = [...sent, ...received];
      // Dedup by id
      const seen = new Set();
      const unique = allMsgs.filter(m => {
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      });
      setAllMessages(unique);
    } catch {}
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setLoadingMessages(true);
    loadMessages().finally(() => setLoadingMessages(false));
    // Polling every 10s
    pollingRef.current = setInterval(loadMessages, 10000);
    return () => clearInterval(pollingRef.current);
  }, [user, loadMessages]);

  // ─── Build conversations list ─────────────────────────────────────────────
  const conversations = useMemo(() => {
    const convMap = {};
    allMessages.forEach(msg => {
      const cid = msg.conversation_id;
      if (!cid) return;
      if (!convMap[cid]) {
        convMap[cid] = {
          conversationId: cid,
          lastMessage: msg,
          messages: [],
          unreadCount: 0,
          otherUserId: msg.sender_id === user?.id ? msg.recipient_id : msg.sender_id,
          contactName: null,
        };
      }
      convMap[cid].messages.push(msg);
      // Keep most recent as lastMessage
      if (new Date(msg.created_date) > new Date(convMap[cid].lastMessage.created_date)) {
        convMap[cid].lastMessage = msg;
      }
      // Unread count
      if (msg.recipient_id === user?.id && !msg.is_read) {
        convMap[cid].unreadCount++;
      }
    });

    // Determine contact name: buscar en los mensajes el nombre del interlocutor (otherUserId).
    // Estrategia: mirar mensajes donde el OTHER fue el sender — su nombre estará en professional_name o client_name.
    // Si no hay mensajes del otro, mirar mensajes míos — también guardan ambos nombres.
    // Prioridad final: profilesCache con datos reales del User entity.
    const myId = user?.id;
    Object.values(convMap).forEach(conv => {
      const otherUserId = conv.otherUserId;
      
      // 1. Buscar en mensajes donde el otro fue sender (nombre más fiable)
      for (const msg of conv.messages) {
        if (msg.sender_id !== otherUserId) continue;
        // El otro envió este mensaje — su nombre está en professional_name o client_name
        // Usamos el que NO sea el nombre del usuario actual
        const name = msg.professional_name || msg.client_name || null;
        if (name && name.trim()) {
          conv.contactName = name.trim();
          break;
        }
      }

      // 2. Si no encontramos nada, buscar en mensajes míos (también guardan ambos nombres)
      if (!conv.contactName) {
        for (const msg of conv.messages) {
          if (msg.sender_id !== myId) continue;
          // Yo envié este mensaje — los campos professional_name/client_name corresponden al otro
          // Si soy profesional → client_name es el nombre del cliente (el otro)
          // Si soy cliente → professional_name es el nombre del pro (el otro)
          const myType = user?.user_type;
          const name = myType === 'professionnel' 
            ? (msg.client_name || msg.professional_name)
            : (msg.professional_name || msg.client_name);
          if (name && name.trim()) {
            conv.contactName = name.trim();
            break;
          }
        }
      }

      // 3. Fallback: profilesCache (buscado via User/ProfessionalProfile entity)
      if (!conv.contactName) {
        const cached = profilesCache[otherUserId];
        if (cached) {
          conv.contactName = cached.business_name || cached.full_name || cached.email?.split('@')[0] || null;
        }
      }

      conv.contactName = conv.contactName || "...";
    });

    return Object.values(convMap).sort((a, b) =>
      new Date(b.lastMessage.created_date) - new Date(a.lastMessage.created_date)
    );
  }, [allMessages, user?.id, user?.user_type, profilesCache]);

  // Filtered conversations for search
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    return conversations.filter(c => c.contactName.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [conversations, searchQuery]);

  // ─── Auto-select conversation from URL ───────────────────────────────────
  useEffect(() => {
    if (!selectedConvId || loadingMessages) return;

    const conv = conversations.find(c => c.conversationId === selectedConvId);
    if (conv && !selectedOtherUserId) {
      setSelectedOtherUserId(conv.otherUserId);
      return;
    }

    // Si la conversación no está en la lista pero tenemos ?conv=XXXX,
    // hacer fetch directo de mensajes con ese conversation_id
    if (!conv && !selectedOtherUserId) {
      const loadConversationFromUrl = async () => {
        try {
          const msgs = await base44.entities.Message.filter({ conversation_id: selectedConvId }, 'created_date', 100);
          if (msgs.length > 0) {
            const firstMsg = msgs[0];
            const otherUserId = firstMsg.sender_id === user.id ? firstMsg.recipient_id : firstMsg.sender_id;
            setSelectedOtherUserId(otherUserId);
            setAllMessages(prev => {
              const existing = prev.filter(m => m.conversation_id === selectedConvId);
              if (existing.length === 0) {
                return [...prev, ...msgs];
              }
              return prev;
            });
          }
        } catch {}
      };
      loadConversationFromUrl();
    }
  }, [conversations, selectedConvId, loadingMessages, user]);

  // ─── Current conversation messages ────────────────────────────────────────
  const currentMessages = useMemo(() => {
    if (!selectedConvId) return [];
    const conv = conversations.find(c => c.conversationId === selectedConvId);
    return (conv?.messages || []).sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
  }, [selectedConvId, conversations]);

  const currentConv = useMemo(() =>
    conversations.find(c => c.conversationId === selectedConvId),
    [conversations, selectedConvId]
  );

  // ─── Auto-scroll ──────────────────────────────────────────────────────────
  const scrollToBottom = useCallback((smooth = true) => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant", block: "end" });
    }, 80);
  }, []);

  useEffect(() => {
    if (selectedConvId) scrollToBottom(false);
  }, [selectedConvId]);

  useEffect(() => {
    scrollToBottom(true);
  }, [currentMessages.length]);

  // ─── Mark as read ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedConvId || !user || !currentMessages.length) return;
    const unread = currentMessages.filter(m => m.recipient_id === user.id && !m.is_read);
    if (!unread.length) return;
    Promise.all(unread.map(m => base44.entities.Message.update(m.id, { is_read: true })))
      .then(() => loadMessages())
      .catch(() => {});
  }, [selectedConvId, currentMessages.length]);

  // ─── Fetch missing profile names ──────────────────────────────────────────
  useEffect(() => {
    // Buscar nombres faltantes para TODAS las conversaciones, no solo las que muestran "..."
    // porque puede que el nombre en el mensaje esté vacío aunque el usuario exista
    const missingIds = conversations
      .filter(c => c.otherUserId && !profilesCache[c.otherUserId])
      .map(c => c.otherUserId);

    if (!missingIds.length) return;

    missingIds.forEach(async (uid) => {
      try {
        // Buscar primero en ProfessionalProfile (tiene business_name)
        const profiles = await base44.entities.ProfessionalProfile.filter({ user_id: uid });
        if (profiles[0]?.business_name || profiles[0]) {
          setProfilesCache(prev => ({
            ...prev,
            [uid]: {
              business_name: profiles[0].business_name || null,
              full_name: null,
              email: null,
              type: 'professional'
            }
          }));
        } else {
          // Si no tiene perfil pro, buscar en User entity
          const users = await base44.entities.User.filter({ id: uid });
          if (users[0]) {
            setProfilesCache(prev => ({
              ...prev,
              [uid]: {
                business_name: null,
                full_name: users[0].full_name || null,
                email: users[0].email || null,
                type: 'client'
              }
            }));
          }
        }
      } catch {}
    });
  }, [conversations]);

  // ─── Load professional contact info ───────────────────────────────────────
  useEffect(() => {
    if (!selectedOtherUserId) {
      setProfessionalPhone(null);
      setProfessionalHasWhatsapp(false);
      setProfessionalSlug(null);
      return;
    }
    const loadProfessionalInfo = async () => {
      try {
        const profiles = await base44.entities.ProfessionalProfile.filter({ user_id: selectedOtherUserId });
        if (profiles[0]) {
          setProfessionalPhone(profiles[0].telefono_contacto || null);
          setProfessionalHasWhatsapp(profiles[0].metodos_contacto?.includes('whatsapp') || false);
          setProfessionalSlug(profiles[0].slug_publico || null);
        }
      } catch {}
    };
    loadProfessionalInfo();
  }, [selectedOtherUserId]);

  // ─── Existing review ──────────────────────────────────────────────────────
  const [existingReview, setExistingReview] = useState(null);
  useEffect(() => {
    if (!user || !selectedOtherUserId || user.user_type !== "client") return;
    base44.entities.Review.filter({ professional_id: selectedOtherUserId, client_id: user.id })
      .then(r => setExistingReview(r[0] || null))
      .catch(() => {});
  }, [user, selectedOtherUserId]);

  // ─── Resolved contact name for open chat header ───────────────────────────
  const resolvedContactName = useMemo(() => {
    if (!selectedConvId) return "";
    if (currentConv?.contactName && currentConv.contactName !== "...") return currentConv.contactName;
    const cached = profilesCache[selectedOtherUserId];
    if (cached) return cached.business_name || cached.full_name || cached.email?.split('@')[0] || "Usuario";
    for (const msg of currentMessages) {
      const name = getInterlocutorName(msg, selectedOtherUserId);
      if (name && name.trim()) return name.trim();
    }
    return "...";
  }, [selectedConvId, currentConv, profilesCache, selectedOtherUserId, currentMessages]);

  // ─── Audio Recording ──────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => setRecordingSeconds(s => s + 1), 1000);
    } catch {
      toast.error("No se pudo acceder al micrófono");
    }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    const mr = mediaRecorderRef.current;
    if (!mr) return;

    // Capturar duration ANTES de parar (recordingSeconds puede mutar)
    const duration = recordingSeconds;

    // Definir onstop ANTES de llamar a mr.stop()
    mr.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });

      if (blob.size === 0) {
        toast.error("No se grabó ningún audio. Inténtalo otra vez.");
        setIsRecording(false);
        setRecordingSeconds(0);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = reader.result;
        try {
          const otherUserId = currentConv?.otherUserId || selectedOtherUserId;
          if (!otherUserId) return;

          const profName = currentMessages.find(m => m.professional_name)?.professional_name || resolvedContactName || "";
          const clientName = currentMessages.find(m => m.client_name)?.client_name || user.full_name || user.email || "";

          await base44.entities.Message.create({
            conversation_id: selectedConvId,
            sender_id: user.id,
            recipient_id: otherUserId,
            content: '',
            professional_name: isProfessional ? (user.full_name || "") : profName,
            client_name: !isProfessional ? clientName : "",
            is_read: false,
            attachments: [{
              url: base64Audio,
              type: 'audio',
              name: `audio_${Date.now()}.webm`,
              size: blob.size,
              duration: duration
            }]
          });
          await loadMessages();
          scrollToBottom(true);
        } catch {
          toast.error("Error al enviar audio");
        }
      };
      reader.readAsDataURL(blob);
    };

    mr.stop();
    if (mr.stream) mr.stream.getTracks().forEach(track => track.stop());
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  // ─── Send Message ─────────────────────────────────────────────────────────
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if ((!newMessage.trim() && !attachments.length) || !selectedConvId || sending) return;
    setSending(true);

    try {
      const otherUserId = currentConv?.otherUserId || selectedOtherUserId;
      if (!otherUserId) throw new Error('Sin destinatario');

      // Determine names
      let profName = "";
      let clientName = "";

      // Scan existing messages for names
      for (const msg of currentMessages) {
        if (!profName && msg.professional_name) profName = msg.professional_name;
        if (!clientName && msg.client_name) clientName = msg.client_name;
        if (profName && clientName) break;
      }

      if (isProfessional) {
        profName = profName || user.full_name || user.email || "";
      } else {
        clientName = clientName || user.full_name || user.email || "";
        if (!profName) {
          const cached = profilesCache[otherUserId];
          profName = cached?.business_name || resolvedContactName || "";
        }
      }

      const msgData = {
        conversation_id: selectedConvId,
        sender_id: user.id,
        recipient_id: otherUserId,
        content: newMessage.trim() || (attachments.length ? "📎 Archivo adjunto" : ""),
        professional_name: profName,
        client_name: clientName,
        is_read: false,
        attachments: attachments.length ? attachments : [],
      };

      setNewMessage("");
      setAttachments([]);

      // Optimistic UI: show message instantly before server confirms
      const optimisticId = `optimistic_${Date.now()}`;
      const optimisticMsg = {
        ...msgData,
        id: optimisticId,
        created_date: new Date().toISOString(),
        _optimistic: true,
      };
      setAllMessages(prev => [...prev, optimisticMsg]);
      scrollToBottom(true);

      try {
        await base44.entities.Message.create(msgData);
        await loadMessages();
        scrollToBottom(true);
      } catch (err) {
        // Roll back optimistic message on error
        setAllMessages(prev => prev.filter(m => m.id !== optimisticId));
        throw err;
      }

      // Push + notificación en BD al destinatario
      const senderName = isProfessional
        ? (profName || user.full_name || 'Profesional')
        : (clientName || user.full_name || 'Cliente');
      notifyUser({
        userId: otherUserId,
        type: 'new_message',
        ...pushTemplates.newMessage(senderName, msgData.content),
        url: `https://misautonomos.es/mensajes?conv=${selectedConvId}`,
        data: { type: 'new_message', conversationId: selectedConvId },
      });

      setTimeout(() => textareaRef.current?.focus(), 100);
    } catch (err) {
      toast.error("Error al enviar: " + err.message);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); }
  };

  // ─── File upload ──────────────────────────────────────────────────────────
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

  // ─── Quote (cliente solicita) ─────────────────────────────────────────────
  const handleSendQuote = async () => {
    if (!quoteData.description.trim()) return;
    const otherUserId = currentConv?.otherUserId || selectedOtherUserId;
    if (!otherUserId) return;
    let profName = currentMessages.find(m => m.professional_name)?.professional_name || resolvedContactName;
    let clientName = currentMessages.find(m => m.client_name)?.client_name || user.full_name || user.email;
    await base44.entities.Message.create({
      conversation_id: selectedConvId,
      sender_id: user.id,
      recipient_id: otherUserId,
      content: `📋 Solicitud de presupuesto: ${quoteData.description.substring(0, 60)}...`,
      professional_name: isProfessional ? (user.full_name || "") : profName,
      client_name: !isProfessional ? clientName : "",
      is_read: false,
      quote_request: { description: quoteData.description, budget: quoteData.budget ? parseFloat(quoteData.budget) : undefined, deadline: quoteData.deadline || undefined, status: "pending" }
    });
    await loadMessages();
    setShowQuoteDialog(false);
    setQuoteData({ description: "", budget: "", deadline: "" });
  };

  // ─── Send Quote PDF (profesional envía) ───────────────────────────────────
  const handleSendQuotePDF = async (quoteData) => {
    if (!selectedConvId) return;
    setSendingQuote(true);
    try {
      const otherUserId = currentConv?.otherUserId || selectedOtherUserId;
      if (!otherUserId) throw new Error('Sin destinatario');

      // Generar PDF del presupuesto
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      // Configurar PDF
      doc.setFont('helvetica');
      doc.setFontSize(20);
      doc.text('PRESUPUESTO', 20, 20);
      
      doc.setFontSize(12);
      doc.text(`Título: ${quoteData.title}`, 20, 35);
      doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 20, 45);
      if (quoteData.validUntil) {
        doc.text(`Válido hasta: ${new Date(quoteData.validUntil).toLocaleDateString('es-ES')}`, 20, 55);
      }
      
      doc.text('Descripción del servicio:', 20, 70);
      doc.setFontSize(10);
      const descLines = doc.splitTextToSize(quoteData.description || 'Sin descripción', 170);
      doc.text(descLines, 20, 80);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total: ${quoteData.amount}€`, 20, 120);
      
      // Footer
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Presupuesto enviado vía MisAutónomos', 20, 280);
      
      // Convertir a blob y subir
      const pdfBlob = doc.output('blob');
      const file = new File([pdfBlob], `presupuesto_${Date.now()}.pdf`, { type: 'application/pdf' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Crear mensaje con el PDF
      let profName = "";
      let clientName = "";
      for (const msg of currentMessages) {
        if (!profName && msg.professional_name) profName = msg.professional_name;
        if (!clientName && msg.client_name) clientName = msg.client_name;
        if (profName && clientName) break;
      }

      if (isProfessional) {
        profName = profName || user.full_name || user.email || "";
      } else {
        clientName = clientName || user.full_name || user.email || "";
      }

      await base44.entities.Message.create({
        conversation_id: selectedConvId,
        sender_id: user.id,
        recipient_id: otherUserId,
        content: `📄 Presupuesto: ${quoteData.title} - ${quoteData.amount}€`,
        professional_name: profName,
        client_name: clientName,
        is_read: false,
        attachments: [{
          url: file_url,
          type: 'pdf',
          name: `Presupuesto_${quoteData.title.replace(/\s+/g, '_')}.pdf`,
          size: pdfBlob.size,
          quote_data: quoteData
        }]
      });

      await loadMessages();
      setShowSendQuoteDialog(false);
      toast.success('Presupuesto enviado correctamente');
    } catch (error) {
      console.error('Error sending quote:', error);
      toast.error('Error al enviar presupuesto');
    } finally {
      setSendingQuote(false);
    }
  };

  const handleRespondQuote = async (messageId, response) => {
    const msg = currentMessages.find(m => m.id === messageId);
    if (!msg) return;
    await base44.entities.Message.update(messageId, { quote_request: { ...msg.quote_request, ...response } });
    await loadMessages();
    toast.success("Presupuesto actualizado");
  };

  // ─── Review ───────────────────────────────────────────────────────────────
  const handleSubmitReview = async () => {
    if (!reviewData.rapidez || !reviewData.comunicacion || !reviewData.calidad || !reviewData.precio_satisfaccion) {
      toast.error("Valora todos los aspectos"); return;
    }
    const avg = (reviewData.rapidez + reviewData.comunicacion + reviewData.calidad + reviewData.precio_satisfaccion) / 4;

    // Optimistic UI: close dialog and mark as reviewed immediately
    setExistingReview(true);
    setShowReviewDialog(false);
    setReviewData({ rapidez: 0, comunicacion: 0, calidad: 0, precio_satisfaccion: 0, comment: "" });
    toast.success("¡Valoración publicada!");

    try {
      await base44.entities.Review.create({
        ...reviewData, rating: avg,
        professional_id: selectedOtherUserId,
        client_id: user.id,
        client_name: user.full_name || user.email,
        conversation_id: selectedConvId,
        is_verified: true, is_reported: false
      });
      // Update professional average in background
      base44.entities.Review.filter({ professional_id: selectedOtherUserId }).then(async allReviews => {
        const newAvg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
        const [prof] = await base44.entities.ProfessionalProfile.filter({ user_id: selectedOtherUserId });
        if (prof) await base44.entities.ProfessionalProfile.update(prof.id, { average_rating: newAvg, total_reviews: allReviews.length });
      }).catch(() => {});
      notifyUser({
        userId: selectedOtherUserId,
        type: 'new_review',
        ...pushTemplates.newReview(user.full_name || 'Un cliente', Math.round(avg)),
        data: { type: 'new_review' },
      });
    } catch {
      // Silently fail — toast already shown, review UI already closed
    }
  };

  const canLeaveReview = () => {
    if (!user || user.user_type !== "client" || existingReview) return false;
    return currentMessages.some(m => m.sender_id === user.id) && currentMessages.some(m => m.sender_id === selectedOtherUserId);
  };

  // ─── Navigation ───────────────────────────────────────────────────────────
  const handleSelectConversation = (conv) => {
    setSelectedConvId(conv.conversationId);
    setSelectedOtherUserId(conv.otherUserId);
    window.history.replaceState({}, '', `/messages?conv=${conv.conversationId}`);
  };

  const handleBack = () => {
    setSelectedConvId(null);
    setSelectedOtherUserId(null);
    window.history.replaceState({}, '', '/messages');
  };

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loadingUser) {
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
  const StarRating = ({ value, onChange, label }) => (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button key={star} type="button" onClick={() => onChange(star)}>
            <Star className={`w-7 h-7 transition-colors ${star <= value ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <SEOHead title="Mensajes - MisAutónomos" description="Mensajes y conversaciones" />

      <div className="messages-container flex bg-white overflow-hidden">

        {/* ── Columna izquierda: Lista de conversaciones ── */}
        <div className={`flex-shrink-0 w-full md:w-80 bg-white border-r border-gray-200 flex flex-col min-h-0 ${selectedConvId ? 'hidden md:flex' : 'flex'}`}>
          <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-gray-900 text-base">Mensajes</h2>
              {filteredConversations.length > 0 && (
                <span className="ml-auto text-xs text-gray-400 font-medium">{filteredConversations.length}</span>
              )}
            </div>
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

          <div className="flex-1 overflow-y-auto min-h-0">
            {loadingMessages ? (
              <ConvSkeleton />
            ) : filteredConversations.length === 0 ? (
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
              filteredConversations.map(conv => {
                const isActive = selectedConvId === conv.conversationId;
                const initial = (conv.contactName || "?").charAt(0).toUpperCase();
                return (
                  <button
                    key={conv.conversationId}
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors text-left ${isActive ? 'bg-blue-50 border-l-[3px] border-l-blue-600' : ''}`}
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-blue-600 text-white font-bold text-base">{initial}</AvatarFallback>
                      </Avatar>
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-1">
                        <span className={`text-sm font-semibold truncate ${conv.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                          {conv.contactName}
                        </span>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {formatRelativeTime(conv.lastMessage.created_date)}
                        </span>
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${conv.unreadCount > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                        {conv.lastMessage.sender_id === user?.id && <span className="mr-1">Tú:</span>}
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
        {/* En móvil: ocupa toda la pantalla cuando está abierto. En desktop: columna normal */}
        <div className={`flex-1 flex flex-col bg-gray-50 min-w-0 ${!selectedConvId ? 'hidden md:flex' : 'flex'}`} style={{ minHeight: 0, overflow: 'hidden' }}>
          {selectedConvId ? (
            <>
              {/* Chat Header — Diseño compacto en una línea */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
                {/* Izquierda: avatar + nombre clickable + estado */}
                <div 
                  className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                  onClick={() => professionalSlug && navigate(`/autonomo/${professionalSlug}`)}
                >
                  <Button variant="ghost" size="icon" className="md:hidden h-8 w-8 -ml-2 flex-shrink-0" onClick={(e) => { e.stopPropagation(); handleBack(); }}>
                    <ArrowLeft className="w-4 h-4 text-gray-700" />
                  </Button>

                  <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    {(resolvedContactName || "?").charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold text-gray-900 text-sm truncate ${professionalSlug ? 'hover:text-blue-600 transition-colors' : ''}`}>
                      {resolvedContactName || "..."}
                    </h3>
                    <span className="text-xs text-green-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      En línea
                    </span>
                  </div>
                </div>

                {/* Derecha: teléfono + botones de contacto */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Número visible en desktop */}
                  {professionalPhone && (
                    <span className="text-sm font-medium text-gray-700 hidden md:block select-all">
                      {professionalPhone}
                    </span>
                  )}

                  {/* WhatsApp */}
                  {professionalPhone && professionalHasWhatsapp && (
                    <>
                      {/* Mobile: link abre WhatsApp */}
                      <a
                        href={`https://wa.me/${professionalPhone.replace(/[\s\+\-\(\)]/g,'').replace(/^0{0,2}34/,'').replace(/^(?!34)/,'34')}?text=Hola desde MisAutónomos`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center md:hidden"
                      >
                        <svg viewBox="0 0 24 24" fill="white" width="15" height="15"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      </a>
                      {/* Desktop: solo icono decorativo, sin link */}
                      <div className="w-8 h-8 bg-green-100 rounded-lg hidden md:flex items-center justify-center cursor-default" title="Tiene WhatsApp">
                        <svg viewBox="0 0 24 24" fill="#22c55e" width="15" height="15"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      </div>
                    </>
                  )}

                  {/* Llamada */}
                  {professionalPhone && (
                    <a
                      href={`tel:${professionalPhone}`}
                      className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center md:hidden"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" width="14" height="14"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .9h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.09a16 16 0 006.72 6.72l1.56-1.56a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                    </a>
                  )}

                  {canLeaveReview() && (
                    <Button onClick={() => setShowReviewDialog(true)} size="sm" className="bg-amber-500 hover:bg-amber-600 h-8">
                      <Star className="w-3.5 h-3.5" />
                      <span className="hidden md:inline ml-1 text-xs">Valorar</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Messages — scroll interno, ocupa todo el espacio disponible */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto px-3 md:px-6 py-4 space-y-1"
                style={{ minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
              >
                {currentMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400 text-sm">Escribe el primer mensaje</p>
                  </div>
                ) : (
                  <>
                    {currentMessages.map((msg, idx) => {
                      const isMe = msg.sender_id === user?.id;
                      const prevMsg = currentMessages[idx - 1];
                      const isSameSender = prevMsg && prevMsg.sender_id === msg.sender_id;
                      const isLastInGroup = !currentMessages[idx + 1] || currentMessages[idx + 1].sender_id !== msg.sender_id;

                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isSameSender ? 'mt-0.5' : 'mt-3'}`}>
                          {!isMe && (
                            <div className="w-8 flex-shrink-0 mr-2 self-end">
                              {isLastInGroup ? (
                                <Avatar className="w-7 h-7">
                                  <AvatarFallback className="bg-gray-200 text-gray-600 text-xs font-bold">
                                    {(resolvedContactName || "?").charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              ) : <div className="w-7" />}
                            </div>
                          )}

                          <div className={`max-w-[75%] md:max-w-[60%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            {msg.quote_request && (
                              <QuoteRequest
                                quote={msg.quote_request}
                                isProfessional={msg.sender_id !== user?.id && user?.user_type === "professionnel"}
                                isClient={msg.sender_id === user?.id || user?.user_type === "client"}
                                onRespond={res => handleRespondQuote(msg.id, res)}
                                onStatusChange={res => handleRespondQuote(msg.id, res)}
                              />
                            )}

                            {/* Attachments: audio sin burbuja de texto, otros con FileAttachment */}
                            {msg.attachments?.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-1">
                                {msg.attachments.map((f, i) =>
                                  f.type === 'audio' ? (
                                    <AudioBubble key={i} attachment={f} isMe={msg.sender_id === user?.id} />
                                  ) : (
                                    <FileAttachment key={i} file={f} />
                                  )
                                )}
                              </div>
                            )}

                            {/* Burbuja de texto: no mostrar si el mensaje es solo audio */}
                            {!(msg.attachments?.length > 0 && msg.attachments[0]?.type === 'audio' && !msg.content) && (
                              <div className={`relative px-4 py-2.5 shadow-sm ${
                                isMe
                                  ? 'bg-blue-600 text-white rounded-[18px] rounded-br-[4px]'
                                  : 'bg-white text-gray-900 border border-gray-100 rounded-[18px] rounded-bl-[4px]'
                              }`}>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                                <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                  <span className={`text-[10px] ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                    {format(new Date(msg.created_date), "HH:mm")}
                                  </span>
                                  {isMe && (
                                    msg.is_read
                                      ? <CheckCheck className="w-3 h-3 text-blue-200" />
                                      : <Check className="w-3 h-3 text-blue-300" />
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input — fijo abajo, nunca se oculta por el teclado */}
              <div
                className="bg-white border-t border-gray-200 flex-shrink-0"
                style={{ 
                  padding: '8px 12px', 
                  paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))',
                  flexShrink: 0
                }}
              >
                {showAIAssistant && isProfessional && (
                  <div className="mb-2">
                    <AIAssistantPro
                      type="message"
                      context={{
                        clientName: resolvedContactName,
                        clientMessage: currentMessages[currentMessages.length - 1]?.content || "",
                        professionalName: user?.full_name || "",
                        service: "Servicio profesional"
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
                    <>
                      <Button type="button" variant="ghost" size="icon"
                        className="h-10 w-10 rounded-xl flex-shrink-0 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowSendQuoteDialog(true)}>
                        <FileText className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon"
                        className={`h-10 w-10 rounded-xl flex-shrink-0 ${showAIAssistant ? 'bg-purple-100 text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setShowAIAssistant(p => !p)}>
                        <Sparkles className="w-4 h-4" />
                      </Button>
                    </>
                  )}

                  <Button type="button" variant="ghost" size="icon"
                    className="h-10 w-10 rounded-xl flex-shrink-0 text-gray-500 hover:text-gray-700"
                    onClick={() => fileInputRef.current?.click()} disabled={uploadingFile}
                    aria-label="Adjuntar archivo">
                    {uploadingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                  </Button>

                  {!isProfessional && (
                    <Button type="button" variant="ghost" size="icon"
                      className="h-10 w-10 rounded-xl flex-shrink-0 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowQuoteDialog(true)}>
                      <FileText className="w-4 h-4" />
                    </Button>
                  )}

                  {isRecording ? (
                    <Button type="button"
                      onMouseUp={stopRecording} onTouchEnd={stopRecording}
                      className="h-10 w-10 bg-red-500 rounded-full flex items-center justify-center text-white animate-pulse flex-shrink-0 text-xs font-semibold"
                      aria-label={`Detener grabación - ${recordingSeconds} segundos`}>
                      ⏹ {recordingSeconds}s
                    </Button>
                  ) : (
                    <Button type="button"
                      onMouseDown={startRecording} onTouchStart={startRecording}
                      className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 flex-shrink-0"
                      aria-label="Grabar mensaje de voz">
                      🎤
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
                    disabled={sending}
                  />

                  <Button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={(!newMessage.trim() && !attachments.length) || sending}
                    className="h-10 w-10 rounded-xl flex-shrink-0 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 p-0"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
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

      {/* ── Send Quote PDF Dialog (Profesional) ── */}
      <SendQuoteDialog
        open={showSendQuoteDialog}
        onOpenChange={setShowSendQuoteDialog}
        onSendQuote={handleSendQuotePDF}
        loading={sendingQuote}
      />

      {/* ── Quote Request Dialog (Cliente) ── */}
      <Dialog open={showQuoteDialog} onOpenChange={setShowQuoteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitar presupuesto</DialogTitle>
            <DialogDescription>Envía una solicitud al profesional</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Descripción del trabajo *</label>
              <Textarea value={quoteData.description} onChange={e => setQuoteData(p => ({ ...p, description: e.target.value }))} placeholder="Describe qué necesitas..." rows={4} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Presupuesto estimado (€)</label>
              <Input type="number" value={quoteData.budget} onChange={e => setQuoteData(p => ({ ...p, budget: e.target.value }))} placeholder="Ej: 500" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Fecha límite</label>
              <Input type="date" value={quoteData.deadline} onChange={e => setQuoteData(p => ({ ...p, deadline: e.target.value }))} />
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
              Valorar a {resolvedContactName}
            </DialogTitle>
            <DialogDescription>Tu opinión ayuda a otros clientes</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-3">
            <StarRating label="Rapidez" value={reviewData.rapidez} onChange={v => setReviewData(p => ({ ...p, rapidez: v }))} />
            <StarRating label="Comunicación" value={reviewData.comunicacion} onChange={v => setReviewData(p => ({ ...p, comunicacion: v }))} />
            <StarRating label="Calidad del trabajo" value={reviewData.calidad} onChange={v => setReviewData(p => ({ ...p, calidad: v }))} />
            <StarRating label="Relación calidad/precio" value={reviewData.precio_satisfaccion} onChange={v => setReviewData(p => ({ ...p, precio_satisfaccion: v }))} />
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Comentario (opcional)</Label>
              <Textarea value={reviewData.comment} onChange={e => setReviewData(p => ({ ...p, comment: e.target.value }))} placeholder="Cuéntanos tu experiencia..." className="h-28 resize-none" maxLength={500} />
              <p className="text-xs text-gray-400 text-right">{reviewData.comment.length}/500</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>Cancelar</Button>
            <Button onClick={handleSubmitReview} className="bg-amber-500 hover:bg-amber-600">
              <Star className="w-4 h-4 mr-2" />
              Publicar valoración
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
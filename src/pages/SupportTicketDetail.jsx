import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader, ArrowLeft, Headphones, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/components/ui/LanguageSwitcher';
import { formatDistanceToNow } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

const STATUS_CONFIG = {
  abierto: { label: 'Tu consulta está en cola', color: 'text-blue-600' },
  en_progreso: { label: 'Un agente está revisando tu caso', color: 'text-yellow-600' },
  resuelto: { label: 'Ticket resuelto', color: 'text-green-600' },
  cerrado: { label: 'Ticket cerrado', color: 'text-gray-600' }
};

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.abierto;
  return <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>;
}

export default function SupportTicketDetail() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [user, setUser] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (!currentUser) {
          navigate('/registro-cliente');
          return;
        }
        setUser(currentUser);

        // Cargar ticket
        const ticketData = await base44.entities.Ticket.filter({ id: ticketId });
        if (!ticketData.length || ticketData[0].creator_id !== currentUser.id) {
          navigate('/soporte');
          return;
        }
        setTicket(ticketData[0]);

        // Cargar mensajes
        const ticketMessages = await base44.entities.TicketMessage.filter({
          ticket_id: ticketId
        });
        setMessages(ticketMessages.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
      } catch (err) {
        setError(err.message || 'Error loading ticket');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [ticketId, navigate]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSending(true);
    setError('');

    try {
      // Crear mensaje
      const newMessage = await base44.entities.TicketMessage.create({
        ticket_id: ticket.id,
        sender_id: user.id,
        sender_name: user.full_name,
        sender_type: user.user_type,
        content: replyText
      });

      // Actualizar last_activity del ticket
      await base44.entities.Ticket.update(ticket.id, {
        last_activity: new Date().toISOString()
      });

      // Registrar evento
      await base44.entities.TicketEvent.create({
        ticket_id: ticket.id,
        event_type: 'message_added',
        user_id: user.id,
        user_name: user.full_name,
        description: `${user.full_name} añadió un mensaje`
      });

      // Actualizar UI
      setMessages([...messages, newMessage]);
      setReplyText('');
      
      // Actualizar ticket
      setTicket({ ...ticket, last_activity: new Date().toISOString() });
    } catch (err) {
      setError(err.message || 'Error sending reply');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Ticket no encontrado</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => navigate('/soporte')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
          <Headphones className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{t('supportChat.supportMisautonomos') || 'MisAutónomos Support'}</p>
          <p className="text-xs text-gray-500">
            <StatusBadge status={ticket.status} />
          </p>
        </div>
      </div>

      {/* Info del ticket */}
      <div className="bg-blue-50 border-b border-blue-100 px-4 py-3 flex-shrink-0">
        <p className="text-xs text-blue-900 font-mono">{ticket.ticket_number}</p>
        <p className="text-sm font-semibold text-gray-900 mt-0.5">{ticket.title}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Creado el {new Date(ticket.created_date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')}
        </p>
      </div>

      {error && (
        <div className="flex gap-3 p-4 bg-red-50 border-b border-red-200">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => {
          const isFromSupport = msg.sender_type === 'admin';
          const isFromMe = msg.sender_id === user.id;

          return (
            <div key={msg.id} className={`flex gap-2 ${isFromMe ? 'flex-row-reverse' : ''}`}>
              {!isFromMe && (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <Headphones className="w-4 h-4 text-white" />
                </div>
              )}
              <div className={`max-w-[75%] flex flex-col ${isFromMe ? 'items-end' : 'items-start'}`}>
                {!isFromMe && (
                  <span className="text-xs text-gray-500 mb-0.5 ml-2">
                    {t('supportChat.supportMisautonomos') || 'MisAutónomos Support'}
                  </span>
                )}
                <div
                  className={`px-3 py-2 rounded-2xl text-sm ${
                    isFromMe
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {msg.content}
                </div>
                <span className={`text-[10px] text-gray-400 mt-0.5 ${isFromMe ? 'mr-2' : 'ml-2'}`}>
                  {formatDistanceToNow(new Date(msg.created_date), {
                    addSuffix: true,
                    locale: language === 'es' ? es : enUS
                  })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      {ticket.status !== 'cerrado' && (
        <form
          onSubmit={handleSendReply}
          className="border-t border-gray-100 p-4 bg-white flex-shrink-0 flex gap-2"
        >
          <Input
            type="text"
            placeholder={t('supportChat.typeYourReply') || 'Type your reply...'}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            disabled={sending}
            className="flex-1 rounded-full"
          />
          <Button
            type="submit"
            disabled={sending || !replyText.trim()}
            className="bg-gray-900 hover:bg-gray-800 text-white rounded-full px-6"
          >
            {sending ? <Loader className="w-4 h-4 animate-spin" /> : 'Enviar'}
          </Button>
        </form>
      )}
    </div>
  );
}
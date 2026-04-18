import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { SUPPORT_USER_ID, SUPPORT_DISPLAY_NAME } from '@/config/support';
import { ArrowLeft, Send, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLanguage } from '@/components/ui/LanguageSwitcher';

export default function AdminSupport() {
  const { t } = useLanguage();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Cargar conversaciones de soporte
  const loadSupportConversations = useCallback(async () => {
    try {
      setLoading(true);
      const [sent, received] = await Promise.all([
        base44.entities.Message.filter({ sender_id: SUPPORT_USER_ID }, '-created_date', 500),
        base44.entities.Message.filter({ recipient_id: SUPPORT_USER_ID }, '-created_date', 500),
      ]);

      // Agrupar por conversation_id → último mensaje
      const map = {};
      for (const msg of [...sent, ...received]) {
        if (!map[msg.conversation_id] || new Date(msg.created_date) > new Date(map[msg.conversation_id].created_date)) {
          map[msg.conversation_id] = msg;
        }
      }

      // Ordenar: no leídos primero, luego por fecha descendente
      const list = Object.values(map).sort((a, b) => {
        const aUnread = a.recipient_id === SUPPORT_USER_ID && !a.is_read;
        const bUnread = b.recipient_id === SUPPORT_USER_ID && !b.is_read;
        if (aUnread && !bUnread) return -1;
        if (!aUnread && bUnread) return 1;
        return new Date(b.created_date) - new Date(a.created_date);
      });

      setConversations(list);
      setLoading(false);
    } catch (error) {
      console.error('Error cargando conversaciones:', error);
      setLoading(false);
    }
  }, []);

  // Cargar mensajes de conversación activa
  const loadConversationMessages = useCallback(async (convId) => {
    try {
      const msgs = await base44.entities.Message.filter(
        { conversation_id: convId },
        'created_date',
        500
      );
      setMessages(msgs);

      // Marcar como leídos los mensajes que yo (admin) recibí
      const unreadMsgs = msgs.filter(m => m.recipient_id === SUPPORT_USER_ID && !m.is_read);
      for (const msg of unreadMsgs) {
        await base44.entities.Message.update(msg.id, { is_read: true });
      }
    } catch (error) {
      console.error('Error cargando mensajes:', error);
    }
  }, []);

  useEffect(() => {
    loadSupportConversations();
    const interval = setInterval(loadSupportConversations, 5000);
    return () => clearInterval(interval);
  }, [loadSupportConversations]);

  useEffect(() => {
    if (activeConv) {
      loadConversationMessages(activeConv.conversation_id);
      const interval = setInterval(() => loadConversationMessages(activeConv.conversation_id), 3000);
      return () => clearInterval(interval);
    }
  }, [activeConv, loadConversationMessages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeConv) return;

    try {
      await base44.entities.Message.create({
        conversation_id: activeConv.conversation_id,
        sender_id: SUPPORT_USER_ID,
        recipient_id: activeConv.sender_id === SUPPORT_USER_ID ? activeConv.recipient_id : activeConv.sender_id,
        content: messageInput.trim(),
        professional_name: SUPPORT_DISPLAY_NAME,
        client_name: activeConv.client_name,
        is_read: false,
        attachments: [],
      });

      setMessageInput('');
      await loadConversationMessages(activeConv.conversation_id);
    } catch (error) {
      console.error('Error enviando mensaje:', error);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center h-96">Cargando...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 h-[calc(100vh-120px)] bg-white rounded-lg overflow-hidden shadow">
      {/* Columna izquierda: lista de conversaciones */}
      <div className="border-r border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <h1 className="text-lg font-semibold text-gray-900">Bandeja de Soporte</h1>
          <p className="text-xs text-gray-500 mt-1">{filteredConversations.length} conversaciones</p>
        </div>

        <div className="px-3 py-2 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 py-1.5 text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
              No hay conversaciones
            </div>
          ) : (
            filteredConversations.map(conv => {
              const otherUserId = conv.sender_id === SUPPORT_USER_ID ? conv.recipient_id : conv.sender_id;
              const isUnread = conv.recipient_id === SUPPORT_USER_ID && !conv.is_read;

              return (
                <button
                  key={conv.conversation_id}
                  onClick={() => setActiveConv(conv)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                    isUnread ? 'bg-blue-50/40' : ''
                  } ${activeConv?.conversation_id === conv.conversation_id ? 'bg-gray-100' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 text-sm truncate">{conv.client_name}</span>
                    {isUnread && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{conv.content}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {new Date(conv.created_date).toLocaleString('es-ES')}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Columna derecha: chat activo */}
      <div className="md:col-span-2 flex flex-col hidden md:flex">
        {activeConv ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4 bg-gradient-to-r from-blue-50 to-transparent">
              <Avatar className="w-10 h-10 border-2 border-blue-200">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-white">
                  {activeConv.client_name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{activeConv.client_name}</p>
                <p className="text-xs text-gray-500">Respondiendo ahora...</p>
              </div>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(msg => {
                const isFromAdmin = msg.sender_id === SUPPORT_USER_ID;
                return (
                  <div key={msg.id} className={`flex ${isFromAdmin ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        isFromAdmin
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-xs mt-1 ${isFromAdmin ? 'text-blue-100' : 'text-gray-500'}`}>
                        {new Date(msg.created_date).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input */}
            <div className="border-t border-gray-100 px-4 py-3">
              <form onSubmit={sendMessage} className="flex gap-2">
                <Input
                  placeholder="Escribe tu respuesta..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="flex-1 text-sm"
                />
                <Button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Selecciona una conversación para responder
          </div>
        )}
      </div>

      {/* Vista mobile */}
      <div className="md:hidden flex flex-col">
        {activeConv ? (
          <>
            <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
              <button
                onClick={() => setActiveConv(null)}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Avatar className="w-8 h-8 border-2 border-blue-200">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-white text-xs">
                  {activeConv.client_name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{activeConv.client_name}</p>
                <p className="text-xs text-gray-500">Chat de soporte</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.map(msg => {
                const isFromAdmin = msg.sender_id === SUPPORT_USER_ID;
                return (
                  <div key={msg.id} className={`flex ${isFromAdmin ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-xs px-3 py-1.5 rounded-lg text-sm ${
                        isFromAdmin
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p>{msg.content}</p>
                      <p className={`text-xs mt-0.5 ${isFromAdmin ? 'text-blue-100' : 'text-gray-500'}`}>
                        {new Date(msg.created_date).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-gray-100 px-3 py-2">
              <form onSubmit={sendMessage} className="flex gap-2">
                <Input
                  placeholder="Responder..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="flex-1 text-sm h-9"
                />
                <Button
                  type="submit"
                  disabled={!messageInput.trim()}
                  size="icon"
                  className="bg-blue-600 hover:bg-blue-700 h-9 w-9"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto">
              {/* misma lista que desktop */}
              {filteredConversations.map(conv => {
                const isUnread = conv.recipient_id === SUPPORT_USER_ID && !conv.is_read;
                return (
                  <button
                    key={conv.conversation_id}
                    onClick={() => setActiveConv(conv)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 ${
                      isUnread ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 text-sm truncate">{conv.client_name}</span>
                      {isUnread && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{conv.content}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
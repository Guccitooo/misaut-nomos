
import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Send, MessageSquare, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale"; // This import is no longer strictly needed if `fr` locale is removed from `format` calls, but we'll keep it for now as it's part of the original file structure and not explicitly removed.

export default function MessagesPage() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const initialConversation = urlParams.get('conversation');
  const initialProfessional = urlParams.get('professional');

  const [user, setUser] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(initialConversation);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState(initialProfessional);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

  const { data: allMessages = [], isLoading } = useQuery({
    queryKey: ['messages', user?.id],
    queryFn: async () => {
      const sent = await base44.entities.Message.filter({ sender_id: user.id }, '-created_date');
      const received = await base44.entities.Message.filter({ recipient_id: user.id }, '-created_date');
      return [...sent, ...received].sort((a, b) => 
        new Date(b.created_date) - new Date(a.created_date)
      );
    },
    enabled: !!user,
    initialData: [],
    refetchInterval: 5000,
  });

  // Group messages by conversation
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

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      return base44.entities.Message.create(messageData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setNewMessage("");
      setTimeout(scrollToBottom, 100);
    },
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
      await base44.entities.Message.update(msg.id, { is_read: true });
    }
    
    if (unreadMessages.length > 0) {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    const otherUserId = selectedProfessionalId || 
      conversations[selectedConversation]?.otherUserId;
    
    // Ensure recipientUser is an array before accessing [0]
    const recipientUsers = await base44.entities.User.filter({ id: otherUserId });
    const recipientUser = recipientUsers.length > 0 ? recipientUsers[0] : null;

    // Ensure currentProfile is an array before accessing [0]
    const currentProfiles = user.user_type === "professionnel" ? 
      await base44.entities.ProfessionalProfile.filter({ user_id: user.id }) : null;
    const currentProfile = currentProfiles && currentProfiles.length > 0 ? currentProfiles[0] : null;

    sendMessageMutation.mutate({
      conversation_id: selectedConversation,
      sender_id: user.id,
      recipient_id: otherUserId,
      content: newMessage,
      professional_name: user.user_type === "professionnel" ? 
        currentProfile?.business_name : 
        conversations[selectedConversation]?.otherUserName, // This logic assumes `otherUserName` is set correctly for the client side.
                                                         // A more robust solution might fetch the recipient's name directly from their profile.
      client_name: user.user_type === "client" ? 
        user.full_name || user.email : 
        recipientUser?.full_name || recipientUser?.email,
      is_read: false
    });
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation.conversationId);
    setSelectedProfessionalId(conversation.otherUserId);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-red-700" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-red-50 flex flex-col">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Mensajería</h1>
        <p className="text-gray-600">Comunícate con tus contactos</p>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Conversations List */}
        <div className="w-full md:w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-red-700" />
              Conversaciones
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-red-700" />
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
                  className={`p-4 cursor-pointer hover:bg-red-50 transition-colors border-b border-gray-100 ${
                    selectedConversation === conv.conversationId ? 'bg-red-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-red-100 text-red-900">
                        {conv.otherUserName?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-gray-900 truncate">
                          {conv.otherUserName || "Usuario"}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="bg-yellow-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {conv.lastMessage.content}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {format(new Date(conv.lastMessage.created_date), "d MMM")}
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
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-red-700 text-white">
                      {conversations[selectedConversation]?.otherUserName?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {conversations[selectedConversation]?.otherUserName || "Usuario"}
                    </p>
                    <p className="text-sm text-gray-500">En línea</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {currentMessages.map((message) => {
                  const isMe = message.sender_id === user.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                          isMe
                            ? 'bg-red-700 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p className="leading-relaxed">{message.content}</p>
                        <p className={`text-xs mt-1 ${isMe ? 'text-red-200' : 'text-gray-400'}`}>
                          {format(new Date(message.created_date), "HH:mm")}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="bg-white border-t border-gray-200 p-4">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe tu mensaje..."
                    className="flex-1 h-12"
                  />
                  <Button
                    type="submit"
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    className="h-12 bg-red-700 hover:bg-red-800"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </form>
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
    </div>
  );
}

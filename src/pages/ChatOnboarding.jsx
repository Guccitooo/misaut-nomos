import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Bot, User, Loader2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ReactMarkdown from "react-markdown";

export default function ChatOnboardingPage() {
  const navigate = useNavigate();
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    initConversation();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
      setMessages(data.messages || []);
    });

    return () => {
      unsubscribe();
    };
  }, [conversationId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const initConversation = async () => {
    try {
      const conversation = await base44.agents.createConversation({
        agent_name: "onboarding_assistant",
        metadata: {
          name: "Registro de nuevo usuario",
          description: "Proceso de onboarding guiado"
        }
      });

      setConversationId(conversation.id);
      setMessages(conversation.messages || []);
      setIsLoading(false);

      // Send initial message to trigger the agent
      await base44.agents.addMessage(conversation, {
        role: "user",
        content: "Hola, quiero suscribirme"
      });
    } catch (error) {
      console.error("Error creating conversation:", error);
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId || isSending) return;

    setIsSending(true);
    const messageContent = newMessage;
    setNewMessage("");

    try {
      const conversation = { id: conversationId, messages };
      await base44.agents.addMessage(conversation, {
        role: "user",
        content: messageContent
      });
    } catch (error) {
      console.error("Error sending message:", error);
      setNewMessage(messageContent);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl("Search"))}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-white">Asistente de Registro</CardTitle>
                  <p className="text-sm text-blue-100">
                    Te guiaré paso a paso para crear tu cuenta
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Chat Messages */}
        <Card className="border-0 shadow-2xl mb-4">
          <CardContent className="p-6">
            <div className="space-y-6 max-h-[60vh] overflow-y-auto">
              {messages
                .filter(msg => msg.role !== "system")
                .map((message, idx) => {
                  const isUser = message.role === "user";
                  return (
                    <div
                      key={idx}
                      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      {!isUser && (
                        <Avatar className="w-8 h-8 mt-1">
                          <AvatarFallback className="bg-blue-100 text-blue-900">
                            <Bot className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className={`max-w-[80%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
                        <div
                          className={`rounded-2xl px-4 py-3 ${
                            isUser
                              ? "bg-blue-600 text-white"
                              : "bg-white border border-gray-200"
                          }`}
                        >
                          {isUser ? (
                            <p className="text-sm leading-relaxed">{message.content}</p>
                          ) : (
                            <ReactMarkdown 
                              className="text-sm prose prose-sm prose-slate max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                              components={{
                                p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
                                ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
                                ol: ({ children }) => <ol className="my-1 ml-4 list-decimal">{children}</ol>,
                                li: ({ children }) => <li className="my-0.5">{children}</li>,
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          )}
                        </div>
                      </div>
                      {isUser && (
                        <Avatar className="w-8 h-8 mt-1">
                          <AvatarFallback className="bg-gray-200 text-gray-600">
                            <User className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  );
                })}
              {isSending && (
                <div className="flex gap-3 justify-start">
                  <Avatar className="w-8 h-8 mt-1">
                    <AvatarFallback className="bg-blue-100 text-blue-900">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
        </Card>

        {/* Message Input */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe tu respuesta..."
                className="flex-1 h-12"
                disabled={isSending}
              />
              <Button
                type="submit"
                disabled={!newMessage.trim() || isSending}
                className="h-12 bg-blue-600 hover:bg-blue-700"
              >
                {isSending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Help Text */}
        <p className="text-center text-gray-500 text-sm mt-4">
          El asistente te guiará paso a paso. Responde con naturalidad.
        </p>
      </div>
    </div>
  );
}
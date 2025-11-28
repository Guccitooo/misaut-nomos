import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  X, 
  Sparkles,
  MapPin,
  Star,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ReactMarkdown from 'react-markdown';

export default function AIAssistantChat({ isOpen, onClose, initialQuery = '' }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [suggestedProfessionals, setSuggestedProfessionals] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && !conversation) {
      initializeConversation();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const initializeConversation = async () => {
    try {
      const conv = await base44.agents.createConversation({
        agent_name: 'clientAssistant',
        metadata: {
          name: 'Asistente IA',
          started_at: new Date().toISOString()
        }
      });
      setConversation(conv);
      
      // Mensaje de bienvenida
      setMessages([{
        role: 'assistant',
        content: '¡Hola! 👋 Soy el asistente de MisAutónomos. Puedo ayudarte a:\n\n• Encontrar profesionales en tu zona\n• Responder preguntas sobre servicios\n• Conectarte con el especialista adecuado\n\n¿Qué necesitas hoy?'
      }]);
    } catch (error) {
      console.error('Error initializing conversation:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading || !conversation) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Suscribirse a actualizaciones
      const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
        if (data.messages && data.messages.length > 0) {
          const lastMsg = data.messages[data.messages.length - 1];
          if (lastMsg.role === 'assistant') {
            setMessages(prev => {
              const withoutLoading = prev.filter(m => !m.isLoading);
              const exists = withoutLoading.some(m => 
                m.role === 'assistant' && m.content === lastMsg.content
              );
              if (!exists) {
                return [...withoutLoading, lastMsg];
              }
              return withoutLoading;
            });
          }
        }
      });

      // Añadir mensaje del usuario
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: userMessage
      });

      // Buscar profesionales relevantes basado en la consulta
      await searchRelevantProfessionals(userMessage);

      setTimeout(() => {
        unsubscribe();
        setIsLoading(false);
      }, 10000);

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Lo siento, hubo un error procesando tu mensaje. ¿Puedes intentarlo de nuevo?'
      }]);
      setIsLoading(false);
    }
  };

  const searchRelevantProfessionals = async (query) => {
    try {
      // Usar LLM para extraer categoría y ubicación de la consulta
      const extraction = await base44.integrations.Core.InvokeLLM({
        prompt: `Extrae la categoría de servicio y ubicación de esta consulta de cliente: "${query}"
        
        Categorías disponibles: Electricista, Fontanero, Carpintero, Albañil / Reformas, Pintor, Jardinero, Transportista, Autónomo de limpieza, Cerrajero, Instalador de aire acondicionado, Mantenimiento general, Asesoría o gestoría, Empresa multiservicios, Otro tipo de servicio profesional
        
        Responde SOLO con el JSON, sin texto adicional.`,
        response_json_schema: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            location: { type: 'string' },
            urgency: { type: 'string', enum: ['alta', 'media', 'baja'] }
          }
        }
      });

      if (extraction.category) {
        const profiles = await base44.entities.ProfessionalProfile.filter({
          visible_en_busqueda: true
        });

        // Filtrar por categoría y ubicación
        const filtered = profiles.filter(p => {
          const categoryMatch = p.categories?.some(c => 
            c.toLowerCase().includes(extraction.category.toLowerCase()) ||
            extraction.category.toLowerCase().includes(c.toLowerCase())
          );
          const locationMatch = !extraction.location || 
            p.provincia?.toLowerCase().includes(extraction.location.toLowerCase()) ||
            p.ciudad?.toLowerCase().includes(extraction.location.toLowerCase());
          return categoryMatch && locationMatch;
        }).slice(0, 3);

        setSuggestedProfessionals(filtered);
      }
    } catch (error) {
      console.error('Error searching professionals:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 md:p-6 pointer-events-none">
      <Card className="w-full max-w-md h-[600px] max-h-[80vh] flex flex-col shadow-2xl pointer-events-auto animate-in slide-in-from-bottom-4 duration-300">
        <CardHeader className="flex-shrink-0 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Asistente IA</CardTitle>
                <p className="text-xs text-blue-100">MisAutónomos</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown className="text-sm prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
                </div>
                {msg.role === 'user' && (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className="bg-gray-200">
                      <User className="w-4 h-4 text-gray-600" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Profesionales sugeridos */}
            {suggestedProfessionals.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-xs text-gray-500 font-medium">Profesionales recomendados:</p>
                {suggestedProfessionals.map((pro) => (
                  <Link 
                    key={pro.id} 
                    to={createPageUrl(`Autonomo?slug=${pro.slug_publico || pro.id}`)}
                    className="block"
                  >
                    <div className="bg-white border rounded-xl p-3 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                            {pro.business_name?.[0] || 'P'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">
                            {pro.business_name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <MapPin className="w-3 h-3" />
                            <span>{pro.ciudad}, {pro.provincia}</span>
                          </div>
                          {pro.average_rating > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs text-gray-600">
                                {pro.average_rating.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="flex-shrink-0 p-4 border-t bg-gray-50">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu mensaje..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button 
              onClick={sendMessage} 
              disabled={!inputValue.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">
            Powered by AI • MisAutónomos
          </p>
        </div>
      </Card>
    </div>
  );
}
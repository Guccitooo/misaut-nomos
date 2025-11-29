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

export default function AIAssistantChat({ isOpen, onClose, initialQuery = '', browsingContext = {}, initialProactiveMessage = null }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [suggestedProfessionals, setSuggestedProfessionals] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Cargar búsquedas guardadas
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ai_saved_searches');
      if (saved) setSavedSearches(JSON.parse(saved));
    } catch (e) {}
  }, []);

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

  // Generar mensaje de bienvenida personalizado basado en contexto
  const getPersonalizedWelcome = () => {
    const { currentPage, searchQuery, category, viewedProfiles, searchHistory } = browsingContext;
    
    // Si viene de ver perfiles, sugerir guardarlo
    if (viewedProfiles?.length >= 2) {
      return `¡Hola! 👋 Veo que has estado explorando profesionales. ¿Quieres que te ayude a:\n\n• Comparar los perfiles que has visto\n• Encontrar más opciones similares\n• Guardar tus criterios de búsqueda favoritos\n\n¿En qué puedo ayudarte?`;
    }
    
    // Si tiene búsquedas recientes
    if (searchHistory?.length > 0) {
      const lastSearch = searchHistory[searchHistory.length - 1];
      return `¡Hola! 👋 Veo que buscaste "${lastSearch.query || lastSearch.category}". ¿Encontraste lo que necesitabas?\n\nPuedo ayudarte a:\n• Refinar la búsqueda\n• Encontrar más opciones\n• Guardar estos criterios para futuras búsquedas`;
    }
    
    // Si está en una categoría específica
    if (category) {
      return `¡Hola! 👋 Veo que estás buscando servicios de ${category}. ¿Necesitas ayuda para:\n\n• Encontrar profesionales específicos\n• Comparar opciones\n• Saber qué preguntar a un profesional\n\n¿Cómo puedo ayudarte?`;
    }
    
    // Mensaje por defecto
    return '¡Hola! 👋 Soy el asistente de MisAutónomos. Puedo ayudarte a:\n\n• Encontrar profesionales en tu zona\n• Responder preguntas sobre servicios\n• Guardar tus búsquedas favoritas\n\n¿Qué necesitas hoy?';
  };

  const initializeConversation = async () => {
    try {
      const conv = await base44.agents.createConversation({
        agent_name: 'clientAssistant',
        metadata: {
          name: 'Asistente IA',
          started_at: new Date().toISOString(),
          browsingContext: browsingContext
        }
      });
      setConversation(conv);
      
      // Mensaje de bienvenida personalizado
      const welcomeMessage = getPersonalizedWelcome();
      setMessages([{
        role: 'assistant',
        content: welcomeMessage,
        isWelcome: true
      }]);

      // Si hay un mensaje proactivo pendiente, añadirlo
      if (initialProactiveMessage) {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: initialProactiveMessage,
            isProactive: true
          }]);
        }, 1500);
      }
    } catch (error) {
      console.error('Error initializing conversation:', error);
    }
  };

  // Guardar búsqueda
  const saveSearch = (searchCriteria) => {
    const newSaved = [...savedSearches, {
      ...searchCriteria,
      id: Date.now(),
      savedAt: new Date().toISOString()
    }].slice(-5); // Máximo 5 búsquedas guardadas
    
    setSavedSearches(newSaved);
    localStorage.setItem('ai_saved_searches', JSON.stringify(newSaved));
    setShowSavePrompt(false);
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading || !conversation) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    
    // Guardar mensajes actuales y añadir el del usuario
    const currentMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(currentMessages);
    setIsLoading(true);

    try {
      // Suscribirse a actualizaciones - solo mostrar el mensaje final
      const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
        if (data.messages && data.messages.length > 0) {
          // Encontrar el último mensaje del asistente
          const assistantMessages = data.messages.filter(m => m.role === 'assistant');
          if (assistantMessages.length > 0) {
            const lastAssistantMsg = assistantMessages[assistantMessages.length - 1];
            
            // Solo actualizar si el contenido ha cambiado
            setMessages(prev => {
              // Mantener todos los mensajes de usuario y el mensaje de bienvenida
              const baseMessages = prev.filter(m => m.role === 'user' || m.isWelcome);
              
              // Añadir solo el último mensaje del asistente (reemplazando cualquier anterior de esta respuesta)
              const lastAssistantInPrev = prev.filter(m => m.role === 'assistant' && !m.isWelcome);
              
              // Si es el mismo mensaje parcial, actualizar; si no, reemplazar
              if (lastAssistantInPrev.length === 0 || 
                  lastAssistantMsg.content.length > (lastAssistantInPrev[lastAssistantInPrev.length - 1]?.content?.length || 0)) {
                return [...baseMessages, lastAssistantMsg];
              }
              return prev;
            });
          }
        }
      });

      // Añadir mensaje del usuario al agente
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: userMessage
      });

      // Buscar profesionales relevantes basado en la consulta
      await searchRelevantProfessionals(userMessage);

      // Dar tiempo para que el agente responda completamente
      setTimeout(() => {
        unsubscribe();
        setIsLoading(false);
      }, 12000);

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

        const searchLocation = extraction.location?.toLowerCase() || '';
        
        // Filtrar por categoría
        const categoryMatches = profiles.filter(p => {
          return p.categories?.some(c => 
            c.toLowerCase().includes(extraction.category.toLowerCase()) ||
            extraction.category.toLowerCase().includes(c.toLowerCase())
          );
        });

        // Primero buscar coincidencia exacta en ciudad/provincia
        let filtered = categoryMatches.filter(p => {
          if (!searchLocation) return true;
          return p.ciudad?.toLowerCase().includes(searchLocation) ||
                 p.provincia?.toLowerCase().includes(searchLocation) ||
                 p.municipio?.toLowerCase().includes(searchLocation) ||
                 p.service_area?.toLowerCase().includes(searchLocation);
        });

        // Si no hay resultados exactos, buscar por provincia completa
        if (filtered.length === 0 && searchLocation) {
          filtered = categoryMatches.filter(p => {
            return p.provincia?.toLowerCase().includes(searchLocation);
          });
        }

        // Si aún no hay resultados, mostrar todos de la categoría
        if (filtered.length === 0) {
          filtered = categoryMatches;
        }

        setSuggestedProfessionals(filtered.slice(0, 3));
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
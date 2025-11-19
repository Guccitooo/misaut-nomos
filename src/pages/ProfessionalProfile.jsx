import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Euro,
  Globe,
  Heart,
  MessageSquare,
  Phone,
  MessageCircle,
  Facebook,
  Instagram,
  Linkedin,
  Star,
  Award,
  Loader2,
  AlertCircle,
  X,
  Music,
  Copy,
  Check,
  Eye,
  Search,
  MousePointerClick,
  ArrowLeft,
  Briefcase
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import ReviewSection from "../components/profile/ReviewSection";
import SEOHead from "../components/seo/SEOHead";
import { LocalBusinessSchema } from "../components/seo/StructuredData";
import { toast } from "sonner";

export default function ProfessionalProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const professionalId = urlParams.get("id");

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    checkIfFavorite();
  }, [user, professionalId]);

  useEffect(() => {
    if (professionalId && user) {
      trackProfileView();
    }
  }, [professionalId, user]);

  const trackProfileView = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const existingMetrics = await base44.entities.ProfileMetrics.filter({
        professional_id: professionalId,
        date: today
      });

      if (existingMetrics.length > 0) {
        await base44.entities.ProfileMetrics.update(existingMetrics[0].id, {
          profile_views: (existingMetrics[0].profile_views || 0) + 1
        });
      } else {
        await base44.entities.ProfileMetrics.create({
          professional_id: professionalId,
          date: today,
          profile_views: 1,
          search_appearances: 0,
          messages_received: 0,
          contact_clicks: 0
        });
      }
    } catch (error) {
      console.error('Error tracking profile view:', error);
    }
  };

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    }
  };

  const checkIfFavorite = async () => {
    if (!user || !professionalId) return;

    try {
      const favorites = await base44.entities.Favorite.filter({
        client_id: user.id,
        professional_id: professionalId
      });
      setIsFavorite(favorites.length > 0);
    } catch (error) {
      console.error("Error checking favorite:", error);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }

    try {
      if (isFavorite) {
        const favorites = await base44.entities.Favorite.filter({
          client_id: user.id,
          professional_id: professionalId
        });
        if (favorites[0]) {
          await base44.entities.Favorite.delete(favorites[0].id);
        }
        setIsFavorite(false);
        toast.success("Eliminado de favoritos");
      } else {
        await base44.entities.Favorite.create({
          client_id: user.id,
          professional_id: professionalId,
          business_name: profile.business_name
        });
        setIsFavorite(true);
        toast.success("Añadido a favoritos");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleStartChat = async () => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }

    const conversationId = [user.id, professionalId].sort().join('_');
    
    const existingMessages = await base44.entities.Message.filter({
      conversation_id: conversationId
    });

    if (existingMessages.length === 0) {
      await base44.entities.Message.create({
        conversation_id: conversationId,
        sender_id: user.id,
        recipient_id: professionalId,
        content: "Hola, estoy interesado en tus servicios.",
        professional_name: profile.business_name,
        client_name: user.full_name || user.email,
        is_read: false
      });

      const today = new Date().toISOString().split('T')[0];
      const metrics = await base44.entities.ProfileMetrics.filter({
        professional_id: professionalId,
        date: today
      });

      if (metrics.length > 0) {
        await base44.entities.ProfileMetrics.update(metrics[0].id, {
          messages_received: (metrics[0].messages_received || 0) + 1
        });
      }
    }

    navigate(createPageUrl("Messages") + `?conversation=${conversationId}&professional=${professionalId}`);
  };

  const formatPhoneForWhatsApp = (phone) => {
    if (!phone) return null;
    let cleaned = phone.replace(/\D/g, '');
    if (!cleaned.startsWith('34') && cleaned.length === 9) {
      cleaned = '34' + cleaned;
    }
    return cleaned;
  };

  const handlePhoneClick = () => {
    trackContactClick();
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      let cleaned = profile.telefono_contacto.replace(/[^\d+]/g, '');
      if (!cleaned.startsWith('+')) {
        cleaned = '+34' + cleaned;
      }
      window.location.href = `tel:${cleaned}`;
    } else {
      setShowPhoneModal(true);
    }
  };

  const handleWhatsAppClick = () => {
    trackContactClick();
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      window.open(`https://wa.me/${formatPhoneForWhatsApp(profile.telefono_contacto)}`, '_blank');
    } else {
      setShowWhatsAppModal(true);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedPhone(true);
    toast.success("Número copiado");
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const trackContactClick = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const metrics = await base44.entities.ProfileMetrics.filter({
        professional_id: professionalId,
        date: today
      });

      if (metrics.length > 0) {
        await base44.entities.ProfileMetrics.update(metrics[0].id, {
          contact_clicks: (metrics[0].contact_clicks || 0) + 1
        });
      }
    } catch (error) {
      console.error('Error tracking contact click:', error);
    }
  };

  const isAvailableNow = (profile) => {
    if (!profile) return false;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDay = now.getDay();

    const isWeekday = currentDay >= 1 && currentDay <= 5;
    const isWeekend = currentDay === 0 || currentDay === 6;

    let isAvailableBySchedule = false;

    if (profile.disponibilidad_tipo === "laborables" && isWeekday) {
      isAvailableBySchedule = true;
    } else if (profile.disponibilidad_tipo === "festivos" && isWeekend) {
      isAvailableBySchedule = true;
    } else if (profile.disponibilidad_tipo === "ambos") {
      isAvailableBySchedule = true;
    }

    if (isAvailableBySchedule && profile.horario_apertura && profile.horario_cierre) {
      const [openHour, openMinute] = profile.horario_apertura.split(':').map(Number);
      const [closeHour, closeMinute] = profile.horario_cierre.split(':').map(Number);

      const currentTime = currentHour * 60 + currentMinute;
      const openTime = openHour * 60 + openMinute;
      const closeTime = closeHour * 60 + closeMinute;

      return currentTime >= openTime && currentTime < closeTime;
    }

    return false;
  };

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['professionalProfile', professionalId],
    queryFn: async () => {
      const profiles = await base44.entities.ProfessionalProfile.filter({
        user_id: professionalId
      });
      return profiles[0];
    },
    enabled: !!professionalId,
  });

  const { data: professionalUser } = useQuery({
    queryKey: ['professionalUser', professionalId],
    queryFn: async () => {
      const users = await base44.entities.User.filter({
        id: professionalId
      });
      return users[0];
    },
    enabled: !!professionalId,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', professionalId],
    queryFn: async () => {
      const allReviews = await base44.entities.Review.filter({
        professional_id: professionalId
      });
      
      const validReviews = [];
      for (const review of allReviews) {
        try {
          const clientExists = await base44.entities.User.filter({ id: review.client_id });
          if (clientExists.length > 0) {
            validReviews.push(review);
          }
        } catch (error) {
          console.log('Cliente no encontrado, omitiendo reseña');
        }
      }
      
      return validReviews.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: !!professionalId,
  });

  const { data: metrics } = useQuery({
    queryKey: ['profileMetrics', professionalId],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const allMetrics = await base44.entities.ProfileMetrics.filter({
        professional_id: professionalId
      });
      
      const recentMetrics = allMetrics.filter(m => new Date(m.date) >= thirtyDaysAgo);
      
      const totals = {
        views: recentMetrics.reduce((sum, m) => sum + (m.profile_views || 0), 0),
        searches: recentMetrics.reduce((sum, m) => sum + (m.search_appearances || 0), 0),
        contacts: recentMetrics.reduce((sum, m) => sum + (m.contact_clicks || 0), 0)
      };
      
      return totals;
    },
    enabled: !!professionalId && user?.id === professionalId,
  });

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-lg border-0 rounded-2xl">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Perfil no encontrado
            </h2>
            <p className="text-gray-600 mb-6">
              El perfil que buscas no existe o ha sido eliminado.
            </p>
            <Button onClick={() => navigate(createPageUrl("Search"))} className="bg-blue-600 hover:bg-blue-700">
              Volver a búsqueda
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const seoTitle = `${profile.business_name} - ${profile.categories?.[0] || 'Profesional'} en ${profile.ciudad || profile.provincia}`;
  const seoDescription = profile.descripcion_corta || `${profile.business_name} ofrece servicios profesionales en ${profile.ciudad || profile.provincia}. Contacta ahora.`;

  const availableContactMethods = profile.metodos_contacto || [];
  const showPhone = availableContactMethods.includes('telefono') && profile.telefono_contacto;
  const showWhatsApp = availableContactMethods.includes('whatsapp') && profile.telefono_contacto;
  const showChat = availableContactMethods.includes('chat_interno');

  const isOwner = user?.id === professionalId;

  return (
    <>
      <SEOHead 
        title={seoTitle}
        description={seoDescription}
        keywords={`${profile.categories?.join(', ')}, ${profile.ciudad}, ${profile.provincia}, autónomo`}
        type="profile"
      />
      
      <LocalBusinessSchema 
        profile={profile}
        reviews={reviews}
        professionalUser={professionalUser}
      />
      
      <div className="min-h-screen bg-gray-50 py-3 px-3 md:py-4 md:px-4">
        <div className="max-w-5xl mx-auto space-y-3">
          
          {/* BOTÓN VOLVER */}
          <Button
            onClick={() => navigate(createPageUrl("Search"))}
            variant="ghost"
            className="hover:bg-white mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a búsqueda
          </Button>
          
          {/* CABECERA COMPACTA */}
          <Card className="border-0 shadow-sm rounded-xl overflow-hidden bg-white">
            <div className="p-4 md:p-5">
              <div className="flex items-start gap-3">
                <Avatar className="w-16 h-16 md:w-20 md:h-20 border-2 border-gray-100 flex-shrink-0">
                  {professionalUser?.profile_picture ? (
                    <AvatarImage 
                      src={professionalUser.profile_picture}
                      alt={profile.business_name}
                      className="object-cover"
                    />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xl font-bold">
                      {profile.business_name?.charAt(0)}
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1 truncate">
                    {profile.business_name}
                  </h1>
                  
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    {profile.categories?.[0] && (
                      <Badge className="bg-blue-50 text-blue-700 border-0 text-xs px-2 py-0.5">
                        <Briefcase className="w-3 h-3 mr-1" />
                        {profile.categories[0]}
                      </Badge>
                    )}
                    
                    {profile.service_area && (
                      <Badge variant="outline" className="text-xs px-2 py-0.5 border-gray-200">
                        <MapPin className="w-3 h-3 mr-1" />
                        {profile.service_area}
                      </Badge>
                    )}
                  </div>

                  {profile.total_reviews > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-semibold text-gray-900">{profile.average_rating.toFixed(1)}</span>
                      <span className="text-xs text-gray-500">({profile.total_reviews})</span>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleToggleFavorite}
                  variant="ghost"
                  size="icon"
                  className={`${isFavorite ? 'text-red-500' : 'text-gray-300'} h-9 w-9 rounded-full flex-shrink-0`}
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                </Button>
              </div>
            </div>
          </Card>

          {/* BOTONES DE CONTACTO */}
          <div className="grid grid-cols-3 gap-2">
            {showPhone && (
              <Button 
                onClick={handlePhoneClick}
                className="bg-blue-600 hover:bg-blue-700 h-11 text-sm font-semibold rounded-lg"
              >
                <Phone className="w-4 h-4 mr-1.5" />
                Llamar
              </Button>
            )}
            
            {showWhatsApp && (
              <Button
                onClick={handleWhatsAppClick}
                className="bg-green-600 hover:bg-green-700 h-11 text-sm font-semibold rounded-lg"
              >
                <MessageCircle className="w-4 h-4 mr-1.5" />
                WhatsApp
              </Button>
            )}
            
            {showChat && (
              <Button
                onClick={handleStartChat}
                className="bg-blue-600 hover:bg-blue-700 h-11 text-sm font-semibold rounded-lg"
              >
                <MessageSquare className="w-4 h-4 mr-1.5" />
                Chat
              </Button>
            )}
          </div>

          {/* DESCRIPCIÓN */}
          {profile.descripcion_corta && (
            <Card className="border-0 shadow-sm rounded-xl bg-white p-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                {profile.descripcion_corta}
              </p>
            </Card>
          )}

          {/* INFORMACIÓN PROFESIONAL COMPACTA */}
          <Card className="border-0 shadow-sm rounded-xl bg-white p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {profile.years_experience > 0 && (
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <Award className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">Experiencia</p>
                  <p className="text-sm font-semibold text-gray-900">{profile.years_experience} años</p>
                </div>
              )}

              {profile.tarifa_base > 0 && (
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <Euro className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">Tarifa</p>
                  <p className="text-sm font-semibold text-gray-900">{profile.tarifa_base}€/h</p>
                </div>
              )}

              {profile.formas_pago && profile.formas_pago.length > 0 && (
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Pago</p>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {profile.formas_pago.slice(0, 2).map((forma, idx) => (
                      <Badge key={idx} variant="outline" className="text-[10px] px-1 py-0">
                        {forma}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {availableContactMethods.length > 0 && (
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Contacto</p>
                  <div className="flex gap-1 justify-center">
                    {availableContactMethods.includes('telefono') && <Phone className="w-3 h-3 text-gray-600" />}
                    {availableContactMethods.includes('whatsapp') && <MessageCircle className="w-3 h-3 text-green-600" />}
                    {availableContactMethods.includes('chat_interno') && <MessageSquare className="w-3 h-3 text-blue-600" />}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* GALERÍA DE TRABAJOS COMPACTA */}
          {profile.photos && profile.photos.length > 0 && (
            <Card className="border-0 shadow-sm rounded-xl bg-white p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-2">Galería de trabajos</h3>
              <div className={`grid ${profile.photos.length === 1 ? 'grid-cols-1' : 'grid-cols-3 md:grid-cols-4'} gap-2`}>
                {profile.photos.map((photo, idx) => (
                  <div 
                    key={idx} 
                    className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group bg-gray-100"
                    onClick={() => setSelectedImage(photo)}
                  >
                    <img
                      src={photo}
                      alt={`Trabajo ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    {idx === 0 && (
                      <div className="absolute top-1 left-1 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-semibold">
                        Principal
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* REDES SOCIALES COMPACTAS */}
          {(profile.website || profile.social_links?.facebook || profile.social_links?.instagram || profile.social_links?.linkedin || profile.social_links?.tiktok) && (
            <Card className="border-0 shadow-sm rounded-xl bg-white p-4">
              <div className="flex flex-wrap gap-2">
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="h-8 px-2 text-xs rounded-lg">
                      <Globe className="w-3 h-3 mr-1" />
                      Web
                    </Button>
                  </a>
                )}
                {profile.social_links?.facebook && (
                  <a href={profile.social_links.facebook} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="h-8 px-2 text-xs rounded-lg">
                      <Facebook className="w-3 h-3 mr-1 text-blue-600" />
                      Facebook
                    </Button>
                  </a>
                )}
                {profile.social_links?.instagram && (
                  <a href={profile.social_links.instagram} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="h-8 px-2 text-xs rounded-lg">
                      <Instagram className="w-3 h-3 mr-1 text-pink-600" />
                      Instagram
                    </Button>
                  </a>
                )}
                {profile.social_links?.linkedin && (
                  <a href={profile.social_links.linkedin} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="h-8 px-2 text-xs rounded-lg">
                      <Linkedin className="w-3 h-3 mr-1 text-blue-700" />
                      LinkedIn
                    </Button>
                  </a>
                )}
                {profile.social_links?.tiktok && (
                  <a href={profile.social_links.tiktok} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="h-8 px-2 text-xs rounded-lg">
                      <Music className="w-3 h-3 mr-1" />
                      TikTok
                    </Button>
                  </a>
                )}
              </div>
            </Card>
          )}

          {/* ESTADÍSTICAS COMPACTAS (solo propietario) */}
          {isOwner && metrics && (
            <Card className="border-0 shadow-sm rounded-xl bg-blue-50 p-4">
              <p className="text-xs font-semibold text-gray-600 mb-2">📊 Últimos 30 días</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 bg-white rounded-lg">
                  <p className="text-xl font-bold text-gray-900">{metrics.views}</p>
                  <p className="text-[10px] text-gray-500">Vistas</p>
                </div>
                <div className="text-center p-2 bg-white rounded-lg">
                  <p className="text-xl font-bold text-gray-900">{metrics.searches}</p>
                  <p className="text-[10px] text-gray-500">Búsquedas</p>
                </div>
                <div className="text-center p-2 bg-white rounded-lg">
                  <p className="text-xl font-bold text-gray-900">{metrics.contacts}</p>
                  <p className="text-[10px] text-gray-500">Contactos</p>
                </div>
              </div>
            </Card>
          )}

          {/* RESEÑAS COMPACTAS */}
          <Card className="border-0 shadow-sm rounded-xl bg-white p-4">
            <ReviewSection professionalId={professionalId} reviews={reviews} currentUser={user} />
          </Card>
        </div>
      </div>

      {/* MODAL TELÉFONO */}
      <Dialog open={showPhoneModal} onOpenChange={setShowPhoneModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Número de teléfono</DialogTitle>
            <DialogDescription>
              Llama desde tu teléfono a este número
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 w-full text-center">
              <p className="text-3xl font-bold text-blue-700 tracking-wide">
                {profile.telefono_contacto}
              </p>
            </div>
            <Button
              onClick={() => copyToClipboard(profile.telefono_contacto)}
              variant="outline"
              className="w-full"
            >
              {copiedPhone ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-green-600" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar número
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL WHATSAPP */}
      <Dialog open={showWhatsAppModal} onOpenChange={setShowWhatsAppModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-green-600" />
              WhatsApp
            </DialogTitle>
            <DialogDescription>
              Contacta por WhatsApp con este profesional
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="p-4 bg-green-50 rounded-xl border border-green-200 w-full text-center">
              <p className="text-3xl font-bold text-green-700 tracking-wide">
                {profile.telefono_contacto}
              </p>
            </div>
            <Button
              onClick={() => {
                window.open(`https://wa.me/${formatPhoneForWhatsApp(profile.telefono_contacto)}`, '_blank');
                setShowWhatsAppModal(false);
              }}
              className="w-full bg-green-600 hover:bg-green-700 h-12"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Abrir WhatsApp
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL GALERÍA */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img
            src={selectedImage}
            alt="Vista ampliada"
            className="max-w-full max-h-full object-contain rounded-xl"
          />
        </div>
      )}
    </>
  );
}
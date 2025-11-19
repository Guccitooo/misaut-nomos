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
  Clock,
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
  Music
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

export default function ProfessionalProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

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
      } else {
        const prof = await base44.entities.ProfessionalProfile.filter({
          user_id: professionalId
        });
        
        await base44.entities.Favorite.create({
          client_id: user.id,
          professional_id: professionalId,
          business_name: prof[0]?.business_name || "Profesional"
        });
        setIsFavorite(true);
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
      const prof = await base44.entities.ProfessionalProfile.filter({
        user_id: professionalId
      });
      
      await base44.entities.Message.create({
        conversation_id: conversationId,
        sender_id: user.id,
        recipient_id: professionalId,
        content: "Hola, estoy interesado en tus servicios.",
        professional_name: prof[0]?.business_name || "Profesional",
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
      } else {
        await base44.entities.ProfileMetrics.create({
          professional_id: professionalId,
          date: today,
          profile_views: 0,
          search_appearances: 0,
          messages_received: 1,
          contact_clicks: 0
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
    
    trackContactClick();
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
      } else {
        await base44.entities.ProfileMetrics.create({
          professional_id: professionalId,
          date: today,
          profile_views: 0,
          search_appearances: 0,
          messages_received: 0,
          contact_clicks: 1
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
      return allReviews.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: !!professionalId,
  });

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-xl border-0">
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

  const seoTitle = `${profile.business_name} - ${profile.categories?.[0] || 'Profesional'} en ${profile.ciudad || 'España'}`;
  const seoDescription = profile.descripcion_corta || profile.description || `${profile.business_name} ofrece servicios profesionales en ${profile.ciudad || 'tu zona'}. Contacta ahora.`;

  const availableContactMethods = profile.metodos_contacto || [];
  const showPhone = availableContactMethods.includes('telefono') && profile.telefono_contacto;
  const showWhatsApp = availableContactMethods.includes('whatsapp') && profile.telefono_contacto;
  const showChat = availableContactMethods.includes('chat_interno');

  return (
    <>
      <SEOHead 
        title={seoTitle}
        description={seoDescription}
        keywords={`${profile.categories?.join(', ')}, ${profile.ciudad}, ${profile.provincia}, autónomo, profesional`}
        type="profile"
      />
      
      <LocalBusinessSchema 
        profile={profile}
        reviews={reviews}
        professionalUser={professionalUser}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="shadow-xl border-0 bg-white overflow-hidden rounded-2xl">
            <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <Avatar className="w-24 h-24 md:w-28 md:h-28 border-4 border-white shadow-2xl ring-4 ring-blue-400/30">
                  {professionalUser?.profile_picture ? (
                    <AvatarImage 
                      src={professionalUser.profile_picture}
                      alt={profile.business_name}
                      className="object-cover"
                    />
                  ) : (
                    <AvatarFallback className="bg-white text-blue-700 text-3xl font-bold">
                      {profile.business_name?.charAt(0)}
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                    {profile.business_name}
                  </h1>
                  
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-3">
                    {profile.categories?.slice(0, 3).map((cat, idx) => (
                      <Badge key={idx} className="bg-white/25 hover:bg-white/35 text-white border-0 backdrop-blur-sm">
                        {cat}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                    {profile.total_reviews > 0 && (
                      <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                        <Star className="w-4 h-4 fill-yellow-300 text-yellow-300" />
                        <span className="text-white font-semibold">{profile.average_rating.toFixed(1)}</span>
                        <span className="text-white/90 text-sm">({profile.total_reviews})</span>
                      </div>
                    )}
                    
                    {isAvailableNow(profile) && (
                      <Badge className="bg-green-500 hover:bg-green-600 text-white border-0 shadow-lg flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        Disponible ahora
                      </Badge>
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleToggleFavorite}
                  variant="ghost"
                  size="icon"
                  className={`${isFavorite ? 'bg-red-500 hover:bg-red-600' : 'bg-white/20 hover:bg-white/30'} h-12 w-12 rounded-full backdrop-blur-sm`}
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-white text-white' : 'text-white'}`} />
                </Button>
              </div>
            </div>

            <CardContent className="p-6 md:p-8">
              {profile.descripcion_corta && (
                <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-gray-800 leading-relaxed text-center md:text-left">
                    {profile.descripcion_corta}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
                {showPhone && (
                  <Button 
                    onClick={handlePhoneClick}
                    className="bg-blue-600 hover:bg-blue-700 h-12 font-semibold shadow-md"
                  >
                    <Phone className="w-5 h-5 mr-2" />
                    Llamar
                  </Button>
                )}
                
                {showWhatsApp && (
                  <Button
                    onClick={() => {
                      window.open(`https://wa.me/${formatPhoneForWhatsApp(profile.telefono_contacto)}`, '_blank');
                      trackContactClick();
                    }}
                    className="bg-green-600 hover:bg-green-700 h-12 font-semibold shadow-md"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    WhatsApp
                  </Button>
                )}
                
                {showChat && (
                  <Button
                    onClick={handleStartChat}
                    className="bg-blue-600 hover:bg-blue-700 h-12 font-semibold shadow-md"
                  >
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Chat directo
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card className="border-gray-200 shadow-sm">
                  <CardContent className="p-5">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      Ubicación y disponibilidad
                    </h3>
                    <div className="space-y-3">
                      {profile.service_area && (
                        <div>
                          <p className="text-sm text-gray-500">Zona de trabajo</p>
                          <p className="font-medium text-gray-900">{profile.service_area}</p>
                        </div>
                      )}
                      
                      {(profile.horario_apertura && profile.horario_cierre) && (
                        <div>
                          <p className="text-sm text-gray-500">Horario</p>
                          <p className="font-medium text-gray-900">
                            {profile.disponibilidad_tipo === "laborables" ? "L-V" :
                             profile.disponibilidad_tipo === "festivos" ? "S-D" : "L-D"} • {profile.horario_apertura} - {profile.horario_cierre}
                          </p>
                        </div>
                      )}

                      {profile.years_experience > 0 && (
                        <div>
                          <p className="text-sm text-gray-500">Experiencia</p>
                          <p className="font-medium text-gray-900 flex items-center gap-1">
                            <Award className="w-4 h-4 text-blue-600" />
                            {profile.years_experience} años
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-200 shadow-sm">
                  <CardContent className="p-5">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Euro className="w-5 h-5 text-blue-600" />
                      Información de servicio
                    </h3>
                    <div className="space-y-3">
                      {profile.tarifa_base > 0 && (
                        <div>
                          <p className="text-sm text-gray-500">Tarifa aproximada</p>
                          <p className="font-bold text-2xl text-blue-600">{profile.tarifa_base}€<span className="text-sm text-gray-500 font-normal">/hora</span></p>
                        </div>
                      )}

                      {profile.formas_pago && profile.formas_pago.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-500 mb-2">Formas de pago</p>
                          <div className="flex flex-wrap gap-2">
                            {profile.formas_pago.map((forma, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {forma}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {profile.certifications && profile.certifications.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-500 mb-2">Certificaciones</p>
                          <div className="flex flex-wrap gap-2">
                            {profile.certifications.slice(0, 2).map((cert, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs flex items-center gap-1">
                                <Award className="w-3 h-3" />
                                {cert}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {profile.description && (
                <Card className="border-gray-200 shadow-sm mb-8">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Sobre el servicio</h3>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {profile.description}
                    </p>
                  </CardContent>
                </Card>
              )}

              {profile.photos && profile.photos.length > 0 && (
                <Card className="border-gray-200 shadow-sm mb-8">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Galería de trabajos</h3>
                    <div className={`grid ${profile.photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3'} gap-4`}>
                      {profile.photos.map((photo, idx) => (
                        <div 
                          key={idx} 
                          className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                          onClick={() => setSelectedImage(photo)}
                        >
                          <img
                            src={photo}
                            alt={`Trabajo ${idx + 1}`}
                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {(profile.website || profile.social_links?.facebook || profile.social_links?.instagram || profile.social_links?.linkedin || profile.social_links?.tiktok) && (
                <Card className="border-gray-200 shadow-sm mb-8">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Globe className="w-5 h-5 text-blue-600" />
                      Redes sociales
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {profile.website && (
                        <a href={profile.website} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                            <Globe className="w-4 h-4 mr-2" />
                            Sitio web
                          </Button>
                        </a>
                      )}
                      {profile.social_links?.facebook && (
                        <a href={profile.social_links.facebook} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                            <Facebook className="w-4 h-4 mr-2 text-blue-600" />
                            Facebook
                          </Button>
                        </a>
                      )}
                      {profile.social_links?.instagram && (
                        <a href={profile.social_links.instagram} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                            <Instagram className="w-4 h-4 mr-2 text-pink-600" />
                            Instagram
                          </Button>
                        </a>
                      )}
                      {profile.social_links?.linkedin && (
                        <a href={profile.social_links.linkedin} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                            <Linkedin className="w-4 h-4 mr-2 text-blue-700" />
                            LinkedIn
                          </Button>
                        </a>
                      )}
                      {profile.social_links?.tiktok && (
                        <a href={profile.social_links.tiktok} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                            <Music className="w-4 h-4 mr-2" />
                            TikTok
                          </Button>
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <ReviewSection professionalId={professionalId} reviews={reviews} currentUser={user} />
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showPhoneModal} onOpenChange={setShowPhoneModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Número de teléfono</DialogTitle>
            <DialogDescription>
              Puedes llamar directamente al profesional
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 w-full text-center">
              <p className="text-3xl font-bold text-blue-700 tracking-wide">
                {profile.telefono_contacto}
              </p>
            </div>
            <p className="text-sm text-gray-600">
              Llama desde tu teléfono a este número
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
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
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}
    </>
  );
}
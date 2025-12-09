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
  Briefcase,
  ChevronLeft,
  ChevronRight
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
import { useLanguage } from "../components/ui/LanguageSwitcher";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function ProfessionalProfilePage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
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
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
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
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
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
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
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
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
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
              {t('profileNotFound')}
            </h2>
            <p className="text-gray-600 mb-6">
              {t('profileNotFoundDescription')}
            </p>
            <Button onClick={() => navigate(createPageUrl("Search"))} className="bg-blue-600 hover:bg-blue-700">
              {t('backToSearch')}
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
            {t('backToSearch')}
          </Button>
          
          {/* CABECERA PERFIL */}
          <Card className="border-0 shadow-sm rounded-xl bg-white p-4">
            <div className="flex items-center gap-4 mb-3">
              <Avatar 
                className="w-14 h-14 border-2 border-gray-100 flex-shrink-0 cursor-pointer"
                onClick={() => {
                  const photoUrl = professionalUser?.profile_picture || profile.imagen_principal;
                  if (photoUrl) {
                    setSelectedImage(photoUrl);
                    setSelectedImageIndex(-1);
                  }
                }}
              >
                {(() => {
                  const photoUrl = professionalUser?.profile_picture || profile.imagen_principal;
                  return photoUrl ? (
                    <AvatarImage 
                      src={photoUrl}
                      alt={profile.business_name}
                      className="object-cover"
                    />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xl font-bold">
                      {profile.business_name?.charAt(0)}
                    </AvatarFallback>
                  );
                })()}
              </Avatar>
              
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-900 mb-1">
                  {profile.business_name}
                </h1>
                
                <div className="flex items-center gap-2 mb-1">
                  {profile.categories?.[0] && (
                    <Badge className="bg-blue-50 text-blue-700 text-xs">
                      {profile.categories[0]}
                    </Badge>
                  )}
                  
                  {profile.total_reviews > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-semibold">{profile.average_rating.toFixed(1)}</span>
                      <span className="text-xs text-gray-500">({profile.total_reviews})</span>
                    </div>
                  )}
                </div>

                {profile.service_area && (
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <MapPin className="w-3 h-3" />
                    {profile.service_area}
                  </div>
                )}
              </div>

              <Button
                onClick={handleToggleFavorite}
                variant="ghost"
                size="icon"
                className={`${isFavorite ? 'text-red-500' : 'text-gray-400'} h-9 w-9`}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
              </Button>
            </div>

            {/* BOTONES DE CONTACTO */}
            <TooltipProvider>
              <div className="flex gap-2">
                {showPhone && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        onClick={(e) => {
                          e.preventDefault();
                          trackContactClick();
                          setShowPhoneModal(true);
                        }}
                        variant="outline"
                        className="flex-1 h-9 text-sm hover:bg-blue-50 hover:border-blue-600"
                      >
                        <Phone className="w-4 h-4 mr-1" />
                        {t('call')}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('callPhone')}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                
                {showWhatsApp && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={(e) => {
                          e.preventDefault();
                          trackContactClick();
                          setShowWhatsAppModal(true);
                        }}
                        variant="outline"
                        className="flex-1 h-9 text-sm hover:bg-green-50 hover:border-green-600"
                      >
                        <MessageCircle className="w-4 h-4 mr-1 text-green-600" />
                        WhatsApp
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('contactViaWhatsApp')}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                
                {showChat && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleStartChat}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 h-9 text-sm"
                      >
                        <MessageSquare className="w-4 h-4 mr-1" />
                        {t('chat')}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('sendDirectMessage')}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </TooltipProvider>
          </Card>

          {/* DESCRIPCIÓN E INFO */}
          <Card className="border-0 shadow-sm rounded-xl bg-white p-4">
            {profile.descripcion_corta && (
              <p className="text-sm text-gray-700 mb-3">
                {profile.descripcion_corta}
              </p>
            )}

            {(profile.years_experience > 0 || profile.tarifa_base > 0) && (
              <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                {profile.years_experience > 0 && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1">
                    <Award className="w-3.5 h-3.5 mr-1.5" />
                    {profile.years_experience} {profile.years_experience === 1 ? 'año' : 'años'} de experiencia
                  </Badge>
                )}

                {profile.tarifa_base > 0 && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-3 py-1">
                    <Euro className="w-3.5 h-3.5 mr-1.5" />
                    {profile.tarifa_base}€/hora
                  </Badge>
                )}
              </div>
            )}
          </Card>

          {/* GALERÍA DE TRABAJOS */}
          {profile.photos && profile.photos.length > 0 && (
            <Card className="border-0 shadow-sm rounded-xl bg-white p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3">{t('workGalleryTitle')}</h3>
              <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
                {profile.photos.map((photo, idx) => (
                  <div 
                    key={idx} 
                    className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group bg-gray-100 shadow-sm hover:shadow-md transition-shadow"
                    onClick={() => {
                      setSelectedImage(photo);
                      setSelectedImageIndex(idx);
                    }}
                  >
                    <img
                      src={photo}
                      alt={`Trabajo ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    {idx === 0 && (
                      <div className="absolute top-1 left-1 bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded font-semibold shadow">
                        ★
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* REDES SOCIALES */}
          {(profile.website || profile.social_links?.facebook || profile.social_links?.instagram || profile.social_links?.linkedin || profile.social_links?.tiktok) && (
            <Card className="border-0 shadow-sm rounded-xl bg-white p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3">{t('socialNetworks')}</h3>
              <div className="flex flex-wrap gap-2">
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="h-9 px-4 text-sm">
                      <Globe className="w-4 h-4 mr-2" />
                      {t('sitioWeb')}
                    </Button>
                  </a>
                )}
                {profile.social_links?.facebook && (
                  <a href={profile.social_links.facebook} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="h-9 px-4 text-sm">
                      <Facebook className="w-4 h-4 mr-2 text-blue-600" />
                      Facebook
                    </Button>
                  </a>
                )}
                {profile.social_links?.instagram && (
                  <a href={profile.social_links.instagram} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="h-9 px-4 text-sm">
                      <Instagram className="w-4 h-4 mr-2 text-pink-600" />
                      Instagram
                    </Button>
                  </a>
                )}
                {profile.social_links?.linkedin && (
                  <a href={profile.social_links.linkedin} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="h-9 px-4 text-sm">
                      <Linkedin className="w-4 h-4 mr-2 text-blue-700" />
                      LinkedIn
                    </Button>
                  </a>
                )}
                {profile.social_links?.tiktok && (
                  <a href={profile.social_links.tiktok} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="h-9 px-4 text-sm">
                      <Music className="w-4 h-4 mr-2" />
                      TikTok
                    </Button>
                  </a>
                )}
              </div>
            </Card>
          )}

          {/* ESTADÍSTICAS (solo propietario) */}
          {isOwner && metrics && (
            <Card className="border-0 shadow-sm rounded-xl bg-blue-50 p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3">📊 {t('statistics30Days')}</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <p className="text-2xl font-bold text-gray-900">{metrics.views}</p>
                  <p className="text-xs text-gray-500 mt-1">{t('views')}</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <p className="text-2xl font-bold text-gray-900">{metrics.searches}</p>
                  <p className="text-xs text-gray-500 mt-1">{t('searches')}</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <p className="text-2xl font-bold text-gray-900">{metrics.contacts}</p>
                  <p className="text-xs text-gray-500 mt-1">{t('contacts')}</p>
                </div>
              </div>
            </Card>
          )}

          {/* RESEÑAS */}
          <Card className="border-0 shadow-sm rounded-xl bg-white p-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3">{t('clientReviews')}</h3>
            <ReviewSection professionalId={professionalId} reviews={reviews} currentUser={user} />
          </Card>
        </div>
      </div>

      {/* MODAL TELÉFONO */}
      <Dialog open={showPhoneModal} onOpenChange={setShowPhoneModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl flex items-center justify-center gap-2">
              <Phone className="w-6 h-6 text-blue-600" />
              Llamar
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="p-6 bg-blue-50 rounded-xl border border-blue-200 w-full text-center">
              <p className="text-3xl font-bold text-blue-900 tracking-wide">
                {profile.telefono_contacto}
              </p>
            </div>
            <div className="flex gap-2 w-full">
              <Button
                onClick={() => copyToClipboard(profile.telefono_contacto)}
                variant="outline"
                className="flex-1 h-12"
              >
                {copiedPhone ? (
                  <>
                    <Check className="w-5 h-5 mr-2 text-green-600" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5 mr-2" />
                    Copiar
                  </>
                )}
              </Button>
              <Button
                onClick={() => {
                  let cleaned = profile.telefono_contacto.replace(/[^\d+]/g, '');
                  if (!cleaned.startsWith('+')) {
                    cleaned = '+34' + cleaned;
                  }
                  window.location.href = `tel:${cleaned}`;
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 h-12"
              >
                <Phone className="w-5 h-5 mr-2" />
                Llamar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL WHATSAPP */}
      <Dialog open={showWhatsAppModal} onOpenChange={setShowWhatsAppModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl flex items-center justify-center gap-2">
              <MessageCircle className="w-6 h-6 text-green-600" />
              WhatsApp
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="p-6 bg-green-50 rounded-xl border border-green-200 w-full text-center">
              <p className="text-3xl font-bold text-green-700 tracking-wide">
                {profile.telefono_contacto}
              </p>
            </div>
            <div className="flex gap-2 w-full">
              <Button
                onClick={() => copyToClipboard(profile.telefono_contacto)}
                variant="outline"
                className="flex-1 h-12"
              >
                {copiedPhone ? (
                  <>
                    <Check className="w-5 h-5 mr-2 text-green-600" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5 mr-2" />
                    Copiar
                  </>
                )}
              </Button>
              <Button
                onClick={() => {
                  window.open(`https://wa.me/${formatPhoneForWhatsApp(profile.telefono_contacto)}`, '_blank');
                  setShowWhatsAppModal(false);
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 h-12"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                WhatsApp
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL GALERÍA CON NAVEGACIÓN */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          
          {selectedImageIndex >= 0 && profile.photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newIndex = selectedImageIndex === 0 ? profile.photos.length - 1 : selectedImageIndex - 1;
                  setSelectedImageIndex(newIndex);
                  setSelectedImage(profile.photos[newIndex]);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newIndex = selectedImageIndex === profile.photos.length - 1 ? 0 : selectedImageIndex + 1;
                  setSelectedImageIndex(newIndex);
                  setSelectedImage(profile.photos[newIndex]);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
              
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-3 py-1.5 rounded-full">
                <span className="text-white text-sm">{selectedImageIndex + 1} / {profile.photos.length}</span>
              </div>
            </>
          )}
          
          <img
            src={selectedImage}
            alt="Vista ampliada"
            className="max-w-full max-h-full object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
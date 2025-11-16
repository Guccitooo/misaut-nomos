
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
  Briefcase,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ReviewSection from "../components/profile/ReviewSection";
import PhotoGallery from "../components/profile/PhotoGallery";
import AvailabilityBadge from "../components/profile/AvailabilityBadge";
import TranslatedText from "../components/ui/TranslatedText";
import OptimizedImage from "../components/ui/OptimizedImage";
import SEOHead from "../components/seo/SEOHead";
import { LocalBusinessSchema } from "../components/seo/StructuredData";
import { useLanguage } from "../components/ui/LanguageSwitcher"; // Keep this for translations

export default function ProfessionalProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage(); // Keep this for translations
  const [user, setUser] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const professionalId = urlParams.get("id");

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    checkIfFavorite();
  }, [user, professionalId]);

  // Track profile view
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

      // Track message metric
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

  const formatPhoneForCall = (phone) => {
    if (!phone) return null;
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (!cleaned.startsWith('+')) {
      cleaned = '+34' + cleaned;
    }
    return cleaned;
  };

  const formatPhoneForWhatsApp = (phone) => {
    if (!phone) return null;
    let cleaned = phone.replace(/\D/g, '');
    if (!cleaned.startsWith('34') && cleaned.length === 9) {
      cleaned = '34' + cleaned;
    }
    return cleaned;
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-xl">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Perfil no encontrado
            </h2>
            <p className="text-gray-600 mb-6">
              El perfil que buscas no existe o ha sido eliminado.
            </p>
            <Button onClick={() => navigate(createPageUrl("Search"))}>
              Volver a búsqueda
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const seoTitle = `${profile.business_name} - ${profile.categories?.[0] || 'Profesional'} en ${profile.ciudad || 'España'} | MisAutónomos`;
  const seoDescription = profile.descripcion_corta || profile.description || `${profile.business_name} ofrece servicios profesionales en ${profile.ciudad || 'tu zona'}. Contacta ahora y solicita presupuesto.`;

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
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <Card className="shadow-xl border-0 bg-white overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-8 text-white">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-start gap-6">
                  <Avatar className="w-24 h-24 border-4 border-white shadow-xl">
                    {professionalUser?.profile_picture ? (
                      <OptimizedImage 
                        src={professionalUser.profile_picture} 
                        alt={`Foto de perfil de ${profile.business_name}`}
                        className="w-full h-full"
                        objectFit="cover"
                        priority={true}
                        width={96}
                        height={96}
                      />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-blue-700 to-blue-900 text-white text-3xl font-bold">
                        {profile.business_name?.charAt(0)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{profile.business_name}</h1>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {profile.categories?.map((cat, idx) => (
                        <Badge key={idx} className="bg-white/20 text-white border-white/30">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                    {profile.average_rating > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
                          <Star className="w-4 h-4 fill-yellow-300 text-yellow-300" />
                          <span className="font-semibold">{profile.average_rating.toFixed(1)}</span>
                          <span className="text-sm opacity-90">({profile.total_reviews} opiniones)</span>
                        </div>
                        <AvailabilityBadge profile={profile} />
                      </div>
                    ) : (
                      <AvailabilityBadge profile={profile} />
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 w-full md:w-auto">
                  <Button
                    onClick={handleToggleFavorite}
                    variant={isFavorite ? "default" : "outline"}
                    className={`w-full md:w-auto ${isFavorite ? 'bg-red-500 hover:bg-red-600' : 'bg-white text-blue-700 hover:bg-blue-50'}`}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${isFavorite ? 'fill-white' : ''}`} />
                    {isFavorite ? 'Guardado' : 'Guardar'}
                  </Button>
                </div>
              </div>
            </div>

            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {profile.telefono_contacto && profile.metodos_contacto?.includes('telefono') && (
                  <a
                    href={`tel:${formatPhoneForCall(profile.telefono_contacto)}`}
                    onClick={trackContactClick}
                  >
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 h-12">
                      <Phone className="w-5 h-5 mr-2" />
                      Llamar
                    </Button>
                  </a>
                )}
                {profile.telefono_contacto && profile.metodos_contacto?.includes('whatsapp') && (
                  <a
                    href={`https://wa.me/${formatPhoneForWhatsApp(profile.telefono_contacto)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={trackContactClick}
                  >
                    <Button className="w-full bg-green-600 hover:bg-green-700 h-12">
                      <MessageCircle className="w-5 h-5 mr-2" />
                      WhatsApp
                    </Button>
                  </a>
                )}
                <Button
                  onClick={handleStartChat}
                  className="w-full bg-blue-600 hover:bg-blue-700 h-12"
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Chat directo
                </Button>
              </div>

              {profile.descripcion_corta && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-gray-800 leading-relaxed">
                    <TranslatedText text={profile.descripcion_corta} />
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                    Información
                  </h3>
                  <div className="space-y-3">
                    {profile.service_area && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-600">Zona de trabajo</p>
                          <p className="font-medium text-gray-900">{profile.service_area}</p>
                        </div>
                      </div>
                    )}
                    
                    {profile.years_experience > 0 && (
                      <div className="flex items-start gap-3">
                        <Award className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-600">Experiencia</p>
                          <p className="font-medium text-gray-900">{profile.years_experience} años</p>
                        </div>
                      </div>
                    )}

                    {profile.tarifa_base > 0 && (
                      <div className="flex items-start gap-3">
                        <Euro className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-600">Tarifa media</p>
                          <p className="font-medium text-gray-900">{profile.tarifa_base}€/hora</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Horario
                  </h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      {profile.disponibilidad_tipo === "laborables" ? "Lunes a Viernes" :
                       profile.disponibilidad_tipo === "festivos" ? "Sábados, domingos y festivos" :
                       "Todos los días"}
                    </p>
                    <p className="font-medium text-gray-900">
                      {profile.horario_apertura} - {profile.horario_cierre}
                    </p>
                  </div>

                  {(profile.certifications && profile.certifications.length > 0) && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">Certificaciones</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.certifications.map((cert, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            <Award className="w-3 h-3 mr-1" />
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {profile.description && (
                <div className="mt-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Descripción</h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    <TranslatedText text={profile.description} />
                  </p>
                </div>
              )}

              {profile.photos && profile.photos.length > 0 && (
                <div className="mt-8">
                  <PhotoGallery photos={profile.photos} businessName={profile.business_name} />
                </div>
              )}

              <Separator className="my-8" />

              <ReviewSection professionalId={professionalId} reviews={reviews} currentUser={user} />

              {(profile.website || profile.social_links?.facebook || profile.social_links?.instagram || profile.social_links?.linkedin) && (
                <>
                  <Separator className="my-8" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Globe className="w-5 h-5 text-blue-600" />
                      Enlaces
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {profile.website && (
                        <a href={profile.website} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm">
                            <Globe className="w-4 h-4 mr-2" />
                            Sitio web
                          </Button>
                        </a>
                      )}
                      {profile.social_links?.facebook && (
                        <a href={profile.social_links.facebook} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm">
                            <Facebook className="w-4 h-4 mr-2" />
                            Facebook
                          </Button>
                        </a>
                      )}
                      {profile.social_links?.instagram && (
                        <a href={profile.social_links.instagram} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm">
                            <Instagram className="w-4 h-4 mr-2" />
                            Instagram
                          </Button>
                        </a>
                      )}
                      {profile.social_links?.linkedin && (
                        <a href={profile.social_links.linkedin} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm">
                            <Linkedin className="w-4 h-4 mr-2" />
                            LinkedIn
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

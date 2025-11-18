import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Clock,
  Euro,
  Globe,
  Heart,
  Briefcase,
  Star,
  Award,
  Facebook,
  Instagram,
  Linkedin,
  AlertCircle,
  ArrowLeft
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import ReviewSection from "../components/profile/ReviewSection";
import PhotoGallery from "../components/profile/PhotoGallery";
import OptimizedImage from "../components/ui/OptimizedImage";
import SEOHead from "../components/seo/SEOHead";
import { LocalBusinessSchema } from "../components/seo/StructuredData";
import { useLanguage } from "../components/ui/LanguageSwitcher";
import ContactButtons from "../components/ui/ContactButtons";

export default function ProfessionalProfilePage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const professionalId = urlParams.get("id");

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user && professionalId) {
      checkIfFavorite();
      trackProfileView();
    }
  }, [user, professionalId]);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    }
  };

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

  const checkIfFavorite = async () => {
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
        await base44.entities.Favorite.create({
          client_id: user.id,
          professional_id: professionalId,
          business_name: profile?.business_name || "Profesional"
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
      await base44.entities.Message.create({
        conversation_id: conversationId,
        sender_id: user.id,
        recipient_id: professionalId,
        content: "Hola, estoy interesado en tus servicios.",
        professional_name: profile?.business_name || "Profesional",
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
      const users = await base44.asServiceRole.entities.User.filter({
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
      return allReviews
        .filter(review => review.client_id && review.client_name)
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: !!professionalId,
  });

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-48 w-full rounded-2xl mb-8" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Perfil no encontrado
          </h2>
          <p className="text-gray-500 mb-6">
            El perfil que buscas no existe o ha sido eliminado.
          </p>
          <Button onClick={() => navigate(createPageUrl("Search"))}>
            Volver a búsqueda
          </Button>
        </div>
      </div>
    );
  }

  const seoTitle = `${profile.business_name} - ${profile.categories?.[0] || 'Profesional'} en ${profile.ciudad || 'España'}`;
  const seoDescription = profile.descripcion_corta || profile.description || `${profile.business_name} ofrece servicios profesionales en ${profile.ciudad || 'tu zona'}. Contacta ahora.`;

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
      
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(createPageUrl("Search"))}
            className="mb-6 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>

          {/* Header Section */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Profile Picture */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-gray-100 bg-gray-50">
                  {professionalUser?.profile_picture ? (
                    <OptimizedImage 
                      src={professionalUser.profile_picture} 
                      alt={profile.business_name}
                      className="w-full h-full"
                      objectFit="cover"
                      priority={true}
                      width={112}
                      height={112}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 text-white text-3xl font-bold">
                      {profile.business_name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  {profile.business_name}
                </h1>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {profile.categories?.slice(0, 2).map((cat, idx) => (
                    <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
                      {cat}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  {profile.ciudad && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      <span>{profile.ciudad}</span>
                    </div>
                  )}
                  
                  {profile.average_rating > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-gray-900">{profile.average_rating.toFixed(1)}</span>
                      <span className="text-gray-500">({profile.total_reviews})</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Favorite Button */}
              <Button
                onClick={handleToggleFavorite}
                variant="ghost"
                size="icon"
                className={`flex-shrink-0 ${isFavorite ? 'text-red-500' : 'text-gray-400'}`}
              >
                <Heart className={`w-6 h-6 ${isFavorite ? 'fill-red-500' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Contact Buttons */}
          <div className="mb-6" onClick={trackContactClick}>
            <ContactButtons
              phone={profile.telefono_contacto}
              businessName={profile.business_name}
              enablePhone={profile.metodos_contacto?.includes('telefono')}
              enableWhatsApp={profile.metodos_contacto?.includes('whatsapp')}
              enableChat={true}
              onChatClick={handleStartChat}
              size="lg"
              layout="inline"
            />
          </div>

          {/* Short Description */}
          {profile.descripcion_corta && (
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <p className="text-gray-700 leading-relaxed">
                {profile.descripcion_corta}
              </p>
            </div>
          )}

          {/* Main Information */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              Información principal
            </h2>
            
            <div className="space-y-4">
              {profile.service_area && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Zona de trabajo</p>
                    <p className="font-medium text-gray-900">{profile.service_area}</p>
                  </div>
                </div>
              )}
              
              {profile.activity_other && (
                <div className="flex items-start gap-3">
                  <Briefcase className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Especialidad</p>
                    <p className="font-medium text-gray-900">{profile.activity_other}</p>
                  </div>
                </div>
              )}

              {profile.tarifa_base > 0 && (
                <div className="flex items-start gap-3">
                  <Euro className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Tarifa media</p>
                    <p className="font-medium text-gray-900">{profile.tarifa_base}€/hora</p>
                  </div>
                </div>
              )}

              {profile.website && (
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Sitio web</p>
                    <a 
                      href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      Visitar sitio web
                    </a>
                  </div>
                </div>
              )}

              {/* Social Links */}
              {(profile.social_links?.facebook || profile.social_links?.instagram || profile.social_links?.linkedin || profile.social_links?.tiktok) && (
                <div className="pt-2">
                  <p className="text-sm text-gray-500 mb-3">Redes sociales</p>
                  <div className="flex gap-3">
                    {profile.social_links?.facebook && (
                      <a 
                        href={profile.social_links.facebook}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white transition-colors"
                        aria-label="Facebook"
                      >
                        <Facebook className="w-5 h-5" />
                      </a>
                    )}
                    {profile.social_links?.instagram && (
                      <a 
                        href={profile.social_links.instagram}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 hover:opacity-90 flex items-center justify-center text-white transition-opacity"
                        aria-label="Instagram"
                      >
                        <Instagram className="w-5 h-5" />
                      </a>
                    )}
                    {profile.social_links?.linkedin && (
                      <a 
                        href={profile.social_links.linkedin}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-blue-700 hover:bg-blue-800 flex items-center justify-center text-white transition-colors"
                        aria-label="LinkedIn"
                      >
                        <Linkedin className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Schedule */}
          {(profile.disponibilidad_tipo && profile.horario_apertura && profile.horario_cierre) && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Horario
              </h2>
              <div className="space-y-2">
                <p className="text-gray-700">
                  {profile.disponibilidad_tipo === "laborables" && "Lunes a Viernes"}
                  {profile.disponibilidad_tipo === "festivos" && "Sábados, domingos y festivos"}
                  {profile.disponibilidad_tipo === "ambos" && "Todos los días"}
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {profile.horario_apertura} - {profile.horario_cierre}
                </p>
              </div>

              {profile.certifications && profile.certifications.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-3">Certificaciones</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.certifications.map((cert, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-sm text-gray-700">
                        <Award className="w-4 h-4" />
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Full Description */}
          {profile.description && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Sobre mí</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {profile.description}
              </p>
            </div>
          )}

          {/* Photo Gallery */}
          {profile.photos && profile.photos.length > 0 && (
            <div className="mb-6">
              <PhotoGallery photos={profile.photos} businessName={profile.business_name} />
            </div>
          )}

          {/* Reviews */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <ReviewSection professionalId={professionalId} reviews={reviews} currentUser={user} />
          </div>
        </div>
      </div>
    </>
  );
}
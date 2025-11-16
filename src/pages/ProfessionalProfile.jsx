
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Globe,
  Facebook,
  Instagram,
  Linkedin,
  Star,
  MessageSquare,
  Heart,
  FileText,
  Phone,
  MessageCircle,
  Loader2
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import ReviewSection from "../components/profile/ReviewSection.jsx";
import PhotoGallery from "../components/profile/PhotoGallery.jsx";
import OptimizedImage from "../components/ui/OptimizedImage";
import AvailabilityBadge from "../components/profile/AvailabilityBadge";
import { useLanguage } from "../components/ui/LanguageSwitcher";
import SEOHead from "../components/seo/SEOHead";

export default function ProfessionalProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const urlParams = new URLSearchParams(window.location.search);
  const professionalId = urlParams.get('id');
  const [user, setUser] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user && professionalId) {
      checkFavorite();
    }
  }, [user, professionalId]);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const checkFavorite = async () => {
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

  const { data: favoriteCount = 0 } = useQuery({
    queryKey: ['favoriteCount', professionalId],
    queryFn: async () => {
      const favorites = await base44.entities.Favorite.filter({
        professional_id: professionalId
      });
      return favorites.length;
    },
    enabled: !!professionalId,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 10,
    initialData: 0,
  });

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
          setIsFavorite(false);
        }
      } else {
        await base44.entities.Favorite.create({
          client_id: user.id,
          professional_id: professionalId,
          business_name: profile.business_name
        });
        setIsFavorite(true);
      }

      queryClient.invalidateQueries({ queryKey: ['favoriteCount', professionalId] });
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleStartChat = async () => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }

    const businessName = profile.business_name;

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
            professional_name: businessName,
            client_name: user.full_name || user.email,
            is_read: false
        });
    }

    navigate(createPageUrl("Messages") + `?conversation=${conversationId}&professional=${professionalId}`);
  };

  const formatPhoneForCall = (phone) => {
    if (!phone) return null;
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (!cleaned.startsWith('+') && cleaned.length === 9) {
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

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['profile', professionalId],
    queryFn: async () => {
      console.log('🔍 Cargando perfil para:', professionalId);
      const profiles = await base44.entities.ProfessionalProfile.filter({
        user_id: professionalId
      });
      console.log('✅ Perfil encontrado:', profiles[0]);
      return profiles[0];
    },
    enabled: !!professionalId,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 15,
  });

  const { data: professionalUser } = useQuery({
    queryKey: ['professionalUser', professionalId],
    queryFn: async () => {
      const users = await base44.entities.User.filter({ id: professionalId });
      return users[0];
    },
    enabled: !!professionalId,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 15,
  });

  const { data: reviews = [], isLoading: loadingReviews } = useQuery({
    queryKey: ['reviews', professionalId],
    queryFn: async () => {
      console.log('🔍 [REVIEWS] Intentando cargar reviews para professional_id:', professionalId);
      console.log('🔍 [REVIEWS] User actual:', user?.email || 'SIN LOGIN');
      
      try {
        const allReviewsInDB = await base44.entities.Review.list();
        console.log('📊 [REVIEWS] Total reviews en DB:', allReviewsInDB.length);
        console.log('📊 [REVIEWS] Todas las reviews:', allReviewsInDB);
        
        const filteredReviews = allReviewsInDB.filter(r => r.professional_id === professionalId);
        console.log('✅ [REVIEWS] Reviews filtradas para este profesional:', filteredReviews.length);
        console.log('✅ [REVIEWS] Datos:', filteredReviews);
        
        return filteredReviews;
      } catch (error) {
        console.error('❌ [REVIEWS] Error cargando reviews:', error);
        return [];
      }
    },
    enabled: !!professionalId,
    initialData: [],
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
  });

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-64 w-full mb-6" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="max-w-6xl mx-auto text-center py-16">
          <h2 className="text-2xl font-bold text-gray-900">{t('noResults')}</h2>
        </div>
      </div>
    );
  }

  console.log('📊 Renderizando perfil con', reviews.length, 'reviews');

  // Structured Data for Google (JSON-LD)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": profile.business_name,
    "description": profile.descripcion_corta || profile.description,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": profile.ciudad,
      "addressRegion": profile.provincia,
      "addressCountry": "ES"
    },
    "telephone": profile.telefono_contacto,
    "email": profile.email_contacto,
    ...(profile.average_rating > 0 && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": profile.average_rating,
        "reviewCount": profile.total_reviews,
        "bestRating": 5,
        "worstRating": 1
      }
    }),
    ...(profile.website && { "url": profile.website }),
    "priceRange": profile.price_range || "€€",
    "image": profile.photos?.[0] || professionalUser?.profile_picture
  };

  return (
    <>
      <SEOHead 
        title={`${profile.business_name} - ${profile.categories?.[0] || 'Profesional'} en ${profile.ciudad} | MisAutónomos`}
        description={profile.descripcion_corta || `${profile.business_name}: ${profile.categories?.join(', ')} en ${profile.ciudad}, ${profile.provincia}. Contacta ahora.`}
        image={profile.photos?.[0] || professionalUser?.profile_picture}
        keywords={`${profile.business_name}, ${profile.categories?.join(', ')}, ${profile.ciudad}, ${profile.provincia}, autónomo, profesional, ${profile.categories?.[0]}`}
        type="profile"
        author={profile.business_name}
      />
      
      {/* Structured Data para Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <header className="relative h-64 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700">
          {profile.photos?.[0] && (
            <OptimizedImage
              src={profile.photos[0]}
              alt={`${profile.business_name} - ${profile.categories?.[0] || 'Trabajos'}`}
              className="w-full h-full absolute inset-0 opacity-30"
              objectFit="cover"
              priority={true}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 to-transparent" />

          <div className="absolute top-6 left-6">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => navigate(createPageUrl("Search"))}
              className="bg-white/90 hover:bg-white"
              aria-label={t('back')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 -mt-20 pb-12">
          <Card className="mb-6 shadow-2xl border-0">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <Avatar className="w-24 h-24 border-4 border-white shadow-xl">
                  {professionalUser?.profile_picture ? (
                    <OptimizedImage
                      src={professionalUser.profile_picture} 
                      alt={`Foto de perfil de ${profile.business_name}`}
                      className="w-full h-full"
                      objectFit="cover"
                      width={96}
                      height={96}
                      priority={true}
                    />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-800 text-white text-3xl font-bold">
                      {profile.business_name?.charAt(0)}
                    </AvatarFallback>
                  )}
                </Avatar>

                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {profile.business_name}
                      </h1>
                      
                      <div className="mb-3">
                        <AvailabilityBadge profile={profile} />
                      </div>

                      {profile.average_rating > 0 && (
                        <div className="flex items-center gap-2" aria-label={`${profile.average_rating} de 5 estrellas`}>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-5 h-5 ${
                                  star <= profile.average_rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-gray-300"
                                }`}
                                aria-hidden="true"
                              />
                            ))}
                          </div>
                          <span className="text-lg font-semibold text-gray-700">
                            {profile.average_rating.toFixed(1)}
                          </span>
                          <span className="text-gray-500">
                            ({profile.total_reviews} {profile.total_reviews === 1 ? t('review') : t('reviews')})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <nav className="flex flex-wrap gap-2 mt-4" aria-label="Opciones de contacto">
                    <div className="relative">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleToggleFavorite}
                        className={`transition-all ${
                          isFavorite
                            ? 'bg-red-50 border-red-300 hover:bg-red-100'
                            : 'hover:bg-gray-50'
                        }`}
                        aria-label={isFavorite ? 'Eliminar de favoritos' : 'Añadir a favoritos'}
                      >
                        <Heart
                          className={`w-5 h-5 transition-all ${
                            isFavorite
                              ? 'fill-red-500 text-red-500 scale-110'
                              : 'text-gray-400'
                          }`}
                        />
                      </Button>

                      {favoriteCount > 0 && (
                        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg" aria-label={`${favoriteCount} personas han guardado este perfil`}>
                          {favoriteCount}
                        </div>
                      )}
                    </div>

                    {profile.telefono_contacto && profile.metodos_contacto?.includes('telefono') && (
                      <a href={`tel:${formatPhoneForCall(profile.telefono_contacto)}`} aria-label={`Llamar a ${profile.business_name}`}>
                        <Button variant="outline" className="hover:bg-blue-50 hover:border-blue-600 hover:text-blue-600">
                          <Phone className="w-5 h-5 mr-2" />
                          {t('call')}
                        </Button>
                      </a>
                    )}
                    
                    {profile.telefono_contacto && profile.metodos_contacto?.includes('whatsapp') && (
                      <a
                        href={`https://wa.me/${formatPhoneForWhatsApp(profile.telefono_contacto)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Contactar por WhatsApp a ${profile.business_name}`}
                      >
                        <Button className="bg-green-600 hover:bg-green-700">
                          <MessageCircle className="w-5 h-5 mr-2" />
                          {t('whatsapp')}
                        </Button>
                      </a>
                    )}
                    
                    <Button
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={handleStartChat}
                      aria-label={`Enviar mensaje a ${profile.business_name}`}
                    >
                      <MessageSquare className="w-5 h-5 mr-2" />
                      {t('chat')}
                    </Button>
                  </nav>

                  <div className="flex flex-wrap gap-2 mb-4 mt-4">
                    {profile.categories?.map((cat, idx) => (
                      <Badge key={idx} className="bg-blue-100 text-blue-900">
                        {t(cat)}
                      </Badge>
                    ))}
                    {profile.activity_other && (
                      <Badge className="bg-purple-100 text-purple-900">
                        {profile.activity_other}
                      </Badge>
                    )}
                    {profile.price_range && (
                      <Badge className="bg-orange-100 text-orange-800">
                        {profile.price_range}
                      </Badge>
                    )}
                  </div>

                  <p className="text-gray-700 text-lg leading-relaxed">
                    {profile.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <PhotoGallery photos={profile.photos || []} />

              {loadingReviews ? (
                <Card className="shadow-lg border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-700" />
                      <span>{t('loading')}</span>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <ReviewSection
                  reviews={reviews}
                  professionalId={professionalId}
                  currentUser={user}
                />
              )}
            </div>

            <aside className="space-y-6">
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-700" />
                    {t('information')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profile.service_area && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" aria-hidden="true" />
                      <div>
                        <p className="text-sm text-gray-500">{t('workArea')}</p>
                        <p className="font-medium text-gray-900">{profile.service_area}</p>
                      </div>
                    </div>
                  )}

                  {profile.disponibilidad_tipo && profile.horario_apertura && profile.horario_cierre && (
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-gray-400 mt-0.5" aria-hidden="true" />
                      <div>
                        <p className="text-sm text-gray-500">{t('schedule')}</p>
                        <p className="font-medium text-gray-900">
                          {profile.disponibilidad_tipo === 'laborables' && t('mondayFriday')}
                          {profile.disponibilidad_tipo === 'festivos' && t('weekends')}
                          {profile.disponibilidad_tipo === 'ambos' && t('everyday')}
                          {' · '}
                          {profile.horario_apertura} – {profile.horario_cierre}
                        </p>
                      </div>
                    </div>
                  )}

                  {profile.tarifa_base && profile.tarifa_base > 0 && (
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 flex items-center justify-center text-gray-400 mt-0.5" aria-hidden="true">
                        <span className="text-lg">€</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">{t('averageRate')}</p>
                        <p className="font-medium text-gray-900">{profile.tarifa_base}€/h</p>
                      </div>
                    </div>
                  )}

                  {professionalUser?.email && (
                    <div className="flex items-start gap-3">
                      <MessageSquare className="w-5 h-5 text-gray-400 mt-0.5" aria-hidden="true" />
                      <div>
                        <p className="text-sm text-gray-500">{t('email')}</p>
                        <p className="font-medium text-gray-900">{professionalUser.email}</p>
                      </div>
                    </div>
                  )}

                  {profile.telefono_contacto && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-gray-400 mt-0.5" aria-hidden="true" />
                      <div>
                        <p className="text-sm text-gray-500">{t('phone')}</p>
                        <p className="font-medium text-gray-900">{profile.telefono_contacto}</p>
                      </div>
                    </div>
                  )}

                  <Separator />

                  {profile.website && (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-700 hover:text-blue-900 transition-colors"
                      aria-label={`Visitar sitio web de ${profile.business_name}`}
                    >
                      <Globe className="w-4 h-4" />
                      <span className="font-medium">{t('visitWebsite')}</span>
                    </a>
                  )}

                  {profile.social_links && (
                    <div className="flex gap-3" role="navigation" aria-label="Redes sociales">
                      {profile.social_links.facebook && (
                        <a
                          href={profile.social_links.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                          aria-label="Facebook"
                        >
                          <Facebook className="w-6 h-6" />
                        </a>
                      )}
                      {profile.social_links.instagram && (
                        <a
                          href={profile.social_links.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-pink-600 hover:text-pink-700"
                          aria-label="Instagram"
                        >
                          <Instagram className="w-6 h-6" />
                        </a>
                      )}
                      {profile.social_links.linkedin && (
                        <a
                          href={profile.social_links.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-700 hover:text-blue-800"
                          aria-label="LinkedIn"
                        >
                          <Linkedin className="w-6 h-6" />
                        </a>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {profile.cif_nif && (
                <Card className="shadow-lg border-0 bg-gray-50">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-gray-500">CIF / NIF</p>
                    <p className="font-mono font-semibold text-gray-900">{profile.cif_nif}</p>
                  </CardContent>
                </Card>
              )}
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}

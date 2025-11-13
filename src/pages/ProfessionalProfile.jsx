
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

export default function ProfessionalProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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

    // Define businessName from profile to be used in message creation
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
        // Intentar cargar TODAS las reviews sin filtro primero para debug
        const allReviewsInDB = await base44.entities.Review.list();
        console.log('📊 [REVIEWS] Total reviews en DB:', allReviewsInDB.length);
        console.log('📊 [REVIEWS] Todas las reviews:', allReviewsInDB);
        
        // Ahora filtrar por professional_id
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
    staleTime: 0, // Sin caché para debug
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
          <h2 className="text-2xl font-bold text-gray-900">Perfil no encontrado</h2>
        </div>
      </div>
    );
  }

  console.log('📊 Renderizando perfil con', reviews.length, 'reviews');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header with Cover */}
      <div className="relative h-64 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700">
        {profile.photos?.[0] && (
          <OptimizedImage
            src={profile.photos[0]}
            alt={profile.business_name}
            className="w-full h-full absolute inset-0 opacity-30 object-cover"
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
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-20 pb-12">
        {/* Main Info Card */}
        <Card className="mb-6 shadow-2xl border-0">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* ✅ MODIFICADO: Avatar con foto de perfil */}
              <Avatar className="w-24 h-24 border-4 border-white shadow-xl">
                {professionalUser?.profile_picture ? (
                  <img 
                    src={professionalUser.profile_picture} 
                    alt={profile.business_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-800 text-white text-3xl font-bold">
                    {profile.business_name?.charAt(0)}
                  </AvatarFallback>
                )}
              </Avatar>

              <div className="flex-1">
                {/* Name and Rating */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {profile.business_name}
                    </h1>
                    
                    {/* ✅ NUEVO: Badge de disponibilidad dinámica */}
                    <div className="mb-3">
                      <AvailabilityBadge profile={profile} />
                    </div>

                    {profile.average_rating > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-5 h-5 ${
                                star <= profile.average_rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-lg font-semibold text-gray-700">
                          {profile.average_rating.toFixed(1)}
                        </span>
                        <span className="text-gray-500">
                          ({profile.total_reviews} {profile.total_reviews === 1 ? 'opinión' : 'opiniones'})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ✅ MODIFICADO: Botones de contacto según preferencias */}
                <div className="flex flex-wrap gap-2 mt-4">
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
                      <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                        {favoriteCount}
                      </div>
                    )}
                  </div>

                  {/* ✅ NUEVO: Mostrar solo botones según metodos_contacto */}
                  {profile.telefono_contacto && profile.metodos_contacto?.includes('telefono') && (
                    <a href={`tel:${formatPhoneForCall(profile.telefono_contacto)}`}>
                      <Button variant="outline" className="hover:bg-blue-50 hover:border-blue-600 hover:text-blue-600">
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
                    >
                      <Button className="bg-green-600 hover:bg-green-700">
                        <MessageCircle className="w-5 h-5 mr-2" />
                        WhatsApp
                      </Button>
                    </a>
                  )}
                  
                  {/* Chat interno siempre disponible (por defecto) */}
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={handleStartChat}
                  >
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Chat directo
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 mb-4 mt-4">
                  {profile.categories?.map((cat, idx) => (
                    <Badge key={idx} className="bg-blue-100 text-blue-900">
                      {cat}
                    </Badge>
                  ))}
                  {/* ✅ NUEVO: Mostrar activity_other si existe */}
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
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            <PhotoGallery photos={profile.photos || []} />

            {loadingReviews ? (
              <Card className="shadow-lg border-0">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-700" />
                    <span>Cargando opiniones...</span>
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

          {/* Right Column - Contact Info */}
          <div className="space-y-6">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-700" />
                  Información
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.service_area && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Zona de trabajo</p>
                      <p className="font-medium text-gray-900">{profile.service_area}</p>
                    </div>
                  </div>
                )}

                {/* ✅ NUEVO: Mostrar horario dinámico */}
                {profile.disponibilidad_tipo && profile.horario_apertura && profile.horario_cierre && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Horario</p>
                      <p className="font-medium text-gray-900">
                        {profile.disponibilidad_tipo === 'laborables' && 'Lunes a Viernes'}
                        {profile.disponibilidad_tipo === 'festivos' && 'Sábados, domingos y festivos'}
                        {profile.disponibilidad_tipo === 'ambos' && 'Todos los días'}
                        {' · '}
                        {profile.horario_apertura} – {profile.horario_cierre}
                      </p>
                    </div>
                  </div>
                )}

                {/* ✅ NUEVO: Mostrar tarifa solo si existe */}
                {profile.tarifa_base && profile.tarifa_base > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 flex items-center justify-center text-gray-400 mt-0.5">
                      <span className="text-lg">€</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Tarifa media</p>
                      <p className="font-medium text-gray-900">{profile.tarifa_base}€/h</p>
                    </div>
                  </div>
                )}

                {professionalUser?.email && (
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">{professionalUser.email}</p>
                    </div>
                  </div>
                )}

                {profile.telefono_contacto && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Teléfono</p>
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
                  >
                    <Globe className="w-4 h-4" />
                    <span className="font-medium">Visitar sitio web</span>
                  </a>
                )}

                {profile.social_links && (
                  <div className="flex gap-3">
                    {profile.social_links.facebook && (
                      <a
                        href={profile.social_links.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700"
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
          </div>
        </div>
      </div>
    </div>
  );
}

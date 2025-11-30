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
  AlertCircle,
  X,
  Music,
  Copy,
  Check,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BadgeCheck,
  Briefcase
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ReviewSection from "../components/profile/ReviewSection";
import SEOHead from "../components/seo/SEOHead";
import { LocalBusinessSchema, FAQPageSchema, ProfessionalPersonSchema, BreadcrumbSchema } from "../components/seo/StructuredData";
import { toast } from "sonner";
import { useLanguage } from "../components/ui/LanguageSwitcher";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Función para generar slug limpio (sin acentos, sin IDs)
function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/ñ/g, 'n')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

// Limpiar slug antiguo que puede tener IDs o acentos
function cleanOldSlug(slug) {
  if (!slug) return '';
  // Eliminar IDs hexadecimales al final (ej: -5e8405)
  let cleaned = slug.replace(/-[a-f0-9]{6,}$/i, '');
  // Aplicar slugify para limpiar acentos
  return slugify(cleaned);
}

export default function AutonomoPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Leer slug de query params
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get("slug");

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    }
  };

  // Buscar perfil por slug con soporte de redirección de slugs antiguos
  const { data: profileData, isLoading: loadingProfile } = useQuery({
    queryKey: ['autonomoBySlug', slug],
    queryFn: async () => {
      if (!slug) return { profile: null, redirect: null };
      
      const allProfiles = await base44.entities.ProfessionalProfile.list();
      const cleanedInputSlug = slugify(slug); // Limpiar el slug de entrada
      
      // 1. Buscar por slug_publico exacto (slug ya migrado)
      let found = allProfiles.find(p => p.slug_publico === slug);
      if (found) return { profile: found, redirect: null };
      
      // 2. Buscar por slug limpio (sin acentos/IDs) 
      found = allProfiles.find(p => p.slug_publico === cleanedInputSlug);
      if (found) {
        // Redirigir al slug correcto
        return { profile: found, redirect: found.slug_publico };
      }
      
      // 3. Buscar por slug generado del nombre actual
      found = allProfiles.find(p => slugify(p.business_name) === cleanedInputSlug);
      if (found) {
        return { profile: found, redirect: found.slug_publico || slugify(found.business_name) };
      }
      
      // 4. Buscar slugs antiguos con IDs (ej: juan-perez-5e8405 → juan-perez)
      const baseSlugFromInput = cleanOldSlug(slug);
      if (baseSlugFromInput !== cleanedInputSlug) {
        found = allProfiles.find(p => {
          const profileBaseSlug = slugify(p.business_name);
          return profileBaseSlug === baseSlugFromInput;
        });
        if (found) {
          return { profile: found, redirect: found.slug_publico || slugify(found.business_name) };
        }
      }
      
      // 5. Búsqueda flexible por coincidencia parcial (último recurso)
      found = allProfiles.find(p => {
        const nameSlug = slugify(p.business_name);
        return nameSlug.startsWith(cleanedInputSlug) || cleanedInputSlug.startsWith(nameSlug);
      });
      if (found) {
        return { profile: found, redirect: found.slug_publico || slugify(found.business_name) };
      }
      
      return { profile: null, redirect: null };
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  });

  const profile = profileData?.profile;
  const redirectSlug = profileData?.redirect;

  // Redirigir automáticamente a slug limpio si es diferente
  useEffect(() => {
    if (redirectSlug && redirectSlug !== slug && profile) {
      // Actualizar URL sin recargar la página (redirección 301 conceptual)
      const newUrl = createPageUrl("Autonomo") + `?slug=${redirectSlug}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, [redirectSlug, slug, profile]);

  const { data: professionalUser } = useQuery({
    queryKey: ['professionalUser', profile?.user_id],
    queryFn: async () => {
      const users = await base44.entities.User.filter({ id: profile.user_id });
      return users[0];
    },
    enabled: !!profile?.user_id,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', profile?.user_id],
    queryFn: async () => {
      const allReviews = await base44.entities.Review.filter({ professional_id: profile.user_id });
      return allReviews.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: !!profile?.user_id,
  });

  // Verificar favorito
  useEffect(() => {
    if (user && profile) {
      checkFavorite();
    }
  }, [user, profile]);

  const checkFavorite = async () => {
    try {
      const favs = await base44.entities.Favorite.filter({
        client_id: user.id,
        professional_id: profile.user_id
      });
      setIsFavorite(favs.length > 0);
    } catch (error) {
      console.error("Error checking favorite:", error);
    }
  };

  // Trackear vista
  useEffect(() => {
    if (profile?.user_id && user) {
      trackProfileView();
    }
  }, [profile?.user_id, user]);

  const trackProfileView = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const metrics = await base44.entities.ProfileMetrics.filter({
        professional_id: profile.user_id,
        date: today
      });

      if (metrics.length > 0) {
        await base44.entities.ProfileMetrics.update(metrics[0].id, {
          profile_views: (metrics[0].profile_views || 0) + 1
        });
      } else {
        await base44.entities.ProfileMetrics.create({
          professional_id: profile.user_id,
          date: today,
          profile_views: 1
        });
      }
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      const currentUrl = window.location.href;
      base44.auth.redirectToLogin(currentUrl);
      return;
    }

    try {
      if (isFavorite) {
        const favs = await base44.entities.Favorite.filter({
          client_id: user.id,
          professional_id: profile.user_id
        });
        if (favs[0]) await base44.entities.Favorite.delete(favs[0].id);
        setIsFavorite(false);
        toast.success(t('removedFromFavorites') || "Eliminado de favoritos");
      } else {
        await base44.entities.Favorite.create({
          client_id: user.id,
          professional_id: profile.user_id,
          business_name: profile.business_name
        });
        setIsFavorite(true);
        toast.success(t('addedToFavorites') || "Añadido a favoritos");
      }
    } catch (error) {
      toast.error("Error al gestionar favoritos");
    }
  };

  const handleStartChat = async () => {
    if (!user) {
      // Guardar URL actual para regresar después del login
      const currentUrl = window.location.href;
      base44.auth.redirectToLogin(currentUrl);
      return;
    }
    const conversationId = [user.id, profile.user_id].sort().join('_');
    navigate(createPageUrl("Messages") + `?conversation=${conversationId}&professional=${profile.user_id}`);
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
      if (!cleaned.startsWith('+')) cleaned = '+34' + cleaned;
      window.location.href = `tel:${cleaned}`;
    } else {
      setShowPhoneModal(true);
    }
  };

  const handleWhatsAppClick = () => {
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
              {t('profileNotFound') || 'Perfil no encontrado'}
            </h2>
            <p className="text-gray-600 mb-6">
              {t('profileNotFoundDescription') || 'El profesional que buscas no existe o ya no está disponible.'}
            </p>
            <Button onClick={() => navigate(createPageUrl("Search"))} className="bg-blue-600 hover:bg-blue-700">
              {t('backToSearch') || 'Volver a búsqueda'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // SEO optimizado
  const canonicalSlug = profile.slug_publico || slugify(profile.business_name);
  const canonicalUrl = `https://misautonomos.es/Autonomo?slug=${canonicalSlug}`;

  // Título SEO optimizado (máx 60 caracteres ideal)
  const categoryName = profile.categories?.[0] || 'Profesional';
  const locationName = profile.ciudad || profile.provincia || 'España';
  const seoTitle = `${profile.business_name} - ${categoryName} en ${locationName} | MisAutónomos`;

  // Descripción SEO optimizada (máx 160 caracteres ideal)
  const ratingText = profile.average_rating > 0 ? `★${profile.average_rating.toFixed(1)} (${profile.total_reviews} opiniones). ` : '';
  const experienceText = profile.years_experience > 0 ? `${profile.years_experience} años de experiencia. ` : '';
  const baseDescription = profile.descripcion_corta || `Servicios de ${categoryName.toLowerCase()} en ${locationName}`;
  const seoDescription = `${ratingText}${experienceText}${baseDescription}. Contacta gratis con ${profile.business_name}.`.slice(0, 160);

  // Keywords dinámicas
  const seoKeywords = [
    profile.business_name,
    categoryName,
    categoryName.toLowerCase(),
    locationName,
    profile.provincia,
    'autónomo',
    'profesional',
    ...(profile.skills || []),
    ...(profile.categories || [])
  ].filter(Boolean).join(', ');

  // Schema FAQ para el perfil si tiene FAQ items
  const profileFaqData = profile.faq_items?.filter(f => f.question && f.answer).map(f => ({
    question: f.question,
    answer: f.answer
  })) || [];

  // Breadcrumb items para SEO
  const breadcrumbItems = [
    { name: "Inicio", url: "https://misautonomos.es" },
    { name: "Buscar Profesionales", url: "https://misautonomos.es/Search" },
    { name: categoryName, url: `https://misautonomos.es/Categoria?name=${slugify(categoryName)}` },
    { name: profile.business_name, url: canonicalUrl }
  ];

  const showPhone = profile.metodos_contacto?.includes('telefono') && profile.telefono_contacto;
  const showWhatsApp = profile.metodos_contacto?.includes('whatsapp') && profile.telefono_contacto;
  const showChat = profile.metodos_contacto?.includes('chat_interno');

  return (
    <>
      <SEOHead 
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        type="profile"
        image={professionalUser?.profile_picture || profile.imagen_principal || profile.photos?.[0]}
      />
      

      
      {/* Schema.org estructurados para SEO */}
      <LocalBusinessSchema 
        profile={profile}
        reviews={reviews}
        professionalUser={professionalUser}
      />

      <ProfessionalPersonSchema 
        profile={profile}
        professionalUser={professionalUser}
      />

      <BreadcrumbSchema items={breadcrumbItems} />

      {/* FAQ Schema si el perfil tiene FAQs */}
      {profileFaqData.length > 0 && (
        <FAQPageSchema faqs={profileFaqData} />
      )}
      
      <div className="min-h-screen bg-gray-50 py-3 px-3 md:py-4 md:px-4">
        <div className="max-w-5xl mx-auto space-y-3">
          
          <Button
            onClick={() => navigate(createPageUrl("Search"))}
            variant="ghost"
            className="hover:bg-white mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('backToSearch') || 'Volver a búsqueda'}
          </Button>
          
          {/* CABECERA */}
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
                    <AvatarImage src={photoUrl} alt={profile.business_name} className="object-cover" />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xl font-bold">
                      {profile.business_name?.charAt(0)}
                    </AvatarFallback>
                  );
                })()}
              </Avatar>
              
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-900 mb-1">{profile.business_name}</h1>
                
                <div className="flex items-center gap-2 mb-1">
                  {profile.categories?.[0] && (
                    <Badge className="bg-blue-50 text-blue-700 text-xs">{profile.categories[0]}</Badge>
                  )}
                  {profile.total_reviews > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-semibold">{profile.average_rating?.toFixed(1)}</span>
                      <span className="text-xs text-gray-500">({profile.total_reviews})</span>
                    </div>
                  )}
                </div>

                {(profile.ciudad || profile.provincia) && (
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <MapPin className="w-3 h-3" />
                    {profile.ciudad ? `${profile.ciudad}, ${profile.provincia}` : profile.provincia}
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

            {/* BOTONES CONTACTO */}
            <TooltipProvider>
              <div className="flex gap-2">
                {showPhone && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a href={`tel:${profile.telefono_contacto?.replace(/[^\d+]/g, '').startsWith('+') ? profile.telefono_contacto.replace(/[^\d+]/g, '') : '+34' + profile.telefono_contacto.replace(/[^\d+]/g, '')}`} className="flex-1">
                        <Button variant="outline" className="w-full h-9 text-sm hover:bg-blue-50">
                          <Phone className="w-4 h-4 mr-1" />
                          {t('call') || 'Llamar'}
                        </Button>
                      </a>
                    </TooltipTrigger>
                    <TooltipContent><p>Llamar por teléfono</p></TooltipContent>
                  </Tooltip>
                )}
                
                {showWhatsApp && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={handleWhatsAppClick} variant="outline" className="flex-1 h-9 text-sm hover:bg-green-50">
                        <MessageCircle className="w-4 h-4 mr-1 text-green-600" />
                        WhatsApp
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Contactar por WhatsApp</p></TooltipContent>
                  </Tooltip>
                )}
                
                {showChat && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={handleStartChat} className="flex-1 bg-blue-600 hover:bg-blue-700 h-9 text-sm">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        {t('chat') || 'Chat'}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Enviar mensaje directo</p></TooltipContent>
                  </Tooltip>
                )}
              </div>
            </TooltipProvider>
          </Card>

          {/* DESCRIPCIÓN */}
          <Card className="border-0 shadow-sm rounded-xl bg-white p-4">
            {profile.descripcion_corta && (
              <p className="text-sm text-gray-700 mb-3">{profile.descripcion_corta}</p>
            )}
            {profile.description && profile.description !== profile.descripcion_corta && (
              <p className="text-sm text-gray-600">{profile.description}</p>
            )}

            {(profile.years_experience > 0 || profile.tarifa_base > 0) && (
              <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100 mt-3">
                {profile.years_experience > 0 && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1">
                    <Briefcase className="w-3.5 h-3.5 mr-1.5" />
                    {profile.years_experience} años de experiencia
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

          {/* HABILIDADES */}
          {profile.skills && profile.skills.length > 0 && (
            <Card className="border-0 shadow-sm rounded-xl bg-white p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                Habilidades
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill, idx) => (
                  <Badge 
                    key={idx} 
                    className="bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1.5 text-sm"
                  >
                    <Sparkles className="w-3 h-3 mr-1.5" />
                    {skill}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* CERTIFICACIONES */}
          {profile.certifications && profile.certifications.length > 0 && (
            <Card className="border-0 shadow-sm rounded-xl bg-white p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-amber-600" />
                Certificaciones y Títulos
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.certifications.map((cert, idx) => (
                  <Badge 
                    key={idx} 
                    className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 text-sm"
                  >
                    <Award className="w-3 h-3 mr-1.5" />
                    {cert}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* GALERÍA */}
          {profile.photos && profile.photos.length > 0 && (
            <Card className="border-0 shadow-sm rounded-xl bg-white p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3">{t('workGalleryTitle') || 'Galería de trabajos'}</h3>
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
                    <img src={photo} alt={`Trabajo ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* REDES SOCIALES */}
          {(profile.website || profile.social_links?.facebook || profile.social_links?.instagram || profile.social_links?.linkedin) && (
            <Card className="border-0 shadow-sm rounded-xl bg-white p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3">{t('socialNetworks') || 'Redes sociales'}</h3>
              <div className="flex flex-wrap gap-2">
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm"><Globe className="w-4 h-4 mr-2" />Web</Button>
                  </a>
                )}
                {profile.social_links?.facebook && (
                  <a href={profile.social_links.facebook} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm"><Facebook className="w-4 h-4 mr-2 text-blue-600" />Facebook</Button>
                  </a>
                )}
                {profile.social_links?.instagram && (
                  <a href={profile.social_links.instagram} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm"><Instagram className="w-4 h-4 mr-2 text-pink-600" />Instagram</Button>
                  </a>
                )}
                {profile.social_links?.linkedin && (
                  <a href={profile.social_links.linkedin} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm"><Linkedin className="w-4 h-4 mr-2 text-blue-700" />LinkedIn</Button>
                  </a>
                )}
              </div>
            </Card>
          )}

          {/* RESEÑAS */}
          <Card className="border-0 shadow-sm rounded-xl bg-white p-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3">{t('clientReviews') || 'Opiniones de clientes'}</h3>
            <ReviewSection professionalId={profile.user_id} reviews={reviews} currentUser={user} />
          </Card>
        </div>
      </div>

      {/* MODALES */}
      <Dialog open={showPhoneModal} onOpenChange={setShowPhoneModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Número de teléfono</DialogTitle>
            <DialogDescription>{profile.business_name}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 w-full text-center">
              <p className="text-3xl font-bold text-blue-700">{profile.telefono_contacto}</p>
            </div>
            <Button onClick={() => copyToClipboard(profile.telefono_contacto)} variant="outline" className="w-full">
              {copiedPhone ? <><Check className="w-4 h-4 mr-2 text-green-600" />Copiado</> : <><Copy className="w-4 h-4 mr-2" />Copiar número</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showWhatsAppModal} onOpenChange={setShowWhatsAppModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-green-600" />WhatsApp
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="p-4 bg-green-50 rounded-xl border border-green-200 w-full text-center">
              <p className="text-3xl font-bold text-green-700">{profile.telefono_contacto}</p>
            </div>
            <Button
              onClick={() => {
                window.open(`https://wa.me/${formatPhoneForWhatsApp(profile.telefono_contacto)}`, '_blank');
                setShowWhatsAppModal(false);
              }}
              className="w-full bg-green-600 hover:bg-green-700 h-12"
            >
              <MessageCircle className="w-5 h-5 mr-2" />Abrir WhatsApp
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* GALERÍA MODAL */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <button onClick={() => setSelectedImage(null)} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full">
            <X className="w-6 h-6 text-white" />
          </button>
          
          {selectedImageIndex >= 0 && profile.photos?.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newIndex = selectedImageIndex === 0 ? profile.photos.length - 1 : selectedImageIndex - 1;
                  setSelectedImageIndex(newIndex);
                  setSelectedImage(profile.photos[newIndex]);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full"
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
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            </>
          )}
          
          <img src={selectedImage} alt="Vista ampliada" className="max-w-full max-h-full object-contain rounded-xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}
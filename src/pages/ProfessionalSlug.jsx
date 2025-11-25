import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { slugify, generateProfessionalSlug } from "../components/utils/slugUtils";
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
  ArrowLeft,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ReviewSection from "../components/profile/ReviewSection";
import SEOHead from "../components/seo/SEOHead";
import { LocalBusinessSchema } from "../components/seo/StructuredData";
import { toast } from "sonner";
import { useLanguage } from "../components/ui/LanguageSwitcher";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function ProfessionalSlugPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Extraer slug de la URL /autonomo/[slug]
  const pathParts = location.pathname.split('/').filter(Boolean);
  const professionalSlug = pathParts[1];

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

  // Buscar perfil por slug
  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['professionalBySlug', professionalSlug],
    queryFn: async () => {
      const allProfiles = await base44.entities.ProfessionalProfile.list();
      
      // Primero buscar por slug_publico exacto
      let found = allProfiles.find(p => p.slug_publico === professionalSlug);
      
      // Si no se encuentra, intentar generar el slug y comparar
      if (!found) {
        found = allProfiles.find(p => {
          const generatedSlug = generateProfessionalSlug(p.business_name, p.categories?.[0]);
          return generatedSlug === professionalSlug || slugify(p.business_name) === professionalSlug;
        });
      }
      
      return found || null;
    },
    enabled: !!professionalSlug,
    staleTime: 1000 * 60 * 5,
  });

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

  const handleToggleFavorite = async () => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }

    try {
      if (isFavorite) {
        const favs = await base44.entities.Favorite.filter({
          client_id: user.id,
          professional_id: profile.user_id
        });
        if (favs[0]) {
          await base44.entities.Favorite.delete(favs[0].id);
        }
        setIsFavorite(false);
        toast.success("Eliminado de favoritos");
      } else {
        await base44.entities.Favorite.create({
          client_id: user.id,
          professional_id: profile.user_id,
          business_name: profile.business_name
        });
        setIsFavorite(true);
        toast.success("Añadido a favoritos");
      }
    } catch (error) {
      toast.error("Error al gestionar favoritos");
    }
  };

  const handleStartChat = async () => {
    if (!user) {
      base44.auth.redirectToLogin();
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
              Perfil no encontrado
            </h2>
            <p className="text-gray-600 mb-6">
              El profesional que buscas no existe o ya no está disponible.
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

  const showPhone = profile.metodos_contacto?.includes('telefono') && profile.telefono_contacto;
  const showWhatsApp = profile.metodos_contacto?.includes('whatsapp') && profile.telefono_contacto;
  const showChat = profile.metodos_contacto?.includes('chat_interno');

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
          
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            className="hover:bg-white mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          
          {/* CABECERA PERFIL */}
          <Card className="border-0 shadow-sm rounded-xl bg-white p-4">
            <div className="flex items-center gap-4 mb-3">
              <Avatar className="w-14 h-14 border-2 border-gray-100 flex-shrink-0">
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
                      <span className="text-sm font-semibold">{profile.average_rating?.toFixed(1)}</span>
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
                        onClick={handlePhoneClick}
                        variant="outline"
                        className="flex-1 h-9 text-sm hover:bg-blue-50 hover:border-blue-600"
                      >
                        <Phone className="w-4 h-4 mr-1" />
                        Llamar
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Llamar por teléfono</p></TooltipContent>
                  </Tooltip>
                )}
                
                {showWhatsApp && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleWhatsAppClick}
                        variant="outline"
                        className="flex-1 h-9 text-sm hover:bg-green-50 hover:border-green-600"
                      >
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
                      <Button
                        onClick={handleStartChat}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 h-9 text-sm"
                      >
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Chat
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

            {(profile.years_experience > 0 || profile.tarifa_base > 0) && (
              <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                {profile.years_experience > 0 && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1">
                    <Award className="w-3.5 h-3.5 mr-1.5" />
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

          {/* GALERÍA */}
          {profile.photos && profile.photos.length > 0 && (
            <Card className="border-0 shadow-sm rounded-xl bg-white p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Galería de trabajos</h3>
              <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
                {profile.photos.map((photo, idx) => (
                  <div 
                    key={idx} 
                    className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group bg-gray-100"
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

          {/* RESEÑAS */}
          <Card className="border-0 shadow-sm rounded-xl bg-white p-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Opiniones de clientes</h3>
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
              <MessageCircle className="w-6 h-6 text-green-600" />
              WhatsApp
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
          <button onClick={() => setSelectedImage(null)} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full">
            <X className="w-6 h-6 text-white" />
          </button>
          
          {profile.photos.length > 1 && (
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
import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Search as SearchIcon,
  MapPin,
  Heart,
  MessageCircle,
  Phone,
  Star,
  Zap,
  Droplets,
  Hammer,
  HardHat,
  Paintbrush,
  Trees,
  Truck,
  Sparkles,
  Key,
  Wind,
  Wrench,
  MoreHorizontal,
  Waves,
  Copy,
  Check,
  Briefcase,
  MessageSquare,
  FileText,
  Users,
  TrendingUp
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import SEOHead from "../components/seo/SEOHead";
import { ServiceSchema, BreadcrumbSchema } from "../components/seo/StructuredData";
import { useLanguage } from "../components/ui/LanguageSwitcher";
import { useProfileTranslation } from "../components/profile/useProfileTranslation";
import OptimizedImage from "../components/ui/OptimizedImage";
import { PROVINCIAS, CIUDADES_POR_PROVINCIA } from "../components/utils/locationsData";
import SearchAutocomplete from "../components/search/SearchAutocomplete";
import SearchFilters from "../components/search/SearchFilters";
import MapView from "../components/search/MapView";
import SavedSearches from "../components/search/SavedSearches";

// Asegurar que motion está disponible
const MotionDiv = motion.div;

// Función para generar slug limpio (sin acentos, sin IDs aleatorios)
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

// Ubicaciones importadas desde módulo centralizado

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// CAMBIO: React.memo evita re-renders cuando el padre actualiza estado no relacionado
const ProfileCard = React.memo(({ profile, onClick, onToggleFavorite, isFavorite, professionalUser, currentUserId }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  
  // Traducción automática del perfil
  const { translatedProfile } = useProfileTranslation(profile);
  const displayProfile = translatedProfile || profile;

  const formatPhoneForCall = (phone) => {
    if (!phone) return null;
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (!cleaned.startsWith('+')) cleaned = '+34' + cleaned;
    return cleaned;
  };

  const formatPhoneForWhatsApp = (phone) => {
    if (!phone) return null;
    let cleaned = phone.replace(/\D/g, '');
    if (!cleaned.startsWith('34') && cleaned.length === 9) cleaned = '34' + cleaned;
    return cleaned;
  };

  const handleCall = () => {
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      window.location.href = `tel:${formatPhoneForCall(profile.telefono_contacto)}`;
    } else {
      setShowPhoneModal(true);
    }
  };

  const handleWhatsApp = () => {
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      window.open(`https://wa.me/${formatPhoneForWhatsApp(profile.telefono_contacto)}`, '_blank');
    } else {
      setShowWhatsAppModal(true);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedPhone(true);
    toast.success(t('phoneCopied') || "Número copiado");
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const getCategoryIcon = (category) => {
    const icons = {
      "Electricista": Zap, "Fontanero": Droplets, "Carpintero": Hammer,
      "Albañil / Reformas": HardHat, "Pintor": Paintbrush, "Jardinero": Trees,
      "Transportista": Truck, "Autónomo de limpieza": Sparkles, "Cerrajero": Key,
      "Instalador de aire acondicionado": Wind, "Mantenimiento general": Wrench,
      "Mantenimiento de piscinas": Waves
    };
    return icons[category] || MoreHorizontal;
  };

  const CategoryIcon = getCategoryIcon(profile.categories?.[0]);

  // Badge "Responde rápido" si tiene reseñas recientes o rating alto
  const isQuickResponder = profile.average_rating >= 4.5 && profile.total_reviews >= 3;
  // "Nuevo" solo si el perfil se creó hace menos de 30 días
  const profileAge = profile.created_date ? (Date.now() - new Date(profile.created_date).getTime()) / (1000 * 60 * 60 * 24) : 999;
  const isNew = profileAge < 30;

  return (
    <>
      <Card className="bg-white hover:shadow-xl transition-all duration-200 border border-gray-100 rounded-2xl overflow-hidden h-full flex flex-col profile-card group" style={{ minHeight: '240px' }}>
        <CardContent className="p-4 flex flex-col flex-1">
          {/* Badges superiores */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex gap-1.5 flex-wrap">
              {isQuickResponder && (
                <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  Responde rápido
                </span>
              )}
              {isNew && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Nuevo</span>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={onToggleFavorite}
              className={`${isFavorite ? 'text-red-500 hover:text-red-600 hover:bg-red-50' : 'text-gray-300 hover:text-red-500 hover:bg-red-50'} h-7 w-7 flex-shrink-0 -mt-1 -mr-1`}>
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
            </Button>
          </div>

          <div className="flex items-start gap-3 mb-3">
            <Avatar className="w-14 h-14 border-2 border-gray-100 cursor-pointer flex-shrink-0 overflow-hidden rounded-xl" onClick={onClick}>
              {(() => {
                const photoUrl = professionalUser?.profile_picture || profile.imagen_principal;
                return photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={profile.business_name}
                    className="object-cover object-center w-full h-full"
                    width="56"
                    height="56"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <AvatarFallback className="bg-blue-600 text-white font-bold text-lg">
                    {profile.business_name?.charAt(0)?.toUpperCase() || "P"}
                  </AvatarFallback>
                );
              })()}
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors truncate leading-tight mb-1" onClick={onClick}>
                {profile.business_name}
              </h3>
              {profile.categories && profile.categories.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md w-fit mb-1">
                  <CategoryIcon className="w-3 h-3" />
                  <span className="truncate">{t(profile.categories[0]) || profile.categories[0]}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{profile.ciudad ? `${profile.ciudad}, ${profile.provincia}` : profile.provincia}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-3 flex-1">
            <div className="h-[2.5rem] overflow-hidden">
              {displayProfile.descripcion_corta && (
                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{displayProfile.descripcion_corta}</p>
              )}
            </div>
            <div className="flex items-center justify-between">
              {profile.average_rating > 0 ? (
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-bold text-gray-900">{profile.average_rating.toFixed(1)}</span>
                  <span className="text-xs text-gray-500">({profile.total_reviews} {profile.total_reviews === 1 ? 'opinión' : 'opiniones'})</span>
                </div>
              ) : (
                <span className="text-xs text-gray-400">Sin valoraciones aún</span>
              )}
              {profile.tarifa_base > 0 && (
                <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">
                  {profile.tarifa_base}€/h
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-1.5 mt-auto pt-1">
            <Button
              onClick={() => {
                if (!currentUserId) {
                  base44.auth.redirectToLogin(createPageUrl("Messages") + `?professional=${profile.user_id}`);
                  return;
                }
                const conversationId = [currentUserId, profile.user_id].sort().join('_');
                navigate(createPageUrl("Messages") + `?conversation=${conversationId}&professional=${profile.user_id}`);
              }}
              className="flex-1 bg-blue-700 hover:bg-blue-600 text-white h-9 text-xs font-semibold rounded-lg"
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
              Contactar
            </Button>

            <Button onClick={onClick} variant="outline" size="sm"
              className="h-9 border-gray-200 hover:bg-gray-50 rounded-lg text-xs px-3 flex-shrink-0">
              {t('viewProfile') || 'Ver perfil'}
            </Button>

            {profile.metodos_contacto?.includes('whatsapp') && profile.telefono_contacto && (
              <Button onClick={handleWhatsApp} variant="outline" size="icon"
                className="h-9 w-9 border-green-200 hover:bg-green-50 rounded-lg flex-shrink-0" title={t('contactViaWhatsApp')}>
                <MessageCircle className="w-4 h-4 text-green-600" />
              </Button>
            )}

            {profile.metodos_contacto?.includes('telefono') && profile.telefono_contacto && (
              <Button onClick={handleCall} variant="outline" size="icon"
                className="h-9 w-9 border-gray-200 hover:bg-gray-50 rounded-lg flex-shrink-0" title={t('callPhone')}>
                <Phone className="w-4 h-4 text-gray-600" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showPhoneModal} onOpenChange={setShowPhoneModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader className="text-center">
            <DialogTitle>{t('phoneNumber') || 'Número de teléfono'}</DialogTitle>
            <DialogDescription>{profile.business_name}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="p-6 bg-blue-50 rounded-xl border border-blue-200 w-full text-center">
              <p className="text-3xl font-bold text-blue-900">{profile.telefono_contacto}</p>
            </div>
            <Button onClick={() => copyToClipboard(profile.telefono_contacto)} variant="outline" className="w-full">
              {copiedPhone ? <><Check className="w-4 h-4 mr-2 text-green-600" />Copiado</> : <><Copy className="w-4 h-4 mr-2" />Copiar número</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showWhatsAppModal} onOpenChange={setShowWhatsAppModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader className="text-center">
            <DialogTitle className="flex items-center justify-center gap-2">
              <MessageCircle className="w-6 h-6 text-green-600" />WhatsApp
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="p-6 bg-green-50 rounded-xl border border-green-200 w-full text-center">
              <p className="text-3xl font-bold text-green-900">{profile.telefono_contacto}</p>
            </div>
            <Button onClick={() => {
              window.open(`https://wa.me/${formatPhoneForWhatsApp(profile.telefono_contacto)}`, '_blank');
              setShowWhatsAppModal(false);
            }} className="w-full bg-green-600 hover:bg-green-700 h-12">
              <MessageCircle className="w-5 h-5 mr-2" />Abrir WhatsApp
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});

export default function SearchPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [filters, setFilters] = useState({
    category: "all",
    provincia: "all",
    ciudad: "all",
    minRating: 0,
    availability: "all"
  });
  const [displayLimit, setDisplayLimit] = useState(12);
  const [viewMode, setViewMode] = useState("grid"); // "grid" o "map"
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  // Categorías de fallback (se usan si BD no responde o no hay auth)
  const FALLBACK_CATEGORIES = [
    "Abogado",
    "Albañil / Reformas",
    "Asesoría o gestoría",
    "Autónomo de limpieza",
    "Carpintero",
    "Cerrajero",
    "Climatización / Calefacción",
    "Electricista",
    "Empresa multiservicios",
    "Fontanero",
    "Informático a domicilio / soporte IT",
    "Jardinero",
    "Marketing digital / diseño web",
    "Peluquería y estética a domicilio",
    "Persianas y toldos",
    "Pintor",
    "Transportista"
  ].map((name, idx) => ({ id: `fallback_${idx}`, name }));

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const cats = await base44.entities.ServiceCategory.list();
        if (cats && cats.length > 0) {
          return cats
            .filter(c => c.name)
            .sort((a, b) => a.name.localeCompare(b.name, 'es'));
        }
        return FALLBACK_CATEGORIES;
      } catch (error) {
        return FALLBACK_CATEGORIES;
      }
    },
    initialData: FALLBACK_CATEGORIES,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const { data: profiles = [], isLoading: loadingProfiles } = useQuery({
    queryKey: ['professionalProfiles'],
    queryFn: async () => {
      // 🔥 REGLA SIMPLE: Si visible_en_busqueda=true Y onboarding completo → MOSTRAR
      const allProfiles = await base44.entities.ProfessionalProfile.list();
      return allProfiles.filter(p => 
        p.visible_en_busqueda === true && 
        p.onboarding_completed === true
      );
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
  });

  const { data: professionalUsers = [] } = useQuery({
    queryKey: ['professionalUsers', profiles.length],
    queryFn: async () => {
      const userIds = profiles.map(p => p.user_id);
      if (userIds.length === 0) return [];
      const allUsers = await base44.entities.User.list();
      return allUsers.filter(u => userIds.includes(u.id));
    },
    enabled: profiles.length > 0,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.Favorite.filter({ client_id: user.id });
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  const filteredProfiles = useMemo(() => {
    const filtered = profiles.filter(profile => {
      const matchesSearch = !debouncedSearchTerm || 
        profile.business_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        profile.descripcion_corta?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        profile.categories?.some(cat => cat.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
      const matchesCategory = filters.category === "all" || profile.categories?.includes(filters.category);
      const matchesProvincia = filters.provincia === "all" || profile.provincia === filters.provincia;
      const matchesCiudad = filters.ciudad === "all" || profile.ciudad === filters.ciudad;
      const matchesRating = !filters.minRating || (profile.average_rating >= filters.minRating);
      const matchesAvailability = filters.availability === "all" || profile.disponibilidad_tipo === filters.availability;
      return matchesSearch && matchesCategory && matchesProvincia && matchesCiudad && matchesRating && matchesAvailability;
    });
    
    // Orden aleatorio
    return filtered.sort(() => Math.random() - 0.5);
  }, [profiles, debouncedSearchTerm, filters]);

  const availableCities = useMemo(() => {
    if (filters.provincia === "all") return [];
    return CIUDADES_POR_PROVINCIA[filters.provincia] || [];
  }, [filters.provincia]);

  const handleSelectFromAutocomplete = (profile) => {
    handleViewProfile(profile);
  };

  const handleViewProfile = (profile) => {
    // URL SEO-friendly con slug limpio (priorizar slug_publico ya migrado)
    const slug = profile.slug_publico || slugify(profile.business_name);
    navigate(createPageUrl("Autonomo") + `?slug=${slug}`);
  };

  const handleToggleFavorite = async (profile) => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }
    try {
      const existing = favorites.filter(fav => fav.professional_id === profile.user_id);
      if (existing.length > 0) {
        await base44.entities.Favorite.delete(existing[0].id);
        toast.success(t('removedFromFavorites') || "Eliminado de favoritos");
      } else {
        await base44.entities.Favorite.create({
          client_id: user.id,
          professional_id: profile.user_id,
          business_name: profile.business_name
        });
        toast.success(t('addedToFavorites') || "Añadido a favoritos");
      }
    } catch (error) {
      toast.error(t('errorFavorites') || "Error al gestionar favoritos");
    }
  };

  const isInitialLoading = loadingProfiles || loadingCategories;

  const totalResults = filteredProfiles.length;

  return (
    <>
      <SEOHead 
        title={
          filters.category !== "all" && filters.provincia !== "all" && filters.ciudad !== "all"
            ? `${filters.category} en ${filters.ciudad} - MisAutónomos`
            : filters.category !== "all" && filters.provincia !== "all"
            ? `${filters.category} en ${filters.provincia} - MisAutónomos`
            : filters.provincia !== "all" && filters.ciudad !== "all"
            ? `Autónomos en ${filters.ciudad}, ${filters.provincia} - MisAutónomos`
            : filters.category !== "all"
            ? `${filters.category} en España - MisAutónomos`
            : filters.provincia !== "all"
            ? `Autónomos en ${filters.provincia} - MisAutónomos`
            : "Buscar Autónomos Profesionales - MisAutónomos"
        }
        description={
          filters.category !== "all" && filters.provincia !== "all"
            ? `${filteredProfiles.length} profesionales de ${filters.category} en ${filters.provincia}. Contacta gratis con autónomos verificados.`
            : filters.category !== "all"
            ? `Encuentra ${filters.category} profesionales verificados en España. ${filteredProfiles.length} autónomos disponibles.`
            : filters.provincia !== "all"
            ? `${filteredProfiles.length} autónomos verificados en ${filters.provincia}. Electricistas, fontaneros, carpinteros y más.`
            : `Encuentra y contacta con profesionales autónomos verificados en España. ${filteredProfiles.length}+ profesionales disponibles.`
        }
        keywords={[
          filters.category !== "all" ? filters.category : "autónomos",
          filters.provincia !== "all" ? filters.provincia : "España",
          filters.ciudad !== "all" ? filters.ciudad : "",
          "profesionales verificados",
          "servicios a domicilio",
          "contactar gratis"
        ].filter(Boolean).join(', ')}
      />
      
      {/* Schemas estructurados para SEO */}
      <ServiceSchema 
        categories={categories.map(c => c.name)} 
        location={filters.provincia !== "all" ? filters.provincia : "España"} 
      />
      <BreadcrumbSchema items={[
        { name: "Inicio", url: "https://misautonomos.es" },
        { name: "Buscar Profesionales", url: "https://misautonomos.es/Search" }
      ]} />

      <div className="min-h-screen bg-gray-50">
        {/* Hero compacto para visitantes no registrados */}
        {!user && !loadingUser && (
          <div className="bg-gradient-to-r from-blue-800 to-blue-700 text-white py-10 px-4">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-1">{t('heroTitle') || 'Encuentra el profesional que necesitas'}</h1>
                <p className="text-blue-200 text-base">{t('heroSubtitle') || 'Autónomos verificados. Contacto directo. 100% gratis para clientes.'}</p>
                <div className="flex items-center gap-4 mt-3 text-sm">
                  <span className="flex items-center gap-1 text-green-300"><Users className="w-4 h-4" /> 2.400+ profesionales</span>
                  <span className="flex items-center gap-1 text-yellow-300"><Star className="w-4 h-4 fill-yellow-300" /> 4.8 valoración</span>
                </div>
              </div>
              <div className="flex gap-3 flex-shrink-0">
                <Button onClick={() => navigate(createPageUrl("PricingPlans"))}
                  className="bg-green-500 hover:bg-green-400 text-white font-bold px-6 h-11 rounded-xl shadow-lg">
                  <Briefcase className="w-4 h-4 mr-2" />Soy autónomo — 60 días gratis
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className={`max-w-7xl mx-auto px-4 ${user ? 'py-4' : 'pb-6'} md:pb-10`} id="search-section">
          {/* Barra de búsqueda pegajosa */}
          <div className="mb-4 bg-white rounded-2xl p-4 shadow-md border border-gray-100 sticky top-16 z-10">
            <div className="flex gap-2 mb-3">
              <div className="flex-1">
                <SearchAutocomplete
                  value={searchTerm}
                  onChange={setSearchTerm}
                  onSelect={handleSelectFromAutocomplete}
                />
              </div>
              {/* Botón filtros en móvil */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden flex items-center gap-1.5 border-gray-300 h-10 px-3 rounded-xl font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" /></svg>
                Filtros
                {(filters.category !== "all" || filters.provincia !== "all" || filters.minRating > 0) && (
                  <span className="w-2 h-2 bg-blue-600 rounded-full ml-0.5" />
                )}
              </Button>
            </div>
            
            {/* Filtros: siempre visibles en desktop, toggle en móvil */}
            <div className={`${showFilters ? 'block' : 'hidden'} md:block`}>
              <SearchFilters
                filters={filters}
                onFilterChange={setFilters}
                availableCities={availableCities}
                categories={categories}
                provinces={PROVINCIAS}
              />
            </div>

            {/* Chips de filtros activos (móvil) */}
            {!showFilters && (filters.category !== "all" || filters.provincia !== "all" || filters.minRating > 0) && (
              <div className="flex gap-2 flex-wrap mt-2 md:hidden">
                {filters.category !== "all" && (
                  <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full font-medium">
                    {filters.category}
                    <button onClick={() => setFilters(f => ({...f, category: "all"}))} className="ml-1 text-blue-500 hover:text-blue-700">✕</button>
                  </span>
                )}
                {filters.provincia !== "all" && (
                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-medium">
                    {filters.provincia}
                    <button onClick={() => setFilters(f => ({...f, provincia: "all", ciudad: "all"}))} className="ml-1 text-green-500 hover:text-green-700">✕</button>
                  </span>
                )}
                {filters.minRating > 0 && (
                  <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs px-2.5 py-1 rounded-full font-medium">
                    ★ {filters.minRating}+
                    <button onClick={() => setFilters(f => ({...f, minRating: 0}))} className="ml-1 text-amber-500 hover:text-amber-700">✕</button>
                  </span>
                )}
              </div>
            )}
          </div>

          <SavedSearches
            user={user}
            currentFilters={filters}
            resultsCount={filteredProfiles.length}
            onLoadSearch={(savedFilters) => setFilters(savedFilters)}
          />

          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {isInitialLoading ? (
                  <span className="text-gray-400">Cargando...</span>
                ) : (
                  <><span className="text-blue-700">{filteredProfiles.length}</span> {t('professionals') || 'profesionales'}</>
                )}
              </h2>
              <p className="text-xs text-gray-500">{t('verifiedProfessionals') || 'Verificados · Contacto directo'}</p>
            </div>
            
            {!isInitialLoading && filteredProfiles.length > 0 && (
              <div className="flex gap-1.5">
                <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm"
                  onClick={() => setViewMode("grid")}
                  className={`h-8 ${viewMode === "grid" ? "bg-blue-700" : ""}`}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </Button>
                <Button variant={viewMode === "map" ? "default" : "outline"} size="sm"
                  onClick={() => setViewMode("map")}
                  className={`h-8 ${viewMode === "map" ? "bg-blue-700" : ""}`}>
                  <MapPin className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>

          {isInitialLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(6)].map((_, idx) => (
                <div key={idx} className="border border-gray-100 rounded-xl bg-white p-4" style={{ height: '220px' }}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full flex-shrink-0 bg-gray-200 animate-pulse" style={{ width: '48px', height: '48px' }} />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" style={{ height: '16px' }} />
                      <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" style={{ height: '12px' }} />
                    </div>
                  </div>
                  <div className="space-y-2 mb-3" style={{ height: '48px' }}>
                    <div className="h-3 w-full bg-gray-200 rounded animate-pulse" style={{ height: '12px' }} />
                    <div className="h-3 w-full bg-gray-200 rounded animate-pulse" style={{ height: '12px' }} />
                  </div>
                  <div className="h-9 w-full bg-gray-200 rounded animate-pulse" style={{ height: '36px' }} />
                </div>
              ))}
            </div>
          )}

          {!isInitialLoading && filteredProfiles.length === 0 && (
            <div className={`grid ${!loadingUser && (!user || user.user_type === "client") ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'} gap-6`}>
              <Card className="p-8 text-center border-0 shadow-sm rounded-xl bg-white">
                <SearchIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('noResults')}</h3>
                <p className="text-sm text-gray-600">{t('tryDifferentFilters')}</p>
              </Card>
              {!loadingUser && (!user || user.user_type === "client") && (
                <Card className="p-8 text-center border-0 shadow-lg rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <h3 className="text-xl font-bold mb-2">{t('areYouProfessionalHere')}</h3>
                  <p className="text-blue-50 mb-6 text-sm">{t('joinFreeAppearHere')}</p>
                  <Button onClick={() => navigate(createPageUrl("PricingPlans"))}
                    className="bg-orange-500 hover:bg-orange-600 text-white h-11 px-6 font-semibold mx-auto">
                    <Briefcase className="w-4 h-4 mr-2" />{t('registerAsProfessional')}
                  </Button>
                </Card>
              )}
            </div>
          )}

          {!isInitialLoading && filteredProfiles.length > 0 && (
            <>
              {viewMode === "grid" ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pr-1">
                    {filteredProfiles.slice(0, displayLimit).map((profile) => (
                      <div key={profile.id}>
                        <ProfileCard
                          profile={profile}
                          onClick={() => handleViewProfile(profile)}
                          onToggleFavorite={() => handleToggleFavorite(profile)}
                          isFavorite={favorites.some(fav => fav.professional_id === profile.user_id)}
                          professionalUser={professionalUsers.find(u => u.id === profile.user_id)}
                          currentUserId={user?.id}
                        />
                      </div>
                    ))}
                  </div>
                  
                  {filteredProfiles.length > displayLimit && (
                    <div className="text-center mt-8">
                      <Button
                        onClick={() => setDisplayLimit(prev => prev + 12)}
                        variant="outline"
                        size="lg"
                        className="px-8 rounded-xl hover:bg-blue-50 hover:border-blue-300"
                      >
                        {t('viewAll')} ({filteredProfiles.length - displayLimit} {t('professionals')})
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <MapView
                  profiles={filteredProfiles}
                  onProfileClick={handleViewProfile}
                />
              )}
            </>
          )}

          {!isInitialLoading && !loadingUser && (!user || user.user_type === "client") && (
            <div className="mt-10 rounded-2xl overflow-hidden shadow-xl">
              <div className="bg-gradient-to-r from-blue-800 to-blue-700 p-6 md:p-8 text-white text-center">
                <div className="inline-block bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
                  🎁 60 días completamente gratis
                </div>
                <h3 className="text-2xl md:text-3xl font-extrabold mb-2">
                  {t('areYouProfessionalHere') || '¿Eres autónomo? Aparece aquí'}
                </h3>
                <p className="text-blue-200 mb-6 text-base max-w-lg mx-auto">
                  Más de 2.400 profesionales ya reciben clientes a través de MisAutónomos. Sin comisiones, contacto directo.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={() => navigate(createPageUrl("PricingPlans"))}
                    className="bg-green-500 hover:bg-green-400 text-white h-12 px-8 text-base font-bold shadow-xl rounded-xl">
                    <Briefcase className="w-5 h-5 mr-2" />Empezar gratis 60 días
                  </Button>
                  <Button onClick={() => navigate(createPageUrl("Home"))}
                    variant="outline" className="border-white/30 text-white hover:bg-white/10 h-12 px-6 text-base rounded-xl">
                    Saber más →
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
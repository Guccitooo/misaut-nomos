import React, { useState, useEffect } from "react";
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

const ProfileCard = ({ profile, onClick, onToggleFavorite, isFavorite, professionalUser, currentUserId }) => {
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

  return (
    <>
      <Card className="bg-white hover:shadow-lg transition-all duration-200 border border-gray-100 rounded-xl overflow-hidden h-full flex flex-col profile-card" style={{ minHeight: '220px' }}>
        <CardContent className="p-4 flex flex-col flex-1">
          <div className="flex items-start gap-3 mb-3">
            <Avatar className="w-12 h-12 border border-gray-100 cursor-pointer flex-shrink-0 overflow-hidden" onClick={onClick}>
              {(() => {
                const photoUrl = professionalUser?.profile_picture || profile.imagen_principal;
                return photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={profile.business_name}
                    className="object-cover object-center w-full h-full rounded-full"
                    width="48"
                    height="48"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-sm">
                    {profile.business_name?.charAt(0) || "P"}
                  </AvatarFallback>
                );
              })()}
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors truncate leading-tight mb-1" onClick={onClick}>
                {profile.business_name}
              </h3>
              {profile.categories && profile.categories.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2 py-0.5 rounded-md w-fit">
                  <CategoryIcon className="w-3 h-3" />
                  <span className="truncate">{t(profile.categories[0]) || profile.categories[0]}</span>
                </div>
              )}
            </div>

            <Button variant="ghost" size="icon" onClick={onToggleFavorite}
              className={`${isFavorite ? 'text-red-500 hover:text-red-600 hover:bg-red-50' : 'text-gray-300 hover:text-red-500 hover:bg-red-50'} h-8 w-8 flex-shrink-0`}>
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </Button>
          </div>

          <div className="space-y-2 mb-3 flex-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{profile.ciudad ? `${profile.ciudad}, ${profile.provincia}` : profile.provincia}</span>
            </div>
            <div className="h-[2.5rem] overflow-hidden">
              {displayProfile.descripcion_corta && (
                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{displayProfile.descripcion_corta}</p>
              )}
            </div>
            {profile.average_rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-semibold text-gray-900">{profile.average_rating.toFixed(1)}</span>
                <span className="text-xs text-gray-500">({profile.total_reviews})</span>
              </div>
            )}
          </div>

          <div className="flex gap-1.5 mt-auto">
            <Button onClick={onClick} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-9 text-xs font-medium rounded-lg px-2">
              {t('viewProfile')}
            </Button>

            <Button
              onClick={() => {
                if (!currentUserId) {
                  base44.auth.redirectToLogin(createPageUrl("Messages") + `?professional=${profile.user_id}`);
                  return;
                }
                const conversationId = [currentUserId, profile.user_id].sort().join('_');
                navigate(createPageUrl("Messages") + `?conversation=${conversationId}&professional=${profile.user_id}`);
              }}
              variant="outline" size="icon"
              className="h-9 w-9 border-gray-200 hover:bg-blue-50 hover:border-blue-300 rounded-lg flex-shrink-0"
              title={t('sendDirectMessage')}>
              <MessageSquare className="w-4 h-4 text-gray-700" />
            </Button>

            {profile.metodos_contacto?.includes('telefono') && profile.telefono_contacto && (
              <Button 
                onClick={handleCall}
                variant="outline" 
                size="icon"
                className="h-9 w-9 border-gray-200 hover:bg-gray-50 rounded-lg flex-shrink-0" 
                title={t('callPhone')}
              >
                <Phone className="w-4 h-4 text-gray-700" />
              </Button>
            )}

            {profile.metodos_contacto?.includes('whatsapp') && profile.telefono_contacto && (
              <Button onClick={handleWhatsApp} variant="outline" size="icon"
                className="h-9 w-9 border-gray-200 hover:bg-green-50 rounded-lg flex-shrink-0" title={t('contactViaWhatsApp')}>
                <MessageCircle className="w-4 h-4 text-green-600" />
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
};

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

  const filteredProfiles = React.useMemo(() => {
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

  const availableCities = React.useMemo(() => {
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
        {/* Hero visible solo si no hay usuario y ya se terminó de cargar */}
        {!user && !loadingUser && (
          <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-16 md:py-20 mb-8 overflow-hidden">
            {/* Elementos decorativos de fondo */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-400 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="max-w-6xl mx-auto px-4 text-center relative z-10">
              <div>
                <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight drop-shadow-lg">
                  {t('heroTitle')}
                </h1>
                <p className="text-xl md:text-2xl text-blue-50 mb-8 font-light max-w-3xl mx-auto">
                  {t('heroSubtitle')}
                </p>
              </div>

              {/* Stats destacadas */}
              <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 text-base md:text-lg mb-8">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                  <Users className="w-5 h-5 text-green-400" />
                  <span className="font-bold">247+</span>
                  <span className="text-blue-100">profesionales</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold">4.8</span>
                  <span className="text-blue-100">valoración</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <span className="font-bold">1,840</span>
                  <span className="text-blue-100">trabajos/mes</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-xl mx-auto">
                <Button onClick={() => document.getElementById('search-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-white hover:bg-gray-50 text-blue-700 h-14 px-8 text-lg font-semibold shadow-2xl flex-1 rounded-xl">
                  <SearchIcon className="w-5 h-5 mr-2" />{t('imClient')}
                </Button>
                <Button onClick={() => navigate(createPageUrl("PricingPlans"))}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white h-14 px-8 text-lg font-semibold shadow-2xl flex-1 rounded-xl">
                  <Briefcase className="w-5 h-5 mr-2" />{t('imFreelancer')}
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className={`max-w-7xl mx-auto px-4 ${user ? 'py-6' : 'pb-6'} md:pb-10`} id="search-section">
          <div className="mb-6 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="mb-3">
              <SearchAutocomplete
                value={searchTerm}
                onChange={setSearchTerm}
                onSelect={handleSelectFromAutocomplete}
              />
            </div>
            
            <SearchFilters
              filters={filters}
              onFilterChange={setFilters}
              availableCities={availableCities}
              categories={categories}
              provinces={PROVINCIAS}
            />
          </div>

          <SavedSearches
            user={user}
            currentFilters={filters}
            resultsCount={filteredProfiles.length}
            onLoadSearch={(savedFilters) => setFilters(savedFilters)}
          />

          <div className="mb-5 flex items-center justify-between" style={{ minHeight: '56px' }}>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {isInitialLoading ? t('loading') : `${filteredProfiles.length} ${t('professionals')}`}
              </h2>
              <p className="text-sm text-gray-600 mt-0.5">{t('verifiedProfessionals')}</p>
            </div>
            
            {!isInitialLoading && filteredProfiles.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={viewMode === "grid" ? "bg-blue-600" : ""}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Lista
                </Button>
                <Button
                  variant={viewMode === "map" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("map")}
                  className={viewMode === "map" ? "bg-blue-600" : ""}
                >
                  <MapPin className="w-4 h-4 mr-1" />
                  Mapa
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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

          {!isInitialLoading && !loadingUser && filteredProfiles.length > 0 && (!user || user.user_type === "client") && (
            <div className="mt-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-center text-white shadow-lg">
              <h3 className="text-2xl font-bold mb-2">{t('areYouProfessionalHere')}</h3>
              <p className="text-blue-100 mb-5 text-lg">{t('getMoreClients')}</p>
              <Button onClick={() => navigate(createPageUrl("PricingPlans"))}
                className="bg-white hover:bg-gray-50 text-blue-700 h-12 px-8 text-base font-semibold shadow-xl rounded-xl">
                <Briefcase className="w-5 h-5 mr-2" />{t('registerAsProfessional')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
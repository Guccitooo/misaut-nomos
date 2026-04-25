import React, { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { differenceInDays } from "date-fns";
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
  Users,
  Shield,
  ChevronRight,
  SlidersHorizontal,
  X,
  Palette,
  Sprout,
  Lightbulb
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import SEOHead from "../components/seo/SEOHead";
import { ServiceSchema, BreadcrumbSchema } from "../components/seo/StructuredData";
import { useLanguage } from "../components/ui/LanguageSwitcher";
import { useProfileTranslation } from "../components/profile/useProfileTranslation";
import { PROVINCIAS, CIUDADES_POR_PROVINCIA } from "../components/utils/locationsData";
import SearchAutocomplete from "../components/search/SearchAutocomplete";
import SavedSearches from "../components/search/SavedSearches";
import PullToRefresh from "../components/ui/PullToRefresh";
const SearchFilters = lazy(() => import("../components/search/SearchFilters"));
const MapView = lazy(() => import("../components/search/MapView"));
import { generateSlug } from "../utils/slugUtils";

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const QUICK_CATEGORIES = [
  { name: "Electricista", icon: Zap, color: "from-yellow-400 to-orange-400" },
  { name: "Fontanero", icon: Droplets, color: "from-blue-400 to-cyan-400" },
  { name: "Pintor", icon: Paintbrush, color: "from-pink-400 to-rose-400" },
  { name: "Albañil / Reformas", icon: HardHat, color: "from-orange-400 to-amber-400" },
  { name: "Jardinero", icon: Trees, color: "from-green-400 to-emerald-400" },
  { name: "Autónomo de limpieza", icon: Sparkles, color: "from-purple-400 to-violet-400" },
  { name: "Cerrajero", icon: Key, color: "from-slate-400 to-gray-500" },
  { name: "Carpintero", icon: Hammer, color: "from-amber-500 to-yellow-500" },
];

const ProfileCard = React.memo(({ profile, onClick, onToggleFavorite, isFavorite, professionalUser, currentUserId, currentUser, priority }) => {
  const navigate = useNavigate();

  const handleContactDirect = async (e) => {
    e.stopPropagation();
    if (!currentUserId) {
      sessionStorage.setItem('pending_chat_action', JSON.stringify({ action: 'open_chat', professionalId: profile.user_id }));
      base44.auth.redirectToLogin('/messages');
      return;
    }
    const conversationId = [currentUserId, profile.user_id].sort().join('_');
    try {
      const existing = await base44.entities.Message.filter({ conversation_id: conversationId }, '-created_date', 1);
      if (!existing || existing.length === 0) {
        await base44.entities.Message.create({
          conversation_id: conversationId,
          sender_id: currentUserId,
          recipient_id: profile.user_id,
          content: "Hola, me interesa tu servicio. ¿Podemos hablar?",
          professional_name: profile.business_name || "Profesional",
          client_name: currentUser?.full_name || currentUser?.email || "",
          is_read: false,
          attachments: [],
        });
      }
    } catch {}
    navigate(`/messages?conv=${conversationId}`);
  };

  const formatPhoneForWhatsApp = (phone) => {
    if (!phone) return null;
    let cleaned = phone.replace(/\D/g, '');
    if (!cleaned.startsWith('34') && cleaned.length === 9) cleaned = '34' + cleaned;
    return cleaned;
  };

  const photoUrl = professionalUser?.profile_picture || profile.imagen_principal;
  const isVerified = profile.identity_verified === true;
  // Limitar URL de imagen a máx 200px para reducir peso (si es URL de Supabase)
  const optimizedPhotoUrl = photoUrl && photoUrl.includes('supabase.co')
    ? photoUrl + (photoUrl.includes('?') ? '&' : '?') + 'width=96&quality=70'
    : photoUrl;

  return (
    <div 
      onClick={onClick}
      className="cursor-pointer bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all flex flex-col overflow-hidden"
      style={{ minHeight: '200px', contain: 'layout style' }}
    >
      {/* Header azul PEQUEÑO — solo desktop */}
      <div className="hidden md:block bg-gradient-to-r from-blue-600 to-blue-500 rounded-t-xl relative flex-shrink-0" style={{ height: '48px', minHeight: '48px' }}>
        {profile.tarifa_base > 0 && (
          <div className="absolute top-2 right-2 bg-white/20 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
            {profile.tarifa_base}€/h
          </div>
        )}
      </div>

      {/* Zona con avatar posicionado negativamente desde aquí */}
      <div className="relative px-3 flex flex-col flex-1">
        {/* Avatar: solo desktop, a caballo entre header y contenido */}
        <div className="hidden md:block absolute -top-6 left-3" style={{ width: '48px', height: '48px' }}>
          {optimizedPhotoUrl ? (
            <img
              src={optimizedPhotoUrl}
              alt={profile.business_name}
              width="48"
              height="48"
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "low"}
              decoding={priority ? "sync" : "async"}
              className="w-12 h-12 rounded-full border-2 border-white object-cover shadow-sm"
              style={{ width: '48px', height: '48px', minWidth: '48px', minHeight: '48px' }}
            />
          ) : (
            <div className="w-12 h-12 rounded-full border-2 border-white bg-blue-500 flex items-center justify-center text-white font-bold text-base shadow-sm" style={{ width: '48px', height: '48px' }}>
              {profile.business_name?.[0]?.toUpperCase()}
            </div>
          )}
        </div>

        {/* Fila avatar+nombre — solo móvil */}
        <div className="md:hidden flex items-center gap-3 pt-3 pb-1">
          <div className="flex-shrink-0" style={{ width: '48px', height: '48px', minWidth: '48px' }}>
            {optimizedPhotoUrl ? (
              <img
                src={optimizedPhotoUrl}
                alt={profile.business_name}
                width="48"
                height="48"
                loading={priority ? "eager" : "lazy"}
                fetchPriority={priority ? "high" : "low"}
                decoding={priority ? "sync" : "async"}
                className="w-12 h-12 rounded-full object-cover"
                style={{ width: '48px', height: '48px' }}
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-base" style={{ width: '48px', height: '48px' }}>
                {profile.business_name?.[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <h3 className="font-semibold text-gray-900 text-sm truncate">{profile.business_name}</h3>
              {isVerified && (
                <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" title="Identidad verificada">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
              )}
            </div>
            <p className="text-blue-600 text-xs truncate">{profile.categories?.[0]}</p>
          </div>
          {profile.tarifa_base > 0 && (
            <span className="text-sm font-semibold text-gray-700 flex-shrink-0">{profile.tarifa_base}€/h</span>
          )}
        </div>

      {/* Contenido — padding-top para no tapar el avatar (desktop) */}
      <div className="md:pt-8 pt-1 pb-3 flex flex-col flex-1">
        <div className="hidden md:block flex items-center gap-1">
          <h3 className="font-semibold text-gray-900 text-sm truncate">{profile.business_name}</h3>
          {isVerified && (
            <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" title="Identidad verificada">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
          )}
        </div>
        <p className="hidden md:block text-blue-600 text-xs truncate">{profile.categories?.[0]}</p>
        <p className="text-gray-400 text-xs mt-0.5 truncate">📍 {profile.ciudad}, {profile.provincia}</p>
        <p className="text-gray-600 text-xs mt-1.5 line-clamp-2 min-h-[2.5rem] leading-relaxed">{profile.descripcion_corta}</p>
        
        {/* Estrellas */}
        {profile.average_rating > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-yellow-400 text-xs">★</span>
            <span className="text-xs text-gray-600">{profile.average_rating.toFixed(1)} ({profile.total_reviews})</span>
          </div>
        )}

        {/* Botones compactos — siempre al fondo */}
        <div className="flex gap-1.5 mt-auto pt-2 w-full min-w-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={handleContactDirect}
            className="flex-1 min-w-0 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-1.5 text-xs font-medium flex items-center justify-center gap-1 transition-colors overflow-hidden"
            aria-label={`Contactar con ${profile.business_name}`}
          >
            <MessageSquare className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">Contactar</span>
          </button>
          
          {profile.metodos_contacto?.includes('whatsapp') && profile.telefono_contacto && (
            <a
              href={`https://wa.me/${formatPhoneForWhatsApp(profile.telefono_contacto)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="w-8 h-8 min-w-[2rem] bg-green-500 hover:bg-green-600 rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
              aria-label={`Contactar a ${profile.business_name} por WhatsApp`}
            >
              <svg viewBox="0 0 24 24" fill="white" width="14" height="14">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>
          )}

          {profile.metodos_contacto?.includes('telefono') && profile.telefono_contacto && (
            <div className="relative group flex-shrink-0" onClick={e => e.stopPropagation()}>
              <a href={`tel:${profile.telefono_contacto}`} className="w-8 h-8 min-w-[2rem] bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors md:hidden" aria-label={`Llamar a ${profile.business_name} al ${profile.telefono_contacto}`}>
                <Phone className="w-3.5 h-3.5 text-gray-600" />
              </a>
              <button className="w-8 h-8 min-w-[2rem] bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors hidden md:flex" aria-label={`Teléfono: ${profile.telefono_contacto}`}>
                <Phone className="w-3.5 h-3.5 text-gray-600" />
              </button>
              <div className="absolute bottom-10 right-0 bg-gray-900 text-white text-xs rounded-lg px-2 py-1.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg">
                {profile.telefono_contacto}
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
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
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        setUser(null);
        setLoadingUser(false);
        return;
      }
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  // CATEGORÍAS HARDCODEADAS — sin fetch, renderan inmediatamente para LCP
  const QUICK_CATEGORIES_HARDCODED = [
    { name: 'Electricista', icon: Zap },
    { name: 'Fontanero', icon: Wrench },
    { name: 'Pintor', icon: Palette },
    { name: 'Albañil / Reformas', icon: Hammer },
    { name: 'Jardinero', icon: Sprout },
    { name: 'Autónomo de limpieza', icon: Sparkles },
    { name: 'Cerrajero', icon: Key },
    { name: 'Carpintero', icon: Lightbulb },
  ];

  const FALLBACK_CATEGORIES = [
    "Abogado", "Albañil / Reformas", "Asesoría o gestoría", "Autónomo de limpieza",
    "Carpintero", "Cerrajero", "Climatización / Calefacción", "Electricista",
    "Empresa multiservicios", "Fontanero", "Informático a domicilio / soporte IT",
    "Jardinero", "Marketing digital / diseño web", "Peluquería y estética a domicilio",
    "Persianas y toldos", "Pintor", "Transportista"
  ].map((name, idx) => ({ id: `fallback_${idx}`, name }));

  // NO hacer fetch de categorías — usar FALLBACK_CATEGORIES directamente
  const categories = FALLBACK_CATEGORIES;
  const loadingCategories = false;

  const { data: profiles = [], isLoading: loadingProfiles } = useQuery({
    queryKey: ['professionalProfiles'],
    queryFn: async () => {
      const allProfiles = await base44.entities.ProfessionalProfile.list();
      return allProfiles.filter(p => p.visible_en_busqueda === true && p.onboarding_completed === true);
    },
    staleTime: 1000 * 60 * 5, gcTime: 1000 * 60 * 15, refetchOnWindowFocus: false,
  });

  const { data: professionalUsers = [] } = useQuery({
    queryKey: ['professionalUsers', profiles.map(p => p.user_id).join(',')],
    queryFn: async () => {
      if (profiles.length === 0) return [];
      // Solo traer los usuarios necesarios con filter en lugar de list() completo
      const userIds = profiles.map(p => p.user_id);
      const allUsers = await base44.entities.User.filter({ id: { $in: userIds } });
      return allUsers;
    },
    enabled: profiles.length > 0,
    staleTime: 1000 * 60 * 10, gcTime: 1000 * 60 * 30, refetchOnWindowFocus: false,
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.Favorite.filter({ client_id: user.id });
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 10, gcTime: 1000 * 60 * 30, refetchOnWindowFocus: false,
  });

  // Orden aleatorio estable — calculado UNA SOLA VEZ cuando llegan los perfiles
  const shuffledProfiles = useMemo(() => {
    if (!profiles.length) return profiles;
    const arr = [...profiles];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [profiles]);

  const filteredProfiles = useMemo(() => {
    return shuffledProfiles.filter(profile => {
      const matchesSearch = !debouncedSearchTerm ||
        profile.business_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        profile.descripcion_corta?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        profile.categories?.some(cat => cat.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
      const matchesCategory = filters.category === "all" || profile.categories?.includes(filters.category);
      const matchesProvincia = filters.provincia === "all" || profile.provincia === filters.provincia;
      const matchesCiudad = filters.ciudad === "all" || profile.ciudad === filters.ciudad;
      const matchesRating = !filters.minRating || profile.average_rating >= filters.minRating;
      const matchesAvailability = filters.availability === "all" || profile.disponibilidad_tipo === filters.availability;
      return matchesSearch && matchesCategory && matchesProvincia && matchesCiudad && matchesRating && matchesAvailability;
    });
  }, [shuffledProfiles, debouncedSearchTerm, filters]);

  const availableCities = useMemo(() => {
    if (filters.provincia === "all") return [];
    return CIUDADES_POR_PROVINCIA[filters.provincia] || [];
  }, [filters.provincia]);

  const handleViewProfile = (profile) => {
    // URL SEO-friendly: /autonomo/:slug
    const slug = profile.slug_publico || generateSlug(profile.business_name);
    navigate(`/autonomo/${slug}`);
  };

  const handleToggleFavorite = async (profile) => {
    if (!user) { base44.auth.redirectToLogin(); return; }
    try {
      const existing = favorites.filter(fav => fav.professional_id === profile.user_id);
      if (existing.length > 0) {
        await base44.entities.Favorite.delete(existing[0].id);
        toast.success("Eliminado de favoritos");
      } else {
        await base44.entities.Favorite.create({ client_id: user.id, professional_id: profile.user_id, business_name: profile.business_name });
        toast.success("Añadido a favoritos");
      }
    } catch { toast.error("Error al gestionar favoritos"); }
  };

  const isInitialLoading = loadingProfiles || loadingCategories;
  const hasActiveFilters = filters.category !== "all" || filters.provincia !== "all" || filters.minRating > 0;

  return (
    <>
      <SEOHead
        title={
          filters.category !== "all" && filters.provincia !== "all"
            ? `${filters.category} en ${filters.provincia} - MisAutónomos`
            : filters.category !== "all"
            ? `${filters.category} en España - MisAutónomos`
            : filters.provincia !== "all"
            ? `Autónomos en ${filters.provincia} - MisAutónomos`
            : "Buscar Autónomos Profesionales - MisAutónomos"
        }
        description={`Encuentra y contacta con profesionales autónomos verificados en España. ${filteredProfiles.length}+ profesionales disponibles.`}
        keywords="autónomos, profesionales verificados, servicios a domicilio, contactar gratis"
      />
      <ServiceSchema categories={categories.map(c => c.name)} location={filters.provincia !== "all" ? filters.provincia : "España"} />
      <BreadcrumbSchema items={[
        { name: "Inicio", url: "https://misautonomos.es" },
        { name: "Buscar Profesionales", url: "https://misautonomos.es/buscar" }
      ]} />

      <div className="min-h-screen" style={{ background: '#f8fafc', paddingBottom: 'env(safe-area-inset-bottom)' }}>

        {/* ── HERO ── 
            SIEMPRE se renderiza para reservar espacio y evitar CLS.
            Cuando hay usuario se colapsa a height:0 sin layout shift. */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)',
            overflow: 'hidden',
            // Cuando hay usuario confirmado: colapsar sin mover el contenido de abajo
            height: (!loadingUser && user) ? 0 : undefined,
          }}
          aria-hidden={(!loadingUser && user) ? true : undefined}
        >
          {/* Contenido real del hero — solo visible para visitantes */}
          <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)' }} className="relative overflow-hidden">
            {/* Decoración de fondo — sin filter:blur para reducir TBT */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
              <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full" />
              <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-white/5 rounded-full" />
            </div>

            <div className="relative max-w-5xl mx-auto px-4 py-10 md:py-20">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-white/10 text-white text-xs px-3 py-1.5 rounded-full mb-4 border border-white/20">
                  <Shield className="w-3.5 h-3.5 text-green-300" />
                  <span>Profesionales verificados · 100% gratis</span>
                </div>
                <h1 className="font-extrabold text-white leading-tight mb-3" style={{ fontSize: 'clamp(1.75rem, 6vw, 3.5rem)' }}>
                  Encuentra el autónomo<br />
                  <span style={{ color: '#fbbf24' }}>que necesitas</span>
                </h1>
                <p className="text-blue-200 mb-6 max-w-xl mx-auto" style={{ fontSize: 'clamp(0.95rem, 3vw, 1.125rem)' }}>
                  Contacta gratis con profesionales en España.
                </p>

                {/* Barra de búsqueda hero — apilada en móvil */}
                <div className="max-w-2xl mx-auto">
                  <div className="bg-white rounded-2xl shadow-2xl p-2 flex flex-col md:flex-row gap-2">
                    <div className="flex-1">
                      <SearchAutocomplete
                        value={searchTerm}
                        onChange={setSearchTerm}
                        onSelect={handleViewProfile}
                        placeholder="¿Qué profesional buscas?"
                      />
                    </div>
                    <Button
                      onClick={() => document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' })}
                      className="bg-blue-600 text-white rounded-xl font-semibold w-full md:w-auto md:px-6"
                      style={{ height: '48px', fontSize: '16px', touchAction: 'manipulation' }}
                    >
                      <SearchIcon className="w-4 h-4 mr-2" />
                      Buscar
                    </Button>
                  </div>
                </div>

                {/* Props de valor — ocultos en móvil para simplificar */}
                <div className="hidden md:flex items-center justify-center gap-6 mt-6 text-sm flex-wrap">
                  <div className="flex items-center gap-2 text-white/80">
                    <MessageSquare className="w-4 h-4 text-green-300" />
                    <span><strong className="text-white">Contacto directo</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-white/80">
                    <Shield className="w-4 h-4 text-blue-300" />
                    <span><strong className="text-white">Sin comisiones</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-white/80">
                    <Users className="w-4 h-4 text-yellow-300" />
                    <span><strong className="text-white">Verificados</strong></span>
                  </div>
                </div>
              </div>

              {/* Categorías rápidas — chips scroll horizontal en móvil */}
              <div>
                <p className="text-white/60 text-sm text-center mb-3">Explorar por categoría</p>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', flexWrap: 'nowrap' }}>
                  {QUICK_CATEGORIES_HARDCODED.map(({ name, icon: Icon }) => (
                    <button
                      key={name}
                      onClick={() => {
                        setFilters(f => ({ ...f, category: name }));
                        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="flex items-center gap-2 text-white border border-white/20 flex-shrink-0 md:hover:bg-white/20 md:active:bg-white/20"
                      style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px 16px', fontSize: '14px', fontWeight: 500, minHeight: '44px', touchAction: 'manipulation', whiteSpace: 'nowrap', WebkitTapHighlightColor: 'transparent', transition: 'none' }}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA autónomo — barra fija en móvil, inline en desktop */}
            <div className="border-t border-white/10 bg-white/5 py-3 px-4 hidden md:block">
              <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
                <p className="text-white/80 text-sm">
                  🚀 <strong className="text-white">¿Eres autónomo?</strong> Consigue clientes desde hoy
                </p>
                <Button
                  onClick={() => navigate(createPageUrl("PricingPlans"))}
                  className="bg-green-500 text-white font-bold px-5 h-9 rounded-xl shadow-lg text-sm flex-shrink-0"
                  style={{ touchAction: 'manipulation' }}
                >
                  Empezar gratis · 7 días
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
            {/* Barra fija autónomo — solo móvil */}
            <div className="md:hidden" style={{ position: 'fixed', bottom: '64px', left: 0, right: 0, zIndex: 20, background: 'linear-gradient(90deg, #15803d, #16a34a)', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
              <button
                onClick={() => navigate(createPageUrl("PricingPlans"))}
                className="w-full flex items-center justify-between text-white"
                style={{ padding: '12px 20px', fontSize: '14px', fontWeight: 600, touchAction: 'manipulation' }}
              >
                <span>🚀 <strong>¿Eres autónomo?</strong> Empieza gratis · 7 días</span>
                <ChevronRight className="w-5 h-5 flex-shrink-0" />
              </button>
            </div>
          </div>
        </div>{/* fin hero wrapper */}

        {/* ── CONTENIDO PRINCIPAL ── */}
        <div id="results-section">
        <div className="max-w-7xl mx-auto px-4 py-5 overflow-visible">

          {/* Barra de búsqueda (para usuarios logueados) */}
          {user && (
            <div className="mb-5 bg-white rounded-2xl p-4 shadow-sm border border-gray-100" style={{ position: 'relative', zIndex: 10 }}>
              <div className="flex gap-2 mb-3">
                <div className="flex-1">
                  <SearchAutocomplete
                    value={searchTerm}
                    onChange={setSearchTerm}
                    onSelect={handleViewProfile}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-1.5 h-10 px-3 rounded-xl font-medium border-gray-200 ${showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : ''}`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span className="hidden md:inline">Filtros</span>
                  {hasActiveFilters && <span className="w-2 h-2 bg-blue-600 rounded-full" />}
                </Button>
              </div>
              <div className={`${showFilters ? 'block' : 'hidden'}`}>
                <Suspense fallback={null}>
                  <SearchFilters
                    filters={filters}
                    onFilterChange={setFilters}
                    availableCities={availableCities}
                    categories={categories}
                    provinces={PROVINCIAS}
                  />
                </Suspense>
              </div>
            </div>
          )}

          {/* Filtros visita sin login */}
          {!user && (
            <div className="mb-5 bg-white rounded-2xl p-4 shadow-sm border border-gray-100" style={{ position: 'relative', zIndex: 10 }}>
              {/* Toggle button — desktop only */}
              <div className="hidden md:flex gap-2 items-center flex-wrap mb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-1.5 h-9 px-3 rounded-xl font-medium border-gray-200 ${showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : ''}`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filtros avanzados
                  {hasActiveFilters && <span className="w-2 h-2 bg-blue-600 rounded-full" />}
                </Button>
                {filters.category !== "all" && (
                  <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full font-medium">
                    {filters.category}
                    <button onClick={() => setFilters(f => ({...f, category: "all"}))}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {filters.provincia !== "all" && (
                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-medium">
                    {filters.provincia}
                    <button onClick={() => setFilters(f => ({...f, provincia: "all", ciudad: "all"}))}><X className="w-3 h-3" /></button>
                  </span>
                )}
              </div>

              {/* Desktop: toggled by button above */}
              {showFilters && (
                <div className="hidden md:block">
                  <Suspense fallback={null}>
                    <SearchFilters
                      filters={filters}
                      onFilterChange={setFilters}
                      availableCities={availableCities}
                      categories={categories}
                      provinces={PROVINCIAS}
                    />
                  </Suspense>
                </div>
              )}

              {/* Mobile: always visible, no toggle, no "Filtros avanzados" popover button */}
              <div className="md:hidden">
                <Suspense fallback={null}>
                  <SearchFilters
                    filters={filters}
                    onFilterChange={setFilters}
                    availableCities={availableCities}
                    categories={categories}
                    provinces={PROVINCIAS}
                    isMobile={true}
                  />
                </Suspense>
              </div>
            </div>
          )}

          <SavedSearches
            user={user}
            currentFilters={filters}
            resultsCount={filteredProfiles.length}
            onLoadSearch={(savedFilters) => setFilters(savedFilters)}
          />

          {/* Header resultados */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {isInitialLoading ? (
                  <span className="text-gray-400">Buscando profesionales...</span>
                ) : (
                  <><span className="text-blue-600">{filteredProfiles.length}</span> profesionales</>
                )}
              </h2>
              <p className="text-xs text-gray-400">Verificados · Contacto directo · Sin comisiones</p>
            </div>
            {!isInitialLoading && filteredProfiles.length > 0 && (
              <div className="flex gap-1.5">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  aria-label="Vista en cuadrícula"
                  className={`h-8 w-8 p-0 ${viewMode === "grid" ? "bg-blue-600 border-blue-600" : "border-gray-200"}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </Button>
                <Button
                  variant={viewMode === "map" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("map")}
                  aria-label="Vista en mapa"
                  className={`h-8 w-8 p-0 ${viewMode === "map" ? "bg-blue-600 border-blue-600" : "border-gray-200"}`}
                >
                  <MapPin className="w-4 h-4" aria-hidden="true" />
                </Button>
              </div>
            )}
          </div>

          {/* Skeleton loading — matches EXACT card shape for mobile (avatar+name row) and desktop (blue header) */}
          {isInitialLoading && (
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))' }}>
              {[...Array(8)].map((_, idx) => (
                <div key={idx} className="bg-white rounded-xl overflow-hidden border border-gray-100" style={{ minHeight: '200px', contain: 'layout style paint' }}>
                  {/* Desktop: blue header bar */}
                  <div className="hidden md:block" style={{ height: '48px', background: '#e5e7eb' }} />
                  {/* Mobile: avatar + name row (matches real card mobile layout) */}
                  <div className="md:hidden flex items-center gap-3 px-3 pt-3 pb-1">
                    <div style={{ width: '48px', height: '48px', minWidth: '48px', borderRadius: '9999px', background: '#e5e7eb' }} />
                    <div className="flex-1 space-y-2">
                      <div style={{ height: '14px', width: '60%', borderRadius: '4px', background: '#e5e7eb' }} />
                      <div style={{ height: '11px', width: '40%', borderRadius: '4px', background: '#f3f4f6' }} />
                    </div>
                  </div>
                  {/* Shared content area */}
                  <div className="px-3 pb-3 md:pt-8 pt-2 space-y-2">
                    <div className="hidden md:block h-4 w-3/4 rounded" style={{ background: '#e5e7eb' }} />
                    <div className="hidden md:block h-3 w-1/2 rounded" style={{ background: '#f3f4f6' }} />
                    <div style={{ height: '11px', width: '55%', borderRadius: '4px', background: '#f3f4f6' }} />
                    <div style={{ height: '32px', width: '100%', borderRadius: '6px', background: '#f3f4f6', marginTop: '8px' }} />
                    <div style={{ height: '32px', width: '100%', borderRadius: '8px', background: '#e5e7eb', marginTop: '8px' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sin resultados */}
          {!isInitialLoading && filteredProfiles.length === 0 && (
            <div className="space-y-4">
              <Card className="p-8 text-center border-0 shadow-sm rounded-2xl bg-white">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <SearchIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Sin resultados exactos</h3>
                <p className="text-sm text-gray-500 mb-4">No encontramos profesionales con esos filtros exactos</p>
                {hasActiveFilters && (
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => setFilters({ category: "all", provincia: "all", ciudad: "all", minRating: 0, availability: "all" })}
                  >
                    Ver todos los profesionales
                  </Button>
                )}
              </Card>
              {/* Fix #11: Show related suggestions when no results */}
              {profiles.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-3 font-medium">Quizás te interesen estos profesionales:</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                    {profiles.slice(0, 4).map((profile) => (
                      <ProfileCard
                        key={profile.id}
                        profile={profile}
                        onClick={() => handleViewProfile(profile)}
                        onToggleFavorite={() => handleToggleFavorite(profile)}
                        isFavorite={favorites.some(fav => fav.professional_id === profile.user_id)}
                        professionalUser={professionalUsers.find(u => u.id === profile.user_id)}
                        currentUserId={user?.id}
                        currentUser={user}
                      />
                    ))}
                  </div>
                </div>
              )}
              {(!user || user.user_type === "client") && (
                <Card className="p-8 text-center border-0 shadow-xl rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e40af, #3b82f6)' }}>
                  <div className="text-white">
                    <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-80" />
                    <h3 className="text-xl font-bold mb-2">¿Eres profesional?</h3>
                    <p className="text-blue-100 mb-5 text-sm">Únete gratis y consigue clientes en tu zona</p>
                    <Button onClick={() => navigate(createPageUrl("PricingPlans"))}
                      className="bg-white text-blue-700 hover:bg-blue-50 h-11 px-6 font-bold rounded-xl">
                      Empezar gratis · 7 días
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Grid de resultados */}
          {!isInitialLoading && filteredProfiles.length > 0 && (
            <>
              {viewMode === "grid" ? (
                <>
                  <div className="grid gap-4 items-stretch" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))' }}>
                    {filteredProfiles.slice(0, displayLimit).map((profile, idx) => (
                      <ProfileCard
                        key={profile.id}
                        profile={profile}
                        onClick={() => handleViewProfile(profile)}
                        onToggleFavorite={() => handleToggleFavorite(profile)}
                        isFavorite={favorites.some(fav => fav.professional_id === profile.user_id)}
                        professionalUser={professionalUsers.find(u => u.id === profile.user_id)}
                        currentUserId={user?.id}
                        currentUser={user}
                        priority={idx < 4}
                      />
                    ))}
                  </div>
                  {filteredProfiles.length > displayLimit && (
                    <div className="text-center mt-10">
                      <Button
                        onClick={() => setDisplayLimit(prev => prev + 12)}
                        variant="outline"
                        size="lg"
                        className="px-10 rounded-2xl border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 font-semibold"
                      >
                        Cargar más profesionales ({filteredProfiles.length - displayLimit} restantes)
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <Suspense fallback={<div className="h-96 bg-gray-100 rounded-xl animate-pulse" />}>
                  <MapView profiles={filteredProfiles} onProfileClick={handleViewProfile} />
                </Suspense>
              )}
            </>
          )}

          {/* CTA final para registrarse como autónomo */}
          {!isInitialLoading && !loadingUser && (!user || user.user_type === "client") && (
            <div className="mt-14 rounded-3xl overflow-hidden shadow-2xl" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)' }}>
              <div className="p-8 md:p-12 text-white text-center">
                <span className="inline-block bg-green-500 text-white text-xs font-bold px-4 py-1.5 rounded-full mb-5 shadow">
                  🚀 Plataforma recién lanzada · 7 días gratis
                </span>
                <h3 className="text-3xl md:text-4xl font-extrabold mb-3">
                  ¿Eres autónomo?<br />
                  <span style={{ color: '#fbbf24' }}>Aparece aquí hoy</span>
                </h3>
                <p className="text-blue-200 mb-3 text-base max-w-lg mx-auto">
                  El nuevo directorio de autónomos de España — sin intermediarios, sin comisiones.
                </p>
                <p className="text-blue-300 mb-8 text-sm max-w-md mx-auto">
                  Sé de los primeros en unirte y posiciónate antes que tu competencia.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={() => navigate(createPageUrl("PricingPlans"))}
                    className="bg-green-500 hover:bg-green-400 text-white h-13 px-10 text-base font-bold shadow-xl rounded-2xl"
                    style={{ height: '52px' }}
                  >
                    <Briefcase className="w-5 h-5 mr-2" />Empezar gratis — 7 días
                  </Button>
                  <Button
                    onClick={() => navigate(createPageUrl("PricingPlans"))}
                    className="bg-white text-blue-900 hover:bg-gray-100 px-8 text-base font-semibold rounded-2xl border-0"
                    style={{ height: '52px' }}
                  >
                    Saber más
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </>
  );
}
import React, { useState, useEffect, useMemo } from "react";
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
  X
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
import SearchFilters from "../components/search/SearchFilters";
import MapView from "../components/search/MapView";
import SavedSearches from "../components/search/SavedSearches";
import { ActionButtonsCard } from "../components/profile/ActionButtons";

function slugify(text) {
  if (!text) return '';
  return text.toString().toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/g, 'n').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-+/g, '-');
}

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

const ProfileCard = React.memo(({ profile, onClick, onToggleFavorite, isFavorite, professionalUser, currentUserId, currentUser }) => {
  const { t } = useLanguage();
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
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

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
    toast.success("Número copiado");
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
  const isQuickResponder = profile.average_rating >= 4.5 && profile.total_reviews >= 3;
  const createdAt = profile.created_at || profile.created_date;
  const isNew = createdAt ? differenceInDays(new Date(), new Date(createdAt)) <= 30 : false;
  const photoUrl = professionalUser?.profile_picture || profile.imagen_principal;

  return (
    <div 
      onClick={onClick}
      className="cursor-pointer hover:shadow-lg transition-shadow bg-white rounded-2xl overflow-hidden border border-gray-100"
    >
      {/* Header azul con foto */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-700 h-24 relative">
        <div className="absolute -bottom-8 left-4">
          <img 
            src={photoUrl} 
            alt={profile.business_name}
            className="w-16 h-16 rounded-full border-4 border-white object-cover bg-blue-400"
            onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
          />
          <div className="w-16 h-16 rounded-full border-4 border-white bg-blue-500 hidden items-center justify-center text-white text-xl font-bold">
            {profile.business_name?.[0]?.toUpperCase()}
          </div>
        </div>
      </div>
      
      {/* Info */}
      <div className="pt-10 px-4 pb-2">
        <h3 className="font-bold text-gray-900 text-base truncate">{profile.business_name}</h3>
        <p className="text-blue-600 text-sm">{profile.categories?.[0]}</p>
        <p className="text-gray-500 text-xs mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" />{profile.ciudad}, {profile.provincia}</p>
        <p className="text-gray-600 text-sm mt-2 line-clamp-2">{profile.descripcion_corta}</p>
        {profile.tarifa_base > 0 && <p className="text-blue-600 font-semibold text-sm mt-1">{profile.tarifa_base}€/h</p>}
      </div>
      
      {/* Botones — stopPropagation para no ir al perfil */}
      <ActionButtonsCard 
        profile={profile}
        onChat={handleContactDirect}
        onWhatsApp={() => {}}
        onCall={() => {}}
      />
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
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  const FALLBACK_CATEGORIES = [
    "Abogado", "Albañil / Reformas", "Asesoría o gestoría", "Autónomo de limpieza",
    "Carpintero", "Cerrajero", "Climatización / Calefacción", "Electricista",
    "Empresa multiservicios", "Fontanero", "Informático a domicilio / soporte IT",
    "Jardinero", "Marketing digital / diseño web", "Peluquería y estética a domicilio",
    "Persianas y toldos", "Pintor", "Transportista"
  ].map((name, idx) => ({ id: `fallback_${idx}`, name }));

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const cats = await base44.entities.ServiceCategory.list();
        if (cats?.length > 0) return cats.filter(c => c.name).sort((a, b) => a.name.localeCompare(b.name, 'es'));
        return FALLBACK_CATEGORIES;
      } catch { return FALLBACK_CATEGORIES; }
    },
    initialData: FALLBACK_CATEGORIES,
    staleTime: Infinity, gcTime: Infinity, refetchOnWindowFocus: false, refetchOnMount: false,
  });

  const { data: profiles = [], isLoading: loadingProfiles } = useQuery({
    queryKey: ['professionalProfiles'],
    queryFn: async () => {
      const allProfiles = await base44.entities.ProfessionalProfile.list();
      return allProfiles.filter(p => p.visible_en_busqueda === true && p.onboarding_completed === true);
    },
    staleTime: 1000 * 60 * 5, gcTime: 1000 * 60 * 15, refetchOnWindowFocus: false,
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

  const filteredProfiles = useMemo(() => {
    const filtered = profiles.filter(profile => {
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
    return filtered.sort(() => Math.random() - 0.5);
  }, [profiles, debouncedSearchTerm, filters]);

  const availableCities = useMemo(() => {
    if (filters.provincia === "all") return [];
    return CIUDADES_POR_PROVINCIA[filters.provincia] || [];
  }, [filters.provincia]);

  const handleViewProfile = (profile) => {
    // URL SEO-friendly: /autonomo/:slug
    const slug = profile.slug_publico || slugify(profile.business_name);
    navigate(createPageUrl("Autonomo") + `/${slug}`);
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

        {/* ── HERO ── solo para visitantes no registrados */}
        {!user && !loadingUser && (
          <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)' }} className="relative overflow-hidden">
            {/* Decoración de fondo */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full" />
              <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-white/5 rounded-full" />
              <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-blue-400/10 rounded-full" />
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
                  {QUICK_CATEGORIES.map(({ name, icon: Icon }) => (
                    <button
                      key={name}
                      onClick={() => {
                        setFilters(f => ({ ...f, category: name }));
                        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="flex items-center gap-2 text-white border border-white/20 flex-shrink-0 active:bg-white/20"
                      style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px 16px', fontSize: '14px', fontWeight: 500, minHeight: '44px', touchAction: 'manipulation', whiteSpace: 'nowrap' }}
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
        )}

        {/* ── CONTENIDO PRINCIPAL ── */}
        <div className="max-w-7xl mx-auto px-4 py-5 overflow-visible" id="results-section">

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
                <SearchFilters
                  filters={filters}
                  onFilterChange={setFilters}
                  availableCities={availableCities}
                  categories={categories}
                  provinces={PROVINCIAS}
                />
              </div>
            </div>
          )}

          {/* Filtros visita sin login — siempre visible pero compacto */}
          {!user && (
            <div className="mb-5 bg-white rounded-2xl p-4 shadow-sm border border-gray-100" style={{ position: 'relative', zIndex: 10 }}>
              <div className="flex gap-2 items-center flex-wrap">
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
                {/* chips activos */}
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
              {showFilters && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <SearchFilters
                    filters={filters}
                    onFilterChange={setFilters}
                    availableCities={availableCities}
                    categories={categories}
                    provinces={PROVINCIAS}
                  />
                </div>
              )}
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
                  className={`h-8 w-8 p-0 ${viewMode === "grid" ? "bg-blue-600 border-blue-600" : "border-gray-200"}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </Button>
                <Button
                  variant={viewMode === "map" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("map")}
                  className={`h-8 w-8 p-0 ${viewMode === "map" ? "bg-blue-600 border-blue-600" : "border-gray-200"}`}
                >
                  <MapPin className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Skeleton loading */}
          {isInitialLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, idx) => (
                <div key={idx} className="bg-white rounded-2xl overflow-hidden border border-gray-100" style={{ height: '300px' }}>
                  <div className="h-20 bg-gradient-to-r from-gray-200 to-gray-100 animate-pulse" />
                  <div className="p-4 pt-9 space-y-3">
                    <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-1/2 bg-gray-100 rounded animate-pulse" />
                    <div className="h-8 w-full bg-gray-100 rounded-lg animate-pulse mt-4" />
                    <div className="h-9 w-full bg-gray-100 rounded-xl animate-pulse mt-2" />
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
                  <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))' }}>
                    {filteredProfiles.slice(0, displayLimit).map((profile) => (
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
                <MapView profiles={filteredProfiles} onProfileClick={handleViewProfile} />
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
    </>
  );
}
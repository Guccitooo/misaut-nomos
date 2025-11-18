import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search as SearchIcon,
  MapPin,
  Star,
  Heart,
  Filter,
  Briefcase,
  Phone,
  MessageCircle,
  MessageSquare,
  Zap,
  Hammer,
  Wrench,
  Home,
  Paintbrush,
  Leaf,
  Truck,
  Trash2,
  Key,
  Wind,
  Settings,
  AlertCircle,
  User,
  Loader2
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "../components/ui/LanguageSwitcher";
import TranslatedText from "../components/ui/TranslatedText";
import OptimizedImage from "../components/ui/OptimizedImage";
import SEOHead from "../components/seo/SEOHead";
import { OrganizationSchema, ServiceSchema } from "../components/seo/StructuredData";
import ContactButtons from "../components/ui/ContactButtons";

const isSubscriptionActive = (estado, fechaExpiracion) => {
  if (!estado) return false;
  
  const normalizedState = estado.toLowerCase().trim();
  const validStates = ["activo", "active", "en_prueba", "trialing", "trial_active", "actif"];
  
  if (validStates.includes(normalizedState)) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiration = new Date(fechaExpiracion);
      expiration.setHours(0, 0, 0, 0);
      
      return expiration >= today;
    } catch (error) {
      return true;
    }
  }
  
  if (normalizedState === "cancelado" || normalizedState === "canceled") {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiration = new Date(fechaExpiracion);
      expiration.setHours(0, 0, 0, 0);
      
      return expiration >= today;
    } catch (error) {
      return false;
    }
  }
  
  return false;
};

const CATEGORY_ICONS = {
  "Electricista": Zap,
  "Carpintero": Hammer,
  "Fontanero": Wrench,
  "Albañil / Reformas": Home,
  "Pintor": Paintbrush,
  "Jardinero": Leaf,
  "Transportista": Truck,
  "Autónomo de limpieza": Trash2,
  "Cerrajero": Key,
  "Instalador de aire acondicionado": Wind,
  "Mantenimiento general": Settings
};

const BASE_CATEGORIES = [
  { name: "Albañil / Reformas", icon: "Home" },
  { name: "Autónomo de limpieza", icon: "Trash2" },
  { name: "Carpintero", icon: "Hammer" },
  { name: "Cerrajero", icon: "Key" },
  { name: "Electricista", icon: "Zap" },
  { name: "Fontanero", icon: "Wrench" },
  { name: "Instalador de aire acondicionado", icon: "Wind" },
  { name: "Jardinero", icon: "Leaf" },
  { name: "Mantenimiento de piscinas", icon: "Settings" },
  { name: "Mantenimiento general", icon: "Settings" },
  { name: "Pintor", icon: "Paintbrush" },
  { name: "Transportista", icon: "Truck" }
];

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const CategoryBadge = React.memo(({ category }) => {
  const { t } = useLanguage();
  const Icon = CATEGORY_ICONS[category] || Briefcase;
  
  return (
    <Badge variant="outline" className="text-xs flex items-center gap-1">
      <Icon className="w-3 h-3" />
      {t(category)}
    </Badge>
  );
});

const ProfileCard = React.memo(({ profile, user, onToggleFavorite, onStartChat, isFavorite, favoriteCount, profileUser, onProfileClick }) => {
  const { t } = useLanguage();

  return (
    <Card className="overflow-hidden hover:shadow-md transition-all duration-200 border border-gray-200 bg-white h-full flex flex-col active:scale-[0.98]">
      <CardContent className="p-3 flex flex-col flex-1 min-h-[280px]">
        <div className="flex items-start gap-2.5 mb-2.5">
          <div className="flex-shrink-0">
            <div 
              className="w-14 h-14 rounded-full overflow-hidden border-2 border-blue-600 bg-blue-100 cursor-pointer"
              onClick={() => onProfileClick(profile.user_id)}
            >
              {profileUser?.profile_picture ? (
                <OptimizedImage
                  src={profileUser.profile_picture} 
                  alt={`Foto de perfil de ${profile.business_name}`}
                  className="w-full h-full"
                  objectFit="cover"
                  width={56}
                  height={56}
                  priority={false}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800 text-white font-bold text-xl">
                  {profile.business_name?.charAt(0)}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 
              className="font-bold text-base text-gray-900 hover:text-blue-700 transition-colors line-clamp-1 cursor-pointer"
              onClick={() => onProfileClick(profile.user_id)}
            >
              {profile.business_name}
            </h3>
            {profile.average_rating > 0 ? (
              <div className="flex items-center gap-1 mt-0.5">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 flex-shrink-0" />
                <span className="text-sm font-semibold text-gray-700">
                  {profile.average_rating.toFixed(1)}
                </span>
                <span className="text-xs text-gray-500">
                  ({profile.total_reviews})
                </span>
              </div>
            ) : (
              <div className="h-5 mt-0.5"></div>
            )}
          </div>

          <Button
            size="icon"
            variant="ghost"
            className={`h-9 w-9 flex-shrink-0 ${isFavorite ? 'text-red-500' : 'text-gray-400'}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(profile.user_id);
            }}
            aria-label={isFavorite ? 'Eliminar de favoritos' : 'Añadir a favoritos'}
          >
            <Heart 
              className={`w-4.5 h-4.5 transition-all ${
                isFavorite ? 'fill-red-500' : ''
              }`}
            />
          </Button>
        </div>

        <div 
          className="flex flex-wrap gap-1 mb-2 cursor-pointer"
          onClick={() => onProfileClick(profile.user_id)}
        >
          {profile.categories?.slice(0, 2).map((cat, idx) => (
            <CategoryBadge key={idx} category={cat} />
          ))}
          {profile.categories?.length > 2 && (
            <Badge variant="outline" className="text-xs py-0.5 px-1.5">
              +{profile.categories.length - 2}
            </Badge>
          )}
        </div>

        {profile.service_area && (
          <div 
            className="mb-2 cursor-pointer"
            onClick={() => onProfileClick(profile.user_id)}
          >
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{profile.service_area}</span>
            </div>
          </div>
        )}

        <div 
          className="mb-3 cursor-pointer flex-1"
          onClick={() => onProfileClick(profile.user_id)}
        >
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
            <TranslatedText 
              text={profile.descripcion_corta || profile.description || "Profesional disponible"} 
            />
          </p>
        </div>

        <div className="mt-auto pt-2 border-t border-gray-100">
          <ContactButtons
            phone={profile.telefono_contacto}
            businessName={profile.business_name}
            enablePhone={profile.metodos_contacto?.includes('telefono')}
            enableWhatsApp={profile.metodos_contacto?.includes('whatsapp')}
            enableChat={true}
            onChatClick={() => onStartChat(profile.user_id, profile.business_name)}
            size="sm"
            layout="grid"
          />
        </div>
      </CardContent>
    </Card>
  );
});

ProfileCard.displayName = 'ProfileCard';

export default function SearchPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProvincia, setSelectedProvincia] = useState("all");
  const [selectedCiudad, setSelectedCiudad] = useState("all");
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [userFavorites, setUserFavorites] = useState(new Set());

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadUserFavorites();
    }
  }, [user]);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoadingUser(false);
    }
  };

  const loadUserFavorites = async () => {
    try {
      const favorites = await base44.entities.Favorite.filter({
        client_id: user.id
      });
      const favSet = new Set(favorites.map(f => f.professional_id));
      setUserFavorites(favSet);
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
  };

  const { data: availableCategories = BASE_CATEGORIES.map(c => c.name) } = useQuery({
    queryKey: ['availableCategories'],
    queryFn: async () => {
      const profiles = await base44.entities.ProfessionalProfile.list();
      const usedCategories = new Set();
      
      profiles.forEach(profile => {
        if (profile.categories && Array.isArray(profile.categories)) {
          profile.categories.forEach(cat => usedCategories.add(cat));
        }
      });

      const allCategories = new Set([
        ...BASE_CATEGORIES.map(c => c.name),
        ...Array.from(usedCategories)
      ]);

      return Array.from(allCategories).sort();
    },
    staleTime: 1000 * 60 * 15,
  });

  const { data: subscriptions = [], isLoading: loadingSubscriptions } = useQuery({
    queryKey: ['allSubscriptions'],
    queryFn: async () => {
      const subs = await base44.entities.Subscription.list();
      return subs;
    },
    staleTime: 1000 * 60 * 10,
    refetchOnMount: false,
  });

  const { data: allProfiles = [], isLoading: loadingProfiles } = useQuery({
    queryKey: ['allProfiles'],
    queryFn: async () => {
      const fresh = await base44.entities.ProfessionalProfile.list('-updated_date', 100);
      return fresh;
    },
    staleTime: 1000 * 60 * 10,
    refetchOnMount: false,
  });

  const profiles = useMemo(() => {
    const visibleProfiles = allProfiles.filter(profile => {
      if (!profile.onboarding_completed) return false;
      if (!profile.visible_en_busqueda) return false;
      if (profile.estado_perfil !== "activo") return false;
      
      const userSub = subscriptions.find(sub => sub.user_id === profile.user_id);
      if (!userSub) return false;
      
      const today = new Date();
      const expirationDate = new Date(userSub.fecha_expiracion);
      const isStillInPeriod = expirationDate >= today;
      
      const validStates = ["activo", "active", "en_prueba", "trialing", "cancelado", "canceled"];
      const hasValidState = validStates.includes(userSub.estado?.toLowerCase());
      
      if (!hasValidState || !isStillInPeriod) return false;
      
      return true;
    });

    return visibleProfiles;
  }, [allProfiles, subscriptions]);

  const { data: favoriteCounts = {} } = useQuery({
    queryKey: ['favoriteCounts'],
    queryFn: async () => {
      const allFavorites = await base44.entities.Favorite.list();
      const counts = {};
      allFavorites.forEach(fav => {
        counts[fav.professional_id] = (counts[fav.professional_id] || 0) + 1;
      });
      return counts;
    },
    staleTime: 1000 * 60 * 10,
  });

  const { data: profileUsers = {} } = useQuery({
    queryKey: ['profileUsers'],
    queryFn: async () => {
      const userIds = [...new Set(profiles.map(p => p.user_id))];
      const users = await Promise.all(
        userIds.map(async (id) => {
          const u = await base44.entities.User.filter({ id });
          return u[0];
        })
      );
      
      const usersMap = {};
      users.forEach(u => {
        if (u) usersMap[u.id] = u;
      });
      return usersMap;
    },
    enabled: profiles.length > 0,
    staleTime: 1000 * 60 * 10,
  });

  const availableProvincias = useMemo(() => {
    const provincias = new Set();
    profiles.forEach(profile => {
      if (profile.provincia && profile.provincia.trim() !== "") {
        provincias.add(profile.provincia);
      }
    });
    return Array.from(provincias).sort();
  }, [profiles]);

  const availableCiudades = useMemo(() => {
    const ciudades = new Set();
    profiles.forEach(profile => {
      if (selectedProvincia !== "all" && profile.provincia !== selectedProvincia) {
        return;
      }
      if (profile.ciudad && profile.ciudad.trim() !== "") {
        ciudades.add(profile.ciudad);
      }
    });
    return Array.from(ciudades).sort();
  }, [profiles, selectedProvincia]);

  const filteredProfiles = useMemo(() => {
    return profiles.filter(profile => {
      const matchesSearch = !debouncedSearchTerm || 
        profile.business_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        profile.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        profile.descripcion_corta?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === "all" || 
        profile.categories?.includes(selectedCategory);
      
      const matchesProvincia = selectedProvincia === "all" || 
        profile.provincia === selectedProvincia;
      
      const matchesCiudad = selectedCiudad === "all" || 
        profile.ciudad === selectedCiudad;
      
      return matchesSearch && matchesCategory && matchesProvincia && matchesCiudad;
    }).sort((a, b) => {
      return (b.average_rating || 0) - (a.average_rating || 0);
    });
  }, [profiles, debouncedSearchTerm, selectedCategory, selectedProvincia, selectedCiudad]);

  // Track search appearances when filters change
  useEffect(() => {
    if (filteredProfiles.length > 0) {
      trackSearchAppearances(filteredProfiles.map(p => p.user_id));
    }
  }, [filteredProfiles]);

  const trackSearchAppearances = async (professionalIds) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      for (const profId of professionalIds) {
        const existingMetrics = await base44.entities.ProfileMetrics.filter({
          professional_id: profId,
          date: today
        });

        if (existingMetrics.length > 0) {
          await base44.entities.ProfileMetrics.update(existingMetrics[0].id, {
            search_appearances: (existingMetrics[0].search_appearances || 0) + 1
          });
        } else {
          await base44.entities.ProfileMetrics.create({
            professional_id: profId,
            date: today,
            profile_views: 0,
            search_appearances: 1,
            messages_received: 0,
            contact_clicks: 0
          });
        }
      }
    } catch (error) {
      console.error('Error tracking search appearances:', error);
    }
  };

  const handleToggleFavorite = async (professionalId) => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }

    try {
      const isFavorite = userFavorites.has(professionalId);
      
      if (isFavorite) {
        const favorites = await base44.entities.Favorite.filter({
          client_id: user.id,
          professional_id: professionalId
        });
        if (favorites.length > 0) {
          await base44.entities.Favorite.delete(favorites[0].id);
        }
        
        setUserFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(professionalId);
          return newSet;
        });
      } else {
        const profile = profiles.find(p => p.user_id === professionalId); 
        await base44.entities.Favorite.create({
          client_id: user.id,
          professional_id: professionalId,
          business_name: profile.business_name
        });
        
        setUserFavorites(prev => {
          const newSet = new Set(prev);
          newSet.add(professionalId);
          return newSet;
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['favoriteCounts'] });
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleStartChat = async (professionalId, businessName) => {
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
        professional_name: businessName,
        client_name: user.full_name || user.email,
        is_read: false
      });
    }

    navigate(createPageUrl("Messages") + `?conversation=${conversationId}&professional=${professionalId}`);
  };

  const handleProfileClick = (professionalId) => {
    navigate(createPageUrl("ProfessionalProfile") + `?id=${professionalId}`);
  };

  const getCategoryIcon = (categoryName) => {
    const Icon = CATEGORY_ICONS[categoryName] || Briefcase;
    return Icon;
  };

  const isLoading = loadingProfiles || loadingSubscriptions;
  const showHeroBanner = !isLoadingUser && !user;

  return (
    <>
      <SEOHead 
        title="MisAutónomos - Encuentra profesionales verificados cerca de ti"
        description="Busca y contacta con electricistas, fontaneros, carpinteros y más autónomos verificados en toda España. Gratis para clientes."
        keywords="autónomos españa, electricista, fontanero, carpintero, profesionales verificados, servicios locales, reformas, mantenimiento"
      />
      
      <OrganizationSchema />
      <ServiceSchema 
        categories={selectedCategory !== "all" ? [selectedCategory] : availableCategories}
        location={selectedCiudad !== "all" ? selectedCiudad : (selectedProvincia !== "all" ? selectedProvincia : "España")}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* HERO BANNER - Always rendered, visibility controlled by opacity */}
        <div 
          className="bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-lg transition-all duration-300"
          style={{ 
            minHeight: showHeroBanner ? 'auto' : '0px',
            maxHeight: showHeroBanner ? '600px' : '0px',
            opacity: showHeroBanner ? 1 : 0,
            overflow: 'hidden',
            paddingTop: showHeroBanner ? '2.5rem' : '0',
            paddingBottom: showHeroBanner ? '2.5rem' : '0',
            paddingLeft: '1rem',
            paddingRight: '1rem'
          }}
          aria-hidden={!showHeroBanner}
        >
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-2 tracking-tight leading-tight">
              {t('heroTitle')}
            </h1>
            <p className="text-base md:text-lg text-blue-100 max-w-xl mx-auto mb-6">
              {t('heroSubtitle')}
            </p>

            <div className="space-y-3">
              <p className="text-sm md:text-base text-blue-100 font-medium">
                {t('chooseHow')}
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5 justify-center items-center max-w-md mx-auto">
                <Link to={createPageUrl("PricingPlans")} className="w-full sm:w-auto">
                  <Button 
                    size="lg" 
                    className="w-full sm:min-w-[180px] h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-lg transition-all active:scale-95 text-sm"
                  >
                    <Briefcase className="w-4 h-4 mr-2" />
                    {t('imFreelancer')}
                  </Button>
                </Link>

                <Link to={createPageUrl("ClientOnboarding")} className="w-full sm:w-auto">
                  <Button 
                    size="lg" 
                    className="w-full sm:min-w-[180px] h-12 bg-white hover:bg-gray-50 text-blue-700 font-semibold shadow-lg transition-all active:scale-95 text-sm"
                  >
                    <User className="w-4 h-4 mr-2" />
                    {t('imClient')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="max-w-7xl mx-auto px-3 lg:px-4 py-4 lg:py-6">
          <Card className="mb-6 lg:mb-8 shadow-md lg:shadow-lg border-0">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-blue-700" />
                <h2 className="font-semibold text-lg text-gray-900">{t('filters')}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder={t('search')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11"
                    aria-label="Buscar profesionales"
                  />
                </div>

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-11" aria-label="Filtrar por categoría">
                    <SelectValue placeholder={t('allCategories')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        <span>{t('allCategories')}</span>
                      </div>
                    </SelectItem>
                    {availableCategories.map((cat) => {
                      const Icon = getCategoryIcon(cat);
                      return (
                        <SelectItem key={cat} value={cat}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            <span>{t(cat)}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                <Select 
                  value={selectedProvincia} 
                  onValueChange={(value) => {
                    setSelectedProvincia(value);
                    setSelectedCiudad("all");
                  }}
                >
                  <SelectTrigger className="h-11" aria-label="Filtrar por provincia">
                    <SelectValue placeholder={t('allProvinces')} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{t('allProvinces')}</span>
                      </div>
                    </SelectItem>
                    {availableProvincias.map((provincia) => (
                      <SelectItem key={provincia} value={provincia}>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{provincia}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select 
                  value={selectedCiudad} 
                  onValueChange={setSelectedCiudad}
                >
                  <SelectTrigger className="h-11" aria-label="Filtrar por ciudad">
                    <SelectValue placeholder={t('allCities')} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{t('allCities')}</span>
                      </div>
                    </SelectItem>
                    {availableCiudades.map((ciudad) => (
                      <SelectItem key={ciudad} value={ciudad}>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{ciudad}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Cargando autónomos...
                </span>
              ) : (
                `${filteredProfiles.length} ${t('freelancersAvailable')}`
              )}
            </h2>
            <p className="text-sm text-gray-600">
              {t('verifiedProfessionals')}
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Card key={i} className="overflow-hidden h-full">
                  <CardContent className="p-4 flex flex-col h-full">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-2" />
                    <div className="flex gap-1 mb-2">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                    <Skeleton className="h-4 w-2/3 mb-2" />
                    <Skeleton className="h-10 w-full mb-3" />
                    <div className="flex-1"></div>
                    <Skeleton className="h-8 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProfiles.length === 0 ? (
            <Card className="p-12 text-center border-0 shadow-lg bg-gradient-to-br from-orange-50 to-yellow-50">
              <AlertCircle className="w-16 h-16 text-orange-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t('noResults')}
              </h3>
              <p className="text-gray-600 max-w-md mx-auto mb-6">
                {t('tryDifferentFilters')}
              </p>
              {(selectedCategory !== "all" || selectedProvincia !== "all" || selectedCiudad !== "all" || searchTerm) && (
                <Button
                  onClick={() => {
                    setSelectedCategory("all");
                    setSelectedProvincia("all");
                    setSelectedCiudad("all");
                    setSearchTerm("");
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {t('viewAll')}
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4 items-stretch">
              {filteredProfiles.map((profile) => (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  user={user}
                  profileUser={profileUsers[profile.user_id]}
                  onToggleFavorite={handleToggleFavorite}
                  onStartChat={handleStartChat}
                  onProfileClick={handleProfileClick}
                  isFavorite={userFavorites.has(profile.user_id)}
                  favoriteCount={favoriteCounts[profile.user_id] || 0}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
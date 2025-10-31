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
  TrendingUp
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// ✅ HELPER: Verificar si suscripción está activa
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

// ✅ Categorías con iconos
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
  "Mantenimiento general": Settings,
  "Fontanería": Wrench,
  "Albañilería": Home,
  "Electricidad": Zap,
  "Carpintería": Hammer,
  "Pintura": Paintbrush,
  "Jardinería": Leaf,
  "Transporte": Truck,
  "Limpieza": Trash2,
  "Cerrajería": Key,
  "Aire acondicionado": Wind,
  "Mantenimiento": Settings
};

const BASE_CATEGORIES = [
  { name: "Electricista", icon: "Zap" },
  { name: "Carpintero", icon: "Hammer" },
  { name: "Fontanero", icon: "Wrench" },
  { name: "Albañil / Reformas", icon: "Home" },
  { name: "Pintor", icon: "Paintbrush" },
  { name: "Jardinero", icon: "Leaf" },
  { name: "Transportista", icon: "Truck" },
  { name: "Autónomo de limpieza", icon: "Trash2" },
  { name: "Cerrajero", icon: "Key" },
  { name: "Instalador de aire acondicionado", icon: "Wind" },
  { name: "Mantenimiento general", icon: "Settings" }
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

const CategoryBadge = ({ category }) => {
  const Icon = CATEGORY_ICONS[category] || Briefcase;
  return (
    <Badge variant="outline" className="text-xs flex items-center gap-1 bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100 transition-colors">
      <Icon className="w-3 h-3" />
      {category}
    </Badge>
  );
};

// ✅ SKELETON LOADER MEJORADO
const ProfileCardSkeleton = () => (
  <Card className="overflow-hidden border border-gray-200 bg-white h-full">
    <CardContent className="p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-16" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-16 w-full" />
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </CardContent>
  </Card>
);

const ProfileCard = React.memo(({ profile, user, onToggleFavorite, onStartChat, navigate, isFavorite, favoriteCount }) => {
  const formatPhoneForCall = (phone) => {
    if (!phone) return null;
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (!cleaned.startsWith('+')) {
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

  return (
    <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-200 hover:border-blue-300 bg-white h-full flex flex-col cursor-pointer transform hover:-translate-y-1">
      <CardContent className="p-5 flex flex-col flex-1">
        {/* Header con nombre y rating */}
        <div className="flex items-start justify-between mb-3 min-h-[56px]">
          <div className="flex-1 min-w-0">
            <h3 
              className="font-bold text-lg text-gray-900 hover:text-blue-700 transition-colors truncate cursor-pointer leading-tight"
              onClick={() => navigate(createPageUrl("ProfessionalProfile") + `?id=${profile.user_id}`)}
            >
              {profile.business_name}
            </h3>
            {profile.average_rating > 0 ? (
              <div className="flex items-center gap-1 mt-1.5">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-semibold text-gray-700">
                  {profile.average_rating.toFixed(1)}
                </span>
                <span className="text-xs text-gray-500">
                  ({profile.total_reviews} {profile.total_reviews === 1 ? 'opinión' : 'opiniones'})
                </span>
              </div>
            ) : (
              <div className="h-5 mt-1.5"></div>
            )}
          </div>
          
          {/* Botón de favorito */}
          <div className="flex flex-col items-end gap-1 ml-3">
            <Button
              size="icon"
              variant="ghost"
              className={`h-10 w-10 rounded-full transition-all duration-200 ${
                isFavorite 
                  ? 'text-red-500 bg-red-50 hover:bg-red-100' 
                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(profile.user_id);
              }}
            >
              <Heart 
                className={`w-5 h-5 transition-all ${
                  isFavorite ? 'fill-red-500 scale-110' : ''
                }`}
              />
            </Button>
            {favoriteCount > 0 && (
              <span className="text-xs text-gray-500 font-medium">{favoriteCount}</span>
            )}
          </div>
        </div>

        {/* Categorías */}
        <div 
          className="flex flex-wrap gap-1.5 mb-3 min-h-[28px] cursor-pointer"
          onClick={() => navigate(createPageUrl("ProfessionalProfile") + `?id=${profile.user_id}`)}
        >
          {profile.categories?.slice(0, 2).map((cat, idx) => (
            <CategoryBadge key={idx} category={cat} />
          ))}
          {profile.categories?.length > 2 && (
            <Badge variant="outline" className="text-xs bg-gray-50 border-gray-300 text-gray-700">
              +{profile.categories.length - 2}
            </Badge>
          )}
        </div>

        {/* Ubicación */}
        <div 
          className="mb-3 min-h-[20px] cursor-pointer"
          onClick={() => navigate(createPageUrl("ProfessionalProfile") + `?id=${profile.user_id}`)}
        >
          {profile.service_area ? (
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span className="truncate font-medium">{profile.service_area}</span>
            </div>
          ) : (
            <div></div>
          )}
        </div>

        {/* Descripción */}
        <div 
          className="mb-4 min-h-[44px] cursor-pointer flex-grow"
          onClick={() => navigate(createPageUrl("ProfessionalProfile") + `?id=${profile.user_id}`)}
        >
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {profile.descripcion_corta || profile.description || "Profesional disponible para tus proyectos"}
          </p>
        </div>

        {/* Botones de acción */}
        {profile.telefono_contacto && (
          <div className="grid grid-cols-3 gap-2 mt-auto">
            <a
              href={`tel:${formatPhoneForCall(profile.telefono_contacto)}`}
              onClick={(e) => e.stopPropagation()}
              className="block"
            >
              <Button 
                variant="outline" 
                size="sm"
                className="w-full h-11 hover:bg-blue-50 hover:border-blue-600 hover:text-blue-600 transition-all group/btn"
              >
                <Phone className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
              </Button>
            </a>
            <a
              href={`https://wa.me/${formatPhoneForWhatsApp(profile.telefono_contacto)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="block"
            >
              <Button 
                size="sm"
                className="w-full h-11 bg-green-600 hover:bg-green-700 transition-all shadow-sm hover:shadow-md group/btn"
              >
                <MessageCircle className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
              </Button>
            </a>
            <Button
              size="sm"
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 transition-all shadow-sm hover:shadow-md group/btn"
              onClick={(e) => {
                e.stopPropagation();
                onStartChat(profile.user_id, profile.business_name);
              }}
            >
              <MessageSquare className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

ProfileCard.displayName = 'ProfileCard';

export default function SearchPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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

  const { data: availableCategories = [] } = useQuery({
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
    staleTime: 1000 * 60 * 10,
    initialData: BASE_CATEGORIES.map(c => c.name),
  });

  const { data: subscriptions = [], isLoading: loadingSubscriptions } = useQuery({
    queryKey: ['allSubscriptions'],
    queryFn: async () => {
      const subs = await base44.entities.Subscription.list();
      return subs;
    },
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 10,
    initialData: [],
  });

  const { data: profiles = [], isLoading: loadingProfiles } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const allProfiles = await base44.entities.ProfessionalProfile.list('-updated_date', 100);
      
      if (subscriptions.length === 0 && !loadingSubscriptions) {
        return [];
      }
      
      const visibleProfiles = allProfiles.filter(profile => {
        if (!profile.onboarding_completed) return false;
        if (!profile.visible_en_busqueda) return false;
        if (profile.estado_perfil !== "activo") return false;
        
        const userSub = subscriptions.find(sub => sub.user_id === profile.user_id);
        if (!userSub) return false;
        
        const isActive = isSubscriptionActive(userSub.estado, userSub.fecha_expiracion);
        return isActive;
      });
      
      return visibleProfiles;
    },
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 10,
    initialData: [],
    enabled: !loadingSubscriptions && subscriptions.length > 0,
  });

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
    staleTime: 1000 * 60 * 5,
    initialData: {},
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

  const getCategoryIcon = (categoryName) => {
    const Icon = CATEGORY_ICONS[categoryName] || Briefcase;
    return Icon;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 text-white py-16 px-4 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight">
              Encuentra el autónomo perfecto
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-6">
              Profesionales cualificados y verificados en toda España
            </p>
            
            {!isLoadingUser && !user && (
              <div className="space-y-4 mt-8">
                <p className="text-base text-blue-100 font-medium">
                  Elige cómo quieres empezar:
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
                  <Link to={createPageUrl("PricingPlans")} className="w-full sm:w-auto">
                    <Button 
                      size="lg" 
                      className="w-full sm:min-w-[200px] bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-xl transition-all hover:scale-105 border-2 border-orange-400 h-14 text-base"
                    >
                      🧰 Soy autónomo
                    </Button>
                  </Link>
                  
                  <Link to={createPageUrl("ClientOnboarding")} className="w-full sm:w-auto">
                    <Button 
                      size="lg" 
                      className="w-full sm:min-w-[200px] bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-xl transition-all hover:scale-105 border-2 border-blue-400 h-14 text-base"
                    >
                      👤 Soy cliente
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filtros mejorados */}
        <Card className="mb-8 shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Filter className="w-5 h-5 text-blue-700" />
              </div>
              <h2 className="font-semibold text-xl text-gray-900">Filtros de búsqueda</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Buscar servicio, empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-11 h-12 border-2 focus:border-blue-500 transition-all"
                />
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-12 border-2 focus:border-blue-500">
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      <span>Todas las categorías</span>
                    </div>
                  </SelectItem>
                  {availableCategories.map((cat) => {
                    const Icon = getCategoryIcon(cat);
                    return (
                      <SelectItem key={cat} value={cat}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <span>{cat}</span>
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
                <SelectTrigger className="h-12 border-2 focus:border-blue-500">
                  <SelectValue placeholder="Todas las provincias" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>Todas las provincias</span>
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
                <SelectTrigger className="h-12 border-2 focus:border-blue-500">
                  <SelectValue placeholder="Todas las ciudades" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>Todas las ciudades</span>
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

        {/* Contador de resultados */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              {loadingProfiles || loadingSubscriptions ? (
                <>
                  <Skeleton className="h-7 w-32" />
                </>
              ) : (
                <>
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                  {filteredProfiles.length} autónomos disponibles
                </>
              )}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Profesionales verificados en toda España
            </p>
          </div>
          
          {(selectedCategory !== "all" || selectedProvincia !== "all" || selectedCiudad !== "all" || searchTerm) && (
            <Button
              variant="outline"
              onClick={() => {
                setSelectedCategory("all");
                setSelectedProvincia("all");
                setSelectedCiudad("all");
                setSearchTerm("");
              }}
              className="hover:bg-blue-50 hover:border-blue-600"
            >
              Limpiar filtros
            </Button>
          )}
        </div>

        {/* Grid de perfiles */}
        {(loadingProfiles || loadingSubscriptions) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <ProfileCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProfiles.map((profile, index) => (
              <div
                key={profile.id}
                style={{
                  animation: `fadeInUp 0.5s ease-out ${index * 0.05}s both`
                }}
              >
                <ProfileCard
                  profile={profile}
                  user={user}
                  onToggleFavorite={handleToggleFavorite}
                  onStartChat={handleStartChat}
                  navigate={navigate}
                  isFavorite={userFavorites.has(profile.user_id)}
                  favoriteCount={favoriteCounts[profile.user_id] || 0}
                />
              </div>
            ))}
          </div>
        )}

        {/* Empty state mejorado */}
        {!loadingProfiles && !loadingSubscriptions && filteredProfiles.length === 0 && (
          <Card className="p-16 text-center border-0 shadow-2xl bg-gradient-to-br from-orange-50 to-yellow-50">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-orange-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {selectedCategory !== "all" 
                  ? `🚧 Todavía no hay profesionales en "${selectedCategory}"`
                  : "No se encontraron resultados"}
              </h3>
              <p className="text-gray-600 mb-8 text-lg">
                {profiles.length === 0 
                  ? 'No hay perfiles en la base de datos. Contacta con el administrador.'
                  : (selectedCategory !== "all" || selectedProvincia !== "all" || selectedCiudad !== "all")
                    ? 'Prueba con otros filtros o elimina los filtros activos.'
                    : 'Intenta modificar tus criterios de búsqueda.'}
              </p>
              {(selectedCategory !== "all" || selectedProvincia !== "all" || selectedCiudad !== "all" || searchTerm) && (
                <Button
                  onClick={() => {
                    setSelectedCategory("all");
                    setSelectedProvincia("all");
                    setSelectedCiudad("all");
                    setSearchTerm("");
                  }}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 shadow-lg h-12 px-8"
                >
                  Ver todos los autónomos
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
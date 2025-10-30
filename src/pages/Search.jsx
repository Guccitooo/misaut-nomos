
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
  AlertCircle
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// ✅ HELPER: Verificar si suscripción está activa (fuente única de verdad)
const isSubscriptionActive = (estado, fechaExpiracion) => {
  console.log('🔍 Verificando suscripción:', { estado, fechaExpiracion });
  
  if (!estado) {
    console.log('❌ Sin estado');
    return false;
  }
  
  // ✅ Normalizar estado (minúsculas, sin espacios)
  const normalizedState = estado.toLowerCase().trim();
  
  const validStates = ["activo", "active", "en_prueba", "trialing", "trial_active", "actif"];
  
  // Si está en un estado válido
  if (validStates.includes(normalizedState)) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiration = new Date(fechaExpiracion);
      expiration.setHours(0, 0, 0, 0);
      
      const isValid = expiration >= today;
      console.log(`✅ Estado válido (${normalizedState}), fecha ${isValid ? 'válida' : 'expirada'}:`, {
        today: today.toISOString().split('T')[0],
        expiration: expiration.toISOString().split('T')[0],
        isValid
      });
      return isValid;
    } catch (error) {
      console.error('❌ Error parseando fecha:', error);
      // Si hay error parseando fecha, pero el estado es válido, asumir que está activo
      return true;
    }
  }
  
  // Si está cancelado pero aún tiene tiempo
  if (normalizedState === "cancelado" || normalizedState === "canceled") {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiration = new Date(fechaExpiracion);
      expiration.setHours(0, 0, 0, 0);
      
      const isValid = expiration >= today;
      console.log(`⚪ Cancelado, fecha ${isValid ? 'válida' : 'expirada'}:`, {
        today: today.toISOString().split('T')[0],
        expiration: expiration.toISOString().split('T')[0],
        isValid
      });
      return isValid;
    } catch (error) {
      console.error('❌ Error parseando fecha:', error);
      return false;
    }
  }
  
  console.log('❌ Estado no válido:', normalizedState);
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

// ✅ Categorías base que siempre aparecen
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

// ✅ Componente de categoría con icono
const CategoryBadge = ({ category }) => {
  const Icon = CATEGORY_ICONS[category] || Briefcase;
  return (
    <Badge variant="outline" className="text-xs flex items-center gap-1">
      <Icon className="w-3 h-3" />
      {category}
    </Badge>
  );
};

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
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 border border-gray-200 bg-white h-full flex flex-col">
      <CardContent className="p-4 flex flex-col flex-1">
        {/* ✅ Header: Nombre + Rating + Favoritos - ALTURA FIJA 48px */}
        <div className="flex items-start justify-between mb-2 h-12">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base text-gray-900 hover:text-blue-700 transition-colors truncate cursor-pointer"
                onClick={() => navigate(createPageUrl("ProfessionalProfile") + `?id=${profile.user_id}`)}>
              {profile.business_name}
            </h3>
            {profile.average_rating > 0 ? (
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-semibold text-gray-700">
                  {profile.average_rating.toFixed(1)}
                </span>
                <span className="text-xs text-gray-500">
                  ({profile.total_reviews})
                </span>
              </div>
            ) : (
              <div className="h-5 mt-1"></div>
            )}
          </div>
          
          {/* ✅ Favorito compacto */}
          <div className="flex flex-col items-end gap-1 ml-2">
            <Button
              size="icon"
              variant="ghost"
              className={`h-8 w-8 ${isFavorite ? 'text-red-500' : 'text-gray-400'}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(profile.user_id);
              }}
            >
              <Heart 
                className={`w-4 h-4 transition-all ${
                  isFavorite ? 'fill-red-500' : ''
                }`}
              />
            </Button>
            {favoriteCount > 0 && (
              <span className="text-xs text-gray-500">{favoriteCount}</span>
            )}
          </div>
        </div>

        {/* ✅ Categorías - ALTURA FIJA 28px */}
        <div 
          className="flex flex-wrap gap-1 mb-2 h-7 cursor-pointer"
          onClick={() => navigate(createPageUrl("ProfessionalProfile") + `?id=${profile.user_id}`)}
        >
          {profile.categories?.slice(0, 2).map((cat, idx) => (
            <CategoryBadge key={idx} category={cat} />
          ))}
          {profile.categories?.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{profile.categories.length - 2}
            </Badge>
          )}
        </div>

        {/* ✅ Ubicación - ALTURA FIJA 20px */}
        <div 
          className="mb-2 h-5 cursor-pointer"
          onClick={() => navigate(createPageUrl("ProfessionalProfile") + `?id=${profile.user_id}`)}
        >
          {profile.service_area ? (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{profile.service_area}</span>
            </div>
          ) : (
            <div></div>
          )}
        </div>

        {/* ✅ Descripción - ALTURA FIJA 40px (2 líneas) */}
        <div 
          className="mb-3 h-10 cursor-pointer"
          onClick={() => navigate(createPageUrl("ProfessionalProfile") + `?id=${profile.user_id}`)}
        >
          <p className="text-sm text-gray-600 line-clamp-2 leading-5">
            {profile.descripcion_corta || profile.description || "Profesional disponible"}
          </p>
        </div>

        {/* ✅ Espaciador flexible */}
        <div className="flex-1"></div>

        {/* ✅ Botones de contacto - ALTURA FIJA 32px */}
        {profile.telefono_contacto && (
          <div className="grid grid-cols-3 gap-1.5">
            <a
              href={`tel:${formatPhoneForCall(profile.telefono_contacto)}`}
              onClick={(e) => e.stopPropagation()}
            >
              <Button 
                variant="outline" 
                size="sm"
                className="w-full text-xs h-8 hover:bg-blue-50 hover:border-blue-600 hover:text-blue-600"
              >
                <Phone className="w-3.5 h-3.5" />
              </Button>
            </a>
            <a
              href={`https://wa.me/${formatPhoneForWhatsApp(profile.telefono_contacto)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <Button 
                size="sm"
                className="w-full text-xs h-8 bg-green-600 hover:bg-green-700"
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </Button>
            </a>
            <Button
              size="sm"
              className="w-full text-xs h-8 bg-blue-600 hover:bg-blue-700"
              onClick={(e) => {
                e.stopPropagation();
                onStartChat(profile.user_id, profile.business_name);
              }}
            >
              <MessageSquare className="w-3.5 h-3.5" />
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
  const [selectedCity, setSelectedCity] = useState("all");
  const [sortBy, setSortBy] = useState("rating");
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

  // ✅ CRÍTICO: Cargar suscripciones para verificar visibilidad
  const { data: subscriptions = [] } = useQuery({
    queryKey: ['allSubscriptions'],
    queryFn: async () => {
      const subs = await base44.entities.Subscription.list();
      console.log(`📊 Total suscripciones cargadas: ${subs.length}`);
      subs.forEach(sub => {
        console.log(`   - Usuario ${sub.user_id}: ${sub.estado} (expira: ${new Date(sub.fecha_expiracion).toLocaleDateString('es-ES')})`);
      });
      return subs;
    },
    staleTime: 0, 
    refetchOnMount: true,
    initialData: [],
  });

  const { data: profiles = [], isLoading: loadingProfiles, error: profilesError } = useQuery({
    queryKey: ['profiles', subscriptions.length], 
    queryFn: async () => {
      console.log('\n🔍 ========== INICIANDO FILTRADO DE PERFILES ==========\n');
      const allProfiles = await base44.entities.ProfessionalProfile.list('-updated_date', 100);
      console.log(`📊 Total perfiles en BD: ${allProfiles.length}\n`);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const visibleProfiles = allProfiles.filter(profile => {
        const businessName = profile.business_name || 'Sin nombre';
        console.log(`\n🔍 Evaluando: ${businessName} (user_id: ${profile.user_id})`);
        
        // 1. Debe tener onboarding completado
        if (!profile.onboarding_completed) {
          console.log(`   ❌ Onboarding incompleto`);
          return false;
        }
        console.log(`   ✅ Onboarding completado`);
        
        // 2. Debe estar marcado como visible
        if (!profile.visible_en_busqueda) {
          console.log(`   ❌ Marcado como no visible`);
          return false;
        }
        console.log(`   ✅ Marcado como visible`);
        
        // 3. Debe estar en estado activo
        if (profile.estado_perfil !== "activo") {
          console.log(`   ❌ Estado perfil: ${profile.estado_perfil}`);
          return false;
        }
        console.log(`   ✅ Estado perfil: activo`);
        
        // 4. ✅ VALIDACIÓN CLAVE: Verificar que tiene suscripción válida
        const userSub = subscriptions.find(sub => sub.user_id === profile.user_id);
        
        if (!userSub) {
          console.log(`   ❌ Sin registro de suscripción`);
          return false;
        }
        console.log(`   📋 Suscripción encontrada:`, {
          estado: userSub.estado,
          fecha_expiracion: userSub.fecha_expiracion
        });
        
        // ✅ USAR HELPER PARA VERIFICAR SI ESTÁ ACTIVO
        const isActive = isSubscriptionActive(userSub.estado, userSub.fecha_expiracion);
        
        if (!isActive) {
          console.log(`   ❌ Suscripción ${userSub.estado} NO ES VÁLIDA`);
          return false;
        }
        
        console.log(`   ✅ ${businessName} - VISIBLE (${userSub.estado})`);
        return true;
      });
      
      console.log(`\n📊 ========== RESUMEN FINAL ==========`);
      console.log(`   Total perfiles: ${allProfiles.length}`);
      console.log(`   Perfiles visibles: ${visibleProfiles.length}`);
      console.log(`   Perfiles ocultos: ${allProfiles.length - visibleProfiles.length}`);
      console.log(`=====================================\n`);
      
      return visibleProfiles || [];
    },
    staleTime: 0, 
    initialData: [],
    retry: false,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    // ✅ Solo ejecutar cuando haya suscripciones cargadas
    enabled: subscriptions.length >= 0,
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

  // ✅ CAMBIO: Ahora filteredProfiles usa 'profiles' directamente
  const filteredProfiles = useMemo(() => {
    return profiles.filter(profile => {
      const matchesSearch = !debouncedSearchTerm || 
        profile.business_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        profile.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        profile.descripcion_corta?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === "all" || 
        profile.categories?.includes(selectedCategory);
      
      // ✅ CAMBIO CRÍTICO: Filtrar por campo "ciudad" estructurado, NO por "service_area"
      const matchesCity = selectedCity === "all" || 
        profile.ciudad === selectedCity ||
        profile.provincia === selectedCity;
      
      return matchesSearch && matchesCategory && matchesCity;
    }).sort((a, b) => {
      if (sortBy === "rating") {
        return (b.average_rating || 0) - (a.average_rating || 0);
      }
      if (sortBy === "recent") {
        return new Date(b.updated_date).getTime() - new Date(a.updated_date).getTime();
      }
      return 0;
    });
  }, [profiles, debouncedSearchTerm, selectedCategory, selectedCity, sortBy]);

  // ✅ NUEVO: Extraer solo ciudades estructuradas únicas (campo "ciudad")
  // Ahora cities usa 'profiles' directamente
  const cities = useMemo(() => {
    const citySet = new Set();
    profiles.forEach(p => {
      // ✅ Solo añadir si existe el campo "ciudad" (campo estructurado)
      if (p.ciudad && p.ciudad.trim() !== "") {
        citySet.add(p.ciudad);
      }
      // También incluir provincias como opción de filtro
      if (p.provincia && p.provincia.trim() !== "") {
        citySet.add(p.provincia);
      }
    });
    return Array.from(citySet).sort();
  }, [profiles]);

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
        // Now 'profiles' already contains the filtered, visible profiles.
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 text-white py-12 px-4 shadow-xl">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight">
              Encuentra el autónomo perfecto
            </h1>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto mb-6">
              Profesionales cualificados y verificados en toda España
            </p>
            
            {!isLoadingUser && !user && (
              <div className="space-y-4">
                <p className="text-base text-blue-100 font-medium">
                  Elige cómo quieres empezar:
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center max-w-md mx-auto">
                  <Link to={createPageUrl("PricingPlans")} className="w-full sm:w-auto">
                    <Button 
                      size="lg" 
                      className="w-full sm:min-w-[200px] bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-xl transition-all hover:scale-105 border-2 border-orange-400"
                    >
                      🧰 Soy autónomo
                    </Button>
                  </Link>
                  
                  <Link to={createPageUrl("ClientOnboarding")} className="w-full sm:w-auto">
                    <Button 
                      size="lg" 
                      className="w-full sm:min-w-[200px] bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-xl transition-all hover:scale-105 border-2 border-blue-400"
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

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Card className="mb-8 shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-blue-700" />
              <h2 className="font-semibold text-lg text-gray-900">Filtros</h2>
            </div>
            {/* ✅ CAMBIO: Filtros en UNA SOLA FILA */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar servicio, empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-12">
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

              {/* ✅ CAMBIO: Filtro de ciudad usando solo valores estructurados */}
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Todas las ciudades" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>Todas las ciudades</span>
                    </div>
                  </SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{city}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Mejores valorados</SelectItem>
                  <SelectItem value="recent">Más recientes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {loadingProfiles ? 'Cargando...' : `${filteredProfiles.length} autónomos disponibles`}
          </h2>
          <p className="text-sm text-gray-600">
            Profesionales verificados en toda España
          </p>
        </div>

        {loadingProfiles ? (
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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch">
            {filteredProfiles.map((profile) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                user={user}
                onToggleFavorite={handleToggleFavorite}
                onStartChat={handleStartChat}
                navigate={navigate}
                isFavorite={userFavorites.has(profile.user_id)}
                favoriteCount={favoriteCounts[profile.user_id] || 0}
              />
            ))}
          </div>
        )}

        {!loadingProfiles && filteredProfiles.length === 0 && (
          <Card className="p-12 text-center border-0 shadow-lg bg-gradient-to-br from-orange-50 to-yellow-50">
            <AlertCircle className="w-16 h-16 text-orange-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {selectedCategory !== "all" 
                ? `🚧 Todavía no hay profesionales en "${selectedCategory}"`
                : "No se encontraron resultados"}
            </h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              {profiles.length === 0 
                ? 'No hay perfiles en la base de datos. Contacta con el administrador.'
                : selectedCategory !== "all"
                  ? 'Estamos trabajando para incorporar nuevos autónomos en esta categoría. Prueba con otras categorías o elimina los filtros.'
                  : 'Intenta modificar tus criterios de búsqueda o elimina los filtros activos.'}
            </p>
            {(selectedCategory !== "all" || selectedCity !== "all" || searchTerm) && (
              <Button
                onClick={() => {
                  setSelectedCategory("all");
                  setSelectedCity("all");
                  setSearchTerm("");
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Ver todos los autónomos
              </Button>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

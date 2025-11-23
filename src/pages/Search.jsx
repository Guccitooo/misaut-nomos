import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Search as SearchIcon,
  MapPin,
  ChevronDown,
  Loader2,
  Heart,
  MessageCircle,
  Phone,
  Euro,
  Eye,
  Star,
  X,
  Filter,
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
  User,
  MessageSquare
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
import { useLanguage } from "../components/ui/LanguageSwitcher";

const PROVINCIAS = {
  "Madrid": ["Madrid", "Alcalá de Henares", "Móstoles", "Fuenlabrada", "Leganés"],
  "Barcelona": ["Barcelona", "Hospitalet de Llobregat", "Badalona", "Terrassa", "Sabadell"],
  "Valencia": ["Valencia", "Gandía", "Torrent", "Paterna", "Sagunto"],
  "Sevilla": ["Sevilla", "Dos Hermanas", "Alcalá de Guadaíra", "Utrera", "Mairena del Aljarafe"]
};

const useDebounce = (value, delay) => {
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
};

const CategoryBadge = ({ category, categories }) => {
  const categoryData = categories.find(c => c.name === category);
  
  return (
    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-medium">
      {categoryData?.icon && <span className="mr-1">{categoryData.icon}</span>}
      {category}
    </Badge>
  );
};

const ProfileCard = ({ profile, onClick, onToggleFavorite, isFavorite, userCategories, professionalUser, currentUserId }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

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

  const handleCall = () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      window.location.href = `tel:${formatPhoneForCall(profile.telefono_contacto)}`;
    } else {
      setShowPhoneModal(true);
    }
  };

  const handleWhatsApp = () => {
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
    toast.success(t('phoneCopied') || "Número copiado");
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const getCategoryIcon = (category) => {
    const icons = {
      "Electricista": Zap,
      "Fontanero": Droplets,
      "Carpintero": Hammer,
      "Albañil / Reformas": HardHat,
      "Pintor": Paintbrush,
      "Jardinero": Trees,
      "Transportista": Truck,
      "Autónomo de limpieza": Sparkles,
      "Cerrajero": Key,
      "Instalador de aire acondicionado": Wind,
      "Mantenimiento general": Wrench,
      "Mantenimiento de piscinas": Waves,
      "Otro tipo de servicio profesional": MoreHorizontal
    };
    return icons[category] || MoreHorizontal;
  };

  const CategoryIcon = getCategoryIcon(profile.categories?.[0]);

  return (
    <>
      <Card className="bg-white hover:shadow-lg transition-all duration-200 border border-gray-100 rounded-xl overflow-hidden h-full flex flex-col">
        <CardContent className="p-4 flex flex-col flex-1">
          <div className="flex items-start gap-3 mb-3">
            <Avatar 
              className="w-12 h-12 border border-gray-100 cursor-pointer flex-shrink-0"
              onClick={onClick}
            >
              {(() => {
                const photoUrl = professionalUser?.profile_picture || profile.imagen_principal;
                return photoUrl ? (
                  <AvatarImage 
                    src={photoUrl} 
                    alt={profile.business_name}
                    className="object-cover"
                  />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-sm">
                    {profile.business_name?.charAt(0) || "P"}
                  </AvatarFallback>
                );
              })()}
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h3 
                className="text-sm font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors truncate leading-tight mb-1"
                onClick={onClick}
              >
                {profile.business_name}
              </h3>
              
              {profile.categories && profile.categories.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2 py-0.5 rounded-md w-fit">
                  <CategoryIcon className="w-3 h-3" />
                  <span className="truncate">{t(profile.categories[0]) || profile.categories[0]}</span>
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleFavorite}
              className={`${
                isFavorite 
                  ? 'text-red-500 hover:text-red-600 hover:bg-red-50' 
                  : 'text-gray-300 hover:text-red-500 hover:bg-red-50'
              } h-8 w-8 flex-shrink-0`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </Button>
          </div>

          <div className="space-y-2 mb-3 flex-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{profile.ciudad ? `${profile.ciudad}, ${profile.provincia}` : profile.provincia}</span>
            </div>

            {profile.descripcion_corta && (
              <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed h-[2.5rem]">
                {profile.descripcion_corta}
              </p>
            )}

            {profile.average_rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-semibold text-gray-900">
                  {profile.average_rating.toFixed(1)}
                </span>
                <span className="text-xs text-gray-500">
                  ({profile.total_reviews})
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2 mt-auto">
            <Button 
              onClick={onClick}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 text-sm font-semibold rounded-lg"
            >
              Ver perfil completo
            </Button>

            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={() => {
                  if (!currentUserId) {
                    window.location.href = '/api/auth/login?next=' + encodeURIComponent('/Messages?professional=' + profile.user_id);
                    return;
                  }
                  const conversationId = [currentUserId, profile.user_id].sort().join('_');
                  navigate(createPageUrl("Messages") + `?conversation=${conversationId}&professional=${profile.user_id}`);
                }}
                variant="outline"
                className="h-10 border-gray-200 hover:bg-blue-50 hover:border-blue-300 rounded-lg flex flex-col items-center justify-center gap-0.5 p-1"
              >
                <MessageSquare className="w-4 h-4 text-gray-700" />
                <span className="text-[10px] text-gray-600 font-medium">Mensaje</span>
              </Button>

              {profile.metodos_contacto?.includes('telefono') && profile.telefono_contacto && (
                <Button
                  onClick={handleCall}
                  variant="outline"
                  className="h-10 border-gray-200 hover:bg-gray-50 hover:border-gray-400 rounded-lg flex flex-col items-center justify-center gap-0.5 p-1"
                >
                  <Phone className="w-4 h-4 text-gray-700" />
                  <span className="text-[10px] text-gray-600 font-medium">Llamar</span>
                </Button>
              )}

              {profile.metodos_contacto?.includes('whatsapp') && profile.telefono_contacto && (
                <Button
                  onClick={handleWhatsApp}
                  variant="outline"
                  className="h-10 border-gray-200 hover:bg-green-50 hover:border-green-300 rounded-lg flex flex-col items-center justify-center gap-0.5 p-1"
                >
                  <MessageCircle className="w-4 h-4 text-green-600" />
                  <span className="text-[10px] text-green-600 font-medium">WhatsApp</span>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showPhoneModal} onOpenChange={setShowPhoneModal}>
        <DialogContent className="sm:max-w-md rounded-2xl border-0 shadow-2xl">
          <DialogHeader className="text-center space-y-2 pb-2">
            <div className="mx-auto w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-2">
              <Phone className="w-7 h-7 text-blue-600" />
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              {t('phoneNumber') || 'Número de teléfono'}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              {profile.business_name}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="relative w-full">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-2xl blur-xl opacity-20"></div>
              <div className="relative p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-200 w-full text-center">
                <p className="text-3xl font-bold text-blue-900 tracking-wider">
                  {profile.telefono_contacto}
                </p>
              </div>
            </div>
            <Button
              onClick={() => copyToClipboard(profile.telefono_contacto)}
              variant="outline"
              className="w-full h-12 border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 rounded-xl font-semibold transition-all"
              size="lg"
            >
              {copiedPhone ? (
                <>
                  <Check className="w-5 h-5 mr-2 text-green-600" />
                  <span className="text-green-600">{t('copied') || '¡Copiado!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 mr-2 text-gray-700" />
                  <span className="text-gray-700">{t('copyNumber') || 'Copiar número'}</span>
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showWhatsAppModal} onOpenChange={setShowWhatsAppModal}>
        <DialogContent className="sm:max-w-md rounded-2xl border-0 shadow-2xl">
          <DialogHeader className="text-center space-y-2 pb-2">
            <div className="mx-auto w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-2">
              <MessageCircle className="w-7 h-7 text-green-600" />
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              WhatsApp
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              {profile.business_name}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="relative w-full">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-600 rounded-2xl blur-xl opacity-20"></div>
              <div className="relative p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border-2 border-green-200 w-full text-center">
                <p className="text-3xl font-bold text-green-900 tracking-wider">
                  {profile.telefono_contacto}
                </p>
              </div>
            </div>
            <Button
              onClick={() => {
                window.open(`https://wa.me/${formatPhoneForWhatsApp(profile.telefono_contacto)}`, '_blank');
                setShowWhatsAppModal(false);
              }}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 h-12 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              size="lg"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              {t('openWhatsApp') || 'Abrir WhatsApp'}
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
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProvincia, setSelectedProvincia] = useState("all");
  const [selectedCiudad, setSelectedCiudad] = useState("all");
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

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      return await base44.entities.ServiceCategory.list();
    },
    initialData: [],
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });

  const { data: profiles = [], isLoading: loadingProfiles } = useQuery({
    queryKey: ['professionalProfiles'],
    queryFn: async () => {
      const allProfiles = await base44.entities.ProfessionalProfile.list();
      return allProfiles.filter(p => p.visible_en_busqueda && p.onboarding_completed);
    },
    initialData: [],
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });

  const { data: professionalUsers = [] } = useQuery({
    queryKey: ['professionalUsers'],
    queryFn: async () => {
      const userIds = profiles.map(p => p.user_id);
      if (userIds.length === 0) return [];
      
      const allUsers = await base44.entities.User.list();
      return allUsers.filter(u => userIds.includes(u.id));
    },
    enabled: profiles.length > 0,
    initialData: [],
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
  });

  const { data: subscriptions = [], isLoading: loadingSubscriptions } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      return await base44.entities.Subscription.list();
    },
    initialData: [],
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.Favorite.filter({
        client_id: user.id
      });
    },
    enabled: !!user,
    initialData: [],
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
  });

  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = !debouncedSearchTerm || 
      profile.business_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      profile.descripcion_corta?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      profile.categories?.some(cat => cat.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === "all" || profile.categories?.includes(selectedCategory);
    const matchesProvincia = selectedProvincia === "all" || profile.provincia === selectedProvincia;
    const matchesCiudad = selectedCiudad === "all" || profile.ciudad === selectedCiudad;

    return matchesSearch && matchesCategory && matchesProvincia && matchesCiudad;
  });

  const availableProvincias = React.useMemo(() => {
    const provincias = new Set();
    profiles.forEach(profile => {
      if (profile.provincia) provincias.add(profile.provincia);
    });
    return Array.from(provincias).sort();
  }, [profiles]);

  const availableCities = React.useMemo(() => {
    const cities = new Set();
    profiles.forEach(profile => {
      if (profile.ciudad && (!selectedProvincia || selectedProvincia === "all" || profile.provincia === selectedProvincia)) {
        cities.add(profile.ciudad);
      }
    });
    return Array.from(cities).sort();
  }, [profiles, selectedProvincia]);

  const handleProvinciaChange = (value) => {
    setSelectedProvincia(value);
    setSelectedCiudad("all");
  };

  const handleViewProfile = (profile) => {
    navigate(createPageUrl("ProfessionalProfile") + `?id=${profile.user_id}`);
  };

  const handleToggleFavorite = async (profile) => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }

    try {
      const existingFavorites = favorites.filter(fav => fav.professional_id === profile.user_id);
      
      if (existingFavorites.length > 0) {
        await base44.entities.Favorite.delete(existingFavorites[0].id);
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
      console.error("Error toggling favorite:", error);
      toast.error(t('errorFavorites') || "Error al gestionar favoritos");
    }
  };

  const isInitialLoading = loadingUser || loadingProfiles || loadingCategories || loadingSubscriptions;

  if (isInitialLoading) {
    return null;
  }

  return (
    <>
      <SEOHead 
        title="Buscar Autónomos Profesionales - MisAutónomos"
        description="Encuentra y contacta con profesionales autónomos verificados en toda España. Electricistas, fontaneros, carpinteros y más."
        keywords="buscar autónomos, profesionales, servicios, España"
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {!loadingUser && !user && (
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white py-16 px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight">
                  {t('heroTitle') || 'Encuentra tu autónomo de confianza'}
                </h1>
                <p className="text-lg md:text-xl text-blue-50 mb-3 font-medium">
                  Conecta con profesionales verificados cerca de ti. Rápido, fácil y seguro.
                </p>
                <div className="flex items-center justify-center gap-4 text-sm md:text-base text-blue-100 mb-6 flex-wrap">
                  <span className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-400" />
                    Profesionales verificados
                  </span>
                  <span className="hidden sm:inline">·</span>
                  <span className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400" />
                    Opiniones reales
                  </span>
                  <span className="hidden sm:inline">·</span>
                  <span className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-blue-300" />
                    Contacto directo
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto mb-8">
                  <Button
                    onClick={() => {
                      document.getElementById('search-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="bg-white hover:bg-blue-50 text-blue-700 h-12 px-8 text-base font-bold shadow-xl flex-1 rounded-xl"
                  >
                    <SearchIcon className="w-5 h-5 mr-2" />
                    Busco servicios
                  </Button>
                  <Button
                    onClick={() => navigate(createPageUrl("PricingPlans"))}
                    variant="outline"
                    className="bg-transparent hover:bg-blue-700 text-white border-2 border-white h-12 px-8 text-base font-bold shadow-xl flex-1 rounded-xl"
                  >
                    <Briefcase className="w-5 h-5 mr-2" />
                    Soy autónomo
                  </Button>
                </div>

                <Card className="max-w-5xl mx-auto shadow-2xl border-0 rounded-2xl overflow-hidden">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <Input
                            type="text"
                            placeholder="Ej: fontanero en Málaga, limpieza de oficinas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 pr-4 h-14 text-base rounded-xl border-gray-200 focus:border-blue-500 transition-all"
                          />
                        </div>
                        <Button className="bg-blue-600 hover:bg-blue-700 h-14 px-8 rounded-xl font-bold text-base shadow-lg hidden md:flex">
                          Buscar
                        </Button>
                      </div>

                      <div className={`grid grid-cols-1 md:grid-cols-3 gap-3`}>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger className="h-11 rounded-lg border-gray-200 text-sm bg-white">
                            <SelectValue placeholder={t('allCategories') || "Todas las categorías"} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t('allCategories') || 'Todas las categorías'}</SelectItem>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.name}>
                                {t(cat.name) || cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select value={selectedProvincia} onValueChange={handleProvinciaChange}>
                          <SelectTrigger className="h-11 rounded-lg border-gray-200 text-sm bg-white">
                            <SelectValue placeholder={t('allProvinces') || "Todas las provincias"} />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            <SelectItem value="all">{t('allProvinces') || 'Todas las provincias'}</SelectItem>
                            {availableProvincias.map((prov) => (
                              <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select value={selectedCiudad} onValueChange={setSelectedCiudad} disabled={selectedProvincia === "all"}>
                          <SelectTrigger className="h-11 rounded-lg border-gray-200 text-sm bg-white">
                            <SelectValue placeholder={t('allCities') || "Todas las ciudades"} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t('allCities') || 'Todas las ciudades'}</SelectItem>
                            {availableCities.map((ciudad) => (
                              <SelectItem key={ciudad} value={ciudad}>{ciudad}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2">
                        {[
                          { name: 'Fontanero', icon: Droplets },
                          { name: 'Electricista', icon: Zap },
                          { name: 'Cerrajero', icon: Key },
                          { name: 'Autónomo de limpieza', icon: Sparkles },
                          { name: 'Albañil / Reformas', icon: HardHat },
                          { name: 'Transportista', icon: Truck },
                          { name: 'Asesoría o gestoría', icon: Briefcase }
                        ].map((cat) => {
                          const Icon = cat.icon;
                          return (
                            <Button
                              key={cat.name}
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedCategory(cat.name)}
                              className={`h-9 px-4 rounded-full text-xs font-medium transition-all ${
                                selectedCategory === cat.name
                                  ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                                  : 'bg-white hover:bg-blue-50 border-gray-200 text-gray-700'
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5 mr-1.5" />
                              {cat.name}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        <div className={`max-w-7xl mx-auto px-4 ${user ? 'py-6' : 'py-10'}`} id="search-section">

          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {filteredProfiles.length} {filteredProfiles.length === 1 ? (t('professional') || 'autónomo') : (t('professionals') || 'autónomos')}
              </h2>
              <p className="text-sm text-gray-600 mt-0.5">{t('verifiedProfessionals') || 'Profesionales verificados'}</p>
            </div>
          </div>

          {filteredProfiles.length === 0 && !loadingProfiles && (
            <Card className="p-10 text-center border-0 shadow-sm rounded-xl bg-white">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <SearchIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {t('noResults') || 'No se encontraron resultados'}
                </h3>
                <p className="text-sm text-gray-600">
                  {t('tryDifferentFilters') || 'Intenta con otros filtros o busca en otra ubicación'}
                </p>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence>
              {filteredProfiles.map((profile) => (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ProfileCard
                    profile={profile}
                    onClick={() => handleViewProfile(profile)}
                    onToggleFavorite={() => handleToggleFavorite(profile)}
                    isFavorite={favorites.some(fav => fav.professional_id === profile.user_id)}
                    userCategories={categories}
                    professionalUser={professionalUsers.find(u => u.id === profile.user_id)}
                    currentUserId={user?.id}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {!loadingUser && !user && (
            <Card className="mt-12 bg-gradient-to-r from-blue-600 to-blue-700 border-0 rounded-2xl overflow-hidden shadow-xl">
              <CardContent className="p-8 md:p-12 text-center text-white">
                <h3 className="text-2xl md:text-3xl font-bold mb-3">
                  ¿Eres autónomo en esta zona?
                </h3>
                <p className="text-blue-50 text-lg mb-6">
                  Regístrate gratis y aparece aquí. Empieza a recibir clientes hoy.
                </p>
                <Button
                  onClick={() => navigate(createPageUrl("PricingPlans"))}
                  className="bg-white hover:bg-blue-50 text-blue-700 h-12 px-8 text-base font-bold shadow-lg rounded-xl"
                >
                  <Briefcase className="w-5 h-5 mr-2" />
                  Registrarme como autónomo
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
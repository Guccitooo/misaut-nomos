import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Search as SearchIcon,
  MapPin,
  Star,
  Heart,
  Briefcase,
  ArrowLeft
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import SEOHead from "../components/seo/SEOHead";
import { useLanguage } from "../components/ui/LanguageSwitcher";

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

// Mapeo de slugs a nombres de categoría
const CATEGORY_MAP = {
  'electricistas': 'Electricista',
  'fontaneros': 'Fontanero',
  'carpinteros': 'Carpintero',
  'pintores': 'Pintor',
  'jardineros': 'Jardinero',
  'transportistas': 'Transportista',
  'cerrajeros': 'Cerrajero',
  'albaniles': 'Albañil / Reformas',
  'albanil-reformas': 'Albañil / Reformas',
  'limpieza': 'Autónomo de limpieza',
  'aire-acondicionado': 'Instalador de aire acondicionado',
  'mantenimiento': 'Mantenimiento general',
  'piscinas': 'Mantenimiento de piscinas',
  'asesoria': 'Asesoría o gestoría',
  'multiservicios': 'Empresa multiservicios',
};

const CIUDADES_PRINCIPALES = [
  "Madrid", "Barcelona", "Valencia", "Sevilla", "Málaga", "Zaragoza", "Bilbao",
  "Murcia", "Palma de Mallorca", "Alicante", "Córdoba", "Valladolid", "Vigo",
  "Gijón", "Granada", "A Coruña", "Vitoria-Gasteiz", "Santa Cruz de Tenerife"
];

export default function CategoriaPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState(null);

  // Leer query params
  const urlParams = new URLSearchParams(window.location.search);
  const categorySlug = urlParams.get("name");
  const ciudadParam = urlParams.get("ciudad");

  // Convertir slug a nombre de categoría
  const categoryName = CATEGORY_MAP[categorySlug] || categorySlug;
  const ciudadName = ciudadParam ? ciudadParam.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : null;

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

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['categoryProfiles', categoryName, ciudadName],
    queryFn: async () => {
      const allProfiles = await base44.entities.ProfessionalProfile.list();
      return allProfiles.filter(p => {
        const isVisible = p.visible_en_busqueda === true && p.onboarding_completed === true;
        const matchesCategory = !categoryName || p.categories?.some(c => 
          c.toLowerCase() === categoryName.toLowerCase() ||
          slugify(c) === categorySlug
        );
        const matchesCiudad = !ciudadName || 
          p.ciudad?.toLowerCase() === ciudadName.toLowerCase() ||
          slugify(p.ciudad || '') === slugify(ciudadName);
        
        return isVisible && matchesCategory && matchesCiudad;
      });
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.Favorite.filter({ client_id: user.id });
    },
    enabled: !!user,
  });

  const handleCiudadChange = (ciudad) => {
    if (ciudad === "all") {
      navigate(`${createPageUrl("Categoria")}?name=${categorySlug}`);
    } else {
      navigate(`${createPageUrl("Categoria")}?name=${categorySlug}&ciudad=${slugify(ciudad)}`);
    }
  };

  const handleViewProfile = (profile) => {
    // URL SEO-friendly con path param: /autonomo/:slug
    const slug = profile.slug_publico || slugify(profile.business_name);
    navigate(`${createPageUrl("Autonomo")}/${slug}`);
  };

  const handleToggleFavorite = async (profile) => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }

    try {
      const existing = favorites.filter(f => f.professional_id === profile.user_id);
      if (existing.length > 0) {
        await base44.entities.Favorite.delete(existing[0].id);
        toast.success("Eliminado de favoritos");
      } else {
        await base44.entities.Favorite.create({
          client_id: user.id,
          professional_id: profile.user_id,
          business_name: profile.business_name
        });
        toast.success("Añadido a favoritos");
      }
    } catch (error) {
      toast.error("Error al gestionar favoritos");
    }
  };

  // SEO
  const canonicalUrl = ciudadName 
    ? `https://misautonomos.es/categoria/${categorySlug}?ciudad=${slugify(ciudadName)}`
    : `https://misautonomos.es/categoria/${categorySlug}`;
  
  const seoTitle = ciudadName 
    ? `${categoryName || 'Profesionales'} en ${ciudadName} - MisAutónomos`
    : `${categoryName || 'Profesionales'} - Encuentra autónomos verificados | MisAutónomos`;
  
  const seoDescription = ciudadName
    ? `Encuentra ${categoryName?.toLowerCase() || 'profesionales'} verificados en ${ciudadName}. Contacta directamente, pide presupuesto gratis.`
    : `Directorio de ${categoryName?.toLowerCase() || 'profesionales'} autónomos en España. Compara precios, lee opiniones y contacta gratis.`;

  return (
    <>
      <SEOHead 
        title={seoTitle}
        description={seoDescription}
        keywords={`${categoryName?.toLowerCase()}, ${ciudadName?.toLowerCase() || 'españa'}, autónomo, profesional, presupuesto`}
      />
      
      {/* Canonical */}
      <link rel="canonical" href={canonicalUrl} />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-8 md:py-12">
          <div className="max-w-6xl mx-auto px-4">
            <Button
              onClick={() => navigate(createPageUrl("Search"))}
              variant="ghost"
              className="text-white hover:bg-white/10 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('backToSearch') || 'Volver a búsqueda'}
            </Button>
            
            <h1 className="text-2xl md:text-4xl font-bold mb-2">
              {categoryName || 'Profesionales'} {ciudadName ? `en ${ciudadName}` : 'en España'}
            </h1>
            <p className="text-blue-100 text-lg">
              {profiles.length} profesionales verificados disponibles
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Filtro de ciudad */}
          <Card className="mb-6 shadow-sm border-0 rounded-xl">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-3 items-center">
                <MapPin className="w-5 h-5 text-gray-500" />
                <Select value={ciudadName || "all"} onValueChange={handleCiudadChange}>
                  <SelectTrigger className="w-48 h-10 rounded-lg">
                    <SelectValue placeholder="Seleccionar ciudad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toda España</SelectItem>
                    {CIUDADES_PRINCIPALES.map(ciudad => (
                      <SelectItem key={ciudad} value={ciudad}>{ciudad}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Loading */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="rounded-xl">
                  <CardContent className="p-4">
                    <div className="flex gap-3 mb-3">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                    <Skeleton className="h-16 w-full mb-3" />
                    <Skeleton className="h-9 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Sin resultados */}
          {!isLoading && profiles.length === 0 && (
            <Card className="p-8 text-center rounded-xl">
              <SearchIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No hay {categoryName?.toLowerCase() || 'profesionales'} {ciudadName ? `en ${ciudadName}` : ''}
              </h3>
              <p className="text-gray-600 mb-4">
                Prueba ampliando tu búsqueda a toda España
              </p>
              <Button onClick={() => navigate(createPageUrl("Search"))}>
                Ver todos los profesionales
              </Button>
            </Card>
          )}

          {/* Resultados */}
          {!isLoading && profiles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {profiles.map(profile => (
                  <motion.div
                    key={profile.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="bg-white hover:shadow-lg transition-all rounded-xl h-full">
                      <CardContent className="p-4 flex flex-col h-full">
                        <div className="flex items-start gap-3 mb-3">
                          <Avatar 
                            className="w-12 h-12 cursor-pointer"
                            onClick={() => handleViewProfile(profile)}
                          >
                            {profile.imagen_principal ? (
                              <AvatarImage src={profile.imagen_principal} alt={profile.business_name} />
                            ) : (
                              <AvatarFallback className="bg-blue-600 text-white">
                                {profile.business_name?.charAt(0)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <h3 
                              className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600 truncate"
                              onClick={() => handleViewProfile(profile)}
                            >
                              {profile.business_name}
                            </h3>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate">{profile.ciudad || profile.provincia}</span>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleFavorite(profile)}
                            className={favorites.some(f => f.professional_id === profile.user_id) 
                              ? 'text-red-500' : 'text-gray-300'}
                          >
                            <Heart className={`w-4 h-4 ${favorites.some(f => f.professional_id === profile.user_id) ? 'fill-current' : ''}`} />
                          </Button>
                        </div>

                        {profile.descripcion_corta && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3 flex-1">
                            {profile.descripcion_corta}
                          </p>
                        )}

                        {profile.average_rating > 0 && (
                          <div className="flex items-center gap-1 mb-3">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold">{profile.average_rating.toFixed(1)}</span>
                            <span className="text-gray-500 text-sm">({profile.total_reviews})</span>
                          </div>
                        )}

                        <Button 
                          onClick={() => handleViewProfile(profile)}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          Ver perfil
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* CTA */}
          {!isLoading && profiles.length > 0 && (
            <div className="mt-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-center text-white">
              <h3 className="text-2xl font-bold mb-2">¿Eres {categoryName?.toLowerCase()}?</h3>
              <p className="text-blue-100 mb-5">Regístrate y consigue más clientes</p>
              <Button
                onClick={() => navigate(createPageUrl("PricingPlans"))}
                className="bg-white hover:bg-gray-50 text-blue-700 h-12 px-8 font-semibold"
              >
                <Briefcase className="w-5 h-5 mr-2" />
                Registrarme como profesional
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
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

const PROVINCIAS_ESPANA = [
  "A Coruña", "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila", "Badajoz",
  "Baleares", "Barcelona", "Burgos", "Cáceres", "Cádiz", "Cantabria", "Castellón", "Ceuta",
  "Ciudad Real", "Córdoba", "Cuenca", "Girona", "Granada", "Guadalajara", "Guipúzcoa",
  "Huelva", "Huesca", "Jaén", "La Rioja", "Las Palmas", "León", "Lleida", "Lugo", "Madrid",
  "Málaga", "Melilla", "Murcia", "Navarra", "Ourense", "Palencia", "Pontevedra", "Salamanca",
  "Santa Cruz de Tenerife", "Segovia", "Sevilla", "Soria", "Tarragona", "Teruel", "Toledo",
  "Valencia", "Valladolid", "Vizcaya", "Zamora", "Zaragoza"
];

const CIUDADES_POR_PROVINCIA = {
  "Madrid": ["Madrid", "Alcalá de Henares", "Móstoles", "Fuenlabrada", "Leganés", "Getafe", "Alcorcón", "Torrejón de Ardoz", "Parla", "Alcobendas"],
  "Barcelona": ["Barcelona", "Hospitalet de Llobregat", "Badalona", "Terrassa", "Sabadell", "Mataró", "Santa Coloma de Gramenet", "Cornellà de Llobregat"],
  "Valencia": ["Valencia", "Gandía", "Torrent", "Paterna", "Sagunto", "Alzira", "Mislata", "Burjassot", "Catarroja"],
  "Sevilla": ["Sevilla", "Dos Hermanas", "Alcalá de Guadaíra", "Utrera", "Mairena del Aljarafe", "Los Palacios", "Écija"],
  "Málaga": ["Málaga", "Marbella", "Vélez-Málaga", "Fuengirola", "Mijas", "Torremolinos", "Estepona", "Benalmádena"],
  "Alicante": ["Alicante", "Elche", "Torrevieja", "Orihuela", "Benidorm", "Alcoy", "Elda", "San Vicente del Raspeig"],
  "Murcia": ["Murcia", "Cartagena", "Lorca", "Molina de Segura", "Alcantarilla", "Yecla", "Águilas"],
  "Zaragoza": ["Zaragoza", "Calatayud", "Utebo", "Ejea de los Caballeros", "Tarazona"],
  "Vizcaya": ["Bilbao", "Barakaldo", "Getxo", "Portugalete", "Santurtzi", "Basauri", "Durango"],
  "A Coruña": ["A Coruña", "Santiago de Compostela", "Ferrol", "Narón", "Oleiros", "Arteixo"],
  "Las Palmas": ["Las Palmas de Gran Canaria", "Telde", "Arucas", "Agüimes", "Santa Lucía"],
  "Granada": ["Granada", "Motril", "Almuñécar", "Baza", "Loja", "Armilla"],
  "Cádiz": ["Cádiz", "Jerez de la Frontera", "Algeciras", "San Fernando", "El Puerto de Santa María", "Chiclana"],
  "Córdoba": ["Córdoba", "Lucena", "Puente Genil", "Montilla", "Priego de Córdoba"],
  "Pontevedra": ["Vigo", "Pontevedra", "Vilagarcía de Arousa", "Redondela", "Cangas"],
  "Santa Cruz de Tenerife": ["Santa Cruz de Tenerife", "San Cristóbal de La Laguna", "Arona", "Adeje"],
  "Baleares": ["Palma de Mallorca", "Calvià", "Manacor", "Ibiza", "Mahón"],
  "Asturias": ["Oviedo", "Gijón", "Avilés", "Siero", "Mieres"],
  "Guipúzcoa": ["San Sebastián", "Irún", "Éibar", "Rentería", "Zarautz"],
  "Tarragona": ["Tarragona", "Reus", "Tortosa", "El Vendrell", "Cambrils"],
  "Valladolid": ["Valladolid", "Medina del Campo", "Laguna de Duero", "Arroyo de la Encomienda"],
  "Toledo": ["Toledo", "Talavera de la Reina", "Illescas", "Seseña"],
  "Girona": ["Girona", "Figueres", "Lloret de Mar", "Blanes", "Salt"],
  "Lleida": ["Lleida", "Balaguer", "Tàrrega", "Mollerussa"],
  "Cantabria": ["Santander", "Torrelavega", "Castro-Urdiales", "Camargo"],
  "Castellón": ["Castellón de la Plana", "Vila-real", "Burriana", "Vinaròs"],
  "Badajoz": ["Badajoz", "Mérida", "Don Benito", "Almendralejo", "Villanueva de la Serena"],
  "Huelva": ["Huelva", "Lepe", "Almonte", "Moguer", "Ayamonte"],
  "Jaén": ["Jaén", "Linares", "Andújar", "Úbeda", "Martos"],
  "La Rioja": ["Logroño", "Calahorra", "Arnedo", "Haro"],
  "Navarra": ["Pamplona", "Tudela", "Barañáin", "Burlada"],
  "Álava": ["Vitoria-Gasteiz", "Llodio", "Amurrio"],
  "Almería": ["Almería", "Roquetas de Mar", "El Ejido", "Vícar", "Níjar"],
  "Ávila": ["Ávila", "Arévalo", "Arenas de San Pedro"],
  "Burgos": ["Burgos", "Miranda de Ebro", "Aranda de Duero"],
  "Cáceres": ["Cáceres", "Plasencia", "Navalmoral de la Mata"],
  "Ciudad Real": ["Ciudad Real", "Puertollano", "Tomelloso", "Alcázar de San Juan"],
  "Cuenca": ["Cuenca", "Tarancón", "Quintanar del Rey"],
  "Guadalajara": ["Guadalajara", "Azuqueca de Henares", "Alovera"],
  "Huesca": ["Huesca", "Monzón", "Barbastro", "Jaca"],
  "León": ["León", "Ponferrada", "San Andrés del Rabanedo"],
  "Lugo": ["Lugo", "Monforte de Lemos", "Viveiro"],
  "Ourense": ["Ourense", "Verín", "O Barco de Valdeorras"],
  "Palencia": ["Palencia", "Guardo", "Aguilar de Campoo"],
  "Salamanca": ["Salamanca", "Béjar", "Ciudad Rodrigo"],
  "Segovia": ["Segovia", "Cuéllar", "San Ildefonso"],
  "Soria": ["Soria", "Almazán", "El Burgo de Osma"],
  "Teruel": ["Teruel", "Alcañiz", "Andorra"],
  "Zamora": ["Zamora", "Benavente", "Toro"],
  "Ceuta": ["Ceuta"],
  "Melilla": ["Melilla"]
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
  const { t } = useLanguage();
  const categoryData = categories.find(c => c.name === category);

  return (
    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-medium">
      {categoryData?.icon && <span className="mr-1">{categoryData.icon}</span>}
      {t(category) || category}
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

          <div className="flex gap-1.5 mt-auto">
            <Button 
              onClick={onClick}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-9 text-xs font-medium rounded-lg px-2"
            >
              {t('viewProfile')}
            </Button>

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
              size="icon"
              className="h-9 w-9 border-gray-200 hover:bg-blue-50 hover:border-blue-300 rounded-lg flex-shrink-0"
              title={t('sendDirectMessage')}
            >
              <MessageSquare className="w-4 h-4 text-gray-700" />
            </Button>

            {profile.metodos_contacto?.includes('telefono') && profile.telefono_contacto && (
              <Button
                onClick={handleCall}
                variant="outline"
                size="icon"
                className="h-9 w-9 border-gray-200 hover:bg-gray-50 hover:border-gray-400 rounded-lg flex-shrink-0"
                title={t('callPhone')}
              >
                <Phone className="w-4 h-4 text-gray-700" />
              </Button>
            )}

            {profile.metodos_contacto?.includes('whatsapp') && profile.telefono_contacto && (
              <Button
                onClick={handleWhatsApp}
                variant="outline"
                size="icon"
                className="h-9 w-9 border-gray-200 hover:bg-green-50 hover:border-green-300 rounded-lg flex-shrink-0"
                title={t('contactViaWhatsApp')}
              >
                <MessageCircle className="w-4 h-4 text-green-600" />
              </Button>
            )}
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
              variant="outline"
              size="icon"
              className="h-9 w-9 border-gray-200 hover:bg-blue-50 hover:border-blue-300 rounded-lg flex-shrink-0"
              title={t('sendDirectMessage')}
            >
              <MessageSquare className="w-4 h-4 text-gray-700" />
            </Button>

            {profile.metodos_contacto?.includes('telefono') && profile.telefono_contacto && (
              <Button
                onClick={handleCall}
                variant="outline"
                size="icon"
                className="h-9 w-9 border-gray-200 hover:bg-gray-50 hover:border-gray-400 rounded-lg flex-shrink-0"
                title={t('callPhone')}
              >
                <Phone className="w-4 h-4 text-gray-700" />
              </Button>
            )}

            {profile.metodos_contacto?.includes('whatsapp') && profile.telefono_contacto && (
              <Button
                onClick={handleWhatsApp}
                variant="outline"
                size="icon"
                className="h-9 w-9 border-gray-200 hover:bg-green-50 hover:border-green-300 rounded-lg flex-shrink-0"
                title={t('contactViaWhatsApp')}
              >
                <MessageCircle className="w-4 h-4 text-green-600" />
              </Button>
            )}
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

// VERSION: 2025-11-24-v2 - Botones de categorías eliminados
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

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setLoadingUser(false);
    } catch (error) {
      console.log('👤 No user logged in, showing public view');
      setUser(null);
      setLoadingUser(false);
    }
  };

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const cats = await base44.entities.ServiceCategory.list();
        console.log('📂 Categories loaded from DB:', cats.length, cats.map(c => c.name));
        if (cats.length === 0) {
          console.warn('⚠️ No categories found in database, using fallback');
          return [];
        }
        return cats;
      } catch (error) {
        console.error('❌ Error loading categories:', error);
        return [];
      }
    },
    initialData: [],
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnMount: true,
  });

  const { data: profiles = [], isLoading: loadingProfiles, error: profilesError } = useQuery({
    queryKey: ['professionalProfiles'],
    queryFn: async () => {
      try {
        const allProfiles = await base44.entities.ProfessionalProfile.list();
        console.log('🔍 Total profiles in DB:', allProfiles.length);
        console.log('🔍 Sample profiles:', allProfiles.slice(0, 5).map(p => ({
          id: p.id,
          business_name: p.business_name,
          visible_en_busqueda: p.visible_en_busqueda,
          onboarding_completed: p.onboarding_completed,
          categories: p.categories,
          ciudad: p.ciudad,
          provincia: p.provincia
        })));
        
        const visibleProfiles = allProfiles.filter(p => 
          p.visible_en_busqueda === true && p.onboarding_completed === true
        );
        console.log('✅ Visible profiles after filter:', visibleProfiles.length, visibleProfiles.map(p => p.business_name));
        
        return visibleProfiles;
      } catch (error) {
        console.error('❌ Error loading profiles:', error);
        return [];
      }
    },
    retry: 2,
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
    refetchOnMount: true,
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

  const filteredProfiles = React.useMemo(() => {
    console.log('🔎 Filtering profiles:', { 
      total: profiles.length, 
      searchTerm: debouncedSearchTerm, 
      category: selectedCategory,
      provincia: selectedProvincia,
      ciudad: selectedCiudad
    });
    
    const filtered = profiles.filter(profile => {
      const matchesSearch = !debouncedSearchTerm || 
        profile.business_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        profile.descripcion_corta?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        profile.categories?.some(cat => cat.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));

      const matchesCategory = selectedCategory === "all" || profile.categories?.includes(selectedCategory);
      const matchesProvincia = selectedProvincia === "all" || profile.provincia === selectedProvincia;
      const matchesCiudad = selectedCiudad === "all" || profile.ciudad === selectedCiudad;

      return matchesSearch && matchesCategory && matchesProvincia && matchesCiudad;
    });
    
    console.log('✅ Filtered results:', filtered.length);
    return filtered;
  }, [profiles, debouncedSearchTerm, selectedCategory, selectedProvincia, selectedCiudad]);

  const availableProvincias = React.useMemo(() => {
    return PROVINCIAS_ESPANA;
  }, []);

  const availableCities = React.useMemo(() => {
    if (selectedProvincia === "all" || !selectedProvincia) {
      return [];
    }
    return CIUDADES_POR_PROVINCIA[selectedProvincia] || [];
  }, [selectedProvincia]);

  const handleProvinciaChange = (value) => {
    setSelectedProvincia(value);
    setSelectedCiudad("all");
  };

  const handleViewProfile = (profile) => {
    // URL SEO-friendly con slug
    const slug = profile.slug_publico || slugify(profile.business_name);
    navigate(createPageUrl("Autonomo") + `?slug=${slug}`);
  };
  
  // Función para generar slug
  function slugify(text) {
    if (!text) return '';
    return text
      .toString()
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ñ/g, 'n')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-');
  }

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

  const isInitialLoading = loadingProfiles || loadingCategories;

  return (
    <>
      <SEOHead 
        title="Buscar Autónomos Profesionales - MisAutónomos"
        description="Encuentra y contacta con profesionales autónomos verificados en toda España. Electricistas, fontaneros, carpinteros y más."
        keywords="buscar autónomos, profesionales, servicios, España"
      />

      <div className="min-h-screen bg-gray-50">
        {!loadingUser && !user && (
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white py-12 md:py-16 mb-8">
            <div className="max-w-6xl mx-auto px-4 text-center">
              <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
                {t('heroTitle')}
              </h1>
              <p className="text-lg md:text-xl text-blue-50 mb-3 font-light">
                {t('heroSubtitle')}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 text-sm md:text-base text-blue-100 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                  <span>{t('verifiedProfessionals')}</span>
                </div>
                <div className="hidden sm:block w-1 h-1 bg-blue-300 rounded-full"></div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>{t('realReviews')}</span>
                </div>
                <div className="hidden sm:block w-1 h-1 bg-blue-300 rounded-full"></div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>{t('directChat')}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-lg mx-auto">
                <Button
                  onClick={() => {
                    document.getElementById('search-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-white hover:bg-gray-50 text-blue-700 h-12 px-8 text-base font-semibold shadow-xl flex-1 rounded-xl"
                >
                  <SearchIcon className="w-5 h-5 mr-2" />
                  {t('imClient')}
                </Button>
                <Button
                  onClick={() => navigate(createPageUrl("PricingPlans"))}
                  className="bg-orange-500 hover:bg-orange-600 text-white border-0 h-12 px-8 text-base font-semibold shadow-xl flex-1 rounded-xl"
                >
                  <Briefcase className="w-5 h-5 mr-2" />
                  {t('imFreelancer')}
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className={`max-w-7xl mx-auto px-4 ${user ? 'py-6' : 'pb-6'} md:pb-10`} id="search-section">

          {/* Filtros de búsqueda - siempre visibles */}
          <Card className="mb-6 shadow-md border-0 rounded-2xl bg-white">
            <CardContent className="p-5">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      type="text"
                      placeholder={t('search')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 pr-4 h-12 text-sm rounded-xl border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    />
                  </div>
                  <Button
                    className="hidden md:flex bg-blue-600 hover:bg-blue-700 h-12 px-6 rounded-xl font-semibold shadow-sm"
                  >
                    <SearchIcon className="w-5 h-5 mr-2" />
                    {t('search')}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Select value={selectedCategory} onValueChange={(value) => {
                    console.log('📌 Select category changed to:', value);
                    setSelectedCategory(value);
                  }}>
                    <SelectTrigger className="h-11 rounded-xl border-gray-200 text-sm">
                      <SelectValue placeholder={t('allCategories')}>
                        {selectedCategory === "all" ? t('allCategories') : (t(selectedCategory) || selectedCategory)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto">
                      <SelectItem value="all">{t('allCategories')}</SelectItem>
                      {loadingCategories ? (
                        <SelectItem value="loading" disabled>{t('loading')}</SelectItem>
                      ) : categories.length === 0 ? (
                        <>
                          <SelectItem value="Electricista">Electricista</SelectItem>
                          <SelectItem value="Fontanero">Fontanero</SelectItem>
                          <SelectItem value="Carpintero">Carpintero</SelectItem>
                          <SelectItem value="Albañil / Reformas">Albañil / Reformas</SelectItem>
                          <SelectItem value="Pintor">Pintor</SelectItem>
                          <SelectItem value="Jardinero">Jardinero</SelectItem>
                          <SelectItem value="Transportista">Transportista</SelectItem>
                          <SelectItem value="Autónomo de limpieza">Autónomo de limpieza</SelectItem>
                          <SelectItem value="Cerrajero">Cerrajero</SelectItem>
                          <SelectItem value="Instalador de aire acondicionado">Instalador de aire acondicionado</SelectItem>
                          <SelectItem value="Mantenimiento general">Mantenimiento general</SelectItem>
                          <SelectItem value="Asesoría o gestoría">Asesoría o gestoría</SelectItem>
                          <SelectItem value="Empresa multiservicios">Empresa multiservicios</SelectItem>
                          <SelectItem value="Otro tipo de servicio profesional">Otro tipo de servicio profesional</SelectItem>
                        </>
                      ) : (
                        categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.name}>
                            {t(cat.name) || cat.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>

                  <Select value={selectedProvincia} onValueChange={handleProvinciaChange}>
                    <SelectTrigger className="h-11 rounded-xl border-gray-200 text-sm">
                      <SelectValue placeholder={t('allProvinces')} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      <SelectItem value="all">{t('allProvinces')}</SelectItem>
                      {availableProvincias.map((prov) => (
                        <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedCiudad} onValueChange={setSelectedCiudad} disabled={selectedProvincia === "all"}>
                    <SelectTrigger className="h-11 rounded-xl border-gray-200 text-sm">
                      <SelectValue placeholder={t('allCities')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('allCities')}</SelectItem>
                      {availableCities.map((ciudad) => (
                        <SelectItem key={ciudad} value={ciudad}>{ciudad}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>



          <div className="mb-5">
            <h2 className="text-xl font-bold text-gray-900">
              {isInitialLoading ? t('loading') : `${filteredProfiles.length} ${t('professionals')}`}
            </h2>
            <p className="text-sm text-gray-600 mt-0.5">{t('verifiedProfessionals')}</p>
          </div>

          {isInitialLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, idx) => (
                <Card key={idx} className="border border-gray-100 rounded-xl overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                    <div className="space-y-2 mb-3">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                    <Skeleton className="h-9 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!isInitialLoading && filteredProfiles.length === 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Columna Izquierda - No se encontraron resultados */}
              <Card className="p-8 text-center border-0 shadow-sm rounded-xl bg-white flex flex-col justify-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <SearchIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {t('noResults')}
                </h3>
                <p className="text-sm text-gray-600">
                  {t('tryDifferentFilters')}
                </p>
              </Card>

              {/* Columna Derecha - CTA para autónomos */}
              <Card className="p-8 text-center border-0 shadow-lg rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex flex-col justify-center">
                <h3 className="text-xl font-bold mb-2">
                  {t('areYouProfessionalHere')}
                </h3>
                <p className="text-blue-50 mb-6 text-sm">
                  {t('joinFreeAppearHere')}
                </p>
                <Button
                  onClick={() => navigate(createPageUrl("PricingPlans"))}
                  className="bg-orange-500 hover:bg-orange-600 text-white h-11 px-6 text-sm font-semibold shadow-xl rounded-lg mx-auto"
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  {t('registerAsProfessional')}
                </Button>
              </Card>
            </div>
          )}

          {/* LISTADO DE AUTÓNOMOS */}
          {!isInitialLoading && filteredProfiles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
          )}

          {/* CTA para autónomos - SOLO CUANDO HAY RESULTADOS */}
          {!isInitialLoading && filteredProfiles.length > 0 && (
            <div className="mt-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-center text-white shadow-lg">
              <h3 className="text-2xl font-bold mb-2">
                {t('areYouProfessionalHere')}
              </h3>
              <p className="text-blue-100 mb-5 text-lg">
                {t('getMoreClients')}
              </p>
              <Button
                onClick={() => navigate(createPageUrl("PricingPlans"))}
                className="bg-white hover:bg-gray-50 text-blue-700 h-12 px-8 text-base font-semibold shadow-xl rounded-xl"
              >
                <Briefcase className="w-5 h-5 mr-2" />
                {t('registerAsProfessional')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
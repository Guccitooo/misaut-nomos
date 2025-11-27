import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Building2, Save, Plus, X, Upload, Loader2, CheckCircle, CreditCard, Briefcase, MapPin, Clock, Euro, AlertCircle, Globe, Facebook, Instagram, Linkedin, Camera, Award, BarChart3, Music } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import ProfilePictureUpload from "../components/profile/ProfilePictureUpload";
import ProfileCompleteness from "../components/profile/ProfileCompleteness";
import PremiumDashboard from "../components/premium/PremiumDashboard";
import { useLanguage } from "../components/ui/LanguageSwitcher";
import InvoicingSettingsForm from "../components/invoicing/InvoicingSettingsForm";
import SkillsSection from "../components/profile/SkillsSection";
import PortfolioSection from "../components/profile/PortfolioSection";
import FAQSection from "../components/profile/FAQSection";

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
      
      if (isNaN(expiration.getTime())) return true;
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
      
      if (isNaN(expiration.getTime())) return false;
      return expiration >= today;
    } catch (error) {
      return false;
    }
  }
  
  return false;
};

const provincias = [
  "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila",
  "Badajoz", "Barcelona", "Burgos", "Cáceres", "Cádiz", "Cantabria",
  "Castellón", "Ciudad Real", "Córdoba", "Cuenca", "Gerona", "Granada",
  "Guadalajara", "Guipúzcoa", "Huelva", "Huesca", "Islas Baleares",
  "Jaén", "La Coruña", "La Rioja", "Las Palmas", "León", "Lérida",
  "Lugo", "Madrid", "Málaga", "Murcia", "Navarra", "Orense", "Palencia",
  "Pontevedra", "Salamanca", "Santa Cruz de Tenerife", "Segovia", "Sevilla",
  "Soria", "Tarragona", "Teruel", "Toledo", "Valencia", "Valladolid",
  "Vizcaya", "Zamora", "Zaragoza"
];

const ciudadesPorProvincia = {
  "Madrid": ["Madrid", "Alcalá de Henares", "Móstoles", "Fuenlabrada", "Leganés", "Getafe", "Alcorcón", "Torrejón de Ardoz", "Parla", "Alcobendas"],
  "Barcelona": ["Barcelona", "Hospitalet de Llobregat", "Badalona", "Terrassa", "Sabadell", "Mataró", "Santa Coloma de Gramenet"],
  "Valencia": ["Valencia", "Gandía", "Torrent", "Paterna", "Sagunto", "Alzira"],
  "Sevilla": ["Sevilla", "Dos Hermanas", "Alcalá de Guadaíra", "Utrera", "Mairena del Aljarafe"],
  "Málaga": ["Málaga", "Marbella", "Mijas", "Vélez-Málaga", "Fuengirola", "Torremolinos", "Estepona"],
  "Alicante": ["Alicante", "Elche", "Torrevieja", "Orihuela", "Benidorm", "Alcoy"],
  "Murcia": ["Murcia", "Cartagena", "Lorca", "Molina de Segura", "Alcantarilla"],
  "Vizcaya": ["Bilbao", "Barakaldo", "Getxo", "Portugalete", "Santurtzi"],
  "Zaragoza": ["Zaragoza", "Calatayud", "Utebo", "Ejea de los Caballeros"],
  "Las Palmas": ["Las Palmas de Gran Canaria", "Telde", "Santa Lucía", "Arucas"],
  "Islas Baleares": ["Palma", "Calvià", "Manacor", "Llucmajor", "Ibiza"],
};

// Eliminado - se cargarán dinámicamente desde BD

export default function MyProfilePage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [success, setSuccess] = useState(false);
  const [searchParams] = useSearchParams();
  const [isVerifyingSubscription, setIsVerifyingSubscription] = useState(false);
  const MAX_POLLING_ATTEMPTS = 10;

  const reactivationSuccess = searchParams.get("reactivation");
  const onboardingPending = searchParams.get("onboarding");
  const onboardingCompleted = searchParams.get("onboarding") === "completed";

  const [userData, setUserData] = useState({
    full_name: "",
    phone: "",
    city: "",
  });

  const [profileData, setProfileData] = useState({
    business_name: "",
    cif_nif: "",
    email_contacto: "",
    telefono_contacto: "",
    iban: "",
    description: "",
    descripcion_corta: "",
    categories: [],
    provincia: "",
    ciudad: "",
    municipio: "",
    service_area: "",
    radio_servicio_km: 10,
    disponibilidad_tipo: "laborables",
    horario_apertura: "09:00",
    horario_cierre: "18:00",
    website: "",
    price_range: "€€",
    tarifa_base: "",
    facturacion: "autonomo",
    formas_pago: [],
    photos: [],
    social_links: {
      facebook: "",
      instagram: "",
      linkedin: "",
      tiktok: ""
    },
    activity_other: "",
    metodos_contacto: ['chat_interno'],
    years_experience: "",
    certifications: [],
    skills: [],
    portfolio_items: [],
    faq_items: [],
  });

  const [newCertification, setNewCertification] = useState("");

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (profileData.provincia && profileData.ciudad) {
      const area = profileData.municipio 
        ? `${profileData.municipio}, ${profileData.ciudad}, ${profileData.provincia}`
        : `${profileData.ciudad}, ${profileData.provincia}`;
      setProfileData(prev => ({ ...prev, service_area: area }));
    }
  }, [profileData.provincia, profileData.ciudad, profileData.municipio]);

  useEffect(() => {
    if (reactivationSuccess === "success" || onboardingPending === "pending") {
      setIsVerifyingSubscription(true);
      startSubscriptionPolling();
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (onboardingCompleted) {
      toast.success('🎉 ¡Enhorabuena! Tu perfil está publicado y visible para clientes.', {
        duration: 8000
      });
      
      window.history.replaceState({}, document.title, window.location.pathname);
      
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    } else if (reactivationSuccess === "canceled") {
      toast.info("Reactivación cancelada. Puedes intentarlo de nuevo cuando quieras.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [reactivationSuccess, onboardingPending, onboardingCompleted, queryClient, navigate]);

  const startSubscriptionPolling = async () => {
    for (let attempt = 1; attempt <= MAX_POLLING_ATTEMPTS; attempt++) {
      try {
        const currentUser = await loadUser();
        if (!currentUser) throw new Error("User not loaded during polling");
        
        await queryClient.invalidateQueries({ queryKey: ['subscription', currentUser.id] });
        const result = await queryClient.fetchQuery({
          queryKey: ['subscription', currentUser.id],
          queryFn: async () => {
            const subs = await base44.entities.Subscription.filter({
              user_id: currentUser.id
            });
            return subs[0] || null;
          },
          staleTime: 0,
          gcTime: 0,
        });
        
        if (result && isSubscriptionActive(result.estado, result.fecha_expiracion)) {
          setIsVerifyingSubscription(false);
          
          if (reactivationSuccess === "success") {
            toast.success("🎉 ¡Tu suscripción ha sido reactivada! Tu perfil ya es visible en búsquedas.", {
              duration: 6000
            });
          } else if (onboardingPending === "pending") {
            toast.success("✅ ¡Pago confirmado! Ahora completa tu perfil profesional.", {
              duration: 8000
            });
            
            setTimeout(() => {
              navigate(createPageUrl("ProfileOnboarding"));
            }, 2000);
          }
          
          queryClient.invalidateQueries({ queryKey: ['myProfile'] });
          return;
        }
        
        if (attempt === 5 && currentUser) {
          try {
            const syncResponse = await base44.functions.invoke('syncStripeSubscription', {
              user_id: currentUser.id
            });
            
            if (syncResponse.data.ok) {
              await loadUser();
              await queryClient.invalidateQueries({ queryKey: ['subscription'] });
              await queryClient.refetchQueries({ queryKey: ['subscription'] });
              
              if (syncResponse.data.needs_onboarding) {
                toast.success("✅ ¡Suscripción activada! Completa tu perfil profesional.", {
                  duration: 8000
                });
                setTimeout(() => {
                  navigate(createPageUrl("ProfileOnboarding"));
                }, 2000);
              } else {
                toast.success("🎉 ¡Tu suscripción está activa!", {
                  duration: 6000
                });
              }
              
              setIsVerifyingSubscription(false);
              return;
            }
          } catch (syncError) {
            console.error('❌ Error en sincronización forzada:', syncError);
          }
        }
        
        if (attempt < MAX_POLLING_ATTEMPTS) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`❌ Error en intento ${attempt}:`, error);
        if (attempt < MAX_POLLING_ATTEMPTS) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }
    }

    setIsVerifyingSubscription(false);
    
    toast.error(
      <div>
        <p className="font-semibold">No se pudo verificar tu suscripción</p>
        <p className="text-sm mt-1">Por favor, contacta con soporte: soporte@misautonomos.es</p>
      </div>,
      {
        duration: 15000
      }
    );
  };

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      console.log('👤 Usuario cargado:', currentUser.email);
      console.log('📸 Foto de perfil URL:', currentUser.profile_picture);
      setUser(currentUser);
      setUserData({
        full_name: currentUser.full_name || "",
        phone: currentUser.phone || "",
        city: currentUser.city || "",
      });
      return currentUser;
    } catch (error) {
      console.error("Error loading user:", error);
      base44.auth.redirectToLogin();
      return null;
    }
  };

  const { data: subscription, isLoading: loadingSubscription } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      const subs = await base44.entities.Subscription.filter({
        user_id: user.id
      });
      
      return subs.length > 0 ? subs[0] : null;
    },
    enabled: !!user && !isVerifyingSubscription,
    retry: 1,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['myProfile', user?.id],
    queryFn: async () => {
      const profiles = await base44.entities.ProfessionalProfile.filter({
        user_id: user.id
      });
      return profiles[0];
    },
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: true,
  });

  useEffect(() => {
    if (profile) {
      setProfileData({
        business_name: profile.business_name || "",
        cif_nif: profile.cif_nif || "",
        email_contacto: profile.email_contacto || user?.email || "",
        telefono_contacto: profile.telefono_contacto || user?.phone || "",
        iban: profile.iban || "",
        description: profile.description || "",
        descripcion_corta: profile.descripcion_corta || "",
        categories: profile.categories || [],
        provincia: profile.provincia || "",
        ciudad: profile.ciudad || "",
        municipio: profile.municipio || "",
        service_area: profile.service_area || "",
        radio_servicio_km: profile.radio_servicio_km || 10,
        disponibilidad_tipo: profile.disponibilidad_tipo || "laborables",
        horario_apertura: profile.horario_apertura || "09:00",
        horario_cierre: profile.horario_cierre || "18:00",
        website: profile.website || "",
        price_range: profile.price_range || "€€",
        tarifa_base: profile.tarifa_base || "",
        facturacion: profile.facturacion || "autonomo",
        formas_pago: profile.formas_pago || [],
        photos: profile.photos || [],
        social_links: profile.social_links || {
          facebook: "",
          instagram: "",
          linkedin: "",
          tiktok: ""
        },
        activity_other: profile.activity_other || "",
        metodos_contacto: profile.metodos_contacto || ['chat_interno'],
        years_experience: profile.years_experience || "",
        certifications: profile.certifications || [],
        skills: profile.skills || [],
        portfolio_items: profile.portfolio_items || [],
        faq_items: profile.faq_items || [],
      });
    }
  }, [profile]);

  const { data: metrics = [] } = useQuery({
    queryKey: ['profileMetrics', user?.id],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const allMetrics = await base44.entities.ProfileMetrics.filter({
        professional_id: user.id
      });
      
      return allMetrics.filter(m => new Date(m.date) >= thirtyDaysAgo);
    },
    enabled: !!user && !!profile,
    staleTime: 1000 * 60 * 5,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const cats = await base44.entities.ServiceCategory.list();
      return cats
        .filter(c => c.name)
        .sort((a, b) => a.name.localeCompare(b.name, 'es'));
    },
    staleTime: 1000 * 60 * 30,
  });

  const { data: invoicingSettings } = useQuery({
    queryKey: ['invoicingSettings', user?.id],
    queryFn: async () => {
      const settings = await base44.entities.InvoicingSettings.filter({ professional_id: user.id });
      return settings[0] || null;
    },
    enabled: !!user && !!profile,
  });

  const saveInvoicingSettingsMutation = useMutation({
    mutationFn: async (data) => {
      if (invoicingSettings) {
        return await base44.entities.InvoicingSettings.update(invoicingSettings.id, data);
      } else {
        return await base44.entities.InvoicingSettings.create({
          ...data,
          professional_id: user.id
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['invoicingSettings']);
      toast.success(t('invoicingSettingsSaved') || 'Datos de facturación guardados');
    },
  });

  const getSubscriptionStatus = () => {
    if (!subscription) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expirationDate = new Date(subscription.fecha_expiracion);
    expirationDate.setHours(0, 0, 0, 0);
    
    const daysLeft = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));
    const isActive = isSubscriptionActive(subscription.estado, subscription.fecha_expiracion);
    const normalizedState = subscription.estado.toLowerCase();
    
    if (normalizedState === "en_prueba" || normalizedState === "trialing" || normalizedState === "trial_active") {
      return {
        text: "Periodo de prueba",
        badge: "🟡",
        color: "bg-blue-100 text-blue-800 border border-blue-300",
        details: isActive ? `${daysLeft} días de prueba restantes` : "Prueba finalizada",
        isActive: isActive,
        showUpgrade: true,
        showReactivate: false
      };
    }
    
    if (normalizedState === "activo" || normalizedState === "active" || normalizedState === "actif") {
      return {
        text: "Suscripción activa",
        badge: "🟢",
        color: "bg-green-100 text-green-800 border border-green-300",
        details: `Renovación: ${expirationDate.toLocaleDateString('es-ES')}`,
        isActive: true,
        showUpgrade: false,
        showReactivate: false
      };
    }
    
    if (normalizedState === "cancelado" || normalizedState === "canceled") {
      return {
        text: isActive ? "Suscripción cancelada" : "Suscripción finalizada",
        badge: isActive ? "⚪" : "🔴",
        color: isActive 
          ? "bg-yellow-100 text-yellow-800 border border-yellow-300" 
          : "bg-red-100 text-red-800 border border-red-300",
        details: isActive 
          ? `Activo hasta ${expirationDate.toLocaleDateString('es-ES')} (no se renovará)`
          : "Tu perfil está oculto",
        isActive: isActive,
        showUpgrade: false,
        showReactivate: true
      };
    }
    
    return {
      text: isActive ? "Suscripción activa" : "Suscripción inactiva",
      badge: isActive ? "🟢" : "🔴",
      color: isActive 
        ? "bg-green-100 text-green-800 border border-green-300"
        : "bg-red-100 text-red-800 border border-red-300",
      details: isActive ? `Válido hasta ${expirationDate.toLocaleDateString('es-ES')}` : "Reactiva tu plan para aparecer en búsquedas",
      isActive: isActive,
      showUpgrade: false,
      showReactivate: !isActive
    };
  };

  const updateUserMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      toast.success(t('personalDataUpdated'));
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      const dataToSave = {
        ...data,
        imagen_principal: user.profile_picture || data.photos?.[0] || data.imagen_principal || ""
      };
      
      if (profile) {
        return await base44.entities.ProfessionalProfile.update(profile.id, dataToSave);
      } else {
        return await base44.entities.ProfessionalProfile.create({
          ...dataToSave,
          user_id: user.id,
          estado_perfil: "activo",
          visible_en_busqueda: true,
          onboarding_completed: true
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      setIsEditing(false);
      setSuccess(true);
      toast.success(t('professionalProfileUpdated'));
      setTimeout(() => setSuccess(false), 3000);
    },
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: async (visible) => {
      return await base44.entities.ProfessionalProfile.update(profile.id, {
        visible_en_busqueda: visible
      });
    },
    onSuccess: (_, visible) => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      toast.success(visible ? t('profileNowVisible') : t('profileNowHidden'));
    },
  });

  const handleSave = async () => {
    console.log('💾 Guardando datos de usuario:', userData);
    
    const userDataToUpdate = { ...userData };
    
    if (profile && profileData.business_name) {
      userDataToUpdate.full_name = profileData.business_name;
    }
    
    updateUserMutation.mutate(userDataToUpdate);
    
    if (profile || profileData.business_name) {
      console.log('💾 Guardando datos de perfil profesional:', profileData);
      updateProfileMutation.mutate(profileData);
    }
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('exceedsSize').replace('{filename}', file.name));
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploadingPhoto(true);
    const uploadedUrls = [];

    try {
      for (const file of validFiles) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploadedUrls.push(file_url);
      }

      const updatedPhotos = [...(profileData.photos || []), ...uploadedUrls];
      setProfileData(prev => ({
        ...prev,
        photos: updatedPhotos
      }));

      // Guardar automáticamente después de subir las fotos
      if (profile) {
        await base44.entities.ProfessionalProfile.update(profile.id, {
          photos: updatedPhotos,
          imagen_principal: user?.profile_picture || updatedPhotos[0] || ""
        });
        queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      }

      toast.success(t('photosAdded').replace('{count}', validFiles.length));
    } catch (error) {
      console.error("Error uploading photos:", error);
      toast.error(t('errorUploadingPhotos'));
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const removePhoto = async (index) => {
    const newPhotos = [...profileData.photos];
    newPhotos.splice(index, 1);
    setProfileData({ ...profileData, photos: newPhotos });

    // Guardar automáticamente después de eliminar la foto
    if (profile) {
      try {
        await base44.entities.ProfessionalProfile.update(profile.id, {
          photos: newPhotos,
          imagen_principal: user?.profile_picture || newPhotos[0] || ""
        });
        queryClient.invalidateQueries({ queryKey: ['myProfile'] });
        toast.success(t('photoRemoved'));
      } catch (error) {
        console.error("Error removing photo:", error);
        toast.error(t('errorRemovingPhoto'));
      }
    }
  };

  const selectCategory = (category) => {
    setProfileData({
      ...profileData,
      categories: [category]
    });
  };

  const toggleFormaPago = (forma) => {
    const formas = profileData.formas_pago;
    if (formas.includes(forma)) {
      setProfileData({
        ...profileData,
        formas_pago: formas.filter(f => f !== forma)
      });
    } else {
      setProfileData({
        ...profileData,
        formas_pago: [...formas, forma]
      });
    }
  };

  const addCertification = () => {
    if (newCertification && !profileData.certifications.includes(newCertification)) {
      setProfileData({
        ...profileData,
        certifications: [...(profileData.certifications || []), newCertification]
      });
      setNewCertification("");
    }
  };

  const removeCertification = (cert) => {
    setProfileData({
      ...profileData,
      certifications: (profileData.certifications || []).filter(c => c !== cert)
    });
  };



  const isInitialLoading = !user || loadingProfile || (loadingSubscription && !isVerifyingSubscription);

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
      </div>
    );
  }

  if (isVerifyingSubscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-xl bg-white">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Verificando tu suscripción
              </h2>
              <p className="text-gray-600">
                Estamos confirmando tu pago y activando tu cuenta...
              </p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-900 font-medium">
                  Esto tardará solo unos segundos
                </p>
                <p className="text-xs text-blue-700 mt-2">
                  Por favor, no cierres esta ventana mientras procesamos tu pago.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Determinar si es profesional: tiene perfil con onboarding completado O tiene user_type professionnel
  const isProfessional = (profile && profile.onboarding_completed) || user?.user_type === "professionnel";
  const subscriptionStatus = getSubscriptionStatus();
  
  // El perfil está visible si: tiene suscripción activa Y visible_en_busqueda = true
  const isProfileVisible = profile?.visible_en_busqueda === true && subscriptionStatus?.isActive;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('myProfile')}</h1>
            <p className="text-gray-600">
              {isProfessional ? t('manageYourProfile') : t('manageYourInformation')}
            </p>
            {profile && (
              <div className="mt-2 flex gap-2">
                {subscriptionStatus?.isActive ? (
                  <Badge className="bg-green-100 text-green-800">
                    ✓ {t('visibleToClients')}
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800">
                    ⚠ {t('hiddenProfile')}
                  </Badge>
                )}
              </div>
            )}
          </div>
          {!isEditing ? (
            <div className="flex gap-2">
              <Button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700">
                {t('editProfile')}
              </Button>
              {!isProfessional && (
                <Button 
                  onClick={() => navigate(createPageUrl("PricingPlans"))} 
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  {t('becomeFreelancer')}
                </Button>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => {
                setIsEditing(false);
                queryClient.invalidateQueries({ queryKey: ['myProfile'] });
              }}>
                {t('cancel')}
              </Button>
              <Button 
                onClick={handleSave}
                disabled={updateUserMutation.isPending || updateProfileMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('saving')}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {t('saveChanges')}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {t('profileUpdatedSuccess')}
            </AlertDescription>
          </Alert>
        )}

        {!isProfessional && user && (
          <Card className="mb-6 shadow-lg border-0 bg-gradient-to-r from-orange-50 to-orange-100">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{t('wantOfferServices')}</h3>
                    <p className="text-sm text-gray-600">
                      {t('becomeProfessionalAppear')}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => navigate(createPageUrl("PricingPlans"))}
                  className="bg-orange-500 hover:bg-orange-600 flex-shrink-0"
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  {t('viewPlans')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isProfessional && profile && !isEditing && (
          <ProfileCompleteness 
            profile={profile} 
            user={user}
          />
        )}

        <Tabs defaultValue={isProfessional ? "business" : "personal"} className="space-y-6">
          <TabsList className={`grid w-full ${isProfessional ? 'grid-cols-3 lg:grid-cols-6' : 'grid-cols-1'} bg-white shadow-md`}>
            <TabsTrigger value="personal" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <User className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">{t('personalInformation')}</span>
              <span className="sm:hidden">Personal</span>
            </TabsTrigger>
            {isProfessional && (
              <>
                <TabsTrigger value="business" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <Building2 className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">{t('professionalProfile')}</span>
                  <span className="sm:hidden">Perfil</span>
                </TabsTrigger>
                <TabsTrigger value="skills" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <Award className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Habilidades</span>
                  <span className="sm:hidden">Skills</span>
                </TabsTrigger>
                <TabsTrigger value="portfolio" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <Camera className="w-4 h-4 mr-2" />
                  {t('portfolio')}
                </TabsTrigger>
                <TabsTrigger value="faq" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">FAQ</span>
                  <span className="sm:hidden">FAQ</span>
                </TabsTrigger>
                <TabsTrigger value="invoicing" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <Euro className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">{t('invoicingData') || 'Facturación'}</span>
                  <span className="sm:hidden">Fact.</span>
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="personal">
            <Card className="shadow-sm border-0 bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-700" />
                  {t('personalInformation')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center py-4">
                  <ProfilePictureUpload
                    user={user}
                    currentPicture={user?.profile_picture}
                    onUpdate={(newUrl) => {
                      console.log('🔄 Foto actualizada, recargando usuario...');
                      loadUser();
                    }}
                    size="lg"
                    allowedForClients={true}
                  />
                </div>

                <div>
                  <Label>{t('email')}</Label>
                  <Input value={user.email} disabled className="bg-gray-50" />
                </div>

                <div>
                  <Label>{t('fullNameLabel')}</Label>
                  <Input
                    value={userData.full_name || ""}
                    onChange={(e) => setUserData({ ...userData, full_name: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>{t('phone')}</Label>
                    <Input
                      value={userData.phone || ""}
                      onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                      disabled={!isEditing}
                      placeholder="+34 612 345 678"
                    />
                  </div>
                  <div>
                    <Label>{t('city')}</Label>
                    <Select
                      value={userData.city || ""}
                      onValueChange={(value) => setUserData({ ...userData, city: value })}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectCityPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {Object.values(ciudadesPorProvincia).flat().sort().map((ciudad) => (
                          <SelectItem key={ciudad} value={ciudad}>{ciudad}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>{t('accountType')}</Label>
                  <Badge className="bg-blue-100 text-blue-900">
                    {isProfessional ? t('professional') : t('client')}
                  </Badge>
                </div>

                {isProfessional && profile && !loadingProfile && subscriptionStatus?.isActive && (
                  <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-sm">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <Label className="text-lg font-bold text-gray-900 mb-2 block">
                            {t('manageAvailability')}
                          </Label>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {profile.visible_en_busqueda 
                              ? t('profileActiveVisible')
                              : t('profilePausedHidden')}
                          </p>
                        </div>
                        <Switch
                          checked={profile.visible_en_busqueda}
                          onCheckedChange={(checked) => toggleVisibilityMutation.mutate(checked)}
                          disabled={toggleVisibilityMutation.isPending}
                          className="data-[state=checked]:bg-green-600 mt-1"
                        />
                      </div>

                      {profile.visible_en_busqueda ? (
                        <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
                          <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-semibold text-green-900 mb-1">
                                {t('activeAndVisible')}
                              </p>
                              <p className="text-xs text-green-800">
                                {t('clientsCanSee')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-lg">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-semibold text-amber-900 mb-1">
                                {t('profilePaused')}
                              </p>
                              <p className="text-xs text-amber-800">
                                {t('usefulIfBusy')}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {isProfessional && (
            <TabsContent value="business">
              <div className="space-y-6">
                <Card className="shadow-sm border-0 bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-blue-700" />
                      {t('professionalIdentity')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>{t('professionalNameRequired')}</Label>
                      <Input
                        value={profileData.business_name}
                        onChange={(e) => setProfileData({ ...profileData, business_name: e.target.value })}
                        disabled={!isEditing}
                        placeholder="Tu Empresa S.L."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="flex items-center gap-2">
                          {profileData.cif_nif ? <CheckCircle className="w-4 h-4 text-green-600" /> : null}
                          NIF / CIF / NIE *
                        </Label>
                        <Input
                          value={profileData.cif_nif || ""}
                          onChange={(e) => {
                            const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                            setProfileData({ ...profileData, cif_nif: value });
                          }}
                          disabled={!isEditing}
                          placeholder="12345678A o B12345678"
                          maxLength={9}
                        />
                        {isEditing && profileData.cif_nif && profileData.cif_nif.length > 0 && profileData.cif_nif.length < 8 && (
                          <p className="text-xs text-amber-600 mt-1">El NIF/CIF debe tener al menos 8 caracteres</p>
                        )}
                      </div>
                      <div>
                        <Label className="flex items-center gap-2">
                          {profileData.years_experience ? <CheckCircle className="w-4 h-4 text-green-600" /> : null}
                          {t('yearsExperience')}
                        </Label>
                        <Input
                          type="number"
                          value={profileData.years_experience}
                          onChange={(e) => setProfileData({ ...profileData, years_experience: e.target.value })}
                          disabled={!isEditing}
                          placeholder="5"
                          min="0"
                          max="50"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="flex items-center gap-2">
                        {profileData.email_contacto ? <CheckCircle className="w-4 h-4 text-green-600" /> : null}
                        {t('emailContact')}
                      </Label>
                      <Input
                        type="email"
                        value={profileData.email_contacto}
                        onChange={(e) => setProfileData({ ...profileData, email_contacto: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>

                    <div>
                      <Label className="flex items-center gap-2">
                        {profileData.telefono_contacto ? <CheckCircle className="w-4 h-4 text-green-600" /> : null}
                        {t('phoneContact')}
                      </Label>
                      <Input
                        value={profileData.telefono_contacto}
                        onChange={(e) => setProfileData({ ...profileData, telefono_contacto: e.target.value })}
                        disabled={!isEditing}
                        placeholder="+34 612 345 678"
                      />
                    </div>

                    <div>
                      <Label className="flex items-center gap-2">
                        {profileData.iban ? <CheckCircle className="w-4 h-4 text-green-600" /> : null}
                        {t('ibanForInvoices')}
                      </Label>
                      <Input
                        value={profileData.iban || ""}
                        onChange={(e) => setProfileData({ ...profileData, iban: e.target.value.toUpperCase() })}
                        disabled={!isEditing}
                        placeholder="ES91 2100 0418 4502 0005 1332"
                        maxLength={34}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {t('ibanHelp')}
                      </p>
                    </div>

                  </CardContent>
                </Card>

                <Card className="shadow-sm border-0 bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{t('servicesAndDescription')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>{t('serviceCategory')}</Label>
                      {!isEditing ? (
                        <div className="mt-2 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <Badge className="bg-blue-100 text-blue-900 text-sm">
                            {profileData.categories[0] ? t(profileData.categories[0]) : t('noCategory')}
                          </Badge>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-2 mt-2">
                          {categories.map((cat) => (
                            <div
                              key={cat.id}
                              onClick={() => selectCategory(cat.name)}
                              className={`flex items-center gap-2 p-3 border-2 rounded-lg transition-all cursor-pointer ${
                                profileData.categories.includes(cat.name)
                                  ? "border-blue-600 bg-blue-50"
                                  : "border-gray-200 hover:bg-gray-50"
                              }`}
                            >
                              {profileData.categories.includes(cat.name) ? (
                                <CheckCircle className="w-5 h-5 text-blue-600" />
                              ) : (
                                <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                              )}
                              <span className="text-sm">{t(cat.name) || cat.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {profileData.categories.includes("Otro tipo de servicio profesional") && (
                      <div>
                        <Label>{t('specifyYourService')}</Label>
                        <Input
                          value={profileData.activity_other}
                          onChange={(e) => setProfileData({ ...profileData, activity_other: e.target.value })}
                          disabled={!isEditing}
                          placeholder={t('specifyServicePlaceholder')}
                        />
                      </div>
                    )}

                    <div>
                      <Label>{t('servicesDescription')}</Label>
                      {!isEditing && profileData.descripcion_corta ? (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-start gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-gray-700">{profileData.descripcion_corta}</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Textarea
                            value={profileData.descripcion_corta}
                            onChange={(e) => setProfileData({ ...profileData, descripcion_corta: e.target.value.slice(0, 220) })}
                            disabled={!isEditing}
                            className="h-24 mt-2"
                            placeholder="Describe brevemente tus servicios..."
                          />
                          <p className="text-xs text-gray-500 mt-1">{profileData.descripcion_corta.length}/220</p>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-0 bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-700" />
                      {t('locationLabel')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="flex items-center gap-2">
                          {profileData.provincia ? <CheckCircle className="w-4 h-4 text-green-600" /> : null}
                          {t('province')}
                        </Label>
                        <Select
                          value={profileData.provincia}
                          onValueChange={(value) => setProfileData({
                            ...profileData,
                            provincia: value,
                            ciudad: ""
                          })}
                          disabled={!isEditing}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('selectProvincePlaceholder')} />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {provincias.map((prov) => (
                              <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="flex items-center gap-2">
                          {profileData.ciudad ? <CheckCircle className="w-4 h-4 text-green-600" /> : null}
                          {t('city')}
                        </Label>
                        <Select
                          value={profileData.ciudad}
                          onValueChange={(value) => setProfileData({ ...profileData, ciudad: value })}
                          disabled={!isEditing || !profileData.provincia}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={profileData.provincia ? t('selectCityPlaceholder') : t('firstChooseProvince')} />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {profileData.provincia && ciudadesPorProvincia[profileData.provincia]?.map((ciudad) => (
                              <SelectItem key={ciudad} value={ciudad}>{ciudad}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>




                  </CardContent>
                </Card>

                <Card className="shadow-sm border-0 bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Euro className="w-5 h-5 text-blue-700" />
                      {t('ratesAndPayments')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="flex items-center gap-2">
                        {profileData.tarifa_base ? <CheckCircle className="w-4 h-4 text-green-600" /> : null}
                        {t('baseRateOptionalLabel')}
                      </Label>
                      <Input
                        type="number"
                        value={profileData.tarifa_base}
                        onChange={(e) => setProfileData({ ...profileData, tarifa_base: e.target.value })}
                        disabled={!isEditing}
                        placeholder="35"
                        min="0"
                      />
                    </div>

                    <div>
                      <Label className="flex items-center gap-2">
                        {profileData.formas_pago.length > 0 ? <CheckCircle className="w-4 h-4 text-green-600" /> : null}
                        {t('acceptedPaymentMethodsLabel')}
                      </Label>
                      {!isEditing ? (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {profileData.formas_pago.map((forma) => (
                            <Badge key={forma} className="bg-purple-100 text-purple-900 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              {t(forma.toLowerCase())}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {["Tarjeta", "Transferencia", "Efectivo", "Bizum"].map((forma) => (
                            <div
                              key={forma}
                              onClick={() => toggleFormaPago(forma)}
                              className={`flex items-center gap-2 p-3 border-2 rounded-lg transition-all cursor-pointer ${
                                profileData.formas_pago.includes(forma)
                                  ? "border-purple-600 bg-purple-50"
                                  : "border-gray-200 hover:bg-gray-50"
                              }`}
                            >
                              {profileData.formas_pago.includes(forma) ? (
                                <CheckCircle className="w-5 h-5 text-purple-600" />
                              ) : (
                                <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                              )}
                              <span className="text-sm">{t(forma.toLowerCase())}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>


              </div>
            </TabsContent>
          )}

          {isProfessional && (
            <TabsContent value="skills">
              <SkillsSection
                skills={profileData.skills || []}
                certifications={profileData.certifications || []}
                yearsExperience={profileData.years_experience}
                isEditing={isEditing}
                onSkillsChange={(skills) => setProfileData({ ...profileData, skills })}
                onCertificationsChange={(certifications) => setProfileData({ ...profileData, certifications })}
                onYearsChange={(years) => setProfileData({ ...profileData, years_experience: years })}
              />
            </TabsContent>
          )}

          {isProfessional && (
            <TabsContent value="portfolio">
              <div className="space-y-6">
                {/* Portfolio de trabajos con descripciones */}
                <PortfolioSection
                  portfolioItems={profileData.portfolio_items || []}
                  isEditing={isEditing}
                  onPortfolioChange={(items) => setProfileData({ ...profileData, portfolio_items: items })}
                  categories={categories.map(c => c.name)}
                />

                {/* Galería simple de fotos */}
                <Card className="shadow-sm border-0 bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Camera className="w-5 h-5 text-blue-700" />
                      Galería de Fotos ({profileData.photos.length}/10)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">Fotos adicionales de tus trabajos</p>

                  {isEditing && profileData.photos.length < 10 && (
                    <label className="cursor-pointer block">
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handlePhotoUpload}
                          disabled={uploadingPhoto}
                        />
                        {uploadingPhoto ? (
                          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-700" />
                        ) : (
                          <>
                            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm text-gray-600">{t('clickToAddPhotos').replace('{count}', profileData.photos.length)}</p>
                            <p className="text-xs text-gray-500 mt-1">{t('selectMultiple')}</p>
                          </>
                        )}
                      </div>
                    </label>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {profileData.photos.map((photo, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={photo}
                          alt={t('photoNumber').replace('{number}', idx + 1)}
                          className="w-full h-32 object-cover rounded-lg shadow-md"
                        />
                        {isEditing && (
                          <button
                            onClick={() => removePhoto(idx)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        {idx === 0 && (
                          <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded font-semibold">
                            {t('mainPhotoLabel')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  </CardContent>
                  </Card>

                  <Card className="shadow-sm border-0 bg-white">
                  <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-700" />
                    {t('socialNetworksLabel')}
                  </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="flex items-center gap-2 text-xs text-gray-600">
                        {profileData.website ? <CheckCircle className="w-3 h-3 text-green-600" /> : <div className="w-3 h-3" />}
                        {t('sitioWeb')}
                      </Label>
                      {!isEditing && profileData.website ? (
                        <a 
                          href={profileData.website.startsWith('http') ? profileData.website : `https://${profileData.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-2 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors"
                        >
                          <p className="text-sm text-blue-700 truncate flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            {profileData.website}
                          </p>
                        </a>
                      ) : (
                        <Input
                          value={profileData.website}
                          onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                          disabled={!isEditing}
                          placeholder="https://tuweb.com"
                          className="h-10"
                        />
                      )}
                    </div>

                    <div>
                      <Label className="flex items-center gap-2 text-xs text-gray-600">
                        {profileData.social_links?.instagram ? <CheckCircle className="w-3 h-3 text-green-600" /> : <div className="w-3 h-3" />}
                        Instagram
                      </Label>
                      {!isEditing && profileData.social_links?.instagram ? (
                        <a 
                          href={profileData.social_links.instagram.startsWith('http') ? profileData.social_links.instagram : `https://instagram.com/${profileData.social_links.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-2 rounded-lg border border-pink-200 bg-pink-50 hover:bg-pink-100 transition-colors"
                        >
                          <p className="text-sm text-pink-700 truncate flex items-center gap-2">
                            <Instagram className="w-4 h-4" />
                            {profileData.social_links.instagram}
                          </p>
                        </a>
                      ) : (
                        <Input
                          value={profileData.social_links.instagram}
                          onChange={(e) => setProfileData({ 
                            ...profileData, 
                            social_links: { ...profileData.social_links, instagram: e.target.value }
                          })}
                          disabled={!isEditing}
                          placeholder="https://instagram.com/tuperfil"
                          className="h-10"
                        />
                      )}
                    </div>

                    <div>
                      <Label className="flex items-center gap-2 text-xs text-gray-600">
                        {profileData.social_links?.facebook ? <CheckCircle className="w-3 h-3 text-green-600" /> : <div className="w-3 h-3" />}
                        Facebook
                      </Label>
                      {!isEditing && profileData.social_links?.facebook ? (
                        <a 
                          href={profileData.social_links.facebook.startsWith('http') ? profileData.social_links.facebook : `https://facebook.com/${profileData.social_links.facebook}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-2 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors"
                        >
                          <p className="text-sm text-blue-700 truncate flex items-center gap-2">
                            <Facebook className="w-4 h-4" />
                            {profileData.social_links.facebook}
                          </p>
                        </a>
                      ) : (
                        <Input
                          value={profileData.social_links.facebook}
                          onChange={(e) => setProfileData({ 
                            ...profileData, 
                            social_links: { ...profileData.social_links, facebook: e.target.value }
                          })}
                          disabled={!isEditing}
                          placeholder="https://facebook.com/tupagina"
                          className="h-10"
                        />
                      )}
                    </div>

                    <div>
                      <Label className="flex items-center gap-2 text-xs text-gray-600">
                        {profileData.social_links?.tiktok ? <CheckCircle className="w-3 h-3 text-green-600" /> : <div className="w-3 h-3" />}
                        TikTok
                      </Label>
                      {!isEditing && profileData.social_links?.tiktok ? (
                        <a 
                          href={profileData.social_links.tiktok.startsWith('http') ? profileData.social_links.tiktok : `https://tiktok.com/@${profileData.social_links.tiktok.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <p className="text-sm text-gray-700 truncate flex items-center gap-2">
                            <Music className="w-4 h-4" />
                            {profileData.social_links.tiktok}
                          </p>
                        </a>
                      ) : (
                        <Input
                          value={profileData.social_links.tiktok}
                          onChange={(e) => setProfileData({ 
                            ...profileData, 
                            social_links: { ...profileData.social_links, tiktok: e.target.value }
                          })}
                          disabled={!isEditing}
                          placeholder="https://tiktok.com/@tuperfil"
                          className="h-10"
                        />
                      )}
                    </div>
                  </div>
                  </CardContent>
                  </Card>
                  </div>
                  </TabsContent>
          )}

          {isProfessional && (
            <TabsContent value="faq">
              <FAQSection
                faqItems={profileData.faq_items || []}
                isEditing={isEditing}
                onFAQChange={(items) => setProfileData({ ...profileData, faq_items: items })}
              />
            </TabsContent>
          )}

          {isProfessional && (
            <TabsContent value="invoicing">
              <InvoicingSettingsForm
                settings={invoicingSettings}
                onSave={(data) => saveInvoicingSettingsMutation.mutate(data)}
              />
            </TabsContent>
          )}
        </Tabs>


      </div>
    </div>
  );
}
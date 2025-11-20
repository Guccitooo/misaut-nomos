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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import ProfilePictureUpload from "../components/profile/ProfilePictureUpload";
import ProfileCompleteness from "../components/profile/ProfileCompleteness";
import PremiumDashboard from "../components/premium/PremiumDashboard";

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

const categories = [
  "Electricista", "Fontanero", "Carpintero", "Albañil / Reformas",
  "Jardinero", "Pintor", "Transportista", "Autónomo de limpieza",
  "Asesoría o gestoría", "Empresa multiservicios",
  "Otro tipo de servicio profesional"
].sort();

export default function MyProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [success, setSuccess] = useState(false);
  const [searchParams] = useSearchParams();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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
    staleTime: 30000,
  });

  useEffect(() => {
    if (profile && user) {
      setProfileData({
        business_name: profile.business_name || "",
        cif_nif: profile.cif_nif || "",
        email_contacto: profile.email_contacto || user.email,
        telefono_contacto: profile.telefono_contacto || user.phone || "",
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
      });
    }
  }, [profile, user]);

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
      toast.success('✅ Datos personales actualizados');
    },
  });

  const generateSlug = (businessName, category, ciudad) => {
    const cleanCategory = category?.replace(/[\/\s]+/g, '-') || '';
    const text = `${businessName} ${cleanCategory} ${ciudad || ''}`;
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .trim();
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      const slug = generateSlug(
        data.business_name || profile?.business_name || "",
        data.categories?.[0] || profile?.categories?.[0] || "",
        data.ciudad || profile?.ciudad || ""
      );

      const dataToSave = {
        ...data,
        imagen_principal: user.profile_picture || data.photos?.[0] || data.imagen_principal || "",
        slug_publico: slug
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
      toast.success('✅ Perfil profesional actualizado');
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
      toast.success(visible ? '✅ Tu perfil ahora es visible en búsquedas' : '🔒 Tu perfil está oculto en búsquedas');
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
        toast.error(`${file.name} supera los 5MB`);
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

      toast.success(`✅ ${validFiles.length} foto(s) añadida(s)`);
    } catch (error) {
      console.error("Error uploading photos:", error);
      toast.error("Error al subir las fotos");
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
        toast.success("Foto eliminada");
      } catch (error) {
        console.error("Error removing photo:", error);
        toast.error("Error al eliminar la foto");
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

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const response = await base44.functions.invoke('deleteUser', {
        userId: user.id,
        isSelfDelete: true
      });
      
      if (response.data.ok) {
        toast.success('Tu cuenta ha sido eliminada correctamente', {
          duration: 5000
        });
        
        setTimeout(() => {
          base44.auth.logout();
        }, 2000);
      } else {
        toast.error(`Error: ${response.data.error}`);
        setIsDeleting(false);
      }
    } catch (error) {
      console.error('Error eliminando cuenta:', error);
      toast.error('Error al eliminar tu cuenta');
      setIsDeleting(false);
    }
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

  const isProfessional = profile || user?.user_type === "professionnel";
  const subscriptionStatus = getSubscriptionStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mi Perfil</h1>
            <p className="text-gray-600">
              {isProfessional ? "Gestiona tu perfil profesional" : "Gestiona tu información"}
            </p>
            {profile && (
              <div className="mt-2 flex gap-2">
                {subscriptionStatus?.isActive ? (
                  <Badge className="bg-green-100 text-green-800">
                    ✓ Visible para clientes
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800">
                    ⚠ Perfil oculto
                  </Badge>
                )}
              </div>
            )}
          </div>
          {!isEditing ? (
            <div className="flex gap-2">
              <Button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700">
                Editar Perfil
              </Button>
              {!isProfessional && (
                <Button 
                  onClick={() => navigate(createPageUrl("PricingPlans"))} 
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Hazte Autónomo
                </Button>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => {
                setIsEditing(false);
                queryClient.invalidateQueries({ queryKey: ['myProfile'] });
              }}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSave}
                disabled={updateUserMutation.isPending || updateProfileMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar cambios
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
              ✅ Tu perfil se ha actualizado correctamente.
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
                    <h3 className="font-bold text-lg text-gray-900">¿Quieres ofrecer tus servicios?</h3>
                    <p className="text-sm text-gray-600">
                      Conviértete en autónomo y aparece en las búsquedas de clientes
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => navigate(createPageUrl("PricingPlans"))}
                  className="bg-orange-500 hover:bg-orange-600 flex-shrink-0"
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Ver Planes
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
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3 bg-white shadow-md">
            <TabsTrigger value="personal" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <User className="w-4 h-4 mr-2" />
              Información Personal
            </TabsTrigger>
            {isProfessional && (
              <>
                <TabsTrigger value="business" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <Building2 className="w-4 h-4 mr-2" />
                  Perfil Profesional
                </TabsTrigger>
                <TabsTrigger value="portfolio" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <Camera className="w-4 h-4 mr-2" />
                  Portfolio
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="personal">
            <Card className="shadow-sm border-0 bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-700" />
                  Información personal
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
                  <Label>Email</Label>
                  <Input value={user.email} disabled className="bg-gray-50" />
                </div>

                <div>
                  <Label>Nombre completo</Label>
                  <Input
                    value={userData.full_name || ""}
                    onChange={(e) => setUserData({ ...userData, full_name: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Teléfono</Label>
                    <Input
                      value={userData.phone || ""}
                      onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                      disabled={!isEditing}
                      placeholder="+34 612 345 678"
                    />
                  </div>
                  <div>
                    <Label>Ciudad</Label>
                    <Select
                      value={userData.city || ""}
                      onValueChange={(value) => setUserData({ ...userData, city: value })}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona ciudad" />
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
                  <Label>Tipo de cuenta</Label>
                  <Badge className="bg-blue-100 text-blue-900">
                    {isProfessional ? "Autónomo" : "Cliente"}
                  </Badge>
                </div>

                {isProfessional && profile && !loadingProfile && subscriptionStatus?.isActive && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Label className="text-base font-semibold text-gray-900 mb-1 block">
                          Visibilidad del perfil
                        </Label>
                        <p className="text-sm text-gray-600">
                          {profile.visible_en_busqueda 
                            ? "Tu perfil aparece en las búsquedas públicas" 
                            : "Tu perfil está oculto y no aparece en búsquedas"}
                        </p>
                      </div>
                      <Switch
                        checked={profile.visible_en_busqueda}
                        onCheckedChange={(checked) => toggleVisibilityMutation.mutate(checked)}
                        disabled={toggleVisibilityMutation.isPending}
                        className="data-[state=checked]:bg-green-600"
                      />
                    </div>
                    {!profile.visible_en_busqueda && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-xs text-yellow-800 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Los clientes no podrán encontrarte hasta que actives la visibilidad
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {!isEditing && (
                  <div className="mt-8 pt-6 border-t border-red-200">
                    <h3 className="text-lg font-semibold text-red-800 mb-3">⚠️ Zona de peligro</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Esta acción eliminará permanentemente tu cuenta, perfil, mensajes, favoritos, reseñas y cancelará tu suscripción activa.
                    </p>
                    <Button
                      variant="destructive"
                      onClick={() => setShowDeleteDialog(true)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Eliminar mi cuenta
                    </Button>
                  </div>
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
                      Identidad Profesional
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Nombre profesional *</Label>
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
                          NIF/CIF
                        </Label>
                        <Input
                          value={profileData.cif_nif}
                          onChange={(e) => setProfileData({ ...profileData, cif_nif: e.target.value.toUpperCase() })}
                          disabled={!isEditing}
                          placeholder="12345678A"
                          maxLength={9}
                        />
                      </div>
                      <div>
                        <Label className="flex items-center gap-2">
                          {profileData.years_experience ? <CheckCircle className="w-4 h-4 text-green-600" /> : null}
                          Años de experiencia
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
                        Email de contacto
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
                        Teléfono de contacto
                      </Label>
                      <Input
                        value={profileData.telefono_contacto}
                        onChange={(e) => setProfileData({ ...profileData, telefono_contacto: e.target.value })}
                        disabled={!isEditing}
                        placeholder="+34 612 345 678"
                      />
                    </div>


                  </CardContent>
                </Card>

                <Card className="shadow-sm border-0 bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Servicios y Descripción</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Categoría de servicio (elige solo una)</Label>
                      {!isEditing ? (
                        <div className="mt-2 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <Badge className="bg-blue-100 text-blue-900 text-sm">
                            {profileData.categories[0] || "Sin categoría"}
                          </Badge>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-2 mt-2">
                          {categories.map((cat) => (
                            <div
                              key={cat}
                              onClick={() => selectCategory(cat)}
                              className={`flex items-center gap-2 p-3 border-2 rounded-lg transition-all cursor-pointer ${
                                profileData.categories.includes(cat)
                                  ? "border-blue-600 bg-blue-50"
                                  : "border-gray-200 hover:bg-gray-50"
                              }`}
                            >
                              {profileData.categories.includes(cat) ? (
                                <CheckCircle className="w-5 h-5 text-blue-600" />
                              ) : (
                                <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                              )}
                              <span className="text-sm">{cat}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {profileData.categories.includes("Otro tipo de servicio profesional") && (
                      <div>
                        <Label>Especifica tu servicio</Label>
                        <Input
                          value={profileData.activity_other}
                          onChange={(e) => setProfileData({ ...profileData, activity_other: e.target.value })}
                          disabled={!isEditing}
                          placeholder="Instalador de paneles solares..."
                        />
                      </div>
                    )}

                    <div>
                      <Label>Descripción de tus servicios</Label>
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
                      Ubicación
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="flex items-center gap-2">
                          {profileData.provincia ? <CheckCircle className="w-4 h-4 text-green-600" /> : null}
                          Provincia
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
                            <SelectValue placeholder="Selecciona provincia" />
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
                          Ciudad
                        </Label>
                        <Select
                          value={profileData.ciudad}
                          onValueChange={(value) => setProfileData({ ...profileData, ciudad: value })}
                          disabled={!isEditing || !profileData.provincia}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={profileData.provincia ? "Selecciona ciudad" : "Primero elige provincia"} />
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
                      Tarifas y Pagos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="flex items-center gap-2">
                        {profileData.tarifa_base ? <CheckCircle className="w-4 h-4 text-green-600" /> : null}
                        Tarifa base (€/hora) - opcional
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
                        Formas de pago aceptadas
                      </Label>
                      {!isEditing ? (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {profileData.formas_pago.map((forma) => (
                            <Badge key={forma} className="bg-purple-100 text-purple-900 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              {forma}
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
                              <span className="text-sm">{forma}</span>
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
            <TabsContent value="portfolio">
              <div className="space-y-6">
                <Card className="shadow-sm border-0 bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Camera className="w-5 h-5 text-blue-700" />
                      Portfolio ({profileData.photos.length}/10)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">

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
                            <p className="text-sm text-gray-600">Haz clic para añadir fotos ({profileData.photos.length}/10)</p>
                            <p className="text-xs text-gray-500 mt-1">Puedes seleccionar varias a la vez</p>
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
                          alt={`Foto ${idx + 1}`}
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
                            Principal
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
                    Redes Sociales
                  </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="flex items-center gap-2 text-xs text-gray-600">
                        {profileData.website ? <CheckCircle className="w-3 h-3 text-green-600" /> : <div className="w-3 h-3" />}
                        Sitio web
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
        </Tabs>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                ¿Eliminar tu cuenta definitivamente?
              </AlertDialogTitle>
              <AlertDialogDescription>
                <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4">
                  <p className="text-sm font-semibold text-red-800">
                    ⚠️ ATENCIÓN: Esta acción es IRREVERSIBLE
                  </p>
                </div>

                <div className="space-y-2 text-sm text-gray-700">
                  <p className="font-semibold">Se eliminará permanentemente:</p>
                  <ul className="list-disc ml-5 space-y-1">
                    <li>Tu cuenta y perfil completo</li>
                    <li>Todos tus mensajes y conversaciones</li>
                    <li>Tus favoritos y reseñas</li>
                    {isProfessional && (
                      <>
                        <li>Tu perfil profesional y fotos</li>
                        <li>Tu suscripción activa</li>
                      </>
                    )}
                  </ul>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Sí, eliminar definitivamente
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
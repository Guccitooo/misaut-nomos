import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ProfessionalDashboard from "../components/dashboard/ProfessionalDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "../components/ui/LanguageSwitcher";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Building2, Save, Plus, X, Upload, Loader2, CheckCircle, CreditCard, Briefcase, MapPin, Clock, Euro, AlertCircle, Globe, Facebook, Instagram, Linkedin, Camera, Award, BarChart3 } from "lucide-react";
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
import { toast } from "sonner";
import ProfilePictureUpload from "../components/profile/ProfilePictureUpload";
import ProfileCompleteness from "../components/profile/ProfileCompleteness";
import PremiumDashboard from "../components/premium/PremiumDashboard";

const isSubscriptionActive = (estado, fechaExpiracion) => {
  if (!estado) {
    console.log('⚠️ Sin estado de suscripción');
    return false;
  }
  
  const normalizedState = estado.toLowerCase().trim();
  const validStates = ["activo", "active", "en_prueba", "trialing", "trial_active", "actif"];
  
  console.log('🔍 Verificando estado suscripción:', {
    estado: normalizedState,
    fecha_expiracion: fechaExpiracion,
    es_estado_valido: validStates.includes(normalizedState)
  });
  
  if (validStates.includes(normalizedState)) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiration = new Date(fechaExpiracion);
      expiration.setHours(0, 0, 0, 0);
      
      if (isNaN(expiration.getTime())) {
        console.log('⚠️ Fecha de expiración inválida - asumiendo activo');
        return true;
      }
      
      const isActive = expiration >= today;
      console.log(`${isActive ? '✅' : '❌'} Suscripción ${isActive ? 'ACTIVA' : 'EXPIRADA'}`);
      return isActive;
    } catch (error) {
      console.log('⚠️ Error verificando fecha - asumiendo activo');
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
      const stillActive = expiration >= today;
      console.log(`${stillActive ? '⚪' : '🔴'} Suscripción cancelada - ${stillActive ? 'aún vigente' : 'expirada'}`);
      return stillActive;
    } catch (error) {
      return false;
    }
  }
  
  console.log('❌ Estado no reconocido:', normalizedState);
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

const categories = [
  "Albañil / Reformas", "Autónomo de limpieza", "Carpintero", "Cerrajero",
  "Electricista", "Fontanero", "Instalador de aire acondicionado",
  "Jardinero", "Mantenimiento de piscinas", "Mantenimiento general",
  "Pintor", "Transportista", "Otro tipo de servicio profesional"
];

export default function MyProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const reactivationSuccess = searchParams.get("reactivation");
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
    if (onboardingCompleted) {
      console.log('🎉 Onboarding completado - forzando recarga completa');
      
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Force complete reload
      setTimeout(async () => {
        await loadUser();
        queryClient.invalidateQueries();
        
        toast.success('¡Perfil profesional activado! Ya eres visible para clientes', {
          duration: 8000
        });
      }, 500);
    } else if (reactivationSuccess === "canceled") {
      toast.info(t('areYouSureContinue'));
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [reactivationSuccess, onboardingCompleted, queryClient, t]);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      console.log('👤 Usuario cargado:', {
        email: currentUser.email,
        user_type: currentUser.user_type,
        onboarding_completed: currentUser.professional_onboarding_completed
      });
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
      
      console.log('🔍 Suscripciones encontradas:', subs);
      
      if (subs.length > 0) {
        const sub = subs[0];
        console.log('✅ Suscripción cargada:', {
          estado: sub.estado,
          fecha_expiracion: sub.fecha_expiracion,
          isActive: isSubscriptionActive(sub.estado, sub.fecha_expiracion)
        });
        return sub;
      }
      
      console.log('⚠️ No se encontró suscripción para el usuario');
      return null;
    },
    enabled: !!user,
    retry: 2,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['myProfile', user?.id],
    queryFn: async () => {
      const profiles = await base44.entities.ProfessionalProfile.filter({
        user_id: user.id
      });
      
      if (profiles[0]) {
        setProfileData({
          business_name: profiles[0].business_name || "",
          cif_nif: profiles[0].cif_nif || "",
          email_contacto: profiles[0].email_contacto || user.email,
          telefono_contacto: profiles[0].telefono_contacto || user.phone || "",
          description: profiles[0].description || "",
          descripcion_corta: profiles[0].descripcion_corta || "",
          categories: profiles[0].categories || [],
          provincia: profiles[0].provincia || "",
          ciudad: profiles[0].ciudad || "",
          municipio: profiles[0].municipio || "",
          service_area: profiles[0].service_area || "",
          radio_servicio_km: profiles[0].radio_servicio_km || 10,
          disponibilidad_tipo: profiles[0].disponibilidad_tipo || "laborables",
          horario_apertura: profiles[0].horario_apertura || "09:00",
          horario_cierre: profiles[0].horario_cierre || "18:00",
          website: profiles[0].website || "",
          price_range: profiles[0].price_range || "€€",
          tarifa_base: profiles[0].tarifa_base || "",
          facturacion: profiles[0].facturacion || "autonomo",
          formas_pago: profiles[0].formas_pago || [],
          photos: profiles[0].photos || [],
          social_links: profiles[0].social_links || {
            facebook: "",
            instagram: "",
            linkedin: "",
            tiktok: ""
          },
          activity_other: profiles[0].activity_other || "",
          metodos_contacto: profiles[0].metodos_contacto || ['chat_interno'],
          years_experience: profiles[0].years_experience || "",
          certifications: profiles[0].certifications || [],
        });
      }
      return profiles[0];
    },
    enabled: !!user,
  });

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
        text: t('trial'),
        badge: "🟡",
        color: "bg-blue-100 text-blue-800 border border-blue-300",
        details: isActive ? `${daysLeft} ${t('daysRemainingTrial')}` : t('finished'),
        isActive: isActive,
        showUpgrade: true,
        showReactivate: false
      };
    }
    
    if (normalizedState === "activo" || normalizedState === "active" || normalizedState === "actif") {
      return {
        text: t('active'),
        badge: "🟢",
        color: "bg-green-100 text-green-800 border border-green-300",
        details: `${t('renewalExpiration')}: ${expirationDate.toLocaleDateString()}`,
        isActive: true,
        showUpgrade: false,
        showReactivate: false
      };
    }
    
    if (normalizedState === "cancelado" || normalizedState === "canceled") {
      return {
        text: isActive ? t('canceled') : t('finished'),
        badge: isActive ? "⚪" : "🔴",
        color: isActive 
          ? "bg-yellow-100 text-yellow-800 border border-yellow-300" 
          : "bg-red-100 text-red-800 border border-red-300",
        details: isActive 
          ? `${t('subscriptionCanceledActive')} ${expirationDate.toLocaleDateString()}`
          : t('profileHidden'),
        isActive: isActive,
        showUpgrade: false,
        showReactivate: true
      };
    }
    
    return {
      text: isActive ? t('active') : t('finished'),
      badge: isActive ? "🟢" : "🔴",
      color: isActive 
        ? "bg-green-100 text-green-800 border border-green-300"
        : "bg-red-100 text-red-800 border border-red-300",
      details: isActive ? `${t('renewalExpiration')}: ${expirationDate.toLocaleDateString()}` : t('considerReactivating'),
      isActive: isActive,
      showUpgrade: false,
      showReactivate: !isActive
    };
  };

  const updateUserMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      toast.success(t('profileUpdatedSuccess'));
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      if (profile) {
        return await base44.entities.ProfessionalProfile.update(profile.id, data);
      } else {
        return await base44.entities.ProfessionalProfile.create({
          ...data,
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
      toast.success(t('profileUpdatedSuccess'));
      setTimeout(() => setSuccess(false), 3000);
    },
  });

  const handleSave = () => {
    console.log('💾 Guardando datos de usuario:', userData);
    updateUserMutation.mutate(userData);
    
    if (profile || profileData.business_name) {
      console.log('💾 Guardando datos de perfil profesional:', profileData);
      updateProfileMutation.mutate(profileData);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('photoUploadError'));
      return;
    }

    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProfileData({
        ...profileData,
        photos: [...(profileData.photos || []), file_url]
      });
      toast.success(t('photoUploadSuccess'));
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error(t('photoUploadError'));
    }
    setUploadingPhoto(false);
  };

  const removePhoto = (index) => {
    const newPhotos = [...profileData.photos];
    newPhotos.splice(index, 1);
    setProfileData({ ...profileData, photos: newPhotos });
  };

  const toggleCategory = (category) => {
    const categories = profileData.categories;
    if (categories.includes(category)) {
      setProfileData({
        ...profileData,
        categories: categories.filter(c => c !== category)
      });
    } else {
      setProfileData({
        ...profileData,
        categories: [...categories, category]
      });
    }
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
        toast.success(t('accountDeleted'), {
          duration: 5000
        });
        
        setTimeout(() => {
          base44.auth.logout();
        }, 2000);
      } else {
        toast.error(`${t('errorDeletingAccount')}: ${response.data.error}`);
        setIsDeleting(false);
      }
    } catch (error) {
      console.error('Error eliminando cuenta:', error);
      toast.error(t('errorDeletingAccount'));
      setIsDeleting(false);
    }
  };

  if (!user || loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
      </div>
    );
  }

  const isProfessional = profile || user?.user_type === "professionnel";
  const subscriptionStatus = getSubscriptionStatus();
  
  console.log('🔍 Estado actual MyProfile:', {
    user_type: user.user_type,
    has_profile: !!profile,
    subscription_status: subscriptionStatus,
    is_professional: isProfessional
  });
  
  // Redirect to onboarding if professional but no completed profile
  if (user.user_type === 'professionnel' && (!profile || !profile.onboarding_completed)) {
    console.log('⚠️ Profesional sin onboarding completado - redirigiendo');
    navigate(createPageUrl("ProfileOnboarding"), { replace: true });
    return null;
  }
  
  // Redirect to onboarding if professional_pending
  if (user.user_type === 'professional_pending') {
    console.log('⚠️ Usuario en estado professional_pending - redirigiendo a onboarding');
    navigate(createPageUrl("ProfileOnboarding"), { replace: true });
    return null;
  }
  
  // Show dashboard for professionals who just completed onboarding
  const onboardingJustCompleted = searchParams.get('onboarding') === 'completed';
  if (user.user_type === 'professionnel' && onboardingJustCompleted) {
    console.log('✅ Mostrando dashboard profesional - onboarding recién completado');
    return <ProfessionalDashboard user={user} onboardingCompleted={true} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('myProfileTitle')}</h1>
            <p className="text-gray-600">
              {isProfessional ? t('manageProfessionalProfile') : t('manageYourInfo')}
            </p>
            {profile && (
              <div className="mt-2 flex gap-2">
                {subscriptionStatus?.isActive ? (
                  <Badge className="bg-green-100 text-green-800">
                    ✓ {t('visibleToClients')}
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800">
                    ⚠ {t('profileHidden')}
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
                  {t('becomeProfessional')}
                </Button>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => {
                setIsEditing(false);
                queryClient.invalidateQueries({ queryKey: ['myProfile'] });
              }}>
                {t('cancelEdit')}
              </Button>
              <Button 
                onClick={handleSave}
                disabled={updateUserMutation.isPending || updateProfileMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('savingChanges')}
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
              ✅ {t('profileUpdatedSuccess')}
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
                    <h3 className="font-bold text-lg text-gray-900">{t('wantToOfferServices')}</h3>
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
                  {t('viewPlansButton')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isProfessional && profile && !isEditing && (
          <div className="mb-6">
            <PremiumDashboard 
              metrics={metrics}
              subscription={subscription}
              profile={profile}
            />
          </div>
        )}

        {isProfessional && profile && !isEditing && (
          <ProfileCompleteness 
            profile={profile} 
            user={user}
            onEdit={() => setIsEditing(true)}
          />
        )}

        <Tabs defaultValue={isProfessional ? "business" : "personal"} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3 bg-white shadow-md">
            <TabsTrigger value="personal" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <User className="w-4 h-4 mr-2" />
              {t('personalInfo')}
            </TabsTrigger>
            {isProfessional && (
              <>
                <TabsTrigger value="business" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <Building2 className="w-4 h-4 mr-2" />
                  {t('professionalProfile')}
                </TabsTrigger>
                <TabsTrigger value="portfolio" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <Camera className="w-4 h-4 mr-2" />
                  {t('portfolio')}
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="personal">
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-700" />
                  {t('personalInfoSection')}
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
                    value={userData.full_name}
                    onChange={(e) => setUserData({ ...userData, full_name: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>{t('phoneLabel')}</Label>
                    <Input
                      value={userData.phone}
                      onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                      disabled={!isEditing}
                      placeholder="+34 612 345 678"
                    />
                  </div>
                  <div>
                    <Label>{t('cityLabel')}</Label>
                    <Input
                      value={userData.city}
                      onChange={(e) => setUserData({ ...userData, city: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Madrid"
                    />
                  </div>
                </div>

                <div>
                  <Label>{t('accountType')}</Label>
                  <Badge className="bg-blue-100 text-blue-900">
                    {isProfessional ? t('professionalAccount') : t('clientAccount')}
                  </Badge>
                </div>

                {!isEditing && (
                  <div className="mt-8 pt-6 border-t border-red-200">
                    <h3 className="text-lg font-semibold text-red-800 mb-3">⚠️ {t('dangerZone')}</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {t('dangerZoneDescription')}
                    </p>
                    <Button
                      variant="destructive"
                      onClick={() => setShowDeleteDialog(true)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      {t('deleteMyAccount')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {isProfessional && (
            <TabsContent value="business">
              <div className="space-y-6">
                <Card className="shadow-lg border-0 bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
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
                        placeholder={t('professionalNamePlaceholder2')}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>{t('taxIdLabel')}</Label>
                        <Input
                          value={profileData.cif_nif}
                          onChange={(e) => setProfileData({ ...profileData, cif_nif: e.target.value.toUpperCase() })}
                          disabled={!isEditing}
                          placeholder={t('taxIdPlaceholder')}
                          maxLength={9}
                        />
                      </div>
                      <div>
                        <Label>{t('yearsExperience')}</Label>
                        <Input
                          type="number"
                          value={profileData.years_experience}
                          onChange={(e) => setProfileData({ ...profileData, years_experience: e.target.value })}
                          disabled={!isEditing}
                          placeholder={t('yearsPlaceholder')}
                          min="0"
                          max="50"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>{t('contactEmailLabel2')}</Label>
                      <Input
                        type="email"
                        value={profileData.email_contacto}
                        onChange={(e) => setProfileData({ ...profileData, email_contacto: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>

                    <div>
                      <Label>{t('contactPhoneLabel')}</Label>
                      <Input
                        value={profileData.telefono_contacto}
                        onChange={(e) => setProfileData({ ...profileData, telefono_contacto: e.target.value })}
                        disabled={!isEditing}
                        placeholder="+34 612 345 678"
                      />
                    </div>

                    <div>
                      <Label>{t('certificationsLabel')}</Label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          value={newCertification}
                          onChange={(e) => setNewCertification(e.target.value)}
                          disabled={!isEditing}
                          placeholder={t('certificationPlaceholder')}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addCertification();
                            }
                          }}
                        />
                        <Button
                          onClick={addCertification}
                          disabled={!isEditing || !newCertification}
                          size="icon"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(profileData.certifications || []).map((cert, idx) => (
                          <Badge key={idx} className="bg-purple-100 text-purple-900 flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            {cert}
                            {isEditing && (
                              <button onClick={() => removeCertification(cert)}>
                                <X className="w-3 h-3 ml-1" />
                              </button>
                            )}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-0 bg-white">
                  <CardHeader>
                    <CardTitle>{t('servicesDescription')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>{t('serviceCategoriesLabel')}</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {categories.map((cat) => (
                          <div
                            key={cat}
                            onClick={() => isEditing && toggleCategory(cat)}
                            className={`flex items-center gap-2 p-3 border-2 rounded-lg transition-all ${
                              isEditing ? 'cursor-pointer' : 'cursor-default'
                            } ${
                              profileData.categories.includes(cat)
                                ? "border-blue-600 bg-blue-50"
                                : "border-gray-200"
                            }`}
                          >
                            <Checkbox
                              checked={profileData.categories.includes(cat)}
                              disabled={!isEditing}
                              className="pointer-events-none"
                            />
                            <span className="text-sm">{t(cat)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {profileData.categories.includes("Otro tipo de servicio profesional") && (
                      <div>
                        <Label>{t('specifyService')}</Label>
                        <Input
                          value={profileData.activity_other}
                          onChange={(e) => setProfileData({ ...profileData, activity_other: e.target.value })}
                          disabled={!isEditing}
                          placeholder={t('specifyServicePlaceholder2')}
                        />
                      </div>
                    )}

                    <div>
                      <Label>{t('shortDescriptionLimit')}</Label>
                      <Textarea
                        value={profileData.descripcion_corta}
                        onChange={(e) => setProfileData({ ...profileData, descripcion_corta: e.target.value.slice(0, 220) })}
                        disabled={!isEditing}
                        className="h-24"
                        placeholder={t('shortDescPlaceholder')}
                      />
                      <p className="text-xs text-gray-500 mt-1">{profileData.descripcion_corta.length}/220</p>
                    </div>

                    <div>
                      <Label>{t('detailedDescriptionSEO')}</Label>
                      <Textarea
                        value={profileData.description}
                        onChange={(e) => setProfileData({ ...profileData, description: e.target.value })}
                        disabled={!isEditing}
                        className="h-40"
                        placeholder={t('detailedDescPlaceholder')}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-0 bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-700" />
                      {t('locationAvailability')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>{t('provinceLabel')}</Label>
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
                        <Label>{t('cityLabel2')}</Label>
                        <Input
                          value={profileData.ciudad}
                          onChange={(e) => setProfileData({ ...profileData, ciudad: e.target.value })}
                          disabled={!isEditing}
                          placeholder={t('cityPlaceholder')}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>{t('neighborhoodLabel')}</Label>
                      <Input
                        value={profileData.municipio}
                        onChange={(e) => setProfileData({ ...profileData, municipio: e.target.value })}
                        disabled={!isEditing}
                        placeholder={t('neighborhoodPlaceholder2')}
                      />
                    </div>

                    <div>
                      <Label>{t('serviceRadiusLabel')}</Label>
                      <Select
                        value={profileData.radio_servicio_km?.toString()}
                        onValueChange={(value) => setProfileData({ ...profileData, radio_servicio_km: parseInt(value) })}
                        disabled={!isEditing}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">{t('serviceRadius5')}</SelectItem>
                          <SelectItem value="10">{t('serviceRadius10')}</SelectItem>
                          <SelectItem value="25">{t('serviceRadius25')}</SelectItem>
                          <SelectItem value="50">{t('serviceRadius50')}</SelectItem>
                          <SelectItem value="100">{t('serviceRadius100')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div>
                      <Label className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {t('availabilityLabel')}
                      </Label>
                      <Select
                        value={profileData.disponibilidad_tipo}
                        onValueChange={(value) => setProfileData({ ...profileData, disponibilidad_tipo: value })}
                        disabled={!isEditing}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="laborables">{t('availabilityWeekdays')}</SelectItem>
                          <SelectItem value="festivos">{t('availabilityWeekends')}</SelectItem>
                          <SelectItem value="ambos">{t('availabilityAllWeek')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{t('startTimeLabel')}</Label>
                        <Input
                          type="time"
                          value={profileData.horario_apertura}
                          onChange={(e) => setProfileData({ ...profileData, horario_apertura: e.target.value })}
                          disabled={!isEditing}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label>{t('endTimeLabel')}</Label>
                        <Input
                          type="time"
                          value={profileData.horario_cierre}
                          onChange={(e) => setProfileData({ ...profileData, horario_cierre: e.target.value })}
                          disabled={!isEditing}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-0 bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Euro className="w-5 h-5 text-blue-700" />
                      {t('ratesWorkMethod')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>{t('baseRateHourly')}</Label>
                      <Input
                        type="number"
                        value={profileData.tarifa_base}
                        onChange={(e) => setProfileData({ ...profileData, tarifa_base: e.target.value })}
                        disabled={!isEditing}
                        placeholder={t('baseRatePlaceholder2')}
                        min="0"
                      />
                    </div>

                    <div>
                      <Label>{t('businessTypeLabel')}</Label>
                      <Select
                        value={profileData.facturacion}
                        onValueChange={(value) => setProfileData({ ...profileData, facturacion: value })}
                        disabled={!isEditing}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="autonomo">{t('selfEmployed')}</SelectItem>
                          <SelectItem value="sociedad">{t('limitedCompany')}</SelectItem>
                          <SelectItem value="otros">{t('others')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>{t('acceptedPaymentMethodsLabel')}</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {[
                          { key: "Tarjeta", label: t('cardPayment') },
                          { key: "Transferencia", label: t('bankTransfer') },
                          { key: "Efectivo", label: t('cashPayment') },
                          { key: "Bizum", label: t('bizumPayment') }
                        ].map((forma) => (
                          <div
                            key={forma.key}
                            onClick={() => isEditing && toggleFormaPago(forma.key)}
                            className={`flex items-center gap-2 p-3 border-2 rounded-lg transition-all ${
                              isEditing ? 'cursor-pointer' : 'cursor-default'
                            } ${
                              profileData.formas_pago.includes(forma.key)
                                ? "border-purple-600 bg-purple-50"
                                : "border-gray-200"
                            }`}
                          >
                            <Checkbox
                              checked={profileData.formas_pago.includes(forma.key)}
                              disabled={!isEditing}
                              className="pointer-events-none"
                            />
                            <span className="text-sm">{forma.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-0 bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-blue-700" />
                      {t('onlinePresence')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        {t('websiteLabel')}
                      </Label>
                      <Input
                        value={profileData.website}
                        onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                        disabled={!isEditing}
                        placeholder={t('websitePlaceholder')}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="flex items-center gap-2">
                          <Facebook className="w-4 h-4" />
                          {t('facebookLabel')}
                        </Label>
                        <Input
                          value={profileData.social_links.facebook}
                          onChange={(e) => setProfileData({ 
                            ...profileData, 
                            social_links: { ...profileData.social_links, facebook: e.target.value }
                          })}
                          disabled={!isEditing}
                          placeholder={t('facebookPlaceholder')}
                        />
                      </div>

                      <div>
                        <Label className="flex items-center gap-2">
                          <Instagram className="w-4 h-4" />
                          {t('instagramLabel')}
                        </Label>
                        <Input
                          value={profileData.social_links.instagram}
                          onChange={(e) => setProfileData({ 
                            ...profileData, 
                            social_links: { ...profileData.social_links, instagram: e.target.value }
                          })}
                          disabled={!isEditing}
                          placeholder={t('instagramPlaceholder')}
                        />
                      </div>

                      <div>
                        <Label className="flex items-center gap-2">
                          <Linkedin className="w-4 h-4" />
                          {t('linkedinLabel')}
                        </Label>
                        <Input
                          value={profileData.social_links.linkedin}
                          onChange={(e) => setProfileData({ 
                            ...profileData, 
                            social_links: { ...profileData.social_links, linkedin: e.target.value }
                          })}
                          disabled={!isEditing}
                          placeholder={t('linkedinPlaceholder')}
                        />
                      </div>

                      <div>
                        <Label>{t('tiktokLabel')}</Label>
                        <Input
                          value={profileData.social_links.tiktok}
                          onChange={(e) => setProfileData({ 
                            ...profileData, 
                            social_links: { ...profileData.social_links, tiktok: e.target.value }
                          })}
                          disabled={!isEditing}
                          placeholder={t('tiktokPlaceholder')}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {isProfessional && (
            <TabsContent value="portfolio">
              <Card className="shadow-lg border-0 bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="w-5 h-5 text-blue-700" />
                    {t('workGalleryTitle')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">
                    {t('workGalleryDescription')}
                  </p>

                  {isEditing && profileData.photos.length < 10 && (
                    <label className="cursor-pointer block">
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handlePhotoUpload}
                          disabled={uploadingPhoto}
                        />
                        {uploadingPhoto ? (
                          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-700" />
                        ) : (
                          <>
                            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm text-gray-600">{t('clickToAddPhotoGallery', { count: profileData.photos.length })}</p>
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
                          alt={t('photoAlt', { number: idx + 1 })}
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
            </TabsContent>
          )}
        </Tabs>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                {t('deleteAccountTitle')}
              </AlertDialogTitle>
              <AlertDialogDescription>
                <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4">
                  <p className="text-sm font-semibold text-red-800">
                    ⚠️ {t('deleteAccountWarning')}
                  </p>
                </div>

                <div className="space-y-2 text-sm text-gray-700">
                  <p className="font-semibold">{t('willBeDeleted')}</p>
                  <ul className="list-disc ml-5 space-y-1">
                    <li>{t('yourAccountProfile')}</li>
                    <li>{t('allMessagesConversations')}</li>
                    <li>{t('favoritesReviews')}</li>
                    {isProfessional && (
                      <>
                        <li>{t('professionalProfilePhotos')}</li>
                        <li>{t('activeSubscription')}</li>
                      </>
                    )}
                  </ul>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                {t('cancelButton')}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('deletingAccount')}
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {t('yesDeletePermanently')}
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
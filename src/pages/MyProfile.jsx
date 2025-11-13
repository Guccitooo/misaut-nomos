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
import { User, Building2, Save, Plus, X, Upload, Loader2, CheckCircle, CreditCard, Briefcase, Calendar, TrendingUp, AlertCircle, RefreshCw } from "lucide-react";
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
      
      if (isNaN(expiration.getTime())) {
        return true;
      }
      
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
      
      if (isNaN(expiration.getTime())) {
        return false;
      }

      return expiration >= today;
    } catch (error) {
      return false;
    }
  }
  
  return false;
};

export default function MyProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [success, setSuccess] = useState(false);
  const [searchParams] = useSearchParams();
  const [forcingSync, setForcingSync] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [manualSyncing, setManualSyncing] = useState(false);
  const [isVerifyingSubscription, setIsVerifyingSubscription] = useState(false);
  const [pollingAttempts, setPollingAttempts] = useState(0);
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
    opening_hours: "",
    website: "",
    price_range: "€€",
    tarifa_base: null,
    facturacion: "autonomo",
    formas_pago: [],
    photos: [],
    social_links: {
      facebook: "",
      instagram: "",
      linkedin: ""
    },
    activity_other: "",
    metodos_contacto: ['chat_interno'],
  });

  const [newCategory, setNewCategory] = useState("");

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
    "Madrid": ["Madrid", "Alcalá de Henares", "Móstoles", "Fuenlabrada", "Leganés", "Getafe"],
    "Barcelona": ["Barcelona", "Badalona", "Terrassa", "Sabadell", "Mataró"],
    "Valencia": ["Valencia", "Gandía", "Torrent", "Paterna", "Sagunto"],
    "Sevilla": ["Sevilla", "Dos Hermanas", "Alcalá de Guadaíra", "Utrera"],
    "Málaga": ["Málaga", "Marbella", "Mijas", "Vélez-Málaga", "Fuengirola"],
  };

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
      setPollingAttempts(attempt);
      
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
          setPollingAttempts(0);
          
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
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    setIsVerifyingSubscription(false);
    setPollingAttempts(0);
    
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

  const handleManualSync = async () => {
    setManualSyncing(true);
    try {
      const currentUser = await loadUser();
      if (!currentUser) throw new Error("User not loaded for manual sync");
      
      const syncResponse = await base44.functions.invoke('syncStripeSubscription', {
        user_id: currentUser.id
      });
      
      if (syncResponse.data.ok) {
        toast.success('✅ ¡Suscripción encontrada y activada!', {
          duration: 5000
        });
        
        await loadUser();
        await queryClient.invalidateQueries({ queryKey: ['subscription'] });
        await queryClient.invalidateQueries({ queryKey: ['myProfile'] });
        await queryClient.refetchQueries({ queryKey: ['subscription'] });
        
        if (syncResponse.data.needs_onboarding) {
          setTimeout(() => {
            navigate(createPageUrl("ProfileOnboarding"));
          }, 2000);
        }
      } else {
        if (syncResponse.data.error === 'no_stripe_customer') {
          toast.error('No se encontró tu cuenta en Stripe. Asegúrate de haber completado el pago.');
        } else if (syncResponse.data.error === 'no_subscription') {
          toast.error('No se encontró ninguna suscripción activa. ¿Has contratado un plan?');
        } else {
          toast.error(`Error al verificar: ${syncResponse.data.message || syncResponse.data.error}`);
        }
      }
    } catch (error) {
      console.error('❌ Error en sincronización manual:', error);
      toast.error('Error al verificar suscripción manualmente');
    } finally {
      setManualSyncing(false);
    }
  };

  const handleForceSync = async () => {
    setForcingSync(true);
    try {
      await loadUser();
      await queryClient.invalidateQueries({ queryKey: ['subscription'] });
      await queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      await queryClient.invalidateQueries({ queryKey: ['plan'] });
      await new Promise(resolve => setTimeout(resolve, 1000));
      await queryClient.refetchQueries({ queryKey: ['subscription'] });
      
      toast.success('Datos sincronizados correctamente');
    } catch (error) {
      console.error('Error sincronizando:', error);
      toast.error('Error al sincronizar');
    } finally {
      setForcingSync(false);
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
          opening_hours: profiles[0].opening_hours || "",
          website: profiles[0].website || "",
          price_range: profiles[0].price_range || "€€",
          tarifa_base: profiles[0].tarifa_base !== undefined ? profiles[0].tarifa_base : null,
          facturacion: profiles[0].facturacion || "autonomo",
          formas_pago: profiles[0].formas_pago || [],
          photos: profiles[0].photos || [],
          social_links: profiles[0].social_links || {
            facebook: "",
            instagram: "",
            linkedin: ""
          },
          activity_other: profiles[0].activity_other || "",
          metodos_contacto: profiles[0].metodos_contacto || ['chat_interno'],
        });
      }
      return profiles[0];
    },
    enabled: !!user,
  });

  const updateUserMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      if (profile) {
        const result = await base44.entities.ProfessionalProfile.update(profile.id, {
          ...data,
          estado_perfil: "activo",
          visible_en_busqueda: true,
          onboarding_completed: true
        });
        return result;
      } else {
        const result = await base44.entities.ProfessionalProfile.create({
          ...data,
          user_id: user.id,
          estado_perfil: "activo",
          visible_en_busqueda: true,
          onboarding_completed: true
        });
        return result;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      setIsEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
  });

  const handleSave = () => {
    updateUserMutation.mutate(userData);
    
    if (profile || profileData.business_name) {
      updateProfileMutation.mutate(profileData);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProfileData({
        ...profileData,
        photos: [...(profileData.photos || []), file_url]
      });
    } catch (error) {
      console.error("Error uploading photo:", error);
    }
    setUploadingPhoto(false);
  };

  const removePhoto = (index) => {
    const newPhotos = [...profileData.photos];
    newPhotos.splice(index, 1);
    setProfileData({ ...profileData, photos: newPhotos });
  };

  const addCategory = () => {
    if (newCategory && !profileData.categories.includes(newCategory)) {
      setProfileData({
        ...profileData,
        categories: [...profileData.categories, newCategory]
      });
      setNewCategory("");
    }
  };

  const removeCategory = (category) => {
    setProfileData({
      ...profileData,
      categories: profileData.categories.filter(c => c !== category)
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

  if (!user || loadingProfile || (loadingSubscription && !isVerifyingSubscription && !user?.id)) {
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
                <p className="text-sm text-blue-900">
                  <strong>Intento {pollingAttempts}/{MAX_POLLING_ATTEMPTS}</strong>
                </p>
                <p className="text-xs text-blue-700 mt-2">
                  Esto puede tardar unos segundos mientras procesamos tu pago.
                  {pollingAttempts >= 5 && <><br />Si tarda mucho, estamos intentando una sincronización manual.</>}
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
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
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
                Editar
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
                    Guardar
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
              <div className="flex items-center justify-between">
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
                  className="bg-orange-500 hover:bg-orange-600"
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
            onEdit={() => setIsEditing(true)}
          />
        )}

        <Card className="mb-6 shadow-lg border-0 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-700" />
              Información personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center py-4">
              <ProfilePictureUpload
                user={user}
                currentPicture={user?.profile_picture}
                onUpdate={() => loadUser()}
                size="lg"
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input value={user.email} disabled className="bg-gray-50" />
            </div>

            <div>
              <Label>Nombre completo</Label>
              <Input
                value={userData.full_name}
                onChange={(e) => setUserData({ ...userData, full_name: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Teléfono</Label>
                <Input
                  value={userData.phone}
                  onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                  disabled={!isEditing}
                  placeholder="+34 612 345 678"
                />
              </div>
              <div>
                <Label>Ciudad</Label>
                <Input
                  value={userData.city}
                  onChange={(e) => setUserData({ ...userData, city: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Madrid"
                />
              </div>
            </div>

            <div>
              <Label>Tipo de cuenta</Label>
              <Badge className="bg-blue-100 text-blue-900">
                {isProfessional ? "Autónomo" : "Cliente"}
              </Badge>
            </div>

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

        {/* ✅ MODAL DE CONFIRMACIÓN DE ELIMINACIÓN - 100% OPACO */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="bg-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                ¿Eliminar tu cuenta definitivamente?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-700">
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
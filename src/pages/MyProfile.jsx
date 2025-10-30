
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

// ✅ HELPER: Verificar si suscripción está activa (fuente única de verdad)
const isSubscriptionActive = (estado, fechaExpiracion) => {
  if (!estado) return false;
  
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
      
      // Si la fecha de expiración no es válida (incluyendo null, undefined, o string no parseable)
      // y el estado es de un tipo "activo", asumir que está activo según la lógica de la integración
      if (isNaN(expiration.getTime())) {
          console.warn('Fecha de expiración inválida o ausente para un estado activo, asumiendo activo:', estado, 'Fecha:', fechaExpiracion);
          return true; // Si hay error parseando fecha, pero el estado es válido, asumir que está activo
      }
      
      return expiration >= today;
    } catch (error) {
      console.error('Error parseando fecha:', error);
      // Si hay error parseando fecha (ej: tipo de dato inesperado), pero el estado es válido, asumir que está activo
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
      
      // Si la fecha de expiración no es válida para un estado cancelado, se considera no activo
      if (isNaN(expiration.getTime())) {
          console.warn('Fecha de expiración inválida o ausente para estado cancelado:', fechaExpiracion);
          return false;
      }

      return expiration >= today;
    } catch (error) {
      console.error('Error parseando fecha:', error);
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

  // ✅ NUEVO: Estado para verificación de suscripción
  const [isVerifyingSubscription, setIsVerifyingSubscription] = useState(false);
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const MAX_POLLING_ATTEMPTS = 10; // 10 intentos = 20 segundos

  // Detectar diferentes estados de retorno
  const reactivationSuccess = searchParams.get("reactivation");
  const onboardingPending = searchParams.get("onboarding");
  const onboardingCompleted = searchParams.get("onboarding") === "completed";

  // User data
  const [userData, setUserData] = useState({
    full_name: "",
    phone: "",
    city: "",
  });

  // Professional profile data
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
    horario_dias: [],
    horario_apertura: "09:00",
    horario_cierre: "18:00",
    opening_hours: "",
    website: "",
    price_range: "€€",
    tarifa_base: 0,
    facturacion: "autonomo",
    formas_pago: [],
    photos: [],
    social_links: {
      facebook: "",
      instagram: "",
      linkedin: ""
    }
  });

  const [newCategory, setNewCategory] = useState("");

  // Provincias y ciudades
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
  ].sort();

  const ciudadesPorProvincia = {
    "Madrid": ["Madrid", "Alcalá de Henares", "Móstoles", "Fuenlabrada", "Leganés", "Getafe", "Alcorcón", "Torrejón de Ardoz", "Parla", "Alcobendas"],
    "Barcelona": ["Barcelona", "L'Hospitalet de Llobregat", "Badalona", "Terrassa", "Sabadell", "Mataró", "Santa Coloma de Gramenet", "Cornellà de Llobregat", "Sant Boi de Llobregat", "Rubí"],
    "Valencia": ["Valencia", "Gandía", "Torrent", "Paterna", "Sagunto", "Mislata", "Burjassot", "Alzira", "Sueca", "Xirivella"],
    "Sevilla": ["Sevilla", "Dos Hermanas", "Alcalá de Guadaíra", "Utrera", "Mairena del Aljarafe", "Écija", "Los Palacios y Villafranca", "La Rinconada", "Camas", "Morón de la Frontera"],
    "Málaga": ["Málaga", "Marbella", "Mijas", "Vélez-Málaga", "Fuengirola", "Torremolinos", "Estepona", "Benalmádena", "Rincón de la Victoria", "Antequera"],
    "Alicante": ["Alicante", "Elche", "Torrevieja", "Orihuela", "Benidorm", "Alcoy", "San Vicente del Raspeig", "Elda", "Dénia", "Villena"],
    "Zaragoza": ["Zaragoza", "Calatayud", "Utebo", "Ejea de los Caballeros", "Cuarte de Huerva", "Tarazona", "Caspe", "Zuera", "Alagón", "Borja"],
    "Murcia": ["Murcia", "Cartagena", "Lorca", "Molina de Segura", "Alcantarilla", "Mazarrón", "Cieza", "Yecla", "Águilas", "Torre-Pacheco"]
  };

  const diasSemana = [
    { value: "lunes", label: "Lunes" },
    { value: "martes", label: "Martes" },
    { value: "miercoles", label: "Miércoles" },
    { value: "jueves", label: "Jueves" },
    { value: "viernes", label: "Viernes" },
    { value: "sabado", label: "Sábado" },
    { value: "domingo", label: "Domingo" }
  ];

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

  // ✅ NUEVO: Detectar estados de retorno y verificar suscripción
  useEffect(() => {
    console.log('🔍 Verificando parámetros URL en useEffect:', {
      reactivation: reactivationSuccess,
      onboarding: onboardingPending,
      onboardingCompleted
    });

    if (reactivationSuccess === "success" || onboardingPending === "pending") {
      console.log('🔍 Usuario viene de checkout/reactivación, verificando suscripción...');
      setIsVerifyingSubscription(true);
      startSubscriptionPolling();
      // Clear search params immediately to prevent re-triggering
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (onboardingCompleted) {
      toast.success('🎉 ¡Enhorabuena! Tu perfil está publicado y visible para clientes.', {
        duration: 8000
      });
      
      window.history.replaceState({}, document.title, window.location.pathname);
      
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    } else if (reactivationSuccess === "canceled") { // Handle canceled reactivation
      toast.info("Reactivación cancelada. Puedes intentarlo de nuevo cuando quieras.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [reactivationSuccess, onboardingPending, onboardingCompleted, queryClient, navigate]);

  // ✅ NUEVO: Polling mejorado con sincronización forzada
  const startSubscriptionPolling = async () => {
    console.log('🔄 Iniciando polling de suscripción...');
    
    // Clear search params if they are still present from a previous render
    // window.history.replaceState({}, document.title, window.location.pathname); // Moved to useEffect for immediate clear

    for (let attempt = 1; attempt <= MAX_POLLING_ATTEMPTS; attempt++) {
      setPollingAttempts(attempt);
      console.log(`🔍 Intento ${attempt}/${MAX_POLLING_ATTEMPTS} - Verificando suscripción...`);
      
      try {
        // Recargar usuario
        const currentUser = await loadUser();
        if (!currentUser) throw new Error("User not loaded during polling");
        
        // Invalidar y refetch la suscripción para obtener el estado más reciente
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
          console.log('✅ Suscripción encontrada y activa:', result.estado);
          setIsVerifyingSubscription(false);
          setPollingAttempts(0); // Reset attempts
          
          // Mostrar mensaje de éxito apropiado
          if (reactivationSuccess === "success") {
            toast.success("🎉 ¡Tu suscripción ha sido reactivada! Tu perfil ya es visible en búsquedas.", {
              duration: 6000
            });
          } else if (onboardingPending === "pending") {
            toast.success("✅ ¡Pago confirmado! Ahora completa tu perfil profesional.", {
              duration: 8000
            });
            
            // Redirigir a ProfileOnboarding
            setTimeout(() => {
              navigate(createPageUrl("ProfileOnboarding"));
            }, 2000);
          }
          
          // window.history.replaceState({}, document.title, window.location.pathname); // Moved to useEffect
          queryClient.invalidateQueries({ queryKey: ['myProfile'] });
          return; // Éxito, salir del polling
        }
        
        // ✅ NUEVO: A partir del intento 5, intentar sincronización forzada
        if (attempt === 5 && currentUser) { // Only attempt if user is loaded
          console.log('🔄 Intento 5: Ejecutando sincronización forzada...');
          try {
            const syncResponse = await base44.functions.invoke('syncStripeSubscription', {
              user_id: currentUser.id // Pass user ID to the function
            });
            console.log('📥 Respuesta de sincronización:', syncResponse.data);
            
            if (syncResponse.data.ok) {
              console.log('✅ Sincronización forzada exitosa');
              
              // Refrescar datos
              await loadUser(); // Reload user to get latest subscription_status
              await queryClient.invalidateQueries({ queryKey: ['subscription'] });
              await queryClient.refetchQueries({ queryKey: ['subscription'] });
              
              // Verificar si necesita onboarding
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
              // window.history.replaceState({}, document.title, window.location.pathname); // Moved to useEffect
              return; // Exit polling as subscription is active
            } else if (syncResponse.data.error === 'no_stripe_customer' || 
                       syncResponse.data.error === 'no_subscription') {
              console.log('⚠️ No se encontró suscripción en Stripe (después de forzar sync). Continuar polling.');
              // Continue polling, maybe it's just a timing issue or the subscription is not in the expected state yet
            } else {
              console.error('❌ Error desconocido en sincronización forzada:', syncResponse.data.error);
            }
          } catch (syncError) {
            console.error('❌ Error en sincronización forzada (invocación de función):', syncError);
            // Continue polling
          }
        }
        
        // Si no encontró suscripción o no está activa, esperar 2 segundos antes del siguiente intento
        if (attempt < MAX_POLLING_ATTEMPTS) {
          console.log('⏳ Suscripción no encontrada o no activa, esperando 2 segundos...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`❌ Error en intento ${attempt}:`, error);
        if (attempt < MAX_POLLING_ATTEMPTS) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    // Si llegamos aquí, no se encontró la suscripción después de todos los intentos
    console.log('⚠️ No se encontró suscripción después de todos los intentos');
    setIsVerifyingSubscription(false);
    setPollingAttempts(0); // Reset attempts
    
    toast.error(
      <div>
        <p className="font-semibold">No se pudo verificar tu suscripción</p>
        <p className="text-sm mt-1">Por favor, contacta con soporte: admin@milautonomos.com</p>
        <p className="text-xs mt-2">Incluye tu email en el mensaje para que podamos ayudarte.</p>
      </div>,
      {
        duration: 15000
      }
    );
  };

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      console.log('👤 Usuario cargado en MyProfile:', {
        id: currentUser.id,
        email: currentUser.email,
        subscription_status: currentUser.subscription_status,
        user_type: currentUser.user_type
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

  // ✅ NUEVA FUNCIÓN: Botón manual de sincronización
  const handleManualSync = async () => {
    setManualSyncing(true);
    try {
      console.log('🔄 Sincronización manual iniciada...');
      const currentUser = await loadUser();
      if (!currentUser) throw new Error("User not loaded for manual sync");
      
      const syncResponse = await base44.functions.invoke('syncStripeSubscription', {
        user_id: currentUser.id
      });
      console.log('📥 Respuesta de sincronización manual:', syncResponse.data);
      
      if (syncResponse.data.ok) {
        toast.success('✅ ¡Suscripción encontrada y activada!', {
          duration: 5000
        });
        
        await loadUser(); // Refresh user state
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

  // ✅ NUEVA FUNCIÓN: Forzar sincronización (para admin)
  const handleForceSync = async () => {
    setForcingSync(true);
    try {
      console.log('🔄 Forzando sincronización (admin)...');
      
      // Recargar usuario
      await loadUser();
      
      // Invalidar todas las queries
      await queryClient.invalidateQueries({ queryKey: ['subscription'] });
      await queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      await queryClient.invalidateQueries({ queryKey: ['plan'] });
      
      // Esperar un momento y refetch
      await new Promise(resolve => setTimeout(resolve, 1000));
      await queryClient.refetchQueries({ queryKey: ['subscription'] });
      
      toast.success('Datos sincronizados correctamente');
    } catch (error) {
      console.error('Error sincronizando (admin):', error);
      toast.error('Error al sincronizar');
    } finally {
      setForcingSync(false);
    }
  };

  const { data: subscription, isLoading: loadingSubscription, error: subscriptionError } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      console.log('🔍 [MyProfile] Buscando suscripción para user_id:', user.id);
      console.log('🔍 [MyProfile] Email del usuario:', user.email);
      
      try {
        const subs = await base44.entities.Subscription.filter({
          user_id: user.id
        });
        
        console.log('📦 [MyProfile] Suscripciones encontradas:', subs.length);
        
        if (subs.length > 0) {
          console.log('✅ [MyProfile] Suscripción encontrada:', {
            id: subs[0].id,
            estado: subs[0].estado,
            plan_nombre: subs[0].plan_nombre,
            fecha_expiracion: subs[0].fecha_expiracion,
            is_active: isSubscriptionActive(subs[0].estado, subs[0].fecha_expiracion)
          });
          return subs[0];
        } else {
          console.log('❌ [MyProfile] No se encontró suscripción para este user_id');
          // No hay fallback por email, la suscripción debe estar ligada al user_id
          return null;
        }
      } catch (error) {
        console.error('❌ [MyProfile] Error buscando suscripción:', error);
        throw error;
      }
    },
    enabled: !!user && !isVerifyingSubscription, // ✅ Deshabilitar durante el polling
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
    
    // ✅ USAR HELPER PARA DETERMINAR SI ESTÁ ACTIVO
    const isActive = isSubscriptionActive(subscription.estado, subscription.fecha_expiracion);
    
    console.log('📊 Estado de suscripción:', {
      estado: subscription.estado,
      daysLeft,
      isActive
    });
    
    // ✅ NORMALIZAR ESTADOS
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
    
    if (normalizedState === "finalizada" || normalizedState === "expired") {
      return {
        text: "Suscripción finalizada",
        badge: "🔴",
        color: "bg-red-100 text-red-800 border border-red-300",
        details: "Tu perfil está oculto de las búsquedas",
        isActive: false,
        showUpgrade: false,
        showReactivate: true
      };
    }
    
    // Estado desconocido, verificar por fecha
    return {
      text: subscription.estado,
      badge: isActive ? "🟡" : "🔴",
      color: isActive 
        ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
        : "bg-red-100 text-red-800 border border-red-300",
      details: isActive ? "Activo" : "Inactivo",
      isActive: isActive,
      showUpgrade: false,
      showReactivate: !isActive
    };
  };

  // ✅ CAMBIO CRÍTICO: Cargar perfil SIEMPRE que haya usuario, independiente de user_type
  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['myProfile', user?.id],
    queryFn: async () => {
      console.log("🔍 Buscando perfil para user_id:", user.id);
      
      const profiles = await base44.entities.ProfessionalProfile.filter({
        user_id: user.id
      });
      
      console.log("📦 Perfiles encontrados:", profiles.length);
      
      if (profiles[0]) {
        console.log("✅ Perfil encontrado:", profiles[0]);
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
          horario_dias: profiles[0].horario_dias || [],
          horario_apertura: profiles[0].horario_apertura || "09:00",
          horario_cierre: profiles[0].horario_cierre || "18:00",
          opening_hours: profiles[0].opening_hours || "",
          website: profiles[0].website || "",
          price_range: profiles[0].price_range || "€€",
          tarifa_base: profiles[0].tarifa_base || 0,
          facturacion: profiles[0].facturacion || "autonomo",
          formas_pago: profiles[0].formas_pago || [],
          photos: profiles[0].photos || [],
          social_links: profiles[0].social_links || {
            facebook: "",
            instagram: "",
            linkedin: ""
          }
        });
      } else {
        console.log("❌ No se encontró perfil profesional");
      }
      return profiles[0];
    },
    enabled: !!user, // ✅ Solo requiere que haya usuario
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
      console.log("💾 Guardando perfil...");
      console.log("📝 Datos a guardar:", data);
      
      if (profile) {
        console.log("🔄 Actualizando perfil existente ID:", profile.id);
        // ✅ IMPORTANTE: Mantener estado activo y visible
        const result = await base44.entities.ProfessionalProfile.update(profile.id, {
          ...data,
          estado_perfil: "activo",
          visible_en_busqueda: true,
          onboarding_completed: true
        });
        console.log("✅ Perfil actualizado correctamente");
        return result;
      } else {
        console.log("➕ Creando nuevo perfil");
        const result = await base44.entities.ProfessionalProfile.create({
          ...data,
          user_id: user.id,
          estado_perfil: "activo",
          visible_en_busqueda: true,
          onboarding_completed: true
        });
        console.log("✅ Perfil creado correctamente");
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
    console.log("💾 Iniciando guardado...");
    updateUserMutation.mutate(userData);
    
    // ✅ Guardar perfil SIEMPRE si existe algún dato profesional
    if (profile || profileData.business_name) {
      console.log("💼 Guardando perfil profesional");
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

  const toggleDia = (dia) => {
    const dias = profileData.horario_dias;
    if (dias.includes(dia)) {
      setProfileData({
        ...profileData,
        horario_dias: dias.filter(d => d !== dia)
      });
    } else {
      setProfileData({
        ...profileData,
        horario_dias: [...dias, dia]
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

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      console.log('🗑️ Iniciando eliminación de cuenta...');
      
      const response = await base44.functions.invoke('deleteUser', {
        userId: user.id,
        isSelfDelete: true
      });
      
      if (response.data.ok) {
        toast.success('Tu cuenta ha sido eliminada correctamente', {
          duration: 5000
        });
        
        // Esperar 2 segundos y cerrar sesión
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

  // ✅ NUEVO: Mostrar loading mientras verifica suscripción
  if (!user || loadingProfile || (loadingSubscription && !isVerifyingSubscription && !user?.id)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
      </div>
    );
  }

  // ✅ NUEVO: Mostrar pantalla de verificación
  if (isVerifyingSubscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-xl">
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
              {pollingAttempts >= 5 && (
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800 text-sm">
                    El proceso está tardando más de lo esperado. Si el problema persiste, 
                    puedes recargar la página en unos segundos o contactar a soporte.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ Detectar si es profesional por tener perfil O por user_type
  const isProfessional = profile || user?.user_type === "professionnel";
  const subscriptionStatus = getSubscriptionStatus();

  // ✅ NUEVO: Detectar si necesita completar onboarding
  const needsOnboarding = isProfessional && subscription && !profile?.onboarding_completed;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* ✅ NUEVO: Banner de debug para admin */}
        {user.role === 'admin' && (
          <Alert className="mb-6 bg-purple-50 border-purple-200">
            <AlertCircle className="h-4 w-4 text-purple-600" />
            <AlertDescription className="text-purple-800 space-y-2">
              <div><strong>🔧 Debug Info (solo admin):</strong></div>
              <div className="text-xs font-mono space-y-1">
                <div>User ID: <code className="bg-purple-100 px-1 rounded">{user.id}</code></div>
                <div>Email: <code className="bg-purple-100 px-1 rounded">{user.email}</code></div>
                <div>Subscription Status (User): <code className="bg-purple-100 px-1 rounded">{user.subscription_status || 'null'}</code></div>
                <div>Subscription Found: <code className="bg-purple-100 px-1 rounded">{subscription ? 'YES' : 'NO'}</code></div>
                {subscription && (
                  <>
                    <div>Subscription ID: <code className="bg-purple-100 px-1 rounded">{subscription.id}</code></div>
                    <div>Subscription Estado: <code className="bg-purple-100 px-1 rounded">{subscription.estado}</code></div>
                    <div>Subscription User ID: <code className="bg-purple-100 px-1 rounded">{subscription.user_id}</code></div>
                  </>
                )}
                {!subscription && (
                  <div className="text-red-700 font-semibold mt-2">
                    ⚠️ NO SE ENCONTRÓ SUSCRIPCIÓN en la tabla Subscription para este user_id
                  </div>
                )}
              </div>
              <Button
                onClick={handleForceSync}
                disabled={forcingSync}
                size="sm"
                className="mt-2 bg-purple-600 hover:bg-purple-700"
              >
                {forcingSync ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Forzar sincronización
                  </>
                )}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* ✅ NUEVO: Banner de onboarding pendiente */}
        {needsOnboarding && (
          <Alert className="mb-6 bg-orange-50 border-orange-200">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>¡Completa tu perfil profesional!</strong> Tu suscripción está activa, pero necesitas completar el quiz para aparecer en las búsquedas.
              <Button 
                onClick={() => navigate(createPageUrl("ProfileOnboarding"))}
                className="mt-2 bg-orange-500 hover:bg-orange-600 w-full"
              >
                Completar perfil ahora
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mi Perfil</h1>
            <p className="text-gray-600">
              {isProfessional ? "Gestiona tu perfil profesional" : "Gestiona tu información"}
            </p>
            {profile && (
              <div className="mt-2 flex gap-2">
                {/* ✅ MEJORADO: Badge unificado basado en suscripción */}
                {subscriptionStatus?.isActive ? (
                  <Badge className="bg-green-100 text-green-800">
                    ✓ Visible en búsquedas
                  </Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-800">
                    ⚠ Oculto en búsquedas
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
              {!profile && (
                <Button onClick={() => navigate(createPageUrl("ProfileOnboarding"))} className="bg-orange-500 hover:bg-orange-600">
                  Completar Perfil Profesional
                </Button>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => {
                setIsEditing(false);
                // Recargar datos originales
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
              ✅ Tu perfil se ha actualizado correctamente. Los cambios ya son visibles en las búsquedas.
            </AlertDescription>
          </Alert>
        )}

        {/* ✅ Card de conversión para clientes */}
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
                  onClick={() => navigate(createPageUrl("ProfileOnboarding"))}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Convertirme en Autónomo
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ✅ MEJORADO: Subscription Card con estados claros */}
        {isProfessional && subscription && (
          <Card className="mb-6 shadow-lg border-0 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg text-gray-900">
                        Gestión de Suscripción
                      </h3>
                      {subscriptionStatus && (
                        <Badge className={subscriptionStatus.color}>
                          {subscriptionStatus.badge} {subscriptionStatus.text}
                        </Badge>
                      )}
                    </div>
                    
                    {/* ✅ Información detallada */}
                    <div className="text-sm text-gray-700 space-y-1">
                      <p>
                        <strong>Plan:</strong> {subscription.plan_nombre}
                        {(subscription.estado === "en_prueba" || subscription.estado === "trialing") && " (7 días gratis)"}
                      </p>
                      <p>
                        <strong>Estado:</strong> {subscriptionStatus?.details}
                      </p>
                      {subscription.fecha_expiracion && (
                        <p className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <strong>Expiración:</strong> {new Date(subscription.fecha_expiracion).toLocaleDateString('es-ES')}
                        </p>
                      )}
                      
                      {/* ✅ Mensaje de visibilidad */}
                      <div className={`mt-2 p-2 rounded-lg ${
                        subscriptionStatus?.isActive 
                          ? 'bg-green-50 border border-green-200' 
                          : 'bg-red-50 border border-red-200'
                      }`}>
                        <p className={`text-sm font-semibold ${
                          subscriptionStatus?.isActive ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {subscriptionStatus?.isActive 
                            ? '✅ Tu perfil es visible en las búsquedas' 
                            : '❌ Tu perfil está oculto en las búsquedas'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  {/* ✅ Botón principal según estado */}
                  {subscriptionStatus?.isActive && !subscriptionStatus?.showReactivate ? (
                    <Button
                      onClick={() => navigate(createPageUrl("SubscriptionManagement"))}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Gestionar suscripción
                    </Button>
                  ) : (
                    <Button
                      onClick={() => navigate(createPageUrl("PricingPlans"))}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      {subscriptionStatus?.showReactivate ? 'Reactivar plan' : 'Ver planes'}
                    </Button>
                  )}
                  
                  {/* ✅ Botón upgrade (solo para trial) */}
                  {subscriptionStatus?.showUpgrade && subscriptionStatus?.isActive && (
                    <Button
                      onClick={() => navigate(createPageUrl("PricingPlans"))}
                      variant="outline"
                      className="border-purple-600 text-purple-700 hover:bg-purple-50"
                      size="sm"
                    >
                      <TrendingUp className="w-4 h-4 mr-1" />
                      Mejorar plan
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ✅ Card para profesionales sin suscripción */}
        {isProfessional && !subscription && (
          <Card className="mb-6 shadow-lg border-0 bg-gradient-to-r from-red-50 to-orange-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 mb-1">Sin suscripción activa</h3>
                    <p className="text-sm text-gray-700 mb-2">
                      Tu perfil está oculto. Necesitas un plan para aparecer en búsquedas.
                    </p>
                    <div className="p-2 bg-red-100 border border-red-200 rounded-lg">
                      <p className="text-sm font-semibold text-red-800">
                        ❌ Tu perfil no es visible para clientes
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => navigate(createPageUrl("PricingPlans"))}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    Ver planes
                  </Button>
                  <Button
                    onClick={handleManualSync}
                    disabled={manualSyncing}
                    variant="outline"
                    size="sm"
                    className="border-blue-600 text-blue-700 hover:bg-blue-50"
                  >
                    {manualSyncing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Verificar suscripción
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* User Info */}
        <Card className="mb-6 shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-700" />
              Información personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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

            {/* ✅ NUEVO: Zona de peligro - Eliminar cuenta */}
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

        {/* Professional Profile */}
        {isProfessional && (
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-700" />
                Perfil profesional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Identidad */}
              <div>
                <h3 className="font-semibold text-lg mb-4">Identidad</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Nombre profesional</Label>
                    <Input
                      value={profileData.business_name}
                      onChange={(e) => setProfileData({ ...profileData, business_name: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Mi Empresa"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>NIF / CIF</Label>
                      <Input
                        value={profileData.cif_nif}
                        onChange={(e) => setProfileData({ ...profileData, cif_nif: e.target.value })}
                        disabled={!isEditing}
                        placeholder="A12345678"
                      />
                    </div>
                    <div>
                      <Label>Email de contacto</Label>
                      <Input
                        value={profileData.email_contacto}
                        onChange={(e) => setProfileData({ ...profileData, email_contacto: e.target.value })}
                        disabled={!isEditing}
                        placeholder="contacto@empresa.com"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Teléfono de contacto</Label>
                    <Input
                        value={profileData.telefono_contacto}
                        onChange={(e) => setProfileData({ ...profileData, telefono_contacto: e.target.value })}
                        disabled={!isEditing}
                        placeholder="+34 612 345 678"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Actividad */}
              <div>
                <h3 className="font-semibold text-lg mb-4">Actividad</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Categorías de servicios</Label>
                    {isEditing && (
                      <div className="flex gap-2 mb-3">
                        <Input
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          placeholder="Ej: Fontanería, Electricidad..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addCategory();
                            }
                          }}
                        />
                        <Button type="button" onClick={addCategory} size="icon">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {profileData.categories?.map((cat, idx) => (
                        <Badge key={idx} className="bg-blue-100 text-blue-900">
                          {cat}
                          {isEditing && (
                            <button
                              onClick={() => removeCategory(cat)}
                              className="ml-2 hover:text-blue-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Descripción corta (220 caracteres)</Label>
                    <Textarea
                      value={profileData.descripcion_corta}
                      onChange={(e) => setProfileData({ ...profileData, descripcion_corta: e.target.value.slice(0, 220) })}
                      disabled={!isEditing}
                      className="h-24"
                      placeholder="Describe brevemente tus servicios..."
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {profileData.descripcion_corta?.length || 0}/220 caracteres
                    </p>
                  </div>

                  <div>
                    <Label>Descripción completa</Label>
                    <Textarea
                      value={profileData.description}
                      onChange={(e) => setProfileData({ ...profileData, description: e.target.value })}
                      disabled={!isEditing}
                      className="h-32"
                      placeholder="Describe tus servicios..."
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Ubicación */}
              <div>
                <h3 className="font-semibold text-lg mb-4">Ubicación y zona de trabajo</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Provincia</Label>
                      <Select
                        value={profileData.provincia}
                        onValueChange={(value) => setProfileData({ 
                          ...profileData, 
                          provincia: value,
                          ciudad: "",
                          municipio: ""
                        })}
                        disabled={!isEditing}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                        <SelectContent>
                          {provincias.map((prov) => (
                            <SelectItem key={prov} value={prov}>
                              {prov}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Ciudad</Label>
                      <Select
                        value={profileData.ciudad}
                        onValueChange={(value) => setProfileData({ 
                          ...profileData, 
                          ciudad: value,
                          municipio: ""
                        })}
                        disabled={!isEditing || !profileData.provincia}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                        <SelectContent>
                          {ciudadesPorProvincia[profileData.provincia]?.length > 0 ? (
                            ciudadesPorProvincia[profileData.provincia].map((ciudad) => (
                              <SelectItem key={ciudad} value={ciudad}>
                                {ciudad}
                              </SelectItem>
                            ))
                          ) : profileData.provincia ? (
                            // Fallback if no specific cities listed for the province, use province name as city
                            <SelectItem value={profileData.provincia}>
                              {profileData.provincia}
                            </SelectItem>
                          ) : null}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Municipio/Barrio</Label>
                      <Input
                        value={profileData.municipio}
                        onChange={(e) => setProfileData({ ...profileData, municipio: e.target.value })}
                        disabled={!isEditing}
                        placeholder="Centro, Chamartín..."
                      />
                    </div>
                  </div>

                  {profileData.service_area && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Ubicación completa:</p>
                      <p className="font-semibold text-gray-900">{profileData.service_area}</p>
                    </div>
                  )}

                  <div>
                    <Label>Radio de servicio</Label>
                    <Select
                      value={profileData.radio_servicio_km?.toString()}
                      onValueChange={(value) => setProfileData({ ...profileData, radio_servicio_km: parseInt(value) })}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 km</SelectItem>
                        <SelectItem value="10">10 km</SelectItem>
                        <SelectItem value="25">25 km</SelectItem>
                        <SelectItem value="50">50 km</SelectItem>
                        <SelectItem value="100">100+ km</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Horarios */}
              <div>
                <h3 className="font-semibold text-lg mb-4">Horarios</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Días de disponibilidad</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                      {diasSemana.map((dia) => (
                        <div
                          key={dia.value}
                          onClick={() => isEditing && toggleDia(dia.value)}
                          className={`p-2 border-2 rounded-lg text-center transition-all ${
                            isEditing ? 'cursor-pointer' : 'cursor-default'
                          } ${
                            profileData.horario_dias?.includes(dia.value)
                              ? "border-blue-600 bg-blue-50"
                              : "border-gray-200"
                          }`}
                        >
                          <p className="text-sm font-medium">{dia.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Hora apertura</Label>
                      <Input
                        type="time"
                        value={profileData.horario_apertura}
                        onChange={(e) => setProfileData({ ...profileData, horario_apertura: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label>Hora cierre</Label>
                      <Input
                        type="time"
                        value={profileData.horario_cierre}
                        onChange={(e) => setProfileData({ ...profileData, horario_cierre: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Precios */}
              <div>
                <h3 className="font-semibold text-lg mb-4">Precios y forma de trabajo</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Tarifa base (€/hora)</Label>
                      <Input
                        type="number"
                        value={profileData.tarifa_base}
                        onChange={(e) => setProfileData({ ...profileData, tarifa_base: parseFloat(e.target.value) })}
                        disabled={!isEditing}
                        placeholder="35"
                      />
                    </div>
                    <div>
                      <Label>Tipo de facturación</Label>
                      <Select
                        value={profileData.facturacion}
                        onValueChange={(value) => setProfileData({ ...profileData, facturacion: value })}
                        disabled={!isEditing}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="autonomo">Autónomo</SelectItem>
                          <SelectItem value="sociedad">Sociedad</SelectItem>
                          <SelectItem value="otros">Otros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-semibold">Formas de pago aceptadas</Label>
                    {isEditing && (
                      <p className="text-sm text-gray-500 mt-1 mb-3">
                        Selecciona las formas de pago que aceptas
                      </p>
                    )}
                    <div className={`space-y-2 ${!isEditing ? 'flex flex-wrap gap-2' : ''}`}>
                      {["Tarjeta", "Transferencia", "Efectivo", "Bizum"].map((forma) => (
                        isEditing ? (
                          <div
                            key={forma}
                            onClick={() => toggleFormaPago(forma)}
                            className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                              profileData.formas_pago?.includes(forma)
                                ? "border-purple-600 bg-purple-50 shadow-md"
                                : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
                            }`}
                          >
                            <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                              profileData.formas_pago?.includes(forma)
                                ? "bg-purple-600 border-purple-600"
                                : "border-gray-300"
                            }`}>
                              {profileData.formas_pago?.includes(forma) && (
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <span className={`text-base font-medium flex-1 transition-colors ${
                              profileData.formas_pago?.includes(forma) ? "text-purple-900" : "text-gray-700"
                            }`}>
                              {forma}
                            </span>
                            {profileData.formas_pago?.includes(forma) && (
                              <span className="text-purple-600 text-sm font-semibold">✓ Seleccionado</span>
                            )}
                          </div>
                        ) : (
                          profileData.formas_pago?.includes(forma) && (
                            <Badge key={forma} className="bg-purple-100 text-purple-900 text-sm px-3 py-1">
                              {forma}
                            </Badge>
                          )
                        )
                      ))}
                    </div>
                    {isEditing && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-900 font-medium">
                          {profileData.formas_pago?.length === 0 && "⚠️ Selecciona al menos una forma de pago"}
                          {profileData.formas_pago?.length === 1 && `✓ 1 forma de pago seleccionada`}
                          {profileData.formas_pago?.length > 1 && `✓ ${profileData.formas_pago.length} formas de pago seleccionadas`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Photos */}
              <div>
                <h3 className="font-semibold text-lg mb-4">Fotos de trabajos</h3>
                {isEditing && (
                  <div className="mb-4">
                    <label className="cursor-pointer">
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors">
                        {uploadingPhoto ? (
                          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-700" />
                        ) : (
                          <>
                            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm text-gray-600">Haz clic para añadir una foto</p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                        disabled={uploadingPhoto}
                      />
                    </label>
                  </div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {profileData.photos?.map((photo, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={photo}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-32 object-cover rounded-lg shadow-md"
                      />
                      {isEditing && (
                        <button
                          onClick={() => removePhoto(idx)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Social Links */}
              <div>
                <h3 className="font-semibold text-lg mb-4">Redes sociales</h3>
                <div className="space-y-3">
                  <Input
                    value={profileData.social_links?.facebook || ""}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      social_links: { ...profileData.social_links, facebook: e.target.value }
                    })}
                    disabled={!isEditing}
                    placeholder="URL de Facebook"
                  />
                  <Input
                    value={profileData.social_links?.instagram || ""}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      social_links: { ...profileData.social_links, instagram: e.target.value }
                    })}
                    disabled={!isEditing}
                    placeholder="URL de Instagram"
                  />
                  <Input
                    value={profileData.social_links?.linkedin || ""}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      social_links: { ...profileData.social_links, linkedin: e.target.value }
                    })}
                    disabled={!isEditing}
                    placeholder="URL de LinkedIn"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ✅ NUEVO: Dialog de confirmación de eliminación */}
        {showDeleteDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-lg w-full">
              <CardHeader className="bg-red-50 border-b border-red-200">
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  ¿Eliminar tu cuenta definitivamente?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="bg-red-50 border-l-4 border-red-500 p-4">
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
                        <li>Tu suscripción activa (se cancelará inmediatamente)</li>
                        <li>Tu visibilidad en las búsquedas</li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                  <p className="text-sm text-blue-900">
                    💡 <strong>Alternativa:</strong> Si solo quieres pausar tu cuenta temporalmente,
                    puedes cancelar tu suscripción desde "Gestión de Suscripción" sin eliminar tu cuenta.
                  </p>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteDialog(false)}
                    disabled={isDeleting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
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
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

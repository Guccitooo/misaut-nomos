
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQueryClient } from "@tanstack/react-query"; // Removed useMutation as per changes
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, ArrowRight, ArrowLeft, Loader2, AlertCircle, Upload, X, Edit } from "lucide-react";
import { toast } from "sonner";

export default function ProfileOnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const fromCheckout = searchParams.get("from") === "checkout";

  const [currentStep, setCurrentStep] = useState(0);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); // This will hold the professional profile once loaded/created
  const [error, setError] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // For intermediate step saves
  const [isSubmitting, setIsSubmitting] = useState(false); // For final step submission
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const [formData, setFormData] = useState({
    business_name: "",
    cif_nif: "",
    email_contacto: "",
    telefono_contacto: "",
    categories: [],
    descripcion_corta: "",
    description: "",
    service_area: "",
    provincia: "",
    ciudad: "",
    municipio: "",
    radio_servicio_km: 10,
    horario_dias: [],
    horario_apertura: "09:00",
    horario_cierre: "18:00",
    tarifa_base: "",
    facturacion: "autonomo",
    formas_pago: [],
    photos: [],
    acepta_terminos: false,
    acepta_politica_privacidad: false,
    consiente_contacto_clientes: false,
    // NUEVOS CAMPOS
    website: "",
    social_links: { facebook: "", instagram: "", linkedin: "" },
  });

  // Provincias de España
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

  // Lista AMPLIADA de ciudades principales por provincia
  const ciudadesPorProvincia = {
    "Madrid": ["Madrid", "Alcalá de Henares", "Móstoles", "Fuenlabrada", "Leganés", "Getafe", "Alcorcón", "Torrejón de Ardoz", "Parla", "Alcobendas", "San Sebastián de los Reyes", "Pozuelo de Alarcón", "Las Rozas", "Majadahonda", "Rivas-Vaciamadrid", "Coslada", "Valdemoro", "Collado Villalba", "Aranjuez", "Arganda del Rey", "Boadilla del Monte", "Pinto", "San Fernando de Henares", "Colmenar Viejo", "Galapagar"],
    "Barcelona": ["Barcelona", "L'Hospitalet de Llobregat", "Badalona", "Terrassa", "Sabadell", "Mataró", "Santa Coloma de Gramenet", "Cornellà de Llobregat", "Sant Boi de Llobregat", "Rubí", "Manresa", "Vilanova i la Geltrú", "Viladecans", "Castelldefels", "El Prat de Llobregat", "Granollers", "Cerdanyola del Vallès", "Sant Cugat del Vallès", "Mollet del Vallès", "Esplugues de Llobregat", "Gavà", "Ripollet", "Vic", "Sant Feliu de Llobregat", "Igualada", "Sitges", "Montgat", "Calella", "Berga"],
    "Valencia": ["Valencia", "Gandía", "Torrent", "Paterna", "Sagunto", "Mislata", "Burjassot", "Alzira", "Sueca", "Xirivella", "Manises", "Ontinyent", "Alaquàs", "Catarroja", "Xàtiva", "Cullera", "Massamagrell", "Quart de Poblet", "Alfafar", "Requena", "Aldaia", "Benetússer", "Carlet", "Llíria"],
    "Sevilla": ["Sevilla", "Dos Hermanas", "Alcalá de Guadaíra", "Utrera", "Mairena del Aljarafe", "Écija", "Los Palacios y Villafranca", "La Rinconada", "Camas", "Morón de la Frontera", "Carmona", "Lebrija", "San Juan de Aznalfarache", "Coria del Río", "Tomares", "Bormujos", "Castilleja de la Cuesta", "Lora del Río", "Brenes", "Marchena"],
    "Málaga": ["Málaga", "Marbella", "Mijas", "Vélez-Málaga", "Fuengirola", "Torremolinos", "Estepona", "Benalmádena", "Rincón de la Victoria", "Antequera", "Ronda", "Alhaurín de la Torre", "Nerja", "Coín", "Alhaurín el Grande", "Manilva", "Torrox", "Cártama", "Casares"],
    "Alicante": ["Alicante", "Elche", "Torrevieja", "Orihuela", "Benidorm", "Alcoy", "San Vicente del Raspeig", "Elda", "Dénia", "Villena", "Santa Pola", "Petrer", "Calpe", "Altea", "Jávea", "Villajoyosa", "Ibi", "Campello", "Crevillente", "Novelda", "Aspe", "Guardamar del Segura", "Pilar de la Horadada"],
    "Zaragoza": ["Zaragoza", "Calatayud", "Utebo", "Ejea de los Caballeros", "Cuarte de Huelva", "Tarazona", "Caspe", "Zuera", "Alagón", "Borja", "Monzón", "Tudela", "Illueca"],
    "Murcia": ["Murcia", "Cartagena", "Lorca", "Molina de Segura", "Alcantarilla", "Mazarrón", "Cieza", "Yecla", "Águilas", "Torre-Pacheco", "San Javier", "Jumilla", "Totana", "Las Torres de Cotillas", "San Pedro del Pinatar", "Archena", "Caravaca de la Cruz", "Alhama de Murcia"],
    "Asturias": ["Oviedo", "Gijón", "Avilés", "Siero", "Langreo", "Mieres", "Castrillón", "Llanera", "Corvera", "Carreño", "Gozón", "Navia", "Villaviciosa", "Tineo"],
    "Vizcaya": ["Bilbao", "Barakaldo", "Getxo", "Portugalete", "Santurtzi", "Basauri", "Leioa", "Galdakao", "Durango", "Sestao", "Erandio", "Bermeo", "Amorebieta", "Gernika"],
    "La Coruña": ["La Coruña", "Santiago de Compostela", "Ferrol", "Oleiros", "Narón", "Arteixo", "Culleredo", "Carballo", "Betanzos", "Cambre"],
    "Cádiz": ["Cádiz", "Jerez de la Frontera", "Algeciras", "San Fernando", "El Puerto de Santa María", "Chiclana de la Frontera", "La Línea de la Concepción", "Sanlúcar de Barrameda", "Puerto Real", "Arcos de la Frontera", "Conil de la Frontera", "Barbate"],
    "Islas Baleares": ["Palma de Mallorca", "Calvià", "Manacor", "Ibiza", "Mahón", "Llucmajor", "Marratxí", "Inca", "Alcúdia", "Felanitx", "Ciutadella de Menorca", "Santa Eulalia del Río"],
    "Pontevedra": ["Vigo", "Pontevedra", "Vilagarcía de Arousa", "Redondela", "Cangas", "Marín", "O Porriño", "Sanxenxo", "Baiona", "Moaña"],
    "Las Palmas": ["Las Palmas de Gran Canaria", "Telde", "Santa Lucía de Tirajana", "Arucas", "Agüimes", "Ingenio", "San Bartolomé de Tirajana", "Puerto del Rosario", "Arrecife"],
    "Santa Cruz de Tenerife": ["Santa Cruz de Tenerife", "San Cristóbal de La Laguna", "Arona", "Adeje", "Granadilla de Abona", "Santa Cruz de La Palma", "Los Llanos de Aridane", "Puerto de la Cruz"],
    "Cantabria": ["Santander", "Torrelavega", "Castro-Urdiales", "Camargo", "Piélagos", "El Astillero", "Santa Cruz de Bezana", "Laredo"],
    "Guipúzcoa": ["San Sebastián", "Irún", "Éibar", "Rentería", "Mondragón", "Hernani", "Lasarte-Oria", "Zarautz", "Hondarribia", "Beasain"],
    "Tarragona": ["Tarragona", "Reus", "Tortosa", "El Vendrell", "Cambrils", "Valls", "Vila-seca", "Salou", "Amposta", "Calafell"],
    "Córdoba": ["Córdoba", "Lucena", "Puente Genil", "Montilla", "Priego de Córdoba", "Cabra", "Baena", "Palma del Río", "Pozoblanco"],
    "Granada": ["Granada", "Motril", "Almuñécar", "Armilla", "Loja", "Baza", "Guadix", "Maracena", "Atarfe"],
    "Castellón": ["Castellón de la Plana", "Vila-real", "Burriana", "Vinaròs", "Onda", "Benicàssim", "Nules", "Almassora", "Benicarló"],
    "Valladolid": ["Valladolid", "Laguna de Duero", "Medina del Campo", "Arroyo de la Encomienda", "Tudela de Duero", "Íscar", "Cigales"],
    "Toledo": ["Toledo", "Talavera de la Reina", "Illescas", "Seseña", "Torrijos", "Yuncos", "Olías del Rey", "Sonseca"],
    "León": ["León", "Ponferrada", "San Andrés del Rabanedo", "Villaquilambre", "Astorga", "La Bañeza", "Valencia de Don Juan"],
    "Jaén": ["Jaén", "Linares", "Andújar", "Úbeda", "Martos", "Alcalá la Real", "Bailén", "Baeza"],
    "Badajoz": ["Badajoz", "Mérida", "Don Benito", "Almendralejo", "Villanueva de la Serena", "Zafra", "Montijo", "Villafranca de los Barros"],
    "Huelva": ["Huelva", "Lepe", "Almonte", "Moguer", "Isla Cristina", "Ayamonte", "Cartaya", "Punta Umbría"]
  };

  // Días de la semana
  const diasSemana = [
    { value: "lunes", label: "Lunes" },
    { value: "martes", label: "Martes" },
    { value: "miercoles", label: "Miércoles" },
    { value: "jueves", label: "Jueves" },
    { value: "viernes", label: "Viernes" },
    { value: "sabado", label: "Sábado" },
    { value: "domingo", label: "Domingo" }
  ];

  // Horarios (cada 30 minutos)
  const horarios = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hora = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      horarios.push(hora);
    }
  }

  const toggleDia = (dia) => {
    const dias = formData.horario_dias;
    if (dias.includes(dia)) {
      setFormData({
        ...formData,
        horario_dias: dias.filter(d => d !== dia)
      });
    } else {
      setFormData({
        ...formData,
        horario_dias: [...dias, dia]
      });
    }
  };

  const loadUser = async () => {
    setIsLoadingUser(true);
    try {
      const currentUser = await base44.auth.me();
      console.log('👤 Usuario cargado:', currentUser.email);
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading user:", error);
      base44.auth.redirectToLogin();
    } finally {
      setIsLoadingUser(false);
    }
  };

  const loadProfileDataWhenUserIsSet = async () => {
    if (!user || user.user_type !== "professionnel") return; // Only load profile for professionals

    try {
      const profiles = await base44.entities.ProfessionalProfile.filter({
        user_id: user.id
      });

      if (profiles[0]) {
        console.log('✅ Perfil existente encontrado');
        const existingProfile = profiles[0];
        setProfile(existingProfile); // Set the profile state

        // Pre-llenar formulario con datos existentes
        setFormData({
          ...formData, // Keep initial state for website/social_links if not present in existingProfile
          business_name: existingProfile.business_name || "",
          cif_nif: existingProfile.cif_nif || "",
          email_contacto: existingProfile.email_contacto || user.email,
          telefono_contacto: existingProfile.telefono_contacto || user.phone || "",
          categories: existingProfile.categories || [],
          descripcion_corta: existingProfile.descripcion_corta || "",
          description: existingProfile.description || "",
          service_area: existingProfile.service_area || "",
          provincia: existingProfile.provincia || "",
          ciudad: existingProfile.ciudad || "",
          municipio: existingProfile.municipio || "",
          radio_servicio_km: existingProfile.radio_servicio_km || 10,
          horario_dias: existingProfile.horario_dias || [],
          horario_apertura: existingProfile.horario_apertura || "09:00",
          horario_cierre: existingProfile.horario_cierre || "18:00",
          tarifa_base: existingProfile.tarifa_base || "",
          facturacion: existingProfile.facturacion || "autonomo",
          formas_pago: existingProfile.formas_pago || [],
          photos: existingProfile.photos || [],
          website: existingProfile.website || "",
          social_links: existingProfile.social_links || { facebook: "", instagram: "", linkedin: "" },
          acepta_terminos: existingProfile.acepta_terminos || false,
          acepta_politica_privacidad: existingProfile.acepta_politica_privacidad || false,
          consiente_contacto_clientes: existingProfile.consiente_contacto_clientes || false,
        });

        // If profile is already completed and visible, navigate to MyProfile
        if (existingProfile.onboarding_completed && existingProfile.visible_en_busqueda) {
          navigate(createPageUrl("MyProfile"));
        }

      } else {
        // If no profile, pre-fill contact info from user
        setFormData(prev => ({
          ...prev,
          email_contacto: user.email,
          telefono_contacto: user.phone || "",
        }));
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  // ✅ NUEVO: Función para verificar y activar suscripción automáticamente
  const checkAndActivateSubscription = async () => {
    if (!user) return;
    try {
      console.log('🔍 Verificando suscripción...');
      
      const subscriptions = await base44.entities.Subscription.filter({
        user_id: user.id
      });

      if (subscriptions.length === 0) {
        console.log('❌ No se encontró suscripción');
        toast.error('No se encontró tu suscripción. Por favor, contacta con soporte: admin@milautonomos.com');
        return;
      }

      const subscription = subscriptions[0];
      const today = new Date();
      const expiration = new Date(subscription.fecha_expiracion);
      const isActive = expiration >= today;

      console.log('📊 Suscripción:', {
        estado: subscription.estado,
        fecha_expiracion: subscription.fecha_expiracion,
        isActive
      });

      if (isActive) {
        console.log('✅ Suscripción activa, usuario puede continuar con quiz');
        toast.success('Suscripción verificada correctamente. Completa tu perfil para aparecer en búsquedas.', {
          duration: 6000
        });
      } else {
        console.log('❌ Suscripción no activa');
        toast.error('Tu suscripción ha expirado. Por favor, renueva tu plan.');
        setTimeout(() => {
          navigate(createPageUrl("PricingPlans"));
        }, 3000);
      }
    } catch (error) {
      console.error('Error verificando suscripción:', error);
      toast.error('Error al verificar tu suscripción. Contacta con soporte: admin@milautonomos.com');
    }
  };


  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user && user.user_type === "professionnel") {
      loadProfileDataWhenUserIsSet();
    }
  }, [user]);

  // ✅ NUEVO: Activar automáticamente si llega desde checkout
  useEffect(() => {
    if (fromCheckout && user && !isLoadingUser) {
      console.log('✅ Usuario viene desde checkout, verificando suscripción...');
      checkAndActivateSubscription();
      // Limpiar URL después de la verificación inicial
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [fromCheckout, user, isLoadingUser]);


  // Update service_area when location changes
  useEffect(() => {
    if (formData.provincia && formData.ciudad) {
      const area = formData.municipio
        ? `${formData.municipio}, ${formData.ciudad}, ${formData.provincia}`
        : `${formData.ciudad}, ${formData.provincia}`;
      setFormData(prev => ({ ...prev, service_area: area }));
    } else if (formData.provincia) {
      setFormData(prev => ({ ...prev, service_area: formData.provincia }));
    } else {
      setFormData(prev => ({ ...prev, service_area: "" }));
    }
  }, [formData.provincia, formData.ciudad, formData.municipio]);

  const steps = [
    {
      title: "Identidad",
      fields: ["business_name", "cif_nif", "email_contacto", "telefono_contacto"]
    },
    {
      title: "Actividad",
      fields: ["categories", "descripcion_corta", "description"]
    },
    {
      title: "Zona y disponibilidad",
      fields: ["provincia", "ciudad", "municipio", "radio_servicio_km", "horario_dias", "horario_apertura", "horario_cierre"]
    },
    {
      title: "Precios y forma de trabajo",
      fields: ["tarifa_base", "facturacion", "formas_pago"]
    },
    {
      title: "Portfolio (fotos)",
      fields: ["photos"]
    },
    {
      title: "Verificación y legales",
      fields: ["acepta_terminos", "acepta_politica_privacidad", "consiente_contacto_clientes"]
    },
    {
      title: "Revisión final",
      fields: []
    }
  ];

  const categories = [
    "Electricista", "Fontanero", "Carpintero", "Albañil / Reformas",
    "Jardinero", "Pintor", "Transportista", "Autónomo de limpieza",
    "Asesoría o gestoría", "Empresa multiservicios"
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const validateStep = (stepIndex) => {
    const step = steps[stepIndex];
    const fieldsToValidate = step.fields;

    for (const field of fieldsToValidate) {
      const value = formData[field];

      if (field === "business_name") {
        if (!value || value.trim().length < 2) {
          setError("El nombre profesional debe tener al menos 2 caracteres");
          return false;
        }
      }

      if (field === "cif_nif") {
        const cleanValue = value.trim();
        if (!cleanValue || cleanValue.length < 8) {
          setError("NIF/CIF debe tener al menos 8 caracteres");
          return false;
        }
      }

      if (field === "email_contacto") {
        if (!value || !value.includes('@')) {
          setError("Email inválido");
          return false;
        }
      }

      if (field === "telefono_contacto") {
        const cleanPhone = value.replace(/[^\d+]/g, '');
        if (!cleanPhone || cleanPhone.length < 9) {
          setError("Teléfono debe tener al menos 9 dígitos");
          return false;
        }
      }

      if (field === "categories") {
        if (!value || value.length === 0) {
          setError("Selecciona al menos una categoría");
          return false;
        }
      }

      if (field === "descripcion_corta") {
        if (!value || value.length < 20) {
          setError("La descripción corta debe tener al menos 20 caracteres");
          return false;
        }
      }

      if (field === "provincia") {
        if (!value || value.trim().length === 0) {
          setError("Selecciona una provincia");
          return false;
        }
      }

      if (field === "ciudad") {
        if (!value || value.trim().length === 0) {
          setError("Selecciona una ciudad");
          return false;
        }
      }
      
      if (field === "horario_dias") {
        if (!value || value.length === 0) {
          setError("Selecciona al menos un día de disponibilidad");
          return false;
        }
      }

      if (field === "tarifa_base") {
        if (!value || parseFloat(value) <= 0) {
          setError("La tarifa debe ser mayor a 0");
          return false;
        }
      }

      if (field === "formas_pago") {
        if (!value || value.length === 0) {
          setError("Selecciona al menos una forma de pago");
          return false;
        }
      }

      if (field === "photos") {
        if (!value || value.length === 0) {
          setError("Sube al menos 1 foto de tus trabajos");
          return false;
        }
      }

      if (field === "acepta_terminos") {
        if (!value) {
          setError("Debes aceptar los términos y condiciones");
          return false;
        }
      }

      if (field === "acepta_politica_privacidad") {
        if (!value) {
          setError("Debes aceptar la política de privacidad");
          return false;
        }
      }

      if (field === "consiente_contacto_clientes") {
        if (!value) {
          setError("Debes dar consentimiento para que los clientes te contacten");
          return false;
        }
      }
    }

    return true;
  };

  const handleNext = async () => {
    console.log("🔴 BOTÓN CLICKEADO - handleNext ejecutándose");
    console.log("Paso actual:", currentStep);
    
    setError(null);

    // Validar el paso actual
    if (!validateStep(currentStep)) {
      console.log("❌ Validación falló");
      return;
    }

    console.log("✅ Validación pasó");

    // Solo guardar campos relevantes del paso actual
    const stepFields = steps[currentStep].fields;
    const dataToSave = {};
    
    // Incluir campos del paso actual en dataToSave
    stepFields.forEach(field => {
      if (formData[field] !== undefined) {
        dataToSave[field] = formData[field];
      }
    });

    // Siempre incluir campos base necesarios si no están en el paso actual
    dataToSave.user_id = user.id;
    dataToSave.business_name = formData.business_name || "Nombre provisional";
    dataToSave.email_contacto = formData.email_contacto || user.email;

    // Guardar en background
    setIsSaving(true);
    try {
      if (profile) {
        // Actualizar perfil existente con el estado "pendiente"
        const updatedProfile = await base44.entities.ProfessionalProfile.update(profile.id, {
          ...dataToSave,
          estado_perfil: "pendiente",
          visible_en_busqueda: false,
          onboarding_completed: false
        });
        setProfile(updatedProfile); // Update profile state with latest data
        console.log("💾 Guardado exitoso (actualización de paso)");
      } else {
        // Crear un nuevo perfil con estado "pendiente"
        const newProfile = await base44.entities.ProfessionalProfile.create({
          ...formData, // Use full formData for initial creation
          user_id: user.id,
          estado_perfil: "pendiente",
          visible_en_busqueda: false,
          onboarding_completed: false,
          // Ensure defaults for numbers/objects
          radio_servicio_km: formData.radio_servicio_km || 10,
          tarifa_base: parseFloat(formData.tarifa_base) || 0,
          social_links: formData.social_links || { facebook: "", instagram: "", linkedin: "" }
        });
        setProfile(newProfile);
        console.log("💾 Guardado exitoso (creación de perfil en estado PENDIENTE)");
      }
    } catch (error) {
      console.error("⚠️ Error guardando paso:", error);
      const errorMessage = error.message || error.toString();
      setError("Error al guardar este paso: " + errorMessage + ". Por favor, verifica los datos.");
      setIsSaving(false);
      return; // Stop progression on critical save error
    }
    setIsSaving(false);

    // Avanzar al siguiente paso
    console.log("➡️ Avanzando al siguiente paso");
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    console.log("✅ Paso cambiado a:", nextStep);
  };

  const handleBack = () => {
    setError(null);
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Replaces handlePublish and publishProfileMutation
  const handleSubmit = async () => {
    console.log('💾 Iniciando proceso de guardado final...');
    setIsSubmitting(true);
    setError(null);

    try {
      // ✅ Primero verificar que todos los pasos estén validados
      for (let i = 0; i < steps.length - 1; i++) {
        if (!validateStep(i)) {
          toast.error(`Completa el paso ${i + 1}: ${steps[i].title} antes de publicar.`);
          setCurrentStep(i);
          setIsSubmitting(false);
          return;
        }
      }

      // ✅ Segundo verificar suscripción
      const subscriptions = await base44.entities.Subscription.filter({
        user_id: user.id
      });

      if (subscriptions.length === 0) {
        throw new Error('No se encontró tu suscripción. Por favor, contacta con soporte: admin@milautonomos.com');
      }

      const subscription = subscriptions[0];
      const today = new Date();
      const expiration = new Date(subscription.fecha_expiracion);
      const isSubscriptionActive = expiration >= today;

      if (!isSubscriptionActive) {
        throw new Error('Tu suscripción ha expirado. Por favor, renueva tu plan.');
      }

      console.log('✅ Suscripción verificada como activa');

      // Preparar datos del perfil
      const now = new Date().toISOString();
      const slug = `${formData.business_name.toLowerCase().replace(/\s+/g, '-')}-${profile?.id ? profile.id.slice(-6) : Math.random().toString(36).substring(2, 8)}`;

      const profileData = {
        user_id: user.id,
        business_name: formData.business_name,
        cif_nif: formData.cif_nif,
        email_contacto: formData.email_contacto || user.email,
        telefono_contacto: formData.telefono_contacto || user.phone,
        categories: formData.categories,
        descripcion_corta: formData.descripcion_corta,
        description: formData.description,
        provincia: formData.provincia,
        ciudad: formData.ciudad,
        municipio: formData.municipio,
        service_area: formData.service_area,
        radio_servicio_km: formData.radio_servicio_km,
        tarifa_base: parseFloat(formData.tarifa_base) || 0,
        horario_dias: formData.horario_dias,
        horario_apertura: formData.horario_apertura,
        horario_cierre: formData.horario_cierre,
        formas_pago: formData.formas_pago,
        photos: formData.photos,
        imagen_principal: formData.photos[0] || "",
        website: formData.website,
        social_links: formData.social_links,
        price_range: "€€", // Default, can be refined
        average_rating: 0,
        total_reviews: 0,
        // ✅ CRÍTICO: Marcar como completado y visible automáticamente
        onboarding_completed: true,
        visible_en_busqueda: true,
        estado_perfil: "activo",
        acepta_terminos: formData.acepta_terminos,
        acepta_politica_privacidad: formData.acepta_politica_privacidad,
        consiente_contacto_clientes: formData.consiente_contacto_clientes,
        fecha_publicacion: now,
        slug_publico: slug
      };

      console.log('📝 Datos del perfil a guardar:', profileData);

      let savedProfile;
      if (profile) { // Using 'profile' state variable
        console.log('🔄 Actualizando perfil existente...');
        savedProfile = await base44.entities.ProfessionalProfile.update(
          profile.id,
          profileData
        );
      } else {
        console.log('➕ Creando nuevo perfil...');
        savedProfile = await base44.entities.ProfessionalProfile.create(profileData);
      }

      console.log('✅ Perfil guardado:', savedProfile);
      setProfile(savedProfile); // Update the profile state with the saved data

      // ✅ Actualizar usuario (user_type, phone, city)
      await base44.auth.updateMe({
        user_type: "professionnel",
        phone: formData.telefono_contacto || user.phone,
        city: formData.ciudad || user.city
      });
      setUser(prevUser => ({ ...prevUser, user_type: "professionnel", phone: formData.telefono_contacto || prevUser.phone, city: formData.ciudad || prevUser.city }));
      console.log('✅ Usuario actualizado');

      // ✅ Email de confirmación con notificación de activación
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: "✅ Tu perfil ya está publicado en milautonomos",
        body: `Hola ${formData.business_name},

¡Enhorabuena! Tu perfil profesional ya está activo y visible en milautonomos.

🎉 PERFIL ACTIVADO EXITOSAMENTE

Los clientes pueden encontrarte buscando por:
- Tu nombre: ${formData.business_name}
- Tu actividad: ${formData.categories.join(', ')}
- Tu zona: ${formData.service_area}

📊 Estado de tu perfil:
✅ Visible en búsquedas: SÍ
✅ Onboarding completado: SÍ
✅ Suscripción: ACTIVA
✅ Fotos subidas: ${formData.photos.length}
✅ Categorías: ${formData.categories.length}

Próximos pasos para maximizar tu visibilidad:
1. Añade más fotos de tus trabajos
2. Completa tu descripción con palabras clave
3. Responde rápido a los mensajes de clientes
4. Pide valoraciones a tus clientes satisfechos

Ver mi perfil público: https://milautonomos.com/perfil/${savedProfile.slug_publico}

Gracias por unirte a milautonomos,
Equipo milautonomos`,
        from_name: "milautonomos"
      });

      // ✅ Mostrar mensaje de éxito
      toast.success('¡Perfil completado y publicado correctamente!', {
        duration: 5000
      });

      // ✅ Invalidar queries
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      queryClient.invalidateQueries({ queryKey: ['professionalProfiles'] });

      setCurrentStep(steps.length); // Go to success page

    } catch (err) {
      console.error("❌ Error guardando perfil:", err);
      setError(err.message || 'Error al guardar el perfil');
      toast.error(err.message || 'Error al guardar el perfil');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({
        ...formData,
        photos: [...formData.photos, file_url]
      });
      toast.success("Foto subida correctamente");
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Error al subir la foto");
    }
    setUploadingPhoto(false);
  };

  const removePhoto = (index) => {
    const newPhotos = [...formData.photos];
    newPhotos.splice(index, 1);
    setFormData({ ...formData, photos: newPhotos });
  };

  const toggleCategory = (category) => {
    const categories = formData.categories;
    if (categories.includes(category)) {
      setFormData({
        ...formData,
        categories: categories.filter(c => c !== category)
      });
    } else {
      setFormData({
        ...formData,
        categories: [...categories, category]
      });
    }
  };

  const toggleFormaPago = (forma) => {
    const formas = formData.formas_pago;
    if (formas.includes(forma)) {
      setFormData({
        ...formData,
        formas_pago: formas.filter(f => f !== forma)
      });
    } else {
      setFormData({
        ...formData,
        formas_pago: [...formas, forma]
      });
    }
  };

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
        <p className="ml-3 text-gray-600">Cargando...</p>
      </div>
    );
  }

  // Handle cases where user is not logged in or not a professional
  if (!user || user.user_type !== "professionnel") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Acceso restringido</h2>
            <p className="text-gray-600 mb-6">
              Esta página es solo para profesionales. Si deseas ofrecer tus servicios, primero debes seleccionar un plan.
            </p>
            <Button
              onClick={() => navigate(createPageUrl("PricingPlans"))}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Ver planes disponibles
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success screen
  if (currentStep === steps.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex items-center justify-center p-4">
        {/* ✅ Elementos decorativos de fondo */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-700"></div>
        </div>

        <Card className="max-w-3xl w-full border-0 shadow-2xl relative z-10 overflow-hidden">
          {/* ✅ Barra de confetti decorativa */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-400 via-blue-500 to-purple-500"></div>
          
          <CardContent className="p-8 md:p-12">
            {/* ✅ Icono de éxito con animación */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-28 h-28 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  <CheckCircle className="w-16 h-16 text-white" strokeWidth={2.5} />
                </div>
                {/* ✅ Anillo animado alrededor */}
                <div className="absolute inset-0 w-28 h-28 rounded-full border-4 border-green-400 animate-ping opacity-75"></div>
              </div>
            </div>

            {/* ✅ Título principal - MEJORADO CONTRASTE */}
            <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
              ✅ ¡Tu perfil profesional está activo!
            </h1>

            {/* ✅ Subtítulo - MEJORADO CONTRASTE */}
            <p className="text-lg md:text-xl text-center text-gray-800 font-semibold mb-3 max-w-2xl mx-auto">
              Ya eres visible en las búsquedas de <span className="text-blue-700 font-bold">milautonomos</span>
            </p>

            <p className="text-base text-center text-gray-700 mb-8 max-w-xl mx-auto">
              Empieza a recibir contactos de clientes interesados en tus servicios profesionales.
            </p>

            {/* ✅ Estadísticas rápidas */}
            <div className="grid grid-cols-3 gap-4 mb-8 max-w-xl mx-auto">
              <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="text-2xl font-bold text-blue-700">✓</div>
                <div className="text-xs text-gray-700 mt-1 font-medium">Perfil activo</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="text-2xl font-bold text-green-700">👁️</div>
                <div className="text-xs text-gray-700 mt-1 font-medium">Visible en búsquedas</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
                <div className="text-2xl font-bold text-purple-700">🚀</div>
                <div className="text-xs text-gray-700 mt-1 font-medium">Listo para clientes</div>
              </div>
            </div>

            {/* ✅ Botones de acción principales */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-base px-8 py-6"
                onClick={() => navigate(createPageUrl("ProfessionalProfile") + `?id=${user.id}`)}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Ver mi ficha pública
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-blue-600 text-blue-700 hover:bg-blue-50 shadow-md hover:shadow-lg transition-all duration-300 text-base px-8 py-6 bg-white"
                onClick={() => navigate(createPageUrl("Search"))}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Ver búsquedas de clientes
              </Button>
            </div>

            {/* ✅ Botón secundario - Editar perfil */}
            <div className="text-center mb-8">
              <Button
                variant="ghost"
                className="text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                onClick={() => navigate(createPageUrl("MyProfile"))}
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar mi perfil
              </Button>
            </div>

            {/* ✅ Separador */}
            <div className="border-t border-gray-200 my-8"></div>

            {/* ✅ Mensaje motivacional */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">💡 Consejos para destacar</h3>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold mt-0.5">✓</span>
                      <span>Mantén tu perfil actualizado con fotos recientes de tus trabajos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold mt-0.5">✓</span>
                      <span>Responde rápido a los mensajes para mejorar tu posición en búsquedas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold mt-0.5">✓</span>
                      <span>Pide valoraciones a tus clientes satisfechos</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* ✅ Próximos pasos */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                ¿Necesitas ayuda? Contacta con soporte:{" "}
                <a href="mailto:admin@milautonomos.com" className="text-blue-600 hover:text-blue-800 font-medium underline">
                  admin@milautonomos.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <h1 className="text-2xl font-bold text-gray-900">Completa tu perfil profesional</h1>
            <span className="text-sm text-gray-600">
              Paso {currentStep + 1} de {steps.length}
            </span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex flex-col gap-3">
              <p>{error}</p>
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-0 shadow-lg">
          <CardContent className="p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {steps[currentStep].title}
            </h2>

            {/* Step 0: Identidad */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <div>
                  <Label>Nombre profesional *</Label>
                  <Input
                    value={formData.business_name}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                    placeholder="Ej: Juan Pérez - Electricista"
                    maxLength={100}
                    className="h-12"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.business_name.length}/100 caracteres
                  </p>
                </div>

                <div>
                  <Label>NIF / CIF *</Label>
                  <Input
                    value={formData.cif_nif}
                    onChange={(e) => setFormData({ ...formData, cif_nif: e.target.value.toUpperCase() })}
                    placeholder="12345678A o B12345678"
                    maxLength={9}
                    className="h-12"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.cif_nif.length}/9 caracteres
                  </p>
                </div>

                <div>
                  <Label>Email de contacto *</Label>
                  <Input
                    type="email"
                    value={formData.email_contacto}
                    onChange={(e) => setFormData({ ...formData, email_contacto: e.target.value })}
                    placeholder="tu@email.com"
                    className="h-12"
                  />
                </div>

                <div>
                  <Label>Teléfono de contacto *</Label>
                  <Input
                    type="tel"
                    value={formData.telefono_contacto}
                    onChange={(e) => setFormData({ ...formData, telefono_contacto: e.target.value.replace(/[^\d+]/g, '') })}
                    placeholder="612345678 o +34612345678"
                    maxLength={15}
                    className="h-12"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.telefono_contacto.replace(/\s/g, '').length} dígitos (mínimo 9)
                  </p>
                </div>
              </div>
            )}

            {/* Step 1: Actividad */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label>Categorías de servicio * (selecciona al menos una)</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {categories.map((cat) => (
                      <div
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={`p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                          formData.categories.includes(cat)
                            ? "border-blue-600 bg-blue-50 shadow-sm"
                            : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                            formData.categories.includes(cat)
                              ? "bg-blue-600 border-blue-600"
                              : "border-gray-300"
                          }`}>
                            {formData.categories.includes(cat) && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <p className={`text-sm font-medium transition-colors ${
                            formData.categories.includes(cat) ? "text-blue-900" : "text-gray-700"
                          }`}>
                            {cat}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {formData.categories.length} {formData.categories.length === 1 ? 'seleccionada' : 'seleccionadas'}
                  </p>
                </div>

                <div>
                  <Label>Descripción corta * (máximo 220 caracteres)</Label>
                  <Textarea
                    value={formData.descripcion_corta}
                    onChange={(e) => setFormData({ ...formData, descripcion_corta: e.target.value.slice(0, 220) })}
                    placeholder="Describe brevemente tus servicios..."
                    className="h-24"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.descripcion_corta.length}/220 caracteres (mínimo 20)
                  </p>
                </div>

                <div>
                  <Label>Descripción detallada (opcional)</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Añade más detalles sobre tu experiencia, servicios específicos, etc."
                    className="h-32"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Zona y disponibilidad */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900">
                    📍 Indica tu ubicación principal y zona de trabajo. Los clientes podrán encontrarte en estas áreas.
                  </p>
                </div>

                <div>
                  <Label>Provincia *</Label>
                  <Select
                    value={formData.provincia}
                    onValueChange={(value) => {
                      setFormData({ 
                        ...formData, 
                        provincia: value,
                        ciudad: "",
                        municipio: ""
                      });
                    }}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Selecciona tu provincia" />
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

                {formData.provincia && (
                  <div>
                    <Label>Ciudad / Localidad * (selecciona de la lista)</Label>
                    <Select
                      value={formData.ciudad}
                      onValueChange={(value) => {
                        setFormData({ 
                          ...formData, 
                          ciudad: value,
                          municipio: ""
                        });
                      }}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Selecciona tu ciudad" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px] overflow-y-auto">
                        {ciudadesPorProvincia[formData.provincia]?.length > 0 ? (
                          ciudadesPorProvincia[formData.provincia].map((ciudad) => (
                            <SelectItem key={ciudad} value={ciudad}>
                              {ciudad}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value={formData.provincia}>
                            {formData.provincia} (como ciudad principal)
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      ⚠️ Solo se puede seleccionar de la lista. Si tu localidad no aparece, elige la ciudad más cercana.
                    </p>
                  </div>
                )}

                {formData.ciudad && (
                  <div>
                    <Label>Barrio / Municipio (opcional - texto libre)</Label>
                    <Input
                      value={formData.municipio}
                      onChange={(e) => setFormData({ ...formData, municipio: e.target.value })}
                      placeholder="Ej: Centro, Chamartín, Eixample..."
                      className="h-12"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Especifica un barrio o zona específica si quieres ser más preciso (opcional)
                    </p>
                  </div>
                )}

                {formData.service_area && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Tu ubicación principal:</p>
                    <p className="font-semibold text-gray-900">{formData.service_area}</p>
                  </div>
                )}

                <div>
                  <Label>Radio de servicio *</Label>
                  <Select
                    value={formData.radio_servicio_km.toString()}
                    onValueChange={(value) => setFormData({ ...formData, radio_servicio_km: parseInt(value) })}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 km - Solo mi zona</SelectItem>
                      <SelectItem value="10">10 km - Ciudad y alrededores</SelectItem>
                      <SelectItem value="25">25 km - Área metropolitana</SelectItem>
                      <SelectItem value="50">50 km - Provincia</SelectItem>
                      <SelectItem value="100">100+ km - Múltiples provincias</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500 mt-1">
                    ¿Hasta qué distancia estás dispuesto a desplazarte?
                  </p>
                </div>

                <div>
                  <Label>Días de disponibilidad *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                    {diasSemana.map((dia) => (
                      <div
                        key={dia.value}
                        onClick={() => toggleDia(dia.value)}
                        className={`p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                          formData.horario_dias.includes(dia.value)
                            ? "border-green-600 bg-green-50 shadow-sm"
                            : "border-gray-200 hover:border-green-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                            formData.horario_dias.includes(dia.value)
                              ? "bg-green-600 border-green-600"
                              : "border-gray-300"
                          }`}>
                            {formData.horario_dias.includes(dia.value) && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <p className={`text-sm font-medium transition-colors ${
                            formData.horario_dias.includes(dia.value) ? "text-green-900" : "text-gray-700"
                          }`}>
                            {dia.label}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {formData.horario_dias.length} {formData.horario_dias.length === 1 ? 'día seleccionado' : 'días seleccionados'}
                  </p>
                </div>

                {formData.horario_dias.length > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Hora de apertura</Label>
                      <Select
                        value={formData.horario_apertura}
                        onValueChange={(value) => setFormData({ ...formData, horario_apertura: value })}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {horarios.filter(hora => hora < formData.horario_cierre).map((hora) => (
                            <SelectItem key={hora} value={hora}>
                              {hora}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Hora de cierre</Label>
                      <Select
                        value={formData.horario_cierre}
                        onValueChange={(value) => setFormData({ ...formData, horario_cierre: value })}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {horarios.filter(hora => hora > formData.horario_apertura).map((hora) => (
                            <SelectItem key={hora} value={hora}>
                              {hora}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {formData.horario_dias.length > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-sm text-green-900">
                      ✓ Horario: {formData.horario_dias.map(d => diasSemana.find(ds => ds.value === d)?.label).join(', ')}
                      {' '}{formData.horario_apertura} - {formData.horario_cierre}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Precios */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <Label>Tarifa base * (€/hora o por servicio)</Label>
                  <Input
                    type="number"
                    value={formData.tarifa_base}
                    onChange={(e) => setFormData({ ...formData, tarifa_base: e.target.value })}
                    placeholder="Ej: 35"
                    min="0"
                    step="0.01"
                    className="h-12"
                  />
                </div>

                <div>
                  <Label>Tipo de facturación *</Label>
                  <Select
                    value={formData.facturacion}
                    onValueChange={(value) => setFormData({ ...formData, facturacion: value })}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="autonomo">Autónomo</SelectItem>
                      <SelectItem value="sociedad">Sociedad</SelectItem>
                      <SelectItem value="otros">Otros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-base font-semibold">Formas de pago aceptadas *</Label>
                  <p className="text-sm text-gray-500 mt-1 mb-3">
                    Selecciona al menos una forma de pago
                  </p>
                  <div className="space-y-2">
                    {["Tarjeta", "Transferencia", "Efectivo", "Bizum"].map((forma) => (
                      <div
                        key={forma}
                        onClick={() => toggleFormaPago(forma)}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                          formData.formas_pago.includes(forma)
                            ? "border-purple-600 bg-purple-50 shadow-md"
                            : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                          formData.formas_pago.includes(forma)
                            ? "bg-purple-600 border-purple-600"
                            : "border-gray-300"
                        }`}>
                          {formData.formas_pago.includes(forma) && (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-base font-medium flex-1 transition-colors ${
                          formData.formas_pago.includes(forma) ? "text-purple-900" : "text-gray-700"
                        }`}>
                          {forma}
                        </span>
                        {formData.formas_pago.includes(forma) && (
                          <span className="text-purple-600 text-sm font-semibold">✓ Seleccionado</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-900">
                      {formData.formas_pago.length === 0 && "⚠️ Selecciona al menos una forma de pago"}
                      {formData.formas_pago.length === 1 && `✓ 1 forma de pago seleccionada`}
                      {formData.formas_pago.length > 1 && `✓ ${formData.formas_pago.length} formas de pago seleccionadas`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Portfolio */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div>
                  <Label>Fotos de trabajos realizados * (mínimo 1)</Label>
                  <div className="mt-2">
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

                  <div className="grid grid-cols-3 gap-4 mt-4">
                    {formData.photos.map((photo, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={photo}
                          alt={`Foto ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-lg shadow-md"
                        />
                        <button
                          onClick={() => removePhoto(idx)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        {idx === 0 && (
                          <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                            Principal
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {formData.photos.length} foto(s) subida(s)
                  </p>
                </div>
              </div>
            )}

            {/* Step 5: Legales */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div 
                  className={`flex items-start gap-4 p-5 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                    formData.acepta_terminos 
                      ? 'bg-green-50 border-green-400 shadow-sm' 
                      : 'bg-gray-50 border-gray-200 hover:border-green-300'
                  }`}
                  onClick={() => setFormData({ ...formData, acepta_terminos: !formData.acepta_terminos })}
                >
                  <div className="relative flex-shrink-0 mt-1">
                    <div className={`w-6 h-6 border-2 rounded-md flex items-center justify-center transition-all ${
                      formData.acepta_terminos
                        ? "bg-green-600 border-green-600"
                        : "bg-white border-gray-300"
                    }`}>
                      {formData.acepta_terminos && (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <strong className={`text-base block mb-2 transition-colors ${
                      formData.acepta_terminos ? "text-green-900" : "text-gray-900"
                    }`}>
                      ✅ Acepto los términos y condiciones *
                    </strong>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      He leído y acepto los términos y condiciones de uso de la plataforma milautonomos.
                    </p>
                    {formData.acepta_terminos && (
                      <div className="mt-2 text-sm font-semibold text-green-700">
                        ✓ Aceptado
                      </div>
                    )}
                  </div>
                </div>

                <div 
                  className={`flex items-start gap-4 p-5 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                    formData.acepta_politica_privacidad 
                      ? 'bg-green-50 border-green-400 shadow-sm' 
                      : 'bg-gray-50 border-gray-200 hover:border-green-300'
                  }`}
                  onClick={() => setFormData({ ...formData, acepta_politica_privacidad: !formData.acepta_politica_privacidad })}
                >
                  <div className="relative flex-shrink-0 mt-1">
                    <div className={`w-6 h-6 border-2 rounded-md flex items-center justify-center transition-all ${
                      formData.acepta_politica_privacidad
                        ? "bg-green-600 border-green-600"
                        : "bg-white border-gray-300"
                    }`}>
                      {formData.acepta_politica_privacidad && (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <strong className={`text-base block mb-2 transition-colors ${
                      formData.acepta_politica_privacidad ? "text-green-900" : "text-gray-900"
                    }`}>
                      ✅ Acepto la política de privacidad *
                    </strong>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      He leído y acepto la política de privacidad y el tratamiento de mis datos personales.
                    </p>
                    {formData.acepta_politica_privacidad && (
                      <div className="mt-2 text-sm font-semibold text-green-700">
                        ✓ Aceptado
                      </div>
                    )}
                  </div>
                </div>

                <div 
                  className={`flex items-start gap-4 p-5 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                    formData.consiente_contacto_clientes 
                      ? 'bg-green-50 border-green-400 shadow-sm' 
                      : 'bg-gray-50 border-gray-200 hover:border-green-300'
                  }`}
                  onClick={() => setFormData({ ...formData, consiente_contacto_clientes: !formData.consiente_contacto_clientes })}
                >
                  <div className="relative flex-shrink-0 mt-1">
                    <div className={`w-6 h-6 border-2 rounded-md flex items-center justify-center transition-all ${
                      formData.consiente_contacto_clientes
                        ? "bg-green-600 border-green-600"
                        : "bg-white border-gray-300"
                    }`}>
                      {formData.consiente_contacto_clientes && (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <strong className={`text-base block mb-2 transition-colors ${
                      formData.consiente_contacto_clientes ? "text-green-900" : "text-gray-900"
                    }`}>
                      ✅ Consiento el contacto de clientes *
                    </strong>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Autorizo a que los clientes registrados en milautonomos puedan contactarme a través de la plataforma.
                    </p>
                    {formData.consiente_contacto_clientes && (
                      <div className="mt-2 text-sm font-semibold text-green-700">
                        ✓ Aceptado
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-900">
                    {[formData.acepta_terminos, formData.acepta_politica_privacidad, formData.consiente_contacto_clientes].filter(Boolean).length} de 3 consentimientos aceptados
                  </p>
                </div>
              </div>
            )}

            {/* Step 6: Revisión final */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertDescription>
                    Revisa toda tu información antes de publicar tu perfil. Podrás editarla después desde tu panel.
                  </AlertDescription>
                </Alert>

                {steps.slice(0, -1).map((step, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">{step.title}</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentStep(idx)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      {idx === 0 && (
                        <>
                          <p>• Nombre: {formData.business_name}</p>
                          <p>• NIF: {formData.cif_nif}</p>
                          <p>• Email: {formData.email_contacto}</p>
                          <p>• Teléfono: {formData.telefono_contacto}</p>
                        </>
                      )}
                      {idx === 1 && (
                        <>
                          <p>• Categorías: {formData.categories.join(', ')}</p>
                          <p>• Descripción: {formData.descripcion_corta.substring(0, Math.min(formData.descripcion_corta.length, 100))}...</p>
                        </>
                      )}
                      {idx === 2 && (
                        <>
                          <p>• Ubicación: {formData.service_area}</p>
                          <p>• Radio: {formData.radio_servicio_km} km</p>
                          <p>• Días: {formData.horario_dias.map(d => diasSemana.find(ds => ds.value === d)?.label).join(', ')}</p>
                          <p>• Horario: {formData.horario_apertura} - {formData.horario_cierre}</p>
                        </>
                      )}
                      {idx === 3 && (
                        <>
                          <p>• Tarifa: {formData.tarifa_base}€</p>
                          <p>• Formas de pago: {formData.formas_pago.join(', ')}</p>
                        </>
                      )}
                      {idx === 4 && (
                        <p>• Fotos subidas: {formData.photos.length}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-4 mt-8">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1 h-12"
                  disabled={isSaving || isSubmitting}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Atrás
                </Button>
              )}
              
              {currentStep < steps.length - 1 ? (
                <Button
                  type="button"
                  onClick={(e) => {
                    console.log("🔴 CLICK DETECTADO EN BOTÓN");
                    e.preventDefault();
                    handleNext();
                  }}
                  className={`flex-1 h-12 bg-blue-600 hover:bg-blue-700 ${currentStep === 0 ? 'w-full' : ''}`}
                  disabled={isSaving || isSubmitting}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      Siguiente
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  className="flex-1 h-12 bg-green-600 hover:bg-green-700"
                  disabled={isSubmitting || isSaving}
                >
                  {isSubmitting || isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Publicando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Publicar perfil
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox"; // Keeping this import as it might be used elsewhere
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
  const [currentStep, setCurrentStep] = useState(0);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  // ✅ NUEVA: Lista AMPLIADA de ciudades principales por provincia
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

  useEffect(() => {
    loadUserAndProfile();
  }, []);

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

  const loadUserAndProfile = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // ✅ CRÍTICO: Solo profesionales pueden acceder
      if (!currentUser.user_type) {
        // Sin tipo → elegir tipo primero
        navigate(createPageUrl("UserTypeSelection"));
        return;
      }
      
      if (currentUser.user_type === "client") {
        // Cliente → ir a búsqueda
        navigate(createPageUrl("Search"));
        return;
      }

      const profiles = await base44.entities.ProfessionalProfile.filter({
        user_id: currentUser.id
      });

      if (profiles[0]) {
        const existingProfile = profiles[0];
        setProfile(existingProfile);

        // ✅ CAMBIO: Si ya está completo Y visible, ir al perfil
        if (existingProfile.onboarding_completed && existingProfile.visible_en_busqueda) {
          navigate(createPageUrl("MyProfile"));
          return;
        }

        // ✅ CARGAR datos existentes para continuar donde lo dejó
        setFormData({
          business_name: existingProfile.business_name || "",
          cif_nif: existingProfile.cif_nif || "",
          email_contacto: existingProfile.email_contacto || currentUser.email,
          telefono_contacto: existingProfile.telefono_contacto || currentUser.phone || "",
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
          acepta_terminos: existingProfile.acepta_terminos || false,
          acepta_politica_privacidad: existingProfile.acepta_politica_privacidad || false,
          consiente_contacto_clientes: existingProfile.consiente_contacto_clientes || false,
        });
      } else {
        // ✅ NUEVO: Pre-cargar datos del usuario
        setFormData(prev => ({
          ...prev,
          email_contacto: currentUser.email,
          telefono_contacto: currentUser.phone || "",
        }));
      }
    } catch (error) {
      console.error("Error loading user and profile:", error);
      base44.auth.redirectToLogin();
    }
  };

  const publishProfileMutation = useMutation({
    mutationFn: async () => {
      // ✅ VALIDACIÓN CRÍTICA: Verificar suscripción activa antes de publicar
      console.log('🔒 Verificando suscripción antes de publicar perfil...');
      
      if (!user.subscription_status || user.subscription_status === "inactivo") {
        throw new Error("No tienes una suscripción activa. Debes contratar un plan antes de publicar tu perfil.");
      }

      if (user.subscription_status !== "actif") {
        throw new Error(`Tu suscripción está en estado "${user.subscription_status}". Necesitas una suscripción activa para publicar.`);
      }

      console.log('✅ Suscripción válida detectada:', user.subscription_status);

      const now = new Date().toISOString();
      const slug = `${formData.business_name.toLowerCase().replace(/\s+/g, '-')}-${profile.id.slice(-6)}`;
      
      // ✅ IMPORTANTE: Guardar perfil como ACTIVO y VISIBLE solo si tiene suscripción
      return base44.entities.ProfessionalProfile.update(profile.id, {
        ...formData,
        imagen_principal: formData.photos[0] || "",
        estado_perfil: "activo",
        visible_en_busqueda: true,
        onboarding_completed: true,
        fecha_publicacion: now,
        slug_publico: slug
      });
    },
    onSuccess: async (data) => {
      // ✅ IMPORTANTE: Actualizar también el usuario para asegurar subscription_status
      try {
        await base44.auth.updateMe({
          user_type: "professionnel"
        });
      } catch (error) {
        console.error("Error updating user type:", error);
      }

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

Ver mi perfil público: https://milautonomos.com/perfil/${data.slug_publico}

Gracias por unirte a milautonomos,
Equipo milautonomos`,
        from_name: "milautonomos"
      });

      toast.success("🎉 ¡Perfil publicado! Los clientes ya pueden encontrarte");
      setCurrentStep(steps.length);
    },
    onError: (error) => {
      console.error('❌ Error al publicar perfil:', error);
      setError(error.message || "Error al publicar el perfil. Verifica que tengas una suscripción activa.");
      toast.error(error.message || "Error al publicar el perfil");
    }
  });

  const steps = [
    {
      title: "Identidad",
      fields: ["business_name", "cif_nif", "email_contacto", "telefono_contacto"]
    },
    {
      title: "Actividad",
      fields: ["categories", "descripcion_corta", "description"] // Added 'description'
    },
    {
      title: "Zona y disponibilidad",
      fields: ["provincia", "ciudad", "municipio", "radio_servicio_km", "horario_dias", "horario_apertura", "horario_cierre"] // Added municipio, apertura, cierre
    },
    {
      title: "Precios y forma de trabajo",
      fields: ["tarifa_base", "facturacion", "formas_pago"] // Added 'facturacion'
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
        const cleanPhone = value.replace(/\s/g, '');
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
      
      // Removed old service_area validation as it's now derived.
      // If `service_area` validation is still needed, it should refer to the derived field.
      // But based on the new steps, it's covered by provincia/ciudad.

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

    // Validar
    if (!validateStep(currentStep)) {
      console.log("❌ Validación falló");
      return;
    }

    console.log("✅ Validación pasó");

    // ✅ CAMBIO: Solo guardar campos relevantes del paso actual
    const stepFields = steps[currentStep].fields;
    const dataToSave = {};
    
    // Solo incluir campos del paso actual
    stepFields.forEach(field => {
      if (formData[field] !== undefined) {
        dataToSave[field] = formData[field];
      }
    });

    // ✅ Siempre incluir campos base necesarios
    dataToSave.user_id = user.id;
    dataToSave.business_name = formData.business_name || "";
    dataToSave.email_contacto = formData.email_contacto || user.email;

    // Guardar en background
    setIsSaving(true);
    try {
      if (profile) {
        // ✅ IMPORTANTE: NO activar perfil hasta el final
        await base44.entities.ProfessionalProfile.update(profile.id, {
          ...dataToSave,
          estado_perfil: "pendiente",
          visible_en_busqueda: false,
          onboarding_completed: false
        });
        console.log("💾 Guardado exitoso (actualización)");
      } else {
        // ✅ Crear con estado PENDIENTE (no visible hasta completar)
        const newProfile = await base44.entities.ProfessionalProfile.create({
          user_id: user.id,
          business_name: formData.business_name || "Nuevo autónomo",
          cif_nif: formData.cif_nif || "",
          email_contacto: formData.email_contacto || user.email,
          telefono_contacto: formData.telefono_contacto || user.phone || "",
          categories: formData.categories || [],
          descripcion_corta: formData.descripcion_corta || "",
          description: formData.description || "",
          service_area: formData.service_area || "",
          provincia: formData.provincia || "",
          ciudad: formData.ciudad || "",
          municipio: formData.municipio || "",
          radio_servicio_km: formData.radio_servicio_km || 10,
          horario_dias: formData.horario_dias || [],
          horario_apertura: formData.horario_apertura || "09:00",
          horario_cierre: formData.horario_cierre || "18:00",
          tarifa_base: parseFloat(formData.tarifa_base) || 0, // Ensure numeric default
          facturacion: formData.facturacion || "autonomo",
          formas_pago: formData.formas_pago || [],
          photos: formData.photos || [],
          estado_perfil: "pendiente",
          visible_en_busqueda: false,
          onboarding_completed: false,
          acepta_terminos: false,
          acepta_politica_privacidad: false,
          consiente_contacto_clientes: false
        });
        setProfile(newProfile);
        console.log("💾 Guardado exitoso (creación en estado PENDIENTE)");
      }
    } catch (error) {
      console.error("⚠️ Error guardando:", error);
      // ✅ CAMBIO: Mostrar error específico pero permitir continuar si es solo un warning
      const errorMessage = error.message || error.toString();
      console.log("Error completo:", errorMessage);
      
      // Si es un error crítico (no puede crear/actualizar), mostrar y detener
      if (errorMessage.includes('required') || errorMessage.includes('violates')) {
        setError("Error al guardar: " + errorMessage + ". Por favor, verifica los datos.");
        setIsSaving(false);
        return;
      }
      
      // Si es otro tipo de error, log pero continuar
      console.warn("⚠️ Error no crítico, continuando...");
    }
    setIsSaving(false);

    // SIEMPRE avanzar si la validación pasó
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

  const handlePublish = async () => {
    // Validate all steps from 0 to 5 (excluding final review)
    for (let i = 0; i < steps.length - 1; i++) {
      if (!validateStep(i)) {
        toast.error(`Completa el paso ${i + 1}: ${steps[i].title} antes de publicar.`);
        setCurrentStep(i);
        return;
      }
    }

    // Save final data before publishing
    setIsSaving(true);
    try {
      if (profile) {
        await base44.entities.ProfessionalProfile.update(profile.id, formData);
        console.log("💾 Guardado final antes de publicar.");
      } else {
        // This case should ideally not happen if create is handled on first step.
        // But as a fallback, if profile somehow isn't created.
        const newProfile = await base44.entities.ProfessionalProfile.create({
          ...formData,
          user_id: user.id,
          estado_perfil: "pendiente",
          visible_en_busqueda: false,
          onboarding_completed: false
        });
        setProfile(newProfile);
        console.log("💾 Perfil creado antes de publicar.");
      }
    } catch (error) {
      console.error("⚠️ Error guardando antes de publicar:", error);
      setError("Error al guardar la información final. Por favor, inténtalo de nuevo.");
      setIsSaving(false);
      return;
    }
    setIsSaving(false); // Reset saving state before actual publish mutation

    await publishProfileMutation.mutateAsync();
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

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
        <p className="ml-3 text-gray-600">Cargando...</p>
      </div>
    );
  }

  // Success screen
  if (currentStep === steps.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full border-0 shadow-2xl">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              ✅ ¡Tu perfil ya está activo!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Tu perfil profesional ahora es visible en las búsquedas de milautonomos
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate(createPageUrl("ProfessionalProfile") + `?id=${user.id}`)}
              >
                Ver mi ficha pública
              </Button>
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => navigate(createPageUrl("Search"))}
              >
                Ver búsquedas de clientes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ MENSAJE si no tiene tipo de usuario
  if (!user.user_type) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Selecciona tu tipo de cuenta
            </h2>
            <p className="text-gray-600 mb-6">
              Primero debes elegir si eres autónomo o cliente.
            </p>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => navigate(createPageUrl("UserTypeSelection"))}
            >
              Elegir tipo de cuenta
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ MENSAJE si no es profesional
  if (user.user_type === "client") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Esta página es solo para autónomos
            </h2>
            <p className="text-gray-600 mb-6">
              Como cliente, puedes buscar y contactar profesionales directamente.
            </p>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => navigate(createPageUrl("Search"))}
            >
              Ir a buscar profesionales
            </Button>
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
            <AlertDescription>{error}</AlertDescription>
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
                        className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.categories.includes(cat)
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                      >
                        <p className="text-sm font-medium">{cat}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {formData.categories.length} seleccionadas
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
                        className={`p-3 border-2 rounded-lg cursor-pointer transition-all text-center ${
                          formData.horario_dias.includes(dia.value)
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                      >
                        <p className="text-sm font-medium">{dia.label}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {formData.horario_dias.length} día(s) seleccionado(s)
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
                  <Label>Formas de pago aceptadas * (selecciona al menos una)</Label>
                  <div className="space-y-2 mt-2">
                    {["Tarjeta", "Transferencia", "Efectivo", "Bizum"].map((forma) => (
                      <div key={forma} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <Checkbox
                          checked={formData.formas_pago.includes(forma)}
                          onCheckedChange={() => toggleFormaPago(forma)}
                        />
                        <label className="text-sm font-medium cursor-pointer flex-1" onClick={() => toggleFormaPago(forma)}>
                          {forma}
                        </label>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {formData.formas_pago.length} seleccionadas
                  </p>
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
                {/* ✅ MEJORADO: Checkbox con check visible */}
                <div 
                  className={`flex items-start gap-4 p-5 rounded-xl border-2 transition-all ${
                    formData.acepta_terminos 
                      ? 'bg-green-50 border-green-400 shadow-sm' 
                      : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="relative flex-shrink-0 mt-1">
                    <input
                      type="checkbox"
                      id="acepta_terminos"
                      checked={formData.acepta_terminos}
                      onChange={(e) => setFormData({ ...formData, acepta_terminos: e.target.checked })}
                      className="peer appearance-none w-6 h-6 border-2 border-gray-300 rounded-md bg-white checked:bg-green-600 checked:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 cursor-pointer transition-all"
                    />
                    {/* ✅ NUEVO: Check visible personalizado */}
                    <svg
                      className="absolute top-0.5 left-0.5 w-5 h-5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <label 
                    htmlFor="acepta_terminos"
                    className="text-sm cursor-pointer flex-1"
                  >
                    <strong className="text-gray-900 text-base">
                      ✅ Acepto los términos y condiciones *
                    </strong>
                    <p className="text-gray-600 mt-2 leading-relaxed">
                      He leído y acepto los términos y condiciones de uso de la plataforma milautonomos.
                    </p>
                  </label>
                </div>

                <div 
                  className={`flex items-start gap-4 p-5 rounded-xl border-2 transition-all ${
                    formData.acepta_politica_privacidad 
                      ? 'bg-green-50 border-green-400 shadow-sm' 
                      : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="relative flex-shrink-0 mt-1">
                    <input
                      type="checkbox"
                      id="acepta_politica"
                      checked={formData.acepta_politica_privacidad}
                      onChange={(e) => setFormData({ ...formData, acepta_politica_privacidad: e.target.checked })}
                      className="peer appearance-none w-6 h-6 border-2 border-gray-300 rounded-md bg-white checked:bg-green-600 checked:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 cursor-pointer transition-all"
                    />
                    <svg
                      className="absolute top-0.5 left-0.5 w-5 h-5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <label 
                    htmlFor="acepta_politica"
                    className="text-sm cursor-pointer flex-1"
                  >
                    <strong className="text-gray-900 text-base">
                      ✅ Acepto la política de privacidad *
                    </strong>
                    <p className="text-gray-600 mt-2 leading-relaxed">
                      He leído y acepto la política de privacidad y el tratamiento de mis datos personales.
                    </p>
                  </label>
                </div>

                <div 
                  className={`flex items-start gap-4 p-5 rounded-xl border-2 transition-all ${
                    formData.consiente_contacto_clientes 
                      ? 'bg-green-50 border-green-400 shadow-sm' 
                      : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="relative flex-shrink-0 mt-1">
                    <input
                      type="checkbox"
                      id="consiente_contacto"
                      checked={formData.consiente_contacto_clientes}
                      onChange={(e) => setFormData({ ...formData, consiente_contacto_clientes: e.target.checked })}
                      className="peer appearance-none w-6 h-6 border-2 border-gray-300 rounded-md bg-white checked:bg-green-600 checked:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 cursor-pointer transition-all"
                    />
                    <svg
                      className="absolute top-0.5 left-0.5 w-5 h-5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <label 
                    htmlFor="consiente_contacto"
                    className="text-sm cursor-pointer flex-1"
                  >
                    <strong className="text-gray-900 text-base">
                      ✅ Consiento el contacto de clientes *
                    </strong>
                    <p className="text-gray-600 mt-2 leading-relaxed">
                      Autorizo a que los clientes registrados en milautonomos puedan contactarme a través de la plataforma.
                    </p>
                  </label>
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
                  disabled={isSaving || publishProfileMutation.isPending}
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
                  disabled={isSaving || publishProfileMutation.isPending}
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
                  onClick={handlePublish}
                  className="flex-1 h-12 bg-green-600 hover:bg-green-700"
                  disabled={publishProfileMutation.isPending || isSaving}
                >
                  {publishProfileMutation.isPending || isSaving ? (
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

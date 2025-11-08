
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQueryClient } from "@tanstack/react-query";
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

  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [profile, setProfile] = useState(null); // This will hold the professional profile once loaded/created
  const [existingProfile, setExistingProfile] = useState(null); // To store the initially loaded profile
  const [uploadingPhoto, setUploadingPhoto] = useState(false); // Re-added this state

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
    activity_other: "", // ✅ NEW FIELD
    metodos_contacto: ['chat_interno'], // ✅ NEW FIELD - default to chat_interno
  });

  // ✅ AMPLIADO: TODAS las provincias españolas ordenadas alfabéticamente
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

  // ✅ AMPLIADO: Ciudades principales por provincia (ordenadas alfabéticamente)
  const ciudadesPorProvincia = {
    "Álava": ["Amurrio", "Llodio", "Salvatierra", "Vitoria-Gasteiz"],
    "Albacete": ["Albacete", "Almansa", "Caudete", "Hellín", "La Roda", "Villarrobledo"],
    "Alicante": ["Alcoy", "Alicante", "Altea", "Aspe", "Benidorm", "Calpe", "Campello", "Crevillente", "Dénia", "Elche", "Elda", "Ibi", "Jávea", "Novelda", "Orihuela", "Petrer", "San Vicente del Raspeig", "Santa Pola", "Torrevieja", "Villajoyosa", "Villena"],
    "Almería": ["Adra", "Almería", "El Ejido", "Huércal-Overa", "Níjar", "Roquetas de Mar", "Vícar"],
    "Asturias": ["Avilés", "Carreño", "Castrillón", "Corvera", "Gijón", "Gozón", "Langreo", "Llanera", "Mieres", "Navia", "Oviedo", "Siero", "Tineo", "Villaviciosa"],
    "Ávila": ["Arenas de San Pedro", "Arévalo", "Ávila", "El Tiemblo"],
    "Badajoz": ["Almendralejo", "Badajoz", "Don Benito", "Mérida", "Montijo", "Olivenza", "Villafranca de los Barros", "Villanueva de la Serena", "Zafra"],
    "Barcelona": ["Badalona", "Barcelona", "Castelldefels", "Cerdanyola del Vallès", "Cornellà de Llobregat", "El Prat de Llobregat", "Esplugues de Llobregat", "Gavà", "Granollers", "Igualada", "L'Hospitalet de Llobregat", "Manresa", "Mataró", "Mollet del Vallès", "Rubí", "Sabadell", "Sant Boi de Llobregat", "Sant Cugat del Vallès", "Sant Feliu de Llobregat", "Santa Coloma de Gramenet", "Sitges", "Terrassa", "Vic", "Viladecans", "Vilanova i la Geltrú"],
    "Burgos": ["Aranda de Duero", "Briviesca", "Burgos", "Miranda de Ebro"],
    "Cáceres": ["Cáceres", "Coria", "Navalmoral de la Mata", "Plasencia", "Trujillo"],
    "Cádiz": ["Algeciras", "Arcos de la Frontera", "Barbate", "Cádiz", "Chiclana de la Frontera", "Conil de la Frontera", "El Puerto de Santa María", "Jerez de la Frontera", "La Línea de la Concepción", "Puerto Real", "Rota", "San Fernando", "Sanlúcar de Barrameda"],
    "Cantabria": ["Camargo", "Castro-Urdiales", "El Astillero", "Laredo", "Piélagos", "Santa Cruz de Bezana", "Santander", "Santoña", "Torrelavega"],
    "Castellón": ["Almassora", "Benicarló", "Benicàssim", "Burriana", "Castellón de la Plana", "La Vall d'Uixó", "Nules", "Onda", "Vila-real", "Vinaròs"],
    "Ciudad Real": ["Alcázar de San Juan", "Ciudad Real", "Daimiel", "Manzanares", "Puertollano", "Tomelloso", "Valdepeñas"],
    "Córdoba": ["Baena", "Cabra", "Córdoba", "Lucena", "Montilla", "Palma del Río", "Peñarroya-Pueblonuevo", "Pozoblanco", "Priego de Córdoba", "Puente Genil"],
    "Cuenca": ["Cuenca", "Quintanar del Rey", "San Clemente", "Tarancón"],
    "Gerona": ["Blanes", "Figueras", "Gerona", "Lloret de Mar", "Olot", "Palafrugell", "Salt"],
    "Granada": ["Almuñécar", "Armilla", "Atarfe", "Baza", "Granada", "Guadix", "Huétor Vega", "Loja", "Maracena", "Motril"],
    "Guadalajara": ["Alovera", "Azuqueca de Henares", "Cabanillas del Campo", "Guadalajara"],
    "Guipúzcoa": ["Andoain", "Beasain", "Éibar", "Hernani", "Hondarribia", "Irún", "Lasarte-Oria", "Mondragón", "Rentería", "San Sebastián", "Zarautz"],
    "Huelva": ["Aljaraque", "Almonte", "Ayamonte", "Cartaya", "Huelva", "Isla Cristina", "Lepe", "Moguer", "Punta Umbría"],
    "Huesca": ["Barbastro", "Fraga", "Huesca", "Jaca", "Monzón"],
    "Islas Baleares": ["Alcúdia", "Calvià", "Ciutadella de Menorca", "Felanitx", "Ibiza", "Inca", "Llucmajor", "Mahón", "Manacor", "Marratxí", "Palma de Mallorca", "Pollensa", "Santa Eulalia del Río"],
    "Jaén": ["Alcalá la Real", "Andújar", "Baeza", "Bailén", "Jaén", "Linares", "Martos", "Úbeda", "Villacarrillo"],
    "La Coruña": ["A Coruña", "Ames", "Arteixo", "Betanzos", "Cambre", "Carballo", "Culleredo", "Ferrol", "Narón", "Oleiros", "Santiago de Compostela"],
    "La Rioja": ["Arnedo", "Calahorra", "Haro", "Lardero", "Logroño"],
    "Las Palmas": ["Agüimes", "Arucas", "Ingenio", "Las Palmas de Gran Canaria", "Mogán", "Puerto del Rosario", "San Bartolomé de Tirajana", "Santa Lucía de Tirajana", "Telde"],
    "León": ["Astorga", "La Bañeza", "León", "Ponferrada", "San Andrés del Rabanedo", "Valencia de Don Juan", "Villablino", "Villaquilambre"],
    "Lérida": ["Balaguer", "La Seu d'Urgell", "Lérida", "Mollerussa", "Tàrrega"],
    "Lugo": ["Foz", "Lugo", "Monforte de Lemos", "Vilalba", "Viveiro"],
    "Madrid": ["Alcalá de Henares", "Alcobendas", "Alcorcón", "Aranjuez", "Arganda del Rey", "Boadilla del Monte", "Collado Villalba", "Colmenar Viejo", "Coslada", "Fuenlabrada", "Galapagar", "Getafe", "Las Rozas", "Leganés", "Madrid", "Majadahonda", "Móstoles", "Parla", "Pinto", "Pozuelo de Alarcón", "Rivas-Vaciamadrid", "San Fernando de Henares", "San Sebastián de los Reyes", "Valdemoro"],
    "Málaga": ["Alhaurín el Grande", "Alhaurín de la Torre", "Antequera", "Benalmádena", "Cártama", "Coín", "Estepona", "Fuengirola", "Málaga", "Manilva", "Marbella", "Mijas", "Nerja", "Rincón de la Victoria", "Ronda", "Torremolinos", "Torrox", "Vélez-Málaga"],
    "Murcia": ["Águilas", "Alcantarilla", "Alhama de Murcia", "Archena", "Caravaca de la Cruz", "Cartagena", "Cieza", "Jumilla", "Las Torres de Cotillas", "Lorca", "Mazarrón", "Molina de Segura", "Murcia", "San Javier", "San Pedro del Pinatar", "Torre-Pacheco", "Totana", "Yecla"],
    "Navarra": ["Barañáin", "Burlada", "Estella", "Pamplona", "Tafalla", "Tudela", "Zizur Mayor"],
    "Orense": ["O Barco de Valdeorras", "O Carballiño", "Orense", "Verín", "Xinzo de Limia"],
    "Palencia": ["Aguilar de Campoo", "Guardo", "Palencia", "Venta de Baños"],
    "Pontevedra": ["Baiona", "Cangas", "Lalín", "Marín", "Moaña", "O Porriño", "Ponteareas", "Pontevedra", "Redondela", "Sanxenxo", "Vigo", "Vilagarcía de Arousa"],
    "Salamanca": ["Béjar", "Ciudad Rodrigo", "Salamanca", "Santa Marta de Tormes"],
    "Santa Cruz de Tenerife": ["Adeje", "Arona", "Granadilla de Abona", "Los Llanos de Aridane", "Puerto de la Cruz", "San Cristóbal de La Laguna", "Santa Cruz de La Palma", "Santa Cruz de Tenerife", "Los Realejos"],
    "Segovia": ["Cuéllar", "El Espinar", "San Ildefonso", "Segovia"],
    "Sevilla": ["Alcalá de Guadaíra", "Bormujos", "Camas", "Carmona", "Coria del Río", "Dos Hermanas", "Écija", "La Rinconada", "Lebrija", "Los Palacios y Villafranca", "Mairena del Aljarafe", "Morón de la Frontera", "San Juan de Aznalfarache", "Sevilla", "Tomares", "Utrera"],
    "Soria": ["Almazán", "El Burgo de Osma", "Soria"],
    "Tarragona": ["Amposta", "Calafell", "Cambrils", "El Vendrell", "Reus", "Roda de Berà", "Salou", "Tarragona", "Tortosa", "Valls", "Vila-seca"],
    "Teruel": ["Alcañiz", "Andorra", "Calamocha", "Teruel"],
    "Toledo": ["Illescas", "Olías del Rey", "Quintanar de la Orden", "Seseña", "Sonseca", "Talavera de la Reina", "Toledo", "Torrijos", "Yuncos"],
    "Valencia": ["Alaquàs", "Alfafar", "Alzira", "Burjassot", "Catarroja", "Cullera", "Gandía", "Manises", "Massamagrell", "Mislata", "Ontinyent", "Paterna", "Quart de Poblet", "Requena", "Sagunto", "Sueca", "Torrent", "Valencia", "Xàtiva", "Xirivella"],
    "Valladolid": ["Arroyo de la Encomienda", "Cigales", "Íscar", "Laguna de Duero", "Medina del Campo", "Peñafiel", "Tudela de Duero", "Valladolid"],
    "Vizcaya": ["Amorebieta", "Barakaldo", "Basauri", "Bermeo", "Bilbao", "Durango", "Erandio", "Galdakao", "Gernika", "Getxo", "Leioa", "Portugalete", "Santurtzi", "Sestao"],
    "Zamora": ["Benavente", "Toro", "Villalpando", "Zamora"],
    "Zaragoza": ["Alagón", "Borja", "Calatayud", "Caspe", "Cuarte de Huerva", "Ejea de los Caballeros", "Tarazona", "Tudela", "Utebo", "Zaragoza", "Zuera"]
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
      console.log('👤 Usuario cargado:', currentUser.email, 'Tipo:', currentUser.user_type);
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      console.error("Error loading user:", error);
      base44.auth.redirectToLogin();
    } finally {
      setIsLoadingUser(false);
    }
  };

  const loadExistingProfile = async () => {
    if (!user || user.user_type !== "professionnel") return;

    try {
      const profiles = await base44.entities.ProfessionalProfile.filter({
        user_id: user.id
      });

      if (profiles[0]) {
        console.log('✅ Perfil existente encontrado');
        const existingProfileData = profiles[0];
        setExistingProfile(existingProfileData);
        setProfile(existingProfileData);

        // Pre-llenar formulario con datos existentes
        setFormData({
          ...formData, // Keep initial state for website/social_links if not present in existingProfile
          business_name: existingProfileData.business_name || "",
          cif_nif: existingProfileData.cif_nif || "",
          email_contacto: existingProfileData.email_contacto || user.email,
          telefono_contacto: existingProfileData.telefono_contacto || user.phone || "",
          categories: existingProfileData.categories || [],
          descripcion_corta: existingProfileData.descripcion_corta || "",
          description: existingProfileData.description || "",
          service_area: existingProfileData.service_area || "",
          provincia: existingProfileData.provincia || "",
          ciudad: existingProfileData.ciudad || "",
          municipio: existingProfileData.municipio || "",
          radio_servicio_km: existingProfileData.radio_servicio_km || 10,
          horario_dias: existingProfileData.horario_dias || [],
          horario_apertura: existingProfileData.horario_apertura || "09:00",
          horario_cierre: existingProfileData.horario_cierre || "18:00",
          tarifa_base: existingProfileData.tarifa_base || "",
          facturacion: existingProfileData.facturacion || "autonomo",
          formas_pago: existingProfileData.formas_pago || [],
          photos: existingProfileData.photos || [],
          website: existingProfileData.website || "",
          social_links: existingProfileData.social_links || { facebook: "", instagram: "", linkedin: "" },
          activity_other: existingProfileData.activity_other || "", // ✅ NEW FIELD
          metodos_contacto: existingProfileData.metodos_contacto || ['chat_interno'], // ✅ NEW FIELD
          acepta_terminos: existingProfileData.acepta_terminos || false, // Default to false if not explicitly true
          acepta_politica_privacidad: existingProfileData.acepta_politica_privacidad || false, // Default to false
          consiente_contacto_clientes: existingProfileData.consiente_contacto_clientes || false, // Default to false
        });

        // If profile is already completed and visible, navigate to MyProfile
        if (existingProfileData.onboarding_completed && existingProfileData.visible_en_busqueda) {
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

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user && user.user_type === "professionnel") {
      loadExistingProfile();
    }
  }, [user]);

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
      id: "identity",
      title: "Identidad",
      fields: ["business_name", "cif_nif", "email_contacto", "telefono_contacto", "metodos_contacto"] // ✅ ADDED metodos_contacto
    },
    {
      id: "activity",
      title: "Actividad",
      fields: ["categories", "activity_other", "descripcion_corta", "description"] // ✅ ADDED activity_other
    },
    {
      id: "location_availability",
      title: "Zona y disponibilidad",
      fields: ["provincia", "ciudad", "municipio", "radio_servicio_km", "horario_dias", "horario_apertura", "horario_cierre"]
    },
    {
      id: "prices_work_method",
      title: "Precios y forma de trabajo",
      fields: ["tarifa_base", "facturacion", "formas_pago"]
    },
    {
      id: "portfolio",
      title: "Portfolio (fotos)",
      fields: ["photos"]
    },
    {
      id: "legal_verification",
      title: "Consentimientos y Legales",
      fields: ["acepta_terminos", "acepta_politica_privacidad", "consiente_contacto_clientes"]
    },
    {
      id: "review",
      title: "Revisión final",
      fields: []
    }
  ];

  const categories = [
    "Electricista", "Fontanero", "Carpintero", "Albañil / Reformas",
    "Jardinero", "Pintor", "Transportista", "Autónomo de limpieza",
    "Asesoría o gestoría", "Empresa multiservicios",
    "Otro tipo de servicio profesional" // ✅ NUEVO
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

      // ✅ MODIFICADO: Teléfono ahora es OPCIONAL, no se valida aquí.
      // if (field === "telefono_contacto") {
      //   const cleanPhone = value.replace(/[^\d+]/g, '');
      //   if (!cleanPhone || cleanPhone.length < 9) {
      //     setError("Teléfono debe tener al menos 9 dígitos");
      //     return false;
      //   }
      // }

      if (field === "metodos_contacto") {
        if (!value || !Array.isArray(value) || value.length === 0) {
          setError("Selecciona al menos un método de contacto");
          return false;
        }
      }

      if (field === "categories") {
        if (!value || value.length === 0) {
          setError("Selecciona al menos una categoría");
          return false;
        }
        
        // ✅ NUEVO: Validar que si se selecciona "Otros", debe especificar el servicio
        if (value.includes("Otro tipo de servicio profesional")) {
          if (!formData.activity_other || formData.activity_other.trim().length < 3) {
            setError('Debes especificar tu tipo de servicio en el campo "Especifica tu servicio"');
            return false;
          }
        }
      }

      if (field === "activity_other") {
        if (formData.categories.includes("Otro tipo de servicio profesional")) {
          if (!value || value.trim().length < 3) {
            setError('La especificación del servicio debe tener al menos 3 caracteres.');
            return false;
          }
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

    // Only save relevant fields from the current step
    const stepFields = steps[currentStep].fields;
    const dataToSave = {};

    // Include fields from the current step in dataToSave
    stepFields.forEach(field => {
      if (formData[field] !== undefined) {
        dataToSave[field] = formData[field];
      }
    });

    // Always include base fields needed if not in current step
    dataToSave.user_id = user.id;
    dataToSave.business_name = formData.business_name || "Nombre provisional";
    dataToSave.email_contacto = formData.email_contacto || user.email;

    // Make sure optional fields are handled correctly if they were just added to formData
    if (formData.activity_other !== undefined) dataToSave.activity_other = formData.activity_other; // ✅ NEW FIELD
    if (formData.metodos_contacto !== undefined) dataToSave.metodos_contacto = formData.metodos_contacto; // ✅ NEW FIELD


    // Save in background, using isSubmitting to disable buttons during this
    setIsSubmitting(true);
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
        setExistingProfile(updatedProfile); // Also update existingProfile
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
          social_links: formData.social_links || { facebook: "", instagram: "", linkedin: "" },
          metodos_contacto: formData.metodos_contacto || ['chat_interno'], // ✅ NEW FIELD
        });
        setProfile(newProfile);
        setExistingProfile(newProfile); // Also set existingProfile
        console.log("💾 Guardado exitoso (creación de perfil en estado PENDIENTE)");
      }
    } catch (error) {
      console.error("⚠️ Error guardando paso:", error);
      const errorMessage = error.message || error.toString();
      setError("Error al guardar este paso: " + errorMessage + ". Por favor, verifica los datos.");
      setIsSubmitting(false);
      return; // Stop progression on critical save error
    }
    setIsSubmitting(false);

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
    console.log('💾 ========== INICIANDO GUARDADO DE PERFIL ==========');
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

      // Removed subscription verification logic as per outline.
      console.log('✅ Usuario autenticado, procediendo a guardar perfil...');

      // Preparar datos del perfil
      const now = new Date().toISOString();
      const slug = `${formData.business_name.toLowerCase().replace(/\s+/g, '-')}-${existingProfile?.id ? existingProfile.id.slice(-6) : Math.random().toString(36).substring(2, 8)}`;

      const profileData = {
        user_id: user.id,
        business_name: formData.business_name,
        cif_nif: formData.cif_nif,
        email_contacto: formData.email_contacto || user.email,
        telefono_contacto: formData.telefono_contacto || user.phone || "", // Phone is optional now
        categories: formData.categories,
        activity_other: formData.activity_other, // ✅ NEW FIELD
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
        metodos_contacto: formData.metodos_contacto, // ✅ NEW FIELD
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
      if (existingProfile) { // Using 'existingProfile' state variable
        console.log('🔄 Actualizando perfil existente...');
        savedProfile = await base44.entities.ProfessionalProfile.update(
          existingProfile.id,
          profileData
        );
      } else {
        console.log('➕ Creando nuevo perfil...');
        savedProfile = await base44.entities.ProfessionalProfile.create(profileData);
      }

      console.log('✅ Perfil guardado correctamente:', savedProfile.id);
      setProfile(savedProfile); // Update the profile state with the saved data
      setExistingProfile(savedProfile); // Also update existingProfile

      // ✅ Actualizar usuario (user_type, phone, city)
      await base44.auth.updateMe({
        user_type: "professionnel",
        phone: formData.telefono_contacto || user.phone, // Update phone even if optional
        city: formData.ciudad || user.city
      });
      setUser(prevUser => ({ ...prevUser, user_type: "professionnel", phone: formData.telefono_contacto || prevUser.phone, city: formData.ciudad || prevUser.city }));
      console.log('✅ Usuario actualizado correctamente');

      // ✅ Email de confirmación con notificación de activación
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: "✅ Tu perfil ya está publicado en milautonomos",
        body: `Hola ${formData.business_name},

¡Enhorabuena! Tu perfil profesional ya está activo y visible en milautonomos.

🎉 PERFIL ACTIVADO EXITOSAMENTE

Los clientes pueden encontrarte buscando por:
- Tu nombre: ${formData.business_name}
- Tu actividad: ${formData.categories.join(', ')} ${formData.activity_other ? `(${formData.activity_other})` : ''}
- Tu zona: ${formData.service_area}

📊 Estado de tu perfil:
✅ Visible en búsquedas: SÍ
✅ Onboarding completado: SÍ
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

  const renderStep = () => {
    const step = steps[currentStep];

    switch (step.id) {
      case "identity":
        return (
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

            {/* ✅ MODIFICADO: Teléfono ahora es OPCIONAL */}
            <div>
              <Label>Teléfono de contacto (opcional)</Label>
              <Input
                type="tel"
                value={formData.telefono_contacto}
                onChange={(e) => setFormData({ ...formData, telefono_contacto: e.target.value.replace(/[^\d+]/g, '') })}
                placeholder="612345678 o +34612345678"
                maxLength={15}
                className="h-12"
              />
              <p className="text-sm text-gray-500 mt-1">
                Si no añades teléfono, solo podrán contactarte por chat interno
              </p>
            </div>

            {/* ✅ NUEVO: Métodos de contacto preferidos */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <Label className="text-base font-semibold">Métodos de contacto visibles</Label>
              <p className="text-sm text-gray-500 mt-1 mb-3">
                Selecciona cómo quieres que los clientes te contacten
              </p>
              <div className="space-y-2">
                {/* Chat interno - siempre disponible */}
                <div
                  className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border-2 border-blue-300"
                >
                  <Checkbox
                    checked={true}
                    disabled={true}
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-blue-900">
                      💬 Chat interno
                    </span>
                    <p className="text-xs text-blue-700 mt-0.5">Siempre activo (obligatorio)</p>
                  </div>
                </div>

                {/* WhatsApp */}
                <div
                  onClick={() => {
                    if (!formData.telefono_contacto) {
                      toast.warning('Añade un teléfono primero para activar WhatsApp');
                      return;
                    }
                    const metodos = formData.metodos_contacto || ['chat_interno'];
                    if (metodos.includes('whatsapp')) {
                      setFormData({
                        ...formData,
                        metodos_contacto: metodos.filter(m => m !== 'whatsapp')
                      });
                    } else {
                      setFormData({
                        ...formData,
                        metodos_contacto: [...metodos, 'whatsapp']
                      });
                    }
                  }}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200 ${
                    !formData.telefono_contacto 
                      ? 'cursor-not-allowed opacity-50 bg-gray-50 border-gray-200'
                      : 'cursor-pointer hover:bg-gray-50 ' + 
                        (formData.metodos_contacto?.includes('whatsapp')
                          ? 'border-green-600 bg-green-50'
                          : 'border-gray-200')
                  }`}
                >
                  <Checkbox
                    checked={formData.metodos_contacto?.includes('whatsapp') || false}
                    disabled={!formData.telefono_contacto}
                    onChange={(e) => { // Added onChange to handle direct checkbox click
                      e.stopPropagation();
                      if (!formData.telefono_contacto) {
                        toast.warning('Añade un teléfono primero para activar WhatsApp');
                        return;
                      }
                      const metodos = formData.metodos_contacto || ['chat_interno'];
                      if (e.target.checked) {
                        setFormData({ ...formData, metodos_contacto: [...metodos, 'whatsapp'] });
                      } else {
                        setFormData({ ...formData, metodos_contacto: metodos.filter(m => m !== 'whatsapp') });
                      }
                    }}
                  />
                  <div className="flex-1">
                    <span className={`text-sm font-medium ${
                      !formData.telefono_contacto ? 'text-gray-400' : 'text-gray-900'
                    }`}>
                      📱 WhatsApp
                    </span>
                    {!formData.telefono_contacto && (
                      <p className="text-xs text-gray-500 mt-0.5">Requiere teléfono</p>
                    )}
                  </div>
                </div>

                {/* Llamada telefónica */}
                <div
                  onClick={() => {
                    if (!formData.telefono_contacto) {
                      toast.warning('Añade un teléfono primero para activar las llamadas');
                      return;
                    }
                    const metodos = formData.metodos_contacto || ['chat_interno'];
                    if (metodos.includes('telefono')) {
                      setFormData({
                        ...formData,
                        metodos_contacto: metodos.filter(m => m !== 'telefono')
                      });
                    } else {
                      setFormData({
                        ...formData,
                        metodos_contacto: [...metodos, 'telefono']
                      });
                    }
                  }}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200 ${
                    !formData.telefono_contacto 
                      ? 'cursor-not-allowed opacity-50 bg-gray-50 border-gray-200'
                      : 'cursor-pointer hover:bg-gray-50 ' + 
                        (formData.metodos_contacto?.includes('telefono')
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200')
                  }`}
                >
                  <Checkbox
                    checked={formData.metodos_contacto?.includes('telefono') || false}
                    disabled={!formData.telefono_contacto}
                    onChange={(e) => { // Added onChange to handle direct checkbox click
                      e.stopPropagation();
                      if (!formData.telefono_contacto) {
                        toast.warning('Añade un teléfono primero para activar las llamadas');
                        return;
                      }
                      const metodos = formData.metodos_contacto || ['chat_interno'];
                      if (e.target.checked) {
                        setFormData({ ...formData, metodos_contacto: [...metodos, 'telefono'] });
                      } else {
                        setFormData({ ...formData, metodos_contacto: metodos.filter(m => m !== 'telefono') });
                      }
                    }}
                  />
                  <div className="flex-1">
                    <span className={`text-sm font-medium ${
                      !formData.telefono_contacto ? 'text-gray-400' : 'text-gray-900'
                    }`}>
                      📞 Llamada telefónica
                    </span>
                    {!formData.telefono_contacto && (
                      <p className="text-xs text-gray-500 mt-0.5">Requiere teléfono</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "activity":
        return (
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
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {formData.categories.length} {formData.categories.length === 1 ? 'seleccionada' : 'seleccionadas'}
              </p>
            </div>

            {/* ✅ NUEVO: Campo de texto para "Otros" */}
            {formData.categories.includes("Otro tipo de servicio profesional") && (
              <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                <Label className="text-base font-semibold text-yellow-900">
                  Especifica tu servicio *
                </Label>
                <Input
                  value={formData.activity_other}
                  onChange={(e) => setFormData({ ...formData, activity_other: e.target.value })}
                  placeholder="Ej: Instalador de paneles solares, Técnico de fibra óptica, etc."
                  maxLength={100}
                  className="h-12 mt-2 border-yellow-300"
                />
                <p className="text-sm text-yellow-800 mt-2">
                  📝 Describe tu actividad profesional (mínimo 3 caracteres)
                </p>
              </div>
            )}

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
        );

      case "location_availability":
        return (
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
                <SelectContent className="max-h-[300px] overflow-y-auto">
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
        );

      case "prices_work_method":
        return (
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
        );

      case "portfolio":
        return (
          <div className="space-y-4">
            <div>
              <Label>Fotos de trabajos realizados * (mínimo 1)</Label>
              <div className="mt-2">
                <label className="cursor-pointer">
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
                        <p className="text-sm text-gray-600">Haz clic para añadir una foto</p>
                      </>
                    )}
                  </div>
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
        );

      case "legal_verification":
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
              <p className="text-sm text-blue-900 font-medium">
                📋 Lee y acepta los consentimientos necesarios para poder publicar tu perfil
              </p>
            </div>

            {/* ✅ BOTÓN "ACEPTAR TODO" */}
            <div className="mb-6">
              <Button
                type="button"
                onClick={() => {
                  setFormData({
                    ...formData,
                    acepta_terminos: true,
                    acepta_politica_privacidad: true,
                    consiente_contacto_clientes: true
                  });
                  toast.success('✅ Todos los consentimientos aceptados');
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
              >
                ✅ Aceptar todos los consentimientos
              </Button>
            </div>

            {/* ✅ CHECKBOXES SIMPLIFICADOS - Fondo blanco, sin bordes coloridos */}
            <div className="space-y-4">
              {/* Términos y Condiciones */}
              <div 
                className="flex items-start gap-4 p-5 rounded-xl border-2 transition-all cursor-pointer bg-white"
                style={{
                  borderColor: formData.acepta_terminos ? '#3B82F6' : '#E5E7EB'
                }}
                onClick={() => setFormData({ ...formData, acepta_terminos: !formData.acepta_terminos })}
              >
                <div className="relative flex-shrink-0 mt-1">
                  <input
                    type="checkbox"
                    id="acepta_terminos"
                    checked={formData.acepta_terminos}
                    onChange={(e) => {
                      e.stopPropagation();
                      setFormData({ ...formData, acepta_terminos: e.target.checked });
                    }}
                    className="w-6 h-6 border-2 border-gray-400 rounded-md bg-white checked:bg-blue-600 checked:border-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    style={{ accentColor: '#3B82F6' }}
                  />
                </div>
                <label htmlFor="acepta_terminos" className="cursor-pointer flex-1">
                  <strong className="text-gray-900 text-base block mb-1">
                    Términos y Condiciones
                  </strong>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    He leído y acepto los términos y condiciones de uso de la plataforma MilAutónomos.
                  </p>
                </label>
              </div>

              {/* Política de Privacidad */}
              <div 
                className="flex items-start gap-4 p-5 rounded-xl border-2 transition-all cursor-pointer bg-white"
                style={{
                  borderColor: formData.acepta_politica_privacidad ? '#3B82F6' : '#E5E7EB'
                }}
                onClick={() => setFormData({ ...formData, acepta_politica_privacidad: !formData.acepta_politica_privacidad })}
              >
                <div className="relative flex-shrink-0 mt-1">
                  <input
                    type="checkbox"
                    id="acepta_politica"
                    checked={formData.acepta_politica_privacidad}
                    onChange={(e) => {
                      e.stopPropagation();
                      setFormData({ ...formData, acepta_politica_privacidad: e.target.checked });
                    }}
                    className="w-6 h-6 border-2 border-gray-400 rounded-md bg-white checked:bg-blue-600 checked:border-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    style={{ accentColor: '#3B82F6' }}
                  />
                </div>
                <label htmlFor="acepta_politica" className="cursor-pointer flex-1">
                  <strong className="text-gray-900 text-base block mb-1">
                    Política de Privacidad
                  </strong>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Acepto la política de privacidad y el tratamiento de mis datos personales según el RGPD.
                  </p>
                </label>
              </div>

              {/* Consentimiento de Contacto */}
              <div 
                className="flex items-start gap-4 p-5 rounded-xl border-2 transition-all cursor-pointer bg-white"
                style={{
                  borderColor: formData.consiente_contacto_clientes ? '#3B82F6' : '#E5E7EB'
                }}
                onClick={() => setFormData({ ...formData, consiente_contacto_clientes: !formData.consiente_contacto_clientes })}
              >
                <div className="relative flex-shrink-0 mt-1">
                  <input
                    type="checkbox"
                    id="consiente_contacto"
                    checked={formData.consiente_contacto_clientes}
                    onChange={(e) => {
                      e.stopPropagation();
                      setFormData({ ...formData, consiente_contacto_clientes: e.target.checked });
                    }}
                    className="w-6 h-6 border-2 border-gray-400 rounded-md bg-white checked:bg-blue-600 checked:border-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    style={{ accentColor: '#3B82F6' }}
                  />
                </div>
                <label htmlFor="consiente_contacto" className="cursor-pointer flex-1">
                  <strong className="text-gray-900 text-base block mb-1">
                    Consentimiento de Contacto
                  </strong>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Consiento en que los clientes puedan contactarme a través de la plataforma para solicitar presupuestos y servicios.
                  </p>
                </label>
              </div>
            </div>

            {/* ✅ INFORMACIÓN LEGAL SIMPLIFICADA - Sin contador de color */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 mt-6">
              <p className="text-sm text-gray-700 leading-relaxed">
                Al aceptar estos consentimientos, confirmas que has leído y entendido nuestras políticas. 
                Puedes retirar tu consentimiento en cualquier momento desde tu panel de usuario.
              </p>
            </div>
          </div>
        );

      case "review":
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
              <p className="text-sm text-blue-900">
                📋 Revisa toda tu información antes de publicar tu perfil profesional.
                Podrás editarla después desde tu panel de usuario.
              </p>
            </div>

            {/* Identity Section */}
            <div className="border-b pb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Identidad</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep(0)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Editar
                </Button>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>Nombre:</strong> {formData.business_name}</p>
                <p><strong>NIF:</strong> {formData.cif_nif}</p>
                <p><strong>Email:</strong> {formData.email_contacto || user?.email}</p>
                <p><strong>Teléfono:</strong> {formData.telefono_contacto || "No especificado"}</p>
                <p><strong>Métodos de contacto:</strong> {formData.metodos_contacto?.length > 0 ? formData.metodos_contacto.map(m => {
                  switch(m) {
                    case 'chat_interno': return 'Chat Interno';
                    case 'whatsapp': return 'WhatsApp';
                    case 'telefono': return 'Llamada Telefónica';
                    default: return m;
                  }
                }).join(", ") : "Ninguno"}</p>
              </div>
            </div>

            {/* Activity Section */}
            <div className="border-b pb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Actividad</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep(1)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Editar
                </Button>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>Categorías:</strong> {formData.categories.join(", ") || "Sin especificar"}</p>
                {formData.categories.includes("Otro tipo de servicio profesional") && (
                  <p><strong>Servicio específico:</strong> {formData.activity_other || "No especificado"}</p>
                )}
                <p><strong>Descripción:</strong> {formData.descripcion_corta || "Sin descripción"}</p>
              </div>
            </div>

            {/* Location Section */}
            <div className="border-b pb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Ubicación</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep(2)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Editar
                </Button>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>Provincia:</strong> {formData.provincia}</p>
                <p><strong>Ciudad:</strong> {formData.ciudad}</p>
                <p><strong>Municipio:</strong> {formData.municipio || "No especificado"}</p>
                <p><strong>Radio de servicio:</strong> {formData.radio_servicio_km} km</p>
              </div>
            </div>

            {/* Schedule and Rates Section */}
            <div className="border-b pb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Horarios y Tarifas</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep(3)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Editar
                </Button>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>Días:</strong> {formData.horario_dias.map(d => diasSemana.find(ds => ds.value === d)?.label).join(', ') || "No especificado"}</p>
                <p><strong>Horario:</strong> {formData.horario_apertura} - {formData.horario_cierre}</p>
                <p><strong>Tarifa base:</strong> {formData.tarifa_base}€</p>
                <p><strong>Formas de pago:</strong> {formData.formas_pago.join(", ") || "No especificado"}</p>
              </div>
            </div>

            {/* Photos Section */}
            <div className="pb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Fotos</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep(4)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Editar
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.photos.length > 0 ? (
                  formData.photos.map((photo, idx) => (
                    <img
                      key={idx}
                      src={photo}
                      alt={`Foto ${idx + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ))
                ) : (
                  <p className="text-sm text-gray-500 col-span-full">Sin fotos añadidas</p>
                )}
              </div>
            </div>

            {/* Legal Confirmations */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-sm mb-3">Confirmaciones legales</h3>
              <div className="space-y-2 text-xs text-gray-700">
                <p>{formData.acepta_terminos ? '✓' : '✗'} Acepto los términos y condiciones</p>
                <p>{formData.acepta_politica_privacidad ? '✓' : '✗'} Acepto la política de privacidad</p>
                <p>{formData.consiente_contacto_clientes ? '✓' : '✗'} Consiento ser contactado por clientes</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };


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

            {renderStep()}

            {/* Navigation */}
            <div className="flex gap-4 mt-8">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1 h-12"
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
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
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
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

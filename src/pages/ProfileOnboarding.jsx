
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
import ModernCheckbox from "../components/ui/ModernCheckbox";
import { Link } from "react-router-dom";
import { useLanguage } from "../components/ui/LanguageSwitcher";

export default function ProfileOnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const fromCheckout = searchParams.get("from") === "checkout";

  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [profile, setProfile] = useState(null);
  const [existingProfile, setExistingProfile] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

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
    disponibilidad_tipo: "laborables",
    horario_apertura: "09:00",
    horario_cierre: "18:00",
    tarifa_base: "",
    facturacion: "autonomo",
    formas_pago: [],
    photos: [],
    acepta_terminos: false,
    acepta_politica_privacidad: false,
    consiente_contacto_clientes: false,
    website: "",
    social_links: { facebook: "", instagram: "", linkedin: "" },
    activity_other: "",
    metodos_contacto: ['chat_interno'],
  });

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
    "Santa Cruz de Tenerife": ["Adeje", "Arona", "Granadilla de Abona", "Los Llanos de Aridane", "Puerto de la Cruz", "San Cristóbal de La Laguna", "Santa Cruz de Tenerife", "Los Realejos"],
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

  const diasSemana = [
    { value: "lunes", label: "Lunes" },
    { value: "martes", label: "Martes" },
    { value: "miercoles", label: "Miércoles" },
    { value: "jueves", label: "Jueves" },
    { value: "viernes", label: "Viernes" },
    { value: "sabado", label: "Sábado" },
    { value: "domingo", label: "Domingo" }
  ];

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

        setFormData({
          ...formData,
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
          disponibilidad_tipo: existingProfileData.disponibilidad_tipo || "laborables",
          horario_apertura: existingProfileData.horario_apertura || "09:00",
          horario_cierre: existingProfileData.horario_cierre || "18:00",
          tarifa_base: existingProfileData.tarifa_base || "",
          facturacion: existingProfileData.facturacion || "autonomo",
          formas_pago: existingProfileData.formas_pago || [],
          photos: existingProfileData.photos || [],
          website: existingProfileData.website || "",
          social_links: existingProfileData.social_links || { facebook: "", instagram: "", linkedin: "" },
          activity_other: existingProfileData.activity_other || "",
          metodos_contacto: existingProfileData.metodos_contacto || ['chat_interno'],
          acepta_terminos: existingProfileData.acepta_terminos || false,
          acepta_politica_privacidad: existingProfileData.acepta_politica_privacidad || false,
          consiente_contacto_clientes: existingProfileData.consiente_contacto_clientes || false,
        });

        if (existingProfileData.onboarding_completed && existingProfileData.visible_en_busqueda) {
          navigate(createPageUrl("MyProfile"));
        }

      } else {
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
      title: t('identity'),
      fields: ["business_name", "cif_nif", "email_contacto", "telefono_contacto", "metodos_contacto"]
    },
    {
      id: "activity",
      title: t('activity'),
      fields: ["categories", "activity_other", "descripcion_corta", "description"]
    },
    {
      id: "location_availability",
      title: t('zoneAndAvailability'),
      fields: ["provincia", "ciudad", "municipio", "radio_servicio_km", "disponibilidad_tipo", "horario_apertura", "horario_cierre"]
    },
    {
      id: "prices_work_method",
      title: t('pricesAndWorkMethod'),
      fields: ["tarifa_base", "facturacion", "formas_pago"]
    },
    {
      id: "portfolio",
      title: t('portfolioPhotos'),
      fields: ["photos"]
    },
    {
      id: "legal_verification",
      title: t('consentsAndLegal'),
      fields: ["acepta_terminos", "acepta_politica_privacidad", "consiente_contacto_clientes"]
    },
    {
      id: "review",
      title: t('finalReview'),
      fields: []
    }
  ];

  const categories = [
    "Electricista", "Fontanero", "Carpintero", "Albañil / Reformas",
    "Jardinero", "Pintor", "Transportista", "Autónomo de limpieza",
    "Asesoría o gestoría", "Empresa multiservicios",
    "Otro tipo de servicio profesional"
  ].sort();

  const progress = ((currentStep + 1) / steps.length) * 100;

  const validateStep = (stepIndex) => {
    const step = steps[stepIndex];
    const fieldsToValidate = step.fields;

    for (const field of fieldsToValidate) {
      const value = formData[field];

      if (field === "business_name") {
        if (!value || value.trim().length < 2) {
          setError(t('professionalNameMinChars'));
          return false;
        }
      }

      if (field === "cif_nif") {
        const cleanValue = value.trim();
        if (!cleanValue || cleanValue.length < 8) {
          setError(t('cifNifMinChars'));
          return false;
        }
      }

      if (field === "email_contacto") {
        if (!value || !value.includes('@')) {
          setError(t('invalidEmail'));
          return false;
        }
      }

      if (field === "metodos_contacto") {
        // Chat interno is always implicitly selected, so just check for length
        if (!value || !Array.isArray(value) || value.length === 0) {
          setError(t('selectAtLeastOneContactMethod'));
          return false;
        }
      }

      if (field === "categories") {
        if (!value || value.length === 0) {
          setError(t('selectAtLeastOneCategory'));
          return false;
        }

        if (value.includes("Otro tipo de servicio profesional")) {
          if (!formData.activity_other || formData.activity_other.trim().length < 3) {
            setError(t('specifyServiceIfOther'));
            return false;
          }
        }
      }

      if (field === "activity_other") {
        if (formData.categories.includes("Otro tipo de servicio profesional")) {
          if (!value || value.trim().length < 3) {
            setError(t('serviceSpecMinChars'));
            return false;
          }
        }
      }

      if (field === "descripcion_corta") {
        if (!value || value.length < 20) {
          setError(t('shortDescriptionMinChars'));
          return false;
        }
      }

      if (field === "provincia") {
        if (!value || value.trim().length === 0) {
          setError(t('selectProvince'));
          return false;
        }
      }

      if (field === "ciudad") {
        if (!value || value.trim().length === 0) {
          setError(t('selectCity'));
          return false;
        }
      }

      if (field === "disponibilidad_tipo") {
        if (!value || value.trim().length === 0) {
          setError(t('selectAvailabilityType'));
          return false;
        }
      }

      if (field === "formas_pago") {
        if (!value || value.length === 0) {
          setError(t('selectAtLeastOnePaymentMethod'));
          return false;
        }
      }

      if (field === "photos") {
        if (!value || value.length === 0) {
          setError(t('uploadAtLeast1Photo'));
          return false;
        }
      }

      if (field === "acepta_terminos") {
        if (!value) {
          setError(t('acceptTermsAndConditionsError'));
          return false;
        }
      }

      if (field === "acepta_politica_privacidad") {
        if (!value) {
          setError(t('acceptPrivacyPolicyError'));
          return false;
        }
      }

      if (field === "consiente_contacto_clientes") {
        if (!value) {
          setError(t('consentClientContactError'));
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

    if (!validateStep(currentStep)) {
      console.log("❌ Validación falló");
      return;
    }

    console.log("✅ Validación pasó");

    const stepFields = steps[currentStep].fields;
    const dataToSave = {};

    stepFields.forEach(field => {
      if (formData[field] !== undefined) {
        dataToSave[field] = formData[field];
      }
    });

    dataToSave.user_id = user.id;
    dataToSave.business_name = formData.business_name || "Nombre provisional";
    dataToSave.email_contacto = formData.email_contacto || user.email;

    if (formData.activity_other !== undefined) dataToSave.activity_other = formData.activity_other;
    if (formData.metodos_contacto !== undefined) dataToSave.metodos_contacto = formData.metodos_contacto;
    if (formData.disponibilidad_tipo !== undefined) dataToSave.disponibilidad_tipo = formData.disponibilidad_tipo;

    setIsSubmitting(true);
    try {
      if (profile) {
        const updatedProfile = await base44.entities.ProfessionalProfile.update(profile.id, {
          ...dataToSave,
          estado_perfil: "pendiente",
          visible_en_busqueda: false,
          onboarding_completed: false
        });
        setProfile(updatedProfile);
        setExistingProfile(updatedProfile);
        console.log("💾 Guardado exitoso (actualización de paso)");
      } else {
        const newProfile = await base44.entities.ProfessionalProfile.create({
          ...formData,
          user_id: user.id,
          estado_perfil: "pendiente",
          visible_en_busqueda: false,
          onboarding_completed: false,
          radio_servicio_km: formData.radio_servicio_km || 10,
          tarifa_base: parseFloat(formData.tarifa_base) || 0,
          social_links: formData.social_links || { facebook: "", instagram: "", linkedin: "" },
          metodos_contacto: formData.metodos_contacto || ['chat_interno'],
          disponibilidad_tipo: formData.disponibilidad_tipo || "laborables",
        });
        setProfile(newProfile);
        setExistingProfile(newProfile);
        console.log("💾 Guardado exitoso (creación de perfil en estado PENDIENTE)");
      }
    } catch (error) {
      console.error("⚠️ Error guardando paso:", error);
      const errorMessage = error.message || error.toString();
      setError(t('errorSavingStep') + errorMessage + t('pleaseVerifyData'));
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(false);

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

  const handleSubmit = async () => {
    console.log('💾 ========== INICIANDO GUARDADO DE PERFIL ==========');
    setIsSubmitting(true);
    setError(null);

    try {
      for (let i = 0; i < steps.length - 1; i++) {
        if (!validateStep(i)) {
          toast.error(`${t('completeStep')} ${i + 1}: ${steps[i].title} ${t('beforePublishing')}.`);
          setCurrentStep(i);
          setIsSubmitting(false);
          return;
        }
      }

      console.log('✅ Usuario autenticado, procediendo a guardar perfil...');

      const now = new Date().toISOString();
      const slug = `${formData.business_name.toLowerCase().replace(/\s+/g, '-')}-${existingProfile?.id ? existingProfile.id.slice(-6) : Math.random().toString(36).substring(2, 8)}`;

      const profileData = {
        user_id: user.id,
        business_name: formData.business_name,
        cif_nif: formData.cif_nif,
        email_contacto: formData.email_contacto || user.email,
        telefono_contacto: formData.telefono_contacto || user.phone || "",
        categories: formData.categories,
        activity_other: formData.activity_other,
        descripcion_corta: formData.descripcion_corta,
        description: formData.description,
        provincia: formData.provincia,
        ciudad: formData.ciudad,
        municipio: formData.municipio,
        service_area: formData.service_area,
        radio_servicio_km: formData.radio_servicio_km,
        tarifa_base: parseFloat(formData.tarifa_base) || 0,
        disponibilidad_tipo: formData.disponibilidad_tipo,
        horario_apertura: formData.horario_apertura,
        horario_cierre: formData.horario_cierre,
        formas_pago: formData.formas_pago,
        photos: formData.photos,
        imagen_principal: formData.photos[0] || "",
        website: formData.website,
        social_links: formData.social_links,
        metodos_contacto: formData.metodos_contacto,
        price_range: "€€",
        average_rating: 0,
        total_reviews: 0,
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
      if (existingProfile) {
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
      setProfile(savedProfile);
      setExistingProfile(savedProfile);

      await base44.auth.updateMe({
        user_type: "professionnel",
        phone: formData.telefono_contacto || user.phone,
        city: formData.ciudad || user.city
      });
      setUser(prevUser => ({ ...prevUser, user_type: "professionnel", phone: formData.telefono_contacto || prevUser.phone, city: formData.ciudad || prevUser.city }));
      console.log('✅ Usuario actualizado correctamente');

      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: "✅ Tu perfil profesional ya está activo en MisAutónomos",
        body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 40px 20px; text-align: center; }
    .logo { width: 80px; height: 80px; margin: 0 auto 20px; background: white; border-radius: 16px; padding: 12px; }
    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
    .header p { color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 24px; color: #1f2937; margin-bottom: 20px; font-weight: 700; }
    .message { color: #4b5563; line-height: 1.8; font-size: 16px; margin-bottom: 25px; }
    .success-box { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 25px; border-radius: 12px; margin: 30px 0; text-align: center; }
    .success-box h2 { margin: 0 0 15px 0; font-size: 22px; }
    .success-box p { margin: 0; font-size: 15px; opacity: 0.95; }
    .profile-data { background: #f9fafb; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .profile-data h3 { color: #1e40af; margin: 0 0 15px 0; font-size: 18px; }
    .profile-data ul { margin: 0; padding-left: 20px; color: #4b5563; list-style: none; }
    .profile-data li { margin-bottom: 10px; padding-left: 25px; position: relative; }
    .profile-data li:before { content: '✓'; position: absolute; left: 0; top: 0; color: #10b981; font-weight: bold; }
    .tips { background: #eff6ff; padding: 25px; margin: 30px 0; border-radius: 12px; border: 2px solid #3b82f6; }
    .tips h3 { color: #1e40af; margin: 0 0 15px 0; font-size: 18px; }
    .tips ul { margin: 0; padding-left: 20px; color: #1e40af; }
    .tips li { margin-bottom: 12px; line-height: 1.6; }
    .cta { text-align: center; margin: 35px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3); }
    .footer { background: #1f2937; color: #9ca3af; padding: 40px 30px; text-align: center; font-size: 14px; line-height: 1.8; }
    .footer strong { color: #ffffff; display: block; margin-bottom: 5px; font-size: 18px; }
    .footer .tagline { color: #60a5fa; margin-bottom: 15px; font-style: italic; }
    .footer a { color: #60a5fa; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690076ad86e673c796768de5/47f6f564f_ChatGPTImage13nov202511_25_45.png" alt="MisAutónomos" class="logo" />
      <h1>MisAutónomos</h1>
      <p>Tu autónomo de confianza</p>
    </div>

    <div class="content">
      <p class="greeting">¡Enhorabuena, ${formData.business_name}!</p>

      <div class="success-box">
        <h2>🎉 PERFIL ACTIVADO EXITOSAMENTE</h2>
        <p>Tu perfil profesional ya está activo y visible para miles de clientes potenciales</p>
      </div>

      <p class="message">
        Tu perfil en <strong>MisAutónomos</strong> ha sido publicado correctamente y los clientes ya pueden encontrarte en las búsquedas.
      </p>

      <div class="profile-data">
        <h3>📊 Resumen de tu perfil</h3>
        <ul>
          <li><strong>Nombre profesional:</strong> ${formData.business_name}</li>
          <li><strong>Categorías:</strong> ${formData.categories.join(', ')} ${formData.activity_other ? `(${formData.activity_other})` : ''}</li>
          <li><strong>Zona de trabajo:</strong> ${formData.service_area}</li>
          <li><strong>Fotos subidas:</strong> ${formData.photos.length}</li>
          <li><strong>Estado:</strong> Activo y visible</li>
        </ul>
      </div>

      <div class="tips">
        <h3>💡 Consejos para maximizar tu visibilidad</h3>
        <ul>
          <li><strong>Añade más fotos</strong> de tus trabajos recientes para generar confianza</li>
          <li><strong>Responde rápido</strong> a los mensajes de clientes para mejorar tu posicionamiento</li>
          <li><strong>Completa tu descripción</strong> con palabras clave que los clientes buscan</li>
          <li><strong>Pide valoraciones</strong> a tus clientes satisfechos para destacar</li>
        </ul>
      </div>

      <div class="cta">
        <a href="https://misautonomos.es/ProfessionalProfile?id=${user.id}" class="button">
          Ver mi perfil público →
        </a>
      </div>

      <p class="message" style="margin-top: 30px; font-size: 14px; color: #6b7280; text-align: center;">
        ¿Tienes alguna duda? Contacta con nuestro equipo de soporte:<br/>
        <a href="mailto:soporte@misautonomos.es" style="color: #3b82f6; text-decoration: none;">soporte@misautonomos.es</a>
      </p>
    </div>

    <div class="footer">
      <strong>MisAutónomos</strong>
      <p class="tagline">Tu autónomo de confianza</p>
      <p>
        <a href="mailto:soporte@misautonomos.es">soporte@misautonomos.es</a><br/>
        <a href="https://misautonomos.es">misautonomos.es</a>
      </p>
    </div>
  </div>
</body>
</html>
        `,
        from_name: "MisAutónomos"
      });

      toast.success(t('profileCompletedAndPublished'), {
        duration: 5000
      });

      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      queryClient.invalidateQueries({ queryKey: ['professionalProfiles'] });

      setCurrentStep(steps.length);

    } catch (err) {
      console.error("❌ Error guardando perfil:", err);
      setError(err.message || t('errorSavingProfile'));
      toast.error(err.message || t('errorSavingProfile'));
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
      toast.success(t('photoUploadSuccess'));
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error(t('photoUploadError'));
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
        <p className="ml-3 text-gray-600">{t('loading')}</p>
      </div>
    );
  }

  if (!user || user.user_type !== "professionnel") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">{t('restrictedAccess')}</h2>
            <p className="text-gray-600 mb-6">
              {t('professionalOnlyPage')}
            </p>
            <Button
              onClick={() => navigate(createPageUrl("PricingPlans"))}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {t('viewAvailablePlans')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep === steps.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-700"></div>
        </div>

        <Card className="max-w-3xl w-full border-0 shadow-2xl relative z-10 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-400 via-blue-500 to-purple-500"></div>

          <CardContent className="p-8 md:p-12">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-28 h-28 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  <CheckCircle className="w-16 h-16 text-white" strokeWidth={2.5} />
                </div>
                <div className="absolute inset-0 w-28 h-28 rounded-full border-4 border-green-400 animate-ping opacity-75"></div>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
              ✅ {t('profileActiveTitle')}
            </h1>

            <p className="text-lg md:text-xl text-center text-gray-800 font-semibold mb-3 max-w-2xl mx-auto">
              {t('visibleInSearches')} <span className="text-blue-700 font-bold">MisAutónomos</span>
            </p>

            <p className="text-base text-center text-gray-700 mb-8 max-w-xl mx-auto">
              {t('startReceivingContacts')}
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8 max-w-xl mx-auto">
              <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="text-2xl font-bold text-blue-700">✓</div>
                <div className="text-xs text-gray-700 mt-1 font-medium">{t('profileActive')}</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="text-2xl font-bold text-green-700">👁️</div>
                <div className="text-xs text-gray-700 mt-1 font-medium">{t('visibleInSearch')}</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
                <div className="text-2xl font-bold text-purple-700">🚀</div>
                <div className="text-xs text-gray-700 mt-1 font-medium">{t('readyForClients')}</div>
              </div>
            </div>

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
                {t('viewMyPublicProfile')}
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
                {t('viewClientSearches')}
              </Button>
            </div>

            <div className="text-center mb-8">
              <Button
                variant="ghost"
                className="text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                onClick={() => navigate(createPageUrl("MyProfile"))}
              >
                <Edit className="w-4 h-4 mr-2" />
                {t('editMyProfile')}
              </Button>
            </div>

            <div className="border-t border-gray-200 my-8"></div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">💡 {t('tipsToStandOut')}</h3>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold mt-0.5">✓</span>
                      <span>{t('addMorePhotos')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold mt-0.5">✓</span>
                      <span>{t('respondFast')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold mt-0.5">✓</span>
                      <span>{t('askForReviews')}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                {t('needHelp')}{" "}
                <a href="mailto:soporte@misautonomos.es" className="text-blue-600 hover:text-blue-800 font-medium underline">
                  soporte@misautonomos.es
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
              <Label>{t('professionalNameLabel')}</Label>
              <Input
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                placeholder={t('professionalNamePlaceholder')}
                maxLength={100}
                className="h-12"
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.business_name.length}/100 {t('characters')}
              </p>
            </div>

            <div>
              <Label>{t('cifNifLabel')}</Label>
              <Input
                value={formData.cif_nif}
                onChange={(e) => setFormData({ ...formData, cif_nif: e.target.value.toUpperCase() })}
                placeholder={t('cifNifPlaceholder')}
                maxLength={9}
                className="h-12"
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.cif_nif.length}/9 {t('characters')}
              </p>
            </div>

            <div>
              <Label>{t('contactEmailLabel')}</Label>
              <Input
                type="email"
                value={formData.email_contacto}
                onChange={(e) => setFormData({ ...formData, email_contacto: e.target.value })}
                placeholder={t('contactEmailPlaceholder')}
                className="h-12"
              />
            </div>

            <div>
              <Label>{t('contactPhoneOptional')}</Label>
              <Input
                type="tel"
                value={formData.telefono_contacto}
                onChange={(e) => setFormData({ ...formData, telefono_contacto: e.target.value.replace(/[^\d+]/g, '') })}
                placeholder={t('contactPhonePlaceholder')}
                maxLength={15}
                className="h-12"
              />
              <p className="text-sm text-gray-500 mt-1">
                {t('noPhoneOnlyChat')}
              </p>
            </div>

            <div className="border-t border-gray-200 pt-4 mt-4">
              <Label className="text-base font-semibold">{t('visibleContactMethods')}</Label>
              <p className="text-sm text-gray-500 mt-1 mb-3">
                {t('selectHowClientsContact')}
              </p>
              <div className="space-y-2">
                <div
                  className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border-2 border-blue-300"
                >
                  <Checkbox
                    checked={true}
                    disabled={true}
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-blue-900">
                      💬 {t('internalChat')}
                    </span>
                    <p className="text-xs text-blue-700 mt-0.5">{t('alwaysActive')}</p>
                  </div>
                </div>

                <div
                  onClick={() => {
                    if (!formData.telefono_contacto) {
                      toast.warning(t('addPhoneFirstWhatsApp'));
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
                    onChange={(e) => {
                      e.stopPropagation();
                      if (!formData.telefono_contacto) {
                        toast.warning(t('addPhoneFirstWhatsApp'));
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
                      <p className="text-xs text-gray-500 mt-0.5">{t('requiresPhone')}</p>
                    )}
                  </div>
                </div>

                <div
                  onClick={() => {
                    if (!formData.telefono_contacto) {
                      toast.warning(t('addPhoneFirstCall'));
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
                    onChange={(e) => {
                      e.stopPropagation();
                      if (!formData.telefono_contacto) {
                        toast.warning(t('addPhoneFirstCall'));
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
                      📞 {t('phoneCall')}
                    </span>
                    {!formData.telefono_contacto && (
                      <p className="text-xs text-gray-500 mt-0.5">{t('requiresPhone')}</p>
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
              <Label>{t('serviceCategories')} {t('selectAtLeastOne')}</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {categories.map((cat) => (
                  <div
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      formData.categories.includes(cat)
                        ? "border-blue-600 bg-blue-50 shadow-sm"
                        : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                    }`}
                  >
                    <Checkbox
                      checked={formData.categories.includes(cat)}
                      onCheckedChange={() => toggleCategory(cat)}
                      className={`
                        ${formData.categories.includes(cat) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}
                      `}
                    />
                    <p className={`text-sm font-medium transition-colors ${
                      formData.categories.includes(cat) ? "text-blue-900" : "text-gray-700"
                    }`}>
                      {t(cat)}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {formData.categories.length} {formData.categories.length === 1 ? t('selected') : t('selectedPlural')}
              </p>
            </div>

            {formData.categories.includes("Otro tipo de servicio profesional") && (
              <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                <Label className="text-base font-semibold text-yellow-900">
                  {t('specifyYourService')}
                </Label>
                <Input
                  value={formData.activity_other}
                  onChange={(e) => setFormData({ ...formData, activity_other: e.target.value })}
                  placeholder={t('specifyServicePlaceholder')}
                  maxLength={100}
                  className="h-12 mt-2 border-yellow-300"
                />
                <p className="text-sm text-yellow-800 mt-2">
                  📝 {t('describeYourActivity')}
                </p>
              </div>
            )}

            <div>
              <Label>{t('shortDescriptionLabel')} {t('shortDescriptionMax')}</Label>
              <Textarea
                value={formData.descripcion_corta}
                onChange={(e) => setFormData({ ...formData, descripcion_corta: e.target.value.slice(0, 220) })}
                placeholder={t('shortDescriptionPlaceholder')}
                className="h-24"
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.descripcion_corta.length}/220 {t('characters')} ({t('minimum20')})
              </p>
            </div>

            <div>
              <Label>{t('detailedDescriptionOptional')}</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('detailedDescriptionPlaceholder')}
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
                📍 {t('indicateMainLocation')}
              </p>
            </div>

            <div>
              <Label>{t('province')} *</Label>
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
                  <SelectValue placeholder={t('selectYourProvince')} />
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
                <Label>{t('city')} / {t('locality')} * {t('selectFromList')}</Label>
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
                    <SelectValue placeholder={t('selectYourCity')} />
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
                        {formData.provincia} ({t('asMainCity')})
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  ⚠️ {t('onlyFromList')}
                </p>
              </div>
            )}

            {formData.ciudad && (
              <div>
                <Label>{t('neighborhoodOptional')}</Label>
                <Input
                  value={formData.municipio}
                  onChange={(e) => setFormData({ ...formData, municipio: e.target.value })}
                  placeholder={t('neighborhoodPlaceholder')}
                  className="h-12"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {t('specifyNeighborhood')}
                </p>
              </div>
            )}

            {formData.service_area && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">{t('yourMainLocation')}:</p>
                <p className="font-semibold text-gray-900">{formData.service_area}</p>
              </div>
            )}

            <div>
              <Label>{t('serviceRadius')} *</Label>
              <Select
                value={formData.radio_servicio_km.toString()}
                onValueChange={(value) => setFormData({ ...formData, radio_servicio_km: parseInt(value) })}
              >
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 km - {t('onlyMyZone')}</SelectItem>
                  <SelectItem value="10">10 km - {t('cityAndSurroundings')}</SelectItem>
                  <SelectItem value="25">25 km - {t('metropolitanArea')}</SelectItem>
                  <SelectItem value="50">50 km - {t('provinceWide')}</SelectItem>
                  <SelectItem value="100">100+ km - {t('multipleProvinces')}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">
                {t('howFarTravel')}
              </p>
            </div>

            <div>
              <Label>{t('availability')} *</Label>
              <p className="text-sm text-gray-500 mt-1 mb-3">
                {t('whenCanYouWork')}
              </p>
              <div className="grid grid-cols-1 gap-2">
                <div
                  onClick={() => setFormData({ ...formData, disponibilidad_tipo: 'laborables' })}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.disponibilidad_tipo === 'laborables'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    formData.disponibilidad_tipo === 'laborables'
                      ? 'border-blue-600 bg-blue-600'
                      : 'border-gray-300'
                  }`}>
                    {formData.disponibilidad_tipo === 'laborables' && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">📅 {t('weekdays')}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{t('workMondayFriday')}</p>
                  </div>
                </div>

                <div
                  onClick={() => setFormData({ ...formData, disponibilidad_tipo: 'festivos' })}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.disponibilidad_tipo === 'festivos'
                      ? 'border-orange-600 bg-orange-50'
                      : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    formData.disponibilidad_tipo === 'festivos'
                      ? 'border-orange-600 bg-orange-600'
                      : 'border-gray-300'
                  }`}>
                    {formData.disponibilidad_tipo === 'festivos' && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">🎉 {t('weekendsAndHolidays')}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{t('workWeekendsHolidays')}</p>
                  </div>
                </div>

                <div
                  onClick={() => setFormData({ ...formData, disponibilidad_tipo: 'ambos' })}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.disponibilidad_tipo === 'ambos'
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    formData.disponibilidad_tipo === 'ambos'
                      ? 'border-green-600 bg-green-600'
                      : 'border-gray-300'
                  }`}>
                    {formData.disponibilidad_tipo === 'ambos' && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">✅ {t('allWeek')}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{t('availableAnyDay')}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('startTime')}</Label>
                <Input
                  type="time"
                  value={formData.horario_apertura}
                  onChange={(e) => setFormData({ ...formData, horario_apertura: e.target.value })}
                  className="h-12 mt-2"
                />
              </div>

              <div>
                <Label>{t('endTime')}</Label>
                <Input
                  type="time"
                  value={formData.horario_cierre}
                  onChange={(e) => setFormData({ ...formData, horario_cierre: e.target.value })}
                  className="h-12 mt-2"
                />
              </div>
            </div>

            {formData.horario_apertura && formData.horario_cierre && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-green-900">
                  ✓ {t('schedulePreview')}: {
                    formData.disponibilidad_tipo === 'laborables' ? t('weekdays') :
                    formData.disponibilidad_tipo === 'festivos' ? t('weekendsAndHolidays') :
                    t('allWeek')
                  }
                  {' • '}{formData.horario_apertura} – {formData.horario_cierre}
                </p>
              </div>
            )}
          </div>
        );

      case "prices_work_method":
        return (
          <div className="space-y-4">
            <div>
              <Label>{t('baseRateOptional')}</Label>
              <Input
                type="number"
                value={formData.tarifa_base}
                onChange={(e) => setFormData({ ...formData, tarifa_base: e.target.value })}
                placeholder={t('baseRatePlaceholder')}
                min="0"
                step="0.01"
                className="h-12"
              />
              <p className="text-sm text-gray-500 mt-1">
                {t('emptyNoRate')}
              </p>
            </div>

            <div>
              <Label>{t('invoiceType')} *</Label>
              <Select
                value={formData.facturacion}
                onValueChange={(value) => setFormData({ ...formData, facturacion: value })}
              >
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="autonomo">{t('freelancer')}</SelectItem>
                  <SelectItem value="sociedad">{t('company')}</SelectItem>
                  <SelectItem value="otros">{t('other')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-base font-semibold">{t('acceptedPaymentMethods')}</Label>
              <p className="text-sm text-gray-500 mt-1 mb-3">
                {t('selectAtLeastOnePayment')}
              </p>
              <div className="space-y-2">
                {[
                  { key: "Tarjeta", label: t('card') },
                  { key: "Transferencia", label: t('transfer') },
                  { key: "Efectivo", label: t('cash') },
                  { key: "Bizum", label: t('bizum') }
                ].map(({ key, label }) => (
                  <div
                    key={key}
                    onClick={() => toggleFormaPago(key)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      formData.formas_pago.includes(key)
                        ? "border-purple-600 bg-purple-50 shadow-md"
                        : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                      formData.formas_pago.includes(key)
                        ? "bg-purple-600 border-purple-600"
                        : "border-gray-300"
                    }`}>
                      {formData.formas_pago.includes(key) && (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-base font-medium flex-1 transition-colors ${
                      formData.formas_pago.includes(key) ? "text-purple-900" : "text-gray-700"
                    }`}>
                      {label}
                    </span>
                    {formData.formas_pago.includes(key) && (
                      <span className="text-purple-600 text-sm font-semibold">✓ {t('selectedPayment')}</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-900">
                  {formData.formas_pago.length === 0 && "⚠️ " + t('selectAtLeastOnePayment')}
                  {formData.formas_pago.length > 0 && `✓ ${formData.formas_pago.length} ${t('paymentMethodsSelected')}`}
                </p>
              </div>
            </div>
          </div>
        );

      case "portfolio":
        return (
          <div className="space-y-4">
            <div>
              <Label>{t('workPhotos')} * {t('minimum1Photo')}</Label>
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
                        <p className="text-sm text-gray-600">{t('clickToAddPhoto')}</p>
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
                      alt={`${t('photo')} ${idx + 1}`}
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
                        {t('mainPhoto')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {formData.photos.length} {t('photosUploaded')}
              </p>
            </div>
          </div>
        );

      case "legal_verification":
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
              <p className="text-sm text-blue-900 font-medium">
                📋 {t('readAndAcceptConsents')}
              </p>
            </div>

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
                  setError(null);
                  toast.success('✅ ' + t('allConsentsAccepted'));
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
              >
                ✅ {t('acceptAllConsents')}
              </Button>
            </div>

            <div className="space-y-4">
              <ModernCheckbox
                id="acepta_terminos"
                checked={formData.acepta_terminos}
                onChange={(checked) => {
                  setFormData({ ...formData, acepta_terminos: checked });
                  if (checked && error?.includes(t('terms'))) setError(null);
                }}
                required
                error={error?.toLowerCase().includes(t('terms'))}
                label={t('termsAndConditionsLabel')}
                sublabel={
                  <span>
                    {t('acceptTermsAndConditions')}{" "}
                    <Link
                      to={createPageUrl("TermsConditions")}
                      target="_blank"
                      className="text-blue-600 hover:text-blue-800 underline font-semibold"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {t('termsAndConditions')}
                    </Link>
                    {" "}{t('ofPlatformUse')}
                  </span>
                }
              />

              <ModernCheckbox
                id="acepta_politica"
                checked={formData.acepta_politica_privacidad}
                onChange={(checked) => {
                  setFormData({ ...formData, acepta_politica_privacidad: checked });
                  if (checked && error?.toLowerCase().includes(t('privacy'))) setError(null);
                }}
                required
                error={error?.toLowerCase().includes(t('privacy'))}
                label={t('privacyPolicyLabel')}
                sublabel={
                  <span>
                    {t('acceptPrivacyPolicy')}{" "}
                    <Link
                      to={createPageUrl("PrivacyPolicy")}
                      target="_blank"
                      className="text-blue-600 hover:text-blue-800 underline font-semibold"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {t('privacyPolicy')}
                    </Link>
                    {" "}{t('andDataTreatment')}
                  </span>
                }
              />

              <ModernCheckbox
                id="consiente_contacto"
                checked={formData.consiente_contacto_clientes}
                onChange={(checked) => {
                  setFormData({ ...formData, consiente_contacto_clientes: checked });
                  if (checked && error?.toLowerCase().includes(t('contact'))) setError(null);
                }}
                required
                error={error?.toLowerCase().includes(t('contact'))}
                label={t('contactConsentLabel')}
                sublabel={t('consentClientContact')}
              />
            </div>
          </div>
        );

      case "review":
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
              <p className="text-sm text-blue-900">
                📋 {t('reviewAllInfo')}
              </p>
            </div>

            <div className="border-b pb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">{t('identity')}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep(0)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  {t('edit')}
                </Button>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>{t('name')}:</strong> {formData.business_name}</p>
                <p><strong>{t('nif')}:</strong> {formData.cif_nif}</p>
                <p><strong>{t('email')}:</strong> {formData.email_contacto || user?.email}</p>
                <p><strong>{t('phone')}:</strong> {formData.telefono_contacto || t('notSpecified')}</p>
                <p><strong>{t('contactMethods')}:</strong> {formData.metodos_contacto?.length > 0 ? formData.metodos_contacto.map(m => {
                  switch(m) {
                    case 'chat_interno': return t('internalChatMethod');
                    case 'whatsapp': return t('whatsappMethod');
                    case 'telefono': return t('phoneCallMethod');
                    default: return m;
                  }
                }).join(", ") : t('none')}</p>
              </div>
            </div>

            <div className="border-b pb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">{t('activity')}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep(1)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  {t('edit')}
                </Button>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>{t('categoryPlural')}:</strong> {formData.categories.map(c => t(c)).join(", ") || t('notSpecified')}</p>
                {formData.categories.includes("Otro tipo de servicio profesional") && (
                  <p><strong>{t('specificService')}:</strong> {formData.activity_other || t('notSpecified')}</p>
                )}
                <p><strong>{t('description')}:</strong> {formData.descripcion_corta || t('noDescription')}</p>
              </div>
            </div>

            <div className="border-b pb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">{t('locationAndAvailability')}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep(2)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  {t('edit')}
                </Button>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>{t('province')}:</strong> {formData.provincia}</p>
                <p><strong>{t('city')}:</strong> {formData.ciudad}</p>
                <p><strong>{t('neighborhood')}:</strong> {formData.municipio || t('notSpecified')}</p>
                <p><strong>{t('serviceRadius')}:</strong> {formData.radio_servicio_km} km</p>
                <p><strong>{t('availabilityColon')}</strong> {
                  formData.disponibilidad_tipo === 'laborables' ? t('weekdays') :
                  formData.disponibilidad_tipo === 'festivos' ? t('weekendsAndHolidays') :
                  t('allWeek')
                }</p>
                <p><strong>{t('scheduleColon')}</strong> {formData.horario_apertura} - {formData.horario_cierre}</p>
              </div>
            </div>

            <div className="border-b pb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">{t('ratesAndWorkMethod')}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep(3)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  {t('edit')}
                </Button>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>{t('baseRate')}:</strong> {formData.tarifa_base ? `${formData.tarifa_base}€` : t('notSpecified')}</p>
                <p><strong>{t('invoicingType')}:</strong> {formData.facturacion === 'autonomo' ? t('freelancer') : formData.facturacion === 'sociedad' ? t('company') : t('other')}</p>
                <p><strong>{t('paymentMethods')}:</strong> {formData.formas_pago.map(f => {
                  switch(f) {
                    case 'Tarjeta': return t('card');
                    case 'Transferencia': return t('transfer');
                    case 'Efectivo': return t('cash');
                    case 'Bizum': return t('bizum');
                    default: return f;
                  }
                }).join(", ") || t('notSpecified')}</p>
              </div>
            </div>

            <div className="pb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">{t('photos')}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep(4)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  {t('edit')}
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.photos.length > 0 ? (
                  formData.photos.map((photo, idx) => (
                    <img
                      key={idx}
                      src={photo}
                      alt={`${t('photo')} ${idx + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ))
                ) : (
                  <p className="text-sm text-gray-500 col-span-full">{t('noPhotosAdded')}</p>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-sm mb-3">{t('legalConfirmations')}</h3>
              <div className="space-y-2 text-xs text-gray-700">
                <p>{formData.acepta_terminos ? '✓' : '✗'} {t('acceptTerms')}</p>
                <p>{formData.acepta_politica_privacidad ? '✓' : '✗'} {t('acceptPrivacy')}</p>
                <p>{formData.consiente_contacto_clientes ? '✓' : '✗'} {t('consentContact')}</p>
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
            <h1 className="text-2xl font-bold text-gray-900">{t('completeYourProfile')}</h1>
            <span className="text-sm text-gray-600">
              {t('step')} {currentStep + 1} {t('of')} {steps.length}
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

            <div className="flex gap-4 mt-8">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1 h-12"
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('back')}
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
                      {t('saving')}
                    </>
                  ) : (
                    <>
                      {t('next')}
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
                      {t('publishing')}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {t('publishProfile')}
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

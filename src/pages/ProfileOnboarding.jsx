import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, ChevronRight, ChevronLeft, CheckCircle, Upload, X, Instagram, Facebook, Globe, Music, Check } from "lucide-react";

const PROVINCIAS = [
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

const CIUDADES_POR_PROVINCIA = {
  "Madrid": ["Madrid", "Alcalá de Henares", "Móstoles", "Fuenlabrada", "Leganés", "Getafe", "Alcorcón", "Torrejón de Ardoz", "Parla", "Alcobendas", "Las Rozas", "San Sebastián de los Reyes", "Pozuelo de Alarcón", "Rivas-Vaciamadrid", "Valdemoro", "Coslada", "Majadahonda", "Collado Villalba", "Aranjuez", "Arganda del Rey"],
  "Barcelona": ["Barcelona", "Hospitalet de Llobregat", "Badalona", "Terrassa", "Sabadell", "Mataró", "Santa Coloma de Gramenet", "Cornellà de Llobregat", "Sant Boi de Llobregat", "Rubí", "Manresa", "Viladecans", "Castelldefels", "Granollers", "Gavà", "Mollet del Vallès", "Cerdanyola del Vallès", "Sant Cugat del Vallès", "El Prat de Llobregat", "Esplugues de Llobregat"],
  "Valencia": ["Valencia", "Gandía", "Torrent", "Paterna", "Sagunto", "Alzira", "Mislata", "Burjassot", "Xirivella", "Manises", "Ontinyent", "Xàtiva", "Sueca", "Algemesí", "Cullera"],
  "Sevilla": ["Sevilla", "Dos Hermanas", "Alcalá de Guadaíra", "Utrera", "Mairena del Aljarafe", "Los Palacios y Villafranca", "Écija", "La Rinconada", "Camas", "Carmona", "Lebrija", "San Juan de Aznalfarache", "Tomares", "Morón de la Frontera", "Coria del Río"],
  "Málaga": ["Málaga", "Marbella", "Mijas", "Vélez-Málaga", "Fuengirola", "Torremolinos", "Estepona", "Benalmádena", "Rincón de la Victoria", "Antequera", "Alhaurín de la Torre", "Ronda", "Nerja", "Coín"],
  "Alicante": ["Alicante", "Elche", "Torrevieja", "Orihuela", "Benidorm", "Alcoy", "Elda", "San Vicente del Raspeig", "Villena", "Santa Pola", "Calpe", "Dénia", "Jávea", "Altea", "Villajoyosa", "Petrer"],
  "Murcia": ["Murcia", "Cartagena", "Lorca", "Molina de Segura", "Alcantarilla", "Mazarrón", "Yecla", "Águilas", "Caravaca de la Cruz", "Cieza", "Totana", "San Javier", "Torre-Pacheco"],
  "Vizcaya": ["Bilbao", "Barakaldo", "Getxo", "Portugalete", "Santurtzi", "Basauri", "Durango", "Sestao", "Leioa", "Galdakao", "Erandio"],
  "Zaragoza": ["Zaragoza", "Calatayud", "Utebo", "Ejea de los Caballeros", "Cuarte de Huerva", "Tarazona", "Caspe"],
  "Las Palmas": ["Las Palmas de Gran Canaria", "Telde", "Santa Lucía", "Arucas", "Agüimes", "Ingenio", "Mogán", "San Bartolomé de Tirajana"],
  "Islas Baleares": ["Palma", "Calvià", "Manacor", "Llucmajor", "Marratxí", "Inca", "Alcúdia", "Felanitx", "Pollença", "Ibiza", "Mahón"],
  "Guipúzcoa": ["Donostia-San Sebastián", "Irún", "Rentería", "Eibar", "Hernani", "Zarautz", "Hondarribia"],
  "Asturias": ["Oviedo", "Gijón", "Avilés", "Siero", "Mieres", "Langreo", "Castrillón", "Llanera"],
  "A Coruña": ["A Coruña", "Santiago de Compostela", "Ferrol", "Narón", "Oleiros", "Arteixo", "Culleredo", "Carballo"],
  "Pontevedra": ["Vigo", "Pontevedra", "Vilagarcía de Arousa", "Redondela", "Cangas", "Marín", "Sanxenxo", "O Porriño"],
  "Cantabria": ["Santander", "Torrelavega", "Castro Urdiales", "Camargo", "Piélagos", "El Astillero", "Laredo"],
  "Córdoba": ["Córdoba", "Lucena", "Puente Genil", "Montilla", "Priego de Córdoba", "Cabra", "Baena"],
  "Granada": ["Granada", "Motril", "Almuñécar", "Baza", "Loja", "Guadix", "Armilla", "Maracena"],
  "Valladolid": ["Valladolid", "Medina del Campo", "Laguna de Duero", "Arroyo de la Encomienda", "Tudela de Duero"],
  "Navarra": ["Pamplona", "Tudela", "Barañáin", "Burlada", "Estella", "Tafalla", "Villava"],
  "Santa Cruz de Tenerife": ["Santa Cruz de Tenerife", "San Cristóbal de La Laguna", "Arona", "Adeje", "Los Realejos", "Granadilla de Abona", "Puerto de la Cruz"],
  "Almería": ["Almería", "Roquetas de Mar", "El Ejido", "Vícar", "Níjar", "Huércal-Overa", "Adra"],
  "Burgos": ["Burgos", "Miranda de Ebro", "Aranda de Duero", "Villarcayo", "Lerma"],
  "Castellón": ["Castellón de la Plana", "Vila-real", "Burriana", "Vinaròs", "Onda", "Almassora", "Benicàssim"],
  "Albacete": ["Albacete", "Hellín", "Villarrobledo", "Almansa", "La Roda", "Caudete"],
  "Álava": ["Vitoria", "Llodio", "Amurrio"],
  "León": ["León", "Ponferrada", "San Andrés del Rabanedo", "Villaquilambre", "La Bañeza", "Astorga"],
  "Cádiz": ["Cádiz", "Jerez de la Frontera", "Algeciras", "San Fernando", "El Puerto de Santa María", "Chiclana de la Frontera", "La Línea de la Concepción", "Sanlúcar de Barrameda", "Arcos de la Frontera"],
  "Huelva": ["Huelva", "Lepe", "Almonte", "Moguer", "Ayamonte", "Isla Cristina"],
  "Jaén": ["Jaén", "Linares", "Andújar", "Úbeda", "Martos", "Alcalá la Real", "Baeza"],
  "Toledo": ["Toledo", "Talavera de la Reina", "Illescas", "Seseña", "Torrijos", "Quintanar de la Orden"],
  "Tarragona": ["Tarragona", "Reus", "Tortosa", "El Vendrell", "Cambrils", "Valls", "Salou"],
  "Gerona": ["Girona", "Figueres", "Blanes", "Lloret de Mar", "Olot", "Salt"],
  "Lérida": ["Lleida", "Tàrrega", "Mollerussa", "Balaguer", "La Seu d'Urgell"],
  "Badajoz": ["Badajoz", "Mérida", "Don Benito", "Almendralejo", "Villanueva de la Serena", "Zafra"],
  "Cáceres": ["Cáceres", "Plasencia", "Navalmoral de la Mata", "Coria", "Trujillo"],
  "Lugo": ["Lugo", "Monforte de Lemos", "Viveiro", "Villalba", "Ribadeo"],
  "Orense": ["Ourense", "Verín", "O Barco de Valdeorras", "Xinzo de Limia", "Ribadavia"],
  "Salamanca": ["Salamanca", "Béjar", "Ciudad Rodrigo", "Santa Marta de Tormes", "Alba de Tormes"],
  "Ávila": ["Ávila", "Arévalo", "Arenas de San Pedro"],
  "Segovia": ["Segovia", "Cuéllar", "San Ildefonso", "El Espinar"],
  "Soria": ["Soria", "Almazán", "Burgo de Osma"],
  "Zamora": ["Zamora", "Benavente", "Toro", "Villalpando"],
  "Palencia": ["Palencia", "Guardo", "Aguilar de Campoo", "Venta de Baños"],
  "Guadalajara": ["Guadalajara", "Azuqueca de Henares", "Alovera", "Sigüenza"],
  "Cuenca": ["Cuenca", "Tarancón", "Quintanar del Rey", "San Clemente"],
  "Ciudad Real": ["Ciudad Real", "Puertollano", "Tomelloso", "Valdepeñas", "Alcázar de San Juan", "Daimiel"],
  "Teruel": ["Teruel", "Alcañiz", "Andorra", "Calamocha"],
  "Huesca": ["Huesca", "Monzón", "Barbastro", "Jaca", "Sabiñánigo"],
  "La Rioja": ["Logroño", "Calahorra", "Arnedo", "Haro", "Alfaro"]
};

const CATEGORIAS = [
  "Albañil / Reformas",
  "Autónomo de limpieza",
  "Carpintero",
  "Cerrajero",
  "Electricista",
  "Fontanero",
  "Instalador de aire acondicionado",
  "Jardinero",
  "Mantenimiento de piscinas",
  "Mantenimiento general",
  "Pintor",
  "Transportista",
  "Otro tipo de servicio profesional"
];

export default function ProfileOnboardingPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    // Paso 1: Identidad
    business_name: "",
    cif_nif: "",
    email_contacto: "",
    telefono_contacto: "",
    metodos_contacto: ["chat_interno"],

    // Paso 2: Actividad
    categories: [],
    activity_other: "",
    descripcion_corta: "",
    years_experience: "",

    // Paso 3: Ubicación + Precios + Portfolio + Redes
    provincia: "",
    ciudad: "",
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
    website: "",

    // Consentimientos
    acepta_terminos: false,
    acepta_politica_privacidad: false,
    consiente_contacto_clientes: false
  });

  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const profiles = await base44.entities.ProfessionalProfile.filter({
        user_id: currentUser.id
      });

      if (profiles.length > 0 && profiles[0].onboarding_completed) {
        navigate(createPageUrl("MyProfile"));
        return;
      }

      if (profiles.length > 0) {
        setFormData({
          business_name: profiles[0].business_name || "",
          cif_nif: profiles[0].cif_nif || "",
          email_contacto: profiles[0].email_contacto || currentUser.email,
          telefono_contacto: profiles[0].telefono_contacto || currentUser.phone || "",
          metodos_contacto: profiles[0].metodos_contacto || ["chat_interno"],
          categories: profiles[0].categories || [],
          activity_other: profiles[0].activity_other || "",
          descripcion_corta: profiles[0].descripcion_corta || "",
          years_experience: profiles[0].years_experience || "",
          provincia: profiles[0].provincia || "",
          ciudad: profiles[0].ciudad || "",
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
          website: profiles[0].website || "",
          acepta_terminos: profiles[0].acepta_terminos || false,
          acepta_politica_privacidad: profiles[0].acepta_politica_privacidad || false,
          consiente_contacto_clientes: profiles[0].consiente_contacto_clientes || false
        });
      } else {
        setFormData(prev => ({
          ...prev,
          email_contacto: currentUser.email,
          telefono_contacto: currentUser.phone || ""
        }));
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading user:", error);
      base44.auth.redirectToLogin();
    }
  };

  const validateStep1 = () => {
    if (!formData.business_name || formData.business_name.trim().length < 2) {
      toast.error("El nombre profesional debe tener al menos 2 caracteres");
      return false;
    }

    if (!formData.cif_nif || formData.cif_nif.length !== 9) {
      toast.error("El NIF/CIF debe tener exactamente 9 caracteres");
      return false;
    }

    if (!formData.email_contacto || !formData.email_contacto.includes("@")) {
      toast.error("El email no es válido");
      return false;
    }

    if (!formData.telefono_contacto || formData.telefono_contacto.replace(/\D/g, '').length < 9) {
      toast.error("El teléfono debe tener al menos 9 dígitos");
      return false;
    }

    if (formData.metodos_contacto.length === 0) {
      toast.error("Selecciona al menos un método de contacto");
      return false;
    }

    return true;
  };

  const validateStep2 = () => {
    if (formData.categories.length === 0) {
      toast.error("Selecciona una categoría de servicio");
      return false;
    }

    if (formData.categories.includes("Otro tipo de servicio profesional") && !formData.activity_other) {
      toast.error("Especifica tu servicio cuando seleccionas 'Otro tipo de servicio'");
      return false;
    }

    if (!formData.descripcion_corta || formData.descripcion_corta.trim().length < 20) {
      toast.error("La descripción debe tener al menos 20 caracteres");
      return false;
    }

    if (!formData.years_experience || formData.years_experience === "" || parseInt(formData.years_experience) < 0) {
      toast.error("Indica tus años de experiencia (mínimo 0)");
      return false;
    }

    return true;
  };

  const validateStep3 = () => {
    if (!formData.provincia) {
      toast.error("Selecciona una provincia");
      return false;
    }

    if (formData.formas_pago.length === 0) {
      toast.error("Selecciona al menos una forma de pago");
      return false;
    }

    if (!formData.acepta_terminos) {
      toast.error("Debes aceptar los Términos y Condiciones");
      return false;
    }

    if (!formData.acepta_politica_privacidad) {
      toast.error("Debes aceptar la Política de Privacidad");
      return false;
    }

    if (!formData.consiente_contacto_clientes) {
      toast.error("Debes consentir ser contactado por clientes");
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    
    setCurrentStep(currentStep + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;

    setSaving(true);

    try {
      const service_area = formData.ciudad 
        ? `${formData.ciudad}, ${formData.provincia}`
        : formData.provincia;

      const profileData = {
        user_id: user.id,
        business_name: formData.business_name,
        cif_nif: formData.cif_nif,
        email_contacto: formData.email_contacto,
        telefono_contacto: formData.telefono_contacto,
        metodos_contacto: formData.metodos_contacto,
        categories: formData.categories,
        activity_other: formData.activity_other,
        descripcion_corta: formData.descripcion_corta,
        description: formData.descripcion_corta,
        years_experience: parseInt(formData.years_experience) || 0,
        provincia: formData.provincia,
        ciudad: formData.ciudad || "",
        municipio: "",
        service_area: service_area,
        radio_servicio_km: 25,
        disponibilidad_tipo: "ambos",
        horario_apertura: "09:00",
        horario_cierre: "18:00",
        tarifa_base: formData.tarifa_base ? parseFloat(formData.tarifa_base) : 0,
        facturacion: formData.facturacion,
        formas_pago: formData.formas_pago,
        photos: formData.photos,
        social_links: formData.social_links,
        website: formData.website,
        imagen_principal: user.profile_picture || formData.photos[0] || "",
        price_range: "€€",
        average_rating: 0,
        total_reviews: 0,
        estado_perfil: "activo",
        visible_en_busqueda: true,
        onboarding_completed: true,
        acepta_terminos: formData.acepta_terminos,
        acepta_politica_privacidad: formData.acepta_politica_privacidad,
        consiente_contacto_clientes: formData.consiente_contacto_clientes,
        slug_publico: formData.business_name.toLowerCase().replace(/\s+/g, '-'),
        certifications: []
      };

      const existingProfiles = await base44.entities.ProfessionalProfile.filter({
        user_id: user.id
      });

      if (existingProfiles.length > 0) {
        await base44.entities.ProfessionalProfile.update(existingProfiles[0].id, profileData);
      } else {
        await base44.entities.ProfessionalProfile.create(profileData);
      }

      await base44.auth.updateMe({
        user_type: "professionnel",
        full_name: formData.business_name
      });

      toast.success("¡Perfil completado y publicado con éxito!");

      setTimeout(() => {
        navigate(createPageUrl("MyProfile") + "?onboarding=completed");
      }, 1000);
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Error al guardar el perfil: " + error.message);
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede superar los 5MB");
      return;
    }

    setUploadingPhoto(true);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({
        ...formData,
        photos: [...formData.photos, file_url]
      });
      toast.success("✅ Foto añadida");
    } catch (error) {
      toast.error("Error al subir la foto");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = (index) => {
    const newPhotos = [...formData.photos];
    newPhotos.splice(index, 1);
    setFormData({ ...formData, photos: newPhotos });
  };

  const toggleCategory = (category) => {
    setFormData({ ...formData, categories: [category] });
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

  const toggleMetodoContacto = (metodo) => {
    if (metodo === 'chat_interno') return;
    
    const metodos = formData.metodos_contacto;
    if (metodos.includes(metodo)) {
      setFormData({
        ...formData,
        metodos_contacto: metodos.filter(m => m !== metodo)
      });
    } else {
      setFormData({
        ...formData,
        metodos_contacto: [...metodos, metodo]
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const progress = (currentStep / 3) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl border-0 bg-white rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white pb-8">
            <div className="text-center mb-4">
              <h1 className="text-3xl font-bold mb-2">Completa tu perfil profesional</h1>
              <p className="text-blue-100">Paso {currentStep} de 3</p>
            </div>
            <div className="w-full bg-blue-400/30 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </CardHeader>

          <CardContent className="p-6 md:p-8">
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Identidad profesional</h2>
                </div>

                <div>
                  <Label>Nombre profesional *</Label>
                  <p className="text-xs text-gray-500 mb-2">Se mostrará así a los clientes</p>
                  <Input
                    value={formData.business_name}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                    placeholder="Ej: Juan Pérez - Electricista"
                    className={`h-12 ${formData.business_name.length >= 2 ? 'border-green-500' : ''}`}
                  />
                  {formData.business_name.length > 0 && formData.business_name.length < 2 && (
                    <p className="text-xs text-red-500 mt-1">Mínimo 2 caracteres</p>
                  )}
                  {formData.business_name.length >= 2 && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Correcto
                    </p>
                  )}
                </div>

                <div>
                  <Label>NIF/CIF *</Label>
                  <p className="text-xs text-gray-500 mb-2">(Este dato NO se mostrará públicamente)</p>
                  <Input
                    value={formData.cif_nif}
                    onChange={(e) => setFormData({ ...formData, cif_nif: e.target.value.toUpperCase() })}
                    placeholder="12345678A"
                    maxLength={9}
                    className={`h-12 ${formData.cif_nif.length === 9 ? 'border-green-500' : ''}`}
                  />
                  {formData.cif_nif.length > 0 && formData.cif_nif.length !== 9 && (
                    <p className="text-xs text-red-500 mt-1">Debe tener exactamente 9 caracteres</p>
                  )}
                  {formData.cif_nif.length === 9 && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Correcto
                    </p>
                  )}
                </div>

                <div>
                  <Label>Email profesional *</Label>
                  <Input
                    type="email"
                    value={formData.email_contacto}
                    onChange={(e) => setFormData({ ...formData, email_contacto: e.target.value })}
                    placeholder="tu@email.com"
                    className={`h-12 ${formData.email_contacto.includes('@') && formData.email_contacto.includes('.') ? 'border-green-500' : ''}`}
                  />
                  {formData.email_contacto.length > 0 && !formData.email_contacto.includes('@') && (
                    <p className="text-xs text-red-500 mt-1">Email no válido</p>
                  )}
                  {formData.email_contacto.includes('@') && formData.email_contacto.includes('.') && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Correcto
                    </p>
                  )}
                </div>

                <div>
                  <Label>Teléfono *</Label>
                  <Input
                    value={formData.telefono_contacto}
                    onChange={(e) => setFormData({ ...formData, telefono_contacto: e.target.value })}
                    placeholder="+34 612 345 678"
                    className={`h-12 ${formData.telefono_contacto.replace(/\D/g, '').length >= 9 ? 'border-green-500' : ''}`}
                  />
                  {formData.telefono_contacto.length > 0 && formData.telefono_contacto.replace(/\D/g, '').length < 9 && (
                    <p className="text-xs text-red-500 mt-1">Mínimo 9 dígitos</p>
                  )}
                  {formData.telefono_contacto.replace(/\D/g, '').length >= 9 && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Correcto
                    </p>
                  )}
                </div>

                <div>
                  <Label className="mb-3 block">Métodos de contacto visibles</Label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="relative w-5 h-5 flex items-center justify-center">
                        <Checkbox
                          checked={true}
                          disabled
                          className="pointer-events-none data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                        <Check className="w-4 h-4 text-white absolute pointer-events-none" strokeWidth={3} />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Chat directo (siempre activo)</span>
                    </div>

                    <div 
                      className="flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer hover:bg-blue-50"
                      onClick={() => toggleMetodoContacto('telefono')}
                      style={{
                        borderColor: formData.metodos_contacto.includes('telefono') ? '#3B82F6' : '#E5E7EB',
                        backgroundColor: formData.metodos_contacto.includes('telefono') ? '#EFF6FF' : 'white'
                      }}
                    >
                      <div className="relative w-5 h-5 flex items-center justify-center">
                        <Checkbox
                          checked={formData.metodos_contacto.includes('telefono')}
                          className="pointer-events-none data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                        {formData.metodos_contacto.includes('telefono') && (
                          <Check className="w-4 h-4 text-white absolute pointer-events-none" strokeWidth={3} />
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-700">Teléfono</span>
                    </div>

                    <div 
                      className="flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer hover:bg-blue-50"
                      onClick={() => toggleMetodoContacto('whatsapp')}
                      style={{
                        borderColor: formData.metodos_contacto.includes('whatsapp') ? '#3B82F6' : '#E5E7EB',
                        backgroundColor: formData.metodos_contacto.includes('whatsapp') ? '#EFF6FF' : 'white'
                      }}
                    >
                      <div className="relative w-5 h-5 flex items-center justify-center">
                        <Checkbox
                          checked={formData.metodos_contacto.includes('whatsapp')}
                          className="pointer-events-none data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                        {formData.metodos_contacto.includes('whatsapp') && (
                          <Check className="w-4 h-4 text-white absolute pointer-events-none" strokeWidth={3} />
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-700">WhatsApp</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Actividad y servicios</h2>
                </div>

                <div>
                  <Label className="mb-3 block">Categoría de servicio * (elige solo una)</Label>
                  <div className="grid grid-cols-1 gap-3">
                    {CATEGORIAS.map((cat) => (
                      <div
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className="flex items-center gap-3 p-4 border-2 rounded-lg transition-all cursor-pointer hover:bg-blue-50"
                        style={{
                          borderColor: formData.categories.includes(cat) ? '#3B82F6' : '#E5E7EB',
                          backgroundColor: formData.categories.includes(cat) ? '#EFF6FF' : 'white'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.categories.includes(cat)}
                          onChange={() => {}}
                          className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500 pointer-events-none flex-shrink-0"
                        />
                        <span className="text-sm font-medium text-gray-700 flex-1">{cat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {formData.categories.includes("Otro tipo de servicio profesional") && (
                  <div>
                    <Label>Especifica tu servicio *</Label>
                    <Input
                      value={formData.activity_other}
                      onChange={(e) => setFormData({ ...formData, activity_other: e.target.value })}
                      placeholder="Ej: Instalador de paneles solares..."
                      className="h-12"
                    />
                  </div>
                )}

                <div>
                  <Label>Años de experiencia *</Label>
                  <Input
                    type="number"
                    value={formData.years_experience}
                    onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
                    placeholder="5"
                    min="0"
                    max="50"
                    className={`h-12 ${formData.years_experience !== '' && parseInt(formData.years_experience) >= 0 ? 'border-green-500' : ''}`}
                  />
                  {formData.years_experience === '' && (
                    <p className="text-xs text-red-500 mt-1">Campo obligatorio</p>
                  )}
                  {formData.years_experience !== '' && parseInt(formData.years_experience) >= 0 && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Correcto
                    </p>
                  )}
                </div>

                <div>
                  <Label>Descripción corta *</Label>
                  <p className="text-xs text-gray-500 mb-2">Describe brevemente tus servicios (mínimo 20 caracteres)</p>
                  <Textarea
                    value={formData.descripcion_corta}
                    onChange={(e) => setFormData({ ...formData, descripcion_corta: e.target.value })}
                    placeholder="Describe brevemente tus servicios..."
                    className="h-32 resize-none"
                  />
                  <div className="flex justify-between items-center mt-1">
                    <p className={`text-xs ${formData.descripcion_corta.length < 20 ? 'text-red-500' : 'text-green-600'}`}>
                      {formData.descripcion_corta.length}/20 caracteres mínimos
                    </p>
                    {formData.descripcion_corta.length >= 20 && (
                      <Check className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Ubicación, precios y portfolio</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Provincia *</Label>
                    <Select
                      value={formData.provincia}
                      onValueChange={(value) => setFormData({ ...formData, provincia: value, ciudad: "" })}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Selecciona provincia" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {PROVINCIAS.map((prov) => (
                          <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Ciudad (opcional)</Label>
                    <Select
                      value={formData.ciudad}
                      onValueChange={(value) => setFormData({ ...formData, ciudad: value })}
                      disabled={!formData.provincia}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder={formData.provincia ? "Selecciona ciudad" : "Primero selecciona provincia"} />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {formData.provincia && CIUDADES_POR_PROVINCIA[formData.provincia]?.map((ciudad) => (
                          <SelectItem key={ciudad} value={ciudad}>{ciudad}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Tarifa base €/hora (opcional)</Label>
                  <Input
                    type="number"
                    value={formData.tarifa_base}
                    onChange={(e) => setFormData({ ...formData, tarifa_base: e.target.value })}
                    placeholder="35"
                    min="0"
                    className="h-12"
                  />
                </div>

                <div>
                  <Label className="mb-3 block">Formas de pago aceptadas * (mínimo una)</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {["Tarjeta", "Transferencia", "Efectivo", "Bizum"].map((forma) => (
                      <div
                        key={forma}
                        onClick={() => toggleFormaPago(forma)}
                        className="flex items-center gap-2 p-3 border-2 rounded-lg transition-all cursor-pointer hover:bg-purple-50"
                        style={{
                          borderColor: formData.formas_pago.includes(forma) ? '#9333EA' : '#E5E7EB',
                          backgroundColor: formData.formas_pago.includes(forma) ? '#FAF5FF' : 'white'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.formas_pago.includes(forma)}
                          onChange={() => {}}
                          className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-2 focus:ring-purple-500 pointer-events-none"
                        />
                        <span className="text-sm font-medium text-gray-700">{forma}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block">Portfolio de trabajos (opcional)</Label>
                  {formData.photos.length < 10 && (
                    <label className="cursor-pointer block">
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-500 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handlePhotoUpload}
                          disabled={uploadingPhoto}
                        />
                        {uploadingPhoto ? (
                          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                        ) : (
                          <>
                            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm text-gray-600">Haz clic para añadir foto ({formData.photos.length}/10)</p>
                          </>
                        )}
                      </div>
                    </label>
                  )}

                  {formData.photos.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      {formData.photos.map((photo, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={photo}
                            alt={`Foto ${idx + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => removePhoto(idx)}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          {idx === 0 && (
                            <div className="absolute bottom-1 left-1 bg-blue-600 text-white text-xs px-2 py-1 rounded font-semibold">
                              Principal
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label className="mb-3 block">Redes sociales (opcional)</Label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Instagram className="w-5 h-5 text-pink-600" />
                      <Input
                        value={formData.social_links.instagram}
                        onChange={(e) => setFormData({
                          ...formData,
                          social_links: { ...formData.social_links, instagram: e.target.value }
                        })}
                        placeholder="https://instagram.com/tuperfil"
                        className="h-11"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Facebook className="w-5 h-5 text-blue-600" />
                      <Input
                        value={formData.social_links.facebook}
                        onChange={(e) => setFormData({
                          ...formData,
                          social_links: { ...formData.social_links, facebook: e.target.value }
                        })}
                        placeholder="https://facebook.com/tupagina"
                        className="h-11"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-gray-600" />
                      <Input
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="https://tuweb.com"
                        className="h-11"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Music className="w-5 h-5 text-gray-900" />
                      <Input
                        value={formData.social_links.tiktok}
                        onChange={(e) => setFormData({
                          ...formData,
                          social_links: { ...formData.social_links, tiktok: e.target.value }
                        })}
                        placeholder="https://tiktok.com/@tuperfil"
                        className="h-11"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-3">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-gray-900">Consentimientos legales</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData({
                        ...formData,
                        acepta_terminos: true,
                        acepta_politica_privacidad: true,
                        consiente_contacto_clientes: true
                      })}
                      className="h-8 text-xs"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Aceptar todo
                    </Button>
                  </div>
                  
                  <div 
                    className="flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer hover:bg-blue-50 transition-colors"
                    onClick={() => setFormData({ ...formData, acepta_terminos: !formData.acepta_terminos })}
                    style={{
                      borderColor: formData.acepta_terminos ? '#10B981' : '#E5E7EB',
                      backgroundColor: formData.acepta_terminos ? '#F0FDF4' : 'white'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.acepta_terminos}
                      onChange={() => {}}
                      className="w-5 h-5 mt-0.5 text-green-600 rounded border-gray-300 focus:ring-2 focus:ring-green-500 pointer-events-none"
                    />
                    <span className="text-sm text-gray-700 flex-1">
                      Acepto los <a href="/terms" target="_blank" className="text-blue-600 underline font-medium" onClick={(e) => e.stopPropagation()}>Términos y Condiciones</a> de uso de la plataforma
                    </span>
                  </div>

                  <div 
                    className="flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer hover:bg-blue-50 transition-colors"
                    onClick={() => setFormData({ ...formData, acepta_politica_privacidad: !formData.acepta_politica_privacidad })}
                    style={{
                      borderColor: formData.acepta_politica_privacidad ? '#10B981' : '#E5E7EB',
                      backgroundColor: formData.acepta_politica_privacidad ? '#F0FDF4' : 'white'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.acepta_politica_privacidad}
                      onChange={() => {}}
                      className="w-5 h-5 mt-0.5 text-green-600 rounded border-gray-300 focus:ring-2 focus:ring-green-500 pointer-events-none"
                    />
                    <span className="text-sm text-gray-700 flex-1">
                      Acepto la <a href="/privacy" target="_blank" className="text-blue-600 underline font-medium" onClick={(e) => e.stopPropagation()}>Política de Privacidad</a> y tratamiento de datos
                    </span>
                  </div>

                  <div 
                    className="flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer hover:bg-blue-50 transition-colors"
                    onClick={() => setFormData({ ...formData, consiente_contacto_clientes: !formData.consiente_contacto_clientes })}
                    style={{
                      borderColor: formData.consiente_contacto_clientes ? '#10B981' : '#E5E7EB',
                      backgroundColor: formData.consiente_contacto_clientes ? '#F0FDF4' : 'white'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.consiente_contacto_clientes}
                      onChange={() => {}}
                      className="w-5 h-5 mt-0.5 text-green-600 rounded border-gray-300 focus:ring-2 focus:ring-green-500 pointer-events-none"
                    />
                    <span className="text-sm text-gray-700 flex-1">
                      Consiento en que los clientes puedan contactarme a través de la plataforma
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-8">
              {currentStep > 1 && (
                <Button
                  onClick={handleBack}
                  variant="outline"
                  className="flex-1 h-14 font-bold text-base border-2"
                  disabled={saving}
                >
                  <ChevronLeft className="w-5 h-5 mr-2" />
                  Anterior
                </Button>
              )}

              {currentStep < 3 ? (
                <Button
                  onClick={handleNext}
                  className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 font-bold text-base shadow-lg"
                >
                  Siguiente
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex-1 h-14 bg-green-600 hover:bg-green-700 font-bold text-base shadow-lg"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Publicando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
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
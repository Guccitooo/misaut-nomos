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

const CIUDADES_COMUNES = [
  "Madrid", "Barcelona", "Valencia", "Sevilla", "Zaragoza", "Málaga",
  "Murcia", "Palma", "Las Palmas", "Bilbao", "Alicante", "Córdoba",
  "Valladolid", "Vigo", "Gijón", "Hospitalet de Llobregat", "Vitoria",
  "A Coruña", "Granada", "Elche", "Oviedo", "Badalona", "Cartagena",
  "Terrassa", "Jerez de la Frontera", "Sabadell", "Santa Cruz de Tenerife",
  "Móstoles", "Alcalá de Henares", "Pamplona", "Fuenlabrada", "Almería",
  "Leganés", "Donostia-San Sebastián", "Getafe", "Burgos", "Santander",
  "Castellón de la Plana", "Alcorcón", "Albacete", "Otra"
];

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
        imagen_principal: formData.photos[0] || "",
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
        years_experience: 0,
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
                    className="h-12"
                  />
                </div>

                <div>
                  <Label>NIF/CIF *</Label>
                  <p className="text-xs text-gray-500 mb-2">(Este dato NO se mostrará públicamente)</p>
                  <Input
                    value={formData.cif_nif}
                    onChange={(e) => setFormData({ ...formData, cif_nif: e.target.value.toUpperCase() })}
                    placeholder="12345678A"
                    maxLength={9}
                    className="h-12"
                  />
                </div>

                <div>
                  <Label>Email profesional *</Label>
                  <Input
                    type="email"
                    value={formData.email_contacto}
                    onChange={(e) => setFormData({ ...formData, email_contacto: e.target.value })}
                    placeholder="tu@email.com"
                    className="h-12"
                  />
                </div>

                <div>
                  <Label>Teléfono *</Label>
                  <Input
                    value={formData.telefono_contacto}
                    onChange={(e) => setFormData({ ...formData, telefono_contacto: e.target.value })}
                    placeholder="+34 612 345 678"
                    className="h-12"
                  />
                </div>

                <div>
                  <Label className="mb-3 block">Métodos de contacto visibles</Label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <Checkbox
                        checked={true}
                        disabled
                        className="pointer-events-none"
                      />
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
                      <div className="relative">
                        <Checkbox
                          checked={formData.metodos_contacto.includes('telefono')}
                          className="pointer-events-none"
                        />
                        {formData.metodos_contacto.includes('telefono') && (
                          <Check className="w-3 h-3 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
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
                      <div className="relative">
                        <Checkbox
                          checked={formData.metodos_contacto.includes('whatsapp')}
                          className="pointer-events-none"
                        />
                        {formData.metodos_contacto.includes('whatsapp') && (
                          <Check className="w-3 h-3 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
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
                        <div className="relative">
                          <Checkbox
                            checked={formData.categories.includes(cat)}
                            className="pointer-events-none"
                          />
                          {formData.categories.includes(cat) && (
                            <Check className="w-3 h-3 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-700">{cat}</span>
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
                      onValueChange={(value) => setFormData({ ...formData, provincia: value })}
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
                      onValueChange={(value) => setFormData({ ...formData, ciudad: value === "Otra" ? "" : value })}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Selecciona ciudad" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {CIUDADES_COMUNES.map((ciudad) => (
                          <SelectItem key={ciudad} value={ciudad}>{ciudad}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.ciudad === "" && (
                      <Input
                        value={formData.ciudad}
                        onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                        placeholder="Escribe tu ciudad..."
                        className="h-12 mt-2"
                      />
                    )}
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
                        <div className="relative">
                          <Checkbox
                            checked={formData.formas_pago.includes(forma)}
                            className="pointer-events-none"
                          />
                          {formData.formas_pago.includes(forma) && (
                            <Check className="w-3 h-3 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                          )}
                        </div>
                        <span className="text-sm font-medium">{forma}</span>
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
                    className="flex items-start gap-3 cursor-pointer"
                    onClick={() => setFormData({ ...formData, acepta_terminos: !formData.acepta_terminos })}
                  >
                    <div className="relative mt-1">
                      <Checkbox
                        checked={formData.acepta_terminos}
                        className="pointer-events-none"
                      />
                      {formData.acepta_terminos && (
                        <Check className="w-3 h-3 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      )}
                    </div>
                    <span className="text-sm text-gray-700">
                      Acepto los <a href="/terms" target="_blank" className="text-blue-600 underline">Términos y Condiciones</a> de uso de la plataforma
                    </span>
                  </div>

                  <div 
                    className="flex items-start gap-3 cursor-pointer"
                    onClick={() => setFormData({ ...formData, acepta_politica_privacidad: !formData.acepta_politica_privacidad })}
                  >
                    <div className="relative mt-1">
                      <Checkbox
                        checked={formData.acepta_politica_privacidad}
                        className="pointer-events-none"
                      />
                      {formData.acepta_politica_privacidad && (
                        <Check className="w-3 h-3 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      )}
                    </div>
                    <span className="text-sm text-gray-700">
                      Acepto la <a href="/privacy" target="_blank" className="text-blue-600 underline">Política de Privacidad</a> y tratamiento de datos
                    </span>
                  </div>

                  <div 
                    className="flex items-start gap-3 cursor-pointer"
                    onClick={() => setFormData({ ...formData, consiente_contacto_clientes: !formData.consiente_contacto_clientes })}
                  >
                    <div className="relative mt-1">
                      <Checkbox
                        checked={formData.consiente_contacto_clientes}
                        className="pointer-events-none"
                      />
                      {formData.consiente_contacto_clientes && (
                        <Check className="w-3 h-3 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      )}
                    </div>
                    <span className="text-sm text-gray-700">
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
                  className="flex-1 h-12 font-semibold"
                  disabled={saving}
                >
                  <ChevronLeft className="w-5 h-5 mr-2" />
                  Anterior
                </Button>
              )}

              {currentStep < 3 ? (
                <Button
                  onClick={handleNext}
                  className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 font-semibold"
                >
                  Siguiente
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex-1 h-12 bg-green-600 hover:bg-green-700 font-semibold"
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
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, ArrowRight, ArrowLeft, Loader2, AlertCircle, Upload, X, Globe, Facebook, Instagram, Linkedin } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useLanguage } from "../components/ui/LanguageSwitcher";

const CATEGORIES = [
  "Albañil / Reformas", "Autónomo de limpieza", "Carpintero", "Cerrajero",
  "Electricista", "Fontanero", "Instalador de aire acondicionado",
  "Jardinero", "Mantenimiento de piscinas", "Mantenimiento general",
  "Pintor", "Transportista", "Otro tipo de servicio profesional"
];

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

export default function ProfileOnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [waitingForPayment, setWaitingForPayment] = useState(false);

  const paymentSuccess = searchParams.get("payment") === "success";

  const [formData, setFormData] = useState({
    business_name: "",
    cif_nif: "",
    email_contacto: "",
    telefono_contacto: "",
    metodos_contacto: ['chat_interno'],
    category: "",
    activity_other: "",
    descripcion_corta: "",
    provincia: "",
    ciudad: "",
    tarifa_base: "",
    facturacion: "autonomo",
    formas_pago: [],
    photos: [],
    website: "",
    social_links: { facebook: "", instagram: "", linkedin: "" },
    acepta_terminos: false,
    acepta_politica_privacidad: false,
    consiente_contacto_clientes: false,
  });

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (paymentSuccess && user) {
      console.log('💳 Pago exitoso detectado - esperando suscripción activa');
      window.history.replaceState({}, '', createPageUrl("ProfileOnboarding"));
      waitForSubscription();
    }
  }, [paymentSuccess, user]);

  useEffect(() => {
    if (user && !paymentSuccess) {
      checkIfAlreadyCompleted();
    }
  }, [user, paymentSuccess]);

  const loadUser = async () => {
    setIsLoadingUser(true);
    try {
      const currentUser = await base44.auth.me();
      console.log('👤 Usuario cargado:', currentUser.email, 'Tipo:', currentUser.user_type);
      setUser(currentUser);
      setFormData(prev => ({
        ...prev,
        email_contacto: currentUser.email,
        telefono_contacto: currentUser.phone || "",
      }));
    } catch (error) {
      base44.auth.redirectToLogin();
    } finally {
      setIsLoadingUser(false);
    }
  };

  const waitForSubscription = async () => {
    setWaitingForPayment(true);
    try {
      let attempts = 0;
      const maxAttempts = 30;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const subs = await base44.entities.Subscription.filter({ user_id: user.id });
        
        if (subs.length > 0) {
          const sub = subs[0];
          const estado = sub.estado?.toLowerCase();
          
          console.log(`🔍 Intento ${attempts + 1}: Estado = ${estado}`);
          
          if (estado === 'activo' || estado === 'active' || estado === 'en_prueba' || estado === 'trialing') {
            console.log('✅ SUSCRIPCIÓN ACTIVA - Continuando onboarding');
            toast.success('✅ Pago confirmado. Completa tu perfil profesional', { duration: 4000 });
            setWaitingForPayment(false);
            return;
          }
        }
        
        attempts++;
      }
      
      console.log('⚠️ Timeout - permitiendo continuar');
      toast.warning('Continúa con tu perfil. Tu suscripción se activará pronto.', { duration: 5000 });
      setWaitingForPayment(false);
      
    } catch (error) {
      console.error('Error:', error);
      setWaitingForPayment(false);
    }
  };

  const checkIfAlreadyCompleted = async () => {
    try {
      const profiles = await base44.entities.ProfessionalProfile.filter({ user_id: user.id });

      if (profiles[0]?.onboarding_completed && profiles[0]?.visible_en_busqueda) {
        toast.info('Tu perfil ya está completo');
        navigate(createPageUrl("MyProfile"), { replace: true });
      }
    } catch (error) {
      console.error("Error checking profile:", error);
    }
  };

  const validateStep = () => {
    if (currentStep === 0) {
      if (!formData.business_name || formData.business_name.trim().length < 2) {
        setError(t('professionalNameMinChars'));
        return false;
      }
      if (!formData.cif_nif || formData.cif_nif.trim().length < 8) {
        setError(t('cifNifMinChars'));
        return false;
      }
      if (!formData.email_contacto || !formData.email_contacto.includes('@')) {
        setError(t('invalidEmail'));
        return false;
      }
      if (!formData.telefono_contacto || formData.telefono_contacto.replace(/\D/g, '').length < 9) {
        setError(t('phoneRequired'));
        return false;
      }
    }

    if (currentStep === 1) {
      if (!formData.category) {
        setError(t('selectAtLeastOneCategory'));
        return false;
      }
      if (formData.category === "Otro tipo de servicio profesional" && (!formData.activity_other || formData.activity_other.trim().length < 3)) {
        setError(t('specifyServiceIfOther'));
        return false;
      }
      if (!formData.descripcion_corta || formData.descripcion_corta.length < 20) {
        setError(t('shortDescriptionMinChars'));
        return false;
      }
      if (!formData.provincia) {
        setError(t('selectProvince'));
        return false;
      }
    }

    if (currentStep === 2) {
      if (formData.formas_pago.length === 0) {
        setError(t('selectAtLeastOnePaymentMethod'));
        return false;
      }
      if (!formData.acepta_terminos) {
        setError(t('acceptTermsAndConditionsError'));
        return false;
      }
      if (!formData.acepta_politica_privacidad) {
        setError(t('acceptPrivacyPolicyError'));
        return false;
      }
      if (!formData.consiente_contacto_clientes) {
        setError(t('consentClientContactError'));
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    setError(null);
    if (!validateStep()) return;
    setCurrentStep(currentStep + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep(currentStep - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    setError(null);
    if (!validateStep()) return;

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const slug = `${formData.business_name.toLowerCase().replace(/\s+/g, '-')}-${Math.random().toString(36).substring(2, 8)}`;

      const profileData = {
        user_id: user.id,
        business_name: formData.business_name,
        cif_nif: formData.cif_nif,
        email_contacto: formData.email_contacto,
        telefono_contacto: formData.telefono_contacto,
        metodos_contacto: formData.metodos_contacto,
        categories: [formData.category],
        activity_other: formData.activity_other,
        descripcion_corta: formData.descripcion_corta,
        provincia: formData.provincia,
        ciudad: formData.ciudad || "",
        service_area: formData.ciudad ? `${formData.ciudad}, ${formData.provincia}` : formData.provincia,
        tarifa_base: formData.tarifa_base ? parseFloat(formData.tarifa_base) : 0,
        facturacion: formData.facturacion,
        formas_pago: formData.formas_pago,
        photos: formData.photos,
        imagen_principal: formData.photos[0] || "",
        website: formData.website,
        social_links: formData.social_links,
        onboarding_completed: true,
        visible_en_busqueda: true,
        estado_perfil: "activo",
        acepta_terminos: formData.acepta_terminos,
        acepta_politica_privacidad: formData.acepta_politica_privacidad,
        consiente_contacto_clientes: formData.consiente_contacto_clientes,
        fecha_publicacion: now,
        slug_publico: slug,
        disponibilidad_tipo: "laborables",
        horario_apertura: "09:00",
        horario_cierre: "18:00",
        radio_servicio_km: 10,
        description: "",
        municipio: "",
        price_range: "€€",
        average_rating: 0,
        total_reviews: 0
      };

      const profiles = await base44.entities.ProfessionalProfile.filter({ user_id: user.id });

      console.log('📝 Guardando perfil profesional...');
      
      if (profiles[0]) {
        await base44.entities.ProfessionalProfile.update(profiles[0].id, profileData);
      } else {
        await base44.entities.ProfessionalProfile.create(profileData);
      }

      console.log('✅ Perfil guardado');

      // CRITICAL: Update user to professionnel
      await base44.auth.updateMe({
        user_type: "professionnel",
        professional_onboarding_completed: true,
        phone: formData.telefono_contacto,
        city: formData.ciudad || formData.provincia
      });
      
      console.log('✅ Usuario actualizado a professionnel');

      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: "✅ Tu perfil profesional ya está activo",
        body: `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:sans-serif;"><h1>¡Perfil activo!</h1><p>Tu perfil en MisAutónomos está visible para clientes.</p><a href="https://misautonomos.es/MyProfile" style="display:inline-block;background:#3b82f6;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;margin:20px 0;">Ver mi perfil</a></body></html>`,
        from_name: "MisAutónomos"
      });

      console.log('🎉 ONBOARDING COMPLETADO');
      
      toast.success('¡Perfil activado! Redirigiendo...', { duration: 2000 });
      
      queryClient.invalidateQueries();

      setTimeout(() => {
        navigate(createPageUrl("MyProfile") + "?onboarding=completed", { replace: true });
      }, 1500);

    } catch (err) {
      console.error("❌ Error:", err);
      setError(err.message || 'Error al guardar el perfil');
      toast.error(err.message || 'Error al guardar el perfil');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Foto muy grande (máx 5MB)');
      return;
    }

    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, photos: [...formData.photos, file_url] });
      toast.success('Foto subida');
    } catch (error) {
      toast.error('Error subiendo foto');
    }
    setUploadingPhoto(false);
  };

  const removePhoto = (index) => {
    const newPhotos = [...formData.photos];
    newPhotos.splice(index, 1);
    setFormData({ ...formData, photos: newPhotos });
  };

  const toggleFormaPago = (forma) => {
    const formas = formData.formas_pago;
    if (formas.includes(forma)) {
      setFormData({ ...formData, formas_pago: formas.filter(f => f !== forma) });
    } else {
      setFormData({ ...formData, formas_pago: [...formas, forma] });
    }
  };

  const toggleMetodoContacto = (metodo) => {
    const metodos = formData.metodos_contacto;
    if (metodo === 'chat_interno') return;
    
    if (metodos.includes(metodo)) {
      setFormData({ ...formData, metodos_contacto: metodos.filter(m => m !== metodo) });
    } else {
      setFormData({ ...formData, metodos_contacto: [...metodos, metodo] });
    }
  };

  if (isLoadingUser || waitingForPayment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-sm w-full shadow-lg bg-white border-0">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
              <h2 className="text-xl font-bold text-gray-900">
                {waitingForPayment ? 'Verificando pago...' : 'Cargando...'}
              </h2>
              <p className="text-sm text-gray-600">
                {waitingForPayment ? 'Esperando confirmación de Stripe' : 'Preparando tu perfil'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const steps = [
    { title: 'Identidad y contacto', progress: 33 },
    { title: 'Actividad y zona', progress: 66 },
    { title: 'Precios y legal', progress: 100 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h1 className="text-2xl font-bold text-gray-900">Completa tu perfil profesional</h1>
            <span className="text-sm text-gray-600">Paso {currentStep + 1} de 3</span>
          </div>
          <Progress value={steps[currentStep].progress} className="h-2" />
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">{steps[currentStep].title}</h2>

            {currentStep === 0 && (
              <div className="space-y-5">
                <div>
                  <Label>Nombre profesional *</Label>
                  <Input
                    value={formData.business_name}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                    placeholder="Ej: Juan Pérez - Electricista"
                    maxLength={100}
                    className="h-11 mt-1"
                  />
                </div>

                <div>
                  <Label>NIF / CIF *</Label>
                  <Input
                    value={formData.cif_nif}
                    onChange={(e) => setFormData({ ...formData, cif_nif: e.target.value.toUpperCase() })}
                    placeholder="12345678A"
                    maxLength={9}
                    className="h-11 mt-1"
                  />
                </div>

                <div>
                  <Label>Email de contacto *</Label>
                  <Input
                    type="email"
                    value={formData.email_contacto}
                    onChange={(e) => setFormData({ ...formData, email_contacto: e.target.value })}
                    className="h-11 mt-1"
                  />
                </div>

                <div>
                  <Label>Teléfono de contacto *</Label>
                  <Input
                    type="tel"
                    value={formData.telefono_contacto}
                    onChange={(e) => setFormData({ ...formData, telefono_contacto: e.target.value.replace(/[^\d+]/g, '') })}
                    placeholder="612345678"
                    maxLength={15}
                    className="h-11 mt-1"
                  />
                </div>

                <div className="border-t pt-4">
                  <Label className="font-semibold mb-3 block">Métodos de contacto</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-300">
                      <Checkbox checked={true} disabled={true} />
                      <span className="text-sm font-medium">💬 Chat interno</span>
                    </div>

                    <div
                      onClick={() => {
                        if (formData.telefono_contacto.replace(/\D/g, '').length >= 9) {
                          toggleMetodoContacto('whatsapp');
                        }
                      }}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                        formData.telefono_contacto.replace(/\D/g, '').length < 9
                          ? 'opacity-50 bg-gray-50'
                          : formData.metodos_contacto.includes('whatsapp')
                          ? 'border-green-600 bg-green-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <Checkbox
                        checked={formData.metodos_contacto.includes('whatsapp')}
                        disabled={formData.telefono_contacto.replace(/\D/g, '').length < 9}
                      />
                      <span className="text-sm font-medium">📱 WhatsApp</span>
                    </div>

                    <div
                      onClick={() => {
                        if (formData.telefono_contacto.replace(/\D/g, '').length >= 9) {
                          toggleMetodoContacto('telefono');
                        }
                      }}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                        formData.telefono_contacto.replace(/\D/g, '').length < 9
                          ? 'opacity-50 bg-gray-50'
                          : formData.metodos_contacto.includes('telefono')
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <Checkbox
                        checked={formData.metodos_contacto.includes('telefono')}
                        disabled={formData.telefono_contacto.replace(/\D/g, '').length < 9}
                      />
                      <span className="text-sm font-medium">📞 Llamada</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-5">
                <div>
                  <Label>Categoría *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className="h-11 mt-1">
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.category === "Otro tipo de servicio profesional" && (
                  <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
                    <Label>Especifica tu servicio *</Label>
                    <Input
                      value={formData.activity_other}
                      onChange={(e) => setFormData({ ...formData, activity_other: e.target.value })}
                      placeholder="Instalador de paneles solares..."
                      className="h-11 mt-2"
                    />
                  </div>
                )}

                <div>
                  <Label>Descripción corta * (220 caracteres)</Label>
                  <Textarea
                    value={formData.descripcion_corta}
                    onChange={(e) => setFormData({ ...formData, descripcion_corta: e.target.value.slice(0, 220) })}
                    placeholder="Describe tus servicios..."
                    className="h-24 mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.descripcion_corta.length}/220</p>
                </div>

                <div>
                  <Label>Provincia *</Label>
                  <Select
                    value={formData.provincia}
                    onValueChange={(value) => setFormData({ ...formData, provincia: value })}
                  >
                    <SelectTrigger className="h-11 mt-1">
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
                  <Input
                    value={formData.ciudad}
                    onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                    placeholder="Madrid, Barcelona..."
                    className="h-11 mt-1"
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-5">
                <div>
                  <Label>Tarifa base (€/hora) - OPCIONAL</Label>
                  <Input
                    type="number"
                    value={formData.tarifa_base}
                    onChange={(e) => setFormData({ ...formData, tarifa_base: e.target.value })}
                    placeholder="35"
                    className="h-11 mt-1"
                  />
                </div>

                <div>
                  <Label>Formas de pago *</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {["Tarjeta", "Transferencia", "Efectivo", "Bizum"].map((forma) => (
                      <div
                        key={forma}
                        onClick={() => toggleFormaPago(forma)}
                        className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer ${
                          formData.formas_pago.includes(forma) ? "border-purple-600 bg-purple-50" : "border-gray-200"
                        }`}
                      >
                        <Checkbox checked={formData.formas_pago.includes(forma)} />
                        <span className="text-sm">{forma}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Fotos (opcional)</Label>
                  {formData.photos.length < 10 && (
                    <label className="cursor-pointer block mt-2">
                      <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-blue-500">
                        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                        {uploadingPhoto ? (
                          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                        ) : (
                          <>
                            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm">Añadir foto ({formData.photos.length}/10)</p>
                          </>
                        )}
                      </div>
                    </label>
                  )}

                  {formData.photos.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      {formData.photos.map((photo, idx) => (
                        <div key={idx} className="relative group">
                          <img src={photo} alt={`Foto ${idx + 1}`} className="w-full h-24 object-cover rounded-lg" />
                          <button onClick={() => removePhoto(idx)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <Label className="font-semibold mb-3 block">Consentimientos *</Label>
                  <div className="space-y-3">
                    <div
                      onClick={() => setFormData({ ...formData, acepta_terminos: !formData.acepta_terminos })}
                      className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer ${
                        formData.acepta_terminos ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <Checkbox checked={formData.acepta_terminos} />
                      <span className="text-sm">
                        Acepto los{" "}
                        <Link to={createPageUrl("TermsConditions")} target="_blank" className="text-blue-600 underline" onClick={(e) => e.stopPropagation()}>
                          Términos y Condiciones
                        </Link>
                      </span>
                    </div>

                    <div
                      onClick={() => setFormData({ ...formData, acepta_politica_privacidad: !formData.acepta_politica_privacidad })}
                      className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer ${
                        formData.acepta_politica_privacidad ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <Checkbox checked={formData.acepta_politica_privacidad} />
                      <span className="text-sm">
                        Acepto la{" "}
                        <Link to={createPageUrl("PrivacyPolicy")} target="_blank" className="text-blue-600 underline" onClick={(e) => e.stopPropagation()}>
                          Política de Privacidad
                        </Link>
                      </span>
                    </div>

                    <div
                      onClick={() => setFormData({ ...formData, consiente_contacto_clientes: !formData.consiente_contacto_clientes })}
                      className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer ${
                        formData.consiente_contacto_clientes ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <Checkbox checked={formData.consiente_contacto_clientes} />
                      <span className="text-sm">Consiento ser contactado por clientes</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-8">
              {currentStep > 0 && (
                <Button variant="outline" onClick={handleBack} className="flex-1 h-11" disabled={isSubmitting}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Anterior
                </Button>
              )}

              {currentStep < 2 ? (
                <Button onClick={handleNext} className={`flex-1 h-11 bg-blue-600 hover:bg-blue-700 ${currentStep === 0 ? 'w-full' : ''}`}>
                  Siguiente
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} className="flex-1 h-11 bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
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
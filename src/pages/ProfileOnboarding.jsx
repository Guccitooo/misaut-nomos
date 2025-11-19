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

const CATEGORIES = [
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
  const [searchParams] = useSearchParams();
  
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);

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
    const paymentSuccess = searchParams.get('payment');
    if (paymentSuccess === 'success') {
      setIsVerifyingPayment(true);
      verifySubscription();
    }
  }, [searchParams]);

  useEffect(() => {
    if (user && user.user_type === "professionnel" && !isVerifyingPayment) {
      loadExistingProfile();
    }
  }, [user, isVerifyingPayment]);

  const loadUser = async () => {
    setIsLoadingUser(true);
    try {
      const currentUser = await base44.auth.me();
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

  const verifySubscription = async (attempt = 1, maxAttempts = 15) => {
    try {
      console.log(`🔍 Verificando pago - Intento ${attempt}/${maxAttempts}`);
      
      // Wait progressively longer
      await new Promise(resolve => setTimeout(resolve, attempt === 1 ? 3000 : 2000));
      
      // Force refresh user data
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      console.log('👤 Usuario cargado:', currentUser.email);
      console.log('👤 Tipo de usuario:', currentUser.user_type);
      console.log('👤 has_used_trial:', currentUser.has_used_trial);
      
      if (currentUser.user_type === 'professionnel') {
        const subs = await base44.entities.Subscription.filter({
          user_id: currentUser.id
        });
        
        console.log('📋 Suscripciones encontradas:', subs.length);
        
        if (subs.length > 0) {
          console.log('✅ Suscripción detectada:', subs[0]);
          setIsVerifyingPayment(false);
          toast.success("✅ ¡Pago confirmado! Completa tu perfil profesional.", {
            duration: 4000
          });
          window.history.replaceState({}, document.title, window.location.pathname);
          return;
        }
      } else {
        console.log('⚠️ Usuario aún no es profesional, esperando webhook...');
      }
      
      if (attempt < maxAttempts) {
        setTimeout(() => verifySubscription(attempt + 1, maxAttempts), 2000);
      } else {
        console.error('❌ Timeout: no se pudo verificar el pago después de 15 intentos');
        setIsVerifyingPayment(false);
        toast.error("No se pudo verificar el pago. Contacta con soporte.", {
          duration: 8000
        });
      }
    } catch (error) {
      console.error("Error verificando suscripción:", error);
      if (attempt < maxAttempts) {
        setTimeout(() => verifySubscription(attempt + 1, maxAttempts), 2000);
      } else {
        setIsVerifyingPayment(false);
      }
    }
  };

  const loadExistingProfile = async () => {
    try {
      const profiles = await base44.entities.ProfessionalProfile.filter({
        user_id: user.id
      });

      if (profiles[0] && profiles[0].onboarding_completed && profiles[0].visible_en_busqueda) {
        navigate(createPageUrl("MyProfile"));
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const validateStep = () => {
    if (currentStep === 0) {
      if (!formData.business_name || formData.business_name.trim().length < 2) {
        setError("El nombre profesional debe tener al menos 2 caracteres");
        return false;
      }
      if (!formData.cif_nif || formData.cif_nif.trim().length < 8) {
        setError("El NIF/CIF debe tener al menos 8 caracteres");
        return false;
      }
      if (!formData.email_contacto || !formData.email_contacto.includes('@')) {
        setError("Email inválido");
        return false;
      }
      if (!formData.telefono_contacto || formData.telefono_contacto.replace(/\D/g, '').length < 9) {
        setError("El teléfono es obligatorio y debe tener al menos 9 dígitos");
        return false;
      }
    }

    if (currentStep === 1) {
      if (!formData.category) {
        setError("Selecciona una categoría");
        return false;
      }
      if (formData.category === "Otro tipo de servicio profesional" && (!formData.activity_other || formData.activity_other.trim().length < 3)) {
        setError("Especifica tu servicio cuando seleccionas 'Otro tipo de servicio profesional'");
        return false;
      }
      if (!formData.descripcion_corta || formData.descripcion_corta.length < 20) {
        setError("La descripción corta debe tener al menos 20 caracteres");
        return false;
      }
      if (!formData.provincia) {
        setError("Selecciona una provincia");
        return false;
      }
    }

    if (currentStep === 2) {
      if (formData.formas_pago.length === 0) {
        setError("Selecciona al menos una forma de pago");
        return false;
      }
      if (!formData.acepta_terminos) {
        setError("Debes aceptar los Términos y Condiciones");
        return false;
      }
      if (!formData.acepta_politica_privacidad) {
        setError("Debes aceptar la Política de Privacidad");
        return false;
      }
      if (!formData.consiente_contacto_clientes) {
        setError("Debes consentir ser contactado por clientes");
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

      const profiles = await base44.entities.ProfessionalProfile.filter({
        user_id: user.id
      });

      if (profiles[0]) {
        await base44.entities.ProfessionalProfile.update(profiles[0].id, profileData);
      } else {
        await base44.entities.ProfessionalProfile.create(profileData);
      }

      await base44.auth.updateMe({
        user_type: "professionnel",
        phone: formData.telefono_contacto,
        city: formData.ciudad || formData.provincia
      });

      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: "✅ Tu perfil profesional ya está activo en MisAutónomos",
        body: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>body{margin:0;padding:0;font-family:'Segoe UI',sans-serif;background-color:#f8fafc;}.container{max-width:600px;margin:0 auto;background:#fff;}.header{background:linear-gradient(135deg,#1e40af 0%,#3b82f6 100%);padding:40px 20px;text-align:center;}.header h1{color:white;margin:0;font-size:28px;font-weight:700;}.content{padding:40px 30px;}.greeting{font-size:24px;color:#1f2937;margin-bottom:20px;font-weight:700;}.message{color:#4b5563;line-height:1.8;font-size:16px;margin-bottom:25px;}.success-box{background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:white;padding:25px;border-radius:12px;margin:30px 0;text-align:center;}.cta{text-align:center;margin:35px 0;}.button{display:inline-block;background:linear-gradient(135deg,#f97316 0%,#fb923c 100%);color:white;padding:16px 40px;text-decoration:none;border-radius:12px;font-weight:600;}</style>
</head>
<body>
<div class="container">
<div class="header"><h1>MisAutónomos</h1></div>
<div class="content">
<p class="greeting">¡Enhorabuena, ${formData.business_name}!</p>
<div class="success-box"><h2>🎉 PERFIL ACTIVADO</h2><p>Tu perfil ya está visible para clientes</p></div>
<p class="message">Tu perfil en <strong>MisAutónomos</strong> ha sido publicado correctamente.</p>
<div class="cta"><a href="https://misautonomos.es/ProfessionalProfile?id=${user.id}" class="button">Ver mi perfil público →</a></div>
<p class="message" style="margin-top:30px;font-size:14px;color:#6b7280;text-align:center;">¿Dudas? Contacta: <a href="mailto:soporte@misautonomos.es" style="color:#3b82f6;">soporte@misautonomos.es</a></p>
</div></div></body></html>`,
        from_name: "MisAutónomos"
      });

      toast.success("¡Perfil completado y publicado con éxito!", { duration: 5000 });
      queryClient.invalidateQueries();

      setTimeout(() => {
        navigate(createPageUrl("MyProfile") + "?onboarding=completed");
      }, 1500);

    } catch (err) {
      console.error("Error guardando perfil:", err);
      setError(err.message || "Error al guardar el perfil");
      toast.error(err.message || "Error al guardar el perfil");
    } finally {
      setIsSubmitting(false);
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

  if (isLoadingUser || isVerifyingPayment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-sm w-full shadow-lg bg-white border-0">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {isVerifyingPayment ? "Confirmando tu pago" : "Cargando"}
              </h2>
              <p className="text-sm text-gray-600">
                {isVerifyingPayment ? "Esto toma solo unos segundos..." : "Preparando tu perfil..."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user || user.user_type !== "professionnel") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Acceso restringido</h2>
            <p className="text-gray-600 mb-6">
              Esta página es solo para profesionales. Primero debes seleccionar un plan.
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

  const steps = [
    { title: "Identidad y contacto", progress: 33 },
    { title: "Actividad y zona de trabajo", progress: 66 },
    { title: "Precios, portfolio y legal", progress: 100 }
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
                  <p className="text-xs text-gray-500 mt-1 italic">(no se hará público)</p>
                </div>

                <div>
                  <Label>Email de contacto *</Label>
                  <Input
                    type="email"
                    value={formData.email_contacto}
                    onChange={(e) => setFormData({ ...formData, email_contacto: e.target.value })}
                    placeholder="tu@email.com"
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

                <div className="border-t border-gray-200 pt-4 mt-4">
                  <Label className="text-base font-semibold mb-3 block">Métodos de contacto visibles</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-300">
                      <Checkbox checked={true} disabled={true} />
                      <span className="text-sm font-medium">💬 Chat interno (siempre activo)</span>
                    </div>

                    <div
                      onClick={() => {
                        if (!formData.telefono_contacto || formData.telefono_contacto.replace(/\D/g, '').length < 9) {
                          toast.warning("Añade un teléfono válido primero");
                          return;
                        }
                        toggleMetodoContacto('whatsapp');
                      }}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        !formData.telefono_contacto || formData.telefono_contacto.replace(/\D/g, '').length < 9
                          ? 'cursor-not-allowed opacity-50 bg-gray-50 border-gray-200'
                          : formData.metodos_contacto.includes('whatsapp')
                          ? 'border-green-600 bg-green-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <Checkbox
                        checked={formData.metodos_contacto.includes('whatsapp')}
                        disabled={!formData.telefono_contacto || formData.telefono_contacto.replace(/\D/g, '').length < 9}
                      />
                      <span className="text-sm font-medium">📱 WhatsApp</span>
                    </div>

                    <div
                      onClick={() => {
                        if (!formData.telefono_contacto || formData.telefono_contacto.replace(/\D/g, '').length < 9) {
                          toast.warning("Añade un teléfono válido primero");
                          return;
                        }
                        toggleMetodoContacto('telefono');
                      }}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        !formData.telefono_contacto || formData.telefono_contacto.replace(/\D/g, '').length < 9
                          ? 'cursor-not-allowed opacity-50 bg-gray-50 border-gray-200'
                          : formData.metodos_contacto.includes('telefono')
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <Checkbox
                        checked={formData.metodos_contacto.includes('telefono')}
                        disabled={!formData.telefono_contacto || formData.telefono_contacto.replace(/\D/g, '').length < 9}
                      />
                      <span className="text-sm font-medium">📞 Llamada telefónica</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-5">
                <div>
                  <Label>Categoría de servicio *</Label>
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
                    <Label className="text-yellow-900 font-semibold">Especifica tu servicio *</Label>
                    <Input
                      value={formData.activity_other}
                      onChange={(e) => setFormData({ ...formData, activity_other: e.target.value })}
                      placeholder="Ej: Instalador de paneles solares..."
                      maxLength={100}
                      className="h-11 mt-2 border-yellow-300"
                    />
                  </div>
                )}

                <div>
                  <Label>Descripción corta * (máximo 220 caracteres)</Label>
                  <Textarea
                    value={formData.descripcion_corta}
                    onChange={(e) => setFormData({ ...formData, descripcion_corta: e.target.value.slice(0, 220) })}
                    placeholder="Describe brevemente tus servicios..."
                    className="h-24 mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.descripcion_corta.length}/220 (mínimo 20)</p>
                </div>

                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Zona de trabajo</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label>Provincia *</Label>
                      <Select
                        value={formData.provincia}
                        onValueChange={(value) => setFormData({ ...formData, provincia: value, ciudad: "" })}
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
                    min="0"
                    className="h-11 mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Si lo dejas vacío, no se mostrará en tu perfil</p>
                </div>

                <div>
                  <Label>Tipo de facturación *</Label>
                  <Select
                    value={formData.facturacion}
                    onValueChange={(value) => setFormData({ ...formData, facturacion: value })}
                  >
                    <SelectTrigger className="h-11 mt-1">
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
                  <Label>Formas de pago aceptadas *</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {["Tarjeta", "Transferencia", "Efectivo", "Bizum"].map((forma) => (
                      <div
                        key={forma}
                        onClick={() => toggleFormaPago(forma)}
                        className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.formas_pago.includes(forma)
                            ? "border-purple-600 bg-purple-50"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          formData.formas_pago.includes(forma) ? "bg-purple-600 border-purple-600" : "border-gray-300"
                        }`}>
                          {formData.formas_pago.includes(forma) && (
                            <CheckCircle className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <span className="text-sm font-medium">{forma}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 mt-4">
                  <Label>Portfolio (fotos de trabajos) - OPCIONAL</Label>
                  {formData.photos.length < 10 && (
                    <label className="cursor-pointer block mt-2">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
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
                            <p className="text-sm text-gray-600">Haz clic para añadir foto ({formData.photos.length}/10)</p>
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
                          <button
                            onClick={() => removePhoto(idx)}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4 mt-4">
                  <Label>Redes sociales y web - OPCIONAL</Label>
                  <div className="space-y-3 mt-2">
                    <div className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-gray-500" />
                      <Input
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="https://tuweb.com"
                        className="h-10"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Instagram className="w-5 h-5 text-gray-500" />
                      <Input
                        value={formData.social_links.instagram}
                        onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, instagram: e.target.value } })}
                        placeholder="https://instagram.com/tuperfil"
                        className="h-10"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Facebook className="w-5 h-5 text-gray-500" />
                      <Input
                        value={formData.social_links.facebook}
                        onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, facebook: e.target.value } })}
                        placeholder="https://facebook.com/tupagina"
                        className="h-10"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Linkedin className="w-5 h-5 text-gray-500" />
                      <Input
                        value={formData.social_links.linkedin}
                        onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, linkedin: e.target.value } })}
                        placeholder="https://linkedin.com/in/tuperfil"
                        className="h-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 mt-4">
                  <Label className="text-base font-semibold mb-3 block">Consentimientos legales *</Label>
                  <div className="space-y-3">
                    <div
                      onClick={() => setFormData({ ...formData, acepta_terminos: !formData.acepta_terminos })}
                      className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.acepta_terminos ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <Checkbox checked={formData.acepta_terminos} className="mt-0.5" />
                      <span className="text-sm">
                        He leído y acepto los{" "}
                        <Link to={createPageUrl("TermsConditions")} target="_blank" className="text-blue-600 underline font-semibold" onClick={(e) => e.stopPropagation()}>
                          Términos y Condiciones
                        </Link>
                      </span>
                    </div>

                    <div
                      onClick={() => setFormData({ ...formData, acepta_politica_privacidad: !formData.acepta_politica_privacidad })}
                      className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.acepta_politica_privacidad ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <Checkbox checked={formData.acepta_politica_privacidad} className="mt-0.5" />
                      <span className="text-sm">
                        Acepto la{" "}
                        <Link to={createPageUrl("PrivacyPolicy")} target="_blank" className="text-blue-600 underline font-semibold" onClick={(e) => e.stopPropagation()}>
                          Política de Privacidad
                        </Link>
                      </span>
                    </div>

                    <div
                      onClick={() => setFormData({ ...formData, consiente_contacto_clientes: !formData.consiente_contacto_clientes })}
                      className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.consiente_contacto_clientes ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <Checkbox checked={formData.consiente_contacto_clientes} className="mt-0.5" />
                      <span className="text-sm">
                        Consiento en que los clientes puedan contactarme a través de la plataforma
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-8">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1 h-11"
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Anterior
                </Button>
              )}

              {currentStep < 2 ? (
                <Button
                  onClick={handleNext}
                  className={`flex-1 h-11 bg-blue-600 hover:bg-blue-700 ${currentStep === 0 ? 'w-full' : ''}`}
                >
                  Siguiente
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  className="flex-1 h-11 bg-green-600 hover:bg-green-700"
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
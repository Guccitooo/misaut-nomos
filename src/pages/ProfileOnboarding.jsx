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
import { CheckCircle, ArrowRight, ArrowLeft, Loader2, AlertCircle, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const CATEGORIES = [
  "Electricista", "Fontanero", "Carpintero", "Albañil / Reformas",
  "Pintor", "Jardinero", "Transportista", "Autónomo de limpieza",
  "Cerrajero", "Instalador de aire acondicionado", "Mantenimiento general",
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
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

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
    acepta_terminos: false,
    acepta_politica_privacidad: false,
    consiente_contacto_clientes: false,
  });

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      window.history.replaceState({}, '', createPageUrl("ProfileOnboarding"));
      toast.success('✅ Pago confirmado. Completa tu perfil', { duration: 3000 });
    }
  }, [searchParams]);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setFormData(prev => ({
        ...prev,
        email_contacto: currentUser.email,
        telefono_contacto: currentUser.phone || "",
      }));

      const profiles = await base44.entities.ProfessionalProfile.filter({ user_id: currentUser.id });
      if (profiles[0]?.onboarding_completed) {
        navigate(createPageUrl("MyProfile"), { replace: true });
      }
    } catch (error) {
      base44.auth.redirectToLogin();
    }
  };

  const validateStep = () => {
    if (currentStep === 0) {
      if (!formData.business_name || formData.business_name.length < 2) {
        setError('Nombre profesional: mínimo 2 caracteres');
        return false;
      }
      if (!formData.cif_nif || formData.cif_nif.length < 8) {
        setError('NIF/CIF: mínimo 8 caracteres');
        return false;
      }
      if (!formData.email_contacto || !formData.email_contacto.includes('@')) {
        setError('Email inválido');
        return false;
      }
      if (!formData.telefono_contacto || formData.telefono_contacto.replace(/\D/g, '').length < 9) {
        setError('Teléfono: mínimo 9 dígitos');
        return false;
      }
    }

    if (currentStep === 1) {
      if (!formData.category) {
        setError('Selecciona una categoría');
        return false;
      }
      if (formData.category === "Otro tipo de servicio profesional" && formData.activity_other.length < 3) {
        setError('Especifica tu servicio');
        return false;
      }
      if (formData.descripcion_corta.length < 20) {
        setError('Descripción: mínimo 20 caracteres');
        return false;
      }
      if (!formData.provincia) {
        setError('Selecciona una provincia');
        return false;
      }
    }

    if (currentStep === 2) {
      if (formData.formas_pago.length === 0) {
        setError('Selecciona al menos una forma de pago');
        return false;
      }
      if (!formData.acepta_terminos || !formData.acepta_politica_privacidad || !formData.consiente_contacto_clientes) {
        setError('Debes aceptar todos los consentimientos');
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    setError(null);
    if (!validateStep()) return;
    setCurrentStep(currentStep + 1);
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    setError(null);
    if (!validateStep()) return;

    setIsSubmitting(true);
    try {
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
        onboarding_completed: true,
        visible_en_busqueda: true,
        estado_perfil: "activo",
        acepta_terminos: true,
        acepta_politica_privacidad: true,
        consiente_contacto_clientes: true,
        fecha_publicacion: new Date().toISOString(),
        disponibilidad_tipo: "laborables",
        horario_apertura: "09:00",
        horario_cierre: "18:00",
        radio_servicio_km: 10,
      };

      const profiles = await base44.entities.ProfessionalProfile.filter({ user_id: user.id });

      if (profiles[0]) {
        await base44.entities.ProfessionalProfile.update(profiles[0].id, profileData);
      } else {
        await base44.entities.ProfessionalProfile.create(profileData);
      }

      await base44.auth.updateMe({
        user_type: "professionnel",
        professional_onboarding_completed: true,
        phone: formData.telefono_contacto,
        city: formData.ciudad || formData.provincia
      });

      console.log('✅ PERFIL PUBLICADO');
      
      toast.success('¡Perfil activado!', { duration: 2000 });
      queryClient.invalidateQueries();

      setTimeout(() => {
        navigate(createPageUrl("MyProfile") + "?onboarding=completed", { replace: true });
      }, 1000);

    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message);
      toast.error(err.message);
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
      setFormData({ ...formData, photos: [...formData.photos, file_url] });
      toast.success('Foto subida');
    } catch (error) {
      toast.error('Error subiendo foto');
    }
    setUploadingPhoto(false);
  };

  const removePhoto = (index) => {
    setFormData({ ...formData, photos: formData.photos.filter((_, i) => i !== index) });
  };

  const toggleFormaPago = (forma) => {
    const formas = formData.formas_pago;
    setFormData({ 
      ...formData, 
      formas_pago: formas.includes(forma) ? formas.filter(f => f !== forma) : [...formas, forma] 
    });
  };

  const toggleMetodoContacto = (metodo) => {
    if (metodo === 'chat_interno') return;
    const metodos = formData.metodos_contacto;
    setFormData({ 
      ...formData, 
      metodos_contacto: metodos.includes(metodo) ? metodos.filter(m => m !== metodo) : [...metodos, metodo] 
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const steps = [
    { title: 'Identidad', progress: 33 },
    { title: 'Actividad', progress: 66 },
    { title: 'Finalización', progress: 100 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-3">Completa tu perfil profesional</h1>
          <Progress value={steps[currentStep].progress} className="h-2" />
          <p className="text-sm text-gray-600 mt-2">Paso {currentStep + 1} de 3</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="shadow-lg">
          <CardContent className="p-8">
            {currentStep === 0 && (
              <div className="space-y-4">
                <div>
                  <Label>Nombre profesional *</Label>
                  <Input
                    value={formData.business_name}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                    placeholder="Juan Pérez - Electricista"
                  />
                </div>

                <div>
                  <Label>NIF/CIF *</Label>
                  <Input
                    value={formData.cif_nif}
                    onChange={(e) => setFormData({ ...formData, cif_nif: e.target.value.toUpperCase() })}
                    placeholder="12345678A"
                    maxLength={9}
                  />
                </div>

                <div>
                  <Label>Email de contacto *</Label>
                  <Input
                    type="email"
                    value={formData.email_contacto}
                    onChange={(e) => setFormData({ ...formData, email_contacto: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Teléfono *</Label>
                  <Input
                    value={formData.telefono_contacto}
                    onChange={(e) => setFormData({ ...formData, telefono_contacto: e.target.value.replace(/[^\d+]/g, '') })}
                    placeholder="612345678"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Métodos de contacto</Label>
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                    <Checkbox checked disabled />
                    <span className="text-sm">💬 Chat interno</span>
                  </div>
                  <div
                    onClick={() => formData.telefono_contacto.length >= 9 && toggleMetodoContacto('whatsapp')}
                    className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer ${
                      formData.metodos_contacto.includes('whatsapp') ? 'border-green-600 bg-green-50' : ''
                    }`}
                  >
                    <Checkbox checked={formData.metodos_contacto.includes('whatsapp')} />
                    <span className="text-sm">📱 WhatsApp</span>
                  </div>
                  <div
                    onClick={() => formData.telefono_contacto.length >= 9 && toggleMetodoContacto('telefono')}
                    className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer ${
                      formData.metodos_contacto.includes('telefono') ? 'border-blue-600 bg-blue-50' : ''
                    }`}
                  >
                    <Checkbox checked={formData.metodos_contacto.includes('telefono')} />
                    <span className="text-sm">📞 Llamada</span>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label>Categoría *</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.category === "Otro tipo de servicio profesional" && (
                  <div>
                    <Label>Especifica *</Label>
                    <Input
                      value={formData.activity_other}
                      onChange={(e) => setFormData({ ...formData, activity_other: e.target.value })}
                      placeholder="Instalador de paneles solares..."
                    />
                  </div>
                )}

                <div>
                  <Label>Descripción corta * (220 caracteres)</Label>
                  <Textarea
                    value={formData.descripcion_corta}
                    onChange={(e) => setFormData({ ...formData, descripcion_corta: e.target.value.slice(0, 220) })}
                    placeholder="Describe tus servicios..."
                    className="h-24"
                  />
                  <p className="text-xs text-gray-500">{formData.descripcion_corta.length}/220</p>
                </div>

                <div>
                  <Label>Provincia *</Label>
                  <Select value={formData.provincia} onValueChange={(v) => setFormData({ ...formData, provincia: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {PROVINCIAS.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Ciudad (opcional)</Label>
                  <Input
                    value={formData.ciudad}
                    onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                    placeholder="Madrid..."
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label>Tarifa (€/hora) - opcional</Label>
                  <Input
                    type="number"
                    value={formData.tarifa_base}
                    onChange={(e) => setFormData({ ...formData, tarifa_base: e.target.value })}
                    placeholder="35"
                  />
                </div>

                <div>
                  <Label>Formas de pago *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Tarjeta", "Transferencia", "Efectivo", "Bizum"].map((f) => (
                      <div
                        key={f}
                        onClick={() => toggleFormaPago(f)}
                        className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer ${
                          formData.formas_pago.includes(f) ? "border-purple-600 bg-purple-50" : "border-gray-200"
                        }`}
                      >
                        <Checkbox checked={formData.formas_pago.includes(f)} />
                        <span className="text-sm">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Fotos (opcional)</Label>
                  {formData.photos.length < 10 && (
                    <label className="cursor-pointer block mt-2">
                      <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-blue-500">
                        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                        {uploadingPhoto ? (
                          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
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

                <div className="space-y-2 border-t pt-4">
                  <div
                    onClick={() => setFormData({ ...formData, acepta_terminos: !formData.acepta_terminos })}
                    className={`flex items-start gap-2 p-3 border-2 rounded-lg cursor-pointer ${
                      formData.acepta_terminos ? 'border-blue-600 bg-blue-50' : ''
                    }`}
                  >
                    <Checkbox checked={formData.acepta_terminos} />
                    <span className="text-sm">
                      Acepto los <Link to={createPageUrl("TermsConditions")} target="_blank" className="text-blue-600 underline">Términos</Link>
                    </span>
                  </div>

                  <div
                    onClick={() => setFormData({ ...formData, acepta_politica_privacidad: !formData.acepta_politica_privacidad })}
                    className={`flex items-start gap-2 p-3 border-2 rounded-lg cursor-pointer ${
                      formData.acepta_politica_privacidad ? 'border-blue-600 bg-blue-50' : ''
                    }`}
                  >
                    <Checkbox checked={formData.acepta_politica_privacidad} />
                    <span className="text-sm">
                      Acepto la <Link to={createPageUrl("PrivacyPolicy")} target="_blank" className="text-blue-600 underline">Política de Privacidad</Link>
                    </span>
                  </div>

                  <div
                    onClick={() => setFormData({ ...formData, consiente_contacto_clientes: !formData.consiente_contacto_clientes })}
                    className={`flex items-start gap-2 p-3 border-2 rounded-lg cursor-pointer ${
                      formData.consiente_contacto_clientes ? 'border-blue-600 bg-blue-50' : ''
                    }`}
                  >
                    <Checkbox checked={formData.consiente_contacto_clientes} />
                    <span className="text-sm">Consiento ser contactado por clientes</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-8">
              {currentStep > 0 && (
                <Button variant="outline" onClick={handleBack} className="flex-1" disabled={isSubmitting}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Anterior
                </Button>
              )}

              {currentStep < 2 ? (
                <Button onClick={handleNext} className={`flex-1 bg-blue-600 ${currentStep === 0 ? 'w-full' : ''}`}>
                  Siguiente
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} className="flex-1 bg-green-600" disabled={isSubmitting}>
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
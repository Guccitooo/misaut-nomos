
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  const [currentStep, setCurrentStep] = useState(0);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
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
    radio_servicio_km: 10,
    opening_hours: "",
    tarifa_base: "",
    facturacion: "autonomo",
    formas_pago: [],
    photos: [],
    acepta_terminos: false,
    acepta_politica_privacidad: false,
    consiente_contacto_clientes: false,
  });

  useEffect(() => {
    loadUserAndProfile();
  }, []);

  const loadUserAndProfile = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Load existing profile
      const profiles = await base44.entities.ProfessionalProfile.filter({
        user_id: currentUser.id
      });

      if (profiles[0]) {
        const existingProfile = profiles[0];
        setProfile(existingProfile);

        // If profile is already active, redirect to dashboard
        if (existingProfile.onboarding_completed && existingProfile.visible_en_busqueda) {
          navigate(createPageUrl("MyProfile"));
          return;
        }

        // Pre-fill form with existing data
        setFormData({
          business_name: existingProfile.business_name || "",
          cif_nif: existingProfile.cif_nif || "",
          email_contacto: existingProfile.email_contacto || currentUser.email,
          telefono_contacto: existingProfile.telefono_contacto || currentUser.phone || "",
          categories: existingProfile.categories || [],
          descripcion_corta: existingProfile.descripcion_corta || "",
          description: existingProfile.description || "",
          service_area: existingProfile.service_area || "",
          radio_servicio_km: existingProfile.radio_servicio_km || 10,
          opening_hours: existingProfile.opening_hours || "",
          tarifa_base: existingProfile.tarifa_base || "",
          facturacion: existingProfile.facturacion || "autonomo",
          formas_pago: existingProfile.formas_pago || [],
          photos: existingProfile.photos || [],
          acepta_terminos: existingProfile.acepta_terminos || false,
          acepta_politica_privacidad: existingProfile.acepta_politica_privacidad || false,
          consiente_contacto_clientes: existingProfile.consiente_contacto_clientes || false,
        });
      } else {
        // Pre-fill with user data
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

  const saveProfileMutation = useMutation({
    mutationFn: async (data) => {
      // Only send non-empty fields
      const cleanData = {};
      Object.keys(data).forEach(key => {
        const value = data[key];
        if (value !== null && value !== undefined && value !== "" &&
            !(Array.isArray(value) && value.length === 0)) {
          cleanData[key] = value;
        }
      });

      if (profile) {
        return base44.entities.ProfessionalProfile.update(profile.id, cleanData);
      } else {
        return base44.entities.ProfessionalProfile.create({
          ...cleanData,
          user_id: user.id,
          estado_perfil: "pendiente",
          visible_en_busqueda: false,
          onboarding_completed: false
        });
      }
    },
    onSuccess: (newProfile) => {
      if (!profile) {
        setProfile(newProfile);
      }
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
    },
    onError: (error) => {
      console.error("Error saving profile:", error);
      toast.error("Error al guardar: " + error.message);
    }
  });

  const publishProfileMutation = useMutation({
    mutationFn: async () => {
      const now = new Date().toISOString();
      const slug = `${formData.business_name.toLowerCase().replace(/\s+/g, '-')}-${profile.id.slice(-6)}`;

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
    onSuccess: async () => {
      // Send confirmation email
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: "✅ Tu perfil ya está publicado en milautonomos",
        body: `Hola ${formData.business_name},

¡Enhorabuena! Tu perfil profesional ya está activo y visible en milautonomos.

Los clientes pueden encontrarte buscando por:
- Tu nombre: ${formData.business_name}
- Tu actividad: ${formData.categories.join(', ')}
- Tu zona: ${formData.service_area}

Próximos pasos para maximizar tu visibilidad:
1. Añade más fotos de tus trabajos
2. Completa tu descripción con palabras clave
3. Responde rápido a los mensajes de clientes
4. Pide valoraciones a tus clientes satisfechos

Ver mi perfil público: [URL de tu perfil]

Gracias por unirte a milautonomos,
Equipo milautonomos`,
        from_name: "milautonomos"
      });

      toast.success("¡Perfil publicado con éxito!");
      setCurrentStep(steps.length);
    },
  });

  const steps = [
    {
      title: "Identidad",
      fields: ["business_name", "cif_nif", "email_contacto", "telefono_contacto"]
    },
    {
      title: "Actividad",
      fields: ["categories", "descripcion_corta"]
    },
    {
      title: "Zona y disponibilidad",
      fields: ["service_area", "radio_servicio_km"]
    },
    {
      title: "Precios y forma de trabajo",
      fields: ["tarifa_base", "formas_pago"]
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

      if (field === "service_area") {
        if (!value || value.trim().length < 3) {
          setError("Indica tu ubicación");
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
    setError(null);

    console.log("=== VALIDATING STEP ===");
    console.log("Current step:", currentStep);
    console.log("Form data:", formData);
    console.log("Profile exists:", !!profile);

    if (!validateStep(currentStep)) {
      console.log("Validation failed");
      return;
    }

    console.log("Validation passed, saving...");

    // Autosave - but don't block if it fails
    try {
      const savedProfile = await saveProfileMutation.mutateAsync(formData);
      console.log("Save successful:", savedProfile);
      toast.success("Guardado correctamente");
    } catch (error) {
      console.error("Error saving:", error);
      // Don't block advancing if save fails
      toast.error("No se pudo guardar, pero puedes continuar");
    }

    // Always advance to next step
    if (currentStep < steps.length - 1) {
      console.log("Advancing to step:", currentStep + 1);
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    setError(null);
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePublish = async () => {
    // Validate all steps
    for (let i = 0; i < steps.length - 1; i++) {
      if (!validateStep(i)) {
        toast.error(`Completa el paso ${i + 1}: ${steps[i].title}`);
        setCurrentStep(i);
        return;
      }
    }

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
                onClick={() => navigate(createPageUrl("MyProfile"))}
              >
                Ir a mi panel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
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
              <div className="space-y-4">
                <div>
                  <Label>Ubicación base *</Label>
                  <Input
                    value={formData.service_area}
                    onChange={(e) => setFormData({ ...formData, service_area: e.target.value })}
                    placeholder="Ej: Madrid, Barcelona..."
                    className="h-12"
                  />
                </div>

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
                      <SelectItem value="5">5 km</SelectItem>
                      <SelectItem value="10">10 km</SelectItem>
                      <SelectItem value="25">25 km</SelectItem>
                      <SelectItem value="50">50 km</SelectItem>
                      <SelectItem value="100">100+ km</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Horarios (opcional)</Label>
                  <Input
                    value={formData.opening_hours}
                    onChange={(e) => setFormData({ ...formData, opening_hours: e.target.value })}
                    placeholder="Ej: Lun-Vie 9h-18h"
                    className="h-12"
                  />
                </div>
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
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <Checkbox
                    checked={formData.acepta_terminos}
                    onCheckedChange={(checked) => setFormData({ ...formData, acepta_terminos: checked })}
                  />
                  <label className="text-sm cursor-pointer flex-1" onClick={() => setFormData({ ...formData, acepta_terminos: !formData.acepta_terminos })}>
                    <strong>Acepto los términos y condiciones *</strong>
                    <p className="text-gray-600 mt-1">
                      He leído y acepto los términos y condiciones de uso de la plataforma milautonomos.
                    </p>
                  </label>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <Checkbox
                    checked={formData.acepta_politica_privacidad}
                    onCheckedChange={(checked) => setFormData({ ...formData, acepta_politica_privacidad: checked })}
                  />
                  <label className="text-sm cursor-pointer flex-1" onClick={() => setFormData({ ...formData, acepta_politica_privacidad: !formData.acepta_politica_privacidad })}>
                    <strong>Acepto la política de privacidad *</strong>
                    <p className="text-gray-600 mt-1">
                      He leído y acepto la política de privacidad y el tratamiento de mis datos personales.
                    </p>
                  </label>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <Checkbox
                    checked={formData.consiente_contacto_clientes}
                    onCheckedChange={(checked) => setFormData({ ...formData, consiente_contacto_clientes: checked })}
                  />
                  <label className="text-sm cursor-pointer flex-1" onClick={() => setFormData({ ...formData, consiente_contacto_clientes: !formData.consiente_contacto_clientes })}>
                    <strong>Consiento el contacto de clientes *</strong>
                    <p className="text-gray-600 mt-1">
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
                          <p>• Descripción: {formData.descripcion_corta.substring(0, 100)}...</p>
                        </>
                      )}
                      {idx === 2 && (
                        <>
                          <p>• Ubicación: {formData.service_area}</p>
                          <p>• Radio: {formData.radio_servicio_km} km</p>
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
                  disabled={saveProfileMutation.isPending}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Atrás
                </Button>
              )}

              {currentStep < steps.length - 1 ? (
                <Button
                  onClick={handleNext}
                  className={`flex-1 h-12 bg-blue-600 hover:bg-blue-700 ${currentStep === 0 ? 'w-full' : ''}`}
                  disabled={saveProfileMutation.isPending}
                >
                  {saveProfileMutation.isPending ? (
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
                  disabled={publishProfileMutation.isPending}
                >
                  {publishProfileMutation.isPending ? (
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

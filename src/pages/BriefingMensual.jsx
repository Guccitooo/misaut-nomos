import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Instagram, Facebook, Search, Upload, X, Check, ChevronLeft, Linkedin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Icono TikTok custom
function TikTokIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  );
}

export default function BriefingMensualPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [professionalProfile, setProfessionalProfile] = useState(null);
  const [insights, setInsights] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const [formData, setFormData] = useState({
    platform: "",
    goal: "",
    services_to_highlight: [],
    service_area: "",
    special_offer: "",
    additional_material_urls: [],
    testimonials: "",
    budget_eur: 30, // Por defecto 30€ incluido en el plan
    notes: ""
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      const profiles = await base44.entities.ProfessionalProfile.filter({
        user_id: currentUser.id
      }).limit(1);
      
      if (profiles.length > 0) {
        setProfessionalProfile(profiles[0]);
        setFormData(prev => ({
          ...prev,
          service_area: profiles[0].service_area || '',
          services_to_highlight: profiles[0].services_offered?.map(s => s.name) || []
        }));
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.platform || !formData.goal) {
      toast.error("Selecciona una red y un objetivo");
      return;
    }
    
    setSaving(true);
    
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      await base44.entities.AdsBriefing.create({
        professional_id: user.id,
        month: currentMonth,
        year: currentYear,
        platform: formData.platform,
        goal: formData.goal,
        services_to_highlight: formData.services_to_highlight,
        service_area: formData.service_area,
        special_offer: formData.special_offer,
        additional_material_urls: formData.additional_material_urls,
        testimonials: formData.testimonials,
        budget_eur: formData.budget_eur,
        notes: formData.notes,
        campaign_status: 'pending',
        submitted_at: new Date().toISOString()
      });
      
      toast.success("✅ Briefing enviado. Nuestro equipo lo revisará pronto.");
      navigate("/mi-campana");
    } catch (error) {
      console.error("Error submitting briefing:", error);
      toast.error("Error al enviar el briefing");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("La imagen no puede superar los 10MB");
      return;
    }

    setUploadingFiles(true);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({
        ...formData,
        additional_material_urls: [...formData.additional_material_urls, file_url]
      });
      toast.success("✅ Foto añadida");
    } catch (error) {
      toast.error("Error al subir la foto");
    } finally {
      setUploadingFiles(false);
    }
  };

  const removeFile = (index) => {
    const newFiles = [...formData.additional_material_urls];
    newFiles.splice(index, 1);
    setFormData({ ...formData, additional_material_urls: newFiles });
  };

  const toggleService = (serviceName) => {
    if (formData.services_to_highlight.includes(serviceName)) {
      setFormData({
        ...formData,
        services_to_highlight: formData.services_to_highlight.filter(s => s !== serviceName)
      });
    } else {
      setFormData({
        ...formData,
        services_to_highlight: [...formData.services_to_highlight, serviceName]
      });
    }
  };

  const platforms = [
    { id: 'instagram', label: 'Instagram', icon: Instagram, hint: 'Gran alcance visual, 25-45 años', color: 'from-pink-600 to-purple-600' },
    { id: 'facebook', label: 'Facebook', icon: Facebook, hint: 'Local + 35-65 años', color: 'from-blue-600 to-blue-800' },
    { id: 'tiktok', label: 'TikTok', icon: TikTokIcon, hint: '18-30 años, formato vídeo', color: 'from-gray-800 to-black' },
    { id: 'google_search', label: 'Google', icon: Search, hint: 'Intención alta de compra', color: 'from-green-600 to-blue-600' },
    { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, hint: 'B2B, profesionales', color: 'from-blue-700 to-blue-900' }
  ];

  // Función de recomendación basada en ClientInsights
  const recommendPlatform = (insights) => {
    if (!insights) return null;
    const { client_type, client_age_range, preferred_platforms, service_area_type } = insights;
    
    // Si cliente es empresa → LinkedIn prioritario
    if (client_type === 'company') {
      return { platform: 'linkedin', reason: 'Para captar clientes empresa, LinkedIn da mejor calidad de lead.' };
    }
    
    // Si cliente joven (18-30) → TikTok o Instagram
    const ages = client_age_range || [];
    if (ages.includes('18-25') && !ages.includes('45-55')) {
      return { platform: 'tiktok', reason: 'Tu cliente es joven y TikTok funciona mejor para este rango de edad.' };
    }
    
    // Si ámbito local + intención compra → Google
    if (service_area_type === 'local_city' && client_type === 'particular') {
      return { platform: 'google_search', reason: 'Para captación local con intención de compra, Google Search convierte más.' };
    }
    
    // Si ya lo usa habitualmente y tiene presencia → potenciar esa red
    if (preferred_platforms?.includes('instagram')) {
      return { platform: 'instagram', reason: 'Tu cliente ya está en Instagram y tú ya publicas ahí — potenciamos tu presencia.' };
    }
    
    // Default para particulares adultos
    return { platform: 'facebook', reason: 'Para tu perfil de cliente, Facebook da el mejor coste por lead.' };
  };

  const recommendedPlatform = recommendPlatform(insights);
  const platformLabels = {
    instagram: 'Instagram',
    facebook: 'Facebook',
    tiktok: 'TikTok',
    google_search: 'Google Search',
    linkedin: 'LinkedIn'
  };

  const goals = [
    { id: 'more_calls', label: 'Más llamadas', desc: 'Que me llamen pidiendo info' },
    { id: 'more_leads', label: 'Más contactos por mensaje', desc: 'Formularios o WhatsApp' },
    { id: 'more_quotes', label: 'Más solicitudes de presupuesto', desc: 'Clientes con intención clara' },
    { id: 'brand_awareness', label: 'Notoriedad', desc: 'Que me conozcan en mi zona' },
    { id: 'website_traffic', label: 'Tráfico a mi perfil', desc: 'Visitas a mi web o perfil MisAutónomos' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/mi-campana")}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-3"
          >
            <ChevronLeft className="w-4 h-4" />
            Volver a Mi campaña
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Configurar campaña mensual</h1>
          <p className="text-sm text-gray-500 mt-1">
            Elige dónde y cómo quieres anunciarte este mes
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Elegir red */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                ¿Dónde quieres anunciarte este mes?
              </CardTitle>
              <p className="text-xs text-gray-500">
                Elige UNA red. El próximo mes puedes cambiar.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {platforms.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, platform: p.id })}
                    className={`flex flex-col items-center gap-2 p-4 border-2 rounded-xl transition-all ${
                      formData.platform === p.id
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br ${p.color}`}>
                      <p.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm font-medium">{p.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 2. Objetivo */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                ¿Cuál es tu objetivo principal este mes?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {goals.map(g => (
                  <label
                    key={g.id}
                    className={`flex items-start gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${
                      formData.goal === g.id
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="goal"
                      value={g.id}
                      checked={formData.goal === g.id}
                      onChange={e => setFormData({ ...formData, goal: e.target.value })}
                      className="mt-1 w-4 h-4 text-gray-900"
                    />
                    <div>
                      <p className="font-medium text-sm text-gray-900">{g.label}</p>
                      <p className="text-xs text-gray-500">{g.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 3. Servicios a destacar */}
          {professionalProfile?.services_offered?.length > 0 && (
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">
                  ¿Qué servicios quieres destacar?
                </CardTitle>
                <p className="text-xs text-gray-500">
                  Puedes elegir varios de los servicios que ofreces.
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {professionalProfile.services_offered.map(service => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => toggleService(service.name)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                        formData.services_to_highlight.includes(service.name)
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {service.name}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 4. Zona geográfica */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Zona de captación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="text"
                value={formData.service_area}
                onChange={e => setFormData({ ...formData, service_area: e.target.value })}
                placeholder="Ej: Barcelona ciudad + 20km a la redonda"
                className="w-full"
              />
            </CardContent>
          </Card>

          {/* 5. Oferta especial */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                ¿Oferta especial este mes? (opcional)
              </CardTitle>
              <p className="text-xs text-gray-500">
                Descuentos u ofertas funcionan muy bien en ads.
              </p>
            </CardHeader>
            <CardContent>
              <Input
                type="text"
                value={formData.special_offer}
                onChange={e => setFormData({ ...formData, special_offer: e.target.value })}
                placeholder="Ej: 10% descuento primera reparación"
                className="w-full"
              />
            </CardContent>
          </Card>

          {/* 6. Material adicional */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                ¿Quieres aportar fotos o vídeo?
              </CardTitle>
              <p className="text-xs text-gray-500">
                Si no, usaremos las de tu perfil y crearemos creatividades desde cero.
              </p>
            </CardHeader>
            <CardContent>
              {formData.additional_material_urls.length < 5 && (
                <label className="cursor-pointer block mb-3">
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-blue-500 transition-colors">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploadingFiles}
                    />
                    {uploadingFiles ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">
                          Click para añadir ({formData.additional_material_urls.length}/5)
                        </p>
                      </>
                    )}
                  </div>
                </label>
              )}

              {formData.additional_material_urls.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {formData.additional_material_urls.map((url, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={url}
                        alt={`Material ${idx + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 7. Testimonios */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                ¿Algún testimonio o caso de éxito que destaquemos?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.testimonials}
                onChange={e => setFormData({ ...formData, testimonials: e.target.value })}
                placeholder="Ej: Reformé la cocina de María en 10 días y quedó encantada..."
                rows={3}
                className="w-full"
              />
            </CardContent>
          </Card>

          {/* Presupuesto */}
          <Card className="border-0 shadow-md bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-blue-900">
                Presupuesto de publicidad
              </CardTitle>
              <p className="text-xs text-blue-700">
                Incluido en tu Plan Ads+ (30€/mes en inversión publicitaria)
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  value={formData.budget_eur}
                  onChange={e => setFormData({ ...formData, budget_eur: parseFloat(e.target.value) || 30 })}
                  className="w-24"
                  min="10"
                  max="100"
                />
                <span className="text-sm text-blue-700 font-medium">euros de inversión en ads</span>
              </div>
            </CardContent>
          </Card>

          {/* Notas adicionales */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Notas adicionales (opcional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Cualquier otra información que quieras compartir..."
                rows={2}
                className="w-full"
              />
            </CardContent>
          </Card>

          {/* Submit */}
          <Button
            type="submit"
            disabled={saving || !formData.platform || !formData.goal}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 text-base"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                Enviando...
              </>
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                Enviar briefing
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
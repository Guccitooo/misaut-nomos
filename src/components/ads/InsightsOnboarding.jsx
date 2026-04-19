import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Users, MapPin, Target, TrendingUp, Star } from "lucide-react";

const STEPS = [
  {
    id: 1,
    title: "Tipo de cliente",
    subtitle: "¿A quién vendes tus servicios?",
    icon: Users
  },
  {
    id: 2,
    title: "Perfil del cliente ideal",
    subtitle: "¿Cómo es tu cliente perfecto?",
    icon: Target
  },
  {
    id: 3,
    title: "Dónde están tus clientes",
    subtitle: "¿En qué redes sociales están?",
    icon: MapPin
  },
  {
    id: 4,
    title: "Cómo consigues clientes hoy",
    subtitle: "¿Qué canales usas actualmente?",
    icon: TrendingUp
  },
  {
    id: 5,
    title: "Tus objetivos",
    subtitle: "¿Qué quieres conseguir en 6 meses?",
    icon: Star
  }
];

export default function InsightsOnboarding({ onComplete, user }) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    // Paso 1
    client_type: "",
    average_ticket: "",
    monthly_revenue: "",
    
    // Paso 2
    ideal_age_ranges: [],
    ideal_gender: "",
    ideal_interests: [],
    
    // Paso 3
    client_social_networks: [],
    geographic_scope: "",
    
    // Paso 4
    current_channels: [],
    biggest_challenge: "",
    
    // Paso 5
    six_month_goal: "",
    differentiation: ""
  });

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setSaving(true);
    
    try {
      await base44.entities.ClientInsights.create({
        user_id: user.id,
        professional_profile_id: user.id,
        onboarding_completed: true,
        completed_at: new Date().toISOString(),
        
        // Paso 1
        client_type: formData.client_type,
        average_ticket: formData.average_ticket,
        monthly_revenue: formData.monthly_revenue,
        
        // Paso 2
        ideal_age_ranges: formData.ideal_age_ranges,
        ideal_gender: formData.ideal_gender,
        ideal_interests: formData.ideal_interests.join(", "),
        
        // Paso 3
        client_social_networks: formData.client_social_networks,
        geographic_scope: formData.geographic_scope,
        
        // Paso 4
        current_channels: formData.current_channels,
        biggest_challenge: formData.biggest_challenge,
        
        // Paso 5
        six_month_goal: formData.six_month_goal,
        differentiation: formData.differentiation,
        
        updated_at: new Date().toISOString()
      });
      
      toast.success("✅ Perfil de cliente guardado");
      onComplete();
    } catch (error) {
      console.error("Error saving insights:", error);
      toast.error("Error al guardar. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-base">¿Qué tipo de clientes tienes?</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                {[
                  { id: 'particulares', label: 'Particulares', desc: 'B2C' },
                  { id: 'empresas', label: 'Empresas', desc: 'B2B' },
                  { id: 'ambos', label: 'Ambos', desc: 'B2B + B2C' }
                ].map(option => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, client_type: option.id })}
                    className={`p-4 border-2 rounded-xl text-left transition-all ${
                      formData.client_type === option.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold text-sm">{option.label}</p>
                    <p className="text-xs text-gray-500 mt-1">{option.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Ticket medio aproximado (€)</Label>
              <select
                value={formData.average_ticket}
                onChange={(e) => setFormData({ ...formData, average_ticket: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="">Selecciona</option>
                <option value="<50">Menos de 50€</option>
                <option value="50-100">50€ - 100€</option>
                <option value="100-250">100€ - 250€</option>
                <option value="250-500">250€ - 500€</option>
                <option value="500-1000">500€ - 1000€</option>
                <option value="1000+">Más de 1000€</option>
              </select>
            </div>

            <div>
              <Label>Facturación mensual estimada (opcional)</Label>
              <select
                value={formData.monthly_revenue}
                onChange={(e) => setFormData({ ...formData, monthly_revenue: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="">Selecciona</option>
                <option value="<1000">Menos de 1.000€</option>
                <option value="1000-2500">1.000€ - 2.500€</option>
                <option value="2500-5000">2.500€ - 5.000€</option>
                <option value="5000-10000">5.000€ - 10.000€</option>
                <option value="10000+">Más de 10.000€</option>
              </select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-base">Edad de tus clientes ideales</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {[
                  '18-25', '25-35', '35-45', '45-55', '55-65', '65+'
                ].map(range => (
                  <label
                    key={range}
                    className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer ${
                      formData.ideal_age_ranges.includes(range)
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.ideal_age_ranges.includes(range)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, ideal_age_ranges: [...formData.ideal_age_ranges, range] });
                        } else {
                          setFormData({ ...formData, ideal_age_ranges: formData.ideal_age_ranges.filter(r => r !== range) });
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm font-medium">{range}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label>Sexo predominante</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {[
                  { id: 'hombres', label: 'Hombres' },
                  { id: 'mujeres', label: 'Mujeres' },
                  { id: 'ambos', label: 'Ambos' }
                ].map(option => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, ideal_gender: option.id })}
                    className={`p-3 border-2 rounded-lg transition-all ${
                      formData.ideal_gender === option.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Intereses / Hobbies de tus clientes</Label>
              <p className="text-xs text-gray-500 mt-1">Ej: deporte, cocina, tecnología, viajes...</p>
              <Input
                value={formData.ideal_interests.join(", ")}
                onChange={(e) => setFormData({ ...formData, ideal_interests: e.target.value.split(",").map(i => i.trim()).filter(Boolean) })}
                placeholder="Ej: deporte, cocina, tecnología"
                className="mt-2"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-base">¿En qué redes suelen estar tus clientes?</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {[
                  { id: 'instagram', label: 'Instagram' },
                  { id: 'facebook', label: 'Facebook' },
                  { id: 'tiktok', label: 'TikTok' },
                  { id: 'linkedin', label: 'LinkedIn' },
                  { id: 'youtube', label: 'YouTube' },
                  { id: 'google', label: 'Google' },
                  { id: 'whatsapp', label: 'WhatsApp' }
                ].map(network => (
                  <label
                    key={network.id}
                    className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer ${
                      formData.client_social_networks.includes(network.id)
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.client_social_networks.includes(network.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, client_social_networks: [...formData.client_social_networks, network.id] });
                        } else {
                          setFormData({ ...formData, client_social_networks: formData.client_social_networks.filter(n => n !== network.id) });
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm font-medium">{network.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label>¿Qué ámbito geográfico cubres?</Label>
              <select
                value={formData.geographic_scope}
                onChange={(e) => setFormData({ ...formData, geographic_scope: e.target.value })}
                className="w-full mt-2 px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="">Selecciona</option>
                <option value="local">Local (mi ciudad/barrio)</option>
                <option value="provincial">Provincial</option>
                <option value="regional">Regional (comunidad autónoma)</option>
                <option value="nacional">Nacional</option>
                <option value="online">Online (sin límite geográfico)</option>
              </select>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-base">¿Cómo consigues clientes actualmente?</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {[
                  { id: 'word_of_mouth', label: 'Boca a boca' },
                  { id: 'google', label: 'Google Search' },
                  { id: 'instagram', label: 'Instagram' },
                  { id: 'facebook', label: 'Facebook' },
                  { id: 'tiktok', label: 'TikTok' },
                  { id: 'linkedin', label: 'LinkedIn' },
                  { id: 'misautonomos', label: 'MisAutónomos' },
                  { id: 'website', label: 'Mi web' },
                  { id: 'physical_store', label: 'Tienda física' },
                  { id: 'other', label: 'Otro' }
                ].map(channel => (
                  <label
                    key={channel.id}
                    className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer ${
                      formData.current_channels.includes(channel.id)
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.current_channels.includes(channel.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, current_channels: [...formData.current_channels, channel.id] });
                        } else {
                          setFormData({ ...formData, current_channels: formData.current_channels.filter(c => c !== channel.id) });
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm font-medium">{channel.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label>¿Qué es lo más difícil para ti ahora?</Label>
              <Textarea
                value={formData.biggest_challenge}
                onChange={(e) => setFormData({ ...formData, biggest_challenge: e.target.value })}
                placeholder="Ej: Conseguir nuevos clientes, fidelizar, aumentar ticket medio..."
                rows={3}
                className="mt-2"
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-base">¿Cuál es tu objetivo los próximos 6 meses?</Label>
              <div className="space-y-2 mt-2">
                {[
                  { id: 'new_clients', label: 'Conseguir nuevos clientes' },
                  { id: 'loyalty', label: 'Fidelizar clientes actuales' },
                  { id: 'increase_ticket', label: 'Subir ticket medio' },
                  { id: 'expand_zone', label: 'Expandir zona de servicio' },
                  { id: 'new_services', label: 'Lanzar nuevos servicios' }
                ].map(goal => (
                  <label
                    key={goal.id}
                    className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer ${
                      formData.six_month_goal === goal.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="six_month_goal"
                      checked={formData.six_month_goal === goal.id}
                      onChange={() => setFormData({ ...formData, six_month_goal: goal.id })}
                      className="mt-1 w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm font-medium">{goal.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label>¿Qué te diferencia de la competencia?</Label>
              <p className="text-xs text-gray-500 mt-1">1-2 frases cortas</p>
              <Textarea
                value={formData.differentiation}
                onChange={(e) => setFormData({ ...formData, differentiation: e.target.value })}
                placeholder="Ej: Atiendo urgencias 24/7, doy garantía de 2 años, uso materiales premium..."
                rows={2}
                className="mt-2"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-xs font-medium text-gray-500">Paso {step} de 5</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(n => (
            <div
              key={n}
              className={`h-1 w-8 rounded-full transition-colors ${
                n <= step ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step content */}
      <h2 className="text-lg font-semibold text-gray-900 mb-1">
        {STEPS[step - 1].title}
      </h2>
      <p className="text-sm text-gray-500 mb-5">{STEPS[step - 1].subtitle}</p>

      {renderStep()}

      {/* Navigation */}
      <div className="flex justify-between mt-6 pt-5 border-t border-gray-100">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={step === 1}
          className="text-sm"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Atrás
        </Button>
        {step < 5 ? (
          <Button
            type="button"
            onClick={handleNext}
            className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium"
          >
            Siguiente
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
          >
            {saving ? "Guardando..." : "Finalizar"}
          </Button>
        )}
      </div>
    </div>
  );
}
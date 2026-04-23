import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Megaphone, Plus, ChevronRight, CheckCircle, Clock, Zap, BarChart2, MessageSquare, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_LABELS = {
  draft: { label: 'Borrador', color: 'bg-gray-100 text-gray-700' },
  submitted: { label: 'Enviado', color: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'En revisión', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Aprobado', color: 'bg-green-100 text-green-700' },
  live: { label: 'Activo', color: 'bg-emerald-100 text-emerald-700' },
  completed: { label: 'Finalizado', color: 'bg-gray-100 text-gray-600' },
};

const CAMPAIGN_STATUS_LABELS = {
  pending: { label: 'Pendiente', color: 'bg-gray-100 text-gray-600' },
  in_review: { label: 'En revisión', color: 'bg-blue-100 text-blue-700' },
  creating: { label: 'Creando material', color: 'bg-yellow-100 text-yellow-700' },
  live: { label: '🔴 En directo', color: 'bg-green-100 text-green-700' },
  paused: { label: 'Pausada', color: 'bg-orange-100 text-orange-700' },
  finished: { label: 'Finalizada', color: 'bg-gray-100 text-gray-500' },
};

const PLATFORM_LABELS = {
  instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok',
  google_search: 'Google Search', linkedin: 'LinkedIn'
};

const GOAL_LABELS = {
  more_calls: 'Más llamadas', more_leads: 'Más contactos',
  more_quotes: 'Más presupuestos', brand_awareness: 'Notoriedad',
  website_traffic: 'Tráfico al perfil'
};

export default function MiCampana() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(true);

  const currentMonthYear = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const currentMonthLabel = new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' });

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        const briefings = await base44.entities.AdsBriefing.filter({
          professional_id: u.id,
          month_year: currentMonthYear
        });
        setBriefing(briefings[0] || null);
      } catch (err) {
        console.error('MiCampana error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const metrics = briefing?.campaign_metrics || {};
  const budgetSpent = metrics.spent_eur || 0;
  const budgetTotal = briefing?.included_budget_eur || 30;
  const budgetPct = Math.min((budgetSpent / budgetTotal) * 100, 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mi Campaña Ads+</h1>
            <p className="text-sm text-gray-500 capitalize">{currentMonthLabel}</p>
          </div>
        </div>

        {/* Sin briefing este mes */}
        {!briefing && (
          <Card className="border-0 shadow-md text-center py-12">
            <CardContent>
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Megaphone className="w-8 h-8 text-blue-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                ¡Configura tu campaña de {currentMonthLabel}!
              </h2>
              <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
                Dinos dónde quieres anunciarte y qué objetivo tienes. Nuestro equipo se encarga del resto.
              </p>
              <Button
                onClick={() => navigate('/mi-campana/briefing')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3"
              >
                <Plus className="w-4 h-4 mr-2" />
                Configurar campaña
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Con briefing */}
        {briefing && (
          <div className="space-y-4">
            {/* Estado general */}
            <Card className="border-0 shadow-md">
              <CardContent className="pt-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Estado del briefing</p>
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_LABELS[briefing.status]?.color}`}>
                      {STATUS_LABELS[briefing.status]?.label}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">Estado de campaña</p>
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${CAMPAIGN_STATUS_LABELS[briefing.campaign_status]?.color}`}>
                      {CAMPAIGN_STATUS_LABELS[briefing.campaign_status]?.label}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-0.5">Red</p>
                    <p className="font-semibold text-gray-900">{PLATFORM_LABELS[briefing.platform] || briefing.platform}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-0.5">Objetivo</p>
                    <p className="font-semibold text-gray-900">{GOAL_LABELS[briefing.goal] || briefing.goal}</p>
                  </div>
                </div>

                {/* Presupuesto */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Presupuesto utilizado</span>
                    <span>{budgetSpent.toFixed(2)} € / {budgetTotal} €</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${budgetPct}%` }}
                    />
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() => navigate('/mi-campana/briefing')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Editar briefing
                </Button>
              </CardContent>
            </Card>

            {/* Material del anuncio */}
            {(briefing.ads_copy || briefing.ads_creative_urls?.length > 0) && (
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-600" />
                    Material de tu anuncio
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {briefing.ads_copy && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Copy del anuncio</p>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{briefing.ads_copy}</p>
                    </div>
                  )}
                  {briefing.ads_creative_urls?.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Creatividades</p>
                      <div className="grid grid-cols-3 gap-2">
                        {briefing.ads_creative_urls.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                            <img src={url} alt={`Creativo ${i + 1}`} className="w-full h-24 object-cover rounded-lg border border-gray-200" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {!briefing.ads_content_approved && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                      ⏳ Nuestro equipo está preparando el material. Te avisaremos cuando esté listo para tu revisión.
                    </div>
                  )}
                  {briefing.ads_content_approved && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-800 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Material aprobado. Tu campaña está en marcha.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Métricas */}
            {briefing.campaign_status === 'live' || briefing.campaign_status === 'finished' ? (
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-blue-600" />
                    Resultados de la campaña
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Alcance', value: metrics.reach?.toLocaleString() || '—' },
                      { label: 'Clics', value: metrics.clicks?.toLocaleString() || '—' },
                      { label: 'Leads', value: metrics.leads_generated?.toLocaleString() || '—' },
                      { label: 'Coste/clic', value: metrics.cpc ? `${metrics.cpc.toFixed(2)} €` : '—' },
                    ].map(m => (
                      <div key={m.label} className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="text-xl font-bold text-gray-900">{m.value}</p>
                        <p className="text-xs text-gray-500">{m.label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 flex items-start gap-2">
                <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Las métricas aparecerán aquí cuando tu campaña esté activa.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
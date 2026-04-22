import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Megaphone, Clock, CheckCircle, TrendingUp, Eye, MousePointer, UserPlus, Calendar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import InsightsOnboarding from "@/components/ads/InsightsOnboarding";
import { getUserPlan, isAdsPlus } from "@/utils/subscription";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function MiCampanaPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userPlan, setUserPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar usuario y plan
  useEffect(() => {
    loadUserAndPlan();
  }, []);

  const loadUserAndPlan = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (!currentUser) {
        base44.auth.redirectToLogin();
        return;
      }
      setUser(currentUser);
      
      const plan = await getUserPlan(currentUser.id);
      setUserPlan(plan);
      
      if (!isAdsPlus(plan)) {
        toast.error("Necesitas el Plan Ads+ para acceder");
        navigate("/precios");
        return;
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error loading user:", error);
      setLoading(false);
    }
  };

  const currentMonthYear = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const currentMonth = new Date().getMonth() + 1;

  // Cargar insights
  const { data: insights, isLoading: loadingInsights } = useQuery({
    queryKey: ['clientInsights', user?.id],
    queryFn: async () => {
      const results = await base44.entities.ClientInsights.filter({ user_id: user.id });
      return results[0] || null;
    },
    enabled: !!user && !loading,
    staleTime: 1000 * 60 * 30
  });

  // Cargar briefing del mes actual
  const { data: currentBriefing, isLoading: loadingBriefing } = useQuery({
    queryKey: ['adsBriefing', user?.id, currentMonthYear],
    queryFn: async () => {
      const results = await base44.entities.AdsBriefing.filter({
        professional_id: user.id,
        month_year: currentMonthYear
      });
      return results[0] || null;
    },
    enabled: !!user && !loading,
    staleTime: 1000 * 60 * 5
  });

  // Cargar histórico de briefings
  const { data: previousBriefings } = useQuery({
    queryKey: ['previousBriefings', user?.id],
    queryFn: async () => {
      return await base44.entities.AdsBriefing.filter({ professional_id: user.id }, '-created_date', 12) || [];
    },
    enabled: !!user && !loading,
    staleTime: 1000 * 60 * 10
  });

  if (loading || loadingInsights) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  // ESTADO A: Sin insights → mostrar onboarding
  if (!insights) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white mb-6">
            <Megaphone className="w-10 h-10 mb-3" />
            <h1 className="text-2xl font-bold">Bienvenido a tu Plan Ads+</h1>
            <p className="text-sm text-blue-100 mt-1">
              Vamos a conocer tu negocio para crear las mejores campañas. 
              Solo son 2 minutos. Lo hacemos una vez y lo usamos cada mes.
            </p>
          </div>
          
          <InsightsOnboarding 
            user={user}
            onComplete={() => {
              window.location.reload();
            }}
          />
        </div>
      </div>
    );
  }

  // ESTADO B/C/D/E: Con insights, mostrar gestión de campaña mensual
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Megaphone className="w-7 h-7 text-blue-600" />
            Mi campaña
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestiona tu campaña mensual del Plan Ads+
          </p>
        </div>

        {/* Sin briefing del mes → mostrar CTA */}
        {!currentBriefing && (
          <>
            <Card className="mb-6 border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      Plan Ads+ activo
                    </span>
                    <CardTitle className="text-xl font-bold text-gray-900 mt-2">
                      Campaña de {MONTH_NAMES[currentMonth - 1]}
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      Elige la red donde quieres que promocionemos tu negocio este mes
                    </p>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <p>Cierre briefing: día 5 de cada mes</p>
                    <p className="font-medium text-gray-700 mt-1">
                      Quedan {Math.max(0, 5 - new Date().getDate())} días
                    </p>
                  </div>
                </div>

                {new Date().getDate() <= 2 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800 mt-4">
                    ⚠️ Se acerca la fecha de cierre. Si no rellenas el briefing, mantendremos la estrategia del mes anterior.
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => navigate(`/mi-campana/briefing`)}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3"
                >
                  Configurar campaña de {MONTH_NAMES[currentMonth - 1]} →
                </Button>
              </CardContent>
            </Card>

            {/* Histórico */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Historial de campañas</CardTitle>
              </CardHeader>
              <CardContent>
                {previousBriefings?.length === 0 ? (
                  <p className="text-sm text-gray-500">Aún no tienes campañas anteriores.</p>
                ) : (
                  <div className="space-y-2">
                    {previousBriefings.slice(0, 5).map(b => (
                      <div key={b.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {MONTH_NAMES[b.month - 1]} {b.year}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">{b.platform}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded font-medium ${
                          b.campaign_status === 'live' ? 'bg-green-100 text-green-700' :
                          b.campaign_status === 'in_review' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-200 text-gray-600'
                        }`}>
                          {b.campaign_status === 'live' ? 'En vivo' :
                           b.campaign_status === 'in_review' ? 'Revisión' :
                           b.campaign_status === 'finished' ? 'Finalizada' : 'Pendiente'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Con briefing → mostrar estado de campaña */}
        {currentBriefing && (
          <CampaignStatusCard 
            briefing={currentBriefing}
            user={user}
          />
        )}
      </div>
    </div>
  );
}

function CampaignStatusCard({ briefing, user }) {
  const navigate = useNavigate();
  const status = briefing.campaign_status || 'pending';
  
  const statusConfig = {
    pending: {
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      icon: Clock,
      title: 'Briefing enviado',
      desc: 'Tu briefing está recibido. Nuestro equipo lo revisará pronto.'
    },
    creating: {
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      icon: Clock,
      title: 'Campaña en preparación',
      desc: 'Estamos creando las creatividades y configurando la campaña.'
    },
    in_review: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: AlertCircle,
      title: 'Revisa y aprueba tu campaña',
      desc: 'Hemos preparado tu campaña. Revísala y apruébala para lanzarla.'
    },
    live: {
      bg: 'bg-green-50',
      border: 'border-green-100',
      icon: CheckCircle,
      title: 'Campaña en vivo',
      desc: 'Tu campaña está activa y consiguiendo resultados.'
    },
    finished: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      icon: CheckCircle,
      title: 'Campaña finalizada',
      desc: 'La campaña ha terminado. Revisa los resultados.'
    }
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <div className="space-y-6">
      {/* Estado actual */}
      <Card className={`${config.bg} ${config.border} border-2`}>
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              status === 'live' ? 'bg-green-600' :
              status === 'in_review' ? 'bg-amber-600' :
              'bg-blue-600'
            }`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{config.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{config.desc}</p>
              {status === 'live' && (
                <p className="text-xs text-gray-500 mt-2">
                  Día {Math.ceil((new Date() - new Date(briefing.launch_date)) / (1000 * 60 * 60 * 24))} de campaña
                </p>
              )}
              {status === 'pending' && (
                <button
                  onClick={() => navigate('/mi-campana/briefing')}
                  className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-800 underline"
                >
                  ✏️ Editar briefing
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Progreso de la campaña</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <TimelineItem 
              done 
              label="Briefing enviado" 
              date={briefing.submitted_at}
            />
            <TimelineItem 
              done={status !== 'pending'} 
              label="Creatividades en diseño"
              date={briefing.design_started_at}
            />
            <TimelineItem 
              current={status === 'in_review'}
              done={status === 'live' || status === 'finished'}
              label="Pendiente de tu aprobación"
            />
            <TimelineItem 
              current={status === 'live'}
              done={status === 'finished'}
              label="Campaña en vivo"
              date={briefing.launch_date}
            />
            <TimelineItem 
              done={status === 'finished'}
              label="Resultados finales"
            />
          </div>
        </CardContent>
      </Card>

      {/* Métricas si está en vivo */}
      {status === 'live' && briefing.campaign_metrics && (
        <MetricsCard metrics={briefing.campaign_metrics} budget={briefing.included_budget_eur} />
      )}

      {/* Creatividades para aprobar */}
      {status === 'in_review' && briefing.ads_creative_urls && (
        <CreativeReviewCard briefing={briefing} />
      )}
    </div>
  );
}

function TimelineItem({ done, current, label, date }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
        done ? 'bg-green-600' :
        current ? 'bg-blue-600 animate-pulse' :
        'bg-gray-200'
      }`}>
        {done && <CheckCircle className="w-4 h-4 text-white" />}
        {current && <Clock className="w-4 h-4 text-white" />}
      </div>
      <div className="flex-1">
        <p className={`text-sm font-medium ${done || current ? 'text-gray-900' : 'text-gray-500'}`}>
          {label}
        </p>
        {date && (
          <p className="text-xs text-gray-500 mt-0.5">
            {new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
          </p>
        )}
      </div>
    </div>
  );
}

function MetricsCard({ metrics, budget }) {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          Resultados en tiempo real
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <MetricCard 
            label="Alcance" 
            value={metrics.reach?.toLocaleString() || '—'} 
            icon={Eye}
          />
          <MetricCard 
            label="Impresiones" 
            value={metrics.impressions?.toLocaleString() || '—'} 
            icon={TrendingUp}
          />
          <MetricCard 
            label="Clics" 
            value={metrics.clicks || '—'} 
            icon={MousePointer}
          />
          <MetricCard 
            label="Leads" 
            value={metrics.leads_generated || '—'} 
            icon={UserPlus}
            highlight
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">PRESUPUESTO</span>
            <span className="text-sm font-bold text-gray-900">
              {metrics.spent_eur?.toFixed(2) || '0'}€ / 30,00€
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
              style={{width: `${Math.min(100, (metrics.spent_eur / 30) * 100)}%`}}
            />
          </div>
          <p className="text-[10px] text-gray-500 mt-1.5">
            Invertido en tu campaña a día {new Date().getDate()} de {new Date().toLocaleDateString('es-ES', { month: 'long' })}
          </p>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">CPC medio</span>
            <span className="font-semibold">
              {metrics.cpc?.toFixed(2) || '—'}€
            </span>
          </div>
          <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Conversiones</span>
            <span className="font-semibold">
              {metrics.conversions || '—'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCard({ label, value, icon: Icon, highlight }) {
  return (
    <div className={`p-4 rounded-xl border-2 ${
      highlight ? 'border-blue-200 bg-blue-50' : 'border-gray-100 bg-white'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${highlight ? 'text-blue-600' : 'text-gray-400'}`} />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className={`text-xl font-bold ${highlight ? 'text-blue-900' : 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  );
}

function CreativeReviewCard({ briefing }) {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Creatividades propuestas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {briefing.ads_creative_urls.map((url, idx) => (
            <img 
              key={idx} 
              src={url} 
              alt={`Creatividad ${idx + 1}`}
              className="rounded-lg w-full h-48 object-cover"
            />
          ))}
        </div>
        
        {briefing.ads_copy && (
          <div className="p-3 bg-gray-50 rounded-lg mb-4">
            <p className="text-xs text-gray-500 mb-1 font-medium">COPY DEL ANUNCIO</p>
            <p className="text-sm text-gray-900">{briefing.ads_copy}</p>
          </div>
        )}
        
        <div className="flex gap-2">
          <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium">
            ✓ Aprobar y lanzar
          </Button>
          <Button variant="outline" className="flex-1 border-gray-200 text-gray-700 text-sm font-medium">
            Pedir cambios
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
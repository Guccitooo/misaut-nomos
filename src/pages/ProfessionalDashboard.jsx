import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Users, Briefcase, FileText, Calendar, Euro,
  Clock, CheckCircle, AlertCircle, Plus, ArrowRight, TrendingUp
} from "lucide-react";
import Loader from "@/components/ui/Loader";
import SEOHead from "../components/seo/SEOHead";
import PullToRefresh from "../components/ui/PullToRefresh";
import ProMetrics from "../components/dashboard/ProMetrics";
import ProfileCompletionCard from "../components/dashboard/ProfileCompletionCard";
import { useQueryClient } from "@tanstack/react-query";

const QUICK_ACTIONS = [
  { label: "Nuevo cliente", icon: Users, color: "from-blue-500 to-cyan-500", page: "CRM", params: "?new=true" },
  { label: "Nuevo trabajo", icon: Briefcase, color: "from-emerald-500 to-green-500", page: "Jobs", params: "?new=true" },
  { label: "Nueva factura", icon: FileText, color: "from-orange-500 to-amber-500", page: "Invoices", params: "?new=true" },
];

export default function ProfessionalDashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (!currentUser || currentUser.user_type !== 'professionnel') {
        navigate(createPageUrl("Search"));
        return;
      }
      setUser(currentUser);
    } catch (error) {
      navigate(createPageUrl("Search"));
    } finally {
      setLoading(false);
    }
  };

  const { data: contacts = [] } = useQuery({
    queryKey: ['clientContacts', user?.id],
    queryFn: () => base44.entities.ClientContact.filter({ professional_id: user.id }),
    enabled: !!user,
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs', user?.id],
    queryFn: () => base44.entities.Job.filter({ professional_id: user.id }),
    enabled: !!user,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices', user?.id],
    queryFn: () => base44.entities.Invoice.filter({ professional_id: user.id }),
    enabled: !!user,
  });

  const { data: profile } = useQuery({
    queryKey: ['professionalProfile', user?.id],
    queryFn: async () => {
      const profiles = await base44.entities.ProfessionalProfile.filter({ user_id: user.id });
      return profiles[0] || null;
    },
    enabled: !!user,
  });

  const { data: metrics = [] } = useQuery({
    queryKey: ['profileMetrics', user?.id],
    queryFn: () => base44.entities.ProfileMetrics.filter({ professional_id: user.id }),
    enabled: !!user,
  });

  if (loading) return <Loader />;

  const activeClients = contacts.filter(c => c.status === 'client').length;
  const leads = contacts.filter(c => c.status === 'lead' || c.status === 'contacted').length;
  const activeJobs = jobs.filter(j => j.status === 'in_progress').length;
  const pendingJobs = jobs.filter(j => j.status === 'pending').length;
  const completedJobs = jobs.filter(j => j.status === 'completed').length;
  const pendingInvoices = invoices.filter(i => i.status === 'sent').length;
  const overdueInvoices = invoices.filter(i => i.status === 'overdue').length;
  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + (inv.total || 0), 0);

  // Métricas de visibilidad
  const totalViews = metrics.reduce((sum, m) => sum + (m.profile_views || 0), 0);
  const totalContacts = metrics.reduce((sum, m) => sum + (m.messages_received || 0), 0) + contacts.length;

  const upcomingJobs = jobs
    .filter(j => j.status === 'pending' && j.start_date)
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
    .slice(0, 5);

  const recentJobs = jobs
    .filter(j => j.status === 'in_progress' || j.status === 'completed')
    .sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date))
    .slice(0, 5);

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['clientContacts'] }),
      queryClient.invalidateQueries({ queryKey: ['jobs'] }),
      queryClient.invalidateQueries({ queryKey: ['invoices'] }),
      queryClient.invalidateQueries({ queryKey: ['profileMetrics'] }),
    ]);
  };

  const displayName = user?.full_name?.split(' ')[0] || "Pro";
  const hour = new Date().getHours();
  const greeting = hour < 13 ? "Buenos días" : hour < 20 ? "Buenas tardes" : "Buenas noches";

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <SEOHead title="Dashboard Profesional - MisAutónomos" />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-5 md:space-y-6">

          {/* HEADER */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <p className="text-sm text-gray-500 font-medium">{greeting}, {displayName} 👋</p>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mt-0.5">Panel de Control</h1>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => navigate(createPageUrl("CRM"))} variant="outline" className="h-10 rounded-xl border-gray-200 text-gray-700">
                <Users className="w-4 h-4 mr-2" />
                CRM
              </Button>
              <Button onClick={() => navigate(createPageUrl("Invoices"))} className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700">
                <FileText className="w-4 h-4 mr-2" />
                Facturas
              </Button>
            </div>
          </motion.div>

          {/* MÉTRICAS DE VISIBILIDAD */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider">Visibilidad de tu perfil</h2>
            </div>
            <ProMetrics
              views={totalViews}
              contacts={totalContacts}
              rating={profile?.average_rating || 0}
              totalReviews={profile?.total_reviews || 0}
            />
          </div>

          {/* COMPLETITUD DEL PERFIL + MÉTRICAS CRM */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
            <div className="lg:col-span-1">
              <ProfileCompletionCard profile={profile} />
            </div>

            <div className="lg:col-span-2 grid grid-cols-2 gap-3 md:gap-4">
              {[
                { value: activeClients, label: "Clientes activos", sub: `${leads} leads`, Icon: Users, color: "from-blue-500 to-cyan-500", action: () => navigate(createPageUrl("CRM")) },
                { value: activeJobs, label: "Trabajos en curso", sub: `${pendingJobs} pendientes`, Icon: Briefcase, color: "from-emerald-500 to-green-500", action: () => navigate(createPageUrl("Jobs")) },
                { value: pendingInvoices, label: "Facturas pendientes", sub: overdueInvoices > 0 ? `${overdueInvoices} vencidas ⚠️` : "Al día", Icon: FileText, color: "from-amber-500 to-orange-500", action: () => navigate(createPageUrl("Invoices")) },
                { value: `${totalRevenue.toFixed(0)}€`, label: "Ingresos cobrados", sub: `${completedJobs} trabajos`, Icon: TrendingUp, color: "from-purple-500 to-violet-500", action: () => navigate(createPageUrl("Invoices")) },
              ].map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all cursor-pointer rounded-2xl group bg-white"
                    onClick={m.action}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${m.color} opacity-0 group-hover:opacity-[0.05] transition-opacity`} />
                    <div className={`absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br ${m.color} rounded-full opacity-10 blur-xl group-hover:opacity-20 transition-opacity`} />
                    <CardContent className="relative p-4 md:p-5">
                      <div className={`inline-flex w-9 h-9 rounded-xl bg-gradient-to-br ${m.color} items-center justify-center mb-3 shadow-sm`}>
                        <m.Icon className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-2xl md:text-3xl font-extrabold text-gray-900">{m.value}</p>
                      <p className="text-xs font-semibold text-gray-700 mt-0.5">{m.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{m.sub}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* TRABAJOS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
            {/* Próximos */}
            <Card className="border-0 shadow-sm rounded-2xl bg-white">
              <CardHeader className="border-b border-gray-100 pb-3 pt-4 px-5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-gray-900">Próximos trabajos</CardTitle>
                  <Button size="sm" variant="ghost" onClick={() => navigate(createPageUrl("Jobs"))} className="text-xs h-7 rounded-lg">
                    Ver todos <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {upcomingJobs.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                    <p className="text-sm">No hay trabajos próximos</p>
                    <Button size="sm" variant="outline" className="mt-3 rounded-lg" onClick={() => navigate(createPageUrl("Jobs") + "?new=true")}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> Añadir trabajo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {upcomingJobs.map(job => (
                      <div key={job.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group" onClick={() => navigate(createPageUrl("Jobs"))}>
                        <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                          <Calendar className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{job.title}</p>
                          <p className="text-xs text-gray-500 truncate">{job.client_name}</p>
                        </div>
                        <div className="text-xs font-semibold text-gray-600 shrink-0">
                          {new Date(job.start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recientes */}
            <Card className="border-0 shadow-sm rounded-2xl bg-white">
              <CardHeader className="border-b border-gray-100 pb-3 pt-4 px-5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-gray-900">Trabajos recientes</CardTitle>
                  <Button size="sm" variant="ghost" onClick={() => navigate(createPageUrl("Jobs"))} className="text-xs h-7 rounded-lg">
                    Ver todos <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {recentJobs.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Briefcase className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                    <p className="text-sm">No hay trabajos recientes</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentJobs.map(job => (
                      <div key={job.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(createPageUrl("Jobs"))}>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${job.status === 'completed' ? 'bg-green-100' : 'bg-blue-100'}`}>
                          {job.status === 'completed'
                            ? <CheckCircle className="w-4 h-4 text-green-600" />
                            : <Clock className="w-4 h-4 text-blue-600" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{job.title}</p>
                          <p className="text-xs text-gray-500 truncate">{job.client_name}</p>
                        </div>
                        <Badge
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${job.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}
                        >
                          {job.status === 'in_progress' ? 'En curso' : 'Completado'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ACCIONES RÁPIDAS */}
          <Card className="border-0 shadow-sm rounded-2xl bg-white">
            <CardHeader className="pb-3 pt-5 px-5">
              <CardTitle className="text-base font-bold text-gray-900">Acciones rápidas</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-5">
              <div className="grid grid-cols-3 gap-3">
                {QUICK_ACTIONS.map((action, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(createPageUrl(action.page) + action.params)}
                    className={`group relative overflow-hidden flex flex-col items-center gap-2.5 py-5 px-3 rounded-2xl bg-gradient-to-br ${action.color} text-white font-semibold text-sm shadow-sm hover:shadow-md transition-shadow`}
                  >
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                    <Plus className="w-5 h-5 opacity-80 group-hover:rotate-90 transition-transform duration-300" />
                    <span className="relative z-10">{action.label}</span>
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </PullToRefresh>
  );
}
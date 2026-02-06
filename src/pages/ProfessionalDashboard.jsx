import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Briefcase,
  FileText,
  TrendingUp,
  Calendar,
  Euro,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  ArrowRight
} from "lucide-react";
import Loader from "@/components/ui/Loader";
import { useLanguage } from "../components/ui/LanguageSwitcher";
import SEOHead from "../components/seo/SEOHead";
import PullToRefresh from "../components/ui/PullToRefresh";
import { useQueryClient } from "@tanstack/react-query";

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

  if (loading) {
    return <Loader />;
  }

  const activeClients = contacts.filter(c => c.status === 'client').length;
  const leads = contacts.filter(c => c.status === 'lead' || c.status === 'contacted').length;
  const activeJobs = jobs.filter(j => j.status === 'in_progress').length;
  const pendingJobs = jobs.filter(j => j.status === 'pending').length;
  const completedJobs = jobs.filter(j => j.status === 'completed').length;
  const pendingInvoices = invoices.filter(i => i.status === 'sent').length;
  const overdueInvoices = invoices.filter(i => i.status === 'overdue').length;
  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + (inv.total || 0), 0);

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
    ]);
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Panel de Control</h1>
            <p className="text-gray-600 mt-1">Gestiona tu negocio desde aquí</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate(createPageUrl("CRM"))} variant="outline">
              <Users className="w-4 h-4 mr-2" />
              CRM
            </Button>
            <Button onClick={() => navigate(createPageUrl("Invoices"))} className="bg-blue-600 hover:bg-blue-700">
              <FileText className="w-4 h-4 mr-2" />
              Facturas
            </Button>
          </div>
        </div>

        {/* MÉTRICAS PRINCIPALES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-blue-600" />
                <Badge className="bg-blue-50 text-blue-700">{leads} leads</Badge>
              </div>
              <p className="text-3xl font-bold text-gray-900">{activeClients}</p>
              <p className="text-sm text-gray-600">Clientes activos</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Briefcase className="w-8 h-8 text-green-600" />
                <Badge className="bg-green-50 text-green-700">{pendingJobs} pendientes</Badge>
              </div>
              <p className="text-3xl font-bold text-gray-900">{activeJobs}</p>
              <p className="text-sm text-gray-600">Trabajos en curso</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <FileText className="w-8 h-8 text-orange-600" />
                <Badge className="bg-orange-50 text-orange-700">{overdueInvoices} vencidas</Badge>
              </div>
              <p className="text-3xl font-bold text-gray-900">{pendingInvoices}</p>
              <p className="text-sm text-gray-600">Facturas pendientes</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{totalRevenue.toFixed(0)}€</p>
              <p className="text-sm text-gray-600">Ingresos totales</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* PRÓXIMOS TRABAJOS */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold">Próximos trabajos</CardTitle>
                <Button size="sm" variant="ghost" onClick={() => navigate(createPageUrl("Jobs"))}>
                  Ver todos <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {upcomingJobs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No hay trabajos próximos</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingJobs.map(job => (
                    <div key={job.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{job.title}</p>
                        <p className="text-sm text-gray-600">{job.client_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(job.start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* TRABAJOS RECIENTES */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold">Trabajos recientes</CardTitle>
                <Button size="sm" variant="ghost" onClick={() => navigate(createPageUrl("Jobs"))}>
                  Ver todos <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {recentJobs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No hay trabajos recientes</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentJobs.map(job => (
                    <div key={job.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
                      <div className="flex-shrink-0">
                        {job.status === 'completed' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Clock className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{job.title}</p>
                        <p className="text-sm text-gray-600">{job.client_name}</p>
                      </div>
                      <Badge variant={job.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
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
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Acciones rápidas</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => navigate(createPageUrl("CRM") + "?new=true")}>
                <Plus className="w-6 h-6 text-blue-600" />
                <span className="font-semibold">Nuevo cliente</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => navigate(createPageUrl("Jobs") + "?new=true")}>
                <Plus className="w-6 h-6 text-green-600" />
                <span className="font-semibold">Nuevo trabajo</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => navigate(createPageUrl("Invoices") + "?new=true")}>
                <Plus className="w-6 h-6 text-orange-600" />
                <span className="font-semibold">Nueva factura</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PullToRefresh>
  );
}
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Loader2, 
  FolderKanban, 
  Plus, 
  Calendar, 
  Clock,
  User,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Pause,
  Users,
  FileText,
  Euro,
  Search
} from "lucide-react";
import { toast } from "sonner";
import SEOHead from "../components/seo/SEOHead";
import { useLanguage } from "../components/ui/LanguageSwitcher";

export default function ProjectsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  React.useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      base44.auth.redirectToLogin();
    } finally {
      setLoadingUser(false);
    }
  };

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', user?.id],
    queryFn: () => base44.entities.Project.filter({ professional_id: user.id }, '-created_date'),
    enabled: !!user,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clientContacts', user?.id],
    queryFn: () => base44.entities.ClientContact.filter({ professional_id: user.id }),
    enabled: !!user,
  });

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusConfig = (status) => {
    const configs = {
      planning: { color: 'bg-gray-100 text-gray-800', icon: Calendar, label: 'Planificación' },
      in_progress: { color: 'bg-blue-100 text-blue-800', icon: TrendingUp, label: 'En progreso' },
      on_hold: { color: 'bg-yellow-100 text-yellow-800', icon: Pause, label: 'En pausa' },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle2, label: 'Completado' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: AlertCircle, label: 'Cancelado' }
    };
    return configs[status] || configs.planning;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-blue-500',
      medium: 'bg-yellow-500',
      high: 'bg-orange-500',
      urgent: 'bg-red-500'
    };
    return colors[priority] || colors.medium;
  };

  const stats = {
    active: projects.filter(p => p.status === 'in_progress').length,
    planning: projects.filter(p => p.status === 'planning').length,
    completed: projects.filter(p => p.status === 'completed').length,
    totalHours: projects.reduce((sum, p) => sum + (p.total_hours_logged || 0), 0),
  };

  if (loadingUser || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const isProfessional = user?.user_type === 'professionnel';

  return (
    <>
      <SEOHead 
        title="Gestión de Proyectos - MisAutónomos"
        description="Gestiona tus proyectos, fases y tareas"
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-4 md:py-8 px-3 md:px-4 pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <FolderKanban className="w-7 h-7 md:w-8 md:h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Proyectos</h1>
                <p className="text-xs md:text-sm text-gray-600">Gestiona tus proyectos de principio a fin</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => navigate(createPageUrl("CRM"))}
                variant="outline"
                size="sm"
                className="bg-white border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <Users className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Ir a CRM</span>
                <span className="sm:hidden">CRM</span>
              </Button>
              <Button 
                onClick={() => navigate(createPageUrl("ProjectDetail") + "?new=true")}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Nuevo Proyecto</span>
                <span className="sm:hidden">Nuevo</span>
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-9 h-9 md:w-10 md:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.active}</p>
                    <p className="text-xs text-gray-500">En progreso</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-9 h-9 md:w-10 md:h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.planning}</p>
                    <p className="text-xs text-gray-500">Planificación</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-9 h-9 md:w-10 md:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.completed}</p>
                    <p className="text-xs text-gray-500">Completados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-9 h-9 md:w-10 md:h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.totalHours}</p>
                    <p className="text-xs text-gray-500">Horas totales</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 mb-6">
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm md:text-base">Acciones rápidas</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Button 
                  onClick={() => navigate(createPageUrl("CRM"))}
                  variant="outline"
                  size="sm"
                  className="bg-white hover:bg-gray-50 justify-start"
                >
                  <Users className="w-4 h-4 mr-2" />
                  <span className="truncate">Ver clientes</span>
                </Button>
                <Button 
                  onClick={() => navigate(createPageUrl("Calendar"))}
                  variant="outline"
                  size="sm"
                  className="bg-white hover:bg-gray-50 justify-start"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  <span className="truncate">Calendario</span>
                </Button>
                <Button 
                  onClick={() => navigate(createPageUrl("Presupuestos"))}
                  variant="outline"
                  size="sm"
                  className="bg-white hover:bg-gray-50 justify-start"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  <span className="truncate">Presupuestos</span>
                </Button>
                <Button 
                  onClick={() => navigate(createPageUrl("Invoices"))}
                  variant="outline"
                  size="sm"
                  className="bg-white hover:bg-gray-50 justify-start"
                >
                  <Euro className="w-4 h-4 mr-2" />
                  <span className="truncate">Facturas</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar proyectos o clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los estados</option>
              <option value="planning">Planificación</option>
              <option value="in_progress">En progreso</option>
              <option value="on_hold">En pausa</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          {filteredProjects.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-16 text-center">
                <FolderKanban className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {projects.length === 0 ? "No tienes proyectos aún" : "No se encontraron proyectos"}
                </h3>
                <p className="text-gray-600 mb-6">
                  {projects.length === 0 
                    ? "Crea tu primer proyecto y gestiona el trabajo con tus clientes"
                    : "Intenta ajustar los filtros de búsqueda"}
                </p>
                {projects.length === 0 && (
                  <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                    <Button 
                      onClick={() => navigate(createPageUrl("CRM"))}
                      variant="outline"
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Primero añade clientes
                    </Button>
                    <Button 
                      onClick={() => navigate(createPageUrl("ProjectDetail") + "?new=true")}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Crear primer proyecto
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map(project => {
                const statusConfig = getStatusConfig(project.status);
                const StatusIcon = statusConfig.icon;
                const client = clients.find(c => c.id === project.client_contact_id);

                return (
                  <Card
                    key={project.id}
                    className="cursor-pointer hover:shadow-lg transition-all border-0 shadow-sm bg-white active:scale-98"
                    onClick={() => navigate(createPageUrl("ProjectDetail") + "?id=" + project.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between mb-2">
                        <div 
                          className="w-1 h-20 rounded-full absolute left-0 top-4"
                          style={{ backgroundColor: project.color || '#3B82F6' }}
                        />
                        <div className="flex-1 ml-4">
                          <CardTitle className="text-base md:text-lg mb-2 leading-tight">{project.name}</CardTitle>
                          {project.client_name && (
                            <div className="flex items-center gap-1 text-xs md:text-sm text-gray-600 mb-1">
                              <User className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{project.client_name}</span>
                            </div>
                          )}
                          {project.budget && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Euro className="w-3 h-3" />
                              {project.budget.toLocaleString()}€
                            </div>
                          )}
                        </div>
                        <div 
                          className={`w-2 h-2 rounded-full ${getPriorityColor(project.priority)} flex-shrink-0`}
                          title={`Prioridad: ${project.priority}`}
                        />
                      </div>
                      <Badge className={statusConfig.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-xs md:text-sm mb-1">
                            <span className="text-gray-600">Progreso</span>
                            <span className="font-semibold">{project.progress_percentage || 0}%</span>
                          </div>
                          <Progress value={project.progress_percentage || 0} className="h-2" />
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs md:text-sm">
                          {project.start_date && (
                            <div className="flex items-center gap-1 text-gray-600">
                              <Calendar className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{new Date(project.start_date).toLocaleDateString('es-ES')}</span>
                            </div>
                          )}
                          {project.total_hours_logged > 0 && (
                            <div className="flex items-center gap-1 text-gray-600">
                              <Clock className="w-3 h-3 flex-shrink-0" />
                              <span>{project.total_hours_logged}h</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
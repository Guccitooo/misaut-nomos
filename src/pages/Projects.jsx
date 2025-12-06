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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Pause
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

  const { data: clientProjects = [] } = useQuery({
    queryKey: ['clientProjects', user?.id],
    queryFn: () => base44.entities.Project.filter({ client_contact_id: user.id }, '-created_date'),
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

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FolderKanban className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Proyectos</h1>
            </div>
            {isProfessional && (
              <Button 
                onClick={() => navigate(createPageUrl("ProjectDetail") + "?new=true")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Proyecto
              </Button>
            )}
          </div>

          <Tabs defaultValue={isProfessional ? "my-projects" : "client-view"} className="space-y-6">
            <TabsList>
              {isProfessional && <TabsTrigger value="my-projects">Mis Proyectos ({projects.length})</TabsTrigger>}
              {clientProjects.length > 0 && <TabsTrigger value="client-view">Proyectos Cliente ({clientProjects.length})</TabsTrigger>}
            </TabsList>

            {isProfessional && (
              <TabsContent value="my-projects" className="space-y-4">
                <div className="flex gap-4 mb-6">
                  <Input
                    placeholder="Buscar proyectos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-md"
                  />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border rounded-lg"
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
                  <Card>
                    <CardContent className="py-12 text-center">
                      <FolderKanban className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">No tienes proyectos aún</p>
                      <Button onClick={() => navigate(createPageUrl("ProjectDetail") + "?new=true")}>
                        Crear primer proyecto
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProjects.map(project => {
                      const statusConfig = getStatusConfig(project.status);
                      const StatusIcon = statusConfig.icon;

                      return (
                        <Card
                          key={project.id}
                          className="cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => navigate(createPageUrl("ProjectDetail") + "?id=" + project.id)}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between mb-2">
                              <div 
                                className="w-1 h-16 rounded-full absolute left-0 top-6"
                                style={{ backgroundColor: project.color }}
                              />
                              <div className="flex-1 ml-4">
                                <CardTitle className="text-lg mb-1">{project.name}</CardTitle>
                                {project.client_name && (
                                  <p className="text-sm text-gray-500 flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {project.client_name}
                                  </p>
                                )}
                              </div>
                              <div className={`w-2 h-2 rounded-full ${getPriorityColor(project.priority)}`} />
                            </div>
                            <Badge className={statusConfig.color}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-gray-600">Progreso</span>
                                  <span className="font-semibold">{project.progress_percentage}%</span>
                                </div>
                                <Progress value={project.progress_percentage} className="h-2" />
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-sm">
                                {project.start_date && (
                                  <div className="flex items-center gap-1 text-gray-600">
                                    <Calendar className="w-3 h-3" />
                                    <span>{new Date(project.start_date).toLocaleDateString('es-ES')}</span>
                                  </div>
                                )}
                                {project.total_hours_logged > 0 && (
                                  <div className="flex items-center gap-1 text-gray-600">
                                    <Clock className="w-3 h-3" />
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
              </TabsContent>
            )}

            {clientProjects.length > 0 && (
              <TabsContent value="client-view" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clientProjects.map(project => {
                    const statusConfig = getStatusConfig(project.status);
                    const StatusIcon = statusConfig.icon;

                    return (
                      <Card
                        key={project.id}
                        className="cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => navigate(createPageUrl("ProjectDetail") + "?id=" + project.id)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between mb-2">
                            <div 
                              className="w-1 h-16 rounded-full absolute left-0 top-6"
                              style={{ backgroundColor: project.color }}
                            />
                            <div className="flex-1 ml-4">
                              <CardTitle className="text-lg">{project.name}</CardTitle>
                            </div>
                          </div>
                          <Badge className={statusConfig.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Progreso</span>
                                <span className="font-semibold">{project.progress_percentage}%</span>
                              </div>
                              <Progress value={project.progress_percentage} className="h-2" />
                            </div>

                            {project.description && (
                              <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </>
  );
}
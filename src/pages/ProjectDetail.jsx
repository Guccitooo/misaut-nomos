import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Loader2, 
  ArrowLeft, 
  Save,
  Plus,
  Trash2,
  Clock,
  FileText,
  Paperclip,
  Calendar,
  CheckCircle2,
  Circle,
  AlertCircle,
  Play,
  Pause,
  X
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function ProjectDetailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');
  const isNew = searchParams.get('new') === 'true';
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    client_name: "",
    status: "planning",
    priority: "medium",
    start_date: "",
    end_date: "",
    budget: "",
    color: "#3B82F6",
    client_visible: true
  });
  const [showPhaseDialog, setShowPhaseDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showTimeLogDialog, setShowTimeLogDialog] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);

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

  const { data: project, isLoading: loadingProject } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const projects = await base44.entities.Project.filter({ id: projectId });
      return projects[0];
    },
    enabled: !!projectId && !isNew,
  });

  const { data: phases = [] } = useQuery({
    queryKey: ['phases', projectId],
    queryFn: () => base44.entities.ProjectPhase.filter({ project_id: projectId }, 'order'),
    enabled: !!projectId && !isNew,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => base44.entities.ProjectTask.filter({ project_id: projectId }, 'order'),
    enabled: !!projectId && !isNew,
  });

  const { data: timeLogs = [] } = useQuery({
    queryKey: ['timeLogs', projectId],
    queryFn: () => base44.entities.TimeLog.filter({ project_id: projectId }, '-date'),
    enabled: !!projectId && !isNew,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients', user?.id],
    queryFn: () => base44.entities.ClientContact.filter({ professional_id: user.id }),
    enabled: !!user,
  });

  React.useEffect(() => {
    if (project && !isNew) {
      setFormData({
        name: project.name || "",
        description: project.description || "",
        client_name: project.client_name || "",
        status: project.status || "planning",
        priority: project.priority || "medium",
        start_date: project.start_date || "",
        end_date: project.end_date || "",
        budget: project.budget || "",
        color: project.color || "#3B82F6",
        client_visible: project.client_visible ?? true
      });
    }
  }, [project, isNew]);

  const saveProjectMutation = useMutation({
    mutationFn: async (data) => {
      if (isNew) {
        return await base44.entities.Project.create({ ...data, professional_id: user.id });
      } else {
        return await base44.entities.Project.update(projectId, data);
      }
    },
    onSuccess: (savedProject) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success("Proyecto guardado");
      if (isNew) {
        navigate(createPageUrl("ProjectDetail") + "?id=" + savedProject.id);
      }
    },
    onError: () => toast.error("Error al guardar proyecto")
  });

  const createPhaseMutation = useMutation({
    mutationFn: (data) => base44.entities.ProjectPhase.create({ ...data, project_id: projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phases'] });
      setShowPhaseDialog(false);
      toast.success("Fase creada");
    }
  });

  const createTaskMutation = useMutation({
    mutationFn: (data) => base44.entities.ProjectTask.create({ ...data, project_id: projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowTaskDialog(false);
      toast.success("Tarea creada");
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProjectTask.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success("Tarea actualizada");
    }
  });

  const createTimeLogMutation = useMutation({
    mutationFn: (data) => base44.entities.TimeLog.create({ ...data, project_id: projectId, user_id: user.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeLogs'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowTimeLogDialog(false);
      setSelectedTask(null);
      toast.success("Tiempo registrado");
    }
  });

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingFile(true);
    try {
      const uploadedFiles = await Promise.all(
        files.map(async (file) => {
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          return {
            url: file_url,
            name: file.name,
            uploaded_at: new Date().toISOString()
          };
        })
      );
      
      const currentAttachments = project?.attachments || [];
      await base44.entities.Project.update(projectId, {
        attachments: [...currentAttachments, ...uploadedFiles]
      });
      
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success("Archivo(s) subido(s)");
    } catch (error) {
      toast.error("Error al subir archivo");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error("El nombre del proyecto es obligatorio");
      return;
    }
    saveProjectMutation.mutate(formData);
  };

  if (loadingUser || (loadingProject && !isNew)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const isProfessional = user?.user_type === 'professionnel';
  const canEdit = isProfessional && (isNew || project?.professional_id === user.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("Projects"))}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
          {canEdit && (
            <Button
              onClick={handleSave}
              disabled={saveProjectMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saveProjectMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Guardar
            </Button>
          )}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Vista General</TabsTrigger>
            {!isNew && <TabsTrigger value="phases">Fases</TabsTrigger>}
            {!isNew && <TabsTrigger value="tasks">Tareas</TabsTrigger>}
            {!isNew && <TabsTrigger value="time">Tiempo</TabsTrigger>}
            {!isNew && <TabsTrigger value="files">Archivos</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Información del Proyecto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nombre del Proyecto *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={!canEdit}
                    />
                  </div>
                  <div>
                    <Label>Cliente</Label>
                    {canEdit ? (
                      <Select value={formData.client_name} onValueChange={(v) => setFormData({ ...formData, client_name: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map(client => (
                            <SelectItem key={client.id} value={client.client_name}>{client.client_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input value={formData.client_name} disabled />
                    )}
                  </div>
                </div>

                <div>
                  <Label>Descripción</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    disabled={!canEdit}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Estado</Label>
                    <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })} disabled={!canEdit}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planning">Planificación</SelectItem>
                        <SelectItem value="in_progress">En progreso</SelectItem>
                        <SelectItem value="on_hold">En pausa</SelectItem>
                        <SelectItem value="completed">Completado</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Prioridad</Label>
                    <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })} disabled={!canEdit}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baja</SelectItem>
                        <SelectItem value="medium">Media</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Color</Label>
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-full h-10 rounded border"
                      disabled={!canEdit}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Fecha de Inicio</Label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      disabled={!canEdit}
                    />
                  </div>

                  <div>
                    <Label>Fecha de Fin</Label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      disabled={!canEdit}
                    />
                  </div>

                  <div>
                    <Label>Presupuesto (€)</Label>
                    <Input
                      type="number"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      disabled={!canEdit}
                    />
                  </div>
                </div>

                {!isNew && (
                  <div className="pt-4 border-t">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progreso del Proyecto</span>
                      <span className="font-semibold">{project?.progress_percentage || 0}%</span>
                    </div>
                    <Progress value={project?.progress_percentage || 0} className="h-3" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{tasks.length}</p>
                        <p className="text-sm text-gray-600">Tareas</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{tasks.filter(t => t.status === 'completed').length}</p>
                        <p className="text-sm text-gray-600">Completadas</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-orange-600">{project?.total_hours_logged || 0}h</p>
                        <p className="text-sm text-gray-600">Horas</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">{phases.length}</p>
                        <p className="text-sm text-gray-600">Fases</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {!isNew && (
            <>
              <TabsContent value="phases" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">Fases del Proyecto</h2>
                  {canEdit && (
                    <Button onClick={() => setShowPhaseDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nueva Fase
                    </Button>
                  )}
                </div>

                {phases.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-gray-600">No hay fases creadas</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {phases.map(phase => (
                      <Card key={phase.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">{phase.name}</CardTitle>
                              {phase.description && <p className="text-sm text-gray-600 mt-1">{phase.description}</p>}
                            </div>
                            <Badge>{phase.status === 'completed' ? 'Completada' : phase.status === 'in_progress' ? 'En progreso' : 'Pendiente'}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progreso</span>
                              <span>{phase.progress_percentage}%</span>
                            </div>
                            <Progress value={phase.progress_percentage} />
                            {(phase.start_date || phase.end_date) && (
                              <div className="flex gap-4 text-sm text-gray-600 mt-2">
                                {phase.start_date && <span>Inicio: {format(new Date(phase.start_date), 'dd/MM/yyyy')}</span>}
                                {phase.end_date && <span>Fin: {format(new Date(phase.end_date), 'dd/MM/yyyy')}</span>}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="tasks" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">Tareas</h2>
                  {canEdit && (
                    <Button onClick={() => setShowTaskDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nueva Tarea
                    </Button>
                  )}
                </div>

                {tasks.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-gray-600">No hay tareas creadas</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {tasks.map(task => (
                      <Card key={task.id}>
                        <CardContent className="py-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <button
                                onClick={() => {
                                  const newStatus = task.status === 'completed' ? 'pending' : 'completed';
                                  updateTaskMutation.mutate({ id: task.id, data: { status: newStatus } });
                                }}
                                disabled={!canEdit}
                              >
                                {task.status === 'completed' ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                                ) : (
                                  <Circle className="w-5 h-5 text-gray-400" />
                                )}
                              </button>
                              <div className="flex-1">
                                <h4 className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                                  {task.name}
                                </h4>
                                {task.description && (
                                  <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                                )}
                                <div className="flex gap-4 mt-2 text-sm text-gray-500">
                                  {task.due_date && (
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {format(new Date(task.due_date), 'dd/MM/yyyy')}
                                    </span>
                                  )}
                                  {task.estimated_hours > 0 && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {task.logged_hours}h / {task.estimated_hours}h
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {canEdit && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedTask(task);
                                  setShowTimeLogDialog(true);
                                }}
                              >
                                <Clock className="w-4 h-4 mr-1" />
                                Registrar Tiempo
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="time" className="space-y-4">
                <h2 className="text-xl font-bold">Registro de Tiempo</h2>
                
                {timeLogs.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">No hay tiempo registrado</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {timeLogs.map(log => (
                      <Card key={log.id}>
                        <CardContent className="py-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Clock className="w-4 h-4 text-blue-600" />
                                <span className="font-semibold">{log.hours}h</span>
                                <span className="text-gray-500">-</span>
                                <span className="text-sm text-gray-600">{format(new Date(log.date), 'dd/MM/yyyy')}</span>
                              </div>
                              {log.description && (
                                <p className="text-sm text-gray-700">{log.description}</p>
                              )}
                            </div>
                            {log.billable && (
                              <Badge variant="outline" className="bg-green-50">Facturable</Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="files" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">Archivos del Proyecto</h2>
                  {canEdit && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingFile}
                      >
                        {uploadingFile ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Paperclip className="w-4 h-4 mr-2" />
                        )}
                        Adjuntar Archivo
                      </Button>
                    </>
                  )}
                </div>

                {(!project?.attachments || project.attachments.length === 0) ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">No hay archivos adjuntos</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {project.attachments.map((file, idx) => (
                      <Card key={idx}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <FileText className="w-8 h-8 text-blue-600" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">{format(new Date(file.uploaded_at), 'dd/MM/yyyy HH:mm')}</p>
                            </div>
                            <a href={file.url} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="outline">Ver</Button>
                            </a>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>

        <PhaseDialog 
          open={showPhaseDialog}
          onClose={() => setShowPhaseDialog(false)}
          onSave={(data) => createPhaseMutation.mutate(data)}
          saving={createPhaseMutation.isPending}
        />

        <TaskDialog 
          open={showTaskDialog}
          onClose={() => setShowTaskDialog(false)}
          onSave={(data) => createTaskMutation.mutate(data)}
          phases={phases}
          saving={createTaskMutation.isPending}
        />

        <TimeLogDialog 
          open={showTimeLogDialog}
          onClose={() => {
            setShowTimeLogDialog(false);
            setSelectedTask(null);
          }}
          onSave={(data) => createTimeLogMutation.mutate(data)}
          task={selectedTask}
          saving={createTimeLogMutation.isPending}
        />
      </div>
    </div>
  );
}

function PhaseDialog({ open, onClose, onSave, saving }) {
  const [data, setData] = useState({ name: "", description: "", start_date: "", end_date: "", status: "pending" });

  const handleSave = () => {
    if (!data.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    onSave(data);
    setData({ name: "", description: "", start_date: "", end_date: "", status: "pending" });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva Fase</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nombre *</Label>
            <Input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} />
          </div>
          <div>
            <Label>Descripción</Label>
            <Textarea value={data.description} onChange={(e) => setData({ ...data, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fecha Inicio</Label>
              <Input type="date" value={data.start_date} onChange={(e) => setData({ ...data, start_date: e.target.value })} />
            </div>
            <div>
              <Label>Fecha Fin</Label>
              <Input type="date" value={data.end_date} onChange={(e) => setData({ ...data, end_date: e.target.value })} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Crear Fase"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TaskDialog({ open, onClose, onSave, phases, saving }) {
  const [data, setData] = useState({ 
    name: "", 
    description: "", 
    phase_id: "", 
    status: "pending", 
    priority: "medium",
    due_date: "",
    estimated_hours: ""
  });

  const handleSave = () => {
    if (!data.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    onSave(data);
    setData({ name: "", description: "", phase_id: "", status: "pending", priority: "medium", due_date: "", estimated_hours: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva Tarea</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nombre *</Label>
            <Input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} />
          </div>
          <div>
            <Label>Descripción</Label>
            <Textarea value={data.description} onChange={(e) => setData({ ...data, description: e.target.value })} />
          </div>
          <div>
            <Label>Fase</Label>
            <Select value={data.phase_id} onValueChange={(v) => setData({ ...data, phase_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona fase (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {phases.map(phase => (
                  <SelectItem key={phase.id} value={phase.id}>{phase.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Prioridad</Label>
              <Select value={data.priority} onValueChange={(v) => setData({ ...data, priority: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fecha Límite</Label>
              <Input type="date" value={data.due_date} onChange={(e) => setData({ ...data, due_date: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Horas Estimadas</Label>
            <Input type="number" value={data.estimated_hours} onChange={(e) => setData({ ...data, estimated_hours: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Crear Tarea"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TimeLogDialog({ open, onClose, onSave, task, saving }) {
  const [data, setData] = useState({ 
    task_id: "", 
    description: "", 
    date: new Date().toISOString().split('T')[0],
    hours: "",
    billable: true
  });

  React.useEffect(() => {
    if (task) {
      setData(prev => ({ ...prev, task_id: task.id }));
    }
  }, [task]);

  const handleSave = () => {
    if (!data.hours || parseFloat(data.hours) <= 0) {
      toast.error("Las horas son obligatorias");
      return;
    }
    onSave(data);
    setData({ task_id: "", description: "", date: new Date().toISOString().split('T')[0], hours: "", billable: true });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Tiempo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {task && (
            <div className="bg-blue-50 p-3 rounded">
              <p className="text-sm font-medium">{task.name}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fecha *</Label>
              <Input type="date" value={data.date} onChange={(e) => setData({ ...data, date: e.target.value })} />
            </div>
            <div>
              <Label>Horas *</Label>
              <Input type="number" step="0.5" value={data.hours} onChange={(e) => setData({ ...data, hours: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Descripción</Label>
            <Textarea 
              value={data.description} 
              onChange={(e) => setData({ ...data, description: e.target.value })}
              placeholder="¿Qué has hecho?"
              rows={3}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="billable"
              checked={data.billable}
              onChange={(e) => setData({ ...data, billable: e.target.checked })}
            />
            <Label htmlFor="billable">Horas facturables</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Registrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
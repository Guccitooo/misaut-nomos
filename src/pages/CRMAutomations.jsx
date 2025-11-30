import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Plus,
  Zap,
  Tag,
  Bell,
  Mail,
  Calendar,
  Users,
  Edit2,
  Trash2,
  Play,
  Pause,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Settings,
  TrendingUp,
  Gift,
  Briefcase,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import Loader from "@/components/ui/Loader";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const TRIGGER_TYPES = {
  client_created: { label: "Nuevo cliente creado", icon: Users, color: "bg-blue-100 text-blue-700" },
  status_changed: { label: "Cambio de estado", icon: RefreshCw, color: "bg-purple-100 text-purple-700" },
  job_completed: { label: "Trabajo completado", icon: Briefcase, color: "bg-green-100 text-green-700" },
  jobs_count: { label: "Nº de trabajos alcanzado", icon: TrendingUp, color: "bg-amber-100 text-amber-700" },
  days_inactive: { label: "Días sin contacto", icon: Clock, color: "bg-red-100 text-red-700" },
  birthday: { label: "Cumpleaños del cliente", icon: Gift, color: "bg-pink-100 text-pink-700" },
  contract_end: { label: "Fin de contrato/garantía", icon: Calendar, color: "bg-orange-100 text-orange-700" },
};

const ACTION_TYPES = {
  add_tag: { label: "Añadir etiqueta", icon: Tag },
  remove_tag: { label: "Quitar etiqueta", icon: Tag },
  change_status: { label: "Cambiar estado", icon: RefreshCw },
  change_segment: { label: "Cambiar segmento", icon: Users },
  create_reminder: { label: "Crear recordatorio", icon: Bell },
  create_activity: { label: "Registrar actividad", icon: CheckCircle },
};

export default function CRMAutomationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  const [formData, setFormData] = useState({
    name: "",
    type: "sequence",
    trigger: { event: "client_created", conditions: {} },
    actions: [{ type: "add_tag", delay_days: 0, params: {} }],
  });

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

  const { data: automations = [], isLoading: loadingAutomations } = useQuery({
    queryKey: ['automations', user?.id],
    queryFn: () => base44.entities.CRMAutomation.filter({ professional_id: user.id }),
    enabled: !!user,
  });

  const { data: executions = [] } = useQuery({
    queryKey: ['executions', user?.id],
    queryFn: () => base44.entities.AutomationExecution.filter({ professional_id: user.id }),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CRMAutomation.create({ ...data, professional_id: user.id }),
    onSuccess: () => {
      queryClient.invalidateQueries(['automations']);
      setShowDialog(false);
      resetForm();
      toast.success("Automatización creada");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CRMAutomation.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['automations']);
      setShowDialog(false);
      resetForm();
      toast.success("Automatización actualizada");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CRMAutomation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['automations']);
      setDeleteDialog(null);
      toast.success("Automatización eliminada");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.CRMAutomation.update(id, { is_active }),
    onSuccess: (_, { is_active }) => {
      queryClient.invalidateQueries(['automations']);
      toast.success(is_active ? "Automatización activada" : "Automatización pausada");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      type: "sequence",
      trigger: { event: "client_created", conditions: {} },
      actions: [{ type: "add_tag", delay_days: 0, params: {} }],
    });
    setEditingAutomation(null);
  };

  const handleEdit = (automation) => {
    setEditingAutomation(automation);
    setFormData({
      name: automation.name,
      type: automation.type,
      trigger: automation.trigger || { event: "client_created", conditions: {} },
      actions: automation.actions || [{ type: "add_tag", delay_days: 0, params: {} }],
    });
    setShowDialog(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingAutomation) {
      updateMutation.mutate({ id: editingAutomation.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const addAction = () => {
    setFormData({
      ...formData,
      actions: [...formData.actions, { type: "add_tag", delay_days: 0, params: {} }]
    });
  };

  const removeAction = (index) => {
    setFormData({
      ...formData,
      actions: formData.actions.filter((_, i) => i !== index)
    });
  };

  const updateAction = (index, field, value) => {
    const newActions = [...formData.actions];
    if (field === 'params') {
      newActions[index] = { ...newActions[index], params: { ...newActions[index].params, ...value } };
    } else {
      newActions[index] = { ...newActions[index], [field]: value };
    }
    setFormData({ ...formData, actions: newActions });
  };

  const updateTriggerCondition = (field, value) => {
    setFormData({
      ...formData,
      trigger: {
        ...formData.trigger,
        conditions: { ...formData.trigger.conditions, [field]: value }
      }
    });
  };

  if (loading) return <Loader />;

  const filteredAutomations = automations.filter(a => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return a.is_active;
    if (activeTab === "inactive") return !a.is_active;
    return a.type === activeTab;
  });

  const stats = {
    total: automations.length,
    active: automations.filter(a => a.is_active).length,
    executions: executions.filter(e => e.status === 'completed').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(createPageUrl("CRM"))}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al CRM
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Automatizaciones</h1>
              <p className="text-gray-600">Automatiza tareas repetitivas de tu CRM</p>
            </div>
          </div>
          <Button onClick={() => { resetForm(); setShowDialog(true); }} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Nueva automatización
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Play className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-gray-500">Activas</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.executions}</p>
                <p className="text-xs text-gray-500">Ejecuciones</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs y lista */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white shadow-sm">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="active">Activas</TabsTrigger>
            <TabsTrigger value="sequence">Secuencias</TabsTrigger>
            <TabsTrigger value="auto_tag">Auto-etiquetas</TabsTrigger>
            <TabsTrigger value="auto_reminder">Recordatorios</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {loadingAutomations ? (
              <Loader />
            ) : filteredAutomations.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-12 text-center">
                  <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay automatizaciones</h3>
                  <p className="text-gray-600 mb-6">Crea tu primera automatización para ahorrar tiempo</p>
                  <Button onClick={() => { resetForm(); setShowDialog(true); }} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear automatización
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredAutomations.map(automation => {
                  const triggerConfig = TRIGGER_TYPES[automation.trigger?.event];
                  const TriggerIcon = triggerConfig?.icon || Zap;
                  
                  return (
                    <Card key={automation.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${triggerConfig?.color || 'bg-gray-100'}`}>
                              <TriggerIcon className="w-6 h-6" />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-gray-900">{automation.name}</h3>
                                <Badge variant={automation.is_active ? "default" : "secondary"} className={automation.is_active ? "bg-green-100 text-green-800" : ""}>
                                  {automation.is_active ? "Activa" : "Pausada"}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {automation.type === 'sequence' ? 'Secuencia' : 
                                   automation.type === 'auto_tag' ? 'Auto-etiqueta' : 'Recordatorio'}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">
                                Disparador: {triggerConfig?.label || automation.trigger?.event}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {automation.actions?.length || 0} acciones • 
                                Ejecutada {automation.execution_count || 0} veces
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Switch
                              checked={automation.is_active}
                              onCheckedChange={(checked) => toggleMutation.mutate({ id: automation.id, is_active: checked })}
                            />
                            <Button size="icon" variant="ghost" onClick={() => handleEdit(automation)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => setDeleteDialog(automation)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Plantillas predefinidas */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Plantillas rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => {
                  setFormData({
                    name: "Bienvenida a nuevos leads",
                    type: "sequence",
                    trigger: { event: "client_created", conditions: { status: "lead" } },
                    actions: [
                      { type: "create_activity", delay_days: 0, params: { title: "Nuevo lead registrado", activity_type: "note" } },
                      { type: "create_reminder", delay_days: 3, params: { title: "Seguimiento inicial" } },
                      { type: "create_reminder", delay_days: 7, params: { title: "Segundo contacto" } },
                    ],
                  });
                  setShowDialog(true);
                }}
                className="p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
              >
                <Mail className="w-8 h-8 text-blue-600 mb-2" />
                <h4 className="font-semibold">Secuencia de bienvenida</h4>
                <p className="text-sm text-gray-500">Seguimiento automático a nuevos leads</p>
              </button>

              <button
                onClick={() => {
                  setFormData({
                    name: "Cliente recurrente",
                    type: "auto_tag",
                    trigger: { event: "jobs_count", conditions: { min_jobs: 2 } },
                    actions: [
                      { type: "add_tag", delay_days: 0, params: { tag: "Recurrente" } },
                      { type: "change_status", delay_days: 0, params: { status: "vip" } },
                    ],
                  });
                  setShowDialog(true);
                }}
                className="p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-amber-400 hover:bg-amber-50 transition-all text-left"
              >
                <Tag className="w-8 h-8 text-amber-600 mb-2" />
                <h4 className="font-semibold">Marcar recurrentes</h4>
                <p className="text-sm text-gray-500">Etiqueta clientes con +2 trabajos</p>
              </button>

              <button
                onClick={() => {
                  setFormData({
                    name: "Felicitación de cumpleaños",
                    type: "auto_reminder",
                    trigger: { event: "birthday", conditions: {} },
                    actions: [
                      { type: "create_reminder", delay_days: 0, params: { title: "Felicitar cumpleaños" } },
                    ],
                  });
                  setShowDialog(true);
                }}
                className="p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-pink-400 hover:bg-pink-50 transition-all text-left"
              >
                <Gift className="w-8 h-8 text-pink-600 mb-2" />
                <h4 className="font-semibold">Cumpleaños</h4>
                <p className="text-sm text-gray-500">Recordatorio para felicitar</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog crear/editar */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAutomation ? "Editar automatización" : "Nueva automatización"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nombre y tipo */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nombre *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Seguimiento de leads"
                  required
                />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sequence">Secuencia de seguimiento</SelectItem>
                    <SelectItem value="auto_tag">Auto-etiquetado</SelectItem>
                    <SelectItem value="auto_reminder">Recordatorio automático</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Disparador */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Disparador</Label>
              <Select 
                value={formData.trigger.event} 
                onValueChange={(v) => setFormData({ ...formData, trigger: { ...formData.trigger, event: v, conditions: {} } })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TRIGGER_TYPES).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Condiciones según el disparador */}
              {formData.trigger.event === "status_changed" && (
                <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-xs">Estado anterior</Label>
                    <Select value={formData.trigger.conditions.from_status || ""} onValueChange={(v) => updateTriggerCondition('from_status', v)}>
                      <SelectTrigger><SelectValue placeholder="Cualquiera" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Cualquiera</SelectItem>
                        <SelectItem value="lead">Lead</SelectItem>
                        <SelectItem value="contacted">Contactado</SelectItem>
                        <SelectItem value="negotiating">Negociando</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Nuevo estado</Label>
                    <Select value={formData.trigger.conditions.to_status || ""} onValueChange={(v) => updateTriggerCondition('to_status', v)}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client">Cliente</SelectItem>
                        <SelectItem value="vip">VIP</SelectItem>
                        <SelectItem value="inactive">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {formData.trigger.event === "jobs_count" && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <Label className="text-xs">Número mínimo de trabajos</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.trigger.conditions.min_jobs || ""}
                    onChange={(e) => updateTriggerCondition('min_jobs', parseInt(e.target.value))}
                    placeholder="2"
                  />
                </div>
              )}

              {formData.trigger.event === "days_inactive" && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <Label className="text-xs">Días sin contacto</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.trigger.conditions.days || ""}
                    onChange={(e) => updateTriggerCondition('days', parseInt(e.target.value))}
                    placeholder="30"
                  />
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Acciones</Label>
                <Button type="button" variant="outline" size="sm" onClick={addAction}>
                  <Plus className="w-4 h-4 mr-1" />
                  Añadir acción
                </Button>
              </div>

              {formData.actions.map((action, index) => (
                <Card key={index} className="border shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Acción {index + 1}</Badge>
                      {formData.actions.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeAction(index)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Tipo de acción</Label>
                        <Select value={action.type} onValueChange={(v) => updateAction(index, 'type', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(ACTION_TYPES).map(([key, { label }]) => (
                              <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Retraso (días)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={action.delay_days}
                          onChange={(e) => updateAction(index, 'delay_days', parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>

                    {/* Parámetros según tipo de acción */}
                    {(action.type === "add_tag" || action.type === "remove_tag") && (
                      <div>
                        <Label className="text-xs">Etiqueta</Label>
                        <Input
                          value={action.params.tag || ""}
                          onChange={(e) => updateAction(index, 'params', { tag: e.target.value })}
                          placeholder="Ej: Recurrente, VIP, Urgente..."
                        />
                      </div>
                    )}

                    {action.type === "change_status" && (
                      <div>
                        <Label className="text-xs">Nuevo estado</Label>
                        <Select value={action.params.status || ""} onValueChange={(v) => updateAction(index, 'params', { status: v })}>
                          <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lead">Lead</SelectItem>
                            <SelectItem value="contacted">Contactado</SelectItem>
                            <SelectItem value="negotiating">Negociando</SelectItem>
                            <SelectItem value="client">Cliente</SelectItem>
                            <SelectItem value="vip">VIP</SelectItem>
                            <SelectItem value="inactive">Inactivo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {action.type === "change_segment" && (
                      <div>
                        <Label className="text-xs">Nuevo segmento</Label>
                        <Select value={action.params.segment || ""} onValueChange={(v) => updateAction(index, 'params', { segment: v })}>
                          <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="residential">Residencial</SelectItem>
                            <SelectItem value="commercial">Comercial</SelectItem>
                            <SelectItem value="industrial">Industrial</SelectItem>
                            <SelectItem value="government">Administración</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {action.type === "create_reminder" && (
                      <div>
                        <Label className="text-xs">Título del recordatorio</Label>
                        <Input
                          value={action.params.title || ""}
                          onChange={(e) => updateAction(index, 'params', { title: e.target.value })}
                          placeholder="Ej: Llamar para seguimiento"
                        />
                      </div>
                    )}

                    {action.type === "create_activity" && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Título</Label>
                          <Input
                            value={action.params.title || ""}
                            onChange={(e) => updateAction(index, 'params', { title: e.target.value })}
                            placeholder="Ej: Lead registrado"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Tipo actividad</Label>
                          <Select value={action.params.activity_type || "note"} onValueChange={(v) => updateAction(index, 'params', { activity_type: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="note">Nota</SelectItem>
                              <SelectItem value="call">Llamada</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setShowDialog(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingAutomation ? "Guardar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog eliminar */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar automatización?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar "{deleteDialog?.name}". Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deleteDialog.id)} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
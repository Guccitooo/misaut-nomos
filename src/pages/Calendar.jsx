import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Briefcase,
  FileText,
  Bell,
  CheckSquare,
  Clock,
  MapPin,
  Euro,
  User,
  Filter,
  LayoutGrid,
  List,
  RefreshCw,
  ExternalLink
} from "lucide-react";

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const EVENT_TYPES = {
  job_start: { label: 'Inicio trabajo', color: 'bg-blue-500', icon: Briefcase },
  job_end: { label: 'Fin trabajo', color: 'bg-blue-700', icon: Briefcase },
  invoice_due: { label: 'Vencimiento factura', color: 'bg-orange-500', icon: FileText },
  reminder: { label: 'Recordatorio', color: 'bg-purple-500', icon: Bell },
  task: { label: 'Tarea', color: 'bg-green-500', icon: CheckSquare },
};

export default function CalendarPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState('month'); // month, week, list
  const [filters, setFilters] = useState({
    jobs: true,
    invoices: true,
    reminders: true,
    tasks: true
  });
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    due_date: '',
    due_time: '',
    priority: 'medium',
    category: 'work',
    related_client_id: ''
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser.user_type !== 'professionnel') {
        navigate(createPageUrl("Search"));
        return;
      }
      setUser(currentUser);
    } catch (error) {
      navigate(createPageUrl("Search"));
    }
  };

  // Fetch all data
  const { data: jobs = [] } = useQuery({
    queryKey: ['calendar-jobs', user?.id],
    queryFn: () => base44.entities.Job.filter({ professional_id: user.id }),
    enabled: !!user?.id
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['calendar-invoices', user?.id],
    queryFn: () => base44.entities.Invoice.filter({ professional_id: user.id }),
    enabled: !!user?.id
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['calendar-activities', user?.id],
    queryFn: () => base44.entities.ClientActivity.filter({ 
      professional_id: user.id,
      is_reminder: true 
    }),
    enabled: !!user?.id
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['calendar-tasks', user?.id],
    queryFn: () => base44.entities.Task.filter({ professional_id: user.id }),
    enabled: !!user?.id
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['calendar-clients', user?.id],
    queryFn: () => base44.entities.ClientContact.filter({ professional_id: user.id }),
    enabled: !!user?.id
  });

  // Create/Update task mutation
  const taskMutation = useMutation({
    mutationFn: async (data) => {
      if (editingTask) {
        return base44.entities.Task.update(editingTask.id, data);
      }
      return base44.entities.Task.create({ ...data, professional_id: user.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['calendar-tasks']);
      toast.success(editingTask ? 'Tarea actualizada' : 'Tarea creada');
      closeTaskDialog();
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['calendar-tasks']);
      toast.success('Tarea eliminada');
    }
  });

  const toggleTaskComplete = useMutation({
    mutationFn: async (task) => {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      return base44.entities.Task.update(task.id, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['calendar-tasks']);
    }
  });

  // Build calendar events
  const calendarEvents = useMemo(() => {
    const events = [];

    // Jobs
    if (filters.jobs) {
      jobs.forEach(job => {
        if (job.start_date) {
          events.push({
            id: `job-start-${job.id}`,
            type: 'job_start',
            title: job.title,
            subtitle: job.client_name,
            date: job.start_date,
            data: job,
            link: createPageUrl("Jobs") + `?id=${job.id}`
          });
        }
        if (job.end_date) {
          events.push({
            id: `job-end-${job.id}`,
            type: 'job_end',
            title: `Fin: ${job.title}`,
            subtitle: job.client_name,
            date: job.end_date,
            data: job,
            link: createPageUrl("Jobs") + `?id=${job.id}`
          });
        }
      });
    }

    // Invoices
    if (filters.invoices) {
      invoices.forEach(inv => {
        if (inv.due_date && inv.status !== 'paid' && inv.status !== 'cancelled') {
          events.push({
            id: `invoice-${inv.id}`,
            type: 'invoice_due',
            title: `Factura ${inv.invoice_number || inv.id.slice(-6)}`,
            subtitle: `${inv.client_name} - ${inv.total?.toFixed(2) || 0}€`,
            date: inv.due_date,
            data: inv,
            link: createPageUrl("Invoices") + `?id=${inv.id}`,
            isOverdue: new Date(inv.due_date) < new Date() && inv.status !== 'paid'
          });
        }
      });
    }

    // Reminders from CRM
    if (filters.reminders) {
      activities.forEach(act => {
        if (act.reminder_date && !act.reminder_completed) {
          const client = clients.find(c => c.id === act.client_id);
          events.push({
            id: `reminder-${act.id}`,
            type: 'reminder',
            title: act.title,
            subtitle: client?.client_name || 'Cliente',
            date: act.reminder_date.split('T')[0],
            time: act.reminder_date.split('T')[1]?.slice(0, 5),
            data: act,
            link: createPageUrl("ClientDetail") + `?id=${act.client_id}`
          });
        }
      });
    }

    // Tasks
    if (filters.tasks) {
      tasks.forEach(task => {
        const client = clients.find(c => c.id === task.related_client_id);
        events.push({
          id: `task-${task.id}`,
          type: 'task',
          title: task.title,
          subtitle: client?.client_name || task.category,
          date: task.due_date,
          time: task.due_time,
          data: task,
          isCompleted: task.status === 'completed',
          priority: task.priority
        });
      });
    }

    return events.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [jobs, invoices, activities, tasks, clients, filters]);

  // Calendar helpers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Adjust for Monday start (0 = Monday, 6 = Sunday)
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;

    const days = [];
    
    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }

    return days;
  };

  const getEventsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return calendarEvents.filter(e => e.date === dateStr);
  };

  const navigateMonth = (delta) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const openTaskDialog = (date = null, task = null) => {
    if (task) {
      setEditingTask(task);
      setTaskForm({
        title: task.title || '',
        description: task.description || '',
        due_date: task.due_date || '',
        due_time: task.due_time || '',
        priority: task.priority || 'medium',
        category: task.category || 'work',
        related_client_id: task.related_client_id || ''
      });
    } else {
      setEditingTask(null);
      setTaskForm({
        title: '',
        description: '',
        due_date: date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        due_time: '',
        priority: 'medium',
        category: 'work',
        related_client_id: ''
      });
    }
    setShowTaskDialog(true);
  };

  const closeTaskDialog = () => {
    setShowTaskDialog(false);
    setEditingTask(null);
    setTaskForm({
      title: '',
      description: '',
      due_date: '',
      due_time: '',
      priority: 'medium',
      category: 'work',
      related_client_id: ''
    });
  };

  const handleSaveTask = () => {
    if (!taskForm.title || !taskForm.due_date) {
      toast.error('Completa el título y la fecha');
      return;
    }
    taskMutation.mutate(taskForm);
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  const days = getDaysInMonth(currentDate);
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>
            <p className="text-gray-600">Gestiona tu agenda de trabajos, facturas y tareas</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={goToToday} className="hidden md:flex">
              Hoy
            </Button>
            <Button onClick={() => openTaskDialog(selectedDate)}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva tarea
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filtros y vista */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(EVENT_TYPES).map(([key, config]) => {
                  const filterKey = key === 'job_start' || key === 'job_end' ? 'jobs' : 
                                   key === 'invoice_due' ? 'invoices' :
                                   key === 'reminder' ? 'reminders' : 'tasks';
                  return (
                    <label key={key} className="flex items-center gap-3 cursor-pointer">
                      <Checkbox
                        checked={filters[filterKey]}
                        onCheckedChange={(checked) => setFilters(f => ({ ...f, [filterKey]: checked }))}
                        className="border-gray-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                      <span className={`w-3 h-3 rounded-full ${config.color}`} />
                      <span className="text-sm text-gray-700">{config.label}</span>
                    </label>
                  );
                })}
              </CardContent>
            </Card>

            {/* Próximos eventos */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Próximos eventos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                {calendarEvents
                  .filter(e => new Date(e.date) >= new Date().setHours(0,0,0,0))
                  .slice(0, 5)
                  .map(event => {
                    const config = EVENT_TYPES[event.type];
                    return (
                      <div 
                        key={event.id} 
                        className={`p-2 rounded-lg border text-sm cursor-pointer hover:bg-gray-50 ${event.isCompleted ? 'opacity-50' : ''}`}
                        onClick={() => {
                          if (event.type === 'task') {
                            openTaskDialog(null, event.data);
                          } else if (event.link) {
                            navigate(event.link);
                          }
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${config.color}`} />
                          <span className={`font-medium truncate ${event.isCompleted ? 'line-through' : ''}`}>
                            {event.title}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 ml-4">
                          {new Date(event.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                          {event.time && ` · ${event.time}`}
                        </p>
                      </div>
                    );
                  })}
                {calendarEvents.filter(e => new Date(e.date) >= new Date().setHours(0,0,0,0)).length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No hay eventos próximos</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Calendario */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => navigateMonth(-1)}>
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <h2 className="text-lg font-semibold min-w-[180px] text-center">
                    {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h2>
                  <Button variant="ghost" size="icon" onClick={() => navigateMonth(1)}>
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
                <Button variant="outline" size="sm" onClick={goToToday} className="md:hidden">
                  Hoy
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Days header */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS.map(day => (
                  <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, idx) => {
                  const dayEvents = getEventsForDate(day.date);
                  const hasEvents = dayEvents.length > 0;
                  
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDate(day.date)}
                      className={`
                        min-h-[80px] p-1 rounded-lg border cursor-pointer transition-all
                        ${!day.isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
                        ${isToday(day.date) ? 'border-blue-500 border-2' : 'border-gray-100'}
                        ${isSelected(day.date) ? 'ring-2 ring-blue-300 bg-blue-50' : ''}
                        hover:bg-gray-50
                      `}
                    >
                      <div className={`text-sm font-medium mb-1 ${isToday(day.date) ? 'text-blue-600' : ''}`}>
                        {day.date.getDate()}
                      </div>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 3).map(event => {
                          const config = EVENT_TYPES[event.type];
                          return (
                            <div 
                              key={event.id}
                              className={`${config.color} text-white text-[10px] px-1 py-0.5 rounded truncate ${event.isCompleted ? 'opacity-50' : ''}`}
                              title={event.title}
                            >
                              {event.title}
                            </div>
                          );
                        })}
                        {dayEvents.length > 3 && (
                          <div className="text-[10px] text-gray-500 text-center">
                            +{dayEvents.length - 3} más
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Panel de detalles del día */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                {selectedDate 
                  ? selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
                  : 'Selecciona un día'
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDate ? (
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => openTaskDialog(selectedDate)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Añadir tarea
                  </Button>

                  {selectedDateEvents.length > 0 ? (
                    <div className="space-y-2">
                      {selectedDateEvents.map(event => {
                        const config = EVENT_TYPES[event.type];
                        const Icon = config.icon;
                        return (
                          <div 
                            key={event.id}
                            className={`p-3 rounded-lg border hover:shadow-sm transition-shadow cursor-pointer ${event.isCompleted ? 'bg-gray-50 opacity-60' : 'bg-white'}`}
                            onClick={() => {
                              if (event.type === 'task') {
                                openTaskDialog(null, event.data);
                              } else if (event.link) {
                                navigate(event.link);
                              }
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-8 h-8 rounded-lg ${config.color} flex items-center justify-center flex-shrink-0`}>
                                <Icon className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`font-medium text-sm ${event.isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                  {event.title}
                                </p>
                                {event.subtitle && (
                                  <p className="text-xs text-gray-500">{event.subtitle}</p>
                                )}
                                {event.time && (
                                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                    <Clock className="w-3 h-3" />
                                    {event.time}
                                  </div>
                                )}
                                {event.priority && event.type === 'task' && (
                                  <Badge 
                                    variant="outline" 
                                    className={`mt-1 text-[10px] ${
                                      event.priority === 'high' ? 'border-red-300 text-red-700' :
                                      event.priority === 'medium' ? 'border-yellow-300 text-yellow-700' :
                                      'border-gray-300 text-gray-600'
                                    }`}
                                  >
                                    {event.priority === 'high' ? 'Alta' : event.priority === 'medium' ? 'Media' : 'Baja'}
                                  </Badge>
                                )}
                              </div>
                              {event.type === 'task' && (
                                <Checkbox
                                  checked={event.isCompleted}
                                  onCheckedChange={(e) => {
                                    e.stopPropagation();
                                    toggleTaskComplete.mutate(event.data);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-8">
                      No hay eventos para este día
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">
                  Haz clic en un día para ver sus eventos
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog para crear/editar tarea */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? 'Editar tarea' : 'Nueva tarea'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Título *</label>
              <Input
                value={taskForm.title}
                onChange={(e) => setTaskForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Ej: Llamar al cliente"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Descripción</label>
              <Textarea
                value={taskForm.description}
                onChange={(e) => setTaskForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Detalles de la tarea..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Fecha *</label>
                <Input
                  type="date"
                  value={taskForm.due_date}
                  onChange={(e) => setTaskForm(f => ({ ...f, due_date: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Hora</label>
                <Input
                  type="time"
                  value={taskForm.due_time}
                  onChange={(e) => setTaskForm(f => ({ ...f, due_time: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Prioridad</label>
                <Select
                  value={taskForm.priority}
                  onValueChange={(v) => setTaskForm(f => ({ ...f, priority: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Categoría</label>
                <Select
                  value={taskForm.category}
                  onValueChange={(v) => setTaskForm(f => ({ ...f, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="work">Trabajo</SelectItem>
                    <SelectItem value="client">Cliente</SelectItem>
                    <SelectItem value="admin">Administrativo</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {clients.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-1 block">Cliente relacionado</label>
                <Select
                  value={taskForm.related_client_id}
                  onValueChange={(v) => setTaskForm(f => ({ ...f, related_client_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ninguno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Ninguno</SelectItem>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.client_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            {editingTask && (
              <Button 
                variant="destructive" 
                onClick={() => {
                  deleteTaskMutation.mutate(editingTask.id);
                  closeTaskDialog();
                }}
              >
                Eliminar
              </Button>
            )}
            <Button variant="outline" onClick={closeTaskDialog}>Cancelar</Button>
            <Button onClick={handleSaveTask} disabled={taskMutation.isPending}>
              {taskMutation.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
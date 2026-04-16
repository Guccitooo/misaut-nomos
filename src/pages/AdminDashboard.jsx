import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Briefcase, 
  CreditCard, 
  Loader2, 
  Eye, 
  EyeOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  MessageSquare,
  FileText
} from "lucide-react";
import { toast } from "sonner";

const isSubscriptionActive = (estado, fechaExpiracion) => {
  if (!estado) {
    return false;
  }
  
  const normalizedState = estado.toLowerCase().trim();
  const validStates = ["activo", "active", "en_prueba", "trialing", "trial_active", "actif"];
  
  if (validStates.includes(normalizedState)) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiration = new Date(fechaExpiracion);
      expiration.setHours(0, 0, 0, 0);
      
      const isValid = expiration >= today;
      return isValid;
    } catch (error) {
      console.error('Error parseando fecha:', error);
      return true; // Assume valid if date parsing fails to prevent accidental hiding
    }
  }
  
  if (normalizedState === "cancelado" || normalizedState === "canceled") {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiration = new Date(fechaExpiracion);
      expiration.setHours(0, 0, 0, 0);
      
      return expiration >= today;
    } catch (error) {
      return false;
    }
  }
  
  return false;
};

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("profiles");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [extendDays, setExtendDays] = useState(7);
  const [isCleaningOrphans, setIsCleaningOrphans] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  // ✅ NUEVO: Ejecutar limpieza automática al cargar admin dashboard
  useEffect(() => {
    if (user && user.role === 'admin') {
      console.log('👮 Admin detectado, ejecutando limpieza automática...');
      executeAutomaticCleanup();
    }
  }, [user]);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser.role !== 'admin') {
        toast.error('Acceso denegado');
        return;
      }
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  // ✅ NUEVO: Limpieza automática silenciosa
  const executeAutomaticCleanup = async () => {
    try {
      console.log('🧹 Ejecutando limpieza automática de datos huérfanos...');
      const response = await base44.functions.invoke('cleanOrphanData');
      
      if (response.data.ok && response.data.stats) {
        const total = Object.values(response.data.stats).reduce((a, b) => a + b, 0);
        
        if (total > 0) {
          console.log(`✅ Limpieza completada: ${total} registros huérfanos eliminados`);
          toast.success(`🧹 Limpieza automática: ${total} registros huérfanos eliminados`, {
            duration: 5000
          });
          
          // Refrescar datos
          queryClient.invalidateQueries({ queryKey: ['professionalProfiles'] });
          queryClient.invalidateQueries({ queryKey: ['allSubscriptions'] });
          queryClient.invalidateQueries({ queryKey: ['allUsers'] });
        } else {
          console.log('✅ Base de datos limpia, no hay registros huérfanos');
        }
      }
    } catch (error) {
      console.error('⚠️ Error en limpieza automática:', error);
    }
  };

  // ✅ NUEVO: Limpieza manual forzada (botón discreto)
  const handleForceCleanup = async () => {
    setIsCleaningOrphans(true);
    try {
      console.log('🧹 Forzando limpieza manual...');
      const response = await base44.functions.invoke('cleanOrphanData');
      
      if (response.data.ok) {
        const total = Object.values(response.data.stats).reduce((a, b) => a + b, 0);
        
        if (total > 0) {
          toast.success(`✅ ${total} registros huérfanos eliminados`);
          
          // Mostrar detalles
          setTimeout(() => {
            const details = [];
            if (response.data.stats.profiles > 0) details.push(`${response.data.stats.profiles} perfiles`);
            if (response.data.stats.subscriptions > 0) details.push(`${response.data.stats.subscriptions} suscripciones`);
            if (response.data.stats.messages > 0) details.push(`${response.data.stats.messages} mensajes`);
            if (response.data.stats.favorites > 0) details.push(`${response.data.stats.favorites} favoritos`);
            if (response.data.stats.reviews > 0) details.push(`${response.data.stats.reviews} reseñas`);
            
            if (details.length > 0) {
              toast.info(`Eliminados: ${details.join(', ')}`, {
                duration: 8000
              });
            }
          }, 1000);
        } else {
          toast.success('✅ Base de datos limpia, no hay registros huérfanos');
        }
        
        queryClient.invalidateQueries({ queryKey: ['professionalProfiles'] });
        queryClient.invalidateQueries({ queryKey: ['allSubscriptions'] });
        queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      } else {
        toast.error(`Error: ${response.data.error}`);
      }
    } catch (error) {
      console.error('Error en limpieza forzada:', error);
      toast.error('Error al ejecutar limpieza');
    } finally {
      setIsCleaningOrphans(false);
    }
  };

  const handleActivateTrial = async (email) => {
    try {
      console.log('🔧 Activando trial para:', email);
      
      const response = await base44.functions.invoke('activateUserTrial', {
        email: email
      });
      
      if (response.data.ok) {
        toast.success(`Trial activado correctamente para ${email}`);
        queryClient.invalidateQueries({ queryKey: ['professionalProfiles'] });
        queryClient.invalidateQueries({ queryKey: ['allSubscriptions'] });
        queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      } else {
        toast.error(`Error: ${response.data.error}`);
      }
    } catch (error) {
      console.error('Error activando trial:', error);
      toast.error('Error al activar trial');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      console.log('🗑️ Eliminando usuario:', selectedUser.id);
      
      const response = await base44.functions.invoke('deleteUser', {
        userId: selectedUser.id,
        isSelfDelete: false
      });
      
      if (response.data.ok) {
        toast.success(`Usuario ${selectedUser.email} eliminado completamente`);
        
        // ⚠️ Mostrar advertencia importante
        if (response.data.warning) {
          setTimeout(() => {
            toast.warning(response.data.warning, {
              duration: 15000,
              style: {
                background: '#FEF3C7',
                color: '#92400E',
                border: '2px solid #F59E0B'
              }
            });
          }, 1000);
        }
        
        queryClient.invalidateQueries({ queryKey: ['allUsers'] });
        queryClient.invalidateQueries({ queryKey: ['professionalProfiles'] });
        queryClient.invalidateQueries({ queryKey: ['allSubscriptions'] });
        setShowDeleteDialog(false);
        setSelectedUser(null);
      } else {
        toast.error(`Error: ${response.data.error}`);
      }
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      toast.error('Error al eliminar usuario');
    }
  };

  const handleFixSubscription = async (email) => {
    try {
      console.log('🔧 Corrigiendo suscripción para:', email);
      
      const response = await base44.functions.invoke('fixUserSubscription', {
        email: email
      });
      
      if (response.data.ok) {
        toast.success(`Suscripción corregida para ${email}`);
        queryClient.invalidateQueries({ queryKey: ['allSubscriptions'] });
        queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      } else {
        toast.error(`Error: ${response.data.error}`);
      }
    } catch (error) {
      console.error('Error corrigiendo suscripción:', error);
      toast.error('Error al corregir suscripción');
    }
  };

  const handleSuspendUser = async (userId, suspend) => {
    try {
      console.log(`${suspend ? '🔒' : '🔓'} ${suspend ? 'Suspendiendo' : 'Reactivando'} usuario:`, userId);
      
      const response = await base44.functions.invoke('suspendUser', {
        userId: userId,
        suspend: suspend
      });
      
      if (response.data.ok) {
        toast.success(`Usuario ${suspend ? 'suspendido' : 'reactivado'} correctamente`);
        queryClient.invalidateQueries({ queryKey: ['allUsers'] });
        queryClient.invalidateQueries({ queryKey: ['professionalProfiles'] });
        queryClient.invalidateQueries({ queryKey: ['allSubscriptions'] });
      } else {
        toast.error(`Error: ${response.data.error}`);
      }
    } catch (error) {
      console.error('Error cambiando estado:', error);
      toast.error('Error al cambiar estado del usuario');
    }
  };

  const handleExtendTrial = async () => {
    if (!selectedUser || !extendDays) return;

    try {
      console.log(`⏰ Extendiendo prueba ${extendDays} días para:`, selectedUser.id);
      
      const response = await base44.functions.invoke('extendTrial', {
        userId: selectedUser.id,
        days: parseInt(extendDays)
      });
      
      if (response.data.ok) {
        toast.success(`Prueba extendida ${extendDays} días correctamente`);
        queryClient.invalidateQueries({ queryKey: ['allSubscriptions'] });
        queryClient.invalidateQueries({ queryKey: ['allUsers'] });
        setShowExtendDialog(false);
        setSelectedUser(null);
        setExtendDays(7);
      } else {
        toast.error(`Error: ${response.data.error}`);
      }
    } catch (error) {
      console.error('Error extendiendo trial:', error);
      toast.error('Error al extender prueba');
    }
  };

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => {
      const allUsers = await base44.entities.User.list();
      return allUsers;
    },
    enabled: !!user,
  });

  const { data: profiles = [], isLoading: loadingProfiles } = useQuery({
    queryKey: ['professionalProfiles'],
    queryFn: async () => {
      const allProfiles = await base44.entities.ProfessionalProfile.list();
      return allProfiles;
    },
    enabled: !!user,
  });

  // ✅ MODIFICADO: Filtrar suscripciones para NO mostrar huérfanas
  const { data: subscriptions = [], isLoading: loadingSubscriptions } = useQuery({
    queryKey: ['allSubscriptions'],
    queryFn: async () => {
      console.log('\n💳 ========== CARGANDO SUSCRIPCIONES ==========');
      const subs = await base44.entities.Subscription.list();
      console.log(`📊 Total suscripciones: ${subs.length}`);
      
      // ✅ Filtrar solo suscripciones con usuario existente
      const usersList = await base44.entities.User.list(); // Renamed to avoid conflict with 'users' state/query result
      const userIds = new Set(usersList.map(u => u.id));
      
      const validSubs = subs.filter(sub => {
        const hasUser = userIds.has(sub.user_id);
        if (!hasUser) {
          console.log(`⚠️ Suscripción huérfana detectada: user_id ${sub.user_id}`);
        }
        return hasUser;
      });
      
      console.log(`✅ Suscripciones válidas: ${validSubs.length}`);
      return validSubs;
    },
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: 'always',
    initialData: [],
    enabled: !!user,
  });

  const { data: quotes = [], isLoading: loadingQuotes } = useQuery({
    queryKey: ['allQuotes'],
    queryFn: async () => {
      const allQuotes = await base44.entities.Quote.list('-created_date');
      return allQuotes;
    },
    enabled: !!user,
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ profileId, newVisibility }) => {
      await base44.entities.ProfessionalProfile.update(profileId, {
        visible_en_busqueda: newVisibility
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionalProfiles'] });
      toast.success('Visibilidad actualizada');
    },
  });

  const handleToggleVisibility = (profile) => {
    toggleVisibilityMutation.mutate({
      profileId: profile.id,
      newVisibility: !profile.visible_en_busqueda
    });
  };

  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = !searchTerm || 
      profile.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.email_contacto?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getEstadoBadge = (estado) => {
    const colors = {
      activo: "bg-green-100 text-green-800",
      pendiente: "bg-yellow-100 text-yellow-800",
      inactivo: "bg-gray-100 text-gray-800",
      suspendido: "bg-yellow-100 text-yellow-800",
      eliminado: "bg-red-100 text-red-800"
    };
    return (
      <Badge className={colors[estado] || "bg-gray-100 text-gray-800"}>
        {estado || 'Desconocido'}
      </Badge>
    );
  };

  const getVisibilidadBadge = (visible) => {
    return (
      <Badge className={visible ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
        {visible ? '👁 Visible' : '⚫ Oculto'}
      </Badge>
    );
  };

  const getSubscriptionBadge = (userSub) => {
    if (!userSub) {
      return (
        <div className="space-y-1">
          <Badge className="bg-gray-100 text-gray-800">Sin suscripción</Badge>
        </div>
      );
    }

    const isActive = isSubscriptionActive(userSub.estado, userSub.fecha_expiracion);
    const normalizedState = userSub.estado?.toLowerCase().trim();

    let colorClass = "bg-gray-100 text-gray-800";
    let statusText = userSub.estado;
    
    if (normalizedState === "en_prueba" || normalizedState === "trialing" || normalizedState === "trial_active") {
      colorClass = isActive ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800";
      statusText = isActive ? "en_prueba" : "prueba expirada";
    } else if (normalizedState === "activo" || normalizedState === "active" || normalizedState === "actif") {
      colorClass = isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
      statusText = isActive ? "activo" : "expirado";
    } else if (normalizedState === "cancelado" || normalizedState === "canceled") {
      colorClass = isActive ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800";
      statusText = isActive ? "cancelado (activo)" : "cancelado";
    } else if (normalizedState === "suspendu" || normalizedState === "suspendido") {
      colorClass = "bg-yellow-100 text-yellow-800";
      statusText = "Suspendido";
    } else if (normalizedState === "eliminado") {
      colorClass = "bg-red-100 text-red-800";
      statusText = "Eliminado";
    }


    return (
      <div className="space-y-1">
        <Badge className={colorClass}>
          {statusText}
        </Badge>
        {(normalizedState !== "eliminado" && normalizedState !== "suspendu" && normalizedState !== "suspendido") && (
          isActive ? (
            <div className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Visible
            </div>
          ) : (
            <div className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              No visible
            </div>
          )
        )}
        {userSub.fecha_expiracion && (
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(userSub.fecha_expiracion).toLocaleDateString('es-ES')}
          </div>
        )}
        {userSub.renovacion_automatica !== undefined && (
          <div className="text-xs text-gray-500">
            {userSub.renovacion_automatica ? '🔄 Auto-renovación' : '⏸️ Manual'}
          </div>
        )}
      </div>
    );
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-center text-gray-700">Acceso denegado - Solo administradores</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel de Administración</h1>
              <p className="text-gray-600">Gestiona usuarios, perfiles y suscripciones</p>
              <p className="text-sm text-green-600 mt-2">
                ✅ Limpieza automática activada - Los datos huérfanos se eliminan al cargar el panel
              </p>
            </div>
            <Button
              onClick={handleForceCleanup}
              disabled={isCleaningOrphans}
              variant="outline"
              size="sm"
              className="text-gray-600 border-gray-300 hover:bg-gray-50"
            >
              {isCleaningOrphans ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Limpiando...
                </>
              ) : (
                <>
                  🧹 Forzar limpieza
                </>
              )}
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="profiles" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Perfiles
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Datos Completos
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Usuarios
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Suscripciones
            </TabsTrigger>
            <TabsTrigger value="quotes" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Presupuestos
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2" onClick={() => window.location.href = '/AdminMessagesStats'}>
              <MessageSquare className="w-4 h-4" />
              Mensajes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profiles">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-blue-700" />
                    Gestión de Perfiles Profesionales
                  </CardTitle>
                  <Badge variant="outline" className="text-sm">
                    {profiles.length} perfiles
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Input
                    placeholder="Buscar por nombre, email o empresa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-md"
                  />
                </div>

                {loadingProfiles || loadingSubscriptions ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Empresa</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Usuario</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Categorías</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Estado</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Visibilidad</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Suscripción</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredProfiles.map((profile) => {
                          const userSub = subscriptions.find(s => s.user_id === profile.user_id);
                          const isActive = userSub && isSubscriptionActive(userSub.estado, userSub.fecha_expiracion);

                          return (
                            <tr key={profile.id} className={`hover:bg-gray-50 ${!isActive && userSub && userSub.estado?.toLowerCase().trim() !== 'eliminado' && userSub.estado?.toLowerCase().trim() !== 'suspendu' ? 'bg-red-50' : ''}`}>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                {profile.business_name || 'Sin nombre'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {users.find(u => u.id === profile.user_id)?.full_name || 'Sin nombre'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {profile.email_contacto || users.find(u => u.id === profile.user_id)?.email || 'Sin email'}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {profile.categories?.length > 0 ? profile.categories[0] : 'Sin categoría'}
                              </td>
                              <td className="px-4 py-3">
                                {getEstadoBadge(profile.estado_perfil)}
                              </td>
                              <td className="px-4 py-3">
                                {getVisibilidadBadge(profile.visible_en_busqueda)}
                              </td>
                              <td className="px-4 py-3">
                                {getSubscriptionBadge(userSub)}
                              </td>
                              <td className="px-4 py-3">
                                {!userSub || !isActive ? (
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      const userEmail = profile.email_contacto || users.find(u => u.id === profile.user_id)?.email;
                                      if (userEmail) {
                                        handleActivateTrial(userEmail);
                                      } else {
                                        toast.error('No se encontró email del usuario');
                                      }
                                    }}
                                    className="bg-green-600 hover:bg-green-700 text-xs"
                                  >
                                    Activar trial
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleToggleVisibility(profile)}
                                    className="text-xs"
                                  >
                                    {profile.visible_en_busqueda ? (
                                      <><EyeOff className="w-3 h-3 mr-1" />Ocultar</>
                                    ) : (
                                      <><Eye className="w-3 h-3 mr-1" />Mostrar</>
                                    )}
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-700" />
                  Datos Completos de Todos los Usuarios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Input
                    placeholder="Buscar por nombre, email, teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-md"
                  />
                </div>

                {loadingUsers || loadingProfiles ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 border-b sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600">Tipo</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600">Nombre Usuario</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600">Email</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600">Fecha Registro</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600">Nombre Comercial</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600">Teléfono</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600">NIF/CIF</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600">Categorías</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600">Ubicación</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600">Experiencia</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600">Tarifa</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600">Formas Pago</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600">Contacto</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600">Visible</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600">Suscripción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {users.filter(u => {
                          if (!searchTerm) return true;
                          const search = searchTerm.toLowerCase();
                          const profile = profiles.find(p => p.user_id === u.id);
                          return (
                            u.full_name?.toLowerCase().includes(search) ||
                            u.email?.toLowerCase().includes(search) ||
                            profile?.business_name?.toLowerCase().includes(search) ||
                            profile?.telefono_contacto?.includes(search)
                          );
                        }).map((userInfo) => {
                          const profile = profiles.find(p => p.user_id === userInfo.id);
                          const userSub = subscriptions.find(s => s.user_id === userInfo.id);
                          const isActive = userSub && isSubscriptionActive(userSub.estado, userSub.fecha_expiracion);
                          const isProfessional = userInfo.user_type === 'professionnel' || profile;

                          return (
                            <tr key={userInfo.id} className="hover:bg-gray-50">
                              <td className="px-3 py-2">
                                <Badge className={isProfessional ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}>
                                  {isProfessional ? 'Pro' : 'Cliente'}
                                </Badge>
                              </td>
                              <td className="px-3 py-2 font-medium text-gray-900">
                                {userInfo.full_name || '-'}
                              </td>
                              <td className="px-3 py-2 text-gray-700">
                                {userInfo.email}
                              </td>
                              <td className="px-3 py-2 text-gray-700">
                                {new Date(userInfo.created_date).toLocaleDateString('es-ES')}
                              </td>
                              <td className="px-3 py-2 text-gray-700">
                                {profile?.business_name || '-'}
                              </td>
                              <td className="px-3 py-2 text-gray-700">
                                {profile?.telefono_contacto || '-'}
                              </td>
                              <td className="px-3 py-2 text-gray-700">
                                {profile?.cif_nif || '-'}
                              </td>
                              <td className="px-3 py-2">
                                <div className="max-w-[200px]">
                                  {profile?.categories?.join(', ') || '-'}
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <div className="max-w-[150px]">
                                  {profile?.ciudad ? `${profile.ciudad}, ${profile.provincia}` : profile?.provincia || '-'}
                                </div>
                              </td>
                              <td className="px-3 py-2 text-gray-700">
                                {profile?.years_experience ? `${profile.years_experience} años` : '-'}
                              </td>
                              <td className="px-3 py-2 text-gray-700">
                                {profile?.tarifa_base ? `${profile.tarifa_base}€/h` : '-'}
                              </td>
                              <td className="px-3 py-2">
                                <div className="max-w-[150px]">
                                  {profile?.formas_pago?.join(', ') || '-'}
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex flex-col gap-1">
                                  {profile?.metodos_contacto?.map(m => (
                                    <Badge key={m} variant="outline" className="text-[10px] py-0">
                                      {m === 'chat_interno' ? 'Chat' : m === 'whatsapp' ? 'WA' : 'Tel'}
                                    </Badge>
                                  )) || '-'}
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                {profile?.visible_en_busqueda ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : profile ? (
                                  <XCircle className="w-4 h-4 text-gray-400" />
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-3 py-2">
                                {userSub ? (
                                  <div className="space-y-1">
                                    <Badge className={isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                                      {userSub.estado}
                                    </Badge>
                                    <div className="text-[10px] text-gray-500">
                                      {new Date(userSub.fecha_expiracion).toLocaleDateString('es-ES')}
                                    </div>
                                  </div>
                                ) : (
                                  <Badge className="bg-gray-100 text-gray-800">Sin sub</Badge>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-700" />
                  Gestión de Usuarios
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Nombre</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Tipo</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Estado</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Fecha registro</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {users.map((u) => {
                          const userSub = subscriptions.find(s => s.user_id === u.id);
                          const isSuspended = u.subscription_status === 'suspendu';
                          const isDeleted = u.subscription_status === 'eliminado' || u.full_name?.startsWith('[ELIMINADO]');
                          
                          return (
                            <tr key={u.id} className={`hover:bg-gray-50 ${isSuspended ? 'bg-yellow-50' : ''} ${isDeleted ? 'bg-red-50 opacity-60' : ''}`}>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                {u.full_name || 'Sin nombre'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {u.email}
                              </td>
                              <td className="px-4 py-3">
                                <Badge className={u.user_type === 'professionnel' ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}>
                                  {u.user_type === 'professionnel' ? 'Profesional' : u.user_type || 'Cliente'}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                {isDeleted ? (
                                  <Badge className="bg-red-100 text-red-800">Eliminado</Badge>
                                ) : isSuspended ? (
                                  <Badge className="bg-yellow-100 text-yellow-800">Suspendido</Badge>
                                ) : userSub ? (
                                  getSubscriptionBadge(userSub)
                                ) : (
                                  <Badge className="bg-gray-100 text-gray-800">Sin suscripción</Badge>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {new Date(u.created_date).toLocaleDateString('es-ES')}
                              </td>
                              <td className="px-4 py-3">
                                {isDeleted ? (
                                  <span className="text-xs text-gray-500">Usuario eliminado</span>
                                ) : (
                                  <div className="flex gap-1">
                                    {isSuspended ? (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleSuspendUser(u.id, false)}
                                        className="text-xs"
                                      >
                                        Reactivar
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleSuspendUser(u.id, true)}
                                        className="text-xs"
                                      >
                                        Suspender
                                      </Button>
                                    )}
                                    
                                    {userSub && !userSub.renovacion_automatica && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleFixSubscription(u.email)}
                                        className="text-xs text-orange-600"
                                        title="Corregir renovación automática"
                                      >
                                        ⚠️ Fix
                                      </Button>
                                    )}
                                    
                                    {userSub && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setSelectedUser(u);
                                          setShowExtendDialog(true);
                                        }}
                                        className="text-xs text-purple-600"
                                      >
                                        Extender
                                      </Button>
                                    )}
                                    
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => {
                                        setSelectedUser(u);
                                        setShowDeleteDialog(true);
                                      }}
                                      className="text-xs"
                                    >
                                      Eliminar
                                    </Button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  💰 Pagos Recibidos
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(createPageUrl("AdminPayments"))}
                  >
                    Ver página completa
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Gestiona todos los pagos recibidos desde la página dedicada.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscriptions">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-700" />
                  Gestión de Suscripciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingSubscriptions ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Usuario</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Plan</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Estado</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Inicio</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Expiración</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Renovación</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {subscriptions.map((sub) => {
                          const isActive = isSubscriptionActive(sub.estado, sub.fecha_expiracion);
                          return (
                            <tr key={sub.id} className={!isActive && sub.estado?.toLowerCase().trim() !== 'eliminado' && sub.estado?.toLowerCase().trim() !== 'suspendu' ? 'bg-red-50' : ''}>
                              <td className="px-4 py-3 text-sm">
                                {users.find(u => u.id === sub.user_id)?.email || sub.user_id}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {sub.plan_nombre}
                              </td>
                              <td className="px-4 py-3">
                                {getSubscriptionBadge(sub)}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {new Date(sub.fecha_inicio).toLocaleDateString('es-ES')}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {new Date(sub.fecha_expiracion).toLocaleDateString('es-ES')}
                              </td>
                              <td className="px-4 py-3">
                                <Badge className={sub.renovacion_automatica ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                                  {sub.renovacion_automatica ? '🔄 Automática' : '⏸️ Manual'}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quotes">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-700" />
                    Gestión de Presupuestos
                  </CardTitle>
                  <Badge variant="outline" className="text-sm">
                    {quotes.length} presupuestos
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {loadingQuotes ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
                  </div>
                ) : quotes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No hay presupuestos en el sistema
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Fecha</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Título</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Profesional</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Cliente</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Total</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Estado</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Versión</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {quotes.map((quote) => {
                          const statusColors = {
                            borrador: "bg-gray-100 text-gray-800",
                            enviado: "bg-blue-100 text-blue-800",
                            aceptado: "bg-green-100 text-green-800",
                            rechazado: "bg-red-100 text-red-800"
                          };
                          
                          return (
                            <tr key={quote.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {new Date(quote.created_date).toLocaleDateString('es-ES')}
                              </td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                {quote.title}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {quote.professional_name}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {quote.client_name}
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                {quote.total?.toFixed(2)}€
                              </td>
                              <td className="px-4 py-3">
                                <Badge className={statusColors[quote.status] || "bg-gray-100 text-gray-800"}>
                                  {quote.status}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                v{quote.version || 1}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ✅ NUEVO: Dialog de confirmación de eliminación - DISEÑO MEJORADO */}
        {showDeleteDialog && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <Card className="max-w-lg w-full bg-white shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-red-600 to-red-700 border-b-0 rounded-t-lg py-4">
                <CardTitle className="flex items-center gap-2 text-white text-lg">
                  <AlertCircle className="w-5 h-5 animate-pulse" />
                  Eliminar usuario definitivamente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4 pb-5 px-5">
                {/* ⚠️ Advertencia crítica - compacta */}
                <div className="bg-red-50 border-l-4 border-red-600 p-3 rounded-md">
                  <p className="text-sm font-bold text-red-900 text-center">
                    ⚠️ ATENCIÓN: Esta acción es IRREVERSIBLE
                  </p>
                </div>

                {/* Usuario a eliminar */}
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-1.5">
                    Usuario a eliminar:
                  </p>
                  <div className="bg-gray-100 p-2.5 rounded-lg border border-gray-200">
                    <p className="text-sm font-semibold text-gray-900">{selectedUser?.full_name || 'Sin nombre'}</p>
                    <p className="text-xs text-gray-600">{selectedUser?.email}</p>
                  </div>
                </div>

                {/* Lista de elementos a eliminar - compacta */}
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3">
                  <p className="text-xs font-bold text-yellow-900 mb-1.5">
                    📋 Se eliminará automáticamente:
                  </p>
                  <ul className="text-xs text-yellow-800 space-y-0.5 ml-3 list-disc leading-relaxed">
                    <li>Suscripción (cancelación inmediata en Stripe)</li>
                    <li>Perfil profesional y fotos</li>
                    <li>Mensajes enviados y recibidos</li>
                    <li>Reseñas realizadas y recibidas</li>
                    <li>Lista de favoritos</li>
                    <li>Registro completo del usuario</li>
                  </ul>
                  <p className="text-xs text-yellow-700 mt-2 font-semibold">
                    ✅ Los datos huérfanos se limpiarán automáticamente
                  </p>
                </div>

                {/* Paso adicional - compacto */}
                <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-md">
                  <p className="text-xs font-bold text-blue-900 mb-1">
                    🔐 PASO ADICIONAL REQUERIDO:
                  </p>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    Después de confirmar, debes ir manualmente a <strong>Base44 Dashboard → Users</strong> y eliminar la cuenta de autenticación con email <strong className="underline">{selectedUser?.email}</strong>
                  </p>
                </div>

                {/* Botones */}
                <div className="flex gap-3 justify-end pt-3 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteDialog(false);
                      setSelectedUser(null);
                    }}
                    className="hover:bg-gray-100"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleDeleteUser}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse-slow border-2 border-red-700"
                  >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Eliminar definitivamente
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <style>{`
              @keyframes pulse-slow {
                0%, 100% {
                  opacity: 1;
                  box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7);
                }
                50% {
                  opacity: 0.95;
                  box-shadow: 0 0 0 6px rgba(220, 38, 38, 0);
                }
              }
              
              .animate-pulse-slow {
                animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
              }
            `}</style>
          </div>
        )}

        {showExtendDialog && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <Card className="max-w-md w-full bg-white shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 border-b-0 rounded-t-lg py-4">
                <CardTitle className="flex items-center gap-2 text-white text-lg">
                  <Calendar className="w-5 h-5" />
                  Extender periodo de prueba
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-5 pb-5 px-5">
                <p className="text-sm text-gray-700">
                  Usuario: <strong>{selectedUser?.email}</strong>
                </p>
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Días a extender</Label>
                  <Input
                    type="number"
                    min="1"
                    max="90"
                    value={extendDays}
                    onChange={(e) => setExtendDays(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div className="flex gap-3 justify-end pt-3 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowExtendDialog(false);
                      setSelectedUser(null);
                      setExtendDays(7);
                    }}
                    className="hover:bg-gray-100"
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="bg-purple-600 hover:bg-purple-700 shadow-md"
                    onClick={handleExtendTrial}
                  >
                    Extender {extendDays} días
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
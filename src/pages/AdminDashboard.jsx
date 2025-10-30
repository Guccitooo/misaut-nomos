
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label"; // New import
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
  Calendar
} from "lucide-react";
import { toast } from "sonner";

// ✅ HELPER: Verificar si suscripción está activa (MISMA LÓGICA QUE EN SEARCH)
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
      return true;
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
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("profiles");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [extendDays, setExtendDays] = useState(7);

  useEffect(() => {
    loadUser();
  }, []);

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
        userId: selectedUser.id
      });
      
      if (response.data.ok) {
        toast.success(`Usuario ${selectedUser.email} eliminado correctamente`);
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

  const { data: subscriptions = [], isLoading: loadingSubscriptions } = useQuery({
    queryKey: ['allSubscriptions'],
    queryFn: async () => {
      const allSubs = await base44.entities.Subscription.list();
      return allSubs;
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
      suspendido: "bg-red-100 text-red-800"
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
    
    if (normalizedState === "en_prueba" || normalizedState === "trialing") {
      colorClass = isActive ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800";
      statusText = isActive ? "en_prueba" : "prueba expirada";
    } else if (normalizedState === "activo" || normalizedState === "active" || normalizedState === "actif") {
      colorClass = isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
      statusText = isActive ? "activo" : "expirado";
    } else if (normalizedState === "cancelado" || normalizedState === "canceled") {
      colorClass = isActive ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800";
      statusText = isActive ? "cancelado (activo)" : "cancelado";
    } else {
      colorClass = "bg-gray-100 text-gray-800";
    }

    return (
      <div className="space-y-1">
        <Badge className={colorClass}>
          {statusText}
        </Badge>
        {isActive ? (
          <div className="text-xs text-green-600 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Visible
          </div>
        ) : (
          <div className="text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            No visible
          </div>
        )}
        {userSub.fecha_expiracion && (
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(userSub.fecha_expiracion).toLocaleDateString('es-ES')}
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel de Administración</h1>
          <p className="text-gray-600">Gestiona usuarios, perfiles y suscripciones</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="profiles" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Perfiles
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Usuarios
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Suscripciones
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
                            <tr key={profile.id} className={`hover:bg-gray-50 ${!isActive ? 'bg-red-50' : ''}`}>
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
                          
                          return (
                            <tr key={u.id} className={`hover:bg-gray-50 ${isSuspended ? 'bg-yellow-50' : ''}`}>
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
                                {isSuspended ? (
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
                            <tr key={sub.id} className={!isActive ? 'bg-red-50' : ''}>
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
                                  {sub.renovacion_automatica ? 'Automática' : 'Manual'}
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
        </Tabs>

        {showDeleteDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  Eliminar usuario
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-700">
                  ⚠️ ¿Estás seguro de que quieres eliminar este usuario y todo su perfil asociado?
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  Usuario: {selectedUser?.email}
                </p>
                <p className="text-sm text-red-600">
                  Esta acción no se puede deshacer.
                </p>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteDialog(false);
                      setSelectedUser(null);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteUser}
                  >
                    Eliminar permanentemente
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {showExtendDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-600">
                  <Calendar className="w-5 h-5" />
                  Extender periodo de prueba
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-700">
                  Usuario: <strong>{selectedUser?.email}</strong>
                </p>
                <div>
                  <Label>Días a extender</Label>
                  <Input
                    type="number"
                    min="1"
                    max="90"
                    value={extendDays}
                    onChange={(e) => setExtendDays(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowExtendDialog(false);
                      setSelectedUser(null);
                      setExtendDays(7);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="bg-purple-600 hover:bg-purple-700"
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

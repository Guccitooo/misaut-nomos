import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Briefcase,
  MessageSquare,
  Star,
  TrendingUp,
  Shield,
  Search,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  Trash2,
  CreditCard,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [deletingReview, setDeletingReview] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser.role !== "admin") {
        window.location.href = "/";
        return;
      }
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const { data: users = [] } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!user,
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['adminProfiles'],
    queryFn: () => base44.entities.ProfessionalProfile.list(),
    enabled: !!user,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['adminMessages'],
    queryFn: () => base44.entities.Message.list(),
    enabled: !!user,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['adminReviews'],
    queryFn: () => base44.entities.Review.list('-created_date'),
    enabled: !!user,
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['adminSubscriptions'],
    queryFn: () => base44.entities.Subscription.list('-created_date'),
    enabled: !!user,
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ profileId, newVisibility }) => {
      await base44.entities.ProfessionalProfile.update(profileId, {
        visible_en_busqueda: newVisibility,
        estado_perfil: newVisibility ? "activo" : "inactivo"
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminProfiles'] });
      toast.success(
        variables.newVisibility 
          ? "✅ Perfil activado y visible en búsquedas" 
          : "⚠️ Perfil oculto de búsquedas"
      );
    },
    onError: () => {
      toast.error("Error al cambiar la visibilidad");
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId) => {
      // Eliminar perfil profesional si existe
      const userProfiles = profiles.filter(p => p.user_id === userId);
      for (const profile of userProfiles) {
        await base44.entities.ProfessionalProfile.delete(profile.id);
      }

      // Eliminar mensajes
      const userMessages = messages.filter(m => m.sender_id === userId || m.recipient_id === userId);
      for (const msg of userMessages) {
        await base44.entities.Message.delete(msg.id);
      }

      // Eliminar reseñas
      const userReviews = reviews.filter(r => r.client_id === userId || r.professional_id === userId);
      for (const review of userReviews) {
        await base44.entities.Review.delete(review.id);
      }

      // Eliminar suscripciones
      const userSubs = subscriptions.filter(s => s.user_id === userId);
      for (const sub of userSubs) {
        await base44.entities.Subscription.delete(sub.id);
      }

      // Finalmente eliminar usuario
      await base44.entities.User.delete(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminProfiles'] });
      queryClient.invalidateQueries({ queryKey: ['adminMessages'] });
      queryClient.invalidateQueries({ queryKey: ['adminReviews'] });
      queryClient.invalidateQueries({ queryKey: ['adminSubscriptions'] });
      setDeletingUser(null);
      toast.success("✅ Usuario eliminado correctamente");
    },
    onError: (error) => {
      toast.error("Error al eliminar usuario: " + error.message);
    }
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId) => {
      await base44.entities.Review.delete(reviewId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminReviews'] });
      setDeletingReview(null);
      toast.success("✅ Reseña eliminada correctamente");
    },
    onError: (error) => {
      toast.error("Error al eliminar reseña: " + error.message);
    }
  });

  const toggleReviewVisibilityMutation = useMutation({
    mutationFn: async ({ reviewId, isReported }) => {
      await base44.entities.Review.update(reviewId, {
        is_reported: !isReported
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminReviews'] });
      toast.success("✅ Estado de reseña actualizado");
    }
  });

  const professionals = users.filter(u => u.user_type === "professionnel");
  const clients = users.filter(u => u.user_type === "client");
  const activeProfiles = profiles.filter(p => p.visible_en_busqueda === true);
  const pendingProfiles = profiles.filter(p => p.visible_en_busqueda === false);

  const stats = [
    {
      title: "Usuarios totales",
      value: users.length,
      icon: Users,
      color: "bg-blue-500"
    },
    {
      title: "Autónomos",
      value: professionals.length,
      icon: Briefcase,
      color: "bg-green-500"
    },
    {
      title: "Perfiles activos",
      value: activeProfiles.length,
      icon: Eye,
      color: "bg-purple-500"
    },
    {
      title: "Perfiles pendientes",
      value: pendingProfiles.length,
      icon: AlertTriangle,
      color: "bg-orange-500"
    },
    {
      title: "Mensajes totales",
      value: messages.length,
      icon: MessageSquare,
      color: "bg-pink-500"
    },
    {
      title: "Valoraciones",
      value: reviews.length,
      icon: Star,
      color: "bg-yellow-500"
    }
  ];

  const profilesWithUserData = profiles.map(profile => {
    const userData = users.find(u => u.id === profile.user_id);
    return {
      ...profile,
      user_email: userData?.email || "Sin email",
      user_name: userData?.full_name || "Sin nombre",
      subscription_status: userData?.subscription_status || "desconocido"
    };
  });

  const reviewsWithUserData = reviews.map(review => {
    const client = users.find(u => u.id === review.client_id);
    const professional = users.find(u => u.id === review.professional_id);
    const profile = profiles.find(p => p.user_id === review.professional_id);
    
    return {
      ...review,
      client_email: client?.email || "Usuario eliminado",
      client_full_name: client?.full_name || review.client_name,
      professional_name: profile?.business_name || "Profesional eliminado"
    };
  });

  const subscriptionsWithUserData = subscriptions.map(sub => {
    const userData = users.find(u => u.id === sub.user_id);
    return {
      ...sub,
      user_email: userData?.email || "Sin email",
      user_name: userData?.full_name || "Sin nombre"
    };
  });

  const filteredProfiles = profilesWithUserData.filter(profile =>
    profile.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(u =>
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
            <p className="text-gray-600">Gestión completa de la plataforma</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, idx) => (
            <Card key={idx} className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="profiles" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="profiles">Perfiles</TabsTrigger>
            <TabsTrigger value="users">Usuarios</TabsTrigger>
            <TabsTrigger value="subscriptions">Suscripciones</TabsTrigger>
            <TabsTrigger value="reviews">Reseñas</TabsTrigger>
          </TabsList>

          {/* Perfiles Tab */}
          <TabsContent value="profiles">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-blue-700" />
                    Gestión de Perfiles Profesionales
                  </div>
                  <Badge className="bg-blue-100 text-blue-900">
                    {filteredProfiles.length} perfiles
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar por nombre, email o empresa..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Categorías</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Visibilidad</TableHead>
                        <TableHead>Suscripción</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProfiles.map((profile) => (
                        <TableRow key={profile.id}>
                          <TableCell className="font-medium">
                            {profile.business_name}
                          </TableCell>
                          <TableCell>{profile.user_name}</TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {profile.user_email}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {profile.categories?.slice(0, 2).map((cat, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {cat}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              profile.estado_perfil === "activo" ? "bg-green-100 text-green-800" :
                              profile.estado_perfil === "pendiente" ? "bg-yellow-100 text-yellow-800" :
                              "bg-gray-100 text-gray-800"
                            }>
                              {profile.estado_perfil}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {profile.visible_en_busqueda ? (
                              <Badge className="bg-green-100 text-green-800">
                                <Eye className="w-3 h-3 mr-1" />
                                Visible
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-800">
                                <EyeOff className="w-3 h-3 mr-1" />
                                Oculto
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              profile.subscription_status === "actif" ? "bg-green-100 text-green-800" :
                              profile.subscription_status === "en_prueba" ? "bg-blue-100 text-blue-800" :
                              "bg-red-100 text-red-800"
                            }>
                              {profile.subscription_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant={profile.visible_en_busqueda ? "outline" : "default"}
                                onClick={() => toggleVisibilityMutation.mutate({
                                  profileId: profile.id,
                                  newVisibility: !profile.visible_en_busqueda
                                })}
                                disabled={toggleVisibilityMutation.isPending}
                              >
                                {profile.visible_en_busqueda ? (
                                  <><EyeOff className="w-3 h-3 mr-1" /> Ocultar</>
                                ) : (
                                  <><Eye className="w-3 h-3 mr-1" /> Mostrar</>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedProfile(profile)}
                              >
                                Ver
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-700" />
                    Gestión de Usuarios
                  </div>
                  <Badge className="bg-blue-100 text-blue-900">
                    {filteredUsers.length} usuarios
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar por nombre o email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Estado suscripción</TableHead>
                        <TableHead>Fecha alta</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((usr) => (
                        <TableRow key={usr.id}>
                          <TableCell className="font-medium">{usr.full_name || "Sin nombre"}</TableCell>
                          <TableCell>{usr.email}</TableCell>
                          <TableCell>
                            <Badge className={usr.user_type === "professionnel" ? "bg-orange-100 text-orange-800" : "bg-blue-100 text-blue-800"}>
                              {usr.user_type === "professionnel" ? "Autónomo" : "Cliente"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {usr.subscription_status && (
                              <Badge className={
                                usr.subscription_status === "actif" ? "bg-green-100 text-green-800" :
                                usr.subscription_status === "en_prueba" ? "bg-blue-100 text-blue-800" :
                                "bg-gray-100 text-gray-800"
                              }>
                                {usr.subscription_status}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {new Date(usr.created_date).toLocaleDateString('es-ES')}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setDeletingUser(usr)}
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Eliminar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-700" />
                    Gestión de Suscripciones
                  </div>
                  <Badge className="bg-blue-100 text-blue-900">
                    {subscriptionsWithUserData.length} suscripciones
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Inicio</TableHead>
                        <TableHead>Expiración</TableHead>
                        <TableHead>Renovación auto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscriptionsWithUserData.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell className="font-medium">{sub.user_name}</TableCell>
                          <TableCell className="text-sm text-gray-600">{sub.user_email}</TableCell>
                          <TableCell>{sub.plan_nombre}</TableCell>
                          <TableCell className="font-semibold">{sub.plan_precio}€</TableCell>
                          <TableCell>
                            <Badge className={
                              sub.estado === "activo" ? "bg-green-100 text-green-800" :
                              sub.estado === "en_prueba" ? "bg-blue-100 text-blue-800" :
                              sub.estado === "cancelado" ? "bg-yellow-100 text-yellow-800" :
                              "bg-red-100 text-red-800"
                            }>
                              {sub.estado}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(sub.fecha_inicio).toLocaleDateString('es-ES')}
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(sub.fecha_expiracion).toLocaleDateString('es-ES')}
                          </TableCell>
                          <TableCell>
                            {sub.renovacion_automatica ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-blue-700" />
                    Gestión de Reseñas
                  </div>
                  <Badge className="bg-blue-100 text-blue-900">
                    {reviewsWithUserData.length} reseñas
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reviewsWithUserData.map((review) => (
                    <div key={review.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">{review.client_full_name}</span>
                            <span className="text-gray-500">→</span>
                            <span className="text-gray-700">{review.professional_name}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= review.rating
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(review.created_date).toLocaleDateString('es-ES')}
                            </span>
                            {review.is_verified && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                Verificada
                              </Badge>
                            )}
                            {review.is_reported && (
                              <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
                                Reportada
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-700 text-sm">{review.comment}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleReviewVisibilityMutation.mutate({
                              reviewId: review.id,
                              isReported: review.is_reported
                            })}
                          >
                            {review.is_reported ? "Aprobar" : "Marcar"}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeletingReview(review)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        Cliente: {review.client_email}
                      </div>
                    </div>
                  ))}

                  {reviewsWithUserData.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Star className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium">Sin reseñas aún</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Profile Detail Dialog */}
        <Dialog open={!!selectedProfile} onOpenChange={() => setSelectedProfile(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedProfile?.business_name}</DialogTitle>
              <DialogDescription>
                Detalles completos del perfil profesional
              </DialogDescription>
            </DialogHeader>
            {selectedProfile && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Usuario</p>
                    <p className="font-semibold">{selectedProfile.user_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold">{selectedProfile.user_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">CIF/NIF</p>
                    <p className="font-semibold">{selectedProfile.cif_nif || "No especificado"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Teléfono</p>
                    <p className="font-semibold">{selectedProfile.telefono_contacto || "No especificado"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ubicación</p>
                    <p className="font-semibold">{selectedProfile.service_area || "No especificado"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tarifa base</p>
                    <p className="font-semibold">{selectedProfile.tarifa_base}€/hora</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-2">Descripción</p>
                  <p className="text-sm">{selectedProfile.descripcion_corta || "Sin descripción"}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Categorías</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProfile.categories?.map((cat, idx) => (
                      <Badge key={idx}>{cat}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Fotos ({selectedProfile.photos?.length || 0})</p>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedProfile.photos?.slice(0, 6).map((photo, idx) => (
                      <img
                        key={idx}
                        src={photo}
                        alt={`Foto ${idx + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete User Confirmation */}
        <AlertDialog open={!!deletingUser} onOpenChange={() => setDeletingUser(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará permanentemente:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>El usuario <strong>{deletingUser?.email}</strong></li>
                  <li>Su perfil profesional (si existe)</li>
                  <li>Todos sus mensajes</li>
                  <li>Todas sus reseñas</li>
                  <li>Su suscripción</li>
                </ul>
                <p className="mt-3 text-red-600 font-semibold">
                  ⚠️ Esta acción NO se puede deshacer.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteUserMutation.mutate(deletingUser.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteUserMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  "Sí, eliminar permanentemente"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Review Confirmation */}
        <AlertDialog open={!!deletingReview} onOpenChange={() => setDeletingReview(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar reseña?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará permanentemente la reseña de{" "}
                <strong>{deletingReview?.client_full_name}</strong> para{" "}
                <strong>{deletingReview?.professional_name}</strong>.
                <p className="mt-2 text-red-600">
                  Esta acción NO se puede deshacer.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteReviewMutation.mutate(deletingReview.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteReviewMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  "Sí, eliminar reseña"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
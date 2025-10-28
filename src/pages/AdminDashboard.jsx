
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Users,
  DollarSign,
  TrendingUp,
  Activity,
  Search,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
  MessageSquare,
  Star,
  Flag
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editData, setEditData] = useState({});
  const [success, setSuccess] = useState(null);

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

  const { data: allUsers = [] } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => base44.entities.User.list('-created_date'),
    enabled: !!user && user.role === "admin",
    initialData: [],
  });

  const { data: allProfiles = [] } = useQuery({
    queryKey: ['adminProfiles'],
    queryFn: () => base44.entities.ProfessionalProfile.list(),
    enabled: !!user && user.role === "admin",
    initialData: [],
  });

  const { data: allMessages = [] } = useQuery({
    queryKey: ['adminMessages'],
    queryFn: () => base44.entities.Message.list('-created_date', 100),
    enabled: !!user && user.role === "admin",
    initialData: [],
  });

  const { data: allReviews = [] } = useQuery({
    queryKey: ['adminReviews'],
    queryFn: () => base44.entities.Review.list('-created_date', 100),
    enabled: !!user && user.role === "admin",
    initialData: [],
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }) => {
      const users = await base44.entities.User.filter({ id: userId });
      if (users[0]) {
        await base44.entities.User.update(users[0].id, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      setShowEditDialog(false);
      setSuccess("Usuario actualizado correctamente");
      setTimeout(() => setSuccess(null), 3000);
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId) => {
      await base44.entities.Review.delete(reviewId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminReviews'] });
      setSuccess("Opinión eliminada correctamente");
      setTimeout(() => setSuccess(null), 3000);
    },
  });

  const unreportReviewMutation = useMutation({
    mutationFn: async (reviewId) => {
      await base44.entities.Review.update(reviewId, { is_reported: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminReviews'] });
      setSuccess("Opinión marcada como válida");
      setTimeout(() => setSuccess(null), 3000);
    },
  });

  const sendNotificationMutation = useMutation({
    mutationFn: async ({ email, subject, body }) => {
      return base44.integrations.Core.SendEmail({
        to: email,
        subject: subject,
        body: body,
        from_name: "milautonomos"
      });
    },
  });

  // Statistics
  const professionals = allUsers.filter(u => u.user_type === "professionnel");
  const clients = allUsers.filter(u => u.user_type === "client");
  const activeProfessionals = professionals.filter(u => u.subscription_status === "actif");
  const pendingProfessionals = professionals.filter(u => u.subscription_status === "en_attente");
  const suspendedProfessionals = professionals.filter(u => u.subscription_status === "suspendu");
  const reportedReviews = allReviews.filter(r => r.is_reported);

  // This month stats
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const newUsersThisMonth = allUsers.filter(u => {
    const created = new Date(u.created_date);
    return created.getMonth() === thisMonth && created.getFullYear() === thisYear;
  }).length;

  const recentMessages = allMessages.slice(0, 10);
  // const recentReviews = allReviews.slice(0, 10); // This was removed as reportedReviews are now shown in a dedicated tab

  const filteredUsers = allUsers.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditData({
      subscription_status: user.subscription_status || "actif",
      full_name: user.full_name || "",
      phone: user.phone || "",
      city: user.city || "",
    });
    setShowEditDialog(true);
  };

  const handleSuspendUser = async (userId, currentStatus) => {
    const newStatus = currentStatus === "suspendu" ? "actif" : "suspendu";
    await updateUserMutation.mutateAsync({ 
      userId, 
      data: { subscription_status: newStatus } 
    });
  };

  const handleSendNotification = async (email, type) => {
    const notifications = {
      subscription_reminder: {
        subject: "Recordatorio de suscripción - milautonomos",
        body: "Hola,\n\nTu suscripción en milautonomos está próxima a vencer. Por favor, renueva tu suscripción para seguir apareciendo en los resultados de búsqueda.\n\nGracias,\nEquipo milautonomos"
      },
      welcome: {
        subject: "Bienvenido a milautonomos",
        body: "Hola,\n\n¡Bienvenido a milautonomos! Estamos encantados de tenerte con nosotros.\n\nGracias,\nEquipo milautonomos"
      }
    };

    const notification = notifications[type];
    if (notification) {
      await sendNotificationMutation.mutateAsync({
        email,
        subject: notification.subject,
        body: notification.body
      });
      setSuccess("Notificación enviada correctamente");
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel de Administración</h1>
          <p className="text-gray-600">Gestiona usuarios, suscripciones y actividad</p>
        </div>

        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Usuarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{allUsers.length}</div>
              <p className="text-sm text-gray-500 mt-1">
                {professionals.length} autónomos, {clients.length} clientes
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Nuevos este mes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{newUsersThisMonth}</div>
              <p className="text-sm text-green-600 mt-1">
                +{((newUsersThisMonth / allUsers.length) * 100).toFixed(1)}% del total
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Suscripciones Activas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{activeProfessionals.length}</div>
              <p className="text-sm text-gray-500 mt-1">
                {pendingProfessionals.length} pendientes, {suspendedProfessionals.length} suspendidas
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Flag className="w-4 h-4" />
                Opiniones reportadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{reportedReviews.length}</div>
              <p className="text-sm text-gray-500 mt-1">
                {allReviews.length} opiniones totales
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-white border border-gray-200">
            <TabsTrigger value="users">Usuarios</TabsTrigger>
            <TabsTrigger value="subscriptions">Suscripciones</TabsTrigger>
            <TabsTrigger value="reviews">Opiniones reportadas</TabsTrigger>
            <TabsTrigger value="activity">Actividad</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Gestión de Usuarios</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Buscar usuario..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Registro</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{u.full_name || u.email}</p>
                            <p className="text-sm text-gray-500">{u.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={u.user_type === "professionnel" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}>
                            {u.user_type === "professionnel" ? "Autónomo" : "Cliente"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {u.user_type === "professionnel" && (
                            <Badge 
                              className={
                                u.subscription_status === "actif" ? "bg-green-100 text-green-800" :
                                u.subscription_status === "en_attente" ? "bg-yellow-100 text-yellow-800" :
                                u.subscription_status === "suspendu" ? "bg-red-100 text-red-800" :
                                "bg-gray-100 text-gray-800"
                              }
                            >
                              {u.subscription_status === "actif" ? "Activo" :
                               u.subscription_status === "en_attente" ? "Pendiente" :
                               u.subscription_status === "suspendu" ? "Suspendido" : "Cancelado"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {format(new Date(u.created_date), "dd MMM yyyy", { locale: es })}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditUser(u)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {u.user_type === "professionnel" && (
                              <Button
                                size="sm"
                                variant={u.subscription_status === "suspendu" ? "default" : "destructive"}
                                onClick={() => handleSuspendUser(u.id, u.subscription_status)}
                              >
                                {u.subscription_status === "suspendu" ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-4">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Gestión de Suscripciones</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Autónomo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Inicio</TableHead>
                      <TableHead>Último Pago</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {professionals.map((prof) => (
                      <TableRow key={prof.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{prof.full_name || prof.email}</p>
                            <p className="text-sm text-gray-500">{prof.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={
                              prof.subscription_status === "actif" ? "bg-green-100 text-green-800" :
                              prof.subscription_status === "en_attente" ? "bg-yellow-100 text-yellow-800" :
                              prof.subscription_status === "suspendu" ? "bg-red-100 text-red-800" :
                              "bg-gray-100 text-gray-800"
                            }
                          >
                            {prof.subscription_status === "actif" ? "Activo" :
                             prof.subscription_status === "en_attente" ? "Pendiente" :
                             prof.subscription_status === "suspendu" ? "Suspendido" : "Cancelado"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {prof.subscription_start_date ? 
                            format(new Date(prof.subscription_start_date), "dd MMM yyyy", { locale: es }) : 
                            "-"}
                        </TableCell>
                        <TableCell>
                          {prof.last_payment_date ? 
                            format(new Date(prof.last_payment_date), "dd MMM yyyy", { locale: es }) : 
                            "-"}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendNotification(prof.email, "subscription_reminder")}
                          >
                            Enviar recordatorio
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reported Reviews Tab */}
          <TabsContent value="reviews" className="space-y-4">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="w-5 h-5 text-red-500" />
                  Opiniones Reportadas ({reportedReviews.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reportedReviews.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-300" />
                    <p className="font-medium">No hay opiniones reportadas</p>
                    <p className="text-sm">Todas las opiniones están en orden</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reportedReviews.map((review) => (
                      <div key={review.id} className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-gray-900">{review.client_name}</p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(review.created_date), "d MMM yyyy", { locale: es })}
                            </p>
                          </div>
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
                        </div>
                        <p className="text-sm text-gray-700 mb-3">{review.comment}</p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => unreportReviewMutation.mutate(review.id)}
                            className="text-green-600 border-green-600 hover:bg-green-50"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Marcar como válida
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteReviewMutation.mutate(review.id)}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Eliminar opinión
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6"> {/* Changed from 2 cols to 1 as reviews are now in their own tab */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-700" />
                    Mensajes Recientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentMessages.map((msg) => (
                      <div key={msg.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-medium text-sm">{msg.professional_name || msg.client_name}</p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(msg.created_date), "dd MMM HH:mm", { locale: es })}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit User Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Usuario</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Nombre completo</Label>
                <Input
                  value={editData.full_name || ""}
                  onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input
                  value={editData.phone || ""}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label>Ciudad</Label>
                <Input
                  value={editData.city || ""}
                  onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                />
              </div>
              {selectedUser?.user_type === "professionnel" && (
                <div>
                  <Label>Estado de suscripción</Label>
                  <Select
                    value={editData.subscription_status}
                    onValueChange={(value) => setEditData({ ...editData, subscription_status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="actif">Activo</SelectItem>
                      <SelectItem value="en_attente">Pendiente</SelectItem>
                      <SelectItem value="suspendu">Suspendido</SelectItem>
                      <SelectItem value="annule">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => updateUserMutation.mutate({ userId: selectedUser.id, data: editData })}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

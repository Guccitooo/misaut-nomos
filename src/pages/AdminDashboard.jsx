import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProfile, setSelectedProfile] = useState(null);

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
    queryFn: () => base44.entities.Review.list(),
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

  const activateProfileMutation = useMutation({
    mutationFn: async (profileId) => {
      await base44.entities.ProfessionalProfile.update(profileId, {
        estado_perfil: "activo",
        visible_en_busqueda: true,
        onboarding_completed: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProfiles'] });
      toast.success("✅ Perfil activado completamente");
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

  // Merge profiles with user data
  const profilesWithUserData = profiles.map(profile => {
    const userData = users.find(u => u.id === profile.user_id);
    return {
      ...profile,
      user_email: userData?.email || "Sin email",
      user_name: userData?.full_name || "Sin nombre",
      subscription_status: userData?.subscription_status || "desconocido"
    };
  });

  const filteredProfiles = profilesWithUserData.filter(profile =>
    profile.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
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

        {/* Profiles Management */}
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
                          {!profile.onboarding_completed && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => activateProfileMutation.mutate(profile.id)}
                              disabled={activateProfileMutation.isPending}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Activar
                            </Button>
                          )}
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

            {filteredProfiles.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No se encontraron perfiles</p>
              </div>
            )}
          </CardContent>
        </Card>

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
      </div>
    </div>
  );
}
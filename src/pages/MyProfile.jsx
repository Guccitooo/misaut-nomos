
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Building2, Save, Plus, X, Upload, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MyProfilePage() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [success, setSuccess] = useState(false);

  // User data
  const [userData, setUserData] = useState({
    full_name: "",
    phone: "",
    city: "",
  });

  // Professional profile data
  const [profileData, setProfileData] = useState({
    business_name: "",
    description: "",
    categories: [],
    service_area: "",
    opening_hours: "",
    website: "",
    cif_nif: "",
    price_range: "€€",
    photos: [],
    social_links: {
      facebook: "",
      instagram: "",
      linkedin: ""
    }
  });

  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setUserData({
        full_name: currentUser.full_name || "",
        phone: currentUser.phone || "",
        city: currentUser.city || "",
      });
    } catch (error) {
      console.error("Error loading user:", error);
      base44.auth.redirectToLogin();
    }
  };

  const { data: profile } = useQuery({
    queryKey: ['myProfile', user?.id],
    queryFn: async () => {
      const profiles = await base44.entities.ProfessionalProfile.filter({
        user_id: user.id
      });
      if (profiles[0]) {
        setProfileData(profiles[0]);
      }
      return profiles[0];
    },
    enabled: !!user && user.user_type === "professionnel",
  });

  const updateUserMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      if (profile) {
        return base44.entities.ProfessionalProfile.update(profile.id, data);
      } else {
        return base44.entities.ProfessionalProfile.create({
          ...data,
          user_id: user.id
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      setIsEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
  });

  const handleSave = () => {
    updateUserMutation.mutate(userData);
    
    if (user.user_type === "professionnel") {
      updateProfileMutation.mutate(profileData);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProfileData({
        ...profileData,
        photos: [...(profileData.photos || []), file_url]
      });
    } catch (error) {
      console.error("Error uploading photo:", error);
    }
    setUploadingPhoto(false);
  };

  const removePhoto = (index) => {
    const newPhotos = [...profileData.photos];
    newPhotos.splice(index, 1);
    setProfileData({ ...profileData, photos: newPhotos });
  };

  const addCategory = () => {
    if (newCategory && !profileData.categories.includes(newCategory)) {
      setProfileData({
        ...profileData,
        categories: [...profileData.categories, newCategory]
      });
      setNewCategory("");
    }
  };

  const removeCategory = (category) => {
    setProfileData({
      ...profileData,
      categories: profileData.categories.filter(c => c !== category)
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mi Perfil</h1>
            <p className="text-gray-600">
              {user.user_type === "professionnel" ? "Gestiona tu perfil profesional" : "Gestiona tu información"}
            </p>
          </div>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700">
              Editar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSave}
                disabled={updateUserMutation.isPending || updateProfileMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Guardar
              </Button>
            </div>
          )}
        </div>

        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">
              ¡Perfil actualizado correctamente!
            </AlertDescription>
          </Alert>
        )}

        {/* User Info */}
        <Card className="mb-6 shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-700" />
              Información personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input value={user.email} disabled className="bg-gray-50" />
            </div>

            <div>
              <Label>Nombre completo</Label>
              <Input
                value={userData.full_name}
                onChange={(e) => setUserData({ ...userData, full_name: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Teléfono</Label>
                <Input
                  value={userData.phone}
                  onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                  disabled={!isEditing}
                  placeholder="+34 612 345 678"
                />
              </div>
              <div>
                <Label>Ciudad</Label>
                <Input
                  value={userData.city}
                  onChange={(e) => setUserData({ ...userData, city: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Madrid"
                />
              </div>
            </div>

            <div>
              <Label>Tipo de cuenta</Label>
              <Badge className="bg-blue-100 text-blue-900">
                {user.user_type === "professionnel" ? "Autónomo" : "Cliente"}
              </Badge>
            </div>

            {user.user_type === "professionnel" && user.subscription_status && (
              <div>
                <Label>Estado de suscripción</Label>
                <Badge 
                  className={
                    user.subscription_status === "actif" ? "bg-green-100 text-green-800" :
                    user.subscription_status === "en_attente" ? "bg-yellow-100 text-yellow-800" :
                    "bg-red-100 text-red-800"
                  }
                >
                  {user.subscription_status === "actif" ? "Activo" :
                   user.subscription_status === "en_attente" ? "Pendiente" :
                   user.subscription_status === "suspendu" ? "Suspendido" : "Cancelado"}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Professional Profile */}
        {user.user_type === "professionnel" && (
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-700" />
                Perfil profesional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Nombre comercial *</Label>
                <Input
                  value={profileData.business_name}
                  onChange={(e) => setProfileData({ ...profileData, business_name: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Mi Empresa"
                />
              </div>

              <div>
                <Label>Descripción de servicios</Label>
                <Textarea
                  value={profileData.description}
                  onChange={(e) => setProfileData({ ...profileData, description: e.target.value })}
                  disabled={!isEditing}
                  className="h-32"
                  placeholder="Describe tus servicios..."
                />
              </div>

              <div>
                <Label>Categorías de servicios</Label>
                {isEditing && (
                  <div className="flex gap-2 mb-3">
                    <Input
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Ej: Fontanería, Electricidad..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCategory();
                        }
                      }}
                    />
                    <Button type="button" onClick={addCategory} size="icon">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {profileData.categories?.map((cat, idx) => (
                    <Badge key={idx} className="bg-blue-100 text-blue-900">
                      {cat}
                      {isEditing && (
                        <button
                          onClick={() => removeCategory(cat)}
                          className="ml-2 hover:text-blue-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Zona de trabajo</Label>
                  <Input
                    value={profileData.service_area}
                    onChange={(e) => setProfileData({ ...profileData, service_area: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Madrid y alrededores"
                  />
                </div>
                <div>
                  <Label>Horario</Label>
                  <Input
                    value={profileData.opening_hours}
                    onChange={(e) => setProfileData({ ...profileData, opening_hours: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Lun-Vie 9h-18h"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Sitio web</Label>
                  <Input
                    value={profileData.website}
                    onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                    disabled={!isEditing}
                    placeholder="https://misitio.com"
                  />
                </div>
                <div>
                  <Label>CIF / NIF</Label>
                  <Input
                    value={profileData.cif_nif}
                    onChange={(e) => setProfileData({ ...profileData, cif_nif: e.target.value })}
                    disabled={!isEditing}
                    placeholder="A12345678"
                  />
                </div>
              </div>

              <div>
                <Label>Rango de precios</Label>
                <Select
                  value={profileData.price_range}
                  onValueChange={(value) => setProfileData({ ...profileData, price_range: value })}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="€">€ - Económico</SelectItem>
                    <SelectItem value="€€">€€ - Medio</SelectItem>
                    <SelectItem value="€€€">€€€ - Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div>
                <Label>Redes sociales</Label>
                <div className="space-y-3 mt-2">
                  <Input
                    value={profileData.social_links?.facebook || ""}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      social_links: { ...profileData.social_links, facebook: e.target.value }
                    })}
                    disabled={!isEditing}
                    placeholder="URL de Facebook"
                  />
                  <Input
                    value={profileData.social_links?.instagram || ""}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      social_links: { ...profileData.social_links, instagram: e.target.value }
                    })}
                    disabled={!isEditing}
                    placeholder="URL de Instagram"
                  />
                  <Input
                    value={profileData.social_links?.linkedin || ""}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      social_links: { ...profileData.social_links, linkedin: e.target.value }
                    })}
                    disabled={!isEditing}
                    placeholder="URL de LinkedIn"
                  />
                </div>
              </div>

              <Separator />

              <div>
                <Label className="mb-3 block">Fotos de trabajos realizados</Label>
                {isEditing && (
                  <div className="mb-4">
                    <label className="cursor-pointer">
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors">
                        {uploadingPhoto ? (
                          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-700" />
                        ) : (
                          <>
                            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm text-gray-600">Haz clic para añadir una foto</p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                        disabled={uploadingPhoto}
                      />
                    </label>
                  </div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {profileData.photos?.map((photo, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={photo}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-32 object-cover rounded-lg shadow-md"
                      />
                      {isEditing && (
                        <button
                          onClick={() => removePhoto(idx)}
                          className="absolute top-2 right-2 bg-blue-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

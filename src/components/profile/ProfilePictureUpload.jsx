import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, Camera } from "lucide-react";
import { toast } from "sonner";

export default function ProfilePictureUpload({ user, currentPicture, onUpdate, size = "lg" }) {
  const [uploading, setUploading] = useState(false);
  
  const sizes = {
    sm: { avatar: "w-16 h-16", icon: "w-4 h-4", text: "text-xs" },
    md: { avatar: "w-24 h-24", icon: "w-5 h-5", text: "text-sm" },
    lg: { avatar: "w-32 h-32", icon: "w-6 h-6", text: "text-base" },
  };
  
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validar tamaño (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede superar los 5MB");
      return;
    }
    
    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast.error("Solo se permiten archivos de imagen");
      return;
    }
    
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      await base44.auth.updateMe({ profile_picture: file_url });
      
      if (onUpdate) {
        onUpdate(file_url);
      }
      
      toast.success("✅ Foto de perfil actualizada");
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      toast.error("Error al subir la foto");
    } finally {
      setUploading(false);
    }
  };
  
  const getInitials = () => {
    if (user?.full_name) {
      return user.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "U";
  };
  
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative group">
        <Avatar className={`${sizes[size].avatar} border-4 border-white shadow-xl`}>
          {currentPicture ? (
            <AvatarImage src={currentPicture} alt="Foto de perfil" />
          ) : (
            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-800 text-white font-bold text-2xl">
              {getInitials()}
            </AvatarFallback>
          )}
        </Avatar>
        
        <label className="absolute bottom-0 right-0 cursor-pointer">
          <div className="w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-lg transition-all group-hover:scale-110">
            {uploading ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Camera className="w-5 h-5 text-white" />
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>
      
      <div className="text-center">
        <p className={`font-semibold text-gray-900 ${sizes[size].text}`}>
          {currentPicture ? 'Cambiar foto' : 'Añadir foto de perfil'}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Recomendado: rostro profesional o logo
        </p>
      </div>
    </div>
  );
}
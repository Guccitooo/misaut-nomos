import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ProfileCompleteness({ profile, user }) {
  const checklistItems = [
    {
      key: 'business_name',
      label: 'Nombre profesional',
      completed: !!profile?.business_name,
      required: true
    },
    {
      key: 'cif_nif',
      label: 'NIF/CIF',
      completed: !!profile?.cif_nif,
      required: true
    },
    {
      key: 'profile_picture',
      label: 'Foto de perfil',
      completed: !!user?.profile_picture,
      required: false
    },
    {
      key: 'descripcion_corta',
      label: 'Descripción del servicio',
      completed: !!profile?.descripcion_corta && profile.descripcion_corta.length >= 20,
      required: true
    },
    {
      key: 'photos',
      label: 'Galería de fotos',
      completed: profile?.photos && profile.photos.length > 0,
      required: false
    },
    {
      key: 'provincia',
      label: 'Zona de trabajo',
      completed: !!profile?.provincia,
      required: true
    },
    {
      key: 'telefono_contacto',
      label: 'Teléfono de contacto',
      completed: !!profile?.telefono_contacto && profile.telefono_contacto.length >= 9,
      required: true
    }
  ];

  const completedCount = checklistItems.filter(item => item.completed).length;
  const totalCount = checklistItems.length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  const isProfileComplete = checklistItems.filter(item => item.required).every(item => item.completed);

  return (
    <Card className={`border-2 ${isProfileComplete ? 'border-green-200 bg-gradient-to-br from-green-50 to-white' : 'border-orange-200 bg-gradient-to-br from-orange-50 to-white'}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Completitud del perfil</h3>
            <p className="text-sm text-gray-600">
              {isProfileComplete ? '¡Perfil completo!' : 'Completa tu perfil para atraer más clientes'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-blue-700">{percentage}%</p>
            <p className="text-xs text-gray-500">{completedCount}/{totalCount}</p>
          </div>
        </div>

        <Progress value={percentage} className="h-2 mb-4" />

        <div className="space-y-2 mb-4">
          {checklistItems.map((item) => (
            <div key={item.key} className="flex items-center gap-2">
              {item.completed ? (
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
              <span className={`text-sm flex-1 ${item.completed ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                {item.label}
                {item.required && !item.completed && <span className="text-red-500 ml-1">*</span>}
              </span>
            </div>
          ))}
        </div>

        {!isProfileComplete && (
          <Link to={createPageUrl("MyProfile")}>
            <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
              Completar perfil
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        )}

        {isProfileComplete && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-xs text-green-900 font-medium text-center">
              ✅ Tu perfil está completo y visible para clientes
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
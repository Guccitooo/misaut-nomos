import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle } from "lucide-react";
import { useLanguage } from "../ui/LanguageSwitcher";

export default function ProfileCompleteness({ profile, user }) {
  const { t } = useLanguage();
  
  const calculateCompleteness = () => {
    if (!profile) return { percentage: 0, items: [] };
    
    const checks = [
      { field: 'business_name', label: 'Nombre comercial', weight: 15 },
      { field: 'profile_picture', label: 'Foto de perfil', weight: 15, check: () => user?.profile_picture },
      { field: 'cif_nif', label: 'CIF/NIF', weight: 10 },
      { field: 'telefono_contacto', label: 'Teléfono de contacto', weight: 10 },
      { field: 'descripcion_corta', label: 'Descripción corta', weight: 15 },
      { field: 'categories', label: 'Categorías', weight: 10, check: () => profile.categories?.length > 0 },
      { field: 'photos', label: 'Galería de fotos', weight: 15, check: () => profile.photos?.length >= 1 },
      { field: 'provincia', label: 'Ubicación', weight: 5 },
      { field: 'formas_pago', label: 'Métodos de pago', weight: 5, check: () => profile.formas_pago?.length > 0 },
    ];
    
    const items = checks.map(check => ({
      ...check,
      completed: check.check 
        ? check.check() 
        : (profile[check.field] && 
           (typeof profile[check.field] === 'string' ? profile[check.field].trim() !== '' : true))
    }));

    const percentage = Math.round(items.filter(i => i.completed).reduce((sum, c) => sum + c.weight, 0));

    return { percentage, items };
  };

  const { percentage, items } = calculateCompleteness();

  if (percentage === 100) return null;

  return (
    <Card className="shadow-sm border-0 bg-white">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Completitud del perfil</h3>
          <div className="text-xl font-bold text-blue-700">{percentage}%</div>
        </div>

        <Progress value={percentage} className="h-2 mb-4" />

        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-2">
          {items.map((item) => (
            <div key={item.field} className="flex items-center gap-2">
              {item.completed ? (
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-gray-300 flex-shrink-0" />
              )}
              <span className={`text-xs ${item.completed ? 'text-gray-700' : 'text-gray-400'}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
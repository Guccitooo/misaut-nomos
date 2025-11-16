import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "../ui/LanguageSwitcher";

export default function ProfileCompleteness({ profile, user, onEdit }) {
  const { t } = useLanguage();
  
  const calculateCompleteness = () => {
    if (!profile) return { percentage: 0, missing: [], completed: [] };
    
    const checks = [
      { field: 'business_name', label: t('professionalName'), weight: 10 },
      { field: 'profile_picture', label: t('profilePicture'), weight: 15, check: () => user?.profile_picture },
      { field: 'cif_nif', label: t('cifNif'), weight: 10 },
      { field: 'telefono_contacto', label: t('telephoneContact'), weight: 10 },
      { field: 'descripcion_corta', label: t('shortDescription'), weight: 15 },
      { field: 'categories', label: t('categoryPlural'), weight: 10, check: () => profile.categories?.length > 0 },
      { field: 'photos', label: t('photoGallery'), weight: 15, check: () => profile.photos?.length >= 3 },
      { field: 'provincia', label: t('location'), weight: 10 },
      { field: 'formas_pago', label: t('paymentMethods'), weight: 5, check: () => profile.formas_pago?.length > 0 },
    ];
    
    let totalWeight = 0;
    const missing = [];
    const completed = [];
    
    checks.forEach(item => {
      const isComplete = item.check 
        ? item.check() 
        : (profile[item.field] && 
           (typeof profile[item.field] === 'string' ? profile[item.field].trim() !== '' : true));
      
      if (isComplete) {
        totalWeight += item.weight;
        completed.push(item.label);
      } else {
        missing.push(item.label);
      }
    });
    
    return { percentage: totalWeight, missing, completed };
  };
  
  const { percentage, missing, completed } = calculateCompleteness();
  
  if (percentage >= 100) return null;
  
  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50" role="region" aria-label={t('profileCompleteness')}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-900 mb-1">
              {t('profileCompleteness')}
            </h3>
            <p className="text-sm text-gray-600">
              {percentage < 50 && '🟡 ' + t('completeProfileForMore')}
              {percentage >= 50 && percentage < 80 && '🟢 ' + t('goodProgress')}
              {percentage >= 80 && '🎯 ' + t('almostPerfect')}
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-700" aria-label={`${percentage}% completo`}>
              {percentage}%
            </div>
          </div>
        </div>
        
        <Progress value={percentage} className="h-3 mb-4" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {completed.slice(0, 3).map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle className="w-4 h-4" aria-hidden="true" />
              <span>{item}</span>
            </div>
          ))}
          
          {missing.slice(0, 3).map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
              <Circle className="w-4 h-4" aria-hidden="true" />
              <span>{item}</span>
            </div>
          ))}
        </div>
        
        {missing.length > 0 && (
          <div className="bg-blue-100 border-l-4 border-blue-600 p-4 rounded-lg">
            <p className="text-sm font-semibold text-blue-900 mb-2">
              💡 {t('addTheseElements')}
            </p>
            <ul className="text-sm text-blue-800 space-y-1">
              {missing.map((item, idx) => (
                <li key={idx}>• {item}</li>
              ))}
            </ul>
            {onEdit && (
              <Button
                onClick={onEdit}
                size="sm"
                className="mt-3 bg-blue-600 hover:bg-blue-700"
              >
                {t('completeNow')}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
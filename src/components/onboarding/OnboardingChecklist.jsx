import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Circle, ChevronRight } from "lucide-react";

export default function OnboardingChecklist({ currentStep, formData }) {
  const steps = [
    {
      id: 1,
      title: "Identidad profesional",
      items: [
        { label: "Nombre profesional", check: formData.business_name?.length >= 2 },
        { label: "NIF/CIF", check: formData.cif_nif?.length === 9 },
        { label: "Email de contacto", check: formData.email_contacto?.includes('@') },
        { label: "Teléfono", check: formData.telefono_contacto?.replace(/\D/g, '').length >= 9 }
      ]
    },
    {
      id: 2,
      title: "Servicios y experiencia",
      items: [
        { label: "Categoría seleccionada", check: formData.categories?.length > 0 },
        { label: "Años de experiencia", check: formData.years_experience !== '' && parseInt(formData.years_experience) >= 0 },
        { label: "Descripción completa", check: formData.descripcion_corta?.length >= 20 }
      ]
    },
    {
      id: 3,
      title: "Ubicación y portfolio",
      items: [
        { label: "Provincia", check: !!formData.provincia },
        { label: "Ciudad", check: !!formData.ciudad },
        { label: "Formas de pago", check: formData.formas_pago?.length > 0 },
        { label: "Fotos de trabajos", check: formData.photos?.length > 0 },
        { label: "Consentimientos", check: formData.acepta_terminos && formData.acepta_politica_privacidad && formData.consiente_contacto_clientes }
      ]
    }
  ];

  const currentStepData = steps.find(s => s.id === currentStep);
  const completedItems = currentStepData?.items.filter(i => i.check).length || 0;
  const totalItems = currentStepData?.items.length || 0;

  return (
    <Card className="border-2 border-blue-100 bg-blue-50/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm text-gray-900">
            ✓ Progreso del paso actual
          </h3>
          <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
            {completedItems}/{totalItems}
          </span>
        </div>

        <div className="space-y-2">
          {currentStepData?.items.map((item, idx) => (
            <div 
              key={idx} 
              className={`flex items-center gap-2 text-sm transition-all ${
                item.check ? 'text-green-700' : 'text-gray-600'
              }`}
            >
              {item.check ? (
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
              <span className={item.check ? 'font-medium' : ''}>{item.label}</span>
            </div>
          ))}
        </div>

        {completedItems < totalItems && (
          <div className="mt-3 pt-3 border-t border-blue-200">
            <p className="text-xs text-blue-700">
              <ChevronRight className="w-3 h-3 inline mr-1" />
              Completa todos los campos para continuar
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageSquare, FileText, Calendar, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";

const tutorialSteps = [
  {
    icon: MessageSquare,
    title: "📨 Recibirás mensajes de clientes",
    description: "Los clientes interesados te escribirán directamente por el chat interno de la plataforma.",
    tip: "💡 Responde rápido para mejorar tu reputación"
  },
  {
    icon: FileText,
    title: "📋 Sistema de presupuestos integrado",
    description: "Los clientes pueden solicitar presupuestos formales. Tú respondes con detalles y el cliente acepta o rechaza.",
    tip: "💡 Presupuestos detallados = más confianza"
  },
  {
    icon: Calendar,
    title: "🗓️ Gestiona tus trabajos",
    description: "Cuando un cliente acepta, puedes gestionar el trabajo en tu dashboard, marcar progreso y finalizarlo.",
    tip: "💡 Marca trabajos completados para pedir reseñas"
  },
  {
    icon: TrendingUp,
    title: "⭐ Las reseñas mejoran tu visibilidad",
    description: "Anima a tus clientes satisfechos a dejar reseñas. Las buenas valoraciones te posicionan mejor en búsquedas.",
    tip: "💡 Más reseñas = más clientes nuevos"
  }
];

export default function OnboardingTutorial({ open, onClose }) {
  const [step, setStep] = useState(0);
  const currentStep = tutorialSteps[step];
  const Icon = currentStep.icon;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            ¿Cómo funciona MisAutónomos?
          </DialogTitle>
        </DialogHeader>

        <div className="py-6 text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <Icon className="w-9 h-9 text-white" />
          </div>

          <h3 className="text-lg font-bold text-gray-900">
            {currentStep.title}
          </h3>

          <p className="text-gray-600 leading-relaxed">
            {currentStep.description}
          </p>

          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-lg">
            <p className="text-sm text-amber-900 font-medium">
              {currentStep.tip}
            </p>
          </div>

          <div className="flex justify-center gap-2 pt-4">
            {tutorialSteps.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all ${
                  idx === step ? 'w-8 bg-blue-600' : 'w-2 bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          {step > 0 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="flex-1"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Anterior
            </Button>
          )}
          
          {step < tutorialSteps.length - 1 ? (
            <Button
              onClick={() => setStep(step + 1)}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Siguiente
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={onClose}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              ¡Entendido!
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, ArrowRight, ArrowLeft, Briefcase, Building2, Loader2 } from "lucide-react";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    userType: "",
    fullName: "",
    cifNif: "",
    email: "",
    password: "",
    phone: "",
    activity: "",
    address: "",
    paymentMethod: "",
  });

  const steps = [
    {
      question: "¿Eres autónomo o empresa?",
      field: "userType",
      type: "choice",
      options: [
        { value: "autonomo", label: "Autónomo", icon: Briefcase },
        { value: "empresa", label: "Empresa", icon: Building2 }
      ]
    },
    {
      question: formData.userType === "empresa" ? "Razón social" : "¿Cuál es tu nombre completo?",
      field: "fullName",
      type: "text",
      placeholder: formData.userType === "empresa" ? "Ej: Mi Empresa S.L." : "Ej: Juan Pérez García"
    },
    {
      question: "NIF / CIF",
      field: "cifNif",
      type: "text",
      placeholder: "Ej: 12345678A"
    },
    {
      question: "¿Cuál es tu correo electrónico?",
      field: "email",
      type: "email",
      placeholder: "tu@email.com"
    },
    {
      question: "Crea una contraseña segura",
      field: "password",
      type: "password",
      placeholder: "Mínimo 8 caracteres"
    },
    {
      question: "Teléfono de contacto",
      field: "phone",
      type: "tel",
      placeholder: "+34 612 345 678"
    },
    {
      question: "¿A qué te dedicas?",
      field: "activity",
      type: "textarea",
      placeholder: "Ej: Fontanería, electricidad, reformas integrales..."
    },
    {
      question: "Dirección fiscal",
      field: "address",
      type: "text",
      placeholder: "Calle, número, código postal, ciudad"
    },
    {
      question: "Método de pago preferido",
      field: "paymentMethod",
      type: "select",
      options: [
        { value: "stripe", label: "Tarjeta de crédito (Stripe)" },
        { value: "paypal", label: "PayPal" },
        { value: "transferencia", label: "Transferencia bancaria" }
      ]
    }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];

  const handleNext = () => {
    const currentField = currentStepData.field;
    const value = formData[currentField];

    if (!value || (typeof value === 'string' && value.trim() === '')) {
      alert("Por favor completa este campo para continuar");
      return;
    }

    if (currentField === "email" && !value.includes('@')) {
      alert("Por favor introduce un email válido");
      return;
    }

    if (currentField === "password" && value.length < 8) {
      alert("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsProcessing(true);

    try {
      // 1. Create user account (this would need to be done via backend functions in production)
      // For now, we'll simulate the account creation
      
      // 2. Get today's date for subscription
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      // 3. Create user with subscription data
      const userData = {
        email: formData.email,
        full_name: formData.fullName,
        user_type: "professionnel",
        phone: formData.phone,
        city: formData.address.split(',').slice(-1)[0].trim(),
        subscription_status: "actif",
        subscription_start_date: today.toISOString().split('T')[0],
        subscription_end_date: nextMonth.toISOString().split('T')[0],
        last_payment_date: today.toISOString().split('T')[0],
      };

      // Note: In a real implementation, you would need backend functions to:
      // 1. Create the auth user via base44.auth
      // 2. Set up payment with Stripe/PayPal
      // 3. Create the user record
      
      // For demo purposes, we'll show success and redirect to login
      // The admin would need to manually create the account
      
      // Send notification to admin
      await base44.integrations.Core.SendEmail({
        to: "admin@milautonomos.com", // Replace with actual admin email
        subject: "Nueva solicitud de suscripción - milautonomos",
        body: `Nueva solicitud de suscripción recibida:

Tipo: ${formData.userType === "autonomo" ? "Autónomo" : "Empresa"}
Nombre: ${formData.fullName}
NIF/CIF: ${formData.cifNif}
Email: ${formData.email}
Teléfono: ${formData.phone}
Actividad: ${formData.activity}
Dirección: ${formData.address}
Método de pago: ${formData.paymentMethod}

Por favor, procesa esta solicitud manualmente.`,
        from_name: "milautonomos"
      });

      // Show success message
      setCurrentStep(steps.length); // Go to success screen
    } catch (error) {
      console.error("Error creating subscription:", error);
      alert("Hubo un error al procesar tu solicitud. Por favor, contacta con soporte.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Success screen
  if (currentStep === steps.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full border-0 shadow-2xl">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              ¡Solicitud recibida correctamente!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Tu solicitud de suscripción está siendo procesada. Recibirás un email en las próximas 24 horas con los detalles para activar tu cuenta.
            </p>
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => navigate(createPageUrl("Search"))}
            >
              Volver a inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white text-sm font-medium">
              Paso {currentStep + 1} de {steps.length}
            </span>
            <span className="text-white text-sm font-medium">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-2 bg-blue-900" />
        </div>

        {/* Question Card */}
        <Card className="border-0 shadow-2xl">
          <CardContent className="p-8 md:p-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              {currentStepData.question}
            </h2>

            <div className="space-y-6">
              {currentStepData.type === "choice" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentStepData.options.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        onClick={() => {
                          setFormData({ ...formData, [currentStepData.field]: option.value });
                          setTimeout(() => handleNext(), 300);
                        }}
                        className={`p-6 border-2 rounded-xl transition-all hover:scale-105 ${
                          formData[currentStepData.field] === option.value
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                      >
                        <Icon className="w-12 h-12 mx-auto mb-3 text-blue-600" />
                        <p className="text-lg font-semibold text-gray-900">{option.label}</p>
                      </button>
                    );
                  })}
                </div>
              )}

              {currentStepData.type === "text" && (
                <Input
                  type="text"
                  value={formData[currentStepData.field]}
                  onChange={(e) => setFormData({ ...formData, [currentStepData.field]: e.target.value })}
                  placeholder={currentStepData.placeholder}
                  className="h-14 text-lg"
                  autoFocus
                />
              )}

              {currentStepData.type === "email" && (
                <Input
                  type="email"
                  value={formData[currentStepData.field]}
                  onChange={(e) => setFormData({ ...formData, [currentStepData.field]: e.target.value })}
                  placeholder={currentStepData.placeholder}
                  className="h-14 text-lg"
                  autoFocus
                />
              )}

              {currentStepData.type === "password" && (
                <Input
                  type="password"
                  value={formData[currentStepData.field]}
                  onChange={(e) => setFormData({ ...formData, [currentStepData.field]: e.target.value })}
                  placeholder={currentStepData.placeholder}
                  className="h-14 text-lg"
                  autoFocus
                />
              )}

              {currentStepData.type === "tel" && (
                <Input
                  type="tel"
                  value={formData[currentStepData.field]}
                  onChange={(e) => setFormData({ ...formData, [currentStepData.field]: e.target.value })}
                  placeholder={currentStepData.placeholder}
                  className="h-14 text-lg"
                  autoFocus
                />
              )}

              {currentStepData.type === "textarea" && (
                <Textarea
                  value={formData[currentStepData.field]}
                  onChange={(e) => setFormData({ ...formData, [currentStepData.field]: e.target.value })}
                  placeholder={currentStepData.placeholder}
                  className="h-32 text-lg"
                  autoFocus
                />
              )}

              {currentStepData.type === "select" && (
                <Select
                  value={formData[currentStepData.field]}
                  onValueChange={(value) => setFormData({ ...formData, [currentStepData.field]: value })}
                >
                  <SelectTrigger className="h-14 text-lg">
                    <SelectValue placeholder="Selecciona una opción" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentStepData.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-4 mt-8">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleBack}
                  className="flex-1"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Atrás
                </Button>
              )}
              <Button
                size="lg"
                onClick={handleNext}
                disabled={isProcessing}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : currentStep === steps.length - 1 ? (
                  <>
                    Finalizar
                    <CheckCircle className="w-5 h-5 ml-2" />
                  </>
                ) : (
                  <>
                    Continuar
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Help text */}
        <p className="text-center text-white text-sm mt-6 opacity-80">
          Tus datos están seguros y protegidos. Puedes cancelar en cualquier momento.
        </p>
      </div>
    </div>
  );
}
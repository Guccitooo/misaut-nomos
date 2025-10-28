import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, ArrowRight, ArrowLeft, Briefcase, Building2, Loader2, AlertCircle } from "lucide-react";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    userType: "",
    fullName: "",
    cifNif: "",
    email: "",
    password: "",
    phone: "",
    activity: "",
    activityOther: "",
    address: "",
    paymentMethod: "stripe",
  });

  // Check for success/cancel from Stripe redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');

    if (success === 'true') {
      setCurrentStep(steps.length); // Show success screen
    } else if (canceled === 'true') {
      setError('El pago fue cancelado. Puedes intentarlo nuevamente.');
    }
  }, []);

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
      type: "select",
      options: [
        { value: "Electricista", label: "Electricista" },
        { value: "Fontanero", label: "Fontanero" },
        { value: "Carpintero", label: "Carpintero" },
        { value: "Albañil / Reformas", label: "Albañil / Reformas" },
        { value: "Jardinero", label: "Jardinero" },
        { value: "Pintor", label: "Pintor" },
        { value: "Transportista", label: "Transportista" },
        { value: "Autónomo de limpieza", label: "Autónomo de limpieza" },
        { value: "Asesoría o gestoría", label: "Asesoría o gestoría" },
        { value: "Empresa multiservicios", label: "Empresa multiservicios" },
        { value: "Otro tipo de servicio profesional", label: "Otro tipo de servicio profesional" }
      ]
    },
    {
      question: "Dirección fiscal",
      field: "address",
      type: "text",
      placeholder: "Calle, número, código postal, ciudad"
    }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];

  const validateCurrentStep = () => {
    const currentField = currentStepData.field;
    const value = formData[currentField];

    if (!value || (typeof value === 'string' && value.trim() === '')) {
      if (currentField === "activity") {
        setError("Selecciona una de las actividades antes de continuar.");
      } else {
        setError("Por favor completa este campo para continuar");
      }
      return false;
    }

    if (currentField === "email" && !value.includes('@')) {
      setError("Por favor introduce un email válido");
      return false;
    }

    if (currentField === "password" && value.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return false;
    }

    if (currentField === "activity" && value === "Otro tipo de servicio profesional" && !formData.activityOther.trim()) {
      setError("Por favor especifica tu actividad profesional");
      return false;
    }

    return true;
  };

  const handleNext = () => {
    setError(null);

    if (!validateCurrentStep()) {
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    setError(null);
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateAllFields = () => {
    const requiredFields = {
      userType: "Tipo de usuario",
      fullName: "Nombre completo",
      cifNif: "NIF/CIF",
      email: "Correo electrónico",
      password: "Contraseña",
      phone: "Teléfono",
      activity: "Actividad profesional",
      address: "Dirección fiscal",
    };

    for (const [field, label] of Object.entries(requiredFields)) {
      if (!formData[field] || formData[field].trim() === '') {
        return { valid: false, message: `Falta completar: ${label}` };
      }
    }

    if (formData.activity === "Otro tipo de servicio profesional" && !formData.activityOther.trim()) {
      return { valid: false, message: "Falta especificar tu actividad profesional" };
    }

    return { valid: true };
  };

  const handleSubmit = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // 1. Validate all fields
      const validation = validateAllFields();
      if (!validation.valid) {
        setError(`Por favor, completa todos los datos antes de continuar con el pago. ${validation.message}`);
        setIsProcessing(false);
        return;
      }

      // 2. Create Stripe checkout session
      try {
        const response = await base44.functions.invoke('createCheckoutSession', {
          email: formData.email,
          fullName: formData.fullName,
          userType: formData.userType,
          cifNif: formData.cifNif,
          phone: formData.phone,
          activity: formData.activity,
          activityOther: formData.activityOther,
          address: formData.address,
          paymentMethod: formData.paymentMethod,
        });

        if (response.data.error) {
          throw new Error(response.data.error);
        }

        // 3. Redirect to Stripe Checkout
        if (response.data.url) {
          window.location.href = response.data.url;
        } else {
          throw new Error('No checkout URL received');
        }
      } catch (stripeError) {
        console.error("Error creating checkout session:", stripeError);
        setError("Ha habido un problema temporal al conectar con el sistema de pago. Por favor, inténtalo de nuevo en unos segundos.");
        setIsProcessing(false);
        return;
      }

    } catch (error) {
      console.error("Error creating subscription:", error);
      setError("Ha habido un problema temporal al procesar tu solicitud. Por favor, inténtalo de nuevo en unos segundos.");
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
              ✅ Tu suscripción ha sido activada correctamente
            </h1>
            <p className="text-lg text-gray-600 mb-2">
              Redirigiéndote a tu panel profesional...
            </p>
            <p className="text-lg text-gray-600 mb-8">
              Recibirás un correo de confirmación en {formData.email}
            </p>
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-700">
                <strong>Próximos pasos:</strong>
              </p>
              <ul className="text-sm text-gray-600 mt-2 text-left space-y-1">
                <li>✓ Revisa tu correo para confirmar tu cuenta</li>
                <li>✓ Completa tu perfil profesional</li>
                <li>✓ Añade fotos de tus trabajos</li>
                <li>✓ ¡Comienza a recibir clientes!</li>
              </ul>
            </div>
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                // Try to login with the email
                base44.auth.redirectToLogin(createPageUrl("MyProfile"));
              }}
            >
              Ir a mi panel
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

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

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
                          setError(null);
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
                  onChange={(e) => {
                    setFormData({ ...formData, [currentStepData.field]: e.target.value });
                    setError(null);
                  }}
                  placeholder={currentStepData.placeholder}
                  className="h-14 text-lg"
                  autoFocus
                />
              )}

              {currentStepData.type === "email" && (
                <Input
                  type="email"
                  value={formData[currentStepData.field]}
                  onChange={(e) => {
                    setFormData({ ...formData, [currentStepData.field]: e.target.value });
                    setError(null);
                  }}
                  placeholder={currentStepData.placeholder}
                  className="h-14 text-lg"
                  autoFocus
                />
              )}

              {currentStepData.type === "password" && (
                <Input
                  type="password"
                  value={formData[currentStepData.field]}
                  onChange={(e) => {
                    setFormData({ ...formData, [currentStepData.field]: e.target.value });
                    setError(null);
                  }}
                  placeholder={currentStepData.placeholder}
                  className="h-14 text-lg"
                  autoFocus
                />
              )}

              {currentStepData.type === "tel" && (
                <Input
                  type="tel"
                  value={formData[currentStepData.field]}
                  onChange={(e) => {
                    setFormData({ ...formData, [currentStepData.field]: e.target.value });
                    setError(null);
                  }}
                  placeholder={currentStepData.placeholder}
                  className="h-14 text-lg"
                  autoFocus
                />
              )}

              {currentStepData.type === "select" && (
                <>
                  <Select
                    value={formData[currentStepData.field]}
                    onValueChange={(value) => {
                      setFormData({ ...formData, [currentStepData.field]: value });
                      setError(null);
                    }}
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

                  {/* Show additional field if "Otro tipo de servicio profesional" is selected */}
                  {currentStepData.field === "activity" && formData.activity === "Otro tipo de servicio profesional" && (
                    <div className="mt-4">
                      <Label className="text-gray-700 mb-2 block">
                        Especifica brevemente tu actividad
                      </Label>
                      <Input
                        type="text"
                        value={formData.activityOther}
                        onChange={(e) => {
                          setFormData({ ...formData, activityOther: e.target.value.slice(0, 50) });
                          setError(null);
                        }}
                        placeholder="Máx. 50 caracteres"
                        maxLength={50}
                        className="h-14 text-lg"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        {formData.activityOther.length}/50 caracteres
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Payment info for last step */}
            {currentStep === steps.length - 1 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Plan seleccionado:</strong> Profesional mensual
                </p>
                <p className="text-2xl font-bold text-blue-900 mb-2">29€/mes</p>
                <p className="text-xs text-gray-600">
                  Serás redirigido a Stripe para completar el pago de forma segura.
                </p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4 mt-8">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleBack}
                  className="flex-1"
                  disabled={isProcessing}
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
                    Continuar al pago
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
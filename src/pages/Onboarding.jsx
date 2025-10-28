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
      setError("Por favor completa este campo para continuar");
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

  const handleFieldChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setError(null); // Clear error when user types
  };

  const handleSubmit = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Validate all fields before proceeding
      const requiredFields = ['userType', 'fullName', 'cifNif', 'email', 'password', 'phone', 'activity', 'address'];
      const missingFields = requiredFields.filter(field => !formData[field] || formData[field].trim() === '');

      if (missingFields.length > 0) {
        setError("Por favor, completa todos los campos antes de continuar");
        setIsProcessing(false);
        return;
      }

      if (formData.activity === "Otro tipo de servicio profesional" && !formData.activityOther.trim()) {
        setError("Por favor especifica tu actividad profesional");
        setIsProcessing(false);
        return;
      }

      // Create Stripe checkout session
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

      // Redirect to Stripe Checkout
      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error('No se pudo crear la sesión de pago');
      }

    } catch (error) {
      console.error("Error:", error);
      setError("Ha habido un problema temporal. Por favor, inténtalo de nuevo en unos segundos.");
      setIsProcessing(false);
    }
  };

  // Success screen
  if (currentStep === steps.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full border-0 shadow-2xl">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              ✅ ¡Pago completado con éxito!
            </h1>
            <p className="text-lg text-gray-600 mb-2">
              Tu suscripción ha sido activada correctamente.
            </p>
            <p className="text-lg text-gray-600 mb-8">
              Recibirás un correo de confirmación en {formData.email}
            </p>
            <div className="bg-blue-50 p-6 rounded-xl mb-6 text-left">
              <p className="text-sm font-semibold text-gray-900 mb-3">
                ✨ Próximos pasos:
              </p>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Revisa tu correo para confirmar tu cuenta</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Completa tu perfil profesional</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Añade fotos de tus trabajos</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>¡Comienza a recibir clientes!</span>
                </li>
              </ul>
            </div>
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 px-8"
              onClick={() => {
                base44.auth.redirectToLogin(createPageUrl("MyProfile"));
              }}
            >
              Ir a mi panel
              <ArrowRight className="w-5 h-5 ml-2" />
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
          <div className="flex justify-between items-center mb-3">
            <span className="text-white text-sm font-medium">
              Paso {currentStep + 1} de {steps.length}
            </span>
            <span className="text-white text-sm font-medium">
              {Math.round(progress)}% completado
            </span>
          </div>
          <Progress value={progress} className="h-3 bg-blue-900 rounded-full" />
        </div>

        {/* Question Card */}
        <Card className="border-0 shadow-2xl rounded-2xl overflow-hidden">
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
                    const isSelected = formData[currentStepData.field] === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => {
                          handleFieldChange(currentStepData.field, option.value);
                        }}
                        className={`p-8 border-2 rounded-2xl transition-all duration-300 ${
                          isSelected
                            ? "border-blue-600 bg-blue-50 shadow-lg scale-105"
                            : "border-gray-200 hover:border-blue-300 hover:shadow-md"
                        }`}
                      >
                        <Icon className={`w-16 h-16 mx-auto mb-4 transition-colors ${
                          isSelected ? "text-blue-600" : "text-gray-400"
                        }`} />
                        <p className={`text-lg font-semibold transition-colors ${
                          isSelected ? "text-blue-900" : "text-gray-700"
                        }`}>{option.label}</p>
                      </button>
                    );
                  })}
                </div>
              )}

              {currentStepData.type === "text" && (
                <div>
                  <Input
                    type="text"
                    value={formData[currentStepData.field]}
                    onChange={(e) => handleFieldChange(currentStepData.field, e.target.value)}
                    placeholder={currentStepData.placeholder}
                    className="h-14 text-lg border-2 rounded-xl focus:border-blue-600"
                    autoFocus
                  />
                </div>
              )}

              {currentStepData.type === "email" && (
                <div>
                  <Input
                    type="email"
                    value={formData[currentStepData.field]}
                    onChange={(e) => handleFieldChange(currentStepData.field, e.target.value)}
                    placeholder={currentStepData.placeholder}
                    className="h-14 text-lg border-2 rounded-xl focus:border-blue-600"
                    autoFocus
                  />
                </div>
              )}

              {currentStepData.type === "password" && (
                <div>
                  <Input
                    type="password"
                    value={formData[currentStepData.field]}
                    onChange={(e) => handleFieldChange(currentStepData.field, e.target.value)}
                    placeholder={currentStepData.placeholder}
                    className="h-14 text-lg border-2 rounded-xl focus:border-blue-600"
                    autoFocus
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Usa letras, números y símbolos para mayor seguridad
                  </p>
                </div>
              )}

              {currentStepData.type === "tel" && (
                <div>
                  <Input
                    type="tel"
                    value={formData[currentStepData.field]}
                    onChange={(e) => handleFieldChange(currentStepData.field, e.target.value)}
                    placeholder={currentStepData.placeholder}
                    className="h-14 text-lg border-2 rounded-xl focus:border-blue-600"
                    autoFocus
                  />
                </div>
              )}

              {currentStepData.type === "select" && (
                <>
                  <Select
                    value={formData[currentStepData.field]}
                    onValueChange={(value) => handleFieldChange(currentStepData.field, value)}
                  >
                    <SelectTrigger className="h-14 text-lg border-2 rounded-xl focus:border-blue-600">
                      <SelectValue placeholder="Selecciona una opción" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentStepData.options.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="text-lg py-3">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Show additional field if "Otro tipo de servicio profesional" is selected */}
                  {currentStepData.field === "activity" && formData.activity === "Otro tipo de servicio profesional" && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                      <Label className="text-gray-900 mb-2 block font-medium">
                        Especifica tu actividad
                      </Label>
                      <Input
                        type="text"
                        value={formData.activityOther}
                        onChange={(e) => handleFieldChange('activityOther', e.target.value.slice(0, 50))}
                        placeholder="Ej: Diseñador gráfico, Consultor IT..."
                        maxLength={50}
                        className="h-12 text-base border-2 rounded-xl"
                      />
                      <p className="text-sm text-gray-600 mt-2">
                        {formData.activityOther.length}/50 caracteres
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Payment info for last step */}
            {currentStep === steps.length - 1 && (
              <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-700">
                    Plan seleccionado:
                  </p>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    Más Popular
                  </Badge>
                </div>
                <p className="text-3xl font-bold text-blue-900 mb-2">29€/mes</p>
                <p className="text-sm text-gray-600 mb-4">
                  Acceso completo a la plataforma profesional
                </p>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>Aparece en todas las búsquedas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>Perfil profesional completo con fotos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>Mensajes ilimitados con clientes</span>
                  </li>
                </ul>
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <p className="text-xs text-gray-600">
                    🔒 Pago seguro procesado por Stripe
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4 mt-8">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleBack}
                  className="flex-1 h-14 border-2 rounded-xl hover:bg-gray-50"
                  disabled={isProcessing}
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Atrás
                </Button>
              )}
              <Button
                size="lg"
                onClick={handleNext}
                disabled={isProcessing || !formData[currentStepData.field]}
                className={`h-14 rounded-xl font-semibold text-base shadow-lg transition-all ${
                  currentStep > 0 ? 'flex-1' : 'w-full'
                } ${
                  !formData[currentStepData.field] 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : currentStep === steps.length - 1 ? (
                  <>
                    Continuar al pago
                    <ArrowRight className="w-5 h-5 ml-2" />
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
        <p className="text-center text-white text-sm mt-6 opacity-90">
          🔒 Tus datos están seguros y protegidos • Puedes cancelar en cualquier momento
        </p>
      </div>
    </div>
  );
}
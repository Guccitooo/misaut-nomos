import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Loader2, AlertCircle, Search } from "lucide-react";
import { toast } from "sonner";

export default function ClientOnboardingPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    ciudad: "",
    servicios_buscados: [],
    acepta_terminos: false,
  });

  const serviciosDisponibles = [
    "Electricista",
    "Fontanero",
    "Carpintero",
    "Albañil / Reformas",
    "Jardinero",
    "Pintor",
    "Transportista",
    "Autónomo de limpieza",
    "Asesoría o gestoría",
    "Empresa multiservicios"
  ];

  useEffect(() => {
    loadUser();
  }, []);

  // ✅ Procesar datos guardados cuando vuelva con sesión
  useEffect(() => {
    if (user) {
      const savedFormData = localStorage.getItem('client_onboarding_pending');
      if (savedFormData) {
        try {
          const parsedData = JSON.parse(savedFormData);
          console.log('📋 Datos guardados encontrados, procesando...');
          
          setFormData(parsedData);
          localStorage.removeItem('client_onboarding_pending');
          
          // Procesar el registro
          completeOnboardingMutation.mutate(parsedData);
          
          toast.info('Completando tu registro...', { duration: 2000 });
        } catch (error) {
          console.error('Error procesando datos guardados:', error);
          localStorage.removeItem('client_onboarding_pending');
        }
      }
    }
  }, [user]);

  const loadUser = async () => {
    setIsLoadingUser(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      if (currentUser) {
        setFormData(prev => ({
          ...prev,
          nombre: currentUser.full_name || prev.nombre,
          email: currentUser.email || prev.email,
          telefono: currentUser.phone || prev.telefono,
          ciudad: currentUser.city || prev.ciudad,
        }));

        // Si ya es cliente → ir a búsqueda
        if (currentUser.user_type === "client") {
          navigate(createPageUrl("Search"));
          return;
        }

        // Si es autónomo → mensaje de advertencia
        if (currentUser.user_type === "professionnel") {
          setError("Ya tienes una cuenta profesional activa. No puedes crear una cuenta de cliente.");
          setTimeout(() => {
            navigate(createPageUrl("MyProfile"));
          }, 3000);
        }
      }
    } catch (error) {
      console.error("Error loading user:", error);
      setUser(null);
    } finally {
      setIsLoadingUser(false);
    }
  };

  const completeOnboardingMutation = useMutation({
    mutationFn: async (data) => {
      // 1. Actualizar usuario como cliente
      await base44.auth.updateMe({
        user_type: "client",
        full_name: data.nombre,
        phone: data.telefono,
        city: data.ciudad
      });

      // 2. Enviar email de bienvenida
      await base44.integrations.Core.SendEmail({
        to: data.email,
        subject: "¡Bienvenido a MilAutónomos!",
        body: `Hola ${data.nombre},

¡Bienvenido a MilAutónomos!

Tu cuenta de cliente ha sido creada correctamente.

Ahora puedes:
✅ Buscar profesionales por categoría y ubicación
✅ Ver perfiles completos con fotos y valoraciones
✅ Contactar directamente con autónomos verificados
✅ Chatear con ellos para coordinar trabajos
✅ Dejar valoraciones después de contratar

Todo esto de forma 100% GRATUITA.

Servicios que buscas:
${data.servicios_buscados.join(', ')}

Empieza a buscar profesionales ahora: ${window.location.origin}/search

Gracias por unirte,
Equipo MilAutónomos`,
        from_name: "MilAutónomos"
      });

      return data;
    },
    onSuccess: () => {
      toast.success("✅ ¡Bienvenido a MilAutónomos! Tu cuenta está lista.");
      localStorage.removeItem('client_onboarding_pending');
      setTimeout(() => {
        navigate(createPageUrl("Search"));
      }, 1000);
    },
    onError: (error) => {
      console.error("Error completing onboarding:", error);
      setError("Error al completar el registro: " + error.message);
      toast.error("Error al completar el registro");
      localStorage.removeItem('client_onboarding_pending');
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // ✅ VALIDACIÓN: Términos obligatorios
    if (!formData.acepta_terminos) {
      setError("❌ Debes aceptar los Términos y Condiciones para continuar.");
      toast.error("Debes aceptar los Términos y Condiciones");
      document.querySelector('[type="checkbox"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Validaciones básicas
    if (!formData.nombre || formData.nombre.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres");
      return;
    }

    if (!formData.email || !formData.email.includes('@')) {
      setError("Email inválido");
      return;
    }

    if (!formData.telefono || formData.telefono.replace(/\s/g, '').length < 9) {
      setError("El teléfono debe tener al menos 9 dígitos");
      return;
    }

    if (!formData.ciudad || formData.ciudad.trim().length < 2) {
      setError("Indica tu ciudad");
      return;
    }

    if (formData.servicios_buscados.length === 0) {
      setError("Selecciona al menos un tipo de servicio que buscas");
      return;
    }

    // ✅ CAMBIO: Si no tiene sesión, guardar datos y redirigir a crear cuenta
    if (!user) {
      console.log('💾 Guardando datos y redirigiendo a crear cuenta...');
      
      // Guardar datos en localStorage
      localStorage.setItem('client_onboarding_pending', JSON.stringify(formData));
      
      // Mostrar mensaje
      toast.success('Datos guardados. Redirigiendo a crear tu cuenta...', { duration: 3000 });
      
      // Redirigir a Base44 para crear cuenta (Base44 enviará el email de verificación)
      setTimeout(() => {
        base44.auth.redirectToLogin(window.location.href);
      }, 1000);
      
      return;
    }

    // ✅ Si tiene sesión, procesar directamente
    completeOnboardingMutation.mutate(formData);
  };

  const toggleServicio = (servicio) => {
    const servicios = formData.servicios_buscados;
    if (servicios.includes(servicio)) {
      setFormData({
        ...formData,
        servicios_buscados: servicios.filter(s => s !== servicio)
      });
    } else {
      setFormData({
        ...formData,
        servicios_buscados: [...servicios, servicio]
      });
    }
  };

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
        <p className="ml-3 text-gray-600">Cargando...</p>
      </div>
    );
  }

  // Si es autónomo, mostrar mensaje
  if (user?.user_type === "professionnel") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Ya tienes una cuenta profesional
            </h2>
            <p className="text-gray-600 mb-6">
              Tu cuenta ya está configurada como autónomo. No puedes crear una cuenta de cliente simultáneamente.
            </p>
            <p className="text-sm text-gray-500">
              Redirigiendo a tu perfil...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Search className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Crea tu cuenta de cliente
          </h1>
          <p className="text-lg text-gray-600">
            Completa estos datos para empezar a buscar profesionales
          </p>
          <p className="text-sm text-green-700 font-semibold mt-2">
            ✅ 100% GRATIS - Sin costes ocultos
          </p>
          {!user && (
            <p className="text-sm text-blue-600 mt-2">
              📝 Al enviar, crearemos tu cuenta y recibirás un email de verificación
            </p>
          )}
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="border-0 shadow-lg">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nombre */}
              <div>
                <Label>Nombre completo *</Label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Juan Pérez"
                  maxLength={100}
                  className="h-12 mt-2"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="tu@email.com"
                  className="h-12 mt-2"
                  required
                  disabled={!!user}
                />
                {user && (
                  <p className="text-xs text-gray-500 mt-1">
                    Email de tu cuenta (no se puede cambiar aquí)
                  </p>
                )}
                {!user && (
                  <p className="text-xs text-gray-500 mt-1">
                    Recibirás un email de verificación en esta dirección
                  </p>
                )}
              </div>

              {/* Teléfono */}
              <div>
                <Label>Teléfono *</Label>
                <Input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value.replace(/[^\d+]/g, '') })}
                  placeholder="612345678"
                  maxLength={15}
                  className="h-12 mt-2"
                  required
                />
              </div>

              {/* Ciudad */}
              <div>
                <Label>Ciudad *</Label>
                <Input
                  value={formData.ciudad}
                  onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                  placeholder="Ej: Madrid, Barcelona, Valencia..."
                  className="h-12 mt-2"
                  required
                />
              </div>

              {/* Servicios buscados */}
              <div>
                <Label>¿Qué tipo de servicios buscas? * (selecciona al menos uno)</Label>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {serviciosDisponibles.map((servicio) => (
                    <div
                      key={servicio}
                      onClick={() => toggleServicio(servicio)}
                      className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.servicios_buscados.includes(servicio)
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <p className="text-sm font-medium">{servicio}</p>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {formData.servicios_buscados.length} seleccionado(s)
                </p>
              </div>

              {/* ✅ Términos y condiciones - OBLIGATORIO */}
              <div className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all ${
                !formData.acepta_terminos && error?.includes('Términos')
                  ? 'bg-red-50 border-red-300'
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <Checkbox
                  checked={formData.acepta_terminos}
                  onCheckedChange={(checked) => {
                    setFormData({ ...formData, acepta_terminos: checked });
                    if (checked && error?.includes('Términos')) {
                      setError(null);
                    }
                  }}
                  required
                  className="mt-1"
                />
                <label 
                  className="text-sm cursor-pointer flex-1" 
                  onClick={() => {
                    setFormData({ ...formData, acepta_terminos: !formData.acepta_terminos });
                    if (!formData.acepta_terminos && error?.includes('Términos')) {
                      setError(null);
                    }
                  }}
                >
                  <strong className="text-gray-900">
                    ✅ Acepto los Términos y Condiciones *
                  </strong>
                  <p className="text-gray-600 mt-1">
                    He leído y acepto los términos y condiciones de uso, la política de privacidad y el tratamiento de mis datos personales.
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Este campo es obligatorio para poder crear tu cuenta
                  </p>
                </label>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
                disabled={completeOnboardingMutation.isPending}
              >
                {completeOnboardingMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creando tu cuenta...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    {!user ? 'Crear mi cuenta de cliente' : 'Completar registro'}
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-gray-500">
                {!user 
                  ? '📧 Recibirás un email de verificación de Base44 para confirmar tu cuenta'
                  : 'Al completar el registro podrás buscar y contactar con profesionales de forma gratuita'
                }
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Benefits */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-semibold">100% Gratis</p>
              <p className="text-xs text-gray-600">Sin costes ocultos</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-semibold">Profesionales verificados</p>
              <p className="text-xs text-gray-600">Con valoraciones reales</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-semibold">Chat directo</p>
              <p className="text-xs text-gray-600">Contacto inmediato</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
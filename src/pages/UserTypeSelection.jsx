
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Search, CheckCircle } from "lucide-react";

export default function UserTypeSelectionPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      // Si ya tiene tipo de usuario definido, redirigir según estado
      if (currentUser.user_type) {
        if (currentUser.user_type === "professionnel") {
          // ✅ Si es profesional, verificar si completó onboarding
          const profiles = await base44.entities.ProfessionalProfile.filter({
            user_id: currentUser.id
          });
          
          if (profiles[0]?.onboarding_completed && profiles[0]?.visible_en_busqueda) {
            // Ya completó todo → ir al perfil
            navigate(createPageUrl("MyProfile"));
          } else {
            // No ha completado → FORZAR quiz
            navigate(createPageUrl("ProfileOnboarding"));
          }
        } else {
          // Cliente → ir a buscar
          navigate(createPageUrl("Search"));
        }
      }
    } catch (error) {
      console.error("Error loading user:", error);
      base44.auth.redirectToLogin();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectType = async (userType) => {
    setIsLoading(true);
    try {
      // Actualizar tipo de usuario
      await base44.auth.updateMe({
        user_type: userType
      });

      // ✅ CAMBIO CRÍTICO: Redirigir según el tipo
      if (userType === "professionnel") {
        // ✅ Autónomo → ir DIRECTAMENTE al quiz (sin pasar por planes)
        navigate(createPageUrl("ProfileOnboarding"));
      } else {
        // Cliente → ir directamente a buscar
        navigate(createPageUrl("Search"));
      }
    } catch (error) {
      console.error("Error setting user type:", error);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            ¡Bienvenido a MilAutónomos!
          </h1>
          <p className="text-xl text-gray-600">
            ¿Cómo quieres usar la plataforma?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Opción Autónomo */}
          <Card 
            className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-blue-600 cursor-pointer group"
            onClick={() => handleSelectType("professionnel")}
          >
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-8">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Briefcase className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Soy Autónomo</h2>
              <p className="text-blue-100">
                Quiero ofrecer mis servicios profesionales
              </p>
            </div>
            <CardContent className="p-8">
              <p className="text-gray-600 mb-6">
                Crea tu perfil profesional y empieza a recibir solicitudes de clientes potenciales.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Aparece en las búsquedas de clientes</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Crea tu perfil con fotos de trabajos</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Chat directo con clientes interesados</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Recibe valoraciones de clientes</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 font-semibold">🎁 7 días de prueba GRATIS</span>
                </li>
              </ul>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectType("professionnel");
                }}
              >
                Continuar como Autónomo
              </Button>
            </CardContent>
          </Card>

          {/* Opción Cliente */}
          <Card 
            className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-orange-600 cursor-pointer group"
            onClick={() => handleSelectType("client")}
          >
            <div className="bg-gradient-to-br from-orange-500 to-orange-700 text-white p-8">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Search className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Busco un Profesional</h2>
              <p className="text-orange-100">
                Necesito contratar servicios de autónomos
              </p>
            </div>
            <CardContent className="p-8">
              <p className="text-gray-600 mb-6">
                Encuentra y contacta con profesionales cualificados para tus proyectos.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Busca profesionales por categoría</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Filtra por ubicación y precio</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Lee opiniones de otros clientes</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Contacta directamente por chat</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 font-semibold">100% GRATIS para siempre</span>
                </li>
              </ul>
              <Button 
                className="w-full bg-orange-600 hover:bg-orange-700 h-12 text-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectType("client");
                }}
              >
                Continuar como Cliente
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8 text-gray-500 text-sm">
          ¿No estás seguro? No te preocupes, puedes cambiar tu tipo de cuenta más tarde.
        </div>
      </div>
    </div>
  );
}

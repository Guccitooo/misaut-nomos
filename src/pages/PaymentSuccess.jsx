import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Loader2, CheckCircle, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkPaymentAndRedirect();
  }, []);

  const checkPaymentAndRedirect = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const currentUser = await base44.auth.me();
      setUser(currentUser);

      if (!currentUser) {
        navigate(createPageUrl("Search"));
        return;
      }

      const profiles = await base44.entities.ProfessionalProfile.filter({
        user_id: currentUser.id
      });

      if (profiles.length === 0 || !profiles[0].onboarding_completed) {
        navigate(createPageUrl("ProfileOnboarding"));
      } else {
        navigate(createPageUrl("MyProfile"));
      }
    } catch (error) {
      console.error("Error verificando pago:", error);
      navigate(createPageUrl("ProfileOnboarding"));
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-xl border-0">
        <CardContent className="p-8 text-center">
          {checking ? (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                ¡Pago confirmado!
              </h1>
              <p className="text-gray-600 mb-6">
                Estamos configurando tu cuenta profesional...
              </p>
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-10 h-10 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                ¡Ya casi está!
              </h1>
              <p className="text-gray-600 mb-6">
                Completa tu perfil profesional para empezar a recibir clientes.
              </p>
              <Button
                onClick={() => navigate(createPageUrl("ProfileOnboarding"))}
                className="bg-blue-600 hover:bg-blue-700 w-full"
              >
                Completar perfil
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
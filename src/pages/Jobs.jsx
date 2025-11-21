import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Construction } from "lucide-react";

export default function JobsPage() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="text-center max-w-md">
        <Construction className="w-20 h-20 text-blue-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Trabajos</h1>
        <p className="text-gray-600 mb-6">Funcionalidad en desarrollo</p>
        <Button onClick={() => navigate(createPageUrl("ProfessionalDashboard"))}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al Dashboard
        </Button>
      </div>
    </div>
  );
}
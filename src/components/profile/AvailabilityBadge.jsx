import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

/**
 * ✅ COMPONENTE DE DISPONIBILIDAD DINÁMICA
 * Calcula automáticamente si el profesional está disponible HOY
 * según su configuración de días y horarios
 */
export default function AvailabilityBadge({ profile }) {
  const [availability, setAvailability] = useState(null);

  useEffect(() => {
    // Actualizar disponibilidad cada minuto
    const updateAvailability = () => {
      const status = calculateAvailability(profile);
      setAvailability(status);
    };

    updateAvailability();
    const interval = setInterval(updateAvailability, 60000); // Cada 60 segundos

    return () => clearInterval(interval);
  }, [profile]);

  const calculateAvailability = (profile) => {
    if (!profile) return null;

    // Obtener día y hora local del cliente
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=domingo, 1=lunes, ..., 6=sábado
    const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"

    // Mapeo de días
    const dayNames = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const todayName = dayNames[dayOfWeek];

    // Verificar disponibilidad según tipo
    const disponibilidad = profile.disponibilidad_tipo || 'laborables';
    
    let isWorkingDay = false;

    if (disponibilidad === 'laborables') {
      // Lunes a Viernes (1-5)
      isWorkingDay = dayOfWeek >= 1 && dayOfWeek <= 5;
    } else if (disponibilidad === 'festivos') {
      // Sábado y Domingo (0, 6)
      isWorkingDay = dayOfWeek === 0 || dayOfWeek === 6;
    } else if (disponibilidad === 'ambos') {
      // Cualquier día
      isWorkingDay = true;
    }

    // Si hoy no es día laboral
    if (!isWorkingDay) {
      if (disponibilidad === 'laborables') {
        return {
          status: 'unavailable',
          label: 'No disponible hoy',
          sublabel: 'Solo días laborables',
          color: 'bg-gray-100 text-gray-700 border-gray-300',
          icon: '⏸️'
        };
      } else if (disponibilidad === 'festivos') {
        return {
          status: 'weekend_only',
          label: 'Solo fines de semana',
          sublabel: 'Disponible sábados y domingos',
          color: 'bg-orange-100 text-orange-700 border-orange-300',
          icon: '🎉'
        };
      }
    }

    // Verificar si está dentro del horario
    const horarioInicio = profile.horario_apertura || '09:00';
    const horarioCierre = profile.horario_cierre || '18:00';

    if (currentTime >= horarioInicio && currentTime <= horarioCierre) {
      return {
        status: 'available',
        label: 'Disponible ahora',
        sublabel: `Hasta las ${horarioCierre}`,
        color: 'bg-green-100 text-green-700 border-green-300',
        icon: '🟢'
      };
    } else if (currentTime < horarioInicio) {
      return {
        status: 'available_later',
        label: 'Disponible hoy',
        sublabel: `A partir de las ${horarioInicio}`,
        color: 'bg-blue-100 text-blue-700 border-blue-300',
        icon: '🕒'
      };
    } else {
      return {
        status: 'closed_today',
        label: 'Cerrado ahora',
        sublabel: `Abre mañana a las ${horarioInicio}`,
        color: 'bg-gray-100 text-gray-600 border-gray-300',
        icon: '🌙'
      };
    }
  };

  if (!availability) return null;

  return (
    <Badge 
      variant="outline" 
      className={`${availability.color} border-2 px-3 py-1.5 font-medium flex items-center gap-2`}
    >
      <span className="text-base">{availability.icon}</span>
      <div className="flex flex-col items-start">
        <span className="text-sm font-semibold">{availability.label}</span>
        {availability.sublabel && (
          <span className="text-xs opacity-80">{availability.sublabel}</span>
        )}
      </div>
    </Badge>
  );
}
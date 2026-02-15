import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, CheckCircle } from "lucide-react";

const DAYS = [
  { id: "lunes", label: "Lunes", short: "L" },
  { id: "martes", label: "Martes", short: "M" },
  { id: "miercoles", label: "Miércoles", short: "X" },
  { id: "jueves", label: "Jueves", short: "J" },
  { id: "viernes", label: "Viernes", short: "V" },
  { id: "sabado", label: "Sábado", short: "S" },
  { id: "domingo", label: "Domingo", short: "D" }
];

const AVAILABILITY_TYPES = [
  { value: "laborables", label: "Días laborables (L-V)", icon: "📅" },
  { value: "festivos", label: "Fines de semana y festivos", icon: "🎉" },
  { value: "ambos", label: "Todos los días", icon: "🗓️" }
];

export default function AvailabilityCalendar({ 
  disponibilidadTipo = "laborables",
  horarioApertura = "09:00",
  horarioCierre = "18:00",
  horariorDias = [],
  isEditing,
  onChange
}) {
  const handleDayToggle = (dayId) => {
    if (!isEditing) return;
    
    const currentDays = horariorDias || [];
    let newDays;
    
    if (currentDays.includes(dayId)) {
      newDays = currentDays.filter(d => d !== dayId);
    } else {
      newDays = [...currentDays, dayId];
    }
    
    onChange({ horario_dias: newDays });
  };

  const handleTypeChange = (type) => {
    if (!isEditing) return;
    onChange({ disponibilidad_tipo: type });
  };

  const getActiveDays = () => {
    if (disponibilidadTipo === "laborables") {
      return ["lunes", "martes", "miercoles", "jueves", "viernes"];
    } else if (disponibilidadTipo === "festivos") {
      return ["sabado", "domingo"];
    } else if (disponibilidadTipo === "ambos") {
      return DAYS.map(d => d.id);
    }
    return horariorDias || [];
  };

  const activeDays = getActiveDays();

  return (
    <Card className="shadow-sm border-0 bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-700" />
          Disponibilidad y horarios
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Indica tu disponibilidad para que los clientes sepan cuándo pueden contactarte
        </p>

        {/* Tipo de disponibilidad */}
        <div>
          <Label className="mb-3 block">Tipo de disponibilidad</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {AVAILABILITY_TYPES.map((type) => (
              <div
                key={type.value}
                onClick={() => handleTypeChange(type.value)}
                className={`flex items-center gap-3 p-3 border-2 rounded-lg transition-all ${
                  isEditing ? 'cursor-pointer' : ''
                } ${
                  disponibilidadTipo === type.value
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <span className="text-2xl">{type.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{type.label}</p>
                </div>
                {disponibilidadTipo === type.value && (
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Selector de días (visual) */}
        <div>
          <Label className="mb-3 block">Días de trabajo</Label>
          <div className="grid grid-cols-7 gap-2">
            {DAYS.map((day) => {
              const isActive = activeDays.includes(day.id);
              return (
                <div
                  key={day.id}
                  className={`aspect-square flex flex-col items-center justify-center rounded-lg border-2 transition-all ${
                    isActive
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 bg-gray-50 text-gray-400"
                  }`}
                >
                  <span className="text-xs font-bold mb-1">{day.short}</span>
                  <span className="text-[10px]">{day.label.slice(0, 3)}</span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {disponibilidadTipo === "laborables" && "Trabajas de lunes a viernes"}
            {disponibilidadTipo === "festivos" && "Trabajas sábados y domingos"}
            {disponibilidadTipo === "ambos" && "Trabajas todos los días de la semana"}
          </p>
        </div>

        {/* Horarios */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Hora de apertura
            </Label>
            <Input
              type="time"
              value={horarioApertura}
              onChange={(e) => onChange({ horario_apertura: e.target.value })}
              disabled={!isEditing}
              className="mt-2"
            />
          </div>
          <div>
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Hora de cierre
            </Label>
            <Input
              type="time"
              value={horarioCierre}
              onChange={(e) => onChange({ horario_cierre: e.target.value })}
              disabled={!isEditing}
              className="mt-2"
            />
          </div>
        </div>

        {/* Resumen visual */}
        {!isEditing && (
          <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  Disponible {disponibilidadTipo === "ambos" ? "todos los días" : 
                             disponibilidadTipo === "laborables" ? "de lunes a viernes" :
                             "fines de semana y festivos"}
                </p>
                <p className="text-xs text-blue-800">
                  Horario: {horarioApertura} - {horarioCierre}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
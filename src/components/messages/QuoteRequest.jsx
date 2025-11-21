import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle, XCircle, Clock, Euro, Calendar, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function QuoteRequest({ quote, isProfessional, isClient, onRespond, onStatusChange }) {
  const [responding, setResponding] = useState(false);
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");
  const [estimatedDays, setEstimatedDays] = useState("");
  const [breakdown, setBreakdown] = useState([{ concept: "", amount: "" }]);

  const statusConfig = {
    pending: { icon: Clock, color: "bg-yellow-100 text-yellow-800", label: "Pendiente" },
    accepted: { icon: CheckCircle, color: "bg-green-100 text-green-800", label: "Aceptado" },
    rejected: { icon: XCircle, color: "bg-red-100 text-red-800", label: "Rechazado" },
    completed: { icon: CheckCircle, color: "bg-blue-100 text-blue-800", label: "Completado" }
  };

  const status = statusConfig[quote.status || "pending"];
  const StatusIcon = status.icon;

  const handleRespond = (action) => {
    if (action === "accept") {
      onRespond({ status: "accepted", quote_amount: parseFloat(quoteAmount), quote_notes: quoteNotes });
    } else {
      onRespond({ status: "rejected" });
    }
    setResponding(false);
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-base">Solicitud de presupuesto</CardTitle>
          </div>
          <Badge className={status.color}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">Descripción</p>
          <p className="text-sm text-gray-600">{quote.description}</p>
        </div>

        {quote.budget && (
          <div className="flex items-center gap-2 text-sm">
            <Euro className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">Presupuesto estimado:</span>
            <span className="font-semibold text-gray-900">{quote.budget}€</span>
          </div>
        )}

        {quote.deadline && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">Fecha límite:</span>
            <span className="font-semibold text-gray-900">{format(new Date(quote.deadline), 'dd/MM/yyyy')}</span>
          </div>
        )}

        {quote.quote_amount && quote.status !== "pending" && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-900 mb-1">Presupuesto profesional: {quote.quote_amount}€</p>
            {quote.quote_notes && (
              <p className="text-sm text-blue-700">{quote.quote_notes}</p>
            )}
          </div>
        )}

        {isProfessional && quote.status === "pending" && !responding && (
          <Button 
            onClick={() => setResponding(true)}
            className="w-full"
          >
            Responder presupuesto
          </Button>
        )}

        {isProfessional && responding && (
          <div className="space-y-3 pt-3 border-t">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Precio (€)
              </label>
              <Input
                type="number"
                placeholder="Ej: 150"
                value={quoteAmount}
                onChange={(e) => setQuoteAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Notas adicionales
              </label>
              <Textarea
                placeholder="Incluye materiales, tiempo estimado..."
                value={quoteNotes}
                onChange={(e) => setQuoteNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => handleRespond("accept")}
                className="flex-1"
                disabled={!quoteAmount}
              >
                Enviar presupuesto
              </Button>
              <Button 
                onClick={() => setResponding(false)}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
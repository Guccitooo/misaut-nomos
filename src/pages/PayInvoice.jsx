import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, FileText, Calendar, Euro, Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import SEOHead from "../components/seo/SEOHead";

export default function PayInvoicePage() {
  const urlParams = new URLSearchParams(window.location.search);
  const invoiceId = urlParams.get("invoice");
  const success = urlParams.get("success");
  const canceled = urlParams.get("canceled");
  const [processing, setProcessing] = useState(false);

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['publicInvoice', invoiceId],
    queryFn: async () => {
      const invoices = await base44.entities.Invoice.filter({ id: invoiceId });
      return invoices[0] || null;
    },
    enabled: !!invoiceId,
  });

  useEffect(() => {
    if (success) {
      toast.success("¡Pago completado con éxito!");
    }
    if (canceled) {
      toast.error("Pago cancelado");
    }
  }, [success, canceled]);

  const handlePayNow = async () => {
    setProcessing(true);
    try {
      const response = await base44.functions.invoke('createInvoicePayment', {
        invoiceId: invoiceId,
        publicAccess: true
      });

      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      toast.error("Error al procesar el pago");
      setProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Factura no encontrada</h2>
          <p className="text-gray-600">La factura que buscas no existe o ha sido eliminada.</p>
        </Card>
      </div>
    );
  }

  if (invoice.status === 'paid') {
    return (
      <>
        <SEOHead 
          title="Factura Pagada - MisAutónomos"
          description="Confirmación de pago de factura"
          noindex={true}
        />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="max-w-md w-full p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Factura ya pagada</h2>
            <p className="text-gray-600 mb-4">Esta factura ya ha sido pagada.</p>
            <div className="bg-gray-50 p-4 rounded-lg text-left">
              <p className="text-sm text-gray-600">Fecha de pago:</p>
              <p className="font-semibold">{new Date(invoice.payment_date).toLocaleDateString('es-ES')}</p>
            </div>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead 
        title={`Pagar Factura ${invoice.invoice_number} - MisAutónomos`}
        description="Paga tu factura de forma segura online"
        noindex={true}
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <Card className="mb-6">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-blue-600" />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Factura {invoice.invoice_number}</h1>
                    <p className="text-gray-600">{invoice.client_name}</p>
                  </div>
                </div>
                <Badge className={
                  invoice.status === 'overdue' ? 'bg-red-500' :
                  invoice.status === 'sent' ? 'bg-amber-500' :
                  'bg-blue-500'
                }>
                  {invoice.status === 'overdue' ? 'Vencida' :
                   invoice.status === 'sent' ? 'Pendiente' :
                   invoice.status === 'draft' ? 'Borrador' : invoice.status}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Fecha de emisión</label>
                  <p className="font-semibold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {new Date(invoice.issue_date).toLocaleDateString('es-ES')}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Fecha de vencimiento</label>
                  <p className="font-semibold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {new Date(invoice.due_date).toLocaleDateString('es-ES')}
                  </p>
                </div>
              </div>

              {invoice.items && invoice.items.length > 0 && (
                <div className="mb-8">
                  <h3 className="font-semibold text-gray-900 mb-4">Detalle</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Descripción</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Cantidad</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Precio</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {invoice.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-3 text-sm">{item.description}</td>
                            <td className="px-4 py-3 text-sm text-right">{item.quantity}</td>
                            <td className="px-4 py-3 text-sm text-right">{item.unit_price}€</td>
                            <td className="px-4 py-3 text-sm text-right font-semibold">{item.total}€</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="border-t pt-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">{invoice.subtotal}€</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">IVA ({invoice.iva_percentage}%)</span>
                  <span className="font-semibold">{invoice.iva_amount}€</span>
                </div>
                <div className="flex justify-between text-lg pt-4 border-t">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-blue-600 text-2xl">{invoice.total}€</span>
                </div>
              </div>

              {invoice.notes && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 font-semibold mb-1">Notas:</p>
                  <p className="text-sm text-gray-700">{invoice.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="p-6 md:p-8 text-center">
              <CreditCard className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Pago seguro online</h2>
              <p className="text-gray-600 mb-6">
                Paga con tarjeta de crédito o débito de forma segura a través de Stripe
              </p>
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-6"
                onClick={handlePayNow}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Euro className="w-5 h-5 mr-2" />
                    Pagar {invoice.total}€ ahora
                  </>
                )}
              </Button>
              <p className="text-xs text-gray-500 mt-4">
                🔒 Conexión segura y cifrada
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
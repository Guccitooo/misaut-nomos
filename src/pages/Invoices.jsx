import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, ArrowLeft, Loader2, Settings, FileText, Copy, ExternalLink } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InvoiceForm from "../components/invoicing/InvoiceForm";
import InvoicePreview from "../components/invoicing/InvoicePreview";
import InvoicesList from "../components/invoicing/InvoicesList";
import InvoicingSettingsForm from "../components/invoicing/InvoicingSettingsForm";
import { useLanguage } from "../components/ui/LanguageSwitcher";

export default function InvoicesPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [loadingActions, setLoadingActions] = useState({});
  const [paymentLinkDialog, setPaymentLinkDialog] = useState(null);
  const [confirmPaidDialog, setConfirmPaidDialog] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (!currentUser || currentUser.user_type !== 'professionnel') {
        navigate(createPageUrl("Search"));
        return;
      }
      setUser(currentUser);
    } catch (error) {
      navigate(createPageUrl("Search"));
    } finally {
      setLoading(false);
    }
  };

  const { data: invoicingSettings, isLoading: loadingSettings } = useQuery({
    queryKey: ['invoicingSettings', user?.id],
    queryFn: async () => {
      const settings = await base44.entities.InvoicingSettings.filter({ professional_id: user.id });
      return settings[0] || null;
    },
    enabled: !!user,
  });

  const { data: invoices = [], isLoading: loadingInvoices } = useQuery({
    queryKey: ['invoices', user?.id],
    queryFn: () => base44.entities.Invoice.filter({ professional_id: user.id }),
    enabled: !!user,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clientContacts', user?.id],
    queryFn: () => base44.entities.ClientContact.filter({ professional_id: user.id }),
    enabled: !!user,
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (data) => {
      if (invoicingSettings) {
        return await base44.entities.InvoicingSettings.update(invoicingSettings.id, data);
      } else {
        return await base44.entities.InvoicingSettings.create({
          ...data,
          professional_id: user.id
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['invoicingSettings']);
      toast.success(t('settingsSaved') || 'Configuración guardada');
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (data) => {
      const nextNum = (invoicingSettings?.ultimo_numero_factura || 0) + 1;
      const invoice_number = `${data.serie}-${new Date().getFullYear()}-${String(nextNum).padStart(3, '0')}`;
      
      const invoiceData = {
        ...data,
        professional_id: user.id,
        invoice_number,
        numero: nextNum
      };

      const created = await base44.entities.Invoice.create(invoiceData);
      
      // Actualizar último número
      if (invoicingSettings) {
        await base44.entities.InvoicingSettings.update(invoicingSettings.id, {
          ultimo_numero_factura: nextNum
        });
      }
      
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['invoices']);
      queryClient.invalidateQueries(['invoicingSettings']);
      setShowDialog(false);
      setEditingInvoice(null);
      toast.success(t('invoiceCreated') || 'Factura creada');
    },
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Invoice.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['invoices']);
      setShowDialog(false);
      setEditingInvoice(null);
      toast.success(t('invoiceUpdated') || 'Factura actualizada');
    },
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: (id) => base44.entities.Invoice.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['invoices']);
      toast.success(t('invoiceDeleted') || 'Factura eliminada');
    },
  });

  const changeStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Invoice.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['invoices']);
      toast.success(t('statusUpdated') || 'Estado actualizado');
    },
  });

  const handleSaveInvoice = (data) => {
    if (editingInvoice) {
      updateInvoiceMutation.mutate({ id: editingInvoice.id, data });
    } else {
      createInvoiceMutation.mutate(data);
    }
  };

  const handlePreview = (data) => {
    setPreviewData(data);
    setShowPreview(true);
  };

  const handleDownloadPDF = async (invoice) => {
    try {
      const response = await base44.functions.invoke('generateInvoicePDF', { invoiceId: invoice.id });
      
      if (response.data.error) {
        toast.error(response.data.error);
        return;
      }

      const link = document.createElement('a');
      link.href = response.data.pdf_url;
      link.download = `${invoice.invoice_number}.pdf`;
      link.click();
      
      toast.success(t('pdfDownloaded') || 'PDF descargado');
    } catch (error) {
      toast.error(t('errorGeneratingPDF') || 'Error al generar PDF');
    }
  };

  // Enviar factura por email al cliente
  const handleSendEmail = async (invoice) => {
    if (!invoice.client_email) {
      toast.error('Esta factura no tiene email de cliente');
      return;
    }
    
    setLoadingActions(prev => ({ ...prev, [`email_${invoice.id}`]: true }));
    
    try {
      const response = await base44.functions.invoke('sendInvoiceEmail', { 
        invoiceId: invoice.id 
      });
      
      if (response.data.error) {
        toast.error(response.data.error);
      } else {
        toast.success(`📧 Factura enviada a ${invoice.client_email}`);
        queryClient.invalidateQueries(['invoices']);
      }
    } catch (error) {
      toast.error('Error al enviar la factura');
    } finally {
      setLoadingActions(prev => ({ ...prev, [`email_${invoice.id}`]: false }));
    }
  };

  // Crear link de pago Stripe
  const handleCreatePaymentLink = async (invoice) => {
    // Si ya tiene link, mostrar diálogo para copiar/abrir
    if (invoice.payment_link) {
      setPaymentLinkDialog(invoice);
      return;
    }
    
    setLoadingActions(prev => ({ ...prev, [`stripe_${invoice.id}`]: true }));
    
    try {
      const response = await base44.functions.invoke('createInvoicePayment', { 
        invoiceId: invoice.id 
      });
      
      if (response.data.error) {
        toast.error(response.data.error);
      } else {
        toast.success('💳 Link de pago creado');
        queryClient.invalidateQueries(['invoices']);
        // Mostrar diálogo con el link
        setPaymentLinkDialog({ ...invoice, payment_link: response.data.url });
      }
    } catch (error) {
      toast.error('Error al crear link de pago');
    } finally {
      setLoadingActions(prev => ({ ...prev, [`stripe_${invoice.id}`]: false }));
    }
  };

  // Marcar factura como pagada
  const handleMarkAsPaid = (invoice) => {
    setConfirmPaidDialog(invoice);
  };

  const confirmMarkAsPaid = async () => {
    if (!confirmPaidDialog) return;
    
    try {
      await base44.entities.Invoice.update(confirmPaidDialog.id, {
        status: 'paid',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'manual'
      });
      toast.success('✅ Factura marcada como pagada');
      queryClient.invalidateQueries(['invoices']);
    } catch (error) {
      toast.error('Error al actualizar la factura');
    } finally {
      setConfirmPaidDialog(null);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Link copiado al portapapeles');
  };

  if (loading || loadingSettings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(createPageUrl("ProfessionalDashboard"))}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('back')}
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('invoices') || 'Facturas'}</h1>
              <p className="text-gray-600 mt-1">{invoices.length} {t('invoicesTotal') || 'facturas totales'}</p>
            </div>
          </div>
          <Button onClick={() => { setEditingInvoice(null); setShowDialog(true); }} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            {t('newInvoice') || 'Nueva factura'}
          </Button>
        </div>

        <Tabs defaultValue="invoices" className="space-y-6">
          <TabsList className="bg-white shadow-sm">
            <TabsTrigger value="invoices">
              <FileText className="w-4 h-4 mr-2" />
              {t('invoices') || 'Facturas'}
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              {t('invoicingData') || 'Datos de facturación'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invoices">
            <InvoicesList
              invoices={invoices}
              onView={(inv) => { setEditingInvoice(inv); setShowDialog(true); }}
              onDownload={handleDownloadPDF}
              onDelete={(id) => deleteInvoiceMutation.mutate(id)}
              onStatusChange={(id, status) => changeStatusMutation.mutate({ id, status })}
              onSendEmail={handleSendEmail}
              onCreatePaymentLink={handleCreatePaymentLink}
              onMarkAsPaid={handleMarkAsPaid}
              loadingActions={loadingActions}
            />
          </TabsContent>

          <TabsContent value="settings">
            <InvoicingSettingsForm
              settings={invoicingSettings}
              onSave={(data) => saveSettingsMutation.mutate(data)}
            />
          </TabsContent>
        </Tabs>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingInvoice ? t('editInvoice') : t('newInvoice')}</DialogTitle>
            </DialogHeader>
            <InvoiceForm
              invoice={editingInvoice}
              settings={invoicingSettings}
              clients={clients}
              onSave={handleSaveInvoice}
              onCancel={() => { setShowDialog(false); setEditingInvoice(null); }}
              onPreview={handlePreview}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('invoicePreview') || 'Vista previa de factura'}</DialogTitle>
            </DialogHeader>
            <InvoicePreview invoiceData={previewData} />
          </DialogContent>
        </Dialog>

        {/* Diálogo link de pago */}
        <Dialog open={!!paymentLinkDialog} onOpenChange={() => setPaymentLinkDialog(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="text-2xl">💳</span> Link de pago Stripe
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-purple-800 mb-2">
                  <strong>Factura:</strong> {paymentLinkDialog?.invoice_number}
                </p>
                <p className="text-sm text-purple-800">
                  <strong>Importe:</strong> {paymentLinkDialog?.total?.toFixed(2)}€
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-2">Link de pago:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={paymentLinkDialog?.payment_link || ''}
                    readOnly
                    className="flex-1 text-xs bg-white border rounded px-2 py-1.5"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(paymentLinkDialog?.payment_link)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => window.open(paymentLinkDialog?.payment_link, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Abrir link
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    copyToClipboard(paymentLinkDialog?.payment_link);
                    setPaymentLinkDialog(null);
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar y cerrar
                </Button>
              </div>
              
              <p className="text-xs text-gray-500 text-center">
                Comparte este link con tu cliente para que pague con tarjeta.
              </p>
            </div>
          </DialogContent>
        </Dialog>

        {/* Confirmar marcar como pagada */}
        <AlertDialog open={!!confirmPaidDialog} onOpenChange={() => setConfirmPaidDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Marcar factura como pagada?</AlertDialogTitle>
              <AlertDialogDescription>
                Vas a marcar la factura <strong>{confirmPaidDialog?.invoice_number}</strong> como pagada manualmente.
                <br /><br />
                <strong>Importe:</strong> {confirmPaidDialog?.total?.toFixed(2)}€
                <br />
                <strong>Cliente:</strong> {confirmPaidDialog?.client_name}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmMarkAsPaid} className="bg-green-600 hover:bg-green-700">
                Sí, marcar como pagada
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
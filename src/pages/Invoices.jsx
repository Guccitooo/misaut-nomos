import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, ArrowLeft, Loader2, Settings, FileText } from "lucide-react";
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
      </div>
    </div>
  );
}
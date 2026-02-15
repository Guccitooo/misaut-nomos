import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileText, Clock, CheckCircle, XCircle, Send, Euro, Plus, Trash2, RefreshCw, AlertTriangle, Users, FolderKanban, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import SEOHead from "../components/seo/SEOHead";

export default function PresupuestosPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  
  const [quoteData, setQuoteData] = useState({
    client_id: "",
    title: "",
    description: "",
    items: [{ concept: "", quantity: 1, unit_price: 0, total: 0 }],
    subtotal: 0,
    iva: 21,
    total: 0,
    estimated_days: 7,
    validity_days: 30,
    payment_conditions: "",
    notes: ""
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      base44.auth.redirectToLogin();
    } finally {
      setLoadingUser(false);
    }
  };

  const isProfessional = user?.user_type === "professionnel";

  const { data: myClients = [] } = useQuery({
    queryKey: ['clientContacts', user?.id],
    queryFn: () => base44.entities.ClientContact.filter({ professional_id: user.id }),
    enabled: !!user && isProfessional,
  });

  const { data: sentQuotes = [], isLoading: loadingSent } = useQuery({
    queryKey: ['quotes', 'sent', user?.id],
    queryFn: () => base44.entities.Quote.filter({ professional_id: user.id }, '-created_date'),
    enabled: !!user && isProfessional,
  });

  const { data: receivedQuotes = [], isLoading: loadingReceived } = useQuery({
    queryKey: ['quotes', 'received', user?.id],
    queryFn: () => base44.entities.Quote.filter({ client_id: user.id }, '-created_date'),
    enabled: !!user && !isProfessional,
  });

  const calculateTotals = (items, ivaPercent) => {
    const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
    const total = subtotal * (1 + ivaPercent / 100);
    return { subtotal, total };
  };

  const updateItem = (index, field, value) => {
    const newItems = [...quoteData.items];
    newItems[index][field] = value;
    
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price;
    }
    
    const { subtotal, total } = calculateTotals(newItems, quoteData.iva);
    setQuoteData({ ...quoteData, items: newItems, subtotal, total });
  };

  const addItem = () => {
    setQuoteData({
      ...quoteData,
      items: [...quoteData.items, { concept: "", quantity: 1, unit_price: 0, total: 0 }]
    });
  };

  const removeItem = (index) => {
    const newItems = quoteData.items.filter((_, i) => i !== index);
    const { subtotal, total } = calculateTotals(newItems, quoteData.iva);
    setQuoteData({ ...quoteData, items: newItems, subtotal, total });
  };

  const createQuoteMutation = useMutation({
    mutationFn: async (data) => {
      const selectedClient = myClients.find(c => c.id === data.client_id);
      return await base44.entities.Quote.create({
        ...data,
        professional_id: user.id,
        professional_name: user.full_name || user.email.split('@')[0],
        client_name: selectedClient?.client_name || "Cliente",
        client_email: selectedClient?.client_email || "",
        status: "borrador"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      setShowCreateDialog(false);
      resetForm();
      toast.success("Presupuesto creado");
    },
  });

  const sendQuoteMutation = useMutation({
    mutationFn: async (quoteId) => {
      const quote = sentQuotes.find(q => q.id === quoteId);
      
      await base44.entities.Quote.update(quoteId, {
        status: "enviado",
        sent_date: new Date().toISOString()
      });

      await base44.entities.Notification.create({
        user_id: quote.client_id,
        type: "new_message",
        title: "Nuevo presupuesto recibido",
        message: `${quote.professional_name} te ha enviado un presupuesto: ${quote.title}`,
        link: createPageUrl("Presupuestos")
      });

      base44.integrations.Core.SendEmail({
        to: quote.client_email,
        subject: `📄 Nuevo presupuesto de ${quote.professional_name} - MisAutónomos`,
        body: `
<!DOCTYPE html>
<html>
<head><style>body{font-family:Arial;background:#f8fafc}.container{max-width:600px;margin:0 auto;background:#fff;border-radius:16px}.header{background:linear-gradient(135deg,#10b981,#34d399);padding:30px;text-align:center;color:#fff}.content{padding:30px}.quote-box{background:#d1fae5;border-left:4px solid #10b981;padding:20px;margin:20px 0;border-radius:8px}.button{display:inline-block;background:#10b981;color:#fff;padding:14px 30px;text-decoration:none;border-radius:8px;font-weight:bold}</style></head>
<body>
<div class="container">
  <div class="header"><h1>📄 Nuevo Presupuesto</h1></div>
  <div class="content">
    <p>Hola,</p>
    <div class="quote-box">
      <p><strong>De:</strong> ${quote.professional_name}</p>
      <p><strong>Presupuesto:</strong> ${quote.title}</p>
      <p><strong>Total:</strong> ${quote.total.toFixed(2)}€</p>
      <p><strong>Plazo:</strong> ${quote.estimated_days} días</p>
    </div>
    <p style="text-align:center;margin:30px 0">
      <a href="https://misautonomos.es/Presupuestos" class="button">Ver presupuesto completo →</a>
    </p>
  </div>
</div>
</body>
</html>`,
        from_name: "MisAutónomos"
      }).catch(() => {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success("Presupuesto enviado al cliente");
    }
  });

  const acceptQuoteMutation = useMutation({
    mutationFn: async (quoteId) => {
      const quote = receivedQuotes.find(q => q.id === quoteId);
      
      await base44.entities.Quote.update(quoteId, {
        status: "aceptado",
        accepted_date: new Date().toISOString()
      });

      await base44.entities.Notification.create({
        user_id: quote.professional_id,
        type: "new_message",
        title: "¡Presupuesto aceptado!",
        message: `${quote.client_name} ha aceptado tu presupuesto: ${quote.title}`,
        link: createPageUrl("Presupuestos")
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      setShowAcceptDialog(false);
      setSelectedQuote(null);
      toast.success("Presupuesto aceptado");
    }
  });

  const rejectQuoteMutation = useMutation({
    mutationFn: async ({ quoteId, reason }) => {
      const quote = receivedQuotes.find(q => q.id === quoteId);
      
      await base44.entities.Quote.update(quoteId, {
        status: "rechazado",
        rejection_reason: reason,
        rejection_date: new Date().toISOString()
      });

      await base44.entities.Notification.create({
        user_id: quote.professional_id,
        type: "new_message",
        title: "Presupuesto rechazado",
        message: `${quote.client_name} ha rechazado tu presupuesto: ${quote.title}`,
        link: createPageUrl("Presupuestos")
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      setShowRejectDialog(false);
      setSelectedQuote(null);
      setRejectionReason("");
      toast.success("Presupuesto rechazado");
    }
  });

  const convertToProjectMutation = useMutation({
    mutationFn: async (quote) => {
      const project = await base44.entities.Project.create({
        professional_id: user.id,
        client_contact_id: quote.client_id,
        client_name: quote.client_name,
        name: quote.title,
        description: quote.description,
        status: 'planning',
        priority: 'medium',
        budget: quote.total,
        total_hours_estimated: quote.estimated_days * 8,
        progress_percentage: 0,
        color: '#3B82F6'
      });

      toast.success("Proyecto creado desde presupuesto");
      navigate(createPageUrl("ProjectDetail") + `?id=${project.id}`);
    },
    onSuccess: () => {
      setShowConvertDialog(false);
      setSelectedQuote(null);
    }
  });

  const remakeQuoteMutation = useMutation({
    mutationFn: async (originalQuote) => {
      return await base44.entities.Quote.create({
        professional_id: originalQuote.professional_id,
        professional_name: originalQuote.professional_name,
        client_id: originalQuote.client_id,
        client_name: originalQuote.client_name,
        client_email: originalQuote.client_email,
        title: `${originalQuote.title} (Revisión v${originalQuote.version + 1})`,
        description: originalQuote.description,
        items: originalQuote.items,
        subtotal: originalQuote.subtotal,
        iva: originalQuote.iva,
        total: originalQuote.total,
        estimated_days: originalQuote.estimated_days,
        validity_days: originalQuote.validity_days,
        payment_conditions: originalQuote.payment_conditions,
        notes: originalQuote.notes,
        version: originalQuote.version + 1,
        parent_quote_id: originalQuote.parent_quote_id || originalQuote.id,
        status: "borrador"
      });
    },
    onSuccess: (newQuote) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success("Nueva versión creada como borrador");
      setSelectedQuote(newQuote);
    }
  });

  const resetForm = () => {
    setQuoteData({
      client_id: "",
      title: "",
      description: "",
      items: [{ concept: "", quantity: 1, unit_price: 0, total: 0 }],
      subtotal: 0,
      iva: 21,
      total: 0,
      estimated_days: 7,
      validity_days: 30,
      payment_conditions: "",
      notes: ""
    });
  };

  const handleCreateQuote = () => {
    if (!quoteData.client_id || !quoteData.title || quoteData.items.length === 0) {
      toast.error("Completa al menos cliente, título y una línea");
      return;
    }

    createQuoteMutation.mutate(quoteData);
  };

  const getStatusBadge = (status) => {
    const config = {
      borrador: { color: "bg-gray-100 text-gray-800", text: "Borrador", icon: FileText },
      enviado: { color: "bg-blue-100 text-blue-800", text: "Enviado", icon: Send },
      aceptado: { color: "bg-green-100 text-green-800", text: "Aceptado", icon: CheckCircle },
      rechazado: { color: "bg-red-100 text-red-800", text: "Rechazado", icon: XCircle }
    };
    const { color, text, icon: Icon } = config[status] || config.borrador;
    return (
      <Badge className={`${color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {text}
      </Badge>
    );
  };

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const quotes = isProfessional ? sentQuotes : receivedQuotes;
  const isLoading = isProfessional ? loadingSent : loadingReceived;

  return (
    <>
      <SEOHead 
        title="Presupuestos - MisAutónomos"
        description="Gestiona tus presupuestos"
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-4 md:py-8 px-3 md:px-4 pb-24 md:pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2 md:gap-3">
                <FileText className="w-7 h-7 md:w-8 md:h-8 text-blue-600" />
                Presupuestos
              </h1>
              <p className="text-xs md:text-sm text-gray-600 mt-1">
                {isProfessional ? "Crea y envía presupuestos a tus clientes" : "Revisa los presupuestos que has recibido"}
              </p>
            </div>
            {isProfessional && (
              <div className="flex gap-2">
                <Button 
                  onClick={() => navigate(createPageUrl("CRM"))}
                  variant="outline"
                  size="sm"
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  <Users className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Ver clientes</span>
                  <span className="sm:hidden">CRM</span>
                </Button>
                <Button 
                  onClick={() => setShowCreateDialog(true)} 
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Nuevo presupuesto</span>
                  <span className="sm:hidden">Nuevo</span>
                </Button>
              </div>
            )}
          </div>

          {/* Quick Links */}
          {isProfessional && (
            <Card className="border-0 shadow-sm bg-white mb-6">
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">Gestión completa</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Button 
                    onClick={() => navigate(createPageUrl("CRM"))}
                    variant="outline"
                    size="sm"
                    className="justify-start"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    <span className="truncate">Clientes</span>
                  </Button>
                  <Button 
                    onClick={() => navigate(createPageUrl("Projects"))}
                    variant="outline"
                    size="sm"
                    className="justify-start"
                  >
                    <FolderKanban className="w-4 h-4 mr-2" />
                    <span className="truncate">Proyectos</span>
                  </Button>
                  <Button 
                    onClick={() => navigate(createPageUrl("Calendar"))}
                    variant="outline"
                    size="sm"
                    className="justify-start"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="truncate">Calendario</span>
                  </Button>
                  <Button 
                    onClick={() => navigate(createPageUrl("Invoices"))}
                    variant="outline"
                    size="sm"
                    className="justify-start"
                  >
                    <Euro className="w-4 h-4 mr-2" />
                    <span className="truncate">Facturas</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
            </div>
          ) : quotes.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-16 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {isProfessional ? "No has creado presupuestos aún" : "No has recibido presupuestos aún"}
                </h3>
                <p className="text-gray-600 mb-6">
                  {isProfessional 
                    ? "Crea presupuestos profesionales y envíalos a tus clientes" 
                    : "Cuando un profesional te envíe un presupuesto, aparecerá aquí"}
                </p>
                {isProfessional && (
                  <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                    <Button 
                      onClick={() => navigate(createPageUrl("CRM"))}
                      variant="outline"
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Primero añade clientes
                    </Button>
                    <Button 
                      onClick={() => setShowCreateDialog(true)} 
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Crear primer presupuesto
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {quotes.map(quote => (
                <Card 
                  key={quote.id} 
                  className="cursor-pointer hover:shadow-lg transition-all border-0 shadow-sm active:scale-98" 
                  onClick={() => setSelectedQuote(quote)}
                >
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-bold text-base md:text-lg">{quote.title}</h3>
                          {quote.version > 1 && (
                            <Badge variant="outline" className="text-xs">v{quote.version}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {isProfessional ? `Cliente: ${quote.client_name}` : `De: ${quote.professional_name}`}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {getStatusBadge(quote.status)}
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Euro className="w-3 h-3" />
                            {quote.total.toFixed(2)}€
                          </Badge>
                          {quote.estimated_days && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {quote.estimated_days} días
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-left md:text-right text-sm text-gray-500">
                        <p>{format(new Date(quote.created_date), "dd/MM/yyyy")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* DIALOG: DETALLE */}
      <Dialog open={!!selectedQuote} onOpenChange={() => setSelectedQuote(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedQuote && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <FileText className="w-5 h-5" />
                  {selectedQuote.title}
                  {selectedQuote.version > 1 && (
                    <Badge variant="outline">v{selectedQuote.version}</Badge>
                  )}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  {getStatusBadge(selectedQuote.status)}
                  <Badge variant="outline">
                    {isProfessional ? `Cliente: ${selectedQuote.client_name}` : `De: ${selectedQuote.professional_name}`}
                  </Badge>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                  <p><strong>Fecha de creación:</strong> {format(new Date(selectedQuote.created_date), "dd/MM/yyyy HH:mm")}</p>
                  {selectedQuote.sent_date && (
                    <p><strong>Enviado:</strong> {format(new Date(selectedQuote.sent_date), "dd/MM/yyyy HH:mm")}</p>
                  )}
                  <p><strong>Plazo estimado:</strong> {selectedQuote.estimated_days} días</p>
                  <p><strong>Validez:</strong> {selectedQuote.validity_days} días</p>
                </div>

                {selectedQuote.description && (
                  <div>
                    <h4 className="font-semibold mb-2">Descripción:</h4>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{selectedQuote.description}</p>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold mb-3">Desglose:</h4>
                  <div className="border rounded-lg overflow-hidden overflow-x-auto">
                    <table className="w-full min-w-[400px]">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 md:px-4 py-2 text-left text-xs font-semibold">Concepto</th>
                          <th className="px-3 md:px-4 py-2 text-right text-xs font-semibold">Cant.</th>
                          <th className="px-3 md:px-4 py-2 text-right text-xs font-semibold">P. Unit.</th>
                          <th className="px-3 md:px-4 py-2 text-right text-xs font-semibold">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedQuote.items.map((item, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="px-3 md:px-4 py-2 text-xs md:text-sm">{item.concept}</td>
                            <td className="px-3 md:px-4 py-2 text-xs md:text-sm text-right">{item.quantity}</td>
                            <td className="px-3 md:px-4 py-2 text-xs md:text-sm text-right">{item.unit_price.toFixed(2)}€</td>
                            <td className="px-3 md:px-4 py-2 text-xs md:text-sm text-right font-semibold">{item.total.toFixed(2)}€</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 font-semibold">
                        <tr className="border-t">
                          <td colSpan="3" className="px-3 md:px-4 py-2 text-xs md:text-sm text-right">Subtotal:</td>
                          <td className="px-3 md:px-4 py-2 text-xs md:text-sm text-right">{selectedQuote.subtotal.toFixed(2)}€</td>
                        </tr>
                        <tr>
                          <td colSpan="3" className="px-3 md:px-4 py-2 text-xs md:text-sm text-right">IVA ({selectedQuote.iva}%):</td>
                          <td className="px-3 md:px-4 py-2 text-xs md:text-sm text-right">{(selectedQuote.total - selectedQuote.subtotal).toFixed(2)}€</td>
                        </tr>
                        <tr className="border-t-2">
                          <td colSpan="3" className="px-3 md:px-4 py-3 text-sm md:text-base text-right">TOTAL:</td>
                          <td className="px-3 md:px-4 py-3 text-sm md:text-base text-right text-blue-600">{selectedQuote.total.toFixed(2)}€</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {selectedQuote.payment_conditions && (
                  <div>
                    <h4 className="font-semibold mb-2">Condiciones de pago:</h4>
                    <p className="text-gray-700 text-sm">{selectedQuote.payment_conditions}</p>
                  </div>
                )}

                {selectedQuote.notes && (
                  <div>
                    <h4 className="font-semibold mb-2">Notas:</h4>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{selectedQuote.notes}</p>
                  </div>
                )}

                {selectedQuote.rejection_reason && (
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <h4 className="font-semibold mb-2 text-red-800 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Motivo del rechazo:
                    </h4>
                    <p className="text-red-700 text-sm">{selectedQuote.rejection_reason}</p>
                    <p className="text-red-600 text-xs mt-2">
                      Rechazado el {format(new Date(selectedQuote.rejection_date), "dd/MM/yyyy HH:mm")}
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t flex flex-col sm:flex-row gap-2">
                  {isProfessional && selectedQuote.status === "borrador" && (
                    <Button
                      onClick={() => sendQuoteMutation.mutate(selectedQuote.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      size="sm"
                      disabled={sendQuoteMutation.isPending}
                    >
                      {sendQuoteMutation.isPending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enviando...</>
                      ) : (
                        <><Send className="w-4 h-4 mr-2" />Enviar al cliente</>
                      )}
                    </Button>
                  )}

                  {isProfessional && selectedQuote.status === "aceptado" && (
                    <Button
                      onClick={() => setShowConvertDialog(true)}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                      size="sm"
                    >
                      <FolderKanban className="w-4 h-4 mr-2" />
                      Convertir a proyecto
                    </Button>
                  )}

                  {isProfessional && selectedQuote.status === "rechazado" && (
                    <Button
                      onClick={() => remakeQuoteMutation.mutate(selectedQuote)}
                      className="flex-1 bg-orange-600 hover:bg-orange-700"
                      size="sm"
                      disabled={remakeQuoteMutation.isPending}
                    >
                      {remakeQuoteMutation.isPending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creando...</>
                      ) : (
                        <><RefreshCw className="w-4 h-4 mr-2" />Rehacer presupuesto</>
                      )}
                    </Button>
                  )}

                  {!isProfessional && selectedQuote.status === "enviado" && (
                    <>
                      <Button
                        onClick={() => setShowAcceptDialog(true)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Aceptar
                      </Button>
                      <Button
                        onClick={() => setShowRejectDialog(true)}
                        variant="outline"
                        size="sm"
                        className="flex-1 border-red-300 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Rechazar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* DIALOG: CREAR PRESUPUESTO */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        setShowCreateDialog(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Presupuesto</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-sm">Cliente *</Label>
              <Select value={quoteData.client_id} onValueChange={(value) => setQuoteData({ ...quoteData, client_id: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {myClients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.client_name} {client.client_email && `(${client.client_email})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {myClients.length === 0 && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Añade clientes desde tu <button onClick={() => navigate(createPageUrl("CRM"))} className="text-blue-600 underline font-medium">CRM</button> primero
                </p>
              )}
            </div>

            <div>
              <Label className="text-sm">Título del presupuesto *</Label>
              <Input
                value={quoteData.title}
                onChange={(e) => setQuoteData({ ...quoteData, title: e.target.value })}
                placeholder="Ej: Reforma integral cocina"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm">Descripción del servicio</Label>
              <Textarea
                value={quoteData.description}
                onChange={(e) => setQuoteData({ ...quoteData, description: e.target.value })}
                placeholder="Describe el trabajo a realizar..."
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm">Líneas del presupuesto *</Label>
                <Button onClick={addItem} variant="outline" size="sm">
                  <Plus className="w-3 h-3 mr-1" />
                  Añadir línea
                </Button>
              </div>

              <div className="space-y-2 overflow-x-auto">
                {quoteData.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-end min-w-[400px]">
                    <div className="col-span-5">
                      <Input
                        placeholder="Concepto"
                        value={item.concept}
                        onChange={(e) => updateItem(idx, 'concept', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="Cant."
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                        className="text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="€"
                        value={item.unit_price}
                        onChange={(e) => updateItem(idx, 'unit_price', Number(e.target.value))}
                        className="text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        readOnly
                        value={item.total.toFixed(2)}
                        className="bg-gray-50 font-semibold text-sm"
                      />
                    </div>
                    <div className="col-span-1">
                      {quoteData.items.length > 1 && (
                        <Button
                          onClick={() => removeItem(idx)}
                          variant="ghost"
                          size="icon"
                          className="hover:bg-red-50 hover:text-red-600 h-9 w-9"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{quoteData.subtotal.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>IVA:</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={quoteData.iva}
                      onChange={(e) => {
                        const newIva = Number(e.target.value);
                        const { total } = calculateTotals(quoteData.items, newIva);
                        setQuoteData({ ...quoteData, iva: newIva, total });
                      }}
                      className="w-14 h-8 text-right text-sm"
                    />
                    <span>%</span>
                    <span className="font-semibold w-20 text-right">{(quoteData.total - quoteData.subtotal).toFixed(2)}€</span>
                  </div>
                </div>
                <div className="flex justify-between text-base font-bold border-t pt-2">
                  <span>TOTAL:</span>
                  <span className="text-blue-600">{quoteData.total.toFixed(2)}€</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Días estimados</Label>
                <Input
                  type="number"
                  value={quoteData.estimated_days}
                  onChange={(e) => setQuoteData({ ...quoteData, estimated_days: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">Validez (días)</Label>
                <Input
                  type="number"
                  value={quoteData.validity_days}
                  onChange={(e) => setQuoteData({ ...quoteData, validity_days: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm">Condiciones de pago</Label>
              <Textarea
                value={quoteData.payment_conditions}
                onChange={(e) => setQuoteData({ ...quoteData, payment_conditions: e.target.value })}
                placeholder="Ej: 50% al inicio, 50% al finalizar"
                rows={2}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm">Notas adicionales</Label>
              <Textarea
                value={quoteData.notes}
                onChange={(e) => setQuoteData({ ...quoteData, notes: e.target.value })}
                placeholder="Información adicional para el cliente..."
                rows={2}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setShowCreateDialog(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateQuote}
              size="sm"
              disabled={createQuoteMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createQuoteMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</>
              ) : (
                <><FileText className="w-4 h-4 mr-2" />Guardar borrador</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: CONVERTIR A PROYECTO */}
      <AlertDialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-indigo-600" />
              Convertir a proyecto
            </AlertDialogTitle>
            <AlertDialogDescription>
              Se creará un nuevo proyecto basado en este presupuesto. Podrás gestionarlo desde la sección de Proyectos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => convertToProjectMutation.mutate(selectedQuote)}
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={convertToProjectMutation.isPending}
            >
              {convertToProjectMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creando...</>
              ) : (
                "Crear proyecto"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DIALOG: RECHAZAR */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              Rechazar presupuesto
            </AlertDialogTitle>
            <AlertDialogDescription>
              Por favor indica el motivo del rechazo para que el profesional pueda mejorar su propuesta
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-4">
            <Label className="text-sm">Motivo del rechazo *</Label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Ej: El precio es superior a mi presupuesto..."
              rows={4}
              className="mt-2"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRejectionReason("")}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!rejectionReason.trim()) {
                  toast.error("Debes indicar un motivo");
                  return;
                }
                rejectQuoteMutation.mutate({ quoteId: selectedQuote.id, reason: rejectionReason });
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={rejectQuoteMutation.isPending}
            >
              {rejectQuoteMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Rechazando...</>
              ) : (
                "Confirmar rechazo"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DIALOG: ACEPTAR */}
      <AlertDialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              Aceptar presupuesto
            </AlertDialogTitle>
            <AlertDialogDescription>
              Al aceptar este presupuesto, el profesional recibirá una notificación y podrá comenzar el trabajo.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {selectedQuote && (
            <div className="bg-green-50 p-4 rounded-lg my-4">
              <p className="text-sm mb-2"><strong>Presupuesto:</strong> {selectedQuote.title}</p>
              <p className="text-sm mb-2"><strong>Total:</strong> {selectedQuote.total.toFixed(2)}€</p>
              <p className="text-sm"><strong>Plazo:</strong> {selectedQuote.estimated_days} días</p>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => acceptQuoteMutation.mutate(selectedQuote.id)}
              className="bg-green-600 hover:bg-green-700"
              disabled={acceptQuoteMutation.isPending}
            >
              {acceptQuoteMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Aceptando...</>
              ) : (
                "Confirmar aceptación"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
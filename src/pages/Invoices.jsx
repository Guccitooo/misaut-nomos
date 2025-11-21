import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Plus, Euro, Calendar, Send, Check, AlertCircle, ArrowLeft, Trash2, Bell, CreditCard, Link as LinkIcon, Copy, Mail } from "lucide-react";
import { toast } from "sonner";
import Loader from "@/components/ui/Loader";

export default function InvoicesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [formData, setFormData] = useState({
    client_name: "",
    client_email: "",
    client_nif: "",
    client_address: "",
    issue_date: new Date().toISOString().split('T')[0],
    due_date: "",
    items: [{ description: "", quantity: 1, unit_price: 0, total: 0 }],
    status: "draft",
    notes: "",
    iva_incluido: false,
  });

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

  const { data: invoices = [], isLoading: loadingInvoices } = useQuery({
    queryKey: ['invoices', user?.id],
    queryFn: () => base44.entities.Invoice.filter({ professional_id: user.id }),
    enabled: !!user,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['clientContacts', user?.id],
    queryFn: () => base44.entities.ClientContact.filter({ professional_id: user.id }),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const invoiceNumber = `INV-${Date.now()}`;
      const itemsTotal = data.items.reduce((sum, item) => sum + item.total, 0);
      
      let subtotal, ivaAmount, total;
      if (data.iva_incluido) {
        total = itemsTotal;
        subtotal = total / 1.21;
        ivaAmount = total - subtotal;
      } else {
        subtotal = itemsTotal;
        ivaAmount = subtotal * 0.21;
        total = subtotal + ivaAmount;
      }

      return base44.entities.Invoice.create({
        ...data,
        professional_id: user.id,
        invoice_number: invoiceNumber,
        subtotal,
        iva_amount: ivaAmount,
        total,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['invoices']);
      setShowDialog(false);
      resetForm();
      toast.success("Factura creada");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => {
      const itemsTotal = data.items.reduce((sum, item) => sum + item.total, 0);
      
      let subtotal, ivaAmount, total;
      if (data.iva_incluido) {
        total = itemsTotal;
        subtotal = total / 1.21;
        ivaAmount = total - subtotal;
      } else {
        subtotal = itemsTotal;
        ivaAmount = subtotal * 0.21;
        total = subtotal + ivaAmount;
      }

      return base44.entities.Invoice.update(id, {
        ...data,
        subtotal,
        iva_amount: ivaAmount,
        total,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['invoices']);
      setShowDialog(false);
      resetForm();
      toast.success("Factura actualizada");
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (invoiceId) => {
      const response = await base44.functions.invoke('sendInvoiceEmail', { invoiceId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['invoices']);
      toast.success("Factura enviada por email");
    },
    onError: () => {
      toast.error("Error al enviar la factura");
    }
  });

  const reminderMutation = useMutation({
    mutationFn: async (invoiceId) => {
      const response = await base44.functions.invoke('sendInvoiceReminder', { invoiceId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['invoices']);
      toast.success("Recordatorio enviado al cliente");
    },
    onError: () => {
      toast.error("Error al enviar recordatorio");
    }
  });

  const createPaymentLinkMutation = useMutation({
    mutationFn: async (invoiceId) => {
      const response = await base44.functions.invoke('createInvoicePayment', { 
        invoiceId,
        publicAccess: false 
      });
      return response.data;
    },
    onSuccess: (data, invoiceId) => {
      queryClient.invalidateQueries(['invoices']);
      const invoice = invoices.find(inv => inv.id === invoiceId);
      if (invoice?.payment_link) {
        navigator.clipboard.writeText(invoice.payment_link);
        toast.success("Enlace de pago generado y copiado");
      }
    },
    onError: () => {
      toast.error("Error al generar enlace de pago");
    }
  });

  const resetForm = () => {
    setFormData({
      client_name: "",
      client_email: "",
      client_nif: "",
      client_address: "",
      issue_date: new Date().toISOString().split('T')[0],
      due_date: "",
      items: [{ description: "", quantity: 1, unit_price: 0, total: 0 }],
      status: "draft",
      notes: "",
      iva_incluido: false,
    });
    setEditingInvoice(null);
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: "", quantity: 1, unit_price: 0, total: 0 }]
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = field === 'description' ? value : parseFloat(value) || 0;
    newItems[index].total = newItems[index].quantity * newItems[index].unit_price;
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingInvoice) {
      updateMutation.mutate({ id: editingInvoice.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      client_name: invoice.client_name || "",
      client_email: invoice.client_email || "",
      client_nif: invoice.client_nif || "",
      client_address: invoice.client_address || "",
      issue_date: invoice.issue_date || new Date().toISOString().split('T')[0],
      due_date: invoice.due_date || "",
      items: invoice.items || [{ description: "", quantity: 1, unit_price: 0, total: 0 }],
      status: invoice.status || "draft",
      notes: invoice.notes || "",
      iva_incluido: invoice.iva_incluido || false,
    });
    setShowDialog(true);
  };

  if (loading) return <Loader />;

  const itemsTotal = formData.items.reduce((sum, item) => sum + item.total, 0);
  let subtotal, iva, total;
  if (formData.iva_incluido) {
    total = itemsTotal;
    subtotal = total / 1.21;
    iva = total - subtotal;
  } else {
    subtotal = itemsTotal;
    iva = subtotal * 0.21;
    total = subtotal + iva;
  }

  const getStatusBadge = (status) => {
    const styles = {
      draft: "bg-gray-100 text-gray-800",
      sent: "bg-blue-100 text-blue-800",
      paid: "bg-green-100 text-green-800",
      overdue: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-600",
    };
    const labels = {
      draft: "Borrador",
      sent: "Enviada",
      paid: "Pagada",
      overdue: "Vencida",
      cancelled: "Cancelada",
    };
    return <Badge className={styles[status]}>{labels[status]}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(createPageUrl("ProfessionalDashboard"))}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Facturas</h1>
              <p className="text-gray-600 mt-1">{invoices.length} facturas totales</p>
            </div>
          </div>
          <Button onClick={() => { resetForm(); setShowDialog(true); }} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Nueva factura
          </Button>
        </div>

        {loadingInvoices ? (
          <Loader />
        ) : invoices.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay facturas</h3>
              <p className="text-gray-600 mb-6">Empieza a facturar tus servicios</p>
              <Button onClick={() => { resetForm(); setShowDialog(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Crear primera factura
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {invoices.map(invoice => (
              <Card key={invoice.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900">{invoice.invoice_number}</h3>
                          {getStatusBadge(invoice.status)}
                        </div>
                        <p className="text-sm text-gray-600">{invoice.client_name}</p>
                        <p className="text-xs text-gray-500">
                          Emitida: {new Date(invoice.issue_date).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{invoice.total?.toFixed(2)}€</p>
                    <div className="flex flex-wrap gap-2 mt-3 justify-end">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEdit(invoice)}
                        className="bg-white hover:bg-gray-50 text-gray-900 border-gray-300 font-medium"
                      >
                        Editar
                      </Button>
                      {(invoice.status === 'draft' || invoice.status === 'sent') && invoice.client_email && (
                        <Button 
                          size="sm" 
                          onClick={() => sendEmailMutation.mutate(invoice.id)}
                          disabled={sendEmailMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                        >
                          <Mail className="w-4 h-4 mr-1.5" />
                          Enviar email
                        </Button>
                      )}
                      {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => reminderMutation.mutate(invoice.id)}
                            disabled={reminderMutation.isPending}
                            className="bg-white hover:bg-orange-50 text-orange-700 border-orange-300 font-medium"
                          >
                            <Bell className="w-4 h-4 mr-1.5" />
                            Recordar
                          </Button>
                          {invoice.payment_link ? (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                navigator.clipboard.writeText(invoice.payment_link);
                                toast.success("Enlace copiado");
                              }}
                              className="bg-white hover:bg-gray-50 text-gray-900 border-gray-300 font-medium"
                            >
                              <Copy className="w-4 h-4 mr-1.5" />
                              Copiar link
                            </Button>
                          ) : (
                            <Button 
                              size="sm"
                              onClick={() => createPaymentLinkMutation.mutate(invoice.id)}
                              disabled={createPaymentLinkMutation.isPending}
                              className="bg-green-600 hover:bg-green-700 text-white font-medium"
                            >
                              <CreditCard className="w-4 h-4 mr-1.5" />
                              Crear pago
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingInvoice ? "Editar factura" : "Nueva factura"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cliente *</Label>
                <Select 
                  value={formData.client_name} 
                  onValueChange={(value) => {
                    const contact = contacts.find(c => c.client_name === value);
                    if (contact) {
                      setFormData({
                        ...formData,
                        client_name: contact.client_name,
                        client_email: contact.client_email || "",
                        client_address: contact.address || "",
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.filter(c => c.status === 'client').map(contact => (
                      <SelectItem key={contact.id} value={contact.client_name}>{contact.client_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Email del cliente</Label>
                <Input
                  type="email"
                  value={formData.client_email}
                  onChange={(e) => setFormData({...formData, client_email: e.target.value})}
                />
              </div>
              <div>
                <Label>NIF del cliente</Label>
                <Input
                  value={formData.client_nif}
                  onChange={(e) => setFormData({...formData, client_nif: e.target.value})}
                />
              </div>
              <div>
                <Label>Dirección</Label>
                <Input
                  value={formData.client_address}
                  onChange={(e) => setFormData({...formData, client_address: e.target.value})}
                />
              </div>
              <div>
                <Label>Fecha emisión *</Label>
                <Input
                  type="date"
                  value={formData.issue_date}
                  onChange={(e) => setFormData({...formData, issue_date: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label>Fecha vencimiento</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-semibold">Conceptos</Label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="iva-incluido"
                      checked={formData.iva_incluido}
                      onChange={(e) => setFormData({...formData, iva_incluido: e.target.checked})}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <label htmlFor="iva-incluido" className="text-sm text-gray-700">
                      IVA incluido en importes
                    </label>
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={addItem}>
                    <Plus className="w-3 h-3 mr-1" />
                    Añadir línea
                  </Button>
                </div>
              </div>
              
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                  <div className="col-span-5">
                    <Input
                      placeholder="Descripción"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="Cant."
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Precio"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input value={item.total.toFixed(2)} disabled />
                  </div>
                  <div className="col-span-1">
                    {formData.items.length > 1 && (
                      <Button type="button" size="icon" variant="ghost" onClick={() => removeItem(index)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span className="font-semibold">{subtotal.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>IVA (21%):</span>
                <span className="font-semibold">{iva.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>{total.toFixed(2)}€</span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {editingInvoice ? "Guardar cambios" : "Crear factura"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
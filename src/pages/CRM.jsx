import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Users, Plus, Mail, Phone, Building, ArrowLeft, Search, Edit2, Trash2, IdCard, MapPin } from "lucide-react";
import { toast } from "sonner";
import Loader from "@/components/ui/Loader";

export default function CRMPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formData, setFormData] = useState({
    client_name: "",
    client_email: "",
    client_phone: "",
    client_nif: "",
    company: "",
    address: "",
    status: "lead",
    source: "",
    notes: "",
    estimated_value: "",
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

  const { data: contacts = [], isLoading: loadingContacts } = useQuery({
    queryKey: ['clientContacts', user?.id],
    queryFn: () => base44.entities.ClientContact.filter({ professional_id: user.id }),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ClientContact.create({ ...data, professional_id: user.id }),
    onSuccess: () => {
      queryClient.invalidateQueries(['clientContacts']);
      setShowDialog(false);
      resetForm();
      toast.success("Cliente creado");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ClientContact.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['clientContacts']);
      setShowDialog(false);
      resetForm();
      toast.success("Cliente actualizado");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ClientContact.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['clientContacts']);
      setDeleteDialog(null);
      toast.success("Cliente eliminado");
    },
    onError: () => {
      toast.error("Error al eliminar cliente");
    }
  });

  const resetForm = () => {
    setFormData({
      client_name: "",
      client_email: "",
      client_phone: "",
      client_nif: "",
      company: "",
      address: "",
      status: "lead",
      source: "",
      notes: "",
      estimated_value: "",
    });
    setEditingContact(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSend = {
      ...formData,
      estimated_value: formData.estimated_value ? parseFloat(formData.estimated_value) : 0,
    };

    if (editingContact) {
      updateMutation.mutate({ id: editingContact.id, data: dataToSend });
    } else {
      createMutation.mutate(dataToSend);
    }
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setFormData({
      client_name: contact.client_name || "",
      client_email: contact.client_email || "",
      client_phone: contact.client_phone || "",
      client_nif: contact.client_nif || "",
      company: contact.company || "",
      address: contact.address || "",
      status: contact.status || "lead",
      source: contact.source || "",
      notes: contact.notes || "",
      estimated_value: contact.estimated_value || "",
    });
    setShowDialog(true);
  };

  const handleDelete = (contact) => {
    setDeleteDialog(contact);
  };

  const confirmDelete = () => {
    if (deleteDialog) {
      deleteMutation.mutate(deleteDialog.id);
    }
  };

  if (loading) return <Loader />;

  const filteredContacts = contacts.filter(c => {
    const matchesSearch = c.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.client_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.client_phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.client_nif?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.company?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const colors = {
      lead: "bg-yellow-100 text-yellow-800",
      contacted: "bg-blue-100 text-blue-800",
      negotiating: "bg-purple-100 text-purple-800",
      client: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
    };
    const labels = {
      lead: "Lead",
      contacted: "Contactado",
      negotiating: "Negociando",
      client: "Cliente",
      inactive: "Inactivo",
    };
    return <Badge className={colors[status]}>{labels[status]}</Badge>;
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
              <h1 className="text-3xl font-bold text-gray-900">CRM - Gestión de Clientes</h1>
              <p className="text-gray-600 mt-1">{filteredContacts.length} de {contacts.length} clientes</p>
            </div>
          </div>
          <Button onClick={() => { resetForm(); setShowDialog(true); }} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo cliente
          </Button>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nombre, email, teléfono, NIF o empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48 h-11">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="contacted">Contactado</SelectItem>
                  <SelectItem value="negotiating">Negociando</SelectItem>
                  <SelectItem value="client">Cliente</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {loadingContacts ? (
          <Loader />
        ) : filteredContacts.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay clientes</h3>
              <p className="text-gray-600 mb-6">Empieza a añadir tus clientes y prospectos</p>
              <Button onClick={() => { resetForm(); setShowDialog(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Añadir primer cliente
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredContacts.map(contact => (
              <Card key={contact.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-gray-900">{contact.client_name}</h3>
                            {getStatusBadge(contact.status)}
                          </div>
                          {contact.company && (
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <Building className="w-3 h-3" />
                              {contact.company}
                            </p>
                          )}
                        </div>

                        <div className="space-y-1">
                          {contact.client_email && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{contact.client_email}</span>
                            </div>
                          )}
                          {contact.client_phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="w-4 h-4 flex-shrink-0" />
                              <span>{contact.client_phone}</span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          {contact.client_nif && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <IdCard className="w-4 h-4 flex-shrink-0" />
                              <span>{contact.client_nif}</span>
                            </div>
                          )}
                          {contact.address && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{contact.address}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEdit(contact)}
                            className="bg-white hover:bg-blue-50 text-blue-700 border-blue-300 font-medium"
                          >
                            <Edit2 className="w-4 h-4 mr-1.5" />
                            Editar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDelete(contact)}
                            className="bg-white hover:bg-red-50 text-red-700 border-red-300 font-medium"
                          >
                            <Trash2 className="w-4 h-4 mr-1.5" />
                            Eliminar
                          </Button>
                        </div>
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingContact ? "Editar cliente" : "Nuevo cliente"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold">Nombre *</Label>
                <Input
                  value={formData.client_name}
                  onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                  placeholder="Juan Pérez"
                  required
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Email</Label>
                <Input
                  type="email"
                  value={formData.client_email}
                  onChange={(e) => setFormData({...formData, client_email: e.target.value})}
                  placeholder="juan@ejemplo.com"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Teléfono</Label>
                <Input
                  value={formData.client_phone}
                  onChange={(e) => setFormData({...formData, client_phone: e.target.value})}
                  placeholder="+34 612 345 678"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">NIF / CIF</Label>
                <Input
                  value={formData.client_nif}
                  onChange={(e) => setFormData({...formData, client_nif: e.target.value})}
                  placeholder="12345678A"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Empresa</Label>
                <Input
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                  placeholder="Nombre de la empresa"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Estado</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="contacted">Contactado</SelectItem>
                    <SelectItem value="negotiating">Negociando</SelectItem>
                    <SelectItem value="client">Cliente</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-semibold">Valor estimado (€)</Label>
                <Input
                  type="number"
                  value={formData.estimated_value}
                  onChange={(e) => setFormData({...formData, estimated_value: e.target.value})}
                  placeholder="0"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Origen del contacto</Label>
                <Input
                  value={formData.source}
                  onChange={(e) => setFormData({...formData, source: e.target.value})}
                  placeholder="Ej: Recomendación, Web..."
                  className="mt-1.5"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm font-semibold">Dirección</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="Calle, número, código postal, ciudad"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold">Notas</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={4}
                placeholder="Información adicional sobre el cliente"
                className="mt-1.5"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {editingContact ? "Guardar cambios" : "Crear cliente"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar a <strong>{deleteDialog?.client_name}</strong>. 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
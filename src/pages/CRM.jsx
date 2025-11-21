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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Plus, Mail, Phone, Building, Tag, Calendar, ArrowLeft, Search, Filter } from "lucide-react";
import { toast } from "sonner";
import Loader from "@/components/ui/Loader";

export default function CRMPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formData, setFormData] = useState({
    client_name: "",
    client_email: "",
    client_phone: "",
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
      toast.success("Contacto creado");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ClientContact.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['clientContacts']);
      setShowDialog(false);
      resetForm();
      toast.success("Contacto actualizado");
    },
  });

  const resetForm = () => {
    setFormData({
      client_name: "",
      client_email: "",
      client_phone: "",
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
      company: contact.company || "",
      address: contact.address || "",
      status: contact.status || "lead",
      source: contact.source || "",
      notes: contact.notes || "",
      estimated_value: contact.estimated_value || "",
    });
    setShowDialog(true);
  };

  if (loading) return <Loader />;

  const filteredContacts = contacts.filter(c => {
    const matchesSearch = c.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.client_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
              <p className="text-gray-600 mt-1">{contacts.length} contactos totales</p>
            </div>
          </div>
          <Button onClick={() => { resetForm(); setShowDialog(true); }} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo contacto
          </Button>
        </div>

        {/* FILTROS */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, email o empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="lead">Leads</SelectItem>
              <SelectItem value="contacted">Contactados</SelectItem>
              <SelectItem value="negotiating">Negociando</SelectItem>
              <SelectItem value="client">Clientes</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* LISTA DE CONTACTOS */}
        {loadingContacts ? (
          <Loader />
        ) : filteredContacts.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay contactos</h3>
              <p className="text-gray-600 mb-6">Empieza a añadir tus clientes y prospectos</p>
              <Button onClick={() => { resetForm(); setShowDialog(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Añadir primer contacto
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContacts.map(contact => (
              <Card key={contact.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleEdit(contact)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1">{contact.client_name}</h3>
                      {contact.company && (
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          {contact.company}
                        </p>
                      )}
                    </div>
                    {getStatusBadge(contact.status)}
                  </div>

                  {contact.client_email && (
                    <p className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                      <Mail className="w-3.5 h-3.5" />
                      {contact.client_email}
                    </p>
                  )}
                  {contact.client_phone && (
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5" />
                      {contact.client_phone}
                    </p>
                  )}

                  {contact.estimated_value > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-sm text-gray-600">Valor estimado:</p>
                      <p className="text-lg font-bold text-green-600">{contact.estimated_value}€</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* DIALOG CREAR/EDITAR */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingContact ? "Editar contacto" : "Nuevo contacto"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nombre *</Label>
                <Input
                  value={formData.client_name}
                  onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.client_email}
                  onChange={(e) => setFormData({...formData, client_email: e.target.value})}
                />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input
                  value={formData.client_phone}
                  onChange={(e) => setFormData({...formData, client_phone: e.target.value})}
                />
              </div>
              <div>
                <Label>Empresa</Label>
                <Input
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                />
              </div>
              <div>
                <Label>Estado</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger>
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
                <Label>Valor estimado (€)</Label>
                <Input
                  type="number"
                  value={formData.estimated_value}
                  onChange={(e) => setFormData({...formData, estimated_value: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label>Dirección</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>

            <div>
              <Label>Origen del contacto</Label>
              <Input
                value={formData.source}
                onChange={(e) => setFormData({...formData, source: e.target.value})}
                placeholder="Ej: Recomendación, Web, Redes sociales..."
              />
            </div>

            <div>
              <Label>Notas</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {editingContact ? "Guardar cambios" : "Crear contacto"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
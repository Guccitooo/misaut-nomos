import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function AdminFAQPage() {
  const queryClient = useQueryClient();
  const [editingFaq, setEditingFaq] = useState(null);
  const [showDialog, setShowDialog] = useState(false);

  const { data: faqs = [] } = useQuery({
    queryKey: ['adminFaqs'],
    queryFn: async () => {
      const allFaqs = await base44.entities.FAQ.list();
      return allFaqs.sort((a, b) => (a.order || 0) - (b.order || 0));
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.FAQ.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminFaqs'] });
      toast.success('FAQ creado correctamente');
      setShowDialog(false);
      setEditingFaq(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await base44.entities.FAQ.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminFaqs'] });
      toast.success('FAQ actualizado correctamente');
      setShowDialog(false);
      setEditingFaq(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return await base44.entities.FAQ.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminFaqs'] });
      toast.success('FAQ eliminado correctamente');
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, published }) => {
      return await base44.entities.FAQ.update(id, { published: !published });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminFaqs'] });
      toast.success('Estado actualizado');
    },
  });

  const handleSave = () => {
    if (!editingFaq.title_es || !editingFaq.title_en || !editingFaq.content_es || !editingFaq.content_en || !editingFaq.category) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }

    if (editingFaq.id) {
      updateMutation.mutate({ id: editingFaq.id, data: editingFaq });
    } else {
      createMutation.mutate(editingFaq);
    }
  };

  const handleNew = () => {
    setEditingFaq({
      title_es: '',
      title_en: '',
      summary_es: '',
      summary_en: '',
      content_es: '',
      content_en: '',
      category: 'platform',
      tags: [],
      published: true,
      order: faqs.length
    });
    setShowDialog(true);
  };

  const handleEdit = (faq) => {
    setEditingFaq({...faq});
    setShowDialog(true);
  };

  const getCategoryLabel = (category) => {
    const labels = {
      platform: "Plataforma",
      clients: "Clientes",
      professionals: "Autónomos",
      security: "Seguridad",
      payments: "Pagos",
      profile: "Perfil",
      troubleshooting: "Problemas"
    };
    return labels[category] || category;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de FAQs</h1>
            <p className="text-gray-600">Administra el contenido del centro de ayuda</p>
          </div>
          <Button onClick={handleNew} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo artículo
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {faqs.map((faq) => (
            <Card key={faq.id} className="relative">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <Badge variant="outline">{getCategoryLabel(faq.category)}</Badge>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => togglePublishMutation.mutate({ id: faq.id, published: faq.published })}
                    >
                      {faq.published ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(faq)}
                    >
                      <Pencil className="w-4 h-4 text-blue-600" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(faq.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                  {faq.title_es}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                  {faq.summary_es}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{faq.views || 0} vistas</span>
                  <span>{faq.helpful_count || 0} útiles</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingFaq?.id ? 'Editar FAQ' : 'Nuevo FAQ'}</DialogTitle>
            </DialogHeader>

            {editingFaq && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Categoría *</label>
                  <Select
                    value={editingFaq.category}
                    onValueChange={(value) => setEditingFaq({...editingFaq, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="platform">Plataforma</SelectItem>
                      <SelectItem value="clients">Clientes</SelectItem>
                      <SelectItem value="professionals">Autónomos</SelectItem>
                      <SelectItem value="security">Seguridad</SelectItem>
                      <SelectItem value="payments">Pagos</SelectItem>
                      <SelectItem value="profile">Perfil</SelectItem>
                      <SelectItem value="troubleshooting">Problemas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Título (ES) *</label>
                    <Input
                      value={editingFaq.title_es}
                      onChange={(e) => setEditingFaq({...editingFaq, title_es: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Título (EN) *</label>
                    <Input
                      value={editingFaq.title_en}
                      onChange={(e) => setEditingFaq({...editingFaq, title_en: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Resumen (ES)</label>
                    <Textarea
                      value={editingFaq.summary_es}
                      onChange={(e) => setEditingFaq({...editingFaq, summary_es: e.target.value})}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Resumen (EN)</label>
                    <Textarea
                      value={editingFaq.summary_en}
                      onChange={(e) => setEditingFaq({...editingFaq, summary_en: e.target.value})}
                      rows={3}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Contenido (ES) *</label>
                    <Textarea
                      value={editingFaq.content_es}
                      onChange={(e) => setEditingFaq({...editingFaq, content_es: e.target.value})}
                      rows={8}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Contenido (EN) *</label>
                    <Textarea
                      value={editingFaq.content_en}
                      onChange={(e) => setEditingFaq({...editingFaq, content_en: e.target.value})}
                      rows={8}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Etiquetas (separadas por comas)</label>
                  <Input
                    value={(editingFaq.tags || []).join(', ')}
                    onChange={(e) => setEditingFaq({...editingFaq, tags: e.target.value.split(',').map(t => t.trim())})}
                    placeholder="registro, cuenta, contraseña"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Orden</label>
                  <Input
                    type="number"
                    value={editingFaq.order || 0}
                    onChange={(e) => setEditingFaq({...editingFaq, order: parseInt(e.target.value)})}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
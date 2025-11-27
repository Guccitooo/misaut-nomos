import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Camera, Plus, X, Upload, Loader2, Edit2, Trash2, Image, Calendar } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function PortfolioSection({ 
  portfolioItems = [], 
  isEditing, 
  onPortfolioChange,
  categories = []
}) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    images: [],
    date: "",
    category: ""
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      images: [],
      date: "",
      category: ""
    });
    setEditingItem(null);
  };

  const openAddDialog = () => {
    resetForm();
    setShowAddDialog(true);
  };

  const openEditDialog = (item) => {
    setFormData({
      title: item.title || "",
      description: item.description || "",
      images: item.images || [],
      date: item.date || "",
      category: item.category || ""
    });
    setEditingItem(item);
    setShowAddDialog(true);
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const uploadedUrls = [];

    try {
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} supera los 5MB`);
          continue;
        }
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploadedUrls.push(file_url);
      }

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls].slice(0, 5)
      }));
    } catch (error) {
      toast.error("Error al subir imágenes");
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (idx) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx)
    }));
  };

  const saveItem = () => {
    if (!formData.title.trim()) {
      toast.error("El título es obligatorio");
      return;
    }

    if (formData.images.length === 0) {
      toast.error("Añade al menos una imagen");
      return;
    }

    const newItem = {
      id: editingItem?.id || Date.now().toString(),
      ...formData
    };

    let updatedItems;
    if (editingItem) {
      updatedItems = portfolioItems.map(item => 
        item.id === editingItem.id ? newItem : item
      );
    } else {
      updatedItems = [...portfolioItems, newItem];
    }

    onPortfolioChange(updatedItems);
    setShowAddDialog(false);
    resetForm();
    toast.success(editingItem ? "Trabajo actualizado" : "Trabajo añadido al portfolio");
  };

  const deleteItem = (itemId) => {
    onPortfolioChange(portfolioItems.filter(item => item.id !== itemId));
    toast.success("Trabajo eliminado del portfolio");
  };

  return (
    <Card className="shadow-sm border-0 bg-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-700" />
            Portfolio de Trabajos ({portfolioItems.length})
          </CardTitle>
          {isEditing && (
            <Button onClick={openAddDialog} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-1" />
              Añadir trabajo
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Muestra tus mejores trabajos con fotos y descripciones detalladas
        </p>

        {portfolioItems.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
            <Image className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No hay trabajos en el portfolio</p>
            {isEditing && (
              <Button onClick={openAddDialog} variant="outline" className="mt-3">
                <Plus className="w-4 h-4 mr-1" />
                Añadir primer trabajo
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {portfolioItems.map((item) => (
              <div 
                key={item.id} 
                className="border rounded-xl overflow-hidden bg-gray-50 hover:shadow-md transition-shadow"
              >
                {/* Imagen principal */}
                <div className="relative h-40 bg-gray-200">
                  {item.images?.[0] && (
                    <img 
                      src={item.images[0]} 
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {item.images?.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      +{item.images.length - 1} fotos
                    </div>
                  )}
                  {isEditing && (
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button
                        onClick={() => openEditDialog(item)}
                        className="bg-white/90 hover:bg-white p-1.5 rounded-full shadow"
                      >
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="bg-white/90 hover:bg-white p-1.5 rounded-full shadow"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                  {item.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    {item.date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {item.date}
                      </span>
                    )}
                    {item.category && (
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        {item.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dialog para añadir/editar */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Editar trabajo" : "Añadir trabajo al portfolio"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Título del trabajo *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ej: Reforma completa de baño"
                />
              </div>

              <div>
                <Label>Descripción</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe el trabajo realizado, materiales usados, tiempo de ejecución..."
                  className="h-24"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fecha (mes/año)</Label>
                  <Input
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    placeholder="Ej: Marzo 2024"
                  />
                </div>
                <div>
                  <Label>Categoría</Label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="Ej: Reformas"
                  />
                </div>
              </div>

              <div>
                <Label>Imágenes ({formData.images.length}/5) *</Label>
                
                {formData.images.length < 5 && (
                  <label className="cursor-pointer block mt-2">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={uploading}
                      />
                      {uploading ? (
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                      ) : (
                        <>
                          <Upload className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                          <p className="text-sm text-gray-500">Haz clic para añadir fotos</p>
                        </>
                      )}
                    </div>
                  </label>
                )}

                {formData.images.length > 0 && (
                  <div className="grid grid-cols-5 gap-2 mt-3">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="relative">
                        <img 
                          src={img} 
                          alt={`Foto ${idx + 1}`}
                          className="w-full h-16 object-cover rounded"
                        />
                        <button
                          onClick={() => removeImage(idx)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white p-0.5 rounded-full"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={saveItem} className="bg-blue-600 hover:bg-blue-700">
                {editingItem ? "Guardar cambios" : "Añadir trabajo"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
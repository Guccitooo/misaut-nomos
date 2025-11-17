import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../ui/LanguageSwitcher";

export default function CreateTicketDialog({ open, onClose, user }) {
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "soporte_cliente",
    priority: "media",
    related_professional_id: ""
  });
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);

  const { data: professionals = [] } = useQuery({
    queryKey: ['myContacts'],
    queryFn: async () => {
      if (!user) return [];
      const messages = await base44.entities.Message.filter({
        $or: [
          { sender_id: user.id },
          { recipient_id: user.id }
        ]
      });
      
      const professionalIds = new Set();
      messages.forEach(msg => {
        if (msg.sender_id !== user.id) professionalIds.add(msg.sender_id);
        if (msg.recipient_id !== user.id) professionalIds.add(msg.recipient_id);
      });
      
      const profs = [];
      for (const id of professionalIds) {
        const profiles = await base44.entities.ProfessionalProfile.filter({ user_id: id });
        if (profiles[0]) {
          profs.push({ id, name: profiles[0].business_name });
        }
      }
      return profs;
    },
    enabled: !!user && open,
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const ticketNumber = `TK-${Date.now().toString().slice(-8)}`;
      
      const ticket = await base44.entities.Ticket.create({
        ticket_number: ticketNumber,
        title: data.title,
        description: data.description,
        type: data.type,
        priority: data.priority,
        creator_id: user.id,
        creator_name: user.full_name || user.email,
        creator_email: user.email,
        assigned_to_id: data.related_professional_id || '',
        related_professional_id: data.related_professional_id || '',
        attachments: attachments,
        status: "abierto"
      });

      await base44.entities.TicketMessage.create({
        ticket_id: ticket.id,
        sender_id: user.id,
        sender_name: user.full_name || user.email,
        sender_role: user.role || 'user',
        content: data.description,
        action_type: "message"
      });

      if (data.related_professional_id) {
        await base44.entities.Notification.create({
          user_id: data.related_professional_id,
          type: 'system_update',
          title: language === 'es' ? 'Nuevo ticket recibido' : 'New ticket received',
          message: language === 'es' 
            ? `Tienes un nuevo ticket: ${data.title}`
            : `You have a new ticket: ${data.title}`,
          link: `/tickets?id=${ticket.id}`,
          priority: 'high'
        });
      }

      return ticket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success(language === 'es' ? 'Ticket creado correctamente' : 'Ticket created successfully');
      onClose();
      resetForm();
    },
    onError: () => {
      toast.error(language === 'es' ? 'Error al crear ticket' : 'Error creating ticket');
    }
  });

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploadedUrls.push(file_url);
      }
      setAttachments([...attachments, ...uploadedUrls]);
      toast.success(language === 'es' ? 'Archivos subidos' : 'Files uploaded');
    } catch (error) {
      toast.error(language === 'es' ? 'Error subiendo archivos' : 'Error uploading files');
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (url) => {
    setAttachments(attachments.filter(a => a !== url));
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      type: "soporte_cliente",
      priority: "media",
      related_professional_id: ""
    });
    setAttachments([]);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.description) {
      toast.error(language === 'es' ? 'Completa todos los campos' : 'Complete all fields');
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {language === 'es' ? 'Crear Nuevo Ticket' : 'Create New Ticket'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <Label>{language === 'es' ? 'Título *' : 'Title *'}</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder={language === 'es' ? "Ej: Problema con pago de factura" : "E.g.: Invoice payment issue"}
              className="mt-2"
            />
          </div>

          <div>
            <Label>{language === 'es' ? 'Tipo de ticket *' : 'Ticket type *'}</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({...formData, type: value})}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(typeConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {language === 'es' ? config.label_es : config.label_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{language === 'es' ? 'Prioridad' : 'Priority'}</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => setFormData({...formData, priority: value})}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baja">{language === 'es' ? 'Baja' : 'Low'}</SelectItem>
                <SelectItem value="media">{language === 'es' ? 'Media' : 'Medium'}</SelectItem>
                <SelectItem value="alta">{language === 'es' ? 'Alta' : 'High'}</SelectItem>
                <SelectItem value="urgente">{language === 'es' ? 'Urgente' : 'Urgent'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {professionals.length > 0 && (
            <div>
              <Label>{language === 'es' ? 'Profesional relacionado (opcional)' : 'Related professional (optional)'}</Label>
              <Select
                value={formData.related_professional_id}
                onValueChange={(value) => setFormData({...formData, related_professional_id: value})}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder={language === 'es' ? "Seleccionar..." : "Select..."} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>{language === 'es' ? 'Ninguno' : 'None'}</SelectItem>
                  {professionals.map((prof) => (
                    <SelectItem key={prof.id} value={prof.id}>
                      {prof.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>{language === 'es' ? 'Descripción detallada *' : 'Detailed description *'}</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder={language === 'es' 
                ? "Describe tu problema o solicitud con el mayor detalle posible..."
                : "Describe your problem or request in as much detail as possible..."}
              rows={6}
              className="mt-2"
            />
          </div>

          <div>
            <Label>{language === 'es' ? 'Archivos adjuntos (opcional)' : 'Attachments (optional)'}</Label>
            <div className="mt-2">
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <Upload className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {uploading 
                    ? (language === 'es' ? 'Subiendo...' : 'Uploading...')
                    : (language === 'es' ? 'Subir archivos' : 'Upload files')}
                </span>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
              
              {attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {attachments.map((url, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-sm text-gray-700 truncate">
                        {url.split('/').pop()}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeAttachment(url)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {language === 'es' ? 'Cancelar' : 'Cancel'}
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {createMutation.isPending 
              ? (language === 'es' ? 'Creando...' : 'Creating...')
              : (language === 'es' ? 'Crear Ticket' : 'Create Ticket')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useLanguage } from "@/components/ui/LanguageSwitcher";

export default function SupportNewTicket() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "consulta_general",
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => navigate("/"));
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await base44.entities.Ticket.create({
        title: form.title,
        description: form.description,
        type: form.type,
        creator_id: user.id,
        creator_name: user.full_name || user.email,
        creator_type: "client",
        status: "abierto",
        priority: "media",
      });

      navigate("/soporte");
    } catch (error) {
      console.error("Error creating ticket:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Button
        variant="ghost"
        onClick={() => navigate("/soporte")}
        className="mb-6 gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Crear nuevo ticket de soporte</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Asunto *</Label>
              <Input
                id="title"
                placeholder="Describe brevemente tu problema"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo de solicitud *</Label>
              <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value })}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consulta_general">Consulta general</SelectItem>
                  <SelectItem value="problema_pago">Problema de pago</SelectItem>
                  <SelectItem value="problema_trabajo">Problema con un trabajo</SelectItem>
                  <SelectItem value="reclamo">Reclamo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción detallada *</Label>
              <Textarea
                id="description"
                placeholder="Cuéntanos los detalles de tu problema..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
                rows={6}
                className="resize-none"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/soporte")}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Crear ticket
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
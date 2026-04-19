import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, ShieldX, Clock, Eye, X, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function VerificationRequests() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [filter, setFilter] = useState("pending");

  const { data: verifications = [], isLoading } = useQuery({
    queryKey: ["admin_verifications", filter],
    queryFn: () => filter === "all"
      ? base44.entities.IdentityVerification.list("-created_date", 100)
      : base44.entities.IdentityVerification.filter({ status: filter }, "-created_date", 100),
    staleTime: 30000,
  });

  const approveMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.IdentityVerification.update(id, {
        status: "approved",
        reviewed_date: new Date().toISOString(),
      });
      // Notificar al usuario
      const v = verifications.find(v => v.id === id);
      if (v?.user_email) {
        await base44.integrations.Core.SendEmail({
          to: v.user_email,
          subject: "✅ Tu identidad ha sido verificada - MisAutónomos",
          body: `<p>Hola ${v.user_name || ""},</p><p>Tu identidad ha sido verificada correctamente. Ya puedes dejar reseñas y aparecerás con el badge de <strong>usuario verificado</strong> en la plataforma.</p><p>Gracias,<br>El equipo de MisAutónomos</p>`,
          from_name: "MisAutónomos"
        }).catch(() => {});
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_verifications"] });
      setSelected(null);
      toast.success("Verificación aprobada");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }) => {
      await base44.entities.IdentityVerification.update(id, {
        status: "rejected",
        rejection_reason: reason,
        reviewed_date: new Date().toISOString(),
      });
      const v = verifications.find(v => v.id === id);
      if (v?.user_email) {
        await base44.integrations.Core.SendEmail({
          to: v.user_email,
          subject: "❌ Verificación de identidad rechazada - MisAutónomos",
          body: `<p>Hola ${v.user_name || ""},</p><p>Tu solicitud de verificación de identidad ha sido rechazada.</p><p><strong>Motivo:</strong> ${reason || "Documentos no válidos o ilegibles"}</p><p>Puedes volver a intentarlo desde tu perfil.</p><p>Gracias,<br>El equipo de MisAutónomos</p>`,
          from_name: "MisAutónomos"
        }).catch(() => {});
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_verifications"] });
      setSelected(null);
      setRejectReason("");
      toast.success("Verificación rechazada");
    },
  });

  const pending = verifications.filter(v => v.status === "pending").length;

  const statusBadge = (status) => {
    if (status === "approved") return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs">Aprobada</Badge>;
    if (status === "rejected") return <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">Rechazada</Badge>;
    return <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">Pendiente</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-900">Verificaciones de identidad</h2>
          {pending > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pending}</span>
          )}
        </div>
        <div className="flex gap-1 ml-auto">
          {["pending", "approved", "rejected", "all"].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${filter === f ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {f === "pending" ? "Pendientes" : f === "approved" ? "Aprobadas" : f === "rejected" ? "Rechazadas" : "Todas"}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500 text-sm">Cargando...</div>
      ) : verifications.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <ShieldCheck className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No hay verificaciones {filter !== "all" ? `con estado "${filter}"` : ""}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {verifications.map((v) => (
            <div key={v.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-700 flex-shrink-0">
                  {(v.user_name || v.user_email || "?")[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{v.user_name || "—"}</p>
                  <p className="text-xs text-gray-500 truncate">{v.user_email}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {format(new Date(v.created_date), "d MMM yyyy 'a las' HH:mm", { locale: es })} · {v.document_type?.toUpperCase()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {statusBadge(v.status)}
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => setSelected(v)}>
                  <Eye className="w-3.5 h-3.5" /> Revisar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de revisión */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">{selected.user_name || "Usuario"}</h3>
                <p className="text-xs text-gray-500">{selected.user_email} · {selected.document_type?.toUpperCase()}</p>
              </div>
              <div className="flex items-center gap-2">
                {statusBadge(selected.status)}
                <button onClick={() => setSelected(null)} className="p-1 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Frontal del documento</p>
                  <a href={selected.document_front_url} target="_blank" rel="noopener noreferrer">
                    <img src={selected.document_front_url} className="w-full rounded-lg border object-cover max-h-48 hover:opacity-90 transition-opacity cursor-zoom-in" />
                  </a>
                </div>
                {selected.document_back_url && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Trasera del documento</p>
                    <a href={selected.document_back_url} target="_blank" rel="noopener noreferrer">
                      <img src={selected.document_back_url} className="w-full rounded-lg border object-cover max-h-48 hover:opacity-90 transition-opacity cursor-zoom-in" />
                    </a>
                  </div>
                )}
                <div className={selected.document_back_url ? "col-span-full sm:col-span-1" : ""}>
                  <p className="text-xs font-medium text-gray-500 mb-1">Selfie con documento</p>
                  <a href={selected.selfie_url} target="_blank" rel="noopener noreferrer">
                    <img src={selected.selfie_url} className="w-full rounded-lg border object-cover max-h-48 hover:opacity-90 transition-opacity cursor-zoom-in" />
                  </a>
                </div>
              </div>

              {selected.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  <strong>Motivo de rechazo:</strong> {selected.rejection_reason}
                </div>
              )}

              {selected.status === "pending" && (
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Motivo de rechazo (si aplica)</label>
                    <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                      placeholder="Ej: Documento ilegible, selfie no coincide..."
                      className="h-20 text-sm" />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => approveMutation.mutate(selected.id)}
                      disabled={approveMutation.isPending}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                      <Check className="w-4 h-4 mr-1" />
                      {approveMutation.isPending ? "Aprobando..." : "Aprobar"}
                    </Button>
                    <Button onClick={() => rejectMutation.mutate({ id: selected.id, reason: rejectReason })}
                      disabled={rejectMutation.isPending}
                      variant="destructive" className="flex-1">
                      <X className="w-4 h-4 mr-1" />
                      {rejectMutation.isPending ? "Rechazando..." : "Rechazar"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
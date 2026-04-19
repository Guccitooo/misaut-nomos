import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, MessageSquare, Flag, Reply, ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";
import { useIdentityVerification } from "@/components/verification/IdentityVerificationWidget";
import { Badge } from "@/components/ui/badge";
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
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/components/ui/LanguageSwitcher";
import { toast } from "sonner";

// ── Sub-componente: Formulario de valoración ──────────────────────────────────
function ReviewForm({ professionalId, currentUser, existingReview, onSuccess }) {
  const [ratings, setRatings] = useState({
    rapidez: existingReview?.rapidez || 0,
    comunicacion: existingReview?.comunicacion || 0,
    calidad: existingReview?.calidad || 0,
    precio_satisfaccion: existingReview?.precio_satisfaccion || 0,
  });
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const LABELS = {
    rapidez: "Rapidez",
    comunicacion: "Comunicación",
    calidad: "Calidad del trabajo",
    precio_satisfaccion: "Relación calidad/precio",
  };

  const avgRating = Math.round(
    (ratings.rapidez + ratings.comunicacion + ratings.calidad + ratings.precio_satisfaccion) / 4
  );

  const StarInput = ({ field }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => setRatings((r) => ({ ...r, [field]: s }))}
          className="focus:outline-none"
        >
          <Star
            className={`w-6 h-6 transition-colors ${
              s <= ratings[field] ? "fill-amber-400 text-amber-400" : "text-gray-300 hover:text-amber-300"
            }`}
          />
        </button>
      ))}
    </div>
  );

  const handleSubmit = async () => {
    if (Object.values(ratings).some((r) => r === 0)) {
      toast.error("Por favor valora todos los aspectos");
      return;
    }
    setSubmitting(true);
    try {
      // Comprobar si el usuario tiene verificación aprobada
      let clientVerified = false;
      try {
        const verifs = await base44.entities.IdentityVerification.filter({ user_id: currentUser.id });
        clientVerified = verifs[0]?.status === "approved";
      } catch {}

      const data = {
        professional_id: professionalId,
        client_id: currentUser.id,
        client_name: currentUser.full_name || currentUser.email?.split("@")[0],
        rating: avgRating,
        rapidez: ratings.rapidez,
        comunicacion: ratings.comunicacion,
        calidad: ratings.calidad,
        precio_satisfaccion: ratings.precio_satisfaccion,
        comment: comment.trim(),
        is_verified: true,
        client_verified: clientVerified,
      };
      if (existingReview) {
        await base44.entities.Review.update(existingReview.id, data);
      } else {
        await base44.entities.Review.create(data);
        // Actualizar media en el perfil
        const allReviews = await base44.entities.Review.filter({ professional_id: professionalId });
        const total = allReviews.length;
        const avg = allReviews.reduce((s, r) => s + (r.rating || 0), 0) / total;
        const profiles = await base44.entities.ProfessionalProfile.filter({ user_id: professionalId });
        if (profiles[0]) {
          await base44.entities.ProfessionalProfile.update(profiles[0].id, {
            average_rating: Math.round(avg * 10) / 10,
            total_reviews: total,
          });
        }
      }
      queryClient.invalidateQueries({ queryKey: ["reviews", professionalId] });
      toast.success("¡Valoración enviada! Gracias por tu opinión.");
      onSuccess?.();
    } catch (err) {
      toast.error("Error al enviar la valoración. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-4">
      <p className="font-semibold text-gray-900 text-sm">
        {existingReview ? "Editar tu valoración" : "Dejar una valoración"}
      </p>
      <div className="space-y-3">
        {Object.entries(LABELS).map(([field, label]) => (
          <div key={field} className="flex items-center justify-between gap-3">
            <span className="text-sm text-gray-700 w-40 flex-shrink-0">{label}</span>
            <StarInput field={field} />
          </div>
        ))}
      </div>
      <Textarea
        placeholder="Describe tu experiencia (opcional)..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="h-24 text-sm bg-white"
        maxLength={500}
      />
      <p className="text-xs text-gray-400 text-right">{comment.length}/500</p>
      <Button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold"
      >
        {submitting ? "Enviando..." : existingReview ? "Actualizar valoración" : "Enviar valoración"}
      </Button>
    </div>
  );
}

// ── Sub-componente: Respuesta del autónomo ────────────────────────────────────
function ProfessionalResponseBox({ review, isOwner, professionalId }) {
  const [editing, setEditing] = useState(false);
  const [response, setResponse] = useState(review.professional_response || "");
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const handleSave = async () => {
    if (!response.trim()) return;
    setSaving(true);
    try {
      await base44.entities.Review.update(review.id, { professional_response: response.trim() });
      queryClient.invalidateQueries({ queryKey: ["reviews", professionalId] });
      setEditing(false);
      toast.success("Respuesta guardada");
    } catch {
      toast.error("Error al guardar la respuesta");
    } finally {
      setSaving(false);
    }
  };

  if (review.professional_response && !editing) {
    return (
      <div className="mt-3 ml-8 bg-blue-50 border border-blue-100 rounded-lg p-3">
        <p className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">
          <Reply className="w-3 h-3" /> Respuesta del profesional
        </p>
        <p className="text-sm text-gray-700">{review.professional_response}</p>
        {isOwner && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-blue-600 mt-1 hover:underline"
          >
            Editar respuesta
          </button>
        )}
      </div>
    );
  }

  if (isOwner) {
    return editing || !review.professional_response ? (
      <div className="mt-3 ml-8 space-y-2">
        {!editing && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditing(true)}
            className="text-xs h-8"
          >
            <Reply className="w-3 h-3 mr-1" />
            Responder a esta valoración
          </Button>
        )}
        {editing && (
          <>
            <Textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Escribe tu respuesta pública..."
              className="text-sm h-20"
              maxLength={400}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={saving} className="h-8 text-xs">
                {saving ? "Guardando..." : "Publicar respuesta"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)} className="h-8 text-xs">
                Cancelar
              </Button>
            </div>
          </>
        )}
      </div>
    ) : null;
  }

  return null;
}

// ── Botón de valorar con gate de verificación ────────────────────────────────
function ReviewButton({ currentUser, myReview, showForm, setShowForm }) {
  const { data: verification } = useIdentityVerification(currentUser?.id);
  const isVerified = verification?.status === "approved";

  if (!isVerified) {
    return (
      <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 text-xs text-amber-700">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Verifica tu identidad para valorar</span>
        <a href="/mi-perfil" className="font-semibold underline hover:no-underline ml-1">→</a>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant={myReview ? "outline" : "default"}
      className={myReview ? "h-8 text-xs" : "h-8 text-xs bg-amber-500 hover:bg-amber-600 text-white"}
      onClick={() => setShowForm((v) => !v)}
    >
      <Star className="w-3 h-3 mr-1" />
      {myReview ? "Mi valoración" : "Valorar"}
    </Button>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function ReviewSection({ reviews, professionalId, currentUser }) {
  const [reportingReviewId, setReportingReviewId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const isOwner = currentUser?.id === professionalId;
  const isClient = currentUser?.user_type === "client";

  // Comprueba si el cliente ya dejó reseña
  const myReview = reviews?.find((r) => r.client_id === currentUser?.id);

  const calculateStats = () => {
    if (!reviews || reviews.length === 0) return null;
    const count = reviews.length;
    const sum = (field) => reviews.reduce((a, r) => a + (r[field] || 0), 0);
    return {
      overall: sum("rating") / count,
      rapidez: sum("rapidez") / count,
      comunicacion: sum("comunicacion") / count,
      calidad: sum("calidad") / count,
      precio: sum("precio_satisfaccion") / count,
    };
  };

  const stats = calculateStats();

  const reportReviewMutation = useMutation({
    mutationFn: async (reviewId) => {
      await base44.entities.Review.update(reviewId, { is_reported: true });
      await base44.integrations.Core.SendEmail({
        to: "administrador@misautonomos.es",
        subject: "⚠️ Opinión reportada - MisAutónomos",
        body: `Una opinión ha sido reportada. Review ID: ${reviewId}. Reportado por: ${currentUser?.email}`,
        from_name: "MisAutónomos",
      }).catch(() => {});
    },
    onSuccess: () => {
      setReportingReviewId(null);
      queryClient.invalidateQueries({ queryKey: ["reviews", professionalId] });
      toast.success("Reseña reportada. La revisaremos pronto.");
    },
  });

  const StatBar = ({ label, value, color }) => (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-semibold text-gray-900">{value.toFixed(1)}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${(value / 5) * 100}%` }} />
      </div>
    </div>
  );

  const visibleReviews = reviews?.filter((r) => !r.is_reported) || [];

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            <span className="font-semibold text-gray-900">
              {t("reviewsTitle")} ({visibleReviews.length})
            </span>
          </div>

          {/* CTA para clientes verificados */}
          {isClient && currentUser && !isOwner && (
            <ReviewButton currentUser={currentUser} myReview={myReview} showForm={showForm} setShowForm={setShowForm} />
          )}
        </div>

        {/* Formulario de valoración */}
        {showForm && isClient && currentUser && !isOwner && (
          <ReviewForm
            professionalId={professionalId}
            currentUser={currentUser}
            existingReview={myReview}
            onSuccess={() => setShowForm(false)}
          />
        )}

        {/* Resumen estadístico */}
        {stats && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
            <div className="flex items-center gap-4 mb-4">
              <div>
                <div className="text-4xl font-bold text-gray-900">{stats.overall.toFixed(1)}</div>
                <div className="flex items-center gap-0.5 mt-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${s <= stats.overall ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-1">{visibleReviews.length} valoraciones</p>
              </div>
            </div>
            <div className="space-y-2">
              <StatBar label="Rapidez" value={stats.rapidez} color="bg-blue-500" />
              <StatBar label="Comunicación" value={stats.comunicacion} color="bg-green-500" />
              <StatBar label="Calidad" value={stats.calidad} color="bg-purple-500" />
              <StatBar label="Precio/satisfacción" value={stats.precio} color="bg-orange-500" />
            </div>
          </div>
        )}

        {/* Lista de reseñas */}
        {visibleReviews.length > 0 ? (
          <div className="space-y-4">
            {visibleReviews.map((review) => (
              <article key={review.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-blue-600 text-white text-sm">
                      {review.client_name?.charAt(0).toUpperCase() || "C"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 flex items-center gap-1.5">
                      {review.client_name}
                      {review.client_verified && (
                        <span title="Identidad verificada" className="inline-flex items-center">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        </span>
                      )}
                    </p>
                      <div className="flex items-center gap-1.5">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${s <= review.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">
                          {format(new Date(review.created_date), "d MMMM yyyy", { locale: es })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {review.is_verified && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        Verificada
                      </Badge>
                    )}
                    {currentUser && review.client_id !== currentUser.id && !review.is_reported && (
                      <button
                        onClick={() => setReportingReviewId(review.id)}
                        className="p-1 rounded hover:bg-red-50"
                        title="Reportar reseña inapropiada"
                      >
                        <Flag className="w-3.5 h-3.5 text-gray-300 hover:text-red-500" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-ratings */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2">
                  {[
                    { label: "Rapidez", val: review.rapidez },
                    { label: "Comunicación", val: review.comunicacion },
                    { label: "Calidad", val: review.calidad },
                    { label: "Precio", val: review.precio_satisfaccion },
                  ].map(({ label, val }) =>
                    val ? (
                      <span key={label} className="text-xs text-gray-500">
                        {label}: <strong className="text-gray-800">{val}/5</strong>
                      </span>
                    ) : null
                  )}
                </div>

                {review.comment && (
                  <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
                )}

                {/* Respuesta del profesional */}
                <ProfessionalResponseBox
                  review={review}
                  isOwner={isOwner}
                  professionalId={professionalId}
                />
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900 mb-1">Sin valoraciones aún</h3>
            <p className="text-sm text-gray-500">Sé el primero en valorar a este profesional</p>
          </div>
        )}
      </div>

      <AlertDialog open={!!reportingReviewId} onOpenChange={() => setReportingReviewId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Reportar esta reseña?</AlertDialogTitle>
            <AlertDialogDescription>
              Si crees que esta reseña contiene contenido inapropiado, nuestro equipo la revisará.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => reportReviewMutation.mutate(reportingReviewId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Reportar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
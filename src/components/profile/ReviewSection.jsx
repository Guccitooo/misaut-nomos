import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, MessageSquare, AlertCircle, Flag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

export default function ReviewSection({ reviews, professionalId, currentUser }) {
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState(null);
  const [reportingReview, setReportingReview] = useState(null);
  const queryClient = useQueryClient();

  const createReviewMutation = useMutation({
    mutationFn: async (reviewData) => {
      // Check if user has chatted with professional
      const conversationId = [currentUser.id, professionalId].sort().join('_');
      const messages = await base44.entities.Message.filter({
        conversation_id: conversationId
      });

      if (messages.length === 0) {
        throw new Error("Debes contactar primero con este autónomo antes de dejar una opinión");
      }

      // Check if user already reviewed
      const existingReviews = await base44.entities.Review.filter({
        professional_id: professionalId,
        client_id: currentUser.id
      });

      if (existingReviews.length > 0) {
        throw new Error("Ya has dejado una opinión para este autónomo");
      }

      return base44.entities.Review.create(reviewData);
    },
    onSuccess: async () => {
      // Update profile rating
      const allReviews = await base44.entities.Review.filter({
        professional_id: professionalId
      });
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      
      const profiles = await base44.entities.ProfessionalProfile.filter({
        user_id: professionalId
      });
      
      if (profiles[0]) {
        await base44.entities.ProfessionalProfile.update(profiles[0].id, {
          average_rating: avgRating,
          total_reviews: allReviews.length
        });
      }

      // Send notification to professional
      const professionalUser = await base44.entities.User.filter({ id: professionalId });
      if (professionalUser[0]) {
        await base44.integrations.Core.SendEmail({
          to: professionalUser[0].email,
          subject: "Nueva opinión en tu perfil - milautonomos",
          body: `Hola,

Has recibido una nueva opinión en tu perfil de milautonomos.

Calificación: ${rating} estrellas
Comentario: ${comment}

Puedes ver todas tus opiniones en tu perfil profesional.

Gracias,
Equipo milautonomos`,
          from_name: "milautonomos"
        });
      }

      queryClient.invalidateQueries({ queryKey: ['reviews', professionalId] });
      setShowForm(false);
      setComment("");
      setRating(5);
      setError(null);
    },
    onError: (err) => {
      setError(err.message);
    }
  });

  const reportReviewMutation = useMutation({
    mutationFn: async (reviewId) => {
      await base44.entities.Review.update(reviewId, { is_reported: true });
      
      // Send email to admin
      await base44.integrations.Core.SendEmail({
        to: "admin@milautonomos.com",
        subject: "⚠️ Opinión reportada - milautonomos",
        body: `Una opinión ha sido reportada por un usuario.

Review ID: ${reviewId}
Reportado por: ${currentUser.email}

Por favor, revisa esta opinión en el dashboard de administración.

Gracias,
Sistema milautonomos`,
        from_name: "milautonomos"
      });
    },
    onSuccess: () => {
      setReportingReview(null);
      queryClient.invalidateQueries({ queryKey: ['reviews', professionalId] });
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      base44.auth.redirectToLogin();
      return;
    }

    createReviewMutation.mutate({
      professional_id: professionalId,
      client_id: currentUser.id,
      client_name: currentUser.full_name || currentUser.email,
      rating,
      comment,
      is_verified: true,
      is_reported: false
    });
  };

  return (
    <>
      <Card className="shadow-lg border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-700" />
              Opiniones ({reviews.length})
            </CardTitle>
            {currentUser && currentUser.user_type === "client" && (
              <Button
                variant="outline"
                onClick={() => setShowForm(!showForm)}
                className="border-blue-700 text-blue-700 hover:bg-blue-50"
              >
                <Star className="w-4 h-4 mr-2" />
                Dejar opinión
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {showForm && (
            <form onSubmit={handleSubmit} className="p-6 bg-blue-50 rounded-xl space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tu valoración
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tu comentario
                </label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Comparte tu experiencia..."
                  className="h-32"
                  required
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setError(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createReviewMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createReviewMutation.isPending ? "Enviando..." : "Publicar opinión"}
                </Button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-start gap-4">
                  <Avatar>
                    <AvatarFallback className="bg-blue-100 text-blue-900">
                      {review.client_name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{review.client_name}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(review.created_date), "d MMMM yyyy", { locale: es })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= review.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        {currentUser && review.client_id !== currentUser.id && !review.is_reported && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setReportingReview(review)}
                            title="Reportar opinión"
                          >
                            <Flag className="w-4 h-4 text-gray-400 hover:text-red-500" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                    <div className="flex gap-2 mt-2">
                      {review.is_verified && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          Opinión verificada
                        </Badge>
                      )}
                      {review.is_reported && (
                        <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                          Reportada
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {reviews.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">Sin opiniones por ahora</p>
                <p className="text-sm">Sé el primero en dejar una opinión</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Dialog */}
      <AlertDialog open={!!reportingReview} onOpenChange={() => setReportingReview(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Reportar esta opinión?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta opinión será marcada para revisión por el equipo de administración. 
              Solo reporta opiniones que contengan contenido inapropiado, spam o información falsa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => reportReviewMutation.mutate(reportingReview.id)}
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
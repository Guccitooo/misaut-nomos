import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, MessageSquare, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function ReviewSection({ reviews, professionalId, currentUser }) {
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState(null);
  const queryClient = useQueryClient();

  const createReviewMutation = useMutation({
    mutationFn: async (reviewData) => {
      // Check if user has chatted with professional
      const conversationId = [currentUser.id, professionalId].sort().join('_');
      const messages = await base44.entities.Message.filter({
        conversation_id: conversationId
      });

      if (messages.length === 0) {
        throw new Error("Vous devez d'abord contacter ce professionnel avant de laisser un avis");
      }

      // Check if user already reviewed
      const existingReviews = await base44.entities.Review.filter({
        professional_id: professionalId,
        client_id: currentUser.id
      });

      if (existingReviews.length > 0) {
        throw new Error("Vous avez déjà laissé un avis pour ce professionnel");
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
      is_verified: true
    });
  };

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-900" />
            Avis clients ({reviews.length})
          </CardTitle>
          {currentUser && currentUser.user_type === "client" && (
            <Button
              variant="outline"
              onClick={() => setShowForm(!showForm)}
              className="border-blue-900 text-blue-900 hover:bg-blue-50"
            >
              <Star className="w-4 h-4 mr-2" />
              Laisser un avis
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
                Votre note
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
                Votre commentaire
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Partagez votre expérience..."
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
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={createReviewMutation.isPending}
                className="bg-blue-900 hover:bg-blue-800"
              >
                {createReviewMutation.isPending ? "Envoi..." : "Publier l'avis"}
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
                        {format(new Date(review.created_date), "d MMMM yyyy", { locale: fr })}
                      </p>
                    </div>
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
                  </div>
                  <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                  {review.is_verified && (
                    <Badge variant="outline" className="mt-2 text-xs bg-green-50 text-green-700 border-green-200">
                      Avis vérifié
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}

          {reviews.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">Aucun avis pour le moment</p>
              <p className="text-sm">Soyez le premier à laisser un avis</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
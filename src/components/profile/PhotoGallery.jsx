import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Image as ImageIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import OptimizedImage from "../ui/OptimizedImage";
import { useLanguage } from "../ui/LanguageSwitcher";

export default function PhotoGallery({ photos }) {
  const { t } = useLanguage();
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  if (!photos || photos.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-700" />
            {t('photoGallery')} ({photos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((photo, idx) => (
              <div
                key={idx}
                className="aspect-square relative overflow-hidden rounded-lg cursor-pointer hover:opacity-90 transition-opacity group"
                onClick={() => setSelectedPhoto(photo)}
              >
                <OptimizedImage
                  src={photo}
                  alt={`Foto ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl">
          {selectedPhoto && (
            <OptimizedImage
              src={selectedPhoto}
              alt="Foto ampliada"
              className="w-full h-auto rounded-lg"
              priority={true}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
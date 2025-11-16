import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import OptimizedImage from "../ui/OptimizedImage";
import { useLanguage } from "../ui/LanguageSwitcher";

export default function PhotoGallery({ photos = [] }) {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const { t } = useLanguage();

  if (!photos || photos.length === 0) {
    return (
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-700" />
            {t('workGallery')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">{t('noPhotosAdded')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-700" />
            {t('workGallery')} ({photos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4" role="list" aria-label="Galería de trabajos">
            {photos.map((photo, idx) => (
              <div
                key={idx}
                className="relative group cursor-pointer overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow"
                onClick={() => setSelectedPhoto(photo)}
                role="listitem"
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedPhoto(photo);
                  }
                }}
                aria-label={`Ver foto ${idx + 1} ampliada`}
              >
                <OptimizedImage
                  src={photo}
                  alt={`Trabajo realizado - Foto ${idx + 1}`}
                  className="w-full h-40 transition-transform group-hover:scale-110 duration-300"
                  objectFit="cover"
                  width={300}
                  height={160}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <p className="text-white font-semibold text-sm">
                    {t('clickToAddPhoto')}
                  </p>
                </div>
                {idx === 0 && (
                  <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded font-semibold">
                    {t('mainPhoto')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl p-0">
          <div className="relative">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full z-10 transition-colors"
              aria-label={t('close')}
            >
              <X className="w-5 h-5" />
            </button>
            {selectedPhoto && (
              <OptimizedImage
                src={selectedPhoto}
                alt="Trabajo realizado - Vista ampliada"
                className="w-full max-h-[80vh] rounded-lg"
                objectFit="contain"
                priority={true}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
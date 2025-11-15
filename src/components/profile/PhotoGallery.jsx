
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, X, Eye } from 'lucide-react'; // Added Eye import
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import OptimizedImage from '../ui/OptimizedImage';
import { useLanguage } from "../ui/LanguageSwitcher"; // Added useLanguage import

export default function PhotoGallery({ photos = [] }) { // Removed default prop assignment from here
  const { t } = useLanguage(); // Added useLanguage hook
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  if (!photos || photos.length === 0) {
    return (
      <Card className="shadow-lg border-0">
        <CardContent className="p-12 text-center"> {/* Updated padding */}
          <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" /> {/* Updated icon size and margin */}
          <p className="text-gray-600">{t('noPhotosYet')}</p> {/* Changed text to use translation key and updated text color */}
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
            {t('workGallery')} {/* Changed text to use translation key */}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((photo, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedPhoto(photo)}
                className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group" // Reordered classes for clarity
              >
                <OptimizedImage
                  src={photo}
                  alt={`${t('workGallery')} ${idx + 1}`} // Updated alt text to use translation key
                  className="w-full h-full hover:scale-110 transition-transform duration-300" // Updated hover effect class
                  objectFit="cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"> {/* Updated overlay styles */}
                  <Eye className="w-8 h-8 text-white" /> {/* Changed icon to Eye and updated size */}
                </div>
                {/* Removed the 'Principal' badge */}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal para ver foto en grande */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <div className="relative">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
              aria-label={t('close')} // Added translation for accessibility label
            >
              <X className="w-5 h-5" />
            </button>
            {selectedPhoto && (
              <OptimizedImage
                src={selectedPhoto}
                alt={t('expandedView')} // Added translation for alt text
                className="w-full max-h-[80vh]"
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

import React from "react";
import { X } from "lucide-react";

/**
 * Modal responsive:
 * - Móvil: ocupa toda la pantalla, aparece desde abajo (bottom-sheet style)
 * - Desktop (md+): modal centrado con max-w-3xl
 */
export default function ResponsiveModal({ isOpen, onClose, title, children, footer, maxWidth = "md:max-w-3xl" }) {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal container */}
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center pointer-events-none">
        <div
          className={`bg-white w-full ${maxWidth} md:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col pointer-events-auto`}
          style={{ maxHeight: '95dvh' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header fijo */}
          <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-gray-100 flex-shrink-0">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 truncate pr-2">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 flex-shrink-0 transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Contenido scrollable */}
          <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 min-h-0">
            {children}
          </div>

          {/* Footer fijo */}
          {footer && (
            <div
              className="border-t border-gray-100 px-4 md:px-6 py-3 flex flex-wrap gap-2 flex-shrink-0"
              style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))' }}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
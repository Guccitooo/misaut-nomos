import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

/**
 * Botón Atrás nativo (estilo iOS/Android).
 * Úsalo en páginas de detalle: <NativeBackButton fallback="/dashboard" />
 */
export default function NativeBackButton({ fallback = "/", label = "Atrás" }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallback, { replace: true });
    }
  };

  return (
    <button
      onClick={handleBack}
      className="flex items-center gap-1 text-blue-600 font-medium"
      style={{
        background: "none",
        border: "none",
        padding: "8px 0",
        fontSize: "17px",
        touchAction: "manipulation",
        cursor: "pointer",
      }}
      aria-label="Volver atrás"
    >
      <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
      <span>{label}</span>
    </button>
  );
}
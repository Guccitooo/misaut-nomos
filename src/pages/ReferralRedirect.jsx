import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

export default function ReferralRedirect() {
  const { code } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const profiles = await base44.entities.ProfessionalProfile.filter({ referral_code: code });
        if (profiles.length > 0) {
          localStorage.setItem("referral_code", code);
          localStorage.setItem("referral_referrer_name", profiles[0].business_name || "");
          localStorage.setItem("referral_expires", String(Date.now() + 30 * 24 * 60 * 60 * 1000));
        }
      } catch {
        // si falla, redirigir igual
      }
      navigate("/", { replace: true });
    })();
  }, [code]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
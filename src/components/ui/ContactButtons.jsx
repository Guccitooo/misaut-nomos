import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle, MessageSquare } from "lucide-react";
import PhoneModal from "./PhoneModal";

const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const formatPhoneForCall = (phone) => {
  if (!phone) return null;
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (!cleaned.startsWith('+')) {
    cleaned = '+34' + cleaned;
  }
  return cleaned;
};

const formatPhoneForWhatsApp = (phone) => {
  if (!phone) return null;
  let cleaned = phone.replace(/\D/g, '');
  if (!cleaned.startsWith('34') && cleaned.length === 9) {
    cleaned = '34' + cleaned;
  }
  return cleaned;
};

const formatPhoneForDisplay = (phone) => {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('34')) {
    cleaned = cleaned.substring(2);
  }
  if (cleaned.length === 9) {
    return `${cleaned.substring(0, 3)} ${cleaned.substring(3, 5)} ${cleaned.substring(5, 7)} ${cleaned.substring(7, 9)}`;
  }
  return phone;
};

export default function ContactButtons({ 
  phone, 
  businessName, 
  enablePhone = false, 
  enableWhatsApp = false,
  enableChat = true,
  onChatClick,
  size = "sm",
  layout = "grid" // "grid" o "single"
}) {
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const isMobile = isMobileDevice();

  const handlePhoneClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isMobile) {
      window.location.href = `tel:${formatPhoneForCall(phone)}`;
      return;
    }
    
    setShowPhoneModal(true);
  };

  const handleWhatsAppClick = (e) => {
    e.stopPropagation();
    
    const whatsappPhone = formatPhoneForWhatsApp(phone);
    
    if (isMobile) {
      window.open(`https://wa.me/${whatsappPhone}`, '_blank');
    } else {
      window.open(`https://web.whatsapp.com/send?phone=${whatsappPhone}`, '_blank');
    }
  };

  const handleChatClick = (e) => {
    e.stopPropagation();
    if (onChatClick) {
      onChatClick();
    }
  };

  // Si solo hay chat interno
  if (!phone || (!enablePhone && !enableWhatsApp)) {
    return (
      <Button
        size={size}
        className="w-full text-xs h-10 bg-blue-600 hover:bg-blue-700"
        onClick={handleChatClick}
      >
        <MessageSquare className="w-4 h-4 mr-2" />
        Chat directo
      </Button>
    );
  }

  // Layout de grid (para cards)
  if (layout === "grid") {
    return (
      <>
        <div className="grid grid-cols-3 gap-1.5">
          {enablePhone && (
            <Button 
              variant="outline" 
              size={size}
              className="w-full text-xs h-10 hover:bg-blue-50 hover:border-blue-600 hover:text-blue-600"
              onClick={handlePhoneClick}
              aria-label={`Llamar a ${businessName}`}
            >
              <Phone className="w-4 h-4" />
            </Button>
          )}
          
          {enableWhatsApp && (
            <Button 
              size={size}
              className="w-full text-xs h-10 bg-green-600 hover:bg-green-700"
              onClick={handleWhatsAppClick}
              aria-label={`WhatsApp a ${businessName}`}
            >
              <MessageCircle className="w-4 h-4" />
            </Button>
          )}
          
          {enableChat && (
            <Button
              size={size}
              className="w-full text-xs h-10 bg-blue-600 hover:bg-blue-700"
              onClick={handleChatClick}
              aria-label={`Chatear con ${businessName}`}
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
          )}
        </div>

        {showPhoneModal && (
          <PhoneModal
            isOpen={showPhoneModal}
            onClose={() => setShowPhoneModal(false)}
            phoneNumber={formatPhoneForDisplay(phone)}
            businessName={businessName}
          />
        )}
      </>
    );
  }

  // Layout inline (para perfiles grandes)
  return (
    <>
      <div className="flex flex-wrap gap-3">
        {enablePhone && (
          <Button 
            variant="outline" 
            size="lg"
            className="flex-1 min-w-[140px] hover:bg-blue-50 hover:border-blue-600"
            onClick={handlePhoneClick}
          >
            <Phone className="w-5 h-5 mr-2" />
            Llamar
          </Button>
        )}
        
        {enableWhatsApp && (
          <Button 
            size="lg"
            className="flex-1 min-w-[140px] bg-green-600 hover:bg-green-700"
            onClick={handleWhatsAppClick}
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            WhatsApp
          </Button>
        )}
        
        {enableChat && (
          <Button
            size="lg"
            className="flex-1 min-w-[140px] bg-blue-600 hover:bg-blue-700"
            onClick={handleChatClick}
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            Chat directo
          </Button>
        )}
      </div>

      {showPhoneModal && (
        <PhoneModal
          isOpen={showPhoneModal}
          onClose={() => setShowPhoneModal(false)}
          phoneNumber={formatPhoneForDisplay(phone)}
          businessName={businessName}
        />
      )}
    </>
  );
}
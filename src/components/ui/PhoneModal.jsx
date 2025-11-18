import React, { useState, useEffect } from "react";
import { Phone, X } from "lucide-react";

export default function PhoneModal({ isOpen, onClose, phoneNumber, businessName, modalType = 'phone' }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleCopy = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await navigator.clipboard.writeText(phoneNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <style>
        {`
          .phone-modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.35);
            backdrop-filter: blur(3px);
            display: flex;
            justify-content: center;
            align-items: center;
            animation: fadeInModal 0.2s ease-out;
            z-index: 9999;
          }

          .phone-modal-box {
            background: #fff;
            padding: 28px 36px;
            border-radius: 16px;
            width: 100%;
            max-width: 380px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
            text-align: center;
            position: relative;
            animation: scaleIn 0.25s ease-out;
          }

          .phone-modal-close {
            position: absolute;
            top: 12px;
            right: 12px;
            background: transparent;
            border: none;
            cursor: pointer;
            padding: 6px;
            border-radius: 6px;
            transition: background 0.2s;
            color: #9ca3af;
            z-index: 10;
          }

          .phone-modal-close:hover {
            background: #f3f4f6;
            color: #4b5563;
          }

          .phone-icon-wrapper {
            width: 56px;
            height: 56px;
            background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 16px;
          }

          .phone-modal-title {
            font-size: 18px;
            font-weight: 600;
            color: #111827;
            margin-bottom: 8px;
          }

          .phone-modal-business {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 16px;
          }

          .phone-number-display {
            font-size: 24px;
            font-weight: 700;
            color: #1f2937;
            margin: 16px 0 20px;
            letter-spacing: 1px;
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          }

          .copy-btn {
            width: 100%;
            background: #f3f4f6;
            padding: 12px 18px;
            border-radius: 10px;
            border: none;
            cursor: pointer;
            font-weight: 600;
            font-size: 15px;
            transition: all 0.2s ease-out;
            color: #374151;
          }

          .copy-btn:hover {
            background: #e5e7eb;
            transform: translateY(-1px);
          }

          .copy-btn.copied {
            background: #10b981 !important;
            color: white !important;
          }

          .phone-info-text {
            margin-top: 16px;
            font-size: 13px;
            color: #9ca3af;
            line-height: 1.5;
          }

          @keyframes fadeInModal {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}
      </style>

      <div 
        className="phone-modal-overlay" 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }}
      >
        <div 
          className="phone-modal-box" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <button 
            className="phone-modal-close" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }} 
            aria-label="Cerrar"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="phone-icon-wrapper">
            <Phone className="w-7 h-7 text-white" />
          </div>

          <h2 className="phone-modal-title">Teléfono del profesional</h2>
          
          {businessName && (
            <p className="phone-modal-business">{businessName}</p>
          )}

          <div className="phone-number-display">{phoneNumber}</div>

          <button 
            className={`copy-btn ${copied ? 'copied' : ''}`} 
            onClick={handleCopy}
            type="button"
          >
            {copied ? "✓ Copiado" : "Copiar número"}
          </button>

          <p className="phone-info-text">
            Usa tu móvil para llamar a este profesional
          </p>
        </div>
      </div>
    </>
  );
}
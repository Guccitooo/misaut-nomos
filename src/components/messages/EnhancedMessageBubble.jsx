import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Reply, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EnhancedMessageBubble({ 
  message, 
  isOwn, 
  onReply,
  onMarkAsRead
}) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef(null);
  const [showActions, setShowActions] = useState(false);

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAudioDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayAudio = () => {
    if (audioRef.current) {
      if (isPlayingAudio) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlayingAudio(!isPlayingAudio);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setAudioProgress(progress);
    }
  };

  const handleAudioEnd = () => {
    setIsPlayingAudio(false);
    setAudioProgress(0);
  };

  // Marcar como leído
  useEffect(() => {
    if (!isOwn && message.is_read === false && !message.is_read) {
      const timer = setTimeout(() => {
        onMarkAsRead?.(message.id);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [message.id, isOwn, message.is_read, onMarkAsRead]);

  return (
    <div
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3 group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {showActions && !isOwn && (
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 mr-1 text-gray-600 hover:bg-gray-100"
          onClick={() => onReply?.(message)}
          title="Responder"
        >
          <Reply className="w-4 h-4" />
        </Button>
      )}

      <div
        className={`max-w-xs px-4 py-2 rounded-2xl ${
          isOwn
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-gray-200 text-gray-900 rounded-bl-none'
        }`}
      >
        {/* Respuesta citada */}
        {message.replyTo && (
          <div className={`text-xs mb-2 pb-2 border-b ${isOwn ? 'border-blue-400' : 'border-gray-300'}`}>
            <p className={`font-medium ${isOwn ? 'text-blue-100' : 'text-gray-600'}`}>
              Respondiendo a:
            </p>
            <p className={`italic ${isOwn ? 'text-blue-50' : 'text-gray-700'}`}>
              {message.replyTo.content}
            </p>
          </div>
        )}

        {/* Contenido del mensaje */}
        {message.type === 'text' && (
          <p className="text-sm break-words">{message.content}</p>
        )}

        {message.type === 'image' && message.imageData && (
          <img
            src={message.imageData}
            alt="Imagen"
            className="rounded-lg max-w-xs max-h-64 object-cover"
          />
        )}

        {message.type === 'audio' && message.audioData && (
          <div className="space-y-2 min-w-48">
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                className={`h-8 w-8 ${isOwn ? 'hover:bg-blue-500' : 'hover:bg-gray-300'}`}
                onClick={handlePlayAudio}
              >
                {isPlayingAudio ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
              <div className="flex-1">
                <div className="bg-black/20 rounded-full h-1 relative">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isOwn ? 'bg-blue-200' : 'bg-gray-400'
                    }`}
                    style={{ width: `${audioProgress}%` }}
                  />
                </div>
              </div>
              <span className="text-xs font-medium">
                {getAudioDuration(message.duration || 0)}
              </span>
            </div>
            <audio
              ref={audioRef}
              src={message.audioData}
              onTimeUpdate={handleAudioTimeUpdate}
              onEnded={handleAudioEnd}
              className="hidden"
            />
          </div>
        )}

        {/* Hora y estado de lectura */}
        <div className={`text-xs mt-1 flex items-center justify-end gap-1 ${
          isOwn ? 'text-blue-100' : 'text-gray-600'
        }`}>
          {formatTime(message.created_date)}
          {isOwn && (
            message.is_read ? (
              <span className="text-blue-200">✓✓</span>
            ) : (
              <span>✓</span>
            )
          )}
        </div>
      </div>
    </div>
  );
}
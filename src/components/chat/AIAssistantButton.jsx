import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, Sparkles } from 'lucide-react';
import AIAssistantChat from './AIAssistantChat';

export default function AIAssistantButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-40 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all hover:scale-105"
        size="icon"
        aria-label="Abrir asistente IA"
      >
        <div className="relative">
          <MessageSquare className="w-6 h-6" />
          <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-yellow-300" />
        </div>
      </Button>

      <AIAssistantChat 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
}
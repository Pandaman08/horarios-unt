"use client";

import React from 'react';
import { ChatMessage } from '@/services/ai/ChatbotService';
import { cn } from '@/lib/utils';

interface ChatWindowProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

export const ChatWindow = ({ messages, isLoading }: ChatWindowProps) => {
  return (
    <div className="flex flex-col h-full bg-background border rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 border-b bg-primary/5">
        <h3 className="font-semibold text-sm">Asistente UNT</h3>
        <p className="text-[10px] text-muted-foreground">Chatbot con IA para gestión de horarios</p>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm italic">¡Hola! Soy tu asistente académico. ¿En qué puedo ayudarte hoy?</p>
            </div>
          )}
          
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex flex-col max-w-[80%] rounded-lg p-3 text-sm",
                msg.role === 'user' 
                  ? "ml-auto bg-primary text-primary-foreground" 
                  : "mr-auto bg-muted"
              )}
            >
              <span className="whitespace-pre-wrap">{msg.content}</span>
              <span className="text-[10px] opacity-70 mt-1 self-end">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
          
          {isLoading && (
            <div className="mr-auto bg-muted rounded-lg p-3 text-sm animate-pulse">
              <span>Escribiendo...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

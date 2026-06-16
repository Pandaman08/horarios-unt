"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { MessageSquare, X, Send, Mic, MicOff, Volume2, VolumeX, Square, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatWindow } from './ChatWindow';
import { ChatHistorySidebar } from './ChatHistorySidebar';
import { useChat } from '@/hooks/useChat';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { ChatbotService } from '@/services/ai/ChatbotService';
import { cn } from '@/lib/utils';

export const ChatWidget = () => {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTtsEnabled, setIsTtsEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { 
    messages, 
    isLoading, 
    setIsLoading, 
    addMessage, 
    conversations, 
    activeConversationId,
    loadConversation,
    startNewChat,
    deleteConversation,
    isHydrated
  } = useChat(session?.user?.id);

  // No renderizar nada del chat hasta que esté hidratado para evitar bugs visuales
  if (!isHydrated && isOpen) return null;
  const { isListening, transcript, startListening, stopListening, isSupported, error: voiceError } = useVoiceRecognition();
  const pathname = usePathname();

  // Enviar inmediatamente cuando el transcript termine
  useEffect(() => {
    if (transcript && !isListening) {
      handleSend(transcript);
    }
  }, [transcript, isListening]);


  // Detener voz al cerrar o limpiar
  useEffect(() => {
    if (!isOpen) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isOpen]);

  // Sincronizar transcript con el input (mientras está escuchando)
  useEffect(() => {
    if (isListening && transcript) {
      setInput(transcript);
    }
  }, [transcript, isListening]);

  // Manejar síntesis de voz (TTS)
  const speak = useCallback((text: string) => {
    if (!isTtsEnabled) return;
    
    // Cancelar cualquier habla previa
    window.speechSynthesis.cancel();
    
    // 🔧 Limpieza SUPER agresiva de Markdown para la lectura de voz
    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, '$1')       // Remover **negritas**
      .replace(/\*(.*?)\*/g, '$1')           // Remover *cursivas*
      .replace(/`(.*?)`/g, '$1')             // Remover `código`
      .replace(/#+\s*/g, '')                 // Remover ## encabezados
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remover [links](url)
      .replace(/[*_`#]/g, '')                // Eliminar cualquier símbolo Markdown suelto
      .trim();
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-PE';
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [isTtsEnabled]);

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const handleSend = async (overrideInput?: string) => {
    const messageToSend = overrideInput || input;
    if (!messageToSend.trim() || isLoading) return;

    // Detener lectura al enviar nuevo mensaje
    stopSpeaking();

    const userMessage = messageToSend.trim();
    setInput('');
    addMessage('user', userMessage);
    setIsLoading(true);

    try {
      const response = await ChatbotService.processMessage(userMessage, messages, pathname || undefined);
      console.log('[ChatWidget] Final response received before rendering:', response);
      addMessage('assistant', response);
      
      // Hablar la respuesta si está habilitado
      speak(response);
    } catch (error) {
      addMessage('assistant', "Lo siento, hubo un error al procesar tu mensaje.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
      // No mandar aquí, mandamos en el useEffect cuando transcript termine
    } else {
      stopSpeaking(); // Detener lectura al empezar a escuchar
      setInput(''); // Limpiar input para nueva grabación
      startListening();
    }
  };

  return (
    <div className={cn("fixed bottom-6 right-6 z-50 flex flex-col items-end", !isOpen && "pointer-events-none")}>
      {/* Ventana de Chat (Drawer lateral simulado) */}
      <div
        className={cn(
          "mb-4 transition-all duration-300 origin-bottom-right transform flex flex-row pointer-events-auto",
          isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
        )}
      >
        <div className="h-[500px] bg-card border border-r-0 rounded-l-xl shadow-2xl overflow-hidden">
          {isSidebarOpen && (
            <ChatHistorySidebar 
              conversations={conversations}
              activeId={activeConversationId}
              onSelect={loadConversation}
              onNew={startNewChat}
              onDelete={deleteConversation}
            />
          )}
        </div>

        <div className="w-[350px] sm:w-[400px] h-[500px] bg-card border rounded-xl shadow-2xl overflow-hidden flex flex-col">
          {/* Header con controles de voz */}
          <div className="flex items-center justify-between p-3 border-b bg-primary/5">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                 <Menu className="h-4 w-4" />
              </Button>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium">Asistente UNT</span>
            </div>
            <div className="flex items-center gap-1">
              {isSpeaking && (
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="h-8 w-8 animate-in fade-in zoom-in" 
                  onClick={stopSpeaking}
                  title="Detener lectura"
                >
                  <Square className="h-3 w-3 fill-current" />
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => setIsTtsEnabled(!isTtsEnabled)}
                title={isTtsEnabled ? "Desactivar voz automática" : "Activar voz automática"}
              >
                {isTtsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden p-2">
            <ChatWindow messages={messages} isLoading={isLoading} />
          </div>
          
          {/* Indicador de escucha */}
          {isListening && (
            <div className="px-4 py-2 bg-primary/10 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2">
                <Mic className="h-3 w-3 text-primary animate-pulse" />
                <span className="text-xs font-medium text-primary">Escuchando...</span>
              </div>
              <Button 
                variant="destructive" 
                size="icon" 
                className="h-6 w-6" 
                onClick={stopListening}
              >
                 <Square className="h-2 w-2 fill-current" />
              </Button>
            </div>
          )}

          {voiceError && (
            <div className="px-4 py-1 bg-destructive/10">
              <span className="text-xs text-destructive">Error de micro: {voiceError}</span>
            </div>
          )}

          <div className="p-4 border-t flex gap-2">
            <Input
              placeholder={isListening ? "Escuchando..." : "Escribe tu consulta..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1"
              disabled={isListening}
            />
            
            {isSupported && (
              <Button 
                size="icon" 
                variant={isListening ? "destructive" : "outline"}
                onClick={toggleListening}
                disabled={isLoading}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            )}

            <Button size="icon" onClick={() => handleSend()} disabled={isLoading || isListening}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Botón para abrir chat */}
      <Button 
        size="icon" 
        className="h-14 w-14 rounded-full shadow-lg hover:scale-105 transition-transform pointer-events-auto"
        onClick={() => setIsOpen(!isOpen)}
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
    </div>
  );
};

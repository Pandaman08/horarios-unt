"use client";

import { useState, useEffect, useCallback } from 'react';
import { ChatMessage } from '@/services/ai/ChatbotService';

interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  messages: ChatMessage[];
}

const STORAGE_KEY = 'chatbot_conversations';
const ACTIVE_ID_KEY = 'chatbot_active_id';

export const useChat = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Cargar datos de localStorage al inicializar
  useEffect(() => {
    const savedConversations = localStorage.getItem(STORAGE_KEY);
    const savedActiveId = localStorage.getItem(ACTIVE_ID_KEY);

    if (savedConversations) {
      try {
        const parsed = JSON.parse(savedConversations);
        // Convertir strings de fecha a objetos Date
        const hydrated = parsed.map((c: any) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          messages: c.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          })),
        }));
        setConversations(hydrated);
      } catch (e) {
        console.error('Failed to load conversations:', e);
      }
    }
    if (savedActiveId) {
      setActiveConversationId(savedActiveId);
    }
  }, []);

  // Guardar datos en localStorage
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    }
    if (activeConversationId) {
      localStorage.setItem(ACTIVE_ID_KEY, activeConversationId);
    }
  }, [conversations, activeConversationId]);

  const messages = activeConversationId 
    ? conversations.find(c => c.id === activeConversationId)?.messages || [] 
    : [];

  const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    const newMessage: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      role,
      content,
      timestamp: new Date(),
    };

    if (!activeConversationId) {
      // Crear nueva conversación
      const newId = Math.random().toString(36).substring(7);
      // Generar título basado en la primera pregunta
      const title = role === 'user' ? content.substring(0, 30) + (content.length > 30 ? '...' : '') : 'Nueva Conversación';
      
      setConversations(prev => [{
        id: newId,
        title,
        createdAt: new Date(),
        messages: [newMessage],
      }, ...prev]);
      setActiveConversationId(newId);
    } else {
      // Añadir a conversación existente
      setConversations(prev => prev.map(c => {
        if (c.id === activeConversationId) {
          // Si es la primera respuesta, actualizar el título si es necesario
          let title = c.title;
          if (c.messages.length === 0 && role === 'user') {
             title = content.substring(0, 30) + (content.length > 30 ? '...' : '');
          }
          return { ...c, messages: [...c.messages, newMessage], title };
        }
        return c;
      }));
    }
  }, [activeConversationId]);

  const clearHistory = useCallback(() => {
    if (activeConversationId) {
       // No eliminar del historial, solo limpiar mensajes activos?
       // O mejor, crear nueva conversación
       const newId = Math.random().toString(36).substring(7);
       setActiveConversationId(newId);
    } else {
       // No hay active ID, no hacer nada o crear nueva
       const newId = Math.random().toString(36).substring(7);
       setActiveConversationId(newId);
    }
  }, [activeConversationId]);

  const loadConversation = useCallback((id: string) => {
    setActiveConversationId(id);
  }, []);

  const startNewChat = useCallback(() => {
    const newId = Math.random().toString(36).substring(7);
    setActiveConversationId(newId);
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
    }
  }, [activeConversationId]);

  return {
    messages,
    isLoading,
    setIsLoading,
    addMessage,
    clearHistory,
    conversations,
    activeConversationId,
    loadConversation,
    startNewChat,
    deleteConversation,
  };
};

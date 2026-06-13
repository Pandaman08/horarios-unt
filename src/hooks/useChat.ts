"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Ref para mantener ID sincrónico (fuera del ciclo de re-renderizado)
  const activeIdRef = useRef<string | null>(null);
  const isInitialLoad = useRef(true);

  // 1. Cargar datos de localStorage al inicializar
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedConversations = localStorage.getItem(STORAGE_KEY);
    const savedActiveId = localStorage.getItem(ACTIVE_ID_KEY);

    if (savedConversations) {
      try {
        const parsed = JSON.parse(savedConversations);
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
      activeIdRef.current = savedActiveId;
    }
    
    setIsHydrated(true);
    isInitialLoad.current = false;
  }, []);

  // 2. Guardar datos en localStorage solo después de la hidratación y cuando hay cambios reales
  useEffect(() => {
    if (!isHydrated) return;
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    if (activeConversationId) {
      localStorage.setItem(ACTIVE_ID_KEY, activeConversationId);
    } else {
      localStorage.removeItem(ACTIVE_ID_KEY);
    }
  }, [conversations, activeConversationId, isHydrated]);

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

    setConversations(prev => {
      let currentId = activeIdRef.current;
      const exists = prev.find(c => c.id === currentId);

      // Si no hay ID activo o el ID no existe en la lista (chat nuevo)
      if (!currentId || !exists) {
        const newId = currentId || Math.random().toString(36).substring(7);
        activeIdRef.current = newId;
        setActiveConversationId(newId);
        
        const title = role === 'user' 
          ? content.substring(0, 30) + (content.length > 30 ? '...' : '') 
          : 'Nueva Conversación';

        return [{
          id: newId,
          title,
          createdAt: new Date(),
          messages: [newMessage],
        }, ...prev];
      } else {
        // Añadir a conversación existente
        return prev.map(c => {
          if (c.id === currentId) {
            let title = c.title;
            if (c.messages.length === 0 && role === 'user') {
              title = content.substring(0, 30) + (content.length > 30 ? '...' : '');
            }
            return { ...c, messages: [...c.messages, newMessage], title };
          }
          return c;
        });
      }
    });
  }, []);

  const startNewChat = useCallback(() => {
    activeIdRef.current = null;
    setActiveConversationId(null);
  }, []);

  const loadConversation = useCallback((id: string) => {
    activeIdRef.current = id;
    setActiveConversationId(id);
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeIdRef.current === id) {
      activeIdRef.current = null;
      setActiveConversationId(null);
    }
  }, []);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ACTIVE_ID_KEY);
    activeIdRef.current = null;
    setConversations([]);
    setActiveConversationId(null);
  }, []);

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
    isHydrated
  };
};

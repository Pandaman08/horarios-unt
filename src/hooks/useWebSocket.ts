"use client";

import { useEffect, useCallback } from 'react';
import { getSocket } from '@/lib/socket-client';

export const useWebSocket = (eventName: string, callback: (data: any) => void) => {
  const socket = getSocket();

  useEffect(() => {
    socket.on(eventName, callback);

    return () => {
      socket.off(eventName, callback);
    };
  }, [eventName, callback, socket]);

  const emit = useCallback((eventName: string, data: any) => {
    socket.emit(eventName, data);
  }, [socket]);

  return { emit, socket };
};

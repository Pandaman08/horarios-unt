"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface Periodo {
  id_periodo: number;
  codigo: string;
  nombre: string;
  anio: number;
  semestre: number;
  activo: boolean;
  estado: string;
}

interface PeriodoContextType {
  periodoSeleccionado: Periodo | null;
  setPeriodoSeleccionado: (periodo: Periodo) => void;
  periodos: Periodo[];
  loading: boolean;
  actualizarPeriodos: () => Promise<void>;
  periodoActivo: Periodo | null;
}

const PeriodoContext = createContext<PeriodoContextType | undefined>(undefined);

export function PeriodoProvider({ children }: { children: React.ReactNode }) {
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [periodoSeleccionado, setPeriodoSeleccionadoState] = useState<Periodo | null>(null);
  const [periodoActivo, setPeriodoActivo] = useState<Periodo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPeriodos = useCallback(async () => {
    try {
      const response = await fetch('/api/periodos');
      
      // Verificar si la respuesta es JSON antes de parsear
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error('Expected JSON but received:', text.substring(0, 100));
        return;
      }

      const data = await response.json();
      
      // Si el error persiste y recibimos un objeto de error
      if (data.error) {
        console.error('API Error:', data.error);
        return;
      }

      setPeriodos(Array.isArray(data) ? data : []);
      
      const activo = data.find((p: Periodo) => p.activo);
      setPeriodoActivo(activo || null);

      // Selección automática: Al inicio siempre se selecciona el periodo activo
      // Independientemente de lo que haya en localStorage (según requerimiento)
      if (activo) {
        setPeriodoSeleccionadoState(activo);
      } else {
        // Solo si no hay un periodo marcado como activo, intentamos recuperar de localStorage
        const savedPeriodoId = localStorage.getItem('periodoSeleccionadoId');
        if (savedPeriodoId) {
          const saved = data.find((p: Periodo) => p.id_periodo === parseInt(savedPeriodoId));
          setPeriodoSeleccionadoState(saved || data[0] || null);
        } else {
          setPeriodoSeleccionadoState(data[0] || null);
        }
      }
    } catch (error) {
      console.error('Error fetching periodos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPeriodos();
  }, [fetchPeriodos]);

  const setPeriodoSeleccionado = (periodo: Periodo) => {
    setPeriodoSeleccionadoState(periodo);
    localStorage.setItem('periodoSeleccionadoId', periodo.id_periodo.toString());
  };

  return (
    <PeriodoContext.Provider value={{ 
      periodoSeleccionado, 
      setPeriodoSeleccionado, 
      periodos, 
      loading, 
      actualizarPeriodos: fetchPeriodos,
      periodoActivo
    }}>
      {children}
    </PeriodoContext.Provider>
  );
}

export function usePeriodo() {
  const context = useContext(PeriodoContext);
  if (context === undefined) {
    throw new Error('usePeriodo must be used within a PeriodoProvider');
  }
  return context;
}

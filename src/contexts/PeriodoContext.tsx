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
      const data = await response.json();
      setPeriodos(data);
      
      const activo = data.find((p: Periodo) => p.activo);
      setPeriodoActivo(activo || null);

      // Si no hay periodo seleccionado previamente (en localStorage), usar el activo
      const savedPeriodoId = localStorage.getItem('periodoSeleccionadoId');
      if (savedPeriodoId) {
        const saved = data.find((p: Periodo) => p.id_periodo === parseInt(savedPeriodoId));
        if (saved) {
          setPeriodoSeleccionadoState(saved);
        } else {
          setPeriodoSeleccionadoState(activo || data[0] || null);
        }
      } else {
        setPeriodoSeleccionadoState(activo || data[0] || null);
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

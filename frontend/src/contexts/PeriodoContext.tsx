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
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      
      const response = await fetch(`${apiUrl}/api/periodos`).catch(() => {
        // Silenciamos el error Failed to fetch para evitar ruido en consola
        return null;
      });

      if (!response) {
        setPeriodos([]);
        return;
      }

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const data = await response.json();
      const periodosRecibidos = Array.isArray(data) ? data : [];
      setPeriodos(periodosRecibidos);
      
      const activo = periodosRecibidos.find((p: Periodo) => p.activo) || periodosRecibidos[0] || null;
      setPeriodoActivo(activo);

      // 1. Intentar recuperar del localStorage
      const savedPeriodoId = localStorage.getItem('periodoSeleccionadoId');
      let periodoInicial = null;

      if (savedPeriodoId) {
        periodoInicial = periodosRecibidos.find((p: Periodo) => p.id_periodo === parseInt(savedPeriodoId));
      }

      // 2. Si no hay en localStorage o el que había ya no existe, usar el activo (o el primero)
      if (!periodoInicial) {
        periodoInicial = activo;
      }

      // 3. Establecer el periodo inicial
      if (periodoInicial) {
        setPeriodoSeleccionadoState(periodoInicial);
        localStorage.setItem('periodoSeleccionadoId', periodoInicial.id_periodo.toString());
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

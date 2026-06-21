"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface Facultad {
  id: string;
  nombre: string;
  codigo: string;
  tipo: string;
}

export interface Departamento {
  id: string;
  nombre: string;
  facultadId: string;
  facultad: Facultad;
}

interface DepartmentContextType {
  facultades: Facultad[];
  departamentos: Departamento[];
  allDepartamentos: Departamento[];
  facultadSeleccionada: Facultad | null;
  departamentoSeleccionado: Departamento | null;
  loading: boolean;
  setFacultadSeleccionada: (facultad: Facultad | null) => Promise<void>;
  setDepartamentoSeleccionado: (departamento: Departamento | null) => void;
  actualizarFacultades: () => Promise<void>;
  actualizarDepartamentos: (facultadId?: string) => Promise<void>;
}

const DepartmentContext = createContext<DepartmentContextType | undefined>(undefined);

export function DepartmentProvider({ children }: { children: React.ReactNode }) {
  const [facultades, setFacultades] = useState<Facultad[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [allDepartamentos, setAllDepartamentos] = useState<Departamento[]>([]);
  const [facultadSeleccionada, setFacultadSeleccionadaState] = useState<Facultad | null>(null);
  const [departamentoSeleccionado, setDepartamentoSeleccionadoState] = useState<Departamento | null>(null);
  const [loading, setLoading] = useState(true);

  const actualizarFacultades = useCallback(async () => {
    try {
      const res = await fetch("/api/facultades");
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        return;
      }
      const data = await res.json();
      if (data.error) {
        return;
      }
      setFacultades(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching facultades:", error);
    }
  }, []);

  const actualizarAllDepartamentos = useCallback(async () => {
    try {
      const res = await fetch("/api/departamentos");
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        return;
      }
      const data = await res.json();
      if (data.error) {
        return;
      }
      setAllDepartamentos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching all departamentos:", error);
    }
  }, []);

  const actualizarDepartamentos = useCallback(async (facultadId?: string) => {
    try {
      const url = facultadId ? `/api/departamentos?facultadId=${facultadId}` : "/api/departamentos";
      const res = await fetch(url);
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        return;
      }
      const data = await res.json();
      if (data.error) {
        return;
      }
      setDepartamentos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching departamentos:", error);
    }
  }, []);

  const setDepartamentoSeleccionado = (departamento: Departamento | null) => {
    setDepartamentoSeleccionadoState(departamento);
    if (departamento) {
      localStorage.setItem('departamentoSeleccionadoId', departamento.id);
      if (!facultadSeleccionada || facultadSeleccionada.id !== departamento.facultadId) {
        const facultad = facultades.find(f => f.id === departamento.facultadId);
        if (facultad) {
          setFacultadSeleccionadaState(facultad);
        }
      }
    } else {
      localStorage.removeItem('departamentoSeleccionadoId');
    }
  };

  const setFacultadSeleccionada = async (facultad: Facultad | null) => {
    setFacultadSeleccionadaState(facultad);
    if (facultad) {
      await actualizarDepartamentos(facultad.id);
    } else {
      await actualizarDepartamentos();
    }
    // Reset selected departamento
    setDepartamentoSeleccionadoState(null);
  };

  useEffect(() => {
    const init = async () => {
      await actualizarFacultades();
      await actualizarAllDepartamentos();
      setLoading(false);
    };
    init();
  }, [actualizarFacultades, actualizarAllDepartamentos]);

  useEffect(() => {
    const loadDefaults = async () => {
      if (facultades.length > 0) {
        const savedDepartamentoId = localStorage.getItem('departamentoSeleccionadoId');
        if (savedDepartamentoId) {
          await actualizarDepartamentos();
          const foundDepartamento = departamentos.find(d => d.id === savedDepartamentoId);
          if (foundDepartamento) {
            const foundFacultad = facultades.find(f => f.id === foundDepartamento.facultadId);
            if (foundFacultad) {
              setFacultadSeleccionadaState(foundFacultad);
              await actualizarDepartamentos(foundFacultad.id);
              setDepartamentoSeleccionadoState(foundDepartamento);
              return;
            }
          }
        }

        const defaultFacultad = facultades.find(f => f.codigo === 'F11');
        if (defaultFacultad) {
          setFacultadSeleccionadaState(defaultFacultad);
          await actualizarDepartamentos(defaultFacultad.id);
        } else {
          const firstFacultad = facultades[0];
          if (firstFacultad) {
            setFacultadSeleccionadaState(firstFacultad);
            await actualizarDepartamentos(firstFacultad.id);
          }
        }
      }
    };
    if (!loading) {
      loadDefaults();
    }
  }, [facultades.length, loading]);

  useEffect(() => {
    if (facultadSeleccionada && departamentos.length > 0 && !departamentoSeleccionado) {
      const deptoSistemas = departamentos.find(d => d.nombre.includes("Ingeniería de Sistemas") || d.nombre.includes("Sistemas"));
      if (deptoSistemas) {
        setDepartamentoSeleccionadoState(deptoSistemas);
        localStorage.setItem('departamentoSeleccionadoId', deptoSistemas.id);
      } else {
        const firstDepartamento = departamentos[0];
        if (firstDepartamento) {
          setDepartamentoSeleccionadoState(firstDepartamento);
          localStorage.setItem('departamentoSeleccionadoId', firstDepartamento.id);
        }
      }
    }
  }, [facultadSeleccionada, departamentos]);

  return (
    <DepartmentContext.Provider value={{ 
      facultades, 
      departamentos, 
      allDepartamentos,
      facultadSeleccionada, 
      departamentoSeleccionado, 
      loading, 
      setFacultadSeleccionada, 
      setDepartamentoSeleccionado, 
      actualizarFacultades, 
      actualizarDepartamentos 
    }}>
      {children}
    </DepartmentContext.Provider>
  );
}

export function useDepartment() {
  const context = useContext(DepartmentContext);
  if (context === undefined) {
    throw new Error('useDepartment must be used within a DepartmentProvider');
  }
  return context;
}

'use client';

import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Badge } from './badge';

const TIPO_DESCRIPCION = {
  PERSONAL_ACADEMICO: 'Base de Datos de Personal Académico UNT',
  INVESTIGACION_ETICA: 'Dirección de Investigación y Ética',
  RENACYT: 'RENACYT (CONCYTEC)',
  SANCIONES: 'Tribunal de Honor / RR.HH.'
};

interface SimulacionBadgeProps {
  tipo: keyof typeof TIPO_DESCRIPCION;
}

export function SimulacionBadge({ tipo }: SimulacionBadgeProps) {
  const descripcion = TIPO_DESCRIPCION[tipo];
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Badge variant="outline" className="ml-2 text-xs cursor-help border-dashed">
          (simulado)
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="text-xs max-w-[250px]">
        <p className="font-medium">En producción esto se conectaría con:</p>
        <p className="text-muted-foreground mt-1">{descripcion}</p>
      </PopoverContent>
    </Popover>
  );
}

'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { getSocket } from '@/lib/socket-client'
import { toast } from 'sonner'
import { format, addMinutes, parse } from 'date-fns'
import { Clock, Calendar, Grid3X3 } from 'lucide-react'
import { Button } from '@/components/ui/button'

// --- Constants ---
const DIAS = [
  { id: 0, nombre: 'Lunes', codigo: 'LU' },
  { id: 1, nombre: 'Martes', codigo: 'MA' },
  { id: 2, nombre: 'Miércoles', codigo: 'MI' },
  { id: 3, nombre: 'Jueves', codigo: 'JU' },
  { id: 4, nombre: 'Viernes', codigo: 'VI' },
  { id: 5, nombre: 'Sábado', codigo: 'SA' },
]

const HORA_INICIO = 7 // 7 AM
const HORA_FIN = 22 // 10 PM
const DURACION_SLOT_MIN = 60 // 1 hour per slot for view

// --- Types ---
interface CeldaInfo {
  id_asignacion?: number
  id_seleccion?: number
  id_carga_no_lectiva?: number
  id_docente?: number
  docente_nombre?: string
  curso_nombre?: string
  ambiente_nombre?: string
  tipo_clase?: string
  estado: 'disponible' | 'ocupado' | 'seleccionado_mio' | 'bloqueado' | 'bloqueado_lectivo' | 'error'
  mensaje_error?: string
}

interface HorarioGraficoProps {
  modo: 'lectiva' | 'no-lectiva'
  id_periodo: number
  id_docente_actual?: number
  id_curso_actual?: any
  id_grupo_actual?: any
  id_ambiente_actual?: any
  tipo_clase_actual?: string
  actividadSeleccionadaId?: number
  actividadesNoLectivas?: any[]
  horariosLectivosDocente?: any[]
  onCellClick?: (dia: number, hora: string) => void
  onSelectionChange?: () => void
  soloLectura?: boolean
  horariosAsignados?: any[]
  horasRequeridas?: number
  horasAsignadas?: number
}

// --- Helper Functions ---
function getTimeSlots() {
  const slots = []
  let current = parse(`${HORA_INICIO}:00`, 'HH:mm', new Date())
  const end = parse(`${HORA_FIN}:00`, 'HH:mm', new Date())
  while (current < end) {
    slots.push(format(current, 'HH:mm'))
    current = addMinutes(current, DURACION_SLOT_MIN)
  }
  return slots
}

export function HorarioGrafico({
  modo,
  id_periodo,
  id_docente_actual,
  id_curso_actual,
  id_grupo_actual,
  id_ambiente_actual,
  tipo_clase_actual,
  actividadSeleccionadaId,
  actividadesNoLectivas,
  horariosLectivosDocente,
  onCellClick,
  onSelectionChange,
  soloLectura,
  horariosAsignados,
  horasRequeridas,
  horasAsignadas = 0
}: HorarioGraficoProps) {
  // -- State --
  const [disponibilidad, setDisponibilidad] = useState<Record<string, CeldaInfo>>({})
  const [loading, setLoading] = useState(true)
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionStart, setSelectionStart] = useState<{ dia: number; hora: string } | null>(null)
  const [selectionEnd, setSelectionEnd] = useState<{ dia: number; hora: string } | null>(null)
  
  // Refs
  const gridRef = useRef<HTMLDivElement>(null)

  // Computed
  const timeSlots = useMemo(() => getTimeSlots(), [])

  // --- Data Fetching ---
  useEffect(() => {
    if (horariosAsignados && horariosAsignados.length > 0) {
      // Usar horariosAsignados directamente para vista de lectura
      cargarHorariosAsignados()
    } else {
      fetchDisponibilidad()
      const cleanup = setupSocket()
      return cleanup
    }
  }, [id_periodo, id_ambiente_actual, id_curso_actual, id_grupo_actual, soloLectura, horariosAsignados])

  // Re-map carga lectiva and no-lectiva
  useEffect(() => {
    if (!actividadesNoLectivas && !horariosLectivosDocente?.length) return

    try {
      setDisponibilidad(prev => aplicarCapasCargaHoraria(prev, horariosLectivosDocente || [], actividadesNoLectivas || [], actividadSeleccionadaId, modo, id_docente_actual))
    } catch (err) {
      console.warn('Error remapping', err)
    }
  }, [actividadesNoLectivas, horariosLectivosDocente, actividadSeleccionadaId, id_docente_actual, modo])

  const cargarHorariosAsignados = () => {
    if (!horariosAsignados) return

    setLoading(true)
    try {
      const map: Record<string, CeldaInfo> = {}

      // Fill slots with data
      const fillSlots = (dia: number, horaInicio: string, horaFin: string, info: Partial<CeldaInfo>) => {
        let current = parse(horaInicio, 'HH:mm', new Date())
        const end = parse(horaFin, 'HH:mm', new Date())
        while (current < end) {
          const slotHora = format(current, 'HH:mm')
          const key = dia.toString() + '-' + slotHora
          map[key] = { ...map[key], ...info, estado: info.estado ?? 'ocupado' } as CeldaInfo
          current = addMinutes(current, 60)
        }
      }

      ;(horariosAsignados ?? []).forEach((asig: any) => {
        const esNoLectiva = asig.is_no_lectiva
        fillSlots(asig.dia_semana, asig.hora_inicio, asig.hora_fin, {
          id_asignacion: asig.id_asignacion,
          id_carga_no_lectiva: asig.id_carga_no_lectiva,
          curso_nombre: asig.curso_nombre,
          ambiente_nombre: asig.ambiente_codigo || asig.ambiente_nombre,
          tipo_clase: asig.tipo_clase,
          estado: esNoLectiva ? 'bloqueado_lectivo' : 'seleccionado_mio'
        })
      })

      setDisponibilidad(map)
    } catch (err) {
      console.error(err)
      toast.error('Error al cargar horarios')
    } finally {
      setLoading(false)
    }
  }

  const fetchDisponibilidad = async () => {
    if (!id_periodo || isNaN(id_periodo)) return

    setLoading(true)
    try {
      let url = '/api/horarios/disponibilidad-matriz?id_periodo=' + id_periodo.toString()
      if (id_ambiente_actual != null && !isNaN(id_ambiente_actual)) url += '&id_ambiente=' + id_ambiente_actual.toString()
      if (id_docente_actual != null && !isNaN(id_docente_actual)) url += '&id_docente=' + id_docente_actual.toString()
      if (soloLectura) url += '&modo_consulta=1'
      if (id_curso_actual != null && !isNaN(id_curso_actual)) url += '&id_curso=' + id_curso_actual.toString()
      if (id_grupo_actual != null && !isNaN(id_grupo_actual)) url += '&id_grupo=' + id_grupo_actual.toString()

      const res = await fetch(url)
      const data = await res.json()
      
      const map: Record<string, CeldaInfo> = {}
      
      // Fill slots with data
      const fillSlots = (dia: number, horaInicio: string, horaFin: string, info: Partial<CeldaInfo>) => {
        let current = parse(horaInicio, 'HH:mm', new Date())
        const end = parse(horaFin, 'HH:mm', new Date())
        while (current < end) {
          const slotHora = format(current, 'HH:mm')
          const key = dia.toString() + '-' + slotHora
          map[key] = { ...map[key], ...info, estado: info.estado ?? 'ocupado' } as CeldaInfo
          current = addMinutes(current, 15)
        }
      }

      ;(data.asignaciones ?? []).forEach((asig: any) => {
        const esMia = Number(asig.id_docente) === Number(id_docente_actual)
        fillSlots(asig.dia_semana, asig.hora_inicio, asig.hora_fin, {
          id_asignacion: asig.id_asignacion,
          id_docente: asig.id_docente,
          docente_nombre: asig.docente.nombres + ' ' + asig.docente.apellidos,
          curso_nombre: asig.curso.nombre,
          ambiente_nombre: asig.ambiente?.codigo || asig.ambiente?.nombre,
          tipo_clase: asig.tipo_clase,
          estado: modo === 'no-lectiva' && esMia ? 'bloqueado_lectivo' : esMia ? 'seleccionado_mio' : 'ocupado'
        })
      })

      ;(data.temporales ?? []).forEach((temp: any) => {
        const esMia = Number(temp.id_docente) === Number(id_docente_actual)
        fillSlots(temp.dia_semana, temp.hora_inicio, temp.hora_fin, {
          id_seleccion: temp.id_seleccion,
          id_docente: temp.id_docente,
          docente_nombre: temp.docente.nombres + ' ' + temp.docente.apellidos,
          curso_nombre: temp.curso.nombre,
          ambiente_nombre: temp.ambiente?.codigo || temp.ambiente?.nombre,
          tipo_clase: temp.tipo_clase,
          estado: modo === 'no-lectiva' && esMia ? 'bloqueado_lectivo' : esMia ? 'seleccionado_mio' : 'ocupado'
        })
      })

      // Block lunch break 12-1
      let curB = parse('12:00', 'HH:mm', new Date())
      const endB = parse('13:00', 'HH:mm', new Date())
      while (curB < endB) {
        const horaB = format(curB, 'HH:mm')
        DIAS.forEach(dia => {
          const key = dia.id.toString() + '-' + horaB
          if (!map[key]) map[key] = { estado: 'bloqueado' }
        })
        curB = addMinutes(curB, 15)
      }

      setDisponibilidad(aplicarCapasCargaHoraria(map, horariosLectivosDocente || [], actividadesNoLectivas || [], actividadSeleccionadaId, modo, id_docente_actual))
    } catch (err) {
      console.error(err)
      toast.error('Error al cargar disponibilidad')
    } finally {
      setLoading(false)
    }
  }

  const setupSocket = () => {
    const socket = getSocket()
    socket.on('horario-actualizado', () => {
      fetchDisponibilidad()
      onSelectionChange?.()
    })
    return () => { socket.off('horario-actualizado') }
  }

  // --- Logic for applying layers (moved from MatrizDisponibilidad) ---
  const aplicarActividadesNoLectivas = (
    map: Record<string, CeldaInfo>,
    acts: Array<any> | undefined,
    actId: number | undefined,
    docId?: number
  ): Record<string, CeldaInfo> => {
    const next = { ...map }
    // Clean previous
    for (const key of Object.keys(next)) {
      const celda = next[key]
      if (!celda?.id_carga_no_lectiva) continue
      if (celda.id_asignacion || celda.id_seleccion) {
        const { id_carga_no_lectiva, curso_nombre, estado, id_docente, ...rest } = celda
        next[key] = rest as CeldaInfo
      } else {
        delete next[key]
      }
    }
    // Add current
    ;(acts ?? []).forEach((carga: any) => {
      const esSeleccionada = actId === carga.id_carga_no_lectiva
      ;(carga.horarios || []).forEach((h: any) => {
        let current = parse(h.horaInicio, 'HH:mm', new Date())
        const end = parse(h.horaFin, 'HH:mm', new Date())
        while (current < end) {
          const slotHora = format(current, 'HH:mm')
          const diaIdx = DIAS.findIndex(d => d.codigo === h.dia)
          if (diaIdx === -1) { current = addMinutes(current,15); continue }
          const key = diaIdx.toString() + '-' + slotHora
          
          if (next[key] && (next[key].id_asignacion || next[key].id_seleccion || next[key].estado === 'bloqueado_lectivo')) {
            // Keep existing
          } else {
            next[key] = {
              ...next[key],
              id_carga_no_lectiva: carga.id_carga_no_lectiva,
              curso_nombre: carga.descripcion || carga.tipo || 'No lectiva',
              id_docente: esSeleccionada ? docId : undefined,
              estado: esSeleccionada ? 'seleccionado_mio' : 'ocupado'
            } as CeldaInfo
          }
          current = addMinutes(current, 15)
        }
      })
    })
    return next
  }

  const aplicarHorariosLectivosDocente = (
    map: Record<string, CeldaInfo>,
    horarios: Array<any> | undefined,
    tVista?: string,
    docId?: number
  ): Record<string, CeldaInfo> => {
    if (tVista !== 'no-lectiva' || !horarios?.length) return map
    const next = { ...map }
    horarios.forEach(h => {
      if (h.is_no_lectiva) return
      let current = parse(h.hora_inicio, 'HH:mm', new Date())
      const end = parse(h.hora_fin, 'HH:mm', new Date())
      while (current < end) {
        const slotHora = format(current, 'HH:mm')
        const key = h.dia_semana.toString() + '-' + slotHora
        next[key] = {
          id_asignacion: h.id_asignacion,
          id_docente: docId,
          curso_nombre: h.curso_nombre || h.curso_codigo || 'Carga lectiva',
          ambiente_nombre: h.ambiente_codigo || h.ambiente_nombre,
          tipo_clase: h.tipo_clase,
          estado: 'bloqueado_lectivo'
        }
        current = addMinutes(current, 15)
      }
    })
    return next
  }

  const aplicarCapasCargaHoraria = (
    map: Record<string, CeldaInfo>,
    lectivos: any[],
    actividades: any[],
    actId: number | undefined,
    tVista?: string,
    docId?: number
  ) => {
    let result = aplicarHorariosLectivosDocente(map, lectivos, tVista, docId)
    result = aplicarActividadesNoLectivas(result, actividades, actId, docId)
    return result
  }

  // --- Interaction: Click on Cell ---
  const handleCellClick = (dia: number, hora: string) => {
    if (soloLectura) return
    
    const key = dia.toString() + '-' + hora
    const celda = disponibilidad[key]

    // Si es una selección propia, dar la opción de eliminar
    if (
      celda?.estado === 'seleccionado_mio' && 
      Number(celda.id_docente) === Number(id_docente_actual)
    ) {
      handleEliminarBloque(dia, hora)
      return
    }
    
    // Check if cell is blocked or occupied by someone else
    if (celda && (celda.estado === 'bloqueado' || celda.estado === 'bloqueado_lectivo' || celda.estado === 'ocupado')) {
      return
    }
    
    // Start drag selection
    setIsSelecting(true)
    setSelectionStart({ dia, hora })
    setSelectionEnd({ dia, hora })
  }

  const handleEliminarBloque = async (dia: number, hora: string) => {
    try {
      // Buscar todos los slots del mismo bloque
      const celda = disponibilidad[dia.toString() + '-' + hora]
      if (!celda) return

      // Para modo lectiva, eliminar la selección temporal
      if (modo === 'lectiva') {
        // Collect all unique selection IDs (since multiple 15min slots share the same selection)
        const uniqueSeleccionIds = new Set<number>()
        
        // Buscar hacia adelante y hacia atrás
        const currentIdx = timeSlots.indexOf(hora)
        
        // Hacia atrás
        for (let i = currentIdx; i >= 0; i--) {
          const k = dia.toString() + '-' + timeSlots[i]
          const c = disponibilidad[k]
          if (
            c?.estado === 'seleccionado_mio' && 
            Number(c.id_docente) === Number(id_docente_actual)
          ) {
            if (c.id_seleccion) uniqueSeleccionIds.add(c.id_seleccion)
          } else {
            break
          }
        }
        
        // Hacia adelante
        for (let i = currentIdx + 1; i < timeSlots.length; i++) {
          const k = dia.toString() + '-' + timeSlots[i]
          const c = disponibilidad[k]
          if (
            c?.estado === 'seleccionado_mio' && 
            Number(c.id_docente) === Number(id_docente_actual)
          ) {
            if (c.id_seleccion) uniqueSeleccionIds.add(c.id_seleccion)
          } else {
            break
          }
        }

        // Eliminar cada selección temporal
        for (const idSeleccion of uniqueSeleccionIds) {
          await fetch(`/api/horarios/seleccionar-celda?id_seleccion=${idSeleccion}`, {
            method: 'DELETE'
          })
        }

        toast.success('Reserva eliminada')
        fetchDisponibilidad()
        onSelectionChange?.()
        getSocket().emit('horario-actualizado')
      }
      // Para modo no-lectiva, delegar al callback
      else if (modo === 'no-lectiva' && onCellClick) {
        onCellClick(dia, hora)
      }
    } catch (err) {
      toast.error('Error al eliminar la reserva')
    }
  }

  const endSelection = async () => {
    if (!isSelecting || !selectionStart || !selectionEnd) {
      setIsSelecting(false)
      return
    }

    // Calculate range
    const dia = selectionStart.dia
    const startIdx = timeSlots.indexOf(selectionStart.hora)
    const endIdx = timeSlots.indexOf(selectionEnd.hora)
    const minIdx = Math.min(startIdx, endIdx)
    const maxIdx = Math.max(startIdx, endIdx)

    // Para modo lectiva
    if (modo === 'lectiva') {
      const horaInicio = timeSlots[minIdx]
      const horaFin = format(addMinutes(parse(timeSlots[maxIdx], 'HH:mm', new Date()), 60), 'HH:mm')

      try {
        // Validate selection first
        if (!id_curso_actual || !id_grupo_actual || !id_ambiente_actual) {
          toast.warning('Seleccione curso, grupo y ambiente primero')
          setIsSelecting(false)
          setSelectionStart(null)
          setSelectionEnd(null)
          return
        }

        // Check if we're exceeding the required hours
        if (horasRequeridas && horasRequeridas > 0) {
          const horasSeleccionadas = maxIdx - minIdx + 1
          const totalHoras = horasAsignadas + horasSeleccionadas
          
          if (totalHoras > horasRequeridas) {
            toast.warning(`Has excedido el límite de ${horasRequeridas} horas. Por favor, reduce la selección.`)
            setIsSelecting(false)
            setSelectionStart(null)
            setSelectionEnd(null)
            return
          }
        }

        // Call api to create temporal for each 15 min slot
        let current = parse(horaInicio, 'HH:mm', new Date())
        const end = parse(horaFin, 'HH:mm', new Date())
        let hasError = false
        
        while (current < end) {
          const slotHora = format(current, 'HH:mm')
          const nextHora = format(addMinutes(current, 15), 'HH:mm')
          
          const res = await fetch('/api/horarios/seleccionar-celda', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id_docente: id_docente_actual,
              id_curso: id_curso_actual,
              id_grupo: id_grupo_actual,
              id_ambiente: id_ambiente_actual,
              id_periodo,
              dia_semana: dia,
              hora_inicio: slotHora,
              hora_fin: nextHora,
              tipo_clase: tipo_clase_actual ?? 'teoria',
              sesion_id: 'sesion-temp-' + id_docente_actual?.toString()
            })
          })

          const result = await res.json()
          if (!res.ok || !result.valido) {
            toast.error(result.error || result.mensaje || 'Error al crear reserva')
            hasError = true
            break
          }
          
          current = addMinutes(current, 15)
        }

        if (!hasError) {
          toast.success('Reserva creada')
        }
        fetchDisponibilidad()
        onSelectionChange?.()
        getSocket().emit('horario-actualizado')

      } catch (err) {
        toast.error('Error de conexión')
      } finally {
        setIsSelecting(false)
        setSelectionStart(null)
        setSelectionEnd(null)
      }
    } 
    // Para modo no-lectiva
    else if (modo === 'no-lectiva' && onCellClick) {
      try {
        if (!actividadSeleccionadaId) {
          toast.warning('Seleccione una actividad primero')
          setIsSelecting(false)
          setSelectionStart(null)
          setSelectionEnd(null)
          return
        }

        // Llamar al onCellClick para cada hora en el rango
        for (let i = minIdx; i <= maxIdx; i++) {
          const hora = timeSlots[i]
          onCellClick(dia, hora)
        }

        toast.success('Actividad asignada')
      } catch (err) {
        toast.error('Error al asignar la actividad')
      } finally {
        setIsSelecting(false)
        setSelectionStart(null)
        setSelectionEnd(null)
      }
    }
  }

  const handleMouseEnter = (e: React.MouseEvent, dia: number, hora: string) => {
    if (!isSelecting || !selectionStart) return
    if (dia !== selectionStart.dia) return // Only same day

    // Verificar límite de horas
    if (horasRequeridas && horasRequeridas > 0) {
      const startIdx = timeSlots.indexOf(selectionStart.hora)
      const endIdx = timeSlots.indexOf(hora)
      const minIdx = Math.min(startIdx, endIdx)
      const maxIdx = Math.max(startIdx, endIdx)
      const horasSeleccionadas = maxIdx - minIdx + 1
      
      // Calcular total: horas ya asignadas + nuevas seleccionadas
      const totalHoras = horasAsignadas + horasSeleccionadas
      
      if (totalHoras > horasRequeridas) {
        // Limitar la selección para que no supere las horas requeridas
        const horasDisponibles = horasRequeridas - horasAsignadas
        if (horasDisponibles <= 0) return

        const targetIdx = startIdx < endIdx 
          ? startIdx + horasDisponibles - 1 
          : startIdx - horasDisponibles + 1
        
        const clampedIdx = Math.max(0, Math.min(timeSlots.length - 1, targetIdx))
        setSelectionEnd({ dia, hora: timeSlots[clampedIdx] })
        return
      }
    }
    
    setSelectionEnd({ dia, hora })
  }

  // Render helpers
  const getCellClass = (info: CeldaInfo | undefined, isSelected: boolean) => {
    if (isSelected) return 'bg-emerald-400/50 border-2 border-emerald-500'
    if (!info) return 'bg-white hover:bg-emerald-50 cursor-pointer'
    switch (info.estado) {
      case 'disponible': return 'bg-white hover:bg-emerald-50 cursor-pointer'
      case 'seleccionado_mio': return 'bg-amber-400/40 border border-amber-500'
      case 'bloqueado_lectivo': return 'bg-blue-500/15 border border-blue-200'
      case 'bloqueado': return 'bg-gray-100'
      case 'ocupado': return 'bg-rose-500/10 border border-rose-100'
      default: return 'bg-white'
    }
  }

  const isInSelection = (dia: number, hora: string) => {
    if (!isSelecting || !selectionStart || !selectionEnd) return false
    if (dia !== selectionStart.dia) return false
    
    const startIdx = timeSlots.indexOf(selectionStart.hora)
    const endIdx = timeSlots.indexOf(selectionEnd.hora)
    const minIdx = Math.min(startIdx, endIdx)
    const maxIdx = Math.max(startIdx, endIdx)
    const currentIdx = timeSlots.indexOf(hora)

    return currentIdx >= minIdx && currentIdx <= maxIdx
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4 bg-card rounded-2xl border border-border shadow-sm">
        <div className="relative">
          <div className="h-16 w-16 border-4 border-muted border-t-primary rounded-full animate-spin" />
          <Calendar className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">
          Cargando Calendario...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls / Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-card px-4 py-3 rounded-xl border border-border">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary shrink-0" />
          <span className="text-[10px] font-bold uppercase text-muted-foreground">
            Modo {modo === 'lectiva' ? 'Carga Lectiva' : 'Carga No Lectiva'}
          </span>
        </div>

        {/* Progreso de horas */}
        {horasRequeridas && horasRequeridas > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-semibold text-muted-foreground">
                Horas: <span className="font-bold text-primary">{horasAsignadas}</span> / {horasRequeridas}
              </span>
            </div>
            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all duration-300",
                  horasAsignadas >= horasRequeridas 
                    ? "bg-emerald-500" 
                    : "bg-primary"
                )}
                style={{ width: (Math.min(100, (horasAsignadas / horasRequeridas) * 100)).toString() + '%' }}
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 text-[10px]">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-400/50 border-2 border-emerald-500"></span>
            Selección Actual
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-400/40 border border-amber-500"></span>
            Mi Reserva (click para eliminar)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-500/15 border border-blue-200"></span>
            Carga Lectiva (Bloqueada)
          </span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div 
        ref={gridRef}
        className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm relative select-none"
        onMouseUp={endSelection}
        onMouseLeave={endSelection}
      >
        <div className="min-w-[900px] grid" style={{ gridTemplateColumns: '80px repeat(' + DIAS.length + ', 1fr)' }}>
          {/* Header Row */}
          <div className="p-3 border-b border-r border-border bg-muted/50 text-center text-[10px] font-bold text-muted-foreground uppercase">
            Hora
          </div>
          {DIAS.map(dia => (
            <div key={dia.id} className="p-3 border-b border-r border-border bg-primary/90 text-center text-[10px] font-bold text-primary-foreground uppercase">
              {dia.nombre}
            </div>
          ))}

          {/* Time Slots */}
          {timeSlots.map((hora) => (
            <React.Fragment key={hora}>
              <div className="p-2 border-b border-r border-border bg-muted/30 text-center text-[10px] font-semibold text-muted-foreground">
                {hora}
              </div>

              {DIAS.map(dia => {
                const key = dia.id.toString() + '-' + hora
                const info = disponibilidad[key]
                const isSelected = isInSelection(dia.id, hora)

                return (
                  <div
                    key={key}
                    className={cn(
                      'relative h-12 border-b border-r border-border transition-colors flex items-center justify-center text-[8px]',
                      getCellClass(info, isSelected)
                    )}
                    onMouseDown={() => handleCellClick(dia.id, hora)}
                    onClick={() => {}}
                    onMouseEnter={(e) => handleMouseEnter(e, dia.id, hora)}
                  >
                    {/* Content for blocks */}
                    {info && (info.curso_nombre || info.docente_nombre) && (
                      <div className="absolute inset-1 p-1 rounded bg-white/80 border border-border overflow-hidden hidden sm:block">
                        <p className="font-black truncate">{info.curso_nombre}</p>
                        <p className="truncate text-muted-foreground">{info.docente_nombre || info.ambiente_nombre}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

    </div>
  )
}

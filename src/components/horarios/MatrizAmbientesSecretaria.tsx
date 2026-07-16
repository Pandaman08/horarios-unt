"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { format, addMinutes, parse } from "date-fns";
import { Loader2, MapPin, Users, Search, X } from "lucide-react";
import { getSocket } from "@/lib/socket-client";
import { useLocale } from "@/contexts/LocaleContext";
import type { TranslationKey } from "@/lib/i18n/translations";

interface CeldaInfo {
  id_docente?: number;
  docente_nombre?: string;
  curso_nombre?: string;
  ambiente_nombre?: string;
  tipo_clase?: string;
  grupo_nombre?: string;
}

function getTipoColor(tipo?: string) {
  switch (tipo) {
    case "teoria":
      return {
        bg: "bg-blue-500/12",
        border: "border-blue-300/50 dark:border-blue-700/40",
        text: "text-blue-800 dark:text-blue-200",
        textMuted: "text-blue-600/80 dark:text-blue-400/70",
        badge: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
        header: "bg-blue-500/10",
      };
    case "practica":
      return {
        bg: "bg-emerald-500/12",
        border: "border-emerald-300/50 dark:border-emerald-700/40",
        text: "text-emerald-800 dark:text-emerald-200",
        textMuted: "text-emerald-600/80 dark:text-emerald-400/70",
        badge: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
        header: "bg-emerald-500/10",
      };
    case "laboratorio":
      return {
        bg: "bg-violet-500/12",
        border: "border-violet-300/50 dark:border-violet-700/40",
        text: "text-violet-800 dark:text-violet-200",
        textMuted: "text-violet-600/80 dark:text-violet-400/70",
        badge: "bg-violet-500/20 text-violet-700 dark:text-violet-300",
        header: "bg-violet-500/10",
      };
    default:
      return {
        bg: "bg-slate-500/8",
        border: "border-slate-300/40 dark:border-slate-700/30",
        text: "text-slate-800 dark:text-slate-200",
        textMuted: "text-slate-500",
        badge: "bg-slate-500/15 text-slate-600 dark:text-slate-400",
        header: "bg-slate-500/8",
      };
  }
}

function getDias(t: (key: TranslationKey) => string) {
  return [
    { id: 0, nombre: t("dayMonday") },
    { id: 1, nombre: t("dayTuesday") },
    { id: 2, nombre: t("dayWednesday") },
    { id: 3, nombre: t("dayThursday") },
    { id: 4, nombre: t("dayFriday") },
    { id: 5, nombre: t("daySaturday") },
  ];
}

const DEFAULT_SLOTS = [
  "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00",
  "19:00", "20:00", "21:00",
];

interface Props {
  id_periodo: number;
  id_ambiente: number;
  nombre_ambiente: string;
  codigo_ambiente: string;
}

export function MatrizAmbiente({
  id_periodo,
  id_ambiente,
  nombre_ambiente,
  codigo_ambiente,
}: Props) {
  const { t } = useLocale();
  const DIAS = getDias(t);
  const [disponibilidad, setDisponibilidad] = useState<Record<string, CeldaInfo>>({});
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/horarios/disponibilidad-matriz?id_periodo=${id_periodo}&id_ambiente=${id_ambiente}&modo_consulta=1`
      );
      if (!res.ok) throw new Error();
      const data = await res.json();

      const map: Record<string, CeldaInfo> = {};
      const asignaciones = data.asignaciones || [];
      const temporales = data.temporales || [];
      const horarios = [...asignaciones, ...temporales];

      for (const h of horarios) {
        const docente = h.docente
          ? `${h.docente.apellidos || ''} ${h.docente.nombres || ''}`.trim()
          : h.docente_nombre || '';

        let current = parse(h.hora_inicio, "HH:mm", new Date());
        const end = parse(h.hora_fin, "HH:mm", new Date());

        while (current < end) {
          const slotHora = format(current, "HH:mm");
          const key = `${h.dia_semana}-${slotHora}`;
          map[key] = {
            id_docente: h.id_docente || h.docente?.id_docente,
            docente_nombre: docente,
            curso_nombre: h.curso_nombre || h.curso?.nombre || '',
            ambiente_nombre: h.ambiente_codigo || h.ambiente?.codigo || '',
            tipo_clase: h.tipo_clase || h.curso?.tipo_clase || '',
            grupo_nombre: h.grupo?.codigo_grupo || h.grupo_nombre || '',
          };
          current = addMinutes(current, 60);
        }
      }
      setDisponibilidad(map);
    } catch {
      setDisponibilidad({});
    }
  }, [id_periodo, id_ambiente]);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  useEffect(() => {
    const socket = getSocket();
    const handler = () => loadData();
    socket.on("horario-actualizado", handler);
    return () => { socket.off("horario-actualizado", handler); };
  }, [loadData]);

  const timeSlots = useMemo(() => {
    const slots = new Set<string>(DEFAULT_SLOTS);
    Object.keys(disponibilidad).forEach(k => {
      const hora = k.split("-")[1];
      if (hora) slots.add(hora);
    });
    return Array.from(slots).sort();
  }, [disponibilidad]);

  const totalHoras = useMemo(() => {
    return Object.keys(disponibilidad).length;
  }, [disponibilidad]);

  const docentesUnicos = useMemo(() => {
    const set = new Set<string>();
    Object.values(disponibilidad).forEach(c => {
      if (c.docente_nombre) set.add(c.docente_nombre);
    });
    return set.size;
  }, [disponibilidad]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        {t("loadingSchedule")} {codigo_ambiente}...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 text-xs">
        <span className="font-semibold text-foreground">{nombre_ambiente}</span>
        <span className="text-muted-foreground">({codigo_ambiente})</span>
        <span className="text-muted-foreground">·</span>
        <span className="flex items-center gap-1 text-muted-foreground">
          <Users className="h-3 w-3" />
          {docentesUnicos} {docentesUnicos !== 1 ? t("teachersPlural") : t("teachers")}
        </span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">{totalHoras}{t("hoursOccupied")}</span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-[10px]">
          <thead>
            <tr>
              <th className="px-1.5 py-1 text-left text-muted-foreground font-medium border-b border-r border-border/60 w-12">
                {t("hour")}
              </th>
              {DIAS.map(d => (
                <th key={d.id} className="px-1.5 py-1 text-center text-muted-foreground font-medium border-b border-r border-border/60">
                  {d.nombre}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map(hora => (
              <tr key={hora}>
                <td className="px-1.5 py-0.5 text-muted-foreground font-medium border-b border-r border-border/60 whitespace-nowrap">
                  {hora}
                </td>
                {DIAS.map(dia => {
                  const key = `${dia.id}-${hora}`;
                  const info = disponibilidad[key];
                  const color = getTipoColor(info?.tipo_clase);
                  const esReceso = hora === "13:00";

                  return (
                    <td
                      key={key}
                      className={cn(
                        "relative h-14 border-b border-r border-border/60 transition-colors",
                        esReceso
                          ? "bg-amber-500/10 border-amber-300/40"
                          : info ? `${color.bg} ${color.border} border` : "hover:bg-muted/30"
                      )}
                    >
                      {esReceso ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[10px] font-bold uppercase text-amber-600/70 tracking-wider">{t("breakLabel")}</span>
                        </div>
                      ) : info && (
                        <div className="absolute inset-0.5 rounded p-0.5 flex flex-col justify-center overflow-hidden">
                          <p className={cn("font-bold truncate leading-tight", color.text)}>
                            {info.docente_nombre}
                          </p>
                          <p className={cn("truncate leading-tight", color.textMuted)}>
                            {info.curso_nombre}
                            {info.grupo_nombre && ` (${info.grupo_nombre})`}
                          </p>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface MatrizAmbientesSecretariaProps {
  id_periodo: number;
  ambientes: Array<{
    id_ambiente: number;
    nombre: string;
    codigo: string;
    tipo: string;
  }>;
}

export function MatrizAmbientesSecretaria({
  id_periodo,
  ambientes,
}: MatrizAmbientesSecretariaProps) {
  const { t } = useLocale();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const comboRef = useRef<HTMLDivElement>(null);

  const selectedAmbiente = useMemo(
    () => ambientes.find(a => a.id_ambiente === selectedId) || null,
    [ambientes, selectedId]
  );

  const filteredAmbientes = useMemo(() => {
    if (!searchTerm) return ambientes;
    const term = searchTerm.toLowerCase();
    return ambientes.filter(a =>
      a.nombre.toLowerCase().includes(term) ||
      a.codigo.toLowerCase().includes(term) ||
      a.tipo.toLowerCase().includes(term)
    );
  }, [ambientes, searchTerm]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (comboRef.current && !comboRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const ambientesParaMostrar = selectedAmbiente ? [selectedAmbiente] : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium shrink-0">{t("environment")}:</span>
        <div ref={comboRef} className="relative flex-1 max-w-md">
          <div
            role="button"
            tabIndex={0}
            onClick={() => setIsOpen(!isOpen)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsOpen(!isOpen);
              }
            }}
            className={cn(
              "w-full flex items-center gap-2 border rounded-lg px-3 py-2 text-sm bg-background text-left transition-colors cursor-pointer",
              isOpen ? "border-primary ring-1 ring-primary/30" : "border-border hover:border-muted-foreground/50"
            )}
          >
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            {selectedAmbiente ? (
              <span className="flex-1 truncate">
                {selectedAmbiente.nombre} ({selectedAmbiente.codigo}) — <span className="capitalize">{selectedAmbiente.tipo}</span>
              </span>
            ) : (
              <span className="flex-1 text-muted-foreground">{t("selectEnvironment")}...</span>
            )}
            {selectedAmbiente && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setSelectedId(null); setSearchTerm(""); }}
                className="shrink-0 p-0.5 rounded hover:bg-muted"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>

          {isOpen && (
            <div className="absolute z-50 top-full mt-1 w-full bg-background border border-border rounded-lg shadow-lg max-h-72 overflow-hidden">
              <div className="p-2 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={t("searchPlaceholder")}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-7 pr-2 py-1.5 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    autoFocus
                  />
                </div>
              </div>
              <div className="overflow-y-auto max-h-56">
                {filteredAmbientes.map(a => (
                  <button
                    key={a.id_ambiente}
                    onClick={() => { setSelectedId(a.id_ambiente); setIsOpen(false); setSearchTerm(""); }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center justify-between",
                      selectedId === a.id_ambiente && "bg-accent font-medium"
                    )}
                  >
                    <span className="truncate">{a.nombre} ({a.codigo})</span>
                    <span className="text-xs text-muted-foreground capitalize ml-2 shrink-0">{a.tipo}</span>
                  </button>
                ))}
                {filteredAmbientes.length === 0 && (
                  <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                    {t("noEnvironmentsFound")}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {ambientesParaMostrar.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <MapPin className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">{t("selectEnvironmentToShow")}</p>
          <p className="text-xs mt-1">{t("searchFilterHint")}</p>
        </div>
      ) : (
        ambientesParaMostrar.map(ambiente => (
          <div key={ambiente.id_ambiente} className="bg-card rounded-xl border border-border p-3">
            <MatrizAmbiente
              id_periodo={id_periodo}
              id_ambiente={ambiente.id_ambiente}
              nombre_ambiente={ambiente.nombre}
              codigo_ambiente={ambiente.codigo}
            />
          </div>
        ))
      )}
    </div>
  );
}

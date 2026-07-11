"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { MatrizDisponibilidad } from "@/components/horarios/MatrizDisponibilidad";
import { MatrizAmbientesSecretaria } from "@/components/horarios/MatrizAmbientesSecretaria";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  CheckCircle2,
  Clock,
  SkipForward,
  ChevronRight,
  Users,
  Calendar,
  X,
  PauseCircle,
  Building2,
  ArrowLeft,
} from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";

type VentanaInfo = {
  id_ventana: number;
  orden_prioridad: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  intervalo_minutos: number;
  completado: boolean;
};

type DocenteVentana = {
  id_docente: number;
  nombres: string;
  apellidos: string;
  codigo_docente: string;
  condicion: string;
  categoriaDocente: string;
  departamento: string;
  fecha_ingreso: string;
  ventana: VentanaInfo | null;
  estadoVentana: string;
  tiempoRestante: number | null;
};

type CursoItem = {
  id_curso: number;
  nombre: string;
  codigo: string;
  tipo_clase: string;
  horas_requeridas: number;
  grupos_asignados?: number;
  id_grupo?: number;
};

type Periodo = {
  id_periodo: number;
  nombre: string;
  activo: boolean;
};

type Ambiente = {
  id_ambiente: number;
  nombre: string;
  codigo: string;
  tipo: string;
  aforo: number;
  activo: boolean;
};

export default function AsignacionHorariaSecretariaPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { t } = useLocale();

  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [idPeriodo, setIdPeriodo] = useState<number>(0);
  const [docentes, setDocentes] = useState<DocenteVentana[]>([]);
  const [isLoadingDocentes, setIsLoadingDocentes] = useState(false);
  const [docenteSeleccionado, setDocenteSeleccionado] = useState<DocenteVentana | null>(null);

  const [cursos, setCursos] = useState<CursoItem[]>([]);
  const [isLoadingCursos, setIsLoadingCursos] = useState(false);
  const [cursoSeleccionado, setCursoSeleccionado] = useState<CursoItem | null>(null);

  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [ambientesFiltrados, setAmbientesFiltrados] = useState<Ambiente[]>([]);
  const [idAmbiente, setIdAmbiente] = useState<string>("");
  const [vistaAmbientes, setVistaAmbientes] = useState(false);
  const [ambientesAll, setAmbientesAll] = useState<Ambiente[]>([]);
  const [grupos, setGrupos] = useState<any[]>([]);
  const [idGrupo, setIdGrupo] = useState<string>("");
  const [numSubgrupos, setNumSubgrupos] = useState<number>(1);
  const [subgrupoActivo, setSubgrupoActivo] = useState<number>(1);

  const [sinVentanas, setSinVentanas] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [mensaje, setMensaje] = useState<string>("");

  const userRol = session?.user?.rol;
  const esSecretaria = userRol === 'secretaria' || userRol === 'administrador_sistema' || userRol === 'operador_horarios';

  useEffect(() => {
    if (session && !esSecretaria) {
      router.push('/dashboard');
    }
  }, [session, esSecretaria, router]);

  useEffect(() => {
    fetch('/api/periodos?activo=true')
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data.periodos || []);
        setPeriodos(list);
        const activo = list.find((p: Periodo) => p.activo);
        if (activo) setIdPeriodo(activo.id_periodo);
        else if (list.length > 0) setIdPeriodo(list[0].id_periodo);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!idPeriodo) return;
    fetch('/api/ambientes')
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data.ambientes || []);
        const activos = list.filter((a: any) => a.activo === true);
        setAmbientesAll(activos);
      })
      .catch(() => {});
  }, [idPeriodo]);

  const fetchDocentes = useCallback(async () => {
    if (!idPeriodo) return;
    setIsLoadingDocentes(true);
    setSinVentanas(false);
    try {
      const res = await fetch(`/api/secretaria/docentes-ventana?id_periodo=${idPeriodo}`);
      const data = await res.json();
      setDocentes(data.docentes || []);
      setSinVentanas(!data.hayVentanas);
    } catch {
      setDocentes([]);
      setSinVentanas(true);
    } finally {
      setIsLoadingDocentes(false);
    }
  }, [idPeriodo]);

  useEffect(() => {
    fetchDocentes();
  }, [fetchDocentes]);

  const handleSelectDocente = async (docente: DocenteVentana) => {
    setDocenteSeleccionado(docente);
    setCursoSeleccionado(null);
    setIdAmbiente("");
    setIdGrupo("");
    setMensaje("");

    setIsLoadingCursos(true);
    try {
      const res = await fetch(
        `/api/docentes/mis-cursos?id_periodo=${idPeriodo}&id_docente_manual=${docente.id_docente}`
      );
      const data = await res.json();
      const cursosList = data.cursos || data || [];
      setCursos(Array.isArray(cursosList) ? cursosList : []);
    } catch {
      setCursos([]);
    } finally {
      setIsLoadingCursos(false);
    }

    try {
      const res = await fetch(`/api/ambientes`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.ambientes || []);
      const activos = list.filter((a: any) => a.activo === true);
      setAmbientes(activos);
      if (activos.length > 0) setIdAmbiente(activos[0].id_ambiente.toString());
    } catch {
      setAmbientes([]);
    }
  };

  const filtrarAmbientesPorTipo = (tipoClase: string) => {
    let filtrados: Ambiente[] = [];
    if (tipoClase === "laboratorio") {
      filtrados = ambientes.filter(a => a.tipo === "laboratorio");
    } else if (tipoClase === "practica") {
      filtrados = ambientes.filter(a => a.tipo === "teoria" || a.tipo === "taller");
    } else {
      filtrados = ambientes.filter(a => a.tipo === "teoria");
    }
    setAmbientesFiltrados(filtrados);
    if (filtrados.length > 0) setIdAmbiente(filtrados[0].id_ambiente.toString());
    else setIdAmbiente("");
  };

  const handleCursoChange = async (value: string) => {
    if (!value) {
      setCursoSeleccionado(null);
      setIdGrupo("");
      return;
    }
    const [idStr, tipoClase] = value.split(':');
    const cursoId = parseInt(idStr);
    const curso = cursos.find(c => c.id_curso === cursoId && c.tipo_clase === tipoClase);
    setCursoSeleccionado(curso || null);
    setIdGrupo("");

    filtrarAmbientesPorTipo(tipoClase);

    if (curso?.id_grupo) {
      setIdGrupo(curso.id_grupo.toString());
      setGrupos([]);
    } else if (docenteSeleccionado) {
      try {
        const res = await fetch(
          `/api/docentes/mis-grupos?id_curso=${cursoId}&tipo_clase=${curso?.tipo_clase || ''}&id_periodo=${idPeriodo}&id_docente=${docenteSeleccionado.id_docente}`
        );
        const data = await res.json();
        const list = data.grupos || [];
        setGrupos(list);
        if (list.length > 0) setIdGrupo(list[0].id_grupo.toString());
      } catch {
        setGrupos([]);
      }
    }
  };

  const handleConfirmar = async () => {
    if (!docenteSeleccionado) return;
    setIsConfirming(true);
    setMensaje("");
    try {
      const res = await fetch('/api/horarios/confirmar-seleccion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_periodo: idPeriodo,
          id_docente: docenteSeleccionado.id_docente,
          solo_lectiva: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMensaje(`${t("confirmLectiveSuccess")} ${docenteSeleccionado.nombres} ${docenteSeleccionado.apellidos}`);
        await fetchDocentes();
        setDocenteSeleccionado(null);
        setCursoSeleccionado(null);
        setIdAmbiente("");
        setIdGrupo("");
        setCursos([]);
      } else {
        setMensaje(`Error: ${data.error || t('confirmLectiveError')}`);
      }
    } catch (err: any) {
      setMensaje(`Error: ${err.message}`);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleSaltarIntervalo = async () => {
    setIsSkipping(true);
    setMensaje("");
    try {
      const res = await fetch('/api/secretaria/saltar-intervalo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_periodo: idPeriodo }),
      });
      const data = await res.json();
      if (data.success) {
        setMensaje(t('intervalSkipped'));
        await fetchDocentes();
      } else {
        setMensaje(`Error: ${data.error || t('skipIntervalError')}`);
      }
    } catch (err: any) {
      setMensaje(`Error: ${err.message}`);
    } finally {
      setIsSkipping(false);
    }
  };

  if (!session || !esSecretaria) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const estadosSinDocente = ['completado', 'vencido', 'sin_ventana'];

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {vistaAmbientes && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setVistaAmbientes(false)}
              className="gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("assign")}
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold">
              {vistaAmbientes ? t("environmentAvailability") : t("assignLectiveTitle")}
            </h1>
            <p className="text-muted-foreground text-sm">
              {vistaAmbientes
                ? t("environmentAvailabilitySubtitle")
                : t("assignLectiveSubtitle")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!vistaAmbientes && (
            <Button
              variant={vistaAmbientes ? "default" : "outline"}
              size="sm"
              onClick={() => setVistaAmbientes(true)}
              className="gap-1.5"
            >
              <Building2 className="h-4 w-4" />
              {t("viewEnvironments")}
            </Button>
          )}
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <select
            className="border rounded px-3 py-1.5 text-sm bg-background"
            value={idPeriodo}
            onChange={e => setIdPeriodo(parseInt(e.target.value))}
          >
            {periodos.map(p => (
              <option key={p.id_periodo} value={p.id_periodo}>
                {p.nombre} {p.activo ? '(Activo)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {vistaAmbientes ? (
        <div className="bg-card rounded-xl border border-border p-4">
          <MatrizAmbientesSecretaria
            id_periodo={idPeriodo}
            ambientes={ambientesAll}
          />
        </div>
      ) : (
      <>
      {sinVentanas && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-200">
          {t("noWindowsWarning")}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1 space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                {t("navTeachers")}
                {!isLoadingDocentes && (
                  <Badge variant="outline" className="ml-auto text-xs">
                    {docentes.filter(d => !estadosSinDocente.includes(d.estadoVentana)).length} {t("pending")}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-[70vh] overflow-y-auto">
              {isLoadingDocentes ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : docentes.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4">
                  {t("noTeachersWithLoad")}
                </p>
              ) : sinVentanas ? (
                <div className="p-4 text-sm text-muted-foreground">
                  {t("noWindowsUnavailable")}
                </div>
              ) : (
                <div className="divide-y">
                  {docentes.map((d, idx) => (
                    <button
                      key={d.id_docente}
                      onClick={() => handleSelectDocente(d)}
                      disabled={sinVentanas}
                      className={`w-full text-left px-3 py-2.5 hover:bg-accent transition-colors ${
                        docenteSeleccionado?.id_docente === d.id_docente ? 'bg-accent border-l-2 border-primary' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {idx + 1}. {d.apellidos}, {d.nombres}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {d.categoriaDocente} · {d.condicion}
                          </p>
                          {d.ventana && (
                            <p className="text-xs text-muted-foreground">
                              {d.ventana.hora_inicio} - {d.ventana.hora_fin}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0">
                          <EstadoBadge estado={d.estadoVentana} t={t} />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleSaltarIntervalo}
              disabled={isSkipping || sinVentanas || docentes.filter(d => d.estadoVentana === 'activo').length === 0}
            >
              {isSkipping ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <SkipForward className="h-4 w-4 mr-1" />
              )}
              {t("skipInterval")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={fetchDocentes}
              disabled={isLoadingDocentes}
            >
              <Loader2 className={`h-4 w-4 mr-1 ${isLoadingDocentes ? 'animate-spin' : ''}`} />
              {t("reload")}
            </Button>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {!docenteSeleccionado ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Users className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-lg font-medium">{t("selectTeacher")}</p>
                <p className="text-sm">{t("selectTeacherDesc")}</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">
                        {docenteSeleccionado.apellidos}, {docenteSeleccionado.nombres}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {docenteSeleccionado.categoriaDocente} · {docenteSeleccionado.condicion}
                        {docenteSeleccionado.departamento && ` · ${docenteSeleccionado.departamento}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <EstadoBadge estado={docenteSeleccionado.estadoVentana} t={t} />
                      {docenteSeleccionado.ventana && (
                        <Badge variant="outline" className="text-xs">
                          {docenteSeleccionado.ventana.hora_inicio} - {docenteSeleccionado.ventana.hora_fin}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 mt-4">
                    <div className="flex-1 min-w-[180px]">
                      <label className="text-xs font-medium mb-1 block">{t("course")}</label>
                      <select
                        className="w-full border rounded px-3 py-1.5 text-sm bg-background"
                        value={cursoSeleccionado ? `${cursoSeleccionado.id_curso}:${cursoSeleccionado.tipo_clase}` : ''}
                        onChange={e => handleCursoChange(e.target.value)}
                        disabled={isLoadingCursos}
                      >
                        <option value="">{t("selectCourse")}</option>
                        {cursos.map(c => (
                          <option key={`${c.id_curso}-${c.tipo_clase}`} value={`${c.id_curso}:${c.tipo_clase}`}>
                            {c.nombre} ({c.tipo_clase}) - {c.horas_requeridas}h
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-[140px]">
                      <label className="text-xs font-medium mb-1 block">{t("group")}</label>
                      <select
                        className="w-full border rounded px-3 py-1.5 text-sm bg-background"
                        value={idGrupo}
                        onChange={e => {
                          setIdGrupo(e.target.value);
                          setNumSubgrupos(1);
                          setSubgrupoActivo(1);
                        }}
                        disabled={!cursoSeleccionado}
                      >
                        {grupos.length > 0 ? grupos.map(g => (
                          <option key={g.id_grupo} value={g.id_grupo.toString()}>
                            {(g as any).codigo_grupo || g.nombre || `Grupo ${g.id_grupo}`}
                          </option>
                        )) : cursoSeleccionado?.id_grupo ? (
                          <option value={cursoSeleccionado.id_grupo.toString()}>
                            Grupo {cursoSeleccionado.id_grupo}
                          </option>
                        ) : (
                          <option value="">{t("noGroup")}</option>
                        )}
                      </select>
                    </div>

                    {cursoSeleccionado?.tipo_clase === "laboratorio" && idGrupo && (
                      <div className="w-[220px]">
                        <label className="text-xs font-medium mb-1 block">
                          {t("subgroups")}
                          <span className="text-muted-foreground text-[9px] ml-1">
                            {numSubgrupos > 1 ? `${t("subgroupInterval")}: ${Math.floor(60 / numSubgrupos)}min c/u` : t("fullGroup")}
                          </span>
                        </label>
                        <div className="flex gap-1">
                          <select
                            className="flex-1 border rounded px-2 py-1.5 text-xs bg-background"
                            value={numSubgrupos}
                            onChange={e => {
                              const n = parseInt(e.target.value);
                              setNumSubgrupos(n);
                              if (subgrupoActivo > n) setSubgrupoActivo(1);
                            }}
                          >
                            <option value="1">{t("splitNone")}</option>
                            <option value="2">{t("split2")}</option>
                            <option value="3">{t("split3")}</option>
                            <option value="4">{t("split4")}</option>
                          </select>
                          {numSubgrupos > 1 && (
                            <select
                              className="w-[90px] border rounded px-2 py-1.5 text-xs bg-background"
                              value={subgrupoActivo}
                              onChange={e => setSubgrupoActivo(parseInt(e.target.value))}
                            >
                              {Array.from({ length: numSubgrupos }, (_, i) => i + 1).map(n => (
                                <option key={n} value={n}>{t("subgroup")} {n}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="w-[180px]">
                      <label className="text-xs font-medium mb-1 block">{t("environment")}</label>
                      <select
                        className="w-full border rounded px-3 py-1.5 text-sm bg-background"
                        value={idAmbiente}
                        onChange={e => setIdAmbiente(e.target.value)}
                        disabled={!cursoSeleccionado}
                      >
                        {ambientesFiltrados.length > 0 ? ambientesFiltrados.map(a => (
                          <option key={a.id_ambiente} value={a.id_ambiente.toString()}>
                            {a.nombre} ({a.tipo})
                          </option>
                        )) : (
                          <option value="">{t("noEnvironments")}</option>
                        )}
                      </select>
                      {cursoSeleccionado && ambientesFiltrados.length === 0 && (
                        <p className="text-[9px] text-amber-600 mt-0.5">{t("noEnvironmentsForType")} {cursoSeleccionado.tipo_clase}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  {!cursoSeleccionado ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                      <Calendar className="h-10 w-10 mb-2 opacity-30" />
                      <p className="text-sm">{t("selectCourseForMatrix")}</p>
                    </div>
                  ) : (
                    <MatrizDisponibilidad
                      id_periodo={idPeriodo}
                      id_ambiente={idAmbiente ? parseInt(idAmbiente) : undefined}
                      id_docente_actual={docenteSeleccionado.id_docente}
                      id_curso_actual={cursoSeleccionado.id_curso}
                      id_grupo_actual={idGrupo ? parseInt(idGrupo) : undefined}
                      tipo_clase_actual={cursoSeleccionado.tipo_clase}
                      soloLectura={false}
                      onSelectionChange={fetchDocentes}
                      rol_viewer="secretaria"
                      cursoActivoId={cursoSeleccionado.id_curso}
                      numSubgrupos={numSubgrupos}
                      subgrupoActivo={subgrupoActivo}
                    />
                  )}
                </CardContent>
              </Card>

              <div className="flex items-center gap-3">
                <Button
                  variant="default"
                  size="lg"
                  onClick={handleConfirmar}
                  disabled={isConfirming || !cursoSeleccionado}
                >
                  {isConfirming ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  {t("confirmNext")}
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setDocenteSeleccionado(null);
                    setCursoSeleccionado(null);
                    setIdAmbiente("");
                    setIdGrupo("");
                    setCursos([]);
                    setMensaje("");
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  {t("cancel")}
                </Button>

                {mensaje && (
                  <Badge
                    variant={mensaje.startsWith('Error') ? 'destructive' : 'default'}
                    className="text-xs ml-auto"
                  >
                    {mensaje}
                  </Badge>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      </>
      )}
    </div>
  );
}

function EstadoBadge({ estado, t }: { estado: string; t: (key: "statusActive" | "statusPending" | "statusCompleted" | "statusExpired" | "statusNoWindow" | "statusPaused") => string }) {
  const config: Record<string, { label: string; className: string }> = {
    activo: { label: t('statusActive'), className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    pendiente: { label: t('statusPending'), className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    completado: { label: t('statusCompleted'), className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    vencido: { label: t('statusExpired'), className: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' },
    sin_ventana: { label: t('statusNoWindow'), className: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' },
    pausado: { label: t('statusPaused'), className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  };
  const c = config[estado] || { label: estado, className: 'bg-gray-100 text-gray-500' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.className}`}>
      {estado === 'activo' && <Clock className="h-3 w-3 mr-1" />}
      {estado === 'completado' && <CheckCircle2 className="h-3 w-3 mr-1" />}
      {estado === 'pausado' && <PauseCircle className="h-3 w-3 mr-1" />}
      {c.label}
    </span>
  );
}

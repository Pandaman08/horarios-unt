"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { ColaEspera } from "@/components/horarios/ColaEspera";
import { MatrizDisponibilidad } from "@/components/horarios/MatrizDisponibilidad";
import { ProgresoCursos } from "@/components/horarios/ProgresoCursos";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { toast } from "sonner";

import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

/* =========================
   TYPES
========================= */

interface Periodo {
  id_periodo: number;
  nombre: string;
}

interface Docente {
  id_docente: number;
  nombres: string;
  apellidos: string;
  codigo_docente: string;
  categoria?: string;
  modalidad?: string;
}

interface CursoProgreso {
  id_docente_curso: number;
  id_curso: number;

  nombre: string;
  codigo: string;
  tipo_clase: string;

  horas_requeridas: number;
  horas_asignadas: number;

  curso?: {
    nombre?: string;
    codigo?: string;
  };
}

interface Ambiente {
  id_ambiente: number;
  nombre: string;
  tipo: string;
}

interface Grupo {
  id_grupo: number;
  nombre: string;

  ciclo?: {
    nombre: string;
  };
}

interface CursoSeleccionado {
  id_curso: number;
  tipo_clase: string;
}

/* =========================
   COMPONENTE AUXILIAR
========================= */

function ProgresoGeneral({
  id_periodo,
}: {
  id_periodo: number | null;
}) {
  return (
    <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <Clock className="h-5 w-5 text-primary" />

        <h3 className="font-bold">
          Progreso de Asignación
        </h3>
      </div>

      <p className="text-sm text-muted-foreground">
        Periodo seleccionado:{" "}
        {id_periodo ?? "No seleccionado"}
      </p>
    </div>
  );
}

/* =========================
   PAGE
========================= */

export default function AsignacionOperadorPage() {
  const { data: session, status } =
    useSession();

  const router = useRouter();

  const [periodos, setPeriodos] =
    useState<Periodo[]>([]);

  const [idPeriodo, setIdPeriodo] =
    useState<number | null>(null);

  const [docenteActual, setDocenteActual] =
    useState<Docente | null>(null);

  const [cursosProgreso, setCursosProgreso] =
    useState<CursoProgreso[]>([]);

  const [
    cursoSeleccionado,
    setCursoSeleccionado,
  ] = useState<CursoSeleccionado | null>(
    null
  );

  const [ambientes, setAmbientes] =
    useState<Ambiente[]>([]);

  const [idAmbiente, setIdAmbiente] =
    useState<string>("");

  const [grupos, setGrupos] =
    useState<Grupo[]>([]);

  const [idGrupo, setIdGrupo] =
    useState<string>("");

  const [isConfirming, setIsConfirming] =
    useState(false);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [searchResults, setSearchResults] =
    useState<Docente[]>([]);

  const [isSearching, setIsSearching] =
    useState(false);

  /* =========================
     AUTH
  ========================= */

  useEffect(() => {
    if (status === "authenticated") {
      const userRol = session?.user?.rol;

      if (
        userRol === "administrador_sistema" ||
        userRol === "operador_horarios"
      ) {
        router.push("/dashboard");
      }
    }
  }, [status, session, router]);

  /* =========================
     INIT
  ========================= */

  useEffect(() => {
    fetchPeriodos();
  }, []);

  /* =========================
     SEARCH
  ========================= */

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchTerm.trim()) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchTerm]);

  const handleSearch = async () => {
    setIsSearching(true);

    try {
      const res = await fetch(
        `/api/docentes?search=${encodeURIComponent(
          searchTerm
        )}`
      );

      const data: Docente[] =
        await res.json();

      const filtered = data.filter(
        (d: Docente) =>
          d.nombres
            .toLowerCase()
            .includes(
              searchTerm.toLowerCase()
            ) ||
          d.apellidos
            .toLowerCase()
            .includes(
              searchTerm.toLowerCase()
            ) ||
          d.codigo_docente
            .toLowerCase()
            .includes(
              searchTerm.toLowerCase()
            )
      );

      const resultadosUnicos =
        Array.from(
          new Map(
            filtered.map(
              (d: Docente) => [
                d.id_docente,
                d,
              ]
            )
          ).values()
        ) as Docente[];

      setSearchResults(resultadosUnicos);
    } catch (error: unknown) {
      console.error(
        "Error al buscar docentes:",
        error
      );
    } finally {
      setIsSearching(false);
    }
  };

  /* =========================
     EFFECTS
  ========================= */

  useEffect(() => {
    if (docenteActual && idPeriodo) {
      fetchDocenteCursos();
    }
  }, [docenteActual, idPeriodo]);

  useEffect(() => {
    if (cursoSeleccionado && idPeriodo) {
      fetchGrupos();
      fetchAmbientesValidos();
    }
  }, [cursoSeleccionado, idPeriodo]);

  /* =========================
     FETCHERS
  ========================= */

  const fetchPeriodos = async () => {
    try {
      const res = await fetch(
        "/api/periodos"
      );

      const data: Periodo[] =
        await res.json();

      const periodosUnicos =
        Array.from(
          new Map(
            data.map(
              (p: Periodo) => [
                p.id_periodo,
                p,
              ]
            )
          ).values()
        ) as Periodo[];

      setPeriodos(periodosUnicos);

      if (
        periodosUnicos.length > 0 &&
        !idPeriodo
      ) {
        setIdPeriodo(
          periodosUnicos[0].id_periodo
        );
      }
    } catch (error: unknown) {
      console.error(error);
    }
  };

  const fetchDocenteCursos =
    async (): Promise<void> => {
      if (
        !docenteActual ||
        !idPeriodo
      )
        return;

      try {
        const res = await fetch(
          `/api/docentes/${docenteActual.id_docente}/cursos?id_periodo=${idPeriodo}`
        );

        const data =
          (await res.json()) as CursoProgreso[];

        setCursosProgreso(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (error: unknown) {
        console.error(
          "Error al cargar cursos:",
          error
        );

        toast.error(
          "Error al cargar cursos"
        );
      }
    };

  const fetchAmbientesValidos =
    async (): Promise<void> => {
      if (
        !cursoSeleccionado ||
        !idPeriodo
      )
        return;

      try {
        const res = await fetch(
          `/api/cursos/${cursoSeleccionado.id_curso}/ambientes?id_periodo=${idPeriodo}`
        );

        const data =
          (await res.json()) as Ambiente[];

        setAmbientes(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (error: unknown) {
        console.error(error);

        toast.error(
          "Error al cargar ambientes"
        );
      }
    };

  const fetchGrupos =
    async (): Promise<void> => {
      if (!idPeriodo) return;

      try {
        const res = await fetch(
          `/api/grupos?id_periodo=${idPeriodo}`
        );

        const data =
          (await res.json()) as Grupo[];

        setGrupos(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (error: unknown) {
        console.error(error);

        toast.error(
          "Error al cargar grupos"
        );
      }
    };

  /* =========================
     ACTIONS
  ========================= */

  const handleSeleccionarDocente = (
    docente: Docente
  ) => {
    setDocenteActual(docente);

    setCursoSeleccionado(null);

    setSearchTerm("");

    setSearchResults([]);
  };

  const handleFinalizarAtencion =
    (): void => {
      setDocenteActual(null);

      setCursoSeleccionado(null);

      setIdAmbiente("");

      setIdGrupo("");
    };

  const handleConfirmarAsignacion =
    async (): Promise<void> => {
      if (
        !docenteActual ||
        !idPeriodo
      )
        return;

      setIsConfirming(true);

      try {
        const res = await fetch(
          "/api/horarios/confirmar-seleccion",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              id_periodo: idPeriodo,
              id_docente:
                docenteActual.id_docente,
            }),
          }
        );

        const data: {
          error?: string;
        } = await res.json();

        if (res.ok) {
          toast.success(
            `Horario confirmado para ${docenteActual.nombres}`
          );

          handleFinalizarAtencion();
        } else {
          toast.error(
            data.error ??
              "Error al confirmar"
          );
        }
      } catch (error: unknown) {
        console.error(error);

        toast.error(
          "Error de conexión"
        );
      } finally {
        setIsConfirming(false);
      }
    };

  /* =========================
     LOADING
  ========================= */

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  /* =========================
     JSX
  ========================= */

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-primary" />

          <div>
            <h1 className="text-2xl font-black">
              Atención Manual
            </h1>

            <p className="text-sm text-muted-foreground">
              Gestión de horarios
            </p>
          </div>
        </div>

        <Select
          value={
            idPeriodo
              ? idPeriodo.toString()
              : ""
          }
          onValueChange={(value) =>
            setIdPeriodo(Number(value))
          }
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Periodo" />
          </SelectTrigger>

          <SelectContent>
            {periodos.map((p) => (
              <SelectItem
                key={p.id_periodo}
                value={p.id_periodo.toString()}
              >
                {p.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </header>

      <ProgresoGeneral
        id_periodo={idPeriodo}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="space-y-4">
          <Input
            placeholder="Buscar docente..."
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(
                e.target.value
              )
            }
          />

          {isSearching && (
            <p className="text-sm text-muted-foreground">
              Buscando...
            </p>
          )}

          {searchResults.map((doc) => (
            <Button
              key={doc.id_docente}
              variant="outline"
              className="w-full justify-start"
              onClick={() =>
                handleSeleccionarDocente(
                  doc
                )
              }
            >
              {doc.nombres}{" "}
              {doc.apellidos}
            </Button>
          ))}

          {idPeriodo && (
            <ColaEspera
              id_periodo={idPeriodo}
              onLlamarDocente={
                handleSeleccionarDocente
              }
              docenteActualId={
                docenteActual?.id_docente
              }
            />
          )}
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-2 space-y-6">
          {docenteActual && (
            <>
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-xl font-bold">
                  {docenteActual.nombres}{" "}
                  {
                    docenteActual.apellidos
                  }
                </h2>

                <p className="text-sm text-muted-foreground">
                  {
                    docenteActual.codigo_docente
                  }
                </p>
              </div>

              {idPeriodo && (
                <MatrizDisponibilidad
                  id_periodo={idPeriodo}
                  id_docente_actual={docenteActual.id_docente}
                  id_ambiente={
                    idAmbiente
                      ? Number(idAmbiente)
                      : undefined
                  }
                  id_curso_actual={
                    cursoSeleccionado?.id_curso
                  }
                  id_grupo_actual={
                    idGrupo
                      ? Number(idGrupo)
                      : undefined
                  }
                  tipo_clase_actual={
                    cursoSeleccionado?.tipo_clase
                  }
                />
              )}

              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <h3 className="font-bold">
                  Cursos Asignados
                </h3>

                <ProgresoCursos
                  cursos={cursosProgreso}
                  onSelectCurso={(
                    id_curso: number,
                    tipo: string
                  ) => {
                    setCursoSeleccionado({
                      id_curso,
                      tipo_clase: tipo,
                    });
                  }}
                />
              </div>

              {cursoSeleccionado && (
                <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                  <div className="space-y-2">
                    <Label>
                      Grupo
                    </Label>

                    <Select
                      value={idGrupo}
                      onValueChange={
                        setIdGrupo
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar grupo" />
                      </SelectTrigger>

                      <SelectContent>
                        {grupos.map((g) => (
                          <SelectItem
                            key={
                              g.id_grupo
                            }
                            value={g.id_grupo.toString()}
                          >
                            {g.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Ambiente
                    </Label>

                    <Select
                      value={idAmbiente}
                      onValueChange={
                        setIdAmbiente
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar ambiente" />
                      </SelectTrigger>

                      <SelectContent>
                        {ambientes.map(
                          (a) => (
                            <SelectItem
                              key={
                                a.id_ambiente
                              }
                              value={a.id_ambiente.toString()}
                            >
                              {a.nombre} (
                              {a.tipo})
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={
                    handleConfirmarAsignacion
                  }
                  disabled={
                    isConfirming
                  }
                >
                  <CheckCircle className="h-4 w-4 mr-2" />

                  {isConfirming
                    ? "Guardando..."
                    : "Confirmar"}
                </Button>

                <Button
                  variant="outline"
                  onClick={
                    handleFinalizarAtencion
                  }
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
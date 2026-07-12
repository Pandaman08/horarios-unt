"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLocale } from "@/contexts/LocaleContext";
import { usePeriodo } from "@/contexts/PeriodoContext";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LanguageSelector } from "@/components/layout/LanguageSelector";

import { PeriodoSelector } from "@/components/layout/PeriodoSelector";
import { DepartmentSelector } from "@/components/layout/DepartmentSelector";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  ClipboardList,
  LogOut,
  FileText,
  Menu,
  X,
  ShieldCheck,
  Bell,
  MapPin,
  Layers,
  ChevronDown,
  Search,
  Info,
  Briefcase,
  CheckCircle2,
  GraduationCap,
  Building2,
  Database,
  UserPlus,
} from "lucide-react";

function DashboardLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const { periodoSeleccionado, periodoActivo } = usePeriodo();
  const pathname = usePathname();
  const { t } = useLocale();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [gestionAcademicaOpen, setGestionAcademicaOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [mostrarSeleccionLectiva, setMostrarSeleccionLectiva] = useState(false);

  useEffect(() => {
    const verificarLectivaDeclarada = async () => {
      if (session?.user?.rol !== "docente" || !session?.user?.id_docente) {
        setMostrarSeleccionLectiva(false);
        return;
      }
      const periodoId =
        periodoSeleccionado?.id_periodo ?? periodoActivo?.id_periodo;
      if (!periodoId) {
        setMostrarSeleccionLectiva(false);
        return;
      }
      try {
        const res = await fetch(
          `/api/declaracion-horaria?idDocente=${session.user.id_docente}&idPeriodo=${periodoId}`,
        );
        if (!res.ok) {
          setMostrarSeleccionLectiva(false);
          return;
        }
        const data = await res.json();
        const estadosConLectiva = [
          "LECTIVA_CONFIRMADA",
          "ENVIADO",
          "VALIDADO_DEPARTAMENTO",
          "APROBADO",
          "RECHAZADO",
        ];
        setMostrarSeleccionLectiva(estadosConLectiva.includes(data?.estado));
      } catch {
        setMostrarSeleccionLectiva(false);
      }
    };
    void verificarLectivaDeclarada();
  }, [session?.user?.rol, session?.user?.id_docente, periodoSeleccionado, periodoActivo]);

  const menuItems = useMemo(
    () => [
      {
        title: t("navDashboard"),
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: [
          "administrador_sistema",
          "docente",
          "operador_horarios",
          "director_departamento",
          "decano"
        ],
      },

      {
        isGroup: true,
        title: t("navAcademic"),
        roles: [
          "administrador_sistema",
          "operador_horarios",
          "director_departamento",
          "decano"
        ],
        items: [
          {
            title: "Plan de Estudios",
            href: "/dashboard/plan-estudios",
            icon: GraduationCap,
            roles: ["administrador_sistema", "operador_horarios"],
          },
          {
            title: t("navTeachers"),
            href: "/dashboard/docentes",
            icon: Users,
            roles: ["administrador_sistema", "operador_horarios", "director_departamento", "decano"],
          },
          {
            title: t("navCourses"),
            href: "/dashboard/cursos",
            icon: BookOpen,
            roles: ["administrador_sistema", "operador_horarios", "director_departamento", "decano"],
          },
          {
            title: t("navRooms"),
            href: "/dashboard/ambientes",
            icon: MapPin,
            roles: ["administrador_sistema", "operador_horarios", "director_departamento", "decano"],
          },
          {
            title: t("navCycles"),
            href: "/dashboard/ciclos",
            icon: Layers,
            roles: ["administrador_sistema", "operador_horarios", "director_departamento", "decano"],
          },
          {
            title: t("navPeriods"),
            href: "/dashboard/periodos",
            icon: Calendar,
            roles: ["administrador_sistema", "operador_horarios", "director_departamento", "decano"],
          },
          {
            title: "Grupos",
            href: "/dashboard/grupos",
            icon: Layers,
            roles: ["administrador_sistema", "operador_horarios", "director_departamento", "decano"],
          },
          {
            title: "Facultades",
            href: "/dashboard/facultades",
            icon: Building2,
            roles: ["administrador_sistema"],
          },
          {
            title: "Departamentos Académicos",
            href: "/dashboard/departamentos",
            icon: Users,
            roles: ["administrador_sistema"],
          },
          {
            title: "Escuelas Profesionales",
            href: "/dashboard/escuelas",
            icon: GraduationCap,
            roles: ["administrador_sistema"],
          },
          {
            title: "Personal de Apoyo",
            href: "/dashboard/personal-apoyo",
            icon: UserPlus,
            roles: ["administrador_sistema"],
          },
          {
            title: "Cargos Académicos",
            href: "/dashboard/cargos-academicos-administrativos",
            icon: Briefcase,
            roles: ["administrador_sistema"],
          },
        ],
      },
      {
        title: t("navWindows"),
        href: "/dashboard/ventanas",
        icon: ClipboardList,
        roles: [
          "administrador_sistema",
          "operador_horarios",
        ],
      },
      {
        title: t("navAvailability"),
        href: "/dashboard/disponibilidad",
        icon: ClipboardList,
        roles: [
          "administrador_sistema",
          "operador_horarios",
          "docente",
          "director_departamento",
          "decano"
        ],
      },
      {
        title: "Asignar Cursos",
        href: "/dashboard/asignar-cursos",
        icon: Briefcase,
        roles: ["administrador_sistema", "operador_horarios"],
      },
      {
        title: "Aprobación Carga Horaria",
        href: "/dashboard/aprobacion-carga-horaria",
        icon: CheckCircle2,
        roles: ["administrador_sistema", "operador_horarios"],
      },
      {
        title: "Asignar Carga Lectiva",
        href: "/dashboard/secretaria/asignar-carga-lectiva",
        icon: Calendar,
        roles: ["administrador_sistema", "operador_horarios", "secretaria"],
      },
      {
        title: "Validación Departamento",
        href: "/dashboard/validacion-departamento",
        icon: CheckCircle2,
        roles: ["director_departamento"],
      },
      {
        title: "Consolidación Facultad",
        href: "/dashboard/consolidacion-facultad",
        icon: CheckCircle2,
        roles: ["decano"],
      },
      {
        title: "Carga Horaria",
        href: "/dashboard/carga-horaria",
        icon: Briefcase,
        roles: ["docente", "director_departamento", "decano"],
      },
      {
        title: "Carga Adicional",
        href: "/dashboard/carga-adicional",
        icon: Briefcase,
        roles: ["docente", "director_departamento", "decano"],
      },
      {
        title: "CLAD Departamento",
        href: "/dashboard/clad-departamento",
        icon: CheckCircle2,
        roles: ["director_departamento"],
      },
      {
        title: t("navSchedules"),
        href: "/dashboard/horarios/mi-horario",
        icon: Calendar,
        roles: ["docente", "director_departamento", "decano"],
      },
      {
        title: "Selección Horarios Lectivos",
        href: "/dashboard/horarios/seleccion",
        icon: ClipboardList,
        roles: ["docente"],
        requiresLectivaDeclarada: true,
      },
      {
        title: t("navReports"),
        href: "/dashboard/reportes",
        icon: FileText,
        roles: [
          "administrador_sistema",
          "operador_horarios",
        ],
      },
      {
        title: t("navNotifications"),
        href: "/dashboard/notificaciones",
        icon: Bell,
        roles: [
          "administrador_sistema",
          "operador_horarios",
          "docente",
          "director_departamento",
          "decano"
        ],
      },
      {
        isGroup: true,
        title: t("navConfig"),
        roles: ["administrador_sistema"],
        items: [
          {
            title: t("navUsers"),
            href: "/dashboard/usuarios",
            icon: ShieldCheck,
            roles: ["administrador_sistema"],
          },
          {
            title: "Simulaciones",
            href: "/dashboard/simulaciones",
            icon: Database,
            roles: ["administrador_sistema"],
          },
        ],
      },
    ],
    [t]
  );

  const userRol = session?.user?.rol;

  const filteredMenu = menuItems
    .filter((item) => {
      if (item.roles && (!userRol || !item.roles.includes(userRol))) return false;
      if (
        "requiresLectivaDeclarada" in item &&
        item.requiresLectivaDeclarada &&
        !mostrarSeleccionLectiva
      ) {
        return false;
      }
      return true;
    })
    .map((item) => {
      if (!("isGroup" in item) || !item.items) return item;
      const items = item.items.filter(
        (sub) => !sub.roles || (userRol && sub.roles.includes(userRol))
      );
      return items.length > 0 ? { ...item, items } : null;
    })
    .filter((item): item is (typeof menuItems)[number] => item !== null);

  const matchesSearch = (text: string) =>
    !searchQuery.trim() ||
    text.toLowerCase().includes(searchQuery.toLowerCase().trim());

  const filteredBySearch = filteredMenu
    .map((item) => {
      if ("isGroup" in item && item.isGroup && item.items) {
        const items = item.items.filter((sub) => matchesSearch(sub.title));
        if (!matchesSearch(item.title) && items.length === 0) return null;
        return {
          ...item,
          items: matchesSearch(item.title) ? item.items : items,
        };
      }
      if (!matchesSearch(item.title)) return null;
      return item;
    })
    .filter(Boolean) as typeof filteredMenu;

  const displayMenu = searchQuery.trim() ? filteredBySearch : filteredMenu;

  const isLinkActive = (href: string) => pathname === href;

  const initials =
    session?.user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-muted/40 text-foreground flex overflow-x-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-56 lg:w-60 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-200 ease-out shadow-lg",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Perfil */}
        <div className="px-4 pt-5 pb-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">
                @{session?.user?.email?.split("@")[0] || "usuario"}
              </p>
              <p className="text-sm text-sidebar-foreground/60 truncate capitalize">
                {userRol?.replace(/_/g, " ") || t("role")}
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto scrollbar-thin">
          {displayMenu.length === 0 && searchQuery.trim() && (
            <p className="px-3 py-2 text-xs text-sidebar-foreground/50">
              Sin resultados
            </p>
          )}
          {displayMenu.map((item: (typeof menuItems)[number], idx: number) => {
            if ("isGroup" in item && item.isGroup) {
              const isGestion = item.title === t("navAcademic");
              const isOpen = isGestion ? gestionAcademicaOpen : true;
              return (
                <div key={idx} className="pt-1 first:pt-0">
                  <button
                    type="button"
                    onClick={() =>
                      isGestion && setGestionAcademicaOpen(!gestionAcademicaOpen)
                    }
                    className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-sidebar-foreground/45 uppercase tracking-wider hover:text-sidebar-foreground/70"
                  >
                    <span>{item.title}</span>
                    {isGestion && (
                      <ChevronDown
                        className={cn(
                          "h-3 w-3 transition-transform",
                          !isOpen && "-rotate-90"
                        )}
                      />
                    )}
                  </button>
                  {isOpen &&
                    item.items?.map((sub) => {
                      const isActive = isLinkActive(sub.href);
                      const SubIcon = sub.icon as React.ComponentType<{ className?: string }>;
                      return (
                        <Link
                          key={sub.title}
                          href={sub.href}
                          className={cn(
                            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground font-medium"
                              : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          )}
                        >
                          <SubIcon className="h-4 w-4 shrink-0 opacity-80" />
                          <span className="truncate">{sub.title}</span>
                        </Link>
                      );
                    })}
                </div>
              );
            }

            const isActive = item.href ? isLinkActive(item.href) : false;
            const ItemIcon = item.icon as React.ComponentType<{ className?: string }>;
            return (
              <Link
                key={item.title}
                href={item.href!}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <ItemIcon className="h-4 w-4 shrink-0 opacity-80" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2 text-sm text-sidebar-foreground/50">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>{t("online")}</span>
          </div>
        </div>
      </aside>

      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden lg:pl-56 xl:pl-60">
        <header className="min-h-12 bg-card border-b border-border flex items-center gap-2 px-3 sm:px-4 sticky top-0 z-20 flex-wrap">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="p-1.5 text-muted-foreground hover:text-foreground lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 min-w-0 shrink-0">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <LayoutDashboard className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block min-w-0">
              <p className="text-sm font-semibold leading-none truncate">
                {t("appName")}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {t("appSubtitle")}
              </p>
            </div>
          </div>

          <div className="hidden sm:block flex-1 min-w-0 max-w-md mx-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("search")}
                className="w-full h-8 pl-8 pr-3 text-xs bg-primary text-primary-foreground placeholder:text-primary-foreground/70 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-primary-foreground/70 hover:text-primary-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {userRol !== 'docente' && (
            <div className="hidden xl:flex items-center gap-2">
              <DepartmentSelector />
              <PeriodoSelector />
            </div>
          )}

          <div className="flex items-center gap-1 shrink-0 ml-auto">
            <ThemeToggle />
            <LanguageSelector />
            <Link
              href="/dashboard/notificaciones"
              className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative"
              title={t("notifications")}
            >
              <Bell className="h-3.5 w-3.5" />
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 h-8 pl-1 pr-2 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="h-6 w-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold uppercase">
                  {initials}
                </div>
                <ChevronDown
                  className={cn(
                    "h-3 w-3 text-muted-foreground transition-transform hidden sm:block",
                    userDropdownOpen && "rotate-180"
                  )}
                />
              </button>

              {userDropdownOpen && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-30"
                    onClick={() => setUserDropdownOpen(false)}
                    aria-hidden
                  />
                  <div className="absolute right-0 mt-1 w-44 py-1 bg-popover border border-border rounded-lg shadow-lg z-40 text-xs">
                    <div className="px-3 py-2 border-b border-border">
                      <p className="font-semibold truncate">
                        {session?.user?.name}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {userRol?.replace(/_/g, " ")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        signOut({ callbackUrl: "/auth/login" })
                      }
                      className="w-full text-left px-3 py-2 hover:bg-destructive/10 text-destructive font-medium flex items-center gap-2"
                    >
                      <LogOut className="h-3 w-3" />
                      {t("logout")}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>



        <main className="flex-1 p-3 sm:p-4 lg:p-5 xl:p-6 min-w-0 min-h-0 overflow-x-hidden overflow-y-auto overscroll-contain">
          <div className="w-full max-w-full mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-muted/40 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </Suspense>
  );
}
